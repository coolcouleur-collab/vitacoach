import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FlashIcon, LoadingIcon } from './Icons'

const supabase = createClient(
  'https://ejbfexxhrxcvmolpwuvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmZleHhocnhjdm1vbHB3dXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDUwODMsImV4cCI6MjA5MDUyMTA4M30.kNdebBhFovcKqdCqpmfHkNmzsV9a5Vw9QWpgzwOlXOk'
)

export default function Auth({ onConnecte }) {
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
      <div style={s.blob1} /><div style={s.blob2} />
      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>E</div>
          <div style={s.logoText}>Solenn</div>
        </div>
        <div style={s.tagline}>Ton coach de vie personnel</div>

        <div style={s.tabs}>
          {['connexion','inscription'].map(m => (
            <button key={m} style={mode===m ? s.tabActive : s.tab} onClick={() => setMode(m)}>
              {m === 'connexion' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {[['email','Email','email','ton@email.com',email,setEmail],
          ['password','Mot de passe','password','••••••••',password,setPassword]
        ].map(([id,lb,type,ph,val,set]) => (
          <div key={id} style={s.field}>
            <label style={s.label}>{lb}</label>
            <input style={s.input} type={type} placeholder={ph} value={val}
              onChange={e => set(e.target.value)}
              onKeyDown={e => e.key==='Enter' && soumettre()} />
          </div>
        ))}

        {message && (
          <div style={{ ...s.msg,
            background: message.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
            color: message.startsWith('✓') ? '#16a34a' : '#dc2626',
            border: `1px solid ${message.startsWith('✓') ? '#bbf7d0' : '#fecaca'}` }}>
            {message}
          </div>
        )}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          onClick={soumettre} disabled={loading}>
          <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
            {loading
              ? <><LoadingIcon size={16} color="#fff" /> Chargement...</>
              : mode==='connexion'
                ? 'Se connecter →'
                : <><FlashIcon size={14} color="#fff" /> Créer mon compte</>}
          </span>
        </button>

        <div style={s.footer}>
          En continuant tu acceptes nos{' '}
          <span style={{ color:'#FF4500', fontWeight:600 }}>conditions d'utilisation</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'#FFF8F4', display:'flex', alignItems:'center',
    justifyContent:'center', fontFamily:'Poppins, sans-serif', padding:20,
    position:'relative', overflow:'hidden' },
  blob1: { position:'fixed', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(200,123,82,0.13) 0%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 10s ease-in-out infinite' },
  blob2: { position:'fixed', bottom:'-10%', right:'-8%', width:600, height:600, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(255,69,0,0.1) 0%,transparent 70%)',
    pointerEvents:'none', zIndex:0, animation:'floatOrb 13s ease-in-out infinite reverse' },
  card: { position:'relative', zIndex:1, width:'100%', maxWidth:420, background:'#ffffff',
    borderRadius:28, padding:'40px 36px',
    boxShadow:'0 8px 48px rgba(0,0,0,0.08)', animation:'slideUp 0.45s ease' },
  logoWrap: { display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:6 },
  logoIcon: { width:36, height:36, borderRadius:12,
    background:'linear-gradient(135deg,#C87B52,#9E5C35)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'white' },
  logoText: { fontSize:26, fontWeight:900, letterSpacing:'-0.5px',
    background:'linear-gradient(135deg,#C87B52,#9E5C35)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  tagline: { textAlign:'center', fontSize:13, color:'#9ca3af', marginBottom:28 },
  tabs: { display:'flex', marginBottom:24, background:'#FFF8F4', borderRadius:14, padding:4, gap:4 },
  tab: { flex:1, padding:'10px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:13, fontFamily:'Poppins, sans-serif', color:'#9ca3af', borderRadius:10, fontWeight:500 },
  tabActive: { flex:1, padding:'10px', background:'#ffffff', border:'none', cursor:'pointer',
    fontSize:13, fontFamily:'Poppins, sans-serif', color:'#1a0a00', borderRadius:10, fontWeight:700,
    boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  field: { marginBottom:16 },
  label: { display:'block', marginBottom:6, fontWeight:600, fontSize:11,
    color:'#6b7280', letterSpacing:'1px', textTransform:'uppercase' },
  input: { width:'100%', padding:'13px 16px', borderRadius:14, border:'1px solid #e5e7eb',
    background:'#f9fafb', fontSize:14, fontFamily:'Poppins, sans-serif',
    boxSizing:'border-box', outline:'none', color:'#1a0a00', transition:'border-color 0.2s' },
  msg: { padding:'11px 16px', borderRadius:12, fontSize:13, marginBottom:14 },
  btn: { width:'100%', padding:'15px', background:'linear-gradient(135deg,#C87B52,#9E5C35)',
    color:'white', border:'none', borderRadius:16, fontSize:15, fontWeight:800,
    cursor:'pointer', fontFamily:'Poppins, sans-serif',
    boxShadow:'0 6px 24px rgba(200,123,82,0.38)', letterSpacing:'0.3px', marginTop:4 },
  footer: { marginTop:20, textAlign:'center', fontSize:11, color:'#d1d5db', lineHeight:1.6 },
}

