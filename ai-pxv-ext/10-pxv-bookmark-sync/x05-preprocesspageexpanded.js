#!/usr/bin/env node
/**
 * 05-preprocesspage.js
 *
 * Lê todos os JSONs de um diretório data/works/{yyyymmdd} (gerado pela Parte 2,
 * um arquivo por userId de origem), deduplica works por id e pré-computa
 * agregações pesadas (por tag, por artista) para consumo direto no frontend,
 * sem precisar reprocessar nada client-side.
 *
 * Regras de deduplicação:
 *  - Works com userId=0 são descartados (não contam para nada).
 *  - Se o mesmo work.id aparecer com userId=0 em um arquivo e userId!=0 em outro,
 *    a versão com userId!=0 prevalece.
 *  - Se o mesmo work.id aparecer mais de uma vez com userId!=0, prevalece a
 *    versão com maior updateDate; em empate, a primeira encontrada (arquivos
 *    processados em ordem alfabética, ordem de array dentro do arquivo).
 *
 * Uso: node 05-preprocesspage.js <diretorio_works> [formato]
 *   formato: "json" (default, pretty-printed) | "jsonp" (minificado)
 *
 * Exemplos:
 *   node 05-preprocesspage.js data/works/20260923
 *     -> data/preprocess/20260923.json
 *   node 05-preprocesspage.js data/works/20260923 jsonp
 *     -> data/preprocess/20260923.js   (window?.setData?.({...}); minificado)
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

// Constrói a versão "trimmed" de um work para worksById.
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

// Ordena entries (pares [chave, valor]) por um critério e devolve objeto,
// preservando a ordem de inserção (funciona para chaves não-numéricas;
// chaves numéricas são sempre reordenadas ascendentemente pelo próprio JS,
// o que é aceito conforme decisão do usuário).
function toSortedObject(entries, compareFn) {
  const sorted = compareFn ? [...entries].sort(compareFn) : entries;
  return Object.fromEntries(sorted);
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

  // --- Fase 1: coleta e dedup ---
  // bestById: workId -> melhor work (userId != 0) encontrado até agora
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
        continue; // descarta works com userId=0, sempre
      }

      const existing = bestById.get(work.id);
      if (!existing) {
        bestById.set(work.id, work);
        continue;
      }

      // Só substitui se o novo tiver updateDate estritamente maior
      // (garante que em empate a primeira encontrada prevalece).
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

  // --- Fase 2: agregações ---

  const worksById = {};

  // tagStats: tag -> { workIds: Set, aiTypeCounts: Map, artistWorkIds: Map(userId->Set),
  //                     coTagCounts: Map, firstDate, lastDate }
  const tagStats = new Map();

  // userStats: userId -> { workIds: Set, aiTypeCounts: Map, tagWorkIds: Map(tag->Set),
  //                         pageCounts: number[], firstDate, lastDate,
  //                         bestUpdateTime, userName, profileImageUrl }
  const userStats = new Map();

  function getTagStats(tag) {
    let ts = tagStats.get(tag);
    if (!ts) {
      ts = {
        workIds: new Set(),
        aiTypeCounts: new Map(),
        artistWorkIds: new Map(),
        coTagCounts: new Map(),
        firstDate: null,
        lastDate: null,
      };
      tagStats.set(tag, ts);
    }
    return ts;
  }

  function getUserStats(userId) {
    let us = userStats.get(userId);
    if (!us) {
      us = {
        workIds: new Set(),
        aiTypeCounts: new Map(),
        tagWorkIds: new Map(),
        pageCounts: [],
        firstDate: null,
        lastDate: null,
        bestUpdateTime: -Infinity,
        userName: null,
        profileImageUrl: null,
      };
      userStats.set(userId, us);
    }
    return us;
  }

  for (const work of finalWorks) {
    const id = work.id;
    const userId = String(work.userId);
    const tags = Array.isArray(work.tags) ? work.tags : [];
    const aiType = work.aiType;
    const createTime = work.createDate;
    const updateTime = work.updateDate;

    worksById[id] = trimWork(work);

    // --- por tag ---
    for (const tag of tags) {
      const ts = getTagStats(tag);
      ts.workIds.add(id);
      ts.aiTypeCounts.set(aiType, (ts.aiTypeCounts.get(aiType) || 0) + 1);

      if (!ts.artistWorkIds.has(userId)) ts.artistWorkIds.set(userId, new Set());
      ts.artistWorkIds.get(userId).add(id);

      for (const otherTag of tags) {
        if (otherTag === tag) continue;
        ts.coTagCounts.set(otherTag, (ts.coTagCounts.get(otherTag) || 0) + 1);
      }

      if (ts.firstDate === null || toTime(createTime) < toTime(ts.firstDate)) ts.firstDate = createTime;
      if (ts.lastDate === null || toTime(updateTime) > toTime(ts.lastDate)) ts.lastDate = updateTime;
    }

    // --- por artista ---
    const us = getUserStats(userId);
    us.workIds.add(id);
    us.aiTypeCounts.set(aiType, (us.aiTypeCounts.get(aiType) || 0) + 1);
    us.pageCounts.push(Number(work.pageCount) || 0);

    for (const tag of tags) {
      if (!us.tagWorkIds.has(tag)) us.tagWorkIds.set(tag, new Set());
      us.tagWorkIds.get(tag).add(id);
    }

    if (us.firstDate === null || toTime(createTime) < toTime(us.firstDate)) us.firstDate = createTime;
    if (us.lastDate === null || toTime(updateTime) > toTime(us.lastDate)) us.lastDate = updateTime;

    // userName/profileImageUrl: usa a ocorrência de maior updateDate para este artista
    if (toTime(updateTime) > us.bestUpdateTime) {
      us.bestUpdateTime = toTime(updateTime);
      us.userName = work.userName;
      us.profileImageUrl = work.profileImageUrl;
    }
  }

  // --- Fase 3: monta dataByTag ---

  const tagEntries = Array.from(tagStats.entries()).map(([tag, ts]) => {
    const workIdsDesc = Array.from(ts.workIds).sort((a, b) => Number(b) - Number(a));

    const worksCountByAiType = toSortedObject(
      Array.from(ts.aiTypeCounts.entries()),
      (a, b) => Number(a[0]) - Number(b[0])
    );

    // workIdsByArtist: chave numérica (userId) -> JS força ordem ascendente
    // automaticamente no JSON.stringify, independente da ordem de inserção.
    const workIdsByArtist = {};
    for (const [artistId, idSet] of ts.artistWorkIds.entries()) {
      workIdsByArtist[artistId] = Array.from(idSet).sort((a, b) => Number(b) - Number(a));
    }

    const relatedTags = toSortedObject(
      Array.from(ts.coTagCounts.entries()),
      (a, b) => b[1] - a[1]
    );

    return [
      tag,
      {
        workIds: workIdsDesc,
        worksCountByAiType,
        workIdsByArtist,
        relatedTags,
        firstDate: ts.firstDate,
        lastDate: ts.lastDate,
      },
    ];
  });

  tagEntries.sort((a, b) => b[1].workIds.length - a[1].workIds.length);
  const dataByTag = Object.fromEntries(tagEntries);

  // --- Fase 4: monta dataByUserId ---

  const userEntries = Array.from(userStats.entries()).map(([userId, us]) => {
    const workIdsDesc = Array.from(us.workIds).sort((a, b) => Number(b) - Number(a));

    const worksCountByAiType = toSortedObject(
      Array.from(us.aiTypeCounts.entries()),
      (a, b) => Number(a[0]) - Number(b[0])
    );

    const tagEntriesForUser = Array.from(us.tagWorkIds.entries()).map(([tag, idSet]) => [
      tag,
      Array.from(idSet).sort((a, b) => Number(b) - Number(a)),
    ]);
    tagEntriesForUser.sort((a, b) => b[1].length - a[1].length);
    const workIdsByTag = Object.fromEntries(tagEntriesForUser);

    const relatedTagsEntries = tagEntriesForUser.map(([tag, ids]) => [tag, ids.length]);
    relatedTagsEntries.sort((a, b) => b[1] - a[1]);
    const relatedTags = Object.fromEntries(relatedTagsEntries);

    const sumPageCount = us.pageCounts.reduce((acc, v) => acc + v, 0);
    const averagePageCount = Math.ceil(sumPageCount / us.pageCounts.length);

    return [
      userId,
      {
        userName: us.userName,
        profileImageUrl: us.profileImageUrl,
        workIds: workIdsDesc,
        worksCountByAiType,
        workIdsByTag,
        averagePageCount,
        relatedTags,
        firstDate: us.firstDate,
        lastDate: us.lastDate,
      },
    ];
  });

  // Chave é numérica (userId): JS força ordem ascendente no JSON.stringify
  // independente da ordem que montarmos aqui.
  const dataByUserId = Object.fromEntries(userEntries);

  const output = { worksById, dataByTag, dataByUserId };

  // --- Fase 5: grava ---

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
      `${tagEntries.length} tags, ${userEntries.length} artistas)`
  );
}

main();
