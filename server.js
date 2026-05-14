import express from 'express'
import Groq from 'groq-sdk'
import Stripe from 'stripe'
import webpush from 'web-push'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Web Push VAPID (optional — skip if keys not configured)
try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:contact@meet-solenn.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    console.log('Web Push VAPID: ✅ configuré')
  } else {
    console.log('Web Push VAPID: ⚠️ clés manquantes, notifications désactivées')
  }
} catch (e) {
  console.warn('Web Push VAPID: ⚠️ erreur init —', e.message)
}

// Stockage en mémoire des subscriptions (remplacer par DB en prod)
const pushSubscriptions = new Map()
const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
console.log('SUPABASE_URL:', supabaseUrl ? '✅ défini' : '❌ manquant')
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ défini' : '❌ manquant')

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.get('/', (req, res) => res.json({ status: 'Solenn OK' }))

// Inscription
app.post('/api/inscription', async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return res.json({ erreur: error.message })
  res.json({ user: data.user })
})

// Connexion
app.post('/api/connexion', async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return res.json({ erreur: error.message })
  res.json({ user: data.user, session: data.session })
})

// Sauvegarder profil en base
app.post('/api/sauvegarder-profil', async (req, res) => {
  const { user_id, profil } = req.body
  const { error } = await supabase.from('profils').upsert({ user_id, profil }, { onConflict: 'user_id' })
  if (error) return res.json({ erreur: error.message })
  res.json({ succes: true })
})

// Charger profil depuis la base
app.get('/api/charger-profil', async (req, res) => {
  const { user_id } = req.query
  const { data, error } = await supabase.from('profils').select('profil').eq('user_id', user_id).single()
  if (error) return res.json({ profil: null })
  res.json({ profil: data.profil })
})

// Chat principal
app.post('/api/chat', async (req, res) => {
  const { message, profil, historique = [] } = req.body

  const systemPrompt = `Tu es Solenn, coach de vie IA — bienveillante, perspicace, directe.
Tu connais vraiment ${profil.nom} : ${profil.age} ans${profil.taille ? `, ${profil.taille}cm` : ''}${profil.poids ? ` ${profil.poids}kg` : ''} · Objectifs: ${profil.objectifs?.join(', ') || '?'} · Alimentation: ${profil.alimentaireDetails || profil.regimes?.join(', ') || '?'} · Santé: ${profil.santeDetails || profil.carences?.join(', ') || '?'}${profil.maladiesDetails || profil.maladies?.length ? ` · ${profil.maladiesDetails || profil.maladies?.join(', ')}` : ''}

PERSONNALITÉ :
- Tu perçois ce qui se cache derrière les mots — si quelqu'un dit "je suis fatigué", tu creuses
- Tu fais des connexions intelligentes entre le profil, les habitudes et la question posée
- Tu anticipes le vrai besoin, pas juste la question de surface
- Tu as de l'empathie sans être condescendant — tu comprends, tu ne juges pas
- Ton ton : chaleureux mais sans fioriture, comme un ami proche très bien informé

RÈGLES DE RÉPONSE :
- Max 3-4 phrases pour le texte pur — chaque phrase doit apporter quelque chose
- Pas d'intro creuse ("Bien sûr !", "Absolument !", "Bonne question !")
- 1 conseil concret et actionnable, ancré dans le profil de l'utilisateur
- Si quelqu'un est dans le doute ou stressé, commence par valider avant de conseiller
- Tu parles en français, tu tutoies

FORMAT 1 — RÉSERVATION : quand l'utilisateur veut sortir/réserver/aller quelque part
|||JSON|||
{"type":"booking","emoji":"🍽️","service":"Nom","lieu":"Ville","date":"Ce soir / Demain","heure":"20h00","note":"1 phrase utile max","links":[{"icon":"🗺️","label":"Google Maps","url":"https://www.google.com/maps/search/MOTS+CLES"},{"icon":"🔍","label":"Google","url":"https://www.google.com/search?q=MOTS+CLES"}]}
|||END|||
Liens valides : maps.google.com/search/... · google.com/search?q=... · doctolib.fr/SPECIALITE/VILLE

FORMAT 2 — LISTES : uniquement si demande explicite ("idées", "exercices", "programme"...)
|||JSON|||
{"type":"TYPE","intro":"1 phrase max","items":[{"icon":"emoji","title":"Nom court","desc":"1-2 phrases utiles et spécifiques au profil","badge":"Tag","color":"#hex","sub":"Info clé"}],"outro":"1 phrase"}
|||END|||
4-5 items max · Types: meals=#FF6B35 · exercises=#a78bfa · tips=#FF9A3C · plants=#34c759 · routine=#38bdf8

FORMAT 3 — TOUT LE RESTE : texte pur, 3 phrases max, empathique si besoin, toujours concret et ancré dans le profil.`

  const messagesAPI = [
    { role: 'system', content: systemPrompt },
    ...historique.filter(m => m.role === 'user' || m.role === 'assistant').slice(-8),
    { role: 'user', content: message }
  ]

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: messagesAPI
  })

  res.json({ reply: response.choices[0].message.content })
})

