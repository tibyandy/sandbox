const CRX = window.CRX ||= {
  get now() { return (performance.now() / 1000).toFixed(4) },
  originalLog: console.log,
  FetchResults: [],
  WorkResults: {},
  originalFetch: window.fetch
};

Object.defineProperties(console, {
log: { get: () =>
  CRX.originalLog.bind(console, `%c${CRX.now}%c %s`, 'color: #00cc99; font-weight: bold', 'color: auto'),
  configurable: true, enumerable: true },
error: { get: () =>
  CRX.originalLog.bind(console, `%c${CRX.now}%c %s`, 'color: #cc0099; font-weight: bold', 'color: #ffaaaa;'),
  configurable: true, enumerable: true }
});
CRX.log = console.log.bind(console);
CRX.error = console.error.bind(console);
Object.freeze(console);

console.log('[CRX] Main World Setup');

window.fetch = CRX.fetch = async function(...args) {
  const url = args[0];
  if (url.includes('pagead2.googlesyndication')
    || url.includes('micro.rubiconproject.com')
    || url.includes('cdn.onesignal.com')
    || url.includes('pixon.ads-pixiv')
    || url.includes('doubleclick.net')) {
      console.log('[CRX] Blocked Fetch', url)
      return {}
  }
  const response = await CRX.originalFetch.apply(this, args);

  if (!(typeof url === 'string' && url.startsWith('/'))) return response;

  try {
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers.get('content-type');
    const responseBody = await (
      (contentType && contentType.includes('application/json'))
        ? clonedResponse.json()
        : clonedResponse.text()
    );

    const result = { url: response.url || url, responseBody, httpStatus: response.status };

    if (!url.startsWith('/ajax/')) return // Ignore URL

    const works = responseBody?.body?.works;
    if (works) {
      CRX.log('[CRX.fetch] - CRX.WorkResults <-- ', works.length, 'ilustrações');
      Object.assign(CRX.WorkResults, Object.fromEntries(works.map(({ id, ...obj }) => [id, obj])));
      window.postMessage({ type: '__CRX_WORKS__', works }, '*');
    } else {
      CRX.log('[CRX.fetch] - CRX.FetchResults <--', url, response.status, responseBody?.body || responseBody);
      CRX.FetchResults.push(result);
    }
  } catch (err) {
    console.error('[CRX.fetch] - Erro:', err);
  }

  return response;
};

// Proxy sync de CRX.db — espelha dados do isolated world após SheetDatabase.load()
let _dbData = {};
window.addEventListener('message', e => {
  if (e.source === window && e.data?.type === '__CRX_DATA__') _dbData = e.data.data;
});
CRX.db = {
  get: (aba, chave) => chave === undefined ? _dbData[aba] : _dbData[aba]?.[chave],
  load () { return window.postMessage({ type: '__CRX_DB_LOAD__' }, '*') }
};
CRX.currentPageTagsNotYetTranslated = () => window.postMessage({ type: '__CRX_RUN_TAGS__' }, '*');

CRX.log('[CRX] interceptor ready');
