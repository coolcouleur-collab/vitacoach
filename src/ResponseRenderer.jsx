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
  meals:     { accent: '#FF6B35', bg: 'rgba(255,107,53,0.07)' },
  exercises: { accent: '#a78bfa', bg: 'rgba(167,139,250,0.07)' },
  tips:      { accent: '#FF9A3C', bg: 'rgba(255,154,60,0.07)'  },
  plants:    { accent: '#34c759', bg: 'rgba(52,199,89,0.07)'   },
  routine:   { accent: '#38bdf8', bg: 'rgba(56,189,248,0.07)'  },
  generic:   { accent: '#FF6B35', bg: 'rgba(255,107,53,0.07)'  },
}

// ─── Single card ──────────────────────────────────────────────────────────────
function RichCard({ item, typeAccent, index }) {
  const [pressed, setPressed] = useState(false)
  const color = item.color || typeAccent

  return (
    <div
      style={{
        background: `linear-gradient(145deg, ${color}12, ${color}06)`,
        border: `1.5px solid ${color}28`,
        borderRadius: 18,
        padding: '14px 16px',
        display: 'flex',
        gap: 13,
        alignItems: 'flex-start',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        boxShadow: `0 6px 20px ${color}18, 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)`,
        transition: 'transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
        cursor: 'default',
        animation: `cardIn 0.32s ${index * 0.06}s ease both`,
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      {/* Icon tile */}
      <div style={{
        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
        background: `linear-gradient(145deg, ${color}28, ${color}14)`,
        border: `1.5px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 19,
        boxShadow: `0 4px 10px ${color}20`,
      }}>
        {item.icon || '✦'}
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1a0a00', lineHeight: 1.3 }}>
            {item.title}
          </span>
          {item.badge && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: color,
              background: `${color}18`,
              borderRadius: 8, padding: '2px 8px',
              letterSpacing: '0.2px', flexShrink: 0,
            }}>
              {item.badge}
            </span>
          )}
        </div>
        {item.desc && (
          <div style={{ fontSize: 12, color: '#8a7265', lineHeight: 1.55 }}>
            {item.desc}
          </div>
        )}
        {item.sub && (
          <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 4 }}>
            {item.sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────
export default function ResponseRenderer({ content }) {
  const parsed = parseRich(content)

  if (!parsed) {
    // Plain text — preserve line breaks
    return <span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{content}</span>
  }

  const { before, data, after } = parsed
  const cfg    = TYPES[data.type] || TYPES.generic
  const accent = cfg.accent

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{`
        @keyframes cardIn {
          from { opacity:0; transform:translateY(10px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      {/* Text before */}
      {before && (
        <p style={{ margin: '0 0 12px', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>
          {before}
        </p>
      )}

      {/* Intro */}
      {data.intro && (
        <p style={{ margin: '0 0 12px', whiteSpace: 'pre-wrap', lineHeight: 1.65, fontSize: 13.5, color: '#5a4035' }}>
          {data.intro}
        </p>
      )}

      {/* Cards */}
      {data.items?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
          {data.items.map((item, i) => (
            <RichCard key={i} item={item} typeAccent={accent} index={i} />
          ))}
        </div>
      )}

      {/* Outro */}
      {data.outro && (
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.65, fontSize: 12.5, color: '#8a7265', fontStyle: 'italic' }}>
          {data.outro}
        </p>
      )}

      {/* Text after */}
      {after && (
        <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>
          {after}
        </p>
      )}
    </div>
  )
}

// ─── Helper: détecte si le contenu est enrichi ────────────────────────────────
export function isRich(content) {
  return typeof content === 'string' && content.includes('|||JSON|||')
}
