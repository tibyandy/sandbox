Extensor.Module = function SheetDatabase () {
	return {
		_: { request: _request },
		load: (params = {}) => _request('DB_LOAD', params),
		get: (tab, key) => _request('DB_GET', { tab, key }),
		put: (tab, key, valueObj) => _request('DB_PUT', { tab, key, valueObj }),
		putMany: (tab, items) => _request('DB_PUT_MANY', { tab, items }),
		getSheets: () => _request('DB_GET_SHEETS', null),
		getSheetData: (tab) => _request('DB_GET_SHEET_DATA', { tab }),
	}

	function _request (action, payload) {
		return new Promise((resolve, reject) => {
			const requestId = Math.random().toString(36).substring(7)

			function handleResponse({ data: { response, type, ...data } }) {
				if (type === 'PXTRA_DB_RESPONSE' && data.requestId === requestId) {
					window.removeEventListener('message', handleResponse)
					return response.success ? resolve(response.data) : reject(new Error(response.error))
				}
			}

			window.addEventListener('message', handleResponse);
			window.postMessage({ type: 'PXTRA_DB_REQUEST', action, payload, requestId }, '*');
		})
	}
}