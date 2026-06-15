window.addEventListener('keydown', (event) => {
  if (event.shiftKey && event.key === 'S') {
    event.preventDefault();
    
    const imgElements = Array.from(document.querySelectorAll('img'));
    const urls = [...new Set(imgElements.map(img => img.src).filter(src => src.startsWith('http')))];

    if (urls.length === 0) {
      console.log("Nenhuma imagem com URL válida encontrada.");
      return;
    }

    console.log(`Extraindo binários de ${urls.length} imagens... Aguarde.`);

    // Envia para o background processar
    chrome.runtime.sendMessage({ action: "fetch_images", urls: urls });
  }
});