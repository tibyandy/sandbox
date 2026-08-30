const CONFIG = {
	chromeExtensionLibPath: 'lib/extensor.js',
	mainScriptPath:         'main.js',
}

const green = 'color: #00cc99; font-weight: bold'
const log = () => [
	`%c${(performance.now() / 1000).toFixed(4)} [Ext:Boot] %s`,
	green
]

console.debug(...log(), 'start')

document.addEventListener('DOMContentLoaded', () => console.info(...log(), `loaded "${location.href}"`));
window.addEventListener('load', () => console.info(...log(), 'loaded all page content'));

start(CONFIG)

function start (CONFIG) {
	const script = document.createElement('script')
	script.src = chrome.runtime.getURL(CONFIG.chromeExtensionLibPath);
	script.setAttribute('data-app-script', CONFIG.mainScriptPath);
	script.setAttribute('data-chrome-runtime-url', chrome.runtime.getURL(''));
	script.onload = () => {
		script.remove()
		console.info(...log(), `loaded "${script.src}"`)
	}
	script.onerror = e => {
		script.remove();
		console.error(...log(), 'FATAL ERROR!!!',
			`\nUnable to load "${CONFIG.chromeExtensionLibPath}"!!!`,
			`\nCheck if the path is correct and if "manifest.json" includes it on "web_accessible_resources"`,
			e
		)
	}
	void (document.head || document.documentElement).prepend(script);
}
