// node tools/changelog.mjs [out.md]: rebuilds CHANGELOG.md from changelog.js and, if a path is
// given, writes the GitHub release notes for the newest version there.
import fs from 'fs';
import path from 'path';
const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const src = fs.readFileSync(path.join(root, 'changelog.js'), 'utf8');
const NOTES = new Function('return ' + src.slice(src.indexOf('export const NOTES = ') + 'export const NOTES = '.length).replace(/;\s*$/, ''))();
let md = '# Hollow Badge: changelog\n\nPlay: https://merchantsteam29.github.io/hollow-badge/\n';
for (const n of NOTES) md += `\n## v${n.v}: ${n.title} (${n.date})\n\n` + n.items.map((t) => `- ${t}`).join('\n') + '\n';
fs.writeFileSync(path.join(root, 'CHANGELOG.md'), md);
const out = process.argv[2], top = Number(process.argv[3] || 1);
if (out) {
  const [cur, ...old] = NOTES;
  fs.writeFileSync(out, `## v${cur.v}: ${cur.title}\n\n` + cur.items.map((t) => `- ${t}`).join('\n')
    + `\n\nPlay it: https://merchantsteam29.github.io/hollow-badge/\n\nThe game shows these notes in its **What's new** panel. Full history: [CHANGELOG.md](https://github.com/merchantsteam29/hollow-badge/blob/main/CHANGELOG.md)\n\n<details><summary>Earlier updates</summary>\n\n`
    + old.map((n) => `**v${n.v}: ${n.title}**\n` + n.items.map((t) => `- ${t}`).join('\n')).join('\n\n') + '\n\n</details>\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n');
}
console.log(`CHANGELOG.md: ${NOTES.length} versions, newest v${NOTES[0].v}`);
