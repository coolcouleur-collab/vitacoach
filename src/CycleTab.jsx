import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoonIcon } from './Icons'

const F = "'Poppins', system-ui, sans-serif"
const am = (a) => `rgba(255,238,220,${a})`

// Phase de lune en SVG (cercle avec remplissage partiel selon la phase)
function MoonPhaseSVG({ phase, size = 16, color = 'rgba(255,238,220,0.85)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ display: 'block' }}>
      <circle cx="8" cy="8" r="7" fill="none" stroke={color} strokeWidth="1.3" />
      {phase === 'new' && <circle cx="8" cy="8" r="5" fill={color} fillOpacity="0.15" />}
      {phase === 'full' && <circle cx="8" cy="8" r="5" fill={color} />}
      {phase === 'waxing' && <path d="M8 3 A5 5 0 0 1 8 13 A7 7 0 0 0 8 3 Z" fill={color} />}
      {phase === 'waning' && <path d="M8 3 A5 5 0 0 0 8 13 A7 7 0 0 1 8 3 Z" fill={color} />}
    </svg>
  )
}

const CARD = {
  background: 'rgba(255,235,210,0.22)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,220,160,0.28)',
  borderRadius: 24,
  padding: '18px 20px',
}

const PHASES = [
  {
    id: 'menstrual',
    name: 'Phase menstruelle',
    days: [1, 5],
    moonPhase: 'new',
    color: 'rgba(200,80,80,0.70)',
    bgColor: 'rgba(200,80,80,0.12)',
    energy: 'Basse',
    description: "Ton corps se régénère. C'est le moment de te reposer et de t'écouter.",
    tips: [
      "Privilégie des activités douces : yoga, marche, étirements",
      "Chaleur sur le bas-ventre pour soulager les crampes",
      "Alimentation riche en fer : lentilles, épinards, viande rouge",
      "Accorde-toi du temps de solitude et d'introspection",
    ],
    symptoms: ['Crampes', 'Fatigue', 'Maux de tête', "Sautes d'humeur", 'Gonflement'],
  },
  {
    id: 'follicular',
    name: 'Phase folliculaire',
    days: [6, 13],
    moonPhase: 'waxing',
    color: 'rgba(255,180,60,0.80)',
    bgColor: 'rgba(255,180,60,0.12)',
    energy: 'Montante',
    description: "L'énergie remonte, la créativité aussi. Idéal pour démarrer de nouveaux projets.",
    tips: [
      'Lance de nouveaux projets ou reprends des habitudes santé',
      'Séances cardio ou HIIT bien tolérées',
      'Favorise les aliments fermentés et les légumes verts',
      'Moment idéal pour les rendez-vous sociaux',
    ],
    symptoms: ['Énergie stable', 'Bonne humeur', 'Motivation', 'Légèreté'],
  },
  {
    id: 'ovulatory',
    name: 'Phase ovulatoire',
    days: [14, 16],
    moonPhase: 'full',
    color: 'rgba(255,200,60,0.90)',
    bgColor: 'rgba(255,200,60,0.14)',
    energy: 'Pic',
    description: 'Tu es au sommet de ton énergie et de ta confiance. Profites-en !',
    tips: [
      'Période idéale pour les grandes présentations ou décisions',
      'Intensité sportive maximale bien supportée',
      'Alimentation légère et hydratation +++',
      "Moments de connexion sociale et d'expression",
    ],
    symptoms: ["Pic d'énergie", 'Libido élevée', 'Chaleur corporelle', 'Douleurs ovulatoires'],
  },
  {
    id: 'luteal',
    name: 'Phase lutéale',
    days: [17, 28],
    moonPhase: 'waning',
    color: 'rgba(200,123,82,0.75)',
    bgColor: 'rgba(200,123,82,0.12)',
    energy: 'Déclinante',
    description: "L'énergie baisse progressivement. Ton corps prépare le prochain cycle.",
    tips: [
      'Activités modérées : pilates, natation, yoga flow',
      'Réduis le sucre et la caféine pour limiter les fringales',
      'Magnésium et vitamine B6 peuvent aider',
      'Accorde-toi plus de temps de récupération',
    ],
    symptoms: ['SPM', 'Fringales', 'Gonflement', 'Irritabilité', 'Fatigue', 'Sensibilité émotionnelle'],
  },
]

function getCurrentPhase(lastPeriodDate) {
  if (!lastPeriodDate) return null
  const now = new Date()
  const start = new Date(lastPeriodDate)
  const dayDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  const dayInCycle = (dayDiff % 28) + 1
  return { dayInCycle, phase: PHASES.find(p => dayInCycle >= p.days[0] && dayInCycle <= p.days[1]) || PHASES[3] }
}

