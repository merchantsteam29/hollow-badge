import * as THREE from 'three';
import * as B from './builders.js';
import { CASES } from './cases.js';
import { Sound } from './audio.js';
import { openPrint } from './fingerprint.js';

const $ = (id) => document.getElementById(id);
const sound = new Sound();

// ---------- settings ----------
const settings = (() => {
  const d = { bright: 1.3, sens: 1.0, vol: 0.8, quality: 'medium', qualityManual: false };
  try { return { ...d, ...JSON.parse(localStorage.getItem('hb_settings') || '{}') }; } catch { return d; }
})();
const saveSettings = () => { try { localStorage.setItem('hb_settings', JSON.stringify(settings)); } catch {} };
const results = (() => { try { return JSON.parse(localStorage.getItem('hb_results') || '{}'); } catch { return {}; } })();
const saveResults = () => { try { localStorage.setItem('hb_results', JSON.stringify(results)); } catch {} };

// ---------- graphics quality ----------
// ratio: render resolution, shadow: flashlight shadow map size (0 = off), pool: real point lights, rain: drop count
const QUALITY = {
  low: { ratio: () => 0.7, shadow: 0, pool: 3, rain: 900, grain: false },
  medium: { ratio: () => Math.min(devicePixelRatio, 1), shadow: 512, pool: 4, rain: 1700, grain: true },
  high: { ratio: () => Math.min(devicePixelRatio, 1.5), shadow: 1024, pool: 6, rain: 2600, grain: true },
};
if (!QUALITY[settings.quality]) settings.quality = 'medium';
const Q = () => QUALITY[settings.quality];

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: settings.quality !== 'low', powerPreference: 'high-performance' });
renderer.setPixelRatio(Q().ratio());
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = settings.bright;
renderer.shadowMap.enabled = Q().shadow > 0;
renderer.shadowMap.type = THREE.PCFShadowMap;
$('game').appendChild(renderer.domElement);
const canvas = renderer.domElement;

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 160);
camera.rotation.order = 'YXZ';
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// flashlight on the camera
const flash = new THREE.SpotLight(0xfff2dc, 160, 38, 0.52, 0.5, 1.3);
flash.position.set(0.25, -0.2, 0.1);
flash.castShadow = Q().shadow > 0; flash.shadow.mapSize.set(Q().shadow || 512, Q().shadow || 512); flash.shadow.camera.near = 0.2; flash.shadow.bias = -0.0005;
const flashTarget = new THREE.Object3D(); flashTarget.position.set(0.1, -0.15, -6);
camera.add(flash, flashTarget); flash.target = flashTarget;

// glint texture for unexamined clues
const glintTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,240,210,1)'); r.addColorStop(0.25, 'rgba(255,220,160,0.45)'); r.addColorStop(1, 'rgba(255,220,160,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();

function applyQuality() {
  const q = Q();
  renderer.setPixelRatio(q.ratio()); renderer.setSize(innerWidth, innerHeight);
  const sh = q.shadow > 0;
  const changed = sh !== renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = sh; flash.castShadow = sh;
  if (sh && flash.shadow.mapSize.x !== q.shadow) { flash.shadow.mapSize.set(q.shadow, q.shadow); if (flash.shadow.map) { flash.shadow.map.dispose(); flash.shadow.map = null; } }
  $('grain').classList.toggle('hidden', !q.grain);
  if (scene && G) {
    if (changed) scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    buildPool();
  }
}

// Fixed pool of real point lights, moved to the nearest light sources every frame.
function buildPool() {
  for (const L of G.pool || []) scene.remove(L);
  G.pool = [];
  for (let i = 0; i < Q().pool; i++) { const L = new THREE.PointLight(0xffffff, 0, 15, 1.5); scene.add(L); G.pool.push(L); }
}
function updatePool() {
  const cam = camera.position, list = [];
  for (const s of G.lights) { if (s.cur > 0.01) { s._d = s.pos.distanceToSquared(cam); list.push(s); } }
  list.sort((a, b) => a._d - b._d);
  G.pool.forEach((L, i) => {
    const s = list[i];
    if (!s) { L.intensity = 0; return; }
    const d = Math.sqrt(s._d), fade = d < 22 ? 1 : Math.max(0, 1 - (d - 22) / 12);
    L.position.copy(s.pos); L.color.copy(s.color); L.distance = s.dist; L.intensity = s.cur * fade;
  });
}

// ---------- state ----------
let scene = null, G = null, state = 'warning';
const keys = {};

function disposeScene(s) {
  if (!s) return;
  s.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }
  });
  B.clearCache();
}

