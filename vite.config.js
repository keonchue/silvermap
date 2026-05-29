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
          name: 'SilverMap',
          short_name: 'SilverMap',
          description: '쉽고 편한 길 안내',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#ffffff',
          theme_color: '#1857c9',
          lang: 'ko',
          icons: [
            { src: `${base}icon.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        }
        fs.writeFileSync(
          path.resolve('dist/manifest.json'),
          JSON.stringify(manifest, null, 2),
        )
      },
    },
    {
      name: 'inject-sw-version',
      closeBundle() {
        const swPath = path.resolve('dist/sw.js')
        if (fs.existsSync(swPath)) {
          const content = fs.readFileSync(swPath, 'utf8')
          fs.writeFileSync(swPath, content.replace('__BUILD_TIME__', Date.now()))
        }
      },
    },
  ],
  base,
  server: { port: 5173, host: true },
})
