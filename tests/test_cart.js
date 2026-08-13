// Тест корзины SAM TEA: фасовки, цены, итог и текст заказа
const fs = require('fs');
const { JSDOM } = require('jsdom');
const REPO = require('path').join(__dirname, '..');

const dom = new JSDOM('<div id="app"></div>', { url: 'https://samtea.vercel.app', runScripts: 'outside-only' });
const w = dom.window;
w.Telegram = undefined;
// оба файла — один лексический скоуп, как в браузере
w.eval(fs.readFileSync(`${REPO}/data.js`, 'utf8') + '\n' + fs.readFileSync(`${REPO}/app.js`, 'utf8')
  + '\nwindow.TEAS=TEAS; window.SETS=SETS;'
  + '\nObject.defineProperty(window,"cart",{get:()=>cart,set:v=>{cart=v}});'
  + '\nwindow.showDetail=showDetail; window.selectSize=selectSize;'
  + '\nwindow.addToCart=addToCart; window.removeFromCart=removeFromCart;'
  );

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${ok ? '' : `\n         получил: ${got}\n         ожидал:  ${want}`}`);
};

const bySku = a => w.TEAS.find(x => x.art === a);
function add(sku, grams) {
  const tea = bySku(sku);
  w.showDetail(tea.id);
  if (grams != null) {
    const s = tea.sizes.find(x => x.g === grams);
    w.selectSize(s.g, s.price);
  }
  w.addToCart(tea.id);
  return w.cart[w.cart.length - 1];
}
const reset = () => { w.cart = []; };

console.log('\n── сценарий Сэма: два чая по 50 г ──');
reset();
add('SP-26', 50); add('QH-26', 50);
t('Шэн Пуэр: цена', w.cart[0].price, 400);
t('Шэн Пуэр: вес', w.cart[0].weight, '50 г');
t('Ци Хун: цена', w.cart[1].price, 950);
t('Ци Хун: вес', w.cart[1].weight, '50 г');
t('итого', w.cart.reduce((s, i) => s + i.price, 0), 1350);

console.log('\n── сотня выбирается явно ──');
reset();
add('SP-26', 100);
t('цена', w.cart[0].price, 720);
t('вес', w.cart[0].weight, '100г');

console.log('\n── по умолчанию, без клика по фасовке ──');
reset();
add('HK-26', null);
t('Хоу Куй берётся как 50 г', w.cart[0].price, 1750);
t('вес', w.cart[0].weight, '50 г');

console.log('\n── пакетик ──');
reset();
add('RG-26', null);
t('цена', w.cart[0].price, 70);
t('вес человеческий', w.cart[0].weight, 'пакетик ~8 г');

console.log('\n── блин целиком ──');
reset();
add('SHU-BL', 357);
t('цена', w.cart[0].price, 1760);
t('вес', w.cart[0].weight, 'блин 357 г');
reset();
add('SHU-BL', 50);
t('кусок 50 г: цена', w.cart[0].price, 320);
t('кусок 50 г: вес', w.cart[0].weight, '50 г');

console.log('\n── посуда и лот распродажи (фасовок нет) ──');
reset();
add('ISIN-LX', null); add('R-01', null);
t('чайник: цена', w.cart[0].price, 15000);
t('чайник: вес', w.cart[0].weight, '1 шт');
t('лот: цена', w.cart[1].price, 2200);

console.log('\n── два одинаковых товара удаляются по одному ──');
reset();
add('QH-26', 50); add('QH-26', 100);
t('в корзине две позиции', w.cart.length, 2);
t('разные cartId', w.cart[0].cartId !== w.cart[1].cartId, true);
w.removeFromCart(w.cart[0].cartId);
t('осталась одна', w.cart.length, 1);
t('осталась именно сотня', w.cart[0].price, 1750);

console.log('\n── текст заказа, который уйдёт Сэму ──');
reset();
add('SP-26', 50); add('QH-26', 50);
const items = w.cart.map(i => `• ${i.name} ${i.weight} — ${i.price} ₽`).join('\n');
const total = w.cart.reduce((s, i) => s + i.price, 0);
const msg = 'Привет! Хочу заказать:\n' + items + '\n\nИтого: ' + total + ' ₽';
console.log('\x1b[2m' + msg.split('\n').map(l => '         ' + l).join('\n') + '\x1b[0m');
t('в тексте нет «100г»', /100г/.test(msg), false);
t('в тексте есть «50 г»', /50 г/.test(msg), true);
t('итог в тексте', /Итого: 1350 ₽/.test(msg), true);

console.log(`\n${fail ? '❌' : '✅'} пройдено ${pass}, провалено ${fail}\n`);
process.exit(fail ? 1 : 0);
