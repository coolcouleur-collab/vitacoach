/**
 * AGENT ROUTINE AUTO-GÉNÉRÉE
 * ─────────────────────────────────────────────────────────────────────────────
 * Chaque matin à 05h30, génère les routines du jour pour tous les utilisateurs
 * abonnés et les met en cache mémoire.
 *
 * Avantage : quand l'utilisateur ouvre l'onglet Routine à 7h, la routine est
 * déjà prête → chargement instantané au lieu d'attendre Groq.
 *
 * Le cache expire à minuit pour forcer une nouvelle génération le lendemain.
 * TTL max : 18h (jusqu'à minuit du jour suivant)
 *
 * Endpoints ajoutés dans server.js :
 *   GET  /api/routine-cache?userId=xxx  → routine du jour depuis le cache
 *   POST /api/routine-invalidate        → invalide le cache d'un user (debug)
 */

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

let _sb = null
function getSupabase() {
  if (!_sb && process.env.SUPABASE_URL) _sb = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  )
  return _sb
}

let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// ─── Cache des routines pré-générées ─────────────────────────────────────────
// Structure : { userId → { routine, generatedAt, expiresAt } }
export const routineCache = new Map()

// ─── Vérifie si le cache est encore valide ───────────────────────────────────
function isCacheValide(userId) {
  const entry = routineCache.get(userId)
  if (!entry) return false
  return Date.now() < entry.expiresAt
}

// ─── Calcule l'expiration à minuit ───────────────────────────────────────────
function getMidnightExpiry() {
  const minuit = new Date()
  minuit.setHours(23, 59, 59, 999)
  return minuit.getTime()
}

// ─── Génère la routine pour un profil + métriques ────────────────────────────
async function genererRoutine(profil, metriques = {}) {
  const prompt = `Tu es Solenn, coach de vie IA. Génère une routine de journée personnalisée pour ${profil.nom}.
Profil : ${profil.age} ans, objectifs : ${profil.objectifs?.join(', ')}, réveil : ${profil.reveil || '7h00'}, coucher : ${profil.coucher || '23h00'}.
Métriques d'hier : sommeil ${metriques.sommeil || 0}h, pas ${metriques.pas || 0}, humeur ${metriques.humeur || 0}/5.

Réponds UNIQUEMENT en JSON valide :
{
  "motivation": "phrase motivante personnalisée pour aujourd'hui",
  "matin": {
    "titre": "Matin énergisant",
    "heure": "7h00 – 9h00",
    "etapes": [
      { "id": "m1", "emoji": "🌅", "titre": "Titre", "description": "Description courte et concrète", "duree": "10 min" }
    ]
  },
  "nutrition": {
    "titre": "Nutrition du jour",
    "repas": [
      { "emoji": "🌅", "moment": "Petit-déjeuner", "suggestion": "suggestion adaptée au profil" },
      { "emoji": "☀️", "moment": "Déjeuner",       "suggestion": "suggestion adaptée" },
      { "emoji": "🌙", "moment": "Dîner",           "suggestion": "suggestion légère et adaptée" }
    ],
    "supplements": ["supplément si pertinent selon profil"]
  },
  "apresmidi": {
    "titre": "Après-midi productif",
    "heure": "14h00 – 17h00",
    "etapes": [
      { "id": "a1", "emoji": "☀️", "titre": "Titre", "description": "Description", "duree": "15 min" }
    ]
  },
  "soir": {
    "titre": "Soir récupération",
    "heure": "20h00 – 22h00",
    "etapes": [
      { "id": "s1", "emoji": "🌙", "titre": "Titre", "description": "Description", "duree": "20 min" }
    ]
  },
  "astuce": { "emoji": "💡", "titre": "Astuce du jour", "conseil": "conseil court et actionnable" }
}
Chaque section doit avoir 3-4 étapes. Adapte tout au profil.`

  const response = await getGroq().chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'Tu génères des routines personnalisées. Réponds UNIQUEMENT en JSON valide, sans balises markdown.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.70,
    max_tokens: 2500,
  })

  const raw = response.choices[0].message.content
  const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('JSON invalide dans routine')
  return JSON.parse(jsonMatch[0])
}

