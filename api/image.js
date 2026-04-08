export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const prompt = req.query.prompt
    const keywords = prompt
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 4)
      .join(' ') + ' fashion outfit'

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=15&orientation=portrait`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const data = await response.json()
    const photos = data.photos
    if (photos && photos.length > 0) {
      const photo = photos[Math.floor(Math.random() * Math.min(8, photos.length))]
      res.json({ url: photo.src.large })
    } else {
      const fallback = await fetch(
        `https://api.pexels.com/v1/search?query=fashion+outfit+style&per_page=15&orientation=portrait`,
        { headers: { Authorization: process.env.PEXELS_API_KEY } }
      )
      const data2 = await fallback.json()
      if (data2.photos?.length > 0) {
        res.json({ url: data2.photos[Math.floor(Math.random() * data2.photos.length)].src.large })
      } else {
        res.json({ url: null })
      }
    }
  } catch (e) {
    res.json({ url: null })
  }
}
