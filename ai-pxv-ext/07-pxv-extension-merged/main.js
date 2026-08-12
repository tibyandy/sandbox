console.log('interceptor.js')

;(function() {
  const CRX = window.CRX ||= {
    get now() { return (performance.now() / 1000).toFixed(4) },
    originalLog: console.log
  };

  Object.defineProperties(console, {
    log: { get: () =>
      CRX.originalLog.bind(console, `%c${CRX.now}%c %s`, 'color: #00cc99; font-weight: bold', 'color: auto'),
      configurable: true, enumerable: true },
    error: { get: () =>
      CRX.originalLog.bind(console, `%c${CRX.now}%c %s`, 'color: #cc0099; font-weight: bold', 'color: #ffaaaa;'),
      configurable: true, enumerable: true }
  });
  CRX.log = console.log.bind(console);
  CRX.error = console.error.bind(console);
  Object.freeze(console);

  console.log('[CRX] interceptor.js');

  CRX.FetchResults = CRX.FetchResults || [];
  CRX.WorkResults = CRX.WorkResults || {};

  CRX.originalFetch = window.fetch;

  window.fetch = CRX.fetch = async function(...args) {
    const url = args[0];

    const response = await CRX.originalFetch.apply(this, args);

    if (!(typeof url === 'string' && url.startsWith('/'))) {
      return response;
    }

    try {
      const clonedResponse = response.clone();
      let responseBody = null;

      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await clonedResponse.json();
      } else {
        responseBody = await clonedResponse.text();
      }

      const result = {
        url: response.url || url,
        responseBody: responseBody,
        httpStatus: response.status
      }
      CRX.log('[CRX.fetch] - CRX.FetchResults <--', url, response.status, responseBody)

      CRX.FetchResults.push(result);
      const works = responseBody?.body?.works
      if (works) {
        CRX.log('[CRX.fetch] - CRX.WorkResults <-- ', works.length, 'ilustrações')
        Object.assign(CRX.WorkResults, Object.fromEntries(works.map(({ id, ...obj }) => [id, obj])))
      }
    } catch (err) {
      console.error('[CRX.fetch] - Erro:', err);
    }

    return response;
  };

  CRX.log("[CRX.interceptor] Ativo para window.fetch");
})();

// ==================== SHEET DATABASE ====================
console.log('[CRX] SheetDatabase 1.1.2');

(async () => {
	const CRX = window.CRX = window.CRX || { log: console.log.bind(null), error: console.error.bind(null) }

	const fetch = CRX.originalFetch || window.fetch

	const instance = { webAppUrl: null, data: null }

	class SheetDatabase {
		constructor(webAppUrl) {
			instance.webAppUrl = webAppUrl;
			instance.data = {};
		}

		get data() {
			return instance.data;
		}

		async load() {
			try {
				const response = await fetch(instance.webAppUrl);
				if (!response.ok) {
					throw new Error(`Erro ao carregar dados: ${response.statusText}`);
				}
				instance.data = await response.json();
				return instance.data;
			} catch (error) {
				console.error("SheetDatabase.load() falhou:", error);
				throw error;
			}
		}

		async put(aba, chave, valorObj = {}) {
			if (!instance.data[aba]) {
				instance.data[aba] = {};
			}

			const mergedRecord = {
				...(instance.data[aba][chave] || {}),
				...valorObj
			};
			instance.data[aba][chave] = mergedRecord;

			try {
				const response = await fetch(instance.webAppUrl, {
					method: "POST",
					mode: "cors",
					redirect: "follow",
					headers: {
						"Content-Type": "text/plain;charset=utf-8"
					},
					body: JSON.stringify({
						action: "put",
						sheetName: aba,
						key: chave,
						values: mergedRecord
					})
				});

				const resJson = await response.json();
				if (resJson.status !== "success") {
					throw new Error(resJson.message || "Erro desconhecido ao salvar.");
				}
			} catch (error) {
				console.error(`SheetDatabase.put("${aba}", "${chave}") falhou:`, error);
				throw error;
			}
		}

		get(aba, chave) {
			if (!instance.data[aba]) return undefined;
			if (chave === undefined) return instance.data[aba];
			return instance.data[aba][chave];
		}

		async putMany(aba, items) {
			if (!instance.data[aba]) instance.data[aba] = {};

			items.forEach(({ key, values }) => {
				instance.data[aba][key] = {
					...(instance.data[aba][key] || {}),
					...values
				};
			});

			try {
				const response = await fetch(instance.webAppUrl, {
					method: "POST",
					mode: "cors",
					redirect: "follow",
					headers: {
						"Content-Type": "text/plain;charset=utf-8"
					},
					body: JSON.stringify({
						action: "putMany",
						sheetName: aba,
						items: items.map(({ key, values }) => ({
							key,
							values: instance.data[aba][key]
						}))
					})
				});

				const resJson = await response.json();
				if (resJson.status !== "success") {
					throw new Error(resJson.message || "Erro ao salvar o lote.");
				}
			} catch (error) {
				console.error(`SheetDatabase.putMany("${aba}") falhou:`, error);
				throw error;
			}
		}
	}

	Object.assign(CRX, { db: new SheetDatabase('https://script.google.com/macros/s/AKfycbyD10xPFTq5hDtkR1Y2zHPEJbVfP7S_iQd3RscuMdxhGMrhQ0qjjQYk-NmTYwRw5pD_6w/exec') })
	console.log('[CRX] db starting')
	await CRX.db.load()
	console.log('[CRX] db', CRX.db)
})()

