// ─── GUIDE DES EXERCICES — démonstrations animées ────────────────────────────
// Demande Jean (2026-07-25) : des exercices qui MONTRENT quoi faire.
// Pas de photos de stock (rejetées sur les tenues) : silhouettes en trait
// animées (SVG + CSS keyframes), style ligne terracotta cohérent avec la
// charte Icons.jsx. Chaque fiche : le geste animé, les étapes, les erreurs
// courantes. Bibliothèque v1 : 8 exercices doux orientés programme poids /
// bien-être (aucune promesse, aucun vocabulaire de performance).

import React, { useState } from 'react'

const F = "'Poppins', system-ui, sans-serif"
const T = '#C87B52'

// ── Silhouettes animées ──────────────────────────────────────────────────────
// Figure filaire : tête (cercle) + segments. Chaque exercice anime le groupe
// entre 2 poses par CSS. viewBox 100x100, trait 4, bout rond.
const S = { stroke: T, strokeWidth: 4, strokeLinecap: 'round', fill: 'none' }

function AnimSquat() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`
        @keyframes exoSquat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(14px) } }
        @keyframes exoSquatJambe { 0%,100% { d: path('M42 62 L42 78 L40 94') } 50% { d: path('M42 62 L30 74 L40 94') } }
        .sq-corps { animation: exoSquat 2.6s ease-in-out infinite; }
      `}</style>
      <g className="sq-corps">
        <circle cx="46" cy="18" r="7" {...S} />
        <path d="M46 25 L44 52" {...S} />
        <path d="M45 32 L62 40" {...S} />
      </g>
      <path {...S} style={{ animation: 'exoSquatJambe 2.6s ease-in-out infinite' }} d="M42 62 L42 78 L40 94" />
      <path d="M18 94 L82 94" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function AnimGainage() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`@keyframes exoPlankBreath { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }`}</style>
      <g style={{ animation: 'exoPlankBreath 3s ease-in-out infinite' }}>
        <circle cx="20" cy="58" r="7" {...S} />
        <path d="M27 62 L68 70" {...S} />
        <path d="M32 64 L30 82" {...S} />
        <path d="M68 70 L88 82" {...S} />
      </g>
      <path d="M10 88 L92 88" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function AnimFente() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`
        @keyframes exoFente { 0%,100% { transform: translateY(0) } 50% { transform: translateY(11px) } }
        @keyframes exoFenteAv { 0%,100% { d: path('M48 60 L60 74 L60 92') } 50% { d: path('M48 66 L64 76 L60 92') } }
        @keyframes exoFenteAr { 0%,100% { d: path('M48 60 L38 76 L34 92') } 50% { d: path('M48 66 L36 80 L28 92') } }
      `}</style>
      <g style={{ animation: 'exoFente 2.8s ease-in-out infinite' }}>
        <circle cx="50" cy="16" r="7" {...S} />
        <path d="M50 23 L48 52" {...S} />
      </g>
      <path {...S} style={{ animation: 'exoFenteAv 2.8s ease-in-out infinite' }} d="M48 60 L60 74 L60 92" />
      <path {...S} style={{ animation: 'exoFenteAr 2.8s ease-in-out infinite' }} d="M48 60 L38 76 L34 92" />
      <path d="M12 92 L88 92" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function AnimPont() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`@keyframes exoPont { 0%,100% { d: path('M26 80 Q50 76 66 78 L82 84') } 45%,65% { d: path('M26 80 Q50 52 66 62 L82 84') } }`}</style>
      <circle cx="18" cy="76" r="7" {...S} />
      <path {...S} style={{ animation: 'exoPont 3.2s ease-in-out infinite' }} d="M26 80 Q50 76 66 78 L82 84" />
      <path d="M10 90 L92 90" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function AnimChaise() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`@keyframes exoChaise { 0%,100% { transform: translateY(0) } 50% { transform: translateY(2px) } }`}</style>
      <path d="M74 30 L74 92" stroke="rgba(200,123,82,0.30)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <g style={{ animation: 'exoChaise 2.4s ease-in-out infinite' }}>
        <circle cx="62" cy="26" r="7" {...S} />
        <path d="M64 33 L68 58" {...S} />
        <path d="M68 58 L46 62 L46 90" {...S} />
      </g>
      <path d="M20 92 L88 92" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function AnimChatVache() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`@keyframes exoChat { 0%,100% { d: path('M30 62 Q50 52 72 62') } 50% { d: path('M30 62 Q50 74 72 62') } }`}</style>
      <circle cx="22" cy="60" r="7" {...S} />
      <path {...S} style={{ animation: 'exoChat 3.4s ease-in-out infinite' }} d="M30 62 Q50 52 72 62" />
      <path d="M34 66 L34 88 M66 66 L66 88" {...S} />
      <path d="M14 90 L88 90" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function AnimMarche() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`
        @keyframes exoMarcheJ1 { 0%,100% { d: path('M50 58 L60 74 L58 92') } 50% { d: path('M50 58 L42 76 L48 92') } }
        @keyframes exoMarcheJ2 { 0%,100% { d: path('M50 58 L40 74 L34 92') } 50% { d: path('M50 58 L58 76 L66 92') } }
        @keyframes exoMarcheB { 0%,100% { transform: rotate(6deg) } 50% { transform: rotate(-6deg) } }
      `}</style>
      <circle cx="50" cy="16" r="7" {...S} />
      <path d="M50 23 L50 52" {...S} />
      <path d="M50 32 L60 44" {...S} style={{ animation: 'exoMarcheB 1.6s ease-in-out infinite', transformOrigin: '50px 32px' }} />
      <path {...S} style={{ animation: 'exoMarcheJ1 1.6s ease-in-out infinite' }} d="M50 58 L60 74 L58 92" />
      <path {...S} style={{ animation: 'exoMarcheJ2 1.6s ease-in-out infinite' }} d="M50 58 L40 74 L34 92" />
    </svg>
  )
}

