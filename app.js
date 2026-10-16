(() => {
  'use strict';

  // ---------- constants ----------
  const KEY = 'gymlog.v1';
  const KG_PER_LB = 0.45359237;

  // Plate colors follow the Rogue bumper colors on the gym's rack.
  // h = plate height (% of the bar picture), wd = plate thickness in px.
  const PLATES = [
    { w: 55,  c: '#d23a3a', t: '#fff', h: 100, wd: 18 },
    { w: 45,  c: '#2457b8', t: '#fff', h: 100, wd: 16 },
    { w: 35,  c: '#f0c419', t: '#222', h: 100, wd: 14 },
    { w: 25,  c: '#2f9e44', t: '#fff', h: 100, wd: 12 },
    { w: 10,  c: '#1d1d1f', t: '#fff', h: 70,  wd: 9 },
    { w: 5,   c: '#e6e6e6', t: '#222', h: 54,  wd: 7 },
    { w: 2.5, c: '#9aa0a6', t: '#222', h: 42,  wd: 6 },
  ];
  const BARS = [
    { w: 45, n: '45 bar' },
    { w: 35, n: '35 bar' },
    { w: 25, n: 'EZ 25' },
    { w: 0,  n: 'No bar' },
  ];
  const TYPES = {
    barbell: 'Barbell (tap plates)',
    dumbbell: 'Dumbbells (per hand)',
    machine: 'Machine / Cable',
    assisted: 'Assisted (assist weight)',
    bodyweight: 'Bodyweight',
  };
  const DAYS = [
    { id: 'push', name: 'Mon · Push', dow: 1 },
    { id: 'pull', name: 'Tue · Pull', dow: 2 },
    { id: 'legs', name: 'Wed · Legs', dow: 3 },
    { id: 'other', name: 'Other', dow: null },
  ];
  const BASE = [
    { id: 'incline-bench', day: 'push', type: 'barbell', name: 'Incline Barbell Press', target: '3 × 10' },
    { id: 'flat-bench', day: 'push', type: 'barbell', name: 'Flat Barbell Press', target: '3 × 10' },
    { id: 'dips', day: 'push', type: 'assisted', name: 'Dips', target: '3 × 10 (instead of flat)' },
    { id: 'cable-fly', day: 'push', type: 'machine', name: 'Cable Flies', target: '3 × 10' },
    { id: 'db-shoulder-press', day: 'push', type: 'dumbbell', name: 'Seated DB Shoulder Press', target: '3 × 10' },
    { id: 'lateral-raise', day: 'push', type: 'dumbbell', name: 'DB Lateral Raises', target: '3 × 15' },
    { id: 'tricep-rope', day: 'push', type: 'machine', name: 'Overhead Tricep Extension (rope)', target: '3 × 12' },
    { id: 'cable-crunch', day: 'push', type: 'machine', name: 'Cable Crunches', target: '2 × 15' },

    { id: 'pullup', day: 'pull', type: 'assisted', name: 'Pull-Ups', target: '3 × 6–8' },
    { id: 'lat-pulldown', day: 'pull', type: 'machine', name: 'Lat Pulldown', target: '2 × 10' },
    { id: 'bent-row', day: 'pull', type: 'barbell', name: 'Bent-Over Row', target: '3 × 10' },
    { id: 'cable-row', day: 'pull', type: 'machine', name: 'Seated Cable Row', target: '3 × 12' },
    { id: 'face-pull', day: 'pull', type: 'machine', name: 'Face Pulls', target: '2 × 15' },
    { id: 'incline-curl', day: 'pull', type: 'dumbbell', name: 'Incline Dumbbell Curl', target: '3 × 10' },
    { id: 'hammer-curl', day: 'pull', type: 'dumbbell', name: 'Hammer Curl', target: '2 × 12' },

    { id: 'squat', day: 'legs', type: 'barbell', name: 'Barbell Back Squat', target: '4 × 8' },
    { id: 'deadlift', day: 'legs', type: 'barbell', name: 'Deadlift', target: '3 × 10' },
    { id: 'lunges', day: 'legs', type: 'dumbbell', name: 'DB Walking Lunges', target: '3 × 10 / leg' },
    { id: 'leg-ext', day: 'legs', type: 'machine', name: 'Leg Extension', target: '3 × 15' },
    { id: 'calf-raise', day: 'legs', type: 'machine', name: 'Standing Calf Raise', target: '3 × 12' },
  ];

  // ---------- storage ----------
  function emptyDb() { return { entries: [], custom: [], settings: {}, last: {} }; }
  function loadDb() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.entries)) return Object.assign(emptyDb(), s);
    } catch (e) { /* fall through */ }
    return emptyDb();
  }
  let db = loadDb();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('Could not save — export a backup!'); }
  }

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const round1 = n => Math.round(n * 10) / 10;
  const fmtW = w => String(round1(w));
  const kg = lb => (lb * KG_PER_LB).toFixed(1);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad2 = n => String(n).padStart(2, '0');
  const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fmtDate = ts => new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtShortDate = ts => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const plateInfo = w => PLATES.find(p => p.w === w) || { w, c: '#888', t: '#fff', h: 60, wd: 8 };
  const sum = a => a.reduce((x, y) => x + y, 0);

  const exercises = () => BASE.concat(db.custom);
  const exById = id => exercises().find(e => e.id === id) || { id, name: id, type: 'machine', day: 'other', target: '' };
  const entriesFor = id => db.entries.filter(e => e.ex === id).sort((a, b) => a.ts - b.ts);

  function platesFor(perSide) {
    const out = [];
    let left = perSide;
    for (const p of [45, 35, 25, 10, 5, 2.5]) {
      while (left >= p - 0.001) { out.push(p); left -= p; }
    }
    return out;
  }

  // Load used for progress math. Assisted = bodyweight − assist (or −assist when no bodyweight is set).
  function effLoad(e, ex) {
    const bw = Number(db.settings.bw) || 0;
    if (ex.type === 'assisted') return bw ? bw - e.w : -e.w;
    if (ex.type === 'bodyweight') return bw;
    return e.w;
  }
  const e1rm = (load, reps) => load > 0 ? load * (1 + reps / 30) : 0;

  function setText(e, ex) {
    if (ex.type === 'assisted') return (e.w > 0 ? `BW−${fmtW(e.w)}` : 'BW') + ` × ${e.reps}`;
    if (ex.type === 'bodyweight') return `BW × ${e.reps}`;
    return `${fmtW(e.w)} × ${e.reps}`;
  }

  // Group one exercise's entries into sessions (one per calendar day).
  function sessionsFor(id) {
    const map = new Map();
    for (const e of entriesFor(id)) {
      const k = dayKey(e.ts);
      if (!map.has(k)) map.set(k, { key: k, ts: e.ts, sets: [] });
      map.get(k).sets.push(e);
    }
    return [...map.values()];
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- tabs ----------
  let view = 'log';
  function showView(v) {
    view = v;
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
    render();
  }
  $$('.tab').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

  function render() {
    if (view === 'log') renderLog();
    if (view === 'history') renderHistory();
    if (view === 'progress') renderProgress();
    if (view === 'settings') renderSettings();
  }

  // =====================================================================
  // LOG VIEW
  // =====================================================================
  let currentDay = (DAYS.find(d => d.dow === new Date().getDay()) || {}).id || db.settings.day || 'push';
  let openEx = null;
  const drafts = {};

  function draft(id) {
    if (drafts[id]) return drafts[id];
    const ex = exById(id);
    const prev = entriesFor(id).pop();
    const saved = db.last[id];
    const targetReps = parseInt(((ex.target || '').match(/×\s*(\d+)/) || [])[1], 10);
    const d = { reps: prev ? prev.reps : (targetReps || 10) };
    if (ex.type === 'barbell') {
      const src = saved || (prev && prev.d) || { bar: 45, plates: prev ? platesFor((prev.w - 45) / 2) : [] };
      d.bar = src.bar;
      d.plates = [...src.plates];
    } else {
      d.w = prev ? prev.w : (ex.type === 'dumbbell' ? 20 : ex.type === 'assisted' ? 55 : 50);
    }
    return (drafts[id] = d);
  }

  function weightOf(ex, d) {
    if (ex.type === 'barbell') return d.bar + 2 * sum(d.plates);
    if (ex.type === 'bodyweight') return 0;
    return Math.max(0, Number(d.w) || 0);
  }

  function renderLog() {
    const dayRow = $('#dayRow');
    const visibleDays = DAYS.filter(d => d.id !== 'other' || exercises().some(e => e.day === 'other'));
    if (!visibleDays.some(d => d.id === currentDay)) currentDay = 'push';
    dayRow.innerHTML = visibleDays.map(d =>
      `<button class="day-chip ${d.id === currentDay ? 'on' : ''}" data-day="${d.id}">${esc(d.name)}</button>`).join('');

    const list = exercises().filter(e => e.day === currentDay);
    $('#exList').innerHTML = list.length ? list.map(cardHtml).join('')
      : '<div class="empty">No exercises for this day yet. Add one in Settings.</div>';
    tickRest();
  }

  function cardHtml(ex) {
    const today = dayKey(Date.now());
    const sess = sessionsFor(ex.id);
    const todays = sess.find(s => s.key === today);
    const lastSess = sess.filter(s => s.key !== today).pop();
    const n = todays ? todays.sets.length : 0;
    const targetSets = parseInt(ex.target, 10) || 0;
    const lastTxt = lastSess
      ? `Last (${fmtShortDate(lastSess.ts)}): <b>${lastSess.sets.map(e => setText(e, ex)).join(', ')}</b>`
      : 'No history yet';
    const open = openEx === ex.id;
    const lastTs = todays ? todays.sets[todays.sets.length - 1].ts : 0;

    return `<div class="ex ${open ? 'open' : ''}" data-id="${esc(ex.id)}">
      <div class="ex-head" data-act="toggle">
        <div class="info">
          <div class="ex-name">${esc(ex.name)}</div>
          <div class="ex-meta">${esc(ex.target || '')}${ex.target ? ' · ' : ''}${lastTxt}</div>
        </div>
        <div class="count ${targetSets && n >= targetSets ? 'done' : ''}" title="Sets today">${n}${targetSets ? '/' + targetSets : ''}</div>
      </div>
      <div class="ex-body">${open ? bodyHtml(ex, todays, lastTs) : ''}</div>
    </div>`;
  }

  function bodyHtml(ex, todays, lastTs) {
    const d = draft(ex.id);
    const sets = todays ? todays.sets : [];
    const chips = sets.map((e, i) =>
      `<span class="set-chip ${e.pr ? 'pr' : ''}">${i + 1}. ${setText(e, ex)}${e.pr ? ' 🏆' : ''}
        <span class="t">${fmtTime(e.ts)}</span>
        <button class="x" data-act="del" data-entry="${e.id}" aria-label="Delete set">×</button></span>`).join('');

    let editor = '';
    if (ex.type === 'barbell') editor = barbellEditor(d);
    else if (ex.type !== 'bodyweight') editor = numberEditor(ex, d);
    else editor = `<div class="total"><span class="big">Bodyweight</span></div>`;

    const repChips = [5, 6, 8, 10, 12, 15].map(r =>
      `<button class="chip ${d.reps === r ? 'on' : ''}" data-act="setreps" data-v="${r}">${r}</button>`).join('');

    return `
      ${sets.length ? `<div class="sets">${chips}</div>` : ''}
      ${lastTs ? `<div class="rest">Rest: <span data-since="${lastTs}"></span> since last set</div>` : ''}
      ${editor}
      <div class="label">Reps</div>
      <div class="stepper">
        <button data-act="reps" data-d="-1" aria-label="One less rep">−</button>
        <input data-field="reps" type="number" inputmode="numeric" min="0" value="${d.reps}" aria-label="Reps">
        <button data-act="reps" data-d="1" aria-label="One more rep">+</button>
      </div>
      <div class="chips">${repChips}</div>
      <button class="btn primary log-btn" data-act="log">Log set ${sets.length + 1} · ${summaryOf(ex, d)}</button>`;
  }

  function summaryOf(ex, d) {
    const w = weightOf(ex, d);
    if (ex.type === 'assisted') return (w > 0 ? `assist ${fmtW(w)}` : 'no assist') + ` × ${d.reps}`;
    if (ex.type === 'bodyweight') return `BW × ${d.reps}`;
    return `${fmtW(w)} lb × ${d.reps}`;
  }

  function barbellEditor(d) {
    const sorted = [...d.plates].sort((a, b) => b - a);
    const plateEl = w => {
      const p = plateInfo(w);
      return `<div class="plate" data-act="rmplate" data-w="${w}" title="${w} lb — tap to remove"
        style="height:${p.h * 0.9}%;width:${p.wd}px;background:${p.c};color:${p.t}">${p.wd >= 12 ? fmtW(w) : ''}</div>`;
    };
    const left = sorted.map(plateEl).reverse().join('');
    const right = sorted.map(plateEl).join('');
    const perSide = sum(d.plates);
    const total = d.bar + 2 * perSide;
    const detail = sorted.length
      ? `${d.bar ? d.bar + ' bar + ' : ''}${sorted.map(fmtW).join(' + ')} per side (${fmtW(perSide)}/side)`
      : (d.bar ? 'Empty bar' : 'No plates');

    return `
      <div class="label">Bar</div>
      <div class="seg">${BARS.map(b =>
        `<button class="${d.bar === b.w ? 'on' : ''}" data-act="bar" data-w="${b.w}">${b.n}</button>`).join('')}</div>
      <div class="label">Loaded bar</div>
      <div class="bar-viz">
        <div class="bar-side left"><div class="sleeve sleeve-out"></div>${left}<div class="collar"></div></div>
        <div class="shaft ${d.bar ? '' : 'none'}"></div>
        <div class="bar-side right"><div class="collar"></div>${right}<div class="sleeve sleeve-out"></div></div>
      </div>
      <div class="total"><span class="big">${fmtW(total)} lb</span><span class="kg">${kg(total)} kg</span>
        <span class="detail">${detail}</span></div>
      <div class="label">Tap a plate to add a pair (one each side)</div>
      <div class="plate-btns">${PLATES.map(p =>
        `<button class="plate-btn" data-act="addplate" data-w="${p.w}" style="background:${p.c};color:${p.t}"
          aria-label="Add ${p.w} lb plates">${fmtW(p.w)}</button>`).join('')}</div>
      <div class="inline" style="margin-top:10px">
        <button class="btn" data-act="undoplate">Undo plate</button>
        <button class="btn" data-act="clearplates">Clear plates</button>
      </div>
      <div class="hint">Tap a plate on the bar to take it off.</div>`;
  }

  function numberEditor(ex, d) {
    const w = weightOf(ex, d);
    const isA = ex.type === 'assisted';
    const isDb = ex.type === 'dumbbell';
    const bw = Number(db.settings.bw) || 0;
    let quick;
    if (isDb) quick = [5, 10, 12.5, 15, 17.5, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
    else if (isA) quick = [0, 10, 25, 40, 55, 70, 85, 100];
    else {
      const base = Math.round(w / 5) * 5;
      quick = [];
      for (let v = base - 20; v <= base + 20; v += 5) if (v >= 0) quick.push(v);
    }
    const steps = isDb ? [2.5, 5] : [2.5, 5, 10];
    const label = isDb ? 'Dumbbell weight (each hand)' : isA ? 'Assist weight' : 'Stack weight';
    let detail = '';
    if (isDb) detail = `per hand · ${fmtW(w * 2)} lb both hands`;
    if (isA) detail = w === 0 ? 'No assist — full bodyweight' :
      bw ? `you lift ≈ ${fmtW(bw - w)} lb (bodyweight ${fmtW(bw)})` : 'Set your bodyweight in Settings to see effective load';

    return `
      <div class="label">${label}</div>
      <div class="stepper multi">
        ${steps.slice().reverse().map(s => `<button data-act="w" data-d="-${s}">−${s}</button>`).join('')}
        <input data-field="w" type="number" inputmode="decimal" min="0" step="0.5" value="${fmtW(w)}" aria-label="${label}">
        ${steps.map(s => `<button data-act="w" data-d="${s}">+${s}</button>`).join('')}
      </div>
      <div class="chips">${quick.map(v =>
        `<button class="chip ${round1(w) === v ? 'on' : ''}" data-act="setw" data-v="${v}">${isA && v === 0 ? 'None' : fmtW(v)}</button>`).join('')}</div>
      <div class="total"><span class="big">${isA ? (w ? 'Assist ' : '') : ''}${isA && !w ? 'Bodyweight' : fmtW(w) + ' lb'}</span>
        ${isA && !w ? '' : `<span class="kg">${kg(w)} kg</span>`}
        ${detail ? `<span class="detail">${detail}</span>` : ''}</div>`;
  }

  function logSet(id) {
    const ex = exById(id);
    const d = draft(id);
    const reps = parseInt(d.reps, 10);
    if (!(reps > 0)) { toast('Enter how many reps'); return; }
    const w = weightOf(ex, d);
    const e = { id: uid(), ts: Date.now(), ex: id, w, reps };
    if (ex.type === 'barbell') {
      e.d = { bar: d.bar, plates: [...d.plates] };
      db.last[id] = { bar: d.bar, plates: [...d.plates] };
    }
    const prev = entriesFor(id);
    const best = Math.max(0, ...prev.map(p => e1rm(effLoad(p, ex), p.reps)));
    const mine = e1rm(effLoad(e, ex), reps);
    if (prev.length && mine > best + 0.01) e.pr = true;
    db.entries.push(e);
    save();
    renderLog();
    const kgTxt = ex.type === 'barbell' || ex.type === 'dumbbell' || ex.type === 'machine' ? ` (${kg(w)} kg)` : '';
    toast(`${e.pr ? '🏆 New PR! ' : 'Logged: '}${setText(e, ex)}${kgTxt}`);
  }

  function deleteEntry(entryId) {
    const e = db.entries.find(x => x.id === entryId);
    if (!e) return;
    if (!confirm(`Delete ${exById(e.ex).name}: ${setText(e, exById(e.ex))} (${fmtDate(e.ts)} ${fmtTime(e.ts)})?`)) return;
    db.entries = db.entries.filter(x => x.id !== entryId);
    save();
    render();
  }

  $('#dayRow').addEventListener('click', ev => {
    const b = ev.target.closest('[data-day]');
    if (!b) return;
    currentDay = b.dataset.day;
    db.settings.day = currentDay;
    save();
    openEx = null;
    renderLog();
  });

  $('#exList').addEventListener('click', ev => {
    const actEl = ev.target.closest('[data-act]');
    const card = ev.target.closest('.ex');
    if (!actEl || !card) return;
    const id = card.dataset.id;
    const act = actEl.dataset.act;
    const d = draft(id);
    const v = Number(actEl.dataset.v ?? actEl.dataset.w ?? actEl.dataset.d);

    switch (act) {
      case 'toggle': openEx = openEx === id ? null : id; break;
      case 'addplate': d.plates.push(v); break;
      case 'rmplate': { const i = d.plates.indexOf(v); if (i >= 0) d.plates.splice(i, 1); break; }
      case 'undoplate': d.plates.pop(); break;
      case 'clearplates': d.plates = []; break;
      case 'bar': d.bar = v; break;
      case 'w': d.w = Math.max(0, round1((Number(d.w) || 0) + v)); break;
      case 'setw': d.w = v; break;
      case 'reps': d.reps = Math.max(0, (parseInt(d.reps, 10) || 0) + v); break;
      case 'setreps': d.reps = v; break;
      case 'log': logSet(id); return;
      case 'del': deleteEntry(actEl.dataset.entry); return;
      default: return;
    }
    renderLog();
  });

  $('#exList').addEventListener('change', ev => {
    const f = ev.target.dataset.field;
    const card = ev.target.closest('.ex');
    if (!f || !card) return;
    const d = draft(card.dataset.id);
    if (f === 'reps') d.reps = Math.max(0, parseInt(ev.target.value, 10) || 0);
    if (f === 'w') d.w = Math.max(0, round1(Number(ev.target.value) || 0));
    renderLog();
  });

  // Rest timer ticks.
  function tickRest() {
    $$('[data-since]').forEach(el => {
      const s = Math.max(0, Math.floor((Date.now() - Number(el.dataset.since)) / 1000));
      el.textContent = s >= 3600 ? `${Math.floor(s / 3600)}h ${pad2(Math.floor(s / 60) % 60)}m` : `${Math.floor(s / 60)}:${pad2(s % 60)}`;
    });
  }
  setInterval(tickRest, 1000);

  // =====================================================================
  // HISTORY VIEW
  // =====================================================================
  function renderHistory() {
    const el = $('#historyList');
    if (!db.entries.length) { el.innerHTML = '<div class="empty">Nothing logged yet.</div>'; return; }
    const byDay = new Map();
    for (const e of [...db.entries].sort((a, b) => b.ts - a.ts)) {
      const k = dayKey(e.ts);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(e);
    }
    el.innerHTML = [...byDay.values()].map(list => {
      const byEx = new Map();
      for (const e of [...list].reverse()) {
        if (!byEx.has(e.ex)) byEx.set(e.ex, []);
        byEx.get(e.ex).push(e);
      }
      const est = list.some(e => e.est);
      return `<div class="day-group"><h3>${fmtDate(list[0].ts)}${est ? '<span class="badge">est. date</span>' : ''}</h3>
        ${[...byEx.entries()].map(([exId, sets]) => {
          const ex = exById(exId);
          const vol = sum(sets.map(s => Math.max(0, effLoad(s, ex)) * s.reps));
          return `<div class="hist-ex"><b>${esc(ex.name)}</b>
            <span class="muted">· ${sets.length} sets${vol ? ` · ${Math.round(vol).toLocaleString()} lb volume` : ''}</span>
            <div class="sets">${sets.map(s => `<span class="set-chip ${s.pr ? 'pr' : ''}">${setText(s, ex)}${s.pr ? ' 🏆' : ''}
              ${s.est ? '' : `<span class="t">${fmtTime(s.ts)}</span>`}
              <button class="x" data-del="${s.id}" aria-label="Delete set">×</button></span>`).join('')}</div></div>`;
        }).join('')}</div>`;
    }).join('');
  }
  $('#historyList').addEventListener('click', ev => {
    const b = ev.target.closest('[data-del]');
    if (b) deleteEntry(b.dataset.del);
  });

  // =====================================================================
  // PROGRESS VIEW
  // =====================================================================
  let progEx = null;
  let progMetric = 'top';

  function metricsFor(ex) {
    const bw = Number(db.settings.bw) || 0;
    const top = s => Math.max(...s.sets.map(e => effLoad(e, ex)));
    const reps = s => sum(s.sets.map(e => e.reps));
    if (ex.type === 'assisted' && !bw) {
      return [
        { id: 'top', label: 'Least assist', fn: s => -top(s), fmt: v => v ? `${fmtW(v)} lb assist` : 'no assist', lowerBetter: true },
        { id: 'reps', label: 'Total reps', fn: reps, fmt: v => `${v} reps` },
      ];
    }
    const list = [
      { id: 'top', label: ex.type === 'assisted' || ex.type === 'bodyweight' ? 'Effective top load' : 'Top set', fn: top, fmt: v => `${fmtW(v)} lb` },
      { id: 'e1rm', label: 'Est. 1-rep max', fn: s => Math.max(...s.sets.map(e => e1rm(effLoad(e, ex), e.reps))), fmt: v => `${Math.round(v)} lb` },
      { id: 'vol', label: 'Volume', fn: s => sum(s.sets.map(e => Math.max(0, effLoad(e, ex)) * e.reps)), fmt: v => `${Math.round(v).toLocaleString()} lb` },
    ];
    if (ex.type === 'assisted' || ex.type === 'bodyweight') list.push({ id: 'reps', label: 'Total reps', fn: reps, fmt: v => `${v} reps` });
    return list;
  }

  function renderProgress() {
    const withData = exercises().filter(e => db.entries.some(x => x.ex === e.id));
    const sel = $('#progEx');
    if (!withData.length) {
      sel.innerHTML = '';
      $('#progMetric').innerHTML = '';
      $('#progBody').innerHTML = '<div class="empty">Log some sets (or load your past notes in Settings) to see progress.</div>';
      return;
    }
    if (!withData.some(e => e.id === progEx)) progEx = withData[0].id;
    sel.innerHTML = DAYS.map(d => {
      const opts = withData.filter(e => e.day === d.id);
      return opts.length ? `<optgroup label="${esc(d.name)}">${opts.map(e =>
        `<option value="${esc(e.id)}" ${e.id === progEx ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</optgroup>` : '';
    }).join('');

    const ex = exById(progEx);
    const metrics = metricsFor(ex);
    if (!metrics.some(m => m.id === progMetric)) progMetric = metrics[0].id;
    const m = metrics.find(x => x.id === progMetric);
    $('#progMetric').innerHTML = metrics.map(x =>
      `<button class="${x.id === progMetric ? 'on' : ''}" data-m="${x.id}">${x.label}</button>`).join('');

    const sess = sessionsFor(ex.id);
    const pts = sess.map(s => ({ t: s.ts, v: m.fn(s), s }));
    const first = pts[0].v, last = pts[pts.length - 1].v;
    const bestPt = pts.reduce((a, b) => (m.lowerBetter ? b.v < a.v : b.v > a.v) ? b : a);
    const allSets = sess.flatMap(s => s.sets);
    const bestSet = allSets.reduce((a, b) => {
      const la = effLoad(a, ex), lb = effLoad(b, ex);
      return lb > la || (lb === la && b.reps > a.reps) ? b : a;
    });
    const diff = last - first;
    const better = m.lowerBetter ? -diff : diff;

    $('#progBody').innerHTML = `
      <div class="tiles">
        <div class="tile"><div class="k">Best ${esc(m.label.toLowerCase())}</div><div class="v">${m.fmt(bestPt.v)}</div><div class="s">${fmtShortDate(bestPt.t)}</div></div>
        <div class="tile"><div class="k">Heaviest set</div><div class="v">${setText(bestSet, ex)}</div><div class="s">${fmtShortDate(bestSet.ts)}</div></div>
        <div class="tile"><div class="k">Change since first</div><div class="v">${better > 0 ? '▲' : better < 0 ? '▼' : '•'} ${m.fmt(Math.abs(diff)).replace(/^-/, '')}</div><div class="s">${sess.length} sessions</div></div>
      </div>
      <div class="chart"><h3>${esc(ex.name)} — ${esc(m.label)}${m.lowerBetter ? ' (lower is better)' : ''}</h3><div id="chartHost"></div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Sets</th><th class="num">${esc(m.label)}</th></tr></thead>
        <tbody>${[...pts].reverse().map(p => `<tr>
          <td class="date">${fmtShortDate(p.t)}${p.s.sets.some(e => e.est) ? '<span class="badge">est.</span>' : ''}</td>
          <td>${p.s.sets.map(e => setText(e, ex)).join(', ')}</td>
          <td class="num">${m.fmt(p.v)}</td></tr>`).join('')}</tbody>
      </table></div>`;

    drawChart($('#chartHost'), pts, m);
  }

  function niceTicks(min, max, count) {
    if (min === max) { min -= 5; max += 5; }
    const raw = (max - min) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= raw);
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(round1(v));
    return ticks;
  }

  function drawChart(host, pts, m) {
    const W = Math.max(280, host.clientWidth || 320), H = 220;
    const P = { l: 52, r: 14, t: 12, b: 26 };
    const vals = pts.map(p => p.v);
    const ticks = niceTicks(Math.min(...vals), Math.max(...vals), 4);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const x = t => pts.length === 1 ? (P.l + W - P.r) / 2 : P.l + (t - t0) / (t1 - t0) * (W - P.l - P.r);
    const y = v => P.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - P.t - P.b);
    const yLabel = v => m.id === 'reps' ? String(v) : (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : fmtW(v));

    const xTicks = pts.length <= 1 ? pts : [pts[0], pts[Math.floor((pts.length - 1) / 2)], pts[pts.length - 1]]
      .filter((p, i, a) => a.indexOf(p) === i);

    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
      ${ticks.map(v => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/>
        <text class="axis-t" x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${yLabel(v)}</text>`).join('')}
      ${xTicks.map((p, i) => `<text class="axis-t" x="${x(p.t)}" y="${H - 6}"
        text-anchor="${xTicks.length > 1 && i === 0 ? 'start' : xTicks.length > 1 && i === xTicks.length - 1 ? 'end' : 'middle'}">${fmtShortDate(p.t)}</text>`).join('')}
      <polyline class="line" points="${pts.map(p => `${x(p.t)},${y(p.v)}`).join(' ')}"/>
      <line class="cross" id="cross" y1="${P.t}" y2="${H - P.b}" visibility="hidden"/>
      ${pts.map((p, i) => `<circle class="dot" data-i="${i}" cx="${x(p.t)}" cy="${y(p.v)}" r="4.5"/>`).join('')}
      <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" id="hit"/>
    </svg>`;

    const svg = $('svg', host), cross = $('#cross', host), tip = $('#tooltip');
    const pick = ev => {
      const r = svg.getBoundingClientRect();
      const mx = (ev.clientX - r.left) * (W / r.width);
      let best = 0;
      pts.forEach((p, i) => { if (Math.abs(x(p.t) - mx) < Math.abs(x(pts[best].t) - mx)) best = i; });
      const p = pts[best];
      cross.setAttribute('x1', x(p.t)); cross.setAttribute('x2', x(p.t));
      cross.setAttribute('visibility', 'visible');
      $$('.dot', svg).forEach(c => c.setAttribute('r', Number(c.dataset.i) === best ? 7 : 4.5));
      const ex = exById(progEx);
      tip.innerHTML = `<b>${fmtDate(p.t)}</b>${p.s.sets.some(e => e.est) ? ' (est.)' : ''}<br>${esc(m.label)}: ${m.fmt(p.v)}<br>
        <span style="opacity:.8">${p.s.sets.map(e => setText(e, ex)).join(', ')}</span>`;
      tip.hidden = false;
      const tx = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, ev.clientX - tip.offsetWidth / 2));
      const ty = r.top + y(p.v) * (r.height / H) - tip.offsetHeight - 14;
      tip.style.left = tx + 'px';
      tip.style.top = Math.max(8, ty) + 'px';
    };
    const hide = () => {
      tip.hidden = true;
      cross.setAttribute('visibility', 'hidden');
      $$('.dot', svg).forEach(c => c.setAttribute('r', 4.5));
    };
    svg.addEventListener('pointermove', pick);
    svg.addEventListener('pointerdown', pick);
    svg.addEventListener('pointerleave', hide);
  }

  $('#progEx').addEventListener('change', ev => { progEx = ev.target.value; renderProgress(); });
  $('#progMetric').addEventListener('click', ev => {
    const b = ev.target.closest('[data-m]');
    if (b) { progMetric = b.dataset.m; renderProgress(); }
  });
  document.addEventListener('scroll', () => { $('#tooltip').hidden = true; }, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (view === 'progress') renderProgress(); }, 150);
  });

  // =====================================================================
  // SETTINGS VIEW
  // =====================================================================
  function renderSettings() {
    $('#bwInput').value = db.settings.bw || '';
    $('#customType').innerHTML = Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    $('#customDay').innerHTML = DAYS.map(d => `<option value="${d.id}" ${d.id === currentDay ? 'selected' : ''}>${d.name}</option>`).join('');
    $('#customList').innerHTML = db.custom.map(c => `<div class="custom-item">
      <span><b>${esc(c.name)}</b> <span class="muted">· ${esc(DAYS.find(d => d.id === c.day)?.name || c.day)} · ${esc(TYPES[c.type])}</span></span>
      <button class="btn" data-rmcustom="${esc(c.id)}">Remove</button></div>`).join('');
  }

  $('#bwSave').addEventListener('click', () => {
    const v = Number($('#bwInput').value);
    db.settings.bw = v > 0 ? round1(v) : 0;
    save();
    toast(v > 0 ? `Bodyweight saved: ${fmtW(v)} lb (${kg(v)} kg)` : 'Bodyweight cleared');
  });

  $('#customForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const name = String(f.get('name')).trim();
    if (!name) return;
    db.custom.push({ id: 'c-' + uid(), name, type: f.get('type'), day: f.get('day'), target: String(f.get('target') || '').trim() });
    save();
    ev.target.reset();
    renderSettings();
    toast(`Added ${name}`);
  });

  $('#customList').addEventListener('click', ev => {
    const b = ev.target.closest('[data-rmcustom]');
    if (!b) return;
    const c = db.custom.find(x => x.id === b.dataset.rmcustom);
    if (!c || !confirm(`Remove "${c.name}" from your plan? Logged sets stay in your history.`)) return;
    db.custom = db.custom.filter(x => x !== c);
    save();
    renderSettings();
  });

  function seedEntries() {
    const out = [];
    const order = BASE.map(e => e.id);
    for (const [exId, sessions] of Object.entries(window.SEED || {})) {
      const ex = exById(exId);
      const dow = (DAYS.find(d => d.id === ex.day) || {}).dow || 1;
      sessions.forEach((sets, i) => {
        // Last session lands on the week of Mon Oct 12, 2026; earlier ones one week apart.
        const d = new Date(2026, 9, 12 + (dow - 1) - (sessions.length - 1 - i) * 7, 18, 0, 0);
        const start = d.getTime() + Math.max(0, order.indexOf(exId)) * 12 * 60000;
        sets.forEach(([w, reps], j) => {
          const e = { id: `seed-${exId}-${i}-${j}`, ts: start + j * 3 * 60000, ex: exId, w, reps, est: 1 };
          if (ex.type === 'barbell') e.d = { bar: 45, plates: platesFor((w - 45) / 2) };
          out.push(e);
        });
      });
    }
    return out;
  }

  $('#loadSeed').addEventListener('click', () => {
    const have = new Set(db.entries.map(e => e.id));
    const add = seedEntries().filter(e => !have.has(e.id));
    db.entries.push(...add);
    save();
    toast(add.length ? `Loaded ${add.length} sets from your notes` : 'Past notes are already loaded');
  });

  $('#removeSeed').addEventListener('click', () => {
    const n = db.entries.filter(e => String(e.id).startsWith('seed-')).length;
    if (!n || !confirm(`Remove ${n} sets that came from your past notes?`)) return;
    db.entries = db.entries.filter(e => !String(e.id).startsWith('seed-'));
    save();
    toast(`Removed ${n} sets`);
  });

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const stamp = () => dayKey(Date.now());

  $('#exportJson').addEventListener('click', () =>
    download(`gym-log-${stamp()}.json`, JSON.stringify(db, null, 2), 'application/json'));

  $('#exportCsv').addEventListener('click', () => {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['timestamp', 'date', 'time', 'day', 'exercise', 'type', 'weight_lb', 'weight_kg', 'reps', 'bar_lb', 'plates_per_side', 'estimated_date']];
    for (const e of [...db.entries].sort((a, b) => a.ts - b.ts)) {
      const ex = exById(e.ex);
      rows.push([new Date(e.ts).toISOString(), dayKey(e.ts), fmtTime(e.ts), ex.day, ex.name, ex.type, e.w, kg(e.w), e.reps,
        e.d ? e.d.bar : '', e.d ? e.d.plates.join('+') : '', e.est ? 'yes' : '']);
    }
    download(`gym-log-${stamp()}.csv`, rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv');
  });

  $('#importJson').addEventListener('change', async ev => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.entries)) throw new Error('not a backup');
      const have = new Set(db.entries.map(e => e.id));
      const newEntries = data.entries.filter(e => e && e.id && e.ex && !have.has(e.id));
      db.entries.push(...newEntries);
      const haveC = new Set(db.custom.map(c => c.id));
      db.custom.push(...(data.custom || []).filter(c => c && c.id && !haveC.has(c.id)));
      db.settings = Object.assign({}, data.settings || {}, db.settings);
      db.last = Object.assign({}, data.last || {}, db.last);
      save();
      render();
      toast(`Imported ${newEntries.length} sets`);
    } catch (e) {
      toast('That file is not a Gym Log backup');
    }
  });

  $('#clearAll').addEventListener('click', () => {
    if (!confirm('Delete ALL logged sets, custom exercises and settings on this device?')) return;
    if (!confirm('Really? This cannot be undone. Export a backup first if unsure.')) return;
    db = emptyDb();
    save();
    render();
    toast('All data deleted');
  });

  // ---------- start ----------
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
