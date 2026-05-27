import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vercel: '/' (기본값), GitHub Pages: VITE_BASE=/silvermap/ 환경변수로 지정
  base: process.env.VITE_BASE ?? '/',
  server: { port: 5173, host: true },
})
