import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Atlas Academy',
        short_name: 'Atlas',
        description: 'Atlas Academy - Sistema de Gestão de Artes Marciais',
        theme_color: '#6D001A',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/logo.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any'
          },
          {
            src: '/logo.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage'
    ]
  },
  build: {
    // Alvo es2015 para garantir compatibilidade com WebViews mais antigos
    target: 'es2015',

    // Source maps desactivados em produção — evita exposição do código fonte.
    // NOTE: Para o deploy final de produção, adicionar: drop: ['console', 'debugger']
    sourcemap: false,

    // Aviso de chunk a partir de 800KB
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Separa dependências pesadas do bundle inicial para download paralelo.
        // Cada serviço Firebase fica no seu próprio chunk — tree-shaking eficaz.
        manualChunks(id) {
          if (id.includes('node_modules/firebase/')) {
            if (id.includes('/auth'))      return 'firebase-auth'
            if (id.includes('/firestore')) return 'firebase-firestore'
            if (id.includes('/storage'))   return 'firebase-storage'
            return 'firebase-app'
          }
          if (id.includes('node_modules/recharts'))      return 'recharts'
          if (id.includes('node_modules/framer-motion')) return 'framer-motion'
          if (id.includes('node_modules/react-dom'))     return 'react-vendor'
          if (id.includes('node_modules/react-router'))  return 'react-vendor'
        }
      }
    }
  }
})
