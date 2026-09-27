'use strict';

/* ==========================================================================
 * Configuração
 * ========================================================================== */

const DATA_SCRIPT_SRC = '../data/preprocess/20260924.js';
const TAGS_SCRIPT_SRC = '../data/tags.js';
const THUMBS_BASE = '../data/thumbs';

const PIXIV_ARTWORK_URL = (workId) => `https://www.pixiv.net/en/artworks/${workId}`;
const PIXIV_USER_URL = (userId) => `https://www.pixiv.net/en/users/${userId}`;

const PAGE_SIZE = 18; // 6 colunas x 3 linhas
const TOP_TAGS_COUNT = 20; // X
const TOP_ARTISTS_COUNT = 15; // Z
const PAGINATION_WINDOW = 9; // números de página visíveis

const AC_TOP_ARTISTS = 5; // autocomplete combinado (sem u/): top N artistas
const AC_TOP_TAGS = 50; // autocomplete combinado: top N tags
const AC_ARTIST_MODE_CAP = 30; // autocomplete em modo "u/..." explícito: só artistas

const THEME_STORAGE_KEY = 'pxv-bookmark-theme';
const INVALID_TAG_INDEX = -1; // marcador de tag inexistente (garante 0 resultados)
const INVALID_ARTIST_ID = '__invalid__'; // marcador de artista inexistente

const AI_TYPE_LABELS = { 0: 'human-made?', 1: 'human-made', 2: 'AI generated' };
const ILLUST_TYPE_LABELS = { 0: 'illustration', 1: 'manga', 2: 'ugoira', 3: 'novel' };
const X_RESTRICT_LABELS = { 0: 'general', 1: 'R-18', 2: 'R-18G' };
const SANITY_LABELS = { 2: 'safe', 4: 'R-15', 6: 'R-18' };
const AI_TYPE_EMOJI = { 0: '🎨', 1: 'Hu', 2: ' ' };
const X_RESTRICT_TEXT = { 0: '•', 1: '18', 2: 'G' };
const X_RESTRICT_CSS = { 0: 'all', 1: 'r18', 2: 'r18g' };

const RESTRICT_FILTERS = ['all', 'sfw', 'nsfw', 'r18', 'r18g'];
const DEFAULT_RESTRICT = 'all';

/* ==========================================================================
 * Estado global (fonte da verdade da UI)
 * ========================================================================== */

const state = {
  tags: [], // array de índices de tag (números), no tagDict
  artistId: null, // string (userId) ou null
  restrict: DEFAULT_RESTRICT, // 'all' | 'sfw' | 'nsfw' | 'r18' | 'r18g'
  page: 1,
};

// Índices derivados, montados após o carregamento dos dados (ver buildIndices()).
let DATA = null;
let TAG_TRANSLATIONS = {}; // original -> tradução (data/tags.js, opcional)
let tagNameToIndex = null; // Map tagName original -> index no tagDict (exato)
let tagLookupCI = null; // Map lowercase(original OU tradução) -> index no tagDict
let artistNameToId = null; // Map userName -> userId
let allWorksSorted = null; // array de works, ordenado desc por id (cache)

// Estado do dropdown de autocomplete (não faz parte do state de busca "oficial").
let currentSuggestionsFlat = []; // [{type, tagIdx|userId, isActive, el}], ordem de exibição
let highlightedIndex = -1; // índice em currentSuggestionsFlat destacado via teclado

/* ==========================================================================
 * Carregamento dos dados (script tag dinâmica, com overlay de loading)
 * ========================================================================== */

function loadDataScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = DATA_SCRIPT_SRC;
    script.onload = () => {
      // O arquivo gerado atribui à variável global `data`.
      if (typeof window.data === 'undefined') {
        reject(new Error('Arquivo de dados carregou, mas a variável global "data" não foi definida.'));
        return;
      }
      resolve(window.data);
    };
    script.onerror = () => {
      reject(new Error(`Falha ao carregar o arquivo de dados: ${DATA_SCRIPT_SRC}`));
    };
    document.head.appendChild(script);
  });
}

// Traduções de tags são OPCIONAIS: se o arquivo não existir ou falhar, a app
// segue normalmente exibindo só os nomes originais das tags.
function loadTagTranslations() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = TAGS_SCRIPT_SRC;
    script.onload = () => {
      resolve(typeof window.tagTranslations === 'object' && window.tagTranslations ? window.tagTranslations : {});
    };
    script.onerror = () => {
      console.warn(`Não foi possível carregar ${TAGS_SCRIPT_SRC} — seguindo sem traduções de tags.`);
      resolve({});
    };
    document.head.appendChild(script);
  });
}

