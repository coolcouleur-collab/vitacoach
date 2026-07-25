/**
 * AGENT MORNING BRIEF — le message du matin, dans le chat
 * ─────────────────────────────────────────────────────────────────────────────
 * L'agent notifications (07:00) envoie du push web — mais les souscriptions
 * sont en mémoire et le push natif n'est pas branché : la plupart des
 * utilisateurs ne reçoivent rien. Cet agent écrit le message matinal en BASE
 * (table morning_messages), et le client l'affiche comme premier message de
 * Solenn dans le chat à l'ouverture de l'app.
 *
 * C'est le mécanisme de retour quotidien : Solenn écrit la première, chaque
 * matin, en s'appuyant sur les données de la veille (sommeil, pas, humeur,
 * challenge en cours). Rétention = champ de bataille n°1 des apps IA
 * (churn +30 % vs apps classiques — étude de marché 2026-07-21).
 *
 * Tourne à 06:45 Europe/Paris, avant l'ouverture matinale typique.
 * Table requise : db/morning-messages.sql
 */

import Groq from 'groq-sdk'
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

// ─── Contexte de la veille pour un utilisateur ───────────────────────────────
async function contexteVeille(sb, userId) {
  const hier = dateStr(new Date(Date.now() - 24 * 3600 * 1000))
  const today = dateStr(new Date())
  try {
    const moisDernier = dateStr(new Date(Date.now() - 30 * 864e5))
    const [mHier, mJour, challenge, insight, dernierRepas, pesees] = await Promise.all([
      sb.from('user_metrics').select('sommeil, pas, humeur, eau').eq('user_id', userId).eq('date', hier).maybeSingle(),
      sb.from('user_metrics').select('sommeil').eq('user_id', userId).eq('date', today).maybeSingle(),
      sb.from('challenges').select('challenge, progression, date_debut').eq('user_id', userId).eq('actif', true).maybeSingle(),
      sb.from('user_insights').select('insight, type').eq('user_id', userId).order('computed_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('repas').select('resume, analyse').eq('user_id', userId).eq('date', hier).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('user_metrics').select('date, poids').eq('user_id', userId).gt('poids', 0).gte('date', moisDernier).order('date', { ascending: true }),
    ])
    return {
      hier: mHier?.data || null, nuit: mJour?.data || null, challenge: challenge?.data || null,
      insight: insight?.data || null, repasHier: dernierRepas?.data || null,
      pesees: pesees?.data || [],
    }
  } catch {
    return {}
  }
}

// ─── Adaptations structurées de la journée (calculées en code) ───────────────
// C'est la card « Ta journée est prête » du HomeTab : chaque adaptation dit
// CE QUE Solenn a ajusté et POURQUOI (la raison = les données de l'utilisateur).
function calculerAdaptations(ctx) {
  const adaptations = []
  const sommeil = ctx.nuit?.sommeil || 0
  if (sommeil > 0 && sommeil < 6.5) {
    adaptations.push({ type: 'allege', titre: 'Journée allégée', raison: `Nuit courte (${sommeil}h) — objectifs réduits, récupération en priorité` })
  } else if (sommeil >= 8) {
    adaptations.push({ type: 'boost', titre: 'Journée ambitieuse', raison: `Belle nuit (${sommeil}h) — c'est le jour pour pousser un peu plus` })
  }
  if (ctx.hier?.humeur > 0 && ctx.hier.humeur <= 2) {
    adaptations.push({ type: 'soft', titre: 'Douceur au programme', raison: `Humeur difficile hier (${ctx.hier.humeur}/5) — pas de pression aujourd'hui` })
  }
  if (ctx.challenge) {
    const jour = Math.min(Math.max(Math.floor((Date.now() - new Date(ctx.challenge.date_debut).getTime()) / 864e5) + 1, 1), 21)
    const action = ctx.challenge.challenge?.jours?.[jour - 1]?.action
    if (action) adaptations.push({ type: 'challenge', titre: `Challenge — jour ${jour}/21`, raison: action })
  }
  if (ctx.hier?.pas > 0 && ctx.hier.pas >= 10000) {
    adaptations.push({ type: 'bravo', titre: 'Objectif pas atteint hier', raison: `${ctx.hier.pas} pas — on garde la lancée` })
  }
  return adaptations
}

function decrireContexte(ctx) {
  const lines = []
  const sommeil = ctx.nuit?.sommeil || 0
  if (sommeil > 0) lines.push(`Sommeil cette nuit : ${sommeil}h${sommeil < 6.5 ? ' (nuit courte — sois douce, allège la journée)' : sommeil >= 8 ? ' (belle nuit)' : ''}`)
  if (ctx.hier?.pas > 0) lines.push(`Pas hier : ${ctx.hier.pas}${ctx.hier.pas >= 10000 ? ' (objectif atteint hier — félicite)' : ''}`)
  if (ctx.hier?.humeur > 0) lines.push(`Humeur hier : ${ctx.hier.humeur}/5${ctx.hier.humeur <= 2 ? ' — prends-en soin ce matin' : ''}`)
  if (ctx.challenge) {
    const jour = Math.min(Math.max(Math.floor((Date.now() - new Date(ctx.challenge.date_debut).getTime()) / 864e5) + 1, 1), 21)
    const action = ctx.challenge.challenge?.jours?.[jour - 1]?.action
    lines.push(`Challenge 21 jours : jour ${jour}/21${action ? ` — action du jour : ${action}` : ''}`)
  }
  if (ctx.repasHier?.analyse?.qualite) lines.push(`Dernier repas photographié hier : qualité ${ctx.repasHier.analyse.qualite}/5${ctx.repasHier.analyse.qualite <= 2 ? ' — suggère un déjeuner équilibré sans culpabiliser' : ''}`)
  if (ctx.pesees?.length >= 2) {
    const p0 = Number(ctx.pesees[0].poids), p1 = Number(ctx.pesees[ctx.pesees.length - 1].poids)
    if (Math.abs(p1 - p0) >= 0.3) lines.push(`Poids sur 30 jours : ${p0.toFixed(1)} → ${p1.toFixed(1)} kg (n'en parle QUE si son objectif concerne le corps/poids, et TOUJOURS sans jugement ni félicitation chiffrée — ton apaisé, jamais de culpabilisation)`)
  }
  if (ctx.insight?.insight) lines.push(`Pattern détecté sur son historique (à glisser naturellement si pertinent) : « ${ctx.insight.insight} »`)
  return lines
}

// ─── Run principal ───────────────────────────────────────────────────────────
export async function runMorningBrief() {
  const sb = getSupabase()
  if (!sb) return { erreur: 'Supabase non configuré' }

  // Utilisateurs actifs = au moins une métrique sur les 7 derniers jours
  const d7 = dateStr(new Date(Date.now() - 7 * 864e5))
  const { data: actifs } = await sb.from('user_metrics').select('user_id').gte('date', d7)
  const userIds = [...new Set((actifs || []).map(r => r.user_id))]
  if (!userIds.length) return { generes: 0, note: 'aucun utilisateur actif J7' }

  const today = dateStr(new Date())
  let generes = 0, erreurs = 0

  for (const userId of userIds) {
    try {
      // Déjà généré aujourd'hui → skip (idempotent si relancé)
      const { data: deja } = await sb.from('morning_messages')
        .select('user_id').eq('user_id', userId).eq('date', today).maybeSingle()
      if (deja) continue

      const { data: prof } = await sb.from('profils').select('profil').eq('user_id', userId).maybeSingle()
      const profil = prof?.profil || {}
      const ctx = await contexteVeille(sb, userId)
      const contexte = decrireContexte(ctx)

      const completion = await getGroq().chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [{
          role: 'system',
          content: `Tu es Solenn, coach bien-être. Écris LE message du matin pour ${profil.nom || 'ton utilisateur'} — 2 à 3 phrases maximum, chaleureux, concret, en tutoiement. Appuie-toi sur le contexte réel fourni (c'est ta force : personne d'autre ne le fait). Une seule micro-action proposée pour la journée. Pas d'emoji, pas de guillemets, pas de signature.${profil.objectif ? ` Objectif de la personne : ${profil.objectif}.` : ''}`,
        }, {
          role: 'user',
          content: contexte.length ? `Contexte du jour :\n${contexte.join('\n')}` : 'Pas de données récentes — message d\'accueil du matin simple et motivant.',
        }],
        max_tokens: 160,
        temperature: 0.8,
      })

      const message = completion.choices?.[0]?.message?.content?.trim()
      if (!message) continue

      const adaptations = calculerAdaptations(ctx)
      await sb.from('morning_messages').upsert(
        { user_id: userId, date: today, message, adaptations, created_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      )
      generes++
    } catch (e) {
      erreurs++
      console.error('[MorningBrief]', userId, e.message)
    }
  }

  console.log(`[MorningBrief] ${generes} messages générés, ${erreurs} erreurs, ${userIds.length} actifs J7`)
  return { generes, erreurs, actifsJ7: userIds.length }
}
