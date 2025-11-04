import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.planer.app',
  appName: 'Planer',
  webDir: 'dist/client',
  server: {
    url: 'https://planer.quicpro.workers.dev',
    androidScheme: 'https',
    iosScheme: 'https',
  },
  "plugins": {
    "EdgeToEdge": {
      "backgroundColor": "#000000"
    }
  }
};

export default config;
