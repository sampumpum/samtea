const fs = require('fs');
const { JSDOM } = require('jsdom');
const REPO = require('path').join(__dirname, '..');
const dom = new JSDOM('<div id="app"></div>', { url: 'https://samtea.vercel.app', runScripts: 'outside-only' });
const w = dom.window;
w.eval(fs.readFileSync(`${REPO}/data.js`,'utf8') + '\n' + fs.readFileSync(`${REPO}/app.js`,'utf8')
 + '\nwindow.TEAS=TEAS;'
 + '\nObject.defineProperty(window,"cart",{get:()=>cart,set:v=>{cart=v}});'
 + '\nwindow.order=order; window.checkout=checkout; window.orderText=orderText;'
 + '\nwindow.shipCost=shipCost; window.goodsTotal=goodsTotal; window.setMethod=setMethod;'
 + '\nwindow.showDetail=showDetail; window.selectSize=selectSize; window.addToCart=addToCart;');

let pass=0, fail=0;
const t=(n,got,want)=>{const ok=String(got)===String(want);ok?pass++:fail++;
 console.log(`${ok?'  ok  ':'  FAIL'} ${n}${ok?'':`\n         получил: ${got}\n         ожидал:  ${want}`}`);};
const bySku=a=>w.TEAS.find(x=>x.art===a);
function add(sku,g){const tea=bySku(sku);w.showDetail(tea.id);
 if(g!=null){const s=tea.sizes.find(x=>x.g===g);w.selectSize(s.g,s.price);} w.addToCart(tea.id);}
function reset(m){w.cart=[];w.order.method=m||'cdek';w.order.name='';w.order.phone='';w.order.city='';w.order.address='';}

console.log('\n── доставка считается от суммы ──');
reset('cdek'); add('SP-26',50);                     // 400
t('мелкий заказ — 420 ₽', w.shipCost(), 420);
reset('cdek'); add('HK-26',100);                    // 3130
t('3130 ₽ — всё ещё 420', w.shipCost(), 420);
reset('cdek'); add('HK-26',100); add('DHGS-26',100);// 3130+2230=5360
t('5360 ₽ — бесплатно', w.shipCost(), 0);
reset('cdek'); add('ISIN-LX',null);                 // ровно 15000
t('крупный заказ — бесплатно', w.shipCost(), 0);

console.log('\n── ровно на пороге 5000 ──');
reset('cdek'); w.cart = [{name:'Тест',weight:'100г',price:5000,cartId:1}];
t('5000 ₽ — бесплатно', w.shipCost(), 0);
w.cart = [{name:'Тест',weight:'100г',price:4999,cartId:1}];
t('4999 ₽ — платно', w.shipCost(), 420);

console.log('\n── самовывоз ──');
reset('pickup'); add('SP-26',50);
t('доставка ноль', w.shipCost(), 0);
t('в тексте есть Новокосино', /Новокосино/.test(w.orderText()), true);
t('в тексте нет СДЭК', /СДЭК/.test(w.orderText()), false);

console.log('\n── поля попадают в заказ ──');
reset('cdek'); add('QH-26',50); add('SP-26',50);   // 950+400=1350
Object.assign(w.order,{name:'Иван Петров',phone:'+7 903 123-45-67',city:'Казань',address:'ПВЗ на Баумана 12'});
const txt=w.orderText();
console.log('\x1b[2m'+txt.split('\n').map(l=>'         '+l).join('\n')+'\x1b[0m');
t('имя и телефон', /Иван Петров, \+7 903 123-45-67/.test(txt), true);
t('город и адрес', /Казань, ПВЗ на Баумана 12/.test(txt), true);
t('товары', /Товары: 1350 ₽/.test(txt), true);
t('доставка', /Доставка СДЭК: 420 ₽/.test(txt), true);
t('итого с доставкой', /Итого: 1770 ₽/.test(txt), true);
t('фасовка 50 г, а не 100', /50 г/.test(txt) && !/100г/.test(txt), true);

console.log('\n── пустые поля не ломают заказ ──');
reset('cdek'); add('QH-26',50);
const t2=w.orderText();
t('пометка про имя', /Имя и телефон не указаны/.test(t2), true);
t('пометка про адрес', /Адрес не указан/.test(t2), true);
t('заказ всё равно собран', /Итого: 1370 ₽/.test(t2), true);

console.log('\n── ссылка в Telegram ──');
reset('cdek'); add('QH-26',50); w.order.city='Тверь';
const url='https://t.me/samtruesam?text='+encodeURIComponent(w.orderText());
t('домен', url.startsWith('https://t.me/samtruesam?text='), true);
t('кириллица закодирована', /%D0/.test(url), true);
t('переносы закодированы', /%0A/.test(url), true);
t('декодируется обратно', decodeURIComponent(url.split('?text=')[1])===w.orderText(), true);

console.log('\n── экран рисуется без ошибок ──');
reset('cdek'); add('QH-26',50);
w.document.getElementById('app').innerHTML='<div class="screen" id="screen-cart"></div>';
w.checkout();
const html=w.document.getElementById('screen-cart').innerHTML;
t('нет блока СБП', /СБП|79853422921/.test(html), false);
t('есть поля адреса', /Имя и фамилия/.test(html), true);
t('есть кнопка отправки', /Отправить заказ Сэму/.test(html), true);
w.setMethod('pickup');
const html2=w.document.getElementById('screen-cart').innerHTML;
t('при самовывозе полей нет', /Имя и фамилия/.test(html2), false);

console.log(`\n${fail?'❌':'✅'} пройдено ${pass}, провалено ${fail}\n`);
process.exit(fail?1:0);
