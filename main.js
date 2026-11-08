import * as THREE from 'three';
import * as B from './builders.js';
import { CASES } from './cases.js';
import { HOME } from './home.js';
import { Sound } from './audio.js';
import { openPrint } from './fingerprint.js';
import { VERSION, NOTES } from './changelog.js';
import { Pad, BTN } from './pad.js';
import { CREDITS } from './credits.js';
import { settings, saveSettings, results, saveResults } from './settings.js';
import { createComposer } from './postfx.js';
import { makeRain, makeSnow } from './weather.js';

const $ = (id) => document.getElementById(id);
const sound = new Sound();

// ---------- touch / mobile ----------
// Touch mode: on-screen stick (left), drag to look (right), buttons. Turns on for phones/tablets,
// or the first time anyone touches the screen.
const TOUCH = { on: matchMedia('(pointer: coarse)').matches, mx: 0, mz: 0, run: false };
if (TOUCH.on && !settings.qualityManual) settings.quality = 'low';

// ---------- graphics quality ----------
// ratio: render resolution, shadow: flashlight shadow map size (0 = off), pool: real point lights, rain: drop count
const QUALITY = {
  low: { ratio: () => 0.7, shadow: 0, pool: 3, rain: 900, grain: false, post: false },
  medium: { ratio: () => Math.min(devicePixelRatio, 1), shadow: 512, pool: 4, rain: 1700, grain: true, post: true, msaa: 0, bloom: 0.5 },
  high: { ratio: () => Math.min(devicePixelRatio, 1.5), shadow: 1024, pool: 6, rain: 2600, grain: true, post: true, msaa: 4, bloom: 0.6 },
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

const camera = new THREE.PerspectiveCamera(settings.fov || 70, innerWidth / innerHeight, 0.05, 70);
document.documentElement.style.setProperty('--sub', settings.sub || 1);
camera.rotation.order = 'YXZ';
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (composer) composer.setSize(innerWidth, innerHeight); });

// ---------- post-processing (Medium/High): bloom, then a film grade ----------
let composer = null, renderPass = null, gradePass = null;
function buildComposer() {
  if (composer) { composer.dispose(); composer = null; renderPass = null; gradePass = null; }
  const q = Q();
  const css = !q.post && q.grain;
  $('grain').classList.toggle('hidden', !css); $('vignette').classList.toggle('hidden', !!q.post);
  if (!q.post || !renderer.capabilities.isWebGL2) return;
  ({ composer, renderPass, gradePass } = createComposer(renderer, scene || new THREE.Scene(), camera, q));
}

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
  buildComposer();
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

// ---------- GPU check ----------
// If Chrome is drawing on the CPU (hardware acceleration off or GPU blocked), the game will be choppy on any PC.
const GPU = (() => {
  try { const gl = renderer.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info'); return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch { return 'unknown'; }
})();
const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(GPU);
if (SOFTWARE_GPU && !settings.qualityManual) settings.quality = 'low';

let fpsAcc = 0, fpsN = 0;
function updateFps(dt) {
  if (!settings.showFps) return;
  fpsAcc += dt; fpsN++;
  if (fpsAcc >= 0.5) {
    const r = renderer.info.render;
    $('fps').textContent = Math.round(fpsN / fpsAcc) + ' FPS · ' + settings.quality.toUpperCase() + ' · drawing ' + (G ? G.cullDrawn + '/' + G.cull.length : 0) + ' objects, ' + r.calls + ' calls · ' + GPU;
    fpsAcc = 0; fpsN = 0;
  }
}

// ---------- culling ----------
// The renderer already skips meshes outside the view cone (frustum culling). On top of that,
// anything whose nearest edge is past CULL_DIST is moved to layer 1, which the camera and the
// flashlight shadow don't render. The fog is fully opaque by then, so nothing visibly pops.
// Layers are used instead of .visible so story scripts can still show/hide things freely.
const CULL_DIST = 40;
const _box = new THREE.Box3(), _sph = new THREE.Sphere();
function registerCulling() {
  G.cull.length = 0;
  for (const o of scene.children) {
    if (o.isLight || o === camera || o === G.rain || o.isSprite || o.userData.noCull) continue;
    _box.setFromObject(o);
    if (_box.isEmpty()) continue;
    _box.getBoundingSphere(_sph);
    if (_sph.radius > 30) continue; // ground, long roads, river: always drawn
    G.cull.push({ obj: o, c: _sph.center.clone(), r: _sph.radius, out: false });
  }
}
function setLayer(o, layer) { o.traverse((c) => c.layers.set(layer)); }
function updateCulling() {
  const p = camera.position;
  let drawn = 0;
  for (const c of G.cull) {
    const out = c.c.distanceTo(p) - c.r > CULL_DIST;
    if (out !== c.out) { c.out = out; setLayer(c.obj, out ? 1 : 0); }
    if (!out) drawn++;
  }
  G.cullDrawn = drawn;
}

// ---------- state ----------
let scene = null, G = null, state = 'warning';
const keys = {};

function disposeScene(s) {
  if (!s) return;
  if (s.environment) s.environment.dispose();
  s.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }
  });
  B.clearCache();
}

// ---------- case lifecycle ----------
function startCase(def, load = false, opts = {}) {
  sound.stopLoops();
  $('whatsnew').classList.add('hidden');
  disposeScene(scene);
  $('menu').classList.add('hidden'); $('pause').classList.add('hidden');
  $('danger').style.opacity = 0; $('jolt').className = '';
  $('hideHud').classList.add('hidden'); $('slats').classList.remove('on'); $('tBreath').classList.add('hidden');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030407);
  scene.fog = new THREE.FogExp2(0x030407, def.fog);
  var skyDome = null;
  if (settings.quality !== 'low') {
    const skyTex = B.skyTexture(def.sky || {});
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(skyTex).texture; pm.dispose();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(62, 40, 20), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -1; dome.userData.dynamic = true; dome.userData.noCull = true; scene.add(dome);
    skyDome = dome;
  }
  const hemi = new THREE.HemisphereLight(0x22304a, 0x080606, 1.1); scene.add(hemi);
  const bolt = new THREE.DirectionalLight(0xe4ecff, 0); bolt.position.set(10, 60, -20); scene.add(bolt); // lightning (always present so shaders never recompile)
  const moon = new THREE.DirectionalLight(0x5a6e96, 0.45); moon.position.set(-30, 50, 10); scene.add(moon);
  scene.add(camera);

  G = {
    def, clues: new Set(), asked: new Set(), flags: {}, colliders: [], lamps: [], lights: [], anims: [], interacts: [], pool: [], cull: [],
    pos: new THREE.Vector3(def.spawn.x, 0, def.spawn.z), yaw: def.spawn.yaw, pitch: 0, bob: 0, stepAcc: 0,
    ui: null, cut: null, flashOn: true, flashFlicker: 0, t: 0, zone: null, ambience: null, nearest: null, perf: { t: 0, n: 0, checks: 0 }, opts,
  };
  B.init({ scene, colliders: G.colliders, lamps: G.lamps, lights: G.lights, anims: G.anims, cull: G.cull, camera, cheap: settings.quality === 'low', calm: !!settings.calm });
  G.sky = skyDome; G.hemi = hemi; G.bolt = bolt; G.restores = [];
  if (renderPass) renderPass.scene = scene;
  G.rain = def.snow ? makeSnow(Math.round(Q().rain * 0.8)) : makeRain(Q().rain); scene.add(G.rain);
  // suspects appear in a random order each playthrough (the killer must not always be first)
  G.suspects = def.suspects.slice();
  for (let i = G.suspects.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [G.suspects[i], G.suspects[j]] = [G.suspects[j], G.suspects[i]]; }
  def.build(api);
  makeWatcher();
  G.room = null; G.camOverride = null;
  setupInterrogation();
  // buzzing flickering lamps (3D)
  for (const l of G.lamps) if (l.flicker) sound.loopAt([l.pos.x, 4, l.pos.z], 'hum');
  const save = load ? readSave(def.id) : null;
  if (save) applySave(save);
  B.staticBatch(scene);
  registerCulling();
  buildPool();
  flash.intensity = 160;
  $('caseLabel').textContent = `${def.num} · ${def.place.toUpperCase()}`;
  $('toasts').innerHTML = '';
  refresh();
  sound.ambience(def.rain, 0.05);
  if (def.isHome) { G.rain.visible = false; G.stalk = null; $('caseLabel').textContent = 'HOME · ASHGROVE'; }
  if (opts.title) { // living title screen: the case builds, but nobody plays it
    G.title = true; G.stalk = null; G.flashOn = false; flash.intensity = 0;
    state = 'menu'; $('hud').classList.add('hidden'); $('intro').classList.add('hidden');
    sound.ambience(def.rain, 0.04);
    return;
  }
  if (opts.epilogue) {
    G.stalk = null; state = 'play'; $('hud').classList.add('hidden'); $('intro').classList.add('hidden');
    startCutscene(def.epilogue(opts.epilogue, secretCount() === 3 && opts.epilogue === 'good'), () => rollCredits());
    return;
  }
  if (save || def.isHome) { // continuing (or home): skip the intro card
    state = 'play'; $('hud').classList.remove('hidden'); $('intro').classList.add('hidden');
    if (!def.isHome) toast(`Continuing ${def.title}: ${G.clues.size} clues in your notebook`);
    lock();
  } else playIntro(def);
  tutStart();
}

