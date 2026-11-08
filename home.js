// THE APARTMENT: the detective's home in Ashgrove, between cases.
// Answering machine, letters from the collector under the door, and a case wall that grows as you solve cases.
import * as THREE from 'three';

// what is waiting at home depends on which cases are solved
const MSGS = [
  { after: 'cmary', who: 'mom', lines: ['MARGARET: Detective, it\'s Margaret. Margaret Rowe.', 'MARGARET: They let me see her. I wanted to say thank you. For finding him.', 'MARGARET: I don\'t know what I\'m supposed to do now. I leave the porch light on. I can\'t stop.'] },
  { after: 'wing', who: 'holt', lines: ['HOLT: Holt here. Wingintonn.', 'HOLT: Crane\'s desk had a list. I\'ve been staring at it. Your name was in fresh ink, but there was something else under it. Pencil. Erased.', 'HOLT: I think it said "as he asked." Call me.'] },
  { after: 'harrow', who: 'ruth', lines: ['RUTH: This is Ruth Harmon. The plows came through.', 'RUTH: I found something in Nell\'s mail. A card. No name. It said "She will be remembered at the table." It came before she disappeared.', 'RUTH: Someone knew. Someone knew before it happened.'] },
  { afterCount: 2, who: 'collector', lines: ['(The message is eleven seconds of breathing.)', '(Then, very softly, someone sets the receiver down.)'] },
];
const LETTERS = [
  { after: 'cmary', lines: ['Detective,', 'You found her. You were too late, but you found her, and you looked at her for a long time. I watched you do it.', 'Most people look away. That is why I chose you.', 'A friend.'] },
  { after: 'wing', lines: ['Detective,', 'Elias was a grieving man with steady hands. I only told him where the others lived, and what time it was.', 'He kept your name on his list because I asked him to. I wanted you to come.', 'A friend.'] },
  { after: 'harrow', lines: ['Detective,', 'Walt set two extra places. One was for you. One was for me. He was a good host.', 'Three towns. Three hungry men. I fed them every one.', 'Come home. I have been keeping your city warm for you.', 'The Collector.'] },
];
export const HOME_CAPTIONS = { msgs: MSGS, letters: LETTERS };

