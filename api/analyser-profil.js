import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { section, selections, texteLibre } = req.body

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

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Tu es un assistant qui extrait et structure des informations de profil. Réponds toujours en JSON valide.' },
      { role: 'user', content: prompts[section] }
    ]
  })

  try {
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(jsonMatch[0])
    res.json(result)
  } catch {
    res.json({ resume: 'Profil analysé', details: texteLibre })
  }
}
