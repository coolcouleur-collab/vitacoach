import Groq from 'groq-sdk'
import { requireOwner } from './_auth.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authUser = await requireOwner(req, res, null)
  if (!authUser) return
  const { metriques, profil } = req.body

  function scoreMetrique(key, val) {
    if (key === 'pas')     return val >= 10000 ? '✅ objectif atteint' : val >= 7000 ? '🟡 bon effort' : val > 0 ? '🔴 insuffisant' : '⚪ non renseigné'
    if (key === 'sommeil') return val >= 7.5 ? '✅ excellent' : val >= 6 ? '🟡 correct' : val > 0 ? '🔴 insuffisant' : '⚪ non renseigné'
    if (key === 'eau')     return val >= 8 ? '✅ objectif atteint' : val >= 5 ? '🟡 à améliorer' : val > 0 ? '🔴 déshydratation' : '⚪ non renseigné'
    if (key === 'fc')      return (val >= 50 && val <= 70) ? '✅ excellent' : (val > 0 && val <= 100) ? '🟡 normal' : val > 0 ? '🔴 surveiller' : '⚪ non renseigné'
    if (key === 'humeur')  return val >= 4 ? '✅ très bien' : val === 3 ? '🟡 moyen' : val > 0 ? '🔴 difficile' : '⚪ non renseigné'
    return '⚪'
  }

  const prompt = `Tu es Solenn, coach santé expert et bienveillant.

Analyse les métriques santé de ${profil?.nom || 'l\'utilisateur'} et génère 4 insights personnalisés, concrets et actionnables.

PROFIL :
- Objectifs : ${profil?.objectifs?.join(', ') || 'bien-être général'}
- Alimentation : ${profil?.regimes?.join(', ') || 'standard'}
- Carences : ${profil?.carences?.join(', ') || 'aucune'}
- Réveil : ${profil?.reveil || '07:00'} · Coucher : ${profil?.coucher || '23:00'}

MÉTRIQUES DU JOUR :
- 👣 Pas : ${metriques?.pas || 0} → ${scoreMetrique('pas', metriques?.pas || 0)}
- 😴 Sommeil : ${metriques?.sommeil || 0}h → ${scoreMetrique('sommeil', metriques?.sommeil || 0)}
- 💧 Eau : ${metriques?.eau || 0} verres → ${scoreMetrique('eau', metriques?.eau || 0)}
- ❤️ FC : ${metriques?.fc || 0} bpm → ${scoreMetrique('fc', metriques?.fc || 0)}
- 😊 Humeur : ${metriques?.humeur || 0}/5 → ${scoreMetrique('humeur', metriques?.humeur || 0)}
- ⚖️ Poids : ${metriques?.poids || 0} kg

Génère 4 insights :
- 1 point positif (ce qui est bien)
- 2 points d'amélioration concrets et actionnables (que faire MAINTENANT)
- 1 conseil préventif personnalisé (basé sur le profil et les carences)

Réponds UNIQUEMENT en JSON valide :
{
  "points": [
    {"emoji": "✅", "message": "Point positif personnalisé et encourageant"},
    {"emoji": "💧", "message": "Action concrète à faire maintenant pour améliorer une métrique"},
    {"emoji": "🚶", "message": "Deuxième action concrète"},
    {"emoji": "💡", "message": "Conseil préventif basé sur le profil"}
  ]
}`

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role:'system', content:'Tu es un coach santé. Réponds en JSON valide uniquement.' },
      { role:'user', content:prompt }
    ],
    temperature: 0.7,
    max_tokens: 600
  })

  try {
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch {
    res.json({
      points: [
        { emoji:'💡', message:'Saisis tes métriques du jour pour obtenir une analyse personnalisée complète.' }
      ]
    })
  }
}
