const CRX = window.CRX ||= {
  get now() { return (performance.now() / 1000).toFixed(4) },
  originalLog: console.log,
  FetchResults: [],
  WorkResults: {},
  originalFetch: window.fetch
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

console.log('[CRX] Main World Setup');

const SPECIAL_USER_ID = '5986322';

window.fetch = CRX.fetch = async function(...args) {
  const url = args[0];
  if (url.includes('pagead2.googlesyndication')
    || url.includes('micro.rubiconproject.com')
    || url.includes('cdn.onesignal.com')
    || url.includes('pixon.ads-pixiv')
    || url.includes('doubleclick.net')) {
      console.log('[CRX] Blocked Fetch', url)
      return {}
  }
  const response = await CRX.originalFetch.apply(this, args);

  if (!(typeof url === 'string' && url.startsWith('/'))) return response;

  try {
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers.get('content-type');
    const responseBody = await (
      (contentType && contentType.includes('application/json'))
        ? clonedResponse.json()
        : clonedResponse.text()
    );

    const result = { url: response.url || url, responseBody, httpStatus: response.status };

    if (!url.startsWith('/ajax/')) return // Ignore URL

    const works = responseBody?.body?.works;
    if (works) {
      CRX.log('[CRX.fetch] - CRX.WorkResults <-- ', works.length, 'ilustrações');
      Object.assign(CRX.WorkResults, Object.fromEntries(works.map(({ id, ...obj }) => [id, obj])));
      Object.assign(WorkResults, Object.fromEntries(works.map(({ id, ...obj }) => [id, obj])));
      if (!alreadyTranslating) translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1);
      setAllPageTags(works);
    } else {
      CRX.log('[CRX.fetch] - CRX.FetchResults <--', url, response.status, responseBody?.body || responseBody);
      CRX.FetchResults.push(result);
    }
  } catch (err) {
    console.error('[CRX.fetch] - Erro:', err);
  }

  return response;
};

function hasEasternChars(str) {
  return /[^\x00-\u024F\u0300-\u036F\u2000-\u2BFF\u2E00-\u2E7F\u3000-\u303F\uFE00-\uFE0F\uFF01-\uFF60\uFFE0-\uFFEE\u{1F000}-\u{1FFFF}\u{E0000}-\u{E007F}]/u.test(str);
}

// ==================== SHEET DATABASE ====================
const db = CRX.db = (function sheetDatabase () {
	console.log('[CRX] SheetDatabase 1.1.2');

	const _instance = { webAppUrl: null, data: null, loaded: false };

	class SheetDatabase {
		constructor(webAppUrl) {
			_instance.webAppUrl = webAppUrl;
			_instance.data = {};
		}

		get data() { return _instance.data; }
		get loaded() { return _instance.loaded; }

		async load() {
			try {
				const response = await fetch(_instance.webAppUrl);
				if (!response.ok) throw new Error(`Erro ao carregar dados: ${response.statusText}`);
				_instance.data = await response.json();
				_instance.loaded = true
				return _instance.data;
			} catch (error) {
				console.error("SheetDatabase.load() falhou:", error);
				_instance.loaded = error
				throw error;
			}
		}

		async put(aba, chave, valorObj = {}) {
			if (!_instance.data[aba]) _instance.data[aba] = {};
			const mergedRecord = { ...(_instance.data[aba][chave] || {}), ...valorObj };
			_instance.data[aba][chave] = mergedRecord;
			try {
				const response = await fetch(_instance.webAppUrl, {
					method: "POST", mode: "cors", redirect: "follow",
					headers: { "Content-Type": "text/plain;charset=utf-8" },
					body: JSON.stringify({ action: "put", sheetName: aba, key: chave, values: mergedRecord })
				});
				const resJson = await response.json();
				if (resJson.status !== "success") throw new Error(resJson.message || "Erro desconhecido ao salvar.");
			} catch (error) {
				console.error(`SheetDatabase.put("${aba}", "${chave}") falhou:`, error);
				throw error;
			}
		}

		get(aba, chave) {
			if (!_instance.data[aba]) return undefined;
			if (chave === undefined) return _instance.data[aba];
			return _instance.data[aba][chave];
		}

		async putMany(aba, items) {
			if (!_instance.data[aba]) _instance.data[aba] = {};
			items.forEach(({ key, values }) => {
				_instance.data[aba][key] = { ...(_instance.data[aba][key] || {}), ...values };
			});
			try {
				const response = await fetch(_instance.webAppUrl, {
					method: "POST", mode: "cors", redirect: "follow",
					headers: { "Content-Type": "text/plain;charset=utf-8" },
					body: JSON.stringify({
						action: "putMany", sheetName: aba,
						items: items.map(({ key }) => ({ key, values: _instance.data[aba][key] }))
					})
				});
				const resJson = await response.json();
				if (resJson.status !== "success") throw new Error(resJson.message || "Erro ao salvar o lote.");
			} catch (error) {
				console.error(`SheetDatabase.putMany("${aba}") falhou:`, error);
				throw error;
			}
		}
	}

	const db = new SheetDatabase('https://script.google.com/macros/s/AKfycbyD10xPFTq5hDtkR1Y2zHPEJbVfP7S_iQd3RscuMdxhGMrhQ0qjjQYk-NmTYwRw5pD_6w/exec');
	console.log('[CRX] db starting');
	db.load().then(() => console.log('[CRX] db loaded')).catch(() => {});

	return db
})();

