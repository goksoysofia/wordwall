"use client";

// =============================================================
// Rich Audio Engine — layered synth sounds with reverb & effects
// =============================================================

let ctx: AudioContext | null = null;
let reverbNode: ConvolverNode | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Create a simple impulse-response reverb
function getReverb(): ConvolverNode {
  if (reverbNode) return reverbNode;
  const c = getCtx();
  const sampleRate = c.sampleRate;
  const length = sampleRate * 0.6; // 600ms reverb tail
  const impulse = c.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  reverbNode = c.createConvolver();
  reverbNode.buffer = impulse;
  return reverbNode;
}

// Low-level: play a note with ADSR envelope, optional vibrato, and reverb
function playNote(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  delay?: number;
  detune?: number;
  reverb?: number; // 0-1 wet mix
  pan?: number; // -1 to 1
}) {
  const c = getCtx();
  const t = c.currentTime + (opts.delay ?? 0);
  const dur = opts.duration;
  const vol = opts.vol ?? 0.25;
  const atk = opts.attack ?? 0.01;
  const dec = opts.decay ?? dur * 0.3;
  const sus = opts.sustain ?? 0.6;
  const revMix = opts.reverb ?? 0;

  const osc = c.createOscillator();
  const gain = c.createGain();
  const panner = c.createStereoPanner();

  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t);
  if (opts.detune) osc.detune.setValueAtTime(opts.detune, t);

  // ADSR envelope
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + atk);
  gain.gain.linearRampToValueAtTime(vol * sus, t + atk + dec);
  gain.gain.linearRampToValueAtTime(0.001, t + dur);

  panner.pan.setValueAtTime(opts.pan ?? 0, t);

  osc.connect(gain);
  gain.connect(panner);

  // Dry path
  panner.connect(c.destination);

  // Wet (reverb) path
  if (revMix > 0) {
    const wetGain = c.createGain();
    wetGain.gain.setValueAtTime(revMix, t);
    panner.connect(wetGain);
    const reverb = getReverb();
    wetGain.connect(reverb);
    reverb.connect(c.destination);
  }

  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Play a burst of white noise (for percussive hits, pops)
function playNoise(opts: {
  duration: number;
  vol?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  delay?: number;
  pan?: number;
}) {
  const c = getCtx();
  const t = c.currentTime + (opts.delay ?? 0);
  const dur = opts.duration;
  const vol = opts.vol ?? 0.15;

  const bufLen = c.sampleRate * dur;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = opts.filterType ?? "bandpass";
  filter.frequency.setValueAtTime(opts.filterFreq ?? 2000, t);
  filter.Q.setValueAtTime(1, t);

  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  const panner = c.createStereoPanner();
  panner.pan.setValueAtTime(opts.pan ?? 0, t);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(c.destination);

  src.start(t);
  src.stop(t + dur);
}

// =============================================================
// EXPORTED SOUND EFFECTS
// =============================================================

/** Wheel tick — soft wooden click */
export function playTickSound() {
  playNoise({ duration: 0.03, vol: 0.12, filterFreq: 3000, filterType: "highpass" });
  playNote({ freq: 1200, duration: 0.04, type: "sine", vol: 0.08, attack: 0.002 });
}

/** Card reveal — magical sparkle ascending */
export function playCardOpenSound() {
  const notes = [523, 784, 1047]; // C5, G5, C6
  notes.forEach((f, i) => {
    playNote({
      freq: f,
      duration: 0.2,
      type: "sine",
      vol: 0.18,
      delay: i * 0.07,
      reverb: 0.3,
      detune: 5, // slight shimmer
      pan: -0.3 + i * 0.3,
    });
    // harmonic layer
    playNote({
      freq: f * 2,
      duration: 0.12,
      type: "triangle",
      vol: 0.06,
      delay: i * 0.07 + 0.02,
      reverb: 0.4,
    });
  });
  // sparkle noise
  playNoise({ duration: 0.08, vol: 0.05, filterFreq: 8000, filterType: "highpass", delay: 0.05 });
}

/** Wheel stop — triumphant brass-like fanfare */
export function playWheelStopSound() {
  // Rich chord: A major with octave
  const chord = [440, 554, 659, 880];
  chord.forEach((f, i) => {
    playNote({
      freq: f,
      duration: 0.5,
      type: "sawtooth",
      vol: 0.1,
      delay: i * 0.04,
      attack: 0.02,
      reverb: 0.35,
      pan: -0.4 + i * 0.25,
    });
    // softening layer
    playNote({
      freq: f,
      duration: 0.4,
      type: "sine",
      vol: 0.12,
      delay: i * 0.04,
      attack: 0.01,
      reverb: 0.3,
    });
  });
  // impact hit
  playNoise({ duration: 0.06, vol: 0.15, filterFreq: 1500, filterType: "lowpass" });
}

/** Remove item — soft descending whoosh */
export function playRemoveSound() {
  playNote({ freq: 600, duration: 0.15, type: "sine", vol: 0.15, attack: 0.005, reverb: 0.2 });
  playNote({ freq: 400, duration: 0.2, type: "sine", vol: 0.12, delay: 0.06, reverb: 0.2 });
  playNote({ freq: 250, duration: 0.25, type: "triangle", vol: 0.08, delay: 0.12 });
  playNoise({ duration: 0.12, vol: 0.04, filterFreq: 3000, filterType: "highpass", delay: 0.02 });
}

