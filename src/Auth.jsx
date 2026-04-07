import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function Auth({ onConnecte }) {
  const [mode, setMode] = useState('connexion')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function soumettre() {
    if (!email || !password) return setMessage('Remplis tous les champs !')
    if (password.length < 6) return setMessage('Mot de passe minimum 6 caractères !')
    setLoading(true)
    setMessage('')

    if (mode === 'inscription') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage('❌ ' + error.message)
      } else {
        setMessage('✅ Compte créé ! Vérifie ton email puis connecte-toi.')
        setMode('connexion')
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('❌ ' + error.message)
      } else {
        onConnecte(data.user)
      }
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>💚 VitaCoach</div>
        <div style={styles.tagline}>Ton coach de vie personnel</div>

        <div style={styles.tabs}>
          <button style={mode === 'connexion' ? styles.tabActive : styles.tab}
            onClick={() => setMode('connexion')}>Connexion</button>
          <button style={mode === 'inscription' ? styles.tabActive : styles.tab}
            onClick={() => setMode('inscription')}>Inscription</button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="ton@email.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Mot de passe</label>
          <input style={styles.input} type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && soumettre()} />
        </div>

        {message && <div style={styles.message}>{message}</div>}

        <button style={styles.btn} onClick={soumettre} disabled={loading}>
          {loading ? '⏳ Chargement...' : mode === 'connexion' ? '🔐 Se connecter' : '🚀 Créer mon compte'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #f0f7ff, #e8f0fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif' },
  card: { background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(26,115,232,0.15)' },
  logo: { fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 6 },
  tagline: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 },
  tabs: { display: 'flex', marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '2px solid #e0e0e0' },
  tab: { flex: 1, padding: '10px', background: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Poppins, sans-serif', color: '#888' },
  tabActive: { flex: 1, padding: '10px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Poppins, sans-serif', color: 'white', fontWeight: 600 },
  field: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#333' },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e0e0e0', fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box', outline: 'none' },
  message: { padding: '10px 14px', borderRadius: 10, background: '#f0f7ff', fontSize: 13, marginBottom: 16, color: '#333' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }
}
