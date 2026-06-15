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
        
        const [id, tag, category] = line.split('\t');
        if (tag && category) {
            tagsMap.set(tag.trim(), category.trim());
        }
    }
    return tagsMap;
}

async function processBookmarks() {
    console.time('Processing Time');
    const tagsMap = await loadTagsMap(TSV_FILE);
    
    const readStream = fs.createReadStream(BOOKMARKS_FILE);
    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

    for await (const line of rl) {
        // Escreve a linha original
        writeStream.write(line + '\n');

        // Parse e mapeamento da linha [tags]
        if (line.startsWith('[tags]')) {
            // Divide por 「┋」 e remove elementos vazios
            const tags = line
                .replace('[tags]', '')
                .split('┋')
                .map(t => t.trim())
                .filter(Boolean);

            // Extrai as categorias correspondentes (remove duplicadas com Set)
            const categories = [...new Set(
                tags.map(tag => tagsMap.get(tag)).filter(Boolean)
            )];

            // Gera e escreve a linha [tags_categ]
            const categLine = `[tags_categ] ${categories.join(', ')}`;
            writeStream.write(categLine + '\n');
        }
    }

    writeStream.end();
    console.timeEnd('Processing Time');
    console.log(`Done! Output saved to ${OUTPUT_FILE}`);
}

processBookmarks().catch(console.error);