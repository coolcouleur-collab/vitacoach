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

/** @returns {Promise<boolean>} vrai si l'écran de veille tient la course. */
export async function veilleDemarrer(titre, texte) {
  if (!androidNatif()) return false
  try {
    const r = await EcranDeVeille.demarrer({ titre, texte })
    return !!r?.demarre
  } catch {
    return false
  }
}

export async function veilleMettreAJour(titre, texte) {
  if (!androidNatif()) return
  try { await EcranDeVeille.mettreAJour({ titre, texte }) } catch {}
}

export async function veilleArreter() {
  if (!androidNatif()) return
  try { await EcranDeVeille.arreter() } catch {}
}

export default { veilleDisponible, veilleDemarrer, veilleMettreAJour, veilleArreter }
