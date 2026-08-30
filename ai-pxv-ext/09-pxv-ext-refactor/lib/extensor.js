void function setupExtensor () {
	overrideConsole()
	console.debug('Ext:Core', 'initializing')
	let initialized = false

	const originalFetch = window.fetch
	window.fetch = fetchWithEvents
	console.debug('Ext:Core', 'window.fetch overridden')
	
	const chromeRuntimeUrl = document.currentScript.getAttribute('data-chrome-runtime-url')
	const appScript = document.currentScript.getAttribute('data-app-script')	
	const getUrl = buildGetUrl()
	const extensorModules = {}
	const extensorQueuedEvents = []
	const Module = { get load () { return load } }

	let unkModuleId = 1000

	window.Extensor = {
		set Module (moduleFn) { return addModule(moduleFn) },
		set Main (mainModule) { startMainModule(mainModule) },
		get Module () { return Module },
		get Modules () { return extensorModules },
		loadCss,
		on: onEvent,
		send: sendEvent,
		_: { // exposed internals, for debug purposes
			originalFetch,
			getUrl,
			appScript,
			modules: extensorModules,
			queuedEvents: extensorQueuedEvents,
		}
	}
	const Extensor = window.Extensor
	console.debug('Ext:Core', `loading Main script "${appScript}"`)
	Module.load(appScript)
	return

	async function startMainModule (main) {
		try {
			await addModule(main, true)
			console.info('Ext:Core', 'successfully initialized')
			initialized = true
		} catch (e) {
			console.error('Ext:Core', 'FATAL ERROR: could not run Main script\n', e)
		}
	}

	function overrideConsole () {
		const { log, debug, info, error, warn } = console
		const now = () => (performance.now() / 1000).toFixed(4);

		const bold = '; font-weight: bold'
		const green = 'color: #00cc99' + bold
		const blue = 'color: #0099cc' + bold
		const orange = 'color: #cc9900' + bold
		const purple = 'color: #aa3399' + bold
		const auto = 'color: auto'
		const formatString = {
			get short () { return `%c${now()}%c %s` },
			get complete () { return `%c${now()} %c[%s]` }
		}

		Object.defineProperties(console, {
			log: { get: () => log.bind(console, formatString.short, purple, auto) },
			debug: { get: () => debug.bind(console, formatString.complete, green, blue) },
			info: { get: () => info.bind(console, formatString.complete, green, blue) },
			warn: { get: () => warn.bind(console, formatString.complete, orange, purple) },
			error: { get: () => error.bind(console, formatString.complete, orange, purple) },
		});
		Object.freeze(console);
	}

	function buildGetUrl () {
		return url => `${chromeRuntimeUrl}${url}`
	}

	async function fetchWithEvents(...args) {
		const url = args[0]
		const eventObject = { url, ...args[1] }
		Extensor.send('fetch-before', eventObject);
		try {
			const originalResponse = await originalFetch.apply(this, args);
			const response = originalResponse.clone();
			Extensor.send('fetch-after', 'fetch-success', { url, response, ...eventObject });
			return originalResponse;
		} catch (error) {
			Extensor.send('fetch-after', 'fetch-error', { url, error, ...eventObject });
			throw error;
		}
	}

	async function addModule (moduleNamedFn, isMain) {
		const moduleName = moduleNamedFn.name || ('UnknownModule' + ++unkModuleId)
		const logModuleName = isMain ? 'Ext:Main' : `Mod:${moduleName}`
		console[isMain ? 'info' : 'debug'](logModuleName, `executing`)
		try {
			extensorModules[moduleName] = await moduleNamedFn(Extensor)
			console.info(logModuleName, 'successfully activated')
			sendEvent(['module-activated'], { moduleName });
		} catch (e) {
			console.error(logModuleName, 'ERROR: could not activate\n', e)
		}
	}

	function sendEvent (...args) {
		if (args.lengths < 2) {
			console.error('Ext:Core', 'send', 'Expected at least 2 args: (...eventNames, data)')
			return
		}
		const data = args.pop()
		const eventNames = args
		eventNames.map(eventName => sendSingleEvent(eventName, data))
	}		

	function onEvent (...args) {
		if (args.lengths < 2) {
			console.error('Ext:Core', 'on', 'Expected at least 2 args: (...eventNames, callback)')
			return
		}
		const callback = args.pop()
		const eventNames = args
		eventNames.map(eventName => onSingleEvent(eventName, callback))
	}

	function sendSingleEvent (eventName, data) {
		extensorQueuedEvents.push(new CustomEvent('crx:' + eventName, { detail: data }))
		if (initialized) {
			for (const event of extensorQueuedEvents) {
				window.dispatchEvent(event);
			}
			extensorQueuedEvents.length = 0
		}
	}		

	function onSingleEvent (eventName, callback) {
		window.addEventListener('crx:' + eventName, e => callback(e.detail, e));
	}

	function load (...scriptUrls) {
		return Promise.all(scriptUrls.map(loadJs))
	}

	function loadJs (scriptUrl) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = getUrl(scriptUrl);
			script.onload = () => { script.remove(); resolve(script) }
			script.onerror = () => { script.remove(); reject(script) }
			const elem = (document.head || document.documentElement)
			if (!elem) {
				console.error('Ext:Core', 'ERROR: cannot add script!\n', script.src)
			}
			elem.prepend(script);
		})
	}

	function loadCss (cssUrl) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = getUrl(cssUrl);
		(document.head || document.documentElement).appendChild(link);
	}
}()