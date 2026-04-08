# Capacitor Mobile Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut Next.js web uygulamasını Capacitor ile sararak iOS ve Android app store'larında yayınlanabilir native uygulamalar oluşturmak.

**Architecture:** Remote URL yaklaşımı — Capacitor WebView deploy edilmiş web URL'sini yükler, native özellikler plugin'ler aracılığıyla JS bridge üzerinden eklenir. Web uygulaması aynen çalışmaya devam eder.

**Tech Stack:** Capacitor 7, @capacitor/haptics, @capacitor/status-bar, @capacitor/splash-screen, @capacitor/browser, @capacitor/app, @capacitor/push-notifications, @capacitor/share, @capacitor/screen-orientation

---

## File Structure

### New Files:
- `capacitor.config.ts` — Capacitor configuration (remote URL, plugins, app metadata)
- `src/lib/platform.ts` — Platform detection utility + native API wrappers
- `src/lib/haptics.ts` — Haptic feedback wrapper with platform-safe calls
- `src/app/capacitor-init.tsx` — Client component for Capacitor lifecycle initialization

### Modified Files:
- `package.json` — Capacitor dependencies + new scripts
- `.gitignore` — iOS/Android build artifacts
- `src/app/layout.tsx` — Safe area CSS + CapacitorInit component
- `src/lib/sounds.ts` — Haptic calls alongside sound effects
- `src/lib/auth-context.tsx` — Deep link OAuth callback handling
- `src/components/ResultsScreen.tsx` — Share button
- `src/app/play/[id]/page.tsx` — Screen orientation lock + status bar hide

---

### Task 1: Capacitor Kurulum ve Yapılandırma

**Files:**
- Modify: `package.json`
- Create: `capacitor.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Capacitor paketlerini kur**

```bash
npm install @capacitor/core @capacitor/cli @capacitor/haptics @capacitor/status-bar @capacitor/splash-screen @capacitor/browser @capacitor/app @capacitor/push-notifications @capacitor/share @capacitor/screen-orientation
```

- [ ] **Step 2: package.json'a Capacitor script'leri ekle**

`package.json` dosyasındaki `scripts` bölümüne ekle:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "cap:sync": "npx cap sync",
  "cap:open:ios": "npx cap open ios",
  "cap:open:android": "npx cap open android"
}
```

