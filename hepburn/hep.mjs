export default class Hep {
  static MAP = {
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

    'キャ': 'Kya', 'キュ': 'Kyu', 'キョ': 'Kyo',
    'シャー': 'Sha-', 'シュ': 'Shu', 'ショ': 'Sho', 'シャ': 'Sha',
    'チャ': 'Cha', 'チュ': 'Chu', 'チョ': 'Cho',
    'ニャ': 'Nya', 'ニュ': 'Nyu', 'ニョ': 'Nyo',
    'ヒャ': 'Hya', 'ヒュ': 'Hyu', 'ヒョ': 'Hyo',
    'ミャ': 'Mya', 'ミュ': 'Myu', 'ミョ': 'Myo',
    'リャ': 'Rya', 'リュ': 'Ryu', 'リョ': 'Ryo',
    'ギャ': 'Gya', 'ギュ': 'Gyu', 'ギョ': 'Gyo',
    'ジャ': 'Ja',  'ジュ': 'Ju',  'ジョ': 'Jo',
    'ビャ': 'Bya', 'ビュ': 'Byu', 'ビョ': 'Byo',
    'ピャ': 'Pya', 'ピュ': 'Pyu', 'ピョ': 'Pyo',

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

    'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
    'カ': 'Ka', 'キ': 'Ki', 'ク': 'Ku', 'ケ': 'Ke', 'コ': 'Ko',
    'サ': 'Sa', 'シ': 'Shi', 'ス': 'Su', 'セ': 'Se', 'ソ': 'So',
    'タ': 'Ta', 'チ': 'Chi', 'ツ': 'Tsu', 'テ': 'Te', 'ト': 'To',
    'ナ': 'Na', 'ニ': 'Ni', 'ヌ': 'Nu', 'ネ': 'Ne', 'ノ': 'No',
    'ハ': 'Ha', 'ヒ': 'Hi', 'フ': 'Fu', 'ヘ': 'He', 'ホ': 'Ho',
    'マ': 'Ma', 'ミ': 'Mi', 'ム': 'Mu', 'メ': 'Me', 'モ': 'Mo',
    'ヤ': 'Ya', 'ユ': 'Yu', 'ヨ': 'Yo',
    'ラ': 'Ra', 'リ': 'Ri', 'ル': 'Ru', 'レ': 'Re', 'ロ': 'Ro',
    'ワ': 'Wa', 'ヰ': 'Wi', 'ヱ': 'We', 'ヲ': 'Wo', 'ン': 'N',
    'ガ': 'Ga', 'ギ': 'Gi', 'グ': 'Gu', 'ゲ': 'Ge', 'ゴ': 'Go',
    'ザ': 'Za', 'ジ': 'Ji', 'ズ': 'Zu', 'ゼ': 'Ze', 'ゾ': 'Zo',
    'ダ': 'Da', 'ヂ': 'Ji', 'ヅ': 'Zu', 'デ': 'De', 'ド': 'Do',
    'バ': 'Ba', 'ビ': 'Bi', 'ブ': 'Bu', 'ベ': 'Be', 'ボ': 'Bo',
    'パ': 'Pa', 'ピ': 'Pi', 'プ': 'Pu', 'ペ': 'Pe', 'ポ': 'Po'
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

      if (char === 'っ' || char === 'ッ') {
        let combinedJp = char + nextChar;
        let romaji = '';

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

      const pair = char + nextChar;
      if (Hep.MAP[pair]) {
        let jp = pair;
        let romaji = Hep.MAP[pair];

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

      jpTokens.push(char);
      romajiTokens.push('');
      i++;
    }

    return [jpTokens, romajiTokens];
  }

  toHtml() {
    const [jpTokens, romajiTokens] = this.toArray();
    let html = '<div>';

    for (let i = 0; i < jpTokens.length; i++) {
      const jp = jpTokens[i];
      const rom = romajiTokens[i];

      if (rom) {
        html += `<ruby><rb lang="en">${rom}</rt><rt>${jp}</rt></ruby>`;
      } else {
        html += `<span>${jp}</span>`;
      }
    }

    html += '</div>';
    return html;
  }
}