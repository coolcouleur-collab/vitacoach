import React, { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { WaterIcon, HeartIcon, MoodIcon, RunIcon, MoonIcon, SadIcon, NeutralIcon, HappyIcon, StarIcon, CalendarIcon, SparkleIcon } from './Icons'
import RapportHebdo from './RapportHebdo'
import Challenge21j from './Challenge21j'
import TesProgres from './TesProgres'
import ProgressionProgramme from './ProgressionProgramme'
import { authHeaders } from './supabase'
import { AMBRE, ENCRE, ICONE, ROUGE } from './palette'

// hex → rgba helper
function h2r(hex, a) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

function ScaleIcon({ color = '#C87B52', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="3 3 18 19" fill="none">
      <path d="M12 5v15M5 10l7-5 7 5M7 20h10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 14l3 4M19 14l-3 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const METRICS = [
  { key: 'pas',     label: 'Pas',            iconEl: <RunIcon size={18} color={ICONE} />,   unit: '',      goal: 10000, color: ENCRE, fmt: v => Math.round(v).toLocaleString('fr'), type: 'number', step: 100,  hint: 'Ex: 8500' },
  { key: 'sommeil', label: 'Sommeil',         iconEl: <MoonIcon size={18} color={ICONE} />,  unit: 'h',    goal: 8,     color: ENCRE, fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.5, hint: 'Ex: 7.5' },
  { key: 'eau',     label: 'Hydratation',     iconEl: <WaterIcon size={18} color={ICONE} />, unit: ' v.',  goal: 8,     color: ENCRE, fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Verres d\'eau' },
  { key: 'fc',      label: 'Fréq. Cardiaque', iconEl: <HeartIcon size={18} color={ICONE} />, unit: ' bpm', goal: 70,    color: ENCRE, fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Ex: 68' },
  { key: 'humeur',  label: 'Humeur',          iconEl: <MoodIcon size={18} color={ICONE} />,  unit: '/5',   goal: 5,     color: ENCRE, fmt: v => v,                                  type: 'range',  step: 1,   hint: '1 = difficile, 5 = excellent' },
  { key: 'poids',   label: 'Poids',           iconEl: <ScaleIcon size={18} color={ICONE} />, unit: ' kg',  goal: null,  color: ENCRE, fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.1, hint: 'Ex: 72.5' },
]

const HUMEUR_ICONS = [null,
  <SadIcon size={20} color={ICONE} />,
  <SadIcon size={20} color={ICONE} />,
  <NeutralIcon size={20} color={ICONE} />,
  <HappyIcon size={20} color={ICONE} />,
  <HappyIcon size={20} color={ICONE} />,
]

function scoreJour(m) {
  let s = 0
  if (m.pas  >= 10000) s += 20; else if (m.pas >= 7000) s += 15; else if (m.pas >= 5000) s += 10; else if (m.pas >= 2000) s += 5
  if (m.sommeil >= 7.5) s += 25; else if (m.sommeil >= 6) s += 18; else if (m.sommeil >= 5) s += 10; else if (m.sommeil > 0) s += 5
  if (m.eau >= 8) s += 20; else if (m.eau >= 6) s += 15; else if (m.eau >= 4) s += 10; else if (m.eau > 0) s += 5
  if (m.humeur === 5) s += 20; else if (m.humeur === 4) s += 15; else if (m.humeur === 3) s += 10; else if (m.humeur > 0) s += 5
  if (m.fc >= 50 && m.fc <= 80) s += 15; else if (m.fc > 0 && m.fc <= 100) s += 8
  return Math.min(s, 100)
}

// ─── SPARKLINE 7 JOURS ────────────────────────────────────────────────────────
function Sparkline({ history, metricKey, color, goal, onLog }) {
  const last7 = (() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toDateString()
      const entry = history?.find(h => h.date === d)
      days.push({ val: entry?.[metricKey] || 0, date: d })
    }
    return days
  })()
  const maxVal = Math.max(...last7.map(d => d.val), goal || 1)
  const hasData = last7.some(d => d.val > 0)
  // État vide ACTIONNABLE : « Pas encore de données » ne faisait que constater
  // un manque, sur quatre cartes à la fois. On propose maintenant le geste qui
  // le comble (retour Jean 2026-08-08).
  if (!hasData) return (
    <button
      onClick={e => { e.stopPropagation(); onLog?.(metricKey) }}
      style={{
        width:'100%', marginTop:8, padding:'9px 0', borderRadius:10, cursor:'pointer',
        background:`${color}14`, border:`1px dashed ${color}55`,
        fontFamily:'Poppins,sans-serif', fontSize:10.5, fontWeight:600, color:`${color}`,
      }}>
      + Ajouter
    </button>
  )
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:36, marginTop:8 }}>
      {last7.map((d, i) => {
        const pct = maxVal > 0 ? Math.max((d.val / maxVal) * 100, d.val > 0 ? 5 : 0) : 0
        const isToday = i === 6
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{
              width:'100%', height:`${pct}%`, minHeight: d.val > 0 ? 4 : 2,
              background: d.val > 0
                ? isToday ? `linear-gradient(to top, ${color}, ${color}cc)` : `${color}55`
                : 'rgba(0,0,0,0.05)',
              borderRadius:'12px 12px 0 0',
              boxShadow: isToday && d.val > 0 ? `0 0 8px ${color}60` : 'none',
              transition:'height 0.5s ease',
            }} />
          </div>
        )
      })}
    </div>
  )
}

