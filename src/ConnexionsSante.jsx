/**
 * ConnexionsSante, Solenn
 * Gère la connexion/déconnexion des appareils et services santé.
 * S'affiche dans SanteTab et dans SettingsSheet.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// readWeightHistory reste propre a iOS : Health Connect expose le poids
// autrement, et la facade n'a pas encore d'equivalent. Tout le reste passe
// par sante.js, qui choisit HealthKit ou Health Connect selon l'appareil.
import { readWeightHistory } from './useHealthKit'
import { santeDisponible, demanderAccesSante, lireSanteAujourdhui, ouvrirReglagesSante } from './sante'
import { authHeaders } from './supabase'
import { AMBRE, ENCRE, ICONE, ROUGE, VERT } from './palette'

const HK_KEY = 'vitacoach_healthkit_connected'

const C = {
  bg:       'rgba(255,248,244,0.0)',
  card:     'rgba(var(--rgb-creme), 0.22)',
  border:   'rgba(var(--rgb-creme-dore), 0.28)',
  orange:   'var(--accent)',
  or:       'var(--or-plein)',
  nuit:     'rgba(var(--rgb-creme-rose), 0.92)',
  texte:    'rgba(var(--rgb-creme-rose), 0.92)',
  texte2:   ENCRE,   // etait rgba(var(--rgb-terracotta), 0.70) : 1,98:1 sur tous les libelles
  vert:     '#22c55e',
  rouge:    '#ef4444',
}

// ─── Icônes SVG providers ─────────────────────────────────────────────────────
const ICONS = {
  withings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={ICONE} strokeWidth="1.5"/>
      <path d="M5 20h14M8 20l4-12 4 12" stroke={ICONE} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  oura: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="7" stroke={ICONE} strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke={ICONE} strokeWidth="1.5"/>
    </svg>
  ),
  garmin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="7" y="4" width="10" height="16" rx="4" stroke={ICONE} strokeWidth="1.5"/>
      <path d="M9 2h6M9 22h6M12 8v4l2 2" stroke={ICONE} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  apple_health: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={ICONE} strokeWidth="1.5" fill="none"/>
    </svg>
  ),
}

// ─── Définition des providers ─────────────────────────────────────────────────
const PROVIDERS = [
  {
    id:          'withings',
    nom:         'Withings',
    icon:        ICONS.withings,
    description: 'Balance, tensiomètre, montre, marque française',
    couleur:     'var(--accent)',
    trame:       'var(--rgb-terracotta)',
    donnees:     ['Poids', 'Tension artérielle', 'FC repos', 'Sommeil', 'Température'],
    methode:     'oauth',   // redirect OAuth
    disponible:  true,
  },
  {
    id:          'oura',
    nom:         'Oura Ring',
    icon:        ICONS.oura,
    description: 'Meilleure qualité de données sommeil au monde',
    couleur:     'var(--or-plein)',
    trame:       'var(--rgb-or)',
    donnees:     ['Sommeil (stades)', 'HRV', 'Readiness', 'Pas', 'FC'],
    methode:     'token',   // Personal Access Token
    disponible:  true,
  },
  {
    id:          'garmin',
    nom:         'Garmin',
    icon:        ICONS.garmin,
    description: 'GPS, sport, stress, fréquence cardiaque',
    couleur:     'var(--accent)',
    trame:       'var(--rgb-terracotta)',
    donnees:     ['Pas', 'Calories', 'Stress', 'Sommeil', 'FC'],
    methode:     'oauth',
    disponible:  true,
  },
  {
    id:          'apple_health',
    // Le nom et la description sont remplaces a l'affichage par ceux de la
    // plateforme : sur Android cette carte parle de Health Connect. L'id, lui,
    // ne bouge pas, c'est une cle stockee et il ne designe plus Apple seul.
    nom:         'Apple Santé',
    icon:        ICONS.apple_health,
    description: 'Via l\'app native iOS, sync automatique',
    couleur:     '#ef4444',
    trame:       '239, 68, 68',
    donnees:     ['Pas', 'Sommeil', 'FC', 'Calories', 'Poids'],
    methode:     'native',
    disponible:  true,
  },
]

// ─── Composant provider card ──────────────────────────────────────────────────
function ProviderCard({ provider, connecte, lastSync, onConnect, onDisconnect, onSync, loading, disabled, disabledLabel }) {
  const [confirmeDeconnect, setConfirmeDeconnect] = useState(false)

  return (
    <motion.div
      layout
      style={{
        background:    C.card,
        backdropFilter:       'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
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
          // provider.couleur vaut var(--accent) : ni le fond ni la bordure de
          // cette pastille ne s'affichaient. On passe par le triplet.
          background: `rgba(${provider.trame}, 0.09)`,
          border: `1px solid rgba(${provider.trame}, 0.19)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {provider.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: ENCRE, display: 'flex', alignItems: 'center', gap: 8 }}>
            {provider.nom}
            {!provider.disponible && (
              <span style={{ fontSize: 10, background: 'rgba(var(--rgb-terracotta), 0.12)', color: C.orange, padding: '1px 7px', borderRadius: 12, fontWeight: 600 }}>
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
            background: 'rgba(var(--rgb-terracotta), 0.08)',
            border: '1px solid rgba(var(--rgb-terracotta), 0.16)',
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
            disabled ? (
              <div style={{
                flex: 1, padding: '10px 16px', borderRadius: 12, textAlign: 'center',
                background: 'rgba(var(--rgb-terracotta), 0.08)', border: '1px solid rgba(var(--rgb-terracotta), 0.16)',
                fontSize: 13, color: C.texte2, fontWeight: 500,
              }}>
                {disabledLabel || 'Non disponible'}
              </div>
            ) : (
            <button
              onClick={() => onConnect(provider)}
              style={{
                flex: 1, padding: '10px 16px',
                background: 'rgba(var(--rgb-verre), 0.32)',
                border: '1px solid rgba(var(--rgb-creme-dore), 0.38)', borderRadius: 12, color: AMBRE,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Connecter
            </button>
            )
          ) : (
            <>
              <button
                onClick={() => onSync(provider.id)}
                disabled={loading}
                style={{
                  flex: 1, padding: '9px 14px',
                  background: 'rgba(var(--rgb-terracotta), 0.10)',
                  border: '1px solid rgba(var(--rgb-terracotta), 0.20)',
                  borderRadius: 12, color: C.orange,
                  fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {loading ? 'Sync…' : 'Sync'}
              </button>
              <button
                onClick={() => {
                  if (confirmeDeconnect) { onDisconnect(provider.id); setConfirmeDeconnect(false) }
                  else { setConfirmeDeconnect(true); setTimeout(() => setConfirmeDeconnect(false), 3500) }
                }}
                style={{
                  padding: '9px 14px',
                  background: confirmeDeconnect ? 'rgba(239,68,68,0.12)' : 'rgba(var(--rgb-terracotta), 0.08)',
                  border: `1px solid ${confirmeDeconnect ? 'rgba(239,68,68,0.30)' : 'rgba(var(--rgb-terracotta), 0.16)'}`,
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
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
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
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'rgba(40,20,5,0.92)', borderRadius: 20,
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
          padding: 28, width: '100%', maxWidth: 380,
          boxShadow: '0 24px 60px rgba(0,0,0,0.50)',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="7" stroke={ICONE} strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke={ICONE} strokeWidth="1.5"/>
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.texte, marginBottom: 6 }}>
          Connecter Oura Ring
        </div>
        <div style={{ fontSize: 13, color: C.texte2, marginBottom: 20, lineHeight: 1.5 }}>
          Crée un Personal Access Token sur{' '}
          <a href="https://cloud.ouraring.com/personal-access-tokens" target="_blank" rel="noreferrer"
            style={{ color: C.orange }}>
            cloud.ouraring.com
          </a>, puis colle-le ici.
        </div>

        <input
          type="password"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
          value={token}
          onChange={e => setToken(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px',
            border: `1.5px solid ${erreur ? C.rouge : 'rgba(var(--rgb-terracotta), 0.25)'}`,
            borderRadius: 12, fontSize: 16,
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
            flex: 1, padding: '11px', background: 'rgba(var(--rgb-terracotta), 0.08)',
            border: '1px solid rgba(var(--rgb-terracotta), 0.16)', borderRadius: 12,
            color: C.texte2, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins',
          }}>Annuler</button>
          <button onClick={connecter} disabled={loading || !token.trim()} style={{
            flex: 1, padding: '11px',
            background: 'rgba(var(--rgb-verre), 0.32)',
            border: '1px solid rgba(var(--rgb-creme-dore), 0.38)', borderRadius: 12,
            color: AMBRE, fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins',
          }}>
            {loading ? 'Vérification…' : 'Connecter'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ConnexionsSante({ userId, onMetriqueUpdate }) {
  const [integrations,   setIntegrations]   = useState([])
  const [loadingSync,    setLoadingSync]     = useState(null)
  const [modalOura,      setModalOura]       = useState(false)
  const [toast,          setToast]           = useState(null)
  const [oauthBanner,    setOauthBanner]     = useState(null)
  // Le retour OAuth vaut pour Withings comme pour Garmin : la banniere doit
  // nommer le bon service, sinon un echec Garmin s'affiche « erreur Withings ».
  const [oauthNom,       setOauthNom]        = useState('')
  // Ce que le serveur a reellement configure. Tant qu'on ne le sait pas, on
  // n'affiche aucun bouton qui pourrait ne mener nulle part.
  const [dispoServeur,   setDispoServeur]    = useState(null)
  const [syncing,        setSyncing]         = useState(false)
  const [hkConnected,    setHkConnected]     = useState(() => localStorage.getItem(HK_KEY) === 'true')
  const [hkLastSync,     setHkLastSync]      = useState(() => localStorage.getItem(HK_KEY + '_last'))
  // La disponibilite ne se lit plus d'un trait. Sur Android il faut demander
  // au systeme si Health Connect est la, absent mais installable, ou hors de
  // portee de l'appareil : trois reponses, et l'ecran doit les distinguer.
  const [santeInfo, setSanteInfo] = useState({
    disponible: false, plateforme: null, aInstaller: false, nom: 'Sante',
  })
  useEffect(() => { santeDisponible().then(setSanteInfo).catch(() => {}) }, [])
  const hkAvailable = santeInfo.disponible

  useEffect(() => {
    if (userId) chargerIntegrations()

    // ── Retour OAuth Withings ──────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search)
    const retour = params.get('integration')
    if (retour === 'withings' || retour === 'garmin') {
      const statut = params.get('status')
      setOauthNom(PROVIDERS.find(p => p.id === retour)?.nom || retour)
      window.history.replaceState({}, '', window.location.pathname)

      if (statut === 'indisponible') {
        setOauthBanner('indisponible')
        setTimeout(() => setOauthBanner(null), 6000)
      } else if (statut === 'ok') {
        setOauthBanner('ok')
        // Déclencher sync automatique
        if (userId) {
          setSyncing(true)
          authHeaders()
            .then(h => fetch('/api/sync-now', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', ...h },
              body:    JSON.stringify({ userId, provider: retour }),
            }))
            .finally(() => setSyncing(false))
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

  // Un bouton « Connecter » qui ne peut pas aboutir est pire qu'un bouton
  // absent : il promet, puis ejecte. On demande donc au serveur, et un echec de
  // cette requete laisse `null`, traite comme « disponible » pour ne pas cacher
  // une integration qui marche a cause d'un simple hoquet reseau.
  useEffect(() => {
    let vivant = true
    fetch('/api/connect/disponibles')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (vivant && d) setDispoServeur(d) })
      .catch(() => {})
    return () => { vivant = false }
  }, [])

  async function chargerIntegrations() {
    try {
      const res = await fetch(`/api/integrations?userId=${userId}`, { headers: await authHeaders() })
      if (!res.ok) { setIntegrations([]); return }
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch {
      // Échec silencieux : liste vide, pas de crash
      setIntegrations([])
    }
  }

  function showToast(msg, duree = 3000) {
    setToast(msg)
    setTimeout(() => setToast(null), duree)
  }

  function estConnecte(providerId) {
    if (providerId === 'apple_health') return hkConnected
    return integrations.some(i => i.provider === providerId && i.actif)
  }

  function getIntegration(providerId) {
    return integrations.find(i => i.provider === providerId)
  }

  async function connecter(provider) {
    if (!userId) return

    if (provider.methode === 'oauth') {
      window.location.href = `/api/connect/${provider.id}?userId=${userId}`
    } else if (provider.methode === 'token') {
      if (provider.id === 'oura') setModalOura(true)
    } else if (provider.methode === 'native' && provider.id === 'apple_health') {
      if (!hkAvailable) {
        // Deux refus tres differents : « installe Health Connect » se repare en
        // deux touches, « ton appareil ne peut pas » ne se repare jamais. Les
        // confondre enverrait des gens chercher une app inutilisable chez eux.
        if (santeInfo.aInstaller) {
          showToast('Installe Health Connect, puis reviens ici')
          await ouvrirReglagesSante()
        } else {
          showToast('Disponible depuis l\'app Solenn, sur iPhone ou Android')
        }
        return
      }
      setLoadingSync('apple_health')
      try {
        const accorde = await demanderAccesSante()
        if (!accorde) { showToast('Autorisation refusée'); return }
        localStorage.setItem(HK_KEY, 'true')
        setHkConnected(true)
        showToast(santeInfo.nom + ' connecté !')
        await syncAppleHealth()
      } catch (e) {
        showToast('Autorisation refusée')
      } finally {
        setLoadingSync(null)
      }
    }
  }

  async function syncAppleHealth() {
    setLoadingSync('apple_health')
    try {
      const metrics = await lireSanteAujourdhui()
      let synced = 0
      if (onMetriqueUpdate) {
        for (const [key, val] of Object.entries(metrics)) {
          if (val !== undefined && val > 0) {
            onMetriqueUpdate(key, val)
            synced++
          }
        }
      }
      // Historique poids 30 jours → merge localStorage
      // Reserve a iOS : appeler HealthKit sur Android echouerait a chaque
      // synchronisation, et ferait passer une sync reussie pour un echec.
      const weightHistory = santeInfo.plateforme === 'ios' ? await readWeightHistory(30) : []
      if (weightHistory.length > 0) {
        try {
          const stored = JSON.parse(localStorage.getItem('vitacoach_history') || '[]')
          const merged = [...stored]
          for (const w of weightHistory) {
            const idx = merged.findIndex(h => h.date === w.date)
            if (idx >= 0) merged[idx] = { ...merged[idx], poids: w.poids }
            else merged.push({ date: w.date, poids: w.poids })
          }
          localStorage.setItem('vitacoach_history', JSON.stringify(merged))
        } catch {}
      }
      const now = new Date().toISOString()
      localStorage.setItem(HK_KEY + '_last', now)
      setHkLastSync(now)
      showToast(`${synced} métriques synchronisées depuis Apple Santé`)
    } catch (e) {
      showToast('Erreur de sync Apple Santé')
    } finally {
      setLoadingSync(null)
    }
  }

  async function deconnecter(providerId) {
    await fetch(`/api/disconnect?userId=${userId}&provider=${providerId}`, { method: 'DELETE', headers: await authHeaders() })
    await chargerIntegrations()
    showToast('Intégration déconnectée')
  }

  async function syncNow(providerId) {
    if (providerId === 'apple_health') {
      await syncAppleHealth()
      return
    }
    setLoadingSync(providerId)
    try {
      const res  = await fetch('/api/sync-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId, provider: providerId }),
      })
      const data = await res.json()
      await chargerIntegrations()
      showToast(`${data.synced || 0} métriques synchronisées`)
    } catch (e) {
      showToast('Erreur de synchronisation')
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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" fill={ICONE} stroke="#22c55e" strokeWidth="1.5"/>
              <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: VERT, lineHeight: 1.3 }}>
                {oauthNom || 'Service'} connecté !
              </div>
              <div style={{ fontSize: 12, color: VERT, marginTop: 2, opacity: 0.85 }}>
                {syncing ? 'Synchronisation en cours…' : 'Synchronisation lancée, données disponibles dans quelques secondes.'}
              </div>
            </div>
            <button
              onClick={() => setOauthBanner(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: VERT, opacity: 0.6, padding: '0 4px',
                flexShrink: 0,
              }}
              aria-label="Fermer"
            >×</button>
          </motion.div>
        )}

        {(oauthBanner === 'error' || oauthBanner === 'indisponible') && (
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
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" fill={ICONE} stroke="#ef4444" strokeWidth="1.5"/>
              <path d="M8 8l8 8M16 8l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: ROUGE, lineHeight: 1.3 }}>
                {oauthBanner === 'indisponible'
                  ? `${oauthNom || 'Ce service'} arrive bientôt`
                  : `Erreur de connexion ${oauthNom || ''}`.trim()}
              </div>
              <div style={{ fontSize: 12, color: ROUGE, marginTop: 2, opacity: 0.85 }}>
                {oauthBanner === 'indisponible'
                  ? "La connexion n'est pas encore ouverte. Tes autres sources continuent de fonctionner."
                  : 'Réessaye depuis le bouton ci-dessous, ou vérifie ton compte.'}
              </div>
            </div>
            <button
              onClick={() => setOauthBanner(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, color: ROUGE, opacity: 0.6, padding: '0 4px',
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

      {PROVIDERS.map(brut => {
        // `disponible` est une valeur d'affichage, pas une constante : Withings
        // et Garmin ne s'affichent connectables que si le serveur a leurs cles.
        const provider = (dispoServeur && brut.methode === 'oauth' && dispoServeur[brut.id] === false)
          ? { ...brut, disponible: false }
          : brut
        const isHK = provider.id === 'apple_health'
        const fiche = isHK && santeInfo.plateforme === 'android'
          ? { ...provider, nom: 'Health Connect',
              description: 'Le magasin de santé d\'Android, sync automatique' }
          : provider
        return (
          <ProviderCard
            key={provider.id}
            provider={fiche}
            connecte={estConnecte(provider.id)}
            lastSync={isHK ? hkLastSync : getIntegration(provider.id)?.last_sync_at}
            onConnect={connecter}
            onDisconnect={isHK ? () => {
              localStorage.removeItem(HK_KEY)
              localStorage.removeItem(HK_KEY + '_last')
              setHkConnected(false)
              setHkLastSync(null)
              showToast('Apple Santé déconnecté')
            } : deconnecter}
            onSync={syncNow}
            loading={loadingSync === provider.id}
            disabled={isHK && !hkAvailable}
            disabledLabel={isHK && !hkAvailable ? 'App iOS uniquement' : undefined}
          />
        )
      })}

      <div style={{ fontSize: 11, color: C.texte2, textAlign: 'center', marginTop: 8, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
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
              showToast('Oura Ring connecté !')
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
              bottom:         'calc(env(safe-area-inset-bottom, 0px) + 100px)',
              left:           '50%',
              transform:      'translateX(-50%)',
              background:           'rgba(40,20,5,0.96)',
              backdropFilter:       'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color:                '#fff',
              borderRadius:         16,
              padding:              '13px 22px',
              fontSize:             14,
              fontWeight:           600,
              fontFamily:           'Poppins, sans-serif',
              zIndex:               300,
              whiteSpace:           'nowrap',
              boxShadow:            '0 8px 32px rgba(0,0,0,0.50)',
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
