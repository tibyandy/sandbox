Extensor.Module = function LocationChangeListener ({ on, Module }) {
	on('route-changed', assignBodyRouteClasses)
	return {}

	function assignBodyRouteClasses ({ route, allBodyClasses }) {
		console.info('mod:LocationChangeListener', 'route =', route)
		const bodyClasses = document.body.classList
		allBodyClasses.forEach(c => bodyClasses.remove(c))
		void (route?.classes || []).forEach(c => bodyClasses.add(c))
	}
}