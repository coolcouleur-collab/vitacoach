import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { FlashIcon, LoadingIcon } from './Icons'
import LiquidImage from './LiquidImage'
import GlobeBg from './GlobeBg'

const LANGS = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'de', name: 'Deutsch' },
  { code: 'nl', name: 'Nederlands' },
]

const TRANS = {
  fr: {
    login: 'Connexion', signup: 'Inscription',
    email: 'Email', password: 'Mot de passe',
    remember: 'Se souvenir de moi',
    ctaLogin: 'Retrouver Solenn', ctaSignup: 'Rejoindre Solenn',
    loading: 'Chargement…',
    terms: "En rejoignant Solenn, tu acceptes nos",
    termsLink: "conditions d'utilisation",
    errFields: 'Remplis tous les champs.', errShort: 'Mot de passe minimum 6 caractères.',
    okCreated: '✓ Compte créé ! Connecte-toi.',
    errInvalid: 'Identifiants incorrects.', errNotConfirmed: 'Confirme ton email avant de te connecter.',
    errExists: 'Ce compte existe déjà, connecte-toi.', errPasswordShort: 'Mot de passe trop court (6 caractères minimum).',
    errEmailInvalid: 'Adresse email invalide.', errNetwork: 'Problème de connexion, réessaie.', errGeneric: 'Une erreur est survenue, réessaie.',
  },
  en: {
    login: 'Log in', signup: 'Sign up',
    email: 'Email', password: 'Password',
    remember: 'Remember me',
    ctaLogin: 'Find Solenn', ctaSignup: 'Join Solenn',
    loading: 'Loading…',
    terms: 'By joining Solenn, you agree to our', termsLink: 'terms of use',
    errFields: 'Please fill in all fields.', errShort: 'Password must be at least 6 characters.',
    okCreated: '✓ Account created! Log in.',
    errInvalid: 'Incorrect credentials.', errNotConfirmed: 'Please confirm your email first.',
    errExists: 'Account already exists, log in.', errPasswordShort: 'Password too short (6 characters minimum).',
    errEmailInvalid: 'Invalid email address.', errNetwork: 'Connection error, try again.', errGeneric: 'Something went wrong, try again.',
  },
  es: {
    login: 'Iniciar sesión', signup: 'Registrarse',
    email: 'Email', password: 'Contraseña',
    remember: 'Recordarme',
    ctaLogin: 'Encontrar Solenn', ctaSignup: 'Unirse a Solenn',
    loading: 'Cargando…',
    terms: 'Al unirte a Solenn, aceptas nuestros', termsLink: 'términos de uso',
    errFields: 'Por favor completa todos los campos.', errShort: 'La contraseña debe tener al menos 6 caracteres.',
    okCreated: '✓ ¡Cuenta creada! Inicia sesión.',
    errInvalid: 'Credenciales incorrectas.', errNotConfirmed: 'Por favor confirma tu email primero.',
    errExists: 'Esta cuenta ya existe, inicia sesión.', errPasswordShort: 'Contraseña demasiado corta (mínimo 6 caracteres).',
    errEmailInvalid: 'Dirección de email inválida.', errNetwork: 'Error de conexión, inténtalo de nuevo.', errGeneric: 'Algo salió mal, inténtalo de nuevo.',
  },
  pt: {
    login: 'Entrar', signup: 'Cadastrar',
    email: 'Email', password: 'Senha',
    remember: 'Lembrar de mim',
    ctaLogin: 'Encontrar Solenn', ctaSignup: 'Entrar no Solenn',
    loading: 'Carregando…',
    terms: 'Ao entrar no Solenn, você concorda com nossos', termsLink: 'termos de uso',
    errFields: 'Por favor preencha todos os campos.', errShort: 'A senha deve ter pelo menos 6 caracteres.',
    okCreated: '✓ Conta criada! Entre agora.',
    errInvalid: 'Credenciais incorretas.', errNotConfirmed: 'Por favor confirme seu email primeiro.',
    errExists: 'Esta conta já existe, entre.', errPasswordShort: 'Senha muito curta (mínimo 6 caracteres).',
    errEmailInvalid: 'Endereço de email inválido.', errNetwork: 'Erro de conexão, tente novamente.', errGeneric: 'Algo deu errado, tente novamente.',
  },
  it: {
    login: 'Accedi', signup: 'Registrati',
    email: 'Email', password: 'Password',
    remember: 'Ricordami',
    ctaLogin: 'Trovare Solenn', ctaSignup: 'Unirsi a Solenn',
    loading: 'Caricamento…',
    terms: 'Unendoti a Solenn, accetti i nostri', termsLink: 'termini di utilizzo',
    errFields: 'Per favore compila tutti i campi.', errShort: 'La password deve avere almeno 6 caratteri.',
    okCreated: '✓ Account creato! Accedi.',
    errInvalid: 'Credenziali errate.', errNotConfirmed: 'Per favore conferma la tua email prima.',
    errExists: 'Questo account esiste già, accedi.', errPasswordShort: 'Password troppo corta (minimo 6 caratteri).',
    errEmailInvalid: 'Indirizzo email non valido.', errNetwork: 'Errore di connessione, riprova.', errGeneric: 'Qualcosa è andato storto, riprova.',
  },
  de: {
    login: 'Anmelden', signup: 'Registrieren',
    email: 'E-Mail', password: 'Passwort',
    remember: 'Angemeldet bleiben',
    ctaLogin: 'Solenn finden', ctaSignup: 'Solenn beitreten',
    loading: 'Laden…',
    terms: 'Mit dem Beitritt stimmst du unseren zu', termsLink: 'Nutzungsbedingungen',
    errFields: 'Bitte füll alle Felder aus.', errShort: 'Das Passwort muss mindestens 6 Zeichen haben.',
    okCreated: '✓ Konto erstellt! Anmelden.',
    errInvalid: 'Falsche Anmeldedaten.', errNotConfirmed: 'Bitte bestätige zuerst deine E-Mail.',
    errExists: 'Dieses Konto existiert bereits, anmelden.', errPasswordShort: 'Passwort zu kurz (mindestens 6 Zeichen).',
    errEmailInvalid: 'Ungültige E-Mail-Adresse.', errNetwork: 'Verbindungsfehler, bitte erneut versuchen.', errGeneric: 'Ein Fehler ist aufgetreten, bitte erneut versuchen.',
  },
  nl: {
    login: 'Inloggen', signup: 'Registreren',
    email: 'E-mail', password: 'Wachtwoord',
    remember: 'Onthoud mij',
    ctaLogin: 'Solenn vinden', ctaSignup: 'Solenn joinen',
    loading: 'Laden…',
    terms: 'Door Solenn te joinen, ga je akkoord met onze', termsLink: 'gebruiksvoorwaarden',
    errFields: 'Vul alle velden in.', errShort: 'Wachtwoord moet minimaal 6 tekens bevatten.',
    okCreated: '✓ Account aangemaakt! Log in.',
    errInvalid: 'Onjuiste inloggegevens.', errNotConfirmed: 'Bevestig eerst je e-mail.',
    errExists: 'Dit account bestaat al, log in.', errPasswordShort: 'Wachtwoord te kort (minimaal 6 tekens).',
    errEmailInvalid: 'Ongeldig e-mailadres.', errNetwork: 'Verbindingsfout, probeer opnieuw.', errGeneric: 'Er is iets misgegaan, probeer opnieuw.',
  },
}

