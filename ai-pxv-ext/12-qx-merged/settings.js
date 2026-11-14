/* Typed settings (booleans, arrays...). boot.js converts snake_case keys to camelCase and sends them as JSON. */
const SETTINGS = Object.freeze({
	/* Loading */
	"plug_script_path": "lib/plugxt.js",
	"extension_scripts": [          // imported in order, as soon as the core is fully initialized
		"src/main.js"
	],
	"dev": true,                    // cache-busting (?v=timestamp) on every script load

	/* Global variable */
	"extension_global_variable": "Q",
	"expose_global": false,         // false: window.Q is only visible to scripts loaded by PlugXT (capture it on top: const Q = window.Q)
	"expose_internals": false,      // true: adds PlugXT.<module>.__internals
	"strict_namespaces": true,      // true: reading an undefined PlugXT.x.y throws; false: warns and returns undefined

	/* Console */
	"override_console": true,
	"log_prefix": "Q*",
	"log_color": "#cc55aa",
	"debug_color": "#0099cc",
	"info_color": "#00cc99",
	"warn_color": "#cc9900",
	"error_color": "#cc3333",

	/* Core modules */
	"intercept_fetch": true,
	"fetch_store_response": true,   // events keep response.clone(): memory is retained until releaseHistory()
	"event_history": true,          // stores every event until core.event.releaseHistory()/stopRecording() is called
	"event_history_max": 0,         // 0 = unlimited
})
