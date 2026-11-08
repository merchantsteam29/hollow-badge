// Renders og.png (the 1200x630 link-preview image) from the living title screen.
//   node serve.js   (in another terminal), then:   node tools/og.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { open } from './playtest/harness.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ev, sleep, send, done } = await open(import.meta.url, { size: [1200, 630] });
await sleep(8000);
await ev(`const H = window.__hb; H.settings.qualityManual = true; H.settings.quality = 'medium'; H.applyQuality();
  document.getElementById('warnOk').click();`);
await sleep(3000);
// only the logo and tagline over the rainy street
await ev(`document.getElementById('whatsnew').classList.add('hidden');
  const st = document.createElement('style');
  st.textContent = '#menu > *:not(.logo):not(.tag) { display: none !important; } #menu { justify-content: center !important; padding: 0 !important; } #menu .logo { font-size: 104px !important; } #menu .tag { font-size: 24px !important; margin-top: 18px !important; }';
  document.head.appendChild(st);`);
await sleep(9000);
const r = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(ROOT, 'og.png'), Buffer.from(r.result.data, 'base64'));
console.log('wrote og.png');
await done();
