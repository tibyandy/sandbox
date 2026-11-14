void function debugPanel () {
	const debugPanelJsml = JSML(
		{ div: [{ id: 'qxiv' },
			{ div: [{ id: 'qx-page-data' } ]},
			{ div: [{ id: 'qx-debug-panel' },
				{ div: [
					{ h3: [ 'debug' ]},
					{ ul: 0 }
				]},
				{ div: [{ id: 'qx-fetch-panel' },
					{ h3: [ 'fetch' ]},
					{ ul: 0 }
				]},
			]}
		]}
	)

	Q.debugPanel = {
		debugUl: null,
		fetchUl: null,
		pageDataDiv: null,
	}

	Q.debugPanel.init = () => {
		if (document.querySelector('#qx-debug-panel')) {
			Q.debug('debugPanel.init', '#qx-debug-panel already exists and is probably already initialized').andLog()
			return
		}
		Q.whenBodyReady(() => {
			Q.debug('debugPanel.init', 'adding debug panel').andLog()
			document.body.prepend(debugPanelJsml.asNode)
			setTimeout(() => {
				Q.debugPanel.debugUl = document.querySelector('#qx-debug-panel ul')
				Q.debugPanel.fetchUl = document.querySelector('#qx-fetch-panel ul')
				Q.debugPanel.pageDataDiv = document.querySelector('#qx-page-data')
				Q.info('debugPanel', 'started successfully').andLog()
			})
		})
	}

	Q.debugPanel.log = (panel, now, level, args) => new Promise((resolve, reject) =>
		setTimeout(() => {
			try {
				Q.debugPanel.addDebugMessage(panel, now, level, args)
				resolve()
			} catch (e) {
				Q.error('debugPanel.debug', e).andLog()
				reject(e)
			}
		})
	)

	Q.debugPanel.addDebugMessage = (panel, now, level, args) => {
		panel.prepend(JSML({
			li: [{ class: level },
				...[now, ...args].map(msg => (msg instanceof JSML) ? msg.source : ({ span: [msg] }))
			]
		}).asNode)
	}

	Q.on('log', ({ now, level, args }) => {
		args = args.length > 1 ? [`[${args.shift()}]`, ...args] : args
		args = args.map(a => a + ' ')
		Q.debugPanel.log(Q.debugPanel.debugUl, now, level, args)
	})

	Q.on('fetch-before', ({ now, url }) => {
		if (!url) return
		const level = url.startsWith('/ajax') ? 'info' : 'debug'
		const [urlPrefix, queryString] = url.split('?')
		const qsJson = []
		if (queryString) {
			const params = new URLSearchParams(queryString)
			const qs = {}
			for (const [key, value] of params) {
				if (qs[key]) {
					qs[key] = Array.isArray(qs[key]) ? [...qs[key], value] : [qs[key], value];
				} else {
					qs[key] = value
				}
			}
			qsJson.push('?', JSML({ span: [{ class: 'qx-qs' }, JSON.stringify(qs).replaceAll(/[,\|\~\/;\{\:\-]/g, '$&\u200B')] }))
		}
		if (!urlPrefix.startsWith('/')) {
			const [urlHead, ...urlTail] = urlPrefix.split('://')
			Q.debugPanel.log(Q.debugPanel.fetchUl, now, level, [urlHead + '://', ...urlTail, ...qsJson])
		} else {
			const [urlHead, ...urlTail] = urlPrefix.split('/').slice(1)
			Q.debugPanel.log(Q.debugPanel.fetchUl, now, level, ['/' + urlHead + '/', urlTail.join('/'), ...qsJson])
		}
	})

	Q.debugPanel.init()
}()