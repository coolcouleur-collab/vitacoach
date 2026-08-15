/**
 * AGENT CHALLENGE 21 JOURS — Solenn
 * ─────────────────────────────────────────────────────────────────────────────
 * Génère un challenge personnalisé de 7 ou 21 jours basé sur les points faibles
 *
 * REFONTE 2026-08-12 — le programme généré était bien plus pauvre que le
 * programme écrit en dur réservé aux objectifs de poids : micro-actions de
 * 2 à 5 minutes, sans séance ni conseil nutrition, ce qui donnait des
 * programmes mono-thème du genre « bois de l'eau pendant 21 jours ».
 * Et le prompt n'utilisait presque rien du profil : ni l'objectif choisi à
 * l'inscription, ni le niveau d'activité, ni le rythme de vie, ni les
 * conditions de santé, tous collectés puis jamais transmis.
 * Le format demande désormais les mêmes champs que le programme écrit en dur,
 * et le prompt interdit explicitement le mono-thème.
 * détectés par l'agent de monitoring. Chaque jour = 1 micro-action concrète.
 * Suit la progression et envoie une micro-célébration à chaque étape clé.
 *
 * Fréquence : création sur demande (POST /api/challenge-create)
 *             check quotidien : 08:30
 * Trigger : POST /api/agents-trigger { agent: 'challenge' }
 */

import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

let _groq = null
let _supabase = null

function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

function getSupabase() {
  if (!_supabase) _supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  )
  return _supabase
}

