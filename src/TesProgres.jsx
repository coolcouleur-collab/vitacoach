// ─── « TES PROGRÈS AVEC SOLENN » — SanteTab ──────────────────────────────────
// L'écran de preuve : les résultats mesurables depuis le début (mécanisme n°3
// de la thèse « indispensable » — on paie ce qui marche visiblement).
// Deux sources : l'historique local (comparaison première/dernière semaine)
// et les insights longitudinaux de l'agent (table user_insights).

import React, { useEffect, useMemo, useState } from 'react'
import { authHeaders } from './supabase'

const F = "'Poppins', sans-serif"
const moyenne = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

function calculerProgres(history) {
  // history : [{date: toDateString, sommeil?, pas?, humeur?, ...}]
  const entries = [...(history || [])]
    .filter(e => e?.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  // 3 et non 10. En dessous de 10 jours le bloc disparaissait entierement :
  // l'ecran de preuve, celui qui justifie de payer, restait invisible pendant
  // dix jours. Avec un essai a 14 jours, il n'apparaissait plus que quatre
  // jours avant qu'on demande de l'argent, et seulement si la personne avait
  // saisi presque tous les jours (2026-08-12).
  // En dessous de 7 jours on ne compare rien, mais on DIT ou on en est.
  if (entries.length < 3) return null
  if (entries.length < 7) return { stats: [], joursSuivis: entries.length, enAttente: 7 - entries.length }

  // Fenetres adaptees a la longueur reelle : sur 8 jours, comparer 7 contre 7
  // ferait se chevaucher les deux moities et ecraserait l'ecart.
  const fenetre  = Math.min(7, Math.floor(entries.length / 2))
  const premiere = entries.slice(0, fenetre)
  const derniere = entries.slice(-fenetre)
  const delta = (champ) => {
    const avant = moyenne(premiere.map(e => Number(e[champ]) || 0).filter(v => v > 0))
    const apres = moyenne(derniere.map(e => Number(e[champ]) || 0).filter(v => v > 0))
    if (avant == null || apres == null) return null
    return { avant, apres }
  }

  const sommeil = delta('sommeil')
  const pas = delta('pas')
  const humeur = delta('humeur')

  // Poids : première et dernière mesure disponibles (pas de moyenne — une
  // pesée n'est pas quotidienne), présenté SANS jugement (positionnement
  // « réconciliation », jamais de culpabilisation)
  const pesees = entries.map(e => Number(e.poids) || 0).filter(v => v > 0)
  const poids = pesees.length >= 2 ? { avant: pesees[0], apres: pesees[pesees.length - 1], serie: pesees } : null

  const stats = []
  if (poids && Math.abs(poids.apres - poids.avant) >= 0.3) {
    const diff = poids.apres - poids.avant
    stats.push({ label: 'Poids', valeur: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`, detail: `${poids.avant.toFixed(1)} → ${poids.apres.toFixed(1)} kg`, positif: null, serie: poids.serie })
  }
  if (sommeil && Math.abs(sommeil.apres - sommeil.avant) >= 0.2) {
    const diffMin = Math.round((sommeil.apres - sommeil.avant) * 60)
    stats.push({ label: 'Sommeil moyen', valeur: `${diffMin > 0 ? '+' : ''}${diffMin} min`, detail: `${sommeil.avant.toFixed(1)}h → ${sommeil.apres.toFixed(1)}h par nuit`, positif: diffMin > 0 })
  }
  if (pas && Math.abs(pas.apres - pas.avant) >= 300) {
    const diff = Math.round(pas.apres - pas.avant)
    stats.push({ label: 'Pas quotidiens', valeur: `${diff > 0 ? '+' : ''}${diff}`, detail: `${Math.round(pas.avant)} → ${Math.round(pas.apres)} par jour`, positif: diff > 0 })
  }
  if (humeur && Math.abs(humeur.apres - humeur.avant) >= 0.3) {
    const diff = humeur.apres - humeur.avant
    stats.push({ label: 'Humeur', valeur: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pt`, detail: `${humeur.avant.toFixed(1)} → ${humeur.apres.toFixed(1)} sur 5`, positif: diff > 0 })
  }

  return { stats, joursSuivis: entries.length }
}

export default function TesProgres({ history, userId }) {
  const progres = useMemo(() => calculerProgres(history), [history])
  const [insights, setInsights] = useState([])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/insights?userId=${userId}`, { headers: await authHeaders() })
        const d = await res.json()
        setInsights(d?.insights || [])
      } catch {}
    })()
  }, [userId])

  if (!progres && !insights.length) return null

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(200,123,82,0.70)', fontFamily: F, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C87B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          Tes progrès avec Solenn
        </span>
      </div>

      {/* Stats mesurables : première semaine vs dernière semaine */}
      {progres?.stats?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(progres.stats.length, 3)}, 1fr)`, gap: 10, marginBottom: 10 }}>
          {progres.stats.map((st, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(200,123,82,0.18)', borderRadius: 14, padding: '13px 14px', fontFamily: F,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(200,123,82,0.78)' }}>{st.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: st.positif === true ? '#1f9d55' : '#C87B52', margin: '2px 0', fontVariantNumeric: 'tabular-nums' }}>{st.valeur}</div>
              <div style={{ fontSize: 10, color: 'rgba(200,123,82,0.72)', lineHeight: 1.4 }}>{st.detail}</div>
              {st.serie && st.serie.length >= 3 && (() => {
                const min = Math.min(...st.serie), max = Math.max(...st.serie)
                const range = (max - min) || 1
                const pts = st.serie.map((v, j) => `${(j / (st.serie.length - 1)) * 100},${24 - ((v - min) / range) * 20}`).join(' ')
                return (
                  <svg viewBox="0 0 100 26" style={{ width: '100%', height: 22, marginTop: 5, display: 'block' }} preserveAspectRatio="none">
                    <polyline points={pts} fill="none" stroke="#C87B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" vectorEffect="non-scaling-stroke" />
                  </svg>
                )
              })()}
            </div>
          ))}
        </div>
      )}
      {/* En attente : dire ou on en est plutot que de disparaitre. La personne
          sait que la preuve arrive et a une raison de continuer a saisir. */}
      {progres?.enAttente > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(200,123,82,0.18)', borderRadius: 14, padding: '13px 15px',
          fontFamily: F, marginBottom: insights.length ? 12 : 0,
        }}>
          <div style={{ fontSize: 13, color: 'rgba(178,102,62,0.92)', fontWeight: 500, lineHeight: 1.45 }}>
            {progres.joursSuivis} jour{progres.joursSuivis > 1 ? 's' : ''} suivi{progres.joursSuivis > 1 ? 's' : ''}.
            {' '}Encore {progres.enAttente} jour{progres.enAttente > 1 ? 's' : ''} et je pourrai te montrer ce qui a changé.
          </div>
          <div style={{ fontSize: 11, color: 'rgba(200,123,82,0.72)', marginTop: 5, lineHeight: 1.45 }}>
            Sommeil, pas, humeur et poids : je compare tes débuts à ta semaine en cours, chiffres à l'appui.
          </div>
          {/* Barre d'avancement vers la premiere comparaison */}
          <div style={{ marginTop: 10, height: 3, borderRadius: 2, overflow: 'hidden', background: 'rgba(200,123,82,0.14)' }}>
            <div style={{ width: `${Math.round(progres.joursSuivis / 7 * 100)}%`, height: '100%', borderRadius: 2, background: 'rgba(200,123,82,0.65)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {progres && !progres.enAttente && (
        <div style={{ fontSize: 11, color: 'rgba(200,123,82,0.72)', fontFamily: F, marginBottom: insights.length ? 12 : 0 }}>
          {progres.joursSuivis} jours suivis · comparaison de tes débuts à ta semaine en cours
        </div>
      )}

      {/* Ce que Solenn a remarqué — insights longitudinaux */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.slice(0, 3).map((ins, i) => (
            <div key={i} style={{
              background: 'linear-gradient(135deg, rgba(232,150,42,0.08), rgba(200,123,82,0.08))',
              border: '1px solid rgba(232,150,42,0.22)', borderRadius: 14, padding: '12px 15px',
              fontFamily: F, fontSize: 12.5, color: 'rgba(200,123,82,0.85)', lineHeight: 1.55,
              display: 'flex', gap: 9, alignItems: 'flex-start',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8962A" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>{ins.insight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
