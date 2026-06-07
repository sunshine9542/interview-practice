import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '인터뷰 연습',
        short_name: '인터뷰연습',
        description: '말하기·인터뷰 셀프 코칭 연습',
        theme_color: '#0c0c10',
        background_color: '#0c0c10',
        display: 'standalone',
        orientation: 'any',
        lang: 'ko',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
})
