// ─────────────────────────────────────────────────────────────────────────────
// LES IDÉES DE REPAS
//
// L'app savait déjà commenter une photo de repas et proposer les repas du jour
// dans la routine. Elle ne savait pas répondre à la seule question qui se pose
// vraiment devant un frigo ouvert : « je fais quoi, moi, ce soir ? »
//
// Ce qui rend ces idées utiles n'est pas la recette, c'est le POURQUOI. Une
// recette générique se trouve partout et gratuitement. Une recette qui dit
// « celle-là parce que tu dors mal en ce moment et qu'elle est légère le soir »
// ne se trouve nulle part ailleurs, et c'est la seule chose que Solenn peut
// apporter ici.
//
// Deux garde-fous, non négociables, et ils viennent du programme alimentaire :
//
//   · aucun comptage, aucune pesée, aucun mot de restriction. Le programme
//     « Rééquilibrage alimentaire » l'interdit explicitement, et deux endroits
//     de l'app qui se contrediraient sur ce point détruiraient la confiance
//     dans les deux.
//   · ce que la personne ne mange pas est une CONTRAINTE et non une
//     préférence. Une allergie ignorée n'est pas une maladresse, c'est un
//     danger, et la génération est rejetée plutôt que servie approximative.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

let _supabase = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
    )
  }
  return _supabase
}

let _groq = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

/**
 * Les régimes proposés à l'écran.
 *
 * Chacun porte DEUX choses, et il faut les deux :
 *
 *   · `interdit`, une phrase, pour la consigne donnée au modèle
 *   · `mots`, la liste concrète des aliments à chercher dans le résultat
 *
 * La liste existe parce que le contrôle a posteriori ne comprend pas les
 * catégories. Chercher « viande » ne trouve jamais « poulet », et ma première
 * version laissait donc passer un poulet rôti à quelqu'un de végétarien : elle
 * vérifiait la présence d'un mot que le modèle n'écrit jamais.
 *
 * La liste ne prétend pas être exhaustive, aucune ne peut l'être. Elle couvre
 * ce qu'un générateur de recettes propose réellement, et c'est la consigne du
 * prompt qui fait le gros du travail : ceci est le filet, pas le plancher.
 */
export const REGIMES = {
  aucun: { nom: 'Aucun', interdit: null, mots: [] },

  vegetarien: {
    nom: 'Végétarien',
    interdit: 'viande et poisson',
    mots: ['viande', 'poulet', 'boeuf', 'veau', 'agneau', 'porc', 'dinde', 'canard',
           'lardon', 'jambon', 'bacon', 'saucisse', 'chorizo', 'steak', 'escalope',
           'poisson', 'saumon', 'thon', 'cabillaud', 'crevette', 'gambas', 'anchois',
           'sardine', 'maquereau', 'moule', 'calamar', 'surimi'],
  },

  vegetalien: {
    nom: 'Végétalien',
    interdit: 'tout produit animal, y compris oeufs, lait, fromage et miel',
    mots: ['viande', 'poulet', 'boeuf', 'veau', 'agneau', 'porc', 'dinde', 'canard',
           'lardon', 'jambon', 'bacon', 'saucisse', 'chorizo', 'steak', 'escalope',
           'poisson', 'saumon', 'thon', 'cabillaud', 'crevette', 'gambas', 'anchois',
           'sardine', 'maquereau', 'moule', 'calamar', 'surimi',
           'oeuf', 'lait', 'beurre', 'creme', 'fromage', 'yaourt', 'parmesan',
           'mozzarella', 'feta', 'chevre', 'miel'],
  },

  sansPorc: {
    nom: 'Sans porc',
    interdit: 'porc et derives, y compris charcuterie et gelatine',
    mots: ['porc', 'lardon', 'jambon', 'bacon', 'saucisson', 'chorizo', 'pancetta',
           'charcuterie', 'gelatine', 'saindoux'],
  },

  sansGluten: {
    nom: 'Sans gluten',
    interdit: 'ble, orge, seigle, et tout ce qui en contient',
    mots: ['ble', 'farine', 'pain', 'pate', 'pates', 'semoule', 'couscous', 'boulgour',
           'orge', 'seigle', 'epeautre', 'chapelure', 'biscotte', 'brioche', 'tortilla'],
  },

  sansLactose: {
    nom: 'Sans lactose',
    interdit: 'lait et produits laitiers non delactoses',
    mots: ['lait', 'beurre', 'creme', 'fromage', 'yaourt', 'parmesan', 'mozzarella',
           'feta', 'ricotta', 'mascarpone', 'creme fraiche'],
  },
}

