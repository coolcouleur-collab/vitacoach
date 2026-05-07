import React, { useState } from 'react'

const METRICS = [
  { key: 'pas',     label: 'Pas',            icon: '👣', unit: '',      goal: 10000, color: '#ff6b35', fmt: v => Math.round(v).toLocaleString('fr'), type: 'number', step: 100,  hint: 'Ex: 8500' },
  { key: 'sommeil', label: 'Sommeil',         icon: '😴', unit: 'h',    goal: 8,     color: '#a78bfa', fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.5, hint: 'Ex: 7.5' },
  { key: 'eau',     label: 'Hydratation',     icon: '💧', unit: ' v.',  goal: 8,     color: '#38bdf8', fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Verres d\'eau' },
  { key: 'fc',      label: 'Fréq. Cardiaque', icon: '❤️', unit: ' bpm', goal: 70,    color: '#ff3b30', fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Ex: 68' },
  { key: 'humeur',  label: 'Humeur',          icon: '😊', unit: '/5',   goal: 5,     color: '#fbbf24', fmt: v => v,                                  type: 'range',  step: 1,   hint: '1 = difficile, 5 = excellent' },
  { key: 'poids',   label: 'Poids',           icon: '⚖️', unit: ' kg',  goal: null,  color: '#34c759', fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.1, hint: 'Ex: 72.5' },
]

const HUMEUR_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄']

export function scoreJour(m) {
  let s = 0
  if (m.pas  >= 10000) s += 20; else if (m.pas >= 7000) s += 15; else if (m.pas >= 5000) s += 10; else if (m.pas >= 2000) s += 5
  if (m.sommeil >= 7.5) s += 25; else if (m.sommeil >= 6) s += 18; else if (m.sommeil >= 5) s += 10; else if (m.sommeil > 0) s += 5
  if (m.eau >= 8) s += 20; else if (m.eau >= 6) s += 15; else if (m.eau >= 4) s += 10; else if (m.eau > 0) s += 5
  if (m.humeur === 5) s += 20; else if (m.humeur === 4) s += 15; else if (m.humeur === 3) s += 10; else if (m.humeur > 0) s += 5
  if (m.fc >= 50 && m.fc <= 80) s += 15; else if (m.fc > 0 && m.fc <= 100) s += 8
  return Math.min(s, 100)
}

export default function SanteTab({ metriques, profil, onUpdate, score }) {
  const [editMode, setEditMode]           = useState(null)
  const [tempVal, setTempVal]             = useState('')
  const [insights, setInsights]           = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [showApple, setShowApple]         = useState(false)

  const scoreColor = score >= 70 ? '#34c759' : score >= 40 ? '#ff9500' : '#ff3b30'
  const scoreLabel = score >= 80 ? 'Excellent ✦' : score >= 60 ? 'Bonne forme' : score >= 40 ? 'En progression' : score > 0 ? 'À améliorer' : 'Commence !'
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
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f0e8e0" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none"
              stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1.2s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score || '—'}</div>
            <div style={{ fontSize: 9, color: '#c4b5a8', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>/ 100</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor, marginBottom: 4 }}>{scoreLabel}</div>
          <div style={{ fontSize: 12, color: '#8a7265', lineHeight: 1.6, marginBottom: 12 }}>
            Score santé du jour · Mets à jour tes métriques pour l'améliorer
          </div>
          <button style={ss.btnInsights} onClick={getInsights} disabled={loadingInsights}>
            {loadingInsights ? '⏳ Analyse...' : '✨ Analyse IA personnalisée'}
          </button>
        </div>
      </div>

      {/* ── AI Insights ── */}
      {insights && (
        <div style={ss.insightsCard}>
          <div style={{ fontWeight: 700, color: '#FF6B35', marginBottom: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💡</span> Analyse personnalisée
          </div>
          {insights.points?.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{p.emoji}</span>
              <div style={{ fontSize: 13, color: '#1a0a00', lineHeight: 1.65 }}>{p.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick Water Bar ── */}
      <div style={ss.waterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 20 }}>💧</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: i < (metriques.eau || 0) ? '#38bdf8' : '#f0e8e0',
                  boxShadow: i < (metriques.eau || 0) ? '0 0 6px rgba(56,189,248,0.4)' : 'none',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#8a7265', marginTop: 4, fontWeight: 600 }}>
              {metriques.eau || 0} / 8 verres
            </div>
          </div>
        </div>
        <button style={ss.btnWater} onClick={addWater}>+ verre</button>
      </div>

      {/* ── Metrics Grid ── */}
      <div style={{ fontSize: 10, color: '#c4b5a8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, marginTop: 4, fontWeight: 600 }}>
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
              style={{ ...ss.metricCard, ...(done ? { borderColor: m.color + '40', boxShadow: `0 4px 20px ${m.color}12` } : {}) }}
              onClick={() => openEdit(m.key)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                {done && <span style={{ fontSize: 9, color: m.color, background: m.color + '15', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>✓ OK</span>}
                {!done && <span style={{ fontSize: 9, color: '#c4b5a8', background: '#f8f4f0', padding: '2px 7px', borderRadius: 6 }}>Modifier</span>}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: done ? m.color : '#1a0a00', lineHeight: 1, marginBottom: 2 }}>
                {val > 0 ? m.fmt(val) : '—'}
                {val > 0 && <span style={{ fontSize: 11, fontWeight: 400, color: '#c4b5a8', marginLeft: 2 }}>{m.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#8a7265', marginBottom: 8 }}>{m.label}</div>
              {m.key !== 'poids' && (
                <div style={{ height: 4, background: '#f0e8e0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${m.color}99, ${m.color})`,
                    borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
              )}
              {m.key === 'humeur' && val > 0 && (
                <div style={{ fontSize: 20, marginTop: 4, textAlign: 'center' }}>{HUMEUR_EMOJIS[val]}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Apple Health ── */}
      <div style={ss.appleSection}>
        <button style={ss.appleTrigger} onClick={() => setShowApple(v => !v)}>
          <span style={{ fontSize: 22 }}>🍎</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#1a0a00', fontSize: 13 }}>Apple Santé & HealthKit</div>
            <div style={{ fontSize: 11, color: '#8a7265', marginTop: 2 }}>Synchronisation native iOS</div>
          </div>
          <span style={{ color: '#c4b5a8', fontSize: 12 }}>{showApple ? '▲' : '▼'}</span>
        </button>
        {showApple && (
          <div style={ss.appleBody}>
            {[
              { n:1, txt: <>Ouvre l'app <strong style={{color:'#1a0a00'}}>Santé</strong> sur ton iPhone</> },
              { n:2, txt: <>Va dans <strong style={{color:'#1a0a00'}}>Profil</strong> (en haut à droite) → <strong style={{color:'#1a0a00'}}>Exporter les données de santé</strong></> },
              { n:3, txt: <>En attendant, rentre tes métriques manuellement ci-dessus</> },
            ].map(({ n, txt }) => (
              <div key={n} style={ss.appleStep}>
                <div style={ss.appleStepNum}>{n}</div>
                <div style={{ fontSize: 13, color: '#8a7265', lineHeight: 1.6 }}>{txt}</div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(52,199,89,0.07)',
              borderRadius: 10, border: '1px solid rgba(52,199,89,0.2)', fontSize: 12, color: '#34c759', fontWeight: 600 }}>
              📱 App iOS native avec HealthKit automatique — bientôt disponible
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editMode && editMetric && (
        <div style={ss.modalOverlay} onClick={() => setEditMode(null)}>
          <div style={ss.modalCard} onClick={e => e.stopPropagation()}>
            <div style={ss.modalHandle} />
            <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>{editMetric.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1a0a00', marginBottom: 4, textAlign: 'center' }}>
              {editMetric.label}
            </div>
            <div style={{ fontSize: 12, color: '#8a7265', textAlign: 'center', marginBottom: 20 }}>
              {editMetric.hint}
            </div>

            {editMetric.type === 'range' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n}
                      style={{ ...ss.humeurBtn, ...(parseInt(tempVal) === n ? { background: editMetric.color, border: 'none', transform:'scale(1.1)' } : {}) }}
                      onClick={() => setTempVal(n.toString())}>
                      {HUMEUR_EMOJIS[n]}
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#8a7265', marginBottom: 20 }}>
                  {tempVal ? `Humeur ${tempVal}/5` : 'Sélectionne ton humeur'}
                </div>
              </div>
            ) : (
              <input style={ss.modalInput}
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
              <button style={{ ...ss.btnSave, background: `linear-gradient(135deg, ${editMetric.color}, ${editMetric.color}cc)` }}
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
    background: '#ffffff',
    border: '1px solid #f0e8e0',
    borderRadius: 22, padding: '20px 18px',
    display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
  },
  btnInsights: {
    width: '100%', background: 'linear-gradient(135deg,#FF6B35,#E55A00)', color: '#fff',
    border: 'none', padding: '10px 16px', borderRadius: 11, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Poppins,sans-serif', boxShadow: '0 4px 14px rgba(255,107,53,0.3)'
  },
  insightsCard: {
    background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.18)',
    borderRadius: 18, padding: '16px', marginBottom: 14
  },
  waterBar: {
    background: '#ffffff', border: '1px solid #f0e8e0',
    borderRadius: 16, padding: '14px 14px', marginBottom: 14,
    display: 'flex', alignItems: 'center', gap: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  btnWater: {
    background: 'rgba(56,189,248,0.12)', border: '1.5px solid rgba(56,189,248,0.35)',
    color: '#0ea5e9', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Poppins,sans-serif', flexShrink: 0
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  metricCard: {
    background: '#ffffff', border: '1px solid #f0e8e0', borderRadius: 18, padding: '14px',
    cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  appleSection: {
    background: '#ffffff', border: '1px solid #f0e8e0',
    borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  appleTrigger: {
    width: '100%', background: 'transparent', border: 'none', padding: '16px',
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'Poppins,sans-serif'
  },
  appleBody: { padding: '4px 16px 16px', borderTop: '1px solid #f8f4f0' },
  appleStep: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10, paddingTop: 10 },
  appleStepNum: {
    width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,107,53,0.1)',
    border: '1.5px solid rgba(255,107,53,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
    fontWeight: 800, color: '#FF6B35', flexShrink: 0, marginTop: 1
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
    zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
  },
  modalCard: {
    background: '#ffffff',
    borderRadius: '28px 28px 0 0', padding: '10px 24px 44px', width: '100%', maxWidth: 520,
    boxShadow: '0 -8px 40px rgba(0,0,0,0.15)'
  },
  modalHandle: { width: 36, height: 4, background: '#f0e8e0', borderRadius: 2, margin: '10px auto 20px' },
  modalInput: {
    width: '100%', padding: '16px', borderRadius: 16,
    border: '1.5px solid #f0e8e0', background: '#f9fafb',
    fontSize: 28, fontFamily: 'Poppins,sans-serif', outline: 'none', color: '#1a0a00',
    boxSizing: 'border-box', textAlign: 'center', marginBottom: 20, fontWeight: 700
  },
  humeurBtn: {
    width: 54, height: 54, borderRadius: 16, border: '1.5px solid #f0e8e0',
    background: '#f9fafb', fontSize: 26, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
  },
  btnCancel: {
    flex: 1, padding: '14px', background: '#f8f4f0',
    border: '1px solid #f0e8e0', borderRadius: 14, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', color: '#8a7265', fontFamily: 'Poppins,sans-serif'
  },
  btnSave: {
    flex: 2, padding: '14px', border: 'none', borderRadius: 14, fontSize: 13,
    fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: 'Poppins,sans-serif'
  },
}
