/**
 * AGENT ANNIVERSAIRES & MOMENTS — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Détecte et mémorise les événements importants mentionnés dans les chats :
 * anniversaires, rendez-vous médicaux, deadlines, dates clés, projets...
 * Les réintroduit au bon moment dans les conversations ou via push notif.
 *
 * Stockage : profils.moments_importants (JSONB array)
 *
 * Fréquence : quotidien 06:15 (check si rappel à envoyer)
 *             extraction : après chaque nouvelle conversation (ou hebdo)
 * Trigger : POST /api/agents-trigger { agent: 'moments' }
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

// ─── Extrait les moments importants d'une session ─────────────────────────────
export async function extraireMoments(userId, texteConversation) {
  const groq = getGroq()

  const res = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant', // modèle rapide — extraction simple
    messages: [
      {
        role: 'system',
        content: 'Tu extrais des événements importants depuis des conversations. Si aucun événement clair n\'est mentionné, retourne {"moments": []}. Réponds uniquement en JSON valide.'
      },
      {
        role: 'user',
        content: `Extrait les événements importants, dates, anniversaires, rendez-vous ou projets mentionnés dans cette conversation :

${texteConversation.slice(0, 2000)}

Format JSON :
{
  "moments": [
    {
      "type": "anniversaire|rdv_medical|deadline|projet|evenement_perso|autre",
      "description": "description courte",
      "date_mentionnee": "date si précisée ou null",
      "personne": "qui est concerné (moi/nom) ou null",
      "rappel_avant_jours": 1
    }
  ]
}`
      }
    ],
    temperature: 0.1,
    max_tokens: 400,
  })

  const raw   = res.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return []

  try {
    const parsed = JSON.parse(match[0])
    return (parsed.moments || []).filter(m => m.description && m.description.length > 5)
  } catch (_) {
    return []
  }
}

// ─── Sauvegarde les moments dans le profil ────────────────────────────────────
export async function sauvegarderMoments(userId, nouveauxMoments) {
  if (!nouveauxMoments?.length) return

  const supabase = getSupabase()

  const { data: profilRow } = await supabase
    .from('profils')
    .select('profil')
    .eq('user_id', userId)
    .single()

  const profil           = profilRow?.profil || {}
  const momentsExistants = profil?.moments_importants || []

  // Déduplique par description
  const descriptions = new Set(momentsExistants.map(m => m.description?.toLowerCase()))
  const nouveaux     = nouveauxMoments.filter(m => !descriptions.has(m.description?.toLowerCase()))

  if (!nouveaux.length) return

  const momentsMAJ = [
    ...momentsExistants,
    ...nouveaux.map(m => ({ ...m, détecté_le: new Date().toISOString() }))
  ].slice(-50) // garder les 50 plus récents

  await supabase
    .from('profils')
    .upsert({
      user_id: userId,
      profil: { ...profil, moments_importants: momentsMAJ }
    }, { onConflict: 'user_id' })

  console.log(`[Moments] ${nouveaux.length} nouveaux moments sauvegardés pour ${userId.slice(0, 8)}`)
  return nouveaux
}

// ─── Check quotidien : envoie les rappels pertinents ─────────────────────────
export async function runMomentsCheck(pushSubscriptions) {
  console.log('[Moments] 📅 Check anniversaires & moments...')
  const supabase  = getSupabase()
  const aujourd   = new Date()
  const dateStr   = aujourd.toISOString().split('T')[0]

  // Récupérer tous les profils avec des moments
  const { data: profils } = await supabase
    .from('profils')
    .select('user_id, profil')
    .not('profil->moments_importants', 'is', null)

  if (!profils?.length) return { rappels: 0 }

  let rappels = 0

  for (const { user_id, profil } of profils) {
    const moments = profil?.moments_importants || []
    if (!moments.length) continue

    // Vérifier si un moment approche
    for (const moment of moments) {
      if (!moment.date_mentionnee) continue

      try {
        const dateMoment = new Date(moment.date_mentionnee)
        if (isNaN(dateMoment.getTime())) continue

        const joursRestants = Math.round((dateMoment - aujourd) / (24 * 60 * 60 * 1000))
        const rappelSeuil   = moment.rappel_avant_jours ?? 1

        if (joursRestants === rappelSeuil || joursRestants === 0) {
          const sub = pushSubscriptions?.get(user_id)
          if (!sub) continue

          const titre = joursRestants === 0
            ? `Aujourd'hui : ${moment.description}`
            : `Dans ${joursRestants}j : ${moment.description}`

          try {
            await webpush.sendNotification(sub, JSON.stringify({
              title: titre,
              body:  'Solenn se souvient et pense à toi',
              icon:  '/icon-192.png',
              data:  { url: '/' },
            }))
            rappels++
          } catch (_) {}
        }
      } catch (_) {}
    }
  }

  // Extraction quotidienne depuis les conversations des dernières 24h
  const dateRecente = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: recentChats } = await supabase
    .from('solenn_chats')
    .select('user_id, messages')
    .gte('session_date', dateRecente)

  for (const chat of (recentChats || [])) {
    try {
      const texte = (chat.messages || [])
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n')

      if (texte.length < 20) continue

      const nouveaux = await extraireMoments(chat.user_id, texte)
      if (nouveaux.length) {
        await sauvegarderMoments(chat.user_id, nouveaux)
      }
    } catch (_) {}
  }

  console.log(`[Moments] ✅ ${rappels} rappels envoyés`)
  return { rappels }
}
