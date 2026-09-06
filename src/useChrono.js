// ─────────────────────────────────────────────────────────────────────────────
// LE CHRONOMÈTRE
//
// Un chronomètre écrit naïvement en JavaScript compte des battements :
// toutes les secondes, il ajoute une seconde. Sur un téléphone, ça ne marche
// pas. Dès que l'écran se verrouille ou que l'app passe en arrière plan, le
// système suspend les minuteurs, et le compteur s'arrête sans que personne
// ne le sache. Au retour, il affiche 4 minutes pour une course de 25.
//
// C'est LA faute des chronomètres d'application hybride, et elle est invisible
// pendant tout le développement, parce que sur un ordinateur l'onglet reste
// éveillé.
//
// Ici le temps n'est jamais additionné. Il est toujours RECALCULÉ à partir
// d'un horodatage de départ : `maintenant - depart + cumul`. Le minuteur ne
// sert qu'à redessiner l'écran. Qu'il rate cent battements ou aucun,
// l'affichage reste exact, parce que la valeur ne vient pas de lui.
//
// Deuxième conséquence : l'état vit dans localStorage. Si le système tue
// l'application pendant la course, la séance est retrouvée au démarrage
// suivant, avec le bon temps écoulé.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'

const CLE = 'solenn_chrono'

/** Lit l'état sauvegardé, en se méfiant de tout ce qui vient du disque. */
function lireEtat(cle) {
  try {
    const brut = JSON.parse(localStorage.getItem(cle) || 'null')
    if (!brut || typeof brut !== 'object') return null
    if (!['arret', 'encours', 'pause'].includes(brut.statut)) return null
    if (typeof brut.cumul !== 'number' || brut.cumul < 0) return null
    // Un depart dans le futur signifie que l'horloge du telephone a recule
    // (changement de fuseau, mise a l'heure). On repart de zero plutot que
    // d'afficher un temps negatif.
    if (brut.statut === 'encours' && (typeof brut.depart !== 'number' || brut.depart > Date.now())) return null
    return brut
  } catch {
    return null
  }
}

const ARRET = { statut: 'arret', depart: null, cumul: 0, debutSeance: null }

/**
 * Un chronomètre qui survit au verrouillage de l'écran.
 *
 * @param {object}  options
 * @param {string}  options.cle       pour faire tourner deux chronomètres distincts
 * @param {boolean} options.reprendre reprendre une séance retrouvée au démarrage
 * @returns {{
 *   ms: number, secondes: number, texte: string, statut: string,
 *   enCours: boolean, demarrer: function, pause: function,
 *   reprise: function, arreter: function, debutSeance: number|null
 * }}
 */
export function useChrono({ cle = CLE, reprendre = true } = {}) {
  const [etat, setEtat] = useState(() => (reprendre ? lireEtat(cle) : null) || ARRET)

  // Ce compteur ne sert QU'A redessiner. Il ne porte aucune valeur de temps :
  // c'est tout l'interet du montage, un battement rate ne coute rien.
  const [, redessiner] = useState(0)
  const timer = useRef(null)

  // Ecriture sur disque a chaque changement d'etat, jamais a chaque battement.
  useEffect(() => {
    try {
      if (etat.statut === 'arret') localStorage.removeItem(cle)
      else localStorage.setItem(cle, JSON.stringify(etat))
    } catch {}
  }, [etat, cle])

  useEffect(() => {
    if (etat.statut !== 'encours') {
      if (timer.current) { clearInterval(timer.current); timer.current = null }
      return
    }
    // 250 ms et non 1000 : au retour d'arriere plan, l'ecran se remet a jour
    // en un quart de seconde au lieu d'afficher une valeur perimee pendant
    // presque une seconde entiere.
    timer.current = setInterval(() => redessiner(n => n + 1), 250)
    return () => { if (timer.current) { clearInterval(timer.current); timer.current = null } }
  }, [etat.statut])

  // Le retour au premier plan force un redessin immediat. Sans ca, l'ecran
  // garde la valeur d'avant le verrouillage pendant le temps d'un battement,
  // et on voit le chiffre sauter, ce qui donne l'impression d'un bug alors
  // que le calcul, lui, a toujours ete juste.
  useEffect(() => {
    const reveil = () => redessiner(n => n + 1)
    document.addEventListener('visibilitychange', reveil)
    window.addEventListener('focus', reveil)
    window.addEventListener('pageshow', reveil)
    return () => {
      document.removeEventListener('visibilitychange', reveil)
      window.removeEventListener('focus', reveil)
      window.removeEventListener('pageshow', reveil)
    }
  }, [])

  // L'etat, lisible SYNCHRONEMENT. `arreter` doit rendre le total tout de
  // suite, a l'appelant qui va l'enregistrer. En passant par l'updater de
  // setEtat, il lisait une valeur ecrite plus tard par React et rendait
  // toujours zero : le bilan de seance affichait 00:00 apres huit minutes
  // d'effort. Constate a l'ecran, pas devine.
  const etatRef = useRef(etat)
  etatRef.current = etat

  const ms = etat.statut === 'encours'
    ? etat.cumul + Math.max(0, Date.now() - etat.depart)
    : etat.cumul

  const demarrer = useCallback(() => {
    const t = Date.now()
    console.log('[chrono] demarrer', new Date(t).toISOString())
    setEtat({ statut: 'encours', depart: t, cumul: 0, debutSeance: t })
  }, [])

  const pause = useCallback(() => {
    setEtat(e => e.statut !== 'encours' ? e : {
      ...e, statut: 'pause', depart: null,
      cumul: e.cumul + Math.max(0, Date.now() - e.depart),
    })
  }, [])

  const reprise = useCallback(() => {
    setEtat(e => e.statut !== 'pause' ? e : { ...e, statut: 'encours', depart: Date.now() })
  }, [])

  /** Arrête et rend le total, pour l'enregistrer avant que l'état soit effacé. */
  const arreter = useCallback(() => {
    const e = etatRef.current
    const total = e.statut === 'encours'
      ? e.cumul + Math.max(0, Date.now() - e.depart)
      : e.cumul
    console.log('[chrono] arreter', e.statut, 'total ms', total)
    setEtat(ARRET)
    return total
  }, [])

  return {
    ms,
    secondes: Math.floor(ms / 1000),
    texte: formater(ms),
    statut: etat.statut,
    enCours: etat.statut === 'encours',
    debutSeance: etat.debutSeance,
    demarrer, pause, reprise, arreter,
  }
}

/**
 * mm:ss, et hh:mm:ss au delà de l'heure.
 * Les chiffres sont destinés à être affichés en tabular-nums, sinon la
 * largeur du 1 fait sautiller tout le compteur à chaque seconde.
 */
export function formater(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const d2 = n => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${d2(m)}:${d2(s)}` : `${d2(m)}:${d2(s)}`
}

/** Y a-t-il une séance interrompue à reprendre ? */
export function seanceEnAttente(cle = CLE) {
  const e = lireEtat(cle)
  return e && e.statut !== 'arret' ? e : null
}

export default useChrono
