/**
 * LiquidImage.jsx
 * WebGL liquid-distortion component — inspired by Framer LiquidImage.
 *
 * Props:
 *   src        {string}   URL d'image (optionnel — si absent, gradient généré)
 *   gradient   {string[]} Tableau de couleurs CSS pour le dégradé (ex: ['#C87B52','#E8962A'])
 *   width      {number}   Résolution WebGL interne en px (défaut 512)
 *   height     {number}   Résolution WebGL interne en px (défaut 512)
 *   intensity  {number}   Force de la distorsion 0–2 (défaut 1.0)
 *   speed      {number}   Vitesse de l'animation 0–2 (défaut 1.0)
 *   style      {object}   Styles CSS sur le <canvas>
 *   className  {string}
 */
import { useEffect, useRef, useCallback } from 'react'

// ─── GLSL Vertex ──────────────────────────────────────────────────────────────
const VERT = `
  attribute vec2 a_pos;
  varying   vec2 v_uv;
  void main(){
    v_uv        = (a_pos + 1.0) * 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`

// ─── GLSL Fragment — gradient-noise liquid displacement ───────────────────────
const FRAG = `
  precision mediump float;

  uniform sampler2D u_tex;
  uniform float     u_time;
  uniform float     u_hover;     /* 0 → 1 smooth */
  uniform vec2      u_mouse;     /* normalised, Y-flipped */
  uniform float     u_intensity;
  varying vec2      v_uv;

  /* Gradient noise (Perlin-style) */
  vec2 hash2(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }
  float gnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i           ), f           ),
          dot(hash2(i+vec2(1,0) ), f-vec2(1,0) ), u.x),
      mix(dot(hash2(i+vec2(0,1) ), f-vec2(0,1) ),
          dot(hash2(i+vec2(1,1) ), f-vec2(1,1) ), u.x), u.y);
  }

  /* Layered noise for richer surface */
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 3; i++){
      v += a * gnoise(p);
      p *= 2.1;
      a *= 0.48;
    }
    return v;
  }

  void main(){
    float h = u_hover * u_intensity;

    /* Two independent noise layers → XY offset */
    float nx = fbm(v_uv * 2.8 + u_time * 0.13);
    float ny = fbm(v_uv * 2.5 - u_time * 0.11 + vec2(4.7, 1.9));

    /* Mouse proximity: extra ripple near cursor */
    float dist      = distance(v_uv, u_mouse);
    float proximity = (1.0 - smoothstep(0.0, 0.52, dist)) * h;

    vec2 off = vec2(nx, ny) * (h * 0.040 + proximity * 0.060);

    /* Edge-safe clamp */
    vec2 uv = clamp(v_uv + off, 0.002, 0.998);

    gl_FragColor = texture2D(u_tex, uv);
  }
`

// ─── WebGL helpers ────────────────────────────────────────────────────────────
function mkShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return s
}

function mkProgram(gl) {
  const p = gl.createProgram()
  gl.attachShader(p, mkShader(gl, gl.VERTEX_SHADER,   VERT))
  gl.attachShader(p, mkShader(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(p)
  return p
}

function applyTexParams(gl) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
}

/** Build a texture from a gradient painted on a 2D canvas */
function gradientTexture(gl, colors, w, h) {
  const c   = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')

  // Base diagonal gradient
  const g = ctx.createLinearGradient(0, 0, w, h)
  colors.forEach((col, i) => g.addColorStop(i / Math.max(colors.length - 1, 1), col))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Soft radial glow for depth
  const r = ctx.createRadialGradient(w * 0.38, h * 0.32, 0, w * 0.5, h * 0.5, w * 0.75)
  r.addColorStop(0,   'rgba(255,248,240,0.38)')
  r.addColorStop(0.5, 'rgba(255,220,170,0.14)')
  r.addColorStop(1,   'rgba(100,40,10,0.18)')
  ctx.fillStyle = r
  ctx.fillRect(0, 0, w, h)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
  applyTexParams(gl)
  return tex
}

/** Load an image URL → WebGL texture (async) */
function imageTexture(gl, src, onReady) {
  const img       = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE)
    onReady(tex)
  }
  img.src = src
}

// ─── Default gradient ─────────────────────────────────────────────────────────
const DEFAULT_GRADIENT = ['#C87B52', '#E8962A', '#F0C070', '#9E5C35', '#C87B52']

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiquidImage({
  src,
  gradient = DEFAULT_GRADIENT,
  width     = 512,
  height    = 512,
  intensity = 1.0,
  speed     = 1.0,
  style,
  className,
}) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ hover: 0, targetHover: 0, mouse: [0.5, 0.5], time: 0 })
  const glCtx     = useRef(null)
  const texRef    = useRef(null)
  const rafRef    = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl     = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return          // no WebGL — canvas stays blank; style a CSS fallback if needed
    glCtx.current = gl

    // ── Program + quad ──
    const prog = mkProgram(gl)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // ── Uniform locations ──
    const uTex  = gl.getUniformLocation(prog, 'u_tex')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uHov  = gl.getUniformLocation(prog, 'u_hover')
    const uMous = gl.getUniformLocation(prog, 'u_mouse')
    const uInt  = gl.getUniformLocation(prog, 'u_intensity')
    gl.uniform1i(uTex, 0)
    gl.uniform1f(uInt, intensity)

    // ── Texture ──
    function setTex(tex) {
      if (texRef.current && glCtx.current) gl.deleteTexture(texRef.current)
      texRef.current = tex
    }
    if (src)      imageTexture(gl, src, setTex)
    else          setTex(gradientTexture(gl, gradient, width, height))

    // ── Render loop — pausé quand le canvas est hors écran ou l'onglet caché
    // (double boucle WebGL avec GlobeBg = surchauffe GPU mobile)
    let last = 0
    let running = false
    let onScreen = true
    function frame(ts) {
      const dt = Math.min((ts - last) / 1000, 0.05)
      last = ts
      const s = stateRef.current
      s.time += dt * speed

      // Smooth hover lerp
      s.hover += (s.targetHover - s.hover) * Math.min(1, dt * 5.0)

      if (texRef.current) {
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texRef.current)
        gl.uniform1f(uTime, s.time)
        gl.uniform1f(uHov,  s.hover)
        gl.uniform2f(uMous, s.mouse[0], s.mouse[1])
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      rafRef.current = requestAnimationFrame(frame)
    }
    function start() {
      if (running) return
      running = true
      last = performance.now()
      rafRef.current = requestAnimationFrame(frame)
    }
    function stop() {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      onScreen && !document.hidden ? start() : stop()
    }, { threshold: 0.01 })
    io.observe(canvas)
    const onVis = () => { document.hidden ? stop() : (onScreen && start()) }
    document.addEventListener('visibilitychange', onVis)
    start()

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      stop()
      if (texRef.current) gl.deleteTexture(texRef.current)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      glCtx.current  = null
      texRef.current = null
    }
  }, [src, intensity, speed]) // gradient change not tracked (static after mount)

  const onMove = useCallback((e) => {
    const r = canvasRef.current.getBoundingClientRect()
    stateRef.current.mouse = [
      (e.clientX - r.left) / r.width,
      1 - (e.clientY - r.top) / r.height,   // flip Y → WebGL coords
    ]
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', ...style }}
      onMouseEnter={() => { stateRef.current.targetHover = 1 }}
      onMouseLeave={() => { stateRef.current.targetHover = 0 }}
      onMouseMove={onMove}
    />
  )
}
