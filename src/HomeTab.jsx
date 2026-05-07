import React, { useState, useEffect } from 'react'

// ─── BG BLOBS ─────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-10%', right:'-5%', width:420, height:420, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)',
        animation:'floatOrb 12s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'10%', left:'-8%', width:360, height:360, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,154,60,0.07) 0%, transparent 70%)',
        animation:'floatOrb 9s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', top:'45%', left:'30%', width:280, height:280, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)',
        animation:'floatOrb 15s ease-in-out infinite' }} />
    </div>
  )
}

// ─── WELLNESS CIRCLE ──────────────────────────────────────────────────────────
function WellnessCircle({ score, scoreColor, profil, metriques, onLog }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 150) }, [])

  const R = 88
  const C = 2 * Math.PI * R
  const dash = animated ? (score / 100) * C : 0

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div style={hc.wrap}>
      {/* Greeting */}
      <div style={hc.greeting}>
        <div style={hc.greetName}>{greeting}, {profil?.nom} ✦</div>
        <div style={hc.greetDate}>{dayLabel}</div>
      </div>

      {/* Score pill */}
      {score > 0 && (
        <div style={{ ...hc.scorePill, background: scoreColor + '15', border: `1px solid ${scoreColor}35`, color: scoreColor }}>
          {score >= 70 ? '✦ Excellente forme' : score >= 40 ? '~ Bonne progression' : '↑ Continue comme ça'}
        </div>
      )}

      {/* Circle */}
      <div style={hc.circleWrap}>
        <svg width={216} height={216} viewBox="0 0 216 216" style={{ overflow:'visible' }}>
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FF9A3C" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Shadow ring */}
          <circle cx="108" cy="108" r={R} fill="none" stroke="#f0e8e0" strokeWidth="13" />
          {/* Progress arc */}
          <circle cx="108" cy="108" r={R} fill="none"
            stroke="url(#arcGrad)" strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            strokeDashoffset={C * 0.25}
            filter="url(#glow)"
            style={{ transition:'stroke-dasharray 1.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
          {/* Center score */}
          <text x="108" y="95" textAnchor="middle" fill="#1a0a00"
            fontSize="42" fontWeight="900" fontFamily="Poppins,sans-serif">
            {score > 0 ? score : '—'}
          </text>
          <text x="108" y="117" textAnchor="middle"
            fill="#c4b5a8" fontSize="10" letterSpacing="2" fontFamily="Poppins,sans-serif" fontWeight="600">
            {score > 0 ? 'SCORE FORME' : 'COMPLÈTE TES DONNÉES'}
          </text>
        </svg>

        {/* Metric dots */}
        {[
          { angle:-90, icon:'💧', val:metriques?.eau,     max:8,     label:'Eau',     key:'eau' },
          { angle:-18, icon:'👣', val:metriques?.pas,     max:10000, label:'Pas',     key:'pas' },
          { angle:54,  icon:'😴', val:metriques?.sommeil, max:8,     label:'Sommeil', key:'sommeil' },
          { angle:126, icon:'😊', val:metriques?.humeur,  max:5,     label:'Humeur',  key:'humeur' },
          { angle:198, icon:'❤️', val:metriques?.fc,      max:100,   label:'FC',      key:'fc' },
        ].map(m => {
          const rad = (m.angle * Math.PI) / 180
          const x = 108 + 128 * Math.cos(rad)
          const y = 108 + 128 * Math.sin(rad)
          const filled = m.val > 0
          return (
            <button key={m.key} onClick={onLog}
              style={{ position:'absolute', left:x-24, top:y-24, width:48, height:48,
                borderRadius:16,
                background: filled ? 'rgba(255,107,53,0.09)' : '#ffffff',
                border: filled ? '1.5px solid rgba(255,107,53,0.4)' : '1.5px solid #f0e8e0',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:1, cursor:'pointer', transition:'all 0.2s',
                boxShadow: filled ? '0 4px 18px rgba(255,107,53,0.22)' : '0 2px 10px rgba(0,0,0,0.07)',
                fontFamily:'Poppins,sans-serif' }}>
              <span style={{ fontSize:17, lineHeight:1 }}>{m.icon}</span>
              <span style={{ fontSize:8, color: filled ? '#FF6B35' : '#c4b5a8', fontWeight:700, lineHeight:1 }}>
                {filled ? (m.key === 'pas' ? Math.round(m.val/1000)+'k' : m.val) : '—'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Log button */}
      <button style={hc.logBtn} onClick={onLog}>
        📊 Mettre à jour mes métriques
      </button>
    </div>
  )
}

// ─── DAILY PROGRESS STRIP ─────────────────────────────────────────────────────
function ProgressStrip({ metriques, score }) {
  const items = [
    { icon:'💧', label:'Eau', val: metriques?.eau||0, goal:8, unit:'v', color:'#38bdf8' },
    { icon:'👣', label:'Pas', val: metriques?.pas||0, goal:10000, unit:'', color:'#fb923c', fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
    { icon:'😴', label:'Sommeil', val: metriques?.sommeil||0, goal:8, unit:'h', color:'#a78bfa' },
    { icon:'😊', label:'Humeur', val: metriques?.humeur||0, goal:5, unit:'/5', color:'#fbbf24' },
  ]
  return (
    <div style={hc.stripWrap}>
      {items.map(it => {
        const pct = Math.min((it.val / it.goal) * 100, 100)
        const display = it.fmt ? it.fmt(it.val) : it.val
        return (
          <div key={it.label} style={hc.stripItem}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <span style={{ fontSize:14 }}>{it.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color: pct >= 100 ? it.color : '#8a7265' }}>
                {it.val > 0 ? `${display}${it.unit}` : '—'}
              </span>
            </div>
            <div style={{ height:5, background:'#f0e8e0', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background: `linear-gradient(90deg, ${it.color}99, ${it.color})`,
                borderRadius:3, transition:'width 1s ease' }} />
            </div>
            <div style={{ fontSize:9, color:'#c4b5a8', marginTop:3, fontWeight:500 }}>{it.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── INSIGHT CARDS ────────────────────────────────────────────────────────────
function InsightCards({ profil, metriques, onChat }) {
  const h = new Date().getHours()

  const cards = [
    h < 10
      ? { icon:'🌅', gradient:'linear-gradient(135deg,#ff9500,#ffb340)', title:'Démarre ta journée', body:`Boire 1 verre d'eau dès le réveil active ton métabolisme. Idéal avec une rondelle de citron.`, action:'Conseils matin' }
      : h < 14
      ? { icon:'🥗', gradient:'linear-gradient(135deg,#34c759,#30d158)', title:'Repas de midi', body:`Protéines + légumes + glucides complexes. Évite les sucres rapides pour garder ton énergie.`, action:'Idées repas' }
      : h < 18
      ? { icon:'⚡', gradient:'linear-gradient(135deg,#FF6B35,#FF9A3C)', title:'Regain d\'énergie', body:`Coup de fatigue ? 10 min de marche relancent ta concentration mieux qu'un café.`, action:'Me remotiver' }
      : { icon:'🌙', gradient:'linear-gradient(135deg,#5856d6,#af52de)', title:'Prépare ton sommeil', body:`Coupe les écrans 30 min avant de dormir. La mélatonine se libère dans l'obscurité.`, action:'Routine soir' },
    {
      icon: metriques?.eau >= 4 ? '✅' : '💧',
      gradient: metriques?.eau >= 4 ? 'linear-gradient(135deg,#34c759,#30d158)' : 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
      title: metriques?.eau >= 4 ? `Hydratation en bonne voie !` : `Hydrate-toi !`,
      body: metriques?.eau > 0
        ? `${metriques.eau}/8 verres. ${metriques.eau < 4 ? 'Bois un verre maintenant !' : metriques.eau < 8 ? 'Continue, tu y es presque !' : 'Parfait, objectif atteint !'}`
        : `Objectif : 8 verres d'eau par jour. L'hydratation impacte directement ton énergie.`,
      action: 'Mettre à jour',
    },
    profil?.objectifs?.[0] && {
      icon:'🎯',
      gradient:'linear-gradient(135deg,#FF6B35,#E55A00)',
      title: profil.objectifs[0],
      body:`Chaque petite action compte. Qu'est-ce que tu peux faire aujourd'hui pour avancer ?`,
      action:'Conseils personnalisés',
    },
    { icon:'🌿', gradient:'linear-gradient(135deg,#30d158,#34c759)', title:'Médecine naturelle', body:`Découvre les plantes, tisanes et techniques holistiques pour booster ta santé au naturel.`, action:'Voir Herbal' },
    { icon:'🧘', gradient:'linear-gradient(135deg,#FF9A3C,#FF6B35)', title:'Respiration profonde', body:`2 minutes de cohérence cardiaque réduisent le cortisol de 25%. Inspire 5s, expire 5s.`, action:'En savoir plus' },
  ].filter(Boolean)

  return (
    <div style={hc.cardsSection}>
      <div style={hc.sectionHeader}>
        <div style={hc.sectionTitle}>Insights du jour</div>
        <div style={hc.sectionSub}>Personnalisés pour toi</div>
      </div>
      <div style={hc.cardsScroll}>
        {cards.map((c, i) => (
          <button key={i} style={hc.insightCard} onClick={() => {
            if (c.action === 'Voir Herbal') onChat('herbal')
            else onChat(c.action)
          }}>
            <div style={{ ...hc.cardIconWrap, background: c.gradient }}>
              <span style={{ fontSize:24 }}>{c.icon}</span>
            </div>
            <div style={hc.cardTitle}>{c.title}</div>
            <div style={hc.cardBody}>{c.body}</div>
            <div style={hc.cardCta}>{c.action} →</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── QUICK ACTIONS ─────────────────────────────────────────────────────────────
function QuickActions({ onNavigate }) {
  const actions = [
    { icon:'💬', label:'Coach IA', desc:'Pose une question', tab:'chat', color:'#FF6B35' },
    { icon:'📋', label:'Routine', desc:'Plan du jour', tab:'routine', color:'#5856d6' },
    { icon:'🌿', label:'Herbal', desc:'Santé naturelle', tab:'herbal', color:'#34c759' },
    { icon:'👗', label:'Style', desc:'Tenues du jour', tab:'style', color:'#af52de' },
  ]
  return (
    <div style={hc.actionsSection}>
      <div style={hc.sectionTitle}>Accès rapide</div>
      <div style={hc.actionsGrid}>
        {actions.map(a => (
          <button key={a.tab} style={hc.actionBtn} onClick={() => onNavigate(a.tab)}>
            <div style={{ ...hc.actionIcon, background: a.color + '15', border: `1.5px solid ${a.color}25` }}>
              <span style={{ fontSize:20 }}>{a.icon}</span>
            </div>
            <div style={{ ...hc.actionLabel, color: a.color }}>{a.label}</div>
            <div style={hc.actionDesc}>{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onSwitchTab, onChat }) {
  return (
    <div style={hc.page}>
      <BgBlobs />
      <div style={{ position:'relative', zIndex:1 }}>
        <WellnessCircle
          score={score} scoreColor={scoreColor}
          profil={profil} metriques={metriques} onLog={onLog}
        />
        <ProgressStrip metriques={metriques} score={score} />
        <InsightCards
          profil={profil} metriques={metriques}
          onChat={action => {
            if (action === 'herbal') { onSwitchTab('herbal'); return }
            if (action === 'Mettre à jour') { onSwitchTab('sante'); return }
            onSwitchTab('chat'); onChat(action)
          }}
        />
        <QuickActions onNavigate={onSwitchTab} />
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hc = {
  page: { display:'flex', flexDirection:'column', gap:0, paddingBottom:100 },

  wrap: { display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 20px 16px', position:'relative' },
  greeting: { textAlign:'center', marginBottom:10, position:'relative', zIndex:1 },
  greetName: { fontSize:22, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.4px' },
  greetDate: { fontSize:12, color:'#8a7265', marginTop:4, textTransform:'capitalize', fontWeight:500 },
  scorePill: { borderRadius:30, padding:'5px 16px', fontSize:12, fontWeight:700, marginBottom:10, display:'inline-block' },

  circleWrap: { position:'relative', width:280, height:280, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 },
  logBtn: { marginTop:8, padding:'12px 28px',
    background:'linear-gradient(135deg,#FF6B35,#E55A00)',
    color:'#fff', border:'none', borderRadius:16, fontSize:13, fontWeight:700,
    cursor:'pointer', fontFamily:'Poppins,sans-serif', boxShadow:'0 6px 22px rgba(255,107,53,0.32)',
    letterSpacing:'0.2px' },

  // Progress strip
  stripWrap: { display:'flex', gap:10, padding:'12px 20px', marginBottom:4 },
  stripItem: { flex:1, background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:14,
    padding:'10px 10px 8px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },

  // Cards
  cardsSection: { padding:'0 20px 4px' },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 },
  sectionTitle: { fontSize:15, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.2px' },
  sectionSub: { fontSize:11, color:'#c4b5a8', fontWeight:500 },
  cardsScroll: { display:'flex', gap:12, overflowX:'auto', paddingBottom:6,
    scrollbarWidth:'none', WebkitOverflowScrolling:'touch' },
  insightCard: { flexShrink:0, width:190, background:'#ffffff',
    border:'1px solid #f0e8e0', borderRadius:20, padding:'16px 14px 14px',
    textAlign:'left', cursor:'pointer', fontFamily:'Poppins,sans-serif',
    display:'flex', flexDirection:'column', gap:0,
    boxShadow:'0 4px 20px rgba(0,0,0,0.07)', transition:'transform 0.2s' },
  cardIconWrap: { width:44, height:44, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 },
  cardTitle: { fontSize:13, fontWeight:700, color:'#1a0a00', marginBottom:6, lineHeight:1.3 },
  cardBody: { fontSize:12, color:'#8a7265', lineHeight:1.65, flex:1, marginBottom:12 },
  cardCta: { fontSize:11, fontWeight:700, color:'#FF6B35' },

  // Quick actions
  actionsSection: { padding:'8px 20px 0' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginTop:10 },
  actionBtn: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:16, padding:'14px 8px',
    display:'flex', flexDirection:'column', alignItems:'center', gap:6,
    cursor:'pointer', fontFamily:'Poppins,sans-serif',
    boxShadow:'0 2px 10px rgba(0,0,0,0.05)', transition:'transform 0.15s' },
  actionIcon: { width:44, height:44, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center' },
  actionLabel: { fontSize:11, fontWeight:700, letterSpacing:'-0.2px' },
  actionDesc: { fontSize:9, color:'#c4b5a8', fontWeight:500 },
}
