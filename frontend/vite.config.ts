import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'branding/arglogo.jpeg', 'branding/arglogo1.png', 'branding/arglogo2.png'],
      manifest: {
        name: 'Alpha Rise Global',
        short_name: 'AlphaRise',
        description: 'Alpha Rise Global — Professional Investment Platform',
        theme_color: '#0b0f14',
        background_color: '#0b0f14',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/branding/arglogo1.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/branding/arglogo2.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/branding/arglogo2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg,jpg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
