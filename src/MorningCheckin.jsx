import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoonIcon, SparkleIcon, SunIcon, TargetIcon, SadIcon, NeutralIcon, HappyIcon } from './Icons'
import { AMBRE, ENCRE, ICONE } from './palette'

const EASE = [0.22, 1, 0.36, 1]

const HUMEURS = [
  // Même dégradé que le check-in de l'accueil : du terracotta sourd à l'ambre
  // doré. Avant, cet écran mêlait un gris ardoise, un vert et deux jaunes
  // Tailwind, du bleu, du vert et du gris au milieu d'une palette chaude
  // (retour Jean 2026-08-08).
  { val: 1, label: 'Vide',      color: 'rgba(169,97,74,0.95)',  icon: <NeutralIcon size={30} color="rgba(169,97,74,0.95)"  /> },
  { val: 2, label: 'Difficile', color: 'rgba(192,117,81,0.95)', icon: <SadIcon     size={30} color={ICONE} /> },
  { val: 3, label: 'Neutre',    color: 'rgba(212,143,82,0.95)', icon: <NeutralIcon size={30} color={ICONE} /> },
  { val: 4, label: 'Bien',      color: AMBRE, icon: <HappyIcon   size={30} color={ICONE} /> },
  { val: 5, label: 'Super',     color: AMBRE, icon: <HappyIcon   size={30} color={ICONE} /> },
]

