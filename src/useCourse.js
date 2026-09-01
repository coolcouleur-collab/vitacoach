// ─────────────────────────────────────────────────────────────────────────────
// LE SUIVI DE COURSE
//
// Ce qui fait une application de course, ce n'est pas le rythme cardiaque,
// c'est la distance. Elle ne vient pas de la santé, elle vient du GPS, et
// personne ne la calcule à votre place : on reçoit des points, et on additionne
// ce qui sépare les bons.
//
// « Les bons », parce que la moitié du travail consiste à jeter des points.
// Un GPS de téléphone ment tranquillement de trente mètres, et il ment surtout
// à l'arrêt : posé sur une table, il produit une dérive qui, additionnée
// bêtement, fait « courir » deux kilomètres à quelqu'un d'immobile. C'est la
// faute classique des compteurs de distance faits maison, et elle ne se voit
// qu'en vrai, sur le terrain, quand l'app annonce une performance imaginaire.
//
// La première version de ce fichier filtrait sur un déplacement minimal de
// cinq mètres. Mesuré sur 300 relevés immobiles bruités de plus ou moins huit
// mètres, elle laissait encore passer 1693 mètres de course imaginaire, contre
// 2382 pour un compteur qui n'aurait rien filtré du tout. Autrement dit : elle
// ne servait presque à rien.
//
// La raison est structurelle, et c'est ce qui compte ici : DIFFÉRENCIER DES
// POSITIONS NE PERMET PAS DE DISTINGUER LE BRUIT D'UNE MARCHE LENTE. Deux
// relevés séparés de douze mètres, avec une précision annoncée de douze
// mètres, sont exactement aussi compatibles avec « immobile » qu'avec « en
// train de marcher ». Aucun seuil ne tranche, parce qu'il n'y a rien à
// trancher dans la donnée.
//
// Ce qui tranche, c'est la VITESSE que le GPS rapporte lui-même. Elle ne vient
// pas d'une différence de positions, elle vient de l'effet Doppler sur le
// signal des satellites, et elle tombe à zéro à l'arrêt là où les positions,
// elles, continuent de gigoter. C'est pour ça que les applications de course
// s'appuient dessus, et c'est le filtre principal ici.
//
// Quatre filtres, dans cet ordre :
//
//   1. la précision annoncée. Au delà de 25 mètres, on jette.
//   2. la vitesse rapportée. En dessous de 0,7 m/s, on est à l'arrêt, quoi que
//      disent les coordonnées. C'est le filtre qui fait le travail.
//   3. le déplacement minimal, PROPORTIONNEL à la précision et non fixe : un
//      point précis à 5 mètres et un point précis à 20 n'ont pas le même droit
//      à être crus. Ce filtre est le repli quand la vitesse n'est pas fournie,
//      ce qui arrive sur certains appareils et dans les navigateurs.
//   4. la vitesse implicite. Au delà de 12 m/s, soit 43 km/h, ce n'est plus de
//      la course : c'est un saut de position.
//
// Le temps, lui, vient de useChrono, donc il survit au verrouillage de l'écran.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'

// Le pont CoreLocation, ecrit pour l'iPhone. @capacitor/geolocation fait tres
// bien son travail au premier plan et rien du tout ecran verrouille : iOS
// demande une declaration explicite pour continuer a localiser en arriere
// plan, et un plugin generaliste ne peut pas la faire pour tout le monde.
const PositionCourse = registerPlugin('PositionCourse')

const surIphone = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

const PRECISION_MAX  = 25    // mètres
const BOND_MIN       = 5     // mètres, plancher absolu
const BOND_PRECISION = 2     // le seuil vaut 2 fois la précision annoncée
const VITESSE_ARRET  = 0.7   // m/s, sous quoi on est à l'arrêt (marche ~ 1,3)
const VITESSE_MAX    = 12    // m/s, au dessus c'est un saut de position

/** Distance en mètres entre deux points, par la formule de haversine. */
export function distanceEntre(a, b) {
  const R = 6371000
  const rad = d => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

/**
 * Décide si un point doit être compté, et rend la distance qu'il ajoute.
 *
 * Séparé du reste pour être vérifiable sans GPS ni téléphone : c'est ici que
 * vit toute la logique qui peut faire mentir un compteur de distance.
 *
 * @param {object|null} precedent  dernier point retenu { lat, lon, t }
 * @param {object}      point      candidat { lat, lon, t, precision, vitesse }
 * @returns {{garde: boolean, metres: number, motif: string}}
 */
export function evaluerPoint(precedent, point) {
  if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lon)) {
    return { garde: false, metres: 0, motif: 'coordonnees invalides' }
  }
  if (Number.isFinite(point.precision) && point.precision > PRECISION_MAX) {
    return { garde: false, metres: 0, motif: 'precision insuffisante' }
  }

  // La vitesse du GPS, quand il la donne. Elle vient de l'effet Doppler et non
  // d'une difference de positions : c'est la seule mesure qui sache dire
  // « immobile » pendant que les coordonnees, elles, continuent de gigoter.
  // Une vitesse negative signifie « je ne sais pas », il ne faut pas la lire.
  const aLaVitesse = Number.isFinite(point.vitesse) && point.vitesse >= 0
  if (aLaVitesse && point.vitesse < VITESSE_ARRET) {
    return { garde: false, metres: 0, motif: 'a l arret' }
  }

  // Le premier point ne mesure rien, il pose l'origine.
  if (!precedent) return { garde: true, metres: 0, motif: 'premier point' }

  const metres = distanceEntre(precedent, point)

  // Le seuil suit la precision annoncee. Un point donne a 5 metres pres merite
  // d'etre cru sur un deplacement de 10 ; un point donne a 20 metres pres ne le
  // merite pas. Un seuil fixe traitait les deux de la meme facon.
  const seuil = Math.max(
    BOND_MIN,
    Number.isFinite(point.precision) ? point.precision * BOND_PRECISION : BOND_MIN,
  )
  if (metres < seuil) {
    return { garde: false, metres: 0, motif: 'derive a l arret' }
  }

  const secondes = (point.t - precedent.t) / 1000
  if (secondes > 0 && metres / secondes > VITESSE_MAX) {
    return { garde: false, metres: 0, motif: 'saut de position' }
  }

  return { garde: true, metres, motif: 'compte' }
}

