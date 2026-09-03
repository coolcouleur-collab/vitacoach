import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AMBRE, ENCRE, ROUGE, ICONE } from './palette'
import SonsCalmes from './SonsCalmes'
import YogaPostures from './YogaPostures'
import MeditationGuidee from './MeditationGuidee'
import JeuApaisant from './JeuApaisant'
import MusiqueCalme from './MusiqueCalme'

const F = "'Poppins', system-ui, sans-serif"
// L'opacite recue est volontairement IGNOREE, comme warmText sur l'accueil.
// Les 15 appels servent tous a `color`, jamais a un fond : cette fabrique
// partait de var(--accent), une couleur de FOND (2,39:1), et l'alpha ne faisait
// que l'effacer davantage. L'etat selectionne passe desormais par la
// pastille pleine, plus par un ecart d'opacite illisible.
// ATTENTION : l'argument est ignore, volontairement. Cette fonction reglait
// une opacite ; la passe de mode nuit l'a remplacee par le jeton d'encre,
// qui est deja au bon contraste. Les `am(0.75)` et `am(0.92)` du fichier
// rendent donc tous exactement la meme couleur. La signature est gardee
// pour ne pas toucher aux douze appels, mais ne comptez pas sur elle pour
// creer une hierarchie : passez par la taille et la graisse.
const am = (_opaciteIgnoree) => ENCRE

const CARD = {
  background: 'rgba(var(--rgb-verre), 0.22)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
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
    accent: 'rgba(var(--rgb-terracotta), 0.80)',
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
    accent: 'rgba(var(--rgb-terracotta), 0.80)',
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
    accent: 'rgba(var(--rgb-terracotta), 0.80)',
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
    accent: 'rgba(var(--rgb-terracotta), 0.80)',
  },
]

// La page ne portait qu'une chose, la respiration. Elle en porte cinq depuis
// le 3 septembre : respirer, des postures, une meditation guidee, des sons et
// un jeu. Un selecteur en tete, pour qu'aucune ne soit enterree sous les
// autres et qu'on arrive directement sur ce qu'on est venu chercher.
const SECTIONS = [
  { id: 'respirer',   nom: 'Respirer' },
  { id: 'postures',   nom: 'Postures' },
  { id: 'meditation', nom: 'Méditation' },
  { id: 'musique',    nom: 'Musique' },
  { id: 'sons',       nom: 'Sons' },
  { id: 'jeu',        nom: 'Pause' },
]

