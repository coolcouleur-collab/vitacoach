import React, { useEffect, useRef } from 'react'

export default function SpiralBg({ style, light = false, duration = 15000, n = 1100, scale = 1 }) {
  const ref = useRef(null)
  const isVisibleRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    observer.observe(el.parentElement || el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let raf, W, H

    function resize() {
      const rect = cv.getBoundingClientRect()
      W = cv.width  = rect.width  || window.innerWidth
      H = cv.height = rect.height || window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const N    = n
    const REVS = 7
    const DUR  = duration

    function easeElastic(t) {
      if (t <= 0) return 0
      if (t >= 1) return 1
      const c4 = (2 * Math.PI) / 3
      return Math.pow(2, -8 * t) * Math.sin((8 * t - 0.75) * c4) + 1
    }
    function multiEase(t) {
      t = Math.max(0, Math.min(1, t))
      if (t < 0.30) return t
      if (t < 0.70) return 0.3 + (1 - Math.pow(1 - (t - 0.3) / 0.4, 2)) * 0.4
      return 0.7 + easeElastic((t - 0.7) / 0.3) * 0.3
    }

    const pts = Array.from({ length: N }, (_, i) => {
      const p = (i + 0.5) / N
      return {
        p,
        theta:  Math.PI * 2 * REVS * Math.sqrt(p) + (Math.random() - 0.5) * 0.30,
        bright: 0.35 + Math.random() * 0.65,
        phase:  Math.random(),
      }
    })

    let t0 = null

    function draw(ts) {
      raf = requestAnimationFrame(draw)
      if (!isVisibleRef.current) return
      if (!t0) t0 = ts
      const t = ((ts - t0) % DUR) / DUR

      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = light ? 0.10 : 0.07
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1

      const R = Math.min(W, H) * 0.42 * scale

      ctx.fillStyle = light ? 'rgba(210,140,60,1)' : 'rgba(195,105,35,1)'

      ctx.save()
      ctx.translate(W * 0.5, H * 0.52)
      ctx.rotate(t * Math.PI * 2)

      for (const p of pts) {
        const pt = (t + p.phase) % 1
        const et = multiEase(pt)
        const r  = R * Math.sqrt(p.p) * et
        const x  = Math.cos(p.theta) * r
        const y  = Math.sin(p.theta) * r
        const dist = p.p
        const sz = Math.max(0.15, p.bright * (1.8 - dist * 0.9))
        const al = Math.min(0.96, p.bright * (1.0 - dist * 0.55) * (0.25 + et * 0.75))
        ctx.beginPath()
        ctx.arc(x, y, sz, 0, Math.PI * 2)
        ctx.globalAlpha = light ? al * 0.10 : al * 0.18
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.restore()
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [light, duration, n, scale])

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}
