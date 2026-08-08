// ─── Recherche d'illustration : Unsplash d'abord, Pexels en renfort ──────────
// Pexels est une banque généraliste : pour la page Style, il n'a tout
// simplement pas assez de vraies photos de tenues (retour Jean 2026-08-08 —
// « trop d'images random »). Unsplash a un fonds mode/lookbook bien plus riche.
// On interroge les deux quand c'est possible et on garde la photo la mieux
// notée, toutes sources confondues. Sans UNSPLASH_ACCESS_KEY, tout continue de
// fonctionner avec Pexels seul.

const PEXELS   = 'https://api.pexels.com/v1/search'
const UNSPLASH = 'https://api.unsplash.com/search/photos'

// Sujets manifestement hors contexte pour une app bien-être : chambre,
// lingerie, plage, poses suggestives. C'est ce qui produisait une photo de lit
// en illustration d'une robe en lin.
const INTERDITS = [
  'bed', 'bedroom', 'sleep', 'pillow', 'blanket', 'sheet',
  'lingerie', 'underwear', 'bra', 'nude', 'naked', 'topless',
  'bikini', 'swimsuit', 'swimwear', 'pool', 'beach', 'sand',
  'sensual', 'erotic', 'boudoir', 'seductive', 'sexy',
]

const VIDES = ['with', 'that', 'this', 'from', 'photo', 'image', 'style', 'wearing']

const motsUtiles = q => q.toLowerCase()
  .split(/[^a-z]+/)
  .filter(m => m.length > 3 && !VIDES.includes(m))

async function chercherPexels(query) {
  if (!process.env.PEXELS_API_KEY) return []
  const url = `${PEXELS}?query=${encodeURIComponent(query.slice(0, 100))}&per_page=20&orientation=portrait`
  const r = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY } })
  if (!r.ok) return []
  const d = await r.json()
  return (d.photos || []).map((p, rang) => ({
    rang,
    source: 'pexels',
    texte: (p.alt || '').toLowerCase(),
    portrait: p.height > p.width * 1.2,
    url: p.src?.large2x || p.src?.large || null,
    credit: p.photographer ? { nom: p.photographer, lien: p.url } : null,
  }))
}

async function chercherUnsplash(query) {
  if (!process.env.UNSPLASH_ACCESS_KEY) return []
  const url = `${UNSPLASH}?query=${encodeURIComponent(query.slice(0, 100))}&per_page=20&orientation=portrait&content_filter=high`
  const r = await fetch(url, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } })
  if (!r.ok) return []
  const d = await r.json()
  return (d.results || []).map((p, rang) => ({
    rang,
    source: 'unsplash',
    // Unsplash décrit ses photos bien plus finement que Pexels : description,
    // alt et tags. D'où un scoring nettement plus fiable.
    texte: [p.alt_description, p.description, ...(p.tags || []).map(t => t.title)]
      .filter(Boolean).join(' ').toLowerCase(),
    portrait: p.height > p.width * 1.2,
    url: p.urls?.regular || p.urls?.small || null,
    credit: p.user ? { nom: p.user.name, lien: p.links?.html } : null,
    telechargement: p.links?.download_location || null,
  }))
}

// Choisit la photo la PLUS PERTINENTE, jamais au hasard. L'ancienne version
// tirait au sort parmi les 5 premiers résultats alors que les deux API classent
// déjà par pertinence : on préférait donc volontairement une moins bonne photo,
// et l'image changeait à chaque rechargement.
function meilleure(candidats, query) {
  const mots = motsUtiles(query)

  const notes = candidats
    .filter(c => c.url)
    .map(c => {
      if (INTERDITS.some(mot => c.texte.includes(mot))) return { c, score: -1 }
      let score = 0
      score += mots.filter(m => c.texte.includes(m)).length * 10   // pertinence sémantique
      if (c.portrait) score += 4                                    // les cartes sont verticales
      score += Math.max(0, 10 - c.rang)                             // classement de la source
      if (c.source === 'unsplash') score += 3                       // fonds mode plus riche
      return { c, score }
    })
    .filter(x => x.score >= 0)

  if (!notes.length) return null
  notes.sort((a, b) => b.score - a.score)
  const gagnante = notes[0]

  // Aucun mot de la requête retrouvé : la recherche n'a rien donné de
  // pertinent. Mieux vaut aucune image qu'une image qui ment sur le contenu de
  // la carte — les cartes ont déjà un visuel de repli propre.
  if (mots.length && gagnante.score < 10) return null
  return gagnante.c
}

async function pour(query) {
  const [u, p] = await Promise.allSettled([chercherUnsplash(query), chercherPexels(query)])
  return meilleure([
    ...(u.status === 'fulfilled' ? u.value : []),
    ...(p.status === 'fulfilled' ? p.value : []),
  ], query)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const primary = (req.query.prompt || '').trim()
    const alt     = (req.query.alt || '').trim()

    const choix = (primary && await pour(primary)) || (alt && await pour(alt)) || null
    if (!choix) return res.json({ url: null })

    // Conditions d'utilisation d'Unsplash : signaler l'usage d'une photo.
    // Fire & forget, ne doit jamais retarder la réponse.
    if (choix.telechargement && process.env.UNSPLASH_ACCESS_KEY) {
      fetch(choix.telechargement, {
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      }).catch(() => {})
    }

    res.json({ url: choix.url, credit: choix.credit, source: choix.source })
  } catch {
    res.json({ url: null })
  }
}
