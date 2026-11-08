// Every board outcome (good / weak / wrong) for Cases 01-03
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

const res = [];
const CASES3 = [['Gary Voss', ['print', 'van', 'jacket'], ['backpack', 'body', 'mom_time'], 'Rick Hollins'],
  ['Dr. Elias Crane', ['print2', 'scar', 'log'], ['tally1', 'tally3', 'victims'], 'Tom Beckett'],
  ['Walter Ebner', ['ledger', 'liftpass', 'freezer'], ['posters', 'stew', 'tags'], 'Silas Crowe']];
for (let ci = 0; ci < 3; ci++) {
  const [culprit, good, weak, wrong] = CASES3[ci];
  for (const [mode, who, picks] of [['good', culprit, good], ['weak', culprit, weak], ['wrong', wrong, good]]) {
    const r = await ev(`const H = window.__hb; H.startCase(H.CASES[${ci}]); document.querySelector('#introLines button').click();
      await new Promise(r => setTimeout(r, 300));
      for (const id of Object.keys(H.CASES[${ci}].clues)) H.api.give(id);
      H.api.board(); await new Promise(r => setTimeout(r, 200));
      [...document.querySelectorAll('.suspect')].find(e => e.textContent.includes(${JSON.stringify(who)})).click();
      document.getElementById('bAccuse').click(); await new Promise(r => setTimeout(r, 200));
      const before = document.getElementById('bAccuse').textContent;
      for (const id of ${JSON.stringify(picks)}) document.querySelector('.suspect.proof[data-id="' + id + '"]').click();
      const after = document.getElementById('bAccuse').textContent;
      return { before, after, cards: document.querySelectorAll('.suspect.proof').length };`);
    if (ci === 0 && mode === 'good') await shot('board-evidence');
    if (ci === 2 && mode === 'good') await shot('board-evidence-3');
    const end = await ev(`document.getElementById('bAccuse').click(); document.getElementById('confirmYes').click(); return document.getElementById('eTitle').textContent;`);
    res.push(`${ci} ${mode}: ${end}  (${r.before} -> ${r.after}, ${r.cards} cards)`);
    await ev(`document.getElementById('eMenu').click();`);
  }
}
console.log(res.join('\n'));
await sleep(500); await shot('09-menu-after');
await done();
