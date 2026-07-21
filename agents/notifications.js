/**
 * AGENT NOTIFICATIONS PROACTIVES — Solenn t'écrit la première
 * ─────────────────────────────────────────────────────────────────────────────
 * Envoie des push notifications de coaching personnalisées aux utilisateurs
 * à 3 moments clés de la journée :
 *   • 07h00 — Bonjour, contextualisé sur la nuit réelle + check-in de la veille
 *   • 12h30 — Check-in de mi-journée
 *   • 19h30 — Récap + conseil du soir, contextualisé sur la journée réelle
 *
 * Contrairement à la v1 (métadonnées figées à l'abonnement), le contexte est
 * relu EN BASE au moment de l'envoi : sommeil de la nuit, humeur du check-in,
 * pas, score. C'est ce qui permet « Nuit courte détectée, j'ai allégé ta
 * routine » — le message que personne d'autre n'envoie.
 */

import Groq from 'groq-sdk'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

let _supabase = null
function getSupabase() {
  if (!_supabase && process.env.SUPABASE_URL) _supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  )
  return _supabase
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Contexte frais relu en base au moment de l'envoi ────────────────────────
async function contexteFrais(userId) {
  const sb = getSupabase()
  if (!sb || !userId) return {}
  const today = dateStr(new Date())
  const hier  = dateStr(new Date(Date.now() - 24 * 3600 * 1000))
  try {
    const [mToday, mHier, cHier, cToday, prof] = await Promise.all([
      sb.from('user_metrics').select('sommeil, pas, humeur, eau').eq('user_id', userId).eq('date', today).maybeSingle(),
      sb.from('user_metrics').select('sommeil, pas, humeur').eq('user_id', userId).eq('date', hier).maybeSingle(),
      sb.from('checkins').select('mood, tags').eq('user_id', userId).eq('date', hier).maybeSingle(),
      sb.from('checkins').select('mood, tags').eq('user_id', userId).eq('date', today).maybeSingle(),
      sb.from('profils').select('profil').eq('user_id', userId).maybeSingle(),
    ])
    return {
      metriquesJour: mToday?.data || null,
      metriquesHier: mHier?.data || null,
      checkinHier:   cHier?.data || null,
      checkinJour:   cToday?.data || null,
      profil:        prof?.data?.profil || null,
    }
  } catch {
    return {}
  }
}

// ─── Description compacte du contexte pour le prompt ─────────────────────────
function decrireContexte(moment, ctx, streak, score) {
  const lines = []
  const mj = ctx.metriquesJour, mh = ctx.metriquesHier

  if (moment === 'matin') {
    const sommeil = mj?.sommeil || 0
    if (sommeil > 0) {
      lines.push(`Sommeil cette nuit : ${sommeil}h${sommeil < 6.5 ? ' (NUIT COURTE — adapte le message : douceur, allège la journée)' : sommeil >= 8 ? ' (belle nuit — énergie disponible)' : ''}`)
    }
    if (ctx.checkinHier?.mood) {
      lines.push(`Humeur d'hier soir : ${ctx.checkinHier.mood}/5${ctx.checkinHier.tags?.length ? ` (${ctx.checkinHier.tags.join(', ')})` : ''}${ctx.checkinHier.mood <= 2 ? ' — prends-en soin ce matin' : ''}`)
    }
  }
  if (moment === 'midi' && mj) {
    if (mj.eau > 0) lines.push(`Hydratation : ${mj.eau}/8 verres`)
    if (mj.pas > 0) lines.push(`Pas ce matin : ${mj.pas}`)
    if (ctx.checkinJour?.mood) lines.push(`Humeur du matin : ${ctx.checkinJour.mood}/5`)
  }
  if (moment === 'soir') {
    if (mj?.pas > 0) lines.push(`Pas aujourd'hui : ${mj.pas}${mj.pas >= 10000 ? ' (objectif atteint — félicite)' : ''}`)
    if (ctx.checkinJour?.mood) {
      lines.push(`Humeur du jour : ${ctx.checkinJour.mood}/5${ctx.checkinJour.tags?.length ? ` (${ctx.checkinJour.tags.join(', ')})` : ''}`)
    }
    if (mh?.sommeil > 0 && mh.sommeil < 6.5) lines.push('Nuit dernière courte — encourage un coucher plus tôt ce soir')
  }
  if (streak > 1) lines.push(`Streak : ${streak} jours consécutifs`)
  if (score > 0)  lines.push(`Score santé : ${score}/100`)
  return lines
}

