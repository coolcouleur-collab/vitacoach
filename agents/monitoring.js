/**
 * AGENT MONITORING SANTÉ
 * ─────────────────────────────────────────────────────────────────────────────
 * Surveille les métriques de chaque utilisateur abonné aux notifications.
 * Si une métrique est préoccupante (sommeil < 5h, hydratation faible, etc.),
 * génère un message d'alerte personnalisé via Groq et l'envoie en push.
 *
 * Fréquence : toutes les 2h (configurable)
 * Déclenchement manuel possible via triggerManual()
 */

import Groq from 'groq-sdk'
import webpush from 'web-push'

// Lazy init — dotenv doit être chargé avant le premier appel
let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// ─── Seuils d'alerte ─────────────────────────────────────────────────────────
const SEUILS = {
  sommeil:   { min: 5,    label: 'sommeil insuffisant',     emoji: '😴' },
  pas:       { min: 3000, label: 'très peu de mouvement',   emoji: '🚶' },
  eau:       { min: 3,    label: 'hydratation faible',      emoji: '💧' },
  humeur:    { min: 2,    label: 'humeur basse',            emoji: '😔' },
  fc:        { min: 40,   max: 110, label: 'FC anormale',   emoji: '❤️' },
}

// ─── Analyse les métriques d'un utilisateur ──────────────────────────────────
function analyserAlertes(metriques) {
  if (!metriques) return []
  const alertes = []

  if (metriques.sommeil > 0 && metriques.sommeil < SEUILS.sommeil.min)
    alertes.push({ ...SEUILS.sommeil, valeur: metriques.sommeil, unite: 'h' })

  if (metriques.pas > 0 && metriques.pas < SEUILS.pas.min)
    alertes.push({ ...SEUILS.pas, valeur: metriques.pas, unite: ' pas' })

  if (metriques.eau > 0 && metriques.eau < SEUILS.eau.min)
    alertes.push({ ...SEUILS.eau, valeur: metriques.eau, unite: '/8 verres' })

  if (metriques.humeur > 0 && metriques.humeur < SEUILS.humeur.min)
    alertes.push({ ...SEUILS.humeur, valeur: metriques.humeur, unite: '/5' })

  if (metriques.fc > 0 && (metriques.fc < SEUILS.fc.min || metriques.fc > SEUILS.fc.max))
    alertes.push({ ...SEUILS.fc, valeur: metriques.fc, unite: ' bpm' })

  return alertes
}

// ─── Génère un message d'alerte via Groq ─────────────────────────────────────
async function genererMessageAlerte(profil, alertes) {
  const resumeAlertes = alertes.map(a => `${a.emoji} ${a.label} (${a.valeur}${a.unite})`).join(', ')

  const resp = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'Tu es Solenn, coach de santé. Génère un message push court (max 80 chars) bienveillant et motivant. Pas de guillemets. Pas d\'emoji. Texte simple et chaleureux.'
      },
      {
        role: 'user',
        content: `${profil.nom || 'Utilisateur'} a : ${resumeAlertes}. Génère un message d'alerte bienveillant.`
      }
    ],
    max_tokens: 80,
    temperature: 0.75,
  })

  return resp.choices[0].message.content.trim().replace(/^"|"$/g, '')
}

// ─── Envoie une notification push ────────────────────────────────────────────
async function envoyerNotif(subscription, payload) {
  const { _meta, ...sub } = subscription
  await webpush.sendNotification(sub, JSON.stringify(payload))
}

// ─── Fonction principale : scan de tous les utilisateurs ─────────────────────
export async function runMonitoring(pushSubscriptions) {
  const now = new Date()
  const heure = now.getHours()

  // Ne monitore pas la nuit (23h → 6h)
  if (heure >= 23 || heure < 6) return { skipped: true, reason: 'nuit' }

  let alertesEnvoyees = 0
  let erreurs = 0

  for (const [userId, entry] of pushSubscriptions) {
    try {
      const meta = entry._meta || {}
      const { profil, metriques } = meta

      if (!profil || !metriques) continue

      const alertes = analyserAlertes(metriques)
      if (alertes.length === 0) continue

      const message = await genererMessageAlerte(profil, alertes)

      await envoyerNotif(entry, {
        title: 'Solenn — Alerte santé',
        body: message,
        url: '/?tab=sante',
        tag: 'monitoring-' + Date.now(),
        icon: '/icon-192.png',
      })

      alertesEnvoyees++
      console.log(`[Monitoring] Alerte envoyée à ${profil.nom || userId}: ${message}`)

    } catch (err) {
      if (err.statusCode === 410) {
        pushSubscriptions.delete(userId)
        console.log(`[Monitoring] Subscription expirée supprimée: ${userId}`)
      } else {
        console.error(`[Monitoring] Erreur pour ${userId}:`, err.message)
        erreurs++
      }
    }
  }

  console.log(`[Monitoring] Cycle terminé — ${alertesEnvoyees} alertes, ${erreurs} erreurs, ${pushSubscriptions.size} users`)
  return { alertesEnvoyees, erreurs, total: pushSubscriptions.size }
}

// ─── Mise à jour des métriques d'un utilisateur (appelée depuis /api/metriques) ─
export function updateMetriques(pushSubscriptions, userId, metriques) {
  const entry = pushSubscriptions.get(userId)
  if (entry) {
    entry._meta = { ...entry._meta, metriques, lastUpdate: Date.now() }
    console.log(`[Monitoring] Métriques mises à jour pour ${userId}`)
  }
}
