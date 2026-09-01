// ─────────────────────────────────────────────────────────────────────────────
// L'ÉCRAN DE COURSE
//
// Le pendant de SeanceActive pour ce qui se fait dehors. Trois chiffres, et
// rien d'autre : le temps, la distance, l'allure. On les lit en mouvement, en
// jetant un œil au poignet ou à la main, donc ils sont énormes et il n'y a
// aucun texte à lire.
//
// La qualité du signal est affichée, volontairement. Un compteur de distance
// qui ne dit pas ce qu'il vaut demande une confiance aveugle, et la première
// fois qu'il se trompe sous les arbres ou entre deux immeubles, c'est toute
// l'app qui perd sa crédibilité. Mieux vaut dire « signal faible » que
// laisser croire.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useChrono, formater } from './useChrono'
import { useCourse, allure, formaterAllure, formaterDistance } from './useCourse'
import { ENCRE, ICONE, AMBRE, VERT } from './palette'
import { veilleDemarrer, veilleMettreAJour, veilleArreter } from './ecranVeille'

const EASE = [0.22, 1, 0.36, 1]

const VERRE = {
  background: 'rgba(255,235,210,0.42)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,220,160,0.45)',
}

/** L'écran reste allumé pendant l'effort. Le verrou est repris au retour. */
function useEcranAllume(actif) {
  useEffect(() => {
    if (!actif || !('wakeLock' in navigator)) return
    let verrou = null, vivant = true
    const prendre = async () => {
      try {
        if (!vivant || document.visibilityState !== 'visible') return
        verrou = await navigator.wakeLock.request('screen')
      } catch {}
    }
    const auRetour = () => { if (document.visibilityState === 'visible') prendre() }
    prendre()
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      vivant = false
      document.removeEventListener('visibilitychange', auRetour)
      try { verrou?.release() } catch {}
    }
  }, [actif])
}

/** Un des trois grands chiffres. */
function Chiffre({ valeur, libelle, taille = 42 }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
      <div style={{
        fontSize: taille, fontWeight: 700, color: ENCRE, lineHeight: 1.05,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {valeur}
      </div>
      <div style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em',
        textTransform: 'uppercase', color: AMBRE, marginTop: 5,
      }}>
        {libelle}
      </div>
    </div>
  )
}

/**
 * @param {function} onTermine reçoit { dureeMs, metres, allureSecParKm, debut, fin }
 * @param {function} onFermer  sortie sans enregistrer
 */
