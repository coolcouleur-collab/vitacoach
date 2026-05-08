import React, { useState, useRef, useEffect, Component } from 'react'
import Auth from './Auth'
import Landing from './Landing'
import Onboarding from './Onboarding'
import HomeTab from './HomeTab'
import HerbalTab from './HerbalTab'
import SanteTab, { scoreJour } from './SanteTab'
import { HomeIcon, ChatIcon, HeartIcon, RoutineIcon, LeafIcon, StyleIcon, BackIcon, SendIcon } from './Icons'
import ResponseRenderer, { isRich } from './ResponseRenderer'

// ─── ORAVIA MASCOT FACE ───────────────────────────────────────────────────────
function OraviaFace({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.30,
      background: 'linear-gradient(145deg, #FF6B35, #E55A00)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(255,107,53,0.50), inset 0 1px 0 rgba(255,255,255,0.25)',
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
    if (p) return [{ role:'assistant', content:`Bon retour ${p.nom} ✦ Comment puis-je t'aider aujourd'hui ?` }]
    return []
  })
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [onglet, setOnglet]     = useState('accueil')
  const [metriques, setMetriques] = useState(defaultMetriques)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)
  const isSendingRef   = useRef(false)   // verrou anti-doublon

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

  // Suggestions contextuelles
  useEffect(() => {
    if (!profil) return
    const h = new Date().getHours()
    if (h < 10)       setSuggestions(["🌅 Comment bien démarrer ma journée ?", "🥗 Que manger ce matin ?", "⚡ Comment booster mon énergie ?"])
    else if (h < 14)  setSuggestions(["🥗 Idée repas de midi ?", "🧠 Comment rester concentré ?", "🏃 Stretch rapide pour le bureau ?"])
    else if (h < 18)  setSuggestions(["😴 Je suis fatigué, que faire ?", "🍎 Collation saine ?", "🧘 Comment gérer mon stress ?"])
    else              setSuggestions(["🌙 Routine du soir pour bien dormir ?", "🍽️ Que manger ce soir ?", "📵 Comment me décompresser ?"])
  }, [profil])

  function mettreAJourMetrique(key, val) {
    setMetriques(prev => {
      const newM = { ...prev, [key]: val }
      sauverMetriques(newM)
      return newM
    })
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
        return [...prev, { role:'assistant', content:`⚡ Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Oravia Pro pour des conseils illimités !` }]
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
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Une erreur est survenue. Réessaie.' }])
    } finally {
      setLoading(false)
      isSendingRef.current = false      // libère le verrou
    }
  }

  // ── LANDING ─────────────────────────────────────────────────────────────────
  const [showAuth, setShowAuth] = useState(false)
  if (!user && !showAuth) return <Landing onCommencer={() => setShowAuth(true)} />

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
        setMessages([{ role:'assistant', content:`✦ Bienvenue ${p.nom} ! Je suis Oravia, ton coach de vie personnel. Comment puis-je t'aider aujourd'hui ?` }])
      }} />
    )
  }

  // ── MAIN APP ════════════════════════════════════════════════════════════════
  const score = scoreJour(metriques)
  const scoreColor = score >= 70 ? '#34c759' : score >= 40 ? '#ff9500' : '#ff3b30'

  const sectionTitles = {
    chat:'Coach IA', sante:'Santé', routine:'Routine', herbal:'Santé Naturelle', style:'Style'
  }

  const navItems = [
    { id:'accueil', Icon: HomeIcon,    label:'Accueil' },
    { id:'chat',    Icon: ChatIcon,    label:'Coach' },
    { id:'sante',   Icon: HeartIcon,   label:'Santé' },
    { id:'routine', Icon: RoutineIcon, label:'Routine' },
    { id:'herbal',  Icon: LeafIcon,    label:'Herbal' },
    { id:'style',   Icon: StyleIcon,   label:'Style' },
  ]

  return (
    <div style={s.app}>

      {/* ══ SIDEBAR (desktop) ══ */}
      {!isMobile && (
        <aside style={s.sidebar}>
          <div style={s.sidebarTop}>
            <div style={s.logo}>✦ Oravia</div>
            <div style={s.logoSub}>Coach de vie IA</div>
          </div>

          <nav style={s.sidebarNav}>
            {navItems.map(({ id, Icon, label }) => {
              const active = onglet === id
              const color = active ? '#FF6B35' : '#8a7265'
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
                {profil.objectifs?.[0] && <div style={s.profileMeta}>🎯 {profil.objectifs[0]}</div>}
              </div>
            </div>
            {!isPro && (
              <button style={s.btnPro} onClick={passerPro}>⚡ Oravia Pro — 4.99€/mois</button>
            )}
            {isPro && <div style={s.proBadge}>✦ Membre Pro</div>}
            <button style={s.btnEdit} onClick={() => {
              setProfilBackup(profil); setProfil(null)
            }}>✏️ Modifier mon profil</button>
          </div>
        </aside>
      )}

      {/* ══ MAIN ══ */}
      <main style={{ ...s.main, marginLeft: isMobile ? 0 : 252 }}>
        <div style={{ ...s.content, padding: isMobile ? '0 0 80px' : '0 0 40px' }}>

          {/* Mobile header */}
          {isMobile && (
            <div style={s.mobileHeader}>
              {onglet !== 'accueil' ? (
                <button style={s.backBtn} onClick={() => setOnglet('accueil')}>
                  <BackIcon color="#1a0a00" size={20} />
                </button>
              ) : (
                <div style={s.logo}>✦ Oravia</div>
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
                <div style={s.avatar}>{profil.nom?.charAt(0).toUpperCase()}</div>
              </div>
            </div>
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
              onSwitchTab={setOnglet}
              onChat={envoyerMessage}
            />
          )}

          {/* ── Chat ── */}
          {onglet === 'chat' && (
            <div style={s.chatWrap}>
              {/* Page header */}
              <div style={isMobile ? s.tabHeaderMobile : s.pageHeader}>
                {isMobile && (
                  <button style={s.backBtnInline} onClick={() => setOnglet('accueil')}>
                    <BackIcon color="#8a7265" size={18} />
                  </button>
                )}
                <div>
                  <div style={s.pageTitle}>{isMobile ? 'Coach IA' : '💬 Coach IA'}</div>
                  {!isMobile && <div style={s.pageSubtitle}>Pose n'importe quelle question à Oravia</div>}
                </div>
              </div>

              <div style={s.chatBox}>
                {messages.length === 0 && (
                  <div style={s.emptyChat}>
                    <div style={s.emptyChatIcon}>✦</div>
                    <div style={s.emptyChatTitle}>Je suis Oravia, ton coach de vie</div>
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
                    {msg.role==='assistant' && <OraviaFace size={34} />}
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
                  </div>
                ))}

                {loading && (
                  <div style={s.botMsg}>
                    <OraviaFace size={34} />
                    <div style={s.botBubble}>
                      <span style={{ display:'inline-flex', gap:5, alignItems:'center' }}>
                        {[0, 0.18, 0.36].map((d,i) => (
                          <span key={i} style={{ width:7, height:7, borderRadius:'50%',
                            background:'linear-gradient(135deg,#FF6B35,#FF9A3C)',
                            display:'inline-block',
                            animation:`typing 0.8s ${d}s ease-in-out infinite alternate` }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions after messages */}
              {suggestions.length > 0 && messages.length >= 1 && messages.length <= 3 && (
                <div style={s.suggestionsRow}>
                  {suggestions.map((sug, i) => (
                    <button key={i} style={s.suggestion} onClick={() => envoyerMessage(sug)}>
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
                    placeholder="Pose une question à Oravia..." />
                  <button style={s.sendBtn} onClick={() => envoyerMessage()}>
                    <SendIcon color="#fff" size={17} />
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
                  <div style={s.pageTitle}>{isMobile ? 'Santé' : '❤️ Suivi Santé'}</div>
                  {!isMobile && <div style={s.pageSubtitle}>Tes métriques du jour</div>}
                </div>
              </div>
              <SanteTab metriques={metriques} profil={profil} onUpdate={mettreAJourMetrique} score={score} />
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

          </div>{/* end keyed tab wrapper */}

        </div>

        {/* ══ BOTTOM NAV (mobile) ══ */}
        {isMobile && (() => {
          const activeIdx = navItems.findIndex(n => n.id === onglet)
          return (
            <nav style={s.bottomNav}>
              {/* Sliding background pill — clay style */}
              <div style={{
                position:'absolute',
                top:6, bottom:8,
                left:`calc(${activeIdx} * (100% / ${navItems.length}) + 5px)`,
                width:`calc(100% / ${navItems.length} - 10px)`,
                background:'linear-gradient(145deg, rgba(255,107,53,0.18), rgba(255,154,60,0.10))',
                borderRadius:18,
                border:'1px solid rgba(255,107,53,0.20)',
                boxShadow:'0 4px 16px rgba(255,107,53,0.20), inset 0 1px 0 rgba(255,255,255,0.7)',
                transition:'left 0.34s cubic-bezier(0.34,1.56,0.64,1)',
                zIndex:0,
                pointerEvents:'none',
              }} />
              {navItems.map(({ id, Icon, label }, idx) => {
                const active = onglet === id
                const color = active ? '#FF6B35' : '#c4b5a8'
                return (
                  <button key={id}
                    style={{ ...s.navBot, color: active ? '#FF6B35' : '#c4b5a8', zIndex:1 }}
                    onClick={() => setOnglet(id)}>
                    <div style={{
                      transition:'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: active ? 'scale(1.18) translateY(-1px)' : 'scale(1)'
                    }}>
                      <Icon color={color} size={22} />
                    </div>
                    <span style={{ fontSize:9, fontWeight: active ? 700 : 400, letterSpacing:'0.3px', marginTop:2, transition:'font-weight 0.2s' }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </nav>
          )
        })()}
      </main>

      {/* Global animations */}
      <style>{`
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
        @keyframes navPillSlide {
          from { opacity:0; }
          to   { opacity:1; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width:0; height:0; background:transparent; }
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
        <button style={sr.btnGen} onClick={genererRoutine} disabled={loading}>
          {loading ? '⏳' : routine ? '🔄 Regénérer' : '✨ Générer'}
        </button>
      </div>

      {stepsTotal > 0 && (
        <div style={sr.progressBar}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#1a0a00' }}>Progression</span>
            <span style={{ fontSize:12, color:'#FF6B35', fontWeight:700 }}>{doneTotal}/{stepsTotal}</span>
          </div>
          <div style={{ height:6, background:'#f0e8e0', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${stepsTotal>0?(doneTotal/stepsTotal)*100:0}%`,
              background:'linear-gradient(90deg,#FF6B35,#FF9A3C)', borderRadius:4, transition:'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {routineError && (
        <div style={{ ...sr.empty, background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:16, padding:24 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
          <div style={{ fontSize:14, color:'#c62828', fontWeight:600, marginBottom:8 }}>La génération a échoué</div>
          <div style={{ fontSize:12, color:'#8a7265' }}>Vérifie ta connexion et réessaie</div>
        </div>
      )}

      {!routine && !loading && !routineError && (
        <div style={sr.empty}>
          <div style={{ fontSize:48, marginBottom:14 }}>📋</div>
          <div style={{ fontSize:15, color:'#1a0a00', fontWeight:700, marginBottom:6 }}>Ta routine personnalisée</div>
          <div style={{ fontSize:12, color:'#8a7265' }}>Adaptée à ton rythme · {profil.reveil} → {profil.coucher}</div>
        </div>
      )}

      {routine && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {routine.motivation && (
            <div style={sr.motivCard}>
              <div style={{ fontSize:20, marginBottom:8 }}>💫</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#FF6B35', lineHeight:1.65 }}>{routine.motivation}</div>
            </div>
          )}
          {routine.matin && (
            <RoutineSection id="matin" icon="🌅" titre={routine.matin.titre} heure={routine.matin.heure}
              etapes={routine.matin.etapes} accent="#FF6B35" checked={checkedSteps} onToggle={toggleStep} />
          )}
          {routine.nutrition && <NutritionCard nutrition={routine.nutrition} />}
          {routine.apresmidi && (
            <RoutineSection id="apresmidi" icon="☀️" titre={routine.apresmidi.titre} heure={routine.apresmidi.heure}
              etapes={routine.apresmidi.etapes} accent="#ff9500" checked={checkedSteps} onToggle={toggleStep} />
          )}
          {routine.soir && (
            <RoutineSection id="soir" icon="🌙" titre={routine.soir.titre} heure={routine.soir.heure}
              etapes={routine.soir.etapes} accent="#5856d6" checked={checkedSteps} onToggle={toggleStep} />
          )}
          {routine.astuce && (
            <div style={sr.card}>
              <div style={sr.cardHeader}>
                <span style={{ fontSize:20 }}>{routine.astuce.emoji}</span>
                <span style={{ ...sr.cardTitre, color:'#FF6B35' }}>{routine.astuce.titre}</span>
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
        <span style={{ fontSize:20 }}>🥗</span>
        <span style={{ ...sr.cardTitre, color:'#34c759' }}>{nutrition.titre}</span>
      </div>
      {nutrition.repas?.map((r, i) => (
        <div key={i} style={sr.repasRow}>
          <span style={{ fontSize:18 }}>{r.emoji}</span>
          <div style={{ fontSize:13, color:'#8a7265', lineHeight:1.5 }}>
            <strong style={{ color:'#1a0a00' }}>{r.moment}</strong> — {r.suggestion}
          </div>
        </div>
      ))}
      {nutrition.supplements?.length > 0 && (
        <div style={{ fontSize:12, color:'#34c759', background:'rgba(52,199,89,0.08)', borderRadius:8, padding:'6px 12px', marginTop:8, border:'1px solid rgba(52,199,89,0.2)' }}>
          💊 {nutrition.supplements.join(' · ')}
        </div>
      )}
    </div>
  )
}

function RoutineSection({ id, icon, titre, heure, etapes, accent, checked, onToggle }) {
  const doneCount = etapes?.filter((_, i) => checked[`${id}_${i}`]).length || 0
  const total = etapes?.length || 0
  return (
    <div style={{ ...sr.card, borderTop:`3px solid ${accent}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>{icon}</span>
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
  btnGen: { background:'linear-gradient(135deg,#FF6B35,#E55A00)', color:'#fff', border:'none',
    padding:'10px 18px', borderRadius:13, fontSize:12, fontWeight:700, cursor:'pointer',
    boxShadow:'0 4px 16px rgba(255,107,53,0.35)', flexShrink:0, fontFamily:'Poppins,sans-serif' },
  progressBar: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:14,
    padding:'12px 16px', marginBottom:14, boxShadow:'0 2px 10px rgba(0,0,0,0.04)' },
  empty: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:20, padding:'48px 32px',
    textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  motivCard: { background:'linear-gradient(135deg,rgba(255,107,53,0.06),rgba(255,154,60,0.06))',
    border:'1px solid rgba(255,107,53,0.18)', borderRadius:18, padding:20, textAlign:'center' },
  card: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:18, padding:'16px 16px',
    boxShadow:'0 2px 12px rgba(0,0,0,0.05)' },
  cardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  cardTitre: { fontSize:14, fontWeight:700, color:'#1a0a00' },
  etapeRow: { display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0',
    borderTop:'1px solid #f8f4f0', cursor:'pointer' },
  repasRow: { display:'flex', gap:10, alignItems:'center', padding:'6px 0',
    borderTop:'1px solid #f8f4f0' },
}

// ─── TENUES MODULE ────────────────────────────────────────────────────────────
function TenueCard({ tenue }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [imgError, setImgError] = useState(false)
  useEffect(() => {
    const q = tenue.imagePrompt || tenue.description || tenue.titre
    fetch(`/api/image?prompt=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => { if (d.url) setImgSrc(d.url); else setImgError(true) })
      .catch(() => setImgError(true))
  }, [])
  return (
    <div style={st.tenueCard}>
      <div style={st.imgBox}>
        {!imgSrc && !imgError && <div style={st.imgPlaceholder}>🔍 Génération...</div>}
        {imgError && <div style={st.imgPlaceholder}>👗 {tenue.titre}</div>}
        {imgSrc && <img src={imgSrc} alt={tenue.titre} style={st.img} onError={() => setImgError(true)} />}
      </div>
      <div style={st.tenueInfo}>
        <div style={st.tenueTitre}>✦ {tenue.titre}</div>
        <div style={st.tenueDesc}>{tenue.description}</div>
        <div style={st.tenuePourquoi}>💡 {tenue.pourquoi}</div>
      </div>
    </div>
  )
}

function TenuesModule({ profil }) {
  const [ouvert, setOuvert]       = useState(false)
  const [ville, setVille]         = useState('')
  const [occasion, setOccasion]   = useState('Casual')
  const [tenues, setTenues]       = useState([])
  const [meteo, setMeteo]         = useState('')
  const [loading, setLoading]     = useState(false)
  const occasions = ['Travail','Casual','Soirée','Sport','Rendez-vous','Voyage']

  const [villeError, setVilleError] = useState(false)

  async function getTenues() {
    if (!ville.trim()) { setVilleError(true); return }
    setVilleError(false)
    setLoading(true); setTenues([])
    try {
      const res = await fetch('/api/tenues', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil, ville, occasion })
      })
      const data = await res.json()
      setTenues(data.tenues||[])
      setMeteo(data.meteo)
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{ paddingBottom:20 }}>
      <button style={st.trigger} onClick={() => setOuvert(!ouvert)}>
        <div style={st.triggerIcon}><span style={{ fontSize:22 }}>👗</span></div>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#1a0a00' }}>Idées tenues du jour</div>
          <div style={{ fontSize:12, color:'#8a7265', marginTop:2 }}>Adaptées à la météo et l'occasion</div>
        </div>
        <span style={{ color:'#c4b5a8' }}>{ouvert ? '▲' : '▼'}</span>
      </button>

      {ouvert && (
        <div style={st.panel}>
          {meteo && (
            <div style={st.meteoBar}>🌤️ {meteo}</div>
          )}
          <div style={st.row}>
            <input style={{ ...st.input, borderColor: villeError ? '#ff3b30' : undefined }}
              placeholder="Ta ville (ex: Paris)" value={ville}
              onChange={e => { setVille(e.target.value); setVilleError(false) }}
              onKeyDown={e => e.key==='Enter' && getTenues()} />
            <select style={st.select} value={occasion} onChange={e => setOccasion(e.target.value)}>
              {occasions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button style={st.btn} onClick={getTenues} disabled={loading}>
              {loading ? '⏳' : '✨'}
            </button>
          </div>
          {villeError && <div style={{ fontSize:12, color:'#ff3b30', marginTop:4 }}>Entre ta ville pour continuer</div>}
          {tenues.length > 0 && (
            <div style={st.grid}>
              {tenues.map((t, i) => <TenueCard key={i} tenue={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const st = {
  trigger: { width:'100%', display:'flex', alignItems:'center', gap:14, padding:'16px',
    background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:18, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', marginBottom:2 },
  triggerIcon: { width:48, height:48, background:'linear-gradient(135deg,rgba(175,82,222,0.12),rgba(175,82,222,0.06))',
    border:'1.5px solid rgba(175,82,222,0.2)', borderRadius:14,
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  panel: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:16, padding:14, marginTop:4,
    boxShadow:'0 2px 12px rgba(0,0,0,0.05)' },
  meteoBar: { background:'rgba(255,107,53,0.06)', borderRadius:10, padding:'8px 14px',
    fontSize:12, marginBottom:12, color:'#FF6B35', fontWeight:600, border:'1px solid rgba(255,107,53,0.15)' },
  row: { display:'flex', gap:8, marginBottom:12 },
  input: { flex:1, padding:'10px 14px', borderRadius:12, border:'1px solid #e5e7eb',
    background:'#f9fafb', fontSize:13, fontFamily:'Poppins,sans-serif', outline:'none', color:'#1a0a00' },
  select: { padding:'10px 12px', borderRadius:12, border:'1px solid #e5e7eb',
    background:'#f9fafb', fontSize:12, fontFamily:'Poppins,sans-serif', outline:'none', color:'#1a0a00' },
  btn: { padding:'10px 16px', background:'linear-gradient(135deg,#af52de,#9b44cc)', color:'#fff',
    border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', boxShadow:'0 4px 12px rgba(175,82,222,0.3)' },
  grid: { display:'flex', gap:12, flexWrap:'wrap', marginTop:10 },
  tenueCard: { flex:'1 1 160px', background:'#ffffff', border:'1px solid #f0e8e0',
    borderRadius:16, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  imgBox: { width:'100%', height:200, background:'#f8f4f0' },
  imgPlaceholder: { width:'100%', height:200, display:'flex', alignItems:'center',
    justifyContent:'center', color:'#c4b5a8', fontSize:12, textAlign:'center', padding:10 },
  img: { width:'100%', height:200, objectFit:'cover', display:'block' },
  tenueInfo: { padding:'12px 12px' },
  tenueTitre: { fontWeight:700, color:'#FF6B35', fontSize:13, marginBottom:5 },
  tenueDesc: { fontSize:12, color:'#8a7265', lineHeight:1.6, marginBottom:5 },
  tenuePourquoi: { fontSize:11, color:'#c4b5a8', fontStyle:'italic' },
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const s = {
  app: { display:'flex', minHeight:'100vh', background:'#FFF8F4',
    fontFamily:'Poppins,sans-serif', position:'relative' },

  // Sidebar
  sidebar: { width:252, flexShrink:0, background:'#ffffff', borderRight:'1px solid #f0e8e0',
    boxShadow:'2px 0 20px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column',
    padding:'28px 16px 24px', position:'fixed', top:0, left:0, height:'100vh',
    zIndex:50, overflowY:'auto' },
  sidebarTop: { marginBottom:28 },
  logo: { fontSize:22, fontWeight:900, letterSpacing:'-0.5px',
    background:'linear-gradient(135deg,#FF6B35,#E55A00)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  logoSub: { fontSize:10, color:'#c4b5a8', marginTop:3, letterSpacing:'0.3px', fontWeight:500 },
  sidebarNav: { display:'flex', flexDirection:'column', gap:3, flex:1 },
  sidebarBottom: { display:'flex', flexDirection:'column', gap:8, marginTop:20 },
  nav: { display:'flex', alignItems:'center', gap:11, padding:'11px 13px', borderRadius:13,
    border:'none', background:'transparent', cursor:'pointer', fontFamily:'Poppins,sans-serif',
    color:'#8a7265', fontWeight:500, textAlign:'left', width:'100%', fontSize:13,
    position:'relative', transition:'all 0.15s' },
  navActive: { display:'flex', alignItems:'center', gap:11, padding:'11px 13px', borderRadius:13,
    border:'1.5px solid rgba(255,107,53,0.25)', background:'rgba(255,107,53,0.07)',
    cursor:'pointer', fontFamily:'Poppins,sans-serif', color:'#FF6B35', fontWeight:700,
    textAlign:'left', width:'100%', fontSize:13, position:'relative', transition:'all 0.15s' },
  profileCard: { display:'flex', alignItems:'center', gap:10, background:'#FFF8F4',
    border:'1px solid #f0e8e0', borderRadius:14, padding:'11px 13px' },
  avatar: { width:36, height:36, borderRadius:11, background:'linear-gradient(135deg,#FF6B35,#FF9A3C)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800,
    color:'#fff', flexShrink:0 },
  profileName: { fontSize:13, fontWeight:700, color:'#1a0a00', marginBottom:1 },
  profileMeta: { fontSize:10, color:'#c4b5a8', lineHeight:1.5 },
  btnPro: { background:'linear-gradient(135deg,#ff6d00,#ff9800)', color:'#fff', border:'none',
    padding:'9px 12px', borderRadius:11, cursor:'pointer', fontSize:11, fontFamily:'Poppins,sans-serif',
    fontWeight:700, boxShadow:'0 4px 14px rgba(255,109,0,0.3)' },
  proBadge: { background:'rgba(255,154,60,0.12)', color:'#FF9A3C', border:'1px solid rgba(255,154,60,0.3)',
    padding:'6px 12px', borderRadius:9, fontSize:11, fontWeight:700, textAlign:'center' },
  btnEdit: { background:'#FFF8F4', color:'#8a7265', border:'1px solid #f0e8e0',
    padding:'9px 12px', borderRadius:11, cursor:'pointer', fontSize:12,
    fontFamily:'Poppins,sans-serif', fontWeight:500, textAlign:'center', width:'100%' },

  // Main
  main: { flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1, minHeight:'100vh' },
  content: { flex:1, maxWidth:860, width:'100%', margin:'0 auto', display:'flex', flexDirection:'column' },

  // Mobile header — clay
  mobileHeader: { display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'14px 16px 12px', borderBottom:'1px solid rgba(255,107,53,0.08)',
    background:'rgba(255,251,248,0.92)',
    backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:40,
    boxShadow:'0 4px 24px rgba(255,107,53,0.08), 0 1px 4px rgba(0,0,0,0.04)' },
  backBtn: { width:36, height:36, borderRadius:12, background:'#f8f4f0',
    border:'1px solid #f0e8e0', display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', flexShrink:0 },
  mobileTitle: { fontSize:15, fontWeight:700, color:'#1a0a00', letterSpacing:'-0.2px',
    flex:1, textAlign:'center' },
  scorePill: { borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:700 },

  // Page header
  pageHeader: { padding:'28px 0 20px', borderBottom:'1px solid #f0e8e0', marginBottom:20 },
  tabHeaderMobile: { display:'flex', alignItems:'center', gap:10, padding:'16px 0 14px', marginBottom:4 },
  backBtnInline: { width:34, height:34, borderRadius:10, background:'#f8f4f0',
    border:'1px solid #f0e8e0', display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', flexShrink:0 },
  pageTitle: { fontSize:18, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.3px', marginBottom:2 },
  pageSubtitle: { fontSize:12, color:'#c4b5a8', fontWeight:500 },

  // Chat
  chatWrap: { display:'flex', flexDirection:'column', flex:1, padding:'0 20px', paddingTop:20 },
  chatBox: { flex:1, minHeight:300, overflowY:'auto', marginBottom:10, paddingBottom:10 },
  emptyChat: { textAlign:'center', padding:'40px 20px 20px' },
  emptyChatIcon: { fontSize:40, color:'#FF6B35', marginBottom:12 },
  emptyChatTitle: { fontSize:18, fontWeight:800, color:'#1a0a00', marginBottom:6, letterSpacing:'-0.3px' },
  emptyChatSub: { fontSize:12, color:'#c4b5a8', marginBottom:28, lineHeight:1.7 },
  suggestionsPile: { display:'flex', flexDirection:'column', gap:8, maxWidth:340, margin:'0 auto' },
  suggestionBig: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:14,
    padding:'12px 16px', fontSize:13, color:'#1a0a00', cursor:'pointer',
    fontFamily:'Poppins,sans-serif', textAlign:'left', fontWeight:500,
    boxShadow:'0 2px 10px rgba(0,0,0,0.05)', transition:'transform 0.15s' },

  userMsg: { display:'flex', justifyContent:'flex-end', marginBottom:14 },
  botMsg: { display:'flex', alignItems:'flex-start', marginBottom:14, gap:8 },
  userBubble: { background:'linear-gradient(145deg,#FF6B35,#E55A00)', color:'#fff',
    padding:'12px 16px', borderRadius:'20px 20px 4px 20px', maxWidth:'76%',
    fontSize:14, lineHeight:1.6,
    boxShadow:'0 8px 28px rgba(255,107,53,0.40), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.2)' },
  botBubble: { background:'#ffffff', border:'1px solid #f0e8e0', color:'#1a0a00',
    padding:'12px 16px', borderRadius:'4px 20px 20px 20px', maxWidth:'82%',
    fontSize:14, lineHeight:1.75, whiteSpace:'pre-wrap',
    boxShadow:'0 4px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)' },
  botBubbleRich: { background:'transparent', color:'#1a0a00',
    padding:'4px 0', borderRadius:0, maxWidth:'90%',
    fontSize:14, lineHeight:1.75 },
  botAvatar: { fontSize:16, color:'#FF6B35', marginTop:10, flexShrink:0, fontWeight:900 },

  suggestionsRow: { display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' },
  suggestion: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:20,
    padding:'7px 13px', fontSize:11, color:'#FF6B35', cursor:'pointer',
    fontFamily:'Poppins,sans-serif', fontWeight:600,
    boxShadow:'0 1px 6px rgba(0,0,0,0.05)' },

  inputRow: { paddingBottom:8 },
  inputBox: { display:'flex', gap:8, background:'#ffffff', borderRadius:18,
    padding:'8px 8px 8px 16px', border:'1px solid #f0e8e0', alignItems:'center',
    boxShadow:'0 4px 20px rgba(0,0,0,0.07)' },
  inputChat: { flex:1, border:'none', outline:'none', fontSize:14,
    fontFamily:'Poppins,sans-serif', background:'transparent', color:'#1a0a00' },
  sendBtn: { background:'linear-gradient(135deg,#FF6B35,#E55A00)', border:'none',
    width:40, height:40, borderRadius:13, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
    boxShadow:'0 4px 14px rgba(255,107,53,0.35)' },

  // Bottom nav — clay glassmorphism
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, display:'flex',
    background:'rgba(255,251,248,0.92)', backdropFilter:'blur(28px)',
    borderTop:'1px solid rgba(255,107,53,0.10)',
    padding:'8px 6px 12px', zIndex:100,
    boxShadow:'0 -8px 40px rgba(255,107,53,0.10), 0 -2px 8px rgba(0,0,0,0.05)' },
  navBot: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0,
    padding:'6px 4px 2px', border:'none', background:'transparent', cursor:'pointer',
    fontFamily:'Poppins,sans-serif', color:'#c4b5a8', position:'relative',
    transition:'color 0.2s' },
  navBotActive: { color:'#FF6B35' },
}
