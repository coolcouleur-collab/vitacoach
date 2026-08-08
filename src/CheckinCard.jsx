import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'

const F = "'Poppins', system-ui, sans-serif"
const nightText  = (op) => `rgba(180,210,255,${op})`
const warmText   = (op) => `rgba(200,123,82,${op})`
const sunsetText = (op) => `rgba(255,225,200,${op})`

// Palette alignée sur l'univers Solenn : un seul dégradé, du terracotta sourd
// vers l'ambre lumineux. L'ancienne version mélangeait un rouge froid
// (#C85050) et un jaune olive (#C9A24E) qui n'existent nulle part ailleurs dans
// l'app (retour Jean 2026-08-08). Aucun rouge : dire qu'on va mal n'est pas une
// faute, c'est une information — même principe que le score et la grille du défi.
const MOODS = [
  { val: 1, label: 'Très mal',   color: '#A9614A', mouth: 'M8 16.5 Q11 13.5 14 16.5' },
  { val: 2, label: 'Pas top',    color: '#C07551', mouth: 'M8 16 Q11 14.5 14 16' },
  { val: 3, label: 'Ça va',      color: '#D48F52', mouth: 'M8 15.5 L14 15.5' },
  { val: 4, label: 'Bien',       color: '#E8962A', mouth: 'M8 14.5 Q11 16.5 14 14.5' },
  { val: 5, label: 'Très bien',  color: '#F2B64E', mouth: 'M8 14 Q11 17.5 14 14' },
]

const TAGS = ['Énergie', 'Motivation', 'Sérénité', 'Gratitude', 'Stress', 'Fatigue', 'Anxiété', 'Douleurs']

