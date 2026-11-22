import { LANGS, setLang } from './i18n.js?v=20261122a';
import {
  currencyOf, ensureUser, handshake, inIframe, isVkPlay, loadCloudSave, looksLikeVkPlay,
  pay, userUid, waitForIframeApi, waitForUid, writeCloudSave, VKPLAY_PRICES, VKPLAY_SAVE_URL
} from './vkplay.js?v=20261122a';

export const CONFIG = {
  storageKey: 'lumen_vk_save_v1',
  saveDebounceMs: 1500,
  shop: {
    products: [
      { id: 'coins_500', type: 'coins', coins: 500 },
      { id: 'coins_2000', type: 'coins', coins: 2000, badge: 'x1.2' },
      { id: 'coins_6000', type: 'coins', coins: 6000, badge: 'x1.5' }
    ],
    maxStoredTokens: 30
  },
  balance: {
    startCoins: 50,
    extraMovesCost: 40,
    extraMoves: 5,
    hintCost: 15,
    shuffleCost: 25,
    freeCoinsReward: 80,
    freeCoinsCooldownMs: 90000
  }
};

export const defaultData = () => ({
  v: 1,
  coins: CONFIG.balance.startCoins,
  cleared: {},
  games: 0,
  best: 0,
  sound: true,
  lang: '',
  tokens: [],
  giftAt: 0,
  updatedAt: 0
});

function normalize(raw) {
  const d = Object.assign(defaultData(), raw || {});
  for (const k of ['coins', 'games', 'best', 'giftAt']) {
    if (!isFinite(d[k]) || d[k] < 0) d[k] = 0;
    d[k] = Math.min(d[k], 1e300);
  }
  d.sound = !!d.sound;
  if (!d.cleared || typeof d.cleared !== 'object') d.cleared = {};
  const cleared = {};
  for (const key of Object.keys(d.cleared)) {
    if (d.cleared[key]) cleared[String(key)] = true;
  }
  d.cleared = cleared;
  if (!Array.isArray(d.tokens)) d.tokens = [];
  if (!LANGS.includes(d.lang)) d.lang = '';
  return d;
}

function writeInto(dst, src) {
  const n = normalize(src);
  for (const key of Object.keys(n)) {
    dst[key] = (key === 'cleared') ? { ...n[key] } : (Array.isArray(n[key]) ? n[key].slice() : n[key]);
  }
  return dst;
}

