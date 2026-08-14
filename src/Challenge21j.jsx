import React, { useState, useEffect, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TargetIcon, SparkleIcon, StarIcon } from './Icons'
import { authHeaders } from './supabase'
import { matchExercice, PHOTOS_EXOS } from './ExercicesGuide'

const ExercicesGuide = lazy(() => import('./ExercicesGuide'))

const API = import.meta.env.VITE_API_URL || ''

// ─── Ligne d'exercice d'une séance du programme (photo + reps + fiche) ───────
// Les photos viennent de PHOTOS_EXOS (choisies à la main dans ExercicesGuide).
// Avant, chaque ligne appelait /api/image : le front tape Render, dont la route
// du même nom est écrite pour la page Style et renvoyait la même photo de mode
// pour tous les exercices (corrigé 2026-08-11).
const EXO_INFOS = {
  squat:     { nom: 'Squat' },
  gainage:   { nom: 'Gainage' },
  fente:     { nom: 'Fentes' },
  pont:      { nom: 'Pont fessier' },
  chaise:    { nom: 'Chaise au mur' },
  chatvache: { nom: 'Chat-vache' },
  marche:    { nom: 'Marche active' },
  etirement: { nom: 'Étirements' },
  pompe:       { nom: 'Pompes' },
  pompegenoux: { nom: 'Pompes sur genoux' },
  superman:    { nom: 'Superman' },
  dips:        { nom: 'Dips sur chaise' },
}

function SeanceRow({ item, onFiche }) {
  const info = EXO_INFOS[item.exo] || { nom: item.exo }
  const photo = PHOTOS_EXOS[item.exo] || null
  const [img, setImg] = useState(photo?.url || null)
  return (
    <button onClick={onFiche} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,235,210,0.30)', border: '1px solid rgba(255,220,160,0.35)',
      borderRadius: 14, padding: '8px 10px', marginBottom: 8, cursor: 'pointer',
      fontFamily: "'Poppins', sans-serif", textAlign: 'left',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,240,220,0.70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {img
          ? <img src={img} alt={info.nom} loading="lazy" onError={() => setImg(null)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', objectPosition: `center ${photo?.pos || '50%'}` }} />
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C87B52" strokeWidth="1.6" strokeLinecap="round"><path d="M14.4 14.4 9.6 9.6M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829zM5.343 2.515a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829L6.404 12.77a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829z"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,123,82,0.92)' }}>{info.nom}</div>
        <div style={{ fontSize: 11.5, color: 'rgba(200,123,82,0.60)' }}>{item.reps}</div>
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: '#B2663E', background: 'rgba(255,235,210,0.55)', border: '1px solid rgba(255,220,160,0.45)', borderRadius: 99, padding: '4px 10px', flexShrink: 0 }}>
        Voir le geste
      </span>
    </button>
  )
}

