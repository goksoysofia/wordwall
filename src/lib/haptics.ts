"use client";

// =============================================================
// Premium haptik geri bildirim — çapraz platform.
//
//  • Android / Chrome  → Web Vibration API (navigator.vibrate), desene göre
//                        farklı tonlar (hafif tık / başarı / hata...).
//  • iOS 17.4+ Safari & kurulu PWA → navigator.vibrate YOK. Gizli bir
//    <label><input type="checkbox" switch></label> öğesini "toggle" ederek
//    sistemin Taptic Engine'ini tetikleriz. Bu, web'de iOS haptiğine ulaşmanın
//    bilinen tek güvenilir yoludur ve kullanıcı dokunuşu içinde çalışmalıdır.
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
let iosSwitch: HTMLInputElement | null = null;

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

// iOS taptic hilesi için gizli switch'i (idempotent) oluştur.
// Görünür olmalı (display:none haptiği bozar) → ekran-dışı + erişilebilirlikten gizli.
function ensureIOSSwitch(): HTMLInputElement | null {
  if (typeof document === "undefined") return null;
  if (iosSwitch?.isConnected) return iosSwitch;

  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;" +
    "pointer-events:none;overflow:hidden;z-index:-1;";

  const input = document.createElement("input");
  input.type = "checkbox";
  // iOS bu attribute'u toggle anahtarı olarak render eder ve dokunsal verir.
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");

  label.appendChild(input);
  document.body.appendChild(label);
  iosSwitch = input;
  return input;
}

function iosTap(): void {
  const input = ensureIOSSwitch();
  if (!input) return;
  // .click() switch'i toggle eder → iOS hafif bir haptic çalar.
  input.click();
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
 * iOS switch'ini erkenden DOM'a ekle (ilk kullanıcı etkileşiminden önce hazır
 * olsun). Android'de veya SSR'da no-op. NativeUX mount'ta çağrılır.
 */
export function primeHaptics(): void {
  if (typeof window === "undefined") return;
  if (!supportsVibrate() && isIOS()) ensureIOSSwitch();
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
