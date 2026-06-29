(function() {
  window.FetchResults = window.FetchResults || [];
  window.WorkResults = window.WorkResults || {};

  // Guarda a referência do fetch original do navegador
  const originalFetch = window.fetch;

  // Substitui o fetch global
  window.fetch = window.newFetch = async function(...args) {
    const url = args[0];

    // Executa a requisição original normalmente
    const response = await originalFetch.apply(this, args);

    // Verifica se a URL aponta para o domínio do Pixiv
    if (!(typeof url === 'string' && url.startsWith('/'))) {
      console.log(url.startsWith('/'), url, 'filtered')
    } else {
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
        console.log(url.startsWith('/'), url, response.status, responseBody)

        window.FetchResults.push(result);
        const works = responseBody?.body?.works
        if (works) {
          console.log('Adicionadas', works.length, 'ilustrações à memória')
          Object.assign(window.WorkResults, Object.fromEntries(works.map(({ id, ...obj }) => [id, obj])))
        }
      } catch (err) {
        console.error('Erro ao interceptar corpo do fetch:', err);
      }
    }

    return response;
  };

  console.log("Interceptor de Fetch ativado no escopo principal! Inspecione 'FetchResults' no console.");
})();