export default function CourseActive({ onTermine, onFermer }) {
  const chrono = useChrono({ cle: 'solenn_chrono_course', reprendre: false })
  const gps = useCourse()
  const [fini, setFini] = useState(false)
  const [totalMs, setTotalMs] = useState(0)
  const [totalM, setTotalM] = useState(0)
  const [confirmer, setConfirmer] = useState(false)
  const [demarrage, setDemarrage] = useState(true)

  useEcranAllume(chrono.enCours)

  // Le GPS d'abord, le chronometre ensuite. L'inverse ferait demarrer le temps
  // pendant que la fenetre d'autorisation est encore ouverte, et la course
  // commencerait avec trente secondes deja au compteur.
  useEffect(() => {
    let vivant = true
    gps.demarrer().then(() => {
      if (!vivant) return
      setDemarrage(false)
      // Le chronometre part MEME si le GPS a echoue. L'ecran promet que « le
      // temps, lui, continue d'etre compte » : le demarrer sous condition
      // faisait mentir cette phrase, le compteur restait a zero sous elle.
      // Une sortie sans distance reste une sortie.
      chrono.demarrer()
      // La notification permanente est ce qui garde la course vivante ecran
      // verrouille : sur Android, c'est la contrepartie exigee par le systeme
      // pour continuer a travailler en arriere plan. Si elle echoue, la course
      // se deroule quand meme, simplement sans ecran de veille.
      veilleDemarrer({
        titre: 'Course en cours',
        texte: 'Recherche du signal',
        base: Date.now(),
        court: true,
        fige: '00:00',
      })
    })
    return () => { vivant = false; veilleArreter() }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  // La notification n'est plus poussee chaque seconde, et c'est le coeur du
  // montage : le TEMPS est compte par le systeme a partir de `base`, donc il
  // continue d'avancer sur l'ecran verrouille meme quand l'application est
  // completement endormie. Ne restent a envoyer que la distance, qui change
  // tous les dix metres, et la pause, qui change rarement.
  //
  // On envoie donc sur CHANGEMENT du texte affiche, pas sur battement d'horloge.
  const dernierEnvoi = useRef('')
  useEffect(() => {
    if (fini) return
    const texte = gps.metres >= 1
      ? `${formaterDistance(gps.metres)} parcourus`
      : 'Recherche du signal'
    const empreinte = `${texte}|${chrono.enCours}`
    if (empreinte === dernierEnvoi.current) return
    dernierEnvoi.current = empreinte
    veilleMettreAJour({
      titre: 'Course en cours',
      texte,
      // Maintenant moins l'ecoule : c'est ce qui permet au systeme de
      // retrouver le bon compte apres une pause, sans repartir de zero.
      base: Date.now() - chrono.ms,
      court: chrono.enCours,
      fige: chrono.texte,
    })
  }, [gps.metres, chrono.enCours, fini])   // eslint-disable-line react-hooks/exhaustive-deps

  function terminer() {
    const ms = chrono.arreter()
    gps.arreter()
    veilleArreter()
    setTotalMs(ms)
    setTotalM(gps.metres)
    setFini(true)
  }

  const secParKm = allure(fini ? totalM : gps.metres, fini ? totalMs : chrono.ms)

  // Le signal, dit honnetement. « Cherche » tant qu'aucun point n'est arrive.
  const signal = gps.precision == null ? { texte: 'Recherche du signal', ton: AMBRE }
    : gps.precision <= 10 ? { texte: 'Signal bon', ton: VERT }
    : gps.precision <= 25 ? { texte: `Signal moyen, ${gps.precision} m`, ton: AMBRE }
    : { texte: `Signal faible, ${gps.precision} m`, ton: '#B91C1C' }

  const corps = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'linear-gradient(165deg, #FFF6E8 0%, #F5DDB0 55%, #FFF6E8 100%)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Poppins', sans-serif",
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
      }}
    >
      {/* ── En tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px 10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: AMBRE }}>
            {fini ? 'Terminé' : 'En course'}
          </div>
          {!fini && (
            <div style={{ fontSize: 12, color: signal.ton, marginTop: 3, fontWeight: 600 }}>
              {signal.texte}
            </div>
          )}
        </div>
        <button
          onClick={() => (fini ? onFermer?.() : setConfirmer(true))}
          aria-label="Fermer"
          style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(200,123,82,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICONE}
               strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Les trois chiffres ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '0 16px', minHeight: 0 }}>

        <div style={{
          fontSize: 68, fontWeight: 700, color: ENCRE, lineHeight: 1,
          textAlign: 'center', fontVariantNumeric: 'tabular-nums', marginBottom: 6,
        }}>
          {fini ? formater(totalMs) : chrono.texte}
        </div>
        <div style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textAlign: 'center',
          textTransform: 'uppercase', color: AMBRE, marginBottom: 34,
        }}>
          Durée
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Chiffre valeur={formaterDistance(fini ? totalM : gps.metres)} libelle="Distance" />
          <Chiffre valeur={formaterAllure(secParKm)} libelle="Allure / km" />
        </div>

        {gps.erreur && (
          <div style={{
            ...VERRE, borderRadius: 16, padding: '12px 14px', marginTop: 26,
            fontSize: 12.5, lineHeight: 1.5, color: ENCRE, textAlign: 'center',
          }}>
            {gps.erreur} Le temps, lui, continue d'être compté.
          </div>
        )}

        {fini && (
          <div style={{ ...VERRE, borderRadius: 18, padding: '16px 16px', marginTop: 30 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: ENCRE }}>
              {totalM >= 100
                ? `Tu as parcouru ${formaterDistance(totalM)} en ${formater(totalMs)}.`
                : `${formater(totalMs)} de sortie. La distance n'a pas pu être mesurée, mais le temps compte quand même.`}
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onTermine?.({
                dureeMs: totalMs,
                metres: Math.round(totalM),
                allureSecParKm: secParKm ? Math.round(secParKm) : null,
                debut: Date.now() - totalMs,
                fin: Date.now(),
              })}
              style={{
                width: '100%', marginTop: 16, padding: '15px', borderRadius: 16, cursor: 'pointer',
                background: 'transparent', border: `1.5px solid ${ICONE}`,
                color: ENCRE, fontSize: 14.5, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
              }}
            >
              Enregistrer cette sortie
            </motion.button>
          </div>
        )}
      </div>

      {/* ── Les commandes ── */}
      {!fini && (
        <div style={{ display: 'flex', gap: 10, padding: '10px 18px 0' }}>
          <button
            onClick={() => (chrono.enCours ? chrono.pause() : chrono.reprise())}
            disabled={demarrage}
            style={{
              padding: '16px 20px', borderRadius: 16,
              cursor: demarrage ? 'not-allowed' : 'pointer', opacity: demarrage ? 0.5 : 1,
              background: 'transparent', border: '1px solid rgba(200,123,82,0.30)',
              color: ENCRE, fontSize: 13.5, fontWeight: 600, fontFamily: "'Poppins', sans-serif",
            }}
          >
            {chrono.enCours ? 'Pause' : 'Reprendre'}
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={terminer}
            disabled={demarrage}
            style={{
              flex: 1, padding: '16px 20px', borderRadius: 16,
              cursor: demarrage ? 'not-allowed' : 'pointer', opacity: demarrage ? 0.5 : 1,
              background: 'transparent', border: `1.5px solid ${ICONE}`,
              color: ENCRE, fontSize: 14.5, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
            }}
          >
            {demarrage ? 'Préparation du GPS…' : 'Terminer'}
          </motion.button>
        </div>
      )}

      {/* ── Sortir en cours de route ── */}
      {confirmer && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(90,45,20,0.28)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <motion.div
            initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ ...VERRE, borderRadius: 20, padding: '20px 18px', maxWidth: 320 }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, marginBottom: 8 }}>
              Arrêter la sortie ?
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: ENCRE, marginBottom: 18 }}>
              Tu es à {chrono.texte} et {formaterDistance(gps.metres)}. Si tu sors
              maintenant, rien n'est enregistré.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmer(false)}
                style={{
                  flex: 1, padding: '13px', borderRadius: 14, cursor: 'pointer',
                  background: 'transparent', border: `1.5px solid ${ICONE}`,
                  color: ENCRE, fontSize: 13.5, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                }}
              >
                Continuer
              </button>
              <button
                onClick={() => { chrono.arreter(); gps.arreter(); veilleArreter(); onFermer?.() }}
                style={{
                  padding: '13px 16px', borderRadius: 14, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(200,123,82,0.30)',
                  color: ENCRE, fontSize: 13.5, fontWeight: 600, fontFamily: "'Poppins', sans-serif",
                }}
              >
                Arrêter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )

  return createPortal(corps, document.body)
}
