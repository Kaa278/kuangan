import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kuangan.app',
  appName: 'kuangan',
  webDir: 'out',
  server: {
    url: 'https://kuangan.vercel.app/',
    cleartext: true
  }
};

export default config;
