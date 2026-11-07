// Case data + level builders. Each case: story, clues, suspects, witnesses, build(api).
import * as THREE from 'three';

/* ============================================================
   CASE 1 — CMARY TOWN — SEPTEMBER 9TH
   ============================================================ */
const CMARY = {
  id: 'cmary',
  num: 'CASE 01',
  title: 'The Rowe Girl',
  place: 'Cmary Town',
  date: 'September 9th',
  blurb: 'Lily Rowe, 11, never came home from school. The search was called off at ten. You were not.',
  intro: [
    'CMARY TOWN',
    'SEPTEMBER 9TH — 11:52 PM',
    'Lily Rowe, eleven years old, left Cmary Elementary at 3:40 this afternoon.',
    'She never walked through her front door.',
    'The volunteers went home when the rain got bad.',
    'You are the only one still looking.',
  ],
  fog: 0.05, rain: 0.16, spawn: { x: 1.6, z: 24, yaw: 0 },
  required: ['print', 'van', 'jacket', 'body'],
  culprit: 'voss',
  clues: {
    mom_time: { type: 'statement', title: 'Margaret Rowe — timeline', text: 'Last saw Lily at 7:50 AM. Lily should have been home by 3:50 PM. Margaret got home at 5:00 to an empty house.' },
    mom_ribbon: { type: 'statement', title: 'Margaret Rowe — clothing', text: 'Yellow raincoat. Purple backpack with a cat keychain. A red hair ribbon she ties herself, always crooked.' },
    rick_alibi: { type: 'statement', title: 'Margaret Rowe — Rick Hollins', text: 'Rick and Lily fight. But Rick was at the sawmill until 6 PM with twelve men.' },
    mom_van: { type: 'statement', title: 'Margaret Rowe — the van', text: 'A grey van was on their street twice last week. She thought it was a contractor.' },
    walter_saw: { type: 'statement', title: 'Walter Pike — sighting', text: 'Saw Lily go through the playground gate at 3:45. She waved at him.' },
    van: { type: 'statement', title: 'Walter Pike — grey van', text: 'A grey van idled by the playground fence. Dent in the sliding door. No front plate. When the bus pulled away, the van and Lily were gone.' },
    shop_buy: { type: 'statement', title: 'Denise — the purchase', text: 'At 8 AM a man bought duct tape, zip ties and garbage bags. Cash. Never looked up.' },
    jacket: { type: 'statement', title: 'Denise — the jacket', text: 'Green work jacket, "PRUETT HARDWARE" stitched on the back. Not Dale Pruett: younger, thirties. He left in a grey van.' },
    gary: { type: 'statement', title: 'Denise — Pruett staff', text: 'Pruett Hardware has Dale and one stockman: Gary. Moved here two years ago. Keeps to himself.' },
    backpack: { type: 'evidence', title: "Lily's backpack", text: 'Purple, half under the slide. Zipper torn open. The cat keychain has been snapped off. A worksheet inside: LILY R. in careful pencil.' },
    print: { type: 'evidence', title: 'Latent print — gate latch', text: 'Partial print lifted from under the gate latch cover. AFIS returns two possible matches: G. VOSS (2011 assault) and R. HOLLINS (2019 DUI booking).' },
    tracks: { type: 'evidence', title: 'Tire tracks — logging road', text: 'Wide wheelbase, worn tread. A van. Fresh: the rain has not softened the edges yet.' },
    ribbon: { type: 'evidence', title: 'Red ribbon', text: 'Snagged on a branch a meter off the ground, tied crooked. It points away from the road, toward a shed in the trees.' },
    body: { type: 'evidence', title: 'Lily Rowe', text: 'Found in the old woodcutter\'s shed off the logging road. Face down. She had been dead for hours.' },
    knife: { type: 'evidence', title: 'The knife', text: 'Hunting knife, black handle. Stamped near the guard: PRUETT HARDWARE — INV 0412. Store stock, never sold.' },
  },
  suspects: [
    { id: 'voss', name: 'Gary Voss', role: 'Stockman, Pruett Hardware · 38', notes: [
      { t: 'Moved to Cmary Town two years ago. Lives alone in a trailer off the logging road.' },
      { t: 'Drives a grey van. Dent in the sliding door.', req: 'van' },
      { t: 'Wears the store\'s green work jacket.', req: 'jacket' },
      { t: 'AFIS possible on the gate print. Prior: 2011 assault.', req: 'print' },
      { t: 'Does the store\'s stocktake. The knife was store inventory.', req: 'knife' },
    ] },
    { id: 'hollins', name: 'Rick Hollins', role: "Mother's boyfriend · 41", notes: [
      { t: 'Argues with Lily. She told a teacher she hated him.' },
      { t: 'At the sawmill until 6 PM. Twelve witnesses.', req: 'rick_alibi' },
      { t: 'AFIS possible on the gate print (2019 DUI). He lives with her; his prints could be anywhere she goes.', req: 'print' },
      { t: 'Drives a blue sedan. No van.', req: 'van' },
    ] },
    { id: 'pruett', name: 'Dale Pruett', role: 'Owner, Pruett Hardware · 64', notes: [
      { t: 'Owns the store the jacket came from.' },
      { t: 'Clerk is certain the buyer was not Dale: too young.', req: 'jacket' },
      { t: 'Drives a red pickup. Bad hip.', req: 'van' },
      { t: 'The knife is his stock.', req: 'knife' },
    ] },
  ],
  objective(api) {
    const h = (id) => api.has(id);
    if (!api.flags.reyes) return 'Talk to Officer Reyes by your car.';
    if (!h('mom_time') && !h('mom_ribbon')) return "Speak to Lily's mother, Margaret Rowe, on her porch.";
    if (!h('backpack') || !h('print')) return 'Search the playground where Lily was last seen. Dust the gate.';
    if (!h('van')) return 'Someone was watching the playground this afternoon. Try the bus stop.';
    if (!h('jacket')) return 'Ask at the corner shop. It was open all day.';
    if (!h('body')) return h('ribbon') ? 'Follow where the ribbon points.' : 'Follow the old logging road into the woods.';
    return 'Return to your car. Use the case board to name who did this.';
  },
  endings: {
    good: {
      title: 'CASE CLOSED',
      text: [
        'Gary Voss is arrested at 4:10 AM in his trailer off the logging road.',
        'In the back of the grey van: zip ties, half a roll of duct tape, and a cat keychain snapped off a purple backpack.',
        'He never says why.',
        "At dawn you stand outside the Rowe house. Margaret's porch light is still on. Nobody turns it off for a long time.",
        'You found who did it. You did not find her in time.',
        'Some cases close. They never end.',
      ],
    },
    bad: (s) => ({
      title: 'WRONG MAN',
      text: [
        `You charge ${s.name}.`,
        'The case falls apart in eleven days. By then Gary Voss has sold a grey van for cash and left Cmary Town.',
        'Margaret Rowe moves away the next spring.',
        'You still drive past the playground some nights. You still look at every grey van.',
      ],
    }),
  },

  build(api) {
    const { B } = api;
    const r = B.rng(9);
    // ground, road, sidewalks
    B.ground(0, -22, 80, 120, 0x0c0f0c);
    B.flat(8, 70, 0x131416, 0, -3, 0.02, { rough: 0.35, metal: 0.2 });
    for (let z = 30; z > -38; z -= 4) B.flat(0.14, 1.8, 0x4d4a38, 0, z, 0.03);
    B.flat(2.4, 70, 0x232427, -5.2, -3, 0.04); B.flat(2.4, 70, 0x232427, 5.2, -3, 0.04);
    B.flat(4.5, 40, 0x18130e, 0, -57, 0.025);
    // puddles
    for (let i = 0; i < 14; i++) B.flat(0.8 + r() * 1.6, 0.6 + r() * 1.2, 0x0a0c10, (r() - 0.5) * 7, 28 - r() * 62, 0.035, { rough: 0.05, metal: 0.9 });

    // bounds
    B.collider(-29, -80, -28, 34); B.collider(28, -80, 29, 34);
    B.collider(-29, 33, 29, 34); B.collider(-29, -80, 29, -77);

    // houses
    B.house(-12.5, 18, { sx: 7, sz: 8, face: '+x', color: 0x2b2a26, lit: 0.2 });
    const rowe = B.house(-12.5, 5, { sx: 7, sz: 9, face: '+x', color: 0x34302a, lit: 0.85, porchLight: true });
    B.house(12.5, 18, { sx: 7, sz: 8, face: '-x', color: 0x272a2b, lit: 0.15 });
    B.house(12.5, 5, { sx: 7, sz: 8, face: '-x', color: 0x2e2825, lit: 0.1 });
    B.house(13, -29, { sx: 7, sz: 8, face: '-x', color: 0x221f1c, boarded: true });
    B.house(-20, 18, { sx: 6, sz: 7, face: '+x', color: 0x23211f, lit: 0.05 });
    B.house(20, 6, { sx: 6, sz: 7, face: '-x', color: 0x23211f, lit: 0.05 });
    // corner shop
    const shop = B.house(13, -16, { sx: 8, sz: 10, h: 4, face: '-x', color: 0x2a2d2f, lit: 1, roof: false });
    B.box(1.6, 0.1, 8, 0x3a1414, 8.4, 3.2, -16, { shadow: false });
    B.signText('CMARY GROCERY', 5, 0.8, 8.95, 3.7, -16, -Math.PI / 2, { color: '#ff6a4a', shadow: true });
    B.signText('OPEN', 1, 0.4, 8.94, 2.2, -18, -Math.PI / 2, { color: '#ff3355', shadow: true, size: 0.7 });
    const shopLight = new THREE.PointLight(0xffe2b0, 10, 10, 1.6); shopLight.position.set(7.5, 2.5, -16); api.scene.add(shopLight);

    // bus stop
    B.box(3, 0.08, 1.4, 0x1a1c1f, 6.8, 2.4, -4);
    B.box(0.06, 2.4, 1.4, 0x1a1c1f, 8.3, 0, -4, { collide: true });
    B.box(2.6, 0.1, 0.5, 0x2a2018, 7.2, 0.5, -3.7);
    B.box(0.3, 2.2, 0.05, 0x2b3a4a, 5.6, 0, -4.8);
    B.signText('BUS', 0.5, 0.25, 5.6, 2.0, -4.77, 0, { color: '#cfe4ff', size: 0.8 });

    // lamps
    B.lamp(5.4, 20); B.lamp(-5.4, 8); B.lamp(5.4, -6); B.lamp(-5.4, -22, { flicker: true }); B.lamp(5.4, -30, { intensity: 20 });

    // playground: fence x=-7 (gate gap z -20..-18.4), z=-10, z=-30, x=-24
    B.fence(-7, -10, -7, -18.4); B.fence(-7, -20, -7, -30);
    B.fence(-24, -10, -7, -10); B.fence(-24, -30, -7, -30); B.fence(-24, -30, -24, -10);
    const gate = new THREE.Group(); gate.position.set(-7, 0, -18.4); api.scene.add(gate);
    B.box(0.06, 1.2, 1.5, 0x26282b, 0, 0, -0.75, { parent: gate, metal: 0.6, rough: 0.5 });
    B.box(0.12, 0.1, 0.12, 0x5a5a5a, 0, 0.95, -1.45, { parent: gate, metal: 0.9, rough: 0.3 });
    gate.rotation.y = -0.9; // left open
    B.flat(16, 19, 0x14110d, -15.5, -20, 0.03);
    // swings
    for (const sx of [-17.5, -14]) { B.box(0.1, 2.6, 0.1, 0x2a2c30, sx, 0, -14.5); B.box(0.1, 2.6, 0.1, 0x2a2c30, sx, 0, -16.5); }
    B.box(0.1, 0.1, 2.1, 0x2a2c30, -17.5, 2.6, -15.5); B.box(0.1, 0.1, 2.1, 0x2a2c30, -14, 2.6, -15.5);
    B.box(3.6, 0.1, 0.1, 0x2a2c30, -15.75, 2.6, -15.5);
    const swings = [];
    for (const sx of [-16.6, -15]) {
      const sw = new THREE.Group(); sw.position.set(sx, 2.6, -15.5); api.scene.add(sw);
      B.box(0.02, 2.1, 0.02, 0x555555, -0.25, -2.1, 0, { parent: sw, shadow: false });
      B.box(0.02, 2.1, 0.02, 0x555555, 0.25, -2.1, 0, { parent: sw, shadow: false });
      B.box(0.6, 0.05, 0.25, 0x3a1a1a, 0, -2.15, 0, { parent: sw });
      swings.push(sw);
    }
    let st = 0; api.anims.push((dt) => { st += dt; swings[0].rotation.x = Math.sin(st * 1.1) * 0.12; swings[1].rotation.x = Math.sin(st * 0.9 + 2) * 0.05; });
    // slide
    B.box(1.2, 1.8, 1.2, 0x2f1d1a, -20, 0, -24, { collide: true });
    const slide = B.box(0.9, 0.08, 3.4, 0x3d3d44, -20, 0.9, -21.6, { metal: 0.6 }); slide.rotation.x = -0.52;
    B.box(1.8, 0.45, 0.4, 0x2a2018, -11, 0, -27, { collide: true }); // bench
    B.decal((g, w, h) => { g.fillStyle = '#e6e0d0'; g.font = `${h * 0.28}px "Special Elite", monospace`; g.textAlign = 'center'; g.fillText('MISSING', w / 2, h * 0.24); g.font = `${h * 0.12}px "Special Elite", monospace`; g.fillText('LILY ROWE · AGE 11', w / 2, h * 0.5); g.fillText('YELLOW RAINCOAT', w / 2, h * 0.66); g.fillText('CALL 555-0199', w / 2, h * 0.86); }, 0.6, 0.8, 5.52, 1.6, -6.1, { ry: -Math.PI / 2, res: 256 });

    // backpack
    const bp = B.box(0.4, 0.45, 0.22, 0x3a2350, -19.2, 0, -21, { ry: 0.6 });
    B.box(0.3, 0.06, 0.25, 0x2a1a3a, -19.2, 0.45, -21, { ry: 0.6 });

    // woods (avoid track + shed clearing + ribbon tree)
    const trees = [];
    for (let i = 0; i < 260; i++) {
      const x = -27 + r() * 54, z = -34 - r() * 42;
      if (Math.abs(x) < 3.4) continue;
      if (Math.hypot(x + 11, z + 62) < 5.5) continue;
      if (Math.hypot(x + 6, z + 51) < 1.6) continue;
      if (Math.hypot(x + 7.5, z + 56.5) < 2.2) continue;
      if (x > -9.5 && x < -3 && z > -64.5 && z < -58.5) continue;
      if (x > -7.5 && x < -3 && z > -53 && z < -48) continue;
      trees.push({ x, z, s: 0.8 + r() * 0.7 });
    }
    for (let i = 0; i < 50; i++) { const side = r() < 0.5 ? -1 : 1; trees.push({ x: side * (22 + r() * 5), z: 30 - r() * 64, s: 0.8 + r() * 0.6 }); }
    trees.push({ x: -6, z: -51, s: 0.9 });
    B.forest(trees);

    // tire tracks
    for (const tx of [-0.85, 0.85]) {
      B.decal((g, w, h) => { g.fillStyle = 'rgba(5,4,3,0.85)'; for (let y = 0; y < h; y += 10) g.fillRect(4, y, w - 8, 5); }, 0.35, 9, tx, 0.04, -44, { floor: true, res: 64 });
    }
    // ribbon
    const rib = B.box(0.18, 0.04, 0.06, 0x8a0f12, -6.2, 1.35, -50.7, { emissive: 0x220000 });
    B.box(0.04, 0.3, 0.04, 0x8a0f12, -6.2, 1.05, -50.7, { emissive: 0x220000 });

    // shed (hollow, door on +x)
    const sx = -11, sz = -62, W = 4, D = 3.6, H = 2.6, plank = 0x2a2018;
    B.box(0.12, H, D, plank, sx - W / 2, 0, sz);
    B.box(W, H, 0.12, plank, sx, 0, sz - D / 2); B.box(W, H, 0.12, plank, sx, 0, sz + D / 2);
    B.box(0.12, H, 1.1, plank, sx + W / 2, 0, sz - 1.25); B.box(0.12, H, 1.1, plank, sx + W / 2, 0, sz + 1.25);
    B.box(0.12, 0.6, 1.4, plank, sx + W / 2, 2.0, sz);
    const roof = B.box(W + 0.6, 0.12, D + 0.6, 0x15110d, sx, H, sz); roof.rotation.z = 0.08;
    B.collider(sx - W / 2 - 0.1, sz - D / 2 - 0.1, sx + W / 2 + 0.1, sz + D / 2 + 0.1);
    const door = new THREE.Group(); door.position.set(sx + W / 2 + 0.03, 0, sz + 0.7); api.scene.add(door);
    B.box(0.08, 2.0, 1.4, 0x22180f, 0, 0, -0.7, { parent: door });
    B.box(0.05, 0.25, 0.1, 0x777777, 0.05, 1.0, -1.25, { parent: door, metal: 0.9 });
    // inside: Lily
    const lily = B.person(sx - 0.4, sz, { scale: 0.72, ry: -Math.PI / 2, pose: 'lie', coat: 0x8f7a26, pants: 0x262a3a, hair: 0x3a2414, longHair: true, skin: 0x8f7766 });
    const inner = lily.userData.inner;
    B.box(0.05, 0.05, 0.24, 0x0e0a08, 0.06, 1.12, -0.25, { parent: inner });
    B.box(0.14, 0.03, 0.03, 0x666666, 0.06, 1.12, -0.17, { parent: inner, metal: 0.9, rough: 0.3 });
    B.box(0.12, 0.02, 0.05, 0x8a0f12, 0.04, 1.78, -0.12, { parent: inner }); // ribbon on hair
    B.box(1.2, 0.5, 0.5, 0x1a1410, sx - 1.3, 0, sz - 1.4); // woodpile

    // police car + officer
    B.car(-1.6, 25, { police: true, ry: 0 });
    B.car(-3.0, 9, { color: 0x1e2a3a, ry: Math.PI });
    const reyes = B.person(-3.6, 21.6, { coat: 0x15192a, pants: 0x101320, cap: 0x101320, skin: 0x7a5844, ry: B.faceTo(-3.6, 21.6, 1, 22) });
    const mom = B.person(rowe.doorPos.x - 0.6, rowe.doorPos.z, { coat: 0x3a2e2a, pants: 0x202024, hair: 0x2a1c14, longHair: true, skin: 0x9a7a66, ry: Math.PI / 2 });
    const walter = B.person(7.2, -3.6, { pose: 'sit', coat: 0x2e2a22, pants: 0x1c1a18, hat: 0x1b1a18, skin: 0x8a6c5a, ry: -Math.PI / 2 });
    const denise = B.person(8.0, -14.2, { coat: 0x2a1818, pants: 0x18181c, hair: 0x5a3a20, longHair: true, skin: 0x9a7a66, ry: -Math.PI / 2 });

    // ---------- interactions ----------
    api.interact({ pos: [-3.6, 1.5, 21.6], label: 'Talk to Officer Reyes', use: () => api.talk(W_REYES) });
    api.interact({ pos: [-1.6, 1.2, 25], radius: 3, label: 'Case board (car)', use: () => api.board() });
    api.interact({ pos: [mom.position.x, 1.5, mom.position.z], label: 'Talk to Margaret Rowe', use: () => api.talk(W_MOM) });
    api.interact({ pos: [7.2, 1.2, -3.6], label: 'Talk to Walter Pike', use: () => api.talk(W_WALTER) });
    api.interact({ pos: [8.0, 1.5, -14.2], label: 'Talk to Denise', use: () => api.talk(W_DENISE) });
    api.interact({ pos: [5.3, 1.6, -6.1], radius: 2, label: 'Read missing poster', use: () => api.inspect({ title: 'Missing poster', text: ['Printed this evening. The ink has already started to run in the rain.', 'MISSING — LILY ROWE — AGE 11. Brown hair, yellow raincoat. Last seen 3:45 PM near Cmary Park.', 'Someone has drawn a small heart in the corner in marker.'] }) });
    api.interact({ pos: [-19.2, 0.3, -21], glint: true, label: 'Examine backpack', cond: () => !api.has('backpack'), use: () => { api.sound.page(); api.inspect({ title: "Lily's backpack", text: ['Purple canvas, half pushed under the slide. The search team walked right past it in the dark.', 'The zipper is torn open. The cat keychain Margaret mentioned is gone. Only the snapped ring is left.', 'Inside: a lunchbox, untouched. A spelling worksheet. LILY R. in careful pencil.'], onClose: () => api.give('backpack') }); } });
    api.interact({ pos: [-7, 1.0, -19.6], radius: 2, glint: true, label: 'Examine gate latch', cond: () => !api.has('print'), use: () => api.inspect({ title: 'Playground gate', text: ['The gate is hanging open. Lily always closed it behind her.', 'Under the latch cover the metal is dry. Smooth, cold, a perfect surface.'], actions: [{ label: 'Dust for prints', fn: () => api.print({ seed: 41, surface: 'painted steel' }, () => api.give('print')) }] }) });
    api.interact({ pos: [0, 0.3, -44], radius: 2.6, glint: true, label: 'Examine tire tracks', cond: () => !api.has('tracks'), use: () => api.inspect({ title: 'Tire tracks', text: ['Two lines pressed deep into the mud of the old logging road. Wide wheelbase. Van, not a car.', 'They are fresh. The rain has not softened the edges yet.', 'They go deeper into the woods. They do not come back the same way.'], onClose: () => api.give('tracks') }) });
    api.interact({ pos: [-6.2, 1.3, -50.7], radius: 2.2, glint: true, label: 'Examine something red', cond: () => !api.has('ribbon'), use: () => { rib.visible = false; api.inspect({ title: 'A red ribbon', text: ['Snagged on a branch about a meter off the ground.', api.has('mom_ribbon') ? "Tied crooked. Margaret said she ties it herself. It's always crooked." : 'Tied crooked, by small hands.', 'Beyond it, between the trees, a dark shape. A shed.'], onClose: () => api.give('ribbon') }); } });
    api.interact({
      pos: [sx + W / 2 + 0.4, 1.2, sz], radius: 2.6, label: 'Open the shed door', cond: () => !api.has('body'),
      use: () => {
        api.sound.door();
        let t = 0; api.anims.push((dt) => { if (t < 1) { t = Math.min(1, t + dt * 0.5); door.rotation.y = -t * 1.9; } });
        api.flash(true);
        api.cutscene([
          { pos: [sx + W / 2 + 1.6, 1.7, sz + 0.4], look: [sx + W / 2, 1.2, sz], dur: 2.2, text: 'The padlock has been cut.' },
          { pos: [sx + W / 2 + 0.3, 1.55, sz + 0.1], look: [sx - 0.6, 0.2, sz], dur: 3.5, text: '', onStart: () => api.sound.stinger() },
          { pos: [sx + W / 2 - 0.2, 1.35, sz + 0.05], look: [sx - 0.7, 0.15, sz], dur: 4, text: 'A yellow raincoat.' },
          { hold: 3.5, text: 'Lily Rowe. Eleven years old.', onStart: () => api.sound.heartbeat(7) },
          { hold: 3.5, text: 'The knife is still in her back.' },
          { hold: 4, text: 'She was gone long before you got here.' },
        ], () => {
          api.give('body');
          api.inspect({ title: 'The knife', text: ['You do not touch her. You wait for the coroner, and you look at the knife until you can stand to read it.', 'A hunting knife. Black handle. Stamped near the guard: PRUETT HARDWARE — INV 0412.', 'Store stock. Never sold.'], onClose: () => api.give('knife') });
        });
      },
    });
    api.ambience({ zone: (p) => (p.z < -36 ? 'woods' : 'town') });
  },
};

