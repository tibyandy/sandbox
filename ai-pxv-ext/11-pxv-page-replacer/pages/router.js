void function router() {
	Q._lastHref = null
	Q._pageData = {}
	Q._routeFetchListener = null

	Q.routes = ([
		['^/(?:[a-z]{2}/)?artworks/(\\d+)',                    'work-cover',          1, ['workId'] ],
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
		([strPath, path, hasRouteHandler, matchers]) => ({ regExp: new RegExp(strPath), path, hasRouteHandler, matchers })
	))

	Q.initRouter = async () => {
		Q.debug('router', 'activating route listeners').andLog()
		await Promise.all(Q.routes.filter(({ hasRouteHandler: h }) => !!h).map(async route => {
			try {
				await Q.loadJs(`/route/${route.path}.js`)
				Q.debug('router', `"${route.path}" route listener activated`).andLog()
			} catch (e) {
				Q.error('router', `"${route.path}" route listener could not be activated`).andLog()
			}
		}))
		new MutationObserver(Q.checkMutations).observe(
			document.body || document.documentElement,
			{ childList: true, subtree: true }
		)

		Q.on('fetch-success', event => {
			Q._routeFetchListener && Q._routeFetchListener(event)
		});

		setTimeout(() => {
			Q.checkMutations({})
			Q.info('router', 'started successfully').andLog()
		})
	}

	Q.checkMutations = mutations => {
		const currHref = location.href
		const locationChanged = Q._lastHref !== currHref
		Q._lastHref = currHref
		if (locationChanged) Q.locationChanged(new Date().toISOString(), currHref)
	}

	Q.locationChanged = (now, currHref) => {
		Q.info('router', 'locationChanged', currHref).andLog()
		const currUrl = new URL(currHref)
		const currentPath = currUrl.pathname + currUrl.search + currUrl.hash;
		const route = findRoute(currentPath) || false
		Q._pageData = {
			meta: {
				path: route.path || 'unknown',
				url: currUrl,
				changedOn: now,
				ajaxUrl: null
			}
		}
		if (route.matchers) {
			const match = currentPath.match(route.regExp)
			const params = Object.fromEntries(route.matchers.map((m, i) => [ m, match[i + 1] ]))
			Object.assign(Q._pageData, { ...params })
		}
		if (route.hasRouteHandler) {
			Q.send('route:' + route.path, Q._pageData)
		}
		Q.send('render-route', Q._pageData)
	}

	function findRoute (currPath) {
		return Q.routes.find(({ regExp }) => regExp.test(currPath))
	}

	Q.initRouter()
}()