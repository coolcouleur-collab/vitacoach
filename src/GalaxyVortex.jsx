/**
 * GalaxyVortex.jsx
 * WebGL spiral galaxy — additive glow particles, fully color-customisable.
 *
 * Props:
 *   particleCount  {number}    Total star count         (default 22000)
 *   speed          {number}    Rotation speed 0–2       (default 1.0)
 *   tilt           {number}    Camera tilt radians      (default 1.12 ≈ 64°)
 *   opacity        {number}    Canvas CSS opacity 0–1   (default 1.0)
 *   bgColor        {number[4]} RGBA clear color 0-1     (default [0,0,0,1] black)
 *                              pass [0,0,0,0] for transparent
 *   coreRGB        {number[3]} Hot-core color           (default white)
 *   armRGB         {number[3]} Inner arm color          (default blue)
 *   outerRGB       {number[3]} Outer / halo color       (default dark navy)
 *   style          {object}
 *   className      {string}
 */
import { useEffect, useRef, useCallback } from 'react'

// ─── GLSL ─────────────────────────────────────────────────────────────────────
const VERT = `
  precision highp float;

  attribute float a_r;
  attribute float a_t0;
  attribute float a_y;
  attribute vec3  a_col;
  attribute float a_sz;
  attribute float a_alpha;

  uniform float u_time;
  uniform float u_aspect;
  uniform float u_tilt;
  uniform vec2  u_mouse;

  varying vec3  v_col;
  varying float v_alpha;

  void main() {
    float omega = 0.28 / (a_r * 0.9 + 0.22);
    float theta = a_t0 + omega * u_time;

    float gx = a_r * cos(theta);
    float gz = a_r * sin(theta);
    float gy = a_y;

    gx += u_mouse.x * 0.22;
    gy += u_mouse.y * 0.12;

    float ct = cos(u_tilt), st = sin(u_tilt);
    float camY = gy * ct - gz * st;
    float camZ = gy * st + gz * ct + 4.2;

    float fov   = 1.55;
    float projX =  gx  / (camZ * fov * u_aspect);
    float projY = camY / (camZ * fov);

    float depthA = clamp(camZ * 0.65, 0.0, 1.0);
    v_col   = a_col;
    v_alpha = a_alpha * depthA;

    gl_Position  = vec4(projX, projY, 0.0, 1.0);
    gl_PointSize = clamp(a_sz * 2.8 / camZ, 0.4, 7.0);
  }
`

const FRAG = `
  precision mediump float;
  varying vec3  v_col;
  varying float v_alpha;
  void main() {
    vec2  c = gl_PointCoord - 0.5;
    float r = length(c) * 2.0;
    if (r > 1.0) discard;
    float a = exp(-r * r * 2.8) * v_alpha;
    gl_FragColor = vec4(v_col * a, a);
  }
`

// ─── Particle generation — receives color palette ─────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t }