// ─── Fonction principale : pré-génère les routines pour tous les users ────────
export async function runRoutineAuto(pushSubscriptions) {
  let pregenerees = 0
  let dejaCachees = 0
  let erreurs = 0

  console.log(`[RoutineAuto] Démarrage pré-génération — ${pushSubscriptions.size} users`)

  for (const [userId, entry] of pushSubscriptions) {
    // Skip si cache encore valide
    if (isCacheValide(userId)) {
      dejaCachees++
      continue
    }

    try {
      const meta   = entry._meta || {}
      const profil = meta.profil
      if (!profil?.nom) continue

      const routine = await genererRoutine(profil, meta.metriques || {})

      routineCache.set(userId, {
        routine,
        generatedAt: new Date().toISOString(),
        expiresAt: getMidnightExpiry(),
        profil: profil.nom,
      })

      pregenerees++
      console.log(`[RoutineAuto] Routine pré-générée pour ${profil.nom}`)

      // Anti-rate-limit Groq
      await new Promise(r => setTimeout(r, 800))

    } catch (err) {
      console.error(`[RoutineAuto] Erreur pour ${userId}:`, err.message)
      erreurs++
    }
  }

  // Nettoyage des entrées expirées
  for (const [userId, entry] of routineCache) {
    if (Date.now() > entry.expiresAt) routineCache.delete(userId)
  }

  console.log(`[RoutineAuto] Terminé — ${pregenerees} nouvelles, ${dejaCachees} en cache, ${erreurs} erreurs`)
  return { pregenerees, dejaCachees, erreurs }
}

// ─── Récupère la routine depuis le cache (retourne null si absente/expirée) ──
export function getRoutineCache(userId) {
  if (!isCacheValide(userId)) return null
  const entry = routineCache.get(userId)
  return entry?.routine ?? null
}

// ─── Force la régénération pour un utilisateur ───────────────────────────────
export async function regenererPourUser(userId, pushSubscriptions) {
  routineCache.delete(userId)

  // Le profil vivait UNIQUEMENT dans pushSubscriptions, une Map en memoire du
  // serveur. Au moindre redemarrage de Render, deploiement compris, elle se
  // vide : la generation echouait alors pour tout le monde avec le message
  // « Profil incomplet », qui accusait l'utilisateur d'un probleme serveur.
  // La table profils est la source durable, on la lit en repli (2026-08-12).
  const entry  = pushSubscriptions.get(userId)
  const meta   = entry?._meta || {}
  let profil    = meta.profil
  let metriques = meta.metriques || {}

  if (!profil?.nom) {
    try {
      const sb = getSupabase()
      const { data } = await sb.from('profils').select('profil').eq('user_id', userId).single()
      if (data?.profil?.nom) profil = data.profil
    } catch (e) {
      console.warn('[RoutineAuto] profil illisible en base:', e.message)
    }
  }
  // Jamais d'echec faute de profil : un compte sans profil (jamais rempli,
  // efface, ou pas encore synchronise) recevait « Je n'ai pas reussi a
  // generer ta routine » en boucle. Une routine generique vaut toujours mieux
  // qu'une erreur (2026-08-12).
  if (!profil?.nom) profil = { nom: 'toi', objectifs: [] }

  if (!metriques || !Object.keys(metriques).length) {
    try {
      const sb = getSupabase()
      const auj = new Date().toISOString().split('T')[0]
      const { data } = await sb.from('user_metrics').select('*').eq('user_id', userId).eq('date', auj).single()
      if (data) metriques = data
    } catch {}
  }

  const routine = await genererRoutine(profil, metriques)
  routineCache.set(userId, {
    routine,
    generatedAt: new Date().toISOString(),
    expiresAt: getMidnightExpiry(),
    profil: profil.nom,
  })
  return routine
}
