/**
 * ROUTINE TAB
 * ─────────────────────────────────────────────────────────────────────────────
 * Affiche la routine du jour générée par l'agent routine-auto.
 * Si pas de cache : génère à la demande via /api/routine-regenerer.
 * Les étapes cochées sont persistées dans localStorage.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SunIcon, MoonIcon, LightbulbIcon, SparkleIcon } from './Icons'

const EASE = [0.22, 1, 0.36, 1]

// ─── Icônes inline légères ────────────────────────────────────────────────────
function RefreshSVG({ spinning = false }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      style={{ animation: spinning ? 'spin360 1s linear infinite' : 'none' }}>
      <path d="M4 12a8 8 0 018-8 8 8 0 016.9 4H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 12a8 8 0 01-8 8 8 8 0 01-6.9-4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="20 4 20 8 16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="4 20 4 16 8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckSVG({ checked }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 12, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: checked ? 'linear-gradient(135deg,#C87B52,#E8962A)' : 'rgba(200,123,82,0.06)',
      border: checked ? '2px solid transparent' : '2px solid rgba(200,123,82,0.35)',
      boxShadow: checked ? '0 2px 8px rgba(200,123,82,0.40)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="check"
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Anneau de progression ────────────────────────────────────────────────────
function ProgressRing({ pct, size = 72, stroke = 6 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(200,123,82,0.12)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#rg)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C87B52"/>
          <stop offset="100%" stopColor="#E8962A"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Section avec étapes cochables ────────────────────────────────────────────
function Section({ icon, titre, heure, etapes, checked, onToggle, color = '#C87B52' }) {
  const done = etapes.filter(e => checked[e.id]).length
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(200,123,82,0.10)',
        borderRadius: 20,
        padding: '18px 16px',
        marginBottom: 12,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1633', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.3px' }}>
              {titre}
            </div>
            {heure && (
              <div style={{ fontSize: 11, color: 'rgba(200,123,82,0.55)', fontFamily: 'Poppins,sans-serif', marginTop: 1 }}>
                {heure}
              </div>
            )}
          </div>
        </div>
        {etapes.length > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 600, color: done === etapes.length ? '#22c55e' : 'rgba(200,123,82,0.60)',
            fontFamily: 'Poppins,sans-serif', background: done === etapes.length ? 'rgba(34,197,94,0.10)' : 'rgba(200,123,82,0.08)',
            padding: '3px 8px', borderRadius: 12,
          }}>
            {done}/{etapes.length}
          </div>
        )}
      </div>

      {/* Étapes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {etapes.map(e => (
          <button key={e.id} onClick={() => onToggle(e.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: checked[e.id] ? 'rgba(200,123,82,0.06)' : 'transparent',
              border: 'none', borderRadius: 12, padding: '10px 10px',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'background 0.2s',
            }}>
            <CheckSVG checked={!!checked[e.id]} />
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 2,
              }}>
                <span style={{ fontSize: 15 }}>{e.emoji}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontFamily: 'Poppins,sans-serif',
                  color: checked[e.id] ? 'rgba(26,10,0,0.35)' : '#0A1633',
                  textDecoration: checked[e.id] ? 'line-through' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {e.titre}
                </span>
                {e.duree && (
                  <span style={{
                    fontSize: 10, color: 'rgba(200,123,82,0.50)',
                    fontFamily: 'Poppins,sans-serif', marginLeft: 'auto', flexShrink: 0,
                  }}>
                    {e.duree}
                  </span>
                )}
              </div>
              {e.description && (
                <div style={{
                  fontSize: 11.5, color: checked[e.id] ? 'rgba(26,10,0,0.25)' : 'rgba(26,10,0,0.50)',
                  fontFamily: 'Poppins,sans-serif', lineHeight: 1.5,
                  transition: 'color 0.2s',
                }}>
                  {e.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Carte Nutrition ──────────────────────────────────────────────────────────
function NutritionCard({ nutrition }) {
  if (!nutrition) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(200,123,82,0.10)',
        borderRadius: 20, padding: '18px 16px', marginBottom: 12,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>🥗</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1633', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.3px' }}>
          {nutrition.titre || 'Nutrition du jour'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(nutrition.repas || []).map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: 'rgba(200,123,82,0.05)', borderRadius: 12, padding: '10px 12px',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{r.emoji}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,123,82,0.70)', fontFamily: 'Poppins,sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {r.moment}
              </div>
              <div style={{ fontSize: 12.5, color: '#0A1633', fontFamily: 'Poppins,sans-serif', marginTop: 2, lineHeight: 1.4 }}>
                {r.suggestion}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nutrition.supplements?.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(200,123,82,0.06)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,123,82,0.70)', fontFamily: 'Poppins,sans-serif', marginBottom: 4 }}>
            💊 Suppléments
          </div>
          {nutrition.supplements.map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: 'rgba(26,10,0,0.65)', fontFamily: 'Poppins,sans-serif' }}>• {s}</div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── État "vide" : pas de routine ─────────────────────────────────────────────
function EmptyRoutine({ generating, onGenerate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 20, display:'flex', justifyContent:'center' }}><SunIcon size={56} color="#E8962A" /></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0A1633', fontFamily: 'Poppins,sans-serif', marginBottom: 8, letterSpacing: '-0.4px' }}>
        Pas encore de routine
      </div>
      <div style={{ fontSize: 13, color: 'rgba(26,10,0,0.45)', fontFamily: 'Poppins,sans-serif', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        Solenn va générer une routine personnalisée pour ta journée en fonction de ton profil et de tes métriques.
      </div>
      <button
        onClick={onGenerate}
        disabled={generating}
        style={{
          padding: '14px 28px', borderRadius: 16, border: 'none',
          background: generating ? 'rgba(200,123,82,0.20)' : 'linear-gradient(135deg,#C87B52,#E8962A)',
          color: generating ? 'rgba(200,123,82,0.60)' : 'white',
          fontSize: 14, fontWeight: 700, fontFamily: 'Poppins,sans-serif',
          cursor: generating ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 0.2s',
          boxShadow: generating ? 'none' : '0 4px 20px rgba(200,123,82,0.35)',
        }}
      >
        <RefreshSVG spinning={generating} />
        {generating ? 'Génération en cours…' : <span style={{display:'flex',alignItems:'center',gap:6}}><SparkleIcon size={13} color="white" />Générer ma routine</span>}
      </button>
    </motion.div>
  )
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function RoutineTab({ userId, profil }) {
  const todayKey = new Date().toDateString()
  const storageKey = `vitacoach_routine_checked_${todayKey}`

  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') }
    catch { return {} }
  })
  const [genTime, setGenTime] = useState(null)

  // ── Charger depuis le cache ──
  const chargerRoutine = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/routine-cache?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      if (data.routine) {
        setRoutine(data.routine)
        setGenTime(data.generatedAt || null)
      } else {
        setRoutine(null)
      }
    } catch (e) {
      setError('Impossible de charger la routine.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { chargerRoutine() }, [chargerRoutine])

  // ── Générer à la demande ──
  async function generer() {
    if (!userId || !profil) return
    setGenerating(true); setError(null)
    try {
      const res = await fetch('/api/routine-regenerer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profil }),
      })
      const data = await res.json()
      if (data.routine) {
        setRoutine(data.routine)
        setGenTime(new Date().toISOString())
        setChecked({})
        localStorage.removeItem(storageKey)
      } else {
        setError(data.error || 'Erreur lors de la génération.')
      }
    } catch (e) {
      setError('Impossible de générer la routine.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Toggle une étape ──
  function toggleStep(id) {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  // ── Compter les étapes totales ──
  function countAll() {
    if (!routine) return { done: 0, total: 0 }
    const sections = ['matin', 'apresmidi', 'soir']
    let total = 0, done = 0
    sections.forEach(s => {
      const etapes = routine[s]?.etapes || []
      total += etapes.length
      etapes.forEach(e => { if (checked[e.id]) done++ })
    })
    return { done, total }
  }

  const { done, total } = countAll()
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // ── Formater l'heure de génération ──
  function formatHeure(iso) {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFF8F4 0%, #FFF2E8 60%, #FFE8D6 100%)',
      paddingBottom: 120,
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1633', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.6px' }}>
            Ma Routine
          </div>
          <div style={{ fontSize: 12, color: 'rgba(200,123,82,0.60)', fontFamily: 'Poppins,sans-serif', marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {routine && (
          <button
            onClick={generer}
            disabled={generating}
            title="Régénérer"
            style={{
              width: 38, height: 38, borderRadius: 12, border: 'none',
              background: generating ? 'rgba(200,123,82,0.10)' : 'rgba(200,123,82,0.12)',
              color: 'rgba(200,123,82,0.80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: generating ? 'default' : 'pointer',
            }}
          >
            <RefreshSVG spinning={generating} />
          </button>
        )}
      </div>

      {/* ── Contenu ── */}
      <div style={{ padding: '16px 20px 0' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(200,123,82,0.15)',
              borderTop: '3px solid rgba(200,123,82,0.80)',
              animation: 'spin360 0.8s linear infinite',
            }} />
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 12,
            fontSize: 13, color: '#ef4444', fontFamily: 'Poppins,sans-serif',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Vide */}
        {!loading && !routine && (
          <EmptyRoutine generating={generating} onGenerate={generer} />
        )}

        {/* Routine chargée */}
        <AnimatePresence>
          {!loading && routine && (
            <motion.div
              key="routine"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* ── Progression + motivation ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(200,123,82,0.12), rgba(232,150,42,0.08))',
                  border: '1px solid rgba(200,123,82,0.14)',
                  borderRadius: 20, padding: '18px 16px', marginBottom: 16,
                  display: 'flex', gap: 16, alignItems: 'center',
                }}
              >
                {/* Anneau */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ProgressRing pct={pct} size={72} stroke={6} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#C87B52', fontFamily: 'Poppins,sans-serif', lineHeight: 1 }}>
                      {pct}%
                    </span>
                    <span style={{ fontSize: 9, color: 'rgba(200,123,82,0.55)', fontFamily: 'Poppins,sans-serif' }}>
                      du jour
                    </span>
                  </div>
                </div>

                {/* Motivation */}
                <div style={{ flex: 1 }}>
                  {routine.motivation && (
                    <div style={{
                      fontSize: 12.5, color: '#0A1633', fontFamily: 'Poppins,sans-serif',
                      lineHeight: 1.55, fontStyle: 'italic', marginBottom: 8,
                      fontWeight: 500,
                    }}>
                      "{routine.motivation}"
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'rgba(200,123,82,0.50)', fontFamily: 'Poppins,sans-serif' }}>
                    {done}/{total} étapes complétées
                    {genTime && ` · générée à ${formatHeure(genTime)}`}
                  </div>
                </div>
              </motion.div>

              {/* ── Matin ── */}
              {routine.matin?.etapes?.length > 0 && (
                <Section
                  icon={<SunIcon size={22} color="#E8962A" />}
                  titre={routine.matin.titre || 'Matin'}
                  heure={routine.matin.heure}
                  etapes={routine.matin.etapes}
                  checked={checked}
                  onToggle={toggleStep}
                />
              )}

              {/* ── Nutrition ── */}
              <NutritionCard nutrition={routine.nutrition} />

              {/* ── Après-midi ── */}
              {routine.apresmidi?.etapes?.length > 0 && (
                <Section
                  icon="☀️"
                  titre={routine.apresmidi.titre || 'Après-midi'}
                  heure={routine.apresmidi.heure}
                  etapes={routine.apresmidi.etapes}
                  checked={checked}
                  onToggle={toggleStep}
                />
              )}

              {/* ── Soir ── */}
              {routine.soir?.etapes?.length > 0 && (
                <Section
                  icon={<MoonIcon size={22} color="#9A96CC" />}
                  titre={routine.soir.titre || 'Soir'}
                  heure={routine.soir.heure}
                  etapes={routine.soir.etapes}
                  checked={checked}
                  onToggle={toggleStep}
                />
              )}

              {/* ── Astuce du jour ── */}
              {routine.astuce && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: 'rgba(232,150,42,0.08)',
                    border: '1px solid rgba(232,150,42,0.18)',
                    borderRadius: 16, padding: '14px 16px',
                    marginBottom: 12,
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}
                >
                  <LightbulbIcon size={22} color="rgba(200,100,20,0.80)" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(200,100,20,0.80)', fontFamily: 'Poppins,sans-serif', marginBottom: 4 }}>
                      {routine.astuce.titre || 'Astuce du jour'}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(26,10,0,0.60)', fontFamily: 'Poppins,sans-serif', lineHeight: 1.5 }}>
                      {routine.astuce.conseil}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── 100% complété ── */}
              <AnimatePresence>
                {pct === 100 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      textAlign: 'center', padding: '20px 16px',
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(16,185,129,0.08))',
                      border: '1px solid rgba(34,197,94,0.20)',
                      borderRadius: 20, marginTop: 8,
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', fontFamily: 'Poppins,sans-serif' }}>
                      Journée accomplie !
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(22,163,74,0.70)', fontFamily: 'Poppins,sans-serif', marginTop: 4 }}>
                      Tu as terminé toutes tes étapes. Solenn est fière de toi !
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CSS spin ── */}
      <style>{`
        @keyframes spin360 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
