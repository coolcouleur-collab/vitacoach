import React, { useState, useEffect, useRef } from 'react'
import './tokens.css'

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
  const [contactOpen, setContactOpen] = useState(false)
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

  useEffect(() => {
    if (!contactOpen) return
    const close = (e) => {
      if (!e.target.closest('.nav-pill') && !e.target.closest('.nav-contact-panel')) {
        setContactOpen(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [contactOpen])

  return (
    <>
      <nav className="nav-pill" style={{
        position: 'fixed',
        top: '3.2rem',
        left: '50%',
        transform: `translate(-50%, ${hidden ? '-130%' : '0'})`,
        zIndex: 55,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1.2rem',
        transition: `transform var(--t-panel) var(--ease)`,
      }}>
        {/* Pilule menu */}
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <div style={{
            borderRadius: 'var(--br)',
            padding: '1.2rem 2.2rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '2.4rem',
          }}>
            {/* Logo */}
            <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={navLinkStyle}>
              <span style={{ fontWeight: 900, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 'max(1.5rem,15px)' }}>Solenn</span>
            </a>

            <div style={{ width: 1, height: '1.6rem', background: 'rgba(255,255,255,.18)' }} />

            {[['Fonctionnalités', '#features'], ['Tarifs', '#pricing'], ['Forum', null]].map(([l, h]) => (
              <a key={l}
                href={h || '#'}
                onClick={l === 'Forum' ? (e) => { e.preventDefault(); onForum() } : undefined}
                style={navLinkStyle}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,1)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.7)'}
              >
                {l}
              </a>
            ))}

            <div style={{ width: 1, height: '1.6rem', background: 'rgba(255,255,255,.18)' }} />

            <button onClick={onCommencer} style={{
              background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
              color: '#fff', border: 'none', borderRadius: 'var(--br)',
              padding: '.7rem 2rem', fontSize: 'max(1.4rem,14px)', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font)',
              boxShadow: '0 .4rem 1.6rem rgba(139,92,246,.38)',
              transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease)`,
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 .8rem 2.8rem rgba(139,92,246,.5)' }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 .4rem 1.6rem rgba(139,92,246,.38)' }}
            >
              Commencer →
            </button>
          </div>
          {/* Shine border */}
          <div style={shineBorder} />
        </div>
      </nav>
    </>
  )
}

const navLinkStyle = {
  color: 'rgba(255,255,255,.7)',
  fontSize: 'max(1.4rem,14px)',
  textDecoration: 'none',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'color .35s cubic-bezier(.55,0,.1,1)',
  background: 'none', border: 'none', fontFamily: 'var(--font)',
}

const shineBorder = {
  content: '""',
  position: 'absolute', inset: 0,
  borderRadius: 'var(--br)',
  border: '2px solid transparent',
  background: `linear-gradient(156deg,
    rgba(255,255,255,.4) 2%,
    rgba(255,255,255,0) 39%,
    rgba(255,255,255,0) 54%,
    rgba(255,255,255,.1) 93%
  ) border-box`,
  WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
  WebkitMaskComposite: 'destination-out',
  maskComposite: 'exclude',
  pointerEvents: 'none',
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
      placeItems: 'center',
      padding: '14rem var(--padgrid) 6rem',
      position: 'relative',
      zIndex: 1,
      textAlign: 'center',
    }}>
      {/* Orbes déco */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-10%', width: '60rem', height: '60rem', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 65%)', animation: 'floatOrb 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '-8%', width: '80rem', height: '80rem', borderRadius: '50%', background: 'radial-gradient(circle,rgba(15,66,35,.06) 0%,transparent 65%)', animation: 'floatOrb 18s ease-in-out infinite reverse' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '90rem' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '.8rem',
          background: 'rgba(15,66,35,.07)', border: '1px solid rgba(15,66,35,.15)',
          borderRadius: 'var(--br)', padding: '.7rem 1.8rem',
          fontSize: 'var(--p3)', color: 'var(--accent-green)', fontWeight: 600,
          marginBottom: '3.6rem',
          animation: 'heroIn .8s var(--ease) both',
        }}>
          <span style={{ width: '.7rem', height: '.7rem', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 .8rem rgba(15,66,35,.5)', display: 'inline-block' }} />
          Coach de vie IA · re·vivre · évoluer
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: 'var(--h1)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.02,
          color: 'var(--text-strong)',
          marginBottom: '2.8rem',
          animation: 'heroIn .8s .12s var(--ease) both',
        }}>
          Ton expert personnel<br />en{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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
          fontSize: 'var(--p1)',
          color: 'var(--text-muted)',
          maxWidth: '62rem',
          margin: '0 auto 4.8rem',
          lineHeight: 1.6,
          animation: 'heroIn .8s .24s var(--ease) both',
        }}>
          Solenn analyse ton profil en profondeur pour t'accompagner chaque jour
          avec des conseils santé, nutrition et bien-être vraiment personnalisés.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: '1.6rem', justifyContent: 'center', flexWrap: 'wrap',
          animation: 'heroIn .8s .36s var(--ease) both',
          marginBottom: '7.2rem',
        }}>
          <button onClick={onCommencer} style={{
            background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
            color: '#fff', border: 'none', borderRadius: 'var(--br)',
            padding: '1.8rem 4.8rem',
            fontSize: 'max(1.6rem,16px)', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 1.2rem 4rem rgba(139,92,246,.42)',
            transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease)`,
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-3px) scale(1.02)'; e.target.style.boxShadow = '0 1.8rem 5.2rem rgba(139,92,246,.56)' }}
            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 1.2rem 4rem rgba(139,92,246,.42)' }}
          >
            Créer mon profil gratuitement →
          </button>
          <button style={{
            background: 'transparent',
            color: 'var(--text-strong)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--br)',
            padding: '1.8rem 4.8rem',
            fontSize: 'max(1.6rem,16px)', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font)',
            transition: `border-color var(--t-micro) var(--ease), background var(--t-micro) var(--ease)`,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(139,92,246,.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Voir les fonctionnalités ↓
          </button>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          borderTop: '1px solid var(--border-soft)',
          paddingTop: '4rem',
          animation: 'heroIn .8s .48s var(--ease) both',
        }}>
          {[['6','Domaines couverts'],['∞','Conseils sur-mesure'],['24/7','Disponible'],['100%','Personnalisé']].map(([v, l], i, arr) => (
            <div key={l} style={{
              flex: 1, maxWidth: '18rem', textAlign: 'center', padding: '0 2rem',
              borderRight: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none',
            }}>
              <div style={{
                fontSize: 'max(2.8rem,24px)', fontWeight: 900, letterSpacing: '-0.04em',
                background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: '.4rem',
              }}>{v}</div>
              <div style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--text-muted)', fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CKGRID (chaque feature = 100vh) ─────────────────────────────────────────
const FEATURES = [
  {
    num: '01', color: '#8b5cf6',
    tag: 'Intelligence adaptative',
    title: 'Un coach qui\nte comprend vraiment',
    desc: 'Solenn mémorise ton profil complet — pathologies, objectifs, régimes, allergies, rythme de vie — pour t\'offrir des conseils qui te ressemblent, pas des recommandations génériques copiées-collées.',
    detail: 'Profil · Pathologies · Objectifs · Habitudes',
    bg: 'linear-gradient(145deg, rgba(139,92,246,.05) 0%, rgba(255,154,60,.03) 100%)',
    emoji: '🧠',
  },
  {
    num: '02', color: '#34c759',
    tag: 'Nutrition personnalisée',
    title: 'Manger juste,\npour toi',
    desc: 'Idées repas adaptées à tes intolérances, tes carences identifiées, tes contraintes religieuses ou éthiques. Chaque suggestion est calculée pour ton corps, pas pour une moyenne statistique.',
    detail: 'Repas · Recettes · Compléments · Carences',
    bg: 'linear-gradient(145deg, rgba(52,199,89,.05) 0%, rgba(52,199,89,.02) 100%)',
    emoji: '🥗',
  },
  {
    num: '03', color: '#5856d6',
    tag: 'Routine quotidienne',
    title: 'Chaque journée,\nstructurée',
    desc: 'Un programme matin-midi-soir généré chaque jour selon ton heure de réveil, ton niveau d\'énergie et tes objectifs du moment. Avec des rappels qui respectent ton rythme naturel.',
    detail: 'Matin · Après-midi · Soir · Rappels',
    bg: 'linear-gradient(145deg, rgba(88,86,214,.05) 0%, rgba(88,86,214,.02) 100%)',
    emoji: '📅',
  },
  {
    num: '04', color: '#ff3b30',
    tag: 'Suivi santé intelligent',
    title: 'Visualise ta\nprogression',
    desc: 'Pas, sommeil, hydratation, humeur, poids — un score journalier calculé par l\'IA et des graphiques 30 jours pour voir tes progrès réels et identifier ce qui impacte le plus ta forme.',
    detail: 'Score · Métriques · Graphiques · Insights',
    bg: 'linear-gradient(145deg, rgba(255,59,48,.05) 0%, rgba(255,59,48,.02) 100%)',
    emoji: '💚',
  },
  {
    num: '05', color: '#0F4223',
    tag: 'Médecine naturelle',
    title: 'Les plantes comme\nalliées',
    desc: 'Recommandations de plantes, tisanes et remèdes naturels basées sur ton profil de santé exact. Adaptogènes, phytothérapie, aromathérapie — ciblés, pas génériques.',
    detail: 'Plantes · Tisanes · Huiles · Adaptogènes',
    bg: 'linear-gradient(145deg, rgba(15,66,35,.05) 0%, rgba(15,66,35,.02) 100%)',
    emoji: '🌿',
  },
  {
    num: '06', color: '#af52de',
    tag: 'Style & météo',
    title: 'T\'habiller juste,\nchaque jour',
    desc: 'Tenues générées selon la météo réelle de ta ville, ton style déclaré et l\'occasion. L\'IA propose des combinaisons issues de ta garde-robe, jamais hors de ta réalité.',
    detail: 'Météo · Style · Occasions · Looks',
    bg: 'linear-gradient(145deg, rgba(175,82,222,.05) 0%, rgba(175,82,222,.02) 100%)',
    emoji: '👗',
  },
]

function GridCell({ feature, onCommencer }) {
  const ref = useIO(0.2)
  const [hovered, setHovered] = useState(false)

  return (
    <article ref={ref} className="IO" style={{
      minHeight: '100vh',
      display: 'grid',
      alignItems: 'center',
      padding: '8rem var(--padgrid)',
      background: feature.bg,
      borderTop: '1px solid var(--border-soft)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gros numéro déco */}
      <div style={{
        position: 'absolute',
        right: 'var(--padgrid)',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 'clamp(12rem, 18vw, 22rem)',
        fontWeight: 900,
        color: feature.color,
        opacity: .04,
        letterSpacing: '-0.06em',
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>{feature.num}</div>

      <div style={{ maxWidth: '72rem', position: 'relative', zIndex: 1 }}>
        {/* Tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '.8rem',
          fontSize: 'max(1.1rem,11px)', fontWeight: 700,
          color: feature.color,
          textTransform: 'uppercase', letterSpacing: '.2em',
          marginBottom: '2.4rem',
        }}>
          <span style={{ width: '.6rem', height: '.6rem', borderRadius: '50%', background: feature.color, boxShadow: `0 0 .8rem ${feature.color}88` }} />
          {feature.tag}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 'var(--h2)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: 'var(--text-strong)',
          marginBottom: '2.8rem',
          whiteSpace: 'pre-line',
        }}>{feature.title}</h2>

        {/* Desc */}
        <p style={{
          fontSize: 'var(--p1)',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          maxWidth: '56rem',
          marginBottom: '3.2rem',
        }}>{feature.desc}</p>

        {/* Detail pills */}
        <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
          {feature.detail.split(' · ').map(d => (
            <span key={d} style={{
              padding: '.5rem 1.4rem',
              borderRadius: 'var(--br)',
              background: `${feature.color}10`,
              border: `1px solid ${feature.color}25`,
              fontSize: 'max(1.2rem,12px)',
              fontWeight: 600,
              color: feature.color,
            }}>{d}</span>
          ))}
        </div>

        {/* Emoji big */}
        <div style={{
          fontSize: 'clamp(6rem, 10vw, 10rem)',
          lineHeight: 1,
          filter: 'drop-shadow(0 .8rem 2.4rem rgba(0,0,0,.08))',
          transition: 'transform var(--t-panel) var(--ease)',
          display: 'inline-block',
          transform: hovered ? 'scale(1.12) rotate(-4deg)' : 'scale(1) rotate(0deg)',
          cursor: 'default',
        }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {feature.emoji}
        </div>
      </div>
    </article>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
const TESTIS = [
  { name: 'Sophie M.', tag: 'Perte de poids · -8 kg', text: "J'ai perdu 8 kg en 3 mois. Solenn comprend mes contraintes halal et ma carence en fer — les suggestions sont toujours adaptées à ma réalité.", stars: 5 },
  { name: 'Thomas L.', tag: 'Productivité · Sommeil', text: "La routine du matin m'a transformé. Je dors mieux, je suis plus concentré, et je n'ai plus besoin de réfléchir à comment organiser mes journées.", stars: 5 },
  { name: 'Amira K.', tag: 'SOPK · Bien-être', text: "Les recommandations de plantes pour mon SOPK sont d'une précision incroyable. Enfin un coach qui prend mes pathologies au sérieux, pas un chatbot générique.", stars: 5 },
]

function TestiCard({ t, delay }) {
  const ref = useIO()
  return (
    <div ref={ref} className="IO" style={{
      transitionDelay: `${delay}s`,
      background: '#fff',
      borderRadius: 'var(--br)',
      padding: '3.2rem',
      border: '1.5px solid var(--border-soft)',
      boxShadow: '0 .4rem 2.4rem rgba(0,0,0,.04)',
      transition: `transform var(--t-micro) var(--ease), box-shadow var(--t-micro) var(--ease), opacity var(--t-panel) var(--ease)`,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 1.6rem 4.8rem rgba(0,0,0,.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 .4rem 2.4rem rgba(0,0,0,.04)' }}
    >
      <div style={{ display: 'flex', gap: '.3rem', marginBottom: '1.6rem' }}>
        {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#fbbf24', fontSize: '1.6rem' }}>{s}</span>)}
      </div>
      <p style={{ fontSize: 'var(--p3)', color: 'var(--text-body)', lineHeight: 1.75, fontStyle: 'italic', marginBottom: '2.4rem' }}>
        "{t.text}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{
          width: '4rem', height: '4rem', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', fontWeight: 800, color: '#fff',
        }}>{t.name.charAt(0)}</div>
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
      background: p.main ? 'linear-gradient(145deg,#fff,#FFF8F4)' : '#fff',
      borderRadius: 'var(--br)',
      padding: '4rem 3.6rem',
      border: p.main ? '2px solid rgba(139,92,246,.3)' : '1.5px solid var(--border-soft)',
      boxShadow: p.main ? '0 2.4rem 6.4rem rgba(139,92,246,.16), 0 .8rem 2.4rem rgba(0,0,0,.05)' : '0 .4rem 2rem rgba(0,0,0,.04)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      transition: `transform var(--t-micro) var(--ease), opacity var(--t-panel) var(--ease)`,
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {p.main && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '.4rem', background: 'linear-gradient(90deg,var(--accent),var(--accent-2))' }} />}
      {p.badge && <div style={{ alignSelf: 'flex-start', marginBottom: '1.6rem', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: '#fff', padding: '.4rem 1.4rem', borderRadius: 'var(--br)', fontSize: 'max(1.1rem,11px)', fontWeight: 700 }}>{p.badge}</div>}
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
        boxShadow: p.main ? '0 .8rem 2.8rem rgba(139,92,246,.38)' : 'none',
        transition: `transform var(--t-micro) var(--ease)`,
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
      background: 'var(--text-strong)',
      borderRadius: 'var(--br)',
      padding: '6.4rem var(--padgrid)',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '80rem', height: '50rem', background: 'radial-gradient(circle, rgba(139,92,246,.18) 0%, transparent 65%)', pointerEvents: 'none' }} />

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
          boxShadow: '0 1.2rem 4rem rgba(139,92,246,.5)',
          transition: `transform var(--t-micro) var(--ease)`,
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

// ─── LANDING ─────────────────────────────────────────────────────────────────
export default function Landing({ onCommencer, onForum }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font)', color: 'var(--text-body)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

        @keyframes waiterPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: .85; }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3rem) scale(1.02); }
        }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(3.2rem); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Waiter done={loaded} />

      <Nav onCommencer={onCommencer} onForum={onForum} />

      {/* ── HERO ── */}
      <Hero onCommencer={onCommencer} />

      {/* ── CKGRID : 6 fonctionnalités ── */}
      <section id="features">
        {FEATURES.map((f, i) => (
          <GridCell key={i} feature={f} onCommencer={onCommencer} />
        ))}
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
            {[['Fonctionnalités','#features'],['Tarifs','#pricing'],['Forum', null],['Contact',null]].map(([l, h]) => (
              <a key={l}
                href={h || '#'}
                onClick={l === 'Forum' ? (e) => { e.preventDefault(); onForum() } : undefined}
                style={{ fontSize: 'max(1.3rem,13px)', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, transition: 'color var(--t-micro) var(--ease)' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-strong)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >{l}</a>
            ))}
          </div>
          <div style={{ fontSize: 'max(1.1rem,11px)', color: 'var(--border)', alignSelf: 'flex-end' }}>
            © 2026 Solenn · meet-solenn.com
          </div>
        </div>
      </footer>
    </div>
  )
}
