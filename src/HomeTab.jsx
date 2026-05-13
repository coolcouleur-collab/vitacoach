import React, { useState, useEffect, useRef, useMemo } from 'react'
import { WaterIcon, MoodIcon, HeartIcon, FlashIcon, FireIcon, DiamondIcon, LeafIcon, MeditateIcon, FoodIcon, MoonIcon, SunIcon, TargetIcon, ChatIcon, SparkleIcon, StarIcon, LightbulbIcon, BrainIcon, RunIcon, CalendarIcon } from './Icons'

// ─── ANIMATED LIQUID BACKGROUND — version originale restaurée ────────────────
function FuturisticBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', background:'#ffffff' }}>

      {/* Jaune doux — légèrement haut-centre, multiply */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 50% 48%, #FFF991 0%, transparent 68%)',
        opacity:0.62, mixBlendMode:'multiply',
        animation:'liquidBlob3 14s ease-in-out infinite',
      }} />

      {/* Orange léger — légèrement bas-gauche, multiply */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 42% 58%, #FF7112 0%, transparent 62%)',
        opacity:0.20, mixBlendMode:'multiply',
        animation:'liquidBlob1 18s ease-in-out infinite reverse',
      }} />

      {/* Teal haut-droite — accent doux */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 88% 8%, rgba(56,193,182,0.55) 0%, transparent 58%)',
        filter:'blur(72px)',
        animation:'liquidBlob2 16s ease-in-out infinite',
      }} />

      {/* Teal bas-gauche — accent doux */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 8% 90%, rgba(56,193,182,0.42) 0%, transparent 52%)',
        filter:'blur(64px)',
        animation:'liquidBlob4 20s ease-in-out infinite reverse',
      }} />

      {/* Chaleur orange bas-droite */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 82% 80%, rgba(255,180,80,0.28) 0%, transparent 50%)',
        filter:'blur(50px)',
        animation:'liquidBlob3 11s ease-in-out infinite 2s',
      }} />

      {/* Dot grid discret */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.022 }}>
        <defs>
          <pattern id="dotGrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="#38c1b6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)"/>
      </svg>
    </div>
  )
}

