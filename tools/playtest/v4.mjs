// Title, wheel/joystick guard, gamepad, lilies, settings, epilogue, credits
import { open } from './harness.mjs';
const { ev, shot, sleep, send, errs, touch, tapAt, tapEl, done } = await open(import.meta.url);
await sleep(8000);
await shot('01-warning');
await ev(`HTMLElement.prototype.requestPointerLock = () => {}; Object.defineProperty(Document.prototype, 'pointerLockElement', { configurable: true, get() { return document.querySelector('#game canvas'); } }); const st = document.createElement('style'); st.textContent = '#pause{display:none!important}'; document.head.appendChild(st); document.getElementById('warnOk').click();`);
await sleep(800);

const helpers = `
const H = window.__hb; const sleep = (ms) => new Promise(r => setTimeout(r, ms)); const $ = (s) => document.querySelector(s);
async function drain() {
  for (let k = 0; k < 400; k++) {
    const g = H.G;
    if (g.cut) { await sleep(250); continue; }
    if (g.ui === 'dialog') {
      const c = $('#dOpts .opt.cont');
      if (c) { c.click(); await sleep(5); if ($('#dOpts .opt.cont')) $('#dOpts .opt.cont').click(); }
      else { const t = [...document.querySelectorAll('#dOpts .opt:not(.leave):not(.asked)')]; if (t.length) t[0].click(); else $('#dOpts .leave').click(); }
      await sleep(10); continue;
    }
    if (g.ui === 'inspect') { const a = [...document.querySelectorAll('#iActs .btn')]; a[0].click(); await sleep(10); continue; }
    if (g.ui === 'printer') { const b = $('.fp-done'); b.disabled = false; b.click(); await sleep(10); continue; }
    if (g.ui) { return 'stuck ui ' + g.ui; }
    return 'ok';
  }
  return 'timeout';
}
async function sweep() {
  const out = [];
  for (let pass = 0; pass < 3; pass++) for (const it of H.G.interacts) {
    if (!it.alive || (it.cond && !it.cond())) continue;
    const label = typeof it.label === 'function' ? it.label() : it.label;
    if (/Case board/.test(label)) continue;
    H.G.pos.set(it.pos.x + 1.2, 0, it.pos.z + 1.2);
    it.use(); const r = await drain(); out.push(label + ':' + r);
  }
  return out;
}
`;

const out = {};
const waitFor = async (js, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(js)) return true; await sleep(300); } return false; };
// fake gamepads: index 0 = a steering wheel resting at full lock (must be ignored); index 1 = a standard pad
await ev(`
  window.__pads = [
    { id: 'Logitech G29 Driving Force Racing Wheel', index: 0, connected: true, mapping: '', axes: [1, -1, 1, 1], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) },
    { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', index: 1, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) },
  ];
  navigator.getGamepads = () => window.__pads;`);
out.title = await ev(`await new Promise(r => setTimeout(r, 2500)); const H = window.__hb; return { state: H.state, title: !!(H.G && H.G.title), menuTitleClass: document.getElementById('menu').classList.contains('title'), camZ: H.camera.position.z.toFixed(1) };`);
await ev(`document.getElementById('whatsnew').classList.add('hidden');`);
await sleep(2500); await shot('v4-title');
// wheel must not move anything; pad adopts on a button press
out.wheel = await ev(`const H = window.__hb; ${'const sleep = (ms) => new Promise(r => setTimeout(r, ms));'}
  H.startCase(H.CASES[0]); document.querySelector('#introLines button').click(); await sleep(800);
  const y0 = H.G.yaw, p0 = H.G.pos.clone(); await sleep(1500);
  return { yawMoved: Math.abs(H.G.yaw - y0).toFixed(3), posMoved: H.G.pos.distanceTo(p0).toFixed(3), tutShown: !document.getElementById('tut').classList.contains('hidden') };`);
