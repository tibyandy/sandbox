Extensor.addModule('Console', function
	Extensor_ConsoleModule (
		opts = { debug: true, globalPrefix: 'Ext' }
	) {
		let _previousLog = console.log;
		let _debug = opts.debug || true;
		let _globalPrefix = opts.globalPrefix || 'Ext';

		const _now = () => (performance.now() / 1000).toFixed(4);

		const logFn = () => _previousLog.bind(
			console,
			`%c${_now()}%c %s`,
			'color: #00cc99; font-weight: bold',
			'color: auto',
		);

		const logInfoFn = () => _previousLog.bind(
			console,
			`%c${_now()}%c ${_globalPrefix || ''} %c[%s]`,
			'color: #00cc99; font-weight: bold',
			'color: #aa3399; font-weight: bold',
			'color: #0099cc; font-weight: bold',
		);

		const logErrorFn = () => _previousLog.bind(
			console,
			`%c${_now()}%c ${_globalPrefix || ''} %c[%s]`,
			'color: #cc9900; font-weight: bold',
			'color: #aa3399; font-weight: bold',
			'color: #ffaaaa;'
		);

		Object.defineProperties(console, {
			log: { get: logFn },
			debug: _debug ? { get: logInfoFn } : () => {},
			info: { get: logInfoFn },
			warn: { get: logErrorFn }
		});
		Object.freeze(console);
	}
)