const W_REYES = {
  id: 'reyes', name: 'Officer Dana Reyes',
  intro: ['Detective. Thank God.', 'Lily Rowe. Eleven. Left Cmary Elementary at 3:40. Never came in the door.'],
  topics: [
    { q: 'Where do I start?', a: ["Her mother's on the porch. Second house on the left. Margaret.", 'The kid always cut through the playground. Search team swept it at dusk, but... they were looking for a girl. Not evidence.'], then: (api) => { api.flags.reyes = true; } },
    { q: 'What about the search?', a: ['Volunteers walked the woods till the rain got bad. Called off at ten.', "Nobody went as far as the old logging road. It's dark out there, Detective. Really dark."], then: (api) => { api.flags.reyes = true; } },
    { q: 'Anything else?', a: ['Bus stop on the right. Old Walter sits there every day. And the grocery was open till eleven.', 'Use the board in my car when you know something. I\'ll call it in.'], then: (api) => { api.flags.reyes = true; } },
  ],
};
const W_MOM = {
  id: 'mom', name: 'Margaret Rowe',
  intro: ['Are you the detective? Have they found her?', "She's eleven. She's afraid of the dark. She sleeps with the hall light on."],
  topics: [
    { q: 'When did you last see her?', a: ['This morning. 7:50. She forgot her lunch and I ran it out to her.', 'She should have been home by ten to four. I was at work. I got home at five and the house was... quiet.'], gives: 'mom_time' },
    { q: 'What was she wearing?', a: ['Her yellow raincoat. Purple backpack with a cat keychain.', 'And a red ribbon. She ties it herself. It\'s always crooked. I never fix it.'], gives: 'mom_ribbon' },
    { q: 'Would anyone want to hurt her?', a: ["Rick. My boyfriend. They fight. She says he's not her dad. He isn't.", 'But Rick was at the mill until six. Twelve men saw him.', "Please. Please don't waste time on Rick."], gives: 'rick_alibi' },
    { q: 'Anyone new around lately?', a: ['There was a van. Grey, I think. I saw it on our street twice last week. I thought it was a contractor.', '...God. I thought it was a contractor.'], gives: 'mom_van' },
  ],
};
const W_WALTER = {
  id: 'walter', name: 'Walter Pike',
  intro: ["Can't sleep. Not with this.", 'I sit here every afternoon. Waiting for nobody, mostly.'],
  topics: [
    { q: 'Did you see Lily today?', a: ['The little one in the yellow coat? Yes. Quarter to four. She went through the playground gate, same as always.', 'She waved at me. She always waves.'], gives: 'walter_saw' },
    { q: 'Were there any vehicles?', req: 'walter_saw', a: ['A grey van. Pulled up along the playground fence. Engine running.', 'Dent in the sliding door, like somebody backed into a post. No front plate.', 'Then the 3:50 bus pulled in and blocked my view. When it left, the van was gone.', 'So was she. I didn\'t think anything of it. I didn\'t think.'], gives: 'van' },
    { q: 'Did you see the driver?', req: 'van', a: ['Cap pulled low. Big shoulders. Never got out while I watched.', 'Green jacket. Work jacket.'] },
  ],
};
const W_DENISE = {
  id: 'denise', name: 'Denise (grocery clerk)',
  intro: ['I told the other officer everything. I was closing up. I can\'t stop shaking.', 'Ask.'],
  topics: [
    { q: 'Anything unusual today?', a: ['A man came in at eight this morning. Duct tape. Zip ties. A box of garbage bags. Paid cash.', 'He never said a word. Never looked at me.'], gives: 'shop_buy' },
    { q: 'What did he look like?', req: 'shop_buy', a: ['Green work jacket. PRUETT HARDWARE stitched on the back.', "Not Dale Pruett. I've known Dale twenty years. He's sixty-something with a bad hip. This man was younger. Thirties.", 'He got into a grey van out front.'], gives: 'jacket' },
    { q: 'Who works at Pruett\'s?', req: 'jacket', a: ['Just Dale and one stock guy. Gary. Gary... Voss? Moved here two years ago.', 'Lives out past the woods somewhere. Never says hello.'], gives: 'gary' },
  ],
};

