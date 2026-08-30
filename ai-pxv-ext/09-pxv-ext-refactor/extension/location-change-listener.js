Extensor.Module = function LocationChangeListener ({ on }) {
	on('location-change', locationChanged)
	return

	function locationChanged (path) {
		console.info('LocationChangeListener', 'new path', path)
	}
}