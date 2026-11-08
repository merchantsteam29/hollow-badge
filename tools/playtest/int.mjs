// Interrogations: catching the lie, strikes, lockout
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
const plan = [
  [0, ['gary', 'van', 'print', 'knife', 'backpack'], 'backpack', null],
  [1, ['print2', 'scar', 'log', 'limp', 'watch_buyer', 'tally1'], 'tally1', 'arrested'],
  [2, ['ledger', 'nogame', 'liftpass', 'posters'], 'posters', null],
];
for (const [ci, clues, wrongClue, flag] of plan) {
  await ev(`window.__hb.settings.qualityManual = true; window.__hb.settings.quality = 'medium'; window.__hb.applyQuality();`);
  const r = await ev(`${helpers}
    H.startCase(H.CASES[${ci}]); document.querySelector('#introLines button').click(); await sleep(400);
    ${flag ? `H.G.flags.${flag} = true;` : ''}
    for (const id of ${JSON.stringify(clues)}) H.api.give(id);
    const I = H.CASES[${ci}].interrogation;
    const it = H.G.interacts.find(i => i.cond && i.cond() && /question|press him/i.test(typeof i.label === 'function' ? i.label() : i.label));
    if (!it) return 'no interrogation interact';
    it.use(); await sleep(300);
    const $$ = (id) => document.getElementById(id);
    const cont = async () => { for (let k = 0; k < 20 && !$$('iCont').classList.contains('hidden'); k++) { $$('iCont').click(); await sleep(40); } };
    await cont();
    const first = $$('iLine').textContent;
    // one wrong answer
    $$('iPresent').click(); await sleep(50);
    [...document.querySelectorAll('#iPick .opt')].find(b => b.textContent.includes(H.CASES[${ci}].clues['${wrongClue}'].title)).click(); await sleep(50);
    const strikes = $$('iStrikes').textContent; await cont();
    // catch every lie
    for (let si = 0; si < I.statements.length; si++) {
      const s = I.statements[si]; if (!s.lie) continue;
      const want = [].concat(s.lie).find(id => H.G.clues.has(id));
      for (let n = 0; n < 6 && !$$('iCount').textContent.startsWith('Statement ' + (si + 1) + ' '); n++) { $$('iNext').click(); await sleep(30); }
      $$('iPresent').click(); await sleep(50);
      [...document.querySelectorAll('#iPick .opt')].find(b => b.textContent.includes(H.CASES[${ci}].clues[want].title)).click(); await sleep(60);
      if (si === 1) window.__stampShot = true;
      await sleep(500); await cont();
    }
    await cont();
    return { first: first.slice(0, 50), strikes, gave: H.G.clues.has(I.gives), ui: H.G.ui, state: H.G.flags['int_' + I.id].state };`);
  res.push(ci + ': ' + JSON.stringify(r));
}
// screenshots: the room + a LIE stamp (case 2), then the lockout path (case 1)
await ev(`${helpers} H.startCase(H.CASES[1]); document.querySelector('#introLines button').click(); await sleep(400); H.G.flags.arrested = true; for (const id of ['limp', 'tally1', 'victims']) H.api.give(id);
  H.G.interacts.find(i => i.cond && i.cond() && /question/i.test(i.label)).use(); await sleep(300);
  for (let k = 0; k < 5; k++) { document.getElementById('iCont').click(); await sleep(40); }`);
await sleep(2500); await shot('int-room');
await ev(`const $$ = (id) => document.getElementById(id); $$('iNext').click(); await new Promise(r => setTimeout(r, 50)); $$('iPresent').click(); await new Promise(r => setTimeout(r, 50)); [...document.querySelectorAll('#iPick .opt')].find(b => b.textContent.includes('Jory')).click();`);
await sleep(250); await shot('int-lie');
res.push('lockout: ' + JSON.stringify(await ev(`${helpers} H.startCase(H.CASES[0]); document.querySelector('#introLines button').click(); await sleep(300);
  for (const id of ['gary', 'van', 'backpack']) H.api.give(id);
  H.G.interacts.find(i => i.cond && i.cond() && /question/i.test(i.label)).use(); await sleep(200);
  const $$ = (id) => document.getElementById(id); const cont = async () => { for (let k = 0; k < 20 && !$$('iCont').classList.contains('hidden'); k++) { $$('iCont').click(); await sleep(30); } };
  await cont();
  for (let k = 0; k < 3; k++) { $$('iPresent').click(); await sleep(30); [...document.querySelectorAll('#iPick .opt')].find(b => b.textContent.includes('backpack')).click(); await sleep(40); await cont(); }
  return { state: H.G.flags.int_voss.state, ui: H.G.ui, stillOffered: H.G.interacts.some(i => i.cond && i.cond() && /question/i.test(i.label)) };`)));
console.log(res.join('\n'));
await done();
