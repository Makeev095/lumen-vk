export const LANGS = ['ru', 'en', 'tr'];

const I18N = {
  ru: {
    title: 'Люмен',
    eyebrow: 'Ночная оранжерея',
    lead: 'Под стеклом ночь. Совмещай одинаковые ростки, чтобы зажечь лампу до рассвета.',
    rule1: 'Поменяй два соседних стекла. Три одинаковых сходятся и гаснут.',
    rule2: 'Четыре в ряд оставляют луч. Пять — светильник. Угол — вспышку.',
    rule3: 'Иней на стекле трескается, если совпадение случилось рядом.',
    enter: 'Войти в оранжерею',
    garden: 'В сад',
    retry: 'Заново',
    again: 'Ещё раз',
    next: 'Дальше',
    moves: 'ходов',
    light: 'Свет',
    frost: 'Иней',
    shop: 'Магазин',
    close: 'Закрыть',
    coinsN: '{n} монет',
    freeCoins: '+{n} монет',
    wait: 'Ждите {n}с',
    extraMoves: '+5 ходов',
    hint: 'Подсказка',
    shuffle: 'Перемешать',
    noCoins: 'Не хватает монет',
    payUnavailable: 'Покупки сейчас недоступны',
    purchased: 'Спасибо за покупку!',
    purchaseFail: 'Покупка не удалась',
    shopLoading: 'Загрузка товаров…',
    shuffled: 'Ростки перелеглись',
    win: 'Фонарь зажёгся',
    winLast: 'Лампа горит',
    lose: 'Лампа погасла',
    winText: 'Можно идти дальше по оранжерее.',
    winLastText: 'Оранжерея не спит. Три ночи собраны, свет дотянет до рассвета.',
    loseText: 'Ходы кончились раньше света. Эту ночь можно зажечь заново.',
    nights: { 1: 'Ночь 01', 2: 'Ночь 02', 3: 'Ночь 03' },
    names: { 1: 'Первый фонарь', 2: 'Иней на стекле', 3: 'Три жилы света' },
    lines: {
      1: 'В стекле ещё темно. Собери лунные папоротники: они держат первый свет.',
      2: 'На холодных стёклах осел иней. Сбей его совпадением рядом и собери тех, кто прячется за ним.',
      3: 'Лампа почти погасла. Расколи толстый иней и собери мох, лозу и папоротник.'
    },
    tiles: { fern: 'Папоротники', beetle: 'Жуки', moss: 'Мох', pearl: 'Жемчуг', vine: 'Лозы' },
    ones: { fern: 'папоротник', beetle: 'жук', moss: 'мох', pearl: 'жемчужина', vine: 'лоза' }
  },
  en: {
    title: 'Lumen',
    eyebrow: 'Night greenhouse',
    lead: 'Night under glass. Match the same sprouts to light the lamp before dawn.',
    rule1: 'Swap two neighbouring tiles. Three of a kind meet and fade.',
    rule2: 'Four in a line leave a beam. Five leave a lamp. A corner leaves a burst.',
    rule3: 'Frost on the glass cracks when a match happens next to it.',
    enter: 'Enter the greenhouse',
    garden: 'Garden',
    retry: 'Retry',
    again: 'Again',
    next: 'Next',
    moves: 'moves',
    light: 'Light',
    frost: 'Frost',
    shop: 'Shop',
    close: 'Close',
    coinsN: '{n} coins',
    freeCoins: '+{n} coins',
    wait: 'Wait {n}s',
    extraMoves: '+5 moves',
    hint: 'Hint',
    shuffle: 'Shuffle',
    noCoins: 'Not enough coins',
    payUnavailable: 'Purchases are unavailable right now',
    purchased: 'Thank you!',
    purchaseFail: 'Purchase failed',
    shopLoading: 'Loading products…',
    shuffled: 'The sprouts reshuffled',
    win: 'The lantern is lit',
    winLast: 'The lamp burns',
    lose: 'The lamp went out',
    winText: 'You can walk further through the greenhouse.',
    winLastText: 'The greenhouse stays awake. Three nights are gathered; the light will last until dawn.',
    loseText: 'Moves ran out before the light. This night can be lit again.',
    nights: { 1: 'Night 01', 2: 'Night 02', 3: 'Night 03' },
    names: { 1: 'First lantern', 2: 'Frost on glass', 3: 'Three veins of light' },
    lines: {
      1: 'The glass is still dark. Gather lunar ferns: they hold the first light.',
      2: 'Frost settled on the cold panes. Break it with a match beside it and collect who hides behind.',
      3: 'The lamp is almost out. Crack the thick frost and gather moss, vine and fern.'
    },
    tiles: { fern: 'Ferns', beetle: 'Beetles', moss: 'Moss', pearl: 'Pearls', vine: 'Vines' },
    ones: { fern: 'fern', beetle: 'beetle', moss: 'moss', pearl: 'pearl', vine: 'vine' }
  },
  tr: {
    title: 'Lümen',
    eyebrow: 'Gece serası',
    lead: 'Camın altında gece. Şafaktan önce lambayı yakmak için aynı filizleri eşleştir.',
    rule1: 'İki komşu camı değiştir. Üç aynı birleşir ve söner.',
    rule2: 'Dört sıra bir ışın bırakır. Beş — bir lamba. Köşe — bir parıltı.',
    rule3: 'Camdaki kırağı, yanında eşleşme olursa çatlar.',
    enter: 'Seraya gir',
    garden: 'Bahçe',
    retry: 'Yeniden',
    again: 'Bir daha',
    next: 'İleri',
    moves: 'hamle',
    light: 'Işık',
    frost: 'Kırağı',
    shop: 'Mağaza',
    close: 'Kapat',
    coinsN: '{n} jeton',
    freeCoins: '+{n} jeton',
    wait: '{n}sn bekle',
    extraMoves: '+5 hamle',
    hint: 'İpucu',
    shuffle: 'Karıştır',
    noCoins: 'Yeterli jeton yok',
    payUnavailable: 'Satın alımlar şu an yok',
    purchased: 'Teşekkürler!',
    purchaseFail: 'Satın alma başarısız',
    shopLoading: 'Ürünler yükleniyor…',
    shuffled: 'Filizler yeniden dizildi',
    win: 'Fener yandı',
    winLast: 'Lamba yanıyor',
    lose: 'Lamba söndü',
    winText: 'Serada ilerleyebilirsin.',
    winLastText: 'Sera uyanık. Üç gece toplandı, ışık şafağa kadar yeter.',
    loseText: 'Hamleler ışıktan önce bitti. Bu geceyi yeniden yakabilirsin.',
    nights: { 1: 'Gece 01', 2: 'Gece 02', 3: 'Gece 03' },
    names: { 1: 'İlk fener', 2: 'Camdaki kırağı', 3: 'Üç ışık damarı' },
    lines: {
      1: 'Cam hâlâ karanlık. Ay eğreltilerini topla: ilk ışığı onlar tutar.',
      2: 'Soğuk camlara kırağı çöktü. Yanındaki eşleşmeyle kır ve arkadakileri topla.',
      3: 'Lamba neredeyse söndü. Kalın kırağıyı kır, yosun, sarmaşık ve eğrelti topla.'
    },
    tiles: { fern: 'Eğreltiler', beetle: 'Böcekler', moss: 'Yosun', pearl: 'İnciler', vine: 'Sarmaşıklar' },
    ones: { fern: 'eğrelti', beetle: 'böcek', moss: 'yosun', pearl: 'inci', vine: 'sarmaşık' }
  }
};

let currentLang = 'ru';

export function setLang(code) {
  code = String(code || 'ru').toLowerCase().slice(0, 2);
  currentLang = LANGS.includes(code) ? code : 'ru';
  return currentLang;
}

export function getLang() {
  return currentLang;
}

export function nextLang() {
  const i = LANGS.indexOf(currentLang);
  return LANGS[(i + 1) % LANGS.length];
}

export function t(key, vars) {
  const pack = I18N[currentLang] || I18N.ru;
  let s = pack[key];
  if (s == null) s = I18N.ru[key];
  if (typeof s !== 'string') return '';
  if (vars) for (const k of Object.keys(vars)) s = s.replaceAll('{' + k + '}', String(vars[k]));
  return s;
}

export function pack() {
  return I18N[currentLang] || I18N.ru;
}

export function langFlag() {
  return currentLang.toUpperCase();
}