/** Enlève accents et casse, pour comparer du texte écrit librement. */
function nu(t) {
  return (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Cherche un aliment dans un texte, sur les FRONTIÈRES de mots.
 *
 * Une simple recherche de sous-chaîne ne marche pas ici. « lentilles corail »
 * contient « ail », et refusait donc un plat parfaitement sûr à quelqu'un qui
 * évite l'ail. Un refus injustifié n'est pas anodin : il fait douter de tout
 * le mécanisme, y compris des refus qui, eux, protègent vraiment.
 *
 * Le pluriel est accepté explicitement, et lui seul : « lait » ne doit pas
 * attraper « laitue », alors que « cacahuetes » doit bien correspondre à
 * « cacahuete ».
 */
/**
 * Distance d'edition, plafonnee : on s'arrete des qu'elle depasse `max`.
 * Sert a rattraper une faute de frappe, pas a deviner un synonyme.
 */
function distance(a, b, max = 1) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prec = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cour = [i]
    let mini = i
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1
      cour[j] = Math.min(cour[j - 1] + 1, prec[j] + 1, prec[j - 1] + cout)
      if (cour[j] < mini) mini = cour[j]
    }
    if (mini > max) return max + 1
    prec = cour
  }
  return prec[b.length]
}

function contientAliment(texte, aliment) {
  const m = nu(aliment).trim()
  if (m.length < 3) return false
  const echappe = m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (new RegExp(`\\b${echappe}(s|x|es)?\\b`).test(texte)) return true

  // Rattrapage des fautes de frappe, question de Jean : « on fait comment si
  // l'utilisateur se trompe sur l'orthographe d'un mot ? »
  //
  // Le modele, lui, comprend « choclat » sans aide : la consigne lui part
  // telle quelle. C'est le FILET qui devenait aveugle, donc silencieux au
  // moment ou il compte. Une lettre d'ecart suffit a le rouvrir.
  //
  // Seulement a partir de 5 lettres : en dessous, une lettre d'ecart change
  // le mot (« ail » et « oeil », « riz » et « ris ») et le filet bloquerait
  // des recettes parfaitement valables.
  if (m.length < 5) return false
  return texte.split(/[^a-z0-9]+/).some(
    mot => mot.length >= 5 && distance(mot, m, 1) <= 1,
  )
}

/**
 * Vérifie qu'aucune recette ne contient un aliment interdit.
 *
 * C'est le filet de sécurité, pas le mécanisme principal : c'est la consigne
 * donnée au modèle qui fait le travail. Mais un filet est nécessaire, parce
 * qu'une allergie ignorée n'est pas une maladresse, c'est un danger, et qu'on
 * préfère ne rien servir plutôt que servir approximatif.
 */
/**
 * Tout ce qu'une personne ne mange pas : les mots de son regime, ce qu'elle a
 * ecrit elle-meme, et la FAMILLE de ce qu'elle a ecrit quand elle nomme un
 * aliment qu'un regime connait deja.
 *
 * Ce dernier point corrige un angle mort signale par Jean : quelqu'un qui tape
 * « porc » dans le champ libre sans choisir le regime « sans porc » ne
 * bloquait que le mot « porc ». Le jambon, les lardons et le chorizo
 * passaient, alors que le regime, lui, connait toute la famille.
 */
