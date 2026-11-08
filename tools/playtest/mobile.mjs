// Phone-sized touch play
import { open } from './harness.mjs';
const { ev, shot, sleep, send, errs, touch, tapAt, tapEl, check, done } = await open(import.meta.url, { mobile: true });
await sleep(8000);
const out = {};
out.coarse = await ev(`return matchMedia('(pointer: coarse)').matches + ' touchClass=' + document.body.classList.contains('touch') + ' quality=' + window.__hb.settings.quality;`);
await shot('m1-warning');
await tapEl('#warnOk'); await sleep(1500);
if (await ev(`return !document.getElementById('whatsnew').classList.contains('hidden')`)) { await shot('m2-whatsnew'); await tapEl('#newsClose'); await sleep(500); }
await shot('m2-menu');
await tapEl('.casecard'); await sleep(1500);
await ev(`document.querySelectorAll('#introLines p, #introLines button').forEach(e => { e.style.animationDelay = '0s'; });`); await sleep(1500);
await shot('m3-intro');
await tapEl('#introLines button'); await sleep(1500);
out.afterStart = await ev(`const H = window.__hb; return { state: H.state, pause: !document.getElementById('pause').classList.contains('hidden'), touchVisible: getComputedStyle(document.getElementById('touch')).display };`);
await shot('m4-hud');

// move: push the left stick up for ~1.5 s
const p0 = await ev(`const p = window.__hb.G.pos; return [p.x, p.z];`);
await touch('touchStart', [[150, 260]]);
for (let i = 1; i <= 10; i++) { await touch('touchMove', [[150, 260 - i * 6]]); await sleep(30); }
await sleep(1500); await shot('m5-stick');
await touch('touchEnd', []);
const p1 = await ev(`const p = window.__hb.G.pos; return [p.x, p.z];`);
out.moved = { from: p0, to: p1 };

// look: drag right side
const y0 = await ev(`return window.__hb.G.yaw;`);
await touch('touchStart', [[650, 200]]);
for (let i = 1; i <= 10; i++) { await touch('touchMove', [[650 - i * 8, 200]]); await sleep(20); }
await touch('touchEnd', []);
out.yaw = { from: y0, to: await ev(`return window.__hb.G.yaw;`) };

// both thumbs at once
await touch('touchStart', [[150, 260], [650, 200]]);
for (let i = 1; i <= 6; i++) { await touch('touchMove', [[150, 260 - i * 8], [650 + i * 8, 200]]); await sleep(30); }
await sleep(500); await touch('touchEnd', []);
out.twoThumbs = await ev(`const G = window.__hb.G; return { pos: [G.pos.x.toFixed(2), G.pos.z.toFixed(2)], yaw: G.yaw.toFixed(2) };`);

