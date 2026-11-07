// Voice studio: actors record their lines here; takes are kept in IndexedDB and exported as a zip
// of correctly named files (voices/<line id>.<ext>) ready to drop into the game.
import { CASES } from './cases.js';
import { ROLES, buildScript } from './script.js';

const $ = (id) => document.getElementById(id);
const SCRIPT = buildScript(CASES);
const byRole = {};
for (const l of SCRIPT) (byRole[l.role] = byRole[l.role] || []).push(l);

// ---------- storage ----------
let db = null;
const takes = new Map(); // id -> { blob, type }
function openDb() {
  return new Promise((res) => {
    try {
      const r = indexedDB.open('hollow-badge-voices', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('takes');
      r.onsuccess = () => { db = r.result; res(); };
      r.onerror = () => res();
    } catch { res(); }
  });
}
function dbAll() {
  return new Promise((res) => {
    if (!db) return res();
    try {
      const tx = db.transaction('takes', 'readonly'), st = tx.objectStore('takes'), req = st.openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { takes.set(c.key, c.value); c.continue(); } else res(); };
      req.onerror = () => res();
    } catch { res(); }
  });
}
function dbPut(id, v) { try { if (db) db.transaction('takes', 'readwrite').objectStore('takes').put(v, id); } catch {} }
function dbDel(id) { try { if (db) db.transaction('takes', 'readwrite').objectStore('takes').delete(id); } catch {} }

// ---------- ui ----------
let role = null, idx = 0;
function lines() { return byRole[role] || []; }
function fillRoles() {
  const sel = $('role');
  sel.innerHTML = Object.entries(ROLES).filter(([k]) => byRole[k]).map(([k, r]) => `<option value="${k}">${r.name} (${byRole[k].length} lines)</option>`).join('');
  let saved = null; try { saved = localStorage.getItem('hb_role'); } catch {}
  role = saved && byRole[saved] ? saved : sel.value;
  sel.value = role;
  sel.onchange = () => { role = sel.value; idx = 0; try { localStorage.setItem('hb_role', role); } catch {} render(); };
}
function render() {
  const L = lines();
  $('note').textContent = ROLES[role].note;
  const list = $('list'); list.innerHTML = '';
  L.forEach((l, i) => {
    const d = document.createElement('div');
    d.className = 'li' + (i === idx ? ' cur' : '') + (takes.has(l.id) ? ' done' : '');
    d.innerHTML = `<span class="dot"></span><span>${l.text.length > 70 ? l.text.slice(0, 70) + '…' : l.text}</span>`;
    d.onclick = () => { idx = i; render(); };
    list.appendChild(d);
  });
  const cur = L[idx];
  $('where').textContent = cur ? `${cur.where} · line ${idx + 1} of ${L.length}` : '';
  $('line').textContent = cur ? cur.text : '';
  $('play').disabled = $('del').disabled = !(cur && takes.has(cur.id));
  const done = L.filter((l) => takes.has(l.id)).length;
  $('count').textContent = `${done} / ${L.length} recorded`;
  const el = list.children[idx]; if (el) el.scrollIntoView({ block: 'nearest' });
}

// ---------- recording ----------
let stream = null, rec = null, chunks = [], analyser = null, recording = false;
async function ensureMic() {
  if (stream) return true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const ac = new AudioContext(); const src = ac.createMediaStreamSource(stream);
    analyser = ac.createAnalyser(); analyser.fftSize = 512; src.connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const tick = () => { analyser.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); $('lvl').style.width = Math.min(100, m / 1.28) + '%'; requestAnimationFrame(tick); };
    tick();
    return true;
  } catch (e) {
    $('status').textContent = 'Microphone blocked. Allow the mic in the address bar and try again.';
    return false;
  }
}
function pickType() {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) return t;
  return '';
}
async function startRec() {
  if (recording) return;
  const cur = lines()[idx]; if (!cur) return;
  if (!(await ensureMic())) return;
  const type = pickType();
  rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' });
    if (blob.size < 2000) { $('status').textContent = 'That take was too short. Hold the button while you speak.'; return; }
    const v = { blob, type: blob.type, role, ts: Date.now() };
    takes.set(cur.id, v); dbPut(cur.id, v);
    $('status').textContent = `Saved "${cur.id}". Press P to hear it.`;
    if (idx < lines().length - 1) idx++;
    render();
  };
  rec.start(); recording = true;
  $('rec').classList.add('on'); $('rec').textContent = '● Recording… let go to stop';
  $('status').textContent = 'Recording…';
}
function stopRec() {
  if (!recording) return;
  recording = false; $('rec').classList.remove('on'); $('rec').textContent = '● Hold to record';
  setTimeout(() => rec && rec.state !== 'inactive' && rec.stop(), 180); // keep the tail of the last word
}
let player = null;
function playTake() {
  const cur = lines()[idx]; const t = cur && takes.get(cur.id); if (!t) return;
  if (player) player.pause();
  player = new Audio(URL.createObjectURL(t.blob)); player.play();
}

// ---------- export ----------
const extOf = (type) => (/mp4|aac|m4a/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : 'webm');
async function exportZip(onlyRole) {
  const zip = new JSZip(); let n = 0;
  const manifest = {};
  for (const l of SCRIPT) {
    if (onlyRole && l.role !== onlyRole) continue;
    const t = takes.get(l.id); if (!t) continue;
    const name = `${l.id}.${extOf(t.type)}`;
    zip.file(`voices/${name}`, t.blob); manifest[l.id] = name; n++;
  }
  if (!n) { $('status').textContent = 'Nothing recorded yet.'; return; }
  zip.file(`voices/takes-${onlyRole || 'all'}.json`, JSON.stringify({ role: onlyRole || 'all', files: manifest }, null, 1));
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `hollow-badge-voices-${onlyRole || 'all'}.zip`; a.click();
  $('status').textContent = `Downloaded ${n} recordings. Send the .zip to the game's maker.`;
}

// ---------- input ----------
const recBtn = $('rec');
recBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); startRec(); });
recBtn.addEventListener('pointerup', stopRec); recBtn.addEventListener('pointerleave', stopRec);
$('play').onclick = playTake;
$('del').onclick = () => { const cur = lines()[idx]; if (cur) { takes.delete(cur.id); dbDel(cur.id); render(); } };
$('prev').onclick = () => { idx = Math.max(0, idx - 1); render(); };
$('next').onclick = () => { idx = Math.min(lines().length - 1, idx + 1); render(); };
$('exportRole').onclick = () => exportZip(role);
$('exportAll').onclick = () => exportZip(null);
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) startRec(); }
  else if (e.code === 'KeyP') playTake();
  else if (e.code === 'ArrowRight') $('next').click();
  else if (e.code === 'ArrowLeft') $('prev').click();
});
addEventListener('keyup', (e) => { if (e.code === 'Space') { e.preventDefault(); stopRec(); } });

await openDb(); await dbAll();
fillRoles(); render();