function buildIndices(data, translations) {
  DATA = data;
  TAG_TRANSLATIONS = translations || {};

  tagNameToIndex = new Map();
  tagLookupCI = new Map();
  data.tagDict.forEach((tag, idx) => {
    tagNameToIndex.set(tag, idx);
    tagLookupCI.set(tag.toLowerCase(), idx);
    const translation = TAG_TRANSLATIONS[tag];
    if (translation) tagLookupCI.set(translation.toLowerCase(), idx);
  });

  // userName -> userId. Em caso raro de nomes duplicados entre artistas
  // diferentes, fica o que tiver mais works (heurística simples).
  artistNameToId = new Map();
  for (const [userId, info] of Object.entries(data.artistIndex)) {
    const existingId = artistNameToId.get(info.userName);
    if (!existingId) {
      artistNameToId.set(info.userName, userId);
    } else {
      const existingCount = data.artistIndex[existingId].workIds.length;
      if (info.workIds.length > existingCount) {
        artistNameToId.set(info.userName, userId);
      }
    }
  }

  allWorksSorted = Object.values(data.worksById).sort((a, b) => Number(b.id) - Number(a.id));
}

// Nome de exibição de uma tag: tradução se existir, senão o original.
function tagDisplayName(tagIdx) {
  const original = DATA.tagDict[tagIdx];
  return TAG_TRANSLATIONS[original] || original;
}

// Nome original de uma tag (sempre o valor cru do tagDict).
function tagOriginalName(tagIdx) {
  return DATA.tagDict[tagIdx];
}

/* ==========================================================================
 * Parsing / serialização da busca
 * ========================================================================== */

// Sintaxe de artista: u/nome/ - o nome termina na PRÓXIMA barra "/" seguida de
// espaço, do início de outro "u/", ou do fim da string. Isso permite nomes com
// espaços ("u/John Doe/") e até barras internas ("u/user/name/"). A barra de
// fechamento é sempre obrigatória; "u/nome" sem barra final NÃO é reconhecido
// como artista (cai como tag inexistente, resultando em 0 resultados).
// Suporta só 1 artista por vez: se houver mais de um "u/.../" na busca, o
// ÚLTIMO vence e os demais são descartados por completo (nem viram tag).
function makeArtistRegex() {
  return /u\/(.*?)\/(?=\s|u\/|$)/g;
}

function parseQueryText(text) {
  const matches = Array.from(text.matchAll(makeArtistRegex()));

  let artistId = null;
  if (matches.length > 0) {
    const userName = matches[matches.length - 1][1];
    const id = artistNameToId.get(userName);
    artistId = id || INVALID_ARTIST_ID;
  }

  // Remove todas as ocorrências de u/.../ (inclusive as descartadas) antes de
  // extrair as tags, pra elas não vazarem pro tokenizer de tags.
  const remainingText = text.replace(makeArtistRegex(), ' ');

  const tags = [];
  const tokens = remainingText.trim().split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    // Case-insensitive, aceita tanto o nome original da tag quanto a tradução.
    const tokenLower = token.toLowerCase();
    const idx = tagLookupCI.has(tokenLower) ? tagLookupCI.get(tokenLower) : INVALID_TAG_INDEX;
    if (!tags.includes(idx)) tags.push(idx);
  }

  return { tags, artistId };
}

// Reconstrói o texto do campo de busca a partir do estado atual.
function serializeQueryText() {
  const parts = state.tags
    .filter((idx) => idx !== INVALID_TAG_INDEX)
    .map((idx) => DATA.tagDict[idx]);
  if (state.artistId && state.artistId !== INVALID_ARTIST_ID) {
    parts.push('u/' + DATA.artistIndex[state.artistId].userName + '/');
  }
  return parts.join(' ');
}

/* ==========================================================================
 * Autocomplete: matching / ranking
 * ========================================================================== */

// Classifica o tipo de match de `s` (candidato, já em minúsculas) contra
// `q` (palavra buscada, já em minúsculas). Cada candidato cai em EXATAMENTE
// um nível (o de maior prioridade que ele satisfizer):
//   0 = exato | 1 = começa com | 2 = termina com | 3 = contém no meio
//   -1 = não bate
function matchTier(s, q) {
  if (s === q) return 0;
  if (s.startsWith(q)) return 1;
  if (s.endsWith(q)) return 2;
  if (s.includes(q)) return 3;
  return -1;
}

