const bootImportTime = performance.now()
const logScriptName = 'boot.js'
const plugScriptPath = SETTINGS.plug_script_path || 'lib/plugxt.js'

const getUrl = path => chrome.runtime.getURL(path)
const manifest = chrome.runtime.getManifest()
const extName = (manifest.short_name || manifest.name || 'ChRomeXtension')
const extFullName = (manifest.name || manifest.short_name || ('ID:' + chrome.runtime.id))
const extVer = manifest.version
const logPrefix = SETTINGS.log_prefix || 'PlugXT'

const toCamel = key => key.replace(/_+([a-z0-9])/gi, (_, c) => c.toUpperCase())
const config = {
	extensionName: extName,
	extensionFullName: extFullName,
	extensionVersion: extVer,
	...Object.fromEntries(Object.entries(SETTINGS).map(([key, value]) => [toCamel(key), value])),
	chromeRuntimeUrl: getUrl(''),
}

/* Isolated world: this console is not the page's console, so a minimal prefix is enough here. */
const log = (method, ...args) => console[method](`[${logPrefix}] [${extName}]`, ...args)

log('debug',
	`Chrome Extension: "${extFullName}" -- Version ${extVer}`,
	`\n- Launched content script "${logScriptName}" into an isolated world in ${bootImportTime.toFixed(2)}ms`,
	`\n- Importing PlugXT "${plugScriptPath}" into the main world`,
	`\n- Main world URL:`, location.href
)

const debugEventListener = (target, listener) => target.addEventListener(
	listener, () => log('debug', 'Document event triggered:', `"${listener}"`)
)

debugEventListener(document, 'DOMContentLoaded')
debugEventListener(window, 'load')

const plugUrl = new URL(getUrl(plugScriptPath))
if (config.dev) plugUrl.searchParams.set('v', Date.now())

const s = document.createElement('script')
s.src = plugUrl.href
s.dataset.settings = JSON.stringify(config)
s.setAttribute('fetchpriority', 'high')
s.onload = () => {
	s.remove()
	log('info', 'PlugXT script executed in the main world:', plugScriptPath)
}
s.onerror = () => {
	s.remove()
	log('error', `FATAL ERROR: unable to start PlugXT`,
		`\n- Check if "${plugScriptPath}" path is correct and if "manifest.json" includes it on "web_accessible_resources"`)
}
const parent = document.head || document.documentElement
parent.prepend(s)