// IA qui analyse et enrichit le profil
app.post('/api/analyser-profil', async (req, res) => {
  const { section, selections, texteLibre } = req.body

  const prompts = {
    alimentation: `Tu es un nutritionniste expert. L'utilisateur a sélectionné ces habitudes alimentaires : ${selections.join(', ')}.
Il décrit ses habitudes ainsi : "${texteLibre}"
Extrait et résume en 3-5 phrases clés les informations importantes : fréquence de consommation, depuis combien de temps, restrictions, préférences.
Réponds en JSON avec ce format exact :
{"resume": "résumé court", "details": "détails complets à intégrer dans son profil nutritionnel"}`,

    style: `Tu es un expert en mode et stylisme. L'utilisateur a sélectionné ces styles : ${selections.join(', ')}.
Il décrit ses préférences vestimentaires ainsi : "${texteLibre}"
Extrait les infos importantes : styles préférés, occasions, couleurs, marques, contraintes.
Réponds en JSON avec ce format exact :
{"resume": "résumé court", "details": "détails complets pour personnaliser ses conseils vestimentaires"}`,

    sante: `Tu es un professionnel de santé. L'utilisateur a sélectionné ces carences/conditions : ${selections.join(', ')}.
Il décrit sa situation de santé ainsi : "${texteLibre}"
Extrait les infos importantes : carences confirmées, maladies, traitements, depuis combien de temps, impact sur la vie quotidienne.
IMPORTANT: Ne donne pas de conseils médicaux, juste extrais et organise les informations.
Réponds en JSON avec ce format exact :
{"resume": "résumé court", "details": "détails complets pour personnaliser ses conseils bien-être"}`
  }

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'Tu es un assistant qui extrait et structure des informations de profil. Réponds toujours en JSON valide.' },
      { role: 'user', content: prompts[section] }
    ]
  })

  try {
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(jsonMatch[0])
    res.json(result)
  } catch {
    res.json({ resume: 'Profil analysé', details: texteLibre })
  }
})

