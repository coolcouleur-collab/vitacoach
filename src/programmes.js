// ─────────────────────────────────────────────────────────────────────────────
// LE CATALOGUE DES PROGRAMMES
//
// Jusqu'ici l'onglet s'appelait « Programme » et n'en contenait qu'un seul, le
// défi 21 jours, arrivé sans qu'on ait jamais dit à qui il s'adressait ni ce
// qu'il promettait. On appuyait sur un bouton, une IA fabriquait 21 jours, et
// c'était tout.
//
// Ce fichier renverse l'ordre : on choisit d'abord un programme en sachant ce
// qu'il vise, pour qui il est fait, combien de temps il dure et ce qu'on peut
// en attendre. La génération vient après, et elle est guidée par ce choix.
//
// Tout ce qui est ici est ÉCRIT À LA MAIN, volontairement. Une promesse
// générée change à chaque appel : elle ne peut pas engager. Une promesse
// écrite tient, se relit, et se corrige.
//
// Règles d'écriture tenues dans tout le fichier :
//   · tutoiement, jamais de vouvoiement
//   · aucun accord genré, Solenn s'adresse aux hommes comme aux femmes
//   · aucun tiret cadratin
//   · aucune promesse chiffrée sur le corps, aucune allégation médicale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un programme du catalogue.
 *
 * @typedef  {object} Programme
 * @property {string}   id           clé stable, stockée dans le plan généré
 * @property {string}   titre        le nom affiché
 * @property {string}   emoji        un seul, pour la vignette
 * @property {string}   accroche     une ligne, ce que ça change
 * @property {number}   duree        en jours
 * @property {string}   rythme       à quoi ressemble une semaine type
 * @property {string}   pourquoi     le mécanisme, pas le slogan
 * @property {string[]} pourQui      les situations où il est pertinent
 * @property {string[]} pasPourToi   les situations où il ne l'est pas
 * @property {string[]} resultats    ce qu'on peut attendre en s'y tenant
 * @property {string}   consigne     ce qui est injecté dans le générateur
 * @property {string[]} exclusions   clés de sante_flags qui déclenchent un avis
 */

import { SITUATIONS } from './contreIndications.js'

