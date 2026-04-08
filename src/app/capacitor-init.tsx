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
