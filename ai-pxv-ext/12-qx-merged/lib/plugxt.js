'use strict'

/**
 * PlugXT - Plug Extensions
 * Create browser extensions easily (runs in the page's main world).
 *
 * - Single entry point: one (optionally global) protected namespace tree, e.g. PlugXT.core.event.on(...)
 * - Plug anything:   PlugXT.define('pkg.mod', value)   |   PlugXT.use({ name, deps, defaults, create })
 * - Settings come from settings.js through boot.js as a single JSON (data-settings), already typed.
 */
;(() => {
	const script = document.currentScript
	if (!script) throw new Error('PlugXT: must be loaded through a <script> tag')

	const config = readConfig(script)
	const globalVar = validGlobalName(config.extensionGlobalVariable)
	const exposeGlobal = config.exposeGlobal === true
	const exposeInternals = config.exposeInternals === true
	const strictNamespaces = config.strictNamespaces !== false

	/* ================================================================== *
	 * Namespaces: protected tree (get on undefined throws, no overwrite) *
	 * ================================================================== */

	const PASSTHROUGH = new Set(['then', 'toJSON', 'constructor', '$$typeof'])
	const metas = new WeakMap() /* namespace proxy -> { raw, path } */
	const rawMarked = new WeakSet() /* objects that must NOT become namespaces (mutable state) */

	function isPlainObject (value) {
		if (value === null || typeof value !== 'object') return false
		const proto = Object.getPrototypeOf(value)
		/* Object.prototype of any realm has a null prototype; class instances do not */
		return proto === null || Object.getPrototypeOf(proto) === null
	}

	function createNamespace (path) {
		const raw = Object.create(null)
		Object.defineProperty(raw, Symbol.toStringTag, { value: `Namespace(${path})` })
		const deny = what => () => { throw new TypeError(`${path}: ${what} is not allowed`) }
		const proxy = new Proxy(raw, {
			get (target, prop) {
				if (typeof prop === 'symbol' || prop in target) return Reflect.get(target, prop, target)
				if (PASSTHROUGH.has(prop)) return undefined
				const message = `${path}.${prop} is not defined`
				if (strictNamespaces) throw new ReferenceError(message)
				console.warn('core.namespace', message)
				return undefined
			},
			set (target, prop, value) {
				if (typeof prop === 'symbol') throw new TypeError(`${path}: symbol keys are not allowed`)
				if (prop in target) throw new TypeError(`${path}.${prop} is already defined`)
				defineIn(proxy, prop, value)
				return true
			},
			deleteProperty: deny('delete'),
			defineProperty: deny('defineProperty'),
			setPrototypeOf: deny('setPrototypeOf'),
			preventExtensions: deny('preventExtensions'),
		})
		metas.set(proxy, { raw, path })
		return proxy
	}

	/* Plain objects become (recursively) protected namespaces; everything else is stored as is. */
	function wrap (value, path, seen) {
		if (!isPlainObject(value) || metas.has(value) || rawMarked.has(value)) return value
		if (seen.has(value)) return seen.get(value)
		const namespace = createNamespace(path)
		seen.set(value, namespace)
		const { raw } = metas.get(namespace)
		for (const [key, desc] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
			if (key === '__proto__') throw new TypeError(`${path}: invalid key "__proto__"`)
			if ('value' in desc) {
				Object.defineProperty(raw, key, {
					value: wrap(desc.value, `${path}.${key}`, seen),
					enumerable: desc.enumerable, writable: false, configurable: true,
				})
			} else {
				Object.defineProperty(raw, key, { get: desc.get, enumerable: desc.enumerable, configurable: true })
			}
		}
		return namespace
	}

	function defineIn (namespace, key, value, { override = false } = {}) {
		const meta = metas.get(namespace)
		if (!meta) throw new TypeError('not a PlugXT namespace')
		if (typeof key !== 'string' || key === '' || key === '__proto__') throw new TypeError(`${meta.path}: invalid key "${String(key)}"`)
		if (key in meta.raw && !override) throw new TypeError(`${meta.path}.${key} is already defined`)
		const stored = wrap(value, `${meta.path}.${key}`, new Map())
		Object.defineProperty(meta.raw, key, { value: stored, enumerable: true, writable: false, configurable: true })
		return stored
	}

	const SEGMENT = /^[A-Za-z_$][\w$]*$/

	/* define(root, 'a.b.c', value) creates missing intermediate namespaces. */
	function define (root, path, value, options) {
		const segments = String(path).split('.')
		if (!segments.every(segment => SEGMENT.test(segment) && segment !== '__proto__')) throw new TypeError(`invalid path "${path}"`)
		const key = segments.pop()
		let node = root
		for (const segment of segments) {
			const meta = metas.get(node)
			if (!(segment in meta.raw)) defineIn(node, segment, {})
			node = meta.raw[segment]
			if (!metas.has(node)) throw new TypeError(`${meta.path}.${segment} is not a namespace`)
		}
		return defineIn(node, key, value, options)
	}

	function rawMark (value) {
		if (value !== null && typeof value === 'object') rawMarked.add(value)
		return value
	}

	const PlugXT = createNamespace(globalVar)

	/* ================================================================== *
	 * Global variable gate (private by default)                          *
	 * ================================================================== */

	/* Scripts being loaded by core.loader. window[globalVar] only answers to them. */
	const trusted = new Set()

	const gate = (() => {
		let holders = 0
		const getter = () => (trusted.has(document.currentScript) ? PlugXT : undefined)
		const descriptor = {
			configurable: true,
			enumerable: false,
			get: getter,
			/* the page wins if it assigns the same name */
			set (value) {
				Object.defineProperty(window, globalVar, { value, writable: true, configurable: true, enumerable: true })
			},
		}
		return {
			acquire () {
				if (exposeGlobal) return
				if (holders === 0) {
					if (globalVar in window) throw new Error(`window.${globalVar} is already defined by the page`)
					Object.defineProperty(window, globalVar, descriptor)
				}
				holders++
			},
			release () {
				if (exposeGlobal || holders === 0) return
				if (--holders > 0) return
				if (Object.getOwnPropertyDescriptor(window, globalVar)?.get === getter) delete window[globalVar]
			},
		}
	})()

	/* ================================================================== *
	 * Module system                                                      *
	 * ================================================================== */

	const registry = new Map() /* name -> entry */
	const order = []
	let state = 'idle' /* idle | starting | ready | failed | destroyed */
	const ready = deferred()
	ready.promise.catch(() => {})

	function use (spec) {
		if (!spec || typeof spec !== 'object') throw new TypeError('use(spec): spec must be an object')
		if (typeof spec.name !== 'string' || !spec.name.split('.').every(s => SEGMENT.test(s))) throw new TypeError(`use(spec): invalid name "${spec.name}"`)
		if (typeof spec.create !== 'function') throw new TypeError(`use("${spec.name}"): create must be a function`)
		if (registry.has(spec.name)) throw new Error(`module "${spec.name}" is already registered`)
		const entry = {
			spec: { name: spec.name, deps: [...(spec.deps || [])], defaults: spec.defaults || {}, create: spec.create },
			state: 'registered',
			instance: null,
			done: deferred(),
		}
		entry.done.promise.catch(() => {})
		registry.set(spec.name, entry)
		order.push(entry)
		if (state === 'ready') initModule(entry).catch(() => {})
		return entry.done.promise
	}

	function moduleSettings (spec) {
		const out = {}
		for (const [key, fallback] of Object.entries(spec.defaults)) {
			const value = config[key]
			const sameType = value !== undefined && typeof value === typeof fallback && Array.isArray(value) === Array.isArray(fallback)
			if (value !== undefined && !sameType) console.warn('core.settings', `"${key}" should be ${Array.isArray(fallback) ? 'array' : typeof fallback}, using default`)
			out[key] = sameType ? value : fallback
		}
		return Object.freeze(out)
	}

	async function initModule (entry) {
		const { spec } = entry
		try {
			for (const dep of spec.deps) {
				if (registry.get(dep)?.state !== 'initialized') throw new Error(`module "${spec.name}" requires "${dep}", which is not initialized`)
			}
			const ctx = Object.freeze({ PlugXT, settings: moduleSettings(spec), host: Object.freeze({ trusted, gate }) })
			const result = (await spec.create(ctx)) || {}
			if (result.api !== undefined) {
				const api = define(PlugXT, spec.name, result.api)
				if (exposeInternals && result.internals && metas.has(api)) defineIn(api, '__internals', rawMark(result.internals))
			}
			if (result.init) await result.init()
			entry.instance = result
			entry.state = 'initialized'
			entry.done.resolve()
		} catch (error) {
			entry.state = 'failed'
			console.error('core', `module "${spec.name}" failed to initialize`, error)
			entry.done.reject(error)
			throw error
		}
	}

	/* Dependencies first, registration order otherwise. */
	function sortPending () {
		const sorted = []
		const visiting = new Set()
		const visit = entry => {
			if (entry.state !== 'registered' || sorted.includes(entry)) return
			if (visiting.has(entry)) throw new Error(`circular dependency involving "${entry.spec.name}"`)
			visiting.add(entry)
			for (const dep of entry.spec.deps) {
				const depEntry = registry.get(dep)
				if (!depEntry) throw new Error(`module "${entry.spec.name}" requires "${dep}", which is not registered`)
				visit(depEntry)
			}
			visiting.delete(entry)
			sorted.push(entry)
		}
		order.forEach(visit)
		return sorted
	}

	async function start () {
		state = 'starting'
		try {
			if (exposeGlobal) {
				if (globalVar in window) throw new Error(`window.${globalVar} is already defined by the page`)
				Object.defineProperty(window, globalVar, { value: PlugXT, enumerable: false, writable: false, configurable: false })
			}
			for (const entry of sortPending()) await initModule(entry)
			state = 'ready'
			console.info('core', 'initialized')
			PlugXT.core.event.send('core-ready')
			ready.resolve()
		} catch (error) {
			state = 'failed'
			console.error('core', 'error initializing', error)
			ready.reject(error)
			return
		}
		/* Core fully initialized: import every extension script, in order. */
		await PlugXT.core.loader.loadAll([].concat(config.extensionScripts ?? []))
	}

	async function destroy () {
		for (const entry of [...order].reverse()) {
			if (entry.state !== 'initialized') continue
			try { await entry.instance.destroy?.() } catch (error) { console.error('core', `module "${entry.spec.name}" failed to destroy`, error) }
			entry.state = 'destroyed'
		}
		state = 'destroyed'
	}

	/* ================================================================== *
	 * Public surface                                                     *
	 * ================================================================== */

	defineIn(PlugXT, 'define', (path, value, options) => define(PlugXT, path, value, options))
	defineIn(PlugXT, 'use', use)

	define(PlugXT, 'core', {
		ready: ready.promise,
		get state () { return state },
		destroy,
	})

	define(PlugXT, 'f', {
		/* Marks an object as plain state: it is stored as is, not converted into a protected namespace. */
		raw: rawMark,
		/* Path (relative to the extension root) of the script being executed right now. */
		get currentScript () {
			const src = document.currentScript?.src
			if (!src) return undefined
			try { return new URL(src).pathname.replace(/^\/+/, '') } catch { return undefined }
		},
	})

	/* ================================================================== *
	 * Built-in modules                                                   *
	 * ================================================================== */

	/* PlugXT.core.settings */
	use({
		name: 'core.settings',
		create () {
			return {
				api: {
					get: (key, fallback) => config[key] ?? fallback,
					has: key => key in config,
					all: () => config,
				},
			}
		},
	})

	/* PlugXT.core.console */
	use({
		name: 'core.console',
		defaults: {
			overrideConsole: true,
			extensionName: '',
			logPrefix: 'CRX',
			logColor: '#999999',
			debugColor: '#999999',
			infoColor: '#999999',
			warnColor: '#999999',
			errorColor: '#999999',
		},
		create ({ settings }) {
			const METHODS = ['log', 'debug', 'info', 'warn', 'error']
			const originals = new Map() /* method -> original descriptor */
			const bold = 'font-weight: bold'
			const esc = text => String(text).replaceAll('%', '%%')
			const now = () => (performance.now() / 1000).toFixed(2)
			const style = color => `color: ${color}; ${bold}`
			const scope = settings.extensionName ? `${esc(settings.extensionName)}.%s` : '%s'

			/* log: "<time> args..."   others: "<prefix> <time> [<extension>.<first arg>] args..." */
			const format = method => {
				const color = settings[`${method}Color`]
				if (method === 'log') return () => [`%c${now()}%c`, style(color), '']
				return () => [`%c${esc(settings.logPrefix)} %c${now()} %c[${scope}]`, style(color), bold, style(color)]
			}

			const active = () => originals.size > 0

			function apply () {
				if (active()) return
				for (const method of METHODS) {
					const descriptor = Object.getOwnPropertyDescriptor(console, method)
					const original = descriptor && 'value' in descriptor ? descriptor.value : console[method]
					originals.set(method, descriptor)
					const build = format(method)
					/* getter + bind keeps the caller's file:line in the DevTools console */
					Object.defineProperty(console, method, {
						configurable: true,
						enumerable: true,
						get: () => original.bind(console, ...build()),
						set (value) { /* the page wins if it assigns its own console method */
							Object.defineProperty(console, method, { value, writable: true, configurable: true, enumerable: true })
						},
					})
				}
				console.debug('core.console', 'window.console overridden')
			}

			function restore () {
				for (const [method, descriptor] of originals) {
					if (descriptor) Object.defineProperty(console, method, descriptor)
					else delete console[method]
				}
				originals.clear()
			}

			return {
				api: { get active () { return active() }, restore },
				init () { if (settings.overrideConsole) apply() },
				destroy: restore,
			}
		},
	})

	/* PlugXT.core.event */
	use({
		name: 'core.event',
		defaults: { eventHistory: true, eventHistoryMax: 0 },
		create ({ settings }) {
			const handlers = new Map() /* pattern -> Set<fn> */
			const history = [] /* [{ type, payload }] in chronological order */
			const stoppedTypes = new Set()
			let recording = settings.eventHistory

			const matches = (pattern, type) =>
				pattern === '*' || pattern === type || (pattern.endsWith('*') && type.startsWith(pattern.slice(0, -1)))

			const safeCall = (fn, payload, type) => {
				try { fn(payload, type) } catch (error) { console.error('core.event', `handler for "${type}" threw`, error) }
			}

			function on (pattern, fn, { replay = true } = {}) {
				if (typeof pattern !== 'string' || typeof fn !== 'function') throw new TypeError('on(pattern: string, fn: function)')
				if (!handlers.has(pattern)) handlers.set(pattern, new Set())
				handlers.get(pattern).add(fn)
				if (replay) {
					for (const event of history.slice()) {
						if (matches(pattern, event.type)) safeCall(fn, event.payload, event.type)
					}
				}
				return () => off(pattern, fn)
			}

			function once (pattern, fn, options) {
				let fired = false
				let stop
				stop = on(pattern, (payload, type) => {
					if (fired) return
					fired = true
					stop?.()
					fn(payload, type)
				}, options)
				if (fired) stop()
				return stop
			}

			function off (pattern, fn) {
				handlers.get(pattern)?.delete(fn)
			}

			function send (type, payload) {
				if (typeof type !== 'string') throw new TypeError('send(type: string, payload)')
				if (recording && !stoppedTypes.has(type)) {
					history.push({ type, payload })
					if (settings.eventHistoryMax > 0 && history.length > settings.eventHistoryMax) history.shift()
				}
				for (const [pattern, set] of handlers) {
					if (!matches(pattern, type)) continue
					for (const fn of [...set]) safeCall(fn, payload, type)
				}
			}

			/* Stops storing new events (all types, or just `type`). Keeps what is already stored. */
			function stopRecording (type) {
				if (type === undefined) recording = false
				else stoppedTypes.add(type)
			}

			/* Drops stored events (all, or just `type`). Keeps recording. */
			function clearHistory (type) {
				if (type === undefined) { history.length = 0; return }
				for (let i = history.length - 1; i >= 0; i--) if (history[i].type === type) history.splice(i, 1)
			}

			/* clearHistory + stopRecording: frees the memory and stops accumulating. */
			function releaseHistory (type) {
				clearHistory(type)
				stopRecording(type)
			}

			return {
				api: { on, once, off, send, stopRecording, clearHistory, releaseHistory },
				internals: { handlers, history },
				destroy () { handlers.clear(); history.length = 0 },
			}
		},
	})

	/* PlugXT.core.fetch  ->  events: fetch-before | fetch-success | fetch-error */
	use({
		name: 'core.fetch',
		deps: ['core.event'],
		defaults: { interceptFetch: true, fetchStoreResponse: true },
		create ({ PlugXT, settings }) {
			let original = null
			let wrapper = null
			let seq = 0

			function describe ([input, init]) {
				const isRequest = typeof Request !== 'undefined' && input instanceof Request
				const url = String(isRequest ? input.url : input)
				const method = String(init?.method ?? (isRequest ? input.method : 'GET')).toUpperCase()
				return { url, method }
			}

			async function fetchWithEvents (...args) {
				const events = PlugXT.core.event
				const info = { id: ++seq, ...describe(args), args }
				events.send('fetch-before', info)
				try {
					const response = await original.apply(window, args)
					events.send('fetch-success', {
						...info,
						status: response.status,
						ok: response.ok,
						/* handlers must call response.clone() before reading the body */
						response: settings.fetchStoreResponse ? response.clone() : undefined,
					})
					return response
				} catch (error) {
					events.send('fetch-error', { ...info, error })
					throw error
				}
			}

			return {
				api: { get active () { return wrapper !== null && window.fetch === wrapper } },
				init () {
					if (!settings.interceptFetch) return
					original = window.fetch
					wrapper = fetchWithEvents
					Object.defineProperty(wrapper, 'name', { value: 'fetch' })
					window.fetch = wrapper
					console.debug('core.fetch', 'window.fetch overridden')
				},
				destroy () {
					if (wrapper && window.fetch === wrapper) window.fetch = original
					wrapper = null
				},
			}
		},
	})

	/* PlugXT.core.loader: imports the extension's own scripts into the main world */
	use({
		name: 'core.loader',
		deps: ['core.event'],
		defaults: { dev: false, chromeRuntimeUrl: '' },
		create ({ PlugXT, settings, host }) {
			const base = settings.chromeRuntimeUrl ? new URL(settings.chromeRuntimeUrl) : null

			function resolveUrl (path) {
				if (!base) throw new Error('chromeRuntimeUrl is not set')
				const url = new URL(String(path), base)
				if (url.protocol !== base.protocol || url.host !== base.host) throw new Error(`"${path}" is outside the extension`)
				if (settings.dev) url.searchParams.set('v', Date.now())
				return url
			}

			/* Classic scripts only (document.currentScript is null in modules). */
			function load (path) {
				return new Promise((resolve, reject) => {
					const url = resolveUrl(path)
					host.gate.acquire()
					const el = document.createElement('script')
					el.async = false
					el.src = url.href
					host.trusted.add(el)
					const finish = (settle, arg) => {
						el.remove()
						host.trusted.delete(el)
						host.gate.release()
						settle(arg)
					}
					el.onload = () => finish(resolve)
					el.onerror = () => finish(reject, new Error(`unable to load "${path}"`))
					try {
						const parent = document.head || document.documentElement
						parent.append(el)
					} catch (error) {
						finish(reject, error)
					}
				})
			}

			/* Sequential (keeps order); one failing script does not stop the others. */
			async function loadAll (paths) {
				const events = PlugXT.core.event
				const results = []
				for (const path of paths) {
					try {
						await load(path)
						console.info('core.loader', `loaded "${path}"`)
						events.send('extension-loaded', { path })
						results.push({ path, ok: true })
					} catch (error) {
						console.error('core.loader', `error loading "${path}"`, error)
						events.send('extension-error', { path, error })
						results.push({ path, ok: false, error })
					}
				}
				events.send('extensions-ready', { results })
				return results
			}

			return { api: { load, loadAll } }
		},
	})

	/* ================================================================== *
	 * Helpers                                                            *
	 * ================================================================== */

	function readConfig (element) {
		try {
			return deepFreeze(JSON.parse(element.dataset.settings || '{}'))
		} catch (error) {
			console.error('PlugXT: invalid data-settings JSON', error)
			return Object.freeze({})
		}
	}

	function deepFreeze (value) {
		if (value && typeof value === 'object' && !Object.isFrozen(value)) {
			Object.values(value).forEach(deepFreeze)
			Object.freeze(value)
		}
		return value
	}

	function validGlobalName (name) {
		if (typeof name === 'string' && /^[A-Za-z_$][\w$]*$/.test(name)) return name
		if (name !== undefined) console.warn('PlugXT: invalid extensionGlobalVariable, using "PlugXT"')
		return 'PlugXT'
	}

	function deferred () {
		const d = {}
		d.promise = new Promise((resolve, reject) => { d.resolve = resolve; d.reject = reject })
		return d
	}

	start()
})()
