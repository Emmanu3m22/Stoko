import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import process from 'node:process'

const apiCacheOrigins = Array.from(new Set([
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  process.env.VITE_API_URL,
]
  .filter(Boolean)
  .map((apiUrl) => {
    try {
      return new URL(apiUrl).origin
    } catch {
      return null
    }
  })
  .filter(Boolean)))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Stoko Inventarios',
        short_name: 'Stoko',
        description: 'Sistema de inventarios y ventas Stoko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4169E1',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              apiCacheOrigins.includes(url.origin) &&
              (url.pathname.startsWith('/api/v1/productos') || url.pathname.startsWith('/api/v1/ventas')),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'stoko-api-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
})
