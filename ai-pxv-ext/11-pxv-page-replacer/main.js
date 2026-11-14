const Q = window.Q = {}

Q.initialized = false
Q.queuedEvents = []

Q.sendLog = (level, now = Q.now()) =>
	((...args) => Q.send(`log`, {now, level, args}))

Q.overrideConsole = () => {
	const { log, debug, info, error, warn } = console
	let savedNow
	Q.now = () => savedNow = (performance.now() / 1000).toFixed(2);
	const now = () => {
		const result = savedNow || Q.now()
		savedNow = null
		return result
	}

	const bold = 'font-weight: bold'
	const green = 'color: #00cc99;' + bold
	const blue = 'color: #0099cc;' + bold
	const orange = 'color: #cc9900;' + bold
	const purple = 'color: #aa3399;' + bold
	const auto = 'color: auto'
	const formatString = {
		get short () { return `%c${now()}%c %s` },
		get complete () { return `%cQ* %c${now()} %c[%s] %s` }
	}

	Object.defineProperties(console, {
		log: { get: () => log.bind(console, formatString.short, purple, auto) },
		debug: { get: () => debug.bind(console, formatString.complete, blue, bold, blue) },
		info: { get: () => info.bind(console, formatString.complete, green, bold, green) },
		warn: { get: () => warn.bind(console, formatString.complete, orange, bold, purple) },
		error: { get: () => error.bind(console, formatString.complete, orange, bold, purple) },
	});
	Object.freeze(console)

	const qLogger = lv => (...args) => {
		Q.send('log', { now: Q.now(), level: lv, args })
		return { get andLog () { return console[lv].bind(console, ...args) } }
	}
	for (const lv of ['debug', 'error', 'info', 'warn', 'log']) {
		Q[lv] = qLogger(lv)
	}
}
Q.overrideConsole()

Q.send = (...args) => {
	if (args.length < 2) {
		Q.error('main', 'send', 'Expected at least 2 args: (...eventNames, data)').andLog()
		return
	}
	const data = args.pop()
	const eventNames = args
	eventNames.map(eventName => Q.queuedEvents.push(new CustomEvent('Q*' + eventName, { detail: data })))

	if (Q.initialized) {
		Q.queuedEvents.map(event => setTimeout(() => {
			try {
				window.dispatchEvent(event)
			} catch (e) {
				Q.error('event', 'cannot dispatch', event, '\n', e).andLog()
			}
		}))
		Q.queuedEvents.length = 0
	}
}

Q.on = (...args) => {
	if (args.length < 2) {
		Q.error('main', 'on', 'Expected at least 2 args: (...eventNames, callback)').andLog()
		return
	}
	const callback = args.pop()
	const eventNames = args
	eventNames.map(eventName => window.addEventListener('Q*' + eventName, e => callback(e.detail, e)))
}
Q.debug('main', 'starting').andLog()

Q.originalFetch = window.fetch
window.fetch = Q.fetchWithEvents = (() => {
	return async function fetchWithEvents(...args) {
		const url = args[0]
		const eventObject = { url, now: Q.now(), ...args[1] }
		Q.send('fetch-before', eventObject);
		try {
			const originalResponse = await Q.originalFetch.apply(this, args);
			const response = originalResponse.clone();
			Q.send('fetch-after', 'fetch-success', { url, response, ...eventObject });
			return originalResponse;
		} catch (error) {
			Q.send('fetch-after', 'fetch-error', { url, error, ...eventObject });
			throw error;
		}
	}
})()
Q.debug('main', 'window.fetch overridden').andLog()

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