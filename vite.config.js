import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ─── Build config pour Capacitor ──────────────────────────────────────────
  build: {
    outDir: 'dist',
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
          if (id.includes('node_modules/framer-motion')) return 'framer'
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/@stripe')) return 'stripe'
        }
      }
    }
  },

  // ─── Dev server ───────────────────────────────────────────────────────────
  server: {
    host: true,  // expose sur le réseau local (pour test sur téléphone)
    port: Number(process.env.PORT) || 5173,  // PORT injecté par l'outil de preview si 5173 occupé
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
})
