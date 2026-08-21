// HtmlRenderer.js
/**
 * Visitor básico que renderiza um SwaggerDocument em HTML.
 * Cada visitXxx retorna uma string HTML; o pai concatena os filhos.
 * Sem CSS/framework — só estrutura semântica, pra você estilizar depois.
 */
class HtmlRenderer extends SwaggerVisitor {
  constructor() {
    super();
    this.registry = null; // setado em visitDocument, necessário pra resolver $ref
  }

  visitDocument(doc) {
    this.registry = doc.registry;

    const pathsHtml = [...doc.paths.values()].map((p) => p.accept(this)).join('\n');

    const definitionsHtml = [...doc.registry.schemas.entries()]
      .map(([name, schema]) => this._renderNamedSchema(name, schema))
      .join('\n');

    return `
<div class="swagger-doc">
  <header>
    <h1>${this._esc(doc.info.title)}</h1>
    <p class="version">v${this._esc(doc.info.version)}</p>
    ${doc.info.description ? `<div class="description">${mdToHtml(doc.info.description)}</div>` : ''}
  </header>

  <section class="paths">
    <h2>Endpoints</h2>
    ${pathsHtml}
  </section>

  <section class="definitions">
    <h2>Definitions</h2>
    ${definitionsHtml}
  </section>
</div>`.trim();
  }

  visitPathItem(pathItem) {
    const opsHtml = [...pathItem.operations.values()].map((op) => op.accept(this)).join('\n');
    return `
<div class="path-item">
  <h3 class="path">${this._esc(pathItem.path)}</h3>
  ${opsHtml}
</div>`.trim();
  }

  visitOperation(op) {
    const paramsHtml = op.parameters.length
      ? `<table class="parameters">
          <thead><tr><th>Nome</th><th>Em</th><th>Obrigatório</th><th>Descrição</th></tr></thead>
          <tbody>${op.parameters.map((p) => p.accept(this)).join('\n')}</tbody>
        </table>`
      : '<p class="no-params">Sem parâmetros</p>';

    const responsesHtml = [...op.responses.values()].map((r) => r.accept(this)).join('\n');

    return `
<div class="operation operation-${this._esc(op.method)}">
  <h4><span class="method">${op.method.toUpperCase()}</span> ${this._esc(op.operationId || '')}</h4>
  ${op.summary ? `<p class="summary">${this._esc(op.summary)}</p>` : ''}
  ${op.description ? `<div class="description">${mdToHtml(op.description)}</div>` : ''}
  ${paramsHtml}
  <div class="responses">${responsesHtml}</div>
</div>`.trim();
  }

  visitParameter(param) {
    const type = param.schema ? '(ver schema)' : param.type || '';
    return `<tr>
      <td>${this._esc(param.name)}</td>
      <td>${this._esc(param.in)}</td>
      <td>${param.required ? 'sim' : 'não'}</td>
      <td>${mdInline(param.description) || this._esc(type)}</td>
    </tr>`;
  }

  visitResponse(response) {
    return `
<div class="response">
  <strong>${this._esc(response.statusCode)}</strong> — ${mdInline(response.description || '')}
  ${response.schema ? `<div class="response-schema">${response.schema.accept(this)}</div>` : ''}
</div>`.trim();
  }