// ─── NOVA SVG RING — helpers ──────────────────────────────────────────────────
function arcPath(cx, cy, r, a0, a1) {
  const rad = d => (d - 90) * Math.PI / 180
  const sx = cx + r * Math.cos(rad(a0)), sy = cy + r * Math.sin(rad(a0))
  const ex = cx + r * Math.cos(rad(a1)), ey = cy + r * Math.sin(rad(a1))
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${r},${r},0,${a1-a0>180?1:0},1,${ex.toFixed(2)},${ey.toFixed(2)}`
}

const SVG_SZ = 248, SVG_C = 124, RING_R = 112

// Arcs Nova : blanc + beige chaud + violet + menthe
const RING_ARCS = [
  [  0,  90, 'rgba(255,255,255,0.95)', 3.5],   // blanc
  [100, 185, 'rgba(245,236,210,0.88)', 3.0],   // beige doré
  [195, 280, 'rgba(209,196,253,0.60)', 2.5],   // violet doux
  [290, 354, 'rgba(167,243,208,0.70)', 2.5],   // menthe
]
// Glow derrière
const GLOW_ARCS = [
  [  0,  90, 'rgba(255,255,255,0.30)', 14],
  [100, 185, 'rgba(245,228,175,0.28)', 14],    // beige glow
  [195, 280, 'rgba(209,196,253,0.20)', 12],
  [290, 354, 'rgba(167,243,208,0.22)', 12],
]
// Comètes : blanc, beige doré, menthe
const COMET_DOTS = [
  { a:   0, r: 5.5, fill:'#ffffff',              glowColor:'rgba(255,255,255,0.90)' },
  { a: 130, r: 4.0, fill:'rgba(245,225,160,1)',  glowColor:'rgba(240,200,100,0.65)' }, // beige/or
  { a: 255, r: 3.5, fill:'rgba(167,243,208,1)',  glowColor:'rgba(52,211,153,0.60)'  }, // menthe
]

// ─── NOVA GLOW SCORE CIRCLE ───────────────────────────────────────────────────
function NovaGlowScore({ score, scoreColor, profil, metriques, onLog }) {
  const [mounted, setMounted] = useState(false)
  const [activeMetric, setActiveMetric] = useState(null)

  // rAF refs — rotation fluide sans re-render React
  const ringRef    = useRef(null)
  const glowRef    = useRef(null)
  const angleRef   = useRef(0)
  const speedRef   = useRef(1)
  const targetRef  = useRef(1)
  const pausedRef  = useRef(false)
  const lastTsRef  = useRef(null)
  const rafRef     = useRef(null)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  // Sync pause sans re-render
  useEffect(() => { pausedRef.current = !!activeMetric }, [activeMetric])

  // Boucle rAF — vitesse lissée par lerp
  useEffect(() => {
    function tick(ts) {
      if (!lastTsRef.current) lastTsRef.current = ts
      const dt = Math.min(ts - lastTsRef.current, 50)
      lastTsRef.current = ts
      // lerp doux vers la vitesse cible
      speedRef.current += (targetRef.current - speedRef.current) * 0.045
      if (!pausedRef.current) {
        // ~60°/s à speed=1 → tour complet en ~6s
        angleRef.current = (angleRef.current + dt * 0.058 * speedRef.current) % 360
      }
      const xfm = `rotate(${angleRef.current.toFixed(2)},${SVG_C},${SVG_C})`
      if (ringRef.current) ringRef.current.setAttribute('transform', xfm)
      if (glowRef.current) glowRef.current.setAttribute('transform', xfm)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  const METRICS = [
    { angle:-90, iconEl:<WaterIcon size={17} color="#38bdf8" />, val:metriques?.eau,     color:'#38bdf8', key:'eau',     fmt: v => v+'v' },
    { angle:-18, iconEl:<RunIcon size={17} color="#C87B52" />,   val:metriques?.pas,     color:'#C87B52', key:'pas',     fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
    { angle: 54, iconEl:<MoonIcon size={17} color="#C87B52" />,  val:metriques?.sommeil, color:'#C87B52', key:'sommeil', fmt: v => v+'h' },
    { angle:126, iconEl:<MoodIcon size={17} color="#fbbf24" />,  val:metriques?.humeur,  color:'#fbbf24', key:'humeur',  fmt: v => v+'/5' },
    { angle:198, iconEl:<HeartIcon size={17} color="#ff3b30" />, val:metriques?.fc,      color:'#ff3b30', key:'fc',      fmt: v => v },
  ]

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
        <div style={hc.circleWrap}
          onMouseEnter={() => { targetRef.current = 3 }}
          onMouseLeave={() => { targetRef.current = 1 }}
        >
          {/* Halos aurora — ne débordent pas vers le haut (top:0) */}
          <div style={{ position:'absolute', top:0, left:-80, right:-80, bottom:-80, borderRadius:'50%', pointerEvents:'none',
            background:'radial-gradient(ellipse at 30% 70%, rgba(216,180,254,0.22) 0%, transparent 52%)',
            animation:'novaBreath 4s ease-in-out infinite', filter:'blur(22px)' }} />
          <div style={{ position:'absolute', top:0, left:-80, right:-80, bottom:-80, borderRadius:'50%', pointerEvents:'none',
            background:'radial-gradient(ellipse at 70% 80%, rgba(167,243,208,0.20) 0%, transparent 52%)',
            animation:'novaBreath 5.5s ease-in-out infinite 1.2s', filter:'blur(22px)' }} />
          <div style={{ position:'absolute', top:0, left:-65, right:-65, bottom:-65, borderRadius:'50%', pointerEvents:'none',
            background:'radial-gradient(ellipse at 20% 75%, rgba(255,249,145,0.50) 0%, transparent 50%)',
            animation:'novaBreath 6s ease-in-out infinite 2.4s', filter:'blur(16px)' }} />

          {/* SVG Ring — animé par rAF, aucun re-render React */}
          <svg width={SVG_SZ} height={SVG_SZ} aria-hidden="true"
            style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'visible' }}>
            <defs>
              <filter id="novaGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="7" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Glow flou très doux — pas de trait visible */}
            <g ref={glowRef}>
              {GLOW_ARCS.map(([a0,a1,color,w], i) => (
                <path key={i}
                  d={arcPath(SVG_C, SVG_C, RING_R, a0, a1)}
                  stroke={color} strokeWidth={w * 1.6} fill="none" strokeLinecap="round"
                  filter="url(#novaGlow)" opacity="0.55" />
              ))}
            </g>
            {/* Comètes seulement — pas d'arcs/traits */}
            <g ref={ringRef}>
              {COMET_DOTS.map((c, i) => {
                const rad = (c.a - 90) * Math.PI / 180
                const cx = SVG_C + RING_R * Math.cos(rad)
                const cy = SVG_C + RING_R * Math.sin(rad)
                return (
                  <circle key={i} cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={c.r} fill={c.fill}
                    style={{ filter:`drop-shadow(0 0 9px ${c.glowColor})` }} />
                )
              })}
            </g>
          </svg>

          {/* Centre verre blanc pur */}
          <div style={{
            position:'absolute', inset:11, borderRadius:'50%',
            background:'rgba(255,255,254,0.97)', backdropFilter:'blur(4px)',
            pointerEvents:'none',
          }} />

          {/* ── Score texte — centré, sans label ── */}
          <div style={{
            position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            {score > 0 ? (
              <div style={{
                fontSize:54, fontWeight:900, color:'#1a0a00', lineHeight:1,
                animation: mounted ? 'countIn 0.8s ease 0.3s both' : 'none',
              }}>
                {score}
              </div>
            ) : (
              /* Pas de score encore — 3 dots discrets */
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#E8A07A', animation:'pulseDot1 1.8s ease-in-out infinite' }} />
                <div style={{ width:11, height:11, borderRadius:'50%', background:'linear-gradient(135deg,#C87B52,#E8A07A)', animation:'pulseDot2 1.8s ease-in-out infinite 0.3s', boxShadow:'0 0 10px rgba(200,123,82,0.55)' }} />
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#E8A07A', animation:'pulseDot3 1.8s ease-in-out infinite 0.6s' }} />
              </div>
            )}
          </div>

          {/* ── Metric dots — spring bounce + glow ring au clic (gradient Framer button style) ── */}
          {METRICS.map(m => {
            const rad = (m.angle * Math.PI) / 180
            const x = 100 + 118 * Math.cos(rad)
            const y = 100 + 118 * Math.sin(rad)
            const filled = m.val > 0
            const isActive = activeMetric === m.key
            return (
              <MetricDot key={m.key} m={m} x={x} y={y} filled={filled} isActive={isActive}
                onDown={() => setActiveMetric(m.key)}
                onUp={() => setActiveMetric(null)}
                onLog={onLog}
              />
            )
          })}
        </div>

        {/* Log button */}
        <NovaLogBtn onClick={onLog} />
      </div>
    </div>
  )
}

// ─── METRIC DOT — spring bounce + glow ring (gradient Framer button style) ────
function MetricDot({ m, x, y, filled, isActive, onDown, onUp, onLog }) {
  const [springing, setSpringing] = useState(false)
  const [rings, setRings] = useState([])

  function handleDown() {
    onDown()
    setSpringing(false) // reset d'abord
  }
  function handleUp(e) {
    onUp()
    // Lance le spring bounce + glow ring
    const id = Date.now()
    setSpringing(true)
    setRings(prev => [...prev, id])
    setTimeout(() => { setSpringing(false) }, 650)
    setTimeout(() => setRings(prev => prev.filter(r => r !== id)), 750)
  }
  function handleLeave() {
    onUp()
  }

  return (
    <button
      onClick={onLog}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleLeave}
      onPointerCancel={handleLeave}
      style={{
        position:'absolute', left:x-24, top:y-24, width:48, height:48, zIndex:3,
        borderRadius:15, overflow:'visible',
        background: isActive ? `${m.color}18` : springing ? `${m.color}12` : 'rgba(255,255,255,0.95)',
        border:`1.5px solid ${isActive ? m.color+'90' : filled ? m.color+'55' : 'rgba(0,0,0,0.08)'}`,
        backdropFilter:'blur(14px)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:1.5, cursor:'pointer',
        boxShadow: isActive
          ? `0 0 0 4px ${m.color}35, 0 0 28px ${m.color}80, inset 0 1px 0 rgba(255,255,255,1)`
          : filled
          ? `0 0 0 3px ${m.color}18, 0 0 16px ${m.color}45, inset 0 1px 0 rgba(255,255,255,1)`
          : '0 4px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        transform: isActive ? 'scale(0.84)' : 'scale(1)',
        animation: springing ? 'metricSpring 0.55s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
        fontFamily:"'Inter',system-ui,sans-serif",
        transition: springing ? 'none' : 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
      {/* Glow rings au clic */}
      {rings.map(id => (
        <span key={id} style={{
          position:'absolute', inset:-2, borderRadius:17, pointerEvents:'none',
          border:`2px solid ${m.color}`,
          animation:'metricGlowRing 0.65s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        }} />
      ))}
      {filled && (
        <div style={{
          position:'absolute', top:-5, right:-5, width:14, height:14, borderRadius:'50%',
          background:m.color, display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 8px ${m.color}`, animation:'badgePop .3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <span style={{ fontSize:8, color:'#fff', fontWeight:900, lineHeight:1 }}>✓</span>
        </div>
      )}
      <span style={{
        display:'flex', alignItems:'center', lineHeight:1,
        animation: springing ? 'iconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
      }}>{m.iconEl}</span>
      {filled && <span style={{ fontSize:7, color:m.color, fontWeight:800, lineHeight:1 }}>{m.fmt(m.val)}</span>}
    </button>
  )
}

function NovaLogBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)
  const [ripples, setRipples] = useState([])

  function handleClick(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples(prev => [...prev, { x: e.clientX-r.left, y: e.clientY-r.top, id }])
    setTimeout(() => setRipples(prev => prev.filter(rp => rp.id !== id)), 800)
    onClick?.()
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:'relative', overflow:'hidden',
        marginTop:10, borderRadius:100,
        border:`1px solid ${hovered ? 'rgba(200,123,82,0.48)' : 'rgba(200,123,82,0.20)'}`,
        background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(18px)',
        cursor:'pointer', display:'flex', alignItems:'center', gap:8,
        padding:'13px 30px',
        fontFamily:"'Inter',system-ui,sans-serif", fontSize:13, fontWeight:700,
        color: hovered ? '#9E5C35' : '#C87B52',
        boxShadow: hovered
          ? '0 6px 24px rgba(200,123,82,0.18), inset 0 1px 0 rgba(255,255,255,0.95)'
          : '0 2px 12px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.90)',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
      {/* ── Rotating inner sweep — Framer Button style ── */}
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        width:'260%', height:7,
        marginLeft:'-130%', marginTop:-3.5,
        background:'linear-gradient(90deg, transparent 0%, transparent 20%, rgba(232,160,122,0.45) 45%, rgba(255,255,255,0.85) 50%, rgba(56,193,182,0.38) 55%, transparent 80%, transparent 100%)',
        filter:'blur(5px)',
        animation:'btnLightSpin 9s linear infinite',
        opacity: hovered ? 1 : 0.50,
        transition:'opacity 0.35s ease',
        pointerEvents:'none',
      }} />
      {/* ── Liquid ripples ── */}
      {ripples.map(rp => (
        <span key={rp.id} style={{
          position:'absolute', borderRadius:'50%', pointerEvents:'none',
          left:rp.x, top:rp.y, width:10, height:10, marginLeft:-5, marginTop:-5,
          background:'rgba(200,123,82,0.45)',
          animation:'liquidRipple 0.75s ease-out forwards',
        }} />
      ))}
      <HeartIcon size={15} color={hovered ? '#9E5C35' : '#C87B52'} />
      Mettre à jour mes métriques
    </button>
  )
}

