import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react'
import { scoreJour, atteint, formaterPas, CLES as CLES_SCORE, LIBELLES as LIBELLES_SCORE } from './score'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, AnimatePresence } from 'framer-motion'
import { WaterIcon, MoodIcon, HeartIcon, FlashIcon, FireIcon, DiamondIcon, LeafIcon, MeditateIcon, FoodIcon, MoonIcon, SunIcon, TargetIcon, ChatIcon, SparkleIcon, StarIcon, LightbulbIcon, BrainIcon, RunIcon, CalendarIcon, WalkIcon, MuscleIcon } from './Icons'
import CheckinCard from './CheckinCard'
import JourneePrete from './JourneePrete'
import { ENCRE, ICONE, VERT, AMBRE } from './palette'
import { programmeParId } from './programmes'

// ─── Icône vélo (inline, absente d'Icons.jsx) ───────────────────────────────
function BikeIcon({ color = 'var(--accent)', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="5.5" cy="17.5" r="3.5" stroke={color} strokeWidth="2"/>
      <circle cx="18.5" cy="17.5" r="3.5" stroke={color} strokeWidth="2"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Copie locale, évite d'importer SanteTab (JSX au niveau module → crash)
// Le score vient de score.js, source unique depuis le 2 septembre.
// Il en existait trois copies identiques a un espace pres.

// ─── SOLENN FACE (liquid morph, cohérent avec App.jsx) ──────────────────────
function SolennFace({ size = 34, isNight = false }) {
  return (
    <div className="liquid-avatar" style={{
      width: size, height: size,
      background: isNight ? 'transparent' : 'rgba(220,140,70,0.08)',
      border: isNight ? '1.5px solid rgba(162,192,248,0.55)' : '1.5px solid rgba(var(--rgb-terracotta), 0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      isolation: 'isolate',
      transform: 'translateZ(0)',
    }}>
      <span style={{
        fontSize: size * 0.44, fontWeight: 700,
        // Le jour, cette pastille etait du creme sur une carte creme : 1,33:1,
        // donc un « S » invisible. Le jumeau de App.jsx avait deja la bonne
        // paire, encre le jour et creme la nuit ; seule cette copie-ci etait
        // restee en arriere (mesure 2026-09-03).
        color: isNight ? 'rgba(220,235,255,0.92)' : ENCRE,
        fontFamily: "'Poppins',system-ui,sans-serif", lineHeight: 1,
        letterSpacing: '-0.02em', userSelect: 'none',
      }}>S</span>
    </div>
  )
}

// ─── NOVA GLOW, shader WebGL (Nova-Glow-lv7f), couleurs palette chaude ────────
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

  /* ── Palette dynamique, couleurs passées en uniforms ── */
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

      // couleurs via ref, toujours à jour même après HMR sans remount
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

// ─── NOVA GLASS ORB, glassmorphisme + glow border cursor (Framer Glow-Card) ───
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
        {/* ── Nova Glow, rendu au niveau circleWrap ── */}

        {/* Shine top, reflet verre */}
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

        {/* Liquid highlight, suit le curseur */}
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

        {/* ── Glow border (Framer Glow-Card), anneau lumineux qui suit le curseur ── */}
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

        {/* Bordure statique supprimée, soleil remplit l'espace */}
      </div>
    </div>
  )
}

// ─── PALETTE TEXTE NUIT / JOUR ────────────────────────────────────────────────
// Couleur unique des metriques : la meme dans l'orbite du soleil et dans la
// feuille de saisie. Les changer separement recree l'incoherence.
const ORBIT = ICONE   // etait var(--accent) a 2,39:1 ; seuil icone 3,0, desormais 3,86:1

const nightText  = (op) => `rgba(180,210,255,${op})`
// LE point unique ou se decide la couleur de TOUT le texte de l'accueil en
// mode jour : 25 appels via tc(). Verifie, elle ne sert qu'a `color`, jamais a
// un fond ni a une bordure.
//
// L'opacite recue est volontairement IGNOREE. rgba(200,123,82,·) plafonnait a
// 2,48 de contraste sur le fond de l'app, et a 3,23 meme sur du blanc : aucune
// opacite ne l'amenait au seuil de 4,5. #7B421C est la meme teinte, 24 degres
// contre 21, et c'est le PLUS CLAIR qui passe. Toute opacite inferieure a 1 le
// fait retomber sous le seuil, donc il n'y en a pas.
//
// La hierarchie ne passe donc plus par la transparence mais par la TAILLE et la
// GRAISSE, qui existaient deja. C'est aussi ce qui evite le defaut que Jean a
// vu le 2026-09-01 : deux couleurs de texte differentes sur le meme ecran.
//
// L'accent var(--accent) n'est pas abandonne : il garde les icones, les fonds, les
// bordures et le grand score, ou sa taille suffit au seuil de 3,0.
const warmText   = (op) => ENCRE
const sunsetText = (op) => `rgba(255,225,200,${op})`

// ─── OCEAN SCENE BACKGROUND ────────────────────────────────────────────────────
const OCEAN_PRESETS = {
  // sky covers the FULL hero height, no separate "water" block, no demarcation
  day: {
    // Bleu ADOUCI qui glisse vers l'abricot de l'app au lieu de s'arrêter net sur
    // du bleu clair : le Jour était la seule ambiance à introduire une couleur
    // froide saturée, et la rupture avec le fond doré se voyait (option B
    // choisie par Jean le 2026-08-08 parmi quatre maquettes).
    sky:          'linear-gradient(180deg,#7FB5D8 0%,#A8CFE4 38%,#CFE3E8 65%,#E6E0DC 82%,var(--fond) 100%)',
    sunMoonY:     'calc(100% - 157px)',
    bodyColor:    '#FFD900',
    bodyGlow:     'rgba(255,215,0,0.60)',
    bodyGlowFar:  'rgba(255,215,0,0.22)',
    bodySize:     92,
    isMoon:       false,
    cloudOp:      1,
    starOp:       0,
    reflectColor: 'rgba(255,220,60,0.35)',
    skyBiteColor: null,
    skyBottom:    'var(--fond)',   // raccord direct avec le fond de l'app
    ringColor1:   [1.0, 0.58, 0.20],   /* orange vif */
    ringColor2:   [1.0, 0.78, 0.38],   /* doré */
  },
  sunrise: {
    sky:          'linear-gradient(180deg,#1A1540 0%,#6B2C65 24%,#C85870 52%,#EE8858 76%,#F8C888 100%)',
    sunMoonY:     'calc(100% - 157px)',
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
    sunMoonY:     'calc(100% - 157px)',
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
    sunMoonY:     'calc(100% - 157px)',
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
      /* Fade bottom edge into the page, no hard cutoff */
      WebkitMaskImage:'linear-gradient(180deg, black 72%, transparent 100%)',
      maskImage:       'linear-gradient(180deg, black 72%, transparent 100%)',
    }}>

      {/* Sky, fills the entire hero, no separate ocean block */}
      <div style={{ position:'absolute', inset:0, background:p.sky }} />

      {/* Vignette top, assombrit le haut pour rendre le header lisible */}
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
          {/* Rim light, bord lumineux du croissant */}
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

      {/* Water-surface ripples, supprimées (trop visibles sur fond sombre) */}
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
// ─── LA BOUCLE DU CONSEIL ─────────────────────────────────────────
// Un coach humain propose un essai, puis revient avec le verdict. Aucune app
// ne le fait, parce qu'aucune n'accepte d'être jugée sur ses résultats.
// Quand Solenn constate qu'elle se répète depuis quatre jours, elle arrête de
// répéter : elle ouvre une observation de sept jours, se tait sur le sujet, et
// revient avec les deux moyennes. Réussite ou échec, elle le dit (2026-08-11).
// Tout est local : l'essai vit dans localStorage, rien ne part sur le réseau.
const DUREE_ESSAI = 7

function lireEssai() {
  try { return JSON.parse(localStorage.getItem('solenn_essai') || 'null') } catch { return null }
}

function moyenneMetrique(history, cle, depuis, jusqu) {
  const l = (history || [])
    .filter(e => e?.date && e[cle] > 0)
    .filter(e => {
      const t = new Date(e.date).getTime()
      return (depuis === null || t >= depuis) && (jusqu === null || t < jusqu)
    })
    .map(e => e[cle])
  return l.length ? { moy: l.reduce((a, b) => a + b, 0) / l.length, n: l.length } : { moy: 0, n: 0 }
}

const LIBELLE_ESSAI = {
  sommeil: { nom: 'ton sommeil', fmt: v => `${Math.floor(v)} h${Math.round((v % 1) * 60) >= 5 ? ' ' + String(Math.round((v % 1) * 60)).padStart(2, '0') : ''}` },
  eau:     { nom: 'ton hydratation', fmt: v => `${Math.round(v * 10) / 10} verres` },
  pas:     { nom: 'tes pas', fmt: v => formaterPas(v) },
  humeur:  { nom: 'ton humeur', fmt: v => `${Math.round(v * 10) / 10} sur 5` },
}

// Renvoie la phrase du verdict quand les sept jours sont écoulés, sinon null.
function verdictEssai(essai, history) {
  if (!essai) return null
  const jours = Math.floor((Date.now() - essai.debut) / 86400000)
  if (jours < DUREE_ESSAI) return null

  const L = LIBELLE_ESSAI[essai.cle]
  if (!L) return null
  const apres = moyenneMetrique(history, essai.cle, essai.debut, null)
  // Moins de trois jours renseignés : on ne conclut pas sur du vide, on prolonge.
  if (apres.n < 3) return null

  const delta = apres.moy - essai.avant
  const seuil = essai.cle === 'pas' ? 800 : essai.cle === 'eau' ? 0.8 : 0.4
  if (delta >= seuil) return {
    cle: null, ecart: 3.0, fini: true,
    quoi: `Sept jours plus tard : ${L.nom} est passé de ${L.fmt(essai.avant)} à ${L.fmt(apres.moy)}.`,
    action: 'Ça a marché. On garde ce réglage.',
  }
  return {
    cle: null, ecart: 3.0, fini: true,
    quoi: `Sept jours plus tard : ${L.nom} n'a pas bougé, ${L.fmt(essai.avant)} contre ${L.fmt(apres.moy)}.`,
    action: "Mon approche ne suffit pas. Raconte-moi ta journée type, on cherche ailleurs.",
  }
}

// ─── LE PONT ────────────────────────────────────────────────────
// Relie ce que l'utilisateur a RACONTÉ dans le chat à ce que ses chiffres ont
// fait depuis. C'est la seule chose qu'une app de suivi ne peut pas copier :
// elle mesure, mais elle ne t'a jamais écouté parler.
// Entièrement local et déterministe : les mémoires du chat portent déjà un
// `topic` et une date (voir sauverMemoire dans App.jsx), il suffit de les
// rapprocher de l'historique des métriques. Pas d'appel IA, pas de latence,
// rien qui quitte l'appareil.
const TOPIC_METRIQUE = {
  sommeil: { cle: 'sommeil', label: 'tes nuits',  monte: 'sont passées de', baisse: 'sont descendues de', seuil: 0.6,  fmt: v => `${Math.floor(v)} h${Math.round((v % 1) * 60) >= 5 ? ' ' + String(Math.round((v % 1) * 60)).padStart(2, '0') : ''}` },
  énergie: { cle: 'sommeil', label: 'tes nuits',  monte: 'sont passées de', baisse: 'sont descendues de', seuil: 0.6,  fmt: v => `${Math.floor(v)} h${Math.round((v % 1) * 60) >= 5 ? ' ' + String(Math.round((v % 1) * 60)).padStart(2, '0') : ''}` },
  humeur:  { cle: 'humeur',  label: 'ton humeur', monte: 'est passée de',   baisse: 'est descendue de',   seuil: 0.5,  fmt: v => `${Math.round(v * 10) / 10} sur 5` },
  stress:  { cle: 'humeur',  label: 'ton humeur', monte: 'est passée de',   baisse: 'est descendue de',   seuil: 0.5,  fmt: v => `${Math.round(v * 10) / 10} sur 5` },
  fitness: { cle: 'pas',     label: 'tes pas',    monte: 'sont passés de',  baisse: 'sont descendus de',  seuil: 1500, fmt: v => formaterPas(v) },
}

