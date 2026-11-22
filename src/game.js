import { SDK, CONFIG } from './sdk.js?v=20261122b';
import { t, pack, langFlag, nextLang, setLang } from './i18n.js?v=20261122b';

const Engine = window.LumenEngine;
const startEl = document.getElementById('start');
const playEl = document.getElementById('play');
const endEl = document.getElementById('end');
const shopEl = document.getElementById('shop');
const plateEl = document.getElementById('plate');
const cellsEl = document.getElementById('cells');
const boardEl = document.getElementById('board');
const fxEl = document.getElementById('fx');
const toastEl = document.getElementById('toast');
const nightsEl = document.getElementById('nights');
const coinsEl = document.getElementById('coins');
const langEl = document.getElementById('lang');
const shopBtn = document.getElementById('open-shop');
const freeBtn = document.getElementById('free');

const ICONS = {
  fern: '<svg viewBox="0 0 64 64"><path d="M32 52V14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M32 22c-7-1-13 2-15 8 6 0 10-2 15-8zm0 9c-8 1-14 6-15 12 7-1 11-5 15-12zm0 9c-7 1-12 6-12 12 6-2 9-6 12-12zM32 22c7-1 13 2 15 8-6 0-10-2-15-8zm0 9c8 1 14 6 15 12-7-1-11-5-15-12zm0 9c7 1 12 6 12 12-6-2-9-6-12-12z" fill="currentColor"/></svg>',
  beetle: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="36" rx="12" ry="15" fill="currentColor"/><circle cx="32" cy="20" r="6" fill="currentColor"/><path d="M32 22v26M22 16l-8-6M42 16l8-6M18 34l-8 2M46 34l8 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  moss: '<svg viewBox="0 0 64 64"><circle cx="32" cy="34" r="8" fill="currentColor"/><circle cx="22" cy="28" r="6" fill="currentColor"/><circle cx="42" cy="28" r="6" fill="currentColor"/><circle cx="24" cy="42" r="5" fill="currentColor"/><circle cx="40" cy="42" r="5" fill="currentColor"/></svg>',
  pearl: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="32" cy="32" r="6" fill="currentColor"/><circle cx="26" cy="26" r="2" fill="currentColor"/></svg>',
  vine: '<svg viewBox="0 0 64 64"><path d="M18 50c8-4 10-14 8-22 6 2 14 0 20-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M26 40c-6 1-10 6-10 6 4 2 10 0 12-4zM30 28c-6-2-8-8-8-8 5 0 9 3 10 8zM40 24c2-6 8-8 8-8-1 6-4 9-8 10z" fill="currentColor"/></svg>',
  glass: '<svg viewBox="0 0 64 64"><path d="M18 14h28v30c0 8-6 12-14 12s-14-4-14-12z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M24 14c2 8 14 8 16 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
};

let state = null;
let busy = false;
let selected = null;
let pointer = null;
let hintTimer = 0;
let toastTimer = 0;
let buying = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 1400);
}

function refreshCoins() {
  coinsEl.textContent = String(SDK.data.coins);
}

function syncFree() {
  const left = Math.ceil((SDK.data.giftAt - Date.now()) / 1000);
  if (left > 0) {
    freeBtn.textContent = t('wait', { n: left });
    freeBtn.disabled = true;
  } else {
    freeBtn.textContent = t('freeCoins', { n: CONFIG.balance.freeCoinsReward });
    freeBtn.disabled = false;
  }
}

function applyCopy() {
  document.documentElement.lang = langFlag().toLowerCase();
  document.title = t('title');
  document.getElementById('eyebrow').textContent = t('eyebrow');
  document.getElementById('title').textContent = t('title');
  document.getElementById('lead').textContent = t('lead');
  document.getElementById('rule1').textContent = t('rule1');
  document.getElementById('rule2').textContent = t('rule2');
  document.getElementById('rule3').textContent = t('rule3');
  document.getElementById('enter').textContent = t('enter');
  shopBtn.textContent = t('shop');
  langEl.textContent = langFlag();
  refreshCoins();
  syncFree();
  renderNights();
  if (state && !playEl.hidden) renderHud();
}

function renderNights() {
  const p = pack();
  nightsEl.innerHTML = '';
  Engine.LEVELS.forEach((level) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'night' + (SDK.data.cleared[level.id] ? ' done' : '');
    button.innerHTML = '<b>' + p.nights[level.id] + '</b><span>' + p.names[level.id] + '</span>';
    button.addEventListener('click', () => begin(level.id));
    nightsEl.appendChild(button);
  });
}