export default function Challenge21j({ userId, isPro, onPasserPro }) {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [exoGuide, setExoGuide] = useState(null)

  const fetchChallenge = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API}/api/challenge?userId=${userId}`, { headers: await authHeaders() })
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setChallenge(data.challenge || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleCreerChallenge = async () => {
    try {
      setCreating(true)
      setError(null)
      const res = await fetch(`${API}/api/challenge-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId, duree: 21 }),
      })
      if (!res.ok) throw new Error('Erreur lors de la création')
      await fetchChallenge()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleMarquerFait = async (jourIndex) => {
    try {
      const res = await fetch(`${API}/api/challenge-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId, jour: jourIndex, complete: true }),
      })
      if (!res.ok) throw new Error('Erreur lors de la mise à jour')
      await fetchChallenge()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleNouveauChallenge = () => setConfirmReset(true)

  // ── Calcul des données ──────────────────────────────────────────
  let jourActuel = 1
  let progression = Array(21).fill(false)
  let completedCount = 0
  let jours = []
  let milestones = []

  if (challenge) {
    const dateDebut = new Date(challenge.date_debut)
    const now = new Date()
    const diffMs = now - dateDebut
    const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    jourActuel = Math.min(Math.max(diffJours + 1, 1), 21)

    progression = challenge.progression || Array(21).fill(false)
    completedCount = progression.filter(Boolean).length

    jours = challenge.challenge?.jours || []
    milestones = challenge.challenge?.milestones || []
  }

  const jourActuelData = jours[jourActuel - 1] || null
  // Le jour en cours est le seul affiche, et les premiers jours sont
  // volontairement legers pour ne pas cramer un debutant. Resultat : la
  // personne qui decouvre son programme voit le jour le plus pauvre des 21 et
  // juge sur celui-la. On lui montre donc ce qui arrive demain (2026-08-12).
  const jourSuivantData = jours[jourActuel] || null
  const jourActuelComplete = progression[jourActuel - 1] || false

  const prochainsJoursMilestone = milestones
    .filter((m) => m.jour > jourActuel)
    .sort((a, b) => a.jour - b.jour)
  const prochainMilestone = prochainsJoursMilestone[0] || null

  const MILESTONES_JOURS = [7, 14, 21]

  // ── STYLES ────────────────────────────────────────────────────────
  const styles = {
    container: {
      fontFamily: "'Poppins', sans-serif",
      color: 'rgba(200,123,82,0.92)',
      padding: '24px',
      maxWidth: '700px',
      margin: '0 auto',
    },
    card: {
      background: 'rgba(255,235,210,0.22)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      borderRadius: '20px',
      padding: '28px',
      border: '1px solid rgba(255,220,160,0.28)',
      boxShadow: '0 4px 24px rgba(200,123,82,0.10)',
    },
  }

  // ── 1. LOADING ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.container}>
        <div
          style={{
            background: 'rgba(200,123,82,0.06)',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {[120, 80, 200].map((width, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              style={{
                height: i === 2 ? '80px' : '20px',
                width: `${width}px`,
                background: 'rgba(200,123,82,0.18)',
                borderRadius: '12px',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── 2. PAS DE CHALLENGE (tout le monde peut créer le premier) ───
  if (!challenge) {
    return (
      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ ...styles.card, textAlign: 'center' }}
        >
          <div style={{ display:'flex', justifyContent:'center', marginBottom: '12px' }}><SparkleIcon size={52} color="#E8962A" /></div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: '26px',
              fontWeight: 700,
              color: 'rgba(200,123,82,0.92)',
              marginBottom: '8px',
            }}
          >
            Prêt pour un défi ?
          </h2>
          <p
            style={{
              color: 'rgba(200,123,82,0.65)',
              fontSize: '14px',
              marginBottom: '28px',
              lineHeight: 1.6,
            }}
          >
            Solenn crée un challenge 21 jours personnalisé basé sur ton profil et tes métriques
          </p>

          {error && (
            <p
              style={{
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: '12px',
                padding: '10px',
              }}
            >
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreerChallenge}
            disabled={creating}
            style={{
              background: creating
                ? 'rgba(200,123,82,0.4)'
                : 'rgba(255,235,210,0.32)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              color: '#B2663E',
              border: '1px solid rgba(255,220,160,0.38)',
              borderRadius: '16px',
              padding: '14px 32px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              cursor: creating ? 'not-allowed' : 'pointer',
              boxShadow: creating ? 'none' : '0 4px 20px rgba(200,123,82,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {creating ? 'Création en cours…' : <span style={{display:'flex',alignItems:'center',gap:6}}><TargetIcon size={13} color="white" />Créer mon challenge</span>}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── 4. CHALLENGE PRINCIPAL ───────────────────────────────────────
  return (
    <div style={styles.container}>
      <AnimatePresence>
        <motion.div
          key="challenge-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* ── HEADER ── */}
          <div
            style={{
              background: 'rgba(255,235,210,0.22)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '20px',
              padding: '24px 28px',
              border: '1px solid rgba(255,220,160,0.28)',
              boxShadow: '0 4px 24px rgba(200,123,82,0.08)',
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
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'rgba(200,123,82,0.92)',
                  margin: 0,
                  flex: 1,
                }}
              >
                {challenge?.challenge?.titre || 'Challenge 21 jours'}
              </h2>

              <div
                style={{
                  background: 'rgba(232,150,42,0.12)',
                  color: '#E8962A',
                  borderRadius: '12px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                Jour {jourActuel} / 21
              </div>
            </div>

            {/* Barre de progression */}
            <div style={{ marginBottom: '4px' }}>
              <div
                style={{
                  height: '6px',
                  borderRadius: '12px',
                  background: 'rgba(200,123,82,0.12)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / 21) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: '12px',
                    background: 'linear-gradient(90deg, #C87B52 0%, #E8962A 100%)',
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: 'rgba(200,123,82,0.50)',
                  marginTop: '6px',
                  textAlign: 'right',
                }}
              >
                {completedCount} / 21 jours complétés
              </p>
            </div>
          </div>

          {/* ── GRILLE 21 JOURS ── */}
          <div
            style={{
              background: 'rgba(255,235,210,0.22)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '20px',
              padding: '24px 28px',
              border: '1px solid rgba(255,220,160,0.28)',
              boxShadow: '0 4px 24px rgba(200,123,82,0.08)',
            }}
          >
            <h3
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(200,123,82,0.55)',
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
              {Array.from({ length: 21 }, (_, i) => {
                const numJour = i + 1
                const estPasse = numJour < jourActuel
                const estAujourdhui = numJour === jourActuel
                const estFutur = numJour > jourActuel
                const estComplete = progression[i]
                const estMilestone = MILESTONES_JOURS.includes(numJour)

                let bgColor = 'rgba(200,123,82,0.04)'
                let borderColor = 'rgba(200,123,82,0.08)'
                let textColor = 'rgba(200,123,82,0.35)'
                let borderWidth = '1px'

                if (estPasse && estComplete) {
                  bgColor = 'rgba(34,197,94,0.15)'
                  borderColor = '#22c55e'
                  textColor = '#22c55e'
                } else if (estPasse && !estComplete) {
                  // Jour passé non fait : simplement estompé, jamais rouge.
                  // Une grille de 13 cases rouges transforme un programme raté
                  // en mur d'échecs et donne envie de fermer l'app — l'inverse
                  // de ce qu'un coach doit produire (retour Jean 2026-08-08).
                  bgColor = 'rgba(200,123,82,0.05)'
                  borderColor = 'rgba(200,123,82,0.12)'
                  textColor = 'rgba(200,123,82,0.28)'
                } else if (estAujourdhui) {
                  bgColor = 'rgba(232,150,42,0.18)'
                  borderColor = '#E8962A'
                  textColor = '#C87B52'
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
                          border: '2px solid #E8962A',
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

          {/* ── Guide des exercices (ouvert depuis « Voir le geste ») ── */}
          {exoGuide && (
            <Suspense fallback={null}>
              <ExercicesGuide initial={exoGuide} onClose={() => setExoGuide(null)} />
            </Suspense>
          )}

          {/* ── ACTION DU JOUR ── */}
          {jourActuelData && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                background: 'rgba(255,235,210,0.22)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '20px',
                padding: '24px 28px',
                border: '1px solid rgba(255,220,160,0.28)',
                boxShadow: '0 4px 32px rgba(200,123,82,0.12)',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(200,123,82,0.50)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '10px',
                }}
              >
                Aujourd'hui — Jour {jourActuel}
              </p>

              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'rgba(200,123,82,0.92)',
                  marginBottom: '10px',
                  lineHeight: 1.5,
                }}
              >
                {jourActuelData.action}
              </p>

              {/* ── Séance structurée du programme (exercices + reps + photos) ── */}
              {jourActuelData.seance?.length > 0 && (
                <div style={{ margin: '4px 0 10px' }}>
                  {jourActuelData.seance.map((s, i) => (
                    <SeanceRow key={i} item={s} onFiche={() => setExoGuide(s.exo || null)} />
                  ))}
                </div>
              )}
              {/* ── Conseil nutrition du jour ── */}
              {jourActuelData.nutrition && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  background: 'rgba(255,235,210,0.35)', border: '1px solid rgba(255,220,160,0.40)',
                  borderRadius: 12, padding: '9px 12px', marginBottom: 12,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8962A" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                  <span style={{ fontSize: 11.5, color: 'rgba(178,102,62,0.88)', lineHeight: 1.55, fontFamily: "'Poppins', sans-serif" }}>
                    {jourActuelData.nutrition}
                  </span>
                </div>
              )}
              {/* « Voir le geste » — si l'action mentionne un exercice du guide
                  (masqué quand une séance structurée est déjà affichée) */}
              {!jourActuelData.seance?.length && matchExercice(jourActuelData.action) && (
                <button onClick={() => setExoGuide(matchExercice(jourActuelData.action))} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
                  background: 'rgba(255,235,210,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,220,160,0.45)', borderRadius: 99,
                  padding: '7px 14px', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif", fontSize: 11.5, fontWeight: 600, color: '#B2663E',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#B2663E"><polygon points="6 3 20 12 6 21"/></svg>
                  Voir le geste
                </button>
              )}

              {jourActuelData.duree && (
                <span
                  style={{
                    display: 'inline-block',
                    background: 'rgba(232,150,42,0.12)',
                    color: '#E8962A',
                    borderRadius: '12px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  {jourActuelData.duree}
                </span>
              )}

              {jourActuelData.pourquoi && (
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: '14px',
                    color: 'rgba(200,123,82,0.60)',
                    marginBottom: '20px',
                    lineHeight: 1.6,
                  }}
                >
                  {jourActuelData.pourquoi}
                </p>
              )}

              {/* Aperçu de demain — donne envie de revenir, et montre que le
                  programme est plus riche que le jour qu'on a sous les yeux. */}
              {jourSuivantData && jourActuel < 21 && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: 'rgba(255,235,210,0.28)',
                  border: '1px solid rgba(255,220,160,0.40)',
                  borderRadius: 14, padding: '11px 13px', marginBottom: 20,
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>
                    <SparkleIcon size={14} color="rgba(200,123,82,0.70)" />
                  </span>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(200,123,82,0.65)', marginBottom: 3 }}>
                      Demain · jour {jourActuel + 1}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(200,123,82,0.88)', lineHeight: 1.45, fontWeight: 500 }}>
                      {jourSuivantData.titre}
                    </div>
                    {jourSuivantData.seance?.length > 0 && (
                      <div style={{ fontSize: 11.5, color: 'rgba(200,123,82,0.62)', marginTop: 3 }}>
                        {jourSuivantData.seance.map(x => EXO_INFOS[x.exo]?.nom || x.exo).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p
                  style={{
                    color: '#ef4444',
                    fontSize: '12px',
                    marginBottom: '12px',
                    background: 'rgba(239,68,68,0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  {error}
                </p>
              )}

              {jourActuelComplete ? (
                <button
                  disabled
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22c55e',
                    border: '1.5px solid rgba(34,197,94,0.3)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: 'not-allowed',
                    width: '100%',
                  }}
                >
                  Fait aujourd'hui !
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMarquerFait(jourActuel - 1)}
                  style={{
                    background: 'rgba(255,235,210,0.32)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    color: '#B2663E',
                    border: '1px solid rgba(255,220,160,0.38)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: 'pointer',
                    width: '100%',
                    boxShadow: '0 4px 16px rgba(200,123,82,0.3)',
                  }}
                >
                  ✓ Marquer comme fait
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── PROCHAIN MILESTONE ── */}
          {prochainMilestone && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                background: 'rgba(200,123,82,0.05)',
                borderRadius: '16px',
                padding: '16px 20px',
                border: '1px solid rgba(200,123,82,0.12)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <p style={{ fontSize: '13px', color: 'rgba(200,123,82,0.65)', margin: 0 }}>
                <span style={{ fontWeight: 700, color: 'rgba(200,123,82,0.92)' }}>
                  Prochain milestone — Jour {prochainMilestone.jour} :
                </span>{' '}
                {prochainMilestone.message}
              </p>
            </motion.div>
          )}

          {/* ── BOUTON NOUVEAU CHALLENGE (Pro only) ── */}
          {isPro && (
          <div style={{ textAlign: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNouveauChallenge}
              disabled={creating}
              style={{
                background: 'transparent',
                // Terracotta et non #ef4444 : le rouge est reserve au danger
                // (contre-indications, suppression de compte). Ici c'est une
                // action normale, elle n'a pas a alarmer (2026-08-12).
                color: 'rgba(200,123,82,0.85)',
                border: '1.5px solid rgba(200,123,82,0.35)',
                borderRadius: '12px',
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
                cursor: creating ? 'not-allowed' : 'pointer',
                opacity: creating ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {creating ? 'Création…' : 'Nouveau challenge'}
            </motion.button>
          </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dialog de confirmation reset — portail vers <body> : rendu dans une
          carte animée (transform), un position:fixed serait piégé et invisible
          → le tap sur « Nouveau challenge » semblait ne rien faire */}
      {createPortal(<AnimatePresence>
        {confirmReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setConfirmReset(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                // Claire et non sombre : c'etait le seul element fonce de toute
                // l'app, il jurait avec la charte (constat Jean 2026-08-12).
                background: 'rgba(255,246,238,0.96)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(200,123,82,0.28)',
                boxShadow: '0 18px 60px rgba(120,60,20,0.28)',
                borderRadius: 24, padding: '28px 24px',
                maxWidth: 340, width: '100%',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <div style={{ display:'flex', justifyContent:'center', marginBottom: 10 }}><SparkleIcon size={22} color="#E8962A" /></div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(150,85,50,0.95)', textAlign: 'center', marginBottom: 8 }}>
                Nouveau challenge ?
              </div>
              <div style={{ fontSize: 13, color: 'rgba(160,100,60,0.75)', textAlign: 'center', marginBottom: 24 }}>
                Le challenge actuel sera remplacé et ta progression perdue.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: 'rgba(200,123,82,0.08)',
                    border: '1px solid rgba(200,123,82,0.25)',
                    color: 'rgba(160,100,60,0.85)', fontSize: 14,
                    fontFamily: "'Poppins', sans-serif", cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => { setConfirmReset(false); handleCreerChallenge() }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: 'rgba(255,235,210,0.32)',
                    border: '1px solid rgba(255,220,160,0.30)',
                    color: '#B2663E', fontSize: 14, fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif", cursor: 'pointer',
                  }}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  )
}
