/**
 * AGENT ANALYSE TENDANCES
 * ─────────────────────────────────────────────────────────────────────────────
 * Chaque dimanche à 18h, analyse les tendances de la semaine écoulée
 * pour chaque utilisateur (via Supabase) et génère :
 *   • Un score de progression global
 *   • 3 insights personnalisés (ce qui s'est amélioré, ce qui stagne, un conseil)
 *   • Un message push "rapport hebdo"
 *
 * Fallback : si pas de données Supabase, travaille avec le score actuel
 * stocké dans les métadonnées de la subscription push.
 */

import Groq from 'groq-sdk'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// ─── Supabase (optionnel — dégradé gracieux si absent) ───────────────────────
function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

// ─── Récupère l'historique des métriques depuis Supabase ─────────────────────
async function fetchHistoriqueMetriques(userId, jours = 7) {
  const supabase = getSupabase()
  if (!supabase) return null

  const depuis = new Date()
  depuis.setDate(depuis.getDate() - jours)

  const { data, error } = await supabase
    .from('metriques')
    .select('*')
    .eq('user_id', userId)
    .gte('date', depuis.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('[Tendances] Supabase error:', error.message)
    return null
  }
  return data
}

// ─── Calcule des stats agrégées sur l'historique ─────────────────────────────
function calculerStats(historique) {
  if (!historique || historique.length === 0) return null

  const n = historique.length
  const moyennes = {
    pas:    Math.round(historique.reduce((s, d) => s + (d.pas || 0), 0) / n),
    sommeil: parseFloat((historique.reduce((s, d) => s + (d.sommeil || 0), 0) / n).toFixed(1)),
    eau:    parseFloat((historique.reduce((s, d) => s + (d.eau || 0), 0) / n).toFixed(1)),
    humeur: parseFloat((historique.reduce((s, d) => s + (d.humeur || 0), 0) / n).toFixed(1)),
  }

  // Tendance : compare première moitié vs deuxième moitié
  const mid = Math.floor(n / 2)
  const debut = historique.slice(0, mid)
  const fin   = historique.slice(mid)

  const tendances = {}
  for (const key of ['pas', 'sommeil', 'eau', 'humeur']) {
    const mDebut = debut.reduce((s, d) => s + (d[key] || 0), 0) / (debut.length || 1)
    const mFin   = fin.reduce((s, d) => s + (d[key] || 0), 0) / (fin.length || 1)
    const delta  = mFin - mDebut
    tendances[key] = {
      direction: delta > 0.1 ? 'hausse' : delta < -0.1 ? 'baisse' : 'stable',
      delta: Math.round(delta * 10) / 10,
    }
  }

  return { moyennes, tendances, jours: n }
}

// ─── Score de progression (0-100) ────────────────────────────────────────────
function calculerScoreProgression(stats) {
  if (!stats) return 0
  const { moyennes } = stats
  let score = 0
  if (moyennes.pas    >= 10000) score += 25
  else if (moyennes.pas >= 7000) score += 18
  else if (moyennes.pas >= 4000) score += 10
  if (moyennes.sommeil >= 8)   score += 25
  else if (moyennes.sommeil >= 7) score += 20
  else if (moyennes.sommeil >= 6) score += 12
  if (moyennes.eau >= 8)       score += 25
  else if (moyennes.eau >= 6)  score += 18
  else if (moyennes.eau >= 4)  score += 10
  if (moyennes.humeur >= 4)    score += 25
  else if (moyennes.humeur >= 3) score += 18
  else if (moyennes.humeur >= 2) score += 10
  return score
}

// ─── Génère le rapport hebdo via Groq ────────────────────────────────────────
async function genererRapportHebdo(profil, stats, scoreProgression) {
  const statsDesc = stats
    ? `Moyennes 7 jours : ${stats.moyennes.pas} pas/j, ${stats.moyennes.sommeil}h sommeil, ${stats.moyennes.eau} verres eau, humeur ${stats.moyennes.humeur}/5.
       Tendances : pas ${stats.tendances.pas?.direction}, sommeil ${stats.tendances.sommeil?.direction}, eau ${stats.tendances.eau?.direction}, humeur ${stats.tendances.humeur?.direction}.`
    : 'Données insuffisantes pour cette semaine.'

  const resp = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Tu es Solenn, coach de vie IA. Génère un rapport hebdomadaire bref en JSON avec ces 3 champs :
{
  "titre": "Titre court et motivant pour la semaine (max 40 chars)",
  "notifBody": "Message push court (max 90 chars) pour annoncer le rapport — résumé impactant, sans emoji",
  "insights": [
    { "emoji": "🏆", "titre": "Ce qui a bien marché", "detail": "2 phrases concrètes" },
    { "emoji": "🎯", "titre": "À améliorer", "detail": "2 phrases concrètes + conseil" },
    { "emoji": "💡", "titre": "Focus semaine prochaine", "detail": "1 objectif très concret" }
  ],
  "scoreProgression": ${scoreProgression}
}
Réponds UNIQUEMENT en JSON valide, sans markdown.`
      },
      {
        role: 'user',
        content: `Profil : ${profil.nom}, ${profil.age} ans, objectifs : ${profil.objectifs?.join(', ') || 'bien-être'}.
${statsDesc}
Score de progression calculé : ${scoreProgression}/100.
Génère le rapport hebdomadaire.`
      }
    ],
    temperature: 0.65,
    max_tokens: 600,
  })

  const text = resp.choices[0].message.content
  const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('JSON invalide dans rapport tendances')
  return JSON.parse(jsonMatch[0])
}

// ─── Cache en mémoire des rapports générés ───────────────────────────────────
export const rapportsCache = new Map()

// ─── Fonction principale ─────────────────────────────────────────────────────
export async function runTendances(pushSubscriptions) {
  let traites = 0
  let erreurs = 0

  console.log(`[Tendances] Démarrage analyse hebdo — ${pushSubscriptions.size} users`)

  for (const [userId, entry] of pushSubscriptions) {
    try {
      const meta = entry._meta || {}
      const profil = meta.profil || { nom: 'toi', objectifs: [], age: '?' }

      // Récupère historique Supabase (peut être null)
      const historique = await fetchHistoriqueMetriques(userId)
      const stats = calculerStats(historique)
      const scoreProgression = calculerScoreProgression(stats)

      // Génère le rapport IA
      const rapport = await genererRapportHebdo(profil, stats, scoreProgression)

      // Stocke dans le cache (accessible via /api/rapport-hebdo)
      rapportsCache.set(userId, {
        ...rapport,
        generatedAt: new Date().toISOString(),
        profil: profil.nom,
      })

      // Envoie la notification
      const { _meta, ...sub } = entry
      await webpush.sendNotification(sub, JSON.stringify({
        title: `Solenn — Rapport semaine`,
        body: rapport.notifBody || `Ton rapport hebdo est prêt — score ${scoreProgression}/100`,
        url: '/?tab=sante&rapport=1',
        tag: 'rapport-hebdo',
        icon: '/icon-192.png',
      }))

      traites++
      console.log(`[Tendances] Rapport généré pour ${profil.nom || userId} — score ${scoreProgression}/100`)

      // Anti-rate-limit
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      if (err.statusCode === 410) {
        pushSubscriptions.delete(userId)
      } else {
        console.error(`[Tendances] Erreur pour ${userId}:`, err.message)
        erreurs++
      }
    }
  }

  console.log(`[Tendances] Analyse terminée — ${traites} rapports, ${erreurs} erreurs`)
  return { traites, erreurs }
}