function goalRow(goal, hud) {
  const p = pack();
  if (goal.kind === 'collect') {
    const have = hud.collected[goal.tile] || 0;
    return (
      '<li class="goal' + (have >= goal.count ? ' met' : '') +
      '"><span class="pip tile-' + goal.tile + '">' + ICONS[goal.tile] +
      '</span><span>' + p.tiles[goal.tile] + '</span><em>' +
      Math.min(have, goal.count) + '/' + goal.count + '</em></li>'
    );
  }
  const have = hud.glassCleared;
  return (
    '<li class="goal' + (have >= goal.count ? ' met' : '') +
    '"><span class="pip">' + ICONS.glass + '</span><span>' + t('frost') +
    '</span><em>' + Math.min(have, goal.count) + '/' + goal.count + '</em></li>'
  );
}

function spend(cost) {
  if (SDK.data.coins < cost) {
    toast(t('noCoins'));
    return false;
  }
  SDK.data.coins -= cost;
  SDK.persist(true);
  refreshCoins();
  return true;
}

function renderHud(hud) {
  const data = hud || {
    collected: state.collected,
    score: state.score,
    glassCleared: state.glassCleared,
    movesLeft: state.movesLeft
  };
  const p = pack();
  const B = CONFIG.balance;
  plateEl.innerHTML =
    '<p class="eyebrow">' + p.nights[state.levelId] + '</p><h2>' + p.names[state.levelId] +
    '</h2><p class="story">' + p.lines[state.levelId] +
    '</p><div class="moves' + (data.movesLeft <= 5 ? ' low' : '') +
    '"><div><strong>' + data.movesLeft + '</strong></div><span>' + t('moves') +
    '</span></div><ul class="goals">' +
    state.goals.map((goal) => goalRow(goal, data)).join('') +
    '</ul><p class="score-line">' + t('light') + ': ' + data.score +
    '</p><div class="boosters">' +
    '<button class="ghost slim" type="button" id="hint">' + t('hint') + ' ' + B.hintCost + '</button>' +
    '<button class="ghost slim" type="button" id="shuffle">' + t('shuffle') + ' ' + B.shuffleCost + '</button>' +
    '</div><div class="plate-actions"><button class="ghost" type="button" id="back">' + t('garden') +
    '</button><button class="ghost" type="button" id="retry">' + t('retry') + '</button></div>';
  document.getElementById('back').addEventListener('click', showStart);
  document.getElementById('retry').addEventListener('click', () => begin(state.levelId));
  document.getElementById('hint').addEventListener('click', useHint);
  document.getElementById('shuffle').addEventListener('click', useShuffle);
}

function tileNode(cell, dist) {
  const p = pack();
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tile tile-' + cell.tile + (cell.power ? ' power power-' + cell.power : '');
  button.dataset.id = String(cell.id);
  button.dataset.tile = cell.tile;
  button.setAttribute('aria-label', p.ones[cell.tile] || cell.tile);
  button.innerHTML = '<span class="gem">' + ICONS[cell.tile] + '</span>';
  if (dist) {
    button.classList.add('spawn');
    button.style.setProperty('--drop', String(dist));
  }
  return button;
}

function glassNode(cell) {
  const node = document.createElement('div');
  node.className = 'glass';
  node.dataset.gid = String(cell.id);
  node.dataset.hp = String(cell.hp);
  node.innerHTML = '<svg class="cracks" viewBox="0 0 40 40"><path d="M8 6 L18 20 L10 34"/><path d="M30 8 L20 18 L32 30"/></svg>';
  return node;
}

function renderBoard(grid, spawns) {
  const spawnDist = new Map((spawns || []).map((item) => [String(item.id), item.dist]));
  cellsEl.innerHTML = '';
  boardEl.style.setProperty('--cols', String(grid[0].length));
  const cell = cellsEl.getBoundingClientRect();
  const step = cell.width ? (cell.width - 7 * (grid[0].length - 1)) / grid[0].length + 7 : 56;
  boardEl.style.setProperty('--step', step + 'px');
  grid.forEach((row, r) => {
    row.forEach((item, c) => {
      const wrap = document.createElement('div');
      wrap.className = 'cell';
      wrap.dataset.r = String(r);
      wrap.dataset.c = String(c);
      if (item && item.kind === 'tile') wrap.appendChild(tileNode(item, spawnDist.get(String(item.id))));
      if (item && item.kind === 'glass') wrap.appendChild(glassNode(item));
      cellsEl.appendChild(wrap);
    });
  });
  if (selected) {
    const tile = cellTile(selected.r, selected.c);
    if (tile) tile.classList.add('selected');
  }
}

