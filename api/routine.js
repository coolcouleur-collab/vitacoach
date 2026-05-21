import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { profil, metriques } = req.body

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  const reveil  = profil?.reveil  || '07:00'
  const coucher = profil?.coucher || '23:00'
  const [reveilH, reveilM]   = reveil.split(':').map(Number)
  const [coucherH, coucherM] = coucher.split(':').map(Number)

  const fmt = (h, m=0) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  const matinFin    = fmt(reveilH + 2, reveilM)
  const midiFin     = fmt(reveilH + 5, reveilM)
  const soirDebut   = fmt(coucherH - 2, coucherM)

  const prompt = `Tu es Solenn, coach de vie expert en bien-être holistique, herbalisme et médecines traditionnelles.

Génère une routine quotidienne COMPLÈTE et ULTRA-PERSONNALISÉE pour aujourd'hui (${today}).

═══ PROFIL ═══
Prénom : ${profil?.nom}
Âge : ${profil?.age} ans · ${profil?.taille}cm · ${profil?.poids}kg
Objectifs : ${profil?.objectifs?.join(', ') || 'bien-être général'}
Alimentation : ${profil?.alimentaireDetails || profil?.regimes?.join(', ') || 'standard'}
Carences : ${profil?.carences?.join(', ') || 'aucune connue'}
Maladies : ${profil?.maladiesDetails || profil?.maladies?.join(', ') || 'aucune'}
Niveau d'activité : ${profil?.activite || 'modéré'}
Profession : ${profil?.profession || 'non renseignée'}

═══ PLANNING (adapte les horaires à CE rythme de vie) ═══
Réveil : ${reveil} → Début de journée à partir de cette heure
Coucher : ${coucher} → Fin de journée avant cette heure
Période matin : ${reveil} → ${matinFin}
Période midi/après-midi : ${matinFin} → ${soirDebut}
Période soir : ${soirDebut} → ${coucher}

═══ MÉTRIQUES D'HIER / CE MATIN ═══
Sommeil cette nuit : ${metriques?.sommeil > 0 ? `${metriques.sommeil}h` : 'non renseigné — adapte selon le profil'}
Pas déjà enregistrés : ${metriques?.pas > 0 ? metriques.pas : 0}
Hydratation : ${metriques?.eau > 0 ? `${metriques.eau} verres` : '0 (encourage}'}
Humeur : ${metriques?.humeur > 0 ? `${metriques.humeur}/5` : 'non renseignée'}

Réponds UNIQUEMENT en JSON valide avec ce format exact. Utilise les vrais horaires de ${profil?.nom} :

{
  "matin": {
    "heure": "${reveil} - ${matinFin}",
    "titre": "Réveil & Lancement",
    "etapes": [
      {"emoji": "💧", "action": "Action concrète personnalisée", "detail": "Explication courte et utile"},
      {"emoji": "🌿", "action": "Routine matinale adaptée", "detail": "Bénéfice pour cette personne"},
      {"emoji": "🧘", "action": "Moment bien-être", "detail": "Adapté à son niveau d'activité"},
      {"emoji": "🍳", "action": "Petit déjeuner adapté au régime", "detail": "Exemple concret"}
    ]
  },
  "nutrition": {
    "titre": "Plan Nutrition du Jour",
    "repas": [
      {"moment": "Déjeuner", "suggestion": "Repas adapté au profil alimentaire avec exemple", "emoji": "🥗"},
      {"moment": "Dîner", "suggestion": "Repas léger adapté, ${coucher} en tête", "emoji": "🍲"},
      {"moment": "Collation", "suggestion": "Snack sain si besoin", "emoji": "🍎"}
    ],
    "plantes": [
      {"emoji": "🌿", "nom": "Plante pertinente pour ce profil", "usage": "Quand et comment prendre", "benefice": "Bénéfice spécifique à cette personne"}
    ],
    "supplements": ["Supplément si carence identifiée"]
  },
  "apresmidi": {
    "heure": "${matinFin} - ${soirDebut}",
    "titre": "Productivité & Énergie",
    "etapes": [
      {"emoji": "🍵", "action": "Action adaptée à la profession", "detail": "Pourquoi à ce moment"},
      {"emoji": "🚶", "action": "Mouvement adapté au niveau d'activité", "detail": "Objectif de pas à atteindre"},
      {"emoji": "💡", "action": "Optimisation selon les objectifs", "detail": "Conseil personnalisé"}
    ]
  },
  "soir": {
    "heure": "${soirDebut} - ${coucher}",
    "titre": "Récupération & Sommeil",
    "etapes": [
      {"emoji": "🍵", "action": "Tisane calmante adaptée au profil de santé", "detail": "Plante spécifique et contre-indications si besoin"},
      {"emoji": "📵", "action": "Routine numérique", "detail": "Timing adapté à ${coucher}"},
      {"emoji": "🛁", "action": "Rituel relaxation", "detail": "Adapté aux objectifs sommeil"}
    ]
  },
  "astuce": {
    "emoji": "💡",
    "titre": "Conseil du jour pour ${profil?.nom}",
    "conseil": "Un conseil hyper-personnalisé basé sur son profil, ses objectifs ET ses métriques du jour"
  },
  "motivation": "Message de motivation chaleureux et personnalisé pour ${profil?.nom} qui commence sa journée à ${reveil}"
}`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role:'system', content:'Tu es un expert en bien-être holistique. Réponds TOUJOURS en JSON valide et complet. Ne mets pas de texte avant ou après le JSON.' },
      { role:'user', content:prompt }
    ],
    temperature: 0.8,
    max_tokens: 2200
  })

  try {
    const text = response.choices[0].message.content
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = JSON.parse(jsonMatch[0])
    res.json(data)
  } catch {
    res.status(500).json({ erreur:'Erreur de génération — réessaie.' })
  }
}