// ==================== ROUTES + BODY CLASSES ====================

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
	[...Object.values(ROUTES).flatMap(c => c.split(' ')), '_body']
);

function updateBodyClassesForCurrentUrl() {
	const currentPath = location.pathname + location.search + location.hash;
	const matchedPattern = Object.keys(ROUTES).find(p => new RegExp(p).test(currentPath));
	ALL_CRX_BODY_CLASSES.forEach(cls => document.body.classList.remove(cls));
	if (matchedPattern) {
		const classesToAdd = ROUTES[matchedPattern].split(' ');
		if (currentPath.includes(`users/${SPECIAL_USER_ID}/`)) classesToAdd.push('_my');
		document.body.classList.add('_body', ...classesToAdd);
	}
}

// ==================== THUMBNAIL TRACKING ====================
const WorkResults = CRX.WorkResults;
const trackedElements = new Set();
let translatingTagsTimer = null;
let alreadyTranslating = false;
let allTagsToTranslate = 0
let allTagsTranslated = 0

function assignThumbData(illustId, illustData, targetParent, targetLi) {
	if (illustData) {
		illustData.domParent = targetParent;
		illustData.domLi = targetLi;
		if (!targetLi?.querySelector('.crx_work_tags') && targetLi) {
			targetLi.classList.add('crx_work_thumbnail');
			const el = document.createElement('ul');
			el.className = 'crx_work_tags';
			el.innerHTML = WorkResults[illustId].tags.filter(t => t !== 'R-18' && t !== 'R-18G').map(t => {
				const tagData = CRX.db.get('tags', t);
				const en = tagData?.en || tagData?.ro || '?';
				return `<li class="crx_tag_entry"><span class="crx_en">${en}</span> <span class="crx_ja">#${t}</span>`;
			}).join('');
			targetLi.append(el);
		}
	} else {
		console.log("[CRX] assignThumbData - Dados não encontrados: #" + illustId);
	}
}

function checkIfImgIsThumb(element) {
	const targetParent = element.closest('[data-ga4-label]');
	if (targetParent && !trackedElements.has(targetParent)) {
		const targetLi = element.closest('li');
		trackedElements.add(targetParent);
		const illustId = targetParent.attributes['data-gtm-value']?.value;
		assignThumbData(illustId, WorkResults?.[illustId], targetParent, targetLi);
	}
}

function setBookmarksGrid(ul) {
	ul.classList.add('crx_bookmarks_grid');
}

// ==================== DOM ENHANCEMENTS ====================
function addClassesToElement(selector, ...classes) {
	const element = document.querySelector(selector);
	if (element) {
		classes.forEach(c => { if (!element.classList.contains(c)) element.classList.add(c); });
	}
	return element;
}

function executeDOMCleanUp() {
	document.querySelectorAll('.crx_sidebar .crx_like_fav_bar').forEach(el => el.remove());
}

const currentPageTagsAndIllusts = CRX.currentPageTagsAndIllusts = []

function executeDOMEnhancements() {
	const sidebar = addClassesToElement('aside:has(h2):has(nav)', 'crx_sidebar');
	const otherWorks = addClassesToElement('aside section:has(header):has(nav)', 'crx_otherworks');
	const tags = addClassesToElement('main section figcaption div footer', 'crx_tags');
	const actions = addClassesToElement('main section ul:has([role=button])', 'crx_illust_actions');
	const creationDate = addClassesToElement('main section div:has(> time)', 'crx_creation_date');
	const likeFavBar = addClassesToElement('div:has( > div > div > section > div > button)', 'crx_like_fav_bar');

	if (sidebar && otherWorks) {
		const targetAnchor = document.querySelector('.crx_otherworks ~*');
		if (targetAnchor) {
			likeFavBar && likeFavBar.parentNode !== sidebar && tryTo(() => sidebar.appendChild(likeFavBar));
			tags && tags.parentNode !== sidebar && tryTo(() => sidebar.moveBefore(tags, targetAnchor));
			actions && actions.parentNode !== sidebar && tryTo(() => sidebar.moveBefore(actions, targetAnchor));
			creationDate && creationDate.parentNode !== sidebar && tryTo(() => sidebar.moveBefore(creationDate, targetAnchor));
		}
	}

	let e
	if (e = document.querySelector('._favs div:has(> section div>ul):not(:has(.crx_page_tags))')) {
		const node = document.createElement('div');
		node.classList = 'crx_page_tags';
		node.id = 'crx_page_tags';
		node.innerHTML = 'crx_page_tags'
		e.appendChild(node)
		setTimeout(updateCurrentPageTags)
	}
}

