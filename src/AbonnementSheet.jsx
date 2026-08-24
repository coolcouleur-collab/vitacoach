// ─── MON ABONNEMENT — la gestion se fait DANS Solenn ─────────────────────────
// Jean, 2026-08-14 : « pourquoi tu crées pas juste une page pour gérer
// l'abonnement ». On ne renvoie donc plus vers la page Stripe, qui sortait de
// l'univers de l'app. Le portail Stripe reste accessible en secondaire pour le
// seul changement de carte : la saisie d'un moyen de paiement ne doit jamais
// passer par notre interface.
//
// Palette : verre ambré clair, texte terracotta, comme SettingsSheet. Aucune
// surface sombre flottante. Rouge réservé au danger, ici la résiliation.

import React, { useState, useEffect } from 'react'
import { StarIcon } from './Icons'

const C = {
  bg: 'rgba(255,244,232,0.90)',
  bgCard: 'rgba(255,235,210,0.45)',
  border: 'rgba(200,123,82,0.20)',
  borderStrong: 'rgba(200,123,82,0.38)',
  accent: '#C87B52',
  accentLight: 'rgba(200,123,82,0.14)',
  text: 'rgba(178,102,62,0.95)',
  textFort: 'rgba(150,85,50,0.95)',
  textMuted: 'rgba(200,123,82,0.62)',
  danger: 'rgba(239,68,68,0.75)',
  dangerBg: 'rgba(239,68,68,0.06)',
  dangerBord: 'rgba(239,68,68,0.22)',
  shadow: '0 -24px 64px rgba(180,100,40,0.18), 0 -4px 20px rgba(200,100,40,0.10)',
  font: "'Poppins', system-ui, sans-serif",
}

const jourMois = ms => ms
  ? new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : null

function Ligne({ label, valeur }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '9px 0' }}>
      <span style={{ fontSize: 13, color: C.textMuted }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.textFort, textAlign: 'right' }}>{valeur}</span>
    </div>
  )
}