function AnimEtirement() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`@keyframes exoEtire { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(-14deg) } }`}</style>
      <g style={{ animation: 'exoEtire 3.6s ease-in-out infinite', transformOrigin: '50px 60px' }}>
        <circle cx="50" cy="18" r="7" {...S} />
        <path d="M50 25 L50 60" {...S} />
        <path d="M50 30 L38 14 M50 30 L64 16" {...S} />
      </g>
      <path d="M50 60 L42 92 M50 60 L58 92" {...S} />
      <path d="M18 94 L82 94" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// ── Bibliothèque v1 ──────────────────────────────────────────────────────────
const EXOS = [
  {
    id: 'squat', nom: 'Squat', duree: '3 × 10', cible: 'Jambes · fessiers',
    Anim: AnimSquat,
    etapes: ['Pieds largeur d\'épaules, dos droit, regard devant', 'Descends comme pour t\'asseoir, poids dans les talons', 'Remonte en poussant dans le sol, sans verrouiller les genoux'],
    erreurs: ['Les genoux qui rentrent vers l\'intérieur', 'Le dos qui s\'arrondit en bas du mouvement'],
  },
  {
    id: 'gainage', nom: 'Gainage', duree: '3 × 30 s', cible: 'Centre du corps',
    Anim: AnimGainage,
    etapes: ['Avant-bras au sol, coudes sous les épaules', 'Corps aligné des épaules aux talons', 'Respire calmement, serre le ventre sans bloquer'],
    erreurs: ['Les hanches qui montent ou qui creusent', 'Retenir sa respiration'],
  },
  {
    id: 'fente', nom: 'Fentes alternées', duree: '2 × 8 / jambe', cible: 'Jambes · équilibre',
    Anim: AnimFente,
    etapes: ['Grand pas en avant, buste droit', 'Descends jusqu\'à ce que les deux genoux soient à 90°', 'Repousse le sol pour revenir, change de jambe'],
    erreurs: ['Le genou avant qui dépasse trop les orteils', 'Le buste qui penche en avant'],
  },
  {
    id: 'pont', nom: 'Pont fessier', duree: '3 × 12', cible: 'Fessiers · dos',
    Anim: AnimPont,
    etapes: ['Allongé·e sur le dos, pieds à plat près des fessiers', 'Soulève le bassin jusqu\'à aligner épaules-genoux', 'Redescends lentement, vertèbre par vertèbre'],
    erreurs: ['Pousser avec le cou ou les épaules', 'Cambrer excessivement en haut'],
  },
  {
    id: 'chaise', nom: 'Chaise au mur', duree: '3 × 30 s', cible: 'Cuisses',
    Anim: AnimChaise,
    etapes: ['Dos entier collé au mur', 'Glisse jusqu\'à avoir les genoux à 90°', 'Tiens la position en respirant normalement'],
    erreurs: ['Les mains sur les cuisses (elles trichent !)', 'Les talons décollés du sol'],
  },
  {
    id: 'chatvache', nom: 'Chat-vache', duree: '8 respirations', cible: 'Dos · détente',
    Anim: AnimChatVache,
    etapes: ['À quatre pattes, mains sous les épaules', 'Inspire en creusant doucement le dos, regard devant', 'Expire en arrondissant le dos, tête relâchée'],
    erreurs: ['Aller trop vite — le mouvement suit la respiration', 'Forcer l\'amplitude'],
  },
  {
    id: 'marche', nom: 'Marche active', duree: '20-30 min', cible: 'Cardio doux',
    Anim: AnimMarche,
    etapes: ['Rythme où parler reste possible mais chanter non', 'Bras qui accompagnent naturellement', 'Régularité avant intensité : mieux vaut 20 min chaque jour'],
    erreurs: ['Confondre marche active et flânerie', 'Zapper les jours de pluie — prévois un plan B intérieur'],
  },
  {
    id: 'etirement', nom: 'Étirement latéral', duree: '4 × 20 s / côté', cible: 'Souplesse · détente',
    Anim: AnimEtirement,
    etapes: ['Debout, bras au-dessus de la tête', 'Penche-toi doucement sur le côté en expirant', 'Reste dans une tension agréable, jamais douloureuse'],
    erreurs: ['Rebondir pour aller plus loin', 'Tourner le buste au lieu de rester de profil'],
  },
]

