import React, { useState } from 'react'
import { WaterIcon, HeartIcon, MoodIcon, RunIcon, MoonIcon, LightbulbIcon, PhoneIcon, SadIcon, NeutralIcon, HappyIcon } from './Icons'

function ScaleIcon({ color = '#34c759', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="3 3 18 19" fill="none">
      <path d="M12 5v15M5 10l7-5 7 5M7 20h10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 14l3 4M19 14l-3 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const METRICS = [
  { key: 'pas',     label: 'Pas',            iconEl: <RunIcon size={18} color="#F59E0B" />,   unit: '',      goal: 10000, color: '#F59E0B', fmt: v => Math.round(v).toLocaleString('fr'), type: 'number', step: 100,  hint: 'Ex: 8500' },
  { key: 'sommeil', label: 'Sommeil',         iconEl: <MoonIcon size={18} color="#60A5FA" />,  unit: 'h',    goal: 8,     color: '#8B5CF6', fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.5, hint: 'Ex: 7.5' },
  { key: 'eau',     label: 'Hydratation',     iconEl: <WaterIcon size={18} color="#38bdf8" />, unit: ' v.',  goal: 8,     color: '#38bdf8', fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Verres d\'eau' },
  { key: 'fc',      label: 'Fréq. Cardiaque', iconEl: <HeartIcon size={18} color="#ff3b30" />, unit: ' bpm', goal: 70,    color: '#ff3b30', fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Ex: 68' },
  { key: 'humeur',  label: 'Humeur',          iconEl: <MoodIcon size={18} color="#fbbf24" />,  unit: '/5',   goal: 5,     color: '#fbbf24', fmt: v => v,                                  type: 'range',  step: 1,   hint: '1 = difficile, 5 = excellent' },
  { key: 'poids',   label: 'Poids',           iconEl: <ScaleIcon size={18} color="#34c759" />, unit: ' kg',  goal: null,  color: '#34c759', fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.1, hint: 'Ex: 72.5' },
]

const HUMEUR_ICONS = [null,
  <SadIcon size={20} color="#ef4444" />,
  <SadIcon size={20} color="#f97316" />,
  <NeutralIcon size={20} color="#eab308" />,
  <HappyIcon size={20} color="#22c55e" />,
  <HappyIcon size={20} color="#10b981" />,
]

export function scoreJour(m) {
  let s = 0
  if (m.pas  >= 10000) s += 20; else if (m.pas >= 7000) s += 15; else if (m.pas >= 5000) s += 10; else if (m.pas >= 2000) s += 5
  if (m.sommeil >= 7.5) s += 25; else if (m.sommeil >= 6) s += 18; else if (m.sommeil >= 5) s += 10; else if (m.sommeil > 0) s += 5
  if (m.eau >= 8) s += 20; else if (m.eau >= 6) s += 15; else if (m.eau >= 4) s += 10; else if (m.eau > 0) s += 5
  if (m.humeur === 5) s += 20; else if (m.humeur === 4) s += 15; else if (m.humeur === 3) s += 10; else if (m.humeur > 0) s += 5
  if (m.fc >= 50 && m.fc <= 80) s += 15; else if (m.fc > 0 && m.fc <= 100) s += 8
  return Math.min(s, 100)
}

// ─── SPARKLINE 7 JOURS ────────────────────────────────────────────────────────
function Sparkline({ history, metricKey, color, goal }) {
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
  if (!hasData) return (
    <div style={{ fontSize:10, color:'#c4b5a8', textAlign:'center', padding:'8px 0', fontStyle:'italic' }}>
      Pas encore de données — commence à logger !
    </div>
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
              borderRadius:'3px 3px 0 0',
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
function HistoriqueSection({ history }) {
  const [open, setOpen] = useState(false)
  const metricsToShow = [
    { key:'pas',     label:'Pas',     color:'#C87B52', goal:10000 },
    { key:'sommeil', label:'Sommeil', color:'#B06840', goal:8 },
    { key:'eau',     label:'Eau',     color:'#D4956A', goal:8 },
    { key:'humeur',  label:'Humeur',  color:'#9E5C35', goal:5 },
  ]
  return (
    <div style={{
      background:'rgba(255,255,255,0.28)', border:'1.5px solid rgba(200,123,82,0.12)', borderRadius:22,
      overflow:'hidden', marginBottom:14,
      backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
      boxShadow:'0 4px 20px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.75)',
    }}>
      <button
        style={{ width:'100%', background:'transparent', border:'none', padding:'16px 18px',
          display:'flex', alignItems:'center', gap:12, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}
        onClick={() => setOpen(v => !v)}
      >
        <div style={{ width:38, height:38, borderRadius:12, flexShrink:0,
          background:'rgba(200,123,82,0.12)',
          border:'1.5px solid rgba(200,123,82,0.22)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📈</div>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:13, fontWeight:800, color:'rgba(200,123,82,0.90)' }}>Historique 7 jours</div>
          <div style={{ fontSize:11, color:'rgba(200,123,82,0.55)', marginTop:1 }}>Progression de tes métriques</div>
        </div>
        <div style={{
          fontSize:10, fontWeight:700, color:'#C87B52',
          background:'rgba(200,123,82,0.10)', padding:'4px 10px', borderRadius:8,
          border:'1px solid rgba(200,123,82,0.20)',
          transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.28s ease',
        }}>▼</div>
      </button>
      {open && (
        <div style={{ padding:'4px 18px 18px', borderTop:'1px solid #f0e8e0' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:12 }}>
            {metricsToShow.map(m => (
              <div key={m.key} style={{
                background:`${m.color}08`, border:`1px solid ${m.color}20`,
                borderRadius:14, padding:'12px 14px',
              }}>
                <div style={{ fontSize:10, color:m.color, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>
                  {m.label}
                </div>
                <Sparkline history={history} metricKey={m.key} color={m.color} goal={m.goal} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ fontSize:9, color:'#c4b5a8' }}>il y a 6j</span>
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

export default function SanteTab({ metriques, profil, onUpdate, score, history = [] }) {
  const [editMode, setEditMode]           = useState(null)
  const [tempVal, setTempVal]             = useState('')
  const [insights, setInsights]           = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [showApple, setShowApple]         = useState(false)

  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#38bdf8' : score >= 40 ? '#f59e0b' : score > 0 ? '#ef4444' : '#C87B52'
  const scoreTrack = score >= 80 ? 'rgba(34,197,94,0.12)' : score >= 60 ? 'rgba(56,189,248,0.12)' : score >= 40 ? 'rgba(245,158,11,0.12)' : score > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(200,123,82,0.12)'
  const scoreLabel = score >= 80 ? 'Excellent !' : score >= 60 ? 'Bonne forme' : score >= 40 ? 'En progression' : score > 0 ? 'À améliorer' : 'Commence !'
  const circumference = 2 * Math.PI * 52
  const dash = (score / 100) * circumference

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

  function addWater() { onUpdate('eau', Math.min((metriques.eau || 0) + 1, 20)) }

  async function getInsights() {
    setLoadingInsights(true)
    try {
      const res = await fetch('/api/health-insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metriques, profil })
      })
      const data = await res.json()
      setInsights(data)
    } catch {}
    setLoadingInsights(false)
  }

  const editMetric = METRICS.find(m => m.key === editMode)

  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── Score Card ── */}
      <div style={ss.scoreCard}>
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={`${scoreColor}55`} />
                <stop offset="100%" stopColor={scoreColor} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="52" fill="none" stroke={scoreTrack} strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none"
              stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1.2s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 10px ${scoreColor}90)` }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: scoreColor, lineHeight: 1, textShadow: `0 2px 12px ${scoreColor}50` }}>{score || '—'}</div>
            <div style={{ fontSize: 9, color: '#c4b5a8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>/ 100</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 20, fontWeight: 900, marginBottom: 4,
            color: scoreColor,
          }}>{scoreLabel}</div>
          <div style={{ fontSize: 12, color: '#8a7265', lineHeight: 1.6, marginBottom: 14 }}>
            Score santé du jour · Mets à jour tes métriques pour l'améliorer
          </div>
          <button
            style={ss.btnInsights}
            onClick={getInsights}
            disabled={loadingInsights}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>{loadingInsights ? 'Analyse...' : 'Analyse IA personnalisée'}</span>
          </button>
        </div>
      </div>

      {/* ── AI Insights ── */}
      {insights && (
        <div style={ss.insightsCard}>
          <div style={{ fontWeight: 700, color: '#F97316', marginBottom: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LightbulbIcon size={14} color="#F97316" /> Analyse personnalisée
          </div>
          {insights.points?.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{p.emoji || '•'}</span>
              <div style={{ fontSize: 13, color: '#1a0a00', lineHeight: 1.65 }}>{p.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick Water Bar ── */}
      <div style={ss.waterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ display:'flex', filter: 'drop-shadow(0 2px 6px rgba(56,189,248,0.45))' }}><WaterIcon size={24} color="#38bdf8" /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'rgba(56,189,248,0.9)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>
              💧 Hydratation du jour
            </div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 14, borderRadius: 7,
                  background: i < (metriques.eau || 0)
                    ? 'linear-gradient(180deg, #7dd3fc, #38bdf8)'
                    : 'rgba(56,189,248,0.10)',
                  boxShadow: i < (metriques.eau || 0)
                    ? '0 3px 8px rgba(56,189,248,0.30), inset 0 1px 0 rgba(255,255,255,0.5)'
                    : 'none',
                  transition: 'all 0.3s ease',
                  border: i < (metriques.eau || 0) ? 'none' : '1px solid rgba(56,189,248,0.18)'
                }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 800, letterSpacing: -0.3 }}>
              {metriques.eau || 0}<span style={{ fontSize: 11, fontWeight: 500, color: '#7dd3fc' }}> / 8 verres d'eau</span>
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
      <div style={{ fontSize: 10, color: '#c4b5a8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, marginTop: 4, fontWeight: 700 }}>
        Métriques · Appuie pour modifier
      </div>
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
                background: `rgba(255,255,255,0.30)`,
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                borderTop: `2px solid rgba(200,123,82,0.25)`,
                border: `1px solid rgba(200,123,82,0.10)`,
                borderTopWidth: 2,
                boxShadow: done
                  ? `0 4px 16px rgba(200,123,82,0.12), inset 0 1px 0 rgba(255,255,255,0.80)`
                  : `0 2px 10px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.70)`,
              }}
              onClick={() => openEdit(m.key)}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ display:'flex', alignItems:'center', filter: done ? `drop-shadow(0 2px 4px ${m.color}60)` : 'none' }}>{m.iconEl}</span>
                {done && (
                  <span style={{
                    fontSize: 9, color: '#fff',
                    background: m.color,
                    padding: '3px 8px', borderRadius: 8, fontWeight: 800,
                    boxShadow: `0 2px 8px ${m.color}50`
                  }}>✓ OK</span>
                )}
                {!done && (
                  <span style={{
                    fontSize: 9, color: 'rgba(160,110,70,0.70)',
                    background: 'transparent',
                    padding: '2px 0', fontWeight: 500,
                    letterSpacing: '0.3px'
                  }}>modifier</span>
                )}
              </div>
              <div style={{
                fontSize: val > 0 ? 32 : 22,
                fontWeight: val > 0 ? 800 : 300,
                color: val > 0 ? `${m.color}99` : 'rgba(180,160,145,0.55)',
                lineHeight: 1, marginBottom: 3,
                textShadow: val > 0 ? `0 2px 10px ${m.color}20` : 'none',
                letterSpacing: val > 0 ? 'normal' : 2,
              }}>
                {val > 0 ? m.fmt(val) : '–'}
                {val > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: `${m.color}66`, marginLeft: 4 }}>{m.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#8a7265', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                {m.label}
                {m.key === 'humeur' && val > 0 && <span style={{ fontSize: 14, lineHeight: 1 }}>{['','😢','😕','😐','🙂','😊'][val]}</span>}
              </div>
              {m.key !== 'poids' && (
                <div style={{ height: 3, background: `${m.color}18`, borderRadius: 99, overflow: 'visible', position: 'relative', marginTop: 4 }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: `linear-gradient(90deg, ${m.color}66, ${m.color})`,
                    borderRadius: 99,
                    transition: 'width 0.7s cubic-bezier(.34,1.56,.64,1)',
                    position: 'relative',
                    boxShadow: `0 0 6px ${m.color}60`,
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

      {/* ── Historique 7 jours ── */}
      <HistoriqueSection history={history} />

      {/* ── Apple Health ── */}
      <div style={ss.appleSection}>
        <button style={ss.appleTrigger} onClick={() => setShowApple(v => !v)}>
          <span style={{ display:'flex', filter: 'drop-shadow(0 2px 6px rgba(200,123,82,0.4))' }}><HeartIcon size={24} color="#C87B52" /></span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 800, color: 'rgba(200,123,82,0.90)', fontSize: 13 }}>Connecter mes apps santé</div>
            <div style={{ fontSize: 11, color: 'rgba(200,123,82,0.55)', marginTop: 2 }}>Apple Santé, Google Fit · bientôt disponible</div>
          </div>
          <span style={{
            color: '#C87B52', fontSize: 10, fontWeight: 800,
            background: 'rgba(200,123,82,0.10)', padding: '4px 8px', borderRadius: 8,
            border: '1px solid rgba(200,123,82,0.20)'
          }}>{showApple ? '▲ Moins' : '▼ Plus'}</span>
        </button>
        {showApple && (
          <div style={ss.appleBody}>
            {[
              { n:1, txt: <>Ouvre l'app <strong style={{color:'rgba(200,123,82,0.90)'}}>Santé</strong> sur ton iPhone</> },
              { n:2, txt: <>Va dans <strong style={{color:'rgba(200,123,82,0.90)'}}>Profil</strong> (en haut à droite) → <strong style={{color:'rgba(200,123,82,0.90)'}}>Exporter les données de santé</strong></> },
              { n:3, txt: <>En attendant, rentre tes métriques manuellement ci-dessus</> },
            ].map(({ n, txt }) => (
              <div key={n} style={ss.appleStep}>
                <div style={ss.appleStepNum}>{n}</div>
                <div style={{ fontSize: 13, color: 'rgba(200,123,82,0.55)', lineHeight: 1.6 }}>{txt}</div>
              </div>
            ))}
            <div style={{
              marginTop: 14, padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(200,123,82,0.09), rgba(200,123,82,0.04))',
              borderRadius: 14, border: '1px solid rgba(200,123,82,0.22)',
              fontSize: 12, color: '#C87B52', fontWeight: 700,
              boxShadow: '0 4px 12px rgba(200,123,82,0.10), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}>
              <span style={{display:'flex',alignItems:'center',gap:6}}><PhoneIcon size={13} color="#C87B52" /> Synchronisation automatique Apple Santé & Google Fit — bientôt disponible</span>
            </div>
          </div>
        )}
      </div>

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
            }}>{editMetric.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1a0a00', marginBottom: 4, textAlign: 'center' }}>
              {editMetric.label}
            </div>
            <div style={{ fontSize: 12, color: '#8a7265', textAlign: 'center', marginBottom: 22 }}>
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
                <div style={{ textAlign: 'center', fontSize: 13, color: '#8a7265', marginBottom: 22 }}>
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
    background: 'rgba(255,255,255,0.32)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(200,123,82,0.13)',
    borderRadius: 26, padding: '22px 20px',
    display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14,
    boxShadow: '0 8px 32px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.75)'
  },
  btnInsights: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(245,212,184,0.38), rgba(232,160,122,0.28), rgba(200,123,82,0.22))',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    color: '#C87B52',
    border: '1px solid rgba(200,123,82,0.28)', padding: '12px 16px', borderRadius: 14, fontSize: 12, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'Poppins,sans-serif',
    boxShadow: '0 0 14px rgba(200,123,82,0.22), inset 0 1px 0 rgba(255,255,255,0.65)',
    transition: 'transform 0.15s ease',
    letterSpacing: 0.3
  },
  insightsCard: {
    background: 'rgba(255,252,250,0.28)',
    border: '1px solid rgba(200,123,82,0.18)',
    borderLeft: '4px solid #C87B52',
    borderRadius: 22, padding: '16px 18px', marginBottom: 14,
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 24px rgba(200,123,82,0.09), 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
  },
  waterBar: {
    background: 'rgba(255,255,255,0.30)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(200,123,82,0.10)',
    borderRadius: 24, padding: '16px 18px', marginBottom: 14,
    display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: '0 4px 14px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
  },
  btnWater: {
    background: 'rgba(200,123,82,0.14)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(200,123,82,0.28)',
    color: '#C87B52', borderRadius: 50, padding: '10px 18px', fontSize: 12, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'Poppins,sans-serif', flexShrink: 0,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
    transition: 'transform 0.15s ease',
    letterSpacing: 0.2
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  metricCard: {
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 24, padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
  },
  appleSection: {
    background: 'rgba(255,252,250,0.28)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(200,123,82,0.10)',
    borderRadius: 22, overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.75)'
  },
  appleTrigger: {
    width: '100%', background: 'transparent', border: 'none', padding: '16px 18px',
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'Poppins,sans-serif'
  },
  appleBody: { padding: '4px 18px 18px', borderTop: '1px solid rgba(200,123,82,0.12)' },
  appleStep: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10, paddingTop: 10 },
  appleStepNum: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'linear-gradient(145deg, rgba(200,123,82,0.20), rgba(200,123,82,0.10))',
    border: '1.5px solid rgba(200,123,82,0.30)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
    fontWeight: 900, color: '#C87B52', flexShrink: 0, marginTop: 1,
    boxShadow: '0 3px 10px rgba(200,123,82,0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
    zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
  },
  modalCard: {
    background: 'linear-gradient(145deg, #FFF8F4, #ffffff)',
    borderRadius: '28px 28px 0 0', padding: '10px 26px 48px', width: '100%', maxWidth: 520,
    boxShadow: '0 -12px 50px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)'
  },
  modalHandle: {
    width: 44, height: 5, background: 'rgba(0,0,0,0.10)', borderRadius: 3,
    margin: '12px auto 22px'
  },
  modalInput: {
    width: '100%', padding: '18px',
    borderRadius: 18,
    border: '2px solid #f0e8e0', background: 'rgba(255,248,244,0.8)',
    fontSize: 32, fontFamily: 'Poppins,sans-serif', outline: 'none', color: '#1a0a00',
    boxSizing: 'border-box', textAlign: 'center', marginBottom: 22, fontWeight: 800,
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)'
  },
  humeurBtn: {
    width: 56, height: 56, borderRadius: 18,
    border: '1.5px solid rgba(0,0,0,0.08)',
    background: 'linear-gradient(145deg, #fff8f4, #fff)',
    fontSize: 28, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)'
  },
  btnCancel: {
    flex: 1, padding: '15px', background: 'rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontSize: 13,
    fontWeight: 700, cursor: 'pointer', color: '#8a7265', fontFamily: 'Poppins,sans-serif',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)'
  },
  btnSave: {
    flex: 2, padding: '15px', border: 'none', borderRadius: 16, fontSize: 13,
    fontWeight: 800, cursor: 'pointer', color: '#fff', fontFamily: 'Poppins,sans-serif',
    transition: 'transform 0.15s ease',
    letterSpacing: 0.3
  },
}
