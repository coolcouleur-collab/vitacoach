// ─────────────────────────────────────────────────────────────────────────────
// LES POSTURES DE YOGA ET DE MÉDITATION
//
// Même principe que le guide des exercices, et mêmes règles apprises le
// 3 septembre : chaque photo a été choisie en REGARDANT les images, jamais sur
// la foi d'une description, puis vérifiée au recadrage réel. Une photo qui
// enseigne une autre posture est pire que pas de photo.
//
// Ce n'est pas un cours de yoga. Cinq postures accessibles, tenues au calme,
// avec un minuteur qui compte à la place de la personne pour qu'elle n'ait pas
// à surveiller l'heure. Les erreurs fréquentes sont dites, parce qu'une
// posture mal tenue fait plus de mal que pas de posture.
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

const photo = id =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`

const POSTURES = [
  {
    id: 'assise',
    nom: 'Assise de méditation',
    cible: 'Dos · respiration',
    duree: 180,
    img: photo(3822454),          // assise jambes croisees, mains jointes
    etapes: [
      'Assieds-toi en tailleur, un coussin sous les fesses si les genoux tirent',
      'Bassin légèrement basculé en avant, colonne longue sans être raide',
      'Mains sur les cuisses ou jointes, épaules relâchées',
      'Respire par le nez, sans chercher à ralentir : ça vient seul',
    ],
    erreurs: [
      'S\'asseoir à plat sur le sol quand les hanches sont raides : le dos s\'arrondit',
      'Tenir les épaules hautes en croyant se redresser',
    ],
  },
  {
    id: 'arbre',
    nom: 'Posture de l\'arbre',
    cible: 'Équilibre · concentration',
    duree: 60,
    img: photo(34382727),         // debout sur une jambe, pied contre la cuisse
    etapes: [
      'Debout, transfère ton poids sur une jambe',
      'Pose la plante de l\'autre pied contre le mollet ou la cuisse, jamais sur le genou',
      'Mains jointes devant la poitrine, regard posé sur un point fixe',
      'Change de côté après une minute',
    ],
    erreurs: [
      'Poser le pied SUR le genou : l\'articulation n\'est pas faite pour ça',
      'Chercher l\'immobilité parfaite : osciller fait partie de la posture',
    ],
  },
  {
    id: 'torsion',
    nom: 'Torsion assise',
    cible: 'Dos · digestion',
    duree: 90,
    img: photo(3756514),          // assise au sol, buste pivote, jambe croisee
    etapes: [
      'Assis, une jambe tendue, l\'autre pied croisé par-dessus',
      'Tourne le buste du côté du genou plié, coude en appui contre lui',
      'Grandis-toi à l\'inspiration, tourne un peu plus à l\'expiration',
      'Défais lentement, puis change de côté',
    ],
    erreurs: [
      'Tirer sur le genou avec le bras pour forcer la rotation',
      'Tasser la colonne : on s\'allonge avant de tourner',
    ],
  },
  {
    id: 'cobra',
    nom: 'Posture du cobra',
    cible: 'Dos · ouverture',
    duree: 45,
    img: photo(3823076),          // bassin au sol, buste deroule, bras tendus
    etapes: [
      'À plat ventre, mains posées sous les épaules',
      'Déroule le buste vers le haut sans forcer sur les bras',
      'Épaules basses et loin des oreilles, bassin au sol',
      'Redescends vertèbre après vertèbre',
    ],
    erreurs: [
      'Pousser sur les bras au point de cambrer le bas du dos',
      'Décoller le bassin : ce n\'est plus la même posture',
    ],
  },
  {
    id: 'relachement',
    nom: 'Relâchement',
    cible: 'Récupération · fin de séance',
    duree: 300,
    img: photo(6958068),          // allongee sur le dos, bras le long du corps
    etapes: [
      'Allonge-toi sur le dos, bras le long du corps, paumes vers le ciel',
      'Laisse les pieds tomber vers l\'extérieur',
      'Ferme les yeux et relâche la mâchoire, puis les épaules',
      'Ne cherche rien. C\'est la posture la plus difficile parce qu\'il n\'y a rien à faire',
    ],
    erreurs: [
      'La sauter parce qu\'elle a l\'air inutile',
      'S\'agiter dès que le mental parle : le laisser parler suffit',
    ],
  },
]

function Minuteur({ duree, onFini }) {
  const [restant, setRestant] = useState(duree)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => { setRestant(duree); setEnCours(false) }, [duree])

  useEffect(() => {
    if (!enCours) return
    if (restant <= 0) { setEnCours(false); onFini?.(); return }
    const t = setTimeout(() => setRestant(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [enCours, restant, onFini])

  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const part = duree > 0 ? 1 - restant / duree : 0

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        height: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 10,
        background: 'rgba(var(--rgb-creme-dore), 0.22)',
      }}>
        <motion.div
          animate={{ width: `${part * 100}%` }}
          transition={{ duration: 0.9, ease: 'linear' }}
          style={{ height: '100%', background: ICONE }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 20, fontWeight: 700, color: ENCRE, fontFamily: F,
          fontVariantNumeric: 'tabular-nums', minWidth: 62,
        }}>{mmss(Math.max(0, restant))}</span>
        <button
          onClick={() => setEnCours(e => !e)}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 14, cursor: 'pointer',
            fontFamily: F, fontSize: 13, fontWeight: 700, color: ENCRE,
            background: 'rgba(var(--rgb-verre), 0.32)',
            border: `1.5px solid ${ICONE}`,
          }}>
          {enCours ? 'Pause' : restant === duree ? 'Tenir la posture' : 'Reprendre'}
        </button>
        <button
          onClick={() => { setEnCours(false); setRestant(duree) }}
          style={{
            padding: '10px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: F,
            fontSize: 12, fontWeight: 600, color: ENCRE, background: 'transparent',
            border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
          }}>
          Zéro
        </button>
      </div>
    </div>
  )
}

export default function YogaPostures() {
  const [ouverte, setOuverte] = useState(null)
  const p = POSTURES.find(x => x.id === ouverte)

  return (
    <div style={{ ...CARD, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, fontFamily: F, marginBottom: 3 }}>
        Postures
      </div>
      <div style={{ fontSize: 12, color: ENCRE, fontFamily: F, lineHeight: 1.5, marginBottom: 14 }}>
        Cinq postures accessibles. Le minuteur compte à ta place, tu n'as pas à
        surveiller l'heure.
      </div>

      <AnimatePresence mode="wait">
        {!p ? (
          <motion.div key="liste"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {POSTURES.map(x => (
              <motion.button key={x.id} whileTap={{ scale: 0.97 }}
                onClick={() => setOuverte(x.id)}
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: 0, overflow: 'hidden',
                  borderRadius: 16, fontFamily: F,
                  background: 'rgba(var(--rgb-verre), 0.20)',
                  border: '1px solid rgba(var(--rgb-creme-dore), 0.35)',
                }}>
                <div style={{ height: 110, overflow: 'hidden', background: 'rgba(var(--rgb-photo), 0.60)' }}>
                  <img src={x.img} alt={x.nom} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '9px 11px 11px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ENCRE }}>{x.nom}</div>
                  <div style={{ fontSize: 10.5, color: ENCRE, marginTop: 2 }}>{x.cible}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div key="fiche"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ height: 190, borderRadius: 18, overflow: 'hidden', marginBottom: 12, background: 'rgba(var(--rgb-photo), 0.60)' }}>
              <img src={p.img} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: ENCRE, fontFamily: F }}>{p.nom}</div>
            <div style={{ fontSize: 11.5, color: ENCRE, fontFamily: F, marginBottom: 12 }}>{p.cible}</div>

            <ol style={{ margin: 0, paddingLeft: 18 }}>
              {p.etapes.map((e, i) => (
                <li key={i} style={{ fontSize: 12.5, color: ENCRE, fontFamily: F, lineHeight: 1.6, marginBottom: 4 }}>{e}</li>
              ))}
            </ol>

            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 12,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: ENCRE, fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>
                À éviter
              </div>
              {p.erreurs.map((e, i) => (
                <div key={i} style={{ fontSize: 11.5, color: ENCRE, fontFamily: F, lineHeight: 1.5 }}>· {e}</div>
              ))}
            </div>

            <Minuteur duree={p.duree} />

            <button
              onClick={() => setOuverte(null)}
              style={{
                width: '100%', marginTop: 10, padding: '10px 14px', borderRadius: 14,
                cursor: 'pointer', fontFamily: F, fontSize: 12.5, fontWeight: 600,
                color: ENCRE, background: 'transparent',
                border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
              }}>
              Retour aux postures
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
