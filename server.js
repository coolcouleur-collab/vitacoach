import crypto from 'crypto'
import { programmeParId } from './src/programmes.js'
import express from 'express'
import Groq from 'groq-sdk'
import Stripe from 'stripe'
import webpush from 'web-push'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import fs from 'fs'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import {
  startAgents, getAgentsStatus, triggerAgent,
  getRoutineCache, regenererPourUser, routineCache,
  runDesignAudit, DESIGN_TOKENS,
  genererRapportUser, creerChallenge,
  genererContexteMeteo, genererConseilsNutrition,
  extraireMoments, sauvegarderMoments,
} from './agents/index.js'
import { runSyncSante, syncWithings, syncOura, syncGarmin, refreshWithingsToken } from './agents/sync-sante.js'
import { genererRecettes, recettesSures, motsInterdits } from './agents/recettes.js'
import { updateMetriques } from './agents/monitoring.js'
import { rapportsCache } from './agents/tendances.js'
import { ownerGuard, adminGuard } from './api/_auth.js'
import { consumeQuota } from './api/_quota.js'

dotenv.config()

const app = express()
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Les clés collées dans un dashboard (Render/Vercel) embarquent souvent un
// retour à la ligne ou une espace invisible. Un tel caractère rend l'en-tête
// Authorization illégal : la requête n'est jamais envoyée et la lib remonte
// « An error occurred with our connection to Stripe » — trompeur, on croit à
// une panne réseau (diagnostiqué le 2026-08-08, aucune requête reçue côté
// Stripe). On nettoie systématiquement.
const cleanKey = v => (v || '').replace(/[\s​-‍﻿]/g, '')
const stripe = new Stripe(cleanKey(process.env.STRIPE_SECRET_KEY))

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
console.log('SUPABASE_URL:', supabaseUrl ? '✅ défini' : '❌ manquant')
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ défini' : '❌ manquant')

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Stripe webhook — raw body requis (avant express.json())
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET manquant — webhook ignoré, Pro jamais activé')
    return res.json({ received: true }) // pas encore configuré
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature invalide:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log('[Webhook] Event:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    if (userId && supabase) {
      const { data: existing } = await supabase.from('profils').select('profil').eq('user_id', userId).single()
      const updatedProfil = {
        ...(existing?.profil || {}),
        isPro: true,
        proSince: new Date().toISOString(),
        proPlan: session.metadata?.plan || 'monthly',
        stripeSessionId: session.id,
        // Indispensable pour retrouver l'utilisateur quand customer.subscription.deleted arrive
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
      }
      await supabase.from('profils').upsert({ user_id: userId, profil: updatedProfil }, { onConflict: 'user_id' })
      console.log('[Webhook] User', userId, '→ Pro ✅ (plan', updatedProfil.proPlan + ')')
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    // Retrouver le user par customer ID
    if (supabase) {
      const { data: rows } = await supabase.from('profils').select('user_id, profil').contains('profil', { stripeCustomerId: sub.customer })
      for (const row of rows || []) {
        const updatedProfil = { ...(row.profil || {}), isPro: false, proEnd: new Date().toISOString() }
        await supabase.from('profils').update({ profil: updatedProfil }).eq('user_id', row.user_id)
        console.log('[Webhook] User', row.user_id, '→ Pro annulé')
      }
    }
  }

  res.json({ received: true })
})

app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-agents-key')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.get('/',           (req, res) => res.json({ status: 'Solenn OK' }))
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }))

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
app.post('/api/sauvegarder-profil', ownerGuard, async (req, res) => {
  const { user_id, profil } = req.body
  const { error } = await supabase.from('profils').upsert({ user_id, profil }, { onConflict: 'user_id' })
  if (error) return res.json({ erreur: error.message })
  res.json({ succes: true })
})

// Charger profil depuis la base
app.get('/api/charger-profil', ownerGuard, async (req, res) => {
  const { user_id } = req.query
  const { data, error } = await supabase.from('profils').select('profil').eq('user_id', user_id).single()
  if (error) return res.json({ profil: null })
  res.json({ profil: data.profil })
})

