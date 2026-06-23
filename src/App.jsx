import React, { useState, useRef, useEffect, useCallback, useMemo, Component, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'
import { playFx } from './sfx'
import SplashScreen from './SplashScreen'
import Auth from './Auth'
import Landing from './Landing'
import GlowLoader from './GlowLoader'
import MorningCheckin from './MorningCheckin'
import SettingsSheet from './SettingsSheet'

// Lazy — chargés uniquement quand l'utilisateur y accède
const Forum       = lazy(() => import('./Forum'))
const Onboarding  = lazy(() => import('./Onboarding'))
const HomeTab     = lazy(() => import('./HomeTab'))
const HerbalTab   = lazy(() => import('./HerbalTab'))
const SanteTab    = lazy(() => import('./SanteTab'))
const RoutineTab  = lazy(() => import('./RoutineTab'))
const ChatHistory = lazy(() => import('./ChatHistory'))
import { HomeIcon, ChatIcon, HeartIcon, RoutineIcon, LeafIcon, StyleIcon, ForumIcon, BackIcon, SendIcon, BellIcon, BellOffIcon, FlashIcon, StarIcon, TargetIcon, LightbulbIcon, MoonIcon, SunIcon, FoodIcon, PillIcon, RefreshIcon, SparkleIcon, CalendarIcon, LoadingIcon, WeatherIcon, RunIcon, ThumbsUpIcon } from './Icons'
import ResponseRenderer, { isRich } from './ResponseRenderer'

// ─── SHINY LOGO TEXT (statique par défaut, shimmer au hover/tap) ─────────────
function ShinyLogoText({ text, color = 'rgba(232,150,42,0.55)', gradient = null, animDuration = '8s', autoPlay = false, style = {} }) {
  return (
    <span style={{
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      ...style,
    }}>
      {/* Texte avec gradient ou couleur unie */}
      <span style={gradient ? {
        display: 'inline',
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } : { color }}>
        {text}
      </span>
      {/* Reflet miroir qui glisse */}
      <span style={{
        position: 'absolute', top: 0, left: '-100%',
        width: '45%', height: '100%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.50) 50%, transparent 100%)',
        transform: 'skewX(-18deg)',
        animation: autoPlay ? `mirrorSweep ${animDuration} ease-in-out infinite` : 'none',
        pointerEvents: 'none',
      }} />
    </span>
  )
}

// ─── SOLENN MASCOT FACE ──────────────────────────────────────────────────────
function SolennFace({ size = 34 }) {
  return (
    <div className="liquid-avatar" style={{
      width: size, height: size,
      background: 'rgba(220,140,70,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      isolation: 'isolate',
      transform: 'translateZ(0)',
    }}>
      <span style={{
        fontSize: size * 0.44,
        fontWeight: 700,
        color: 'rgba(255,230,190,0.92)',
        fontFamily: 'Poppins, sans-serif',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        userSelect: 'none',
      }}>S</span>
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
        <span style={{ whiteSpace:'pre-wrap', lineHeight:1.72, color:'rgba(55,22,5,0.90)' }}>
          {this.props.fallback}
        </span>
      )
    }
    return this.props.children
  }
}

// ─── HEALTH PERMISSION MODAL ─────────────────────────────────────────────────
function HealthPermModal({ onAllow, onLater }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1500,
      background:'rgba(20,8,0,0.11)', backdropFilter:'blur(8px)',
      WebkitBackdropFilter:'blur(8px)',
      display:'flex', alignItems:'flex-end', justifyContent:'center',
    }}>
      <div style={{
        background:'rgba(255,235,200,0.14)',
        backdropFilter:'blur(28px)',
        WebkitBackdropFilter:'blur(28px)',
        borderRadius:'28px 28px 0 0',
        border:'1px solid rgba(255,220,160,0.25)',
        borderBottom:'none',
        padding:'10px 26px 52px',
        width:'100%', maxWidth:520,
        boxShadow:'0 -20px 60px rgba(200,100,40,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
        animation:'slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{ width:44, height:5, background:'rgba(255,220,160,0.30)', borderRadius:12, margin:'12px auto 26px' }} />

        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:20 }}>
          {[
            { bg:'rgba(200,100,40,0.12)', icon: <HeartIcon size={28} color="rgba(200,100,40,0.80)" /> },
            { bg:'rgba(200,100,40,0.08)', icon: <RunIcon   size={28} color="rgba(200,100,40,0.70)" /> },
          ].map(({ bg, icon }, idx) => (
            <div key={idx} style={{ width:56, height:56, borderRadius:18, background:bg, border:'1px solid rgba(255,220,160,0.20)', display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
          ))}
        </div>

        <div style={{
          fontFamily:"'Poppins', system-ui, sans-serif",
          fontWeight:600,
          fontSize:'clamp(1.4rem, 2vw, 1.7rem)',
          color:'rgba(255,248,235,1)',
          textAlign:'center', marginBottom:8, letterSpacing:'-0.01em',
        }}>
          Synchroniser mes données santé
        </div>
        <div style={{ fontSize:13, fontFamily:'Poppins, sans-serif', color:'rgba(255,248,235,0.62)', textAlign:'center', lineHeight:1.75, marginBottom:22 }}>
          Solenn synchronise automatiquement depuis{' '}
          <strong style={{ color:'rgba(255,248,235,0.90)' }}>Apple Santé</strong> ou{' '}
          <strong style={{ color:'rgba(255,248,235,0.90)' }}>Google Fit</strong>.
        </div>

        {[
          { icon:'👟', label:'Activité & pas quotidiens' },
          { icon:'🌙', label:'Sommeil & récupération' },
          { icon:'💗', label:'Fréquence cardiaque' },
          { icon:'⚖️', label:'Poids & composition' },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'10px 14px', borderRadius:13, marginBottom:7,
            background:'rgba(200,100,40,0.06)', border:'1px solid rgba(255,220,160,0.18)',
          }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <span style={{ fontSize:13, fontFamily:'Poppins, sans-serif', color:'rgba(255,248,235,0.90)', fontWeight:500, flex:1 }}>{label}</span>
            <span style={{ fontSize:10, fontFamily:'Poppins, sans-serif', color:'rgba(255,248,235,0.90)', fontWeight:600, background:'rgba(255,220,160,0.22)', padding:'3px 8px', borderRadius:12, border:'1px solid rgba(255,220,160,0.35)' }}>Lecture seule</span>
          </div>
        ))}

        <div style={{ marginTop:22, display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={onAllow} style={{
            padding:'0.85rem 2.5rem', borderRadius:'2rem',
            border:'1px solid rgba(255,220,160,0.75)',
            background:'rgba(200,100,40,0.18)',
            color:'rgba(255,248,235,1)',
            fontFamily:"'Poppins', system-ui, sans-serif",
            fontWeight:600,
            fontSize:'clamp(1.2rem, 1.3vw, 1.4rem)',
            letterSpacing:'0.04em', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'background 0.25s, border-color 0.25s',
          }}>Autoriser l'accès →</button>
          <button onClick={onLater} style={{
            padding:'12px', borderRadius:'2rem',
            border:'1px solid rgba(255,220,160,0.45)',
            background:'rgba(255,220,160,0.08)',
            color:'rgba(255,248,235,0.88)',
            fontFamily:'Poppins, sans-serif',
            fontSize:13, fontWeight:500,
            cursor:'pointer',
          }}>Plus tard</button>
        </div>
      </div>
    </div>
  )
}

// ─── CELEBRATION OVERLAY ─────────────────────────────────────────────────────
function CelebrationOverlay({ score, onDone }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    let alive = true
    const t1 = setTimeout(() => { if (alive) setOut(true) }, 2700)
    const t2 = setTimeout(() => { if (alive) onDone() }, 3120)
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
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
          {score}<span style={{ fontSize:18, color:'rgba(200,123,82,0.6)', fontWeight:400 }}>/100</span>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:'#C87B52', marginTop:9 }}>
          {score >= 90 ? 'Journée parfaite ! 🏆' : score >= 80 ? 'Excellente journée !' : 'Objectif atteint !'}
        </div>
        <div style={{ fontSize:11, color:'rgba(160,110,70,0.70)', marginTop:5, fontWeight:500, letterSpacing:'0.3px' }}>
          Score santé du jour
        </div>
      </div>
    </div>
  )
}

function ReactionBtn({ emoji, icon, active, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); e.preventDefault(); onClick(); setPressed(true); setTimeout(() => setPressed(false), 350) }}
      style={{
        background: active ? 'rgba(200,123,82,0.15)' : 'transparent',
        border: active ? '1.5px solid rgba(200,123,82,0.60)' : '1.5px solid rgba(200,123,82,0.18)',
        borderRadius: 12, padding: '4px 9px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        transform: pressed ? 'scale(1.40)' : active ? 'scale(1.10)' : 'scale(1)',
        boxShadow: active ? '0 2px 10px rgba(200,123,82,0.20)' : 'none',
        filter: active ? 'none' : 'opacity(0.45)',
        outline: 'none',
      }}
    >
      {icon || emoji}
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