function pontMemoire(memories, history) {
  if (!memories?.length || !history?.length) return null
  const jours = t => Math.floor((Date.now() - t) / 86400000)

  for (const mem of memories) {
    const conf = TOPIC_METRIQUE[mem?.topic]
    if (!conf || !mem.ts) continue
    // Moins de 12 jours : trop tôt pour qu'un changement veuille dire quelque
    // chose. Plus de 90 : la conversation est trop loin pour être rappelée.
    const age = jours(mem.ts)
    if (age < 12 || age > 90) continue

    const avant = [], depuis = []
    for (const e of history) {
      const v = e?.[conf.cle]
      if (!(v > 0) || !e.date) continue
      ;(new Date(e.date).getTime() < mem.ts ? avant : depuis).push(v)
    }
    if (avant.length < 3 || depuis.length < 3) continue

    const mAvant  = avant.reduce((a, b) => a + b, 0) / avant.length
    const mDepuis = depuis.reduce((a, b) => a + b, 0) / depuis.length
    const delta = mDepuis - mAvant
    if (Math.abs(delta) < conf.seuil) continue

    return delta > 0
      ? {
          cle: null, ecart: 2.5,
          quoi: `Tu m'en avais parlé il y a ${age} jours. Depuis, ${conf.label} ${conf.monte} ${conf.fmt(mAvant)} à ${conf.fmt(mDepuis)}.`,
          action: "Ça, c'est toi qui l'as fait.",
        }
      : {
          cle: null, ecart: 2.4,
          quoi: `Tu m'en avais parlé il y a ${age} jours, et ${conf.label} ${conf.baisse} ${conf.fmt(mAvant)} à ${conf.fmt(mDepuis)}.`,
          action: 'On reprend ce sujet ensemble ?',
        }
  }
  return null
}

// ─── LA PHRASE DE SOLENN ──────────────────────────────────────────────────────
// L'accueil s'ouvrait sur un nombre dans un cercle avec le mot « score » écrit
// dessous : lisible, mais c'est un tableau de bord, pas un coach. On explique
// donc le chiffre et on donne UNE action.
// Calculée en local à partir des métriques du jour, pas par un appel à l'IA :
// instantanée, gratuite, et elle marche hors ligne. Même mécanique que
// « Solenn te demande » dans JourneePrete.
// Une seule idée par phrase : on ne cite QUE la métrique qui manque le plus,
// mesurée en écart relatif à son objectif pour pouvoir les comparer entre elles.
function phraseCoach({ score, metriques, streak = 0, heure, history = [], repetitions = {}, memories = [], essai = null, demandee = null }) {
  const m = metriques || {}
  const h = heure ?? new Date().getHours()

  // Les sept derniers jours renseignes, aujourd'hui exclu. C'est ce qui permet
  // de dire une chose qu'aucune autre app ne dit : non pas « tu as mal dormi »,
  // mais « c'est la troisieme fois cette semaine ». Le constat du jour, tout le
  // monde le fait ; le motif sur la duree, non (2026-08-11).
  const auj = new Date().toDateString()
  const semaine = (history || [])
    .filter(e => e && e.date && e.date !== auj)
    .slice(-7)
  const compte = (f) => semaine.filter(f).length

  // Moyenne d'une metrique sur une fenetre de jours, en ne comptant que les
  // jours renseignes : une moyenne qui inclut les zeros ferait passer un oubli
  // de saisie pour une regression.
  const moyenne = (cle, depuis, jusqu) => {
    const l = (history || []).slice(jusqu === 0 ? -depuis : -depuis, jusqu === 0 ? undefined : -jusqu)
      .map(e => e?.[cle]).filter(v => v > 0)
    return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0
  }
  const recent = moyenne('sommeil', 7, 0)
  const ancien = moyenne('sommeil', 21, 7)
  const heures = v => `${Math.floor(v)} h${Math.round((v % 1) * 60) >= 5 ? ' ' + String(Math.round((v % 1) * 60)).padStart(2, '0') : ''}`

  if (!score || (!m.sommeil && !m.eau && !m.pas && !m.humeur)) {
    return {
      cle: null,
      quoi: "Pas encore de score aujourd'hui.",
      action: h < 12
        ? "Dis-moi juste combien tu as dormi, je m'occupe du reste."
        : 'Dis-moi où tu en es, je te donne la suite.',
    }
  }

  // Le verdict passe avant tout : c'est un rendez-vous que Solenn a fixé.
  const verdict = verdictEssai(essai, history)
  if (verdict) return verdict

  // Pendant l'essai, elle se TAIT sur le sujet observé. Continuer à conseiller
  // pendant qu'on observe fausserait la mesure, et surtout trahirait la parole
  // donnée (« je te laisse tranquille sept jours »).
  const enCours = essai && Math.floor((Date.now() - essai.debut) / 86400000) < DUREE_ESSAI ? essai.cle : null

  const manques = [
    // ── Le pont ── priorité la plus haute : c'est la seule phrase que Solenn
    // est seule à pouvoir dire, parce qu'elle croise une conversation et des
    // mesures. Elle prime donc sur tous les constats.
    pontMemoire(memories, history),

    // ── Solenn revient sur ses propres conseils ──
    // Aucun coach numérique ne dit jamais « je t'ai conseillé ça, ça n'a rien
    // changé, on essaie autrement ». C'est pourtant le seul comportement qui
    // prouve qu'il accompagne au lieu de réciter. On compte combien de jours
    // distincts Solenn a déjà posé le même diagnostic (2026-08-11).
    m.sommeil > 0 && m.sommeil < 7 && (repetitions.sommeil || 0) >= 4 && !essai && {
      cle: 'sommeil', ecart: 2.1, ouvrirEssai: 'sommeil',
      quoi: `Ça fait ${repetitions.sommeil} jours que je te parle de ton sommeil et rien ne bouge.`,
      action: "Je change de méthode : j'arrête d'en parler et j'observe sept jours. Rendez-vous pour le verdict.",
    },
    (m.eau || 0) < 6 && h >= 12 && (repetitions.eau || 0) >= 4 && !essai && {
      cle: 'eau', ecart: 2.0, ouvrirEssai: 'eau',
      quoi: `${repetitions.eau} jours que je te rappelle de boire, et le compte ne monte pas.`,
      action: "Le rappel ne suffit pas. J'arrête d'insister et j'observe sept jours.",
    },

    // ── Progression mesurée sur trois semaines ──
    // La seule chose qu'une app de suivi ne dit jamais : ce qui a changé sur la
    // durée. On ne félicite que si la nuit du jour est bonne, sinon la phrase
    // sonnerait faux.
    recent > 0 && ancien > 0 && recent - ancien >= 0.7 && m.sommeil >= 7 && {
      cle: null, ecart: 1.9,
      quoi: `Tes nuits sont passées de ${heures(ancien)} à ${heures(recent)} en trois semaines.`,
      action: "Ça, c'est toi qui l'as fait. Ne lâche pas maintenant.",
    },

    // ── Motifs sur la semaine ── ecart majore : ils priment sur le constat du jour
    m.sommeil > 0 && m.sommeil < 7 && compte(e => e.sommeil > 0 && e.sommeil < 7) >= 2 && {
      cle: 'sommeil', ecart: 1.5,
      quoi: `${compte(e => e.sommeil > 0 && e.sommeil < 7) + 1}ᵉ nuit courte cette semaine, ${m.sommeil} h cette nuit.`,
      action: 'Le manque s\'accumule. Ce soir, couche-toi une demi-heure plus t\u00f4t.',
    },
    m.humeur > 0 && m.humeur < 3 && compte(e => e.humeur > 0 && e.humeur < 3) >= 2 && {
      cle: 'humeur', ecart: 1.4,
      quoi: `Ton humeur est basse pour la ${compte(e => e.humeur > 0 && e.humeur < 3) + 1}ᵉ fois cette semaine.`,
      action: 'Ce n\'est plus un mauvais jour, c\'est une tendance. On en parle ?',
    },
    semaine.length >= 3 && m.sommeil >= 7 && compte(e => e.sommeil >= 7) === 0 && {
      cle: 'sommeil', ecart: 1.3,
      quoi: `${m.sommeil} h cette nuit, ta meilleure de la semaine.`,
      action: 'C\'est exactement ce rythme qu\'il faut tenir.',
    },

    // ── Constats du jour ──
    // Le conseil suit l'ECART, il n'est plus le meme pour tout le monde.
    // « Vise 30 minutes de plus » a quelqu'un qui dort 4 h propose de passer a
    // 4 h 30 : la personne sait que ca ne repare rien, et un conseil qu'on sait
    // insuffisant fait douter de tous les autres. Sous 5 h 30, on nomme l'ecart
    // au lieu de proposer un pas derisoire.
    m.sommeil > 0 && m.sommeil < 7 && {
      cle: 'sommeil', ecart: (7 - m.sommeil) / 7,
      quoi: `Ton sommeil tire le reste vers le bas, ${m.sommeil} h cette nuit.`,
      action: m.sommeil < 5.5
        ? `Il te manque environ ${Math.round((7 - m.sommeil) * 10) / 10} h. Une nuit ne rattrape pas ça, mais deux couchers plus tôt cette semaine, oui.`
        : h < 18
          ? 'Vise 30 minutes de plus ce soir.'
          : 'Ce soir, écrans coupés 30 minutes plus tôt.',
    },
    m.humeur > 0 && m.humeur < 3 && {
      cle: 'humeur', ecart: (3 - m.humeur) / 3,
      quoi: `Ton humeur est basse aujourd'hui, ${m.humeur} sur 5.`,
      action: 'Trois minutes de respiration, ça change déjà quelque chose.',
    },
    (m.eau || 0) < 8 && h >= 12 && {
      cle: 'eau', ecart: (8 - (m.eau || 0)) / 8 * 0.8,
      quoi: `Il te manque surtout l'eau, ${m.eau || 0} verre${(m.eau || 0) > 1 ? 's' : ''} sur 8.`,
      action: 'Un verre maintenant, le retard se rattrape vite.',
    },
    (m.pas || 0) < 10000 && h >= 12 && h < 21 && {
      cle: 'pas', ecart: (10000 - (m.pas || 0)) / 10000 * 0.7,
      // Zero pas n'est pas « 0k pas » : c'est l'absence de depart, et la
      // phrase le dit avec des mots plutot qu'avec un chiffre absurde.
      quoi: (m.pas || 0) === 0
        ? "C'est le mouvement qui manque, tu n'as pas encore bougé aujourd'hui."
        : `C'est le mouvement qui manque, ${formaterPas(m.pas)} pas.`,
      action: '10 minutes de marche suffisent à débloquer le compteur.',
    },
  ].filter(Boolean)
    .filter(x => !enCours || x.cle !== enCours)
    // La carte « Solenn te demande » va poser la question sur cette
    // metrique : le verdict n'a pas a l'affirmer avant qu'on la connaisse.
    .filter(x => !demandee || x.cle !== demandee)
    .sort((a, b) => b.ecart - a.ecart)

  if (!manques.length) {
    // ⚠️ NE JAMAIS dire « tout est en place » sans regarder le score.
    // Les constats ci-dessus ne se declenchent que dans certains creneaux
    // horaires. Tot le matin, aucun ne s'applique, la liste est vide, et
    // l'ancienne version concluait « rien a corriger, profite » A COTE d'un
    // score de 28 sur 100. Jean l'a vu sur ses captures du 2026-09-01 : la
    // phrase decredibilise tout le reste, parce qu'elle contredit le chiffre
    // affiche juste au-dessus.
    // CE BLOC MENTAIT. Il annoncait « rien n'est encore mesure » des que le
    // score passait sous 50, sans jamais regarder ce qui etait mesure. Jean
    // l'a vu a 11h22 : sept heures de sommeil enregistrees, affichees dans
    // l'anneau avec leur coche verte, et juste en dessous « rien n'est encore
    // mesure » suivi de « renseigne ton sommeil ». On lui reclamait ce
    // qu'elle venait de donner.
    const CLES = ['sommeil', 'eau', 'pas', 'humeur']
    const LIB = { sommeil: 'ton sommeil', eau: 'ton eau', pas: 'tes pas', humeur: 'ton humeur' }
    const connues = CLES.filter(c => (m[c] || 0) > 0)

    if (!connues.length) {
      return {
        cle: null,
        quoi: 'La journée commence, rien n\'est encore mesuré.',
        action: 'Renseigne ton sommeil ou tes pas et je te dis où tu en es.',
      }
    }

    // Quelque chose est mesure, mais pas assez pour un chiffre. On le dit dans
    // ce sens la, et on nomme ce qui manque au lieu de reclamer en bloc.
    if (connues.length < 3) {
      const manquantes = CLES.filter(c => !connues.includes(c)).map(c => LIB[c])
      const liste = manquantes.length === 1
        ? manquantes[0]
        : manquantes.slice(0, -1).join(', ') + ' et ' + manquantes[manquantes.length - 1]
      return {
        cle: null,
        quoi: `${connues.length} mesure${connues.length > 1 ? 's' : ''} sur quatre pour aujourd'hui.`,
        action: `Il me manque ${liste} pour te donner un vrai chiffre.`,
      }
    }

    // Ici on SAIT que trois mesures au moins existent : la branche vide est
    // traitee plus haut. Dire « rien n'est encore mesure » a ce stade serait
    // le meme mensonge, deplace d'un cran.
    if ((score || 0) < 50) {
      return {
        cle: null,
        quoi: `Ton score est bas aujourd'hui, ${score} sur 100.`,
        action: 'Le sommeil et les pas sont ce qui le fait bouger le plus.',
      }
    }
    if ((score || 0) < 70) {
      return { cle: null, quoi: 'Ça tient, sans plus.', action: 'Un verre d\'eau ou dix minutes de marche feraient la différence.' }
    }
    return streak >= 3
      ? { cle: null, quoi: `${streak} jours de suite, tu es sur ta meilleure série.`, action: 'Garde ce rythme, il commence à payer.' }
      : { cle: null, quoi: 'Tout est en place aujourd\'hui.', action: 'Rien à corriger, profite.' }
  }
  return manques[0]
}

