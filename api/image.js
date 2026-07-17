export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const raw = req.query.prompt || ''

    // Use the query as-is (already optimized upstream) + full body fashion suffix
    const query = encodeURIComponent(raw.slice(0, 150) + ' full body outfit fashion editorial')

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=15&orientation=portrait`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const data = await response.json()

    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[Math.floor(Math.random() * Math.min(8, data.photos.length))]
      return res.json({ url: photo.src.large })
    }

    // Fallback: try a simpler fashion editorial search
    const fallback = await fetch(
      `https://api.pexels.com/v1/search?query=fashion+editorial+lookbook+outfit+2024&per_page=15&orientation=portrait`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const data2 = await fallback.json()
    if (data2.photos?.length > 0) {
      return res.json({ url: data2.photos[Math.floor(Math.random() * data2.photos.length)].src.large })
    }

    res.json({ url: null })
  } catch {
    res.json({ url: null })
  }
}
