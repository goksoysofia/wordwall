# Capacitor Mobile Integration Design

## Overview

Mevcut Next.js web uygulamasini iOS ve Android marketlerinde yayinlanabilir native uygulamalara donusturmek icin Capacitor entegrasyonu.

## Yaklasim: Remote URL + Native Shell

Capacitor, deploy edilmis web URL'sini (orn. `wordwall.vercel.app`) bir WebView icinde yukler. Mevcut web kodu degismez, native ozellikler plugin'ler araciligiyla eklenir.

### Neden Remote URL?

- Tek codebase: web + iOS + Android
- Guncelleme aninda yansir, store review beklemeye gerek yok
- API route'lari aynen calisir (server-side'da kalir)
- Uygulama zaten tamamen online bagimli (Supabase)

## Mimari

```
Capacitor Native Shell (iOS/Android)
  └── WebView → deploy edilmis web URL
  └── Native Plugins (JS Bridge)
        ├── @capacitor/haptics        — titresim feedback
        ├── @capacitor/status-bar     — tema renk uyumu
        ├── @capacitor/splash-screen  — native acilis ekrani
        ├── @capacitor/browser        — OAuth In-App Browser
        ├── @capacitor/app            — lifecycle + deep link
        ├── @capacitor/push-notifications — bildirimler
        ├── @capacitor/share          — native paylasim
        └── @capacitor/screen-orientation — ekran yonu kilidi
```

## Kapsam

### 1. Capacitor Kurulum

- `@capacitor/core` ve `@capacitor/cli` kurulumu
- `capacitor.config.ts` olusturma (remote URL yapilandirmasi)
- `npx cap add ios` ve `npx cap add android` ile native projeler
- Placeholder app icon ve splash screen asset'leri

### 2. Platform Utility (`src/lib/platform.ts`)

Platform detection ve native API wrapper:

```typescript
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
```

Web'de tum native cagrilar no-op olur. Mevcut web davranisi bozulmaz.

### 3. Haptic Feedback (`src/lib/haptics.ts`)

Oyun etkilesimlerinde titresim:

- Dogru cevap → `ImpactStyle.Medium`
- Yanlis cevap → `NotificationType.Error`
- Buton tiklama → `ImpactStyle.Light`
- Oyun tamamlama → `NotificationType.Success`
- Cark donusu → hafif titresim pattern

Entegrasyon noktalari:
- `sounds.ts` icindeki ses fonksiyonlarina paralel haptic cagrilari
- Oyun komponentlerinde (`Quiz`, `MatchGame`, `MemoryGame`, vb.) sonuc anlarinda

### 4. Status Bar

- Tema renklerine gore status bar rengi degisir
- Oyun sirasinda status bar gizlenir (fullscreen deneyim)
- iOS: light/dark content otomatik

### 5. Splash Screen

- Placeholder logo ile native splash
- Otomatik kapanma (web yuklendiginde)
- Tema renkleriyle uyumlu arka plan

### 6. OAuth Deep Link Akisi

Mevcut akis: Google OAuth → redirect → `/auth/callback`

Mobil akis:
1. Kullanici "Google ile Giris" tiklar
2. `@capacitor/browser` ile In-App Browser acilir
3. Google OAuth tamamlanir
4. Callback URL deep link olarak uygulamaya doner
5. `@capacitor/app` `appUrlOpen` event'i ile yakalanir
6. Auth token islenir, session baslar

Deep link scheme: `wordwall://` (placeholder, isim belirlenince guncellenir)

### 7. Push Notifications

- `@capacitor/push-notifications` ile native bildirim izni
- Device token Supabase'e kaydedilir (yeni tablo veya user metadata)
- Kullanim alanlari: yeni template, live session daveti
- Ilk surumde altyapi kurulur, gonderim mantigi sonraki iterasyonda

### 8. Share API

- Aktivite paylasimi: native share sheet acar
- Paylasilan icerik: aktivite linki + baslik
- `/play/[id]` URL'si paylasim icin kullanilir

### 9. Screen Orientation

- Oyun sirasinda: mevcut orientation kilitlenir
- Sonuc ekraninda: serbest birakir
- Dashboard/create: portrait tercih edilir

### 10. Safe Area & UI Uyumu

- `layout.tsx`'e safe area padding (notch, Dynamic Island, home indicator)
- CSS `env(safe-area-inset-*)` kullanimi
- Android navigation bar uyumu

### 11. App Lifecycle

- Background'a geciste: Supabase Realtime baglantisini durdur
- Foreground'a donuste: yeniden baglan
- Deep link'leri dinle (`appUrlOpen`)

## Degisecek Dosyalar

### Yeni dosyalar:
- `capacitor.config.ts` — Capacitor yapilandirmasi
- `src/lib/platform.ts` — Platform detection utility
- `src/lib/haptics.ts` — Haptic feedback wrapper
- `ios/` — iOS native projesi (otomatik olusturulur)
- `android/` — Android native projesi (otomatik olusturulur)

### Degistirilecek dosyalar:
- `package.json` — Capacitor bagimliliklari + scripts
- `src/app/layout.tsx` — Safe area padding, status bar init, lifecycle
- `src/lib/sounds.ts` — Haptic feedback entegrasyonu (ses + titresim birlikte)
- `src/lib/auth-context.tsx` — Deep link OAuth callback handling
- `src/components/Quiz.tsx` — Haptic feedback cagrilari
- `src/components/MatchGame.tsx` — Haptic feedback cagrilari
- `src/components/MemoryGame.tsx` — Haptic feedback cagrilari
- `src/components/SpinningWheel.tsx` — Haptic feedback + orientation lock
- `src/components/GroupSort.tsx` — Haptic feedback cagrilari
- `src/components/MissingWord.tsx` — Haptic feedback cagrilari
- `src/components/BalloonPop.tsx` — Haptic feedback cagrilari
- `src/components/ResultsScreen.tsx` — Share butonu + orientation unlock
- `src/app/play/[id]/page.tsx` — Orientation lock/unlock, status bar
- `.gitignore` — iOS/Android build dosyalari

## Web Uyumlulugu

Tum native cagrilar platform kontrolu ile sarilir:

```typescript
if (isNative()) {
  await triggerHaptic('success');
}
```

Web'de bu cagrilar atlanir. Mevcut davranis %100 korunur.

## Test Stratejisi

- Web: mevcut davranis degismedigini dogrula (native cagrilar no-op)
- iOS Simulator: Xcode ile test
- Android Emulator: Android Studio ile test
- Gercek cihaz: OAuth akisi, haptic feedback, push notification izni

## Gelecek Iterasyonlar (kapsam disi)

- Offline modu (service worker + local cache)
- Live Update (store review olmadan web katmani guncelleme)
- App Store / Play Store listing ve submission
- Gercek app ikonu ve splash screen tasarimi
- Push notification gonderim mantigi (Edge Functions)
- Analytics (Firebase/Amplitude)