function cellTile(r, c) {
  const wrap = cellsEl.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]');
  return wrap ? wrap.querySelector('.tile') : null;
}

function capture() {
  const map = new Map();
  cellsEl.querySelectorAll('[data-id]').forEach((el) => {
    map.set(el.dataset.id, el.getBoundingClientRect());
  });
  return map;
}

function flip(prev) {
  cellsEl.querySelectorAll('[data-id]').forEach((el) => {
    if (el.classList.contains('spawn')) return;
    const old = prev.get(el.dataset.id);
    if (!old) return;
    const next = el.getBoundingClientRect();
    const dx = old.left - next.left;
    const dy = old.top - next.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    el.style.transition = 'none';
    el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    void el.offsetWidth;
    el.style.transition = 'transform 380ms cubic-bezier(0.16, 0.84, 0.28, 1)';
    el.style.transform = '';
  });
}

function spark(el) {
  const board = boardEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const x = rect.left - board.left + rect.width / 2;
  const y = rect.top - board.top + rect.height / 2;
  const color = getComputedStyle(el).getPropertyValue('--glow').trim() || '#fff6d8';
  for (let i = 0; i < 6; i++) {
    const node = document.createElement('i');
    node.className = 'spark';
    const angle = (Math.PI * 2 * i) / 6;
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    node.style.background = color;
    node.style.setProperty('--dx', Math.cos(angle) * 28 + 'px');
    node.style.setProperty('--dy', Math.sin(angle) * 28 + 'px');
    fxEl.appendChild(node);
    setTimeout(() => node.remove(), 520);
  }
  const ring = document.createElement('i');
  ring.className = 'ring';
  ring.style.left = x + 'px';
  ring.style.top = y + 'px';
  fxEl.appendChild(ring);
  setTimeout(() => ring.remove(), 500);
}

function floatText(text, el) {
  const board = boardEl.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const node = document.createElement('span');
  node.className = 'floater';
  node.textContent = text;
  node.style.left = rect.left - board.left + rect.width / 2 + 'px';
  node.style.top = rect.top - board.top + 'px';
  fxEl.appendChild(node);
  setTimeout(() => node.remove(), 720);
}

function clearHint() {
  clearTimeout(hintTimer);
  cellsEl.querySelectorAll('.hint').forEach((el) => el.classList.remove('hint'));
}

function armHint() {
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    if (busy || !state) return;
    const move = Engine.suggestMove(state);
    if (!move) return;
    [cellTile(move.r1, move.c1), cellTile(move.r2, move.c2)].forEach((el) => {
      if (el) el.classList.add('hint');
    });
  }, 4500);
}

function useHint() {
  if (busy || !state) return;
  if (!spend(CONFIG.balance.hintCost)) return;
  clearHint();
  const move = Engine.suggestMove(state);
  if (!move) return;
  [cellTile(move.r1, move.c1), cellTile(move.r2, move.c2)].forEach((el) => {
    if (el) el.classList.add('hint');
  });
}

async function useShuffle() {
  if (busy || !state) return;
  if (!spend(CONFIG.balance.shuffleCost)) return;
  busy = true;
  const shuffled = Engine.shuffleTiles(state);
  const before = capture();
  state = shuffled.state;
  renderBoard(state.grid);
  flip(before);
  toast(t('shuffled'));
  await wait(380);
  busy = false;
  armHint();
}