// ---------- saving ----------
const saveKey = (id) => 'hb_save_' + id;
function readSave(id) { try { return JSON.parse(localStorage.getItem(saveKey(id)) || 'null'); } catch { return null; } }
function clearSave(id) { try { localStorage.removeItem(saveKey(id)); } catch {} }
function canSave() { return G && !G.def.isHome && state === 'play' && !G.cut && !G.frozen && !G.flags.chasing && !G.flags.hidePhase; }
function saveGame() {
  if (!canSave()) return;
  const data = { v: 1, clues: [...G.clues], asked: [...G.asked], flags: G.flags, pos: [G.pos.x, G.pos.z], yaw: G.yaw, at: Date.now() };
  try { localStorage.setItem(saveKey(G.def.id), JSON.stringify(data)); } catch {}
}
function applySave(s) {
  for (const id of s.clues || []) G.clues.add(id);
  for (const k of s.asked || []) G.asked.add(k);
  Object.assign(G.flags, s.flags || {});
  if (s.pos) G.pos.set(s.pos[0], 0, s.pos[1]);
  if (typeof s.yaw === 'number') G.yaw = s.yaw;
  for (const fn of G.restores) { try { fn(); } catch (e) { console.warn('restore failed', e); } }
}

// ---------- the watcher: stalker moments (the collector, glimpsed in every case) ----------
function makeWatcher() {
  const w = B.person(0, -200, { coat: 0x0b0b0e, coatLen: 'long', shirt: 0x2a2a2e, pants: 0x0b0b0e, hat: 'fedora', hatColor: 0x050506, glasses: true, glint: true, hair: 0x1a1a1a, skin: 0x8a8278, ry: 0, scale: 1.04, idle: false, look: false, collide: false });
  w.visible = false; w.userData.noCull = true;
  G.watcher = w; G.stalk = { next: 45 + Math.random() * 40, ev: null };
}
const _sv = new THREE.Vector3();
// is there a clear line from the player to (x, z)? (2D slab test against every collider)
function lineOfSight(x, z) {
  const ox = G.pos.x, oz = G.pos.z, dx = x - ox, dz = z - oz;
  for (const c of G.colliders) {
    if (c.x1 - c.x0 < 0.8 && c.z1 - c.z0 < 0.8) continue; // ignore thin things like tree trunks and people
    let t0 = 0, t1 = 1;
    for (const [o, d, lo, hi] of [[ox, dx, c.x0, c.x1], [oz, dz, c.z0, c.z1]]) {
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) { t0 = 2; break; } continue; }
      let a = (lo - o) / d, b = (hi - o) / d; if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) break;
    }
    if (t0 <= t1 && t0 < 0.97) return false;
  }
  return true;
}
function freeSpot(x, z) { for (const c of G.colliders) if (x > c.x0 - 0.6 && x < c.x1 + 0.6 && z > c.z0 - 0.6 && z < c.z1 + 0.6) return false; return true; }
function spotAround(angleOff, dist) {
  for (let tries = 0; tries < 14; tries++) {
    const a = G.yaw + (Math.random() < 0.5 ? -1 : 1) * angleOff * (0.8 + Math.random() * 0.4), d = dist * (0.85 + Math.random() * 0.3);
    const x = G.pos.x - Math.sin(a) * d, z = G.pos.z - Math.cos(a) * d;
    if (freeSpot(x, z) && lineOfSight(x, z)) return [x, z];
  }
  return null;
}
function updateStalker(dt) {
  const st = G.stalk, w = G.watcher;
  if (!st || !w) return;
  const busy = !api.playing() || G.flags.chasing || G.flags.hidePhase || G.flags.inGallery || G.flags.morgue && !G.flags.arrested;
  const ev = st.ev;
  if (ev) {
    ev.t += dt;
    if (ev.kind === 'glimpse') {
      _sv.set(w.position.x - camera.position.x, 0, w.position.z - camera.position.z);
      const d = _sv.length(); _sv.normalize();
      camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      const looking = _sv.dot(fwd) > 0.93;
      if (looking) ev.seen = (ev.seen || 0) + dt;
      if (ev.seen > 0.3 || ev.t > 6 || d < 9 || busy) { w.visible = false; if (ev.seen > 0.3) sound.at(w.position, () => sound.whisper()); st.ev = null; }
    } else if (ev.kind === 'steps') {
      ev.next -= dt;
      camera.getWorldDirection(fwd);
      const behind = ev.dir;
      if (fwd.x * behind.x + fwd.z * behind.z > 0.2) { st.ev = null; sound.at([G.pos.x + behind.x * 2, 0.2, G.pos.z + behind.z * 2], () => sound.burst(0.4, 300, 0.25)); }
      else if (ev.next <= 0 && ev.n > 0) { ev.n--; ev.next = 0.48 + Math.random() * 0.1; sound.at([G.pos.x + behind.x * (3 + ev.n * 0.3), 0.1, G.pos.z + behind.z * (3 + ev.n * 0.3)], () => sound.step(false)); }
      else if (ev.n <= 0) st.ev = null;
    } else if (ev.kind === 'lightning') {
      const on = (ev.t > 0 && ev.t < 0.13) || (ev.t > 0.24 && ev.t < 0.42);
      const calm = settings.calm;
      G.hemi.intensity = on ? (calm ? 1.6 : 4) : 1.1; G.bolt.intensity = on ? (calm ? 1.2 : 7) : 0;
      if (G.sky) G.sky.material.color.setScalar(on ? (calm ? 1.4 : 3.5) : 1);
      w.visible = !!ev.figure && on;
      if (ev.t > 0.6) { G.hemi.intensity = 1.1; G.bolt.intensity = 0; if (G.sky) G.sky.material.color.setScalar(1); w.visible = false; st.ev = null; }
    }
    return;
  }
  if (busy || G.t < 40) return;
  st.next -= dt;
  if (st.next > 0) return;
  st.next = (55 + Math.random() * 70) * (G.def.stalkRate || 1);
  const rainy = !G.def.snow && G.def.rain >= 0.1;
  const roll = Math.random();
  if (rainy && roll < 0.35) {
    const p = spotAround(0.05, 26);
    st.ev = { kind: 'lightning', t: -0.05, figure: !!p && Math.random() < 0.6 };
    if (p && st.ev.figure) { w.position.set(p[0], 0, p[1]); w.rotation.y = Math.atan2(G.pos.x - p[0], G.pos.z - p[1]); }
    sound.thunder(1.4 + Math.random());
  } else if (roll < 0.7) {
    const p = spotAround(0.75, 17);
    if (!p) return;
    w.position.set(p[0], 0, p[1]); w.rotation.y = Math.atan2(G.pos.x - p[0], G.pos.z - p[1]); w.visible = true;
    st.ev = { kind: 'glimpse', t: 0 };
  } else {
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    st.ev = { kind: 'steps', t: 0, n: 4 + Math.floor(Math.random() * 3), next: 0.3, dir: new THREE.Vector3(-fwd.x, 0, -fwd.z) };
  }
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
  go.onclick = () => {
    el.classList.add('hidden'); state = 'play'; $('hud').classList.remove('hidden');
    if (TOUCH.on) goFullscreen();
    lock();
  };
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
    setTimeout(saveGame, 50);
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
  onRestore: (fn) => { G.restores.push(fn); },
  get results() { return results; },
  toMenu: () => toMenu(),
  startCaseId: (id) => { const d = CASES.find((c) => c.id === id); if (d) startCase(d, !!readSave(id)); },
  get hard() { return !!settings.hard; },
  // scare effects
  shake: (v) => { if (settings.calm) return; G.shake = Math.max(G.shake || 0, v); },
  get calm() { return !!settings.calm; },
  get opts() { return G.opts || {}; },
  secret: (id) => { if (secrets[id]) return false; secrets[id] = true; try { localStorage.setItem('hb_secrets', JSON.stringify(secrets)); } catch {} toast(`A white lily. (${secretCount()} / 3)`); return true; },
  hasSecret: (id) => !!secrets[id],
  danger: (v) => { $('danger').style.opacity = Math.max(0, Math.min(1, v)); },
  jolt: (kind) => { if (settings.calm && (kind === 'white' || kind === 'red')) kind = ''; const el = $('jolt'); el.className = ''; void el.offsetWidth; if (kind) el.className = kind; },
  // hiding / scripted helpers
  get colliders() { return G.colliders; },
  freeze(on) { G.frozen = on; if (on) for (const k in keys) keys[k] = false; },
  setEye(h) { G.eyeH = h; },
  weather(on) { if (G.rain) G.rain.visible = on; },
  holdingBreath: () => !!(keys.Space || TOUCH.breath || PADIN.breath),
  caption(text, ms = 3000) {
    const cap = $('caption'); cap.textContent = text; cap.classList.add('on');
    clearTimeout(G.capT); G.capT = setTimeout(() => { if (!G.cut) cap.classList.remove('on'); }, ms);
  },
  hideHud(o) {
    const el = $('hideHud');
    if (!o) { el.classList.add('hidden'); $('slats').classList.remove('on'); $('tBreath').classList.add('hidden'); G.breathUI = false; return; }
    el.classList.remove('hidden');
    $('hideText').textContent = o.text || '';
    $('breathBar').style.display = o.breath === undefined ? 'none' : 'block';
    if (o.breath !== undefined) $('breathFill').style.width = Math.round(o.breath * 100) + '%';
    $('breathFill').classList.toggle('low', o.breath !== undefined && o.breath < 0.3);
    $('slats').classList.toggle('on', !!o.slats);
    G.breathUI = o.breath !== undefined;
    $('tBreath').classList.toggle('hidden', !(TOUCH.on && G.breathUI));
  },
  // chase / scripted-scene helpers
  get player() { return G.pos; },
  get touch() { return TOUCH.on; },
  setPlayer(x, z, yaw, pitch = 0) { G.pos.set(x, 0, z); G.yaw = yaw; G.pitch = pitch; },
  paused: () => !$('pause').classList.contains('hidden'),
  uiOpen: () => !!(G.ui || G.cut),
  playing: () => state === 'play' && G && !G.ui && !G.cut && !G.frozen && $('pause').classList.contains('hidden'),
  collide: (p, r) => collide(p, r),
  blackout(text, ms, cb) {
    G.frozen = true; for (const k in keys) keys[k] = false;
    const el = $('blackout'); el.textContent = text; el.classList.add('on');
    setTimeout(() => { if (cb) cb(); el.classList.remove('on'); if (G) G.frozen = false; }, ms);
  },
};