export function motsInterdits(profil) {
  const prefs = profil?.preferences_alimentaires || {}
  const regime = REGIMES[prefs.regime] || REGIMES.aucun
  const libres = (prefs.evictions || '').split(/[,;]/).map(t => t.trim()).filter(Boolean)

  const familles = []
  for (const mot of libres) {
    const m = nu(mot)
    for (const r of Object.values(REGIMES)) {
      if ((r.mots || []).some(x => nu(x) === m)) familles.push(...r.mots)
    }
  }
  return [...new Set([...libres, ...(regime.mots || []), ...familles])]
    .filter(m => m && m.length >= 3)
}

export function recettesSures(recettes, motsInterdits) {
  if (!motsInterdits?.length) return true
  for (const r of recettes || []) {
    const texte = nu([r.titre, ...(r.ingredients || []), ...(r.etapes || [])].join(' '))
    for (const mot of motsInterdits) {
      if (contientAliment(texte, mot)) return false
    }
  }
  return true
}

/**
 * Trois idées de repas, adaptées au profil et à l'objectif.
 *
 * @param {string} userId
 * @param {object} options
 * @param {string} options.moment  'petit-dejeuner', 'dejeuner' ou 'diner'
 * @returns {Promise<{recettes: Array, momentChoisi: string}>}
 */
