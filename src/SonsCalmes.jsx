// ─────────────────────────────────────────────────────────────────────────────
// LES SONS CALMANTS
//
// Pluie, vagues, vent, bol tibétain, souffle. Aucun fichier audio n'est
// téléchargé : tout est SYNTHÉTISÉ par le navigateur avec l'API Web Audio.
//
// Ce choix n'est pas technique, il est juridique et pratique.
//
// Juridique : une musique de méditation trouvée en ligne n'est presque jamais
// libre de droits pour un usage commercial, et une app payante sur les stores
// EST un usage commercial. Vérifier la licence de chaque piste, la conserver,
// la renouveler, c'est un travail permanent qu'un fichier synthétisé supprime.
//
// Pratique : rien à héberger, rien à télécharger, ça marche hors ligne, et un
// son généré ne boucle jamais de façon audible puisqu'il ne boucle pas.
//
// Ce que ça ne fait PAS : de la musique mélodique. Une nappe et de la pluie
// oui, une composition non. C'est une limite assumée, pas un oubli.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
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

/**
 * Un tampon de bruit blanc, la matière première de presque tout ce qui suit.
 * Deux secondes bouclées : assez long pour que l'oreille n'entende pas la
 * boucle, assez court pour ne pas immobiliser de la mémoire pour rien.
 */
function tamponBruit(ctx) {
  const n = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/**
 * Chaque ambiance est une recette : une source de bruit, un filtre qui lui
 * donne sa couleur, et une modulation lente qui l'empêche d'être plate.
 *
 * `demarrer` rend une fonction d'arrêt. Tout ce qu'elle a créé doit être
 * arrêté là : un oscillateur oublié continue de tourner après que l'écran a
 * disparu, et on ne le retrouve plus.
 */
const AMBIANCES = [
  {
    id: 'pluie',
    nom: 'Pluie',
    detail: 'Une pluie régulière, sans orage',
    demarrer: (ctx, sortie) => {
      const src = ctx.createBufferSource()
      src.buffer = tamponBruit(ctx)
      src.loop = true

      // Passe-bas : le bruit blanc brut siffle, la pluie est plus sourde.
      const filtre = ctx.createBiquadFilter()
      filtre.type = 'lowpass'
      filtre.frequency.value = 1400
      filtre.Q.value = 0.6

      // Une averse n'a pas une intensité constante : on la fait respirer.
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.07
      const profondeur = ctx.createGain()
      profondeur.gain.value = 260
      lfo.connect(profondeur).connect(filtre.frequency)

      src.connect(filtre).connect(sortie)
      src.start(); lfo.start()
      return () => { try { src.stop(); lfo.stop() } catch (_) {} }
    },
  },
  {
    id: 'vagues',
    nom: 'Vagues',
    detail: 'Le ressac, lent et régulier',
    demarrer: (ctx, sortie) => {
      const src = ctx.createBufferSource()
      src.buffer = tamponBruit(ctx)
      src.loop = true

      const filtre = ctx.createBiquadFilter()
      filtre.type = 'lowpass'
      filtre.frequency.value = 700

      // Le ressac, c'est un volume qui monte et descend sur huit secondes.
      const volume = ctx.createGain()
      volume.gain.value = 0.5
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.12
      const profondeur = ctx.createGain()
      profondeur.gain.value = 0.42
      lfo.connect(profondeur).connect(volume.gain)

      src.connect(filtre).connect(volume).connect(sortie)
      src.start(); lfo.start()
      return () => { try { src.stop(); lfo.stop() } catch (_) {} }
    },
  },
  {
    id: 'vent',
    nom: 'Vent',
    detail: 'Un souffle dans les arbres',
    demarrer: (ctx, sortie) => {
      const src = ctx.createBufferSource()
      src.buffer = tamponBruit(ctx)
      src.loop = true

      // Passe-bande : le vent est plus étroit que la pluie, il siffle un peu.
      const filtre = ctx.createBiquadFilter()
      filtre.type = 'bandpass'
      filtre.frequency.value = 520
      filtre.Q.value = 1.4

      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.05
      const profondeur = ctx.createGain()
      profondeur.gain.value = 320
      lfo.connect(profondeur).connect(filtre.frequency)

      src.connect(filtre).connect(sortie)
      src.start(); lfo.start()
      return () => { try { src.stop(); lfo.stop() } catch (_) {} }
    },
  },
  {
    id: 'nappe',
    nom: 'Nappe',
    detail: 'Une tenue grave, pour méditer',
    demarrer: (ctx, sortie) => {
      // Trois sinus très proches. Leurs écarts créent un battement lent, ce
      // qui donne une tenue vivante là où une seule note serait figée.
      const freqs = [110, 110.4, 165]
      const noeuds = freqs.map((f, i) => {
        const o = ctx.createOscillator()
        o.type = 'sine'
        o.frequency.value = f
        const g = ctx.createGain()
        g.gain.value = i === 2 ? 0.10 : 0.18
        o.connect(g).connect(sortie)
        o.start()
        return o
      })
      return () => noeuds.forEach(o => { try { o.stop() } catch (_) {} })
    },
  },
  {
    id: 'bol',
    nom: 'Bol tibétain',
    detail: 'Une frappe toutes les vingt secondes',
    demarrer: (ctx, sortie) => {
      let vivant = true
      const frapper = () => {
        if (!vivant) return
        const t = ctx.currentTime
        // Un bol n'est pas une note : c'est une fondamentale et ses partiels
        // inharmoniques, qui s'éteignent à des vitesses différentes.
        ;[196, 293, 445, 610].forEach((f, i) => {
          const o = ctx.createOscillator()
          o.type = 'sine'
          o.frequency.value = f
          const g = ctx.createGain()
          const pic = 0.22 / (i + 1)
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(pic, t + 0.02)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 9 - i * 1.6)
          o.connect(g).connect(sortie)
          o.start(t)
          o.stop(t + 10)
        })
      }
      frapper()
      const boucle = setInterval(frapper, 20000)
      return () => { vivant = false; clearInterval(boucle) }
    },
  },
]

