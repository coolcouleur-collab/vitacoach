import React, { useState, useRef, useEffect, Component } from 'react'
import Auth from './Auth'
import Landing from './Landing'
import Forum from './Forum'
import Onboarding from './Onboarding'
import HomeTab from './HomeTab'
import HerbalTab from './HerbalTab'
import SanteTab, { scoreJour } from './SanteTab'
import { HomeIcon, ChatIcon, HeartIcon, RoutineIcon, LeafIcon, StyleIcon, ForumIcon, BackIcon, SendIcon, BellIcon, BellOffIcon, FlashIcon, StarIcon, TargetIcon, LightbulbIcon, MoonIcon, SunIcon, FoodIcon, PillIcon, RefreshIcon, SparkleIcon, CalendarIcon, LoadingIcon, WeatherIcon } from './Icons'
import ResponseRenderer, { isRich } from './ResponseRenderer'

// ─── SHINY LOGO TEXT (statique par défaut, shimmer au hover/tap) ─────────────
function ShinyLogoText({ text, gradient, animDuration = '4s', animDelay = '0s', style = {} }) {
  const [active, setActive] = useState(false)
  const offTimer  = useRef(null)
  const hovering  = useRef(false)

  function handleEnter() {
    hovering.current = true
    clearTimeout(offTimer.current)
    setActive(true)
  }
  function handleLeave() {
    hovering.current = false
    clearTimeout(offTimer.current)
    setActive(false)
  }
  function handleClick() {
    setActive(true)
    clearTimeout(offTimer.current)
    // Sur mobile (pas de mouseLeave) : arrête après 1 cycle complet
    offTimer.current = setTimeout(() => {
      if (!hovering.current) setActive(false)
    }, parseFloat(animDuration) * 1000)
  }

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      style={{
        background: gradient,
        backgroundSize: '250% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: active ? `shimmerGrad ${animDuration} ease-in-out infinite ${animDelay}` : 'none',
        cursor: 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        ...style,
      }}
    >
      {text}
    </div>
  )
}

// ─── SOLENN MASCOT FACE ──────────────────────────────────────────────────────
function SolennFace({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.30,
      background: 'linear-gradient(145deg, #C87B52, #9E5C35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(200,123,82,0.42), inset 0 1px 0 rgba(255,255,255,0.25)',
      marginTop: 4,
    }}>
      {/* Reflet */}
      <div style={{
        position:'absolute', top:3, left:4,
        width: size * 0.50, height: size * 0.30,
        borderRadius:'50%',
        background:'rgba(255,255,255,0.20)',
        pointerEvents:'none',
      }} />
      {/* Visage */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: size * 0.10 }}>
        {/* Yeux */}
        <div style={{ display:'flex', gap: size * 0.20 }}>
          <div style={{ width: size*0.13, height: size*0.13, borderRadius:'50%', background:'#fff', animation:'oravBlink 4s ease-in-out infinite' }} />
          <div style={{ width: size*0.13, height: size*0.13, borderRadius:'50%', background:'#fff', animation:'oravBlink 4s ease-in-out infinite 0.07s' }} />
        </div>
        {/* Sourire */}
        <div style={{
          width: size * 0.38, height: size * 0.17,
          borderRadius: `0 0 ${size*0.22}px ${size*0.22}px`,
          border: `${Math.max(1.5, size*0.055)}px solid rgba(255,255,255,0.90)`,
          borderTop: 'none',
        }} />
      </div>
    </div>
  )
}

// ─── Error Boundary (évite page blanche sur crash de rendu) ──────────────────
class MsgBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  render() {
    if (this.state.crashed) {
      return (
        <span style={{ whiteSpace:'pre-wrap', lineHeight:1.72, color:'#1a0a00' }}>
          {this.props.fallback}
        </span>
      )
    }
    return this.props.children
  }
}

// ─── CELEBRATION OVERLAY ─────────────────────────────────────────────────────
function CelebrationOverlay({ score, onDone }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => { setOut(true); setTimeout(onDone, 420) }, 2700)
    return () => clearTimeout(t)
  }, [])
  const sparks = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    e: ['✨','🔥','⭐','💫','🌟','🎊','🎉','🌈'][i % 8],
    x: 4 + (i * 6) % 92,
    delay: (i * 0.09) % 0.65,
    dur: 1.2 + (i * 0.11) % 1.0,
  }))
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999, pointerEvents:'none',
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity: out ? 0 : 1, transition:'opacity 0.42s ease',
    }}>
      {sparks.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:'-5%', fontSize:22,
          animation:`celebFall ${s.dur}s ${s.delay}s ease-in forwards`,
        }}>{s.e}</div>
      ))}
      <div style={{
        background:'rgba(255,253,250,0.97)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
        borderRadius:28, padding:'36px 52px', textAlign:'center',
        boxShadow:'0 28px 80px rgba(200,123,82,0.30), 0 8px 24px rgba(0,0,0,0.07)',
        border:'1.5px solid rgba(200,123,82,0.22)',
        animation:'celebPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{ fontSize:54, marginBottom:10, lineHeight:1 }}>
          {score >= 90 ? '🌟' : '🎉'}
        </div>
        <div style={{ fontSize:50, fontWeight:900, color:'#C87B52', lineHeight:1, letterSpacing:'-2px' }}>
          {score}<span style={{ fontSize:18, color:'#c4b5a8', fontWeight:400 }}>/100</span>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:'#9E5C35', marginTop:9 }}>
          {score >= 90 ? 'Journée parfaite ! 🏆' : score >= 80 ? 'Excellente journée !' : 'Objectif atteint !'}
        </div>
        <div style={{ fontSize:11, color:'rgba(160,110,70,0.55)', marginTop:5, fontWeight:500, letterSpacing:'0.3px' }}>
          Score santé du jour
        </div>
      </div>
    </div>
  )
}

function ReactionBtn({ emoji, active, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={() => { onClick(); setPressed(true); setTimeout(() => setPressed(false), 300) }}
      style={{
        background: active ? 'rgba(200,123,82,0.22)' : 'transparent',
        border: active ? '1.5px solid rgba(200,123,82,0.45)' : '1.5px solid rgba(200,123,82,0.12)',
        borderRadius: 10, padding: '3px 9px', fontSize: active ? 15 : 13,
        cursor: 'pointer', transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        transform: pressed ? 'scale(1.35)' : active ? 'scale(1.12)' : 'scale(1)',
        boxShadow: active ? '0 0 10px rgba(200,123,82,0.30)' : 'none',
        filter: active ? 'none' : 'grayscale(0.3) opacity(0.6)',
        outline: 'none',
      }}
    >
      {emoji}
    </button>
  )
}

// ─── MÉTRIQUES UTILS ─────────────────────────────────────────────────────────
const defaultMetriques = () => {
  const today = new Date().toDateString()
  try {
    const saved = JSON.parse(localStorage.getItem('vitacoach_metriques') || '{}')
    if (saved.date === today) return saved
  } catch {}
  return { date: today, pas: 0, sommeil: 0, eau: 0, fc: 0, humeur: 0, poids: 0 }
}

function sauverMetriques(m) {
  localStorage.setItem('vitacoach_metriques', JSON.stringify({ ...m, date: new Date().toDateString() }))
}

