// ─────────────────────────────────────────────────────────────────────────────
// LE LECTEUR DE SÉANCE
//
// Jusqu'ici, une séance était une liste à cocher. On lisait « squat, 3 × 10 »,
// on allait le faire dans son salon, et on revenait cocher une case. L'app
// décrivait l'entraînement, elle n'y participait pas.
//
// Cet écran l'accompagne : un exercice à la fois, en grand, avec le geste en
// photo, le temps qui tourne, et le repos décompté entre deux séries. On pose
// le téléphone et on le regarde de loin, ce qui commande tout le dessin :
// gros chiffres, peu de texte, une seule action visible à la fois.
//
// Deux choses qu'on ne voit pas mais qui décident de tout :
//
//   · le chronomètre est recalculé depuis un horodatage, jamais additionné,
//     donc il reste juste quand l'écran se verrouille (voir useChrono.js)
//   · l'écran est maintenu allumé pendant la séance, sinon il s'éteint au
//     milieu du gainage et il faut le rallumer les mains au sol
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useChrono, formater } from './useChrono'
import { PHOTOS_EXOS, EXOS } from './ExercicesGuide'
import { ENCRE, ICONE, ACCENT, AMBRE, VERT } from './palette'

const EASE = [0.22, 1, 0.36, 1]
const REPOS_SECONDES = 45

const VERRE = {
  background: 'rgba(255,235,210,0.42)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,220,160,0.45)',
}

/** Les infos du guide pour un identifiant d'exercice, ou un repli honnête. */
function infosExo(id) {
  const e = EXOS.find(x => x.id === id)
  return {
    nom: e?.nom || id || 'Exercice',
    cible: e?.cible || null,
    etapes: e?.etapes || [],
    photo: PHOTOS_EXOS[id] || null,
  }
}

// ─── L'ÉCRAN RESTE ALLUMÉ ────────────────────────────────────────────────────

/**
 * Empêche l'écran de s'éteindre tant que la séance tourne.
 *
 * Le verrou est perdu dès que l'app passe en arrière plan : le système le
 * reprend, et il ne revient PAS tout seul au retour. Sans la réacquisition
 * sur visibilitychange, l'écran tient jusqu'à la première notification puis
 * s'éteint pour le reste de la séance.
 */
