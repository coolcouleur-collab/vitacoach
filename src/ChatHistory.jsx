import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── COULEURS & TOKENS ────────────────────────────────────────────────────────
const C = {
  bg: '#FFF8F4',
  bgCard: 'rgba(255,240,228,0.72)',
  bgCardHover: 'rgba(255,228,206,0.95)',
  border: 'rgba(200,123,82,0.18)',
  borderStrong: 'rgba(200,123,82,0.30)',
  accent: '#C87B52',
  accentLight: 'rgba(200,123,82,0.10)',
  text: '#1a0a00',
  textMuted: 'rgba(26,10,0,0.52)',
  textLight: 'rgba(26,10,0,0.36)',
  handle: 'rgba(200,123,82,0.28)',
  shadow: '0 -20px 60px rgba(200,100,40,0.10), 0 -4px 20px rgba(200,100,40,0.06)',
  font: "'Poppins', system-ui, sans-serif",
}

// ─── HANDLE BAR ───────────────────────────────────────────────────────────────
function HandleBar() {
  return (
    <div style={{
      width: 44, height: 5,
      background: C.handle,
      borderRadius: 3,
      margin: '14px auto 8px',
      flexShrink: 0,
    }} />
  )
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 28, height: 28,
        borderRadius: '50%',
        border: `3px solid ${C.border}`,
        borderTopColor: C.accent,
        flexShrink: 0,
      }}
    />
  )
}

// ─── FORMATAGE DATE FRANÇAIS ──────────────────────────────────────────────────
function fmtDateFr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function fmtDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── GROUPEMENT PAR SEMAINE ───────────────────────────────────────────────────
function groupByWeek(sessions) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThisWeek = new Date(startOfToday)
  startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

  const groups = {
    'Cette semaine': [],
    'Semaine dernière': [],
    'Plus ancien': [],
  }

  for (const s of sessions) {
    const d = new Date(s.session_date || s.created_at)
    if (d >= startOfThisWeek) {
      groups['Cette semaine'].push(s)
    } else if (d >= startOfLastWeek) {
      groups['Semaine dernière'].push(s)
    } else {
      groups['Plus ancien'].push(s)
    }
  }

  return groups
}

// ─── APERÇU MESSAGE ───────────────────────────────────────────────────────────
function getPreview(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Session vide'
  const first = messages.find(m => m.role === 'user' || m.sender === 'user')
  if (!first) return 'Session vide'
  const text = first.content || first.text || ''
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 12).join(' ') + (words.length > 12 ? '…' : '')
}

function countMessages(messages) {
  if (!Array.isArray(messages)) return 0
  return messages.length
}

