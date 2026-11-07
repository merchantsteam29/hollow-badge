// Voice playback. Lines are recorded with record.html, dropped in voices/, and listed in
// voices/manifest.json (run `node tools/voices.mjs` to rebuild it). Missing lines just stay silent.
export class Voices {
  constructor() {
    this.files = {}; this.cur = null; this.vol = 1; this.on = true; this.token = null;
    this.ready = fetch('voices/manifest.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((m) => { this.files = (m && m.files) || {}; })
      .catch(() => {});
  }
  get count() { return Object.keys(this.files).length; }
  has(id) { return this.on && !!this.files[id]; }
  _play(id, onend, loop) {
    if (this.cur) { this.cur.onended = null; this.cur.pause(); this.cur = null; }
    if (!this.has(id)) return null;
    const a = new Audio('voices/' + this.files[id]);
    a.volume = this.vol; a.loop = !!loop;
    a.onended = () => { if (this.cur === a) this.cur = null; if (onend) onend(); };
    a.play().catch(() => { if (onend) onend(); });
    this.cur = a;
    return a;
  }
  // play one line (stops anything playing, including a chain)
  play(id, opts = {}) { this.token = null; return this._play(id, opts.onend, opts.loop); }
  // play several lines in a row, skipping any that were not recorded
  chain(ids, gapMs = 300) {
    const token = {}; this.token = token; let i = 0;
    const next = () => {
      if (this.token !== token) return;
      while (i < ids.length && !this.has(ids[i])) i++;
      if (i >= ids.length) return;
      this._play(ids[i++], () => setTimeout(next, gapMs));
    };
    next();
  }
  stop() { this.token = null; if (this.cur) { this.cur.onended = null; this.cur.pause(); this.cur = null; } }
  setVolume(v) { this.vol = v; if (this.cur) this.cur.volume = v; }
}
