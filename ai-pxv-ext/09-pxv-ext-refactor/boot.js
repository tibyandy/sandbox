const CONFIG = {
	chromeExtensionLibPath: 'lib/extensor.js',
	mainScriptPath:         'main.js',
}

const { log, debug, info, error, warn } = console
const bold = '; font-weight: bold'
const green = 'color: #00cc99; font-weight: bold'
const blue = 'color: #0099cc' + bold
const orange = 'color: #cc9900' + bold
const purple = 'color: #aa3399' + bold
const formatString = () => `%c${(performance.now() / 1000).toFixed(4)} [%s] %s`

Object.defineProperties(console, {
	debug: { get: () => debug.bind(console, formatString(), green) },
	info: { get: () => info.bind(console, formatString(), green) },
	error: { get: () => error.bind(console, formatString.complete, orange) },
})

console.info('Ext:Boot', 'Starting!')

document.addEventListener('DOMContentLoaded', () => console.info('Ext:Boot', 'URL DOMContentLoaded:', location.href));
window.addEventListener('load', () => console.info('Ext:Boot', 'URL OnLoad:', location.href));

window.addEventListener('message', ({ source, data }) => {
  if (source !== window || !data || data.type !== 'PXTRA_DB_REQUEST') return
  const { action, payload, requestId } = data
  chrome.runtime.sendMessage({ action, payload }, response => {
    window.postMessage({ type: 'PXTRA_DB_RESPONSE', requestId, response }, '*')
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action !== "PXTRA_LOG") return
	window.postMessage({ type: "SWORKER_LOG", request }, "*")
});

window.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SWORKER_LOG") {
		const { type, message } = event.data.request.data
		console[type]('Ext:ServiceWorker', ...message)
	}
})

start(CONFIG)

function start (CONFIG) {
	const script = document.createElement('script')
	script.src = chrome.runtime.getURL(CONFIG.chromeExtensionLibPath);
	script.setAttribute('data-app-script', CONFIG.mainScriptPath);
	script.setAttribute('data-chrome-runtime-url', chrome.runtime.getURL(''));
	script.onload = () => {
		script.remove()
		console.debug('Ext:Boot', 'Booted:', script.src)
	}
	script.onerror = e => {
		script.remove()
		console.error('Ext:Boot', 'FATAL ERROR!!!',
			`\nUnable to load "${CONFIG.chromeExtensionLibPath}"!!!`,
			`\nCheck if the path is correct and if "manifest.json" includes it on "web_accessible_resources"`,
			e
		)
	}
	void (document.head || document.documentElement).prepend(script)
	console.debug('Ext:Boot', 'Injected:', script.src)
}
