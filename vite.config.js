import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'pwa-manifest',
      closeBundle() {
        const manifest = {
          name: '큰지도 - 어디든 쉽게',
          short_name: '큰지도',
          description: '어르신을 위한 큰 글자 지도 앱',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#1857c9',
          theme_color: '#1857c9',
          lang: 'ko',
          icons: [
            { src: `${base}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        }
        fs.writeFileSync(
          path.resolve('dist/manifest.json'),
          JSON.stringify(manifest, null, 2),
        )
      },
    },
  ],
  base,
  server: { port: 5173, host: true },
})