function makeRain(count) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 40, y = Math.random() * 20, z = (Math.random() - 0.5) * 40;
    pos.set([x, y, z, x + 0.03, y + 0.45, z], i * 6);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x8796a8, transparent: true, opacity: 0.35, fog: true }));
  lines.frustumCulled = false;
  return lines;
}

// ---------- case lifecycle ----------
function startCase(def) {
  disposeScene(scene);
  $('menu').classList.add('hidden'); $('pause').classList.add('hidden');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030407);
  scene.fog = new THREE.FogExp2(0x030407, def.fog);
  scene.add(new THREE.HemisphereLight(0x22304a, 0x080606, 1.1));
  const moon = new THREE.DirectionalLight(0x5a6e96, 0.45); moon.position.set(-30, 50, 10); scene.add(moon);
  scene.add(camera);

  G = {
    def, clues: new Set(), asked: new Set(), flags: {}, colliders: [], lamps: [], lights: [], anims: [], interacts: [], pool: [],
    pos: new THREE.Vector3(def.spawn.x, 0, def.spawn.z), yaw: def.spawn.yaw, pitch: 0, bob: 0, stepAcc: 0,
    ui: null, cut: null, flashOn: true, flashFlicker: 0, t: 0, zone: null, ambience: null, nearest: null, perf: { t: 0, n: 0, checks: 0 },
  };
  B.init({ scene, colliders: G.colliders, lamps: G.lamps, lights: G.lights, anims: G.anims });
  G.rain = makeRain(Q().rain); scene.add(G.rain);
  def.build(api);
  B.staticBatch(scene);
  buildPool();
  flash.intensity = 160;
  $('caseLabel').textContent = `${def.num} · ${def.place.toUpperCase()}`;
  $('toasts').innerHTML = '';
  refresh();
  sound.ambience(def.rain, 0.05);
  playIntro(def);
}

function playIntro(def) {
  state = 'intro';
  const el = $('intro'), lines = $('introLines');
  el.classList.remove('hidden'); lines.innerHTML = '';
  def.intro.forEach((t, i) => {
    const p = document.createElement('p'); p.textContent = t; p.className = i < 2 ? 'big' : '';
    p.style.animationDelay = `${i * 1.6}s`; lines.appendChild(p);
  });
  const go = document.createElement('button'); go.className = 'btn ghost'; go.textContent = 'Begin investigation';
  go.style.animationDelay = `${def.intro.length * 1.6}s`; go.classList.add('fadein');
  go.onclick = () => { el.classList.add('hidden'); state = 'play'; $('hud').classList.remove('hidden'); lock(); };
  lines.appendChild(go);
}