// Calcula as sugestões de autocomplete para o token parcial `rawToken`
// (a última "palavra" sendo digitada no campo de busca).
// Retorna null se não houver nada a mostrar.
function computeAutocomplete(rawToken) {
  const isArtistMode = rawToken.toLowerCase().startsWith('u/');
  const query = (isArtistMode ? rawToken.slice(2) : rawToken).toLowerCase();
  if (!query) return null;

  // --- Artistas ---
  const artistMatches = [];
  for (const [userId, info] of Object.entries(DATA.artistIndex)) {
    const tier = matchTier(info.userName.toLowerCase(), query);
    if (tier === -1) continue;
    artistMatches.push({ userId, info, tier, popularity: info.workIds.length });
  }
  artistMatches.sort((a, b) => a.tier - b.tier || b.popularity - a.popularity);
  const artistCap = isArtistMode ? AC_ARTIST_MODE_CAP : AC_TOP_ARTISTS;
  const artists = artistMatches.slice(0, artistCap);

  if (isArtistMode) {
    return artists.length > 0 ? { mode: 'artist', artists, tags: [] } : null;
  }

  // --- Tags (considera tradução E original; tradução tem prioridade em
  // caso de empate no mesmo nível de match) ---
  const tagMatches = [];
  DATA.tagDict.forEach((original, idx) => {
    const translation = TAG_TRANSLATIONS[original];
    const oTier = matchTier(original.toLowerCase(), query);
    let best = null;
    if (translation) {
      const tTier = matchTier(translation.toLowerCase(), query);
      if (tTier !== -1) best = { tier: tTier, source: 0 }; // source 0 = tradução
    }
    if (oTier !== -1 && (!best || oTier < best.tier)) {
      best = { tier: oTier, source: 1 }; // source 1 = original
    }
    if (!best) return;
    const sortKey = best.tier * 2 + best.source; // 0..7, na ordem de prioridade pedida
    const popularity = DATA.tagIndex[idx] ? DATA.tagIndex[idx].length : 0;
    tagMatches.push({ tagIdx: idx, sortKey, popularity });
  });
  tagMatches.sort((a, b) => a.sortKey - b.sortKey || b.popularity - a.popularity);
  const tags = tagMatches.slice(0, AC_TOP_TAGS);

  if (artists.length === 0 && tags.length === 0) return null;
  return { mode: 'combined', artists, tags };
}

/* ==========================================================================
 * URL (query params) <-> estado
 * ========================================================================== */

function stateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const parsed = parseQueryText(q);
  state.tags = parsed.tags;
  state.artistId = parsed.artistId;

  const restrictParam = params.get('restrict');
  state.restrict = RESTRICT_FILTERS.includes(restrictParam) ? restrictParam : DEFAULT_RESTRICT;

  const pageParam = parseInt(params.get('page'), 10);
  state.page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
}

/* ==========================================================================
 * Filtro / agregação
 * ========================================================================== */

// Testa se o xRestrict de um work satisfaz o filtro de rating atual.
function matchesRestrict(xRestrict) {
  switch (state.restrict) {
    case 'sfw':
      return xRestrict === 0;
    case 'nsfw':
      return xRestrict === 1 || xRestrict === 2;
    case 'r18':
      return xRestrict === 1;
    case 'r18g':
      return xRestrict === 2;
    default:
      return true; // 'all'
  }
}

function computeFiltered() {
  const { tags, artistId } = state;

  return allWorksSorted.filter((work) => {
    if (!matchesRestrict(work.xRestrict)) return false;
    if (artistId && work.userId !== artistId) return false;
    for (const tagIdx of tags) {
      if (!work.tags.includes(tagIdx)) return false;
    }
    return true;
  });
}

// Conta ocorrência de tags e artistas dentro de um conjunto de works já filtrado.
function computeSidebarCounts(filteredWorks) {
  const tagCounts = new Map(); // tagIdx -> count
  const artistCounts = new Map(); // userId -> count

  for (const work of filteredWorks) {
    for (const tagIdx of work.tags) {
      tagCounts.set(tagIdx, (tagCounts.get(tagIdx) || 0) + 1);
    }
    artistCounts.set(work.userId, (artistCounts.get(work.userId) || 0) + 1);
  }

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TAGS_COUNT);

  const topArtists = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_ARTISTS_COUNT);

  return { topTags, topArtists };
}

// Conta, para um artista específico, quantos dos seus works têm uma dada tag.
function countArtistTagIntersection(userId, tagIdx) {
  const artistWorkIds = DATA.artistIndex[userId].workIds;
  let count = 0;
  for (const id of artistWorkIds) {
    if (DATA.worksById[id].tags.includes(tagIdx)) count++;
  }
  return count;
}

/* ==========================================================================
 * Ações de mudança de estado (chamadas pelos handlers de UI)
 * ========================================================================== */

function addTag(tagIdx) {
  if (!state.tags.includes(tagIdx)) state.tags.push(tagIdx);
  state.page = 1;
  commitStateChange();
}

function removeTag(tagIdx) {
  state.tags = state.tags.filter((t) => t !== tagIdx);
  state.page = 1;
  commitStateChange();
}

function setArtist(userId) {
  state.artistId = userId;
  state.page = 1;
  commitStateChange();
}

function clearArtist() {
  state.artistId = null;
  state.page = 1;
  commitStateChange();
}

// Substitui TODA a busca por uma única tag.
function replaceQueryWithTag(tagIdx) {
  state.tags = [tagIdx];
  state.artistId = null;
  state.page = 1;
  commitStateChange();
}

// Substitui TODA a busca por um único artista.
function replaceQueryWithArtist(userId) {
  state.tags = [];
  state.artistId = userId;
  state.page = 1;
  commitStateChange();
}

function goToPage(page) {
  state.page = page;
  commitStateChange();
}

