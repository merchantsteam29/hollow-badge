// CASE 04: ASHGROVE, THE COLLECTOR. The finale, in the detective's own city.
import * as THREE from 'three';

const CAP = {
  call: [
    'COLLECTOR: Hello, Detective. Welcome home.',
    'COLLECTOR: I have arranged four pieces around your city. One from each of our friends, and one of you.',
    'COLLECTOR: Find them. Then come and see the rest of the collection. You are so close. You always were.',
  ],
  gallery: [
    'The bulbs over the glass cases go out, one by one.',
    'COLLECTOR: You were always going to be the last piece.',
    'Someone breathes, very close, behind your left shoulder.',
    'The lights come back. The fifth pedestal has a card now.',
  ],
};
const C = (scene, i) => ({ text: CAP[scene][i] });

export const ASHGROVE = {
  get captions() { return CAP; },
  get witnesses() { return [W_LUND, W_PELL, W_VANCE]; },
  id: 'ash',
  num: 'CASE 04',
  title: 'The Collector',
  place: 'Ashgrove',
  date: 'December 30th',
  blurb: 'Your city. Your street. Your door, standing open. Someone has been collecting killers, and saving the best piece for last.',
  locked: (results) => !['cmary', 'wing', 'harrow'].every((k) => results[k]),
  lockText: 'Finish Cases 01 to 03 to open this file.',
  intro: [
    'ASHGROVE',
    'DECEMBER 30TH — 11:58 PM',
    'You come home and your door is open.',
    'Nothing is taken. Something has been added: a new card on your case wall, with your photograph on it.',
    'EXHIBIT V.',
    'Down on the street, the payphone starts to ring.',
  ],
  fog: 0.05, rain: 0.13, spawn: { x: -3.8, z: 14, yaw: Math.PI * 0.6 }, stalkRate: 0.5,
  sky: { top: '#05040a', mid: '#100c16', horizon: '#241a26', glow: 'rgba(110,60,95,0.55)', clouds: 'rgba(70,55,75,0.45)' },
  required: ['typewriter', 'files', 'gallery'],
  proof: ['typewriter', 'files', 'gallery', 'subject', 'lund_lied', 'pell_cage'],
  culprit: 'lund',
  clues: {
    call: { type: 'statement', title: 'The payphone', text: 'A soft, polite voice: four pieces around your city, "one from each of our friends, and one of you." Then: come and see the rest of the collection.' },
    keychain: { type: 'evidence', title: 'Exhibit I: the keychain', text: "Lily Rowe's cat keychain, tied to a swing in Ashgrove Park with red string. Typed card: EXHIBIT I. The one you were too late for." },
    watch4: { type: 'evidence', title: 'Exhibit II: the watch', text: 'A cheap pocket watch on the clock tower steps, stopped at 2:13, tagged IV. Typed card: EXHIBIT II. The one who counted.' },
    placecard: { type: 'evidence', title: 'Exhibit III: the place card', text: 'On a booth table at the Nighthawk diner: a place card in neat hand, DETECTIVE. Typed card: EXHIBIT III. The one who set the table.' },
    poster: { type: 'evidence', title: 'Exhibit IV: the poster', text: 'The blank fourth poster from Harrow Falls, taped inside the laundromat window under your apartment. Your name is on it now. Typed card: EXHIBIT IV. The one who is still looking.' },
    notes: { type: 'evidence', title: 'The typed cards', text: 'Every exhibit card was typed on the same manual typewriter. Every lowercase e sits a little high, from a bent typebar.' },
    profile: { type: 'statement', title: 'Dr. Lund: a profile', text: 'Patient. Educated. Has met these men and listened to them. Has followed your career closely. "Probably someone you trust. They usually are."' },
    pell_cage: { type: 'statement', title: 'Pell: the basement', text: 'A woman rents the storage cage in the basement under your building. Paid a year in cash. Wears a man\'s hat.' },
    pell_keys: { type: 'statement', title: 'Pell: keys', text: 'Pell has a key to every door in the building, including yours.' },
    vance_letter: { type: 'statement', title: 'Vance: a letter', text: 'Vance got a letter ten years ago, after the Marsh case. A raised e in every word. He burned it.' },
    tab: { type: 'evidence', title: "Vance's bar tab", text: 'Last Call keeps a tab book. Vance has been on a stool until the 3 AM close every night this month, including every night a letter came.' },
    typewriter: { type: 'evidence', title: "Dr. Lund's typewriter", text: 'An old manual typewriter in her office. You type a line: the e jumps a little high, every time. It matches the exhibit cards exactly.' },
    files: { type: 'evidence', title: "Dr. Lund's files", text: 'VOSS, G. 2011, court-ordered therapy. CRANE, E. 1999, grief counselling. EBNER, W. correspondence, fourteen letters. Clinician on every file: I. Lund.' },
    lund_lied: { type: 'statement', title: 'Dr. Lund: caught lying', text: 'She said she never treated any of those men, never owned a typewriter, and has never been in your building. Her files, her typewriter and Pell say otherwise.' },
    gallery: { type: 'evidence', title: 'The collection', text: 'In the basement under your apartment: glass cases holding pieces of every case you worked, and a wall of photographs of you. At your desk. At the playground in Cmary. Asleep.' },
    subject: { type: 'evidence', title: 'Her notebook', text: '"SUBJECT: THE DETECTIVE." Pages of notes on how you grieve, how you sleep, which cases keep you up. Last entry: "Nearly complete."' },
  },
  suspects: [
    { id: 'lund', name: 'Dr. Iris Lund', role: 'Department psychologist · 52', notes: [
      { t: 'Debriefs you after every case. Kind. Always has time for you.' },
      { t: 'Her profile of the Collector: patient, educated, someone you trust.', req: 'profile' },
      { t: 'Her files: treated Voss in 2011, counselled Crane in 1999, wrote to Ebner.', req: 'files' },
      { t: 'Her old typewriter has a raised e.', req: 'typewriter' },
      { t: 'Caught lying about her patients, her typewriter and your building.', req: 'lund_lied' },
    ] },
    { id: 'vance', name: 'Ray Vance', role: 'Your old partner, retired · 63', notes: [
      { t: 'Bitter. Says those cases should have been his. Wears a long coat and a fedora.' },
      { t: 'Got a letter from the Collector ten years ago and burned it without telling anyone.', req: 'vance_letter' },
      { t: 'Knows every detail of your cases. He reads everything written about you.', req: 'call' },
      { t: 'His bar tab puts him at Last Call until 3 AM every night this month.', req: 'tab' },
      { t: 'Has never owned a typewriter, he says. "Haven\'t written a letter in twenty years."', req: 'notes' },
    ] },
    { id: 'pell', name: 'Mr. Pell', role: 'Your landlord · 70', notes: [
      { t: 'Runs the laundromat under your apartment. Keeps boxes of things people leave behind.' },
      { t: 'Has a key to every door in the building, including yours.', req: 'pell_keys' },
      { t: 'Rents the basement cage to strangers for cash, no questions.', req: 'pell_cage' },
      { t: 'The poster with your name was taped inside his window.', req: 'poster' },
      { t: 'The collection was in his basement.', req: 'gallery' },
    ] },
  ],
  objective(api) {
    const h = (id) => api.has(id), f = api.flags;
    const ex = ['keychain', 'watch4', 'placecard', 'poster'].filter(h).length;
    if (f.inGallery && !h('gallery')) return 'Look around. Don\'t touch anything.';
    if (f.inGallery && !h('subject')) return 'There is a notebook on the chair.';
    if (f.inGallery) return 'Get out. Back up the stairs.';
    if (!h('call')) return 'The payphone across the street is ringing. Answer it.';
    if (ex < 4) return `Find the four exhibits he left around Ashgrove. (${ex} / 4)`;
    if (!h('profile')) return 'Dr. Lund is still at the precinct. Ask her to profile him.';
    if (!h('typewriter')) return 'Every card was typed on the same machine. Find it.';
    if (!h('pell_cage')) return 'Someone has been using the basement under your building. Ask Pell.';
    if (!h('gallery')) return 'The basement under your apartment. Go down.';
    return 'Go to your car, parked outside your building. Charge the Collector.';
  },
  endings: {
    good: {
      title: 'THE LAST PIECE',
      text: [
        'You charge Dr. Iris Lund.',
        'They find her at dawn at her desk in the precinct, typing. The page in the machine reads: EXHIBIT V. COMPLETE.',
        'In her files: every killer she ever sat across from, and notes on what each might become if someone was patient and kind to them.',
        'Voss. Crane. Ebner. At the bottom, in pencil, a fourth name she never finished. Yours.',
        'You go home. You take the case wall down, card by card.',
        'You leave the red string where it is.',
      ],
    },
    weak: {
      title: 'NOT ENOUGH',
      text: [
        'You charge Dr. Iris Lund. You are right.',
        'Her lawyer calls it a fantasy: a lonely detective, an old typewriter, some files any psychologist would keep.',
        'She is released in the spring. She sends you a card at Christmas.',
        'It says: Not yet.',
      ],
    },
    bad: (s) => ({
      title: 'THE COLLECTION GROWS',
      text: [
        `You charge ${s.name}. The papers call it closure.`,
        'On New Year\'s Day there is a letter under your door. A raised e in every word.',
        '"Thank you for the gift, Detective. I will take good care of him."',
        'The next morning, your case wall has one more card on it. Your name, in pencil.',
      ],
    }),
  },
  interrogation: {
    id: 'lund_i', who: 'Dr. Iris Lund', role: 'lund',
    model: { body: 'female', coat: 0x2a2a30, coatLen: 'long', shirt: 0x8a8478, scarf: 0x6a2a2a, pants: 0x1e1e22, hair: 0x8a8278, hairStyle: 'bun', glasses: true, skin: 0xb8a090, arms: 'clasp' },
    room: { wall: 0x2e3a3a, lamp: 0xfff0d8 },
    spots: [{ pos: [4.6, 1.5, 3.2], label: 'Ask Dr. Lund to sit down for a few questions', cond: (api) => !api.flags.lundGone }],
    unlock: (api) => api.has('typewriter') && api.has('files'),
    intro: ['LUND: Of course. Sit. You look exhausted. You always do, after a case.', 'LUND: Ask me anything, Detective. I have always been honest with you.'],
    statements: [
      { t: "I've never treated any of those men. I haven't done clinical work in years.", press: ['LUND: I read about them, like everyone. Terrible men.'], lie: 'files',
        crack: ['LUND: ...Court-ordered sessions. Grief counselling. Some letters. That was years ago.', 'She takes off her glasses and cleans them, slowly.'], after: 'Her name is on the Voss, Crane and Ebner files.' },
      { t: "I don't own a typewriter. Nobody does anymore.", press: ['LUND: Everything is on the computer now. You know that.'], lie: 'typewriter',
        crack: ['LUND: It was my father\'s. It just sits there. It is decoration.', 'The e. You can almost hear it.'], after: 'Her typewriter\'s raised e matches every exhibit card.' },
      { t: "And I've never set foot in your building. I live across town.", press: ['LUND: Why would I have any reason to go there?'], lie: 'pell_cage',
        crack: ['LUND: A storage cage is not a crime, Detective.', 'She puts her glasses back on and smiles.'], after: 'Pell rents the basement cage to a woman in a man\'s hat.' },
      { t: 'I only ever wanted to help you. I always have.', press: ['LUND: Who else understands what you see? Who else has read every word of every one of your cases?'] },
    ],
    wrong: ['LUND: You are tired. You are seeing patterns.', 'LUND: That is not evidence, Detective. That is grief.', 'LUND: We have talked about this. About seeing things that are not there.'],
    fail: ['LUND: I think we should stop. You are not well.', 'She stands, buttons her coat, and leaves you alone in the room.'],
    done: ['For the first time tonight, she smiles at you properly. It is a warm smile.', 'LUND: You will want to see the collection. The basement door is open. It always was, for you.'],
    gives: 'lund_lied',
  },

  build(api) {
    const { B } = api;
    const r = B.rng(404);
    B.ground(0, -10, 120, 120, 0x0d0d0f, { map: 'cobble' });
    B.flat(10, 84, 0x121315, 0, -10, 0.02, { rough: 0.3, metal: 0.25, map: 'asphalt' });
    for (let z = 30; z > -52; z -= 4) B.flat(0.14, 1.8, 0x4d4a38, 0, z, 0.03);
    for (let i = 0; i < 18; i++) B.flat(0.8 + r() * 1.8, 0.6 + r() * 1.3, 0x090b0f, (r() - 0.5) * 8, 28 - r() * 76, 0.035, { rough: 0.05, metal: 0.9 });
    B.collider(-24, -60, -23, 34); B.collider(23, -60, 24, 34); B.collider(-24, 33, 24, 34); B.collider(-24, -61, 24, -60);
    const brick = [0x34221d, 0x2c2420, 0x302b27, 0x3a2622];
    const row = (x, z, sx, sz, face, o = {}) => B.house(x, z, { sx, sz, face, h: o.h || 9, color: o.color || brick[Math.floor(r() * brick.length)], lit: o.lit ?? 0.2, roof: false, winW: 0.9, winH: 1.4, tex: 'brick', ...o });
    // west: your building (laundromat below), the bar, the diner
    row(-11.75, 16, 12.5, 12, '+x', { h: 11, lit: 0.3 });
    B.signText('SUDS · 24H', 3, 0.6, -5.47, 3.0, 16, Math.PI / 2, { color: '#ff6ab0', shadow: true });
    B.light(-4.8, 2.6, 16, 0xff6ab0, 6, 8);
    row(-11.75, 0, 12.5, 12, '+x', { lit: 0.5 });
    B.signText('LAST CALL', 2.6, 0.6, -5.47, 3.4, 0, Math.PI / 2, { color: '#ffb35a', shadow: true });
    B.light(-4.8, 2.6, 0, 0xffa060, 5, 8);
    row(-11.75, -16, 12.5, 12, '+x', { lit: 1, h: 5 });
    B.signText('NIGHTHAWK DINER', 4, 0.6, -5.47, 3.6, -16, Math.PI / 2, { color: '#8ad8ff', shadow: true });
    B.light(-4.8, 2.4, -16, 0xa0d8ff, 6, 8);
    row(-11.75, -34, 12.5, 16, '+x');
    // east: payphone, precinct, park
    B.box(1.0, 2.3, 0.9, 0x2a3a4a, 6.1, 0, 12, { collide: true, metal: 0.5 });
    B.signText('PHONE', 0.8, 0.22, 5.58, 2.05, 12, -Math.PI / 2, { color: '#e8f0ff', size: 0.7 });
    row(11.75, 22, 12.5, 10, '-x');
    const pd = B.house(11.75, 4, { sx: 12.5, sz: 16, face: '-x', h: 9, color: 0x3a3836, lit: 0.5, roof: false, tex: 'stone' });
    B.signText('ASHGROVE POLICE DEPT', 5, 0.6, 5.46, 4.4, 4, -Math.PI / 2, { color: '#d8e4f0', size: 0.5 });
    for (let k = 0; k < 3; k++) B.box(3.2 - k * 0.4, 0.16, 0.6, 0x4a4844, 5.0 - k * 0.3, k * 0.16, 4);
    B.light(4.6, 3, 4, 0xd8e6ff, 6, 8);
    B.fence(6, -14, 20, -14); B.fence(6, -30, 20, -30); B.fence(20, -30, 20, -14);
    B.ground(13, -22, 14, 16, 0x0c100c, { map: 'grass' });
    B.box(0.1, 2.6, 0.1, 0x2a2c30, 11, 0, -21); B.box(0.1, 2.6, 0.1, 0x2a2c30, 13.5, 0, -21); B.box(2.6, 0.1, 0.1, 0x2a2c30, 12.25, 2.6, -21);
    const swing = new THREE.Group(); swing.position.set(12.25, 2.6, -21); api.scene.add(swing);
    B.box(0.02, 2.1, 0.02, 0x555555, -0.25, -2.1, 0, { parent: swing, shadow: false }); B.box(0.02, 2.1, 0.02, 0x555555, 0.25, -2.1, 0, { parent: swing, shadow: false });
    B.box(0.6, 0.05, 0.25, 0x3a1a1a, 0, -2.15, 0, { parent: swing });
    const keychain = B.box(0.06, 0.08, 0.02, 0x6a3a8a, 0.1, -1.9, 0.02, { parent: swing, emissive: 0x200a30 });
    let sw = 0; api.anims.push((dt) => { sw += dt; swing.rotation.x = Math.sin(sw * 0.8) * 0.18; });
    row(11.75, -40, 12.5, 14, '-x');
    // clock tower at the south end
    B.box(6, 14, 6, 0x2e2c2a, 0, 0, -50, { collide: true, map: 'stone' });
    B.decal((g, w, h) => { g.fillStyle = '#d8d2bc'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 7); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 6; g.stroke(); g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + w * 0.2, h / 2 + h * 0.06); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + w * 0.12, h / 2 - h * 0.35); g.stroke(); }, 2.4, 2.4, 0, 11, -46.98, { ry: 0, glow: true, res: 256 });
    for (let k = 0; k < 3; k++) B.box(6 - k * 0.6, 0.16, 0.6, 0x3a3836, 0, k * 0.16, -46.7 + k * 0.6 * 0 - k * 0.0);
    const watch = B.cyl(0.05, 0.05, 0.015, 0xc8a040, 1.5, 0.48, -46.6, { metal: 0.9, rough: 0.3 });
    // lamps
    B.lamp(-4.6, 22); B.lamp(4.6, 14); B.lamp(-4.6, 6); B.lamp(4.6, -6, { flicker: true }); B.lamp(-4.6, -22); B.lamp(4.6, -34); B.lamp(-4.6, -42);
    // your car
    B.car(-2.6, 20.5, { color: 0x1a1e24, ry: Math.PI, lightsOn: true }); // your car, parked outside your building
    // basement door in front of your building
    B.box(1.2, 0.5, 1.4, 0x2a2420, -4.9, 0, 10.6, { collide: true, metal: 0.4 });

    // ---- people ----
    const lund = B.person(4.6, 2.2, { body: 'female', coat: 0x2a2a30, coatLen: 'long', shirt: 0x8a8478, scarf: 0x6a2a2a, pants: 0x1e1e22, hair: 0x8a8278, hairStyle: 'bun', glasses: true, skin: 0xb8a090, arms: 'hug', ry: -Math.PI / 2 });
    B.person(-4.6, 13.2, { old: true, build: 'thin', coat: 0x4a4440, coatLen: 'none', shirt: 0x7a7468, apron: 0x6a7a8a, pants: 0x2a2a2a, hair: 0xb0aca4, hairStyle: 'bald', glasses: true, skin: 0xa88a78, arms: 'pockets', ry: Math.PI / 2 });
    B.person(-4.7, 1.8, { build: 'heavy', old: true, coat: 0x2a2620, coatLen: 'long', shirt: 0x6a6a68, tie: 0x2a1414, pants: 0x1e1c1a, hat: 'fedora', hatColor: 0x1a1612, hair: 0x7a7470, beard: 'stubble', skin: 0x9a7a66, arms: 'pockets', ry: Math.PI / 2 });

    // ---- interactions ----
    const ringer = { on: true, t: 0 };
    api.anims.push((dt) => { if (!ringer.on || !api.playing()) return; ringer.t -= dt; if (ringer.t <= 0) { ringer.t = 3; api.sound.at([6.1, 1.6, 12], () => { api.sound.tone(880, 0.35, 0.18); api.sound.tone(990, 0.35, 0.12, 'sine', 0.42); }); } });
    api.interact({ pos: [5.6, 1.5, 12], radius: 2.4, glint: true, label: 'Answer the payphone', cond: () => !api.has('call'),
      use: () => {
        ringer.on = false;
        let i = 0; const next = () => { if (i >= CAP.call.length) { api.give('call'); return; } const c = C('call', i++); api.caption(c.text.replace(/^[A-Z]+:\s*/, ''), 4200); setTimeout(next, 4400); };
        api.sound.click(); next();
      } });
    api.interact({ pos: [-2.6, 1.2, 20.5], radius: 3.2, label: 'Case board (your car)', cond: () => !api.flags.inGallery, use: () => api.board() });
    api.interact({ pos: [4.6, 1.5, 2.2], label: 'Talk to Dr. Lund', cond: () => !api.flags.lundGone, use: () => api.talk(W_LUND) });
    api.interact({ pos: [-4.6, 1.5, 13.2], label: 'Talk to Mr. Pell', use: () => api.talk(W_PELL) });
    api.interact({ pos: [-4.7, 1.5, 1.8], label: 'Talk to Ray Vance', use: () => api.talk(W_VANCE) });
    const typed = (t) => `${t} The typed card is the same as all the others: every e a little high.`;
    const exhibitClose = (id) => () => { api.give(id); api.give('notes'); };
    api.interact({ pos: [12.25, 0.9, -21], radius: 2.4, glint: true, label: 'Something tied to the swing', cond: () => !api.has('keychain'),
      use: () => { keychain.visible = false; api.inspect({ title: 'Exhibit I', text: ["Tied to the swing with red string: a purple cat keychain, its ring snapped.", "Lily Rowe's. The one torn off her backpack in Cmary Town.", typed('EXHIBIT I. The one you were too late for.')], onClose: exhibitClose('keychain') }); } });
    api.interact({ pos: [1.5, 0.6, -46.4], radius: 2.2, glint: true, label: 'Something on the steps', cond: () => !api.has('watch4'),
      use: () => { watch.visible = false; api.inspect({ title: 'Exhibit II', text: ['A cheap pocket watch, stopped at 2:13. A paper tag on the crown: IV.', typed('EXHIBIT II. The one who counted.')], onClose: exhibitClose('watch4') }); } });
    api.interact({ pos: [-5.2, 1.2, -16], radius: 2.4, glint: true, label: 'Look through the diner window', cond: () => !api.has('placecard'),
      use: () => api.inspect({ title: 'Exhibit III', text: ['An empty booth with one place set. A clean plate, a folded napkin, and a place card in neat handwriting: DETECTIVE.', 'The waitress says a woman left it an hour ago and paid for a meal nobody ate.', typed('EXHIBIT III. The one who set the table.')], onClose: exhibitClose('placecard') }) });
    api.interact({ pos: [-5.2, 1.4, 18.4], radius: 2.2, glint: true, label: 'The poster in the laundromat window', cond: () => !api.has('poster'),
      use: () => api.inspect({ title: 'Exhibit IV', text: ['Taped inside the laundromat window, facing the street: a MISSING poster. The blank fourth sheet from the Harrow Falls notice board.', 'It is not blank any more. It has your name on it. Your photograph.', typed('EXHIBIT IV. The one who is still looking.')], onClose: exhibitClose('poster') }) });
    api.interact({ pos: [-5.2, 1.2, -1.8], radius: 2, label: "Ask to see Vance's tab", cond: () => !api.has('tab'),
      use: () => api.inspect({ title: 'Last Call: the tab book', text: ['Sal the bartender turns the book around. RAY V. Every night this month. Every night closed out at 3 AM.', 'Including the nights the letters came.'], onClose: () => api.give('tab') }) });
    api.interact({ pos: [5.2, 1.4, 7.4], radius: 2.2, glint: true, label: "Dr. Lund's office: the typewriter", cond: () => api.flags.officeOpen && !api.has('typewriter'),
      use: () => api.inspect({ title: "Dr. Lund's office", text: ['A neat office. A box of tissues for patients. On a side table, an old manual typewriter with a sheet still in it.', 'You type a line: the quick brown fox. Every e jumps a little high, from a bent typebar.', 'It is the same machine. You are almost sure. Then you hold a card up to the page, and you are sure.'], onClose: () => api.give('typewriter') }) });
    api.interact({ pos: [5.2, 1.4, 0.6], radius: 2.2, glint: true, label: "Dr. Lund's office: the file cabinet", cond: () => api.flags.officeOpen && !api.has('files'),
      use: () => api.inspect({ title: 'The file cabinet', text: ['Old paper files, the kind the department scanned years ago and told everyone to shred.', 'VOSS, G. 2011. Court-ordered therapy. CRANE, E. 1999. Grief counselling. EBNER, W. Correspondence, fourteen letters.', 'Clinician on every file: I. Lund.'], onClose: () => api.give('files') }) });

    // ---- the gallery: a room under your building, built far away and reached by the stairs ----
    const GX = 400, GZ = 400;
    const gal = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 8), new THREE.MeshStandardMaterial({ color: 0x2a1c1c, roughness: 0.9, side: THREE.BackSide }));
    gal.position.set(GX, 1.5, GZ); gal.userData.noCull = true; api.scene.add(gal);
    B.collider(GX - 6.1, GZ - 4.1, GX + 6.1, GZ - 4); B.collider(GX - 6.1, GZ + 4, GX + 6.1, GZ + 4.1); B.collider(GX - 6.1, GZ - 4.1, GX - 6, GZ + 4.1); B.collider(GX + 6, GZ - 4.1, GX + 6.1, GZ + 4.1);
    const glass = new THREE.MeshStandardMaterial({ color: 0x9ab0c0, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 });
    const pedestals = [[-4, -2.6, 0x6a3a8a, 'I'], [-1.5, -2.6, 0xc8a040, 'II'], [1, -2.6, 0xe8e2d4, 'III'], [3.5, -2.6, 0xd8d0c0, 'IV'], [0, 2.4, 0x101010, 'V']];
    const galLights = [];
    for (const [px, pz, col, num] of pedestals) {
      B.box(0.7, 1.0, 0.7, 0x1a1414, GX + px, 0, GZ + pz, { collide: true });
      if (num !== 'V') { B.box(0.18, 0.12, 0.12, col, GX + px, 1.02, GZ + pz); const gb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), glass); gb.position.set(GX + px, 1.3, GZ + pz); api.scene.add(gb); }
      galLights.push(B.light(GX + px, 2.6, GZ + pz, 0xfff0d0, 0, 4));
    }
    const card5 = B.decal((g, w, h) => { g.fillStyle = '#d8d2c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1a1a'; g.font = `${h * 0.22}px "Special Elite", monospace`; g.textAlign = 'center'; g.fillText('EXHIBIT V', w / 2, h * 0.4); g.fillText('THE DETECTIVE', w / 2, h * 0.75); }, 0.5, 0.25, GX, 1.06, GZ + 2.4 - 0.36, { ry: Math.PI, res: 256 });
    card5.rotation.x = -0.4; card5.visible = false;
    // the wall of photographs
    B.decal((g, w, h) => {
      g.fillStyle = '#1a1212'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { const x = 10 + (i % 10) * (w / 10), y = 10 + Math.floor(i / 10) * (h / 4); g.fillStyle = '#b8b0a0'; g.fillRect(x, y, w / 10 - 18, h / 4 - 22); g.fillStyle = '#2a2622'; g.fillRect(x + 6, y + 6, w / 10 - 30, h / 4 - 40); g.fillStyle = '#4a4440'; g.beginPath(); g.arc(x + w / 20 - 8, y + h / 9, 10 + (i % 3) * 3, 0, 7); g.fill(); g.fillRect(x + w / 20 - 18, y + h / 9 + 8, 20, 22); }
      g.strokeStyle = '#8a1010'; g.lineWidth = 3; for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.lineTo(Math.random() * w, Math.random() * h); g.stroke(); }
    }, 7.5, 2.2, GX, 1.5, GZ - 3.97, { ry: 0, res: 1024 });
    B.box(0.5, 0.45, 0.5, 0x2a1a10, GX, 0, GZ + 0.4, { collide: true }); B.box(0.5, 0.5, 0.06, 0x2a1a10, GX, 0.45, GZ + 0.62);
    B.box(0.22, 0.03, 0.3, 0x3a1010, GX, 0.45, GZ + 0.35);
    const collector = B.person(GX + 5, GZ + 3, { body: 'female', coat: 0x0b0b0e, coatLen: 'long', pants: 0x0b0b0e, hat: 'fedora', hatColor: 0x050506, glasses: true, glint: true, hair: 0x8a8278, hairStyle: 'bun', skin: 0xb8a090, ry: -Math.PI * 0.75, idle: false, look: false, collide: false });
    collector.visible = false; collector.userData.noCull = true;

    const enterGallery = () => {
      api.flags.inGallery = true; api.weather(false);
      galLights.forEach((l) => { l.cur = 3; });
      api.setPlayer(GX - 4.5, GZ + 2.6, -Math.PI * 0.6, 0);
      api.refresh();
    };
    api.interact({ pos: [-4.4, 1, 10.6], radius: 2.2, label: () => (api.flags.basementOpen ? 'Go down to the basement' : 'Basement door (locked)'),
      cond: () => !api.flags.inGallery,
      use: () => {
        if (!api.flags.basementOpen) { api.inspect({ title: 'The basement door', text: ['A steel hatch in the sidewalk. Pell keeps it padlocked.', 'You hear something move down there. Then nothing.'] }); return; }
        api.sound.door();
        api.inspect({ title: 'The stairs', text: ['Concrete steps down under your own building. It is warmer than it should be. It smells of dust and lilies.', 'At the bottom, a light is on.'], onClose: enterGallery });
      } });
    api.interact({ pos: [GX, 1.4, GZ - 3.4], radius: 2.6, glint: true, label: 'Look at the photographs', cond: () => api.flags.inGallery && !api.has('gallery'),
      use: () => api.inspect({ title: 'The collection', text: ['Glass cases on pedestals, lit like a museum. In each one, a small thing from a case you worked.', 'And on the wall, forty photographs of you. At your desk. At the playground in Cmary. On the church steps in Wingintonn. Asleep in your own bed.', 'Red string runs between them, the way it runs on your own wall upstairs.'], onClose: () => { api.give('gallery'); maybeScare(); } }) });
    api.interact({ pos: [GX, 0.6, GZ + 0.4], radius: 2, glint: true, label: 'The notebook on the chair', cond: () => api.flags.inGallery && !api.has('subject'),
      use: () => api.inspect({ title: 'Her notebook', text: ['SUBJECT: THE DETECTIVE.', 'Pages and pages, in neat handwriting. How you grieve. How long you sit in the car before you go inside. Which cases keep you awake.', 'The last entry is from tonight: Nearly complete.'], onClose: () => { api.give('subject'); maybeScare(); } }) });
    api.interact({ pos: [GX - 5.4, 1.2, GZ + 3.2], radius: 2, label: 'Go back up the stairs', cond: () => api.flags.inGallery && api.flags.scared,
      use: () => { api.flags.inGallery = false; api.weather(true); galLights.forEach((l) => { l.cur = 0; }); api.setPlayer(-3.6, 10.6, Math.PI / 2, 0); api.refresh(); } });

    function maybeScare() {
      if (!api.has('gallery') || !api.has('subject') || api.flags.scared) return;
      api.flags.scared = true; api.flags.lundGone = true; lund.visible = false;
      const steps = [
        () => { galLights.forEach((l, i) => setTimeout(() => { l.cur = 0; api.sound.click(); }, 350 * i)); api.caption(C('gallery', 0).text, 3000); },
        () => { const p = api.player; api.sound.at([p.x + 0.8, 1.6, p.z + 0.8], () => api.sound.whisper()); api.caption(C('gallery', 1).text.replace(/^[A-Z]+:\s*/, ''), 3500); api.danger(0.6); },
        () => { const p = api.player; collector.position.set(p.x + 3.5, 0, p.z - 1); collector.rotation.y = Math.atan2(p.x - collector.position.x, p.z - collector.position.z); collector.visible = true; galLights[4].cur = 1.2; api.caption(C('gallery', 2).text, 2500); api.sound.heartbeat(5, 0.5); },
        () => { collector.visible = false; galLights.forEach((l) => { l.cur = 3; }); card5.visible = true; api.danger(0); api.caption(C('gallery', 3).text, 3500); api.sound.stinger(); api.refresh(); },
      ];
      steps.forEach((f, i) => setTimeout(f, 600 + i * 3200));
    }
    api.anims.push(() => { if (!api.flags.basementOpen && (api.has('lund_lied') || (api.has('pell_cage') && api.has('typewriter') && api.has('files')))) { api.flags.basementOpen = true; api.toast('The basement under your building. You know where she has been.'); api.refresh(); } if (api.flags.inGallery) api.weather(false); });
    api.onRestore(() => {
      if (api.has('call')) ringer.on = false;
      if (api.has('keychain')) keychain.visible = false;
      if (api.has('watch4')) watch.visible = false;
      if (api.flags.lundGone) lund.visible = false;
      if (api.flags.scared) card5.visible = true;
      if (api.flags.inGallery) { api.flags.inGallery = false; api.setPlayer(-3.6, 10.6, Math.PI / 2, 0); }
    });
    api.ambience({ zone: () => 'town' });
  },
};