function buildGalaxy(N, coreRGB, armRGB, outerRGB) {
  let seed = 137
  function rnd() {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  function rndN() {
    const u = Math.max(rnd(), 1e-9)
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
  }

  const N_BULGE = Math.floor(N * 0.22)
  const N_ARMS  = 2
  const N_EACH  = Math.floor(N * 0.62 / N_ARMS)
  const N_HALO  = N - N_BULGE - N_EACH * N_ARMS

  const aR = new Float32Array(N), aT0 = new Float32Array(N)
  const aY = new Float32Array(N), aCol = new Float32Array(N * 3)
  const aSz = new Float32Array(N), aAlpha = new Float32Array(N)

  // Unpack palette
  const [cr, cg, cb] = coreRGB
  const [ar, ag, ab] = armRGB
  const [or, og, ob] = outerRGB

  let i = 0

  /* ── Bulge ── */
  for (let b = 0; b < N_BULGE; b++, i++) {
    const rad = Math.pow(rnd(), 0.45) * 0.50
    aR[i]  = rad; aT0[i] = rnd() * Math.PI * 2
    aY[i]  = rndN() * 0.045 * (1 - rad / 0.50)
    const t = rad / 0.50
    // white-hot core → arm colour
    aCol[i*3]   = lerp(cr, ar, t)
    aCol[i*3+1] = lerp(cg, ag, t)
    aCol[i*3+2] = lerp(cb, ab, t)
    aSz[i]    = lerp(2.8, 1.3, t)
    aAlpha[i] = lerp(0.92, 0.62, t) * (0.55 + rnd() * 0.45)
  }

  /* ── Spiral arms ── */
  for (let arm = 0; arm < N_ARMS; arm++) {
    const armBase = (arm / N_ARMS) * Math.PI * 2
    for (let a = 0; a < N_EACH; a++, i++) {
      const rad    = 0.10 + Math.pow(rnd(), 0.72) * 2.30
      const wind   = rad * 1.85
      const spread = rndN() * (0.14 + rad * 0.08)
      aR[i]  = rad; aT0[i] = armBase + wind + spread
      aY[i]  = rndN() * 0.035 * (1 + rad * 0.40)
      const t = Math.min(rad / 1.8, 1.0)
      // arm colour → outer colour
      aCol[i*3]   = lerp(ar, or, t)
      aCol[i*3+1] = lerp(ag, og, t)
      aCol[i*3+2] = lerp(ab, ob, t)
      aSz[i]    = lerp(1.9, 0.7, t)
      aAlpha[i] = lerp(0.80, 0.28, t) * (0.35 + rnd() * 0.65)
    }
  }

  /* ── Halo ── */
  for (let h = 0; h < N_HALO; h++, i++) {
    const rad = 0.60 + rnd() * 2.60
    aR[i]  = rad; aT0[i] = rnd() * Math.PI * 2
    aY[i]  = rndN() * 0.10
    const br = 0.10 + rnd() * 0.20
    aCol[i*3]   = or * br * 2.2
    aCol[i*3+1] = og * br * 2.2
    aCol[i*3+2] = ob * br * 2.2
    aSz[i]    = 0.45 + rnd() * 0.70
    aAlpha[i] = 0.10 + rnd() * 0.22
  }

  return { aR, aT0, aY, aCol, aSz, aAlpha, count: i }
}

// ─── WebGL helpers ─────────────────────────────────────────────────────────────
function mkShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.warn('GalaxyVortex:', gl.getShaderInfoLog(s))
  return s
}
function mkBuf(gl, data) {
  const b = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, b)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  return b
}
function bindAttr(gl, prog, name, buf, size) {
  const loc = gl.getAttribLocation(prog, name)
  if (loc < 0) return
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
}

// ─── Default palettes ──────────────────────────────────────────────────────────
const PALETTE_BLUE = {
  coreRGB:  [0.96, 0.96, 1.00],
  armRGB:   [0.28, 0.50, 1.00],
  outerRGB: [0.04, 0.09, 0.55],
  bgColor:  [0, 0, 0, 1],
}

