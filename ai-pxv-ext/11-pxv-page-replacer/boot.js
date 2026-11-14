const CONFIG = {
	mainScript: 'main.js',
}

const { log, debug, info, error, warn } = console
const bold = 'font-weight: bold'
const green = 'color: #00cc99;' + bold
const blue = 'color: #0099cc;' + bold
const orange = 'color: #cc9900;' + bold
const purple = 'color: #aa3399;' + bold
const formatString = () => `%cQ* %c${(performance.now() / 1000).toFixed(4)} %c[%s] %s`

Object.defineProperties(console, {
	debug: { get: () => debug.bind(console, formatString(), cDebug, bold, cDebug) },
	info: { get: () => info.bind(console, formatString(), cInfo, bold, cInfo) },
	error: { get: () => error.bind(console, formatString(), cError, bold, purple) },
})

console.debug('boot', 'starting')

const debugEventListener = (target, listener) =>
	target.addEventListener(listener, () => console.debug('boot', `URL ${listener}:`, location.href))

debugEventListener(document, 'DOMContentLoaded')
debugEventListener(window, 'load')

start(CONFIG)

function start ({ mainScript }) {
	const s = document.createElement('script')
	const getUrl = chrome.runtime.getURL
	s.src = getUrl(mainScript);
	s.setAttribute('data-chrome-runtime-url', getUrl(''))
	s.onload = () => {
		s.remove()
		console.debug('boot', 'launched:', s.src)
	}
	s.onerror = e => {
		s.remove()
		console.error('boot', 'fatal:',
			`\nUnable to load "${CONFIG.chromeExtensionLibPath}"!!!`,
			`\nCheck if the path is correct and if "manifest.json" includes it on "web_accessible_resources"`,
			e
		)
	}
	;(document.head || document.documentElement).prepend(s)
	console.debug('boot', 'injected:', s.src)
}
