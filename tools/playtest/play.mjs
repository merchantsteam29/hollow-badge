// Cases 01 and 02 end to end: witnesses, clues, prints, board
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

for (const [ci, culprit] of [[0, 'Gary Voss'], [1, 'Dr. Elias Crane']]) {
  const tag = ci ? 'wing' : 'cmary';
  await ev(`${helpers} H.startCase(H.CASES[${ci}]);`);
  await sleep(1500); await shot(`${tag}-0-intro`);
  await ev(`document.querySelector('#introLines button').click();`);
  await sleep(2500); await shot(`${tag}-1-start`);
  // look-around screenshots
  const views = ci === 0
    ? [[-4, 7, 1.9, 'rowe-porch'], [-12, -18, -2.2, 'playground'], [2, -40, 0.4, 'woods'], [-5.5, -61, 1.45, 'shed']]
    : [[-4, -4, 1.5, 'lane'], [33, -21, -2.4, 'river'], [0, -55, 0, 'church'], [2, 12, -1.5, 'bar']];
  for (const [x, z, yaw, n] of views) {
    await ev(`const H = window.__hb; H.G.pos.set(${x}, 0, ${z}); H.G.yaw = ${yaw}; H.G.pitch = -0.1;`);
    await sleep(1800); await shot(`${tag}-v-${n}`);
  }
  const res = await ev(`${helpers} const s = await sweep(); return { s, clues: [...H.G.clues], obj: document.getElementById('objective').textContent, flags: H.G.flags };`);
  console.log(tag, JSON.stringify(res, null, 1));
  await ev(`window.__hb.api.board();`); await sleep(600); await shot(`${tag}-2-board`);
  const acc = await ev(`const cards = [...document.querySelectorAll('.suspect')]; const c = cards.find(e => e.textContent.includes(${JSON.stringify(culprit)})); c.click(); document.getElementById('bAccuse').click(); document.getElementById('confirmYes').click(); return document.getElementById('eTitle').textContent;`);
  console.log(tag, 'ending:', acc);
  await sleep(12000); await shot(`${tag}-3-ending`);
  await ev(`document.getElementById('eMenu').click();`);
}
await sleep(500); await shot('09-menu-after');
await done();