- [ ] **Step 3: capacitor.config.ts oluştur**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.placeholder.wordwall',
  appName: 'Wordwall',
  server: {
    url: 'https://wordwall.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#FFF8F0',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFF8F0',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

NOT: `server.url` kısmı deploy edilmiş URL ile güncellenecek. `appId` ve `appName` isim belirlendiğinde güncellenecek.

- [ ] **Step 4: iOS ve Android projelerini oluştur**

```bash
npx cap add ios
npx cap add android
```

- [ ] **Step 5: .gitignore'a Capacitor artifact'lerini ekle**

`.gitignore` dosyasının sonuna ekle:

```
# Capacitor
ios/App/Pods
ios/App/App/public
android/app/build
android/.gradle
android/local.properties
```

NOT: `ios/` ve `android/` klasörlerinin kendileri git'e dahil edilmeli (Capacitor best practice).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json capacitor.config.ts .gitignore ios/ android/
git commit -m "feat: Capacitor kurulumu ve iOS/Android proje yapılandırması"
```

---

### Task 2: Platform Detection Utility

**Files:**
- Create: `src/lib/platform.ts`

- [ ] **Step 1: platform.ts oluştur**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/platform.ts
git commit -m "feat: platform detection utility"
```

---

### Task 3: Haptic Feedback Sistemi

**Files:**
- Create: `src/lib/haptics.ts`
- Modify: `src/lib/sounds.ts`

- [ ] **Step 1: haptics.ts oluştur**

```typescript
"use client";

import { isNative } from './platform';

/** Doğru cevap haptic'i — orta şiddetli titreşim */
export async function hapticCorrect(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Success });
}

/** Yanlış cevap haptic'i — hata titreşimi */
export async function hapticWrong(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Error });
}

/** Hafif dokunma — buton tıklama, kart çevirme */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

/** Orta dokunma — çark tick, eleman yerleştirme */
export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

/** Kutlama haptic'i — ağır titreşim */
export async function hapticHeavy(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Heavy });
}
```

- [ ] **Step 2: sounds.ts'e haptic çağrıları ekle**

`src/lib/sounds.ts` dosyasının başına import ekle:

```typescript
import { hapticCorrect, hapticWrong, hapticLight, hapticMedium, hapticHeavy } from './haptics';
```

Aşağıdaki fonksiyonların **sonuna** haptic çağrısı ekle:

`playTickSound()` fonksiyonunun sonuna:
```typescript
export function playTickSound() {
  playNoise({ duration: 0.03, vol: 0.12, filterFreq: 3000, filterType: "highpass" });
  playNote({ freq: 1200, duration: 0.04, type: "sine", vol: 0.08, attack: 0.002 });
  void hapticLight();
}
```

`playCorrectSound()` fonksiyonunun sonuna:
```typescript
  // success sparkle burst
  playNoise({ duration: 0.06, vol: 0.06, filterFreq: 10000, filterType: "highpass", delay: 0.15 });
  playNoise({ duration: 0.05, vol: 0.04, filterFreq: 12000, filterType: "highpass", delay: 0.22 });
  void hapticCorrect();
}
```

`playWrongSound()` fonksiyonunun sonuna:
```typescript
  // soft thud
  playNoise({ duration: 0.06, vol: 0.08, filterFreq: 400, filterType: "lowpass", delay: 0.02 });
  void hapticWrong();
}
```

`playPopSound()` fonksiyonunun sonuna (son satırdan önce):
```typescript
  // Airy release
  playNoise({ duration: 0.15, vol: 0.06, filterFreq: 2000, filterType: "bandpass", delay: 0.04 });
  void hapticMedium();
}
```

`playMatchSound()` fonksiyonunun sonuna:
```typescript
  // satisfying click
  playNoise({ duration: 0.02, vol: 0.1, filterFreq: 6000, filterType: "highpass" });
  void hapticCorrect();
}
```

`playFlipSound()` fonksiyonunun sonuna:
```typescript
  // subtle tone
  playNote({ freq: 800, duration: 0.06, type: "sine", vol: 0.08, attack: 0.003 });
  void hapticLight();
}
```

`playWheelStopSound()` fonksiyonunun sonuna:
```typescript
  // impact hit
  playNoise({ duration: 0.06, vol: 0.15, filterFreq: 1500, filterType: "lowpass" });
  void hapticHeavy();
}
```

`playCelebrationSound()` fonksiyonunun sonuna:
```typescript
  playNote({ freq: 1047 * 2, duration: 0.5, type: "sine", vol: 0.06, delay: 1.15, reverb: 0.5 });
  void hapticHeavy();
}
```

`playCardOpenSound()` fonksiyonunun sonuna:
```typescript
  // sparkle noise
  playNoise({ duration: 0.08, vol: 0.05, filterFreq: 8000, filterType: "highpass", delay: 0.05 });
  void hapticLight();
}
```

- [ ] **Step 3: Web'de çalıştığını doğrula**

```bash
npm run build
```

Build başarılı olmalı. `isNative()` web'de `false` döner, haptic çağrıları atlanır.

- [ ] **Step 4: Commit**

```bash
git add src/lib/haptics.ts src/lib/sounds.ts
git commit -m "feat: haptic feedback sistemi — ses efektleriyle senkronize titreşim"
```

---

### Task 4: Safe Area, Status Bar ve Splash Screen

**Files:**
- Create: `src/app/capacitor-init.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: capacitor-init.tsx oluştur**

Bu component app mount olduğunda Capacitor plugin'lerini başlatır:

```typescript
"use client";

import { useEffect } from 'react';
import { isNative } from '@/lib/platform';

export default function CapacitorInit() {
  useEffect(() => {
    if (!isNative()) return;

    (async () => {
      // Splash screen'i web yüklendiğinde gizle
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({ fadeOutDuration: 300 });

      // Status bar'ı yapılandır
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#FFF8F0' });
    })();
  }, []);

  return null;
}
```

- [ ] **Step 2: layout.tsx'i güncelle**

`src/app/layout.tsx` dosyasını güncelle:

Import ekle (dosyanın başına):
```typescript
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import CapacitorInit from "./capacitor-init";
```

Viewport export'u ekle (metadata'dan sonra):
```typescript
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#FFF8F0",
};
```

Body'ye safe area padding ve CapacitorInit ekle:
```typescript
<body className="antialiased" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
  <CapacitorInit />
  <AuthProvider>{children}</AuthProvider>