export const PROGRAMMES = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'alimentaire',
    titre: 'Rééquilibrage alimentaire',
    emoji: '🥗',
    accroche: "Remettre de l'ordre dans les assiettes, sans rien compter.",
    duree: 28,
    rythme: "Un geste par jour, dans les repas que tu fais déjà. Pas de menus imposés, pas de plats à part.",

    pourquoi:
      "La plupart des régimes échouent pour la même raison : ils demandent de tout changer d'un coup, " +
      "et le retour à la normale annule tout. Ce programme fait l'inverse. Il installe un changement à la " +
      "fois, en le gardant assez petit pour qu'il survive à une semaine difficile. Au bout de quatre " +
      "semaines, ce ne sont pas des règles que tu suis, ce sont des réflexes que tu as pris.",

    pourQui: [
      "Tu manges correctement mais sans structure, et ça part en vrille dès que la semaine se complique",
      "Tu grignotes en fin de journée sans faim réelle",
      "Tu as déjà essayé plusieurs régimes et tu as repris à chaque fois",
      "Tu veux savoir quoi mettre dans ton assiette sans peser quoi que ce soit",
    ],

    pasPourToi: [
      "Tu suis un régime prescrit par un médecin ou un diététicien : garde le sien, celui-ci n'a pas à s'y superposer",
      "Tu as ou tu as eu un trouble du comportement alimentaire : ce programme parle d'aliments, et ce n'est pas ce dont tu as besoin en premier",
    ],

    resultats: [
      "Des repas plus stables, et la fin des coups de barre de l'après midi",
      "Moins d'envies de sucre en soirée, parce que les journées cessent d'être creuses",
      "Savoir composer une assiette correcte sans y penser, y compris au restaurant",
      "Une digestion plus tranquille, souvent visible dès la deuxième semaine",
    ],

    consigne:
      "Ce programme porte sur l'ALIMENTATION. Chaque jour porte un geste alimentaire concret et " +
      "unique, appliqué aux repas que la personne fait déjà. INTERDIT ABSOLU : compter les calories, " +
      "peser les aliments, imposer des menus, interdire un aliment, parler de poids ou de kilos, " +
      "employer les mots régime, écart, ou craquage. On ajoute avant de retirer. " +
      "Semaine 1 : la structure des repas et le petit déjeuner. Semaine 2 : les légumes et les fibres. " +
      "Semaine 3 : les protéines et la satiété. Semaine 4 : les situations difficiles, " +
      "restaurant, invitations, journées débordées. Le mouvement reste secondaire : au maximum une " +
      "marche, jamais de séance construite, et le champ seance reste null presque partout.",

    exclusions: ['diabete', 'ulcere', 'renal', 'grossesse', 'allaitement'],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'sportif',
    titre: 'Remise en mouvement',
    emoji: '💪',
    accroche: "Reconstruire une base physique, à partir de là où tu en es vraiment.",
    duree: 42,
    rythme: "Quatre séances par semaine, de quinze à trente minutes, chez toi et sans matériel. Trois jours de repos, prévus et non négociables.",

    pourquoi:
      "Reprendre le sport rate presque toujours au même endroit : la première semaine est trop " +
      "ambitieuse, les courbatures arrivent, et l'élan retombe. Six semaines sont le minimum pour " +
      "qu'un corps s'adapte réellement, et l'adaptation se fait pendant le repos, pas pendant l'effort. " +
      "Le programme monte donc lentement, et il te force à te reposer.",

    pourQui: [
      "Tu n'as pas bougé sérieusement depuis des mois, voire des années",
      "Tu montes un escalier et tu le sens passer",
      "Tu as déjà repris trois fois et arrêté trois fois",
      "Tu ne veux ni salle de sport, ni matériel, ni public",
    ],

    pasPourToi: [
      "Tu t'entraînes déjà plusieurs fois par semaine : le début te paraîtra trop facile",
      "Tu as une douleur en cours, au dos, à un genou ou à une épaule : fais la voir avant, ce programme ne diagnostique rien",
    ],

    resultats: [
      "Monter les escaliers sans être essoufflé, généralement vers la troisième semaine",
      "Des courbatures qui s'espacent, signe que le corps a rattrapé le rythme",
      "Un sommeil plus profond, effet le plus rapide de la reprise du mouvement",
      "Tenir une séance complète sans t'arrêter, ce qui était impossible au jour 1",
    ],

    consigne:
      "Ce programme porte sur le MOUVEMENT. Presque chaque jour actif porte une séance de 2 à 4 " +
      "exercices avec des répétitions chiffrées. Quatre jours actifs et trois jours de repos par " +
      "semaine, et les jours de repos sont explicitement nommés comme tels, avec une phrase qui " +
      "explique que la progression se fait là. Semaines 1 et 2 : mobilité et gestes de base, " +
      "intensité volontairement basse. Semaines 3 et 4 : montée du volume. Semaines 5 et 6 : " +
      "intensité et enchaînements. Alterne haut du corps et bas du corps, jamais deux jours de " +
      "suite sur la même zone. Le conseil nutrition reste court et tourné vers la récupération.",

    exclusions: ['cardiaque', 'grossesse', 'chirurgie', 'epilepsie'],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'defi21',
    titre: 'Défi 21 jours',
    emoji: '🔥',
    accroche: "Trois semaines pour relancer une dynamique, sur tous les fronts à la fois.",
    duree: 21,
    rythme: "Une action par jour, dix à vingt minutes. Le thème change chaque jour : mouvement, sommeil, assiette, respiration.",

    pourquoi:
      "Les autres programmes creusent un sujet. Celui ci en balaye plusieurs, et il sert à autre " +
      "chose : retrouver la sensation de tenir quelque chose. Vingt et un jours, c'est assez long " +
      "pour que ça compte et assez court pour qu'on voie la fin depuis le début. C'est le bon " +
      "programme quand tu ne sais pas encore par où prendre les choses.",

    pourQui: [
      "Tu veux t'y remettre sans savoir par quel bout commencer",
      "Tu as besoin d'un cadre court avant de t'engager sur plus long",
      "Tu tournes en rond depuis un moment et tu cherches un point de départ",
      "Tu as déjà fait un cycle et tu veux enchaîner à un niveau au dessus",
    ],

    pasPourToi: [
      "Tu as un objectif précis et unique : un programme dédié ira plus loin sur ce sujet",
    ],

    resultats: [
      "Une série de jours tenus, et la preuve pour toi même que tu en es capable",
      "Un repérage clair de ce qui marche chez toi et de ce qui ne prend pas",
      "Les premiers effets sur l'énergie de la journée, le plus souvent en semaine 2",
      "De quoi choisir ensuite un programme long en connaissance de cause",
    ],

    consigne:
      "Ce programme est GÉNÉRALISTE et VARIÉ. Répartis les 21 jours sur cinq thèmes : mouvement, " +
      "sommeil, alimentation, respiration ou mental, et récupération. Aucun thème ne doit dépasser " +
      "un tiers des jours. Un jour de récupération plus léger tous les trois à quatre jours.",

    exclusions: [],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'sommeil',
    titre: 'Sommeil et énergie',
    emoji: '🌙',
    accroche: "Réparer les nuits pour récupérer les journées.",
    duree: 21,
    rythme: "Deux rendez vous par jour, un le soir et un au réveil. Le soir prend dix minutes, le matin en prend deux.",

    pourquoi:
      "Une mauvaise nuit ne se répare pas le soir même, elle se prépare la veille au matin. " +
      "L'horloge interne se règle sur la lumière du réveil et sur la régularité des heures de lever, " +
      "bien plus que sur l'heure du coucher. C'est pour ça que ce programme agit sur les deux bouts " +
      "de la journée, et pas seulement sur le rituel du soir.",

    pourQui: [
      "Tu mets longtemps à t'endormir, ou tu te réveilles au milieu de la nuit",
      "Tu dors des heures correctes et tu te lèves quand même fatigué",
      "Tes horaires de coucher partent dans tous les sens d'un jour à l'autre",
      "Le coup de barre de l'après midi te coûte ta fin de journée",
    ],

    pasPourToi: [
      "Tu ronfles fort et tu as des pauses respiratoires la nuit : c'est un sujet médical, parles en à un médecin",
      "Tu travailles en horaires décalés ou de nuit : le programme suppose des journées régulières",
    ],

    resultats: [
      "Un endormissement plus court, souvent perceptible dès la première semaine",
      "Des heures de lever stables, ce qui est la vraie cause du reste",
      "Des réveils nocturnes plus rares, effet plutôt attendu en semaine 3",
      "Une baisse du coup de barre de l'après midi",
    ],

    consigne:
      "Ce programme porte sur le SOMMEIL et sur l'ÉNERGIE. Chaque jour porte deux actions, une le " +
      "soir et une au réveil, et le champ action les décrit toutes les deux. Semaine 1 : régularité " +
      "de l'heure de lever et lumière du matin. Semaine 2 : la soirée, les écrans, la lumière, la " +
      "température, les excitants. Semaine 3 : les réveils nocturnes et la récupération de la " +
      "journée. Le mouvement se limite à de la marche et à des étirements doux le soir, jamais " +
      "d'intensité après 18h, et tu l'expliques. Le conseil nutrition porte sur le dîner, la " +
      "caféine et l'alcool.",

    exclusions: ['sedatifs', 'bipolaire'],
  },
]

