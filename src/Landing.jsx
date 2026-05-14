import React, { useState, useEffect, useRef } from 'react'
import FxSlider from './FxSlider'
import LiquidImage from './LiquidImage'
import './tokens.css'

// ─── BACKGROUND FX-SLIDER ────────────────────────────────────────────────────
const BANDS = [
  { gradient: 'linear-gradient(105deg, transparent 0%, rgba(200,123,82,0.11) 40%, rgba(232,150,42,0.07) 65%, transparent 100%)', top:'-5%',  h:'60%', dur:'30s', delay:'0s'   },
  { gradient: 'linear-gradient(98deg,  transparent 0%, rgba(255,190,120,0.08) 35%, rgba(200,123,82,0.09) 60%, transparent 100%)', top:'35%',  h:'55%', dur:'38s', delay:'-12s' },
  { gradient: 'linear-gradient(102deg, transparent 0%, rgba(232,150,42,0.06) 40%, rgba(200,123,82,0.08) 70%, transparent 100%)', top:'65%',  h:'50%', dur:'26s', delay:'-20s' },
]

function LandingBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: 'linear-gradient(165deg, #FFFAF5 0%, #FFF3E8 50%, #FFFAF5 100%)' }}>
      {/* Bandes coulissantes — 3 seulement pour les perfs */}
      {BANDS.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: b.top, left: '-15%',
          width: '130%', height: b.h,
          background: b.gradient,
          filter: 'blur(40px)',
          borderRadius: '40%',
          animation: `sliderBand ${b.dur} ${b.delay} ease-in-out infinite alternate`,
        }} />
      ))}
      {/* Orbes */}
      <div style={{ position:'absolute', top:'-10%', left:'-8%', width:'65rem', height:'65rem', borderRadius:'50%', background:'radial-gradient(circle, rgba(200,123,82,0.13) 0%, transparent 65%)', animation:'floatOrb 18s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'15%', right:'-6%', width:'52rem', height:'52rem', borderRadius:'50%', background:'radial-gradient(circle, rgba(15,66,35,0.06) 0%, transparent 65%)', animation:'floatOrb 24s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', top:'55%', left:'28%', width:'68rem', height:'68rem', borderRadius:'50%', background:'radial-gradient(circle, rgba(232,150,42,0.07) 0%, transparent 60%)', animation:'floatOrb 20s ease-in-out infinite 1s' }} />
    </div>
  )
}

// ─── IO hook (scroll reveal) ──────────────────────────────────────────────────
function useIO(threshold = 0.15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('in'); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ─── WAITER (loader overlay) ──────────────────────────────────────────────────
function Waiter({ done }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg)',
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
        <span style={{ fontSize: 'max(1.4rem,14px)', fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Solenn</span>
      </div>
    </div>
  )
}

// ─── NAV (pilule flottante glassmorphism) ─────────────────────────────────────
function Nav({ onCommencer, onForum }) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY.current && y > 80)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed',
      top: 'var(--nav-top)',
      left: '50%',
      transform: `translate(-50%, ${hidden ? '-130%' : '0'})`,
      zIndex: 55,
      transition: `transform var(--t-panel) var(--ease)`,
    }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          borderRadius: 'var(--br)',
          padding: '1.2rem 2.2rem',
          background: 'rgba(17,17,17,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: '2.4rem',
          boxShadow: '0 .8rem 3.2rem rgba(0,0,0,.24)',
        }}>
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={navLinkStyle}>
            <span style={{ fontWeight: 900, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 'max(1.5rem,15px)', letterSpacing: '-0.02em' }}>Solenn</span>
          </a>
          <div style={{ width: 1, height: '1.6rem', background: 'rgba(255,255,255,.15)' }} />
          {[['Fonctionnalités', '#features'], ['Tarifs', '#pricing'], ['Forum', null]].map(([l, h]) => (
            <a key={l} href={h || '#'}
              onClick={l === 'Forum' ? e => { e.preventDefault(); onForum() } : undefined}
              style={navLinkStyle}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.7)'}
            >{l}</a>
          ))}
          <div style={{ width: 1, height: '1.6rem', background: 'rgba(255,255,255,.15)' }} />
          <button onClick={onCommencer} style={{
            background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
            color: '#fff', border: 'none', borderRadius: 'var(--br)',
            padding: '.7rem 2rem', fontSize: 'max(1.4rem,14px)', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 .4rem 1.4rem rgba(200,123,82,.40)',
            transition: 'transform var(--t-micro) var(--ease)',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >Commencer →</button>
        </div>
        <div style={shineBorderStyle} />
      </div>
    </nav>
  )
}

const navLinkStyle = {
  color: 'rgba(255,255,255,.7)',
  fontSize: 'max(1.4rem,14px)',
  textDecoration: 'none',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'color .3s ease',
  background: 'none', border: 'none', fontFamily: 'var(--font)',
}

const shineBorderStyle = {
  position: 'absolute', inset: 0,
  borderRadius: 'var(--br)',
  border: '1.5px solid transparent',
  background: 'linear-gradient(156deg, rgba(255,255,255,.35) 2%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 55%, rgba(255,255,255,.1) 93%) border-box',
  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
  WebkitMaskComposite: 'destination-out',
  maskComposite: 'exclude',
  pointerEvents: 'none',
}

