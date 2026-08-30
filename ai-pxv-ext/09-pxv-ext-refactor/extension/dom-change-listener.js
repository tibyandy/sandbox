Extensor.Module = function DomChangeListener ({ send }) {
	let lastHref
	init()
	return { checkMutations }

	function init () {
		new MutationObserver(checkMutations)
		checkMutations()
	}

	function checkMutations (mutations) {
		const currHref = location.href
		const locationChanged = lastHref !== currHref
		lastHref = currHref
		if (locationChanged) send('location-change', currHref)
		return locationChanged
	}
}
