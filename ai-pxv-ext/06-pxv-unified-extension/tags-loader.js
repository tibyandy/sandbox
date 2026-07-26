(function() {
  // Isolated world: tem chrome.runtime, mas não injeta código inline
  // (páginas com CSP restritivo bloqueiam <script> com textContent).
  // Em vez disso, aponta um <script src="..."> pra um recurso estático
  // da extensão, que roda no MAIN world e faz o fetch por conta própria.
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('tags-inject.js');
  script.dataset.tsvUrl = chrome.runtime.getURL('tags.tsv');
  script.onload = () => script.remove();
  script.onerror = (e) => console.error('Falha ao carregar tags-inject.js', e);
  (document.head || document.documentElement).appendChild(script);
})();
