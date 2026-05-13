import React, { useState, useEffect, useRef, useMemo } from 'react'
import { WaterIcon, MoodIcon, HeartIcon, FlashIcon, FireIcon, DiamondIcon, LeafIcon, MeditateIcon, FoodIcon, MoonIcon, SunIcon, TargetIcon, ChatIcon, SparkleIcon, StarIcon, LightbulbIcon, BrainIcon, RunIcon, CalendarIcon } from './Icons'

// ─── FUTURISTIC BG ────────────────────────────────────────────────────────────
function FuturisticBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden' }}>
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(135deg, #FFF8F4 0%, #F5F0FF 45%, #EFF9FF 75%, #FFF8F4 100%)',
        backgroundSize:'400% 400%',
        animation:'meshGrad 10s ease infinite',
      }} />
      {/* Orb orange */}
      <div style={{ position:'absolute', top:'-12%', right:'-6%', width:380, height:380,
        borderRadius:'50%',
        background:'radial-gradient(circle at 30% 30%, rgba(255,107,53,0.40), rgba(255,154,60,0.18), transparent 66%)',
        animation:'floatOrb 8s ease-in-out infinite', filter:'blur(2px)' }} />
      {/* Orb violet */}
      <div style={{ position:'absolute', bottom:'-10%', left:'-8%', width:320, height:320,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(167,139,250,0.32), transparent 66%)',
        animation:'floatOrb 12s ease-in-out infinite reverse', filter:'blur(2px)' }} />
      {/* Orb cyan */}
      <div style={{ position:'absolute', top:'40%', right:'6%', width:160, height:160,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(56,189,248,0.24), transparent 66%)',
        animation:'floatOrb 6.5s ease-in-out infinite 1.5s' }} />
      {/* Dot grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.055 }}>
        <defs>
          <pattern id="dotGrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#FF6B35"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)"/>
      </svg>
    </div>
  )
}

// ─── NOVA GLOW SCORE CIRCLE ───────────────────────────────────────────────────
function NovaGlowScore({ score, scoreColor, profil, metriques, onLog }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
  const glowColor = scoreColor || '#FF6B35'

  return (
    <div style={hc.hero}>
      <FuturisticBg />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>

        <div style={hc.greetBadge}>
          <span style={hc.greetDot} />
          {dayLabel}
        </div>
        <div style={hc.greetName}>{greeting}, <span style={hc.greetNameAccent}>{profil?.nom}</span> !</div>

        {/* ── Nova Glow Ring ── */}
        <div style={hc.circleWrap}>

          {/* Aurora halos — subtle, behind ring */}
          <div style={{
            position:'absolute', inset:-50, borderRadius:'50%', pointerEvents:'none',
            background:'radial-gradient(circle at center, rgba(167,139,250,0.22) 0%, rgba(56,189,248,0.12) 40%, transparent 65%)',
            animation:'novaBreath 3.5s ease-in-out infinite', filter:'blur(14px)',
          }} />
          <div style={{
            position:'absolute', inset:-24, borderRadius:'50%', pointerEvents:'none',
            background:'radial-gradient(circle, rgba(255,107,53,0.14) 0%, transparent 55%)',
            animation:'novaBreath 3.5s ease-in-out infinite 0.9s',
          }} />

          {/* Spinning conic gradient ring */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%', pointerEvents:'none',
            background:'conic-gradient(from 0deg, #FF6B35 0%, #a78bfa 28%, #38bdf8 52%, #fbbf24 74%, #FF6B35 100%)',
            animation:'novaSpin 6s linear infinite',
          }}>
            {/* White/beige glass center — creates ring effect */}
            <div style={{ position:'absolute', inset:7, borderRadius:'50%', background:'rgba(248,248,246,0.97)', backdropFilter:'blur(8px)' }} />
          </div>

          {/* Inner fine ring */}
          <div style={{
            position:'absolute', inset:14, borderRadius:'50%', pointerEvents:'none',
            border:'1px solid rgba(0,0,0,0.05)',
          }} />

          {/* Score text — non-rotating, centered */}
          <div style={{
            position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              fontSize:50, fontWeight:900, color:'#1a0a00', lineHeight:1,
              animation: mounted ? 'countIn 0.8s ease 0.3s both' : 'none',
            }}>
              {score > 0 ? score : '—'}
            </div>
            <div style={{ fontSize:9, color:'#8a7265', letterSpacing:'2.8px', textTransform:'uppercase', fontWeight:700, marginTop:5 }}>
              SCORE FORME
            </div>
          </div>

          {/* Metric dots */}
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
                position:'absolute', left:x-24, top:y-24, width:48, height:48, zIndex:3,
                borderRadius:15,
                background: 'rgba(255,255,255,0.95)',
                border:`1.5px solid ${filled ? m.color+'50' : 'rgba(0,0,0,0.08)'}`,
                backdropFilter:'blur(14px)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:1.5, cursor:'pointer',
                boxShadow: filled
                  ? `0 0 0 3px ${m.color}18, 0 0 16px ${m.color}45, inset 0 1px 0 rgba(255,255,255,1)`
                  : '0 4px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                fontFamily:"'Inter',system-ui,sans-serif",
                transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                {filled && (
                  <div style={{
                    position:'absolute', top:-5, right:-5, width:14, height:14, borderRadius:'50%',
                    background:m.color, display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:`0 0 8px ${m.color}`, animation:'badgePop .3s cubic-bezier(0.34,1.56,0.64,1)',
                  }}>
                    <span style={{ fontSize:8, color:'#fff', fontWeight:900, lineHeight:1 }}>✓</span>
                  </div>
                )}
                <span style={{ display:'flex', alignItems:'center', lineHeight:1 }}>{m.iconEl}</span>
                {filled && <span style={{ fontSize:7, color:m.color, fontWeight:800, lineHeight:1 }}>{m.fmt(m.val)}</span>}
              </button>
            )
          })}
        </div>

        {/* Log button — dark glass style */}
        <NovaLogBtn onClick={onLog} />
      </div>
    </div>
  )
}

function NovaLogBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)
  const [spot, setSpot] = useState({ x:50, y:50 })
  const ref = useRef()
  function onMove(e) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setSpot({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 })
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ position:'relative', borderRadius:22, marginTop:2,
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
      {/* Spinning conic border */}
      <div style={{
        position:'absolute', inset:-1.5, borderRadius:23.5,
        background:'conic-gradient(from 0deg, #FF6B35 0%, #a78bfa 35%, #38bdf8 60%, #FF6B35 100%)',
        animation:'novaSpin 4s linear infinite',
        opacity: hovered ? 1 : 0.55, transition:'opacity 0.3s ease',
      }} />
      <button onClick={onClick} style={{
        position:'relative', zIndex:1, borderRadius:22,
        background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)',
        border:'none', cursor:'pointer', overflow:'hidden',
        display:'flex', alignItems:'center', gap:9, padding:'14px 30px',
        fontFamily:"'Inter',system-ui,sans-serif", fontSize:13, fontWeight:800, color:'#1a0a00',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.06)',
        transition:'box-shadow 0.25s ease',
      }}>
        {/* Spotlight */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background: hovered ? `radial-gradient(circle 80px at ${spot.x}% ${spot.y}%, rgba(255,107,53,0.12) 0%, transparent 72%)` : 'transparent',
          transition: hovered ? 'none' : 'opacity 0.4s ease',
        }} />
        <span style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center' }}>
          <HeartIcon size={15} color="#FF6B35" />
        </span>
        <span style={{ position:'relative', zIndex:1 }}>Mettre à jour mes métriques</span>
      </button>
    </div>
  )
}

