import React, { useState, useEffect } from 'react'

// ─── ANIMATED HERO BACKGROUND ─────────────────────────────────────────────────
function HeroBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden' }}>
      {/* Animated aurora gradient */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(-45deg, #FFE8D6, #FFF1EA, #FFDCC8, #FFF8F4, #FFE4D0)',
        backgroundSize:'400% 400%',
        animation:'heroGradient 10s ease infinite',
      }} />
      {/* Floating orbs */}
      <div style={{ position:'absolute', top:'-20%', right:'-10%', width:320, height:320,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,107,53,0.22) 0%, transparent 65%)',
        animation:'floatOrb 8s ease-in-out infinite', filter:'blur(2px)' }} />
      <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:250, height:250,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,154,60,0.18) 0%, transparent 65%)',
        animation:'floatOrb 12s ease-in-out infinite reverse', filter:'blur(2px)' }} />
      <div style={{ position:'absolute', top:'30%', left:'20%', width:180, height:180,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 65%)',
        animation:'floatOrb 6s ease-in-out infinite', filter:'blur(1px)' }} />
    </div>
  )
}

// ─── SCORE CIRCLE ─────────────────────────────────────────────────────────────
function ScoreCircle({ score, scoreColor, profil, metriques, onLog }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 200) }, [])

  const R = 84
  const C = 2 * Math.PI * R
  const dash = animated ? (score / 100) * C : 0

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div style={hc.hero}>
      <HeroBg />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>

        {/* Greeting */}
        <div style={hc.greetBadge}>
          <span style={hc.greetDot} />
          {dayLabel}
        </div>
        <div style={hc.greetName}>{greeting}, {profil?.nom} ✦</div>

        {/* Score Ring */}
        <div style={hc.circleWrap}>
          {/* Outer glow ring */}
          <div style={{
            position:'absolute', inset:-16, borderRadius:'50%',
            background: score > 0 ? `radial-gradient(circle, ${scoreColor}20 0%, transparent 65%)` : 'none',
            animation: score > 0 ? 'scoreGlow 3s ease-in-out infinite' : 'none',
          }} />

          <svg width={200} height={200} viewBox="0 0 200 200" style={{ overflow:'visible' }}>
            <defs>
              <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#FF9A3C" />
              </linearGradient>
              <filter id="arcGlow">
                <feGaussianBlur stdDeviation="4" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx="100" cy="100" r={R} fill="none"
              stroke="rgba(255,107,53,0.12)" strokeWidth="12"/>
            {/* Progress */}
            {score > 0 && (
              <circle cx="100" cy="100" r={R} fill="none"
                stroke="url(#arcG)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`} strokeDashoffset={C * 0.25}
                filter="url(#arcGlow)"
                style={{ transition:'stroke-dasharray 1.8s cubic-bezier(0.34,1.56,0.64,1)' }}/>
            )}
            {/* Score number */}
            <text x="100" y="93" textAnchor="middle" fill="#1a0a00"
              fontSize="40" fontWeight="900" fontFamily="Poppins,sans-serif"
              style={{ animation:'countIn 0.6s ease 0.3s both' }}>
              {score > 0 ? score : '—'}
            </text>
            <text x="100" y="113" textAnchor="middle"
              fill="#8a7265" fontSize="10" letterSpacing="2" fontFamily="Poppins,sans-serif" fontWeight="600">
              SCORE FORME
            </text>
          </svg>

          {/* Metric dots around circle */}
          {[
            { angle:-90, icon:'💧', val:metriques?.eau,     color:'#38bdf8', key:'eau',     fmt: v => v },
            { angle:-18, icon:'👣', val:metriques?.pas,     color:'#ff6b35', key:'pas',     fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
            { angle: 54, icon:'😴', val:metriques?.sommeil, color:'#a78bfa', key:'sommeil', fmt: v => v },
            { angle:126, icon:'😊', val:metriques?.humeur,  color:'#fbbf24', key:'humeur',  fmt: v => v },
            { angle:198, icon:'❤️', val:metriques?.fc,      color:'#ff3b30', key:'fc',      fmt: v => v },
          ].map(m => {
            const rad = (m.angle * Math.PI) / 180
            const x = 100 + 118 * Math.cos(rad)
            const y = 100 + 118 * Math.sin(rad)
            const filled = m.val > 0
            return (
              <button key={m.key} onClick={onLog} style={{
                position:'absolute', left:x-22, top:y-22, width:44, height:44,
                borderRadius:14,
                background: filled ? m.color + '18' : 'rgba(255,255,255,0.7)',
                border: `1.5px solid ${filled ? m.color + '50' : 'rgba(255,255,255,0.6)'}`,
                backdropFilter:'blur(8px)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:1, cursor:'pointer',
                boxShadow: filled ? `0 4px 16px ${m.color}35` : '0 2px 8px rgba(0,0,0,0.08)',
                animation: filled ? 'metricPulse 4s ease-in-out infinite' : 'none',
                fontFamily:'Poppins,sans-serif' }}>
                <span style={{ fontSize:16, lineHeight:1 }}>{m.icon}</span>
                <span style={{ fontSize:8, color: filled ? m.color : '#8a7265', fontWeight:700, lineHeight:1 }}>
                  {filled ? m.fmt(m.val) : '—'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Log button */}
        <button style={hc.logBtn} onClick={onLog}>
          <span style={{ fontSize:14 }}>📊</span>
          Mettre à jour mes métriques
        </button>
      </div>
    </div>
  )
}

// ─── PROGRESS STRIP ───────────────────────────────────────────────────────────
function ProgressStrip({ metriques }) {
  const items = [
    { icon:'💧', label:'Eau',     val:metriques?.eau||0,     goal:8,     color:'#38bdf8', fmt: v => v+'v' },
    { icon:'👣', label:'Pas',     val:metriques?.pas||0,     goal:10000, color:'#ff6b35', fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
    { icon:'😴', label:'Sommeil', val:metriques?.sommeil||0, goal:8,     color:'#a78bfa', fmt: v => v+'h' },
    { icon:'😊', label:'Humeur',  val:metriques?.humeur||0,  goal:5,     color:'#fbbf24', fmt: v => v+'/5' },
  ]
  return (
    <div style={hc.strip}>
      {items.map((it, i) => {
        const pct = Math.min((it.val / it.goal) * 100, 100)
        const done = pct >= 100
        return (
          <div key={i} style={hc.stripItem}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:16 }}>{it.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color: done ? it.color : '#1a0a00' }}>
                {it.val > 0 ? it.fmt(it.val) : '—'}
              </span>
            </div>
            <div style={{ height:6, background:'rgba(0,0,0,0.06)', borderRadius:3, overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${pct}%`,
                background:`linear-gradient(90deg, ${it.color}aa, ${it.color})`,
                borderRadius:3, transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: done ? `0 0 8px ${it.color}60` : 'none'
              }} />
            </div>
            <div style={{ fontSize:9, color:'#8a7265', marginTop:4, fontWeight:600 }}>{it.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── INSIGHT CARDS ────────────────────────────────────────────────────────────
const CARD_COLORS = [
  { from:'#FF6B35', to:'#FF9A3C' },
  { from:'#38bdf8', to:'#7dd3fc' },
  { from:'#34c759', to:'#86efac' },
  { from:'#a78bfa', to:'#c4b5fd' },
  { from:'#fbbf24', to:'#fde68a' },
]

function InsightCards({ profil, metriques, onChat }) {
  const [hovered, setHovered] = useState(null)
  const h = new Date().getHours()
  const cards = [
    h < 10
      ? { title:'Débute bien ta journée', body:'Boire 1 verre d\'eau au réveil active le métabolisme. Essaie avec du citron.', action:'Conseils matin' }
      : h < 14
      ? { title:'Repas de midi', body:'Protéines + légumes + glucides lents. Évite les sucres rapides qui fatiguent.', action:'Idées repas' }
      : h < 18
      ? { title:'Regain d\'énergie', body:'10 min de marche = autant d\'énergie qu\'un café, sans le crash post-caféine.', action:'Me remotiver' }
      : { title:'Prépare ton sommeil', body:'Coupe les écrans 30 min avant de dormir. La mélatonine se libère dans l\'obscurité.', action:'Routine soir' },
    {
      title: metriques?.eau >= 4 ? '💧 Hydratation OK !' : '💧 Bois de l\'eau',
      body: metriques?.eau > 0 ? `${metriques.eau}/8 verres aujourd'hui. ${metriques.eau < 4 ? 'Bois un verre maintenant !' : 'Continue comme ça !'}` : 'Objectif : 8 verres/jour. Commence maintenant.',
      action:'Mettre à jour',
    },
    profil?.objectifs?.[0] && {
      title: `🎯 ${profil.objectifs[0]}`,
      body:'Chaque petite action compte. Qu\'est-ce que tu peux faire aujourd\'hui ?',
      action:'Conseils personnalisés',
    },
    { title:'🌿 Santé naturelle', body:'Découvre plantes, tisanes et techniques holistiques personnalisées pour toi.', action:'herbal' },
    { title:'🧘 Respiration 5-5', body:'2 minutes de cohérence cardiaque réduisent le cortisol de 20% immédiatement.', action:'En savoir plus' },
  ].filter(Boolean)

  return (
    <div style={hc.cardsWrap}>
      <div style={hc.cardsHeader}>
        <span style={hc.cardsTitle}>Insights du jour</span>
        <span style={hc.cardsCount}>{cards.length} conseils</span>
      </div>
      <div style={hc.cardsScroll}>
        {cards.map((c, i) => {
          const col = CARD_COLORS[i % CARD_COLORS.length]
          const isHov = hovered === i
          return (
            <button key={i}
              style={{
                ...hc.card,
                background: `linear-gradient(145deg, ${col.from}${isHov ? '28' : '18'}, ${col.to}${isHov ? '18' : '10'})`,
                borderColor: col.from + (isHov ? '55' : '30'),
                transform: isHov ? 'translateY(-4px) scale(1.02)' : 'none',
                boxShadow: isHov ? `0 12px 32px ${col.from}25` : '0 4px 20px rgba(0,0,0,0.08)',
                transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                animation:`tabFade 0.4s ease ${i * 0.07}s both`,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                if (c.action === 'herbal') onChat('herbal')
                else if (c.action === 'Mettre à jour') onChat('sante')
                else onChat(c.action)
              }}>
              <div style={{ ...hc.cardBar, background:`linear-gradient(90deg, ${col.from}, ${col.to})` }} />
              <div style={hc.cardTitle}>{c.title}</div>
              <div style={hc.cardBody}>{c.body}</div>
              <div style={{ ...hc.cardCta, color: col.from }}>{c.action === 'herbal' ? 'Voir Herbal →' : c.action + ' →'}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── QUICK ACTIONS ─────────────────────────────────────────────────────────────
const ACTIONS = [
  { tab:'chat',    emoji:'💬', label:'Coach',    from:'#FF6B35', to:'#FF9A3C' },
  { tab:'routine', emoji:'📋', label:'Routine',  from:'#5856d6', to:'#7c7aef' },
  { tab:'herbal',  emoji:'🌿', label:'Herbal',   from:'#34c759', to:'#30d158' },
  { tab:'style',   emoji:'✨', label:'Style',    from:'#af52de', to:'#c97ef0' },
]

function QuickActions({ onNavigate }) {
  const [hov, setHov] = useState(null)
  return (
    <div style={hc.actionsWrap}>
      <span style={hc.cardsTitle}>Accès rapide</span>
      <div style={hc.actionsGrid}>
        {ACTIONS.map((a, i) => {
          const isHov = hov === i
          return (
            <button key={a.tab}
              style={{
                ...hc.actionBtn,
                transform: isHov ? 'translateY(-5px) scale(1.04)' : 'none',
                boxShadow: isHov ? `0 12px 28px ${a.from}30` : '0 4px 16px rgba(0,0,0,0.07)',
                borderColor: isHov ? a.from + '40' : '#f0e8e0',
                transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                animation:`tabFade 0.4s ease ${i * 0.06 + 0.1}s both`,
              }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              onClick={() => onNavigate(a.tab)}>
              <div style={{
                ...hc.actionIcon,
                background:`linear-gradient(135deg, ${a.from}, ${a.to})`,
                transform: isHov ? 'scale(1.1) rotate(-4deg)' : 'none',
                transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <span style={{ fontSize:22 }}>{a.emoji}</span>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color: isHov ? a.from : '#1a0a00', marginTop:6, transition:'color 0.2s' }}>{a.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onSwitchTab, onChat }) {
  return (
    <div style={hc.page}>
      <ScoreCircle
        score={score} scoreColor={scoreColor}
        profil={profil} metriques={metriques} onLog={onLog}
      />
      <ProgressStrip metriques={metriques} />
      <InsightCards profil={profil} metriques={metriques}
        onChat={action => {
          if (action === 'herbal') { onSwitchTab('herbal'); return }
          if (action === 'sante')  { onSwitchTab('sante');  return }
          onSwitchTab('chat'); onChat(action)
        }}
      />
      <QuickActions onNavigate={onSwitchTab} />
      <div style={{ height:20 }} />
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hc = {
  page: { display:'flex', flexDirection:'column', paddingBottom:90 },

  // Hero
  hero: { position:'relative', minHeight:460, display:'flex', alignItems:'center',
    justifyContent:'center', overflow:'hidden', paddingBottom:24 },
  greetBadge: { display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(255,107,53,0.12)', border:'1px solid rgba(255,107,53,0.25)',
    borderRadius:20, padding:'5px 14px', fontSize:11, color:'#FF6B35', fontWeight:600,
    marginBottom:10, marginTop:28, letterSpacing:'0.3px' },
  greetDot: { width:6, height:6, borderRadius:'50%', background:'#FF6B35',
    display:'inline-block', animation:'dotPulse 2s ease-in-out infinite' },
  greetName: { fontSize:24, fontWeight:900, color:'#1a0a00', letterSpacing:'-0.5px',
    marginBottom:20, textAlign:'center' },
  circleWrap: { position:'relative', width:240, height:240,
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  logBtn: { display:'flex', alignItems:'center', gap:8, padding:'13px 28px',
    background:'linear-gradient(135deg,#FF6B35,#E55A00)', color:'#fff',
    border:'none', borderRadius:18, fontSize:13, fontWeight:700,
    cursor:'pointer', fontFamily:'Poppins,sans-serif',
    boxShadow:'0 8px 28px rgba(255,107,53,0.4)',
    transition:'transform 0.15s, box-shadow 0.15s' },

  // Progress strip
  strip: { display:'flex', gap:10, padding:'16px 20px', borderTop:'none' },
  stripItem: { flex:1, background:'#ffffff', border:'1px solid #f0e8e0',
    borderRadius:14, padding:'10px 10px 8px',
    boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },

  // Cards
  cardsWrap: { padding:'16px 20px 8px' },
  cardsHeader: { display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 },
  cardsTitle: { fontSize:15, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.2px' },
  cardsCount: { fontSize:11, color:'#FF6B35', fontWeight:700,
    background:'rgba(255,107,53,0.1)', padding:'2px 10px', borderRadius:20 },
  cardsScroll: { display:'flex', gap:12, overflowX:'auto', paddingBottom:8,
    scrollbarWidth:'none', WebkitOverflowScrolling:'touch' },
  card: { flexShrink:0, width:195, background:'white',
    border:'1px solid', borderRadius:20, padding:'14px 14px 14px',
    textAlign:'left', cursor:'pointer', fontFamily:'Poppins,sans-serif',
    display:'flex', flexDirection:'column',
    boxShadow:'0 4px 20px rgba(0,0,0,0.08)', transition:'transform 0.2s, box-shadow 0.2s',
    position:'relative', overflow:'hidden' },
  cardBar: { position:'absolute', top:0, left:0, right:0, height:3, borderRadius:'20px 20px 0 0' },
  cardTitle: { fontSize:13, fontWeight:800, color:'#1a0a00', marginBottom:7, lineHeight:1.3, marginTop:6 },
  cardBody: { fontSize:12, color:'#8a7265', lineHeight:1.6, flex:1, marginBottom:12 },
  cardCta: { fontSize:11, fontWeight:700 },

  // Quick actions
  actionsWrap: { padding:'8px 20px' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginTop:10 },
  actionBtn: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:18,
    padding:'16px 8px 12px', display:'flex', flexDirection:'column', alignItems:'center',
    cursor:'pointer', fontFamily:'Poppins,sans-serif',
    boxShadow:'0 4px 16px rgba(0,0,0,0.07)', transition:'transform 0.15s' },
  actionIcon: { width:48, height:48, borderRadius:16,
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 14px rgba(0,0,0,0.15)' },
}