// ---------- API given to cases ----------
const api = {
  B, sound,
  get scene() { return scene; },
  get flags() { return G.flags; },
  get lamps() { return G.lamps; },
  get anims() { return G.anims; },
  has: (id) => G.clues.has(id),
  interact(o) {
    const it = { radius: 2.3, ...o, pos: new THREE.Vector3(...o.pos), alive: true };
    if (o.glint) {
      it.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
      it.sprite.scale.setScalar(0.45); it.sprite.position.copy(it.pos); scene.add(it.sprite);
    }
    G.interacts.push(it); return it;
  },
  give(id) {
    if (G.clues.has(id)) return;
    const c = G.def.clues[id]; if (!c) return;
    G.clues.add(id);
    sound.clue();
    toast(`${c.type === 'evidence' ? 'EVIDENCE' : 'STATEMENT'} · ${c.title}`);
    refresh();
  },
  talk: (w) => openDialog(w),
  inspect: (o) => openInspect(o),
  print: (o, done) => openPrintUI(o, done),
  cutscene: (steps, done) => startCutscene(steps, done),
  board: () => openBoard(),
  toast: (t) => toast(t),
  refresh: () => refresh(),
  flash: (on) => { G.flashOn = on; if (!on) flash.intensity = 0; sound.click(); },
  ambience: (o) => { G.ambience = o; },
};

function refresh() {
  if (!G) return;
  $('objective').textContent = G.def.objective(api);
  const ready = G.def.required.every((id) => G.clues.has(id));
  $('objective').classList.toggle('ready', ready);
}

function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
  $('toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), 3800);
  setTimeout(() => t.remove(), 4600);
}

// ---------- pointer lock / UI ----------
const locked = () => document.pointerLockElement === canvas;
function lock() {
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch {}
  setTimeout(() => { if (state === 'play' && !G.ui && !G.cut && !locked()) showPause(true); }, 400);
}
document.addEventListener('pointerlockchange', () => {
  if (locked()) showPause(false);
  else if (state === 'play' && G && !G.ui && !G.cut) showPause(true);
});
canvas.addEventListener('click', () => { if (state === 'play' && !G.ui && !locked()) lock(); });

function showPause(on) {
  $('pause').classList.toggle('hidden', !on);
  if (on) { $('pauseObjective').textContent = G ? G.def.objective(api) : ''; }
}
function openUI(id) {
  G.ui = id; for (const k in keys) keys[k] = false;
  $('prompt').classList.add('hidden');
  if (locked()) document.exitPointerLock();
  $(id).classList.remove('hidden');
}
function closeUI(relock = true) {
  if (!G.ui) return;
  $(G.ui).classList.add('hidden'); G.ui = null;
  if (relock && state === 'play' && !G.cut) lock();
}

// ---------- dialog ----------
let dlg = null;
function openDialog(w) {
  openUI('dialog');
  $('dName').textContent = w.name;
  dlg = { w, lines: null, i: 0, typing: null, done: null };
  showLines(w.intro, () => showTopics());
}
function typeText(el, text) {
  clearInterval(dlg.typing); el.textContent = ''; let i = 0;
  dlg.full = text;
  dlg.typing = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(dlg.typing); dlg.typing = null; } }, 18);
}
function showLines(lines, done) {
  dlg.lines = lines; dlg.i = 0; dlg.done = done;
  const opts = $('dOpts'); opts.innerHTML = '';
  const btn = document.createElement('button'); btn.className = 'opt cont'; btn.textContent = 'Continue  ▸';
  btn.onclick = advance; opts.appendChild(btn);
  typeText($('dText'), lines[0]); sound.page();
}
function advance() {
  if (!dlg || !dlg.lines) return;
  if (dlg.typing) { clearInterval(dlg.typing); dlg.typing = null; $('dText').textContent = dlg.full; return; }
  dlg.i++;
  if (dlg.i < dlg.lines.length) { typeText($('dText'), dlg.lines[dlg.i]); sound.page(); return; }
  const d = dlg.done; dlg.lines = null; d && d();
}
function showTopics() {
  const { w } = dlg; const opts = $('dOpts'); opts.innerHTML = '';
  $('dText').textContent = '';
  const avail = w.topics.filter((t) => !t.req || G.clues.has(t.req));
  avail.forEach((t, n) => {
    const key = w.id + ':' + w.topics.indexOf(t);
    const b = document.createElement('button'); b.className = 'opt' + (G.asked.has(key) ? ' asked' : '');
    b.innerHTML = `<span class="k">${n + 1}</span>${t.q}`;
    b.onclick = () => {
      G.asked.add(key);
      showLines(t.a, () => { if (t.gives) api.give(t.gives); if (t.then) t.then(api); refresh(); showTopics(); });
    };
    opts.appendChild(b);
  });
  const leave = document.createElement('button'); leave.className = 'opt leave'; leave.innerHTML = '<span class="k">Esc</span>Leave';
  leave.onclick = () => { dlg = null; closeUI(); }; opts.appendChild(leave);
  const pending = w.topics.length - avail.length;
  $('dText').innerHTML = `<i class="muted">What do you ask?${pending ? ' (Some questions open up once you know more.)' : ''}</i>`;
}

