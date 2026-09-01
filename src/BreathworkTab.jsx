import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AMBRE, ENCRE, ROUGE } from './palette'

const F = "'Poppins', system-ui, sans-serif"
// L'opacite recue est volontairement IGNOREE, comme warmText sur l'accueil.
// Les 15 appels servent tous a `color`, jamais a un fond : cette fabrique
// partait de #C87B52, une couleur de FOND (2,39:1), et l'alpha ne faisait
// que l'effacer davantage. L'etat selectionne passe desormais par la
// pastille pleine, plus par un ecart d'opacite illisible.
const am = (a) => ENCRE

const CARD = {
  background: 'rgba(255,235,210,0.22)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,220,160,0.28)',
  borderRadius: 24,
  padding: '18px 20px',
}

const TECHNIQUES = [
  {
    id: 'coherence',
    name: 'Cohérence cardiaque',
    subtitle: '6 cycles/min · Anti-stress',
    phases: [
      { label: 'Inspire', dur: 5, big: true },
      { label: 'Expire',  dur: 5, big: false },
    ],
    totalCycles: 18,
    accent: 'rgba(200,123,82,0.80)',
  },
  {
    id: '478',
    name: '4-7-8',
    subtitle: 'Calme, anxiété & sommeil',
    phases: [
      { label: 'Inspire',  dur: 4, big: true },
      { label: 'Retiens',  dur: 7, big: true },
      { label: 'Expire',   dur: 8, big: false },
    ],
    totalCycles: 4,
    accent: 'rgba(200,123,82,0.80)',
  },
  {
    id: 'box',
    name: 'Box Breathing',
    subtitle: 'Focus & clarté mentale',
    phases: [
      { label: 'Inspire',  dur: 4, big: true },
      { label: 'Retiens',  dur: 4, big: true },
      { label: 'Expire',   dur: 4, big: false },
      { label: 'Retiens',  dur: 4, big: false },
    ],
    totalCycles: 4,
    accent: 'rgba(200,123,82,0.80)',
  },
  {
    id: 'wimhof',
    name: 'Wim Hof',
    subtitle: 'Énergie & activation',
    phases: [
      { label: 'Inspire rapide', dur: 1.5, big: true },
      { label: 'Expire rapide',  dur: 1.5, big: false },
    ],
    totalCycles: 30,
    accent: 'rgba(200,123,82,0.80)',
  },
]