// walk up to Officer Reyes, tap the action button
await ev(`const H = window.__hb; H.G.pos.set(-2.6, 0, 22.8); H.G.yaw = Math.atan2(-(-3.6 + 2.6), -(21.6 - 22.8)); H.G.pitch = -0.2;`);
await sleep(600);
out.act = await ev(`const b = document.getElementById('tAct'); return b.classList.contains('hidden') ? 'hidden' : b.textContent;`);
await shot('m6-act');
if (out.act !== 'hidden') { await tapEl('#tAct'); await sleep(900); }
out.dialog = await ev(`return window.__hb.G.ui;`);
await shot('m7-dialog');
// advance dialog by tapping Continue, pick first topic
for (let i = 0; i < 4; i++) { const c = await ev(`return !!document.querySelector('#dOpts .opt.cont')`); if (c) { await tapEl('#dOpts .opt.cont'); await sleep(250); await tapEl('#dOpts .opt.cont').catch(() => {}); await sleep(250); } }
await shot('m8-topics');
await tapEl('#dOpts .opt.leave').catch(() => {}); await sleep(500);
out.afterLeave = await ev(`return { ui: window.__hb.G.ui, pause: !document.getElementById('pause').classList.contains('hidden') };`);
// notebook + pause buttons
await tapEl('#tNote'); await sleep(600); await shot('m9-notebook'); out.nb = await ev(`return window.__hb.G.ui;`);
await tapEl('#nbClose'); await sleep(400);
await tapEl('#tPause'); await sleep(500); await shot('m10-pause');
out.paused = await ev(`return !document.getElementById('pause').classList.contains('hidden');`);
await tapEl('#resume'); await sleep(400);
out.resumed = await ev(`return document.getElementById('pause').classList.contains('hidden');`);
// fingerprint minigame with touch
await ev(`const H = window.__hb; H.G.pos.set(-6, 0, -19.6); H.G.yaw = Math.PI / 2; H.G.pitch = -0.3;`); await sleep(600);
await tapEl('#tAct'); await sleep(600);
await tapEl('#iActs .btn'); await sleep(600);
const cv = await ev(`const b = document.querySelector('.fp-canvas').getBoundingClientRect(); return [b.x, b.y, b.width, b.height];`);
await touch('touchStart', [[cv[0] + 10, cv[1] + 10]]);
for (let pass = 0; pass < 3; pass++) for (let row = 0; row < 22; row++) for (let i = 0; i <= 24; i++) { const x = cv[0] + (row % 2 ? 24 - i : i) / 24 * cv[2], y = cv[1] + (row + pass * 0.33) / 22 * cv[3]; await touch('touchMove', [[x, y]]); }
await touch('touchEnd', []);
await sleep(300); await shot('m11-print');
out.print = await ev(`return !document.querySelector('.fp-done').disabled;`);
await ev(`const b = document.querySelector('.fp-done'); b.disabled = false;`); await tapEl('.fp-done'); await sleep(500);
for (let i = 0; i < 3; i++) { if (await ev(`return window.__hb.G.ui === 'inspect'`)) { await tapEl('#iActs .btn'); await sleep(300); } }

// how-to-play checklist: touch buttons tick it off
await tapEl('#tFlash'); await sleep(200); await tapEl('#tFlash'); await sleep(200);
out.tut = await ev(`const t = document.getElementById('tut'); return { text: t.textContent.slice(0, 60), done: t.querySelectorAll('.done').length, rows: t.querySelectorAll('div').length, hidden: t.classList.contains('hidden') };`);
await shot('m12-tut');

// the white lily behind the boarded-up house
await ev(`const H = window.__hb; H.G.pos.set(16.8, 0, -29.4); H.G.yaw = -Math.PI / 2; H.G.pitch = -0.5;`); await sleep(700);
out.lilyBtn = await ev(`const b = document.getElementById('tAct'); return b.classList.contains('hidden') ? 'hidden' : b.textContent;`);
await shot('m13-lily');
await tapEl('#tAct'); await sleep(600); await shot('m14-lily-card');
out.lily = await ev(`return document.getElementById('iTitle').textContent;`);
await tapEl('#iActs .btn'); await sleep(400);
out.lilyFound = await ev(`return window.__hb.api.hasSecret('cmary');`);

// interrogation UI at phone size: Gary Voss
await ev(`const H = window.__hb; H.api.give('gary'); H.api.give('van'); H.G.pos.set(1.4, 0, 25.6); H.G.yaw = Math.atan2(0.8, 0.4); H.G.pitch = 0;`); await sleep(800);
out.intBtn = await ev(`const b = document.getElementById('tAct'); return b.classList.contains('hidden') ? 'hidden' : b.textContent;`);
await tapEl('#tAct'); await sleep(1500);
for (let i = 0; i < 12; i++) { if (await ev(`return !document.getElementById('iCont').classList.contains('hidden')`)) { await tapEl('#iCont'); await sleep(250); } else break; }
await shot('m15-interro');
const fit = `const vis = (id) => { const e = document.getElementById(id); if (e.classList.contains('hidden')) return null; const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1; };`;
out.interro = await ev(`${fit} return { ui: window.__hb.G.ui, buttons: ['iPrev', 'iPress', 'iPresent', 'iNext', 'iLeave'].map(vis), line: document.getElementById('iLine').textContent.slice(0, 40) };`);
await tapEl('#iPresent'); await sleep(500); await shot('m16-present');
out.picker = await ev(`const p = document.getElementById('iPick'); const r = p.getBoundingClientRect(); return { shown: !p.classList.contains('hidden'), items: p.querySelectorAll('button, .opt, .suspect').length, fits: r.top >= 0 && r.top < innerHeight - 60, scrolls: p.parentElement.scrollHeight > p.parentElement.clientHeight };`);
await ev(`document.getElementById('iLeave').click();`); await sleep(600);
out.afterInt = await ev(`return window.__hb.G.ui;`);