const W_LUND = {
  id: 'lund', name: 'Dr. Iris Lund',
  intro: ['LUND: Detective. You came here instead of going home. I would have, too.', 'LUND: I heard about your apartment. I am so sorry. Sit with me a minute.'],
  topics: [
    { q: 'Can you profile him?', a: ['LUND: Patient. Educated. Someone who has met these men and listened to them, really listened.', 'LUND: Someone who has followed your career closely. Possibly someone you trust. They usually are.'], gives: 'profile' },
    { q: 'Did you know any of the killers?', a: ['LUND: I read about them, like everyone. Terrible men. I am glad you found them.'] },
    { q: 'Can I look around your office?', a: ['LUND: Of course. Use it as long as you like. I am going to stand out here and finish my cigarette.', 'LUND: The door is open. Through the window on the left.'], then: (api) => { api.flags.officeOpen = true; } },
  ],
};
const W_PELL = {
  id: 'pell', name: 'Mr. Pell',
  intro: ['PELL: Your door was open when I came up with the mail. I did not touch anything. I swear.'],
  topics: [
    { q: 'Did you see who broke in?', a: ['PELL: No. But somebody has been using the basement. I hear them at night, moving things. Humming.'] },
    { q: 'Who has access to the basement?', a: ['PELL: There is a storage cage down there I rent out. A woman. Paid a year up front, in cash.', 'PELL: Wears a man\'s hat. I thought it was a bit much, but she was very polite.'], gives: 'pell_cage' },
    { q: 'Do you have a key to my apartment?', a: ['PELL: I have a key to everything in this building. That is being a landlord, not a crime.'], gives: 'pell_keys' },
  ],
};
const W_VANCE = {
  id: 'vance', name: 'Ray Vance',
  intro: ['VANCE: Look who it is. The star.', 'VANCE: Three cases in a year. They gave you everything they never gave me.'],
  topics: [
    { q: 'Where have you been this month?', a: ['VANCE: Right here. Ask Sal, he keeps my tab. Every night till he throws me out at three.'] },
    { q: 'You dress like the man I keep seeing.', a: ['VANCE: Half the old cops in this city dress like it is 1955. Me included.', 'VANCE: You keep seeing a man in a hat? Get some sleep, kid.'] },
    { q: 'What do you know about the Collector?', a: ['VANCE: I know you are not the first one he has written to. I got a letter, ten years ago, after the Marsh case. A raised e in every word.', 'VANCE: I burned it. I thought it was a crank. I did not want it to be anything else.'], gives: 'vance_letter' },
  ],
};
