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
  meals:     { accent:'#FF6B35', light:'#FFF3EE', label:'🍽️ Repas',         gradient:'linear-gradient(135deg,#FF6B35,#FF9A3C)' },
  exercises: { accent:'#a78bfa', light:'#F5F3FF', label:'💪 Exercices',      gradient:'linear-gradient(135deg,#a78bfa,#7c3aed)' },
  tips:      { accent:'#FF9A3C', light:'#FFFBF4', label:'💡 Conseils',       gradient:'linear-gradient(135deg,#FF9A3C,#f59e0b)' },
  plants:    { accent:'#34c759', light:'#F0FFF4', label:'🌿 Plantes',        gradient:'linear-gradient(135deg,#34c759,#16a34a)' },
  routine:   { accent:'#38bdf8', light:'#F0F9FF', label:'📅 Programme',      gradient:'linear-gradient(135deg,#38bdf8,#0ea5e9)' },
  generic:   { accent:'#FF6B35', light:'#FFF8F4', label:'✦ Suggestions',    gradient:'linear-gradient(135deg,#FF6B35,#E55A00)' },
}

// ─── Card ─────────────────────────────────────────────────────────────────────
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
        position: 'relative',
        background: `linear-gradient(145deg, ${color}10, ${color}04)`,
        border: `1.5px solid ${color}22`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 20,
        padding: '16px 18px 16px 16px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        transform: scale,
        boxShadow: shadow,
        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
        cursor: 'default',
        animation: `cardIn 0.38s ${index * 0.07}s cubic-bezier(0.34,1.56,0.64,1) both`,
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false) }}
    >
      {/* Subtle bg shimmer */}
      <div style={{
        position:'absolute', inset:0,
        background:`radial-gradient(circle at 90% 10%, ${color}10, transparent 60%)`,
        pointerEvents:'none',
      }} />

      {/* Number badge */}
      <div style={{
        position:'absolute', top:10, right:12,
        fontSize:10, fontWeight:800, color:`${color}60`,
        letterSpacing:'0.5px',
        fontFamily:'Poppins,sans-serif',
      }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Icon tile */}
      <div style={{
        width: 50, height: 50, borderRadius: 16, flexShrink: 0,
        background: `linear-gradient(145deg, ${color}30, ${color}16)`,
        border: `1.5px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        boxShadow: `0 6px 14px ${color}25, inset 0 1px 0 rgba(255,255,255,0.7)`,
        transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {item.icon || '✦'}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:5 }}>
          <span style={{ fontSize:14, fontWeight:800, color:'#1a0a00', lineHeight:1.25 }}>
            {item.title}
          </span>
          {item.badge && (
            <span style={{
              fontSize:10, fontWeight:700,
              color: color,
              background: `${color}18`,
              border: `1px solid ${color}25`,
              borderRadius:8, padding:'2px 9px',
              letterSpacing:'0.3px', flexShrink:0,
              whiteSpace:'nowrap',
            }}>
              {item.badge}
            </span>
          )}
        </div>

        {item.desc && (
          <div style={{ fontSize:12.5, color:'#6b5042', lineHeight:1.65, marginBottom: item.sub ? 6 : 0 }}>
            {item.desc}
          </div>
        )}

        {item.sub && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:4,
            fontSize:11, color:color, fontWeight:700,
            background:`${color}10`, borderRadius:6,
            padding:'3px 8px', marginTop: item.desc ? 2 : 0,
          }}>
            {item.sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Header banner ────────────────────────────────────────────────────────────
function TypeHeader({ cfg, count }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      marginBottom:14,
      animation:'cardIn 0.3s ease both',
    }}>
      <div style={{
        display:'inline-flex', alignItems:'center', gap:8,
        background: cfg.gradient,
        borderRadius:20, padding:'7px 16px',
        boxShadow:`0 6px 20px ${cfg.accent}30`,
      }}>
        <span style={{ fontSize:13, fontWeight:800, color:'#fff', letterSpacing:'0.2px' }}>
          {cfg.label}
        </span>
      </div>
      {count > 0 && (
        <span style={{ fontSize:11, color:'#c4b5a8', fontWeight:600 }}>
          {count} suggestion{count > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ResponseRenderer({ content }) {
  const parsed = parseRich(content)

  if (!parsed) {
    return <span style={{ whiteSpace:'pre-wrap', lineHeight:1.72 }}>{content}</span>
  }

  const { before, data, after } = parsed
  const cfg   = TYPES[data.type] || TYPES.generic
  const items = data.items || []

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <style>{`
        @keyframes cardIn {
          0%   { opacity:0; transform:translateY(14px) scale(0.94); }
          60%  { transform:translateY(-3px) scale(1.01); }
          100% { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes fadeSlide {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Text before */}
      {before && (
        <p style={{ margin:'0 0 14px', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>
          {before}
        </p>
      )}

      {/* Type header */}
      {items.length > 0 && <TypeHeader cfg={cfg} count={items.length} />}

      {/* Intro */}
      {data.intro && (
        <p style={{
          margin:'0 0 14px', fontSize:13.5, color:'#6b5042', lineHeight:1.65,
          padding:'10px 14px',
          background:`${cfg.accent}08`,
          borderLeft:`3px solid ${cfg.accent}40`,
          borderRadius:'0 10px 10px 0',
          animation:'fadeSlide 0.3s ease both',
        }}>
          {data.intro}
        </p>
      )}

      {/* Cards */}
      {items.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
          {items.map((item, i) => (
            <RichCard key={i} item={item} accent={cfg.accent} index={i} />
          ))}
        </div>
      )}

      {/* Outro */}
      {data.outro && (
        <div style={{
          display:'flex', alignItems:'flex-start', gap:10,
          padding:'12px 14px',
          background:`linear-gradient(135deg, ${cfg.accent}08, ${cfg.accent}04)`,
          border:`1px solid ${cfg.accent}20`,
          borderRadius:14,
          animation:`fadeSlide 0.3s ${items.length * 0.07 + 0.1}s ease both`,
          opacity:0, /* filled by animation */
          animationFillMode:'both',
        }}>
          <span style={{ fontSize:16 }}>💬</span>
          <span style={{ fontSize:12.5, color:'#6b5042', lineHeight:1.6, fontStyle:'italic' }}>
            {data.outro}
          </span>
        </div>
      )}

      {/* Text after */}
      {after && (
        <p style={{ margin:'12px 0 0', whiteSpace:'pre-wrap', lineHeight:1.72, fontSize:14 }}>
          {after}
        </p>
      )}
    </div>
  )
}

export function isRich(content) {
  return typeof content === 'string' && content.includes('|||JSON|||')
}
