import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, AnimatePresence } from 'framer-motion'
import { WaterIcon, MoodIcon, HeartIcon, FlashIcon, FireIcon, DiamondIcon, LeafIcon, MeditateIcon, FoodIcon, MoonIcon, SunIcon, TargetIcon, ChatIcon, SparkleIcon, StarIcon, LightbulbIcon, BrainIcon, RunIcon, CalendarIcon } from './Icons'

// Copie locale — évite d'importer SanteTab (JSX au niveau module → crash)
function scoreJour(m) {
  let s = 0
  if (m.pas >= 10000) s += 20; else if (m.pas >= 7000) s += 15; else if (m.pas >= 5000) s += 10; else if (m.pas >= 2000) s += 5
  if (m.sommeil >= 7.5) s += 25; else if (m.sommeil >= 6) s += 18; else if (m.sommeil >= 5) s += 10; else if (m.sommeil > 0) s += 5
  if (m.eau >= 8) s += 20; else if (m.eau >= 6) s += 15; else if (m.eau >= 4) s += 10; else if (m.eau > 0) s += 5
  if (m.humeur === 5) s += 20; else if (m.humeur === 4) s += 15; else if (m.humeur === 3) s += 10; else if (m.humeur > 0) s += 5
  if (m.fc >= 50 && m.fc <= 80) s += 15; else if (m.fc > 0 && m.fc <= 100) s += 8
  return Math.min(s, 100)
}

// ─── SOLENN FACE (liquid morph — cohérent avec App.jsx) ──────────────────────
function SolennFace({ size = 34, isNight = false }) {
  return (
    <div className="liquid-avatar" style={{
      width: size, height: size,
      background: isNight ? 'transparent' : 'rgba(220,140,70,0.08)',
      border: isNight ? '1.5px solid rgba(162,192,248,0.55)' : '1.5px solid rgba(200,123,82,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      isolation: 'isolate',
      transform: 'translateZ(0)',
    }}>
      <span style={{
        fontSize: size * 0.44, fontWeight: 700,
        color: isNight ? 'rgba(220,235,255,0.92)' : 'rgba(255,230,190,0.92)',
        fontFamily: "'Poppins',system-ui,sans-serif", lineHeight: 1,
        letterSpacing: '-0.02em', userSelect: 'none',
      }}>S</span>
    </div>
  )
}

// ─── ANIMATED LIQUID BACKGROUND — version originale restaurée ────────────────
function FuturisticBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden' }}>

      {/* Jaune doux — légèrement haut-centre, multiply */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 50% 48%, #FFE4A0 0%, transparent 68%)',
        opacity:0.62, mixBlendMode:'multiply',
        animation:'liquidBlob3 14s ease-in-out infinite',
      }} />

      {/* Orange léger — légèrement bas-gauche, multiply */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 42% 58%, #FF7112 0%, transparent 62%)',
        opacity:0.13, mixBlendMode:'multiply',
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
        backgroundImage:'radial-gradient(circle at 8% 90%, rgba(212,132,74,0.18) 0%, transparent 52%)',
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

  /* ── Palette dynamique — couleurs passées en uniforms ── */
  uniform vec3 uColor1;  /* couleur principale de l'anneau */
  uniform vec3 uColor2;  /* couleur secondaire de l'anneau */
  const vec3 baseColor3 = vec3(0.0, 0.0, 0.0);  /* noir pur → alpha=0 via extractAlpha → halo invisible */
  const float innerRadius = 0.76;
  const float noiseScale  = 0.72;

  float light1(float i,float a,float d){ return i/(1.+d*a); }
  float light2(float i,float a,float d){ return i/(1.+d*d*a); }

  vec4 draw(vec2 uv){
    vec3 c1=adjustHue(uColor1,hue), c2=adjustHue(uColor2,hue), c3=adjustHue(baseColor3,hue);
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

function NovaGlowCanvas({ size = 248, mouseRef, color1 = [1.0, 0.58, 0.20], color2 = [1.0, 0.78, 0.38] }) {
  const canvasRef  = useRef(null)
  const color1Ref  = useRef(color1)
  const color2Ref  = useRef(color2)
  color1Ref.current = color1   // toujours à jour sans re-créer l'effet WebGL
  color2Ref.current = color2

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

    const uTime   = gl.getUniformLocation(prog, 'iTime')
    const uRes    = gl.getUniformLocation(prog, 'iResolution')
    const uHue    = gl.getUniformLocation(prog, 'hue')
    const uHover  = gl.getUniformLocation(prog, 'hover')
    const uRot    = gl.getUniformLocation(prog, 'rot')
    const uHInt   = gl.getUniformLocation(prog, 'hoverIntensity')
    const uColor1 = gl.getUniformLocation(prog, 'uColor1')
    const uColor2 = gl.getUniformLocation(prog, 'uColor2')

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

      // couleurs via ref — toujours à jour même après HMR sans remount
      const c1 = color1Ref.current, c2 = color2Ref.current
      gl.uniform3f(uColor1, c1[0], c1[1], c1[2])
      gl.uniform3f(uColor2, c2[0], c2[1], c2[2])
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
      position:'absolute',
      top:'50%', left:'50%',
      transform:'translate(-50%,-50%)',
      pointerEvents:'none', zIndex:1,
    }} />
  )
}

// ─── NOVA GLASS ORB — glassmorphisme + glow border cursor (Framer Glow-Card) ───
function NovaOrb({ active, isNight = false, preset = 'day' }) {
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
  const liquidHighlight = useMotionTemplate`radial-gradient(ellipse 42% 38% at ${hlX} ${hlY}, rgba(255,255,255,0.38) 0%, ${isNight ? 'rgba(180,210,255,0.06)' : 'rgba(255,230,190,0.12)'} 50%, transparent 70%)`

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
          background: 'transparent',
        }}
      >
        {/* ── Nova Glow — rendu au niveau circleWrap ── */}

        {/* Shine top — reflet verre */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: preset === 'day'     ? 'radial-gradient(ellipse 80% 30% at 50% -2%, rgba(255,240,160,0.45) 0%, transparent 65%)'
                    : preset === 'sunrise' ? 'radial-gradient(ellipse 80% 30% at 50% -2%, rgba(255,235,180,0.40) 0%, transparent 65%)'
                    : preset === 'sunset'  ? 'radial-gradient(ellipse 80% 30% at 50% -2%, rgba(255,200,140,0.10) 0%, transparent 65%)'
                    :                        'radial-gradient(ellipse 80% 30% at 50% -2%, rgba(255,255,255,0.18) 0%, transparent 65%)',
        }} />

        {/* Tinte pêche douce (jour) / supprimée en nuit */}
        {!isNight && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at 52% 52%, rgba(255,190,120,0.07) 0%, rgba(200,100,40,0.03) 60%, transparent 82%)',
          }} />
        )}

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
            background: isNight ? 'rgba(140,180,255,0.70)' : 'rgba(255,200,140,0.70)',
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
            background: isNight
              ? 'radial-gradient(160px circle at var(--gx, -200px) var(--gy, -200px), rgba(140,180,255,0.90), transparent 70%)'
              : 'radial-gradient(160px circle at var(--gx, -200px) var(--gy, -200px), rgba(255,150,70,0.95), transparent 70%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: glowActive ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none', zIndex: 5,
          }}
        />

        {/* Bordure statique supprimée — soleil remplit l'espace */}
      </div>
    </div>
  )
}

// ─── PALETTE TEXTE NUIT / JOUR ────────────────────────────────────────────────
const nightText  = (op) => `rgba(180,210,255,${op})`
const warmText   = (op) => `rgba(200,123,82,${op})`
const sunsetText = (op) => `rgba(255,225,200,${op})`

