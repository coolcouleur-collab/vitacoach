import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SunIcon, MoonIcon, RefreshIcon, SparkleIcon, StarIcon } from './Icons'

// ─── COULEURS & TOKENS ────────────────────────────────────────────────────────
const C = {
  bg: 'rgba(22,9,2,0.82)',
  bgCard: 'rgba(255,235,210,0.09)',
  bgCardHover: 'rgba(255,232,212,0.15)',
  border: 'rgba(255,220,160,0.16)',
  borderStrong: 'rgba(200,123,82,0.38)',
  accent: '#C87B52',
  accentLight: 'rgba(200,123,82,0.16)',
  accentMid: 'rgba(200,123,82,0.28)',
  text: 'rgba(255,238,220,0.92)',
  textMuted: 'rgba(255,220,180,0.52)',
  textLight: 'rgba(255,210,160,0.35)',
  handle: 'rgba(255,220,160,0.28)',
  shadow: '0 -24px 64px rgba(0,0,0,0.50), 0 -4px 20px rgba(200,100,40,0.14)',
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
          : 'rgba(255,255,255,0.12)',
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
function PresetBtn({ icon, label, value, active, onClick }) {
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
        background: active ? C.accentLight : 'rgba(255,235,210,0.08)',
        cursor: 'pointer',
        transition: 'all 0.20s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ display:'flex', lineHeight: 1 }}>{icon}</span>
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
function ActionBtn({ icon, label, onClick, danger }) {
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
      <span style={{ display:'flex', lineHeight: 1 }}>{icon}</span>
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

// ─── EDIT PROFILE OPTIONS ────────────────────────────────────────────────────
const OBJECTIF_OPTS = [
  'Retrouver mon énergie',
  'Me réconcilier avec mon corps',
  'Dormir enfin comme il faut',
  'Retrouver ma sérénité',
  'Reprendre le mouvement',
  'Manger sans culpabiliser',
]
const ACTIVITE_OPTS = [
  'Pas vraiment mon truc',
  "J'essaie de bouger",
  'Je fais du sport',
  "Le sport, c'est ma vie",
]
const RYTHME_OPTS = [
  'Bureau ou télétravail',
  'Souvent en déplacement',
  'Horaires décalés',
  'À mon compte',
]

function PillPicker({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
      {options.map(opt => {
        const active = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '7px 13px', borderRadius: 20,
              border: active ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
              background: active ? C.accentLight : 'transparent',
              color: active ? C.accent : C.textMuted,
              fontFamily: C.font, fontSize: 12, fontWeight: active ? 700 : 500,
              cursor: 'pointer', outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.18s ease',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function EditField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: C.font, fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      {children}
    </div>
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
  trialDaysLeft = null,
  onClose,
  onSaveProfil,
  onPresetChange,
  onToggleNotifs,
  onResetMemoire,
  onExportData,
}) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editValues, setEditValues] = useState(() => ({
    nom: profil.nom || '',
    objectif: profil.objectif || profil.objectifs?.[0] || '',
    activite: profil.activite || '',
    rythme: profil.rythme || '',
    heure_lever: profil.heure_lever ?? profil.heureReveil ?? 7.5,
    heure_coucher: profil.heure_coucher ?? profil.heureCoucher ?? 23.5,
  }))

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Heure format HH:MM depuis nombre décimal ou string
  const fmtHeure = (h) => {
    if (!h && h !== 0) return '—'
    if (typeof h === 'string' && h.includes(':')) return h
    const heures = Math.floor(h)
    const mins = Math.round((h - heures) * 60)
    return `${String(heures).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

  // HH:MM → decimal
  const parseHeure = (str) => {
    if (!str) return null
    const [h, m] = str.split(':').map(Number)
    return h + (m || 0) / 60
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

  function handleSaveProfil() {
    const updated = {
      ...profil,
      nom: editValues.nom.trim() || profil.nom,
      objectif: editValues.objectif,
      objectifs: editValues.objectif ? [editValues.objectif] : (profil.objectifs || []),
      activite: editValues.activite,
      rythme: editValues.rythme,
      heure_lever: editValues.heure_lever,
      heure_coucher: editValues.heure_coucher,
      heureReveil: editValues.heure_lever,
      heureCoucher: editValues.heure_coucher,
    }
    onSaveProfil && onSaveProfil(updated)
    setEditMode(false)
  }

  const PRESETS = [
    { icon: <SunIcon size={20} color="#E8962A" />,  label: 'Jour',    value: 'day' },
    { icon: <SunIcon size={20} color="#C87B52" />,  label: 'Lever',   value: 'sunrise' },
    { icon: <MoonIcon size={20} color="#C87B52" />, label: 'Coucher', value: 'sunset' },
    { icon: <MoonIcon size={20} color="#8B7AB8" />, label: 'Nuit',    value: 'night' },
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
          <div data-lenis-prevent style={{
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            padding: '4px 18px 48px',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 48px)',
            WebkitOverflowScrolling: 'touch',
          }}>

            {/* ── 1. MON PROFIL ───────────────────────────────────────── */}
            <SectionTitle>Mon Profil</SectionTitle>
            <Card>
              {/* Avatar + nom + bouton édition */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: editMode ? 20 : 16 }}>
                <Avatar nom={editMode ? (editValues.nom || profil.nom) : (profil.nom || profil.prenom)} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: C.font, fontWeight: 700, fontSize: 16, color: C.accent, lineHeight: 1.25, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[profil.prenom, profil.nom].filter(Boolean).join(' ') || profil.nom || '—'}
                  </div>
                  {profil.age && (
                    <div style={{ fontFamily: C.font, fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{profil.age}</div>
                  )}
                </div>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${C.accent}`, background: C.accentLight, fontFamily: C.font, fontSize: 12, fontWeight: 700, color: C.accent, cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}
                  >
                    Modifier
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(false)}
                    style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${C.border}`, background: 'transparent', fontFamily: C.font, fontSize: 12, fontWeight: 600, color: C.textMuted, cursor: 'pointer', outline: 'none', flexShrink: 0 }}
                  >
                    Annuler
                  </button>
                )}
              </div>

              {/* Mode lecture */}
              {!editMode && (
                <>
                  {objectifs.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: C.font, fontSize: 11, color: C.textMuted, fontWeight: 500, marginBottom: 6 }}>Objectif</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {objectifs.map((obj, i) => <ObjectifBadge key={i} label={obj} />)}
                      </div>
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                    <InfoRow label="Réveil" value={fmtHeure(profil.heure_lever ?? profil.heureReveil)} />
                    <div style={{ paddingBottom: 0, marginBottom: 0, borderBottom: 'none' }}>
                      <InfoRow label="Coucher" value={fmtHeure(profil.heure_coucher ?? profil.heureCoucher)} />
                    </div>
                  </div>
                </>
              )}

              {/* Mode édition */}
              {editMode && (
                <div>
                  <style>{`
                    .ss-edit-input { width:100%; box-sizing:border-box; padding:10px 14px; border-radius:12px;
                      border:1px solid rgba(255,220,160,0.20); background:rgba(255,235,210,0.10);
                      font-family:'Poppins',system-ui,sans-serif; font-size:16px; color:rgba(255,238,220,0.90); outline:none;
                      transition:border-color 0.18s; }
                    .ss-edit-input:focus { border-color:#C87B52; }
                    .ss-edit-input::placeholder { color:rgba(255,210,160,0.35); }
                    .ss-time-input { padding:8px 12px; border-radius:10px; border:1px solid rgba(255,220,160,0.20);
                      background:rgba(255,235,210,0.10); font-family:'Poppins',system-ui,sans-serif; font-size:16px;
                      color:rgba(255,238,220,0.90); outline:none; }
                    .ss-time-input:focus { border-color:#C87B52; }
                  `}</style>

                  <EditField label="Prénom / Pseudo">
                    <input
                      className="ss-edit-input"
                      value={editValues.nom}
                      onChange={e => setEditValues(v => ({ ...v, nom: e.target.value }))}
                      placeholder="Ton prénom ou pseudo"
                      maxLength={30}
                    />
                  </EditField>

                  <EditField label="Objectif principal">
                    <PillPicker
                      options={OBJECTIF_OPTS}
                      value={editValues.objectif}
                      onChange={val => setEditValues(v => ({ ...v, objectif: val }))}
                    />
                  </EditField>

                  <EditField label="Niveau d'activité">
                    <PillPicker
                      options={ACTIVITE_OPTS}
                      value={editValues.activite}
                      onChange={val => setEditValues(v => ({ ...v, activite: val }))}
                    />
                  </EditField>

                  <EditField label="Rythme de vie">
                    <PillPicker
                      options={RYTHME_OPTS}
                      value={editValues.rythme}
                      onChange={val => setEditValues(v => ({ ...v, rythme: val }))}
                    />
                  </EditField>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <EditField label="Réveil">
                      <input
                        type="time"
                        className="ss-time-input"
                        value={fmtHeure(editValues.heure_lever)}
                        onChange={e => setEditValues(v => ({ ...v, heure_lever: parseHeure(e.target.value) ?? v.heure_lever }))}
                      />
                    </EditField>
                    <EditField label="Coucher">
                      <input
                        type="time"
                        className="ss-time-input"
                        value={fmtHeure(editValues.heure_coucher)}
                        onChange={e => setEditValues(v => ({ ...v, heure_coucher: parseHeure(e.target.value) ?? v.heure_coucher }))}
                      />
                    </EditField>
                  </div>

                  <button
                    onClick={handleSaveProfil}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 16, border: 'none',
                      background: `linear-gradient(135deg, ${C.accent} 0%, #E8962A 100%)`,
                      color: '#fff', fontFamily: C.font, fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', outline: 'none',
                      boxShadow: '0 4px 18px rgba(200,123,82,0.32)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    Sauvegarder les modifications
                  </button>
                </div>
              )}
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
                    <span style={{display:'flex',alignItems:'center',gap:5}}><SparkleIcon size={13} color="#E8962A" /> Solenn Pro</span>
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
                  Merci de faire partie de l'aventure
                </div>
              </Card>
            ) : (
              /* Card upgrade */
              <Card>
                {/* En-tête */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: C.font, fontSize: 14, fontWeight: 700, color: C.text }}>
                    {trialDaysLeft !== null ? 'Essai complet' : 'Plan Gratuit'}
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
                    {trialDaysLeft !== null
                      ? `${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}`
                      : '5 msg/jour'}
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
                        background: 'rgba(255,235,210,0.08)',
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
                    // Verre de cuivre profond — CTA unifié Solenn (2026-07-24)
                    width: '100%',
                    padding: '14px',
                    borderRadius: 16,
                    border: '1px solid rgba(255,235,210,0.45)',
                    background: 'rgba(255,235,210,0.32)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#FFF6E8',
                    fontFamily: C.font,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    boxShadow: '0 8px 24px rgba(158,88,52,0.26), inset 0 1px 0 rgba(255,248,235,0.32)',
                    marginBottom: 8,
                    transition: 'opacity 0.15s ease, transform 0.12s ease',
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <span style={{display:'flex',alignItems:'center',gap:6}}><StarIcon size={14} color="white" /> Passer à Solenn Pro · 44,99€/an</span>
                </button>
                {/* Sous-texte */}
                <div style={{
                  fontFamily: C.font,
                  fontSize: 11,
                  color: C.textMuted,
                  fontWeight: 500,
                  textAlign: 'center',
                }}>
                  Soit 3,75 €/mois · Résiliable à tout moment
                </div>
                <button
                  onClick={() => onPasserPro && onPasserPro('monthly')}
                  style={{
                    width: '100%', marginTop: 6, padding: '6px 0',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: C.font, fontSize: 11.5, fontWeight: 500,
                    color: C.textMuted, textDecoration: 'underline', textUnderlineOffset: 3,
                    outline: 'none', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Ou 7,99 €/mois sans engagement
                </button>
              </Card>
            )}

            {/* ── 3. APPARENCE ────────────────────────────────────────── */}
            <SectionTitle>Apparence</SectionTitle>
            <Card>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRESETS.map(p => (
                  <PresetBtn
                    key={p.value}
                    icon={p.icon}
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

            {/* ── SUIVI DU CYCLE ──────────────────────────────────────── */}
            <SectionTitle>Suivi du cycle</SectionTitle>
            <Card>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: C.font, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    Suivi du cycle menstruel
                  </div>
                  <div style={{ fontFamily: C.font, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                    {profil.cycle ? "Activé — l'onglet Cycle est visible" : 'Désactivé — active-le quand tu veux'}
                  </div>
                </div>
                <ToggleSwitch
                  enabled={!!profil.cycle}
                  onToggle={() => onSaveProfil && onSaveProfil({ ...profil, cycle: !profil.cycle })}
                />
              </div>
            </Card>

            {/* ── 4. MES DONNÉES ──────────────────────────────────────── */}
            <SectionTitle>Mes Données</SectionTitle>
            <div>
              <ActionBtn
                icon={<RefreshIcon size={18} color={confirmReset ? 'rgba(200,50,20,0.85)' : '#C87B52'} />}
                label={confirmReset ? 'Confirmer la réinitialisation ?' : 'Réinitialiser mémoire IA'}
                onClick={handleResetClick}
                danger={confirmReset}
              />
              <ActionBtn
                icon={<SparkleIcon size={18} color="#C87B52" />}
                label="Exporter mes données"
                onClick={onExportData}
              />
            </div>

            {/* ── À PROPOS — transparence IA + disclaimer médical ──────────
                Requis : Google Play (disclaimer non-dispositif médical),
                AI Act art. 50 (divulgation IA), Apple 1.4 (rappel médecin). */}
            <SectionTitle>À propos de Solenn</SectionTitle>
            <Card>
              <div style={{ fontFamily: C.font, fontSize: 12, color: C.textMuted, lineHeight: 1.65 }}>
                Solenn est un coach bien-être basé sur une <strong style={{ color: C.text }}>intelligence artificielle</strong>.
                Ce n'est pas un dispositif médical : Solenn ne diagnostique, ne traite, ne guérit
                ni ne prévient aucune maladie ou condition médicale. Ses conseils ne remplacent
                jamais l'avis d'un professionnel de santé — en cas de symptôme ou de doute,
                consulte un médecin.
              </div>
              <a
                href="/confidentialite"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', marginTop: 10,
                  fontFamily: C.font, fontSize: 12, fontWeight: 600,
                  color: C.accent, textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                Politique de confidentialité
              </a>
            </Card>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