// ─── Génère un challenge personnalisé ────────────────────────────────────────
// ─── PROGRAMME POIDS 21 JOURS — écrit en dur, pas généré par IA ──────────────
// Demande Jean (2026-07-25) : un VRAI programme d'entraînement progressif
// (séances structurées avec exercices du guide, séries/répétitions, conseils
// nutrition consistants), pas des micro-actions génériques. Qualité garantie
// et identique pour tous — la personnalisation vient du coaching autour.
// Les ids de `seance` correspondent aux fiches du Guide des exercices.
const PROGRAMME_POIDS = {
  titre: '21 jours pour te réconcilier avec ton corps',
  emoji: '🌱',
  description: 'Trois semaines progressives : on construit la base, on monte en puissance, on ancre les habitudes. Jamais dans la douleur, toujours dans la régularité.',
  objectif_final: 'Un corps plus fort, des habitudes installées, et la preuve chiffrée que tu peux tenir un programme.',
  jours: [
    // ── SEMAINE 1 : Fondations ──
    { jour: 1,  titre: 'On pose la première pierre', action: 'Marche active 20 minutes, à un rythme où parler reste possible mais chanter non', duree: '20 min', seance: [{ exo: 'marche', reps: '20 min' }], nutrition: 'Aujourd\'hui, bois un grand verre d\'eau avant chaque repas : la satiété arrive plus vite.', pourquoi: 'La marche active brûle des graisses sans épuiser : c\'est la fondation de tout le programme.' },
    { jour: 2,  titre: 'Première séance : découverte', action: 'Séance A : squats, pont fessier et gainage : en douceur, la technique avant tout', duree: '12 min', seance: [{ exo: 'squat', reps: '2 × 8' }, { exo: 'pont', reps: '2 × 10' }, { exo: 'gainage', reps: '2 × 20 s' }], nutrition: 'Ajoute une source de protéines au petit-déjeuner (œuf, yaourt grec, fromage blanc) : moins de fringales à 11h.', pourquoi: 'Squats et gainage recrutent les plus gros muscles : ceux qui consomment le plus d\'énergie, même au repos.' },
    { jour: 3,  titre: 'Cardio doux', action: 'Marche active 25 minutes + 8 verres d\'eau dans la journée', duree: '25 min', seance: [{ exo: 'marche', reps: '25 min' }], nutrition: 'Remplis la moitié de ton assiette du midi avec des légumes : volume, fibres, satiété.', pourquoi: 'Alterner effort et récupération accélère les progrès plus que forcer tous les jours.' },
    { jour: 4,  titre: 'Séance B : équilibre', action: 'Séance B : fentes, chaise au mur et chat-vache pour finir en douceur', duree: '12 min', seance: [{ exo: 'fente', reps: '2 × 6 / jambe' }, { exo: 'chaise', reps: '2 × 20 s' }, { exo: 'chatvache', reps: '8 respirations' }], nutrition: 'Prépare une collation prête à l\'avance (fruits + amandes) pour éviter le distributeur.', pourquoi: 'Les fentes travaillent l\'équilibre et corrigent les asymétries : la base d\'un corps solide.' },
    { jour: 5,  titre: 'Récupération active', action: '10 minutes d\'étirements complets, en respirant profondément', duree: '10 min', seance: [{ exo: 'etirement', reps: '4 × 20 s / côté' }, { exo: 'chatvache', reps: '8 respirations' }], nutrition: 'Ce soir, dîne 2-3h avant le coucher : la digestion nocturne perturbe le sommeil, et le sommeil pilote l\'appétit.', pourquoi: 'C\'est pendant la récupération que le corps se transforme : la négliger, c\'est freiner tes résultats.' },
    { jour: 6,  titre: 'Séance A : on monte', action: 'Séance A en 3 tours cette fois : ton corps connaît déjà les mouvements', duree: '15 min', seance: [{ exo: 'squat', reps: '3 × 8' }, { exo: 'pont', reps: '3 × 10' }, { exo: 'gainage', reps: '3 × 20 s' }], nutrition: 'Regarde les étiquettes aujourd\'hui : les sucres cachés (sauces, jus, céréales) sabotent plus que les desserts assumés.', pourquoi: 'Passer de 2 à 3 séries : +50 % de volume : c\'est comme ça qu\'on progresse sans se blesser.' },
    { jour: 7,  titre: 'Grande marche + bilan', action: 'Marche longue 40 minutes + note comment tu te sens après cette première semaine', duree: '40 min', seance: [{ exo: 'marche', reps: '40 min' }], nutrition: 'Repas libre ce soir, sans culpabilité : un programme tenable inclut du plaisir.', pourquoi: 'Une semaine complète : ton corps a déjà commencé à changer, même si la balance ne le dit pas encore.' },
    // ── SEMAINE 2 : Montée en puissance ──
    { jour: 8,  titre: 'Séance B renforcée', action: 'Séance B : plus de répétitions, gainage plus long', duree: '15 min', seance: [{ exo: 'fente', reps: '3 × 8 / jambe' }, { exo: 'chaise', reps: '3 × 30 s' }, { exo: 'gainage', reps: '3 × 30 s' }], nutrition: 'Protéines à CHAQUE repas cette semaine : elles protègent tes muscles pendant la perte de poids.', pourquoi: 'Semaine 2 : ton corps s\'est adapté, on lui donne une nouvelle raison de progresser.' },
    { jour: 9,  titre: 'Marche rapide', action: 'Marche 30 minutes à rythme soutenu : un peu essoufflée, c\'est le but', duree: '30 min', seance: [{ exo: 'marche', reps: '30 min rapide' }], nutrition: 'Troque une boisson sucrée contre de l\'eau pétillante citronnée : 100-150 kcal évitées sans frustration.', pourquoi: 'Le rythme soutenu élève le métabolisme pendant des heures après l\'effort.' },
    { jour: 10, titre: 'Séance complète', action: 'Première séance complète : squats, fentes et pont enchaînés', duree: '18 min', seance: [{ exo: 'squat', reps: '3 × 10' }, { exo: 'fente', reps: '2 × 8 / jambe' }, { exo: 'pont', reps: '3 × 12' }], nutrition: 'Mange lentement ce midi : 20 minutes minimum : le cerveau met ce temps à percevoir la satiété.', pourquoi: 'Enchaîner les exercices garde le cœur haut : renforcement ET cardio en une séance.' },
    { jour: 11, titre: 'Pause qui construit', action: 'Récupération active : mobilité du dos et étirements, 12 minutes', duree: '12 min', seance: [{ exo: 'chatvache', reps: '10 respirations' }, { exo: 'etirement', reps: '4 × 25 s / côté' }], nutrition: 'Fais le point sur ton sommeil : moins de 7h = plus de ghréline (hormone de la faim) demain.', pourquoi: 'Mi-programme : la récupération d\'aujourd\'hui paie les séances de demain.' },
    { jour: 12, titre: 'Circuit chrono', action: 'Circuit ×3 : squats, gainage, pont : le moins de pause possible entre les tours', duree: '15 min', seance: [{ exo: 'squat', reps: '10' }, { exo: 'gainage', reps: '25 s' }, { exo: 'pont', reps: '12' }], nutrition: 'Ajoute une poignée de légumineuses (lentilles, pois chiches) à un repas : rassasiantes et riches en fibres.', pourquoi: 'Le format circuit maximise la dépense en un minimum de temps : parfait les jours chargés.' },
    { jour: 13, titre: 'Marche fractionnée', action: '35 minutes : alterne 4 min rapides / 2 min tranquilles', duree: '35 min', seance: [{ exo: 'marche', reps: '3 × (4 min rapide + 2 min lente)' }], nutrition: 'Prépare tes repas de demain à l\'avance : les décisions de dernière minute sont rarement les bonnes.', pourquoi: 'Le fractionné brûle plus que la même durée à rythme constant : et fait passer le temps plus vite.' },
    { jour: 14, titre: 'Bilan de mi-parcours', action: 'Étirements 10 min + regarde tes progrès dans l\'onglet Progrès : 2 semaines tenues !', duree: '10 min', seance: [{ exo: 'etirement', reps: '4 × 20 s / côté' }], nutrition: 'Compare ton assiette type d\'aujourd\'hui à celle d\'il y a 2 semaines : mesure le chemin parcouru.', pourquoi: '14 jours de tenue : statistiquement, tu fais déjà partie de celles et ceux qui vont au bout.' },
    // ── SEMAINE 3 : Consolidation ──
    { jour: 15, titre: 'Séance complète +', action: 'Ta plus grosse séance : squats, fentes, chaise : tu es prête pour ça', duree: '18 min', seance: [{ exo: 'squat', reps: '3 × 12' }, { exo: 'fente', reps: '3 × 8 / jambe' }, { exo: 'chaise', reps: '3 × 35 s' }], nutrition: 'Cette semaine, un fruit en dessert le midi au lieu du sucré : l\'habitude qui reste après le programme.', pourquoi: 'Semaine 3 : on consolide. Ce que tu fais 21 jours, tu peux le faire toute l\'année.' },
    { jour: 16, titre: 'Marche endurance', action: 'Marche rapide 40 minutes : mets un podcast et profite', duree: '40 min', seance: [{ exo: 'marche', reps: '40 min rapide' }], nutrition: 'Hydratation max aujourd\'hui : 8 verres minimum, la marche longue déshydrate plus qu\'on ne croit.', pourquoi: 'L\'endurance construite ces 3 semaines se voit : compare avec ta marche du jour 1.' },
    { jour: 17, titre: 'Circuit final', action: 'Le grand circuit ×3 : squats, pont, gainage, fentes : tout ce que tu as appris', duree: '20 min', seance: [{ exo: 'squat', reps: '12' }, { exo: 'pont', reps: '12' }, { exo: 'gainage', reps: '35 s' }, { exo: 'fente', reps: '8 / jambe' }], nutrition: 'Assiette du sportif ce soir : 1/2 légumes, 1/4 protéines, 1/4 féculents complets.', pourquoi: 'Ce circuit aurait été impossible au jour 1. Il est ta preuve.' },
    { jour: 18, titre: 'Récupération profonde', action: '15 minutes : étirements complets + 10 grandes respirations au calme', duree: '15 min', seance: [{ exo: 'etirement', reps: '5 × 25 s / côté' }, { exo: 'chatvache', reps: '10 respirations' }], nutrition: 'Zéro écran pendant les repas aujourd\'hui : on mange 20 % de moins quand on mange en conscience.', pourquoi: 'Les 3 derniers jours arrivent : on y va reposée, pas épuisée.' },
    { jour: 19, titre: 'Ta séance préférée', action: 'Refais la séance que tu as préférée du programme + 2 000 pas bonus dans la journée', duree: '15-20 min', seance: [{ exo: 'squat', reps: 'ta séance préférée' }], nutrition: 'Cuisine quelque chose que tu aimes VRAIMENT, version équilibrée : le plaisir est une stratégie, pas une triche.', pourquoi: 'Choisir sa séance, c\'est le début de l\'autonomie : le programme se termine, pas la pratique.' },
    { jour: 20, titre: 'Avant-dernière marche', action: 'Marche 45 minutes, ton record du programme', duree: '45 min', seance: [{ exo: 'marche', reps: '45 min' }], nutrition: 'Note tes 3 habitudes alimentaires préférées de ces 3 semaines : ce sont elles que tu gardes.', pourquoi: '45 minutes : impensable il y a 3 semaines. Regarde d\'où tu viens.' },
    { jour: 21, titre: 'Jour 21 : la preuve', action: 'Séance de célébration : un tour de tout, puis va voir tes progrès chiffrés dans Progrès', duree: '15 min', seance: [{ exo: 'squat', reps: '10' }, { exo: 'fente', reps: '6 / jambe' }, { exo: 'pont', reps: '10' }, { exo: 'gainage', reps: '30 s' }, { exo: 'etirement', reps: '2 × 20 s / côté' }], nutrition: 'Célèbre : et planifie : quelles séances gardes-tu la semaine prochaine ?', pourquoi: '21 jours. Tu ne t\'es pas réconciliée avec ton corps en le punissant, mais en le renforçant. C\'est ça, la différence.' },
  ],
  milestones: [
    { jour: 7,  titre: 'Première semaine tenue', message: 'Les fondations sont posées : ton corps a déjà commencé à changer.' },
    { jour: 14, titre: 'Deux semaines : le cap décisif', message: 'Statistiquement, tu fais maintenant partie de celles et ceux qui vont au bout.' },
    { jour: 21, titre: 'Programme accompli', message: 'La preuve est faite : tu peux tenir un programme. La suite t\'appartient.' },
  ],
}