// Chat principal
app.post('/api/chat', ownerGuard, async (req, res) => {
  const { message, profil, historique = [], context_hints, metriques } = req.body

  // ── Quota serveur des messages gratuits (SOS toujours exempté) ────────────
  const quota = await consumeQuota(req.authUser, message)
  if (!quota.ok) {
    return res.status(429).json({ error: 'quota_atteint', limit: quota.limit })
  }

  // ── Détection SOS ─────────────────────────────────────────────────────────
  const SOS_PATTERN = /\b(à bout|j'en peux plus|plus envie|tout lâcher|envie de rien|tellement triste|je pleure|vraiment mal|je crack|j'ai craqué|épuisé[e]? complètement|j'abandonne|plus la force|suicide|mourir|veux mourir|veux disparaître|fin de tout|à bout de force)\b/i
  const isSOS = SOS_PATTERN.test(message)

  // Contexte dynamique — streak, score, sujets récurrents
  let contextLine = ''
  if (context_hints) {
    const parts = []
    if (context_hints.streak > 1)        parts.push(`streak ${context_hints.streak} jours consécutifs`)
    if (context_hints.todayScore > 0)    parts.push(`score santé aujourd'hui ${context_hints.todayScore}/100`)
    if (context_hints.topics?.length)    parts.push(`sujets récurrents : ${context_hints.topics.join(', ')}`)
    if (context_hints.trends?.length)    parts.push(`tendances : ${context_hints.trends.join(' · ')}`)
    if (parts.length) contextLine = `\nCONTEXTE LIVE : ${parts.join(' · ')}`
  }

  // Mémoire longue durée — ce dont Solenn se souvient des sessions précédentes
  let memoryLine = ''
  if (context_hints?.memories?.length) {
    memoryLine = `\nMÉMOIRE DES SESSIONS PRÉCÉDENTES (ce que ${profil?.nom || 'l\'utilisateur'} t'a confié avant) :\n` +
      context_hints.memories.map(m => `• ${m}`).join('\n') +
      `\nUtilise ces souvenirs naturellement — par ex. "La semaine dernière tu me parlais de... c'est mieux ?" — sans en faire une liste.`
  }

  // ── Mode SOS — système prompt soutien pur ────────────────────────────────
  if (isSOS) {
    const sosPrompt = `Tu es Solenn, coach de vie. ${profil?.nom || 'Cette personne'} vient de te dire quelque chose de difficile.

TON UNIQUE RÔLE EN CE MOMENT : être présente. Pas coach, pas conseillère — juste humaine.

RÈGLES ABSOLUES MODE SOS :
1. Commence par reconnaître ce qu'il/elle ressent — 1-2 phrases, sincères, sans minimiser
2. Pose UNE question simple et ouverte pour comprendre la situation
3. Ne propose AUCUN conseil, aucune solution, aucune plante, aucun exercice
4. Si tu détectes un danger réel (idées suicidaires explicites) → mentionne le 3114 (numéro national prévention suicide) avec douceur
5. Ton ton : doux, présent, sans jugement. Comme un ami de confiance à 2h du matin.
6. Max 3 phrases. Pas de listes. Pas d'emojis sauf 💙 en fin si naturel.
7. JAMAIS : "Je comprends", "C'est normal", "Tout va aller" — trop automatique. Sois vraie.`

    const messagesAPI = [
      { role: 'system', content: sosPrompt },
      ...historique.filter(m => (m.role === 'user' || m.role === 'assistant') && m.content).slice(-6),
      { role: 'user', content: message }
    ]
    try {
      const stream = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: messagesAPI,
        temperature: 0.60,
        max_tokens: 300,
        stream: true,
      })
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders()
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content
        if (token) res.write(`data: ${JSON.stringify(token)}\n\n`)
      }
      res.write('data: [DONE]\n\n')
      res.end()
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ error: err.message })
      else res.end()
    }
    return
  }

  const systemPrompt = `Tu es Solenn, coach de vie IA — bienveillante, perspicace, directe. Tu combines coaching de vie, nutrition, médecine naturelle et phytothérapie.
Tu connais vraiment ${profil.nom} : ${profil.age} ans${profil.taille ? `, ${profil.taille}cm` : ''}${profil.poids ? ` ${profil.poids}kg` : ''} · Objectifs: ${profil.objectifs?.join(', ') || '?'} · Alimentation: ${profil.alimentaireDetails || profil.regimes?.join(', ') || '?'} · Santé: ${profil.santeDetails || profil.carences?.join(', ') || '?'}${profil.maladiesDetails || profil.maladies?.length ? ` · Conditions: ${profil.maladiesDetails || profil.maladies?.join(', ')}` : ''}${contextLine}${memoryLine}

PERSONNALITÉ :
- Tu perçois ce qui se cache derrière les mots — si quelqu'un dit "je suis fatigué", tu creuses
- Tu fais des connexions intelligentes entre le profil, les habitudes et la question posée
- Tu anticipes le vrai besoin, pas juste la question de surface
- Tu as de l'empathie sans être condescendant — tu comprends, tu ne juges pas
- Ton ton : chaleureux mais sans fioriture, comme un ami proche très bien informé
- Être directe, c'est commencer par la réponse. Ce n'est PAS l'annoncer.
  Tu ne commentes jamais ta propre façon de parler. Bannis absolument :
  « Attends », « je vais être directe », « soyons honnêtes », « écoute »,
  « franchement », « pour être claire », « laisse-moi t'expliquer ».
  Ces formules font croire à une alerte ou à une mauvaise nouvelle alors qu'il
  n'y en a pas. Tu commences par ce que la personne doit savoir, point.

MÉDECINE NATURELLE — ta base de connaissances :
Tu intègres des alternatives naturelles quand c'est pertinent ET sûr pour ce profil précis.

🌙 SOMMEIL : Valériane (450mg, 1h avant coucher, adulte 18+) · Mélatonine (0.5mg adulte, 0.25mg ado 14-17, JAMAIS <12 ans) · Passiflore (tisane, tous âges adultes) · Magnésium glycinate (300mg adulte, 150mg ado) · Lavande (aromathérapie, tous âges)
😰 STRESS / ANXIÉTÉ : Ashwagandha (300-600mg, adulte 18+ seulement) · Rhodiola (200-400mg matin, 18+ seulement) · Mélisse (tisane, dès 12 ans) · L-Théanine (200mg, 14+) · Magnésium (tous âges, dose adaptée)
⚡ FATIGUE / ÉNERGIE : Ginseng (200mg, adulte 18+) · Maca (1500mg, adulte 18+) · B12 méthylcobalamine (tous âges si carence confirmée) · Vitamine D3+K2 (tous âges, dose selon âge) · Fer bisglycinate (si carence confirmée, tous âges)
🧠 CONCENTRATION : Lion's Mane (1g, 18+) · Bacopa (300mg, 18+) · Ginkgo (120mg, 18+, CI anticoagulants) · Oméga-3 DHA (dès l'enfance, dose adaptée)
🫁 DIGESTION : Gingembre (tisane ou 500mg, dès 12 ans) · Fenouil (tisane, tous âges) · Probiotiques (tous âges, souche adaptée) · Curcuma (adulte, CI anticoagulants hautes doses)
🔥 INFLAMMATION : Curcuma+pipérine (adulte, CI anticoagulants) · Oméga-3 (tous âges) · Boswellia (adulte 18+) · Gingembre (dès 12 ans)
💪 IMMUNITÉ : Vitamine C (tous âges, dose adaptée) · Zinc (tous âges, dose adaptée) · Vitamine D3 (tous âges) · Échinacée (adulte, max 10j, CI maladies auto-immunes) · Propolis (dès 6 ans)
🩸 HORMONES / CYCLE : Gattilier (adulte, CI contraceptifs hormonaux, grossesse) · Maca (adulte 18+) · Magnésium + B6 (dès 16 ans)
🌿 PEAU / CHEVEUX : Biotine (adulte) · Zinc (tous âges) · Oméga-3 (tous âges) · Ortie (tisane, dès 12 ans)
🫀 CARDIOVASCULAIRE : CoQ10 (adulte 18+) · Oméga-3 (tous âges) · Aubépine (adulte, CI avec cardiotoniques)

⚠️ SÉCURITÉ ABSOLUE — vérifie AVANT chaque recommandation :

ÂGE :
- < 12 ans → UNIQUEMENT : vitamine D3, oméga-3, probiotiques, zinc, vitamine C (doses pédiatriques). Rien d'autre sans avis médical.
- 12-17 ans → Autorisés : magnésium, L-théanine, mélatonine (max 0.25mg), gingembre, fenouil, mélisse tisane, vitamine C/D/zinc. INTERDITS : ashwagandha, rhodiola, ginseng, maca, ginkgo, valériane gélule, tous les adaptogens forts.
- 18+ → Base complète, toujours croiser avec conditions et médicaments.
- 65+ → Réduire doses de 30%, prudence sédatifs (valériane), anticoagulants (ginkgo, oméga-3 >2g).

CONDITIONS MÉDICALES — contre-indications critiques :
- Anticoagulants (Warfarine, Xarelto...) → CI : ginkgo, oméga-3 >2g, ail concentré, curcuma hautes doses, vitamine E haute dose
- Antidépresseurs ISRS/IMAO → CI : millepertuis (interaction grave), 5-HTP, safran hautes doses
- Thyroïde (hypo/hyper) → CI : ashwagandha (interfère TSH), iode concentré
- Diabète / hypoglycémiants → Prudence : berbérine, cannelle concentrée, gymnema
- Épilepsie → CI : ginkgo, huile d'onagre
- Maladies auto-immunes (lupus, SEP, polyarthrite...) → CI : échinacée, sureau, tout immuno-stimulant
- Cancers hormono-dépendants → CI : phytoestrogènes (trèfle rouge, soja concentré), gattilier
- Insuffisance rénale → CI : vitamine C >500mg/j, créatine, herbes néphrotoxiques
- Insuffisance hépatique → CI : kava, valériane hautes doses, herbes hépatotoxiques
- Grossesse/allaitement → CI quasi-totale sauf : vitamine D, folates, fer si carence, oméga-3. Signale TOUJOURS de consulter.

RÈGLE PLANTES — quand et comment proposer :
- Vérifie l'âge EN PREMIER — si < 18 ans, liste restreinte uniquement
- Croise avec toutes les conditions/médicaments connus du profil
- Si doute sur interaction → ne recommande pas et dis-le clairement
- Mentionne TOUJOURS : dosage adapté à l'âge · moment de prise · forme galénique
- Max 3 alternatives à la fois — pas de liste à rallonge
- Symptôme grave ou persistant → oriente vers médecin en priorité
- Ne propose plantes QUE si pertinent — jamais de façon forcée

RÈGLES DE RÉPONSE — STYLE COURT ET DYNAMIQUE (règle n°1, non négociable) :
- PERSONNE ne lit les longs textes. Réponse par défaut : **2 phrases COURTES maximum**, énergiques, qui donnent envie d'agir. UNE seule idée par réponse — si tu en as deux, garde la plus utile et propose l'autre dans les choix rapides.
- JAMAIS plus de 5 lignes d'affilée sans saut de ligne. Aère énormément.
- UNE idée par réponse. Si le sujet est riche : donne l'essentiel + finis par une question courte ("Tu veux que je détaille ?") plutôt que de tout déballer.
- Termine souvent par un mini-défi concret ("Essaie ce soir : ...") ou une question qui relance — jamais par un paragraphe de synthèse.
- Rythme de coach : phrases percutantes, verbes d'action, zéro blabla. Tu MOTIVES, tu n'expliques pas un cours.
- Pas d'intro creuse ("Bien sûr !", "Absolument !", "Bonne question !")
- Si quelqu'un est dans le doute ou stressé, valide BRIÈVEMENT avant de conseiller
- PERSONNALISE avec les DONNÉES : cite explicitement ses chiffres et patterns (« tes 3 dernières nuits font 5h40 en moyenne », « c'est le 3e cycle où tu signales cette douleur jours 24-26 »). C'est ce qui te différencie d'une IA générique — une réponse qui pourrait s'adresser à n'importe qui est une réponse ratée.
- SANTÉ — nommer sans diagnostiquer : tu peux citer des causes possibles, y compris des pathologies (endométriose, carence en fer…), de façon ÉDUCATIVE : « ce pattern fait partie de ceux qu'on explore pour X — seul un médecin peut le confirmer, vas-y avec ces infos ». Tu ne dis JAMAIS « je suspecte que tu as X », « tu as probablement X », ni aucun diagnostic. Quand tu orientes vers un médecin, prépare la consultation : résume les données à montrer.
- Tu parles en français, tu tutoies. Tu es une femme (accords au féminin quand tu parles de TOI, Solenn).
- MAIS JAMAIS d'accord genré sur la personne à qui tu parles. Solenn s'adresse aux hommes comme aux femmes, et tu ne connais pas leur genre : un prénom ne te le dit pas. N'écris donc jamais « tu es fatiguée », « tu es bloquée », « tu dois être épuisée ». Tourne autrement : « tu manques de sommeil », « ça bloque », « ça doit être épuisant ». Un accord au féminin exclut la moitié des gens et se voit immédiatement.
- N'utilise JAMAIS de markdown (pas de **, *, ##, pas de tirets de liste) et JAMAIS d'emoji dans ton texte. Des phrases simples, c'est tout. Si tu as besoin d'une liste ou de structure, utilise le FORMAT 2 JSON — jamais une liste manuscrite.
- INTERDIT de « déballer un résumé » en plusieurs blocs (causes, gestes, signaux…) dans un seul message. Donne UN seul élément, puis propose la suite via les choix rapides (« La suite ? », « Les signes d'alerte ? »). La conversation avance par échanges courts, pas par pavés.
- INTERDIT : "je te sens", "ton énergie", "vibration", "alignement", tout jargon new-age sans substance

FORMAT 1 — RÉSERVATION : quand l'utilisateur veut sortir/réserver/aller quelque part
|||JSON|||
{"type":"booking","emoji":"🍽️","service":"Nom","lieu":"Ville","date":"Ce soir / Demain","heure":"20h00","note":"1 phrase utile max","links":[{"icon":"🗺️","label":"Google Maps","url":"https://www.google.com/maps/search/MOTS+CLES"},{"icon":"🔍","label":"Google","url":"https://www.google.com/search?q=MOTS+CLES"}]}
|||END|||

FORMAT 2 — LISTES génériques : si demande explicite ("idées", "exercices", "programme"...)
|||JSON|||
{"type":"TYPE","intro":"1 phrase max","items":[{"icon":"emoji","title":"Nom court","desc":"1-2 phrases utiles et spécifiques au profil","badge":"Tag","color":"#hex","sub":"Info clé"}],"outro":"1 phrase"}
|||END|||
4-5 items max · Types: meals=#FF6B35 · exercises=#a78bfa · tips=#FF9A3C · plants=#34c759 · routine=#38bdf8

FORMAT PLANTES — dès qu'un problème de santé/bien-être récurrent est mentionné :
|||JSON|||
{"type":"plants","intro":"1 phrase sur pourquoi ces alternatives sont adaptées à ce profil précis","items":[{"icon":"🌿","title":"Nom plante/complément","desc":"Bénéfice principal + pourquoi adapté à CE profil spécifiquement","badge":"Catégorie","color":"#34c759","sub":"Dosage · Moment · Forme"}],"outro":"1 précaution ou conseil d'usage"}
|||END|||
3-4 alternatives max · Toujours ancré dans le profil (age, carences, objectifs, maladies connues)

FORMAT 3 — TOUT LE RESTE : texte pur, 2-3 phrases courtes max, aéré, dynamique, ancré dans le profil — et une question ou un mini-défi pour finir.

INTERACTIVITÉ — OBLIGATOIRE À CHAQUE RÉPONSE : termine par 2-3 réponses rapides que l'utilisateur peut taper d'un doigt, au format EXACT (dernière ligne de ta réponse) :
|||CHOIX|||["Oui, montre-moi","Plus tard","Pourquoi ?"]|||END|||
Règles des choix : max 4 mots chacun, toujours cohérents avec ta dernière phrase (si tu poses une question, ce sont ses réponses possibles ; si tu proposes un défi : « Je le fais » / « Trop dur » / « Autre idée »). C'est ce qui rend la conversation interactive — ne l'oublie JAMAIS.`

  const messagesAPI = [
    { role: 'system', content: systemPrompt },
    ...historique.filter(m => (m.role === 'user' || m.role === 'assistant') && m.content).slice(-14),
    { role: 'user', content: message }
  ]

  try {
    const stream = await groq.chat.completions.create({
      model: (message.length > 60 || /programme|plan |routine|recette|détail|complet|semaine|explique|compare|liste|symptôme|douleur|sommeil|stress|fatigue|anxieux|anxiété|digestion|plante|naturel|complément|vitamine|carence|mal |j'ai|je me sens|j'en peux/i.test(message))
        ? 'openai/gpt-oss-120b'
        : 'openai/gpt-oss-20b',
      messages: messagesAPI,
      temperature: 0.72,
      max_tokens: 1200,
      stream: true,
    })

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content
      if (token) res.write(`data: ${JSON.stringify(token)}\n\n`)
    }
    res.write('data: [DONE]\n\n')
    res.end()

  } catch (err) {
    console.error('Groq chat error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: err.message })
    else res.end()
  }
})

