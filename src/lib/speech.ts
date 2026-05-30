"use client";

// =============================================================
// Konuşma sentezi (Text-to-Speech) — tr-TR
// Web Speech API tabanlı. Cihaz/tarayıcı desteklemiyorsa sessizce
// devre dışı kalır; oyunlar metin ipucu fallback'i ile çalışmaya devam eder.
// =============================================================

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickTurkishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const tr =
    voices.find((v) => /^tr(-|_|$)/i.test(v.lang)) ||
    voices.find((v) => /turkish|türk/i.test(v.name)) ||
    null;
  return tr;
}

/** Tarayıcı konuşma sentezini destekliyor mu? */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

/** Sesleri önceden yükle (mobil tarayıcılar gecikmeli yükler). */
export function primeVoices(): void {
  if (!isSpeechSupported()) return;
  try {
    cachedVoice = pickTurkishVoice();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoice = pickTurkishVoice();
    };
  } catch {
    // yok say
  }
}

/**
 * Verilen metni Türkçe seslendir.
 * @returns seslendirme başlatılabildiyse true
 */
export function speak(text: string, opts?: { rate?: number; pitch?: number }): boolean {
  if (!isSpeechSupported() || !text.trim()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel(); // önceki konuşmayı iptal et
    const u = new SpeechSynthesisUtterance(text);
    const voice = cachedVoice || pickTurkishVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "tr-TR";
    u.rate = opts?.rate ?? 0.9; // çocuklar için biraz yavaş
    u.pitch = opts?.pitch ?? 1.05;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

/** Devam eden konuşmayı durdur. */
export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // yok say
  }
}