/* ==========================================================================
 * Renderização
 * ========================================================================== */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  // Todo <button> nasce type="button" por padrão, a menos que props.type diga
  // o contrário. Sem isso, um <button> dentro de uma <form> (como os botões
  // +/- do dropdown de autocomplete, que ficam dentro do <form> de busca)
  // vira type="submit" implicitamente, disparando um submit nativo do
  // formulário por baixo dos panos a cada clique — foi exatamente esse bug
  // que causava resultado errático ao clicar +/- no autocomplete.
  if (tag === 'button' && props.type === undefined) {
    node.type = 'button';
  }
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue; // nunca seta atributo com null/undefined
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'disabled') node.disabled = Boolean(value); // propriedade booleana, não atributo string
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(child);
  }
  return node;
}

// Cria um <li> de filtro (usado na sidebar E no modal).
function renderFilterItem({ label, subtitle, count, isActive, onNameClick, onToggleClick }) {
  const btn = el('button', {
    className: 'filter-toggle-btn ' + (isActive ? 'remove' : 'add'),
    text: isActive ? '\u2212' : '+',
    title: isActive ? 'Remover da busca' : 'Adicionar à busca',
    onClick: (e) => {
      e.stopPropagation();
      onToggleClick();
    },
  });

  const nameChildren = [el('span', { className: 'filter-name-primary', text: label })];
  if (subtitle) {
    nameChildren.push(el('span', { className: 'filter-name-secondary', text: subtitle }));
  }

  const name = el(
    'span',
    {
      className: 'filter-name',
      title: subtitle ? `${label} (${subtitle})` : label,
      onClick: onNameClick,
    },
    nameChildren
  );

  const countEl = el('span', { className: 'filter-count', text: String(count) });

  return el('li', { className: 'filter-item' + (isActive ? ' active' : '') }, [name, countEl, btn]);
}

function renderSidebar(filteredWorks) {
  const { topTags, topArtists } = computeSidebarCounts(filteredWorks);

  const tagListEl = document.getElementById('tag-list');
  tagListEl.innerHTML = '';
  for (const [tagIdx, count] of topTags) {
    const isActive = state.tags.includes(tagIdx);
    const original = tagOriginalName(tagIdx);
    const translation = TAG_TRANSLATIONS[original];
    const item = renderFilterItem({
      label: translation || original,
      subtitle: translation ? original : null,
      count,
      isActive,
      onNameClick: () => replaceQueryWithTag(tagIdx),
      onToggleClick: () => (isActive ? removeTag(tagIdx) : addTag(tagIdx)),
    });
    tagListEl.appendChild(item);
  }

  const artistListEl = document.getElementById('artist-list');
  artistListEl.innerHTML = '';
  for (const [userId, count] of topArtists) {
    const isActive = state.artistId === userId;
    const info = DATA.artistIndex[userId];
    const item = renderFilterItem({
      label: info.userName,
      count,
      isActive,
      onNameClick: () => replaceQueryWithArtist(userId),
      onToggleClick: () => (isActive ? clearArtist() : setArtist(userId)),
    });
    artistListEl.appendChild(item);
  }
}

function thumbPath(work) {
  const mod = String(Number(work.id) % 100).padStart(2, '0');
  let basename = '';
  try {
    const u = new URL(work.url);
    basename = u.pathname.substring(u.pathname.lastIndexOf('/') + 1);
  } catch (e) {
    basename = 'unknown.jpg';
  }
  return `${THUMBS_BASE}/${mod}/${work.id}-${basename}`;
}

function renderGrid(pageWorks) {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';

  if (pageWorks.length === 0) {
    gridEl.appendChild(el('div', { className: 'empty-state', text: 'Nenhum resultado encontrado.' }));
    return;
  }

  for (const work of pageWorks) {
    const img = el('img', {
      src: thumbPath(work),
      alt: work.title || work.id,
      loading: 'lazy',
    });

    const badge =
      work.pageCount > 1 ? el('span', { className: 'thumb-badge', text: String(work.pageCount) }) : null;

    // Badges no canto superior esquerdo: [rating] [tipo de autoria]
    const restrictText = X_RESTRICT_TEXT[work.xRestrict] || '\u2753'; // ❓ se valor não mapeado
    const restrictClass = X_RESTRICT_CSS[work.xRestrict] || ''
    let aiEmoji = null;
    if (work.aiType < 3) {
      aiEmoji = AI_TYPE_EMOJI[work.aiType];
    } else if (work.aiType !== 0) {
      aiEmoji = '\u2753'; // ❓
    }

    const topLeftBadges = el('div', { className: 'thumb-badge-topleft' }, [
      aiEmoji ? el('span', { className: 'thumb-emoji', text: aiEmoji }) : null,
      el('span', { className: `thumb-emoji ${restrictClass}`, text: restrictText }),
    ]);

    const card = el(
      'div',
      { className: 'thumb-card', onClick: () => openModal(work) },
      [img, badge, topLeftBadges]
    );

    gridEl.appendChild(card);
  }
}

