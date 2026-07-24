import Groq from 'groq-sdk'
import { requireOwner } from './_auth.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authUser = await requireOwner(req, res, null)
  if (!authUser) return
  const { section } = req.body || {}
  const selections = Array.isArray(req.body?.selections) ? req.body.selections.map(s => String(s).slice(0, 100)).slice(0, 20) : []
  const texteLibre = String(req.body?.texteLibre || '').slice(0, 2000)

  const prompts = {
    alimentation: `Tu es un nutritionniste expert. L'utilisateur a sélectionné ces habitudes alimentaires : ${selections.join(', ')}.
Il décrit ses habitudes ainsi : "${texteLibre}"
Extrait et résume en 3-5 phrases clés les informations importantes.
Réponds en JSON avec ce format exact :
{"resume": "résumé court", "details": "détails complets à intégrer dans son profil nutritionnel"}`,
    style: `Tu es un expert en mode et stylisme. L'utilisateur a sélectionné ces styles : ${selections.join(', ')}.
Il décrit ses préférences vestimentaires ainsi : "${texteLibre}"
Réponds en JSON avec ce format exact :
{"resume": "résumé court", "details": "détails complets pour personnaliser ses conseils vestimentaires"}`,
    sante: `Tu es un professionnel de santé. L'utilisateur a sélectionné ces carences/conditions : ${selections.join(', ')}.
Il décrit sa situation de santé ainsi : "${texteLibre}"
IMPORTANT: Ne donne pas de conseils médicaux, juste extrais et organise les informations.
Réponds en JSON avec ce format exact :
{"resume": "résumé court", "details": "détails complets pour personnaliser ses conseils bien-être"}`
  }

  if (!prompts[section]) return res.status(400).json({ erreur: 'section invalide' })

  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      max_tokens: 600,
      messages: [
        { role: 'system', content: 'Tu es un assistant qui extrait et structure des informations de profil. Réponds toujours en JSON valide.' },
        { role: 'user', content: prompts[section] }
      ]
    })
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(jsonMatch[0])
    res.json(result)
  } catch {
    res.json({ resume: 'Profil analysé', details: texteLibre })
  }
}