// ---------- inspect ----------
let inspectClose = null;
function openInspect(o) {
  const wasOpen = G.ui === 'inspect';
  if (G.ui && !wasOpen) closeUI(false);
  openUI('inspect');
  $('iTitle').textContent = o.title;
  const body = $('iBody'); body.innerHTML = '';
  (Array.isArray(o.text) ? o.text : [o.text]).forEach((t) => { const p = document.createElement('p'); p.textContent = t; if (t.length <= 4) p.className = 'carved'; body.appendChild(p); });
  const acts = $('iActs'); acts.innerHTML = '';
  for (const a of o.actions || []) { const b = document.createElement('button'); b.className = 'btn'; b.textContent = a.label; b.onclick = () => { inspectClose = null; $('inspect').classList.add('hidden'); G.ui = null; a.fn(); }; acts.appendChild(b); }
  const c = document.createElement('button'); c.className = 'btn ghost'; c.textContent = 'Close'; c.onclick = () => finishInspect(); acts.appendChild(c);
  inspectClose = o.onClose || null;
  sound.page();
}
function finishInspect() {
  const cb = inspectClose; inspectClose = null;
  $('inspect').classList.add('hidden'); G.ui = null;
  if (cb) cb();
  if (!G.ui && state === 'play') lock();
}

// ---------- fingerprint ----------
function openPrintUI(o, done) {
  openUI('printer');
  openPrint($('printHost'), o, () => { closeUI(); done && done(); });
}

// ---------- notebook ----------
function openNotebook() {
  openUI('notebook');
  const ev = $('nbEvidence'), st = $('nbStatements'), su = $('nbSuspects');
  ev.innerHTML = st.innerHTML = su.innerHTML = '';
  for (const id of G.clues) {
    const c = G.def.clues[id];
    const d = document.createElement('div'); d.className = 'entry'; d.innerHTML = `<b>${c.title}</b><span>${c.text}</span>`;
    (c.type === 'evidence' ? ev : st).appendChild(d);
  }
  if (!ev.children.length) ev.innerHTML = '<div class="muted">Nothing yet.</div>';
  if (!st.children.length) st.innerHTML = '<div class="muted">Nobody has talked to you yet.</div>';
  for (const s of G.def.suspects) {
    const notes = s.notes.filter((n) => !n.req || G.clues.has(n.req));
    const d = document.createElement('div'); d.className = 'entry';
    d.innerHTML = `<b>${s.name}</b><em>${s.role}</em>` + notes.map((n) => `<span>· ${n.t}</span>`).join('');
    su.appendChild(d);
  }
  $('nbObjective').textContent = G.def.objective(api);
  sound.page();
}

