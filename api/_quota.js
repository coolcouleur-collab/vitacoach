// ─── Quota serveur des messages gratuits ─────────────────────────────────────
// Compteur quotidien en base (table daily_usage + RPC increment_daily_usage,
// voir db/quota-checkin.sql). Le comptage localStorage côté client reste pour
// l'affichage, mais c'est ici que la limite est réellement appliquée.
//
// Philosophie : ne JAMAIS bloquer un utilisateur légitime à cause d'un souci
// technique — table absente, erreur réseau, identité inconnue → on laisse
// passer. On ne bloque que sur un dépassement avéré.
// Fichier préfixé par _ : non exposé comme route par Vercel.

import { createClient } from '@supabase/supabase-js'

export const FREE_LIMIT = 5
// Essai complet 21 jours — aligné sur le challenge 21 jours (jour 21 = fin de
// challenge = moment de conversion). Après l'essai : retour au quota gratuit.
// 14 et non 21 (2026-08-12). L'essai couvrait exactement la periode ou Solenn
// devient irremplacable : la phrase qui relie une conversation aux chiffres, le
// verdict d'un essai de sept jours, la progression sur trois semaines. On
// offrait donc la revelation puis on demandait de payer juste apres. A 14 jours
// la decision tombe avant, quand l'envie est encore devant.
export const TRIAL_DAYS = 14
const TRIAL_MS = TRIAL_DAYS * 24 * 3600 * 1000

let _sb = null
function sb() {
  if (!_sb) _sb = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  )
  return _sb
}

// Les messages de détresse ne passent JAMAIS derrière le paywall.
export const SOS_PATTERN = /\b(à bout|j'en peux plus|plus envie|tout lâcher|envie de rien|tellement triste|je pleure|vraiment mal|je crack|j'ai craqué|épuisé[e]? complètement|j'abandonne|plus la force|suicide|mourir|veux mourir|veux disparaître|fin de tout|à bout de force)\b/i

/**
 * Vérifie et consomme 1 message du quota gratuit quotidien.
 * @param {object|null} authUser — utilisateur retourné par requireOwner
 * @param {string} [message] — si fourni et détecté SOS, bypass total
 * @returns {{ok: boolean, remaining?: number, limit?: number}}
 */
export async function consumeQuota(authUser, message) {
  const uid = authUser?.id
  if (!uid) return { ok: true }
  if (message && SOS_PATTERN.test(message)) return { ok: true }
  try {
    // Essai gratuit 7 jours — created_at ne vient que d'un token vérifié
    if (!authUser._unverified && authUser.created_at &&
        Date.now() - new Date(authUser.created_at).getTime() < TRIAL_MS) {
      return { ok: true }
    }
    const { data: row } = await sb().from('profils').select('profil').eq('user_id', uid).maybeSingle()
    if (row?.profil?.isPro) return { ok: true }
    const today = new Date().toISOString().split('T')[0]
    const { data: count, error } = await sb().rpc('increment_daily_usage', { p_user: uid, p_date: today })
    if (error || typeof count !== 'number') return { ok: true } // table/RPC pas encore créées
    if (count > FREE_LIMIT) return { ok: false, limit: FREE_LIMIT }
    return { ok: true, remaining: FREE_LIMIT - count }
  } catch {
    return { ok: true }
  }
}
