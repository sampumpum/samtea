const fs=require('fs');const {JSDOM}=require('jsdom');
const REPO=require('path').join(__dirname,'..');
const dom=new JSDOM('<div id="app"></div>',{url:'https://samtea.vercel.app',runScripts:'outside-only'});
const w=dom.window;
w.eval(fs.readFileSync(`${REPO}/data.js`,'utf8')+'\n'+fs.readFileSync(`${REPO}/app.js`,'utf8')
 +'\nwindow.TEAS=TEAS;window.thumb=thumb;window.getImg=getImg;window.doSearch=doSearch;'
 +'\nwindow.renderSearch=renderSearch;window.renderMain=renderMain;window.showMoodResult=showMoodResult;');
let pass=0,fail=0;
const t=(n,got,want)=>{const ok=String(got)===String(want);ok?pass++:fail++;
 console.log(`${ok?'  ok  ':'  FAIL'} ${n}${ok?'':`\n         получил: ${got}\n         ожидал:  ${want}`}`);};

console.log('\n── превью в поиске ──');
w.renderSearch(); w.doSearch('да хун пао');
const res=w.document.getElementById('search-results').innerHTML;
t('нашлись оба Да Хун Пао', (res.match(/tea-card/g)||[]).length, 2);
t('есть тег img', /<img /.test(res), true);
t('нет голого красного кружка', /class="tea-emoji">🔴</.test(res), false);
t('ссылка на файл фото', /DHP-100_1\.jpg/.test(res), true);

console.log('\n── превью в подборе по настроению ──');
w.document.getElementById('app').innerHTML='<div class="screen" id="screen-mood"></div>';
w.showMoodResult([15,123]);
const mood=w.document.getElementById('screen-mood').innerHTML;
t('фото вместо эмодзи', /result-emoji"[^>]*><img/.test(mood), true);

console.log('\n── у каждой позиции в витрине есть превью ──');
const noimg=w.TEAS.filter(x=>!w.getImg(x.id));
t('позиций без фото', noimg.length, 0);

console.log('\n── помощник отрабатывает запасной вариант ──');
t('без фото — эмодзи', /^<div class="tea-emoji">🍵</.test(w.thumb({id:999999,emoji:'🍵',name:'X'})), true);
t('с фото — картинка', /<img /.test(w.thumb(w.TEAS.find(x=>x.art==='DHP-100'))), true);

console.log(`\n${fail?'❌':'✅'} пройдено ${pass}, провалено ${fail}\n`);
process.exit(fail?1:0);
