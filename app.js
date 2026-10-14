/* Español – persönliche Übungs-App. Läuft offline (Service Worker), Fortschritt lokal im Browser. */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const NOW = () => Date.now();
const todayKey = (t = NOW()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- Speicher ---------- */
const KEY = 'esapp.v1';
const DEFAULTS = { cards: {}, days: {}, settings: { minutes: 10, focus: 'mix', scope: 'all', dir: 'mix', rate: 0.9, voice: '', newPer: 0, sound: true }, seenVersion: '', lastData: '', points: 0, bestStreak: 0, mn: {} };
let S;
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S = Object.assign(structuredClone(DEFAULTS), S);
  S.settings = Object.assign(structuredClone(DEFAULTS.settings), S.settings);
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Speichern nicht möglich – Speicher voll?'); } }

/* ---------- Daten ---------- */
const D = { vocab: [], grammar: [], scenes: [], meta: {}, byId: {}, items: {} };
async function getJSON(u) { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u); return r.json(); }
async function loadData() {
  const [meta, v, g, d] = await Promise.all(['data/meta.json', 'data/vocab.json', 'data/grammar.json', 'data/dialogs.json'].map(getJSON));
  D.meta = meta; D.vocab = v.items; D.grammar = g.topics; D.scenes = d.scenes;
  D.byId = Object.fromEntries(D.vocab.map(x => [x.id, x]));
  D.items = {};
  for (const t of D.grammar) for (const it of t.items) { it.topic = t.id; D.items[it.id] = it; }
  D.maxLesson = Math.max(...D.vocab.map(x => x.l));
  try { D.mn = await getJSON('data/mnemonics.json'); } catch (e) { D.mn = D.mn || {}; }
}

/* ---------- Spielmechanik: Punkte, Leiter, Rang, Sound ---------- */
const LADDER = [1, 2, 3, 5, 10];
const RANKS = [[0, 'Aficionado'], [500, 'Novillero'], [2000, 'Banderillero'], [5000, 'Picador'], [12000, 'Matador'], [30000, 'Figura del toreo']];
const rankOf = p => { let r = RANKS[0]; for (const x of RANKS) if (p >= x[0]) r = x; return r; };
const nextRank = p => RANKS.find(x => x[0] > p);
const fmtN = n => Math.round(n).toLocaleString('de-DE');
let AC = null;
function beep(kind) {
  if (!S.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { ok: [[880, .07], [1320, .12]], bad: [[180, .22]], jack: [[660, .08], [880, .08], [1100, .08], [1320, .08], [1760, .25]], coin: [[1568, .05], [2093, .12]] }[kind] || [];
    let t = AC.currentTime + .01;
    for (const [f, d] of seq) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.07, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02); t += d;
    }
  } catch (e) { }
}
function ole(text, sub) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div'); el.className = 'ole'; el.innerHTML = `<span>${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
  document.body.append(el); setTimeout(() => el.remove(), 1200);
}

/* ---------- Eselsbrücken ---------- */
const BULB = '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 20.5z"/></svg>';
const mnOf = id => (S.mn && S.mn[id]) || (D.mn && D.mn[id]) || '';
function mnButton(id, pulse, label = 'Eselsbrücke') { return mnOf(id) ? `<button class="mnbtn ${pulse ? 'pulse' : ''}" data-mn="${id}" type="button">${BULB}${label}</button><div class="mnslot" data-slot="${id}"></div>` : ''; }
function mnBoxHTML(id) {
  const own = S.mn && S.mn[id];
  return `<div class="mnbox"><div class="mntext">${esc(mnOf(id))}</div><div class="who"><span>${own ? 'Deine eigene' : 'Vorschlag'}</span><button type="button" data-mnedit="${id}">${own ? 'Ändern' : 'Eigene schreiben'}</button></div></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mn]');
  if (b) {
    const id = b.dataset.mn, slot = document.querySelector(`[data-slot="${id}"]`);
    if (!slot) return;
    if (slot.innerHTML) { slot.innerHTML = ''; return; }
    slot.innerHTML = mnBoxHTML(id); b.classList.remove('pulse');
    if (SES && SES.cur === id && !SES.answered) SES.hint = true;
    return;
  }
  const ed = e.target.closest('[data-mnedit]');
  if (ed) {
    const id = ed.dataset.mnedit, box = ed.closest('.mnbox');
    box.innerHTML = `<textarea aria-label="Eigene Eselsbrücke">${esc(mnOf(id))}</textarea><div class="who"><button type="button" data-mnreset="${id}">Vorschlag zurückholen</button><button type="button" data-mnsave="${id}">Speichern</button></div>`;
    box.querySelector('textarea').focus();
    return;
  }
  const sv = e.target.closest('[data-mnsave]');
  if (sv) { const id = sv.dataset.mnsave, t = sv.closest('.mnbox').querySelector('textarea').value.trim(); S.mn = S.mn || {}; if (t) S.mn[id] = t; else delete S.mn[id]; save(); sv.closest('.mnbox').outerHTML = mnBoxHTML(id); toast('Eselsbrücke gespeichert'); return; }
  const rs = e.target.closest('[data-mnreset]');
  if (rs) { const id = rs.dataset.mnreset; if (S.mn) delete S.mn[id]; save(); rs.closest('.mnbox').outerHTML = mnBoxHTML(id); }
});
const newCutoff = () => { const g = D.meta.generated ? new Date(D.meta.generated).getTime() : NOW(); return todayKey(g - 7 * DAY); };
const isNew = v => v.added && v.added > newCutoff();

/* ---------- Lernlogik (Leitner-System) ---------- */
const IV = [0, 1, 2, 4, 8, 16, 35]; // Tage je Stufe
const card = k => S.cards[k];
function grade(k, ok, partial = false) {
  const c = S.cards[k] || (S.cards[k] = { b: 0, due: 0, n: 0, w: 0, r: 0 });
  const first = c.n === 0;
  c.n++; c.t = NOW();
  if (ok) {
    c.r++;
    c.b = first && !partial ? 3 : Math.min(c.b + (partial ? 0 : 1), 6);
    if (partial) c.b = Math.max(1, c.b);
    c.due = NOW() + IV[c.b] * DAY - 3600e3;
  } else {
    c.w++; c.b = 0; c.due = NOW() + 60e3;
  }
  const day = S.days[todayKey()] || (S.days[todayKey()] = { n: 0, ok: 0, sec: 0 });
  day.n++; if (ok) day.ok++;
  save();
}
const weakness = c => c ? (c.w + 1) / (c.r + 1) : 0;

/* ---------- Antworten prüfen ---------- */
const strip = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n');
const norm = s => String(s).toLowerCase().replace(/[¿¡!?.,;:"“”«»()]/g, ' ').replace(/\s+/g, ' ').trim();
const ART = /^(el|la|los|las|un|una|unos|unas)\s+/;
function variants(es) {
  const out = new Set();
  for (const part of es.split(/\s+\/\s+|\s*;\s*/)) {
    const p = part.replace(/\[.*?\]/g, '').trim();
    out.add(p.replace(/\(.*?\)/g, ' ')); out.add(p.replace(/[()]/g, ''));
    // "encantador / encantadora" ist schon gesplittet; "el sueco /a" → el sueco
    out.add(p.replace(/\s*\/\w+$/, ''));
  }
  return [...out].map(norm).filter(Boolean);
}
function check(input, accepted) {
  const a = norm(input);
  if (!a) return { ok: false };
  for (const v of accepted) {
    if (a === v) return { ok: true };
  }
  for (const v of accepted) {
    if (strip(a) === strip(v)) return { ok: true, note: 'Achte auf die Akzente: ' + v };
    if (a.replace(ART, '') === v.replace(ART, '') && ART.test(v)) return { ok: true, note: 'Mit Artikel: ' + v };
    if (strip(a.replace(ART, '')) === strip(v.replace(ART, ''))) return { ok: true, note: 'Genau: ' + v };
  }
  for (const v of accepted) if (lev(strip(a), strip(v)) <= (v.length > 8 ? 1 : 0)) return { ok: true, partial: true, note: 'Fast – Tippfehler? Richtig: ' + v };
  return { ok: false };
}
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
  let p = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
function similarity(a, b) {
  const A = strip(norm(a)).split(' '), B = strip(norm(b)).split(' ');
  const set = new Set(A); const hit = B.filter(w => set.has(w)).length;
  return B.length ? hit / B.length : 0;
}

/* ---------- Sprache ---------- */
let VOICES = [];
function loadVoices() { VOICES = (speechSynthesis?.getVoices() || []).filter(v => v.lang && v.lang.toLowerCase().startsWith('es')); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function say(text, rate) {
  if (!('speechSynthesis' in window)) return toast('Sprachausgabe wird hier nicht unterstützt');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s+\/\s+/g, ', ').replace(/[()]/g, ''));
  u.lang = 'es-ES'; u.rate = rate || S.settings.rate;
  const v = VOICES.find(v => v.name === S.settings.voice) || VOICES.find(v => v.lang === 'es-ES') || VOICES[0];
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
const SPK = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none"/><path d="M4 9h4l5-4v14l-5-4H4z"/></svg>';
const spkBtn = (text, label = 'Anhören') => `<button class="speak" data-say="${esc(text)}" aria-label="${label}">${SPK}</button>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { e.preventDefault(); say(b.dataset.say); } });

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen(onText, onEnd) {
  if (!SR) return null;
  const r = new SR(); r.lang = 'es-ES'; r.interimResults = false; r.maxAlternatives = 3;
  r.onresult = e => onText([...e.results[0]].map(x => x.transcript));
  r.onerror = e => { toast(e.error === 'network' ? 'Aussprache-Check braucht Internet' : 'Mikrofon: ' + e.error); };
  r.onend = onEnd; r.start(); return r;
}

