// SAM TEA Mini App
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let cart = [];
let currentTea = null;
let currentCat = 'all';

// ── RENDER ENGINE ─────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { 'screen-main': 0, 'screen-mood': 1, 'screen-search': 2, 'screen-cart': 3 };
  if (navMap[id] !== undefined) document.querySelectorAll('.nav-item')[navMap[id]]?.classList.add('active');
}

function updateCartBadge() {
  const btn = document.getElementById('cart-nav-btn');
  const cartBtn = document.getElementById('header-cart');
  const count = cart.length;
  if (btn) { btn.textContent = count > 0 ? `Корзина (${count})` : 'Корзина'; }
  if (cartBtn) {
    cartBtn.innerHTML = `<i class="ti ti-shopping-bag"></i> ${count > 0 ? count : ''}`;
    cartBtn.className = 'cart-btn' + (count > 0 ? ' has-items' : '');
  }
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────

function renderMain() {
  document.getElementById('app').innerHTML = `
    <div class="screen active" id="screen-main">
      <div class="header">
        <div>
          <div class="logo">SAM <em>TEA</em></div>
          <div class="header-sub">Китайский чай с характером</div>
        </div>
        <button class="cart-btn" id="header-cart" onclick="renderCart(); showScreen('screen-cart')">
          <i class="ti ti-shopping-bag"></i>
        </button>
      </div>
      <div class="scroll">
        <div class="mood-banner" onclick="renderMood(); showScreen('screen-mood')">
          <div class="mood-label">Подобрать чай</div>
          <div class="mood-title">Какое сейчас настроение?</div>
          <div class="mood-chips">
            <div class="mood-chip">🥶 Холодно</div>
            <div class="mood-chip">☀️ Жарко</div>
            <div class="mood-chip">🧘 Расслабиться</div>
            <div class="mood-chip">⚡ Взбодриться</div>
          </div>
        </div>

        <div class="specials">
          <div class="special-card" onclick="showDetail(1)">
            <div class="special-badge">☕ Сегодня</div>
            <div class="special-title">Чай дня</div>
            <div class="special-sub">Лао Ча Тоу 2005</div>
          </div>
          <div class="special-card" onclick="renderSets(); showScreen('screen-sets')">
            <div class="special-badge">🎁 Выгодно</div>
            <div class="special-title">Сет дня</div>
            <div class="special-sub">3 × 25г · от 760 ₽</div>
          </div>
        </div>

        <div class="section-label">Каталог</div>
        <div class="cats" id="cat-pills">
          ${[
            ['all','Все'], ['shu','Шу пуэр'], ['red','Красный'],
            ['ulung','Улун'], ['gaba','ГАБА'], ['green','Зелёный'],
            ['white','Белый']
          ].map(([c,l]) => `<div class="cat-pill${currentCat===c?' active':''}" onclick="filterCat('${c}',this)">${l}</div>`).join('')}
        </div>
        <div class="tea-list" id="tea-list"></div>
      </div>
      ${renderNav(0)}
    </div>
    ${renderScreenShells()}
  `;
  renderTeaList(currentCat);
  updateCartBadge();
}

function renderScreenShells() {
  return `
    <div class="screen" id="screen-detail"></div>
    <div class="screen" id="screen-mood"></div>
    <div class="screen" id="screen-cart"></div>
    <div class="screen" id="screen-search"></div>
    <div class="screen" id="screen-sets"></div>
  `;
}

function renderNav(active) {
  const items = [
    ['screen-main', 'ti-home', 'Главная', 'renderMain(); showScreen(\'screen-main\')'],
    ['screen-mood', 'ti-mood-happy', 'Подбор', 'renderMood(); showScreen(\'screen-mood\')'],
    ['screen-search', 'ti-search', 'Поиск', 'renderSearch(); showScreen(\'screen-search\')'],
    ['screen-cart', 'ti-shopping-bag', 'Корзина', 'renderCart(); showScreen(\'screen-cart\')', 'cart-nav-btn'],
  ];
  return `<div class="bottom-nav">${items.map((item, i) =>
    `<button class="nav-item${i===active?' active':''}" onclick="${item[3]}" ${item[4]?`id="${item[4]}"`:''}><i class="ti ${item[1]}"></i>${item[4]?`<span id="${item[4]}">${i===3&&cart.length>0?`Корзина (${cart.length})`:'Корзина'}</span>`:item[2]}</button>`
  ).join('')}</div>`;
}

function renderTeaList(cat) {
  const list = document.getElementById('tea-list');
  if (!list) return;
  const filtered = cat === 'all' ? TEAS : TEAS.filter(t => t.cat === cat);
  list.innerHTML = filtered.map(t => `
    <div class="tea-card" onclick="showDetail(${t.id})">
      <div class="tea-emoji">${t.emoji}</div>
      <div class="tea-info">
        <div class="tea-name">${t.name}</div>
        <div class="tea-cn">${t.subtitle}</div>
        <div class="tea-tags">
          ${t.tags.slice(0,2).map(tg => `<span class="tag">${tg}</span>`).join('')}
          ${t.status === 'wb' ? '<span class="tag wb">WB</span>' : ''}
        </div>
      </div>
      <div class="tea-right">
        <div class="tea-price">${t.price} ₽</div>
        <div class="tea-weight">${t.weight}</div>
      </div>
    </div>
  `).join('') || '<div style="color:var(--text3);padding:20px;text-align:center;font-size:13px">Скоро появятся</div>';
}

function filterCat(cat, el) {
  currentCat = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  renderTeaList(cat);
}

// ── DETAIL ────────────────────────────────────────────────────────────────────

function showDetail(id) {
  currentTea = TEAS.find(t => t.id === id);
  if (!currentTea) return;
  const t = currentTea;
  const el = document.getElementById('screen-detail');
  const isWB = t.status === 'wb';

  el.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="showScreen('screen-main')">
        <i class="ti ti-arrow-left"></i> Назад
      </button>
      <div style="font-size:11px;color:var(--text3)">${t.cn}</div>
    </div>
    <div class="detail-hero">${t.emoji}</div>
    <div class="detail-scroll">
      <div class="detail-name">${t.name}</div>
      <div class="detail-cn">${t.subtitle} · ${t.cn}</div>
      <div class="price-row">
        <div class="detail-price">${t.price} ₽</div>
        <div class="detail-weight">${t.weight}</div>
      </div>
      <div class="status-row">
        <div class="dot ${isWB ? 'dot-blue' : 'dot-green'}"></div>
        <div class="status-text">${isWB ? 'Доступен на Wildberries' : 'Есть в наличии'}</div>
      </div>
      <div class="quote-block">${t.quote}</div>
      <div class="brew-label">Как заваривать</div>
      <div class="brew-grid">
        <div class="brew-cell"><div class="brew-val">${t.brew.g}</div><div class="brew-key">на 150мл</div></div>
        <div class="brew-cell"><div class="brew-val">${t.brew.t}</div><div class="brew-key">вода</div></div>
        <div class="brew-cell"><div class="brew-val">${t.brew.s}</div><div class="brew-key">1й пролив</div></div>
        <div class="brew-cell"><div class="brew-val">${t.brew.prolivs}</div><div class="brew-key">проливов</div></div>
      </div>
      ${t.coldBrew ? `<div class="cold-brew-badge"><i class="ti ti-snowflake"></i>Подходит для холодного заваривания (6ч в холодильнике)</div>` : ''}
      <div class="detail-tags">${t.tags.map(tg => `<span class="detail-tag">${tg}</span>`).join('')}</div>
      ${t.desc ? `<div style="font-size:13px;color:var(--text2);line-height:1.65">${t.desc}</div>` : ''}
    </div>
    <div class="action-bar">
      ${isWB
        ? `<button class="btn-secondary" onclick="window.open('${t.wb}','_blank')"><i class="ti ti-external-link"></i> Купить на Wildberries</button>`
        : `<button class="btn-primary" onclick="addToCart(${t.id})">В корзину — ${t.price} ₽</button>`
      }
    </div>
  `;
  showScreen('screen-detail');
}

// ── CART ──────────────────────────────────────────────────────────────────────

function addToCart(id) {
  const tea = TEAS.find(t => t.id === id);
  if (!tea) return;
  cart.push({ ...tea, cartId: Date.now() });
  updateCartBadge();
  renderCart();
  showScreen('screen-cart');
}

function removeFromCart(cartId) {
  cart = cart.filter(i => i.cartId !== cartId);
  updateCartBadge();
  renderCart();
}

function renderCart() {
  const el = document.getElementById('screen-cart');
  const total = cart.reduce((s, i) => s + i.price, 0);
  el.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="showScreen('screen-main')"><i class="ti ti-arrow-left"></i> Назад</button>
      <div class="logo">Корзина</div>
    </div>
    ${cart.length === 0
      ? `<div class="cart-empty"><i class="ti ti-shopping-bag"></i><div style="font-size:14px">Корзина пуста</div><div style="font-size:12px">Добавьте чай из каталога</div></div>`
      : `<div class="cart-items">${cart.map(i => `
          <div class="tea-card" style="cursor:default">
            <div class="tea-emoji">${i.emoji}</div>
            <div class="tea-info">
              <div class="tea-name">${i.name}</div>
              <div class="tea-cn">${i.weight}</div>
            </div>
            <div class="tea-right">
              <div class="tea-price">${i.price} ₽</div>
              <button onclick="removeFromCart(${i.cartId})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:0;margin-top:4px"><i class="ti ti-x"></i></button>
            </div>
          </div>`).join('')}
        </div>
        <div class="cart-total"><span class="cart-total-label">Итого</span><span class="cart-total-sum">${total} ₽</span></div>`
    }
    <div class="action-bar">
      <button class="btn-primary" onclick="checkout()" ${cart.length === 0 ? 'disabled style="opacity:0.4"' : ''}>Оформить заказ${cart.length > 0 ? ` — ${total} ₽` : ''}</button>
    </div>
  `;
}

function checkout() {
  if (cart.length === 0) return;
  const total = cart.reduce((s, i) => s + i.price, 0);
  const items = cart.map(i => `• ${i.name} ${i.weight} — ${i.price} ₽`).join('\n');
  const msg = `🛒 Новый заказ SAM TEA\n\n${items}\n\nИтого: ${total} ₽\n\nДоставка или самовывоз?`;
  if (tg) {
    tg.sendData(JSON.stringify({ type: 'order', items: cart.map(i => ({ id: i.id, name: i.name, price: i.price })), total }));
  } else {
    alert(msg);
  }
}

// ── MOOD FLOW ─────────────────────────────────────────────────────────────────

const MOOD_FLOW = {
  start: {
    q: 'Какая сейчас погода?',
    opts: [
      { icon: '🥶', text: 'Холодно', sub: 'Хочется согреться', next: 'cold' },
      { icon: '😊', text: 'Тепло и комфортно', sub: 'Обычный день', next: 'warm' },
      { icon: '🌞', text: 'Жарко', sub: 'Хочется освежиться', next: 'hot' },
    ]
  },
  cold: {
    q: 'Что хочется сейчас?',
    opts: [
      { icon: '⚡', text: 'Взбодриться', sub: 'Зарядиться энергией', result: [2, 1] },
      { icon: '🧘', text: 'Расслабиться', sub: 'Отдохнуть после дня', result: [1, 11] },
      { icon: '🍫', text: 'Что-то тёмное, глубокое', sub: 'Насыщенный вкус', result: [2, 1] },
    ]
  },
  warm: {
    q: 'Какой вкус сегодня?',
    opts: [
      { icon: '🌸', text: 'Цветочное, нежное', sub: 'Лёгкость и аромат', result: [9, 6] },
      { icon: '🪨', text: 'Глубокое, минеральное', sub: 'Характерный вкус', result: [7, 8] },
      { icon: '🌅', text: 'Медовое, сладкое', sub: 'Тёплый уют', result: [3, 4] },
    ]
  },
  hot: {
    q: 'Как будешь пить?',
    opts: [
      { icon: '🧊', text: 'Холодное заваривание', sub: 'В холодильник на ночь', result: [13, 9] },
      { icon: '🌿', text: 'Горячий, но лёгкий', sub: 'Не тяжёлый', result: [13, 10] },
      { icon: '✨', text: 'Попробовать что-то новое', sub: 'Удиви меня', result: [11, 5] },
    ]
  },
};

function renderMood(step = 'start') {
  const el = document.getElementById('screen-mood');
  const flow = MOOD_FLOW[step];
  el.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="${step === 'start' ? "showScreen('screen-main')" : "renderMood('start')"}">
        <i class="ti ti-arrow-left"></i> ${step === 'start' ? 'Назад' : 'Заново'}
      </button>
    </div>
    <div class="scroll">
      <div class="mood-flow">
        <div class="flow-q">${flow.q}</div>
        <div class="flow-options">
          ${flow.opts.map(o => `
            <div class="flow-option" onclick="${o.next ? `renderMood('${o.next}')` : `showMoodResult(${JSON.stringify(o.result)})`}">
              <div class="flow-icon">${o.icon}</div>
              <div class="flow-text">
                <div>${o.text}</div>
                <div class="flow-sub">${o.sub}</div>
              </div>
              <i class="ti ti-chevron-right" style="color:var(--text3);font-size:16px"></i>
            </div>`).join('')}
        </div>
      </div>
    </div>
    ${renderNav(1)}
  `;
}

function showMoodResult(ids) {
  const el = document.getElementById('screen-mood');
  const teas = ids.map(id => TEAS.find(t => t.id === id)).filter(Boolean);
  el.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="renderMood()"><i class="ti ti-arrow-left"></i> Ещё раз</button>
    </div>
    <div class="scroll">
      <div class="mood-flow">
        <div class="flow-q">Вот что тебе подойдёт</div>
        ${teas.map(t => `
          <div class="result-card" onclick="showDetail(${t.id})">
            <div class="result-top">
              <div class="result-emoji">${t.emoji}</div>
              <div><div class="result-name">${t.name}</div><div class="result-cn">${t.subtitle}</div></div>
            </div>
            <div class="result-quote">${t.quote.slice(0, 100)}...</div>
            <div class="result-footer">
              <span class="result-price">${t.price} ₽</span>
              <span class="result-weight">${t.weight}</span>
            </div>
          </div>`).join('')}
        <button class="retry-btn" onclick="renderMood()">Попробовать другой подбор</button>
      </div>
    </div>
    ${renderNav(1)}
  `;
}

// ── SEARCH ────────────────────────────────────────────────────────────────────

function renderSearch() {
  const el = document.getElementById('screen-search');
  el.innerHTML = `
    <div class="search-wrap">
      <button class="search-back" onclick="showScreen('screen-main')"><i class="ti ti-arrow-left"></i></button>
      <input type="text" id="search-input" placeholder="Найти чай..." autofocus oninput="doSearch(this.value)">
    </div>
    <div class="search-results" id="search-results">
      <div class="no-results" style="padding-top:30px;color:var(--text3)">Начни вводить название</div>
    </div>
    ${renderNav(2)}
  `;
  setTimeout(() => document.getElementById('search-input')?.focus(), 100);
}

function doSearch(q) {
  const res = document.getElementById('search-results');
  if (!res) return;
  if (!q.trim()) { res.innerHTML = ''; return; }
  const qLow = q.toLowerCase();
  const found = TEAS.filter(t =>
    t.name.toLowerCase().includes(qLow) ||
    t.subtitle.toLowerCase().includes(qLow) ||
    t.cn.includes(q) ||
    t.tags.some(tg => tg.toLowerCase().includes(qLow))
  );
  res.innerHTML = found.length
    ? `<div class="tea-list">${found.map(t => `
        <div class="tea-card" onclick="showDetail(${t.id})">
          <div class="tea-emoji">${t.emoji}</div>
          <div class="tea-info">
            <div class="tea-name">${t.name}</div>
            <div class="tea-cn">${t.subtitle}</div>
            <div class="tea-tags">${t.tags.slice(0,2).map(tg=>`<span class="tag">${tg}</span>`).join('')}</div>
          </div>
          <div class="tea-right"><div class="tea-price">${t.price} ₽</div></div>
        </div>`).join('')}</div>`
    : '<div class="no-results">Ничего не найдено</div>';
}

// ── SETS ──────────────────────────────────────────────────────────────────────

function renderSets() {
  const el = document.getElementById('screen-sets');
  el.innerHTML = `
    <div class="header">
      <button class="back-btn" onclick="showScreen('screen-main')"><i class="ti ti-arrow-left"></i> Назад</button>
      <div class="logo">Сеты</div>
    </div>
    <div class="scroll">
      <div style="margin-bottom:14px">
        ${SETS.map(s => `
          <div class="set-card">
            <div class="set-emoji">${s.emoji}</div>
            <div class="set-info">
              <div class="set-name">${s.name}</div>
              <div class="set-sub">${s.subtitle} · ${s.weight}</div>
              <div class="set-price">${s.price} ₽</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="section-label">Чаи в сетах</div>
      ${SETS.map(s => s.teas.map(id => TEAS.find(t => t.id === id)).filter(Boolean).map(t => `
        <div class="tea-card" onclick="showDetail(${t.id})">
          <div class="tea-emoji">${t.emoji}</div>
          <div class="tea-info">
            <div class="tea-name">${t.name}</div>
            <div class="tea-cn">${t.subtitle}</div>
          </div>
          <div class="tea-right"><div class="tea-price">${t.price} ₽</div></div>
        </div>`).join('')).join('')}
    </div>
    ${renderNav(-1)}
  `;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
renderMain();
