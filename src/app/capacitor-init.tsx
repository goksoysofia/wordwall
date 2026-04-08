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
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
      });

      // Bildirime tıklandığında
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('[Push] Action performed:', notification);
      });
    })();
  }, []);

  return null;
}
