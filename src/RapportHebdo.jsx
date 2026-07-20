import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StarIcon, SparkleIcon, LightbulbIcon, CalendarIcon } from './Icons'

const API = import.meta.env.VITE_API_URL || ''

export default function RapportHebdo({ userId, isPro, onPasserPro }) {
  const [rapport, setRapport] = useState(null)
  const [semaine, setSemaine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const fetchRapport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/rapport-hebdo?userId=${userId}`)
      if (!res.ok) throw new Error('Erreur lors du chargement du rapport')
      const data = await res.json()
      setRapport(data.rapport || null)
      setSemaine(data.semaine || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRapport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleGenerer = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/rapport-hebdo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error('Erreur lors de la génération du rapport')
      await fetchRapport()
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const getScoreColor = (score) => {
    if (score > 70) return '#22c55e'
    if (score > 50) return '#E8962A'
    return '#ef4444'
  }

  const formatSemaine = (semaine) => {
    if (!semaine) return ''
    try {
      const date = new Date(semaine)
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      return `Semaine du ${dd}/${mm}`
    } catch {
      return semaine
    }
  }

  // ─── État 1 : Loading skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'rgba(200, 123, 82, 0.06)',
              borderRadius: 12,
              height: i === 1 ? 80 : i === 2 ? 60 : 100,
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    )
  }

  // ─── État 2 : Paywall (pas Pro, pas de rapport) ───────────────────────────
  if (!isPro && !rapport) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'rgba(200, 123, 82, 0.08)',
          borderRadius: 20,
          padding: '28px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CalendarIcon size={32} color="rgba(200,123,82,0.70)" />
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: 'rgba(255,238,220,0.92)',
          margin: 0,
        }}>
          Rapport hebdomadaire
        </p>
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 13,
          color: 'rgba(255,238,220,0.75)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Analyse complète de ta semaine · score · victoires · focus
        </p>
        <button
          onClick={onPasserPro}
          style={{
            marginTop: 8,
            background: 'linear-gradient(135deg, #C87B52, #E8962A)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '12px 24px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            letterSpacing: 0.2,
          }}
        >
          <span style={{display:'flex',alignItems:'center',gap:6}}><StarIcon size={13} color="white" />Disponible avec Pro · 4,99€/mois</span>
        </button>
      </motion.div>
    )
  }

  // ─── État 3 : Pro mais pas de rapport ────────────────────────────────────
  if (isPro && !rapport) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'rgba(200, 123, 82, 0.08)',
          borderRadius: 20,
          padding: '28px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CalendarIcon size={32} color="rgba(200,123,82,0.70)" />
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: 'rgba(255,238,220,0.92)',
          margin: 0,
        }}>
          Pas encore de rapport cette semaine
        </p>
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 13,
          color: 'rgba(255,238,220,0.75)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Ton rapport sera généré automatiquement dimanche soir
        </p>
        {error && (
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: '#ef4444', margin: 0 }}>
            {error}
          </p>
        )}
        <button
          onClick={handleGenerer}
          disabled={generating}
          style={{
            marginTop: 8,
            background: 'transparent',
            color: '#C87B52',
            border: '1.5px solid #C87B52',
            borderRadius: 16,
            padding: '11px 24px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 14,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {generating ? 'Génération en cours…' : 'Générer maintenant'}
        </button>
      </motion.div>
    )
  }

  // ─── État 4 : Rapport complet ─────────────────────────────────────────────
  const scoreColor = getScoreColor(rapport.score_global)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {/* Header card */}
      <div style={{
        background: 'rgba(200, 123, 82, 0.10)',
        borderRadius: 20,
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ flexShrink: 0, display: 'flex' }}><CalendarIcon size={32} color="#E8962A" /></span>
            <div>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                color: 'rgba(255,238,220,0.92)',
                margin: 0,
                lineHeight: 1.3,
              }}>
                {rapport.titre}
              </p>
              {semaine && (
                <span style={{
                  display: 'inline-block',
                  marginTop: 4,
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#C87B52',
                  background: 'rgba(200, 123, 82, 0.12)',
                  borderRadius: 8,
                  padding: '2px 8px',
                }}>
                  {formatSemaine(semaine)}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 800,
              fontSize: 36,
              color: scoreColor,
              lineHeight: 1,
            }}>
              {rapport.score_global}
            </span>
            <p style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 10,
              color: 'rgba(255,238,220,0.55)',
              margin: '2px 0 0',
              textAlign: 'right',
            }}>
              /100
            </p>
          </div>
        </div>
      </div>

      {/* Victoire de la semaine */}
      {rapport.victoire_semaine && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.08)',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          border: '1px solid rgba(34, 197, 94, 0.18)',
        }}>
          <span style={{
            fontSize: 16,
            color: '#22c55e',
            fontWeight: 700,
            flexShrink: 0,
            marginTop: 1,
          }}>✓</span>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 15,
            color: 'rgba(255,238,220,0.92)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {rapport.victoire_semaine}
          </p>
        </div>
      )}

      {/* Stat phare */}
      {rapport.stat_phare && (
        <div style={{
          background: 'rgba(232, 150, 42, 0.10)',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          border: '1px solid rgba(232, 150, 42, 0.20)',
        }}>
          <span style={{ flexShrink: 0, marginTop: 1, display:'flex' }}><SparkleIcon size={16} color="#E8962A" /></span>
          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            color: 'rgba(255,238,220,0.92)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {typeof rapport.stat_phare === 'object'
              ? [rapport.stat_phare.valeur, rapport.stat_phare.label].filter(Boolean).join(' — ')
              : rapport.stat_phare}
          </p>
        </div>
      )}

      {/* Analyse — Cette semaine */}
      {rapport.analyse && (
        <div style={{
          background: 'rgba(200,123,82,0.06)',
          borderRadius: 16,
          padding: '14px 16px',
        }}>
          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 11,
            color: '#C87B52',
            margin: '0 0 6px',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}>
            Cette semaine
          </p>
          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 13,
            color: 'rgba(255,238,220,0.85)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {rapport.analyse}
          </p>
        </div>
      )}

      {/* 2 colonnes : point fort + point progrès */}
      {(rapport.point_fort || rapport.point_progres) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Point fort */}
          {rapport.point_fort && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              borderRadius: 16,
              padding: '14px 14px',
              border: '1px solid rgba(34, 197, 94, 0.15)',
            }}>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 11,
                color: '#22c55e',
                margin: '0 0 6px',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}>
                <span style={{display:'flex',alignItems:'center',gap:5}}><SparkleIcon size={11} color="rgba(200,123,82,0.70)" />Point fort</span>
              </p>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 12,
                color: 'rgba(255,238,220,0.92)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                {rapport.point_fort}
              </p>
            </div>
          )}

          {/* Point progrès */}
          {rapport.point_progres && (
            <div style={{
              background: 'rgba(200, 123, 82, 0.09)',
              borderRadius: 16,
              padding: '14px 14px',
              border: '1px solid rgba(200, 123, 82, 0.18)',
            }}>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: 11,
                color: '#C87B52',
                margin: '0 0 6px',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}>
                <span style={{display:'flex',alignItems:'center',gap:5}}><LightbulbIcon size={11} color="rgba(200,123,82,0.70)" />À améliorer</span>
              </p>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 12,
                color: 'rgba(255,238,220,0.92)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                {rapport.point_progres}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Focus semaine prochaine */}
      {rapport.focus_prochain && (
        <div style={{
          background: 'rgba(200,123,82,0.15)',
          borderRadius: 16,
          padding: '16px 18px',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,220,160,0.28)',
        }}>
          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 12,
            color: '#E8962A',
            margin: '0 0 6px',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}>
            La semaine prochaine
          </p>
          <p style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 13,
            color: 'rgba(255,238,220,0.92)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {rapport.focus_prochain}
          </p>
        </div>
      )}

      {/* Message Solenn */}
      {rapport.message_solenn && (
        <div style={{
          borderLeft: '3px solid #C87B52',
          paddingLeft: 16,
          marginLeft: 4,
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 16,
            color: 'rgba(255,238,220,0.92)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {rapport.message_solenn}
          </p>
        </div>
      )}

      {/* Erreur éventuelle */}
      {error && (
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 12,
          color: '#ef4444',
          margin: 0,
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}

      {/* Bouton Regénérer */}
      <div style={{ textAlign: 'center', paddingTop: 4 }}>
        <button
          onClick={handleGenerer}
          disabled={generating}
          style={{
            background: 'transparent',
            color: 'rgba(255,238,220,0.60)',
            border: '1px solid rgba(200,123,82,0.22)',
            borderRadius: 12,
            padding: '8px 18px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            fontSize: 12,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {generating ? 'Génération…' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 2.6-6.4"/><polyline points="3 2 3 8 9 8"/>
              </svg>
              Regénérer
            </span>
          )}
        </button>
      </div>
    </motion.div>
  )
}