// IA qui analyse et enrichit le profil
app.post('/api/analyser-profil', ownerGuard, async (req, res) => {
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
    model: 'openai/gpt-oss-120b',
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
app.post('/api/tenues', ownerGuard, async (req, res) => {
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
    model: 'openai/gpt-oss-120b',
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
// CE QU'UNE PHOTO DE TENUE NE DOIT PAS MONTRER.
//
// La recherche porte sur des mots de mode, et les banques y rangent aussi du
// boudoir : Jean a recu, pour un look « Casual Cafe », une femme allongee sur
// un lit en nuisette. Rien a voir avec un conseil vestimentaire, et deplace
// dans une app de bien-etre.
//
// On lit la description que la banque fournit et on ecarte. Le filtre est
// volontairement large : rater une photo correcte ne coute rien, en laisser
// passer une deplacee coute la confiance.
const MOTS_ECARTES = [
  'bed', 'bedroom', 'lingerie', 'underwear', 'bra ', 'panties', 'nightgown',
  'sleep', 'nude', 'naked', 'boudoir', 'topless', 'bikini', 'swimsuit',
  'towel', 'bath', 'shower', 'sensual', 'seductive', 'erotic', 'intimate',
  'pillow', 'bedsheet', 'sheets',
]

function photoConvenable(photo) {
  const texte = `${photo?.alt || ''} ${photo?.url || ''}`.toLowerCase()
  return !MOTS_ECARTES.some(m => texte.includes(m))
}

app.get('/api/image', async (req, res) => {
  const lock = req.query.lock != null ? Number(req.query.lock) : 0
  const rawPrompt = req.query.prompt || 'fashion outfit'
  const rawTitre = req.query.titre || ''
  // « woman » etait ecrit en dur dans toutes les requetes : un homme recevait
  // des tenues feminines. On suit le profil, et on ne suppose rien quand il
  // n'est pas renseigne (regle posee par Jean : Solenn s'adresse aux hommes
  // ET aux femmes).
  const sexe = req.query.sexe || 'nsp'
  const QUI = sexe === 'homme' ? 'man ' : sexe === 'femme' ? 'woman ' : ''

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
      return `${QUI}${clothingItems.slice(0,4).join(' ')} ootd full body street style`
    }

    // 2. Fallback sur le titre si imagePrompt trop vague
    const t = (titre || '').toLowerCase()
    if (t.match(/quiet.?luxury|luxe/))       return QUI + 'luxury minimal coat ootd full body street style'
    if (t.match(/streetwear|street/))         return QUI + 'streetwear urban ootd full body street photography'
    if (t.match(/y2k/))                       return QUI + 'Y2K fashion ootd full body trendy aesthetic'
    if (t.match(/office|bureau|slay/))        return QUI + 'blazer power dressing ootd full body street style'
    if (t.match(/athleisure|sport/))          return QUI + 'athleisure sporty ootd full body street style'
    if (t.match(/boho|boheme/))               return QUI + 'bohemian boho ootd full body street style'
    if (t.match(/minimal/))                   return QUI + 'minimalist clean ootd full body street style'
    if (t.match(/casual/))                    return QUI + 'casual chic ootd full body effortless street style'
    if (t.match(/vintage|retro/))             return QUI + 'vintage retro ootd full body fashion'
    if (t.match(/trench|imperméable/))        return QUI + 'trench coat ootd full body rainy street style'
    return QUI + 'fashion ootd full body street style trendy outfit'
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
    // On filtre AVANT de choisir : sinon `lock` designe un rang dans une liste
    // qui contient des photos ecartees, et le meme rang ne rend plus la meme
    // chose d'un appel a l'autre.
    const photos = (response.data.photos || []).filter(photoConvenable)
    const ecartees = (response.data.photos || []).length - photos.length
    if (ecartees) console.log(`🚫 ${ecartees} photo(s) ecartee(s) : contenu deplace`)
    if (photos.length > 0) {
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


// ─── SUPPRESSION DE COMPTE ────────────────────────────────────────────────────
// Obligatoire : RGPD article 17 (droit à l'effacement) et App Store 5.1.1(v),
// qui refuse toute app permettant de créer un compte sans permettre de le
// supprimer. Il n'existait aucun moyen de supprimer ses données (2026-08-12).
// L'ordre compte : on vide les tables AVANT de supprimer le compte
// d'authentification, sinon on perd l'identifiant qui permet de les retrouver.
const TABLES_UTILISATEUR = [
  'user_metrics', 'checkins', 'solenn_chats', 'challenges', 'rapports_hebdo',
  'cycle_periods', 'cycle_symptoms', 'chat_feedback',
  'forum_likes', 'forum_reply_votes', 'forum_reports', 'forum_mentions',
  'forum_replies', 'forum_posts',
  'profils',
]

app.post('/api/supprimer-compte', ownerGuard, async (req, res) => {
  const userId = req.authUser?.id || req.body?.userId
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  if (!supabase) return res.status(500).json({ error: 'base indisponible' })

  const echecs = []

  // ── L'abonnement Stripe AVANT les tables ───────────────────────────────────
  // Sinon l'identifiant d'abonnement disparait avec la ligne profils et plus
  // personne ne peut arreter le prelevement : le compte est efface, la carte
  // continue d'etre debitee 44,99 EUR par an, et l'utilisateur n'a plus ni
  // compte ni ecran pour resilier. Facturer quelqu'un qui a supprime son
  // compte n'est pas defendable (2026-08-14).
  // Un echec ici NE BLOQUE PAS la suppression : le droit a l'effacement prime.
  // Il est signale dans la reponse et journalise pour rattrapage manuel.
  try {
    const { data: prof } = await supabase.from('profils').select('profil').eq('user_id', userId).maybeSingle()
    const subId = prof?.profil?.stripeSubscriptionId
    if (subId && stripe) {
      await stripe.subscriptions.cancel(subId)
      console.log('[Suppression] Abonnement', subId, 'annule pour', userId)
    } else if (prof?.profil?.isPro === true && !subId) {
      echecs.push('stripe: compte Pro sans identifiant d abonnement, resilier a la main')
      console.error('[Suppression] ATTENTION', userId, 'etait Pro sans stripeSubscriptionId')
    }
  } catch (e) {
    echecs.push(`stripe: ${e.message}`)
    console.error('[Suppression] Annulation Stripe echouee pour', userId, '-', e.message)
  }

  for (const table of TABLES_UTILISATEUR) {
    try {
      const { error } = await supabase.from(table).delete().eq('user_id', userId)
      // Une table absente n'est pas un echec : le schema evolue.
      if (error && !/does not exist|schema cache/i.test(error.message || '')) {
        echecs.push(`${table}: ${error.message}`)
      }
    } catch (e) {
      echecs.push(`${table}: ${e.message}`)
    }
  }

  // Le compte d'authentification en dernier.
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) echecs.push(`auth: ${error.message}`)
  } catch (e) {
    echecs.push(`auth: ${e.message}`)
  }

  // On retire aussi son abonnement aux notifications push.
  try { pushSubscriptions.delete(userId) } catch {}

  // Email de confirmation. Envoye AVANT de conclure, mais son echec ne fait
  // jamais echouer la suppression : le droit a l'effacement prime sur l'accuse
  // de reception. L'adresse vient du compte authentifie, pas du corps de la
  // requete, sinon n'importe qui pourrait se faire envoyer cet email.
  const email = req.authUser?.email
  if (email && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Solenn <noreply@meet-solenn.com>',
          to: [email],
          subject: 'Ton compte Solenn a bien été supprimé',
          html: `<p>Bonjour,</p>
            <p>Ton compte Solenn a été supprimé le ${new Date().toLocaleString('fr-FR')}, à ta demande.</p>
            <p><strong>Ce qui a été effacé :</strong> ton profil, tes mesures de santé,
            tes check-ins, tes conversations avec Solenn, ton programme, tes rapports,
            ton suivi de cycle et tes publications du forum.</p>
            <p><strong>Ce que nous conservons :</strong> uniquement les factures liées à
            un éventuel abonnement, que la loi comptable nous oblige à garder dix ans.
            Elles ne contiennent aucune donnée de santé.</p>
            <p>Si tu n'es pas à l'origine de cette demande, écris-nous immédiatement
            à contact@meet-solenn.com.</p>
            <p>Merci d'avoir essayé Solenn.</p>`,
        }),
      })
    } catch (e) {
      console.warn('[Suppression compte] email non envoyé:', e.message)
    }
  }

  if (echecs.length) {
    console.error('[Suppression compte] échecs partiels:', echecs)
    return res.status(500).json({ error: 'suppression incomplète', details: echecs })
  }
  console.log('[Suppression compte] compte supprimé:', userId)
  res.json({ ok: true })
})

