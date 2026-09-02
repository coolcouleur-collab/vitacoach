// ─── « TA JOURNÉE EST PRÊTE », HomeTab ──────────────────────────────────────
// La card du réflexe matinal : quand l'utilisateur ouvre l'app, Solenn a déjà
// travaillé, chaque adaptation dit ce qui a été ajusté et POURQUOI (ses
// données de la nuit/veille). Alimentée par l'agent morning-brief (06:45)
// via /api/morning-message (adaptations jsonb). Masquée si rien aujourd'hui.

import React, { useEffect, useState } from 'react'
import { authHeaders } from './supabase'
import { ENCRE, ICONE } from './palette'

const F = "'Poppins', system-ui, sans-serif"

function AdaptIcon({ type }) {
  const stroke = 'var(--accent)'
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', style: { flexShrink: 0 } }
  switch (type) {
    case 'allege': // plume, journée allégée
      return <svg {...common}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/></svg>
    case 'boost': // éclair, journée ambitieuse
      return <svg {...common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    case 'soft': // cœur, douceur
      return <svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    case 'challenge': // drapeau
      return <svg {...common}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    default: // étincelle
      return <svg {...common}><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/></svg>
  }
}

export default function JourneePrete({ userId, onOpenRoutine, metriques, onUpdate, onMode, isNight = false }) {
  // Memes valeurs que ContextualShortcuts juste en dessous, pour que les deux
  // blocs se ressemblent au lieu de se contredire.
  const tc      = isNight ? (op) => `rgba(180,210,255,${op})` : () => ENCRE
  const panneau = isNight ? 'rgba(15,28,58,0.70)'   : 'rgba(255,255,255,0.22)'
  const panneau2= isNight ? 'rgba(15,28,58,0.70)'   : 'rgba(var(--rgb-bulle), 0.62)'
  const trait   = isNight ? 'rgba(180,210,255,0.20)': 'rgba(var(--rgb-terracotta), 0.22)'
  const trait2  = isNight ? 'rgba(180,210,255,0.24)': 'rgba(var(--rgb-terracotta), 0.30)'
  const icone   = isNight ? 'rgba(180,210,255,0.78)': ICONE
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

  // ── Mode « Solenn ne sait rien encore » ────────────────────────────────────
  // Sans adaptations, ce bloc disparaissait purement et simplement : une
  // nouvelle utilisatrice ouvrait donc l'app sur un soleil et des cartes vides,
  // sans jamais découvrir ce que Solenn sait faire. Elle pose désormais UNE
  // question, dont la réponse tient en un geste, c'est aussi ce qui amorce la
  // collecte de données sans formulaire (refonte demandée par Jean 2026-08-08).
  const sansAdaptations = !data?.adaptations?.length
  const manqueMetrique = !metriques?.sommeil ? 'sommeil' : !metriques?.eau ? 'eau' : !metriques?.pas ? 'pas' : null

  // Le parent doit savoir qu'une question est posée ici : l'accueil empilait
  // trois demandes de saisie d'affilée (la phrase de Solenn, cette question,
  // puis le check-in). Une seule à la fois (2026-08-11).
  useEffect(() => {
    onMode?.(sansAdaptations ? (manqueMetrique && onUpdate ? 'question' : 'rien') : 'adaptations')
  }, [sansAdaptations, manqueMetrique, !!onUpdate])

  if (sansAdaptations) {
    const manque = manqueMetrique
    if (!manque || !onUpdate) return null

    const Q = {
      sommeil: {
        titre: 'Tu as dormi combien cette nuit ?',
        sous:  "C'est la donnée qui explique le plus de choses, humeur, faim, énergie.",
        // 4 signifie « moins de 5h ». Sans cette option, une nuit courte
        // devait etre declaree a 5h : la donnee et le score s'en trouvaient
        // fausses, et c'est justement la nuit ou le conseil compte le plus.
        choix: [4, 5, 6, 7, 8, 9].map(v => ({
          label: v === 4 ? '-5h' : v === 9 ? '9h+' : `${v}h`, val: v,
        })),
      },
      eau: {
        // « Depuis ce matin » a 1h49 demande de compter dans une matinee qui
        // n'a pas encore eu lieu. Avant 6 h, la question porte sur la journee
        // qui vient de s'ecouler, pas sur celle qui commence.
        titre: new Date().getHours() < 6
          ? "Combien de verres d'eau hier ?"
          : "Combien de verres d'eau depuis ce matin ?",
        sous:  'Même approximatif, ça suffit pour voir la tendance.',
        choix: [0, 2, 4, 6, 8].map(v => ({ label: `${v}`, val: v })),
      },
      pas: {
        titre: "Tu as bougé aujourd'hui ?",
        sous:  "Une estimation suffit, je m'occupe du reste.",
        choix: [
          { label: 'Peu',      val: 2000 },
          { label: 'Un peu',   val: 5000 },
          { label: 'Pas mal',  val: 8000 },
          { label: 'Beaucoup', val: 12000 },
        ],
      },
    }[manque]

    return (
      <div style={{
        background: panneau,
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${trait}`,
        borderRadius: 18, padding: '16px 18px', margin: '14px 18px 14px',
        boxShadow: '0 8px 28px rgba(var(--rgb-terracotta), 0.10)',
        fontFamily: F,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tc(0.90), display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>
          Solenn te demande
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: tc(0.90), marginBottom: 4, lineHeight: 1.4 }}>
          {Q.titre}
        </div>
        <div style={{ fontSize: 11.5, color: tc(0.90), lineHeight: 1.45, marginBottom: 12 }}>
          {Q.sous}
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {Q.choix.map(c => (
            <button key={c.label} onClick={() => onUpdate(manque, c.val)} style={{
              flex: 1, padding: '11px 0', borderRadius: 14, cursor: 'pointer',
              background: panneau2,
              border: `1.5px solid ${trait2}`,
              fontFamily: F, fontSize: 13, fontWeight: 600, color: tc(0.90),
            }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: panneau,
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${trait}`,
      borderRadius: 18, padding: '16px 18px', margin: '14px 18px 14px',
      boxShadow: '0 8px 28px rgba(var(--rgb-terracotta), 0.10)',
      fontFamily: F,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tc(0.90), display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>
          Ta journée est prête
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.adaptations.slice(0, 4).map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <div style={{ marginTop: 1 }}><AdaptIcon type={a.type} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tc(0.90) }}>{a.titre}</div>
              <div style={{ fontSize: 11.5, color: tc(0.90), lineHeight: 1.45 }}>{a.raison}</div>
            </div>
          </div>
        ))}
      </div>
      {onOpenRoutine && (
        <button onClick={onOpenRoutine} style={{
          marginTop: 12, width: '100%', padding: '9px 0', borderRadius: 12, cursor: 'pointer',
          border: `1px solid ${trait2}`, background: panneau2,
          fontFamily: F, fontSize: 12.5, fontWeight: 600, color: tc(0.90),
        }}>
          Voir mon programme du jour
        </button>
      )}
    </div>
  )
}
