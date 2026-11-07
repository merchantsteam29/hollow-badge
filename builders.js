// Low-poly scene builders shared by both cases.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let C = null; // { scene, colliders, lamps, lights, anims }
export function init(ctx) { C = ctx; }

const mats = new Map();
export function mat(color, o = {}) {
  const k = color + '|' + JSON.stringify(o);
  if (!mats.has(k)) {
    mats.set(k, new THREE.MeshStandardMaterial({
      color, roughness: o.rough ?? 0.92, metalness: o.metal ?? 0,
      emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1,
      transparent: o.opacity !== undefined, opacity: o.opacity ?? 1,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
    }));
  }
  return mats.get(k);
}
export function clearCache() { mats.forEach((m) => m.dispose()); mats.clear(); }

export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function collider(x0, z0, x1, z1) {
  C.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
}

function shadowy(m, cast = true) { m.castShadow = cast; m.receiveShadow = true; return m; }

// Box with its base at y.
export function box(w, h, d, color, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.material || mat(color, o));
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

export function ground(cx, cz, w, d, color) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { rough: 1 }));
  m.rotation.x = -Math.PI / 2; m.position.set(cx, 0, cz); m.receiveShadow = true;
  C.scene.add(m); return m;
}
export function flat(w, d, color, x, z, y = 0.02, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { rough: o.rough ?? 0.85, metal: o.metal ?? 0 }));
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
    : new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.95 });
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
    return mat(0x000000, { emissive: tint, ei: 0.35 + (Math.floor(r * 97) % 3) * 0.2 });
  }
  return mat(0x0b0e13, { rough: 0.25, metal: 0.6 });
}
const FACE = {
  '+x': { ry: Math.PI / 2, n: [1, 0] }, '-x': { ry: -Math.PI / 2, n: [-1, 0] },
  '+z': { ry: 0, n: [0, 1] }, '-z': { ry: Math.PI, n: [0, -1] },
};

// Axis-aligned building. sx/sz = footprint, face = side with the door.
export function house(x, z, o = {}) {
  const sx = o.sx || 7, sz = o.sz || 8, h = o.h || 5;
  const r = rng(o.seed || Math.floor(x * 13 + z * 7 + 999));
  box(sx, h, sz, o.color || 0x2b2724, x, 0, z, { collide: true });
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
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: 2.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bulbMat);
  bulb.position.set(x, 4.55, z); C.scene.add(bulb);
  box(0.5, 0.12, 0.5, 0x111214, x, 4.7, z, { shadow: false });
  const rec = light(x, 4.3, z, color, o.intensity ?? 30, o.dist ?? 19);
  Object.assign(rec, { bulbMat, flicker: !!o.flicker, on: true });
  C.lamps.push(rec);
  if (o.flicker) {
    let t = 0, next = 1 + Math.random() * 3;
    C.anims.push((dt) => {
      if (!rec.on) return;
      t += dt;
      if (t > next) { t = 0; next = 0.05 + Math.random() * (Math.random() < 0.15 ? 2.5 : 0.25); }
      const k = Math.random() < 0.12 ? 0.08 : 0.85 + Math.random() * 0.15;
      rec.cur = rec.base * k; bulbMat.emissiveIntensity = 2.2 * k;
    });
  }
  return rec;
}
export function setLamp(rec, on, k = 1) {
  if (!rec) return;
  rec.on = on;
  rec.cur = on ? rec.base * k : 0;
  rec.bulbMat.emissiveIntensity = on ? 2.2 * k : 0;
}

// Instanced forest: [{x,z,s}]
export function forest(list) {
  const n = list.length; if (!n) return;
  const trunkG = new THREE.CylinderGeometry(0.12, 0.22, 2.4, 6);
  const coneG = new THREE.ConeGeometry(1.4, 2.8, 7);
  const trunk = new THREE.InstancedMesh(trunkG, mat(0x1a120c), n);
  const tiers = [0, 1, 2].map(() => new THREE.InstancedMesh(coneG, mat(0x0a120d), n));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  list.forEach((t, i) => {
    const sc = t.s || 1;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.x * 3.1 + t.z);
    m.compose(p.set(t.x, 1.2 * sc, t.z), q, s.set(sc, sc, sc)); trunk.setMatrixAt(i, m);
    tiers.forEach((mesh, k) => {
      const ks = sc * (1 - k * 0.22);
      m.compose(p.set(t.x, (2.6 + k * 1.5) * sc, t.z), q, s.set(ks, sc, ks)); mesh.setMatrixAt(i, m);
    });
    collider(t.x - 0.3 * sc, t.z - 0.3 * sc, t.x + 0.3 * sc, t.z + 0.3 * sc);
  });
  for (const mesh of [trunk, ...tiers]) { mesh.castShadow = true; mesh.receiveShadow = true; C.scene.add(mesh); }
}

