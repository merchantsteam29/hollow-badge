// The voice script: every line an actor can record, generated from the case data so
// record.html and the game always agree on line ids.
//   <witness>.intro.<n>       greeting lines           e.g. mom.intro.0
//   <witness>.t<topic>.<n>    answers to a question    e.g. mom.t2.1
//   <case>.intro.<n>          opening cards (narrator)
//   <case>.<scene>.<n>        cutscene captions        e.g. wing.morgue.3
//   <case>.good.<n> / <case>.bad.<suspect>.<n>         endings (narrator)
//   man.<sound>               non-verbal sounds for the man in the morgue

import { HOME_CAPTIONS } from './home.js';

export const ROLES = {
  narrator: { name: 'The Detective (narrator)', note: 'Tired, quiet, flat. A noir voice-over: you have seen too much and you do not sleep. Never shout. Read the place-and-date cards slowly.' },
  reyes: { name: 'Officer Dana Reyes', note: 'Young patrol officer, relieved the detective is here, trying to stay professional. Shaken underneath.' },
  mom: { name: 'Margaret Rowe', note: 'Lily\'s mother. Exhausted, barely holding together, hoping. Breaks a little on the last lines of each answer.' },
  walter: { name: 'Walter Pike', note: 'Old man at the bus stop. Slow, gravelly, lonely. Guilty that he did not do anything.' },
  denise: { name: 'Denise (grocery clerk)', note: 'Thirties, smoking on her break, shaky and fast-talking. Wants this to be over.' },
  holt: { name: 'Sergeant Holt', note: 'Big, tired, blunt veteran cop. Dry. In the arrest lines he is shouting commands, then quietly grim.' },
  mae: { name: 'Mae (bartender)', note: 'Bartender, tough, sharp-tongued, scared but will not show it.' },
  finch: { name: 'Abel Finch (watchmaker)', note: 'Thin, precise, slightly prickly old man who is tired of being suspected.' },
  jory: { name: 'Jory', note: 'Homeless man by the fire. Rough voice, nervous, ashamed of looking away.' },
  morrow: { name: 'Father Morrow', note: 'Elderly priest. Gentle, sorrowful, careful with his words, full of guilt.' },
  walt: { name: 'Walt Ebner (diner owner)', note: 'Sixties, warm, grandfatherly, the nicest man in town. Never sinister in his dialogue: kind, a little sad. In the house he speaks softly, almost tenderly, which is what makes it horrible.' },
  ruth: { name: 'Ruth Harmon', note: "Nell's older sister. Frightened, raw from not sleeping, clinging to hope." },
  dag: { name: 'Dag Holm (mechanic)', note: 'Practical, gruff Scandinavian mechanic. Talks about engines, not feelings.' },
  silas: { name: 'Silas Crowe (hunting guide)', note: 'Cold, defensive loner who knows the whole town suspects him. Short sentences.' },
  voss: { name: 'Gary Voss (interview room)', note: 'Thirties, sullen, monosyllabic. Defensive, then cornered. Never raises his voice.' },
  crane: { name: 'Dr. Elias Crane (interview room)', note: 'Sixties, educated, soft-spoken and amused. Grief underneath the calm. The more he loses, the quieter he gets.' },
  lund: { name: 'Dr. Iris Lund (department psychologist)', note: 'Fifties, warm, calm, a therapist\'s gentle voice. Never raises it. Even when caught, she sounds like she is taking care of you. The collector letters and phone call are also her, if one actor plays both.' },
  pell: { name: 'Mr. Pell (landlord)', note: 'Seventies, fussy, nervous, defensive about his building.' },
  vance: { name: 'Ray Vance (old partner)', note: 'Sixties, gravelly, bitter, drinking. Underneath it, scared for you.' },
  collector: { name: 'The Collector', note: 'Soft, polite, intimate, almost kind. Never threatening in tone. He believes he is your friend. Reads his letters slowly.' },
  man: { name: 'The man in the morgue', note: 'No words. Sounds only. The scarier and more wrong, the better. Record close to the mic.' },
};

const MAN = [
  { id: 'man.scream', text: '(A sudden raw shriek straight into the mic, like he is lunging at you. 1 to 2 seconds.)', where: 'Jumpscare at the morgue door' },
  { id: 'man.laugh', text: '(A low, wet laugh that will not stop, while he is being handcuffed. 4 to 6 seconds.)', where: 'Arrest' },
  { id: 'man.breath', text: '(Heavy, ragged breathing while running, like he is smiling. 2 to 4 seconds.)', where: 'During the chase (plays now and then)' },
  { id: 'man.chew', text: '(Slow, wet chewing and swallowing, close to the mic. Chew fruit or gum. 5 to 8 seconds.)', where: 'Inside the morgue' },
];

