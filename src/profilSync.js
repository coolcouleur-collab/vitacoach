// ─────────────────────────────────────────────────────────────────────────────
// L'ÉCRITURE DU PROFIL, UNE SEULE FOIS POUR TOUTE L'APP
//
// Cette fonction vivait dans App.jsx, et elle seule était solide. Les autres
// écrans qui sauvegardent le profil, les exclusions alimentaires et le
// changement d'objectif, faisaient chacun leur `upsert` brut à l'intérieur
// d'un `try { } catch {}` muet.
//
// Un `catch` vide rend un échec d'écriture IDENTIQUE à une réussite : l'écran
// affiche la confirmation, l'état en mémoire avance, et la base n'a rien reçu.
// Au rechargement suivant, le profil du serveur écrase la copie locale et le
// réglage a disparu.
//
// C'est exactement le bug diagnostiqué le 14 août, « je remplis mon profil et
// ça s'enlève », corrigé alors à un seul endroit. Il est revenu le 3 septembre
// sur les exclusions alimentaires de Jean : elle les enregistre, l'app le
// confirme, et les recettes continuent de les ignorer parce qu'il n'y a jamais
// rien eu en base.
// ─────────────────────────────────────────────────────────────────────────────

let _sb = null
async function getSupabase() {
  if (!_sb) { const m = await import('./supabase'); _sb = m.supabase }
  return _sb
}

// Ces champs appartiennent au SERVEUR. L'upsert réécrit le profil entier, il ne
// fusionne pas : sans cette préservation, une sauvegarde faite depuis l'app
// efface l'abonnement de quelqu'un qui vient de payer.
export const CHAMPS_SERVEUR = ['isPro', 'proSince', 'proPlan', 'proEnd', 'proManuel',
  'stripeSessionId', 'stripeCustomerId', 'stripeSubscriptionId',
  'memoire_longue']

export async function syncProfilSupabase(userId, profil) {
  if (!userId) return
  const supabase = await getSupabase()

  const aEcrire = { ...profil }
  try {
    const { data } = await supabase.from('profils').select('profil').eq('user_id', userId).maybeSingle()
    for (const k of CHAMPS_SERVEUR) {
      if (data?.profil?.[k] !== undefined) aEcrire[k] = data.profil[k]
    }
  } catch (_) {}

  // PAS de updated_at : la colonne n'existe pas dans `profils`. Elle était
  // pourtant envoyée à chaque sauvegarde, et PostgREST rejetait TOUTE
  // l'écriture, code PGRST204.
  const { error } = await supabase.from('profils').upsert({
    user_id: userId, profil: aEcrire,
  }, { onConflict: 'user_id' })

  if (error) {
    console.error('[profil] sauvegarde refusee par la base,', error.message)
    setTimeout(async () => {
      try {
        const sb = await getSupabase()
        const { error: e2 } = await sb.from('profils').upsert({
          user_id: userId, profil: aEcrire,
        }, { onConflict: 'user_id' })
        if (e2) console.error('[profil] seconde tentative refusee,', e2.message)
      } catch (_) {}
    }, 4000)
  }
  return { error: error || null }
}
