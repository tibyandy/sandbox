const fs = require('fs');
const readline = require('readline');

const TSV_FILE = 'tags.tsv';
const BOOKMARKS_FILE = 'bookmarks.txt';
const OUTPUT_FILE = 'bookmarks_updated.txt';

async function loadTagsMap(tsvPath) {
    const tagsMap = new Map();
    const fileStream = fs.createReadStream(tsvPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isHeader = true;
    for await (const line of rl) {
        if (isHeader) { isHeader = false; continue; }
        if (!line.trim()) continue;
        
        // Split considerando a nova quarta coluna (NOTES / TRANSLATION)
        const [id, tag, category, translation] = line.split('\t');
        if (tag) {
            tagsMap.set(tag.trim(), {
                category: category ? category.trim() : '',
                translation: translation ? translation.trim() : ''
            });
        }
    }
    return tagsMap;
}

// Lógica de prioridade: remove "categ-" se "categ" também estiver presente
function filterCategories(categoriesArray) {
    const unique = [...new Set(categoriesArray)];
    return unique.filter(cat => {
        if (cat.endsWith('-')) {
            const baseCat = cat.slice(0, -1);
            // Se a versão sem '-' existir no array, descarta esta com '-'
            if (unique.includes(baseCat)) return false;
        }
        return true;
    });
}

async function processBookmarks() {
    console.time('Processing Time');
    const tagsMap = await loadTagsMap(TSV_FILE);
    
    const readStream = fs.createReadStream(BOOKMARKS_FILE);
    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

    for await (const line of rl) {
        writeStream.write(line + '\n');

        if (line.startsWith('[tags]')) {
            const tags = line
                .replace('[tags]', '')
                .split('┋')
                .map(t => t.trim())
                .filter(Boolean);

            const matchedData = tags.map(tag => tagsMap.get(tag)).filter(Boolean);

            // 1. Processamento de Categorias com regra de prioridade do "-"
            const rawCategories = matchedData.map(d => d.category).filter(Boolean);
            const filteredCategories = filterCategories(rawCategories);
            
            const categLine = `[tags_categ] ${filteredCategories.map(c => `┋${c}┋`).join(' ')}`;
            writeStream.write(categLine + '\n');

            // 2. Processamento de Traduções (Deduplicadas via Set)
            const translations = [...new Set(
                matchedData.map(d => d.translation).filter(Boolean)
            )];

            const translLine = `[tags_transl] ${translations.map(t => `┋${t}┋`).join(' ')}`;
            writeStream.write(translLine + '\n');
        }
    }

    writeStream.end();
    console.timeEnd('Processing Time');
    console.log(`Done! Output saved to ${OUTPUT_FILE}`);
}

processBookmarks().catch(console.error);