function renderPagination(totalItems) {
  const paginationEl = document.getElementById('pagination');
  paginationEl.innerHTML = '';

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  const current = state.page;

  if (totalPages <= 1) return;

  const mkBtn = (label, onClick, opts = {}) =>
    el('button', {
      className: 'page-btn' + (opts.current ? ' current' : ''),
      text: label,
      disabled: Boolean(opts.disabled),
      onClick: opts.disabled ? null : onClick,
    });

  paginationEl.appendChild(mkBtn('\u00AB', () => goToPage(1), { disabled: current === 1 }));
  paginationEl.appendChild(mkBtn('\u2039', () => goToPage(current - 1), { disabled: current === 1 }));

  let start = Math.max(1, current - 4);
  let end = Math.min(totalPages, current + 4);
  if (end - start < PAGINATION_WINDOW - 1) {
    if (start === 1) end = Math.min(totalPages, start + PAGINATION_WINDOW - 1);
    else if (end === totalPages) start = Math.max(1, end - (PAGINATION_WINDOW - 1));
  }

  for (let p = start; p <= end; p++) {
    paginationEl.appendChild(mkBtn(String(p), () => goToPage(p), { current: p === current }));
  }

  paginationEl.appendChild(mkBtn('\u203A', () => goToPage(current + 1), { disabled: current === totalPages }));
  paginationEl.appendChild(mkBtn('\u00BB', () => goToPage(totalPages), { disabled: current === totalPages }));
}

// Renderiza a UI a partir do state atual. NÃO mexe na URL/histórico —
// isso é responsabilidade de commitStateChange() / popstate.
function renderUI() {
  const filtered = computeFiltered();

  document.getElementById('search-input').value = serializeQueryText();
  document.getElementById('restrict-filter').value = state.restrict;
  document.getElementById('result-count').textContent = `${filtered.length} resultados encontrados`;

  renderSidebar(filtered);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIdx = (state.page - 1) * PAGE_SIZE;
  const pageWorks = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  renderGrid(pageWorks);
  renderPagination(filtered.length);
}

// Monta a URL correspondente ao state atual (sem navegar).
function buildURLForState() {
  const params = new URLSearchParams();
  const q = serializeQueryText();
  if (q) params.set('q', q);
  if (state.restrict !== DEFAULT_RESTRICT) params.set('restrict', state.restrict);
  if (state.page > 1) params.set('page', String(state.page));
  const qs = params.toString();
  return window.location.pathname + (qs ? '?' + qs : '');
}

// Empilha uma nova entrada de histórico com a URL do state atual, para que
// o botão "voltar" do navegador retorne à busca/página anterior.
function pushURLState() {
  const newUrl = buildURLForState();
  const currentUrl = window.location.pathname + window.location.search;
  if (newUrl !== currentUrl) {
    history.pushState(null, '', newUrl);
  }
}

// Usado por toda ação que MUDA o state (busca, +/-, clique em nome, paginação):
// renderiza a UI e registra uma entrada nova no histórico do navegador.
function commitStateChange() {
  renderUI();
  pushURLState();
}

/* ==========================================================================
 * Modal
 * ========================================================================== */

function openModal(work) {
  document.getElementById('modal-img').src = thumbPath(work);
  document.getElementById('modal-img').alt = work.title || work.id;
  document.getElementById('modal-title').textContent = work.title || `Work ${work.id}`;

  // Artista: coluna esquerda, acima das tags.
  const artistListEl = document.getElementById('modal-artist');
  artistListEl.innerHTML = '';
  const artistInfo = DATA.artistIndex[work.userId];
  const isArtistActive = state.artistId === work.userId;
  artistListEl.appendChild(
    renderFilterItem({
      label: artistInfo ? artistInfo.userName : work.userName,
      count: artistInfo ? artistInfo.workIds.length : 0,
      isActive: isArtistActive,
      onNameClick: () => {
        closeModal();
        replaceQueryWithArtist(work.userId);
      },
      onToggleClick: () => {
        closeModal();
        isArtistActive ? clearArtist() : setArtist(work.userId);
      },
    })
  );

  // Tags: coluna esquerda, abaixo do artista. Mostra tradução em evidência
  // (com o nome original como subtítulo) quando existir.
  const tagsListEl = document.getElementById('modal-tags');
  tagsListEl.innerHTML = '';
  for (const tagIdx of work.tags) {
    const isTagActive = state.tags.includes(tagIdx);
    const count = countArtistTagIntersection(work.userId, tagIdx);
    const original = tagOriginalName(tagIdx);
    const translation = TAG_TRANSLATIONS[original];
    tagsListEl.appendChild(
      renderFilterItem({
        label: translation || original,
        subtitle: translation ? original : null,
        count,
        isActive: isTagActive,
        onNameClick: () => {
          closeModal();
          replaceQueryWithTag(tagIdx);
        },
        onToggleClick: () => {
          closeModal();
          isTagActive ? removeTag(tagIdx) : addTag(tagIdx);
        },
      })
    );
  }

  renderModalDetails(work);

  document.getElementById('modal-overlay').classList.remove('hidden');
}

