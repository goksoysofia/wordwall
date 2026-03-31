"use client";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playTickSound() {
  playTone(800, 0.05, "square", 0.15);
}

export function playCardOpenSound() {
  playTone(523, 0.1, "sine", 0.3);
  setTimeout(() => playTone(659, 0.1, "sine", 0.3), 80);
  setTimeout(() => playTone(784, 0.15, "sine", 0.3), 160);
}

export function playWheelStopSound() {
  playTone(440, 0.15, "sine", 0.4);
  setTimeout(() => playTone(554, 0.15, "sine", 0.4), 150);
  setTimeout(() => playTone(659, 0.2, "sine", 0.4), 300);
}

export function playRemoveSound() {
  playTone(400, 0.1, "triangle", 0.2);
  setTimeout(() => playTone(300, 0.15, "triangle", 0.2), 100);
}

export function playCelebrationSound() {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "sine", 0.3), i * 100);
  });
  setTimeout(() => {
    [1047, 1175, 1319].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, "sine", 0.4), i * 150);
    });
  }, 800);
}
