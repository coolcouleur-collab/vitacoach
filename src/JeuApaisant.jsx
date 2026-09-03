// ─────────────────────────────────────────────────────────────────────────────
// LE JEU APAISANT
//
// Des bulles montent lentement, on les touche, elles éclatent.
//
// Ce qu'il n'y a PAS, et c'est le coeur du sujet : pas de score, pas de
// chronomètre, pas de niveau, pas d'échec possible, pas de « tu as raté ».
// Un jeu censé apaiser qui compte les points remet sous tension exactement la
// personne qu'il devait détendre, et une bulle manquée deviendrait une faute.
//
// Ce qui reste : un geste simple, une réponse immédiate, un rythme lent. On
// s'arrête quand on veut, il ne se passe rien.
//
// Tout est dessiné au canvas et sonné par l'API Web Audio : aucun fichier,
// donc aucune licence à surveiller et aucun téléchargement.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useEffect, useState } from 'react'
import { ENCRE, ICONE } from './palette'

const F = "'Poppins', system-ui, sans-serif"

const CARD = {
  background: 'rgba(var(--rgb-verre), 0.22)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
  borderRadius: 24,
  padding: '18px 20px',
}

/** Une note courte et douce à l'éclatement. Jamais deux fois la même hauteur. */
function ploc(ctx, hauteur) {
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  // Plus la bulle était haute sur l'écran, plus la note est aiguë : le son
  // suit le geste au lieu d'être plaqué dessus.
  o.frequency.setValueAtTime(320 + (1 - hauteur) * 420, t)
  o.frequency.exponentialRampToValueAtTime(180, t + 0.28)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.16, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
  o.connect(g).connect(ctx.destination)
  o.start(t); o.stop(t + 0.35)
}

export default function JeuApaisant() {
  const canvasRef = useRef(null)
  const bullesRef = useRef([])
  const rafRef    = useRef(null)
  const ctxAudio  = useRef(null)
  const [actif, setActif] = useState(false)
  const [son, setSon]     = useState(true)
  const [eclatees, setEclatees] = useState(0)

  // On garde `son` dans une ref : la boucle d'animation est montee une seule
  // fois, elle ne verrait jamais un changement d'etat autrement.
  const sonRef = useRef(son)
  useEffect(() => { sonRef.current = son }, [son])

  useEffect(() => {
    if (!actif) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const dimensionner = () => {
      const l = canvas.clientWidth, h = canvas.clientHeight
      canvas.width = l * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    dimensionner()
    window.addEventListener('resize', dimensionner)

    const naitre = () => {
      const l = canvas.clientWidth, h = canvas.clientHeight
      return {
        x: 20 + Math.random() * Math.max(1, l - 40),
        y: h + 30,
        r: 14 + Math.random() * 20,
        v: 0.22 + Math.random() * 0.35,          // lent, volontairement
        derive: (Math.random() - 0.5) * 0.22,
        teinte: 200 + Math.random() * 30,
        alpha: 0.30 + Math.random() * 0.35,
        eclat: 0,                                 // 0 = intacte, >0 = en train d'eclater
      }
    }
    bullesRef.current = Array.from({ length: 7 }, () => {
      const b = naitre()
      b.y = Math.random() * canvas.clientHeight
      return b
    })

    const dessiner = () => {
      const l = canvas.clientWidth, h = canvas.clientHeight
      ctx.clearRect(0, 0, l, h)

      for (const b of bullesRef.current) {
        if (b.eclat > 0) {
          // L'eclatement : un anneau qui s'ouvre et s'efface en une demi-seconde.
          b.eclat += 0.06
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.r * (1 + b.eclat * 1.6), 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${b.teinte}, 80%, 78%, ${Math.max(0, 0.5 - b.eclat * 0.5)})`
          ctx.lineWidth = 2
          ctx.stroke()
          continue
        }
        b.y -= b.v
        b.x += b.derive
        if (b.y < -40) Object.assign(b, naitre())

        const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r)
        g.addColorStop(0, `hsla(${b.teinte}, 90%, 88%, ${b.alpha + 0.2})`)
        g.addColorStop(1, `hsla(${b.teinte}, 80%, 70%, ${b.alpha * 0.35})`)
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.strokeStyle = `hsla(${b.teinte}, 85%, 85%, ${b.alpha * 0.7})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      // Les bulles eclatees depuis assez longtemps renaissent ailleurs.
      bullesRef.current = bullesRef.current.map(b => (b.eclat > 1 ? naitre() : b))
      rafRef.current = requestAnimationFrame(dessiner)
    }
    dessiner()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', dimensionner)
    }
  }, [actif])

  // Tout s'arrete quand l'ecran disparait.
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    if (ctxAudio.current) { try { ctxAudio.current.close() } catch (_) {} }
  }, [])

  const toucher = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const p = e.touches?.[0] || e
    const x = p.clientX - r.left, y = p.clientY - r.top

    for (const b of bullesRef.current) {
      if (b.eclat > 0) continue
      // Une zone un peu plus large que la bulle : viser juste ne doit pas etre
      // une epreuve, c'est le contraire du but.
      if (Math.hypot(b.x - x, b.y - y) < b.r + 12) {
        b.eclat = 0.01
        setEclatees(n => n + 1)
        if (sonRef.current) {
          if (!ctxAudio.current) {
            const AC = window.AudioContext || window.webkitAudioContext
            if (AC) ctxAudio.current = new AC()
          }
          if (ctxAudio.current) {
            if (ctxAudio.current.state === 'suspended') ctxAudio.current.resume()
            ploc(ctxAudio.current, b.y / Math.max(1, canvas.clientHeight))
          }
        }
        break
      }
    }
  }

  return (
    <div style={{ ...CARD, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, fontFamily: F, flex: 1 }}>
          Bulles
        </div>
        {actif && (
          <button
            onClick={() => setSon(s => !s)}
            style={{
              padding: '5px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: F,
              fontSize: 11, fontWeight: 600, color: ENCRE, background: 'transparent',
              border: '1px solid rgba(var(--rgb-creme-dore), 0.35)',
            }}>
            {son ? 'Son activé' : 'Son coupé'}
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: ENCRE, fontFamily: F, lineHeight: 1.5, marginBottom: 14 }}>
        Touche les bulles, elles éclatent. Rien à gagner, rien à rater, tu
        t'arrêtes quand tu veux.
      </div>

      {actif ? (
        <>
          <canvas
            ref={canvasRef}
            onPointerDown={toucher}
            style={{
              width: '100%', height: 280, display: 'block', borderRadius: 18,
              background: 'rgba(var(--rgb-verre), 0.18)',
              border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
              touchAction: 'none', cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 11.5, color: ENCRE, fontFamily: F, flex: 1 }}>
              {eclatees === 0 ? 'Prends ton temps.'
                : eclatees === 1 ? 'Une bulle.'
                : `${eclatees} bulles.`}
            </span>
            <button
              onClick={() => { setActif(false); setEclatees(0) }}
              style={{
                padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontFamily: F,
                fontSize: 12, fontWeight: 600, color: ENCRE, background: 'transparent',
                border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
              }}>
              Arrêter
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setActif(true)}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 15, cursor: 'pointer',
            fontFamily: F, fontSize: 14, fontWeight: 700, color: ENCRE,
            background: 'rgba(var(--rgb-verre), 0.32)',
            border: `1.5px solid ${ICONE}`,
          }}>
          Commencer
        </button>
      )}
    </div>
  )
}
