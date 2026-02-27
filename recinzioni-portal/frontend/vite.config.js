import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'logo-192.png', 'logo-512.png'],
      manifest: {
        name: 'Portale Recinzioni',
        short_name: 'Recinzioni',
        description: 'Configuratore recinzioni con preventivi e ordini',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        lang: 'it',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Non precachare asset oltre 2MB (Three.js chunks)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Forza attivazione immediata del nuovo SW senza attendere reload
        skipWaiting: true,
        clientsClaim: true,
        // Rimuovi automaticamente cache vecchie quando il SW si aggiorna
        cleanupOutdatedCaches: true,
        // SPA: tutte le navigation request servono index.html
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/swagger/],
        runtimeCaching: [
          // Prodotti e filtri — mostra cache poi aggiorna in background
          {
            urlPattern: /^https?:\/\/.*\/api\/prodotti/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'products-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 ora
              }
            }
          },
          // Ordini e auth — dati critici, rete prima
          {
            urlPattern: /^https?:\/\/.*\/api\/(ordini|auth)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-critical-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 min
              }
            }
          },
          // Listini — cambiano poco
          {
            urlPattern: /^https?:\/\/.*\/api\/listini/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pricelist-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30 // 30 min
              }
            }
          },
          // Health check — sempre rete
          {
            urlPattern: /^https?:\/\/.*\/api\/health/,
            handler: 'NetworkOnly'
          },
          // Immagini statiche
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 giorni
              }
            }
          },
          // Font
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 anno
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ui': ['zustand', 'react-hot-toast', 'lucide-react'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 600
  }
}));