// ==================== OBSERVER (aguarda document.body) ====================
function _initObserver() {
  console.log('[CRX] observer.js');

  let lastUrl = location.href;
  const SPECIAL_USER_ID = '5986322'

  const ROUTES = {
    '^/(?:[a-z]{2}/)?artworks/\\d+#.+': '_art _slideshow',
    '^/(?:[a-z]{2}/)?artworks/\\d+': '_art _cover',

    '^/bookmark_detail\\.php': '_artfav _detail',
    '^/bookmark_add\\.php': '_artfav _edit',
    '^/history\\.php': '_my _hist',

    '^/dashboard': '_my _dash',
    '^/following/collections': '_myfol _cols',
    '^/bookmark_new_illust(_r18)?\\.php': '_myfol _works',
    '^/mypixiv_new_illust\\.php': '_mypix _works',
    '^/following/watchlist/manga': '_mywatch _mangas',
    '^/following/watchlist/novels': '_mywatch _novels',

    '^/new_illust(_r18)?\\.php': '_recent _works',

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

    '^/(?:[a-z]{2}/)?tags/[^/]+/illustrations': '_search _illusts',
    '^/(?:[a-z]{2}/)?tags/[^/]+/manga': '_search _mangas',
    '^/(?:[a-z]{2}/)?tags/[^/]+/artworks': '_search _works',
    '^/(?:[a-z]{2}/)?tags/[^/]+': '_search _tags',
    '^/search': '_search _words',

    '^/discovery': '_top _discovery',
    '^/novel': '_top _novels',
    '^/cate_r18\\.php': '_top _recom _illusts',
    '^/illustration': '_top _recom _illusts',
    '^/manga\\?r=1': '_top _recom _mangas',
    '^/manga': '_top _recom _mangas',
    '^/(?:[a-z]{2}/)?$': '_top _home'
  };

  const ALL_CRX_BODY_CLASSES = new Set(
    [...Object.values(ROUTES).flatMap(classList => classList.split(' ')), 'ò']
  );

  function updateBodyClassesForCurrentUrl() {
    const currentPath = location.pathname + location.search + location.hash;

    const matchedPattern = Object.keys(ROUTES).find(pattern =>
      new RegExp(pattern).test(currentPath)
    );

    ALL_CRX_BODY_CLASSES.forEach(cls => document.body.classList.remove(cls));

    if (matchedPattern) {
      const classesToAdd = ROUTES[matchedPattern].split(' ');
      if (currentPath.includes(`users/${SPECIAL_USER_ID}/`)) classesToAdd.push('_my')
      document.body.classList.add('ò', ...classesToAdd);
    }
  }

  const CRX = window.CRX = window.CRX || { get now () { return Performance.now() }, log: console.log.bind(this.now, null), error: console.error.bind(this.now, null) }
  const trackedElements = new Set();
  let count = 0

  updateBodyClassesForCurrentUrl();

  CRX.assignThumbData = function (illustId, illustData, targetParent, targetLi) {
    if (illustData) {
      illustData.domParent = targetParent;
      illustData.domLi = targetLi;
      if (!targetLi?.querySelector('.crx_work_tags')) {
        targetLi.classList.add('crx_work_thumbnail');
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

  const imgs = document.querySelectorAll(`[data-ga4-label] img`)
  CRX.log(`[CRX.observer] Captura inicial de '[data-ga4-label] img':`, [...imgs].length, 'ocorrências');
  imgs.forEach(CRX.checkIfImgIsThumb);

  const observer = new MutationObserver((mutations) => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      updateBodyClassesForCurrentUrl();
    }

    const ulBookGrid = 'ul:not(.crx_bookmarks_grid):has(.crx_work_thumbnail)';
    document.querySelectorAll?.(ulBookGrid).forEach(CRX.setBookmarksGrid);

    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        node.classList.add('è')

        if (node.nodeName === 'IMG') {
          CRX.checkIfImgIsThumb(node);
          return;
        }

        node.querySelectorAll?.('img').forEach((img) => CRX.checkIfImgIsThumb(img));
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  currentPageTagsNotYetTranslated = async () => {
    console.log('currentPageTagsNotYetTranslated()')

    currentPageTagsWithMultipleOccurrencesSortedByCount = Object.entries(
      Object.entries(CRX.WorkResults)
        .flatMap( ([illustId, {tags}]) => tags.map(tag => [tag, illustId]) )
        .reduce(
          (r, [tag, illustId]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }),
          {}
        )
    ).sort( ([,a],[,b])=>b.length-a.length )
    .filter( ([,b]) => b.length > 1 )

    pageTagsWithEnTranslations = currentPageTagsWithMultipleOccurrencesSortedByCount.map(
      ([ tag, ids ]) => [tag, CRX.db.get('tags', tag)?.en || CRX.db.get('tags', tag)?.ro, ids])

    pageTagsWithoutTranslations = pageTagsWithEnTranslations.filter(([,b]) => !b)

    console.log('pageTagsWithoutTranslations', JSON.stringify(pageTagsWithoutTranslations, null, 2))

    illustsWithMostTagsUntranslated = Object.entries(pageTagsWithoutTranslations.flatMap(([,,ids]) => ids).reduce(
          (r, illustId) => Object.assign(r, { [illustId]: (r[illustId] || 0) + 1 }),
          {}
        )).sort(([,a],[,b])=>b-a).slice(0, 6).map(([a])=>a)

    console.log('illustsWithMostTagsUntranslated', JSON.stringify(illustsWithMostTagsUntranslated, null, 2))

    url = 'https://www.pixiv.net/ajax/tags/frequent/illust?lang=en' +
      illustsWithMostTagsUntranslated.map(i => `&ids%5B%5D=${i}`).join('')

    console.log('url', url)

    result = await fetch(url, {
      "headers": {
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
        "baggage": "sentry-environment=production,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=28cf208e8e054cc9bb99f2b6cae0572c,sentry-sampled=false,sentry-sample_rand=0.6458771114406853,sentry-sample_rate=0.0001",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Brave\";v=\"151\", \"Chromium\";v=\"151\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sentry-trace": "28cf208e8e054cc9bb99f2b6cae0572c-8f4f4b5d618bb16b-0",
        "x-user-id": "5986322"
      },
      "referrer": document.URL,
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(x => x.json())

    translations = (result?.body || []).map(o => [o?.tag, o?.tag_translation])

    console.log('translations', JSON.stringify(translations, null, 2))

    const itemsToSave = translations.map(([jp, en]) => ({
      key: jp,
      values: { en }
    }));

    await CRX.db.putMany('tags', itemsToSave);

    const translated = translations.map(([jp]) => CRX.db.get('tags', jp));

    console.log('translated', translated)
  }

  setTimeout(currentPageTagsNotYetTranslated, 5000)
}

if (document.body) {
  _initObserver();
} else {
  document.addEventListener('DOMContentLoaded', _initObserver);
}