/* ---------- UI-Helfer ---------- */
const view = () => $('#view');
let toastT;
function toast(msg, action) {
  const t = $('#toast'); t.innerHTML = esc(msg) + (action ? ` <button>${esc(action.label)}</button>` : '');
  if (action) t.querySelector('button').onclick = () => { t.classList.remove('show'); action.run(); };
  t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), action ? 9000 : 3200);
}
let TAB = 'home';
function go(tab) {
  TAB = tab; document.body.classList.remove('in-session');
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  ({ home: renderHome, lib: renderLib, talk: renderTalk, stats: renderStats, more: renderMore })[tab]();
  window.scrollTo(0, 0);
}
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));
function seg(name, opts, cur) {
  return `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
function bindSeg(root, fn) {
  root.querySelectorAll('[data-seg]').forEach(s => s.querySelectorAll('button').forEach(b => b.onclick = () => {
    s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); fn(s.dataset.seg, b.dataset.v);
  }));
}

/* ---------- Statistik-Helfer ---------- */
function streak() {
  let n = 0, t = NOW();
  if (!S.days[todayKey(t)]) t -= DAY;
  while (S.days[todayKey(t)]) { n++; t -= DAY; }
  return n;
}
function vocabState(v) {
  const a = card('v:' + v.id + ':de'), b = card('v:' + v.id + ':es');
  if (!a && !b) return 0;
  return Math.min(a ? a.b : 0, b ? b.b : 0) || Math.max(a ? a.b : 0, b ? b.b : 0) * 0.5;
}
function inScope(v, scope) {
  if (scope === 'new') return isNew(v);
  if (scope === 'recent') return v.l >= D.maxLesson - 3 || isNew(v);
  return true;
}

/* ---------- Home ---------- */
function renderHome() {
  const st = S.settings, s = streak();
  const newV = D.vocab.filter(isNew);
  const due = D.vocab.filter(v => ['de', 'es'].some(d => { const c = card(`v:${v.id}:${d}`); return c && c.due <= NOW(); })).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? '¡Buenos días, Christian!' : hour < 20 ? '¡Buenas tardes, Christian!' : '¡Buenas noches, Christian!';
  const pts = S.points || 0, rk = rankOf(pts), nx = nextRank(pts);
  view().innerHTML = `
    <section class="marquee">
      <div class="greet">${greet}</div>
      <div class="title">Español</div>
      <div class="tag">Lektion ${D.maxLesson} · ${fmtN(D.vocab.length)} Vokabeln · ${Object.keys(D.items).length} Übungen</div>
    </section>
    <div class="leds">
      <div class="ledbox"><b>${fmtN(pts)}</b><span>Punkte</span></div>
      <div class="ledbox"><b>${s}</b><span>${s === 1 ? 'Tag' : 'Tage'} in Folge</span></div>
      <div class="ledbox"><b>${due}</b><span>heute fällig</span></div>
    </div>
    <p class="rank">Rang: <b>${rk[1]}</b>${nx ? ` · noch ${fmtN(nx[0] - pts)} Punkte bis ${nx[1]}` : ''}</p>
    <section class="console" style="margin-top:14px">
      <div class="label">Spielzeit</div>
      ${seg('minutes', [[5, '5 Min'], [10, '10 Min'], [15, '15 Min'], [20, '20 Min'], [0, 'Offen']], st.minutes)}
      <div class="label">Spiel</div>
      ${seg('focus', [['mix', 'Mix'], ['vocab', 'Vokabeln'], ['grammar', 'Grammatik'], ['speak', 'Sprechen']], st.focus)}
      <div class="label">Stoff</div>
      ${seg('scope', [['all', 'Alles'], ['recent', `Lektion ${D.maxLesson - 3}–${D.maxLesson}`], ['new', 'Neu']], st.scope)}
      <button class="bigbtn" id="start" aria-label="Spiel starten">¡Vamos!<small>Start</small></button>
    </section>
    ${newV.length ? `<h2>Neu diese Woche <span class="badge">${newV.length}</span></h2>
      <div class="newstrip">${newV.slice(0, 30).map(v => `<button class="chip" data-say="${esc(v.es)}">${esc(v.es)}<i>${esc(v.de)}</i></button>`).join('')}</div>` : ''}
    <h2>Mehr üben</h2>
    <button class="row" id="toTalk"><div class="grow"><h3>Gespräch mit Claude</h3><div class="muted small">Rollenspiel mit deinem aktuellen Wortschatz</div></div><span class="chev">›</span></button>
    <button class="row" id="toDlg"><div class="grow"><h3>Dialoge nachsprechen</h3><div class="muted small">${D.scenes.length} Alltagsszenen, funktioniert offline</div></div><span class="chev">›</span></button>
    <p class="muted small" style="margin-top:18px">Inhalte vom ${new Date(D.meta.generated).toLocaleDateString('de-DE')}. Neue kommen jeden Montag automatisch.</p>`;
  bindSeg(view(), (k, v) => { st[k] = k === 'minutes' ? +v : v; save(); });
  $('#start').onclick = () => { beep('coin'); startSession(); };
  $('#toTalk').onclick = () => go('talk');
  $('#toDlg').onclick = () => { go('talk'); setTimeout(() => $('#dlgs')?.scrollIntoView(), 50); };
}

/* ---------- Session ---------- */
let SES = null;
function startSession(opts = {}) {
  const st = S.settings;
  SES = {
    start: NOW(), minutes: opts.minutes ?? st.minutes, focus: opts.focus || st.focus, scope: opts.scope || st.scope,
    topic: opts.topic || null, done: 0, ok: 0, pts: 0, streak: 0, streakLvl: 0, best: 0, hint: false, cur: null, newUsed: 0, requeue: [], recent: [], wrongs: [],
    newMax: st.newPer || Math.max(8, Math.round((st.minutes || 15) * 1.6))
  };
  if (SES.focus === 'speak' && !opts.topic) { go('talk'); return; }
  document.body.classList.add('in-session');
  timerTick();
  nextItem();
}
let timerT;
function timerTick() {
  clearInterval(timerT);
  timerT = setInterval(() => {
    if (!SES) return clearInterval(timerT);
    const el = $('#stime'); if (el) el.textContent = fmtTime();
    const m = $('#smeter'); if (m) m.style.width = progress() * 100 + '%';
  }, 1000);
}
const elapsed = () => (NOW() - SES.start) / 1000;
const fmtTime = () => { const s = SES.minutes ? Math.max(0, SES.minutes * 60 - elapsed()) : elapsed(); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
const progress = () => SES.minutes ? Math.min(1, elapsed() / (SES.minutes * 60)) : Math.min(1, SES.done / 40);
const timeUp = () => SES.minutes && elapsed() >= SES.minutes * 60;

function shell(inner) {
  const lv = SES.streakLvl || 0;
  view().innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Spiel beenden">×</button><div class="meter"><i id="smeter" style="width:${progress() * 100}%"></i></div><span class="t" id="stime">${fmtTime()}</span></div>
    <div class="hud"><div class="score"><span>Punkte</span><b id="hscore">${fmtN(SES.pts)}</b></div>
    <div class="ladder" aria-label="Serien-Multiplikator">${LADDER.map((m, k) => `<i class="${k <= lv && SES.streak > 0 ? 'on' : ''} ${k === LADDER.length - 1 ? 'top' : ''}">×${m}</i>`).join('')}</div></div>${inner}`;
  $('#quit').onclick = () => finish();
}
function updateHud() {
  const h = $('#hscore'); if (h) h.textContent = fmtN(SES.pts);
  const lv = SES.streakLvl;
  view().querySelectorAll('.ladder i').forEach((el, k) => el.classList.toggle('on', SES.streak > 0 && k <= lv));
}

