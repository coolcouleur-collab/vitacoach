import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StarIcon, SparkleIcon, LightbulbIcon, CalendarIcon } from './Icons'
import { authHeaders } from './supabase'

const API = import.meta.env.VITE_API_URL || ''

export default function RapportHebdo({ userId, isPro, onPasserPro }) {
  const [rapport, setRapport] = useState(null)
  const [semaine, setSemaine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  // Section dépliée du bilan (une seule à la fois), le bilan était un mur
  // d'infos affiché d'un coup, retour Jean 2026-07-27
  const [openSection, setOpenSection] = useState(null)

  const fetchRapport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/rapport-hebdo?userId=${userId}`, { headers: await authHeaders() })
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
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
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
    if (score > 70) return '#1f9d55'
    if (score > 50) return '#E8962A'
    // En dessous de 20 on est presque toujours face à une semaine sans données
    // saisies, pas à un échec : un gros 0 rouge accueille l'utilisateur par une
    // sanction dès sa première semaine (retour Jean 2026-08-08).
    if (score > 20) return '#ef4444'
    return 'rgba(200,123,82,0.55)'
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
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,220,160,0.28)',
          borderRadius: 20,
          padding: '28px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CalendarIcon size={32} color="#9C5B33" />
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#7B421C',
          margin: 0,
        }}>
          Rapport hebdomadaire
        </p>
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 13,
          color: '#7B421C',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Analyse complète de ta semaine · score · victoires · focus
        </p>
        <button
          onClick={onPasserPro}
          style={{
            // Verre de cuivre profond, CTA unifié Solenn (2026-07-24)
            marginTop: 8,
            background: 'rgba(255,235,210,0.32)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#FFF6E8',
            border: '1px solid rgba(255,235,210,0.45)',
            borderRadius: 16,
            padding: '12px 24px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            letterSpacing: 0.2,
          }}
        >
          <span style={{display:'flex',alignItems:'center',gap:6}}><StarIcon size={13} color="white" />Disponible avec Pro · 44,99€/an</span>
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
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,220,160,0.28)',
          borderRadius: 20,
          padding: '28px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CalendarIcon size={32} color="#9C5B33" />
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#7B421C',
          margin: 0,
        }}>
          Ton bilan de la semaine
        </p>
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 13,
          color: '#7B421C',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Chaque dimanche soir, Solenn résume ta semaine : ton score, tes victoires, et UN focus pour la suivante.
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
            color: '#7B421C',
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
          {generating ? 'Solenn analyse ta semaine…' : 'Voir mon bilan dès maintenant'}
        </button>
      </motion.div>
    )
  }

  // ─── État 4 : Rapport complet, compact, sections dépliables ──────────────
  const scoreColor = getScoreColor(rapport.score_global)

  const sections = [
    { key: 'semaine',  label: 'Cette semaine',       texte: rapport.analyse,       icon: <CalendarIcon size={15} color="#9C5B33" /> },
    { key: 'fort',     label: 'Ton point fort',      texte: rapport.point_fort,    icon: <SparkleIcon size={15} color="#9C5B33" /> },
    { key: 'mieux',    label: 'À améliorer',         texte: rapport.point_progres, icon: <LightbulbIcon size={15} color="#9C5D08" /> },
    { key: 'focus',    label: 'La semaine prochaine', texte: rapport.focus_prochain, icon: <StarIcon size={15} color="#9C5D08" /> },
  ].filter(s => s.texte)

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
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,220,160,0.28)',
        borderRadius: 20,
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ flexShrink: 0, display: 'flex' }}><CalendarIcon size={32} color="#9C5D08" /></span>
            <div>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                color: '#7B421C',
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
                  color: '#7B421C',
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
              color: '#7B421C',
              margin: '2px 0 0',
              textAlign: 'right',
            }}>
              /100
            </p>
          </div>
        </div>
      </div>

      {/* Une seule phrase mise en avant : la victoire (ou la stat phare) */}
      {(rapport.victoire_semaine || rapport.stat_phare) && (
        <div style={{
          background: 'rgba(255,235,210,0.35)',
          borderRadius: 16,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          border: '1px solid rgba(255,220,160,0.45)',
        }}>
          <span style={{ fontSize: 15, color: '#1f9d55', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 13,
            color: '#7B421C',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {rapport.victoire_semaine
              || (typeof rapport.stat_phare === 'object'
                ? [rapport.stat_phare.valeur, rapport.stat_phare.label].filter(Boolean).join(', ')
                : rapport.stat_phare)}
          </p>
        </div>
      )}

      {/* Sections dépliables, un titre par ligne, tape pour lire le détail */}
      {sections.map(s => {
        const ouvert = openSection === s.key
        return (
          <div key={s.key} style={{
            background: ouvert ? 'rgba(200,123,82,0.10)' : 'rgba(255,235,210,0.22)',
            border: '1px solid rgba(255,220,160,0.28)',
            borderRadius: 16,
            overflow: 'hidden',
            transition: 'background 0.2s',
          }}>
            <button
              onClick={() => setOpenSection(ouvert ? null : s.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '13px 16px', textAlign: 'left',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0 }}>{s.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#7B421C' }}>
                {s.label}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(200,123,82,0.55)"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <AnimatePresence initial={false}>
              {ouvert && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 13,
                    color: '#7B421C',
                    margin: 0,
                    padding: '0 16px 14px',
                    lineHeight: 1.6,
                  }}>
                    {s.texte}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

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
            background: 'rgba(255,235,210,0.32)',
            color: '#7B421C',
            border: '1px solid rgba(255,220,160,0.60)',
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
              Mettre à jour avec mes dernières données
            </span>
          )}
        </button>
      </div>
    </motion.div>
  )
}
