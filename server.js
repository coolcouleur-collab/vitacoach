import express from 'express'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(express.json())

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

  const systemPrompt = `Tu es VitaCoach, un coach de vie personnel et bienveillant.
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
Tu es chaleureux, motivant et précis. Tu parles en français.`

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

app.listen(3001, () => {
  console.log('✅ Serveur VitaCoach démarré sur http://localhost:3001')
})