function setAllPageTags(works) {
	console.log('works', works)
	currentPageTagsAndIllusts.length = 0
	const newTags = Object.entries(
		works.flatMap((w) => w.tags.map(t => [w.id, t])).filter(
			([, tag]) => !tag.endsWith("users入り")
		).reduce((r, [illustId, tag]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }), {})
	).sort(([, a], [, b]) => b.length - a.length)
	console.log('newTags', newTags)
	currentPageTagsAndIllusts.push(...newTags)
	updateCurrentPageTags()
}

function updateCurrentPageTags() {
	console.log('updateCurrentPageTags', currentPageTagsAndIllusts)
	if (!CRX.db.loaded) {
		return setTimeout(updateCurrentPageTags, 2000);
	}
	const crx_page_tags = document.getElementById('crx_page_tags');
	if (!crx_page_tags) return
	crx_page_tags.innerHTML = '<ul>' + currentPageTagsAndIllusts.map(([jTag, illusts]) => {
		const tag = db.get('tags', jTag) || {}
		const enTag = tag.myEn || tag.en || tag.ro || jTag
		return `<li class="${jTag == enTag ? 'one_tag' : 'two_tag'}"><span>${enTag}</span><span>${illusts.length}</span>${(jTag == enTag) ? '' : `<div>${jTag}</div>`}</li>`
	}).join('') + '</ul>'
}

function tryTo(fn) {
	try { fn(); } catch (e) {}
}

// ==================== MUTATION OBSERVER (unificado) ====================
let lastUrl = location.href;

const observer = new MutationObserver((mutations) => {
	if (location.href !== lastUrl) {
		lastUrl = location.href;
		updateBodyClassesForCurrentUrl();
		executeDOMCleanUp();
	}

	executeDOMEnhancements();

	document.querySelectorAll?.('ul:not(.crx_bookmarks_grid):has(.crx_work_thumbnail)').forEach(setBookmarksGrid);

	for (const mutation of mutations) {
		if (mutation.type !== 'childList') continue;
		mutation.addedNodes.forEach(node => {
			if (node.nodeType !== Node.ELEMENT_NODE) return;
			node.classList.add('_added');
			if (node.nodeName === 'IMG') { checkIfImgIsThumb(node); return; }
			node.querySelectorAll?.('img').forEach(checkIfImgIsThumb);
		});
	}
});

function startObserver() {
	observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
	updateBodyClassesForCurrentUrl();
	document.querySelectorAll('[data-ga4-label] img').forEach(checkIfImgIsThumb);
	executeDOMEnhancements();
}

if (document.body) startObserver();
else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

