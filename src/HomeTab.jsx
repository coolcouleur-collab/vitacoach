import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, AnimatePresence } from 'framer-motion'
import { WaterIcon, MoodIcon, HeartIcon, FlashIcon, FireIcon, DiamondIcon, LeafIcon, MeditateIcon, FoodIcon, MoonIcon, SunIcon, TargetIcon, ChatIcon, SparkleIcon, StarIcon, LightbulbIcon, BrainIcon, RunIcon, CalendarIcon } from './Icons'

// ─── ANIMATED LIQUID BACKGROUND — version originale restaurée ────────────────
function FuturisticBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden' }}>

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

      {/* Pêche chaud haut-droite */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 88% 8%, rgba(232,140,80,0.45) 0%, transparent 58%)',
        filter:'blur(72px)',
        animation:'liquidBlob2 16s ease-in-out infinite',
      }} />

      {/* Ambre bas-gauche */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 8% 90%, rgba(212,132,74,0.32) 0%, transparent 52%)',
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
            <circle cx="2" cy="2" r="1.4" fill="#D4844A"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)"/>
      </svg>
    </div>
  )
}

// ─── NOVA GLOW — shader WebGL (Nova-Glow-lv7f) — couleurs palette chaude ────────
const NOVA_VERT = `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`
const NOVA_FRAG = `
  precision highp float;
  uniform float iTime;
  uniform vec3  iResolution;
  uniform float hue;
  uniform float hover;
  uniform float rot;
  uniform float hoverIntensity;
  varying vec2 vUv;

  vec3 rgb2yiq(vec3 c){
    return vec3(dot(c,vec3(.299,.587,.114)),dot(c,vec3(.596,-.274,-.322)),dot(c,vec3(.211,-.523,.312)));
  }
  vec3 yiq2rgb(vec3 c){
    return vec3(c.x+.956*c.y+.621*c.z, c.x-.272*c.y-.647*c.z, c.x-1.106*c.y+1.703*c.z);
  }
  vec3 adjustHue(vec3 color,float hueDeg){
    float r=hueDeg*3.14159265/180.;
    vec3 yiq=rgb2yiq(color);
    float ca=cos(r),sa=sin(r);
    return yiq2rgb(vec3(yiq.x, yiq.y*ca-yiq.z*sa, yiq.y*sa+yiq.z*ca));
  }
  vec3 hash33(vec3 p3){
    p3=fract(p3*vec3(.1031,.11369,.13787));
    p3+=dot(p3,p3.yxz+19.19);
    return -1.+2.*fract(vec3(p3.x+p3.y,p3.x+p3.z,p3.y+p3.z)*p3.zyx);
  }
  float snoise3(vec3 p){
    const float K1=.333333333,K2=.166666667;
    vec3 i=floor(p+(p.x+p.y+p.z)*K1);
    vec3 d0=p-(i-(i.x+i.y+i.z)*K2);
    vec3 e=step(vec3(0.),d0-d0.yzx);
    vec3 i1=e*(1.-e.zxy), i2=1.-e.zxy*(1.-e);
    vec3 d1=d0-(i1-K2), d2=d0-(i2-K1), d3=d0-.5;
    vec4 h=max(.6-vec4(dot(d0,d0),dot(d1,d1),dot(d2,d2),dot(d3,d3)),0.);
    vec4 n=h*h*h*h*vec4(dot(d0,hash33(i)),dot(d1,hash33(i+i1)),dot(d2,hash33(i+i2)),dot(d3,hash33(i+1.)));
    return dot(vec4(31.316),n);
  }
  vec4 extractAlpha(vec3 c){ float a=max(max(c.r,c.g),c.b); return vec4(c/(a+1e-5),a); }

  /* ── Palette chaude — nos couleurs ── */
  const vec3 baseColor1 = vec3(1.000, 0.580, 0.200);  /* orange vif boosté */
  const vec3 baseColor2 = vec3(1.000, 0.780, 0.380);  /* doré brillant */
  const vec3 baseColor3 = vec3(0.140, 0.038, 0.005);  /* ambre très sombre */
  const float innerRadius = 0.58;
  const float noiseScale  = 0.72;

  float light1(float i,float a,float d){ return i/(1.+d*a); }
  float light2(float i,float a,float d){ return i/(1.+d*d*a); }

  vec4 draw(vec2 uv){
    vec3 c1=adjustHue(baseColor1,hue), c2=adjustHue(baseColor2,hue), c3=adjustHue(baseColor3,hue);
    float ang=atan(uv.y,uv.x), len=length(uv);
    float inv=len>0.?1./len:0.;
    float n0=snoise3(vec3(uv*noiseScale,iTime*.5))*.5+.5;
    float r0=mix(mix(innerRadius,1.,.4),mix(innerRadius,1.,.6),n0);
    float d0=distance(uv,(r0*inv)*uv);
    float v0=light1(1.5, 8.0,d0)*smoothstep(r0*1.05,r0,len);
    float cl=cos(ang+iTime*2.)*.5+.5;
    vec2 pos=vec2(cos(-iTime),sin(-iTime))*r0;
    float d=distance(uv,pos);
    float v1=light2(2.4, 4.0,d)*light1(1.2,40.0,d0);
    float v2=smoothstep(1.,mix(innerRadius,1.,n0*.5),len);
    float v3=smoothstep(innerRadius,mix(innerRadius,1.,.5),len);
    vec3 col=mix(c1,c2,cl);
    col=mix(c3,col,v0);
    col=(col+v1)*v2*v3;
    return extractAlpha(clamp(col,0.,1.));
  }

  void main(){
    vec2 center=iResolution.xy*.5;
    float sz=min(iResolution.x,iResolution.y);
    vec2 uv=(vUv*iResolution.xy-center)/sz*2.;
    float s=sin(rot),c=cos(rot);
    uv=vec2(c*uv.x-s*uv.y, s*uv.x+c*uv.y);
    uv.x+=hover*hoverIntensity*.1*sin(uv.y*10.+iTime);
    uv.y+=hover*hoverIntensity*.1*sin(uv.x*10.+iTime);
    vec4 col=draw(uv);
    gl_FragColor=vec4(col.rgb*col.a, col.a);
  }
`

function NovaGlowCanvas({ size = 248, mouseRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr   = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = size * dpr
    canvas.height = size * dpr
    canvas.style.width  = `${size}px`
    canvas.style.height = `${size}px`

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true })
    if (!gl) return

    function mkShader(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src); gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error('Shader:', gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   NOVA_VERT))
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, NOVA_FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    /* Quad plein écran */
    const pos = new Float32Array([-1,-1, 1,-1, -1,1, 1,1])
    const uvs = new Float32Array([ 0, 0, 1, 0,  0,1, 1,1])
    ;[['position', pos], ['uv', uvs]].forEach(([name, data]) => {
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, name)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    })

    const uTime  = gl.getUniformLocation(prog, 'iTime')
    const uRes   = gl.getUniformLocation(prog, 'iResolution')
    const uHue   = gl.getUniformLocation(prog, 'hue')
    const uHover = gl.getUniformLocation(prog, 'hover')
    const uRot   = gl.getUniformLocation(prog, 'rot')
    const uHInt  = gl.getUniformLocation(prog, 'hoverIntensity')

    gl.uniform3f(uRes, canvas.width, canvas.height, 1)
    gl.uniform1f(uHue, 0)
    gl.uniform1f(uHInt, 0.48)

    let hoverVal = 0, rotVal = 0
    const t0 = performance.now()
    let raf

    const render = () => {
      const t   = (performance.now() - t0) / 1000
      const m   = mouseRef?.current ?? { x: -9999, y: -9999 }
      const cx  = size / 2
      const uvX = (m.x - cx) / cx
      const uvY = (m.y - cx) / cx
      const inside = Math.hypot(uvX, uvY) < 0.85
      hoverVal += ((inside ? 1 : 0) - hoverVal) * 0.06
      rotVal   += 0.003

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

      gl.uniform1f(uTime,  t)
      gl.uniform1f(uHover, hoverVal)
      gl.uniform1f(uRot,   rotVal)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return (
    <canvas ref={canvasRef} style={{
      position:'absolute', inset:0, width:'100%', height:'100%',
      pointerEvents:'none', zIndex:1,
    }} />
  )
}

