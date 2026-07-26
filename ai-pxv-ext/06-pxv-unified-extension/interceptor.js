console.log('[PXV] interceptor.js');
(function() {
  const PXV = window.PXV = window.PXV || { log: console.log.bind(null), error: console.error.bind(null) }
  PXV.FetchResults = PXV.FetchResults || [];
  PXV.WorkResults = PXV.WorkResults || {};

  // Guarda a referência do fetch original do navegador
  PXV.originalFetch = window.fetch;

  // Substitui o fetch global
  window.fetch = PXV.fetch = async function(...args) {
    const url = args[0];

    // Executa a requisição original normalmente
    const response = await PXV.originalFetch.apply(this, args);

    // Verifica se a URL aponta para o domínio do Pixiv
    if (!(typeof url === 'string' && url.startsWith('/'))) {
      // PXV.log('[PXV.fetch] - skip', url)
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
      // PXV.log('[PXV.fetch] - PXV.FetchResults <--', url, response.status, responseBody)

      PXV.FetchResults.push(result);
      const works = responseBody?.body?.works
      if (works) {
        PXV.log('[PXV.fetch] - PXV.WorkResults <-- ', works.length, 'ilustrações')
        Object.assign(PXV.WorkResults, Object.fromEntries(works.map(({ id, ...obj }) => [id, obj])))
      }
    } catch (err) {
      console.error('[PXV.fetch] - Erro:', err);
    }

    return response;

  };

  PXV.log("[PXV.interceptor] Ativo para window.fetch");
})();
