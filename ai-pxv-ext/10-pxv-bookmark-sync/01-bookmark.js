#!/usr/bin/env node
/**
 * 01-bookmarks.js
 *
 * Baixa todas as páginas de bookmarks (AJAX) de um usuário do Pixiv,
 * salvando a resposta bruta de cada offset em disco.
 *
 * Suporta resume: se o arquivo de um offset já existe, pula para o próximo
 * sem fazer request, até encontrar o primeiro offset ainda não baixado.
 * Se um arquivo ficou corrompido/incompleto (ex: processo interrompido no meio),
 * delete-o manualmente antes de rodar de novo; o script vai retomar a partir dele.
 *
 * Uso:
 *   node 01-bookmarks.js <userId> <phpsessid>
 *   ./01-bookmarks.js <userId> <phpsessid>   (Linux/macOS/WSL/Git Bash, com chmod +x)
 *
 * Exemplo:
 *   node 01-bookmarks.js 5986322 5986322_gNJBV7zkpdCzMXkusrclugBajhFUyCoh
 */

const fs = require('fs');
const path = require('path');

const LIMIT = 48;
const RATE_LIMIT_MS = 1000;
const OFFSET_PAD = 5;

// Retorna a data local no formato YYYYMMDD
function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAjaxUrl(userId, offset) {
  return `https://www.pixiv.net/ajax/user/${userId}/illusts/bookmarks?tag=&offset=${offset}&limit=${LIMIT}&rest=show&order=desc&mode=all&lang=en`;
}

// A página 1 não tem querystring no referer; a partir da página 2, tem.
function buildReferer(userId, page) {
  const base = `https://www.pixiv.net/en/users/${userId}/bookmarks/artworks`;
  if (page === 1) return base;
  return `${base}?p=${page}&rest=show&mode=all`;
}

function buildHeaders(userId, phpsessid, referer) {
  return {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
    cookie: `PHPSESSID=${phpsessid}`,
    referer: referer,
    'sec-ch-ua': '"Brave";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
    'x-user-id': userId,
  };
}

function offsetFileName(userId, offset) {
  const offsetStr = String(offset).padStart(OFFSET_PAD, '0');
  return `${userId}_${offsetStr}.json`;
}

async function main() {
  const [, , userId, phpsessid] = process.argv;

  if (!userId || !phpsessid) {
    console.error('Uso: node 01-bookmarks.js <userId> <phpsessid>');
    process.exit(1);
  }

  const dateDir = today();
  const outDir = path.join('data', 'pages', userId, dateDir);
  fs.mkdirSync(outDir, { recursive: true });

  let offset = 0;

  // Fase 1: pula offsets cujo arquivo já existe (resume), sem fazer nenhuma request.
  while (true) {
    const filePath = path.join(outDir, offsetFileName(userId, offset));
    if (fs.existsSync(filePath)) {
      offset += LIMIT;
      continue;
    }
    break;
  }

  console.log(`Iniciando a partir do offset=${offset}...`);

  // Fase 2: busca sequencialmente a partir do offset encontrado.
  while (true) {
    const filePath = path.join(outDir, offsetFileName(userId, offset));
    const page = offset / LIMIT + 1;
    const url = buildAjaxUrl(userId, offset);
    const referer = buildReferer(userId, page);
    const headers = buildHeaders(userId, phpsessid, referer);

    console.log(`Buscando offset=${offset} (page=${page})...`);

    let response;
    try {
      response = await fetch(url, { headers });
    } catch (err) {
      console.error(`Erro de rede na requisição (offset=${offset}): ${err.message}`);
      process.exit(1);
    }

    if (!response.ok) {
      console.error(
        `Requisição falhou com HTTP ${response.status} (offset=${offset}). ` +
          `Verifique se o PHPSESSID ainda é válido.`
      );
      process.exit(1);
    }

    const rawText = await response.text();
    let json;
    try {
      json = JSON.parse(rawText);
    } catch (err) {
      console.error(`Resposta não é um JSON válido (offset=${offset}): ${err.message}`);
      process.exit(1);
    }

    if (json.error) {
      console.error(`API retornou erro (offset=${offset}): ${json.message}`);
      process.exit(1);
    }

    fs.writeFileSync(filePath, rawText);
    console.log(`Gravado: ${filePath}`);

    const worksCount =
      json.body && Array.isArray(json.body.works) ? json.body.works.length : 0;

    if (worksCount < LIMIT) {
      console.log(`Fim dos bookmarks (offset=${offset}, works=${worksCount}).`);
      break;
    }

    offset += LIMIT;
    await sleep(RATE_LIMIT_MS);
  }

  console.log('Concluído.');
}

main();