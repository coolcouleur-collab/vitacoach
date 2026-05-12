import React, { useState, useEffect, useRef } from 'react'
import './tokens.css'

// ─── Intersection Observer hook ──────────────────────────────────────────────
function useIO(threshold = 0.15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('in'); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ─── Nav flottante pilule ─────────────────────────────────────────────────────
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
      transform: `translate(-50%, ${hidden ? '-120%' : '0'})`,
      zIndex: 55,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '1.2rem',
      transition: `transform var(--t-panel) var(--ease)`,
    }}>
      <div className="shine-border" style={{
        borderRadius: 'var(--br)',
        padding: '1.2rem 2.2rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        gap: '2.4rem',
      }}>
        <span style={{
          fontSize: 'max(1.6rem, 16px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          cursor: 'pointer',
        }}>
          Solenn
        </span>

        <div style={{ width: 1, height: '1.6rem', background: 'rgba(255,255,255,.2)' }} />

        {[
          ['Fonctionnalités', '#features'],
          ['Tarifs', '#pricing'],
          ['Forum', null],
        ].map(([label, href]) => (
          <a
            key={label}
            href={href || undefined}
            onClick={label === 'Forum' ? (e) => { e.preventDefault(); onForum() } : undefined}
            style={{
              fontSize: 'var(--p3)',
              color: 'rgba(255,255,255,.75)',
              textDecoration: 'none',
              fontWeight: 500,
              cursor: 'pointer',
              transition: `color var(--t-micro) var(--ease)`,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.75)'}
          >
            {label}
          </a>
        ))}

        <div style={{ width: 1, height: '1.6rem', background: 'rgba(255,255,255,.2)' }} />

        <button onClick={onCommencer} style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--br)',
          padding: '.8rem 2rem',
          fontSize: 'var(--p3)',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease)`,
          boxShadow: '0 4px 16px rgba(255,107,53,.35)',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => { e.target.style.transform = 'scale(1.04)'; e.target.style.boxShadow = '0 8px 28px rgba(255,107,53,.5)' }}
          onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 16px rgba(255,107,53,.35)' }}
        >
          Commencer →
        </button>
      </div>
    </nav>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay = 0 }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{
      transitionDelay: `${delay}s`,
      background: '#fff',
      borderRadius: 'var(--br)',
      padding: '3.2rem 2.8rem',
      border: '1.5px solid var(--border-soft)',
      boxShadow: '0 4px 24px rgba(0,0,0,.04)',
      transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease), opacity var(--t-panel) var(--ease)`,
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,.10)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,.04)'
      }}
    >
      <div style={{
        width: '5.2rem', height: '5.2rem', borderRadius: '1.6rem',
        background: `${color}18`,
        border: `1.5px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.4rem', marginBottom: '2rem',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 'max(1.6rem, 16px)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: '.8rem', lineHeight: 1.25 }}>
        {title}
      </div>
      <div style={{ fontSize: 'var(--p3)', color: 'var(--text-muted)', lineHeight: 1.75 }}>
        {desc}
      </div>
    </div>
  )
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────
function TestiCard({ name, tag, text, delay = 0 }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{
      transitionDelay: `${delay}s`,
      background: '#fff',
      borderRadius: 'var(--br)',
      padding: '3.2rem',
      border: '1.5px solid var(--border-soft)',
      boxShadow: '0 4px 24px rgba(0,0,0,.04)',
      transition: `transform var(--t-micro) var(--ease), opacity var(--t-panel) var(--ease)`,
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.6rem' }}>
        {'★★★★★'.split('').map((s, i) => (
          <span key={i} style={{ color: '#fbbf24', fontSize: '1.4rem' }}>{s}</span>
        ))}
      </div>
      <p style={{ fontSize: 'var(--p3)', color: '#4a3c35', lineHeight: 1.75, fontStyle: 'italic', marginBottom: '2rem' }}>
        {text}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{
          width: '4rem', height: '4rem', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {name.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 'max(1.3rem, 13px)', fontWeight: 700, color: 'var(--text-strong)' }}>{name}</div>
          <div style={{ fontSize: 'max(1.1rem, 11px)', color: 'var(--accent)', fontWeight: 600 }}>{tag}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHead({ tag, title, sub }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{ textAlign: 'center', marginBottom: '5.6rem' }}>
      <div style={{
        display: 'inline-block',
        fontSize: 'max(1.1rem, 11px)',
        fontWeight: 700,
        color: 'var(--accent-green)',
        textTransform: 'uppercase',
        letterSpacing: '.25em',
        marginBottom: '1.6rem',
        padding: '.6rem 1.6rem',
        background: '#0F42230F',
        borderRadius: 'var(--br)',
        border: '1px solid #0F422320',
      }}>
        {tag}
      </div>
      <h2 style={{
        fontSize: 'var(--h2)',
        fontWeight: 900,
        color: 'var(--text-strong)',
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
        marginBottom: sub ? '1.6rem' : 0,
      }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 'var(--p3)', color: 'var(--text-muted)', maxWidth: '56rem', margin: '0 auto', lineHeight: 1.75 }}>{sub}</p>}
    </div>
  )
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({ plan, onCommencer, delay = 0 }) {
  const ref = useIO()
  const p = plan
  return (
    <div ref={ref} className="IO" style={{
      transitionDelay: `${delay}s`,
      background: p.main ? 'linear-gradient(145deg, #fff, #FFF8F4)' : '#fff',
      borderRadius: 'var(--br)',
      padding: '3.6rem 3.2rem',
      border: p.main ? '2px solid rgba(255,107,53,.35)' : '1.5px solid var(--border-soft)',
      boxShadow: p.main ? '0 2.4rem 6.4rem rgba(255,107,53,.18), 0 .8rem 2.4rem rgba(0,0,0,.06)' : '0 .8rem 2.8rem rgba(0,0,0,.05)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      transition: `transform var(--t-micro) var(--ease), opacity var(--t-panel) var(--ease)`,
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {p.main && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '.4rem', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: '4rem 4rem 0 0' }} />}
      {p.badge && (
        <div style={{ alignSelf: 'flex-start', marginBottom: '1.6rem', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', padding: '.5rem 1.4rem', borderRadius: 'var(--br)', fontSize: 'max(1.1rem, 11px)', fontWeight: 700, boxShadow: '0 .4rem 1.2rem rgba(255,107,53,.35)' }}>
          {p.badge}
        </div>
      )}
      <div style={{ fontSize: 'max(1.3rem, 13px)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: p.main ? 'var(--accent)' : 'var(--text-muted)', marginBottom: '.8rem' }}>
        {p.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem', marginBottom: '2.4rem' }}>
        <span style={{ fontSize: 'max(4.4rem, 36px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-strong)' }}>{p.price}</span>
        <span style={{ fontSize: 'var(--p3)', color: 'var(--text-muted)', fontWeight: 500 }}>{p.period}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3.2rem', flex: 1 }}>
        {p.features.map((f, j) => (
          <div key={j} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '.6rem', flexShrink: 0, background: p.main ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : '#f0e8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: p.main ? '0 .3rem .8rem rgba(255,107,53,.35)' : 'none' }}>
              <span style={{ fontSize: '1rem', color: p.main ? '#fff' : 'var(--text-muted)', fontWeight: 800 }}>✓</span>
            </div>
            <span style={{ fontSize: 'var(--p3)', color: p.main ? 'var(--text-strong)' : 'var(--text-muted)', fontWeight: p.main ? 500 : 400 }}>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={onCommencer} style={{
        width: '100%', padding: '1.4rem',
        borderRadius: 'var(--br)', border: 'none',
        fontSize: 'var(--p3)', fontWeight: 800,
        cursor: 'pointer', fontFamily: 'var(--font)',
        background: p.main ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'rgba(0,0,0,.05)',
        color: p.main ? '#fff' : 'var(--text-muted)',
        boxShadow: p.main ? '0 .8rem 2.4rem rgba(255,107,53,.4)' : 'none',
        transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease)`,
      }}
        onMouseEnter={e => { if (p.main) { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 1.2rem 3.2rem rgba(255,107,53,.5)' } }}
        onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = p.main ? '0 .8rem 2.4rem rgba(255,107,53,.4)' : 'none' }}
      >
        {p.cta}
      </button>
    </div>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CtaSection({ onCommencer }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO shine-border" style={{
      maxWidth: '60rem', margin: '0 auto',
      background: 'linear-gradient(145deg, rgba(255,107,53,.08), rgba(255,154,60,.05))',
      border: '1.5px solid rgba(255,107,53,.18)',
      borderRadius: 'var(--br)',
      padding: '5.6rem 4rem',
      textAlign: 'center',
      boxShadow: '0 2.4rem 6.4rem rgba(255,107,53,.1)',
    }}>
      <div style={{ fontSize: '4.2rem', marginBottom: '1.6rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>S</div>
      <h2 style={{ fontSize: 'var(--h2)', fontWeight: 900, color: 'var(--text-strong)', marginBottom: '1.4rem', letterSpacing: '-0.03em' }}>
        Prêt à transformer ton quotidien ?
      </h2>
      <p style={{ fontSize: 'var(--p3)', color: 'var(--text-muted)', marginBottom: '3.2rem', lineHeight: 1.75 }}>
        Rejoins Solenn maintenant et reçois des conseils personnalisés dès aujourd'hui.<br />
        5 messages gratuits chaque jour, sans carte bancaire.
      </p>
      <button onClick={onCommencer} style={{
        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        color: '#fff', border: 'none',
        borderRadius: 'var(--br)', padding: '1.8rem 4.4rem',
        fontSize: 'max(1.6rem, 16px)', fontWeight: 800,
        cursor: 'pointer', fontFamily: 'var(--font)',
        boxShadow: '0 1rem 3.6rem rgba(255,107,53,.4)',
        width: '100%', maxWidth: '36rem',
        transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease)`,
      }}
        onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; e.target.style.boxShadow = '0 1.6rem 4.8rem rgba(255,107,53,.55)' }}
        onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 1rem 3.6rem rgba(255,107,53,.4)' }}
      >
        Créer mon compte gratuitement →
      </button>
      <div style={{ marginTop: '1.4rem', fontSize: 'max(1.2rem, 12px)', color: 'var(--text-muted)' }}>
        Puis 4,99€/mois pour les conseils illimités
      </div>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🧠', color: '#FF6B35', title: 'Coach IA personnalisé', desc: 'Solenn mémorise ton profil complet — pathologies, objectifs, régimes — pour des conseils qui te ressemblent vraiment.' },
  { icon: '🥗', color: '#34c759', title: 'Nutrition sur-mesure', desc: 'Idées repas adaptées à tes restrictions, tes carences et ton mode de vie. Jamais génériques, toujours personnalisés.' },
  { icon: '📅', color: '#5856d6', title: 'Routine quotidienne', desc: 'Un programme matin-midi-soir généré chaque jour selon ton heure de réveil, ton énergie et tes objectifs.' },
  { icon: '💚', color: '#ff3b30', title: 'Suivi santé IA', desc: 'Pas, sommeil, hydratation, humeur — un score journalier et des insights IA pour progresser chaque semaine.' },
  { icon: '👗', color: '#af52de', title: 'Style & météo', desc: "Tenues suggérées selon la météo réelle de ta ville, ton style et l'occasion. Jamais à court d'idées." },
  { icon: '🌿', color: '#0F4223', title: 'Médecine naturelle', desc: 'Plantes, tisanes, techniques holistiques — des recommandations ciblées basées sur ton profil santé exact.' },
]

const TESTIMONIALS = [
  { name: 'Sophie M.', tag: 'Perte de poids', text: "J'ai perdu 8 kg en 3 mois grâce aux conseils nutrition. Solenn comprend vraiment mes contraintes halal et ma carence en fer." },
  { name: 'Thomas L.', tag: 'Productivité', text: 'La routine du matin générée par Solenn a transformé mes journées. Je dors mieux, je me concentre bien mieux.' },
  { name: 'Amira K.', tag: 'SOPK & bien-être', text: "Les recommandations de plantes pour mon SOPK sont d'une précision incroyable. Enfin un coach qui prend mes pathologies au sérieux." },
]

const PLANS = [
  {
    name: 'Gratuit', price: '0€', period: '', main: false,
    features: ['5 messages IA / jour', 'Suivi santé basique', 'Quiz de profil adaptatif', 'Accès forum communauté'],
    cta: 'Commencer gratuitement',
  },
  {
    name: 'Pro', price: '4,99€', period: '/mois', main: true,
    badge: 'Le plus populaire',
    features: ['Messages IA illimités 24/7', 'Routine quotidienne personnalisée', 'Analyse herbal IA complète', 'Suggestions tenues + météo', 'Insights santé avancés', 'Historique 30 jours + graphiques', 'Support prioritaire'],
    cta: 'Essayer Solenn Pro →',
  },
]

const ROTATING = ['Nutrition', 'Sommeil', 'Stress', 'Énergie', 'Bien-être']

// ─── LANDING ─────────────────────────────────────────────────────────────────
export default function Landing({ onCommencer, onForum }) {
  const [rotIdx, setRotIdx] = useState(0)
  const [rotFade, setRotFade] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setRotFade(false)
      setTimeout(() => { setRotIdx(i => (i + 1) % ROTATING.length); setRotFade(true) }, 300)
    }, 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font)', color: 'var(--text-body)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes floatOrb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-28px)} }
        @keyframes heroIn { from{opacity:0;transform:translateY(4rem)} to{opacity:1;transform:translateY(0)} }
        .hero-anim   { animation: heroIn .9s var(--ease) both; }
        .hero-anim-2 { animation: heroIn .9s .15s var(--ease) both; }
        .hero-anim-3 { animation: heroIn .9s .30s var(--ease) both; }
        .hero-anim-4 { animation: heroIn .9s .45s var(--ease) both; }
      `}</style>

      <Nav onCommencer={onCommencer} onForum={onForum} />

      {/* Orbes déco */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: '60rem', height: '60rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,.08) 0%, transparent 65%)', animation: 'floatOrb 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-8%', right: '-6%', width: '72rem', height: '72rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,66,35,.07) 0%, transparent 65%)', animation: 'floatOrb 16s ease-in-out infinite reverse' }} />
      </div>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '90rem', margin: '0 auto', padding: 'calc(var(--nav-top) * 2 + 8rem) var(--padgrid) 8rem', textAlign: 'center' }}>
        <div className="hero-anim" style={{
          display: 'inline-flex', alignItems: 'center', gap: '.8rem',
          background: '#0F42230F', border: '1px solid #0F422320',
          borderRadius: 'var(--br)', padding: '.7rem 1.8rem',
          fontSize: 'var(--p3)', color: 'var(--accent-green)', fontWeight: 600,
          marginBottom: '3.2rem',
        }}>
          <span style={{ width: '.7rem', height: '.7rem', borderRadius: '50%', background: '#0F4223', display: 'inline-block', boxShadow: '0 0 .8rem rgba(15,66,35,.6)' }} />
          Coach de vie IA · re·vivre · évoluer
        </div>

        <h1 className="hero-anim-2" style={{
          fontSize: 'var(--h1)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          color: 'var(--text-strong)',
          marginBottom: '2.4rem',
        }}>
          Ton expert personnel en<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 20%, var(--accent-2) 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: rotFade ? 1 : 0,
            transform: rotFade ? 'none' : 'translateY(-.8rem)',
            display: 'inline-block',
            transition: `opacity .3s var(--ease), transform .3s var(--ease)`,
          }}>
            {ROTATING[rotIdx]}
          </span>
        </h1>

        <p className="hero-anim-3" style={{
          fontSize: 'var(--p1)',
          color: 'var(--text-muted)',
          lineHeight: 1.75,
          maxWidth: '64rem',
          margin: '0 auto 4rem',
        }}>
          Solenn analyse ton profil complet, tes objectifs et ton rythme de vie
          pour t'accompagner chaque jour avec des conseils vraiment personnalisés.
        </p>

        <div className="hero-anim-4" style={{ display: 'flex', gap: '1.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '6.4rem' }}>
          <button onClick={onCommencer} style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#fff', border: 'none',
            borderRadius: 'var(--br)', padding: '1.8rem 4.4rem',
            fontSize: 'max(1.6rem, 16px)', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 1rem 3.6rem rgba(255,107,53,.4)',
            transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease)`,
          }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; e.target.style.boxShadow = '0 1.6rem 4.8rem rgba(255,107,53,.55)' }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 1rem 3.6rem rgba(255,107,53,.4)' }}
          >
            Créer mon profil gratuitement →
          </button>
          <button onClick={onForum} style={{
            background: 'transparent', color: 'var(--text-strong)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--br)', padding: '1.8rem 4.4rem',
            fontSize: 'max(1.6rem, 16px)', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font)',
            transition: `border-color var(--t-micro) var(--ease), background var(--t-micro) var(--ease)`,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(255,107,53,.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
          >
            💬 Forum communauté
          </button>
        </div>

        {/* Stats */}
        <div className="hero-anim-4" style={{
          display: 'flex', justifyContent: 'center',
          borderTop: '1px solid var(--border-soft)', paddingTop: '4rem', gap: 0,
        }}>
          {[['6', 'Domaines couverts'], ['∞', 'Conseils sur-mesure'], ['24/7', 'Disponible'], ['100%', 'Personnalisé']].map(([v, l], i) => (
            <div key={l} style={{
              flex: 1, maxWidth: '16rem', textAlign: 'center', padding: '0 1.6rem',
              borderRight: i < 3 ? '1px solid var(--border-soft)' : 'none',
            }}>
              <div style={{
                fontSize: 'max(2.6rem, 24px)', fontWeight: 900, letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: '.4rem',
              }}>{v}</div>
              <div style={{ fontSize: 'max(1.1rem, 11px)', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, maxWidth: '128rem', margin: '0 auto', padding: '8rem var(--padgrid)' }}>
        <SectionHead
          tag="Fonctionnalités"
          title={<>Tout ce dont tu as besoin,<br /><span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>dans une seule app</span></>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', gap: '2rem' }}>
          {FEATURES.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.07} />)}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: 'relative', zIndex: 1, background: 'rgba(15,66,35,.03)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: '128rem', margin: '0 auto', padding: '8rem var(--padgrid)' }}>
          <SectionHead
            tag="Témoignages"
            title={<>Ils ont transformé<br /><span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>leur quotidien</span></>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', gap: '2rem' }}>
            {TESTIMONIALS.map((t, i) => <TestiCard key={i} {...t} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, maxWidth: '80rem', margin: '0 auto', padding: '8rem var(--padgrid)' }}>
        <SectionHead tag="Tarifs" title="Simple et transparent" sub="Commence gratuitement, passe Pro quand tu veux." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', gap: '2.4rem' }}>
          {PLANS.map((plan, i) => (
            <PricingCard key={i} plan={plan} onCommencer={onCommencer} delay={i * 0.12} />
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 var(--padgrid) 8rem' }}>
        <CtaSection onCommencer={onCommencer} />
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--text-strong)', padding: '4.8rem var(--padgrid) 4rem', textAlign: 'center' }}>
        <div style={{ fontSize: 'max(2.2rem, 22px)', fontWeight: 900, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '.6rem' }}>
          Solenn
        </div>
        <div style={{ fontSize: 'max(1.2rem, 12px)', color: 'rgba(255,255,255,.35)', marginBottom: '1.6rem' }}>
          re·vivre · évoluer
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.6rem', alignItems: 'center', marginBottom: '1.6rem' }}>
          {['Confidentialité', 'CGU', 'Contact', 'Forum'].map((l, i) => (
            <React.Fragment key={l}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,.1)' }}>·</span>}
              <span
                style={{ fontSize: 'max(1.2rem, 12px)', color: 'rgba(255,255,255,.35)', cursor: 'pointer', transition: `color var(--t-micro) var(--ease)` }}
                onClick={l === 'Forum' ? onForum : undefined}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,.7)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.35)'}
              >
                {l}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div style={{ fontSize: 'max(1.1rem, 11px)', color: 'rgba(255,255,255,.18)' }}>
          © 2026 Solenn · meet-solenn.com · Tous droits réservés
        </div>
      </footer>
    </div>
  )
}
