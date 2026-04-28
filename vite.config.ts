import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'logo-solid-192x192.png'],
      manifest: {
        name: 'تقييم الإداريين',
        short_name: 'تقييم',
        description: 'تطبيق داخلي لتقييم الأداء',
        theme_color: '#f9f9f9',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo-solid-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-solid-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/logo-solid-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  preview: {
    allowedHosts: true, // This allows any external URL (like LocalTunnel) to access the preview
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