// ─── FRAMER BUTTON — particles stables ────────────────────────────────────────
const BTN_PARTICLES = [
  { x:14, y:22, s:1.2, d:2.0, del:0.0 },
  { x:78, y:14, s:0.9, d:2.3, del:0.5 },
  { x:86, y:68, s:1.4, d:1.8, del:0.9 },
  { x:22, y:80, s:1.0, d:2.5, del:1.3 },
  { x:55, y:45, s:0.7, d:2.1, del:0.25 },
  { x:90, y:36, s:1.1, d:2.2, del:0.7 },
  { x:10, y:60, s:0.9, d:2.4, del:1.1 },
  { x:66, y:86, s:1.0, d:1.9, del:0.4 },
]

// ─── PILL BUTTON — reconstruction exacte du Framer Button-RgS3 ────────────────
// Structure Framer :
//   outer wrapper  → padding:2px, overflow:hidden, border-radius:100px, border:1px
//   light bar      → position:absolute, h:8px, left:-16px right:-16px, z-index:1
//                    background:white, filter:blur(10px), rotate 360°/10s
//   inner card     → border-radius:100px, background:couleur, z-index:2
//                    row: icon + label + arrow (width:1→20px au hover)
function MagneticGlowBtn({ label, iconEl, from, to, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed]  = useState(false)

  return (
    /* ── Outer wrapper — 2px gap laisse la lumière percer sur les bords ── */
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position:'relative',
        padding:'2px',
        borderRadius:100,
        border:`1px solid ${from}55`,
        overflow:'hidden',
        cursor:'pointer',
        display:'inline-flex',
        /* Spring scale (Framer bounce:0.2 duration:0.4) */
        transform: pressed ? 'scale(0.94)' : hovered ? 'scale(1.04)' : 'scale(1)',
        transition:'transform 0.40s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.38s ease',
        boxShadow: hovered
          ? `0 0 0 1px ${from}40, 0 8px 28px ${from}65, 0 2px 8px rgba(0,0,0,0.18)`
          : `0 0 0 1px ${from}20, 0 4px 16px ${from}38`,
        userSelect:'none',
      }}
    >
      {/* ── Rotating white light — exactement Framer: h=8px, left/right=-16px, blur=10px, 360°/10s ── */}
      <div style={{
        position:'absolute',
        height:8,
        left:-16, right:-16,
        top:'calc(50% - 4px)',
        background:'#ffffff',
        filter:'blur(10px)',
        WebkitFilter:'blur(10px)',
        zIndex:1,
        animation:'btnLightSpin 10s linear infinite',
        pointerEvents:'none',
        opacity: hovered ? 0.95 : 0.60,
        transition:'opacity 0.35s ease',
      }} />

      {/* ── Inner card — z-index:2 au-dessus de la lumière ── */}
      <div style={{
        position:'relative',
        zIndex:2,
        borderRadius:100,
        background:`linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        display:'flex',
        flexDirection:'row',
        alignItems:'center',
        gap:8,
        padding:'13px 16px',
        overflow:'hidden',
        /* Shine supérieure */
        boxShadow:'inset 0 1px 0 rgba(255,255,255,0.28)',
      }}>
        {/* Icône — grossit légèrement au hover */}
        <div style={{
          width:20, height:20, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          transform: hovered ? 'scale(1.18)' : 'scale(1)',
          transition:'transform 0.36s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {iconEl}
        </div>

        {/* Label */}
        <span style={{
          flex:1, fontSize:12, fontWeight:800, color:'#ffffff',
          letterSpacing:'0.15px', whiteSpace:'nowrap',
          fontFamily:"'Inter',system-ui,sans-serif",
        }}>
          {label}
        </span>

        {/* Flèche — width:1px→20px spring au hover (Framer exact) */}
        <span style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:14, fontWeight:900, color:'rgba(255,255,255,0.90)',
          width: hovered ? 20 : 1,
          overflow:'hidden',
          transition:'width 0.40s cubic-bezier(0.34,1.56,0.64,1)',
          flexShrink:0,
        }}>→</span>
      </div>
    </div>
  )
}

// ─── METRIC RINGS (Glow Card + MagicBentoGrid 3D tilt) ───────────────────────
function MetricRing({ iconEl, label, val, goal, color, fmt, index }) {
  const [anim, setAnim] = useState(false)
  const [glowPos, setGlowPos] = useState({ x:50, y:50 })
  const [glowing, setGlowing] = useState(false)
  const [tilt, setTilt] = useState({ rx:0, ry:0 })
  const cardRef = useRef()

  useEffect(() => { const t = setTimeout(() => setAnim(true), 120 + index * 90); return () => clearTimeout(t) }, [])

  function onMouseMove(e) {
    const r = cardRef.current?.getBoundingClientRect()
    if (!r) return
    setGlowPos({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 })
    const dx = (e.clientX-r.left-r.width/2)/(r.width/2)
    const dy = (e.clientY-r.top-r.height/2)/(r.height/2)
    setTilt({ rx:-dy*14, ry:dx*14 })
  }

  const R = 24
  const C = 2 * Math.PI * R
  const pct = Math.min((val / goal) * 100, 100)
  const dash = anim ? (pct / 100) * C : 0
  const done = pct >= 100

  return (
    /* ── Glow Card wrapper (Framer Glow-Card style) ── */
    <div ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setGlowing(true)}
      onMouseLeave={() => { setGlowing(false); setTilt({ rx:0, ry:0 }) }}
      style={{
        flex:1, position:'relative',
        padding:'1.5px', borderRadius:22,
        /* Glow border suit le curseur */
        background: glowing
          ? `radial-gradient(circle 220px at ${glowPos.x}% ${glowPos.y}%, ${color}65, ${color}22 42%, rgba(0,0,0,0.07) 68%)`
          : 'rgba(0,0,0,0.07)',
        animation:`tabFade 0.4s ease ${index * 0.08}s both`,
        transition: glowing
          ? 'background 0s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'
          : 'background 0.5s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        /* MagicBentoGrid 3D tilt */
        transform:`perspective(500px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle:'preserve-3d',
        willChange:'transform',
      }}>
      {/* Inner card — fond blanc */}
      <div style={{
        background:'#ffffff',
        borderRadius:20.5, padding:'14px 8px 12px',
        boxShadow:`0 6px 20px ${color}15, inset 0 1px 0 rgba(255,255,255,0.9)`,
        display:'flex', flexDirection:'column', alignItems:'center', gap:6,
        height:'100%', position:'relative', zIndex:1,
        transition:'box-shadow 0.3s ease',
      }}>
        {/* ── Futuristic Donut Ring ── */}
        <div style={{ position:'relative', width:68, height:68 }}>
          <svg width={68} height={68} viewBox="0 0 68 68"
            style={{ transform:'rotate(-90deg)', overflow:'visible' }}>
            <defs>
              <filter id={`df${index}`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.8" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Outer decorative ring */}
            <circle cx="34" cy="34" r={R+7} fill="none" stroke={color+'18'} strokeWidth="0.7"/>

            {/* Tick marks — 24 segments around outer edge */}
            {Array.from({length:24}).map((_, ti) => {
              const a = (ti / 24) * Math.PI * 2
              const ro = R+6, ri = R+4.2
              return (
                <line key={ti}
                  x1={(34+ro*Math.cos(a)).toFixed(1)} y1={(34+ro*Math.sin(a)).toFixed(1)}
                  x2={(34+ri*Math.cos(a)).toFixed(1)} y2={(34+ri*Math.sin(a)).toFixed(1)}
                  stroke={color} strokeWidth="0.9" opacity="0.22" strokeLinecap="round"/>
              )
            })}

            {/* Background track — dashed segmented */}
            <circle cx="34" cy="34" r={R} fill="none"
              stroke={color+'22'} strokeWidth="5.5"
              strokeDasharray="3.8 2.2"/>

            {/* Progress arc */}
            <circle cx="34" cy="34" r={R} fill="none"
              stroke={color} strokeWidth="5.5" strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              filter={`url(#df${index})`}
              style={{ transition:'stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)' }}/>
          </svg>

          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {done
              ? <span style={{ fontSize:16, color, fontWeight:900, animation:'badgePop 0.4s ease' }}>✓</span>
              : iconEl}
          </div>
          {done && (
            <div style={{
              position:'absolute', inset:-6, borderRadius:'50%',
              border:`2px solid ${color}40`,
              animation:'scoreGlow 2s ease-in-out infinite',
              pointerEvents:'none',
            }} />
          )}
        </div>
        <div style={{ fontSize:13, fontWeight:900, color: val > 0 ? color : '#c4b5a8', lineHeight:1 }}>
          {val > 0 ? fmt(val) : '·'}
        </div>
        <div style={{ fontSize:8, color:'#8a7265', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px' }}>{label}</div>
      </div>
    </div>
  )
}

function MetricRings({ metriques }) {
  const items = [
    { iconEl:<WaterIcon size={17} color="#38bdf8" />, label:'Eau',     val:metriques?.eau||0,     goal:8,     color:'#38bdf8', fmt: v => `${v}/8` },
    { iconEl:<RunIcon size={17} color="#FF6B35" />,   label:'Pas',     val:metriques?.pas||0,     goal:10000, color:'#FF6B35', fmt: v => v>=1000 ? `${Math.round(v/1000)}k` : `${v}` },
    { iconEl:<MoonIcon size={17} color="#C87B52" />,  label:'Sommeil', val:metriques?.sommeil||0, goal:8,     color:'#C87B52', fmt: v => `${v}h` },
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
        background:'linear-gradient(145deg,rgba(200,123,82,0.09),rgba(232,160,122,0.06))',
        border:'1.5px solid rgba(200,123,82,0.18)',
        boxShadow:'0 6px 20px rgba(200,123,82,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{
          width:44, height:44, borderRadius:14, flexShrink:0,
          background:'linear-gradient(135deg,#C87B52,#9E5C35)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, boxShadow:'0 6px 16px rgba(200,123,82,0.40)',
        }}>
          {streak >= 7 ? <FireIcon size={22} color="#fff" /> : streak >= 3 ? <FlashIcon size={22} color="#fff" /> : <LeafIcon size={22} color="#fff" />}
        </div>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:'#1a0a00', lineHeight:1 }}>
            {streak}<span style={{ fontSize:11, fontWeight:500, color:'#c4b5a8', marginLeft:3 }}>jours</span>
          </div>
          <div style={{ fontSize:10, color:'#C87B52', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:2 }}>
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
            <div style={{ fontSize:10, color:'#C87B52', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>Niveau {level}</div>
            <div style={{ fontSize:18, fontWeight:900, color:'#1a0a00', lineHeight:1.1 }}>
              {xp} <span style={{ fontSize:10, color:'#c4b5a8', fontWeight:500 }}>XP</span>
            </div>
          </div>
          <div style={{
            width:36, height:36, borderRadius:12,
            background:'linear-gradient(135deg,#C87B52,#9E5C35)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 14px rgba(200,123,82,0.40)',
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
                  ? 'linear-gradient(90deg,#C87B52,#9E5C35)'
                  : active
                  ? 'rgba(200,123,82,0.35)'
                  : 'rgba(200,123,82,0.12)',
                boxShadow: filled ? '0 0 7px rgba(200,123,82,0.80)' : 'none',
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

// ─── DAILY TASK ITEM — Glow Card style ───────────────────────────────────────
function DailyTaskItem({ t, i, onToggle }) {
  const [hovered, setHovered] = useState(false)
  const [glowPos, setGlowPos] = useState({ x:50, y:50 })
  const ref = useRef()

  function onMouseMove(e) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setGlowPos({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 })
  }

  return (
    <div ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onToggle(t)}
      style={{
        position:'relative', padding:'1.5px', borderRadius:17.5,
        background: hovered
          ? `radial-gradient(circle 280px at ${glowPos.x}% ${glowPos.y}%, ${t.color}55, ${t.color}18 42%, rgba(0,0,0,0.07) 65%)`
          : t.isDone
          ? `linear-gradient(135deg, ${t.color}30, ${t.color}12)`
          : 'rgba(0,0,0,0.06)',
        transition: hovered ? 'none' : 'background 0.45s ease',
        animation:`tabFade 0.4s ease ${i*0.06}s both`,
      }}>
      <div style={{
        display:'flex', alignItems:'center', gap:11,
        padding:'11px 14px',
        background: t.isDone ? t.color+'12' : '#ffffff',
        border:`1px solid ${t.isDone ? t.color+'30' : 'transparent'}`,
        borderRadius:16, cursor:'pointer',
        opacity: t.isDone ? 0.72 : 1,
        boxShadow: t.isDone ? `0 4px 14px ${t.color}22` : '0 2px 8px rgba(0,0,0,0.04)',
        transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        position:'relative', zIndex:1,
      }}>
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
      id:'pas', emoji:'👟', color:'#C87B52',
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
      id:'soir', emoji:'🌙', color:'#C87B52',
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
      id:'objectif', emoji:'🎯', color:'#C87B52',
      title: objectif || 'Ton objectif du jour',
      detail: objectif ? `Une action concrète vers : ${objectif}` : 'Avance d\'un pas vers ton grand objectif',
      goal:1, auto:false, fmt: v => v ? 'Accompli !' : 'En cours',
    },
    {
      id:'mental', emoji:'🧘', color:'#C87B52',
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
            <DailyTaskItem key={t.id} t={t} i={i} onToggle={toggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── STACKED CARDS INSIGHTS — hover spreads deck, click side card to bring front
function SwipeableInsights({ profil, metriques, onChat }) {
  const [spread, setSpread]     = useState(false)
  const [frontIdx, setFrontIdx] = useState(0)

  const h = new Date().getHours()

  const allCards = [
    h < 10 ? {
      image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&q=72',
      title:'Débute bien ta journée',
      body:"1 verre d'eau + 5 min de lumière naturelle activent ton métabolisme dès le réveil.",
      action:'Conseils matin', from:'#C87B52', to:'#E8A07A',
    } : h < 14 ? {
      image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&q=72',
      title:'Repas de midi équilibré',
      body:"Protéines + légumes + glucides lents. Évite les sucres rapides qui fatiguent l'après-midi.",
      action:'Idées repas', from:'#C87B52', to:'#E8A07A',
    } : h < 18 ? {
      image:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&q=72',
      title:"Regain d'énergie",
      body:"10 min de marche = autant d'énergie qu'un café, sans le crash post-caféine.",
      action:'Me remotiver', from:'#C87B52', to:'#E8A07A',
    } : {
      image:'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=600&auto=format&q=72',
      title:'Prépare ton sommeil',
      body:"Coupe les écrans 30 min avant de dormir. La mélatonine se libère dans l'obscurité.",
      action:'Routine soir', from:'#38C1B6', to:'#6FD9D3',
    },
    {
      image:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&auto=format&q=72',
      title: (metriques?.eau||0) >= 4 ? 'Hydratation OK !' : "Bois de l'eau",
      body: (metriques?.eau||0) > 0
        ? `${metriques.eau}/8 verres aujourd'hui. ${metriques.eau < 4 ? 'Un verre maintenant !' : 'Continue comme ça !'}`
        : "Objectif : 8 verres/jour. Pose un grand verre devant toi maintenant.",
      action:'Mettre à jour', from:'#38C1B6', to:'#6FD9D3',
    },
    {
      image:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&q=72',
      title:'Respiration 5-5',
      body:"2 min de cohérence cardiaque réduisent le cortisol de 20%. Inspire 5s, expire 5s.",
      action:'En savoir plus', from:'#C87B52', to:'#F5C8AA',
    },
  ]

  const SPREAD = 82
  const ROT    = 7

  // 3 cards visible — front + 2 behind
  const visible = [0, 1, 2].map(i => allCards[(frontIdx + i) % allCards.length])

  function handleAction(e, action) {
    e.stopPropagation()
    if (action === 'Mettre à jour') onChat('sante')
    else onChat(action)
  }

  return (
    <div style={{ padding:'8px 18px 0' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={hc.cardsTitle}>Insights du jour</span>
        <span style={{ fontSize:11, color:'#C87B52', fontWeight:700,
          background:'rgba(200,123,82,0.10)', padding:'3px 12px', borderRadius:20 }}>
          {frontIdx + 1} / {allCards.length}
        </span>
      </div>

      {/* ── Stacked cards container ── */}
      <div
        style={{ position:'relative', height:296 }}
        onMouseEnter={() => setSpread(true)}
        onMouseLeave={() => setSpread(false)}>

        {visible.map((card, i) => {
          const isFront = i === 0
          let xPx = 0, rotate = 0
          if (spread) {
            if (i === 1) { xPx = -SPREAD; rotate = -ROT }
            if (i === 2) { xPx = SPREAD;  rotate = ROT  }
          }

          return (
            <div
              key={`${frontIdx}-${i}`}
              onClick={() => {
                if (isFront) setSpread(s => !s)  // tap front → toggle spread (mobile)
                else { setFrontIdx(prev => (prev + i) % allCards.length); setSpread(false) }
              }}
              style={{
                position:'absolute', top:0, left:0, right:0,
                borderRadius:24, overflow:'hidden',
                background:'#ffffff',
                border:'1px solid rgba(220,212,198,0.60)',
                boxShadow: isFront
                  ? '0 12px 40px rgba(0,0,0,0.13), 0 3px 10px rgba(0,0,0,0.07)'
                  : '0 4px 18px rgba(0,0,0,0.08)',
                zIndex: 10 - i,
                transform:`translateX(${xPx}px) rotate(${rotate}deg)`,
                transformOrigin:'bottom center',
                transition:'transform 0.46s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease',
                cursor: isFront ? 'default' : 'pointer',
                willChange:'transform',
              }}>

              {/* Image zone */}
              <div style={{
                margin:'8px 8px 0',
                height:148, borderRadius:18, overflow:'hidden', position:'relative',
              }}>
                <img src={card.image} alt={card.title}
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                  loading="lazy" />
                {/* Gradient overlay bottom */}
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0, height:'52%',
                  background:`linear-gradient(0deg, ${card.from}99 0%, transparent 100%)`,
                  pointerEvents:'none',
                }} />
              </div>

              {/* Text content */}
              <div style={{ padding:'10px 16px 14px' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#111',
                  letterSpacing:'-0.02em', marginBottom:5, lineHeight:1.3 }}>
                  {card.title}
                </div>
                <div style={{ fontSize:12, color:'#666', lineHeight:1.65,
                  marginBottom: isFront ? 10 : 0,
                  overflow:'hidden', display:'-webkit-box',
                  WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                }}>
                  {card.body}
                </div>

                {/* CTA — front card only */}
                {isFront && (
                  <button
                    onClick={e => handleAction(e, card.action)}
                    style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      fontSize:11, fontWeight:800, color:'#fff',
                      background:`linear-gradient(135deg, ${card.from}, ${card.to})`,
                      padding:'7px 16px', borderRadius:20, border:'none',
                      cursor:'pointer', fontFamily:"'Inter',system-ui,sans-serif",
                      boxShadow:`0 4px 14px ${card.from}55`,
                    }}>
                    {card.action === 'herbal' ? 'Voir Herbal →' : card.action + ' →'}
                  </button>
                )}
              </div>

              {/* Spread hint on front card */}
              {isFront && !spread && (
                <div style={{
                  position:'absolute', top:'50%', right:14, transform:'translateY(-50%)',
                  fontSize:18, opacity:0.22, pointerEvents:'none',
                  animation:'swipeHint 2.5s ease-in-out infinite',
                }}>⇆</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dot nav */}
      <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:10, marginBottom:4 }}>
        {allCards.map((_, i) => (
          <div key={i}
            onClick={() => { setFrontIdx(i); setSpread(false) }}
            style={{
              height:5, width: i === frontIdx ? 20 : 5, borderRadius:3,
              background: i === frontIdx ? '#C87B52' : 'rgba(0,0,0,0.11)',
              transition:'all 0.32s cubic-bezier(0.34,1.56,0.64,1)', cursor:'pointer',
            }} />
        ))}
      </div>
    </div>
  )
}

// ─── QUICK ACTIONS ─────────────────────────────────────────────────────────────
// Palette : yellow #FFF991 · orange #FF7112 · teal #38C1B6
const ACTIONS = [
  { tab:'chat',    iconEl:<ChatIcon size={24} color="#fff" />,    label:'Coach IA', from:'#FF7112', to:'#FF9A50' },
  { tab:'routine', iconEl:<CalendarIcon size={24} color="#fff" />,label:'Routine',  from:'#38C1B6', to:'#6FD9D3' },
  { tab:'herbal',  iconEl:<LeafIcon size={24} color="#fff" />,    label:'Herbal',   from:'#E8A000', to:'#FFD060' },
  { tab:'style',   iconEl:<SparkleIcon size={24} color="#fff" />, label:'Style',    from:'#FF5500', to:'#38C1B6' },
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
    marginBottom:42, textAlign:'center' },
  greetNameAccent: { background:'linear-gradient(135deg,#C87B52,#E8A07A)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  circleWrap: { position:'relative', width:248, height:248,
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20,
    animation:'novaFloat 7s ease-in-out infinite' },
  logBtn: {
    display:'flex', alignItems:'center', gap:8, padding:'14px 32px',
    background:'linear-gradient(145deg, #C87B52, #9E5C35)',
    color:'#fff', border:'none', borderRadius:22, fontSize:13, fontWeight:800,
    cursor:'pointer', fontFamily:"'Inter',system-ui,sans-serif",
    boxShadow:'0 12px 36px rgba(200,123,82,0.42), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)',
    transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' },

  strip: { display:'flex', gap:10, padding:'14px 18px' },
  stripItem: { flex:1, background:'#ffffff', border:'1px solid',
    borderRadius:20, padding:'12px 12px 10px', transition:'box-shadow 0.2s' },

  cardsWrap: { padding:'8px 18px 8px' },
  cardsHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  cardsTitle: { fontSize:16, fontWeight:900, color:'#1a0a00', letterSpacing:'-0.3px' },

  actionsWrap: { padding:'16px 18px 4px' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12 },
  actionBtn: { border:'1.5px solid', borderRadius:22,
    padding:'18px 8px 14px', display:'flex', flexDirection:'column', alignItems:'center',
    cursor:'pointer', fontFamily:"'Inter',system-ui,sans-serif" },
  actionIcon: { width:52, height:52, borderRadius:18,
    display:'flex', alignItems:'center', justifyContent:'center' },
}
