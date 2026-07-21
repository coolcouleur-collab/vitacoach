import Groq from 'groq-sdk'
import { requireOwner } from './_auth.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Requête Pexels avec fallback intelligent ──────────────────────────────────
async function pexelsSearch(query, perPage = 20) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query.slice(0, 100))}&per_page=${perPage}&orientation=portrait`,
    { headers: { Authorization: process.env.PEXELS_API_KEY } }
  )
  const d = await r.json()
  return d.photos || []
}

function bestPhoto(photos) {
  if (!photos.length) return null
  // Préfère vraiment portrait (hauteur > largeur × 1.35) parmi les 8 premiers
  const top = photos.slice(0, 8)
  const portraits = top.filter(p => p.height > p.width * 1.35)
  const pool = portraits.length >= 2 ? portraits : top
  const p = pool[Math.floor(Math.random() * pool.length)]
  return p?.src?.large2x || p?.src?.large || null
}

async function fetchImageUrl(query, alt) {
  try {
    // 1. Requête principale
    if (query) {
      const p1 = await pexelsSearch(query)
      if (p1.length >= 4) { const u = bestPhoto(p1); if (u) return u }
    }
    // 2. Requête alternative
    if (alt) {
      const p2 = await pexelsSearch(alt)
      if (p2.length >= 2) { const u = bestPhoto(p2); if (u) return u }
    }
    // 3. Fallbacks génériques variés (fashion Pexels)
    const fallbacks = [
      'summer fashion outfit editorial',
      'chic street style look',
      'elegant casual outfit fashion',
      'trendy summer look style',
    ]
    const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    const p3 = await pexelsSearch(fb)
    return bestPhoto(p3)
  } catch { return null }
}

// ── Tendances été 2026 ────────────────────────────────────────────────────────
const TRENDS = `
TENDANCES ÉTÉ 2026 :
• Matières : lin, coton brodé, crochet, organza, denim léger
• Coupes : pantalon barrel taille haute, mini jupe asymétrique, robe midi fluid, blazer cropped
• Chaussures : ballerines pointues, mules dorsay, sandales slide, espadrilles compensées
• Accessoires : micro sac baguette, sac raphia, lunettes ovales, ceinture dorée, chapeau bob
• Couleurs : blanc optique, crème, camel, terra cotta, vert sauge, cobalt, rose poudré, corail
• Looks : "quiet luxury" (monochrome crème/camel), "coastal chic" (lin blanc + accessoires tressés), "Parisian girl" (blazer + jupe courte + mocassins), "color pop" (pièce vive sur base neutre)
`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const authUser = await requireOwner(req, res, null)
  if (!authUser) return
  const { profil = {}, ville, occasion } = req.body || {}
  if (!ville || typeof ville !== 'string') return res.status(400).json({ erreur: 'ville manquante' })

  // ── Météo + LLaMA en parallèle ───────────────────────────────────────────
  const [meteoResult, llmResponse] = await Promise.allSettled([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ville)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=fr`
    ).then(r => r.json()).then(w => `${Math.round(w.main.temp)}°C, ${w.weather[0].description}`),

    groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Tu es un styliste mode expert 2025-2026. Réponds UNIQUEMENT en JSON valide, sans texte autour.',
        },
        {
          role: 'user',
          content: `${TRENDS}

Météo à ${ville} : à déterminer selon la saison
Occasion : ${occasion}
Profil : ${profil.activite || profil.rythme || 'actif'}

Propose 3 tenues tendance été 2026, chacune dans un style distinct.

RÈGLES CRITIQUES pour les champs image (Pexels API) :
- "searchQuery" : 3-4 mots SIMPLES en anglais, format "[couleur] [vêtement] [style]". Exemples corrects: "white linen dress", "camel blazer outfit", "summer casual style", "chic minimalist look". JAMAIS de noms de tendance obscurs, JAMAIS plus de 4 mots.
- "searchQueryAlt" : 2-3 mots TRÈS génériques. Exemples: "summer outfit", "chic fashion", "casual style", "elegant look".
- JAMAIS "woman", "girl", "face", "portrait", "person".

Réponds avec ce JSON :
{
  "tenues": [
    {
      "titre": "Nom court accrocheur",
      "description": "Pièces : haut, bas/robe, chaussures, accessoires. Couleurs et matières. 1 marque accessible.",
      "pourquoi": "Pourquoi tendance + adapté météo. Max 1 phrase.",
      "searchQuery": "3-4 mots simples anglais",
      "searchQueryAlt": "2-3 mots très génériques"
    }
  ]
}`,
        },
      ],
      temperature: 0.80,
      max_tokens: 900,
    }),
  ])

  const meteo = meteoResult.status === 'fulfilled' ? meteoResult.value : 'météo non disponible'

  try {
    if (llmResponse.status !== 'fulfilled') throw new Error('LLM failed')
    const text = llmResponse.value.choices[0].message.content
    const data = JSON.parse(text)
    const tenues = data.tenues || []

    // Fetch images en parallèle
    const tenus = await Promise.all(
      tenues.map(async t => ({
        ...t,
        imageUrl: await fetchImageUrl(t.searchQuery, t.searchQueryAlt),
      }))
    )
    res.json({ tenues: tenus, meteo })
  } catch {
    res.json({ tenues: [], meteo, erreur: 'Erreur de génération' })
  }
}
