Extensor.Module = function Router ({ on, send }) {
	on('location-change', locationChanged)
	const pathsAndRoutes = (
		[	['^/(?:[a-z]{2}/)?artworks/\\d+',                    'art/cover'            ],
			['^/(?:[a-z]{2}/)?artworks/\\d+#.+',                 'art/slideshow'        ],
			['^/bookmark_detail\\.php',                          'artfav/detail'        ],
			['^/bookmark_add\\.php',                             'artfav/edit'          ],
			['^/dashboard',                                      'my/dash'              ],
			['^/history\\.php',                                  'my/hist'              ],
			['^/following/collections',                          'myfol/cols'           ],
			['^/bookmark_new_illust(_r18)?\\.php',               'myfol/works'          ],
			['^/mypixiv_new_illust\\.php',                       'mypix/works'          ],
			['^/following/watchlist/manga',                      'mywatch/mangas'       ],
			['^/following/watchlist/novels',                     'mywatch/novels'       ],
			['^/new_illust(_r18)?\\.php',                        'recent/works'         ],
			['^/(?:[a-z]{2}/)?tags/[^/]+/illustrations',         'search/illusts'       ],
			['^/(?:[a-z]{2}/)?tags/[^/]+/manga',                 'search/mangas'        ],
			['^/(?:[a-z]{2}/)?tags/[^/]+',                       'search/tags'          ],
			['^/search',                                         'search/words'         ],
			['^/(?:[a-z]{2}/)?tags/[^/]+/artworks',              'search/works'         ],
			['^/discovery',                                      'top/discovery'        ],
			['^/(?:[a-z]{2}/)?$',                                'top/home'             ],
			['^/novel',                                          'top/novels'           ],
			['^/illustration',                                   'top/recom/illusts'    ],
			['^/cate_r18\\.php',                                 'top/recom/illusts/r18'],
			['^/manga',                                          'top/recom/mangas'     ],
			['^/manga\\?r=1',                                    'top/recom/mangas'     ],
			['^/(?:[a-z]{2}/)?users/\\d+/bookmarks/artworks',    'user/favs'            ],
			['^/(?:[a-z]{2}/)?users/\\d+/bookmarks/collections', 'user/favs/cols'       ],
			['^/(?:[a-z]{2}/)?users/\\d+/bookmarks/novels',      'user/favs/novels'     ],
			['^/(?:[a-z]{2}/)?users/\\d+/following',             'user/fols'            ],
			['^/(?:[a-z]{2}/)?users/\\d+$',                      'user/home'            ],
			['^/(?:[a-z]{2}/)?users/\\d+/illustrations',         'user/illusts'         ],
			['^/(?:[a-z]{2}/)?users/\\d+/manga',                 'user/mangas'          ],
			['^/(?:[a-z]{2}/)?users/\\d+/request',               'user/reqs'            ],
			['^/user/\\d+/series/\\d+',                          'user/series'          ],
			['^/(?:[a-z]{2}/)?users/\\d+/artworks',              'user/works'           ],
		].map(
			([strPath, route]) => new Route(new RegExp(strPath), route, route.split('/'))
		)
	)

	const allBodyClasses = ['crx_body', ...new Set(pathsAndRoutes.flatMap(route => route.classes))]

	const _ = {
		currHref: null,
		pathsAndRoutes
	}

	const Router = {
		_, // Internal variables for debug
		set currHref (href) {
			if (_.currHref !== href) {
				sendRouteChangeEvent(href)
			}
			_.currHref = href
		},
		allBodyClasses,
		currentRoute: null
	}

	return Router

	function Route (regExp, path, classes) {
		this.regExp = regExp;
		this.path = path;
		this.classes = ['crx_body', ...classes];
	}

	function locationChanged (currHref) {
		const currUrl = new URL(currHref)
		const currentPath = currUrl.pathname + currUrl.search + currUrl.hash;
		const route = Router.currentRoute = findRoute(currentPath);
		if (!route) {
			console.error('Router', `Route not found for Path ${currentPath}`)
		}
		send('route-changed', { route, allBodyClasses })
	}

	function findRoute (currPath) {
		return pathsAndRoutes.find(({ regExp }) => regExp.test(currPath)) || {}
	}
}