// ── Routine du jour ──────────────────────────────────────────────────────────
app.post('/api/routine', ownerGuard, async (req, res) => {
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
      model: 'openai/gpt-oss-120b',
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
app.post('/api/health-insights', ownerGuard, async (req, res) => {
  const { metriques, profil } = req.body
  const prompt = `Tu es Solenn, coach santé. Analyse les métriques de ${profil.nom} et donne 3 insights personnalisés.
Métriques : pas=${metriques.pas || 0}, sommeil=${metriques.sommeil || 0}h, eau=${metriques.eau || 0} verres, humeur=${metriques.humeur || 0}/5, FC=${metriques.fc || 0}bpm, poids=${metriques.poids || 0}kg.
Objectifs : ${profil.objectifs?.join(', ') || 'non renseignés'}.

Réponds en JSON : { "insights": [{ "emoji": "emoji", "titre": "titre court", "message": "analyse personnalisée 2-3 phrases", "type": "positif|attention|conseil" }] }
Maximum 3 insights, pertinents et actionnables.`

  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
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
app.post('/api/herbal', ownerGuard, async (req, res) => {
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
      model: 'openai/gpt-oss-120b',
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

// ── Sauvegarder subscription push (mémoire + base, survit aux redémarrages) ──
app.post('/api/push-subscribe', ownerGuard, async (req, res) => {
  const { subscription, userId, profil, streak, score } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Subscription invalide' })
  const key = userId || subscription.endpoint
  const entry = {
    ...subscription,
    _meta: { profil, streak: streak || 0, score: score || 0, subscribedAt: Date.now() }
  }
  pushSubscriptions.set(key, entry)
  if (supabase && userId) {
    try {
      await supabase.from('push_subscriptions').upsert({
        user_id: userId, subscription, meta: entry._meta, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } catch (e) { console.warn('[Push] Persistance subscription échouée:', e.message) }
  }
  console.log(`Push subscription sauvegardee (total: ${pushSubscriptions.size})`)
  res.json({ ok: true })
})

// ── Supprimer subscription ────────────────────────────────────────────────────
app.post('/api/push-unsubscribe', ownerGuard, async (req, res) => {
  const { userId, endpoint } = req.body
  pushSubscriptions.delete(userId || endpoint)
  // Filet : si l'identifiant manque ou ne correspond a rien, on retire par
  // endpoint. Sans ca, une ligne orpheline continue de recevoir des rappels
  // que plus personne ne peut couper (2026-08-14).
  if (endpoint) {
    for (const [cle, entree] of pushSubscriptions) {
      if (entree?.endpoint === endpoint) pushSubscriptions.delete(cle)
    }
  }
  if (supabase && userId) {
    try { await supabase.from('push_subscriptions').delete().eq('user_id', userId) } catch { /* ignore */ }
  }
  if (supabase && endpoint) {
    try { await supabase.from('push_subscriptions').delete().eq('subscription->>endpoint', endpoint) } catch { /* ignore */ }
  }
  res.json({ ok: true })
})

// ═══ NOTIFICATIONS NATIVES (iOS / Android) ═══════════════════════════════════
// Les notifications web ne marchent pas dans une app publiee sur l'App Store :
// iOS ne les autorise que dans un site ajoute a l'ecran d'accueil. Une vraie
// app doit passer par APNs. On relaie par Firebase, qui parle a Apple ET a
// Google, ce qui evite de gerer deux systemes (Jean, 2026-08-14).
//
// Configuration attendue sur Render :
//   FIREBASE_SERVICE_ACCOUNT  le JSON du compte de service, en une seule ligne
// Sans elle, l'enregistrement des jetons fonctionne mais aucun envoi ne part,
// et un avertissement est journalise plutot qu'une erreur silencieuse.

let _jetonFirebase = null // { valeur, expire }

async function jetonAccesFirebase() {
  const brut = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!brut) return null
  if (_jetonFirebase && _jetonFirebase.expire > Date.now() + 60_000) return _jetonFirebase.valeur
  try {
    const compte = JSON.parse(brut)
    const maintenant = Math.floor(Date.now() / 1000)
    const entete = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const charge = Buffer.from(JSON.stringify({
      iss: compte.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: maintenant,
      exp: maintenant + 3600,
    })).toString('base64url')
    const signature = crypto.createSign('RSA-SHA256')
      .update(`${entete}.${charge}`)
      .sign(compte.private_key, 'base64url')
    const rep = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${entete}.${charge}.${signature}`,
      }),
    })
    const d = await rep.json()
    if (!d.access_token) { console.error('[Push natif] jeton Firebase refuse :', JSON.stringify(d).slice(0, 200)); return null }
    _jetonFirebase = { valeur: d.access_token, expire: Date.now() + (d.expires_in || 3600) * 1000 }
    return _jetonFirebase.valeur
  } catch (e) {
    console.error('[Push natif] FIREBASE_SERVICE_ACCOUNT illisible :', e.message)
    return null
  }
}

/** Envoie une notification native. Retourne true si Firebase l'a acceptee. */
async function envoyerNatif(token, { title, body, url }) {
  const acces = await jetonAccesFirebase()
  if (!acces) return false
  let projet = null
  try { projet = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).project_id } catch {}
  if (!projet) return false
  try {
    const rep = await fetch(`https://fcm.googleapis.com/v1/projects/${projet}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: url ? { url } : {},
          // Sans cette section, iOS n'affiche RIEN quand l'app est fermee.
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          android: { priority: 'high', notification: { sound: 'default' } },
        },
      }),
    })
    if (rep.ok) return true
    const err = await rep.text()
    // 404 UNREGISTERED = l'app a ete desinstallee, le jeton est mort.
    if (rep.status === 404 && supabase) {
      await supabase.from('push_tokens').delete().eq('token', token)
      console.log('[Push natif] jeton mort supprime')
    } else {
      console.error('[Push natif] envoi refuse', rep.status, err.slice(0, 200))
    }
    return false
  } catch (e) {
    console.error('[Push natif] envoi impossible :', e.message)
    return false
  }
}

/** Envoie a TOUS les appareils natifs d'un utilisateur. Retourne le nombre d'envois reussis. */
async function envoyerNatifAUtilisateur(userId, contenu) {
  if (!supabase) return 0
  try {
    const { data } = await supabase.from('push_tokens').select('token').eq('user_id', userId)
    if (!data?.length) return 0
    const resultats = await Promise.all(data.map(r => envoyerNatif(r.token, contenu)))
    return resultats.filter(Boolean).length
  } catch { return 0 }
}

// POST /api/push-native-subscribe → enregistre le jeton d'un appareil
// Un compte peut avoir plusieurs appareils : on empile, on n'ecrase pas.
app.post('/api/push-native-subscribe', ownerGuard, async (req, res) => {
  const userId = req.authUser?.id || req.body?.userId
  const { token, platform } = req.body || {}
  if (!userId || !token) return res.status(400).json({ erreur: 'userId et token requis' })
  if (!['ios', 'android'].includes(platform)) return res.status(400).json({ erreur: 'plateforme inconnue' })
  if (!supabase) return res.status(500).json({ erreur: 'base indisponible' })
  try {
    // On n'ecrit QUE les colonnes indispensables. last_seen a une valeur par
    // defaut en base et se met a jour juste apres, separement : nommer une
    // colonne absente du cache de schema fait rejeter TOUTE la requete par
    // PostgREST, et l'enregistrement echouerait entierement pour une donnee
    // purement informative. C'est le piege qui a fait qu'aucun profil
    // n'arrivait en base pendant des semaines (2026-08-14).
    const { error } = await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform },
      { onConflict: 'user_id,token' },
    )
    if (error) throw new Error(error.message)
    // Confort, jamais bloquant.
    supabase.from('push_tokens').update({ last_seen: new Date().toISOString() })
      .eq('user_id', userId).eq('token', token).then(() => {}, () => {})
    res.json({ ok: true, envoiConfigure: !!process.env.FIREBASE_SERVICE_ACCOUNT })
  } catch (e) {
    console.error('[Push natif] enregistrement echoue :', e.message)
    res.status(500).json({ erreur: e.message })
  }
})

// POST /api/push-native-unsubscribe → retire le jeton de cet appareil
app.post('/api/push-native-unsubscribe', ownerGuard, async (req, res) => {
  const userId = req.authUser?.id || req.body?.userId
  const { token } = req.body || {}
  if (!supabase) return res.json({ ok: true })
  try {
    const q = supabase.from('push_tokens').delete()
    if (token) await q.eq('token', token)
    else if (userId) await q.eq('user_id', userId)
  } catch { /* le droit de couper prime sur l'accuse */ }
  res.json({ ok: true })
})

// ── Envoyer notif a un utilisateur ───────────────────────────────────────────
app.post('/api/push-send', adminGuard, async (req, res) => {
  const { userId, title, body, url, tag } = req.body
  // Les appareils natifs d'abord : sur iPhone, c'est le SEUL canal qui marche
  // dans une app installee depuis l'App Store.
  const natifs = await envoyerNatifAUtilisateur(userId, { title, body, url })
  const entry = pushSubscriptions.get(userId)
  if (!entry) return res.json({ ok: natifs > 0, natifs, web: 0 })
  try {
    const { _meta, ...sub } = entry
    await webpush.sendNotification(sub, JSON.stringify({ title, body, url: url || '/', tag }))
    res.json({ ok: true })
  } catch (e) {
    if (e.statusCode === 410) pushSubscriptions.delete(userId)
    res.status(500).json({ error: e.message })
  }
})

// ── Notif personnalisée IA pour un utilisateur ────────────────────────────────
app.post('/api/smart-notif', adminGuard, async (req, res) => {
  const { userId } = req.body
  const entry = pushSubscriptions.get(userId)
  if (!entry) return res.status(404).json({ error: 'Subscription introuvable' })

  const meta = entry._meta || {}
  const nom = meta.profil?.nom || 'toi'
  const objectif = meta.profil?.objectifs?.[0] || 'bien-être'
  const streak = meta.streak || 0
  const score  = meta.score  || 0
  const hour   = new Date().getHours()

  const contextDesc = [
    `utilisateur : ${nom}`,
    `objectif principal : ${objectif}`,
    streak > 0 ? `streak actif : ${streak} jours` : 'pas encore de streak',
    score > 0  ? `score d'hier : ${score}/100`     : 'pas encore de données',
    `heure : ${hour}h`,
  ].join(', ')

  try {
    const resp = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role:'system', content:'Tu génères une notification push courte et personnalisée pour une app de coaching santé. 1 ligne max (60 chars). Chaleureux, concret, motivant. Pas de guillemets.' },
        { role:'user',   content: `Contexte : ${contextDesc}. Génère le corps de la notification.` }
      ],
      max_tokens: 60, temperature: 0.75,
    })
    const body = resp.choices[0].message.content.trim().replace(/^"|"$/g, '')
    // Extraction sub sans _meta pour webpush
    const { _meta, ...sub } = entry
    await webpush.sendNotification(sub, JSON.stringify({ title: 'Solenn', body, url: '/', tag: 'smart' }))
    res.json({ ok: true, body })
  } catch (e) {
    if (e.statusCode === 410) pushSubscriptions.delete(userId)
    res.status(500).json({ error: e.message })
  }
})

// ── Broadcast toutes les subscriptions ───────────────────────────────────────
app.post('/api/push-broadcast', adminGuard, async (req, res) => {
  const { title, body, url, tag } = req.body
  const payload = JSON.stringify({ title, body, url: url || '/', tag })
  let ok = 0, fail = 0
  for (const [id, entry] of pushSubscriptions) {
    try { const { _meta, ...sub } = entry; await webpush.sendNotification(sub, payload); ok++ }
    catch (e) { if (e.statusCode === 410) pushSubscriptions.delete(id); fail++ }
  }
  res.json({ ok, fail, total: pushSubscriptions.size })
})

// ── Stripe Checkout ──────────────────────────────────────────────────────────
// Deux plans : annuel (offre principale, ~3,75 €/mois) et mensuel (repli).
const STRIPE_PLANS = {
  annual:  { unit_amount: 4499, interval: 'year',  label: 'Solenn Pro — Annuel' },
  monthly: { unit_amount: 799,  interval: 'month', label: 'Solenn Pro — Mensuel' },
}