function MoodFace({ mood, size = 38, active }) {
  const stroke = active ? mood.color : 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={{ display: 'block' }}>
      <circle cx="11" cy="11" r="9.2" stroke={stroke} strokeWidth="1.4" fill={active ? `${mood.color}22` : 'none'} />
      <circle cx="7.8" cy="8.8" r="1.05" fill={stroke} />
      <circle cx="14.2" cy="8.8" r="1.05" fill={stroke} />
      <path d={mood.mouth} stroke={stroke} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CheckinCard({ userId, onUpdate, isNight = false, preset = 'day' }) {
  // Aligné sur les autres titres du HomeTab (2 variantes jour/nuit, pas de
  // variante sunset — source d'incohérence relevée par Jean le 2026-07-24)
  const tc = isNight ? nightText : warmText

  const [saved, setSaved] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem('solenn_checkin') || 'null')
      return c?.date === todayStr() ? c : null
    } catch { return null }
  })
  const [mood, setMood] = useState(saved?.mood || 0)
  const [tags, setTags] = useState(saved?.tags || [])
  const [editing, setEditing] = useState(false)

  // Sync depuis Supabase (autre appareil)
  useEffect(() => {
    if (!userId || saved) return
    ;(async () => {
      try {
        const { data } = await supabase
          .from('checkins')
          .select('mood, tags')
          .eq('user_id', userId)
          .eq('date', todayStr())
          .maybeSingle()
        if (data) {
          const c = { date: todayStr(), mood: data.mood, tags: data.tags || [] }
          setSaved(c); setMood(c.mood); setTags(c.tags)
          localStorage.setItem('solenn_checkin', JSON.stringify(c))
        }
      } catch { /* hors-ligne */ }
    })()
  }, [userId])

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 3 ? [...prev, t] : prev)
  }

  async function save() {
    const c = { date: todayStr(), mood, tags }
    setSaved(c)
    setEditing(false)
    localStorage.setItem('solenn_checkin', JSON.stringify(c))
    onUpdate?.('humeur', mood)
    if (!userId) return
    try {
      await supabase.from('checkins').upsert({
        user_id: userId, date: todayStr(), mood, tags,
        moment: new Date().getHours() < 14 ? 'morning' : 'evening',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
    } catch { /* sync au prochain passage */ }
  }

  const open = !saved || editing
  const savedMood = MOODS.find(m => m.val === saved?.mood)

  return (
    <div style={{ padding: '8px 18px 12px', fontFamily: F }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: tc(0.90), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        Check-in du jour
      </div>

      <AnimatePresence mode="wait">
        {open ? (
          <motion.div key="open"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: tc(0.92), marginBottom: 12 }}>
              Comment tu te sens ?
            </div>

            {/* Visages humeur */}
            <div style={{ display: 'flex', gap: 8, marginBottom: mood ? 14 : 4 }}>
              {MOODS.map(m => {
                const active = mood === m.val
                return (
                  <motion.button key={m.val}
                    onClick={() => setMood(m.val)}
                    whileTap={{ scale: 0.88 }}
                    animate={{ scale: active ? 1.12 : 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                    aria-label={m.label}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '10px 4px', borderRadius: 16, cursor: 'pointer', outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      background: active ? `${m.color}1C` : (isNight ? 'rgba(180,210,255,0.05)' : 'rgba(200,123,82,0.05)'),
                      border: `1px solid ${active ? `${m.color}66` : (isNight ? 'rgba(180,210,255,0.10)' : 'rgba(200,123,82,0.12)')}`,
                      color: tc(active ? 0.95 : 0.45),
                    }}
                  >
                    <MoodFace mood={m} active={active} size={30} />
                    <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? m.color : tc(0.55), fontFamily: F }}>
                      {m.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Tags + valider — apparaissent après le choix d'humeur */}
            <AnimatePresence>
              {mood > 0 && (
                <motion.div key="tags"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ fontSize: 11, color: tc(0.60), marginBottom: 8 }}>
                    Qu'est-ce qui domine ? <span style={{ color: tc(0.40) }}>(3 max, optionnel)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                    {TAGS.map(t => {
                      const sel = tags.includes(t)
                      return (
                        <button key={t} onClick={() => toggleTag(t)} style={{
                          padding: '6px 13px', borderRadius: 20, cursor: 'pointer', outline: 'none',
                          WebkitTapHighlightColor: 'transparent', fontFamily: F,
                          fontSize: 12, fontWeight: sel ? 700 : 500,
                          border: `1px solid ${sel ? warmText(0.55) : (isNight ? 'rgba(180,210,255,0.14)' : 'rgba(200,123,82,0.16)')}`,
                          background: sel ? warmText(0.14) : 'transparent',
                          color: sel ? (isNight ? nightText(0.95) : warmText(0.95)) : tc(0.60),
                          transition: 'all 0.18s',
                        }}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                  <motion.button
                    onClick={save}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: 'rgba(255,235,210,0.32)',
                      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      color: '#B2663E', fontSize: 13, fontWeight: 700, fontFamily: F,
                      boxShadow: '0 3px 14px rgba(200,123,82,0.30)', outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Valider
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* État compact : check-in fait */
          <motion.div key="done"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 16,
              background: isNight ? 'rgba(180,210,255,0.05)' : 'rgba(200,123,82,0.06)',
              border: `1px solid ${isNight ? 'rgba(180,210,255,0.10)' : 'rgba(200,123,82,0.14)'}`,
            }}
          >
            {savedMood && (
              <span style={{ color: savedMood.color, display: 'flex', flexShrink: 0 }}>
                <MoodFace mood={savedMood} active size={30} />
              </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tc(0.92) }}>
                {savedMood?.label || `Humeur ${saved.mood}/5`}
              </div>
              {saved.tags?.length > 0 && (
                <div style={{ fontSize: 11, color: tc(0.55), marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {saved.tags.join(' · ')}
                </div>
              )}
            </div>
            <button
              onClick={() => { setEditing(true); setMood(saved.mood); setTags(saved.tags || []) }}
              style={{
                padding: '6px 13px', borderRadius: 20, cursor: 'pointer', outline: 'none',
                border: `1px solid ${isNight ? 'rgba(180,210,255,0.16)' : 'rgba(200,123,82,0.22)'}`,
                background: 'transparent', color: tc(0.70),
                fontSize: 11, fontWeight: 600, fontFamily: F, flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Modifier
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
