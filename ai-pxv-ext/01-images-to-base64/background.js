chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "fetch_images" && sender.tab) {
    const tabId = sender.tab.id;
    const urls = message.urls;

    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'force-cache' });
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        return { url, base64 };
      } catch (error) {
        return { url, base64: null };
      }
    });

    Promise.all(promises).then((results) => {
      const imagesObject = {};
      results.forEach(res => {
        imagesObject[res.url] = res.base64;
      });

      // Injeta a variável global no contexto correto da página (MAIN world)
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: 'MAIN',
        func: (data) => {
          window._images = data;
          console.log("Variável global '_images' criada com sucesso! Inspecione-a no console.");
        },
        args: [imagesObject]
      });
    });
  }
});

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}