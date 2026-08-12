console.log('script loader');
// Script Loader
(() => {
  let script = document.createElement('script');
  script.src = chrome.runtime.getURL('SheetDatabase.js');
  script.onload = () => script.remove();
  script.onerror = (e) => console.error('Falha ao carregar SheetDatabase.js', e);
  (document.head || document.documentElement).appendChild(script);
})()