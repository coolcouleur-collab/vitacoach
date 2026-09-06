// ─── SOLENN, Sound FX (Web Audio API, zero fichier audio) ──────────────────
// Usage : import { playFx } from './sfx'
//         playFx('tap')      → clic léger UI
//         playFx('success')  → confirmation douce
//         playFx('hover')    → survol discret

import { Capacitor, registerPlugin } from '@capacitor/core'

// Sur iPhone, WebKit classe le Web Audio comme de la musique : le son au
// toucher jouait telephone en mode silencieux (Jean, 6 septembre 2026). Les
// memes sons, rendus en fichiers, sont joues par iOS en categorie ambiante,
// qui respecte le silencieux. Voir ios/App/App/SonInterfacePlugin.swift.
// Ne jamais `await` ce greffon : c'est un Proxy qui repond a « then ».
const SonInterface = registerPlugin('SonInterface')
const SUR_IPHONE = typeof window !== 'undefined'
  && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

let _ctx = null
function getCtx() {
  if (!_ctx || _ctx.state === 'closed') {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    _ctx = new AC()
  }
  return _ctx
}

// Re-resume quand l'app revient au premier plan (iOS Capacitor)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _ctx && _ctx.state !== 'running') {
      _ctx.resume().catch(() => {})
    }
  })
}

export async function playFx(type = 'tap') {
  if (SUR_IPHONE) {
    SonInterface.jouer({ nom: type }).catch(() => {})
    return
  }
  try {
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state !== 'running') await ctx.resume()
    const now = ctx.currentTime

    if (type === 'tap' || type === 'click') {
      // Cristal délicat, fondamentale + quinte, 55 ms
      const pairs = [[1760, 0.022], [2640, 0.013]]
      pairs.forEach(([freq, vol]) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'
        o.frequency.setValueAtTime(freq, now)
        g.gain.setValueAtTime(0.0, now)
        g.gain.linearRampToValueAtTime(vol, now + 0.003)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
        o.start(now); o.stop(now + 0.055)
      })

    } else if (type === 'success') {
      // Double note montante douce
      const freqs = [520, 780]
      freqs.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'
        const t = now + i * 0.10
        o.frequency.setValueAtTime(freq, t)
        o.frequency.exponentialRampToValueAtTime(freq * 1.04, t + 0.12)
        g.gain.setValueAtTime(0.0, t)
        g.gain.linearRampToValueAtTime(0.06, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
        o.start(t); o.stop(t + 0.15)
      })

    } else if (type === 'hover') {
      // Micro-bip quasi inaudible
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(1400, now)
      o.frequency.exponentialRampToValueAtTime(1800, now + 0.04)
      g.gain.setValueAtTime(0.018, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      o.start(now); o.stop(now + 0.04)

    } else if (type === 'back') {
      // Note descendante
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(480, now)
      o.frequency.exponentialRampToValueAtTime(260, now + 0.09)
      g.gain.setValueAtTime(0.055, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
      o.start(now); o.stop(now + 0.09)

    } else if (type === 'transition') {
      // Bruit bandpass + note montante (Landing slider)
      const bufSz = Math.floor(ctx.sampleRate * 0.22)
      const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < bufSz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSz)
      const noise = ctx.createBufferSource(); noise.buffer = buf
      const filt = ctx.createBiquadFilter()
      filt.type = 'bandpass'; filt.frequency.value = 600; filt.Q.value = 0.8
      const gn = ctx.createGain()
      gn.gain.setValueAtTime(0.12, now)
      gn.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      noise.connect(filt); filt.connect(gn); gn.connect(ctx.destination)
      noise.start(now); noise.stop(now + 0.22)
      const o2 = ctx.createOscillator(), g2 = ctx.createGain()
      o2.connect(g2); g2.connect(ctx.destination)
      o2.frequency.setValueAtTime(280, now)
      o2.frequency.exponentialRampToValueAtTime(560, now + 0.18)
      g2.gain.setValueAtTime(0.05, now)
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      o2.start(now); o2.stop(now + 0.18)
    }
  } catch (_) {}
}
