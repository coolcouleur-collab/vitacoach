// Refuse de construire un paquet natif sans VITE_API_URL.
//
// Le 21 septembre, sur le PC Windows, cette variable manquait du .env. Le build
// passait sans broncher, mais `src/api.js` compilait BASE a chaine vide : dans
// l'app installee, les trente-cinq appels `/api/...` n'auraient eu aucun
// serveur, et chaque `r.json()` aurait echoue en silence. C'est exactement le
// defaut repare le 6 septembre, et rien ne l'aurait signale avant un test sur
// un vrai telephone.
//
// Sur le web ce garde-fou ne s'applique pas : Vercel reecrit /api/ vers Render.
import { readFileSync, existsSync } from 'node:fs'

const depuisEnv = process.env.VITE_API_URL
const depuisFichier = existsSync('.env')
  ? (readFileSync('.env', 'utf8').match(/^VITE_API_URL=(.+)$/m) || [])[1]?.trim()
  : undefined
const valeur = (depuisEnv || depuisFichier || '').trim()

if (!valeur) {
  console.error(`
  VITE_API_URL est absent.

  Un paquet natif construit sans elle s'installe, s'ouvre, et n'atteint aucun
  serveur : les appels /api/ partent vers capacitor://localhost, qui renvoie la
  page HTML avec un 200. Rien ne plante, tout echoue en silence.

  Ajoute cette ligne au .env, puis relance :

      VITE_API_URL=https://solenn-api.onrender.com
`)
  process.exit(1)
}
console.log(`  VITE_API_URL : ${valeur}`)
