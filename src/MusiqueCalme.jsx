// ─────────────────────────────────────────────────────────────────────────────
// LA MUSIQUE
//
// De la vraie musique : des accords, une mélodie, une réverbération. Pas des
// nappes de bruit filtré comme dans SonsCalmes, mais des notes jouées.
//
// Elle est COMPOSÉE À LA VOLÉE par l'app, pas enregistrée. Chaque écoute est
// différente, elle ne boucle jamais, et elle peut durer des heures sans se
// répéter.
//
// POURQUOI, et c'est une décision qui appartient à Jean :
//
// Une musique de méditation trouvée en ligne n'est presque jamais libre de
// droits pour un usage COMMERCIAL, et une app payante sur les stores en est
// un. Les sources réellement utilisables sont soit payantes à l'abonnement
// (Epidemic Sound, Artlist), soit gratuites mais avec attribution obligatoire
// et licence à vérifier piste par piste. Dans les deux cas c'est un
// engagement continu : une licence expire, une piste est retirée, et l'app se
// retrouve à diffuser quelque chose qu'elle n'a plus le droit de diffuser.
//
// Une musique générée n'a aucun de ces problèmes. Sa limite est réelle : elle
// n'a pas l'intention d'un compositeur. C'est de la musique d'ambiance, pas
// une oeuvre.
//
// ── Comment ça marche ────────────────────────────────────────────────────────
//
// Une gamme PENTATONIQUE, cinq notes choisies pour que deux d'entre elles ne
// puissent jamais sonner faux ensemble. C'est ce qui permet de tirer les notes
// au hasard sans que ça grince : l'harmonie est dans le choix de la gamme, pas
// dans une partition.
//
// Trois voix : un accord tenu qui change lentement, une mélodie éparse, une
// basse. Le tout dans une réverbération générée, qui donne la profondeur sans
// laquelle des sinus restent des sinus.
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

/** Une réverbération fabriquée : du bruit qui décroît, c'est tout ce qu'il faut. */
function reverb(ctx, secondes = 3.4) {
  const n = Math.floor(ctx.sampleRate * secondes)
  const buf = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < n; i++) {
      // La décroissance en puissance 2.6 donne une queue plus naturelle
      // qu'une décroissance linéaire, qui s'entend comme une coupure.
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6)
    }
  }
  const conv = ctx.createConvolver()
  conv.buffer = buf
  return conv
}

const NOTE = (demi) => 440 * Math.pow(2, demi / 12)

/**
 * Les styles. Chacun donne sa gamme, ses accords, son timbre et son tempo.
 * `degres` sont des demi-tons depuis le la 440, `accords` des listes de degrés
 * joués ensemble.
 */
const STYLES = [
  {
    id: 'piano',
    nom: 'Piano méditatif',
    detail: 'Notes éparses, beaucoup de silence',
    timbre: 'cloche',
    tempo: 3.4,                       // secondes entre deux notes, en moyenne
    gamme: [-12, -10, -7, -5, -3, 0, 2, 5, 7, 9, 12],       // pentatonique majeure
    accords: [[-24, -17, -12], [-22, -15, -10], [-19, -12, -7], [-17, -10, -5]],
    dureeAccord: 14,
  },
  {
    id: 'yoga',
    nom: 'Nappe yoga',
    detail: 'Accords longs, mélodie rare',
    timbre: 'doux',
    tempo: 5.5,
    gamme: [-12, -9, -7, -4, -2, 0, 3, 5, 8, 12],           // mineure pentatonique
    accords: [[-24, -17, -12, -8], [-26, -19, -14, -10], [-21, -14, -9, -5]],
    dureeAccord: 20,
  },
  {
    id: 'sommeil',
    nom: 'Pour dormir',
    detail: 'Grave, lent, presque immobile',
    timbre: 'doux',
    tempo: 7,
    gamme: [-24, -19, -17, -12, -10, -7, -5],
    accords: [[-36, -29, -24], [-34, -27, -22], [-31, -24, -19]],
    dureeAccord: 26,
  },
]

/** Une note. `cloche` a une attaque nette et une longue queue, `doux` fond. */
function jouerNote(ctx, sortie, freq, timbre, volume = 0.16) {
  const t = ctx.currentTime
  const duree = timbre === 'cloche' ? 6 : 9

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(volume, t + (timbre === 'cloche' ? 0.012 : 1.6))
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree)
  g.connect(sortie)

  // Fondamentale plus deux partiels : sans eux, un sinus seul sonne comme un
  // test auditif, pas comme un instrument.
  const partiels = timbre === 'cloche' ? [1, 2.01, 3.02] : [1, 2, 3.01]
  const poids    = timbre === 'cloche' ? [1, 0.34, 0.12] : [1, 0.22, 0.07]
  partiels.forEach((mult, i) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq * mult
    const gp = ctx.createGain()
    gp.gain.value = poids[i]
    o.connect(gp).connect(g)
    o.start(t)
    o.stop(t + duree + 0.1)
  })
}