// Convertit base64url en Uint8Array pour VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// ─── APP ══════════════════════════════════════════════════════════════════════
export default function App() {
  const FREE_LIMIT = 5

  const getMsgCount = () => {
    const today = new Date().toDateString()
    try {
      const saved = JSON.parse(localStorage.getItem('vitacoach_msg_count') || '{}')
      return saved.date !== today ? 0 : saved.count
    } catch { return 0 }
  }
  const incrementMsgCount = () => {
    const today = new Date().toDateString()
    localStorage.setItem('vitacoach_msg_count', JSON.stringify({ date:today, count: getMsgCount()+1 }))
  }

  const safeParse = (key, fb) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb }
  }

  const [user, setUser]         = useState(() => safeParse('vitacoach_user', null))
  const [isPro, setIsPro]       = useState(() => safeParse('vitacoach_pro', false))
  const [profil, setProfil]     = useState(() => safeParse('vitacoach_profil', null))
  const [profilBackup, setProfilBackup] = useState(null)
  const [messages, setMessages] = useState(() => {
    const p = safeParse('vitacoach_profil', null)
    const h = safeParse('vitacoach_historique', null)
    if (p && h) {
      // Purge tous les vieux messages de limite (jamais utiles dans l'historique)
      return h.filter(m => !m.content?.includes('messages gratuits'))
    }
    if (p) {
      const h = new Date().getHours()
      const greet = h < 12 ? 'Bonjour' : h < 18 ? 'Salut' : 'Bonsoir'
      const s = safeParse('vitacoach_metriques', {})
      const sc = typeof window !== 'undefined' ? (parseInt(localStorage.getItem('vitacoach_last_score')) || 0) : 0
      const scoreMsg = sc > 0 ? ` Ton score santé hier était de ${sc}/100.` : ''
      return [{ role:'assistant', content:`${greet} ${p.nom} !${scoreMsg} Qu'est-ce que je peux faire pour toi aujourd'hui ?` }]
    }
    return []
  })
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [onglet, setOnglet]     = useState('accueil')
  const [metriques, setMetriques] = useState(defaultMetriques)
  const [suggestions, setSuggestions] = useState([])
  const [reactions, setReactions]   = useState({})
  const [followUps, setFollowUps]   = useState([])
  const [celebrate, setCelebrate]   = useState(false)
  const celebInitRef = useRef(false)
  const [history, setHistory]     = useState(() => safeParse('vitacoach_history', []))
  const [notifEnabled, setNotifEnabled] = useState(() => safeParse('vitacoach_notif', false))
  const [menuOpen, setMenuOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const isSendingRef   = useRef(false)   // verrou anti-doublon

  // ── Calculs gamification ──────────────────────────────────────────────────
  const streak = (() => {
    if (!history || history.length === 0) return 0
    const sorted = [...history].sort((a,b) => new Date(b.date) - new Date(a.date))
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0
    let count = 0, expected = sorted[0].date
    for (const e of sorted) {
      if (e.date === expected) {
        count++
        const d = new Date(expected); d.setDate(d.getDate() - 1); expected = d.toDateString()
      } else break
    }
    return count
  })()
  const xp    = history.length * 15 + messages.filter(m => m.role === 'user').length * 5
  const level = Math.floor(xp / 100) + 1

  // Responsive
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const isMobile = windowWidth < 768

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])
  // Scroll to last message when user navigates back to chat tab
  useEffect(() => {
    if (onglet === 'chat' && messages.length > 0) {
      const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior:'instant' }), 60)
      return () => clearTimeout(t)
    }
  }, [onglet])
  useEffect(() => {
    if (profil && messages.length > 0) {
      // Ne jamais sauvegarder les messages de limite dans l'historique
      const toSave = messages.filter(m => !m.content?.includes('messages gratuits'))
      localStorage.setItem('vitacoach_historique', JSON.stringify(toSave.slice(-50)))
    }
  }, [messages, profil])
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('subscribed') === 'true') {
      setIsPro(true)
      localStorage.setItem('vitacoach_pro', JSON.stringify(true))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // Célébration quand score atteint 80+ (une fois par jour)
  useEffect(() => {
    if (!celebInitRef.current) { celebInitRef.current = true; return }
    const today = new Date().toDateString()
    if (score >= 80 && localStorage.getItem('vitacoach_celebrated') !== today) {
      localStorage.setItem('vitacoach_celebrated', today)
      setTimeout(() => setCelebrate(true), 400)
    }
  }, [metriques])

  // Suggestions dynamiques heure + profil + streak
  useEffect(() => {
    if (!profil) return
    const h = new Date().getHours()
    const isVege = profil.regimes?.some(r => /végé|vegan|vegetar/i.test(r))
    const obj0 = profil.objectifs?.[0] || ''
    const wantsWeight = /poids|mincir|maigrir/i.test(obj0)
    const wantsEnergy = /énergie|fatigue|sport/i.test(obj0)

    let base
    if (h < 10)      base = [
      `${isVege ? 'Petit-déj végé rapide ?' : 'Que manger ce matin ?'}`,
      wantsEnergy ? 'Routine matinale énergie ?' : 'Comment bien démarrer ma journée ?',
      'Mon score santé est comment ?'
    ]
    else if (h < 14) base = [
      wantsWeight ? 'Repas de midi léger et rassasiant ?' : 'Idée repas de midi ?',
      'Comment rester concentré cet après-midi ?',
      'Stretch rapide 5 min ?'
    ]
    else if (h < 19) base = [
      'Je suis épuisé, que faire ?',
      wantsWeight ? 'Collation sans culpabilité ?' : 'Collation saine ?',
      'Comment gérer mon stress maintenant ?'
    ]
    else             base = [
      'Routine du soir pour bien dormir ?',
      isVege ? 'Dîner végé rapide ?' : 'Que manger ce soir ?',
      'Comment me décompresser ?'
    ]

    // Streak en danger : soir + streak actif + aucune métrique loggée aujourd'hui
    const notLogged = !metriques.pas && !metriques.sommeil && !metriques.eau
    if (streak > 0 && h >= 19 && notLogged)
      setSuggestions([`🔥 Mon streak de ${streak} jour${streak > 1 ? 's' : ''} est en danger !`, ...base.slice(0, 2)])
    else
      setSuggestions(base)
  }, [profil, streak, metriques])

  // Génère les chips de suivi contextuel après chaque réponse IA
  function genFollowUps(reply) {
    const r = (reply || '').toLowerCase()
    if (/repas|manger|nutrition|recette|calorie|dîner|déjeuner|petit-déj/.test(r))
      return ['Et pour le dîner ?', 'Plan repas semaine ?', 'Les meilleurs snacks ?']
    if (/sommeil|dormir|nuit|insomnie|fatigue/.test(r))
      return ['Ma routine du soir ?', 'Pourquoi je dors mal ?', 'Sieste efficace ?']
    if (/sport|exercice|entraîn|muscul|cardio|running/.test(r))
      return ['Programme débutant ?', 'Récupération musculaire ?', 'Sport sans salle ?']
    if (/stress|anxiété|angoisse|anxieux|pression/.test(r))
      return ['Technique anti-stress rapide ?', 'Méditation pour débutant ?', 'Améliorer mon énergie ?']
    if (/peau|acné|hydrat|cosmétique|soin/.test(r))
      return ['Routine soin du visage ?', 'Aliments bons pour la peau ?']
    if (/plante|tisane|herbe|naturel|remède/.test(r))
      return ['Autres plantes pour moi ?', 'Tisane du soir ?']
    const h = new Date().getHours()
    if (h < 12) return ['Routine matinale ?', 'Booster mon énergie ?']
    if (h < 18) return ['Gérer la fatigue ?', 'Collation saine ?']
    return ['Routine du soir ?', 'Bien dormir ce soir ?']
  }

  function mettreAJourMetrique(key, val) {
    setMetriques(prev => {
      const newM = { ...prev, [key]: val }
      sauverMetriques(newM)
      // Sauvegarde dans l'historique 30 jours
      const today = new Date().toDateString()
      const hist = safeParse('vitacoach_history', [])
      const filtered = hist.filter(h => h.date !== today)
      filtered.push({ ...newM, date: today })
      const sorted = filtered.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-30)
      localStorage.setItem('vitacoach_history', JSON.stringify(sorted))
      setHistory(sorted)
      return newM
    })
  }

  // ── Notifications Push ────────────────────────────────────────────────────
  async function activerNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Ton navigateur ne supporte pas les notifications push.')
      return
    }
    try {
      // Enregistre le service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Demande la permission
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return

      // Récupère la clé VAPID publique
      const { key } = await fetch('/api/vapid-public-key').then(r => r.json())
      const appServerKey = urlBase64ToUint8Array(key)

      // Crée la subscription
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      })

      // Envoie la subscription au serveur
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), userId: profil?.nom || 'user' })
      })

      setNotifEnabled(true)
      localStorage.setItem('vitacoach_notif', JSON.stringify(true))

      // Notif de bienvenue immédiate
      reg.showNotification('Solenn activé !', {
        body: `Salut ${profil?.nom} ! Tu recevras tes rappels santé quotidiens.`,
        icon: '/icon-192.png',
        tag: 'welcome',
      })
    } catch (e) {
      console.error('Push error:', e)
    }
  }

  async function desactiverNotifications() {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push-unsubscribe', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profil?.nom || 'user', endpoint: sub.endpoint })
          })
          await sub.unsubscribe()
        }
      }
    } catch {}
    setNotifEnabled(false)
    localStorage.setItem('vitacoach_notif', JSON.stringify(false))
  }

  async function passerPro() {
    try {
      const res = await fetch('/api/create-checkout', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId:user?.id, email:user?.email })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      // Stripe pas encore configuré — silencieux
    } catch {}
  }

  async function envoyerMessage(msgOverride) {
    const msg = msgOverride || input
    if (!msg.trim()) return
    if (isSendingRef.current) return     // verrou : un seul envoi à la fois
    isSendingRef.current = true

    if (!isPro && getMsgCount() >= FREE_LIMIT) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.content?.includes('messages gratuits')) return prev
        return [...prev, { role:'assistant', content:`Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Solenn Pro pour des conseils illimités !` }]
      })
      isSendingRef.current = false
      return
    }
    const userMsg = { role:'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    if (!isPro) incrementMsgCount()
    try {
      const resp = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: msg, profil, historique: messages.slice(-10), metriques })
      })
      const data = await resp.json()
      setMessages(prev => [...prev, { role:'assistant', content:data.reply }])
      setFollowUps(genFollowUps(data.reply))
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Une erreur est survenue. Réessaie.' }])
    } finally {
      setLoading(false)
      isSendingRef.current = false      // libère le verrou
    }
  }

  // ── LANDING / FORUM ────────────────────────────────────────────────────────
  const [showAuth, setShowAuth] = useState(false)
  const [showForum, setShowForum] = useState(false)

  if (showForum) return <Forum onBack={() => setShowForum(false)} user={user} />
  if (!user && !showAuth) return <Landing onCommencer={() => setShowAuth(true)} onForum={() => setShowForum(true)} />

  // ── AUTH ────────────────────────────────────────────────────────────────────
  if (!user) return (
    <Auth onConnecte={u => {
      setUser(u)
      localStorage.setItem('vitacoach_user', JSON.stringify(u))
    }} />
  )

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  if (!profil) {
    return (
      <Onboarding onTermine={p => {
        setProfil(p)
        setProfilBackup(null)
        localStorage.setItem('vitacoach_profil', JSON.stringify(p))
        const h2 = new Date().getHours()
        const g2 = h2 < 12 ? 'Bonjour' : h2 < 18 ? 'Salut' : 'Bonsoir'
        setMessages([{ role:'assistant', content:`${g2} ${p.nom} ! Je suis Solenn, ton coach de vie personnel. Je connais ton profil et je suis là pour t'aider à atteindre tes objectifs. Par quoi on commence ?` }])
      }} />
    )
  }

  // ── MAIN APP ════════════════════════════════════════════════════════════════
  const score = scoreJour(metriques)
  const scoreColor = score >= 70 ? '#34c759' : score >= 40 ? '#ff9500' : '#ff3b30'

  const sectionTitles = {
    chat:'Solenn', sante:'Santé', routine:'Routine', herbal:'Santé Naturelle', style:'Style', forum:'Forum'
  }

  const navItems = [
    { id:'accueil', Icon: HomeIcon,   label:'Accueil' },
    { id:'chat',    Icon: ChatIcon,   label:'Solenn' },
    { id:'sante',   Icon: HeartIcon,  label:'Santé' },
    { id:'forum',   Icon: ForumIcon,  label:'Forum' },
  ]

  return (
    <div style={s.app}>

      {/* ══ GLOBAL BACKGROUND — background-components.tsx traduit en inline styles ══
           Couche fixe plein écran, derrière tout le contenu (zIndex:-1)
           Base blanche + jaune #FFF991 multiply opacity 0.6 + orange #FF7112 multiply opacity 0.3 */}
      <div style={{
        position:'fixed', inset:0, zIndex:0, background:'#ffffff', pointerEvents:'none',
      }}>
        {/* background-components.tsx — Soft Yellow Glow */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'radial-gradient(circle at center, #FFF991 0%, transparent 70%)',
          opacity:0.6,
          mixBlendMode:'multiply',
        }} />
        {/* demo.tsx — Orange Soft Glow */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'radial-gradient(circle at center, #FF7112, transparent)',
          opacity:0.3,
          mixBlendMode:'multiply',
        }} />
      </div>

      {/* ══ SIDEBAR (desktop) ══ */}
      {!isMobile && (
        <aside style={s.sidebar}>
          <div style={s.sidebarTop}>
            <ShinyLogoText
              text="Solenn"
              gradient="linear-gradient(90deg, #ECA882 0%, #FFF8F4 20%, #F5D4B8 36%, #FFF8F4 52%, #D4956A 68%, #FCDEC8 84%, #ECA882 100%)"
              animDuration="10s"
              style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.04em' }}
            />
            <ShinyLogoText
              text="re·vivre · évoluer"
              gradient="linear-gradient(90deg, #D4844A 0%, #F5C8AA 25%, #ffffff 45%, #F5C8AA 68%, #D4844A 100%)"
              animDuration="14s"
              animDelay="0s"
              style={{ fontSize:11, marginTop:3, letterSpacing:'0.06em', fontWeight:600 }}
            />
          </div>

          <nav style={s.sidebarNav}>
            {navItems.map(({ id, Icon, label }) => {
              const active = onglet === id
              const color = active ? '#C87B52' : '#8a7265'
              return (
                <button key={id} style={active ? s.navActive : s.nav}
                  onClick={() => setOnglet(id)}>
                  <Icon color={color} size={18} />
                  <span>{label}</span>
                  {id === 'sante' && score > 0 && (
                    <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700,
                      color: scoreColor, background: scoreColor+'18', borderRadius:6, padding:'2px 7px' }}>
                      {score}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div style={s.sidebarBottom}>
            <div style={s.profileCard}>
              <div style={s.avatar}>{profil.nom?.charAt(0).toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={s.profileName}>{profil.nom}</div>
                {profil.objectifs?.[0] && <div style={s.profileMeta}><TargetIcon size={13} color="#C87B52" /> {profil.objectifs[0]}</div>}
              </div>
            </div>
            {!isPro && (
              <button style={s.btnPro} onClick={passerPro}><FlashIcon size={14} color="#fff" /> Solenn Pro — 4.99€/mois</button>
            )}
            {isPro && <div style={s.proBadge}><StarIcon size={14} color="#fbbf24" /> Membre Pro</div>}
            <button
              style={{
                ...s.btnEdit,
                background: notifEnabled ? 'rgba(52,199,89,0.10)' : 'rgba(0,0,0,0.04)',
                color: notifEnabled ? '#34c759' : '#8a7265',
                border: notifEnabled ? '1px solid rgba(52,199,89,0.25)' : '1px solid rgba(0,0,0,0.08)',
                display:'flex', alignItems:'center', gap:6,
              }}
              onClick={notifEnabled ? desactiverNotifications : activerNotifications}
            >
              {notifEnabled ? <><BellIcon size={15} color="#34c759" /> Rappels activés</> : <><BellOffIcon size={15} color="#9ca3af" /> Activer les rappels</>}
            </button>
            <button style={{...s.btnEdit, display:'flex', alignItems:'center', gap:6}} onClick={() => {
              setProfilBackup(profil); setProfil(null)
            }}>✏ Modifier mon profil</button>
          </div>
        </aside>
      )}

      {/* ══ MAIN ══ */}
      <main style={{ ...s.main, marginLeft: isMobile ? 0 : 252 }}>
        <div style={{ ...s.content, padding: isMobile ? '0 0 108px' : '0 0 40px' }}>

          {/* Mobile header */}
          {isMobile && (() => {
            const onChat = onglet === 'chat'
            const iconColor = onChat ? 'rgba(150,100,40,0.70)' : 'rgba(120,70,40,0.70)'
            return (
            <div style={s.mobileHeader}>
              {onglet !== 'accueil' ? (
                <button style={{ background:'none', border:'none', padding:'6px', cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0 }}
                  onClick={() => setOnglet('accueil')}>
                  <BackIcon color={iconColor} size={18} />
                </button>
              ) : (
                <ShinyLogoText
                  text="Solenn"
                  gradient="linear-gradient(90deg, #ECA882 0%, #FFF8F4 20%, #F5D4B8 36%, #FFF8F4 52%, #D4956A 68%, #FCDEC8 84%, #ECA882 100%)"
                  animDuration="4s"
                  style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.04em' }}
                />
              )}

              <div style={s.mobileTitle}>
                {onglet === 'accueil' ? '' : sectionTitles[onglet] || ''}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {score > 0 && onglet === 'accueil' && (
                  <div style={{ ...s.scorePill, background: scoreColor+'15', color: scoreColor, border:`1px solid ${scoreColor}30` }}>
                    {score}
                  </div>
                )}
                {/* ── Hamburger button ── */}
                <button onClick={() => setMenuOpen(o => !o)} style={{
                  width:34, height:34, borderRadius:10,
                  background:'none', border:'none', boxShadow:'none',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:5, cursor:'pointer', padding:0, flexShrink:0,
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      display:'block', borderRadius:2, background: iconColor,
                      transition:'transform 0.36s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease, width 0.28s ease',
                      width: menuOpen && i===1 ? 0 : menuOpen && i===0 ? 16 : menuOpen && i===2 ? 16 : i===1 ? 10 : 16,
                      height:1.5,
                      transform: menuOpen && i===0 ? 'translateY(6.5px) rotate(45deg)'
                               : menuOpen && i===2 ? 'translateY(-6.5px) rotate(-45deg)'
                               : 'none',
                      opacity: menuOpen && i===1 ? 0 : 1,
                    }} />
                  ))}
                </button>
              </div>
            </div>
            )
          })()}

          {/* ── Hamburger slide panel ── */}
          {isMobile && menuOpen && (
            <>
              {/* Backdrop */}
              <div onClick={() => setMenuOpen(false)} style={{
                position:'fixed', inset:0, zIndex:150,
                background:'rgba(15,5,30,0.28)', backdropFilter:'blur(6px)',
                animation:'tabFade 0.22s ease both',
              }} />
              {/* Panel */}
              <div style={{
                position:'fixed', top:0, right:0, bottom:0, zIndex:151,
                width:'76%', maxWidth:300,
                background:'rgba(255,250,244,0.55)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
                borderLeft:'1px solid rgba(200,123,82,0.12)',
                boxShadow:'-12px 0 40px rgba(0,0,0,0.08)',
                display:'flex', flexDirection:'column',
                padding:'52px 22px 32px',
                animation:'slideInRight 0.36s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
                {/* Profile */}
                <div style={{
                  display:'flex', alignItems:'center', gap:14, marginBottom:28,
                  paddingBottom:22, borderBottom:'1px solid rgba(0,0,0,0.07)',
                }}>
                  <div style={s.avatar}>{profil.nom?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#1a0a00' }}>{profil.nom}</div>
                    <div style={{ fontSize:11, color:'#a89b8c', marginTop:2 }}>Niveau {level} · {xp} XP</div>
                  </div>
                </div>
                {/* Nav links */}
                {navItems.map(({ id, Icon, label }) => (
                  <button key={id} onClick={() => { setOnglet(id); setMenuOpen(false) }} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:14,
                    border:'none', background: onglet===id ? 'rgba(200,123,82,0.08)' : 'transparent',
                    cursor:'pointer', fontFamily:F, width:'100%', textAlign:'left',
                    color: onglet===id ? '#C87B52' : '#4a3728', fontWeight: onglet===id ? 700 : 500,
                    fontSize:14, marginBottom:3,
                    boxShadow: onglet===id ? 'inset 0 0 0 1px rgba(200,123,82,0.18)' : 'none',
                  }}>
                    <Icon color={onglet===id ? '#C87B52' : '#8a7265'} size={18} />
                    {label}
                  </button>
                ))}
                {/* Bottom actions */}
                <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:8 }}>
                  {!isPro && (
                    <button style={s.btnPro} onClick={() => { passerPro(); setMenuOpen(false) }}>
                      <FlashIcon size={14} color="#fff" /> Solenn Pro — 4.99€/mois
                    </button>
                  )}
                  <button style={{ ...s.btnEdit, display:'flex', alignItems:'center', gap:6 }}
                    onClick={() => { setProfilBackup(profil); setProfil(null); setMenuOpen(false) }}>
                    ✏ Modifier mon profil
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Tab content (keyed for fade-in animation on tab switch) ── */}
          <div key={onglet} style={{ animation:'tabFade 0.28s ease both', flex:1, display:'flex', flexDirection:'column' }}>

          {/* ── Accueil ── */}
          {onglet === 'accueil' && (
            <HomeTab
              profil={profil}
              metriques={metriques}
              score={score}
              scoreColor={scoreColor}
              onLog={() => setOnglet('sante')}
              onUpdate={mettreAJourMetrique}
              onSwitchTab={setOnglet}
              onChat={envoyerMessage}
              streak={streak}
              xp={xp}
              level={level}
            />
          )}

          {/* ── Chat ── */}
          {onglet === 'chat' && (
            <div style={s.chatWrap}>
              <div className="aurora-bg" />
              {/* Page header — desktop only */}
              {!isMobile && (
                <div style={s.pageHeader}>
                  <div>
                    <div style={{...s.pageTitle, display:'flex', alignItems:'center', gap:8}}><ChatIcon size={20} color="#C87B52" /> Coach IA</div>
                    <div style={s.pageSubtitle}>Pose n'importe quelle question à Solenn</div>
                  </div>
                </div>
              )}

              <div style={s.chatBox}>
                {messages.length === 0 && (
                  <div style={s.emptyChat}>
                    {streak > 0 && (
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                        <span style={{ background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)', border:'1px solid rgba(200,123,82,0.18)', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:700, color:'rgba(180,100,30,0.85)', display:'flex', alignItems:'center', gap:5 }}>
                          🔥 {streak} jour{streak > 1 ? 's' : ''} de suite
                        </span>
                      </div>
                    )}
                    <div style={s.emptyChatTitle}>
                      {(() => { const h=new Date().getHours(); return h<12?'🌅 Bonjour':h<18?'☀️ Salut':'🌙 Bonsoir' })()} {profil?.nom} !
                    </div>
                    <div style={s.emptyChatSub}>Nutrition · Bien-être · Style · Gestion du stress</div>
                    <div style={s.suggestionsPile}>
                      {suggestions.map((sug, i) => (
                        <button key={i} style={s.suggestionBig} onClick={() => envoyerMessage(sug)}>
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={msg.role==='user' ? s.userMsg : s.botMsg}>
                    <div style={{ display:'flex', flexDirection:'column', gap:4, maxWidth: msg.role==='user' ? '76%' : isRich(msg.content) ? '90%' : '82%' }}>
                      <div style={
                        msg.role==='user'
                          ? s.userBubble
                          : isRich(msg.content) ? s.botBubbleRich : s.botBubble
                      }>
                        {msg.role==='user'
                          ? msg.content
                          : (
                            <MsgBoundary fallback={msg.content}>
                              <ResponseRenderer content={msg.content} />
                            </MsgBoundary>
                          )
                        }
                      </div>
                      {msg.role === 'assistant' && (
                        <div style={{ display:'flex', gap:5, paddingLeft:4 }}>
                          {['👍','💡','❤️'].map(emoji => (
                            <ReactionBtn
                              key={emoji}
                              emoji={emoji}
                              active={reactions[i] === emoji}
                              onClick={() => setReactions(prev => ({ ...prev, [i]: prev[i]===emoji ? null : emoji }))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={s.botMsg}>
                    <div style={s.botBubble}>
                      <span style={{ display:'inline-flex', gap:5, alignItems:'center' }}>
                        {[0, 0.18, 0.36].map((d,i) => (
                          <span key={i} style={{ width:7, height:7, borderRadius:'50%',
                            background:'linear-gradient(135deg,#C87B52,#E8A07A)',
                            display:'inline-block',
                            animation:`typing 0.8s ${d}s ease-in-out infinite alternate` }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Follow-up chips contextuelles après chaque réponse */}
              {followUps.length > 0 && !loading && (
                <div style={{ ...s.suggestionsRow, marginTop:4 }}>
                  {followUps.map((sug, i) => (
                    <button key={i} style={s.suggestion} onClick={() => { envoyerMessage(sug); setFollowUps([]) }}>
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              <div style={s.inputRow}>
                <div style={s.inputBox}>
                  <input style={s.inputChat}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && envoyerMessage()}
                    placeholder="Pose une question à Solenn..." />
                  <button style={s.sendBtn} onClick={() => envoyerMessage()}>
                    <SendIcon color="rgba(200,123,82,0.55)" size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Santé ── */}
          {onglet === 'sante' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0' }}>
              <div style={isMobile ? s.tabHeaderMobile : s.pageHeader}>
                {isMobile && <button style={s.backBtnInline} onClick={() => setOnglet('accueil')}><BackIcon color="#8a7265" size={18} /></button>}
                <div>
                  <div style={{...s.pageTitle, display:'flex', alignItems:'center', gap:8, color: isMobile ? '#C87B52' : undefined, fontSize: isMobile ? 14 : undefined, fontWeight: isMobile ? 600 : undefined }}>{!isMobile && <HeartIcon size={20} color="#ff3b30" />} {isMobile ? 'Santé' : 'Suivi Santé'}</div>
                  {!isMobile && <div style={s.pageSubtitle}>Tes métriques du jour</div>}
                </div>
              </div>
              <SanteTab metriques={metriques} profil={profil} onUpdate={mettreAJourMetrique} score={score} history={history} />
            </div>
          )}

          {/* ── Routine ── */}
          {onglet === 'routine' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0' }}>
              <div style={isMobile ? s.tabHeaderMobile : s.pageHeader}>
                {isMobile && <button style={s.backBtnInline} onClick={() => setOnglet('accueil')}><BackIcon color="#8a7265" size={18} /></button>}
                <div>
                  <div style={s.pageTitle}>{isMobile ? 'Routine' : '📋 Routine du jour'}</div>
                  {!isMobile && <div style={s.pageSubtitle}>Ton programme personnalisé</div>}
                </div>
              </div>
              <RoutineModule profil={profil} metriques={metriques} />
            </div>
          )}

          {/* ── Herbal ── */}
          {onglet === 'herbal' && (
            <HerbalTab
              profil={profil}
              onChat={msg => { setOnglet('chat'); envoyerMessage(msg) }}
              onBack={() => setOnglet('accueil')}
            />
          )}

          {/* ── Style ── */}
          {onglet === 'style' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0' }}>
              <div style={isMobile ? s.tabHeaderMobile : s.pageHeader}>
                {isMobile && <button style={s.backBtnInline} onClick={() => setOnglet('accueil')}><BackIcon color="#8a7265" size={18} /></button>}
                <div>
                  <div style={s.pageTitle}>{isMobile ? 'Style' : '👗 Style & Tenues'}</div>
                  {!isMobile && <div style={s.pageSubtitle}>Suggestions adaptées à la météo</div>}
                </div>
              </div>
              <TenuesModule profil={profil} />
            </div>
          )}

          {/* ── Forum ── */}
          {onglet === 'forum' && (
            <Forum onBack={() => setOnglet('accueil')} user={user} />
          )}

          </div>{/* end keyed tab wrapper */}

        </div>

        {/* ══ FLOATING NAVIGATION PILL (mobile) ══ */}
        {isMobile && (() => {
          const activeIdx = navItems.findIndex(n => n.id === onglet)
          return (
            <nav style={{
              position:'fixed', bottom:22, left:'50%', transform:'translateX(-50%)',
              display:'inline-flex', alignItems:'center',
              background:'rgba(180,110,65,0.10)',
              backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
              borderRadius:22,
              border:'1px solid rgba(200,123,82,0.14)',
              boxShadow:'0 4px 24px rgba(200,123,82,0.08), 0 1px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.70)',
              padding:'8px 6px',
              gap:2,
              zIndex:100,
              whiteSpace:'nowrap',
            }}>
              {/* Sliding active pill */}
              <div style={{
                position:'absolute', top:7, bottom:7,
                width:`calc((100% - 16px) / ${navItems.length})`,
                left:`calc(8px + ${activeIdx} * (100% - 16px) / ${navItems.length})`,
                background:'rgba(200,123,82,0.10)',
                borderRadius:15,
                border:'1px solid rgba(200,123,82,0.22)',
                boxShadow:'0 2px 10px rgba(200,123,82,0.16)',
                transition:'left 0.40s cubic-bezier(0.34,1.56,0.64,1)',
                pointerEvents:'none', zIndex:0,
              }} />
              {navItems.map(({ id, Icon, label }) => {
                const active = onglet === id
                const color  = active ? '#C87B52' : '#9e8c7c'
                return (
                  <button key={id}
                    style={{
                      position:'relative', zIndex:1,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                      padding:'7px 13px',
                      border:'none', background:'transparent', cursor:'pointer',
                      fontFamily:F, color,
                      transition:'color 0.2s ease',
                      minWidth:54,
                    }}
                    onClick={() => setOnglet(id)}>
                    <div style={{
                      transform: active ? 'scale(1.20) translateY(-1px)' : 'scale(1)',
                      transition:'transform 0.30s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                      <Icon color={color} size={21} />
                    </div>
                    <span style={{ fontSize:9, fontWeight: active ? 800 : 500, letterSpacing:'0.3px', transition:'font-weight 0.2s' }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </nav>
          )
        })()}
      </main>

      {/* Celebration overlay */}
      {celebrate && <CelebrationOverlay score={score} onDone={() => setCelebrate(false)} />}

      {/* Global animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        @keyframes oravBlink {
          0%, 85%, 100% { transform: scaleY(1); }
          91% { transform: scaleY(0.07); }
          96% { transform: scaleY(1); }
        }
        @keyframes typing {
          from { opacity:0.3; transform:scale(0.8); }
          to   { opacity:1;   transform:scale(1.2); }
        }
        @keyframes floatOrb {
          0%,100% { transform:translateY(0) scale(1); }
          50%      { transform:translateY(-18px) scale(1.03); }
        }
        @keyframes aurora {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 50% 0%; }
          50%  { background-position: 100% 50%; }
          75%  { background-position: 50% 100%; }
          100% { background-position: 0% 50%; }
        }
        .aurora-bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: linear-gradient(135deg,
            #FFD49A 0%, #F5C8AA 18%, #FFF4E0 36%,
            #E8B87A 52%, #EED4B0 68%, #FAE8CC 84%, #FFD49A 100%);
          background-size: 400% 400%;
          animation: aurora 14s ease infinite;
          opacity: 0.72;
        }
        @keyframes twinkle {
          from { opacity:0.1; transform:scale(0.7); }
          to   { opacity:0.8; transform:scale(1.4); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes popIn {
          0%   { transform:scale(0.88); opacity:0; }
          60%  { transform:scale(1.04); }
          100% { transform:scale(1); opacity:1; }
        }
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(50px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity:0; transform:translateX(-50px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes heroGradient {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes scoreGlow {
          0%,100% { opacity:0.4; transform:scale(1); }
          50%      { opacity:0.9; transform:scale(1.08); }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.45; transform:scale(0.72); }
        }
        @keyframes metricPulse {
          0%,100% { transform:scale(1); }
          50%      { transform:scale(1.06); }
        }
        @keyframes countIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes tabFade {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0) rotate(-20deg); opacity:0; }
          70%  { transform: scale(1.25) rotate(4deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes novaSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes btnLightSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes liquidRipple {
          0%   { transform: scale(1);  opacity: 0.55; }
          65%  { opacity: 0.12; }
          100% { transform: scale(32); opacity: 0; }
        }
        @keyframes metricSpring {
          0%   { transform: scale(0.84); }
          40%  { transform: scale(1.22); }
          65%  { transform: scale(0.95); }
          82%  { transform: scale(1.06); }
          100% { transform: scale(1.00); }
        }
        @keyframes metricGlowRing {
          0%   { transform: scale(0.85); opacity: 0.90; }
          100% { transform: scale(2.00); opacity: 0; }
        }
        @keyframes iconBounce {
          0%   { transform: scale(0.72) rotate(-10deg); }
          50%  { transform: scale(1.32) rotate(5deg); }
          100% { transform: scale(1.00) rotate(0deg); }
        }
        @keyframes novaBreath {
          0%,100% { transform: scale(1) translateZ(0); opacity: 0.65; }
          50%      { transform: scale(1.14) translateZ(0); opacity: 1; }
        }
        @keyframes liquidBlob1 {
          0%,100% { border-radius:62% 38% 46% 54%/60% 44% 56% 40%; transform:translate(0,0) scale(1); }
          25%     { border-radius:50% 50% 34% 66%/54% 38% 62% 46%; transform:translate(3%,5%) scale(1.05); }
          50%     { border-radius:38% 62% 58% 42%/46% 58% 42% 54%; transform:translate(-2%,9%) scale(0.96); }
          75%     { border-radius:56% 44% 62% 38%/36% 62% 38% 64%; transform:translate(5%,2%) scale(1.03); }
        }
        @keyframes liquidBlob2 {
          0%,100% { border-radius:54% 46% 62% 38%/46% 60% 40% 54%; transform:translate(0,0) scale(1); }
          33%     { border-radius:38% 62% 44% 56%/62% 44% 56% 38%; transform:translate(-4%,-5%) scale(1.07); }
          66%     { border-radius:62% 38% 54% 46%/38% 54% 46% 62%; transform:translate(3%,-7%) scale(0.93); }
        }
        @keyframes liquidBlob3 {
          0%,100% { border-radius:50% 50% 50% 50%/50% 50% 50% 50%; transform:translate(0,0) scale(1); }
          50%     { border-radius:36% 64% 60% 40%/64% 36% 64% 36%; transform:translate(-5%,8%) scale(1.13); }
        }
        @keyframes liquidBlob4 {
          0%,100% { border-radius:60% 40% 60% 40%/40% 60% 40% 60%; transform:translate(0,0) scale(1); }
          50%     { border-radius:40% 60% 38% 62%/60% 38% 62% 40%; transform:translate(7%,-6%) scale(1.10); }
        }
        @keyframes novaFloat {
          0%,100% { transform: translateY(0px) scale(1); }
          33%      { transform: translateY(-6px) scale(1.02); }
          66%      { transform: translateY(3px) scale(0.99); }
        }
        @keyframes meshGrad {
          0%,100% { background-position: 0% 50%; }
          33%      { background-position: 100% 0%; }
          66%      { background-position: 50% 100%; }
        }
        @keyframes shimmerGrad {
          0%   { background-position: 200% 0; }
          50%  { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes celebFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh)  rotate(640deg); opacity: 0; }
        }
        @keyframes celebPop {
          0%   { transform: scale(0.45) rotate(-6deg); opacity: 0; }
          60%  { transform: scale(1.07) rotate(2deg);  opacity: 1; }
          100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
        }
        @keyframes swipeHint {
          0%,100% { transform: translateX(0) translateY(-50%); opacity:0.3; }
          50%      { transform: translateX(6px) translateY(-50%); opacity:0.7; }
        }
        @keyframes shimmerDot {
          0%,100% { opacity:0.5; transform:scaleX(1); }
          50%      { opacity:1;   transform:scaleX(1.15); }
        }
        @keyframes pulseDot1 {
          0%,100% { transform:scale(1);    opacity:0.7; }
          50%      { transform:scale(1.35); opacity:1; }
        }
        @keyframes pulseDot2 {
          0%,100% { transform:scale(1);    opacity:0.85; box-shadow:0 0 8px rgba(200,123,82,0.4); }
          50%      { transform:scale(1.4);  opacity:1;    box-shadow:0 0 16px rgba(200,123,82,0.7); }
        }
        @keyframes pulseDot3 {
          0%,100% { transform:scale(1);    opacity:0.7; }
          50%      { transform:scale(1.35); opacity:1; }
        }
        @keyframes particleFloat {
          0%,100% { transform: translate(0px, 0px) scale(1); opacity: 0.4; }
          25%      { transform: translate(3px, -7px) scale(1.6); opacity: 0.85; }
          60%      { transform: translate(-4px, 4px) scale(0.7); opacity: 0.35; }
        }
        @keyframes capsuleSkeleton {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        /* Custom Scrollbar Pro — gradient violet, 5px, auto-hide */
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; border-radius:10px; }
        ::-webkit-scrollbar-thumb {
          background:linear-gradient(180deg, #C87B52 0%, #E8A07A 100%);
          border-radius:10px;
          transition:width 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover { background:linear-gradient(180deg,#E8A07A,#C87B52); }
        * { scrollbar-width:thin; scrollbar-color:#C87B52 transparent; }
      `}</style>
    </div>
  )
}

// ─── ROUTINE MODULE ───────────────────────────────────────────────────────────
function RoutineModule({ profil, metriques }) {
  const [routine, setRoutine]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [routineError, setRoutineError] = useState(false)
  const [checkedSteps, setCheckedSteps] = useState({})

  async function genererRoutine() {
    setLoading(true); setCheckedSteps({}); setRoutineError(false)
    try {
      const res = await fetch('/api/routine', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil, metriques })
      })
      const data = await res.json()
      if (data.erreur) setRoutineError(true)
      else setRoutine(data)
    } catch { setRoutineError(true) }
    setLoading(false)
  }

  function toggleStep(id) {
    setCheckedSteps(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
  const doneTotal = Object.values(checkedSteps).filter(Boolean).length
  const stepsTotal = routine
    ? ((routine.matin?.etapes?.length||0) + (routine.apresmidi?.etapes?.length||0) + (routine.soir?.etapes?.length||0))
    : 0

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={sr.header}>
        <div>
          <div style={sr.date}>{today}</div>
          <div style={sr.titre}>Ta routine du jour</div>
        </div>
        <button style={{...sr.btnGen, display:'flex', alignItems:'center', gap:6}} onClick={genererRoutine} disabled={loading}>
          {loading ? <><LoadingIcon size={14} color="#fff" /> Génération...</> : routine ? <><RefreshIcon size={14} color="#fff" /> Regénérer</> : <><SparkleIcon size={14} color="#fff" /> Générer</>}
        </button>
      </div>

      {stepsTotal > 0 && (
        <div style={sr.progressBar}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#1a0a00' }}>Progression</span>
            <span style={{ fontSize:12, color:'#C87B52', fontWeight:700 }}>{doneTotal}/{stepsTotal}</span>
          </div>
          <div style={{ height:6, background:'#f0e8e0', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${stepsTotal>0?(doneTotal/stepsTotal)*100:0}%`,
              background:'linear-gradient(90deg,#C87B52,#E8A07A)', borderRadius:4, transition:'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {routineError && (
        <div style={{ ...sr.empty, background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:16, padding:24 }}>
          <div style={{ fontSize:32, marginBottom:10, color:'#c62828' }}>!</div>
          <div style={{ fontSize:14, color:'#c62828', fontWeight:600, marginBottom:8 }}>La génération a échoué</div>
          <div style={{ fontSize:12, color:'#8a7265' }}>Vérifie ta connexion et réessaie</div>
        </div>
      )}

      {!routine && !loading && !routineError && (
        <div style={sr.empty}>
          <div style={{ marginBottom:14 }}><RoutineIcon size={48} color="#c4b5a8" /></div>
          <div style={{ fontSize:15, color:'#1a0a00', fontWeight:700, marginBottom:6 }}>Ta routine personnalisée</div>
          <div style={{ fontSize:12, color:'#8a7265' }}>Adaptée à ton rythme · {profil.reveil} → {profil.coucher}</div>
        </div>
      )}

      {routine && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {routine.motivation && (
            <div style={sr.motivCard}>
              <div style={{ marginBottom:8 }}><SparkleIcon size={20} color="#C87B52" /></div>
              <div style={{ fontSize:14, fontWeight:600, color:'#C87B52', lineHeight:1.65 }}>{routine.motivation}</div>
            </div>
          )}
          {routine.matin && (
            <RoutineSection id="matin" iconEl={<SunIcon size={18} color="#C87B52" />} titre={routine.matin.titre} heure={routine.matin.heure}
              etapes={routine.matin.etapes} accent="#C87B52" checked={checkedSteps} onToggle={toggleStep} />
          )}
          {routine.nutrition && <NutritionCard nutrition={routine.nutrition} />}
          {routine.apresmidi && (
            <RoutineSection id="apresmidi" iconEl={<SunIcon size={18} color="#ff9500" />} titre={routine.apresmidi.titre} heure={routine.apresmidi.heure}
              etapes={routine.apresmidi.etapes} accent="#ff9500" checked={checkedSteps} onToggle={toggleStep} />
          )}
          {routine.soir && (
            <RoutineSection id="soir" iconEl={<MoonIcon size={18} color="#5856d6" />} titre={routine.soir.titre} heure={routine.soir.heure}
              etapes={routine.soir.etapes} accent="#5856d6" checked={checkedSteps} onToggle={toggleStep} />
          )}
          {routine.astuce && (
            <div style={sr.card}>
              <div style={sr.cardHeader}>
                <span style={{ fontSize:20 }}>{routine.astuce.emoji}</span>
                <span style={{ ...sr.cardTitre, color:'#C87B52' }}>{routine.astuce.titre}</span>
              </div>
              <div style={{ fontSize:13, color:'#8a7265', lineHeight:1.7 }}>{routine.astuce.conseil}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NutritionCard({ nutrition }) {
  return (
    <div style={{ ...sr.card, borderTop:'3px solid #34c759' }}>
      <div style={sr.cardHeader}>
        <span style={{ fontSize:20, display:'flex', alignItems:'center' }}><FoodIcon size={20} color="#34c759" /></span>
        <span style={{ ...sr.cardTitre, color:'#34c759' }}>{nutrition.titre}</span>
      </div>
      {nutrition.repas?.map((r, i) => (
        <div key={i} style={sr.repasRow}>
          <span style={{ fontSize:18, display:'flex', alignItems:'center' }}><FoodIcon size={16} color="#8a7265" /></span>
          <div style={{ fontSize:13, color:'#8a7265', lineHeight:1.5 }}>
            <strong style={{ color:'#1a0a00' }}>{r.moment}</strong> — {r.suggestion}
          </div>
        </div>
      ))}
      {nutrition.supplements?.length > 0 && (
        <div style={{ fontSize:12, color:'#34c759', background:'rgba(52,199,89,0.08)', borderRadius:8, padding:'6px 12px', marginTop:8, border:'1px solid rgba(52,199,89,0.2)' }}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><PillIcon size={13} color="#34c759" />{nutrition.supplements.join(' · ')}</span>
        </div>
      )}
    </div>
  )
}

function RoutineSection({ id, icon, iconEl, titre, heure, etapes, accent, checked, onToggle }) {
  const doneCount = etapes?.filter((_, i) => checked[`${id}_${i}`]).length || 0
  const total = etapes?.length || 0
  return (
    <div style={{ ...sr.card, borderTop:`3px solid ${accent}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20, display:'flex', alignItems:'center' }}>{iconEl || icon}</span>
          <div>
            <div style={{ ...sr.cardTitre, color: accent }}>{titre}</div>
            {heure && <div style={{ fontSize:11, color:'#c4b5a8', marginTop:1 }}>{heure}</div>}
          </div>
        </div>
        {total > 0 && (
          <div style={{ fontSize:11, color: doneCount===total ? accent : '#c4b5a8', fontWeight:700,
            background: doneCount===total ? accent+'15' : '#f8f4f0', padding:'2px 8px', borderRadius:6 }}>
            {doneCount}/{total}
          </div>
        )}
      </div>
      {etapes?.map((e, i) => {
        const done = checked[`${id}_${i}`]
        return (
          <div key={i} style={{ ...sr.etapeRow, opacity: done ? 0.55 : 1 }} onClick={() => onToggle(`${id}_${i}`)}>
            <div style={{ width:24, height:24, borderRadius:8, flexShrink:0, cursor:'pointer',
              border: `1.5px solid ${done ? accent : '#e5ddd5'}`,
              background: done ? accent+'18' : '#ffffff',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {done && <span style={{ fontSize:12, color:accent }}>✓</span>}
            </div>
            <span style={{ fontSize:18, minWidth:26, flexShrink:0 }}>{e.emoji}</span>
            <div>
              <div style={{ fontWeight:600, fontSize:13, color:'#1a0a00', textDecoration: done ? 'line-through' : 'none' }}>{e.action || e.titre}</div>
              <div style={{ fontSize:12, color:'#8a7265', marginTop:2 }}>{e.detail || e.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const sr = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, padding:'8px 0' },
  date: { fontSize:11, color:'#c4b5a8', textTransform:'capitalize', letterSpacing:0.5, fontWeight:500 },
  titre: { fontSize:20, fontWeight:800, color:'#1a0a00', marginTop:3, letterSpacing:'-0.3px' },
  btnGen: { background:'linear-gradient(135deg,#C87B52,#9E5C35)', color:'#fff', border:'none',
    padding:'10px 18px', borderRadius:13, fontSize:12, fontWeight:700, cursor:'pointer',
    boxShadow:'0 4px 16px rgba(200,123,82,0.38)', flexShrink:0, fontFamily:"'Inter',system-ui,sans-serif" },
  progressBar: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:14,
    padding:'12px 16px', marginBottom:14, boxShadow:'0 2px 10px rgba(0,0,0,0.04)' },
  empty: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:20, padding:'48px 32px',
    textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  motivCard: { background:'rgba(0,0,0,0.025)',
    border:'1px solid #E8E6E2', borderRadius:18, padding:20, textAlign:'center' },
  card: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:18, padding:'16px 16px',
    boxShadow:'0 2px 12px rgba(0,0,0,0.05)' },
  cardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  cardTitre: { fontSize:14, fontWeight:700, color:'#1a0a00' },
  etapeRow: { display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0',
    borderTop:'1px solid #f8f4f0', cursor:'pointer' },
  repasRow: { display:'flex', gap:10, alignItems:'center', padding:'6px 0',
    borderTop:'1px solid #f8f4f0' },
}

// ─── TENUES MODULE — CAPSULE SLIDER 3D ───────────────────────────────────────

function TenueCard({ tenue, style: extraStyle }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [imgLoading, setImgLoading] = useState(true)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const q = tenue.imagePrompt || tenue.description || tenue.titre
    fetch(`/api/image?prompt=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => {
        if (d.url) { setImgSrc(d.url); setImgLoading(false) }
        else { setImgError(true); setImgLoading(false) }
      })
      .catch(() => { setImgError(true); setImgLoading(false) })
  }, [])

  return (
    <div style={{
      width: 280,
      borderRadius: 28,
      overflow: 'hidden',
      background: '#FFF3EC',
      boxShadow: '0 16px 48px rgba(158,92,53,0.22), 0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid rgba(200,123,82,0.18)',
      flexShrink: 0,
      ...extraStyle,
    }}>
      {/* Image area */}
      <div style={{ width: '100%', height: 320, background: '#F5E8DE', overflow: 'hidden', position: 'relative' }}>
        {imgLoading && (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(110deg, #F5E8DE 30%, #FCDEC8 50%, #F5E8DE 70%)',
            backgroundSize: '200% 100%',
            animation: 'capsuleSkeleton 1.4s ease infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 32, opacity: 0.35 }}>👗</span>
          </div>
        )}
        {imgError && !imgLoading && (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#F5E8DE',
          }}>
            <span style={{ fontSize: 40 }}>👗</span>
            <span style={{ fontSize: 11, color: '#C87B52', fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>{tenue.titre}</span>
          </div>
        )}
        {imgSrc && (
          <img
            src={imgSrc}
            alt={tenue.titre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => { setImgError(true); setImgSrc(null) }}
          />
        )}
      </div>
      {/* Info area */}
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ fontWeight: 800, color: '#C87B52', fontSize: 14, marginBottom: 6, letterSpacing: '-0.01em' }}>
          {tenue.titre}
        </div>
        <div style={{ fontSize: 12, color: '#6B4226', lineHeight: 1.65, marginBottom: 8 }}>
          {tenue.description}
        </div>
        <div style={{
          fontSize: 11, color: '#9E5C35', fontStyle: 'italic', lineHeight: 1.55,
          display: 'flex', alignItems: 'flex-start', gap: 5,
          background: 'rgba(200,123,82,0.07)', borderRadius: 10, padding: '6px 10px',
        }}>
          <LightbulbIcon size={12} color="#C87B52" />
          <span>{tenue.pourquoi}</span>
        </div>
      </div>
    </div>
  )
}

// Skeleton card shown while tenues are loading
function SkeletonCard({ style: extraStyle }) {
  return (
    <div style={{
      width: 280,
      borderRadius: 28,
      overflow: 'hidden',
      background: '#FFF3EC',
      boxShadow: '0 8px 24px rgba(158,92,53,0.12)',
      border: '1px solid rgba(200,123,82,0.12)',
      flexShrink: 0,
      ...extraStyle,
    }}>
      <div style={{
        width: '100%', height: 320,
        background: 'linear-gradient(110deg, #F5E8DE 30%, #FCDEC8 50%, #F5E8DE 70%)',
        backgroundSize: '200% 100%',
        animation: 'capsuleSkeleton 1.4s ease infinite',
      }} />
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ height: 14, borderRadius: 7, background: '#F0DDD0', marginBottom: 10, width: '60%', animation: 'capsuleSkeleton 1.4s ease infinite' }} />
        <div style={{ height: 10, borderRadius: 5, background: '#F5E8DE', marginBottom: 6, animation: 'capsuleSkeleton 1.4s ease infinite' }} />
        <div style={{ height: 10, borderRadius: 5, background: '#F5E8DE', width: '80%', animation: 'capsuleSkeleton 1.4s ease infinite' }} />
      </div>
    </div>
  )
}

function CapsuleSlider({ tenues, loading }) {
  const [active, setActive] = useState(0)
  const touchStartX = useRef(null)
  const containerRef = useRef(null)
  const count = loading ? 6 : tenues.length
  const clamp = v => Math.max(0, Math.min(count - 1, v))

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') setActive(a => clamp(a - 1))
      if (e.key === 'ArrowRight') setActive(a => clamp(a + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count])

  // Reset active index when tenues change
  useEffect(() => { setActive(0) }, [tenues.length])

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -40) setActive(a => clamp(a + 1))
    else if (dx > 40) setActive(a => clamp(a - 1))
    touchStartX.current = null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, userSelect: 'none' }}>
      {/* 3D Stage */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          height: 520,
          perspective: '900px',
          overflow: 'visible',
        }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const rel = i - active
          const abs = Math.abs(rel)
          if (abs > 2) return null
          const x = rel * 48
          const y = abs * 18
          const z = -abs * 90
          const scale = 1 / (1 + abs * 0.12)
          const rotate = rel * 8
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.75 : 0.5
          const zIndex = 10 - abs

          const cardStyle = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%,-50%) translateX(${x}px) translateY(${y}px) translateZ(${z}px) scale(${scale}) rotateZ(${rotate}deg)`,
            opacity,
            zIndex,
            transition: 'transform 0.5s cubic-bezier(.4,2,.3,1), opacity 0.4s ease',
            cursor: abs === 0 ? 'default' : 'pointer',
          }

          if (loading) return <SkeletonCard key={i} style={cardStyle} />
          return (
            <TenueCard
              key={i}
              tenue={tenues[i]}
              style={cardStyle}
            />
          )
        })}
      </div>

      {/* Navigation buttons + dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 }}>
        <button
          onClick={() => setActive(a => clamp(a - 1))}
          disabled={active === 0}
          style={{
            width: 40, height: 40, borderRadius: 24,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(200,123,82,0.25)',
            boxShadow: '0 2px 12px rgba(200,123,82,0.18)',
            color: '#C87B52', fontSize: 18, fontWeight: 700,
            cursor: active === 0 ? 'not-allowed' : 'pointer',
            opacity: active === 0 ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.2s',
            fontFamily: 'sans-serif',
          }}
          aria-label="Précédent"
        >
          ←
        </button>

        {/* Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                height: 6,
                width: i === active ? 18 : 6,
                borderRadius: 6,
                background: i === active ? '#C87B52' : 'rgba(200,123,82,0.28)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.35s cubic-bezier(.4,2,.3,1), background 0.2s',
              }}
              aria-label={`Tenue ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setActive(a => clamp(a + 1))}
          disabled={active === count - 1}
          style={{
            width: 40, height: 40, borderRadius: 24,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(200,123,82,0.25)',
            boxShadow: '0 2px 12px rgba(200,123,82,0.18)',
            color: '#C87B52', fontSize: 18, fontWeight: 700,
            cursor: active === count - 1 ? 'not-allowed' : 'pointer',
            opacity: active === count - 1 ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.2s',
            fontFamily: 'sans-serif',
          }}
          aria-label="Suivant"
        >
          →
        </button>
      </div>
    </div>
  )
}

function TenuesModule({ profil }) {
  const [ouvert, setOuvert]     = useState(false)
  const [ville, setVille]       = useState('')
  const [occasion, setOccasion] = useState('Casual')
  const [tenues, setTenues]     = useState([])
  const [meteo, setMeteo]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [villeError, setVilleError] = useState(false)
  const occasions = ['Travail','Casual','Soirée','Sport','Rendez-vous','Voyage']

  async function getTenues() {
    if (!ville.trim()) { setVilleError(true); return }
    setVilleError(false)
    setLoading(true); setTenues([])
    try {
      const res = await fetch('/api/tenues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profil, ville, occasion })
      })
      const data = await res.json()
      setTenues(data.tenues || [])
      setMeteo(data.meteo)
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Trigger */}
      <button style={st.trigger} onClick={() => setOuvert(!ouvert)}>
        <div style={st.triggerIcon}><span style={{ fontSize: 22 }}>👗</span></div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a0a00' }}>Idées tenues du jour</div>
          <div style={{ fontSize: 12, color: '#8a7265', marginTop: 2 }}>Capsule Slider · Adaptées à la météo</div>
        </div>
        <span style={{ color: '#c4b5a8' }}>{ouvert ? '▲' : '▼'}</span>
      </button>

      {ouvert && (
        <div style={st.panel}>
          {/* Controls */}
          <div style={st.row}>
            <input
              style={{ ...st.input, borderColor: villeError ? '#ff3b30' : undefined }}
              placeholder="Ta ville (ex: Paris)" value={ville}
              onChange={e => { setVille(e.target.value); setVilleError(false) }}
              onKeyDown={e => e.key === 'Enter' && getTenues()}
            />
            <select style={st.select} value={occasion} onChange={e => setOccasion(e.target.value)}>
              {occasions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button style={st.btn} onClick={getTenues} disabled={loading}>
              {loading ? <LoadingIcon size={16} color="#fff" /> : <SparkleIcon size={16} color="#fff" />}
            </button>
          </div>
          {villeError && <div style={{ fontSize: 12, color: '#ff3b30', marginTop: 4 }}>Entre ta ville pour continuer</div>}

          {/* Météo */}
          {meteo && (
            <div style={{ ...st.meteoBar, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <WeatherIcon size={16} color="#fbbf24" /> {meteo}
            </div>
          )}

          {/* Capsule Slider — loading skeletons OR tenues */}
          {(loading || tenues.length > 0) && (
            <div style={{ marginTop: 16 }}>
              <CapsuleSlider tenues={tenues} loading={loading} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const st = {
  trigger: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
    background: '#ffffff', border: '1px solid #f0e8e0', borderRadius: 18, cursor: 'pointer',
    fontFamily: "'Inter',system-ui,sans-serif", boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 2,
  },
  triggerIcon: {
    width: 48, height: 48,
    background: 'linear-gradient(135deg,rgba(200,123,82,0.12),rgba(200,123,82,0.06))',
    border: '1.5px solid rgba(200,123,82,0.2)', borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  panel: {
    background: '#ffffff', border: '1px solid #f0e8e0', borderRadius: 16, padding: 14, marginTop: 4,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  meteoBar: {
    background: 'rgba(200,123,82,0.06)', borderRadius: 10, padding: '8px 14px',
    fontSize: 12, marginBottom: 12, color: '#C87B52', fontWeight: 600, border: '1px solid rgba(200,123,82,0.16)',
  },
  row: { display: 'flex', gap: 8, marginBottom: 12 },
  input: {
    flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb',
    background: '#f9fafb', fontSize: 13, fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', color: '#1a0a00',
  },
  select: {
    padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb',
    background: '#f9fafb', fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif", outline: 'none', color: '#1a0a00',
  },
  btn: {
    padding: '10px 16px', background: 'linear-gradient(135deg,#C87B52,#9E5C35)', color: '#fff',
    border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Inter',system-ui,sans-serif", boxShadow: '0 4px 12px rgba(200,123,82,0.35)',
  },
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const F = "'Inter', system-ui, sans-serif"
const s = {
  app: { display:'flex', minHeight:'100vh', background:'transparent', fontFamily:F, position:'relative' },

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebar: {
    width:260, flexShrink:0,
    background:'rgba(255,255,255,0.82)',
    backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
    borderRight:'1px solid rgba(255,220,180,0.35)',
    boxShadow:'4px 0 24px rgba(0,0,0,0.05)',
    display:'flex', flexDirection:'column',
    padding:'2.8rem 1.4rem 2.4rem',
    position:'fixed', top:0, left:0, height:'100vh',
    zIndex:50, overflowY:'auto',
  },
  sidebarTop: { marginBottom:'2.8rem', paddingBottom:'2rem', borderBottom:'1px solid #E8E6E2' },
  logo: {
    fontSize:20, fontWeight:900, letterSpacing:'-0.04em',
    /* Géré par ShinyLogoText — statique par défaut, shimmer au hover/tap */
    background:'linear-gradient(90deg, #C87B52 0%, #F5C8AA 18%, #FFF3EC 34%, #F5C8AA 50%, #C87B52 66%, #FCDEC8 82%, #C87B52 100%)',
    backgroundSize:'250% 100%',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
  },
  logoSub: {
    fontSize:11, marginTop:3, letterSpacing:'0.06em', fontWeight:600,
    background:'linear-gradient(90deg, #38c1b6 0%, #a8e8e4 25%, #ffffff 45%, #a8e8e4 68%, #38c1b6 100%)',
    backgroundSize:'250% 100%',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
  },
  sidebarNav: { display:'flex', flexDirection:'column', gap:4, flex:1 },
  sidebarBottom: { display:'flex', flexDirection:'column', gap:8, marginTop:'2rem', paddingTop:'2rem', borderTop:'1px solid #f0e8e0' },
  nav: {
    display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:14,
    border:'none', background:'transparent', cursor:'pointer', fontFamily:F,
    color:'#8a7265', fontWeight:500, textAlign:'left', width:'100%', fontSize:13,
    transition:'background .2s, color .2s',
  },
  navActive: {
    display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:14,
    border:'none', background:'rgba(200,123,82,0.07)',
    cursor:'pointer', fontFamily:F, color:'#C87B52', fontWeight:700,
    textAlign:'left', width:'100%', fontSize:13, transition:'all .2s',
    boxShadow:'inset 0 0 0 1.5px rgba(200,123,82,0.18)',
  },
  profileCard: {
    display:'flex', alignItems:'center', gap:10,
    background:'rgba(0,0,0,0.025)',
    border:'1px solid #E8E6E2', borderRadius:14, padding:'12px 14px',
  },
  avatar: {
    width:36, height:36, borderRadius:10,
    background:'linear-gradient(135deg,#C87B52,#E8A07A)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:15, fontWeight:800, color:'#fff', flexShrink:0,
    boxShadow:'0 4px 12px rgba(200,123,82,.35)',
  },
  profileName: { fontSize:13, fontWeight:700, color:'#1a0a00', marginBottom:1 },
  profileMeta: { fontSize:10, color:'#c4b5a8', lineHeight:1.5 },
  btnPro: {
    background:'linear-gradient(135deg,#C87B52,#9E5C35)', color:'#fff', border:'none',
    padding:'11px 14px', borderRadius:12, cursor:'pointer', fontSize:12, fontFamily:F,
    fontWeight:700, boxShadow:'0 6px 20px rgba(200,123,82,.35)', textAlign:'center',
  },
  proBadge: {
    background:'rgba(200,123,82,.08)', color:'#C87B52',
    border:'1px solid rgba(200,123,82,.22)',
    padding:'8px 12px', borderRadius:10, fontSize:11, fontWeight:700, textAlign:'center',
  },
  btnEdit: {
    background:'transparent', color:'#8a7265', border:'1px solid #f0e8e0',
    padding:'9px 12px', borderRadius:10, cursor:'pointer', fontSize:12,
    fontFamily:F, fontWeight:500, textAlign:'center', width:'100%',
    transition:'border-color .2s, color .2s',
  },

  // ── Main ─────────────────────────────────────────────────────────────────────
  main: { flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1, minHeight:'100vh', background:'transparent' },
  content: { flex:1, maxWidth:860, width:'100%', margin:'0 auto', display:'flex', flexDirection:'column' },

  // ── Mobile header ─────────────────────────────────────────────────────────────
  mobileHeader: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'14px 18px 12px',
    borderBottom:'1px solid rgba(200,123,82,0.08)',
    background:'transparent',
    position:'sticky', top:0, zIndex:40,
  },
  backBtn: {
    width:36, height:36, borderRadius:12,
    background:'rgba(0,0,0,.04)', border:'1px solid rgba(0,0,0,.08)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
  },
  mobileTitle: { fontSize:14, fontWeight:600, color:'#C87B52', letterSpacing:'0.01em', flex:1, textAlign:'center', opacity:0.85 },
  scorePill: { borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700 },

  // ── Page header ───────────────────────────────────────────────────────────────
  pageHeader: { padding:'2.8rem 0 2rem', borderBottom:'1px solid #f0e8e0', marginBottom:'2rem' },
  tabHeaderMobile: { display:'flex', alignItems:'center', gap:10, padding:'16px 0 12px', marginBottom:4 },
  backBtnInline: {
    width:34, height:34, borderRadius:10,
    background:'rgba(0,0,0,.04)', border:'1px solid rgba(0,0,0,.08)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
  },
  pageTitle: { fontSize:18, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.03em', marginBottom:2 },
  pageSubtitle: { fontSize:12, color:'#c4b5a8', fontWeight:500 },

  // ── Chat ─────────────────────────────────────────────────────────────────────
  chatWrap: { display:'flex', flexDirection:'column', flex:1, padding:'0 2rem', paddingTop:'2rem', position:'relative', overflow:'hidden' },
  chatBox: { flex:1, minHeight:300, overflowY:'auto', marginBottom:10, paddingBottom:10, position:'relative', zIndex:1 },
  emptyChat: { textAlign:'center', padding:'5.6rem 2rem 2rem' },
  emptyChatIcon: { marginBottom:16 },
  emptyChatTitle: { fontSize:18, fontWeight:800, color:'rgba(100,65,25,0.88)', marginBottom:6, letterSpacing:'-0.03em' },
  emptyChatSub: { fontSize:13, color:'rgba(160,120,60,0.65)', marginBottom:32, lineHeight:1.7 },
  suggestionsPile: { display:'flex', flexDirection:'column', gap:8, maxWidth:360, margin:'0 auto' },
  suggestionBig: {
    background:'rgba(255,255,255,0.10)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
    border:'1px solid rgba(200,123,82,0.10)', borderRadius:16,
    padding:'13px 18px', fontSize:13, color:'rgba(100,65,25,0.78)', cursor:'pointer',
    fontFamily:F, textAlign:'left', fontWeight:500,
    transition:'transform .18s, box-shadow .18s',
  },

  userMsg: { display:'flex', justifyContent:'flex-end', marginBottom:16 },
  botMsg: { display:'flex', alignItems:'flex-start', marginBottom:16, gap:10 },
  userBubble: {
    background:'rgba(200,123,82,0.28)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
    border:'1px solid rgba(200,123,82,0.22)',
    color:'rgba(90,50,15,0.85)',
    padding:'13px 18px', borderRadius:'20px 20px 5px 20px', maxWidth:'76%',
    fontSize:14, lineHeight:1.65,
    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.35)',
  },
  botBubble: {
    background:'rgba(255,255,255,0.10)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
    border:'1px solid rgba(200,123,82,0.10)', color:'rgba(90,60,30,0.78)',
    padding:'13px 18px', borderRadius:'5px 20px 20px 20px', maxWidth:'82%',
    fontSize:14, lineHeight:1.72, whiteSpace:'pre-wrap',
    fontFamily:'Poppins, sans-serif',
  },
  botBubbleRich: {
    background:'transparent', color:'rgba(90,60,30,0.78)',
    padding:'4px 0', borderRadius:0, maxWidth:'90%', fontSize:14, lineHeight:1.72,
    fontFamily:'Poppins, sans-serif',
  },
  botAvatar: { fontSize:16, color:'#C87B52', marginTop:10, flexShrink:0, fontWeight:900 },

  suggestionsRow: { display:'flex', gap:7, marginBottom:10, flexWrap:'wrap', position:'relative', zIndex:1 },
  suggestion: {
    background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
    border:'1px solid rgba(200,123,82,0.18)', borderRadius:20,
    padding:'7px 14px', fontSize:12, color:'rgba(100,65,25,0.80)', cursor:'pointer',
    fontFamily:F, fontWeight:600,
  },

  inputRow: { paddingBottom:10, position:'relative', zIndex:1 },
  inputBox: {
    display:'flex', gap:8, background:'rgba(255,248,242,0.45)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
    borderRadius:20, padding:'8px 8px 8px 18px',
    border:'1px solid rgba(200,123,82,0.15)', alignItems:'center',
  },
  inputChat: { flex:1, border:'none', outline:'none', fontSize:14, fontFamily:F, background:'transparent', color:'#1a0a00' },
  sendBtn: {
    background:'transparent', border:'none',
    width:36, height:36, borderRadius:12, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  },

  // ── Bottom nav ────────────────────────────────────────────────────────────────
  bottomNav: {
    position:'fixed', bottom:0, left:0, right:0, display:'flex',
    background:'rgba(242,242,240,.97)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
    borderTop:'1px solid rgba(0,0,0,.06)',
    padding:'8px 6px 14px', zIndex:100,
    boxShadow:'0 -8px 40px rgba(0,0,0,.06)',
  },
  navBot: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0,
    padding:'6px 4px 2px', border:'none', background:'transparent', cursor:'pointer',
    fontFamily:F, color:'#c4b5a8', position:'relative', transition:'color .2s',
  },
  navBotActive: { color:'#C87B52' },
}
