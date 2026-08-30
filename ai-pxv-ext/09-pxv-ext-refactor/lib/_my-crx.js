Ext.attachModule(function WindowFetchOverrider (Ext) {
	const originalFetch = Ext._defaultFns.fetch;
	Ext._internals.fetch = window.fetch = CRX_WindowFetch;
	console.debug('WindowFetchOverrider', 'window.fetch => CRX_WindowFetch');
	return

	async function CRX_WindowFetch(...args) {
		const url = args[0];
		if (typeof url !== 'string' || !url.startsWith('/ajax')) {
			return originalFetch.apply(this, args);
		}

		console.debug('fetch', url);
		const originalResponse = await originalFetch.apply(this, args);

		try {
			const clonedResponse = originalResponse.clone();
			const contentType = clonedResponse.headers.get('content-type');
			const responseBody = await (
				(contentType && contentType.includes('application/json'))
					? clonedResponse.json()
					: clonedResponse.text()
			);

			const result = { url: originalResponse.url || url, responseBody, httpStatus: originalResponse.status };
			const works = responseBody?.body?.works;
			const tagTranslation = responseBody?.body?.tagTranslation;
			const illustTags = responseBody?.body?.tags?.tags;
			if (works) {
				// Ext.log('[Ext.fetch] - Ext.WorkResults <-- ', works.length, 'ilustrações');
				const worksMap = Array.isArray(works)
					? Object.fromEntries(works.map(({ id, ...obj }) => [id, obj]))
					: works;
				// Object.assign(Ext.WorkResults, worksMap);
				// Object.assign(WorkResults, worksMap);
				// if (!alreadyTranslating) translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1);
				// setAllPageTags(works);
			} else if (tagTranslation) {
				// saveTagTranslations(tagTranslation);
			} else if (illustTags) {
				// saveIllustTagTranslations(illustTags);
			} else {
				// Ext.log('[Ext.fetch] - Ext.FetchResults <--', url, response.status, responseBody?.body || responseBody);
				// Ext.FetchResults.push(result);
			}
		} catch (err) {
			console.error('[Ext.fetch] - Erro:', err);
		}
		return originalResponse;
	}
})

Ext.attachModule(function UrlChangeInterceptor (Ext) {
	const self = {
		routes: {}
	}

	setRoutes();
	console.debug('UrlChangeInterceptor', 'initialized');
	return;

	function setRoutes () {
		self.routes = {
			'art/cover': '^/(?:[a-z]{2}/)?artworks/\\d+',
			'art/slideshow': '^/(?:[a-z]{2}/)?artworks/\\d+#.+',
			'artfav/detail': '^/bookmark_detail\\.php',
			'artfav/edit': '^/bookmark_add\\.php',
			'my/dash': '^/dashboard',
			'my/hist': '^/history\\.php',
			'myfol/cols': '^/following/collections',
			'myfol/works': '^/bookmark_new_illust(_r18)?\\.php',
			'mypix/works': '^/mypixiv_new_illust\\.php',
			'mywatch/mangas': '^/following/watchlist/manga',
			'mywatch/novels': '^/following/watchlist/novels',
			'recent/works': '^/new_illust(_r18)?\\.php',
			'search/illusts': '^/(?:[a-z]{2}/)?tags/[^/]+/illustrations',
			'search/mangas': '^/(?:[a-z]{2}/)?tags/[^/]+/manga',
			'search/tags': '^/(?:[a-z]{2}/)?tags/[^/]+',
			'search/words': '^/search',
			'search/works': '^/(?:[a-z]{2}/)?tags/[^/]+/artworks',
			'top/discovery': '^/discovery',
			'top/home': '^/(?:[a-z]{2}/)?$',
			'top/novels': '^/novel',
			'top/recom/illusts': '^/illustration',
			'top/recom/illusts/r18': '^/cate_r18\\.php',
			'top/recom/mangas': '^/manga',
			'top/recom/mangas': '^/manga\\?r=1',
			'user/favs': '^/(?:[a-z]{2}/)?users/\\d+/bookmarks/artworks',
			'user/favs/cols': '^/(?:[a-z]{2}/)?users/\\d+/bookmarks/collections',
			'user/favs/novels': '^/(?:[a-z]{2}/)?users/\\d+/bookmarks/novels',
			'user/fols': '^/(?:[a-z]{2}/)?users/\\d+/following',
			'user/home': '^/(?:[a-z]{2}/)?users/\\d+$',
			'user/illusts': '^/(?:[a-z]{2}/)?users/\\d+/illustrations',
			'user/mangas': '^/(?:[a-z]{2}/)?users/\\d+/manga',
			'user/reqs': '^/(?:[a-z]{2}/)?users/\\d+/request',
			'user/series': '^/user/\\d+/series/\\d+',
			'user/works': '^/(?:[a-z]{2}/)?users/\\d+/artworks',
		}
	}
})