// Module tenues avec météo
app.post('/api/tenues', async (req, res) => {
  const { profil, ville, occasion } = req.body

  let meteo = 'météo inconnue'
  let meteoDisplay = ''
  try {
    const [currentRes, forecastRes] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${ville}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=fr`, { timeout: 6000 }),
      axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${ville}&cnt=8&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=fr`, { timeout: 6000 })
    ])
    const w = currentRes.data
    const list = forecastRes.data.list

    const getMorning = list.find(f => { const h = new Date(f.dt * 1000).getHours(); return h >= 6 && h <= 9 })
    const getMidday  = list.find(f => { const h = new Date(f.dt * 1000).getHours(); return h >= 11 && h <= 14 })
    const getEvening = list.find(f => { const h = new Date(f.dt * 1000).getHours(); return h >= 17 && h <= 20 })

    const tempMin = Math.round(Math.min(...list.map(f => f.main.temp_min)))
    const tempMax = Math.round(Math.max(...list.map(f => f.main.temp_max)))
    const rainProb = Math.round(Math.max(...list.slice(0, 5).map(f => (f.pop || 0) * 100)))
    const wind = Math.round(w.wind.speed * 3.6)

    const tMorning = getMorning ? Math.round(getMorning.main.temp) : Math.round(w.main.temp) - 2
    const tMidday  = getMidday  ? Math.round(getMidday.main.temp)  : Math.round(w.main.temp) + 3
    const tEvening = getEvening ? Math.round(getEvening.main.temp) : Math.round(w.main.temp)

    meteo = `Ville: ${ville}
- Actuellement: ${Math.round(w.main.temp)}°C, ${w.weather[0].description}
- Matin (7h): ~${tMorning}°C  |  Midi: ~${tMidday}°C  |  Soir (18h): ~${tEvening}°C
- Amplitude journée: ${tempMin}°C → ${tempMax}°C (ΔT = ${tempMax - tempMin}°C)
- Pluie: ${rainProb}%  |  Vent: ${wind} km/h  |  Humidité: ${w.main.humidity}%`

    meteoDisplay = `${Math.round(w.main.temp)}°C, ${w.weather[0].description} · ${tMorning}→${tMidday}°C · pluie ${rainProb}%`
  } catch {
    meteo = 'météo non disponible'
    meteoDisplay = 'météo non disponible'
  }

  const prompt = `Tu es un styliste expert, tendance et personnel.
Profil :
- Style: ${profil.styleDetails || profil.styles?.join(', ') || 'polyvalent'}
- Mensurations: ${profil.mensurations || 'non renseigné'}

${meteo}
Occasion: ${occasion}

⚠️ PENSE LAYERING : si l'amplitude journée dépasse 5°C, propose des tenues en couches (manteau léger à enlever, veste sur pull, etc.) pour s'adapter au fil de la journée.
⚠️ Si pluie > 40%, intègre imperméable ou semelles imperméables.
⚠️ Les styles doivent être VARIÉS ET TENDANCE 2024-2025 : quiet luxury, streetwear parisien, casual chic, Y2K revisité, office slay, athleisure premium.

Propose 6 tenues. Réponds UNIQUEMENT en JSON valide :
{
  "tenues": [
    {
      "titre": "Nom tendance de la tenue",
      "description": "3 pièces max séparées par ' · ' : ex: Manteau crème · Jean slim · Sneakers blanches",
      "pourquoi": "1 phrase courte sur l'adaptation météo/occasion",
      "imagePrompt": "[style_keyword] [outfit_keyword1] [outfit_keyword2] street fashion editorial photography"
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
    res.json({ tenues: data.tenues, meteo: meteoDisplay || meteo })
  } catch {
    res.json({ tenues: [], meteo: meteoDisplay || meteo, erreur: 'Erreur de parsing' })
  }
})

// Recherche images mode
app.get('/api/image', async (req, res) => {
  const lock = req.query.lock != null ? Number(req.query.lock) : 0
  const rawPrompt = req.query.prompt || 'fashion outfit'
  const rawTitre = req.query.titre || ''

  // ── Construire la requête à partir des pièces réelles de la tenue ────────────
  // Priorité : imagePrompt (contient les vêtements concrets) > titre (style)
  function styleToQuery(titre, imagePrompt) {
    // 1. Extraire les mots-clés vêtements/couleurs du imagePrompt
    const stopWords = new Set([
      'street','fashion','editorial','photography','outfit','style','photo',
      'woman','man','wearing','with','and','the','for','full','body','shot',
      'professional','white','background','look','chic','elegant'
    ])
    const colors = new Set(['black','white','beige','grey','gray','brown','navy','cream',
      'camel','olive','khaki','burgundy','red','blue','green','yellow','pink','orange'])

    const words = (imagePrompt || '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))

    // Garder couleurs + items de vêtements (mots substantiels hors style générique)
    const clothingItems = words.slice(0, 6)

    if (clothingItems.length >= 2) {
      // "ootd" (outfit of the day) force Unsplash à retourner des photos
      // de personnes en pied — évite les close-ups de sacs/accessoires
      return `woman ${clothingItems.slice(0,4).join(' ')} ootd full body street style`
    }

    // 2. Fallback sur le titre si imagePrompt trop vague
    const t = (titre || '').toLowerCase()
    if (t.match(/quiet.?luxury|luxe/))       return 'woman luxury minimal coat ootd full body street style'
    if (t.match(/streetwear|street/))         return 'woman streetwear urban ootd full body street photography'
    if (t.match(/y2k/))                       return 'woman Y2K fashion ootd full body trendy aesthetic'
    if (t.match(/office|bureau|slay/))        return 'woman blazer power dressing ootd full body street style'
    if (t.match(/athleisure|sport/))          return 'woman athleisure sporty ootd full body street style'
    if (t.match(/boho|boheme/))               return 'woman bohemian boho ootd full body street style'
    if (t.match(/minimal/))                   return 'woman minimalist clean ootd full body street style'
    if (t.match(/casual/))                    return 'woman casual chic ootd full body effortless street style'
    if (t.match(/vintage|retro/))             return 'woman vintage retro ootd full body fashion'
    if (t.match(/trench|imperméable/))        return 'woman trench coat ootd full body rainy street style'
    return 'woman fashion ootd full body street style trendy outfit'
  }

  // ── Source 1 : Unsplash (qualité éditoriale, pas de clé requise) ───────────
  async function unsplashUrl(prompt, lock, titre) {
    const query = styleToQuery(titre, prompt)
    // sig unique par carte → image différente garantie
    const seed = (lock * 137 + 42) % 9999
    const url = `https://source.unsplash.com/400x560/?${encodeURIComponent(query)}&sig=${seed}`
    const resp = await axios.get(url, { timeout: 6000, maxRedirects: 5 })
    return resp.request?.res?.responseUrl || resp.config?.url || url
  }

  // ── Fallback keywords basiques ─────────────────────────────────────────────
  function fashionKeywords(prompt) {
    const words = (prompt || '').toLowerCase().split(/\s+/)
    const styleWords = ['streetwear','minimal','chic','elegant','casual','bohemian','sporty','vintage','luxury','formal','blazer','denim','leather','knit','trench','coat','dress']
    const found = words.filter(w => styleWords.includes(w))
    return found.length ? found.slice(0,3) : ['fashion','editorial','style']
  }

  // ── Source 2 : LoremFlickr (fallback garanti) ──────────────────────────────
  function loremFlickrUrl(prompt, lock) {
    const kw = fashionKeywords(prompt).slice(0, 2).join(',') || 'fashion'
    return `https://loremflickr.com/400/560/${kw},fashion/all?lock=${lock}`
  }

  // Pas de clé Pexels → Unsplash d'abord, LoremFlickr en fallback
  if (!process.env.PEXELS_API_KEY) {
    try {
      const url = await unsplashUrl(rawPrompt, lock, rawTitre)
      return res.json({ url })
    } catch {
      return res.json({ url: loremFlickrUrl(rawPrompt, lock) })
    }
  }

  try {
    const query = styleToQuery(rawTitre, rawPrompt)
    console.log('🔍 Recherche Pexels:', query)
    const response = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=portrait`,
      { headers: { Authorization: process.env.PEXELS_API_KEY }, timeout: 8000 }
    )
    const photos = response.data.photos
    if (photos && photos.length > 0) {
      const photo = photos[lock % photos.length]
      res.json({ url: photo.src.large })
    } else {
      const url = await unsplashUrl(rawPrompt, lock, rawTitre)
      res.json({ url })
    }
  } catch (e) {
    console.log('❌ Erreur Pexels:', e.message)
    try {
      const url = await unsplashUrl(rawPrompt, lock, rawTitre)
      res.json({ url })
    } catch {
      res.json({ url: loremFlickrUrl(rawPrompt, lock) })
    }
  }
})

// ── Routine du jour ──────────────────────────────────────────────────────────
app.post('/api/routine', async (req, res) => {
  const { profil, metriques } = req.body
  const prompt = `Tu es Solenn, coach de vie IA. Génère une routine de journée personnalisée pour ${profil.nom}.
Profil : ${profil.age} ans, objectifs : ${profil.objectifs?.join(', ')}, réveil : ${profil.reveil || '7h00'}, coucher : ${profil.coucher || '23h00'}.
Métriques d'hier : sommeil ${metriques.sommeil || 0}h, pas ${metriques.pas || 0}, humeur ${metriques.humeur || 0}/5.

Réponds UNIQUEMENT en JSON valide :
{
  "motivation": "phrase motivante personnalisée pour aujourd'hui",
  "matin": { "titre": "Matin énergisant", "heure": "7h00 – 9h00", "etapes": [{ "id": "m1", "emoji": "🌅", "titre": "Titre", "description": "Description courte et concrète", "duree": "10 min" }] },
  "nutrition": { "titre": "Nutrition du jour", "repas": [{"emoji":"🌅","moment":"Petit-déjeuner","suggestion":"suggestion adaptée au profil"},{"emoji":"☀️","moment":"Déjeuner","suggestion":"suggestion adaptée"},{"emoji":"🌙","moment":"Dîner","suggestion":"suggestion légère et adaptée"}], "supplements": ["supplément si pertinent selon profil"] },
  "apresmidi": { "titre": "Après-midi productif", "heure": "14h00 – 17h00", "etapes": [{ "id": "a1", "emoji": "☀️", "titre": "Titre", "description": "Description", "duree": "15 min" }] },
  "soir": { "titre": "Soir récupération", "heure": "20h00 – 22h00", "etapes": [{ "id": "s1", "emoji": "🌙", "titre": "Titre", "description": "Description", "duree": "20 min" }] },
  "astuce": { "emoji": "💡", "titre": "Astuce du jour", "conseil": "conseil court et actionnable" }
}
Chaque section doit avoir 3-4 étapes. Adapte tout au profil.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Tu génères des routines personnalisées. Réponds UNIQUEMENT en JSON valide, sans balises markdown, sans texte avant ou après le JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    })
    const raw = response.choices[0].message.content
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch (e) {
    console.error('Routine error:', e.message)
    res.status(500).json({ erreur: 'Erreur génération routine' })
  }
})

