// ─────────────────────────────────────────────────────────────────────────────
// LES DONNÉES DE SANTÉ, DES DEUX CÔTÉS
//
// Jusqu'ici l'app ne savait lire que HealthKit, donc l'iPhone. L'écran des
// connexions posait `isHealthKitAvailable()` et n'affichait rien sur Android :
// aucune métrique automatique, alors même que le manifeste réclamait déjà
// l'accès aux pas, au sommeil et au cœur.
//
// Ce fichier est la façade. Il choisit HealthKit sur iOS, Health Connect sur
// Android, et rend la MÊME chose des deux côtés : { pas, sommeil, fc, poids }.
// L'écran d'en face n'a pas à savoir d'où viennent les chiffres, et c'est ce
// qui permettra de brancher une troisième source sans rien casser.
//
// Une métrique absente est ABSENTE de l'objet, jamais mise à zéro. Zéro pas et
// pas de donnée sont deux choses différentes : l'accueil de Solenn affiche la
// première comme un constat, et il aurait tort de le faire pour la seconde.
// ─────────────────────────────────────────────────────────────────────────────

import { Capacitor, registerPlugin } from '@capacitor/core'
import {
  isHealthKitAvailable,
  requestHealthKitPermissions,
  readTodayHealthData,
} from './useHealthKit'

/** Le pont Kotlin, écrit dans android/app/src/main/java/com/solenn/app. */
const SanteConnect = registerPlugin('SanteConnect')

/** Le drapeau local « Apple Sante / Health Connect connecte », lu par les
 *  Reglages et pose par la fenetre d'accueil : une seule definition. */
export const CLE_SANTE_CONNECTEE = 'vitacoach_healthkit_connected'

export const PLATEFORME = {
  ios: 'ios',
  android: 'android',
  aucune: null,
}

function plateforme() {
  if (!Capacitor.isNativePlatform()) return PLATEFORME.aucune
  const p = Capacitor.getPlatform()
  return p === 'ios' ? PLATEFORME.ios : p === 'android' ? PLATEFORME.android : PLATEFORME.aucune
}

/**
 * Que peut-on faire sur cet appareil ?
 *
 * `aInstaller` distingue « Health Connect n'est pas installé » de « ce
 * téléphone ne peut pas ». Le premier se répare en deux touches, le second
 * jamais : proposer d'installer à quelqu'un dont l'appareil ne le supporte pas
 * est le genre de détail qui fait désinstaller une app.
 *
 * @returns {Promise<{disponible: boolean, plateforme: string|null, aInstaller: boolean, nom: string}>}
 */
export async function santeDisponible() {
  const p = plateforme()

  if (p === PLATEFORME.ios) {
    return {
      disponible: isHealthKitAvailable(),
      plateforme: p,
      aInstaller: false,
      nom: 'Santé',
    }
  }

  if (p === PLATEFORME.android) {
    try {
      const r = await SanteConnect.disponible()
      return {
        disponible: !!r?.disponible,
        plateforme: p,
        aInstaller: !!r?.aInstaller,
        nom: 'Health Connect',
      }
    } catch {
      return { disponible: false, plateforme: p, aInstaller: false, nom: 'Health Connect' }
    }
  }

  return { disponible: false, plateforme: null, aInstaller: false, nom: 'Santé' }
}

/**
 * Demande l'accès. Sur iOS, la demande d'HealthKit ne dit jamais ce qui a été
 * accordé, par conception : Apple ne veut pas qu'une app déduise une maladie
 * du refus d'un type de donnée. On répond donc vrai sans mentir, et c'est la
 * lecture qui dira ce qu'on a vraiment.
 *
 * @returns {Promise<boolean>}
 */
export async function demanderAccesSante() {
  const p = plateforme()

  if (p === PLATEFORME.ios) {
    await requestHealthKitPermissions()
    return true
  }

  if (p === PLATEFORME.android) {
    try {
      const r = await SanteConnect.demanderPermissions()
      return !!r?.accorde
    } catch {
      return false
    }
  }

  return false
}

/** L'accès est-il déjà accordé ? N'ouvre aucune fenêtre. iOS ne sait pas répondre. */
export async function accesAccorde() {
  if (plateforme() !== PLATEFORME.android) return false
  try {
    const r = await SanteConnect.permissionsAccordees()
    return !!r?.accorde
  } catch {
    return false
  }
}

/**
 * Les métriques du jour, dans la même forme des deux côtés.
 * @returns {Promise<{pas?: number, sommeil?: number, fc?: number, poids?: number}>}
 */
export async function lireSanteAujourdhui() {
  const p = plateforme()

  if (p === PLATEFORME.ios) return readTodayHealthData()

  if (p === PLATEFORME.android) {
    try {
      const r = await SanteConnect.lireAujourdhui()
      // Le pont renvoie un objet natif : on ne garde que les nombres utiles,
      // pour que jamais un null ou un zero ne passe pour une mesure.
      const sortie = {}
      for (const cle of ['pas', 'sommeil', 'fc', 'poids']) {
        const v = Number(r?.[cle])
        if (Number.isFinite(v) && v > 0) sortie[cle] = v
      }
      return sortie
    } catch {
      return {}
    }
  }

  return {}
}

/** Ouvre Health Connect, pour l'installer ou revoir les autorisations. */
export async function ouvrirReglagesSante() {
  if (plateforme() !== PLATEFORME.android) return false
  try {
    await SanteConnect.ouvrirReglages()
    return true
  } catch {
    return false
  }
}

export default {
  santeDisponible,
  demanderAccesSante,
  accesAccorde,
  lireSanteAujourdhui,
  ouvrirReglagesSante,
}
