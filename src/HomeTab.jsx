import React, { useState, useEffect } from 'react'
import { WaterIcon, MoodIcon, HeartIcon, FlashIcon, FireIcon, DiamondIcon, LeafIcon, MeditateIcon, FoodIcon, MoonIcon, SunIcon, TargetIcon, ChatIcon, SparkleIcon, StarIcon, LightbulbIcon, BrainIcon, RunIcon, CalendarIcon } from './Icons'

// ─── ANIMATED HERO BACKGROUND ─────────────────────────────────────────────────
function HeroBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden' }}>
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(-45deg, #FFE0CC, #FFF3EC, #FFD4B8, #FFF8F4, #FFDDC8)',
        backgroundSize:'400% 400%',
        animation:'heroGradient 9s ease infinite',
      }} />
      <div style={{ position:'absolute', top:'-15%', right:'-8%', width:340, height:340,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,107,53,0.3) 0%, transparent 65%)',
        animation:'floatOrb 7s ease-in-out infinite', filter:'blur(3px)' }} />
      <div style={{ position:'absolute', bottom:'-8%', left:'-8%', width:280, height:280,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,154,60,0.25) 0%, transparent 65%)',
        animation:'floatOrb 11s ease-in-out infinite reverse', filter:'blur(3px)' }} />
      <div style={{ position:'absolute', top:'40%', left:'15%', width:160, height:160,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,200,100,0.18) 0%, transparent 65%)',
        animation:'floatOrb 5s ease-in-out infinite', filter:'blur(2px)' }} />
    </div>
  )
}

