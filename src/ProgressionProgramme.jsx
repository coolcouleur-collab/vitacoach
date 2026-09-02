// ─────────────────────────────────────────────────────────────────────────────
// LA PROGRESSION DU PROGRAMME
//
// Ce bloc vivait au milieu de l'écran du programme, entre la séance du jour et
// le conseil nutrition. Il n'y était pas à sa place : le programme répond à
// « qu'est-ce que je fais aujourd'hui ? », et une barre de progression répond
// à « où j'en suis ? ». Deux questions qu'on ne se pose pas au même moment, et
// l'app a un onglet pour la seconde.
//
// Il est donc dans Progrès, à côté des autres mesures, et l'écran du programme
// s'est allégé d'autant.
//
// Conséquence de ce déplacement : ce composant va chercher le programme actif
// lui-même, au lieu de le recevoir de son parent. C'est un appel de plus, mais
// il est mis en cache par le navigateur pendant que l'autre onglet l'utilise,
// et l'alternative serait de faire remonter l'état du programme jusqu'à la
// racine de l'app pour le redescendre ailleurs.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StarIcon } from './Icons'
import { authHeaders } from './supabase'
import { ENCRE, ICONE, AMBRE, VERT } from './palette'

const API = import.meta.env.VITE_API_URL || ''

