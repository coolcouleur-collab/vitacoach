/**
 * AGENT DESIGN ADVISOR — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyse la cohérence visuelle de l'app et propose des améliorations premium.
 * Ne modifie JAMAIS le code directement — génère uniquement des recommandations.
 * Chaque recommandation doit être validée manuellement avant application.
 *
 * Philosophie design Solenn :
 *   → Palette : blanc crème #FFF8F4, orange #C87B52, or #E8962A, nuit #0A1633
 *   → Opacités : fond 0.08–0.15, bordures 0.12–0.20, texte principal 0.88–0.95
 *   → Typographie : Poppins (UI), Cormorant Garamond (titres/italic)
 *   → Rayon : 12px (petits), 16px (cards), 20px (panels), 28px (sheets)
 *   → Blur : 8px (léger), 20px (moyen), 32px (fort)
 *   → Vibe : Apple Health × Goop × Spa de luxe
 */

import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')

let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// ─── Palette de référence Solenn ──────────────────────────────────────────────
const DESIGN_TOKENS = {
  couleurs: {
    creme:    '#FFF8F4',
    orange:   '#C87B52',
    or:       '#E8962A',
    nuit:     '#0A1633',
    blanc:    '#FFFFFF',
    vert:     '#22c55e',
    rouge:    '#ef4444',
  },
  opacites: {
    fondCard:     { min: 0.06, max: 0.18, label: 'fond de card' },
    bordure:      { min: 0.10, max: 0.22, label: 'bordure' },
    textePrinc:   { min: 0.85, max: 1.00, label: 'texte principal' },
    texteSecond:  { min: 0.50, max: 0.70, label: 'texte secondaire' },
    texteTertia:  { min: 0.30, max: 0.48, label: 'texte tertiaire' },
  },
  typographie: {
    titrePage:    { size: '22–28px', weight: '700–800', font: 'Poppins' },
    titreCard:    { size: '14–16px', weight: '600–700', font: 'Poppins' },
    corps:        { size: '13–14px', weight: '400',     font: 'Poppins' },
    meta:         { size: '10–12px', weight: '500',     font: 'Poppins' },
    accent:       { size: '14–18px', weight: '300–400', font: 'Cormorant Garamond italic' },
  },
  rayons: {
    petit:  12,
    card:   16,
    panel:  20,
    sheet:  28,
  },
  blur: {
    leger: 8,
    moyen: 20,
    fort:  32,
  }
}