app.post('/api/create-checkout', async (req, res) => {
  try {
    const origin = req.headers.origin || `http://${req.headers.host}` || 'http://152.228.131.218'
    const planKey = STRIPE_PLANS[req.body.plan] ? req.body.plan : 'annual'
    const plan = STRIPE_PLANS[planKey]
    const session = await stripe.checkout.sessions.create({
      // Pas de payment_method_types : Stripe propose automatiquement tous les
      // moyens activés dans le Dashboard (carte, Apple Pay, Google Pay, PayPal,
      // Link…) selon l'appareil du visiteur. Forcer ['card'] les masquait.
      mode: 'subscription',
      locale: 'fr',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: plan.label,
            description: 'Coach IA illimité · Analyses personnalisées · Toutes les fonctionnalités',
            images: [],
          },
          unit_amount: plan.unit_amount,
          recurring: { interval: plan.interval },
        },
        quantity: 1,
      }],
      success_url: `${origin}/?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/?subscribed=cancel`,
      // Codes promo (influence) : les codes créés dans le Dashboard Stripe
      // sont saisissables directement sur la page de paiement
      allow_promotion_codes: true,
      metadata: { userId: req.body.userId || 'anonymous', plan: planKey, ref: req.body.ref || null },
    })
    res.json({ url: session.url })
  } catch (e) {
    console.error('Stripe error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── Vérifier statut abonnement ───────────────────────────────────────────────
// La session doit appartenir au compte qui la presente. Avant, la route
// acceptait n'importe quel identifiant de session, sans authentification ni
// controle de proprietaire : un identifiant reste sur un appareil partage
// suffisait a se declarer Pro sur un autre compte (2026-08-14).
app.get('/api/check-subscription', ownerGuard, async (req, res) => {
  const { sessionId, userId } = req.query
  if (!sessionId) return res.json({ active: false })
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const proprio = session.metadata?.userId
    if (userId && proprio && proprio !== 'anonymous' && String(proprio) !== String(userId)) {
      console.warn('[check-subscription] session', sessionId, 'reclamee par', userId, '- appartient a', proprio)
      return res.json({ active: false })
    }
    res.json({ active: session.payment_status === 'paid' || session.status === 'complete' })
  } catch {
    res.json({ active: false })
  }
})

// ─── ABONNEMENT — page de gestion dans Solenn ────────────────────────────────
// Jean ne voulait pas renvoyer l'abonne vers une page Stripe : la gestion se
// fait dans l'app, dans sa palette (2026-08-14). Le portail Stripe reste
// accessible en secondaire, uniquement pour le changement de carte : saisir un
// moyen de paiement ne doit jamais transiter par notre interface.

async function abonnementDe(userId) {
  const { data } = await supabase.from('profils').select('profil').eq('user_id', userId).maybeSingle()
  const prof = data?.profil || {}
  const subId = prof.stripeSubscriptionId
  if (!subId || !stripe) return { prof, sub: null }
  const sub = await stripe.subscriptions.retrieve(subId, { expand: ['default_payment_method'] })
  return { prof, sub }
}

function resumeAbonnement(sub) {
  const item = sub.items?.data?.[0]
  const prix = item?.price
  const carte = sub.default_payment_method?.card
  return {
    statut: sub.status,
    montant: prix?.unit_amount != null ? prix.unit_amount / 100 : null,
    devise: (prix?.currency || 'eur').toUpperCase(),
    periode: prix?.recurring?.interval === 'year' ? 'an' : 'mois',
    finPeriode: sub.current_period_end ? sub.current_period_end * 1000 : null,
    resilie: !!sub.cancel_at_period_end,
    carte: carte ? { marque: carte.brand, fin: carte.last4 } : null,
  }
}

// GET /api/abonnement?userId=... → l'etat reel, lu chez Stripe
app.get('/api/abonnement', ownerGuard, async (req, res) => {
  const userId = req.query.userId || req.authUser?.id
  if (!userId || !supabase) return res.status(400).json({ erreur: 'userId requis' })
  try {
    const { prof, sub } = await abonnementDe(userId)
    if (!sub) return res.json({ sansAbonnement: true, proManuel: prof.proManuel === true, isPro: prof.isPro === true })
    res.json({ abonnement: resumeAbonnement(sub) })
  } catch (e) {
    console.error('[abonnement]', e.message)
    res.status(500).json({ erreur: e.message })
  }
})

// POST /api/abonnement/annuler → resiliation A LA FIN DE LA PERIODE PAYEE.
// Jamais immediate : l'annee est deja reglee, la couper prive l'abonne de ce
// qu'il a paye et ouvrirait un droit a remboursement.
app.post('/api/abonnement/annuler', ownerGuard, async (req, res) => {
  const userId = req.body?.userId || req.authUser?.id
  if (!userId || !supabase) return res.status(400).json({ erreur: 'userId requis' })
  try {
    const { sub } = await abonnementDe(userId)
    if (!sub) return res.status(404).json({ sansAbonnement: true })
    const maj = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true })
    console.log('[abonnement] resiliation programmee pour', userId)
    res.json({ abonnement: resumeAbonnement(maj) })
  } catch (e) {
    console.error('[abonnement/annuler]', e.message)
    res.status(500).json({ erreur: e.message })
  }
})

// POST /api/abonnement/reprendre → on annule l'annulation, tant que la periode
// payee court encore.
app.post('/api/abonnement/reprendre', ownerGuard, async (req, res) => {
  const userId = req.body?.userId || req.authUser?.id
  if (!userId || !supabase) return res.status(400).json({ erreur: 'userId requis' })
  try {
    const { sub } = await abonnementDe(userId)
    if (!sub) return res.status(404).json({ sansAbonnement: true })
    const maj = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false })
    res.json({ abonnement: resumeAbonnement(maj) })
  } catch (e) {
    console.error('[abonnement/reprendre]', e.message)
    res.status(500).json({ erreur: e.message })
  }
})

// POST /api/portail-client → ouvre le portail d'abonnement Stripe
// Un abonne n'avait AUCUN moyen de resilier depuis l'app : « Membre Pro »
// etait un simple encart non cliquable. Or depuis le 1er juin 2023, l'article
// L215-1-1 du code de la consommation impose, pour tout abonnement souscrit
// en ligne, une resiliation en ligne « facile et directe ». Les regles des
// magasins d'applications l'exigent aussi. Le portail Stripe couvre la
// resiliation, le changement de carte et les factures (2026-08-14).
app.post('/api/portail-client', ownerGuard, async (req, res) => {
  const userId = req.authUser?.id || req.body?.userId
  if (!userId || !supabase) return res.status(400).json({ erreur: 'userId requis' })
  try {
    const { data } = await supabase.from('profils').select('profil').eq('user_id', userId).maybeSingle()
    const customerId = data?.profil?.stripeCustomerId
    // Acces Pro accorde a la main (proManuel) ou offert : il n'y a pas de
    // client Stripe, donc rien a resilier. L'app doit le dire clairement au
    // lieu de renvoyer sur le support (Jean, 2026-08-14).
    if (!customerId) return res.status(404).json({ sansAbonnement: true, erreur: 'aucun abonnement Stripe rattache a ce compte' })
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: req.body?.retour || 'https://meet-solenn.com/',
      locale: 'fr',
    })
    res.json({ url: session.url })
  } catch (e) {
    // Le portail doit etre active une fois dans le Dashboard Stripe :
    // Parametres > Facturation > Portail client. Sans ca, Stripe repond une
    // erreur de configuration — on la remonte telle quelle pour la diagnostiquer.
    console.error('[portail-client]', e.message)
    res.status(500).json({ erreur: e.message })
  }
})

// GET /api/verify-pro?userId=... → vérifie le statut Pro dans profils
app.get('/api/verify-pro', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId || !supabase) return res.json({ isPro: false })
  try {
    const { data } = await supabase.from('profils').select('profil').eq('user_id', userId).single()
    res.json({ isPro: data?.profil?.isPro === true, proSince: data?.profil?.proSince || null })
  } catch {
    res.json({ isPro: false })
  }
})

// ── Dashboard rétention (admin) ──────────────────────────────────────────────
// Les 3 métriques de survie identifiées par l'étude de marché : complétion du
// challenge 21j, actifs J7/J30, premier renouvellement (objectif ≥ 67 %).
app.get('/api/admin/retention', adminGuard, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase non configuré' })
  try {
    const now = Date.now()
    const d7  = new Date(now - 7  * 864e5).toISOString().split('T')[0]
    const d30 = new Date(now - 30 * 864e5).toISOString().split('T')[0]

    const { count: totalUsers } = await supabase.from('profils').select('*', { count: 'exact', head: true })

    // Actifs = au moins une métrique enregistrée sur la période
    const { data: rows7 }  = await supabase.from('user_metrics').select('user_id').gte('date', d7)
    const { data: rows30 } = await supabase.from('user_metrics').select('user_id').gte('date', d30)
    const actifsJ7  = new Set((rows7  || []).map(r => r.user_id)).size
    const actifsJ30 = new Set((rows30 || []).map(r => r.user_id)).size

    const { data: challenges } = await supabase.from('challenges').select('user_id, progression, date_debut, actif')
    let chTotal = 0, chTermines = 0, chEnCours = 0, completionCumulee = 0
    for (const c of challenges || []) {
      chTotal++
      const faits = (c.progression || []).filter(Boolean).length
      if (faits >= 21) chTermines++
      if (c.actif) {
        chEnCours++
        const joursEcoules = Math.min(Math.max(Math.floor((now - new Date(c.date_debut).getTime()) / 864e5) + 1, 1), 21)
        completionCumulee += faits / joursEcoules
      }
    }

    // Premier renouvellement : parmi les abonnements ayant dépassé leur 1re
    // échéance, part toujours active (données Stripe, 100 derniers)
    let premierRenouvellement = null
    try {
      const subs = await stripe.subscriptions.list({ status: 'all', limit: 100 })
      let eligibles = 0, renouveles = 0
      for (const s of subs.data) {
        const periodeMs = (s.items?.data?.[0]?.plan?.interval === 'year' ? 366 : 32) * 864e5
        if (now - s.created * 1000 > periodeMs) {
          eligibles++
          if (s.status === 'active') renouveles++
        }
      }
      premierRenouvellement = { eligibles, renouveles, taux: eligibles ? Math.round(100 * renouveles / eligibles) : null }
    } catch (e) {
      premierRenouvellement = { error: e.message }
    }

    let prosActifs = 0
    try {
      const { count } = await supabase.from('profils').select('*', { count: 'exact', head: true }).contains('profil', { isPro: true })
      prosActifs = count || 0
    } catch { /* filtre jsonb indisponible → 0 */ }

    // Attribution influence : inscriptions par code créateur (?ref=CODE)
    const refSources = {}
    try {
      const { data: allProf } = await supabase.from('profils').select('profil')
      for (const r of allProf || []) {
        const s = r.profil?.refSource
        if (s) refSources[s] = (refSources[s] || 0) + 1
      }
    } catch { /* non bloquant */ }

    res.json({
      generatedAt: new Date().toISOString(),
      utilisateurs: { total: totalUsers ?? null, actifsJ7, actifsJ30 },
      challenge21j: {
        total: chTotal, enCours: chEnCours, termines: chTermines,
        tauxCompletionMoyen: chEnCours ? Math.round(100 * (completionCumulee / chEnCours)) : null,
      },
      abonnements: { prosActifs, premierRenouvellement },
      refSources,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Message matinal proactif (généré par l'agent morning-brief) ──────────────
app.get('/api/morning-message', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId || !supabase) return res.json({ message: null })
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('morning_messages')
      .select('message, date, adaptations').eq('user_id', userId).eq('date', today).maybeSingle()
    res.json({ message: data?.message || null, date: data?.date || null, adaptations: data?.adaptations || [] })
  } catch {
    res.json({ message: null })
  }
})

// ── Analyse photo de repas (Groq vision) ─────────────────────────────────────
// La « nutrition intuitive » de la landing, pour de vrai : photo → analyse →
// mémoire nutritionnelle (table repas) que le brief matinal et les insights
// peuvent relire. Remplace la saisie manuelle, corvée n°1 du wellness.
app.post('/api/analyser-repas', ownerGuard, async (req, res) => {
  const { userId, image, moment } = req.body
  if (!userId || !image) return res.status(400).json({ error: 'userId et image requis' })
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'image doit être un data URL' })
  }
  if (image.length > 6_000_000) return res.status(413).json({ error: 'image trop lourde (max ~4 Mo)' })
  // Même quota que le chat : essai (TRIAL_DAYS) et Pro illimités, sinon 5/jour
  const quota = await consumeQuota(req.authUser)
  if (!quota.ok) return res.status(429).json({ error: 'quota_atteint', limit: quota.limit })
  try {
    let prenom = ''
    try {
      const { data: prof } = await supabase.from('profils').select('profil').eq('user_id', userId).maybeSingle()
      prenom = prof?.profil?.nom || ''
    } catch {}

    const completion = await groq.chat.completions.create({
      // Scout déprécié par Groq (17/06/2026) — Maverick est le modèle vision restant
      model: 'qwen/qwen3.6-27b',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Tu es Solenn, coach nutrition bienveillante (tutoiement, jamais culpabilisante, pas d'emoji). Analyse cette photo de repas${prenom ? ` de ${prenom}` : ''}. Réponds UNIQUEMENT en JSON :
{"plats": ["..."], "calories": 000, "proteines_g": 0, "glucides_g": 0, "lipides_g": 0, "qualite": 1-5, "points_forts": "...", "conseil": "...", "resume": "2-3 phrases chaleureuses de Solenn : ce qu'elle voit, un point positif sincère, UN conseil concret pour la suite de la journée"}
Estimations approximatives assumées. Si la photo n'est pas un repas, {"erreur": "description de ce que tu vois"}.`,
          },
          { type: 'image_url', image_url: { url: image } },
        ],
      }],
      max_tokens: 600,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    })

    let analyse
    try { analyse = JSON.parse(completion.choices[0].message.content) } catch {
      return res.status(502).json({ error: 'analyse illisible, réessaie' })
    }
    if (analyse.erreur) return res.json({ ok: false, message: `Hmm, je ne vois pas bien de repas sur cette photo (${analyse.erreur}). Tu peux réessayer avec l'assiette bien visible ?` })

    const resume = analyse.resume || 'Repas noté !'
    // Mémoire nutritionnelle — non bloquant si la table n'existe pas encore
    try {
      await supabase.from('repas').insert({
        user_id: userId,
        moment: moment || null,
        analyse: { plats: analyse.plats, calories: analyse.calories, proteines_g: analyse.proteines_g, glucides_g: analyse.glucides_g, lipides_g: analyse.lipides_g, qualite: analyse.qualite, conseil: analyse.conseil },
        resume,
      })
    } catch (e) { console.warn('[Repas] insert:', e.message) }

    res.json({ ok: true, message: resume, analyse })
  } catch (e) {
    console.error('[Repas] erreur:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── Insights longitudinaux de l'utilisateur ──────────────────────────────────
app.get('/api/insights', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId || !supabase) return res.json({ insights: [] })
  try {
    const { data } = await supabase.from('user_insights')
      .select('type, insight, data, computed_at')
      .eq('user_id', userId).order('computed_at', { ascending: false }).limit(6)
    res.json({ insights: data || [] })
  } catch {
    res.json({ insights: [] })
  }
})

