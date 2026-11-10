// Release notes, shown in the game's "What's new" panel and mirrored in CHANGELOG.md.
// Add the newest version at the top and bump VERSION.
export const VERSION = '4.2.1';

export const NOTES = [
  {
    v: '4.2.1', date: '2026-11-09', title: 'Download for PC',
    items: [
      'A Download for PC button on the menu: the Game Library app for Windows, with Hollow Badge and all the other games in one place. It is hidden on phones.',
    ],
  },
  {
    v: '4.2', date: '2026-11-09', title: 'Install as an app',
    items: [
      'Hollow Badge can be installed as an app: press Install as app on the menu (Chrome / Edge / Android), or Share > Add to Home Screen on iPhone. It gets its own icon, opens fullscreen and works offline once it has loaded.',
    ],
  },
  {
    v: '4.1', date: '2026-11-07', title: 'Clean-up',
    items: [
      'Phones: the ending screen scrolls, so Go home and Epilogue can no longer end up off the bottom of a landscape phone.',
      'Phones: presenting evidence in an interview scrolls the clue list into view, and the LIGHT and NOTES buttons now tick off the how-to-play checklist.',
      'The menu buttons no longer overlap the tagline.',
      'The epilogue morning looks like morning: the rain on your window has stopped.',
      'The unused voice-acting system has been removed. The game stays fully subtitled.',
      'Links to the game now show a proper preview image, and the browser tab has a badge icon.',
      'Behind the scenes: tidier code, a saved suite of automated playtests (desktop and phone), and a licence.',
    ],
  },
  {
    v: '4.0.1', date: '2026-11-07', title: 'Fully subtitled',
    items: ['Hollow Badge is fully subtitled with no spoken dialogue. The voice-actor recording link has been removed from the menu.'],
  },
  {
    v: '4.0', date: '2026-11-07', title: 'The Final Cut',
    items: [
      'A living title screen: the menu drifts down a rainy Ashgrove street at night.',
      'An epilogue after the finale, and a credits roll.',
      'A white lily is hidden somewhere off the path in Cases 01, 02 and 03. Find all three for the true ending.',
      'Reduce flashing (on the content warning and in settings): calms lightning, jumpscare flashes, police lights, flickering lamps and screen shake.',
      'New settings: subtitle size, field of view, invert look, controllers on/off. A short how-to-play checklist the first time you play.',
      'Gamepad support: left stick to move, right stick to look, A to examine, X flashlight, Y notebook, LT to hold your breath, Start to pause, and the D-pad works every menu.',
    ],
  },
  {
    v: '3.0.2', date: '2026-11-07', title: 'Fix: home objectives',
    items: ['The apartment now follows what you have done: messages, mail, then the case wall. With Cases 01 to 03 finished, the payphone downstairs rings and the door takes you straight into Case 04.'],
  },
  {
    v: '3.0.1', date: '2026-11-07', title: 'Fix: your car in Case 04',
    items: ['Your car in Ashgrove is now parked outside your building with its headlights on, and walking up to it opens the case board (it used to do nothing).'],
  },
  {
    v: '3.0', date: '2026-11-07', title: 'Case 04: The Collector',
    items: [
      'The finale. Ashgrove, your own city. You come home and your door is open.',
      'Four exhibits hidden around the city, a payphone that rings for you, and a typewriter with a bent e.',
      'Three suspects, one interrogation, and a basement you should never have found.',
      'Opens once you have finished Cases 01 to 03.',
    ],
  },
  {
    v: '2.3', date: '2026-11-07', title: 'Home',
    items: [
      'Your apartment in Ashgrove: go home from the menu or after any case.',
      'An answering machine that fills up as you close cases. Some messages are not from anyone you know.',
      'Letters slipped under your door. Your case wall, and the red string that keeps leading to the same empty space.',
    ],
  },
  {
    v: '2.2', date: '2026-11-07', title: 'The interview room',
    items: [
      'Interrogations in every case: Gary Voss, the man Holt arrested, and Walt at his counter.',
      'They tell their story line by line. Press for detail, or present the clue that proves a line is a LIE.',
      'Three wrong presentations and they ask for a lawyer, for good. Breaking them gives you new proof for the charge.',
    ],
  },
  {
    v: '2.1', date: '2026-11-07', title: 'Someone is watching',
    items: [
      'Your progress saves automatically. Case cards show Continue or Start over.',
      'Detective mode (menu or pause): no objectives and no glinting clues. Solving a case this way earns a ★.',
      '3D sound: footsteps, doors and whoever is chasing you come from where they really are; lamps buzz, fires crackle, neon hums.',
      'Something is following you. Keep your eyes open in the dark, and listen behind you.',
      'Lightning over the rainy towns. Look down the street when it strikes.',
    ],
  },
  {
    v: '2.0', date: '2026-11-07', title: 'The Graphics Update',
    items: [
      'Glow (bloom): neon signs, street lamps, windows and police lights now glow and bleed into the fog.',
      'Light beams under every street lamp, catching the rain, fog and snow.',
      'Real night skies: moon, stars and clouds, a blue night over Cmary, orange smog over Wingintonn, a snow sky over Harrow Falls.',
      'Reflections: wet roads and puddles reflect the sky and the lights.',
      'Real surfaces: brick, stone, wood siding, asphalt, cobbles, grass and snow.',
      'Windows with frames and curtains, glowing warm from inside; dark windows reflect.',
      'Film finish: colour grade, lens vignette, film grain and slight lens fringing.',
      'Medium and High graphics get the full look; Low stays as fast as before.',
    ],
  },
  {
    v: '1.10', date: '2026-11-07', title: 'Make your case',
    items: [
      'Charging someone now means choosing the 3 pieces of evidence that prove they did it.',
      'New "NOT ENOUGH" endings when you name the right person with weak evidence.',
      'Suspects appear in a random order and their cards are balanced. The killer is no longer always first.',
    ],
  },
  {
    v: '1.9', date: '2026-11-07', title: 'Case 03: The Long Winter',
    items: [
      'New case in Harrow Falls, a mountain town snowed in for nine days.',
      'Hide in the wardrobe or under the stairs and hold your breath while he searches.',
      'Falling snow, snowy trees, four new characters to interview.',
    ],
  },
  {
    v: '1.8', date: '2026-11-07', title: 'Voices and the chase',
    items: [
      'Voice acting support and a voice studio (record.html) for actors to record their lines.',
      'A jumpscare at the morgue door; the chase has red danger edges, camera shake and lunges.',
      'The man in the morgue now actually runs, with moving legs and arms.',
    ],
  },
  {
    v: '1.7', date: '2026-11-07', title: 'The morgue',
    items: [
      'Wingintonn: IV carved on the morgue door, the scene inside, a playable chase to Sergeant Holt, and an arrest.',
      'The content warning no longer gives the story away.',
    ],
  },
  {
    v: '1.6', date: '2026-11-07', title: 'Better people',
    items: [
      'Every character rebuilt: faces, hands, hair, hats, coats, poses, breathing, and heads that turn to look at you.',
      'The flashlight adapts to distance so faces do not wash out.',
      'The shed in the Cmary woods can be found by its lantern glow and a faint trail (and is a fair search).',
    ],
  },
  {
    v: '1.5', date: '2026-11-07', title: 'Mobile',
    items: ['Touch controls for phones and tablets: move stick, drag to look, action and breath buttons, phone-sized menus.'],
  },
  {
    v: '1.4', date: '2026-11-07', title: 'Performance',
    items: [
      'Big speed-ups: merged scenery, pooled lights, chunked forest, only drawing what you can see.',
      'Graphics setting (Low / Medium / High), automatic quality drop when it runs slowly, FPS counter.',
      'A warning when Chrome is not using your graphics card.',
    ],
  },
  {
    v: '1.0', date: '2026-11-07', title: 'Launch',
    items: ['Case 01: The Rowe Girl (Cmary Town) and Case 02: The Tallyman (Wingintonn Town). Witnesses, fingerprints, notebook, case board.'],
  },
];