function NovaGlowScore({ score, scoreColor, profil, metriques, onLog, presetManuel = null, phrase, expliquerScore = false, streak = 0 }) {
  const [mounted, setMounted]           = useState(false)
  const [activeMetric, setActiveMetric] = useState(null)
  const [circleHovered, setCircleHovered] = useState(false)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  const _urlPreset = new URLSearchParams(window.location.search).get('preset')
  const hour   = _urlPreset === 'sunrise' ? 7 : _urlPreset === 'day' ? 11 : _urlPreset === 'sunset' ? 19 : _urlPreset === 'night' ? 23 : new Date().getHours()
  // Le choix fait dans Réglages prime sur l'heure. Sans ça, sélectionner
  // « Jour » ne changeait rien : l'ambiance était recalculée depuis l'horloge à
  // chaque rendu (bug signalé par Jean le 2026-08-08).
  const preset = presetManuel || getOceanPreset(hour)
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  const isNight = preset === 'night'
  // Les cinq icônes en orbite sont TOUTES de la même couleur : chaque métrique
  // se reconnaît à sa forme, pas à sa teinte. Avant, elles mélangeaient un bleu
  // ciel, un indigo, un rouge et un jaune Tailwind au milieu d'une palette
  // chaude (demande Jean 2026-08-08).
  const orbitC = isNight ? '#9FC4E8' : 'var(--accent)'
  // `atteint` vient de score.js : les seuils de la pastille et ceux du
  // score doivent bouger ensemble, et deux definitions ne le garantissent pas.
  const METRICS = [
    { iconEl:<WaterIcon size={22} color={orbitC} />, val:metriques?.eau,     color:orbitC, key:'eau', atteint:atteint('eau', metriques?.eau),     fmt: v => v+'v' },
    { iconEl:<RunIcon   size={22} color={orbitC} />, val:metriques?.pas,     color:orbitC, key:'pas', atteint:atteint('pas', metriques?.pas),     fmt: v => v>=1000 ? Math.round(v/1000)+'k' : v },
    { iconEl:<MoonIcon  size={22} color={orbitC} />, val:metriques?.sommeil, color:orbitC, key:'sommeil', atteint:atteint('sommeil', metriques?.sommeil), fmt: v => v+'h' },
    { iconEl:<MoodIcon  size={22} color={orbitC} />, val:metriques?.humeur,  color:orbitC, key:'humeur', atteint:atteint('humeur', metriques?.humeur),  fmt: v => v+'/5' },
    { iconEl:<HeartIcon size={22} color={orbitC} />, val:metriques?.fc,      color:orbitC, key:'fc', atteint:atteint('fc', metriques?.fc),      fmt: v => v },
  ]
  /**
   * Combien de metriques Solenn connait vraiment aujourd'hui.
   *
   * Les quatre que le score annonce mesurer, et pas la frequence cardiaque,
   * qui vient de Sante et que personne ne saisit a la main.
   */
  const connues = ['sommeil', 'eau', 'pas', 'humeur']
    .filter(c => (metriques?.[c] || 0) > 0)

  /**
   * En dessous de trois metriques, le chiffre ne veut pas dire ce qu'il a
   * l'air de vouloir dire.
   *
   * Avec le seul sommeil renseigne a 4 h, le calcul donne 5 sur 100, et
   * l'anneau affichait « 5 » comme un verdict de sante. Il signifiait surtout
   * « je ne sais rien des quatre autres ». Quelqu'un qui ouvre l'app le matin
   * et voit 5 se croit en tres mauvaise sante alors qu'il n'a rien saisi.
   *
   * L'app traitait deja le cas du zero par un tiret, exactement pour cette
   * raison. Un seul champ rempli retombait dans le meme piege.
   */
  const assezPourUnScore = connues.length >= 3
  const manquantes = ['sommeil', 'eau', 'pas', 'humeur']
    .filter(c => !connues.includes(c))
    .map(c => ({ sommeil: 'ton sommeil', eau: 'ton eau', pas: 'tes pas', humeur: 'ton humeur' })[c])

  const paused = circleHovered || !!activeMetric

  // ── Couleur de l'arc selon le score, identique à SanteTab ──
  // Le rouge du bas de l'echelle est parti le 2026-09-04. CheckinCard porte
  // le principe depuis le 8 aout : « Aucun rouge : dire qu'on va mal n'est
  // pas une faute, c'est une information, MEME PRINCIPE QUE LE SCORE ». Le
  // score s'en reclamait sans l'appliquer : en dessous de 40 il virait au
  // rouge d'alerte. On reprend la teinte basse des humeurs, celle que ce
  // principe a produit ailleurs, et qui suit les deux themes.
  const arcColor = score >= 80 ? 'rgba(34,197,94,0.28)' : score >= 60 ? 'rgba(56,189,248,0.28)' : score >= 40 ? 'rgba(245,158,11,0.28)' : score > 0 ? 'rgba(var(--rgb-humeur-1), 0.34)' : 'rgba(var(--rgb-terracotta), 0.25)'
  const arcTrack = score >= 80 ? 'rgba(34,197,94,0.05)' : score >= 60 ? 'rgba(56,189,248,0.05)' : score >= 40 ? 'rgba(245,158,11,0.05)' : score > 0 ? 'rgba(var(--rgb-humeur-1), 0.06)' : 'rgba(var(--rgb-terracotta), 0.05)'

  return (
    <>
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
          {/* ── Nova Glow canvas, 165px centré dans le circleWrap 250×250 ── */}
          <NovaGlowCanvas size={200} mouseRef={null} color1={OCEAN_PRESETS[preset].ringColor1} color2={OCEAN_PRESETS[preset].ringColor2} />

          {/* Hub 108×108 centré dans le container 250×250 */}
          <div style={{ position:'absolute', inset:0, margin:'auto', width:108, height:108 }}>
            <NovaOrb active={circleHovered || !!activeMetric} isNight={preset === 'night'} preset={preset} />
            {/* Night tint, orb becomes moon-like */}
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
              {/* Un tiret plutôt que rien quand le score est à zéro : c'est le plus
                  gros élément de l'écran, et à la première ouverture il était vide,
                  donc purement décoratif. Un tiret et non un 0 : « 0 » se lit comme
                  un mauvais résultat alors qu'il n'y a simplement pas encore de
                  donnée (2026-08-11). */}
              <span style={{ fontSize: score > 0 && assezPourUnScore ? 26 : 24, fontWeight:500, lineHeight:1,
                fontFamily:"'Poppins',system-ui,sans-serif",
                // Le repli etait un POINT MEDIAN, pas un tiret : quelques pixels
                // au centre d'un anneau de trois centimetres. Ni Jean ni moi ne
                // le distinguions sur les captures, et pour cause. Il ne disait
                // rien non plus : au centre d'un grand cercle, il ressemblait a
                // une panne.
                // « 1/4 » met une information la ou l'oeil attend un chiffre, et
                // repond a la question que le point posait sans y repondre.
                // L'opacite remonte donc : ce n'est plus une absence qu'on
                // attenue, c'est une mesure qu'on lit.
                opacity: score > 0 && assezPourUnScore ? 1 : 0.88,
                // MESURE : en rgba(180,210,255,0.90), ce chiffre affichait 1,07
                // a 1,43 pour 1 sur le disque, dont le degrade commence a
                // #F8FBFF. Le minimum est 3. C'etait du bleu clair sur du bleu
                // clair, et le plus gros element de l'ecran etait une tache.
                // La lune est CLAIRE : l'encre doit donc etre sombre, pas
                // claire. #22385E donne 11:1 au centre, sans quitter la nuit.
                color: preset === 'night' ? '#22385E' : 'rgba(var(--rgb-terracotta), 0.90)',
                // Un halo pale, la nuit seulement. La lune n'est pas d'une
                // seule teinte : elle porte un croissant d'ombre sur sa droite,
                // et le chiffre etant centre, sa moitie droite tombait dedans.
                // Verifie au zoom sur le site : le « 0/ » se lisait, le « 4 »
                // disparaissait. Le vrai score avait le meme defaut des qu'il
                // depassait un caractere.
                // Encre sombre pour la partie claire, halo clair pour la partie
                // sombre : le chiffre se detache des deux.
                textShadow: preset === 'night'
                  ? '0 0 5px rgba(248,251,255,0.92), 0 0 12px rgba(248,251,255,0.55)'
                  : 'none' }}>{score > 0 && assezPourUnScore ? score : `${connues.length}/4`}</span>
            </div>
          </div>

          {/* ── Arc de progression score, masqué ── */}
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
              // arcColor est deja un rgba() : lui coller « 88 » donnait du CSS invalide,
              // donc AUCUNE lueur. Le halo prend la meme teinte, plus dense.
              style={{ filter:`drop-shadow(0 0 6px ${arcColor.replace(/[\d.]+\)$/, '0.55)')})` }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: (score ?? 0) / 100 }}
              transition={{ duration: 1.5, delay: 0.4, type:'spring', stiffness:45, damping:18 }}
              transform="rotate(-90 170 170)"
            />
          </svg>

          {/* ── Ferris Wheel, orbit container (tourne, pass-through events) ── */}
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
                /* Counter-rotation, garde l'icône droite, re-active les events */
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

    {/* La phrase de Solenn, HORS du hero, voir le commentaire de hc.hero :
        à l'intérieur, elle décalait le cercle par rapport au soleil du décor. */}
    {(() => {
          const p = phrase
          // Meme calcul que JourneePrete : la carte questionne la premiere
          // metrique absente, dans cet ordre. Si le verdict parle de la meme,
          // sa ligne d'action est une redite.
          const manqueCarte = !metriques?.sommeil ? 'sommeil'
                            : !metriques?.eau     ? 'eau'
                            : !metriques?.pas     ? 'pas' : null
          const redite = p.cle && p.cle === manqueCarte
          return (
            <div style={{ maxWidth: 320, margin: '0 auto', textAlign: 'center', padding: '10px 22px 2px' }}>
              {/* La série n'apparaissait que dans la branche où tout va bien :
                  douze jours de suite avec quatre verres d'eau, et elle n'était
                  jamais mentionnée. C'est pourtant le jour où il faut la
                  rappeler pour éviter qu'elle se casse (2026-08-11). */}
              {streak > 1 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 11px', borderRadius: 20, marginBottom: 8,
                  background: isNight ? 'rgba(15,28,58,0.62)' : 'rgba(var(--rgb-bulle), 0.62)',
                  border: '1px solid rgba(var(--rgb-terracotta), 0.24)',
                  fontFamily: "'Poppins',system-ui,sans-serif",
                  fontSize: 10.5, fontWeight: 600,
                  color: isNight ? 'rgba(190,215,250,0.85)' : ENCRE,
                }}>
                  {streak >= 7
                    ? <FireIcon size={11} color={isNight ? 'rgba(190,215,250,0.85)' : 'rgba(var(--rgb-terracotta), 0.85)'} />
                    : <LeafIcon size={11} color={isNight ? 'rgba(190,215,250,0.85)' : 'rgba(var(--rgb-terracotta), 0.85)'} />}
                  {`${streak} jours d'affilée`}
                </div>
              )}
              <div style={{
                fontSize: 14.5, lineHeight: 1.45, fontWeight: 500,
                fontFamily: "'Poppins',system-ui,sans-serif",
                color: isNight ? 'rgba(200,222,255,0.92)' : ENCRE,
              }}>
                {p.quoi}
              </div>
              {!redite && (
              <div style={{
                fontSize: 12.5, lineHeight: 1.45, marginTop: 5,
                fontFamily: "'Poppins',system-ui,sans-serif",
                color: isNight ? 'rgba(180,205,240,0.66)' : ENCRE,
              }}>
                {p.action}
              </div>
              )}

              {/* Le chiffre est retenu : on dit pourquoi, et ce qui le
                  debloque. Sans cette ligne, le tiret ressemble a une panne
                  alors qu'il attend simplement deux saisies.
                  Elle ne s'affiche QUE si un verdict occupe les deux lignes du
                  dessus (`p.cle`). Sinon la phrase de repli nomme deja ce qui
                  manque, et cette ligne en formait une troisieme qui redisait
                  la deuxieme, en la contredisant parfois. */}
              {!assezPourUnScore && connues.length > 0 && p.cle && (
                // Cliquable, et pas seulement informative. Elle nommait ce qui
                // manque sans jamais dire OU le donner : un premier
                // utilisateur ne devine pas que les bulles autour de l'anneau
                // se touchent pour renseigner. Elle ouvre desormais la saisie
                // sur la premiere metrique absente, donc elle repond a la
                // question qu'elle pose.
                <div
                  onClick={() => onLog?.(CLES_SCORE.find(c => !connues.includes(c)))}
                  style={{
                  fontSize: 11.5, lineHeight: 1.45, marginTop: 9,
                  fontFamily: "'Poppins',system-ui,sans-serif",
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textDecorationColor: isNight ? 'rgba(180,205,240,0.35)' : 'rgba(148,77,38,0.35)',
                  textUnderlineOffset: 3,
                  color: isNight ? 'rgba(180,205,240,0.66)' : ENCRE,
                }}>
                  {(() => {
                    // La metrique dont le verdict vient de parler est ecartee.
                    // « C'est le mouvement qui manque » suivi de « il me manque
                    // tes pas » redemandait ce qui venait d'etre dit, deux
                    // lignes plus haut. L'app evitait deja cette redite dans
                    // l'autre sens, entre le verdict et la carte de question :
                    // c'est le meme mecanisme, etendu.
                    const restantes = manquantes.filter(m => m !== LIBELLES_SCORE[p.cle])
                    // Si le verdict couvre la SEULE metrique manquante, il n'y
                    // a plus rien a dire : la ligne disparait au lieu d'afficher
                    // « Il me manque  pour te donner un vrai chiffre. »
                    if (!restantes.length) return null
                    return restantes.length === 1
                      ? `Il me manque ${restantes[0]} pour te donner un vrai chiffre.`
                      : `Il me manque ${restantes.slice(0, -1).join(', ')} et ${restantes[restantes.length - 1]} pour te donner un vrai chiffre.`
                  })()}
                </div>
              )}

              {/* Le mot « score » n'était explicité nulle part. Affiché tant que
                  l'utilisateur n'a aucun historique, donc au tout début
                  seulement : ensuite la phrase ci-dessus explique le chiffre. */}
              {expliquerScore && (
                <div style={{
                  fontSize: 11, lineHeight: 1.45, marginTop: 9,
                  fontFamily: "'Poppins',system-ui,sans-serif",
                  color: isNight ? 'rgba(180,205,240,0.66)' : ENCRE,   // alignee sur la ligne du dessus, elle etait a 0,58
                }}>
                  Ton score se calcule sur ton sommeil, ton eau, tes pas et ton humeur.
                </div>
              )}
            </div>
          )
        })()}
  </>
  )
}

