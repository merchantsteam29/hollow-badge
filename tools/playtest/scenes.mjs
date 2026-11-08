// Every case at every quality level: draw calls and errors
import { open } from './harness.mjs';
const { ev, shot, sleep, send, errs, touch, tapAt, tapEl, done } = await open(import.meta.url);
await sleep(8000);
await shot('01-warning');
await ev(`HTMLElement.prototype.requestPointerLock = () => {}; Object.defineProperty(Document.prototype, 'pointerLockElement', { configurable: true, get() { return document.querySelector('#game canvas'); } }); const st = document.createElement('style'); st.textContent = '#pause{display:none!important}'; document.head.appendChild(st); document.getElementById('warnOk').click();`);
await sleep(800); await shot('02-menu');

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

const views = {
  0: [[1.6, 24, 0, 0.05, 'street'], [-4, 7, 1.9, -0.05, 'rowe'], [-6, -14, -2.4, 0, 'playground'], [0.5, -47, 1.35, 0.05, 'woods']],
  1: [[0, 20, 0, 0.05, 'main'], [-4, -4, 1.5, 0, 'lane'], [2, 12, -1.3, 0.05, 'bar'], [0, -50, 0, 0.1, 'church']],
  2: [[1.5, 23, 0, 0.05, 'arrive'], [3, 16, -1.6, 0.05, 'diner'], [0, 6, 1.2, 0.08, 'street'], [-3, -50, 1.2, 0, 'lake']],
};
const q = process.env.Q || 'medium';
for (const ci of [0, 1, 2]) {
  await ev(`const H = window.__hb; H.settings.qualityManual = true; H.settings.quality = '${q}'; H.applyQuality(); H.startCase(H.CASES[${ci}]); document.querySelector('#introLines button').click();`);
  await sleep(2500);
  for (const [x, z, yaw, pitch, n] of views[ci]) {
    await ev(`const H = window.__hb; H.G.pos.set(${x}, 0, ${z}); H.G.yaw = ${yaw}; H.G.pitch = ${pitch};`);
    await sleep(2200); await shot(`g-${q}-${ci}-${n}`);
  }
}
console.log(await ev(`return { calls: window.__hb.renderer.info.render.calls, programs: window.__hb.renderer.info.programs.length }`));
await done();
