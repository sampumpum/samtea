const fs=require('fs');const path=require('path');
const REPO=path.join(__dirname,'..');
let pass=0,fail=0;
const t=(n,got,want)=>{const ok=String(got)===String(want);ok?pass++:fail++;
 console.log(`${ok?'  ok  ':'  FAIL'} ${n}${ok?'':`\n         получил: ${got}\n         ожидал:  ${want}`}`);};

console.log('\n── длинных тире быть не должно нигде ──');
for (const f of ['inventory.json','data.js','app.js','index.html']) {
  const s=fs.readFileSync(path.join(REPO,f),'utf8');
  const em=(s.match(/—/g)||[]).length, en=(s.match(/–/g)||[]).length;
  t(`${f}: em dash`, em, 0);
  t(`${f}: en dash`, en, 0);
}

console.log('\n── описания без выдумок ──');
const inv=JSON.parse(fs.readFileSync(path.join(REPO,'inventory.json'),'utf8'));
// «легендарный» как пустое усиление - плохо. «отсылка к легенде» про имя чая - можно.
const MYTH=/легендарн|по преданию|говорят, что|древнее предание/i;
const mythy=inv.teas.filter(x=>MYTH.test(x.quote||'')||MYTH.test(x.desc||'')).map(x=>x.art);
t('нет легенд и мифов', mythy.length?mythy.join(', '):0, 0);
const HYPE=/уникальн|непревзойд|восхитительн|божественн|шедевр/i;
const hypey=inv.teas.filter(x=>HYPE.test(x.quote||'')||HYPE.test(x.desc||'')).map(x=>x.art);
t('нет превосходных степеней', hypey.length?hypey.join(', '):0, 0);

console.log('\n── три новых чая заполнены ──');
for (const a of ['LGTTS-5','LGTTS-3','BMS-24']) {
  const x=inv.teas.find(y=>y.art===a);
  t(`${a}: цитата от первого лица`, /^Я - /.test(x.quote), true);
  t(`${a}: есть блок заваривания`, !!(x.brew&&x.brew.t&&x.brew.g), true);
}
const bm=inv.teas.find(y=>y.art==='BMS-24');
t('Бай Мудань: сухой лист это травы', /Сухой лист.*лугов/i.test(bm.quote), true);
t('Бай Мудань: баня при заваривании', /Баня начинается, когда/.test(bm.quote), true);

console.log(`\n${fail?'❌':'✅'} пройдено ${pass}, провалено ${fail}\n`);
process.exit(fail?1:0);
