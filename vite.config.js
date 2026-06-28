import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'RootFacts - AI Plant/Vegetable Fun Facts',
        short_name: 'RootFacts',
        description:
          'Kenali berbagai jenis sayuran melalui kamera dan temukan fakta menarik secara instan dengan bantuan kecerdasan buatan.',
        theme_color: '#10b981',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Precache SELURUH berkas hasil build (HTML, CSS, JS, ikon, model AI
        // .json/.bin, WASM runtime, dst) tanpa kecuali — supaya tidak ada lagi
        // berkas lokal yang lolos dari service worker
        globPatterns: ['**/*'],
        // weights.bin model TensorFlow.js (~2.1MB) dan binary ONNX Runtime WASM
        // (~21MB, dipakai Transformers.js) berada di atas limit default Workbox
        // (2MB), sehingga perlu dinaikkan agar tetap ikut di-precache
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Stylesheet font Poppins dari Google Fonts. Ini resource eksternal
            // (di luar origin kita) sehingga TIDAK bisa ditangkap oleh
            // globPatterns di atas — harus didaftarkan manual lewat runtimeCaching
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Berkas font (.woff2) Poppins yang sesungguhnya, disajikan dari
            // domain fonts.gstatic.com — juga harus di-cache manual agar
            // tampilan tetap konsisten saat offline
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Model Transformers.js (Xenova/LaMini-Flan-T5) diunduh dari CDN
            // Hugging Face saat runtime. Transformers.js sendiri sudah meng-cache
            // berkas ini lewat Cache API, tapi kita tambahkan strategi
            // CacheFirst sebagai lapisan cadangan agar tetap bisa diakses offline.
            urlPattern: ({ url }) =>
              url.hostname.includes('huggingface.co') || url.hostname.includes('hf.co'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'transformers-model-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 3001,
    host: true
  }
});