// finale -> epilogue -> credits, on a phone
out.finale = await ev(`const H = window.__hb; const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  localStorage.setItem('hb_secrets', JSON.stringify({ cmary: true, wing: true, harrow: true }));
  H.startCase(H.CASES[3]); document.querySelector('#introLines button').click(); await sleep(600);
  for (const id of ['typewriter', 'files', 'gallery']) H.api.give(id);
  H.api.board(); await sleep(300); [...document.querySelectorAll('.suspect')].find(e => e.textContent.includes('Lund')).click(); document.getElementById('bAccuse').click(); await sleep(200);
  for (const id of ['typewriter', 'files', 'gallery']) document.querySelector('.suspect.proof[data-id="' + id + '"]').click();
  document.getElementById('bAccuse').click(); document.getElementById('confirmYes').click(); await sleep(400);
  return { ending: !document.getElementById('ending').classList.contains('hidden'), epi: !document.getElementById('eEpilogue').classList.contains('hidden') };`);
await shot('m17-ending');
await sleep(4000); out.endBtn = await ev(`const r = document.getElementById('eEpilogue').getBoundingClientRect(); document.getElementById('eEpilogue').scrollIntoView({ block: 'center' }); const r2 = document.getElementById('eEpilogue').getBoundingClientRect(); return { before: Math.round(r.bottom), after: Math.round(r2.bottom), h: innerHeight };`);
await tapEl('#eEpilogue'); await sleep(6000); await shot('m18-epilogue');
out.epilogue = await ev(`const c = window.__hb.G.cut; return { cut: !!c, cap: document.getElementById('caption').textContent.slice(0, 50), capFits: document.getElementById('caption').scrollWidth <= innerWidth + 1 };`);
const t0 = Date.now(); while (Date.now() - t0 < 240000) { if (await ev(`return !document.getElementById('credits').classList.contains('hidden')`)) break; await sleep(1000); }
await sleep(5000); await shot('m19-credits');
out.credits = await ev(`return !document.getElementById('credits').classList.contains('hidden');`);
await tapEl('#creditsSkip'); await sleep(1500);
out.backToTitle = await ev(`return { state: window.__hb.state, title: !!window.__hb.G.title };`);
await shot('m20-title');
console.log(JSON.stringify(out, null, 1));
check(out.afterStart.state === 'play' && !out.afterStart.pause, 'case starts on tap, no pause screen');
check(out.moved.from.join() !== out.moved.to.join(), 'left stick moves');
check(out.yaw.from !== out.yaw.to, 'right thumb looks');
check(out.act !== 'hidden' && out.dialog === 'dialog', 'action button talks to Reyes');
check(out.nb === 'notebook' && out.paused && out.resumed, 'notebook + pause buttons');
check(out.print === true, 'fingerprint brushes with touch');
check(/Left thumb/.test(out.tut.text) || out.tut.hidden, 'touch wording in the how-to-play list');
check(out.tut.done >= 3, 'touch buttons tick the how-to-play list');
check(out.lilyFound, 'lily found by tapping');
check(out.interro.ui === 'interro' && out.interro.buttons.every((b) => b !== false), 'interrogation buttons fit on a phone');
check(out.picker.shown && out.picker.items > 0 && out.picker.fits, 'evidence picker opens and fits');
check(out.endBtn.after <= out.endBtn.h, 'ending buttons reachable on a phone');
check(out.finale.ending && out.finale.epi, 'finale ending offers the epilogue');
check(out.epilogue.cut && out.epilogue.cap && out.epilogue.capFits, 'epilogue plays with captions that fit');
check(out.credits, 'credits roll');
check(out.backToTitle.state === 'menu' && out.backToTitle.title, 'back to the living title');
await done();
