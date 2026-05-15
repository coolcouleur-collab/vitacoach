import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FlashIcon, LoadingIcon } from './Icons'
import SpiralBg from './SpiralBg'
import LiquidImage from './LiquidImage'

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
        input::placeholder { color: rgba(158,92,53,0.40); }
      `}</style>
      <SpiralBg />
      <div style={s.liquidWrap}>
        <LiquidImage
          gradient={['#EDD8CC', '#CCA898', '#E8CABB', '#C4A090']}
          intensity={0.5}
          speed={0.4}
          style={{ width: '100%', height: '100%', opacity: 0.22 }}
        />
      </div>
      <div style={s.blob1} /><div style={s.blob2} /><div style={s.blob3} />
      {onBack && (
        <button onClick={onBack} style={s.backBtn}>←</button>
      )}
      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={{ ...s.logoIcon, animation:'authGlow 3.2s ease-in-out infinite, authFadeUp 0.6s ease both' }}>S</div>
          <div style={{
            ...s.logoText,
            animation:'authFadeUp 0.6s 0.15s ease both',
          }}>Solenn</div>
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
              opacity:0.30, pointerEvents:'none', color:'rgba(158,92,53,1)'}}
              width="13" height="13" viewBox="0 0 24 24" fill="none"
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
            e.currentTarget.style.borderColor = 'transparent'
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
            Sans carte bancaire · En créant un compte tu acceptes nos{' '}
            <span style={{ color:'rgba(212,149,106,0.75)', fontWeight:600 }}>conditions d'utilisation</span>
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
  blob1: { position:'fixed', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(218,138,52,0.50) 0%,rgba(200,100,40,0.22) 45%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 10s ease-in-out infinite' },
  blob2: { position:'fixed', bottom:'-10%', right:'-8%', width:600, height:600, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(200,123,82,0.38) 0%,rgba(180,90,30,0.16) 45%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 13s ease-in-out infinite reverse' },
  liquidWrap: { position:'fixed', inset:0, zIndex:0, pointerEvents:'none' },
  blob3: { position:'fixed', top:'30%', left:'25%', width:700, height:700, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(190,105,35,0.22) 0%,rgba(160,80,20,0.10) 40%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 17s ease-in-out infinite' },
  card: { position:'relative', zIndex:1, width:'100%', maxWidth:380,
    background:'rgba(4,1,0,0.48)',
    borderRadius: 20,
    padding:'20px 16px',
    backdropFilter:'blur(10px)',
    WebkitBackdropFilter:'blur(10px)',
    animation:'slideUp 0.45s ease' },
  logoWrap: { display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:6 },
  logoIcon: { width:36, height:36, borderRadius:12,
    background:'linear-gradient(135deg,#DFA882,#C87B52)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'white' },
  logoText: { fontSize:26, fontWeight:900, letterSpacing:'-0.5px',
    color:'#D4956A',
    opacity: 0.52 },
  tagline: { textAlign:'center', fontSize:13, color:'rgba(158,92,53,0.55)', marginBottom:36 },
  tabs: { display:'flex', marginBottom:32, background:'transparent', padding:'0', gap:0,
    borderBottom:'1px solid rgba(200,123,82,0.20)' },
  tab: { flex:1, padding:'12px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:13, fontFamily:'Poppins, sans-serif', color:'rgba(158,92,53,0.45)', fontWeight:500,
    borderBottom:'2px solid transparent', marginBottom:'-1px' },
  tabActive: { flex:1, padding:'12px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:13, fontFamily:'Poppins, sans-serif', color:'rgba(212,149,106,0.75)', fontWeight:700,
    borderBottom:'2px solid rgba(212,149,106,0.60)', marginBottom:'-1px' },
  field: { marginBottom:16 },
  label: { display:'block', marginBottom:4, fontWeight:600, fontSize:11,
    color:'rgba(158,92,53,0.60)', letterSpacing:'1px', textTransform:'uppercase' },
  input: { width:'100%', padding:'12px 4px', border:'none', borderBottom:'1.5px solid rgba(200,123,82,0.35)',
    background:'transparent', fontSize:15, fontFamily:'Poppins, sans-serif',
    boxSizing:'border-box', outline:'none', color:'rgba(158,92,53,0.85)', transition:'border-color 0.2s' },
  msg: { padding:'11px 16px', borderRadius:12, fontSize:13, marginBottom:14 },
  btn: { width:'auto', padding:'7px 28px', background:'transparent', display:'block', margin:'12px auto 0',
    color:'rgba(212,149,106,0.75)', border:'1.5px solid transparent', borderRadius:'4rem', fontSize:15, fontWeight:600,
    cursor:'pointer', fontFamily:'Poppins, sans-serif',
    letterSpacing:'0.04em', marginTop:0,
    transition:'border-color 0.3s ease, background 0.2s' },
  reassurance: { marginTop:10, textAlign:'center', fontSize:11, color:'rgba(212,149,106,0.45)', letterSpacing:'0.02em' },
  footer: { marginTop:20, textAlign:'center', fontSize:11, color:'rgba(212,149,106,0.45)', lineHeight:1.6 },
  backBtn: {
    position:'fixed', top:24, left:24, zIndex:10,
    background:'transparent', border:'none', cursor:'pointer',
    color:'rgba(158,92,53,0.70)', fontSize:20, fontWeight:500,
    fontFamily:'Poppins, sans-serif', padding:'8px 14px',
    borderRadius:12, transition:'color 0.2s, background 0.2s',
  },
}

