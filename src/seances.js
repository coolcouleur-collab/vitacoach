// ─────────────────────────────────────────────────────────────────────────────
// LES SÉANCES FAITES
//
// L'écran de course proposait « Enregistrer cette sortie », et n'enregistrait
// rien. Le bouton fermait l'écran. Aucune félicitation, aucune trace, aucun
// chiffre qui bouge quelque part. Quelqu'un qui vient de courir vingt minutes
// et qui ne voit rien se passer ne recommence pas, et il a raison.
//
// Ce fichier est l'endroit qui manquait.
//
// Où c'est stocké, et pourquoi là : dans le profil, en JSON, et pas dans une
// table dédiée. Une table serait plus propre, mais elle demanderait une
// migration à passer à la main dans Supabase, donc une action de Jean, donc
// une fonctionnalité à moitié livrée en attendant. Le profil est déjà écrit de
// cette façon ailleurs (le cache de recettes, la mémoire longue), il est lu à
// chaque ouverture, et il suffit largement pour quelques centaines de séances.
// Si ça devient une vraie table un jour, seul ce fichier changera.
//
// La liste est plafonnée. Sans plafond, le profil grossit indéfiniment et
// finit par ralentir chaque chargement de l'app pour des séances que personne
// ne regardera jamais.
// ─────────────────────────────────────────────────────────────────────────────

/** Combien de séances on garde. Deux ans à trois séances par semaine. */
const PLAFOND = 300

export const TYPES_SEANCE = {
  course: {
    id: 'course',
    nom: 'Course à pied',
    verbe: 'Sortie enregistrée',
    emoji: '🏃',
    mesureDistance: true,
  },
  marche: {
    id: 'marche',
    nom: 'Marche',
    verbe: 'Marche enregistrée',
    emoji: '🚶',
    mesureDistance: true,
  },
  seance: {
    id: 'seance',
    nom: 'Séance du programme',
    verbe: 'Séance enregistrée',
    emoji: '💪',
    mesureDistance: false,
  },
}

/** La liste, toujours un tableau, du plus récent au plus ancien. */
export function lireSeances(profil) {
  const l = profil?.seances
  return Array.isArray(l) ? l : []
}

/**
 * Ajoute une séance à la liste, sans écrire nulle part.
 *
 * Séparé de l'écriture pour être vérifiable sans base de données : c'est ici
 * que vivent le plafond et le dédoublonnage.
 *
 * @param {Array}  liste   les séances déjà connues
 * @param {object} seance  { type, debut, fin, dureeMs, metres?, exercices? }
 */
export function ajouterSeance(liste, seance) {
  const propre = {
    id: `${seance.type || 'seance'}-${seance.debut || Date.now()}`,
    type: TYPES_SEANCE[seance.type] ? seance.type : 'seance',
    debut: Number(seance.debut) || Date.now(),
    fin: Number(seance.fin) || Date.now(),
    dureeMs: Math.max(0, Number(seance.dureeMs) || 0),
    metres: Math.max(0, Math.round(Number(seance.metres) || 0)),
    exercices: Math.max(0, Number(seance.exercices) || 0),
    jour: seance.jour ?? null,
  }

  // Une seance de moins de trente secondes est un faux depart : quelqu'un a
  // ouvert l'ecran et l'a referme. L'enregistrer polluerait les totaux et
  // ferait afficher des felicitations pour rien.
  if (propre.dureeMs < 30000) return { liste, ajoutee: null, motif: 'trop courte' }

  // Le meme identifiant deux fois, c'est un double appui sur le bouton
  // d'enregistrement, ou un retour arriere. On ne compte pas deux fois.
  const existantes = Array.isArray(liste) ? liste : []
  if (existantes.some(s => s.id === propre.id)) {
    return { liste: existantes, ajoutee: null, motif: 'deja enregistree' }
  }

  // On TRIE avant de plafonner, au lieu de supposer que la liste est deja
  // dans le bon ordre. L'hypothese tient tant que les seances arrivent l'une
  // apres l'autre ; elle tombe des qu'une seance ancienne est ajoutee apres
  // coup, et le plafond jetterait alors la plus recente au lieu de la plus
  // vieille. Trier coute quelques microsecondes, se tromper coute une seance.
  const triee = [propre, ...existantes].sort((a, b) => b.debut - a.debut)

  return {
    liste: triee.slice(0, PLAFOND),
    ajoutee: propre,
    motif: 'ajoutee',
  }
}

