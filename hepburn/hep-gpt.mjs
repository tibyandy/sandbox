export default class Hep {
    constructor(text = '') {
        this.text = String(text);
    }

    /**
     * Converte o texto em:
     *
     * [
     *   ['セー', 'ラー'],
     *   ['SE-', 'RA-']
     * ]
     *
     * A primeira dimensão contém as unidades japonesas.
     * A segunda contém a romanização correspondente.
     */
    toArray() {
        const jp = [];
        const romaji = [];

        const chars = [...this.text];

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];

            // Espaços e caracteres não japoneses ficam isolados.
            if (!this.isJapanese(char)) {
                jp.push(char);
                romaji.push('');
                continue;
            }

            // Pequeno っ/ッ: fica anexado à próxima unidade.
            if (this.isSokuon(char)) {
                if (i + 1 < chars.length) {
                    const next = this.readUnit(chars, i + 1);

                    jp.push(char + next.text);
                    romaji.push(this.doubleInitial(next.romaji));

                    i += next.length;
                    continue;
                }

                jp.push(char);
                romaji.push('');
                continue;
            }

            const unit = this.readUnit(chars, i);

            jp.push(unit.text);
            romaji.push(unit.romaji);

            i += unit.length - 1;
        }

        return [jp, romaji];
    }

    /**
     * Renderiza usando <ruby>.
     *
     * Exemplo:
     *
     * <span class="hep-word">
     *   <ruby><rb>べ</rb><rt>be</rt></ruby>
     *   <ruby><rb>た</rb><rt>ta</rt></ruby>
     * </span>
     *
     * Caracteres sem romanização não usam ruby.
     */
    toHtml() {
        const [jp, romaji] = this.toArray();

        const html = [];

        html.push('<span class="hep-word">');

        for (let i = 0; i < jp.length; i++) {
            const text = this.escapeHtml(jp[i]);
            const reading = this.escapeHtml(romaji[i]);

            if (reading) {
                html.push(
                    `<ruby><rb>${text}</rb><rt>${reading}</rt></ruby>`
                );
            } else {
                html.push(
                    `<span class="hep-unread">${text}</span>`
                );
            }
        }

        html.push('</span>');

        return html.join('');
    }

    /**
     * Lê uma unidade fonética japonesa:
     *
     * き
     * しゃ
     * りょ
     * ティ
     * ー
     * ん
     */
    readUnit(chars, index) {
        const char = chars[index];

        // ん / ン
        if (this.isN(char)) {
            return {
                text: char,
                romaji: this.kanaMap[char] || '',
                length: 1
            };
        }

        // ー: normalmente pertence à sílaba anterior.
        if (char === 'ー') {
            return {
                text: char,
                romaji: '-',
                length: 1
            };
        }

        // Tenta primeiro combinações de 2 caracteres:
        // しゃ, しゅ, しょ, ちゃ, ちゅ, ちょ,
        // りゃ, りゅ, りょ, ティ, ファ etc.
        if (index + 1 < chars.length) {
            const pair = char + chars[index + 1];

            if (this.kanaMap[pair]) {
                return {
                    text: pair,
                    romaji: this.kanaMap[pair],
                    length: 2
                };
            }
        }

        // Kana simples.
        if (this.kanaMap[char]) {
            return {
                text: char,
                romaji: this.kanaMap[char],
                length: 1
            };
        }

        // Kana japonês desconhecido.
        return {
            text: char,
            romaji: '',
            length: 1
        };
    }

    /**
     * Determina se o caractere faz parte dos silabários
     * hiragana/katakana ou é o chōonpu ー.
     */
    isJapanese(char) {
        const code = char.codePointAt(0);

        return (
            (code >= 0x3040 && code <= 0x309f) || // Hiragana
            (code >= 0x30a0 && code <= 0x30ff) || // Katakana
            (code >= 0x31f0 && code <= 0x31ff) || // Katakana extensions
            char === 'ー'
        );
    }

    isSokuon(char) {
        return char === 'っ' || char === 'ッ';
    }

    isN(char) {
        return char === 'ん' || char === 'ン';
    }

    /**
     * Duplica a consoante inicial para っ.
     *
     * さっし  -> さっ / し -> sa / sshi
     * まっちゃ -> ma / tcha -> matcha
     * いっしょ -> i / ssho -> issho
     * こっち -> ko / tchi -> kotchi
     */
    doubleInitial(romaji) {
        if (!romaji) {
            return '';
        }

        const lower = romaji.toLowerCase();

        // Hepburn:
        // ちゃ -> cha, então っちゃ -> tcha
        if (lower.startsWith('ch')) {
            return this.preserveCase(romaji, 't' + romaji);
        }

        // Não duplica vogais, n ou hífen.
        if (/^[aeioun-]/i.test(romaji)) {
            return romaji;
        }

        const first = romaji.charAt(0);

        return first + romaji;
    }

    preserveCase(original, value) {
        if (original === original.toUpperCase()) {
            return value.toUpperCase();
        }

        if (
            original.length > 0 &&
            original.charAt(0) === original.charAt(0).toUpperCase()
        ) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }

        return value;
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}