function objectiveText() {
  const t = G.def.objective(api);
  if (!settings.hard) return t;
  return G.flags.chasing || G.flags.hidePhase ? t : '';
}
function refresh() {
  if (!G) return;
  $('objective').textContent = objectiveText();
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
// 'active' = the player is in control: pointer-locked on desktop, or not paused in touch mode.
const active = () => (TOUCH.on || PADIN.active ? $('pause').classList.contains('hidden') && (TOUCH.on || PADIN.active || locked()) : locked());
function lock() {
  if (TOUCH.on || PADIN.active) { showPause(false); try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch {} return; }
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch {}
  setTimeout(() => { if (state === 'play' && !G.ui && !G.cut && !locked()) showPause(true); }, 400);
}
document.addEventListener('pointerlockchange', () => {
  if (TOUCH.on || PADIN.active) return;
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
  printCtl = openPrint($('printHost'), o, () => { printCtl = null; closeUI(); done && done(); });
}

// ---------- interrogation: catch the lie ----------
// def.interrogation = { id, who, role, model, room, spots:[{pos,label,cond}], unlock(api), intro, statements:[{t, press, lie, crack, after}], wrong, fail, done, gives }
// Progress lives in G.flags['int_' + id] = { broken: [indexes], strikes, state: 'open'|'done'|'failed' } so it is saved with the case.
const IR = { x: 300, z: 300 };
let iv = null; // live interrogation view state
function intState(I) { const k = 'int_' + I.id; if (!G.flags[k]) G.flags[k] = { broken: [], strikes: 0, state: 'open' }; return G.flags[k]; }
function setupInterrogation() {
  const I = G.def.interrogation; if (!I) return;
  for (const s of I.spots) {
    api.interact({ pos: s.pos, radius: 2.8, label: s.label, cond: () => (!s.cond || s.cond(api)) && I.unlock(api) && intState(I).state === 'open' && !G.flags.chasing && !G.flags.hidePhase, use: () => openInterrogation() });
  }
}
function buildInterviewRoom(I) {
  if (G.room) return G.room;
  const r = I.room || {}, x = IR.x, z = IR.z;
  const room = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), new THREE.MeshStandardMaterial({ color: r.wall ?? 0x3a3c40, roughness: 0.9, side: THREE.BackSide }));
  room.position.set(x, 1.5, z); room.userData.noCull = true; scene.add(room);
  B.box(1.8, 0.06, 0.9, r.table ?? 0x4a4c50, x, 0.74, z, { metal: 0.5, rough: 0.4 });
  for (const [lx, lz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) B.box(0.05, 0.74, 0.05, 0x2a2a2a, x + lx, 0, z + lz);
  B.box(0.5, 0.05, 0.5, 0x2a2a2e, x, 0.46, z - 1.0); B.box(0.5, 0.6, 0.05, 0x2a2a2e, x, 0.48, z - 1.25);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: r.lamp ?? 0xfff0d0 })); bulb.position.set(x, 2.3, z); scene.add(bulb);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.22, 16, 1, true), B.mat(0x1a1a1a, { double: true })); shade.position.set(x, 2.42, z); scene.add(shade);
  const light = B.light(x, 2.2, z, r.lamp ?? 0xfff0d0, 0, 7);
  if (r.mirror) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), B.mat(0x0a0c10, { rough: 0.05, metal: 0.95 })); m.position.set(x - 2.48, 1.6, z); m.rotation.y = Math.PI / 2; scene.add(m); }
  const p = B.person(x, z - 1.0, { ...I.model, pose: 'sit', seatH: 0.5, ry: 0, idle: true, collide: false });
  p.userData.noCull = true;
  G.room = { light, person: p };
  return G.room;
}
function openInterrogation() {
  const I = G.def.interrogation, st = intState(I);
  const room = buildInterviewRoom(I);
  room.light.cur = 6;
  iv = { I, st, mode: 'lines', lines: [], li: 0, after: null, idx: 0, saved: { pos: G.pos.clone(), yaw: G.yaw, pitch: G.pitch, flash: G.flashOn } };
  G.flashOn = false; flash.intensity = 0;
  G.camOverride = { pos: new THREE.Vector3(IR.x, 1.3, IR.z + 1.55), look: new THREE.Vector3(IR.x, 1.25, IR.z - 1.0) };
  openUI('interro');
  $('iWho').textContent = I.who;
  renderStrikes();
  sayLines(I.intro, () => showStatement(0));
}
function renderStrikes() { const n = iv.st.strikes; $('iStrikes').textContent = '●'.repeat(3 - n) + '○'.repeat(n); }
function setButtons(mode) {
  for (const id of ['iPrev', 'iNext', 'iPress', 'iPresent']) $(id).classList.toggle('hidden', mode !== 'testimony');
  $('iCont').classList.toggle('hidden', mode !== 'lines');
  $('iPick').classList.add('hidden');
}
function sayLines(lines, done) {
  iv.mode = 'lines'; iv.lines = lines; iv.li = 0; iv.after = done;
  setButtons('lines'); showLine();
}
function showLine() {
  const t = iv.lines[iv.li];
  $('iLine').textContent = t.replace(/^[A-Z]+:\s*/, ''); $('iLine').className = /^[A-Z]+:/.test(t) ? '' : 'narr';
  $('iCount').textContent = '';
  sound.page();
}
function contLine() {
  if (!iv || iv.mode !== 'lines') return;
  iv.li++;
  if (iv.li < iv.lines.length) { showLine(); return; }
  const d = iv.after; iv.after = null; d && d();
}
function showStatement(i) {
  const I = iv.I, n = I.statements.length;
  iv.idx = ((i % n) + n) % n; iv.mode = 'testimony'; setButtons('testimony');
  const s = I.statements[iv.idx], broken = iv.st.broken.includes(iv.idx);
  $('iLine').innerHTML = broken ? `<s>${s.t}</s><br><span class="after">${s.after}</span>` : `“${s.t}”`;
  $('iLine').className = 'testimony';
  $('iCount').textContent = `Statement ${iv.idx + 1} of ${n}${broken ? ' · broken' : ''}`;
}
function pressStatement() {
  const s = iv.I.statements[iv.idx];
  sayLines(s.press, () => showStatement(iv.idx));
}
function openPicker() {
  const pick = $('iPick'); pick.innerHTML = '<div class="muted">Present which clue against this statement?</div>';
  for (const id of G.clues) {
    const c = G.def.clues[id];
    const b = document.createElement('button'); b.className = 'opt'; b.textContent = (c.type === 'evidence' ? 'EV · ' : 'ST · ') + c.title;
    b.onclick = () => presentClue(id);
    pick.appendChild(b);
  }
  const back = document.createElement('button'); back.className = 'opt leave'; back.textContent = 'Back'; back.onclick = () => showStatement(iv.idx); pick.appendChild(back);
  pick.classList.remove('hidden');
  for (const id of ['iPrev', 'iNext', 'iPress', 'iPresent']) $(id).classList.add('hidden');
  pick.scrollIntoView({ block: 'nearest' }); // short (phone) screens: bring the list into view
}
function presentClue(id) {
  const I = iv.I, s = I.statements[iv.idx], st = iv.st;
  const lies = [].concat(s.lie || []);
  if (lies.includes(id) && !st.broken.includes(iv.idx)) {
    st.broken.push(iv.idx);
    const stamp = $('lieStamp'); stamp.className = ''; void stamp.offsetWidth; stamp.className = 'on';
    sound.stinger(); api.shake(0.5);
    const left = I.statements.some((x, k) => x.lie && !st.broken.includes(k));
    sayLines(s.crack, () => {
      if (left) { showStatement(iv.idx + 1); return; }
      st.state = 'done';
      sayLines(I.done, () => { api.give(I.gives); closeInterrogation(); });
    });
    return;
  }
  st.strikes++; renderStrikes(); sound.burst(0.3, 300, 0.3); api.shake(0.25);
  if (st.strikes >= 3) {
    st.state = 'failed';
    sayLines(I.fail, () => closeInterrogation());
    return;
  }
  const k = (st.strikes - 1) % I.wrong.length;
  sayLines([I.wrong[k]], () => showStatement(iv.idx));
}
function closeInterrogation() {
  if (!iv) return;
  const s = iv.saved; iv = null;
  if (G.room) G.room.light.cur = 0;
  G.camOverride = null; G.pos.copy(s.pos); G.yaw = s.yaw; G.pitch = s.pitch; G.flashOn = s.flash;
  closeUI();
  refresh();
}
$('iCont').onclick = contLine;
$('iNext').onclick = () => showStatement(iv.idx + 1);
$('iPrev').onclick = () => showStatement(iv.idx - 1);
$('iPress').onclick = pressStatement;
$('iPresent').onclick = openPicker;
$('iLeave').onclick = () => closeInterrogation();

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
  for (const s of G.suspects) {
    const notes = s.notes.filter((n) => !n.req || G.clues.has(n.req));
    const d = document.createElement('div'); d.className = 'entry';
    d.innerHTML = `<b>${s.name}</b><em>${s.role}</em>` + notes.map((n) => `<span>· ${n.t}</span>`).join('');
    su.appendChild(d);
  }
  $('nbObjective').textContent = objectiveText();
  sound.page();
}

