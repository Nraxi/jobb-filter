import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/af-api': {
        target: 'https://ads.api.jobtechdev.se', // Se till att det inte finns "/" i slutet här
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/af-api/, ''),
      }
    }
  }
})