// ─── METRIC DOT, spring bounce + glow ring (gradient Framer button style) ────
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
          : 'rgba(var(--rgb-bulle), 0.42)',
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
      {/* La pastille disait « tu as renseigne cette metrique » et se lisait
          « c'est bien ». Elle apparaissait donc, coche verte comprise, a cote
          d'un « 4 h » que la phrase juste en dessous accusait de tirer tout le
          reste vers le bas : l'ecran felicitait une nuit de quatre heures.
          Elle porte desormais l'ETAT et non la simple presence : une coche
          quand la metrique est dans le vert, un point quand elle ne l'est pas.
          Renseigner reste visible, mais ne vaut plus approbation. */}
      {filled && (
        <div style={{
          position:'absolute', top:-5, right:-5, width:14, height:14, borderRadius:'50%',
          background: m.atteint === false ? 'rgba(120,140,175,0.85)' : m.color,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: m.atteint === false ? 'none' : `0 0 8px ${m.color}`,
          animation:'badgePop .3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <span style={{ fontSize:10, color:'#fff', fontWeight:500, lineHeight:1 }}>
            {m.atteint === false ? '·' : '✓'}
          </span>
        </div>
      )}
      <span style={{
        display:'flex', alignItems:'center', lineHeight:1,
        animation: springing ? 'iconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
      }}>{m.iconEl}</span>
      {filled && <span style={{ fontSize:10, color: isNight ? 'rgba(190,216,255,0.90)' : ENCRE, fontWeight:500, lineHeight:1 }}>{m.fmt(m.val)}</span>}
    </button>
  )
}

// ─── GLASSY BUTTON WRAP, GlassyButton (Framer) ──────────────────────────────
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
    // Toutes en terracotta. La feuille de saisie gardait un bleu ciel, un
    // violet et un jaune olive alors que les cinq icones en orbite autour du
    // soleil sont passees au terracotta le 2026-08-08 : on touchait une icone
    // terracotta et elle changeait de couleur en s'ouvrant. Chaque metrique se
    // reconnait a sa FORME, pas a sa teinte (constat Jean 2026-08-12).
    { key:'eau',     icon:<WaterIcon size={22} color={ORBIT} />, iconLg:<WaterIcon size={52} color={ORBIT} />, label:'Eau',     unit:'v',  min:0, max:20,    step:1,   color:ORBIT, fmt: v => Math.round(v) },
    { key:'pas',     icon:<RunIcon   size={22} color={ORBIT} />, iconLg:<RunIcon   size={52} color={ORBIT} />, label:'Pas',     unit:'',   min:0, max:25000, step:500, color:ORBIT, fmt: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v },
    { key:'sommeil', icon:<MoonIcon  size={22} color={ORBIT} />, iconLg:<MoonIcon  size={52} color={ORBIT} />, label:'Sommeil', unit:'h',  min:0, max:12,    step:0.5, color:ORBIT, fmt: v => Number(v).toFixed(1) },
    { key:'humeur',  icon:<MoodIcon  size={22} color={ORBIT} />, iconLg:<MoodIcon  size={52} color={ORBIT} />, label:'Humeur',  unit:'/5', min:1, max:5,     step:1,   color:ORBIT, fmt: v => v },
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
          background:'rgba(var(--rgb-surface-lin), 0.45)',
          backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
          borderRadius:'28px 28px 0 0',
          padding:'12px 24px 48px',
          // 118px, pas 48. La barre de navigation flotte a safe-area + 10px et
          // fait environ 62px de haut : 48 la laissait recouvrir les derniers
          // blocs de l'accueil, constate sur les captures iPhone de Jean
          // (2026-09-01). Meme valeur que les autres onglets, qui eux etaient
          // deja corrects.
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 118px)',
          boxShadow:'0 -10px 52px rgba(0,0,0,0.16)',
          border:'1.5px solid rgba(var(--rgb-terracotta), 0.16)',
          borderBottom:'none',
        }}
      >
        {/* Handle */}
        <div style={{ width:36, height:3, borderRadius:2,
          background:'rgba(var(--rgb-terracotta), 0.15)', margin:'0 auto 28px' }} />

        {/* Onglets, 4 icônes */}
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
                  // it.color vaut var(--icone) : la concatenation d'une transparence
                  // hexadecimale n'a jamais rien produit. Les icones n'avaient donc
                  // aucune lueur, ni active ni au repos.
                  filter: active
                    ? 'drop-shadow(0 0 7px rgba(var(--rgb-icone),0.80)) drop-shadow(0 0 18px rgba(var(--rgb-icone),0.33))'
                    : 'drop-shadow(0 0 4px rgba(var(--rgb-icone),0.27))',
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

        {/* Métrique active, icône grande + label + valeur */}
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
              // 99 en hexa vaut 60 % d'opacite : sur un fond clair, le libelle
              // etait quasi invisible, comme le bouton Sauvegarder en dessous.
              // Le nom de la metrique qu'on est en train de saisir doit se lire
              // sans effort (2026-08-12).
              fontSize:11, fontWeight:600, letterSpacing:'0.22em',
              textTransform:'uppercase', marginBottom:16,
              fontFamily:"'Poppins',system-ui,sans-serif",
              color:m.color,
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
          color:ENCRE, textTransform:'uppercase',
          cursor:'pointer', fontFamily:"'Poppins',system-ui,sans-serif",
          padding:'8px 24px',
          borderBottom:'1px solid rgba(var(--rgb-survol), 0.20)',
          transition:'border-color 0.2s ease, color 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.color='rgba(var(--rgb-survol), 1)'; e.currentTarget.style.borderBottomColor='rgba(var(--rgb-survol), 0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.color=ICONE; e.currentTarget.style.borderBottomColor='rgba(var(--rgb-survol), 0.35)' }}
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
        background: hovered ? 'rgba(var(--rgb-terracotta), 0.08)' : 'rgba(var(--rgb-verre), 0.18)',
        border:'1px solid rgba(var(--rgb-terracotta), 0.22)',
        fontFamily:"'Poppins',system-ui,sans-serif", fontSize:13, fontWeight:500,
        color: ENCRE,   // le survol se voit au fond de la carte, pas au texte
        boxShadow: hovered
          ? '0 8px 24px rgba(var(--rgb-terracotta), 0.18), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 4px 16px rgba(var(--rgb-terracotta), 0.10), 0 1px 4px rgba(0,0,0,0.05)',
        transition:'all 0.2s ease',
      }}
    >
      <HeartIcon size={14} color={hovered ? 'rgba(var(--rgb-terracotta), 0.90)' : 'rgba(var(--rgb-terracotta), 0.72)'} />
      <span>Mettre à jour mes métriques</span>
    </button>
  )
}

