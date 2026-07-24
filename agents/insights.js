/**
 * AGENT INSIGHTS LONGITUDINAUX — ce que Solenn sait de toi que tu ignores
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyse l'historique user_metrics (60 jours) pour détecter des patterns
 * que seule une app qui accumule TES données peut voir :
 *   • tendance : sommeil/pas/humeur en progression ou en recul (4 sem vs 4 sem)
 *   • jour faible : le jour de la semaine où le sommeil/l'humeur plonge
 *   • corrélation : humeur du lendemain selon la durée de la nuit
 *   • record : meilleure série de jours suivis
 *
 * Les calculs sont faits en code (fiables), le LLM ne fait que FORMULER.
 * Résultats → table user_insights (max 4 par utilisateur et par run).
 * Tourne le dimanche à 07:00. C'est le mécanisme n°2 de la thèse
 * « indispensable » : quitter Solenn = perdre quelqu'un qui te connaît.
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

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const moyenne = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

// ─── Détection de patterns (pur calcul, pas de LLM) ──────────────────────────
export function detecterPatterns(rows) {
  // rows : [{date, sommeil, pas, humeur}] triés par date croissante
  const patterns = []
  const valides = rows.filter(r => r.sommeil > 0 || r.pas > 0 || r.humeur > 0)
  if (valides.length < 10) return patterns // pas assez de données

  // 1. Tendance : 4 dernières semaines vs 4 précédentes
  const seuil = new Date(Date.now() - 28 * 864e5).toISOString().split('T')[0]
  for (const [champ, label, unite] of [['sommeil', 'sommeil', 'h'], ['pas', 'pas', ''], ['humeur', 'humeur', '/5']]) {
    const recents = valides.filter(r => r.date >= seuil && r[champ] > 0).map(r => Number(r[champ]))
    const anciens = valides.filter(r => r.date < seuil && r[champ] > 0).map(r => Number(r[champ]))
    if (recents.length >= 7 && anciens.length >= 7) {
      const mR = moyenne(recents), mA = moyenne(anciens)
      const deltaPct = ((mR - mA) / mA) * 100
      if (Math.abs(deltaPct) >= 8) {
        patterns.push({
          type: 'tendance',
          data: { champ, label, unite, avant: +mA.toFixed(1), maintenant: +mR.toFixed(1), deltaPct: +deltaPct.toFixed(0) },
        })
      }
    }
  }

  // 2. Jour faible : jour de semaine où le sommeil est nettement sous la moyenne
  const parJour = {}
  for (const r of valides) {
    if (!(r.sommeil > 0)) continue
    const j = new Date(r.date + 'T12:00:00').getDay()
    ;(parJour[j] = parJour[j] || []).push(Number(r.sommeil))
  }
  const globale = moyenne(valides.filter(r => r.sommeil > 0).map(r => Number(r.sommeil)))
  if (globale) {
    for (const [j, vals] of Object.entries(parJour)) {
      if (vals.length >= 4 && globale - moyenne(vals) >= 0.7) {
        patterns.push({
          type: 'jour_faible',
          data: { jour: JOURS[j], moyenneJour: +moyenne(vals).toFixed(1), moyenneGlobale: +globale.toFixed(1) },
        })
        break // un seul jour faible, le premier trouvé suffit
      }
    }
  }

  // 3. Corrélation nuit courte → humeur du lendemain
  const humeursApresCourte = [], humeursApresLongue = []
  for (let i = 1; i < valides.length; i++) {
    const hier = valides[i - 1], auj = valides[i]
    const consecutifs = (new Date(auj.date) - new Date(hier.date)) === 864e5
    if (!consecutifs || !(hier.sommeil > 0) || !(auj.humeur > 0)) continue
    if (hier.sommeil < 6.5) humeursApresCourte.push(Number(auj.humeur))
    else if (hier.sommeil >= 7.5) humeursApresLongue.push(Number(auj.humeur))
  }
  if (humeursApresCourte.length >= 4 && humeursApresLongue.length >= 4) {
    const mC = moyenne(humeursApresCourte), mL = moyenne(humeursApresLongue)
    if (mL - mC >= 0.6) {
      patterns.push({
        type: 'correlation',
        data: { humeurApresNuitCourte: +mC.toFixed(1), humeurApresBonneNuit: +mL.toFixed(1) },
      })
    }
  }

  // 4. Record de régularité : plus longue série de jours consécutifs suivis
  let record = 1, serie = 1
  for (let i = 1; i < valides.length; i++) {
    if (new Date(valides[i].date) - new Date(valides[i - 1].date) === 864e5) {
      serie++; record = Math.max(record, serie)
    } else serie = 1
  }
  if (record >= 7) patterns.push({ type: 'record', data: { jours: record } })

  return patterns.slice(0, 4)
}

// ─── Formulation par Solenn ──────────────────────────────────────────────────
async function formuler(patterns, prenom) {
  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'system',
      content: `Tu es Solenn, coach bien-être. On te donne des patterns détectés dans les données de ${prenom || 'ton utilisateur'} (JSON). Pour CHACUN, écris UNE phrase percutante en tutoiement qui révèle le pattern avec ses chiffres — le genre de phrase qu'on ne peut dire que quand on connaît vraiment quelqu'un. Pas de conseil moralisateur, pas d'emoji. Réponds UNIQUEMENT en JSON : {"insights":[{"type":"...","phrase":"..."}]} dans le même ordre.`,
    }, { role: 'user', content: JSON.stringify(patterns) }],
    max_tokens: 500,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })
  try {
    const parsed = JSON.parse(completion.choices[0].message.content)
    return parsed.insights || []
  } catch { return [] }
}

// ─── Run principal ───────────────────────────────────────────────────────────
export async function runInsights() {
  const sb = getSupabase()
  if (!sb) return { erreur: 'Supabase non configuré' }

  const depuis = new Date(Date.now() - 60 * 864e5).toISOString().split('T')[0]
  const { data: metrics } = await sb.from('user_metrics')
    .select('user_id, date, sommeil, pas, humeur')
    .gte('date', depuis).order('date', { ascending: true })

  const parUser = {}
  for (const m of metrics || []) (parUser[m.user_id] = parUser[m.user_id] || []).push(m)

  let usersAvecInsights = 0, totalInsights = 0, erreurs = 0
  for (const [userId, rows] of Object.entries(parUser)) {
    try {
      const patterns = detecterPatterns(rows)
      if (!patterns.length) continue

      const { data: prof } = await sb.from('profils').select('profil').eq('user_id', userId).maybeSingle()
      const phrases = await formuler(patterns, prof?.profil?.nom)
      if (!phrases.length) continue

      // Remplace les insights de la semaine précédente (on garde la table légère)
      await sb.from('user_insights').delete().eq('user_id', userId)
      const lignes = patterns.map((p, i) => ({
        user_id: userId,
        type: p.type,
        insight: phrases[i]?.phrase || '',
        data: p.data,
      })).filter(l => l.insight)
      if (lignes.length) {
        await sb.from('user_insights').insert(lignes)
        usersAvecInsights++; totalInsights += lignes.length
      }
    } catch (e) {
      erreurs++
      console.error('[Insights]', userId, e.message)
    }
  }

  console.log(`[Insights] ${totalInsights} insights pour ${usersAvecInsights} utilisateurs (${erreurs} erreurs)`)
  return { usersAvecInsights, totalInsights, erreurs }
}
