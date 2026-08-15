import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoonIcon } from './Icons'
import { supabase } from './supabase'

const F = "'Poppins', system-ui, sans-serif"
const am = (a) => `rgba(200,123,82,${a})`
const DAY_MS = 24 * 60 * 60 * 1000

// Phase de lune en SVG (cercle avec remplissage partiel selon la phase)
function MoonPhaseSVG({ phase, size = 16, color = 'rgba(200,123,82,0.85)' }) {
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

const LABEL = {
  fontSize: 11, color: am(0.60), letterSpacing: '0.06em',
  textTransform: 'uppercase', marginBottom: 12,
}

const PHASE_CONTENT = {
  menstrual: {
    name: 'Phase menstruelle',
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
  follicular: {
    name: 'Phase folliculaire',
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
  ovulatory: {
    name: 'Phase ovulatoire',
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
  luteal: {
    name: 'Phase lutéale',
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
}

// ─── Dates (tout en date locale, format YYYY-MM-DD) ─────────────────────────
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / DAY_MS)
}
function fmtDate(str) {
  return parseDate(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

// ─── Statistiques de cycle depuis les règles réellement enregistrées ────────
// periods : [{ start_date, end_date }] triés du plus récent au plus ancien
function computeStats(periods) {
  const starts = periods.map(p => p.start_date)
  // Durées de cycle = écarts entre débuts consécutifs (6 derniers, bornés 15-60 j)
  const gaps = []
  for (let i = 0; i < starts.length - 1 && gaps.length < 6; i++) {
    const gap = daysBetween(starts[i + 1], starts[i])
    if (gap >= 15 && gap <= 60) gaps.push(gap)
  }
  const cycleLength = gaps.length
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : 28
  // Durée des règles = end - start + 1 (bornée 1-10 j)
  const lens = periods
    .filter(p => p.end_date)
    .map(p => daysBetween(p.start_date, p.end_date) + 1)
    .filter(l => l >= 1 && l <= 10)
    .slice(0, 6)
  const periodLength = lens.length
    ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length)
    : 5
  return { cycleLength, periodLength, realCycles: gaps.length }
}

// Bornes des phases adaptées au cycle réel (phase lutéale ~14 j avant les règles)
function buildPhases(cycleLength, periodLength) {
  const ovuDay = Math.max(periodLength + 3, cycleLength - 14)
  return [
    { id: 'menstrual',  days: [1, periodLength] },
    { id: 'follicular', days: [periodLength + 1, ovuDay - 2] },
    { id: 'ovulatory',  days: [ovuDay - 1, ovuDay + 1] },
    { id: 'luteal',     days: [ovuDay + 2, cycleLength] },
  ].map(p => ({ ...p, ...PHASE_CONTENT[p.id] }))
}

// ── Explorateur de douleur — « creuser pourquoi » (demande Jean 2026-07-25) ──
// 3 questions guidées, puis Solenn explique les pistes possibles de façon
// pédagogique dans le chat. Éducatif uniquement : jamais de diagnostic, et
// toujours l'orientation médecin pour les signaux d'alerte.
function DouleurExplorer({ onChat, phaseNom }) {
  const [etape, setEtape] = useState(0)
  const [ou, setOu] = useState(null)
  const [niveau, setNiveau] = useState(null)

  const OU = ['Bas-ventre', 'Dos / reins', 'Tête', 'Seins', 'Autre']
  const MOMENTS = ['Pendant mes règles', 'Quelques jours avant', 'En milieu de cycle', 'Ça ne suit pas mon cycle']

  const chip = (sel) => ({
    padding: '9px 15px', borderRadius: 20,
    border: `1px solid ${sel ? 'rgba(200,123,82,0.55)' : 'rgba(200,123,82,0.25)'}`,
    background: sel ? 'rgba(255,235,210,0.50)' : 'rgba(255,235,210,0.20)',
    color: am(sel ? 0.95 : 0.70), fontSize: 12.5, fontWeight: sel ? 600 : 400,
    cursor: 'pointer', fontFamily: F, transition: 'all 0.18s',
  })

  function envoyer(moment) {
    const msg = `J'ai mal aujourd'hui. Localisation : ${ou.toLowerCase()}. Intensité : ${niveau}/5. Moment : ${moment.toLowerCase()}.${phaseNom ? ` Phase actuelle de mon cycle : ${phaseNom}.` : ''} Mets-moi sur des pistes SANS poser de diagnostic, et réponds COURT et aéré : 2-3 causes possibles en phrases simples, 2 gestes concrets qui peuvent soulager aujourd'hui, puis en 2 lignes les signes qui doivent faire consulter un médecin. Pas de pavé.`
    setEtape(0); setOu(null); setNiveau(null)
    onChat && onChat(msg)
  }

  return (
    <div style={{ ...CARD, marginBottom: 16 }}>
      <div style={LABEL}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={am(0.85)} strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-4 7l-3 6-3-6c-2-2-4-4-4-7a7 7 0 0 1 7-7z" opacity="0"/><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          J'ai mal aujourd'hui
        </span>
      </div>
      {etape === 0 && (
        <>
          <div style={{ fontSize: 12.5, color: am(0.72), fontFamily: F, lineHeight: 1.55, marginBottom: 12 }}>
            Décris ta douleur en 3 taps — Solenn t'aide à comprendre ce qui se passe et te met sur des pistes.
          </div>
          <button onClick={() => setEtape(1)} style={{
            padding: '10px 20px', borderRadius: 14, cursor: 'pointer', fontFamily: F,
            background: 'rgba(255,235,210,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,220,160,0.45)', color: '#B2663E', fontSize: 12.5, fontWeight: 600,
          }}>
            Comprendre ma douleur
          </button>
        </>
      )}
      {etape === 1 && (
        <>
          <div style={{ fontSize: 12.5, color: am(0.80), fontFamily: F, marginBottom: 10 }}>Où as-tu mal ?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {OU.map(o => <button key={o} style={chip(ou === o)} onClick={() => { setOu(o); setEtape(2) }}>{o}</button>)}
          </div>
        </>
      )}
      {etape === 2 && (
        <>
          <div style={{ fontSize: 12.5, color: am(0.80), fontFamily: F, marginBottom: 10 }}>Quelle intensité ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => <button key={n} style={{ ...chip(niveau === n), minWidth: 40, textAlign: 'center' }} onClick={() => { setNiveau(n); setEtape(3) }}>{n}</button>)}
          </div>
          <div style={{ fontSize: 10.5, color: am(0.55), fontFamily: F, marginTop: 8 }}>1 = gêne légère · 5 = très forte</div>
        </>
      )}
      {etape === 3 && (
        <>
          <div style={{ fontSize: 12.5, color: am(0.80), fontFamily: F, marginBottom: 10 }}>À quel moment de ton cycle ?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MOMENTS.map(m => <button key={m} style={chip(false)} onClick={() => envoyer(m)}>{m}</button>)}
          </div>
        </>
      )}
      {niveau >= 4 && etape === 3 && (
        <div style={{ fontSize: 11, color: am(0.70), fontFamily: F, marginTop: 12, lineHeight: 1.5 }}>
          Une douleur forte ou inhabituelle mérite l'avis d'un professionnel de santé, sans attendre.
        </div>
      )}
    </div>
  )
}

export default function CycleTab({ profil, userId, onChat }) {
  const [periods, setPeriods] = useState(() => {
    try { return JSON.parse(localStorage.getItem('solenn_cycle_periods') || '[]') } catch { return [] }
  })
  const [symptoms, setSymptoms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('solenn_cycle_symptoms_today') || '[]') } catch { return [] }
  })
  const [pickDate, setPickDate] = useState(todayStr())
  const [showPicker, setShowPicker] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function cachePeriods(list) {
    setPeriods(list)
    localStorage.setItem('solenn_cycle_periods', JSON.stringify(list))
  }

  // Chargement Supabase + migration de l'ancienne date localStorage
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('cycle_periods')
          .select('id, start_date, end_date')
          .eq('user_id', userId)
          .order('start_date', { ascending: false })
          .limit(24)
        if (error) return
        let list = data || []
        // Migration : ancienne date unique (v1) → premier cycle enregistré
        const legacy = localStorage.getItem('solenn_cycle_start')
        if (legacy && !list.some(p => p.start_date === legacy)) {
          const { data: inserted } = await supabase
            .from('cycle_periods')
            .upsert({ user_id: userId, start_date: legacy }, { onConflict: 'user_id,start_date' })
            .select('id, start_date, end_date')
          if (inserted?.length) {
            list = [...list, ...inserted].sort((a, b) => b.start_date.localeCompare(a.start_date))
            localStorage.removeItem('solenn_cycle_start')
          }
        }
        cachePeriods(list)
        // Symptômes du jour
        const { data: sym } = await supabase
          .from('cycle_symptoms')
          .select('symptoms')
          .eq('user_id', userId)
          .eq('date', todayStr())
          .maybeSingle()
        if (sym?.symptoms) {
          setSymptoms(sym.symptoms)
          localStorage.setItem('solenn_cycle_symptoms_today', JSON.stringify(sym.symptoms))
        }
      } catch { /* hors-ligne : on garde le cache local */ }
    })()
  }, [userId])

  const stats = useMemo(() => computeStats(periods), [periods])
  const PHASES = useMemo(() => buildPhases(stats.cycleLength, stats.periodLength), [stats])

  const lastPeriod = periods[0] || null
  const cycleInfo = useMemo(() => {
    if (!lastPeriod) return null
    const dayDiff = daysBetween(lastPeriod.start_date, todayStr())
    if (dayDiff < 0) return null
    const dayInCycle = Math.min(dayDiff + 1, stats.cycleLength)
    const phase = PHASES.find(p => dayInCycle >= p.days[0] && dayInCycle <= p.days[1]) || PHASES[3]
    const nextStart = new Date(parseDate(lastPeriod.start_date).getTime() + stats.cycleLength * DAY_MS)
    const nextStr = `${nextStart.getFullYear()}-${String(nextStart.getMonth() + 1).padStart(2, '0')}-${String(nextStart.getDate()).padStart(2, '0')}`
    const daysUntilNext = daysBetween(todayStr(), nextStr)
    // Règles en cours = pas de date de fin et on est dans la fenêtre des règles
    const ongoing = !lastPeriod.end_date && dayDiff + 1 <= Math.max(stats.periodLength + 3, 8)
    return { dayInCycle: dayDiff + 1, phase, nextStr, daysUntilNext, ongoing }
  }, [lastPeriod, stats, PHASES])
  const currentPhase = cycleInfo?.phase

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function logPeriodStart(dateStr) {
    if (periods.some(p => p.start_date === dateStr)) { setShowPicker(false); return }
    const local = { id: `local-${dateStr}`, start_date: dateStr, end_date: null }
    const list = [local, ...periods].sort((a, b) => b.start_date.localeCompare(a.start_date))
    cachePeriods(list)
    setShowPicker(false)
    if (!userId) return
    try {
      const { data } = await supabase
        .from('cycle_periods')
        .upsert({ user_id: userId, start_date: dateStr }, { onConflict: 'user_id,start_date' })
        .select('id, start_date, end_date')
      if (data?.length) {
        cachePeriods(list.map(p => p.start_date === dateStr ? data[0] : p))
      }
    } catch { /* sync au prochain chargement */ }
  }

  async function logPeriodEnd() {
    if (!lastPeriod) return
    const end = todayStr()
    cachePeriods(periods.map(p => p.start_date === lastPeriod.start_date ? { ...p, end_date: end } : p))
    if (!userId || String(lastPeriod.id).startsWith('local-')) return
    try {
      await supabase.from('cycle_periods').update({ end_date: end }).eq('id', lastPeriod.id).eq('user_id', userId)
    } catch { /* sync au prochain chargement */ }
  }

  async function deletePeriod(period) {
    cachePeriods(periods.filter(p => p.start_date !== period.start_date))
    if (!userId || String(period.id).startsWith('local-')) return
    try {
      await supabase.from('cycle_periods').delete().eq('id', period.id).eq('user_id', userId)
    } catch { /* ignore */ }
  }

  async function toggleSymptom(s) {
    const updated = symptoms.includes(s) ? symptoms.filter(x => x !== s) : [...symptoms, s]
    setSymptoms(updated)
    localStorage.setItem('solenn_cycle_symptoms_today', JSON.stringify(updated))
    if (!userId) return
    try {
      await supabase.from('cycle_symptoms').upsert(
        { user_id: userId, date: todayStr(), symptoms: updated, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      )
    } catch { /* ignore */ }
  }

  // Historique des cycles : durée réelle entre débuts consécutifs
  const history = useMemo(() => (
    periods.slice(0, 8).map((p, i) => ({
      ...p,
      length: i + 1 < periods.length ? daysBetween(periods[i + 1].start_date, p.start_date) : null,
    }))
  ), [periods])

  const btnPrimary = {
    padding: '12px 18px',
    background: 'rgba(255,235,210,0.32)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    color: '#B2663E', border: '1px solid rgba(255,220,160,0.38)',
    borderRadius: 14, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: F,
  }
  const btnGhost = {
    padding: '12px 18px',
    background: 'rgba(255,235,210,0.14)',
    color: am(0.85), border: '1px solid rgba(255,220,160,0.30)',
    borderRadius: 14, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: F,
  }

  return (
    <div style={{ padding: '16px 16px 120px', fontFamily: F, maxWidth: 480, margin: '0 auto' }}>

      {/* ── Prédiction / état du jour ── */}
      {cycleInfo && (
        <div style={{ ...CARD, marginBottom: 16 }}>
          <div style={LABEL}>Ton cycle</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: am(0.95), lineHeight: 1 }}>
              Jour {cycleInfo.dayInCycle}
            </span>
            <span style={{ fontSize: 12, color: am(0.55) }}>
              / cycle de {stats.cycleLength} j
            </span>
          </div>
          <div style={{ fontSize: 13, color: am(0.75), lineHeight: 1.55 }}>
            {cycleInfo.daysUntilNext > 1 && `Prochaines règles estimées dans ${cycleInfo.daysUntilNext} jours, autour du ${fmtDate(cycleInfo.nextStr)}.`}
            {cycleInfo.daysUntilNext === 1 && `Prochaines règles estimées demain.`}
            {cycleInfo.daysUntilNext === 0 && `Tes règles sont attendues aujourd'hui.`}
            {cycleInfo.daysUntilNext < 0 && `Tes règles étaient attendues le ${fmtDate(cycleInfo.nextStr)}. Pense à enregistrer leur arrivée.`}
          </div>
          <div style={{ fontSize: 11, color: am(0.45), marginTop: 8 }}>
            {stats.realCycles > 0
              ? `Estimation basée sur tes ${stats.realCycles + 1} derniers cycles enregistrés`
              : 'Estimation par défaut (28 j) — elle s\'affinera à chaque cycle enregistré'}
          </div>
        </div>
      )}

      {/* ── Actions règles ── */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={LABEL}>Tes règles</div>
        {!showPicker ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {cycleInfo?.ongoing ? (
              <button onClick={logPeriodEnd} style={btnPrimary}>Mes règles sont terminées</button>
            ) : (
              <button onClick={() => logPeriodStart(todayStr())} style={btnPrimary}>
                Mes règles commencent aujourd'hui
              </button>
            )}
            <button onClick={() => { setPickDate(todayStr()); setShowPicker(true) }} style={btnGhost}>
              Elles ont commencé un autre jour
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="date"
              value={pickDate}
              max={todayStr()}
              onChange={e => setPickDate(e.target.value)}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 14,
                background: 'rgba(255,235,210,0.15)',
                border: '1px solid rgba(255,220,160,0.30)',
                color: am(0.90), fontSize: 16, fontFamily: F,
                outline: 'none', colorScheme: 'dark',
              }}
            />
            <button onClick={() => pickDate && logPeriodStart(pickDate)} style={{ ...btnPrimary, flexShrink: 0 }}>
              Enregistrer
            </button>
            <button onClick={() => setShowPicker(false)} style={{ ...btnGhost, padding: '12px 14px', flexShrink: 0 }}>
              ✕
            </button>
          </div>
        )}
      </div>

      {currentPhase ? (
        <>
          {/* ── Frise des phases (adaptée au cycle réel) ── */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ ...LABEL, marginBottom: 14 }}>Phases du cycle</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {PHASES.map((p) => {
                const active = currentPhase.id === p.id
                const span = Math.max(1, p.days[1] - p.days[0] + 1)
                return (
                  <div key={p.id} style={{
                    flex: span,
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

          {/* ── Phase actuelle ── */}
          <AnimatePresence mode="wait">
            <motion.div key={currentPhase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                ...CARD,
                background: currentPhase.bgColor.replace('0.12', '0.18'),
                border: `1px solid ${currentPhase.color.replace(/0\.\d+\)$/, '0.35)')}`,
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

              {/* Conseils */}
              <div style={{ ...CARD, marginBottom: 16 }}>
                <div style={LABEL}>Conseils du moment</div>
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

              {/* ── J'ai mal — explorateur guidé ── */}
              <DouleurExplorer onChat={onChat} phaseNom={currentPhase?.name || currentPhase?.nom || null} />

              {/* Symptômes du jour */}
              <div style={{ ...CARD, marginBottom: 16 }}>
                <div style={LABEL}>Symptômes aujourd'hui</div>
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
          </AnimatePresence>

          {/* ── Historique des cycles ── */}
          {periods.length > 1 && (
            <div style={{ ...CARD }}>
              <button
                onClick={() => setShowHistory(h => !h)}
                style={{
                  display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: F,
                }}
              >
                <span style={{ ...LABEL, marginBottom: 0 }}>Historique · {periods.length} cycles</span>
                <span style={{ fontSize: 12, color: am(0.55), transform: showHistory ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
              </button>
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                      {history.map(p => (
                        <div key={p.start_date} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px', borderRadius: 12,
                          background: 'rgba(255,235,210,0.10)',
                          border: '1px solid rgba(255,220,160,0.16)',
                        }}>
                          <span style={{ fontSize: 13, color: am(0.82), fontWeight: 500 }}>
                            {fmtDate(p.start_date)}
                            {p.end_date && <span style={{ color: am(0.50), fontWeight: 400 }}> → {fmtDate(p.end_date)}</span>}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.length && (
                              <span style={{ fontSize: 11, color: am(0.55) }}>{p.length} j</span>
                            )}
                            <button
                              onClick={() => deletePeriod(p)}
                              title="Supprimer cette entrée"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: am(0.40), fontSize: 13, padding: 2, lineHeight: 1,
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        /* ── État vide : aucun cycle enregistré ── */
        <motion.div key="empty"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ ...CARD, textAlign: 'center', padding: '40px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <MoonIcon size={36} color="rgba(200,123,82,0.75)" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: am(0.90), marginBottom: 8, fontFamily: "'Poppins', sans-serif" }}>
            Une seule question pour démarrer :
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: am(0.85), marginBottom: 8 }}>
            Quand ont commencé tes dernières règles ?
          </div>
          <div style={{ fontSize: 12.5, color: am(0.60), lineHeight: 1.6 }}>
            Réponds avec un des boutons juste au-dessus — c'est aujourd'hui, ou tu choisis la date. À partir de là, Solenn apprend TON cycle et te prévient avant tes prochaines règles.
          </div>
        </motion.div>
      )}
    </div>
  )
}