// ─── PILL BUTTON, GlassyButton style ────────────────────────────────────────
function MagneticGlowBtn({ label, iconEl, onClick }) {
  return (
    <GlassyButtonWrap
      background="var(--degrade-bouton)"
      hoverBackground="var(--degrade-bouton-survol)"
      borderRadius={24} blur={0} lightDirection="top-left"
      shadowHoverColor="rgba(var(--rgb-terracotta), 0.28)" shadowHoverIntensity={1.1}
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
        <span style={{ fontSize: 11, fontWeight: 800, color: ENCRE, letterSpacing: '0.2px' }}>{label}</span>
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
        /* Glow border couleur du sujet, statique + suit le curseur */
        background: glowing
          // Meme defaut : `color` vaut var(--icone), la bordure lumineuse de ces
          // anneaux n'existait tout simplement pas.
          ? `radial-gradient(circle 220px at ${glowPos.x}% ${glowPos.y}%, rgba(var(--rgb-icone),0.44), rgba(var(--rgb-icone),0.19) 42%, rgba(var(--rgb-icone),0.08) 68%)`
          : 'rgba(var(--rgb-icone),0.16)',
        animation:`tabFade 0.4s ease ${index * 0.08}s both`,
        transition: glowing
          ? 'background 0s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'
          : 'background 0.5s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        /* MagicBentoGrid 3D tilt */
        transform:`perspective(500px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle:'preserve-3d',
        willChange:'transform',
      }}>
      {/* Inner card, fond teinté couleur + transparent */}
      <div style={{
        background:'linear-gradient(145deg, rgba(var(--rgb-icone),0.03), rgba(var(--rgb-bulle), 0.72))',
        borderRadius:20, padding:'8px 4px 7px',
        boxShadow:'0 6px 20px rgba(var(--rgb-icone),0.09), inset 0 1px 0 rgba(255,255,255,0.65)',
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
              border:'2px solid rgba(var(--rgb-icone),0.25)',
              animation:'scoreGlow 2s ease-in-out infinite',
              pointerEvents:'none',
            }} />
          )}
        </div>
        <div style={{ fontSize:12, fontWeight:500, color: val > 0 ? color : 'rgba(var(--rgb-terracotta), 0.40)', lineHeight:1, letterSpacing:'-0.3px' }}>
          {val > 0 ? fmt(val) : '·'}
        </div>
        <div style={{ fontSize:10, color:ENCRE, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
      </div>
    </div>
  )
}

function MetricRings({ metriques }) {
  const items = [
    { iconEl:<WaterIcon size={17} color={ICONE} />, label:'Eau',     val:metriques?.eau||0,     goal:8,     color:ICONE, fmt: v => `${v}/8` },
    { iconEl:<RunIcon size={17} color={ICONE} />,   label:'Pas',     val:metriques?.pas||0,     goal:10000, color:ICONE, fmt: v => v>=1000 ? `${Math.round(v/1000)}k` : `${v}` },
    { iconEl:<MoonIcon size={17} color={ICONE} />,  label:'Sommeil', val:metriques?.sommeil||0, goal:8,     color:ICONE, fmt: v => `${v}h` },
    { iconEl:<MoodIcon size={17} color={ICONE} />,  label:'Humeur',  val:metriques?.humeur||0,  goal:5,     color:ICONE, fmt: v => `${v}/5` },
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
              <div style={{ fontSize:17, fontWeight:500, color:ENCRE, lineHeight:1, letterSpacing:'-0.5px' }}>
                {streak}<span style={{ fontSize:10, fontWeight:300, color:ENCRE, marginLeft:6 }}>jours</span>
              </div>
              <div style={{ fontSize:9, color:ENCRE, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:6 }}>
                {streak >= 7 ? 'En feu !' : streak > 1 ? `${streak} jours d'affilée` : 'À commencer'}
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
                <div style={{ fontSize:9, color:ENCRE, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>Niveau {level}</div>
                <div style={{ fontSize:16, fontWeight:500, color:ENCRE, lineHeight:1.1, letterSpacing:'-0.5px' }}>
                  {xp} <span style={{ fontSize:9, color:ENCRE, fontWeight:300 }}>XP</span>
                </div>
              </div>
              <div style={{
                width:28, height:28, borderRadius:9,
                background:'linear-gradient(135deg,#E8A04A,#8A5206)',   // medaille, dans l'ambre de la palette
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
                      ? 'linear-gradient(90deg,#E8A04A,#8A5206)'
                      : active ? 'rgba(217,119,6,0.28)' : 'rgba(217,119,6,0.10)',
                    boxShadow: filled ? '0 0 5px rgba(217,119,6,0.55)' : 'none',
                    transition:'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                    animation: active ? 'dotPulse 1.6s ease-in-out infinite' : 'none',
                  }} />
                )
              })}
            </div>
            <div style={{ fontSize:10, color:ENCRE, marginTop:3, fontWeight:500 }}>
              {100 - xpInLevel} XP pour le niveau {level + 1}
            </div>
          </div>
        </GlassyButtonWrap>
      </div>

    </div>
  )
}

// ─── DAILY TASK ITEM, même style que ContextualShortcuts ────────────────────
function DailyTaskItem({ t, i, onToggle, isNight = false, preset = 'day' }) {
  const tc = isNight ? nightText : warmText
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
            : t.Icon && <t.Icon size={17} color={t.color} />}
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
            stroke={t.isDone ? t.color : 'rgba(var(--rgb-tache), 0.50)'} strokeWidth="2.5"
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
      id:'eau', Icon: WaterIcon, color:ICONE,
      title:'Hydratation du jour',
      detail:'Objectif : 8 verres d\'eau',
      goal:8, auto:true, fmt: v => `${v}/8 verres`,
    },
    {
      id:'pas', Icon: WalkIcon, color:ICONE,
      title:'Marche active',
      detail:'10 000 pas pour activer ton métabolisme',
      goal:10000, auto:true, fmt: v => v>=1000 ? `${Math.round(v/1000)}k/10k pas` : `${v}/10k pas`,
    },
    h < 14 ? {
      id:'matin', Icon: SunIcon, color:ICONE,
      title:'Démarrage matinal',
      detail: profil?.reveil ? `Levé à ${profil.reveil}, 15 min de lumière naturelle` : '15 min de lumière naturelle ce matin',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    } : {
      id:'soir', Icon: MoonIcon, color:ICONE,
      title:'Prépare ton sommeil',
      detail: profil?.coucher ? `Écrans off 30 min avant ${profil.coucher}` : 'Écrans éteints 30 min avant dormir',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    },
    {
      id:'nutrition', Icon: FoodIcon, color: VERT,
      title: regime === 'végétarien' ? 'Protéines végétales' : regime === 'vegan' ? 'Équilibre vegan' : regime === 'sans gluten' ? 'Repas sans gluten' : 'Repas équilibrés',
      detail:'3 repas / légumes · protéines · glucides lents',
      goal:3, auto:false, fmt: v => `${v}/3 repas`,
    },
    {
      id:'sport', Icon: niveau==='avancé' ? MuscleIcon : niveau==='intermédiaire' ? BikeIcon : WalkIcon,
      color:ICONE,
      title: niveau==='avancé' ? 'Session entraînement' : niveau==='intermédiaire' ? 'Cardio 30 min' : 'Mouvement doux',
      detail: niveau==='avancé' ? '45-60 min d\'effort physique' : niveau==='intermédiaire' ? 'Cardio modéré + échauffement' : '20-30 min de stretching ou marche',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    },
    {
      id:'objectif', Icon: TargetIcon, color:ICONE,
      title: objectif || 'Ton objectif du jour',
      detail: objectif ? `Un pas de plus vers « ${objectif} »` : 'Avance d\'un pas vers ton grand objectif',
      goal:1, auto:false, fmt: v => v ? 'Accompli !' : 'En cours',
    },
    {
      id:'mental', Icon: MeditateIcon, color:ICONE,
      title:'Bien-être mental',
      detail:'5 min cohérence cardiaque ou journaling',
      goal:1, auto:false, fmt: v => v ? 'Fait !' : 'À faire',
    },
  ]
  return tasks
}