// ---------- case board ----------
let boardPick = null;
function openBoard() {
  openUI('board'); boardPick = null;
  const def = G.def, ready = def.required.every((id) => G.clues.has(id));
  const have = def.required.filter((id) => G.clues.has(id)).length;
  $('bTitle').textContent = `${def.num} — ${def.title.toUpperCase()}`;
  $('bStatus').innerHTML = ready
    ? 'You have enough to make a charge. Choose carefully. There is no second chance.'
    : `Key evidence: <b>${have} / ${def.required.length}</b>. Not enough to charge anyone yet.<br><span class="muted">${def.objective(api)}</span>`;
  const list = $('bSuspects'); list.innerHTML = '';
  for (const s of def.suspects) {
    const notes = s.notes.filter((n) => !n.req || G.clues.has(n.req));
    const card = document.createElement('div'); card.className = 'suspect';
    card.innerHTML = `<div class="mug">${s.name.split(' ').filter((w) => !w.endsWith('.')).map((w) => w[0]).join('')}</div><div class="sinfo"><b>${s.name}</b><em>${s.role}</em>${notes.map((n) => `<span>· ${n.t}</span>`).join('')}</div>`;
    card.onclick = () => {
      if (!ready) return;
      boardPick = s; list.querySelectorAll('.suspect').forEach((e) => e.classList.remove('picked')); card.classList.add('picked');
      $('bAccuse').disabled = false; $('bAccuse').textContent = `Charge ${s.name}`;
    };
    if (!ready) card.classList.add('locked');
    list.appendChild(card);
  }
  $('bAccuse').disabled = true; $('bAccuse').textContent = ready ? 'Select a suspect' : 'Find more evidence';
  sound.page();
}
$('bAccuse').onclick = () => {
  if (!boardPick) return;
  $('confirmText').textContent = `Charge ${boardPick.name}? This closes the case.`;
  $('confirm').classList.remove('hidden');
};
$('confirmNo').onclick = () => $('confirm').classList.add('hidden');
$('confirmYes').onclick = () => { $('confirm').classList.add('hidden'); accuse(boardPick); };
$('bClose').onclick = () => closeUI();

function accuse(s) {
  const def = G.def, good = s.id === def.culprit;
  const end = good ? def.endings.good : def.endings.bad(s);
  results[def.id] = good ? 'solved' : (results[def.id] === 'solved' ? 'solved' : 'failed'); saveResults();
  $('board').classList.add('hidden'); G.ui = null;
  state = 'ending'; $('hud').classList.add('hidden');
  sound.ambience(0.04, 0.03); if (good) sound.heartbeat(3, 1.4); else sound.stinger();
  const el = $('ending'); el.classList.remove('hidden'); el.classList.toggle('bad', !good);
  $('eTitle').textContent = end.title;
  const body = $('eBody'); body.innerHTML = '';
  end.text.forEach((t, i) => { const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = `${0.8 + i * 1.8}s`; body.appendChild(p); });
  $('eActs').style.animationDelay = `${1 + end.text.length * 1.8}s`;
}
$('eMenu').onclick = () => { $('ending').classList.add('hidden'); toMenu(); };
$('eRetry').onclick = () => { $('ending').classList.add('hidden'); startCase(G.def); };

// ---------- cutscene ----------
function startCutscene(steps, done) {
  if (G.ui) closeUI(false);
  G.cut = { steps, i: -1, t: 0, done, fromP: new THREE.Vector3(), fromQ: new THREE.Quaternion(), toP: new THREE.Vector3(), toQ: new THREE.Quaternion(), saveP: camera.position.clone(), saveYaw: G.yaw, savePitch: G.pitch };
  $('prompt').classList.add('hidden'); $('letterbox').classList.add('on');
  nextShot();
}
function nextShot() {
  const c = G.cut; c.i++; c.t = 0;
  if (c.i >= c.steps.length) {
    $('caption').classList.remove('on'); $('letterbox').classList.remove('on');
    G.yaw = c.saveYaw; G.pitch = c.savePitch;
    const d = c.done; G.cut = null; d && d();
    if (!G.ui && state === 'play') lock();
    return;
  }
  const s = c.steps[c.i];
  c.fromP.copy(camera.position); c.fromQ.copy(camera.quaternion);
  if (s.pos) {
    c.toP.set(...s.pos);
    const m = new THREE.Matrix4().lookAt(c.toP, new THREE.Vector3(...s.look), new THREE.Vector3(0, 1, 0));
    c.toQ.setFromRotationMatrix(m);
  } else { c.toP.copy(camera.position); c.toQ.copy(camera.quaternion); }
  c.dur = s.dur || s.hold || 2;
  const cap = $('caption');
  if (s.text) { cap.textContent = s.text; cap.classList.add('on'); } else cap.classList.remove('on');
  s.onStart && s.onStart();
}
function updateCut(dt) {
  const c = G.cut; c.t += dt;
  const k = Math.min(1, c.t / c.dur), e = k * k * (3 - 2 * k);
  camera.position.lerpVectors(c.fromP, c.toP, e);
  camera.quaternion.slerpQuaternions(c.fromQ, c.toQ, e);
  if (c.t >= c.dur) nextShot();
}

