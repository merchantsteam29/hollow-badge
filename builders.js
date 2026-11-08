// Low-poly scene builders shared by both cases.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let C = null; // { scene, colliders, lamps, lights, anims }
export function init(ctx) { C = ctx; }

// On Low quality every surface uses the cheaper Lambert shading (no metal/roughness maths).
function surface(p) {
  if (C && C.cheap) { const { roughness, metalness, ...rest } = p; return new THREE.MeshLambertMaterial(rest); }
  return new THREE.MeshStandardMaterial(p);
}

const mats = new Map();

// ---------- procedural textures (generated once, tiled in world units) ----------
// Colour maps are near-white detail (mortar, board seams, grain) so the material colour still sets the hue.
const TILE = { brick: 1.6, stone: 2.4, siding: 2.2, planks: 1.6, asphalt: 4, concrete: 2.2, grass: 3, snow: 5, cobble: 1.8 };
const texCache = new Map();
function noise(g, w, h, n, lo, hi, sz = 2) {
  for (let i = 0; i < n; i++) { const v = lo + Math.random() * (hi - lo); g.fillStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.35})`; g.fillRect(Math.random() * w, Math.random() * h, sz * (0.5 + Math.random()), sz * (0.5 + Math.random())); }
}
const TEXDRAW = {
  brick(g, s) {
    g.fillStyle = '#7a7672'; g.fillRect(0, 0, s, s);
    const rows = 8, bw = s / 4, bh = s / rows;
    for (let r = 0; r < rows; r++) for (let c = -1; c < 5; c++) {
      const v = 205 + Math.random() * 45, x = c * bw + (r % 2) * bw / 2;
      g.fillStyle = `rgb(${v},${v - 6 + Math.random() * 10},${v - 12 + Math.random() * 14})`; g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6);
    }
    noise(g, s, s, 2600, 120, 255);
  },
  stone(g, s) {
    g.fillStyle = '#6e6c68'; g.fillRect(0, 0, s, s);
    for (let r = 0; r < 5; r++) { let x = -Math.random() * 60; while (x < s) { const w = 70 + Math.random() * 90, v = 190 + Math.random() * 50; g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(x + 4, r * s / 5 + 4, w - 8, s / 5 - 8); x += w; } }
    noise(g, s, s, 3000, 110, 255);
  },
  siding(g, s) {
    const boards = 10, bh = s / boards;
    for (let b = 0; b < boards; b++) {
      const grd = g.createLinearGradient(0, b * bh, 0, (b + 1) * bh); const v = 225 + Math.random() * 25;
      grd.addColorStop(0, `rgb(${v},${v},${v})`); grd.addColorStop(0.85, `rgb(${v - 25},${v - 25},${v - 25})`); grd.addColorStop(1, 'rgb(90,90,90)');
      g.fillStyle = grd; g.fillRect(0, b * bh, s, bh);
    }
    for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(150,150,150,${Math.random() * 0.25})`; g.beginPath(); const y = Math.random() * s; g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + 3, s * 0.6, y - 3, s, y + (Math.random() - 0.5) * 4); g.stroke(); }
  },
  planks(g, s) {
    const n = 6, pw = s / n;
    for (let p = 0; p < n; p++) { const v = 200 + Math.random() * 50; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(p * pw, 0, pw - 4, s); g.fillStyle = 'rgb(70,70,70)'; g.fillRect(p * pw + pw - 4, 0, 4, s); }
    for (let i = 0; i < 220; i++) { g.strokeStyle = `rgba(130,130,130,${Math.random() * 0.3})`; g.beginPath(); const x = Math.random() * s; g.moveTo(x, 0); g.lineTo(x + (Math.random() - 0.5) * 8, s); g.stroke(); }
  },
  asphalt(g, s) { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, s, s); noise(g, s, s, 9000, 140, 255, 2); for (let i = 0; i < 7; i++) { g.strokeStyle = 'rgba(90,90,90,0.5)'; g.lineWidth = 1.5; g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); } },
  // roughness map: mostly rough, with smooth wet patches that catch reflections
  asphaltRough(g, s) { g.fillStyle = 'rgb(230,230,230)'; g.fillRect(0, 0, s, s); for (let i = 0; i < 16; i++) { const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 90; const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(25,25,25,0.95)'); grd.addColorStop(1, 'rgba(25,25,25,0)'); g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2); } },
  concrete(g, s) { g.fillStyle = '#dedede'; g.fillRect(0, 0, s, s); noise(g, s, s, 5000, 150, 255, 3); g.fillStyle = 'rgb(110,110,110)'; g.fillRect(0, s / 2 - 2, s, 4); g.fillRect(s / 2 - 2, 0, 4, s); },
  cobble(g, s) { g.fillStyle = '#5a5a5a'; g.fillRect(0, 0, s, s); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const v = 180 + Math.random() * 60; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.ellipse(c * s / 8 + s / 16 + (r % 2) * s / 16, r * s / 8 + s / 16, s / 19, s / 21, Math.random(), 0, 7); g.fill(); } noise(g, s, s, 2000, 120, 255); },
  grass(g, s) { g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, s, s); for (let i = 0; i < 7000; i++) { const v = 150 + Math.random() * 105; g.strokeStyle = `rgba(${v},${v},${v},0.6)`; g.beginPath(); const x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 4, y - 3 - Math.random() * 6); g.stroke(); } },
  snow(g, s) { g.fillStyle = '#f0f0f0'; g.fillRect(0, 0, s, s); for (let i = 0; i < 9; i++) { const x = Math.random() * s, y = Math.random() * s, r = 60 + Math.random() * 140; const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(200,205,215,0.35)'); grd.addColorStop(1, 'rgba(200,205,215,0)'); g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2); } noise(g, s, s, 2500, 210, 255, 2); },
  window(g, s) { // lit: warm glow, curtains, frame + cross bars (used as emissive map)
    const grd = g.createRadialGradient(s / 2, s * 0.75, 4, s / 2, s * 0.6, s * 0.75); grd.addColorStop(0, '#fff'); grd.addColorStop(1, '#8a8a8a');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(40,40,40,0.55)'; g.fillRect(0, 0, s * 0.2, s); g.fillRect(s * 0.8, 0, s * 0.2, s);
    g.fillStyle = 'rgba(40,40,40,0.35)'; g.fillRect(0, 0, s, s * 0.12);
    if (Math.random() < 0.5) { g.fillStyle = 'rgba(30,30,30,0.6)'; g.beginPath(); g.ellipse(s * (0.35 + Math.random() * 0.3), s * 0.62, s * 0.08, s * 0.2, 0, 0, 7); g.fill(); }
    g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, s, 10); g.fillRect(0, s - 10, s, 10); g.fillRect(0, 0, 10, s); g.fillRect(s - 10, 0, 10, s); g.fillRect(s / 2 - 5, 0, 10, s); g.fillRect(0, s * 0.45 - 5, s, 10);
  },
  windowDark(g, s) { // unlit: dark glass with a faint sheen, frame + cross bars
    const grd = g.createLinearGradient(0, 0, s, s); grd.addColorStop(0, '#9aa0a8'); grd.addColorStop(0.5, '#5a6068'); grd.addColorStop(1, '#7a8088');
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, s, 10); g.fillRect(0, s - 10, s, 10); g.fillRect(0, 0, 10, s); g.fillRect(s - 10, 0, 10, s); g.fillRect(s / 2 - 5, 0, 10, s); g.fillRect(0, s * 0.45 - 5, s, 10);
  },
  beam(g, s) { const grd = g.createLinearGradient(0, 0, 0, s); grd.addColorStop(0, '#fff'); grd.addColorStop(0.25, '#999'); grd.addColorStop(0.7, '#2a2a2a'); grd.addColorStop(1, '#000'); g.fillStyle = grd; g.fillRect(0, 0, s, s); },
};
export function tex(name) {
  if (texCache.has(name)) return texCache.get(name);
  const s = name === 'beam' ? 64 : name.startsWith('window') ? 128 : 512;
  const cv = document.createElement('canvas'); cv.width = cv.height = s;
  TEXDRAW[name](cv.getContext('2d'), s);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (name !== 'asphaltRough' && name !== 'beam') t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(name, t);
  return t;
}
// scale a box's UVs so a texture tiles at real-world size
function tileBox(g, w, h, d, t) {
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / t, uv.getY(k) * dims[f][1] / t); }
  uv.needsUpdate = true;
}
function tilePlane(g, w, d, t) { const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / t, uv.getY(k) * d / t); uv.needsUpdate = true; }