// ── Insights santé ───────────────────────────────────────────────────────────
app.post('/api/health-insights', async (req, res) => {
  const { metriques, profil } = req.body
  const prompt = `Tu es Solenn, coach santé. Analyse les métriques de ${profil.nom} et donne 3 insights personnalisés.
Métriques : pas=${metriques.pas || 0}, sommeil=${metriques.sommeil || 0}h, eau=${metriques.eau || 0} verres, humeur=${metriques.humeur || 0}/5, FC=${metriques.fc || 0}bpm, poids=${metriques.poids || 0}kg.
Objectifs : ${profil.objectifs?.join(', ') || 'non renseignés'}.

Réponds en JSON : { "insights": [{ "emoji": "emoji", "titre": "titre court", "message": "analyse personnalisée 2-3 phrases", "type": "positif|attention|conseil" }] }
Maximum 3 insights, pertinents et actionnables.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Tu analyses des données de santé. Réponds UNIQUEMENT en JSON valide, sans balises markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 800,
    })
    const raw = response.choices[0].message.content
    const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch {
    res.json({ insights: [] })
  }
})

// ── Recommandations herbal IA ─────────────────────────────────────────────────
app.post('/api/herbal', async (req, res) => {
  const { profil } = req.body
  const prompt = `Tu es Solenn, expert en phytothérapie et médecine naturelle. Analyse le profil de ${profil.nom} et propose des plantes/remèdes VRAIMENT personnalisés.

PROFIL COMPLET :
- Âge : ${profil.age} ans
- Objectifs : ${profil.objectifs?.join(', ') || 'non renseignés'}
- Alimentation : ${profil.alimentaireDetails || profil.regimes?.join(', ') || 'non renseignée'}
- Carences / Santé : ${profil.santeDetails || profil.carences?.join(', ') || 'non renseignées'}
- Maladies : ${profil.maladiesDetails || profil.maladies?.join(', ') || 'aucune'}
- Mode de vie : ${profil.activite || 'non renseigné'}

Pour chaque recommandation, explique PRÉCISÉMENT pourquoi c'est adapté à CE profil spécifique (cite les objectifs, les carences, l'âge). Les explications doivent être différentes et personnalisées pour chaque plante.

Réponds en JSON :
{ "recommendations": [
  {
    "nom": "Nom de la plante",
    "emoji": "🌿",
    "tag": "Catégorie courte",
    "benefice": "Bénéfice principal en 1 phrase",
    "pourquoi": "Explication en 2-3 phrases POURQUOI c'est adapté à ce profil précis — cite les objectifs, carences ou conditions de ${profil.nom}",
    "usage": "Dosage précis, forme, moment de prise",
    "precaution": "1 précaution ou contre-indication si pertinent, sinon null",
    "synergie": "Avec quoi combiner pour plus d'effet (optionnel)"
  }
] }
Donne 6 recommandations vraiment différentes et adaptées. Sois précis et scientifique.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Tu es un expert herbal. Réponds UNIQUEMENT en JSON valide.' },
        { role: 'user', content: prompt }
      ]
    })
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch {
    res.json({ recommendations: [] })
  }
})

