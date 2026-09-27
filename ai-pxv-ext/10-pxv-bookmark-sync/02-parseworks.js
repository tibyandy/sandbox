#!/usr/bin/env node
/**
 * 02-parseworks.js
 *
 * Lê todos os JSONs de um diretório de páginas de bookmarks (gerado pela Parte 1),
 * concatena os "works" de todos os arquivos (em ordem de chegada, sem dedup) e
 * grava um único arquivo de saída, em formato JSON puro ou JSONP.
 *
 * Uso: node 02-parseworks.js <diretorio_pages> [formato]
 *   formato: "json" (default) | "jsonp"
 *
 * Exemplos:
 *   node 02-parseworks.js data/pages/5986322/20260923
 *     -> data/works/20260923/5986322.json  com {"works":[...]}
 *   node 02-parseworks.js data/pages/5986322/20260923 jsonp
 *     -> data/works/20260923/5986322.js    com window?.setData?.({"works":[...]});
 *
 * Sobrescreve a cada execução, sem histórico.
 */

const fs = require('fs');
const path = require('path');

const VALID_FORMATS = ['json', 'jsonp'];
const DEFAULT_FORMAT = 'json';

function main() {
  const [, , inputDir, rawFormat] = process.argv;

  if (!inputDir) {
    console.error('Uso: node 02-parseworks.js <diretorio_pages> [formato: json|jsonp]');
    process.exit(1);
  }

  const format = rawFormat || DEFAULT_FORMAT;
  if (!VALID_FORMATS.includes(format)) {
    console.error(`Formato inválido: "${rawFormat}". Use "json" ou "jsonp".`);
    process.exit(1);
  }

  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    console.error(`Diretório não encontrado: ${inputDir}`);
    process.exit(1);
  }

  // Espera caminho no formato: data/pages/{userId}/{anomesdia}
  const anomesdiaOrigem = path.basename(inputDir);
  const userId = path.basename(path.dirname(inputDir));

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith('.json'))
    .sort(); // ordem lexicográfica == ordem de offset, pois offset tem padding fixo

  if (files.length === 0) {
    console.error(`Nenhum arquivo .json encontrado em: ${inputDir}`);
    process.exit(1);
  }

  console.log(`Lendo ${files.length} arquivo(s) de ${inputDir}...`);

  const allWorks = []; // ordem de chegada, sem dedup

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Erro ao parsear ${filePath}: ${err.message}`);
      process.exit(1);
    }

    const works = json.body && Array.isArray(json.body.works) ? json.body.works : [];
    allWorks.push(...works);
  }

  const outDir = path.join('data', 'works', anomesdiaOrigem);
  fs.mkdirSync(outDir, { recursive: true });

  const payload = JSON.stringify({ works: allWorks }, null, 2);
  const isJsonp = format === 'jsonp';
  const ext = isJsonp ? 'js' : 'json';
  const content = isJsonp ? `window?.setData?.(${payload});\n` : `${payload}\n`;

  const outFile = path.join(outDir, `${userId}.${ext}`);
  fs.writeFileSync(outFile, content);

  console.log(`Gravado: ${outFile} (formato=${format}, ${allWorks.length} works)`);
}

main();
