// SchemaRegistry.js
// Mantém todos os schemas de #/definitions e resolve $ref internos com cache + guarda de ciclo.

class SchemaRegistry {
  constructor() {
    /** @type {Map<string, Schema>} */
    this.schemas = new Map();
    this._resolving = new Set(); // guarda contra recursão infinita em resolve()
  }

  register(name, schema) {
    this.schemas.set(name, schema);
  }

  get(name) {
    return this.schemas.get(name);
  }

  /**
   * Resolve um $ref no formato "#/definitions/Nome".
   * Retorna null se não encontrado (não lança — quem chama decide o que fazer).
   */
  resolveRef(ref) {
    if (!ref || !ref.startsWith('#/definitions/')) return null;
    const name = ref.replace('#/definitions/', '');
    return this.schemas.get(name) || null;
  }

  /**
   * Protege contra ciclo: usado internamente por Schema.resolve()
   */
  enterResolution(name) {
    if (this._resolving.has(name)) return false; // ciclo detectado
    this._resolving.add(name);
    return true;
  }

  exitResolution(name) {
    this._resolving.delete(name);
  }
}

// Schema.js
// Representa um schema Swagger 2.0 (JSON Schema subset). Suporta $ref, allOf, items, properties.

class Schema {
  constructor({
    name = null,
    ref = null,
    type = null,
    format = null,
    properties = new Map(),
    items = null,
    allOf = [],
    required = [],
    enumValues = null,
    additionalProperties = null,
    description = null,
    raw = null,
  } = {}) {
    this.name = name;
    this.ref = ref; // string "#/definitions/X" se este nó for um $ref puro
    this.type = type;
    this.format = format;
    this.properties = properties; // Map<string, Schema>
    this.items = items; // Schema | null (para type=array)
    this.allOf = allOf; // Schema[]
    this.required = required; // string[]
    this.enumValues = enumValues;
    this.additionalProperties = additionalProperties; // Schema | boolean | null
    this.description = description;
    this.raw = raw; // json original, útil pro renderer

    this._resolvedCache = null;
  }

  static fromJSON(json, registry, name = null) {
    if (!json) return null;

    if (json.$ref) {
      return new Schema({ name, ref: json.$ref, raw: json });
    }

    const properties = new Map();
    if (json.properties) {
      for (const [propName, propJson] of Object.entries(json.properties)) {
        properties.set(propName, Schema.fromJSON(propJson, registry, propName));
      }
    }

    const allOf = Array.isArray(json.allOf)
      ? json.allOf.map((s) => Schema.fromJSON(s, registry))
      : [];

    const items = json.items ? Schema.fromJSON(json.items, registry) : null;

    let additionalProperties = null;
    if (typeof json.additionalProperties === 'object' && json.additionalProperties !== null) {
      additionalProperties = Schema.fromJSON(json.additionalProperties, registry);
    } else if (typeof json.additionalProperties === 'boolean') {
      additionalProperties = json.additionalProperties;
    }

    return new Schema({
      name,
      type: json.type || (allOf.length ? 'object' : null),
      format: json.format || null,
      properties,
      items,
      allOf,
      required: json.required || [],
      enumValues: json.enum || null,
      additionalProperties,
      description: json.description || null,
      raw: json,
    });
  }

  /**
   * Resolve este schema caso seja um $ref, seguindo a cadeia até achar o schema real.
   * Protegido contra ciclos: se detectar, retorna a si mesmo (não resolvido) em vez de estourar stack.
   */
  resolve(registry) {
    if (!this.ref) return this;
    if (this._resolvedCache) return this._resolvedCache;

    const refName = this.ref.replace('#/definitions/', '');
    if (!registry.enterResolution(refName)) {
      // ciclo detectado — retorna placeholder não resolvido, o renderer decide como tratar
      return this;
    }

    const target = registry.resolveRef(this.ref);
    registry.exitResolution(refName);

    if (!target) return this; // ref quebrado
    this._resolvedCache = target;
    return target;
  }

  isReference() {
    return this.ref !== null;
  }

  isObject() {
    return this.type === 'object' || this.properties.size > 0 || this.allOf.length > 0;
  }

  isArray() {
    return this.type === 'array';
  }

  isPrimitive() {
    return ['string', 'number', 'integer', 'boolean'].includes(this.type);
  }

  accept(visitor) {
    return visitor.visitSchema(this);
  }
}

// Parameter.js
class Parameter {
  constructor({ name, in: location, description, required = false }) {
    this.name = name;
    this.in = location; // query|header|path|formData|body
    this.description = description || null;
    this.required = required;
  }

  static create(json, registry) {
    if (!json) return null;
    if (json.in === 'body') return BodyParameter.fromJSON(json, registry);
    return NonBodyParameter.fromJSON(json, registry);
  }

  accept(visitor) {
    return visitor.visitParameter(this);
  }
}

class BodyParameter extends Parameter {
  constructor(base, schema) {
    super(base);
    this.schema = schema; // Schema
  }

  static fromJSON(json, registry) {
    const schema = Schema.fromJSON(json.schema, registry);
    return new BodyParameter(json, schema);
  }
}