function chooseKind() {
  if (SES.topic) return 'grammar';
  if (SES.focus === 'vocab') return 'vocab';
  if (SES.focus === 'grammar') return 'grammar';
  const r = Math.random();
  return r < 0.58 ? 'vocab' : r < 0.88 ? 'grammar' : 'shadow';
}

function nextItem() {
  if (timeUp()) return finish();
  // falsch beantwortete Karten kommen nach 3 anderen wieder
  const rq = SES.requeue.findIndex(r => SES.done - r.at >= 3);
  if (rq >= 0) { const r = SES.requeue.splice(rq, 1)[0]; return r.kind === 'vocab' ? showVocab(r.v, r.dir) : r.kind === 'grammar' ? showGrammar(r.it) : showShadow(r.sc, r.i); }
  let kind = chooseKind();
  for (let tries = 0; tries < 3; tries++) {
    if (kind === 'vocab') { const p = pickVocab(); if (p) return showVocab(p.v, p.dir); kind = 'grammar'; }
    if (kind === 'grammar') { const it = pickGrammar(); if (it) return showGrammar(it); kind = 'vocab'; }
    if (kind === 'shadow') { const p = pickShadow(); if (p) return showShadow(p.sc, p.i); kind = 'vocab'; }
  }
  finish();
}

function pickVocab() {
  const pool = D.vocab.filter(v => inScope(v, SES.scope) && !SES.recent.includes(v.id));
  const dirPref = S.settings.dir;
  const dirs = dirPref === 'mix' ? ['de', 'es'] : [dirPref];
  // 1) fällig, nach Fehlerquote gewichtet
  const due = [];
  for (const v of pool) for (const d of dirs) { const c = card(`v:${v.id}:${d}`); if (c && c.due <= NOW()) due.push({ v, dir: d, s: weakness(c) * 2 + (NOW() - c.due) / DAY }); }
  if (due.length) { due.sort((a, b) => b.s - a.s); return pick(due.slice(0, 6)); }
  // 2) neue Karten: erst "Neu diese Woche", dann jüngere Lektionen bevorzugt
  if (SES.newUsed >= SES.newMax) return null;
  const fresh = pool.filter(v => !card(`v:${v.id}:de`) && !card(`v:${v.id}:es`));
  if (!fresh.length) {
    const half = pool.map(v => ({ v, dir: dirs.find(d => !card(`v:${v.id}:${d}`)) })).filter(x => x.dir);
    if (half.length) { SES.newUsed++; return pick(half.slice(0, 20)); }
    return null;
  }
  const nw = fresh.filter(isNew);
  let v;
  if (nw.length) v = pick(nw);
  else {
    const w = fresh.map(v => ({ v, w: 1 + (v.l || 0) / 4 + Math.random() * 3 })).sort((a, b) => b.w - a.w);
    v = pick(w.slice(0, 15)).v;
  }
  SES.newUsed++;
  return { v, dir: dirPref === 'mix' ? (v.es.split(' ').length > 4 ? 'es' : pick(['de', 'es'])) : dirPref };
}

function pickGrammar() {
  let topics = D.grammar;
  if (SES.topic) topics = topics.filter(t => t.id === SES.topic);
  else if (SES.scope !== 'all') topics = topics.filter(t => t.lessons.some(l => l >= D.maxLesson - 3)) || topics;
  if (!topics.length) topics = D.grammar;
  const items = topics.flatMap(t => t.items).filter(it => !SES.recent.includes(it.id));
  const due = items.filter(it => { const c = card('g:' + it.id); return c && c.due <= NOW(); });
  if (due.length) return due.sort((a, b) => weakness(card('g:' + b.id)) - weakness(card('g:' + a.id)))[Math.floor(Math.random() * Math.min(4, due.length))];
  const fresh = items.filter(it => !card('g:' + it.id));
  if (fresh.length) {
    // Themen mit schlechter Quote zuerst
    const acc = t => { const cs = t.items.map(i => card('g:' + i.id)).filter(Boolean); const r = cs.reduce((a, c) => a + c.r, 0), w = cs.reduce((a, c) => a + c.w, 0); return (r + 1) / (r + w + 2); };
    const ranked = topics.filter(t => t.items.some(i => !card('g:' + i.id))).sort((a, b) => acc(a) - acc(b) + (Math.random() - .5) * .3);
    const t = ranked[0]; const f = t.items.filter(i => !card('g:' + i.id) && !SES.recent.includes(i.id));
    return f.length ? pick(f) : pick(fresh);
  }
  if (SES.topic) return pick(items.length ? items : topics[0].items);
  return null;
}

function pickShadow() {
  const lines = [];
  for (const sc of D.scenes) sc.lines.forEach((ln, i) => { if (ln.w === 'B') lines.push({ sc, i, c: card(`d:${sc.id}:${i}`) }); });
  const due = lines.filter(x => !x.c || x.c.due <= NOW());
  return due.length ? pick(due) : null;
}

