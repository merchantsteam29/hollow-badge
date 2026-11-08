# Playtests

Automated headless playthroughs. Each one opens the game in headless Chrome, plays part of it through the `window.__hb` test hook (only present when the URL has `?test`), takes screenshots, and fails if the page logs any error or warning.

Needs Node 22+ and Google Chrome (set `CHROME=/path/to/chrome` if it isn't in the usual place).

```
node tools/playtest/run-all.mjs           # everything (about 25 minutes)
node tools/playtest/run-all.mjs c3 v4     # just some
```

It starts its own copy of `serve.js` on a random port. Screenshots and logs go to `tools/playtest/shots/` (ignored by git).

| Test | Covers |
| --- | --- |
| `menu` | Warning screen, living title, menu cards, What's new |
| `play` | Cases 01 and 02 end to end: witnesses, clues, prints, board |
| `board` | Every board outcome (good / weak / wrong) |
| `int` | Interrogations: catching the lie, strikes, lockout |
| `chase` | Case 01 shed scene: the IV, the jumpscare, the chase and the arrest |
| `c3` | Case 03: the snowed-in town and the hide-and-hold-breath scene |
| `c4` | Case 04 finale: payphone, exhibits, the gallery |
| `car` | Case 04: finding and using your car |
| `home` | The apartment between cases: objectives progress |
| `stalk` | The watcher glimpses and lightning |
| `scenes` | Every case at every quality level |
| `v4` | Title, wheel/joystick guard, gamepad, lilies, settings, epilogue, credits |
| `mobile` | Phone-sized touch play |

Headless Chrome renders with SwiftShader (software), so Medium/High quality is very slow there; most tests switch to Low. Frame rates in these runs mean nothing.
