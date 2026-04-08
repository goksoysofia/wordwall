import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.placeholder.wordwall',
  appName: 'Wordwall',
  server: {
    // Geliştirme: local dev server (npm run dev çalışırken)
    url: 'http://localhost:3000',
    cleartext: true,
    // Production: deploy edilmiş URL
    // url: 'https://wordwall.vercel.app',
    // cleartext: false,
  },
  ios: {
    limitsNavigationsToAppBoundDomains: true,
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