  /**
   * Ponto de entrada do visitor pra schemas. Resolve $ref/allOf recursivamente (via _expand)
   * mas RENDERIZA como uma única tabela plana — sem <table> aninhada. Cada linha carrega
   * sua profundidade (depth), usada só pra indentação visual da célula "Atributo".
   * Anexa uma segunda tabela de valores de exemplo logo abaixo.
   */
  visitSchema(schema) {
    const expanded = this._expand(schema, new Set());
    const topVisited = expanded.refName ? new Set().add(expanded.refName) : new Set();

    let properties = null;
    let required = null;
    let visited = topVisited;

    if (expanded.kind === 'object') {
      properties = expanded.properties;
      required = expanded.required;
    } else if (expanded.kind === 'array') {
      // schema raiz é um array: acha as propriedades do item e já começa listando-as
      const itemExpanded = this._expand(expanded.items, topVisited);
      const itemDesc = this._describe(itemExpanded, topVisited);
      if (itemDesc.next) {
        properties = itemDesc.next.properties;
        required = itemDesc.next.required;
        visited = itemDesc.next.visited;
      } else {
        return itemDesc.label; // array de primitivo na raiz, não tem o que tabelar
      }
    } else {
      return expanded.label || ''; // primitivo/ciclo direto na raiz — não é tabelável
    }

    const rows = [];
    this._collectRows(properties, required, 0, visited, rows);

    if (!rows.length) return '<p class="empty-schema">Sem propriedades</p>';

    const rowsHtml = rows
      .map(
        (r) => `<tr>
          <td style="padding-left: ${r.depth * 20}px"><code>${this._esc(r.name)}</code>${r.required ? ' <span class="required">*</span>' : ''}</td>
          <td class="type-cell">${r.type}</td>
          <td>${r.description}</td>
        </tr>`
      )
      .join('\n');

    const schemaTable = `
<table class="schema-table">
  <thead><tr><th>Atributo</th><th>Tipo</th><th>Descrição</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>`.trim();

    const exampleRows = [];
    this._collectExampleRows(properties, required, 0, visited, exampleRows);
    const exampleTable = exampleRows.length
      ? `
<table class="example-table">
  <caption>Exemplo</caption>
  <thead><tr><th>Atributo</th><th>Valor de exemplo</th></tr></thead>
  <tbody>${exampleRows
    .map(
      (r) => `<tr>
          <td style="padding-left: ${r.depth * 20}px"><code>${this._esc(r.name)}</code></td>
          <td class="value-cell">${r.value}</td>
        </tr>`
    )
    .join('\n')}</tbody>
</table>`.trim()
      : '';

    return `${schemaTable}\n${exampleTable}`;
  }

  /**
   * Resolve um schema até sua forma "achatada": segue $ref e faz merge de allOf.
   * `visited` guarda nomes de $ref já em resolução NESTE CAMINHO (não globalmente),
   * então o mesmo ref reutilizado em ramos irmãos continua expandindo normalmente —
   * só um ciclo real (A -> B -> A) é interrompido.
   *
   * Retorna um de:
   *   { kind: 'object', properties: Map, required: string[], description }
   *   { kind: 'array', items: Schema, description }
   *   { kind: 'primitive', label, description, schema } — `schema` é a instância real
   *     (pós-resolução de $ref), usada depois pra gerar valor de exemplo.
   *   { kind: 'cycle', refName }
   */
  _expand(schema, visited) {
    if (!schema) return { kind: 'primitive', label: 'any', description: null, schema: null };

    if (schema.isReference()) {
      const refName = schema.ref.replace('#/definitions/', '');
      if (visited.has(refName)) {
        return { kind: 'cycle', refName };
      }
      const target = this.registry ? this.registry.resolveRef(schema.ref) : null;
      if (!target) {
        return {
          kind: 'primitive',
          label: `${this._esc(refName)} (não encontrado)`,
          description: null,
          schema: null,
        };
      }
      const nextVisited = new Set(visited).add(refName);
      const inner = this._expand(target, nextVisited);
      return { ...inner, refName }; // guarda refName pra âncora/rótulo
    }

    if (schema.allOf && schema.allOf.length) {
      const properties = new Map(schema.properties);
      const required = [...schema.required];
      for (const member of schema.allOf) {
        const memberExpanded = this._expand(member, visited);
        if (memberExpanded.kind === 'object') {
          for (const [k, v] of memberExpanded.properties) properties.set(k, v);
          required.push(...memberExpanded.required);
        }
      }
      return { kind: 'object', properties, required, description: schema.description };
    }

    if (schema.isArray()) {
      return { kind: 'array', items: schema.items, description: schema.description };
    }

    if (schema.isObject()) {
      return {
        kind: 'object',
        properties: schema.properties,
        required: schema.required,
        description: schema.description,
      };
    }

    return {
      kind: 'primitive',
      label: `${this._esc(schema.type || 'any')}${schema.format ? ` (${this._esc(schema.format)})` : ''}`,
      description: schema.description,
      schema,
    };
  }