function useEcranAllume(actif) {
  useEffect(() => {
    if (!actif || !('wakeLock' in navigator)) return
    let verrou = null
    let vivant = true

    const prendre = async () => {
      try {
        if (!vivant || document.visibilityState !== 'visible') return
        verrou = await navigator.wakeLock.request('screen')
      } catch {
        // Refusé par le système, batterie faible ou onglet caché. Ce n'est
        // pas une erreur à remonter : la séance fonctionne sans.
      }
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

// ─── LE DÉCOMPTE DE REPOS ────────────────────────────────────────────────────

/**
 * Compte à rebours, lui aussi calculé depuis un horodatage et non additionné :
 * il tomberait faux exactement comme le chronomètre si l'écran se verrouillait
 * pendant le repos, ce qui arrive tout le temps entre deux séries.
 */
function useDecompte(secondes, actif, onFini) {
  const fin = useRef(null)
  const [, redessiner] = useState(0)
  const fini = useRef(false)

  useEffect(() => {
    if (!actif) { fin.current = null; fini.current = false; return }
    fin.current = Date.now() + secondes * 1000
    fini.current = false
    const t = setInterval(() => redessiner(n => n + 1), 200)
    return () => clearInterval(t)
  }, [actif, secondes])

  const restant = actif && fin.current
    ? Math.max(0, Math.ceil((fin.current - Date.now()) / 1000))
    : secondes

  useEffect(() => {
    if (actif && restant === 0 && !fini.current) { fini.current = true; onFini?.() }
  }, [actif, restant, onFini])

  return restant
}

// ─── L'ÉCRAN ─────────────────────────────────────────────────────────────────

/**
 * @param {object[]} seance     [{ exo: 'squat', reps: '3 × 10' }, …]
 * @param {string}   titre      le titre du jour, affiché en haut
 * @param {number}   jour       le numéro du jour, pour l'en-tête
 * @param {function} onTermine  reçoit { dureeMs, exercices, debut, fin }
 * @param {function} onFermer   sortie sans enregistrer
 */
export default function SeanceActive({ seance = [], titre = '', jour = null, onTermine, onFermer }) {
  const exos = useMemo(
    () => (seance || []).filter(x => x && x.exo).map(x => ({ ...x, ...infosExo(x.exo) })),
    [seance],
  )

  const [index, setIndex] = useState(0)
  const [enRepos, setEnRepos] = useState(false)
  const [fini, setFini] = useState(false)
  const [confirmerSortie, setConfirmerSortie] = useState(false)
  const [totalMs, setTotalMs] = useState(0)

  const chrono = useChrono({ cle: 'solenn_chrono_seance', reprendre: false })
  useEcranAllume(chrono.enCours || enRepos)

  // Le chrono part avec l'ecran : personne ne veut appuyer sur « demarrer »
  // deux fois de suite pour la meme seance.
  useEffect(() => { chrono.demarrer() }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const repos = useDecompte(REPOS_SECONDES, enRepos, () => setEnRepos(false))
  const courant = exos[index] || null
  const dernier = index >= exos.length - 1

  function suivant() {
    if (dernier) return terminer()
    setIndex(i => i + 1)
    setEnRepos(true)
  }

  function terminer() {
    const total = chrono.arreter()
    setTotalMs(total)
    setEnRepos(false)
    setFini(true)
  }

  function enregistrer() {
    const fin = Date.now()
    onTermine?.({
      dureeMs: totalMs,
      exercices: exos.length,
      debut: fin - totalMs,
      fin,
    })
  }

  const corps = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px 12px', flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: AMBRE }}>
            {jour ? `Jour ${jour}` : 'Séance'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {titre || 'Ta séance'}
          </div>
        </div>
        <button
          onClick={() => (fini ? onFermer?.() : setConfirmerSortie(true))}
          aria-label="Fermer la séance"
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

      {/* ── Le chronomètre ── */}
      <div style={{ textAlign: 'center', padding: '4px 18px 14px', flexShrink: 0 }}>
        <div style={{
          fontSize: 52, fontWeight: 700, color: ENCRE, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fini ? formater(totalMs) : chrono.texte}
        </div>
        {!fini && (
          <div style={{ fontSize: 12, color: ENCRE, opacity: 0.7, marginTop: 6 }}>
            Exercice {Math.min(index + 1, exos.length)} sur {exos.length}
          </div>
        )}
      </div>

      {/* ── Le corps ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 18px' }}>
        {/* PAS d'AnimatePresence ici, volontairement. Ce sous-arbre est
            redessine quatre fois par seconde par le chronometre, et dans ces
            conditions la comptabilite de presence se bloquait : l'en-tete
            passait a « Exercice 2 sur 4 » pendant que le corps restait fige
            sur le premier exercice, indefiniment. Constate en cliquant, pas
            suppose. Une transition de sortie ne vaut pas un ecran qui ment.
            Les entrees s'animent quand meme : la cle change, donc React
            remonte, donc le `initial` de chaque etat rejoue. */}
        {fini ? (
          <Bilan key="bilan" totalMs={totalMs} exos={exos} onEnregistrer={enregistrer} />
        ) : enRepos ? (
          <Repos key="repos" restant={repos} suivant={exos[index]} onPasser={() => setEnRepos(false)} />
        ) : courant ? (
          <Exercice key={'exo' + index} exo={courant} />
        ) : (
          <div key="vide" style={{ fontSize: 13, color: ENCRE, textAlign: 'center', paddingTop: 40 }}>
            Ce jour ne porte pas de séance.
          </div>
        )}
      </div>

      {/* ── Les commandes ── */}
      {!fini && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 18px 0', flexShrink: 0 }}>
          <button
            onClick={() => (chrono.enCours ? chrono.pause() : chrono.reprise())}
            style={{
              padding: '15px 18px', borderRadius: 16, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(200,123,82,0.30)',
              color: ENCRE, fontSize: 13.5, fontWeight: 600, fontFamily: "'Poppins', sans-serif",
            }}
          >
            {chrono.enCours ? 'Pause' : 'Reprendre'}
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={suivant}
            style={{
              flex: 1, padding: '15px 18px', borderRadius: 16, cursor: 'pointer',
              background: 'transparent', border: `1.5px solid ${ICONE}`,
              color: ENCRE, fontSize: 14.5, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
            }}
          >
            {dernier ? 'Terminer la séance' : 'Exercice suivant'}
          </motion.button>
        </div>
      )}

      {/* ── Sortir en cours de route ── */}
      <AnimatePresence>
        {confirmerSortie && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(90,45,20,0.28)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              style={{ ...VERRE, borderRadius: 20, padding: '20px 18px', maxWidth: 320 }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, marginBottom: 8 }}>
                Arrêter la séance ?
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: ENCRE, marginBottom: 18 }}>
                Tu es à {chrono.texte}. Si tu sors maintenant, ce temps n'est pas enregistré.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmerSortie(false)}
                  style={{
                    flex: 1, padding: '13px', borderRadius: 14, cursor: 'pointer',
                    background: 'transparent', border: `1.5px solid ${ICONE}`,
                    color: ENCRE, fontSize: 13.5, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Continuer
                </button>
                <button
                  onClick={() => { chrono.arreter(); onFermer?.() }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  return createPortal(corps, document.body)
}

// ─── LES TROIS ÉTATS ─────────────────────────────────────────────────────────

function Exercice({ exo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {exo.photo && (
        <div style={{
          height: 190, borderRadius: 20, overflow: 'hidden', marginBottom: 16,
          border: '1px solid rgba(255,220,160,0.45)',
          backgroundImage: `url(${exo.photo.url})`,
          backgroundSize: 'cover',
          backgroundPosition: `50% ${exo.photo.pos || '50%'}`,
        }} />
      )}

      <div style={{ fontSize: 24, fontWeight: 700, color: ENCRE, lineHeight: 1.2 }}>{exo.nom}</div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        {exo.reps && (
          <span style={{
            fontSize: 15, fontWeight: 700, color: ENCRE,
            background: 'rgba(200,123,82,0.14)', border: '1px solid rgba(200,123,82,0.24)',
            borderRadius: 999, padding: '5px 13px',
          }}>
            {exo.reps}
          </span>
        )}
        {exo.cible && (
          <span style={{ fontSize: 12, color: ENCRE, opacity: 0.8 }}>{exo.cible}</span>
        )}
      </div>

      {exo.etapes.length > 0 && (
        <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none' }}>
          {exo.etapes.map((e, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
              <span aria-hidden="true" style={{
                width: 5, height: 5, borderRadius: 999, background: ACCENT,
                marginTop: 7, flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, lineHeight: 1.55, color: ENCRE }}>{e}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

function Repos({ restant, suivant, onPasser }) {
  return (
    <motion.div
      key="repos"
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{ textAlign: 'center', paddingTop: 26 }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em',
        textTransform: 'uppercase', color: AMBRE }}>
        Repos
      </div>
      <div style={{
        fontSize: 76, fontWeight: 700, color: ENCRE, lineHeight: 1.1, marginTop: 6,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {restant}
      </div>
      <div style={{ fontSize: 13, color: ENCRE, marginTop: 10, lineHeight: 1.55 }}>
        Ensuite : <span style={{ fontWeight: 700 }}>{suivant?.nom}</span>
        {suivant?.reps ? `, ${suivant.reps}` : ''}
      </div>
      <button
        onClick={onPasser}
        style={{
          marginTop: 22, padding: '12px 22px', borderRadius: 15, cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(200,123,82,0.30)',
          color: ENCRE, fontSize: 13.5, fontWeight: 600, fontFamily: "'Poppins', sans-serif",
        }}
      >
        Passer le repos
      </button>
    </motion.div>
  )
}

function Bilan({ totalMs, exos, onEnregistrer }) {
  // `Math.max(1, ...)` annoncait « 1 minute de mouvement » pour une seance de
  // trois secondes. Sous la minute, on dit les secondes : une app qui arrondit
  // en sa faveur des le premier ecran perd la confiance qu'elle demande.
  // Math.floor et non round : le chronometre au-dessus tronque, et lire
  // « 00:18 » surmonte de « 19 secondes » fait douter des deux.
  const secondes = Math.floor(totalMs / 1000)
  const duree = secondes < 60
    ? `${secondes} seconde${secondes > 1 ? 's' : ''}`
    : `${Math.round(secondes / 60)} minute${Math.round(secondes / 60) > 1 ? 's' : ''}`
  return (
    <motion.div
      key="bilan"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{ paddingTop: 10 }}
    >
      <div style={{ ...VERRE, borderRadius: 22, padding: '20px 18px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: ENCRE, lineHeight: 1.25 }}>
          Séance terminée
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: ENCRE, marginTop: 8 }}>
          {duree} de mouvement, {exos.length} exercice
          {exos.length > 1 ? 's' : ''}. C'est ce qui compte, pas la performance.
        </div>

        <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none' }}>
          {exos.map((e, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(200,123,82,0.14)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={VERT}
                   strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span style={{ fontSize: 13.5, color: ENCRE, flex: 1 }}>{e.nom}</span>
              {e.reps && <span style={{ fontSize: 12, color: ENCRE, opacity: 0.75 }}>{e.reps}</span>}
            </li>
          ))}
        </ul>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onEnregistrer}
          style={{
            width: '100%', marginTop: 20, padding: '15px', borderRadius: 16, cursor: 'pointer',
            background: 'transparent', border: `1.5px solid ${ICONE}`,
            color: ENCRE, fontSize: 14.5, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
          }}
        >
          Enregistrer et valider le jour
        </motion.button>
      </div>
    </motion.div>
  )
}
