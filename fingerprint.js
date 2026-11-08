// Fingerprint dusting minigame: brush powder over a surface to reveal a latent print.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function drawPrint(size, seed, scar) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const r = rng(seed);
  const cx = size * 0.5, cy = size * 0.56;
  g.save();
  g.beginPath(); g.ellipse(cx, cy - size * 0.04, size * 0.33, size * 0.43, 0, 0, Math.PI * 2); g.clip();
  g.strokeStyle = 'rgba(236,230,214,0.95)'; g.lineWidth = size / 120; g.lineCap = 'round';
  const wob = [r() * 6, r() * 6, r() * 6];
  // loop core + outer ridges
  for (let i = 0; i < 34; i++) {
    const rad = 5 + i * size * 0.0145;
    g.setLineDash([8 + r() * 40, 2 + r() * 5]);
    g.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.04) {
      const wobble = Math.sin(a * 3 + wob[0]) * 2.2 + Math.sin(a * 7 + wob[1] + i * 0.3) * 1.2;
      const loopPull = i < 14 ? Math.max(0, Math.sin(a)) * (14 - i) * 1.6 : 0;
      const x = cx + Math.cos(a) * (rad * 0.82 + wobble);
      const y = cy - loopPull + Math.sin(a) * (rad + wobble) - (a > Math.PI ? 0 : i * 0.6);
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }
  // a few bifurcation dots
  g.setLineDash([]); g.fillStyle = 'rgba(236,230,214,0.9)';
  for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(cx + (r() - 0.5) * size * 0.5, cy + (r() - 0.5) * size * 0.7, 1 + r() * 1.5, 0, 7); g.fill(); }
  g.restore();
  if (scar) {
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.lineWidth = size / 34; g.beginPath();
    g.moveTo(cx - size * 0.36, cy - size * 0.02); g.lineTo(cx + size * 0.34, cy - size * 0.14); g.stroke();
    g.restore();
    g.strokeStyle = 'rgba(236,230,214,0.55)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(cx - size * 0.33, cy - size * 0.045); g.lineTo(cx + size * 0.31, cy - size * 0.16); g.stroke();
  }
  return cv;
}

export function openPrint(host, { seed = 7, scar = false, surface = 'metal' }, onDone) {
  const S = 320;
  host.innerHTML = `
    <div class="fp-wrap">
      <div class="fp-title">DUST FOR PRINTS</div>
      <div class="fp-sub">${document.body.classList.contains('touch') ? 'Drag your finger' : 'Hold the mouse and drag'} to brush the powder across the surface.</div>
      <canvas class="fp-canvas" width="${S}" height="${S}"></canvas>
      <div class="fp-bar"><div class="fp-fill"></div></div>
      <div class="fp-status">Surface: ${surface}</div>
      <button class="btn fp-done" disabled>Lift print</button>
    </div>`;
  const cv = host.querySelector('canvas'), g = cv.getContext('2d');
  const fill = host.querySelector('.fp-fill'), status = host.querySelector('.fp-status'), btn = host.querySelector('.fp-done');
  const print = drawPrint(S, seed, scar);
  const mask = document.createElement('canvas'); mask.width = mask.height = S; const mg = mask.getContext('2d');
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = S; const tg = tmp.getContext('2d');

  // surface texture
  const surf = document.createElement('canvas'); surf.width = surf.height = S; const sg = surf.getContext('2d');
  const grad = sg.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, surface === 'metal' ? '#20242a' : '#1d2a22'); grad.addColorStop(1, '#0b0d10');
  sg.fillStyle = grad; sg.fillRect(0, 0, S, S);
  const r = rng(seed + 3);
  for (let i = 0; i < 2500; i++) { sg.fillStyle = `rgba(255,255,255,${r() * 0.04})`; sg.fillRect(r() * S, r() * S, 1 + r() * 2, 1); }
  for (let i = 0; i < 14; i++) { sg.strokeStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`; sg.beginPath(); const y = r() * S; sg.moveTo(0, y); sg.lineTo(S, y + (r() - 0.5) * 40); sg.stroke(); }

  // cells that contain ridge pixels, for progress
  const pd = print.getContext('2d').getImageData(0, 0, S, S).data;
  const N = 16, cell = S / N, cells = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let hit = 0;
    for (let yy = 0; yy < cell; yy += 4) for (let xx = 0; xx < cell; xx += 4) {
      if (pd[((y * cell + yy) * S + (x * cell + xx)) * 4 + 3] > 40) hit++;
    }
    if (hit > 3) cells.push({ x, y, seen: false });
  }
  let down = false, mx = -99, my = -99, done = false;

  function render() {
    g.drawImage(surf, 0, 0);
    // powder haze where brushed
    g.globalAlpha = 0.18; g.drawImage(mask, 0, 0); g.globalAlpha = 1;
    tg.clearRect(0, 0, S, S); tg.globalCompositeOperation = 'source-over'; tg.drawImage(print, 0, 0);
    tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mask, 0, 0);
    g.drawImage(tmp, 0, 0);
    if (mx > -50) { g.strokeStyle = 'rgba(220,200,150,0.5)'; g.beginPath(); g.arc(mx, my, 22, 0, 7); g.stroke(); }
  }
  function brush(x, y) {
    const rg = mg.createRadialGradient(x, y, 2, x, y, 26);
    rg.addColorStop(0, 'rgba(230,220,200,0.35)'); rg.addColorStop(1, 'rgba(230,220,200,0)');
    mg.fillStyle = rg; mg.beginPath(); mg.arc(x, y, 26, 0, 7); mg.fill();
    let seen = 0;
    for (const c of cells) {
      if (!c.seen) {
        const dx = (c.x + 0.5) * cell - x, dy = (c.y + 0.5) * cell - y;
        if (dx * dx + dy * dy < 22 * 22) c.seen = (c.hits = (c.hits || 0) + 1) > 3;
      }
      if (c.seen) seen++;
    }
    const p = seen / Math.max(1, cells.length);
    fill.style.width = Math.min(100, (p / 0.75) * 100) + '%';
    if (p >= 0.75 && !done) {
      done = true; btn.disabled = false;
      status.textContent = scar ? 'Partial print. A clean line runs straight through the ridges, like an old cut.' : 'Clear partial print. Enough points for records.';
      status.classList.add('ok');
    }
  }
  const pos = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * (S / b.width), (e.clientY - b.top) * (S / b.height)]; };
  cv.addEventListener('pointerdown', (e) => { down = true; cv.setPointerCapture(e.pointerId); [mx, my] = pos(e); brush(mx, my); render(); });
  cv.addEventListener('pointermove', (e) => { [mx, my] = pos(e); if (down) brush(mx, my); render(); });
  cv.addEventListener('pointerup', () => { down = false; });
  cv.addEventListener('pointerleave', () => { mx = -99; render(); });
  btn.addEventListener('click', () => onDone && onDone());
  render();
  // gamepad: left stick moves the brush, A brushes
  return {
    pad(dx, dy, brushing) {
      if (mx < 0) { mx = S / 2; my = S / 2; }
      mx = Math.max(0, Math.min(S, mx + dx * 6)); my = Math.max(0, Math.min(S, my + dy * 6));
      if (brushing) brush(mx, my);
      render();
      if (done && brushing) btn.focus();
    },
  };
}
