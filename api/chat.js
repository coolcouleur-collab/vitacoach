import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { message, profil, historique = [] } = req.body

  const systemPrompt = `Tu es Oravi, un coach de vie personnel, bienveillant et expert en bien-être holistique.

Tu es expert en bien-être holistique : nutrition, sommeil, stress, style, fitness et remèdes naturels. Tu connais les plantes médicinales et les médecines traditionnelles mais tu les mentionnes subtilement, seulement quand c'est pertinent pour l'utilisateur, sans en faire un sujet principal.

Profil de l'utilisateur :
- Nom: ${profil?.nom || 'Non renseigné'}
- Âge: ${profil?.age || 'Non renseigné'} ans
- Taille: ${profil?.taille || 'Non renseigné'} cm, Poids: ${profil?.poids || 'Non renseigné'} kg
- Objectifs: ${profil?.objectifs?.join(', ') || 'Non renseigné'}
- Alimentation: ${profil?.alimentaireDetails || profil?.regimes?.join(', ') || 'Non renseigné'}
- Style: ${profil?.styleDetails || profil?.styles?.join(', ') || 'Non renseigné'}
- Carences/Santé: ${profil?.santeDetails || profil?.carences?.join(', ') || 'Aucune'}
- Maladies: ${profil?.maladiesDetails || profil?.maladies?.join(', ') || 'Aucune'}

Règles importantes :
- Tu donnes des conseils personnalisés basés sur le profil
- Pour les plantes et remèdes naturels, tu précises toujours les contre-indications importantes
- Tu utilises des emojis pour rendre tes réponses visuelles et agréables
- Tu structures tes réponses avec des titres clairs
- Tu es chaleureux, motivant et précis
- Tu parles toujours en français
- Tu fais référence aux conversations précédentes`

  const messagesAPI = [
    { role: 'system', content: systemPrompt },
    ...historique.filter(m => m.role === 'user' || m.role === 'assistant').slice(-8),
    { role: 'user', content: message }
  ]

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: messagesAPI,
    temperature: 0.7,
    max_tokens: 1024
  })

  res.json({ reply: response.choices[0].message.content })
}
