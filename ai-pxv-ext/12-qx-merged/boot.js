const bootImportTime = performance.now()
const mainScriptFileName = SETTINGS.main_script || 'main.js'

const getUrl = chrome.runtime.getURL
const manifest = chrome.runtime.getManifest()
const extName = (manifest.short_name || manifest.name || 'ChRomeXtension')
const extFullName = (manifest.name || manifest.short_name || ('ID:' + chrome.runtime.id))
const extVer = manifest.version

const logScriptName = `${new Error().stack.split('/').pop().split(':').shift()}`
const logPrefix = SETTINGS.log_prefix || 'CRX'

void function overrideConsole () {
	const { debug, info, error } = console
	const bold = 'font-weight: bold'
	const cInfo = `color: ${SETTINGS.info_color};` + bold
	const cDebug = `color: ${SETTINGS.debug_color};` + bold
	const cError = `color: ${SETTINGS.error_color};` + bold
	const now = () => (performance.now() / 1000).toFixed(2)
	const formatString = () => `%c${logPrefix} %c${now()} %c[${extName}] %s`
	Object.defineProperties(console, {
		debug: { get: () => debug.bind(console, formatString(), cDebug, bold, cDebug) },
		info: { get: () => info.bind(console, formatString(), cInfo, bold, cInfo) },
		error: { get: () => error.bind(console, formatString(), cError, bold, cError) },
	})
}()

console.debug(
	`Chrome Extension: "${extFullName}" -- Version ${extVer}`,
	`\n- Launched content script "${logScriptName}" into an isolated world in ${bootImportTime.toFixed(2)}ms`,
	`\n- Importing main script "${mainScriptFileName}" into the main world`,
	`\n- Main world URL:`, location.href
)

const debugEventListener = (target, listener) => target.addEventListener(
	listener, () => console.debug('Event triggered:', `"${listener}"`)
)

debugEventListener(document, 'DOMContentLoaded')
debugEventListener(window, 'load')

const s = document.createElement('script')
s.src = getUrl(mainScriptFileName);
s.setAttribute('data-chrome-runtime-url', getUrl(''))
s.setAttribute('data-extension-name', extName)
s.setAttribute('data-extension-full-name', extFullName)
s.setAttribute('data-extension-version', extVer)
Object.entries(SETTINGS).forEach(([key, value]) => s.setAttribute(`data-${key.replaceAll('_', '-')}`, value))
s.setAttribute('fetchpriority', 'high')
s.onload = () => {
	s.remove()
	console.info(
		`Main extension script successfully imported and launched into the main world!`,
		'\n- Main extension script:', s.src,
		'\n- Main world:', location.href
	)
}
s.onerror = () => {
	s.remove()
	console.error(`FATAL ERROR: unable to correctly start extension's main script`,
		`\n- Check if "${mainScriptFileName}" path is correct and if "manifest.json" includes it on "web_accessible_resources"`)
}
(document.head || document.documentElement).prepend(s)
