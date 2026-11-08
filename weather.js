// Rain and snow particle fields that follow the camera.
import * as THREE from 'three';

export function makeSnow(count) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos.set([(Math.random() - 0.5) * 36, Math.random() * 14, (Math.random() - 0.5) * 36], i * 3); seed[i] = Math.random() * 10; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const fc = document.createElement('canvas'); fc.width = fc.height = 32; const fg = fc.getContext('2d');
  const grd = fg.createRadialGradient(16, 16, 0, 16, 16, 16); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  fg.fillStyle = grd; fg.fillRect(0, 0, 32, 32);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe6ecf2, size: 0.06, map: new THREE.CanvasTexture(fc), transparent: true, opacity: 0.9, depthWrite: false, fog: true }));
  pts.frustumCulled = false; pts.userData.seed = seed; pts.userData.snow = true;
  return pts;
}
export function makeRain(count) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 40, y = Math.random() * 20, z = (Math.random() - 0.5) * 40;
    pos.set([x, y, z, x + 0.03, y + 0.45, z], i * 6);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x8796a8, transparent: true, opacity: 0.35, fog: true }));
  lines.frustumCulled = false;
  return lines;
}