export const PALETTE_COPPER = {
  coreRGB:  [1.00, 0.96, 0.86],   /* warm white         */
  armRGB:   [0.88, 0.52, 0.22],   /* #C87B52 copper     */
  outerRGB: [0.45, 0.22, 0.08],   /* #7A3814 dark amber */
  bgColor:  [0, 0, 0, 0],         /* transparent        */
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function GalaxyVortex({
  particleCount = 22000,
  speed         = 1.0,
  tilt          = 1.12,
  opacity       = 1.0,
  bgColor,
  coreRGB,
  armRGB,
  outerRGB,
  style,
  className,
}) {
  // Resolve palette — explicit props override defaults
  const palette = bgColor ? { bgColor, coreRGB, armRGB, outerRGB }
                           : PALETTE_BLUE
  const resolvedBg    = bgColor    ?? palette.bgColor
  const resolvedCore  = coreRGB    ?? palette.coreRGB
  const resolvedArm   = armRGB     ?? palette.armRGB
  const resolvedOuter = outerRGB   ?? palette.outerRGB

  const canvasRef = useRef(null)
  const mouseRef  = useRef([0, 0])

  const onMove = useCallback((e) => {
    const c = canvasRef.current; if (!c) return
    const r = c.getBoundingClientRect()
    mouseRef.current = [
      (e.clientX - r.left) / r.width  - 0.5,
      (e.clientY - r.top)  / r.height - 0.5,
    ]
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return

    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = canvas.clientWidth  * dpr
      canvas.height = canvas.clientHeight * dpr
    })
    ro.observe(canvas)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = canvas.clientWidth  * dpr
    canvas.height = canvas.clientHeight * dpr

    const transparent = resolvedBg[3] === 0
    const gl = canvas.getContext('webgl', {
      alpha: transparent,
      antialias: false,
      premultipliedAlpha: false,
    })
    if (!gl) { ro.disconnect(); return }

    const prog = gl.createProgram()
    gl.attachShader(prog, mkShader(gl, gl.VERTEX_SHADER,   VERT))
    gl.attachShader(prog, mkShader(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog); gl.useProgram(prog)

    const { aR, aT0, aY, aCol, aSz, aAlpha, count } =
      buildGalaxy(particleCount, resolvedCore, resolvedArm, resolvedOuter)

    const bufR  = mkBuf(gl, aR),   bufT0 = mkBuf(gl, aT0)
    const bufY  = mkBuf(gl, aY),   bufCol = mkBuf(gl, aCol)
    const bufSz = mkBuf(gl, aSz),  bufAlpha = mkBuf(gl, aAlpha)

    bindAttr(gl, prog, 'a_r',     bufR,     1)
    bindAttr(gl, prog, 'a_t0',    bufT0,    1)
    bindAttr(gl, prog, 'a_y',     bufY,     1)
    bindAttr(gl, prog, 'a_col',   bufCol,   3)
    bindAttr(gl, prog, 'a_sz',    bufSz,    1)
    bindAttr(gl, prog, 'a_alpha', bufAlpha, 1)

    const uTime   = gl.getUniformLocation(prog, 'u_time')
    const uAspect = gl.getUniformLocation(prog, 'u_aspect')
    const uTilt   = gl.getUniformLocation(prog, 'u_tilt')
    const uMouse  = gl.getUniformLocation(prog, 'u_mouse')
    gl.uniform1f(uTilt, tilt)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)   /* additive = glow bloom */

    const [bgR, bgG, bgB, bgA] = resolvedBg
    let raf
    const t0 = performance.now()
    const mSmooth = [0, 0]

    function frame() {
      const t = (performance.now() - t0) / 1000 * speed
      const [mx, my] = mouseRef.current
      mSmooth[0] += (mx - mSmooth[0]) * 0.06
      mSmooth[1] += (my - mSmooth[1]) * 0.06

      const W = canvas.width, H = canvas.height
      gl.viewport(0, 0, W, H)
      gl.clearColor(bgR, bgG, bgB, bgA)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.uniform1f(uTime,   t)
      gl.uniform1f(uAspect, W / H)
      gl.uniform2f(uMouse,  mSmooth[0], mSmooth[1])
      gl.drawArrays(gl.POINTS, 0, count)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      ;[bufR, bufT0, bufY, bufCol, bufSz, bufAlpha].forEach(b => gl.deleteBuffer(b))
      gl.deleteProgram(prog)
    }
  }, [particleCount, speed, tilt,
      resolvedBg[0], resolvedBg[1], resolvedBg[2], resolvedBg[3],
      resolvedCore[0], resolvedArm[0], resolvedOuter[0]])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={() => { mouseRef.current = [0, 0] }}
      style={{ display: 'block', width: '100%', height: '100%', opacity, ...style }}
    />
  )
}
