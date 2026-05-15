import React, { useState, useEffect, useRef } from 'react'
import LiquidImage from './LiquidImage'
import SpiralBg from './SpiralBg'
import './tokens.css'

// ─── WAITER (loader overlay) ──────────────────────────────────────────────────
function Waiter({ done }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#EDD8CC',
      display: 'grid', placeItems: 'center',
      opacity: done ? 0 : 1,
      pointerEvents: done ? 'none' : 'all',
      transition: 'opacity var(--t-panel) var(--ease)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.6rem',
        animation: 'waiterPulse 1.8s ease-in-out infinite',
      }}>
        <div style={{
          width: '5.6rem', height: '5.6rem', borderRadius: '1.8rem',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 .8rem 2.4rem rgba(200,123,82,.4)',
        }}>
          <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font)', letterSpacing: '-0.04em' }}>S</span>
        </div>
        <span style={{ fontSize: 'max(1.4rem,14px)', fontWeight: 700, color: '#5a4a38', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Solenn</span>
      </div>
    </div>
  )
}

// ─── FX SLIDER DATA ───────────────────────────────────────────────────────────
const FX_SLIDES = [
  {
    num: '01', tag: 'Coaching IA',
    title: ['Ton coach', 'personnel 24/7'],
    sub: 'Solenn analyse ton profil complet et répond instantanément à toutes tes questions santé.',
    color: '#EDE8DC', accent: '#E8962A',
    bg: 'transparent',
    items: ['Profil complet mémorisé', 'Disponible 24 h / 24', 'Réponses personnalisées'],
  },
  {
    num: '02', tag: 'Nutrition',
    title: ['Manger juste,', 'pour toi'],
    sub: 'Repas adaptés à tes intolérances, allergies et objectifs. Calculé pour ton corps, pas une moyenne.',
    color: '#EDE8DC', accent: '#E8962A',
    bg: 'transparent',
    items: ['Halal · Vegan · Keto', 'Carences & allergies', 'Recettes sur-mesure'],
  },
  {
    num: '03', tag: 'Sommeil',
    title: ['Récupère', 'comme un pro'],
    sub: 'Protocoles sommeil sur-mesure. Cohérence cardiaque, adaptogènes, routine soir optimisée.',
    color: '#EDE8DC', accent: '#E8962A',
    bg: 'transparent',
    items: ['Cohérence cardiaque', 'Mélatonine naturelle', 'Analyse du rythme'],
  },
  {
    num: '04', tag: 'Bien-être naturel',
    title: ['Plantes &', 'nature'],
    sub: 'Ashwagandha, valériane, ginseng — recommandés selon ton profil exact, jamais génériques.',
    color: '#EDE8DC', accent: '#E8962A',
    bg: 'transparent',
    items: ['Adaptogènes ciblés', 'Phytothérapie', 'Aromathérapie'],
  },
  {
    num: '05', tag: 'Style & Météo',
    title: ['Tenues selon', 'ta météo'],
    sub: 'Combinaisons de ta garde-robe générées chaque matin selon la météo de ta ville et l\'occasion.',
    color: '#C87B52', accent: '#F0B060',
    bg: 'transparent',
    items: ['Météo en temps réel', 'Style personnalisé', 'Toutes occasions'],
  },
]

// ─── FX SOUND ─────────────────────────────────────────────────────────────────
function playFxSound(type) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    if (type === 'hover') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(1400, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05)
      g.gain.setValueAtTime(0.03, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      o.start(); o.stop(ctx.currentTime + 0.05)
    } else if (type === 'click') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(700, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.10)
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.10)
      o.start(); o.stop(ctx.currentTime + 0.10)
    } else if (type === 'transition') {
      const bufSz = Math.floor(ctx.sampleRate * 0.22)
      const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < bufSz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSz)
      const noise = ctx.createBufferSource(); noise.buffer = buf
      const filt = ctx.createBiquadFilter()
      filt.type = 'bandpass'; filt.frequency.value = 600; filt.Q.value = 0.8
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.12, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
      noise.connect(filt); filt.connect(g); g.connect(ctx.destination)
      noise.start(); noise.stop(ctx.currentTime + 0.22)
      const o2 = ctx.createOscillator(), g2 = ctx.createGain()
      o2.connect(g2); g2.connect(ctx.destination)
      o2.frequency.setValueAtTime(280, ctx.currentTime)
      o2.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.18)
      g2.gain.setValueAtTime(0.05, ctx.currentTime)
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      o2.start(); o2.stop(ctx.currentTime + 0.18)
    }
  } catch (_) {}
}

