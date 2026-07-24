/**
 * ROUTINE TAB
 * ─────────────────────────────────────────────────────────────────────────────
 * Affiche la routine du jour générée par l'agent routine-auto.
 * Si pas de cache : génère à la demande via /api/routine-regenerer.
 * Les étapes cochées sont persistées dans localStorage.
 */
import React, { useState, useEffect, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SunIcon, MoonIcon, LightbulbIcon, SparkleIcon, StarIcon } from './Icons'
import { authHeaders } from './supabase'

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
      background: checked ? 'rgba(255,235,210,0.32)' : 'rgba(200,123,82,0.06)',
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
  const uid = useId()
  const gradId = `rg-${uid.replace(/:/g, '')}`
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C87B52"/>
          <stop offset="100%" stopColor="#E8962A"/>
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(200,123,82,0.12)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={`url(#${gradId})`} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
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
        background: 'rgba(255,235,210,0.22)',
        border: '1px solid rgba(255,220,160,0.28)',
        borderRadius: 20,
        padding: '18px 16px',
        marginBottom: 12,
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(200,123,82,0.92)', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.3px' }}>
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
            fontSize: 11, fontWeight: 600, color: done === etapes.length ? 'rgba(200,123,82,0.90)' : 'rgba(200,123,82,0.60)',
            fontFamily: 'Poppins,sans-serif', background: done === etapes.length ? 'rgba(200,123,82,0.18)' : 'rgba(200,123,82,0.08)',
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
                <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
                  <circle cx="4" cy="4" r="3" fill="#C87B52" fillOpacity={checked[e.id] ? 0.35 : 0.70} />
                </svg>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontFamily: 'Poppins,sans-serif',
                  color: checked[e.id] ? 'rgba(200,123,82,0.35)' : 'rgba(200,123,82,0.92)',
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
                  fontSize: 11.5, color: checked[e.id] ? 'rgba(200,123,82,0.25)' : 'rgba(200,123,82,0.50)',
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
        background: 'rgba(255,235,210,0.22)',
        border: '1px solid rgba(255,220,160,0.28)',
        borderRadius: 20, padding: '18px 16px', marginBottom: 12,
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ display:'flex' }}><LightbulbIcon size={22} color="#C87B52" /></span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(200,123,82,0.92)', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.3px' }}>
          {nutrition.titre || 'Nutrition du jour'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(nutrition.repas || []).map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: 'rgba(200,123,82,0.05)', borderRadius: 12, padding: '10px 12px',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 3 }}>
              <circle cx="6" cy="6" r="4.5" fill="none" stroke="#C87B52" strokeWidth="1.6" opacity="0.75" />
              <circle cx="6" cy="6" r="1.8" fill="#C87B52" opacity="0.75" />
            </svg>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,123,82,0.70)', fontFamily: 'Poppins,sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {r.moment}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(200,123,82,0.75)', fontFamily: 'Poppins,sans-serif', marginTop: 2, lineHeight: 1.4 }}>
                {r.suggestion}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nutrition.supplements?.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(200,123,82,0.06)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,123,82,0.70)', fontFamily: 'Poppins,sans-serif', marginBottom: 4, display:'flex', alignItems:'center', gap:5 }}>
            <SparkleIcon size={11} color="rgba(200,123,82,0.70)" /> Suppléments
          </div>
          {nutrition.supplements.map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: 'rgba(200,123,82,0.65)', fontFamily: 'Poppins,sans-serif' }}>• {s}</div>
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
      <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(200,123,82,0.92)', fontFamily: 'Poppins,sans-serif', marginBottom: 8, letterSpacing: '-0.4px' }}>
        Pas encore de routine
      </div>
      <div style={{ fontSize: 13, color: 'rgba(200,123,82,0.45)', fontFamily: 'Poppins,sans-serif', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        Solenn va générer une routine personnalisée pour ta journée en fonction de ton profil et de tes métriques.
      </div>
      <button
        onClick={onGenerate}
        disabled={generating}
        style={{
          padding: '14px 28px', borderRadius: 16, border: 'none',
          background: generating ? 'rgba(200,123,82,0.20)' : 'rgba(255,235,210,0.32)',
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
      const res = await fetch(`/api/routine-cache?userId=${encodeURIComponent(userId)}`, { headers: await authHeaders() })
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
    if (window?.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light })
      }).catch(() => {})
    }
    setGenerating(true); setError(null)
    try {
      const res = await fetch('/api/routine-regenerer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
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
      const completing = !prev[id]
      const next = { ...prev, [id]: completing }
      localStorage.setItem(storageKey, JSON.stringify(next))
      if (window?.Capacitor?.isNativePlatform?.()) {
        import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
          Haptics.impact({ style: completing ? ImpactStyle.Medium : ImpactStyle.Light })
        }).catch(() => {})
      }
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
  const prevPctRef = React.useRef(pct)

  // ── Célébration 100% ──
  const [showCelebration, setShowCelebration] = useState(false)
  useEffect(() => {
    if (pct === 100 && prevPctRef.current < 100 && total > 0) {
      setShowCelebration(true)
      if (window?.Capacitor?.isNativePlatform?.()) {
        import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
          Haptics.impact({ style: ImpactStyle.Heavy })
        }).catch(() => {})
      }
      setTimeout(() => setShowCelebration(false), 3000)
    }
    prevPctRef.current = pct
  }, [pct, total])

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
      paddingBottom: 120,
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'rgba(200,123,82,0.92)', fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.6px' }}>
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

        {/* Skeleton loader */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <style>{`@keyframes routinePulse { 0%,100%{opacity:.45} 50%{opacity:.80} }`}</style>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ borderRadius: 18, background: 'rgba(255,235,210,0.22)', border: '1px solid rgba(255,220,160,0.22)', padding: '14px 16px', animation: `routinePulse ${1.2 + i * 0.15}s ease-in-out infinite` }}>
                <div style={{ height: 13, width: '40%', borderRadius: 8, background: 'rgba(200,123,82,0.20)', marginBottom: 14 }} />
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 8, background: 'rgba(200,123,82,0.15)', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 10, borderRadius: 6, background: 'rgba(200,123,82,0.12)', width: `${55 + j * 12}%` }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Toast célébration 100% */}
        {showCelebration && (
          <div style={{
            position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
            background: 'rgba(40,20,5,0.94)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 20, padding: '16px 28px', textAlign: 'center',
            boxShadow: '0 16px 48px rgba(0,0,0,0.40), 0 4px 12px rgba(200,123,82,0.18)',
            border: '1.5px solid rgba(255,220,160,0.22)',
            animation: 'celebPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ display:'flex' }}><StarIcon size={28} color="#E8962A" /></span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(200,123,82,0.95)', fontFamily: 'Poppins,sans-serif' }}>Routine complète !</div>
              <div style={{ fontSize: 12, color: 'rgba(200,123,82,0.60)', fontFamily: 'Poppins,sans-serif', marginTop: 2 }}>100% des étapes accomplies aujourd'hui</div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div style={{
            background: 'rgba(200,123,82,0.08)', border: '1px solid rgba(200,123,82,0.22)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 12,
            fontSize: 13, color: '#ef4444', fontFamily: 'Poppins,sans-serif',
          }}>
            {error}
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
                      fontSize: 12.5, color: 'rgba(200,123,82,0.90)', fontFamily: 'Poppins,sans-serif',
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
                  icon={<SunIcon size={22} color="#E8962A" />}
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
                  icon={<MoonIcon size={22} color="#C87B52" />}
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
                  <LightbulbIcon size={22} color="#E8962A" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#E8962A', fontFamily: 'Poppins,sans-serif', marginBottom: 4 }}>
                      {routine.astuce.titre || 'Astuce du jour'}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(200,123,82,0.60)', fontFamily: 'Poppins,sans-serif', lineHeight: 1.5 }}>
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
                      background: 'linear-gradient(135deg, rgba(200,123,82,0.10), rgba(232,150,42,0.08))',
                      border: '1px solid rgba(255,220,160,0.28)',
                      borderRadius: 20, marginTop: 8,
                    }}
                  >
                    <div style={{ display:'flex', justifyContent:'center', marginBottom: 8 }}><StarIcon size={36} color="#E8962A" /></div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(200,123,82,0.90)', fontFamily: 'Poppins,sans-serif' }}>
                      Journée accomplie !
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(200,123,82,0.70)', fontFamily: 'Poppins,sans-serif', marginTop: 4 }}>
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