  /**
   * Anda recursivamente pelas propriedades empurrando uma linha PLANA por atributo em `rows`
   * (mutação de array, sem retorno). `depth` cresce a cada nível pra indentar na renderização.
   * Filhos de objeto/array-de-objeto entram logo em seguida com depth+1 — nunca em tabela própria.
   */
  _collectRows(properties, required, depth, visited, rows) {
    for (const [name, propSchema] of properties) {
      const isRequired = required.includes(name);
      const expanded = this._expand(propSchema, visited);
      const desc = this._describe(expanded, visited);

      rows.push({
        depth,
        name,
        required: isRequired,
        type: desc.type,
        description: this._buildDescriptionCell(propSchema, desc, expanded),
      });

      if (desc.next) {
        this._collectRows(desc.next.properties, desc.next.required, depth + 1, desc.next.visited, rows);
      }
    }
  }

  /**
   * Monta o HTML da célula "Descrição": prioriza a description inline da própria
   * propriedade; senão usa a do schema resolvido (com o link de $ref embutido,
   * formato "Nome: descrição"); senão a description "crua" do _expand.
   * Todo texto passa por mdInline (markdown inline, sem <p>/<ul> — estamos numa <td>).
   */
  _buildDescriptionCell(propSchema, desc, expanded) {
    if (propSchema.description) return mdInline(propSchema.description);

    if (desc.refName) {
      const link = `<a href="#def-${this._esc(desc.refName)}" class="schema-ref">${this._esc(desc.refName)}</a>`;
      return desc.description ? `${link}: ${mdInline(desc.description)}` : link;
    }

    if (desc.description) return mdInline(desc.description);
    if (expanded.description) return mdInline(expanded.description);
    return '';
  }

  /**
   * Descreve um schema já _expand()'ido: rótulo de TIPO LIMPO pra célula "Tipo"
   * (sem link — "object", "array<object>", "string", etc.), a description e o
   * refName (se veio de $ref, direto ou dentro de array) pra quem for montar a
   * célula "Descrição" separadamente, e — se aplicável — os dados pra continuar
   * a recursão (`next`).
   */
  _describe(expanded, visited) {
    if (expanded.kind === 'primitive') {
      return { type: expanded.label, description: expanded.description, refName: null, next: null };
    }

    if (expanded.kind === 'cycle') {
      return {
        type: 'object (recursivo)',
        description: '(referência circular — ver definição acima)',
        refName: expanded.refName,
        next: null,
      };
    }

    if (expanded.kind === 'object') {
      const nextVisited = expanded.refName ? new Set(visited).add(expanded.refName) : visited;
      return {
        type: 'object',
        description: expanded.description,
        refName: expanded.refName || null,
        next: { properties: expanded.properties, required: expanded.required, visited: nextVisited },
      };
    }

    // array: descreve o item recursivamente pra compor "array<X>" e repassar description/refName/filhos.
    // Prioriza a description do próprio array; se não houver, cai pra a do item (a útil geralmente
    // mora na definition referenciada pelo $ref do item, não no array em si).
    const itemVisited = expanded.refName ? new Set(visited).add(expanded.refName) : visited;
    const itemExpanded = this._expand(expanded.items, itemVisited);
    const itemDesc = this._describe(itemExpanded, itemVisited);
    return {
      type: `array&lt;${itemDesc.type}&gt;`,
      description: expanded.description || itemDesc.description,
      refName: itemDesc.refName,
      next: itemDesc.next, // filhos do item (se houver) entram no mesmo nível, sem linha intermediária
    };
  }

