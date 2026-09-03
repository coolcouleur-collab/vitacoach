// ─────────────────────────────────────────────────────────────────────────────
// LA MÉDITATION GUIDÉE
//
// Des séances écrites, découpées en étapes minutées. Le texte s'affiche, et il
// peut aussi être DIT à voix haute par le navigateur (SpeechSynthesis).
//
// Pourquoi la voix de synthèse plutôt qu'un enregistrement : aucun fichier
// audio, donc aucune licence à surveiller, aucun hébergement, et ça fonctionne
// hors connexion. La voix est moins belle qu'un comédien, c'est le prix. Elle
// est coupable d'un bouton, pour qui préfère lire.
//
// Ce que ce n'est PAS : un soin. Une méditation guidée aide à se poser, elle
// ne remplace ni un accompagnement ni un traitement, et le texte le dit à qui
// en aurait besoin.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ENCRE, ICONE } from './palette'

const F = "'Poppins', system-ui, sans-serif"

const CARD = {
  background: 'rgba(var(--rgb-verre), 0.22)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
  borderRadius: 24,
  padding: '18px 20px',
}

const SEANCES = [
  {
    id: 'ancrage',
    nom: 'Se poser',
    detail: '4 minutes · pour redescendre',
    etapes: [
      { t: 20, x: 'Installe-toi. Assis ou allongé, comme tu veux. Ferme les yeux si tu le souhaites.' },
      { t: 30, x: 'Sens les points de contact : les pieds au sol, le bassin sur le siège, les mains posées.' },
      { t: 40, x: 'Laisse ta respiration se faire toute seule. Tu n\'as rien à corriger. Observe seulement l\'air qui entre, et l\'air qui sort.' },
      { t: 45, x: 'Ton attention va partir. C\'est normal, c\'est ce que fait un esprit. Quand tu t\'en aperçois, reviens au souffle. Cet aller-retour EST l\'exercice.' },
      { t: 45, x: 'Élargis. Écoute les sons autour de toi, sans les nommer. Laisse-les venir et repartir.' },
      { t: 40, x: 'Reviens à ton corps entier, posé, respirant.' },
      { t: 20, x: 'Bouge doucement les doigts, les épaules. Ouvre les yeux quand tu es prêt.' },
    ],
  },
  {
    id: 'scan',
    nom: 'Parcours du corps',
    detail: '6 minutes · pour relâcher',
    etapes: [
      { t: 25, x: 'Allonge-toi si tu peux. Laisse tout le poids de ton corps au sol.' },
      { t: 45, x: 'Porte ton attention sur tes pieds. Sans rien changer, remarque ce qu\'il s\'y passe. Chaleur, appui, fourmillement, ou rien du tout.' },
      { t: 45, x: 'Remonte aux mollets, aux genoux, aux cuisses. Tu ne cherches pas à détendre : tu observes.' },
      { t: 45, x: 'Le bassin, le ventre. Laisse le ventre bouger avec la respiration.' },
      { t: 45, x: 'Le dos, une vertèbre après l\'autre, du bas jusqu\'aux épaules.' },
      { t: 45, x: 'Les bras, les mains, jusqu\'au bout des doigts.' },
      { t: 45, x: 'La nuque, la mâchoire, le front. Ce sont les trois endroits qui gardent le plus. Laisse-les.' },
      { t: 40, x: 'Le corps entier, d\'un seul tenant. Respire.' },
      { t: 25, x: 'Reviens à la pièce, sans te presser.' },
    ],
  },
  {
    id: 'soir',
    nom: 'Avant de dormir',
    detail: '5 minutes · pour la nuit',
    etapes: [
      { t: 25, x: 'Tu es couché. La journée est finie, même celle qui s\'est mal passée.' },
      { t: 40, x: 'Repose ta main sur ton ventre. Sens-le monter à l\'inspiration, descendre à l\'expiration.' },
      { t: 50, x: 'Allonge l\'expiration. Inspire sur quatre temps, souffle sur six. C\'est l\'expiration longue qui ralentit le coeur.' },
      { t: 50, x: 'Continue à ton rythme. Si des pensées viennent, imagine que tu les poses sur une étagère. Elles seront encore là demain.' },
      { t: 45, x: 'Relâche la mâchoire. Décolle la langue du palais. Desserre les épaules.' },
      { t: 45, x: 'Repense à un seul moment agréable de la journée, même minuscule. Reste avec lui.' },
      { t: 45, x: 'Laisse la respiration reprendre son cours normal. Tu n\'as plus rien à faire.' },
    ],
  },
]

