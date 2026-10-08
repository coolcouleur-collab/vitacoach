/**
 * AGENT MÉMOIRE LONGUE — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Lit les conversations Supabase des 7 derniers jours, extrait par IA les
 * thèmes récurrents, objectifs, émotions dominantes et événements importants.
 * Sauvegarde un profil mémoriel dans profils.memoire_longue (JSONB).
 * Ce résumé est injecté dans le contexte de chaque chat pour que Solenn
 * se souvienne vraiment de l'utilisateur.
 *
 * Fréquence : dimanche 06:00 (avant le rapport hebdo)
 * Trigger manuel : POST /api/agents-trigger { agent: 'memoire' }
 */

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

let _groq = null
let _supabase = null

function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

function getSupabase() {
  if (!_supabase) _supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  )
  return _supabase
}

// ─── Analyse mémoire d'un utilisateur ────────────────────────────────────────
async function analyserMemoireUser(userId, oublieLe = null) {
  const supabase = getSupabase()
  const groq = getGroq()

  // Les 10 dernieres sessions. Triees sur updated_at, une vraie date :
  // session_date est du TEXTE (« Thu Oct 08 2026 ») et se triait par nom de
  // jour. Apres une « Reinitialisation memoire IA », seules les sessions
  // OUVERTES APRES comptent, sinon la memoire se reconstruisait le dimanche
  // suivant a partir des memes conversations (8 octobre 2026).
  let q = supabase
    .from('solenn_chats')
    .select('messages, session_date')
    .eq('user_id', userId)
  if (oublieLe) q = q.gt('created_at', oublieLe)
  const { data: sessions } = await q
    .order('updated_at', { ascending: false })
    .limit(10)

  if (!sessions?.length) return null

  // Extraire seulement les messages de l'utilisateur (pas les réponses Solenn)
  const textes = sessions
    .flatMap(s => (s.messages || []).filter(m => m.role === 'user').map(m => m.content))
    .filter(Boolean)
    .slice(0, 50)
    .join('\n---\n')

  if (textes.length < 30) return null

  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: 'Tu analyses des conversations pour extraire des insights psychologiques et comportementaux. Réponds uniquement en JSON valide, sans markdown.'
      },
      {
        role: 'user',
        content: `Analyse ces messages d'un utilisateur de l'app Solenn (coach de vie premium IA).
Extrais les informations clés que Solenn doit mémoriser pour personnaliser ses réponses futures.

MESSAGES :
${textes}

Format JSON attendu :
{
  "themes_recurrents": ["max 5 thèmes en 3 mots"],
  "objectifs_mentionnes": ["max 4 objectifs concrets"],
  "emotions_dominantes": ["max 3 émotions"],
  "evenements_importants": ["max 4 événements/dates/situations mentionnées"],
  "points_attention": ["max 3 signaux à surveiller"],
  "habitudes_positives": ["max 3 habitudes qu'il/elle fait déjà bien"],
  "resume_court": "1 phrase résumant qui est cette personne et son parcours",
  "ton_recommande": "formel|amical|très proche|coach direct"
}`
      }
    ],
    temperature: 0.2,
    max_tokens: 800,
  })

  const raw = res.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null

  return {
    ...JSON.parse(match[0]),
    analysé_le: new Date().toISOString(),
    nb_sessions: sessions.length,
  }
}

// ─── Runner principal ─────────────────────────────────────────────────────────
export async function runMemoireLongue() {
  console.log('[MemoireLongue] 🧠 Analyse mémoire longue...')
  const supabase = getSupabase()

  // Récupérer tous les users ayant chatté ces 14 derniers jours
  // Sur updated_at : comparer session_date (« Thu Oct 08 2026 ») a
  // « 2026-09-24 » est une comparaison de textes, toujours vraie, qui
  // ramenait tous les comptes ayant jamais parle a Solenn.
  const dateLimite = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows } = await supabase
    .from('solenn_chats')
    .select('user_id')
    .gte('updated_at', dateLimite)

  if (!rows?.length) {
    console.log('[MemoireLongue] Aucun utilisateur actif')
    return { traites: 0 }
  }

  const userIds = [...new Set(rows.map(r => r.user_id))]
  let traites = 0
  let erreurs = 0

  for (const userId of userIds) {
    try {
      // Le profil est lu AVANT, et on ne continue que s'il a ete lu. Une
      // lecture ratee donnait {} et l'upsert ecrivait { memoire_longue }
      // comme profil ENTIER : prenom, statut Pro et abonnement effaces, avec
      // la cle service_role qui passe outre toute protection (8 octobre 2026).
      const { data: profilExist, error: erreurLecture } = await supabase
        .from('profils')
        .select('profil')
        .eq('user_id', userId)
        .maybeSingle()
      if (erreurLecture || !profilExist?.profil) continue
      const profilActuel = profilExist.profil

      const memoire = await analyserMemoireUser(userId, profilActuel.memoire_reinitialisee_le || null)
      if (!memoire) continue

      // Relu juste avant d'ecrire : l'analyse prend plusieurs secondes, et
      // reecrire la copie lue avant aurait efface ce que l'app a change entre-temps.
      const { data: frais, error: e2 } = await supabase
        .from('profils').select('profil').eq('user_id', userId).maybeSingle()
      if (e2 || !frais?.profil) continue
      await supabase
        .from('profils')
        .update({ profil: { ...frais.profil, memoire_longue: memoire } })
        .eq('user_id', userId)

      traites++
      console.log(`[MemoireLongue] ✅ User ${userId.slice(0, 8)}... — ${memoire.themes_recurrents?.length || 0} thèmes`)
    } catch (e) {
      erreurs++
      console.error(`[MemoireLongue] Erreur user ${userId.slice(0, 8)}:`, e.message)
    }
  }

  console.log(`[MemoireLongue] Terminé — ${traites} profils mis à jour, ${erreurs} erreurs`)
  return { traites, erreurs, total: userIds.length }
}
