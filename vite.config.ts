import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages 项目站：https://chenmo19910907-prog.github.io/chenmo/ */
const GITHUB_PAGES_BASE = '/chenmo/'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? GITHUB_PAGES_BASE : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
})
