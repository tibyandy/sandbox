console.log('[CRX] tags-inject.js');
(async function() {
  const CRX = window.CRX = window.CRX || { log: console.log.bind(null), error: console.error.bind(null) }

  // Executado como <script src="..."> no MAIN world (via injeção do tags-loader.js).
  // A URL do tags.tsv chega pelo atributo data-tsv-url do próprio <script>.
  const scriptEl = document.currentScript;
  const tsvUrl = scriptEl && scriptEl.dataset.tsvUrl;
  if (!tsvUrl) {
    CRX.error('[CRX:tags-inject] - data-tsv-url ausente');
    return;
  }

  function parseTSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.length);
    CRX.log('[CRX.tags-inject] - Linhas de Tags:', lines.length - 1)
    if (!lines.length) return {};
    const tags = {}
    lines.slice(1).forEach(line => {
      const [tag, categString, description] = line.split('\t');
      const categs = categString.split(' ')
      if (!tag || !categs[0]) return;
      const tagInit = tags[tag[0]] = tags[tag[0]] || {}
      Object.assign(tagInit, { [tag]: [description, ...categs] })
    })
    return tags;
  }

  const res = await fetch(tsvUrl)
  const text = await res.text()
  try {
    CRX.Tags = parseTSV(text);
    CRX.log('[CRX.tags-inject] ativo - CRX.Tags <--', Object.keys(CRX.Tags).length, 'tags')
  } catch (err) {
    CRX.error('[CRX.tags-inject] - Erro ao ler Tags.tsv:', err);
  }
})();