// Cria um bloco titulado (mesmo estilo visual de "Tags"/"Artista") dentro da
// coluna de detalhes do modal.
function modalDetailBlock(title, contentEl) {
  return el('div', { className: 'filter-block' }, [
    el('h4', { className: 'filter-title', text: title }),
    contentEl,
  ]);
}

// content pode ser uma string simples (vira <span class="meta-value">) ou um
// elemento já pronto (ex: um <a> de link, também com classe meta-value).
function metaRow(label, content) {
  const valueEl =
    typeof content === 'string' ? el('span', { className: 'meta-value', text: content }) : content;
  return el('li', { className: 'meta-item' }, [el('span', { className: 'meta-label', text: label }), valueEl]);
}

function labeledValue(value, labelsMap) {
  const description = labelsMap[value] !== undefined ? labelsMap[value] : 'desconhecido';
  return `${value} — ${description}`;
}

function metaLink(text, url) {
  return el('a', {
    className: 'meta-value meta-link',
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer',
    text: text,
  });
}

// Monta o bloco "Detalhes" do modal: PageCount, AiType, IllustType, XRestrict,
// Sanity (se aplicável) e, ao final, links de referência pro Pixiv (Work ID,
// Artist ID). O bloco "Artista" agora fica na coluna esquerda (ver openModal).
function renderModalDetails(work) {
  const detailsEl = document.getElementById('modal-details');
  detailsEl.innerHTML = '';

  const metaList = el('ul', { className: 'meta-list' }, [
    metaRow('Work ID', metaLink(work.id, PIXIV_ARTWORK_URL(work.id))),
    metaRow('Artist ID', metaLink(work.userId, PIXIV_USER_URL(work.userId))),
    metaRow('PageCount', String(work.pageCount)),
    metaRow('AiType', labeledValue(work.aiType, AI_TYPE_LABELS)),
    metaRow('IllustType', labeledValue(work.illustType, ILLUST_TYPE_LABELS)),
    metaRow('XRestrict', labeledValue(work.xRestrict, X_RESTRICT_LABELS)),
    // sanity (sl): só mostra a linha se for diferente de 0.
    work.sl !== 0 ? metaRow('Sanity', labeledValue(work.sl, SANITY_LABELS)) : null,
  ]);
  detailsEl.appendChild(modalDetailBlock('Detalhes', metaList));
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

/* ==========================================================================
 * Tema (dark/light), com fallback localStorage -> cookie -> dark
 * ========================================================================== */

function readCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
}

function getSavedTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch (e) {
    /* localStorage indisponível, tenta cookie */
  }
  try {
    const v = readCookie(THEME_STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch (e) {
    /* cookie indisponível também */
  }
  return 'dark';
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return;
  } catch (e) {
    /* tenta cookie */
  }
  try {
    writeCookie(THEME_STORAGE_KEY, theme);
  } catch (e) {
    /* sem persistência possível; a escolha vale só pra sessão atual */
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-icon').innerHTML = theme === 'dark' ? '&#9789;' : '&#9728;';
}

function initTheme() {
  const theme = getSavedTheme();
  applyTheme(theme);

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  });
}

/* ==========================================================================
 * Autocomplete: UI (render, seleção, teclado)
 * ========================================================================== */

function hideAutocomplete() {
  document.getElementById('autocomplete-dropdown').classList.add('hidden');
  highlightedIndex = -1;
  currentSuggestionsFlat = [];
}

function showAutocomplete() {
  document.getElementById('autocomplete-dropdown').classList.remove('hidden');
}

function isAutocompleteOpen() {
  return !document.getElementById('autocomplete-dropdown').classList.contains('hidden');
}

// Cria um <li> de sugestão, reaproveitando o mesmo visual de renderFilterItem,
// mas ligado às ações específicas do autocomplete (não às da sidebar).
function buildSuggestionItem(entry) {
  const li = renderFilterItem({
    label: entry.label,
    subtitle: entry.subtitle,
    count: entry.count,
    isActive: entry.isActive,
    onNameClick: () => {
      if (entry.type === 'tag') autocompleteSelectTagName(entry.tagIdx);
      else autocompleteSelectArtistName(entry.userId);
    },
    onToggleClick: () => {
      if (entry.type === 'tag') autocompleteToggleTag(entry.tagIdx, entry.isActive);
      else autocompleteToggleArtist(entry.userId, entry.isActive);
    },
  });
  return li;
}

