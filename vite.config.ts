import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    cloudflare({
      remoteBindings: true,
    }),
    ],
  // Capacitor uses file:// protocol, so we need to use relative paths
  base: './',
  server: {
    // Allow access from mobile devices on local network
    host: true,
  },
})