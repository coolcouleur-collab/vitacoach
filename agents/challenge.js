/**
 * AGENT CHALLENGE 21 JOURS — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Génère un challenge personnalisé de 7 ou 21 jours basé sur les points faibles
 * détectés par l'agent de monitoring. Chaque jour = 1 micro-action concrète.
 * Suit la progression et envoie une micro-célébration à chaque étape clé.
 *
 * Fréquence : création sur demande (POST /api/challenge-create)
 *             check quotidien : 08:30
 * Trigger : POST /api/agents-trigger { agent: 'challenge' }
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
    process.env.SUPABASE_ANON_KEY
  )
  return _supabase
}

// ─── Génère un challenge personnalisé ────────────────────────────────────────
export async function creerChallenge(userId, duree = 21) {
  const supabase = getSupabase()
  const groq     = getGroq()

  // Charger profil + métriques récentes
  const { data: profilRow } = await supabase
    .from('profils')
    .select('profil')
    .eq('user_id', userId)
    .single()

  const profil  = profilRow?.profil || {}
  const memoire = profil?.memoire_longue || {}
  const nom     = profil?.nom || profil?.prenom || 'toi'

  // Métriques des 7 derniers jours pour détecter les faiblesses
  const dateDebut = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: metriques } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', dateDebut)

  const calcMoy = (arr, key) => {
    const vals = (arr || []).map(m => m[key]).filter(v => v != null && v > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  const faiblesses = []
  const sommeil = calcMoy(metriques, 'sommeil')
  const eau     = calcMoy(metriques, 'eau')
  const pas     = calcMoy(metriques, 'pas')
  const humeur  = calcMoy(metriques, 'humeur')

  if (sommeil && sommeil < 7) faiblesses.push(`sommeil insuffisant (moy. ${sommeil.toFixed(1)}h)`)
  if (eau     && eau < 6)     faiblesses.push(`hydratation faible (moy. ${eau.toFixed(1)} verres/j)`)
  if (pas     && pas < 5000)  faiblesses.push(`sédentarité (moy. ${Math.round(pas)} pas/j)`)
  if (humeur  && humeur < 3)  faiblesses.push(`humeur en baisse (moy. ${humeur.toFixed(1)}/5)`)

  if (memoire?.points_attention?.length) faiblesses.push(...memoire.points_attention.slice(0, 2))

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Tu es Solenn, coach IA premium. Tu crées des challenges progressifs, bienveillants et réalistes. Réponds uniquement en JSON valide.'
      },
      {
        role: 'user',
        content: `Crée un challenge de ${duree} jours pour ${nom}.

Points à améliorer : ${faiblesses.length ? faiblesses.join(', ') : 'bien-être général et vitalité'}
Objectifs personnels : ${memoire?.objectifs_mentionnes?.slice(0, 2).join(', ') || 'non renseignés'}
Thèmes récurrents : ${memoire?.themes_recurrents?.slice(0, 3).join(', ') || 'non renseignés'}

Crée ${duree} jours de micro-actions CONCRÈTES (2-5 min max chacune), progressives.
Les actions doivent être faisables même en journée chargée.

Format JSON :
{
  "titre": "nom du challenge (accrocheur, max 6 mots)",
  "emoji": "1 emoji thème",
  "description": "1-2 phrases de motivation",
  "objectif_final": "ce qu'on gagne après ${duree} jours",
  "jours": [
    {
      "jour": 1,
      "titre": "titre court du jour",
      "action": "action concrète et précise",
      "duree": "2-5 min",
      "pourquoi": "1 phrase d'explication scientifique/motivationnelle"
    }
  ],
  "milestones": [
    { "jour": 7, "message": "message de célébration J7" },
    { "jour": 14, "message": "message de célébration J14" },
    { "jour": 21, "message": "message final de victoire" }
  ]
}`
      }
    ],
    temperature: 0.5,
    max_tokens: 3000,
  })

  const raw   = res.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON challenge invalide')

  const challenge = JSON.parse(match[0])
  const dateDebutChallenge = new Date().toISOString().split('T')[0]

  // Sauvegarder dans Supabase
  const { data: saved } = await supabase
    .from('challenges')
    .insert({
      user_id:    userId,
      duree,
      challenge,
      progression: Array(duree).fill(false),
      date_debut:  dateDebutChallenge,
      actif:       true,
      created_at:  new Date().toISOString(),
    })
    .select()
    .single()

  console.log(`[Challenge] ✅ Challenge "${challenge.titre}" créé pour ${userId.slice(0, 8)}`)
  return saved || { challenge, date_debut: dateDebutChallenge }
}

// ─── Check quotidien : rappels et célébrations ────────────────────────────────
export async function runChallengeCheck(pushSubscriptions) {
  console.log('[Challenge] 🏆 Check défis quotidiens...')
  const supabase = getSupabase()
  const aujourd  = new Date().toISOString().split('T')[0]

  // Challenges actifs
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('actif', true)

  if (!challenges?.length) return { verifies: 0 }

  let verifies = 0

  for (const ch of challenges) {
    try {
      const debut = new Date(ch.date_debut)
      const jourActuel = Math.floor((Date.now() - debut.getTime()) / (24 * 60 * 60 * 1000)) + 1

      if (jourActuel > ch.duree) {
        // Challenge terminé
        await supabase.from('challenges').update({ actif: false }).eq('id', ch.id)
        continue
      }

      const jourData     = ch.challenge?.jours?.[jourActuel - 1]
      const progression  = ch.progression || []
      const hierComplete = jourActuel > 1 ? progression[jourActuel - 2] : true

      // Milestone check
      const milestone = ch.challenge?.milestones?.find(m => m.jour === jourActuel && progression[jourActuel - 2])

      const sub = pushSubscriptions?.get(ch.user_id)
      if (sub && jourData) {
        const title = milestone
          ? `🎉 ${milestone.message?.slice(0, 40)}`
          : `Défi J${jourActuel} · ${ch.challenge?.emoji || '💪'} ${ch.challenge?.titre}`
        const body  = milestone
          ? milestone.message
          : jourData.action

        try {
          await webpush.sendNotification(sub, JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            data: { url: '/?onglet=routine&challenge=true' },
          }))
        } catch (_) {}
      }

      verifies++
    } catch (e) {
      console.error(`[Challenge] Erreur challenge ${ch.id}:`, e.message)
    }
  }

  console.log(`[Challenge] ✅ ${verifies} défis vérifiés`)
  return { verifies, total: challenges.length }
}
