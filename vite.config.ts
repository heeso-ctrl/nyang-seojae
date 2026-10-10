import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['art/**/*.webp', 'art/**/*.json'],
      manifest: {
        name: '냥서재',
        short_name: '냥서재',
        description: '고양이와 함께 쓰는 개인 독서 기록장',
        theme_color: '#f5f0e5',
        background_color: '#f5f0e5',
        display: 'standalone',
        start_url: './',
        lang: 'ko-KR',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,json}']
      }
    })
  ],
  test: {
    environment: 'node'
  }
});