// ─── CINEMATIC SLIDER ─────────────────────────────────────────────────────────
function CinematicSlider({ onCommencer }) {
  const [cur,     setCur]     = useState(0)
  const [prev,    setPrev]    = useState(null)
  const [animKey, setAnimKey] = useState(0)
  const [dir,     setDir]     = useState('next')
  const [soundOn, setSoundOn] = useState(false)
  const [hovered, setHovered] = useState(false)

  const SLIDE = FX_SLIDES[cur]
  const N     = FX_SLIDES.length

  useEffect(() => {
    if (hovered) return
    const id = setTimeout(() => navigate((cur + 1) % N, 'next'), 5200)
    return () => clearTimeout(id)
  }, [cur, hovered])

  function navigate(idx, direction) {
    if (idx === cur) return
    if (soundOn) playFxSound('transition')
    setPrev(cur)
    setDir(direction)
    setCur(idx)
    setAnimKey(k => k + 1)
    setTimeout(() => setPrev(null), 750)
  }

  return (
    <section style={{ position: 'relative', zIndex: 1 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100vh',
          background: 'transparent',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          alignItems: 'stretch',
        }}
      >
        {/* ── LiquidImage ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <LiquidImage
            gradient={['#EDD8CC', '#CCA898', '#E8CABB', '#C4A090']}
            intensity={0.6}
            speed={0.5}
            style={{ width: '100%', height: '100%', opacity: 0.62 }}
          />
        </div>

        {/* ── BG wipe layers ── */}
        {prev !== null && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: FX_SLIDES[prev].bg }} />
        )}
        <div key={animKey} style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: SLIDE.bg,
          animation: `fx${dir === 'next' ? 'WipeIn' : 'WipeInLeft'} 0.72s cubic-bezier(0.76,0,0.24,1) both`,
        }} />

        {/* ── Grain overlay ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: 0.025,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' fill=\'%23C8B898\'/%3E%3C/svg%3E")',
        }} />


        {/* ── Commencer — top right ── */}
        {onCommencer && (
          <button
            onClick={onCommencer}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,248,235,1)'; e.currentTarget.style.borderColor = 'rgba(255,245,225,1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,248,235,1)'; e.currentTarget.style.borderColor = 'rgba(255,245,225,0.80)' }}
            style={{
              position: 'absolute', top: '2.4rem', right: '3rem', zIndex: 20,
              background: 'transparent',
              border: '2.5px solid rgba(255,245,225,0.80)',
              borderRadius: '3rem',
              color: 'rgba(255,248,235,1)',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(1.3rem,1.1vw,1.6rem)',
              fontWeight: 300, cursor: 'pointer',
              padding: '0.8rem 2.4rem',
              letterSpacing: '0.06em',
              transition: 'color 0.3s, border-color 0.3s',
            }}
          >
            Commencer →
          </button>
        )}

        {/* ═══ CENTER — titre pur ═══ */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '0',
          right: '0',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          width: '100%',
        }}>
          <svg
            viewBox="0 0 580 110"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: 'clamp(380px, 55vw, 780px)',
              height: 'auto',
              overflow: 'visible',
              animation: 'solennReveal 0.8s 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <defs>
              <linearGradient id="solennGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <animate attributeName="x1" values="-150%;0%;-150%" dur="4s" repeatCount="indefinite" />
                <animate attributeName="x2" values="-50%;100%;-50%" dur="4s" repeatCount="indefinite" />
                <stop offset="0%"   stopColor="#FFF0D8" stopOpacity="0.72" />
                <stop offset="30%"  stopColor="#FFF8EC" stopOpacity="0.80" />
                <stop offset="50%"  stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="70%"  stopColor="#FFF8EC" stopOpacity="0.80" />
                <stop offset="100%" stopColor="#FFF0D8" stopOpacity="0.72" />
              </linearGradient>
            </defs>
            <text
              x="50%" y="82"
              textAnchor="middle"
              fill="url(#solennGrad)"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fontSize="96"
              fontWeight="300"
              fontStyle="italic"
              letterSpacing="-2"
            >
              Solenn
            </text>
          </svg>

        </div>

        {/* ── Filmstrip navigation — bas ── */}
        <div style={{
          position: 'absolute', bottom: '2.4rem', left: 0, right: 0, zIndex: 20,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: '0.2rem', padding: '0 1rem',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
        }}>
          <button
            onClick={() => setSoundOn(s => !s)}
            style={{
              flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              color: soundOn ? 'rgba(218,138,52,0.75)' : 'rgba(200,140,80,0.35)',
              fontSize: '1.2rem', padding: '0.4rem 0.6rem',
              transition: 'color 0.25s',
            }}
          >{soundOn ? '🔊' : '🔇'}</button>

          {FX_SLIDES.map((sl, i) => (
            <button
              key={i}
              onClick={() => { if (soundOn) playFxSound('click'); navigate(i, i > cur ? 'next' : 'prev') }}
              onMouseEnter={e => {
                if (soundOn) playFxSound('hover')
                if (i !== cur) { e.currentTarget.style.color = 'rgba(255,248,235,1)'; e.currentTarget.style.borderColor = 'rgba(255,245,225,0.80)' }
              }}
              onMouseLeave={e => {
                if (i !== cur) { e.currentTarget.style.color = 'rgba(255,248,235,0.92)'; e.currentTarget.style.borderColor = 'transparent' }
              }}
              style={{
                flexShrink: 0,
                padding: '0.5rem 1.1rem',
                background: 'transparent',
                border: `2.5px solid ${i === cur ? 'rgba(255,245,225,0.82)' : 'transparent'}`,
                borderRadius: '3rem',
                color: i === cur ? 'rgba(255,248,235,1)' : 'rgba(255,248,235,0.92)',
                fontSize: 'clamp(1rem,2.2vw,1.3rem)',
                fontWeight: i === cur ? 400 : 300,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                textShadow: i === cur ? '0 0 20px rgba(255,220,150,0.35)' : 'none',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <span style={{ opacity: 0.45, fontSize: '0.78em' }}>{sl.num}</span>
              {sl.tag}
            </button>
          ))}
        </div>

        {/* ── Progress bar ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, zIndex: 20, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%',
            width: `${((cur + 1) / N) * 100}%`,
            background: `linear-gradient(90deg,${SLIDE.color},${SLIDE.accent})`,
            transition: 'width 0.65s cubic-bezier(0.76,0,0.24,1), background 0.4s',
            boxShadow: `0 0 8px ${SLIDE.accent}80`,
          }} />
        </div>
      </div>
    </section>
  )
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
export default function Landing({ onCommencer }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ background: 'linear-gradient(160deg, #FFF6E8 0%, #F5DDB0 50%, #FFF6E8 100%)', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font)', position: 'relative', zIndex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes waiterPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.04); opacity:.85; } }
        @keyframes fxWipeIn {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }
        @keyframes fxWipeInLeft {
          from { clip-path: inset(0 0 0 100%); }
          to   { clip-path: inset(0 0 0 0%); }
        }
        @keyframes fxTextIn {
          from { opacity: 0; transform: translateY(2rem); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes solennReveal {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatOrb {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(30px,-20px) scale(1.04); }
          66%     { transform: translate(-20px,15px) scale(0.97); }
        }
      `}</style>

      <SpiralBg style={{ position: 'absolute' }} />
      <div style={{ position:'absolute', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(218,138,52,0.50) 0%,rgba(200,100,40,0.22) 45%,transparent 70%)',
        pointerEvents:'none', zIndex:0, animation:'floatOrb 10s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-10%', right:'-8%', width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(200,123,82,0.38) 0%,rgba(180,90,30,0.16) 45%,transparent 70%)',
        pointerEvents:'none', zIndex:0, animation:'floatOrb 13s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', top:'30%', left:'25%', width:700, height:700, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(190,105,35,0.22) 0%,rgba(160,80,20,0.10) 40%,transparent 70%)',
        pointerEvents:'none', zIndex:0, animation:'floatOrb 17s ease-in-out infinite' }} />
      <Waiter done={loaded} />
      <CinematicSlider onCommencer={onCommencer} />
    </div>
  )
}