export function mat(color, o = {}) {
  const k = color + '|' + (o.map || '') + '|' + (o.emap || '') + '|' + [o.rough, o.metal, o.emissive, o.ei, o.opacity, o.double].join(',');
  if (!mats.has(k)) {
    const extra = {};
    // Low quality skips textures entirely (fast on weak or software-rendered machines)
    const cheap = C && C.cheap;
    if (o.map && !cheap) { extra.map = tex(o.map); if (o.map === 'asphalt') extra.roughnessMap = tex('asphaltRough'); }
    if (o.emap && !cheap) extra.emissiveMap = tex(o.emap);
    mats.set(k, surface({
      ...extra,
      color, roughness: o.rough ?? 0.92, metalness: o.metal ?? 0,
      emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1,
      transparent: o.opacity !== undefined, opacity: o.opacity ?? 1,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
    }));
  }
  return mats.get(k);
}
export function clearCache() { mats.forEach((m) => m.dispose()); mats.clear(); resetShared(); }

export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function collider(x0, z0, x1, z1) {
  C.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
}

function shadowy(m, cast = true) { m.castShadow = cast; m.receiveShadow = true; return m; }

// Box with its base at y.
export function box(w, h, d, color, x, y, z, o = {}) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (o.map) tileBox(geo, w, h, d, TILE[o.map] || 2);
  const m = new THREE.Mesh(geo, o.material || mat(color, o));
  m.position.set(x, y + h / 2, z);
  if (o.ry) m.rotation.y = o.ry;
  shadowy(m, o.shadow !== false);
  (o.parent || C.scene).add(m);
  if (o.collide) collider(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
  return m;
}
export function cyl(rt, rb, h, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 8), o.material || mat(color, o));
  m.position.set(x, y + h / 2, z);
  shadowy(m, o.shadow !== false);
  (o.parent || C.scene).add(m);
  return m;
}