// ── Clé publique VAPID ───────────────────────────────────────────────────────
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY })
})

// ── Sauvegarder subscription push ────────────────────────────────────────────
app.post('/api/push-subscribe', (req, res) => {
  const { subscription, userId } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Subscription invalide' })
  pushSubscriptions.set(userId || subscription.endpoint, subscription)
  console.log(`Push subscription sauvegardee (total: ${pushSubscriptions.size})`)
  res.json({ ok: true })
})

// ── Supprimer subscription ────────────────────────────────────────────────────
app.post('/api/push-unsubscribe', (req, res) => {
  const { userId, endpoint } = req.body
  pushSubscriptions.delete(userId || endpoint)
  res.json({ ok: true })
})

// ── Envoyer notif a un utilisateur ───────────────────────────────────────────
app.post('/api/push-send', async (req, res) => {
  const { userId, title, body, url, tag } = req.body
  const sub = pushSubscriptions.get(userId)
  if (!sub) return res.status(404).json({ error: 'Subscription introuvable' })
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title, body, url: url || '/', tag }))
    res.json({ ok: true })
  } catch (e) {
    if (e.statusCode === 410) pushSubscriptions.delete(userId)
    res.status(500).json({ error: e.message })
  }
})

// ── Broadcast toutes les subscriptions ───────────────────────────────────────
app.post('/api/push-broadcast', async (req, res) => {
  const { title, body, url, tag } = req.body
  const payload = JSON.stringify({ title, body, url: url || '/', tag })
  let ok = 0, fail = 0
  for (const [id, sub] of pushSubscriptions) {
    try { await webpush.sendNotification(sub, payload); ok++ }
    catch (e) { if (e.statusCode === 410) pushSubscriptions.delete(id); fail++ }
  }
  res.json({ ok, fail, total: pushSubscriptions.size })
})

// ── Stripe Checkout ──────────────────────────────────────────────────────────
app.post('/api/create-checkout', async (req, res) => {
  try {
    const origin = req.headers.origin || `http://${req.headers.host}` || 'http://152.228.131.218'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      locale: 'fr',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Solenn Pro',
            description: 'Coach IA illimité · Analyses personnalisées · Toutes les fonctionnalités',
            images: [],
          },
          unit_amount: 499,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${origin}/?subscribed=true`,
      cancel_url:  `${origin}/?subscribed=cancel`,
      metadata: { userId: req.body.userId || 'anonymous' },
    })
    res.json({ url: session.url })
  } catch (e) {
    console.error('Stripe error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── Vérifier statut abonnement ───────────────────────────────────────────────
app.get('/api/check-subscription', async (req, res) => {
  const { sessionId } = req.query
  if (!sessionId) return res.json({ active: false })
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    res.json({ active: session.payment_status === 'paid' || session.status === 'complete' })
  } catch {
    res.json({ active: false })
  }
})

// ── Sert le frontend React (dist/) — seulement en local ─────────────────────
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

// Export pour Vercel serverless
export default app

// Listen seulement en local
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`✅ Serveur Solenn démarré sur port ${PORT}`)
  })
}
