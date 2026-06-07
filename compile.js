#!/usr/bin/env node
/**
 * compile.js — генерирует data.js из inventory.json
 *
 * Запуск: node compile.js
 *
 * Что делает:
 * 1. Читает inventory.json
 * 2. Фильтрует чаи с available: true
 * 3. Убирает поля _admin и _comment (служебные, не нужны в боте)
 * 4. Записывает data.js в нужном формате
 */

const fs = require('fs');
const path = require('path');

const INV_PATH = path.join(__dirname, 'inventory.json');
const OUT_PATH = path.join(__dirname, 'data.js');

// Читаем inventory.json
let inv;
try {
  inv = JSON.parse(fs.readFileSync(INV_PATH, 'utf-8'));
} catch (e) {
  console.error('❌ Ошибка чтения inventory.json:', e.message);
  process.exit(1);
}

// Очищаем служебные поля
function cleanTea(tea) {
  const clean = {};
  for (const [k, v] of Object.entries(tea)) {
    if (k.startsWith('_')) continue; // _admin, _comment и т.д.
    if (k === 'available') continue; // служебное поле
    if (k === 'photos') continue;    // фото пока в отдельной папке, не в data.js
    clean[k] = v;
  }
  return clean;
}

// Фильтруем только доступные чаи
const teas = inv.teas
  .filter(t => t.id && t.available === true)
  .map(cleanTea);

// Фильтруем только доступные наборы
const sets = (inv.sets || [])
  .filter(s => s.available === true)
  .map(s => {
    const { available, ...rest } = s;
    return rest;
  });

const payment = inv.payment;

// Сериализация JS-объектов (без кавычек у ключей, одинарные кавычки у строк)
function serialize(val, indent = 0) {
  const pad = '  '.repeat(indent);
  const pad1 = '  '.repeat(indent + 1);

  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') {
    return "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    // Короткие массивы примитивов — в одну строку
    const allPrimitive = val.every(v => typeof v !== 'object' || v === null);
    if (allPrimitive && val.length <= 6) {
      return '[' + val.map(v => serialize(v, 0)).join(', ') + ']';
    }
    // Массив объектов (sizes) — каждый объект в одну строку
    if (val.every(v => typeof v === 'object' && !Array.isArray(v) && v !== null)) {
      const items = val.map(v => {
        const pairs = Object.entries(v).map(([k, vv]) => `${k}: ${serialize(vv, 0)}`);
        return `{${pairs.join(', ')}}`;
      });
      return `[${items.join(', ')}]`;
    }
    return '[\n' + val.map(v => pad1 + serialize(v, indent + 1)).join(',\n') + '\n' + pad + ']';
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val);
    if (entries.length === 0) return '{}';
    const pairs = entries.map(([k, v]) => `${k}: ${serialize(v, indent + 1)}`);
    return '{\n' + pairs.map(p => pad1 + p).join(',\n') + '\n' + pad + '}';
  }
  return String(val);
}

// Генерируем строки для TEAS
const teasStr = teas.map(tea => {
  const pairs = Object.entries(tea).map(([k, v]) => `${k}: ${serialize(v, 0)}`);
  return '{\n' + pairs.map(p => `  ${p}`).join(',\n') + '\n}';
}).join(',\n');

// Генерируем строки для SETS
const setsStr = sets.map(s => {
  const pairs = Object.entries(s).map(([k, v]) => `${k}: ${serialize(v, 0)}`);
  return '{\n' + pairs.map(p => `  ${p}`).join(',\n') + '\n}';
}).join(',\n');

// Генерируем PAYMENT
const paymentPairs = Object.entries(payment).map(([k, v]) => `  ${k}: ${serialize(v, 0)}`);
const paymentStr = paymentPairs.join(',\n');

// Итоговый файл
const output = `// ВНИМАНИЕ: этот файл генерируется автоматически из inventory.json
// Не редактируй data.js вручную — изменения будут перезаписаны.
// Редактируй inventory.json и запусти: node compile.js

const TEAS = [
${teasStr}
];

const SETS = [
${setsStr}
];

// ← Сэм, заполни свои данные в inventory.json → payment:
const PAYMENT = {
${paymentStr}
};
`;

fs.writeFileSync(OUT_PATH, output, 'utf-8');

console.log(`✅ data.js обновлён`);
console.log(`   Чаёв в боте: ${teas.length}`);
console.log(`   Наборов: ${sets.length}`);
console.log(`   Отключено (available: false): ${inv.teas.filter(t => !t.available && !t._comment).length}`);
console.log('');

// Показываем что отключено
const disabled = inv.teas.filter(t => t.id && t.available !== true);
if (disabled.length > 0) {
  console.log('📦 Отключённые позиции (включи в inventory.json когда готово):');
  disabled.forEach(t => {
    const note = t._admin?.notes ? ` — ${t._admin.notes}` : '';
    console.log(`   • [${t.id}] ${t.name}${note}`);
  });
}
