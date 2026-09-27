#!/usr/bin/env node
/**
 * 03-bookmarktags.js
 *
 * Lê todos os JSONs de um diretório de páginas de bookmarks (gerado pela Parte 1)
 * e funde (merge) todos os "body.bookmarkTags" em um único objeto.
 * Em caso de chave repetida (não deveria ocorrer), o último arquivo lido vence.
 *
 * Uso: node 03-bookmarktags.js <diretorio_pages>
 * Exemplo: node 03-bookmarktags.js data/pages/5986322/20260923
 *
 * Gera: data/bookmarktags/{userId}_{anomesdia}_{timestamp_execucao}.json
 */

const fs = require('fs');
const path = require('path');

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

function main() {
  const [, , inputDir] = process.argv;

  if (!inputDir) {
    console.error('Uso: node 03-bookmarktags.js <diretorio_pages>');
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

  const mergedTags = {};

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Erro ao parsear ${filePath}: ${err.message}`);
      process.exit(1);
    }

    const bookmarkTags = json.body && json.body.bookmarkTags;

    // bookmarkTags pode vir como objeto ({}) ou como array vazio ([]) quando não há dados.
    // Só mescla quando for de fato um objeto com chaves.
    if (bookmarkTags && typeof bookmarkTags === 'object' && !Array.isArray(bookmarkTags)) {
      Object.assign(mergedTags, bookmarkTags);
    }
  }

  const outDir = path.join('data', 'bookmarktags');
  fs.mkdirSync(outDir, { recursive: true });

  const ts = timestamp();
  const outFile = path.join(outDir, `${userId}_${anomesdiaOrigem}_${ts}.json`);

  fs.writeFileSync(outFile, JSON.stringify({ bookmarkTags: mergedTags }, null, 2));

  const totalKeys = Object.keys(mergedTags).length;
  console.log(`Gravado: ${outFile} (${totalKeys} bookmark(s) com tags)`);
}

main();