async function playFrames(frames) {
  for (const frame of frames) {
    if (frame.type === 'clear') {
      let anchor = null;
      frame.popIds.forEach((id) => {
        const el = cellsEl.querySelector('[data-id="' + id + '"]');
        if (!el) return;
        el.classList.add('pop');
        spark(el);
        if (!anchor) anchor = el;
      });
      if (frame.powerUp) {
        const el = cellsEl.querySelector('[data-id="' + frame.powerUp.id + '"]');
        if (el) {
          el.classList.add('awaken', 'power', 'power-' + frame.powerUp.power);
          anchor = anchor || el;
        }
      }
      frame.cracks.forEach((crack) => {
        const el = cellsEl.querySelector('[data-gid="' + crack.id + '"]');
        if (!el) return;
        el.dataset.hp = String(Math.max(0, crack.hp));
        el.classList.add('hit');
        if (crack.hp <= 0) el.classList.add('shatter');
      });
      if (anchor && frame.gained) floatText('+' + frame.gained, anchor);
      if (frame.combo >= 2 && anchor) floatText(String(frame.combo) + '×', anchor);
      document.body.classList.toggle('is-flaring', frame.combo >= 2);
      renderHud(frame.hud);
      await wait(260);
    } else if (frame.type === 'fall') {
      const prev = capture();
      renderBoard(frame.grid, frame.spawns);
      flip(prev);
      renderHud(frame.hud);
      await wait(400);
    }
  }
  document.body.classList.remove('is-flaring');
}

function showEnd(won) {
  const last = state.levelId === Engine.LEVELS.length;
  if (won) {
    SDK.data.cleared[state.levelId] = true;
    SDK.data.best = Math.max(SDK.data.best || 0, state.score);
    SDK.data.games += 1;
    SDK.persist(true);
  } else {
    SDK.data.games += 1;
    SDK.persist(true);
  }
  const B = CONFIG.balance;
  endEl.hidden = false;
  endEl.innerHTML =
    '<div class="end-card"><p class="eyebrow">' + pack().nights[state.levelId] + '</p><h3>' +
    (won ? (last ? t('winLast') : t('win')) : t('lose')) + '</h3><p>' +
    (won ? (last ? t('winLastText') : t('winText')) : t('loseText')) +
    '</p><div class="end-actions">' +
    (won && !last ? '<button class="btn" type="button" id="next">' + t('next') + '</button>' : '') +
    (!won ? '<button class="btn" type="button" id="more">' + t('extraMoves') + ' ' + B.extraMovesCost + '</button>' : '') +
    '<button class="' + (won && !last ? 'ghost' : 'btn') + '" type="button" id="again">' + t('again') +
    '</button><button class="ghost" type="button" id="garden">' + t('garden') + '</button></div></div>';
  const next = document.getElementById('next');
  if (next) next.addEventListener('click', () => begin(state.levelId + 1));
  const more = document.getElementById('more');
  if (more) more.addEventListener('click', buyMoves);
  document.getElementById('again').addEventListener('click', () => begin(state.levelId));
  document.getElementById('garden').addEventListener('click', showStart);
}

function buyMoves() {
  if (!spend(CONFIG.balance.extraMovesCost)) return;
  state.movesLeft += CONFIG.balance.extraMoves;
  endEl.hidden = true;
  renderHud();
  busy = false;
  armHint();
}

function showStart() {
  busy = false;
  clearHint();
  endEl.hidden = true;
  shopEl.hidden = true;
  playEl.hidden = true;
  startEl.hidden = false;
  applyCopy();
}

function begin(levelId) {
  clearHint();
  endEl.hidden = true;
  shopEl.hidden = true;
  startEl.hidden = true;
  playEl.hidden = false;
  selected = null;
  busy = false;
  state = Engine.createState(levelId);
  renderHud();
  renderBoard(state.grid);
  armHint();
}

async function trySwap(r1, c1, r2, c2) {
  if (busy || !state) return;
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) {
    selected = { r: r2, c: c2 };
    renderBoard(state.grid);
    return;
  }
  clearHint();
  selected = null;
  const result = Engine.applyPlayerMove(state, r1, c1, r2, c2);
  if (!result.ok) {
    [cellTile(r1, c1), cellTile(r2, c2)].forEach((el) => {
      if (!el) return;
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
    });
    armHint();
    return;
  }
  busy = true;
  const prev = capture();
  renderBoard(result.gridAfterSwap);
  flip(prev);
  renderHud({
    collected: state.collected,
    score: state.score,
    glassCleared: state.glassCleared,
    movesLeft: result.state.movesLeft
  });
  await wait(180);
  await playFrames(result.frames);
  state = result.state;
  renderHud();
  if (Engine.goalsMet(state)) {
    await wait(240);
    showEnd(true);
    busy = false;
    return;
  }
  if (!Engine.getValidMoves(state).length && state.movesLeft > 0) {
    const shuffled = Engine.shuffleTiles(state);
    const before = capture();
    state = shuffled.state;
    renderBoard(state.grid);
    flip(before);
    toast(t('shuffled'));
    await wait(380);
  }
  if (state.movesLeft <= 0 && !Engine.goalsMet(state)) showEnd(false);
  busy = false;
  armHint();
}

