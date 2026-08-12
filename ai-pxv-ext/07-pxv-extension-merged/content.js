const CRX = window.CRX = window.CRX || { log: console.log.bind(null), error: console.error.bind(null) }
console.log('content.js')

function injectStyles() {
	if (document.getElementById('crx-spa-styles')) return;

	const link = document.createElement('link');
	link.id = 'crx-spa-styles';
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = chrome.runtime.getURL('style.css');
	(document.head || document.documentElement).appendChild(link);
}

injectStyles();

let lastUrl = location.href;

function addClassesToElement(selector, ...classes) {
	const element = document.querySelector(selector);
	if (element) {
		classes.forEach(c => {
			if (!element.classList.contains(c)) {
				element.classList.add(c);
			}
		});
	}
	return element;
}

function executeDOMCleanUp() {
	document.querySelectorAll('.crx_sidebar .crx_like_fav_bar').forEach(element => element.remove());
}

function executeDOMEnhancements() {
	const sidebar = addClassesToElement('aside:has(h2):has(nav)', 'crx_sidebar');
	const otherWorks = addClassesToElement('aside section:has(header):has(nav)', 'crx_otherworks');
	const tags = addClassesToElement('main section figcaption div footer', 'crx_tags');
	const actions = addClassesToElement('main section ul:has([role=button])', 'crx_illust_actions');
	const creationDate = addClassesToElement('main section div:has(> time)', 'crx_creation_date');
	const likeFavBar = addClassesToElement('div:has( > div > div > section > div > button)', 'crx_like_fav_bar');

	if (sidebar) {
		if (otherWorks) {
			const targetAnchor = document.querySelector('.crx_otherworks ~*');
			if (targetAnchor) {
				likeFavBar && likeFavBar.parentNode !== sidebar && tryTo(() => sidebar.appendChild(likeFavBar));
				tags && tags.parentNode !== sidebar && tryTo(() => sidebar.moveBefore(tags, targetAnchor));
				actions && actions.parentNode !== sidebar && tryTo(() => sidebar.moveBefore(actions, targetAnchor));
				creationDate && creationDate.parentNode !== sidebar && tryTo(() => sidebar.moveBefore(creationDate, targetAnchor));
			}
		}
	}
}

function tryTo (fn) {
	try { fn() } catch (e) { }
}

const observer = new MutationObserver(() => {
	if (location.href !== lastUrl) {
		lastUrl = location.href;
		executeDOMCleanUp();
	}
	executeDOMEnhancements();
});

observer.observe(document.body || document.documentElement, {
	childList: true,
	subtree: true
});

executeDOMEnhancements();