function mergeSaves(a, b) {
  if (!a) return normalize(b);
  if (!b) return normalize(a);
  const x = normalize(a);
  const y = normalize(b);
  const out = defaultData();
  out.coins = Math.max(x.coins || 0, y.coins || 0);
  out.games = Math.max(x.games || 0, y.games || 0);
  out.best = Math.max(x.best || 0, y.best || 0);
  out.cleared = { ...x.cleared, ...y.cleared };
  out.tokens = Array.from(new Set([].concat(x.tokens || [], y.tokens || []))).slice(-CONFIG.shop.maxStoredTokens);
  const recent = (x.updatedAt || 0) >= (y.updatedAt || 0) ? x : y;
  out.lang = recent.lang;
  out.sound = recent.sound;
  out.giftAt = Math.max(x.giftAt || 0, y.giftAt || 0);
  out.updatedAt = Math.max(x.updatedAt || 0, y.updatedAt || 0, Date.now());
  return out;
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

class Platform {
  constructor() {
    this.mode = 'none';
    this.vkApi = null;
    this.ready = false;
    this.data = defaultData();
    this.busy = false;
    this._saveTimer = null;
    this._cloudReady = false;
    this.handshakeError = '';
    this.onDataReload = null;
    this.onGrant = null;
  }

  async init() {
    if (this.ready) return;
    const isLocal = ['localhost', '127.0.0.1', '', '0.0.0.0'].includes(location.hostname) || location.protocol === 'file:';
    const onGithubPages = /github\.io$/i.test(location.hostname);
    const wantVk = looksLikeVkPlay() || onGithubPages || !isLocal;
    if (wantVk) await waitForIframeApi(inIframe() ? 6000 : 0);

    this.mode = (wantVk || isVkPlay() || onGithubPages || !isLocal) ? 'vkplay' : 'offline';
    if (typeof window.iframeApi === 'function') {
      try {
        this.vkApi = await withTimeout(handshake(), 10000);
        try { await ensureUser(this.vkApi); } catch (e) { console.warn('[VKPlay] auth:', e && e.message ? e.message : e); }
      } catch (e) {
        console.warn('[VKPlay] handshake failed:', e);
        this.handshakeError = String(e && e.message ? e.message : e);
        this.vkApi = null;
      }
    }

    setLang(this.data.lang || navigator.language);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.flushCloud(); });
    window.addEventListener('pagehide', () => this.flushCloud());
    this.ready = true;
  }

  _readLocal() {
    try { const raw = localStorage.getItem(CONFIG.storageKey); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  _writeLocal() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.data)); } catch (e) { /* private */ }
  }

  async loadData() {
    const local = this._readLocal();
    let cloud = null;
    if (this.mode === 'vkplay') {
      if (this.vkApi) {
        try { await ensureUser(this.vkApi); } catch (e) { /* ignore */ }
      }
      const uid = await waitForUid(6000);
      if (uid) {
        try { cloud = await withTimeout(loadCloudSave(uid), 5000); }
        catch (e) { console.warn('[VKPlay] cloud load failed:', e); }
      }
    }
    writeInto(this.data, mergeSaves(cloud, local));
    this._cloudReady = true;
    if (this.data.lang) setLang(this.data.lang);
    this._writeLocal();
    if (this.mode === 'vkplay' && userUid()) this.flushCloud();
    if (this.mode === 'vkplay' && !userUid()) this._watchUid();
    return this.data;
  }

  _watchUid() {
    if (this._uidWatch) return;
    this._uidWatch = true;
    (async () => {
      const uid = await waitForUid(20000);
      this._uidWatch = false;
      if (!uid) return;
      let cloud = null;
      try { cloud = await withTimeout(loadCloudSave(uid), 5000); }
      catch (e) { console.warn('[VKPlay] late cloud load failed:', e); }
      writeInto(this.data, mergeSaves(cloud, this.data));
      this._writeLocal();
      this.flushCloud();
      if (this.onDataReload) {
        try { this.onDataReload(); } catch (e) { /* ignore */ }
      }
    })();
  }

  setUserLang(code) {
    this.data.lang = setLang(code);
    this.save(true);
    this.flushCloud();
  }

  save(important = false) {
    this.data.updatedAt = Date.now();
    this._writeLocal();
    const wait = important ? CONFIG.saveDebounceMs : 4000;
    if (this._saveTimer && !important) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.flushCloud(), wait);
  }

  flushCloud() {
    clearTimeout(this._saveTimer);
    this._saveTimer = null;
    this._writeLocal();
    if (!this._cloudReady) return;
    if (this.mode !== 'vkplay') return;
    const uid = userUid();
    if (!uid) return;
    const body = JSON.stringify({ uid: String(uid), save: this.data });
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon && document.visibilityState === 'hidden') {
        navigator.sendBeacon(VKPLAY_SAVE_URL, new Blob([body], { type: 'application/json' }));
        return;
      }
    } catch (e) { /* fetch */ }
    writeCloudSave(uid, this.data).catch((e) => console.warn('[VKPlay] cloud save failed:', e));
  }

  persist(important = true) {
    this.save(important);
    if (important) this.flushCloud();
  }

  get paymentsAvailable() { return this.mode === 'vkplay' && !!this.vkApi; }

  async getCatalog() {
    const out = {};
    const cur = currencyOf();
    const mark = { RUB: '₽', USD: '$', EUR: '€' }[cur] || cur;
    for (const id of Object.keys(VKPLAY_PRICES)) {
      const row = VKPLAY_PRICES[id];
      const lang = this.data.lang || 'ru';
      const title = lang === 'en' ? row.en : (lang === 'tr' ? row.tr : row.ru);
      out[id] = { price: row[cur] + ' ' + mark, priceValue: String(row[cur]), title };
    }
    return out;
  }

  async purchase(id) {
    if (!this.paymentsAvailable || this.busy) return false;
    this.busy = true;
    try {
      if (!this.vkApi) throw new Error('vkplay-api');
      await pay(this.vkApi, id, this.data.lang || 'ru');
      await this._grant({ productID: id, purchaseToken: 'vk-' + Date.now() + '-' + Math.random() });
      return true;
    } catch (e) {
      console.warn('[VKPlay] purchase failed:', e && e.message ? e.message : e);
      return false;
    } finally {
      this.busy = false;
    }
  }

  async _grant(purchase) {
    const prod = CONFIG.shop.products.find((p) => p.id === purchase.productID);
    if (!prod) return;
    const d = this.data;
    if (prod.type === 'coins') {
      if (!d.tokens.includes(purchase.purchaseToken)) {
        d.coins += prod.coins;
        d.tokens.push(purchase.purchaseToken);
        if (d.tokens.length > CONFIG.shop.maxStoredTokens) d.tokens.shift();
        this.persist(true);
        if (this.onGrant) this.onGrant(prod);
      }
    }
  }

  adsAllowed() { return false; }
}

export const SDK = new Platform();
export { mergeSaves, normalize };
