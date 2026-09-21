export default class Hep {
  // Tabela de conversão Hiragana / Katakana para Romaji (Hepburn)
  static MAP = {
    // Digrafos / Combinações (2 caracteres)
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja',  'じゅ': 'ju',  'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',

    'キャ': 'KYA', 'キュ': 'KYU', 'キョ': 'KYO',
    'シャー': 'SHA-', 'シュ': 'SHU', 'ショ': 'SHO', 'シャ': 'SHA',
    'チャ': 'CHA', 'チュ': 'CHU', 'チョ': 'CHO',
    'ニャ': 'NYA', 'ニュ': 'NYU', 'ニョ': 'NYO',
    'ヒャ': 'HYA', 'ヒュ': 'HYU', 'ヒョ': 'HYO',
    'ミャ': 'MYA', 'ミュ': 'MYU', 'ミョ': 'MYO',
    'リャ': 'RYA', 'リュ': 'RYU', 'リョ': 'RYO',
    'ギャ': 'GYA', 'ギュ': 'GYU', 'ギョ': 'GYO',
    'ジャ': 'JA',  'ジュ': 'JU',  'ジョ': 'JO',
    'ビャ': 'BYA', 'ビュ': 'BYU', 'ビョ': 'BYO',
    'ピャ': 'PYA', 'ピュ': 'PYU', 'ピョ': 'PYO',

    // Monografos Gojūon (Gaiji e básicos)
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',

    // Katakana
    'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
    'カ': 'KA', 'キ': 'KI', 'ク': 'KU', 'ケ': 'KE', 'コ': 'KO',
    'サ': 'SA', 'シ': 'SHI', 'ス': 'SU', 'セ': 'SE', 'ソ': 'SO',
    'タ': 'TA', 'チ': 'CHI', 'ツ': 'TSU', 'テ': 'TE', 'ト': 'TO',
    'ナ': 'NA', 'ニ': 'NI', 'ヌ': 'NU', 'ネ': 'NE', 'ノ': 'NO',
    'ハ': 'HA', 'ヒ': 'HI', 'フ': 'FU', 'ヘ': 'HE', 'ホ': 'HO',
    'マ': 'MA', 'ミ': 'MI', 'ム': 'MU', 'メ': 'ME', 'モ': 'MO',
    'ヤ': 'YA', 'ユ': 'YU', 'ヨ': 'YO',
    'ラ': 'RA', 'リ': 'RI', 'ル': 'RU', 'レ': 'RE', 'ロ': 'RO',
    'ワ': 'WA', 'ヰ': 'WI', 'ヱ': 'WE', 'ヲ': 'WO', 'ン': 'N',
    'ガ': 'GA', 'ギ': 'GI', 'グ': 'GU', 'ゲ': 'GE', 'ゴ': 'GO',
    'ザ': 'ZA', 'ジ': 'JI', 'ズ': 'ZU', 'ゼ': 'ZE', 'ゾ': 'ZO',
    'ダ': 'DA', 'ヂ': 'JI', 'ヅ': 'ZU', 'デ': 'DE', 'ド': 'DO',
    'バ': 'BA', 'ビ': 'BI', 'ブ': 'BU', 'ベ': 'BE', 'ボ': 'BO',
    'パ': 'PA', 'ピ': 'PI', 'プ': 'PU', 'ペ': 'PE', 'ポ': 'PO'
  };

  constructor(text) {
    this.text = text || '';
  }

  toArray() {
    const jpTokens = [];
    const romajiTokens = [];
    const text = this.text;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1] || '';

      // 1. Trata Sokuon (っ / ッ) -> duplicar a próxima consoante
      if (char === 'っ' || char === 'ッ') {
        let combinedJp = char + nextChar;
        let romaji = '';

        // Se o próximo caractere for uma combinação de 2 caracteres (ex: っしゃ)
        const nextTwo = text.slice(i + 1, i + 3);
        if (Hep.MAP[nextTwo]) {
          combinedJp = char + nextTwo;
          const nextRomaji = Hep.MAP[nextTwo];
          const doubleConsonant = nextRomaji[0].toLowerCase();
          romaji = (char === 'ッ' ? doubleConsonant.toUpperCase() : doubleConsonant) + nextRomaji;
          i += 3;
        } else if (Hep.MAP[nextChar]) {
          const nextRomaji = Hep.MAP[nextChar];
          const doubleConsonant = nextRomaji[0].toLowerCase();
          romaji = (char === 'ッ' ? doubleConsonant.toUpperCase() : doubleConsonant) + nextRomaji;
          i += 2;
        } else {
          jpTokens.push(char);
          romajiTokens.push('');
          i++;
          continue;
        }

        jpTokens.push(combinedJp);
        romajiTokens.push(romaji);
        continue;
      }

      // 2. Trata combinações de 2 caracteres (Digrafos / Yōon: しゃ, キャ, etc.)
      const pair = char + nextChar;
      if (Hep.MAP[pair]) {
        let jp = pair;
        let romaji = Hep.MAP[pair];

        // Trata Chōonpu (ー) anexado ao digrafo katakana
        if (text[i + 2] === 'ー') {
          jp += 'ー';
          romaji += '-';
          i += 3;
        } else {
          i += 2;
        }

        jpTokens.push(jp);
        romajiTokens.push(romaji);
        continue;
      }

      // 3. Trata caractere único (Monógrado) + Chōonpu (ー) se houver
      if (Hep.MAP[char]) {
        let jp = char;
        let romaji = Hep.MAP[char];

        if (nextChar === 'ー') {
          jp += 'ー';
          romaji += '-';
          i += 2;
        } else {
          i += 1;
        }

        jpTokens.push(jp);
        romajiTokens.push(romaji);
        continue;
      }

      // 4. Kanji, pontuações ou outros caracteres (retorna string vazia '')
      jpTokens.push(char);
      romajiTokens.push('');
      i++;
    }

    return [jpTokens, romajiTokens];
  }

  toHtml() {
    const [jpTokens, romajiTokens] = this.toArray();
    let html = '<ruby class="hepburn-container">';

    for (let i = 0; i < jpTokens.length; i++) {
      const jp = jpTokens[i];
      const rom = romajiTokens[i];

      if (rom) {
        // Usa as tags semânticas nativas HTML5 <ruby> e <rt>
        html += `<rb>${jp}</rb><rt>${rom}</rt>`;
      } else {
        // Kanji ou caracteres sem conversão
        html += `<rb class="no-romaji">${jp}</rb>`;
      }
    }

    html += '</ruby>';
    return html;
  }
}