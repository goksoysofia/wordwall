"use client";

import { Capacitor } from '@capacitor/core';

/** Uygulamanın native (iOS/Android) ortamda çalışıp çalışmadığını döner */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Mevcut platformu döner: 'ios' | 'android' | 'web' */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}
