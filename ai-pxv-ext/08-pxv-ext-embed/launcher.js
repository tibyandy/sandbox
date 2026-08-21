// Isolated world, só pra ter acesso a chrome.runtime.getURL.
// Injeta style.css e main.js como recursos reais (URL própria, editável/workspace no DevTools).
(() => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('pxv-crx.css');
  (document.head || document.documentElement).appendChild(link);

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('pxv-crx.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).prepend(script);
})();