Ext.attachModule(function PageChangeInterceptor (Ext) {
	console.log('PageChangeInterceptor', 'initialized');
})

// Ext.attachModule('foo')
	/*
            const SPECIAL_USER_ID = '5986322';
        
            function hasEasternChars(str) {
                return /[^\x00-\u024F\u0300-\u036F\u2000-\u2BFF\u2E00-\u2E7F\u3000-\u303F\uFE00-\uFE0F\uFF01-\uFF60\uFFE0-\uFFEE\u{1F000}-\u{1FFFF}\u{E0000}-\u{E007F}]/u.test(str);
            }
        
            // ==================== SHEET DATABASE ====================
            const db = Ext.db = (function sheetDatabase () {
                console.log('[Ext] SheetDatabase 1.1.2');
        
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
                console.log('[Ext] db starting');
                db.load().then(() => console.log('[Ext] db loaded')).catch(() => {});
        
                return db
            })();
        
            // ==================== TAG TRANSLATION AUTO-SAVE ====================
            // Usado pelos endpoints /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword},
            // que retornam body.tagTranslation: { [tagJp]: { romaji, en, ... } }
            let savingTagTranslations = false;
            async function mergeAndSaveTags(entries) {
                // entries: [tag, romaji, en][]
                const items = entries
                    .filter(([tag]) => !tag.endsWith("users入り"))
                    .map(([tag, romaji, en]) => {
                        const existing = db.get('tags', tag) || {};
                        const values = {};
                        if (romaji && romaji !== existing.ro) values.ro = romaji;
                        if (en && en !== existing.en) values.en = en;
                        return { key: tag, values };
                    })
                    .filter(({ values }) => Object.keys(values).length);
        
                if (!items.length) return;
        
                if (savingTagTranslations) {
                    setTimeout(() => mergeAndSaveTags(entries), 500);
                    return;
                }
                savingTagTranslations = true;
                try {
                    const inicio = new Date().getTime();
                    console.log('[Ext] Salvando', items.length, 'tags:', ...items.flatMap(({ key, values }, i) => ['\n-', i + 1, '-', [key, ...Object.values(values)].reverse().join(' / ')]));
                    await db.putMany('tags', items);
                    const delta = (new Date().getTime() - inicio)
                    console.log('[Ext]', items.length, 'tag salvas em', Math.trunc(delta / 100) / 10, 'segundos:', Math.round(items.length / (delta / 100000)) / 100, 'tags por segundo');
                } catch (err) {
                    console.error('[Ext] mergeAndSaveTags falhou:', err);
                } finally {
                    savingTagTranslations = false;
                }
            }
        
            // /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword}: body.tagTranslation = { [tagJp]: { romaji, en, ... } }
            function saveTagTranslations(tagTranslation) {
                mergeAndSaveTags(Object.entries(tagTranslation).map(([tag, { romaji, en }]) => [tag, romaji, en]));
            }
        
            // /ajax/illust/{id}: body.tags.tags = [{ tag, romaji, translation: { en } }]
            function saveIllustTagTranslations(illustTags) {
                mergeAndSaveTags(illustTags.map(({ tag, romaji, translation }) => [tag, romaji, translation?.en]));
            }
        
            // ==================== ROUTES + BODY CLASSES ====================
        
        
        
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
            const WorkResults = Ext.WorkResults;
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
                            const tagData = Ext.db.get('tags', t);
                            const en = tagData?.en || tagData?.ro || '?';
                            return `<li class="crx_tag_entry"><span class="crx_en">${en}</span> <span class="crx_ja">#${t}</span>`;
                        }).join('');
                        targetLi.append(el);
                    }
                } else {
                    // console.log("[Ext] assignThumbData - Dados não encontrados: #" + illustId);
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
        
            const currentPageTagsAndIllusts = Ext.currentPageTagsAndIllusts = []
        
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
        
            function setAllPageTags(worksX) {
                // console.log('works', worksX)
                const works = Array.isArray(worksX) ? worksX : Object.values(worksX)
                currentPageTagsAndIllusts.length = 0
                const newTags = Object.entries(
                    works
                        .flatMap((w) => w.tags.map(t => [w.id, t]))
                        .filter(([, tag]) => !tag.endsWith("users入り")
                    ).reduce((r, [illustId, tag]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }), {})
                ).sort(([, a], [, b]) => b.length - a.length)
                // console.log('newTags', newTags)
                currentPageTagsAndIllusts.push(...newTags)
                updateCurrentPageTags()
            }
        
            function updateCurrentPageTags() {
                // console.log('updateCurrentPageTags', currentPageTagsAndIllusts)
                if (!Ext.db.loaded) {
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
                console.log('[Ext] Retrieving new tag translations to save...');
                if (!db.loaded) {
                    console.log('[Ext] DB not loaded yet');
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
                    console.log('[Ext] Saving', tagsAlreadyTranslatedToSave.length, 'already translated tags...')
                    saveTranslatedTagsPromise = db.putMany('tags', tagsAlreadyTranslatedToSave).then(() => {
                        console.log('[Ext] Saved', tagsAlreadyTranslatedToSave.length, 'already translated tags!', ...tagsAlreadyTranslatedToSave.flatMap((x, i) => ['\n', i + 1, x.key]));
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
                console.log('[Ext] Progress:',
                    ('▓'.repeat(pct) + '░'.repeat(100 - pct)), pct, '% (',
                    allTagsTranslated, '/', (allTagsTranslated + allTagsToTranslate), ')\n',
                    ...tagsNotTranslatedYet.flatMap(([x], i) => [i + 1, x])
                );
        
                if (!illustsByNumberOfUntranslatedTags.length) {
                    console.log('[Ext] All illustration tags from this page are already translated!')
                    allTagsTranslated = allTagsToTranslate = 0
                    clearTimeout(translatingTagsTimer);
                    alreadyTranslating = false
                    return
                }
        
                const tagsToTranslate = illustsByNumberOfUntranslatedTags[0][1]
                console.log('[Ext] Illust with the most untranslated tags:', illustsByNumberOfUntranslatedTags[0][0] * 1, '=', ...illustsByNumberOfUntranslatedTags[0][1].flatMap((x, i) => [i + 1, x]));
        
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
        
                console.log('[Ext] Saving', newTranslations.length, 'translations:\n', ...newTranslations.flatMap((t, i) => [i + 1, (t.join(' / ')), '\n']));
                await db.putMany('tags', itemsToSave);
        
                console.log('[Ext]', newTranslations.length, 'new translations saved and', itemsToSave.length - newTranslations.length, 'tags updated!')
                allTagsTranslated += newTranslations.length
                alreadyTranslating = false
                setTimeout(updateCurrentPageTags(), 2)
                translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1);
            }
        
            Ext.currentPageTagsNotYetTranslated = currentPageTagsNotYetTranslated;
            Ext.getCurrentPageTagsAndIllusts = () => currentPageTagsAndIllusts;
        
            Ext.log('[Ext] interceptor ready');
        }
        
        */// ) {
			/*
					const SPECIAL_USER_ID = '5986322';
		  
					function hasEasternChars(str) {
							return /[^\x00-\u024F\u0300-\u036F\u2000-\u2BFF\u2E00-\u2E7F\u3000-\u303F\uFE00-\uFE0F\uFF01-\uFF60\uFFE0-\uFFEE\u{1F000}-\u{1FFFF}\u{E0000}-\u{E007F}]/u.test(str);
					}
		  
					// ==================== SHEET DATABASE ====================
					const db = Ext.db = (function sheetDatabase () {
							console.log('[Ext] SheetDatabase 1.1.2');
		  
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
							console.log('[Ext] db starting');
							db.load().then(() => console.log('[Ext] db loaded')).catch(() => {});
		  
							return db
					})();
		  
					// ==================== TAG TRANSLATION AUTO-SAVE ====================
					// Usado pelos endpoints /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword},
					// que retornam body.tagTranslation: { [tagJp]: { romaji, en, ... } }
					let savingTagTranslations = false;
					async function mergeAndSaveTags(entries) {
							// entries: [tag, romaji, en][]
							const items = entries
									.filter(([tag]) => !tag.endsWith("users入り"))
									.map(([tag, romaji, en]) => {
											const existing = db.get('tags', tag) || {};
											const values = {};
											if (romaji && romaji !== existing.ro) values.ro = romaji;
											if (en && en !== existing.en) values.en = en;
											return { key: tag, values };
									})
									.filter(({ values }) => Object.keys(values).length);
		  
							if (!items.length) return;
		  
							if (savingTagTranslations) {
									setTimeout(() => mergeAndSaveTags(entries), 500);
									return;
							}
							savingTagTranslations = true;
							try {
									const inicio = new Date().getTime();
									console.log('[Ext] Salvando', items.length, 'tags:', ...items.flatMap(({ key, values }, i) => ['\n-', i + 1, '-', [key, ...Object.values(values)].reverse().join(' / ')]));
									await db.putMany('tags', items);
									const delta = (new Date().getTime() - inicio)
									console.log('[Ext]', items.length, 'tag salvas em', Math.trunc(delta / 100) / 10, 'segundos:', Math.round(items.length / (delta / 100000)) / 100, 'tags por segundo');
							} catch (err) {
									console.error('[Ext] mergeAndSaveTags falhou:', err);
							} finally {
									savingTagTranslations = false;
							}
					}
		  
					// /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword}: body.tagTranslation = { [tagJp]: { romaji, en, ... } }
					function saveTagTranslations(tagTranslation) {
							mergeAndSaveTags(Object.entries(tagTranslation).map(([tag, { romaji, en }]) => [tag, romaji, en]));
					}
		  
					// /ajax/illust/{id}: body.tags.tags = [{ tag, romaji, translation: { en } }]
					function saveIllustTagTranslations(illustTags) {
							mergeAndSaveTags(illustTags.map(({ tag, romaji, translation }) => [tag, romaji, translation?.en]));
					}
		  
					// ==================== ROUTES + BODY CLASSES ====================
		  
		  
		  
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
					const WorkResults = Ext.WorkResults;
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
													const tagData = Ext.db.get('tags', t);
													const en = tagData?.en || tagData?.ro || '?';
													return `<li class="crx_tag_entry"><span class="crx_en">${en}</span> <span class="crx_ja">#${t}</span>`;
											}).join('');
											targetLi.append(el);
									}
							} else {
									// console.log("[Ext] assignThumbData - Dados não encontrados: #" + illustId);
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
		  
					const currentPageTagsAndIllusts = Ext.currentPageTagsAndIllusts = []
		  
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
		  
					function setAllPageTags(worksX) {
							// console.log('works', worksX)
							const works = Array.isArray(worksX) ? worksX : Object.values(worksX)
							currentPageTagsAndIllusts.length = 0
							const newTags = Object.entries(
									works
											.flatMap((w) => w.tags.map(t => [w.id, t]))
											.filter(([, tag]) => !tag.endsWith("users入り")
									).reduce((r, [illustId, tag]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }), {})
							).sort(([, a], [, b]) => b.length - a.length)
							// console.log('newTags', newTags)
							currentPageTagsAndIllusts.push(...newTags)
							updateCurrentPageTags()
					}
		  
					function updateCurrentPageTags() {
							// console.log('updateCurrentPageTags', currentPageTagsAndIllusts)
							if (!Ext.db.loaded) {
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
							console.log('[Ext] Retrieving new tag translations to save...');
							if (!db.loaded) {
									console.log('[Ext] DB not loaded yet');
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
									console.log('[Ext] Saving', tagsAlreadyTranslatedToSave.length, 'already translated tags...')
									saveTranslatedTagsPromise = db.putMany('tags', tagsAlreadyTranslatedToSave).then(() => {
											console.log('[Ext] Saved', tagsAlreadyTranslatedToSave.length, 'already translated tags!', ...tagsAlreadyTranslatedToSave.flatMap((x, i) => ['\n', i + 1, x.key]));
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
							console.log('[Ext] Progress:',
									('▓'.repeat(pct) + '░'.repeat(100 - pct)), pct, '% (',
									allTagsTranslated, '/', (allTagsTranslated + allTagsToTranslate), ')\n',
									...tagsNotTranslatedYet.flatMap(([x], i) => [i + 1, x])
							);
		  
							if (!illustsByNumberOfUntranslatedTags.length) {
									console.log('[Ext] All illustration tags from this page are already translated!')
									allTagsTranslated = allTagsToTranslate = 0
									clearTimeout(translatingTagsTimer);
									alreadyTranslating = false
									return
							}
		  
							const tagsToTranslate = illustsByNumberOfUntranslatedTags[0][1]
							console.log('[Ext] Illust with the most untranslated tags:', illustsByNumberOfUntranslatedTags[0][0] * 1, '=', ...illustsByNumberOfUntranslatedTags[0][1].flatMap((x, i) => [i + 1, x]));
		  
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
		  
							console.log('[Ext] Saving', newTranslations.length, 'translations:\n', ...newTranslations.flatMap((t, i) => [i + 1, (t.join(' / ')), '\n']));
							await db.putMany('tags', itemsToSave);
		  
							console.log('[Ext]', newTranslations.length, 'new translations saved and', itemsToSave.length - newTranslations.length, 'tags updated!')
							allTagsTranslated += newTranslations.length
							alreadyTranslating = false
							setTimeout(updateCurrentPageTags(), 2)
							translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1);
					}
		  
					Ext.currentPageTagsNotYetTranslated = currentPageTagsNotYetTranslated;
					Ext.getCurrentPageTagsAndIllusts = () => currentPageTagsAndIllusts;
		  
					Ext.log('[Ext] interceptor ready');
			}
		  
			*/ 
		//};
		/*
				const SPECIAL_USER_ID = '5986322';
	  
				function hasEasternChars(str) {
						return /[^\x00-\u024F\u0300-\u036F\u2000-\u2BFF\u2E00-\u2E7F\u3000-\u303F\uFE00-\uFE0F\uFF01-\uFF60\uFFE0-\uFFEE\u{1F000}-\u{1FFFF}\u{E0000}-\u{E007F}]/u.test(str);
				}
	  
				// ==================== SHEET DATABASE ====================
				const db = Ext.db = (function sheetDatabase () {
						console.log('[Ext] SheetDatabase 1.1.2');
	  
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
						console.log('[Ext] db starting');
						db.load().then(() => console.log('[Ext] db loaded')).catch(() => {});
	  
						return db
				})();
	  
				// ==================== TAG TRANSLATION AUTO-SAVE ====================
				// Usado pelos endpoints /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword},
				// que retornam body.tagTranslation: { [tagJp]: { romaji, en, ... } }
				let savingTagTranslations = false;
				async function mergeAndSaveTags(entries) {
						// entries: [tag, romaji, en][]
						const items = entries
								.filter(([tag]) => !tag.endsWith("users入り"))
								.map(([tag, romaji, en]) => {
										const existing = db.get('tags', tag) || {};
										const values = {};
										if (romaji && romaji !== existing.ro) values.ro = romaji;
										if (en && en !== existing.en) values.en = en;
										return { key: tag, values };
								})
								.filter(({ values }) => Object.keys(values).length);
	  
						if (!items.length) return;
	  
						if (savingTagTranslations) {
								setTimeout(() => mergeAndSaveTags(entries), 500);
								return;
						}
						savingTagTranslations = true;
						try {
								const inicio = new Date().getTime();
								console.log('[Ext] Salvando', items.length, 'tags:', ...items.flatMap(({ key, values }, i) => ['\n-', i + 1, '-', [key, ...Object.values(values)].reverse().join(' / ')]));
								await db.putMany('tags', items);
								const delta = (new Date().getTime() - inicio)
								console.log('[Ext]', items.length, 'tag salvas em', Math.trunc(delta / 100) / 10, 'segundos:', Math.round(items.length / (delta / 100000)) / 100, 'tags por segundo');
						} catch (err) {
								console.error('[Ext] mergeAndSaveTags falhou:', err);
						} finally {
								savingTagTranslations = false;
						}
				}
	  
				// /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword}: body.tagTranslation = { [tagJp]: { romaji, en, ... } }
				function saveTagTranslations(tagTranslation) {
						mergeAndSaveTags(Object.entries(tagTranslation).map(([tag, { romaji, en }]) => [tag, romaji, en]));
				}
	  
				// /ajax/illust/{id}: body.tags.tags = [{ tag, romaji, translation: { en } }]
				function saveIllustTagTrnslations(illustTags) {
						mergeAndSaveTags(illustTags.map(({ tag, romaji, translation }) => [tag, romaji, translation?.en]));
				}
	  
				// ==================== ROUTES + BODY CLASSES ====================
	  
	  
	  
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
				const WorkResults = Ext.WorkResults;
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
												const tagData = Ext.db.get('tags', t);
												const en = tagData?.en || tagData?.ro || '?';
												return `<li class="crx_tag_entry"><span class="crx_en">${en}</span> <span class="crx_ja">#${t}</span>`;
										}).join('');
										targetLi.append(el);
								}
						} else {
								// console.log("[Ext] assignThumbData - Dados não encontrados: #" + illustId);
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
	  
				const currentPageTagsAndIllusts = Ext.currentPageTagsAndIllusts = []
	  
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
	  
				function setAllPageTags(worksX) {
						// console.log('works', worksX)
						const works = Array.isArray(worksX) ? worksX : Object.values(worksX)
						currentPageTagsAndIllusts.length = 0
						const newTags = Object.entries(
								works
										.flatMap((w) => w.tags.map(t => [w.id, t]))
										.filter(([, tag]) => !tag.endsWith("users入り")
								).reduce((r, [illustId, tag]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }), {})
						).sort(([, a], [, b]) => b.length - a.length)
						// console.log('newTags', newTags)
						currentPageTagsAndIllusts.push(...newTags)
						updateCurrentPageTags()
				}
	  
				function updateCurrentPageTags() {
						// console.log('updateCurrentPageTags', currentPageTagsAndIllusts)
						if (!Ext.db.loaded) {
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
						console.log('[Ext] Retrieving new tag translations to save...');
						if (!db.loaded) {
								console.log('[Ext] DB not loaded yet');
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
								console.log('[Ext] Saving', tagsAlreadyTranslatedToSave.length, 'already translated tags...')
								saveTranslatedTagsPromise = db.putMany('tags', tagsAlreadyTranslatedToSave).then(() => {
										console.log('[Ext] Saved', tagsAlreadyTranslatedToSave.length, 'already translated tags!', ...tagsAlreadyTranslatedToSave.flatMap((x, i) => ['\n', i + 1, x.key]));
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
						console.log('[Ext] Progress:',
								('▓'.repeat(pct) + '░'.repeat(100 - pct)), pct, '% (',
								allTagsTranslated, '/', (allTagsTranslated + allTagsToTranslate), ')\n',
								...tagsNotTranslatedYet.flatMap(([x], i) => [i + 1, x])
						);
	  
						if (!illustsByNumberOfUntranslatedTags.length) {
								console.log('[Ext] All illustration tags from this page are already translated!')
								allTagsTranslated = allTagsToTranslate = 0
								clearTimeout(translatingTagsTimer);
								alreadyTranslating = false
								return
						}
	  
						const tagsToTranslate = illustsByNumberOfUntranslatedTags[0][1]
						console.log('[Ext] Illust with the most untranslated tags:', illustsByNumberOfUntranslatedTags[0][0] * 1, '=', ...illustsByNumberOfUntranslatedTags[0][1].flatMap((x, i) => [i + 1, x]));
	  
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
	  
						console.log('[Ext] Saving', newTranslations.length, 'translations:\n', ...newTranslations.flatMap((t, i) => [i + 1, (t.join(' / ')), '\n']));
						await db.putMany('tags', itemsToSave);
	  
						console.log('[Ext]', newTranslations.length, 'new translations saved and', itemsToSave.length - newTranslations.length, 'tags updated!')
						allTagsTranslated += newTranslations.length
						alreadyTranslating = false
						setTimeout(updateCurrentPageTags(), 2)
						translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1);
				}
	  
				Ext.currentPageTagsNotYetTranslated = currentPageTagsNotYetTranslated;
				Ext.getCurrentPageTagsAndIllusts = () => currentPageTagsAndIllusts;
	  
				Ext.log('[Ext] interceptor ready');
		}
	  
		*/ 
