import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import appConfig from './src/config.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: appConfig.app.name,
        short_name: appConfig.app.shortName,
        description: appConfig.app.description,
        theme_color: '#2563eb',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait-primary',
        dir: 'ltr',
        lang: 'es',
        scope: '/',
        start_url: '/',
        prefer_related_applications: false,
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/dashboard.png',
            sizes: '1899x940',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard de Finanzas',
          },
          {
            src: 'screenshots/analisis.png',
            sizes: '1898x944',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Análisis de gastos e ingresos',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
