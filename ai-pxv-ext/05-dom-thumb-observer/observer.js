(function() {
  const trackedElements = new Set(); // Evita logar o mesmo elemento mais de uma vez
  const parentSelector = '[data-ga4-label]';
  let count = 0

  // Função para processar e logar o elemento pai correto
  function processElement(element) {
    const targetParent = element.closest(parentSelector);
    if (targetParent && !trackedElements.has(targetParent)) {
      const targetLi = element.closest('li');
      trackedElements.add(targetParent);
      const { attributes } = targetParent
      const illustId = attributes['data-gtm-value']?.value
      const userId = attributes['data-gtm-user-id']?.value
      const illustData = window?.WorkResults?.[illustId]
      if (illustData) {
        illustData.domParent = targetParent
        illustData.domLi = targetLi
        console.log("Ilustração #" + ++count, illustId, illustData);
        if (!targetLi.querySelector('.crx_work_tags')) {
            targetLi.classList.add('crx_work_thumbnail')
            console.log('add')
            const el = document.createElement('ul')
            el.className = 'crx_work_tags'
            el.innerHTML = WorkResults[illustId].tags.filter(t => t != ('R-18') && (t != 'R-18G')).map(t => `<li>${t}`).join('')
            targetLi.append(el)
        } else {
            console.log('already added')
        }
      } else {
        console.log("Dados da ilustração não encontrados:", illustId, window.ex = targetParent);
      }
    }
  }

  // 1. Captura os elementos que já estão na página no carregamento inicial
  document.querySelectorAll(`${parentSelector} img`).forEach(processElement);

  // 2. Monitora a inserção de novos elementos em tempo real
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          
          // Se o nó adicionado for uma imagem
          if (node.nodeName === 'IMG') {
            processElement(node);
          }
          
          // Se o nó adicionado contiver imagens dentro dele (como um bloco de lazy-load)
          const imgs = node.querySelectorAll('img');
          imgs.forEach(processElement);
        }
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log(`Monitor DOM ativado! Rastreando "${parentSelector}" via tags IMG.`);
})();