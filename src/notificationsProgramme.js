// ─────────────────────────────────────────────────────────────────────────────
// LES RAPPELS DU PROGRAMME
//
// L'app savait déjà envoyer des notifications, mais depuis le serveur, par
// Firebase et APNs. Ce sont les bonnes pour annoncer une nouveauté à tout le
// monde. Ce sont les mauvaises pour dire « il est 18h, ta séance t'attend » :
// elles supposent un serveur éveillé, une clé Apple valide, et du réseau.
//
// Ici les rappels sont posés SUR le téléphone, à l'avance. Ils partent même
// en avion, même si Render dort, même si la clé expire.
//
// Deux contraintes commandent tout le fichier :
//
//   1. iOS ne garde que 64 notifications en attente. Poser 42 jours fois deux
//      rappels en dépasse, et iOS jette silencieusement le surplus : les
//      derniers jours du programme n'auraient jamais sonné, sans erreur ni
//      trace. On pose donc une FENÊTRE GLISSANTE de quelques jours, reposée à
//      chaque ouverture de l'app.
//
//   2. Un rappel pour un moment déjà passé se déclenche immédiatement sur
//      Android. Sans filtre, ouvrir l'app à 21h ferait sonner d'un coup tous
//      les rappels du matin de la semaine.
// ─────────────────────────────────────────────────────────────────────────────

/** Combien de jours à l'avance on pose les rappels. Voir contrainte 1. */
const FENETRE_JOURS = 10

/** Les identifiants sont réservés dans cette plage, pour n'annuler que les nôtres. */
const ID_BASE = 41000

const CLE_PREFS = 'solenn_rappels'

/** Réglages par défaut : un rappel le matin, un en fin d'après midi. */
export const PREFS_DEFAUT = {
  actif: true,
  heureMatin: 8,     // l'action du jour
  heureSeance: 18,   // la séance, si le jour en porte une
}

export function lirePrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(CLE_PREFS) || 'null')
    return p && typeof p === 'object' ? { ...PREFS_DEFAUT, ...p } : { ...PREFS_DEFAUT }
  } catch {
    return { ...PREFS_DEFAUT }
  }
}

export function ecrirePrefs(p) {
  try { localStorage.setItem(CLE_PREFS, JSON.stringify({ ...lirePrefs(), ...p })) } catch {}
}

/** Le module natif, ou null sur le web. Chargé à la demande. */
async function plugin() {
  try {
    if (!window?.Capacitor?.isNativePlatform?.()) return null
    const m = await import('@capacitor/local-notifications')
    return m.LocalNotifications || null
  } catch {
    return null
  }
}

/**
 * Demande l'autorisation d'envoyer des rappels.
 * @returns {Promise<boolean>} accordée ou non. Faux sur le web, sans erreur.
 */
export async function demanderAutorisation() {
  const N = await plugin()
  if (!N) return false
  try {
    const deja = await N.checkPermissions()
    if (deja.display === 'granted') return true
    // On ne redemande pas ce qui a ete refuse : iOS ne reaffiche plus la
    // fenetre, l'appel echoue en silence, et l'app croirait avoir demande.
    if (deja.display === 'denied') return false
    const rep = await N.requestPermissions()
    return rep.display === 'granted'
  } catch {
    return false
  }
}

/** L'autorisation est-elle déjà accordée ? Ne déclenche aucune fenêtre. */
export async function autorisationAccordee() {
  const N = await plugin()
  if (!N) return false
  try { return (await N.checkPermissions()).display === 'granted' } catch { return false }
}

/** Le n-ième jour du programme, à telle heure, en date réelle. */
function momentDuJour(dateDebut, numeroJour, heure) {
  const d = new Date(dateDebut)
  d.setDate(d.getDate() + (numeroJour - 1))
  d.setHours(heure, 0, 0, 0)
  return d
}

/**
 * Construit la liste des rappels à poser. Séparé de l'envoi pour être
 * vérifiable sans téléphone : c'est ici que vivent les deux contraintes.
 *
 * @param {object} challenge  la ligne de `challenges` (date_debut, challenge)
 * @param {object} prefs
 * @param {number} maintenant horodatage, injecté pour pouvoir tester
 * @returns {Array} les notifications, prêtes à être envoyées
 */
export function construireRappels(challenge, prefs = lirePrefs(), maintenant = Date.now()) {
  if (!prefs?.actif || !challenge?.date_debut) return []

  const jours = challenge?.challenge?.jours || []
  const progression = challenge?.progression || []
  const titreProg = challenge?.challenge?.titre || 'Ton programme'
  if (!jours.length) return []

  const debut = new Date(challenge.date_debut)
  const ecoules = Math.floor((maintenant - debut.getTime()) / 86400000)
  const jourCourant = Math.max(1, ecoules + 1)

  const sortie = []

  for (let n = jourCourant; n < jourCourant + FENETRE_JOURS && n <= jours.length; n++) {
    const jour = jours[n - 1]
    if (!jour) continue
    // Un jour deja valide n'a pas a etre rappele : la notification arriverait
    // pour reclamer quelque chose qui est fait, ce qui est la meilleure facon
    // de faire couper les rappels.
    if (progression[n - 1]) continue

    const matin = momentDuJour(debut, n, prefs.heureMatin)
    if (matin.getTime() > maintenant) {
      sortie.push({
        id: ID_BASE + n * 2,
        title: titreProg,
        body: `Jour ${n} : ${jour.titre || jour.action || 'ton rendez vous du jour'}`,
        // isExactNotification false : sans lui, le plugin reclame une alarme
        // exacte, donc la permission SCHEDULE_EXACT_ALARM que Google examine.
        // allowWhileIdle reste vrai, il traverse la veille profonde sans elle.
        schedule: { at: matin, allowWhileIdle: true },
        isExactNotification: false,
      })
    }

    if (jour.seance?.length) {
      const soir = momentDuJour(debut, n, prefs.heureSeance)
      if (soir.getTime() > maintenant) {
        const nb = jour.seance.length
        sortie.push({
          id: ID_BASE + n * 2 + 1,
          title: 'Ta séance t\'attend',
          body: `${nb} exercice${nb > 1 ? 's' : ''} aujourd'hui. Une quinzaine de minutes.`,
          schedule: { at: soir, allowWhileIdle: true },
          isExactNotification: false,
        })
      }
    }
  }

  return sortie
}

/**
 * Repose tous les rappels du programme. À appeler à chaque ouverture de l'app
 * et après chaque changement de programme : c'est ce qui fait avancer la
 * fenêtre glissante.
 *
 * @returns {Promise<number>} combien de rappels sont posés
 */
export async function reposerRappels(challenge) {
  const N = await plugin()
  if (!N) return 0
  if (!(await autorisationAccordee())) return 0

  try {
    await annulerRappels()
    const liste = construireRappels(challenge)
    if (liste.length) await N.schedule({ notifications: liste })
    return liste.length
  } catch {
    return 0
  }
}

/** Retire nos rappels, et uniquement les nôtres. */
export async function annulerRappels() {
  const N = await plugin()
  if (!N) return
  try {
    const { notifications } = await N.getPending()
    // On filtre sur NOTRE plage d'identifiants. Tout annuler emporterait les
    // notifications des autres parties de l'app.
    const miennes = (notifications || [])
      .filter(n => n.id >= ID_BASE && n.id < ID_BASE + 10000)
      .map(n => ({ id: n.id }))
    if (miennes.length) await N.cancel({ notifications: miennes })
  } catch {}
}

export default { demanderAutorisation, reposerRappels, annulerRappels, construireRappels }
