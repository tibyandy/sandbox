#!/usr/bin/env node
/**
 * 04-imageurls.js
 *
 * Lê os JSONs de um diretório de páginas de bookmarks (gerado pela Parte 1),
 * extrai as URLs de imagem (work.url) de todos os works ÚNICOS (por id) e baixa
 * essas imagens.
 *
 * Processamento SEQUENCIAL entre arquivos de origem (um arquivo por vez, na ordem
 * de offset), mas PARALELIZÁVEL (pool de N downloads simultâneos) dentro de cada
 * arquivo.
 *
 * Falhas de download não têm retry imediato: ficam acumuladas e, ao final de todo
 * o processamento, é feita UMA única tentativa extra para cada uma. As que
 * continuarem falhando são registradas em um arquivo de log.
 *
 * Uso:
 *   node 04-imageurls.js <diretorio_pages> [concorrencia] [limite]
 *   node 04-imageurls.js <diretorio_pages> [param_unico]
 *
 * Regra do parâmetro único (quando só um dos opcionais é informado):
 *   - valor < 10  => é a CONCORRÊNCIA (limite de imagens = todas)
 *   - valor >= 10 => é o LIMITE de imagens (concorrência = default 4)
 *
 * Exemplos:
 *   node 04-imageurls.js data/pages/5986322/20260923 5 100   -> 100 imagens, 5 por vez
 *   node 04-imageurls.js data/pages/5986322/20260923 50      -> 50 imagens, 4 por vez
 *   node 04-imageurls.js data/pages/5986322/20260923 7       -> todas as imagens, 7 por vez
 *
 * Destino: data/thumbs/{id_mod_100}/{id}-{nomeArquivoOriginalDaUrl}
 * Em caso de colisão de nome já existente em disco: prefixo "dup_" e sufixo
 * "_{timestamp_execucao}" antes da extensão.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CONCURRENCY = 4;
const SINGLE_PARAM_THRESHOLD = 10;

// Timestamp da execução no formato YYYYMMDD_HHMMSS
function timestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function buildImageHeaders() {
  return {
    accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
    priority: 'i',
    referer: 'https://www.pixiv.net/',
    'sec-ch-ua': '"Brave";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'image',
    'sec-fetch-mode': 'no-cors',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-storage-access': 'active',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
  };
}

// Parseia os argumentos de linha de comando (concorrência / limite).
function parseArgs(argv) {
  const inputDir = argv[2];
  const rawA = argv[3];
  const rawB = argv[4];

  if (!inputDir) {
    console.error('Uso: node 04-imageurls.js <diretorio_pages> [concorrencia] [limite]');
    process.exit(1);
  }

  let concurrency = DEFAULT_CONCURRENCY;
  let limit = Infinity;

  if (rawA !== undefined && rawB !== undefined) {
    // Dois parâmetros: primeiro é concorrência, segundo é limite.
    concurrency = parseInt(rawA, 10);
    limit = parseInt(rawB, 10);
  } else if (rawA !== undefined) {
    // Um único parâmetro: decide pelo valor.
    const val = parseInt(rawA, 10);
    if (Number.isNaN(val)) {
      console.error(`Parâmetro inválido: ${rawA}`);
      process.exit(1);
    }
    if (val < SINGLE_PARAM_THRESHOLD) {
      concurrency = val;
    } else {
      limit = val;
    }
  }

  if (Number.isNaN(concurrency) || concurrency < 1) {
    console.error(`Concorrência inválida: ${rawA}`);
    process.exit(1);
  }
  if (rawB !== undefined && (Number.isNaN(limit) || limit < 1)) {
    console.error(`Limite inválido: ${rawB}`);
    process.exit(1);
  }

  return { inputDir, concurrency, limit };
}

// Extrai o nome de arquivo original a partir da URL da imagem.
function basenameFromUrl(url) {
  const pathname = new URL(url).pathname;
  return path.basename(pathname);
}

function modOf(id) {
  return String(Number(id) % 100).padStart(2, '0');
}

// Monta o caminho de destino, tratando colisão com prefixo dup_ + timestamp.
function resolveTargetPath(id, basename, ts) {
  const mod = modOf(id);
  const outDir = path.join('data', 'thumbs', mod);
  fs.mkdirSync(outDir, { recursive: true });

  const normalName = `${id}-${basename}`;
  const normalPath = path.join(outDir, normalName);

  if (!fs.existsSync(normalPath)) {
    return normalPath;
  }

  const ext = path.extname(basename);
  const baseNoExt = basename.slice(0, basename.length - ext.length);
  const dupName = `dup_${id}-${baseNoExt}_${ts}${ext}`;
  return path.join(outDir, dupName);
}

// Baixa uma única imagem. Retorna { ok: true } ou { ok: false, status, error }.
async function downloadImage(url, targetPath) {
  let response;
  try {
    response = await fetch(url, { headers: buildImageHeaders() });
  } catch (err) {
    return { ok: false, status: 'NETWORK_ERROR', error: err.message };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, error: response.statusText || 'HTTP error' };
  }

  try {
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(targetPath, buffer);
  } catch (err) {
    return { ok: false, status: 'WRITE_ERROR', error: err.message };
  }

  return { ok: true };
}

// Pool simples de concorrência: processa `items` com no máximo `concurrency`
// downloads simultâneos, chamando workerFn(item) para cada um.
async function runPool(items, concurrency, workerFn) {
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      await workerFn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
}

async function main() {
  const { inputDir, concurrency, limit } = parseArgs(process.argv);

  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    console.error(`Diretório não encontrado: ${inputDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith('.json'))
    .sort(); // ordem de offset

  if (files.length === 0) {
    console.error(`Nenhum arquivo .json encontrado em: ${inputDir}`);
    process.exit(1);
  }

  console.log(
    `Iniciando downloads: concorrência=${concurrency}, limite=${limit === Infinity ? 'todas' : limit}`
  );

  const ts = timestamp();
  const seenIds = new Set(); // garante works únicos
  const failedItems = []; // { id, url, targetPath }
  let attempted = 0; // conta works únicos já enfileirados para download (sucesso ou falha)
  let succeeded = 0;
  let failedFirstPass = 0;
  let stop = false;

  for (const file of files) {
    if (stop) break;

    const filePath = path.join(inputDir, file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Erro ao parsear ${filePath}: ${err.message} (pulando arquivo)`);
      continue;
    }

    const works = json.body && Array.isArray(json.body.works) ? json.body.works : [];

    // Monta o lote deste arquivo, respeitando unicidade e o limite global restante.
    const batch = [];
    for (const work of works) {
      if (!work || !work.id || !work.url) continue;
      if (seenIds.has(work.id)) continue; // work único
      if (attempted >= limit) {
        stop = true;
        break;
      }
      seenIds.add(work.id);
      attempted++;
      batch.push({ id: work.id, url: work.url });
    }

    if (batch.length === 0) continue;

    console.log(`Processando ${file}: ${batch.length} imagem(ns) (arquivo por vez, downloads em paralelo)...`);

    await runPool(batch, concurrency, async (item) => {
      const basename = basenameFromUrl(item.url);
      const targetPath = resolveTargetPath(item.id, basename, ts);
      const result = await downloadImage(item.url, targetPath);
      if (result.ok) {
        succeeded++;
      } else {
        failedFirstPass++;
        failedItems.push({ id: item.id, url: item.url, targetPath, status: result.status, error: result.error });
      }
    });
  }

  console.log(
    `Primeira passada concluída: ${succeeded} sucesso(s), ${failedFirstPass} falha(s) (de ${attempted} tentado(s)).`
  );

  // Segunda (e última) tentativa para os itens que falharam.
  let finalFailures = [];
  if (failedItems.length > 0) {
    console.log(`Tentando novamente ${failedItems.length} falha(s) (última tentativa)...`);

    await runPool(failedItems, concurrency, async (item) => {
      const result = await downloadImage(item.url, item.targetPath);
      if (result.ok) {
        succeeded++;
      } else {
        finalFailures.push({ ...item, status: result.status, error: result.error });
      }
    });
  }

  if (finalFailures.length > 0) {
    const logPath = path.join('data', 'thumbs', `failures_${ts}.log`);
    const lines = finalFailures.map(
      (f) => `${timestamp()}\t${f.id}\t${f.url}\t${f.status}\t${f.error}`
    );
    fs.appendFileSync(logPath, lines.join('\n') + '\n');
    console.log(`${finalFailures.length} falha(s) persistente(s) registrada(s) em: ${logPath}`);
  }

  console.log(`Concluído. ${succeeded} imagem(ns) baixada(s) com sucesso de ${attempted} tentada(s).`);
}

main();