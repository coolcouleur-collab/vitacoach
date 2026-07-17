const PEXELS = 'https://api.pexels.com/v1/search'
const HEADERS = () => ({ Authorization: process.env.PEXELS_API_KEY })

async function pexelsSearch(query, perPage = 15) {
  const q = encodeURIComponent(query.slice(0, 100))
  const r = await fetch(`${PEXELS}?query=${q}&per_page=${perPage}&orientation=portrait`, { headers: HEADERS() })
  const d = await r.json()
  return d.photos || []
}

function bestPhoto(photos) {
  // Préfère les photos vraiment portrait (hauteur > 1.2 × largeur) parmi les 5 premiers
  const top = photos.slice(0, 5)
  const portraits = top.filter(p => p.height > p.width * 1.2)
  const pool = portraits.length >= 2 ? portraits : top
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return pick?.src?.large2x || pick?.src?.large || null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const primary = (req.query.prompt || '').trim()
    const alt     = (req.query.alt || '').trim()

    // 1. Requête principale (courte, précise — 5-7 mots de LLaMA)
    if (primary) {
      const photos = await pexelsSearch(primary)
      if (photos.length >= 3) {
        const url = bestPhoto(photos)
        if (url) return res.json({ url })
      }
    }

    // 2. Requête alternative (catégorie plus large)
    if (alt) {
      const photos2 = await pexelsSearch(alt)
      if (photos2.length >= 2) {
        const url = bestPhoto(photos2)
        if (url) return res.json({ url })
      }
    }

    // 3. Fallback générique tendance
    const photos3 = await pexelsSearch('trendy street style fashion outfit lookbook 2024')
    if (photos3.length > 0) {
      return res.json({ url: bestPhoto(photos3) })
    }

    res.json({ url: null })
  } catch {
    res.json({ url: null })
  }
}