await shot('v4-tut');
out.pad = await ev(`const H = window.__hb; const sleep = (ms) => new Promise(r => setTimeout(r, ms)); const P = window.__pads[1];
  P.buttons[0] = { pressed: true, value: 1 }; await sleep(200); P.buttons[0] = { pressed: false, value: 0 }; await sleep(200);
  const p0 = H.G.pos.clone(), y0 = H.G.yaw;
  P.axes = [0, -1, 0.8, 0]; await sleep(1500); P.axes = [0, 0, 0, 0]; await sleep(200);
  return { moved: H.G.pos.distanceTo(p0).toFixed(2), turned: Math.abs(H.G.yaw - y0).toFixed(2), tutLeft: document.querySelectorAll('#tut div:not(.done)').length };`);
// lily in case 1
out.lily = await ev(`const H = window.__hb; const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const it = H.G.interacts.find(i => i.label === 'A white lily' && i.cond()); if (!it) return 'no lily';
  H.G.pos.set(17.6 - 1, 0, -29.4); it.use(); await sleep(300); const t = document.getElementById('iTitle').textContent; document.querySelector('#iActs .btn').click(); await sleep(200);
  return { title: t, has: H.api.hasSecret('cmary'), gone: !H.G.interacts.some(i => i.label === 'A white lily' && i.cond()) };`);
// pad drives the menu: back to menu, press down then A on the first case card
out.padMenu = await ev(`const H = window.__hb; const sleep = (ms) => new Promise(r => setTimeout(r, ms)); const P = window.__pads[1];
  H.toMenu(); await sleep(1500); document.getElementById('whatsnew').classList.add('hidden');
  const before = document.querySelector('.padfocus') && document.querySelector('.padfocus').textContent.slice(0, 20);
  P.buttons[13] = { pressed: true, value: 1 }; await sleep(150); P.buttons[13] = { pressed: false, value: 0 }; await sleep(150);
  const focused = document.querySelector('.padfocus') && document.querySelector('.padfocus').textContent.slice(0, 30);
  return { focused, lilies: document.getElementById('lilyCount').textContent };`);
await shot('v4-menu-pad');
// settings
out.settings = await ev(`const H = window.__hb; const f = document.getElementById('sFov'); f.value = 90; f.dispatchEvent(new Event('input')); const s = document.getElementById('sSub'); s.value = '1.3'; s.dispatchEvent(new Event('change'));
  return { fov: H.camera.fov, sub: getComputedStyle(document.documentElement).getPropertyValue('--sub').trim() };`);
// epilogue + true ending + credits
out.epi = await ev(`const H = window.__hb; const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  localStorage.setItem('hb_secrets', JSON.stringify({ cmary: true, wing: true, harrow: true }));
  return 'set';`);
await ev(`location.reload();`); await sleep(8000);
await ev(`HTMLElement.prototype.requestPointerLock = () => {}; Object.defineProperty(Document.prototype, 'pointerLockElement', { configurable: true, get() { return document.querySelector('#game canvas'); } }); document.getElementById('warnOk').click();`);
await sleep(2500);
out.ending = await ev(`const H = window.__hb; const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  H.startCase(H.CASES[3]); document.querySelector('#introLines button').click(); await sleep(500);
  for (const id of ['typewriter', 'files', 'gallery']) H.api.give(id);
  H.api.board(); await sleep(200); [...document.querySelectorAll('.suspect')].find(e => e.textContent.includes('Lund')).click(); document.getElementById('bAccuse').click(); await sleep(150);
  for (const id of ['typewriter', 'files', 'gallery']) document.querySelector('.suspect.proof[data-id="' + id + '"]').click();
  document.getElementById('bAccuse').click(); document.getElementById('confirmYes').click(); await sleep(300);
  const epiShown = !document.getElementById('eEpilogue').classList.contains('hidden');
  document.getElementById('eEpilogue').click(); await sleep(1500);
  return { epiShown, def: H.G.def.id, cut: !!H.G.cut, shots: H.G.cut && H.G.cut.steps.length };`);
await waitFor(`const c = window.__hb.G.cut; return c && c.i >= 4;`, 120000); await shot('v4-epilogue');
out.credits = await waitFor(`return !document.getElementById('credits').classList.contains('hidden');`, 240000);
await sleep(6000); await shot('v4-credits');
out.after = await ev(`document.getElementById('creditsSkip').click(); await new Promise(r => setTimeout(r, 1500)); return { state: window.__hb.state, title: !!window.__hb.G.title };`);
console.log(JSON.stringify(out, null, 1));
await done();