// ── UI ───────────────────────────────────────────────────────────────────────
export default function ExercicesGuide({ onClose }) {
  const [actif, setActif] = useState(null)
  const exo = EXOS.find(e => e.id === actif)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      background: 'rgba(26,10,0,0.32)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'settingsFade 0.22s ease both',
    }}>
      <style>{`
        @keyframes settingsFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes exoSheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, maxHeight: '88dvh', overflowY: 'auto',
        background: 'rgba(255,244,232,0.96)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        borderRadius: '28px 28px 0 0', border: '1px solid rgba(200,123,82,0.20)', borderBottom: 'none',
        padding: '14px 20px calc(24px + env(safe-area-inset-bottom))',
        fontFamily: F, animation: 'exoSheetUp 0.38s cubic-bezier(0.22,1,0.36,1) both',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ width: 44, height: 5, background: 'rgba(200,123,82,0.30)', borderRadius: 8, margin: '0 auto 14px' }} />

        {!exo && (
          <>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: 'rgba(178,102,62,0.96)', marginBottom: 4 }}>
              Guide des exercices
            </div>
            <div style={{ fontSize: 12, color: 'rgba(200,123,82,0.65)', marginBottom: 16, lineHeight: 1.5 }}>
              Chaque geste montré et expliqué. Doucement, régulièrement — jamais dans la douleur.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {EXOS.map(e => (
                <button key={e.id} onClick={() => setActif(e.id)} style={{
                  background: 'rgba(255,235,210,0.45)', border: '1px solid rgba(255,220,160,0.40)',
                  borderRadius: 16, padding: '10px 12px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: F,
                }}>
                  <div style={{ height: 78 }}><e.Anim /></div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(178,102,62,0.95)', marginTop: 2 }}>{e.nom}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(200,123,82,0.60)' }}>{e.cible} · {e.duree}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {exo && (
          <>
            <button onClick={() => setActif(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: F,
              fontSize: 12, fontWeight: 600, color: 'rgba(200,123,82,0.75)', padding: '2px 0 10px',
            }}>← Tous les exercices</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: 'rgba(178,102,62,0.96)' }}>{exo.nom}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(200,123,82,0.65)' }}>{exo.cible} · {exo.duree}</div>
              </div>
            </div>
            <div style={{
              height: 190, background: 'rgba(255,235,210,0.40)', border: '1px solid rgba(255,220,160,0.40)',
              borderRadius: 18, marginBottom: 14, padding: 10,
            }}>
              <exo.Anim />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(200,123,82,0.75)', marginBottom: 8 }}>Comment faire</div>
            {exo.etapes.map((et, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(200,123,82,0.14)', border: '1px solid rgba(200,123,82,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10.5, fontWeight: 700, color: T,
                }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: 'rgba(178,102,62,0.90)', lineHeight: 1.55 }}>{et}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(200,123,82,0.75)', margin: '14px 0 8px' }}>À éviter</div>
            {exo.erreurs.map((er, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8442E" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span style={{ fontSize: 12.5, color: 'rgba(178,102,62,0.80)', lineHeight: 1.5 }}>{er}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: 'rgba(200,123,82,0.55)', marginTop: 14, lineHeight: 1.5 }}>
              Écoute ton corps : une douleur (autre que l'effort) = on arrête. En cas de condition médicale, demande l'avis d'un professionnel de santé.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