// Conserve : RoutineTab s'en sert encore pour choisir le libelle du bloc,
// « Ton programme » plutot que « Ton defi 21 jours ». Il ne pilote plus la
// generation depuis le 2026-08-12.
const OBJECTIF_POIDS_RE = /poids|mincir|maigrir|corps|réconcilier|silhouette/i

export async function creerChallenge(userId, duree = 21) {
  const supabase = getSupabase()
  const groq     = getGroq()

  // Charger profil + métriques récentes
  const { data: profilRow } = await supabase
    .from('profils')
    .select('profil')
    .eq('user_id', userId)
    .single()

  const profil  = profilRow?.profil || {}
  const memoire = profil?.memoire_longue || {}
  const nom     = profil?.nom || profil?.prenom || 'toi'

  // Le programme ecrit en dur n'est plus reserve aux objectifs de poids : il
  // devient le REPLI de tout le monde quand la generation echoue. Tant que le
  // prompt etait pauvre, ce cas particulier se justifiait ; maintenant qu'il
  // porte tout le profil, il n'y a plus de raison qu'un objectif recoive un
  // programme fige et les autres un programme sur mesure (2026-08-12).

  // Métriques des 7 derniers jours pour détecter les faiblesses
  const dateDebut = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: metriques } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', dateDebut)

  const calcMoy = (arr, key) => {
    const vals = (arr || []).map(m => m[key]).filter(v => v != null && v > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  const faiblesses = []
  const sommeil = calcMoy(metriques, 'sommeil')
  const eau     = calcMoy(metriques, 'eau')
  const pas     = calcMoy(metriques, 'pas')
  const humeur  = calcMoy(metriques, 'humeur')

  if (sommeil && sommeil < 7) faiblesses.push(`sommeil insuffisant (moy. ${sommeil.toFixed(1)}h)`)
  if (eau     && eau < 6)     faiblesses.push(`hydratation faible (moy. ${eau.toFixed(1)} verres/j)`)
  if (pas     && pas < 5000)  faiblesses.push(`sédentarité (moy. ${Math.round(pas)} pas/j)`)
  if (humeur  && humeur < 3)  faiblesses.push(`humeur en baisse (moy. ${humeur.toFixed(1)}/5)`)

  if (memoire?.points_attention?.length) faiblesses.push(...memoire.points_attention.slice(0, 2))

  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: 'Tu es Solenn, coach IA premium. Tu crées des challenges progressifs, bienveillants et réalistes. Réponds uniquement en JSON valide.'
      },
      {
        role: 'user',
        content: `Crée un programme de ${duree} jours pour ${nom}.

═══ QUI EST ${nom.toUpperCase()} ═══
Objectif principal : ${profil?.objectifs?.[0] || profil?.objectif || 'bien-être général'}
Niveau d'activité : ${profil?.activite || 'non renseigné'}
Rythme de vie : ${profil?.rythme || 'non renseigné'}
Foyer : ${profil?.vie || 'non renseigné'}
Moment préféré pour soi : ${profil?.moment || 'non renseigné'}
Point de départ ressenti : ${profil?.baseline || 'non renseigné'}
Ce qui l'a décidé : ${profil?.declencheur || 'non renseigné'}
${profil?.sante_conditions?.length ? `⚠️ À PRENDRE EN COMPTE : ${profil.sante_conditions.join(', ')}` : ''}

═══ CE QUE DISENT SES DONNÉES ═══
${faiblesses.length ? faiblesses.join(', ') : 'pas encore assez de données'}
${memoire?.objectifs_mentionnes?.length ? `Ce qu'elle/il t'a dit vouloir : ${memoire.objectifs_mentionnes.slice(0, 2).join(', ')}` : ''}
${memoire?.themes_recurrents?.length ? `Sujets qui reviennent dans vos échanges : ${memoire.themes_recurrents.slice(0, 3).join(', ')}` : ''}

═══ RÈGLES NON NÉGOCIABLES ═══
1. VARIE LES THÈMES. Un programme entier sur un seul sujet (boire de l'eau, marcher) est un échec.
   Répartis sur les ${duree} jours : mouvement, sommeil, alimentation, respiration/mental, et récupération.
   Aucun thème ne doit occuper plus d'un tiers des jours.
2. ADAPTE L'INTENSITÉ au niveau d'activité déclaré. Sédentaire : on commence par de la marche
   et de la mobilité. Sportif : les séances doivent le/la challenger, sinon il/elle décroche.
3. RESPECTE LES CONTRAINTES. Douleurs ou blessures : pas d'impact. Fatigue profonde : on
   commence par le sommeil et la récupération, jamais par l'effort. Rapport compliqué à la
   nourriture : AUCUNE consigne de quantité, de comptage ou de restriction.
4. TIENS COMPTE DU RYTHME. Horaires décalés : viser la régularité, pas des heures fixes.
   En famille : des actions courtes qui survivent aux imprévus.
5. PROGRESSE. Semaine 1 on installe, semaine 2 on monte, semaine 3 on ancre.
   Prévois 1 jour de récupération plus léger tous les 3 à 4 jours.

═══ SÉANCES ═══
Quand un jour comporte du mouvement, décris-le dans "seance" avec ces identifiants
UNIQUEMENT : squat, gainage, fente, pont, chaise, chatvache, marche, etirement,
pompe, pompegenoux, superman, dips.
Ils correspondent au guide des exercices de l'app, qui montre le geste en photo.
Les jours sans mouvement (sommeil, respiration, nutrition) n'ont pas de "seance".

RICHESSE : un jour de mouvement porte 2 à 4 exercices dans "seance", jamais un
seul. Un jour avec un unique exercice n'est pas une séance, c'est un geste.
Et chaque jour porte un conseil "nutrition" concret, sauf les jours de
récupération pure où il peut être null.

ÉQUILIBRE DU CORPS : ne construis pas un programme qui ne travaille que les
jambes. Sur l'ensemble des jours, fais revenir le haut du corps (pompe ou
pompegenoux, superman, dips) au moins autant que le bas (squat, fente, chaise).
Choisis pompegenoux plutôt que pompe si le niveau d'activité est faible.

PROGRESSION CHIFFRÉE, jour après jour ET semaine après semaine :
Les répétitions et les durées doivent AUGMENTER au fil du programme. Un même
exercice ne doit jamais garder les mêmes chiffres du début à la fin.
Repère : environ +10 % par semaine, et une petite marche entre deux séances
consécutives du même exercice. Par exemple squat 3 × 8 au jour 2, 3 × 10 au
jour 5, 3 × 12 au jour 9, 4 × 12 au jour 16.
Les jours de récupération font exception : ils redescendent volontairement.

INTERDITS dans tous les textes : le tiret cadratin (—) et les emojis dans
les messages. Ponctue avec des virgules, des deux-points ou des points.

Format JSON :
{
  "titre": "nom du programme (accrocheur, max 6 mots)",
  "emoji": "1 emoji thème",
  "description": "1-2 phrases qui disent ce qu'on va construire ensemble",
  "objectif_final": "ce qu'on gagne après ${duree} jours, concret et mesurable",
  "jours": [
    {
      "jour": 1,
      "titre": "titre court du jour",
      "action": "action concrète et précise, avec la durée",
      "duree": "ex: 10 min",
      "seance": [{ "exo": "squat", "reps": "3 × 10" }],
      "nutrition": "un conseil alimentaire concret, ou null si le jour n'en porte pas",
      "pourquoi": "1 phrase qui explique POURQUOI ça marche"
    }
  ],
  "milestones": [
    { "jour": 7, "message": "message de célébration J7" },
    { "jour": 14, "message": "message de célébration J14" },
    { "jour": 21, "message": "message final de victoire" }
  ]
}`
      }
    ],
    temperature: 0.5,
    // 3000 suffisaient pour des micro-actions d'une ligne. Avec les seances et
    // les conseils nutrition, un programme de 21 jours depasse : le JSON etait
    // tronque et la generation echouait (2026-08-12).
    max_tokens: 6000,
  })

  // Le programme genere doit passer trois controles avant d'etre servi. Un
  // JSON valide ne suffit pas : un programme tronque a 6 jours ou entierement
  // consacre a boire de l'eau est pire que le repli ecrit a la main.
  function programmeValable(c) {
    if (!c || !Array.isArray(c.jours) || c.jours.length < duree) return false
    if (c.jours.some(j => !j?.action)) return false
    // Anti mono-theme : si le meme mot-cle revient dans plus d'un tiers des
    // jours, le modele a ignore la regle et on prefere le repli.
    const THEMES = ['eau', 'boire', 'hydrat', 'marche', 'respir']
    for (const t of THEMES) {
      const n = c.jours.filter(j => (j.action || '').toLowerCase().includes(t)).length
      if (n > Math.ceil(c.jours.length / 3)) return false
    }
    // Des seances consistantes : au moins la moitie des jours doivent porter du
    // mouvement, et une seance d'un seul exercice n'en est pas une.
    const avecSeance = c.jours.filter(j => Array.isArray(j.seance) && j.seance.length)
    if (avecSeance.length < Math.floor(c.jours.length / 2)) return false
    if (avecSeance.filter(j => j.seance.length >= 2).length < avecSeance.length * 0.6) return false
    // Le haut du corps doit exister quelque part.
    const HAUT = ['pompe', 'pompegenoux', 'superman', 'dips']
    const aDuHaut = avecSeance.some(j => j.seance.some(e => HAUT.includes(e?.exo)))
    if (!aDuHaut) return false
    return true
  }

  let challenge = null
  try {
    const raw   = res.choices[0].message.content
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parse = JSON.parse(match[0])
      if (programmeValable(parse)) challenge = parse
      else console.warn('[Challenge] génération rejetée (incomplete ou mono-thème) → repli')
    }
  } catch (e) {
    console.warn('[Challenge] JSON illisible → repli:', e.message)
  }

  // Repli : le programme ecrit a la main. Il vaut mieux un bon programme
  // generique qu'un mauvais programme personnalise, et surtout mieux qu'une
  // erreur qui laisse l'utilisateur sans rien.
  if (!challenge) challenge = PROGRAMME_POIDS

  // L'objectif qui a produit ce programme est grave dedans : le client detecte
  // ainsi qu'il a change depuis, et propose la regeneration. Copie et non
  // mutation, PROGRAMME_POIDS est une constante partagee.
  challenge = {
    ...challenge,
    objectif_source: [profil?.objectifs?.[0], profil?.objectif].filter(Boolean)[0] || null,
  }

  const dateDebutChallenge = new Date().toISOString().split('T')[0]

  // Sauvegarder dans Supabase
  const { data: saved } = await supabase
    .from('challenges')
    .insert({
      user_id:    userId,
      duree: challenge.jours?.length || duree,
      challenge,
      progression: Array(challenge.jours?.length || duree).fill(false),
      date_debut:  dateDebutChallenge,
      actif:       true,
      created_at:  new Date().toISOString(),
    })
    .select()
    .single()

  console.log(`[Challenge] ✅ Challenge "${challenge.titre}" créé pour ${userId.slice(0, 8)}`)
  return saved || { challenge, date_debut: dateDebutChallenge }
}