export default function BreathworkTab() {
  const [techId, setTechId]           = useState('coherence')
  const [running, setRunning]         = useState(false)
  const [phaseIdx, setPhaseIdx]       = useState(0)
  const [cycleCount, setCycleCount]   = useState(0)
  const [elapsed, setElapsed]         = useState(0)
  const [done, setDone]               = useState(false)
  const [sessions, setSessions]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('solenn_breathwork_sessions') || '[]') }
    catch { return [] }
  })

  const tech  = TECHNIQUES.find(t => t.id === techId)
  const phase = tech.phases[phaseIdx]

  // Timer: one timeout per phase + elapsed ticker
  useEffect(() => {
    if (!running) return

    setElapsed(0)

    const phaseTimer = setTimeout(() => {
      const nextIdx = (phaseIdx + 1) % tech.phases.length
      const nextCycle = nextIdx === 0 ? cycleCount + 1 : cycleCount

      if (nextCycle >= tech.totalCycles && nextIdx === 0) {
        setRunning(false)
        setDone(true)
        const session = { date: new Date().toISOString(), technique: tech.name }
        setSessions(prev => {
          const updated = [session, ...prev].slice(0, 20)
          localStorage.setItem('solenn_breathwork_sessions', JSON.stringify(updated))
          return updated
        })
        return
      }

      setCycleCount(nextCycle)
      setPhaseIdx(nextIdx)
      // Retour haptique au changement de phase. Un exercice de respiration qui
      // oblige a fixer l'ecran est contre-productif : la vibration permet de
      // fermer les yeux. Motif long pour inspirer, deux breves pour expirer,
      // ce qui rend les phases distinguables sans regarder (2026-08-12).
      try {
        const suivante = tech.phases[nextIdx]
        if (navigator.vibrate) navigator.vibrate(suivante?.big ? 120 : [50, 60, 50])
      } catch {}
    }, phase.dur * 1000)

    const ticker = setInterval(() => setElapsed(e => e + 1), 1000)

    return () => { clearTimeout(phaseTimer); clearInterval(ticker) }
  }, [running, phaseIdx, cycleCount, techId])

  function start() {
    try { if (navigator.vibrate) navigator.vibrate(120) } catch {}
    setPhaseIdx(0)
    setCycleCount(0)
    setElapsed(0)
    setDone(false)
    setRunning(true)
  }

  function stop() {
    setRunning(false)
    setPhaseIdx(0)
    setCycleCount(0)
    setElapsed(0)
    setDone(false)
  }

  function switchTech(id) {
    stop()
    setTechId(id)
  }

  const remaining = Math.max(0, Math.ceil(phase.dur - elapsed))
  const isActive  = running && !done

  return (
    <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 64px) 16px 120px', fontFamily: F, maxWidth: 480, margin: '0 auto' }}>

      {/* Technique tabs, flexWrap : tout visible d'un coup, plus de rangée
          coupée au bord de l'écran (retour Jean 2026-07-25) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 4, marginBottom: 16, justifyContent: 'center' }}>
        {TECHNIQUES.map(t => {
          const sel = techId === t.id
          return (
            <button key={t.id} onClick={() => switchTech(t.id)} style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 20,
              border: `1px solid ${sel ? 'rgba(108,66,44,0.55)' : 'rgba(200,123,82,0.35)'}`,
              background: sel ? 'linear-gradient(135deg,#6C422C,#90593B)' : 'rgba(255,235,210,0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: sel ? '#fff' : ENCRE,
              fontSize: 12, fontWeight: sel ? 600 : 400,
              cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap',
              transition: 'all 0.18s',
            }}>
              {t.name}
            </button>
          )
        })}
      </div>

      {/* Subtitle */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: am(0.82), letterSpacing: '0.01em' }}>{tech.subtitle}</div>
      </div>

      {/* Breathing circle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer ring (static) */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid rgba(200,123,82,0.32)',
          }}/>

          {/* Animated circle */}
          <motion.div
            animate={{ scale: isActive && phase.big ? 1.0 : 0.55 }}
            transition={{ duration: phase.dur, ease: 'easeInOut' }}
            style={{
              width: 200, height: 200, borderRadius: '50%',
              background: `radial-gradient(circle, ${tech.accent.replace('0.80', '0.34')} 0%, ${tech.accent.replace('0.80', '0.16')} 60%, transparent 100%)`,
              border: `1.5px solid ${tech.accent.replace('0.80', '0.62')}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: isActive ? `0 0 50px ${tech.accent.replace('0.80', '0.28')}` : 'none',
              transition: 'box-shadow 0.5s',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={done ? 'done' : isActive ? `${phaseIdx}-${cycleCount}` : 'idle'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ textAlign: 'center' }}
              >
                {done && (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>✓</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: am(0.90) }}>Terminé</div>
                  </>
                )}
                {!done && isActive && (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: am(0.92) }}>{phase.label}</div>
                    {/* `remaining` etait calcule depuis toujours et n'etait
                        affiche nulle part : sans lui, impossible de savoir
                        combien de temps tenir. */}
                    {running && (
                      <div style={{ fontSize: 30, fontWeight: 300, color: am(0.80), lineHeight: 1.1, marginTop: 2,
                        fontFamily: "'Poppins', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>
                        {remaining}
                      </div>
                    )}
                    <div style={{ fontSize: 22, fontWeight: 300, color: am(0.88), marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                      {remaining}
                    </div>
                  </>
                )}
                {!done && !isActive && (
                  <div style={{ fontSize: 14, color: am(0.75) }}>Prêt</div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Cycle counter */}
      {isActive && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: am(0.78), fontVariantNumeric: 'tabular-nums' }}>
            Cycle {cycleCount + 1} / {tech.totalCycles}
          </span>
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: 12 }}>
        {!isActive && !done && (
          <button onClick={start} style={{
            padding: '13px 40px',
            background: 'rgba(255,235,210,0.32)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            color: AMBRE, border: '1px solid rgba(255,220,160,0.38)',
            borderRadius: 50, fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: F,
          }}>
            Commencer
          </button>
        )}
        {isActive && (
          <button onClick={stop} style={{
            padding: '13px 36px',
            background: 'rgba(255,235,210,0.15)', color: am(0.88),
            border: '1px solid rgba(255,220,160,0.25)',
            borderRadius: 50, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: F,
          }}>
            Arrêter
          </button>
        )}
        {done && (
          <button onClick={start} style={{
            padding: '13px 40px',
            background: 'rgba(255,235,210,0.32)',
            color: '#fff', border: '1px solid rgba(255,220,160,0.38)',
            borderRadius: 50, fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: F,
          }}>
            Recommencer
          </button>
        )}
      </div>

      {/* Phase breakdown */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: am(0.80), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Phases</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tech.phases.map((p, i) => {
            const active = isActive && phaseIdx === i
            return (
              <div key={i} style={{
                flex: 1, textAlign: 'center',
                background: active ? 'linear-gradient(135deg,#6C422C,#90593B)' : 'rgba(255,235,210,0.35)',
                border: `1px solid ${active ? 'rgba(108,66,44,0.55)' : 'rgba(200,123,82,0.28)'}`,
                borderRadius: 14, padding: '10px 4px',
                transition: 'all 0.3s ease',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: active ? '#fff' : ENCRE, marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 15, fontWeight: 300, color: active ? 'rgba(255,255,255,0.92)' : ENCRE }}>{p.dur}s</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* History */}
      {sessions.length > 0 && (
        <div style={{ ...CARD }}>
          <div style={{ fontSize: 11, color: am(0.80), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Sessions récentes</div>
          {sessions.slice(0, 5).map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0',
              borderBottom: i < Math.min(4, sessions.length - 1) ? '1px solid rgba(255,220,160,0.12)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: am(0.78) }}>{s.technique}</span>
              <span style={{ fontSize: 11, color: am(0.40) }}>
                {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
