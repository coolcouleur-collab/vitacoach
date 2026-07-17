import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TRENDS_ETE_2026 = `
TENDANCES ÉTÉ 2026 (à intégrer dans les suggestions) :
• Matières : lin naturel, coton brodé, maille crochet ouverte, organza léger, denim léger
• Coupes : pantalon barrel/tonneau taille haute, mini jupe asymétrique, robe midi fluid, blazer cropped oversize
• Chaussures : ballerines pointues (couleurs vives ou nude), mules dorsay matelassées, sandales slide cuir fin, espadrilles compensées
• Accessoires : micro sac baguette structuré, sac de plage raphia, lunettes ovales oversize, ceinture fine dorée, chapeau bob
• Palette couleurs : blanc optique, crème, camel chaud, terra cotta, vert sauge, bleu cobalt, rose poudré, corail abricot
• Looks en vogue : "quiet luxury" épuré (monochrome crème/camel), "coastal chic" (lin blanc + accessoires tressés), "Parisian girl" (mix blazer + jupe courte + mocassins), "bold & color" (pièce statement couleur vive sur base neutre)
• Marques accessibles de référence : Zara, Mango, COS, & Other Stories, Arket, Sandro diffusion, H&M Divided, Pull&Bear, Stradivarius
`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { profil, ville, occasion } = req.body

  let meteo = 'météo inconnue'
  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ville)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=fr`
    )
    const w = await weatherRes.json()
    meteo = `${Math.round(w.main.temp)}°C, ${w.weather[0].description}, humidité ${w.main.humidity}%`
  } catch {
    meteo = 'météo non disponible'
  }

  const prompt = `Tu es un styliste personnel de haut niveau, expert des tendances mode été 2026.
Tu t'inspires des défilés, d'Instagram, de Vogue et des streetstyle des grandes villes.
Tes suggestions sont TOUJOURS actuelles, portables et trouvables dans les boutiques accessibles.

${TRENDS_ETE_2026}

CONTEXTE :
• Météo à ${ville} : ${meteo}
• Occasion : ${occasion}
• Profil utilisateur : ${profil.activite || profil.rythme || 'actif'}, objectif ${profil.objectif || 'bien-être'}

MISSION : Propose 3 tenues différentes, chacune dans un style distinct (ex: une "quiet luxury", une "color pop", une "casual chic"), toutes tendance été 2026 et parfaitement adaptées à la météo.

Pour le champ "searchQuery" : écris une requête Pexels EN ANGLAIS qui décrit précisément les VÊTEMENTS portés, sans mot lié au visage ou portrait.
La photo doit montrer la tenue complète de la tête aux pieds (street style, lookbook).
Exemples de BONNES searchQuery (centrées sur les vêtements, pas sur le modèle) :
- "cream linen wide leg trousers white linen shirt summer street style lookbook"
- "cobalt blue mini skirt crop top gold sandals summer lookbook full body"
- "barrel jeans beige cropped blazer loafers chic street style full body outfit"
Évite : "woman", "girl", "portrait", "face", "beauty". Préfère : "outfit", "lookbook", "street style", "full body".

Réponds UNIQUEMENT avec ce JSON valide, sans texte avant ni après :
{
  "tenues": [
    {
      "titre": "Nom accrocheur qui donne envie (ex: Le Lin de Rêve, Power Cobalt, Beach Parisienne)",
      "description": "Pièces concrètes : haut, bas (ou robe), chaussures, accessoires. Couleurs, matières, silhouette. 1-2 marques accessibles suggérées.",
      "pourquoi": "Pourquoi c'est tendance et parfait pour cette météo — 1-2 phrases max.",
      "searchQuery": "requête Pexels en anglais, précise et éditoriale, pour une photo qui ressemble à ce look"
    }
  ]
}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Tu es un styliste expert mode 2025-2026 au courant des dernières tendances. Tes suggestions sont toujours actuelles, tendance et achetables. Réponds uniquement en JSON valide.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.85,
    max_tokens: 1200,
  })

  try {
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json({ tenues: data.tenues, meteo })
  } catch {
    res.json({ tenues: [], meteo, erreur: 'Erreur de parsing' })
  }
}