  // ---------- Tabela de exemplo ----------

  /**
   * Mesma travessia de _collectRows, mas ao invés de tipo/descrição, calcula um
   * VALOR de exemplo por linha folha (usa Schema.example se existir, senão enum,
   * senão gera algo aleatório compatível com o tipo). Containers (object/array-
   * de-objeto) ficam com valor vazio — o valor real aparece nas linhas filhas.
   */
  _collectExampleRows(properties, required, depth, visited, rows) {
    for (const [name, propSchema] of properties) {
      const expanded = this._expand(propSchema, visited);

      if (expanded.kind === 'primitive') {
        rows.push({ depth, name, value: this._formatExampleValue(this._generateExampleValue(expanded.schema)) });
        continue;
      }

      if (expanded.kind === 'cycle') {
        rows.push({ depth, name, value: '<em>(circular)</em>' });
        continue;
      }

      if (expanded.kind === 'object') {
        rows.push({ depth, name, value: '' });
        const nextVisited = expanded.refName ? new Set(visited).add(expanded.refName) : visited;
        this._collectExampleRows(expanded.properties, expanded.required, depth + 1, nextVisited, rows);
        continue;
      }

      // array
      const itemVisited = expanded.refName ? new Set(visited).add(expanded.refName) : visited;
      const itemExpanded = this._expand(expanded.items, itemVisited);

      if (itemExpanded.kind === 'primitive') {
        const val = this._generateExampleValue(itemExpanded.schema);
        rows.push({ depth, name, value: `[ ${this._formatExampleValue(val)} ]` });
      } else if (itemExpanded.kind === 'object') {
        rows.push({ depth, name, value: '' });
        const nextVisited = itemExpanded.refName ? new Set(itemVisited).add(itemExpanded.refName) : itemVisited;
        this._collectExampleRows(itemExpanded.properties, itemExpanded.required, depth + 1, nextVisited, rows);
      } else {
        rows.push({ depth, name, value: '<em>(circular)</em>' });
      }
    }
  }

  /**
   * Gera o valor pra uma propriedade folha: `.example` do schema tem prioridade,
   * depois enum (item aleatório), depois um valor aleatório plausível pro tipo/format.
   */
  _generateExampleValue(schema) {
    if (!schema) return null;
    if (schema.example !== undefined && schema.example !== null) return schema.example;

    if (schema.enumValues && schema.enumValues.length) {
      return schema.enumValues[Math.floor(Math.random() * schema.enumValues.length)];
    }

    switch (schema.type) {
      case 'integer':
        return Math.floor(Math.random() * 1000);
      case 'number':
        return parseFloat((Math.random() * 1000).toFixed(2));
      case 'boolean':
        return Math.random() < 0.5;
      case 'string':
        if (schema.format === 'date') return '2024-01-01';
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'email') return 'usuario@exemplo.com';
        if (schema.format === 'uuid') return '3fa85f64-5717-4562-b3fc-2c963f66afa6';
        return 'string';
      default:
        return null;
    }
  }

  _formatExampleValue(value) {
    if (value === null || value === undefined) return '<span class="value-null">null</span>';
    if (typeof value === 'string') return `"${this._esc(value)}"`;
    return this._esc(String(value));
  }

  // ---------- Helpers gerais ----------

  /** Não faz parte do visitor formal (Schema nomeado não tem seu próprio "visit"),
   *  mas precisamos de um id de âncora pra linkar os $ref. Helper local. */
  _renderNamedSchema(name, schema) {
    return `
<div class="definition" id="def-${this._esc(name)}">
  <h3>${this._esc(name)}</h3>
  ${schema.description ? `<div class="description">${mdToHtml(schema.description)}</div>` : ''}
  ${schema.accept(this)}
</div>`.trim();
  }

  _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}