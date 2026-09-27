#!/usr/bin/env node
/**
 * 05-preprocesspage.js
 *
 * Versão enxuta do pré-processamento (ver x05-preprocesspageexpanded.js para a
 * versão anterior, com agregações combinatórias, mantida como backup/referência).
 *
 * Motivo da mudança: a versão expandida pré-computava relatedTags (co-ocorrência
 * de PARES de tags por work), o que cresce combinatoriamente (N tags por work
 * geram N*(N-1) contagens) e gerou arquivos de 20-35MB / 1,5M+ linhas —
 * pesado demais para carregar de uma vez em mobile.
 *
 * Esta versão só grava o que é O(works) para gerar (não O(works * tags^2)):
 *   - worksById: dado bruto (trimmed), com tags como ÍNDICES no tagDict (não
 *     strings repetidas)
 *   - tagDict: lista de tags únicas, ordenada por popularidade (freq desc)
 *   - tagIndex: array paralelo ao tagDict; tagIndex[i] = workIds que têm tagDict[i]
 *   - artistIndex: userId -> { userName, profileImageUrl, workIds }
 *
 * Agregações mais pesadas (worksCountByAiType, workIdsByArtist por tag,
 * relatedTags, averagePageCount, firstDate/lastDate, etc.) NÃO são mais
 * pré-computadas aqui: com os índices acima, calculá-las sob demanda no client
 * (só quando o usuário entra numa tag/artista específico) é da ordem de
 * milissegundos sobre um array de ~12k works, então não vale o custo de peso
 * do arquivo pré-processado.
 *
 * Mesmas regras de dedup da versão anterior:
 *  - Works com userId=0 são descartados.
 *  - Se o mesmo work.id aparecer com userId=0 em um arquivo e userId!=0 em
 *    outro, a versão com userId!=0 prevalece.
 *  - Se o mesmo work.id aparecer mais de uma vez com userId!=0, prevalece a
 *    versão com maior updateDate; em empate, a primeira encontrada.
 *
 * Uso: node 05-preprocesspage.js <diretorio_works> [formato]
 *   formato: "json" (default, pretty-printed) | "jsonp" (minificado)
 */

const fs = require('fs');
const path = require('path');

const VALID_FORMATS = ['json', 'jsonp'];
const DEFAULT_FORMAT = 'json';

// Campos removidos da versão trimmed em worksById.
const FIELDS_TO_STRIP = [
  'description',
  'isBookmarkable',
  'alt',
  'isUnlisted',
  'isMasked',
  'visibilityScope',
  'profileImageUrl',
];

function toTime(dateStr) {
  const t = new Date(dateStr).getTime();
  return Number.isFinite(t) ? t : 0;
}

// Constrói a versão "trimmed" de um work para worksById (sem mexer em "tags" ainda).
function trimWork(work) {
  const trimmed = { ...work };
  for (const field of FIELDS_TO_STRIP) {
    delete trimmed[field];
  }
  const tct = trimmed.titleCaptionTranslation;
  if (tct && tct.workTitle === null && tct.workCaption === null) {
    delete trimmed.titleCaptionTranslation;
  }
  return trimmed;
}

