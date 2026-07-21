import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TargetIcon, SparkleIcon, StarIcon } from './Icons'

const API = import.meta.env.VITE_API_URL || ''

export default function Challenge21j({ userId, isPro, onPasserPro }) {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const fetchChallenge = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API}/api/challenge?userId=${userId}`)
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
                : 'linear-gradient(135deg, #C87B52 0%, #E8962A 100%)',
              color: '#fff',
              border: 'none',
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
                  bgColor = 'rgba(239,68,68,0.08)'
                  borderColor = 'rgba(239,68,68,0.3)'
                  textColor = '#ef4444'
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
                    background: 'linear-gradient(135deg, #C87B52 0%, #E8962A 100%)',
                    color: '#fff',
                    border: 'none',
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
                color: '#ef4444',
                border: '1.5px solid rgba(239,68,68,0.35)',
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

      {/* Dialog de confirmation reset */}
      <AnimatePresence>
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
                background: 'rgba(22,9,2,0.92)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,220,160,0.22)',
                borderRadius: 24, padding: '28px 24px',
                maxWidth: 340, width: '100%',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <div style={{ display:'flex', justifyContent:'center', marginBottom: 10 }}><SparkleIcon size={22} color="#E8962A" /></div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,238,220,0.92)', textAlign: 'center', marginBottom: 8 }}>
                Nouveau challenge ?
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,238,220,0.60)', textAlign: 'center', marginBottom: 24 }}>
                Le challenge actuel sera remplacé et ta progression perdue.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: 'rgba(255,235,210,0.08)',
                    border: '1px solid rgba(255,220,160,0.18)',
                    color: 'rgba(255,238,220,0.70)', fontSize: 14,
                    fontFamily: "'Poppins', sans-serif", cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => { setConfirmReset(false); handleCreerChallenge() }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #C87B52, #E8962A)',
                    border: '1px solid rgba(255,220,160,0.30)',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif", cursor: 'pointer',
                  }}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