// ==================== TAG UTILITY ====================
async function currentPageTagsNotYetTranslated() {
	clearTimeout(translatingTagsTimer);
	console.log('[CRX] Retrieving new tag translations to save...');
	if (!db.loaded) {
		console.log('[CRX] DB not loaded yet');
		translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1000);
		return
	}
	if (alreadyTranslating) {
		return
	}
	alreadyTranslating = true

	const worksByTag = Object.fromEntries(Object.entries(
		Object.entries(WorkResults)
			.flatMap(([illustId, { tags }]) => tags.filter(tag => !tag.endsWith("users入り")).map(tag => [tag, illustId]))
			.reduce((r, [tag, illustId]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }), {})
	).sort(([, a], [, b]) => b.length - a.length));

	const arrayOfTagEnRoIllusts = Object.entries(worksByTag).map(
		([tag, ids]) => [tag, db.get('tags', tag)?.myEn || db.get('tags', tag)?.en, db.get('tags', tag)?.ro, ids]
	);

	const tagsToUpdate = arrayOfTagEnRoIllusts.filter(([tag, en, ro]) => !en && !ro)
	allTagsToTranslate = tagsToUpdate.length

	const tagsAlreadyTranslatedToSave = tagsToUpdate.filter(([tag]) => !hasEasternChars(tag)).map(([tag]) => (
		{ key: tag, values: { ro: tag } }
	))

	let saveTranslatedTagsPromise = null
	if (tagsAlreadyTranslatedToSave.length) {
		console.log('[CRX] Saving', tagsAlreadyTranslatedToSave.length, 'already translated tags...')
		saveTranslatedTagsPromise = db.putMany('tags', tagsAlreadyTranslatedToSave).then(() => {
			console.log('[CRX] Saved', tagsAlreadyTranslatedToSave.length, 'already translated tags!', ...tagsAlreadyTranslatedToSave.flatMap((x, i) => ['\n', i + 1, x.key]));
			allTagsTranslated += tagsAlreadyTranslatedToSave.length
		})
	}

	const tagsNotTranslatedYet = tagsToUpdate.filter(([tag]) => hasEasternChars(tag)).map(([a,,,b]) => [a, b])

	const illustsByNumberOfUntranslatedTags = Object.entries(tagsNotTranslatedYet.reduce((acc, [tag, ids]) => {
		ids.forEach(id => (acc[id] ??= []).push(tag));
		return acc;
	}, {})).sort(([,a],[,b])=>b.length-a.length);

	const tagsPercentageTranslated = Math.floor(allTagsTranslated / (allTagsTranslated + allTagsToTranslate) * 100)
	const pct = isNaN(tagsPercentageTranslated) ? 100 : tagsPercentageTranslated
	console.log('[CRX] Progress:',
		('▓'.repeat(pct) + '░'.repeat(100 - pct)), pct, '% (',
		allTagsTranslated, '/', (allTagsTranslated + allTagsToTranslate), ')\n',
		...tagsNotTranslatedYet.flatMap(([x], i) => [i + 1, x])
	);

	if (!illustsByNumberOfUntranslatedTags.length) {
		console.log('[CRX] All illustration tags from this page are already translated!')
		allTagsTranslated = allTagsToTranslate = 0
		clearTimeout(translatingTagsTimer);
		alreadyTranslating = false
		return
	}

	const tagsToTranslate = illustsByNumberOfUntranslatedTags[0][1]
	console.log('[CRX] Illust with the most untranslated tags:', illustsByNumberOfUntranslatedTags[0][0] * 1, '=', ...illustsByNumberOfUntranslatedTags[0][1].flatMap((x, i) => [i + 1, x]));

	const ajaxUrl = `https://www.pixiv.net/ajax/illust/${illustsByNumberOfUntranslatedTags[0][0]}?lang=en`
	const refUrl = `https://www.pixiv.net/en/artworks/${illustsByNumberOfUntranslatedTags[0][0]}`
	console.log('url =', refUrl, 'ajax =', ajaxUrl);

	const result = await fetch(ajaxUrl, {
		"headers": {
			"accept": "application/json",
			"accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
			"baggage": "sentry-environment=production,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=91101d2355ec40628d0efb57ff019e56,sentry-sampled=false,sentry-sample_rand=0.6269702122562493,sentry-sample_rate=0.0001",
			"cache-control": "max-age=0",
			"priority": "u=1, i",
			"sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Brave\";v=\"151\", \"Chromium\";v=\"151\"",
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": "\"Windows\"",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"sentry-trace": "91101d2355ec40628d0efb57ff019e56-81d18663b216189d-0",
			"x-user-id": "5986322"
		},
		"referrer": refUrl,
		"body": null,
		"method": "GET",
		"mode": "cors",
		"credentials": "include"
	}).then(x => x.json());

	const translations = (result?.body?.tags?.tags || []).map(t => [t?.tag, t?.romaji, t?.translation?.en]);
	const newTranslations = translations.filter(t => tagsToTranslate.includes(t[0]))
	const itemsToSave = translations.filter(([jp]) => !jp.endsWith("users入り")).map(([jp, ro = jp, en = '']) => ({ key: jp, values: { ro, en } }));

	if (saveTranslatedTagsPromise) {
		await saveTranslatedTagsPromise;
	}

	console.log('[CRX] Saving', newTranslations.length, 'translations:\n', ...newTranslations.flatMap((t, i) => [i + 1, (t.join(' / ')), '\n']));
	await db.putMany('tags', itemsToSave);

	console.log('[CRX]', newTranslations.length, 'new translations saved and', itemsToSave.length - newTranslations.length, 'tags updated!')
	allTagsTranslated += newTranslations.length
	alreadyTranslating = false
	setTimeout(updateCurrentPageTags(), 2)
	translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1);
}

CRX.currentPageTagsNotYetTranslated = currentPageTagsNotYetTranslated;
CRX.getCurrentPageTagsAndIllusts = () => currentPageTagsAndIllusts;

CRX.log('[CRX] interceptor ready');