function remember(id) { SES.recent.push(id); if (SES.recent.length > 12) SES.recent.shift(); }
function afterAnswer(ok, requeueObj, partial = false) {
  SES.done++; SES.answered = true;
  if (ok) {
    SES.ok++; SES.streak++;
    SES.best = Math.max(SES.best || 0, SES.streak);
    SES.streakLvl = Math.min(LADDER.length - 1, [0, 3, 6, 10, 15].filter(x => SES.streak >= x).length - 1);
    const mult = LADDER[SES.streakLvl];
    let gain = 10 * mult; if (partial) gain = Math.round(gain / 2); if (SES.hint) gain = Math.round(gain / 2);
    SES.pts += gain; SES.last = gain;
    if ([3, 6, 10, 15].includes(SES.streak)) { beep('jack'); ole('¡Olé!', '×' + mult); }
    else beep('ok');
  } else {
    SES.streak = 0; SES.streakLvl = 0; SES.last = 0; beep('bad');
    SES.requeue.push({ ...requeueObj, at: SES.done }); SES.wrongs.push(requeueObj);
  }
  updateHud();
}
function showVocab(v, dir) {
  remember(v.id);
  SES.cur = v.id; SES.hint = false; SES.answered = false;
  const key = `v:${v.id}:${dir}`;
  const tag = isNew(v) ? '<span class="tag new">neu</span>' : '';
  const src = v.l ? `Lektion ${v.l}` : (v.src || 'Grundwortschatz');
  const reel = (text, cls = '') => `<div class="reel spin"><span class="strip"><div class="prompt ${cls} ${text.length > 28 ? 'long' : ''}">${esc(text)}</div></span></div>`;
  const gained = ok => ok && SES.last ? `<span class="pts">+${SES.last}</span>` : '';
  const nextBtn = () => { $('#nx').onclick = nextItem; $('#nx').focus(); };
  if (dir === 'es') {
    const others = shuffle(D.vocab.filter(x => x.id !== v.id && x.de !== v.de && Math.abs(x.de.length - v.de.length) < 18 && (x.l === v.l || Math.random() < .3))).slice(0, 3);
    const opts = shuffle([v, ...others]);
    shell(`<div class="card"><div class="kind">Was heißt das? ${tag}<span style="margin-left:auto">${esc(src)}</span></div>
      <div class="pline">${reel(v.es, 'es')}${spkBtn(v.es)}</div>${v.n ? `<div class="sub small">${esc(v.n)}</div>` : ''}${mnButton(v.id)}</div>
      <div class="opts">${opts.map(o => `<button class="opt" data-id="${o.id}">${esc(o.de)}</button>`).join('')}</div><div id="fb"></div>`);
    say(v.es);
    view().querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = b.dataset.id === v.id;
      view().querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.id === v.id) x.classList.add('ok'); });
      if (!ok) b.classList.add('bad');
      grade(key, ok); afterAnswer(ok, { kind: 'vocab', v, dir });
      $('#fb').innerHTML = `<div class="actions"><button class="b-main" id="nx">Weiter</button></div>`;
      if (!ok) fixMnFeedback(v.id);
      nextBtn();
    });
    return;
  }
  const long = v.es.length > 30 || v.es.split(' ').length > 5 || / \/ .* \/ /.test(v.es);
  if (long) {
    shell(`<div class="card"><div class="kind">Sag es auf Spanisch ${tag}<span style="margin-left:auto">${esc(src)}</span></div>
      ${reel(v.de)}<p class="sub small">Sprich laut, dann aufdecken.</p>${mnButton(v.id, false, 'Tipp: Eselsbrücke (halbe Punkte)')}</div>
      <div id="fb"><div class="actions"><button class="b-main" id="rev">Aufdecken</button></div></div>`);
    $('#rev').onclick = () => {
      say(v.es);
      $('#fb').innerHTML = `<div class="feedback ok"><div class="pline"><div class="sol es">${esc(v.es)}</div>${spkBtn(v.es)}</div>${v.n ? `<div class="small">${esc(v.n)}</div>` : ''}</div>
        <div class="actions"><button class="b-bad" data-g="0">Nicht gewusst</button><button class="b-mid" data-g="1">Fast</button><button class="b-ok" data-g="2">Gewusst</button></div>`;
      view().querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
        const g = +b.dataset.g; grade(key, g > 0, g === 1); afterAnswer(g > 0, { kind: 'vocab', v, dir }, g === 1);
        if (g === 0 && mnOf(v.id)) { $('#fb').innerHTML = `<div class="feedback bad"><b>Merk dir das</b><div class="sol es">${esc(v.es)}</div>${mnBoxHTML(v.id)}</div><div class="actions"><button class="b-main" id="nx">Weiter</button></div>`; nextBtn(); }
        else nextItem();
      });
    };
    return;
  }
  shell(`<div class="card"><div class="kind">Auf Spanisch ${tag}<span style="margin-left:auto">${esc(src)}</span></div>
    ${reel(v.de)}${mnButton(v.id, false, 'Tipp: Eselsbrücke (halbe Punkte)')}</div>
    <form class="answer" id="af"><input id="ai" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" lang="es" enterkeyhint="done" placeholder="Antwort …" aria-label="Antwort auf Spanisch"><button class="go">OK</button></form>
    ${accentKeys()}
    <div id="fb"><div class="actions"><button class="b-plain" id="idk">Weiß ich nicht</button></div></div>`);
  bindAccents();
  const inp = $('#ai'); setTimeout(() => inp.focus(), 60);
  const done = (res) => {
    inp.disabled = true; inp.classList.add(res.ok ? 'ok' : 'bad');
    grade(key, res.ok, res.partial); afterAnswer(res.ok, { kind: 'vocab', v, dir }, res.partial);
    say(v.es);
    $('#fb').innerHTML = `<div class="feedback ${res.ok ? 'ok' : 'bad'}">${gained(res.ok)}<b>${res.ok ? '¡Correcto!' : 'Richtig wäre:'}</b><div class="pline"><div class="sol es">${esc(v.es)}</div>${spkBtn(v.es)}</div>${res.note ? `<div class="small">${esc(res.note)}</div>` : ''}${v.n ? `<div class="small">${esc(v.n)}</div>` : ''}</div>
      ${res.ok ? '' : `<div data-fbmn></div>`}
      <div class="actions">${res.ok ? '' : '<button class="b-plain" id="was">Hatte ich richtig</button>'}<button class="b-main" id="nx">Weiter</button></div>`;
    if (!res.ok) fixMnFeedback(v.id);
    nextBtn();
    const w = $('#was'); if (w) w.onclick = () => { S.cards[key].w--; S.cards[key].b = 2; S.cards[key].due = NOW() + 2 * DAY; SES.ok++; SES.requeue.pop(); SES.wrongs.pop(); SES.pts += 10; updateHud(); save(); nextItem(); };
  };
  $('#af').onsubmit = e => { e.preventDefault(); if (!inp.disabled && inp.value.trim()) done(check(inp.value, variants(v.es))); };
  $('#idk').onclick = () => done({ ok: false });
}
// Nach falscher Antwort: Eselsbrücke-Knopf in der Karte hervorheben und direkt öffnen lassen
function fixMnFeedback(id) {
  const holder = $('[data-fbmn]'); if (holder) holder.remove();
  view().querySelectorAll('#fb .mnbtn, #fb .mnslot').forEach(x => x.remove());
  const b = view().querySelector(`.card [data-mn="${id}"]`);
  if (b) { b.classList.add('pulse'); b.innerHTML = BULB + 'Eselsbrücke ansehen'; }
}
function accentKeys() { return `<div class="keys">${['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'].map(k => `<button type="button" data-k="${k}">${k}</button>`).join('')}</div>`; }
function bindAccents() {
  view().querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const i = $('#ai'); if (!i || i.disabled) return; const s = i.selectionStart ?? i.value.length;
    i.value = i.value.slice(0, s) + b.dataset.k + i.value.slice(i.selectionEnd ?? s); i.focus(); i.setSelectionRange(s + 1, s + 1);
  });
}

