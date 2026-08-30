Extensor.Main = async ({ on, loadCss, Module, ...Ext }) => {
	on('fetch-before', data => console.debug('before', data));
	on('fetch-error', data => console.debug('error', data.url, data.error));
	on('fetch-success', data => console.debug('success', data));

	loadCss('main.css')
	await Module.load(
		'extension/router.js',
		'extension/dom-change-listener.js',
	 	'extension/location-change-listener.js'
	)
}