// ── Tokens push natifs (iOS/Android) ─────────────────────────────────────────
// Le client (useCapacitor.js) envoie déjà son token FCM/APNs ici — la route
// n'existait pas (404 silencieux). On persiste le token en base pour le jour
// où l'envoi FCM/APNs sera branché ; en attendant ça évite l'erreur.
app.post('/api/push-native-subscribe', ownerGuard, async (req, res) => {
  const { userId, token, platform } = req.body
  if (!userId || !token) return res.status(400).json({ error: 'userId et token requis' })
  try {
    if (supabase) {
      await supabase.from('push_tokens').upsert(
        { user_id: userId, token, platform: platform || 'unknown', updated_at: new Date().toISOString() },
        { onConflict: 'user_id,token' }
      )
    }
    res.json({ ok: true })
  } catch (e) {
    // Table pas encore créée → non bloquant
    res.json({ ok: false, note: e.message })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// ENDPOINTS SOUS-AGENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Status de tous les agents ────────────────────────────────────────────────
app.get('/api/agents-status', (req, res) => {
  res.json({
    agents: getAgentsStatus(),
    subscriptions: pushSubscriptions.size,
    routinesEnCache: [...pushSubscriptions.keys()].filter(id => !!getRoutineCache(id)).length,
  })
})

// ── Déclencher un agent manuellement (debug/admin) ───────────────────────────
if (!process.env.AGENTS_TRIGGER_KEY) {
  console.warn('[AgentsTrigger] AGENTS_TRIGGER_KEY non défini — /api/agents-trigger accessible sans authentification')
}
app.post('/api/agents-trigger', adminGuard, async (req, res) => {
  const { agent, moment } = req.body
  if (!agent) return res.status(400).json({ error: 'agent requis' })
  try {
    const result = await triggerAgent(agent, pushSubscriptions, { moment })
    res.json({ ok: true, agent, result })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Routine pré-générée depuis le cache ──────────────────────────────────────
app.get('/api/routine-cache', ownerGuard, (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  const entry = routineCache.get(userId)
  const routine = (entry && Date.now() < entry.expiresAt) ? entry.routine : null
  if (routine) {
    res.json({ cached: true, routine, generatedAt: entry.generatedAt })
  } else {
    res.json({ cached: false })
  }
})

// ── Forcer la régénération de la routine d'un user ───────────────────────────
app.post('/api/routine-regenerer', ownerGuard, async (req, res) => {
  const { userId, profil: profilBody, metriques: metriquesBody } = req.body
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    // Si l'user n'est pas dans pushSubscriptions, on injecte son profil à la volée
    if (profilBody && !pushSubscriptions.has(userId)) {
      pushSubscriptions.set(userId, {
        endpoint: null, keys: null,
        _meta: { profil: profilBody, metriques: metriquesBody || {} },
      })
    } else if (profilBody && pushSubscriptions.has(userId)) {
      // Mettre à jour le profil dans le meta existant
      const entry = pushSubscriptions.get(userId)
      entry._meta = { ...(entry._meta || {}), profil: profilBody, metriques: metriquesBody || entry._meta?.metriques || {} }
    }
    const routine = await regenererPourUser(userId, pushSubscriptions)
    if (!routine) return res.status(404).json({ error: "Je n'ai pas réussi à générer ta routine. Réessaie dans un instant." })
    res.json({ ok: true, routine, generatedAt: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Rapport hebdomadaire (cache → Supabase → vide) — route déplacée plus bas

// ── Mise à jour des métriques (alimente le monitoring agent) ─────────────────
app.post('/api/metriques-update', ownerGuard, (req, res) => {
  const { userId, metriques } = req.body
  if (!userId || !metriques) return res.status(400).json({ error: 'userId et metriques requis' })
  updateMetriques(pushSubscriptions, userId, metriques)
  res.json({ ok: true })
})

// (catch-all SPA déplacé à la fin du fichier — après toutes les routes /api/)

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIQUE CONVERSATIONS (solenn_chats)
// Table Supabase : user_id uuid, session_date text, messages jsonb, updated_at
// ─────────────────────────────────────────────────────────────────────────────

// Sauvegarder les messages du jour
app.post('/api/chat-save', ownerGuard, async (req, res) => {
  const { userId, messages } = req.body
  if (!userId || !messages) return res.status(400).json({ error: 'userId et messages requis' })
  try {
    const sessionDate = new Date().toDateString()
    const { error } = await supabase
      .from('solenn_chats')
      .upsert(
        { user_id: userId, session_date: sessionDate, messages, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,session_date' }
      )
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Charger l'historique des sessions
app.get('/api/chat-history', ownerGuard, async (req, res) => {
  const { userId, limit = 20 } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    const { data, error } = await supabase
      .from('solenn_chats')
      .select('session_date, messages, updated_at')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(parseInt(limit))
    if (error) return res.status(500).json({ error: error.message })
    res.json({ sessions: data || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Charger une session spécifique
app.get('/api/chat-session', ownerGuard, async (req, res) => {
  const { userId, date } = req.query
  if (!userId || !date) return res.status(400).json({ error: 'userId et date requis' })
  try {
    const { data, error } = await supabase
      .from('solenn_chats')
      .select('messages')
      .eq('user_id', userId)
      .eq('session_date', date)
      .single()
    if (error) return res.status(404).json({ messages: [] })
    res.json({ messages: data.messages || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// INTÉGRATIONS SANTÉ — Withings · Oura · Garmin
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/integrations?userId=... — liste les intégrations connectées
app.get('/api/integrations', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  const { data } = await supabase
    .from('integrations_sante')
    .select('provider, actif, connected_at, last_sync_at, last_error')
    .eq('user_id', userId)
    .eq('actif', true)
  res.json({ integrations: data || [] })
})

// POST /api/sync-now — sync immédiate d'un provider pour un user
app.post('/api/sync-now', ownerGuard, async (req, res) => {
  const { userId, provider } = req.body
  if (!userId || !provider) return res.status(400).json({ error: 'userId et provider requis' })
  const { data: integ } = await supabase
    .from('integrations_sante')
    .select('*').eq('user_id', userId).eq('provider', provider).single()
  if (!integ) return res.status(404).json({ error: 'Intégration non trouvée' })
  try {
    let result
    if (provider === 'withings') result = await syncWithings(userId, integ)
    else if (provider === 'oura') result = await syncOura(userId, integ)
    else if (provider === 'garmin') result = await syncGarmin(userId, integ)
    else return res.status(400).json({ error: `Provider ${provider} non supporté` })
    await supabase.from('integrations_sante')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId).eq('provider', provider)
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/disconnect?userId=...&provider=... — déconnecte une intégration
app.delete('/api/disconnect', ownerGuard, async (req, res) => {
  const { userId, provider } = req.query
  await supabase.from('integrations_sante')
    .update({ actif: false, access_token: null, refresh_token: null })
    .eq('user_id', userId).eq('provider', provider)
  res.json({ succes: true })
})

// ── WITHINGS OAuth 2.0 ────────────────────────────────────────────────────────
// GET /api/connect/withings?userId=... → redirect vers Withings
app.get('/api/connect/withings', ownerGuard, (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).send('userId manquant')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.WITHINGS_CLIENT_ID,
    redirect_uri:  `${process.env.API_BASE_URL}/api/connect/withings/callback`,
    scope:         'user.metrics,user.sleepevents,user.activity',
    state:         userId,
  })
  res.redirect(`https://account.withings.com/oauth2_user/authorize2?${params}`)
})

// GET /api/connect/withings/callback → échange le code contre un token
app.get('/api/connect/withings/callback', async (req, res) => {
  const { code, state: userId } = req.query
  // Withings vérifie l'URL avec un GET sans params — répondre 200
  if (!code || !userId) return res.status(200).send('Solenn Withings callback OK')
  try {
    const { data } = await axios.post('https://wbsapi.withings.net/v2/oauth2',
      new URLSearchParams({
        action:        'requesttoken',
        client_id:     process.env.WITHINGS_CLIENT_ID,
        client_secret: process.env.WITHINGS_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  `${process.env.API_BASE_URL}/api/connect/withings/callback`,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    const body = data?.body
    if (!body?.access_token) throw new Error('Token invalide')
    await supabase.from('integrations_sante').upsert({
      user_id:       userId,
      provider:      'withings',
      access_token:  body.access_token,
      refresh_token: body.refresh_token,
      expires_at:    new Date(Date.now() + body.expires_in * 1000).toISOString(),
      scope:         body.scope,
      actif:         true,
      connected_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })
    // Première sync immédiate
    syncWithings(userId, { access_token: body.access_token }).catch(() => {})
    // Rediriger vers l'app
    res.redirect(`${process.env.VITE_APP_URL || 'https://meet-solenn.com'}/?integration=withings&status=ok`)
  } catch (e) {
    console.error('[Withings callback]', e.message)
    res.redirect(`${process.env.VITE_APP_URL || 'https://meet-solenn.com'}/?integration=withings&status=error`)
  }
})

// ── OURA Personal Access Token ────────────────────────────────────────────────
// POST /api/connect/oura { userId, token } → sauvegarde le PAT
app.post('/api/connect/oura', ownerGuard, async (req, res) => {
  const { userId, token } = req.body
  if (!userId || !token) return res.status(400).json({ error: 'userId et token requis' })
  try {
    // Vérifier que le token est valide
    const { data: test } = await axios.get('https://api.ouraring.com/v2/usercollection/personal_info', {
      headers: { Authorization: `Bearer ${token}` }
    })
    await supabase.from('integrations_sante').upsert({
      user_id:      userId,
      provider:     'oura',
      access_token: token,
      actif:        true,
      connected_at: new Date().toISOString(),
      metadata:     { email: test?.data?.email },
    }, { onConflict: 'user_id,provider' })
    // Première sync
    syncOura(userId, { access_token: token }).catch(() => {})
    res.json({ succes: true, email: test?.data?.email })
  } catch (e) {
    res.status(400).json({ error: 'Token Oura invalide' })
  }
})

// ── GARMIN OAuth 1.0a ────────────────────────────────────────────────────────
function garminOAuthHeader(method, url, extraParams, tokenSecret = '') {
  const params = {
    oauth_consumer_key:     process.env.GARMIN_CONSUMER_KEY,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_version:          '1.0',
    ...extraParams,
  }
  const base = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(
      Object.keys(params).sort()
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&')
    ),
  ].join('&')
  const sigKey = `${encodeURIComponent(process.env.GARMIN_CONSUMER_SECRET)}&${encodeURIComponent(tokenSecret)}`
  params.oauth_signature = crypto.createHmac('sha1', sigKey).update(base).digest('base64')

  return 'OAuth ' + Object.keys(params).sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`)
    .join(', ')
}

// GET /api/connect/garmin?userId=... → redirige vers Garmin pour autorisation
app.get('/api/connect/garmin', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  if (!process.env.GARMIN_CONSUMER_KEY) {
    return res.json({ message: 'Garmin non configuré — GARMIN_CONSUMER_KEY manquant', disponible: false })
  }
  try {
    const cbUrl = `${process.env.API_BASE_URL}/api/connect/garmin/callback`
    const authHeader = garminOAuthHeader('POST', 'https://connectapi.garmin.com/oauth-service/oauth/request_token', {
      oauth_callback: cbUrl,
    })
    const { data: raw } = await axios.post(
      'https://connectapi.garmin.com/oauth-service/oauth/request_token',
      null,
      { headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    const parsed = Object.fromEntries(new URLSearchParams(raw))
    const reqToken = parsed.oauth_token
    const reqSecret = parsed.oauth_token_secret
    // Stocker le secret temporairement pour le callback
    await supabase.from('integrations_sante').upsert({
      user_id:       userId,
      provider:      'garmin_pending',
      access_token:  reqToken,
      refresh_token: reqSecret,
      actif:         false,
      connected_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })
    res.redirect(`https://connect.garmin.com/oauthConfirm?oauth_token=${reqToken}`)
  } catch (e) {
    console.error('[Garmin connect]', e.response?.data || e.message)
    res.redirect(`${process.env.VITE_APP_URL || 'https://meet-solenn.com'}/?integration=garmin&status=error`)
  }
})

// GET /api/connect/garmin/callback?oauth_token=...&oauth_verifier=...
app.get('/api/connect/garmin/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query
  if (!oauth_token || !oauth_verifier) return res.status(400).send('Paramètres manquants')
  try {
    // Récupérer le secret stocké + userId
    const { data: pending } = await supabase.from('integrations_sante')
      .select('user_id, refresh_token')
      .eq('provider', 'garmin_pending')
      .eq('access_token', oauth_token)
      .single()
    if (!pending) return res.status(400).send('Session expirée')

    const reqSecret = pending.refresh_token
    const authHeader = garminOAuthHeader('POST', 'https://connectapi.garmin.com/oauth-service/oauth/access_token', {
      oauth_token,
      oauth_verifier,
    }, reqSecret)
    const { data: raw } = await axios.post(
      'https://connectapi.garmin.com/oauth-service/oauth/access_token',
      null,
      { headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    const parsed = Object.fromEntries(new URLSearchParams(raw))
    // Supprimer l'entrée pending et upsert le vrai token
    await supabase.from('integrations_sante').delete()
      .eq('user_id', pending.user_id).eq('provider', 'garmin_pending')
    await supabase.from('integrations_sante').upsert({
      user_id:       pending.user_id,
      provider:      'garmin',
      access_token:  parsed.oauth_token,
      refresh_token: parsed.oauth_token_secret,
      actif:         true,
      connected_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })
    res.redirect(`${process.env.VITE_APP_URL || 'https://meet-solenn.com'}/?integration=garmin&status=ok`)
  } catch (e) {
    console.error('[Garmin callback]', e.response?.data || e.message)
    res.redirect(`${process.env.VITE_APP_URL || 'https://meet-solenn.com'}/?integration=garmin&status=error`)
  }
})

// ── Sync globale (tous les users, tous les providers) ─────────────────────────
app.post('/api/sync-all', ownerGuard, async (req, res) => {
  try {
    const result = await runSyncSante()
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Design Advisor ───────────────────────────────────────────────────────────
app.get('/api/design-review', adminGuard, async (req, res) => {
  try {
    console.log('[DesignAdvisor] 🎨 Lancement audit design...')
    const rapport = await runDesignAudit()
    res.json(rapport)
  } catch (e) {
    console.error('[DesignAdvisor] Erreur:', e.message)
    res.status(500).json({ error: e.message, detail: 'Vérifier GROQ_API_KEY et que le dossier src/ est accessible' })
  }
})

app.get('/api/design-tokens', (req, res) => res.json(DESIGN_TOKENS))

// ─── Mémoire Longue ───────────────────────────────────────────────────────────
app.get('/api/memoire', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    const { data } = await supabase.from('profils').select('profil').eq('user_id', userId).single()
    res.json({ memoire: data?.profil?.memoire_longue || null })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Rapport Hebdo ────────────────────────────────────────────────────────────
// GET  /api/rapport-hebdo?userId=... → cache mémoire → Supabase → vide
// POST /api/rapport-hebdo            → génère un rapport immédiatement
app.get('/api/rapport-hebdo', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  // 1. Cache mémoire (rapport généré ce dimanche par le cron)
  const fromCache = rapportsCache.get(userId)
  if (fromCache) return res.json({ rapport: fromCache, source: 'cache' })
  // 2. Supabase (rapport sauvegardé les semaines précédentes)
  try {
    const { data } = await supabase
      .from('rapports_hebdo')
      .select('rapport, semaine')
      .eq('user_id', userId)
      .order('semaine', { ascending: false })
      .limit(1)
      .single()
    res.json(data?.rapport ? { rapport: data.rapport, semaine: data.semaine, source: 'db' } : { rapport: null })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/rapport-hebdo', ownerGuard, async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    const rapport = await genererRapportUser(userId)
    const semaine = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await supabase.from('rapports_hebdo').upsert({ user_id: userId, semaine, rapport, created_at: new Date().toISOString() }, { onConflict: 'user_id,semaine' })
    res.json({ rapport })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Challenges ───────────────────────────────────────────────────────────────
// GET  /api/challenge?userId=...   → challenge actif
// POST /api/challenge-create       → créer un nouveau challenge
// POST /api/challenge-progress     → marquer un jour comme complété
// PLUSIEURS PROGRAMMES EN MEME TEMPS, un par famille.
//
// Avant, cette route rendait LE programme actif, le plus recent, quelle que
// soit sa famille. Commencer un programme de nutrition eteignait donc celui
// de sport, et l'app prevenait « sa progression sera perdue ».
//
// Demande de Jean le 3 septembre : on peut desormais suivre du sport, une
// routine et de la nutrition en parallele. La famille n'est pas une colonne,
// elle se deduit du `type` range dans le JSON du challenge.
app.get('/api/challenge', ownerGuard, async (req, res) => {
  const { userId, famille } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('actif', true)
      .order('created_at', { ascending: false })

    const actifs = data || []
    if (!famille) return res.json({ challenge: actifs[0] || null })

    // Les programmes crees avant le catalogue n'ont pas de type : ce sont des
    // defis 21 jours, donc du sport. Sans ce repli ils disparaitraient.
    const dansLaFamille = actifs.find(c => {
      const prog = programmeParId(c.challenge?.type)
      return (prog?.famille || 'sport') === famille
    })
    res.json({ challenge: dansLaFamille || null })
  } catch (e) {
    res.json({ challenge: null })
  }
})

app.post('/api/challenge-create', ownerGuard, async (req, res) => {
  // `duree` n'a plus de valeur par defaut ici : c'est le catalogue qui la
  // porte, et un programme sportif dure 42 jours la ou le defi en dure 21.
  // Une valeur par defaut a 21 tronquerait silencieusement les programmes longs.
  const { userId, duree = null, type = 'defi21', intensite = null } = req.body
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    // On genere AVANT de desactiver. L'ordre inverse faisait perdre le
    // programme en cours quand la generation echouait : la personne se
    // retrouvait sans rien, en ayant seulement voulu en essayer un autre.
    // Le GET lit `.order(created_at desc).limit(1)`, donc le nouveau prend la
    // main immediatement, meme pendant la seconde ou les deux sont actifs.
    const result = await creerChallenge(userId, duree, type, intensite)
    // Sans identifiant du nouveau, on ne desactive rien : on ne saurait pas
    // l'exclure du menage, et on risquerait d'eteindre celui qu'on vient de
    // creer. Deux programmes actifs sont recuperables, zero ne l'est pas.
    if (result?.id) {
      // On n'eteint que les programmes de la MEME famille. Un programme de
      // nutrition ne doit plus effacer celui de sport : ils coexistent
      // desormais, un par onglet (demande de Jean, 3 septembre).
      const familleNeuve = programmeParId(type)?.famille || 'sport'
      const { data: autres } = await supabase.from('challenges')
        .select('id, challenge').eq('user_id', userId).eq('actif', true).neq('id', result.id)
      const aEteindre = (autres || [])
        .filter(c => (programmeParId(c.challenge?.type)?.famille || 'sport') === familleNeuve)
        .map(c => c.id)
      if (aEteindre.length) {
        await supabase.from('challenges').update({ actif: false }).in('id', aEteindre)
      }
    }
    res.json({ succes: true, challenge: result })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/challenge-progress', ownerGuard, async (req, res) => {
  const { userId, jour, complete } = req.body
  if (!userId || jour == null) return res.status(400).json({ error: 'userId et jour requis' })
  try {
    const { data } = await supabase
      .from('challenges')
      .select('id, progression')
      .eq('user_id', userId)
      .eq('actif', true)
      .single()
    if (!data) return res.status(404).json({ error: 'Aucun challenge actif' })

    const progression = [...(data.progression || [])]
    // `jour` arrive déjà en index 0-based depuis le client (Challenge21j.jsx
    // envoie jourActuel - 1) — ne pas re-soustraire 1, sinon le jour 1 écrit
    // progression[-1] et chaque jour marque la case du jour précédent.
    progression[jour] = complete
    await supabase.from('challenges').update({ progression }).eq('id', data.id)
    res.json({ succes: true, progression })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Météo ────────────────────────────────────────────────────────────────────
app.get('/api/meteo', async (req, res) => {
  const { ville = 'Paris', pays = 'FR' } = req.query
  try {
    const ctx = await genererContexteMeteo(ville, pays)
    res.json(ctx || { error: 'Météo non disponible (OPENWEATHER_API_KEY manquante ?)' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Idées de repas ─────────────────────────────────────────────────────────
// GET  /api/recettes?userId=...          → le cache du jour, s'il existe
// POST /api/recettes { userId, moment }  → en génère de nouvelles
//
// Deux routes et non une : ouvrir l'onglet Nutrition ne doit pas déclencher
// une génération, sinon chaque passage coûte un appel au modèle et vingt
// secondes d'attente pour des idées que la personne n'a pas demandées.
app.get('/api/recettes', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    const { data } = await supabase
      .from('profils').select('profil').eq('user_id', userId).single()
    const cache = data?.profil?.recettes_cache || null
    const aujourdhui = new Date().toISOString().split('T')[0]

    // LE CACHE EST RELU CONTRE LES EXCLUSIONS DU MOMENT.
    //
    // Le controle de securite ne tournait qu'a la GENERATION. Cette route
    // servait le cache tel quel, et le cache de la veille avec. Quelqu'un qui
    // declarait une allergie apres coup continuait donc a voir des idees
    // fabriquees avant, sans que rien ne les revoie (constat de Jean,
    // 3 septembre : « les recettes ne s'adaptent pas »).
    //
    // On ne sert rien plutot que de servir approximatif : l'ecran propose alors
    // de relancer, et la generation, elle, respecte les exclusions.
    if (cache?.liste?.length && !recettesSures(cache.liste, motsInterdits(data?.profil))) {
      return res.json({ recettes: null, date: null, dujour: false })
    }
    // Un cache d'hier est servi quand meme : des idees de repas ne se perimen
    // pas a minuit, et un ecran vide au reveil vaut moins qu'une idee de la
    // veille. La date part avec, l'ecran dira qu'elles datent.
    res.json({ recettes: cache?.liste || null, date: cache?.date || null, dujour: cache?.date === aujourdhui })
  } catch (e) {
    res.json({ recettes: null, date: null, dujour: false })
  }
})

app.post('/api/recettes', ownerGuard, async (req, res) => {
  const { userId, moment = 'diner' } = req.body
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  const momentsOk = ['petit-dejeuner', 'dejeuner', 'diner']
  try {
    const r = await genererRecettes(userId, {
      moment: momentsOk.includes(moment) ? moment : 'diner',
    })
    res.json({ succes: true, ...r })
  } catch (e) {
    // Le message vient de genererRecettes et il est ecrit pour etre lu par la
    // personne : un refus pour cause d'interdit alimentaire doit se distinguer
    // d'une panne, sinon relancer parait inutile alors que ca marche souvent.
    res.status(500).json({ error: e.message })
  }
})

// ─── Nutrition ────────────────────────────────────────────────────────────────
app.get('/api/nutrition-conseil', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    // Retourner les insights déjà calculés (dans profil)
    const { data } = await supabase.from('profils').select('profil').eq('user_id', userId).single()
    const insights = data?.profil?.nutrition_insights || null
    res.json({ insights })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/nutrition-conseil', ownerGuard, async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    const insights = await genererConseilsNutrition(userId)
    res.json({ insights })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Moments & Anniversaires ──────────────────────────────────────────────────
app.get('/api/moments', ownerGuard, async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'userId requis' })
  try {
    const { data } = await supabase.from('profils').select('profil').eq('user_id', userId).single()
    res.json({ moments: data?.profil?.moments_importants || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── B2B : Demande de démo ─────────────────────────────────────────────────────
app.post('/api/demo-request', async (req, res) => {
  const { nom, email, entreprise, taille } = req.body
  if (!nom || !email || !entreprise) return res.status(400).json({ error: 'Champs requis manquants' })
  console.log(`[B2B Demo] ${nom} — ${entreprise} (${taille}) — ${email}`)
  // Sauvegarder dans Supabase si disponible
  if (supabase) {
    await supabase.from('demo_requests').upsert({
      nom, email, entreprise, taille,
      created_at: new Date().toISOString(),
      statut: 'nouveau'
    }).catch(e => console.warn('[B2B Demo] Supabase insert failed (table may not exist yet):', e.message))
  }
  // Email de notification interne (vers contact@meet-solenn.com)
  // On utilise un simple log formaté pour l'instant + future intégration Resend/SendGrid
  console.log(`
📧 NOUVELLE DEMANDE DÉMO B2B
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nom       : ${nom}
📬 Email     : ${email}
🏢 Entreprise: ${entreprise}
👥 Taille    : ${taille}
📅 Date      : ${new Date().toLocaleString('fr-FR')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

  // Si RESEND_API_KEY configuré → envoyer un vrai email
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Solenn Business <noreply@meet-solenn.com>',
          to: ['contact@meet-solenn.com'],
          subject: `🏢 Nouvelle démo B2B — ${entreprise} (${taille} employés)`,
          html: `<h2>Nouvelle demande de démo</h2>
            <p><strong>Nom :</strong> ${nom}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Entreprise :</strong> ${entreprise}</p>
            <p><strong>Taille :</strong> ${taille}</p>
            <p><em>Reçu le ${new Date().toLocaleString('fr-FR')}</em></p>`,
        }),
      })
      console.log('[B2B Demo] Email envoyé via Resend ✓')
    } catch (emailErr) {
      console.warn('[B2B Demo] Email failed:', emailErr.message)
    }
  }

  res.json({ succes: true, message: 'Demande reçue — vous serez contacté sous 24h' })
})

// ── B2B : Dashboard RH ───────────────────────────────────────────────────────
// ATTENTION : tous les chiffres ci-dessous sont INVENTES. C'est une maquette de
// demonstration, il n'existe aucune table d'organisations ni de salaries.
// Ne jamais montrer cet ecran a un prospect en le presentant comme ses donnees.
//
// Le parametre `token` n'est pas verifie, et c'est sans consequence tant que la
// route reste derriere adminGuard : verifie le 2026-08-25, elle repond 401 sans
// la cle, donc AGENTS_TRIGGER_KEY est bien definie en production. Le jour ou le
// B2B devient reel, il faudra une vraie table d'organisations et cette garde
// deviendra insuffisante.
app.get('/api/business/dashboard', adminGuard, async (req, res) => {
  const { orgId, token } = req.query
  res.json({
    org: { nom: 'Votre Entreprise', plan: 'business', employes: 48 },
    kpis: {
      score_moyen: 72,
      actifs_semaine: 38,
      taux_engagement: 79,
      sommeil_moyen: 6.8,
      alertes: 3,
    },
    historique_scores: [65, 67, 70, 68, 72, 74, 71, 72],
    departements: [
      { nom: 'Marketing', employes: 12, score: 78, tendance: '+4', statut: 'bien' },
      { nom: 'Tech', employes: 18, score: 74, tendance: '+2', statut: 'bien' },
      { nom: 'Commercial', employes: 10, score: 61, tendance: '-3', statut: 'attention' },
      { nom: 'RH', employes: 5, score: 80, tendance: '+6', statut: 'bien' },
      { nom: 'Finance', employes: 8, score: 55, tendance: '-8', statut: 'alerte' },
    ],
    alertes: [
      { type: 'stress', departement: 'Commercial', message: '3 collaborateurs signalent un niveau de stress élevé cette semaine', action: 'Organiser un atelier gestion du stress' },
      { type: 'sommeil', departement: 'Finance', message: 'Moyenne sommeil < 6h sur 5 jours consécutifs', action: 'Proposer le programme sommeil Solenn' },
      { type: 'energie', departement: 'Commercial', message: 'Score énergie en baisse depuis 3 semaines', action: 'Activer les routines matinales personnalisées' },
    ]
  })
})

// ── Keep-alive — évite le cold start Render free tier ────────────────────────
app.get('/ping', (req, res) => res.send('pong'))

// Auto-ping toutes les 4 min pour garder le service chaud (Render s'endort après 15min)
if (!process.env.VERCEL && process.env.API_BASE_URL) {
  setInterval(async () => {
    try {
      await fetch(`${process.env.API_BASE_URL}/ping`)
      console.log('[Keep-alive] ping ✓')
    } catch {}
  }, 4 * 60 * 1000) // 4 minutes
}

// ═════════════════════════════════════════════════════════════════════════════
// CATCH-ALL SPA — doit être LE DERNIER bloc, après toutes les routes /api/
// Active uniquement quand dist/ existe (npm run build en local)
// Sur Render : dist/ n'existe pas → ce bloc est ignoré → les routes /api/ fonctionnent
// ═════════════════════════════════════════════════════════════════════════════
if (!process.env.VERCEL) {
  const distIndex = path.join(__dirname, 'dist', 'index.html')
  if (fs.existsSync(distIndex)) {
    console.log('📦 dist/ détecté — serving SPA en mode production locale')
    app.use(express.static(path.join(__dirname, 'dist')))
    app.get('*', (req, res) => res.sendFile(distIndex))
  } else {
    console.log('📡 Mode API pure — pas de dist/ → toutes les routes /api/ actives')
  }
}

// Export pour Vercel serverless
export default app

// ─── Listen (Render / local) ──────────────────────────────────────────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`✅ Serveur Solenn démarré sur port ${PORT}`)
    // Log toutes les routes enregistrées (debug Render)
    const routes = app._router?.stack
      ?.filter(r => r.route)
      ?.map(r => `${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`)
      ?.sort() || []
    if (routes.length) {
      console.log(`📋 ${routes.length} routes enregistrées :`)
      routes.forEach(r => console.log(`   ${r}`))
    }
    // Recharger les subscriptions push depuis la base (survit aux redémarrages
    // Render — la Map seule était vidée à chaque deploy/réveil)
    if (supabase) {
      supabase.from('push_subscriptions').select('user_id, subscription, meta').then(({ data, error }) => {
        if (error) { console.warn('[Push] Rechargement subscriptions impossible:', error.message); return }
        for (const row of data || []) {
          if (row.subscription?.endpoint && !pushSubscriptions.has(row.user_id)) {
            pushSubscriptions.set(row.user_id, { ...row.subscription, _meta: row.meta || {} })
          }
        }
        console.log(`[Push] ${pushSubscriptions.size} subscriptions rechargées depuis la base`)
      })
    }
    // Démarrer les sous-agents autonomes
    startAgents(pushSubscriptions)
  })
}
