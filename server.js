import express from 'express'
import Groq from 'groq-sdk'
import Stripe from 'stripe'
import webpush from 'web-push'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Web Push VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:contact@oravia.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

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

app.get('/', (req, res) => res.json({ status: 'VitaCoach OK' }))

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

  const systemPrompt = `Tu es Oravia, un coach de vie personnel et bienveillant.
Tu connais parfaitement ton utilisateur :
- Nom: ${profil.nom}
- Age: ${profil.age} ans
- Taille: ${profil.taille || 'non renseigné'} cm, Poids: ${profil.poids || 'non renseigné'} kg
- Objectifs: ${profil.objectifs?.join(', ') || 'non renseigné'}
- Habitudes alimentaires: ${profil.alimentaireDetails || profil.regimes?.join(', ') || 'non renseigné'}
- Style vestimentaire: ${profil.styleDetails || profil.styles?.join(', ') || 'non renseigné'}
- Mensurations: ${profil.mensurations || 'non renseigné'}
- Carences et santé: ${profil.santeDetails || profil.carences?.join(', ') || 'non renseigné'}
- Maladies/Pathologies: ${profil.maladiesDetails || profil.maladies?.join(', ') || 'aucune renseignée'}

Tu te souviens des conversations précédentes et tu fais des références à ce qui a été dit avant.
Tu donnes des conseils personnalisés sur la nutrition, le sommeil, les tenues et le bien-être.
Tu es chaleureux, motivant et précis. Tu parles en français.

RÉPONSES DYNAMIQUES — DEUX FORMATS DISPONIBLES :

━━ FORMAT 1 : RÉSERVATION (booking) ━━
Utilise quand l'utilisateur parle de réserver, sortir, aller quelque part, prendre RDV :
✅ "j'ai envie d'aller au restaurant", "réserve-moi un médecin", "je veux faire du sport dehors", "prends rdv chez le kiné"

|||JSON|||
{"type":"booking","emoji":"🍽️","service":"Nom du lieu/service","lieu":"Ville ou quartier si connu","date":"Ce soir / Demain / etc.","heure":"20h00","note":"Message chaleureux et personnel du coach — max 2 phrases","links":[{"icon":"🗺️","label":"Chercher sur Google Maps","url":"https://www.google.com/maps/search/MOTS+CLES+VILLE"},{"icon":"🔍","label":"Rechercher sur Google","url":"https://www.google.com/search?q=MOTS+CLES+VILLE"}]}
|||END|||

Liens — utilise UNIQUEMENT ces formats qui fonctionnent toujours :
- Google Maps : https://www.google.com/maps/search/MOTS_CLES_ESPACES_REMPLACÉS_PAR_+
- Google Search : https://www.google.com/search?q=MOTS_CLES_ESPACES_REMPLACÉS_PAR_+
- Doctolib (médecin/kiné/dentiste) : https://www.doctolib.fr/SPECIALITE/VILLE (ex: https://www.doctolib.fr/medecin-generaliste/paris)
Exemples :
- Restaurant casher Paris → Maps: https://www.google.com/maps/search/restaurant+casher+paris
- Kiné Paris → Doctolib: https://www.doctolib.fr/kinesitherapeute/paris + Maps: https://www.google.com/maps/search/kinesitherapeute+paris
- Salle de sport Lyon → Maps: https://www.google.com/maps/search/salle+de+sport+lyon

━━ FORMAT 2 : LISTES (meals/exercises/tips/plants/routine) ━━
Utilise UNIQUEMENT quand demande explicite de liste :
✅ "idées de repas", "exercices pour...", "quelles plantes", "programme..."
❌ JAMAIS pour les conversations, questions simples, émotions

|||JSON|||
{"type":"TYPE","intro":"1 phrase d'accroche personnalisée","items":[{"icon":"emoji","title":"Nom","desc":"2 phrases UNIQUES et utiles, adaptées au profil — bénéfice + tip pratique","badge":"Étiquette","color":"#hex","sub":"Info clé ex: ~450 kcal · 10 min"}],"outro":"1 phrase de conclusion"}
|||END|||

Règles listes : 5-6 items · chaque desc unique · sub toujours rempli
Types : "meals"=#FF6B35 · "exercises"=#a78bfa · "tips"=#FF9A3C · "plants"=#34c759 · "routine"=#38bdf8

━━ TOUT LE RESTE ━━
Texte pur, chaleureux, spontané, comme un vrai ami coach. Direct et concret.`

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
  try {
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${ville}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=fr`
    )
    const w = weatherRes.data
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

Propose 6 tenues avec des styles VARIÉS (ex: minimaliste, tendance, classique, streetwear, bohème, sportif chic). Réponds UNIQUEMENT en JSON valide :
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
})

// Recherche images mode via Pexels
app.get('/api/image', async (req, res) => {
  try {
    const prompt = req.query.prompt
    // On extrait les mots clés importants pour Pexels
    const keywords = prompt
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(' ')
      .filter(w => w.length > 3)
      .slice(0, 4)
      .join(' ') + ' fashion outfit'

    console.log('🔍 Recherche Pexels:', keywords)
    const response = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=15&orientation=portrait`,
      { headers: { Authorization: process.env.PEXELS_API_KEY }, timeout: 8000 }
    )
    const photos = response.data.photos
    if (photos && photos.length > 0) {
      const photo = photos[Math.floor(Math.random() * Math.min(8, photos.length))]
      res.json({ url: photo.src.large })
    } else {
      // Fallback recherche générique mode
      const fallback = await axios.get(
        `https://api.pexels.com/v1/search?query=fashion+outfit+style&per_page=15&orientation=portrait`,
        { headers: { Authorization: process.env.PEXELS_API_KEY }, timeout: 8000 }
      )
      const photos2 = fallback.data.photos
      if (photos2?.length > 0) {
        res.json({ url: photos2[Math.floor(Math.random() * photos2.length)].src.large })
      } else {
        res.json({ url: null })
      }
    }
  } catch (e) {
    console.log('❌ Erreur Pexels:', e.message)
    res.json({ url: null })
  }
})

