/**
 * AGENT MÉTÉO-ROUTINE — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Adapte les suggestions de routine quotidienne en fonction de la météo locale.
 * Appelé par routine-auto.js au moment de la génération de la routine (05:30).
 * Si pas de clé OpenWeather → retourne null silencieusement (routine sans météo).
 *
 * Variables d'env requises :
 *   OPENWEATHER_API_KEY — clé API OpenWeatherMap (free tier suffit)
 *
 * Trigger : intégré dans routine-auto.js + GET /api/meteo-context?ville=Paris
 */

import Groq from 'groq-sdk'
import axios from 'axios'

let _groq = null

function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// ─── Récupère la météo via OpenWeatherMap ─────────────────────────────────────
export async function getMeteo(ville = 'Paris', pays = 'FR') {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ville)},${pays}&appid=${apiKey}&units=metric&lang=fr`
    const { data } = await axios.get(url, { timeout: 5000 })

    return {
      temp:        Math.round(data.main.temp),
      ressentie:   Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon:        data.weather[0].icon,
      code:        data.weather[0].id,        // ex: 800 = ciel dégagé
      humidite:    data.main.humidity,
      vent:        Math.round(data.wind.speed * 3.6), // km/h
      ville:       data.name,
      lever:       new Date(data.sys.sunrise * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      coucher:     new Date(data.sys.sunset  * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }
  } catch (e) {
    console.warn('[MeteoRoutine] API météo indisponible:', e.message)
    return null
  }
}

// ─── Catégorise la météo pour les recommandations ────────────────────────────
function categoriserMeteo(meteo) {
  if (!meteo) return 'inconnue'
  const code = meteo.code
  if (code >= 200 && code < 300) return 'orage'
  if (code >= 300 && code < 600) return 'pluie'
  if (code >= 600 && code < 700) return 'neige'
  if (code >= 700 && code < 800) return 'brouillard'
  if (code === 800)               return 'ensoleillé'
  if (code > 800)                 return meteo.temp > 20 ? 'nuageux-chaud' : 'nuageux-frais'
  return 'variable'
}

// ─── Génère le contexte météo pour la routine ────────────────────────────────
export async function genererContexteMeteo(ville = 'Paris', pays = 'FR') {
  const meteo    = await getMeteo(ville, pays)
  if (!meteo) return null

  const categorie = categoriserMeteo(meteo)

  // Recommandations pré-définies par catégorie (pas de Groq pour ça — rapide)
  const RECO = {
    'ensoleillé':     { activite: 'promenade en plein air', energie: 'haute',   symbole: '☀️', conseil: 'Profite de la lumière naturelle pour booster ta sérotonine.' },
    'nuageux-chaud':  { activite: 'yoga en terrasse ou marche', energie: 'bonne', symbole: '⛅', conseil: 'Temps idéal pour une activité douce à l\'extérieur.' },
    'nuageux-frais':  { activite: 'marche rapide ou stretching intérieur', energie: 'modérée', symbole: '🌥️', conseil: 'Les températures fraîches favorisent la concentration.' },
    'pluie':          { activite: 'méditation, yoga ou exercice indoor', energie: 'calme',  symbole: '🌧️', conseil: 'Journée cocooning — parfaite pour un travail intérieur profond.' },
    'orage':          { activite: 'lecture, journaling, méditation', energie: 'repos',   symbole: '⛈️', conseil: 'Reste à l\'intérieur et prends soin de toi avec douceur.' },
    'neige':          { activite: 'balade enneigée ou activité cosy', energie: 'variable', symbole: '❄️', conseil: 'La neige crée un calme naturel propice à l\'introspection.' },
    'brouillard':     { activite: 'yoga, respiration ou marche courte', energie: 'douce',  symbole: '🌫️', conseil: 'Journée mystérieuse — idéale pour la pleine conscience.' },
    'variable':       { activite: 'routine intérieure', energie: 'adaptable', symbole: '🌤️', conseil: 'Adapte ton énergie à la météo changeante.' },
    'inconnue':       { activite: 'routine standard', energie: 'normale', symbole: '🌡️', conseil: '' },
  }

  const reco = RECO[categorie] || RECO['inconnue']

  return {
    meteo,
    categorie,
    ...reco,
    resume: `${reco.symbole} ${meteo.temp}°C · ${meteo.description} à ${meteo.ville}`,
    adaptation_routine: `Activité recommandée : ${reco.activite}. Énergie du jour : ${reco.energie}.`,
  }
}

// ─── Runner pour le trigger manuel ───────────────────────────────────────────
export async function runMeteoRoutine(options = {}) {
  const ville = options.ville || process.env.METEO_VILLE_DEFAUT || 'Paris'
  const pays  = options.pays  || process.env.METEO_PAYS_DEFAUT  || 'FR'
  const ctx   = await genererContexteMeteo(ville, pays)
  console.log(`[MeteoRoutine] ${ctx?.resume || 'Météo non disponible'}`)
  return ctx
}
