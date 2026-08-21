// markdown.js
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url) {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (/^\//.test(trimmed)) return trimmed; // caminho relativo
  return null;
}

/** Aplica só as transformações inline (bold/italic/code/link), sem parágrafos/listas/headers. */
function mdInline(text) {
  if (!text) return '';
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/_([^_]+)_/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const safe = sanitizeUrl(url);
    return safe ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
  });
  return out;
}

/** Parser de bloco completo: headers, listas, parágrafos — usa mdInline() dentro de cada linha. */
function mdToHtml(text) {
  if (!text) return '';
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  if (rawLines.length > 1 || rawLines[0].startsWith('Tipo de valor da tarifa')) {
    console.log(rawLines)
  }

  const html = [];
  let paragraphBuffer = [];
  let i = 0;

  function flushParagraph() {
    if (paragraphBuffer.length) {
      if (rawLines.length > 1) {
        html.push(`<p>${paragraphBuffer.map(mdInline).join('<br>')}</p>`);
      } else {
        html.push(paragraphBuffer.map(mdInline).join('<br>'));
      }
      paragraphBuffer = [];
    }
  }

  while (i < rawLines.length) {
    const line = rawLines[i];
    if (rawLines.length > 1) {
        console.log(line)
    }

    if (line.trim() === '') {
      flushParagraph();
      i++;
      continue;
    }


    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${mdInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      const items = [];
      while (i < rawLines.length && /^\s*[-*]\s+/.test(rawLines[i])) {
        items.push(`<li>${mdInline(rawLines[i].replace(/^\s*[-*]\s+/, ''))}</li>`);
        i++;
      }
      console.log(items)
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      const items = [];
      while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i])) {
        items.push(`<li>${mdInline(rawLines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // linha normal — acumula no parágrafo corrente
    paragraphBuffer.push(line);
    i++;
  }

  flushParagraph();
  return html.join('\n');
}
