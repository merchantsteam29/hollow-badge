// CASE 03: HARROW FALLS, THE LONG WINTER
// A snowed-in mountain town. Three people missing. The kind man at the diner has been feeding everyone.
import * as THREE from 'three';

const CAP = {
  search: [
    'Headlights sweep across the front window.',
    'A car door. Boots on the porch.',
    'WALT: Detective? Your car is out front.',
    'WALT: You found my table.',
    'WALT: I can smell the cold on you.',
    'WALT: I made enough for one more.',
    'Upstairs, a door closes. Then nothing.',
  ],
};
const C = (i) => ({ text: CAP.search[i], vo: `harrow.search.${i}` });

export const HARROW = {
  get captions() { return CAP; },
  get witnesses() { return [W_WALT, W_RUTH, W_DAG, W_SILAS]; },
  id: 'harrow',
  num: 'CASE 03',
  title: 'The Long Winter',
  place: 'Harrow Falls',
  date: 'December 21st',
  blurb: 'Nine days snowed in. Three people gone. The whole town is eating at the same kind man\'s counter.',
  intro: [
    'HARROW FALLS',
    'DECEMBER 21ST — 9:40 PM',
    'The pass has been closed for nine days.',
    'Three people have vanished since the snow started. Nobody can get in. Nobody can get out.',
    'You drove up the mountain the morning the road closed.',
    'Now you are snowed in with whoever is doing this.',
  ],
  fog: 0.045, rain: 0.06, snow: true, spawn: { x: 1.5, z: 23, yaw: 0 },
  sky: { top: '#090c12', mid: '#161c24', horizon: '#262c34', moon: true, clouds: 'rgba(120,130,145,0.4)' },
  required: ['ledger', 'liftpass', 'freezer'],
  proof: ['ledger', 'liftpass', 'freezer', 'table', 'nogame', 'van3', 'calendar', 'plow', 'walt_lied'],
  interrogation: {
    id: 'walt_i', who: 'Walt Ebner', role: 'walt',
    model: { build: 'heavy', old: true, coat: 0x6a2a22, coatLen: 'none', shirt: 0x5a2420, apron: 0xd8d2c4, pants: 0x2a2a2e, hair: 0xd8d6d0, hairStyle: 'bald', beard: true, glasses: true, skin: 0xb08a74, arms: 'clasp' },
    room: { wall: 0x5a2420, lamp: 0xffc890, table: 0x8a8478 },
    spots: [
      { pos: [7.0, 1.5, 15.6], label: 'Sit down with Walt and press him', cond: (api) => !api.flags.meeting },
      { pos: [-6.8, 1.5, 18.6], label: 'Pull Walt aside and press him', cond: (api) => api.flags.meeting && !api.flags.hidePhase && !api.flags.escaped },
    ],
    unlock: (api) => api.has('ledger') && api.has('nogame'),
    intro: ['WALT: Sit, sit. You look like you have not eaten in days.', 'WALT: Ask me anything, Detective. I have nothing to hide from you.'],
    statements: [
      { t: "I had a full freezer when the storm hit. That's how I've kept everyone fed.", press: ['WALT: Restaurant freezer. You would be amazed what fits.'], lie: 'ledger',
        crack: ['WALT: ...Well. I found more. In the back.', 'He refills the coffee you did not ask for.'], after: 'His own log says no meat since Dec 11.' },
      { t: 'Silas sold me venison, once the beef ran out. Good man, Silas, whatever they say.', press: ['WALT: Paid cash. Shook his hand.'], lie: 'nogame',
        crack: ['WALT: Did he say that?', 'The smile stays. The eyes do not.'], after: 'Silas has never sold Walt an ounce of game.' },
      { t: 'And that Reese boy? Never met him. He never came in here.', press: ['WALT: Kids like that drift through every winter.'], lie: 'liftpass',
        crack: ['WALT: The hut is open to anybody. Kids go out there to drink.', 'WALT: You should eat something, Detective. It is going to be a long night.'], after: "Toby's lift pass was frozen into the floor of Walt's hut." },
      { t: 'Everyone in this town is family to me.', press: ['WALT: When the plows come, they will all thank me. You will see.'] },
    ],
    wrong: ['WALT: I am not sure what you mean by that.', 'WALT: Oh, that is nothing. Do not worry yourself.', 'WALT: Here, have some more coffee.'],
    fail: ['WALT: I think you need to rest. We can talk tomorrow.', 'He turns away to wipe the counter, humming.'],
    done: ['WALT: You have had a long day.', 'WALT: I will save you a bowl.'],
    gives: 'walt_lied',
  },

  culprit: 'walt',
  clues: {
    walt_missing: { type: 'statement', title: 'Walt — the missing', text: 'Nell Harmon, waitress, walked home Dec 12 and never arrived. Gus Lindqvist, plow driver, his truck found on the lake road Dec 16. Toby Reese, 19, gone two nights ago.' },
    stew: { type: 'statement', title: 'Walt — the stew', text: 'The store ran dry the first week. Walt says he had a full freezer, so he cooks free stew for the whole town every night.' },
    walt_alibi: { type: 'statement', title: 'Walt — Dec 12', text: 'Nell helped him close up, then walked home. He offered her a ride. "I always offer."' },
    posters: { type: 'evidence', title: 'Missing posters', text: 'Three faces on the town hall board, the paper stiff with frost: NELL HARMON, GUS LINDQVIST, TOBY REESE. Someone has added a fourth sheet, blank, as if waiting.' },
    calendar: { type: 'evidence', title: "Nell's calendar", text: 'Her last entry, Dec 12: "help W. close up, 11pm." After that the squares are empty.' },
    silas_nell: { type: 'statement', title: 'Ruth — Silas', text: 'Silas Crowe asked Nell out twice. She refused. "He stares."' },
    plow: { type: 'evidence', title: "Gus's plow", text: 'Abandoned on the lake road, door open, engine cold. A smaller vehicle pulled up close behind it; its tracks turn back toward town. A diner napkin frozen into the snow.' },
    fuse: { type: 'statement', title: 'Dag — the fuse', text: 'Nothing was broken. Someone pulled the ignition fuse so the plow would coast to a stop and Gus would get out.' },
    van3: { type: 'statement', title: 'Dag — the diner van', text: 'Gus always stopped for the diner van. Walt has driven stew out to the shut-ins every night; it was the only vehicle on the lake road that week.' },
    dag_silas: { type: 'statement', title: 'Dag — knives', text: 'Silas sharpened his skinning knives last week. "For deer. In this snow."' },
    dag_alibi: { type: 'statement', title: 'Dag — the night of Dec 16', text: 'Dag was snowed in at the garage with three stranded skiers the night Gus vanished.' },
    silas_tags: { type: 'statement', title: 'Silas — his shed', text: '"Every carcass in my shed is tagged and logged with the state. Go look."' },
    nogame: { type: 'statement', title: 'Silas — the stew', text: 'Walt has never bought game from Silas. "Says he can\'t stomach it." Yet the stew has had meat in it every day for nine days.' },
    tags: { type: 'evidence', title: "Silas's freezer", text: 'Venison and elk, every package tagged with a state game number and a date. All of it animal. All of it logged.' },
    ledger: { type: 'evidence', title: 'Diner provisions log', text: 'Clipped to the empty delivery crates: last delivery Dec 11. Beef 0, pork 0, chicken 0 as of Dec 14. Stew served nightly since.' },
    liftpass: { type: 'evidence', title: "Toby's lift pass", text: 'Frozen into the floor of an ice-fishing hut on the lake. EBNER is painted on the hut door.' },
    freezer: { type: 'evidence', title: "Walt's chest freezer", text: 'Packages in butcher paper, tied with string, labelled in a neat hand: N.H. 12/13. G.L. 12/17. T.R. 12/20. There is a lot of room left.' },
    walt_lied: { type: 'statement', title: 'Walt: caught lying', text: 'Walt said he had a full freezer, that Silas sold him venison, and that he never met Toby. His own log, Silas and the ice hut say otherwise. He never stopped smiling.' },
    table: { type: 'evidence', title: "Walt's dinner table", text: 'Set for five with the good plates. Place cards: NELL. GUS. TOBY. Two cards blank.' },
  },
  suspects: [
    { id: 'walt', name: 'Walter Ebner', role: 'Diner owner · 61', notes: [
      { t: 'Has fed the snowed-in town free stew since the storm began. Everyone loves him.' },
      { t: 'Nell\'s last calendar entry: "help W. close up."', req: 'calendar' },
      { t: 'Drives the diner van every night: the only vehicle on the lake road when Gus vanished.', req: 'van3' },
      { t: 'Never buys game, yet his stew has had meat every day.', req: 'nogame' },
      { t: 'No meat delivered since Dec 11. Out of stock by Dec 14.', req: 'ledger' },
      { t: "Toby's lift pass was in Walt's ice-fishing hut.", req: 'liftpass' },
      { t: 'His chest freezer. His table, set for five.', req: 'freezer' },
    ] },
    { id: 'silas', name: 'Silas Crowe', role: 'Hunting guide & taxidermist · 50', notes: [
      { t: 'Keeps knives, keeps to himself. Half the town is sure it is him.' },
      { t: 'Asked Nell out twice; she refused.', req: 'silas_nell' },
      { t: 'Sharpened his skinning knives last week.', req: 'dag_silas' },
      { t: 'Every carcass in his shed is tagged and logged with the state.', req: 'tags' },
      { t: 'His lodge sits on the lake road, a short walk from where the plow was found.', req: 'plow' },
      { t: 'Has a cold room and a full set of butchering tools.', req: 'silas_tags' },
    ] },
    { id: 'dag', name: 'Dag Holm', role: 'Mechanic · 44', notes: [
      { t: "Towed Gus's plow. Knows every engine in town." },
      { t: 'Knew exactly how the plow was stopped.', req: 'fuse' },
      { t: 'Snowed in at the garage with three skiers the night Gus vanished.', req: 'dag_alibi' },
      { t: "Serviced Gus's plow the week before the storm. Knew that fuse box better than anyone.", req: 'plow' },
      { t: 'Owns the only tow truck in town; it can go anywhere the plow can.', req: 'van3' },
    ] },
  ],
  objective(api) {
    const h = (id) => api.has(id), f = api.flags;
    if (f.hidePhase === 'countdown') return 'HIDE. Now.';
    if (f.hidePhase === 'search') return "Don't make a sound.";
    if (f.escaped) return 'Get out. Get to your car and name him.';
    if (!f.walt) return 'Get warm. Talk to the man at the diner.';
    if (!h('posters')) return 'Read the missing posters outside the town hall.';
    if (!h('calendar')) return "Talk to Nell's sister Ruth, across the street.";
    if (!h('plow')) return "Find Gus's plow on the lake road, south of town.";
    if (!h('fuse')) return 'Ask Dag at the garage about the plow.';
    if (!h('nogame') && !h('tags')) return 'Go up to the lodge at the north end. Talk to Silas Crowe.';
    if (!h('ledger')) return "Something doesn't add up about the food. Look around the back of the diner.";
    if (!h('liftpass')) return 'Toby was last seen near the lake. Search the ice.';
    if (!f.meeting) return 'Keep looking.';
    if (!h('freezer') || !h('table')) return 'Walt is at the town meeting. His house behind the diner is empty. Go in.';
    return 'Get out. Get to your car and name him.';
  },
  endings: {
    good: {
      title: 'CASE CLOSED',
      text: [
        'You charge Walter Ebner.',
        'They come for him when the plows break through on the twenty-fourth. He is behind the counter, wiping it down. He asks if anybody would like coffee.',
        'For nine days, half of Harrow Falls ate at his counter. Nobody says it out loud.',
        'In the spring the diner is torn down. Nobody bids on the lot.',
        'Some nights, when it snows, you can still smell the stew.',
      ],
    },
    weak: {
      title: 'NOT ENOUGH',
      text: [
        'You charge Walter Ebner. You are right.',
        'But nothing you put on the table proves it. A kind old man, a free meal, a frightened town: the jury sees a hero.',
        'He reopens the diner in April. The stew is still free.',
        'You never eat there again. Most people do.',
      ],
    },
    bad: (s) => ({
      title: 'FREE STEW',
      text: [
        `You charge ${s.name}.`,
        'The plows break through on the twenty-fourth. Walt Ebner hands out coffee to the road crew and waves them off.',
        'In March the diner closes for the season. Walt drives south and does not come back.',
        'Two states away, a friendly man opens a little place by the highway. Free stew for anyone down on their luck.',
      ],
    }),
  },

  build(api) {
    const { B } = api;
    const r = B.rng(212);
    // ---------- ground, snow, roads ----------
    B.ground(0, -16, 90, 110, 0x5c646b, { map: 'snow' });
    B.flat(10, 70, 0x363b41, 0, -2, 0.02, { rough: 0.6, metal: 0.1, map: 'asphalt' });
    B.flat(4, 12, 0x3e444a, 3, -42, 0.022);
    for (const sx of [-5.5, 5.5]) B.box(1.0, 0.45, 70, 0x7a8288, sx, 0, -2, { shadow: false, map: 'snow' });
    for (let i = 0; i < 30; i++) B.box(0.6 + r() * 1.4, 0.2 + r() * 0.5, 0.6 + r() * 1.4, 0x8a9298, (r() < 0.5 ? -1 : 1) * (6.5 + r() * 1.2), 0, 28 - r() * 62, { shadow: false });
    // frozen lake
    B.flat(60, 30, 0x34404a, 0, -55, 0.015, { rough: 0.12, metal: 0.45 });
    for (let i = 0; i < 12; i++) B.flat(0.05, 3 + r() * 6, 0x56626c, (r() - 0.5) * 40, -45 - r() * 18, 0.02);
    // bounds
    B.collider(-26, -70, -25, 34); B.collider(25, -70, 26, 34); B.collider(-26, 33, 26, 34); B.collider(-26, -70, 26, -67);

    const snowRoof = 0x8c959b;
    // ---------- west side ----------
    B.house(-14, 16, { sx: 11, sz: 10, h: 6, face: '+x', color: 0x3a3430, roofColor: snowRoof, lit: 0.4 });
    B.signText('HARROW FALLS TOWN HALL', 5, 0.5, -8.47, 4.6, 16, Math.PI / 2, { color: '#e8dcc4', size: 0.45, font: '"Special Elite", serif', weight: 400 });
    B.light(-7.6, 3, 16, 0xffd09a, 6, 8);
    B.decal((g, w, h) => {
      g.fillStyle = '#3a2e22'; g.fillRect(0, 0, w, h);
      const sheets = ['NELL HARMON', 'GUS LINDQVIST', 'TOBY REESE', ''];
      sheets.forEach((n, i) => { const x = 14 + i * (w - 28) / 4; g.fillStyle = '#d8d2c2'; g.fillRect(x, 14, (w - 28) / 4 - 10, h - 28); g.fillStyle = '#2a2420'; g.font = `${h * 0.1}px "Special Elite", monospace`; g.textAlign = 'center'; if (n) { g.fillText('MISSING', x + (w - 28) / 8 - 5, h * 0.24); g.fillRect(x + 16, h * 0.32, (w - 28) / 4 - 42, h * 0.34); g.font = `${h * 0.07}px "Special Elite", monospace`; g.fillText(n, x + (w - 28) / 8 - 5, h * 0.82); } });
    }, 1.8, 0.8, -8.47, 1.7, 12.5, { ry: Math.PI / 2, res: 512 });
    B.house(-13.5, 2, { sx: 10, sz: 8, h: 7, face: '+x', color: 0x40362e, roofColor: snowRoof, lit: 0.35, porchLight: true });
    B.house(-14, -11, { sx: 11, sz: 10, h: 5, face: '+x', color: 0x2c3034, roof: false, lit: 0.3 });
    B.signText("DAG'S GARAGE", 3.6, 0.6, -8.47, 3.9, -11, Math.PI / 2, { color: '#ffb35a', shadow: true });
    B.light(-7.6, 2.6, -11, 0xffc080, 5, 7);
    for (const sz of [-13.6, -14.6]) { B.box(0.8, 0.5, 2.0, 0x8a1e14, -7.2, 0.15, sz, { collide: true, metal: 0.4 }); B.box(0.6, 0.35, 0.5, 0x111111, -7.2, 0.65, sz + 0.5); }
    B.house(-14.5, -26, { sx: 12, sz: 10, h: 6, face: '+x', color: 0x3a2a1e, roofColor: snowRoof, lit: 0.7 });
    B.signText('CROWE · HUNTING LODGE', 4.6, 0.55, -8.47, 4.4, -26, Math.PI / 2, { color: '#d8c8a0', size: 0.45 });
    B.light(-7.6, 2.4, -26, 0xffc890, 5, 8);
    B.box(3, 2.6, 2.6, 0x2e2218, -8.2, 0, -33.5, { collide: true });
    const shedRoof = B.box(3.4, 0.15, 3.0, snowRoof, -8.2, 2.6, -33.5); shedRoof.rotation.z = 0.12;
    for (let i = 0; i < 3; i++) B.flat(0.4 + r() * 0.5, 0.3 + r() * 0.4, 0x3a0c0a, -6.4 + r() * 0.6, -33 - r() * 1.4, 0.03); // deer blood in the snow
    // ---------- east side ----------
    B.house(13, 14, { sx: 9, sz: 12, h: 4.5, face: '-x', color: 0x5a2420, roof: false, lit: 1, winW: 1.6, winH: 1.2 });
    B.signText("EBNER'S DINER", 4.2, 0.8, 8.46, 3.7, 14, -Math.PI / 2, { color: '#ff7a5a', shadow: true });
    B.signText('OPEN · FREE STEW', 2.4, 0.4, 8.45, 2.6, 17.6, -Math.PI / 2, { color: '#ffcf86', size: 0.6, shadow: true });
    B.light(7.4, 2.6, 14, 0xffb070, 10, 10);
    for (const [cx, cz, cy] of [[10.6, 6.8, 0], [11.5, 6.6, 0], [11.0, 6.7, 0.5]]) B.box(0.8, 0.5, 0.6, 0x5a4a30, cx, cy, cz, { collide: cy === 0 });
    B.box(0.3, 0.02, 0.22, 0xd8d2c0, 10.6, 0.51, 6.8, { rough: 1 });
    B.car(12.4, 2.0, { color: 0x7a7a74, ry: Math.PI / 2 });
    B.signText("EBNER'S", 1.4, 0.3, 12.4, 0.9, 3.02, 0, { color: '#6a1a14', glow: false, size: 0.8 });
    B.house(13, 27, { sx: 8, sz: 7, h: 5, face: '-x', color: 0x33302c, roofColor: snowRoof, lit: 0.1 });

    // ---------- Walt's house (walk-in, built by hand) ----------
    const HX0 = 10.5, HX1 = 18.5, HZ0 = -18, HZ1 = -10, HH = 3.2, T = 0.25, DZ0 = -14.6, DZ1 = -13.4, DH = 2.2, hc = 0x4a3a2c;
    B.box(T, HH, DZ0 - HZ0, hc, HX0 + T / 2, 0, (HZ0 + DZ0) / 2, { collide: true });
    B.box(T, HH, HZ1 - DZ1, hc, HX0 + T / 2, 0, (DZ1 + HZ1) / 2, { collide: true });
    B.box(T, HH - DH, DZ1 - DZ0, hc, HX0 + T / 2, DH, (DZ0 + DZ1) / 2);
    B.box(T, HH, HZ1 - HZ0, hc, HX1 - T / 2, 0, (HZ0 + HZ1) / 2, { collide: true });
    B.box(HX1 - HX0, HH, T, hc, (HX0 + HX1) / 2, 0, HZ0 + T / 2, { collide: true });
    B.box(HX1 - HX0, HH, T, hc, (HX0 + HX1) / 2, 0, HZ1 - T / 2, { collide: true });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 2.2, 4), B.mat(snowRoof)); roof.rotation.y = Math.PI / 4; roof.scale.set((HX1 - HX0) * 0.76, 1, (HZ1 - HZ0) * 0.76); roof.position.set((HX0 + HX1) / 2, HH + 1.1, (HZ0 + HZ1) / 2); roof.castShadow = true; api.scene.add(roof);
    for (const wz of [-16.6, -11.4]) { const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.0), B.mat(0x0b0e13, { rough: 0.25, metal: 0.6 })); wm.position.set(HX0 - 0.02, 1.6, wz); wm.rotation.y = -Math.PI / 2; api.scene.add(wm); }
    B.box(1.6, 0.25, 2.2, 0x3a2e24, HX0 - 0.8, 0, -14); // porch step
    const room = new THREE.Mesh(new THREE.BoxGeometry(HX1 - HX0 - 2 * T, HH - 0.05, HZ1 - HZ0 - 2 * T), new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 0.85, side: THREE.BackSide }));
    room.position.set((HX0 + HX1) / 2, (HH - 0.05) / 2, (HZ0 + HZ1) / 2); room.receiveShadow = true; room.userData.dynamic = true; api.scene.add(room);
    // door (locked until Walt goes to the meeting)
    const hdoor = new THREE.Group(); hdoor.position.set(HX0, 0, DZ1); api.scene.add(hdoor);
    B.box(0.08, DH - 0.02, 1.18, 0x2a1c12, -0.04, 0, -0.6, { parent: hdoor });
    B.box(0.04, 0.04, 0.12, 0x9a8a60, -0.1, 1.0, -1.05, { parent: hdoor, metal: 0.9 });
    const doorBlock = { x0: HX0 - 0.15, x1: HX0 + 0.3, z0: DZ0, z1: DZ1 };
    api.colliders.push(doorBlock);
    let doorOpen = 0;
    // inside: bare bulb
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd8a0 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), bulbMat); bulb.position.set(14.4, 2.75, -14); bulb.userData.dynamic = true; api.scene.add(bulb);
    B.box(0.01, 0.4, 0.01, 0x111111, 14.4, 2.8, -14, { shadow: false });
    const bulbLight = B.light(14.4, 2.6, -14, 0xffd0a0, 5, 9);
    // chest freezer
    B.box(1.5, 0.85, 0.75, 0xc8ccc8, 16.9, 0, -16.9, { collide: true, metal: 0.3, rough: 0.4 });
    const lid = new THREE.Group(); lid.position.set(16.9, 0.86, -17.27); api.scene.add(lid);
    B.box(1.52, 0.07, 0.77, 0xd8dcd8, 0, 0, 0.385, { parent: lid, metal: 0.3, rough: 0.4 });
    // dinner table set for five
    B.box(2.2, 0.06, 0.95, 0x3a2416, 14.4, 0.74, -14.4, { collide: true });
    for (const [lx, lz] of [[13.4, -14.8], [15.4, -14.8], [13.4, -14.0], [15.4, -14.0]]) B.box(0.06, 0.74, 0.06, 0x2a1a10, lx, 0, lz);
    const seats = [[13.5, -15.3, 0], [14.4, -15.3, 0], [15.3, -15.3, 0], [13.5, -13.5, Math.PI], [14.4, -13.5, Math.PI]];
    const names = ['NELL', 'GUS', 'TOBY', '', ''];
    seats.forEach(([x, z, ry], i) => {
      B.box(0.42, 0.06, 0.42, 0x2a1a10, x, 0.45, z + (ry ? 0.2 : -0.2)); B.box(0.42, 0.5, 0.05, 0x2a1a10, x, 0.5, z + (ry ? 0.4 : -0.4));
      const plate = B.cyl(0.13, 0.11, 0.02, 0xe8e4da, x, 0.77, z + (ry ? -0.27 : 0.27), { seg: 14 });
      B.decal((g, w, h) => { g.fillStyle = '#ece6d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a2a1a'; g.font = `${h * 0.55}px "Special Elite", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; if (names[i]) g.fillText(names[i], w / 2, h / 2 + 2); }, 0.14, 0.05, x + 0.13, 0.81, z + (ry ? -0.16 : 0.16), { ry: ry ? 0 : Math.PI, res: 128 });
    });
    // wardrobe (hiding place)
    B.box(1.1, 2.0, 0.6, 0x24180f, 11.3, 0, -17.35, { collide: true });
    B.box(0.02, 1.8, 0.5, 0x120a06, 11.3, 0.1, -17.04);
    // stairs to the upper floor (hiding place underneath)
    for (let k = 0; k < 8; k++) B.box(0.45, 0.08, 1.0, 0x3a2a1c, 14.3 + k * 0.48, 0.32 + k * 0.36, -10.9);
    B.box(3.9, 0.12, 0.08, 0x2a1c12, 16.0, 1.6, -11.4).rotation.z = 0.64;
    B.collider(13.9, -11.55, 18.25, -10.25);
    B.box(0.9, 0.5, 0.6, 0x2a2a2a, 17.6, 0, -10.7); // boxes stored under the stairs
    // boiler + shelves for atmosphere
    B.cyl(0.35, 0.35, 1.6, 0x3a3a38, 17.8, 0, -13.8, { metal: 0.6, rough: 0.5 });
    B.box(0.4, 1.6, 1.4, 0x2e2216, 18.0, 0, -15.3, { collide: true });

    // ---------- south: the plow and the lake ----------
    B.car(3, -43.5, { color: 0x8a6a10, ry: 0 });
    B.box(2.6, 0.7, 0.25, 0x5a4a0a, 3, 0.15, -41.0, { metal: 0.5 });
    B.flat(0.25, 6, 0x22262a, 2.1, -48, 0.03); B.flat(0.25, 6, 0x22262a, 3.7, -48, 0.03);
    B.box(2.4, 2.2, 2.0, 0x4a3224, -8, 0, -55, { collide: true });
    B.signText('EBNER', 1.0, 0.3, -6.79, 1.7, -55, Math.PI / 2, { color: '#c8c0b0', glow: false, size: 0.7 });
    B.box(2.8, 0.15, 2.4, snowRoof, -8, 2.2, -55);

    // ---------- trees ----------
    const trees = [];
    for (let i = 0; i < 220; i++) {
      const x = (r() < 0.5 ? -1 : 1) * (20 + r() * 5), z = 30 - r() * 66;
      trees.push({ x, z, s: 0.8 + r() * 0.7 });
    }
    for (let i = 0; i < 70; i++) { const x = -24 + r() * 48, z = 31 + r() * 2; trees.push({ x, z, s: 0.8 + r() * 0.5 }); }
    for (let i = 0; i < 60; i++) { const x = -24 + r() * 48, z = -63 - r() * 3; trees.push({ x, z, s: 0.9 + r() * 0.6 }); }
    B.forest(trees, { snow: true });

    // lamps
    B.lamp(-5.6, 22); B.lamp(5.6, 8); B.lamp(-5.6, -4, { flicker: true }); B.lamp(5.6, -20); B.lamp(-5.6, -30); B.lamp(4.6, -38, { intensity: 18 });

    // ---------- people ----------
    B.car(-1.8, 25, { color: 0x1a1e24, ry: 0 });
    B.box(1.7, 0.08, 2.2, 0xc8d0d6, -1.8, 1.35, 24.8, { shadow: false }); // snow on your roof
    // Walt: big, warm, white beard, apron over flannel. Rigged so he can walk.
    const walt = B.person(7.7, 14.5, { build: 'heavy', old: true, coat: 0x6a2a22, coatLen: 'none', shirt: 0x5a2420, apron: 0xd8d2c4, pants: 0x2a2a2e, hair: 0xd8d6d0, hairStyle: 'bald', beard: true, glasses: true, skin: 0xb08a74, arms: 'down', ry: -Math.PI / 2, rig: true });
    walt.userData.noCull = true;
    const ruth = B.person(-7.7, 2, { body: 'female', coat: 0x3a4a5a, coatLen: 'long', shirt: 0x7a7a78, pants: 0x22222a, hat: 'beanie', hatColor: 0x6a2a2a, hair: 0x5a3a24, hairStyle: 'long', scarf: 0x8a7a60, skin: 0xa88270, arms: 'hug', ry: Math.PI / 2 });
    B.person(-7.6, -9.4, { build: 'heavy', coat: 0x2a3a4a, coatLen: 'none', shirt: 0x2a3a4a, pants: 0x2a3a4a, hat: 'beanie', hatColor: 0x2a2a2a, hair: 0xb89a6a, beard: true, skin: 0xb08a74, arms: 'pockets', ry: Math.PI / 2 });
    B.person(-6.3, -30.6, { build: 'thin', coat: 0x4a4228, coatLen: 'long', shirt: 0x3a2a1a, pants: 0x2a261c, hat: 'fedora', hatColor: 0x3a2a1a, hair: 0x2a2018, beard: 'stubble', skin: 0x9a7a60, arms: 'hug', ry: Math.PI / 2 });
    // his flashlight for the search
    const wFlash = new THREE.SpotLight(0xffe6b0, 0, 13, 0.42, 0.5, 1.4);
    const wTarget = new THREE.Object3D(); api.scene.add(wFlash, wTarget); wFlash.target = wTarget;

    // ---------- interactions ----------
    api.interact({ pos: [7.7, 1.5, 14.5], label: 'Talk to Walt', cond: () => !api.flags.meeting, use: () => api.talk(W_WALT) });
    api.interact({ pos: [-7.4, 1.5, 17.6], label: 'Talk to Walt', cond: () => api.flags.meeting && !api.flags.hidePhase && !api.flags.escaped, use: () => api.talk(W_WALT) });
    api.interact({ pos: [-7.7, 1.5, 2], label: 'Talk to Ruth Harmon', use: () => api.talk(W_RUTH) });
    api.interact({ pos: [-7.6, 1.5, -9.4], label: 'Talk to Dag', use: () => api.talk(W_DAG) });
    api.interact({ pos: [-6.3, 1.5, -30.6], label: 'Talk to Silas Crowe', use: () => api.talk(W_SILAS) });
    api.interact({ pos: [-1.8, 1.2, 25], radius: 3, label: 'Case board (car)', cond: () => !api.flags.hidePhase, use: () => api.board() });
    api.interact({ pos: [-8.1, 1.6, 12.5], radius: 2.4, glint: true, label: 'Read the missing posters', cond: () => !api.has('posters'),
      use: () => api.inspect({ title: 'Town hall notice board', text: ['Three faces, the paper stiff with frost. NELL HARMON, 34. GUS LINDQVIST, 58. TOBY REESE, 19.', 'Under them, someone has pinned a fourth sheet. It is blank.', 'Nobody will say who put it there.'], onClose: () => api.give('posters') }) });
    api.interact({ pos: [-6.0, 1.0, -33.5], radius: 2.4, glint: true, label: "Look in Silas's shed", cond: () => !api.has('tags'),
      use: () => api.inspect({ title: "Silas's shed", text: ['The blood in the snow outside leads to a chest freezer and two deer hanging from the rafters.', 'Every package in the freezer is tagged with a state game number and a date. Venison. Elk. All of it animal, all of it logged.', 'Whatever Silas is, he is careful about the law.'], onClose: () => api.give('tags') }) });
    api.interact({ pos: [3, 1.2, -40.6], radius: 2.8, glint: true, label: "Examine Gus's plow", cond: () => !api.has('plow'),
      use: () => api.inspect({ title: "Gus's plow", text: ['The cab door hangs open. The keys are still in it. The engine has been cold for days.', 'Behind it, the tracks of a smaller vehicle pulled up close, then turned back toward town.', 'Frozen into the snow by the cab step: a paper napkin with a little red logo. EBNER\'S.'], onClose: () => api.give('plow') }) });
    api.interact({ pos: [10.4, 1.0, 6.4], radius: 2.2, glint: true, label: 'Look at the delivery crates', cond: () => !api.has('ledger'),
      use: () => api.inspect({ title: 'Behind the diner', text: ['Empty delivery crates, drifted with snow. A clipboard is wired to the top one.', 'PROVISIONS. Last delivery: Dec 11. Beef: 0. Pork: 0. Chicken: 0, as of Dec 14.', 'Every night since, the board out front has said FREE STEW.'], onClose: () => api.give('ledger') }) });
    api.interact({ pos: [-6.6, 1.2, -55], radius: 2.4, glint: true, label: 'Look inside the ice hut', cond: () => !api.has('liftpass'),
      use: () => api.inspect({ title: 'Ice-fishing hut', text: ['EBNER, painted on the door. Inside: an auger, a tackle box, a stool.', 'Frozen into the floor by the fishing hole, as if it was dropped and the water froze over it: a ski-lift pass. TOBY REESE.'], onClose: () => api.give('liftpass') }) });
    // Walt's house
    api.interact({
      pos: [HX0 - 0.3, 1.5, -14], radius: 2.4, label: () => (api.flags.meeting ? "Walt's house" : "Walt's house (locked)"),
      cond: () => doorOpen === 0,
      use: () => {
        if (!api.flags.meeting) { api.inspect({ title: "Walt's house", text: ['The little house behind the diner. Walt\'s. The lights are off and the door is locked.', 'You would need a very good reason to go in without him.'] }); return; }
        api.sound.door(); doorOpen = 0.001; api.flags.houseOpen = true;
        const i = api.colliders.indexOf(doorBlock); if (i >= 0) api.colliders.splice(i, 1);
      },
    });
    api.interact({ pos: [16.9, 1.0, -16.4], radius: 2.0, glint: true, label: 'Open the chest freezer', cond: () => doorOpen > 0 && !api.has('freezer') && !api.flags.hidePhase,
      use: () => { api.sound.lid(); lidOpen = 0.001; api.inspect({ title: 'The chest freezer', text: ['Under a skin of frost: packages wrapped in butcher paper, tied with string, stacked neatly.', 'Each one is labelled in the same careful hand. Initials and a date.', 'N.H. 12/13.   G.L. 12/17.   T.R. 12/20.', 'There is a lot of room left.'], onClose: () => { api.give('freezer'); checkHide(); } }); } });
    api.interact({ pos: [14.4, 1.0, -14.4], radius: 2.0, glint: true, label: 'Look at the table', cond: () => doorOpen > 0 && !api.has('table') && !api.flags.hidePhase,
      use: () => api.inspect({ title: 'The dinner table', text: ['Set for five, with the good plates. The kind you keep for guests.', 'A place card at every seat, in the same neat hand: NELL. GUS. TOBY.', 'Two cards are blank. On one of them, a pencil has started a letter and stopped.'], onClose: () => { api.give('table'); checkHide(); } }) });
    // hiding places (only while he is coming)
    const SPOTS = {
      wardrobe: { x: 11.3, z: -17.05, eye: 1.6, exit: [12.1, -16.3], slats: true, label: 'Hide in the wardrobe' },
      stairs: { x: 17.4, z: -11.0, eye: 0.78, exit: [16.4, -12.4], slats: false, label: 'Crawl under the stairs' },
    };
    for (const [k, s] of Object.entries(SPOTS)) {
      api.interact({ pos: [s.x + (k === 'stairs' ? -0.8 : 0.4), 1.0, s.z + (k === 'stairs' ? -1.0 : 0.6)], radius: 2.2, label: s.label, cond: () => api.flags.hidePhase === 'countdown' && !hide.spot, use: () => enterHide(k) });
    }

    // ---------- the town meeting: Walt leaves the diner ----------
    let lidOpen = 0;
    api.anims.push((dt) => {
      const p = api.player; api.weather(!(p.x > HX0 + 0.1 && p.x < HX1 && p.z > HZ0 && p.z < HZ1));
      if (doorOpen > 0 && doorOpen < 1) { doorOpen = Math.min(1, doorOpen + dt * 0.7); hdoor.rotation.y = -1.6 * (1 - Math.pow(1 - doorOpen, 3)); }
      if (lidOpen > 0 && lidOpen < 1) { lidOpen = Math.min(1, lidOpen + dt * 0.8); lid.rotation.x = -1.2 * lidOpen; }
      if (!api.flags.meeting && api.has('ledger') && (api.has('liftpass') || api.has('van3')) && api.playing()) {
        api.flags.meeting = true;
        walt.position.set(-7.4, 0, 17.6); walt.rotation.y = Math.PI / 2;
        api.sound.bell();
        api.toast('A bell rings. Town meeting at the hall. Walt has locked up the diner and gone.');
        api.refresh();
      }
    });

    // ---------- hide from Walt ----------
    const hide = { phase: null, t: 0, spot: null, breath: 1, gasp: 0, wp: 0, pause: 0, phaseWalk: 0, said: {}, upT: 0 };
    const WP = [
      { x: 9.4, z: -14, pause: 0.3 }, { x: 11.6, z: -14, pause: 1.6, say: 2 }, { x: 14.3, z: -15.8, pause: 2.2, say: 3 },
      { x: 16.6, z: -16.2, pause: 2.4 }, { x: 12.2, z: -16.3, pause: 3.6, say: 4, near: 'wardrobe' }, { x: 14.8, z: -12.3, pause: 1.4 },
      { x: 16.5, z: -11.95, pause: 3.6, say: 5, near: 'stairs' }, { x: 13.6, z: -12.6, pause: 1.2 }, { x: 14.1, z: -11.6, pause: 0.2, up: true },
    ];
    function checkHide() {
      if (api.has('freezer') && api.has('table') && !api.flags.hidePhase && !api.flags.escaped) startHide(true);
    }
    const headSweep = B.light(5, 1.3, -6, 0xfff0d0, 0, 18);
    function startHide(first) {
      api.flags.hidePhase = 'countdown';
      Object.assign(hide, { t: first ? 14 : 11, spot: null, breath: 1, gasp: 0, wp: 0, pause: 0, said: {}, upT: 0 });
      walt.visible = false; walt.userData.noLook = true; wFlash.intensity = 0;
      if (first) {
        api.caption(C(0).text, C(0).vo, 3000);
        api.sound.at([7, 1, -8], () => api.sound.car());
        let s = 0; const sweep = (dt) => { s += dt; headSweep.pos.set(5 + s * 1.5, 1.3, -6 - s * 6); headSweep.cur = s < 2.5 ? 30 : 0; return s > 2.5; };
        const fn = (dt) => { if (sweep(dt)) api.anims.splice(api.anims.indexOf(fn), 1); }; api.anims.push(fn);
        setTimeout(() => { if (api.flags.hidePhase === 'countdown') api.caption(C(1).text, C(1).vo, 3000); }, 3200);
      }
      api.refresh();
    }
    function enterHide(k) {
      const s = SPOTS[k]; hide.spot = k;
      api.freeze(true); api.setEye(s.eye);
      const lx = k === 'stairs' ? 13.0 : 12.4, lz = k === 'stairs' ? -14.4 : -13.6; // look between the door and the table
      api.setPlayer(s.x, s.z, Math.atan2(-(lx - s.x), -(lz - s.z)), k === 'stairs' ? 0.05 : -0.05);
      api.sound.door();
    }
    function caught(why) {
      hide.phase = null; api.flags.hidePhase = 'caught';
      api.danger(0); api.jolt('red'); api.shake(1); api.sound.stinger(); api.sound.gasp();
      api.hideHud(null); wFlash.intensity = 0;
      api.blackout(why, 2400, () => {
        api.freeze(false); api.setEye(1.65);
        api.setPlayer(14.4, -12.8, Math.PI, 0);
        startHide(false);
        api.caption('He is coming back up the steps. HIDE.', null, 2500);
      });
    }
    function escape() {
      api.flags.hidePhase = null; api.flags.escaped = true;
      const s = SPOTS[hide.spot]; hide.spot = null;
      api.hideHud(null); api.danger(0); wFlash.intensity = 0; walt.visible = false;
      api.freeze(false); api.setEye(1.65); api.setPlayer(s.exit[0], s.exit[1], Math.PI / 2, 0);
      api.toast('He is upstairs. Get out quietly.');
      api.refresh();
    }
    const tv = new THREE.Vector3();
    api.anims.push((dt) => {
      const ph = api.flags.hidePhase;
      if (ph !== 'countdown' && ph !== 'search') return;
      if (api.paused() || api.uiOpen()) return;
      if (!hide.spot && !api.playing()) return;
      // ----- breath (only matters while hidden) -----
      if (hide.spot) {
        const holding = api.holdingBreath() && hide.gasp <= 0;
        if (holding) hide.breath = Math.max(0, hide.breath - dt / 10); else hide.breath = Math.min(1, hide.breath + dt / 3);
        if (holding && hide.breath <= 0) { hide.gasp = 1.4; api.sound.gasp(); }
        hide.gasp = Math.max(0, hide.gasp - dt);
        const text = hide.gasp > 0 ? 'You gasp for air…' : holding ? 'Holding your breath…' : (api.touch ? 'Hold the button to hold your breath' : 'Hold SPACE to hold your breath');
        api.hideHud({ text, breath: hide.breath, slats: SPOTS[hide.spot].slats });
        hide.holding = holding;
      }
      if (ph === 'countdown') {
        hide.t -= dt;
        if (!hide.spot) api.hideHud({ text: `HIDE. ${Math.max(0, Math.ceil(hide.t))}` });
        if (hide.t <= 0) {
          api.flags.hidePhase = 'search'; api.refresh();
          walt.visible = true; walt.position.set(9.4, 0, -14); walt.rotation.y = Math.PI / 2;
          api.sound.at([10.5, 1.5, -14], () => api.sound.door());
          if (!hide.spot) { caught('He was standing in the doorway. Smiling.'); return; }
        }
        return;
      }
      // ----- search: Walt walks his route with a flashlight -----
      const w = WP[hide.wp];
      if (hide.upT > 0) {
        hide.upT += dt; walt.position.x += dt * 1.0; walt.position.z += (-10.95 - walt.position.z) * Math.min(1, dt * 2);
        walt.position.y = Math.max(0, Math.min(2.9, (walt.position.x - 14.1) * 0.75));
        B.gait(walt, hide.phaseWalk += dt * 4, 0.8);
        if (walt.position.x > 17.6) { walt.visible = false; wFlash.intensity = 0; }
        if (hide.upT > 1 && !hide.said.up) { hide.said.up = true; api.caption(C(6).text, C(6).vo, 3500); }
        if (hide.upT > 5.5) escape();
        return;
      }
      tv.set(w.x - walt.position.x, 0, w.z - walt.position.z);
      const d = tv.length();
      if (d > 0.05) {
        const step = Math.min(d, 1.05 * dt); tv.multiplyScalar(step / d); walt.position.add(tv);
        walt.rotation.y = Math.atan2(w.x - walt.position.x + tv.x, w.z - walt.position.z + tv.z);
        hide.phaseWalk += step * 3.2; B.gait(walt, hide.phaseWalk, 1);
      } else {
        B.gait(walt, 0, 0);
        if (w.say !== undefined && !hide.said[hide.wp]) { hide.said[hide.wp] = true; api.caption(C(w.say).text, C(w.say).vo, 3200); }
        hide.pause += dt;
        const extra = w.near && w.near === hide.spot ? 1.0 : 0; // he lingers by the place you are hiding
        if (hide.pause > w.pause + extra) { hide.pause = 0; hide.wp++; if (WP[hide.wp] && WP[hide.wp].up) { hide.upT = 0.001; } }
      }
      // flashlight from his chest, sweeping
      const sweep = Math.sin(api.player.x + performance.now() / 700) * 0.5;
      const fa = walt.rotation.y + sweep;
      wFlash.position.set(walt.position.x + Math.sin(walt.rotation.y) * 0.3, 1.25 + walt.position.y, walt.position.z + Math.cos(walt.rotation.y) * 0.3);
      wTarget.position.set(wFlash.position.x + Math.sin(fa) * 4, 0.6, wFlash.position.z + Math.cos(fa) * 4);
      wFlash.intensity = 40;
      // can he hear you?
      const s = SPOTS[hide.spot];
      const dist = Math.hypot(walt.position.x - s.x, walt.position.z - s.z);
      api.danger(1 - dist / 6);
      if (dist < 2.4 && (!hide.holding || hide.gasp > 0)) { caught(hide.gasp > 0 ? 'He heard you gasp.' : 'He heard you breathing.'); return; }
      if (dist < 3.8 && hide.gasp > 0) { caught('He heard you gasp.'); return; }
      hide.beat = (hide.beat || 0) - dt; if (hide.beat <= 0) { hide.beat = 0.35 + dist * 0.12; api.sound.heartbeat(1); }
      hide.step = (hide.step || 0) - dt; if (hide.step <= 0 && d > 0.05) { hide.step = 0.55; api.sound.at(walt.position, () => api.sound.step(false)); }
    });
    api.sound.loopAt([8.4, 3.7, 14], 'hum');
    api.onRestore(() => {
      if (api.flags.meeting) { walt.position.set(-7.4, 0, 17.6); walt.rotation.y = Math.PI / 2; }
      if (api.flags.houseOpen) { doorOpen = 1; hdoor.rotation.y = -1.6; const i = api.colliders.indexOf(doorBlock); if (i >= 0) api.colliders.splice(i, 1); }
      if (api.has('freezer')) { lidOpen = 1; lid.rotation.x = -1.2; }
      if (api.flags.escaped) walt.visible = false;
    });
    api.ambience({ zone: () => 'town' });
  },
};

const W_WALT = {
  id: 'walt', name: 'Walt Ebner',
  intro: ['There you are. You must be the detective they sent up before the pass closed.', "Walt Ebner. This is my place. You look frozen through. Stew's on the house. It's on the house for everybody, till the plows come."],
  topics: [
    { q: 'Tell me about the missing.', a: ['Nell Harmon waited tables for me six years. Sweetest girl in town. Walked home on the twelfth and never got there.', 'Then Gus, who drives the plow. They found his truck on the lake road on the sixteenth. And the Reese boy, Toby, two nights ago.'], gives: 'walt_missing', then: (api) => { api.flags.walt = true; } },
    { q: 'How is everyone eating?', a: ['Not well. The store ran dry the first week. I had a full freezer, so I cook, and people come.', "Nobody should go hungry in a storm. That's just being neighbours."], gives: 'stew', then: (api) => { api.flags.walt = true; } },
    { q: 'Who should I talk to?', a: ["Nell's sister Ruth is in their apartment across the street. Dag at the garage towed Gus's plow.", "And Silas Crowe up at the lodge. I don't like to say it about a man, but he keeps a lot of knives and he doesn't keep friends."], then: (api) => { api.flags.walt = true; } },
    { q: 'Where were you the night Nell vanished?', req: 'calendar', a: ['Here. Closing up. She helped me with the dishes, then she walked home. I offered her a ride. I always offer.', "I keep thinking, if I'd made her take it..."], gives: 'walt_alibi' },
  ],
};
const W_RUTH = {
  id: 'ruth', name: 'Ruth Harmon',
  intro: ["You're the detective. Have you found anything? Anything at all?", 'Nell would have called me. She always called.'],
  topics: [
    { q: 'When did you last see Nell?', a: ['The morning of the twelfth. She said she would be late. She was helping Walt close up; he has been short-handed since the snow.'] },
    { q: 'Did she keep a calendar?', a: ['On the fridge. She wrote everything down. Here, take it. I cannot look at it any more.'], gives: 'calendar' },
    { q: 'Was anyone bothering her?', a: ['Silas Crowe asked her out twice. She said no. He stares, you know?', 'Walt looked after her. Walt looks after everyone.'], gives: 'silas_nell' },
  ],
};
const W_DAG = {
  id: 'dag', name: 'Dag Holm',
  intro: ['You want to know about the plow. Everybody wants to know about the plow.'],
  topics: [
    { q: "What happened to Gus's plow?", a: ["Nothing happened to it. That's the thing. Someone pulled the ignition fuse. The truck coasts to a stop, and Gus gets out to see why.", "You'd have to know where the fuse box is. You'd have to know he'd stop."], gives: 'fuse' },
    { q: 'Who knew he would stop?', req: 'fuse', a: ['Gus stopped for everybody. Especially the diner van. Walt has been driving stew out to the shut-ins every night of the storm.', 'Only thing moving on the lake road that week, besides the plow.'], gives: 'van3' },
    { q: 'Where were you that night?', a: ['Right here. Three skiers got stuck on the pass road; I towed them in and we played cards till morning. Ask them, they are still at the lodge.'], gives: 'dag_alibi' },
    { q: 'Anything else odd?', a: ['Silas came in Tuesday to sharpen his skinning knives. Said it was for deer. In this snow? Nothing is moving out there.'], gives: 'dag_silas' },
  ],
};
const W_SILAS = {
  id: 'silas', name: 'Silas Crowe',
  intro: ["You're on my land. Say what you came to say."],
  topics: [
    { q: 'Did you know Nell Harmon?', a: ['I asked her to dinner. Twice. She said no. Twice. That is the whole story, whatever Ruth told you.'] },
    { q: 'What about your knives?', a: ['I hunt. I dress what I hunt. Every carcass in my shed is tagged and logged with the state. Go look. I will wait.'], gives: 'silas_tags' },
    { q: 'Who buys your venison?', a: ['Everybody, this winter. Everybody but Walt.', 'He has never bought an ounce of game from me. Says he cannot stomach it. Yet that stew has had meat in it every day for nine days.'], gives: 'nogame' },
  ],
};
