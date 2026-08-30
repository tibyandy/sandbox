const CONFIG = {
	chromeExtensionLibPath: 'lib/extensor.js',
	mainScriptPath:         'main.js',
}

document.addEventListener('DOMContentLoaded', () => {
	console.log('[Extensor] DOM ready', performance.now());
});

console.log('[Extensor] launching', performance.now())
loadLib(document.createElement('script'), CONFIG)
	.catch(e => console.log(
		`[Extensor] FATAL ERROR!!!`, performance.now(),
		`\nUnable to load "${CONFIG.chromeExtensionLibPath}"!`,
		`\nCheck if the path is correct and if "manifest.json" includes it on "web_accessible_resources"`, e))

function loadLib (script, CONFIG) {
	return new Promise((resolve, reject) => {
		script.src = chrome.runtime.getURL(CONFIG.chromeExtensionLibPath);
		script.setAttribute('data-app-script', CONFIG.mainScriptPath);
		script.setAttribute('data-chrome-runtime-url', chrome.runtime.getURL(''));
		script.onload = () => { script.remove(); resolve() }
		script.onerror = e => { script.remove(); reject(e) }
		(document.head || document.documentElement).prepend(script);
	})
}

