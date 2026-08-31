// ─── PAYWALL POST-ONBOARDING, « 21 jours offerts » ──────────────────────────
// Affiché une seule fois, juste après l'onboarding (le combo essai long +
// paywall d'onboarding est le plus performant de la catégorie, étude de
// marché 2026-07-21). L'essai dure 21 jours : ramené à 14 le 2026-08-12, puis remis à 21 le
// 2026-08-25, la fiche des magasins ayant toujours promis 21 jours et l'essai
// devant couvrir un programme entier. Démarre automatiquement à
// l'inscription (auth.users.created_at) : le bouton principal ne fait
// qu'entrer dans l'app, aucun paiement demandé avant le jour 21.
// Sur les builds natifs iOS/Android : pas de checkout Stripe (Apple 3.1.1 /
// Google Play Billing), seul le CTA d'essai est proposé.
// Style : univers « verre translucide » Solenn, même recette que la page
// Auth (fond chaud + halos cuivre, cartes verre ambré clair, textes crème).

import React, { useState } from 'react'
import { motion } from 'framer-motion'

const F = "'Poppins', sans-serif"
const SERIF = "'Cormorant Garamond', Georgia, serif"
const CREME = 'rgba(255,248,235,1)'
const CREME_70 = 'rgba(255,248,235,0.78)'
const CREME_50 = 'rgba(255,248,235,0.55)'

const CheckSvg = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CREME} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.9 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Ce que cet ecran vend a change le 2026-08-12. Il listait des
// fonctionnalites de suivi : or Bevel, le concurrent principal, offre
// GRATUITEMENT tout le suivi et le fait mieux, avec 700 exercices, l'import
// d'analyses sanguines et l'age biologique. Chaque ligne de suivi jouait donc
// contre nous.
// Il vend desormais la seule chose qu'un tracker ne fait pas : une IA qui se
// souvient, qui mesure ses propres conseils, et qui n'est pas rationnee. Leur
// coach IA, lui, a un quota hebdomadaire, c'est ecrit dans leur grille.
// Et l'argument le plus concret : Solenn marche sans montre connectee, alors
// que tout chez eux en depend.
const AVANTAGES = [
  'Solenn se souvient de ce que tu lui racontes',
  'Elle relie tes mots à tes chiffres, et te prouve ce qui a changé',
  "Elle change d'approche quand son conseil ne marche pas",
  'Conversations illimitées, sans quota hebdomadaire',
  'Aucune montre nécessaire, la tienne est un bonus, pas une condition',
]

// Halos cuivre, même esprit que les BgBlobs de la page Auth/Onboarding
function Halos() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,123,82,0.50) 0%, rgba(200,100,40,0.22) 45%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,123,82,0.38) 0%, rgba(180,90,30,0.16) 45%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '25%', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(190,105,35,0.22) 0%, rgba(160,80,20,0.10) 40%, transparent 70%)',
      }} />
    </div>
  )
}