function renderAutocomplete(result) {
  const artistsSection = document.getElementById('ac-artists-section');
  const tagsSection = document.getElementById('ac-tags-section');
  artistsSection.innerHTML = '';
  tagsSection.innerHTML = '';
  currentSuggestionsFlat = [];
  highlightedIndex = -1;

  if (result.artists.length > 0) {
    artistsSection.appendChild(el('div', { className: 'ac-section-title', text: 'Artistas' }));
    const list = el('ul', { className: 'filter-list' });
    for (const a of result.artists) {
      const isActive = state.artistId === a.userId;
      const entry = {
        type: 'artist',
        userId: a.userId,
        label: a.info.userName,
        count: a.info.workIds.length,
        isActive,
      };
      const li = buildSuggestionItem(entry);
      currentSuggestionsFlat.push({ ...entry, el: li });
      list.appendChild(li);
    }
    artistsSection.appendChild(list);
  }

  if (result.tags.length > 0) {
    tagsSection.appendChild(el('div', { className: 'ac-section-title', text: 'Tags' }));
    const list = el('ul', { className: 'filter-list' });
    for (const t of result.tags) {
      const original = tagOriginalName(t.tagIdx);
      const translation = TAG_TRANSLATIONS[original];
      const isActive = state.tags.includes(t.tagIdx);
      const entry = {
        type: 'tag',
        tagIdx: t.tagIdx,
        label: translation || original,
        subtitle: translation ? original : null,
        count: DATA.tagIndex[t.tagIdx] ? DATA.tagIndex[t.tagIdx].length : 0,
        isActive,
      };
      const li = buildSuggestionItem(entry);
      currentSuggestionsFlat.push({ ...entry, el: li });
      list.appendChild(li);
    }
    tagsSection.appendChild(list);
  }
}

function moveHighlight(delta) {
  if (currentSuggestionsFlat.length === 0) return;
  if (highlightedIndex >= 0) currentSuggestionsFlat[highlightedIndex].el.classList.remove('highlighted');
  highlightedIndex = Math.min(Math.max(highlightedIndex + delta, 0), currentSuggestionsFlat.length - 1);
  const entry = currentSuggestionsFlat[highlightedIndex];
  entry.el.classList.add('highlighted');
  entry.el.scrollIntoView({ block: 'nearest' });
}

// Substitui só o ÚLTIMO token (parcial, sendo digitado) do campo de busca
// pelo texto completo escolhido, preservando o texto cru dos tokens
// anteriores exatamente como foram digitados. NÃO mexe no state/resultado.
function completeCurrentToken(replacementText) {
  const input = document.getElementById('search-input');
  const tokens = input.value.split(/\s+/);
  let lastIdx = tokens.length - 1;
  while (lastIdx >= 0 && tokens[lastIdx] === '') lastIdx--;

  let newTokens;
  if (lastIdx < 0) {
    newTokens = [replacementText];
  } else {
    newTokens = tokens.slice(0, lastIdx);
    newTokens.push(replacementText);
  }
  input.value = newTokens.join(' ') + ' ';
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
}

// Aplica a busca IMEDIATAMENTE: faz parse de tudo que já estava digitado
// antes do token parcial atual (preservando essas tags/artista), soma/remove
// a tag ou artista da sugestão, e commit. O dropdown continua aberto.
function commitPriorTokensPlusToggle(action) {
  const input = document.getElementById('search-input');
  const tokens = input.value.split(/\s+/).filter(Boolean);
  tokens.pop(); // descarta o fragmento parcial sendo digitado
  const parsed = parseQueryText(tokens.join(' '));

  let nextTags = parsed.tags.filter((t) => t !== INVALID_TAG_INDEX);
  let nextArtist = parsed.artistId === INVALID_ARTIST_ID ? null : parsed.artistId;

  if (action.type === 'tag') {
    if (action.isActive) nextTags = nextTags.filter((t) => t !== action.tagIdx);
    else if (!nextTags.includes(action.tagIdx)) nextTags.push(action.tagIdx);
  } else {
    nextArtist = action.isActive ? null : action.userId;
  }

  state.tags = nextTags;
  state.artistId = nextArtist;
  state.page = 1;
  commitStateChange(); // renderUI() já reescreve o campo de busca via serializeQueryText()

  hideAutocomplete(); // esconde a lista; volta a aparecer assim que digitar de novo
  document.getElementById('search-input').focus();
}

function autocompleteToggleTag(tagIdx, isActive) {
  commitPriorTokensPlusToggle({ type: 'tag', tagIdx, isActive });
}

function autocompleteToggleArtist(userId, isActive) {
  commitPriorTokensPlusToggle({ type: 'artist', userId, isActive });
}

function autocompleteSelectTagName(tagIdx) {
  completeCurrentToken(tagOriginalName(tagIdx));
  hideAutocomplete();
}

function autocompleteSelectArtistName(userId) {
  completeCurrentToken('u/' + DATA.artistIndex[userId].userName + '/');
  hideAutocomplete();
}

function triggerToggleForHighlighted() {
  const entry = currentSuggestionsFlat[highlightedIndex];
  if (!entry) return;
  if (entry.type === 'tag') autocompleteToggleTag(entry.tagIdx, entry.isActive);
  else autocompleteToggleArtist(entry.userId, entry.isActive);
}

