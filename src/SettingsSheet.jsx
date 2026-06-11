import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── COULEURS & TOKENS ────────────────────────────────────────────────────────
const C = {
  bg: 'rgba(255,248,244,0.28)',
  bgCard: 'rgba(255,240,228,0.22)',
  bgCardHover: 'rgba(255,232,212,0.38)',
  border: 'rgba(200,123,82,0.18)',
  borderStrong: 'rgba(200,123,82,0.35)',
  accent: '#C87B52',
  accentLight: 'rgba(200,123,82,0.12)',
  accentMid: 'rgba(200,123,82,0.22)',
  text: '#0A1633',
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
      borderRadius: 8,
      margin: '14px auto 8px',
      flexShrink: 0,
    }} />
  )
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: C.font,
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: C.accent,
      marginBottom: 10,
      marginTop: 4,
    }}>
      {children}
    </div>
  )
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '14px 16px',
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── OBJECTIF BADGE ──────────────────────────────────────────────────────────
function ObjectifBadge({ label }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: C.accentLight,
      border: `1px solid ${C.borderStrong}`,
      borderRadius: 20,
      padding: '3px 10px',
      fontFamily: C.font,
      fontSize: 11,
      fontWeight: 600,
      color: C.accent,
      marginRight: 5,
      marginBottom: 5,
    }}>
      {label}
    </span>
  )
}

// ─── AVATAR ORBITE (identique au menu hamburger App.jsx) ─────────────────────
function Avatar({ nom, size = 52 }) {
  const initial = (nom || '?')[0].toUpperCase()
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Anneau tournant */}
      <motion.svg
        width={size} height={size}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <linearGradient id="settingsOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(200,123,82,0.0)"/>
            <stop offset="30%"  stopColor="rgba(200,123,82,0.25)"/>
            <stop offset="55%"  stopColor="rgba(232,150,42,0.55)"/>
            <stop offset="80%"  stopColor="rgba(200,123,82,0.18)"/>
            <stop offset="100%" stopColor="rgba(200,123,82,0.0)"/>
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={size / 2 - 1.5}
          fill="none"
          stroke="url(#settingsOrbitGrad)"
          strokeWidth="1.8"
        />
      </motion.svg>
      {/* Fond + initiale */}
      <div style={{
        position: 'absolute', inset: 2,
        borderRadius: '50%',
        background: 'rgba(200,123,82,0.10)',
        border: '1px solid rgba(200,123,82,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: size * 0.40,
          fontWeight: 600,
          color: 'rgba(200,123,82,0.90)',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {initial}
        </span>
      </div>
    </div>
  )
}

// ─── ROW INFO ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 8,
      marginBottom: 8,
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontFamily: C.font, fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontFamily: C.font, fontSize: 13, color: C.text, fontWeight: 600 }}>
        {value || '—'}
      </span>
    </div>
  )
}

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 48, height: 28,
        borderRadius: 12,
        background: enabled
          ? `linear-gradient(135deg, ${C.accent} 0%, #E8962A 100%)`
          : 'rgba(26,10,0,0.14)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.28s ease',
        flexShrink: 0,
        boxShadow: enabled ? `0 2px 8px rgba(200,123,82,0.38)` : 'none',
      }}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'absolute',
          top: 3, left: 0,
          width: 22, height: 22,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
        }}
      />
    </div>
  )
}