export default function CycleTab({ profil }) {
  const [lastPeriod, setLastPeriod] = useState(() => localStorage.getItem('solenn_cycle_start') || '')
  const [symptoms, setSymptoms]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('solenn_cycle_symptoms_today') || '[]') } catch { return [] }
  })
  const [savedDate, setSavedDate]   = useState(lastPeriod)

  const cycleInfo = getCurrentPhase(savedDate)
  const currentPhase = cycleInfo?.phase

  function saveDate() {
    localStorage.setItem('solenn_cycle_start', lastPeriod)
    setSavedDate(lastPeriod)
  }

  function toggleSymptom(s) {
    const updated = symptoms.includes(s) ? symptoms.filter(x => x !== s) : [...symptoms, s]
    setSymptoms(updated)
    localStorage.setItem('solenn_cycle_symptoms_today', JSON.stringify(updated))
  }

  return (
    <div style={{ padding: '16px 16px 120px', fontFamily: F, maxWidth: 480, margin: '0 auto' }}>

      {/* Phase timeline */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: am(0.60), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Phases du cycle</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {PHASES.map((p) => {
            const active = currentPhase?.id === p.id
            return (
              <div key={p.id} style={{
                flex: p.id === 'ovulatory' ? 0.6 : p.id === 'luteal' ? 1.8 : p.id === 'follicular' ? 1.2 : 1,
                background: active ? p.bgColor : 'rgba(255,235,210,0.10)',
                border: `1px solid ${active ? p.color : 'rgba(255,220,160,0.16)'}`,
                borderRadius: 12, padding: '8px 4px',
                textAlign: 'center', transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <MoonPhaseSVG phase={p.moonPhase} size={14} color={active ? p.color : am(0.45)} />
                </div>
                <div style={{ fontSize: 8, fontWeight: 600, color: am(active ? 0.88 : 0.40), letterSpacing: '0.03em' }}>
                  J{p.days[0]}-{p.days[1]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Date input */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: am(0.60), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          Début des dernières règles
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            value={lastPeriod}
            onChange={e => setLastPeriod(e.target.value)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 14,
              background: 'rgba(255,235,210,0.15)',
              border: '1px solid rgba(255,220,160,0.30)',
              color: am(0.90), fontSize: 16, fontFamily: F,
              outline: 'none', colorScheme: 'dark',
            }}
          />
          <button onClick={saveDate} style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #C87B52, #E8962A)',
            color: '#fff', border: '1px solid rgba(255,220,160,0.38)',
            borderRadius: 14, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: F, flexShrink: 0,
          }}>
            Enregistrer
          </button>
        </div>
      </div>

      {/* Current phase card */}
      <AnimatePresence mode="wait">
        {currentPhase ? (
          <motion.div key={currentPhase.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Phase header */}
            <div style={{
              ...CARD,
              background: currentPhase.bgColor.replace('0.12', '0.18'),
              border: `1px solid ${currentPhase.color.replace('0.70', '0.35').replace('0.75', '0.35').replace('0.80', '0.35').replace('0.90', '0.35')}`,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  <MoonPhaseSVG phase={currentPhase.moonPhase} size={32} color={currentPhase.color} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: am(0.95) }}>{currentPhase.name}</div>
                  <div style={{ fontSize: 12, color: am(0.55), marginTop: 2 }}>
                    Jour {cycleInfo.dayInCycle} · Énergie {currentPhase.energy.toLowerCase()}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: am(0.78), lineHeight: 1.6 }}>{currentPhase.description}</div>
            </div>

            {/* Tips */}
            <div style={{ ...CARD, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: am(0.60), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                Conseils du moment
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentPhase.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: currentPhase.color, marginTop: 6,
                    }}/>
                    <span style={{ fontSize: 13, color: am(0.78), lineHeight: 1.55 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Symptom log */}
            <div style={{ ...CARD }}>
              <div style={{ fontSize: 11, color: am(0.60), letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                Symptômes aujourd'hui
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {currentPhase.symptoms.map(s => {
                  const sel = symptoms.includes(s)
                  return (
                    <button key={s} onClick={() => toggleSymptom(s)} style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      border: `1px solid ${sel ? 'rgba(255,220,160,0.55)' : 'rgba(255,220,160,0.20)'}`,
                      background: sel ? 'rgba(255,235,210,0.32)' : 'rgba(255,235,210,0.10)',
                      color: sel ? am(0.92) : am(0.52),
                      fontSize: 12, fontWeight: sel ? 600 : 400,
                      cursor: 'pointer', fontFamily: F,
                      transition: 'all 0.18s',
                    }}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ ...CARD, textAlign: 'center', padding: '40px 24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <MoonIcon size={36} color="rgba(255,238,220,0.75)" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: am(0.80), marginBottom: 8 }}>
              Entre la date de tes dernières règles
            </div>
            <div style={{ fontSize: 13, color: am(0.50), lineHeight: 1.6 }}>
              Solenn identifiera ta phase du cycle et t'accompagnera au quotidien.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
