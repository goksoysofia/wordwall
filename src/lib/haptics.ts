"use client";

// =============================================================
// Premium haptik geri bildirim — çapraz platform.
//
//  • Android / Chrome  → Web Vibration API (navigator.vibrate), desene göre
//                        farklı tonlar (hafif tık / başarı / hata...).
//  • iOS 17.4–26.4 Safari & kurulu PWA → navigator.vibrate YOK. Gizli bir
//    <label><input type="checkbox" switch></label> öğesi oluşturup LABEL'a
//    (input'a DEĞİL) tıklayarak sistemin Taptic Engine'ini tetikleriz. WebKit
//    haptiği yalnızca tıklama label üzerinden yayıldığında verir; input.click()
//    çalışmaz. Bu çağrı kullanıcı dokunuşu (gesture) içinde olmalıdır.
//  • iOS 26.5+ → Apple bu hileyi kapattı; programatik haptik ARTIK MÜMKÜN DEĞİL
//    (yalnızca kullanıcının anahtara bizzat dokunması çalışır). Web'de çare yok.
//  • Desteklenmeyen ortam → sessizce yok sayılır.
//
// Tüm çağrılar kullanıcı tercihine (preferences.ts) saygı duyar.
// =============================================================

import { isHapticsEnabled } from "./preferences";

type HapticKind = "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error";

// Android titreşim desenleri (ms). iOS'ta desen yok sayılır; tek tık çalar.
const PATTERNS: Record<HapticKind, number | number[]> = {
  selection: 8,
  light: 12,
  medium: 22,
  heavy: [40, 30, 60],
  success: [18, 40, 28],
  warning: [30, 40, 30],
  error: [55, 30, 55],
};

let vibrateSupported: boolean | null = null;
let iosCapable: boolean | null = null;

function supportsVibrate(): boolean {
  if (vibrateSupported !== null) return vibrateSupported;
  vibrateSupported =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  return vibrateSupported;
}

function isIOS(): boolean {
  if (iosCapable !== null) return iosCapable;
  if (typeof navigator === "undefined") return (iosCapable = false);
  iosCapable =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ kendini Mac gibi tanıtır.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return iosCapable;
}

// iOS taptic hilesi: anlık olarak gizli bir <label><input switch></label>
// oluştur, LABEL'a tıkla, kaldır. Kanıtlanmış yöntem (ios-haptics kütüphanesi):
//  • input.click() ÇALIŞMAZ — tıklama mutlaka label üzerinden yayılmalı.
//  • label `display:none` olabilir; bu yöntemde haptiği bozmaz.
//  • Her çağrıda taze öğe → her zaman aynı yönde (unchecked→checked) toggle,
//    böylece haptik tutarlı çalar.
function iosTap(): void {
  if (typeof document === "undefined") return;
  try {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.display = "none";

    const input = document.createElement("input");
    input.type = "checkbox";
    // iOS bu attribute'u toggle anahtarı olarak render eder ve dokunsal verir.
    input.setAttribute("switch", "");

    label.appendChild(input);
    (document.body || document.documentElement).appendChild(label);
    label.click(); // ← input değil, LABEL
    label.remove();
  } catch {
    /* DOM erişilemez / engellendi — sessizce yok say */
  }
}

// Düşük seviye tetikleyici.
function play(kind: HapticKind): void {
  if (!isHapticsEnabled()) return;
  if (supportsVibrate()) {
    try {
      navigator.vibrate(PATTERNS[kind]);
    } catch {
      /* parametre/izin — yok say */
    }
    return;
  }
  if (isIOS()) iosTap();
}

/**
 * Özellik tespitini önceden önbelleğe al (ilk dokunuşta gecikme olmasın).
 * iOS switch'i artık her dokunuşta anlık oluşturulduğundan ön-hazırlık gerekmez;
 * bu fonksiyon API uyumluluğu için korunuyor. NativeUX mount'ta çağrılır.
 */
export function primeHaptics(): void {
  if (typeof window === "undefined") return;
  supportsVibrate();
  isIOS();
}

// --- Anlamsal API (mevcut çağrı yerleriyle uyumlu) -------------------------

/** Seçim/temas — buton & link basışı (en hafif tık) */
export function hapticSelection(): void {
  play("selection");
}

/** Hafif dokunma — kart çevirme, küçük etkileşim */
export function hapticLight(): void {
  play("light");
}

/** Orta dokunma — çark tick, eleman yerleştirme */
export function hapticMedium(): void {
  play("medium");
}

/** Güçlü dokunma — kutlama, çark durması */
export function hapticHeavy(): void {
  play("heavy");
}

/** Doğru cevap */
export function hapticCorrect(): void {
  play("success");
}

/** Yanlış cevap */
export function hapticWrong(): void {
  play("error");
}
