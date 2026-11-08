// Case 03: the snowed-in town and the hide-and-hold-breath scene
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
await ev(`${helpers} H.settings.qualityManual = true; H.settings.quality = 'low'; H.applyQuality(); H.startCase(H.CASES[2]); document.querySelector('#introLines button').click();`);
await sleep(2500); await shot('c3-0-start');
for (const [x, z, yaw, pitch, n] of [[3, 16, -1.6, -0.05, 'diner'], [0, 6, 1.2, -0.02, 'street'], [2, -36, 0.2, -0.1, 'plow'], [-3, -50, 1.2, -0.1, 'lake'], [-3, -28, 1.6, -0.05, 'lodge']]) {
  await ev(`const H = window.__hb; H.G.pos.set(${x}, 0, ${z}); H.G.yaw = ${yaw}; H.G.pitch = ${pitch};`); await sleep(1800); await shot('c3-v-' + n);
}
// interviews + evidence (not the house)
out.sweep = await ev(`${helpers}
  const skip = /Case board|Walt's house|freezer|table|Hide|Crawl/;
  const res = [];
  for (let pass = 0; pass < 3; pass++) for (const it of H.G.interacts) {
    if (!it.alive || (it.cond && !it.cond())) continue;
    const label = typeof it.label === 'function' ? it.label() : it.label;
    if (skip.test(label)) continue;
    H.G.pos.set(it.pos.x + 1.0, 0, it.pos.z + 1.0);
    it.use(); res.push(label + ':' + await drain());
    await sleep(60);
  }
  await sleep(500);
  return { res: res.length, clues: [...H.G.clues], meeting: H.G.flags.meeting, obj: document.getElementById('objective').textContent };`);
// the house
out.house = await ev(`${helpers}
  const find = (re) => H.G.interacts.find(i => re.test(typeof i.label === 'function' ? i.label() : i.label) && (!i.cond || i.cond()));
  H.G.pos.set(9.4, 0, -14); find(/Walt's house/).use(); await sleep(2000);
  H.G.pos.set(13.0, 0, -13.2); H.G.yaw = Math.atan2(-(16.9 - 13), -(-16.9 + 13.2)); await sleep(1200);
  return { colliderGone: !H.api.colliders.some(c => c.x0 === 10.35), obj: document.getElementById('objective').textContent };`);
await shot('c3-1-inside');
await ev(`${helpers} const find = (re) => H.G.interacts.find(i => re.test(typeof i.label === 'function' ? i.label() : i.label) && (!i.cond || i.cond()));
  H.G.pos.set(15.6, 0, -15.6); find(/freezer/).use(); await drain(); H.G.pos.set(14.4, 0, -12.9); H.G.yaw = Math.PI; H.G.pitch = -0.4; await sleep(800);`);
await shot('c3-2-table');
await ev(`${helpers} const find = (re) => H.G.interacts.find(i => re.test(typeof i.label === 'function' ? i.label() : i.label) && (!i.cond || i.cond())); find(/table/).use(); await drain();`);
out.hideStart = await ev(`const H = window.__hb; return { phase: H.G.flags.hidePhase, hud: document.getElementById('hideText').textContent };`);
await sleep(2500); await shot('c3-3-countdown');
// let him catch us once
out.caught = await waitFor(`return document.getElementById('blackout').classList.contains('on');`, 120000);
await shot('c3-4-caught');
await waitFor(`return !document.getElementById('blackout').classList.contains('on') && window.__hb.G.flags.hidePhase === 'countdown';`, 30000);
// hide in the wardrobe, holding breath only when he is close
out.hidden = await ev(`const H = window.__hb; const it = H.G.interacts.find(i => /wardrobe/.test(i.label) && i.cond()); H.G.pos.set(12.0, 0, -16.2); it.use(); return H.G.frozen;`);
const loopJs = `(async () => { const H = window.__hb; const G = H.G;
  return await new Promise((res) => { const t0 = performance.now(); let maxClose = 99;
    const f = () => {
      const w = H.camera.parent.children.find(o => o.userData && o.userData.legs && o.userData.noLook);
      if (w && w.visible) { const d = Math.hypot(w.position.x - 11.3, w.position.z - (-17.05)); maxClose = Math.min(maxClose, d); H.breath(d < 2.9); G.yaw = Math.atan2(-(w.position.x - 11.3), -(w.position.z + 17.05)); G.pitch = -0.05; } else H.breath(false);
      if (G.flags.escaped) { H.breath(false); return res({ escaped: true, closest: maxClose.toFixed(2) }); }
      if (G.flags.hidePhase === 'caught') { H.breath(false); return res({ escaped: false, caught: true, closest: maxClose.toFixed(2) }); }
      if (performance.now() - t0 > 300000) return res({ timeout: true, phase: G.flags.hidePhase });
      requestAnimationFrame(f);
    }; requestAnimationFrame(f); }); })()`;
const loopP = send('Runtime.evaluate', { expression: loopJs, awaitPromise: true, returnByValue: true, timeout: 320000 });
for (const k of [1, 2, 3, 4, 5, 6, 7, 8]) { await sleep(4000); await shot('c3-5-search-' + k); }
out.search = (await loopP).result?.result?.value;
await sleep(1500); await shot('c3-6-escaped');
out.after = await ev(`const H = window.__hb; return { frozen: !!H.G.frozen, obj: document.getElementById('objective').textContent, clues: H.G.clues.size };`);
out.ending = await ev(`window.__hb.api.board(); await new Promise(r => setTimeout(r, 300)); const c = [...document.querySelectorAll('.suspect')].find(e => e.textContent.includes('Walter')); c.click(); document.getElementById('bAccuse').click(); document.getElementById('confirmYes').click(); return document.getElementById('eTitle').textContent;`);
await sleep(13000); await shot('c3-7-ending');
console.log(JSON.stringify(out, null, 1));
await done();
