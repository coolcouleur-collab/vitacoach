import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { message, profil, historique = [] } = req.body

  const systemPrompt = `Tu es VitaCoach, un coach de vie personnel et bienveillant.
Tu connais parfaitement ton utilisateur :
- Nom: ${profil.nom}
- Age: ${profil.age} ans
- Taille: ${profil.taille || 'non renseigné'} cm, Poids: ${profil.poids || 'non renseigné'} kg
- Objectifs: ${profil.objectifs?.join(', ') || 'non renseigné'}
- Habitudes alimentaires: ${profil.alimentaireDetails || profil.regimes?.join(', ') || 'non renseigné'}
- Style vestimentaire: ${profil.styleDetails || profil.styles?.join(', ') || 'non renseigné'}
- Mensurations: ${profil.mensurations || 'non renseigné'}
- Carences et santé: ${profil.santeDetails || profil.carences?.join(', ') || 'non renseigné'}
- Maladies/Pathologies: ${profil.maladiesDetails || profil.maladies?.join(', ') || 'aucune renseignée'}

Tu te souviens des conversations précédentes et tu fais des références à ce qui a été dit avant.
Tu donnes des conseils personnalisés sur la nutrition, le sommeil, les tenues et le bien-être.
Tu es chaleureux, motivant et précis. Tu parles en français.`

  const messagesAPI = [
    { role: 'system', content: systemPrompt },
    ...historique.filter(m => m.role === 'user' || m.role === 'assistant').slice(-8),
    { role: 'user', content: message }
  ]

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: messagesAPI
  })

  res.json({ reply: response.choices[0].message.content })
}
