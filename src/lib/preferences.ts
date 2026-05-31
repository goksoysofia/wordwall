"use client";

// =============================================================
// Kullanıcı tercihleri — ses & haptik aç/kapa.
// Tek kaynak: localStorage'da kalıcı, küçük bir pub/sub ile UI ve
// motorlar (sounds.ts / haptics.ts) senkron kalır. Premium uygulamalar
// kullanıcıya bu kontrolü verir; terapist sessiz bir seansta sesi kısabilir.
// =============================================================

import { useSyncExternalStore } from "react";

export interface Preferences {
  sound: boolean;
  haptics: boolean;
}

const STORAGE_KEY = "ww-prefs";

const DEFAULTS: Preferences = { sound: true, haptics: true };

// Modül-içi anlık durum (senkron okumalar için cache).
let state: Preferences = { ...DEFAULTS };
let hydrated = false;

const listeners = new Set<() => void>();

function read(): Preferences {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      sound: typeof parsed.sound === "boolean" ? parsed.sound : DEFAULTS.sound,
      haptics: typeof parsed.haptics === "boolean" ? parsed.haptics : DEFAULTS.haptics,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function ensureHydrated(): void {
  if (hydrated || typeof window === "undefined") return;
  state = read();
  hydrated = true;
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* kota/private-mode — yok say */
  }
}

function emit(): void {
  for (const fn of listeners) fn();
}

// --- Genel API (framework-bağımsız) ----------------------------------------

export function getPreferences(): Preferences {
  ensureHydrated();
  return state;
}

export function isSoundEnabled(): boolean {
  ensureHydrated();
  return state.sound;
}

export function isHapticsEnabled(): boolean {
  ensureHydrated();
  return state.haptics;
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  ensureHydrated();
  if (state[key] === value) return;
  state = { ...state, [key]: value };
  persist();
  emit();
}

export function togglePreference(key: keyof Preferences): boolean {
  ensureHydrated();
  const next = !state[key];
  setPreference(key, next);
  return next;
}

function subscribe(listener: () => void): () => void {
  ensureHydrated();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// --- React hook -------------------------------------------------------------

/**
 * Tercihleri React'te canlı okur; setPreference/togglePreference çağrıldığında
 * abone bileşenler otomatik yeniden render olur.
 */
export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getPreferences, () => DEFAULTS);
}