class NonBodyParameter extends Parameter {
  constructor(base) {
    super(base);
    this.type = base.type || null;
    this.format = base.format || null;
    this.items = base.items || null; // raw, simples o suficiente pra maioria dos casos
    this.enumValues = base.enum || null;
    this.default = base.default ?? null;
  }

  static fromJSON(json) {
    return new NonBodyParameter(json);
  }
}

// Operation.js
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

class Response {
  constructor({ statusCode, description, schema, headers }) {
    this.statusCode = statusCode;
    this.description = description || null;
    this.schema = schema; // Schema | null
    this.headers = headers || null;
  }

  static fromJSON(statusCode, json, registry) {
    const schema = json.schema ? Schema.fromJSON(json.schema, registry) : null;
    return new Response({
      statusCode,
      description: json.description,
      schema,
      headers: json.headers || null,
    });
  }

  accept(visitor) {
    return visitor.visitResponse(this);
  }
}

class Operation {
  constructor({ method, operationId, summary, description, tags, parameters, responses, consumes, produces }) {
    this.method = method;
    this.operationId = operationId || null;
    this.summary = summary || null;
    this.description = description || null;
    this.tags = tags || [];
    this.parameters = parameters; // Parameter[]
    this.responses = responses; // Map<string, Response>
    this.consumes = consumes || [];
    this.produces = produces || [];
  }

  static fromJSON(method, json, registry) {
    const parameters = (json.parameters || []).map((p) => Parameter.create(p, registry));

    const responses = new Map();
    for (const [statusCode, respJson] of Object.entries(json.responses || {})) {
      responses.set(statusCode, Response.fromJSON(statusCode, respJson, registry));
    }

    return new Operation({
      method,
      operationId: json.operationId,
      summary: json.summary,
      description: json.description,
      tags: json.tags,
      parameters,
      responses,
      consumes: json.consumes,
      produces: json.produces,
    });
  }

  accept(visitor) {
    return visitor.visitOperation(this);
  }
}

class PathItem {
  constructor(path, operations) {
    this.path = path;
    this.operations = operations; // Map<method, Operation>
  }

  static fromJSON(path, json, registry) {
    const operations = new Map();
    for (const method of HTTP_METHODS) {
      if (json[method]) {
        operations.set(method, Operation.fromJSON(method, json[method], registry));
      }
    }
    return new PathItem(path, operations);
  }

  accept(visitor) {
    return visitor.visitPathItem(this);
  }
}

// SwaggerDocument.js
class Info {
  constructor(json = {}) {
    this.title = json.title || null;
    this.description = json.description || null;
    this.version = json.version || null;
  }
}

class SwaggerDocument {
  constructor() {
    this.swaggerVersion = null;
    this.info = null;
    this.host = null;
    this.basePath = null;
    this.schemes = [];
    this.consumes = [];
    this.produces = [];
    this.registry = new SchemaRegistry();
    this.paths = new Map(); // Map<string, PathItem>
    this.tags = [];
  }

  /**
   * Parse principal. Two-pass:
   *  1) registra definitions no SchemaRegistry (sem resolver refs ainda)
   *  2) parseia paths/operations, que já podem referenciar o registry
   */
  static parse(json) {
    if (json.swagger !== '2.0') {
      throw new Error(`Versão não suportada: esperado swagger 2.0, recebido "${json.swagger}"`);
    }

    const doc = new SwaggerDocument();
    doc.swaggerVersion = json.swagger;
    doc.info = new Info(json.info);
    doc.host = json.host || null;
    doc.basePath = json.basePath || null;
    doc.schemes = json.schemes || [];
    doc.consumes = json.consumes || [];
    doc.produces = json.produces || [];
    doc.tags = json.tags || [];

    // Pass 1: registra todos os schemas de definitions (shallow parse, refs internos ficam como Schema.ref)
    for (const [name, schemaJson] of Object.entries(json.definitions || {})) {
      doc.registry.register(name, Schema.fromJSON(schemaJson, doc.registry, name));
    }

    // Pass 2: paths, agora com registry populado para resolver $ref sob demanda
    for (const [path, pathJson] of Object.entries(json.paths || {})) {
      doc.paths.set(path, PathItem.fromJSON(path, pathJson, doc.registry));
    }

    return doc;
  }

  accept(visitor) {
    return visitor.visitDocument(this);
  }
}

// index.js — ponto de entrada público
/**
 * Visitor base — o renderer HTML deve estender esta classe.
 * Cada visitXxx recebe a instância e deve retornar o que o visitor quiser (ex: string HTML).
 */
class SwaggerVisitor {
  visitDocument(doc) { throw new Error('visitDocument não implementado'); }
  visitPathItem(pathItem) { throw new Error('visitPathItem não implementado'); }
  visitOperation(operation) { throw new Error('visitOperation não implementado'); }
  visitParameter(parameter) { throw new Error('visitParameter não implementado'); }
  visitResponse(response) { throw new Error('visitResponse não implementado'); }
  visitSchema(schema) { throw new Error('visitSchema não implementado'); }
}