function DailyTasks({ profil, metriques, onSwitchTab, isNight = false, preset = 'day' }) {
  // Aligné sur les autres titres du HomeTab (2 variantes jour/nuit, la
  // variante sunset créait l'incohérence de couleurs signalée par Jean)
  const tc = isNight ? nightText : warmText
  const [done, setDone] = useState({})
  const [collapsed, setCollapsed] = useState(true)
  const tasks = useMemo(() => generateDailyTasks(profil, metriques), [profil?.nom, profil?.objectifs?.[0], profil?.niveau, profil?.regime, profil?.reveil, profil?.coucher])

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
            border: `1px solid ${'rgba(var(--rgb-terracotta), 0.12)'}`,
            cursor:'pointer', outline:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >
          <motion.svg
            width={11} height={11} viewBox="0 0 12 12"
            animate={{ rotate: collapsed ? 0 : 45 }}
            transition={{ type:'spring', stiffness:420, damping:26 }}
          >
            <line x1="6" y1="1" x2="6" y2="11" stroke={"rgba(var(--rgb-terracotta), 0.85)"} strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke={"rgba(var(--rgb-terracotta), 0.85)"} strokeWidth="1.6" strokeLinecap="round"/>
          </motion.svg>
        </motion.button>
      </div>

      {/* Progress bar */}
      <div style={{ position:'relative', height:3, borderRadius:8, background:'rgba(var(--rgb-terracotta), 0.10)', marginBottom: collapsed ? 0 : 14, overflow:'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, type:'spring', stiffness:55, damping:16 }}
          style={{
            height:'100%', borderRadius:8, position:'relative', overflow:'hidden',
            background:'linear-gradient(90deg,rgb(var(--rgb-creme-dore)),var(--or-plein),var(--accent),var(--accent))',
            boxShadow:'0 0 6px rgba(var(--rgb-terracotta), 0.45)',
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

// ─── CARROUSEL D'INSIGHTS, SUPPRIMÉ le 2026-08-11 ──────────────────────────
// Il mélangeait les observations réelles de Solenn avec des conseils horaires
// génériques qui répétaient « Pour toi maintenant » juste au-dessus : même
// découpage horaire, mêmes sujets, et « Prépare ton sommeil » comme la carte
// hydratation étaient identiques mot pour mot. Les observations ont été
// déplacées sous le graphe d'Évolution, auquel elles se rapportent.

// ─── LE DÉFI DU JOUR ─────────────────────────────────────────────
// Le défi 21 jours n'apparaissait NULLE PART sur l'accueil : quelqu'un au
// jour 9 de son programme ouvrait l'app sans le voir, alors que c'est ce qui
// doit le ramener chaque jour (constat 2026-08-11).
// Une seule ligne : le jour, l'action du jour, et la case à cocher. Le détail
// des séances reste dans Programme, on ne le duplique pas ici.
function DefiDuJour({ userId, isNight, onOuvrir }) {
  const tc = isNight ? nightText : warmText
  const [challenge, setChallenge] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const m = await import('./supabase')
        const res = await fetch(`/api/challenge?userId=${userId}`, { headers: await m.authHeaders() })
        const d = await res.json()
        if (d?.challenge) setChallenge(d.challenge)
      } catch {}
    })()
  }, [userId])

  if (!challenge) return null

  // Même calcul que dans Challenge21j : le jour découle de la date de début,
  // pas d'un compteur stocké, pour rester juste si l'app n'est pas ouverte.
  const debut = new Date(challenge.date_debut)
  // La duree vient du plan, comme dans l'ecran du programme. Les trois 21
  // ecrits en dur ici avaient survecu au passage au catalogue : un programme
  // de 42 jours se serait fige au jour 21, et la carte aurait affiche « jour
  // 30 sur 21 » avant de ne plus rien afficher du tout.
  const jours = challenge.challenge?.jours || []
  const duree = jours.length || challenge.duree || 21
  const jour = Math.min(Math.max(Math.floor((new Date() - debut) / 86400000) + 1, 1), duree)
  const progression = challenge.progression || Array(duree).fill(false)
  const fait = progression[jour - 1] || false
  const donnee = jours[jour - 1] || null
  if (!donnee) return null

  // Le titre ecrit a la main du catalogue plutot que celui invente par le
  // modele, qui produisait des « Equilibre Vital 21 Jours » ne parlant a
  // personne. Repli sur « Ton programme » pour les plans anterieurs.
  const titreProgramme = programmeParId(challenge.challenge?.type)?.titre || 'Ton programme'

  async function marquerFait(e) {
    e.stopPropagation()
    if (fait || envoi) return
    setEnvoi(true)
    // Coché tout de suite : attendre le serveur pour un geste aussi simple
    // donne l'impression que le bouton n'a pas répondu.
    setChallenge(c => {
      const p = [...(c.progression || Array(duree).fill(false))]
      p[jour - 1] = true
      return { ...c, progression: p }
    })
    try {
      const m = await import('./supabase')
      await fetch(`/api/challenge-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await m.authHeaders()) },
        body: JSON.stringify({ userId, jour: jour - 1, complete: true }),
      })
    } catch {}
    setEnvoi(false)
  }

  return (
    <div style={{ padding: '14px 18px 0' }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={onOuvrir}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 15px', borderRadius: 20, cursor: 'pointer',
          background: isNight
            ? 'linear-gradient(135deg, rgba(15,28,58,0.80) 0%, rgba(10,20,45,0.70) 100%)'
            : 'linear-gradient(135deg, rgba(var(--rgb-terracotta), 0.16) 0%, rgba(var(--rgb-terracotta), 0.06) 70%)',
          border: '1.5px solid rgba(var(--rgb-terracotta), 0.30)',
          boxShadow: isNight ? '0 6px 22px rgba(0,0,0,0.25)' : '0 6px 22px rgba(var(--rgb-terracotta), 0.14)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: tc(0.72), marginBottom: 3,
          }}>
            {/* Le nom du programme suivi, et non « Ton defi ». Le mot defi ne
                designe plus qu'un des quatre programmes du catalogue. */}
            {titreProgramme} · jour {jour} sur {duree}
          </div>
          <div style={{
            fontSize: 13.5, fontWeight: 500, color: tc(0.92), lineHeight: 1.35,
            textDecoration: fait ? 'line-through' : 'none', opacity: fait ? 0.6 : 1,
          }}>
            {donnee.action}
          </div>
          {/* Barre d'avancement : voir la progression compte autant que l'action */}
          <div style={{
            marginTop: 8, height: 3, borderRadius: 2, overflow: 'hidden',
            background: 'rgba(var(--rgb-terracotta), 0.14)',
          }}>
            <div style={{
              width: `${Math.round(progression.filter(Boolean).length / 21 * 100)}%`, height: '100%',
              borderRadius: 2, background: isNight ? 'rgba(159,196,232,0.75)' : 'rgba(var(--rgb-terracotta), 0.65)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
        <button
          onClick={marquerFait}
          aria-label={fait ? 'Fait' : 'Marquer comme fait'}
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0, cursor: fait ? 'default' : 'pointer',
            background: fait
              ? (isNight ? 'rgba(159,196,232,0.85)' : 'rgba(var(--rgb-terracotta), 0.85)')
              : (isNight ? 'rgba(10,20,45,0.50)' : 'rgba(var(--rgb-bulle), 0.60)'),
            border: '1.5px solid rgba(var(--rgb-terracotta), 0.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={fait ? (isNight ? '#0a142d' : '#fff') : ('rgba(var(--rgb-terracotta), 0.55)')}
            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </motion.div>
    </div>
  )
}

// ─── CONTEXTUAL SHORTCUTS ──────────────────────────────────────────────────────
// dejaDit : la métrique que la phrase de Solenn vient de nommer en haut de
// page. Sans ce filtre, l'accueil disait deux fois la même chose à quelques
// centimètres d'écart, « Il te manque surtout l'eau, 4 verres sur 8 » puis
// « Hydratation en retard · 4/8 verres » (2026-08-11).
function ContextualShortcuts({ profil, metriques, onNavigate, isNight = false, score = 0, dejaDit = null }) {
  const tc = isNight ? nightText : warmText
  // Le moment suit l'ambiance choisie dans Réglages, pas l'horloge : sans ça
  // l'app affichait « Nuit » et les suggestions du soir à 10 h du matin
  // (bug 2026-08-08). Une seule source de vérité pour le thème ET les cartes.
  // L'HEURE REELLE, toujours. Cette ligne deduisait autrefois une heure feinte
  // de l'ambiance choisie : ambiance nuit, donc « il est 23h ». Or le reglage
  // s'appelle « Ambiance de l'accueil » et ne propose que des couleurs. Jean a
  // donc eu, a 11h44, une section intitulee « Nuit » qui lui proposait de
  // preparer son sommeil, pendant que la carte deux blocs plus haut lui
  // demandait son eau « depuis ce matin » en lisant la vraie horloge. Deux
  // sources de verite sur le meme ecran, et elles se contredisaient.
  //
  // La regle, desormais : l'ambiance decide des COULEURS, l'heure decide du
  // CONTENU. Quelqu'un qui prefere un ecran sombre a midi ne demande pas qu'on
  // l'envoie se coucher.
  const h = new Date().getHours()

  const TC = isNight ? 'rgba(190,216,255,0.90)' : ICONE

  // Chaque carte porte une PRIORITÉ (petit = urgent) et la liste est triée
  // avant d'être coupée. Avant, elle était simplement coupée aux deux premières
  // dans l'ordre d'écriture : les cartes horaires venant en tête, « Hydratation
  // en retard » et « Objectif pas » ne pouvaient JAMAIS sortir entre 5 h et
  // 18 h, c'est-à-dire exactement la plage où le retard est rattrapable. Elles
  // n'apparaissaient que le soir, quand il est trop tard pour agir.
  // Style descend en dernier pour la même raison : à 23 h, « Style de demain »
  // passait avant « Prépare ton sommeil ». Il reste atteignable en permanence
  // dans « Tes outils » juste en dessous (corrigé 2026-08-11).
  const eau = metriques?.eau || 0
  const pas = metriques?.pas || 0

  const allSuggestions = [
    // Retards rattrapables. Le seuil dépend de l'heure : à 9 h, zéro verre
    // n'est pas un retard, c'est le début de la journée. On n'alerte donc qu'à
    // partir de midi, et on ne monte en tête qu'en fin d'après-midi, quand il
    // reste peu de temps pour rattraper. Borné à 22 h : conseiller de boire à
    // 2 h du matin dessert le sommeil.
    eau < 6 && h >= 12 && h < 22 && dejaDit !== 'eau' && { prio: (h >= 17 && eau < 4) ? 1 : 4,
      icon:<WaterIcon size={15} color={TC} />, label:'Pense à boire',           sub:`${eau} verre${eau > 1 ? 's' : ''} sur 8 aujourd'hui`, tab:'sante', color:TC },
    pas < 5000 && h >= 12 && h < 20 && dejaDit !== 'pas' && { prio: (h >= 16 && pas < 3000) ? 2 : 5,
      icon:<RunIcon size={15} color={TC} />,   label:'Bouger un peu plus',            sub:`${formaterPas(pas)} / 10k pas`, tab:'sante', color:TC },

    // Cartes du moment
    h >= 5  && h < 12 && { prio:3, icon:<SunIcon size={15} color={TC} />,   label:'Routine matinale',      sub:'Démarre bien ta journée',              tab:'routine', color:TC },
    h >= 5  && h < 12 && { prio:6, icon:<LeafIcon size={15} color={TC} />,  label:'Recette petit-déj',     sub:'Protéines + énergie durable',          tab:'herbal',  color:TC },
    h >= 12 && h < 18 && { prio:3, icon:<FoodIcon size={15} color={TC} />,  label:'Repas équilibré',       sub:'Légumes · protéines · glucides lents', tab:'herbal',  color:TC },
    h >= 12 && h < 18 && { prio:6, icon:<RunIcon size={15} color={TC} />,   label:"Boost de l'après-midi", sub:"10 min de marche = autant qu'un café", tab:'sante',   color:TC },
    h >= 18 && h < 22 && { prio:3, icon:<MoonIcon size={15} color={TC} />,  label:'Routine du soir',       sub:'Déconnecte et récupère',               tab:'routine', color:TC },
    // 22 h → 5 h : la nuit n'était couverte que jusqu'à minuit, il ne restait
    // plus rien à proposer entre 0 h et 5 h.
    (h >= 22 || h < 5) && { prio:2, icon:<MoonIcon size={15} color={TC} />,  label:'Prépare ton sommeil',   sub:'Écrans off · respiration · détente',   tab:'sante',   color:TC },

    // La carte Style a ete retiree le 2 septembre. Deux raisons.
    //
    // Elle etait le SEUL element de cette liste sans condition d'heure : elle
    // passait donc a n'importe quel moment, et son libelle testait `h < 12`.
    // Resultat sur la capture de Jean, a 1h49 : « Prepare ton sommeil » suivi
    // de « Style du jour ». L'une disait d'aller se coucher, l'autre de choisir
    // sa tenue.
    //
    // Et elle faisait doublon avec le bouton Style de « Tes outils », trois
    // centimetres plus bas. Un commentaire du 11 aout note qu'un doublon avait
    // deja ete corrige ici ; celui-la avait survecu.
    //
    // Elle servait de remplissage, pour que la section ne soit jamais vide.
    // Verifie avant de la retirer : les creneaux horaires des autres cartes
    // couvrent les 24 heures sans trou, 5-12, 12-18, 18-22 et 22-5. La section
    // garde donc toujours au moins une carte.
  ].filter(Boolean).sort((a, b) => a.prio - b.prio).slice(0, 3)

  return (
    <div style={{ padding:'14px 18px 0' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ ...hc.cardsTitle, color:tc(0.90) }}>Pour toi maintenant</span>
        <span style={{ fontSize:10, color:tc(0.72), fontWeight:300 }}>
          {/* Les bornes sont celles de l'anneau, et pas d'autres. A 1h49 du
              matin, cette etiquette annoncait « Matin » pendant que l'anneau
              juste au-dessus affichait sa lune : deux morceaux du meme ecran
              n'etaient pas d'accord sur l'heure qu'il etait. */}
          {h < 6 ? 'Nuit' : h < 12 ? 'Matin' : h < 18 ? 'Après-midi' : h < 21 ? 'Soirée' : 'Nuit'}
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
              // `${s.color}38` supposait un hexadecimal a six chiffres auquel on
              // ajoute une transparence. Depuis la passe de mode nuit, s.color
              // vaut rgba(190,216,255,0.90) la nuit et var(--icone) le jour :
              // les deux produisent du CSS invalide, verifie dans un navigateur.
              // Ces cartes n'avaient donc PLUS DE CONTOUR DU TOUT, dans les deux
              // themes, et la nuit leur fond est le meme navy que la page : il ne
              // restait que le texte (retour Jean 2026-09-03).
              background: isNight
                ? `linear-gradient(135deg, rgba(15,28,58,0.80) 0%, rgba(10,20,45,0.70) 100%)`
                : `linear-gradient(135deg, rgba(var(--rgb-terracotta),0.13) 0%, rgba(var(--rgb-terracotta),0.055) 60%, rgba(var(--rgb-terracotta),0.024) 100%)`,
              // Le lisere maison, celui de toutes les cartes de l'app :
              // rgba(--rgb-creme-dore). C'est clair sur clair de jour, donc
              // discret — 1,19:1 mesure — mais le terracotta est la couleur des
              // TEXTES, pas des bordures (Jean, 2026-09-04). Et pas d'ombre non
              // plus : elle detacherait la carte, au prix d'un relief que cette
              // interface n'utilise nulle part ailleurs.
              // Ce qui rend ces cartes lisibles n'est donc pas leur contour mais
              // leur fond, leur pastille d'icone et leur chevron. Le vrai defaut
              // corrige reste le meme : avant, la concatenation invalide leur
              // retirait TOUT a la fois, contour, fond et pastille.
              border: '1.5px solid var(--contour-carte)',
              boxShadow: isNight
                ? '0 6px 22px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(180,210,255,0.08)'
                : 'inset 0 1px 0 rgba(255,255,255,0.75)',
              transition:'box-shadow 0.2s ease',
            }}
          >
            <div style={{
              width:38, height:38, borderRadius:12, flexShrink:0,
              background: 'linear-gradient(135deg, rgba(var(--rgb-terracotta),0.21), rgba(var(--rgb-terracotta),0.125))',
              border: '1px solid rgba(var(--rgb-terracotta),0.27)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: '0 4px 12px rgba(var(--rgb-terracotta),0.19)',
            }}>
              {s.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:500, color:tc(0.90), lineHeight:1.2,
                fontFamily:"'Poppins',system-ui,sans-serif" }}>{s.label}</div>
              <div style={{ fontSize:11, color:tc(0.75), marginTop:3 }}>{s.sub}</div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke={TC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="arrow-anim"
              style={{ opacity:0.85, flexShrink:0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </motion.div>
        ))}
      </div>

      {/* ── Tes outils, accès permanent aux sections sorties de la barre ──
           Style, Respiration et Cycle ne sont plus des onglets : quatre onglets
           est le maximum lisible sur un téléphone. Cette rangée garantit qu'ils
           restent visibles et atteignables quelle que soit l'heure, contrairement
           aux cartes ci-dessus qui changent selon le moment de la journée. */}
      <div style={{ marginTop:18 }}>
        <span style={{ ...hc.cardsTitle, color:tc(0.90) }}>Tes outils</span>
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          {[
            { tab:'style',      label:'Style',       icon:<SparkleIcon  size={17} color={TC} /> },
            { tab:'breathwork', label:'Calme',       icon:<MeditateIcon size={17} color={TC} /> },
            // Beauté ouvre Santé Naturelle sur sa catégorie. Cette page n'avait
            // AUCUNE entrée permanente : elle n'était atteignable que par deux
            // cartes horaires de « Pour toi maintenant », donc invisible en
            // dehors de leurs créneaux (constat Jean 2026-08-11).
            { tab:'beaute',     label:'Naturel',     icon:<LeafIcon     size={17} color={TC} /> },
            // Le Cycle a quitte « Tes outils » le 2 septembre. Ce n'est pas un
            // outil : on n'ouvre pas le suivi de son cycle pour FAIRE quelque
            // chose, on l'ouvre pour consulter, exactement comme Progres. Il
            // etait range avec Style, Respiration et Soins, qui sont trois
            // choses qu'on ouvre pour agir.
            // Il vit desormais dans Progres, avec les autres suivis. Les
            // entrees du menu restent : ce n'est pas un rangement thematique,
            // c'est la navigation globale.
          ].map(o => (
            <motion.button
              key={o.tab}
              whileTap={{ scale:0.96 }}
              onClick={() => onNavigate(o.tab)}
              style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                padding:'13px 6px', borderRadius:18, cursor:'pointer',
                background: isNight ? 'rgba(15,28,58,0.70)' : 'rgba(var(--rgb-bulle), 0.62)',
                border: '1.5px solid rgba(var(--rgb-terracotta), 0.26)',
                fontFamily:"'Poppins',system-ui,sans-serif",
              }}
            >
              {o.icon}
              <span style={{ fontSize:11.5, fontWeight:500, color:tc(0.90) }}>{o.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── CTA Demander à Solenn, toujours en bas ── */}
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
            : 'linear-gradient(135deg, rgba(var(--rgb-terracotta), 0.18) 0%, rgba(var(--rgb-terracotta), 0.08) 60%, rgba(var(--rgb-terracotta), 0.05) 100%)',
          display:'flex', alignItems:'center', gap:13,
        }}
      >
        <SolennFace size={38} isNight={isNight} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:tc(0.90), lineHeight:1.2,
            fontFamily:"'Poppins',system-ui,sans-serif" }}>Demander à Solenn</div>
          <div style={{ fontSize:11, color:tc(0.75), marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Disponible · répond en quelques secondes</div>
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
          stroke={isNight ? 'rgba(200,220,255,0.65)' : 'rgba(var(--rgb-terracotta), 0.75)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="arrow-anim"
          style={{ flexShrink:0 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </motion.div>

      {/* La carte « Score bien-etre du jour » a ete retiree le 2 septembre.
          Elle affichait le MEME chiffre que l'anneau, six cents pixels plus
          bas, avec sa legende. Sur une page qu'on parcourt en dix secondes,
          le score apparaissait ainsi trois fois : l'anneau, cette carte, et
          le graphique d'evolution. Constat de Jean sur sa capture.
          Sa phrase de repli, « Chaque jour compte », part avec elle : elle
          ne disait rien, dans une app qui sait dire « c'est la troisieme
          fois cette semaine ». ── */}
    </div>
  )
}

// ─── 14-DAY SPARKLINE ─────────────────────────────────────────────────────────

// Le bloc porte aussi les observations personnelles de Solenn. Elles vivaient
// dans un carrousel séparé qui mélangeait ces patterns réels avec des conseils
// horaires génériques, lesquels répétaient mot pour mot « Pour toi maintenant »
// juste au-dessus (« Prépare ton sommeil », la carte hydratation, les 10 min de
// marche). Deux moteurs de suggestions en parallèle sur la même page. Le
// carrousel est supprimé, seules les observations survivent, ici, sous le
// graphe auquel elles se rapportent (décision Jean 2026-08-11).
export function WeeklySparkline({ history, isNight = false, preset = 'day', userId, avecObservations = true, onParler }) {
  const tc = isNight ? nightText : warmText

  const [observations, setObservations] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('solenn_insights_home') || '[]') } catch { return [] }
  })
  useEffect(() => {
    if (!userId || observations.length) return
    ;(async () => {
      try {
        const m = await import('./supabase')
        const res = await fetch(`/api/insights?userId=${userId}`, { headers: await m.authHeaders() })
        const d = await res.json()
        if (d?.insights?.length) {
          setObservations(d.insights)
          sessionStorage.setItem('solenn_insights_home', JSON.stringify(d.insights))
        }
      } catch {}
    })()
  }, [userId])
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
            // Verre ambré clair au lieu du bloc orange saturé (retour Jean 2026-07-25)
            : isNight ? 'rgba(100,150,255,0.10)' : preset === 'day' ? 'rgba(255,225,185,0.38)' : preset === 'sunset' ? 'rgba(245,190,140,0.32)' : 'rgba(255,235,205,0.32)',
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
                : "linear-gradient(145deg,rgba(var(--rgb-bulle), 0.46),rgba(var(--rgb-verre), 0.32))"}
          borderRadius={20} blur={10} lightDirection="top-left"
          shadowHoverColor={isNight ? "rgba(100,150,255,0.12)" : "rgba(217,119,6,0.14)"} shadowHoverIntensity={0.7}
          isHoverable={false} style={{ width:'100%' }}
        >
          <div style={{ padding:'12px 14px', position:'relative', zIndex:3 }}>
            {/* Opacites relevees le 3 septembre. Cette carte est posee sur un
                verre plus CLAIR que le fond de page : mesuree en ligne, elle
                ramenait ses petits libelles entre 3,24 et 4,04:1. Le probleme
                n'est pas la couleur du texte mais le fond sur lequel il se pose,
                et c'est l'opacite qui rattrape. */}
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:9, color:tc(0.92), fontWeight:500, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:3 }}>
                  Évolution · 14 jours
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                  <span style={{ fontSize:15, fontWeight:600, color:avg > 0 ? tc(0.90) : tc(0.82), letterSpacing: avg > 0 ? '-0.3px' : '0px', lineHeight:1 }}>
                    {avg > 0 ? avg : '·'}
                  </span>
                  {avg > 0 && <span style={{ fontSize:9, color:tc(0.75), fontWeight:400 }}>/100</span>}
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
                  ? s >= 70 ? 'linear-gradient(180deg,rgba(198,222,255,0.95),rgba(150,190,245,0.85))'
                  : s >= 40 ? 'linear-gradient(180deg,rgba(160,195,240,0.70),rgba(120,160,215,0.60))'
                  : s > 0   ? 'linear-gradient(180deg,rgba(120,150,200,0.45),rgba(90,120,170,0.38))' : null
                  : s >= 70 ? 'linear-gradient(180deg,var(--brun-moyen),var(--brun-fonce))'
                  : s >= 40 ? 'linear-gradient(180deg,var(--accent),#A06242)'
                  : s > 0   ? 'linear-gradient(180deg,#E4C0A9,#D2A183)' : null
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
                    // 0,55 donnait 3,9:1 sur la carte de nuit, pour du 7 px.
                    // 0,72 donne 5,6:1. Le jour n'est pas concerne : warmText
                    // renvoie ENCRE quelle que soit l'opacite qu'on lui passe.
                    color: isToday ? tc(0.92) : tc(isNight ? 0.72 : 0.80),
                    fontWeight: isToday ? 700 : 400,
                  }}>
                    {isToday ? '●' : i % 2 === 0 ? dayName : ''}
                  </div>
                )
              })}
            </div>

            {/* Ce que Solenn a remarqué sur ces 14 jours */}
            {/* Dans Progres, TesProgres affiche deja « Ce que Solenn a
                remarque » juste en dessous : les repeter ici mettrait deux fois
                la meme observation sur le meme ecran. */}
            {avecObservations && observations.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 11, borderTop: `1px solid ${isNight ? 'rgba(140,180,240,0.16)' : 'rgba(var(--rgb-terracotta), 0.16)'}` }}>
                <div style={{ fontSize:9, color:tc(0.80), fontWeight:500, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:7 }}>
                  Solenn a remarqué
                </div>
                {/* UNE seule ici, la liste complete vit dans Progres. Les trois
                    memes phrases s'affichaient sur les deux ecrans depuis que
                    les observations ont ete deplacees ce matin (2026-08-12). */}
                {observations.slice(0, 1).map((ins, i) => (
                  <div
                    key={i}
                    onClick={e => {
                      // Le bloc entier navigue vers Progrès : sans ça, toucher une
                      // observation ouvrirait la page au lieu d'en parler.
                      e.stopPropagation()
                      onParler?.(`Tu as remarqué que : « ${ins.insight} ». Dis-m'en plus, qu'est-ce que j'en fais ?`)
                    }}
                    style={{
                      display:'flex', alignItems:'flex-start', gap:8, cursor: onParler ? 'pointer' : 'default',
                      marginBottom: 0,
                    }}
                  >
                    <span style={{
                      width:4, height:4, borderRadius:'50%', flexShrink:0, marginTop:6,
                      background: isNight ? 'rgba(159,196,232,0.75)' : 'rgba(var(--rgb-terracotta), 0.65)',
                    }} />
                    <span style={{ fontSize:11.5, lineHeight:1.45, color:tc(0.82) }}>{ins.insight}</span>
                  </div>
                ))}
                {observations.length > 1 && (
                  <div style={{ fontSize:10.5, color:tc(0.62), marginTop:7 }}>
                    {observations.length - 1} autre{observations.length > 2 ? 's' : ''} dans Progrès
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassyButtonWrap>
      </div>
    </div>
  )
}