//	}
//}

/*
	const SPECIAL_USER_ID = '5986322';

	function hasEasternChars(str) {
		return /[^\x00-\u024F\u0300-\u036F\u2000-\u2BFF\u2E00-\u2E7F\u3000-\u303F\uFE00-\uFE0F\uFF01-\uFF60\uFFE0-\uFFEE\u{1F000}-\u{1FFFF}\u{E0000}-\u{E007F}]/u.test(str);
	}

	// ==================== SHEET DATABASE ====================
	const db = Ext.db = (function sheetDatabase () {
		console.log('[Ext] SheetDatabase 1.1.2');

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
		console.log('[Ext] db starting');
		db.load().then(() => console.log('[Ext] db loaded')).catch(() => {});

		return db
	})();

	// ==================== TAG TRANSLATION AUTO-SAVE ====================
	// Usado pelos endpoints /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword},
	// que retornam body.tagTranslation: { [tagJp]: { romaji, en, ... } }
	let savingTagTranslations = false;
	async function mergeAndSaveTags(entries) {
		// entries: [tag, romaji, en][]
		const items = entries
			.filter(([tag]) => !tag.endsWith("users入り"))
			.map(([tag, romaji, en]) => {
				const existing = db.get('tags', tag) || {};
				const values = {};
				if (romaji && romaji !== existing.ro) values.ro = romaji;
				if (en && en !== existing.en) values.en = en;
				return { key: tag, values };
			})
			.filter(({ values }) => Object.keys(values).length);

		if (!items.length) return;

		if (savingTagTranslations) {
			setTimeout(() => mergeAndSaveTags(entries), 500);
			return;
		}
		savingTagTranslations = true;
		try {
			const inicio = new Date().getTime();
			console.log('[Ext] Salvando', items.length, 'tags:', ...items.flatMap(({ key, values }, i) => ['\n-', i + 1, '-', [key, ...Object.values(values)].reverse().join(' / ')]));		
			await db.putMany('tags', items);
			const delta = (new Date().getTime() - inicio)
			console.log('[Ext]', items.length, 'tag salvas em', Math.trunc(delta / 100) / 10, 'segundos:', Math.round(items.length / (delta / 100000)) / 100, 'tags por segundo');
		} catch (err) {
			console.error('[Ext] mergeAndSaveTags falhou:', err);
		} finally {
			savingTagTranslations = false;
		}
	}

	// /ajax/search/tags/{tag} e /ajax/search/artworks/{keyword}: body.tagTranslation = { [tagJp]: { romaji, en, ... } }
	function saveTagTranslations(tagTranslation) {
		mergeAndSaveTags(Object.entries(tagTranslation).map(([tag, { romaji, en }]) => [tag, romaji, en]));
	}

	// /ajax/illust/{id}: body.tags.tags = [{ tag, romaji, translation: { en } }]
	function saveIllustTagTranslations(illustTags) {
		mergeAndSaveTags(illustTags.map(({ tag, romaji, translation }) => [tag, romaji, translation?.en]));
	}

	// ==================== ROUTES + BODY CLASSES ====================



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
	const WorkResults = Ext.WorkResults;
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
					const tagData = Ext.db.get('tags', t);
					const en = tagData?.en || tagData?.ro || '?';
					return `<li class="crx_tag_entry"><span class="crx_en">${en}</span> <span class="crx_ja">#${t}</span>`;
				}).join('');
				targetLi.append(el);
			}
		} else {
			// console.log("[Ext] assignThumbData - Dados não encontrados: #" + illustId);
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

	const currentPageTagsAndIllusts = Ext.currentPageTagsAndIllusts = []

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

	function setAllPageTags(worksX) {
		// console.log('works', worksX)
		const works = Array.isArray(worksX) ? worksX : Object.values(worksX)
		currentPageTagsAndIllusts.length = 0
		const newTags = Object.entries(
			works
				.flatMap((w) => w.tags.map(t => [w.id, t]))
				.filter(([, tag]) => !tag.endsWith("users入り")
			).reduce((r, [illustId, tag]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }), {})
		).sort(([, a], [, b]) => b.length - a.length)
		// console.log('newTags', newTags)
		currentPageTagsAndIllusts.push(...newTags)
		updateCurrentPageTags()
	}

	function updateCurrentPageTags() {
		// console.log('updateCurrentPageTags', currentPageTagsAndIllusts)
		if (!Ext.db.loaded) {
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
		console.log('[Ext] Retrieving new tag translations to save...');
		if (!db.loaded) {
			console.log('[Ext] DB not loaded yet');
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
			console.log('[Ext] Saving', tagsAlreadyTranslatedToSave.length, 'already translated tags...')
			saveTranslatedTagsPromise = db.putMany('tags', tagsAlreadyTranslatedToSave).then(() => {
				console.log('[Ext] Saved', tagsAlreadyTranslatedToSave.length, 'already translated tags!', ...tagsAlreadyTranslatedToSave.flatMap((x, i) => ['\n', i + 1, x.key]));
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
		console.log('[Ext] Progress:',
			('▓'.repeat(pct) + '░'.repeat(100 - pct)), pct, '% (',
			allTagsTranslated, '/', (allTagsTranslated + allTagsToTranslate), ')\n',
			...tagsNotTranslatedYet.flatMap(([x], i) => [i + 1, x])
		);

		if (!illustsByNumberOfUntranslatedTags.length) {
			console.log('[Ext] All illustration tags from this page are already translated!')
			allTagsTranslated = allTagsToTranslate = 0
			clearTimeout(translatingTagsTimer);
			alreadyTranslating = false
			return
		}

		const tagsToTranslate = illustsByNumberOfUntranslatedTags[0][1]
		console.log('[Ext] Illust with the most untranslated tags:', illustsByNumberOfUntranslatedTags[0][0] * 1, '=', ...illustsByNumberOfUntranslatedTags[0][1].flatMap((x, i) => [i + 1, x]));

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

		console.log('[Ext] Saving', newTranslations.length, 'translations:\n', ...newTranslations.flatMap((t, i) => [i + 1, (t.join(' / ')), '\n']));
		await db.putMany('tags', itemsToSave);

		console.log('[Ext]', newTranslations.length, 'new translations saved and', itemsToSave.length - newTranslations.length, 'tags updated!')
		allTagsTranslated += newTranslations.length
		alreadyTranslating = false
		setTimeout(updateCurrentPageTags(), 2)
		translatingTagsTimer = setTimeout(currentPageTagsNotYetTranslated, 1);
	}

	Ext.currentPageTagsNotYetTranslated = currentPageTagsNotYetTranslated;
	Ext.getCurrentPageTagsAndIllusts = () => currentPageTagsAndIllusts;

	Ext.log('[Ext] interceptor ready');
}

*/

console.log('crx-init')
Ext.init({
	opts: {
		debug: true
	}
});
