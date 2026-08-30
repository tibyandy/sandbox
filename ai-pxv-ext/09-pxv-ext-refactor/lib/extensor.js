(() => {
	const _chromeRuntimeUrl = document.currentScript.getAttribute('data-chrome-runtime-url')
	const _appScript = document.currentScript.getAttribute('data-app-script')
	const _modules = {}
	const _eventQueue = []

	const _getUrl = url => `${_chromeRuntimeUrl}${url}`;
	const now = () => (performance.now() / 1000).toFixed(4);

	let _initialized = false

	console.log('[Extensor] starting', performance.now())

	_overrideWindowFetch();

	const load = {
		js: _loadJs,
		css: _loadCss
	}

	window.Extensor = function Extensor () {
		const opts = { _debug: true, _console: null }
		const Ext = {
			get now () { return now },
			get console() { return module('Console') },
			get debug () { return opts._debug },
			set debug (debug) { opts._debug = debug; return Ext },
			load, addModule, module, send, on
		}
		_init();
		return Ext

		async function _init () {
			opts._console = await load.js('lib/extensor-console.js')
			try {
				await load.js(_appScript);
				_initialized = true;
			} catch (e) {
				console.error(e)
				send('error', Ext);
			}
			send('start', Ext);
		}
	}

	function _overrideWindowFetch () {
		const originalFetch = window.fetch;

		window.fetch = async function(...args) {
			const url = args[0]
			const eventObject = { url, ...args[1] }
			send('fetch-before', eventObject);
			try {
				const originalResponse = await originalFetch.apply(this, args);
				const response = originalResponse.clone();
				send('fetch-after', 'fetch-success', { url, response, ...eventObject });
				return originalResponse;
			} catch (error) {
				send('fetch-after', 'fetch-error', { url, error, ...eventObject });
				throw error;
			}
		}
		console.log('[Extensor] fetch overridden', performance.now())
	}

	async function addModule (moduleName, moduleDef) {
		_modules[moduleName] = moduleDef()
		await _modules[moduleName]
		console.debug(moduleName, 'Module activated')
		send(['module-activated'], { moduleName });
	}

	function module (moduleName) {
		return _modules[moduleName]
	}

	function send(...args) {
		if (args.lengths < 2) throw Error('Expected at least 2 args: (...eventNames, data)')
		const data = args.pop()
		const eventNames = args
		eventNames.map(eventName => _sendEvent(eventName, data))
	}		

	function on (...args) {
		if (args.lengths < 2) throw Error('Expected at least 2 args: (...eventNames, callback)')
		const callback = args.pop()
		const eventNames = args
		eventNames.map(eventName => _onEvent(eventName, callback))
	}

	function _sendEvent (eventName, data) {
		_eventQueue.push(new CustomEvent('crx:' + eventName, { detail: data }))
		if (_initialized) {
			for (const event of _eventQueue) {
				window.dispatchEvent(event);
			}
			_eventQueue.length = 0
		}
	}		

	function _onEvent (eventName, callback) {
		window.addEventListener('crx:' + eventName, e => callback(e.detail, e));
	}

	function _loadJs (scriptUrl) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = _getUrl(scriptUrl);
			script.onload = () => { script.remove(); resolve(script) }
			script.onerror = () => { script.remove(); reject(script) }
			(document.head || document.documentElement).prepend(script);
		})
	}

	function _loadCss (cssUrl) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = _getUrl(cssUrl);
		(document.head || document.documentElement).appendChild(link);
	}

	Extensor.module = module
	Extensor.addModule = addModule
	Extensor.send = send
	Extensor.on = on
	Extensor.load = load
	// Object.defineProperties(Extensor, { 'console': { get: () => module('Console') } });
	Extensor()
})()
