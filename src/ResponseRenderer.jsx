import React, { useState, Component } from 'react'
import { MuscleIcon, LightbulbIcon, LeafIcon, CalendarIcon, ChatIcon, CheckIcon, FoodIcon } from './Icons'

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseRich(text) {
  if (!text || typeof text !== 'string') return null
  try {
    const match = text.match(/\|\|\|JSON\|\|\|([\s\S]*?)\|\|\|END\|\|\|/)
    if (!match) return null
    const data = JSON.parse(match[1].trim())
    if (!data || typeof data !== 'object') return null
    const splitIdx = text.indexOf('|||JSON|||')
    const endIdx   = text.indexOf('|||END|||') + 9
    return {
      before: text.slice(0, splitIdx).trim(),
      data,
      after:  text.slice(endIdx).trim(),
    }
  } catch { return null }
}

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPES = {
  meals:     { accent:'#C87B52', labelEl:<><FoodIcon size={13} color="#C87B52" /> Repas</>,      gradient:'rgba(255,235,210,0.32)' },
  exercises: { accent:'#F59E0B', labelEl:<><MuscleIcon size={13} color="#F59E0B" /> Exercices</>,  gradient:'linear-gradient(135deg,#F59E0B,#D97706)' },
  tips:      { accent:'#C87B52', labelEl:<><LightbulbIcon size={13} color="#C87B52" /> Conseils</>, gradient:'linear-gradient(135deg,#C87B52,#9E5C35)' },
  plants:    { accent:'#34c759', labelEl:<><LeafIcon size={13} color="#34c759" /> Plantes</>,      gradient:'linear-gradient(135deg,#34c759,#16a34a)' },
  routine:   { accent:'#38bdf8', labelEl:<><CalendarIcon size={13} color="#38bdf8" /> Programme</>,gradient:'linear-gradient(135deg,#38bdf8,#0ea5e9)' },
  generic:   { accent:'#C87B52', labelEl:<><ChatIcon size={13} color="#C87B52" /> Suggestions</>, gradient:'linear-gradient(135deg,#C87B52,#9E5C35)' },
}

// ─── Global keyframes injected once ──────────────────────────────────────────
const STYLES = `
  @keyframes slideUp {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`

