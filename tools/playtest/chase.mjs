// Case 01 shed scene: the IV, the jumpscare, the chase and the arrest
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

const out = {};
await ev(`window.__hb.settings.qualityManual = true; window.__hb.settings.quality = 'medium'; window.__hb.applyQuality();
  const H = window.__hb; H.startCase(H.CASES[1]); document.querySelector('#introLines button').click();`);
await sleep(2500);
// the door before opening, from the street
await ev(`const H = window.__hb; H.G.pos.set(3.0, 0, -53.5); H.G.yaw = -Math.PI / 2; H.G.pitch = -0.05;`);
await sleep(1500); await shot('ch-0-door');
out.locked = await ev(`const H = window.__hb; const it = H.G.interacts.find(i => /morgue/i.test(typeof i.label === 'function' ? i.label() : i.label)); it.use(); const t = document.getElementById('iBody').textContent; document.querySelector('#iActs .btn').click(); return t.slice(0, 90);`);
// meet the requirements and open it
await ev(`const H = window.__hb; for (const id of ['vial', 'limp', 'print2', 'scar']) H.api.give(id); H.G.pos.set(4.6, 0, -53.5);
  const it = H.G.interacts.find(i => /morgue/i.test(typeof i.label === 'function' ? i.label() : i.label)); it.use();`);
const waitFor = async (js, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(js)) return true; await sleep(250); } return false; };
const names = ['ch-1-iv', 'ch-2-open', 'ch-3-inside', 'ch-4-someone', 'ch-5-eating', 'ch-6-stops', 'ch-7-turn', 'ch-8-smile', 'ch-9-jump', 'ch-9b-jump-hold', 'ch-9c-black', 'ch-9d-run'];
for (let i = 0; i < names.length; i++) {
  await waitFor('const c = window.__hb.G.cut; return !c || c.i > ' + i + ' || (c.i === ' + i + ' && c.t > c.dur * (' + i + ' === 9 ? 0.1 : 0.85));', 60000);
  await shot(names[i]);
}
await waitFor('return !window.__hb.G.cut;', 60000);
out.afterScene = await ev();
out.caught = await waitFor("return document.getElementById('blackout').classList.contains('on');", 60000);
await shot('ch-10-caught');
await waitFor("return !document.getElementById('blackout').classList.contains('on');", 20000);
out.afterCatch = await ev();
// now run to Holt at running speed while looking BACK at him
const runJs = `(async () => { const H = window.__hb; const G = H.G;
  return await new Promise((res) => {
    let last = performance.now(); const t0 = performance.now();
    const f = () => {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!G.cut && !G.frozen) { const dx = 4.6 - G.pos.x, dz = 21.5 - G.pos.z, d = Math.hypot(dx, dz); if (d > 0.5) { G.pos.x += dx / d * 5.0 * dt; G.pos.z += dz / d * 5.0 * dt; } G.yaw = 0; G.pitch = -0.08; }
      if (G.cut && G.cut.i === 2 && G.cut.t > G.cut.dur * 0.8) return res('arrest');
      if (performance.now() - t0 > 240000) return res('timeout');
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }); })()`;
const runP = send('Runtime.evaluate', { expression: runJs, awaitPromise: true, returnByValue: true, timeout: 300000 });
for (const k of [1, 2, 3, 4, 5, 6]) { await sleep(1500); await shot('run-' + k); }
out.run = (await runP).result?.result?.value;
await shot('ch-11-kneel'); await waitFor('const c = window.__hb.G.cut; return !c || c.i >= 4;', 60000); await shot('ch-12-wide'); await waitFor('return window.__hb.G.flags.arrested;', 60000);
out.obj = await ev(`return document.getElementById('objective').textContent;`);
out.ending = await ev(`window.__hb.api.board(); await new Promise(r => setTimeout(r, 300)); const c = [...document.querySelectorAll('.suspect')].find(e => e.textContent.includes('Crane')); c.click(); document.getElementById('bAccuse').click(); document.getElementById('confirmYes').click(); return document.getElementById('eTitle').textContent;`);
await sleep(14000); await shot('ch-13-ending');
console.log(JSON.stringify(out, null, 1));
await done();
