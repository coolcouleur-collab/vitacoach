import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FlashIcon, LoadingIcon } from './Icons'
import LiquidImage from './LiquidImage'
import GlobeBg from './GlobeBg'

const supabase = createClient(
  'https://ejbfexxhrxcvmolpwuvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmZleHhocnhjdm1vbHB3dXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDUwODMsImV4cCI6MjA5MDUyMTA4M30.kNdebBhFovcKqdCqpmfHkNmzsV9a5Vw9QWpgzwOlXOk'
)

export default function Auth({ onConnecte, onBack }) {
  const [mode, setMode]         = useState('connexion')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')

  async function soumettre() {
    if (!email || !password) return setMessage('Remplis tous les champs !')
    if (password.length < 6) return setMessage('Mot de passe minimum 6 caractères.')
    setLoading(true); setMessage('')
    if (mode === 'inscription') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else { setMessage('✓ Compte créé ! Connecte-toi.'); setMode('connexion') }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else onConnecte(data.user)
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes authFadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes authGlow {
          0%,100% { box-shadow: 0 4px 16px rgba(200,123,82,0.25); transform: scale(1) rotate(0deg); }
          25%      { box-shadow: 0 6px 28px rgba(200,123,82,0.55); transform: scale(1.08) rotate(-4deg); }
          75%      { box-shadow: 0 6px 28px rgba(200,123,82,0.55); transform: scale(1.08) rotate(4deg); }
        }
        @keyframes authShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes authTagline {
          from { opacity:0; letter-spacing:0.25em; }
          to   { opacity:1; letter-spacing:0.04em; }
        }
        @keyframes arrowNudge {
          0%, 100% { transform: translateX(0); }
          60%      { transform: translateX(5px); }
        }
        .btn-arrow { animation: arrowNudge 1.8s ease-in-out infinite; }
        @keyframes floatOrb {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(30px,-20px) scale(1.04); }
          66%     { transform: translate(-20px,15px) scale(0.97); }
        }
        input::placeholder { color: rgba(255,248,235,0.82); }
      `}</style>
      <div style={s.liquidWrap}>
        <LiquidImage
          gradient={['#EDD8CC', '#CCA898', '#E8CABB', '#C4A090']}
          intensity={0.5}
          speed={0.4}
          style={{ width: '100%', height: '100%', opacity: 0.07 }}
        />
      </div>
      <div style={s.blob1} /><div style={s.blob2} /><div style={s.blob3} />
      <GlobeBg size={1.2} opacity={0.12} variant="gold" style={{ zIndex: 1 }} />
      {onBack && (
        <button onClick={onBack} style={s.backBtn}>←</button>
      )}
      <div style={s.card}>
        <div style={{...s.logoWrap, marginBottom: 16}}>
          <svg
            viewBox="0 0 320 72"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: 'clamp(200px, 65%, 270px)',
              height: 'auto',
              overflow: 'visible',
              animation: 'authFadeUp 0.6s 0.15s ease both',
            }}
          >
            <defs>
              <linearGradient id="authSolennGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <animate attributeName="x1" values="-150%;0%;-150%" dur="4s" repeatCount="indefinite" />
                <animate attributeName="x2" values="-50%;100%;-50%" dur="4s" repeatCount="indefinite" />
                <stop offset="0%"   stopColor="#FFF0D8" stopOpacity="0.90" />
                <stop offset="30%"  stopColor="#FFF8EC" stopOpacity="0.95" />
                <stop offset="50%"  stopColor="#FFFFFF" stopOpacity="1.00" />
                <stop offset="70%"  stopColor="#FFF8EC" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFF0D8" stopOpacity="0.90" />
              </linearGradient>
            </defs>
            <text
              x="50%" y="54"
              textAnchor="middle"
              fill="url(#authSolennGrad)"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fontSize="66"
              fontWeight="400"
              fontStyle="italic"
              letterSpacing="-1"
            >
              Solenn
            </text>
          </svg>
        </div>

        <div style={s.tabs}>
          {['connexion','inscription'].map(m => (
            <button key={m} style={mode===m ? s.tabActive : s.tab} onClick={() => setMode(m)}>
              {m === 'connexion' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="@" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key==='Enter' && soumettre()} />
        </div>

        <div style={{...s.field, position:'relative'}}>
          <label style={s.label}>Mot de passe</label>
          <div style={{position:'relative'}}>
            <svg style={{position:'absolute', left:4, top:'50%', transform:'translateY(-50%)',
              opacity:0.82, pointerEvents:'none', color:'rgba(255,248,235,1)'}}
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input style={{...s.input, paddingLeft:24}} type="password" placeholder=""
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key==='Enter' && soumettre()} />
          </div>
        </div>

        {message && (
          <div style={{ ...s.msg,
            background: message.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
            color: message.startsWith('✓') ? '#16a34a' : '#dc2626',
            border: `1px solid ${message.startsWith('✓') ? '#bbf7d0' : '#fecaca'}` }}>
            {message}
          </div>
        )}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          onClick={soumettre} disabled={loading}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(212,149,106,0.50)'
            e.currentTarget.style.background = 'rgba(200,123,82,0.05)'
            const arrow = e.currentTarget.querySelector('.btn-arrow')
            if (arrow) { arrow.style.animation = 'none'; arrow.style.transform = 'translateX(6px)' }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,245,225,0.75)'
            e.currentTarget.style.background = 'transparent'
            const arrow = e.currentTarget.querySelector('.btn-arrow')
            if (arrow) { arrow.style.animation = ''; arrow.style.transform = '' }
          }}>
          <span style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
            {loading
              ? <><LoadingIcon size={16} color="#C87B52" /> Chargement...</>
              : mode==='connexion'
                ? <>Retrouver Solenn <span className="btn-arrow" style={{display:'inline-block', transition:'transform 0.25s ease'}}>→</span></>
                : <>Rejoindre Solenn <span className="btn-arrow" style={{display:'inline-block', transition:'transform 0.25s ease'}}>→</span></>}
          </span>
        </button>

        {mode === 'inscription' && (
          <div style={s.footer}>
            En rejoignant Solenn, tu acceptes nos<br />
            <span style={{ color:'rgba(255,228,195,0.75)', fontWeight:600 }}>conditions d'utilisation</span>.
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'linear-gradient(160deg, #FFF6E8 0%, #F5DDB0 50%, #FFF6E8 100%)', display:'flex', alignItems:'center',
    justifyContent:'center', fontFamily:'Poppins, sans-serif', padding:20,
    position:'relative', overflow:'hidden' },
  blob1: { position:'absolute', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(218,138,52,0.50) 0%,rgba(200,100,40,0.22) 45%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 10s ease-in-out infinite' },
  blob2: { position:'absolute', bottom:'-10%', right:'-8%', width:600, height:600, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(200,123,82,0.38) 0%,rgba(180,90,30,0.16) 45%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 13s ease-in-out infinite reverse' },
  liquidWrap: { position:'absolute', inset:0, zIndex:0, pointerEvents:'none' },
  blob3: { position:'absolute', top:'30%', left:'25%', width:700, height:700, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(190,105,35,0.22) 0%,rgba(160,80,20,0.10) 40%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 17s ease-in-out infinite' },
  card: { position:'relative', zIndex:3, width:'100%', maxWidth:380,
    background:'rgba(255,235,210,0.25)',
    borderRadius: 20,
    padding:'20px 16px',
    backdropFilter:'blur(18px)',
    WebkitBackdropFilter:'blur(18px)',
    border:'1px solid rgba(255,220,160,0.30)',
    animation:'slideUp 0.45s ease' },
  logoWrap: { display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6 },
  tagline: { textAlign:'center', fontSize:13, color:'rgba(255,248,235,0.42)', marginBottom:36 },
  tabs: { display:'flex', marginBottom:32, background:'transparent', padding:'0', gap:0,
    borderBottom:'1px solid rgba(255,220,160,0.20)' },
  tab: { flex:1, padding:'12px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:14, fontFamily:'Poppins, sans-serif', color:'rgba(255,248,235,0.55)', fontWeight:400,
    borderBottom:'2px solid transparent', marginBottom:'-1px' },
  tabActive: { flex:1, padding:'12px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:14, fontFamily:'Poppins, sans-serif', color:'rgba(255,248,235,1)', fontWeight:600,
    borderBottom:'2px solid rgba(255,220,160,0.60)', marginBottom:'-1px' },
  field: { marginBottom:16 },
  label: { display:'block', marginBottom:6, fontWeight:500, fontSize:12,
    color:'rgba(255,248,235,0.82)', letterSpacing:'1.2px', textTransform:'uppercase' },
  input: { width:'100%', padding:'12px 14px', border:'1px solid rgba(255,220,160,0.30)',
    borderRadius:10, background:'rgba(255,235,200,0.10)', fontSize:15, fontFamily:'Poppins, sans-serif',
    boxSizing:'border-box', outline:'none', color:'rgba(255,248,235,1)', transition:'border-color 0.2s, background 0.2s' },
  msg: { padding:'11px 16px', borderRadius:12, fontSize:13, marginBottom:14 },
  btn: { width:'auto', padding:'0.85rem 2.5rem', background:'rgba(200,100,40,0.06)', display:'block', margin:'12px auto 0',
    color:'rgba(255,248,235,1)', border:'1px solid rgba(255,220,160,0.30)', borderRadius:'2rem',
    fontSize:'clamp(1.3rem, 1.2vw, 1.6rem)', fontWeight:500, fontStyle:'italic',
    cursor:'pointer', fontFamily:"'Cormorant Garamond', Georgia, serif",
    letterSpacing:'0.10em', marginTop:0,
    transition:'background 0.25s, border-color 0.25s' },
  reassurance: { marginTop:10, textAlign:'center', fontSize:11, color:'rgba(255,248,235,0.35)', letterSpacing:'0.02em' },
  footer: { marginTop:20, textAlign:'center', fontSize:14, color:'rgba(255,248,235,0.78)', lineHeight:1.6 },
  backBtn: {
    position:'fixed', top:24, left:24, zIndex:10,
    background:'rgba(200,100,40,0.06)', border:'1px solid rgba(255,220,160,0.30)', cursor:'pointer',
    color:'rgba(255,248,235,1)', fontSize:22, fontWeight:500,
    fontFamily:"'Cormorant Garamond', Georgia, serif", fontStyle:'italic', padding:'0.55rem 1.8rem',
    borderRadius:'2rem', transition:'background 0.25s, border-color 0.25s',
  },
}