/* ============================================================
   CASE 2 — WINGINTONN TOWN — THE TALLYMAN
   ============================================================ */
const WING = {
  id: 'wing',
  num: 'CASE 02',
  title: 'The Tallyman',
  place: 'Wingintonn Town',
  date: 'November 14th',
  blurb: 'Three dead in three weeks. A stopped watch at every scene. Someone in Wingintonn is counting.',
  intro: [
    'WINGINTONN TOWN',
    'NOVEMBER 14TH — 1:30 AM',
    'Two months since Cmary. You still do not sleep.',
    'Three people dead in three weeks. Each found with a cheap pocket watch, stopped at 2:13. Tally marks carved nearby.',
    'The papers call him the Tallyman.',
    'Tonight you walk the scenes yourself.',
  ],
  fog: 0.058, rain: 0.1, spawn: { x: 0, z: 20, yaw: 0 },
  required: ['print2', 'scar', 'log'],
  culprit: 'crane',
  clues: {
    victims: { type: 'statement', title: 'Sgt. Holt — the victims', text: 'Carol Dunn, 71 (the lane off Main). Henry Oakes, 68 (riverbank by the bridge). Ruth Abara, 66 (church steps). All retired, all lived alone. Nothing stolen.' },
    crane_did: { type: 'statement', title: 'Sgt. Holt — autopsies', text: 'The county coroner, Dr. Elias Crane, performed all three autopsies himself. He insisted.' },
    hospital: { type: 'statement', title: 'Mae — the victims', text: 'All three worked together at Wingintonn General years ago: Carol a nurse, Henry a surgeon, Ruth an anaesthetist.' },
    chemical: { type: 'statement', title: 'Mae — the corner booth', text: 'A man in a long coat watched them the last three Thursdays. Smelled sharp and chemical, like a hospital. He left just before each of them did.' },
    beckett: { type: 'statement', title: 'Mae — Tom Beckett', text: 'The butcher, Tom Beckett, screamed at Carol in October over a debt. Said she would "pay one way or another."' },
    watch_buyer: { type: 'statement', title: 'Abel Finch — the watches', text: 'Finch ordered a dozen cheap watches for a client in October. Paid cash, wore gloves, leaned on a cane and favored his left leg.' },
    limp: { type: 'statement', title: 'Jory — the river', text: 'Saw Henry Oakes walking arm in arm with a tall man in a long coat, with a cane and a bad left leg. Henry was stumbling like he was drugged. The man looked "like a doctor."' },
    daughter: { type: 'statement', title: 'Father Morrow — Annie Crane', text: "In 1999 Dr. Crane's daughter Annie, nine, died during routine surgery at Wingintonn General. Time of death: 2:13 AM." },
    scar: { type: 'statement', title: 'Father Morrow — the scar', text: 'Crane cut his right index finger to the bone during an autopsy years ago. The scar runs straight across the fingerprint.' },
    beckett_alibi: { type: 'statement', title: 'Father Morrow — Beckett', text: 'Tom Beckett was at the lodge the night Ruth died. Morrow was there too.' },
    tally1: { type: 'evidence', title: 'Tally mark I', text: 'A single stroke carved into the brick. Fine, shallow and precise. Something surgical, not a knife.' },
    print2: { type: 'evidence', title: 'Latent print — dumpster lid', text: 'A partial right index print from under the dumpster lid, where he braced to carve. A clean scar line runs straight across the ridges. No match on file.' },
    vial: { type: 'evidence', title: 'Vial cap — riverbank', text: 'A glass vial cap in the reeds. CHLORAL HYDRATE — FOR INSTITUTIONAL USE ONLY. An old sedative. Hospitals and morgues still keep it.' },
    tally3: { type: 'evidence', title: 'Tally mark III', text: 'III carved into the bottom church step. Under it, smaller: 2:13.' },
    log: { type: 'evidence', title: 'Morgue drug log', text: 'Chloral hydrate signed out three times this month, on the day of each killing. Initialled E.C.' },
    watches: { type: 'evidence', title: 'Box of watches', text: 'A box of nine cheap pocket watches in the coroner\'s office, all stopped at 2:13. One has a paper tag: IV.' },
  },
  suspects: [
    { id: 'crane', name: 'Dr. Elias Crane', role: 'County Coroner · 61', notes: [
      { t: 'Performed all three autopsies himself.' },
      { t: 'Works with formaldehyde every day.', req: 'chemical' },
      { t: 'Walks with a cane. Left leg.', req: 'limp' },
      { t: 'Daughter Annie died in surgery at Wingintonn General, 1999, at 2:13 AM.', req: 'daughter' },
      { t: 'Scar across his right index fingerprint.', req: 'scar' },
      { t: 'Chloral hydrate signed out under "E.C." on each killing day.', req: 'log' },
    ] },
    { id: 'beckett', name: 'Tom Beckett', role: 'Butcher · 47', notes: [
      { t: 'Threatened Carol Dunn over a debt. Handy with blades.' },
      { t: 'Strong, quick on his feet. No cane, no limp.', req: 'limp' },
      { t: 'At the lodge the night Ruth died. The priest confirms it.', req: 'beckett_alibi' },
    ] },
    { id: 'finch', name: 'Abel Finch', role: 'Watchmaker · 58', notes: [
      { t: 'The calling card is a watch.' },
      { t: 'Says he sold a dozen to a gloved man with a cane. Finch has no cane.', req: 'watch_buyer' },
      { t: 'His prints are on file from a 2003 break-in report. No scar. No match.', req: 'print2' },
    ] },
    { id: 'morrow', name: 'Father Morrow', role: 'Priest · 70', notes: [
      { t: 'All three victims were his parishioners.' },
      { t: 'Told you about Crane before you asked. He wants someone to stop it.', req: 'scar' },
      { t: 'No scar on his hands.', req: 'print2' },
    ] },
  ],
  objective(api) {
    const h = (id) => api.has(id);
    if (!api.flags.holt) return 'Talk to Sergeant Holt at your car.';
    if (!h('tally1') || !h('print2')) return 'Walk the first scene: the lane off Main Street, by the cross street.';
    if (!h('hospital')) return 'The victims drank at the Fox & Lantern. Talk to the bartender.';
    if (!h('limp')) return 'Someone was by the river the night Henry Oakes died. East end of the cross street.';
    if (!h('vial')) return 'Search the reeds on the riverbank.';
    if (!h('scar')) return 'Walk the third scene: the church steps at the south end of Main.';
    if (!h('log')) return 'Everything points at the County Morgue. Find a way inside.';
    if (api.flags.scare && !api.flags.sawIV) return 'Get back to your car.';
    return 'Return to your car. Name the Tallyman.';
  },
  endings: {
    good: {
      title: 'CASE CLOSED',
      text: [
        'They take Elias Crane in the morgue at dawn. He does not run. He is sitting by the drawers with his cane across his knees.',
        'In his desk: the surgical team roster from 1999. Seven names. Three crossed out.',
        'The fourth name is not a doctor. It is the detective who closed Annie Crane\'s case in a week. Your predecessor, long retired.',
        'Under it, in fresh ink: your name.',
        '"You\'d have closed mine too," he says. "Everyone stops looking eventually."',
        'You do not tell him that you never do.',
      ],
    },
    bad: (s) => ({
      title: 'THE COUNT GOES ON',
      text: [
        `You charge ${s.name}. The papers print your photo under the word CAUGHT.`,
        'On the ninth night, Sergeant Holt borrows your car.',
        'They find him at 2:13 AM in the driver\'s seat. Tally mark IV is carved into the door.',
        'It was meant for you.',
      ],
    }),
  },

  build(api) {
    const { B } = api;
    const r = B.rng(77);
    B.ground(0, -20, 140, 140, 0x0d0d0e);
    // streets
    B.flat(10, 92, 0x121315, 0, -17, 0.02, { rough: 0.3, metal: 0.25 });
    B.flat(76, 10, 0x121315, 2, -15, 0.025, { rough: 0.3, metal: 0.25 });
    for (let z = 26; z > -62; z -= 4) if (z > -10 || z < -20) B.flat(0.14, 1.8, 0x4d4a38, 0, z, 0.03);
    for (let i = 0; i < 18; i++) B.flat(0.8 + r() * 1.8, 0.6 + r() * 1.3, 0x090b0f, (r() - 0.5) * 8, 24 - r() * 84, 0.035, { rough: 0.05, metal: 0.9 });
    // cobbled lane
    B.flat(13, 9, 0x17130f, -12, -5.5, 0.03);

    // bounds
    B.collider(-35, -80, -34, 30); B.collider(38.5, -80, 39.5, 30); B.collider(-35, -80, 40, -79);
    B.collider(-35, 28, 40, 29);
    B.collider(32, -41, 40, -40); B.collider(32, 1, 40, 2);

    const brick = [0x34221d, 0x2c2420, 0x302b27, 0x3a2622, 0x26221f];
    const row = (x, z, sx, sz, face, o = {}) => B.house(x, z, { sx, sz, face, h: o.h || 8 + Math.floor(r() * 4), color: o.color || brick[Math.floor(r() * brick.length)], lit: o.lit ?? 0.12, roof: false, winW: 0.9, winH: 1.4, ...o });
    // west of Main
    row(-11.75, 20, 12.5, 12, '+x');
    row(-11.75, 6, 12.5, 14, '+x', { lit: 0.05 });
    row(-25, -5, 13, 10, '+z');
    row(-11.75, -33, 12.5, 24, '+x');
    row(-11.75, -56, 12.5, 16, '+x');
    row(-25.5, -28, 13, 16, '-z');
    // east of Main
    const bar = row(11.75, 19, 12.5, 12, '-x', { lit: 0.6, h: 7 });
    const finch = row(11.75, 5, 12.5, 12, '-x', { lit: 0.3, h: 9 });
    row(11.75, -5.5, 12.5, 9, '-x');
    row(25.25, -4, 13.5, 12, '-z');
    row(11.75, -33, 12.5, 26, '-x');
    const morgue = row(11.75, -53.5, 12.5, 14, '-x', { color: 0x2a2c2e, lit: 0.05, h: 7, blind: true });
    row(25.25, -28, 13.5, 16, '+z');
    // church
    B.box(18, 10, 12, 0x232220, 0, 0, -72, { collide: true });
    B.box(4.5, 19, 4.5, 0x1f1e1c, 0, 0, -76, { collide: true });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(3.2, 8, 4), B.mat(0x141416)); spire.rotation.y = Math.PI / 4; spire.position.set(0, 23, -76); api.scene.add(spire);
    B.box(10, 0.25, 1.2, 0x2c2b29, 0, 0, -65.4, { collide: true }); B.box(10, 0.5, 0.6, 0x2c2b29, 0, 0, -65.7);
    B.box(2.4, 3.6, 0.2, 0x160e0a, 0, 0.5, -65.95);
    B.decal((g, w, h) => {
      const cols = ['#5a1414', '#14204a', '#4a3a10', '#1e3a1e'];
      for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = cols[(x + y) % 4]; g.fillRect(x * w / 4, y * h / 8, w / 4 - 3, h / 8 - 3); }
      g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.3); g.quadraticCurveTo(w / 2, -h * 0.1, w, h * 0.3); g.lineTo(w, h); g.fill();
    }, 2.2, 3.6, 0, 6.2, -65.98, { glow: true, res: 128 });

    // river + bridge
    const water = B.flat(40, 120, 0x05080c, 59, -20, -0.4, { rough: 0.05, metal: 0.8 });
    B.box(0.15, 1.0, 40, 0x2a2a2c, 38.6, 0, -19); // railing
    B.box(32, 0.6, 9, 0x222224, 55, -0.2, -15);
    for (const px of [44, 54, 64]) B.box(1.6, 3, 1.6, 0x1d1d1f, px, -3, -15);
    B.box(0.2, 1.1, 9, 0x6a1010, 41, 0, -15, { emissive: 0x200000 }); // barricade
    B.collider(40.8, -20, 41.2, -10);
    B.signText('BRIDGE CLOSED', 2.4, 0.4, 40.88, 0.75, -15, -Math.PI / 2, { color: '#ffffff', bg: '#6a1010', size: 0.6, glow: false });
    for (let i = 0; i < 40; i++) { const rz = -36 + r() * 12, rx = 37 + r() * 1.4; B.box(0.04, 0.6 + r() * 0.8, 0.04, 0x1d2416, rx, 0, rz, { shadow: false }); }
    // barrel fire
    B.cyl(0.35, 0.35, 0.9, 0x2a1a10, 35.4, 0, -24.5, { metal: 0.5 });
    const fire = new THREE.PointLight(0xff7a2a, 10, 10, 1.4); fire.position.set(35.4, 1.3, -24.5); api.scene.add(fire);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 6), new THREE.MeshBasicMaterial({ color: 0xff8a3a }));
    flame.position.set(35.4, 1.2, -24.5); api.scene.add(flame);
    api.anims.push(() => { const k = 0.75 + Math.random() * 0.35; fire.intensity = 10 * k; flame.scale.set(1, k * 1.2, 1); });
    B.collider(34.9, -25, 35.9, -24);

    // signs
    B.signText('FOX & LANTERN', 4.5, 0.8, 5.46, 4.6, 19, -Math.PI / 2, { color: '#ffb35a', shadow: true });
    const barLight = new THREE.PointLight(0xffa860, 8, 9, 1.6); barLight.position.set(4.6, 2.6, 19); api.scene.add(barLight);
    B.signText('A. FINCH · WATCHES & CLOCKS', 5, 0.6, 5.46, 3.4, 5, -Math.PI / 2, { color: '#d8e0c8', size: 0.42, font: '"Special Elite", serif', weight: 400 });
    B.signText('COUNTY MORGUE', 4, 0.6, 5.46, 3.2, -53.5, -Math.PI / 2, { color: '#bcd6ff', size: 0.5 });
    // clock on Finch's shop
    const clock = B.decal((g, w, h) => { g.fillStyle = '#d8d2bc'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 7); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 6; g.stroke(); g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + w * 0.2, h / 2 + h * 0.06); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + w * 0.12, h / 2 - h * 0.35); g.stroke(); }, 1, 1, 5.47, 5, 2.5, { ry: -Math.PI / 2, glow: true, res: 128 });

    // lamps
    B.lamp(-4.6, 14); B.lamp(4.6, 0); B.lamp(-4.6, -9, { flicker: true });
    B.lamp(4.6, -24); B.lamp(-20, -10.6); B.lamp(24, -19.4);
    B.lamp(-4.6, -40, { intensity: 22 }); B.lamp(4.6, -58, { color: 0xc4dcff, intensity: 26 });

    // ---- scene 1: the lane ----
    B.tape([[-5.4, -1.3], [-9, -1.6], [-14, -1.4], [-18.3, -1.3]]);
    B.tape([[-5.4, -9.7], [-10, -9.7], [-18.3, -9.6]]);
    B.box(2.2, 1.3, 1.3, 0x18261c, -16.5, 0, -3, { collide: true, metal: 0.4 });
    B.box(2.3, 0.08, 1.4, 0x142018, -16.5, 1.3, -3);
    B.box(0.6, 0.8, 0.6, 0x1c1c1c, -17.4, 0, -8.4, { collide: true });
    B.decal((g, w, h) => { g.strokeStyle = 'rgba(220,220,210,0.7)'; g.lineWidth = 5; g.beginPath(); g.ellipse(w * 0.5, h * 0.15, w * 0.12, h * 0.09, 0, 0, 7); g.moveTo(w * 0.4, h * 0.24); g.lineTo(w * 0.2, h * 0.5); g.moveTo(w * 0.6, h * 0.24); g.lineTo(w * 0.85, h * 0.45); g.moveTo(w * 0.42, h * 0.24); g.lineTo(w * 0.38, h * 0.62); g.lineTo(w * 0.3, h * 0.95); g.moveTo(w * 0.58, h * 0.24); g.lineTo(w * 0.62, h * 0.62); g.lineTo(w * 0.72, h * 0.95); g.stroke(); }, 1.0, 1.9, -12.5, 0.045, -5.5, { floor: true, res: 128 });
    B.marker(1, -11.6, -4.4); B.marker(2, -13.6, -6.6); B.marker(3, -16.2, -4.2);
    B.decal((g, w, h) => { g.strokeStyle = 'rgba(200,190,170,0.9)'; g.lineWidth = 7; g.beginPath(); g.moveTo(w / 2, h * 0.1); g.lineTo(w / 2 + 3, h * 0.9); g.stroke(); }, 0.25, 0.6, -18.44, 1.6, -6.2, { ry: Math.PI / 2, res: 64 });

    // ---- scene 3: church steps ----
    B.tape([[-6, -63.2], [-2, -63.4], [2, -63.3], [6, -63.2]]);
    B.decal((g, w, h) => { g.strokeStyle = 'rgba(210,200,180,0.9)'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w * 0.2 + i * w * 0.12, h * 0.1); g.lineTo(w * 0.2 + i * w * 0.12, h * 0.55); g.stroke(); } g.font = `${h * 0.3}px "Special Elite", monospace`; g.fillStyle = 'rgba(210,200,180,0.85)'; g.fillText('2:13', w * 0.12, h * 0.92); }, 0.6, 0.3, 2.2, 0.13, -64.79, { ry: 0, res: 128 });
    B.marker(4, 1.5, -64.2);

    // people
    B.car(2.2, 23, { police: true, ry: 0 });
    B.car(-3.2, 6, { color: 0x1a1a1a, ry: Math.PI });
    B.car(3.4, -36, { color: 0x2a1c18, ry: 0 });
    const ivDecal = B.decal((g, w, h) => { g.strokeStyle = 'rgba(220,220,220,0.95)'; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.2, h * 0.15); g.lineTo(w * 0.2, h * 0.85); g.moveTo(w * 0.42, h * 0.15); g.lineTo(w * 0.6, h * 0.85); g.lineTo(w * 0.8, h * 0.15); g.stroke(); }, 0.6, 0.4, 2.2 - 0.97, 0.75, 23.4, { ry: -Math.PI / 2, res: 128 });
    ivDecal.visible = false;
    B.person(4.6, 21.5, { coat: 0x15192a, pants: 0x101320, cap: 0x101320, skin: 0x6a4a3a, ry: -Math.PI / 2 });
    B.person(4.8, 16.5, { coat: 0x2a1a18, pants: 0x18181c, hair: 0x6a2a1a, longHair: true, skin: 0x9a7a66, ry: -Math.PI / 2 });
    B.person(4.8, 6.4, { coat: 0x2a2a26, pants: 0x1a1a1a, hair: 0x9a9a9a, glasses: true, skin: 0x9a8070, ry: -Math.PI / 2 });
    B.person(34.2, -25.3, { pose: 'sit', coat: 0x262418, pants: 0x1c1a14, hat: 0x1a1a16, skin: 0x6a5040, ry: B.faceTo(34.2, -25.3, 35.4, -24.5) });
    B.person(-3.2, -63.6, { coat: 0x0c0c0e, pants: 0x0c0c0e, hair: 0x8a8a8a, collar: true, skin: 0x9a8070, ry: 0 });
    const stranger = B.person(-3.4, -40.9, { coat: 0x2a2a32, pants: 0x18181c, longCoat: true, hat: 0x050505, cane: true, glasses: true, skin: 0x5a4a40, ry: Math.PI / 2, scale: 1.08, idle: false, collide: false });
    stranger.visible = false;
    const glint = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.02), new THREE.MeshBasicMaterial({ color: 0xcfe0ff }));
    glint.position.set(0, 0.85 + 0.82, 0.16); stranger.userData.inner.add(glint);

    // ---- interactions ----
    api.interact({ pos: [4.6, 1.5, 21.5], label: 'Talk to Sergeant Holt', use: () => api.talk(W_HOLT) });
    api.interact({
      pos: [2.2, 1.2, 23], radius: 3, label: () => (api.flags.scare && !api.flags.sawIV ? 'Look at your car' : 'Case board (car)'),
      use: () => {
        if (api.flags.scare && !api.flags.sawIV) {
          api.flags.sawIV = true; api.sound.heartbeat(4);
          api.inspect({ title: 'Your car', text: ['Carved into the driver\'s door, fresh, the paint curling off the metal:', 'IV', 'The box in the morgue had a watch tagged IV. He walked past you to do this. He knows exactly who you are.'], onClose: () => api.refresh() });
          return;
        }
        api.board();
      },
    });
    api.interact({ pos: [4.8, 1.5, 16.5], label: 'Talk to Mae (bartender)', use: () => api.talk(W_MAE) });
    api.interact({ pos: [4.8, 1.5, 6.4], label: 'Talk to Abel Finch', use: () => api.talk(W_FINCH) });
    api.interact({ pos: [34.2, 1.2, -25.3], label: 'Talk to Jory', use: () => api.talk(W_JORY) });
    api.interact({ pos: [-3.2, 1.5, -63.6], label: 'Talk to Father Morrow', use: () => api.talk(W_MORROW) });
    api.interact({ pos: [-18.2, 1.6, -6.2], radius: 2.4, glint: true, label: 'Examine the wall', cond: () => !api.has('tally1'), use: () => api.inspect({ title: 'Tally mark', text: ['One stroke, carved into the brick at shoulder height. I.', 'Carol Dunn was found below it, eleven days ago.', 'The cut is shallow, fine and perfectly straight. Not a knife. Something surgical.'], onClose: () => api.give('tally1') }) });
    api.interact({ pos: [-16.5, 1.25, -3.7], radius: 2.2, glint: true, label: 'Examine dumpster lid', cond: () => !api.has('print2'), use: () => api.inspect({ title: 'Dumpster', text: ['The lid is right below the tally mark. He would have needed something to lean on while he carved.', 'Forensics dusted the top. Nobody checked the underside of the lip, where your fingers would curl.'], actions: [{ label: 'Dust for prints', fn: () => api.print({ seed: 1999, scar: true, surface: 'steel lid' }, () => api.give('print2')) }] }) });
    api.interact({ pos: [37.6, 0.4, -31], radius: 2.6, glint: true, label: 'Search the reeds', cond: () => !api.has('vial'), use: () => api.inspect({ title: 'In the reeds', text: ['Something small and glass, pushed into the mud where two people stood.', 'A vial cap with a pharmacy seal: CHLORAL HYDRATE — FOR INSTITUTIONAL USE ONLY.', 'A sedative so old most doctors have never prescribed it. Hospitals and morgues still keep it locked up.'], onClose: () => api.give('vial') }) });
    api.interact({ pos: [2.2, 0.3, -64.6], radius: 2.2, glint: true, label: 'Examine the steps', cond: () => !api.has('tally3'), use: () => api.inspect({ title: 'Church steps', text: ['Ruth Abara was found here two nights ago, sitting up against the door like she was waiting for morning Mass.', 'Three strokes on the bottom step. III.', 'And under them, scratched small, like a signature: 2:13.'], onClose: () => api.give('tally3') }) });
    api.interact({
      pos: [5.6, 1.5, -53.5], radius: 2.5, label: () => (api.has('log') ? 'County Morgue' : 'Enter the County Morgue'),
      use: () => {
        if (api.has('log')) { api.inspect({ title: 'County Morgue', text: ['You are not going back in there tonight.'] }); return; }
        if (!(api.has('vial') && (api.has('chemical') || api.has('limp') || api.has('crane_did')))) {
          api.inspect({ title: 'County Morgue', text: ['Locked. No lights. No night attendant tonight.', 'You have no warrant and no reason yet. Find out what ties the victims together first.'] });
          return;
        }
        api.sound.door();
        api.inspect({
          title: "The coroner's office",
          text: ['The side door is propped with a folded newspaper. Inside it is colder than the street.', 'In the drug cabinet: a clipboard log. Chloral hydrate, signed out three times this month. The dates match every killing.', 'Every line is initialled the same way. E.C.'],
          onClose: () => {
            api.give('log');
            api.inspect({
              title: 'Bottom drawer',
              text: ['A shoebox. Nine cheap pocket watches, wrapped in tissue like something precious. Every one stopped at 2:13.', 'One has a paper tag tied to the crown.', 'IV.'],
              onClose: () => { api.give('watches'); scare(); },
            });
          },
        });
      },
    });

    function scare() {
      api.flags.scare = true;
      const keep = api.lamps.find((l) => l.light.position.z < -38 && l.light.position.z > -42);
      api.sound.heartbeat(10, 0.7);
      api.lamps.forEach((l, i) => setTimeout(() => { if (l !== keep) B.setLamp(l, false); }, 150 * i));
      stranger.visible = true; B.setLamp(keep, true, 1.7);
      let tap = setInterval(() => api.sound.tap(), 700);
      api.cutscene([
        { pos: [2.6, 1.65, -51.5], look: [-3.4, 1.2, -40.9], dur: 2.4, text: 'The street lights are going out. One by one.', onStart: () => api.flash(false) },
        { hold: 3, text: 'Someone is standing under the last one.' },
        { hold: 2.5, text: 'Tap. Tap. Tap.' },
        { hold: 1.6, text: '', onStart: () => { B.setLamp(keep, false); stranger.visible = false; clearInterval(tap); api.sound.stinger(); } },
        { hold: 2, text: 'Gone.', onStart: () => api.flash(true) },
      ], () => {
        api.lamps.forEach((l) => B.setLamp(l, true, 0.55));
        ivDecal.visible = true;
        api.refresh();
      });
    }
    api.ambience({ zone: () => 'town' });
  },
};

