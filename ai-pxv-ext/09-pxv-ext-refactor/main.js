console.debug('main', 'Script loaded')

Extensor.on('start', Ext => {
	console.debug('main', 'App activated')
	Ext.load.css('main.css')
	console.debug('main', 'App started')
})

Extensor.on('fetch-before', data => console.debug('fetch', 'before', data));
Extensor.on('fetch-error', data => console.debug('fetch', 'error', data.url, data.error));
Extensor.on('fetch-success', data => console.debug('fetch', 'success', data));