// ─── PRESET BUTTON ───────────────────────────────────────────────────────────
function PresetBtn({ emoji, label, value, active, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 4px',
        borderRadius: 12,
        border: active
          ? `1.5px solid ${C.accent}`
          : `1px solid ${C.border}`,
        background: active ? C.accentLight : 'rgba(255,248,244,0.60)',
        cursor: 'pointer',
        transition: 'all 0.20s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
      <span style={{
        fontFamily: C.font,
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        color: active ? C.accent : C.textMuted,
        letterSpacing: '0.01em',
      }}>
        {label}
      </span>
    </button>
  )
}

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────
function ActionBtn({ emoji, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 12,
        border: danger
          ? '1px solid rgba(220,60,30,0.22)'
          : `1px solid ${C.border}`,
        background: danger
          ? 'rgba(220,60,30,0.06)'
          : C.bgCard,
        cursor: 'pointer',
        transition: 'background 0.18s ease, transform 0.12s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        marginBottom: 8,
        textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(220,60,30,0.10)' : C.bgCardHover }}
      onMouseLeave={e => { e.currentTarget.style.background = danger ? 'rgba(220,60,30,0.06)' : C.bgCard }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
      <span style={{
        fontFamily: C.font,
        fontSize: 13,
        fontWeight: 600,
        color: danger ? 'rgba(200,50,20,0.85)' : C.text,
      }}>
        {label}
      </span>
    </button>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function SettingsSheet({
  profil = {},
  preset = 'day',
  notifsEnabled = false,
  isPro = false,
  onPasserPro,
  msgsRestants = null,
  onClose,
  onEditProfil,
  onPresetChange,
  onToggleNotifs,
  onResetMemoire,
  onExportData,
}) {
  const [confirmReset, setConfirmReset] = useState(false)

  // Heure format HH:MM depuis nombre décimal ou string
  const fmtHeure = (h) => {
    if (!h && h !== 0) return '—'
    if (typeof h === 'string' && h.includes(':')) return h
    const heures = Math.floor(h)
    const mins = Math.round((h - heures) * 60)
    return `${String(heures).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

  const objectifs = Array.isArray(profil.objectifs)
    ? profil.objectifs
    : profil.objectif
      ? [profil.objectif]
      : []

  const handleResetClick = () => {
    if (confirmReset) {
      setConfirmReset(false)
      onResetMemoire && onResetMemoire()
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
    }
  }

  const PRESETS = [
    { emoji: '☀️', label: 'Jour', value: 'day' },
    { emoji: '🌅', label: 'Lever', value: 'sunrise' },
    { emoji: '🌇', label: 'Coucher', value: 'sunset' },
    { emoji: '🌙', label: 'Nuit', value: 'night' },
  ]

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          background: 'rgba(26,10,0,0.32)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Sheet */}
      <motion.div
        key="settings-sheet"
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
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '28px 28px 0 0',
          boxShadow: C.shadow,
          border: `1px solid ${C.border}`,
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92dvh',
          overflow: 'hidden',
        }}>
          {/* Header fixe */}
          <div style={{ flexShrink: 0, paddingBottom: 4 }}>
            <HandleBar />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 20px 12px',
            }}>
              <span style={{
                fontFamily: C.font,
                fontWeight: 700,
                fontSize: 18,
                color: C.text,
                letterSpacing: '-0.01em',
              }}>
                Paramètres
              </span>
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

            {/* ── 1. MON PROFIL ───────────────────────────────────────── */}
            <SectionTitle>Mon Profil</SectionTitle>
            <Card>
              {/* Avatar + nom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <Avatar nom={profil.nom || profil.prenom} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: C.font,
                    fontWeight: 700,
                    fontSize: 16,
                    color: C.text,
                    lineHeight: 1.25,
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {[profil.prenom, profil.nom].filter(Boolean).join(' ') || profil.nom || '—'}
                  </div>
                  {profil.age && (
                    <div style={{ fontFamily: C.font, fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
                      {profil.age} ans
                    </div>
                  )}
                </div>
                <button
                  onClick={onEditProfil}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: `1.5px solid ${C.accent}`,
                    background: C.accentLight,
                    fontFamily: C.font,
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.accent,
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.15s',
                    flexShrink: 0,
                  }}
                >
                  Modifier
                </button>
              </div>

              {/* Objectifs */}
              {objectifs.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: C.font, fontSize: 11, color: C.textMuted, fontWeight: 500, marginBottom: 6 }}>
                    Objectifs
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {objectifs.map((obj, i) => (
                      <ObjectifBadge key={i} label={obj} />
                    ))}
                  </div>
                </div>
              )}

              {/* Horaires */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                <InfoRow
                  label="🌅 Heure de réveil"
                  value={fmtHeure(profil.heureReveil ?? profil.heure_reveil)}
                />
                <div style={{ paddingBottom: 0, marginBottom: 0, borderBottom: 'none' }}>
                  <InfoRow
                    label="🌙 Heure de coucher"
                    value={fmtHeure(profil.heureCoucher ?? profil.heure_coucher)}
                  />
                </div>
              </div>
            </Card>

            {/* ── 2. MON ABONNEMENT ────────────────────────────────── */}
            <SectionTitle>Mon Abonnement</SectionTitle>
            {isPro ? (
              /* Card Pro */
              <Card style={{
                background: 'linear-gradient(135deg, rgba(232,150,42,0.08) 0%, rgba(200,123,82,0.08) 100%)',
                border: '1px solid rgba(232,150,42,0.28)',
              }}>
                {/* Badge Pro */}
                <div style={{ marginBottom: 14 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(232,150,42,0.12)',
                    border: '1px solid rgba(232,150,42,0.30)',
                    borderRadius: 20,
                    padding: '5px 12px',
                    fontFamily: C.font,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#E8962A',
                  }}>
                    ✨ Solenn Pro
                  </span>
                </div>
                {/* Avantages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {['Messages illimités', 'Rapport hebdo personnalisé', 'Challenges 21 jours · Agents nutrition'].map((txt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 18, height: 18,
                        borderRadius: '50%',
                        background: 'rgba(60,180,80,0.14)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, flexShrink: 0,
                      }}>
                        ✓
                      </span>
                      <span style={{ fontFamily: C.font, fontSize: 13, fontWeight: 500, color: C.text }}>
                        {txt}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div style={{
                  fontFamily: C.font,
                  fontSize: 12,
                  color: C.textMuted,
                  fontWeight: 500,
                  borderTop: `1px solid rgba(232,150,42,0.18)`,
                  paddingTop: 10,
                }}>
                  Merci de faire partie de l'aventure 💛
                </div>
              </Card>
            ) : (
              /* Card upgrade */
              <Card>
                {/* En-tête */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: C.font, fontSize: 14, fontWeight: 700, color: C.text }}>
                    Plan Gratuit
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(200,123,82,0.12)',
                    border: `1px solid rgba(200,123,82,0.30)`,
                    borderRadius: 20,
                    padding: '3px 10px',
                    fontFamily: C.font,
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.accent,
                  }}>
                    5 msg/jour
                  </span>
                </div>
                {/* Barre de progression */}
                {msgsRestants !== null && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{
                      height: 6,
                      borderRadius: 8,
                      background: 'rgba(200,123,82,0.14)',
                      overflow: 'hidden',
                      marginBottom: 5,
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, (msgsRestants / 5) * 100))}%`,
                        borderRadius: 8,
                        background: `linear-gradient(90deg, ${C.accent} 0%, #E8962A 100%)`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <div style={{ fontFamily: C.font, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                      {msgsRestants} message{msgsRestants !== 1 ? 's' : ''} restant{msgsRestants !== 1 ? 's' : ''} aujourd'hui
                    </div>
                  </div>
                )}
                {/* Avantages Pro barrés */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                  {['Messages illimités', 'Rapport hebdo', 'Challenges 21 jours'].map((txt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 18, height: 18,
                        borderRadius: '50%',
                        background: 'rgba(26,10,0,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, flexShrink: 0, color: C.textLight,
                      }}>
                        ✓
                      </span>
                      <span style={{
                        fontFamily: C.font,
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.textLight,
                        textDecoration: 'line-through',
                      }}>
                        {txt}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Bouton upgrade */}
                <button
                  onClick={onPasserPro}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 16,
                    border: 'none',
                    background: 'linear-gradient(135deg, #C87B52 0%, #E8962A 100%)',
                    color: '#fff',
                    fontFamily: C.font,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    boxShadow: '0 4px 18px rgba(200,123,82,0.38), 0 1px 4px rgba(200,100,40,0.18)',
                    marginBottom: 8,
                    transition: 'opacity 0.15s ease, transform 0.12s ease',
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  ⭐ Passer à Solenn Pro · 4,99€/mois
                </button>
                {/* Sous-texte */}
                <div style={{
                  fontFamily: C.font,
                  fontSize: 11,
                  color: C.textMuted,
                  fontWeight: 500,
                  textAlign: 'center',
                }}>
                  Résiliable à tout moment
                </div>
              </Card>
            )}

            {/* ── 3. APPARENCE ────────────────────────────────────────── */}
            <SectionTitle>Apparence</SectionTitle>
            <Card>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRESETS.map(p => (
                  <PresetBtn
                    key={p.value}
                    emoji={p.emoji}
                    label={p.label}
                    value={p.value}
                    active={preset === p.value}
                    onClick={onPresetChange}
                  />
                ))}
              </div>
            </Card>

            {/* ── 3. NOTIFICATIONS ────────────────────────────────────── */}
            <SectionTitle>Notifications</SectionTitle>
            <Card>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: C.font, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    Rappels Solenn
                  </div>
                  <div style={{ fontFamily: C.font, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                    {notifsEnabled ? 'Activées — tu recevras des rappels' : 'Désactivées'}
                  </div>
                </div>
                <ToggleSwitch enabled={notifsEnabled} onToggle={onToggleNotifs} />
              </div>
            </Card>

            {/* ── 4. MES DONNÉES ──────────────────────────────────────── */}
            <SectionTitle>Mes Données</SectionTitle>
            <div>
              <ActionBtn
                emoji="🔄"
                label={confirmReset ? 'Confirmer la réinitialisation ?' : 'Réinitialiser mémoire IA'}
                onClick={handleResetClick}
                danger={confirmReset}
              />
              <ActionBtn
                emoji="📤"
                label="Exporter mes données"
                onClick={onExportData}
              />
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
