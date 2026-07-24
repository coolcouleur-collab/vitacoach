// ─── « TA JOURNÉE EST PRÊTE » — HomeTab ──────────────────────────────────────
// La card du réflexe matinal : quand l'utilisateur ouvre l'app, Solenn a déjà
// travaillé — chaque adaptation dit ce qui a été ajusté et POURQUOI (ses
// données de la nuit/veille). Alimentée par l'agent morning-brief (06:45)
// via /api/morning-message (adaptations jsonb). Masquée si rien aujourd'hui.

import React, { useEffect, useState } from 'react'
import { authHeaders } from './supabase'

const F = "'Poppins', system-ui, sans-serif"

function AdaptIcon({ type }) {
  const stroke = '#C87B52'
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', style: { flexShrink: 0 } }
  switch (type) {
    case 'allege': // plume — journée allégée
      return <svg {...common}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/></svg>
    case 'boost': // éclair — journée ambitieuse
      return <svg {...common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case 'soft': // cœur — douceur
      return <svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    case 'challenge': // drapeau
      return <svg {...common}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    default: // étincelle
      return <svg {...common}><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/></svg>
  }
}

export default function JourneePrete({ userId, onOpenRoutine }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!userId) return
    // Cache session : une seule requête par ouverture d'app
    const key = 'solenn_journee_' + new Date().toDateString()
    const cached = sessionStorage.getItem(key)
    if (cached) { try { setData(JSON.parse(cached)); return } catch {} }
    ;(async () => {
      try {
        const res = await fetch(`/api/morning-message?userId=${userId}`, { headers: await authHeaders() })
        const d = await res.json()
        if (d?.adaptations?.length) {
          sessionStorage.setItem(key, JSON.stringify(d))
          setData(d)
        }
      } catch {}
    })()
  }, [userId])

  if (!data?.adaptations?.length) return null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.22)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(200,123,82,0.22)',
      borderRadius: 18, padding: '16px 18px', marginBottom: 14,
      boxShadow: '0 8px 28px rgba(200,123,82,0.10)',
      fontFamily: F,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(200,123,82,0.90)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8962A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>
          Ta journée est prête
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.adaptations.slice(0, 4).map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <div style={{ marginTop: 1 }}><AdaptIcon type={a.type} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,123,82,0.92)' }}>{a.titre}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(200,123,82,0.65)', lineHeight: 1.45 }}>{a.raison}</div>
            </div>
          </div>
        ))}
      </div>
      {onOpenRoutine && (
        <button onClick={onOpenRoutine} style={{
          marginTop: 12, width: '100%', padding: '9px 0', borderRadius: 12, cursor: 'pointer',
          border: '1px solid rgba(200,123,82,0.30)', background: 'rgba(255,255,255,0.35)',
          fontFamily: F, fontSize: 12.5, fontWeight: 600, color: '#C87B52',
        }}>
          Voir ma routine adaptée
        </button>
      )}
    </div>
  )
}
