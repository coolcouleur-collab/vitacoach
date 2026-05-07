import React, { useState } from 'react'

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseRich(text) {
  const match = text.match(/\|\|\|JSON\|\|\|([\s\S]*?)\|\|\|END\|\|\|/)
  if (!match) return null
  try {
    const data = JSON.parse(match[1].trim())
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
  meals:     { accent:'#FF6B35', light:'#FFF3EE', label:'🍽️ Repas',      gradient:'linear-gradient(135deg,#FF6B35,#FF9A3C)' },
  exercises: { accent:'#a78bfa', light:'#F5F3FF', label:'💪 Exercices',   gradient:'linear-gradient(135deg,#a78bfa,#7c3aed)' },
  tips:      { accent:'#FF9A3C', light:'#FFFBF4', label:'💡 Conseils',    gradient:'linear-gradient(135deg,#FF9A3C,#f59e0b)' },
  plants:    { accent:'#34c759', light:'#F0FFF4', label:'🌿 Plantes',     gradient:'linear-gradient(135deg,#34c759,#16a34a)' },
  routine:   { accent:'#38bdf8', light:'#F0F9FF', label:'📅 Programme',   gradient:'linear-gradient(135deg,#38bdf8,#0ea5e9)' },
  generic:   { accent:'#FF6B35', light:'#FFF8F4', label:'✦ Suggestions', gradient:'linear-gradient(135deg,#FF6B35,#E55A00)' },
}

// ─── BOOKING CARD ─────────────────────────────────────────────────────────────
function BookingCard({ data, before }) {
  const [added, setAdded] = useState(false)

  function calendarUrl() {
    const title = encodeURIComponent(data.service || 'Rendez-vous')
    const loc   = encodeURIComponent(data.lieu || '')
    const notes = encodeURIComponent(data.note || '')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${loc}&details=${notes}`
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Text before (coaching message) */}
      {before && (
        <p style={{ margin:'0 0 16px', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>
          {before}
        </p>
      )}

      {/* Booking card */}
      <div style={{
        background:'linear-gradient(145deg, #FFF3EE, #FFF8F4)',
        border:'2px solid rgba(255,107,53,0.22)',
        borderRadius:24,
        overflow:'hidden',
        boxShadow:'0 16px 48px rgba(255,107,53,0.14), 0 4px 14px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
        animation:'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Header band */}
        <div style={{
          background:'linear-gradient(135deg, #FF6B35, #E55A00)',
          padding:'16px 20px',
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{
            width:52, height:52, borderRadius:18,
            background:'rgba(255,255,255,0.2)',
            border:'1.5px solid rgba(255,255,255,0.35)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26,
            boxShadow:'0 4px 14px rgba(0,0,0,0.15)',
          }}>
            {data.emoji || '📅'}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#fff', lineHeight:1.2 }}>
              {data.service}
            </div>
            {data.lieu && (
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3 }}>
                📍 {data.lieu}
              </div>
            )}
          </div>
          {(data.heure || data.date) && (
            <div style={{ textAlign:'right' }}>
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
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Note from coach */}
          {data.note && (
            <div style={{
              display:'flex', gap:10, alignItems:'flex-start',
              background:'rgba(255,107,53,0.06)',
              border:'1px solid rgba(255,107,53,0.15)',
              borderRadius:14, padding:'12px 14px',
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>💬</span>
              <span style={{ fontSize:13, color:'#6b5042', lineHeight:1.65 }}>{data.note}</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>

            {/* Calendar — primary */}
            <a href={calendarUrl()} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration:'none' }}
              onClick={() => setAdded(true)}>
              <button style={{
                width:'100%', padding:'14px 16px', borderRadius:16,
                background: added
                  ? 'linear-gradient(135deg,#34c759,#16a34a)'
                  : 'linear-gradient(135deg,#FF6B35,#E55A00)',
                color:'#fff', border:'none',
                fontSize:14, fontWeight:700, cursor:'pointer',
                fontFamily:'Poppins,sans-serif',
                boxShadow: added
                  ? '0 6px 20px rgba(52,199,89,0.35)'
                  : '0 6px 24px rgba(255,107,53,0.40)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                transition:'all 0.3s ease',
              }}>
                {added ? '✅ Ajouté au calendrier !' : '📅 Ajouter à mon calendrier'}
              </button>
            </a>

            {/* External links */}
            {data.links?.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:'none' }}>
                <button style={{
                  width:'100%', padding:'12px 16px', borderRadius:16,
                  background:'#fff', color:'#1a0a00',
                  border:'1.5px solid #f0e8e0',
                  fontSize:13, fontWeight:600, cursor:'pointer',
                  fontFamily:'Poppins,sans-serif',
                  boxShadow:'0 4px 14px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  transition:'transform 0.18s ease, box-shadow 0.18s ease',
                }}>
                  <span style={{ fontSize:16 }}>{link.icon}</span>
                  {link.label}
                  <span style={{ marginLeft:'auto', fontSize:12, color:'#c4b5a8' }}>↗</span>
                </button>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Regular card ─────────────────────────────────────────────────────────────
function RichCard({ item, accent, index }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const color = item.color || accent

  const scale  = pressed ? 'scale(0.965)' : hovered ? 'scale(1.015)' : 'scale(1)'
  const shadow = hovered
    ? `0 16px 40px ${color}28, 0 4px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)`
    : `0 6px 20px ${color}14, 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)`

  return (
    <div
      style={{
        position:'relative',
        background:`linear-gradient(145deg, ${color}10, ${color}04)`,
        border:`1.5px solid ${color}22`,
        borderLeft:`4px solid ${color}`,
        borderRadius:20,
        padding:'16px 18px 16px 16px',
        display:'flex', gap:14, alignItems:'flex-start',
        transform:scale, boxShadow:shadow,
        transition:'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
        cursor:'default',
        animation:`cardIn 0.38s ${index * 0.07}s cubic-bezier(0.34,1.56,0.64,1) both`,
        overflow:'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 90% 10%, ${color}10, transparent 60%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:10, right:12, fontSize:10, fontWeight:800, color:`${color}60`, letterSpacing:'0.5px', fontFamily:'Poppins,sans-serif' }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Icon */}
      <div style={{
        width:50, height:50, borderRadius:16, flexShrink:0,
        background:`linear-gradient(145deg, ${color}30, ${color}16)`,
        border:`1.5px solid ${color}35`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
        boxShadow:`0 6px 14px ${color}25, inset 0 1px 0 rgba(255,255,255,0.7)`,
        transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
        transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {item.icon || '✦'}
      </div>

      {/* Text */}
      <div style={{ flex:1, minWidth:0, paddingRight:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:5 }}>
          <span style={{ fontSize:14, fontWeight:800, color:'#1a0a00', lineHeight:1.25 }}>{item.title}</span>
          {item.badge && (
            <span style={{ fontSize:10, fontWeight:700, color:color, background:`${color}18`, border:`1px solid ${color}25`, borderRadius:8, padding:'2px 9px', letterSpacing:'0.3px', flexShrink:0, whiteSpace:'nowrap' }}>
              {item.badge}
            </span>
          )}
        </div>
        {item.desc && <div style={{ fontSize:12.5, color:'#6b5042', lineHeight:1.65, marginBottom:item.sub ? 6 : 0 }}>{item.desc}</div>}
        {item.sub && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:color, fontWeight:700, background:`${color}10`, borderRadius:6, padding:'3px 8px' }}>
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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, animation:'cardIn 0.3s ease both' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:cfg.gradient, borderRadius:20, padding:'7px 16px', boxShadow:`0 6px 20px ${cfg.accent}30` }}>
        <span style={{ fontSize:13, fontWeight:800, color:'#fff', letterSpacing:'0.2px' }}>{cfg.label}</span>
      </div>
      {count > 0 && <span style={{ fontSize:11, color:'#c4b5a8', fontWeight:600 }}>{count} suggestion{count > 1 ? 's' : ''}</span>}
    </div>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────
export default function ResponseRenderer({ content }) {
  const parsed = parseRich(content)

  if (!parsed) {
    return <span style={{ whiteSpace:'pre-wrap', lineHeight:1.72 }}>{content}</span>
  }

  const { before, data, after } = parsed

  // ── Booking ──
  if (data.type === 'booking') {
    return (
      <>
        <style>{`@keyframes cardIn { 0%{opacity:0;transform:translateY(14px) scale(0.94)} 60%{transform:translateY(-3px) scale(1.01)} 100%{opacity:1;transform:translateY(0) scale(1)} }`}</style>
        <BookingCard data={data} before={before} />
        {after && <p style={{ margin:'12px 0 0', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>{after}</p>}
      </>
    )
  }

  // ── List cards ──
  const cfg   = TYPES[data.type] || TYPES.generic
  const items = data.items || []

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <style>{`
        @keyframes cardIn { 0%{opacity:0;transform:translateY(14px) scale(0.94)} 60%{transform:translateY(-3px) scale(1.01)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {before && <p style={{ margin:'0 0 14px', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>{before}</p>}

      {items.length > 0 && <TypeHeader cfg={cfg} count={items.length} />}

      {data.intro && (
        <p style={{ margin:'0 0 14px', fontSize:13.5, color:'#6b5042', lineHeight:1.65, padding:'10px 14px', background:`${cfg.accent}08`, borderLeft:`3px solid ${cfg.accent}40`, borderRadius:'0 10px 10px 0', animation:'fadeSlide 0.3s ease both' }}>
          {data.intro}
        </p>
      )}

      {items.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
          {items.map((item, i) => <RichCard key={i} item={item} accent={cfg.accent} index={i} />)}
        </div>
      )}

      {data.outro && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:`linear-gradient(135deg, ${cfg.accent}08, ${cfg.accent}04)`, border:`1px solid ${cfg.accent}20`, borderRadius:14, animation:`fadeSlide 0.3s ${items.length * 0.07 + 0.1}s ease both`, animationFillMode:'both', opacity:0 }}>
          <span style={{ fontSize:16 }}>💬</span>
          <span style={{ fontSize:12.5, color:'#6b5042', lineHeight:1.6, fontStyle:'italic' }}>{data.outro}</span>
        </div>
      )}

      {after && <p style={{ margin:'12px 0 0', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>{after}</p>}
    </div>
  )
}

export function isRich(content) {
  return typeof content === 'string' && content.includes('|||JSON|||')
}
