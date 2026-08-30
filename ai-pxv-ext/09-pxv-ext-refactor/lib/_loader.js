{
	const chromeRuntimeUrl = document.currentScript.getAttribute('data-chrome-runtime-url')
	const getUrl = url => `${chromeRuntimeUrl}${url}`

	window.load = {
		js: function loadJs (scriptUrl) {
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = getUrl(scriptUrl);
				script.onload = () => { script.remove(); resolve(script) }
				script.onerror = () => { script.remove(); reject(script) }
				(document.head || document.documentElement).prepend(script);
			})
		},
		css: function loadCss (cssUrl) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = getUrl(cssUrl);
			(document.head || document.documentElement).appendChild(link);
		}
	}
}

load.js(document.currentScript.getAttribute('data-app-script'))