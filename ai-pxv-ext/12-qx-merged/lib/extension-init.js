'use strict'

void function startExtensionGlobalObject() {
	const settingsFromDataset = document.currentScript.dataset
	console.log('settingsFromDataset', settingsFromDataset)
	const GLOBAL_VAR = settingsFromDataset.extensionGlobalVariable || 'CRX'

	function ProxyObject() {
		return new Proxy({}, {
			get(target, prop) {
				if (typeof prop === 'symbol') return Reflect.get(target, prop)
				if (prop in target) return target[prop]
				throw new Error(`${GLOBAL_VAR}.${String(prop)} is not defined`)
			},
			set(target, prop, value) {
				if (prop in target) throw new Error(`${GLOBAL_VAR}.${String(prop)} is already defined`)
				target[prop] = value
				return true
			}
		})
	}

	const CRX = window[GLOBAL_VAR] = new ProxyObject()
	queueMicrotask(() => {
		CRX.settings.init(settingsFromDataset)
		CRX.core.init(CRX.settings)
	})

	CRX.utils = {
		get currentScript () { return document.currentScript.src.split('//')[1].split('/').slice(1).join('/') },
	}

	CRX.settings = (function ExtensionSettingsModuleBuilder () {
		const _ = Object.seal({
			moduleScripts: null,
			extensionGlobalVariable: null,
			extensionName: null,
			logPrefix: null,
			logColor: null,
			debugColor: null,
			infoColor: null,
			warnColor: null,
			errorColor: null,
			chromeRuntimeUrl: null,
		})

		const module = function ExtensionSettingsModule () { return _ }
		module.init = function (settings) {
			for (const key of Object.keys(_)) {
				try {
					_[key] = settings[key] || _[key]
				} catch (e) {
					console.error(e)
				}
			}
			console.log(settings)
		}
		module.__internals = _

		for (const key of Object.keys(_)) {
			Object.defineProperty(module, key, {
				get() { return _[key] },
				set(value) { _[key] = value },
				configurable: true,
				enumerable: true,
			})
		}

		return Object.seal(module)
	})()

	CRX.core = (function ExtensionCoreModuleBuilder () {
		const _ = {
			error: null
		}
		const module = function ExtensionCoreModule () {}
		return Object.assign(module, {
			async init (crxSettings) { return init (crxSettings) },
			__internals: _
		})

		async function init(crxSettings) {
			if (_.error === false) {
				console.warn('core', 'already initialized successfully, skip')
				return
			}
			try {
				CRX.core.console.init(crxSettings)
				await Promise.all([
					CRX.core.event.init(),
					CRX.core.fetch.init()
				])
				console.info('core', 'initialized')
				_.error = false
			} catch (e) {
				_.error = e
				console.error('core', 'error initializing', e)
			}
		}
	})()

	CRX.core.console = (function ExtensionCoreConsoleModuleBuilder () {
		const _ = {
			originalWindowConsole: null,
			logPrefix: 'CRX',
			formatString: {
				get short() { return `%c${_.now()} %c%s` },
				get complete() { return `%c${_.logPrefix} %c${_.now()} %c[${_.extensionName}.%s]` }
			},
			get bold () { return 'font-weight: bold' },
			get cLog () { return `color: ${_.logColor}; ${_.bold}` },
			get cDebug () { return `color: ${_.debugColor}; ${_.bold}` },
			get cInfo () { return `color: ${_.infoColor}; ${_.bold}` },
			get cWarn () { return `color: ${_.warnColor}; ${_.bold}` },
			get cError () { return `color: ${_.errorColor}; ${_.bold}` },
			now: () => (performance.now() / 1000).toFixed(2)
		}
		const module = function ExtensionCoreConsoleModule () {}
		return Object.assign(module, {
			init (crxSettings) { return init(crxSettings) },
			__internals: _
		})

		function init (crxSettings) {
			_.extensionName = crxSettings.extensionName || _.extensionName
			_.logPrefix = crxSettings.logPrefix || _.logPrefix
			_.logColor = crxSettings.logColor || _.logColor
			_.debugColor = crxSettings.debugColor || _.debugColor
			_.infoColor = crxSettings.infoColor || _.infoColor
			_.warnColor = crxSettings.warnColor || _.warnColor
			_.errorColor = crxSettings.errorColor || _.errorColor

			if (_.originalWindowConsole) {
				console.warn('core.console.init', 'skipping already overridden window.console')
				return
			}

			const { log, debug, info, error, warn } = _.originalWindowConsole = console
			Object.defineProperties(console, {
				log: { get: () => log.bind(console, _.formatString.short, _.cLog, _.bold) },
				debug: { get: () => debug.bind(console, _.formatString.complete, _.cDebug, _.bold, _.cDebug) },
				info: { get: () => info.bind(console, _.formatString.complete, _.cInfo, _.bold, _.cInfo) },
				warn: { get: () => warn.bind(console, _.formatString.complete, _.cWarn, _.bold, _.cWarn) },
				error: { get: () => error.bind(console, _.formatString.complete, _.cError, _.bold, _.cError) },
			})
			Object.freeze(console)

			console.debug('core.console.init', 'window.console overridden')
		}
	})()

	CRX.core.event = (function ExtensionCoreEventModuleBuilder () {
		const _ = {
			handlers: null,
			history: null
		}
		const module = function ExtensionCoreEventModule () {}
		return Object.assign(module, {
			init () { init() },
			on(type, fn) { return on(type, fn) },
			send(type, payload) { return send(type, payload) },
			__internals: _
		})

		function init () {
			if (_.handlers) {
				console.warn('core.event.init', 'already initialized, skip')
				return
			}
			_.handlers = new Map()
			_.history = new Map()
			console.debug('core.event.init', 'ok')
		}

		function on(type, fn) {
			if (!_.handlers.has(type)) _.handlers.set(type, new Set())
			_.handlers.get(type).add(fn)
			_.history.get(type)?.forEach(payload => fn(payload))
			return function off() { _.handlers.get(type)?.delete(fn) }
		}

		function send(type, payload) {
			if (!_.history.has(type)) _.history.set(type, [])
			_.history.get(type).push(payload)
			_.handlers.get(type)?.forEach(fn => fn(payload))
		}
	})()

	CRX.core.fetch = (function ExtensionCoreFetchModuleBuilder () {
		const _ = {
			originalWindowFetch: null,
			fetchWithEvents,
			send
		}
		const module = function ExtensionCoreFetchModule () {}
		return Object.assign(module, {
			init () { init() },
			__internals: _
		})

		function init () {
			if (_.originalWindowFetch) return console.warn('core.fetch.init', 'window.fetch already overridden by fetch, skip')
			_.originalWindowFetch = window.fetch
			window.fetch = _.fetchWithEvents
			console.debug('core.fetch.init', 'window.fetch overridden')
		}

		function send(type, payload) {
			CRX.core.event.send(type, payload)
		}

		async function fetchWithEvents(url, ...args) {
			_.send('fetch-before', { url, args })
			try {
				const response = await _.originalWindowFetch.apply(this, [url, ...args])
				_.send('fetch-success', { url, args, response: response.clone() })
				return response
			} catch (error) {
				_.send('fetch-error', { url, args, error })
				throw error
			}
		}
	})()

	/*
	Q.main = async () => {
		try {
			await Promise.all([
				Q.loadCss('pages/qxv.css').then(() => Q.debug('main', 'css loaded').andLog()),
				Q.loadJs('libs/jsml.js').then(() => Q.debug('main', 'lib-jsml loaded').andLog()),
			]);
			await Promise.all([
				Q.loadJs('pages/debug-panel.js').then(() => Q.debug('main', 'debug-panel loaded').andLog()),
				Q.loadJs('pages/router.js').then(() => Q.debug('main', 'router loaded').andLog()),
				Q.loadJs('libs/waitfor.js').then(() => Q.debug('main', 'lib-waitfor loaded').andLog()),
			])
			Q.whenBodyReady(() => {
				const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
				document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
				Q.main.setFocusBlurInterceptor()
				Q.initialized = true
				Q.info('main', 'started successfully').andLog()
			})
		} catch (e) {
			Q.error('main', 'error starting', e).andLog()
		}
	}

	Q.main.setFocusBlurInterceptor = async () => {
		try {
			const { body } = document
			const toggleDebug = () => body.classList.toggle('qx-debug')
			body.addEventListener('keydown', k => {
				if (k.key === 'Control' && k.altKey) toggleDebug()
				if (k.key === 'Alt' && k.ctrlKey) toggleDebug()
			})
			Q.debug('main.setFocusBlurInterceptor', 'started successfully').andLog()
		} catch (e) {
			Q.error('main.setFocusBlurInterceptor', 'error starting', e).andLog()
		}
	}

	Q.getUrl = (() => {
		const chromeRuntimeUrl = document.currentScript.getAttribute('data-chrome-runtime-url');
		return url => `${chromeRuntimeUrl}${url}`
	})();

	Q.loadCss = cssUrl => new Promise((resolve, reject) => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = Q.getUrl(cssUrl);
		(document.head || document.documentElement).appendChild(link);
		link.onload = () => resolve()
		link.onerror = () => reject()
	})

	Q.loadJs = scriptUrl => new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = Q.getUrl(scriptUrl);
		script.onload = () => { script.remove(); resolve(script) }
		script.onerror = e => { script.remove(); reject(e) }
		const elem = (document.head || document.documentElement)
		if (!elem) {
			Q.error('loadJs', 'ERROR: cannot add script!\n', script.src).andLog()
		}
		elem.prepend(script);
	})

	Q.whenBodyReady = callback => {
		console.info('bodyReady?', !!document.body)
		document.body ? callback() : document.addEventListener('DOMContentLoaded', callback)
	}

	Q.queryStringToObject = url =>
		Object.fromEntries([...new URLSearchParams(url.split('?')[1])]);


	Q.main()

	*/

}()