const W_HOLT = {
  id: 'holt', name: 'Sergeant Holt',
  intro: ["You're the one from Cmary. Heard about that. I'm sorry.", "Here's what we've got. Which is nothing."],
  topics: [
    { q: 'Tell me about the victims.', a: ['Carol Dunn, 71. Found in the lane off Main. Henry Oakes, 68, on the riverbank by the bridge. Ruth Abara, 66, on the church steps two nights ago.', 'All retired. All lived alone. Nothing stolen.'], gives: 'victims', then: (api) => { api.flags.holt = true; } },
    { q: 'What about the watches?', a: ['Same cheap model every time. Stopped at 2:13. The coroner says the hands were set by hand after.', "Finch, the watchmaker, swears they're not his. Nobody believes him."], then: (api) => { api.flags.holt = true; } },
    { q: 'Who did the autopsies?', a: ['Dr. Crane. County coroner. Did all three himself. Insisted on it.', "Morgue's at the south end of Main. He's not in tonight."], gives: 'crane_did', then: (api) => { api.flags.holt = true; } },
  ],
};
const W_MAE = {
  id: 'mae', name: 'Mae (Fox & Lantern)',
  intro: ["We're closed. ...You're police. Fine.", 'Ask your questions. I\'m not going home alone tonight anyway.'],
  topics: [
    { q: 'Did you know the victims?', a: ['All three. Old hospital crowd. They worked together at Wingintonn General back in the day. Came in every Thursday.', 'Carol was a nurse. Henry a surgeon. Ruth did the anaesthesia.'], gives: 'hospital' },
    { q: 'Was anyone watching them?', a: ['Man in the corner booth, the last three Thursdays. Long coat. Never drank what he ordered.', 'Smelled like a hospital. Sharp. Chemical. Like what they keep bodies in.', 'He left a few minutes before each of them did. Every time.'], gives: 'chemical' },
    { q: 'Any trouble in here?', a: ['Tom Beckett, the butcher. Screamed at Carol in October over money her late husband owed him. Said she\'d "pay one way or another."', "Tom's a loudmouth. But he's only a loudmouth."], gives: 'beckett' },
  ],
};
const W_FINCH = {
  id: 'finch', name: 'Abel Finch (watchmaker)',
  intro: ['The watches. Yes. Everyone thinks it\'s me.', 'Ask what you want. I\'ve got nothing but time.'],
  topics: [
    { q: 'Are the watches yours?', a: ["Mine? Those are garbage. Stamped tin. I don't sell them, but I did order them, once, for a client.", 'A man bought a dozen in October. Paid cash. Kept his gloves on the whole time. Leaned on a cane, favored his left leg.'], gives: 'watch_buyer' },
    { q: 'Why 2:13?', a: ["I don't know. But somebody chose it.", "You don't stop twelve watches at the same minute by accident. It means something to him."] },
    { q: 'Where were you on those nights?', a: ['Here. Alone. Fixing other people\'s time.', 'I know how that sounds.'] },
  ],
};
const W_JORY = {
  id: 'jory', name: 'Jory',
  intro: ["Don't take my fire. It's all I got."],
  topics: [
    { q: 'The night Henry Oakes died?', a: ['I saw him. The old man. Walking with somebody, arm in arm like old friends. The old man was stumbling. I thought he was drunk.', 'The other one was tall. Long coat. Had a cane, and a hitch in his step. Left leg, bad.'], gives: 'limp' },
    { q: 'Did you see his face?', req: 'limp', a: ['Under the lamp, for a second. Clean. Glasses. Looked like a doctor.', 'Then he looked at me. Just looked. I put my head down.', "I'm sorry. I put my head down."] },
    { q: 'Anything left by the water?', a: ['They took the old man away. But there\'s something shiny in the reeds, down where they stood.', "Cops didn't look. Cops never look at the reeds."] },
  ],
};
const W_MORROW = {
  id: 'morrow', name: 'Father Morrow',
  intro: ['Ruth was on these steps every morning for eleven years.', 'She said someone was following her. I told her to pray. God forgive me, I told her to pray.'],
  topics: [
    { q: 'Who would want them dead?', a: ['I cannot break confession. But I can tell you what the whole town knows.', "In 1999, Dr. Elias Crane's daughter Annie died on the table at Wingintonn General. Routine surgery. Something went wrong. She was nine.", 'She died at 2:13 in the morning.'], gives: 'daughter' },
    { q: 'Tell me about Dr. Crane.', req: 'daughter', a: ['He comes to Mass. Never takes communion. Sits at the back with his cane.', 'Years ago he cut his finger to the bone during an autopsy. Right index. The scar runs straight across the print. He showed it to me once, like it was a joke.'], gives: 'scar' },
    { q: 'What about Tom Beckett?', a: ['Tom sleeps in his shop more than his house. He has a temper.', 'But Tom was at the lodge the night Ruth died. So was I. Until two in the morning.'], gives: 'beckett_alibi' },
  ],
};

export const CASES = [CMARY, WING];