// ---------- menu / warning ----------
function toMenu() {
  state = 'menu';
  $('hud').classList.add('hidden'); $('pause').classList.add('hidden');
  ['dialog', 'inspect', 'notebook', 'board', 'printer'].forEach((id) => $(id).classList.add('hidden'));
  if (G) G.ui = null;
  if (locked()) document.exitPointerLock();
  const list = $('caseList'); list.innerHTML = '';
  for (const def of CASES) {
    const r = results[def.id];
    const card = document.createElement('button'); card.className = 'casecard';
    card.innerHTML = `<div class="cnum">${def.num}${r ? ` <span class="res ${r}">${r === 'solved' ? 'SOLVED' : 'UNSOLVED'}</span>` : ''}</div><div class="ctitle">${def.title}</div><div class="cplace">${def.place} · ${def.date}</div><div class="cblurb">${def.blurb}</div>`;
    card.onclick = () => { sound.init(); $('menu').classList.add('hidden'); startCase(def); };
    list.appendChild(card);
  }
  $('menu').classList.remove('hidden');
  sound.ambience(0.05, 0.035);
}
$('warnOk').onclick = () => { sound.init(); sound.setVolume(settings.vol); $('warning').classList.add('hidden'); toMenu(); };
$('warnNo').onclick = () => { $('warning').innerHTML = '<div class="warnbox"><p class="muted">Take care of yourself. You can close this tab.</p></div>'; };

// pause controls
$('resume').onclick = () => lock();
$('openNb').onclick = () => { showPause(false); openNotebook(); };
$('quit').onclick = () => toMenu();
const bindSlider = (id, key, apply) => { const el = $(id); el.value = settings[key]; el.oninput = () => { settings[key] = +el.value; apply(+el.value); saveSettings(); }; };
bindSlider('sBright', 'bright', (v) => { renderer.toneMappingExposure = v; });
bindSlider('sSens', 'sens', () => {});
bindSlider('sVol', 'vol', (v) => sound.setVolume(v));
function syncQualityUI() { $('sQuality').value = settings.quality; }
syncQualityUI();
$('sQuality').onchange = () => { settings.quality = $('sQuality').value; settings.qualityManual = true; saveSettings(); applyQuality(); };
$('grain').classList.toggle('hidden', !Q().grain);
$('nbClose').onclick = () => closeUI();
$('pClose').onclick = () => closeUI();