export default function ProgressionProgramme({ userId }) {
  const [challenge, setChallenge] = useState(null)
  const [showGrille, setShowGrille] = useState(false)

  useEffect(() => {
    if (!userId) return
    let vivant = true
    ;(async () => {
      try {
        const r = await fetch(`${API}/api/challenge?userId=${userId}`, {
          headers: await authHeaders(),
        })
        const d = await r.json()
        if (vivant) setChallenge(d.challenge || null)
      } catch {}
    })()
    return () => { vivant = false }
  }, [userId])

  // Sans programme en cours, ce bloc n'a rien a dire : il ne s'affiche pas du
  // tout, plutot que de montrer une barre a zero qui ressemble a un echec.
  if (!challenge) return null

  const jours = challenge.challenge?.jours || []
  const duree = jours.length || challenge.duree || 21
  const progression = challenge.progression || Array(duree).fill(false)
  const completedCount = progression.filter(Boolean).length
  const numCycle = challenge.challenge?.cycle || 1

  const ecoules = Math.floor((Date.now() - new Date(challenge.date_debut).getTime()) / 86400000)
  const jourActuel = Math.min(Math.max(ecoules + 1, 1), duree)

  const MILESTONES_JOURS = duree <= 21
    ? [7, 14, duree]
    : [7, 14, 21, Math.round(duree / 2) + 7, duree]

  return (
    <div style={{ marginBottom: 22 }}>
      {/* ── HEADER ── */}
      <div
        style={{
          background: 'rgba(var(--rgb-creme), 0.22)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '20px',
          padding: '24px 28px',
          border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
          boxShadow: '0 4px 24px rgba(var(--rgb-terracotta), 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              // Le Cormorant a ete retire de toute l'ecriture de l'app le
              // 1er septembre. Il etait reste ici, cache au milieu d'un bloc
              // que personne ne relisait.
              fontFamily: "'Poppins', sans-serif",
              fontSize: '17px',
              fontWeight: 700,
              color: ENCRE,
              margin: 0,
              flex: 1,
            }}
          >
            {/* Le titre invente par le modele, « Équilibre Vital 21 Jours »,
                ne disait rien a personne : le suivi porte un nom
                fonctionnel, l'objectif est deja dans Ton cap
                (constat Jean 2026-08-13). */}
            Ta progression sur {duree} jours{numCycle > 1 ? ` · cycle ${numCycle}` : ''}
          </h2>

          <div
            style={{
              background: 'rgba(var(--rgb-or), 0.12)',
              color: AMBRE,
              borderRadius: '12px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Jour {jourActuel} / {duree}
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{ marginBottom: '4px' }}>
          <div
            style={{
              height: '6px',
              borderRadius: '12px',
              background: 'rgba(var(--rgb-terracotta), 0.12)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / duree) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, var(--accent) 0%, var(--or-plein) 100%)',
              }}
            />
          </div>
          <p
            style={{
              fontSize: '11px',
              color: ENCRE,
              marginTop: '6px',
              textAlign: 'right',
            }}
          >
            {completedCount} / {duree} jours complétés
          </p>
          <button
            onClick={() => setShowGrille(v => !v)}
            style={{
              marginTop: 8, padding: '7px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(var(--rgb-terracotta), 0.28)',
              color: ENCRE, fontSize: 11.5, fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
            }}>
            {showGrille ? 'Masquer ma progression' : 'Voir ma progression jour par jour'}
          </button>
        </div>
      </div>

      {/* ── GRILLE 21 JOURS, repliée par défaut. La page ouvrait sur
           trois rangées de cases avant de dire quoi FAIRE aujourd'hui :
           c'était le cœur du « brouillon » (redesign Jean 2026-08-13).
           Le détail reste à un tap, la barre suffit au quotidien. ── */}
      {showGrille && (
      <div
        style={{
          background: 'rgba(var(--rgb-creme), 0.22)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '20px',
          padding: '24px 28px',
          border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
          boxShadow: '0 4px 24px rgba(var(--rgb-terracotta), 0.08)',
        }}
      >
        <h3
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            color: ENCRE,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
          }}
        >
          Progression
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
          }}
        >
          {Array.from({ length: duree }, (_, i) => {
            const numJour = i + 1
            const estPasse = numJour < jourActuel
            const estAujourdhui = numJour === jourActuel
            const estFutur = numJour > jourActuel
            const estComplete = progression[i]
            const estMilestone = MILESTONES_JOURS.includes(numJour)

            let bgColor = 'rgba(var(--rgb-terracotta), 0.04)'
            let borderColor = 'rgba(var(--rgb-terracotta), 0.08)'
            let textColor = 'rgba(var(--rgb-terracotta), 0.35)'
            let borderWidth = '1px'

            if (estPasse && estComplete) {
              bgColor = 'rgba(34,197,94,0.15)'
              borderColor = '#22c55e'
              textColor = '#22c55e'
            } else if (estPasse && !estComplete) {
              // Jour passé non fait : simplement estompé, jamais rouge.
              // Une grille de 13 cases rouges transforme un programme raté
              // en mur d'échecs et donne envie de fermer l'app, l'inverse
              // de ce qu'un coach doit produire (retour Jean 2026-08-08).
              bgColor = 'rgba(var(--rgb-terracotta), 0.05)'
              borderColor = 'rgba(var(--rgb-terracotta), 0.12)'
              textColor = 'rgba(var(--rgb-terracotta), 0.28)'
            } else if (estAujourdhui) {
              bgColor = 'rgba(var(--rgb-or), 0.18)'
              borderColor = 'var(--or-plein)'
              textColor = 'var(--accent)'
              borderWidth = '2px'
            }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: bgColor,
                  border: `${borderWidth} solid ${borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                }}
              >
                {/* Indicateur pulsant pour aujourd'hui */}
                {estAujourdhui && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      inset: '-3px',
                      borderRadius: '12px',
                      border: '2px solid var(--or-plein)',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Badge étoile milestone */}
                {estMilestone && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      fontSize: '10px',
                      lineHeight: 1,
                      zIndex: 1,
                    }}
                  >
                    <StarIcon size={10} color="white" />
                  </div>
                )}

                {/* Contenu */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: estAujourdhui ? 700 : 500,
                    color: textColor,
                    lineHeight: 1,
                  }}
                >
                  {estPasse && estComplete ? '✓' : numJour}
                </span>
                {estPasse && estComplete && (
                  <span
                    style={{
                      fontSize: '8px',
                      color: textColor,
                      lineHeight: 1,
                      marginTop: '1px',
                    }}
                  >
                    {numJour}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
