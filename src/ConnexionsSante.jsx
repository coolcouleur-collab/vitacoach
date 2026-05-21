/**
 * ConnexionsSante — Solenn
 * Gère la connexion/déconnexion des appareils et services santé.
 * S'affiche dans SanteTab et dans SettingsSheet.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const C = {
  bg:       'rgba(255,248,244,0.0)',
  card:     'rgba(255,240,228,0.18)',
  border:   'rgba(200,123,82,0.15)',
  orange:   '#C87B52',
  or:       '#E8962A',
  nuit:     '#0A1633',
  texte:    'rgba(10,22,51,0.88)',
  texte2:   'rgba(10,22,51,0.55)',
  vert:     '#22c55e',
  rouge:    '#ef4444',
}

// ─── Définition des providers ─────────────────────────────────────────────────
const PROVIDERS = [
  {
    id:          'withings',
    nom:         'Withings',
    emoji:       '⚖️',
    description: 'Balance, tensiomètre, montre — marque française',
    couleur:     '#00B5AD',
    donnees:     ['Poids', 'Tension artérielle', 'FC repos', 'Sommeil', 'Température'],
    methode:     'oauth',   // redirect OAuth
    disponible:  true,
  },
  {
    id:          'oura',
    nom:         'Oura Ring',
    emoji:       '💍',
    description: 'Meilleure qualité de données sommeil au monde',
    couleur:     '#6C63FF',
    donnees:     ['Sommeil (stades)', 'HRV', 'Readiness', 'Pas', 'FC'],
    methode:     'token',   // Personal Access Token
    disponible:  true,
  },
  {
    id:          'garmin',
    nom:         'Garmin',
    emoji:       '⌚',
    description: 'GPS, sport, stress, fréquence cardiaque',
    couleur:     '#007CC3',
    donnees:     ['Pas', 'Calories', 'Stress', 'Sommeil', 'FC'],
    methode:     'oauth',
    disponible:  false,     // bientôt
  },
  {
    id:          'apple_health',
    nom:         'Apple Santé',
    emoji:       '🍎',
    description: 'Via l\'app native iOS — sync automatique',
    couleur:     '#FF3B30',
    donnees:     ['Pas', 'Sommeil', 'FC', 'Calories', 'Poids'],
    methode:     'native',
    disponible:  true,
  },
]

// ─── Composant provider card ──────────────────────────────────────────────────
function ProviderCard({ provider, connecte, lastSync, onConnect, onDisconnect, onSync, loading }) {
  const [confirmeDeconnect, setConfirmeDeconnect] = useState(false)

  return (
    <motion.div
      layout
      style={{
        background:    C.card,
        border:        `1px solid ${connecte ? 'rgba(34,197,94,0.25)' : C.border}`,
        borderRadius:  16,
        padding:       '16px',
        marginBottom:  10,
        position:      'relative',
        overflow:      'hidden',
      }}
    >
      {/* Badge connecté */}
      {connecte && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(34,197,94,0.15)',
          border: '1px solid rgba(34,197,94,0.30)',
          borderRadius: 20, padding: '2px 10px',
          fontSize: 11, color: C.vert, fontWeight: 600,
        }}>
          ✓ Connecté
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${provider.couleur}18`,
          border: `1px solid ${provider.couleur}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>
          {provider.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.texte, display: 'flex', alignItems: 'center', gap: 8 }}>
            {provider.nom}
            {!provider.disponible && (
              <span style={{ fontSize: 10, background: 'rgba(200,123,82,0.12)', color: C.orange, padding: '1px 7px', borderRadius: 12, fontWeight: 600 }}>
                Bientôt
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.texte2, marginTop: 2 }}>
            {provider.description}
          </div>
        </div>
      </div>

      {/* Données collectées */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
        {provider.donnees.map(d => (
          <span key={d} style={{
            fontSize: 11, color: C.texte2,
            background: 'rgba(10,22,51,0.05)',
            border: '1px solid rgba(10,22,51,0.08)',
            borderRadius: 12, padding: '2px 8px',
          }}>
            {d}
          </span>
        ))}
      </div>

      {/* Dernière sync */}
      {connecte && lastSync && (
        <div style={{ fontSize: 11, color: C.texte2, marginBottom: 10 }}>
          Dernière sync : {new Date(lastSync).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {/* Actions */}
      {provider.disponible && (
        <div style={{ display: 'flex', gap: 8 }}>
          {!connecte ? (
            <button
              onClick={() => onConnect(provider)}
              style={{
                flex: 1, padding: '10px 16px',
                background: `linear-gradient(135deg, ${provider.couleur}, ${provider.couleur}CC)`,
                border: 'none', borderRadius: 12, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Connecter
            </button>
          ) : (
            <>
              <button
                onClick={() => onSync(provider.id)}
                disabled={loading}
                style={{
                  flex: 1, padding: '9px 14px',
                  background: 'rgba(200,123,82,0.10)',
                  border: '1px solid rgba(200,123,82,0.20)',
                  borderRadius: 12, color: C.orange,
                  fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {loading ? '⏳ Sync…' : '🔄 Sync'}
              </button>
              <button
                onClick={() => {
                  if (confirmeDeconnect) { onDisconnect(provider.id); setConfirmeDeconnect(false) }
                  else { setConfirmeDeconnect(true); setTimeout(() => setConfirmeDeconnect(false), 3500) }
                }}
                style={{
                  padding: '9px 14px',
                  background: confirmeDeconnect ? 'rgba(239,68,68,0.12)' : 'rgba(10,22,51,0.05)',
                  border: `1px solid ${confirmeDeconnect ? 'rgba(239,68,68,0.30)' : 'rgba(10,22,51,0.10)'}`,
                  borderRadius: 12,
                  color: confirmeDeconnect ? C.rouge : C.texte2,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                }}
              >
                {confirmeDeconnect ? 'Confirmer ?' : 'Déconnecter'}
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── Modal connexion Oura (PAT) ───────────────────────────────────────────────
function ModalOura({ userId, onSuccess, onClose }) {
  const [token, setToken]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur]   = useState('')

  async function connecter() {
    if (!token.trim()) return
    setLoading(true); setErreur('')
    try {
      const res  = await fetch('/api/connect/oura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: token.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Token invalide')
      onSuccess('oura')
    } catch (e) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,22,51,0.50)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: '#FFF8F4', borderRadius: 20,
          padding: 28, width: '100%', maxWidth: 380,
          boxShadow: '0 24px 60px rgba(10,22,51,0.18)',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>💍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.nuit, marginBottom: 6 }}>
          Connecter Oura Ring
        </div>
        <div style={{ fontSize: 13, color: C.texte2, marginBottom: 20, lineHeight: 1.5 }}>
          Crée un Personal Access Token sur{' '}
          <a href="https://cloud.ouraring.com/personal-access-tokens" target="_blank" rel="noreferrer"
            style={{ color: C.orange }}>
            cloud.ouraring.com
          </a>
          , puis colle-le ici.
        </div>

        <input
          type="password"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
          value={token}
          onChange={e => setToken(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px',
            border: `1.5px solid ${erreur ? C.rouge : 'rgba(200,123,82,0.25)'}`,
            borderRadius: 12, fontSize: 13,
            fontFamily: 'monospace',
            background: 'rgba(255,240,228,0.30)',
            color: C.nuit, outline: 'none',
            boxSizing: 'border-box', marginBottom: 8,
          }}
          onKeyDown={e => e.key === 'Enter' && connecter()}
        />
        {erreur && <div style={{ fontSize: 12, color: C.rouge, marginBottom: 12 }}>{erreur}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', background: 'rgba(10,22,51,0.06)',
            border: '1px solid rgba(10,22,51,0.10)', borderRadius: 12,
            color: C.texte2, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins',
          }}>Annuler</button>
          <button onClick={connecter} disabled={loading || !token.trim()} style={{
            flex: 1, padding: '11px',
            background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins',
          }}>
            {loading ? '⏳ Vérification…' : 'Connecter'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ConnexionsSante({ userId }) {
  const [integrations, setIntegrations] = useState([])
  const [loadingSync,  setLoadingSync]  = useState(null)
  const [modalOura,    setModalOura]    = useState(false)
  const [toast,        setToast]        = useState(null)
  // 'ok' | 'error' | null — banner OAuth pleine largeur
  const [oauthBanner,  setOauthBanner]  = useState(null)
  const [syncing,      setSyncing]      = useState(false)

  useEffect(() => {
    if (userId) chargerIntegrations()

    // ── Retour OAuth Withings ──────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search)
    if (params.get('integration') === 'withings') {
      const statut = params.get('status')
      window.history.replaceState({}, '', window.location.pathname)

      if (statut === 'ok') {
        setOauthBanner('ok')
        // Déclencher sync automatique
        if (userId) {
          setSyncing(true)
          fetch('/api/sync-now', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ userId, provider: 'withings' }),
          }).finally(() => setSyncing(false))
        }
        // Recharger la liste après 2 s
        setTimeout(() => {
          chargerIntegrations()
          setOauthBanner(null)
        }, 5000)
      } else {
        setOauthBanner('error')
        setTimeout(() => setOauthBanner(null), 6000)
      }
    }
  }, [userId])

  async function chargerIntegrations() {
    const res  = await fetch(`/api/integrations?userId=${userId}`)
    const data = await res.json()
    setIntegrations(data.integrations || [])
  }

  function showToast(msg, duree = 3000) {
    setToast(msg)
    setTimeout(() => setToast(null), duree)
  }

  function estConnecte(providerId) {
    return integrations.some(i => i.provider === providerId && i.actif)
  }

  function getIntegration(providerId) {
    return integrations.find(i => i.provider === providerId)
  }

  async function connecter(provider) {
    if (!userId) return

    if (provider.methode === 'oauth') {
      // Redirect OAuth
      window.location.href = `/api/connect/${provider.id}?userId=${userId}`
    } else if (provider.methode === 'token') {
      // Modal PAT
      if (provider.id === 'oura') setModalOura(true)
    } else if (provider.methode === 'native') {
      showToast('💡 Apple Santé se connecte automatiquement via l\'app iOS')
    }
  }

  async function deconnecter(providerId) {
    await fetch(`/api/disconnect?userId=${userId}&provider=${providerId}`, { method: 'DELETE' })
    await chargerIntegrations()
    showToast('Intégration déconnectée')
  }

  async function syncNow(providerId) {
    setLoadingSync(providerId)
    try {
      const res  = await fetch('/api/sync-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, provider: providerId }),
      })
      const data = await res.json()
      await chargerIntegrations()
      showToast(`✅ ${data.synced || 0} métriques synchronisées`)
    } catch (e) {
      showToast('❌ Erreur de synchronisation')
    } finally {
      setLoadingSync(null)
    }
  }

  return (
    <div style={{ padding: '0 0 8px' }}>

      {/* ── Banner OAuth Withings ───────────────────────────────────────── */}
      <AnimatePresence>
        {oauthBanner === 'ok' && (
          <motion.div
            key="banner-ok"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))',
              border:       '1.5px solid rgba(34,197,94,0.40)',
              borderRadius: 16,
              padding:      '14px 18px',
              marginBottom: 16,
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              boxShadow:    '0 4px 20px rgba(34,197,94,0.15)',
              fontFamily:   'Poppins, sans-serif',
            }}
          >
            <span style={{ fontSize: 26, flexShrink: 0 }}>✅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', lineHeight: 1.3 }}>
                Withings connecté !
              </div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 2, opacity: 0.85 }}>
                {syncing ? '⏳ Synchronisation en cours…' : 'Synchronisation lancée — données disponibles dans quelques secondes.'}
              </div>
            </div>
            <button
              onClick={() => setOauthBanner(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: '#15803d', opacity: 0.6, padding: '0 4px',
                flexShrink: 0,
              }}
              aria-label="Fermer"
            >×</button>
          </motion.div>
        )}

        {oauthBanner === 'error' && (
          <motion.div
            key="banner-error"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(220,38,38,0.09))',
              border:       '1.5px solid rgba(239,68,68,0.35)',
              borderRadius: 16,
              padding:      '14px 18px',
              marginBottom: 16,
              display:      'flex',
              alignItems:   'center',
              gap:          12,
              boxShadow:    '0 4px 20px rgba(239,68,68,0.12)',
              fontFamily:   'Poppins, sans-serif',
            }}
          >
            <span style={{ fontSize: 26, flexShrink: 0 }}>❌</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#b91c1c', lineHeight: 1.3 }}>
                Erreur de connexion Withings
              </div>
              <div style={{ fontSize: 12, color: '#991b1b', marginTop: 2, opacity: 0.85 }}>
                Réessaye depuis le bouton ci-dessous, ou vérifie ton compte Withings.
              </div>
            </div>
            <button
              onClick={() => setOauthBanner(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: '#b91c1c', opacity: 0.6, padding: '0 4px',
                flexShrink: 0,
              }}
              aria-label="Fermer"
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ fontSize: 13, fontWeight: 700, color: C.texte2, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}>
        Appareils & Services
      </div>

      {PROVIDERS.map(provider => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          connecte={estConnecte(provider.id)}
          lastSync={getIntegration(provider.id)?.last_sync_at}
          onConnect={connecter}
          onDisconnect={deconnecter}
          onSync={syncNow}
          loading={loadingSync === provider.id}
        />
      ))}

      <div style={{ fontSize: 11, color: C.texte2, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
        Tes données de santé restent privées et ne sont jamais partagées.{'\n'}
        Synchronisation automatique toutes les 3h.
      </div>

      {/* Modal Oura */}
      <AnimatePresence>
        {modalOura && (
          <ModalOura
            userId={userId}
            onSuccess={async (provider) => {
              setModalOura(false)
              await chargerIntegrations()
              showToast('💍 Oura Ring connecté !')
            }}
            onClose={() => setModalOura(false)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{    opacity: 0, y: 16, scale: 0.95  }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            style={{
              position:       'fixed',
              bottom:         100,
              left:           '50%',
              transform:      'translateX(-50%)',
              background:     'rgba(10,22,51,0.92)',
              backdropFilter: 'blur(24px)',
              color:          '#fff',
              borderRadius:   16,
              padding:        '13px 22px',
              fontSize:       14,
              fontWeight:     600,
              fontFamily:     'Poppins, sans-serif',
              zIndex:         300,
              whiteSpace:     'nowrap',
              boxShadow:      '0 8px 32px rgba(10,22,51,0.35)',
              border:         '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
