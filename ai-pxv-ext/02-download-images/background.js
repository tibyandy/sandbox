// CONFIGURAÇÃO: Insira aqui os domínios permitidos (apenas o hostname)
const ALLOWED_DOMAINS = [
  'i.pximg.net'
];

const PIXIV_RULE_ID = 1;

async function setupPixivRules() {
  const rules = [
    {
      id: PIXIV_RULE_ID,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'referer', operation: 'set', value: 'https://www.pixiv.net/' },
          { header: 'origin', operation: 'set', value: 'https://www.pixiv.net' }
        ]
      },
      condition: {
        urlFilter: '|https://*.pximg.net/*',
        resourceTypes: ['xmlhttprequest', 'image', 'other']
      }
    }
  ];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [PIXIV_RULE_ID],
    addRules: rules
  });
}

chrome.runtime.onInstalled.addListener(setupPixivRules);
chrome.runtime.onStartup.addListener(setupPixivRules);
setupPixivRules();

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "fetch_images" && sender.tab) {
    const urls = message.urls;

    urls.forEach(async (url) => {
      try {
        const urlObj = new URL(url);
        
        // Valida se o domínio da imagem está na lista de permitidos
        const isAllowed = ALLOWED_DOMAINS.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain));
        
        if (!isAllowed) {
          return; // Ignora silenciosamente imagens de outros domínios
        }

        const response = await fetch(url, { cache: 'force-cache' });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        const safeFilename = urlToSafeFilename(url);

        chrome.downloads.download({
          url: dataUrl,
          filename: safeFilename,
          conflictAction: 'uniquify'
        });

      } catch (error) {
        console.error(`Falha ao obter imagem: ${url}`, error);
      }
    });
  }
});

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function urlToSafeFilename(urlStr) {
  let cleanName = urlStr.replace(/^https?:\/\//i, '');
  const unicodeReplacements = {
    '/': '∕', '\\': '∖', ':': '꞉', '*': '∗', '?': '﹖', '"': '″', '<': '＜', '>': '＞', '|': '｜'
  };
  return cleanName.replace(/[\/\\:\*\?"<>\|]/g, char => unicodeReplacements[char] || char);
}