/** Retrouve un programme par sa clé. */
export function programmeParId(id) {
  return PROGRAMMES.find(p => p.id === id) || null
}

/**
 * Croise un programme avec les situations déclarées à l'inscription.
 *
 * Même principe que le croisement des fiches de Soins : on signale, on
 * n'interdit pas, et on renvoie vers un professionnel. La différence est
 * qu'ici les mots ne sont pas cherchés dans un texte, ils sont déclarés
 * explicitement dans `exclusions`, donc la correspondance est exacte.
 *
 * Les libellés viennent de SITUATIONS et de nulle part ailleurs : c'est la
 * même liste qui a servi à poser les questions d'inscription, donc la phrase
 * affichée reprend forcément les mots que la personne a lus en cochant.
 *
 * @param {object} profil     le profil, dont `sante_flags` porte les situations
 * @param {object} programme  une entrée du catalogue
 * @returns {{cles: string[], raisons: string[], phrase: string} | null}
 */
export function avisProgramme(profil, programme) {
  const declare = profil?.sante_flags || {}
  const cles = (programme?.exclusions || []).filter(cle => declare[cle])
  if (!cles.length) return null

  const raisons = cles
    .map(cle => SITUATIONS.find(s => s.cle === cle)?.libelle)
    .filter(Boolean)

  const liste = raisons.length === 1
    ? raisons[0]
    : raisons.slice(0, -1).join(', ') + ' et ' + raisons[raisons.length - 1]

  return {
    cles,
    raisons,
    phrase: `Tu as indiqué ${liste}. Ce programme n'est pas adapté tel quel : `
          + `demande l'avis de ton médecin avant de le commencer.`,
  }
}

export default PROGRAMMES