/**
 * Ce qu'on a fait sur les N derniers jours.
 * Sert aux félicitations juste après l'effort, et à la page Progrès.
 */
export function statsSeances(liste, jours = 7, maintenant = Date.now()) {
  const depuis = maintenant - jours * 86400000
  const dans = (Array.isArray(liste) ? liste : []).filter(s => s.debut >= depuis)

  const total = { seances: dans.length, minutes: 0, metres: 0 }
  const parType = {}

  for (const s of dans) {
    total.minutes += Math.round(s.dureeMs / 60000)
    total.metres += s.metres || 0
    const t = parType[s.type] || (parType[s.type] = { seances: 0, minutes: 0, metres: 0 })
    t.seances += 1
    t.minutes += Math.round(s.dureeMs / 60000)
    t.metres += s.metres || 0
  }

  return { total, parType, jours }
}

/**
 * Combien de jours d'affilée, en finissant aujourd'hui ou hier.
 *
 * On accepte de partir d'hier, volontairement : quelqu'un qui a couru hier
 * soir et ouvre l'app ce matin a toujours sa série. La casser à minuit
 * punirait le fait de ne pas encore avoir bougé, à 8h du matin.
 */
export function serieSeances(liste, maintenant = Date.now()) {
  const jours = new Set(
    (Array.isArray(liste) ? liste : []).map(s => new Date(s.debut).toDateString()),
  )
  if (!jours.size) return 0

  const jour = d => new Date(maintenant - d * 86400000).toDateString()
  let depart = jours.has(jour(0)) ? 0 : jours.has(jour(1)) ? 1 : -1
  if (depart < 0) return 0

  let n = 0
  while (jours.has(jour(depart + n))) n++
  return n
}

/** Toutes les séances d'un jour donné, pour l'écran du programme. */
export function seancesDuJour(liste, maintenant = Date.now()) {
  const cible = new Date(maintenant).toDateString()
  return (Array.isArray(liste) ? liste : [])
    .filter(s => new Date(s.debut).toDateString() === cible)
}

/**
 * Écrit la séance dans le profil, en base et en local.
 *
 * Relit le profil avant d'écrire : deux écrans peuvent enregistrer à quelques
 * secondes d'intervalle, et écrire à partir d'une copie en mémoire effacerait
 * ce que l'autre vient de poser.
 *
 * @returns {Promise<{ok: boolean, seance: object|null, stats: object, serie: number}>}
 */
export async function enregistrerSeance(userId, seance) {
  const vide = { ok: false, seance: null, stats: statsSeances([]), serie: 0 }
  if (!userId) return vide

  try {
    const m = await import('./supabase')
    const { data } = await m.supabase
      .from('profils').select('profil').eq('user_id', userId).single()

    const profil = data?.profil || {}
    const { liste, ajoutee } = ajouterSeance(lireSeances(profil), seance)
    if (!ajoutee) {
      return { ok: false, seance: null, stats: statsSeances(liste), serie: serieSeances(liste) }
    }

    const maj = { ...profil, seances: liste }
    await m.supabase.from('profils').upsert(
      { user_id: userId, profil: maj }, { onConflict: 'user_id' },
    )

    // La copie locale suit, sinon l'app affiche l'ancien total jusqu'au
    // prochain rechargement complet.
    try {
      const local = JSON.parse(localStorage.getItem('vitacoach_profil') || '{}')
      localStorage.setItem('vitacoach_profil', JSON.stringify({ ...local, seances: liste }))
    } catch {}

    return { ok: true, seance: ajoutee, stats: statsSeances(liste), serie: serieSeances(liste) }
  } catch (e) {
    return vide
  }
}

export default {
  TYPES_SEANCE, lireSeances, ajouterSeance, statsSeances,
  serieSeances, seancesDuJour, enregistrerSeance,
}