</body>
```

Ayrıca `<head>` içindeki `<meta name="viewport">` otomatik olarak Next.js tarafından yönetilir, ek bir `viewport-fit=cover` meta tag'ine gerek yok — `Viewport` export'u bunu halleder.

- [ ] **Step 3: Build doğrulama**

```bash
npm run build
```

Build başarılı olmalı. Web'de `CapacitorInit` hiçbir şey render etmez ve side effect'leri atlanır.

- [ ] **Step 4: Commit**

```bash
git add src/app/capacitor-init.tsx src/app/layout.tsx
git commit -m "feat: safe area padding, status bar ve splash screen başlatma"
```

---

### Task 5: OAuth Deep Link Akışı

**Files:**
- Modify: `src/lib/auth-context.tsx`

- [ ] **Step 1: auth-context.tsx'i güncelle**

Deep link ile gelen OAuth callback'leri yakala. `src/lib/auth-context.tsx` dosyasında:

Import'ları güncelle:
```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { isNative } from "@/lib/platform";
```

`signInWithGoogle` fonksiyonunu güncelle:
```typescript
  const signInWithGoogle = async () => {
    if (isNative()) {
      // Native: In-App Browser ile OAuth aç, deep link ile geri dön
      const { Browser } = await import('@capacitor/browser');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: 'wordwall://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (data?.url && !error) {
        await Browser.open({ url: data.url });
      }
    } else {
      // Web: standart redirect
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    }
  };
```

`AuthProvider` component'inin `useEffect` bloğunun sonuna (subscription cleanup'tan önce) deep link listener ekle:

```typescript
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Native: deep link ile dönen OAuth callback'leri dinle
    let removeAppListener: (() => void) | undefined;
    if (isNative()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', async ({ url }) => {
          // wordwall://auth/callback#access_token=...
          if (url.includes('auth/callback')) {
            // In-App Browser'ı kapat
            import('@capacitor/browser').then(({ Browser }) => Browser.close());

            // URL fragment'tan token'ları çıkar
            const hashPart = url.split('#')[1];
            if (hashPart) {
              const params = new URLSearchParams(hashPart);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              if (accessToken && refreshToken) {
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              }
            }
          }
        });
        removeAppListener = () => {
          App.removeAllListeners();
        };
      });
    }

    return () => {
      subscription.unsubscribe();
      removeAppListener?.();
    };
  }, [supabase]);
```

- [ ] **Step 2: Capacitor config'e deep link scheme ekle**

`capacitor.config.ts` dosyasına iOS ve Android deep link ayarlarını ekle. Bu dosyayı oluştururken zaten yapıldıysa atla, aksi halde `server` objesinden sonra ekle:

NOT: Deep link scheme'in (`wordwall://`) native proje dosyalarında da yapılandırılması gerekir. Capacitor `npx cap sync` komutu ile `capacitor.config.ts`'deki ayarları native projelere yansıtır, ancak URL scheme'ler için ek native konfigürasyon gerekebilir:

- **iOS**: `ios/App/App/Info.plist` dosyasında `CFBundleURLTypes` eklenecek
- **Android**: `android/app/src/main/AndroidManifest.xml` dosyasında `intent-filter` eklenecek

Bu konfigürasyonlar `npx cap sync` sonrası gerekirse manuel yapılır.

