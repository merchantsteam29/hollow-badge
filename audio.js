// Procedural audio: rain, low drone, footsteps, stingers. No asset files.
export class Sound {
  constructor() { this.ctx = null; this.vol = 0.8; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain(); this.master.gain.value = this.vol; this.master.connect(c.destination);

    // shared noise buffer
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // rain bed
    const rain = c.createBufferSource(); rain.buffer = this.noise; rain.loop = true;
    const rf = c.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 1400;
    const rh = c.createBiquadFilter(); rh.type = 'highpass'; rh.frequency.value = 300;
    this.rainGain = c.createGain(); this.rainGain.gain.value = 0;
    rain.connect(rf).connect(rh).connect(this.rainGain).connect(this.master); rain.start();

    // drone
    this.droneGain = c.createGain(); this.droneGain.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 4;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = c.createGain(); lfoG.gain.value = 70; lfo.connect(lfoG).connect(lp.frequency); lfo.start();
    for (const f of [41.2, 41.6, 61.7]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start();
    }
    lp.connect(this.droneGain).connect(this.master);
  }

  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }
  ambience(rain, drone) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(rain, t, 1.5);
    this.droneGain.gain.setTargetAtTime(drone, t, 2);
  }

  burst(dur, freq, gain, type = 'lowpass') {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  tone(freq, dur, gain, type = 'sine', delay = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }

  step(run) { this.burst(run ? 0.09 : 0.11, 500 + Math.random() * 300, run ? 0.22 : 0.15); }
  click() { this.burst(0.03, 3000, 0.25, 'highpass'); }
  page() { this.burst(0.18, 2400, 0.08, 'bandpass'); }
  clue() { this.tone(392, 1.2, 0.08); this.tone(523, 1.6, 0.06, 'sine', 0.12); this.tone(311, 2.2, 0.05, 'triangle', 0.25); }
  door() { this.tone(70, 1.4, 0.2, 'sawtooth'); this.burst(1.2, 400, 0.12, 'bandpass'); }
  // a car pulling up outside: engine rumble that dies, then a door slam
  car() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(42, t); o.frequency.linearRampToValueAtTime(30, t + 2.2);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(f).connect(g).connect(this.master); o.start(t); o.stop(t + 2.5);
    setTimeout(() => { this.burst(0.25, 220, 0.45); this.tone(60, 0.3, 0.3, 'sine'); }, 2900);
  }
  gasp() { this.burst(0.45, 1300, 0.28, 'bandpass'); this.tone(320, 0.25, 0.05, 'triangle'); }
  bell() { for (let i = 0; i < 3; i++) { this.tone(196, 3.5, 0.12, 'sine', i * 1.6); this.tone(392, 2.5, 0.05, 'sine', i * 1.6); this.tone(587, 1.8, 0.03, 'sine', i * 1.6); } }
  lid() { this.burst(0.3, 600, 0.2); this.tone(90, 0.4, 0.12, 'triangle'); }
  // jumpscare shriek: detuned saws sweeping up with fast vibrato, plus a noise blast
  scream() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 0.7;
    g.connect(f).connect(this.master);
    const vib = c.createOscillator(); vib.frequency.value = 31; const vg = c.createGain(); vg.gain.value = 70; vib.connect(vg); vib.start(t); vib.stop(t + 1.45);
    for (const [f0, f1] of [[880, 1500], [1230, 2050], [610, 1020]]) {
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.22); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 1.3);
      vg.connect(o.frequency); o.connect(g); o.start(t); o.stop(t + 1.45);
    }
    this.burst(0.9, 2600, 0.4, 'bandpass');
    this.tone(48, 1.2, 0.5, 'sine');
  }
  chew() {
    this.burst(0.09 + Math.random() * 0.06, 380 + Math.random() * 320, 0.24);
    if (Math.random() < 0.6) setTimeout(() => this.burst(0.04, 1400 + Math.random() * 900, 0.07, 'bandpass'), 40 + Math.random() * 60);
  }
  growl() { this.tone(58 + Math.random() * 8, 0.9, 0.12, 'sawtooth'); this.burst(0.7, 260, 0.08); }
  tap() { this.burst(0.05, 1800, 0.35, 'bandpass'); }
  heartbeat(n = 6, gap = 0.85) {
    if (!this.ctx) return;
    for (let i = 0; i < n; i++) {
      this.tone(52, 0.25, 0.55, 'sine', i * gap);
      this.tone(46, 0.3, 0.4, 'sine', i * gap + 0.22);
    }
  }
  stinger() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 2.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 10);
    g.connect(this.master);
    for (const f of [65.4, 69.3, 98, 103.8, 155.6]) {
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      o.detune.setValueAtTime(0, t); o.detune.linearRampToValueAtTime(-40, t + 10);
      o.connect(g); o.start(t); o.stop(t + 10.2);
    }
  }
}
