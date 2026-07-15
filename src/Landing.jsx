import React, { useState, useEffect, useRef } from 'react'
import LiquidImage from './LiquidImage'
import SpiralBg from './SpiralBg'
import GlobeBg from './GlobeBg'
import { playFx as playFxSound } from './sfx'
import './tokens.css'

// ─── SPLASH (entrée minimaliste) ─────────────────────────────────────────────
function Splash({ done }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'linear-gradient(160deg, #FFF8F2 0%, #F2E2CE 50%, #FFF8F2 100%)',
      display: 'grid', placeItems: 'center',
      opacity: done ? 0 : 1,
      pointerEvents: done ? 'none' : 'all',
      transition: 'opacity 0.6s ease',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes splashBlob {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-15px) scale(1.06); }
        }
        @keyframes splashDot {
          0%,80%,100% { opacity: 0.2; transform: scale(0.7); }
          40%          { opacity: 1;   transform: scale(1); }
        }
      `}</style>
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,123,82,0.35) 0%, rgba(200,100,40,0.14) 45%, transparent 70%)',
        pointerEvents: 'none', animation: 'splashBlob 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,123,82,0.28) 0%, rgba(180,90,30,0.10) 45%, transparent 70%)',
        pointerEvents: 'none', animation: 'splashBlob 11s ease-in-out infinite reverse',
      }} />
      <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'rgba(200,123,82,0.55)',
            animation: `splashDot 1.1s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── FX SLIDER DATA ───────────────────────────────────────────────────────────
const FX_SLIDES = [
  {
    num: '01', tag: 'Vitalité',
    title: ['Nourrir le corps,', 'guider le quotidien'],
    sub: 'Ce que l\'on mange change tout. Solenn le sait, et s\'adapte en continu.',
    color: '#EDE8DC', accent: '#E8962A',
    bg: 'transparent',
    items: ['Sur mesure', 'Apple Santé', 'En temps réel'],
  },
  {
    num: '02', tag: 'Sommeil',
    title: ['Mieux dormir,', 'mieux vivre'],
    sub: 'Des protocoles pensés pour un sommeil qui répare vraiment.',
    color: '#EDE8DC', accent: '#E8962A',
    bg: 'transparent',
    items: ['Sommeil réparateur', 'Gestion du stress', 'Routine du soir'],
  },
  {
    num: '03', tag: 'Rythme',
    title: ['Un quotidien', 'enfin aligné'],
    sub: 'Quand chaque détail est à sa place, la journée entière change de texture.',
    color: '#EDE8DC', accent: '#E8962A',
    bg: 'transparent',
    items: ['Habitudes saines', 'Style du jour', 'Sans effort'],
  },
]

// playFxSound importé depuis sfx.js

// ─── SLIDE TAG TRANSLATIONS ───────────────────────────────────────────────────