// ─── SESSION ITEM ─────────────────────────────────────────────────────────────
function SessionItem({ session, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const preview = getPreview(session.messages)
  const count = countMessages(session.messages)
  const dateLabel = fmtDateFr(session.session_date || session.created_at)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      onClick={() => onSelect(session.messages)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        padding: '13px 15px',
        borderRadius: 14,
        border: `1px solid ${hovered ? C.borderStrong : C.border}`,
        background: hovered ? C.bgCardHover : C.bgCard,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        marginBottom: 8,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Date */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <span style={{
          fontFamily: C.font,
          fontSize: 12,
          fontWeight: 700,
          color: C.accent,
          textTransform: 'capitalize',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {dateLabel}
        </span>
        <span style={{
          fontFamily: C.font,
          fontSize: 10,
          fontWeight: 600,
          color: C.textLight,
          background: 'rgba(200,123,82,0.08)',
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '2px 8px',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {count} msg{count > 1 ? 's' : ''}
        </span>
      </div>

      {/* Aperçu */}
      <div style={{
        fontFamily: C.font,
        fontSize: 12,
        color: C.textMuted,
        fontWeight: 400,
        lineHeight: 1.55,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {preview}
      </div>

      {/* Indicateur chargement */}
      {hovered && (
        <div style={{
          fontFamily: C.font,
          fontSize: 10,
          color: C.accent,
          fontWeight: 600,
          letterSpacing: '0.04em',
          marginTop: 1,
        }}>
          Charger cette session →
        </div>
      )}
    </motion.div>
  )
}

// ─── SECTION GROUPE ───────────────────────────────────────────────────────────
function GroupSection({ title, sessions, onSelect }) {
  if (!sessions || sessions.length === 0) return null
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontFamily: C.font,
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: C.accent,
        marginBottom: 8,
        marginTop: 8,
        paddingLeft: 2,
      }}>
        {title}
      </div>
      {sessions.map((s, i) => (
        <SessionItem
          key={s.id || s.session_date || i}
          session={s}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ChatHistory({
  userId,
  supabase,
  onClose,
  onLoadSession,
}) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('solenn_chats')
          .select('session_date, messages, created_at')
          .eq('user_id', userId)
          .order('session_date', { ascending: false })
          .limit(30)

        if (cancelled) return
        if (err) throw err
        setSessions(data || [])
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId, supabase])

  const groups = groupByWeek(sessions)
  const totalSessions = sessions.length

  const handleSelect = (messages) => {
    onLoadSession && onLoadSession(messages)
    onClose && onClose()
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="chathistory-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          background: 'rgba(26,10,0,0.28)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Panel */}
      <motion.div
        key="chathistory-panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 1 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1201,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: 520,
          background: C.bg,
          borderRadius: '28px 28px 0 0',
          boxShadow: C.shadow,
          border: `1px solid ${C.border}`,
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88dvh',
          overflow: 'hidden',
        }}>
          {/* Header fixe */}
          <div style={{ flexShrink: 0 }}>
            <HandleBar />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 20px 12px',
            }}>
              <div>
                <div style={{
                  fontFamily: C.font,
                  fontWeight: 700,
                  fontSize: 18,
                  color: C.text,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25,
                }}>
                  Historique
                </div>
                {!loading && totalSessions > 0 && (
                  <div style={{
                    fontFamily: C.font,
                    fontSize: 11,
                    color: C.textMuted,
                    fontWeight: 500,
                    marginTop: 1,
                  }}>
                    {totalSessions} session{totalSessions > 1 ? 's' : ''} enregistrée{totalSessions > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: C.accentLight,
                  border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  fontFamily: C.font,
                  fontSize: 15,
                  color: C.textMuted,
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div style={{
            overflowY: 'auto',
            flex: 1,
            padding: '4px 18px 48px',
            WebkitOverflowScrolling: 'touch',
          }}>

            {/* Loading */}
            {loading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                paddingTop: 48,
                paddingBottom: 24,
              }}>
                <Spinner />
                <div style={{
                  fontFamily: C.font,
                  fontSize: 13,
                  color: C.textMuted,
                  fontWeight: 500,
                }}>
                  Chargement de l'historique…
                </div>
              </div>
            )}

            {/* Erreur */}
            {!loading && error && (
              <div style={{
                margin: '24px 0',
                padding: '16px',
                borderRadius: 14,
                background: 'rgba(220,60,30,0.06)',
                border: '1px solid rgba(220,60,30,0.18)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
                <div style={{
                  fontFamily: C.font,
                  fontSize: 13,
                  color: 'rgba(180,40,20,0.80)',
                  fontWeight: 500,
                }}>
                  {error}
                </div>
              </div>
            )}

            {/* Vide */}
            {!loading && !error && totalSessions === 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                paddingTop: 52,
                paddingBottom: 24,
              }}>
                <div style={{ fontSize: 40 }}>💬</div>
                <div style={{
                  fontFamily: C.font,
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.text,
                  textAlign: 'center',
                }}>
                  Aucune conversation
                </div>
                <div style={{
                  fontFamily: C.font,
                  fontSize: 12,
                  color: C.textMuted,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  maxWidth: 260,
                }}>
                  Tes sessions avec Solenn apparaîtront ici une fois que tu auras commencé à chatter.
                </div>
              </div>
            )}

            {/* Liste groupée */}
            {!loading && !error && totalSessions > 0 && (
              <div>
                {Object.entries(groups).map(([groupName, groupSessions]) => (
                  <GroupSection
                    key={groupName}
                    title={groupName}
                    sessions={groupSessions}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
