// ─────────────────────────────────────────────────────────────────────────────
// OU VIT LE SERVEUR, VU DEPUIS L'APP NATIVE
//
// Trente-cinq appels dans le front sont ecrits `fetch('/api/...')`, en relatif.
// Sur le site, Vercel reecrit `/api/*` vers Render (vercel.json), et en dev le
// proxy de Vite fait pareil. Dans l'app native, il n'y a personne derriere
// `capacitor://localhost/api/...` : Capacitor sert la page HTML de l'app a la
// place, avec un statut 200, et chaque `r.json()` echoue en silence. Mesure le
// 6 septembre 2026 dans le simulateur, avant d'ecrire ce fichier.
//
// Quatre fichiers avaient deja leur propre `const API = VITE_API_URL || ''`.
// Plutot qu'une cinquieme copie puis trente autres, une seule regle ici : en
// natif, tout appel relatif a `/api/` part vers VITE_API_URL. Sur le web, ce
// module ne fait rien du tout.
//
// Importe en premier dans main.jsx, avant tout code qui pourrait appeler
// le serveur.
// ─────────────────────────────────────────────────────────────────────────────
import { Capacitor } from '@capacitor/core'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const NATIF = typeof window !== 'undefined' && Capacitor.isNativePlatform()

/** L'URL complete d'un chemin `/api/...`, pour qui prefere l'ecrire. */
export function urlApi(chemin) {
  return NATIF && BASE && chemin.startsWith('/api/') ? BASE + chemin : chemin
}

if (NATIF && BASE && typeof window.fetch === 'function') {
  const fetchOriginal = window.fetch.bind(window)
  window.fetch = (entree, options) => {
    if (typeof entree === 'string') {
      entree = urlApi(entree)
    } else if (entree instanceof URL && entree.origin === window.location.origin) {
      entree = urlApi(entree.pathname + entree.search)
    }
    return fetchOriginal(entree, options)
  }
} else if (NATIF && !BASE) {
  console.warn('[api] VITE_API_URL absent du build : les appels /api/ n ont pas de serveur en natif')
}
