// ─────────────────────────────────────────────────────────────────────────────
// LA COURSE SUR L'ÉCRAN DE VEILLE
//
// Façade au dessus du service Android, et point d'accroche pour l'iOS quand sa
// Live Activity sera compilée sur un Mac.
//
// Tout est optionnel, par conception : sur le web, sur un appareil qui refuse,
// ou tant que la permission de position fine n'est pas accordée, ces appels ne
// font rien et ne lèvent rien. Une course doit pouvoir se dérouler entièrement
// sans écran de veille. C'est un confort, jamais une dépendance.
// ─────────────────────────────────────────────────────────────────────────────

import { Capacitor, registerPlugin } from '@capacitor/core'

const EcranDeVeille = registerPlugin('EcranDeVeille')

function androidNatif() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

/** Cet appareil sait-il tenir la course à l'écran verrouillé ? */
export async function veilleDisponible() {
  if (!androidNatif()) return false
  try {
    const r = await EcranDeVeille.disponible()
    return !!r?.disponible
  } catch {
    return false
  }
}

/**
 * Ce que l'écran de veille affiche.
 *
 * Noter ce qui N'EST PAS dans cet objet : le temps écoulé. Il n'est pas
 * envoyé, il est DÉDUIT de `base` par le système lui-même, qui l'actualise
 * chaque seconde sans exécuter une ligne de notre code.
 *
 * C'est le point important de tout ce fichier. Android étrangle les minuteurs
 * d'une page en arrière plan jusqu'à une fois par minute : un compteur poussé
 * depuis le JavaScript se serait figé sur l'écran verrouillé, c'est à dire
 * exactement là où il doit vivre.
 *
 * @typedef  {object} EtatVeille
 * @property {string}  titre  ce qu'on est en train de faire
 * @property {string}  texte  la ligne du dessous, ici la distance
 * @property {number}  base   l'instant d'où compter, soit maintenant moins l'écoulé
 * @property {boolean} court  le chronomètre tourne-t-il, ou est-on en pause
 * @property {string}  fige   le temps à afficher pendant la pause
 */

/** @param {EtatVeille} etat @returns {Promise<boolean>} */
export async function veilleDemarrer(etat) {
  if (!androidNatif()) return false
  try {
    const r = await EcranDeVeille.demarrer(etat)
    return !!r?.demarre
  } catch {
    return false
  }
}

/** @param {EtatVeille} etat */
export async function veilleMettreAJour(etat) {
  if (!androidNatif()) return
  try { await EcranDeVeille.mettreAJour(etat) } catch {}
}

export async function veilleArreter() {
  if (!androidNatif()) return
  try { await EcranDeVeille.arreter() } catch {}
}

export default { veilleDisponible, veilleDemarrer, veilleMettreAJour, veilleArreter }
