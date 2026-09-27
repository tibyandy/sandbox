'use strict';

/* ==========================================================================
 * Configuração
 * ========================================================================== */

const DATA_SCRIPT_SRC = '../data/preprocess/20260924.js';
const THUMBS_BASE = '../data/thumbs';

const PAGE_SIZE = 18; // 6 colunas x 3 linhas
const TOP_TAGS_COUNT = 20; // X
const TOP_ARTISTS_COUNT = 15; // Z
const PAGINATION_WINDOW = 9; // números de página visíveis

const THEME_STORAGE_KEY = 'pxv-bookmark-theme';
const INVALID_TAG_INDEX = -1; // marcador de tag inexistente (garante 0 resultados)
const INVALID_ARTIST_ID = '__invalid__'; // marcador de artista inexistente

const AI_TYPE_LABELS = { 0: 'human-made?', 1: 'human-made', 2: 'AI generated' };
const ILLUST_TYPE_LABELS = { 0: 'illustration', 1: 'manga', 2: 'ugoira', 3: 'novel' };
const X_RESTRICT_LABELS = { 0: 'general', 1: 'R-18', 2: 'R-18G' };
const SANITY_LABELS = { 2: 'safe', 4: 'R-15', 6: 'R-18' };
const AI_TYPE_EMOJI = { 0: null, 1: '\u{1F9D1}', 2: '\u{1F916}' }; // 🧑 / 🤖 ; outros -> ❓

/* ==========================================================================
 * Estado global (fonte da verdade da UI)
 * ========================================================================== */

const state = {
  tags: [], // array de índices de tag (números), no tagDict
  artistId: null, // string (userId) ou null
  page: 1,
};

// Índices derivados, montados após o carregamento dos dados (ver buildIndices()).
let DATA = null;
let tagNameToIndex = null; // Map tagName -> index no tagDict
let artistNameToId = null; // Map userName -> userId
let allWorksSorted = null; // array de works, ordenado desc por id (cache)

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

function buildIndices(data) {
  DATA = data;

  tagNameToIndex = new Map();
  data.tagDict.forEach((tag, idx) => tagNameToIndex.set(tag, idx));

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
    const idx = tagNameToIndex.has(token) ? tagNameToIndex.get(token) : INVALID_TAG_INDEX;
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
 * URL (query params) <-> estado
 * ========================================================================== */

function stateToURL() {
  const params = new URLSearchParams();
  const q = serializeQueryText();
  if (q) params.set('q', q);
  if (state.page > 1) params.set('page', String(state.page));
  const qs = params.toString();
  const newUrl = window.location.pathname + (qs ? '?' + qs : '');
  history.replaceState(null, '', newUrl);
}

function stateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const parsed = parseQueryText(q);
  state.tags = parsed.tags;
  state.artistId = parsed.artistId;

  const pageParam = parseInt(params.get('page'), 10);
  state.page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
}

/* ==========================================================================
 * Filtro / agregação
 * ========================================================================== */

function computeFiltered() {
  const { tags, artistId } = state;

  return allWorksSorted.filter((work) => {
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
function renderFilterItem({ label, count, isActive, onNameClick, onToggleClick }) {
  const btn = el('button', {
    className: 'filter-toggle-btn ' + (isActive ? 'remove' : 'add'),
    text: isActive ? '\u2212' : '+',
    title: isActive ? 'Remover da busca' : 'Adicionar à busca',
    onClick: (e) => {
      e.stopPropagation();
      onToggleClick();
    },
  });

  const name = el('span', {
    className: 'filter-name',
    text: label,
    title: label,
    onClick: onNameClick,
  });

  const countEl = el('span', { className: 'filter-count', text: String(count) });

  return el('li', { className: 'filter-item' + (isActive ? ' active' : '') }, [name, countEl, btn]);
}

function renderSidebar(filteredWorks) {
  const { topTags, topArtists } = computeSidebarCounts(filteredWorks);

  const tagListEl = document.getElementById('tag-list');
  tagListEl.innerHTML = '';
  for (const [tagIdx, count] of topTags) {
    const isActive = state.tags.includes(tagIdx);
    const item = renderFilterItem({
      label: DATA.tagDict[tagIdx],
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

    // Emoji indicando o tipo de autoria: 🤖 (aiType=2), 🧑 (aiType=1),
    // nada (aiType=0), ❓ para qualquer outro valor não mapeado.
    let aiEmoji = null;
    if (work.aiType === 2 || work.aiType === 1) {
      aiEmoji = AI_TYPE_EMOJI[work.aiType];
    } else if (work.aiType !== 0) {
      aiEmoji = '\u2753'; // ❓
    }
    const aiBadge = aiEmoji ? el('span', { className: 'thumb-badge-ai', text: aiEmoji }) : null;

    const card = el(
      'div',
      { className: 'thumb-card', onClick: () => openModal(work) },
      [img, badge, aiBadge]
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
  document.getElementById('result-count').textContent = `${filtered.length} works encontrados`;

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

  const tagsListEl = document.getElementById('modal-tags');
  tagsListEl.innerHTML = '';
  for (const tagIdx of work.tags) {
    const isTagActive = state.tags.includes(tagIdx);
    const count = countArtistTagIntersection(work.userId, tagIdx);
    tagsListEl.appendChild(
      renderFilterItem({
        label: DATA.tagDict[tagIdx],
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

  renderModalMeta(work);

  document.getElementById('modal-overlay').classList.remove('hidden');
}

// Monta a lista de metadados (aiType, illustType, xRestrict, sanity) no modal.
function renderModalMeta(work) {
  const metaEl = document.getElementById('modal-meta');
  metaEl.innerHTML = '';

  const metaRow = (label, value, labelsMap) => {
    const description = labelsMap[value] !== undefined ? labelsMap[value] : 'desconhecido';
    return el('li', { className: 'meta-item' }, [
      el('span', { className: 'meta-label', text: label }),
      el('span', { className: 'meta-value', text: `${value} — ${description}` }),
    ]);
  };

  metaEl.appendChild(metaRow('aiType', work.aiType, AI_TYPE_LABELS));
  metaEl.appendChild(metaRow('illustType', work.illustType, ILLUST_TYPE_LABELS));
  metaEl.appendChild(metaRow('xRestrict', work.xRestrict, X_RESTRICT_LABELS));

  // sanity (sl): só mostra a linha se for diferente de 0.
  if (work.sl !== 0) {
    metaEl.appendChild(metaRow('sanity', work.sl, SANITY_LABELS));
  }
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
    const data = await loadDataScript();
    buildIndices(data);
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
