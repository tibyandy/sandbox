console.log('[PXV] observer.js');
(function() {
  const PXV = window.PXV = window.PXV || { log: console.log.bind(null), error: console.error.bind(null) }
  const trackedElements = new Set(); // Evita logar o mesmo elemento mais de uma vez
  let count = 0

  PXV.assignThumbData = function (illustId, illustData, targetParent, targetLi) {
    if (illustData) {
      illustData.domParent = targetParent;
      illustData.domLi = targetLi;
      if (!targetLi.querySelector('.crx_work_tags')) {
        targetLi.classList.add('crx_work_thumbnail');
        // PXV.log("[PXV.observer] - assignThumbData add:crx_work_thumbnail", ++count, '-', illustId, (illustData ? (illustData.alt || illustData) : 'UNKNOWN'));
        const el = document.createElement('ul');
        el.className = 'crx_work_tags';
        el.innerHTML = PXV.WorkResults[illustId].tags.filter(t => t != ('R-18') && (t != 'R-18G')).map(t => `<li>${t}`).join('');
        targetLi.append(el);
      } else {
        PXV.log("[PXV.observer] - assignThumbData add:crx_work_thumbnail já executado para essa img");
      }
    } else {
      PXV.error("[PXV.observer] - assignThumbData - Dados não encontrados: #" + illustId, PXV.ex = targetParent);
    }
  }

  // Função para processar e logar o elemento pai correto
  PXV.checkIfImgIsThumb = function (element) {
    const targetParent = element.closest('[data-ga4-label]');
    if (targetParent && !trackedElements.has(targetParent)) {
      const targetLi = element.closest('li');
      trackedElements.add(targetParent);
      const { attributes } = targetParent
      const illustId = attributes['data-gtm-value']?.value
      const userId = attributes['data-gtm-user-id']?.value
      const illustData = PXV.WorkResults?.[illustId]
      PXV.assignThumbData(illustId, illustData, targetParent, targetLi);
    }
  }

  PXV.setBookmarksGrid = function (ul) {
    PXV.log('[PXV.observer] - setBookmarksGrid', ul);
    ul.classList.add('crx_bookmarks_grid')
  }

  // 1. Captura os elementos que já estão na página no carregamento inicial
  const imgs = document.querySelectorAll(`[data-ga4-label] img`)
  PXV.log(`[PXV.observer] Captura inicial de '[data-ga4-label] img':`, [...imgs].length, 'ocorrências');
  imgs.forEach(PXV.checkIfImgIsThumb);

  // 2. Monitora a inserção de novos elementos em tempo real
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        // 1. Processa a lógica anterior das imagens (suporta se o nó for um <img> ou um container com <img>)
        if (node.nodeName === 'IMG') {
          PXV.checkIfImgIsThumb(node);
          return;
        }
        
        node.querySelectorAll?.('img').forEach((img) => PXV.checkIfImgIsThumb(img));

        // 2. Lógica para a lista de bookmarks (crx_bookmarks_grid)
        const ulBookGrid = 'ul:not(.crx_bookmarks_grid):has(.crx_work_thumbnail)';
        document.querySelectorAll?.(ulBookGrid).forEach(PXV.setBookmarksGrid);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