/* Grammatik-Karte */
function showGrammar(it) {
  remember(it.id); SES.cur = null; SES.hint = false; SES.answered = false;
  const t = D.grammar.find(t => t.id === it.topic), key = 'g:' + it.id;
  const head = `<div class="kind"><span class="tag">${esc(t.title)}</span><span class="muted small" style="margin-left:auto">L${t.lessons.join(', ')}</span></div>`;
  const rule = `<details class="rulebox"><summary>Regel ansehen</summary><div class="rule">${t.rule}</div></details>`;
  const fin = (ok, partial, sol, note) => {
    grade(key, ok, partial); afterAnswer(ok, { kind: 'grammar', it });
    $('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'bad'}"><b>${ok ? '¡Muy bien!' : 'Richtig wäre:'}</b>${sol ? `<div class="pline"><div class="sol es">${esc(sol)}</div>${spkBtn(sol)}</div>` : ''}${note ? `<div class="small">${esc(note)}</div>` : ''}${it.ex ? `<div class="small">${esc(it.ex)}</div>` : ''}</div>${ok ? '' : rule.replace('<details', '<details open')}
      <div class="actions"><button class="b-main" id="nx">Weiter</button></div>`;
    $('#nx').onclick = nextItem; $('#nx').focus();
  };
  const filled = ans => it.q ? it.q.replace('___', ans.split(' / ')[0]).replace('___', ans.split(' / ')[1] || '') : ans;
  if (it.t === 'mc') {
    const right = it.opts[0];
    shell(`<div class="card">${head}<div class="prompt es long">${esc(it.q)}</div>${it.de ? `<div class="sub">${esc(it.de)}</div>` : ''}</div>
      <div class="opts">${shuffle(it.opts).map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><div id="fb">${rule}</div>`);
    view().querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = b.dataset.o === right;
      view().querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.o === right) x.classList.add('ok'); });
      if (!ok) b.classList.add('bad');
      fin(ok, false, /^\d+$|^\d+:\d+$/.test(it.q) ? right : filled(right));
    });
  } else if (it.t === 'type') {
    shell(`<div class="card">${head}<div class="prompt es long">${esc(it.q)}</div>${it.de ? `<div class="sub">${esc(it.de)}</div>` : ''}</div>
      <form class="answer" id="af"><input id="ai" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" lang="es" enterkeyhint="done" placeholder="Lücke ausfüllen …" aria-label="Antwort"><button class="b-main" style="border:0;border-radius:14px;padding:0 18px;font-weight:600">OK</button></form>
      ${accentKeys()}<div id="fb">${rule}</div>`);
    bindAccents(); const inp = $('#ai'); setTimeout(() => inp.focus(), 60);
    $('#af').onsubmit = e => {
      e.preventDefault(); if (inp.disabled || !inp.value.trim()) return;
      const r = check(inp.value, it.ans.map(norm)); inp.disabled = true; inp.classList.add(r.ok ? 'ok' : 'bad');
      fin(r.ok, r.partial, /^\d+$/.test(it.q) || it.q.includes('–') || it.q.includes('→') ? it.ans[0] : filled(it.ans[0]), r.note);
    };
  } else {
    const words = it.ans.replace(/([¿¡])/g, '$1 ').split(/\s+/).filter(Boolean);
    const target = words.map(w => w.toLowerCase());
    let chosen = [];
    const pool = shuffle(words.map((w, i) => ({ w, i })));
    shell(`<div class="card">${head}<div class="sub">Bau den Satz:</div><div class="prompt long">${esc(it.de)}</div></div>
      <div class="tiles" id="tgt"></div><div class="tiles pool" id="pool"></div>
      <div id="fb"><div class="actions"><button class="b-plain" id="undo">Zurück</button><button class="b-main" id="chk">Prüfen</button></div>${rule}</div>`);
    const draw = () => {
      $('#tgt').innerHTML = chosen.map((p, k) => `<button class="tile" data-k="${k}">${esc(p.w)}</button>`).join('');
      $('#pool').innerHTML = pool.filter(p => !chosen.includes(p)).map(p => `<button class="tile" data-i="${p.i}">${esc(p.w)}</button>`).join('');
      $('#tgt').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { chosen.splice(+b.dataset.k, 1); draw(); });
      $('#pool').querySelectorAll('[data-i]').forEach(b => b.onclick = () => { chosen.push(pool.find(p => p.i === +b.dataset.i)); draw(); });
    };
    draw();
    $('#undo').onclick = () => { chosen.pop(); draw(); };
    $('#chk').onclick = () => {
      const ok = chosen.length === target.length && chosen.every((p, k) => p.w.toLowerCase() === target[k]);
      $('#tgt').querySelectorAll('button').forEach(b => b.disabled = true);
      say(it.ans); fin(ok, false, it.ans);
    };
  }
}

/* Nachsprechen (eine Dialogzeile) */
function showShadow(sc, i) {
  const ln = sc.lines[i], key = `d:${sc.id}:${i}`, prev = sc.lines[i - 1];
  remember(key); SES.cur = null; SES.hint = false; SES.answered = false;
  shell(`<div class="card"><div class="kind"><span class="tag">Sprechen</span><span class="muted small" style="margin-left:auto">${esc(sc.title)}</span></div>
    ${prev ? `<div class="bubble a"><div class="pline"><div class="es">${esc(prev.es)}</div>${spkBtn(prev.es)}</div></div>` : `<p class="sub small">${esc(sc.setting)}</p>`}
    <div class="bubble b hint"><div class="small muted">Du sagst:</div>${esc(ln.de)}</div></div>
    <div id="fb"><div class="actions"><button class="b-main" id="rev">Gesagt – Lösung zeigen</button></div>${recUI()}</div>`);
  if (prev) say(prev.es);
  bindRec(ln.es);
  $('#rev').onclick = () => {
    say(ln.es);
    $('#fb').innerHTML = `<div class="feedback ok"><div class="pline"><div class="sol es">${esc(ln.es)}</div>${spkBtn(ln.es)}</div></div>
      <div class="actions"><button class="b-bad" data-g="0">Daneben</button><button class="b-mid" data-g="1">Fast</button><button class="b-ok" data-g="2">Gut</button></div>`;
    view().querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const g = +b.dataset.g; grade(key, g > 0, g === 1); afterAnswer(g > 0, { kind: 'shadow', sc, i }); nextItem(); });
  };
}

/* Aufnahme / Aussprache */
function recUI() {
  return `<div class="rec">${navigator.mediaDevices && window.MediaRecorder ? '<button id="recb">Aufnehmen</button><button id="play" hidden>Anhören</button>' : ''}
    ${SR ? '<button id="srb">Aussprache prüfen</button>' : ''}<span id="srout" class="small"></span></div>`;
}
let MR = null;
function bindRec(target) {
  const rb = $('#recb'), pb = $('#play'), sb = $('#srb');
  if (rb) rb.onclick = async () => {
    if (MR && MR.state === 'recording') { MR.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = []; MR = new MediaRecorder(stream);
      MR.ondataavailable = e => chunks.push(e.data);
      MR.onstop = () => {
        stream.getTracks().forEach(t => t.stop()); rb.classList.remove('live'); rb.textContent = 'Neu aufnehmen';
        const url = URL.createObjectURL(new Blob(chunks, { type: MR.mimeType })); pb.hidden = false;
        pb.onclick = () => new Audio(url).play();
      };
      MR.start(); rb.classList.add('live'); rb.textContent = 'Stopp';
    } catch (e) { toast('Kein Zugriff aufs Mikrofon'); }
  };
  if (sb) sb.onclick = () => {
    if (!navigator.onLine) return toast('Aussprache-Check braucht Internet');
    sb.classList.add('live'); sb.textContent = 'Ich höre zu …';
    listen(alts => {
      const best = alts.map(a => ({ a, s: similarity(a, target) })).sort((x, y) => y.s - x.s)[0];
      const pct = Math.round(best.s * 100);
      $('#srout').innerHTML = `<span class="score-sr" style="color:var(${pct >= 80 ? '--win' : pct >= 50 ? '--oro' : '--lose'})">${pct} %</span> verstanden: „${esc(best.a)}“`;
    }, () => { sb.classList.remove('live'); sb.textContent = 'Aussprache prüfen'; });
  };
}

function finish() {
  clearInterval(timerT);
  if (!SES) return go('home');
  const secs = Math.round(elapsed());
  const day = S.days[todayKey()] || (S.days[todayKey()] = { n: 0, ok: 0, sec: 0 });
  day.sec = (day.sec || 0) + secs;
  const before = S.points || 0;
  S.points = before + SES.pts; S.bestStreak = Math.max(S.bestStreak || 0, SES.best || 0);
  save();
  const up = rankOf(S.points)[1] !== rankOf(before)[1];
  const pct = SES.done ? Math.round(SES.ok / SES.done * 100) : 0;
  const wrong = [...new Map(SES.wrongs.map(w => [w.v ? w.v.id : w.it ? w.it.id : w.sc.id + w.i, w])).values()].slice(0, 12);
  const s = SES; SES = null;
  document.body.classList.remove('in-session');
  view().innerHTML = `<section class="marquee ${s.pts ? 'fast' : ''}"><div class="greet">${pct >= 85 ? '¡Excelente!' : pct >= 60 ? '¡Muy bien!' : s.done ? '¡Ánimo!' : 'Runde beendet'}</div>
      <div class="done-hero"><div class="big">+${fmtN(s.pts)}</div></div>
      <div class="tag">${s.done} Aufgaben, ${s.ok} richtig (${pct} %), beste Serie ${s.best || 0}</div></section>
    <p class="rank">${up ? 'Aufgestiegen zum ' : 'Rang: '}<b>${rankOf(S.points)[1]}</b> · ${fmtN(S.points)} Punkte gesamt</p>
    ${wrong.length ? `<h2>Noch mal anschauen</h2><ul class="vlist">${wrong.map(w => w.v ? `<li><div class="grow"><div class="es">${esc(w.v.es)}</div><div class="muted small">${esc(w.v.de)}</div></div>${spkBtn(w.v.es)}${mnOf(w.v.id) ? mnBoxHTML(w.v.id) : ''}</li>`
      : w.it ? `<li><div class="grow"><div class="es">${esc(w.it.q || w.it.ans)}</div><div class="muted small">${esc(D.grammar.find(t => t.id === w.it.topic).title)}</div></div></li>`
        : `<li><div class="grow"><div class="es">${esc(w.sc.lines[w.i].es)}</div><div class="muted small">${esc(w.sc.lines[w.i].de)}</div></div>${spkBtn(w.sc.lines[w.i].es)}</li>`).join('')}</ul>` : ''}
    <button class="cta" id="again">Noch eine Runde</button><button class="cta ghost" id="home">Fertig</button>`;
  if (up) { beep('jack'); ole('¡Olé!', rankOf(S.points)[1]); }
  $('#again').onclick = () => { beep('coin'); startSession({ minutes: s.minutes, focus: s.focus, scope: s.scope, topic: s.topic }); };
  $('#home').onclick = () => go('home');
}

/* ---------- Sprechen: Dialoge + Claude ---------- */
function renderTalk() {
  view().innerHTML = `<h1>Sprechen</h1>
    <h2 style="margin-top:14px">Gespräch mit Claude</h2>
    <p class="muted small">Startet ein Rollenspiel in der Claude-App, abgestimmt auf deinen Wortschatz, deine Fehler und die aktuelle Grammatik. Braucht Internet. In Claude dann den Sprachmodus antippen.</p>
    <div class="set"><label for="cs">Thema</label><select id="cs"><option value="free">Freies Gespräch über deinen Alltag</option>${D.scenes.map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select>
    <button class="cta" id="claude">In Claude öffnen</button><button class="cta ghost" id="copy">Nur Prompt kopieren</button>
    <details style="margin-top:10px"><summary class="muted small">Prompt ansehen</summary><div class="pre" id="pp"></div></details></div>
    <h2 id="dlgs">Dialoge nachsprechen</h2>
    <p class="muted small">Funktioniert offline. Die andere Person spricht, du antwortest laut.</p>
    ${D.scenes.map(s => { const cs = s.lines.map((l, i) => card(`d:${s.id}:${i}`)).filter(Boolean); const done = cs.filter(c => c.b >= 2).length, tot = s.lines.filter(l => l.w === 'B').length;
      return `<button class="row" data-sc="${s.id}"><div class="grow"><h3>${esc(s.title)}</h3><div class="muted small">${esc(s.setting)}</div></div><span class="muted small">${done}/${tot}</span><span class="chev">›</span></button>`; }).join('')}`;
  const upd = () => { $('#pp').textContent = claudePrompt($('#cs').value); };
  $('#cs').onchange = upd; upd();
  $('#copy').onclick = async () => { await copy(claudePrompt($('#cs').value)); toast('Prompt kopiert. In Claude einfügen.'); };
  $('#claude').onclick = async () => {
    const p = claudePrompt($('#cs').value);
    await copy(p);
    if (!navigator.onLine) return toast('Offline: Prompt ist kopiert, später in Claude einfügen');
    window.open('https://claude.ai/new?q=' + encodeURIComponent(p), '_blank');
  };
  view().querySelectorAll('[data-sc]').forEach(b => b.onclick = () => playDialog(D.scenes.find(s => s.id === b.dataset.sc)));
}
async function copy(t) { try { await navigator.clipboard.writeText(t); } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); } }

function claudePrompt(sceneId) {
  const sc = D.scenes.find(s => s.id === sceneId);
  const weak = D.vocab.map(v => ({ v, s: Math.max(weakness(card(`v:${v.id}:de`)), weakness(card(`v:${v.id}:es`))) })).filter(x => x.s > 1).sort((a, b) => b.s - a.s).slice(0, 12).map(x => x.v.es);
  const fresh = D.vocab.filter(isNew).slice(0, 14).map(v => v.es);
  const recentL = D.vocab.filter(v => v.l >= D.maxLesson - 1 && !isNew(v)).slice(0, 10).map(v => v.es);
  const topics = D.grammar.filter(t => t.lessons.some(l => l >= D.maxLesson - 6)).map(t => t.title);
  const words = [...new Set([...fresh, ...weak, ...recentL])].slice(0, 30);
  return [
    'Du bist meine geduldige Spanischlehrerin aus Palma. Ich bin Anfänger (A1, Lektion ' + D.maxLesson + '), Deutscher, lebe auf Mallorca.',
    sc ? 'Rollenspiel: ' + sc.claude : 'Freies Gespräch über meinen Alltag auf Mallorca, Familie, Arbeit und das Wochenende.',
    'Regeln: Sprich nur Spanisch, kurze Sätze, langsam, Präsens und "ir a + Infinitiv". Stell mir immer genau eine Frage und warte auf meine Antwort.',
    'Wenn ich einen Fehler mache, schreib nach deiner Antwort eine Zeile "Korrektur:" auf Deutsch mit der richtigen Form. Sonst keine Erklärungen.',
    'Baue möglichst diese Wörter ein: ' + words.join(', ') + '.',
    'Grammatik, die ich gerade übe: ' + topics.join(', ') + '.',
    'Nach etwa 10 Wechseln: kurzes Feedback auf Deutsch mit meinen 3 häufigsten Fehlern. ¡Empezamos!'
  ].join('\n');
}

function playDialog(sc) {
  document.body.classList.add('in-session');
  let i = 0, score = 0, asked = 0;
  const shown = [];
  const draw = () => {
    view().innerHTML = `<div class="sbar"><button class="x" id="quit" aria-label="Dialog beenden">×</button><div class="meter"><i style="width:${i / sc.lines.length * 100}%"></i></div><span class="t">${i}/${sc.lines.length}</span></div>
      <h1 style="font-size:24px">${esc(sc.title)}</h1><p class="muted small">${esc(sc.setting)}</p><div id="chat">${shown.join('')}</div><div id="fb"></div>`;
    $('#quit').onclick = () => go('talk');
  };
  const step = () => {
    if (i >= sc.lines.length) {
      draw();
      $('#fb').innerHTML = `<div class="feedback ok"><b>¡Terminado!</b>${asked ? `${score} von ${asked} Antworten gut.` : ''}</div><div class="actions"><button class="b-plain" id="again">Noch mal</button><button class="b-main" id="back">Fertig</button></div>`;
      $('#again').onclick = () => playDialog(sc); $('#back').onclick = () => go('talk');
      const day = S.days[todayKey()] || (S.days[todayKey()] = { n: 0, ok: 0, sec: 0 }); day.sec = (day.sec || 0) + 30 * asked; save();
      return;
    }
    const ln = sc.lines[i];
    if (ln.w === 'A') {
      shown.push(`<div class="bubble a"><div class="pline"><div class="es">${esc(ln.es)}</div>${spkBtn(ln.es)}</div><div class="de">${esc(ln.de)}</div></div>`);
      draw(); say(ln.es); i++;
      $('#fb').innerHTML = `<div class="actions"><button class="b-main" id="go">Weiter</button></div>`; $('#go').onclick = step; return;
    }
    draw();
    $('#chat').insertAdjacentHTML('beforeend', `<div class="bubble b hint"><div class="small muted">Du sagst:</div>${esc(ln.de)}</div>`);
    $('#fb').innerHTML = `<div class="actions"><button class="b-main" id="rev">Gesagt – Lösung zeigen</button></div>${recUI()}`;
    bindRec(ln.es);
    $('#rev').onclick = () => {
      say(ln.es);
      $('#fb').innerHTML = `<div class="feedback ok"><div class="pline"><div class="sol es">${esc(ln.es)}</div>${spkBtn(ln.es)}</div></div>
        <div class="actions"><button class="b-bad" data-g="0">Daneben</button><button class="b-mid" data-g="1">Fast</button><button class="b-ok" data-g="2">Gut</button></div>`;
      view().querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
        const g = +b.dataset.g; grade(`d:${sc.id}:${i}`, g > 0, g === 1); asked++; if (g === 2) score++;
        shown.push(`<div class="bubble b"><div class="es">${esc(ln.es)}</div><div class="de">${esc(ln.de)}</div></div>`); i++; step();
      });
    };
  };
  step();
}

/* ---------- Bibliothek ---------- */
let LIB = { tab: 'vocab', q: '', l: 'all', st: 'all' };
function renderLib() {
  view().innerHTML = `<h1>Bibliothek</h1>${seg('libtab', [['vocab', 'Vokabeln'], ['grammar', 'Grammatik']], LIB.tab)}<div id="lib" style="margin-top:14px"></div>`;
  bindSeg(view(), (k, v) => { LIB.tab = v; drawLib(); });
  drawLib();
}
function drawLib() {
  const el = $('#lib');
  if (LIB.tab === 'grammar') {
    el.innerHTML = D.grammar.map(t => {
      const cs = t.items.map(i => card('g:' + i.id)).filter(Boolean); const r = cs.reduce((a, c) => a + c.r, 0), w = cs.reduce((a, c) => a + c.w, 0);
      return `<details class="set"><summary><b>${esc(t.title)}</b> <span class="muted small">L${t.lessons.join(', ')} · ${t.items.length} Übungen${r + w ? ` · ${Math.round(r / (r + w) * 100)} % richtig` : ''}</span></summary>
        <div class="rule" style="margin-top:10px">${t.rule}</div><button class="cta ghost" data-topic="${t.id}">Dieses Thema üben</button></details>`;
    }).join('');
    el.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => startSession({ topic: b.dataset.topic, focus: 'grammar', minutes: 5 }));
    return;
  }
  const lessons = [...new Set(D.vocab.map(v => v.l))].sort((a, b) => b - a);
  el.innerHTML = `<input class="search" id="q" type="search" placeholder="Suchen (Spanisch oder Deutsch)" value="${esc(LIB.q)}">
    <div class="filters"><select id="fl"><option value="all">Alle Lektionen</option><option value="new">Neu diese Woche</option>${lessons.map(l => `<option value="${l}">${l ? 'Lektion ' + l : 'Grundwortschatz'}</option>`).join('')}</select>
    <select id="fs"><option value="all">Jeder Stand</option><option value="weak">Schwierig</option><option value="unseen">Noch nicht geübt</option><option value="known">Sitzt</option></select></div>
    <p class="muted small">Tipp: Wort antippen, um die Eselsbrücke zu sehen.</p>
    <ul class="vlist" id="vl"></ul>`;
  $('#fl').value = LIB.l; $('#fs').value = LIB.st;
  const draw = () => {
    const q = strip(LIB.q.toLowerCase());
    let list = D.vocab.filter(v => (LIB.l === 'all' || (LIB.l === 'new' ? isNew(v) : String(v.l) === LIB.l)) && (!q || strip(v.es.toLowerCase()).includes(q) || strip(v.de.toLowerCase()).includes(q)));
    if (LIB.st !== 'all') list = list.filter(v => { const s = vocabState(v), w = Math.max(weakness(card(`v:${v.id}:de`)), weakness(card(`v:${v.id}:es`))); return LIB.st === 'weak' ? w > 1 : LIB.st === 'unseen' ? s === 0 : s >= 4; });
    const n = list.length; list = list.slice(0, 200);
    $('#vl').innerHTML = (n ? `<li class="muted small">${n} Einträge${n > 200 ? ', die ersten 200' : ''}</li>` : '<li class="muted">Keine Treffer. Andere Schreibweise probieren?</li>') + list.map(v => {
      const s = Math.round(vocabState(v)), w = Math.max(weakness(card(`v:${v.id}:de`)), weakness(card(`v:${v.id}:es`))) > 1.5;
      return `<li><span class="lvl ${w ? 'weak' : 'l' + s}" title="Stufe ${s}"></span><button class="tap" data-mn="${v.id}"><div class="es">${esc(v.es)}</div><div class="muted small">${esc(v.de)}${v.l ? ' · L' + v.l : ''}</div></button>${spkBtn(v.es)}<div class="mnslot" data-slot="${v.id}" style="flex-basis:100%"></div></li>`;
    }).join('');
  };
  $('#q').oninput = e => { LIB.q = e.target.value; draw(); };
  $('#fl').onchange = e => { LIB.l = e.target.value; draw(); };
  $('#fs').onchange = e => { LIB.st = e.target.value; draw(); };
  draw();
}

/* ---------- Fortschritt ---------- */
function renderStats() {
  const vs = D.vocab.map(v => vocabState(v));
  const known = vs.filter(s => s >= 4).length, learning = vs.filter(s => s > 0 && s < 4).length;
  const mins = Math.round(Object.values(S.days).reduce((a, d) => a + (d.sec || 0), 0) / 60);
  const lessons = [...new Set(D.vocab.map(v => v.l))].sort((a, b) => a - b);
  const byL = lessons.map(l => { const vv = D.vocab.filter(v => v.l === l); const st = vv.map(vocabState); return { l, n: vv.length, m: st.filter(s => s >= 4).length, s: st.filter(s => s > 0 && s < 4).length }; });
  const weak = D.vocab.map(v => ({ v, w: Math.max(weakness(card(`v:${v.id}:de`)), weakness(card(`v:${v.id}:es`))) })).filter(x => x.w > 1).sort((a, b) => b.w - a.w).slice(0, 15);
  const gt = D.grammar.map(t => { const cs = t.items.map(i => card('g:' + i.id)).filter(Boolean); const r = cs.reduce((a, c) => a + c.r, 0), w = cs.reduce((a, c) => a + c.w, 0); return { t, r, w, p: r + w ? r / (r + w) : null }; }).filter(x => x.p !== null).sort((a, b) => a.p - b.p);
  const last14 = Array.from({ length: 14 }, (_, k) => { const d = S.days[todayKey(NOW() - (13 - k) * DAY)]; return d ? (d.sec || 0) / 60 : 0; });
  const mx = Math.max(5, ...last14);
  view().innerHTML = `<h1>Fortschritt</h1>
    <div class="leds"><div class="ledbox"><b>${fmtN(S.points || 0)}</b><span>Punkte</span></div><div class="ledbox"><b>${known}</b><span>Vokabeln sitzen</span></div><div class="ledbox"><b>${mins}</b><span>Minuten geübt</span></div></div>
    <p class="rank">Rang: <b>${rankOf(S.points || 0)[1]}</b> · beste Serie ${S.bestStreak || 0} · ${streak()} ${streak() === 1 ? 'Tag' : 'Tage'} in Folge</p>
    <h2>Letzte 14 Tage</h2>
    <svg viewBox="0 0 280 70" width="100%" role="img" aria-label="Übungsminuten der letzten 14 Tage">${last14.map((m, k) => `<rect x="${k * 20 + 2}" y="${62 - m / mx * 56}" width="15" height="${Math.max(1.5, m / mx * 56)}" rx="3" fill="${m ? 'var(--oro)' : 'var(--line)'}"><title>${Math.round(m)} Min</title></rect>`).join('')}<line x1="0" x2="280" y1="63.5" y2="63.5" stroke="var(--line)"/></svg>
    <h2>Vokabeln je Lektion</h2>
    <div class="legend"><span><i style="background:var(--win)"></i>sitzt</span><span><i style="background:var(--oro)"></i>in Arbeit</span><span>${learning} in Arbeit, ${D.vocab.length - known - learning} noch offen</span></div>
    <div class="bars">${byL.map(x => `<div class="bar"><span>${x.l ? 'L' + x.l : 'Basis'}</span><div class="track"><i class="m" style="width:${x.m / x.n * 100}%"></i><i class="s" style="width:${x.s / x.n * 100}%"></i></div><span class="n">${x.n}</span></div>`).join('')}</div>
    ${gt.length ? `<h2>Grammatik – schwächste Themen zuerst</h2><div class="bars">${gt.map(x => `<div class="bar" style="grid-template-columns:1fr 90px 44px"><span>${esc(x.t.title)}</span><div class="track"><i class="m" style="width:${x.p * 100}%"></i></div><span class="n">${Math.round(x.p * 100)} %</span></div>`).join('')}</div>` : ''}
    <h2>Schwierige Wörter</h2>
    ${weak.length ? `<ul class="vlist">${weak.map(x => `<li><span class="lvl weak"></span><div class="grow"><div class="es">${esc(x.v.es)}</div><div class="muted small">${esc(x.v.de)}</div></div>${spkBtn(x.v.es)}</li>`).join('')}</ul>` : '<p class="muted">Noch keine. Wörter, bei denen du oft danebenliegst, landen hier und kommen in Sessions häufiger dran.</p>'}`;
}

/* ---------- Einstellungen ---------- */
function renderMore() {
  const st = S.settings;
  view().innerHTML = `<h1>Einstellungen</h1>
    <div class="set"><label>Abfragerichtung</label>${seg('dir', [['mix', 'Gemischt'], ['de', 'Deutsch → Spanisch'], ['es', 'Spanisch → Deutsch']], st.dir)}</div>
    <div class="set"><label>Neue Vokabeln pro Runde</label>${seg('newPer', [[0, 'Automatisch'], [5, '5'], [10, '10'], [20, '20']], st.newPer)}</div>
    <div class="set"><label>Automaten-Sounds</label>${seg('sound', [['1', 'An'], ['', 'Aus']], st.sound ? '1' : '')}</div>
    <div class="set"><label>Sprechtempo</label>${seg('rate', [[0.7, 'Langsam'], [0.9, 'Normal'], [1, 'Schnell']], st.rate)}
      <label for="voice" style="margin-top:12px">Stimme</label><select id="voice"><option value="">Automatisch (es-ES)</option>${VOICES.map(v => `<option ${v.name === st.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
      <p class="muted small" style="margin-top:8px">Fehlt eine spanische Stimme: iPhone-Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Spanisch (Spanien) laden. Dann geht die Aussprache auch offline.</p>
      <button class="cta ghost" data-say="Hola, ¿qué tal? Vivo en Mallorca.">Stimme testen</button></div>
    <div class="set"><label>Inhalte</label><p class="small">Stand Lektion ${D.maxLesson}, ${fmtN(D.vocab.length)} Vokabeln mit Eselsbrücken, Version ${esc(D.meta.version || '')}. Neue Inhalte kommen jeden Montag automatisch und werden beim nächsten Öffnen mit Internet geladen.</p>
      <button class="cta ghost" id="upd">Jetzt nach Updates suchen</button></div>
    <div class="set"><label>Sicherung</label><p class="small muted">Fortschritt, Punkte und eigene Eselsbrücken liegen nur auf diesem iPhone. Die Sicherung kannst du dir z. B. als Notiz ablegen.</p>
      <button class="cta ghost" id="exp">Fortschritt kopieren</button>
      <textarea id="imp" placeholder="Gesicherten Fortschritt hier einfügen …" style="margin-top:10px"></textarea>
      <button class="cta ghost" id="impb">Fortschritt wiederherstellen</button></div>`;
  bindSeg(view(), (k, v) => { st[k] = ['newPer', 'rate'].includes(k) ? +v : k === 'sound' ? !!v : v; save(); if (k === 'sound' && st.sound) beep('coin'); });
  $('#voice').onchange = e => { st.voice = e.target.value; save(); };
  $('#upd').onclick = async () => { await checkUpdate(true); };
  $('#exp').onclick = async () => { await copy(JSON.stringify({ v: 2, cards: S.cards, days: S.days, settings: S.settings, points: S.points, bestStreak: S.bestStreak, mn: S.mn })); toast('Fortschritt kopiert'); };
  $('#impb').onclick = () => {
    try { const o = JSON.parse($('#imp').value); if (!o.cards) throw 0; S.cards = o.cards; S.days = o.days || {}; Object.assign(S.settings, o.settings || {}); S.points = o.points || S.points || 0; S.bestStreak = o.bestStreak || 0; S.mn = o.mn || S.mn || {}; save(); toast('Fortschritt wiederhergestellt'); go('stats'); }
    catch (e) { toast('Das ist keine gültige Sicherung. Bitte den kompletten Text einfügen.'); }
  };
}
function applyTheme() { }

/* ---------- Updates ---------- */
async function checkUpdate(manual) {
  try {
    const m = await (await fetch('data/meta.json', { cache: 'no-store' })).json();
    if (m.version !== D.meta.version) {
      const reg = await navigator.serviceWorker?.getRegistration(); reg?.update();
      await loadData();
      const n = D.vocab.filter(isNew).length;
      toast(`Neue Inhalte geladen${n ? ': ' + n + ' neue Vokabeln' : ''}`); if (TAB === 'home' && !SES) renderHome();
    } else if (manual) toast('Du bist auf dem neuesten Stand');
  } catch (e) { if (manual) toast('Keine Verbindung. Später noch mal versuchen.'); }
}

/* ---------- Start ---------- */
(async function init() {
  load(); applyTheme();
  try { await loadData(); }
  catch (e) { view().innerHTML = '<p class="loading">Inhalte konnten nicht geladen werden. Einmal mit Internet öffnen, danach läuft die App offline.</p>'; return; }
  if (S.seenVersion && S.seenVersion !== D.meta.version) { const n = D.vocab.filter(isNew).length; if (n) setTimeout(() => toast(`Neu diese Woche: ${n} Vokabeln`), 600); }
  S.seenVersion = D.meta.version; save();
  go('home');
  navigator.storage?.persist?.();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('App-Update bereit', { label: 'Neu laden', run: () => location.reload() });
        });
      });
    }).catch(() => {});
  }
  if (navigator.onLine) setTimeout(() => checkUpdate(false), 1500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.onLine) checkUpdate(false); });
})();