/*
 * ============================================================
 * HEPBURN MAP
 * ============================================================
 */

Hep.prototype.kanaMap = {

    // -------------------------
    // Hiragana
    // -------------------------

    'あ': 'a',
    'い': 'i',
    'う': 'u',
    'え': 'e',
    'お': 'o',

    'か': 'ka',
    'き': 'ki',
    'く': 'ku',
    'け': 'ke',
    'こ': 'ko',

    'さ': 'sa',
    'し': 'shi',
    'す': 'su',
    'せ': 'se',
    'そ': 'so',

    'た': 'ta',
    'ち': 'chi',
    'つ': 'tsu',
    'て': 'te',
    'と': 'to',

    'な': 'na',
    'に': 'ni',
    'ぬ': 'nu',
    'ね': 'ne',
    'の': 'no',

    'は': 'ha',
    'ひ': 'hi',
    'ふ': 'fu',
    'へ': 'he',
    'ほ': 'ho',

    'ま': 'ma',
    'み': 'mi',
    'む': 'mu',
    'め': 'me',
    'も': 'mo',

    'や': 'ya',
    'ゆ': 'yu',
    'よ': 'yo',

    'ら': 'ra',
    'り': 'ri',
    'る': 'ru',
    'れ': 're',
    'ろ': 'ro',

    'わ': 'wa',
    'を': 'o',

    'ん': 'n',

    // Dakuten / handakuten

    'が': 'ga',
    'ぎ': 'gi',
    'ぐ': 'gu',
    'げ': 'ge',
    'ご': 'go',

    'ざ': 'za',
    'じ': 'ji',
    'ず': 'zu',
    'ぜ': 'ze',
    'ぞ': 'zo',

    'だ': 'da',
    'ぢ': 'ji',
    'づ': 'zu',
    'で': 'de',
    'ど': 'do',

    'ば': 'ba',
    'び': 'bi',
    'ぶ': 'bu',
    'べ': 'be',
    'ぼ': 'bo',

    'ぱ': 'pa',
    'ぴ': 'pi',
    'ぷ': 'pu',
    'ぺ': 'pe',
    'ぽ': 'po',

    // -------------------------
    // Hiragana combinations
    // -------------------------

    'きゃ': 'kya',
    'きゅ': 'kyu',
    'きょ': 'kyo',

    'ぎゃ': 'gya',
    'ぎゅ': 'gyu',
    'ぎょ': 'gyo',

    'しゃ': 'sha',
    'しゅ': 'shu',
    'しょ': 'sho',

    'じゃ': 'ja',
    'じゅ': 'ju',
    'じょ': 'jo',

    'ちゃ': 'cha',
    'ちゅ': 'chu',
    'ちょ': 'cho',

    'にゃ': 'nya',
    'にゅ': 'nyu',
    'にょ': 'nyo',

    'ひゃ': 'hya',
    'ひゅ': 'hyu',
    'ひょ': 'hyo',

    'びゃ': 'bya',
    'びゅ': 'byu',
    'びょ': 'byo',

    'ぴゃ': 'pya',
    'ぴゅ': 'pyu',
    'ぴょ': 'pyo',

    'みゃ': 'mya',
    'みゅ': 'myu',
    'みょ': 'myo',

    'りゃ': 'rya',
    'りゅ': 'ryu',
    'りょ': 'ryo',

    // -------------------------
    // Katakana
    // -------------------------

    'ア': 'A',
    'イ': 'I',
    'ウ': 'U',
    'エ': 'E',
    'オ': 'O',

    'カ': 'KA',
    'キ': 'KI',
    'ク': 'KU',
    'ケ': 'KE',
    'コ': 'KO',

    'サ': 'SA',
    'シ': 'SHI',
    'ス': 'SU',
    'セ': 'SE',
    'ソ': 'SO',

    'タ': 'TA',
    'チ': 'CHI',
    'ツ': 'TSU',
    'テ': 'TE',
    'ト': 'TO',

    'ナ': 'NA',
    'ニ': 'NI',
    'ヌ': 'NU',
    'ネ': 'NE',
    'ノ': 'NO',

    'ハ': 'HA',
    'ヒ': 'HI',
    'フ': 'FU',
    'ヘ': 'HE',
    'ホ': 'HO',

    'マ': 'MA',
    'ミ': 'MI',
    'ム': 'MU',
    'メ': 'ME',
    'モ': 'MO',

    'ヤ': 'YA',
    'ユ': 'YU',
    'ヨ': 'YO',

    'ラ': 'RA',
    'リ': 'RI',
    'ル': 'RU',
    'レ': 'RE',
    'ロ': 'RO',

    'ワ': 'WA',
    'ヲ': 'O',

    'ン': 'N',

    // Dakuten / handakuten

    'ガ': 'GA',
    'ギ': 'GI',
    'グ': 'GU',
    'ゲ': 'GE',
    'ゴ': 'GO',

    'ザ': 'ZA',
    'ジ': 'JI',
    'ズ': 'ZU',
    'ゼ': 'ZE',
    'ゾ': 'ZO',

    'ダ': 'DA',
    'ヂ': 'JI',
    'ヅ': 'ZU',
    'デ': 'DE',
    'ド': 'DO',

    'バ': 'BA',
    'ビ': 'BI',
    'ブ': 'BU',
    'ベ': 'BE',
    'ボ': 'BO',

    'パ': 'PA',
    'ピ': 'PI',
    'プ': 'PU',
    'ペ': 'PE',
    'ポ': 'PO',

    // -------------------------
    // Katakana combinations
    // -------------------------

    'キャ': 'KYA',
    'キュ': 'KYU',
    'キョ': 'KYO',

    'ギャ': 'GYA',
    'ギュ': 'GYU',
    'ギョ': 'GYO',

    'シャ': 'SHA',
    'シュ': 'SHU',
    'ショ': 'SHO',

    'ジャ': 'JA',
    'ジュ': 'JU',
    'ジョ': 'JO',

    'チャ': 'CHA',
    'チュ': 'CHU',
    'チョ': 'CHO',

    'ニャ': 'NYA',
    'ニュ': 'NYU',
    'ニョ': 'NYO',

    'ヒャ': 'HYA',
    'ヒュ': 'HYU',
    'ヒョ': 'HYO',

    'ビャ': 'BYA',
    'ビュ': 'BYU',
    'ビョ': 'BYO',

    'ピャ': 'PYA',
    'ピュ': 'PYU',
    'ピョ': 'PYO',

    'ミャ': 'MYA',
    'ミュ': 'MYU',
    'ミョ': 'MYO',

    'リャ': 'RYA',
    'リュ': 'RYU',
    'リョ': 'RYO',

    // -------------------------
    // Extended katakana
    // -------------------------

    'イェ': 'YE',
    'ウィ': 'WI',
    'ウェ': 'WE',
    'ウォ': 'WO',

    'ウュ': 'WYU',

    'クァ': 'KWA',
    'クィ': 'KWI',
    'クェ': 'KWE',
    'クォ': 'KWO',

    'グァ': 'GWA',
    'グィ': 'GWI',
    'グェ': 'GWE',
    'グォ': 'GWO',

    'シェ': 'SHE',
    'ジェ': 'JE',

    'チェ': 'CHE',

    'ティ': 'TI',
    'トゥ': 'TU',

    'ディ': 'DI',
    'ドゥ': 'DU',

    'ニェ': 'NYE',

    'ヒェ': 'HYE',

    'ビェ': 'BYE',
    'ピェ': 'PYE',

    'ミェ': 'MYE',

    'リェ': 'RYE',

    'ファ': 'FA',
    'フィ': 'FI',
    'フェ': 'FE',
    'フォ': 'FO',

    'フャ': 'FYA',
    'フュ': 'FYU',
    'フョ': 'FYO',

    'ヴァ': 'VA',
    'ヴィ': 'VI',
    'ヴェ': 'VE',
    'ヴォ': 'VO',
    'ヴュ': 'VYU',

    'ツァ': 'TSA',
    'ツィ': 'TSI',
    'ツェ': 'TSE',
    'ツォ': 'TSO',

    'スィ': 'SI',
    'ズィ': 'ZI',

    // -------------------------
    // Small vowels
    // -------------------------

    'ぁ': 'a',
    'ぃ': 'i',
    'ぅ': 'u',
    'ぇ': 'e',
    'ぉ': 'o',

    'ァ': 'A',
    'ィ': 'I',
    'ゥ': 'U',
    'ェ': 'E',
    'ォ': 'O'
};