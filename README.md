# Hollow Badge

**Content warning: this game is very dark.** It contains murder, violence against children, death and frightening scenes. Nothing graphic is shown. It is meant for players aged 16 and up.

Hollow Badge is a first-person 3D detective game that runs in the browser. You walk crime scenes by flashlight, talk to witnesses, dust for fingerprints, and then charge a suspect from the case board. If you charge the wrong person, you get a bad ending.

- **Case 01: The Rowe Girl.** Set in Cmary Town on September 9th. Lily Rowe, 11, never came home from school.
- **Case 02: The Tallyman.** Set in Wingintonn Town. A serial killer leaves a stopped watch at every scene.
- **Case 03: The Long Winter.** Harrow Falls, snowed in for nine days. Three people missing.
- **Case 04: The Collector.** The finale, in your own city.

**Play:** https://merchantsteam29.github.io/hollow-badge/ (current version: v4.0.1, see [CHANGELOG.md](CHANGELOG.md))

**Run locally:** run `node serve.js`, then open http://localhost:8080

**Controls:** WASD to move, Shift to run, mouse to look, E or click to examine and talk, F for the flashlight, Tab for the notebook, Esc to pause.

Built with plain HTML, ES modules and Three.js 0.160. There is no build step.

## Voices

Hollow Badge is fully subtitled, with no spoken dialogue. (The voice system is still in the code, unused: if recordings are ever added to `voices/` and `node tools/voices.mjs` is run, the game plays them automatically.)

## Credits

Edit `credits.js` to add playtesters to the credits roll (empty sections are skipped).

## Controllers

Standard gamepads work (left stick move, right stick look, A examine, X flashlight, Y notebook, LT/RB hold breath, Start pause, D-pad for menus). Wheels, joysticks and other devices that the browser reports as gamepads are ignored, and a stick only counts once it has been seen centred. Controllers can be turned off in the pause menu.
