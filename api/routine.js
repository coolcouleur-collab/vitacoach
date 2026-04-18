import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { profil } = req.body

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const prompt = `Tu es Oravi, coach de vie expert en bien-être holistique, herbalisme et médecines traditionnelles.

Génère une routine quotidienne complète et personnalisée pour aujourd'hui (${today}) pour cet utilisateur :
- Nom: ${profil?.nom}
- Âge: ${profil?.age} ans
- Objectifs: ${profil?.objectifs?.join(', ') || 'bien-être général'}
- Alimentation: ${profil?.alimentaireDetails || profil?.regimes?.join(', ') || 'standard'}
- Carences: ${profil?.carences?.join(', ') || 'aucune connue'}
- Maladies: ${profil?.maladiesDetails || profil?.maladies?.join(', ') || 'aucune'}
- Style: ${profil?.styleDetails || profil?.styles?.join(', ') || 'casual'}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "matin": {
    "heure": "6h30 - 8h00",
    "titre": "Réveil & Énergie",
    "etapes": [
      {"emoji": "💧", "action": "Boire un grand verre d'eau tiède avec du citron", "detail": "Active le métabolisme et alcalinise le corps"},
      {"emoji": "🌿", "action": "Tisane de gingembre et curcuma", "detail": "Anti-inflammatoire naturel, boost d'énergie"},
      {"emoji": "🧘", "action": "10 minutes de méditation ou respiration 4-7-8", "detail": "Réduit le cortisol matinal"},
      {"emoji": "🍳", "action": "Petit déjeuner protéiné adapté à ton profil", "detail": "Description courte"}
    ]
  },
  "nutrition": {
    "titre": "Plan Nutrition du Jour",
    "plantes": [
      {"emoji": "🌿", "nom": "Nom de la plante", "usage": "Comment la prendre", "benefice": "Bénéfice principal"}
    ],
    "repas": [
      {"moment": "Déjeuner", "suggestion": "Description courte adaptée au profil", "emoji": "🥗"},
      {"moment": "Dîner", "suggestion": "Description courte adaptée au profil", "emoji": "🍲"}
    ],
    "supplements": ["Supplément 1 si carence", "Supplément 2"]
  },
  "apresmidi": {
    "heure": "14h00 - 18h00",
    "titre": "Énergie & Productivité",
    "etapes": [
      {"emoji": "🍵", "action": "Action de l'après-midi", "detail": "Explication"},
      {"emoji": "🚶", "action": "Marche de 20 minutes", "detail": "Régule la glycémie post-déjeuner"}
    ]
  },
  "soir": {
    "heure": "19h00 - 22h00",
    "titre": "Récupération & Sommeil",
    "etapes": [
      {"emoji": "🌙", "action": "Tisane calmante personnalisée", "detail": "Recommandation selon le profil"},
      {"emoji": "📵", "action": "No screen 1h avant le coucher", "detail": "Favorise la mélatonine naturelle"},
      {"emoji": "🛁", "action": "Bain ou douche tiède", "detail": "Baisse la température corporelle pour le sommeil"}
    ]
  },
  "astuce": {
    "emoji": "💡",
    "titre": "Astuce bien-être du jour",
    "conseil": "Un conseil bien-être simple et naturel personnalisé"
  },
  "motivation": "Message de motivation personnalisé et inspirant pour ${profil?.nom} aujourd'hui"
}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Tu es un expert en bien-être holistique. Réponds toujours en JSON valide et complet.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 2000
  })

  try {
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch {
    res.status(500).json({ erreur: 'Erreur de génération' })
  }
}