export const HOME = {
  id: 'home', num: 'HOME', title: 'Your Apartment', place: 'Ashgrove', date: 'Between cases',
  blurb: 'A two-room apartment over a laundromat. Nobody calls. Lately, someone does.',
  isHome: true,
  intro: [], fog: 0.03, rain: 0.08, spawn: { x: 1.2, z: 1.6, yaw: Math.PI * 0.85 },
  sky: { top: '#04050a', mid: '#0c1018', horizon: '#1c1e28', glow: 'rgba(90,70,60,0.5)', clouds: 'rgba(60,60,70,0.4)' },
  required: [], culprit: null, suspects: [], clues: {},
  get captions() { return {}; },
  get witnesses() { return []; },
  objective(api) {
    const r = api.results, solved = ['cmary', 'wing', 'harrow'].filter((k) => r[k] === 'solved').length;
    if (solved === 3) return 'Read the last letter. Then look at the wall.';
    return solved ? 'Check the answering machine and the mail. Look at the wall.' : 'Home. Get some sleep, if you can.';
  },
  endings: { good: { title: '', text: [] }, bad: () => ({ title: '', text: [] }) },

  build(api) {
    const { B } = api;
    const r = api.results;
    const solved = (k) => r[k] === 'solved';
    const count = ['cmary', 'wing', 'harrow'].filter(solved).length;
    // ---- the room: 7 x 6, inside faces only ----
    const room = new THREE.Mesh(new THREE.BoxGeometry(7, 2.8, 6), new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.9, side: THREE.BackSide }));
    room.position.set(0, 1.4, 0); room.receiveShadow = true; room.userData.dynamic = true; room.userData.noCull = true; api.scene.add(room);
    B.flat(7, 6, 0x2a2018, 0, 0, 0.005, { map: 'planks', rough: 0.7 });
    B.collider(-3.6, -3.1, 3.6, -3.0); B.collider(-3.6, 3.0, 3.6, 3.1); B.collider(-3.6, -3.1, -3.5, 3.1); B.collider(3.5, -3.1, 3.6, 3.1);
    // window on the -z wall, with the city behind it
    B.decal((g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#05070c'); grd.addColorStop(0.6, '#141824'); grd.addColorStop(1, '#2a2018'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { const bx = Math.random() * w, bw = 20 + Math.random() * 60, bh = 60 + Math.random() * 200; g.fillStyle = '#07080c'; g.fillRect(bx, h - bh, bw, bh); for (let k = 0; k < 18; k++) if (Math.random() < 0.35) { g.fillStyle = Math.random() < 0.8 ? 'rgba(255,200,120,0.85)' : 'rgba(160,200,255,0.8)'; g.fillRect(bx + 3 + Math.random() * (bw - 8), h - bh + 6 + Math.random() * (bh - 12), 3, 4); } }
      g.fillStyle = '#1a1410'; g.fillRect(w / 2 - 4, 0, 8, h); g.fillRect(0, h / 2 - 4, w, 8);
      g.strokeStyle = '#1a1410'; g.lineWidth = 16; g.strokeRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { g.strokeStyle = 'rgba(200,210,230,0.18)'; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); g.lineTo(x + 2, y + 18 + Math.random() * 20); g.stroke(); }
    }, 1.8, 1.4, 0.8, 1.6, -2.98, { ry: 0, glow: true, res: 512 });
    B.light(0.8, 1.6, -2.4, 0x8aa0c8, 2.5, 5);
    // desk + lamp + answering machine
    B.box(1.6, 0.06, 0.7, 0x3a2416, -2.5, 0.74, -2.3, { collide: true });
    for (const [lx, lz] of [[-3.2, -2.6], [-1.8, -2.6], [-3.2, -2.0], [-1.8, -2.0]]) B.box(0.05, 0.74, 0.05, 0x2a1a10, lx, 0, lz);
    B.cyl(0.07, 0.1, 0.4, 0x2a2a2a, -3.0, 0.8, -2.45, { metal: 0.6 });
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x5a4a30, side: THREE.DoubleSide })); lampShade.position.set(-3.0, 1.3, -2.45); api.scene.add(lampShade);
    B.light(-3.0, 1.2, -2.3, 0xffc890, 5, 6);
    B.box(0.32, 0.08, 0.22, 0x1a1a1a, -2.2, 0.8, -2.25, { metal: 0.4 }); // answering machine
    const blinkMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
    const blink = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), blinkMat); blink.position.set(-2.1, 0.9, -2.14); api.scene.add(blink);
    B.box(0.3, 0.32, 0.1, 0x2a3a2a, -2.6, 0.8, -2.45, { rough: 0.3 }); // whiskey bottle-ish
    // bed, chair, kitchenette
    B.box(1.4, 0.45, 2.1, 0x2a2a34, 2.6, 0, -1.8, { collide: true }); B.box(1.4, 0.15, 0.5, 0xd8d2c4, 2.6, 0.45, -2.6);
    B.box(0.5, 0.45, 0.5, 0x3a2416, -1.6, 0, -1.6, { collide: true });
    B.box(2.2, 0.9, 0.6, 0x4a4844, 2.3, 0, 2.6, { collide: true, metal: 0.3 }); B.box(0.5, 0.02, 0.4, 0x8a8a8a, 2.0, 0.9, 2.6, { metal: 0.8 });
    // the door (+x wall... on the +z wall at x=-2) with mail under it
    B.box(1.0, 2.1, 0.08, 0x2a1c12, -2.2, 0, 2.97);
    B.box(0.04, 0.04, 0.12, 0x9a8a60, -1.8, 1.0, 2.9, { metal: 0.9 });
    const letters = LETTERS.filter((l) => solved(l.after));
    letters.forEach((l, i) => B.box(0.24, 0.005, 0.16, 0xe8e2d4, -2.3 + i * 0.12, 0, 2.6 - i * 0.05, { ry: 0.3 * i }));
    // the case wall (+x wall)
    const wallX = 3.47;
    B.box(0.04, 1.4, 2.4, 0x6a4a2a, wallX, 0.9, 0.4); // cork
    const cards = [['cmary', 'THE ROWE GIRL', 'Gary Voss'], ['wing', 'THE TALLYMAN', 'Elias Crane'], ['harrow', 'THE LONG WINTER', 'Walter Ebner']];
    cards.forEach(([k, title, who], i) => {
      const z = -0.5 + i * 0.9, done = solved(k);
      B.decal((g, w, h) => { g.fillStyle = done ? '#a49c8a' : '#4a3a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2018'; g.font = `${h * 0.12}px "Special Elite", monospace`; g.textAlign = 'center'; g.fillText(done ? title : '?', w / 2, h * 0.22); if (done) { g.fillStyle = '#3a3a3a'; g.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.42); g.fillStyle = '#2a2018'; g.font = `${h * 0.1}px "Special Elite", monospace`; g.fillText(who, w / 2, h * 0.88); g.strokeStyle = '#a01818'; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.15, h * 0.28); g.lineTo(w * 0.85, h * 0.78); g.stroke(); } }, 0.6, 0.75, wallX - 0.03, 1.65, z, { ry: -Math.PI / 2, res: 256 });
    });
    // the threads: a fourth card in the middle, joined by red string, once you have solved two
    if (count >= 2) {
      B.decal((g, w, h) => { g.fillStyle = '#9c9482'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a0a0a'; g.font = `${h * 0.4}px "Special Elite", monospace`; g.textAlign = 'center'; g.fillText('?', w / 2, h * 0.65); }, 0.4, 0.45, wallX - 0.035, 1.05, 0.4, { ry: -Math.PI / 2, res: 128 });
      const sMat = new THREE.MeshBasicMaterial({ color: 0x9a1010 });
      for (let i = 0; i < 3; i++) { if (!solved(cards[i][0])) continue; const a = new THREE.Vector3(wallX - 0.04, 1.65, -0.5 + i * 0.9), b = new THREE.Vector3(wallX - 0.04, 1.05, 0.4); const len = a.distanceTo(b); const st = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, len), sMat); st.position.copy(a).add(b).multiplyScalar(0.5); st.lookAt(b); st.userData.dynamic = true; api.scene.add(st); }
    }

    // ---- interactions ----
    const pending = MSGS.filter((m) => (m.after ? solved(m.after) : count >= m.afterCount));
    let heard = false;
    api.anims.push(() => { blinkMat.color.setRGB(pending.length && !heard && Math.floor(performance.now() / 500) % 2 ? 1 : 0.15, 0.05, 0.05); });
    api.interact({ pos: [-2.2, 0.9, -2.2], radius: 2, label: () => (pending.length ? `Play messages (${pending.length})` : 'Answering machine (no messages)'),
      use: () => {
        if (!pending.length) { api.inspect({ title: 'Answering machine', text: ['No new messages.', 'There never are.'] }); return; }
        heard = true;
        const lines = [], vo = [];
        pending.forEach((m) => { lines.push('BEEP.'); vo.push(null); m.lines.forEach((t, i) => { lines.push(t); vo.push(`home.msg.${MSGS.indexOf(m)}.${i}`); }); });
        let i = 0;
        const next = () => { if (i >= lines.length) return; const t = lines[i], v = vo[i]; i++; api.caption(t.replace(/^[A-Z]+:\s*/, ''), v, 3800); if (t === 'BEEP.') api.sound.tone(1000, 0.25, 0.08); setTimeout(next, t === 'BEEP.' ? 900 : 4000); };
        next();
      } });
    api.interact({ pos: [-2.2, 0.3, 2.5], radius: 2, label: () => (letters.length ? `Read the mail (${letters.length})` : 'The mat by the door'),
      use: () => {
        if (!letters.length) { api.inspect({ title: 'The door', text: ['Bills. A takeout menu. Nothing anyone wrote by hand.'] }); return; }
        const L = letters[letters.length - 1];
        api.inspect({ title: letters.length > 1 ? `Letters (${letters.length}). The newest:` : 'A letter, slid under the door', text: L.lines,
          onClose: () => { api.flags.readLetter = true; LETTERS.forEach((x, k) => { if (x === L) api.voice(`home.letter.${k}.0`); }); } });
      } });
    api.interact({ pos: [2.9, 1.4, 0.4], radius: 2.4, label: 'Look at the case wall',
      use: () => {
        const text = [];
        if (!count) text.push('An empty corkboard. A box of pins. A spool of red string you bought for a case you never caught.');
        else {
          if (solved('cmary')) text.push('THE ROWE GIRL. Gary Voss. Lily Rowe, eleven. On Harrow Falls\'s notice board, someone pinned a fourth missing poster, blank, as if waiting for a name.');
          if (solved('wing')) text.push('THE TALLYMAN. Elias Crane. A list of names in his desk. Yours in fresh ink. Something erased under it.');
          if (solved('harrow')) text.push('THE LONG WINTER. Walter Ebner. A table set for five. Two blank place cards.');
          if (count >= 2) text.push('The red string keeps finding the same empty space in the middle of the board. Someone was in every one of these cases. Someone who was never a suspect.');
          if (count === 3) text.push('Three towns. Three killers. One friend. He is in Ashgrove now. He is in your city.');
        }
        api.inspect({ title: 'The case wall', text });
      } });
    api.interact({ pos: [0.8, 1.5, -2.6], radius: 2, label: 'Look out of the window', use: () => api.inspect({ title: 'Ashgrove', text: ['Rain on the glass. The laundromat sign downstairs buzzing pink. A man across the street under an umbrella, not moving.', 'When you look again, the street is empty.'] }) });
    api.interact({ pos: [-2.2, 1.3, 2.7], radius: 1.8, label: 'Leave (case files)', use: () => api.toMenu() });
    api.ambience({ zone: () => 'town' });
  },
};
