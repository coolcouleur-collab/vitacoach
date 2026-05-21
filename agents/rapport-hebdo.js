/**
 * AGENT RAPPORT HEBDO — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Génère chaque dimanche soir un rapport personnalisé pour chaque utilisateur :
 *   • Score de bien-être de la semaine
 *   • Victoire à célébrer
 *   • Analyse chaleureuse
 *   • 1 focus pour la semaine suivante
 *   • Message personnel de Solenn
 *
 * Sauvegarde dans Supabase (table rapports_hebdo) + push notification.
 * Frontend : récupère via GET /api/rapport-hebdo?userId=...
 *
 * Fréquence : dimanche 19:00
 * Trigger manuel : POST /api/agents-trigger { agent: 'rapport-hebdo' }
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

// ─── Génère le rapport pour un user ──────────────────────────────────────────
export async function genererRapportUser(userId) {
  const supabase = getSupabase()
  const groq = getGroq()

  const aujourd = new Date()
  const dateDebut = new Date(aujourd - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const dateFin   = aujourd.toISOString().split('T')[0]

  // Métriques de la semaine
  const { data: metriques } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', dateDebut)

  // Profil & mémoire
  const { data: profilRow } = await supabase
    .from('profils')
    .select('profil')
    .eq('user_id', userId)
    .single()

  const profil       = profilRow?.profil || {}
  const memoire      = profil?.memoire_longue || null
  const nom          = profil?.nom || profil?.prenom || 'toi'

  // Sessions chat
  const { data: chats } = await supabase
    .from('solenn_chats')
    .select('session_date, messages')
    .eq('user_id', userId)
    .gte('session_date', dateDebut)

  const nbSessions  = chats?.length || 0
  const nbMessages  = chats?.reduce((acc, c) => acc + (c.messages?.filter(m => m.role === 'user').length || 0), 0) || 0

  // Calculs moyennes
  const calcMoy = (arr, key) => {
    const vals = (arr || []).map(m => m[key]).filter(v => v != null && v > 0)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }
  const stats = {
    avgSommeil:  calcMoy(metriques, 'sommeil')?.toFixed(1),
    avgEau:      calcMoy(metriques, 'eau')?.toFixed(1),
    avgPas:      Math.round(calcMoy(metriques, 'pas') || 0),
    avgHumeur:   calcMoy(metriques, 'humeur')?.toFixed(1),
    avgScore:    Math.round(calcMoy(metriques, 'score') || 0),
    joursData:   metriques?.length || 0,
    nbSessions,
    nbMessages,
  }

  const prompt = `Tu es Solenn, coach IA premium bienveillante et authentique.
Génère le rapport hebdomadaire de ${nom}.

DONNÉES SEMAINE (${dateDebut} → ${dateFin}) :
- Sommeil moyen    : ${stats.avgSommeil ? stats.avgSommeil + 'h' : 'non renseigné'}
- Hydratation moy. : ${stats.avgEau ? stats.avgEau + ' verres/j' : 'non renseignée'}
- Pas quotidiens   : ${stats.avgPas ? stats.avgPas.toLocaleString() : 'non renseigné'}
- Humeur moy.      : ${stats.avgHumeur ? stats.avgHumeur + '/5' : 'non renseignée'}
- Score bien-être  : ${stats.avgScore || 'non calculé'}/100
- Jours avec données : ${stats.joursData}/7
- Conversations avec Solenn : ${nbSessions} sessions, ${nbMessages} messages

MÉMOIRE :
${memoire?.resume_court || 'Première semaine de suivi'}
${memoire?.objectifs_mentionnes?.length ? 'Objectifs : ' + memoire.objectifs_mentionnes.slice(0, 2).join(', ') : ''}

Génère un rapport chaleureux, honnête, motivant. Pas de faux enthousiasme si les données sont mauvaises.
Format JSON :
{
  "titre": "Ton rapport de la semaine, [prénom]",
  "score_global": 0-100,
  "emoji_semaine": "1 emoji qui résume la semaine",
  "victoire_semaine": "1 victoire concrète à célébrer (même petite)",
  "stat_phare": { "valeur": "...", "label": "...", "emoji": "..." },
  "analyse": "2-3 phrases authentiques et chaleureuses sur la semaine",
  "point_fort": "ce qui s'est bien passé",
  "point_progres": "1 chose à améliorer, formulée positivement",
  "focus_prochain": "1 seul focus actionnable pour la semaine prochaine",
  "message_solenn": "message personnel de Solenn à ${nom}, 1-2 phrases max, intime et sincère"
}`

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Tu es Solenn. Réponds uniquement en JSON valide, sans markdown.' },
      { role: 'user',   content: prompt }
    ],
    temperature: 0.45,
    max_tokens: 700,
  })

  const raw   = res.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON invalide rapport hebdo')

  return {
    ...JSON.parse(match[0]),
    stats,
    periode: { debut: dateDebut, fin: dateFin },
    generatedAt: new Date().toISOString(),
  }
}

// ─── Runner principal ─────────────────────────────────────────────────────────
export async function runRapportHebdo(pushSubscriptions) {
  console.log('[RapportHebdo] 📊 Génération rapports hebdomadaires...')
  const supabase = getSupabase()

  const dateDebut = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: rows } = await supabase
    .from('solenn_chats')
    .select('user_id')
    .gte('session_date', dateDebut)

  if (!rows?.length) return { generes: 0 }

  const userIds = [...new Set(rows.map(r => r.user_id))]
  let generes = 0

  for (const userId of userIds) {
    try {
      const rapport = await genererRapportUser(userId)

      // Sauvegarder dans Supabase
      await supabase
        .from('rapports_hebdo')
        .upsert({
          user_id:    userId,
          semaine:    dateDebut,
          rapport,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id,semaine' })

      // Push notification
      const sub = pushSubscriptions?.get(userId)
      if (sub) {
        try {
          await webpush.sendNotification(sub, JSON.stringify({
            title: `📊 ${rapport.emoji_semaine} Ton rapport de la semaine`,
            body:  rapport.victoire_semaine || rapport.message_solenn || 'Ton bilan personnalisé est prêt',
            icon:  '/icon-192.png',
            data:  { url: '/?onglet=rapport' },
          }))
        } catch (_) {}
      }

      generes++
    } catch (e) {
      console.error(`[RapportHebdo] Erreur user ${userId.slice(0, 8)}:`, e.message)
    }
  }

  console.log(`[RapportHebdo] ✅ ${generes}/${userIds.length} rapports générés`)
  return { generes, total: userIds.length }
}