// ─── OCEAN SCENE BACKGROUND ────────────────────────────────────────────────────
const OCEAN_PRESETS = {
  // sky covers the FULL hero height — no separate "water" block, no demarcation
  day: {
    sky:          'linear-gradient(180deg,#3B8FCC 0%,#6BB8E8 38%,#A8D8F0 65%,#B8E2F5 82%,#C8EBF8 100%)',
    sunMoonY:     'calc(100% - 163px)',
    bodyColor:    '#FFD900',
    bodyGlow:     'rgba(255,215,0,0.60)',
    bodyGlowFar:  'rgba(255,215,0,0.22)',
    bodySize:     92,
    isMoon:       false,
    cloudOp:      1,
    starOp:       0,
    reflectColor: 'rgba(255,220,60,0.35)',
    skyBiteColor: null,
    skyBottom:    '#C8EBF8',
    ringColor1:   [1.0, 0.58, 0.20],   /* orange vif */
    ringColor2:   [1.0, 0.78, 0.38],   /* doré */
  },
  sunrise: {
    sky:          'linear-gradient(180deg,#1A1540 0%,#6B2C65 24%,#C85870 52%,#EE8858 76%,#F8C888 100%)',
    sunMoonY:     'calc(100% - 163px)',
    bodyColor:    '#FFD055',
    bodyGlow:     'rgba(255,200,60,0.65)',
    bodyGlowFar:  'rgba(255,200,60,0.20)',
    bodySize:     92,
    isMoon:       false,
    cloudOp:      0.5,
    starOp:       0,
    reflectColor: 'rgba(255,200,80,0.35)',
    skyBiteColor: null,
    skyBottom:    '#F8C888',
    ringColor1:   [1.0, 0.80, 0.25],   /* doré frais */
    ringColor2:   [1.0, 0.92, 0.52],   /* or pâle */
  },
  sunset: {
    sky:          'linear-gradient(180deg,#0E1F4A 0%,#5A1E48 28%,#C04020 55%,#E86830 76%,#F0A060 100%)',
    sunMoonY:     'calc(100% - 163px)',
    bodyColor:    '#FF6020',
    bodyGlow:     'rgba(255,90,20,0.42)',
    bodyGlowFar:  'rgba(255,90,20,0.09)',
    bodySize:     92,
    isMoon:       false,
    cloudOp:      0.55,
    starOp:       0,
    reflectColor: 'rgba(255,80,20,0.45)',
    skyBiteColor: null,
    skyBottom:    '#F0A060',
    sunShineOp:   0.15,
    ringColor1:   [1.0, 0.38, 0.12],   /* rouge-orangé */
    ringColor2:   [1.0, 0.62, 0.25],   /* ambre chaud */
  },
  night: {
    sky:          'linear-gradient(180deg,#020712 0%,#050E22 45%,#091830 78%,#0C2040 100%)',
    sunMoonY:     'calc(100% - 163px)',
    bodyColor:    'radial-gradient(circle at 28% 38%, #F8FBFF 0%, #DDE8F8 28%, #B4CAEC 58%, #8AAAD8 85%, #6888C0 100%)',
    bodyGlow:     'rgba(180,200,255,0.55)',
    bodyGlowFar:  'rgba(180,200,255,0.18)',
    bodySize:     94,
    isMoon:       true,
    cloudOp:      0.10,
    starOp:       1,
    reflectColor: 'rgba(180,200,255,0.30)',
    skyBiteColor: '#050E22',
    skyBottom:    '#0C2040',
    ringColor1:   [0.62, 0.74, 0.96],  /* bleu-argent lunaire */
    ringColor2:   [0.82, 0.90, 1.00],  /* blanc nacré */
  },
}

function getOceanPreset(hour) {
  if (hour >= 6  && hour < 9)  return 'sunrise'
  if (hour >= 9  && hour < 18) return 'day'
  if (hour >= 18 && hour < 21) return 'sunset'
  return 'night'
}

const OCEAN_STARS = [
  [12,6],[22,14],[38,5],[55,11],[68,4],[82,9],[92,16],
  [7,24],[30,20],[50,26],[75,18],[88,28],
  [16,36],[42,32],[64,38],[85,34],[25,44],[58,42],
]

function OceanCloud({ top, delay, duration, reverse, scale = 1 }) {
  return (
    <div style={{
      position:'absolute',
      top:`${top}%`,
      left: reverse ? 'auto' : '-22%',
      right: reverse ? '-22%' : 'auto',
      width: 100 * scale,
      height: 32 * scale,
      borderRadius: 999,
      background: 'rgba(255,255,255,0.78)',
      filter: 'blur(7px)',
      animation: `${reverse ? 'cloudDriftL' : 'cloudDriftR'} ${duration}s linear ${delay}s infinite`,
    }} />
  )
}

