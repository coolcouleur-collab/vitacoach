const PEXELS = 'https://api.pexels.com/v1/search'
const HEADERS = () => ({ Authorization: process.env.PEXELS_API_KEY })

// Photos manifestement hors sujet pour une app bien-être : chambre, lingerie,
// plage, poses suggestives. C'est ce qui produisait les images « random » de la
// page Style (retour Jean 2026-08-08 : une tenue en lin illustrée par une photo
// de chambre à coucher).
const INTERDITS = [
  'bed', 'bedroom', 'sleep', 'pillow', 'blanket', 'sheet',
  'lingerie', 'underwear', 'bra', 'nude', 'naked', 'topless',
  'bikini', 'swimsuit', 'swimwear', 'pool', 'beach', 'sand',
  'sensual', 'erotic', 'boudoir', 'seductive', 'sexy',
]

const motsUtiles = q => q.toLowerCase()
  .split(/[^a-z]+/)
  .filter(m => m.length > 3 && !['with', 'that', 'this', 'from', 'photo', 'image', 'style'].includes(m))

async function pexelsSearch(query, perPage = 20) {
  const q = encodeURIComponent(query.slice(0, 100))
  const r = await fetch(`${PEXELS}?query=${q}&per_page=${perPage}&orientation=portrait`, { headers: HEADERS() })
  const d = await r.json()
  return d.photos || []
}

// Choisit la photo la PLUS PERTINENTE, pas une au hasard. L'ancienne version
// tirait au sort parmi les 5 premiers résultats : Pexels classant déjà par
// pertinence, ça revenait à préférer volontairement une moins bonne photo, et
// l'image changeait à chaque rechargement.
function meilleurePhoto(photos, query) {
  const mots = motsUtiles(query)

  const notees = photos.map((p, rang) => {
    const alt = (p.alt || '').toLowerCase()

    // Rédhibitoire : sujet hors contexte
    if (INTERDITS.some(mot => alt.includes(mot))) return { p, score: -1 }

    let score = 0
    // Pertinence sémantique : recoupement entre l'alt de la photo et la requête
    score += mots.filter(m => alt.includes(m)).length * 10
    // Vrai format portrait (les cartes sont verticales)
    if (p.height > p.width * 1.2) score += 4
    // À pertinence égale, on respecte le classement de Pexels
    score += Math.max(0, 10 - rang)

    return { p, score }
  }).filter(x => x.score >= 0)

  if (!notees.length) return null
  notees.sort((a, b) => b.score - a.score)
  const gagnante = notees[0]

  // Aucun mot de la requête retrouvé nulle part : la recherche n'a rien donné
  // de pertinent. On préfère ne rien afficher plutôt qu'une image au hasard —
  // les cartes ont déjà un visuel de repli propre.
  if (mots.length && gagnante.score < 10) return null

  return gagnante.p.src?.large2x || gagnante.p.src?.large || null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const primary = (req.query.prompt || '').trim()
    const alt     = (req.query.alt || '').trim()

    // 1. Requête principale (courte et précise, produite par le LLM)
    if (primary) {
      const url = meilleurePhoto(await pexelsSearch(primary), primary)
      if (url) return res.json({ url })
    }

    // 2. Requête alternative (catégorie plus large)
    if (alt) {
      const url = meilleurePhoto(await pexelsSearch(alt), alt)
      if (url) return res.json({ url })
    }

    // Plus de repli « street style » générique : il renvoyait des photos sans
    // aucun rapport avec la tenue décrite. Pas d'image vaut mieux qu'une image
    // qui ment sur le contenu de la carte.
    res.json({ url: null })
  } catch {
    res.json({ url: null })
  }
}
