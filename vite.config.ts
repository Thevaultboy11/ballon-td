import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: 'client',
  plugins: [react()],
  resolve: { alias: { '@shared': fileURLToPath(new URL('./shared', import.meta.url)) } },
  build: { outDir: '../dist', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': `http://localhost:${process.env.PORT || 3000}` } },
})
