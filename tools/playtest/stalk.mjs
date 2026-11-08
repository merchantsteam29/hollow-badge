// The watcher glimpses and lightning
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

await ev(`const H = window.__hb; H.settings.qualityManual = true; H.settings.quality = 'medium'; H.applyQuality(); H.startCase(H.CASES[1]); document.querySelector('#introLines button').click();`);
await sleep(2500);
await ev(`const H = window.__hb; H.G.pos.set(0, 0, 10); H.G.yaw = 0; H.G.t = 60; H.G.stalk.next = 0; window.__r = Math.random; Math.random = () => 0.5;`);
await sleep(1500);
console.log(await ev(`const H = window.__hb; Math.random = window.__r; const w = H.G.watcher; H.G.yaw = Math.atan2(-(w.position.x - H.G.pos.x), -(w.position.z - H.G.pos.z)) + 0.38; return JSON.stringify({ ev: H.G.stalk.ev && H.G.stalk.ev.kind, vis: w.visible });`));
await sleep(1500); await shot('v21-glimpse');
// lightning: hold the event open by pausing its clock at the flash
await ev(`const H = window.__hb; H.G.watcher.visible = false; H.G.stalk.ev = null; H.G.pos.set(0, 0, 18); H.G.yaw = 0; H.G.stalk.next = 0; let k = 0; window.__r2 = Math.random; Math.random = () => 0.2;`);
await sleep(1200);
console.log(await ev(`const H = window.__hb; Math.random = window.__r2; const e = H.G.stalk.ev; if (e && e.kind === 'lightning') { e.t = 0.04; e.freeze = true; } return JSON.stringify({ ev: e && e.kind, figure: e && e.figure, wpos: [H.G.watcher.position.x.toFixed(1), H.G.watcher.position.z.toFixed(1)] });`));
await ev(`const H = window.__hb; const e = H.G.stalk.ev; const hold = () => { if (H.G.stalk.ev === e) { e.t = 0.0; requestAnimationFrame(hold); } }; hold(); setTimeout(() => { H.G.stalk.ev = e; e.t = 1; }, 4000);`);
await sleep(1500); await shot('v21-lightning');
await done();
