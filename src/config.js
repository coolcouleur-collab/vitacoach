// URL de base pour les appels API
// - En dev  : '' → les requêtes /api/... passent par le proxy Vite (localhost:3001)
// - En prod : l'URL Railway définie dans VITE_API_URL (ex: https://solenn-api.up.railway.app)
export const API_BASE = import.meta.env.VITE_API_URL || ''
