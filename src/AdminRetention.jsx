// ─── DASHBOARD RÉTENTION (admin), /admin ────────────────────────────────────
// Les 3 métriques de survie identifiées par l'étude de marché (2026-07-21) :
//   1. Complétion du challenge 21 jours
//   2. Utilisateurs actifs J7 / J30
//   3. Premier renouvellement (objectif ≥ 67 %, benchmark Adapty)
// Accès : clé admin (AGENTS_TRIGGER_KEY) saisie une fois, gardée en
// sessionStorage, envoyée en header x-agents-key à /api/admin/retention.

import React, { useEffect, useState } from 'react'
import { AMBRE, ENCRE, ENCRE_DOUCE, ROUGE } from './palette'

const F = "'Poppins', sans-serif"
const SERIF = "'Cormorant Garamond', Georgia, serif"

const card = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(200,123,82,0.18)',
  borderRadius: 16,
  padding: '18px 20px',
  boxShadow: '0 8px 26px rgba(200,123,82,0.08)',
}

function Stat({ label, value, sub, alert }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: ENCRE }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: alert ? ROUGE : ENCRE_DOUCE, lineHeight: 1.15, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 4, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  )
}

export default function AdminRetention() {
  const [key, setKey] = useState(() => sessionStorage.getItem('solenn_admin_key') || '')
  const [input, setInput] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const charger = async (adminKey) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/retention', { headers: { 'x-agents-key': adminKey } })
      if (res.status === 401 || res.status === 403) throw new Error('Clé admin invalide')
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`)
      setData(await res.json())
      sessionStorage.setItem('solenn_admin_key', adminKey)
      setKey(adminKey)
    } catch (e) {
      setError(e.message)
      sessionStorage.removeItem('solenn_admin_key')
      setKey('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (key) charger(key) }, [])

  if (!key || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF8F4', fontFamily: F, padding: 20 }}>
        <div style={{ ...card, width: '100%', maxWidth: 360 }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: '#0A1633', marginBottom: 12 }}>Solenn, Admin</div>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input) charger(input) }}
            placeholder="Clé admin"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 12,
              border: '1px solid rgba(200,123,82,0.30)', fontFamily: F, fontSize: 14, outline: 'none',
              background: '#fff', color: '#0A1633',
            }}
          />
          <button
            onClick={() => input && charger(input)}
            disabled={loading || !input}
            style={{
              width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: 'none',
              background: 'rgba(255,235,210,0.32)', color: AMBRE,
              fontFamily: F, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Chargement…' : 'Accéder'}
          </button>
          {error && <div style={{ marginTop: 10, fontSize: 12.5, color: ROUGE }}>{error}</div>}
        </div>
      </div>
    )
  }

  const u = data.utilisateurs || {}
  const c = data.challenge21j || {}
  const a = data.abonnements || {}
  const renew = a.premierRenouvellement || {}
  const pct = (num, den) => den ? `${Math.round((100 * num) / den)} %` : ','

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F4', fontFamily: F, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          <h1 style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, fontWeight: 500, color: '#0A1633', margin: 0 }}>Rétention</h1>
          <button onClick={() => charger(key)} style={{
            fontFamily: F, fontSize: 12, fontWeight: 600, color: AMBRE, background: 'transparent',
            border: '1px solid rgba(200,123,82,0.35)', borderRadius: 99, padding: '6px 16px', cursor: 'pointer',
          }}>
            {loading ? '…' : 'Actualiser'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Stat label="Utilisateurs" value={u.total ?? '·'} sub="profils créés" />
          <Stat label="Actifs J7" value={u.actifsJ7 ?? '·'} sub={u.total ? `${pct(u.actifsJ7, u.total)} de la base` : null} />
          <Stat label="Actifs J30" value={u.actifsJ30 ?? '·'} sub={u.total ? `${pct(u.actifsJ30, u.total)} de la base` : null} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
          <Stat label="Challenges lancés" value={c.total ?? '·'} sub={`${c.enCours ?? 0} en cours`} />
          <Stat label="Complétion moyenne" value={c.tauxCompletionMoyen != null ? `${c.tauxCompletionMoyen} %` : ','} sub="jours cochés / jours écoulés (challenges actifs)" />
          <Stat label="Challenges 21/21" value={c.termines ?? '·'} sub="terminés en entier" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
          <Stat label="Abonnés Pro" value={a.prosActifs ?? '·'} sub="statut isPro actif" />
          <Stat
            label="1er renouvellement"
            value={renew.taux != null ? `${renew.taux} %` : ','}
            sub={renew.error ? `Stripe : ${renew.error}` : `${renew.renouveles ?? 0}/${renew.eligibles ?? 0} abonnements arrivés à échéance · objectif ≥ 67 %`}
            alert={renew.taux != null && renew.taux < 67}
          />
        </div>

        {data.refSources && Object.keys(data.refSources).length > 0 && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: ENCRE, marginBottom: 10 }}>
              Inscriptions par créateur (liens ?ref=)
            </div>
            {Object.entries(data.refSources).sort((a, b) => b[1] - a[1]).map(([code, n]) => (
              <div key={code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(200,123,82,0.10)', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: AMBRE }}>{code}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(10,22,51,0.70)' }}>{n} inscription{n > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 11, color: ENCRE, marginTop: 22, lineHeight: 1.5 }}>
          Généré le {data.generatedAt ? new Date(data.generatedAt).toLocaleString('fr-FR') : ','}.
          Actifs = au moins une métrique enregistrée sur la période. Renouvellement calculé sur les 100 derniers abonnements Stripe.
          Conversions par code promo : Dashboard Stripe → Produits → Codes promotionnels.
        </div>
      </div>
    </div>
  )
}
