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
