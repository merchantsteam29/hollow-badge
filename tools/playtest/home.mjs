// The apartment between cases: objectives progress
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

await ev(`localStorage.setItem('hb_results', JSON.stringify({ cmary: 'solved' })); location.reload();`);
await sleep(8000);
await ev(`HTMLElement.prototype.requestPointerLock = () => {}; Object.defineProperty(Document.prototype, 'pointerLockElement', { configurable: true, get() { return document.querySelector('#game canvas'); } }); document.getElementById('warnOk').click();`);
await sleep(500);
console.log(await ev(`${helpers} document.getElementById('homeBtn').click(); await sleep(1200); const a = document.getElementById('objective').textContent;
  H.G.interacts.find(i => /messages/.test(i.label())).use(); await sleep(400); H.G.interacts.find(i => /mail/.test(typeof i.label === 'function' ? i.label() : i.label)).use(); await sleep(200); document.querySelector('#iActs .btn').click(); await sleep(200);
  H.G.interacts.find(i => /case wall/.test(i.label)).use(); await sleep(200); document.querySelector('#iActs .btn').click(); await sleep(1800);
  const door = H.G.interacts.find(i => /downstairs|Leave/.test(typeof i.label === 'function' ? i.label() : i.label));
  return 'partial: ' + a + ' -> ' + document.getElementById('objective').textContent + ' | door: ' + door.label();`));
await done();