// ─── SCORE CIRCLE ─────────────────────────────────────────────────────────────
function ScoreCircle({ score, scoreColor, profil, metriques, onLog }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 200) }, [])

  const R = 82
  const C = 2 * Math.PI * R
  const dash = animated ? (score / 100) * C : 0

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div style={hc.hero}>
      <HeroBg />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>

        {/* Greeting badge */}
        <div style={hc.greetBadge}>
          <span style={hc.greetDot} />
          {dayLabel}
        </div>
        <div style={hc.greetName}>{greeting}, <span style={hc.greetNameAccent}>{profil?.nom}</span> !</div>

        {/* Score Ring — clay style */}
        <div style={hc.circleWrap}>
          {/* Outer glow */}
          <div style={{
            position:'absolute', inset:-20, borderRadius:'50%',
            background: score > 0 ? `radial-gradient(circle, ${scoreColor}30 0%, transparent 60%)` : 'none',
            animation: score > 0 ? 'scoreGlow 3s ease-in-out infinite' : 'none',
          }} />
          {/* Clay shadow ring */}
          <div style={{
            position:'absolute', inset:-6, borderRadius:'50%',
            boxShadow:`0 16px 48px ${score > 0 ? scoreColor : '#ff9a3c'}35, 0 4px 16px rgba(0,0,0,0.10)`,
          }} />

          <svg width={200} height={200} viewBox="0 0 200 200" style={{ overflow:'visible' }}>
            <defs>
              <linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#FF9A3C" />
              </linearGradient>
              <filter id="arcGlow">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx="100" cy="100" r={R} fill="none"
              stroke="rgba(255,107,53,0.10)" strokeWidth="14"/>
            {/* Progress arc */}
            {score > 0 && (
              <circle cx="100" cy="100" r={R} fill="none"
                stroke="url(#arcG)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`} strokeDashoffset={C * 0.25}
                filter="url(#arcGlow)"
                style={{ transition:'stroke-dasharray 2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
            )}
            {/* Score text */}
            <text x="100" y="90" textAnchor="middle" fill="#1a0a00"
              fontSize="44" fontWeight="900" fontFamily="Poppins,sans-serif"
              style={{ animation:'countIn 0.7s ease 0.3s both' }}>
              {score > 0 ? score : '—'}
            </text>
            <text x="100" y="115" textAnchor="middle"
              fill="#8a7265" fontSize="10" letterSpacing="2.5" fontFamily="Poppins,sans-serif" fontWeight="700">
              SCORE FORME
            </text>
          </svg>

          {/* Metric dots — clay pill style */}
          {[
            { angle:-90, iconEl:<WaterIcon size={17} color="#38bdf8" />, val:metriques?.eau,     color:'#38bdf8', key:'eau',     fmt: v => v+'v' },
            { angle:-18, iconEl:<RunIcon size={17} color="#FF6B35" />,   val:metriques?.pas,     color:'#FF6B35', key:'pas',     fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
            { angle: 54, iconEl:<MoonIcon size={17} color="#a78bfa" />,  val:metriques?.sommeil, color:'#a78bfa', key:'sommeil', fmt: v => v+'h' },
            { angle:126, iconEl:<MoodIcon size={17} color="#fbbf24" />,  val:metriques?.humeur,  color:'#fbbf24', key:'humeur',  fmt: v => v+'/5' },
            { angle:198, iconEl:<HeartIcon size={17} color="#ff3b30" />, val:metriques?.fc,      color:'#ff3b30', key:'fc',      fmt: v => v },
          ].map(m => {
            const rad = (m.angle * Math.PI) / 180
            const x = 100 + 118 * Math.cos(rad)
            const y = 100 + 118 * Math.sin(rad)
            const filled = m.val > 0
            return (
              <button key={m.key} onClick={onLog} style={{
                position:'absolute', left:x-24, top:y-24, width:48, height:48,
                borderRadius:16,
                background: 'rgba(255,255,255,0.92)',
                border: filled
                  ? `2px solid ${m.color}`
                  : '1.5px solid rgba(255,255,255,0.9)',
                backdropFilter:'blur(10px)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:1, cursor:'pointer',
                boxShadow: filled
                  ? `0 0 0 4px ${m.color}22, 0 6px 20px ${m.color}30, inset 0 1px 0 rgba(255,255,255,0.9)`
                  : '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                fontFamily:"'Inter',system-ui,sans-serif",
                transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                position:'absolute', left:x-24, top:y-24,
              }}>
                {/* Petit badge ✓ quand objectif atteint */}
                {filled && (
                  <div style={{
                    position:'absolute', top:-5, right:-5,
                    width:14, height:14, borderRadius:'50%',
                    background: m.color,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:`0 2px 6px ${m.color}60`,
                    animation:'badgePop .3s cubic-bezier(0.34,1.56,0.64,1)',
                  }}>
                    <span style={{ fontSize:8, color:'#fff', fontWeight:900, lineHeight:1 }}>✓</span>
                  </div>
                )}
                <span style={{ lineHeight:1, display:'flex', alignItems:'center' }}>{m.iconEl}</span>
                {filled && (
                  <span style={{ fontSize:8, color: m.color, fontWeight:800, lineHeight:1 }}>
                    {m.fmt(m.val)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Log CTA */}
        <button style={{...hc.logBtn, display:'flex', alignItems:'center', gap:8, justifyContent:'center'}} onClick={onLog}>
          <HeartIcon size={15} color="#FF6B35" />
          Mettre à jour mes métriques
        </button>
      </div>
    </div>
  )
}

// ─── PROGRESS STRIP ───────────────────────────────────────────────────────────
function ProgressStrip({ metriques }) {
  const items = [
    { iconEl:<WaterIcon size={16} color="#38bdf8" />, label:'Eau',     val:metriques?.eau||0,     goal:8,     color:'#38bdf8', fmt: v => `${v}/8` },
    { iconEl:<RunIcon size={16} color="#FF6B35" />,   label:'Pas',     val:metriques?.pas||0,     goal:10000, color:'#FF6B35', fmt: v => v>=1000 ? `${Math.round(v/1000)}k` : v },
    { iconEl:<MoonIcon size={16} color="#a78bfa" />,  label:'Sommeil', val:metriques?.sommeil||0, goal:8,     color:'#a78bfa', fmt: v => `${v}h` },
    { iconEl:<MoodIcon size={16} color="#fbbf24" />,  label:'Humeur',  val:metriques?.humeur||0,  goal:5,     color:'#fbbf24', fmt: v => `${v}/5` },
  ]
  return (
    <div style={hc.strip}>
      {items.map((it, i) => {
        const pct = Math.min((it.val / it.goal) * 100, 100)
        const done = pct >= 100
        return (
          <div key={i} style={{
            ...hc.stripItem,
            boxShadow:`0 8px 24px ${it.color}22, 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
            borderColor: it.val > 0 ? it.color + '35' : '#f0e8e0',
            animation:`tabFade 0.4s ease ${i * 0.08}s both`,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ display:'flex', alignItems:'center' }}>{it.iconEl}</span>
              <span style={{ fontSize:12, fontWeight:800, color: it.val > 0 ? it.color : '#c4b5a8' }}>
                {it.val > 0 ? it.fmt(it.val) : ''}
              </span>
            </div>
            <div style={{ height:7, background:'rgba(0,0,0,0.05)', borderRadius:4, overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${pct}%`,
                background:`linear-gradient(90deg, ${it.color}cc, ${it.color})`,
                borderRadius:4,
                transition:'width 1.4s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: done ? `0 0 10px ${it.color}80` : 'none',
              }} />
            </div>
            <div style={{ fontSize:9, color:'#8a7265', marginTop:5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{it.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── INSIGHT CARDS ────────────────────────────────────────────────────────────
const CARD_COLORS = [
  { from:'#FF6B35', to:'#FF9A3C', bg:'#FFF3EE' },
  { from:'#38bdf8', to:'#7dd3fc', bg:'#EFF9FF' },
  { from:'#34c759', to:'#86efac', bg:'#EDFFF3' },
  { from:'#a78bfa', to:'#c4b5fd', bg:'#F5F0FF' },
  { from:'#fbbf24', to:'#fde68a', bg:'#FFFBEC' },
]

function InsightCards({ profil, metriques, onChat }) {
  const [hovered, setHovered] = useState(null)
  const [pressed, setPressed] = useState(null)
  const h = new Date().getHours()
  const cards = [
    h < 10
      ? { icon:<SunIcon size={18} color="#FF6B35" />, title:'Débute bien ta journée', body:'1 verre d\'eau au réveil + 5 min de lumière naturelle active le métabolisme.', action:'Conseils matin' }
      : h < 14
      ? { icon:<FoodIcon size={18} color="#34c759" />, title:'Repas de midi', body:'Protéines + légumes + glucides lents. Évite les sucres rapides qui fatiguent.', action:'Idées repas' }
      : h < 18
      ? { icon:<FlashIcon size={18} color="#fbbf24" />, title:'Regain d\'énergie', body:'10 min de marche = autant d\'énergie qu\'un café, sans le crash post-caféine.', action:'Me remotiver' }
      : { icon:<MoonIcon size={18} color="#a78bfa" />, title:'Prépare ton sommeil', body:'Coupe les écrans 30 min avant de dormir. La mélatonine se libère dans l\'obscurité.', action:'Routine soir' },
    {
      icon:<WaterIcon size={18} color="#38bdf8" />,
      title: metriques?.eau >= 4 ? 'Hydratation OK !' : 'Bois de l\'eau',
      body: metriques?.eau > 0
        ? `${metriques.eau}/8 verres aujourd'hui. ${metriques.eau < 4 ? 'Bois un verre maintenant !' : 'Continue comme ça !'}`
        : 'Objectif : 8 verres/jour. Commence maintenant.',
      action:'Mettre à jour',
    },
    profil?.objectifs?.[0] && {
      icon:<TargetIcon size={18} color="#FF6B35" />,
      title: profil.objectifs[0],
      body:'Chaque petite action compte. Qu\'est-ce que tu peux faire aujourd\'hui ?',
      action:'Conseils personnalisés',
    },
    { icon:<LeafIcon size={18} color="#34c759" />, title:'Santé naturelle', body:'Plantes, tisanes et techniques holistiques personnalisées pour ton profil.', action:'herbal' },
    { icon:<MeditateIcon size={18} color="#a78bfa" />, title:'Respiration 5-5', body:'2 min de cohérence cardiaque réduisent le cortisol de 20% immédiatement.', action:'En savoir plus' },
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
          const isPrs = pressed === i
          return (
            <button key={i}
              style={{
                ...hc.card,
                background: col.bg,
                borderColor: isHov ? col.from + '60' : col.from + '25',
                transform: isPrs ? 'scale(0.96)' : isHov ? 'translateY(-6px) scale(1.02)' : 'none',
                boxShadow: isHov
                  ? `0 20px 48px ${col.from}35, 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)`
                  : `0 6px 24px ${col.from}18, 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)`,
                transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                animation:`tabFade 0.4s ease ${i * 0.07}s both`,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => { setHovered(null); setPressed(null) }}
              onMouseDown={() => setPressed(i)}
              onMouseUp={() => setPressed(null)}
              onTouchStart={() => setPressed(i)}
              onTouchEnd={() => setPressed(null)}
              onClick={() => {
                if (c.action === 'herbal') onChat('herbal')
                else if (c.action === 'Mettre à jour') onChat('sante')
                else onChat(c.action)
              }}>
              {/* Color bar top */}
              <div style={{ ...hc.cardBar, background:`linear-gradient(90deg, ${col.from}, ${col.to})` }} />
              <div style={{...hc.cardTitle, display:'flex', alignItems:'center', gap:8}}>{c.icon}{c.title}</div>
              <div style={hc.cardBody}>{c.body}</div>
              <div style={{
                ...hc.cardCta,
                color: col.from,
                background:`linear-gradient(90deg, ${col.from}15, ${col.to}08)`,
              }}>
                {c.action === 'herbal' ? 'Voir Herbal →' : c.action + ' →'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── QUICK ACTIONS ─────────────────────────────────────────────────────────────
const ACTIONS = [
  { tab:'chat',    iconEl:<ChatIcon size={24} color="#fff" />,    label:'Coach IA', from:'#FF6B35', to:'#FF9A3C' },
  { tab:'routine', iconEl:<CalendarIcon size={24} color="#fff" />,label:'Routine',  from:'#5856d6', to:'#8b89f5' },
  { tab:'herbal',  iconEl:<LeafIcon size={24} color="#fff" />,    label:'Herbal',   from:'#34c759', to:'#30d158' },
  { tab:'style',   iconEl:<SparkleIcon size={24} color="#fff" />, label:'Style',    from:'#af52de', to:'#d490f7' },
]

function QuickActions({ onNavigate }) {
  const [hov, setHov] = useState(null)
  const [prs, setPrs] = useState(null)
  return (
    <div style={hc.actionsWrap}>
      <span style={hc.cardsTitle}>Accès rapide</span>
      <div style={hc.actionsGrid}>
        {ACTIONS.map((a, i) => {
          const isHov = hov === i
          const isPrs = prs === i
          return (
            <button key={a.tab}
              style={{
                ...hc.actionBtn,
                background: isHov
                  ? `linear-gradient(145deg, ${a.from}20, ${a.to}12)`
                  : '#ffffff',
                transform: isPrs ? 'scale(0.93)' : isHov ? 'translateY(-6px)' : 'none',
                boxShadow: isHov
                  ? `0 16px 40px ${a.from}40, 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)`
                  : `0 6px 20px ${a.from}20, 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
                borderColor: isHov ? a.from + '50' : a.from + '20',
                transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                animation:`tabFade 0.45s ease ${i * 0.07 + 0.1}s both`,
              }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => { setHov(null); setPrs(null) }}
              onMouseDown={() => setPrs(i)}
              onMouseUp={() => setPrs(null)}
              onTouchStart={() => setPrs(i)}
              onTouchEnd={() => setPrs(null)}
              onClick={() => onNavigate(a.tab)}>
              <div style={{
                ...hc.actionIcon,
                background:`linear-gradient(145deg, ${a.from}, ${a.to})`,
                transform: isHov ? 'scale(1.12) rotate(-6deg)' : isPrs ? 'scale(0.9)' : 'scale(1)',
                boxShadow:`0 8px 24px ${a.from}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                transition:'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <span style={{ display:'flex', alignItems:'center' }}>{a.iconEl}</span>
              </div>
              <span style={{
                fontSize:11, fontWeight:800,
                color: isHov ? a.from : '#1a0a00',
                marginTop:8, transition:'color 0.2s',
              }}>{a.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── STREAK & XP WIDGET ───────────────────────────────────────────────────────
function StreakXP({ streak, xp, level }) {
  const xpInLevel  = xp % 100
  const xpNext     = 100
  const pct        = (xpInLevel / xpNext) * 100

  const badges = [
    { min:1,  iconEl:<LeafIcon size={22} color="#fff" />,    label:'Débutant'   },
    { min:3,  iconEl:<FlashIcon size={22} color="#fff" />,   label:'Actif'      },
    { min:7,  iconEl:<FireIcon size={22} color="#fff" />,    label:'En feu'     },
    { min:14, iconEl:<DiamondIcon size={22} color="#fff" />, label:'Diamant'    },
    { min:30, iconEl:<StarIcon size={22} color="#fff" />,    label:'Légendaire' },
  ]
  const badge = [...badges].reverse().find(b => streak >= b.min) || null

  return (
    <div style={{ display:'flex', gap:10, padding:'0 18px 14px' }}>
      {/* Streak */}
      <div style={{
        flex:1, borderRadius:22, padding:'14px 16px',
        background:'linear-gradient(145deg,rgba(255,107,53,0.10),rgba(255,154,60,0.06))',
        border:'1.5px solid rgba(255,107,53,0.20)',
        boxShadow:'0 6px 20px rgba(255,107,53,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{
          width:44, height:44, borderRadius:14, flexShrink:0,
          background:'linear-gradient(135deg,#FF6B35,#E55A00)',
          display:'flex', alignItems:'center', justifyContent:'center',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, boxShadow:'0 6px 16px rgba(255,107,53,0.40)',
        }}>
          {streak >= 7 ? <FireIcon size={22} color="#fff" /> : streak >= 3 ? <FlashIcon size={22} color="#fff" /> : <LeafIcon size={22} color="#fff" />}
        </div>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:'#1a0a00', lineHeight:1 }}>
            {streak}<span style={{ fontSize:11, fontWeight:500, color:'#c4b5a8', marginLeft:3 }}>jours</span>
          </div>
          <div style={{ fontSize:10, color:'#FF6B35', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:2 }}>
            {streak > 0 ? (badge ? badge.label : 'Streak') : 'Commence !'}
          </div>
        </div>
      </div>

      {/* XP + Level */}
      <div style={{
        flex:1.4, borderRadius:22, padding:'14px 16px',
        background:'linear-gradient(145deg,rgba(168,139,250,0.10),rgba(124,58,237,0.06))',
        border:'1.5px solid rgba(168,139,250,0.22)',
        boxShadow:'0 6px 20px rgba(168,139,250,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:10, color:'#a78bfa', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Niveau {level}
            </div>
            <div style={{ fontSize:18, fontWeight:900, color:'#1a0a00', lineHeight:1.1 }}>
              {xp} <span style={{ fontSize:10, color:'#c4b5a8', fontWeight:500 }}>XP</span>
            </div>
          </div>
          <div style={{
            width:36, height:36, borderRadius:12,
            background:'linear-gradient(135deg,#a78bfa,#7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, boxShadow:'0 4px 14px rgba(167,139,250,0.45)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}><StarIcon size={18} color="#fff" /></div>
        </div>
        {/* Progress bar */}
        <div style={{ height:6, background:'rgba(167,139,250,0.15)', borderRadius:4, overflow:'hidden' }}>
          <div style={{
            height:'100%', width:`${pct}%`,
            background:'linear-gradient(90deg,#a78bfa,#7c3aed)',
            borderRadius:4, transition:'width 1s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow:'0 0 8px rgba(167,139,250,0.60)',
          }} />
        </div>
        <div style={{ fontSize:9, color:'#c4b5a8', marginTop:4, fontWeight:600 }}>
          {xpNext - xpInLevel} XP pour le niveau {level + 1}
        </div>
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onSwitchTab, onChat, streak = 0, xp = 0, level = 1 }) {
  return (
    <div style={hc.page}>
      <ScoreCircle
        score={score} scoreColor={scoreColor}
        profil={profil} metriques={metriques} onLog={onLog}
      />
      <ProgressStrip metriques={metriques} />
      <StreakXP streak={streak} xp={xp} level={level} />
      <InsightCards profil={profil} metriques={metriques}
        onChat={action => {
          if (action === 'herbal') { onSwitchTab('herbal'); return }
          if (action === 'sante')  { onSwitchTab('sante');  return }
          onSwitchTab('chat'); onChat(action)
        }}
      />
      <QuickActions onNavigate={onSwitchTab} />
      <div style={{ height:24 }} />
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hc = {
  page: { display:'flex', flexDirection:'column', paddingBottom:90 },

  // Hero
  hero: { position:'relative', minHeight:500, display:'flex', alignItems:'center',
    justifyContent:'center', overflow:'hidden', paddingBottom:28 },
  greetBadge: { display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(255,107,53,0.14)', border:'1px solid rgba(255,107,53,0.3)',
    borderRadius:24, padding:'6px 16px', fontSize:11, color:'#FF6B35', fontWeight:700,
    marginBottom:12, marginTop:32, letterSpacing:'0.3px',
    boxShadow:'0 2px 12px rgba(255,107,53,0.15)' },
  greetDot: { width:7, height:7, borderRadius:'50%', background:'#FF6B35',
    display:'inline-block', animation:'dotPulse 2s ease-in-out infinite',
    boxShadow:'0 0 6px rgba(255,107,53,0.7)' },
  greetName: { fontSize:26, fontWeight:900, color:'#1a0a00', letterSpacing:'-0.6px',
    marginBottom:22, textAlign:'center' },
  greetNameAccent: { background:'linear-gradient(135deg,#FF6B35,#FF9A3C)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  circleWrap: { position:'relative', width:248, height:248,
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 },
  logBtn: {
    display:'flex', alignItems:'center', gap:8, padding:'14px 32px',
    background:'linear-gradient(145deg, #FF6B35, #E55A00)',
    color:'#fff', border:'none', borderRadius:22, fontSize:13, fontWeight:800,
    cursor:'pointer', fontFamily:'Poppins,sans-serif',
    boxShadow:'0 12px 36px rgba(255,107,53,0.45), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)',
    transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s' },

  // Progress strip
  strip: { display:'flex', gap:10, padding:'14px 18px' },
  stripItem: { flex:1, background:'#ffffff', border:'1px solid',
    borderRadius:20, padding:'12px 12px 10px',
    transition:'box-shadow 0.2s' },

  // Cards
  cardsWrap: { padding:'8px 18px 8px' },
  cardsHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  cardsTitle: { fontSize:16, fontWeight:900, color:'#1a0a00', letterSpacing:'-0.3px' },
  cardsCount: { fontSize:11, color:'#FF6B35', fontWeight:800,
    background:'rgba(255,107,53,0.12)', padding:'3px 12px', borderRadius:20,
    boxShadow:'0 2px 8px rgba(255,107,53,0.15)' },
  cardsScroll: { display:'flex', gap:14, overflowX:'auto', paddingBottom:10,
    scrollbarWidth:'none', WebkitOverflowScrolling:'touch' },
  card: { flexShrink:0, width:200,
    border:'1.5px solid', borderRadius:24, padding:'16px 14px 14px',
    textAlign:'left', cursor:'pointer', fontFamily:'Poppins,sans-serif',
    display:'flex', flexDirection:'column',
    position:'relative', overflow:'hidden' },
  cardBar: { position:'absolute', top:0, left:0, right:0, height:4, borderRadius:'24px 24px 0 0' },
  cardTitle: { fontSize:13, fontWeight:800, color:'#1a0a00', marginBottom:8, lineHeight:1.3, marginTop:8 },
  cardBody: { fontSize:12, color:'#6b5e55', lineHeight:1.65, flex:1, marginBottom:12 },
  cardCta: { fontSize:11, fontWeight:800, borderRadius:10, padding:'5px 10px',
    display:'inline-block', alignSelf:'flex-start' },

  // Quick actions
  actionsWrap: { padding:'8px 18px 4px' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginTop:12 },
  actionBtn: { border:'1.5px solid', borderRadius:22,
    padding:'18px 8px 14px', display:'flex', flexDirection:'column', alignItems:'center',
    cursor:'pointer', fontFamily:'Poppins,sans-serif' },
  actionIcon: { width:52, height:52, borderRadius:18,
    display:'flex', alignItems:'center', justifyContent:'center' },
}
