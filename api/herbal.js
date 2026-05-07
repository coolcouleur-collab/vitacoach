import Groq from 'groq-sdk'
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { profil } = req.body

  const profilResume = profil
    ? `Utilisateur : ${profil.nom || 'anonyme'}, ${profil.age || '?'} ans.
Objectifs : ${(profil.objectifs || []).join(', ') || 'non définis'}.
Maladies/conditions : ${(profil.maladies || []).join(', ') || 'aucune connue'}.
Carences : ${(profil.carences || []).join(', ') || 'aucune connue'}.
Régimes : ${(profil.regimes || []).join(', ') || 'omnivore'}.
Niveau d'activité : ${profil.activite || 'non défini'}.`
    : 'Profil non défini — donne des recommandations générales équilibrées.'

  const systemPrompt = `Tu es un expert en médecine naturelle, phytothérapie, médecine chinoise et techniques holistiques.
Tu donnes des recommandations de santé naturelle PERSONNALISÉES basées sur le profil de l'utilisateur.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.`

  const userPrompt = `${profilResume}

Donne exactement 4 recommandations de santé naturelle personnalisées pour cet utilisateur.
Varie les types : plantes médicinales, tisanes, médecine chinoise, techniques holistiques.

Retourne ce JSON exactement :
{
  "recommendations": [
    {
      "emoji": "🌿",
      "nom": "Nom de la plante/technique",
      "raison": "Pourquoi c'est parfait pour cet utilisateur (2 phrases max, précis et personnalisé)",
      "usage": "Comment et quand l'utiliser concrètement"
    }
  ]
}`

  try {
    const chat = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const raw = chat.choices[0].message.content.trim()
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(jsonStr)

    return res.status(200).json(data)
  } catch (e) {
    console.error('Herbal API error:', e)
    return res.status(500).json({
      recommendations: [
        { emoji:'🌿', nom:'Ashwagandha', raison:'Excellent adaptogène pour réduire le stress et améliorer l\'énergie générale.', usage:'250–500 mg le matin avec un verre d\'eau' },
        { emoji:'☕', nom:'Tisane de camomille', raison:'Apaisante naturelle pour mieux dormir et réduire l\'anxiété du quotidien.', usage:'1 tasse 30 min avant le coucher' },
        { emoji:'🐉', nom:'Ginseng Panax', raison:'Tonique général qui améliore les performances physiques et mentales.', usage:'200–400 mg/jour le matin, cure de 8 semaines' },
        { emoji:'🧘', nom:'Cohérence cardiaque', raison:'Technique gratuite et immédiatement efficace pour réguler le système nerveux.', usage:'5 min matin, midi et soir — app RespiRelax' },
      ]
    })
  }
}