/** Correct answer — bright cheerful arpeggio with sparkle */
export function playCorrectSound() {
  // Ascending major triad + octave
  const notes = [523, 659, 784, 1047]; // C-E-G-C
  notes.forEach((f, i) => {
    playNote({
      freq: f,
      duration: 0.25,
      type: "sine",
      vol: 0.2,
      delay: i * 0.06,
      attack: 0.008,
      reverb: 0.3,
      pan: -0.3 + i * 0.2,
    });
    // shimmer harmonic
    playNote({
      freq: f * 1.5,
      duration: 0.15,
      type: "triangle",
      vol: 0.05,
      delay: i * 0.06 + 0.02,
      reverb: 0.4,
    });
  });
  // success sparkle burst
  playNoise({ duration: 0.06, vol: 0.06, filterFreq: 10000, filterType: "highpass", delay: 0.15 });
  playNoise({ duration: 0.05, vol: 0.04, filterFreq: 12000, filterType: "highpass", delay: 0.22 });
}

/** Wrong answer — gentle "nope" without being harsh */
export function playWrongSound() {
  // Descending minor second — dissonant but soft
  playNote({ freq: 370, duration: 0.2, type: "triangle", vol: 0.15, attack: 0.01, reverb: 0.15 });
  playNote({ freq: 349, duration: 0.25, type: "triangle", vol: 0.12, delay: 0.08, reverb: 0.15 });
  // soft thud
  playNoise({ duration: 0.06, vol: 0.08, filterFreq: 400, filterType: "lowpass", delay: 0.02 });
}

/** Balloon pop — percussive burst with pitch sweep */
export function playPopSound() {
  const c = getCtx();
  const t = c.currentTime;

  // Pop attack with pitch drop
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.15);

  // Noise burst
  playNoise({ duration: 0.08, vol: 0.2, filterFreq: 5000, filterType: "highpass" });
  // Airy release
  playNoise({ duration: 0.15, vol: 0.06, filterFreq: 2000, filterType: "bandpass", delay: 0.04 });
}

/** Match found — satisfying lock-in chime */
export function playMatchSound() {
  // Two-note perfect fifth + sparkle
  playNote({ freq: 523, duration: 0.15, type: "sine", vol: 0.2, attack: 0.005, reverb: 0.25, pan: -0.2 });
  playNote({ freq: 784, duration: 0.2, type: "sine", vol: 0.2, delay: 0.05, attack: 0.005, reverb: 0.3, pan: 0.2 });
  // bell-like harmonic
  playNote({ freq: 1568, duration: 0.3, type: "sine", vol: 0.06, delay: 0.08, reverb: 0.5 });
  // satisfying click
  playNoise({ duration: 0.02, vol: 0.1, filterFreq: 6000, filterType: "highpass" });
}

/** Card flip — quick swoosh */
export function playFlipSound() {
  // Filtered noise swoosh
  playNoise({ duration: 0.08, vol: 0.1, filterFreq: 4000, filterType: "bandpass" });
  // subtle tone
  playNote({ freq: 800, duration: 0.06, type: "sine", vol: 0.08, attack: 0.003 });
}

/** Celebration — full orchestral burst with ascending scale, fanfare, and fireworks */
export function playCelebrationSound() {
  // Phase 1: ascending pentatonic scale
  const scale = [523, 587, 659, 784, 880, 1047]; // C major pentatonic-ish
  scale.forEach((f, i) => {
    playNote({
      freq: f,
      duration: 0.2,
      type: "sine",
      vol: 0.15,
      delay: i * 0.08,
      attack: 0.008,
      reverb: 0.3,
      pan: -0.4 + i * 0.16,
    });
    // parallel thirds
    playNote({
      freq: f * 1.25,
      duration: 0.15,
      type: "triangle",
      vol: 0.06,
      delay: i * 0.08 + 0.02,
      reverb: 0.4,
    });
  });

  // Phase 2: triumphant chord at 0.55s
  const fanfare = [523, 659, 784, 1047, 1319];
  fanfare.forEach((f, i) => {
    playNote({
      freq: f,
      duration: 0.7,
      type: "sawtooth",
      vol: 0.07,
      delay: 0.55 + i * 0.02,
      attack: 0.02,
      sustain: 0.5,
      reverb: 0.4,
      pan: -0.5 + i * 0.25,
    });
    playNote({
      freq: f,
      duration: 0.6,
      type: "sine",
      vol: 0.1,
      delay: 0.55 + i * 0.02,
      attack: 0.01,
      reverb: 0.35,
    });
  });

  // Phase 3: sparkle shower (delayed noise bursts)
  for (let i = 0; i < 6; i++) {
    playNoise({
      duration: 0.04,
      vol: 0.04,
      filterFreq: 8000 + Math.random() * 6000,
      filterType: "highpass",
      delay: 0.6 + i * 0.1 + Math.random() * 0.05,
      pan: Math.random() * 2 - 1,
    });
  }

  // Phase 4: final triumphant note
  playNote({ freq: 1047, duration: 0.8, type: "sine", vol: 0.18, delay: 1.1, attack: 0.02, reverb: 0.5 });
  playNote({ freq: 1047 * 2, duration: 0.5, type: "sine", vol: 0.06, delay: 1.15, reverb: 0.5 });
}