// ─── BOOKING CARD ─────────────────────────────────────────────────────────────
function BookingCard({ data }) {
  const [added, setAdded] = useState(false)

  function calendarUrl() {
    try {
      const title = encodeURIComponent(data.service || 'Rendez-vous')
      const loc   = encodeURIComponent(data.lieu || '')
      const notes = encodeURIComponent(data.note || '')
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${loc}&details=${notes}`
    } catch { return '#' }
  }

  return (
    <div style={{
      background:'linear-gradient(145deg, #FFF3EE, #FFF8F4)',
      border:'2px solid rgba(200,123,82,0.22)',
      borderRadius:24,
      overflow:'hidden',
      boxShadow:'0 16px 48px rgba(200,123,82,0.14), 0 4px 14px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
      animation:'slideUp 0.4s ease both',
    }}>

      {/* Header gradient */}
      <div style={{
        background:'linear-gradient(135deg, #C87B52, #9E5C35)',
        padding:'16px 20px',
        display:'flex', alignItems:'center', gap:14,
      }}>
        <div style={{
          width:52, height:52, borderRadius:18, flexShrink:0,
          background:'rgba(255,255,255,0.2)',
          border:'1.5px solid rgba(255,255,255,0.35)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:26,
        }}>
          <CalendarIcon size={26} color="rgba(255,255,255,0.9)" />
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
            {data.service || 'Réservation'}
          </div>
          {data.lieu && (
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="10" r="3" stroke="rgba(255,255,255,0.75)" strokeWidth="2"/>
              </svg>
              {data.lieu}
            </div>
          )}
        </div>

        {(data.heure || data.date) && (
          <div style={{ textAlign:'right', flexShrink:0 }}>
            {data.heure && (
              <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{data.heure}</div>
            )}
            {data.date && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 }}>{data.date}</div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>

        {data.note && (
          <div style={{
            display:'flex', gap:10, alignItems:'flex-start',
            background:'rgba(200,123,82,0.06)',
            border:'1px solid rgba(200,123,82,0.15)',
            borderRadius:14, padding:'12px 14px',
          }}>
            <span style={{ flexShrink:0, display:'flex' }}><ChatIcon size={18} color="#C87B52" /></span>
            <span style={{ fontSize:13, color:'rgba(200,123,82,0.85)', lineHeight:1.65 }}>{data.note}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {/* Calendar, primary CTA */}
          <a href={calendarUrl()} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration:'none' }}
            onClick={() => setAdded(true)}>
            <div style={{
              padding:'14px 16px', borderRadius:16,
              background: added ? 'linear-gradient(135deg,#34c759,#16a34a)' : 'linear-gradient(135deg,#C87B52,#9E5C35)',
              color:'#fff',
              fontSize:14, fontWeight:700,
              boxShadow: added ? '0 6px 20px rgba(52,199,89,0.35)' : '0 6px 24px rgba(200,123,82,0.38)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'all 0.3s ease',
              cursor:'pointer',
            }}>
              {added ? <><CheckIcon size={14} color="white" /> Ajouté au calendrier !</> : <><CalendarIcon size={14} color="#fff" /> Ajouter à mon calendrier</>}
            </div>
          </a>

          {/* External links */}
          {Array.isArray(data.links) && data.links.map((link, i) => {
            const safeUrl = /^https?:\/\//i.test(link.url || '') ? link.url : null
            if (!safeUrl) return null
            return (
              <a key={i} href={safeUrl} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:'none' }}>
                <div style={{
                  padding:'12px 16px', borderRadius:16,
                  background:'#fff', color:'#C87B52',
                  border:'1.5px solid #f0e8e0',
                  fontSize:13, fontWeight:600,
                  boxShadow:'0 4px 14px rgba(0,0,0,0.06)',
                  display:'flex', alignItems:'center', gap:8,
                  cursor:'pointer',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#C87B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#C87B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ flex:1 }}>{link.label}</span>
                  <span style={{ fontSize:12, color:'#c4b5a8' }}>↗</span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Regular card ─────────────────────────────────────────────────────────────
function RichCard({ item, accent, index }) {
  const [pressed, setPressed] = useState(false)
  const color = item.color || accent

  return (
    <div
      style={{
        position:'relative',
        background:'rgba(255,255,255,0.20)',
        backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
        border:`1px solid ${color}28`,
        borderLeft:`3px solid ${color}99`,
        borderRadius:18,
        padding:'14px 16px',
        display:'flex', gap:12, alignItems:'flex-start',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        boxShadow:`0 4px 16px ${color}12, inset 0 1px 0 rgba(255,255,255,0.6)`,
        transition:'transform 0.15s ease',
        animation:`slideUp 0.3s ${index * 0.06}s ease both`,
        overflow:'hidden',
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      {/* Icon tile */}
      <div style={{
        width:42, height:42, borderRadius:14, flexShrink:0,
        background:`rgba(255,255,255,0.30)`,
        border:`1px solid ${color}30`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
        boxShadow:`0 3px 10px ${color}20`,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:4 }}>
          <span style={{ fontSize:13, fontWeight:700, color:`${color}dd`, lineHeight:1.25 }}>{item.title}</span>
          {item.badge && (
            <span style={{ fontSize:10, fontWeight:600, color:`${color}cc`, background:`${color}15`, border:`1px solid ${color}22`, borderRadius:7, padding:'2px 8px', flexShrink:0 }}>
              {item.badge}
            </span>
          )}
        </div>
        {item.desc && <div style={{ fontSize:12, color:'rgba(200,123,82,0.78)', lineHeight:1.6, marginBottom:item.sub ? 5 : 0 }}>{item.desc}</div>}
        {item.sub && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:`${color}cc`, fontWeight:600, background:`${color}12`, borderRadius:6, padding:'3px 8px' }}>
            {item.sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Type header ──────────────────────────────────────────────────────────────
function TypeHeader({ cfg, count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, animation:'fadeIn 0.3s ease both' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.22)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:`1px solid ${cfg.accent}30`, borderRadius:20, padding:'7px 16px' }}>
        <span style={{ fontSize:13, fontWeight:700, color:`${cfg.accent}dd`, letterSpacing:'0.2px', display:'flex', alignItems:'center', gap:6 }}>{cfg.labelEl || cfg.label}</span>
      </div>
      {count > 0 && <span style={{ fontSize:11, color:'rgba(160,120,80,0.55)', fontWeight:600 }}>{count} suggestion{count > 1 ? 's' : ''}</span>}
    </div>
  )
}

// ─── Nettoyage du texte libre de Solenn ──────────────────────────────────────
// Filet de sécurité : même si le modèle désobéit au prompt, aucune bulle ne
// doit afficher de markdown brut (**titre**) ni d'emojis-puces (retour Jean
// 2026-07-27). Ne touche PAS aux blocs JSON (les cartes utilisent des icônes).
function nettoyerTexte(t) {
  if (!t) return t
  return t
    .replace(/\*\*(.+?)\*\*/g, '$1')          // **gras** → texte simple
    .replace(/(^|\n)\s*#+\s*/g, '$1')          // ## titres
    .replace(/\p{Extended_Pictographic}/gu, '') // emojis
    .replace(/️|‍/g, '')             // sélecteurs de variante orphelins
    .replace(/[ \t]+([,.!?;:])/g, '$1')        // espaces laissés par un emoji retiré
    .replace(/(^|\n)[ \t]+/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Main renderer ────────────────────────────────────────────────────────────
export default function ResponseRenderer({ content }) {
  if (!content) return null
  const parsed = parseRich(content)

  if (!parsed) {
    return <span style={{ whiteSpace:'pre-wrap', lineHeight:1.72 }}>{nettoyerTexte(content)}</span>
  }

  const { data } = parsed
  const before = nettoyerTexte(parsed.before)
  const after = nettoyerTexte(parsed.after)

  // ── Booking ──────────────────────────────────────────────────────────────────
  if (data.type === 'booking') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        <style>{STYLES}</style>
        {before && (
          <p style={{ margin:'0 0 14px', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>
            {before}
          </p>
        )}
        <BookingCard data={data} />
        {after && (
          <p style={{ margin:'12px 0 0', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>
            {after}
          </p>
        )}
      </div>
    )
  }

  // ── List cards ────────────────────────────────────────────────────────────────
  const cfg   = TYPES[data.type] || TYPES.generic
  const items = Array.isArray(data.items) ? data.items : []

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <style>{STYLES}</style>

      {before && (
        <p style={{ margin:'0 0 14px', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>
          {before}
        </p>
      )}

      {items.length > 0 && <TypeHeader cfg={cfg} count={items.length} />}

      {data.intro && (
        <p style={{ margin:'0 0 14px', fontSize:13, color:'rgba(200,123,82,0.82)', lineHeight:1.6, padding:'10px 14px', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', borderLeft:`3px solid ${cfg.accent}66`, borderRadius:'0 12px 12px 0', border:`1px solid ${cfg.accent}18`, animation:'fadeIn 0.3s ease both' }}>
          {data.intro}
        </p>
      )}

      {items.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom: data.outro ? 14 : 0 }}>
          {items.map((item, i) => <RichCard key={i} item={item} accent={cfg.accent} index={i} />)}
        </div>
      )}

      {data.outro && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'11px 14px', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', border:`1px solid ${cfg.accent}20`, borderRadius:14, animation:'fadeIn 0.4s ease both' }}>
          <span style={{ display:'flex', flexShrink:0 }}><ChatIcon size={15} color={`${cfg.accent}99`} /></span>
          <span style={{ fontSize:12, color:'rgba(200,123,82,0.75)', lineHeight:1.6 }}>{data.outro}</span>
        </div>
      )}

      {after && (
        <p style={{ margin:'12px 0 0', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>{after}</p>
      )}
    </div>
  )
}

export function isRich(content) {
  return typeof content === 'string' && content.includes('|||JSON|||')
}