// ─── CHAT MOCK ────────────────────────────────────────────────────────────────
function ChatMock() {
  return (
    <div style={{
      background: 'rgba(255,248,242,0.84)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1.5px solid rgba(200,123,82,0.2)',
      borderRadius: 28,
      padding: '2.4rem',
      boxShadow: '0 2.4rem 7.2rem rgba(200,123,82,0.16), 0 .8rem 2.4rem rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9)',
      display: 'flex', flexDirection: 'column', gap: '1.4rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', paddingBottom: '1.4rem', borderBottom: '1px solid rgba(200,123,82,0.12)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg,#C87B52,#9E5C35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 4px 14px rgba(200,123,82,.35)' }}>S</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a0a00' }}>Solenn</div>
          <div style={{ fontSize: 11, color: '#34c759', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34c759', display: 'inline-block', boxShadow: '0 0 5px #34c759' }} />
            En ligne · Répond en &lt; 2s
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(200,123,82,0.09)', padding: '4px 10px', borderRadius: 8, fontWeight: 700, letterSpacing: '0.04em' }}>IA</div>
      </div>

      {/* User message */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', background: 'linear-gradient(135deg,#C87B52,#9E5C35)', fontSize: 12.5, color: '#fff', fontWeight: 600, lineHeight: 1.55, boxShadow: '0 4px 16px rgba(200,123,82,.28)' }}>
          J'ai du mal à m'endormir le soir…
        </div>
      </div>

      {/* AI response 1 */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ maxWidth: '86%', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', fontSize: 12.5, color: '#1a0a00', lineHeight: 1.65, border: '1px solid rgba(200,123,82,0.12)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          ✨ J'ai analysé ton profil. Voici un protocole sommeil personnalisé basé sur tes habitudes et ta carence en magnésium.
        </div>
      </div>

      {/* AI response 2 — highlighted */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ maxWidth: '92%', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(200,123,82,0.07)', fontSize: 12, color: '#4a2a12', lineHeight: 1.7, border: '1px solid rgba(200,123,82,0.18)', borderLeft: '3px solid #C87B52', fontWeight: 500 }}>
          🌿 Ashwagandha + magnésium bisglycinate à 21h<br />
          🍵 Tisane valériane 30min avant le coucher<br />
          📵 Écran off à 22h30
        </div>
      </div>

      {/* Typing indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#C87B52', opacity: 0.45, animation: `typingDot .9s ${i * 0.18}s ease-in-out infinite` }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Solenn écrit…</span>
      </div>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
const ROTATING = ['Nutrition', 'Sommeil', 'Stress', 'Énergie', 'Bien-être', 'Style']

function Hero({ onCommencer }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => { setIdx(i => (i + 1) % ROTATING.length); setFade(true) }, 280)
    }, 2400)
    return () => clearInterval(t)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 42rem), 1fr))',
      alignItems: 'center',
      gap: '5.6rem',
      padding: '14rem var(--padgrid) 8rem',
      position: 'relative',
      zIndex: 1,
      maxWidth: '140rem',
      margin: '0 auto',
    }}>
      {/* Orbes déco */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-10%', width: '60rem', height: '60rem', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,123,82,.07) 0%,transparent 65%)', animation: 'floatOrb 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '0', right: '-8%', width: '80rem', height: '80rem', borderRadius: '50%', background: 'radial-gradient(circle,rgba(15,66,35,.055) 0%,transparent 65%)', animation: 'floatOrb 18s ease-in-out infinite reverse' }} />
      </div>

      {/* Left: text */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '.8rem',
          background: 'rgba(15,66,35,.07)', border: '1px solid rgba(15,66,35,.14)',
          borderRadius: 'var(--br)', padding: '.7rem 1.8rem',
          fontSize: 'var(--p3)', color: 'var(--accent-green)', fontWeight: 600,
          marginBottom: '3.2rem',
          animation: 'heroIn .8s var(--ease) both',
        }}>
          <span style={{ width: '.7rem', height: '.7rem', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 .8rem rgba(15,66,35,.5)', display: 'inline-block' }} />
          Coach de vie IA · re·vivre · évoluer
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: 'var(--h1)',
          fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.02,
          color: 'var(--text-strong)',
          marginBottom: '2.4rem',
          animation: 'heroIn .8s .12s var(--ease) both',
        }}>
          Ton expert personnel<br />en{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            display: 'inline-block',
            opacity: fade ? 1 : 0,
            transform: fade ? 'translateY(0)' : 'translateY(-.6rem)',
            transition: 'opacity .28s var(--ease), transform .28s var(--ease)',
          }}>
            {ROTATING[idx]}
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'var(--p1)', color: 'var(--text-muted)', maxWidth: '52rem',
          marginBottom: '4rem', lineHeight: 1.65,
          animation: 'heroIn .8s .22s var(--ease) both',
        }}>
          Solenn analyse ton profil en profondeur pour t'accompagner chaque jour
          avec des conseils santé, nutrition et bien-être vraiment personnalisés.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: '1.4rem', flexWrap: 'wrap',
          animation: 'heroIn .8s .32s var(--ease) both',
          marginBottom: '3.6rem',
        }}>
          <button onClick={onCommencer} style={{
            background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
            color: '#fff', border: 'none', borderRadius: 'var(--br)',
            padding: '1.7rem 4.4rem', fontSize: 'max(1.5rem,15px)', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 1.2rem 4rem rgba(200,123,82,.40)',
            transition: 'transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease)',
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 1.8rem 5.2rem rgba(200,123,82,.54)' }}
            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 1.2rem 4rem rgba(200,123,82,.40)' }}
          >
            Créer mon profil gratuitement →
          </button>
          <button style={{
            background: 'transparent', color: 'var(--text-strong)',
            border: '1.5px solid var(--border)', borderRadius: 'var(--br)',
            padding: '1.7rem 4.4rem', fontSize: 'max(1.5rem,15px)', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font)',
            transition: 'border-color var(--t-micro) var(--ease), background var(--t-micro) var(--ease)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(200,123,82,.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Voir les fonctionnalités ↓
          </button>
        </div>

        {/* Platform badges */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          animation: 'heroIn .8s .40s var(--ease) both',
        }}>
          <span style={{ fontSize: 'max(1.2rem,12px)', color: 'var(--text-muted)', fontWeight: 500 }}>Disponible sur</span>
          {[['💻', 'Ordinateur'], ['📱', 'Mobile'], ['🌐', 'Navigateur']].map(([icon, label]) => (
            <div key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              fontSize: 'max(1.2rem,12px)', color: 'var(--text-muted)',
              background: 'rgba(0,0,0,.04)', border: '1px solid var(--border-soft)',
              borderRadius: 'var(--br)', padding: '.45rem 1.1rem', fontWeight: 500,
            }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--text-muted)' }}>· Aucun téléchargement requis</span>
        </div>
      </div>

      {/* Right: Chat mock */}
      <div style={{ position: 'relative', zIndex: 1, animation: 'heroIn .8s .28s var(--ease) both' }}>

        {/* ── LiquidImage — orbe cuivré derrière le mock ── */}
        <LiquidImage
          width={480}
          height={480}
          intensity={1.1}
          speed={0.7}
          gradient={['#C87B52','#F0B060','#E8962A','#9E5C35','#C87B52']}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -52%)',
            width: '26rem', height: '26rem',
            borderRadius: '50%',
            opacity: 0.42,
            zIndex: -1,
            pointerEvents: 'none',
            filter: 'blur(2px)',
          }}
        />

        <ChatMock />
        {/* Float badge 1 */}
        <div style={{
          position: 'absolute', bottom: '-1.6rem', left: '-2rem',
          background: '#fff', borderRadius: 16, padding: '10px 14px',
          boxShadow: '0 8px 28px rgba(0,0,0,.10)', border: '1px solid rgba(200,123,82,0.14)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'floatOrb 5s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 18 }}>🌿</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#1a0a00', lineHeight: 1.2 }}>Protocole naturel</div>
            <div style={{ fontSize: 10, color: '#C87B52', fontWeight: 600 }}>3 recommandations</div>
          </div>
        </div>
        {/* Float badge 2 */}
        <div style={{
          position: 'absolute', top: '-1.4rem', right: '-1.4rem',
          background: '#fff', borderRadius: 16, padding: '10px 14px',
          boxShadow: '0 8px 28px rgba(0,0,0,.10)', border: '1px solid rgba(200,123,82,0.14)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'floatOrb 7s ease-in-out infinite reverse',
        }}>
          <span style={{ fontSize: 18 }}>💯</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#1a0a00', lineHeight: 1.2 }}>Score santé</div>
            <div style={{ fontSize: 10, color: '#34c759', fontWeight: 600 }}>87 / 100 aujourd'hui</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{
      padding: '4rem var(--padgrid)',
      borderTop: '1px solid rgba(255,255,255,0.6)',
      borderBottom: '1px solid rgba(255,255,255,0.6)',
      background: 'rgba(255,255,255,0.45)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ maxWidth: '100rem', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
        {[['6', 'Domaines couverts'], ['∞', 'Conseils sur-mesure'], ['24/7', 'Disponible'], ['100%', 'Personnalisé']].map(([v, l], i, arr) => (
          <div key={l} style={{
            flex: 1, maxWidth: '20rem', textAlign: 'center', padding: '0 2.4rem',
            borderRight: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none',
          }}>
            <div style={{ fontSize: 'max(2.8rem,24px)', fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '.4rem' }}>{v}</div>
            <div style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--text-muted)', fontWeight: 500 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FX SLIDER ────────────────────────────────────────────────────────────────
const FX_SLIDES = [
  {
    num: '01', tag: 'Coaching IA',
    title: ['Ton coach', 'personnel 24/7'],
    sub: 'Solenn analyse ton profil complet et répond instantanément à toutes tes questions santé.',
    color: '#C87B52', accent: '#E8962A',
    bg: 'linear-gradient(145deg,#1a0800 0%,#3d1a08 50%,#5a2810 100%)',
    visual: '🤖', stat: '< 2s', statLabel: 'Temps de réponse',
    items: ['Profil complet mémorisé', 'Disponible 24 h / 24', 'Réponses personnalisées'],
  },
  {
    num: '02', tag: 'Nutrition',
    title: ['Manger juste,', 'pour toi'],
    sub: 'Repas adaptés à tes intolérances, allergies et objectifs. Calculé pour ton corps, pas une moyenne.',
    color: '#34c759', accent: '#4cd964',
    bg: 'linear-gradient(145deg,#021008 0%,#0a3018 50%,#14582a 100%)',
    visual: '🥗', stat: '100%', statLabel: 'Personnalisé',
    items: ['Halal · Vegan · Keto', 'Carences & allergies', 'Recettes sur-mesure'],
  },
  {
    num: '03', tag: 'Sommeil',
    title: ['Récupère', 'comme un pro'],
    sub: 'Protocoles sommeil sur-mesure. Cohérence cardiaque, adaptogènes, routine soir optimisée.',
    color: '#818cf8', accent: '#a5b4fc',
    bg: 'linear-gradient(145deg,#03030f 0%,#08082a 50%,#121244 100%)',
    visual: '🌙', stat: '+1.8h', statLabel: 'Sommeil gagné',
    items: ['Cohérence cardiaque', 'Mélatonine naturelle', 'Analyse du rythme'],
  },
  {
    num: '04', tag: 'Bien-être naturel',
    title: ['Plantes &', 'nature'],
    sub: 'Ashwagandha, valériane, ginseng — recommandés selon ton profil exact, jamais génériques.',
    color: '#2d9e5f', accent: '#34c759',
    bg: 'linear-gradient(145deg,#020d05 0%,#063514 50%,#0a4d1e 100%)',
    visual: '🌿', stat: '50+', statLabel: 'Plantes référencées',
    items: ['Adaptogènes ciblés', 'Phytothérapie', 'Aromathérapie'],
  },
  {
    num: '05', tag: 'Style & Météo',
    title: ['Tenues selon', 'ta météo'],
    sub: 'Combinaisons de ta garde-robe générées chaque matin selon la météo de ta ville et l\'occasion.',
    color: '#C87B52', accent: '#F0B060',
    bg: 'linear-gradient(145deg,#0f0400 0%,#281204 50%,#3d1e08 100%)',
    visual: '👗', stat: '7j/7', statLabel: 'Mis à jour',
    items: ['Météo en temps réel', 'Style personnalisé', 'Toutes occasions'],
  },
]

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

function CinematicSlider() {
  const [cur,     setCur]     = useState(0)
  const [prev,    setPrev]    = useState(null)
  const [animKey, setAnimKey] = useState(0)
  const [dir,     setDir]     = useState('next')
  const [soundOn, setSoundOn] = useState(false)
  const [hovered, setHovered] = useState(false)
  const containerRef = useRef(null)

  const SLIDE = FX_SLIDES[cur]
  const N     = FX_SLIDES.length

  // auto-advance — resets every time cur changes; pauses on hover
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
    <section style={{ padding: '0 var(--padgrid) 10rem', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '128rem', margin: '0 auto' }}>

        {/* ── Container ── */}
        <div
          ref={containerRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            borderRadius: 28,
            overflow: 'hidden',
            height: 'clamp(440px, 60vh, 600px)',
            display: 'grid',
            gridTemplateColumns: '22rem 1fr 22rem',
            boxShadow: `0 4rem 10rem rgba(0,0,0,0.32), 0 1rem 3rem ${SLIDE.accent}1a`,
            transition: 'box-shadow 0.6s ease',
          }}
        >
          {/* ── BG layers: prev (static) + current (clip-path wipe) ── */}
          {prev !== null && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: FX_SLIDES[prev].bg }} />
          )}
          <div key={animKey} style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: SLIDE.bg,
            animation: `fx${dir === 'next' ? 'WipeIn' : 'WipeInLeft'} 0.72s cubic-bezier(0.76,0,0.24,1) both`,
          }} />

          {/* ── Subtle noise grain overlay ── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.03,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }} />

          {/* ═══ LEFT — clickable slide list (Kind of Blue style) ═══ */}
          <div style={{
            position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '3.6rem 2.8rem',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Label */}
            <div style={{
              fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase',
              marginBottom: '2.4rem',
            }}>
              Fonctionnalités
            </div>

            {/* Slide list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {FX_SLIDES.map((sl, i) => {
                const isActive = i === cur
                return (
                  <button
                    key={i}
                    onClick={() => { if (soundOn) playFxSound('click'); navigate(i, i > cur ? 'next' : 'prev') }}
                    onMouseEnter={() => { if (soundOn) playFxSound('hover') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1.2rem',
                      padding: '0.85rem 1rem',
                      background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.25s ease',
                    }}
                  >
                    {/* Bullet */}
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: isActive ? sl.accent : 'transparent',
                      border: isActive ? 'none' : '1.5px solid rgba(255,255,255,0.22)',
                      boxShadow: isActive ? `0 0 10px ${sl.accent}cc` : 'none',
                      transition: 'background 0.3s, box-shadow 0.3s, border 0.3s',
                    }} />
                    {/* Title */}
                    <span style={{
                      fontSize: 'clamp(1.25rem,1.1vw,1.45rem)',
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.30)',
                      fontFamily: 'var(--font)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.25,
                      transition: 'color 0.3s, font-weight 0.2s',
                    }}>
                      {sl.tag}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Sound toggle — tucked at bottom */}
            <div style={{ marginTop: 'auto', paddingTop: '2.8rem' }}>
              <button
                onClick={() => setSoundOn(s => !s)}
                title={soundOn ? 'Couper le son' : 'Activer le son'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.7rem',
                  padding: '0.5rem 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: soundOn ? SLIDE.accent : 'rgba(255,255,255,0.22)',
                  fontSize: '1.15rem',
                  fontFamily: 'var(--font)',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  transition: 'color 0.25s',
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{soundOn ? '🔊' : '🔇'}</span>
                <span style={{ fontSize: '1.05rem' }}>{soundOn ? 'Son activé' : 'Son coupé'}</span>
              </button>
            </div>
          </div>

          {/* ═══ CENTER — big italic title + emoji + stat ═══ */}
          <div style={{
            position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '4rem 3rem',
            gap: '2rem',
          }}>
            {/* Emoji glow */}
            <div key={`vis-${animKey}`} style={{ animation: 'fxVisualIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both' }}>
              <div style={{
                fontSize: '5.6rem', lineHeight: 1,
                filter: `drop-shadow(0 0 3.2rem ${SLIDE.accent}60)`,
                textAlign: 'center',
              }}>
                {SLIDE.visual}
              </div>
            </div>

            {/* Big italic title */}
            <div key={`title-${animKey}`} style={{ animation: 'fxTextIn 0.55s 0.08s cubic-bezier(0.34,1.56,0.64,1) both', textAlign: 'center' }}>
              <h2 style={{
                margin: 0,
                fontSize: 'clamp(3.6rem,4.2vw,5.6rem)',
                fontWeight: 900,
                fontStyle: 'italic',
                color: '#fff',
                lineHeight: 1.0,
                letterSpacing: '-0.055em',
                fontFamily: 'var(--font)',
                textTransform: 'uppercase',
              }}>
                {SLIDE.title[0]}<br />{SLIDE.title[1]}
              </h2>
            </div>

            {/* Stat pill */}
            <div key={`stat-${animKey}`} style={{
              animation: 'fxTextIn 0.5s 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
            }}>
              <div style={{
                fontSize: 'clamp(2.2rem,2.6vw,3rem)',
                fontWeight: 900,
                color: SLIDE.accent,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                transition: 'color 0.4s',
              }}>
                {SLIDE.stat}
              </div>
              <div style={{
                fontSize: '1.0rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>
                {SLIDE.statLabel}
              </div>
            </div>

            {/* Thin horizontal rule */}
            <div style={{
              width: '4rem', height: 1.5,
              background: `linear-gradient(90deg,transparent,${SLIDE.accent}60,transparent)`,
              transition: 'background 0.4s',
            }} />

            {/* Short description */}
            <div key={`sub-${animKey}`} style={{ animation: 'fxTextIn 0.5s 0.26s cubic-bezier(0.34,1.56,0.64,1) both', textAlign: 'center' }}>
              <p style={{
                margin: 0, fontSize: '1.25rem',
                color: 'rgba(255,255,255,0.48)',
                lineHeight: 1.7,
                maxWidth: '32rem',
              }}>
                {SLIDE.sub}
              </p>
            </div>
          </div>

          {/* ═══ RIGHT — items list (Kind of Blue tag list style) ═══ */}
          <div style={{
            position: 'relative', zIndex: 10,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '3.6rem 2.8rem',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Label */}
            <div style={{
              fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase',
              marginBottom: '2.4rem',
            }}>
              Points clés
            </div>

            {/* Items — staggered entrance per slide change */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {SLIDE.items.map((item, i) => (
                <div
                  key={`${animKey}-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1.2rem',
                    padding: '0.85rem 1rem',
                    background: i === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
                    borderRadius: 10,
                    animation: `fxTextIn 0.45s ${0.06 + i * 0.10}s cubic-bezier(0.34,1.56,0.64,1) both`,
                  }}
                >
                  {/* Bullet */}
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? SLIDE.accent : 'transparent',
                    border: i === 0 ? 'none' : '1.5px solid rgba(255,255,255,0.22)',
                    boxShadow: i === 0 ? `0 0 10px ${SLIDE.accent}cc` : 'none',
                    transition: 'background 0.4s',
                  }} />
                  {/* Text */}
                  <span style={{
                    fontSize: 'clamp(1.25rem,1.1vw,1.45rem)',
                    fontWeight: i === 0 ? 700 : 400,
                    color: i === 0 ? '#fff' : 'rgba(255,255,255,0.30)',
                    fontFamily: 'var(--font)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                  }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Nav arrows — bottom */}
            <div style={{ marginTop: 'auto', paddingTop: '2.8rem', display: 'flex', gap: '0.8rem' }}>
              {[
                { lbl: '←', fn: () => navigate((cur - 1 + N) % N, 'prev') },
                { lbl: '→', fn: () => navigate((cur + 1) % N, 'next') },
              ].map(({ lbl, fn }) => (
                <button key={lbl}
                  onClick={() => { if (soundOn) playFxSound('click'); fn() }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; if (soundOn) playFxSound('hover') }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff', fontSize: '1.4rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease', fontFamily: 'var(--font)',
                  }}
                >{lbl}</button>
              ))}
            </div>
          </div>

          {/* ── Bottom progress bar ── */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 20, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{
              height: '100%',
              width: `${((cur + 1) / N) * 100}%`,
              background: `linear-gradient(90deg,${SLIDE.color},${SLIDE.accent})`,
              transition: 'width 0.65s cubic-bezier(0.76,0,0.24,1), background 0.4s',
              boxShadow: `0 0 8px ${SLIDE.accent}80`,
            }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FEATURES BENTO GRID ──────────────────────────────────────────────────────
const FEATURES = [
  {
    color: '#C87B52', emoji: '🧠',
    tag: 'Intelligence adaptative',
    title: 'Un coach qui te comprend vraiment',
    desc: 'Pathologies, objectifs, régimes, allergies — Solenn mémorise ton profil complet pour des conseils qui te ressemblent, pas des recommandations génériques.',
    pills: ['Profil', 'Pathologies', 'Objectifs', 'Habitudes'],
  },
  {
    color: '#34c759', emoji: '🥗',
    tag: 'Nutrition personnalisée',
    title: 'Manger juste, pour toi',
    desc: 'Repas adaptés à tes intolérances, carences et contraintes religieuses ou éthiques. Calculé pour ton corps, pas pour une moyenne statistique.',
    pills: ['Repas', 'Recettes', 'Compléments', 'Carences'],
  },
  {
    color: '#F59E0B', emoji: '📅',
    tag: 'Routine quotidienne',
    title: 'Chaque journée structurée',
    desc: 'Programme matin-midi-soir généré chaque jour selon ton heure de réveil, ton niveau d\'énergie et tes objectifs du moment.',
    pills: ['Matin', 'Après-midi', 'Soir', 'Rappels'],
  },
  {
    color: '#ff3b30', emoji: '💚',
    tag: 'Suivi santé intelligent',
    title: 'Visualise ta progression',
    desc: 'Score journalier IA, graphiques 30 jours — vois tes progrès réels et identifie ce qui impacte vraiment ta forme au quotidien.',
    pills: ['Score', 'Métriques', 'Graphiques', 'Insights'],
  },
  {
    color: '#0F4223', emoji: '🌿',
    tag: 'Médecine naturelle',
    title: 'Les plantes comme alliées',
    desc: 'Plantes, tisanes et remèdes naturels ciblés sur ton profil de santé exact. Adaptogènes, phytothérapie, aromathérapie — jamais génériques.',
    pills: ['Plantes', 'Tisanes', 'Huiles', 'Adaptogènes'],
  },
  {
    color: '#C87B52', emoji: '👗',
    tag: 'Style & météo',
    title: "T'habiller juste, chaque jour",
    desc: 'Tenues générées selon la météo réelle de ta ville, ton style déclaré et l\'occasion. Combinaisons issues de ta garde-robe, jamais hors de ta réalité.',
    pills: ['Météo', 'Style', 'Occasions', 'Looks'],
  },
]

function FeatureCard({ f, delay }) {
  const ref = useIO(0.15)
  const [hov, setHov] = useState(false)
  return (
    <div ref={ref} className="IO" style={{
      transitionDelay: `${delay}s`,
      background: hov ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.58)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1.5px solid rgba(255,255,255,0.72)`,
      borderTop: `3px solid ${f.color}`,
      borderRadius: 24,
      padding: '2.8rem 2.4rem',
      boxShadow: hov
        ? `0 1.6rem 4.8rem ${f.color}1a, 0 .4rem 1.2rem rgba(0,0,0,.06)`
        : `0 .4rem 1.6rem rgba(0,0,0,.04)`,
      transition: 'all var(--t-micro) var(--ease)',
      transform: hov ? 'translateY(-6px)' : 'none',
      cursor: 'default',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        fontSize: '3.6rem', lineHeight: 1, marginBottom: '1.6rem',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.1))',
        display: 'inline-block',
        transform: hov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
        transition: 'transform .3s var(--ease-spring)',
      }}>{f.emoji}</div>
      <div style={{ fontSize: 'max(1.0rem,10px)', fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '.18em', marginBottom: '.8rem' }}>{f.tag}</div>
      <h3 style={{ fontSize: 'max(1.8rem,17px)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '1.2rem' }}>{f.title}</h3>
      <p style={{ fontSize: 'var(--body)', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.6rem' }}>{f.desc}</p>
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
        {f.pills.map(p => (
          <span key={p} style={{ padding: '.35rem 1rem', borderRadius: 'var(--br)', background: `${f.color}0e`, border: `1px solid ${f.color}22`, fontSize: 'max(1.1rem,11px)', fontWeight: 600, color: f.color }}>{p}</span>
        ))}
      </div>
    </div>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const TESTIS = [
  { name: 'Sophie M.', tag: 'Perte de poids · -8 kg', text: "J'ai perdu 8 kg en 3 mois. Solenn comprend mes contraintes halal et ma carence en fer — les suggestions sont toujours adaptées à ma réalité." },
  { name: 'Thomas L.', tag: 'Productivité · Sommeil', text: "La routine du matin m'a transformé. Je dors mieux, je suis plus concentré, et je n'ai plus besoin de réfléchir à comment organiser mes journées." },
  { name: 'Amira K.', tag: 'SOPK · Bien-être', text: "Les recommandations de plantes pour mon SOPK sont d'une précision incroyable. Enfin un coach qui prend mes pathologies au sérieux, pas un chatbot générique." },
]

function TestiCard({ t, delay }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{
      transitionDelay: `${delay}s`,
      background: 'rgba(255,255,255,0.58)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 24,
      padding: '3.2rem',
      border: '1.5px solid rgba(255,255,255,0.72)',
      boxShadow: '0 .4rem 2.4rem rgba(0,0,0,.04)',
      transition: 'transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease), opacity var(--t-panel) var(--ease)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 1.6rem 4.8rem rgba(0,0,0,.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 .4rem 2.4rem rgba(0,0,0,.04)' }}
    >
      <div style={{ display: 'flex', gap: '.3rem', marginBottom: '1.6rem' }}>
        {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#fbbf24', fontSize: '1.8rem' }}>{s}</span>)}
      </div>
      <p style={{ fontSize: 'var(--p3)', color: 'var(--text-body)', lineHeight: 1.75, fontStyle: 'italic', marginBottom: '2.4rem' }}>
        "{t.text}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{t.name.charAt(0)}</div>
        <div>
          <div style={{ fontSize: 'max(1.3rem,13px)', fontWeight: 700, color: 'var(--text-strong)' }}>{t.name}</div>
          <div style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--accent)', fontWeight: 600 }}>{t.tag}</div>
        </div>
      </div>
    </div>
  )
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Gratuit', price: '0€', period: '', main: false,
    features: ['5 messages IA / jour', 'Suivi santé basique', 'Profil adaptatif', 'Accès forum'],
    cta: 'Commencer gratuitement',
  },
  {
    name: 'Pro', price: '4,99€', period: '/mois', main: true, badge: 'Plus populaire',
    features: ['Messages illimités 24/7', 'Routine quotidienne IA', 'Analyse plantes complète', 'Suggestions tenues + météo', 'Insights santé avancés', 'Historique 30 jours', 'Support prioritaire'],
    cta: 'Essayer Solenn Pro →',
  },
]

function PricingCard({ plan, onCommencer, delay }) {
  const ref = useIO()
  const p = plan
  return (
    <div ref={ref} className="IO" style={{
      transitionDelay: `${delay}s`,
      background: p.main ? 'rgba(255,248,242,0.78)' : 'rgba(255,255,255,0.58)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 28,
      padding: '4rem 3.6rem',
      border: p.main ? '2px solid rgba(200,123,82,.30)' : '1.5px solid rgba(255,255,255,0.72)',
      boxShadow: p.main ? '0 2.4rem 6.4rem rgba(200,123,82,.15), 0 .8rem 2.4rem rgba(0,0,0,.05)' : '0 .4rem 2rem rgba(0,0,0,.04)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      transition: 'transform var(--t-micro) var(--ease), opacity var(--t-panel) var(--ease)',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {p.main && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '.4rem', background: 'linear-gradient(90deg,var(--accent),var(--accent-2))' }} />}
      {p.badge && (
        <div style={{ alignSelf: 'flex-start', marginBottom: '1.6rem', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: '#fff', padding: '.4rem 1.4rem', borderRadius: 'var(--br)', fontSize: 'max(1.1rem,11px)', fontWeight: 700, boxShadow: '0 4px 14px rgba(200,123,82,.28)' }}>
          {p.badge}
        </div>
      )}
      <div style={{ fontSize: 'max(1.2rem,12px)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: p.main ? 'var(--accent)' : 'var(--text-muted)', marginBottom: '.8rem' }}>{p.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem', marginBottom: '2.8rem' }}>
        <span style={{ fontSize: 'max(4.8rem,40px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-strong)' }}>{p.price}</span>
        <span style={{ fontSize: 'var(--p3)', color: 'var(--text-muted)' }}>{p.period}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3.2rem', flex: 1 }}>
        {p.features.map((f, j) => (
          <div key={j} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '1.8rem', height: '1.8rem', borderRadius: '.5rem', flexShrink: 0, background: p.main ? 'linear-gradient(135deg,var(--accent),var(--accent-2))' : '#f0e8e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '.9rem', color: p.main ? '#fff' : 'var(--text-muted)', fontWeight: 800 }}>✓</span>
            </div>
            <span style={{ fontSize: 'var(--p3)', color: p.main ? 'var(--text-strong)' : 'var(--text-muted)', fontWeight: p.main ? 500 : 400 }}>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={onCommencer} style={{
        width: '100%', padding: '1.5rem',
        borderRadius: 'var(--br)', border: 'none',
        fontSize: 'var(--p3)', fontWeight: 800,
        cursor: 'pointer', fontFamily: 'var(--font)',
        background: p.main ? 'linear-gradient(135deg,var(--accent),var(--accent-2))' : 'rgba(0,0,0,.05)',
        color: p.main ? '#fff' : 'var(--text-muted)',
        boxShadow: p.main ? '0 .8rem 2.8rem rgba(200,123,82,.34)' : 'none',
        transition: 'transform var(--t-micro) var(--ease)',
      }}
        onMouseEnter={e => { if (p.main) e.target.style.transform = 'scale(1.02)' }}
        onMouseLeave={e => { e.target.style.transform = 'none' }}
      >{p.cta}</button>
    </div>
  )
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHead({ tag, title, sub }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{ textAlign: 'center', marginBottom: '6.4rem' }}>
      <div style={{
        display: 'inline-block', fontSize: 'max(1.1rem,11px)', fontWeight: 700,
        color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '.22em',
        marginBottom: '1.8rem', padding: '.6rem 1.8rem',
        background: 'rgba(15,66,35,.06)', borderRadius: 'var(--br)',
        border: '1px solid rgba(15,66,35,.12)',
      }}>{tag}</div>
      <h2 style={{ fontSize: 'var(--h2)', fontWeight: 900, color: 'var(--text-strong)', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: sub ? '1.6rem' : 0 }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 'var(--p1)', color: 'var(--text-muted)', maxWidth: '56rem', margin: '0 auto', lineHeight: 1.65 }}>{sub}</p>}
    </div>
  )
}

// ─── CTA BAND ─────────────────────────────────────────────────────────────────
function CtaBand({ onCommencer }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{
      position: 'relative',
      background: 'rgba(14,10,7,0.86)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderRadius: 'var(--br)',
      padding: '6.4rem var(--padgrid)',
      overflow: 'hidden',
      textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      {/* Glow cuivré */}
      <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '80rem', height: '50rem', background: 'radial-gradient(circle, rgba(200,123,82,.22) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 'max(1.2rem,12px)', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: '2rem' }}>Commence aujourd'hui</div>
        <h2 style={{ fontSize: 'var(--h2)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: '1.6rem' }}>
          Prêt à transformer<br />ton quotidien ?
        </h2>
        <p style={{ fontSize: 'var(--p1)', color: 'rgba(255,255,255,.5)', maxWidth: '52rem', margin: '0 auto 4rem', lineHeight: 1.6 }}>
          5 messages gratuits chaque jour. Sans carte bancaire.
        </p>
        <button onClick={onCommencer} style={{
          background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
          color: '#fff', border: 'none', borderRadius: 'var(--br)',
          padding: '2rem 5.6rem', fontSize: 'max(1.6rem,16px)', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'var(--font)',
          boxShadow: '0 1.2rem 4rem rgba(200,123,82,.50)',
          transition: 'transform var(--t-micro) var(--ease)',
        }}
          onMouseEnter={e => { e.target.style.transform = 'scale(1.04) translateY(-2px)' }}
          onMouseLeave={e => { e.target.style.transform = 'none' }}
        >
          Créer mon compte gratuitement →
        </button>
      </div>
    </div>
  )
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
export default function Landing({ onCommencer, onForum }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', fontFamily: 'var(--font)', color: 'var(--text-body)', position: 'relative', zIndex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes waiterPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.04); opacity:.85; } }
        @keyframes floatOrb { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-3rem) scale(1.02); } }
        @keyframes heroIn { from { opacity:0; transform:translateY(3.2rem); } to { opacity:1; transform:translateY(0); } }
        @keyframes typingDot { 0%,80%,100% { transform:scale(.6); opacity:.3; } 40% { transform:scale(1); opacity:1; } }
        @keyframes sliderBand {
          0%   { transform: translateX(0%)   scaleY(1);    opacity: 0.8; }
          50%  { transform: translateX(12%)  scaleY(1.08); opacity: 1;   }
          100% { transform: translateX(22%)  scaleY(0.94); opacity: 0.7; }
        }
        @keyframes fxWipeIn {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }
        @keyframes fxWipeInLeft {
          from { clip-path: inset(0 0 0 100%); }
          to   { clip-path: inset(0 0 0 0%); }
        }
        @keyframes fxVisualIn {
          from { opacity: 0; transform: scale(0.68) translateY(2.8rem); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes fxTextIn {
          from { opacity: 0; transform: translateY(2rem); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <LandingBg />
      <Waiter done={loaded} />
      <Nav onCommencer={onCommencer} onForum={onForum} />

      {/* ── HERO ── */}
      <Hero onCommencer={onCommencer} />

      {/* ── STATS ── */}
      <StatsBar />

      {/* ── CINEMATIC SLIDER ── */}
      <CinematicSlider />

      {/* ── FEATURES CAROUSEL (draggable) ── */}
      <section id="features" style={{ padding: '10rem 0' }}>
        <div style={{ maxWidth: '128rem', margin: '0 auto', paddingBottom: '1.6rem' }}>
          <div style={{ padding: '0 var(--padgrid)' }}>
            <SectionHead
              tag="Fonctionnalités"
              title={<>Tout ce dont tu as besoin,<br /><span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>en un seul endroit</span></>}
              sub="Six domaines clés de ta vie, couverts par une IA qui te connaît vraiment."
            />
          </div>
        </div>
        <div style={{ paddingLeft: 'var(--padgrid)' }}>
          <FxSlider
            items={FEATURES}
            itemWidth={360}
            gap={20}
            height={490}
            radius={24}
            snap
            showProgress
            style={{ overflow: 'visible' }}
            renderItem={(f) => (
              <div style={{
                height: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.72)',
                borderTop: `3px solid ${f.color}`,
                borderRadius: 22,
                padding: '2.8rem 2.4rem',
                display: 'flex', flexDirection: 'column', gap: '1.4rem',
                boxShadow: '0 .4rem 1.6rem rgba(0,0,0,.04)',
                overflow: 'hidden',
              }}>
                <div style={{
                  fontSize: '3.4rem', lineHeight: 1,
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.08))',
                  display: 'inline-block',
                }}>{f.emoji}</div>
                <div>
                  <div style={{ fontSize: 'max(1rem,10px)', fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '.18em', marginBottom: '.6rem' }}>{f.tag}</div>
                  <h3 style={{ margin: 0, fontSize: 'max(1.8rem,16px)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{f.title}</h3>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--body)', color: 'var(--text-muted)', lineHeight: 1.65, flex: 1 }}>{f.desc}</p>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {f.pills.map(p => (
                    <span key={p} style={{ padding: '.3rem .9rem', borderRadius: 'var(--br)', background: `${f.color}0e`, border: `1px solid ${f.color}22`, fontSize: 'max(1.1rem,11px)', fontWeight: 600, color: f.color }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '10rem 0', background: 'rgba(15,66,35,.025)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ padding: '0 var(--padgrid) 1.6rem' }}>
          <SectionHead
            tag="Témoignages"
            title={<>Ils ont transformé<br /><span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>leur quotidien</span></>}
          />
        </div>
        <div style={{ paddingLeft: 'var(--padgrid)' }}>
          <FxSlider
            items={TESTIS}
            itemWidth={400}
            gap={24}
            height={280}
            radius={24}
            snap
            showProgress
            style={{ overflow: 'visible' }}
            renderItem={(t) => (
              <div style={{
                height: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.62)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.72)',
                borderRadius: 22,
                padding: '2.8rem 3.2rem',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 .4rem 2rem rgba(0,0,0,.04)',
                overflow: 'hidden',
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '.3rem', marginBottom: '1.4rem' }}>
                    {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#fbbf24', fontSize: '1.6rem' }}>{s}</span>)}
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--p3)', color: 'var(--text-body)', lineHeight: 1.75, fontStyle: 'italic' }}>
                    "{t.text}"
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '2rem' }}>
                  <div style={{ width: '3.8rem', height: '3.8rem', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{t.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: 'max(1.3rem,13px)', fontWeight: 700, color: 'var(--text-strong)' }}>{t.name}</div>
                    <div style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--accent)', fontWeight: 600 }}>{t.tag}</div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '10rem var(--padgrid)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <SectionHead tag="Tarifs" title="Simple et transparent" sub="Commence gratuitement. Passe Pro quand tu veux, annule quand tu veux." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(28rem,1fr))', gap: '2.4rem' }}>
            {PLANS.map((plan, i) => <PricingCard key={i} plan={plan} onCommencer={onCommencer} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '0 var(--padgrid) 10rem', maxWidth: '100rem', margin: '0 auto' }}>
        <CtaBand onCommencer={onCommencer} />
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-soft)', padding: '5.6rem var(--padgrid) 4.8rem' }}>
        <div style={{ maxWidth: '128rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2.4rem' }}>
          <div>
            <div style={{ fontSize: 'max(2rem,20px)', fontWeight: 900, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '.4rem' }}>Solenn</div>
            <div style={{ fontSize: 'max(1.2rem,12px)', color: 'var(--text-muted)' }}>re·vivre · évoluer</div>
          </div>
          <div style={{ display: 'flex', gap: '3.2rem', flexWrap: 'wrap' }}>
            {[['Fonctionnalités', '#features'], ['Tarifs', '#pricing'], ['Forum', null], ['Contact', null]].map(([l, h]) => (
              <a key={l}
                href={h || '#'}
                onClick={l === 'Forum' ? e => { e.preventDefault(); onForum() } : undefined}
                style={{ fontSize: 'max(1.3rem,13px)', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, transition: 'color var(--t-micro) var(--ease)' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-strong)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >{l}</a>
            ))}
          </div>
          <div style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--border)', alignSelf: 'flex-end' }}>
            © 2026 Solenn · Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  )
}