function OceanSceneBg({ preset: key }) {
  const p = OCEAN_PRESETS[key] || OCEAN_PRESETS.day
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none',
      /* Fade bottom edge into the page — no hard cutoff */
      WebkitMaskImage:'linear-gradient(180deg, black 72%, transparent 100%)',
      maskImage:       'linear-gradient(180deg, black 72%, transparent 100%)',
    }}>

      {/* Sky — fills the entire hero, no separate ocean block */}
      <div style={{ position:'absolute', inset:0, background:p.sky }} />

      {/* Vignette top — assombrit le haut pour rendre le header lisible */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:'22%',
        background:'linear-gradient(180deg, rgba(0,0,0,0.46) 0%, transparent 100%)',
        pointerEvents:'none', zIndex:5,
      }} />

      {/* Stars (night only) */}
      {p.starOp > 0 && OCEAN_STARS.map(([x, y], i) => (
        <div key={i} style={{
          position:'absolute',
          left:`${x}%`, top:`${y * 0.52}%`,
          width: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
          height: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5,
          borderRadius:'50%', background:'#fff',
          opacity: 0.45 + (i % 5) * 0.11,
          animation:`starTwinkle ${2.2 + (i % 5) * 0.7}s ease-in-out infinite ${(i * 0.35) % 2.5}s`,
          zIndex:1,
        }} />
      ))}

      {/* Sun / Moon */}
      <div style={{
        position:'absolute', left:'50%', top:p.sunMoonY,
        transform:'translate(-50%,-50%)',
        width:p.bodySize, height:p.bodySize,
        borderRadius:'50%', background:p.bodyColor,
        boxShadow:`0 0 ${p.bodySize * 0.5}px ${p.bodySize * 0.35}px ${p.bodyGlow}, 0 0 ${p.bodySize * 1.4}px ${p.bodySize * 0.65}px ${p.bodyGlowFar}`,
        animation:'bodyFloat 11s ease-in-out infinite',
        zIndex:2, overflow:'hidden',
      }}>
        {p.isMoon && p.skyBiteColor && (<>
          {/* Crescent bite */}
          <div style={{ position:'absolute', top:'-8%', right:'-18%', width:'82%', height:'82%', borderRadius:'50%', background:p.skyBiteColor }} />
          {/* Rim light — bord lumineux du croissant */}
          <div style={{ position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(circle at 14% 48%, rgba(255,255,255,0.38) 0%, rgba(200,224,255,0.18) 32%, transparent 55%)',
          }} />
          {/* Subtle surface shimmer */}
          <div style={{ position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(circle at 40% 28%, rgba(255,255,255,0.14) 0%, transparent 40%)',
          }} />
        </>)}
        {!p.isMoon && (
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle at 35% 30%, rgba(255,255,255,${p.sunShineOp ?? 0.55}) 0%, transparent 65%)` }} />
        )}
      </div>

      {/* Clouds */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', opacity:p.cloudOp, zIndex:3, pointerEvents:'none' }}>
        <OceanCloud top={10} delay={0}  duration={42} scale={1.3} />
        <OceanCloud top={28} delay={14} duration={55} scale={0.8} reverse />
        <OceanCloud top={48} delay={7}  duration={47} scale={1.1} />
        <OceanCloud top={18} delay={30} duration={60} scale={0.7} reverse />
        <OceanCloud top={40} delay={40} duration={45} scale={0.9} />
      </div>

      {/* Subtle horizon shimmer line */}
      <div style={{
        position:'absolute', left:0, right:0,
        top:p.sunMoonY, height:14,
        background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)',
        filter:'blur(5px)', zIndex:4,
      }} />

      {/* Water-surface ripples — supprimées (trop visibles sur fond sombre) */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:'30%', zIndex:4 }}>
        {[]}
        {/* Sun/moon reflection streak */}
        <div style={{
          position:'absolute', top:0, bottom:0,
          left:'calc(50% - 14px)', width:28,
          background:`linear-gradient(180deg,${p.reflectColor} 0%,transparent 100%)`,
          filter:'blur(8px)',
          animation:'reflectionWaver 5.5s ease-in-out infinite',
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

  const _urlPreset = new URLSearchParams(window.location.search).get('preset')
  const hour   = _urlPreset === 'sunrise' ? 7 : _urlPreset === 'day' ? 11 : _urlPreset === 'sunset' ? 19 : _urlPreset === 'night' ? 23 : new Date().getHours()
  const preset = getOceanPreset(hour)
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  const isNight = preset === 'night'
  const runC  = isNight ? '#7BB0E0' : '#C87B52'   // bleu acier nuit / orange jour
  const moodC = isNight ? '#a78bfa' : '#fbbf24'   // violet doux nuit / jaune jour
  const METRICS = [
    { iconEl:<WaterIcon size={22} color="#38bdf8" />, val:metriques?.eau,     color:'#38bdf8', key:'eau',     fmt: v => v+'v' },
    { iconEl:<RunIcon   size={22} color={runC}   />,  val:metriques?.pas,     color:runC,      key:'pas',     fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
    { iconEl:<MoonIcon  size={22} color="#818cf8" />, val:metriques?.sommeil, color:'#818cf8', key:'sommeil', fmt: v => v+'h' },
    { iconEl:<MoodIcon  size={22} color={moodC}  />,  val:metriques?.humeur,  color:moodC,     key:'humeur',  fmt: v => v+'/5' },
    { iconEl:<HeartIcon size={22} color="#ef4444" />, val:metriques?.fc,      color:'#ef4444', key:'fc',      fmt: v => v },
  ]
  const paused = circleHovered || !!activeMetric

  // ── Couleur de l'arc selon le score — identique à SanteTab ──
  const arcColor = score >= 80 ? 'rgba(34,197,94,0.28)' : score >= 60 ? 'rgba(56,189,248,0.28)' : score >= 40 ? 'rgba(245,158,11,0.28)' : score > 0 ? 'rgba(239,68,68,0.28)' : 'rgba(200,123,82,0.25)'
  const arcTrack = score >= 80 ? 'rgba(34,197,94,0.05)' : score >= 60 ? 'rgba(56,189,248,0.05)' : score >= 40 ? 'rgba(245,158,11,0.05)' : score > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(200,123,82,0.05)'

  return (
    <div style={hc.hero}>
      <OceanSceneBg preset={preset} />
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>

        <style>{`
          @keyframes headerShimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
          @keyframes cloudDriftR    { 0%{transform:translateX(0)} 100%{transform:translateX(140vw)} }
          @keyframes cloudDriftL    { 0%{transform:translateX(0)} 100%{transform:translateX(-140vw)} }
          @keyframes oceanRipple    { 0%,100%{transform:scaleX(1);opacity:.10} 50%{transform:scaleX(1.05);opacity:.22} }
          @keyframes bodyFloat      { 0%,100%{transform:translate(-50%,-50%) translateY(0px)} 50%{transform:translate(-50%,-50%) translateY(-7px)} }
          @keyframes starTwinkle    { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
          @keyframes reflectionWaver{ 0%,100%{transform:scaleX(1);opacity:.8} 50%{transform:scaleX(1.6);opacity:.45} }
        `}</style>
        {/* ── Nova WebGL Orb ── */}
        <div style={hc.circleWrap}
          onMouseEnter={() => setCircleHovered(true)}
          onMouseLeave={() => setCircleHovered(false)}
        >
          {/* ── Nova Glow canvas — 165px centré dans le circleWrap 250×250 ── */}
          <NovaGlowCanvas size={200} mouseRef={null} color1={OCEAN_PRESETS[preset].ringColor1} color2={OCEAN_PRESETS[preset].ringColor2} />

          {/* Hub 108×108 centré dans le container 250×250 */}
          <div style={{ position:'absolute', inset:0, margin:'auto', width:108, height:108 }}>
            <NovaOrb active={circleHovered || !!activeMetric} isNight={preset === 'night'} preset={preset} />
            {/* Night tint — orb becomes moon-like */}
            {preset === 'night' && (
              <div style={{
                position:'absolute', inset:0, borderRadius:'50%',
                background:'linear-gradient(135deg,rgba(100,140,255,0.22) 0%,rgba(60,90,220,0.10) 100%)',
                pointerEvents:'none', zIndex:9,
              }} />
            )}
            {/* Score au centre */}
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', zIndex:10, pointerEvents:'none' }}>
              {score > 0 && <>
                <span style={{ fontSize:26, fontWeight:500, lineHeight:1,
                  fontFamily:"'Poppins',system-ui,sans-serif",
                  color: preset === 'night' ? 'rgba(180,210,255,0.90)' : 'rgba(200,123,82,0.90)' }}>{score}</span>
                <span style={{ fontSize:8, fontWeight:500, letterSpacing:'0.18em',
                  color: preset === 'night' ? 'rgba(160,190,245,0.65)' : 'rgba(200,123,82,0.65)',
                  marginTop:2, textTransform:'uppercase',
                  fontFamily:"'Poppins',system-ui,sans-serif" }}>score</span>
              </>}
            </div>
          </div>

          {/* ── Arc de progression score — masqué ── */}
          <svg
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:2, overflow:'visible', display:'none' }}
            viewBox="0 0 340 340"
          >
            {/* Track */}
            <circle cx="170" cy="170" r="131" fill="none" stroke={arcTrack} strokeWidth="2.5"/>
            {/* Arc progressif */}
            <motion.circle
              cx="170" cy="170" r="131"
              fill="none"
              stroke={arcColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ filter:`drop-shadow(0 0 6px ${arcColor}88)` }}
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
              const x   = 125 + 100 * Math.cos(rad)
              const y   = 125 + 100 * Math.sin(rad)
              const filled   = m.val > 0
              const isActive = activeMetric === m.key
              return (
                /* Counter-rotation — garde l'icône droite, re-active les events */
                <div key={m.key} style={{
                  position:'absolute', left: x - 21, top: y - 21,
                  width:42, height:42,
                  animation:'counterOrbit 18s linear infinite',
                  animationPlayState: paused ? 'paused' : 'running',
                  pointerEvents:'auto',
                }}>
                  <MetricDot m={m} x={21} y={21} filled={filled} isActive={isActive}
                    isNight={preset === 'night'}
                    preset={preset}
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
function MetricDot({ m, x, y, filled, isActive, isNight = false, preset = 'day', onDown, onUp, onLog }) {
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
      onClick={() => onLog(m.key)}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleLeave}
      onPointerCancel={handleLeave}
      style={{
        position:'absolute', left:x-21, top:y-21, width:42, height:42, zIndex:3,
        borderRadius:13, overflow:'visible',
        background: isActive ? `${m.color}28` : springing ? `${m.color}18`
          : preset === 'night'   ? 'rgba(10,20,45,0.55)'
          : preset === 'sunset'  ? 'rgba(80,25,5,0.28)'
          : 'rgba(255,246,238,0.42)',
        border:`1.5px solid ${isActive ? m.color+'90' : filled ? m.color+'66' : isNight ? m.color+'44' : m.color+'55'}`,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:1.5, cursor:'pointer',
        boxShadow: isActive
          ? `0 0 0 4px ${m.color}35, 0 0 28px ${m.color}80, inset 0 1px 0 rgba(255,255,255,1)`
          : filled
          ? `0 0 0 3px ${m.color}18, 0 0 16px ${m.color}45, inset 0 1px 0 rgba(255,255,255,1)`
          : '0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.02)',
        transform: isActive ? 'scale(0.84)' : 'scale(1)',
        animation: springing ? 'metricSpring 0.55s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
        fontFamily:"'Poppins',system-ui,sans-serif",
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
          <span style={{ fontSize:10, color:'#fff', fontWeight:500, lineHeight:1 }}>✓</span>
        </div>
      )}
      <span style={{
        display:'flex', alignItems:'center', lineHeight:1,
        animation: springing ? 'iconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
      }}>{m.iconEl}</span>
      {filled && <span style={{ fontSize:10, color:m.color, fontWeight:500, lineHeight:1 }}>{m.fmt(m.val)}</span>}
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

export function GlassyButtonWrap({
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
        border:   '1px solid rgba(255,255,255,0.12)',
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
        border:    '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 1px 6px 0 rgba(255,255,255,0.08)',
        zIndex: 4,
      }} />
    </div>
  )
}

// ─── METRIC BOTTOM SHEET ─────────────────────────────────────────────────────
const METRIC_KEY_IDX = { eau:0, pas:1, sommeil:2, humeur:3 }

function MetricBottomSheet({ metriques, onUpdate, onClose, initialKey = 'eau' }) {
  const [vals, setVals] = useState({
    eau:     metriques?.eau     || 0,
    pas:     metriques?.pas     || 0,
    sommeil: metriques?.sommeil || 0,
    humeur:  metriques?.humeur  || 0,
  })
  const [activeIdx, setActiveIdx] = useState(METRIC_KEY_IDX[initialKey] ?? 0)

  const ITEMS = [
    { key:'eau',     icon:<WaterIcon size={22} color="#72B8D4" />, iconLg:<WaterIcon size={52} color="#72B8D4" />, label:'Eau',     unit:'v',  min:0, max:20,    step:1,   color:'#72B8D4', fmt: v => Math.round(v) },
    { key:'pas',     icon:<RunIcon   size={22} color="#C87B52" />, iconLg:<RunIcon   size={52} color="#C87B52" />, label:'Pas',     unit:'',   min:0, max:25000, step:500, color:'#C87B52', fmt: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v },
    { key:'sommeil', icon:<MoonIcon  size={22} color="#9A96CC" />, iconLg:<MoonIcon  size={52} color="#9A96CC" />, label:'Sommeil', unit:'h',  min:0, max:12,    step:0.5, color:'#9A96CC', fmt: v => Number(v).toFixed(1) },
    { key:'humeur',  icon:<MoodIcon  size={22} color="#C9A24E" />, iconLg:<MoodIcon  size={52} color="#C9A24E" />, label:'Humeur',  unit:'/5', min:1, max:5,     step:1,   color:'#C9A24E', fmt: v => v },
  ]
  const m = ITEMS[activeIdx]

  function inc() { setVals(p => ({ ...p, [m.key]: Math.min(m.max, +(p[m.key] || 0) + m.step) })) }
  function dec() { setVals(p => ({ ...p, [m.key]: Math.max(m.min, +(p[m.key] || 0) - m.step) })) }
  function save() {
    ITEMS.forEach(it => { if (vals[it.key] !== (metriques?.[it.key] || 0)) onUpdate(it.key, vals[it.key]) })
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
          background:'rgba(255,250,245,0.45)',
          backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
          borderRadius:'28px 28px 0 0',
          padding:'12px 24px 48px',
          boxShadow:'0 -10px 52px rgba(0,0,0,0.16)',
          border:'1.5px solid rgba(200,123,82,0.16)',
          borderBottom:'none',
        }}
      >
        {/* Handle */}
        <div style={{ width:36, height:3, borderRadius:2,
          background:'rgba(200,123,82,0.15)', margin:'0 auto 28px' }} />

        {/* Onglets — 4 icônes */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:40 }}>
          {ITEMS.map((it, i) => {
            const active = i === activeIdx
            return (
              <button key={it.key} onClick={() => setActiveIdx(i)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                background:'none', border:'none', cursor:'pointer',
                padding:'8px 16px', borderRadius:16,
                transition:'all 0.2s ease',
              }}>
                <div style={{
                  opacity: active ? 1 : 0.60,
                  filter: active ? `drop-shadow(0 0 7px ${it.color}cc) drop-shadow(0 0 18px ${it.color}55)` : `drop-shadow(0 0 4px ${it.color}44)`,
                  transition:'all 0.3s ease',
                }}>
                  {it.icon}
                </div>
                <div style={{
                  width:4, height:4, borderRadius:'50%',
                  background: active ? it.color : 'transparent',
                  transition:'background 0.2s ease',
                }} />
              </button>
            )
          })}
        </div>

        {/* Métrique active — icône grande + label + valeur */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.2, ease:'easeOut' }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:44 }}
          >
            {/* Icône grande + halo */}
            <div style={{ position:'relative', marginBottom:16 }}>
              {/* Halo derrière */}
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:140, height:140, borderRadius:'50%',
                background:`radial-gradient(circle, ${m.color}65 0%, ${m.color}30 40%, transparent 70%)`,
                filter:'blur(8px)',
                transition:'background 0.3s ease',
                pointerEvents:'none',
              }} />
              <div style={{
                position:'relative',
                filter:`drop-shadow(0 0 8px ${m.color}99)`,
                transition:'filter 0.3s ease',
              }}>{m.iconLg}</div>
            </div>

            {/* Label micro */}
            <span style={{
              fontSize:10, fontWeight:400, letterSpacing:'0.25em',
              textTransform:'uppercase', marginBottom:16,
              fontFamily:"'Poppins',system-ui,sans-serif",
              color:`${m.color}99`,
            }}>{m.label}</span>

            {/* − valeur + */}
            <div style={{ display:'flex', alignItems:'center', gap:32 }}>
              <button onClick={dec} style={{
                background:'none', border:'none', cursor:'pointer',
                color:`${m.color}90`, fontSize:32, fontWeight:200, lineHeight:1,
                fontFamily:"'Poppins',system-ui,sans-serif", padding:'4px 8px',
              }}>−</button>

              <span style={{
                fontSize:56, fontWeight:400, color:m.color, lineHeight:1,
                fontFamily:"'Poppins',system-ui,sans-serif", letterSpacing:'-2px',
                minWidth:90, textAlign:'center',
              }}>
                {m.fmt(vals[m.key])}
                <span style={{ fontSize:16, fontWeight:300, color:`${m.color}60`, marginLeft:4 }}>{m.unit}</span>
              </span>

              <button onClick={inc} style={{
                background:'none', border:'none', cursor:'pointer',
                color:m.color, fontSize:32, fontWeight:200, lineHeight:1,
                fontFamily:"'Poppins',system-ui,sans-serif", padding:'4px 8px',
              }}>+</button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Save */}
        <button onClick={save} style={{
          display:'block', margin:'0 auto',
          background:'none', border:'none',
          fontSize:12, fontWeight:500, letterSpacing:'0.22em',
          color:'rgba(160,110,60,0.65)', textTransform:'uppercase',
          cursor:'pointer', fontFamily:"'Poppins',system-ui,sans-serif",
          padding:'8px 24px',
          borderBottom:'1px solid rgba(160,110,60,0.20)',
          transition:'border-color 0.2s ease, color 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.color='rgba(160,110,60,0.80)'; e.currentTarget.style.borderBottomColor='rgba(160,110,60,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.color='rgba(160,110,60,0.65)'; e.currentTarget.style.borderBottomColor='rgba(160,110,60,0.35)' }}
        >sauvegarder</button>
      </motion.div>
    </>,
    document.body
  )
}

function NovaLogBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        marginTop:12, display:'flex', alignItems:'center', gap:8,
        padding:'9px 28px', borderRadius:100, cursor:'pointer',
        background: hovered ? 'rgba(200,123,82,0.08)' : 'rgba(255,248,240,0.18)',
        border:'1px solid rgba(200,123,82,0.22)',
        fontFamily:"'Poppins',system-ui,sans-serif", fontSize:13, fontWeight:500,
        color: hovered ? 'rgba(200,123,82,0.90)' : 'rgba(200,123,82,0.72)',
        boxShadow: hovered
          ? '0 8px 24px rgba(200,123,82,0.18), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 4px 16px rgba(200,123,82,0.10), 0 1px 4px rgba(0,0,0,0.05)',
        transition:'all 0.2s ease',
      }}
    >
      <HeartIcon size={14} color={hovered ? 'rgba(200,123,82,0.90)' : 'rgba(200,123,82,0.72)'} />
      <span>Mettre à jour mes métriques</span>
    </button>
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
        fontFamily: "'Poppins',system-ui,sans-serif",
      }}>
        <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {iconEl}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(200,123,82,0.82)', letterSpacing: '0.2px' }}>{label}</span>
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

  const R = 14
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
        padding:'1.5px', borderRadius:20,
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
        backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
        borderRadius:20, padding:'8px 4px 7px',
        boxShadow:`0 6px 20px ${color}18, inset 0 1px 0 rgba(255,255,255,0.65)`,
        display:'flex', flexDirection:'column', alignItems:'center', gap:3,
        position:'relative', zIndex:1,
        transition:'box-shadow 0.3s ease',
      }}>
        {/* ── Futuristic Donut Ring ── */}
        <div style={{ position:'relative', width:44, height:44 }}>
          <svg width={44} height={44} viewBox="0 0 44 44"
            style={{ transform:'rotate(-90deg)', overflow:'visible' }}>
            <defs>
              <filter id={`df${index}`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.2" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Outer decorative ring */}
            <circle cx="22" cy="22" r={R+4} fill="none" stroke={color+'18'} strokeWidth="0.6"/>

            {/* Tick marks */}
            {Array.from({length:20}).map((_, ti) => {
              const a = (ti / 20) * Math.PI * 2
              const ro = R+3, ri = R+2
              return (
                <line key={ti}
                  x1={(22+ro*Math.cos(a)).toFixed(1)} y1={(22+ro*Math.sin(a)).toFixed(1)}
                  x2={(22+ri*Math.cos(a)).toFixed(1)} y2={(22+ri*Math.sin(a)).toFixed(1)}
                  stroke={color} strokeWidth="0.7" opacity="0.22" strokeLinecap="round"/>
              )
            })}

            {/* Background track */}
            <circle cx="22" cy="22" r={R} fill="none"
              stroke={color+'0A'} strokeWidth="4"
              strokeDasharray="2.5 1.8"/>

            {/* Progress arc */}
            <circle cx="22" cy="22" r={R} fill="none"
              stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              filter={`url(#df${index})`}
              style={{ transition:'stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)' }}/>
          </svg>

          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {done
              ? <span style={{ fontSize:11, color, fontWeight:500, animation:'badgePop 0.4s ease' }}>✓</span>
              : iconEl}
          </div>
          {done && (
            <div style={{
              position:'absolute', inset:-4, borderRadius:'50%',
              border:`2px solid ${color}40`,
              animation:'scoreGlow 2s ease-in-out infinite',
              pointerEvents:'none',
            }} />
          )}
        </div>
        <div style={{ fontSize:12, fontWeight:500, color: val > 0 ? color : 'rgba(200,123,82,0.40)', lineHeight:1, letterSpacing:'-0.3px' }}>
          {val > 0 ? fmt(val) : '—'}
        </div>
        <div style={{ fontSize:10, color:'rgba(200,123,82,0.80)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
      </div>
    </div>
  )
}

function MetricRings({ metriques }) {
  const items = [
    { iconEl:<WaterIcon size={17} color="#38bdf8" />, label:'Eau',     val:metriques?.eau||0,     goal:8,     color:'#38bdf8', fmt: v => `${v}/8` },
    { iconEl:<RunIcon size={17} color="#C87B52" />,   label:'Pas',     val:metriques?.pas||0,     goal:10000, color:'#C87B52', fmt: v => v>=1000 ? `${Math.round(v/1000)}k` : `${v}` },
    { iconEl:<MoonIcon size={17} color="#818cf8" />,  label:'Sommeil', val:metriques?.sommeil||0, goal:8,     color:'#818cf8', fmt: v => `${v}h` },
    { iconEl:<MoodIcon size={17} color="#fbbf24" />,  label:'Humeur',  val:metriques?.humeur||0,  goal:5,     color:'#fbbf24', fmt: v => `${v}/5` },
  ]
  return (
    <div style={{ display:'flex', gap:6, padding:'8px 14px' }}>
      {items.map((it, i) => <MetricRing key={i} {...it} index={i} />)}
    </div>
  )
}

// ─── STREAK & XP ──────────────────────────────────────────────────────────────
export function StreakXP({ streak, xp, level }) {
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
    <div style={{ display:'flex', gap:8, padding:'0 22px 16px', marginBottom:4 }}>

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
              <div style={{ fontSize:17, fontWeight:500, color:'rgba(200,123,82,0.90)', lineHeight:1, letterSpacing:'-0.5px' }}>
                {streak}<span style={{ fontSize:10, fontWeight:300, color:'rgba(200,123,82,0.60)', marginLeft:6 }}>jours</span>
              </div>
              <div style={{ fontSize:9, color:'rgba(200,123,82,0.80)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:6 }}>
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
                <div style={{ fontSize:9, color:'rgba(200,123,82,0.80)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>Niveau {level}</div>
                <div style={{ fontSize:16, fontWeight:500, color:'rgba(200,123,82,0.90)', lineHeight:1.1, letterSpacing:'-0.5px' }}>
                  {xp} <span style={{ fontSize:9, color:'rgba(200,123,82,0.65)', fontWeight:300 }}>XP</span>
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
            <div style={{ fontSize:10, color:'rgba(200,123,82,0.80)', marginTop:3, fontWeight:500 }}>
              {100 - xpInLevel} XP pour le niveau {level + 1}
            </div>
          </div>
        </GlassyButtonWrap>
      </div>

    </div>
  )
}

// ─── DAILY TASK ITEM — même style que ContextualShortcuts ────────────────────
function DailyTaskItem({ t, i, onToggle, isNight = false, preset = 'day' }) {
  const tc = isNight ? nightText : preset === 'sunset' ? sunsetText : warmText
  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: i * 0.05, type:'spring', stiffness:340, damping:28 }}
      onClick={() => onToggle(t)}
      whileTap={{ scale:0.98 }}
      style={{
        display:'flex', alignItems:'center', gap:13,
        padding:'7px 12px', minHeight:44, borderRadius:12, cursor:'pointer',
        background: t.isDone
          ? `linear-gradient(135deg, ${t.color}40 0%, ${t.color}22 100%)`
          : `linear-gradient(135deg, ${t.color}55 0%, ${t.color}35 60%, ${t.color}20 100%)`,
        backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
        border:`1.5px solid ${t.isDone ? t.color+'55' : t.color+'88'}`,
        boxShadow: t.isDone
          ? '0 2px 8px rgba(0,0,0,0.08)'
          : `0 6px 22px ${t.color}38, 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.50)`,
        opacity: t.isDone ? 0.65 : 1,
        transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Icône colorée + checkbox intégrée */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <div style={{
          width:32, height:32, borderRadius:8, flexShrink:0,
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
            ? <span style={{ color:'#fff', fontSize:14, fontWeight:500 }}>✓</span>
            : t.emoji}
        </div>
      </div>

      {/* Texte */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:13.5, fontWeight:400, color: t.isDone ? tc(0.40) : tc(0.90),
          textDecoration: t.isDone ? 'line-through' : 'none',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{t.title}</div>
        <div style={{
          fontSize:11, color:tc(0.72), marginTop:2,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{t.detail}</div>
      </div>

      {/* Badge progression ou flèche */}
      {t.auto && t.current > 0
        ? <div style={{ fontSize:10, fontWeight:500, color:t.color, background:`${t.color}15`, padding:'3px 8px', borderRadius:8, flexShrink:0 }}>
            {t.fmt(t.current)}
          </div>
        : <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={t.isDone ? t.color : 'rgba(212,170,90,0.50)'} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="arrow-anim"
            style={{ flexShrink:0 }}>
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
      id:'nutrition', emoji:'🥗', color:'#22c55e',
      title: regime === 'végétarien' ? 'Protéines végétales' : regime === 'vegan' ? 'Équilibre vegan' : regime === 'sans gluten' ? 'Repas sans gluten' : 'Repas équilibrés',
      detail:'3 repas / légumes · protéines · glucides lents',
      goal:3, auto:false, fmt: v => `${v}/3 repas`,
    },
    {
      id:'sport', emoji: niveau==='avancé' ? '🏋️' : niveau==='intermédiaire' ? '🚴' : '🚶',
      color:'#C87B52',
      title: niveau==='avancé' ? 'Session entraînement' : niveau==='intermédiaire' ? 'Cardio 30 min' : 'Mouvement doux',
      detail: niveau==='avancé' ? '45-60 min d\'effort physique' : niveau==='intermédiaire' ? 'Cardio modéré + échauffement' : '20-30 min de stretching ou marche',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    },
    {
      id:'objectif', emoji:'🎯', color:'#C87B52',
      title: objectif || 'Ton objectif du jour',
      detail: objectif ? `Un pas de plus vers « ${objectif} »` : 'Avance d\'un pas vers ton grand objectif',
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

function DailyTasks({ profil, metriques, onSwitchTab, isNight = false, preset = 'day' }) {
  const tc = isNight ? nightText : preset === 'sunset' ? sunsetText : warmText
  const [done, setDone] = useState({})
  const [collapsed, setCollapsed] = useState(true)
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
          <div style={{ fontSize:11, fontWeight:600, color:tc(0.90), letterSpacing:'0.08em',
            fontFamily:"'Poppins',system-ui,sans-serif", textTransform:'uppercase' }}>7 tâches du jour</div>
          <div style={{ fontSize:12, color:tc(0.82), marginTop:1 }}>{doneCount}/{tasks.length} accomplies</div>
        </div>
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          whileTap={{ scale: 0.88 }}
          style={{
            width:28, height:28, borderRadius:'50%', flexShrink:0,
            background: 'transparent',
            border: `1px solid ${isNight ? 'rgba(180,210,255,0.10)' : 'rgba(200,123,82,0.12)'}`,
            cursor:'pointer', outline:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >
          <motion.svg
            width={11} height={11} viewBox="0 0 12 12"
            animate={{ rotate: collapsed ? 0 : 45 }}
            transition={{ type:'spring', stiffness:420, damping:26 }}
          >
            <line x1="6" y1="1" x2="6" y2="11" stroke={isNight ? "rgba(180,210,255,0.55)" : "rgba(180,90,30,0.80)"} strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke={isNight ? "rgba(180,210,255,0.55)" : "rgba(180,90,30,0.80)"} strokeWidth="1.6" strokeLinecap="round"/>
          </motion.svg>
        </motion.button>
      </div>

      {/* Progress bar */}
      <div style={{ position:'relative', height:3, borderRadius:8, background:'rgba(200,123,82,0.10)', marginBottom: collapsed ? 0 : 14, overflow:'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, type:'spring', stiffness:55, damping:16 }}
          style={{
            height:'100%', borderRadius:8, position:'relative', overflow:'hidden',
            background:'linear-gradient(90deg,#FFD4A0,#E8A07A,#C87B52,#C87B52)',
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
            <DailyTaskItem key={t.id} t={t} i={i} onToggle={toggle} isNight={isNight} preset={preset} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── INSIGHTS CAROUSEL — ImmersiveCarousel (Framer) port ────────────────────
function InsightsCarousel({ profil, metriques, onChat, isNight = false }) {
  const tc = isNight ? nightText : warmText
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
      action:'Routine soir', from:'#0A1633',
    },
    {
      image:'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&auto=format&q=72',
      title: (metriques?.eau||0) >= 4 ? 'Hydratation OK !' : "Bois de l'eau",
      body: (metriques?.eau||0) > 0
        ? `${metriques.eau}/8 verres aujourd'hui. ${metriques.eau < 4 ? 'Un verre maintenant !' : 'Continue comme ça !'}`
        : "Objectif : 8 verres/jour. Pose un grand verre devant toi maintenant.",
      action:'Mettre à jour', from:'#22c55e',
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
    if (distance === 1) return { scale:0.90, opacity:0.45, blur:1,   zIndex:5,  x:direction*offset, y:12 }
    if (distance === 2) return { scale:0.82, opacity:0.20, blur:2,   zIndex:3,  x:direction*offset, y:22 }
    return               { scale:0.76, opacity:0,    blur:3,   zIndex:1,  x:direction*offset, y:30 }
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
        <span style={{ ...hc.cardsTitle, color:tc(0.90) }}>Insights du jour</span>
        <span style={{ fontSize:11, color:tc(0.60), fontWeight:300 }}>
          {activeIndex + 1} / {cardCount}
        </span>
      </div>

      {/* Stage */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ position:'relative', height:270,
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
                background: isNight
                  ? 'linear-gradient(180deg,rgba(180,210,255,0.08) 0%,rgba(140,180,255,0.18) 32%,rgba(100,150,240,0.14) 73%,rgba(180,210,255,0.08) 100%)'
                  : 'linear-gradient(180deg,rgba(255,243,236,0.30) 0%,rgba(232,196,168,0.25) 9%,rgba(200,123,82,0.28) 32%,rgba(158,92,53,0.22) 73%,rgba(245,200,170,0.28) 100%)',
                boxShadow: isActive
                  ? isNight
                    ? '0 12px 40px rgba(0,0,0,0.30), 0 3px 10px rgba(0,0,0,0.15), 0 2px 12px rgba(100,160,255,0.15)'
                    : '0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.05), 0 2px 12px rgba(200,123,82,0.18)'
                  : '0 4px 18px rgba(0,0,0,0.05)',
              }}>
                {/* Glass inner — ivoire jour / verre sombre nuit */}
                <div style={{
                  borderRadius:20, overflow:'hidden', position:'relative',
                  background: isNight
                    ? 'linear-gradient(150deg,rgba(15,30,60,0.82) 0%,rgba(10,22,48,0.78) 50%,rgba(8,18,40,0.75) 100%)'
                    : 'linear-gradient(150deg,rgba(255,246,238,0.72) 0%,rgba(255,240,225,0.68) 50%,rgba(255,234,214,0.65) 100%)',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                  boxShadow: isNight ? 'inset 0 1px 0 rgba(180,210,255,0.15)' : 'inset 0 1px 0 rgba(255,255,255,0.60)',
                }}>
                  {/* Image */}
                  <div style={{ margin:'8px 8px 0', height:120, borderRadius:20, overflow:'hidden', position:'relative' }}>
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
                  {isActive && <div style={{ padding:'8px 14px 12px' }}>
                    <div style={{ fontSize:15, fontWeight:400, color:tc(0.90),
                      letterSpacing:'0.01em', marginBottom:4, lineHeight:1.3,
                      fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic' }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize:11, color:tc(0.80), lineHeight:1.6,
                      marginBottom:9,
                      overflow:'hidden', display:'-webkit-box',
                      WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                      {card.body}
                    </div>
                    {/* CTA */}
                    {(
                      <GlassyButtonWrap
                        background="rgba(210,130,80,0.06)"
                        hoverBackground="rgba(210,130,80,0.12)"
                        borderRadius={100} blur={18} lightDirection="top"
                        shadowHoverColor="rgba(200,123,82,0.10)" shadowHoverIntensity={0.6}
                        style={{
                          alignSelf:'flex-start',
                          boxShadow:'0 0 0 1px rgba(200,123,82,0.22)',
                        }}
                        onClick={e => handleAction(e, card.action)}
                      >
                        <div style={{
                          padding:'7px 18px',
                          fontSize:11, fontWeight:500, color:tc(0.90),
                          fontFamily:"'Poppins',system-ui,sans-serif", whiteSpace:'nowrap',
                          position:'relative', zIndex:3,
                        }}>
                          {card.action} <span className="arrow-anim">→</span>
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
            background: isNight ? 'rgba(8,18,45,0.88)' : 'rgba(255,246,238,0.92)',
            backdropFilter:'blur(8px)',
            border: isNight ? '1.5px solid rgba(180,210,255,0.20)' : '1.5px solid rgba(200,123,82,0.28)',
            cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: activeIndex === 0 ? 0.3 : 1,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: isNight ? '0 2px 10px rgba(0,0,0,0.30)' : '0 2px 10px rgba(200,123,82,0.15)',
            transition:'opacity 0.2s ease',
          }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
            stroke={isNight ? "rgba(180,210,255,0.80)" : "#C87B52"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Next arrow */}
        <button onClick={handleNext} disabled={activeIndex === cardCount - 1}
          aria-label="Suivant"
          style={{
            position:'absolute', right:0, top:'50%', transform:'translateY(-50%)',
            width:34, height:34, borderRadius:'50%', zIndex:20,
            background: isNight ? 'rgba(8,18,45,0.88)' : 'rgba(255,246,238,0.92)',
            backdropFilter:'blur(8px)',
            border: isNight ? '1.5px solid rgba(180,210,255,0.20)' : '1.5px solid rgba(200,123,82,0.28)',
            cursor: activeIndex === cardCount - 1 ? 'not-allowed' : 'pointer',
            opacity: activeIndex === cardCount - 1 ? 0.3 : 1,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: isNight ? '0 2px 10px rgba(0,0,0,0.30)' : '0 2px 10px rgba(200,123,82,0.15)',
            transition:'opacity 0.2s ease',
          }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
            stroke={isNight ? "rgba(180,210,255,0.80)" : "#C87B52"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Line nav */}
      <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:12, marginBottom:4 }}>
        {allCards.map((_, i) => (
          <div key={i} onClick={() => goToCard(i)} style={{
            height:2, width: i === activeIndex ? 28 : 8, borderRadius:2,
            background: i === activeIndex
              ? isNight ? 'linear-gradient(90deg,rgba(140,180,255,0.90),rgba(100,150,255,0.70))' : 'linear-gradient(90deg,#E8A07A,#C87B52)'
              : isNight ? 'rgba(180,210,255,0.18)' : 'rgba(200,123,82,0.20)',
            transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)', cursor:'pointer',
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── CONTEXTUAL SHORTCUTS ──────────────────────────────────────────────────────
function ContextualShortcuts({ profil, metriques, onNavigate, isNight = false, score = 0 }) {
  const tc = isNight ? nightText : warmText
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
        <span style={{ ...hc.cardsTitle, color:tc(0.90) }}>Pour toi maintenant</span>
        <span style={{ fontSize:10, color:tc(0.72), fontWeight:300 }}>
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
              background: isNight
                ? `linear-gradient(135deg, rgba(15,28,58,0.80) 0%, rgba(10,20,45,0.70) 100%)`
                : `linear-gradient(135deg, ${s.color}22 0%, ${s.color}0e 60%, ${s.color}06 100%)`,
              backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
              border: isNight ? `1.5px solid ${s.color}38` : `1.5px solid ${s.color}50`,
              boxShadow: isNight
                ? `0 6px 22px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(180,210,255,0.08)`
                : `0 6px 22px ${s.color}22, 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.75)`,
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
              <div style={{ fontSize:17, fontWeight:400, color:tc(0.90), lineHeight:1.2,
                fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic' }}>{s.label}</div>
              <div style={{ fontSize:11, color:tc(0.75), marginTop:3 }}>{s.sub}</div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="arrow-anim"
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
        className="chat-glow"
        style={{
          marginTop:8, marginBottom:8,
          padding:'13px 16px', minHeight:68,
          borderRadius:20, cursor:'pointer',
          background: isNight
            ? 'linear-gradient(135deg, rgba(200,220,255,0.10) 0%, rgba(180,210,255,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(200,123,82,0.18) 0%, rgba(200,123,82,0.08) 60%, rgba(200,123,82,0.05) 100%)',
          backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', gap:13,
        }}
      >
        <SolennFace size={38} isNight={isNight} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:18, fontWeight:400, color:tc(0.90), lineHeight:1.2,
            fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic' }}>Demander à Solenn</div>
          <div style={{ fontSize:11, color:tc(0.75), marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Disponible · répond en quelques secondes</div>
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
          stroke={isNight ? 'rgba(200,220,255,0.65)' : 'rgba(200,123,82,0.75)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="arrow-anim"
          style={{ flexShrink:0 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </motion.div>

      {/* ── Ta progression cette semaine ── */}
      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:0.30, type:'spring', stiffness:280, damping:24 }}
        style={{
          marginTop:0, marginBottom:28,
          padding:16,
          borderRadius:20,
          background: isNight
            ? 'linear-gradient(135deg, rgba(255,165,80,0.10) 0%, rgba(255,120,40,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(255,165,80,0.18) 0%, rgba(200,123,82,0.10) 60%, rgba(200,123,82,0.05) 100%)',
          backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
          border: isNight ? '1.5px solid rgba(255,165,80,0.22)' : '1.5px solid rgba(200,123,82,0.28)',
          boxShadow: isNight
            ? '0 6px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,200,100,0.06)'
            : '0 6px 22px rgba(200,123,82,0.14), inset 0 1px 0 rgba(255,255,255,0.70)',
          display:'flex', alignItems:'center', gap:14,
        }}
      >
        <div style={{
          width:38, height:38, borderRadius:12, flexShrink:0,
          background: score > 50
            ? 'linear-gradient(135deg, rgba(255,149,0,0.10), rgba(255,100,0,0.06))'
            : 'linear-gradient(135deg, rgba(200,123,82,0.10), rgba(200,123,82,0.06))',
          border: `1px solid ${score > 50 ? 'rgba(255,149,0,0.20)' : 'rgba(200,123,82,0.18)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <StarIcon size={16} color={score > 50 ? 'rgba(255,149,0,0.75)' : 'rgba(200,123,82,0.60)'} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:2 }}>
            {score > 0 ? (
              <>
                <span style={{
                  fontSize:28, fontWeight:700, lineHeight:1,
                  color: score > 50 ? '#E8962A' : '#C87B52',
                  fontFamily:"'Poppins',system-ui,sans-serif",
                  letterSpacing:'-0.02em',
                }}>{score}</span>
                <span style={{ fontSize:12, color:tc(0.55), fontWeight:400 }}>/100</span>
              </>
            ) : (
              <span style={{ fontSize:24, fontWeight:400, lineHeight:1, color:tc(0.45), fontFamily:"'Poppins',system-ui,sans-serif" }}>—</span>
            )}
          </div>
          <div style={{ fontSize:10, color:tc(0.60), marginBottom:4, letterSpacing:'0.3px', textTransform:'uppercase', fontWeight:500 }}>
            Score bien-être du jour
          </div>
          <div style={{ fontSize:13, fontWeight:500, color:tc(0.88),
            fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic' }}>
            {score > 50 ? 'Continue comme ça !' : 'Chaque jour compte'}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── 14-DAY SPARKLINE ─────────────────────────────────────────────────────────

function WeeklySparkline({ history, isNight = false, preset = 'day' }) {
  const tc = isNight ? nightText : preset === 'sunset' ? sunsetText : warmText
  const BAR_H = 28
  const today = new Date()
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (13 - i)); return d.toDateString()
  })
  const scores = days.map(dateStr => {
    const entry = (history || []).find(h => h.date === dateStr)
    return entry ? scoreJour(entry) : null
  })
  const validScores = scores.filter(s => s !== null)
  const avg = validScores.length > 0 ? Math.round(validScores.reduce((a,b) => a+b,0) / validScores.length) : 0

  const [glowB, setGlowB] = useState(false)
  const [posB,  setPosB]  = useState({ x:50, y:50 })

  return (
    <div style={{ padding:'0 22px 16px', marginBottom:4 }}>
      <div
        onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); setPosB({x:((e.clientX-r.left)/r.width)*100,y:((e.clientY-r.top)/r.height)*100}) }}
        onMouseEnter={() => setGlowB(true)} onMouseLeave={() => setGlowB(false)}
        style={{
          padding:'1.5px', borderRadius:21.5,
          background: glowB
            ? isNight
              ? `radial-gradient(circle 320px at ${posB.x}% ${posB.y}%, rgba(100,150,255,0.28), rgba(100,150,255,0.10) 42%, rgba(100,150,255,0.03) 68%)`
              : preset === 'day'
                ? `radial-gradient(circle 320px at ${posB.x}% ${posB.y}%, rgba(240,130,20,0.55), rgba(230,120,10,0.22) 42%, rgba(210,100,0,0.07) 68%)`
                : preset === 'sunset'
                  ? `radial-gradient(circle 320px at ${posB.x}% ${posB.y}%, rgba(210,60,20,0.50), rgba(180,40,10,0.20) 42%, rgba(150,20,0,0.06) 68%)`
                  : `radial-gradient(circle 320px at ${posB.x}% ${posB.y}%, rgba(217,119,6,0.45), rgba(217,119,6,0.18) 42%, rgba(217,119,6,0.06) 68%)`
            : isNight ? 'rgba(100,150,255,0.10)' : preset === 'day' ? 'rgba(220,120,20,0.45)' : preset === 'sunset' ? 'rgba(200,70,20,0.38)' : 'rgba(200,150,80,0.35)',
          transition: glowB ? 'background 0s' : 'background 0.5s ease',
        }}
      >
        <GlassyButtonWrap
          background={isNight
            ? "linear-gradient(145deg,rgba(15,30,65,0.70),rgba(10,22,50,0.60))"
            : preset === 'day'
              ? "linear-gradient(145deg,rgba(255,165,60,0.28),rgba(240,130,20,0.18))"
              : preset === 'sunset'
                ? "linear-gradient(145deg,rgba(210,70,25,0.24),rgba(170,40,10,0.15))"
                : "linear-gradient(145deg,rgba(255,250,238,0.36),rgba(250,235,210,0.24))"}
          hoverBackground={isNight
            ? "linear-gradient(145deg,rgba(20,38,80,0.80),rgba(14,28,62,0.70))"
            : preset === 'day'
              ? "linear-gradient(145deg,rgba(255,175,70,0.36),rgba(245,140,30,0.26))"
              : preset === 'sunset'
                ? "linear-gradient(145deg,rgba(220,80,30,0.32),rgba(180,50,15,0.22))"
                : "linear-gradient(145deg,rgba(255,252,242,0.46),rgba(252,240,218,0.32))"}
          borderRadius={20} blur={10} lightDirection="top-left"
          shadowHoverColor={isNight ? "rgba(100,150,255,0.12)" : "rgba(217,119,6,0.14)"} shadowHoverIntensity={0.7}
          isHoverable={false} style={{ width:'100%' }}
        >
          <div style={{ padding:'12px 14px', position:'relative', zIndex:3 }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:9, color:tc(0.80), fontWeight:500, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:3 }}>
                  Évolution · 14 jours
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                  <span style={{ fontSize:15, fontWeight:600, color:avg > 0 ? tc(0.90) : tc(0.65), letterSpacing: avg > 0 ? '-0.3px' : '0px', lineHeight:1 }}>
                    {avg > 0 ? avg : '—'}
                  </span>
                  {avg > 0 && <span style={{ fontSize:9, color:tc(0.55), fontWeight:400 }}>/100</span>}
                </div>
              </div>
            </div>
            {/* Bars */}
            <div style={{ display:'flex', alignItems:'flex-end', gap:2.5, height:BAR_H }}>
              {scores.map((s, i) => {
                const isToday = i === 13
                const filled  = s !== null
                const h       = filled ? Math.max(3, Math.round((s / 100) * BAR_H)) : 3
                const barColor = isNight
                  ? s >= 70 ? 'linear-gradient(180deg,#60a5fa,#3b82f6)'
                  : s >= 40 ? 'linear-gradient(180deg,#34d399,#10b981)'
                  : s > 0   ? 'linear-gradient(180deg,#f87171,#ef4444)' : null
                  : s >= 70 ? 'linear-gradient(180deg,#fbbf24,#f97316)'
                  : s >= 40 ? 'linear-gradient(180deg,#fb923c,#ea580c)'
                  : s > 0   ? 'linear-gradient(180deg,#f87171,#ef4444)' : null
                return (
                  <div key={i} style={{ flex:1, height:BAR_H, display:'flex', alignItems:'flex-end' }}>
                    <div style={{
                      width:'100%', height:h,
                      borderRadius:'2px 2px 0 0',
                      background: filled && barColor ? barColor : isNight ? 'rgba(100,150,255,0.08)' : 'rgba(217,119,6,0.12)',
                      opacity: isToday ? 1 : filled ? 0.75 : 0.45,
                      boxShadow: isToday && filled ? isNight ? '0 0 6px rgba(96,165,250,0.60)' : '0 0 6px rgba(249,115,22,0.55)' : 'none',
                      transition:'height 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                    }} />
                  </div>
                )
              })}
            </div>
            {/* Day labels */}
            <div style={{ display:'flex', gap:2.5, marginTop:4 }}>
              {days.map((dateStr, i) => {
                const isToday = i === 13
                const dayName = new Date(dateStr).toLocaleDateString('fr-FR', { weekday:'narrow' })
                return (
                  <div key={i} style={{
                    flex:1, textAlign:'center', fontSize:7,
                    color: isToday ? tc(0.85) : tc(isNight ? 0.35 : 0.65),
                    fontWeight: isToday ? 700 : 400,
                  }}>
                    {isToday ? '●' : i % 2 === 0 ? dayName : ''}
                  </div>
                )
              })}
            </div>
          </div>
        </GlassyButtonWrap>
      </div>
    </div>
  )
}

// ─── HOME TAB EXPORT ──────────────────────────────────────────────────────────
export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onUpdate, onSwitchTab, onChat, streak = 0, xp = 0, level = 1, history = [], onPresetChange }) {
  const [showSheet, setShowSheet] = useState(false)
  const [initialMetric, setInitialMetric] = useState('eau')

  function handleLog(key) { setInitialMetric(key || 'eau'); setShowSheet(true) }

  const _urlP = new URLSearchParams(window.location.search).get('preset')
  const _h    = _urlP === 'sunrise' ? 7 : _urlP === 'day' ? 11 : _urlP === 'sunset' ? 19 : _urlP === 'night' ? 23 : new Date().getHours()
  const currentPreset = getOceanPreset(_h)

  // Remonte le preset actif vers App.jsx (pour colorer le logo)
  useEffect(() => { onPresetChange?.(currentPreset) }, [currentPreset])

  // Force body/html + fond fixe App en fond sombre en mode nuit
  useEffect(() => {
    if (currentPreset === 'night') {
      document.documentElement.style.backgroundColor = '#070f1e'
      document.body.style.backgroundColor            = '#070f1e'
      // Cible le fond animé fixe de App.jsx (position:fixed, z-index:0)
      document.querySelectorAll('div[style*="position: fixed"][style*="z-index: 0"]').forEach(el => {
        el.dataset.origBg = el.style.background
        el.style.background = '#070f1e'
      })
    }
    return () => {
      document.documentElement.style.backgroundColor = ''
      document.body.style.backgroundColor            = ''
      document.querySelectorAll('div[style*="position: fixed"][style*="z-index: 0"]').forEach(el => {
        if (el.dataset.origBg !== undefined) el.style.background = el.dataset.origBg
      })
    }
  }, [currentPreset])
  const skyBottomColor  = OCEAN_PRESETS[currentPreset].skyBottom
  // Nuit : gradient long + couleur de base sombre jusqu'en bas
  const skyBg = currentPreset === 'night'
    ? `linear-gradient(180deg, ${skyBottomColor} 0px, ${skyBottomColor} 462px, rgba(9,24,48,0.68) 560px, rgba(9,24,48,0.42) 800px, rgba(9,24,48,0.18) 1100px, rgba(9,24,48,0.10) 1400px)`
    : `linear-gradient(180deg, ${skyBottomColor} 0px, ${skyBottomColor} 460px, ${skyBottomColor}00 660px)`
  const nightBaseBg = currentPreset === 'night' ? '#070f1e' : 'transparent'
  const isNight = currentPreset === 'night'

  return (
    <div style={{ ...hc.page, backgroundColor: nightBaseBg, backgroundImage: skyBg }}>
      <NovaGlowScore
        score={score} scoreColor={scoreColor}
        profil={profil} metriques={metriques} onLog={handleLog}
      />
      <WeeklySparkline history={history} isNight={isNight} preset={currentPreset} />
      <DailyTasks profil={profil} metriques={metriques} onSwitchTab={onSwitchTab} isNight={isNight} preset={currentPreset} />
      <InsightsCarousel profil={profil} metriques={metriques} isNight={isNight}
        onChat={action => {
          if (action === 'herbal') { onSwitchTab('herbal'); return }
          if (action === 'sante')  { onSwitchTab('sante');  return }
          onSwitchTab('chat'); onChat(action)
        }}
      />
      <ContextualShortcuts profil={profil} metriques={metriques} onNavigate={onSwitchTab} isNight={isNight} score={score} />

      {/* Metric bottom sheet */}
      <AnimatePresence>
        {showSheet && (
          <MetricBottomSheet
            metriques={metriques}
            onUpdate={onUpdate}
            onClose={() => setShowSheet(false)}
            initialKey={initialMetric}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hc = {
  page: { display:'flex', flexDirection:'column', paddingBottom:120 },

  hero: { position:'relative', minHeight:360, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'flex-end', paddingBottom:18 },
  greetBadge: { display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)',
    borderRadius:20, padding:'6px 16px', fontSize:11, color:'rgba(200,123,82,0.72)', fontWeight:500,
    marginBottom:12, marginTop:32, letterSpacing:'0.3px',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  greetDot: { width:7, height:7, borderRadius:'50%', background:'#E8A07A',
    display:'inline-block', animation:'dotPulse 2s ease-in-out infinite',
    boxShadow:'0 0 6px rgba(232,160,122,0.7)' },
  greetName: { marginBottom:36, textAlign:'center' },
  greetNameAccent: { background:'linear-gradient(135deg,#C87B52,#E8A07A)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  circleWrap: { position:'relative', width:250, height:250,
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 },
  logBtn: {
    display:'flex', alignItems:'center', gap:8, padding:'14px 32px',
    background:'linear-gradient(145deg, #C87B52, #C87B52)',
    color:'#fff', border:'none', borderRadius:20, fontSize:13, fontWeight:500,
    cursor:'pointer', fontFamily:"'Poppins',system-ui,sans-serif",
    boxShadow:'0 12px 36px rgba(200,123,82,0.42), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)',
    transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' },

  strip: { display:'flex', gap:10, padding:'14px 18px' },
  stripItem: { flex:1, background:'#ffffff', border:'1px solid',
    borderRadius:20, padding:'12px 12px 10px', transition:'box-shadow 0.2s' },

  cardsWrap: { padding:'8px 18px 8px' },
  cardsHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  cardsTitle: { fontSize:11, fontWeight:600, color:'rgba(200,123,82,0.90)', letterSpacing:'0.08em',
    fontFamily:"'Poppins',system-ui,sans-serif", textTransform:'uppercase' },

  actionsWrap: { padding:'16px 18px 4px' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 },
}
