import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SpiralBg from './SpiralBg'

const KEYFRAMES = `
  @keyframes splashShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
`

// ─── Easing presets ───────────────────────────────────────────────────────────
const EASE_OUT_EXPO  = [0.16, 1, 0.3, 1]
const EASE_OUT_QUART = [0.25, 1, 0.5, 1]
const EASE_SPRING    = [0.34, 1.56, 0.64, 1]

export default function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1200)
    const t2 = setTimeout(() => onDone(),          1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.65, ease: EASE_OUT_QUART }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #FFFAF5 0%, #FFF3E8 55%, #FFFAF5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      <SpiralBg light duration={5000} style={{ zIndex: -1 }} />
      <style>{KEYFRAMES}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Top reveal line ── */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: 0 }}
          style={{
            width: 56, height: 1.5, marginBottom: 30,
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,123,82,0.38) 50%, transparent 100%)',
            transformOrigin: 'center',
          }}
        />

        {/* ── S badge ── */}
        <motion.div
          initial={{ scale: 0.50, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          transition={{ duration: 0.70, ease: EASE_SPRING, delay: 0.06 }}
          style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(200,123,82,0.28), rgba(190,112,30,0.18))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 10px rgba(200,123,82,0.07), 0 0 0 20px rgba(200,123,82,0.04)',
            position: 'relative', overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <span style={{
            fontSize: 44, fontWeight: 900, color: 'rgba(200,123,82,0.90)',
            fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
            letterSpacing: '-2px',
          }}>S</span>
        </motion.div>

        {/* ── Wordmark ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1,  y: 0  }}
          transition={{ duration: 0.52, ease: EASE_OUT_EXPO, delay: 0.22 }}
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 4rem)', fontWeight: 300,
            letterSpacing: '-0.02em', lineHeight: 1,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            background: 'linear-gradient(90deg, #C87B52 0%, #E8962A 28%, #C87B52 50%, #F0B060 72%, #C87B52 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'splashShimmer 2.8s linear infinite',
            marginBottom: 10,
          }}
        >
          Solenn
        </motion.div>

        {/* ── Tagline ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.38 }}
          style={{
            fontSize: 12.5, fontWeight: 400,
            letterSpacing: '0.22em',
            color: 'rgba(200,123,82,0.42)',
            fontFamily: "'Inter', system-ui, sans-serif",
            marginBottom: 30,
          }}
        >
          Bien-être sur mesure
        </motion.div>

        {/* ── Bottom reveal line ── */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: 0.46 }}
          style={{
            width: 56, height: 1.5,
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,123,82,0.38) 50%, transparent 100%)',
            transformOrigin: 'center',
          }}
        />

      </div>
    </motion.div>
  )
}
