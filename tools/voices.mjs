// node tools/voices.mjs: scans voices/ for recorded lines and rebuilds voices/manifest.json.
// Unzip the actors' downloads into the HollowBadge folder (they contain a voices/ folder), then run this.
import fs from 'fs';
import path from 'path';
const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'voices');
const files = {};
for (const f of fs.readdirSync(dir).sort()) {
  const m = f.match(/^(.+)\.(webm|ogg|m4a|mp3|wav)$/i);
  if (m) files[m[1]] = f;
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ files }, null, 1) + '\n');
console.log(`voices/manifest.json: ${Object.keys(files).length} lines`);
