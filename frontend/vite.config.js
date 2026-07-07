import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config Vite : le proxy évite les soucis de CORS en développement
// en redirigeant /api vers le serveur Flask (port 5000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
})
