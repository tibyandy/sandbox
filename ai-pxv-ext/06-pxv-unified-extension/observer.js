console.log('[CRX] observer.js');
(function() {
  let lastUrl = location.href;
  const SPECIAL_USER_ID = '5986322'

  // Objeto onde a CHAVE é a String do Regex e o VALOR é a String das classes (separadas por espaço)
  const ROUTES = {
    // Artwork
    '^/(?:[a-z]{2}/)?artworks/\\d+#.+': '_art _slideshow',
    '^/(?:[a-z]{2}/)?artworks/\\d+': '_art _cover',
    
    // Bookmarks / Edits antigos
    '^/bookmark_detail\\.php': '_artfav _detail',
    '^/bookmark_add\\.php': '_artfav _edit',
    '^/history\\.php': '_my _hist',
    
    // Dashboard & Followed
    '^/dashboard': '_my _dash',
    '^/following/collections': '_myfol _cols',
    '^/bookmark_new_illust(_r18)?\\.php': '_myfol _works',
    '^/mypixiv_new_illust\\.php': '_mypix _works',
    '^/following/watchlist/manga': '_mywatch _mangas',
    '^/following/watchlist/novels': '_mywatch _novels',
    
    // Recent
    '^/new_illust(_r18)?\\.php': '_recent _works',
    
    // User Profile, Bookmarks e Obras
    '^/(?:[a-z]{2}/)?users/\\d+/bookmarks/collections': '_user _favs _cols',
    '^/(?:[a-z]{2}/)?users/\\d+/bookmarks/novels': '_user _favs _novels',
    '^/(?:[a-z]{2}/)?users/\\d+/bookmarks/artworks': '_user _favs',
    '^/(?:[a-z]{2}/)?users/\\d+/following': '_user _fols',
    '^/(?:[a-z]{2}/)?users/\\d+/illustrations': '_user _illusts',
    '^/(?:[a-z]{2}/)?users/\\d+/manga': '_user _mangas',
    '^/(?:[a-z]{2}/)?users/\\d+/request': '_user _reqs',
    '^/user/\\d+/series/\\d+': '_user _series',
    '^/(?:[a-z]{2}/)?users/\\d+/artworks': '_user _works',
    '^/(?:[a-z]{2}/)?users/\\d+$': '_user _home',

    // Search & Tags
    '^/(?:[a-z]{2}/)?tags/[^/]+/illustrations': '_search _illusts',
    '^/(?:[a-z]{2}/)?tags/[^/]+/manga': '_search _mangas',
    '^/(?:[a-z]{2}/)?tags/[^/]+/artworks': '_search _works',
    '^/(?:[a-z]{2}/)?tags/[^/]+': '_search _tags',
    '^/search': '_search _words',

    // Discovery & Top Recommendations
    '^/discovery': '_top _discovery',
    '^/novel': '_top _novels',
    '^/cate_r18\\.php': '_top _recom _illusts',
    '^/illustration': '_top _recom _illusts',
    '^/manga\\?r=1': '_top _recom _mangas',
    '^/manga': '_top _recom _mangas',
    '^/(?:[a-z]{2}/)?$': '_top _home'
  };

  // Mapeia dinamicamente todas as classes do objeto para sabermos o que limpar depois
  const ALL_CRX_BODY_CLASSES = new Set(
    [...Object.values(ROUTES).flatMap(classList => classList.split(' ')), 'ò']
  );

  /** Identifica a rota atual e atualiza as classes do body. */
  function updateBodyClassesForCurrentUrl() {
    const currentPath = location.pathname + location.search + location.hash;

    // Procura a primeira chave Regex que casa com a URL atual
    const matchedPattern = Object.keys(ROUTES).find(pattern => 
      new RegExp(pattern).test(currentPath)
    );

    // 1. Remove apenas as classes que a extensão gerencia
    ALL_CRX_BODY_CLASSES.forEach(cls => document.body.classList.remove(cls));

    // 2. Adiciona as novas se encontrou uma rota equivalente
    if (matchedPattern) {
      const classesToAdd = ROUTES[matchedPattern].split(' ');
      if (currentPath.includes(`users/${SPECIAL_USER_ID}/`)) classesToAdd.push('_my')
      document.body.classList.add('ò', ...classesToAdd);
    }
  }  

  const CRX = window.CRX = window.CRX || { get now () { return Performance.now() }, log: console.log.bind(this.now, null), error: console.error.bind(this.now, null) }
  const trackedElements = new Set(); // Evita logar o mesmo elemento mais de uma vez
  let count = 0

  // Executa na carga inicial da página
  if (document.body) {
    CRX.log('[CRX.observer] docbody')
    updateBodyClassesForCurrentUrl();
  } else {
    const bodyObserver = setInterval(() => {
      CRX.log('[CRX.observer] not docbody')
      if (!document.body) return
      CRX.log('[CRX.observer] docbody')
      updateBodyClassesForCurrentUrl();
      clearInterval(bodyObserver);
    }, 16);
  }

  CRX.assignThumbData = function (illustId, illustData, targetParent, targetLi) {
    if (illustData) {
      illustData.domParent = targetParent;
      illustData.domLi = targetLi;
      if (!targetLi?.querySelector('.crx_work_tags')) {
        targetLi.classList.add('crx_work_thumbnail');
        // CRX.log("[CRX.observer] - assignThumbData add:crx_work_thumbnail", ++count, '-', illustId, (illustData ? (illustData.alt || illustData) : 'UNKNOWN'));
        const el = document.createElement('ul');
        el.className = 'crx_work_tags';
        el.innerHTML = CRX.WorkResults[illustId].tags.filter(t => t != ('R-18') && (t != 'R-18G')).map(t => {
          const tags = CRX?.Tags[t[0]]?.[t] || ['?']
          return `<li class="crx_tag_entry">${!tags[1] ? '' : ('<span class="crx_class">&gt;' + tags.slice(1).join('>') + '</span>')} <span class="crx_en">${tags[0]}</span> <span class="crx_ja">#${t}</span>`
        }).join('');
        targetLi.append(el);
      } else {
        CRX.log("[CRX.observer] - assignThumbData add:crx_work_thumbnail já executado para essa img");
      }
    } else {
      CRX.log("[CRX.observer] - assignThumbData - Dados não encontrados: #" + illustId, CRX.ex = targetParent);
    }
  }

  // Função para processar e logar o elemento pai correto
  CRX.checkIfImgIsThumb = function (element) {
    const targetParent = element.closest('[data-ga4-label]');
    if (targetParent && !trackedElements.has(targetParent)) {
      const targetLi = element.closest('li');
      trackedElements.add(targetParent);
      const { attributes } = targetParent
      const illustId = attributes['data-gtm-value']?.value
      const userId = attributes['data-gtm-user-id']?.value
      const illustData = CRX.WorkResults?.[illustId]
      CRX.assignThumbData(illustId, illustData, targetParent, targetLi);
    }
  }

  CRX.setBookmarksGrid = function (ul) {
    CRX.log('[CRX.observer] - setBookmarksGrid', ul);
    ul.classList.add('crx_bookmarks_grid')
  }

  // 1. Captura os elementos que já estão na página no carregamento inicial
  const imgs = document.querySelectorAll(`[data-ga4-label] img`)
  CRX.log(`[CRX.observer] Captura inicial de '[data-ga4-label] img':`, [...imgs].length, 'ocorrências');
  imgs.forEach(CRX.checkIfImgIsThumb);

  // 2. Monitora a inserção de novos elementos em tempo real
  const observer = new MutationObserver((mutations) => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      updateBodyClassesForCurrentUrl();
    }    

    // 2. Lógica para a lista de bookmarks (crx_bookmarks_grid)
    const ulBookGrid = 'ul:not(.crx_bookmarks_grid):has(.crx_work_thumbnail)';
    document.querySelectorAll?.(ulBookGrid).forEach(CRX.setBookmarksGrid);

    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        node.classList.add('è')

        // 1. Processa a lógica anterior das imagens (suporta se o nó for um <img> ou um container com <img>)
        if (node.nodeName === 'IMG') {
          CRX.checkIfImgIsThumb(node);
          return;
        }
        
        node.querySelectorAll?.('img').forEach((img) => CRX.checkIfImgIsThumb(img));
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