// ─── HISTORIQUE SECTION ────────────────────────────────────────────────────────
function HistoriqueSection({ history, onLog }) {
  const [open, setOpen] = useState(false)
  const metricsToShow = [
    { key:'pas',     label:'Pas',     color:ENCRE, goal:10000 },
    { key:'sommeil', label:'Sommeil', color:ENCRE, goal:8 },
    { key:'eau',     label:'Eau',     color:ENCRE, goal:8 },
    { key:'humeur',  label:'Humeur',  color:ENCRE, goal:5 },
  ]
  return (
    <div style={{
      background:'rgba(255,235,210,0.22)', border:'1.5px solid rgba(255,220,160,0.28)', borderRadius:20,
      overflow:'hidden', marginBottom:14,
      backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
    }}>
      <button
        style={{ width:'100%', background:'transparent', border:'none', padding:'16px 18px',
          display:'flex', alignItems:'center', gap:12, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
        onClick={() => setOpen(v => !v)}
      >
        <div style={{ width:38, height:38, borderRadius:12, flexShrink:0,
          background:'rgba(200,123,82,0.12)',
          border:'1.5px solid rgba(200,123,82,0.22)',
          display:'flex', alignItems:'center', justifyContent:'center' }}><CalendarIcon size={18} color={ICONE} /></div>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, fontWeight:600, color:ENCRE }}>Historique 7 jours</div>
          <div style={{ fontSize:11, color:ENCRE, marginTop:1 }}>Progression de tes métriques</div>
        </div>
        <div style={{
          fontSize:10, fontWeight:700, color:ENCRE,
          background:'rgba(200,123,82,0.08)', padding:'4px 10px', borderRadius:12,
          border:'1px solid rgba(200,123,82,0.16)',
          transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.28s ease',
        }}>▼</div>
      </button>
      {open && (
        <div style={{ padding:'4px 18px 18px', borderTop:'1px solid rgba(255,220,160,0.28)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:12 }}>
            {metricsToShow.map(m => (
              <div key={m.key} style={{
                background:`${m.color}08`, border:`1px solid ${m.color}20`,
                borderRadius:12, padding:'12px 14px',
              }}>
                <div style={{ fontSize:10, color:m.color, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>
                  {m.label}
                </div>
                <Sparkline history={history} metricKey={m.key} color={m.color} goal={m.goal} onLog={onLog} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ fontSize:9, color:ENCRE }}>il y a 6j</span>
                  <span style={{ fontSize:9, color:m.color, fontWeight:700 }}>Aujourd'hui</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CAROUSEL CARD ────────────────────────────────────────────────────────────
function CarouselCard({ item, index, trackX, cardW, gap }) {
  const ACCENTS = ['#C87B52', '#C87B52', '#C87B52', '#C87B52', '#C87B52', '#C87B52']
  const accent  = ACCENTS[index % ACCENTS.length]
  const slotW   = cardW + gap

  // Parallax: inner content shifts slightly relative to card motion
  const contentX = useTransform(trackX, v => (v + index * slotW) * 0.12)

  const msg      = item.message || ''
  const numMatch = msg.match(/(\d+[\s,.]?\d*\s*(?:kg|h|min|bpm|verres?|pas|%|kcal|heures?)?)/i)
  const bigStat  = numMatch ? numMatch[0].trim() : null
  const sentences = msg.split(/(?<=[.!?])\s+/).filter(Boolean)
  const punchline = sentences[0] || ''
  const action    = sentences[1] || ''

  return (
    <div className="lg-card" style={{
      width: cardW, flexShrink: 0, borderRadius: 20, overflow: 'hidden',
      background: 'rgba(255,235,210,0.22)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(255,255,255,0.18)`,
      userSelect: 'none',
    }}>
      <motion.div style={{ x: contentX, padding: '20px 20px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', marginBottom: 8 }}><SparkleIcon size={22} color={accent} /></div>
        {item.titre && (
          <div style={{ fontSize: 9, fontWeight: 700, color: h2r(accent, 0.70), letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 5 }}>
            {item.titre}
          </div>
        )}
        {bigStat && (
          <div style={{ fontSize: 38, fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: '-1.5px', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
            {bigStat}
          </div>
        )}
        <div style={{
          fontSize: bigStat ? 12 : 13, fontWeight: 600, color: ENCRE, lineHeight: 1.4,
          marginBottom: action ? 10 : 0,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {bigStat ? punchline.replace(numMatch[0], '').trim() : punchline}
        </div>
        {action && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: h2r(accent, 0.10), border: `1px solid ${h2r(accent, 0.22)}`,
            borderRadius: 99, padding: '5px 12px',
            fontSize: 10.5, fontWeight: 700, color: accent, letterSpacing: '0.03em',
            alignSelf: 'flex-start', maxWidth: '100%', overflow: 'hidden',
          }}>
            <span style={{ flexShrink: 0 }}>↗</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {action.replace(/[.!?]$/, '')}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── INSIGHTS CAROUSEL ────────────────────────────────────────────────────────
function InsightsCarousel({ insights, onClose }) {
  const items   = insights.insights || insights.points || []
  const ACCENTS = ['#C87B52', '#C87B52', '#C87B52', '#C87B52', '#C87B52', '#C87B52']
  const [activeIdx, setActiveIdx] = useState(0)
  const containerRef = useRef(null)
  const [cardW, setCardW] = useState(260)
  const GAP = 14

  useEffect(() => {
    if (containerRef.current) {
      setCardW(containerRef.current.offsetWidth - 30)
    }
  }, [])

  const rawX  = useMotionValue(0)
  const slotW = cardW + GAP
  const maxDrag = -((items.length - 1) * slotW)

  function snapTo(i) {
    const clamped = Math.max(0, Math.min(i, items.length - 1))
    animate(rawX, -(clamped * slotW), { type: 'spring', damping: 28, stiffness: 220, mass: 0.8 })
    setActiveIdx(clamped)
  }

  function onDragEnd(_, info) {
    let newIdx = activeIdx
    if (Math.abs(info.velocity.x) > 400) {
      newIdx = info.velocity.x < 0
        ? Math.min(activeIdx + 1, items.length - 1)
        : Math.max(activeIdx - 1, 0)
    } else {
      newIdx = Math.max(0, Math.min(Math.round(-rawX.get() / slotW), items.length - 1))
    }
    snapTo(newIdx)
  }

  return (
    <div>
      {/* ── Header : pills + compteur + fermeture ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {items.map((_, i) => (
            <div key={i} onClick={() => snapTo(i)} style={{
              height: 4, borderRadius: 99, cursor: 'pointer',
              width: i === activeIdx ? 22 : 7,
              background: i <= activeIdx ? ACCENTS[i % ACCENTS.length] : 'rgba(200,123,82,0.15)',
              transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: ENCRE, fontWeight: 600, letterSpacing: '0.05em' }}>
            {activeIdx + 1} / {items.length}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: ENCRE, fontSize: 14, lineHeight: 1,
            padding: '3px 6px', borderRadius: 12, fontFamily: 'Poppins, sans-serif',
          }}>✕</button>
        </div>
      </div>

      {/* ── Piste draggable ── */}
      <div ref={containerRef} style={{ overflow: 'hidden', paddingLeft: 16 }}>
        <motion.div
          drag="x"
          style={{ display: 'flex', gap: GAP, x: rawX, cursor: 'grab' }}
          dragConstraints={{ left: maxDrag, right: 0 }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          whileTap={{ cursor: 'grabbing' }}
        >
          {items.map((item, i) => (
            <CarouselCard key={i} item={item} index={i} trackX={rawX} cardW={cardW} gap={GAP} />
          ))}
        </motion.div>
      </div>

      {/* ── Hint glisse ── */}
      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: ENCRE, letterSpacing: '0.08em', fontWeight: 500, fontFamily: 'Poppins,sans-serif' }}>
        ← glisse →
      </div>
    </div>
  )
}

// Le meme titre de section etait recopie a l'identique a chaque usage. Un
// role, un endroit : c'est la regle qu'on vient de poser pour les couleurs,
// elle vaut aussi pour la mise en page.
function SousTitre({ children, premier = false }) {
  return (
    <>
      {!premier && <div style={{ height: 1, background: 'rgba(200,123,82,0.14)', margin: '26px 4px 18px' }} />}
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: ENCRE, fontFamily: 'Poppins,sans-serif', marginBottom: 12 }}>
        {children}
      </div>
    </>
  )
}

export default function SanteTab({ metriques, profil, onUpdate, score, history = [], userId, isPro, onPasserPro }) {
  const [editMode, setEditMode]           = useState(null)
  const [tempVal, setTempVal]             = useState('')
  const [insights, setInsights]           = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [showApple, setShowApple]         = useState(false)
  const [displayScore, setDisplayScore]   = useState(0)
  const animRef    = useRef(null)
  const prevScoreRef = useRef(0)

  const scoreColor = score > 0 ? '#C87B52' : 'rgba(200,123,82,0.72)'
  const scoreTrack = 'rgba(200,123,82,0.10)'
  const scoreLabel = score >= 80 ? 'Excellent !' : score >= 60 ? 'Bonne forme' : score >= 40 ? 'En progression' : score > 0 ? 'À améliorer' : 'Commence !'
  const labelColor = scoreColor
  const circumference = 2 * Math.PI * 52
  const dash  = (score / 100) * circumference
  const angle = (score / 100) * 2 * Math.PI
  const tipX  = 60 + 52 * Math.cos(angle)
  const tipY  = 60 + 52 * Math.sin(angle)

  function openEdit(key) {
    setEditMode(key)
    const cur = metriques[key]
    setTempVal(cur > 0 ? cur.toString() : '')
  }

  function submitEdit() {
    const m = METRICS.find(m => m.key === editMode)
    if (!m) return
    const val = m.type === 'range' ? parseInt(tempVal) : parseFloat(tempVal)
    if (!isNaN(val) && val >= 0) onUpdate(editMode, val)
    setEditMode(null); setTempVal('')
  }

  function addWater() {
    onUpdate('eau', Math.min((metriques.eau || 0) + 1, 20))
    if (window?.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light })
      }).catch(() => {})
    }
  }

  async function getInsights() {
    setLoadingInsights(true)
    try {
      const res = await fetch('/api/health-insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ metriques, profil })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data?.insights) && !Array.isArray(data?.points)) throw new Error('Réponse invalide')
      setInsights(data)
    } catch (err) {
      console.error('health-insights error:', err)
      setInsights({ insights: [{ titre: 'Erreur', message: 'Impossible de générer l\'analyse. Vérifie ta connexion ou réessaie.' }] })
    } finally {
      setLoadingInsights(false)
    }
  }

  // ── Count-up animation ───────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true
    const from = prevScoreRef.current
    const to   = score || 0
    if (from === to) { setDisplayScore(to); return }
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const duration = 900
    const start    = performance.now()
    function step(now) {
      if (!alive) return
      const t      = Math.min((now - start) / duration, 1)
      const eased  = 1 - Math.pow(1 - t, 3)              // easeOutCubic
      setDisplayScore(Math.round(from + (to - from) * eased))
      if (t < 1) { animRef.current = requestAnimationFrame(step) }
      else { prevScoreRef.current = to }
    }
    animRef.current = requestAnimationFrame(step)
    return () => {
      alive = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score])

  const editMetric = METRICS.find(m => m.key === editMode)

  // Poids : delta vs hier
  const yesterday  = new Date(Date.now() - 86400000).toDateString()
  const prevPoids  = history?.find(h => h.date === yesterday)?.poids || 0

  return (
    <div style={{ paddingBottom: 20, paddingTop: 16 }}>
      <style>{`
        @keyframes iaGlow {
          0%,100% { box-shadow: 0 0 0 0px rgba(200,123,82,0), 0 4px 18px rgba(200,123,82,0.12); }
          50%     { box-shadow: 0 0 0 5px rgba(200,123,82,0.18), 0 4px 26px rgba(200,123,82,0.35); }
        }
        .ia-glow { animation: iaGlow 2.8s ease-in-out infinite; }

        @keyframes scoreBreath {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.85; }
        }
        @keyframes tipPulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1;    }
        }
        @keyframes tipRing {
          0%   { r: 5;  opacity: 0.7; }
          50%  { r: 8;  opacity: 0;   }
          100% { r: 5;  opacity: 0;   }
        }

        /* ── Liquid Glass Card ── */
        .lg-card { position: relative; isolation: isolate; }

        /* Highlight interne haut-gauche, simule la réfraction lumineuse */
        .lg-card::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: inherit;
          background: linear-gradient(145deg,
            rgba(255,235,210,0.12) 0%,
            rgba(255,235,210,0.04) 45%,
            rgba(255,235,210,0.08) 100%
          );
          pointer-events: none;
          z-index: 1;
        }

        /* Bordure chaude, dégradé de la charte */
        .lg-card::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(130deg,
            rgba(200,123,82,0.55)  0%,
            rgba(232,150,42,0.38) 18%,
            rgba(200,123,82,0.42) 38%,
            rgba(232,150,42,0.52) 62%,
            rgba(200,123,82,0.42) 82%,
            rgba(232,150,42,0.55) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 2;
        }
      `}</style>

      <SousTitre premier>Aujourd'hui</SousTitre>

      {/* ── Score Card ── */}

      {score > 0 && (
        <div style={ss.scoreCard}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={`${scoreColor}55`} />
                  <stop offset="100%" stopColor={scoreColor} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke={scoreTrack} strokeWidth="10"
                style={{ animation: 'scoreBreath 3.2s ease-in-out infinite' }} />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ transition: 'stroke-dasharray 1.2s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 5px ${scoreColor}40)` }} />
              <circle cx={tipX} cy={tipY} r="5" fill="none" stroke={scoreColor} strokeWidth="2"
                style={{ animation: 'tipRing 2s ease-out infinite', transformOrigin: `${tipX}px ${tipY}px` }} />
              <circle cx={tipX} cy={tipY} r="5" fill={scoreColor}
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor})`, animation: 'tipPulse 2s ease-in-out infinite' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{displayScore}</div>
              <div style={{ fontSize: 9, color: ENCRE, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>/ 100</div>
              <div style={{ fontSize: 8, color: ENCRE, letterSpacing: '0.3px', marginTop: 3, fontWeight: 500 }}>
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: labelColor }}>{scoreLabel}</div>
          </div>
        </div>
      )}

      {/* ── Quick Water Bar ── */}
      <div style={ss.waterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ display:'flex', filter: 'drop-shadow(0 2px 6px rgba(200,123,82,0.45))' }}><WaterIcon size={24} color={ICONE} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: ENCRE, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>
              <span style={{display:'flex',alignItems:'center',gap:5}}><WaterIcon size={11} color={ICONE} />Hydratation du jour</span>
            </div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 14, borderRadius: 7,
                  background: i < (metriques.eau || 0)
                    ? 'linear-gradient(180deg, rgba(232,150,42,0.9), rgba(200,123,82,0.9))'
                    : 'rgba(200,123,82,0.10)',
                  boxShadow: i < (metriques.eau || 0)
                    ? '0 3px 8px rgba(200,123,82,0.30), inset 0 1px 0 rgba(255,255,255,0.5)'
                    : 'none',
                  transition: 'all 0.3s ease',
                  border: i < (metriques.eau || 0) ? 'none' : '1px solid rgba(255,220,160,0.28)'
                }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: ENCRE, fontWeight: 800, letterSpacing: -0.3 }}>
              {metriques.eau || 0}<span style={{ fontSize: 11, fontWeight: 500, color: ENCRE }}> / 8 verres d'eau</span>
            </div>
          </div>
        </div>
        <button
          style={ss.btnWater}
          onClick={addWater}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          +1 verre
        </button>
      </div>

      {/* ── Metrics Grid ── */}
      <div style={ss.grid}>
        {METRICS.map(m => {
          const val = metriques[m.key] || 0
          const goal = m.goal || (profil?.poids || 70)
          const pct = Math.min((val / goal) * 100, 100)
          const done = pct >= 100
          return (
            <div key={m.key}
              style={{
                ...ss.metricCard,
                background: 'rgba(255,235,210,0.22)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,220,160,0.28)',
                borderTop: '2.5px solid #C87B52',
                boxShadow: done
                  ? '0 6px 20px rgba(200,123,82,0.28), 0 2px 6px rgba(0,0,0,0.05)'
                  : '0 4px 14px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
              }}
              onClick={() => openEdit(m.key)}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: `${m.color}22`,
                  border: `1.5px solid ${m.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: done ? `0 2px 8px ${m.color}40` : `0 1px 4px ${m.color}20`,
                }}>{m.iconEl}</div>
                {done && (
                  <span style={{
                    fontSize: 9, color: '#fff',
                    background: m.color,
                    padding: '3px 8px', borderRadius: 12, fontWeight: 800,
                    boxShadow: `0 2px 8px ${m.color}50`
                  }}>✓</span>
                )}
              </div>
              <div style={{
                fontSize: val > 0 ? 32 : 22,
                fontWeight: val > 0 ? 800 : 300,
                color: ENCRE,
                lineHeight: 1, marginBottom: 3,
                textShadow: val > 0 ? `0 2px 12px ${m.color}40` : 'none',
                letterSpacing: val > 0 ? 'normal' : 2,
              }}>
                {val > 0 ? m.fmt(val) : '–'}
                {val > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: ENCRE, marginLeft: 4 }}>{m.unit}</span>}
              </div>
              {/* Un tiret ne dit pas quoi faire. La frequence cardiaque et le
                  poids restaient vides indefiniment quand aucune montre n'est
                  connectee, sans jamais proposer la saisie manuelle qui existe
                  pourtant (constat 2026-08-12). */}
              {val === 0 && (
                <div style={{ fontSize: 10, color: ENCRE, fontWeight: 600, marginBottom: 6 }}>
                  {m.key === 'fc' ? 'Connecte ta montre ou saisis-la' : 'Appuie pour ajouter'}
                </div>
              )}
              <div style={{ fontSize: 11, color: ENCRE, marginBottom: m.key === 'poids' && val > 0 && prevPoids > 0 ? 4 : 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                {m.label}
                {m.key === 'humeur' && val > 0 && <span style={{ display:'flex', alignItems:'center' }}>{HUMEUR_ICONS[val]}</span>}
              </div>
              {m.key === 'poids' && val > 0 && prevPoids > 0 && (() => {
                const delta  = parseFloat((val - prevPoids).toFixed(1))
                const up     = delta > 0
                const same   = delta === 0
                return (
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8,
                    color: same ? 'rgba(200,123,82,0.60)' : up ? 'rgba(200,123,82,0.90)' : 'rgba(200,123,82,0.75)' }}>
                    {same ? '= même poids' : `${up ? '▲ +' : '▼ '}${Math.abs(delta)} kg vs hier`}
                  </div>
                )
              })()}
              {m.key !== 'poids' && m.key !== 'fc' && (
                <div style={{ height: 5, background: h2r(m.color, 0.28), borderRadius: 99, overflow: 'visible', position: 'relative', marginTop: 6 }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${m.color}99, ${m.color})`,
                    borderRadius: 99,
                    transition: 'width 0.7s cubic-bezier(.34,1.56,.64,1)',
                    position: 'relative',
                    boxShadow: `0 0 8px ${m.color}70`,
                  }}>
                    {pct > 5 && (
                      <div style={{
                        position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)',
                        width: 7, height: 7, borderRadius: '50%',
                        background: m.color,
                        boxShadow: `0 0 8px ${m.color}`,
                      }} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Sous les cartes du jour, la page se lit du plus court au plus
           long terme : TA SEMAINE (le bilan) → SUR LA DURÉE (les progrès
           mesures) → le detail brut (historique). Avant, les progres longue
           duree arrivaient AVANT le bilan de la semaine et les blocs se
           suivaient sans respiration ni hierarchie : brouillon
           (constat Jean 2026-08-12). ── */}
      <SousTitre>Ta semaine</SousTitre>
      {userId && (
        <div style={{ marginBottom: 22 }}>
          <RapportHebdo userId={userId} isPro={isPro} onPasserPro={onPasserPro} />
        </div>
      )}

      <SousTitre>Sur la durée</SousTitre>
      {/* La progression du programme arrive de l'onglet Programmes, ou elle
          repondait a « ou j'en suis ? » au milieu d'un ecran qui repond a
          « qu'est-ce que je fais aujourd'hui ? ». Deux questions qu'on ne se
          pose pas au meme moment. */}
      <ProgressionProgramme userId={userId} />
      <TesProgres history={history} userId={userId} />
      <SousTitre>Le détail</SousTitre>
      <HistoriqueSection history={history} onLog={openEdit} />

      {/* ── Sections retirées le 2026-07-24 pour alléger la page (décision Jean) :
           « Conseils personnalisés » → remplacés par Tes progrès + insights ;
           « Appareils connectés » (ConnexionsSante) → accessible dans Réglages. ── */}

      {/* ── Le défi 21 jours vit désormais dans Ma Routine (décision Jean
           2026-07-25) : Santé = bilan, Routine = exécution quotidienne ── */}

      {/* ── Edit Modal ── */}
      {editMode && editMetric && (
        <div style={ss.modalOverlay} onClick={() => setEditMode(null)}>
          <div style={ss.modalCard} onClick={e => e.stopPropagation()}>
            <div style={ss.modalHandle} />
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `linear-gradient(145deg, ${editMetric.color}20, ${editMetric.color}10)`,
              border: `2px solid ${editMetric.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, margin: '0 auto 12px',
              boxShadow: `0 6px 20px ${editMetric.color}25, inset 0 1px 0 rgba(255,255,255,0.8)`
            }}>{editMetric.iconEl}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: ENCRE, marginBottom: 4, textAlign: 'center' }}>
              {editMetric.label}
            </div>
            <div style={{ fontSize: 12, color: ENCRE, textAlign: 'center', marginBottom: 22 }}>
              {editMetric.hint}
            </div>

            {editMetric.type === 'range' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n}
                      style={{
                        ...ss.humeurBtn,
                        ...(parseInt(tempVal) === n ? {
                          background: `linear-gradient(145deg, ${editMetric.color}, ${editMetric.color}cc)`,
                          border: 'none',
                          transform: 'scale(1.12)',
                          boxShadow: `0 6px 18px ${editMetric.color}45, inset 0 1px 0 rgba(255,255,255,0.3)`
                        } : {})
                      }}
                      onClick={() => setTempVal(n.toString())}>
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>{HUMEUR_ICONS[n]}</span>
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, color: ENCRE, marginBottom: 22 }}>
                  {tempVal ? `Humeur ${tempVal}/5` : 'Sélectionne ton humeur'}
                </div>
              </div>
            ) : (
              <input style={{ ...ss.modalInput, borderColor: `${editMetric.color}35` }}
                type="number" step={editMetric.step}
                value={tempVal}
                onChange={e => setTempVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitEdit()}
                placeholder={editMetric.hint}
                autoFocus
              />
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={ss.btnCancel} onClick={() => setEditMode(null)}>Annuler</button>
              <button
                style={{
                  ...ss.btnSave,
                  background: `linear-gradient(145deg, ${editMetric.color}, ${editMetric.color}cc)`,
                  boxShadow: `0 8px 24px ${editMetric.color}40, 0 4px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.25)`
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                onClick={submitEdit}>
                ✓ Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ss = {
  scoreCard: {
    background: 'rgba(255,235,210,0.22)',
    border: '1px solid rgba(255,220,160,0.28)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    borderRadius: 28, padding: '20px',
    display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14,
    overflow: 'visible',
  },
  btnInsights: {
    width: 'auto',
    background: 'rgba(255,235,210,0.32)',
    color: AMBRE,
    border: '1px solid rgba(255,220,160,0.28)',
    padding: '11px 34px',
    borderRadius: 100,
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    cursor: 'pointer', fontFamily: 'Poppins,sans-serif',
    transition: 'transform 0.15s ease',
  },
  insightsCard: {
    background: 'rgba(255,235,210,0.22)',
    border: '1px solid rgba(255,220,160,0.28)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    borderRadius: 20, padding: '14px 0 12px', marginBottom: 14,
  },
  waterBar: {
    background: 'rgba(255,235,210,0.22)',
    border: '1px solid rgba(255,220,160,0.28)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    borderRadius: 20, padding: '16px 18px', marginBottom: 14,
    display: 'flex', alignItems: 'center', gap: 12,
  },
  btnWater: {
    background: 'rgba(255,235,210,0.32)',
    border: '1px solid rgba(255,220,160,0.28)',
    color: AMBRE, borderRadius: 50, padding: '10px 18px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Poppins,sans-serif', flexShrink: 0,
    boxShadow: 'none',
    transition: 'transform 0.15s ease',
    letterSpacing: 0.2
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, padding: '0 2px' },
  metricCard: {
    borderRadius: 20, padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
  },
  appleSection: {
    background: 'rgba(255,235,210,0.22)',
    border: '1px solid rgba(255,220,160,0.28)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    borderRadius: 20, overflow: 'hidden',
  },
  appleTrigger: {
    width: '100%', background: 'transparent', border: 'none', padding: '16px 18px',
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'Poppins,sans-serif'
  },
  appleBody: { padding: '4px 18px 18px', borderTop: '1px solid rgba(255,220,160,0.28)' },
  appleStep: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10, paddingTop: 10 },
  appleStepNum: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'linear-gradient(145deg, rgba(200,123,82,0.20), rgba(200,123,82,0.10))',
    border: '1.5px solid rgba(200,123,82,0.30)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
    fontWeight: 900, color: ENCRE, flexShrink: 0, marginTop: 1,
    boxShadow: '0 3px 10px rgba(200,123,82,0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
  },
  modalCard: {
    background: 'rgba(40,20,5,0.94)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '28px 28px 0 0', padding: '10px 26px 48px', width: '100%', maxWidth: 520,
    boxShadow: '0 -12px 50px rgba(0,0,0,0.45)', border: '1px solid rgba(255,220,160,0.14)'
  },
  modalHandle: {
    width: 44, height: 5, background: 'rgba(255,220,160,0.22)', borderRadius: 12,
    margin: '12px auto 22px'
  },
  modalInput: {
    width: '100%', padding: '18px',
    borderRadius: 20,
    border: '1.5px solid rgba(255,220,160,0.28)', background: 'rgba(255,235,210,0.10)',
    fontSize: 32, fontFamily: 'Poppins,sans-serif', outline: 'none', color: ENCRE,
    boxSizing: 'border-box', textAlign: 'center', marginBottom: 22, fontWeight: 800,
    boxShadow: 'none'
  },
  humeurBtn: {
    width: 56, height: 56, borderRadius: 20,
    border: '1.5px solid rgba(255,220,160,0.22)',
    background: 'rgba(255,235,210,0.10)',
    fontSize: 28, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: 'none'
  },
  btnCancel: {
    flex: 1, padding: '15px', background: 'rgba(255,235,210,0.08)',
    border: '1px solid rgba(255,220,160,0.20)', borderRadius: 16, fontSize: 13,
    fontWeight: 700, cursor: 'pointer', color: ENCRE, fontFamily: 'Poppins,sans-serif',
    boxShadow: 'inset 0 1px 0 rgba(255,235,210,0.10)'
  },
  btnSave: {
    flex: 2, padding: '15px', border: 'none', borderRadius: 16, fontSize: 13,
    fontWeight: 800, cursor: 'pointer', color: '#fff', fontFamily: 'Poppins,sans-serif',
    transition: 'transform 0.15s ease',
    letterSpacing: 0.3
  },
}
