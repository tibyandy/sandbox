void function router() {
	Q._pageData = {}

	Q.route = {
		_current: {}
	}
	Q.router = {}

	Q.routes = ([
		['^/(?:[a-z]{2}/)?artworks/(\\d+)',                    'work-cover',          'workCover', ['workId'] ],
		['^/(?:[a-z]{2}/)?artworks/(\\d+)#.+',                 'work-slideshow',      0, ['workId'] ],
		['^/bookmark_detail\\.php',                            'workfav-detail',      0, 0 ],
		['^/bookmark_add\\.php',                               'workfav-edit',        0, 0 ],
		['^/dashboard',                                        'my-dash',             0, 0 ],
		['^/history\\.php',                                    'my-hist',             0, 0 ],
		['^/following/collections',                            'myfol-cols',          0, 0 ],
		['^/bookmark_new_illust(_r18)?\\.php',                 'myfol-works',         0, ['r18'] ],
		['^/mypixiv_new_illust\\.php',                         'mypix-works',         0, 0 ],
		['^/following/watchlist/manga',                        'mywatch-mangas',      0, 0 ],
		['^/following/watchlist/novels',                       'mywatch-novels',      0, 0 ],
		['^/new_illust(_r18)?\\.php',                          'recent-works',        0, ['r18'] ],
		['^/(?:[a-z]{2}/)?tags/([^/]+)/illustrations',         'search-illusts',      0, ['tags'] ],
		['^/(?:[a-z]{2}/)?tags/([^/]+)/manga',                 'search-mangas',       0, ['tags'] ],
		['^/(?:[a-z]{2}/)?tags/([^/]+)',                       'search-tags',         0, ['tags'] ],
		['^/search',                                           'search-words',        0, 0 ],
		['^/(?:[a-z]{2}/)?tags/([^/]+)/artworks',              'search-works',        0, ['tags'] ],
		['^/discovery',                                        'top-discovery',       0, 0 ],
		['^/(?:[a-z]{2}/)?$',                                  'top-home',            0, 0 ],
		['^/novel',                                            'top-novels',          0, 0 ],
		['^/illustration',                                     'top-recom-works',     0, 0 ],
		['^/cate_r18\\.php',                                   'top-recom-works-r18', 0, 0 ],
		['^/manga',                                            'top-recom-mangas',    0, 0 ],
		['^/manga\\?r=1',                                      'top-recom-mangas',    0, 0 ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/bookmarks/artworks',    'user-favs',           0, ['userId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/bookmarks/collections', 'user-favs-cols',      0, ['userId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/bookmarks/novels',      'user-favs-novels',    0, ['userId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/following',             'user-fols',           0, ['userId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)$',                      'user-home',           0, ['userId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/illustrations',         'user-illusts',        0, ['userId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/manga',                 'user-mangas',         0, ['userId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/request',               'user-reqs',           0, ['userId'] ],
		['^/user/(\\d+)/series/(\\d+)',                        'user-series',         0, ['userId', 'seriesId'] ],
		['^/(?:[a-z]{2}/)?users/(\\d+)/artworks',              'user-works',          0, ['userId'] ],
	].map(
		([strPath, path, routeHandle, params]) => ({ regExp: new RegExp(strPath), path, routeHandle, params })
	))

	Q.router.init = async () => {
		Q.debug('router', 'activating route listeners').andLog()
		await Promise.all(Q.routes.filter(({ routeHandle: h }) => !!h).map(async route => {
			try {
				await Q.loadJs(`/route/${route.path}.js`)
				Q.debug('router', `${route.routeHandle} "${route.path}.js" handler loaded`).andLog()
			} catch (e) {
				Q.error('router', `${route.routeHandle} "${route.path}.js" handler could not be loaded!!!`).andLog()
			}
		}))
		new MutationObserver(Q.router.checkChanges).observe(
			document.body || document.documentElement,
			{ childList: true, subtree: true }
		)

		Q.on('fetch-success', event => Q.router._current?.fetchListener?.(event));

		setTimeout(() => {
			Q.router.checkChanges()
			Q.info('router', 'started successfully').andLog()
		})
	}

	let qxm = 0

	Q.router.checkChanges = e => {
		const currHref = location.href
		const urlChanged = Q.router.lastHref !== currHref
		Q.router.lastHref = currHref
		if (urlChanged) Q.router.urlChanged(new Date().toISOString(), currHref)
			/*
		if (e?.length) {
			const targets = []
			for (const { target, type } of e) {
				if (target.closest('*[id^=qx]') || type !== 'childList') continue
				if (!targets.includes(target)) {
					targets.push(target)
					target.classList?.add?.('qx-m')
				}
			}
		}
			*/
	}

	Q.detectElementAdditions = node => {
		const { _elements: e } = Q.router
		const els = []
		els.push([
			document.querySelector('main section div > div > figure:has(*[role=presentation] a img)'),
			document.querySelector('aside section:has(a[href^="/en/users/"]):has(h2)'),
			document.querySelector('aside section:has(a[href^="/en/users/"]):has(header):has(nav)'),
			document.querySelector('main h1'),
			document.querySelector('main figcaption footer'),
			[...document.querySelectorAll('main + aside > *:not(.qx-tagged')]
		].flat().filter(x => !!x).map(x => x.classList.add('qx-tagged')))
		els.forEach(el => { if (!e.includes(el)) { e.push(el) } })
		Q.router._current.update?.()
	}

	Q.router.urlChanged = (now, currHref) => {
		const currUrl = new URL(currHref)
		const currentPath = currUrl.pathname + currUrl.search + currUrl.hash;
		const route = findCurrentRoute(currentPath) || false
		Q._pageData = {
			meta: {
				path: route.path || 'unknown',
				url: currUrl,
				changedOn: now,
				ajaxUrl: null
			}
		}
		if (route.params) {
			const match = currentPath.match(route.regExp)
			const params = Object.fromEntries(route.params.map((m, i) => [ m, match[i + 1] ]))
			Object.assign(Q._pageData, { ...params })
		}
		if (route.routeHandle) {
			Q.router._current = Q.route[route.routeHandle]
		}
		Q.whenBodyReady(() => {
			const cl = document.body.classList
			cl.forEach(className => {
				if (className.startsWith('qx-route')) cl.remove(className)
			})
			cl.add('qx-route-' + route.path)
			Q.router._current.init?.()
		})
	}

	function findCurrentRoute (currPath) {
		return Q.routes.find(({ regExp }) => regExp.test(currPath))
	}

	Q.router.init()
}()