import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { profil, ville, occasion } = req.body

  let meteo = 'météo inconnue'
  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${ville}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=fr`
    )
    const w = await weatherRes.json()
    meteo = `${Math.round(w.main.temp)}°C, ${w.weather[0].description}, humidité ${w.main.humidity}%`
  } catch {
    meteo = 'météo non disponible'
  }

  const prompt = `Tu es un styliste expert et personnel.
Profil de l'utilisateur :
- Style préféré: ${profil.styleDetails || profil.styles?.join(', ')}
- Mensurations: ${profil.mensurations || 'non renseigné'}

Météo aujourd'hui à ${ville}: ${meteo}
Occasion: ${occasion}

Propose 3 tenues. Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "tenues": [
    {
      "titre": "Nom de la tenue",
      "description": "Description complète : haut, bas, chaussures, accessoires",
      "pourquoi": "Pourquoi ce choix selon la météo et l'occasion",
      "imagePrompt": "fashion outfit photo, [describe the full outfit in English for image generation], professional photography, white background, full body shot"
    }
  ]
}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Tu es un styliste expert. Réponds toujours en JSON valide.' },
      { role: 'user', content: prompt }
    ]
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
