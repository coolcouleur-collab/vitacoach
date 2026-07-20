/**
 * AGENT NOTIFICATIONS PROACTIVES
 * ─────────────────────────────────────────────────────────────────────────────
 * Envoie des push notifications de coaching personnalisées aux utilisateurs
 * à 3 moments clés de la journée :
 *   • 07h00 — Bonjour + objectif du jour
 *   • 12h30 — Check-in de mi-journée
 *   • 19h30 — Récap + conseil du soir
 *
 * Chaque message est généré dynamiquement par Groq selon le profil, le score
 * et le streak de l'utilisateur.
 */

import Groq from 'groq-sdk'
import webpush from 'web-push'

let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// ─── Contexte selon le moment de la journée ──────────────────────────────────
const MOMENTS = {
  matin: {
    heure: '07h00',
    tag: 'notif-matin',
    url: '/?tab=routine',
    titlePrefix: 'Solenn — Bonjour',
    systemInstruction: 'Génère un message de motivation matinale court (max 80 chars). Énergie positive, objectif concret pour la journée. Pas d\'emoji. Texte simple et chaleureux.',
    userContext: (profil, streak, score) =>
      `${profil.nom} commence sa journée. Streak: ${streak} jours. Objectifs: ${profil.objectifs?.join(', ') || 'bien-être'}. Score hier: ${score}/100.`
  },
  midi: {
    heure: '12h30',
    tag: 'notif-midi',
    url: '/?tab=sante',
    titlePrefix: 'Solenn — Mi-journée',
    systemInstruction: 'Génère un rappel de mi-journée (max 80 chars). Hydratation, mouvement, respiration. Pratique et bienveillant. Pas d\'emoji. Texte simple et chaleureux.',
    userContext: (profil, streak, score) =>
      `${profil.nom} est en pleine journée. Rappelle une habitude santé clé. Objectifs: ${profil.objectifs?.join(', ') || 'bien-être'}.`
  },
  soir: {
    heure: '19h30',
    tag: 'notif-soir',
    url: '/?tab=accueil',
    titlePrefix: 'Solenn — Bonsoir',
    systemInstruction: 'Génère un message du soir (max 80 chars). Récupération, sommeil, décompression. Chaleureux et apaisant. Pas d\'emoji. Texte simple et chaleureux.',
    userContext: (profil, streak, score) =>
      `${profil.nom} termine sa journée. Score aujourd'hui: ${score}/100. Streak: ${streak} jours. Prépare au repos.`
  },
}

// ─── Génère un message personnalisé via Groq ─────────────────────────────────
async function genererMessage(moment, profil, streak = 0, score = 0) {
  const ctx = MOMENTS[moment]

  const resp = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: ctx.systemInstruction },
      { role: 'user',   content: ctx.userContext(profil, streak, score) }
    ],
    max_tokens: 80,
    temperature: 0.80,
  })

  return resp.choices[0].message.content.trim().replace(/^"|"$/g, '')
}

// ─── Envoie la notif push ─────────────────────────────────────────────────────
async function envoyerNotif(subscription, payload) {
  const { _meta, ...sub } = subscription
  await webpush.sendNotification(sub, JSON.stringify(payload))
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
      const profil = meta.profil || { nom: 'toi', objectifs: [] }
      const streak = meta.streak || 0
      const score  = meta.score  || 0

      const body = await genererMessage(moment, profil, streak, score)

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
        pushSubscriptions.delete(userId)
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