export const speakerOf = (text) => { const m = text.match(/^([A-Z]+):/); return m ? m[1].toLowerCase() : 'narrator'; };
export const stripSpeaker = (text) => text.replace(/^[A-Z]+:\s*/, '');

export function buildScript(CASES) {
  const out = [];
  for (const c of CASES) {
    c.intro.forEach((t, i) => out.push({ id: `${c.id}.intro.${i}`, role: 'narrator', text: t, where: `${c.num} ${c.title}: opening` }));
    for (const w of c.witnesses) {
      w.intro.forEach((t, i) => out.push({ id: `${w.id}.intro.${i}`, role: w.id, text: t, where: `${c.num}: greeting` }));
      w.topics.forEach((tp, ti) => tp.a.forEach((t, i) => out.push({ id: `${w.id}.t${ti}.${i}`, role: w.id, text: t, where: `${c.num}: detective asks "${tp.q}"` })));
    }
    for (const [scene, lines] of Object.entries(c.captions)) {
      lines.forEach((t, i) => { if (t && t !== 'RUN.') out.push({ id: `${c.id}.${scene}.${i}`, role: speakerOf(t), text: stripSpeaker(t), where: `${c.num}: cutscene (${scene})` }); });
    }
    c.endings.good.text.forEach((t, i) => out.push({ id: `${c.id}.good.${i}`, role: 'narrator', text: t, where: `${c.num}: good ending` }));
    if (c.endings.weak) c.endings.weak.text.forEach((t, i) => out.push({ id: `${c.id}.weak.${i}`, role: 'narrator', text: t, where: `${c.num}: right person, weak evidence` }));
    for (const s of c.suspects) {
      if (s.id === c.culprit) continue;
      c.endings.bad(s).text.forEach((t, i) => out.push({ id: `${c.id}.bad.${s.id}.${i}`, role: 'narrator', text: t, where: `${c.num}: bad ending (charged ${s.name})` }));
    }
    const I = c.interrogation;
    if (I) {
      const add = (id, t, where) => { const sp = speakerOf(t); out.push({ id, role: sp === 'narrator' ? 'narrator' : I.role, text: stripSpeaker(t), where: `${c.num}: interview room, ${where}` }); };
      I.intro.forEach((t, i) => add(`${I.id}.intro.${i}`, t, 'opening'));
      I.statements.forEach((s, i) => {
        out.push({ id: `${I.id}.s${i}`, role: I.role, text: s.t, where: `${c.num}: interview room, statement ${i + 1}` });
        (s.press || []).forEach((t, k) => add(`${I.id}.p${i}.${k}`, t, `pressed on statement ${i + 1}`));
        (s.crack || []).forEach((t, k) => add(`${I.id}.c${i}.${k}`, t, `caught lying on statement ${i + 1}`));
      });
      I.wrong.forEach((t, k) => add(`${I.id}.wrong.${k}`, t, 'wrong evidence'));
      I.fail.forEach((t, k) => add(`${I.id}.fail.${k}`, t, 'shuts down'));
      I.done.forEach((t, k) => add(`${I.id}.done.${k}`, t, 'cracks'));
    }
  }
  HOME_CAPTIONS.msgs.forEach((m, mi) => m.lines.forEach((t, i) => {
    const sp = speakerOf(t);
    out.push({ id: `home.msg.${mi}.${i}`, role: sp === 'narrator' ? m.who : sp === 'margaret' ? 'mom' : sp, text: stripSpeaker(t), where: 'Your apartment: answering machine message' });
  }));
  ['New Year\'s Day.', 'The rain has stopped. Downstairs, the laundromat sign is off.', 'No messages. No letters under the door.', 'You take the cards down from the wall, one by one. You leave the red string where it is.', 'There is a letter under your door.', 'You do not open it. You do not need to. The red string waits on the wall.', 'Three white lilies in a glass on your desk. One from each town.', 'In her cell, Lund asked for only one thing. You brought them to her.', "And she told you the name that was erased under yours on Crane's list.", 'You have never heard it before. You write it on a new card, and pin it to the wall.', 'Then you go back to work.', 'Every case closes. None of them end.']
    .forEach((t, i) => out.push({ id: `home.epi.${i}`, role: 'narrator', text: t, where: 'Epilogue (after Case 04)' }));
  HOME_CAPTIONS.letters.forEach((l, k) => out.push({ id: `home.letter.${k}.0`, role: 'collector', text: l.lines.join(' '), where: 'Your apartment: letter under the door (read the whole letter)' }));
  for (const m of MAN) out.push({ ...m, role: 'man' });
  return out;
}