async function openShop() {
  if (buying) return;
  shopEl.hidden = false;
  shopEl.innerHTML = '<div class="end-card shop-card"><p class="eyebrow">' + t('shop') +
    '</p><h3>' + t('shop') + '</h3><p id="shop-info">' + t('shopLoading') +
    '</p><div id="shop-rows"></div><button class="ghost" type="button" id="shop-close">' +
    t('close') + '</button></div>';
  document.getElementById('shop-close').addEventListener('click', () => { shopEl.hidden = true; });
  let catalog;
  try { catalog = await SDK.getCatalog(); }
  catch (e) {
    document.getElementById('shop-info').textContent = t('payUnavailable');
    return;
  }
  const info = document.getElementById('shop-info');
  const rows = document.getElementById('shop-rows');
  if (!catalog || !Object.keys(catalog).length) {
    info.textContent = t('payUnavailable');
    return;
  }
  info.remove();
  CONFIG.shop.products.forEach((prod) => {
    const item = catalog[prod.id];
    if (!item) return;
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = '<span>' + t('coinsN', { n: prod.coins }) +
      (prod.badge ? '<small>' + prod.badge + '</small>' : '') +
      '</span><button class="btn slim" type="button">' + item.price + '</button>';
    row.querySelector('button').addEventListener('click', async () => {
      if (buying || SDK.busy) return;
      if (!SDK.paymentsAvailable) { toast(t('payUnavailable')); return; }
      buying = true;
      const ok = await SDK.purchase(prod.id);
      buying = false;
      refreshCoins();
      toast(ok ? t('purchased') : t('purchaseFail'));
    });
    rows.appendChild(row);
  });
}

boardEl.addEventListener('pointerdown', (event) => {
  const tile = event.target.closest('.tile');
  if (!tile || busy) return;
  const cell = tile.closest('.cell');
  pointer = {
    id: event.pointerId,
    r: Number(cell.dataset.r),
    c: Number(cell.dataset.c),
    x: event.clientX,
    y: event.clientY,
    dragged: false
  };
  boardEl.setPointerCapture(event.pointerId);
});

boardEl.addEventListener('pointermove', (event) => {
  if (!pointer || event.pointerId !== pointer.id || pointer.dragged) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  if (Math.abs(dx) + Math.abs(dy) < 18) return;
  pointer.dragged = true;
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const r2 = pointer.r + (horizontal ? 0 : dy > 0 ? 1 : -1);
  const c2 = pointer.c + (horizontal ? (dx > 0 ? 1 : -1) : 0);
  const from = pointer;
  pointer = null;
  trySwap(from.r, from.c, r2, c2);
});

boardEl.addEventListener('pointerup', (event) => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const from = pointer;
  pointer = null;
  if (from.dragged) return;
  if (selected && selected.r === from.r && selected.c === from.c) {
    selected = null;
    renderBoard(state.grid);
    return;
  }
  if (selected && Math.abs(selected.r - from.r) + Math.abs(selected.c - from.c) === 1) {
    trySwap(selected.r, selected.c, from.r, from.c);
    return;
  }
  selected = { r: from.r, c: from.c };
  renderBoard(state.grid);
});

document.getElementById('enter').addEventListener('click', () => begin(1));
langEl.addEventListener('click', () => {
  SDK.setUserLang(nextLang());
  applyCopy();
});
shopBtn.addEventListener('click', openShop);
freeBtn.addEventListener('click', () => {
  if (Date.now() < SDK.data.giftAt) return;
  SDK.data.coins += CONFIG.balance.freeCoinsReward;
  SDK.data.giftAt = Date.now() + CONFIG.balance.freeCoinsCooldownMs;
  SDK.persist(true);
  refreshCoins();
  syncFree();
});
SDK.onDataReload = () => { refreshCoins(); applyCopy(); };
SDK.onGrant = () => refreshCoins();
setInterval(syncFree, 1000);

(async () => {
  await SDK.init();
  await SDK.loadData();
  if (SDK.data.lang) setLang(SDK.data.lang);
  applyCopy();
  if (location.search.includes('debug')) window.__lumen = { SDK, Engine, begin, showEnd, openShop, showStart, applyCopy };
})();
