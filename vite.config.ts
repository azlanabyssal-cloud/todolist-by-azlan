import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// Using injectManifest strategy to support push notifications,
// background sync, and full Workbox API access — a superset of GenerateSW.
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'To-DoList by Azlan — Organize. Focus. Achieve.',
        short_name: 'To-DoList by Azlan',
        description: 'A flagship productivity PWA: tasks, projects, calendar, and offline sync — all in one beautiful app.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#6366f1',
        orientation: 'any',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity', 'utilities', 'lifestyle'],
        icons: [
          {
            src: '/icons/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Today view on mobile',
          },
          {
            src: '/screenshots/desktop.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Projects view on desktop',
          },
        ],
        shortcuts: [
          {
            name: 'Add Task',
            short_name: 'Add Task',
            description: 'Jump straight to adding a new task',
            url: '/?action=add-task',
            icons: [{ src: '/icons/pwa-96x96.png', sizes: '96x96' }],
          },
          {
            name: "Today's Tasks",
            short_name: 'Today',
            description: "See today's task list",
            url: '/today',
            icons: [{ src: '/icons/pwa-96x96.png', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
          ui: ['lucide-react', 'react-hot-toast'],
        },
      },
    },
  },
})