export default function AbonnementSheet({ userId, authHeaders, onClose }) {
  const [etat, setEtat]       = useState('chargement') // chargement | pret | erreur
  const [abo, setAbo]         = useState(null)
  const [message, setMessage] = useState('')
  const [confirme, setConfirme] = useState(false)
  const [occupe, setOccupe]   = useState(false)

  async function charger() {
    try {
      const r = await fetch(`/api/abonnement?userId=${userId}`, { headers: await authHeaders() })
      const d = await r.json()
      if (d?.abonnement) { setAbo(d.abonnement); setEtat('pret') }
      else if (d?.sansAbonnement) {
        setMessage(d.proManuel
          ? "Ton accès Pro a été activé directement sur ton compte, sans paiement en ligne. Il n'y a rien à gérer ici."
          : "Aucun abonnement n'est rattaché à ce compte.")
        setEtat('pret')
      } else { setEtat('erreur') }
    } catch { setEtat('erreur') }
  }

  useEffect(() => { charger() }, [userId])

  async function agir(route) {
    if (occupe) return
    setOccupe(true)
    try {
      const r = await fetch(`/api/abonnement/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId }),
      })
      const d = await r.json()
      if (d?.abonnement) { setAbo(d.abonnement); setConfirme(false) }
      else setMessage("L'opération n'a pas abouti. Réessaie dans un instant.")
    } catch {
      setMessage("L'opération n'a pas abouti. Réessaie dans un instant.")
    }
    setOccupe(false)
  }

  async function ouvrirPortail() {
    try {
      const r = await fetch('/api/portail-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId, retour: window.location.origin + '/' }),
      })
      const d = await r.json()
      if (d?.url) window.location.href = d.url
      else setMessage("Impossible d'ouvrir la page de paiement sécurisée.")
    } catch { setMessage("Impossible d'ouvrir la page de paiement sécurisée.") }
  }

  const btnDoux = {
    width: '100%', padding: '13px 0', borderRadius: 14, cursor: 'pointer',
    background: 'rgba(255,235,210,0.45)', border: '1px solid rgba(255,220,160,0.60)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    color: C.text, fontSize: 14, fontWeight: 700, fontFamily: C.font,
  }

  return (
    <>
      <style>{`
        @keyframes aboFade { from { opacity:0 } to { opacity:1 } }
        @keyframes aboUp   { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>

      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        background: 'rgba(26,10,0,0.32)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        animation: 'aboFade 0.22s ease both',
      }} />

      {/* Le conteneur fixe couvre TOUT l'ecran et colle la feuille en bas.
          L'animation porte sur la feuille, jamais sur le conteneur : en
          animant le conteneur fixe, un arret au premier keyframe le decale de
          toute sa hauteur et la feuille sort de l'ecran. */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1301,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          animation: 'aboUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
          width: '100%', maxWidth: 520, background: C.bg,
          backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '28px 28px 0 0', boxShadow: C.shadow,
          border: `1px solid ${C.border}`, borderBottom: 'none',
          display: 'flex', flexDirection: 'column',
          maxHeight: '92dvh', overflow: 'hidden', fontFamily: C.font,
        }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 44, height: 5, background: 'rgba(200,123,82,0.30)', borderRadius: 8, margin: '14px auto 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 22px 12px' }}>
              <StarIcon size={17} color="#E8962A" />
              <span style={{ fontSize: 17, fontWeight: 800, color: C.textFort }}>Mon abonnement</span>
              <button onClick={onClose} style={{
                marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer',
                color: C.textMuted, fontSize: 13, fontWeight: 600, fontFamily: C.font,
              }}>Fermer</button>
            </div>
          </div>

          {/* flex:1 et minHeight:0 sont indispensables : sans eux, dans une
              colonne flex bornee par maxHeight, cette zone prend la hauteur de
              son contenu, deborde, et le parent en overflow:hidden la coupe.
              C'est ce qui tronquait la feuille (Jean, 2026-08-14). */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 22px 30px' }}>
            {etat === 'chargement' && (
              <div style={{ padding: '30px 0', textAlign: 'center', color: C.textMuted, fontSize: 13.5 }}>
                Un instant, je regarde…
              </div>
            )}

            {etat === 'erreur' && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: C.textMuted, fontSize: 13.5, lineHeight: 1.6 }}>
                Je n'arrive pas à lire ton abonnement pour le moment.
                <br />Réessaie plus tard, ou écris à contact@meet-solenn.com.
              </div>
            )}

            {etat === 'pret' && !abo && (
              <div style={{ padding: '18px 0', color: C.text, fontSize: 13.5, lineHeight: 1.65 }}>
                {message}
              </div>
            )}

            {etat === 'pret' && abo && (
              <>
                <div style={{
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  borderRadius: 18, padding: '6px 16px 10px', marginBottom: 14,
                }}>
                  <Ligne label="Formule" valeur={`Solenn Pro · ${abo.periode === 'an' ? 'annuel' : 'mensuel'}`} />
                  <Ligne label="Montant" valeur={abo.montant != null ? `${abo.montant.toFixed(2).replace('.', ',')} € par ${abo.periode}` : '—'} />
                  {abo.carte && (
                    <Ligne label="Moyen de paiement" valeur={`${abo.carte.marque} se terminant par ${abo.carte.fin}`} />
                  )}
                  <Ligne
                    label={abo.resilie ? 'Accès jusqu\'au' : 'Prochain prélèvement'}
                    valeur={jourMois(abo.finPeriode) || 'inconnu'}
                  />
                </div>

                {abo.resilie ? (
                  <div style={{
                    background: C.accentLight, border: `1px solid ${C.borderStrong}`,
                    borderRadius: 16, padding: '14px 16px', marginBottom: 14,
                    fontSize: 13, color: C.text, lineHeight: 1.6,
                  }}>
                    Ton abonnement est résilié. Tu gardes l'accès complet jusqu'au {jourMois(abo.finPeriode)},
                    puis rien ne sera prélevé. Tu peux revenir sur ta décision d'ici là.
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 14 }}>
                    Tu peux résilier quand tu veux. Ton accès reste actif jusqu'à la fin de la période
                    déjà payée, et rien n'est prélevé ensuite.
                  </div>
                )}

                {abo.resilie ? (
                  <button onClick={() => agir('reprendre')} disabled={occupe} style={btnDoux}>
                    {occupe ? 'Un instant…' : 'Reprendre mon abonnement'}
                  </button>
                ) : confirme ? (
                  <div style={{
                    background: C.dangerBg, border: `1px solid ${C.dangerBord}`,
                    borderRadius: 16, padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>
                      Tu confirmes ? Tu gardes tout jusqu'au {jourMois(abo.finPeriode)}, et rien
                      ne sera prélevé après.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setConfirme(false)} style={{ ...btnDoux, flex: 1 }}>
                        Annuler
                      </button>
                      <button onClick={() => agir('annuler')} disabled={occupe} style={{
                        ...btnDoux, flex: 1, color: C.danger,
                        background: 'rgba(239,68,68,0.06)', border: `1px solid ${C.dangerBord}`,
                      }}>
                        {occupe ? 'Un instant…' : 'Oui, résilier'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirme(true)} style={{
                    ...btnDoux, color: C.danger,
                    background: C.dangerBg, border: `1px solid ${C.dangerBord}`,
                  }}>
                    Résilier mon abonnement
                  </button>
                )}

                {/* Secondaire : Stripe uniquement pour ce qui touche la carte. */}
                <button onClick={ouvrirPortail} style={{
                  width: '100%', marginTop: 12, padding: '10px 0', border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  color: C.textMuted, fontSize: 12.5, fontFamily: C.font, textDecoration: 'underline',
                }}>
                  Changer de carte ou voir mes factures
                </button>

                {message && (
                  <div style={{ marginTop: 12, fontSize: 12.5, color: C.danger, lineHeight: 1.55 }}>
                    {message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