// ─── CINEMATIC SLIDER ─────────────────────────────────────────────────────────
function CinematicSlider({ onCommencer }) {
  const [cur,     setCur]     = useState(0)
  const [prev,    setPrev]    = useState(null)
  const [animKey, setAnimKey] = useState(0)
  const [dir,     setDir]     = useState('next')
  const [soundOn,    setSoundOn]    = useState(false)
  const [hovered,    setHovered]    = useState(false)
  const [showPanel,  setShowPanel]  = useState(false)
  const [lang,       setLang]       = useState('FR')
  const [langOpen,   setLangOpen]   = useState(false)

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




        {/* ── Commencer — centré ── */}
        {onCommencer && (
          <button
            onClick={onCommencer}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,100,40,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,220,160,0.70)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,100,40,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,220,160,0.50)' }}
            style={{
              position: 'absolute', top: '65%', left: '50%',
              transform: 'translateX(-50%)', zIndex: 20,
              background: 'rgba(200,100,40,0.08)',
              border: '1px solid rgba(255,220,160,0.60)',
              borderRadius: '2rem',
              color: 'rgba(255,248,235,1)',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(1.3rem,1.4vw,1.65rem)',
              fontWeight: 500, cursor: 'pointer',
              padding: '0.85rem 3rem',
              letterSpacing: '0.10em',
              textShadow: 'none',
              transition: 'background 0.25s, border-color 0.25s', outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Commencer <span className="commencer-arrow">→</span>
          </button>
        )}

        {/* ── Langue — coin haut-droit custom ── */}
        {langOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 19 }}
            onClick={() => setLangOpen(false)}
          />
        )}
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 20 }}>
          <button
            onClick={() => setLangOpen(o => !o)}
            style={{
              background: 'rgba(200,100,40,0.10)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(200,123,82,0.40)',
              borderRadius: '0.7rem',
              color: 'rgba(255,248,235,0.92)',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.42rem 0.85rem',
              letterSpacing: '0.08em',
              outline: 'none',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              transition: 'border-color 0.2s',
            }}
          >
            {lang}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {langOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: 'rgba(38,16,4,0.80)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(200,123,82,0.28)',
              borderRadius: '0.8rem',
              overflow: 'hidden',
              minWidth: 148,
              boxShadow: '0 8px 32px rgba(100,50,10,0.28)',
              animation: 'panelIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
              {[
                ['FR', 'Français'], ['EN', 'English'], ['ES', 'Español'],
                ['DE', 'Deutsch'],  ['IT', 'Italiano'], ['PT', 'Português'],
                ['AR', 'العربية'],  ['ZH', '中文'],     ['JA', '日本語'],
              ].map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setLangOpen(false) }}
                  onMouseEnter={e => { if (code !== lang) e.currentTarget.style.background = 'rgba(200,123,82,0.12)' }}
                  onMouseLeave={e => { if (code !== lang) e.currentTarget.style.background = 'transparent' }}
                  style={{
                    display: 'block', width: '100%',
                    background: code === lang ? 'rgba(200,123,82,0.22)' : 'transparent',
                    border: 'none',
                    color: 'rgba(255,248,235,0.90)',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontStyle: 'italic',
                    fontSize: '0.95rem',
                    fontWeight: code === lang ? 600 : 400,
                    cursor: 'pointer',
                    padding: '0.48rem 1rem',
                    textAlign: 'left',
                    letterSpacing: '0.04em',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ opacity: 0.55, fontSize: '0.76em', marginRight: 7 }}>{code}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

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
            viewBox="0 0 580 138"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: 'clamp(280px, 38vw, 580px)',
              height: 'auto',
              overflow: 'visible',
              animation: 'solennReveal 0.8s 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
              filter: 'drop-shadow(0 0 28px rgba(245,200,100,0.18))',
            }}
          >
            <defs>
              <linearGradient id="solennGrad" x1="-200%" y1="0%" x2="0%" y2="0%">
                <animate attributeName="x1" values="-200%;200%;-200%" dur="9s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0%;400%;0%"       dur="9s" repeatCount="indefinite" />
                <stop offset="0%"   stopColor="#E8924A" stopOpacity="0.42" />
                <stop offset="42%"  stopColor="#F0A855" stopOpacity="0.42" />
                <stop offset="50%"  stopColor="#FFD4A0" stopOpacity="0.52" />
                <stop offset="58%"  stopColor="#F0A855" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#E8924A" stopOpacity="0.42" />
              </linearGradient>
            </defs>
            <text
              x="50%" y="82"
              textAnchor="middle"
              fill="url(#solennGrad)"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fontSize="148"
              fontWeight="300"
              fontStyle="italic"
              letterSpacing="-2"
            >
              Solenn
            </text>
          </svg>

          <div style={{
            position: 'absolute',
            top: '62%',
            left: 0, right: 0,
            textAlign: 'center',
            fontFamily: 'Poppins, sans-serif',
            fontSize: 'clamp(0.72rem, 1vw, 0.88rem)',
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,240,210,0.92)',
            pointerEvents: 'none',
            animation: 'solennReveal 1s 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            Coach IA · Santé &amp; Bien-être
          </div>

        </div>

        {/* ── Mini panel transparent ── */}
        {showPanel && (
          <div key={cur} onClick={() => setShowPanel(false)} className="mini-panel" style={{
            position: 'fixed',
            bottom: '10rem', left: '2rem',
            zIndex: 100,
            width: 300,
            background: 'rgba(200,100,40,0.14)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,220,160,0.50)',
            boxShadow: '0 8px 32px rgba(140,65,15,0.20)',
            borderRadius: 20,
            padding: '36px 26px 32px',
            minHeight: 320,
            cursor: 'pointer',
            animation: 'panelIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <div style={{
              fontSize: '0.90rem', fontFamily: 'Poppins, sans-serif', fontWeight: 600,
              color: 'rgba(200,123,82,0.90)', letterSpacing: '0.18em',
              textTransform: 'uppercase', marginBottom: 20,
            }}>
              {SLIDE.num} · {SLIDE.tag}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 'clamp(2rem, 2.8vw, 2.7rem)',
              color: '#C87B52',
              lineHeight: 1.2, marginBottom: 20,
            }}>
              {SLIDE.title[0]}<br />{SLIDE.title[1]}
            </div>
            <div style={{
              fontFamily: 'Poppins, sans-serif', fontWeight: 400,
              fontSize: '1.15rem',
              color: 'rgba(200,123,82,1)',
              lineHeight: 1.75, marginBottom: 28,
            }}>
              {SLIDE.sub}
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {SLIDE.items.map(item => (
                <span key={item} style={{
                  fontSize: '0.88rem', fontFamily: 'Poppins, sans-serif', fontWeight: 500,
                  color: '#C87B52',
                  background: 'rgba(200,123,82,0.12)',
                  border: '1px solid rgba(200,123,82,0.30)',
                  borderRadius: '2rem', padding: '4px 13px',
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Filmstrip navigation — bas ── */}
        <div className="filmstrip-nav" style={{
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
              color: soundOn ? 'rgba(255,235,190,1)' : 'rgba(255,235,190,0.88)',
              padding: '0.4rem 0.6rem',
              transition: 'color 0.25s',
              display: 'flex', alignItems: 'center',
              filter: soundOn ? 'drop-shadow(0 0 6px rgba(255,200,120,0.50))' : 'none',
            }}
          >
            {soundOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            )}
          </button>

          {FX_SLIDES.map((sl, i) => (
            <button
              key={i}
              onClick={() => {
                if (soundOn) playFxSound('click')
                if (i === cur) { setShowPanel(p => !p) }
                else { navigate(i, i > cur ? 'next' : 'prev'); setShowPanel(true) }
              }}
              onMouseEnter={e => {
                if (soundOn) playFxSound('hover')
                if (i !== cur) { e.currentTarget.style.color = 'rgba(255,248,235,1)' }
              }}
              onMouseLeave={e => {
                if (i !== cur) { e.currentTarget.style.color = 'rgba(255,248,235,0.96)' }
              }}
              style={{
                flexShrink: 0,
                padding: '0.5rem 1.1rem',
                background: 'transparent',
                border: 'none',
                borderRadius: '3rem',
                color: i === cur ? 'rgba(255,248,235,1)' : 'rgba(255,248,235,0.92)',
                fontSize: 'clamp(1.25rem,2.6vw,1.65rem)',
                fontWeight: i === cur ? 700 : 400,
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
              <span style={{ opacity: 0.85, fontSize: '0.78em' }}>{sl.num}</span>
              {sl.tag}
            </button>
          ))}
        </div>

        {/* ── Contact — lien discret bas gauche ── */}
        <a
          href="mailto:contact@solenn.app"
          style={{
            position: 'absolute', bottom: '1rem', left: '1.5rem', zIndex: 20,
            color: 'rgba(255,248,235,0.72)',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontSize: '0.85rem',
            letterSpacing: '0.06em', textDecoration: 'none',
            transition: 'color 0.25s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,248,235,0.85)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,248,235,0.72)'}
        >
          contact@solenn.app
        </a>

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
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 500)
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
        @keyframes panelIn {
          from { opacity:0; transform: translateY(18px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes arrowSlide {
          0%,100% { transform: translateX(0); }
          60%     { transform: translateX(6px); }
        }
        .commencer-arrow { display:inline-block; margin-left:6px; animation: arrowSlide 1.6s ease-in-out infinite; }

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          .btn-top {
            padding: 0.4rem 1.1rem !important;
            font-size: 1.1rem !important;
          }
          .btn-top-left  { left: 1rem !important; top: 1.2rem !important; }
          .btn-top-right { right: 1rem !important; top: 1.2rem !important; }
          .lang-selector {
            right: 50% !important;
            transform: translate(50%, -50%) !important;
            top: 88% !important;
          }
          .mini-panel {
            left: 1rem !important;
            right: 1rem !important;
            width: auto !important;
            bottom: 6rem !important;
            min-height: auto !important;
            padding: 24px 18px 20px !important;
          }
          .filmstrip-nav {
            gap: 0 !important;
            padding: 0 0.5rem !important;
          }
        }
      `}</style>

      <GlobeBg opacity={0.35} />
      <div style={{ position:'absolute', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(200,123,82,0.50) 0%,rgba(200,100,40,0.22) 45%,transparent 70%)',
        pointerEvents:'none', zIndex:0, animation:'floatOrb 10s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-10%', right:'-8%', width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(200,123,82,0.38) 0%,rgba(180,90,30,0.16) 45%,transparent 70%)',
        pointerEvents:'none', zIndex:0, animation:'floatOrb 13s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', top:'30%', left:'25%', width:700, height:700, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(190,105,35,0.22) 0%,rgba(160,80,20,0.10) 40%,transparent 70%)',
        pointerEvents:'none', zIndex:0, animation:'floatOrb 17s ease-in-out infinite' }} />
      <Splash done={splashDone} />
      <CinematicSlider onCommencer={onCommencer} />
    </div>
  )
}