- [ ] **Step 3: Build doğrulama**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth-context.tsx
git commit -m "feat: OAuth deep link akışı — native In-App Browser ile Google auth"
```

---

### Task 6: Share API Entegrasyonu

**Files:**
- Modify: `src/components/ResultsScreen.tsx`

- [ ] **Step 1: ResultsScreen'e paylaş butonu ekle**

`src/components/ResultsScreen.tsx` dosyasında:

Import'ları güncelle (dosya başına ekle):
```typescript
import { isNative } from '@/lib/platform';
```

Component'e `activityId` prop'u ekle:

Props interface'ini güncelle:
```typescript
export interface ResultsScreenProps {
  stats: GameStats;
  activityTitle: string;
  themeEmoji: string;
  activityId: string;
  onReplay: () => void;
  onBack: () => void;
}
```

Component destructuring'ini güncelle:
```typescript
export default function ResultsScreen({
  stats,
  activityTitle,
  themeEmoji,
  activityId,
  onReplay,
  onBack,
}: ResultsScreenProps) {
```

`accuracy` hesaplamasından sonra share fonksiyonu ekle:
```typescript
  const handleShare = async () => {
    const shareData = {
      title: activityTitle,
      text: `${activityTitle} — ${accuracy}% başarı oranı ile tamamladım!`,
      url: `${window.location.origin}/play/${activityId}`,
    };

    if (isNative()) {
      const { Share } = await import('@capacitor/share');
      await Share.share(shareData);
    } else if (navigator.share) {
      await navigator.share(shareData);
    }
  };
```

Action Buttons bölümünde (mevcut `Ana Sayfa ↩` butonundan sonra) paylaş butonu ekle:

```typescript
        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={onReplay}
            className="btn-candy flex-1 rounded-2xl px-6 py-4 font-heading text-base font-bold text-white"
          >
            Tekrar Oyna 🔄
          </button>
          <button
            type="button"
            onClick={onBack}
            className="btn-blue flex-1 rounded-2xl px-6 py-4 font-heading text-base font-bold text-white"
          >
            Ana Sayfa ↩
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-2xl bg-[#8B7BAD] px-6 py-4 font-heading text-base font-bold text-white transition hover:bg-[#7A6B9C]"
          >
            Paylaş 📤
          </button>
        </motion.div>
```

- [ ] **Step 2: play/[id]/page.tsx'de ResultsScreen'e activityId prop'u ekle**

`src/app/play/[id]/page.tsx` dosyasında, `ResultsScreen` render eden kısmı (satır 273) güncelle:

```typescript
      {gameStats && !showCelebration && (
        <ResultsScreen
          stats={gameStats}
          activityTitle={activity.title}
          themeEmoji={theme.emoji}
          activityId={activity.id}
          onReplay={() => {
            setGameStats(null);
            window.location.reload();
          }}
          onBack={() => router.push("/dashboard")}
        />
      )}
```

- [ ] **Step 3: Build doğrulama**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ResultsScreen.tsx src/app/play/[id]/page.tsx
git commit -m "feat: share API — sonuç ekranında aktivite paylaşma"
```

---

### Task 7: Screen Orientation Kontrolü

**Files:**
- Modify: `src/app/play/[id]/page.tsx`

- [ ] **Step 1: play/[id]/page.tsx'e orientation lock ekle**

Import'ları güncelle (dosya başına ekle):
```typescript
import { isNative } from '@/lib/platform';
```

Oyun sayfası mount olduğunda orientation'ı kilitle, unmount'ta serbest bırak. Mevcut `useEffect`'lerden sonra yeni bir `useEffect` ekle:

```typescript
  // Native: oyun sırasında ekran yönünü kilitle
  useEffect(() => {
    if (!isNative() || !activity) return;

    let unlock: (() => void) | undefined;

    import('@capacitor/screen-orientation').then(({ ScreenOrientation }) => {
      // Mevcut orientation'ı kilitle
      ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
      unlock = () => {
        ScreenOrientation.unlock().catch(() => {});
      };
    });

    return () => {
      unlock?.();
    };
  }, [activity]);
```

Bu `useEffect`'i `activity` state'inin set edildiği `useEffect`'ten sonra ekle (satır 52'den sonra).

- [ ] **Step 2: Status bar'ı oyun sırasında gizle**

Aynı dosyada, yukarıdaki `useEffect`'in içine status bar gizleme ekle:

```typescript
  // Native: oyun sırasında ekran yönünü kilitle ve status bar'ı gizle
  useEffect(() => {
    if (!isNative() || !activity) return;

    let unlockOrientation: (() => void) | undefined;
    let showStatusBar: (() => void) | undefined;

    (async () => {
      const { ScreenOrientation } = await import('@capacitor/screen-orientation');
      await ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
      unlockOrientation = () => {
        ScreenOrientation.unlock().catch(() => {});
      };

      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.hide().catch(() => {});
      showStatusBar = () => {
        StatusBar.show().catch(() => {});
      };
    })();

    return () => {
      unlockOrientation?.();
      showStatusBar?.();
    };
  }, [activity]);
```

- [ ] **Step 3: Build doğrulama**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/play/[id]/page.tsx
git commit -m "feat: oyun sırasında orientation lock ve status bar gizleme"
```

---

### Task 8: Push Notification Altyapısı

**Files:**
- Modify: `src/app/capacitor-init.tsx`

- [ ] **Step 1: capacitor-init.tsx'e push notification kaydı ekle**

`src/app/capacitor-init.tsx` dosyasındaki `useEffect` içini güncelle:

```typescript
"use client";

import { useEffect } from 'react';
import { isNative } from '@/lib/platform';

export default function CapacitorInit() {
  useEffect(() => {
    if (!isNative()) return;

    (async () => {
      // Splash screen'i web yüklendiğinde gizle
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide({ fadeOutDuration: 300 });

      // Status bar'ı yapılandır
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#FFF8F0' });

      // Push notification izni iste ve token al
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive === 'granted') {
        await PushNotifications.register();
      }

      // Token alındığında log'la (ilerde Supabase'e kaydedilecek)
      PushNotifications.addListener('registration', (token) => {
        console.log('[Push] Device token:', token.value);
        // TODO: token.value'yu Supabase'e kaydet (user metadata veya ayrı tablo)
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
      });

      // Bildirime tıklandığında
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('[Push] Action performed:', notification);
        // TODO: notification.notification.data içinden deep link'e yönlendir
      });
    })();
  }, []);

  return null;
}
```

- [ ] **Step 2: Build doğrulama**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/capacitor-init.tsx
git commit -m "feat: push notification altyapısı — izin isteme ve token kayıt"
```

