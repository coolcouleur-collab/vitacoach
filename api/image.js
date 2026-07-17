export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const raw = req.query.prompt || ''

    // Requête Pexels : suffixe orienté look complet, pas portrait visage
    const query = encodeURIComponent(raw.slice(0, 130) + ' street style full outfit lookbook')

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=20&orientation=portrait`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const data = await response.json()

    if (data.photos && data.photos.length > 0) {
      // Favorise les photos portrait (plus grande hauteur que largeur) pour voir la tenue
      const portraits = data.photos.filter(p => p.height > p.width * 1.1)
      const pool = portraits.length >= 3 ? portraits : data.photos
      const photo = pool[Math.floor(Math.random() * Math.min(10, pool.length))]
      return res.json({ url: photo.src.large2x || photo.src.large })
    }

    // Fallback : street style lookbook générique
    const fallback = await fetch(
      `https://api.pexels.com/v1/search?query=street+style+fashion+lookbook+outfit+summer&per_page=15&orientation=portrait`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const data2 = await fallback.json()
    if (data2.photos?.length > 0) {
      return res.json({ url: data2.photos[Math.floor(Math.random() * data2.photos.length)].src.large2x || data2.photos[0].src.large })
    }

    res.json({ url: null })
  } catch {
    res.json({ url: null })
  }
}
