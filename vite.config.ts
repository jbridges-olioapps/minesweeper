import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages deployment
  // If deploying to a subpath (e.g., /minesweeper/), set base: '/minesweeper/'
  // For root deployment, use base: '/'
  base: process.env.GITHUB_PAGES === 'true' ? '/minesweeper/' : '/',
})
