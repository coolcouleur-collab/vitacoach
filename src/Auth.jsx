import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ejbfexxhrxcvmolpwuvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYmZleHhocnhjdm1vbHB3dXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDUwODMsImV4cCI6MjA5MDUyMTA4M30.kNdebBhFovcKqdCqpmfHkNmzsV9a5Vw9QWpgzwOlXOk'
)

function Stars() {
  const [stars] = useState(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      color: ['#00d4ff','#bf5af2','#00ff88','#fff','#fff','#fff'][Math.floor(Math.random()*6)],
      dur: (2 + Math.random() * 4).toFixed(1),
      op: (Math.random() * 0.5 + 0.1).toFixed(2)
    }))
  )
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
          width:s.size, height:s.size, borderRadius:'50%',
          background:s.color, opacity:s.op,
          boxShadow:`0 0 ${s.size*4}px ${s.color}`,
          animation:`twinkle ${s.dur}s ease-in-out infinite alternate`
        }} />
      ))}
      <div style={{ position:'absolute', top:'20%', left:'10%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)', animation:'floatOrb 8s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'15%', right:'8%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(191,90,242,0.09) 0%, transparent 70%)', animation:'floatOrb 11s ease-in-out infinite reverse' }} />
    </div>
  )
}

export default function Auth({ onConnecte }) {
  const [mode, setMode] = useState('connexion')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function soumettre() {
    if (!email || !password) return setMessage('Remplis tous les champs !')
    if (password.length < 6) return setMessage('Mot de passe minimum 6 caractères.')
    setLoading(true)
    setMessage('')
    if (mode === 'inscription') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage('✕ ' + error.message)
      else { setMessage('✓ Compte créé ! Vérifie ton email puis connecte-toi.'); setMode('connexion') }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage('✕ ' + error.message)
      else onConnecte(data.user)
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <Stars />
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>✦ Oravi</div>
        <div style={s.tagline}>Ton coach de vie personnel</div>

        {/* Tabs */}
        <div style={s.tabs}>
          {['connexion','inscription'].map(m => (
            <button key={m} style={mode===m ? s.tabActive : s.tab} onClick={() => setMode(m)}>
              {m === 'connexion' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        <div style={s.field}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="ton@email.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Mot de passe</label>
          <input style={s.input} type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key==='Enter' && soumettre()} />
        </div>

        {message && (
          <div style={{ ...s.msg, borderColor: message.startsWith('✓') ? 'rgba(0,255,136,0.3)' : 'rgba(255,82,82,0.3)', color: message.startsWith('✓') ? '#00ff88' : '#ff5252' }}>
            {message}
          </div>
        )}

        <button style={s.btn} onClick={soumettre} disabled={loading}>
          {loading ? '⏳ Chargement...' : mode==='connexion' ? '→ Se connecter' : '⚡ Créer mon compte'}
        </button>

        <div style={s.footer}>
          En continuant tu acceptes nos <span style={{ color:'#00d4ff' }}>conditions d'utilisation</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'#000010', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Poppins, sans-serif', padding:20, position:'relative' },
  card: { position:'relative', zIndex:1, width:'100%', maxWidth:420, background:'rgba(255,255,255,0.04)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:28, padding:'40px 36px', boxShadow:'0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)', animation:'slideUp 0.5s ease' },
  logo: { fontSize:32, fontWeight:900, textAlign:'center', marginBottom:6, background:'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'-1px' },
  tagline: { fontSize:13, color:'rgba(255,255,255,0.35)', textAlign:'center', marginBottom:32, letterSpacing:'0.3px' },
  tabs: { display:'flex', marginBottom:28, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4, gap:4, border:'1px solid rgba(255,255,255,0.06)' },
  tab: { flex:1, padding:'10px', background:'transparent', border:'none', cursor:'pointer', fontSize:13, fontFamily:'Poppins, sans-serif', color:'rgba(255,255,255,0.35)', borderRadius:8, fontWeight:500 },
  tabActive: { flex:1, padding:'10px', background:'linear-gradient(135deg, #00d4ff, #0080ff)', border:'none', cursor:'pointer', fontSize:13, fontFamily:'Poppins, sans-serif', color:'#000', borderRadius:8, fontWeight:700, boxShadow:'0 4px 14px rgba(0,212,255,0.4)' },
  field: { marginBottom:18 },
  label: { display:'block', marginBottom:7, fontWeight:600, fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase' },
  input: { width:'100%', padding:'13px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', fontSize:14, fontFamily:'Poppins, sans-serif', boxSizing:'border-box', outline:'none', color:'white', transition:'border-color 0.2s' },
  msg: { padding:'11px 16px', borderRadius:12, background:'rgba(255,255,255,0.04)', fontSize:13, marginBottom:16, border:'1px solid', letterSpacing:'0.2px' },
  btn: { width:'100%', padding:'15px', background:'linear-gradient(135deg, #00d4ff, #0080ff)', color:'#000', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 6px 24px rgba(0,212,255,0.45)', letterSpacing:'0.3px', marginTop:4 },
  footer: { marginTop:20, textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', lineHeight:1.6 }
}
