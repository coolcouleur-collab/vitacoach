import React, { useState } from 'react'

const METRICS = [
  { key: 'pas',     label: 'Pas',             icon: '👣', unit: '',      goal: 10000, color: '#00d4ff',  fmt: v => Math.round(v).toLocaleString('fr'), type: 'number', step: 100,  hint: 'Ex: 8500' },
  { key: 'sommeil', label: 'Sommeil',          icon: '😴', unit: 'h',    goal: 8,     color: '#bf5af2',  fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.5, hint: 'Ex: 7.5' },
  { key: 'eau',     label: 'Hydratation',      icon: '💧', unit: ' v.',  goal: 8,     color: '#00e5ff',  fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Verres d\'eau' },
  { key: 'fc',      label: 'Fréq. Cardiaque',  icon: '❤️', unit: ' bpm', goal: 70,    color: '#ff453a',  fmt: v => Math.round(v),                      type: 'number', step: 1,   hint: 'Ex: 68' },
  { key: 'humeur',  label: 'Humeur',           icon: '😊', unit: '/5',   goal: 5,     color: '#ffd60a',  fmt: v => v,                                  type: 'range',  step: 1,   hint: '1 = difficile, 5 = excellent' },
  { key: 'poids',   label: 'Poids',            icon: '⚖️', unit: ' kg',  goal: null,  color: '#00e676',  fmt: v => Number(v).toFixed(1),               type: 'number', step: 0.1, hint: 'Ex: 72.5' },
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
  const [editMode, setEditMode] = useState(null)
  const [tempVal, setTempVal]   = useState('')
  const [insights, setInsights] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [showApple, setShowApple] = useState(false)

  const scoreColor = score >= 70 ? '#00e676' : score >= 40 ? '#ffd60a' : '#ff453a'
  const scoreLabel = score >= 80 ? 'Excellent ✦' : score >= 60 ? 'Bonne forme' : score >= 40 ? 'En progression' : 'À améliorer'
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
    } catch { }
    setLoadingInsights(false)
  }

  const editMetric = METRICS.find(m => m.key === editMode)

  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── Score Ring Card ── */}
      <div style={ss.scoreCard}>
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none"
              stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1.2s ease, stroke 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>/ 100</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor, marginBottom: 4 }}>{scoreLabel}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>
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
          <div style={{ fontWeight: 700, color: '#00d4ff', marginBottom: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💡</span> Analyse personnalisée
          </div>
          {insights.points?.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{p.emoji}</span>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65 }}>{p.message}</div>
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
                  background: i < (metriques.eau || 0) ? '#00e5ff' : 'rgba(255,255,255,0.08)',
                  boxShadow: i < (metriques.eau || 0) ? '0 0 6px #00e5ff60' : 'none',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{metriques.eau || 0} / 8 verres</div>
          </div>
        </div>
        <button style={ss.btnWater} onClick={addWater}>+ verre</button>
      </div>

      {/* ── Metrics Grid ── */}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, marginTop: 4 }}>
        Métriques · Appuie pour modifier
      </div>
      <div style={ss.grid}>
        {METRICS.map(m => {
          const val = metriques[m.key] || 0
          const goal = m.goal || (profil?.poids || 70)
          const pct  = Math.min((val / goal) * 100, 100)
          const done = pct >= 100
          return (
            <div key={m.key} style={{ ...ss.metricCard, ...(done ? { borderColor: m.color + '35', boxShadow: `0 0 20px ${m.color}12` } : {}) }}
              onClick={() => openEdit(m.key)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                {done && <span style={{ fontSize: 9, color: m.color, background: m.color + '18', padding: '2px 7px', borderRadius: 6, fontWeight: 700, letterSpacing: 0.5 }}>✓ OK</span>}
                {!done && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 6 }}>Modifier</span>}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: done ? m.color : 'rgba(255,255,255,0.9)', lineHeight: 1, marginBottom: 2 }}>
                {val > 0 ? m.fmt(val) : '—'}
                {val > 0 && <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.28)', marginLeft: 2 }}>{m.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{m.label}</div>
              {m.key !== 'poids' && (
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 2, transition: 'width 0.6s ease', boxShadow: `0 0 8px ${m.color}50` }} />
                </div>
              )}
              {m.key === 'humeur' && val > 0 && (
                <div style={{ fontSize: 20, marginTop: 4, textAlign: 'center' }}>{HUMEUR_EMOJIS[val]}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Apple Health Section ── */}
      <div style={ss.appleSection}>
        <button style={ss.appleTrigger} onClick={() => setShowApple(v => !v)}>
          <span style={{ fontSize: 22 }}>🍎</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>Apple Santé & HealthKit</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Synchronisation native iOS</div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{showApple ? '▲' : '▼'}</span>
        </button>
        {showApple && (
          <div style={ss.appleBody}>
            <div style={ss.appleStep}>
              <div style={ss.appleStepNum}>1</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                Ouvre l'app <strong style={{ color: 'white' }}>Santé</strong> sur ton iPhone
              </div>
            </div>
            <div style={ss.appleStep}>
              <div style={ss.appleStepNum}>2</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                Va dans <strong style={{ color: 'white' }}>ton profil</strong> (en haut à droite) → <strong style={{ color: 'white' }}>Exporter les données de santé</strong>
              </div>
            </div>
            <div style={ss.appleStep}>
              <div style={ss.appleStepNum}>3</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                En attendant, rentre tes métriques manuellement ci-dessus
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,230,118,0.07)', borderRadius: 10, border: '1px solid rgba(0,230,118,0.2)', fontSize: 12, color: '#00e676' }}>
              📱 App iOS native avec HealthKit automatique — bientôt disponible
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editMode && editMetric && (
        <div style={ss.modalOverlay} onClick={() => setEditMode(null)}>
          <div style={ss.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 8, textAlign: 'center' }}>{editMetric.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4, textAlign: 'center' }}>{editMetric.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 20 }}>{editMetric.hint}</div>

            {editMetric.type === 'range' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} style={{ ...ss.humeurBtn, ...(parseInt(tempVal) === n ? { background: editMetric.color, color: '#000', border: `none` } : {}) }}
                      onClick={() => setTempVal(n.toString())}>
                      {HUMEUR_EMOJIS[n]}
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
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
              <button style={{ ...ss.btnSave, background: `linear-gradient(135deg, ${editMetric.color}, ${editMetric.color}99)` }} onClick={submitEdit}>
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
    background: 'linear-gradient(135deg, rgba(0,230,118,0.07) 0%, rgba(0,212,255,0.05) 100%)',
    border: '1px solid rgba(0,230,118,0.18)', borderRadius: 22, padding: '20px 18px',
    display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16
  },
  btnInsights: {
    width: '100%', background: 'linear-gradient(135deg, #00d4ff, #0080ff)', color: '#000',
    border: 'none', padding: '10px 16px', borderRadius: 11, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 14px rgba(0,212,255,0.35)'
  },
  insightsCard: {
    background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.14)',
    borderRadius: 18, padding: '16px 16px', marginBottom: 16
  },
  waterBar: {
    background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: 14, padding: '14px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12
  },
  btnWater: {
    background: 'rgba(0,229,255,0.14)', border: '1px solid rgba(0,229,255,0.3)',
    color: '#00e5ff', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Poppins, sans-serif', flexShrink: 0
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
  metricCard: {
    background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '14px 14px',
    cursor: 'pointer', transition: 'all 0.2s ease'
  },
  appleSection: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18, overflow: 'hidden'
  },
  appleTrigger: {
    width: '100%', background: 'transparent', border: 'none', padding: '16px 16px',
    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'Poppins, sans-serif'
  },
  appleBody: { padding: '4px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  appleStep: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, paddingTop: 12 },
  appleStepNum: {
    width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
    fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0, marginTop: 1
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
    zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
  },
  modalCard: {
    background: 'linear-gradient(180deg, #0c0c20 0%, #060610 100%)',
    border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480
  },
  modalInput: {
    width: '100%', padding: '16px', borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    fontSize: 22, fontFamily: 'Poppins, sans-serif', outline: 'none', color: 'white',
    boxSizing: 'border-box', textAlign: 'center', marginBottom: 20
  },
  humeurBtn: {
    width: 52, height: 52, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', fontSize: 24, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
  },
  btnCancel: {
    flex: 1, padding: '13px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins, sans-serif'
  },
  btnSave: {
    flex: 2, padding: '13px', border: 'none', borderRadius: 13, fontSize: 13,
    fontWeight: 700, cursor: 'pointer', color: '#000', fontFamily: 'Poppins, sans-serif'
  },
}
