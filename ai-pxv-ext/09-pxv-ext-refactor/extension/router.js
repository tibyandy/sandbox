Extensor.Module = function Router ({ on, send }) {
	window.crx = { page: {}, history: [] }

	on('location-change', locationChanged)
	const pathsAndRoutes = (
		[	['^/(?:[a-z]{2}/)?artworks/\\d+',                    art_cover            ],
			['^/(?:[a-z]{2}/)?artworks/\\d+#.+',                 art_slideshow        ],
			['^/bookmark_detail\\.php',                          artfav_detail        ],
			['^/bookmark_add\\.php',                             artfav_edit          ],
			['^/dashboard',                                      my_dash              ],
			['^/history\\.php',                                  my_hist              ],
			['^/following/collections',                          myfol_cols           ],
			['^/bookmark_new_illust(_r18)?\\.php',               myfol_works          ],
			['^/mypixiv_new_illust\\.php',                       mypix_works          ],
			['^/following/watchlist/manga',                      mywatch_mangas       ],
			['^/following/watchlist/novels',                     mywatch_novels       ],
			['^/new_illust(_r18)?\\.php',                        recent_works         ],
			['^/(?:[a-z]{2}/)?tags/[^/]+/illustrations',         search_illusts       ],
			['^/(?:[a-z]{2}/)?tags/[^/]+/manga',                 search_mangas        ],
			['^/(?:[a-z]{2}/)?tags/[^/]+',                       search_tags          ],
			['^/search',                                         search_words         ],
			['^/(?:[a-z]{2}/)?tags/[^/]+/artworks',              search_works         ],
			['^/discovery',                                      top_discovery        ],
			['^/(?:[a-z]{2}/)?$',                                top_home             ],
			['^/novel',                                          top_novels           ],
			['^/illustration',                                   top_recom_illusts    ],
			['^/cate_r18\\.php',                                 top_recom_illusts_r18],
			['^/manga',                                          top_recom_mangas     ],
			['^/manga\\?r=1',                                    top_recom_mangas     ],
			['^/(?:[a-z]{2}/)?users/\\d+/bookmarks/artworks',    user_favs            ],
			['^/(?:[a-z]{2}/)?users/\\d+/bookmarks/collections', user_favs_cols       ],
			['^/(?:[a-z]{2}/)?users/\\d+/bookmarks/novels',      user_favs_novels     ],
			['^/(?:[a-z]{2}/)?users/\\d+/following',             user_fols            ],
			['^/(?:[a-z]{2}/)?users/\\d+$',                      user_home            ],
			['^/(?:[a-z]{2}/)?users/\\d+/illustrations',         user_illusts         ],
			['^/(?:[a-z]{2}/)?users/\\d+/manga',                 user_mangas          ],
			['^/(?:[a-z]{2}/)?users/\\d+/request',               user_reqs            ],
			['^/user/\\d+/series/\\d+',                          user_series          ],
			['^/(?:[a-z]{2}/)?users/\\d+/artworks',              user_works           ],
		].map(
			([strPath, route]) => new Route(new RegExp(strPath), route.name, route.name.split('_'), route)
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

	function Route (regExp, path, classes, handler) {
		this.regExp = regExp;
		this.path = path;
		this.classes = ['crx_body', ...classes];
		this.handler = handler;
	}

	function locationChanged (currHref) {
		const currUrl = new URL(currHref)
		const currentPath = currUrl.pathname + currUrl.search + currUrl.hash;
		const route = Router.currentRoute = findRoute(currentPath);
		if (!route) {
			console.error('Router', `Route not found for Path ${currentPath}`)
		}

		console.info('mod:Router', 'locationChanged =', currHref)
		updateBodyClassList(route)
		window.crx.page = {
			route: route?.path,
			url: window.location.href
		}
		window.crx.history.push(window.crx.page)
		console.info('mod:Router', 'window.crx', window.crx)
		if (route?.handler) route.handler()
	}

	function updateBodyClassList (route) {
		document.body ? doIt() : document.addEventListener('DOMContentLoaded', doIt)

		function doIt () {
			const bodyClasses = document.body.classList
			allBodyClasses.forEach(c => bodyClasses.remove(c))
			void (route?.classes || []).forEach(c => bodyClasses.add(c))
			console.debug('mod:Router', 'updateBodyClassList', document.body.classList)
		}
	}

	function findRoute (currPath) {
		return pathsAndRoutes.find(({ regExp }) => regExp.test(currPath)) || {}
	}

	function art_cover () {
		waitForElement('figure img[width]').then(mainImg => {
			window.crx.page.mainImg = {
				get loaded() {
					return this._source?.complete && this._source?.naturalWidth !== 0
				},
				...attributesOf(mainImg)
			};
			console.info('mod:Router', 'art_cover', window.crx)
		});
	}
	function art_slideshow () {}
	function artfav_detail () {}
	function artfav_edit () {}
	function my_dash () {}
	function my_hist () {}
	function myfol_cols () {}
	function myfol_works () {}
	function mypix_works () {}
	function mywatch_mangas () {}
	function mywatch_novels () {}
	function recent_works () {}
	function search_illusts () {}
	function search_mangas () {}
	function search_tags () {}
	function search_words () {}
	function search_works () {}
	function top_discovery () {}
	function top_home () {}
	function top_novels () {}
	function top_recom_illusts () {}
	function top_recom_illusts_r18 () {}
	function top_recom_mangas () {}
	function user_favs () {}
	function user_favs_cols () {}
	function user_favs_novels () {}
	function user_fols () {}
	function user_home () {}
	function user_illusts () {}
	function user_mangas () {}
	function user_reqs () {}
	function user_series () {}
	function user_works () {}



	function waitForElement (selector, parent = document.body) {
		return new Promise((resolve, reject) => {
			document.body ? doIt() : document.addEventListener('DOMContentLoaded', doIt)

			function doIt () {
				// Check if element already exists
				const element = parent.querySelector(selector);
				if (element) return resolve(element);

				// Create observer
				const observer = new MutationObserver((mutations, obs) => {
					const found = parent.querySelector(selector);
					if (found) {
						obs.disconnect();
						resolve(found);
					}
				});

				// Start observing
				observer.observe(parent, {
					childList: true,
					subtree: true
				});
			};
		})
	}

	function attributesOf (e) {
		const result = {}
		for (const attr of e.attributes) {
			result[attr.name] = attr.value;
		}
		result._source = e
		return result
	}
}
