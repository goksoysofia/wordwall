"use client";

// Haptic geri bildirim — Web Vibration API tabanlı (Capacitor'sız).
// Android Chrome ve kurulu PWA destekler; iOS Safari desteklemez ve
// sessizce yok sayılır. Bir kullanıcı etkileşimi içinde çağrılmalıdır.
function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // bazı tarayıcılar izin/parametre nedeniyle atabilir — yok say
  }
}

/** Doğru cevap haptic'i */
export function hapticCorrect(): void {
  vibrate([18, 40, 28]);
}

/** Yanlış cevap haptic'i */
export function hapticWrong(): void {
  vibrate([55, 30, 55]);
}

/** Hafif dokunma — buton tıklama, kart çevirme */
export function hapticLight(): void {
  vibrate(10);
}

/** Orta dokunma — çark tick, eleman yerleştirme */
export function hapticMedium(): void {
  vibrate(22);
}

/** Kutlama haptic'i — daha uzun titreşim */
export function hapticHeavy(): void {
  vibrate([40, 30, 60]);
}