// ---------- input ----------
addEventListener('keydown', (e) => {
  if (e.code === 'Tab') e.preventDefault();
  if (state !== 'play' || !G) return;
  if (G.cut) return;
  if (G.ui === 'dialog') {
    if (['Space', 'Enter', 'KeyE'].includes(e.code)) { if (dlg && dlg.lines) advance(); e.preventDefault(); }
    else if (e.code === 'Escape' && dlg && !dlg.lines) { dlg = null; closeUI(); }
    else if (/^Digit[1-9]$/.test(e.code) && dlg && !dlg.lines) { const b = $('dOpts').querySelectorAll('.opt:not(.leave)')[+e.code.slice(5) - 1]; b && b.click(); }
    return;
  }
  if (G.ui === 'inspect') { if (['KeyE', 'Escape', 'Enter'].includes(e.code)) finishInspect(); return; }
  if (G.ui === 'notebook') { if (['Tab', 'KeyN', 'Escape'].includes(e.code)) closeUI(); return; }
  if (G.ui === 'board') { if (e.code === 'Escape' && $('confirm').classList.contains('hidden')) closeUI(); return; }
  if (G.ui) { if (e.code === 'Escape') closeUI(); return; }
  keys[e.code] = true;
  if (e.code === 'KeyE' && G.nearest) useNearest();
  if (e.code === 'KeyF') api.flash(!G.flashOn);
  if (e.code === 'Tab' || e.code === 'KeyN') openNotebook();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('mousemove', (e) => {
  if (!locked() || !G || G.ui || G.cut) return;
  const s = 0.0022 * settings.sens;
  G.yaw -= e.movementX * s; G.pitch -= e.movementY * s;
  G.pitch = Math.max(-1.45, Math.min(1.45, G.pitch));
});
canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && locked() && G && !G.ui && !G.cut && G.nearest) useNearest(); });
function useNearest() {
  const it = G.nearest; if (!it) return;
  it.use();
  if (it.once) { it.alive = false; if (it.sprite) it.sprite.visible = false; }
}

// ---------- per-frame ----------
const R = 0.38;
function collide(p) {
  for (const c of G.colliders) {
    const cx = Math.max(c.x0, Math.min(p.x, c.x1)), cz = Math.max(c.z0, Math.min(p.z, c.z1));
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= R * R) continue;
    if (d2 > 1e-9) { const d = Math.sqrt(d2); p.x = cx + (dx / d) * R; p.z = cz + (dz / d) * R; }
    else {
      const l = p.x - c.x0, r = c.x1 - p.x, b = p.z - c.z0, f = c.z1 - p.z, m = Math.min(l, r, b, f);
      if (m === l) p.x = c.x0 - R; else if (m === r) p.x = c.x1 + R; else if (m === b) p.z = c.z0 - R; else p.z = c.z1 + R;
    }
  }
}

const fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
function updatePlayer(dt) {
  const canMove = locked() && !G.ui;
  let mx = 0, mz = 0;
  if (canMove) {
    if (keys.KeyW || keys.ArrowUp) mz += 1; if (keys.KeyS || keys.ArrowDown) mz -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1;
  }
  const run = keys.ShiftLeft || keys.ShiftRight;
  const sp = run ? 5.2 : 2.9;
  const moving = mx || mz;
  if (moving) {
    const l = Math.hypot(mx, mz); mx /= l; mz /= l;
    const sy = Math.sin(G.yaw), cy = Math.cos(G.yaw);
    G.pos.x += (-sy * mz + cy * mx) * sp * dt;
    G.pos.z += (-cy * mz - sy * mx) * sp * dt;
    collide(G.pos); collide(G.pos);
    G.bob += dt * (run ? 11 : 7.5);
    G.stepAcc += sp * dt;
    if (G.stepAcc > (run ? 1.1 : 0.85)) { G.stepAcc = 0; sound.step(run); }
  }
  camera.position.set(G.pos.x, 1.65 + (moving ? Math.sin(G.bob) * 0.035 : 0), G.pos.z);
  camera.rotation.set(G.pitch + (moving ? Math.sin(G.bob * 0.5) * 0.004 : 0), G.yaw, 0);
}