export async function genererRecettes(userId, { moment = 'diner' } = {}) {
  const supabase = getSupabase()
  const groq = getGroq()

  const { data: row } = await supabase
    .from('profils').select('profil').eq('user_id', userId).single()

  const profil = row?.profil || {}
  const nom = profil?.nom || profil?.prenom || 'toi'
  const prefs = profil?.preferences_alimentaires || {}
  const objectif = [profil?.objectifs?.[0], profil?.objectif].filter(Boolean)[0] || 'bien-être général'

  // Les interdits : le régime, plus ce que la personne a écrit elle-même.
  const regime = REGIMES[prefs.regime] || REGIMES.aucun
  const evictions = (prefs.evictions || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)

  // Les métriques de la semaine donnent le POURQUOI : c'est ce qui distingue
  // ces idees d'une recherche sur internet.
  const depuis = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const { data: metriques } = await supabase
    .from('user_metrics').select('sommeil, eau, pas, humeur')
    .eq('user_id', userId).gte('date', depuis)

  const moy = cle => {
    const v = (metriques || []).map(m => m[cle]).filter(x => x != null && x > 0)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }
  const constats = []
  const sommeil = moy('sommeil'), eau = moy('eau'), pas = moy('pas'), humeur = moy('humeur')
  if (sommeil && sommeil < 7)  constats.push(`nuits courtes, ${sommeil.toFixed(1)}h en moyenne`)
  if (eau && eau < 6)          constats.push(`peu d'hydratation, ${eau.toFixed(1)} verres par jour`)
  if (pas && pas > 8000)       constats.push(`journees actives, ${Math.round(pas)} pas`)
  if (pas && pas < 4000)       constats.push(`journees tres sedentaires, ${Math.round(pas)} pas`)
  if (humeur && humeur < 3)    constats.push('humeur en baisse cette semaine')

  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    temperature: 0.7,
    max_tokens: 2200,
    messages: [
      {
        role: 'system',
        content: 'Tu es Solenn, coach bien-etre. Tu proposes des idees de repas simples, '
               + 'realisables un soir de semaine. Reponds toujours en JSON valide.',
      },
      {
        role: 'user',
        content: `Propose 3 idees de ${moment} pour ${nom}.

═══ QUI EST ${nom.toUpperCase()} ═══
Objectif principal : ${objectif}
Rythme de vie : ${profil?.rythme || 'non renseigne'}
Foyer : ${profil?.vie || 'non renseigne'}
Niveau d'activite : ${profil?.activite || 'non renseigne'}
${profil?.sante_conditions?.length ? `A PRENDRE EN COMPTE : ${profil.sante_conditions.join(', ')}` : ''}

═══ CE QUE DISENT SES DONNEES CETTE SEMAINE ═══
${constats.length ? constats.join(', ') : 'pas encore assez de donnees'}

═══ CE QU'IL OU ELLE NE MANGE PAS ═══
${regime.interdit ? `Regime ${regime.nom} : PAS DE ${regime.interdit.toUpperCase()}.` : 'Aucun regime particulier.'}
${evictions.length ? `A EVITER ABSOLUMENT, allergies ou degouts : ${evictions.join(', ')}.` : ''}
Ces exclusions ne sont pas des preferences, ce sont des contraintes. Une seule
recette qui les enfreint rend les trois inutilisables.

═══ REGLES NON NEGOCIABLES ═══
1. Le champ "pourquoi" est le coeur de chaque idee. Il relie la recette a CE
   PROFIL precisement : son objectif, ses donnees de la semaine, son rythme.
   « Riche en proteines » ne vaut rien, tout le monde peut l'ecrire.
   « Legere le soir, parce que tes nuits sont courtes en ce moment » vaut
   quelque chose. Si tu ne peux pas relier une recette a cette personne,
   propose-en une autre.
2. INTERDIT ABSOLU : compter les calories, donner des macros, peser les
   aliments, parler de poids ou de kilos, employer les mots regime, ecart,
   craquage, ou brule-graisse. On ne culpabilise jamais.
3. Realisable en semaine : 25 minutes maximum, moins de 10 ingredients, et
   des ingredients qu'on trouve dans n'importe quel supermarche.
4. Les quantites sont dites en portions et en mesures de cuisine (une poignee,
   deux cuilleres, un bol), jamais en grammes.
5. INTERDITS d'ecriture : le tiret cadratin, et les emojis hors du champ
   "emoji". TUTOIE toujours.

Format JSON :
{
  "recettes": [
    {
      "titre": "nom du plat, 5 mots maximum",
      "emoji": "1 emoji",
      "minutes": 20,
      "pourquoi": "1 a 2 phrases qui relient CE plat a CETTE personne",
      "ingredients": ["ingredient et quantite en mesure de cuisine"],
      "etapes": ["etape courte", "etape courte"]
    }
  ]
}`,
      },
    ],
  })

  let recettes = null
  try {
    const brut = res.choices[0].message.content
    const m = brut.match(/\{[\s\S]*\}/)
    if (m) recettes = JSON.parse(m[0])?.recettes || null
  } catch (e) {
    console.warn('[Recettes] JSON illisible :', e.message)
  }

  if (!Array.isArray(recettes) || !recettes.length) {
    throw new Error("Les idees de repas n'ont pas abouti. Reessaie dans un instant.")
  }
  recettes = recettes.filter(r => r?.titre && r?.pourquoi && Array.isArray(r.ingredients))
  if (!recettes.length) throw new Error('Idees de repas incompletes.')

  // Le controle de securite. On prefere ne rien servir plutot que de servir
  // une recette qui contient ce que la personne ne peut pas manger.
  // Les mots du regime, et non un decoupage de sa phrase : « viande et
  // poisson » se coupait en deux mots que le modele n'ecrit jamais.
  // Une seule definition de « ce qu'elle ne mange pas », partagee avec la
  // route qui relit le cache. Deux listes qui divergent, c'est une recette
  // filtree a la generation et servie sans controle le lendemain.
  const interdits = motsInterdits(profil)

  if (!recettesSures(recettes, interdits)) {
    console.warn('[Recettes] generation rejetee : un interdit alimentaire est present')
    throw new Error("Une des idees ne respectait pas tes exclusions. Relance, Solenn recommence.")
  }

  // Garde en cache dans le profil : ces idees valent pour la journee, et les
  // regenerer a chaque ouverture de l'onglet coute un appel pour rien.
  try {
    const maj = {
      ...profil,
      recettes_cache: {
        date: new Date().toISOString().split('T')[0],
        moment,
        liste: recettes,
      },
    }
    await supabase.from('profils').upsert(
      { user_id: userId, profil: maj }, { onConflict: 'user_id' },
    )
  } catch (e) {
    // Le cache est un confort. Son echec ne doit pas priver des recettes.
  }

  return { recettes, momentChoisi: moment }
}

export default { genererRecettes, REGIMES, recettesSures }