const MINUTEURS = [
  { id: 0,  label: 'Sans fin' },
  { id: 5,  label: '5 min' },
  { id: 10, label: '10 min' },
  { id: 20, label: '20 min' },
]

export default function SonsCalmes() {
  const [actif, setActif]       = useState(null)   // id de l'ambiance en cours
  const [volume, setVolume]     = useState(0.5)
  const [minutes, setMinutes]   = useState(0)
  const [restant, setRestant]   = useState(0)

  const ctxRef    = useRef(null)
  const gainRef   = useRef(null)
  const arretRef  = useRef(null)
  const finRef    = useRef(null)

  const stopper = React.useCallback(() => {
    if (arretRef.current) { arretRef.current(); arretRef.current = null }
    if (finRef.current) { clearTimeout(finRef.current); finRef.current = null }
    setActif(null)
    setRestant(0)
  }, [])

  // Tout s'arrete quand l'ecran disparait. Sans ca, le son continue derriere
  // une autre page de l'app, et on ne sait plus d'ou il vient.
  useEffect(() => () => {
    if (arretRef.current) arretRef.current()
    if (finRef.current) clearTimeout(finRef.current)
    if (ctxRef.current) { try { ctxRef.current.close() } catch (_) {} }
  }, [])

  useEffect(() => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.05)
    }
  }, [volume])

  // Le decompte du minuteur.
  useEffect(() => {
    if (!actif || !restant) return
    const t = setInterval(() => setRestant(r => (r > 1 ? r - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [actif, restant])

  const jouer = (amb) => {
    if (actif === amb.id) { stopper(); return }
    if (arretRef.current) { arretRef.current(); arretRef.current = null }

    // Le contexte audio ne peut naitre que d'un geste de l'utilisateur : les
    // navigateurs refusent le son automatique, et ils ont raison.
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      ctxRef.current = new AC()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = volume
      gainRef.current.connect(ctxRef.current.destination)
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()

    arretRef.current = amb.demarrer(ctxRef.current, gainRef.current)
    setActif(amb.id)

    if (finRef.current) clearTimeout(finRef.current)
    if (minutes > 0) {
      setRestant(minutes * 60)
      finRef.current = setTimeout(stopper, minutes * 60000)
    } else {
      setRestant(0)
    }
  }

  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ ...CARD, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, fontFamily: F, marginBottom: 3 }}>
        Sons calmants
      </div>
      <div style={{ fontSize: 12, color: ENCRE, fontFamily: F, lineHeight: 1.5, marginBottom: 14 }}>
        Rien à télécharger : ces sons sont fabriqués par ton téléphone, ils
        fonctionnent hors connexion.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {AMBIANCES.map(a => {
          const on = actif === a.id
          return (
            <motion.button
              key={a.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => jouer(a)}
              style={{
                flex: '1 1 45%', minWidth: 130, textAlign: 'left', cursor: 'pointer',
                padding: '11px 13px', borderRadius: 16, fontFamily: F,
                background: on ? 'rgba(var(--rgb-verre), 0.45)' : 'rgba(var(--rgb-verre), 0.20)',
                border: `1px solid ${on ? ICONE : 'rgba(var(--rgb-creme-dore), 0.35)'}`,
              }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ENCRE, display: 'flex', alignItems: 'center', gap: 6 }}>
                {on && (
                  <motion.span
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: ICONE, flexShrink: 0 }}
                  />
                )}
                {a.nom}
              </div>
              <div style={{ fontSize: 11, color: ENCRE, marginTop: 2, lineHeight: 1.4 }}>{a.detail}</div>
            </motion.button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: ENCRE, fontFamily: F, minWidth: 52 }}>Volume</span>
        <input
          type="range" min="0" max="1" step="0.01" value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          aria-label="Volume"
          style={{ flex: 1, accentColor: ICONE }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: ENCRE, fontFamily: F, minWidth: 52 }}>Durée</span>
        {MINUTEURS.map(m => (
          <button
            key={m.id}
            onClick={() => setMinutes(m.id)}
            style={{
              padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: F,
              fontSize: 11.5, fontWeight: 600, color: ENCRE,
              background: minutes === m.id ? 'rgba(var(--rgb-verre), 0.45)' : 'transparent',
              border: `1px solid ${minutes === m.id ? ICONE : 'rgba(var(--rgb-creme-dore), 0.35)'}`,
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {actif && restant > 0 && (
        <div style={{ fontSize: 12, color: ENCRE, fontFamily: F, marginTop: 12, textAlign: 'center' }}>
          Il reste {mmss(restant)}
        </div>
      )}
    </div>
  )
}