function updateInteract() {
  let best = null, bestScore = -1e9;
  camera.getWorldDirection(fwd);
  for (const it of G.interacts) {
    if (!it.alive) continue;
    const ok = !it.cond || it.cond();
    if (it.sprite) {
      const dist = it.sprite.position.distanceTo(camera.position);
      it.sprite.visible = ok && dist < 16;
      it.sprite.material.opacity = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(G.t * 3 + it.pos.x));
    }
    if (!ok) continue;
    tmp.copy(it.pos).sub(camera.position);
    const flatD = Math.hypot(tmp.x, tmp.z);
    if (flatD > it.radius) continue;
    const d = tmp.length(); tmp.normalize();
    const dot = tmp.dot(fwd);
    if (dot < 0.55 && flatD > 1.1) continue;
    const score = dot - d * 0.08;
    if (score > bestScore) { bestScore = score; best = it; }
  }
  G.nearest = best;
  const pr = $('prompt');
  if (best && !G.ui && locked()) {
    const label = typeof best.label === 'function' ? best.label() : best.label;
    pr.innerHTML = `<span class="key">E</span>${label}`; pr.classList.remove('hidden');
    $('cross').classList.add('active');
  } else { pr.classList.add('hidden'); $('cross').classList.remove('active'); }
}

function updateRain(dt) {
  const a = G.rain.geometry.attributes.position, arr = a.array, cx = camera.position.x, cz = camera.position.z;
  for (let i = 0; i < arr.length; i += 6) {
    arr[i + 1] -= 16 * dt; arr[i + 4] -= 16 * dt;
    if (arr[i + 1] < 0) {
      const x = cx + (Math.random() - 0.5) * 40, z = cz + (Math.random() - 0.5) * 40, y = 18 + Math.random() * 3;
      arr[i] = x; arr[i + 1] = y; arr[i + 2] = z; arr[i + 3] = x + 0.03; arr[i + 4] = y + 0.45; arr[i + 5] = z;
    }
  }
  a.needsUpdate = true;
}

function updateFlash(dt) {
  if (!G.flashOn) { flash.intensity = 0; return; }
  G.flashFlicker -= dt;
  if (G.flashFlicker < 0) {
    if (Math.random() < 0.004) G.flashFlicker = 0.6 + Math.random() * 0.6; // brief failing battery moment
    flash.intensity = 160;
  } else {
    flash.intensity = Math.random() < 0.4 ? 8 : 110;
  }
}

function updateAmbience() {
  if (!G.ambience) return;
  const z = G.ambience.zone(G.pos);
  if (z !== G.zone) {
    G.zone = z;
    if (z === 'woods') sound.ambience(G.def.rain * 0.7, 0.11); else sound.ambience(G.def.rain, 0.05);
  }
}

// If the game runs slowly, drop one quality step (at most twice), unless the player picked a level.
function autoQuality(dt) {
  const p = G.perf;
  if (settings.qualityManual || p.checks >= 2 || settings.quality === 'low') return;
  p.t += dt; p.n++;
  if (p.t < 6) return;
  const fps = p.n / p.t; p.t = 0; p.n = 0; p.checks++;
  if (fps < 32) {
    settings.quality = settings.quality === 'high' ? 'medium' : 'low';
    saveSettings(); applyQuality(); syncQualityUI();
    toast(`Graphics lowered to ${settings.quality.toUpperCase()} for smoother play (Esc to change)`);
  }
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!scene || !G) { renderer.clear(); return; }
  G.t += dt;
  if (state === 'play') {
    if (G.cut) { updateCut(dt); updateFlash(dt); }
    else { updatePlayer(dt); updateInteract(); updateFlash(dt); updateAmbience(); }
  } else if (state === 'intro' || state === 'ending') {
    camera.position.set(G.pos.x, 1.65, G.pos.z); camera.rotation.set(G.pitch, G.yaw + Math.sin(G.t * 0.1) * 0.05, 0);
  }
  for (const a of G.anims) a(dt);
  updatePool();
  updateRain(dt);
  if (state === 'play' && !G.cut && !G.ui) autoQuality(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

// grain overlay
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 22; }
  g.putImageData(img, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
})();

// debug / test hook (used by headless playtests)
window.__hb = { CASES, startCase, api, toMenu, camera, renderer, settings, applyQuality, get G() { return G; }, get state() { return state; } };