// ── Routine du jour ──────────────────────────────────────────────────────────
app.post('/api/routine', async (req, res) => {
  const { profil, metriques } = req.body
  const prompt = `Tu es Oravia, coach de vie IA. Génère une routine de journée personnalisée pour ${profil.nom}.
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
        { role: 'system', content: 'Tu génères des routines personnalisées. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.' },
        { role: 'user', content: prompt }
      ]
    })
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur génération routine' })
  }
})

// ── Insights santé ───────────────────────────────────────────────────────────
app.post('/api/health-insights', async (req, res) => {
  const { metriques, profil } = req.body
  const prompt = `Tu es Oravia, coach santé. Analyse les métriques de ${profil.nom} et donne 3 insights personnalisés.
Métriques : pas=${metriques.pas || 0}, sommeil=${metriques.sommeil || 0}h, eau=${metriques.eau || 0} verres, humeur=${metriques.humeur || 0}/5, FC=${metriques.fc || 0}bpm, poids=${metriques.poids || 0}kg.
Objectifs : ${profil.objectifs?.join(', ') || 'non renseignés'}.

Réponds en JSON : { "insights": [{ "emoji": "emoji", "titre": "titre court", "message": "analyse personnalisée 2-3 phrases", "type": "positif|attention|conseil" }] }
Maximum 3 insights, pertinents et actionnables.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Tu analyses des données de santé. Réponds UNIQUEMENT en JSON valide.' },
        { role: 'user', content: prompt }
      ]
    })
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch {
    res.json({ insights: [] })
  }
})

// ── Recommandations herbal IA ─────────────────────────────────────────────────
app.post('/api/herbal', async (req, res) => {
  const { profil } = req.body
  const prompt = `Tu es Oravia, expert en phytothérapie et médecine naturelle. Analyse le profil de ${profil.nom} et propose des plantes/remèdes VRAIMENT personnalisés.

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
            name: 'Oravia Pro',
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✅ Serveur VitaCoach démarré sur port ${PORT}`)
})