// ─── HOME TAB EXPORT ──────────────────────────────────────────────────────────
/**
 * L'HYDRATATION DU JOUR, sur l'accueil.
 *
 * Elle vivait dans Progres. Or noter un verre d'eau est un GESTE, et Progres
 * est un ecran de consultation : personne n'y va pour declarer qu'il a bu
 * (Jean, 2026-09-04). Le parcours etait meme circulaire, l'accueil disait
 * « pense a boire » et renvoyait vers Progres pour le noter.
 *
 * Le meme critere que la seance de respiration : un ecran montre ce qui sert
 * MAINTENANT. L'accueil agit, Progres constate.
 */
function BarreEau({ metriques, onUpdate }) {
  const bu = metriques?.eau || 0
  function ajouter() {
    onUpdate('eau', Math.min(bu + 1, 20))
    if (window?.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light })
      }).catch(() => {})
    }
  }
  return (
    <div style={{ padding: '0 18px', marginBottom: 14 }}>
      <div style={{
        background: 'rgba(var(--rgb-verre), 0.22)',
        border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderRadius: 20, padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: ENCRE, fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: 1, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <WaterIcon size={11} color={ICONE} />Hydratation du jour
          </div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 14, borderRadius: 7,
                background: i < bu
                  ? 'linear-gradient(180deg, rgba(var(--rgb-or), 0.9), rgba(var(--rgb-terracotta), 0.9))'
                  : 'rgba(var(--rgb-terracotta), 0.10)',
                border: i < bu ? 'none' : '1px solid rgba(var(--rgb-creme-dore), 0.28)',
                transition: 'background 0.3s ease',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: ENCRE, fontWeight: 800, letterSpacing: -0.3 }}>
            {bu}<span style={{ fontSize: 11, fontWeight: 500, color: ENCRE }}> / 8 verres d'eau</span>
          </div>
        </div>
        <button onClick={ajouter} style={{
          background: 'rgba(var(--rgb-verre), 0.32)',
          border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
          color: AMBRE, borderRadius: 50, padding: '10px 18px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'Poppins,sans-serif', flexShrink: 0, letterSpacing: 0.2,
        }}>
          +1 verre
        </button>
      </div>
    </div>
  )
}

