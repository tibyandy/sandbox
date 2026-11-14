'use strict'

/**
 * PlugXT - Plug Extensions
 * Create browser extensions easily.
 * Check /plugxt.md for more info.
 */
void (() => {
	return initializePlugXT(document.currentScript.dataset)

	/* Creates PlugXT.core and PlugXT.f */
	function initializePlugXT (scriptDatasetObject) {
		const globalVar = scriptDatasetObject.extensionGlobalVariable || 'PlugXT'

		/* Singleton instance of PlugXT */
		const PlugXT = new function PlugExtension () {
			const plugXTInstance = new Proxy(this, getPlugXTProxyHandler(globalVar))
			plugXTInstance.core = buildCorePackage(plugXTInstance)
			plugXTInstance.core.settings = buildCoreSettingsModule(plugXTInstance, scriptDatasetObject)
			plugXTInstance.core.console = buildCoreConsoleModule(plugXTInstance)
			plugXTInstance.core.event = buildCoreEventModule(plugXTInstance)
			plugXTInstance.core.fetch = buildCoreFetchModule(plugXTInstance)
			plugXTInstance.f = {
				get currentScript () {
					const { currentScript } = document
					if (!currentScript) return
					return currentScript.src.split('//')[1].split('/').slice(1).join('/')
				}
			}
			return plugXTInstance
		}

		/* Sets PlugXT to a global (window) variable */
		window[scriptDatasetObject.extensionGlobalVariable] = PlugXT

		/* Initializes PlugXT core package */
		PlugXT.core.init()
	}

	function getPlugXTProxyHandler(objName) {
		return {
			get(target, prop) {
				if (typeof prop === 'symbol') return Reflect.get(target, prop)
				if (prop in target) return target[prop]
				throw new Error(`${objName}.${String(prop)} is not defined`)
			},
			set(target, prop, value) {
				if (prop in target) throw new Error(`${objName}.${String(prop)} is already defined`)
				target[prop] = value
				return true
			}
		}
	}

	/* PlugXT.core */
	function buildCorePackage (PlugXT) {
		const _ = {
			error: null
		}
		const module = function PlugXTCoreModule () {}
		return Object.assign(module, {
			async init () { return init (PlugXT.core.settings) },
			__internals: _
		})

		async function init() {
			if (_.error === false) {
				console.warn('core', 'already initialized successfully, skip')
				return
			}
			try {
				PlugXT.core.settings.init()
				PlugXT.core.console.init()
				await Promise.all([
					PlugXT.core.event.init(),
					PlugXT.core.fetch.init()
				])
				console.info('core', 'initialized')
				_.error = false
			} catch (e) {
				_.error = e
				console.error('core', 'error initializing', e)
			}
		}
	}

	/* PlugXT.core.settings */
	function buildCoreSettingsModule (_PlugXT, settings) {
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

		const module = function PlugXTSettingsModule () { return _ }
		module.init = function () {
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
	}

	/* PlugXT.core.console */
	function buildCoreConsoleModule (PlugXT) {
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
		const module = function PlugXTCoreConsoleModule () {}
		return Object.assign(module, {
			init () { return init(PlugXT.core.settings) },
			__internals: _
		})

		function init () {
			const core_settings = PlugXT.core.settings
			console.log('core_settings', PlugXT.core)
			_.extensionName = core_settings.extensionName || _.extensionName
			_.logPrefix = core_settings.logPrefix || _.logPrefix
			_.logColor = core_settings.logColor || _.logColor
			_.debugColor = core_settings.debugColor || _.debugColor
			_.infoColor = core_settings.infoColor || _.infoColor
			_.warnColor = core_settings.warnColor || _.warnColor
			_.errorColor = core_settings.errorColor || _.errorColor

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
	}

	/* PlugXT.core.event */
	function buildCoreEventModule (PlugXT) {
		const _ = {
			handlers: null,
			history: null
		}
		const module = function PlugXTCoreEventModule () {}
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
	}

	/* PlugXT.core.fetch */
	function buildCoreFetchModule (PlugXT) {
		const _ = {
			originalWindowFetch: null,
			send: null,
			fetchWithEvents,
		}
		const module = function PlugXTCoreFetchModule () {}
		return Object.assign(module, {
			init () { init() },
			__internals: _
		})

		function init () {
			_.send = PlugXT.core.event.send
			if (_.originalWindowFetch) return console.warn('core.fetch.init', 'window.fetch already overridden by fetch, skip')
			_.originalWindowFetch = window.fetch
			window.fetch = _.fetchWithEvents
			console.debug('core.fetch.init', 'window.fetch overridden')
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
	}

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

})()