function main() {
  const [, , inputDir, rawFormat] = process.argv;

  if (!inputDir) {
    console.error('Uso: node 05-preprocesspage.js <diretorio_works> [formato: json|jsonp]');
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

  // Espera caminho no formato: data/works/{yyyymmdd}
  const yyyymmdd = path.basename(inputDir);

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error(`Nenhum arquivo .json encontrado em: ${inputDir}`);
    process.exit(1);
  }

  console.log(`Lendo ${files.length} arquivo(s) de ${inputDir}...`);

  // --- Fase 1: coleta e dedup (idêntico à versão expandida) ---
  const bestById = new Map();
  let discardedZeroUserId = 0;
  let totalSeen = 0;

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Erro ao parsear ${filePath}: ${err.message}`);
      process.exit(1);
    }

    const works = Array.isArray(json.works) ? json.works : [];

    for (const work of works) {
      totalSeen++;
      const userId = Number(work.userId);
      if (userId === 0) {
        discardedZeroUserId++;
        continue;
      }

      const existing = bestById.get(work.id);
      if (!existing) {
        bestById.set(work.id, work);
        continue;
      }
      if (toTime(work.updateDate) > toTime(existing.updateDate)) {
        bestById.set(work.id, work);
      }
    }
  }

  const finalWorks = Array.from(bestById.values());
  console.log(
    `Total de entradas lidas: ${totalSeen}. Descartadas (userId=0): ${discardedZeroUserId}. ` +
      `Works únicos finais: ${finalWorks.length}.`
  );

  // --- Fase 2: agregação leve (O(works * tags), sem combinatória de pares) ---

  // tagWorkIds: tag (string) -> Set de workIds
  const tagWorkIds = new Map();
  // artistStats: userId -> { workIds: Set, userName, profileImageUrl, bestUpdateTime }
  const artistStats = new Map();

  for (const work of finalWorks) {
    const id = work.id;
    const userId = String(work.userId);
    const tags = Array.isArray(work.tags) ? work.tags : [];
    const updateTime = toTime(work.updateDate);

    for (const tag of tags) {
      if (!tagWorkIds.has(tag)) tagWorkIds.set(tag, new Set());
      tagWorkIds.get(tag).add(id);
    }

    let as = artistStats.get(userId);
    if (!as) {
      as = { workIds: new Set(), userName: null, profileImageUrl: null, bestUpdateTime: -Infinity };
      artistStats.set(userId, as);
    }
    as.workIds.add(id);
    if (updateTime > as.bestUpdateTime) {
      as.bestUpdateTime = updateTime;
      as.userName = work.userName;
      as.profileImageUrl = work.profileImageUrl;
    }
  }

  // --- Fase 3: monta tagDict (ordenado por popularidade desc) + tagToIndex ---

  const tagDict = Array.from(tagWorkIds.keys()).sort(
    (a, b) => tagWorkIds.get(b).size - tagWorkIds.get(a).size
  );
  const tagToIndex = new Map(tagDict.map((tag, idx) => [tag, idx]));

  // tagIndex[i] = workIds (desc) que têm tagDict[i]
  const tagIndex = tagDict.map((tag) =>
    Array.from(tagWorkIds.get(tag)).sort((a, b) => Number(b) - Number(a))
  );

  // --- Fase 4: monta worksById (tags viram índices no tagDict) ---

  const worksById = {};
  for (const work of finalWorks) {
    const trimmed = trimWork(work);
    const tags = Array.isArray(work.tags) ? work.tags : [];
    trimmed.tags = tags.map((tag) => tagToIndex.get(tag));
    worksById[work.id] = trimmed;
  }

  // --- Fase 5: monta artistIndex ---

  const artistIndex = {};
  for (const [userId, as] of artistStats.entries()) {
    artistIndex[userId] = {
      userName: as.userName,
      profileImageUrl: as.profileImageUrl,
      workIds: Array.from(as.workIds).sort((a, b) => Number(b) - Number(a)),
    };
  }

  const output = { tagDict, worksById, tagIndex, artistIndex };

  // --- Fase 6: grava ---

  const outDir = path.join('data', 'preprocess');
  fs.mkdirSync(outDir, { recursive: true });

  const isJsonp = format === 'jsonp';
  const ext = isJsonp ? 'js' : 'json';
  const payload = isJsonp ? JSON.stringify(output) : JSON.stringify(output, null, 2);
  const content = isJsonp ? `window?.setData?.(${payload});\n` : `${payload}\n`;

  const outFile = path.join(outDir, `${yyyymmdd}.${ext}`);
  fs.writeFileSync(outFile, content);

  console.log(
    `Gravado: ${outFile} (formato=${format}, ${finalWorks.length} works, ` +
      `${tagDict.length} tags únicas, ${artistStats.size} artistas)`
  );
}

main();