export default function MusiqueCalme() {
  const [actif, setActif]   = useState(null)
  const [volume, setVolume] = useState(0.45)

  const ctxRef   = useRef(null)
  const gainRef  = useRef(null)
  const arretRef = useRef(null)

  const stopper = React.useCallback(() => {
    if (arretRef.current) { arretRef.current(); arretRef.current = null }
    setActif(null)
  }, [])

  useEffect(() => () => {
    if (arretRef.current) arretRef.current()
    if (ctxRef.current) { try { ctxRef.current.close() } catch (_) {} }
  }, [])

  useEffect(() => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.08)
    }
  }, [volume])

  const jouer = (st) => {
    if (actif === st.id) { stopper(); return }
    if (arretRef.current) { arretRef.current(); arretRef.current = null }

    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      ctxRef.current = new AC()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = volume
      gainRef.current.connect(ctxRef.current.destination)
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    // Le chemin du son : les voix vont a la fois en direct et dans la reverb,
    // pour garder de la definition tout en ayant de la profondeur.
    const bus = ctx.createGain()
    const rev = reverb(ctx)
    const versRev = ctx.createGain(); versRev.gain.value = 0.55
    const direct  = ctx.createGain(); direct.gain.value  = 0.45
    bus.connect(direct).connect(gainRef.current)
    bus.connect(versRev).connect(rev).connect(gainRef.current)

    let accordActuel = null
    const poserAccord = () => {
      if (accordActuel) accordActuel.forEach(o => { try { o.stop(ctx.currentTime + 3) } catch (_) {} })
      const acc = st.accords[Math.floor(Math.random() * st.accords.length)]
      const t = ctx.currentTime
      accordActuel = acc.map(d => {
        const o = ctx.createOscillator()
        o.type = 'sine'
        // Un tres leger desaccord par note : c'est ce qui fait qu'un accord
        // respire au lieu de sonner comme un orgue electronique.
        o.frequency.value = NOTE(d) * (1 + (Math.random() - 0.5) * 0.0018)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.075, t + 4)
        o.connect(g).connect(bus)
        o.start(t)
        return o
      })
    }
    poserAccord()
    const minuteurAccord = setInterval(poserAccord, st.dureeAccord * 1000)

    // La melodie : une note de temps en temps, et parfois rien du tout. Le
    // silence fait autant que les notes dans ce genre de musique.
    let minuteurNote = null
    const prochaineNote = () => {
      const attente = st.tempo * (0.55 + Math.random() * 1.5)
      minuteurNote = setTimeout(() => {
        if (Math.random() > 0.28) {          // une fois sur quatre, on se tait
          const d = st.gamme[Math.floor(Math.random() * st.gamme.length)]
          jouerNote(ctx, bus, NOTE(d), st.timbre, 0.10 + Math.random() * 0.09)
        }
        prochaineNote()
      }, attente * 1000)
    }
    prochaineNote()

    arretRef.current = () => {
      clearInterval(minuteurAccord)
      if (minuteurNote) clearTimeout(minuteurNote)
      if (accordActuel) accordActuel.forEach(o => { try { o.stop() } catch (_) {} })
      try { bus.disconnect() } catch (_) {}
    }
    setActif(st.id)
  }

  return (
    <div style={{ ...CARD, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, fontFamily: F, marginBottom: 3 }}>
        Musique
      </div>
      <div style={{ fontSize: 12, color: ENCRE, fontFamily: F, lineHeight: 1.5, marginBottom: 14 }}>
        Des accords et une mélodie, composés à la volée. Chaque écoute est
        différente et ne se répète jamais, même au bout d'une heure.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
        {STYLES.map(st => {
          const on = actif === st.id
          return (
            <motion.button key={st.id} whileTap={{ scale: 0.98 }} onClick={() => jouer(st)}
              style={{
                textAlign: 'left', cursor: 'pointer', padding: '12px 14px', borderRadius: 16,
                fontFamily: F,
                background: on ? 'rgba(var(--rgb-verre), 0.45)' : 'rgba(var(--rgb-verre), 0.20)',
                border: `1px solid ${on ? ICONE : 'rgba(var(--rgb-creme-dore), 0.35)'}`,
              }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: ENCRE, display: 'flex', alignItems: 'center', gap: 7 }}>
                {on && (
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: ICONE, flexShrink: 0 }}
                  />
                )}
                {st.nom}
              </div>
              <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 2 }}>{st.detail}</div>
            </motion.button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: ENCRE, fontFamily: F, minWidth: 52 }}>Volume</span>
        <input
          type="range" min="0" max="1" step="0.01" value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          aria-label="Volume de la musique"
          className="curseur-solenn"
          style={{ flex: 1, '--remplissage': `${volume * 100}%` }}
        />
      </div>
    </div>
  )
}