function triggerSelectNameForHighlighted() {
  const entry = currentSuggestionsFlat[highlightedIndex];
  if (!entry) return;
  if (entry.type === 'tag') autocompleteSelectTagName(entry.tagIdx);
  else autocompleteSelectArtistName(entry.userId);
}

function onSearchInputChanged(e) {
  const tokens = e.target.value.split(/\s+/);
  const trailing = tokens[tokens.length - 1] || '';
  if (!trailing) {
    hideAutocomplete();
    return;
  }
  const result = computeAutocomplete(trailing);
  if (!result) {
    hideAutocomplete();
    return;
  }
  renderAutocomplete(result);
  showAutocomplete();
}

function onSearchInputKeydown(e) {
  if (e.key === 'Escape') {
    if (isAutocompleteOpen()) {
      e.preventDefault();
      e.stopPropagation();
      hideAutocomplete();
    }
    return;
  }

  if (!isAutocompleteOpen()) return; // deixa o comportamento normal do input/form

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    moveHighlight(1);
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    moveHighlight(-1);
    return;
  }
  if (e.key === ' ' && highlightedIndex >= 0) {
    e.preventDefault();
    triggerToggleForHighlighted();
    return;
  }
  if (e.key === 'Enter' && highlightedIndex >= 0) {
    e.preventDefault();
    triggerSelectNameForHighlighted();
    return;
  }
  // Enter sem item destacado: deixa o submit normal do form acontecer.
}

// Fecha o dropdown ao clicar fora dele e fora do input (mas cliques DENTRO
// do dropdown, como nos botões +/- ou no nome, não devem fechá-lo aqui —
// isso já é decidido pelas próprias ações de cada item).
function onDocumentClickForAutocomplete(e) {
  if (!isAutocompleteOpen()) return;
  const dropdown = document.getElementById('autocomplete-dropdown');
  const input = document.getElementById('search-input');
  if (dropdown.contains(e.target) || e.target === input) return;
  hideAutocomplete();
}

/* ==========================================================================
 * Atalhos de teclado para navegação de página (fora de campos de digitação)
 * ========================================================================== */

function isTypingContext() {
  const ae = document.activeElement;
  if (!ae) return false;
  const tag = ae.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  const dropdown = document.getElementById('autocomplete-dropdown');
  if (dropdown && dropdown.contains(ae)) return true;
  return false;
}

function onGlobalKeydownForPageNav(e) {
  if (isTypingContext()) return;
  const key = e.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') {
    e.preventDefault();
    goToPage(Math.max(1, state.page - 1));
  } else if (key === 'arrowright' || key === 'd') {
    e.preventDefault();
    goToPage(state.page + 1); // renderUI() já limita ao total de páginas
  }
}

/* ==========================================================================
 * Inicialização
 * ========================================================================== */

function initEventListeners() {
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('search-input').value;
    const parsed = parseQueryText(text);
    state.tags = parsed.tags;
    state.artistId = parsed.artistId;
    state.page = 1;
    hideAutocomplete();
    commitStateChange();
  });

  document.getElementById('clear-search').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    state.tags = [];
    state.artistId = null;
    state.page = 1;
    hideAutocomplete();
    commitStateChange();
    document.getElementById('search-input').focus();
  });

  document.getElementById('search-input').addEventListener('input', onSearchInputChanged);
  document.getElementById('search-input').addEventListener('keydown', onSearchInputKeydown);
  document.addEventListener('click', onDocumentClickForAutocomplete);
  document.addEventListener('keydown', onGlobalKeydownForPageNav);

  document.getElementById('restrict-filter').addEventListener('change', (e) => {
    state.restrict = RESTRICT_FILTERS.includes(e.target.value) ? e.target.value : DEFAULT_RESTRICT;
    state.page = 1;
    commitStateChange();
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Botão "voltar"/"avançar" do navegador: relê o state da URL e só re-renderiza
  // (NÃO chama commitStateChange, senão empilharia uma entrada de histórico nova
  // a cada "voltar", quebrando a navegação).
  window.addEventListener('popstate', () => {
    stateFromURL();
    renderUI();
  });
}

async function main() {
  initTheme();

  try {
    // Traduções de tags são opcionais (loadTagTranslations nunca rejeita),
    // então Promise.all só falha de verdade se o data principal falhar.
    const [data, translations] = await Promise.all([loadDataScript(), loadTagTranslations()]);
    buildIndices(data, translations);
  } catch (err) {
    document.getElementById('loading-overlay').innerHTML =
      '<p style="color:#ef4444;max-width:480px;text-align:center;padding:0 20px;">' +
      'Erro ao carregar os dados: ' +
      (err && err.message ? err.message : String(err)) +
      '</p>';
    return;
  }

  stateFromURL();
  initEventListeners();

  document.getElementById('loading-overlay').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  renderUI(); // carga inicial: não empilha histórico, a URL já é a atual
}

main();
