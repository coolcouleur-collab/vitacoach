import React, { useEffect, useState } from 'react'
import { BrainIcon, MoonIcon, FlashIcon } from './Icons'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  cream:   '#FFF8F4',
  copper:  '#C87B52',
  amber:   '#E8962A',
  navy:    '#0A1633',
  green:   '#22c55e',
  red:     '#ef4444',
  white:   '#ffffff',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray600: '#4b5563',
  gray800: '#1f2937',
}

// ─── Mock data (fallback si API échoue) ───────────────────────────────────────
const MOCK = {
  org: { nom: 'Votre Entreprise', plan: 'business', employes: 48 },
  kpis: {
    score_moyen: 72,
    actifs_semaine: 38,
    taux_engagement: 79,
    sommeil_moyen: 6.8,
    alertes: 3,
  },
  historique_scores: [65, 67, 70, 68, 72, 74, 71, 72],
  departements: [
    { nom: 'Marketing',  employes: 12, score: 78, tendance: '+4', statut: 'bien' },
    { nom: 'Tech',       employes: 18, score: 74, tendance: '+2', statut: 'bien' },
    { nom: 'Commercial', employes: 10, score: 61, tendance: '-3', statut: 'attention' },
    { nom: 'RH',         employes: 5,  score: 80, tendance: '+6', statut: 'bien' },
    { nom: 'Finance',    employes: 8,  score: 55, tendance: '-8', statut: 'alerte' },
  ],
  alertes: [
    { type: 'stress',  departement: 'Commercial', message: '3 collaborateurs signalent un niveau de stress élevé cette semaine', action: 'Organiser un atelier gestion du stress' },
    { type: 'sommeil', departement: 'Finance',    message: 'Moyenne sommeil < 6h sur 5 jours consécutifs',                      action: 'Proposer le programme sommeil Solenn' },
    { type: 'energie', departement: 'Commercial', message: 'Score énergie en baisse depuis 3 semaines',                         action: 'Activer les routines matinales personnalisées' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statutColor(statut) {
  if (statut === 'bien')      return T.green
  if (statut === 'attention') return T.amber
  return T.red
}

function statutLabel(statut) {
  if (statut === 'bien')      return 'Bon'
  if (statut === 'attention') return 'Attention'
  return 'Alerte'
}

function alerteIcon(type) {
  if (type === 'stress')  return <BrainIcon size={22} color={T.copper} />
  if (type === 'sommeil') return <MoonIcon  size={22} color={T.copper} />
  return <FlashIcon size={22} color={T.amber} />
}

// ─── Sparkline SVG (8 semaines) ───────────────────────────────────────────────
function Sparkline({ data }) {
  const W = 340, H = 80, PAD = 8
  const min = Math.min(...data) - 4
  const max = Math.max(...data) + 4
  const xs = data.map((_, i) => PAD + (i / (data.length - 1)) * (W - PAD * 2))
  const ys = data.map(v => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2))
  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
  const areaPath = `${linePath} L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={T.amber} stopOpacity="0.25" />
          <stop offset="100%" stopColor={T.amber} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke={T.amber} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3.5" fill={T.white} stroke={T.amber} strokeWidth="2" />
      ))}
      {/* Semaine labels */}
      {xs.map((x, i) => (
        <text key={i} x={x} y={H - 1} textAnchor="middle" fontSize="9" fill={T.gray400}>
          S{i + 1}
        </text>
      ))}
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ value, label, unit, color, warning }) {
  return (
    <div style={{
      background: T.white,
      borderRadius: 16,
      padding: '20px 24px',
      flex: '1 1 0',
      minWidth: 140,
      boxShadow: '0 1px 4px rgba(10,22,51,0.07)',
      border: `1.5px solid ${warning ? T.red + '55' : T.gray200}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <span style={{
        fontSize: 36,
        fontWeight: 700,
        color: warning ? T.red : (color || T.navy),
        fontFamily: 'Poppins, sans-serif',
        lineHeight: 1.1,
        letterSpacing: '-1px',
      }}>
        {value}{unit && <span style={{ fontSize: 18, fontWeight: 500, marginLeft: 2 }}>{unit}</span>}
      </span>
      <span style={{ fontSize: 13, color: T.gray600, fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BusinessDashboard({ orgId, token }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = `/api/business/dashboard?orgId=${encodeURIComponent(orgId || '')}&token=${encodeURIComponent(token || '')}`
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData(MOCK); setLoading(false) })
  }, [orgId, token])

  const d = data || MOCK

  return (
    <div style={{
      minHeight: '100vh',
      background: T.cream,
      fontFamily: 'Poppins, sans-serif',
      padding: '0 0 48px',
    }}>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>

      {/* ── Header ── */}
      <div style={{
        background: T.navy,
        padding: '28px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Plateforme RH
          </div>
          <h1 style={{ margin: 0, color: T.white, fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Dashboard Bien-être, {loading ? '…' : d.org.nom}
          </h1>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: '6px 16px',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, display: 'inline-block' }} />
          <span style={{ color: T.gray200, fontSize: 13, fontWeight: 500 }}>Actualisé il y a 2h</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 0' }}>

        {/* ── KPI Row ── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <KpiCard
            value={d.kpis.score_moyen}
            label="Score bien-être"
            color={T.amber}
          />
          <KpiCard
            value={d.kpis.taux_engagement}
            unit="%"
            label="Engagement"
            color={T.copper}
          />
          <KpiCard
            value={d.kpis.sommeil_moyen}
            unit="h"
            label="Sommeil moyen"
            color={T.navy}
          />
          <KpiCard
            value={d.kpis.alertes}
            label="Points d'attention"
            warning={d.kpis.alertes > 0}
          />
        </div>

        {/* ── Sparkline card ── */}
        <div style={{
          background: T.white,
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(10,22,51,0.07)',
          border: `1.5px solid ${T.gray200}`,
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.navy }}>
                Score moyen équipe, 8 dernières semaines
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: T.gray400 }}>
                {d.org.employes} collaborateurs · Plan {d.org.plan}
              </p>
            </div>
            <div style={{
              background: T.cream,
              borderRadius: 12,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: T.copper,
            }}>
              Score actuel : {d.kpis.score_moyen}/100
            </div>
          </div>
          <Sparkline data={d.historique_scores} />
        </div>

        {/* ── Departments table ── */}
        <div style={{
          background: T.white,
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(10,22,51,0.07)',
          border: `1.5px solid ${T.gray200}`,
          marginBottom: 28,
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: T.navy }}>
            Top 5 départements
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Département', 'Employés', 'Score', 'Tendance', 'Statut'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: T.gray400,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      borderBottom: `2px solid ${T.gray100}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.departements.map((dep, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.gray100}` }}>
                    <td style={{ padding: '13px 12px', fontWeight: 600, color: T.navy, fontSize: 14 }}>
                      {dep.nom}
                    </td>
                    <td style={{ padding: '13px 12px', color: T.gray600, fontSize: 14 }}>
                      {dep.employes}
                    </td>
                    <td style={{ padding: '13px 12px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: dep.score >= 70 ? T.green : dep.score >= 60 ? T.amber : T.red,
                      }}>
                        {dep.score}
                      </span>
                    </td>
                    <td style={{ padding: '13px 12px' }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: dep.tendance.startsWith('+') ? T.green : T.red,
                      }}>
                        {dep.tendance.startsWith('+') ? '↑' : '↓'} {dep.tendance}
                      </span>
                    </td>
                    <td style={{ padding: '13px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        background: statutColor(dep.statut) + '18',
                        color: statutColor(dep.statut),
                        borderRadius: 20,
                        padding: '3px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {statutLabel(dep.statut)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Alertes ── */}
        {d.alertes.length > 0 && (
          <div style={{
            background: T.white,
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: '0 1px 4px rgba(10,22,51,0.07)',
            border: `1.5px solid ${T.red}33`,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: T.navy, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: T.red + '15',
                color: T.red,
                borderRadius: 8,
                padding: '2px 10px',
                fontSize: 13,
              }}>
                {d.alertes.length}
              </span>
              Points d'attention
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {d.alertes.map((al, i) => (
                <div key={i} style={{
                  background: T.cream,
                  borderRadius: 12,
                  padding: '16px 20px',
                  borderLeft: `4px solid ${T.red}`,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ display: 'flex', fontSize: 22, lineHeight: 1 }}>{alerteIcon(al.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: T.copper,
                      }}>
                        {al.type}
                      </span>
                      <span style={{ fontSize: 11, color: T.gray400 }}>·</span>
                      <span style={{ fontSize: 12, color: T.gray400, fontWeight: 500 }}>{al.departement}</span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: 13, color: T.gray800, lineHeight: 1.5 }}>
                      {al.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: T.gray400 }}>Action suggérée :</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.amber }}>{al.action}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