export default function PaywallOffre({ nom, isNative, onStart, onSubscribe }) {
  const [plan, setPlan] = useState('annual')
  const prenom = nom ? nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase() : ''

  return (
    <div style={{
      // HAUTEUR bornee et defilement interne, PAS un simple min-height.
      // tokens.css met body en position:fixed et #root en overflow:hidden pour
      // supprimer le rebond elastique d'iOS : plus rien ne defile au niveau du
      // document. Avec min-height seul, cette page GRANDIT au-dela de l'ecran
      // au lieu de defiler, et #root la coupe net. Le bouton « Commencer mes
      // 21 jours offerts » devenait alors INATTEIGNABLE : personne ne pouvait
      // entrer dans l'app (constate par Jean le 2026-08-31, en creant le
      // compte d'examen). Meme defaut que le questionnaire d'inscription et la
      // feuille d'abonnement.
      //
      // Le centrage passe par margin:auto sur la carte, et NON par
      // alignItems:center : un enfant centre par align-items dans un conteneur
      // qui defile se fait couper EN HAUT, sans moyen de remonter.
      height: '100%', minHeight: '100%', overflowY: 'auto', overflowX: 'hidden',
      position: 'relative', display: 'flex', justifyContent: 'center',
      background: 'linear-gradient(160deg, #FFF6E8 0%, #F5DDB0 50%, #FFF6E8 100%)',
      padding: '24px 20px calc(24px + env(safe-area-inset-bottom))', fontFamily: F,
    }}>
      <Halos />
      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1, margin: 'auto 0' }}
      >
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500,
            fontSize: 'clamp(30px, 8vw, 38px)', color: CREME, lineHeight: 1.12,
            textShadow: '0 2px 18px rgba(160,80,20,0.25)',
          }}>
            {prenom ? `${prenom}, tes` : 'Tes'} 21 premiers jours<br />sont offerts
          </div>
          <div style={{ fontSize: 13.5, color: CREME_70, marginTop: 10, lineHeight: 1.55 }}>
            Tout Solenn, sans limite, pendant 21 jours.<br />Aucun paiement demandé aujourd'hui.
          </div>
        </div>

        {/* Avantages, carte verre ambré clair */}
        <div style={{
          background: 'rgba(255,235,210,0.28)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,220,160,0.32)', borderRadius: 18,
          padding: '16px 18px', marginBottom: 16,
          boxShadow: '0 8px 40px rgba(180,80,20,0.10)',
        }}>
          {AVANTAGES.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
              fontSize: 13.5, color: CREME,
              borderBottom: i < AVANTAGES.length - 1 ? '1px solid rgba(255,220,160,0.22)' : 'none',
            }}>
              <CheckSvg /> {a}
            </div>
          ))}
        </div>

        {/* Plans, web uniquement (conformité stores sur natif) */}
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
                  background: actif ? 'rgba(255,235,210,0.42)' : 'rgba(255,235,210,0.18)',
                  backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                  border: actif ? '1.5px solid rgba(255,220,160,0.75)' : '1px solid rgba(255,220,160,0.30)',
                  borderRadius: 16, padding: '14px 14px 12px',
                  boxShadow: actif ? '0 8px 26px rgba(180,80,20,0.14), inset 0 1px 0 rgba(255,240,200,0.30)' : 'none',
                  transition: 'all .2s ease',
                }}>
                  {p.badge && (
                    <div style={{
                      position: 'absolute', top: -9, left: 12, fontSize: 9.5, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase', color: CREME,
                      background: 'rgba(200,123,82,0.75)',
                      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,235,210,0.45)',
                      padding: '2px 9px', borderRadius: 99,
                    }}>{p.badge}</div>
                  )}
                  <div style={{ fontSize: 12, color: CREME_70, fontWeight: 500 }}>{p.titre}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: CREME, margin: '2px 0 1px' }}>{p.prix}</div>
                  <div style={{ fontSize: 10.5, color: CREME_50 }}>{p.sub}</div>
                </button>
              )
            })}
          </div>
        )}

        {/* CTA principal : entrer dans l'essai, verre ambré clair */}
        <button onClick={onStart} style={{
          width: '100%', cursor: 'pointer', fontFamily: F, fontWeight: 600, fontSize: 15,
          color: CREME, borderRadius: 16, padding: '15px 20px',
          background: 'rgba(255,235,210,0.32)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,220,160,0.60)',
          boxShadow: '0 0 26px rgba(232,190,100,0.25), inset 0 1px 0 rgba(255,240,200,0.28)',
        }}>
          Commencer mes 21 jours offerts
        </button>

        {/* CTA secondaire : s'abonner tout de suite (web uniquement) */}
        {!isNative && (
          <button onClick={() => onSubscribe(plan)} style={{
            width: '100%', cursor: 'pointer', fontFamily: F, fontWeight: 500, fontSize: 12.5,
            color: CREME_70, background: 'transparent', border: 'none',
            padding: '13px 0 2px', textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            Ou passe directement à Pro, {plan === 'annual' ? '44,99 €/an' : '7,99 €/mois'}, résiliable à tout moment
          </button>
        )}

        <div style={{ textAlign: 'center', fontSize: 10.5, color: CREME_50, marginTop: 14, lineHeight: 1.5 }}>
          À la fin de l'essai, Solenn reste accessible en version limitée.<br />
          Solenn est une intelligence artificielle et n'est pas un dispositif médical.
        </div>
      </motion.div>
    </div>
  )
}