export function ground(cx, cz, w, d, color, o = {}) {
  const geo = new THREE.PlaneGeometry(w, d); if (o.map) tilePlane(geo, w, d, TILE[o.map] || 3);
  const m = new THREE.Mesh(geo, mat(color, { rough: 1, map: o.map }));
  m.rotation.x = -Math.PI / 2; m.position.set(cx, 0, cz); m.receiveShadow = true;
  C.scene.add(m); return m;
}
export function flat(w, d, color, x, z, y = 0.02, o = {}) {
  const geo = new THREE.PlaneGeometry(w, d); if (o.map) tilePlane(geo, w, d, TILE[o.map] || 2);
  const m = new THREE.Mesh(geo, mat(color, { rough: o.rough ?? 0.85, metal: o.metal ?? 0, map: o.map }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true;
  C.scene.add(m); return m;
}

// Canvas texture plane (signs, carvings, chalk).
export function decal(draw, w, h, x, y, z, o = {}) {
  const cw = o.res || 512, ch = Math.round(cw * (h / w));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  draw(cv.getContext('2d'), cw, ch);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const material = o.glow
    ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    : surface({ map: tex, transparent: true, depthWrite: false, roughness: 0.95 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z);
  if (o.ry !== undefined) m.rotation.y = o.ry;
  if (o.floor) m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2; m.receiveShadow = true;
  (o.parent || C.scene).add(m);
  return m;
}
export function signText(text, w, h, x, y, z, ry, o = {}) {
  return decal((g, cw, ch) => {
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, cw, ch); }
    g.fillStyle = o.color || '#ffcf86';
    g.font = `${o.weight || 700} ${Math.round(ch * (o.size || 0.55))}px ${o.font || 'Oswald, Impact, sans-serif'}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.shadow) { g.shadowColor = o.color || '#ffcf86'; g.shadowBlur = ch * 0.25; }
    g.fillText(text, cw / 2, ch / 2);
  }, w, h, x, y, z, { ry, glow: o.glow !== false, res: o.res });
}

// Window materials (few shared variants).
function windowMat(r, lit) {
  if (r < lit) {
    const tint = [0xffc27a, 0xffd59a, 0xe8a25a][Math.floor(r * 31) % 3];
    return mat(0x000000, { emissive: tint, ei: 0.5 + (Math.floor(r * 97) % 3) * 0.3, emap: 'window' });
  }
  return mat(0x1a1e24, { rough: 0.2, metal: 0.7, map: 'windowDark' });
}
const FACE = {
  '+x': { ry: Math.PI / 2, n: [1, 0] }, '-x': { ry: -Math.PI / 2, n: [-1, 0] },
  '+z': { ry: 0, n: [0, 1] }, '-z': { ry: Math.PI, n: [0, -1] },
};

// Axis-aligned building. sx/sz = footprint, face = side with the door.
export function house(x, z, o = {}) {
  const sx = o.sx || 7, sz = o.sz || 8, h = o.h || 5;
  const r = rng(o.seed || Math.floor(x * 13 + z * 7 + 999));
  box(sx, h, sz, o.color || 0x2b2724, x, 0, z, { collide: true, map: o.tex === undefined ? 'siding' : o.tex || undefined });
  const lit = o.lit ?? 0.3;
  const win = new THREE.PlaneGeometry(o.winW || 1.0, o.winH || 1.3);
  const face = o.face || '+x';
  for (const [key, f] of Object.entries(FACE)) {
    const along = f.n[0] !== 0 ? sz : sx;
    const cols = Math.max(1, Math.floor(along / 2.6)), rows = Math.max(1, Math.floor(h / 2.7));
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const t = (col + 0.5) / cols - 0.5;
      if (key === face && row === 0 && Math.abs(t * along) < 1.3) continue; // door slot
      if (o.blind && key !== face && r() < 0.5) continue;
      const m = new THREE.Mesh(win, o.boarded ? mat(0x241a12) : windowMat(r(), lit));
      const wy = 1.6 + row * 2.7;
      if (wy > h - 0.8) continue;
      if (f.n[0] !== 0) m.position.set(x + f.n[0] * (sx / 2 + 0.02), wy, z + t * along);
      else m.position.set(x + t * along, wy, z + f.n[1] * (sz / 2 + 0.02));
      m.rotation.y = f.ry;
      C.scene.add(m);
    }
  }
  // door
  const f = FACE[face];
  const dx = x + f.n[0] * (sx / 2), dz = z + f.n[1] * (sz / 2);
  const door = box(f.n[0] ? 0.14 : 1.2, 2.2, f.n[0] ? 1.2 : 0.14, o.doorColor || 0x1a1210, dx, 0, dz);
  if (o.porchLight) {
    const pl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0x000000, { emissive: 0xffc27a, ei: 2 }));
    pl.position.set(dx + f.n[0] * 0.15 + (f.n[1] ? 0.9 : 0), 2.5, dz + f.n[1] * 0.15 + (f.n[0] ? 0.9 : 0));
    C.scene.add(pl);
  }
  // roof
  if (o.roof !== false) {
    const rh = o.roofH || 2.2;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, rh, 4), mat(o.roofColor || 0x16171b));
    roof.rotation.y = Math.PI / 4; roof.scale.set(sx * 0.76, 1, sz * 0.76);
    roof.position.set(x, h + rh / 2, z); shadowy(roof); C.scene.add(roof);
  } else {
    box(sx + 0.3, 0.4, sz + 0.3, o.trim || 0x1b1715, x, h, z, { shadow: false });
  }
  return {
    door, doorPos: new THREE.Vector3(dx + f.n[0] * 1.4, 1.5, dz + f.n[1] * 1.4),
    front: { x: dx, z: dz, n: f.n, ry: f.ry },
  };
}

// A light source is plain data; main.js assigns a small fixed pool of real PointLights
// to the nearest sources each frame, so the shader cost never grows with the map.
export function light(x, y, z, color, intensity, dist = 12) {
  const rec = { pos: new THREE.Vector3(x, y, z), color: new THREE.Color(color), base: intensity, cur: intensity, dist };
  C.lights.push(rec);
  return rec;
}

export function lamp(x, z, o = {}) {
  const color = o.color ?? 0xffb466;
  cyl(0.07, 0.1, 4.6, 0x111214, x, 0, z, { metal: 0.6, rough: 0.5 });
  const bulbMat = surface({ color: 0x000000, emissive: color, emissiveIntensity: 2.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bulbMat);
  bulb.position.set(x, 4.55, z); C.scene.add(bulb);
  box(0.5, 0.12, 0.5, 0x111214, x, 4.7, z, { shadow: false });
  const coneMat = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: 0.24 }, fogDensity: { value: (C.scene.fog && C.scene.fog.density) || 0.05 } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; varying float vD; void main() { vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 color; uniform float opacity, fogDensity; varying float vY; varying vec3 vN; varying vec3 vV; varying float vD; void main() { float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); float grad = smoothstep(0.02, 0.9, vY) * (0.3 + 0.7 * vY); float fog = exp(-pow(fogDensity * vD, 2.0)); gl_FragColor = vec4(color * opacity * edge * grad * fog, 1.0); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  if (!C.cheap) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(o.coneR ?? 2.4, 4.4, 24, 1, true), coneMat);
    cone.position.set(x, 4.5 - 2.2, z); cone.userData.dynamic = true; cone.renderOrder = 3; C.scene.add(cone);
  }
  const rec = light(x, 4.3, z, color, o.intensity ?? 30, o.dist ?? 19);
  Object.assign(rec, { bulbMat, flicker: !!o.flicker, on: true, cone: coneMat });
  C.lamps.push(rec);
  if (o.flicker) {
    let t = 0, next = 1 + Math.random() * 3;
    C.anims.push((dt) => {
      if (!rec.on) return;
      t += dt;
      if (t > next) { t = 0; next = 0.05 + Math.random() * (Math.random() < 0.15 ? 2.5 : 0.25); }
      const k = C.calm ? 0.95 : Math.random() < 0.12 ? 0.08 : 0.85 + Math.random() * 0.15;
      rec.cur = rec.base * k; bulbMat.emissiveIntensity = 2.2 * k; coneMat.uniforms.opacity.value = 0.24 * k;
    });
  }
  return rec;
}
export function setLamp(rec, on, k = 1) {
  if (!rec) return;
  rec.on = on;
  rec.cur = on ? rec.base * k : 0;
  if (rec.cone) rec.cone.uniforms.opacity.value = on ? 0.24 * Math.min(1.4, k) : 0;
  rec.bulbMat.emissiveIntensity = on ? 2.2 * k : 0;
}

// Forest: one merged tree shape (vertex-coloured), instanced per 12 m chunk.
// Chunks behind the camera are frustum-culled, and chunks deep in the fog are hidden (C.cull).
let treeGeo = null, treeMat = null, treeSnow = false;
function makeTree(snow) {
  treeSnow = !!snow;
  const paint = (g, hex) => {
    const c = new THREE.Color(hex), n = g.attributes.position.count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3)); return g;
  };
  const parts = [paint(new THREE.CylinderGeometry(0.12, 0.22, 2.4, 5).translate(0, 1.2, 0), 0x1a120c)];
  for (let k = 0; k < 3; k++) parts.push(paint(new THREE.ConeGeometry(1.4 * (1 - k * 0.22), 2.8, 6).translate(0, 2.6 + k * 1.5, 0), snow ? [0x1c2a26, 0x4a5658, 0x7c878c][k] : 0x0a120d));
  treeGeo = mergeGeometries(parts, false); parts.forEach((g) => g.dispose());
  treeMat = new THREE.MeshLambertMaterial({ vertexColors: true });
}
export function forest(list, o = {}) {
  if (!list.length) return;
  if (!treeGeo || !treeGeo.attributes.position || treeSnow !== !!o.snow) makeTree(o.snow);
  const chunks = new Map();
  for (const t of list) {
    const k = Math.floor(t.x / 12) + ',' + Math.floor(t.z / 12);
    if (!chunks.has(k)) chunks.set(k, []);
    chunks.get(k).push(t);
    const sc = t.s || 1;
    collider(t.x - 0.3 * sc, t.z - 0.3 * sc, t.x + 0.3 * sc, t.z + 0.3 * sc);
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const trees of chunks.values()) {
    const mesh = new THREE.InstancedMesh(treeGeo, treeMat, trees.length);
    trees.forEach((t, i) => {
      const sc = t.s || 1;
      q.setFromAxisAngle(up, t.x * 3.1 + t.z);
      mesh.setMatrixAt(i, m.compose(p.set(t.x, 0, t.z), q, s.set(sc, sc, sc)));
    });
    mesh.computeBoundingSphere();
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.dynamic = true;
    C.scene.add(mesh);
  }
}
export function resetShared() { if (treeGeo) treeGeo.dispose(); if (treeMat) treeMat.dispose(); treeGeo = treeMat = null; }

// Human character. Faces +z before ry. Feet at y = 0, about 1.76 m tall at scale 1.
// Options:
//   pose: 'stand' | 'sit' | 'lie' (face down)      arms: 'down' | 'hug' | 'clasp' | 'pockets' | 'smoke' | 'knees' | 'fire' | 'cane' | 'flashlight'
//   body: 'male' | 'female' | 'child'               build: 'normal' | 'heavy' | 'thin'      old: stoop + slower
//   coat, pants, shirt, shoes, skin, hair (colours)  coatLen: 'short' | 'long' | 'none'      tie: colour
//   hairStyle: 'short' | 'long' | 'bun' | 'pony' | 'bald' | 'messy'     beard: true | 'stubble'
//   hat: 'fedora' | 'police' | 'beanie' + hatColor  glasses, glint (lenses catch light), collar (priest), badge, apron: colour
//   ribbon: colour (hair ribbon), knife: true (in the back; used for the shed scene)
//   look: false to stop the head turning toward the player
const _m4 = new THREE.Matrix4();
function cap(r, len, m, x, y, z, parent) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function ball(r, m, x, y, z, parent, sx = 1, sy = 1, sz = 1, seg = 14) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.75))), m);
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); return mesh;
}
function cube(w, h, d, m, x, y, z, parent) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function tube(rt, rb, h, m, x, y, z, parent, seg = 14, open = false) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), m);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
// Merge every mesh under `anchor` (not crossing into other anchors) into one mesh per material.
function bakeInto(anchor, anchors) {
  anchor.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(anchor.matrixWorld).invert();
  const byMat = new Map(), victims = [];
  const walk = (node) => {
    for (const ch of [...node.children]) {
      if (ch !== anchor && anchors.includes(ch)) continue;
      if (ch.isMesh && !ch.visible) { victims.push(ch); continue; }
      if (ch.isMesh && !ch.userData.keep) {
        const g = (ch.geometry.index ? ch.geometry.toNonIndexed() : ch.geometry.clone());
        for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
        g.applyMatrix4(_m4.multiplyMatrices(inv, ch.matrixWorld));
        if (!byMat.has(ch.material)) byMat.set(ch.material, []);
        byMat.get(ch.material).push(g); victims.push(ch);
      }
      walk(ch);
    }
  };
  walk(anchor);
  for (const v of victims) { v.parent.remove(v); v.geometry.dispose(); }
  for (const [m, geos] of byMat) {
    const merged = mergeGeometries(geos, false); geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, m); mesh.castShadow = true; mesh.receiveShadow = true;
    anchor.add(mesh);
  }
}

export function person(x, z, o = {}) {
  const outer = new THREE.Group(); outer.position.set(x, 0, z); outer.rotation.y = o.ry || 0;
  const g = new THREE.Group(); outer.add(g);
  const sc = o.scale || 1; g.scale.setScalar(sc);
  const female = o.body === 'female' || o.body === 'child-girl' || (o.longHair && o.body !== 'male');
  const child = (o.scale || 1) < 0.85;
  const W = o.build === 'heavy' ? 1.18 : o.build === 'thin' ? 0.9 : 1;
  const coatLen = o.coatLen || (o.longCoat ? 'long' : 'short');

  const M = {
    coat: mat(o.coat ?? 0x2a2a30, { rough: 0.85 }), pants: mat(o.pants ?? 0x1a1a1e, { rough: 0.9 }),
    skin: mat(o.skin ?? 0x8a6a58, { rough: 0.65 }), hair: mat(o.hair ?? 0x1a1410, { rough: 0.8 }),
    shoe: mat(o.shoes ?? 0x0c0b0a, { rough: 0.45, metal: 0.2 }), shirt: mat(o.shirt ?? 0x8a8678, { rough: 0.9 }),
    eye: mat(0x080808, { rough: 0.25 }), lip: mat(0x4a2a24, { rough: 0.7 }),
  };
  const sit = o.pose === 'sit', lie = o.pose === 'lie';
  const H = sit ? (o.seatH ?? 0.56) : 0.9;

  // ---- legs (each a hip group with a knee group, so poses can bend them) ----
  const legs = [];
  for (const sx of [-1, 1]) {
    const hipG = new THREE.Group(); hipG.position.set(sx * 0.095 * W, H, 0); g.add(hipG);
    cap(0.078 * W, 0.3, M.pants, 0, -0.22, 0, hipG);
    const knee = new THREE.Group(); knee.position.set(0, -0.44, 0); hipG.add(knee);
    cap(0.062 * W, 0.3, M.pants, 0, -0.2, 0, knee);
    cube(0.105, 0.085, 0.27, M.shoe, 0, -0.42, 0.045, knee);
    if (sit) { hipG.rotation.x = -Math.PI / 2 + 0.08; knee.rotation.x = Math.PI / 2 - 0.08; hipG.rotation.y = sx * 0.08; }
    legs.push({ hip: hipG, knee, side: sx });
  }
  // pelvis
  ball(0.17, M.pants, 0, H + 0.03, 0, g, ((female ? 0.135 : 0.15) / 0.17) * W, 0.55, 0.58);

  // ---- spine: torso, arms, head ----
  const spine = new THREE.Group(); spine.position.set(0, H + 0.02, 0); g.add(spine);
  if (o.old) spine.rotation.x = 0.14;
  const sh = female ? 0.18 : 0.2, wa = female ? 0.13 : 0.155;
  const prof = [[wa, 0], [wa + 0.005, 0.08], [wa + 0.02, 0.2], [sh - 0.005, 0.33], [sh, 0.43], [sh - 0.02, 0.5], [0.12, 0.555], [0.055, 0.575], [0.001, 0.578]]
    .map(([r, y]) => new THREE.Vector2(r * W, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), M.coat); torso.scale.z = 0.62; spine.add(torso);
  if (female) { ball(0.07, M.coat, -0.065, 0.36, 0.075 * W, spine, 1, 0.85, 0.8); ball(0.07, M.coat, 0.065, 0.36, 0.075 * W, spine, 1, 0.85, 0.8); }
  // shirt V, tie, collar
  if (coatLen !== 'none') {
    const v = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.17, 3), M.shirt); v.rotation.x = Math.PI; v.scale.z = 0.25; v.position.set(0, 0.47, 0.112 * W); spine.add(v);
    if (o.tie) { const t = cube(0.03, 0.15, 0.01, mat(o.tie, { rough: 0.6 }), 0, 0.43, 0.118 * W, spine); t.rotation.x = -0.12; }
    // lapels
    for (const s of [-1, 1]) { const l = cube(0.05, 0.2, 0.012, M.coat, s * 0.06, 0.44, 0.112 * W, spine); l.rotation.z = s * 0.35; l.rotation.y = s * -0.25; }
    // coat skirt
    if (coatLen === 'long' || coatLen === 'short') {
      const len = coatLen === 'long' ? 0.62 : 0.24;
      const skirt = tube(wa * W + 0.012, wa * W + (coatLen === 'long' ? 0.075 : 0.035), len, mat(o.coat ?? 0x2a2a30, { rough: 0.85, double: true }), 0, 0.02 - len / 2, 0, spine, 16, true);
      skirt.scale.z = 0.7;
      // buttons
      for (let i = 0; i < 3; i++) ball(0.009, M.shoe, 0.012, 0.3 - i * 0.09, 0.105 * W, spine, 1, 1, 0.5, 6);
    }
  }
  if (o.apron) { const ap = cube(0.26 * W, 0.5, 0.01, mat(o.apron, { rough: 0.9 }), 0, 0.12, 0.112 * W, spine); ap.rotation.x = -0.05; }
  if (o.badge) { const bm = mat(0x000000, { emissive: 0x8a6a20, ei: 0.6, metal: 0.8, rough: 0.3 }); bm.color.setHex(0xb8962e); cube(0.035, 0.045, 0.01, bm, -0.08, 0.41, 0.118 * W, spine); }
  if (o.knife) {
    cube(0.034, 0.034, 0.2, mat(0x0e0a08, { rough: 0.6 }), 0.05, 0.22, -0.2, spine);
    cube(0.11, 0.025, 0.025, mat(0x666666, { metal: 0.9, rough: 0.3 }), 0.05, 0.22, -0.11, spine);
  }
  // neck
  tube(0.045, 0.052, 0.1, M.skin, 0, 0.6, 0.005, spine, 10);
  if (o.collar) { tube(0.06, 0.066, 0.045, mat(0x111111), 0, 0.575, 0, spine, 12); cube(0.03, 0.025, 0.01, mat(0xe8e4dc, { rough: 0.6 }), 0, 0.578, 0.064, spine); }
  else if (coatLen !== 'none') { const col = tube(0.075, 0.1, 0.08, mat(o.coat ?? 0x2a2a30, { rough: 0.85, double: true }), 0, 0.575, -0.01, spine, 14, true); col.scale.z = 0.85; }
  if (o.scarf) { const sm = mat(o.scarf, { rough: 0.95 }); const sf = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.03, 8, 16), sm); sf.rotation.x = Math.PI / 2; sf.position.set(0, 0.585, 0.005); spine.add(sf); cube(0.06, 0.2, 0.025, sm, 0.04, 0.47, 0.11, spine); }

  // ---- arms: shoulder group -> elbow group -> hand ----
  const ARM = {
    down: [[0.05, 0, 0.09], [-0.18, 0]], hug: [[-0.3, 0, -0.28], [-1.75, 0.95]], clasp: [[-0.22, 0, -0.12], [-1.05, 0.55]],
    pockets: [[0.12, 0, 0.14], [-0.35, 0]], knees: [[-0.45, 0, 0.06], [-0.75, 0]], fire: [[-1.0, 0, -0.04], [-0.55, 0.25]],
    flashlight: [[-0.1, 0, 0.08], [-0.5, 0]], cane: [[-0.12, 0, 0.12], [-0.3, 0]], eat: [[-0.6, 0, -0.18], [-1.95, 0.55]],
  };
  const pose = o.arms || (o.cane ? 'cane' : sit ? 'knees' : 'down');
  const arms = [], armRig = [];
  let ember = null;
  for (const sxn of [-1, 1]) {
    const side = sxn === 1 ? 'R' : 'L';
    let p = ARM[pose] || ARM.down;
    if (pose === 'smoke') p = side === 'R' ? [[-0.35, 0, 0.18], [-2.25, -0.25]] : [[-0.2, 0, -0.2], [-1.35, 0.85]];
    if ((pose === 'cane' || pose === 'flashlight') && side === 'L') p = ARM.down;
    const shoulder = new THREE.Group(); shoulder.position.set(sxn * (sh * W + 0.035), 0.5, 0); spine.add(shoulder);
    // z param: positive = arm swings outward, negative = across the body
    shoulder.rotation.set(p[0][0], 0, sxn * p[0][2]);
    ball(0.05 * W, M.coat, -sxn * 0.01, 0.0, 0, shoulder, 1.1, 0.9, 0.95);
    const ua = cap(0.046 * W, 0.24, M.coat, 0, -0.15, 0, shoulder); ua.scale.z = 0.92;
    const elbow = new THREE.Group(); elbow.rotation.order = 'YXZ'; elbow.position.set(0, -0.29, 0); shoulder.add(elbow);
    elbow.rotation.x = p[1][0]; elbow.rotation.y = -sxn * p[1][1];
    const fa = cap(0.04 * W, 0.2, M.coat, 0, -0.13, 0, elbow); fa.scale.z = 0.9;
    tube(0.044 * W, 0.047 * W, 0.035, M.coat, 0, -0.245, 0, elbow, 10); // cuff
    const hand = ball(0.044, M.skin, 0, -0.305, 0.005, elbow, 0.78, 1.2, 0.5, 10);
    const thumb = cap(0.014, 0.03, M.skin, -sxn * 0.03, -0.29, 0.018, elbow); thumb.rotation.z = -sxn * 0.5;
    if (pose === 'pockets') { hand.visible = false; thumb.visible = false; }
    if (pose === 'smoke' && side === 'R') {
      const cig = tube(0.005, 0.005, 0.07, mat(0xdedad0), 0, -0.33, 0.03, elbow, 6); cig.rotation.x = 1.2;
      const em = new THREE.MeshBasicMaterial({ color: 0xff5a1a });
      ember = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), em); ember.position.set(0, -0.345, 0.065); ember.userData.keep = true; elbow.add(ember);
    }
    if (pose === 'flashlight' && side === 'R') {
      const fl = tube(0.018, 0.022, 0.2, mat(0x151515, { metal: 0.7, rough: 0.4 }), 0, -0.32, 0.06, elbow, 8); fl.rotation.x = 1.4;
    }
    arms.push(shoulder); armRig.push({ shoulder, elbow, side: sxn });
  }
  if (o.cane || pose === 'cane') {
    // straight to the ground from roughly where the right hand is
    tube(0.012, 0.012, 0.86, mat(0x120c08, { rough: 0.5 }), 0.29 * W, 0.43, 0.1, g, 6);
    tube(0.018, 0.018, 0.07, mat(0x120c08, { rough: 0.5 }), 0.29 * W, 0.86, 0.12, g, 6).rotation.x = Math.PI / 2;
  }

  // ---- head ----
  const head = new THREE.Group(); head.position.set(0, 0.64, 0.01); spine.add(head);
  if (child) head.scale.setScalar(1.14);
  if (o.old) head.rotation.x = -0.12;
  ball(0.104, M.skin, 0, 0.085, 0, head, 1, 1.17, 1.06, 18);               // cranium
  ball(0.078, M.skin, 0, 0.025, 0.022, head, female ? 0.95 : 1.05, 0.85, 1); // jaw
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.045, 4), M.skin); nose.rotation.x = Math.PI / 2 + 0.25; nose.position.set(0, 0.075, 0.112); head.add(nose);
  for (const s of [-1, 1]) {
    ball(0.013, M.eye, s * 0.036, 0.098, 0.096, head, 1.2, 0.8, 0.6, 8);
    const brow = cube(0.04, 0.009, 0.012, M.hair, s * 0.037, 0.122, 0.098, head); brow.rotation.z = s * -0.12;
    ball(0.024, M.skin, s * 0.104, 0.085, -0.005, head, 0.45, 1, 0.75, 8); // ear
  }
  if (o.grin) {
    // a smile that is too wide for the face
    const dark = mat(0x0a0303, { rough: 0.4 });
    cube(0.118, 0.014, 0.012, dark, 0, 0.03, 0.094, head);
    cube(0.104, 0.007, 0.01, mat(0xcfc8b4, { rough: 0.3 }), 0, 0.035, 0.097, head);
    for (const s of [-1, 1]) { const c = cube(0.03, 0.01, 0.01, dark, s * 0.066, 0.041, 0.086, head); c.rotation.z = s * 0.55; c.rotation.y = s * -0.5; }
  } else cube(0.036, 0.006, 0.01, M.lip, 0, 0.032, 0.098, head); // mouth
  if (o.beard) {
    const bm = o.beard === 'stubble' ? mat(o.hair ?? 0x1a1410, { rough: 1, opacity: 0.55 }) : M.hair;
    ball(0.082, bm, 0, 0.018, 0.03, head, 1.05, o.beard === 'stubble' ? 0.85 : 1.05, 1.0);
  }
  // hair
  const hs = o.hairStyle || (o.longHair ? 'long' : 'short');
  if (hs !== 'bald') {
    const capG = new THREE.SphereGeometry(0.112, 18, 10, 0, Math.PI * 2, 0, Math.PI * (hs === 'messy' ? 0.55 : 0.47));
    const hc = new THREE.Mesh(capG, M.hair); hc.scale.set(1.03, 1.12, 1.1); hc.position.set(0, 0.098, -0.012); hc.rotation.x = -0.5; head.add(hc);
    if (hs === 'long') { const back = cap(0.1, 0.18, M.hair, 0, -0.03, -0.055, head); back.scale.set(1.05, 1, 0.55); for (const s of [-1, 1]) { const side = cap(0.035, 0.16, M.hair, s * 0.095, 0.0, 0.0, head); side.scale.z = 0.8; } }
    if (hs === 'bun') ball(0.048, M.hair, 0, 0.15, -0.11, head);
    if (hs === 'pony') { ball(0.03, M.hair, 0, 0.11, -0.12, head); const pt = cap(0.032, 0.16, M.hair, 0, -0.0, -0.145, head); pt.rotation.x = 0.25; }
    if (hs === 'messy') for (let i = 0; i < 6; i++) { const a = i * 1.05; ball(0.03, M.hair, Math.sin(a) * 0.08, 0.17 + (i % 2) * 0.015, Math.cos(a) * 0.07 - 0.02, head, 1, 0.7, 1, 8); }
  } else {
    for (const s of [-1, 1]) ball(0.05, M.hair, s * 0.085, 0.085, -0.035, head, 0.5, 0.8, 1.1, 10); // fringe around the ears
  }
  if (o.ribbon) { const rm = mat(o.ribbon, { emissive: 0x220000, rough: 0.6 }); cube(0.1, 0.035, 0.03, rm, 0, 0.12, -0.12, head); }
  // hats
  const hat = o.hat === true ? 'fedora' : typeof o.hat === 'number' ? 'fedora' : o.hat;
  const hatColor = o.hatColor ?? (typeof o.hat === 'number' ? o.hat : typeof o.cap === 'number' ? o.cap : 0x151515);
  const HM = mat(hatColor, { rough: 0.8 });
  if (hat === 'fedora') {
    tube(0.2, 0.2, 0.014, HM, 0, 0.178, 0, head, 22);
    const crown = tube(0.098, 0.116, 0.11, HM, 0, 0.235, 0, head, 18); crown.scale.z = 1.1;
    tube(0.118, 0.118, 0.025, mat(0x060606), 0, 0.195, 0, head, 18).scale.z = 1.1;
  } else if (hat === 'police' || o.cap) {
    tube(0.122, 0.114, 0.075, HM, 0, 0.205, 0, head, 18);
    tube(0.138, 0.124, 0.03, HM, 0, 0.255, 0.005, head, 18);
    const visor = cube(0.17, 0.012, 0.085, mat(0x050505, { rough: 0.3, metal: 0.3 }), 0, 0.178, 0.105, head); visor.rotation.x = 0.28;
    const bm = mat(0x000000, { emissive: 0x8a6a20, ei: 0.6 }); bm.color.setHex(0xb8962e); cube(0.03, 0.03, 0.01, bm, 0, 0.21, 0.122, head);
  } else if (hat === 'beanie') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), HM); b.scale.set(1, 1.2, 1.08); b.position.set(0, 0.105, 0); head.add(b);
    tube(0.123, 0.123, 0.04, HM, 0, 0.13, 0, head, 16).scale.z = 1.08;
  }
  if (o.glasses) {
    const gm = mat(0x0a0a0a, { metal: 0.8, rough: 0.3 });
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.0022, 6, 14), gm); r.position.set(s * 0.037, 0.098, 0.11); head.add(r); }
    cube(0.025, 0.004, 0.004, gm, 0, 0.1, 0.112, head);
    if (o.blackLenses) {
      const lens = mat(0x020202, { rough: 0.08, metal: 0.9 }), shine = new THREE.MeshBasicMaterial({ color: 0xf0f4ff });
      for (const s of [-1, 1]) {
        const l = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12), lens); l.position.set(s * 0.037, 0.098, 0.111); head.add(l);
        const sp = new THREE.Mesh(new THREE.CircleGeometry(0.0045, 8), shine); sp.position.set(s * 0.037 + 0.007, 0.105, 0.1125); sp.userData.keep = true; head.add(sp);
      }
    } else if (o.glint) { const lm = new THREE.MeshBasicMaterial({ color: 0xcfe0ff }); for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.017, 10), lm); l.position.set(s * 0.037, 0.098, 0.112); l.userData.keep = true; head.add(l); } }
  }

  if (lie) { g.rotation.x = Math.PI / 2; g.position.y = 0.13 * sc; g.position.z = -0.92 * sc; }
  C.scene.add(outer);
  if (o.collide !== false && !lie) collider(x - 0.35, z - 0.35, x + 0.35, z + 0.35);

  // merge each rigid part into a few meshes (one per material)
  // rig: keep every joint separate so it can be animated (costs a few more draw calls)
  const anchors = [g, spine, head];
  if (o.rig) for (const j of [...legs.flatMap((l) => [l.hip, l.knee]), ...armRig.flatMap((a) => [a.shoulder, a.elbow])]) anchors.push(j);
  for (const a of anchors) bakeInto(a, anchors);

  // ---- idle animation: breathing, weight shift, looking at the player when close ----
  if (!lie && o.idle !== false) {
    let t = Math.random() * 10, hy = 0, hp = 0;
    const speed = o.old ? 0.7 : 1;
    const baseSpineX = spine.rotation.x, baseHeadX = head.rotation.x;
    const wp = new THREE.Vector3();
    C.anims.push((dt) => {
      t += dt * speed;
      spine.scale.set(1 + Math.sin(t * 1.7) * 0.008, 1 + Math.sin(t * 1.7) * 0.012, 1 + Math.sin(t * 1.7) * 0.012);
      if (!sit) { spine.rotation.z = Math.sin(t * 0.35) * 0.025; g.position.x = Math.sin(t * 0.35) * 0.012; }
      spine.rotation.x = baseSpineX + Math.sin(t * 1.7) * 0.01;
      let ty = Math.sin(t * 0.31) * 0.45 + Math.sin(t * 0.97) * 0.08, tp = Math.sin(t * 0.23) * 0.06;
      if (o.look !== false && !outer.userData.noLook && C.camera) {
        head.getWorldPosition(wp);
        const dx = C.camera.position.x - wp.x, dz = C.camera.position.z - wp.z, d = Math.hypot(dx, dz);
        if (d < 7) {
          let a = Math.atan2(dx, dz) - outer.rotation.y - spine.rotation.y;
          a = Math.atan2(Math.sin(a), Math.cos(a));
          if (Math.abs(a) < 1.6) { ty = Math.max(-1.1, Math.min(1.1, a)); tp = -Math.atan2(C.camera.position.y - wp.y - 0.1, d) * 0.6; }
        }
      }
      const k = Math.min(1, dt * 3);
      hy += (ty - hy) * k; hp += (tp - hp) * k;
      head.rotation.y = hy; head.rotation.x = baseHeadX + hp;
      if (ember) ember.material.color.setRGB(1, 0.3 + Math.max(0, Math.sin(t * 0.9)) * 0.35, 0.1);
    });
  }
  outer.userData = { inner: g, head, torso: spine, spine, legs, arms: armRig };
  return outer;
}

// Walking gait for a rigged person (person({ rig: true })). phase advances with distance walked.
export function gait(p, phase, amp = 1) {
  const { legs, arms, inner } = p.userData;
  for (const l of legs) {
    const q = phase + (l.side > 0 ? 0 : Math.PI);
    l.hip.rotation.set(-Math.sin(q) * 0.42 * amp, 0, 0);
    l.knee.rotation.set(0.08 + Math.max(0, Math.sin(q - 1.2)) * 0.75 * amp, 0, 0);
  }
  for (const a of arms) {
    const q = phase + (a.side > 0 ? Math.PI : 0);
    a.shoulder.rotation.set(-Math.sin(q) * 0.3 * amp, 0, a.side * 0.08);
    a.elbow.rotation.set(-0.25 - Math.max(0, Math.sin(q)) * 0.2 * amp, 0, 0);
  }
  inner.position.y = Math.abs(Math.sin(phase)) * 0.025 * amp;
}
export const faceTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);

export function car(x, z, o = {}) {
  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = o.ry || 0;
  const body = o.color ?? 0x101216;
  box(1.9, 0.7, 4.5, body, 0, 0.32, 0, { parent: grp, metal: 0.5, rough: 0.4 });
  box(1.7, 0.6, 2.3, body, 0, 1.02, -0.2, { parent: grp, metal: 0.5, rough: 0.4 });
  box(1.72, 0.45, 2.1, 0x07090c, 0, 1.08, -0.2, { parent: grp, metal: 0.9, rough: 0.15 });
  if (o.police) box(1.92, 0.2, 2.4, 0xbfc3c8, 0, 0.55, 0.2, { parent: grp, shadow: false });
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 12), mat(0x050505));
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.36, wz); grp.add(w);
  }
  const hl = mat(0x000000, { emissive: 0xfff1d6, ei: o.lightsOn ? 2 : 0.15 });
  box(0.35, 0.14, 0.05, 0, -0.62, 0.62, 2.26, { parent: grp, material: hl, shadow: false });
  box(0.35, 0.14, 0.05, 0, 0.62, 0.62, 2.26, { parent: grp, material: hl, shadow: false });
  const tl = mat(0x000000, { emissive: 0xff1a1a, ei: 0.8 });
  box(0.35, 0.12, 0.05, 0, -0.65, 0.65, -2.26, { parent: grp, material: tl, shadow: false });
  box(0.35, 0.12, 0.05, 0, 0.65, 0.65, -2.26, { parent: grp, material: tl, shadow: false });
  C.scene.add(grp);
  const ry = o.ry || 0, side = Math.abs(Math.sin(ry)) > 0.5;
  collider(x - (side ? 2.3 : 1.0), z - (side ? 1.0 : 2.3), x + (side ? 2.3 : 1.0), z + (side ? 1.0 : 2.3));
  if (o.police) {
    const red = surface({ color: 0, emissive: 0xff1020, emissiveIntensity: 0 });
    const blue = surface({ color: 0, emissive: 0x1840ff, emissiveIntensity: 0 });
    box(0.6, 0.14, 0.25, 0, -0.35, 1.32, -0.2, { parent: grp, material: red, shadow: false });
    box(0.6, 0.14, 0.25, 0, 0.35, 1.32, -0.2, { parent: grp, material: blue, shadow: false });
    const pl = light(x, 1.9, z - 0.2 * Math.cos(ry), 0xff1020, 0, 14);
    let t = 0;
    C.anims.push((dt) => {
      t += dt;
      const ph = Math.floor(t * (C.calm ? 0.7 : 3)) % 2, strobe = C.calm ? 0.6 : (t * 12) % 1 < 0.6 ? 1 : 0.3;
      red.emissiveIntensity = ph === 0 ? 3 * strobe : 0.1;
      blue.emissiveIntensity = ph === 1 ? 3 * strobe : 0.1;
      pl.color.setHex(ph === 0 ? 0xff1020 : 0x2050ff); pl.cur = 9 * strobe;
    });
  }
  return grp;
}

// Axis-aligned fence from (x0,z0) to (x1,z1)
export function fence(x0, z0, x1, z1, o = {}) {
  const h = o.h || 1.2, color = o.color || 0x1e1f22;
  const len = Math.hypot(x1 - x0, z1 - z0), alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const n = Math.max(1, Math.round(len / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    box(0.08, h, 0.08, color, x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t, { metal: 0.6, rough: 0.5 });
  }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (const y of [h * 0.35, h * 0.9]) box(alongX ? len : 0.05, 0.05, alongX ? 0.05 : len, color, cx, y, cz, { metal: 0.6, rough: 0.5, shadow: false });
  if (o.mesh !== false) {
    const net = new THREE.Mesh(new THREE.PlaneGeometry(len, h), mat(color, { opacity: 0.25, double: true }));
    net.position.set(cx, h / 2, cz); net.rotation.y = alongX ? 0 : Math.PI / 2; C.scene.add(net);
  }
  collider(x0 - 0.1, z0 - 0.1, x1 + 0.1, z1 + 0.1);
}

export function tape(points, h = 1.0) {
  const m = mat(0x000000, { emissive: 0xc9a400, ei: 0.25, rough: 0.6 });
  m.color.setHex(0xd8b400);
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    box(0.06, h + 0.05, 0.06, 0x333333, x, 0, z, { shadow: false });
    if (i === 0) continue;
    const [px, pz] = points[i - 1];
    const len = Math.hypot(x - px, z - pz);
    const t = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.01), m);
    t.position.set((x + px) / 2, h, (z + pz) / 2); t.rotation.y = -Math.atan2(z - pz, x - px);
    C.scene.add(t);
  }
}

export function marker(n, x, z) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 3), mat(0xd8b400, { emissive: 0x2a2200 }));
  m.position.set(x, 0.11, z); C.scene.add(m);
  return m;
}

// Merge static top-level meshes that share a material, per 24 m map cell.
// Cells (not one town-wide mesh) let the renderer skip everything outside the view cone,
// and let main.js stop drawing cells that are deep in the fog.
const CELL = 24;
export function staticBatch(scene) {
  const groups = new Map(), sphere = new THREE.Sphere();
  for (const o of scene.children) {
    if (!o.isMesh || o.isInstancedMesh || o.userData.dynamic) continue;
    o.updateMatrixWorld(true);
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
    // huge pieces (ground, long roads) get their own bucket so they don't inflate a cell
    const cell = sphere.radius > CELL * 0.75 ? 'big' : Math.floor(sphere.center.x / CELL) + ',' + Math.floor(sphere.center.z / CELL);
    const k = o.material.uuid + (o.castShadow ? '|s|' : '|n|') + cell;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(o);
  }
  let removed = 0;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const geos = list.map((o) => {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      g.applyMatrix4(o.matrixWorld);
      return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const m = new THREE.Mesh(merged, list[0].material);
    m.castShadow = list[0].castShadow; m.receiveShadow = true; m.renderOrder = list[0].renderOrder;
    for (const o of list) { scene.remove(o); o.geometry.dispose(); }
    scene.add(m);
    removed += list.length - 1;
  }
  return removed;
}

// Night sky as an equirectangular canvas: gradient, horizon glow, clouds, stars, moon.
// Used for the sky dome and (blurred by PMREM) as the reflection environment.
export function skyTexture(o = {}) {
  const W = 2048, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H / 2);
  grd.addColorStop(0, o.top || '#05070d'); grd.addColorStop(0.75, o.mid || '#0b1018'); grd.addColorStop(1, o.horizon || '#1a1c22');
  g.fillStyle = grd; g.fillRect(0, 0, W, H / 2);
  g.fillStyle = o.ground || '#050505'; g.fillRect(0, H / 2, W, H / 2);
  if (o.glow) { const hg = g.createLinearGradient(0, H * 0.34, 0, H * 0.52); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(1, o.glow); g.fillStyle = hg; g.fillRect(0, H * 0.34, W, H * 0.18); }
  if (o.stars) for (let i = 0; i < 900; i++) { const y = Math.random() * H * 0.42, a = Math.random() * 0.8 * (1 - y / (H * 0.45)); g.fillStyle = `rgba(220,230,255,${a})`; g.fillRect(Math.random() * W, y, Math.random() < 0.06 ? 2 : 1, 1); }
  if (o.moon) {
    const mx = W * 0.62, my = H * 0.2;
    const halo = g.createRadialGradient(mx, my, 0, mx, my, 160); halo.addColorStop(0, 'rgba(200,215,240,0.35)'); halo.addColorStop(1, 'rgba(200,215,240,0)');
    g.fillStyle = halo; g.fillRect(mx - 160, my - 160, 320, 320);
    g.fillStyle = '#e8ecf2'; g.beginPath(); g.arc(mx, my, 16, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,170,190,0.5)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(mx - 6 + Math.random() * 12, my - 6 + Math.random() * 12, 2 + Math.random() * 3, 0, 7); g.fill(); }
  }
  if (o.clouds) for (let i = 0; i < 70; i++) {
    const cx = Math.random() * W, cy = H * (0.12 + Math.random() * 0.32), rw = 120 + Math.random() * 320, rh = 18 + Math.random() * 40;
    const cg = g.createRadialGradient(cx, cy, 0, cx, cy, rw); cg.addColorStop(0, o.clouds); cg.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(cx, cy); g.scale(1, rh / rw); g.translate(-cx, -cy); g.fillStyle = cg; g.fillRect(cx - rw, cy - rw, rw * 2, rw * 2); g.restore();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// A single white lily lying on the ground (the secret collectible).
export function lily(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0.03, z); g.rotation.y = Math.random() * 6;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 5), mat(0x2a4a2a)); stem.rotation.z = Math.PI / 2; stem.position.set(0, 0.01, 0); g.add(stem);
  const petal = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, emissive: 0x2a2a28, roughness: 0.6 });
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 5), petal); p.position.set(0.24, 0.03, 0); p.rotation.set(i, 0, -Math.PI / 2 + Math.cos(i) * 0.4); g.add(p); }
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.004, 0.04), mat(0xe8e2d4)); card.position.set(0.06, 0.02, 0.03); g.add(card);
  g.userData.dynamic = true; C.scene.add(g);
  return g;
}