// ─── Check quotidien : rappels et célébrations ────────────────────────────────
export async function runChallengeCheck(pushSubscriptions) {
  console.log('[Challenge] 🏆 Check défis quotidiens...')
  const supabase = getSupabase()
  const aujourd  = new Date().toISOString().split('T')[0]

  // Challenges actifs
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('actif', true)

  if (!challenges?.length) return { verifies: 0 }

  let verifies = 0

  for (const ch of challenges) {
    try {
      const debut = new Date(ch.date_debut)
      const jourActuel = Math.floor((Date.now() - debut.getTime()) / (24 * 60 * 60 * 1000)) + 1

      if (jourActuel > ch.duree) {
        // Challenge terminé
        await supabase.from('challenges').update({ actif: false }).eq('id', ch.id)
        continue
      }

      const jourData     = ch.challenge?.jours?.[jourActuel - 1]
      const progression  = ch.progression || []
      const hierComplete = jourActuel > 1 ? progression[jourActuel - 2] : true

      // Milestone check
      const milestone = ch.challenge?.milestones?.find(m => m.jour === jourActuel && progression[jourActuel - 2])

      const sub = pushSubscriptions?.get(ch.user_id)
      if (sub && jourData) {
        const title = milestone
          ? `${milestone.message?.slice(0, 40)}`
          : `Défi J${jourActuel} · ${ch.challenge?.titre}`
        const body  = milestone
          ? milestone.message
          : jourData.action

        try {
          await webpush.sendNotification(sub, JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            data: { url: '/?onglet=routine&challenge=true' },
          }))
        } catch (_) {}
      }

      verifies++
    } catch (e) {
      console.error(`[Challenge] Erreur challenge ${ch.id}:`, e.message)
    }
  }

  console.log(`[Challenge] ✅ ${verifies} défis vérifiés`)
  return { verifies, total: challenges.length }
}
