Extensor.Module = function DomChangeListener ({ send, on }) {
	let lastHref
	const worksById = {}
	init()
	on('works-loaded', onWorksLoaded)
	return { checkMutations }

	function init () {
		new MutationObserver(checkMutations).observe(
			document.body || document.documentElement,
			{ childList: true, subtree: true }
		)
		checkMutations({})
	}

	function checkMutations (mutations) {
		const currHref = location.href
		const locationChanged = lastHref !== currHref
		lastHref = currHref
		if (locationChanged) send('location-change', currHref)
		checkThumbnailLinks()
	}

	function checkThumbnailLinks () {
		const thumbs = [...document.querySelectorAll('a[data-ga4-label="thumbnail_link"]:not(:has(._aiType))')]
		thumbs.forEach(e => {
			if (!worksById[e.dataset.gtmValue]) return
			console.log(e.dataset.gtmValue, worksById[e.dataset.gtmValue])
			const aiType = worksById[e.dataset.gtmValue]?.aiType || 0
			const div = e.querySelector(':scope > div:nth-child(2) > div:first-child:not(:has(._aiType))')
			if (!div) return
			div.innerHTML = `<div class="_aiType${(aiType < 2) ? ' _human' : ''}">${(aiType < 2) ? '☻' : ''}</div>` + div.innerHTML
		})
	}

	function onWorksLoaded (data) {
		Object.assign(worksById, data)
		checkThumbnailLinks()
	}
}