export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onUpdate, onSwitchTab, onChat, streak = 0, xp = 0, level = 1, history = [], onPresetChange, presetManuel = null, userId }) {
  const [showSheet, setShowSheet] = useState(false)
  const [modeJournee, setModeJournee] = useState(null)
  // Calculée ici et non dans NovaGlowScore : les cartes du dessous doivent
  // savoir de quelle métrique Solenn vient de parler pour ne pas la répéter.
  // Journal local des diagnostics de Solenn : une entree par jour et par sujet.
  // Il sert uniquement a savoir si elle se repete, il ne quitte pas l'appareil.
  const repetitions = useMemo(() => {
    try {
      const j = JSON.parse(localStorage.getItem('solenn_diagnostics') || '{}')
      const limite = Date.now() - 10 * 86400000
      const r = {}
      for (const [cle, dates] of Object.entries(j))
        r[cle] = (dates || []).filter(t => t > limite).length
      return r
    } catch { return {} }
  }, [])

  // Les mémoires du chat, écrites par sauverMemoire dans App.jsx. Lues ici
  // pour que l'accueil puisse relier ce qui a été dit à ce qui a été mesuré.
  const memories = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('vitacoach_memories') || '[]') } catch { return [] }
  }, [])

  const [essai, setEssai] = useState(lireEssai)
  // Meme calcul que JourneePrete : la premiere metrique absente, dans cet ordre.
  const metriqueDemandee = !metriques?.sommeil ? 'sommeil'
                         : !metriques?.eau     ? 'eau'
                         : !metriques?.pas     ? 'pas' : null
  const phrase = phraseCoach({ score, metriques, streak, history, repetitions, memories, essai, demandee: metriqueDemandee })

  // Ouverture et clôture de l'essai. La moyenne d'AVANT est figée au moment de
  // l'ouverture : la recalculer au verdict laisserait les jours d'observation
  // contaminer la référence.
  useEffect(() => {
    if (phrase.ouvrirEssai && !essai) {
      const cle = phrase.ouvrirEssai
      const avant = moyenneMetrique(history, cle, Date.now() - 14 * 86400000, null)
      if (avant.n < 3) return
      const nouvel = { cle, debut: Date.now(), avant: avant.moy }
      try { localStorage.setItem('solenn_essai', JSON.stringify(nouvel)) } catch {}
      setEssai(nouvel)
    } else if (phrase.fini && essai) {
      try { localStorage.removeItem('solenn_essai') } catch {}
      setEssai(null)
    }
  }, [phrase.ouvrirEssai, phrase.fini])

  useEffect(() => {
    if (!phrase.cle) return
    try {
      const j = JSON.parse(localStorage.getItem('solenn_diagnostics') || '{}')
      const dates = j[phrase.cle] || []
      const auj = new Date().toDateString()
      // Une seule entree par jour, sinon un simple aller-retour sur l'accueil
      // ferait croire a Solenn qu'elle s'est repetee.
      if (dates.some(t => new Date(t).toDateString() === auj)) return
      j[phrase.cle] = [...dates, Date.now()].slice(-30)
      localStorage.setItem('solenn_diagnostics', JSON.stringify(j))
    } catch {}
  }, [phrase.cle])
  const [initialMetric, setInitialMetric] = useState('eau')

  function handleLog(key) { setInitialMetric(key || 'eau'); setShowSheet(true) }

  const _urlP = new URLSearchParams(window.location.search).get('preset')
  const _h    = _urlP === 'sunrise' ? 7 : _urlP === 'day' ? 11 : _urlP === 'sunset' ? 19 : _urlP === 'night' ? 23 : new Date().getHours()
  // Second calcul d'ambiance, celui de HomeTab lui-même : il doit respecter le
  // choix manuel exactement comme le composant interne, sinon il l'écrase.
  const currentPreset = presetManuel || getOceanPreset(_h)

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
    // Fondu vers TRANSPARENT : le ciel doit laisser réapparaître le halo doré
    // du calque global. En le faisant fondre vers var(--fond) opaque (ce que
    // j'avais fait le 2026-07-25 pour masquer la bande du bas), l'accueil
    // recouvrait entièrement ce halo d'un aplat abricot, d'où le fond « rose »
    // que Jean ne voyait QUE sur l'accueil, les autres pages restant dorées.
    // La bande du bas est réglée depuis par le verrouillage de body.
    : `linear-gradient(180deg, ${skyBottomColor} 0px, ${skyBottomColor} 540px, transparent 820px)`
  // transparent en journée pour la même raison : ne rien poser sur le halo
  const nightBaseBg = currentPreset === 'night' ? '#070f1e' : 'transparent'
  const isNight = currentPreset === 'night'

  return (
    <div style={{ ...hc.page, backgroundColor: nightBaseBg, backgroundImage: skyBg }}>
      <NovaGlowScore
        score={score} scoreColor={scoreColor}
        profil={profil} metriques={metriques} onLog={handleLog}
        presetManuel={presetManuel} phrase={phrase} streak={streak}
        expliquerScore={history.length === 0}
      />

      {/* Saisie explicite. NovaLogBtn existait dans le fichier mais n'était
          rendu NULLE PART : le seul moyen d'entrer une donnée était de toucher
          une des cinq icônes en orbite, sans libellé ni valeur tant qu'elles
          sont vides, donc introuvable à la première ouverture (2026-08-11).
          Rendu ICI et non dans le hero : le hero est aligné en bas et tout ce
          qu'on y ajoute décale le cercle par rapport au soleil du décor.
          Masqué quand Solenn pose déjà sa question juste en dessous, pour ne
          pas empiler deux invitations à saisir. */}
      {modeJournee !== 'question' && (
        <div style={{ display:'flex', justifyContent:'center', marginTop:2, marginBottom:6 }}>
          <NovaLogBtn onClick={() => handleLog('eau')} />
        </div>
      )}
      {/* Le défi passe AVANT le reste : c'est l'engagement pris, et la seule
          chose de l'accueil qui ait une échéance. */}
      <DefiDuJour userId={userId} isNight={isNight} onOuvrir={() => onSwitchTab('routine')} />

      {/* Ta journée est prête, adaptations du matin (agent morning-brief) */}
      <JourneePrete isNight={isNight} userId={userId} onOpenRoutine={() => onSwitchTab('routine')} metriques={metriques} onUpdate={onUpdate}
        onMode={setModeJournee} />

      {/* UNE SEULE demande de saisie à la fois. Quand Solenn pose sa question
          ci-dessus (métrique manquante), le check-in attend son tour : la page
          enchaînait sinon trois sollicitations d'affilée, ce qui donne
          l'impression d'un formulaire, pas d'un coach (2026-08-11). */}
      {modeJournee !== 'question' && (
        <CheckinCard userId={userId} onUpdate={onUpdate} isNight={isNight} preset={currentPreset} />
      )}

      {/* ORDRE : l'ACTION avant la DONNÉE. L'accueil ouvrait sur deux blocs de
          statistiques (Évolution, Insights) avant de proposer quoi que ce soit
          à faire, un tableau de bord, pas un coach. Les suggestions du moment
          remontent donc juste après le check-in ; l'historique et les analyses
          restent accessibles en dessous (refonte demandée par Jean 2026-08-08). */}
      <BarreEau metriques={metriques} onUpdate={onUpdate} />

      <ContextualShortcuts profil={profil} metriques={metriques} onNavigate={onSwitchTab} isNight={isNight} score={score} dejaDit={phrase.cle} />

      {/* Évolution = raccourci vers Progrès. Toujours affichée, même sans
          donnée : Jean la garde pour l'équilibre visuel de la page. Elle porte
          désormais aussi les observations de Solenn, le carrousel d'insights
          ayant été supprimé (il répétait « Pour toi maintenant »). */}
      {/* Le graphique d'evolution a ete deplace dans Progres le 2 septembre.
          Il repondait a « ou j'en suis ? » sur un ecran qui repond a « qu'est-ce
          que je fais aujourd'hui ? ». Le detail qui a emporte la decision : il
          etait deja cliquable et renvoyait vers Progres. C'etait un apercu qui
          pointait vers la page ou il aurait du vivre. */}

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

  // NE RIEN AJOUTER DANS CE BLOC. Son contenu est aligné en BAS et le soleil du
  // décor est ancré au bas du hero (sunMoonY: calc(100% - 157px)) : tout ce
  // qu'on glisse sous le cercle remonte le cercle SANS remonter le soleil, qui
  // se retrouve alors sous l'anneau au lieu d'être dedans. C'est ce qui est
  // arrivé le 2026-08-11 en plaçant la phrase de Solenn ici. Elle est
  // désormais rendue APRÈS le hero, hors de cette géométrie.
  // INVARIANT : paddingBottom + circleWrap.marginBottom + 125 doit TOUJOURS
  // valoir le nombre de sunMoonY (157 aujourd'hui), sinon le soleil sort de
  // l'anneau. Les deux se reglent ensemble, jamais l'un sans l'autre.
  hero: { position:'relative', minHeight:420, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'flex-end', paddingBottom:16 },
  greetBadge: { display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)',
    borderRadius:20, padding:'6px 16px', fontSize:11, color:ENCRE, fontWeight:500,
    marginBottom:12, marginTop:32, letterSpacing:'0.3px',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  greetDot: { width:7, height:7, borderRadius:'50%', background:'#E8A07A',
    display:'inline-block', animation:'dotPulse 2s ease-in-out infinite',
    boxShadow:'0 0 6px rgba(232,160,122,0.7)' },
  greetName: { marginBottom:36, textAlign:'center' },
  greetNameAccent: { background:'linear-gradient(135deg,var(--accent),var(--or-plein))',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  circleWrap: { position:'relative', width:250, height:250,
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  logBtn: {
    display:'flex', alignItems:'center', gap:8, padding:'14px 32px',
    background:'linear-gradient(145deg, var(--accent), var(--accent))',
    color:'#fff', border:'none', borderRadius:20, fontSize:13, fontWeight:500,
    cursor:'pointer', fontFamily:"'Poppins',system-ui,sans-serif",
    boxShadow:'0 12px 36px rgba(var(--rgb-terracotta), 0.42), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25)',
    transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' },

  strip: { display:'flex', gap:10, padding:'14px 18px' },
  stripItem: { flex:1, background:'rgb(var(--rgb-surface-blanche))', border:'1px solid',
    borderRadius:20, padding:'12px 12px 10px', transition:'box-shadow 0.2s' },

  cardsWrap: { padding:'8px 18px 8px' },
  cardsHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  cardsTitle: { fontSize:11, fontWeight:600, color:ENCRE, letterSpacing:'0.08em',
    fontFamily:"'Poppins',system-ui,sans-serif", textTransform:'uppercase' },

  actionsWrap: { padding:'16px 18px 4px' },
  actionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 },
}