// Low-poly person. Faces +z before rotY. pose: stand | sit | lie (face down)
export function person(x, z, o = {}) {
  const outer = new THREE.Group(); outer.position.set(x, 0, z); outer.rotation.y = o.ry || 0;
  const g = new THREE.Group(); outer.add(g);
  const sc = o.scale || 1; g.scale.setScalar(sc);
  const coat = mat(o.coat ?? 0x2a2a30), pants = mat(o.pants ?? 0x1a1a1e), skin = mat(o.skin ?? 0x8a6a58), hair = mat(o.hair ?? 0x1a1410);
  const sit = o.pose === 'sit';
  const legH = 0.85;
  const mk = (w, h, d, m, px, py, pz, parent = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); shadowy(b); parent.add(b); return b; };
  if (sit) {
    mk(0.16, 0.16, 0.5, pants, -0.1, 0.5, 0.2); mk(0.16, 0.16, 0.5, pants, 0.1, 0.5, 0.2);
    mk(0.15, 0.45, 0.15, pants, -0.1, 0.22, 0.42); mk(0.15, 0.45, 0.15, pants, 0.1, 0.22, 0.42);
  } else {
    mk(0.16, legH, 0.18, pants, -0.1, legH / 2, 0); mk(0.16, legH, 0.18, pants, 0.1, legH / 2, 0);
  }
  const hip = sit ? 0.5 : legH;
  const torso = mk(0.46, 0.62, 0.26, coat, 0, hip + 0.31, 0);
  if (o.longCoat) mk(0.5, 0.5, 0.3, coat, 0, hip - 0.15, 0);
  const armL = mk(0.13, 0.6, 0.15, coat, -0.3, hip + 0.3, sit ? 0.12 : 0);
  const armR = mk(0.13, 0.6, 0.15, coat, 0.3, hip + 0.3, sit ? 0.12 : 0);
  if (sit) { armL.rotation.x = armR.rotation.x = -0.6; }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skin); head.position.set(0, hip + 0.8, 0); shadowy(head); g.add(head);
  mk(0.32, 0.12, 0.32, hair, 0, hip + 0.91, -0.02);
  if (o.longHair) mk(0.3, 0.32, 0.1, hair, 0, hip + 0.7, -0.13);
  if (o.hat) { mk(0.44, 0.03, 0.44, mat(o.hat), 0, hip + 0.93, 0); mk(0.28, 0.16, 0.28, mat(o.hat), 0, hip + 1.01, 0); }
  if (o.cap) { mk(0.3, 0.1, 0.3, mat(o.cap), 0, hip + 0.95, 0); mk(0.26, 0.03, 0.16, mat(o.cap), 0, hip + 0.91, 0.17); }
  if (o.glasses) mk(0.26, 0.04, 0.02, mat(0x0a0a0a, { metal: 0.8 }), 0, hip + 0.82, 0.15);
  if (o.collar) mk(0.14, 0.08, 0.02, mat(0xdddddd), 0, hip + 0.6, 0.135);
  if (o.cane) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6), mat(0x120c08)); c.position.set(0.38, 0.47, 0.12); g.add(c); }
  if (o.pose === 'lie') { g.rotation.x = Math.PI / 2; g.position.y = 0.14 * sc; g.position.z = -0.9 * sc; }
  C.scene.add(outer);
  if (o.collide !== false && o.pose !== 'lie') collider(x - 0.35, z - 0.35, x + 0.35, z + 0.35);
  // idle breathing / head turns
  if (o.pose !== 'lie' && o.idle !== false) {
    let t = Math.random() * 10;
    C.anims.push((dt) => {
      t += dt;
      torso.scale.y = 1 + Math.sin(t * 1.6) * 0.015;
      head.rotation.y = Math.sin(t * 0.4) * 0.35 + Math.sin(t * 1.3) * 0.05;
    });
  }
  outer.userData = { inner: g, head, torso, hip };
  return outer;
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
    const red = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff1020, emissiveIntensity: 0 });
    const blue = new THREE.MeshStandardMaterial({ color: 0, emissive: 0x1840ff, emissiveIntensity: 0 });
    box(0.6, 0.14, 0.25, 0, -0.35, 1.32, -0.2, { parent: grp, material: red, shadow: false });
    box(0.6, 0.14, 0.25, 0, 0.35, 1.32, -0.2, { parent: grp, material: blue, shadow: false });
    const pl = light(x, 1.9, z - 0.2 * Math.cos(ry), 0xff1020, 0, 14);
    let t = 0;
    C.anims.push((dt) => {
      t += dt;
      const ph = Math.floor(t * 3) % 2, strobe = (t * 12) % 1 < 0.6 ? 1 : 0.3;
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

// Merge every static top-level mesh that shares a material into one mesh.
// Cuts hundreds of draw calls (each window, fence post, tape strip...) down to a few dozen.
export function staticBatch(scene) {
  const groups = new Map();
  for (const o of scene.children) {
    if (!o.isMesh || o.isInstancedMesh || o.userData.dynamic || o.material.map) continue;
    const k = o.material.uuid + (o.castShadow ? '|s' : '|n');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(o);
  }
  let removed = 0;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const geos = list.map((o) => {
      o.updateMatrixWorld(true);
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      g.applyMatrix4(o.matrixWorld);
      return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const m = new THREE.Mesh(merged, list[0].material);
    m.castShadow = list[0].castShadow; m.receiveShadow = true; m.renderOrder = list[0].renderOrder;
    for (const o of list) { scene.remove(o); o.geometry.dispose(); }
    scene.add(m);
    removed += list.length - 1;
  }
  return removed;
}
