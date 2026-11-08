// Case 04 finale: payphone, exhibits, the gallery
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
const waitFor = async (js, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(js)) return true; await sleep(300); } return false; };
out.lockedCard = await ev(`window.__hb.toMenu(); await new Promise(r => setTimeout(r, 300)); const c = [...document.querySelectorAll('.casecard')][3]; return c.className + ' | ' + (c.querySelector('.lockmsg') || {}).textContent;`);
await shot('c4-menu');
await ev(`window.__hb.settings.qualityManual = true; window.__hb.settings.quality = 'low'; window.__hb.applyQuality();`);
await ev(`const H = window.__hb; H.startCase(H.CASES[3]); document.querySelector('#introLines button').click();`);
await sleep(2000);
await ev(`const H = window.__hb; H.settings.quality = 'medium'; H.G.pos.set(-1, 0, 12); H.G.yaw = -Math.PI / 2 - 0.1; H.G.pitch = 0.02;`);
await sleep(1500); await shot('c4-street');
out.sweep = await ev(`${helpers}
  const find = (re) => H.G.interacts.find(i => re.test(typeof i.label === 'function' ? i.label() : i.label) && (!i.cond || i.cond()));
  const go = async (re) => { const it = find(re); if (!it) return re + ':missing'; H.G.pos.set(it.pos.x - 1, 0, it.pos.z + 1); it.use(); const r = await drain(); return re + ':' + r; };
  const log = [];
  log.push(await go(/payphone/)); await sleep(14000);
  for (const re of [/swing/, /steps/, /diner window/, /laundromat window/, /Vance's tab/]) log.push(await go(re));
  for (const re of [/Dr. Lund/, /Mr. Pell/, /Ray Vance/]) { log.push(await go(re)); log.push(await go(re)); }
  for (const re of [/typewriter/, /file cabinet/]) log.push(await go(re));
  return { log, clues: [...H.G.clues], obj: document.getElementById('objective').textContent };`);
// interrogate Lund
out.interro = await ev(`${helpers}
  const it = H.G.interacts.find(i => i.cond && i.cond() && /questions/.test(i.label)); if (!it) return 'no interrogation';
  it.use(); await sleep(300);
  const q = (id) => document.getElementById(id);
  const cont = async () => { for (let k = 0; k < 20 && !q('iCont').classList.contains('hidden'); k++) { q('iCont').click(); await sleep(40); } };
  await cont();
  const I = H.CASES[3].interrogation;
  for (let si = 0; si < I.statements.length; si++) { const s = I.statements[si]; if (!s.lie) continue;
    for (let n = 0; n < 6 && !q('iCount').textContent.startsWith('Statement ' + (si + 1) + ' '); n++) { q('iNext').click(); await sleep(30); }
    q('iPresent').click(); await sleep(40); [...document.querySelectorAll('#iPick .opt')].find(b => b.textContent.includes(H.CASES[3].clues[[].concat(s.lie)[0]].title)).click(); await sleep(600); await cont(); }
  await cont(); await sleep(500);
  return { lied: H.api.has('lund_lied'), basement: H.G.flags.basementOpen, obj: document.getElementById('objective').textContent };`);
// the gallery
out.gallery = await ev(`${helpers}
  const find = (re) => H.G.interacts.find(i => re.test(typeof i.label === 'function' ? i.label() : i.label) && (!i.cond || i.cond()));
  H.G.pos.set(-3.6, 0, 10.6); find(/basement/).use(); await drain(); await sleep(600);
  H.G.yaw = Math.atan2(-(400 - H.G.pos.x), -(396 - H.G.pos.z)); H.G.pitch = 0.0;
  return { inGallery: H.G.flags.inGallery, pos: [H.G.pos.x.toFixed(1), H.G.pos.z.toFixed(1)], obj: document.getElementById('objective').textContent };`);
await sleep(1500); await shot('c4-gallery');
await ev(`${helpers} const find = (re) => H.G.interacts.find(i => re.test(typeof i.label === 'function' ? i.label() : i.label) && (!i.cond || i.cond()));
  H.G.pos.set(400, 0, 397.4); find(/photographs/).use(); await drain(); H.G.pos.set(400.8, 0, 401.4); find(/notebook/).use(); await drain(); H.G.pos.set(399.2, 0, 402.6); H.G.yaw = Math.atan2(-(401.5 - 399.2), -(399 - 402.6));`);
await waitFor(`const c = window.__hb.camera.parent.children.find(o => o.userData && o.userData.legs && o.visible && o.position.x > 390 && o.userData.noCull && !o.userData.noLook); return !!c;`, 30000);
await shot('c4-scare');
await waitFor(`return window.__hb.G.flags.scared && document.getElementById('caption').textContent.includes('fifth');`, 40000);
await sleep(800); await shot('c4-exhibit5');
out.after = await ev(`${helpers} const it = H.G.interacts.find(i => /back up/.test(typeof i.label === 'function' ? i.label() : i.label) && i.cond()); if (!it) return 'no exit'; it.use(); await sleep(300);
  return { inGallery: H.G.flags.inGallery, pos: [H.G.pos.x.toFixed(1), H.G.pos.z.toFixed(1)], lundGone: H.G.flags.lundGone, obj: document.getElementById('objective').textContent };`);
out.ending = await ev(`window.__hb.api.board(); await new Promise(r => setTimeout(r, 300)); [...document.querySelectorAll('.suspect')].find(e => e.textContent.includes('Lund')).click(); document.getElementById('bAccuse').click(); await new Promise(r => setTimeout(r, 200));
  for (const id of ['typewriter', 'files', 'gallery']) document.querySelector('.suspect.proof[data-id="' + id + '"]').click();
  document.getElementById('bAccuse').click(); document.getElementById('confirmYes').click(); return document.getElementById('eTitle').textContent;`);
await sleep(15000); await shot('c4-ending');
console.log(JSON.stringify(out, null, 1));
await done();