// ─── NOVA GLASS ORB — glassmorphisme + glow border cursor (Framer Glow-Card) ───
function NovaOrb({ active }) {
  const ownRef  = useRef(null)
  const glowRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const [ripples, setRipples]       = useState([])
  const [glowActive, setGlowActive] = useState(false)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 105, damping: 15, mass: 0.85 })
  const my = useSpring(rawY, { stiffness: 105, damping: 15, mass: 0.85 })

  const hlX = useTransform(mx, v => `${50 + v * 62}%`)
  const hlY = useTransform(my, v => `${50 + v * 62}%`)
  const liquidHighlight = useMotionTemplate`radial-gradient(ellipse 42% 38% at ${hlX} ${hlY}, rgba(255,255,255,0.38) 0%, rgba(255,230,190,0.12) 50%, transparent 70%)`

  const handlePointerMove = useCallback((e) => {
    const el = ownRef.current; if (!el) return
    const r  = el.getBoundingClientRect()
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    rawX.set(px / r.width  - 0.5)
    rawY.set(py / r.height - 0.5)
    mouseRef.current = { x: px, y: py }
    if (glowRef.current) {
      glowRef.current.style.setProperty('--gx', `${px}px`)
      glowRef.current.style.setProperty('--gy', `${py}px`)
    }
  }, [rawX, rawY])

  const handlePointerEnter = useCallback(() => setGlowActive(true), [])

  const handlePointerLeave = useCallback(() => {
    setGlowActive(false)
    mouseRef.current = { x: -9999, y: -9999 }
    rawX.set(0); rawY.set(0)
  }, [rawX, rawY])

  const handleClick = useCallback((e) => {
    const el = ownRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    const id = Date.now()
    // Ripple visuel
    setRipples(prev => [...prev, {
      x: ((e.clientX - r.left) / r.width)  * 100,
      y: ((e.clientY - r.top)  / r.height) * 100, id,
    }])
    setTimeout(() => setRipples(prev => prev.filter(rp => rp.id !== id)), 1100)
  }, [])

  return (
    <div style={{
      position: 'absolute', inset: 0,
      borderRadius: '50%', zIndex: 0,
      boxShadow: active
        ? '0 0 0 1px rgba(200,123,82,0.45), 0 0 20px rgba(200,100,40,0.22), 0 0 50px rgba(180,80,20,0.11)'
        : '0 0 0 1px rgba(200,123,82,0.22), 0 0 12px rgba(200,100,40,0.10), 0 0 32px rgba(180,80,20,0.06)',
      transition: 'box-shadow 0.5s ease',
    }}>
      {/* ── Verre dépoli ── */}
      <div
        ref={ownRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%', overflow: 'hidden',
          background: 'rgba(255,218,175,0.07)',
          backdropFilter: 'blur(22px) saturate(1.25)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.25)',
        }}
      >
        {/* ── Nova Glow — shader WebGL ── */}
        <NovaGlowCanvas size={248} mouseRef={mouseRef} />

        {/* Shine top — reflet verre */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 30% at 50% -2%, rgba(255,255,255,0.40) 0%, transparent 65%)',
        }} />

        {/* Tinte pêche douce */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 52% 52%, rgba(255,190,120,0.07) 0%, rgba(200,100,40,0.03) 60%, transparent 82%)',
        }} />

        {/* Liquid highlight — suit le curseur */}
        <motion.div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
          background: liquidHighlight,
        }} />

        {/* Click ripples */}
        {ripples.map(rp => (
          <span key={rp.id} style={{
            position: 'absolute',
            left: `${rp.x}%`, top: `${rp.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: 'rgba(255,200,140,0.70)',
            animation: 'liquidRipple 1.1s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
            pointerEvents: 'none', zIndex: 3,
          }} />
        ))}

        {/* ── Glow border (Framer Glow-Card) — anneau lumineux qui suit le curseur ── */}
        <div
          ref={glowRef}
          style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            padding: 2,
            background: 'radial-gradient(160px circle at var(--gx, -200px) var(--gy, -200px), rgba(255,150,70,0.95), transparent 70%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: glowActive ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none', zIndex: 5,
          }}
        />

        {/* Bordure statique fine — toujours visible */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
          borderRadius: '50%',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,255,255,0.45)',
        }} />
      </div>
    </div>
  )
}

// ─── NOVA GLOW SCORE CIRCLE ───────────────────────────────────────────────────
function NovaGlowScore({ score, scoreColor, profil, metriques, onLog }) {
  const [mounted, setMounted]           = useState(false)
  const [activeMetric, setActiveMetric] = useState(null)
  const [circleHovered, setCircleHovered] = useState(false)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  const METRICS = [
    { iconEl:<WaterIcon size={17} color="#38bdf8" />, val:metriques?.eau,     color:'#38bdf8', key:'eau',     fmt: v => v+'v' },
    { iconEl:<RunIcon size={17} color="#C87B52" />,   val:metriques?.pas,     color:'#C87B52', key:'pas',     fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
    { iconEl:<MoonIcon size={17} color="#818cf8" />,  val:metriques?.sommeil, color:'#818cf8', key:'sommeil', fmt: v => v+'h' },
    { iconEl:<MoodIcon size={17} color="#fbbf24" />,  val:metriques?.humeur,  color:'#fbbf24', key:'humeur',  fmt: v => v+'/5' },
    { iconEl:<HeartIcon size={17} color="#ff3b30" />, val:metriques?.fc,      color:'#ff3b30', key:'fc',      fmt: v => v },
  ]
  const paused = circleHovered || !!activeMetric

  return (
    <div style={hc.hero}>
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>

        <div style={{ textAlign:'center', marginTop:28, marginBottom:22, width:'100%' }}>
          <div style={{ fontSize:15, letterSpacing:'0.2px', textAlign:'center', width:'100%' }}>
            <span style={{ fontWeight:200, color:'rgba(180,130,90,0.45)' }}>hello, </span>
            <span style={{ fontWeight:500, color:'rgba(200,123,82,0.68)' }}>{profil?.nom || profil?.prenom || 'toi'}</span>
          </div>
        </div>

        {/* ── Nova WebGL Orb ── */}
        <div style={hc.circleWrap}
          onMouseEnter={() => setCircleHovered(true)}
          onMouseLeave={() => setCircleHovered(false)}
        >
          {/* Hub 248×248 centré dans le container 340×340 */}
          <div style={{ position:'absolute', top:46, left:46, width:248, height:248 }}>
            <NovaOrb active={circleHovered || !!activeMetric} />
          </div>

          {/* ── Arc de progression score ── */}
          <svg
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:2, overflow:'visible' }}
            viewBox="0 0 340 340"
          >
            <defs>
              <linearGradient id="arcFillGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="rgba(255,230,200,0.0)"/>
                <stop offset="20%"  stopColor="#F5D4B8"/>
                <stop offset="60%"  stopColor="#E8A07A"/>
                <stop offset="100%" stopColor="#C87B52"/>
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="170" cy="170" r="131" fill="none" stroke="rgba(200,123,82,0.30)" strokeWidth="2.5"/>
            {/* Arc progressif */}
            <motion.circle
              cx="170" cy="170" r="131"
              fill="none"
              stroke="url(#arcFillGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ filter:'drop-shadow(0 0 5px rgba(200,123,82,0.55))' }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: (score ?? 0) / 100 }}
              transition={{ duration: 1.5, delay: 0.4, type:'spring', stiffness:45, damping:18 }}
              transform="rotate(-90 170 170)"
            />
          </svg>

          {/* ── Ferris Wheel — orbit container (tourne, pass-through events) ── */}
          <div style={{
            position:'absolute', inset:0,
            animation:'ferrisOrbit 18s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
            zIndex:3,
            pointerEvents:'none',
          }}>
            {METRICS.map((m, idx) => {
              const rad = (idx / METRICS.length) * Math.PI * 2 - Math.PI / 2
              const x   = 170 + 145 * Math.cos(rad)
              const y   = 170 + 145 * Math.sin(rad)
              const filled   = m.val > 0
              const isActive = activeMetric === m.key
              return (
                /* Counter-rotation — garde l'icône droite, re-active les events */
                <div key={m.key} style={{
                  position:'absolute', left: x - 24, top: y - 24,
                  width:48, height:48,
                  animation:'counterOrbit 18s linear infinite',
                  animationPlayState: paused ? 'paused' : 'running',
                  pointerEvents:'auto',
                }}>
                  <MetricDot m={m} x={24} y={24} filled={filled} isActive={isActive}
                    onDown={() => setActiveMetric(m.key)}
                    onUp={() => setActiveMetric(null)}
                    onLog={onLog}
                  />
                </div>
              )
            })}
          </div>
        </div>

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
        background: isActive ? `${m.color}28` : springing ? `${m.color}18` : 'rgba(255,246,238,0.55)',
        border:`1.5px solid ${isActive ? m.color+'90' : filled ? m.color+'55' : 'rgba(255,255,255,0.55)'}`,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:1.5, cursor:'pointer',
        boxShadow: isActive
          ? `0 0 0 4px ${m.color}35, 0 0 28px ${m.color}80, inset 0 1px 0 rgba(255,255,255,1)`
          : filled
          ? `0 0 0 3px ${m.color}18, 0 0 16px ${m.color}45, inset 0 1px 0 rgba(255,255,255,1)`
          : '0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(0,0,0,0.04)',
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

// ─── GLASSY BUTTON WRAP — GlassyButton (Framer) ──────────────────────────────
// Highlight + reflection blobs follow mouse in parallax. Glass backdrop blur.
const LIGHT_MAP = {
  'top-left':     { angle: 135, x: '10%', y: '10%' },
  'top':          { angle: 180, x: '50%', y:  '8%' },
  'top-right':    { angle: 225, x: '90%', y: '10%' },
  'right':        { angle: 270, x: '92%', y: '50%' },
  'bottom-right': { angle: 315, x: '90%', y: '90%' },
  'bottom':       { angle:   0, x: '50%', y: '92%' },
  'bottom-left':  { angle:  45, x: '10%', y: '90%' },
  'left':         { angle:  90, x:  '8%', y: '50%' },
}

function GlassyButtonWrap({
  children,
  background          = 'rgba(255,255,255,0.22)',
  hoverBackground     = 'rgba(255,255,255,0.34)',
  borderRadius        = 22,
  blur                = 18,
  lightDirection      = 'top-left',
  shadowHoverColor    = 'rgba(0,0,0,0.18)',
  shadowHoverIntensity= 1,
  isHoverable         = true,
  style               = {},
  onClick,
}) {
  const [hovered, setHovered] = useState(false)
  const [mouse,   setMouse]   = useState({ x: 0.5, y: 0.5 })

  const { angle, x, y } = LIGHT_MAP[lightDirection] || LIGHT_MAP['top-left']
  const h = isHoverable && hovered

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / rect.width
    const my = (e.clientY - rect.top)  / rect.height
    startTransition(() => setMouse({ x: Math.max(0, Math.min(1, mx)), y: Math.max(0, Math.min(1, my)) }))
  }

  const dx = mouse.x - 0.5
  const dy = mouse.y - 0.5

  // Highlight blob
  const highlightStyle = {
    position: 'absolute',
    left:   `calc(${x} + ${dx * (h ? 28 : 16)}px)`,
    top:    `calc(${y} + ${dy * (h ? 28 : 16) + (h ? -4 : 0)}px)`,
    width:  h ? '74%' : '60%',
    height: h ? '42%' : '30%',
    background: h
      ? 'linear-gradient(120deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 100%)'
      : 'linear-gradient(120deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 100%)',
    borderRadius: '50%',
    filter:   `blur(${h ? 22 : 14}px)`,
    opacity:  h ? 0.82 : 0.5,
    pointerEvents: 'none',
    transform: `translate(-50%, -50%) scale(${h ? 1.13 : 1})${h ? ' translateY(-2.5px)' : ''}`,
    transition: 'all 0.32s cubic-bezier(.4,0,.2,1)',
    zIndex: 2,
  }

  // Reflection blob
  const reflectionStyle = {
    position: 'absolute',
    left:   `calc(${x} + ${dx * (h ? 16 : 8)}px)`,
    top:    `calc(${y} + ${dy * (h ? 16 : 8)}px)`,
    width:  h ? '38%' : '30%',
    height: h ? '18%' : '14%',
    background: 'linear-gradient(120deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)',
    borderRadius: '50%',
    filter:   `blur(${h ? 10 : 7}px)`,
    opacity:  h ? 0.45 : 0.28,
    pointerEvents: 'none',
    transform: `translate(-50%, -50%) scale(${h ? 1.12 : 1})${h ? ' translateY(-1px)' : ''}`,
    transition: 'all 0.32s cubic-bezier(.4,0,.2,1)',
    zIndex: 1,
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { startTransition(() => setMouse({ x: 0.5, y: 0.5 })); setHovered(false) }}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        borderRadius,
        background: `linear-gradient(${angle}deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%), ${h ? hoverBackground : background}`,
        boxShadow: h
          ? `0 18px ${Math.round(48 * shadowHoverIntensity)}px 0 ${shadowHoverColor}, 0 6px 24px 0 rgba(0,0,0,0.12)`
          : '0 6px 18px 0 rgba(0,0,0,0.10)',
        backdropFilter:       `blur(${blur}px) saturate(1.2)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(1.2)`,
        border:   '1.5px solid rgba(255,255,255,0.22)',
        overflow: 'hidden',
        cursor:   onClick ? 'pointer' : 'default',
        display:  'flex', flexDirection: 'column',
        transform: h ? 'translateY(-6px) scale(1.04)' : 'none',
        transition: 'box-shadow 0.32s cubic-bezier(.4,0,.2,1), background 0.32s cubic-bezier(.4,0,.2,1), transform 0.32s cubic-bezier(.4,0,.2,1)',
        ...style,
      }}
    >
      <div style={highlightStyle} />
      <div style={reflectionStyle} />
      {children}
      {/* Inner shine border */}
      <div style={{
        pointerEvents: 'none', position: 'absolute', inset: 0, borderRadius,
        border:    '1.5px solid rgba(255,255,255,0.22)',
        boxShadow: 'inset 0 1.5px 8px 0 rgba(255,255,255,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.06)',
        zIndex: 4,
      }} />
    </div>
  )
}

// ─── METRIC BOTTOM SHEET ─────────────────────────────────────────────────────
function MetricBottomSheet({ metriques, onUpdate, onClose }) {
  const [vals, setVals] = useState({
    eau:     metriques?.eau     || 0,
    pas:     metriques?.pas     || 0,
    sommeil: metriques?.sommeil || 0,
    humeur:  metriques?.humeur  || 0,
  })

  const ITEMS = [
    { key:'eau',     icon:<WaterIcon size={20} color="#38bdf8" />, label:'Eau',     unit:'v',  min:0, max:20,    step:1,   color:'#38bdf8', fmt: v => Math.round(v) },
    { key:'pas',     icon:<RunIcon   size={20} color="#C87B52" />, label:'Pas',     unit:'',   min:0, max:25000, step:500, color:'#C87B52', fmt: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v },
    { key:'sommeil', icon:<MoonIcon  size={20} color="#818cf8" />, label:'Sommeil', unit:'h',  min:0, max:12,    step:0.5, color:'#818cf8', fmt: v => Number(v).toFixed(1) },
    { key:'humeur',  icon:<MoodIcon  size={20} color="#fbbf24" />, label:'Humeur',  unit:'/5', min:1, max:5,     step:1,   color:'#fbbf24', fmt: v => v },
  ]

  function inc(key, step, max) {
    setVals(p => ({ ...p, [key]: Math.min(max, +(p[key] || 0) + step) }))
  }
  function dec(key, step, min) {
    setVals(p => ({ ...p, [key]: Math.max(min, +(p[key] || 0) - step) }))
  }
  function save() {
    ITEMS.forEach(m => { if (vals[m.key] !== (metriques?.[m.key] || 0)) onUpdate(m.key, vals[m.key]) })
    onClose()
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.22 }}
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:200,
          background:'rgba(26,10,0,0.38)',
          backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)',
        }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y:'100%' }}
        animate={{ y:0 }}
        exit={{ y:'100%' }}
        transition={{ type:'spring', stiffness:360, damping:38 }}
        style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:201,
          background:'rgba(255,249,244,0.97)',
          backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
          borderRadius:'28px 28px 0 0',
          padding:'12px 20px 44px',
          boxShadow:'0 -10px 52px rgba(0,0,0,0.16)',
          border:'1.5px solid rgba(200,123,82,0.16)',
          borderBottom:'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)',
          margin:'0 auto 20px' }} />

        {/* Title */}
        <div style={{ fontSize:17, fontWeight:900, color:'#C87B52', letterSpacing:'-0.3px',
          marginBottom:20, textAlign:'center' }}>
          Métriques du jour
        </div>

        {/* 2×2 grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11, marginBottom:22 }}>
          {ITEMS.map(m => {
            const val = vals[m.key]
            const pct = Math.min(1, val / (m.max || 1))
            return (
              <GlassyButtonWrap
                key={m.key}
                background="rgba(255,246,238,0.80)"
                hoverBackground="rgba(255,246,238,0.95)"
                borderRadius={18} blur={8} lightDirection="top"
                isHoverable={false}
              >
                <div style={{ padding:'14px 12px', position:'relative', zIndex:3 }}>
                  {/* Icon + label */}
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                    {m.icon}
                    <span style={{ fontSize:10, fontWeight:700, color:'#8a7265',
                      textTransform:'uppercase', letterSpacing:'0.5px' }}>
                      {m.label}
                    </span>
                  </div>

                  {/* Value */}
                  <div style={{ fontSize:24, fontWeight:900, color:'#C87B52', lineHeight:1, marginBottom:3 }}>
                    {m.fmt(val)}
                    <span style={{ fontSize:11, fontWeight:500, color:'#c4b5a8', marginLeft:2 }}>{m.unit}</span>
                  </div>

                  {/* Mini progress bar */}
                  <div style={{ height:3, borderRadius:2, background:'rgba(0,0,0,0.07)', marginBottom:11 }}>
                    <div style={{
                      height:'100%', borderRadius:2, width:`${pct*100}%`,
                      background:`linear-gradient(90deg,${m.color}88,${m.color})`,
                      transition:'width 0.25s ease',
                      boxShadow:`0 0 6px ${m.color}80`,
                    }} />
                  </div>

                  {/* − + */}
                  <div style={{ display:'flex', gap:7 }}>
                    <button onClick={() => dec(m.key, m.step, m.min)} style={{
                      flex:1, height:32, borderRadius:9,
                      background:'rgba(200,123,82,0.08)',
                      border:'1px solid rgba(200,123,82,0.18)',
                      color:'#C87B52', fontSize:18, fontWeight:700,
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'Inter',system-ui,sans-serif",
                      transition:'background 0.12s',
                    }}>−</button>
                    <button onClick={() => inc(m.key, m.step, m.max)} style={{
                      flex:1, height:32, borderRadius:9,
                      background:'linear-gradient(135deg,rgba(200,123,82,0.16),rgba(158,92,53,0.10))',
                      border:'1px solid rgba(200,123,82,0.26)',
                      color:'#9E5C35', fontSize:18, fontWeight:700,
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'Inter',system-ui,sans-serif",
                      transition:'background 0.12s',
                    }}>+</button>
                  </div>
                </div>
              </GlassyButtonWrap>
            )
          })}
        </div>

        {/* Save */}
        <button onClick={save} style={{
          width:'100%', padding:'15px', borderRadius:100,
          background:'linear-gradient(135deg,#C87B52,#9E5C35)',
          color:'#fff', border:'none',
          fontSize:14, fontWeight:800,
          cursor:'pointer', letterSpacing:'-0.2px',
          fontFamily:"'Inter',system-ui,sans-serif",
          boxShadow:'0 8px 28px rgba(200,123,82,0.42), 0 2px 8px rgba(0,0,0,0.08)',
          transition:'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
        }}
          onMouseDown={e => e.currentTarget.style.transform='scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
        >
          Enregistrer
        </button>
      </motion.div>
    </>,
    document.body
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
    <GlassyButtonWrap
      background="rgba(210,130,80,0.09)" hoverBackground="rgba(210,130,80,0.17)"
      borderRadius={100} blur={18} lightDirection="top"
      shadowHoverColor="rgba(200,123,82,0.22)" shadowHoverIntensity={1.2}
      style={{
        marginTop:10, alignSelf:'center',
        boxShadow:`
          0 0 0 1.5px rgba(200,123,82,0.38),
          0 -1px 0 0 rgba(255,255,255,0.65),
          0 1px 0 0 rgba(158,92,53,0.25),
          0 4px 14px rgba(200,123,82,0.16)
        `
      }}
      onClick={handleClick}
    >
      {ripples.map(rp => (
        <span key={rp.id} style={{
          position:'absolute', borderRadius:'50%', pointerEvents:'none',
          left:rp.x, top:rp.y, width:10, height:10, marginLeft:-5, marginTop:-5,
          background:'rgba(200,123,82,0.45)',
          animation:'liquidRipple 0.75s ease-out forwards',
          zIndex:3,
        }} />
      ))}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'9px 32px',
          position:'relative', zIndex:3,
          fontFamily:"'Inter',system-ui,sans-serif", fontSize:13, fontWeight:700,
          color: hovered ? '#9E5C35' : '#C87B52',
          transition:'color 0.22s ease',
          pointerEvents:'none',
        }}>
        <HeartIcon size={15} color={hovered ? '#9E5C35' : '#C87B52'} />
        <span>Mettre à jour mes métriques</span>
      </div>
    </GlassyButtonWrap>
  )
}

// ─── PILL BUTTON — GlassyButton style ────────────────────────────────────────
function MagneticGlowBtn({ label, iconEl, onClick }) {
  return (
    <GlassyButtonWrap
      background="linear-gradient(150deg,#FFF3EC 0%,#F0D5BA 50%,#E8C4A8 100%)"
      hoverBackground="linear-gradient(150deg,#FFFAF6 0%,#F5E3CC 50%,#EED0B0 100%)"
      borderRadius={24} blur={0} lightDirection="top-left"
      shadowHoverColor="rgba(200,123,82,0.28)" shadowHoverIntensity={1.1}
      style={{ userSelect:'none' }}
      onClick={onClick}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 10,
        padding: '22px 14px 18px',
        position: 'relative', zIndex: 3,
        fontFamily: "'Inter',system-ui,sans-serif",
      }}>
        <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {iconEl}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3F15', letterSpacing: '0.2px' }}>{label}</span>
      </div>
    </GlassyButtonWrap>
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
        padding:'1.5px', borderRadius:26,
        /* Glow border couleur du sujet — statique + suit le curseur */
        background: glowing
          ? `radial-gradient(circle 220px at ${glowPos.x}% ${glowPos.y}%, ${color}70, ${color}30 42%, ${color}14 68%)`
          : `${color}28`,
        animation:`tabFade 0.4s ease ${index * 0.08}s both`,
        transition: glowing
          ? 'background 0s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'
          : 'background 0.5s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        /* MagicBentoGrid 3D tilt */
        transform:`perspective(500px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle:'preserve-3d',
        willChange:'transform',
      }}>
      {/* Inner card — fond teinté couleur + transparent */}
      <div style={{
        background:`linear-gradient(145deg, ${color}07, rgba(255,246,238,0.72))`,
        backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderRadius:24.5, padding:'14px 8px 12px',
        boxShadow:`0 6px 20px ${color}18, inset 0 1px 0 rgba(255,255,255,0.65)`,
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
              stroke={color+'0A'} strokeWidth="5.5"
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
        <div style={{ fontSize:14, fontWeight:500, color: val > 0 ? color : '#c4b5a8', lineHeight:1, letterSpacing:'-0.3px' }}>
          {val > 0 ? fmt(val) : '·'}
        </div>
        <div style={{ fontSize:8, color:'#8a7265', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.8px', opacity:0.75 }}>{label}</div>
      </div>
    </div>
  )
}

function MetricRings({ metriques }) {
  const items = [
    { iconEl:<WaterIcon size={17} color="#38bdf8" />, label:'Eau',     val:metriques?.eau||0,     goal:8,     color:'#38bdf8', fmt: v => `${v}/8` },
    { iconEl:<RunIcon size={17} color="#FF6B35" />,   label:'Pas',     val:metriques?.pas||0,     goal:10000, color:'#FF6B35', fmt: v => v>=1000 ? `${Math.round(v/1000)}k` : `${v}` },
    { iconEl:<MoonIcon size={17} color="#818cf8" />,  label:'Sommeil', val:metriques?.sommeil||0, goal:8,     color:'#818cf8', fmt: v => `${v}h` },
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
  const [glowS, setGlowS] = useState(false)
  const [posS, setPosS] = useState({ x:50, y:50 })
  const [glowN, setGlowN] = useState(false)
  const [posN, setPosN] = useState({ x:50, y:50 })

  function moveS(e) {
    const r = e.currentTarget.getBoundingClientRect()
    setPosS({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 })
  }
  function moveN(e) {
    const r = e.currentTarget.getBoundingClientRect()
    setPosN({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 })
  }

  return (
    <div style={{ display:'flex', gap:8, padding:'0 22px 12px' }}>

      {/* ── Streak card ── */}
      <div
        onMouseMove={moveS} onMouseEnter={() => setGlowS(true)} onMouseLeave={() => setGlowS(false)}
        style={{
          flex:1, padding:'1.5px', borderRadius:21.5,
          background: glowS
            ? `radial-gradient(circle 180px at ${posS.x}% ${posS.y}%, rgba(249,115,22,0.55), rgba(249,115,22,0.22) 42%, rgba(249,115,22,0.08) 68%)`
            : 'rgba(249,115,22,0.18)',
          transition: glowS ? 'background 0s' : 'background 0.5s ease',
        }}
      >
        <GlassyButtonWrap
          background="linear-gradient(145deg,rgba(249,115,22,0.07),rgba(251,146,60,0.04))"
          hoverBackground="linear-gradient(145deg,rgba(249,115,22,0.11),rgba(251,146,60,0.07))"
          borderRadius={20} blur={10} lightDirection="top-left"
          shadowHoverColor="rgba(249,115,22,0.14)" shadowHoverIntensity={0.7}
          isHoverable={false}
          style={{ width:'100%', height:'100%' }}
        >
          <div style={{ padding:'10px 12px', height:'100%', display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:3 }}>
            <div style={{
              width:34, height:34, borderRadius:11, flexShrink:0,
              background:'linear-gradient(135deg,#f97316,#ea580c)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 12px rgba(249,115,22,0.28)',
            }}>
              {streak >= 7 ? <FireIcon size={17} color="#fff" /> : streak >= 3 ? <FlashIcon size={17} color="#fff" /> : <LeafIcon size={17} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:600, color:'rgba(249,115,22,0.82)', lineHeight:1, letterSpacing:'-0.5px' }}>
                {streak}<span style={{ fontSize:10, fontWeight:500, color:'rgba(249,115,22,0.45)', marginLeft:6 }}>jours</span>
              </div>
              <div style={{ fontSize:9, color:'rgba(249,115,22,0.55)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:6 }}>
                {streak >= 7 ? '🔥 En feu !' : streak > 0 ? 'Streak actif' : 'Premier jour'}
              </div>
            </div>
          </div>
        </GlassyButtonWrap>
      </div>

      {/* ── XP / Niveau card ── */}
      <div
        onMouseMove={moveN} onMouseEnter={() => setGlowN(true)} onMouseLeave={() => setGlowN(false)}
        style={{
          flex:1.4, padding:'1.5px', borderRadius:21.5,
          background: glowN
            ? `radial-gradient(circle 220px at ${posN.x}% ${posN.y}%, rgba(217,119,6,0.55), rgba(217,119,6,0.22) 42%, rgba(217,119,6,0.08) 68%)`
            : 'rgba(217,119,6,0.18)',
          transition: glowN ? 'background 0s' : 'background 0.5s ease',
        }}
      >
        <GlassyButtonWrap
          background="linear-gradient(145deg,rgba(245,158,11,0.07),rgba(217,119,6,0.04))"
          hoverBackground="linear-gradient(145deg,rgba(245,158,11,0.11),rgba(217,119,6,0.07))"
          borderRadius={20} blur={10} lightDirection="top-left"
          shadowHoverColor="rgba(217,119,6,0.14)" shadowHoverIntensity={0.7}
          isHoverable={false}
          style={{ width:'100%', height:'100%' }}
        >
          <div style={{ padding:'10px 12px', position:'relative', zIndex:3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div>
                <div style={{ fontSize:9, color:'rgba(217,119,6,0.65)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Niveau {level}</div>
                <div style={{ fontSize:16, fontWeight:600, color:'rgba(180,95,10,0.85)', lineHeight:1.1, letterSpacing:'-0.5px' }}>
                  {xp} <span style={{ fontSize:9, color:'rgba(180,95,10,0.50)', fontWeight:500 }}>XP</span>
                </div>
              </div>
              <div style={{
                width:28, height:28, borderRadius:9,
                background:'linear-gradient(135deg,#fbbf24,#d97706)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 3px 10px rgba(217,119,6,0.30)',
              }}><StarIcon size={14} color="#fff" /></div>
            </div>
            {/* Glowing nodes */}
            <div style={{ display:'flex', alignItems:'center', gap:2.5, margin:'4px 0 2px' }}>
              {Array.from({length:10}).map((_, i) => {
                const filled = i < Math.floor(pct / 10)
                const active = i === Math.floor(pct / 10) && pct < 100
                return (
                  <div key={i} style={{
                    flex: filled ? 1.4 : 1,
                    height:3.5, borderRadius:2,
                    background: filled
                      ? 'linear-gradient(90deg,#fbbf24,#d97706)'
                      : active ? 'rgba(217,119,6,0.28)' : 'rgba(217,119,6,0.10)',
                    boxShadow: filled ? '0 0 5px rgba(217,119,6,0.55)' : 'none',
                    transition:'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                    animation: active ? 'dotPulse 1.6s ease-in-out infinite' : 'none',
                  }} />
                )
              })}
            </div>
            <div style={{ fontSize:8.5, color:'rgba(180,95,10,0.50)', marginTop:3, fontWeight:600 }}>
              {100 - xpInLevel} XP pour le niveau {level + 1}
            </div>
          </div>
        </GlassyButtonWrap>
      </div>

    </div>
  )
}

// ─── DAILY TASK ITEM — même style que ContextualShortcuts ────────────────────
function DailyTaskItem({ t, i, onToggle }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: i * 0.05, type:'spring', stiffness:340, damping:28 }}
      onClick={() => onToggle(t)}
      whileTap={{ scale:0.98 }}
      style={{
        display:'flex', alignItems:'center', gap:13,
        padding:'13px 16px', minHeight:68, borderRadius:20, cursor:'pointer',
        background: t.isDone
          ? `linear-gradient(135deg, ${t.color}18 0%, ${t.color}0a 100%)`
          : `linear-gradient(135deg, ${t.color}22 0%, ${t.color}0e 60%, ${t.color}06 100%)`,
        backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        border:`1.5px solid ${t.isDone ? t.color+'30' : t.color+'50'}`,
        boxShadow: t.isDone
          ? '0 2px 6px rgba(0,0,0,0.03)'
          : `0 6px 22px ${t.color}22, 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.75)`,
        opacity: t.isDone ? 0.65 : 1,
        transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Icône colorée + checkbox intégrée */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <div style={{
          width:38, height:38, borderRadius:12, flexShrink:0,
          background: t.isDone
            ? `linear-gradient(135deg,${t.color},${t.color}cc)`
            : `linear-gradient(135deg, ${t.color}35, ${t.color}20)`,
          border:`1px solid ${t.color}${t.isDone ? '55' : '45'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:17, lineHeight:1,
          boxShadow: t.isDone ? `0 4px 12px ${t.color}40` : `0 4px 12px ${t.color}30`,
          transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {t.isDone
            ? <span style={{ color:'#fff', fontSize:14, fontWeight:900 }}>✓</span>
            : t.emoji}
        </div>
      </div>

      {/* Texte */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:13.5, fontWeight:800, color: t.isDone ? '#9b6b50' : '#C87B52',
          textDecoration: t.isDone ? 'line-through' : 'none',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{t.title}</div>
        <div style={{
          fontSize:11, color:'#9b6b50', marginTop:2, opacity:0.85,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{t.detail}</div>
      </div>

      {/* Badge progression ou flèche */}
      {t.auto && t.current > 0
        ? <div style={{ fontSize:10, fontWeight:700, color:t.color, background:`${t.color}15`, padding:'3px 8px', borderRadius:8, flexShrink:0 }}>
            {t.fmt(t.current)}
          </div>
        : <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={t.isDone ? t.color : 'rgba(212,170,90,0.50)'} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
      }
    </motion.div>
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
    <div style={{ padding:'8px 18px 12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:900, color:'#C87B52', letterSpacing:'-0.3px' }}>7 tâches du jour</div>
          <div style={{ fontSize:12, color:'#9b6b50', marginTop:1 }}>{doneCount}/{tasks.length} accomplies</div>
        </div>
        <div style={{ position:'relative', width:30, height:30, flexShrink:0 }}>
          {/* Gradient orbit ring — rotating SVG */}
          <motion.svg
            width="30" height="30"
            style={{ position:'absolute', inset:0, pointerEvents:'none' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="rgba(255,210,190,0.0)"/>
                <stop offset="25%"  stopColor="rgba(255,190,168,0.88)"/>
                <stop offset="50%"  stopColor="rgba(215,125,95,0.98)"/>
                <stop offset="75%"  stopColor="rgba(255,190,168,0.88)"/>
                <stop offset="100%" stopColor="rgba(255,210,190,0.0)"/>
              </linearGradient>
            </defs>
            <circle cx="15" cy="15" r="13.5" fill="none" stroke="url(#orbitGrad)" strokeWidth="1.5"/>
          </motion.svg>
          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            whileTap={{ scale: 0.90 }}
            style={{
              position:'absolute', inset:0, borderRadius:'50%',
              background:'transparent', border:'none',
              cursor:'pointer', outline:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <motion.svg
              width={11} height={11} viewBox="0 0 12 12"
              animate={{ rotate: collapsed ? 0 : 45 }}
              transition={{ type:'spring', stiffness:420, damping:26 }}
            >
              <line x1="6" y1="1" x2="6" y2="11" stroke="#C87B52" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="1" y1="6" x2="11" y2="6" stroke="#C87B52" strokeWidth="1.6" strokeLinecap="round"/>
            </motion.svg>
          </motion.button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position:'relative', height:3, borderRadius:10, background:'rgba(200,123,82,0.10)', marginBottom: collapsed ? 0 : 14, overflow:'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, type:'spring', stiffness:55, damping:16 }}
          style={{
            height:'100%', borderRadius:10, position:'relative', overflow:'hidden',
            background:'linear-gradient(90deg,#FFD4A0,#E8A07A,#C87B52,#9E5C35)',
            boxShadow:'0 0 6px rgba(200,123,82,0.45)',
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x:['-100%','200%'] }}
            transition={{ duration:2, repeat:Infinity, ease:'linear', repeatDelay:1.5 }}
            style={{
              position:'absolute', inset:0, width:'50%',
              background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.50),transparent)',
            }}
          />
        </motion.div>
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

// ─── INSIGHTS CAROUSEL — ImmersiveCarousel (Framer) port ────────────────────
function InsightsCarousel({ profil, metriques, onChat }) {
  const h = new Date().getHours()

  const allCards = [
    h < 10 ? {
      image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&q=72',
      title:'Débute bien ta journée',
      body:"1 verre d'eau + 5 min de lumière naturelle activent ton métabolisme dès le réveil.",
      action:'Conseils matin', from:'#C87B52',
    } : h < 14 ? {
      image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&q=72',
      title:'Repas de midi équilibré',
      body:"Protéines + légumes + glucides lents. Évite les sucres rapides qui fatiguent l'après-midi.",
      action:'Idées repas', from:'#C87B52',
    } : h < 18 ? {
      image:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&q=72',
      title:"Regain d'énergie",
      body:"10 min de marche = autant d'énergie qu'un café, sans le crash post-caféine.",
      action:'Me remotiver', from:'#C87B52',
    } : {
      image:'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=600&auto=format&q=72',
      title:'Prépare ton sommeil',
      body:"Coupe les écrans 30 min avant de dormir. La mélatonine se libère dans l'obscurité.",
      action:'Routine soir', from:'#38C1B6',
    },
    {
      image:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&auto=format&q=72',
      title: (metriques?.eau||0) >= 4 ? 'Hydratation OK !' : "Bois de l'eau",
      body: (metriques?.eau||0) > 0
        ? `${metriques.eau}/8 verres aujourd'hui. ${metriques.eau < 4 ? 'Un verre maintenant !' : 'Continue comme ça !'}`
        : "Objectif : 8 verres/jour. Pose un grand verre devant toi maintenant.",
      action:'Mettre à jour', from:'#38C1B6',
    },
    {
      image:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&q=72',
      title:'Respiration 5-5',
      body:"2 min de cohérence cardiaque réduisent le cortisol de 20%. Inspire 5s, expire 5s.",
      action:'En savoir plus', from:'#C87B52',
    },
  ]

  const cardCount = allCards.length
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const touchStartX  = useRef(null)

  const goToCard = useCallback(index => {
    const ni = Math.max(0, Math.min(cardCount - 1, index))
    startTransition(() => setActiveIndex(ni))
  }, [cardCount])

  const handlePrevious = useCallback(() => goToCard(activeIndex - 1), [activeIndex, goToCard])
  const handleNext     = useCallback(() => goToCard(activeIndex + 1), [activeIndex, goToCard])

  // Mouse wheel horizontal scroll
  useEffect(() => {
    const onWheel = e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        if (e.deltaX > 20) handleNext()
        else if (e.deltaX < -20) handlePrevious()
      }
    }
    const c = containerRef.current
    if (c) c.addEventListener('wheel', onWheel, { passive: false })
    return () => { if (c) c.removeEventListener('wheel', onWheel) }
  }, [handleNext, handlePrevious])

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -40) handleNext()
    else if (dx > 40) handlePrevious()
    touchStartX.current = null
  }

  const getCardStyle = useCallback(index => {
    const distance  = Math.abs(index - activeIndex)
    const direction = index - activeIndex
    const offset    = 72
    if (distance === 0) return { scale:1,    opacity:1,    blur:0,   zIndex:10, x:0,              y:0  }
    if (distance === 1) return { scale:0.90, opacity:1,    blur:0,   zIndex:5,  x:direction*offset, y:12 }
    if (distance === 2) return { scale:0.82, opacity:0.85, blur:1.5, zIndex:3,  x:direction*offset, y:22 }
    return               { scale:0.76, opacity:0.55, blur:3,   zIndex:1,  x:direction*offset, y:30 }
  }, [activeIndex])

  function handleAction(e, action) {
    e.stopPropagation()
    if (action === 'Mettre à jour') onChat('sante')
    else onChat(action)
  }

  return (
    <div style={{ padding:'14px 18px 0' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={hc.cardsTitle}>Insights du jour</span>
        <span style={{ fontSize:11, color:'#C87B52', fontWeight:700,
          background:'rgba(200,123,82,0.10)', padding:'3px 12px', borderRadius:20 }}>
          {activeIndex + 1} / {cardCount}
        </span>
      </div>

      {/* Stage */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ position:'relative', height:320,
          display:'flex', alignItems:'center', justifyContent:'center' }}>

        {allCards.map((card, index) => {
          const cs       = getCardStyle(index)
          const isActive = index === activeIndex
          return (
            <motion.div
              key={index}
              style={{ position:'absolute', width:'100%', maxWidth:300, cursor: isActive ? 'default' : 'pointer' }}
              animate={{ scale:cs.scale, opacity:cs.opacity, x:cs.x, y:cs.y,
                filter:`blur(${cs.blur}px)`, zIndex:cs.zIndex }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={() => { if (!isActive) goToCard(index) }}
            >
              {/* Bronze ring */}
              <div style={{
                padding:3, borderRadius:27,
                background:'linear-gradient(180deg,rgba(255,243,236,0.30) 0%,rgba(232,196,168,0.25) 9%,rgba(200,123,82,0.28) 32%,rgba(158,92,53,0.22) 73%,rgba(245,200,170,0.28) 100%)',
                boxShadow: isActive
                  ? '0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.05), 0 2px 12px rgba(200,123,82,0.18)'
                  : '0 4px 18px rgba(0,0,0,0.05)',
              }}>
                {/* Ivory glass inner */}
                <div style={{
                  borderRadius:24, overflow:'hidden', position:'relative',
                  background:'linear-gradient(150deg,rgba(255,246,238,0.72) 0%,rgba(255,240,225,0.68) 50%,rgba(255,234,214,0.65) 100%)',
                  backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,0.60)',
                }}>
                  {/* Image */}
                  <div style={{ margin:'8px 8px 0', height:148, borderRadius:18, overflow:'hidden', position:'relative' }}>
                    <img src={card.image} alt={card.title}
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                      loading="lazy" />
                    <div style={{
                      position:'absolute', bottom:0, left:0, right:0, height:'52%',
                      background:`linear-gradient(0deg,${card.from}99 0%,transparent 100%)`,
                      pointerEvents:'none',
                    }} />
                  </div>
                  {/* Text — active card only */}
                  {isActive && <div style={{ padding:'10px 16px 14px' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#C87B52',
                      letterSpacing:'-0.02em', marginBottom:5, lineHeight:1.3 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize:12, color:'#8b5e45', lineHeight:1.65,
                      marginBottom:10,
                      overflow:'hidden', display:'-webkit-box',
                      WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {card.body}
                    </div>
                    {/* CTA */}
                    {(
                      <GlassyButtonWrap
                        background="rgba(210,130,80,0.09)"
                        hoverBackground="rgba(210,130,80,0.17)"
                        borderRadius={100} blur={18} lightDirection="top"
                        shadowHoverColor="rgba(200,123,82,0.22)" shadowHoverIntensity={1.2}
                        style={{
                          alignSelf:'flex-start',
                          boxShadow:`
                            0 0 0 1.5px rgba(200,123,82,0.38),
                            0 -1px 0 0 rgba(255,255,255,0.65),
                            0 1px 0 0 rgba(158,92,53,0.25),
                            0 4px 14px rgba(200,123,82,0.16)
                          `
                        }}
                        onClick={e => handleAction(e, card.action)}
                      >
                        <div style={{
                          padding:'7px 18px',
                          fontSize:11, fontWeight:700, color:'#C87B52',
                          fontFamily:"'Inter',system-ui,sans-serif", whiteSpace:'nowrap',
                          position:'relative', zIndex:3,
                        }}>
                          {card.action} →
                        </div>
                      </GlassyButtonWrap>
                    )}
                  </div>}
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Prev arrow */}
        <button onClick={handlePrevious} disabled={activeIndex === 0}
          aria-label="Précédent"
          style={{
            position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
            width:34, height:34, borderRadius:'50%', zIndex:20,
            background:'rgba(255,246,238,0.92)', backdropFilter:'blur(8px)',
            border:'1.5px solid rgba(200,123,82,0.28)',
            cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: activeIndex === 0 ? 0.3 : 1,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 10px rgba(200,123,82,0.15)',
            transition:'opacity 0.2s ease',
          }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
            stroke="#C87B52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Next arrow */}
        <button onClick={handleNext} disabled={activeIndex === cardCount - 1}
          aria-label="Suivant"
          style={{
            position:'absolute', right:0, top:'50%', transform:'translateY(-50%)',
            width:34, height:34, borderRadius:'50%', zIndex:20,
            background:'rgba(255,246,238,0.92)', backdropFilter:'blur(8px)',
            border:'1.5px solid rgba(200,123,82,0.28)',
            cursor: activeIndex === cardCount - 1 ? 'not-allowed' : 'pointer',
            opacity: activeIndex === cardCount - 1 ? 0.3 : 1,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 10px rgba(200,123,82,0.15)',
            transition:'opacity 0.2s ease',
          }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
            stroke="#C87B52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Line nav */}
      <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:12, marginBottom:4 }}>
        {allCards.map((_, i) => (
          <div key={i} onClick={() => goToCard(i)} style={{
            height:2, width: i === activeIndex ? 28 : 8, borderRadius:2,
            background: i === activeIndex ? 'linear-gradient(90deg,#E8A07A,#C87B52)' : 'rgba(200,123,82,0.20)',
            transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)', cursor:'pointer',
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── CONTEXTUAL SHORTCUTS ──────────────────────────────────────────────────────
function ContextualShortcuts({ profil, metriques, onNavigate }) {
  const h = new Date().getHours()

  // Style — toujours en premier (featured)
  const styleCard = {
    icon: <SparkleIcon size={18} color="#818cf8" />,
    label: h < 12 ? 'Style du jour' : h < 18 ? 'Inspiration style' : 'Style de demain',
    sub: 'Tenues · looks · inspirations',
    tab: 'style', color: '#818cf8',
  }

  // 2 suggestions contextuelles selon heure + métriques (sans Solenn)
  const contextual = [
    h >= 5  && h < 12 && { icon:<SunIcon size={15} color="#f97316" />,  label:'Routine matinale',       sub:'Démarre bien ta journée',              tab:'routine', color:'#f97316' },
    h >= 5  && h < 12 && { icon:<LeafIcon size={15} color="#34d399" />, label:'Recette petit-déj',       sub:'Protéines + énergie durable',          tab:'herbal',  color:'#34d399' },
    h >= 12 && h < 18 && { icon:<FoodIcon size={15} color="#fbbf24" />, label:'Repas équilibré',         sub:'Légumes · protéines · glucides lents', tab:'herbal',  color:'#fbbf24' },
    h >= 12 && h < 18 && { icon:<RunIcon size={15} color="#C87B52" />,  label:"Boost de l'après-midi",  sub:"10 min de marche = autant qu'un café", tab:'sante',   color:'#C87B52' },
    h >= 18 && h < 22 && { icon:<MoonIcon size={15} color="#818cf8" />, label:'Routine du soir',         sub:'Déconnecte et récupère',               tab:'routine', color:'#818cf8' },
    h >= 22            && { icon:<MoonIcon size={15} color="#818cf8" />, label:'Prépare ton sommeil',     sub:'Écrans off · respiration · détente',   tab:'sante',   color:'#818cf8' },
    (metriques?.eau||0) < 6 && { icon:<WaterIcon size={15} color="#38bdf8" />, label:'Hydratation en retard', sub:`${metriques?.eau||0}/8 verres · rattrape-toi !`, tab:'sante', color:'#38bdf8' },
    (metriques?.pas||0) < 5000 && h >= 9 && h < 20 && { icon:<RunIcon size={15} color="#C87B52" />, label:'Objectif pas', sub:`${Math.round((metriques?.pas||0)/1000*10)/10}k / 10k pas`, tab:'sante', color:'#C87B52' },
  ].filter(Boolean).slice(0, 2)

  const allSuggestions = [styleCard, ...contextual]

  return (
    <div style={{ padding:'14px 18px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={hc.cardsTitle}>Pour toi maintenant</span>
        <span style={{ fontSize:10, color:'#9b6b50', fontWeight:500, opacity:0.7 }}>
          {h < 12 ? 'Matin' : h < 18 ? 'Après-midi' : h < 22 ? 'Soirée' : 'Nuit'}
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {/* ── Featured card (index 0) ── */}
        {allSuggestions.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay: i * 0.07, type:'spring', stiffness:340, damping:28 }}
            onClick={() => onNavigate(s.tab)}
            whileTap={{ scale:0.97 }}
            style={{
              display:'flex', alignItems:'center', gap:13,
              padding: '13px 16px', minHeight: 68,
              borderRadius: 20,
              cursor:'pointer',
              background: `linear-gradient(135deg, ${s.color}22 0%, ${s.color}0e 60%, ${s.color}06 100%)`,
              backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
              border: `1.5px solid ${s.color}50`,
              boxShadow: `0 6px 22px ${s.color}22, 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.75)`,
              transition:'box-shadow 0.2s ease',
            }}
          >
            <div style={{
              width:38, height:38, borderRadius:12, flexShrink:0,
              background: `linear-gradient(135deg, ${s.color}35, ${s.color}20)`,
              border: `1px solid ${s.color}45`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: `0 4px 12px ${s.color}30`,
            }}>
              {s.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:800, color:'#C87B52', lineHeight:1.2 }}>{s.label}</div>
              <div style={{ fontSize:11, color:'#9b6b50', marginTop:3, opacity:0.85 }}>{s.sub}</div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity:0.85, flexShrink:0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </motion.div>
        ))}
      </div>

      {/* ── CTA Demander à Solenn — toujours en bas ── */}
      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:0.22, type:'spring', stiffness:280, damping:24 }}
        onClick={() => onNavigate('chat')}
        whileTap={{ scale:0.97 }}
        style={{
          marginTop:8, marginBottom:28,
          padding:'13px 16px', minHeight:68,
          borderRadius:20, cursor:'pointer',
          background:'linear-gradient(135deg, rgba(200,123,82,0.18) 0%, rgba(232,160,122,0.10) 60%, rgba(200,123,82,0.07) 100%)',
          border:'1.5px solid rgba(200,123,82,0.36)',
          boxShadow:'0 6px 22px rgba(200,123,82,0.16), 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)',
          backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
          display:'flex', alignItems:'center', gap:13,
        }}
      >
        <div style={{
          width:38, height:38, borderRadius:12, flexShrink:0,
          background:'linear-gradient(135deg, #C87B52 0%, #E8A07A 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 12px rgba(200,123,82,0.40)',
        }}>
          <ChatIcon size={17} color="#fff" />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:800, color:'#C87B52', lineHeight:1.2 }}>Demander à Solenn</div>
          <div style={{ fontSize:11, color:'#9b6b50', marginTop:3, opacity:0.85 }}>Disponible · répond en quelques secondes</div>
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
          stroke="#C87B52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity:0.85, flexShrink:0 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </motion.div>
    </div>
  )
}

// ─── HOME TAB EXPORT ──────────────────────────────────────────────────────────
export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onUpdate, onSwitchTab, onChat, streak = 0, xp = 0, level = 1 }) {
  const [showSheet, setShowSheet] = useState(false)

  function handleLog() { setShowSheet(true) }

  return (
    <div style={hc.page}>
      <NovaGlowScore
        score={score} scoreColor={scoreColor}
        profil={profil} metriques={metriques} onLog={handleLog}
      />
      <MetricRings metriques={metriques} />
      <StreakXP streak={streak} xp={xp} level={level} />
      <DailyTasks profil={profil} metriques={metriques} onSwitchTab={onSwitchTab} />
      <InsightsCarousel profil={profil} metriques={metriques}
        onChat={action => {
          if (action === 'herbal') { onSwitchTab('herbal'); return }
          if (action === 'sante')  { onSwitchTab('sante');  return }
          onSwitchTab('chat'); onChat(action)
        }}
      />
      <ContextualShortcuts profil={profil} metriques={metriques} onNavigate={onSwitchTab} />

      {/* Metric bottom sheet */}
      <AnimatePresence>
        {showSheet && (
          <MetricBottomSheet
            metriques={metriques}
            onUpdate={onUpdate}
            onClose={() => setShowSheet(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hc = {
  page: { display:'flex', flexDirection:'column', paddingBottom:90 },

  hero: { position:'relative', minHeight:500, display:'flex', alignItems:'center',
    justifyContent:'center', paddingBottom:28 },
  greetBadge: { display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)',
    borderRadius:24, padding:'6px 16px', fontSize:11, color:'#7a4f38', fontWeight:600,
    marginBottom:12, marginTop:32, letterSpacing:'0.3px',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  greetDot: { width:7, height:7, borderRadius:'50%', background:'#E8A07A',
    display:'inline-block', animation:'dotPulse 2s ease-in-out infinite',
    boxShadow:'0 0 6px rgba(232,160,122,0.7)' },
  greetName: { marginBottom:36, textAlign:'center' },
  greetNameAccent: { background:'linear-gradient(135deg,#C87B52,#E8A07A)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  circleWrap: { position:'relative', width:340, height:340,
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
  cardsTitle: { fontSize:16, fontWeight:900, color:'#C87B52', letterSpacing:'-0.3px' },

  actionsWrap: { padding:'16px 18px 4px' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 },
}
