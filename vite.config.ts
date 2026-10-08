import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// BASE_PATH is set for the GitHub Pages build (e.g. /ptptn-grad/); local dev and preview use the root.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'evidence/*.svg'],
      manifest: {
        name: 'PTPTN Graduate',
        short_name: 'PTPTN Grad',
        description: 'Turn campus records into a verified skill profile, get found by Talent Partners and see the benefits of good standing.',
        start_url: `${base}s/home`,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F3F0EA',
        theme_color: '#F3F0EA',
        lang: 'en',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