export default function Auth({ onConnecte, onBack }) {
  const [mode, setMode]         = useState('connexion')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')
  const [remember, setRemember] = useState(true)
  const [lang, setLang]         = useState(() => localStorage.getItem('solenn_lang') || 'fr')
  const [langOpen, setLangOpen] = useState(false)
  const langRef                 = useRef(null)

  const T = TRANS[lang]
  function switchLang(l) { setLang(l); localStorage.setItem('solenn_lang', l); setMessage(''); setLangOpen(false) }

  useEffect(() => {
    if (!langOpen) return
    function handler(e) { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    const t = setTimeout(() => document.addEventListener('click', handler), 50)
    return () => { clearTimeout(t); document.removeEventListener('click', handler) }
  }, [langOpen])

  async function soumettre() {
    if (!email || !password) return setMessage(T.errFields)
    if (password.length < 6) return setMessage(T.errShort)
    setLoading(true); setMessage('')
    const traductionErreur = (msg = '') => {
      if (/invalid login/i.test(msg))           return T.errInvalid
      if (/email not confirmed/i.test(msg))     return T.errNotConfirmed
      if (/already registered/i.test(msg))      return T.errExists
      if (/password.*short|at least/i.test(msg)) return T.errPasswordShort
      if (/invalid email/i.test(msg))           return T.errEmailInvalid
      if (/network|fetch/i.test(msg))           return T.errNetwork
      return T.errGeneric
    }

    if (mode === 'inscription') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(traductionErreur(error.message))
      else { setMessage(T.okCreated); setMode('connexion') }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(traductionErreur(error.message))
      else {
        if (!remember) {
          localStorage.setItem('solenn_remember_me', 'false')
          sessionStorage.setItem('solenn_active_session', '1')
        } else {
          localStorage.removeItem('solenn_remember_me')
        }
        onConnecte(data.user)
      }
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
        @keyframes msgSlideIn {
          from { opacity:0; transform: translateY(-6px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes msgShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
        input::placeholder { color: rgba(255,248,235,0.82); }
        input[type="checkbox"] {
          appearance: none; -webkit-appearance: none;
          width: 15px; height: 15px; flex-shrink: 0;
          border: 1.5px solid rgba(255,220,160,0.60);
          border-radius: 3px;
          background: rgba(255,235,200,0.12);
          cursor: pointer; position: relative;
          transition: background 0.2s, border-color 0.2s;
        }
        input[type="checkbox"]:checked {
          background: rgba(220,165,90,0.38);
          border-color: rgba(255,220,160,0.90);
        }
        input[type="checkbox"]:checked::after {
          content: '✓'; position: absolute;
          color: rgba(255,248,235,1); font-size: 11px;
          top: -2px; left: 1px; font-weight: 600;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(220,160,100,0.18) inset !important;
          -webkit-text-fill-color: rgba(255,248,235,1) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      {/* ── Sélecteur langue, coin haut droit ── */}
      <div ref={langRef} style={{ position:'fixed', top:'calc(env(safe-area-inset-top,0px) + 14px)', right:16, zIndex:210 }}>
        <button onClick={() => setLangOpen(o => !o)} style={{
          display:'flex', alignItems:'center', gap:5,
          background:'rgba(180,95,35,0.32)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
          border:'1px solid rgba(255,220,160,0.35)', borderRadius:'2rem',
          padding:'6px 12px', cursor:'pointer',
          fontFamily:'Poppins, sans-serif', fontSize:11, fontWeight:500, letterSpacing:'0.08em',
          color:'rgba(255,248,235,0.92)', transition:'background 0.2s',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          {lang.toUpperCase()}
        </button>
        {langOpen && (
          <div style={{
            position:'absolute', right:0, top:'calc(100% + 6px)',
            background:'rgba(160,80,25,0.88)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
            border:'1px solid rgba(255,220,160,0.30)', borderRadius:12,
            padding:'4px 0', minWidth:140,
            boxShadow:'0 8px 28px rgba(80,30,5,0.25)',
            animation:'msgSlideIn 0.18s ease both',
          }}>
            {LANGS.map(({ code, name }) => (
              <button key={code} onClick={() => switchLang(code)} style={{
                display:'block', width:'100%', textAlign:'left',
                padding:'9px 16px', background: lang===code ? 'rgba(255,248,235,0.15)' : 'none',
                border:'none', cursor:'pointer',
                fontFamily:'Poppins, sans-serif', fontSize:13,
                fontWeight: lang===code ? 600 : 400,
                color: lang===code ? 'rgba(255,248,235,1)' : 'rgba(255,248,235,0.65)',
                transition:'background 0.15s',
              }}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

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
              {m === 'connexion' ? T.login : T.signup}
            </button>
          ))}
        </div>

        <div style={s.field}>
          <label style={s.label}>{T.email}</label>
          <input style={s.input} type="email" placeholder="@" value={email}
            autoComplete="email" name="email"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key==='Enter' && soumettre()} />
        </div>

        <div style={{...s.field, position:'relative'}}>
          <label style={s.label}>{T.password}</label>
          <div style={{position:'relative'}}>
            <svg style={{position:'absolute', left:4, top:'50%', transform:'translateY(-50%)',
              opacity:0.82, pointerEvents:'none', color:'rgba(255,248,235,1)'}}
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input style={{...s.input, paddingLeft:24}} type="password" placeholder=""
              autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'}
              name="password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key==='Enter' && soumettre()} />
          </div>
        </div>

        {mode === 'connexion' && (
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, cursor:'pointer' }}>
            <input
              type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              style={{ cursor:'pointer' }}
            />
            <span style={{ fontFamily:'Poppins, sans-serif', fontSize:13, color:'rgba(255,248,235,0.87)' }}>
              {T.remember}
            </span>
          </label>
        )}

        {message && (
          <div key={message} style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 14,
            animation: message.startsWith('✓') ? 'msgSlideIn 0.35s ease both' : 'msgShake 0.42s ease both',
            background: message.startsWith('✓') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${message.startsWith('✓') ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.30)'}`,
            borderLeft: `2px solid ${message.startsWith('✓') ? '#22c55e' : '#ef4444'}`,
          }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '1rem',
              color: 'rgba(255,248,235,0.95)',
              letterSpacing: '0.01em',
            }}>
              {message}
            </span>
          </div>
        )}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          onClick={soumettre} disabled={loading}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,225,170,0.90)'
            const arrow = e.currentTarget.querySelector('.btn-arrow')
            if (arrow) { arrow.style.animation = 'none'; arrow.style.transform = 'translateX(6px)' }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,220,160,0.30)'
            const arrow = e.currentTarget.querySelector('.btn-arrow')
            if (arrow) { arrow.style.animation = ''; arrow.style.transform = '' }
          }}>
          <span style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
            {loading
              ? <><LoadingIcon size={16} color="#FFFFFF" /> {T.loading}</>
              : mode==='connexion'
                ? <>{T.ctaLogin} <span className="btn-arrow" style={{display:'inline-block', transition:'transform 0.25s ease'}}>→</span></>
                : <>{T.ctaSignup} <span className="btn-arrow" style={{display:'inline-block', transition:'transform 0.25s ease'}}>→</span></>}
          </span>
        </button>

        {mode === 'inscription' && (
          <div style={s.footer}>
            {T.terms}<br />
            <span style={{ color:'rgba(255,228,195,0.75)', fontWeight:600 }}>{T.termsLink}</span>.
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'linear-gradient(160deg, #FFF6E8 0%, #F5DDB0 50%, #FFF6E8 100%)', display:'flex', alignItems:'center',
    justifyContent:'center', fontFamily:'Poppins, sans-serif', padding:20,
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
    position:'relative', overflow:'hidden' },
  blob1: { position:'absolute', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(200,123,82,0.50) 0%,rgba(200,100,40,0.22) 45%,transparent 70%)',
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
  tagline: { textAlign:'center', fontSize:13, color:'rgba(255,248,235,0.60)', marginBottom:36 },
  tabs: { display:'flex', marginBottom:32, background:'transparent', padding:'0', gap:0,
    borderBottom:'1px solid rgba(255,220,160,0.20)' },
  tab: { flex:1, padding:'12px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:14, fontFamily:'Poppins, sans-serif', color:'rgba(255,248,235,0.72)', fontWeight:400,
    borderBottom:'2px solid transparent', marginBottom:'-1px' },
  tabActive: { flex:1, padding:'12px', background:'transparent', border:'none', cursor:'pointer',
    fontSize:14, fontFamily:'Poppins, sans-serif', color:'rgba(255,248,235,1)', fontWeight:600,
    borderBottom:'2px solid rgba(255,220,160,0.60)', marginBottom:'-1px' },
  field: { marginBottom:16 },
  label: { display:'block', marginBottom:6, fontWeight:500, fontSize:12,
    color:'rgba(255,248,235,0.92)', letterSpacing:'1.2px', textTransform:'uppercase' },
  input: { width:'100%', padding:'12px 14px', border:'1px solid rgba(255,220,160,0.30)',
    borderRadius:10, background:'rgba(255,235,200,0.10)', fontSize:16, fontFamily:'Poppins, sans-serif',
    boxSizing:'border-box', outline:'none', color:'rgba(255,248,235,1)', transition:'border-color 0.2s, background 0.2s' },
  msg: { padding:'11px 16px', borderRadius:12, fontSize:13, marginBottom:14 },
  btn: { width:'auto', padding:'0.85rem 2.5rem', background:'rgba(255,235,210,0.32)', display:'block', margin:'12px auto 0',
    color:'#FFFFFF', border:'1px solid rgba(255,220,160,0.30)', borderRadius:'2rem',
    fontSize:'clamp(1.3rem, 1.2vw, 1.6rem)', fontWeight:500, fontStyle:'italic',
    cursor:'pointer', fontFamily:"'Cormorant Garamond', Georgia, serif",
    letterSpacing:'0.10em', marginTop:0,
    transition:'background 0.25s, border-color 0.25s' },
  reassurance: { marginTop:10, textAlign:'center', fontSize:11, color:'rgba(255,248,235,0.60)', letterSpacing:'0.02em' },
  footer: { marginTop:20, textAlign:'center', fontSize:14, color:'rgba(255,248,235,0.78)', lineHeight:1.6 },
  backBtn: {
    position:'fixed', top:'calc(env(safe-area-inset-top, 0px) + 24px)', left:24, zIndex:10,
    background:'rgba(255,235,210,0.22)', border:'1px solid rgba(255,220,160,0.40)', cursor:'pointer',
    color:'rgba(255,248,235,1)', fontSize:22, fontWeight:500,
    fontFamily:"'Cormorant Garamond', Georgia, serif", fontStyle:'italic', padding:'0.55rem 1.8rem',
    borderRadius:'2rem', transition:'background 0.25s, border-color 0.25s',
  },
}