// ---------- case board ----------
let boardPick = null;
function openBoard() {
  openUI('board'); boardPick = null; boardStep = 'suspect'; picks = new Set(); $('bBack').classList.add('hidden');
  const def = G.def, ready = def.required.every((id) => G.clues.has(id));
  const have = def.required.filter((id) => G.clues.has(id)).length;
  $('bTitle').textContent = `${def.num} — ${def.title.toUpperCase()}`;
  $('bStatus').innerHTML = ready
    ? 'You have enough to make a charge. Choose carefully. There is no second chance.'
    : `Key evidence: <b>${have} / ${def.required.length}</b>. Not enough to charge anyone yet.<br><span class="muted">${objectiveText()}</span>`;
  const list = $('bSuspects'); list.innerHTML = '';
  for (const s of G.suspects) {
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
// Step 2: make your case. Pick exactly PROOF_N clues that prove the charge.
const PROOF_N = 3;
let boardStep = 'suspect', picks = new Set();
function showEvidenceStep() {
  boardStep = 'evidence'; picks = new Set();
  const s = boardPick;
  $('bStatus').innerHTML = `Make your case against <b>${s.name}</b>. Choose the <b>${PROOF_N}</b> pieces of evidence that prove <i>he</i> did it, not just that a crime happened. Weak evidence, and the killer walks.`.replace('<i>he</i>', 'they');
  const list = $('bSuspects'); list.innerHTML = '';
  for (const id of G.clues) {
    const c = G.def.clues[id];
    const card = document.createElement('div'); card.className = 'suspect proof'; card.dataset.id = id;
    card.innerHTML = `<div class="mug ${c.type}">${c.type === 'evidence' ? 'EV' : 'ST'}</div><div class="sinfo"><b>${c.title}</b><span>${c.text}</span></div>`;
    card.onclick = () => {
      if (picks.has(id)) picks.delete(id); else if (picks.size < PROOF_N) picks.add(id);
      card.classList.toggle('picked', picks.has(id));
      updateEvidenceButton();
    };
    list.appendChild(card);
  }
  $('bBack').classList.remove('hidden');
  updateEvidenceButton();
}
function updateEvidenceButton() {
  const b = $('bAccuse');
  b.disabled = picks.size !== PROOF_N;
  b.textContent = picks.size === PROOF_N ? `Charge ${boardPick.name}` : `Choose evidence (${picks.size} / ${PROOF_N})`;
}
$('bBack').onclick = () => { $('bBack').classList.add('hidden'); openBoard(); };
$('bAccuse').onclick = () => {
  if (!boardPick) return;
  if (boardStep === 'suspect') { showEvidenceStep(); return; }
  if (picks.size !== PROOF_N) return;
  const titles = [...picks].map((id) => G.def.clues[id].title).join(', ');
  $('confirmText').textContent = `Charge ${boardPick.name} with: ${titles}? This closes the case.`;
  $('confirm').classList.remove('hidden');
};
$('confirmNo').onclick = () => $('confirm').classList.add('hidden');
$('confirmYes').onclick = () => { $('confirm').classList.add('hidden'); accuse(boardPick, [...picks]); };
$('bClose').onclick = () => closeUI();

function accuse(s, chosen = []) {
  const def = G.def;
  const right = s.id === def.culprit, proven = chosen.length > 0 && chosen.every((id) => def.proof.includes(id));
  const good = right && proven, weak = right && !proven;
  const end = good ? def.endings.good : weak ? def.endings.weak : def.endings.bad(s);
  results[def.id] = good ? 'solved' : (results[def.id] === 'solved' ? 'solved' : 'failed');
  if (good && settings.hard) results[def.id + '_hard'] = true;
  saveResults(); clearSave(def.id);
  $('board').classList.add('hidden'); G.ui = null;
  state = 'ending'; $('hud').classList.add('hidden');
  sound.ambience(0.04, 0.03); if (good) sound.heartbeat(3, 1.4); else sound.stinger();
  const el = $('ending'); el.classList.remove('hidden'); el.classList.toggle('bad', !good);
  $('eTitle').textContent = end.title;
  const body = $('eBody'); body.innerHTML = '';
  end.text.forEach((t, i) => { const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = `${0.8 + i * 1.8}s`; body.appendChild(p); });
  $('eActs').style.animationDelay = `${1 + end.text.length * 1.8}s`;
  G.endingKind = good ? 'good' : weak ? 'weak' : 'bad';
  $('eEpilogue').classList.toggle('hidden', def.id !== 'ash');
}
$('eEpilogue').onclick = () => { $('ending').classList.add('hidden'); startCase(HOME, false, { epilogue: G.endingKind }); };
$('creditsSkip').onclick = endCredits;
$('creditsBtn').onclick = () => { sound.init(); rollCredits(); };
$('eHome').onclick = () => { $('ending').classList.add('hidden'); startCase(HOME); };
$('eMenu').onclick = () => { $('ending').classList.add('hidden'); toMenu(); };
$('eRetry').onclick = () => { $('ending').classList.add('hidden'); clearSave(G.def.id); startCase(G.def); };

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
  if (!G || !G.title) { try { startCase(CASES.find((c) => c.id === 'ash') || CASES[0], false, { title: true }); } catch (e) { console.warn('title scene', e); } }
  state = 'menu';
  $('tut').classList.add('hidden');
  $('menu').classList.toggle('title', !!(G && G.title));
  $('hud').classList.add('hidden'); $('pause').classList.add('hidden');
  ['dialog', 'inspect', 'notebook', 'board', 'printer'].forEach((id) => $(id).classList.add('hidden'));
  if (G) G.ui = null;
  if (locked()) document.exitPointerLock();
  $('danger').style.opacity = 0; $('jolt').className = '';
  const list = $('caseList'); list.innerHTML = '';
  for (const def of CASES) {
    const r = results[def.id];
    const card = document.createElement('button'); card.className = 'casecard';
    const sv = readSave(def.id);
    card.innerHTML = `<div class="cnum">${def.num}${r ? ` <span class="res ${r}">${r === 'solved' ? 'SOLVED' : 'UNSOLVED'}${results[def.id + '_hard'] ? ' ★' : ''}</span>` : ''}</div><div class="ctitle">${def.title}</div><div class="cplace">${def.place} · ${def.date}</div><div class="cblurb">${def.blurb}</div>`
      + (sv ? `<div class="cont">▶ Continue · ${(sv.clues || []).length} clues <span class="over">start over</span></div>` : '');
    const locked = def.locked && def.locked(results);
    if (locked) { card.classList.add('locked'); card.innerHTML += `<div class="lockmsg">🔒 ${def.lockText}</div>`; card.onclick = () => toast(def.lockText); list.appendChild(card); continue; }
    card.onclick = () => { sound.init(); $('menu').classList.add('hidden'); startCase(def, !!sv); };
    if (sv) card.querySelector('.over').onclick = (e) => { e.stopPropagation(); sound.init(); clearSave(def.id); $('menu').classList.add('hidden'); startCase(def); };
    list.appendChild(card);
  }
  $('lilyCount').textContent = secretCount() ? `White lilies found: ${secretCount()} / 3` : '';
  $('menu').classList.remove('hidden');
}
function openNews() {
  const body = $('newsBody'); body.innerHTML = '';
  NOTES.forEach((n, i) => {
    const d = document.createElement('div'); d.className = 'rel' + (i ? ' old' : '');
    d.innerHTML = `<h3><span>v${n.v}</span>${n.title}<em>${n.date}</em></h3><ul>${n.items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
    body.appendChild(d);
  });
  $('whatsnew').classList.remove('hidden');
  try { localStorage.setItem('hb_seen_version', VERSION); } catch {}
}
$('verLabel').textContent = 'v' + VERSION;
for (const id of ['hardMode', 'sHard']) {
  $(id).checked = !!settings.hard;
  $(id).onchange = () => { settings.hard = $(id).checked; $('hardMode').checked = $('sHard').checked = settings.hard; saveSettings(); if (G) refresh(); };
}
$('newsBtn').onclick = openNews;
$('homeBtn').onclick = () => { sound.init(); startCase(HOME); };
$('newsClose').onclick = () => $('whatsnew').classList.add('hidden');
$('whatsnew').addEventListener('click', (e) => { if (e.target.id === 'whatsnew') $('whatsnew').classList.add('hidden'); });
$('warnOk').onclick = () => { sound.init(); sound.setVolume(settings.vol); $('warning').classList.add('hidden'); toMenu();
  let seen = null; try { seen = localStorage.getItem('hb_seen_version'); } catch {}
  if (seen !== VERSION) openNews();
};
$('warnNo').onclick = () => { $('warning').innerHTML = '<div class="warnbox"><p class="muted">Take care of yourself. You can close this tab.</p></div>'; };

// pause controls
$('resume').onclick = () => lock();
$('openNb').onclick = () => { showPause(false); openNotebook(); };
$('quit').onclick = () => toMenu();
const bindSlider = (id, key, apply) => { const el = $(id); el.value = settings[key]; el.oninput = () => { settings[key] = +el.value; apply(+el.value); saveSettings(); }; };
bindSlider('sBright', 'bright', (v) => { renderer.toneMappingExposure = v; });
bindSlider('sSens', 'sens', () => {});
bindSlider('sFov', 'fov', (v) => { camera.fov = v; camera.updateProjectionMatrix(); });
$('sSub').value = String(settings.sub || 1);
$('sSub').onchange = () => { settings.sub = +$('sSub').value; document.documentElement.style.setProperty('--sub', settings.sub); saveSettings(); };
for (const [id, key, after] of [['sInvert', 'invert'], ['sCalm', 'calm'], ['wCalm', 'calm'], ['sPads', 'pads', (v) => { pad.enabled = v; }]]) {
  $(id).checked = key === 'pads' ? settings.pads !== false : !!settings[key];
  $(id).onchange = () => { settings[key] = $(id).checked; saveSettings(); if (key === 'calm') { $('sCalm').checked = $('wCalm').checked = settings.calm; if (G) toast('Reduce flashing applies fully from the next case or scene.'); } if (after) after(settings[key]); };
}
bindSlider('sVol', 'vol', (v) => sound.setVolume(v));
function syncQualityUI() { $('sQuality').value = settings.quality; }
syncQualityUI();
$('sQuality').onchange = () => { const was = settings.quality; settings.quality = $('sQuality').value; settings.qualityManual = true; saveSettings(); applyQuality(); if (G && state === 'play' && (was === 'low') !== (settings.quality === 'low')) toast('Some changes apply fully the next time you start a case'); };
buildComposer();
$('sFps').checked = !!settings.showFps; $('fps').classList.toggle('hidden', !settings.showFps);
$('sFps').onchange = () => { settings.showFps = $('sFps').checked; saveSettings(); $('fps').classList.toggle('hidden', !settings.showFps); };
if (SOFTWARE_GPU) { $('gpuWarn').classList.remove('hidden'); if (!settings.qualityManual) { applyQuality(); syncQualityUI(); } }
$('gpuName').textContent = GPU;
$('nbClose').onclick = () => closeUI();
$('notebook').addEventListener('click', (e) => { if (e.target.id === 'notebook') closeUI(); });
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
  if (G.ui === 'interro') {
    if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); if (iv && iv.mode === 'lines') contLine(); }
    else if (e.code === 'ArrowRight' && iv && iv.mode === 'testimony') showStatement(iv.idx + 1);
    else if (e.code === 'ArrowLeft' && iv && iv.mode === 'testimony') showStatement(iv.idx - 1);
    else if (e.code === 'Escape') closeInterrogation();
    return;
  }
  if (G.ui === 'inspect') { if (['KeyE', 'Escape', 'Enter'].includes(e.code)) finishInspect(); return; }
  if (G.ui === 'notebook') { if (['Tab', 'KeyN', 'Escape'].includes(e.code)) closeUI(); return; }
  if (G.ui === 'board') { if (e.code === 'Escape' && $('confirm').classList.contains('hidden')) closeUI(); return; }
  if (G.ui) { if (e.code === 'Escape') closeUI(); return; }
  keys[e.code] = true;
  if (e.code === 'KeyE' && G.nearest) useNearest();
  if (e.code === 'KeyF') { tutMark('flash'); api.flash(!G.flashOn); }
  if (e.code === 'Tab' || e.code === 'KeyN') { tutMark('notebook'); openNotebook(); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('mousemove', (e) => {
  if (!locked() || !G || G.ui || G.cut) return;
  const s = 0.0022 * settings.sens;
  G.yaw -= e.movementX * s; G.pitch -= e.movementY * s * (settings.invert ? -1 : 1);
  G.pitch = Math.max(-1.45, Math.min(1.45, G.pitch));
});
canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && locked() && G && !G.ui && !G.cut && G.nearest) useNearest(); });
function useNearest() {
  const it = G.nearest; if (!it) return;
  it.use();
  tutMark('examine');
  if (it.once) { it.alive = false; if (it.sprite) it.sprite.visible = false; }
}

// ---------- touch controls ----------
function setTouchMode(on) {
  TOUCH.on = on;
  document.body.classList.toggle('touch', on);
  if (on && document.pointerLockElement) document.exitPointerLock();
}
function goFullscreen() {
  const d = document.documentElement;
  try {
    const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen && d.webkitRequestFullscreen();
    if (p && p.then) p.then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
  } catch {}
}
function updateTouchAct(best) {
  const b = $('tAct');
  const show = TOUCH.on && best && state === 'play' && !G.ui && !G.cut && active();
  b.classList.toggle('hidden', !show);
  if (show) {
    const label = typeof best.label === 'function' ? best.label() : best.label;
    if (b.dataset.l !== label) { b.dataset.l = label; b.textContent = label; }
  }
}
(() => {
  setTouchMode(TOUCH.on);
  addEventListener('touchstart', () => { if (!TOUCH.on) setTouchMode(true); }, { passive: true });
  const zoneL = $('stickZone'), zoneR = $('lookZone'), stick = $('stick'), knob = $('stickKnob');
  let sId = null, sx = 0, sy = 0, lId = null, lx = 0, ly = 0;
  const R = 60;
  const resetStick = () => { sId = null; TOUCH.mx = TOUCH.mz = 0; TOUCH.run = false; stick.classList.remove('on', 'run'); };

  // left side: a floating stick that appears where the thumb lands
  zoneL.addEventListener('pointerdown', (e) => {
    if (sId !== null) return;
    sId = e.pointerId; sx = e.clientX; sy = e.clientY; zoneL.setPointerCapture(e.pointerId);
    stick.style.left = sx + 'px'; stick.style.top = sy + 'px'; knob.style.transform = 'translate(-50%,-50%)';
    stick.classList.add('on'); e.preventDefault();
  });
  zoneL.addEventListener('pointermove', (e) => {
    if (e.pointerId !== sId) return;
    let dx = e.clientX - sx, dy = e.clientY - sy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const k = Math.min(1, d / R), dead = 0.15;
    const mag = k < dead ? 0 : (k - dead) / (1 - dead);
    const cd = Math.min(d, R) || 1;
    TOUCH.mx = (dx / cd) * mag; TOUCH.mz = (-dy / cd) * mag;
    TOUCH.run = d > R * 1.15;
    stick.classList.toggle('run', TOUCH.run);
  });
  const endL = (e) => { if (e.pointerId === sId) resetStick(); };
  zoneL.addEventListener('pointerup', endL); zoneL.addEventListener('pointercancel', endL);

  // right side: drag to look
  zoneR.addEventListener('pointerdown', (e) => {
    if (lId !== null) return;
    lId = e.pointerId; lx = e.clientX; ly = e.clientY; zoneR.setPointerCapture(e.pointerId); e.preventDefault();
  });
  zoneR.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lId) return;
    if (G && !G.ui && !G.cut && active()) {
      const s = 0.0058 * settings.sens;
      G.yaw -= (e.clientX - lx) * s; G.pitch -= (e.clientY - ly) * s * (settings.invert ? -1 : 1);
      G.pitch = Math.max(-1.45, Math.min(1.45, G.pitch));
    }
    lx = e.clientX; ly = e.clientY;
  });
  const endR = (e) => { if (e.pointerId === lId) lId = null; };
  zoneR.addEventListener('pointerup', endR); zoneR.addEventListener('pointercancel', endR);

  const tap = (id, fn) => $(id).addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (state === 'play' && G && !G.cut && !G.ui) fn();
  });
  tap('tAct', () => { if (G.nearest) { resetStick(); useNearest(); } });
  tap('tFlash', () => { tutMark('flash'); api.flash(!G.flashOn); });
  tap('tNote', () => { tutMark('notebook'); resetStick(); openNotebook(); });
  tap('tPause', () => { resetStick(); showPause(true); });
  // hold-breath button for touch
  const tb = $('tBreath');
  tb.addEventListener('pointerdown', (e) => { e.preventDefault(); TOUCH.breath = true; tb.classList.add('on'); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) tb.addEventListener(ev, () => { TOUCH.breath = false; tb.classList.remove('on'); });
  // keep the page from scrolling or zooming during play
  document.addEventListener('touchmove', (e) => { if (state === 'play' && e.target.closest && e.target.closest('#touch')) e.preventDefault(); }, { passive: false });
})();

// ---------- v4: gamepad ----------
const pad = new Pad(); pad.enabled = settings.pads !== false;
const PADIN = { mx: 0, mz: 0, run: false, breath: false, active: false };
let padFocus = 0, padStick = 0;
const UI_ORDER = ['credits', 'confirm', 'whatsnew', 'interro', 'board', 'inspect', 'printer', 'notebook', 'dialog', 'pause', 'ending', 'intro', 'menu', 'warning'];
function shown(el) { return el && !el.classList.contains('hidden') && el.offsetParent !== null; }
function padItems() {
  for (const id of UI_ORDER) {
    const el = $(id);
    if (!el || el.classList.contains('hidden') || getComputedStyle(el).display === 'none') continue;
    const items = [...el.querySelectorAll('button:not([disabled]), .casecard, .suspect, input, select')].filter((x) => shown(x) && !x.closest('.hidden'));
    if (items.length) return items;
  }
  return [];
}
function padBack() {
  if (!$('whatsnew').classList.contains('hidden')) { $('whatsnew').classList.add('hidden'); return; }
  if (!$('credits').classList.contains('hidden')) { endCredits(); return; }
  if (!G) return;
  if (G.ui === 'dialog') { if (dlg && !dlg.lines) { dlg = null; closeUI(); } return; }
  if (G.ui === 'inspect') { finishInspect(); return; }
  if (G.ui === 'interro') { closeInterrogation(); return; }
  if (G.ui) { closeUI(); return; }
  if (!$('pause').classList.contains('hidden')) lock();
}
function padUI(p) {
  if (p.pressed(BTN.B)) { padBack(); return; }
  if (G && G.ui === 'printer' && printCtl) { printCtl.pad(p.lx, p.ly, p.down(BTN.A)); if (!p.pressed(BTN.START)) return; }
  const items = padItems();
  document.querySelectorAll('.padfocus').forEach((e) => e.classList.remove('padfocus'));
  if (!items.length) return;
  const sy = p.ly, sx = p.lx, dirNow = Math.abs(sy) > 0.6 ? Math.sign(sy) : Math.abs(sx) > 0.6 ? Math.sign(sx) : 0;
  let step = 0;
  if (p.pressed(BTN.DOWN) || p.pressed(BTN.RIGHT)) step = 1;
  if (p.pressed(BTN.UP) || p.pressed(BTN.LEFT)) step = -1;
  if (dirNow && dirNow !== padStick) step = dirNow;
  padStick = dirNow;
  padFocus = ((padFocus + step) % items.length + items.length) % items.length;
  const el = items[padFocus];
  el.classList.add('padfocus'); if (step) el.scrollIntoView({ block: 'nearest' });
  if (el.type === 'range' && (p.pressed(BTN.LEFT) || p.pressed(BTN.RIGHT))) return;
  if (p.pressed(BTN.A)) { el.click(); padFocus = 0; }
  if (p.pressed(BTN.START) && G && state === 'play' && !$('pause').classList.contains('hidden')) lock();
}
function updatePad(dt) {
  const p = pad.poll();
  PADIN.active = !!p;
  if (!p) { PADIN.mx = PADIN.mz = 0; PADIN.run = PADIN.breath = false; document.querySelectorAll('.padfocus').forEach((e) => e.classList.remove('padfocus')); return; }
  const inUI = state !== 'play' || !G || G.ui || G.cut || !$('pause').classList.contains('hidden') || !$('whatsnew').classList.contains('hidden');
  PADIN.breath = p.down(BTN.LT) || p.down(BTN.RB);
  if (inUI) { PADIN.mx = PADIN.mz = 0; if (!(G && G.cut)) padUI(p); return; }
  document.querySelectorAll('.padfocus').forEach((e) => e.classList.remove('padfocus'));
  PADIN.mx = p.lx; PADIN.mz = -p.ly; PADIN.run = p.down(BTN.LB) || p.down(BTN.L3) || Math.hypot(p.lx, p.ly) > 0.97;
  if (!G.frozen || G.flags.hidePhase) {
    const s = 2.6 * settings.sens * dt;
    G.yaw -= p.rx * s; G.pitch -= p.ry * s * (settings.invert ? -1 : 1);
    G.pitch = Math.max(-1.45, Math.min(1.45, G.pitch));
  }
  if (p.pressed(BTN.A) && G.nearest) { tutMark('examine'); useNearest(); }
  if (p.pressed(BTN.X)) { tutMark('flash'); api.flash(!G.flashOn); }
  if (p.pressed(BTN.Y)) { tutMark('notebook'); openNotebook(); }
  if (p.pressed(BTN.START)) showPause(true);
}

// ---------- v4: first-time tutorial ----------
const TUT = ['move', 'look', 'examine', 'flash', 'notebook'];
let tut = null;
function tutStart() {
  let done = false; try { done = localStorage.getItem('hb_tut') === '1'; } catch {}
  if (done || !G || G.def.isHome || G.opts.title || G.opts.epilogue) { $('tut').classList.add('hidden'); tut = null; return; }
  tut = { left: new Set(TUT), p0: G.pos.clone(), y0: G.yaw, t: 0 };
  const L = TOUCH.on
    ? { move: 'Left thumb: move', look: 'Right thumb: look around', examine: 'Tap the button that appears to examine', flash: 'LIGHT: flashlight on/off', notebook: 'NOTES: your notebook' }
    : PADIN.active
      ? { move: 'Left stick: move (LB to run)', look: 'Right stick: look', examine: 'A: examine / talk', flash: 'X: flashlight', notebook: 'Y: notebook' }
      : { move: 'WASD: move (Shift to run)', look: 'Mouse: look', examine: 'E or click: examine / talk', flash: 'F: flashlight', notebook: 'Tab: notebook' };
  $('tut').innerHTML = '<b>HOW TO PLAY</b>' + TUT.map((k) => `<div data-k="${k}">☐ ${L[k]}</div>`).join('');
  $('tut').classList.remove('hidden');
}
function tutMark(k) {
  if (!tut || !tut.left.has(k)) return;
  tut.left.delete(k);
  const row = $('tut').querySelector(`[data-k="${k}"]`); if (row) { row.classList.add('done'); row.textContent = '☑' + row.textContent.slice(1); }
  if (!tut.left.size) { tut = null; try { localStorage.setItem('hb_tut', '1'); } catch {} setTimeout(() => $('tut').classList.add('hidden'), 1500); }
}
function tutUpdate(dt) {
  if (!tut || state !== 'play') return;
  tut.t += dt;
  if (G.pos.distanceTo(tut.p0) > 2.5) tutMark('move');
  if (Math.abs(G.yaw - tut.y0) > 0.9) tutMark('look');
  if (tut && tut.t > 120) { $('tut').classList.add('hidden'); tut = null; }
}

// ---------- v4: secret lilies (one hidden in each of Cases 01-03) ----------
const secrets = (() => { try { return JSON.parse(localStorage.getItem('hb_secrets') || '{}'); } catch { return {}; } })();
const secretCount = () => ['cmary', 'wing', 'harrow'].filter((k) => secrets[k]).length;

// ---------- v4: credits + epilogue ----------
function rollCredits() {
  const c = CREDITS, el = $('creditsRoll');
  const sec = (h, items) => (items && items.length ? `<h4>${h}</h4>` + items.map((x) => `<p>${typeof x === 'string' ? x : `${x.role} <span>${x.name}</span>`}</p>`).join('') : '');
  el.innerHTML = `<h2>${c.title}</h2><p class="by">A game by</p><h3>${c.creator}</h3>`
    + sec('Playtesters', c.playtesters) + sec('Thanks', c.thanks) + sec('', c.tech)
    + `<p class="last">Every case closes.<br>None of them end.</p>`;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  $('credits').classList.remove('hidden');
  state = 'credits'; $('hud').classList.add('hidden');
  clearTimeout(rollCredits.t); rollCredits.t = setTimeout(endCredits, 52000);
}
function endCredits() { clearTimeout(rollCredits.t); $('credits').classList.add('hidden'); toMenu(); }

let printCtl = null;

// ---------- per-frame ----------
const R = 0.38;
function collide(p, R = 0.38) {
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
  const canMove = active() && !G.ui && !G.frozen;
  let mx = 0, mz = 0;
  if (canMove) {
    if (keys.KeyW || keys.ArrowUp) mz += 1; if (keys.KeyS || keys.ArrowDown) mz -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    mx += TOUCH.mx + PADIN.mx; mz += TOUCH.mz + PADIN.mz;
  }
  const run = keys.ShiftLeft || keys.ShiftRight || (canMove && (TOUCH.run || PADIN.run));
  const sp = run ? 5.2 : 2.9;
  const moving = mx || mz;
  if (moving) {
    const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
    const sy = Math.sin(G.yaw), cy = Math.cos(G.yaw);
    G.pos.x += (-sy * mz + cy * mx) * sp * dt;
    G.pos.z += (-cy * mz - sy * mx) * sp * dt;
    collide(G.pos); collide(G.pos);
    G.bob += dt * (run ? 11 : 7.5);
    G.stepAcc += sp * dt;
    if (G.stepAcc > (run ? 1.1 : 0.85)) { G.stepAcc = 0; sound.step(run); }
  }
  camera.position.set(G.pos.x, (G.eyeH || 1.65) + (moving ? Math.sin(G.bob) * 0.035 : 0), G.pos.z);
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
      it.sprite.visible = ok && dist < 16 && !settings.hard;
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
  updateTouchAct(best);
  if (best && !G.ui && active() && !TOUCH.on) {
    const label = typeof best.label === 'function' ? best.label() : best.label;
    pr.innerHTML = `<span class="key">E</span>${label}`; pr.classList.remove('hidden');
    $('cross').classList.add('active');
  } else { pr.classList.add('hidden'); $('cross').classList.remove('active'); }
}

function updateRain(dt) {
  if (G.rain.userData.snow) {
    const a = G.rain.geometry.attributes.position, arr = a.array, sd = G.rain.userData.seed, cx = camera.position.x, cz = camera.position.z, t = G.t;
    for (let i = 0, j = 0; i < arr.length; i += 3, j++) {
      arr[i + 1] -= (1.1 + (sd[j] % 1) * 0.8) * dt;
      arr[i] += (Math.sin(t * 0.7 + sd[j]) * 0.5 + 0.9) * dt; // wind from the west
      arr[i + 2] += Math.cos(t * 0.5 + sd[j] * 2) * 0.3 * dt;
      if (arr[i + 1] < 0 || Math.abs(arr[i] - cx) > 18 || Math.abs(arr[i + 2] - cz) > 18) {
        arr[i] = cx + (Math.random() - 0.5) * 36; arr[i + 1] = 6 + Math.random() * 8; arr[i + 2] = cz + (Math.random() - 0.5) * 36;
      }
    }
    a.needsUpdate = true; return;
  }
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

// Flashlight "eye adaptation": measure how far away the thing in the middle of the beam is
// (walls, trees, people via their collision boxes, or the ground) and scale the beam so whatever
// you look at is lit about the same. Stops faces turning white up close without losing range.
const _fd = new THREE.Vector3();
function aimDistance() {
  camera.getWorldDirection(_fd);
  const ox = camera.position.x, oz = camera.position.z, h = Math.hypot(_fd.x, _fd.z);
  let best = 30;
  if (_fd.y < -0.01) best = Math.min(best, camera.position.y / -_fd.y);
  if (h > 1e-4) {
    const dx = _fd.x / h, dz = _fd.z / h, ix = 1 / (dx || 1e-9), iz = 1 / (dz || 1e-9);
    for (const c of G.colliders) {
      let t1 = (c.x0 - ox) * ix, t2 = (c.x1 - ox) * ix; let tmin = Math.min(t1, t2), tmax = Math.max(t1, t2);
      t1 = (c.z0 - oz) * iz; t2 = (c.z1 - oz) * iz;
      tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      if (tmax >= Math.max(tmin, 0) && tmin < best * h) best = Math.min(best, Math.max(tmin, 0.3) / h);
    }
  }
  return Math.max(0.6, best);
}
function updateFlash(dt) {
  if (!G.flashOn) { flash.intensity = 0; return; }
  const target = Math.max(14, Math.min(170, 7.5 * Math.pow(aimDistance(), 1.3)));
  G.flashBase = G.flashBase === undefined ? target : G.flashBase + (target - G.flashBase) * Math.min(1, dt * 5);
  G.flashFlicker -= dt;
  let k = 1;
  if (G.flashFlicker < 0) { if (!settings.calm && Math.random() < 0.004) G.flashFlicker = 0.6 + Math.random() * 0.6; } // brief failing battery moment
  else k = Math.random() < 0.4 ? 0.05 : 0.7;
  flash.intensity = G.flashBase * k;
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
  updatePad(dt); tutUpdate(dt);
  if (state === 'play') {
    if (G.cut) { updateCut(dt); updateFlash(dt); }
    else { updatePlayer(dt); updateInteract(); updateFlash(dt); updateAmbience(); }
  } else if (state === 'menu' && G.title) {
    // slow drift down the rainy street behind the menu
    const k = (G.t * 0.55) % 70;
    camera.position.set(0.6 + Math.sin(G.t * 0.07) * 1.2, 2.3 + Math.sin(G.t * 0.11) * 0.15, 28 - k);
    camera.lookAt(-0.5 + Math.sin(G.t * 0.05) * 2, 1.7, 18 - k);
  } else if (state === 'intro' || state === 'ending') {
    camera.position.set(G.pos.x, 1.65, G.pos.z); camera.rotation.set(G.pitch, G.yaw + Math.sin(G.t * 0.1) * 0.05, 0);
  }
  for (const a of G.anims) a(dt);
  if (G.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * G.shake * 0.12; camera.position.y += (Math.random() - 0.5) * G.shake * 0.1;
    camera.rotation.z += (Math.random() - 0.5) * G.shake * 0.06; G.shake = Math.max(0, G.shake - dt * 1.4);
  }
  if (G.camOverride) { camera.position.copy(G.camOverride.pos); camera.lookAt(G.camOverride.look); if (G.rain) G.rain.visible = false; }
  if (G.sky) G.sky.position.copy(camera.position);
  camera.getWorldDirection(fwd); sound.setListener(camera.position, fwd);
  if (state === 'play') { updateStalker(dt); G.saveT = (G.saveT || 0) + dt; if (G.saveT > 6) { G.saveT = 0; saveGame(); } }
  updatePool();
  updateCulling();
  updateFps(dt);
  if (!G.def.isHome) updateRain(dt);
  if (state === 'play' && !G.cut && !G.ui) autoQuality(dt);
  if (composer && renderPass && renderPass.scene === scene) { gradePass.uniforms.time.value = G.t % 50; composer.render(); }
  else renderer.render(scene, camera);
}
requestAnimationFrame(frame);

// grain overlay
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 22; }
  g.putImageData(img, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
})();

// test hook for the automated playtests in tools/playtest (only with ?test in the URL)
if (new URLSearchParams(location.search).has('test')) window.__hb = { CASES, startCase, api, toMenu, camera, renderer, settings, applyQuality, breath: (v) => { TOUCH.breath = v; }, get G() { return G; }, get state() { return state; } };
