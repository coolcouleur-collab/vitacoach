/**
 * AGENT NUTRITIONNEL — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyse les habitudes alimentaires déclarées dans les conversations et les
 * métriques, puis génère des conseils nutritionnels personnalisés et des
 * suggestions de repas simples.
 * Sauvegarde les insights dans profils.nutrition_insights.
 *
 * Fréquence : vendredi 17:00 (pour le week-end)
 * Trigger : POST /api/agents-trigger { agent: 'nutritionnel' }
 *         + GET /api/nutrition-conseil?userId=...
 */

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

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

// ─── Extrait les mentions alimentaires des conversations ──────────────────────
function extraireContexteAlimentaire(sessions) {
  const MOTS_CLES = [
    'manger', 'mangé', 'repas', 'petit-déjeuner', 'déjeuner', 'dîner', 'goûter',
    'faim', 'satiété', 'grignoter', 'sucre', 'sucré', 'protéine', 'légume',
    'fruit', 'café', 'alcool', 'fast food', 'végétarien', 'vegan', 'gluten',
    'régime', 'calories', 'nutrition', 'alimentation', 'santé', 'chocolat',
    'eau', 'hydratation', 'fatigue', 'énergie', 'digestion', 'ventre',
  ]

  const mentions = []

  for (const s of (sessions || [])) {
    for (const m of (s.messages || [])) {
      if (m.role !== 'user') continue
      const content = m.content?.toLowerCase() || ''
      const relevants = MOTS_CLES.filter(k => content.includes(k))
      if (relevants.length >= 1) {
        mentions.push(m.content.slice(0, 200))
      }
    }
  }

  return mentions.slice(0, 20)
}

// ─── Génère les conseils nutritionnels pour un user ──────────────────────────
export async function genererConseilsNutrition(userId) {
  const supabase = getSupabase()
  const groq     = getGroq()

  // Profil
  const { data: profilRow } = await supabase
    .from('profils')
    .select('profil')
    .eq('user_id', userId)
    .single()

  const profil  = profilRow?.profil || {}
  const nom     = profil?.nom || profil?.prenom || 'toi'
  const objectif = profil?.objectif || profil?.objectifs || null

  // Conversations récentes (14 jours)
  const dateDebut = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: chats } = await supabase
    .from('solenn_chats')
    .select('messages')
    .eq('user_id', userId)
    .gte('session_date', dateDebut)

  const mentionsAli = extraireContexteAlimentaire(chats)

  // Métriques (énergie, humeur — corrélées à la nutrition)
  const { data: metriques } = await supabase
    .from('user_metrics')
    .select('eau, humeur, score')
    .eq('user_id', userId)
    .gte('date', dateDebut)

  const calcMoy = (arr, key) => {
    const vals = (arr || []).map(m => m[key]).filter(v => v != null && v > 0)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
  }

  const avgEau   = calcMoy(metriques, 'eau')
  const avgHumeur = calcMoy(metriques, 'humeur')

  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: 'Tu es une nutritionniste bienveillante qui travaille avec Solenn, coach IA. Tes conseils sont simples, réalistes et basés sur les données disponibles. Réponds uniquement en JSON valide.'
      },
      {
        role: 'user',
        content: `Génère des conseils nutritionnels personnalisés pour ${nom}.

CONTEXTE :
- Objectif : ${objectif || 'bien-être général'}
- Hydratation moyenne : ${avgEau ? avgEau + ' verres/j' : 'non renseignée'}
- Humeur moyenne : ${avgHumeur ? avgHumeur + '/5' : 'non renseignée'}

MENTIONS ALIMENTAIRES DANS LES CONVERSATIONS :
${mentionsAli.length ? mentionsAli.slice(0, 10).join('\n') : 'Aucune mention alimentaire détectée.'}

Génère des conseils pratiques et réalistes adaptés à ce profil.
Format JSON :
{
  "bilan_nutrition": "1-2 phrases d'analyse bienveillante",
  "points_forts": ["max 2 habitudes positives détectées"],
  "axes_amelioration": ["max 3 axes concrets"],
  "conseil_phare": "1 conseil prioritaire pour cette semaine",
  "recettes_simples": [
    {
      "nom": "nom de la recette",
      "emoji": "...",
      "temps": "5-15 min",
      "description": "description en 1 phrase",
      "benefice": "bénéfice santé clé"
    }
  ],
  "hydratation_conseil": "conseil personnalisé sur l'hydratation",
  "message_encouragement": "message de Solenn en 1 phrase, chaleureux"
}`
      }
    ],
    temperature: 0.4,
    max_tokens: 1000,
  })

  const raw   = res.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON nutrition invalide')

  const insights = {
    ...JSON.parse(match[0]),
    analysé_le:    new Date().toISOString(),
    nb_mentions:   mentionsAli.length,
  }

  // Sauvegarder dans profils
  await supabase
    .from('profils')
    .upsert({
      user_id: userId,
      profil: { ...profil, nutrition_insights: insights }
    }, { onConflict: 'user_id' })

  return insights
}

// ─── Runner principal ─────────────────────────────────────────────────────────
export async function runNutritionnel(pushSubscriptions) {
  console.log('[Nutritionnel] 🥗 Analyse nutritionnelle...')
  const supabase = getSupabase()

  const dateDebut = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: rows } = await supabase
    .from('solenn_chats')
    .select('user_id')
    .gte('session_date', dateDebut)

  if (!rows?.length) return { traites: 0 }

  const userIds = [...new Set(rows.map(r => r.user_id))]
  let traites = 0

  for (const userId of userIds) {
    try {
      const insights = await genererConseilsNutrition(userId)

      // Push notification
      const sub = pushSubscriptions?.get(userId)
      if (sub) {
        try {
          await webpush.sendNotification(sub, JSON.stringify({
            title: 'Tes conseils nutrition de la semaine',
            body:  insights.conseil_phare || insights.message_encouragement || 'Ton bilan nutritionnel est prêt',
            icon:  '/icon-192.png',
            data:  { url: '/?onglet=sante&section=nutrition' },
          }))
        } catch (_) {}
      }

      traites++
    } catch (e) {
      console.error(`[Nutritionnel] Erreur user ${userId.slice(0, 8)}:`, e.message)
    }
  }

  console.log(`[Nutritionnel] ✅ ${traites}/${userIds.length} analyses générées`)
  return { traites, total: userIds.length }
}