export default function BreathworkTab() {
  const [section, setSection]         = useState('respirer')
  const [techId, setTechId]           = useState('coherence')
  const [techOuvert, setTechOuvert]   = useState(false)
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
    // Le conteneur qui defile reserve deja, sur mobile et hors accueil,
    // safe-area+76 en haut et safe-area+118 en bas (App.jsx). Ce qui
    // s'ajoutait ici comptait le decalage une seconde fois.
    // Sur l'iPhone de Jean ca faisait 123 px de vide entre l'entete et la
    // rangee des sections, et 120 de trop sous la derniere carte
    // (captures du 2026-09-03). On ne garde qu'une respiration locale.
    <div className="section-respiration" style={{ padding: '4px 16px 12px', fontFamily: F, maxWidth: 480, margin: '0 auto' }}>

      {/* Le selecteur de SECTION, au-dessus de tout le reste.
          Il DISPARAIT pendant une seance. Deux raisons, l'une de fond et
          l'autre mesurable :
          - de fond : toucher « Postures » ou « Musique » en pleine coherence
            cardiaque tue la seance en cours. Un ecran qui compte les cycles
            n'a pas a offrir six portes de sortie a portee de pouce.
          - mesurable : avec les six sections, les quatre techniques et le bloc
            Phases, la page depasse l'ecran des que la seance ajoute son
            compteur de cycles, et le bas devenait inatteignable
            (capture Jean 2026-09-04, le bloc Phases coupe par la barre). */}
      {!isActive && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18, justifyContent: 'center' }}>
        {SECTIONS.map(x => {
          const on = section === x.id
          return (
            <button key={x.id} onClick={() => { stop(); setSection(x.id) }} style={{
              padding: '8px 15px', borderRadius: 20, cursor: 'pointer', fontFamily: F,
              fontSize: 12.5, fontWeight: on ? 700 : 500, color: ENCRE,
              background: on ? 'rgba(var(--rgb-verre), 0.45)' : 'rgba(var(--rgb-verre), 0.18)',
              border: `1px solid ${on ? ICONE : 'rgba(var(--rgb-creme-dore), 0.32)'}`,
              whiteSpace: 'nowrap', transition: 'all 0.18s',
            }}>
              {x.nom}
            </button>
          )
        })}
      </div>

      )}

      {section === 'postures'   && <YogaPostures />}
      {section === 'meditation' && <MeditationGuidee />}
      {section === 'musique'    && <MusiqueCalme />}
      {section === 'sons'       && <SonsCalmes />}
      {section === 'jeu'        && <JeuApaisant />}

      {section === 'respirer' && <>

      {/* LA TECHNIQUE, EN UNE LIGNE.
          Il y avait deux rangees de pastilles, puis une ligne de sous-titre,
          puis un bloc « Phases » a deux encadres tout en bas : trois blocs pour
          dire une seule chose, quelle technique et a quel rythme. Le cercle,
          qui est la raison d'etre de l'ecran, arrivait quatrieme.
          Le critere est le meme que pour les sections : on replie un REGLAGE,
          pas une offre. On garde la meme technique presque a chaque fois ; les
          trois autres n'interessent qu'au moment de changer. */}
      {!isActive && (
      <div style={{ marginBottom: 22 }}>
        <button
          onClick={() => setTechOuvert(o => !o)}
          aria-expanded={techOuvert}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 15px', borderRadius: 18, cursor: 'pointer',
            fontFamily: F, textAlign: 'left',
            background: 'rgba(var(--rgb-verre), 0.28)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(var(--rgb-creme-dore), 0.34)',
          }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: ENCRE }}>
              {tech.name}
            </span>
            {/* Le rythme remplace le bloc « Phases » : « Inspire 5s · Expire 5s »
                est une phrase, pas un tableau. Et il se lit AVANT de commencer,
                la ou l'ancien bloc l'affichait tout en bas de page. */}
            <span style={{ display: 'block', fontSize: 11.5, color: ENCRE, opacity: 0.82, marginTop: 2 }}>
              {tech.phases.map(p => `${p.label} ${p.dur}s`).join(' · ')}
            </span>
          </span>
          <svg width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true"
            style={{ flexShrink: 0, transform: techOuvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
            <path d="M1 1l4.5 4.5L10 1" stroke={ICONE} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
        </button>

        {techOuvert && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7, marginTop: 8 }}>
            {TECHNIQUES.map(t => {
              const sel = techId === t.id
              return (
                <button key={t.id}
                  onClick={() => { switchTech(t.id); setTechOuvert(false) }}
                  aria-current={sel ? 'true' : undefined}
                  style={{
                    textAlign: 'left', padding: '10px 13px', borderRadius: 14,
                    cursor: 'pointer', fontFamily: F,
                    border: `1px solid ${sel ? 'rgba(var(--rgb-brun-fonce),0.55)' : 'rgba(var(--rgb-terracotta), 0.28)'}`,
                    background: sel ? 'linear-gradient(135deg,var(--brun-fonce),var(--brun-moyen))' : 'rgba(var(--rgb-verre), 0.30)',
                    color: sel ? '#fff' : ENCRE,
                  }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: sel ? 700 : 500 }}>{t.name}</span>
                  <span style={{ display: 'block', fontSize: 10.5, opacity: 0.82, marginTop: 2 }}>{t.subtitle}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      )}

      {/* Breathing circle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer ring (static) */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid rgba(var(--rgb-terracotta), 0.32)',
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
                    {/* Un seul compteur. Il y en avait DEUX empiles : celui-ci,
                        et un second a 22 px juste en dessous. Le bloc englobant
                        est deja `!done && isActive`, et isActive vaut
                        `running && !done` : la condition `running` du premier
                        etait donc toujours vraie quand le second s'affichait.
                        Les deux nombres se lisaient l'un sous l'autre pendant
                        toute la seance. Personne ne l'avait vu parce que cet
                        ecran ne se voit qu'en cours de respiration. */}
                    <div style={{ fontSize: 30, fontWeight: 300, color: am(0.80), lineHeight: 1.1, marginTop: 2,
                      fontFamily: "'Poppins', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>
                      {remaining}
                    </div>
                  </>
                )}
                {!done && !isActive && (
                  <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '0.01em', color: am(0.75) }}>Prêt</div>
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
            background: 'rgba(var(--rgb-verre), 0.32)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            color: AMBRE, border: '1px solid rgba(var(--rgb-creme-dore), 0.38)',
            borderRadius: 50, fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: F,
          }}>
            Commencer
          </button>
        )}
        {isActive && (
          <button onClick={stop} style={{
            padding: '13px 36px',
            background: 'rgba(var(--rgb-verre), 0.15)', color: am(0.88),
            border: '1px solid rgba(var(--rgb-creme-dore), 0.25)',
            borderRadius: 50, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: F,
          }}>
            Arrêter
          </button>
        )}
        {done && (
          <button onClick={start} style={{
            padding: '13px 40px',
            background: 'rgba(var(--rgb-verre), 0.32)',
            color: '#fff', border: '1px solid rgba(var(--rgb-creme-dore), 0.38)',
            borderRadius: 50, fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: F,
          }}>
            Recommencer
          </button>
        )}
      </div>

      {/* Le bloc « Phases » a ete fondu dans la ligne de technique, en haut :
          « Inspire 5s · Expire 5s » est une phrase, pas un tableau a deux
          encadres, et elle se lit au moment ou l'on choisit. */}

      {/* L'historique non plus : on ne lit pas ses seances passees
          pendant qu'on en fait une. */}
      {!isActive && sessions.length > 0 && (
        <div style={{ ...CARD }}>
          <div style={{ fontSize: 11, color: am(0.80), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Sessions récentes</div>
          {sessions.slice(0, 5).map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0',
              borderBottom: i < Math.min(4, sessions.length - 1) ? '1px solid rgba(var(--rgb-creme-dore), 0.12)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: am(0.78) }}>{s.technique}</span>
              <span style={{ fontSize: 11, color: am(0.40) }}>
                {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
      </>}

    </div>
  )
}
