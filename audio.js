/**
 * TypePulse Audio Synthesizer (Web Audio API)
 * Procedurally synthesizes realistic mechanical keyboard sounds, error cues, and victory chimes.
 * Requires zero external audio assets!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.profile = 'thock'; // 'thock' | 'blue' | 'topre' | 'typewriter' | 'off'
    this.volume = 0.6;
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setProfile(profile) {
    this.profile = profile;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  playKeySound(key = '') {
    if (this.profile === 'off' || !this.volume) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const isSpace = key === ' ' || key === 'Space';
    const isEnter = key === 'Enter';
    const isBackspace = key === 'Backspace';

    switch (this.profile) {
      case 'blue':
        this.playBlueSwitch(now, isSpace, isEnter, isBackspace);
        break;
      case 'topre':
        this.playTopreSwitch(now, isSpace, isEnter, isBackspace);
        break;
      case 'typewriter':
        this.playTypewriter(now, isSpace, isEnter, isBackspace);
        break;
      case 'thock':
      default:
        this.playThockSwitch(now, isSpace, isEnter, isBackspace);
        break;
    }
  }

  // Realistic Linear / Creamy Thock Switch
  playThockSwitch(t, isSpace, isEnter, isBackspace) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Random slight pitch jitter for natural acoustic feel
    const jitter = (Math.random() - 0.5) * 20;
    const baseFreq = isSpace ? 110 : isEnter ? 120 : isBackspace ? 140 : 160 + jitter;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq * 2.2, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSpace ? 700 : 950, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.05);

    const gainPeak = (isSpace ? 0.9 : 0.7) * this.volume;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(gainPeak, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isSpace ? 0.07 : 0.045));

    // Noise transient for the bottom-out clack
    const noiseBuffer = this.createNoiseBuffer(0.02);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 * this.volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.connect(noiseGain);
    noiseGain.connect(filter);

    osc.start(t);
    noiseSource.start(t);
    osc.stop(t + 0.08);
    noiseSource.stop(t + 0.03);
  }

  // Crisp Clicky Blue Switch (Click Leaf + Bottom-Out)
  playBlueSwitch(t, isSpace, isEnter) {
    const jitter = (Math.random() - 0.5) * 60;
    // Click transient
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400 + jitter, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.025);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.5 * this.volume, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    // Second click resonance (leaf snap)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2600 + jitter, t + 0.004);
    osc2.frequency.exponentialRampToValueAtTime(800, t + 0.02);
    gain2.gain.setValueAtTime(0.35 * this.volume, t + 0.004);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
    osc2.start(t + 0.004);
    osc2.stop(t + 0.03);
  }

  // Soft Electro-Capacitive Topre Pop
  playTopreSwitch(t, isSpace) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const freq = (isSpace ? 190 : 260) + (Math.random() - 0.5) * 15;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.8 * this.volume, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Vintage Mechanical Typewriter
  playTypewriter(t, isSpace, isEnter) {
    if (isEnter) {
      this.playTypewriterBell(t);
      return;
    }

    const noiseBuffer = this.createNoiseBuffer(0.04);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isSpace ? 1200 : 2200, t);
    filter.Q.setValueAtTime(5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.start(t);
    noiseSource.stop(t + 0.05);
  }

  playTypewriterBell(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1864, t); // Bell A#6

    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Subtle typo error sound
  playErrorSound() {
    if (this.profile === 'off' || !this.volume) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.06);

    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Celebratory victory chord when completing a test
  playCompleteSound() {
    if (this.profile === 'off' || !this.volume) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  }

  createNoiseBuffer(duration = 0.05) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

window.soundEngine = new SoundEngine();
