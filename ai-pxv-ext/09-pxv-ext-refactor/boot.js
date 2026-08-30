const CONFIG = {
	chromeExtensionLibPath: 'lib/extensor.js',
	mainScriptPath:         'main.js',
}

const bold = 'font-weight: bold'
const blue = 'color: #0099cc;' + bold
const green = 'color: #00cc99;' + bold
const log = () => [
	`%c${(performance.now() / 1000).toFixed(4)} %c[Ext:Boot]%c %s`,
	green,
	blue,
	bold
]

console.info(...log(), 'start')

document.addEventListener('DOMContentLoaded', () => console.info(...log(), 'DOM content is loaded'));
window.addEventListener('load', () => console.info(...log(), 'page is loaded'));

start(CONFIG)

function start (CONFIG) {
	const script = document.createElement('script')
	script.src = chrome.runtime.getURL(CONFIG.chromeExtensionLibPath);
	script.setAttribute('data-app-script', CONFIG.mainScriptPath);
	script.setAttribute('data-chrome-runtime-url', chrome.runtime.getURL(''));
	script.onload = () => script.remove()
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
