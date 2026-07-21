// ─── Auth serveur Solenn ─────────────────────────────────────────────────────
// Vérifie le token Supabase (Authorization: Bearer <access_token>) envoyé par
// le frontend et garantit que l'appelant est bien le userId qu'il réclame.
//
// Deux modes, pilotés par la variable d'environnement REQUIRE_AUTH :
//   - absent / "0" : MODE OBSERVATION — les requêtes sans token valide sont
//     loguées mais laissées passer. Permet de déployer sans casser les vieilles
//     versions du front (apps Capacitor pas encore mises à jour).
//   - "1" : MODE STRICT — 401 sans token, 403 si userId ≠ token.
//
// Fichier préfixé par _ : non exposé comme route par Vercel.

import { createClient } from '@supabase/supabase-js'

let _client = null
function client() {
  if (!_client) _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  return _client
}

const ENFORCE = process.env.REQUIRE_AUTH === '1'

/** Retourne l'utilisateur Supabase du token, ou null. */
export async function getAuthUser(req) {
  const h = req.headers?.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return null
  try {
    const { data, error } = await client().auth.getUser(token)
    if (error) return null
    return data.user
  } catch {
    return null
  }
}

/**
 * Garde d'ownership pour les handlers (Vercel functions et Express).
 * Retourne l'utilisateur si OK ; sinon répond 401/403 (mode strict) et
 * retourne null. En mode observation : log + laisse passer.
 */
export async function requireOwner(req, res, claimedUserId) {
  const user = await getAuthUser(req)
  if (user && (!claimedUserId || String(claimedUserId) === String(user.id))) return user

  const route = req.originalUrl || req.url || '?'
  if (ENFORCE) {
    res.status(user ? 403 : 401).json({ erreur: user ? 'Accès refusé' : 'Non authentifié' })
    return null
  }
  console.warn(`[AUTH][observation] ${route} — ${user ? `userId réclamé ≠ token (${claimedUserId})` : 'requête sans token valide'}`)
  return user || (claimedUserId ? { id: claimedUserId, _unverified: true } : { id: null, _unverified: true })
}

/** Middleware Express : extrait userId de query/body et applique requireOwner. */
export function ownerGuard(req, res, next) {
  const claimed = req.query?.userId || req.body?.userId || req.query?.user_id || req.body?.user_id || null
  requireOwner(req, res, claimed).then(user => {
    if (user) { req.authUser = user; next() }
  }).catch(() => {
    if (ENFORCE) res.status(500).json({ erreur: 'Erreur auth' })
    else next()
  })
}

/** Garde admin pour les endpoints sensibles (broadcast, triggers) :
 *  exige le header x-agents-key égal à AGENTS_TRIGGER_KEY si défini. */
export function adminGuard(req, res, next) {
  const key = process.env.AGENTS_TRIGGER_KEY
  if (key && req.headers['x-agents-key'] !== key) {
    return res.status(401).json({ erreur: 'Non autorisé' })
  }
  if (!key) console.warn(`[AUTH] ${req.originalUrl || req.url} non protégé — définir AGENTS_TRIGGER_KEY`)
  next()
}
