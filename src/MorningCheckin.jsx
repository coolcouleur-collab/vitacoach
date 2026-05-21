/**
 * MORNING CHECK-IN EXPRESS
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal qui apparaît chaque matin (6h–11h) si pas encore fait aujourd'hui.
 * 3 questions rapides → 20 secondes → Solenn génère le focus du jour.
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

const HUMEURS = [
  { val: 1, emoji: '😶', label: 'Vide' },
  { val: 2, emoji: '😕', label: 'Difficile' },
  { val: 3, emoji: '😐', label: 'Neutre' },
  { val: 4, emoji: '🙂', label: 'Bien' },
  { val: 5, emoji: '😄', label: 'Super' },
]

export default function MorningCheckin({ profil, onDone, onSkip }) {
  const [step, setStep]           = useState(0)   // 0=sommeil, 1=humeur, 2=intention, 3=done
  const [sommeil, setSommeil]     = useState(7)
  const [humeur, setHumeur]       = useState(null)
  const [intention, setIntention] = useState('')

  const nom = profil?.nom || 'toi'

  const hr = new Date().getHours()
  const greet = hr < 9 ? 'Bonjour' : 'Salut'

  function handleSommeil() {
    if (step === 0) setStep(1)
  }

  function handleHumeur(val) {
    setHumeur(val)
    setTimeout(() => setStep(2), 280)
  }

  function handleSubmit() {
    onDone({ sommeil, humeur, intention: intention.trim() })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: 'rgba(15,5,0,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 32px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onSkip() }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(160deg, #FFF8F4 0%, #FFF2E8 100%)',
          borderRadius: '28px 28px 20px 20px',
          padding: '28px 24px 24px',
          boxShadow: '0 -4px 40px rgba(200,123,82,0.12), 0 24px 60px rgba(0,0,0,0.30)',
          border: '1px solid rgba(200,123,82,0.12)',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a0a00', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>
              {greet} {nom} ☀️
            </div>
            <div style={{ fontSize: 12, color: 'rgba(200,123,82,0.65)', marginTop: 2, fontFamily: 'Poppins, sans-serif' }}>
              Check-in express · 20 secondes
            </div>
          </div>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: 0.35, padding: 4 }}>
            ✕
          </button>
        </div>

        {/* ── Progress dots ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i <= step ? 24 : 6, height: 6, borderRadius: 12,
              background: i <= step ? 'rgba(200,123,82,0.85)' : 'rgba(200,123,82,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Étape 0 : Sommeil ── */}
          {step === 0 && (
            <motion.div key="sommeil"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a0a00', marginBottom: 20, fontFamily: 'Poppins, sans-serif' }}>
                😴 Combien d'heures tu as dormi ?
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: 'rgba(200,123,82,0.90)', fontFamily: 'Poppins, sans-serif', minWidth: 60 }}>
                  {sommeil}h
                </span>
                <input
                  type="range" min={2} max={12} step={0.5} value={sommeil}
                  onChange={e => setSommeil(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: '#C87B52', height: 4, cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(200,123,82,0.40)', marginBottom: 24, fontFamily: 'Poppins, sans-serif' }}>
                <span>2h</span><span>Objectif 8h</span><span>12h</span>
              </div>

              <button onClick={handleSommeil} style={btnStyle}>
                Suivant →
              </button>
            </motion.div>
          )}

          {/* ── Étape 1 : Humeur ── */}
          {step === 1 && (
            <motion.div key="humeur"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a0a00', marginBottom: 22, fontFamily: 'Poppins, sans-serif' }}>
                😊 Ton humeur ce matin ?
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                {HUMEURS.map(h => (
                  <button key={h.val} onClick={() => handleHumeur(h.val)} style={{
                    flex: 1, padding: '12px 4px', borderRadius: 12,
                    background: humeur === h.val ? 'rgba(200,123,82,0.15)' : 'rgba(200,123,82,0.06)',
                    border: humeur === h.val ? '1.5px solid rgba(200,123,82,0.50)' : '1.5px solid transparent',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 24 }}>{h.emoji}</span>
                    <span style={{ fontSize: 9, color: 'rgba(100,50,10,0.55)', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
                      {h.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Étape 2 : Intention ── */}
          {step === 2 && (
            <motion.div key="intention"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a0a00', marginBottom: 16, fontFamily: 'Poppins, sans-serif' }}>
                🎯 Une intention pour aujourd'hui ?
                <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(200,123,82,0.55)', marginLeft: 8 }}>
                  (optionnel)
                </span>
              </div>

              <input
                type="text"
                placeholder="Ex : boire 8 verres, marcher 30 min..."
                value={intention}
                onChange={e => setIntention(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '13px 16px', borderRadius: 12,
                  border: '1.5px solid rgba(200,123,82,0.20)',
                  background: 'rgba(200,123,82,0.05)',
                  fontSize: 13, fontFamily: 'Poppins, sans-serif',
                  color: '#1a0a00', outline: 'none', marginBottom: 20,
                }}
              />

              <button onClick={handleSubmit} style={{ ...btnStyle, background: 'linear-gradient(135deg, #C87B52, #E8962A)' }}>
                ✨ Lancer ma journée
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

const btnStyle = {
  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
  background: 'rgba(200,123,82,0.12)',
  color: 'rgba(200,123,82,0.90)', fontSize: 14, fontWeight: 600,
  fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
  letterSpacing: '-0.2px',
}