// ─── Moments de la journée ───────────────────────────────────────────────────
const MOMENTS = {
  matin: {
    heure: '07h00',
    tag: 'notif-matin',
    url: '/?tab=routine',
    titlePrefix: 'Solenn — Bonjour',
    systemInstruction: `Tu es Solenn, coach bien-être. Génère UNE notification push du matin (max 110 chars).
Si le contexte contient une donnée marquante (nuit courte, humeur basse, belle nuit), le message DOIT s'y référer concrètement — c'est ta signature : tu as remarqué, tu adaptes.
Sinon : motivation matinale simple avec un objectif concret.
Ton : chaleureux, direct, jamais culpabilisant. Pas d'emoji, pas de guillemets.`,
  },
  midi: {
    heure: '12h30',
    tag: 'notif-midi',
    url: '/?tab=sante',
    titlePrefix: 'Solenn — Mi-journée',
    systemInstruction: `Tu es Solenn, coach bien-être. Génère UNE notification push de mi-journée (max 110 chars).
Appuie-toi sur le contexte réel si présent (hydratation en retard, pas, humeur du matin). Sinon : rappel d'une habitude clé (eau, mouvement, respiration).
Ton : pratique et bienveillant. Pas d'emoji, pas de guillemets.`,
  },
  soir: {
    heure: '19h30',
    tag: 'notif-soir',
    url: '/?tab=accueil',
    titlePrefix: 'Solenn — Bonsoir',
    systemInstruction: `Tu es Solenn, coach bien-être. Génère UNE notification push du soir (max 110 chars).
Appuie-toi sur le contexte réel si présent (objectif pas atteint → félicite, humeur difficile → douceur, nuit courte hier → suggère un coucher plus tôt). Sinon : décompression et préparation au sommeil.
Ton : chaleureux et apaisant. Pas d'emoji, pas de guillemets.`,
  },
}

// ─── Génère un message personnalisé via Groq ─────────────────────────────────
async function genererMessage(moment, profil, contextLines) {
  const ctx = MOMENTS[moment]
  const userContent = [
    `Utilisateur : ${profil?.nom || 'inconnu'} · Objectifs : ${profil?.objectifs?.join(', ') || 'bien-être'}`,
    contextLines.length ? `CONTEXTE RÉEL DU MOMENT :\n${contextLines.map(l => `- ${l}`).join('\n')}` : 'Aucune donnée du jour disponible.',
    'Génère le corps de la notification.',
  ].join('\n')

  const resp = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: ctx.systemInstruction },
      { role: 'user',   content: userContent }
    ],
    max_tokens: 90,
    temperature: 0.80,
  })

  return resp.choices[0].message.content.trim().replace(/^"|"$/g, '')
}

// ─── Envoie la notif push ─────────────────────────────────────────────────────
async function envoyerNotif(subscription, payload) {
  const { _meta, ...sub } = subscription
  await webpush.sendNotification(sub, JSON.stringify(payload))
}

/** Supprime une subscription expirée (Map + base). */
export async function supprimerSubscription(pushSubscriptions, userId) {
  pushSubscriptions.delete(userId)
  const sb = getSupabase()
  if (sb) {
    try { await sb.from('push_subscriptions').delete().eq('user_id', userId) } catch { /* ignore */ }
  }
}

// ─── Broadcast un moment précis à tous les utilisateurs ──────────────────────
export async function runNotifications(pushSubscriptions, moment) {
  if (!MOMENTS[moment]) {
    console.error(`[Notifications] Moment inconnu: ${moment}`)
    return { error: 'Moment invalide' }
  }

  const ctx = MOMENTS[moment]
  let envoyes = 0
  let erreurs = 0

  console.log(`[Notifications] Lancement broadcast ${moment} (${ctx.heure}) — ${pushSubscriptions.size} users`)

  for (const [userId, entry] of pushSubscriptions) {
    try {
      const meta = entry._meta || {}

      // Contexte FRAIS relu en base — c'est ça qui rend le message pertinent
      const frais  = await contexteFrais(userId)
      const profil = frais.profil || meta.profil || { nom: 'toi', objectifs: [] }
      const lines  = decrireContexte(moment, frais, meta.streak || 0, meta.score || 0)

      const body = await genererMessage(moment, profil, lines)

      await envoyerNotif(entry, {
        title: ctx.titlePrefix,
        body,
        url: ctx.url,
        tag: ctx.tag,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
      })

      envoyes++
      console.log(`[Notifications] ${moment} → ${profil.nom || userId}: "${body}"`)

      // Délai anti-spam entre chaque envoi (évite rate-limit Groq)
      await new Promise(r => setTimeout(r, 300))

    } catch (err) {
      if (err.statusCode === 410) {
        await supprimerSubscription(pushSubscriptions, userId)
        console.log(`[Notifications] Subscription expirée supprimée: ${userId}`)
      } else {
        console.error(`[Notifications] Erreur pour ${userId}:`, err.message)
        erreurs++
      }
    }
  }

  console.log(`[Notifications] Broadcast ${moment} terminé — ${envoyes} envoyés, ${erreurs} erreurs`)
  return { envoyes, erreurs, moment }
}