export default function MeditationGuidee() {
  const [seance, setSeance] = useState(null)
  const [idx, setIdx]       = useState(0)
  const [restant, setRestant] = useState(0)
  const [enCours, setEnCours] = useState(false)
  const [voix, setVoix]     = useState(true)
  const [fini, setFini]     = useState(false)

  const s = SEANCES.find(x => x.id === seance)
  const etape = s?.etapes[idx]
  const dispoVoix = typeof window !== 'undefined' && 'speechSynthesis' in window

  const parler = React.useCallback((texte) => {
    if (!voix || !dispoVoix) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(texte)
      u.lang = 'fr-FR'
      u.rate = 0.82        // plus lent que la normale : on guide, on ne lit pas
      u.pitch = 0.95
      window.speechSynthesis.speak(u)
    } catch (_) {}
  }, [voix, dispoVoix])

  // On coupe la voix des qu'on quitte : une voix qui continue apres la
  // fermeture de l'ecran est le pire defaut possible sur ce genre d'outil.
  useEffect(() => () => { try { window.speechSynthesis?.cancel() } catch (_) {} }, [])

  useEffect(() => {
    if (!enCours || !etape) return
    if (restant <= 0) {
      if (idx + 1 >= s.etapes.length) {
        setEnCours(false); setFini(true)
        try { window.speechSynthesis?.cancel() } catch (_) {}
        return
      }
      const suivant = idx + 1
      setIdx(suivant)
      setRestant(s.etapes[suivant].t)
      parler(s.etapes[suivant].x)
      return
    }
    const t = setTimeout(() => setRestant(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [enCours, restant, idx, s, etape, parler])

  const demarrer = (x) => {
    setSeance(x.id); setIdx(0); setRestant(x.etapes[0].t)
    setFini(false); setEnCours(true)
    parler(x.etapes[0].x)
  }

  const arreter = () => {
    setEnCours(false); setSeance(null); setIdx(0); setFini(false)
    try { window.speechSynthesis?.cancel() } catch (_) {}
  }

  const total = s ? s.etapes.reduce((a, e) => a + e.t, 0) : 0
  const passe = s ? s.etapes.slice(0, idx).reduce((a, e) => a + e.t, 0) + ((etape?.t || 0) - restant) : 0

  return (
    <div style={{ ...CARD, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, fontFamily: F, marginBottom: 3 }}>
        Méditation guidée
      </div>
      <div style={{ fontSize: 12, color: ENCRE, fontFamily: F, lineHeight: 1.5, marginBottom: 14 }}>
        {dispoVoix
          ? 'Le texte s\'affiche et peut être dit à voix haute. Tu peux couper la voix et seulement lire.'
          : 'Le texte s\'affiche étape par étape, à ton rythme.'}
      </div>

      <AnimatePresence mode="wait">
        {!s ? (
          <motion.div key="liste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {SEANCES.map(x => (
              <motion.button key={x.id} whileTap={{ scale: 0.98 }} onClick={() => demarrer(x)}
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: '13px 15px', borderRadius: 16,
                  fontFamily: F, background: 'rgba(var(--rgb-verre), 0.20)',
                  border: '1px solid rgba(var(--rgb-creme-dore), 0.35)',
                }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: ENCRE }}>{x.nom}</div>
                <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 2 }}>{x.detail}</div>
              </motion.button>
            ))}
            <div style={{ fontSize: 10.5, color: ENCRE, fontFamily: F, lineHeight: 1.5, marginTop: 4, opacity: 0.85 }}>
              Ces séances aident à se poser. Elles ne remplacent pas un
              accompagnement si tu traverses quelque chose de lourd.
            </div>
          </motion.div>
        ) : fini ? (
          <motion.div key="fin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '18px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, fontFamily: F, marginBottom: 6 }}>
              C'est fini.
            </div>
            <div style={{ fontSize: 12.5, color: ENCRE, fontFamily: F, lineHeight: 1.6, marginBottom: 16 }}>
              Reprends ton temps avant de repartir.
            </div>
            <button onClick={arreter}
              style={{
                padding: '11px 20px', borderRadius: 14, cursor: 'pointer', fontFamily: F,
                fontSize: 13, fontWeight: 700, color: ENCRE,
                background: 'rgba(var(--rgb-verre), 0.32)', border: `1.5px solid ${ICONE}`,
              }}>
              Revenir aux séances
            </button>
          </motion.div>
        ) : (
          <motion.div key="cours" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{
              height: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 16,
              background: 'rgba(var(--rgb-creme-dore), 0.22)',
            }}>
              <motion.div
                animate={{ width: `${total ? (passe / total) * 100 : 0}%` }}
                transition={{ duration: 0.9, ease: 'linear' }}
                style={{ height: '100%', background: ICONE }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={idx}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                style={{
                  fontSize: 15, color: ENCRE, fontFamily: F, lineHeight: 1.7,
                  minHeight: 120, textAlign: 'center', padding: '0 4px',
                }}>
                {etape?.x}
              </motion.div>
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <button onClick={() => setEnCours(e => !e)}
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 14, cursor: 'pointer',
                  fontFamily: F, fontSize: 13, fontWeight: 700, color: ENCRE,
                  background: 'rgba(var(--rgb-verre), 0.32)', border: `1.5px solid ${ICONE}`,
                }}>
                {enCours ? 'Pause' : 'Reprendre'}
              </button>
              {dispoVoix && (
                <button onClick={() => {
                  setVoix(v => {
                    if (v) { try { window.speechSynthesis.cancel() } catch (_) {} }
                    return !v
                  })
                }}
                  style={{
                    padding: '11px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: F,
                    fontSize: 12, fontWeight: 600, color: ENCRE, background: 'transparent',
                    border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
                  }}>
                  {voix ? 'Voix' : 'Muet'}
                </button>
              )}
              <button onClick={arreter}
                style={{
                  padding: '11px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: F,
                  fontSize: 12, fontWeight: 600, color: ENCRE, background: 'transparent',
                  border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
                }}>
                Arrêter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