async function syncMetriquesSupabase(userId, m) {
  if (!userId) return
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('user_metrics').upsert({
    user_id: userId, date: today,
    pas: m.pas||0, sommeil: m.sommeil||0, eau: m.eau||0,
    fc: m.fc||0, humeur: m.humeur||0, poids: m.poids||0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,date' })
}

async function syncProfilSupabase(userId, profil) {
  if (!userId) return
  await supabase.from('profils').upsert({
    user_id: userId, profil,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

// Convertit base64url en Uint8Array pour VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// ─── DYNAMIC NAV ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'accueil', label:'Accueil',  Icon: HomeIcon },
  { id:'chat',    label:'Solenn',   Icon: ChatIcon },
  { id:'routine', label:'Routine',  Icon: RoutineIcon },
  { id:'sante',   label:'Santé',    Icon: HeartIcon },
  { id:'forum',   label:'Forum',    Icon: ForumIcon },
]

function DynamicNav({ onglet, setOnglet, forumUnread, F, preset = 'day' }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  const active = NAV_ITEMS.find(i => i.id === onglet) || NAV_ITEMS[0]

  const isNight = preset === 'night' && onglet === 'accueil'
  // Couleurs adaptées au mode nuit / jour
  const pillBg    = isNight ? 'rgba(10,22,58,0.60)'      : 'rgba(120,55,10,0.24)'
  const txtHigh   = isNight ? 'rgba(160,200,255,0.92)'   : 'rgba(255,238,228,0.90)'
  const txtMid    = isNight ? 'rgba(160,200,255,0.88)'   : 'rgba(255,238,228,0.88)'
  const txtDim    = isNight ? 'rgba(160,200,255,0.42)'   : 'rgba(255,238,228,0.35)'
  const divider   = isNight ? 'rgba(160,200,255,0.18)'   : 'rgba(255,238,228,0.18)'
  const activeBg  = isNight ? 'rgba(160,200,255,0.14)'   : 'rgba(255,238,228,0.14)'

  React.useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const t = setTimeout(() => window.addEventListener('click', handler), 80)
    return () => { clearTimeout(t); window.removeEventListener('click', handler) }
  }, [open])

  const spring = { type:'spring', damping:32, stiffness:280, mass:0.6 }
  const contentSpring = { type:'spring', damping:28, stiffness:260, mass:0.5 }

  return (
    <motion.nav
      ref={ref}
      layout
      layoutTransition={spring}
      onClick={!open ? () => setOpen(true) : undefined}
      style={{
        position:'fixed', bottom:'calc(env(safe-area-inset-bottom, 0px) + 16px)', left:16, right:16,
        marginLeft:'auto', marginRight:'auto',
        width:'fit-content',
        maxWidth:'calc(100vw - 32px)',
        zIndex:100, cursor: open ? 'default' : 'pointer',
        background: pillBg,
        backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
        border:'1px solid rgba(255,255,255,0.12)',
        borderRadius:28,
        boxShadow:'0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)',
        display:'flex', alignItems:'center',
        overflow:'hidden',
        padding: open ? '8px 6px' : '11px 18px',
        whiteSpace:'nowrap',
      }}
      transition={spring}
    >
      <AnimatePresence mode="wait" initial={false}>
        {/* ── Fermé ── */}
        {!open && (
          <motion.div key="closed"
            initial={{ opacity:0, scale:0.94 }}
            animate={{ opacity:1, scale:1, transition:{ delay:0.08, duration:0.22, ease:[0.22,1,0.36,1] } }}
            exit={{ opacity:0, scale:0.94, transition:{ duration:0.12, ease:[0.4,0,1,1] } }}
            style={{ display:'flex', alignItems:'center', gap:10 }}
          >
            <active.Icon color={txtHigh} size={19} />
            <span style={{ fontSize:13, fontWeight:500, color:txtMid, fontFamily:F }}>
              {active.label}
            </span>
            <div style={{ width:1, height:14, background:divider, margin:'0 4px' }} />
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:3.5, height:3.5, borderRadius:'50%', background:txtDim }} />)}
            </div>
          </motion.div>
        )}

        {/* ── Ouvert ── */}
        {open && (
          <motion.div key="open"
            initial={{ opacity:0 }}
            animate={{ opacity:1, transition:{ duration:0.18, ease:'easeOut' } }}
            exit={{ opacity:0, transition:{ duration:0.1 } }}
            style={{ display:'flex', alignItems:'center', gap:1 }}
          >
            {NAV_ITEMS.map((item, i) => {
              const isActive = onglet === item.id
              return (
                <motion.button key={item.id}
                  initial={{ opacity:0, filter:'blur(10px)' }}
                  animate={{ opacity:1, filter:'blur(0px)', transition:{ delay: 0.06 + i * 0.04, duration:0.22, ease:[0.22,1,0.36,1] } }}
                  onClick={() => { setOnglet(item.id); setOpen(false) }}
                  style={{
                    background: isActive ? activeBg : 'transparent',
                    border:'none', cursor:'pointer', borderRadius:14,
                    padding:'6px 10px', fontFamily:F,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                    position:'relative',
                  }}
                >
                  <item.Icon color={isActive ? txtHigh : txtDim} size={15} />
                  <span style={{ fontSize:8.5, fontWeight: isActive ? 600 : 400, letterSpacing:'0.25px', color: isActive ? txtHigh : txtDim }}>
                    {item.label}
                  </span>
                  {item.id === 'forum' && forumUnread > 0 && (
                    <span style={{ position:'absolute', top:4, right:8, background:'#ef4444', color:'#fff', fontSize:8, fontWeight:800, borderRadius:20, minWidth:13, height:13, lineHeight:'13px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 2px' }}>
                      {forumUnread > 9 ? '9+' : forumUnread}
                    </span>
                  )}
                </motion.button>
              )
            })}

          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// Copie locale de scoreJour — SanteTab ne l'exporte plus (Fast Refresh incompatible)
function scoreJour(m) {
  let s = 0
  if (m.pas  >= 10000) s += 20; else if (m.pas >= 7000) s += 15; else if (m.pas >= 5000) s += 10; else if (m.pas >= 2000) s += 5
  if (m.sommeil >= 7.5) s += 25; else if (m.sommeil >= 6) s += 18; else if (m.sommeil >= 5) s += 10; else if (m.sommeil > 0) s += 5
  if (m.eau >= 8) s += 20; else if (m.eau >= 6) s += 15; else if (m.eau >= 4) s += 10; else if (m.eau > 0) s += 5
  if (m.humeur === 5) s += 20; else if (m.humeur === 4) s += 15; else if (m.humeur === 3) s += 10; else if (m.humeur > 0) s += 5
  if (m.fc >= 50 && m.fc <= 80) s += 15; else if (m.fc > 0 && m.fc <= 100) s += 8
  return Math.min(s, 100)
}

// ─── PRESET HEURE (sunrise 6-9, day 9-18, sunset 18-21, night 21-6) ──────────
function getOceanPreset(hour) {
  if (hour >= 6  && hour < 9)  return 'sunrise'
  if (hour >= 9  && hour < 18) return 'day'
  if (hour >= 18 && hour < 21) return 'sunset'
  return 'night'
}

// ─── APP ══════════════════════════════════════════════════════════════════════
export default function App() {
  const FREE_LIMIT = 5

  const appPreset = getOceanPreset(new Date().getHours())
  const isSunrise = appPreset === 'sunrise'

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

  const [splashDone] = useState(true)
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
      const hr = new Date().getHours()
      const greet = hr < 6 ? 'Bonsoir' : hr < 12 ? 'Bonjour' : hr < 18 ? 'Salut' : 'Bonsoir'
      const nom = p.nom ? p.nom.charAt(0).toUpperCase() + p.nom.slice(1).toLowerCase() : ''
      // Streak depuis l'historique
      const hist = safeParse('vitacoach_history', [])
      const sorted = [...hist].sort((a,b) => new Date(b.date) - new Date(a.date))
      const todayStr = new Date().toDateString()
      const yStr = new Date(Date.now() - 86400000).toDateString()
      let streakC = 0
      if (sorted.length > 0 && (sorted[0].date === todayStr || sorted[0].date === yStr)) {
        let expected = sorted[0].date
        for (const e of sorted) {
          if (e.date === expected) {
            streakC++
            const d = new Date(expected); d.setDate(d.getDate() - 1); expected = d.toDateString()
          } else break
        }
      }
      // Score d'hier
      const yEntry = hist.find(e => e.date === yStr)
      const yScore = yEntry ? scoreJour(yEntry) : 0
      // Objectif principal
      const obj0 = (p.objectifs?.[0] || '').toLowerCase()
      const wantsEnergy = /énergie|fatigue|sport/.test(obj0)
      const wantsSleep  = /sommeil|dormir/.test(obj0)
      const wantsWeight = /poids|mincir|maigrir/.test(obj0)
      // Construire le message
      const parts = [`${greet} ${nom} !`]
      if (streakC >= 7)       parts.push(`🔥 ${streakC} jours de suite — tu es vraiment sur une lancée.`)
      else if (streakC >= 3)  parts.push(`🔥 ${streakC} jours consécutifs — ta régularité paie vraiment.`)
      else if (streakC === 2) parts.push(`2 jours de suite, tu prends de bonnes habitudes.`)
      if (yScore >= 80)           parts.push(`Hier tu étais au top (${yScore}/100) — continue comme ça.`)
      else if (yScore > 0 && yScore < 50) parts.push(`Hier c'était une journée difficile (${yScore}/100), aujourd'hui c'est une nouvelle page.`)
      if (hr >= 5 && hr < 10) {
        if (wantsEnergy)      parts.push(`Parfait moment pour booster ton énergie du matin.`)
        else if (wantsWeight) parts.push(`Belle matinée pour bien démarrer ton alimentation.`)
      } else if (hr >= 21) {
        if (wantsSleep)       parts.push(`N'oublie pas ta routine du soir pour bien dormir.`)
        else                  parts.push(`Comment s'est passée ta journée ?`)
      }
      parts.push(`Qu'est-ce que je peux faire pour toi ?`)
      return [{ role:'assistant', content: parts.join(' ') }]
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
  const [copiedIdx, setCopiedIdx]   = useState(null)
  const [kbOffset,  setKbOffset]    = useState(0)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const chatBoxRef = useRef(null)
  const [celebrate, setCelebrate]   = useState(false)
  const celebInitRef = useRef(false)
  const [showHealthPerm, setShowHealthPerm] = useState(false)
  const healthPermShownRef = useRef(false)
  const [history, setHistory]     = useState(() => safeParse('vitacoach_history', []))
  const [notifEnabled, setNotifEnabled] = useState(() => safeParse('vitacoach_notif', false))

  // ── Morning check-in ────────────────────────────────────────────────────────
  const [showCheckin, setShowCheckin] = useState(() => {
    const hr = new Date().getHours()
    const lastCheckin = localStorage.getItem('vitacoach_checkin_date')
    const todayStr = new Date().toDateString()
    return hr >= 6 && hr < 11 && lastCheckin !== todayStr
  })
  const [homePreset, setHomePreset] = useState('day')

  // ── Célébrations mémorables ──────────────────────────────────────────────────
  const [milestone, setMilestone]       = useState(null)   // { emoji, titre, texte }
  const milestoneShownRef               = useRef(false)

  // ── Mode SOS ─────────────────────────────────────────────────────────────────
  const [sosMode, setSosMode]           = useState(false)
  const sosResetRef                     = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [forumFormOpen, setForumFormOpen] = useState(false)
  const [forumUnread, setForumUnread]     = useState(0)
  const contentRef = useRef(null)
  const messagesEndRef = useRef(null)
  const isSendingRef   = useRef(false)   // verrou anti-doublon
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimerRef = useRef(null)

  // ── Calculs gamification — mémoïsés, ne recalculent que si history/messages changent ──
  const streak = useMemo(() => {
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
  }, [history])

  const xp    = useMemo(() =>
    history.length * 15 + messages.filter(m => m.role === 'user').length * 5
  , [history, messages])

  const level = Math.floor(xp / 100) + 1

  // ─── Son global sur tous les boutons (event delegation) ──────────────────
  useEffect(() => {
    function onTap(e) {
      const el = e.target.closest('button, [role="button"]')
      if (!el || el.disabled) return
      playFx('tap')
    }
    document.addEventListener('pointerdown', onTap, { passive: true })
    return () => document.removeEventListener('pointerdown', onTap)
  }, [])

  // Pré-warm Render dès le chargement de l'app
  useEffect(() => { fetch('/api/health').catch(() => {}) }, [])

  // Responsive
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const isMobile = windowWidth < 768

  // Clavier virtuel iOS — pousse la barre d'input vers le haut
  useEffect(() => {
    if (!window.visualViewport) return
    const update = () => {
      const off = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
      setKbOffset(Math.max(0, off))
    }
    window.visualViewport.addEventListener('resize', update)
    window.visualViewport.addEventListener('scroll', update)
    return () => {
      window.visualViewport.removeEventListener('resize', update)
      window.visualViewport.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])
  // ── Pause animations pendant le scroll ──────────────────────────────────────
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const onScroll = () => {
      setIsScrolling(true)
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 200)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(scrollTimerRef.current) }
  }, [])
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
      const sessionId = p.get('session_id')
      if (sessionId) localStorage.setItem('vitacoach_stripe_session', sessionId)
      window.history.replaceState({}, '', '/')
    }
  }, [])
  useEffect(() => {
    if (!user?.id) return
    const sessionId = localStorage.getItem('vitacoach_stripe_session')
    if (!sessionId) return
    fetch(`/api/check-subscription?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.active) {
          setIsPro(true)
          localStorage.setItem('vitacoach_pro', JSON.stringify(true))
        } else if (!data.active && isPro) {
          // Abonnement annulé
          setIsPro(false)
          localStorage.setItem('vitacoach_pro', JSON.stringify(false))
        }
      })
      .catch(() => {})
  }, [user?.id])

  // Célébration quand score atteint 80+ (une fois par jour)
  useEffect(() => {
    if (!celebInitRef.current) { celebInitRef.current = true; return }
    const today = new Date().toDateString()
    const sc = scoreJour(metriques)
    if (sc >= 80 && localStorage.getItem('vitacoach_celebrated') !== today) {
      localStorage.setItem('vitacoach_celebrated', today)
      setTimeout(() => setCelebrate(true), 400)
    }
  }, [metriques])

  // ── Micro-célébrations streak milestones ─────────────────────────────────
  useEffect(() => {
    if (!profil || streak === 0) return
    const today = new Date().toDateString()
    const key = `vitacoach_streak_cel_${today}_${streak}`
    if (localStorage.getItem(key)) return
    const milestones = {
      3:  '✨ 3 jours de suite — tu prends de vraies habitudes. Fière de toi.',
      7:  "🔥 7 jours consécutifs ! Une semaine entière — c'est un vrai changement qui s'installe.",
      14: '💎 14 jours ! Deux semaines de constance, c\'est vraiment impressionnant.',
      30: '🏆 30 jours ! Un mois de régularité. Tu n\'es plus la même qu\'au début.',
    }
    if (milestones[streak]) {
      localStorage.setItem(key, '1')
      setTimeout(() => setMessages(prev => [...prev, { role:'assistant', content: milestones[streak] }]), 900)
    }
  }, [streak, profil])

  // ── Sync Supabase → local à la connexion ──────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const today = new Date().toISOString().split('T')[0]

    // Charger le profil depuis Supabase (priorité sur localStorage)
    supabase.from('profils').select('profil').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.profil) {
          setProfil(data.profil)
          localStorage.setItem('vitacoach_profil', JSON.stringify(data.profil))
          // Sync isPro depuis Supabase (mis à jour par le webhook Stripe)
          if (data.profil.isPro === true) {
            setIsPro(true)
            localStorage.setItem('vitacoach_pro', JSON.stringify(true))
          }
        }
      })

    // Charger les métriques du jour depuis Supabase
    supabase.from('user_metrics').select('*').eq('user_id', user.id).eq('date', today).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const m = {
            date: new Date().toDateString(),
            pas: data.pas||0, sommeil: data.sommeil||0, eau: data.eau||0,
            fc: data.fc||0, humeur: data.humeur||0, poids: data.poids||0,
          }
          setMetriques(m)
          localStorage.setItem('vitacoach_metriques', JSON.stringify(m))
        }
      })
  }, [user?.id])

  // Permission apps santé — affichée une seule fois au 1er lancement après profil
  useEffect(() => {
    if (!profil || healthPermShownRef.current) return
    if (localStorage.getItem('vitacoach_health_perm')) return
    healthPermShownRef.current = true
    const t = setTimeout(() => setShowHealthPerm(true), 1800)
    return () => clearTimeout(t)
  }, [profil])

  function allowHealth() {
    localStorage.setItem('vitacoach_health_perm', 'granted')
    setShowHealthPerm(false)
  }
  function laterHealth() {
    localStorage.setItem('vitacoach_health_perm', 'later')
    setShowHealthPerm(false)
  }

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

  // ── Mémoire longue durée ────────────────────────────────────────────────────
  function sauverMemoire(userMsg, reply) {
    const m = userMsg.toLowerCase()
    let topic = null
    if (/sommeil|dormir|insomni/.test(m))          topic = 'sommeil'
    else if (/stress|anxiété|anxieux|pression/.test(m)) topic = 'stress'
    else if (/douleur|mal (au|à la|aux)/.test(m))  topic = 'douleur'
    else if (/poids|kilos|maigrir|mincir/.test(m)) topic = 'poids'
    else if (/sport|exercice|entraîn|muscul/.test(m)) topic = 'fitness'
    else if (/nutrition|manger|repas|recette/.test(m)) topic = 'nutrition'
    else if (/fatigue|énergie|épuisé/.test(m))     topic = 'énergie'
    else if (/humeur|moral|déprim|triste/.test(m)) topic = 'humeur'
    else if (/peau|cheveux|acné/.test(m))           topic = 'beauté'
    else if (/plante|naturel|complément/.test(m))   topic = 'naturo'
    if (!topic) return
    const memories = safeParse('vitacoach_memories', [])
    const mem = { ts: Date.now(), date: new Date().toDateString(), topic, userMsg: userMsg.slice(0, 120), reply: reply.replace(/\|\|\|JSON\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, '').trim().slice(0, 150) }
    localStorage.setItem('vitacoach_memories', JSON.stringify([mem, ...memories].slice(0, 25)))
  }

  // ── Détection SOS ────────────────────────────────────────────────────────────
  function detectSOS(msg) {
    const sos = /\b(à bout|j'en peux plus|plus envie|tout lâcher|envie de rien|tellement triste|je pleure|vraiment mal|je crack|j'ai craqué|épuisé[e]? complètement|j'abandonne|plus la force|suicide|mourir|veux mourir|veux disparaître)\b/i
    if (sos.test(msg)) {
      setSosMode(true)
      clearTimeout(sosResetRef.current)
      sosResetRef.current = setTimeout(() => setSosMode(false), 10 * 60 * 1000) // reset après 10min
    }
  }

  // ── Milestones célébrés ──────────────────────────────────────────────────────
  const MILESTONES = [
    { id: 'streak7',   check: () => streak >= 7,    emoji: '🔥', titre: '7 jours de suite !',      texte: `${profil?.nom}, 7 jours consécutifs — c'est une vraie habitude qui se construit. Continue comme ça.` },
    { id: 'streak30',  check: () => streak >= 30,   emoji: '🏆', titre: 'Un mois de régularité !', texte: `30 jours. Tu as transformé des intentions en routine réelle. C'est rare et précieux.` },
    { id: 'steps10k',  check: () => metriques.pas >= 10000, emoji: '👟', titre: '10 000 pas !',   texte: `Objectif pas atteint aujourd'hui — ton corps te remercie.` },
    { id: 'score100',  check: () => scoreJour(metriques) >= 95, emoji: '⭐', titre: 'Score parfait !', texte: `Presque 100/100 aujourd'hui — sommeil, eau, mouvement, humeur : tout est là.` },
    { id: 'sleep8',    check: () => metriques.sommeil >= 8, emoji: '😴', titre: '8h de sommeil !', texte: `8h de sommeil enregistrées — ton cerveau consolide, ton corps récupère.` },
    { id: 'water8',    check: () => metriques.eau >= 8, emoji: '💧', titre: 'Hydratation parfaite !', texte: `8 verres d'eau aujourd'hui — c'est exactement ce qu'il faut.` },
  ]

  function checkMilestones() {
    if (milestoneShownRef.current) return
    const shown = safeParse('vitacoach_milestones_shown', [])
    const todayStr = new Date().toDateString()
    for (const m of MILESTONES) {
      const key = `${m.id}_${todayStr}`
      if (!shown.includes(key) && m.check()) {
        milestoneShownRef.current = true
        setMilestone(m)
        localStorage.setItem('vitacoach_milestones_shown', JSON.stringify([...shown, key].slice(-50)))
        setTimeout(() => { setMilestone(null); milestoneShownRef.current = false }, 5000)
        break
      }
    }
  }

  // ── Tendances semaine sur semaine ────────────────────────────────────────────
  function getTrends() {
    if (!history || history.length < 4) return null
    const now = Date.now()
    const DAY = 86400000
    const thisW  = history.filter(h => (now - new Date(h.date).getTime()) <= 7 * DAY)
    const lastW  = history.filter(h => { const d = now - new Date(h.date).getTime(); return d > 7*DAY && d <= 14*DAY })
    if (!thisW.length || !lastW.length) return null
    const avg = (arr, k) => arr.reduce((s, h) => s + (h[k] || 0), 0) / arr.length
    const delta = (k) => {
      const d = avg(thisW, k) - avg(lastW, k)
      return Math.abs(d) > 0.05 ? { delta: Math.round(d * 10) / 10, better: d > 0 } : null
    }
    return { sommeil: delta('sommeil'), pas: delta('pas'), humeur: delta('humeur'), eau: delta('eau') }
  }

  // ── Contexte enrichi pour l'IA ──────────────────────────────────────────────
  function buildContextHints() {
    const userText = messages.filter(m => m.role === 'user').slice(-8).map(m => m.content).join(' ')
    const topics = []
    if (/sommeil|dormir|insomni|fatigue/.test(userText))   topics.push('sommeil_concern')
    if (/stress|anxiété|anxieux|pression/.test(userText))  topics.push('stress_pattern')
    if (/poids|maigrir|mincir|kilos?/.test(userText))      topics.push('weight_goal')
    if (/sport|exercice|entraîn|muscul/.test(userText))    topics.push('fitness_focus')
    if (/repas|manger|nutrition|recette/.test(userText))   topics.push('nutrition_focus')

    // Mémoire longue durée
    const memories = safeParse('vitacoach_memories', [])
    const recentMems = memories.slice(0, 6).map(m => {
      const daysAgo = Math.round((Date.now() - m.ts) / 86400000)
      const quand = daysAgo === 0 ? "aujourd'hui" : daysAgo === 1 ? 'hier' : `il y a ${daysAgo}j`
      return `${quand} – ${m.topic}: "${m.userMsg.slice(0, 80)}"`
    })

    // Tendances
    const trends = getTrends()
    const trendLines = trends ? Object.entries(trends).filter(([,v]) => v).map(([k, v]) => {
      const labels = { sommeil: 'sommeil', pas: 'pas', humeur: 'humeur', eau: 'hydratation' }
      return `${labels[k]} ${v.better ? '↑' : '↓'} ${Math.abs(v.delta)} cette semaine vs la semaine dernière`
    }) : []

    return { topics, streak, todayScore: scoreJour(metriques), memories: recentMems, trends: trendLines }
  }

  function mettreAJourMetrique(key, val) {
    setMetriques(prev => {
      const newM = { ...prev, [key]: val }
      sauverMetriques(newM)
      // Sync Supabase (fire & forget)
      syncMetriquesSupabase(user?.id, newM)
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

      // Envoie la subscription au serveur avec métadonnées profil
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userId: user?.id || profil?.nom || 'user',
          profil: { nom: profil?.nom, objectifs: profil?.objectifs },
          streak,
          score: scoreJour(metriques),
        })
      })

      setNotifEnabled(true)
      localStorage.setItem('vitacoach_notif', JSON.stringify(true))

      // Notif de bienvenue personnalisée
      const todayScore = scoreJour(metriques)
      const nomFmt = profil?.nom ? profil.nom.charAt(0).toUpperCase() + profil.nom.slice(1).toLowerCase() : 'toi'
      const streakMsg = streak > 1 ? ` ${streak} jours de streak actif 🔥` : ''
      const scoreHint = todayScore > 0 ? ` Score d'aujourd'hui : ${todayScore}/100.` : ''
      reg.showNotification('Solenn activé !', {
        body: `Salut ${nomFmt} !${streakMsg}${scoreHint} Tes rappels quotidiens sont prêts.`,
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

    // Warning à 1 message de la limite
    if (!isPro && getMsgCount() === FREE_LIMIT - 1) {
      // On laisse passer mais on avertit
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `💛 Plus qu'un message gratuit aujourd'hui. Passe à **Solenn Pro** pour des échanges illimités — 4,99€/mois, résiliable à tout moment.`
        }])
      }, 800)
    }

    if (!isPro && getMsgCount() >= FREE_LIMIT) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.content?.includes('messages gratuits')) return prev
        return [...prev, { role:'assistant', content:`Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Solenn Pro pour des conseils illimités !` }]
      })
      isSendingRef.current = false
      return
    }
    setMessages(prev => [...prev, { role:'user', content: msg }])
    setInput('')
    setLoading(true)
    if (!isPro) incrementMsgCount()
    detectSOS(msg)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const resp = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, profil, historique: messages.slice(-14).filter(m => m.content), metriques, context_hints: buildContextHints() }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      // ── Streaming SSE ──────────────────────────────────────────────────────
      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf      = ''
      let reply    = ''
      let started  = false

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break outer
          try {
            const token = JSON.parse(raw)
            if (!token) continue
            reply += token
            if (!started) {
              // Premier token → masquer "réfléchit…" et ajouter la bulle
              setMessages(prev => [...prev, { role: 'assistant', content: reply }])
              setLoading(false)
              started = true
            } else {
              setMessages(prev => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: reply }
                return copy
              })
            }
          } catch { /* token non parsable, on ignore */ }
        }
      }

      if (!started) {
        // Flux vide — message de fallback
        setMessages(prev => [...prev, { role: 'assistant', content: "Désolée, je n'ai pas pu répondre. Réessaie !" }])
        setLoading(false)
      }
      if (reply) {
        setFollowUps(genFollowUps(reply))
        sauverMemoire(msg, reply)
        checkMilestones()
        // Sauvegarde Supabase de la conversation (fire & forget)
        if (user?.id) {
          setTimeout(() => {
            setMessages(current => {
              fetch('/api/chat-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, messages: current }),
              }).catch(() => {})
              return current
            })
          }, 500)
        }
      }

    } catch(err) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: "La réponse a pris trop longtemps. Réessaie !" }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Une erreur est survenue. Réessaie.' }])
      }
      setLoading(false)
    } finally {
      isSendingRef.current = false   // libère le verrou
    }
  }

  // ── LANDING / FORUM ────────────────────────────────────────────────────────
  const [showAuth, setShowAuth] = useState(() => sessionStorage.getItem('solenn_page') === 'auth')
  const [showForum, setShowForum] = useState(false)

  function goToAuth() {
    sessionStorage.setItem('solenn_page', 'auth')
    setShowAuth(true)
  }
  function goToLanding() {
    sessionStorage.removeItem('solenn_page')
    setShowAuth(false)
  }

  if (showForum) return <Suspense fallback={<GlowLoader fullPage />}><Forum onBack={() => setShowForum(false)} user={user} profil={profil} /></Suspense>
  if (!user && !showAuth && !isMobile) return <Landing onCommencer={goToAuth} onForum={() => setShowForum(true)} />

  // ── AUTH ────────────────────────────────────────────────────────────────────
  if (!user) return (
    <Auth
      onConnecte={u => {
        sessionStorage.removeItem('solenn_page')
        setUser(u)
        localStorage.setItem('vitacoach_user', JSON.stringify(u))
      }}
      onBack={goToLanding}
    />
  )

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  if (!profil) {
    return (
      <Suspense fallback={<GlowLoader fullPage />}>
      <Onboarding onTermine={p => {
        setProfil(p)
        setProfilBackup(null)
        localStorage.setItem('vitacoach_profil', JSON.stringify(p))
        syncProfilSupabase(user?.id, p)
        const h2 = new Date().getHours()
        const g2 = h2 < 12 ? 'Bonjour' : h2 < 18 ? 'Salut' : 'Bonsoir'
        const nomFmt = p.nom ? p.nom.charAt(0).toUpperCase() + p.nom.slice(1).toLowerCase() : ''
        setMessages([{ role:'assistant', content:`${g2} ${nomFmt} ! Je suis Solenn, ton coach de vie personnel. Je connais ton profil et je suis là pour t'aider à atteindre tes objectifs. Par quoi on commence ?` }])
      }} />
      </Suspense>
    )
  }

  // ── MAIN APP ════════════════════════════════════════════════════════════════
  const score = scoreJour(metriques)
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#E8962A' : '#ef4444'

  const sectionTitles = {
    chat:'Solenn', sante:'Santé', routine:'Routine', herbal:'Santé Naturelle', style:'Style', forum:'Forum'
  }

  const navItems = [
    { id:'accueil', Icon: HomeIcon,    label:'Accueil' },
    { id:'chat',    Icon: ChatIcon,    label:'Solenn' },
    { id:'routine', Icon: RoutineIcon, label:'Routine' },
    { id:'sante',   Icon: HeartIcon,   label:'Santé' },
    { id:'forum',   Icon: ForumIcon,   label:'Forum' },
  ]

  return (
    <div style={s.app}>
      {/* ── Morning Check-in ── */}
      <AnimatePresence>
        {showCheckin && profil && (
          <MorningCheckin
            profil={profil}
            onDone={({ sommeil, humeur, intention }) => {
              localStorage.setItem('vitacoach_checkin_date', new Date().toDateString())
              setShowCheckin(false)
              // Mise à jour métriques
              if (sommeil) mettreAJourMetrique('sommeil', sommeil)
              if (humeur)  mettreAJourMetrique('humeur', humeur)
              // Envoyer à Solenn avec contexte check-in
              const intentionTxt = intention ? ` Mon intention du jour : ${intention}.` : ''
              const msg = `Check-in matin : j'ai dormi ${sommeil}h, humeur ${humeur}/5.${intentionTxt} Donne-moi un focus pour aujourd'hui.`
              setOnglet('chat')
              setTimeout(() => envoyerMessage(msg), 400)
            }}
            onSkip={() => {
              localStorage.setItem('vitacoach_checkin_date', new Date().toDateString())
              setShowCheckin(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Milestone Célébration ── */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            key="milestone"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', left: '50%', transform: 'translateX(-50%)',
              zIndex: 900, background: 'linear-gradient(135deg, #FFF8F4, #FFF2E0)',
              border: '1.5px solid rgba(200,123,82,0.30)',
              borderRadius: 22, padding: '16px 24px', minWidth: 280, maxWidth: 340,
              boxShadow: '0 12px 40px rgba(200,123,82,0.25), 0 4px 12px rgba(0,0,0,0.10)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 38, marginBottom: 6 }}>{milestone.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a00', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>
              {milestone.titre}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(100,50,10,0.65)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}>
              {milestone.texte}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOS Mode indicator ── */}
      {sosMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
            background: 'linear-gradient(90deg, rgba(80,120,200,0.15), rgba(100,140,220,0.10))',
            borderBottom: '1px solid rgba(100,140,220,0.20)',
            padding: '10px 20px',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 12, color: 'rgba(80,120,200,0.90)', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
            💙 Solenn est là pour toi — prends le temps qu'il faut
          </span>
          <button onClick={() => setSosMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.4, marginLeft: 4 }}>✕</button>
        </motion.div>
      )}


      {/* ── Settings Sheet ── */}
      <AnimatePresence>
        {showSettings && profil && (
          <SettingsSheet
            profil={profil}
            preset={homePreset}
            notifsEnabled={notifEnabled}
            isPro={isPro}
            onPasserPro={passerPro}
            msgsRestants={isPro ? null : Math.max(0, FREE_LIMIT - getMsgCount())}
            onClose={() => setShowSettings(false)}
            onEditProfil={() => { setShowSettings(false); setProfilBackup(profil); setProfil(null) }}
            onPresetChange={p => { setHomePreset(p); setShowSettings(false) }}
            onToggleNotifs={() => notifEnabled ? desactiverNotifications() : activerNotifications()}
            onResetMemoire={() => {
              localStorage.removeItem('vitacoach_memories')
              setShowSettings(false)
            }}
            onExportData={() => {
              const data = {
                profil,
                metriques,
                history: safeParse('vitacoach_history', []),
                memories: safeParse('vitacoach_memories', []),
                exportedAt: new Date().toISOString(),
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `solenn-data-${new Date().toISOString().split('T')[0]}.json`
              a.click(); URL.revokeObjectURL(url)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Chat History Sheet ── */}
      <AnimatePresence>
        {showChatHistory && user?.id && (
          <Suspense fallback={null}><ChatHistory
            userId={user.id}
            supabase={supabase}
            onClose={() => setShowChatHistory(false)}
            onLoadSession={msgs => {
              setMessages(msgs)
              setShowChatHistory(false)
            }}
          /></Suspense>
        )}
      </AnimatePresence>

      {/* ══ GLOBAL BACKGROUND — background-components.tsx traduit en inline styles ══
           Couche fixe plein écran, derrière tout le contenu (zIndex:-1)
           Base blanche + jaune #FFF991 multiply opacity 0.6 + orange #FF7112 multiply opacity 0.3 */}
      <div style={{
        position:'fixed', inset:0, zIndex:0, background:'#EDD8CC', pointerEvents:'none',
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

      {/* ══ AURORA — plein écran fixe, actif uniquement sur l'onglet chat ══ */}
      {onglet === 'chat' && <div className="aurora-bg" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />}

      {/* ══ SIDEBAR (desktop) ══ */}
      {!isMobile && (
        <aside style={s.sidebar}>
          <div style={s.sidebarTop}>
            <style>{`
              @keyframes dotPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%       { opacity: 0.55; transform: scale(1.35); }
              }
            `}</style>
            <span style={{
              fontSize:30, fontWeight:400, letterSpacing:'-0.05em',
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontStyle:'italic',
              color:'rgba(200,123,82,0.65)', mixBlendMode:'multiply',
            }}>Solenn</span>
            <span style={{
              fontSize:9, fontWeight:400, color:'rgba(200,123,82,0.75)',
              letterSpacing:'0.4px', marginTop:2,
              fontFamily:"'Poppins',system-ui,sans-serif", fontStyle:'italic',
              display:'block',
            }}>
              Ton évolution<span style={{ display:'inline-block', animation:'dotPulse 2.4s ease-in-out infinite', transformOrigin:'center' }}>,</span> guidée.
            </span>
          </div>

          <nav style={s.sidebarNav}>
            {navItems.map(({ id, Icon, label }) => {
              const active = onglet === id
              const color = active ? '#C87B52' : 'rgba(200,123,82,0.48)'
              return (
                <button key={id} style={active ? s.navActive : s.nav}
                  onClick={() => setOnglet(id)}>
                  <Icon color={color} size={18} />
                  <span>{label}</span>
                  {id === 'sante' && score > 0 && (
                    <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700,
                      color: scoreColor, background: scoreColor+'18', borderRadius:12, padding:'2px 7px' }}>
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
              <button style={s.btnPro} onClick={passerPro}><StarIcon size={12} color="rgba(200,123,82,0.70)" /> Solenn Pro — 4.99€/mois</button>
            )}
            {isPro && <div style={s.proBadge}><StarIcon size={14} color="#fbbf24" /> Membre Pro</div>}
            <button
              style={{
                ...s.btnEdit,
                background: notifEnabled ? 'rgba(34,197,94,0.10)' : 'rgba(0,0,0,0.04)',
                color: notifEnabled ? '#22c55e' : 'rgba(200,123,82,0.65)',
                border: notifEnabled ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(0,0,0,0.08)',
                display:'flex', alignItems:'center', gap:6,
              }}
              onClick={notifEnabled ? desactiverNotifications : activerNotifications}
            >
              {notifEnabled ? <><BellIcon size={15} color="#22c55e" /> Rappels activés</> : <><BellOffIcon size={15} color="#9ca3af" /> Activer les rappels</>}
            </button>
            <button style={{...s.btnEdit, display:'flex', alignItems:'center', gap:6}} onClick={() => {
              setProfilBackup(profil); setProfil(null)
            }}>✏ Modifier mon profil</button>
          </div>
        </aside>
      )}

      {/* ══ MAIN ══ */}
      <main style={{ ...s.main, marginLeft: isMobile ? 0 : 260 }}>
        <div ref={contentRef} style={{ ...s.content, maxWidth: (!isMobile && onglet === 'accueil') ? '100%' : 860, padding: isMobile ? (onglet === 'accueil' ? '0 0 130px' : '48px 0 130px') : '0 0 40px', overflowY: isMobile ? 'auto' : 'unset', overflowX:'hidden', WebkitOverflowScrolling:'touch' }}>

          {/* Mobile header — transparent sur Accueil, plein sur les autres onglets */}
          {isMobile && onglet === 'accueil' && (
            <div style={{
              position:'fixed', top:0, left:0, right:0, zIndex:50,
              padding:'10px 18px',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              {/* Logo */}
              {(() => {
                const logoColor = {
                  sunrise: 'rgba(255,232,195,0.90)',
                  day:     'rgba(255,238,228,0.62)',
                  sunset:  'rgba(255,218,180,0.52)',
                  night:   'rgba(160,200,255,0.90)',
                }[homePreset] ?? 'rgba(255,238,228,0.62)'
                const subColor = {
                  sunrise: 'rgba(255,218,170,0.72)',
                  day:     'rgba(255,238,228,0.68)',
                  sunset:  'rgba(255,200,155,0.42)',
                  night:   'rgba(160,200,255,0.65)',
                }[homePreset] ?? 'rgba(255,238,228,0.68)'
                return (
                <div style={{ pointerEvents:'none', position:'relative' }}>
                  <span style={{
                    fontSize:28, fontWeight:400,
                    fontFamily:"'Cormorant Garamond', Georgia, serif",
                    fontStyle:'italic', letterSpacing:'-0.01em',
                    color: logoColor,
                    textShadow:'0 1px 8px rgba(0,0,0,0.45)',
                    lineHeight:1, display:'block',
                  }}>Solenn</span>
                  <span style={{
                    fontSize:8.5, fontWeight:400, letterSpacing:'0.5px', display:'block', marginTop:2,
                    fontFamily:"'Poppins',system-ui,sans-serif",
                    color: subColor,
                    textShadow:'0 1px 6px rgba(0,0,0,0.40)',
                  }}>Ton évolution, guidée.</span>
                </div>
                )
              })()}
              {/* Hamburger */}
              <button onClick={() => setMenuOpen(o => !o)} style={{
                width:34, height:34, borderRadius:10,
                background:'none', border:'none', boxShadow:'none',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:5, cursor:'pointer', padding:0,
              }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display:'block', borderRadius:2,
                    background: ({ sunrise:'rgba(255,232,195,0.85)', day:'rgba(255,238,228,0.75)', sunset:'rgba(255,218,180,0.45)', night:'rgba(160,200,255,0.80)' }[homePreset] ?? 'rgba(255,238,228,0.75)'),
                    filter:'drop-shadow(0 1px 5px rgba(0,0,0,0.45))',
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
          )}
          {isMobile && onglet !== 'accueil' && (() => {
            const onChat = onglet === 'chat'
            const iconColor = 'rgba(200,123,82,0.58)'
            return (
            <div style={s.mobileHeader}>
              {/* Logo — identique sur tous les onglets */}
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <style>{`
                  @keyframes headerShimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                  }
                  @keyframes dotPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.55; transform: scale(1.35); }
                  }
                `}</style>
                <span style={{
                  fontSize:30, fontWeight:400,
                  fontFamily:"'Cormorant Garamond', Georgia, serif",
                  fontStyle:'italic', letterSpacing:'-0.05em',
                  background:'linear-gradient(90deg, #B8693A 0%, #C87B52 28%, #D4854A 50%, #C87B52 72%, #B8693A 100%)',
                  backgroundSize:'200% auto',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                  animation:'headerShimmer 3s linear infinite',
                  lineHeight:1,
                }}>Solenn</span>
                <span style={{ fontSize:8.5, fontWeight:400, color:'rgba(200,123,82,0.75)', letterSpacing:'0.5px',
                  fontFamily:"'Poppins',system-ui,sans-serif", fontStyle:'italic' }}>
                  Ton évolution<span style={{ display:'inline-block', animation:'dotPulse 2.4s ease-in-out infinite', transformOrigin:'center' }}>,</span> guidée.
                </span>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {/* ── Nouveau chat (visible seulement sur onglet chat avec messages) ── */}
                {onglet === 'chat' && messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setFollowUps([]); setReactions({}) }}
                    title="Nouvelle conversation"
                    style={{
                      width:34, height:34, borderRadius:10,
                      background:'rgba(200,123,82,0.08)', border:'1px solid rgba(200,123,82,0.22)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', fontSize:15, color:'rgba(200,123,82,0.70)',
                      transition:'all .15s ease',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform='scale(0.92)'}
                    onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                  >✦</button>
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
                background:'rgba(25,10,0,0.14)', backdropFilter:'blur(8px)',
                animation:'tabFade 0.22s ease both',
              }} />
              {/* Panel */}
              <div style={{
                position:'fixed', top:0, right:0, bottom:0, zIndex:151,
                width:'76%', maxWidth:300,
                background:'linear-gradient(160deg, rgba(255,243,220,0.28) 0%, rgba(255,224,175,0.20) 100%)',
                backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
                borderLeft:'1px solid rgba(210,145,40,0.09)',
                boxShadow:'none',
                display:'flex', flexDirection:'column',
                padding:'22px 22px 90px',
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 22px)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
                animation:'slideInRight 0.36s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
                {/* Profile */}
                <div style={{
                  display:'flex', alignItems:'center', gap:14, marginBottom:28,
                  paddingBottom:22, borderBottom:'1px solid rgba(190,120,20,0.09)',
                }}>
                  {/* Monogramme utilisateur */}
                  <div style={{ position:'relative', width:38, height:38, flexShrink:0 }}>
                    {/* Anneau tournant */}
                    <motion.svg
                      width="38" height="38"
                      style={{ position:'absolute', inset:0, pointerEvents:'none' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    >
                      <defs>
                        <linearGradient id="menuOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor="rgba(255,238,228,0.0)"/>
                          <stop offset="30%"  stopColor="rgba(255,238,228,0.20)"/>
                          <stop offset="55%"  stopColor="rgba(255,238,228,0.42)"/>
                          <stop offset="80%"  stopColor="rgba(255,238,228,0.16)"/>
                          <stop offset="100%" stopColor="rgba(255,238,228,0.0)"/>
                        </linearGradient>
                      </defs>
                      <circle cx="19" cy="19" r="17.5" fill="none" stroke="url(#menuOrbitGrad)" strokeWidth="1.5"/>
                    </motion.svg>
                    {/* Fond + initiale */}
                    <div style={{
                      width:38, height:38, borderRadius:'50%',
                      background:'rgba(255,238,228,0.07)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <span style={{ fontSize:16, fontWeight:600, color:'rgba(255,238,228,0.88)', fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic' }}>
                        {(profil.nom || profil.prenom || '').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:500, color:'rgba(255,238,228,0.92)', fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic', letterSpacing:'0.01em' }}>
                      {profil.nom ? profil.nom.charAt(0).toUpperCase() + profil.nom.slice(1).toLowerCase() : ''}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,238,228,0.48)', marginTop:2, fontFamily:F }}>Niveau {level} · {xp} XP</div>
                  </div>
                </div>
                {/* Nav links */}
                {navItems.map(({ id, Icon, label }) => (
                  <button key={id} onClick={() => { setOnglet(id); setMenuOpen(false) }} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                    border:'none',
                    background: onglet===id ? 'rgba(190,115,18,0.08)' : 'transparent',
                    cursor:'pointer', fontFamily:F, width:'100%', textAlign:'left',
                    color: onglet===id ? 'rgba(255,238,228,0.92)' : 'rgba(255,238,228,0.62)',
                    fontWeight: onglet===id ? 600 : 400,
                    fontSize:14, marginBottom:3,
                  }}>
                    <Icon color={onglet===id ? 'rgba(255,238,228,0.88)' : 'rgba(255,238,228,0.44)'} size={18} />
                    {label}
                  </button>
                ))}
                {/* Bottom actions */}
                <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:2, borderTop:'1px solid rgba(200,130,25,0.09)', paddingTop:12 }}>
                  {!isPro && (
                    <button onClick={() => { passerPro(); setMenuOpen(false) }} style={{
                      display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                      border:'none', background:'transparent', cursor:'pointer',
                      fontFamily:F, width:'100%', textAlign:'left',
                      color:'rgba(255,238,228,0.84)', fontWeight:400, fontSize:14,
                    }}>
                      <StarIcon size={18} color="rgba(255,238,228,0.82)" /> Passer à Pro
                    </button>
                  )}
                  <button onClick={() => { setShowSettings(true); setMenuOpen(false) }} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                    border:'none', background:'transparent', cursor:'pointer',
                    fontFamily:F, width:'100%', textAlign:'left',
                    color:'rgba(255,238,228,0.70)', fontWeight:400, fontSize:14,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,238,228,0.55)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Paramètres
                  </button>
                  <button onClick={() => { setProfilBackup(profil); setProfil(null); setMenuOpen(false) }} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                    border:'none', background:'transparent', cursor:'pointer',
                    fontFamily:F, width:'100%', textAlign:'left',
                    color:'rgba(255,238,228,0.55)', fontWeight:400, fontSize:14,
                  }}>
                    <SparkleIcon size={18} color="rgba(255,238,228,0.46)" /> Modifier mon profil
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Tab content (keyed for fade-in animation on tab switch) ── */}
          <div key={onglet} style={{ animation:'tabFade 0.28s ease both', flex:1, display:'flex', flexDirection:'column' }}>

          {/* ── Accueil ── */}
          {onglet === 'accueil' && (
            <Suspense fallback={<GlowLoader fullPage />}>
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
              history={history}
              onPresetChange={setHomePreset}
              isScrolling={isScrolling}
            />
            </Suspense>
          )}

          {/* ── Chat ── */}
          {onglet === 'chat' && (
            <div style={s.chatWrap}>

              {/* Bouton historique chat */}
              {user?.id && (
                <div style={{ position:'absolute', top:12, right:16, zIndex:10 }}>
                  <button onClick={() => setShowChatHistory(true)} title="Historique" style={{
                    background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)',
                    border:'1px solid rgba(200,123,82,0.18)', borderRadius:10,
                    padding:'6px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                    fontSize:11, fontWeight:600, color:'rgba(200,123,82,0.75)', fontFamily:'Poppins,sans-serif',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Historique
                  </button>
                </div>
              )}

              <div ref={chatBoxRef} style={s.chatBox}
                onScroll={e => {
                  const el = e.currentTarget
                  setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120)
                }}>
                {messages.length === 0 && (
                  <div style={s.emptyChat}>
                    {/* Mascot */}
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                      <SolennFace size={46} />
                    </div>

                    <div style={s.emptyChatTitle}>
                      {profil?.prenom || profil?.nom ? `Comment je peux t'aider, ${((profil.prenom || profil.nom) || '').charAt(0).toUpperCase() + ((profil.prenom || profil.nom) || '').slice(1).toLowerCase()} ?` : `Comment je peux t'aider ?`}
                    </div>
                    <div style={s.emptyChatSub}>Nutrition · Bien-être · Style · Gestion du stress</div>

                    {streak > 0 && (
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                        <span style={{ background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)', border:'1px solid rgba(200,123,82,0.18)', borderRadius:20, padding:'5px 14px', fontSize:11, fontWeight:700, color:'rgba(180,100,30,0.75)', display:'flex', alignItems:'center', gap:5 }}>
                          🔥 {streak} jour{streak > 1 ? 's' : ''} de suite
                        </span>
                      </div>
                    )}

                    <div style={s.suggestionsPile}>
                      {suggestions.map((sug, i) => (
                        <button key={i} className="sugg-animated" style={{ ...s.suggestionBig, animationDelay:`${i*0.07}s` }} onClick={() => envoyerMessage(sug)}>
                          <span style={{ opacity:0.45, marginRight:8, fontSize:11 }}>→</span>{sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={msg.role==='user' ? s.userMsg : s.botMsg}>
                    {/* Avatar Solenn — visible sur le premier message d'une série IA */}
                    {msg.role === 'assistant' && (i === 0 || messages[i-1]?.role === 'user') && (
                      <div style={{ flexShrink:0, marginTop:4, paddingLeft:3 }}>
                        <SolennFace size={30} />
                      </div>
                    )}
                    {msg.role === 'assistant' && i > 0 && messages[i-1]?.role === 'assistant' && (
                      <div style={{ width:26, flexShrink:0 }} />
                    )}
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
                        <div style={{ display:'flex', gap:5, paddingLeft:4, alignItems:'center' }}>
                          {[
                            { key:'👍', icon: <ThumbsUpIcon  size={13} color="rgba(200,123,82,0.80)" /> },
                            { key:'💡', icon: <LightbulbIcon size={13} color="rgba(200,123,82,0.80)" /> },
                            { key:'❤️', icon: <HeartIcon     size={13} color="rgba(200,123,82,0.80)" /> },
                          ].map(({ key, icon }) => (
                            <ReactionBtn
                              key={key}
                              emoji={key}
                              icon={icon}
                              active={reactions[i] === key}
                              onClick={() => setReactions(prev => ({ ...prev, [i]: prev[i]===key ? null : key }))}
                            />
                          ))}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content).then(() => {
                                setCopiedIdx(i)
                                setTimeout(() => setCopiedIdx(null), 1800)
                              })
                            }}
                            title="Copier"
                            style={{
                              background: copiedIdx === i ? 'rgba(34,197,94,0.12)' : 'transparent',
                              border: 'none', cursor:'pointer', padding:'4px 6px', borderRadius:12,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color: copiedIdx === i ? '#22c55e' : 'rgba(160,100,40,0.55)',
                              transition:'all 0.2s',
                            }}>
                            {copiedIdx === i
                              ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ ...s.botMsg }}>
                    <div style={{ flexShrink:0, marginTop:4 }}>
                      <SolennFace size={30} />
                    </div>
                    <div style={{ padding:'10px 6px', display:'flex', alignItems:'center' }}>
                      <GlowLoader count={5} size={6} color="#C87B52" glowStyle="soft" speed={1.1} gap={5} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Follow-up chips — scroll horizontal */}
              {followUps.length > 0 && !loading && (
                <div style={{ display:'flex', gap:7, marginBottom:10, overflowX:'auto', flexWrap:'nowrap', paddingBottom:2, position:'relative', zIndex:1, scrollbarWidth:'none' }}>
                  {followUps.map((sug, i) => (
                    <button key={i} style={{ ...s.suggestion, flexShrink:0 }} onClick={() => { envoyerMessage(sug); setFollowUps([]) }}>
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ ...s.inputRow, marginBottom: isMobile && kbOffset > 0 ? kbOffset : 0 }}>
                {/* Scroll-to-bottom */}
                {showScrollBtn && (
                  <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })}
                    style={{ position:'absolute', bottom:74, right:16, zIndex:10,
                      width:32, height:32, borderRadius:'50%', border:'1px solid rgba(200,123,82,0.25)',
                      background:'rgba(255,248,242,0.85)', backdropFilter:'blur(12px)',
                      cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 2px 12px rgba(200,123,82,0.15)' }}>↓</button>
                )}
                <div style={s.inputBox}>
                  <input className="chat-input" style={s.inputChat}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && envoyerMessage()}
                    placeholder="Pose une question à Solenn..." />
                  <button style={s.sendBtn} onClick={() => { navigator.vibrate?.(8); envoyerMessage() }}>
                    <SendIcon color="rgba(200,123,82,0.58)" size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Santé ── */}
          {onglet === 'sante' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0', paddingBottom: isMobile ? 120 : undefined }}>
              {!isMobile && (
                <div style={s.pageHeader}>
                  <div>
                    <div style={{...s.pageTitle, display:'flex', alignItems:'center', gap:8}}><HeartIcon size={20} color="#ef4444" /> Suivi Santé</div>
                    <div style={s.pageSubtitle}>Tes métriques du jour</div>
                  </div>
                </div>
              )}
              <Suspense fallback={<GlowLoader fullPage />}><SanteTab metriques={metriques} profil={profil} onUpdate={mettreAJourMetrique} score={score} history={history} userId={user?.id} isPro={isPro} onPasserPro={passerPro} /></Suspense>
            </div>
          )}

          {/* ── Routine ── */}
          {onglet === 'routine' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0', paddingBottom: isMobile ? 120 : undefined }}>
              {!isMobile && (
                <div style={s.pageHeader}>
                  <div>
                    <div style={s.pageTitle}>📋 Routine du jour</div>
                    <div style={s.pageSubtitle}>Ton programme personnalisé</div>
                  </div>
                </div>
              )}
              <RoutineModule profil={profil} metriques={metriques} />
            </div>
          )}

          {/* ── Herbal ── */}
          {onglet === 'herbal' && (
            <Suspense fallback={<GlowLoader fullPage />}>
            <HerbalTab
              profil={profil}
              onChat={msg => { setOnglet('chat'); envoyerMessage(msg) }}
              onBack={() => setOnglet('accueil')}
            />
            </Suspense>
          )}

          {/* ── Style ── */}
          {onglet === 'style' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0', paddingBottom: isMobile ? 120 : undefined, boxSizing:'border-box', width:'100%', overflow:'hidden' }}>
              {!isMobile && (
                <div style={s.pageHeader}>
                  <div>
                    <div style={{ ...s.pageTitle, display:'flex', alignItems:'center', gap:8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a1.5 1.5 0 0 1 0 3"/>
                        <path d="M12 6 L5 13 h14 L12 6Z"/>
                        <path d="M5 13 v6 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 v-6"/>
                      </svg>
                      Style & Tenues
                    </div>
                    <div style={s.pageSubtitle}>Suggestions adaptées à la météo</div>
                  </div>
                </div>
              )}
              <TenuesModule profil={profil} />
            </div>
          )}

          {/* ── Routine ── */}
          {onglet === 'routine' && (
            <Suspense fallback={<GlowLoader fullPage />}><RoutineTab userId={user?.id} profil={profil} /></Suspense>
          )}

          {/* ── Forum ── */}
          {onglet === 'forum' && (
            <Suspense fallback={<GlowLoader fullPage />}><Forum onBack={() => setOnglet('accueil')} user={user} profil={profil} showForm={forumFormOpen} setShowForm={setForumFormOpen} onUnreadCount={setForumUnread} /></Suspense>
          )}

          </div>{/* end keyed tab wrapper */}

        </div>

        {/* ══ FORUM FAB (hors div scrollable) ══ */}
        {isMobile && onglet === 'forum' && (
          <button
            onClick={() => {
              const opening = !forumFormOpen
              setForumFormOpen(opening)
              if (opening) {
                setTimeout(() => {
                  if (contentRef.current && contentRef.current.scrollTop > 0) {
                    contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }, 50)
              }
            }}
            aria-label="Nouvelle discussion"
            style={{
              position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 106px)', right: 18,
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(200,123,82,0.42), rgba(190,112,30,0.48))',
              border: '1px solid rgba(255,220,170,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(200,123,82,0.15), inset 0 1px 0 rgba(255,255,255,0.18)',
              zIndex: 200,
              transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Barre horizontale */}
            <span style={{
              position: 'absolute',
              width: 18, height: 2, borderRadius: 2,
              background: 'rgba(255,245,225,0.95)',
              transform: forumFormOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform .38s cubic-bezier(.34,1.56,.64,1)',
            }} />
            {/* Barre verticale */}
            <span style={{
              position: 'absolute',
              width: 18, height: 2, borderRadius: 2,
              background: 'rgba(255,245,225,0.95)',
              transform: forumFormOpen ? 'rotate(-45deg)' : 'rotate(90deg)',
              transition: 'transform .38s cubic-bezier(.34,1.56,.64,1)',
            }} />
          </button>
        )}

        {/* ══ DYNAMIC NAV (mobile) ══ */}
        {isMobile && <DynamicNav onglet={onglet} setOnglet={setOnglet} forumUnread={forumUnread} F={F} preset={homePreset} />}
      </main>

      {/* Celebration overlay */}
      {celebrate && <CelebrationOverlay score={score} onDone={() => setCelebrate(false)} />}

      {/* Health permission modal — 1er lancement */}
      {showHealthPerm && <HealthPermModal onAllow={allowHealth} onLater={laterHealth} />}

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
        @keyframes auroraFadeIn {
          from { opacity: 0; }
          to   { opacity: 0.72; }
        }
        .aurora-bg {
          background: linear-gradient(135deg,
            #FFD49A 0%, #F5C8AA 18%, #FFF4E0 36%,
            #E8B87A 52%, #EED4B0 68%, #FAE8CC 84%, #FFD49A 100%);
          background-size: 400% 400%;
          animation: aurora 14s ease infinite, auroraFadeIn 0.5s ease both;
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
        @keyframes liquidMorph {
          0%   { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
          25%  { border-radius: 45% 55% 40% 60% / 60% 40% 55% 45%; }
          50%  { border-radius: 55% 45% 65% 35% / 40% 55% 45% 60%; }
          75%  { border-radius: 40% 60% 45% 55% / 55% 45% 60% 40%; }
          100% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
        }
        @keyframes mirrorSweep {
          0%   { left: -100%; opacity: 0; }
          8%   { opacity: 1; }
          38%  { left: 160%; opacity: 1; }
          42%  { opacity: 0; }
          100% { left: 160%; opacity: 0; }
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
        /* Scrollbar cachée sur mobile — scroll tactile suffisant */
        ::-webkit-scrollbar { display:none; width:0; height:0; }
        * { scrollbar-width:none; }
      `}</style>
    </div>
  )
}

// ─── ROUTINE MODULE ───────────────────────────────────────────────────────────
function RoutineModule({ profil, metriques }) {
  const todayKey = new Date().toDateString()
  const savedKey = `vitacoach_routine_${todayKey}`

  const [routine, setRoutine]           = useState(() => {
    try { return JSON.parse(localStorage.getItem(savedKey)) || null } catch { return null }
  })
  const [loading, setLoading]           = useState(false)
  const [routineError, setRoutineError] = useState(false)
  const [checkedSteps, setCheckedSteps] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${savedKey}_checked`)) || {} } catch { return {} }
  })

  // Auto-générer au premier chargement si pas de routine sauvegardée
  useEffect(() => {
    if (!routine && !loading) genererRoutine()
  }, [])

  async function genererRoutine() {
    setLoading(true); setCheckedSteps({}); setRoutineError(false)
    localStorage.removeItem(`${savedKey}_checked`)
    try {
      const res = await fetch('/api/routine', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil, metriques })
      })
      const data = await res.json()
      if (data.erreur) setRoutineError(true)
      else {
        setRoutine(data)
        localStorage.setItem(savedKey, JSON.stringify(data))
      }
    } catch { setRoutineError(true) }
    setLoading(false)
  }

  function toggleStep(id) {
    setCheckedSteps(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(`${savedKey}_checked`, JSON.stringify(next))
      return next
    })
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
          {loading ? <><LoadingIcon size={14} color="rgba(200,123,82,0.80)" /> Génération...</> : routine ? <><RefreshIcon size={14} color="rgba(200,123,82,0.80)" /> Regénérer</> : <><SparkleIcon size={14} color="rgba(200,123,82,0.80)" /> Générer</>}
        </button>
      </div>

      {stepsTotal > 0 && (
        <div style={sr.progressBar}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:11, fontWeight:400, color:'rgba(160,100,50,0.60)', letterSpacing:'0.04em' }}>Progression</span>
            <span style={{ fontSize:11, color:'rgba(200,123,82,0.70)', fontWeight:500 }}>{doneTotal}/{stepsTotal}</span>
          </div>
          <div style={{ height:6, background:'#f0e8e0', borderRadius:12, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${stepsTotal>0?(doneTotal/stepsTotal)*100:0}%`,
              background:'linear-gradient(90deg,#C87B52,#E8A07A)', borderRadius:12, transition:'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {routineError && (
        <div style={{ ...sr.empty, background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:16, padding:24 }}>
          <div style={{ fontSize:32, marginBottom:10, color:'#c62828' }}>!</div>
          <div style={{ fontSize:14, color:'#c62828', fontWeight:600, marginBottom:8 }}>La génération a échoué</div>
          <div style={{ fontSize:12, color:'rgba(155,100,58,0.72)' }}>Vérifie ta connexion et réessaie</div>
        </div>
      )}

      {!routine && !loading && !routineError && (
        <div style={sr.empty}>
          <div style={{ marginBottom:14 }}><RoutineIcon size={48} color="rgba(200,123,82,0.6)" /></div>
          <div style={{ fontSize:15, color:'rgba(55,22,5,0.90)', fontWeight:700, marginBottom:6 }}>Ta routine personnalisée</div>
          <div style={{ fontSize:12, color:'rgba(155,100,58,0.72)' }}>Adaptée à ton rythme · {profil.reveil} → {profil.coucher}</div>
        </div>
      )}

      {routine && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {routine.motivation && (
            <div style={sr.motivCard}>
              <div style={{ marginBottom:6 }}><SparkleIcon size={14} color="rgba(200,123,82,0.55)" /></div>
              <div style={{ fontSize:12, fontWeight:400, color:'rgba(160,95,40,0.65)', lineHeight:1.65, fontStyle:'italic' }}>{routine.motivation}</div>
            </div>
          )}
          {routine.matin && (
            <RoutineSection id="matin" iconEl={<SunIcon size={18} color="#C87B52" />} titre={routine.matin.titre} heure={routine.matin.heure}
              etapes={routine.matin.etapes} accent="#C87B52" checked={checkedSteps} onToggle={toggleStep} />
          )}
          {routine.nutrition && <NutritionCard nutrition={routine.nutrition} />}
          {routine.apresmidi && (
            <RoutineSection id="apresmidi" iconEl={<SunIcon size={18} color="#E8962A" />} titre={routine.apresmidi.titre} heure={routine.apresmidi.heure}
              etapes={routine.apresmidi.etapes} accent="#E8962A" checked={checkedSteps} onToggle={toggleStep} />
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
              <div style={{ fontSize:13, color:'rgba(155,100,58,0.72)', lineHeight:1.7 }}>{routine.astuce.conseil}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NutritionCard({ nutrition }) {
  return (
    <div style={{ ...sr.card, background:'linear-gradient(145deg, rgba(34,197,94,0.06), rgba(255,246,238,0.60))', border:'1px solid rgba(34,197,94,0.18)' }}>
      <div style={sr.cardHeader}>
        <span style={{ fontSize:18, display:'flex', alignItems:'center' }}><FoodIcon size={18} color="#22c55e" /></span>
        <span style={{ ...sr.cardTitre, color:'rgba(30,140,60,0.85)', fontWeight:600, fontSize:13 }}>{nutrition.titre}</span>
      </div>
      {nutrition.repas?.map((r, i) => (
        <div key={i} style={sr.repasRow}>
          <span style={{ fontSize:16, display:'flex', alignItems:'center' }}><FoodIcon size={14} color="rgba(34,197,94,0.55)" /></span>
          <div style={{ fontSize:12, color:'rgba(155,100,58,0.65)', lineHeight:1.5 }}>
            <strong style={{ color:'rgba(80,40,10,0.80)', fontWeight:500 }}>{r.moment}</strong> — {r.suggestion}
          </div>
        </div>
      ))}
      {nutrition.supplements?.length > 0 && (
        <div style={{ fontSize:12, color:'#22c55e', background:'rgba(34,197,94,0.08)', borderRadius:12, padding:'6px 12px', marginTop:8, border:'1px solid rgba(34,197,94,0.2)' }}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><PillIcon size={13} color="#22c55e" />{nutrition.supplements.join(' · ')}</span>
        </div>
      )}
    </div>
  )
}

function RoutineSection({ id, icon, iconEl, titre, heure, etapes, accent, checked, onToggle }) {
  const doneCount = etapes?.filter((_, i) => checked[`${id}_${i}`]).length || 0
  const total = etapes?.length || 0
  return (
    <div style={{
      ...sr.card,
      background: `linear-gradient(145deg, ${accent}09, rgba(255,246,238,0.60))`,
      border: `1px solid ${accent}22`,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18, display:'flex', alignItems:'center' }}>{iconEl || icon}</span>
          <div>
            <div style={{ ...sr.cardTitre, color: accent, fontWeight:600, fontSize:13 }}>{titre}</div>
            {heure && <div style={{ fontSize:10, color:`${accent}70`, marginTop:1 }}>{heure}</div>}
          </div>
        </div>
        {total > 0 && (
          <div style={{ fontSize:10, color: doneCount===total ? accent : `${accent}60`, fontWeight:500,
            background: doneCount===total ? accent+'15' : `${accent}08`, padding:'2px 8px', borderRadius:12 }}>
            {doneCount}/{total}
          </div>
        )}
      </div>
      {etapes?.map((e, i) => {
        const done = checked[`${id}_${i}`]
        return (
          <div key={i} style={{ ...sr.etapeRow, opacity: done ? 0.50 : 1 }} onClick={() => onToggle(`${id}_${i}`)}>
            <div style={{ width:22, height:22, borderRadius:7, flexShrink:0, cursor:'pointer',
              border: `1.5px solid ${done ? accent : accent+'30'}`,
              background: done ? accent+'18' : 'rgba(255,248,242,0.60)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {done && <span style={{ fontSize:11, color:accent }}>✓</span>}
            </div>
            <span style={{ fontSize:18, minWidth:26, flexShrink:0 }}>{e.emoji}</span>
            <div>
              <div style={{ fontWeight:500, fontSize:13, color:'rgba(80,40,10,0.85)', textDecoration: done ? 'line-through' : 'none' }}>{e.action || e.titre}</div>
              <div style={{ fontSize:11, color:'rgba(155,100,58,0.60)', marginTop:2 }}>{e.detail || e.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const sr = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, padding:'8px 0', flexWrap:'wrap', gap:10 },
  date: { fontSize:11, color:'rgba(180,110,50,0.65)', textTransform:'capitalize', letterSpacing:0.5, fontWeight:400 },
  titre: { fontSize:17, fontWeight:500, color:'rgba(100,55,20,0.80)', marginTop:2, letterSpacing:'-0.1px' },
  btnGen: {
    background:'rgba(200,123,82,0.10)', color:'rgba(200,123,82,0.90)',
    border:'1.5px solid rgba(200,123,82,0.25)',
    padding:'8px 14px', borderRadius:12, fontSize:12, fontWeight:600, cursor:'pointer',
    flexShrink:0, fontFamily:"'Poppins',system-ui,sans-serif",
    display:'flex', alignItems:'center', gap:5,
    boxShadow:'none',
  },
  progressBar: { background:'rgba(255,248,242,0.85)', border:'1px solid rgba(200,123,82,0.12)', borderRadius:14,
    padding:'12px 16px', marginBottom:14, boxShadow:'0 2px 10px rgba(200,123,82,0.05)' },
  empty: { background:'rgba(255,248,242,0.85)', border:'1px solid rgba(200,123,82,0.12)', borderRadius:20, padding:'48px 32px',
    textAlign:'center', boxShadow:'0 4px 20px rgba(200,123,82,0.06)' },
  motivCard: { background:'rgba(255,246,238,0.28)',
    border:'1px solid rgba(200,123,82,0.08)', borderRadius:16, padding:'14px 18px', textAlign:'center' },
  card: { background:'rgba(255,248,242,0.70)', border:'1px solid rgba(200,123,82,0.10)', borderRadius:18, padding:'14px 16px',
    boxShadow:'none' },
  cardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  cardTitre: { fontSize:14, fontWeight:700, color:'rgba(55,22,5,0.90)' },
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
          fontSize: 11, color: '#C87B52', fontStyle: 'italic', lineHeight: 1.55,
          display: 'flex', alignItems: 'flex-start', gap: 5,
          background: 'rgba(200,123,82,0.07)', borderRadius: 12, padding: '6px 10px',
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

  // Keyboard navigation — géré via onKeyDown sur le container, pas window

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
                borderRadius: 12,
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
  const [ville, setVille]       = useState(() => localStorage.getItem('vitacoach_ville') || '')
  const [occasion, setOccasion] = useState('Casual')
  const [tenues, setTenues]     = useState([])
  const [meteo, setMeteo]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [villeError, setVilleError] = useState(false)
  const occasions = ['Travail','Casual','Soirée','Sport','Rendez-vous','Voyage']

  // Auto-charger si ville déjà connue
  useEffect(() => {
    const savedVille = localStorage.getItem('vitacoach_ville')
    if (savedVille) getTenues(savedVille)
  }, [])

  async function getTenues(villeArg) {
    const v = (villeArg || ville).trim()
    if (!v) { setVilleError(true); return }
    setVilleError(false)
    localStorage.setItem('vitacoach_ville', v)
    setLoading(true); setTenues([])
    try {
      const res = await fetch('/api/tenues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profil, ville: v, occasion })
      })
      const data = await res.json()
      setTenues(data.tenues || [])
      setMeteo(data.meteo)
    } catch (err) {
      console.error('Erreur tenues:', err)
      setTenues([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: 20, boxSizing:'border-box', width:'100%' }}>
      <style>{`
  .tenues-ville-input { border: 1.5px solid rgba(200,123,82,0.25) !important; box-shadow: none !important; }
  .tenues-ville-input::placeholder { color: rgba(200,123,82,0.55); }
  .tenues-ville-input:focus { border-color: rgba(200,123,82,0.55) !important; box-shadow: 0 0 0 3px rgba(200,123,82,0.10) !important; outline: none !important; }
`}</style>
      {/* Controls — toujours visibles */}
      <div style={{ ...st.panel, marginBottom: 0 }}>
        {/* Ligne 1 : champ ville */}
        <div style={{ marginBottom: 8 }}>
          <input
            className="tenues-ville-input"
            style={{ ...st.input, width:'100%', boxSizing:'border-box', borderColor: villeError ? '#ef4444' : undefined }}
            placeholder="Ta ville (ex: Paris)" value={ville}
            onChange={e => { setVille(e.target.value); setVilleError(false) }}
            onKeyDown={e => e.key === 'Enter' && getTenues()}
          />
        </div>
        {/* Ligne 2 : select + bouton */}
        <div style={{ ...st.row, marginBottom: 4 }}>
          <div style={{ position:'relative', flex:1 }}>
            <select style={{ ...st.select, width:'100%', boxSizing:'border-box' }} value={occasion} onChange={e => setOccasion(e.target.value)}>
              {occasions.map(o => <option key={o} value={o} style={{ background:'#FFF6EE', color:'rgba(200,123,82,0.9)' }}>{o}</option>)}
            </select>
            <svg style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="11" height="7" viewBox="0 0 11 7" fill="none">
              <path d="M1 1l4.5 4.5L10 1" stroke="rgba(200,123,82,0.60)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button style={st.btn} onClick={() => getTenues()} disabled={loading}>
            {loading ? <LoadingIcon size={15} color="rgba(200,123,82,0.80)" /> : <SparkleIcon size={15} color="rgba(200,123,82,0.80)" />}
          </button>
        </div>
        {villeError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Entre ta ville pour continuer</div>}

        {/* Météo */}
        {meteo && (
          <div style={{ ...st.meteoBar, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <WeatherIcon size={16} color="#fbbf24" /> {meteo}
          </div>
        )}

        {/* Capsule Slider */}
        {(loading || tenues.length > 0) && (
          <div style={{ marginTop: 16 }}>
            <CapsuleSlider tenues={tenues} loading={loading} />
          </div>
        )}

        {/* Empty state si pas encore de ville */}
        {!loading && tenues.length === 0 && !ville && (
          <div style={{ textAlign:'center', padding:'32px 0 8px' }}>
            <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgba(200,123,82,0.50)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a1.5 1.5 0 0 1 0 3"/>
                <path d="M12 6 L5 13 h14 L12 6Z"/>
                <path d="M5 13 v6 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 v-6"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(200,123,82,0.75)', marginBottom: 6 }}>Tenues adaptées à ta météo</div>
            <div style={{ fontSize: 12, color: 'rgba(155,107,80,0.70)' }}>Entre ta ville pour recevoir des suggestions personnalisées</div>
          </div>
        )}
      </div>
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
    background: 'rgba(255,248,242,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(200,123,82,0.14)', borderRadius: 20, padding: 16, marginTop: 4,
    boxShadow: '0 4px 20px rgba(200,123,82,0.07), inset 0 1px 0 rgba(255,255,255,0.70)',
  },
  meteoBar: {
    background: 'rgba(200,123,82,0.06)', borderRadius: 12, padding: '8px 14px',
    fontSize: 12, marginBottom: 12, color: '#C87B52', fontWeight: 600, border: '1px solid rgba(200,123,82,0.16)',
  },
  row: { display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' },
  input: {
    flex: 1, padding: '10px 14px', borderRadius: 12,
    border: '1.5px solid rgba(200,123,82,0.25)',
    background: '#FFF6EE',
    fontSize: 13, fontFamily: "'Inter',system-ui,sans-serif",
    outline: 'none', color: 'rgba(200,123,82,0.85)',
    WebkitAppearance: 'none', appearance: 'none',
    boxShadow: 'none',
  },
  select: {
    padding: '10px 30px 10px 12px', borderRadius: 12, border: '1px solid rgba(200,123,82,0.22)',
    background: '#FFF6EE',
    fontSize: 12, fontFamily: "'Inter',system-ui,sans-serif", outline: 'none',
    color: 'rgba(200,123,82,0.85)', cursor: 'pointer',
    appearance: 'none', WebkitAppearance: 'none',
  },
  btn: {
    padding: '8px 14px',
    background: 'rgba(200,123,82,0.10)',
    color: 'rgba(200,123,82,0.90)',
    border: '1.5px solid rgba(200,123,82,0.25)',
    borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Inter',system-ui,sans-serif",
    boxShadow: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const F = "'Poppins', system-ui, sans-serif"
const s = {
  app: { display:'flex', minHeight:'100vh', background:'transparent', fontFamily:F, position:'relative' },

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebar: {
    width:260, flexShrink:0,
    background:'transparent',
    backdropFilter:'none', WebkitBackdropFilter:'none',
    borderRight:'1px solid rgba(200,123,82,0.12)',
    boxShadow:'none',
    display:'flex', flexDirection:'column',
    padding:'2.8rem 1.4rem 2.4rem',
    position:'fixed', top:0, left:0, height:'100vh',
    zIndex:50, overflowY:'auto',
  },
  sidebarTop: { marginBottom:'2.8rem', paddingBottom:'2rem', borderBottom:'1px solid rgba(200,123,82,0.14)' },
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
  sidebarBottom: { display:'flex', flexDirection:'column', gap:8, marginTop:'2rem', paddingTop:'2rem', borderTop:'1px solid rgba(200,123,82,0.12)' },
  nav: {
    display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:14,
    border:'none', background:'transparent', cursor:'pointer', fontFamily:F,
    color:'rgba(200,123,82,0.65)', fontWeight:400, textAlign:'left', width:'100%', fontSize:13,
    letterSpacing:'0.01em', transition:'background .2s, color .2s',
  },
  navActive: {
    display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:14,
    border:'none', background:'rgba(200,123,82,0.07)',
    cursor:'pointer', fontFamily:F, color:'rgba(200,123,82,0.90)', fontWeight:500,
    textAlign:'left', width:'100%', fontSize:13, transition:'all .2s',
    boxShadow:'inset 0 0 0 1.5px rgba(200,123,82,0.18)',
  },
  profileCard: {
    display:'flex', alignItems:'center', gap:10,
    background:'rgba(200,123,82,0.06)',
    border:'1px solid rgba(200,123,82,0.14)', borderRadius:14, padding:'12px 14px',
  },
  avatar: {
    width:36, height:36, borderRadius:10,
    background:'linear-gradient(135deg,#C87B52,#E8A07A)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:15, fontWeight:800, color:'#fff', flexShrink:0,
    boxShadow:'0 4px 12px rgba(200,123,82,.35)',
  },
  profileName: { fontSize:13, fontWeight:700, color:'rgba(55,22,5,0.90)', marginBottom:1 },
  profileMeta: { fontSize:10, color:'rgba(200,123,82,0.6)', lineHeight:1.5 },
  btnPro: {
    background:'transparent', color:'rgba(200,123,82,0.70)',
    border:'none', borderBottom:'1px solid rgba(200,123,82,0.25)',
    padding:'10px 0', borderRadius:0, cursor:'pointer',
    fontSize:11, fontFamily:F, fontWeight:300,
    letterSpacing:'0.18em', textTransform:'uppercase',
    textAlign:'left', display:'flex', alignItems:'center', gap:6,
    transition:'color 0.2s ease, border-color 0.2s ease',
  },
  proBadge: {
    background:'rgba(245,212,184,0.35)', color:'rgba(180,100,40,0.70)',
    border:'1px solid rgba(200,123,82,.15)',
    padding:'8px 12px', borderRadius:10, fontSize:11, fontWeight:700, textAlign:'center',
  },
  btnEdit: {
    background:'rgba(245,235,215,0.22)', color:'rgba(188,118,28,0.65)', border:'1px solid rgba(200,123,82,0.14)',
    padding:'9px 12px', borderRadius:10, cursor:'pointer', fontSize:12,
    fontFamily:F, fontWeight:500, textAlign:'center', width:'100%',
    transition:'border-color .2s, color .2s',
  },

  // ── Main ─────────────────────────────────────────────────────────────────────
  main: { flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1, minHeight:'100vh', background:'transparent', overflow:'hidden' },
  content: { flex:1, maxWidth:860, width:'100%', margin:'0 auto', display:'flex', flexDirection:'column' },

  // ── Mobile header ─────────────────────────────────────────────────────────────
  mobileHeader: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'8px 18px 8px',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
    borderBottom:'1px solid rgba(200,123,82,0.06)',
    background:'transparent',
    backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
    position:'fixed', top:0, left:0, right:0, zIndex:50,
  },
  backBtn: {
    width:36, height:36, borderRadius:12,
    background:'rgba(0,0,0,.04)', border:'1px solid rgba(0,0,0,.08)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
  },
  mobileTitle: { fontSize:14, fontWeight:700, color:'#DA8A34', letterSpacing:'0.01em', flex:1, textAlign:'center', opacity:0.92 },
  scorePill: { borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700 },

  // ── Page header ───────────────────────────────────────────────────────────────
  pageHeader: { padding:'2.8rem 0 2rem', borderBottom:'1px solid #f0e8e0', marginBottom:'2rem' },
  tabHeaderMobile: { display:'flex', alignItems:'center', gap:10, padding:'16px 0 12px', marginBottom:4 },
  backBtnInline: {
    width:34, height:34, borderRadius:10,
    background:'rgba(0,0,0,.04)', border:'1px solid rgba(0,0,0,.08)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
  },
  pageTitle: { fontSize:18, fontWeight:800, color:'rgba(55,22,5,0.90)', letterSpacing:'-0.03em', marginBottom:2 },
  pageSubtitle: { fontSize:12, color:'rgba(200,123,82,0.6)', fontWeight:500 },

  // ── Chat ─────────────────────────────────────────────────────────────────────
  chatWrap: {
    display:'flex', flexDirection:'column', flex:1, padding:'2rem 1.4rem 0 1.8rem', position:'relative',
  },
  chatBox: { flex:1, minHeight:300, overflowY:'auto', marginBottom:10, paddingBottom:10, position:'relative', zIndex:1 },
  emptyChat: { textAlign:'center', padding:'5.6rem 2rem 2rem' },
  emptyChatIcon: { marginBottom:16 },
  emptyChatTitle: { fontSize:18, fontWeight:800, color:'rgba(100,65,25,0.88)', marginBottom:6, letterSpacing:'-0.03em' },
  emptyChatSub: { fontSize:13, color:'rgba(160,120,60,0.65)', marginBottom:32, lineHeight:1.7 },
  suggestionsPile: { display:'flex', flexDirection:'column', gap:8, maxWidth:360, margin:'0 auto' },
  suggestionBig: {
    background:'rgba(255,255,255,0.22)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
    border:'1px solid rgba(200,123,82,0.20)', borderRadius:16,
    padding:'13px 18px', fontSize:13, color:'rgba(185,112,25,0.86)', cursor:'pointer',
    fontFamily:F, textAlign:'left', fontWeight:500,
    boxShadow:'0 2px 12px rgba(200,123,82,0.06), inset 0 1px 0 rgba(255,255,255,0.55)',
    transition:'transform .18s, box-shadow .18s',
  },

  userMsg: { display:'flex', justifyContent:'flex-end', marginBottom:16 },
  botMsg: { display:'flex', alignItems:'flex-start', marginBottom:16, gap:10 },
  userBubble: {
    background:'rgba(255,180,130,0.07)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
    border:'1px solid rgba(200,123,82,0.28)',
    color:'rgba(100,55,20,0.85)',
    padding:'13px 18px', borderRadius:'20px 20px 5px 20px', maxWidth:'76%',
    fontSize:14, lineHeight:1.65,
    boxShadow:'0 4px 22px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
  },
  botBubble: {
    background:'rgba(255,248,238,0.05)', backdropFilter:'blur(22px)', WebkitBackdropFilter:'blur(22px)',
    border:'1px solid rgba(200,123,82,0.20)',
    color:'rgba(180,100,40,0.80)',
    padding:'14px 20px', borderRadius:'5px 20px 20px 20px', maxWidth:'82%',
    fontSize:14, lineHeight:1.65, fontWeight:400, whiteSpace:'pre-wrap',
    fontFamily:'Poppins, sans-serif',
    boxShadow:'0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  botBubbleRich: {
    background:'transparent', color:'rgba(183,108,24,0.84)',
    padding:'4px 0', borderRadius:0, maxWidth:'90%', fontSize:14, lineHeight:1.65, fontWeight:400,
    fontFamily:'Poppins, sans-serif',
  },
  botAvatar: { fontSize:16, color:'#DA8A34', marginTop:10, flexShrink:0, fontWeight:900 },

  suggestionsRow: { display:'flex', gap:7, marginBottom:10, flexWrap:'wrap', position:'relative', zIndex:1 },
  suggestion: {
    background:'rgba(255,255,255,0.22)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
    border:'1px solid rgba(200,123,82,0.22)', borderRadius:20,
    padding:'7px 14px', fontSize:12, color:'rgba(185,112,25,0.88)', cursor:'pointer',
    fontFamily:F, fontWeight:300,
  },

  inputRow: { paddingBottom:10, position:'relative', zIndex:1 },
  inputBox: {
    display:'flex', gap:8, background:'rgba(255,252,248,0.45)',
    backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
    borderRadius:20, padding:'8px 8px 8px 18px',
    border:'1px solid rgba(200,123,82,0.22)', alignItems:'center',
    boxShadow:'0 4px 24px rgba(200,123,82,0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
  },
  inputChat: { flex:1, border:'none', outline:'none', fontSize:14, fontFamily:F, background:'transparent', color:'rgba(140,75,30,0.80)' },
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
    fontFamily:F, color:'rgba(200,123,82,0.6)', position:'relative', transition:'color .2s',
  },
  navBotActive: { color:'#DA8A34' },
}
