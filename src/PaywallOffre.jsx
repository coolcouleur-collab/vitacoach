// ─── PAYWALL POST-ONBOARDING — « 21 jours offerts » ──────────────────────────
// Affiché une seule fois, juste après l'onboarding (le combo essai long +
// paywall d'onboarding est le plus performant de la catégorie — étude de
// marché 2026-07-21). L'essai de 21 jours démarre automatiquement à
// l'inscription (auth.users.created_at) : le bouton principal ne fait
// qu'entrer dans l'app, aucun paiement demandé avant le jour 21.
// Sur les builds natifs iOS/Android : pas de checkout Stripe (Apple 3.1.1 /
// Google Play Billing) — seul le CTA d'essai est proposé.

import React, { useState } from 'react'
import { motion } from 'framer-motion'

const F = "'Poppins', sans-serif"
const SERIF = "'Cormorant Garamond', Georgia, serif"

const CheckSvg = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#C87B52" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const AVANTAGES = [
  'Conversations illimitées avec Solenn',
  'Challenge 21 jours personnalisé',
  'Données santé connectées (Apple Health, Withings, Garmin)',
  'Routines et rapport hebdomadaire',
]

export default function PaywallOffre({ nom, isNative, onStart, onSubscribe }) {
  const [plan, setPlan] = useState('annual')
  const prenom = nom ? nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase() : ''

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(165deg, #FFF6E8 0%, #FBE8CC 55%, #F5DDB0 100%)',
      padding: '24px 20px calc(24px + env(safe-area-inset-bottom))', fontFamily: F,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500,
            fontSize: 'clamp(30px, 8vw, 38px)', color: '#0A1633', lineHeight: 1.12,
          }}>
            {prenom ? `${prenom}, tes` : 'Tes'} 21 premiers jours<br />sont offerts
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(10,22,51,0.55)', marginTop: 10, lineHeight: 1.55 }}>
            Tout Solenn, sans limite, pendant 21 jours.<br />Aucun paiement demandé aujourd'hui.
          </div>
        </div>

        {/* Avantages */}
        <div style={{
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(200,123,82,0.18)', borderRadius: 18,
          padding: '16px 18px', marginBottom: 16,
          boxShadow: '0 10px 34px rgba(200,123,82,0.10)',
        }}>
          {AVANTAGES.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
              fontSize: 13.5, color: 'rgba(10,22,51,0.78)',
              borderBottom: i < AVANTAGES.length - 1 ? '1px solid rgba(200,123,82,0.10)' : 'none',
            }}>
              <CheckSvg /> {a}
            </div>
          ))}
        </div>

        {/* Plans — web uniquement (conformité stores sur natif) */}
        {!isNative && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              { key: 'annual', titre: 'Annuel', prix: '44,99 €', sub: 'soit 3,75 €/mois', badge: 'Recommandé' },
              { key: 'monthly', titre: 'Mensuel', prix: '7,99 €', sub: 'par mois', badge: null },
            ].map(p => {
              const actif = plan === p.key
              return (
                <button key={p.key} onClick={() => setPlan(p.key)} style={{
                  flex: 1, position: 'relative', cursor: 'pointer', fontFamily: F, textAlign: 'left',
                  background: actif ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.38)',
                  border: actif ? '1.5px solid rgba(200,123,82,0.65)' : '1px solid rgba(200,123,82,0.18)',
                  borderRadius: 16, padding: '14px 14px 12px',
                  boxShadow: actif ? '0 8px 26px rgba(200,123,82,0.16)' : 'none',
                  transition: 'all .2s ease',
                }}>
                  {p.badge && (
                    <div style={{
                      position: 'absolute', top: -9, left: 12, fontSize: 9.5, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff',
                      background: 'linear-gradient(135deg, #E8962A, #C87B52)',
                      padding: '2px 9px', borderRadius: 99,
                    }}>{p.badge}</div>
                  )}
                  <div style={{ fontSize: 12, color: 'rgba(10,22,51,0.55)', fontWeight: 500 }}>{p.titre}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#0A1633', margin: '2px 0 1px' }}>{p.prix}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(10,22,51,0.45)' }}>{p.sub}</div>
                </button>
              )
            })}
          </div>
        )}

        {/* CTA principal : entrer dans l'essai */}
        <button onClick={onStart} style={{
          width: '100%', cursor: 'pointer', fontFamily: F, fontWeight: 600, fontSize: 15,
          color: '#fff', border: 'none', borderRadius: 16, padding: '15px 20px',
          background: 'linear-gradient(135deg, #E8962A 0%, #C87B52 100%)',
          boxShadow: '0 10px 30px rgba(200,123,82,0.35)',
        }}>
          Commencer mes 21 jours offerts
        </button>

        {/* CTA secondaire : s'abonner tout de suite (web uniquement) */}
        {!isNative && (
          <button onClick={() => onSubscribe(plan)} style={{
            width: '100%', cursor: 'pointer', fontFamily: F, fontWeight: 500, fontSize: 12.5,
            color: 'rgba(10,22,51,0.55)', background: 'transparent', border: 'none',
            padding: '13px 0 2px', textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            Ou passe directement à Pro — {plan === 'annual' ? '44,99 €/an' : '7,99 €/mois'}, résiliable à tout moment
          </button>
        )}

        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(10,22,51,0.38)', marginTop: 14, lineHeight: 1.5 }}>
          À la fin de l'essai, Solenn reste accessible en version limitée.<br />
          Solenn est une intelligence artificielle et n'est pas un dispositif médical.
        </div>
      </motion.div>
    </div>
  )
}
