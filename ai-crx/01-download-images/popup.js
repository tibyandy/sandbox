let txtHandle = null;
let dirHandle = null;
let existingFiles = new Set();

const $ = id => document.getElementById(id);
const log = msg => { $("log").textContent += msg + "\n"; $("log").scrollTop = 99999; };

$("pickTxt").onclick = async () => {
  const [handle] = await showOpenFilePicker({
    types: [{ description: "Text", accept: { "text/plain": [".txt"] } }]
  });
  txtHandle = handle;
  $("start").disabled = !dirHandle;
  log("TXT selecionado: " + handle.name);
};

$("pickDir").onclick = async () => {
  dirHandle = await showDirectoryPicker({ mode: "readwrite" });
  // Lista os arquivos existentes
  existingFiles = new Set();
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") existingFiles.add(entry.name);
  }
  $("start").disabled = !txtHandle;
  log(`Pasta "${dirHandle.name}" selecionada (${existingFiles.size} arquivos existentes).`);
};

$("start").onclick = async () => {
  const file = await txtHandle.getFile();
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/).filter(Boolean);

  const referer = lines[0].trim();
  const imageUrls = lines.slice(1).map(l => l.trim()).filter(Boolean);

  log(`Referer: ${referer}`);
  log(`Total de URLs: ${imageUrls.length}\n`);

  // Define o header Referer via declarativeNetRequest
  chrome.runtime.sendMessage({ type: "SET_REFERER", referer });

  let downloaded = 0, skipped = 0, errors = 0;

  for (const url of imageUrls) {
    try {
      const filename = decodeURIComponent(new URL(url).pathname.split("/").pop());
      if (!filename) { log(`⚠️  Sem nome: ${url}`); errors++; continue; }

      if (existingFiles.has(filename)) {
        log(`⏭️  Pulado (já existe): ${filename}`);
        skipped++;
        continue;
      }

      const resp = await fetch(url);
      if (!resp.ok) { log(`❌ ${resp.status} ${filename}`); errors++; continue; }

      const blob = await resp.blob();
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      existingFiles.add(filename);
      downloaded++;
      log(`✅ ${filename} (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      log(`❌ Erro: ${e.message}`);
      errors++;
    }
  }

  // Limpa o header
  chrome.runtime.sendMessage({ type: "CLEAR_REFERER" });

  log(`\n--- Concluído: ${downloaded} baixados, ${skipped} pulados, ${errors} erros ---`);
};