// ─── Lecture des fichiers source ──────────────────────────────────────────────
// Cherche src/ à plusieurs endroits selon l'environnement (local vs Render)
function resolveSrc() {
  const candidates = [
    path.join(__dirname, '..', 'src'),                         // agents/../src
    path.join(process.cwd(), 'src'),                           // cwd/src
    path.join(path.dirname(__dirname), 'src'),                 // parent/src
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function lireFichiers() {
  const srcDir = resolveSrc()
  if (!srcDir) {
    console.warn('[DesignAdvisor] ⚠️ Dossier src/ introuvable — audit sans fichiers locaux')
    return {}
  }
  const fichiers = {}
  const cibles = [
    'App.jsx', 'HomeTab.jsx', 'SanteTab.jsx', 'RoutineTab.jsx',
    'Forum.jsx', 'MorningCheckin.jsx', 'SettingsSheet.jsx', 'ChatHistory.jsx',
  ]
  for (const f of cibles) {
    const p = path.join(srcDir, f)
    if (fs.existsSync(p)) {
      fichiers[f] = fs.readFileSync(p, 'utf-8')
    }
  }
  console.log(`[DesignAdvisor] ${Object.keys(fichiers).length} fichiers lus depuis ${srcDir}`)
  return fichiers
}

// ─── Extraction des tokens design utilisés ───────────────────────────────────
function extraireTokens(contenu) {
  const tokens = {
    couleurs: [],
    opacites: [],
    rayons:   [],
    fontSizes: [],
    blurs:    [],
  }

  // Couleurs rgba
  const rgbaMatches = contenu.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/g) || []
  rgbaMatches.forEach(m => {
    const alpha = parseFloat(m.match(/[\d.]+\)$/)[0])
    tokens.opacites.push(alpha)
  })

  // Hex colors
  const hexMatches = contenu.match(/#[0-9a-fA-F]{6}/g) || []
  tokens.couleurs = [...new Set(hexMatches)]

  // Border radius
  const radiusMatches = contenu.match(/borderRadius:\s*(\d+)/g) || []
  radiusMatches.forEach(m => {
    const v = parseInt(m.match(/\d+/)[0])
    tokens.rayons.push(v)
  })

  // Font sizes
  const fontMatches = contenu.match(/fontSize:\s*([\d.]+)/g) || []
  fontMatches.forEach(m => {
    const v = parseFloat(m.match(/[\d.]+/)[0])
    tokens.fontSizes.push(v)
  })

  // Blur
  const blurMatches = contenu.match(/blur\((\d+)px\)/g) || []
  blurMatches.forEach(m => {
    const v = parseInt(m.match(/\d+/)[0])
    tokens.blurs.push(v)
  })

  return tokens
}

// ─── Détection des incohérences ────────────────────────────────────────────────
function detecterInconsistances(fichiers) {
  const rapportFichiers = {}
  const couleursGlobales = new Set()
  const rayonsGlobaux = new Set()

  for (const [nom, contenu] of Object.entries(fichiers)) {
    const tokens = extraireTokens(contenu)
    rapportFichiers[nom] = tokens

    // Couleurs hors palette
    tokens.couleurs.forEach(c => {
      const palette = Object.values(DESIGN_TOKENS.couleurs)
      if (!palette.includes(c.toUpperCase()) && !palette.includes(c.toLowerCase())) {
        couleursGlobales.add(`${nom}: couleur non-palette ${c}`)
      }
    })

    // Rayons incohérents
    tokens.rayons.forEach(r => {
      const valides = Object.values(DESIGN_TOKENS.rayons)
      if (!valides.includes(r) && r > 0 && r < 50) {
        rayonsGlobaux.add(`${nom}: borderRadius ${r}px (référence: 12/16/20/28)`)
      }
    })
  }

  return {
    couleursHorsPalette: [...couleursGlobales].slice(0, 8),
    rayonsIncoh: [...rayonsGlobaux].slice(0, 8),
    fichiers: rapportFichiers,
  }
}

// ─── Analyse IA des incohérences et recommandations ──────────────────────────
async function analyserAvecIA(inconsistances, fichiers) {
  // Résumé compact des fichiers pour l'IA (pas le code complet — trop long)
  const resume = Object.entries(fichiers).map(([nom, contenu]) => {
    const tokens = extraireTokens(contenu)
    return `${nom}: ${tokens.couleurs.length} couleurs, rayons [${[...new Set(tokens.rayons)].sort((a,b)=>a-b).join(',')}], fontSize [${[...new Set(tokens.fontSizes)].sort((a,b)=>a-b).join(',')}], blurs [${[...new Set(tokens.blurs)].join(',')}]`
  }).join('\n')

  const prompt = `Tu es un expert en design UI premium (Apple, Goop, Arc Browser).
Tu analyses l'app Solenn — coach de vie IA, style premium épuré.

PALETTE DE RÉFÉRENCE :
- Fond crème : #FFF8F4
- Orange principal : #C87B52 (rgba 200,123,82)
- Or accent : #E8962A (rgba 232,150,42)
- Nuit : #0A1633
- Opacités fond card : 0.06–0.18
- Opacités bordures : 0.10–0.22
- BorderRadius : 12 (petit) / 16 (card) / 20 (panel) / 28 (sheet)
- Blur : 8 (léger) / 20 (moyen) / 32 (fort)
- Fonts : Poppins (UI) + Cormorant Garamond italic (accents)
- Vibe : Apple Health × Goop × Spa luxe

ANALYSE FICHIERS :
${resume}

INCOHÉRENCES DÉTECTÉES :
Couleurs hors palette : ${inconsistances.couleursHorsPalette.slice(0,5).join(', ')}
Rayons incohérents : ${inconsistances.rayonsIncoh.slice(0,5).join(', ')}

Génère 5 recommandations design prioritaires CONCRÈTES et ACTIONNABLES pour rendre l'app plus cohérente et premium.
Format JSON :
{
  "score_coherence": 0-100,
  "resume": "résumé en 1 phrase",
  "recommandations": [
    {
      "priorite": "haute|moyenne|faible",
      "fichier": "nom du fichier concerné",
      "probleme": "description du problème",
      "solution": "solution concrète avec valeurs exactes",
      "exemple_avant": "code/valeur actuelle",
      "exemple_apres": "code/valeur corrigée",
      "impact": "amélioration attendue"
    }
  ]
}`

  const res = await getGroq().chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'Tu es un expert design UI premium. Réponds uniquement en JSON valide, sans markdown.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 1800,
  })

  const raw = res.choices[0].message.content
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON invalide')
  return JSON.parse(match[0])
}

// ─── Fonction principale exportée ─────────────────────────────────────────────
export async function runDesignAudit() {
  console.log('[DesignAdvisor] 🎨 Analyse design en cours...')

  const fichiers = lireFichiers()
  const inconsistances = detecterInconsistances(fichiers)
  const analyse = await analyserAvecIA(inconsistances, fichiers)

  const rapport = {
    date: new Date().toISOString(),
    score: analyse.score_coherence,
    resume: analyse.resume,
    recommandations: analyse.recommandations,
    note: '⚠️ Aucune modification automatique — validation manuelle requise pour chaque recommandation.',
    tokens_reference: DESIGN_TOKENS,
  }

  console.log(`[DesignAdvisor] Score cohérence : ${rapport.score}/100`)
  console.log(`[DesignAdvisor] ${rapport.recommandations?.length || 0} recommandations générées`)

  return rapport
}

// Design tokens exportés pour référence
export { DESIGN_TOKENS }
