// Runs every playtest against a fresh local server and prints a summary.
//   node tools/playtest/run-all.mjs            (all tests)
//   node tools/playtest/run-all.mjs c3 mobile  (just these)
// Screenshots land in tools/playtest/shots/<test>/, logs in tools/playtest/shots/<test>.log
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const SHOTS = path.join(HERE, 'shots');
const ORDER = ['menu', 'play', 'board', 'int', 'chase', 'c3', 'c4', 'car', 'home', 'stalk', 'scenes', 'v4', 'mobile'];
const pick = process.argv.slice(2);
const tests = pick.length ? ORDER.filter((t) => pick.includes(t)) : ORDER;
const PORT = 8300 + Math.floor(Math.random() * 300);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(SHOTS, { recursive: true });
const server = spawn(process.execPath, [path.join(ROOT, 'serve.js')], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await fetch(`http://localhost:${PORT}/`); break; } catch { await sleep(200); } }

const rows = [];
for (const t of tests) {
  const t0 = Date.now();
  process.stdout.write(`${t.padEnd(8)} ... `);
  const log = fs.createWriteStream(path.join(SHOTS, t + '.log'));
  const code = await new Promise((res) => {
    const p = spawn(process.execPath, [path.join(HERE, t + '.mjs')], { env: { ...process.env, HB_URL: `http://localhost:${PORT}/`, HB_SHOTS: SHOTS } });
    p.stdout.pipe(log); p.stderr.pipe(log);
    const kill = setTimeout(() => p.kill(), 15 * 60 * 1000);
    p.on('exit', (c) => { clearTimeout(kill); res(c); });
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  rows.push([t, code === 0, secs]);
  console.log(`${code === 0 ? 'PASS' : 'FAIL'}  (${secs}s)`);
}
server.kill();
const failed = rows.filter((r) => !r[1]);
console.log(`\n${rows.length - failed.length}/${rows.length} passed` + (failed.length ? `; see ${path.relative(ROOT, SHOTS)}/<test>.log for ${failed.map((r) => r[0]).join(', ')}` : ''));
process.exit(failed.length ? 1 : 0);