export default function MorningCheckin({ profil, onDone, onSkip }) {
  const [step, setStep]       = useState(0)
  const [sommeil, setSommeil] = useState(7)
  const [humeur, setHumeur]   = useState(null)
  const [intention, setIntention] = useState('')

  const nom   = profil?.nom || ''
  const hr    = new Date().getHours()
  const greet = hr < 9 ? 'Bonjour' : 'Salut'

  function handleHumeur(val) {
    setHumeur(val)
    setTimeout(() => setStep(2), 320)
  }

  function handleSubmit() {
    if (window?.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Medium })
      }).catch(() => {})
    }
    onDone({ sommeil, humeur, intention: intention.trim() })
  }

  function handleHumeurWithHaptic(val) {
    if (window?.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light })
      }).catch(() => {})
    }
    handleHumeur(val)
  }

  const progress = ((step + 1) / 3) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        // Voile chaud : le noir neutre laissait transparaître l'app en dessous
        // et virait au bleu-pétrole. Ici un brun-terracotta profond, cohérent
        // avec l'univers, qui garde le focus sur la question posée.
        // Le fond de l'app, pas un ecran a part. C'etait le seul ecran en brun
        // fonce de tout Solenn, et il detonnait (Jean, 2026-09-01).
        background: 'linear-gradient(160deg, #FFF6E8 0%, #F5DDB0 50%, #FFF6E8 100%)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <style>{`
        .mc-sleep-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px; height: 22px; border-radius: 50%;
          background: #E8962A;
          border: 2px solid rgba(255,238,220,0.9);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .mc-sleep-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: #E8962A;
          border: 2px solid rgba(255,238,220,0.9);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* ── Barre de progression ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(200,123,82,0.15)', zIndex: 10 }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ height: '100%', background: 'linear-gradient(90deg, #C87B52, #E8962A)', borderRadius: 2 }}
        />
      </div>

      {/* ── Bouton skip ── */}
      <button
        onClick={onSkip}
        style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 20px)', right: 20, zIndex: 10,
          background: 'rgba(255,235,210,0.45)', border: '1px solid rgba(255,220,160,0.60)',
          borderRadius: 20, padding: '6px 14px',
          color: ENCRE, fontSize: 12, fontWeight: 500,
          fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        Passer
      </button>

      {/* ── Contenu centré ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 28px 20px', maxWidth: 520, margin: '0 auto', width: '100%',
        overflowY: 'auto', boxSizing: 'border-box',
      }}>

        {/* Salutation */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
            color: ENCRE, textTransform: 'uppercase',
            marginBottom: 40, textAlign: 'center',
          }}
        >
          <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>{greet}{nom ? ` ${nom}` : ''} <SunIcon size={14} color={ICONE} /> · Check-in express</span>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Étape 0 : Sommeil ── */}
          {step === 0 && (
            <motion.div key="sommeil"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              {/* La lune était bleu-lavande : seule tache froide de l'écran */}
              <div style={{ marginBottom: 20, display:'flex', justifyContent:'center' }}><MoonIcon size={56} color={ICONE} /></div>
              <h2 style={{
                fontSize: 'clamp(22px,5vw,28px)', fontWeight: 800,
                color: ENCRE, marginBottom: 8, letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}>
                Combien d'heures<br/>tu as dormi ?
              </h2>
              <p style={{ fontSize: 13, color: ENCRE, marginBottom: 48 }}>
                Objectif recommandé : 8h
              </p>

              {/* Slider visuel */}
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <div style={{
                  fontSize: 72, fontWeight: 900, lineHeight: 1,
                  color: ENCRE, letterSpacing: '-3px', marginBottom: 24,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {sommeil}<span style={{ fontSize: 28, fontWeight: 600, color: ICONE, marginLeft: 4 }}>h</span>
                </div>
                <input
                  className="mc-sleep-slider"
                  type="range" min={2} max={12} step={0.5} value={sommeil}
                  onChange={e => setSommeil(parseFloat(e.target.value))}
                  style={{
                    width: '100%', accentColor: '#C87B52',
                    height: 6, cursor: 'pointer',
                    appearance: 'none', WebkitAppearance: 'none',
                    background: `linear-gradient(to right, #C87B52 0%, #E8962A ${((sommeil-2)/10)*100}%, rgba(200,123,82,0.20) ${((sommeil-2)/10)*100}%, rgba(200,123,82,0.20) 100%)`,
                    borderRadius: 6, outline: 'none', border: 'none',
                  }}
                />
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, color: ENCRE, marginTop: 8,
                }}>
                  <span>2h</span><span>12h</span>
                </div>
              </div>

              <button onClick={() => setStep(1)} style={btnFullStyle}>
                Suivant
              </button>
            </motion.div>
          )}

          {/* ── Étape 1 : Humeur ── */}
          {step === 1 && (
            <motion.div key="humeur"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              <div style={{ marginBottom: 20, display:'flex', justifyContent:'center' }}><SparkleIcon size={56} color={ICONE} /></div>
              <h2 style={{
                fontSize: 'clamp(22px,5vw,28px)', fontWeight: 800,
                color: ENCRE, marginBottom: 8, letterSpacing: '-0.5px',
              }}>
                Ton humeur ce matin ?
              </h2>
              <p style={{ fontSize: 13, color: ENCRE, marginBottom: 48 }}>
                Sois honnête, Solenn adapte ses conseils
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {HUMEURS.map((h, i) => (
                  <motion.button
                    key={h.val}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.3, ease: EASE }}
                    onClick={() => handleHumeurWithHaptic(h.val)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      width: 72, padding: '16px 8px',
                      borderRadius: 20,
                      background: humeur === h.val
                        ? 'rgba(200,123,82,0.25)'
                        : 'rgba(255,235,210,0.30)',
                      border: humeur === h.val
                        ? '2px solid rgba(200,123,82,0.70)'
                        : '1.5px solid rgba(255,220,160,0.55)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                      transition: 'background 0.2s, border 0.2s',
                    }}
                  >
                    <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>{h.icon}</span>
                    <span style={{ fontSize: 10, color: ENCRE, fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>
                      {h.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Étape 2 : Intention ── */}
          {step === 2 && (
            <motion.div key="intention"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              <div style={{ marginBottom: 20, display:'flex', justifyContent:'center' }}><TargetIcon size={56} color={ICONE} /></div>
              <h2 style={{
                fontSize: 'clamp(22px,5vw,28px)', fontWeight: 800,
                color: ENCRE, marginBottom: 8, letterSpacing: '-0.5px',
              }}>
                Une intention<br/>pour aujourd'hui ?
              </h2>
              <p style={{ fontSize: 13, color: ENCRE, marginBottom: 36 }}>
                Optionnel, mais ça aide vraiment
              </p>

              <input
                type="text"
                placeholder="Ex : marcher 30 min, boire 2L..."
                value={intention}
                onChange={e => setIntention(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '16px 20px', borderRadius: 16,
                  border: '1.5px solid rgba(200,123,82,0.30)',
                  background: 'rgba(255,235,210,0.32)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  fontSize: 16, fontFamily: 'Poppins, sans-serif',
                  color: ENCRE, outline: 'none', marginBottom: 24,
                  textAlign: 'center',
                }}
              />

              <button onClick={handleSubmit} style={{
                ...btnFullStyle,
                background: 'rgba(255,235,210,0.32)',
                color: ENCRE,
              }}>
                <span style={{display:'flex',alignItems:'center',gap:6}}><SparkleIcon size={13} color="white" />Lancer ma journée</span>
              </button>

              {!intention && (
                <button onClick={handleSubmit} style={{
                  marginTop: 12, background: 'none', border: 'none',
                  color: AMBRE, fontSize: 12,
                  fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
                  padding: 8,
                }}>
                  Passer cette étape
                </button>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Indicateurs de step ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8,
        padding: '16px 0 max(32px, env(safe-area-inset-bottom, 32px))',
        flexShrink: 0,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            height: 6, borderRadius: 6,
            width: i === step ? 24 : 6,
            background: i <= step ? 'rgba(200,123,82,0.85)' : 'rgba(200,123,82,0.20)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    </motion.div>
  )
}

// Recette CTA validée par Jean : verre ambré CLAIR. L'ancien terracotta à 18 %
// sur fond sombre donnait un brun foncé éteint, exactement ce qu'elle refuse.
const btnFullStyle = {
  width: '100%', padding: '16px', borderRadius: 16,
  background: 'rgba(255,235,210,0.32)',
  color: ENCRE, fontSize: 15, fontWeight: 700,
  fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
  letterSpacing: '-0.2px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,220,160,0.60)',
}