---

### Task 9: App Lifecycle — Background/Foreground Yönetimi

**Files:**
- Modify: `src/app/capacitor-init.tsx`

- [ ] **Step 1: capacitor-init.tsx'e lifecycle listener ekle**

`src/app/capacitor-init.tsx` dosyasının `useEffect` bloğuna, push notification kodundan sonra ekle:

```typescript
      // App lifecycle: background/foreground geçişlerini dinle
      const { App } = await import('@capacitor/app');

      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('[App] Foreground — reconnecting...');
          // Supabase Realtime otomatik reconnect yapar,
          // ama sayfayı güncellememiz gerekebilir
          window.dispatchEvent(new CustomEvent('app-foreground'));
        } else {
          console.log('[App] Background');
          window.dispatchEvent(new CustomEvent('app-background'));
        }
      });

      // Android geri tuşu
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
```

- [ ] **Step 2: Build doğrulama**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/capacitor-init.tsx
git commit -m "feat: app lifecycle — background/foreground yönetimi ve Android geri tuşu"
```

---

### Task 10: Capacitor Sync ve Final Doğrulama

**Files:**
- No new files

- [ ] **Step 1: Capacitor sync çalıştır**

```bash
npx cap sync
```

Bu komut:
- Web asset'lerini native projelere kopyalar
- Capacitor plugin'lerini native projelere register eder
- Pod install (iOS) ve Gradle sync (Android) çalıştırır

- [ ] **Step 2: Web build'in hâlâ çalıştığını doğrula**

```bash
npm run build
```

Build hatasız tamamlanmalı.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: Capacitor sync — native projeler güncellendi"
```

---

## Test Matrisi

| Özellik | Web | iOS Simulator | Android Emulator |
|---------|-----|---------------|------------------|
| Sayfa yükleme | ✅ build başarılı | Xcode'da test | Android Studio'da test |
| Haptic feedback | No-op (sessiz) | Titreşim hissedilmeli | Titreşim hissedilmeli |
| OAuth | Mevcut redirect akışı | In-App Browser → deep link | In-App Browser → deep link |
| Share | navigator.share (varsa) | Native share sheet | Native share sheet |
| Status bar | N/A | Tema rengiyle uyumlu | Tema rengiyle uyumlu |
| Orientation lock | N/A | Portrait kilitli | Portrait kilitli |
| Push notifications | N/A | Token alınmalı | Token alınmalı |
| Android geri tuşu | N/A | N/A | History back çalışmalı |
| Safe area | N/A | Notch/Dynamic Island uyumu | Punch-hole uyumu |

## Notlar

- **iOS test için**: macOS + Xcode gerekli. `npx cap open ios` ile Xcode açılır.
- **Android test için**: Android Studio + emülatör gerekli. `npx cap open android` ile Android Studio açılır.
- **Gerçek cihaz test**: Haptic feedback yalnızca gerçek cihazda test edilebilir (simülatörde çalışmaz).
- **Deep link test**: `npx uri-scheme open wordwall://auth/callback --ios` ile test edilebilir.