// ─── MAGNETIC GLOW BUTTON (Quick Actions) ─────────────────────────────────────
function MagneticGlowBtn({ label, iconEl, from, to, onClick }) {
  const [spot, setSpot] = useState({ x:50, y:50 })
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const ref = useRef()
  function onMove(e) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setSpot({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 })
  }
  return (
    <div ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); setHovered(false) }}
      onClick={onClick}
      style={{
        position:'relative', borderRadius:22, cursor:'pointer',
        transform: pressed ? 'scale(0.90)' : hovered ? 'scale(1.06)' : 'scale(1)',
        transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
      {/* Spinning conic border */}
      <div style={{
        position:'absolute', inset:-1.5, borderRadius:23.5,
        background:`conic-gradient(from 0deg, ${from} 0%, ${to} 45%, ${from} 100%)`,
        animation:`novaSpin ${hovered ? '2s' : '4s'} linear infinite`,
        opacity: hovered ? 1 : 0.45,
        transition:'opacity 0.3s ease, animation-duration 0.3s ease',
      }} />
      {/* White glass body */}
      <div style={{
        position:'absolute', inset:1.5, borderRadius:20.5,
        background:'rgba(255,255,255,0.97)',
        backdropFilter:'blur(12px)',
        overflow:'hidden',
      }}>
        {/* Mouse spotlight */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background: hovered
            ? `radial-gradient(circle 65px at ${spot.x}% ${spot.y}%, ${from}20 0%, transparent 72%)`
            : 'transparent',
          transition: hovered ? 'none' : 'opacity 0.4s ease',
        }} />
      </div>
      {/* Content */}
      <div style={{
        position:'relative', zIndex:2,
        display:'flex', flexDirection:'column', alignItems:'center',
        padding:'18px 8px 14px',
      }}>
        <div style={{
          width:50, height:50, borderRadius:17,
          background:`linear-gradient(145deg, ${from}, ${to})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: hovered ? `0 8px 28px ${from}80` : `0 5px 16px ${from}50`,
          transition:'box-shadow 0.25s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          transform: hovered ? 'scale(1.12) translateY(-2px)' : 'scale(1)',
        }}>
          {iconEl}
        </div>
        <span style={{ fontSize:11, fontWeight:800, color:'#1a0a00', marginTop:9, letterSpacing:'0.2px' }}>{label}</span>
      </div>
    </div>
  )
}

// ─── METRIC RINGS (remplace ProgressStrip) ────────────────────────────────────
function MetricRing({ iconEl, label, val, goal, color, fmt, index }) {
  const [anim, setAnim] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnim(true), 120 + index * 90); return () => clearTimeout(t) }, [])
  const R = 24
  const C = 2 * Math.PI * R
  const pct = Math.min((val / goal) * 100, 100)
  const dash = anim ? (pct / 100) * C : 0
  const done = pct >= 100

  return (
    <div style={{
      flex:1, background:'#ffffff',
      border:`1.5px solid ${val > 0 ? color+'30' : '#f0e8e0'}`,
      borderRadius:22, padding:'14px 8px 12px',
      boxShadow:`0 6px 20px ${color}18, inset 0 1px 0 rgba(255,255,255,0.9)`,
      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      animation:`tabFade 0.4s ease ${index * 0.08}s both`,
      transition:'box-shadow 0.3s ease',
    }}>
      {/* Ring SVG */}
      <div style={{ position:'relative', width:60, height:60 }}>
        <svg width={60} height={60} viewBox="0 0 60 60"
          style={{ transform:'rotate(-90deg)', overflow:'visible' }}>
          <circle cx="30" cy="30" r={R} fill="none"
            stroke={color+'18'} strokeWidth="4.5"/>
          <circle cx="30" cy="30" r={R} fill="none"
            stroke={color} strokeWidth="4.5" strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{
              transition:'stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)',
              filter: done
                ? `drop-shadow(0 0 6px ${color})`
                : `drop-shadow(0 0 3px ${color}80)`,
            }}/>
        </svg>
        {/* Center icon/check */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {done
            ? <span style={{ fontSize:16, color, fontWeight:900, animation:'badgePop 0.4s ease' }}>✓</span>
            : iconEl}
        </div>
        {/* Completed pulse ring */}
        {done && (
          <div style={{
            position:'absolute', inset:-6, borderRadius:'50%',
            border:`2px solid ${color}40`,
            animation:'scoreGlow 2s ease-in-out infinite',
            pointerEvents:'none',
          }} />
        )}
      </div>
      {/* Value */}
      <div style={{ fontSize:13, fontWeight:900, color: val > 0 ? color : '#c4b5a8', lineHeight:1 }}>
        {val > 0 ? fmt(val) : '·'}
      </div>
      <div style={{ fontSize:8, color:'#8a7265', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px' }}>{label}</div>
    </div>
  )
}

function MetricRings({ metriques }) {
  const items = [
    { iconEl:<WaterIcon size={17} color="#38bdf8" />, label:'Eau',     val:metriques?.eau||0,     goal:8,     color:'#38bdf8', fmt: v => `${v}/8` },
    { iconEl:<RunIcon size={17} color="#FF6B35" />,   label:'Pas',     val:metriques?.pas||0,     goal:10000, color:'#FF6B35', fmt: v => v>=1000 ? `${Math.round(v/1000)}k` : `${v}` },
    { iconEl:<MoonIcon size={17} color="#a78bfa" />,  label:'Sommeil', val:metriques?.sommeil||0, goal:8,     color:'#a78bfa', fmt: v => `${v}h` },
    { iconEl:<MoodIcon size={17} color="#fbbf24" />,  label:'Humeur',  val:metriques?.humeur||0,  goal:5,     color:'#fbbf24', fmt: v => `${v}/5` },
  ]
  return (
    <div style={{ display:'flex', gap:10, padding:'14px 18px' }}>
      {items.map((it, i) => <MetricRing key={i} {...it} index={i} />)}
    </div>
  )
}

// ─── STREAK & XP ──────────────────────────────────────────────────────────────
function StreakXP({ streak, xp, level }) {
  const xpInLevel = xp % 100
  const pct = (xpInLevel / 100) * 100
  return (
    <div style={{ display:'flex', gap:10, padding:'0 18px 14px' }}>
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
          fontSize:22, boxShadow:'0 6px 16px rgba(255,107,53,0.40)',
        }}>
          {streak >= 7 ? <FireIcon size={22} color="#fff" /> : streak >= 3 ? <FlashIcon size={22} color="#fff" /> : <LeafIcon size={22} color="#fff" />}
        </div>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:'#1a0a00', lineHeight:1 }}>
            {streak}<span style={{ fontSize:11, fontWeight:500, color:'#c4b5a8', marginLeft:3 }}>jours</span>
          </div>
          <div style={{ fontSize:10, color:'#FF6B35', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:2 }}>
            {streak > 0 ? 'Streak actif' : 'Commence !'}
          </div>
        </div>
      </div>
      <div style={{
        flex:1.4, borderRadius:22, padding:'14px 16px',
        background:'linear-gradient(145deg,rgba(168,139,250,0.10),rgba(124,58,237,0.06))',
        border:'1.5px solid rgba(168,139,250,0.22)',
        boxShadow:'0 6px 20px rgba(168,139,250,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:10, color:'#a78bfa', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Niveau {level}</div>
            <div style={{ fontSize:18, fontWeight:900, color:'#1a0a00', lineHeight:1.1 }}>
              {xp} <span style={{ fontSize:10, color:'#c4b5a8', fontWeight:500 }}>XP</span>
            </div>
          </div>
          <div style={{
            width:36, height:36, borderRadius:12,
            background:'linear-gradient(135deg,#a78bfa,#7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 14px rgba(167,139,250,0.45)',
          }}><StarIcon size={18} color="#fff" /></div>
        </div>
        {/* Glowing nodes instead of bar */}
        <div style={{ display:'flex', alignItems:'center', gap:3, margin:'6px 0 2px' }}>
          {Array.from({length:10}).map((_, i) => {
            const filled = i < Math.floor(pct / 10)
            const active = i === Math.floor(pct / 10) && pct < 100
            return (
              <div key={i} style={{
                flex: filled ? 1.4 : 1,
                height:5, borderRadius:3,
                background: filled
                  ? 'linear-gradient(90deg,#a78bfa,#7c3aed)'
                  : active
                  ? 'rgba(167,139,250,0.35)'
                  : 'rgba(167,139,250,0.12)',
                boxShadow: filled ? '0 0 7px rgba(167,139,250,0.80)' : 'none',
                transition:'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                animation: active ? 'dotPulse 1.6s ease-in-out infinite' : 'none',
              }} />
            )
          })}
        </div>
        <div style={{ fontSize:9, color:'#c4b5a8', marginTop:4, fontWeight:600 }}>
          {100 - xpInLevel} XP pour le niveau {level + 1}
        </div>
      </div>
    </div>
  )
}

// ─── 7 DAILY TASKS ────────────────────────────────────────────────────────────
function generateDailyTasks(profil, metriques) {
  const h = new Date().getHours()
  const niveau = profil?.niveau || 'débutant'
  const regime = profil?.regime || ''
  const objectif = profil?.objectifs?.[0] || ''
  const tasks = [
    {
      id:'eau', emoji:'💧', color:'#38bdf8',
      title:'Hydratation du jour',
      detail:'Objectif : 8 verres d\'eau',
      goal:8, auto:true, fmt: v => `${v}/8 verres`,
    },
    {
      id:'pas', emoji:'👟', color:'#FF6B35',
      title:'Marche active',
      detail:'10 000 pas pour activer ton métabolisme',
      goal:10000, auto:true, fmt: v => v>=1000 ? `${Math.round(v/1000)}k/10k pas` : `${v}/10k pas`,
    },
    h < 14 ? {
      id:'matin', emoji:'☀️', color:'#fbbf24',
      title:'Démarrage matinal',
      detail: profil?.reveil ? `Levé à ${profil.reveil} — 15 min de lumière naturelle` : '15 min de lumière naturelle ce matin',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    } : {
      id:'soir', emoji:'🌙', color:'#a78bfa',
      title:'Prépare ton sommeil',
      detail: profil?.coucher ? `Écrans off 30 min avant ${profil.coucher}` : 'Écrans éteints 30 min avant dormir',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    },
    {
      id:'nutrition', emoji:'🥗', color:'#34c759',
      title: regime === 'végétarien' ? 'Protéines végétales' : regime === 'vegan' ? 'Équilibre vegan' : regime === 'sans gluten' ? 'Repas sans gluten' : 'Repas équilibrés',
      detail:'3 repas — légumes · protéines · glucides lents',
      goal:3, auto:false, fmt: v => `${v}/3 repas`,
    },
    {
      id:'sport', emoji: niveau==='avancé' ? '🏋️' : niveau==='intermédiaire' ? '🚴' : '🚶',
      color:'#ec4899',
      title: niveau==='avancé' ? 'Session entraînement' : niveau==='intermédiaire' ? 'Cardio 30 min' : 'Mouvement doux',
      detail: niveau==='avancé' ? '45-60 min d\'effort physique' : niveau==='intermédiaire' ? 'Cardio modéré + échauffement' : '20-30 min de stretching ou marche',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    },
    {
      id:'objectif', emoji:'🎯', color:'#FF6B35',
      title: objectif || 'Ton objectif du jour',
      detail: objectif ? `Une action concrète vers : ${objectif}` : 'Avance d\'un pas vers ton grand objectif',
      goal:1, auto:false, fmt: v => v ? 'Accompli !' : 'En cours',
    },
    {
      id:'mental', emoji:'🧘', color:'#8b5cf6',
      title:'Bien-être mental',
      detail:'5 min cohérence cardiaque ou journaling',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    },
  ]
  return tasks
}

function DailyTasks({ profil, metriques, onSwitchTab }) {
  const [done, setDone] = useState({})
  const [collapsed, setCollapsed] = useState(false)
  const tasks = useMemo(() => generateDailyTasks(profil, metriques), [profil?.nom, profil?.objectifs?.[0]])

  const enriched = tasks.map(t => {
    const cur = t.id==='eau' ? (metriques?.eau||0) : t.id==='pas' ? (metriques?.pas||0) : 0
    const autoDone = (t.id==='eau' && cur>=8) || (t.id==='pas' && cur>=10000)
    return { ...t, current: t.auto ? cur : 0, isDone: autoDone || !!done[t.id] }
  })
  const doneCount = enriched.filter(t => t.isDone).length
  const pct = (doneCount / tasks.length) * 100

  function toggle(t) {
    if (t.auto) { onSwitchTab('sante'); return }
    setDone(prev => ({ ...prev, [t.id]: !prev[t.id] }))
  }

  return (
    <div style={{ padding:'4px 18px 8px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:900, color:'#111', letterSpacing:'-0.3px' }}>7 tâches du jour</div>
          <div style={{ fontSize:12, color:'#888', marginTop:1 }}>{doneCount}/{tasks.length} accomplies</div>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)',
          width:32, height:32, borderRadius:10, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#888',
          fontFamily:"'Inter',system-ui,sans-serif",
        }}>{collapsed ? '+' : '−'}</button>
      </div>

      {/* 7 segment dynamic indicators */}
      <div style={{ display:'flex', gap:4, alignItems:'center', marginBottom: collapsed ? 0 : 12 }}>
        {enriched.map((t, i) => (
          <div key={t.id} style={{
            flex: t.isDone ? 2 : 1,
            height: t.isDone ? 8 : 6,
            borderRadius: 4,
            background: t.isDone
              ? `linear-gradient(90deg, ${t.color}dd, ${t.color})`
              : 'rgba(0,0,0,0.07)',
            boxShadow: t.isDone ? `0 0 10px ${t.color}70` : 'none',
            transition: 'all 0.48s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        ))}
      </div>

      {!collapsed && (
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {enriched.map((t, i) => (
            <div key={t.id} onClick={() => toggle(t)} style={{
              display:'flex', alignItems:'center', gap:11,
              padding:'11px 14px',
              background: t.isDone ? t.color+'12' : '#ffffff',
              border:`1.5px solid ${t.isDone ? t.color+'40' : '#f0f0f0'}`,
              borderRadius:16, cursor:'pointer',
              opacity: t.isDone ? 0.72 : 1,
              boxShadow: t.isDone ? `0 4px 14px ${t.color}22` : '0 2px 8px rgba(0,0,0,0.04)',
              transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
              animation:`tabFade 0.4s ease ${i*0.06}s both`,
            }}>
              {/* Checkbox */}
              <div style={{
                width:26, height:26, borderRadius:8, flexShrink:0,
                background: t.isDone ? `linear-gradient(135deg,${t.color},${t.color}cc)` : 'transparent',
                border:`2px solid ${t.isDone ? 'transparent' : '#d1d5db'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: t.isDone ? `0 4px 10px ${t.color}50` : 'none',
                transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                {t.isDone && <span style={{ color:'#fff', fontSize:13, fontWeight:900, lineHeight:1 }}>✓</span>}
              </div>
              <span style={{ fontSize:20, flexShrink:0, lineHeight:1 }}>{t.emoji}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color: t.isDone ? '#888' : '#111',
                  textDecoration: t.isDone ? 'line-through' : 'none',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</div>
                <div style={{ fontSize:11, color:'#999', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.detail}</div>
              </div>
              {t.auto && t.current > 0 && (
                <div style={{ fontSize:10, fontWeight:800, color:t.color, background:t.color+'15', padding:'3px 8px', borderRadius:8, flexShrink:0 }}>
                  {t.fmt(t.current)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SWIPEABLE INSIGHT CARDS ─────────────────────────────────────────────────
function SwipeableInsights({ profil, metriques, onChat }) {
  const [idx, setIdx] = useState(0)
  const [drag, setDrag] = useState(0)
  const [active, setActive] = useState(false)
  const startRef = useRef(0)
  const THRESH = 68

  const h = new Date().getHours()
  const cards = [
    h < 10
      ? { icon:<SunIcon size={20} color="#FF6B35" />, title:'Débute bien ta journée', body:'1 verre d\'eau au réveil + 5 min de lumière naturelle active le métabolisme immédiatement.', action:'Conseils matin', from:'#FF6B35', to:'#FF9A3C', bg:'#FFF3EE' }
      : h < 14
      ? { icon:<FoodIcon size={20} color="#34c759" />, title:'Repas de midi équilibré', body:'Protéines + légumes + glucides lents. Évite les sucres rapides qui te fatiguent l\'après-midi.', action:'Idées repas', from:'#34c759', to:'#86efac', bg:'#EDFFF3' }
      : h < 18
      ? { icon:<FlashIcon size={20} color="#fbbf24" />, title:'Regain d\'énergie', body:'10 min de marche = autant d\'énergie qu\'un café, sans le crash post-caféine.', action:'Me remotiver', from:'#fbbf24', to:'#fde68a', bg:'#FFFBEC' }
      : { icon:<MoonIcon size={20} color="#a78bfa" />, title:'Prépare ton sommeil', body:'Coupe les écrans 30 min avant de dormir. La mélatonine se libère dans l\'obscurité.', action:'Routine soir', from:'#a78bfa', to:'#c4b5fd', bg:'#F5F0FF' },
    {
      icon:<WaterIcon size={20} color="#38bdf8" />,
      title: (metriques?.eau||0) >= 4 ? 'Hydratation OK !' : 'Bois de l\'eau',
      body: (metriques?.eau||0) > 0
        ? `${metriques.eau}/8 verres aujourd'hui. ${metriques.eau < 4 ? 'Un verre maintenant !' : 'Continue comme ça !'}`
        : 'Objectif : 8 verres/jour. Commence maintenant — pose un grand verre devant toi.',
      action:'Mettre à jour', from:'#38bdf8', to:'#7dd3fc', bg:'#EFF9FF',
    },
    profil?.objectifs?.[0] ? {
      icon:<TargetIcon size={20} color="#FF6B35" />,
      title: profil.objectifs[0],
      body:'Chaque petite action compte. Qu\'est-ce que tu peux faire concrètement aujourd\'hui ?',
      action:'Conseils personnalisés', from:'#FF6B35', to:'#FF9A3C', bg:'#FFF3EE',
    } : null,
    { icon:<LeafIcon size={20} color="#34c759" />, title:'Santé naturelle', body:'Plantes, tisanes et techniques holistiques adaptées à ton profil et tes objectifs.', action:'herbal', from:'#34c759', to:'#86efac', bg:'#EDFFF3' },
    { icon:<MeditateIcon size={20} color="#a78bfa" />, title:'Respiration 5-5', body:'2 min de cohérence cardiaque réduisent le cortisol de 20% immédiatement. Inspire 5s, expire 5s.', action:'En savoir plus', from:'#a78bfa', to:'#c4b5fd', bg:'#F5F0FF' },
  ].filter(Boolean)

  function onDown(x) { startRef.current = x; setActive(true) }
  function onMove(x) { if (active) setDrag(x - startRef.current) }
  function onUp() {
    if (!active) return
    setActive(false)
    if (drag < -THRESH && idx < cards.length - 1) setIdx(i => i + 1)
    else if (drag > THRESH && idx > 0) setIdx(i => i - 1)
    setDrag(0)
  }

  return (
    <div style={{ padding:'8px 18px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <span style={hc.cardsTitle}>Insights du jour</span>
        <span style={{ fontSize:12, color:'#FF6B35', fontWeight:700,
          background:'rgba(255,107,53,0.10)', padding:'3px 12px', borderRadius:20,
          boxShadow:'0 2px 8px rgba(255,107,53,0.15)' }}>
          {idx + 1} / {cards.length}
        </span>
      </div>

      {/* Card stack */}
      <div style={{ position:'relative', height:208, userSelect:'none', touchAction: active ? 'none' : 'pan-y' }}>
        {cards.map((c, i) => {
          const offset = i - idx
          if (offset < 0 || offset > 2) return null
          const isFront = offset === 0
          const tx = isFront ? drag : 0
          const rot = isFront ? drag / 22 : 0
          const scale = 1 - offset * 0.045
          const ty = offset * 16
          return (
            <div key={i}
              style={{
                position:'absolute', inset:0, borderRadius:28,
                background: c.bg,
                border:`1.5px solid ${c.from}30`,
                padding:'20px 18px 16px',
                boxShadow:`0 ${8+offset*4}px ${20+offset*14}px ${c.from}${isFront?'32':'18'}`,
                transform:`perspective(900px) translateX(${tx}px) rotate(${rot}deg) scale(${scale}) translateY(${ty}px)`,
                transformOrigin:'bottom center',
                zIndex: cards.length - offset,
                transition: active && isFront ? 'none' : 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.38s ease',
                cursor: isFront ? (active ? 'grabbing' : 'grab') : 'default',
                pointerEvents: isFront ? 'auto' : 'none',
                overflow:'hidden',
              }}
              onMouseDown={isFront ? e => onDown(e.clientX) : null}
              onMouseMove={isFront ? e => onMove(e.clientX) : null}
              onMouseUp={isFront ? onUp : null}
              onMouseLeave={isFront ? onUp : null}
              onTouchStart={isFront ? e => onDown(e.touches[0].clientX) : null}
              onTouchMove={isFront ? e => onMove(e.touches[0].clientX) : null}
              onTouchEnd={isFront ? onUp : null}
            >
              {/* Color bar */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:4,
                background:`linear-gradient(90deg,${c.from},${c.to})`, borderRadius:'28px 28px 0 0' }} />
              {/* Swipe hint (first card only, first visit) */}
              {isFront && idx === 0 && Math.abs(drag) < 5 && (
                <div style={{ position:'absolute', top:'50%', right:14, transform:'translateY(-50%)',
                  opacity:0.3, fontSize:20, animation:'swipeHint 2s ease-in-out infinite',
                  pointerEvents:'none' }}>›</div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10, marginTop:4 }}>
                {c.icon}
                <div style={{ fontSize:14, fontWeight:800, color:'#111', letterSpacing:'-0.02em', lineHeight:1.3 }}>{c.title}</div>
              </div>
              <div style={{ fontSize:13, color:'#555', lineHeight:1.68, marginBottom:13 }}>{c.body}</div>
              <button
                onClick={e => { e.stopPropagation(); if (c.action === 'herbal') onChat('herbal'); else if (c.action === 'Mettre à jour') onChat('sante'); else onChat(c.action) }}
                style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:800, color:c.from,
                  background:`${c.from}18`, padding:'6px 13px', borderRadius:12, border:'none', cursor:'pointer',
                  fontFamily:"'Inter',system-ui,sans-serif", transition:'background 0.2s' }}>
                {c.action === 'herbal' ? 'Voir Herbal →' : c.action + ' →'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Dot indicators */}
      <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16, marginBottom:4 }}>
        {cards.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            height:6, width: i === idx ? 22 : 6, borderRadius:3,
            background: i === idx ? '#FF6B35' : 'rgba(0,0,0,0.12)',
            transition:'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
            cursor:'pointer',
          }} />
        ))}
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
  return (
    <div style={hc.actionsWrap}>
      <span style={hc.cardsTitle}>Accès rapide</span>
      <div style={hc.actionsGrid}>
        {ACTIONS.map(a => (
          <MagneticGlowBtn
            key={a.tab}
            label={a.label}
            iconEl={a.iconEl}
            from={a.from}
            to={a.to}
            onClick={() => onNavigate(a.tab)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── HOME TAB EXPORT ──────────────────────────────────────────────────────────
export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onSwitchTab, onChat, streak = 0, xp = 0, level = 1 }) {
  return (
    <div style={hc.page}>
      <NovaGlowScore
        score={score} scoreColor={scoreColor}
        profil={profil} metriques={metriques} onLog={onLog}
      />
      <MetricRings metriques={metriques} />
      <StreakXP streak={streak} xp={xp} level={level} />
      <DailyTasks profil={profil} metriques={metriques} onSwitchTab={onSwitchTab} />
      <SwipeableInsights profil={profil} metriques={metriques}
        onChat={action => {
          if (action === 'herbal') { onSwitchTab('herbal'); return }
          if (action === 'sante')  { onSwitchTab('sante');  return }
          onSwitchTab('chat'); onChat(action)
        }}
      />
      <QuickActions onNavigate={onSwitchTab} />
      <div style={{ height:32 }} />
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hc = {
  page: { display:'flex', flexDirection:'column', paddingBottom:90 },

  hero: { position:'relative', minHeight:500, display:'flex', alignItems:'center',
    justifyContent:'center', overflow:'hidden', paddingBottom:28 },
  greetBadge: { display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)',
    borderRadius:24, padding:'6px 16px', fontSize:11, color:'#555', fontWeight:600,
    marginBottom:12, marginTop:32, letterSpacing:'0.3px',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  greetDot: { width:7, height:7, borderRadius:'50%', background:'#34c759',
    display:'inline-block', animation:'dotPulse 2s ease-in-out infinite',
    boxShadow:'0 0 6px rgba(52,199,89,0.7)' },
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
    cursor:'pointer', fontFamily:"'Inter',system-ui,sans-serif",
    boxShadow:'0 12px 36px rgba(255,107,53,0.45), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)',
    transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' },

  strip: { display:'flex', gap:10, padding:'14px 18px' },
  stripItem: { flex:1, background:'#ffffff', border:'1px solid',
    borderRadius:20, padding:'12px 12px 10px', transition:'box-shadow 0.2s' },

  cardsWrap: { padding:'8px 18px 8px' },
  cardsHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  cardsTitle: { fontSize:16, fontWeight:900, color:'#1a0a00', letterSpacing:'-0.3px' },

  actionsWrap: { padding:'16px 18px 4px' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginTop:12 },
  actionBtn: { border:'1.5px solid', borderRadius:22,
    padding:'18px 8px 14px', display:'flex', flexDirection:'column', alignItems:'center',
    cursor:'pointer', fontFamily:"'Inter',system-ui,sans-serif" },
  actionIcon: { width:52, height:52, borderRadius:18,
    display:'flex', alignItems:'center', justifyContent:'center' },
}
