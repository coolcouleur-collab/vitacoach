import React, { useState, useEffect, useRef } from 'react'
import './tokens.css'

// ─── BACKGROUND BLOBS ────────────────────────────────────────────────────────
function LandingBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-8%',  left: '-6%',  width: '72rem', height: '72rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,123,82,0.20) 0%, transparent 65%)', animation: 'floatOrb 16s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '18%',  right: '-8%', width: '64rem', height: '64rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,66,35,0.13) 0%, transparent 65%)',   animation: 'floatOrb 20s ease-in-out infinite reverse' }} />
      <div style={{ position: 'absolute', top: '55%',  left: '25%',  width: '80rem', height: '80rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,150,42,0.10) 0%, transparent 60%)', animation: 'floatOrb 14s ease-in-out infinite .5s' }} />
      <div style={{ position: 'absolute', top: '70%',  left: '-4%',  width: '50rem', height: '50rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,123,82,0.12) 0%, transparent 60%)', animation: 'floatOrb 18s ease-in-out infinite reverse .8s' }} />
      <div style={{ position: 'absolute', bottom: '-5%', right: '10%', width: '60rem', height: '60rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,66,35,0.09) 0%, transparent 60%)',   animation: 'floatOrb 22s ease-in-out infinite .2s' }} />
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
      `}</style>

      <LandingBg />
      <Waiter done={loaded} />
      <Nav onCommencer={onCommencer} onForum={onForum} />

      {/* ── HERO ── */}
      <Hero onCommencer={onCommencer} />

      {/* ── STATS ── */}
      <StatsBar />

      {/* ── FEATURES GRID ── */}
      <section id="features" style={{ padding: '10rem var(--padgrid)' }}>
        <div style={{ maxWidth: '128rem', margin: '0 auto' }}>
          <SectionHead
            tag="Fonctionnalités"
            title={<>Tout ce dont tu as besoin,<br /><span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>en un seul endroit</span></>}
            sub="Six domaines clés de ta vie, couverts par une IA qui te connaît vraiment."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 32rem), 1fr))', gap: '2rem' }}>
            {FEATURES.map((f, i) => <FeatureCard key={i} f={f} delay={i * 0.08} />)}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '10rem var(--padgrid)', background: 'rgba(15,66,35,.025)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: '128rem', margin: '0 auto' }}>
          <SectionHead
            tag="Témoignages"
            title={<>Ils ont transformé<br /><span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>leur quotidien</span></>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(28rem,1fr))', gap: '2.4rem' }}>
            {TESTIS.map((t, i) => <TestiCard key={i} t={t} delay={i * 0.1} />)}
          </div>
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
