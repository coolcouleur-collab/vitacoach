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

const ExercicesGuide = React.lazy(() => import('./ExercicesGuide'))
const Challenge21j = React.lazy(() => import('./Challenge21j'))
import { matchExercice } from './ExercicesGuide'
import { AMBRE, ENCRE, ICONE, ROUGE } from './palette'

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
      background: checked ? 'rgba(var(--rgb-verre), 0.32)' : 'rgba(var(--rgb-terracotta), 0.06)',
      border: checked ? '2px solid transparent' : '2px solid rgba(var(--rgb-terracotta), 0.35)',
      boxShadow: checked ? '0 2px 8px rgba(var(--rgb-terracotta), 0.40)' : 'none',
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
          <stop offset="0%" stopColor="var(--accent)"/>
          <stop offset="100%" stopColor="var(--or-plein)"/>
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={ICONE} strokeWidth={stroke} />
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
function Section({ icon, titre, heure, etapes, checked, onToggle, onVoirGeste, color = 'var(--accent)' }) {
  const done = etapes.filter(e => checked[e.id]).length
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        background: 'rgba(var(--rgb-verre), 0.22)',
        border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
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
            <div style={{ fontSize: 14, fontWeight: 700, color: ENCRE, fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.3px' }}>
              {titre}
            </div>
            {heure && (
              <div style={{ fontSize: 11, color: ENCRE, fontFamily: 'Poppins,sans-serif', marginTop: 1 }}>
                {heure}
              </div>
            )}
          </div>
        </div>
        {etapes.length > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 600, color: done === etapes.length ? 'rgba(var(--rgb-terracotta), 0.90)' : 'rgba(var(--rgb-terracotta), 0.60)',
            fontFamily: 'Poppins,sans-serif', background: done === etapes.length ? 'rgba(var(--rgb-terracotta), 0.18)' : 'rgba(var(--rgb-terracotta), 0.08)',
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
              background: checked[e.id] ? 'rgba(var(--rgb-terracotta), 0.06)' : 'transparent',
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
                  <circle cx="4" cy="4" r="3" fill={ICONE} fillOpacity={checked[e.id] ? 0.35 : 0.70} />
                </svg>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontFamily: 'Poppins,sans-serif',
                  color: ENCRE,   // l'etat fait est deja porte par le line-through et la puce
                  textDecoration: checked[e.id] ? 'line-through' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {e.titre}
                </span>
                {e.duree && (
                  <span style={{
                    fontSize: 10, color: ENCRE,
                    fontFamily: 'Poppins,sans-serif', marginLeft: 'auto', flexShrink: 0,
                  }}>
                    {e.duree}
                  </span>
                )}
              </div>
              {e.description && (
                <div style={{
                  fontSize: 11.5, color: ENCRE,
                  fontFamily: 'Poppins,sans-serif', lineHeight: 1.5,
                  transition: 'color 0.2s',
                }}>
                  {e.description}
                </div>
              )}
              {/* « Voir le geste », si l'étape mentionne un exercice du guide */}
              {onVoirGeste && matchExercice(`${e.titre} ${e.description || ''}`) && !checked[e.id] && (
                <span
                  role="button"
                  onClick={ev => { ev.stopPropagation(); onVoirGeste(matchExercice(`${e.titre} ${e.description || ''}`)) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
                    background: 'rgba(var(--rgb-verre), 0.45)', border: '1px solid rgba(var(--rgb-creme-dore), 0.45)',
                    borderRadius: 99, padding: '5px 12px', cursor: 'pointer',
                    fontFamily: 'Poppins,sans-serif', fontSize: 10.5, fontWeight: 600, color: AMBRE,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--icone-bouton)"><polygon points="6 3 20 12 6 21"/></svg>
                  Voir le geste
                </span>
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
  // Ni repas, ni supplements, ni message : la carte n'affichait plus que son
  // titre et un vide, ce que Jean a vu le 3 septembre. Une carte qui ne dit
  // rien ne doit pas exister.
  if (!nutrition.repas?.length && !nutrition.supplements?.length && !nutrition.indisponible) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
      style={{
        background: 'rgba(var(--rgb-verre), 0.22)',
        border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
        borderRadius: 20, padding: '18px 16px', marginBottom: 12,
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ display:'flex' }}><LightbulbIcon size={22} color={ICONE} /></span>
        <div style={{ fontSize: 14, fontWeight: 700, color: ENCRE, fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.3px' }}>
          {nutrition.titre || 'Nutrition du jour'}
        </div>
      </div>

      {/* Le filet alimentaire, quand il a du retirer les repas, laisse une
          explication ici. Elle etait produite par le serveur depuis ce matin
          et n'etait affichee NULLE PART : la carte montrait un titre et du
          vide. Un filet silencieux ressemble a un bug. */}
      {nutrition.indisponible && (
        <div style={{
          display: 'flex', gap: 9, alignItems: 'flex-start',
          background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
          borderRadius: 12, padding: '10px 12px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ROUGE} strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ fontSize: 12, lineHeight: 1.55, color: ENCRE, fontFamily: 'Poppins,sans-serif' }}>
            {nutrition.indisponible}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(nutrition.repas || []).map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: 'rgba(var(--rgb-terracotta), 0.05)', borderRadius: 12, padding: '10px 12px',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, marginTop: 3 }}>
              <circle cx="6" cy="6" r="4.5" fill="none" stroke={ICONE} strokeWidth="1.6" opacity="0.75" />
              <circle cx="6" cy="6" r="1.8" fill={ICONE} opacity="0.75" />
            </svg>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ENCRE, fontFamily: 'Poppins,sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {r.moment}
              </div>
              <div style={{ fontSize: 12.5, color: ENCRE, fontFamily: 'Poppins,sans-serif', marginTop: 2, lineHeight: 1.4 }}>
                {r.suggestion}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nutrition.supplements?.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(var(--rgb-terracotta), 0.06)', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ENCRE, fontFamily: 'Poppins,sans-serif', marginBottom: 4, display:'flex', alignItems:'center', gap:5 }}>
            <SparkleIcon size={11} color={ICONE} /> Suppléments
          </div>
          {nutrition.supplements.map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: ENCRE, fontFamily: 'Poppins,sans-serif' }}>• {s}</div>
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
      <div style={{ marginBottom: 20, display:'flex', justifyContent:'center' }}><SunIcon size={56} color="var(--ambre-fonce)" /></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: ENCRE, fontFamily: 'Poppins,sans-serif', marginBottom: 8, letterSpacing: '-0.4px' }}>
        Pas encore de routine
      </div>
      <div style={{ fontSize: 13, color: ENCRE, fontFamily: 'Poppins,sans-serif', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        Solenn va générer une routine personnalisée pour ta journée en fonction de ton profil et de tes métriques.
      </div>
      <button
        onClick={onGenerate}
        disabled={generating}
        style={{
          padding: '14px 28px', borderRadius: 16, border: 'none',
          background: generating ? 'rgba(var(--rgb-terracotta), 0.20)' : 'rgba(var(--rgb-verre), 0.32)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: ENCRE,   // l'attente est signalee par l'animation, pas par un texte efface
          fontSize: 14, fontWeight: 700, fontFamily: 'Poppins,sans-serif',
          cursor: generating ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 0.2s',
          boxShadow: generating ? 'none' : '0 4px 20px rgba(var(--rgb-terracotta), 0.35)',
        }}
      >
        <RefreshSVG spinning={generating} />
        {generating ? 'Génération en cours…' : <span style={{display:'flex',alignItems:'center',gap:6}}><SparkleIcon size={13} color="var(--icone-bouton)" />Générer ma routine</span>}
      </button>
    </motion.div>
  )
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
const CourseActive = React.lazy(() => import('./CourseActive'))
const IdeesRepas = React.lazy(() => import('./IdeesRepas'))

export default function RoutineTab({ userId, profil, isPro, onPasserPro }) {
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

  const [showExos, setShowExos] = useState(false)
  const [courseOuverte, setCourseOuverte] = useState(false)

  // ── Programme OU Routine, plus jamais les deux empilés ──────────────────
  // La page mélangeait le défi 21 jours, la routine du jour et le guide dans
  // un seul flux : brouillon, et personne ne savait ce qu'il devait faire.
  // Deux onglets aux rôles écrits noir sur blanc : le PROGRAMME est le plan
  // sport-santé-nutrition qui vise TON objectif sur 21 jours ; la ROUTINE est
  // le rythme quotidien que Solenn régénère chaque matin selon tes données
  // (séparation demandée par Jean 2026-08-12).
  const [vue, setVue] = useState('programme')


  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: 40,
    }}>
      {showExos && (
        <React.Suspense fallback={null}>
          <ExercicesGuide initial={typeof showExos === 'string' ? showExos : null} onClose={() => setShowExos(false)} />
        </React.Suspense>
      )}
      {/* ── Header ── */}
      <div style={{
        padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: ENCRE, fontFamily: 'Poppins,sans-serif', letterSpacing: '-0.6px' }}>
            {vue === 'programme' ? 'Ton sport' : vue === 'routine' ? 'Ta routine' : 'Ton alimentation'}
          </div>
          <div style={{ fontSize: 12, color: ENCRE, fontFamily: 'Poppins,sans-serif', marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {vue === 'programme' && isPro && (
          <button
            onClick={() => { try { window.dispatchEvent(new CustomEvent('solenn:nouveau-programme')) } catch {} }}
            title="Nouveau programme"
            style={{
              width: 38, height: 38, borderRadius: 12, border: 'none',
              background: 'rgba(var(--rgb-terracotta), 0.12)',
              color: ENCRE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {/* PAS l'icone de regeneration. Les deux fleches circulaires
                sont aussi celles du bouton de la routine, quelques lignes plus
                bas, ou elles ne font que rafraichir sans consequence. Ici le
                meme dessin remet un programme entier a zero. Meme icone, deux
                poids tres differents. Un plus dit « nouveau », pas
                « actualiser ». */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
        {vue === 'routine' && routine && (
          <button
            onClick={generer}
            disabled={generating}
            title="Régénérer"
            style={{
              width: 38, height: 38, borderRadius: 12, border: 'none',
              background: generating ? 'rgba(var(--rgb-terracotta), 0.10)' : 'rgba(var(--rgb-terracotta), 0.12)',
              color: ENCRE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: generating ? 'default' : 'pointer',
            }}
          >
            <RefreshSVG spinning={generating} />
          </button>
        )}
      </div>

      {/* ── Sélecteur Programme / Routine ── */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', gap: 6, padding: 4, borderRadius: 16,
          background: 'rgba(var(--rgb-terracotta), 0.10)', border: '1px solid rgba(var(--rgb-terracotta), 0.18)',
        }}>
          {/* « Sport » et non « Programme ». L'onglet parent s'appelle
              Programmes : un sous-onglet du meme nom obligeait a se demander
              lequel des deux on regarde. Et surtout, ces trois mots repondent
              maintenant a « je cherche quoi ? » et non a « ca parle de quoi ? ». */}
          {[
            { id: 'programme', label: 'Sport' },
            { id: 'routine',   label: 'Routine' },
            { id: 'nutrition', label: 'Nutrition' },
          ].map(o => (
            <button key={o.id} onClick={() => setVue(o.id)} style={{
              flex: 1, padding: '9px 0', borderRadius: 12, cursor: 'pointer',
              border: vue === o.id ? '1px solid rgba(var(--rgb-brun-fonce),0.55)' : '1px solid transparent',
              background: vue === o.id ? 'linear-gradient(135deg,var(--brun-fonce),var(--brun-moyen))' : 'transparent',
              color: vue === o.id ? '#fff' : ENCRE,
              fontFamily: 'Poppins,sans-serif', fontSize: 13, fontWeight: vue === o.id ? 700 : 500,
              boxShadow: vue === o.id ? '0 3px 10px rgba(var(--rgb-terracotta), 0.16)' : 'none',
              transition: 'all 0.18s ease',
            }}>{o.label}</button>
          ))}
        </div>
        {/* Chaque vue dit son rôle en une phrase : c'est la distinction que la
            page ne faisait jamais. */}
        <div style={{ fontSize: 11.5, color: ENCRE, fontFamily: 'Poppins,sans-serif', lineHeight: 1.5, padding: '9px 4px 0' }}>
          {vue === 'programme'
            ? "Pour t'engager sur un objectif physique, avec des séances et une progression."
            : vue === 'routine'
              ? "Pour reprendre un rythme sans t'engager sur un programme sportif."
              // Disait mot pour mot ce que dit deja la carte du programme,
              // quinze lignes plus bas : « Remettre de l'ordre dans les
              // assiettes, sans rien compter. » Cette phrase decrit l'ONGLET,
              // qui contient aussi les repas du jour, les idees et la photo,
              // pas seulement le programme qu'on peut y commencer.
              : "Tes repas du jour, des idées quand tu sèches, et un programme si tu veux t'y tenir."}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div style={{ padding: '16px 20px 0' }}>

        {/* ── 1. LE DÉFI 21 JOURS, c'est LE programme, il ouvre la page.
             Une seule instance (le raccourci doublon a été supprimé,
             retour Jean 2026-07-25). ── */}
        {vue === 'programme' && userId && (
          <div style={{ marginBottom: 16 }}>
            {/* Libellé « 21 jours vers ton objectif » retiré : le mot 21 jours
                apparaissait quatre fois sur l'écran et « Ton cap » dit déjà
                l'essentiel juste dessous (constat Jean 2026-08-13). */}
            <React.Suspense fallback={null}>
              <Challenge21j userId={userId} isPro={isPro} onPasserPro={onPasserPro}
                profil={profil} famille="sport"
                onMarcher={() => setCourseOuverte(true)} />
            </React.Suspense>
          </div>
        )}

        {/* Skeleton loader */}
        {vue === 'routine' && loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <style>{`@keyframes routinePulse { 0%,100%{opacity:.45} 50%{opacity:.80} }`}</style>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ borderRadius: 18, background: 'rgba(var(--rgb-verre), 0.22)', border: '1px solid rgba(var(--rgb-creme-dore), 0.22)', padding: '14px 16px', animation: `routinePulse ${1.2 + i * 0.15}s ease-in-out infinite` }}>
                <div style={{ height: 13, width: '40%', borderRadius: 8, background: 'rgba(var(--rgb-terracotta), 0.20)', marginBottom: 14 }} />
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 8, background: 'rgba(var(--rgb-terracotta), 0.15)', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 10, borderRadius: 6, background: 'rgba(var(--rgb-terracotta), 0.12)', width: `${55 + j * 12}%` }} />
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
            background: 'rgba(var(--rgb-bulle), 0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 20, padding: '16px 28px', textAlign: 'center',
            boxShadow: '0 16px 48px rgba(0,0,0,0.40), 0 4px 12px rgba(var(--rgb-terracotta), 0.18)',
            border: '1.5px solid rgba(var(--rgb-creme-dore), 0.60)',
            animation: 'celebPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ display:'flex' }}><StarIcon size={28} color="var(--ambre-fonce)" /></span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: ENCRE, fontFamily: 'Poppins,sans-serif' }}>Routine complète !</div>
              <div style={{ fontSize: 12, color: ENCRE, fontFamily: 'Poppins,sans-serif', marginTop: 2 }}>100% des étapes accomplies aujourd'hui</div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {vue === 'routine' && !loading && error && (
          <div style={{
            background: 'rgba(var(--rgb-terracotta), 0.08)', border: '1px solid rgba(var(--rgb-terracotta), 0.22)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 12,
            fontSize: 13, color: ROUGE, fontFamily: 'Poppins,sans-serif',
          }}>
            {error}
          </div>
        )}

        {/* Vide */}
        {vue === 'routine' && !loading && !routine && (
          <EmptyRoutine generating={generating} onGenerate={generer} />
        )}

        {/* Routine chargée */}
        <AnimatePresence>
          {vue === 'routine' && !loading && routine && (
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
                  background: 'linear-gradient(135deg, rgba(var(--rgb-terracotta), 0.12), rgba(var(--rgb-or), 0.08))',
                  border: '1px solid rgba(var(--rgb-terracotta), 0.14)',
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
                    <span style={{ fontSize: 15, fontWeight: 800, color: ENCRE, fontFamily: 'Poppins,sans-serif', lineHeight: 1 }}>
                      {pct}%
                    </span>
                    <span style={{ fontSize: 9, color: ENCRE, fontFamily: 'Poppins,sans-serif' }}>
                      du jour
                    </span>
                  </div>
                </div>

                {/* Motivation */}
                <div style={{ flex: 1 }}>
                  {routine.motivation && (
                    <div style={{
                      fontSize: 12.5, color: ENCRE, fontFamily: 'Poppins,sans-serif',
                      lineHeight: 1.55, fontStyle: 'italic', marginBottom: 8,
                      fontWeight: 500,
                    }}>
                      "{routine.motivation}"
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: ENCRE, fontFamily: 'Poppins,sans-serif' }}>
                    {done}/{total} étapes complétées
                    {genTime && ` · générée à ${formatHeure(genTime)}`}
                  </div>
                </div>
              </motion.div>

              {/* ── Astuce du jour, juste sous l'intro de la journée
                   (elle flottait en bas de page, retour Jean 2026-07-27) ── */}
              {routine.astuce && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    background: 'rgba(var(--rgb-or), 0.08)',
                    border: '1px solid rgba(var(--rgb-or), 0.18)',
                    borderRadius: 16, padding: '14px 16px',
                    marginBottom: 16,
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}
                >
                  <LightbulbIcon size={22} color="var(--ambre-fonce)" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: AMBRE, fontFamily: 'Poppins,sans-serif', marginBottom: 4 }}>
                      {routine.astuce.titre || 'Astuce du jour'}
                    </div>
                    <div style={{ fontSize: 12.5, color: ENCRE, fontFamily: 'Poppins,sans-serif', lineHeight: 1.5 }}>
                      {routine.astuce.conseil}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Matin ── */}
              {routine.matin?.etapes?.length > 0 && (
                <Section onVoirGeste={id => setShowExos(id)}
                  icon={<SunIcon size={22} color="var(--ambre-fonce)" />}
                  titre={routine.matin.titre || 'Matin'}
                  heure={routine.matin.heure}
                  etapes={routine.matin.etapes}
                  checked={checked}
                  onToggle={toggleStep}
                />
              )}

              {/* Les repas du jour ne s'affichent plus ICI. Ils viennent de la
                  routine, donc ils etaient rendus dans les deux onglets. La
                  routine porte le RYTHME de la journee, Nutrition porte les
                  repas : c'est la separation que Jean a posee, et la carte
                  s'y tenait mal (demande du 3 septembre). */}

              {/* ── Après-midi ── */}
              {routine.apresmidi?.etapes?.length > 0 && (
                <Section onVoirGeste={id => setShowExos(id)}
                  icon={<SunIcon size={22} color="var(--ambre-fonce)" />}
                  titre={routine.apresmidi.titre || 'Après-midi'}
                  heure={routine.apresmidi.heure}
                  etapes={routine.apresmidi.etapes}
                  checked={checked}
                  onToggle={toggleStep}
                />
              )}

              {/* ── Soir ── */}
              {routine.soir?.etapes?.length > 0 && (
                <Section onVoirGeste={id => setShowExos(id)}
                  icon={<MoonIcon size={22} color={ICONE} />}
                  titre={routine.soir.titre || 'Soir'}
                  heure={routine.soir.heure}
                  etapes={routine.soir.etapes}
                  checked={checked}
                  onToggle={toggleStep}
                />
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
                      background: 'linear-gradient(135deg, rgba(var(--rgb-terracotta), 0.10), rgba(var(--rgb-or), 0.08))',
                      border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
                      borderRadius: 20, marginTop: 8,
                    }}
                  >
                    <div style={{ display:'flex', justifyContent:'center', marginBottom: 8 }}><StarIcon size={36} color="var(--ambre-fonce)" /></div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: ENCRE, fontFamily: 'Poppins,sans-serif' }}>
                      Journée accomplie !
                    </div>
                    <div style={{ fontSize: 12.5, color: ENCRE, fontFamily: 'Poppins,sans-serif', marginTop: 4 }}>
                      Tu as terminé toutes tes étapes. Solenn est fière de toi !
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Vue NUTRITION, la maison des repas, demandee par Jean le
             2026-08-13. Regroupe ce qui etait eparpille : les trois repas de la
             routine, et le bouton photo de repas qui vivait cache dans le chat.
             Les donnees viennent de la routine deja generee : pas d'appel
             supplementaire. ── */}
        {vue === 'nutrition' && (
          <div>
            {routine?.nutrition ? (
              <NutritionCard nutrition={routine.nutrition} />
            ) : (
              <div style={{
                background: 'rgba(var(--rgb-verre), 0.22)', border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
                borderRadius: 18, padding: '18px 20px', marginBottom: 14,
                fontFamily: 'Poppins,sans-serif', fontSize: 13, color: ENCRE, lineHeight: 1.55,
              }}>
                {/* Disait d'aller generer sa routine ailleurs, sans preciser
                    que la meme page propose deja « Trouve-moi des idees » un
                    peu plus bas. Deux chemins pour la meme question, dont un
                    qui demande un detour : la phrase dit maintenant ce qui les
                    distingue. */}
                Pour voir ici tes trois repas du jour, génère ta routine dans l'onglet
                Routine. Si tu cherches juste une idée pour un repas, « Trouve-moi
                des idées » plus bas répond tout de suite.
              </div>
            )}

            {/* Les idees de repas AVANT le programme. L'onglet posait trois
                blocs qui parlent de manger, repas du jour, idees et photo, avec
                le programme plante au milieu : le contenu quotidien etait coupe
                en deux. La regle etait deja la bonne, « le quotidien d'abord,
                l'engagement ensuite », elle n'allait juste pas jusqu'au bout. */}
            {userId && (
              <React.Suspense fallback={null}>
                <IdeesRepas userId={userId} profil={profil} />
              </React.Suspense>
            )}

            <button
              onClick={() => { try { window.dispatchEvent(new CustomEvent('solenn:photo-repas')) } catch {} }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(var(--rgb-verre), 0.32)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(var(--rgb-creme-dore), 0.40)', borderRadius: 18,
                padding: '14px 16px', cursor: 'pointer', marginBottom: 8,
                fontFamily: 'Poppins,sans-serif', textAlign: 'left',
              }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: 'rgba(var(--rgb-terracotta), 0.12)', border: '1.5px solid rgba(var(--rgb-terracotta), 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: ENCRE }}>Photographie ton repas</div>
                <div style={{ fontSize: 11, color: ENCRE, marginTop: 1 }}>Solenn l'analyse et te dit ce qu'elle en pense</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Le programme APRES tout le quotidien. Il n'installe pas une
                reponse a « je mange quoi ce soir » mais des habitudes sur
                quatre semaines : c'est un engagement, il vient en dernier. */}
            {userId && (
              <div style={{ marginTop: 18, marginBottom: 4 }}>
                <React.Suspense fallback={null}>
                  <Challenge21j userId={userId} isPro={isPro} onPasserPro={onPasserPro}
                    profil={profil} famille="nutrition" />
                </React.Suspense>
              </div>
            )}
          </div>
        )}

        {/* ── Aller plus loin, depuis la Routine.
             La routine du jour est legere et sans engagement, c'est son role.
             Ceux qui veulent aller plus loin sur leur energie trouvent ici le
             programme de 21 jours qui creuse le sujet. Il vient APRES la
             routine, et non a la place : proposer un engagement de trois
             semaines a quelqu'un venu chercher le contraire, c'est le perdre. ── */}
        {vue === 'routine' && userId && !loading && (
          <div style={{ marginTop: 20 }}>
            <React.Suspense fallback={null}>
              <Challenge21j userId={userId} isPro={isPro} onPasserPro={onPasserPro}
                profil={profil} famille="routine" />
            </React.Suspense>
          </div>
        )}

        {/* ── 3. La marche a REMONTE dans Challenge21j, juste sous la course.
             Elle etait ici, en avant-derniere position, sous un message qui
             parle de la fin du programme. C'est une action pour maintenant :
             sa place est avec les autres actions du jour. Le bouton est
             desormais rendu par Challenge21j via `onMarcher`, l'ouverture de
             CourseActive reste pilotee ici. ── */}

        {/* ── 4. Ressource : le guide des gestes, côté Programme ── */}
        {vue === 'programme' && (
        <button onClick={() => setShowExos(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(var(--rgb-verre), 0.32)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(var(--rgb-creme-dore), 0.40)', borderRadius: 18,
          padding: '14px 16px', cursor: 'pointer', marginTop: 4, marginBottom: 8,
          fontFamily: 'Poppins,sans-serif', textAlign: 'left',
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: 'rgba(var(--rgb-terracotta), 0.12)', border: '1.5px solid rgba(var(--rgb-terracotta), 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.8" strokeLinecap="round"><path d="M14.4 14.4 9.6 9.6M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829zM5.343 2.515a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829L6.404 12.77a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: ENCRE }}>Guide des exercices</div>
            <div style={{ fontSize: 11, color: ENCRE, marginTop: 1 }}>Les 25 gestes montrés et expliqués</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        )}
      </div>

      {courseOuverte && (
        <React.Suspense fallback={null}>
          <CourseActive
            userId={userId}
            mode="marche"
            onFermer={() => setCourseOuverte(false)}
          />
        </React.Suspense>
      )}

      {/* ── CSS spin ── */}
      <style>{`
        @keyframes spin360 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
