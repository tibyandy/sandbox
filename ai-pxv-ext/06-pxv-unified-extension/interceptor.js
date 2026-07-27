// const CRX = window.CRX = window.CRX || { get now () { return (performance.now() / 1000).toFixed(4) }, originalConsoleLog: console.log }
// // Sobrescreve a propriedade 'log' do console usando um getter dinâmico
// Object.defineProperty(console, 'log', {
//   get() { return CRX.originalConsoleLog.bind(console, `%c${CRX.now}%c %s`, 'color: #00cc99; font-weight: bold', 'color: auto'); },
//   configurable: true,
//   enumerable: true
// });
// Object.defineProperty(console, 'error', {
//   get() { return CRX.originalConsoleLog.bind(console, `%c${CRX.now}%c %s`, 'color: #cc0099; font-weight: bold', 'color: #ffaaaa;'); },
//   configurable: true,
//   enumerable: true
// });
// CRX.log = console.log.bind(null)
// CRX.error = console.error.bind(null)

;(function() {
  const CRX = window.CRX ||= {
    get now() { return (performance.now() / 1000).toFixed(4) },
    originalLog: console.log
  };

  // Sobrescreve múltiplos métodos do console em uma única chamada
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

  console.log('[CRX] interceptor.js');

  CRX.FetchResults = CRX.FetchResults || [];
  CRX.WorkResults = CRX.WorkResults || {};

  // Guarda a referência do fetch original do navegador
  CRX.originalFetch = window.fetch;

  // Substitui o fetch global
  window.fetch = CRX.fetch = async function(...args) {
    const url = args[0];

    // Executa a requisição original normalmente
    const response = await CRX.originalFetch.apply(this, args);

    // Verifica se a URL aponta para o domínio do Pixiv
    if (!(typeof url === 'string' && url.startsWith('/'))) {
      // CRX.log('[CRX.fetch] - skip', url)
      return response;
    }

    try {
      // Clona a resposta para não consumir o stream original
      const clonedResponse = response.clone();
      let responseBody = null;

      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await clonedResponse.json();
      } else {
        responseBody = await clonedResponse.text();
      }

      const result = {
        url: response.url || url,
        responseBody: responseBody,
        httpStatus: response.status
      }
      CRX.log('[CRX.fetch] - CRX.FetchResults <--', url, response.status, responseBody)

      CRX.FetchResults.push(result);
      const works = responseBody?.body?.works
      if (works) {
        CRX.log('[CRX.fetch] - CRX.WorkResults <-- ', works.length, 'ilustrações')
        Object.assign(CRX.WorkResults, Object.fromEntries(works.map(({ id, ...obj }) => [id, obj])))
      }
    } catch (err) {
      console.error('[CRX.fetch] - Erro:', err);
    }

    return response;

  };

  CRX.log("[CRX.interceptor] Ativo para window.fetch");
})();
