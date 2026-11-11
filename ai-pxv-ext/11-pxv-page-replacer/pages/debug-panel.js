void function debugPanel () {
	const debugPanelJsml = JSML(
		{ div: [{ id: 'qxiv' },
			{ div: [{ id: 'qx-page-data' } ]},
			{ div: [{ id: 'qx-debug-panel' },
				{ div: [{ id: 'qx-debug' },
					{ h3: [ 'debug' ]},
					{ ul: 0 }
				]},
				{ div: [{ id: 'qx-fetch' },
					{ h3: [ 'fetch' ]},
					{ ul: 0 }
				]},
			]}
		]}
	)

	Q._debugUl = null
	Q._fetchUl = null
	Q._pageDataDiv = null

	Q.initDebugPanel = () => {
		if (document.querySelector('#qx-debug-panel')) {
			Q.debug('debugPanel.init', '#qx-debug-panel already exists').andLog()
			return
		}
		Q.whenBodyReady(() => {
			Q.debug('debugPanel.init', 'adding debug panel').andLog()
			document.body.prepend(debugPanelJsml.asNode)
			setTimeout(() => {
				Q._debugUl = document.querySelector('#qx-debug ul')
				Q._fetchUl = document.querySelector('#qx-fetch ul')
				Q._pageDataDiv = document.querySelector('#qx-page-data')
				Q.info('debugPanel', 'started successfully').andLog()
			})
		})
	}

	Q.logOnPanel = (panel, now, level, args) => new Promise((resolve, reject) =>
		setTimeout(() => {
			try {
				Q.addDebugMessage(panel, now, level, args)
				resolve()
			} catch (e) {
				Q.error('debugPanel.debug', e).andLog()
				reject(e)
			}
		})
	)

	Q.addDebugMessage = (panel, now, level, args) => {
		panel.prepend(JSML({
			li: [{ class: level },
				...[now, ...args].map(msg => ({ span: [msg] }))
			]
		}).asNode)
	}

	Q.on('log', ({ now, level, args }) => {
		args = args.length > 1 ? [`[${args.shift()}]`, ...args] : args
		args = args.map(a => a + ' ')
		Q.logOnPanel(Q._debugUl, now, level, args)
	})
	Q.on('fetch-before', ({ now, url }) => {
		const level = url.startsWith('/ajax') ? 'info' : 'debug'
		const [urlPrefix, queryString] = url.split('?')
		let qsJson
		if (queryString) {
			const params = new URLSearchParams(queryString)
			const qs = {}
			for (const [key, value] of params) {
				if (qs[key]) {
					qs[key] = Array.isArray(qs[key]) ? [...qs[key], value] : [qs[key], value];
				} else {
					qs[key] = value
				}
				qsJson = ' ? ' + JSON.stringify(qs).replaceAll(/[,\|\~\/;\{\:\-]/g, '$&\u200B')
			}
		}
		if (!urlPrefix.startsWith('/')) {
			const [urlHead, ...urlTail] = urlPrefix.split('://')
			Q.logOnPanel(Q._fetchUl, now, level, [urlHead + '://', ...urlTail, ...(qsJson ? [qsJson] : [])])
		} else {
			const [urlHead, ...urlTail] = urlPrefix.split('/').slice(1)
			Q.logOnPanel(Q._fetchUl, now, level, ['/' + urlHead + '/', urlTail.join('/'), ...(qsJson ? [qsJson] : [])])
		}
	})

	Q._imagePanel = (illust, imgs) => (illust && imgs) ? [
		{ div: [{ class: 'qx-image-panel' },
			{ a: [{ href: '#qx-fullsize' },
				{ img: { src: imgs.regular, style: `aspect-ratio: ${illust.width} / ${illust.height}` }},
			]}
		]}
	] : []

	Q._userPanel = (user) => (user) ? [
		{ div: [{ class: 'qx-user-panel' },
			{ a: [{ href: `/en/users/${user.id}` },
				{ div: [{ class: 'qx-id'           }, { span: ['id: ']      }, { span: [ user.id      ]}                 ]},
				{ div: [{ class: 'qx-name'         }, { span: ['name: ']    }, { span: [ user.name    ]}                 ]},
				{ div: [{ class: 'qx-account'      }, { span: ['account: '] }, { span: [ user.account ]}                 ]},
				{ div: [{ class: 'qx-profileImage' }, { span: ['profile: '] }, { img:  [{ src: user.profileImageUrl }] } ]},
			]}
		]}
	] : []

	Q._thumbPanel = (illust, imgs, post) => (illust && imgs && post) ? [
		{ div: [{ class: 'qx-section qx-panel qx-thumb-panel' },
			{ a: [{ href: post.url },
				{ img: { src: imgs.thumb }},
				{ div: [{ class: 'qx-id'       }, '#' + illust.id ]},
				{ div: [{ class: 'qx-index'    }, post.index + ' of ' + post.count ]},
				{ div: [{ class: 'qx-date'     }, post.date       ]},
			]},
			...(post.pageCount > 1 ? [
				{ div: [{ class: 'qx-pages' },
					{ a: [{ href: '#pages' }, { span: [ post.pageCount ]}, { span: [' pages'] } ]}
				]}
			] : []),
			{ a: [{ href: '#fullsize' },
				{ div: [{ class: 'qx-fullsize' }, illust.width + 'x' + illust.height ]}
			]},
		]},
		{ div: [{ class: 'qx-section qx-panel qx-title'    }, post.title ]},
		{ div: [{ class: 'qx-section qx-count-panel' },
			{ div: [{ class: 'qx-panel qx-view-count'     }, { span: [ post.viewCount     ]}, { span: [' views']     } ]},
			{ div: [{ class: 'qx-panel qx-like-count'     }, { span: [ post.likeCount     ]}, { span: [' likes']      } ]},
			{ div: [{ class: 'qx-panel qx-bookmark-count' }, { span: [ post.bookmarkCount ]}, { span: [' bookmarks'] } ]},
		]},
		{ div: [{ class: 'qx-section qx-flags-panel'     },
			{ div: [{ class: 'qx-panel qx-type'          }, { span: ['type: ']          }, { span: [ post.type          ]} ]},
			{ div: [{ class: 'qx-panel qx-restrict'      }, { span: ['restrict: ']      }, { span: [ post.restrict      ]} ]},
			{ div: [{ class: 'qx-panel qx-xRestrict'     }, { span: ['xRestrict: ']     }, { span: [ post.xRestrict     ]} ]},
			{ div: [{ class: 'qx-panel qx-sl'            }, { span: ['sl: ']            }, { span: [ post.sl            ]} ]},
			{ div: [{ class: 'qx-panel qx-ai'            }, { span: ['ai: ']            }, { span: [ post.ai            ]} ]},
		]},
	] : []

	Q._tagsPanel = (tags) => (tags) ? [
		{ div: [{ class: 'qx-section qx-panel qx-tags' },
			...Object.entries(tags).map(([t, v]) => (
				{ div: [{ a: [
					{ href: `/en/tags/${encodeURI(t)}`, class: 'qx-tag' },
					(v.english) ? [{ span: [{ class: 'qx-en' }, v.english ] }, ' ']
					: (v.romaji) ? [{ span: [{ class: 'qx-ro' }, v.romaji ] }, ' ']
					: [],
					{ span: [{ class: 'orig' }, '#' + t ] }
				].flat() }] }
			))
		]}
	] : [],

	Q._bookmarkDataPanel = (bookmarkData) => (bookmarkData) ? [
		{ div: [{ span: ['bookmarkData: '] }, { span: [JSON.stringify(bookmarkData)]} ]}
	] : []

	Q._userIllustsPanel = (userIllusts) => (userIllusts) ? [
		{ div: [
			{ class: 'qx-user-illusts '},
			...userIllusts.map(i => (
				{ div: [
					{ a: [{ href: i.illust.id },
						{ div: [
							(i.imgs) ? { img: [{ src: i.imgs.thumb }] } : { span: [i.illust.id] }
						]},
						{ div: [i.index] },
					]}
				]}
			))
		]}
	] : []

	Q.on('render-route', (routeSummary) => {
		Q._routeSummaryJson = routeSummary
		const { illust, imgs, user, post, bookmarkData, tags, userIllusts } = routeSummary
		const panelsJsml = JSML(
			{ div: [
				{ div: [{ class: 'qx-main' },
					Q._imagePanel(illust, imgs),
				].flat() },
				{ div: [{ class: 'qx-side' },
					Q._userPanel(user),
					Q._userIllustsPanel(userIllusts),
					{ div: [{ class: 'qx-work-info' },
						Q._thumbPanel(illust, imgs, post),
						Q._tagsPanel(tags),
						Q._bookmarkDataPanel(bookmarkData),
					].flat() }
				].flat() }
			]}
		)
		Q.log(JSON.stringify(panelsJsml)).andLog()
		const panels = panelsJsml.asNode.childNodes

		console.log(panelsJsml.asHtml)
		Q._pageDataDiv.replaceChildren(...panels)
	})

	Q.initDebugPanel()
}()