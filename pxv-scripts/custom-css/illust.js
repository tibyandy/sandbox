(() => {
	function addClassesToElement (selector, ...classes) {
		const element = document.querySelector(selector)
		if (element) {
			classes.forEach(c => {
				element.classList.add(c)
				console.log(`${c} =>`, element)
			})
		}
	}

	// Sidebar
	addClassesToElement('aside:has(h2):has(nav)', 'crx_sidebar')

	// Other Works from Sidebar
	addClassesToElement('aside section:has(header):has(nav)', 'crx_otherworks')

	// Tags Block from Main Section
	addClassesToElement('main section figcaption div footer', 'crx_tags')

	// Likes, Favs, Views from Main Section
	addClassesToElement('main section ul:has([role=button])', 'crx_illust_actions')

	// Creation Date
	addClassesToElement('main section div:has(> time)', 'crx_creation_date')

	document.querySelector('.crx_sidebar').moveBefore(
		document.querySelector('.crx_tags'),
		document.querySelector('.crx_otherworks ~*')
	)

	document.querySelector('.crx_sidebar').moveBefore(
		document.querySelector('.crx_illust_actions'),
		document.querySelector('.crx_otherworks ~*')
	)

	document.querySelector('.crx_sidebar').moveBefore(
		document.querySelector('.crx_creation_date'),
		document.querySelector('.crx_otherworks ~*')
	)

})()