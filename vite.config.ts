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
        ],
        shortcuts: [
          { name: '읽기 시작', short_name: '읽기 시작', url: './?action=start', icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: '독서 종료', short_name: '독서 종료', url: './?action=finish', icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,json}'],
        runtimeCaching: [
          {
            // DEVICE-CHECK: 한 번 본 카카오 표지가 비행기 모드에서도 보이는지
            urlPattern: /^https:\/\/[^/]+\.kakaocdn\.net\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kakao-book-covers',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 500 }
            }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'node'
  }
});