/** Allure en secondes par kilomètre, ou null tant qu'elle n'a pas de sens. */
export function allure(metres, ms) {
  if (!metres || metres < 50 || !ms) return null
  return (ms / 1000) / (metres / 1000)
}

/** mm:ss par kilomètre, la façon dont un coureur lit son allure. */
export function formaterAllure(secondesParKm) {
  if (!secondesParKm || !Number.isFinite(secondesParKm)) return '--:--'
  const m = Math.floor(secondesParKm / 60)
  const s = Math.round(secondesParKm % 60)
  // 5:60 n'existe pas : l'arrondi des secondes doit remonter sur les minutes.
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`
}

/** Kilomètres, à une décimale, ou les mètres tant qu'on est sous le kilomètre. */
export function formaterDistance(metres) {
  if (!metres || metres < 1000) return `${Math.round(metres || 0)} m`
  return `${(metres / 1000).toFixed(2).replace('.', ',')} km`
}

/**
 * Le suivi lui-même. Ne démarre le GPS que lorsqu'on le lui demande, et
 * l'arrête vraiment : une montre de position oubliée vide la batterie sans
 * que rien ne s'affiche à l'écran.
 */
export function useCourse() {
  const [metres, setMetres] = useState(0)
  const [points, setPoints] = useState(0)
  const [rejetes, setRejetes] = useState(0)
  const [precision, setPrecision] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [actif, setActif] = useState(false)

  const dernier = useRef(null)
  const veille = useRef(null)
  const ecoute = useRef(null)
  const trace = useRef([])

  /**
   * Le traitement d'un relevé, quelle que soit sa provenance.
   *
   * Les deux sources, CoreLocation et le plugin générique, ne donnent pas
   * leurs relevés dans la même forme. Elles sont normalisées avant d'arriver
   * ici, pour qu'il n'existe qu'UN seul endroit où la distance s'additionne :
   * deux copies de ce calcul, c'est la garantie qu'un jour l'une des deux
   * n'aura pas la correction de l'autre.
   */
  const traiter = useCallback(point => {
    setPrecision(Math.round(point.precision || 0))
    const verdict = evaluerPoint(dernier.current, point)
    if (!verdict.garde) { setRejetes(n => n + 1); return }
    dernier.current = point
    trace.current.push(point)
    setPoints(n => n + 1)
    if (verdict.metres > 0) setMetres(d => d + verdict.metres)
  }, [])

  const arreter = useCallback(async () => {
    setActif(false)
    if (ecoute.current) {
      try { (await ecoute.current).remove() } catch {}
      ecoute.current = null
      try { await PositionCourse.arreter() } catch {}
    }
    if (veille.current != null) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation')
        await Geolocation.clearWatch({ id: veille.current })
      } catch {}
      veille.current = null
    }
  }, [])

  const demarrer = useCallback(async () => {
    setErreur(null)
    dernier.current = null
    trace.current = []
    setMetres(0); setPoints(0); setRejetes(0)

    // ── L'iPhone, par le pont CoreLocation ──────────────────────────────
    if (surIphone()) {
      try {
        const perm = await PositionCourse.demanderAutorisation()
        if (!perm?.accorde) {
          setErreur("Sans acces a ta position, la distance ne peut pas etre mesuree.")
          return false
        }
        ecoute.current = PositionCourse.addListener('position', traiter)
        const r = await PositionCourse.demarrer()
        if (!r?.demarre) {
          setErreur("La position n'a pas pu demarrer.")
          return false
        }
        if (!r?.arrierePlan) {
          // Dit, et non taise : sans l'autorisation « toujours », la distance
          // se figera au verrouillage. Mieux vaut le savoir avant de partir
          // que de decouvrir un compteur arrete a l'arrivee.
          setErreur("Autorise la position « toujours » pour que la distance continue ecran verrouille.")
        }
        setActif(true)
        return true
      } catch (e) {
        setErreur("La position n'est pas disponible sur cet appareil.")
        return false
      }
    }

    // ── Android et le web, par le plugin generique ──────────────────────
    try {
      const { Geolocation } = await import('@capacitor/geolocation')
      const perm = await Geolocation.requestPermissions()
      if (perm?.location !== 'granted' && perm?.coarseLocation !== 'granted') {
        setErreur("Sans acces a ta position, la distance ne peut pas etre mesuree.")
        return false
      }

      veille.current = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000 },
        (pos, err) => {
          if (err || !pos?.coords) return
          traiter({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            t: pos.timestamp || Date.now(),
            precision: pos.coords.accuracy,
            vitesse: pos.coords.speed,
          })
        },
      )
      setActif(true)
      return true
    } catch (e) {
      setErreur("La position n'est pas disponible sur cet appareil.")
      return false
    }
  }, [traiter])

  // Une montre de position qui survit au demontage du composant continue de
  // consommer la batterie, indefiniment et sans rien afficher.
  useEffect(() => () => { arreter() }, [arreter])

  return {
    metres, points, rejetes, precision, erreur, actif,
    demarrer, arreter,
    trace: trace.current,
  }
}

export default useCourse
