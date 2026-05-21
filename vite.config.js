import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ─── Build config pour Capacitor ──────────────────────────────────────────
  build: {
    outDir: 'dist',
    // Pas de base URL relative — Capacitor charge les assets via file://
    // donc les chemins absolus ne fonctionnent pas
  },

  // ─── Dev server ───────────────────────────────────────────────────────────
  server: {
    host: true,  // expose sur le réseau local (pour test sur téléphone)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
})
