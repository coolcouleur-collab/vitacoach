// ─── GUIDE DES EXERCICES — démonstrations animées ────────────────────────────
// Silhouettes en trait terracotta, animation par ALTERNANCE DE 2 POSES
// (crossfade opacity — compatible Safari/iOS, contrairement aux animations de
// tracés `d: path()` qui restent figées sur iPhone — corrigé 2026-07-25).
// Exporte matchExercice(texte) pour afficher « Voir le geste » sur les actions
// du challenge / de la routine qui mentionnent un exercice.

import React, { useState } from 'react'
import { createPortal } from 'react-dom'

const API_BASE = import.meta.env.VITE_API_URL || ''
const F = "'Poppins', system-ui, sans-serif"
const T = '#C87B52'
const S = { stroke: T, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
const SOL = <path d="M12 92 L88 92" stroke="rgba(200,123,82,0.25)" strokeWidth="3" strokeLinecap="round" fill="none" />

// Deux poses en alternance — le cœur du système, 100 % compatible mobile.
// labelA/labelB : mot-clé synchronisé avec chaque pose (« Descends » quand la
// silhouette descend) pour que le mouvement soit compris sans ambiguïté
// (retour Jean 2026-07-25 : les bonshommes seuls pourraient ne pas suffire).
function DeuxPoses({ poseA, poseB, labelA, labelB, duree = 2.6 }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`
        @keyframes exoPoseA { 0%, 40% { opacity: 1 } 50%, 90% { opacity: 0 } 100% { opacity: 1 } }
        @keyframes exoPoseB { 0%, 40% { opacity: 0 } 50%, 90% { opacity: 1 } 100% { opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .exo-a, .exo-b { animation: none !important } .exo-b { opacity: 0.35 !important } }
      `}</style>
      {SOL}
      <g className="exo-a" style={{ animation: `exoPoseA ${duree}s ease-in-out infinite` }}>
        {poseA}
        {labelA && <text x="50" y="99" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="rgba(200,123,82,0.85)" fontFamily="Poppins, sans-serif">{labelA}</text>}
      </g>
      <g className="exo-b" style={{ animation: `exoPoseB ${duree}s ease-in-out infinite` }}>
        {poseB}
        {labelB && <text x="50" y="99" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="rgba(200,123,82,0.85)" fontFamily="Poppins, sans-serif">{labelB}</text>}
      </g>
    </svg>
  )
}

// Trois poses en séquence (départ → milieu → fin) — pour les gestes où le
// trajet du mouvement doit être explicite (retour Jean 2026-07-25)
function TroisPoses({ poses, labels, duree = 3.3 }) {
  const anims = [
    `@keyframes exoP1 { 0%, 26% { opacity: 1 } 33%, 93% { opacity: 0 } 100% { opacity: 1 } }`,
    `@keyframes exoP2 { 0%, 26% { opacity: 0 } 33%, 59% { opacity: 1 } 66%, 100% { opacity: 0 } }`,
    `@keyframes exoP3 { 0%, 59% { opacity: 0 } 66%, 93% { opacity: 1 } 100% { opacity: 0 } }`,
  ]
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <style>{`${anims.join('\n')}
        @media (prefers-reduced-motion: reduce) { .exo-p { animation: none !important; opacity: 0.45 !important } }`}</style>
      {SOL}
      {poses.map((pose, i) => (
        <g key={i} className="exo-p" style={{ animation: `exoP${i + 1} ${duree}s ease-in-out infinite` }}>
          {pose}
          {labels?.[i] && <text x="50" y="99" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="rgba(200,123,82,0.85)" fontFamily="Poppins, sans-serif">{labels[i]}</text>}
        </g>
      ))}
    </svg>
  )
}

const AnimSquat = () => (
  <TroisPoses
    labels={['Debout', 'Fléchis…', 'Assieds-toi dans le vide']}
    poses={[
      <><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 56 M50 32 L62 40 M50 56 L48 74 L48 92 M50 56 L54 74 L54 92" {...S} /></>,
      <><circle cx="47" cy="24" r="7" {...S} /><path d="M48 31 L49 58 M48 38 L61 45 M49 58 L56 72 L52 92 M49 58 L40 72 L44 92" {...S} /></>,
      <><circle cx="44" cy="34" r="7" {...S} /><path d="M45 41 L48 62 M46 48 L60 52 M48 62 L64 66 L60 92 M48 62 L36 70 L40 92" {...S} /></>,
    ]}
  />
)

const AnimGainage = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
    <style>{`@keyframes exoPlankBreath { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }`}</style>
    {SOL}
    <g style={{ animation: 'exoPlankBreath 3s ease-in-out infinite' }}>
      <circle cx="20" cy="62" r="7" {...S} />
      <path d="M27 66 L66 72 M31 68 L30 84 M66 72 L86 84" {...S} />
    </g>
  </svg>
)

const AnimFente = () => (
  <DeuxPoses labelA="Debout" labelB="Grand pas"
    poseA={<><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 56 M50 32 L61 41 M50 56 L46 74 L46 92 M50 56 L55 74 L55 92" {...S} /></>}
    poseB={<><circle cx="52" cy="28" r="7" {...S} /><path d="M52 35 L51 60 M52 42 L64 48 M51 60 L66 70 L66 92 M51 60 L40 76 L32 90" {...S} /></>}
  />
)

const AnimPont = () => (
  <DeuxPoses labelA="Allonge-toi" labelB="Soulève le bassin"
    poseA={<><circle cx="20" cy="82" r="6" {...S} /><path d="M26 84 L58 84 L66 74 L68 92" {...S} /></>}
    poseB={<><circle cx="20" cy="82" r="6" {...S} /><path d="M26 84 L44 66 L58 62 L66 74 L68 92" {...S} /></>}
    duree={3.2}
  />
)

const AnimChaise = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
    <style>{`@keyframes exoChaise { 0%,100% { transform: translateY(0) } 50% { transform: translateY(2px) } }`}</style>
    {SOL}
    <path d="M72 28 L72 92" stroke="rgba(200,123,82,0.30)" strokeWidth="4" strokeLinecap="round" fill="none" />
    <g style={{ animation: 'exoChaise 2.4s ease-in-out infinite' }}>
      <circle cx="62" cy="24" r="7" {...S} />
      <path d="M64 31 L68 56 M68 56 L46 60 L46 92" {...S} />
    </g>
  </svg>
)

const AnimChatVache = () => (
  <DeuxPoses labelA="Inspire, dos creux" labelB="Expire, dos rond"
    poseA={<><circle cx="24" cy="52" r="6" {...S} /><path d="M31 56 Q52 46 70 60 M36 60 L36 88 M66 62 L66 88" {...S} /></>}
    poseB={<><circle cx="24" cy="64" r="6" {...S} /><path d="M31 62 Q52 76 70 62 M36 66 L36 88 M66 64 L66 88" {...S} /></>}
    duree={3.4}
  />
)

const AnimMarche = () => (
  <DeuxPoses labelA="Un pas" labelB="Deux pas"
    poseA={<><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 54 M50 32 L62 42 M50 32 L40 44 M50 54 L62 72 L60 92 M50 54 L40 72 L34 90" {...S} /></>}
    poseB={<><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 54 M50 32 L38 42 M50 32 L60 44 M50 54 L38 72 L36 92 M50 54 L60 72 L68 90" {...S} /></>}
    duree={1.7}
  />
)

const AnimEtirement = () => (
  <DeuxPoses labelA="Bras levés" labelB="Penche-toi"
    poseA={<><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 60 M50 30 L38 14 M50 30 L62 14 M50 60 L42 92 M50 60 L58 92" {...S} /></>}
    poseB={<><circle cx="60" cy="20" r="7" {...S} /><path d="M58 27 L50 60 M56 32 L44 18 M56 32 L72 24 M50 60 L42 92 M50 60 L58 92" {...S} /></>}
    duree={3.6}
  />
)

// ── Bibliothèque ─────────────────────────────────────────────────────────────
// Photo de démonstration réelle, avec repli sur l'animation. Jean : « les
// animations sont exactement ce que je voulais, mais j'ai peur que les
// bonshommes ne suffisent pas » (2026-07-27). La photo montre le geste sur un
// vrai corps ; l'animation reste dans la fiche détaillée pour décomposer le
// mouvement.
// radius : 12 dans la grille, 18 dans la fiche.
// fallback='anim' (grille) : sans photo on retombe sur la silhouette animée.
// fallback='rien' (fiche) : l'animation est déjà affichée juste en dessous.
function PhotoExo({ exo, height = 78, radius = 12, fallback = 'anim' }) {
  const [img, setImg] = React.useState(null)
  const [ko, setKo] = React.useState(false)
  React.useEffect(() => {
    let vivant = true
    setImg(null); setKo(false)
    if (!exo.recherche) { setKo(true); return }
    fetch(`${API_BASE}/api/image?prompt=${encodeURIComponent(exo.recherche)}`)
      .then(r => r.json())
      .then(d => { if (!vivant) return; if (d?.url) setImg(d.url); else setKo(true) })
      .catch(() => { if (vivant) setKo(true) })
    return () => { vivant = false }
  }, [exo.id])

  if (ko || !img) {
    if (fallback === 'rien') return null
    return <div style={{ height }}><exo.Anim /></div>
  }
  return (
    <div style={{
      height, borderRadius: radius, overflow: 'hidden', marginBottom: fallback === 'rien' ? 10 : 0,
      background: 'rgba(255,240,220,0.60)', border: '1px solid rgba(255,220,160,0.40)',
    }}>
      <img src={img} alt={exo.nom} onError={() => setKo(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  )
}

const EXOS = [
  {
    id: 'squat', recherche: 'woman doing squat exercise fitness', nom: 'Squat', duree: '3 × 10', cible: 'Jambes · fessiers',
    mots: ['squat', 'flexion'],
    Anim: AnimSquat,
    etapes: ['Pieds largeur d\'épaules, dos droit, regard devant', 'Descends comme pour t\'asseoir, poids dans les talons', 'Remonte en poussant dans le sol, sans verrouiller les genoux'],
    erreurs: ['Les genoux qui rentrent vers l\'intérieur', 'Le dos qui s\'arrondit en bas du mouvement'],
  },
  {
    id: 'gainage', recherche: 'plank exercise fitness demonstration', nom: 'Gainage', duree: '3 × 30 s', cible: 'Centre du corps',
    mots: ['gainage', 'planche', 'plank'],
    Anim: AnimGainage,
    etapes: ['Avant-bras au sol, coudes sous les épaules', 'Corps aligné des épaules aux talons', 'Respire calmement, serre le ventre sans bloquer'],
    erreurs: ['Les hanches qui montent ou qui creusent', 'Retenir sa respiration'],
  },
  {
    id: 'fente', recherche: 'lunge exercise fitness demonstration', nom: 'Fentes alternées', duree: '2 × 8 / jambe', cible: 'Jambes · équilibre',
    mots: ['fente', 'lunge'],
    Anim: AnimFente,
    etapes: ['Grand pas en avant, buste droit', 'Descends jusqu\'à ce que les deux genoux soient à 90°', 'Repousse le sol pour revenir, change de jambe'],
    erreurs: ['Le genou avant qui dépasse trop les orteils', 'Le buste qui penche en avant'],
  },
  {
    id: 'pont', recherche: 'glute bridge exercise fitness', nom: 'Pont fessier', duree: '3 × 12', cible: 'Fessiers · dos',
    mots: ['pont', 'bridge', 'bassin'],
    Anim: AnimPont,
    etapes: ['Allongé·e sur le dos, pieds à plat près des fessiers', 'Soulève le bassin jusqu\'à aligner épaules-genoux', 'Redescends lentement, vertèbre par vertèbre'],
    erreurs: ['Pousser avec le cou ou les épaules', 'Cambrer excessivement en haut'],
  },
  {
    id: 'chaise', recherche: 'wall sit exercise fitness', nom: 'Chaise au mur', duree: '3 × 30 s', cible: 'Cuisses',
    mots: ['chaise'],
    Anim: AnimChaise,
    etapes: ['Dos entier collé au mur', 'Glisse jusqu\'à avoir les genoux à 90°', 'Tiens la position en respirant normalement'],
    erreurs: ['Les mains sur les cuisses (elles trichent !)', 'Les talons décollés du sol'],
  },
  {
    id: 'chatvache', recherche: 'cat cow yoga stretch pose', nom: 'Chat-vache', duree: '8 respirations', cible: 'Dos · détente',
    mots: ['chat-vache', 'chat vache', 'dos rond', 'mobilité du dos'],
    Anim: AnimChatVache,
    etapes: ['À quatre pattes, mains sous les épaules', 'Inspire en creusant doucement le dos, regard devant', 'Expire en arrondissant le dos, tête relâchée'],
    erreurs: ['Aller trop vite — le mouvement suit la respiration', 'Forcer l\'amplitude'],
  },
  {
    id: 'marche', recherche: 'brisk walking outdoor exercise', nom: 'Marche active', duree: '20-30 min', cible: 'Cardio doux',
    mots: ['marche', 'marcher', 'pas rapide', 'balade'],
    Anim: AnimMarche,
    etapes: ['Rythme où parler reste possible mais chanter non', 'Bras qui accompagnent naturellement', 'Régularité avant intensité : mieux vaut 20 min chaque jour'],
    erreurs: ['Confondre marche active et flânerie', 'Zapper les jours de pluie — prévois un plan B intérieur'],
  },
  {
    id: 'etirement', recherche: 'side stretch exercise fitness', nom: 'Étirement latéral', duree: '4 × 20 s / côté', cible: 'Souplesse · détente',
    mots: ['étirement', 'etirement', 'stretch', 's\'étirer'],
    Anim: AnimEtirement,
    etapes: ['Debout, bras au-dessus de la tête', 'Penche-toi doucement sur le côté en expirant', 'Reste dans une tension agréable, jamais douloureuse'],
    erreurs: ['Rebondir pour aller plus loin', 'Tourner le buste au lieu de rester de profil'],
  },
]

// Détecte si un texte d'action (challenge, routine) mentionne un exercice du
// guide → permet d'afficher « Voir le geste » à côté du conseil
export function matchExercice(texte) {
  if (!texte) return null
  const t = texte.toLowerCase()
  for (const e of EXOS) {
    if (e.mots.some(m => t.includes(m))) return e.id
  }
  return null
}

// ── UI ───────────────────────────────────────────────────────────────────────
export default function ExercicesGuide({ onClose, initial = null }) {
  const [actif, setActif] = useState(initial)
  const exo = EXOS.find(e => e.id === actif)

  // Portail vers <body> : rendu depuis une carte animée (transform), un
  // position:fixed serait piégé et invisible — bug « rien ne se passe »
  // au tap sur Voir le geste (2026-07-27)
  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      background: 'rgba(26,10,0,0.32)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'exoFade 0.22s ease both',
    }}>
      <style>{`
        @keyframes exoFade { from { opacity: 0 } to { opacity: 1 } }
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
                  <PhotoExo exo={e} height={78} />
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
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: 'rgba(178,102,62,0.96)' }}>{exo.nom}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(200,123,82,0.65)', marginBottom: 10 }}>{exo.cible} · {exo.duree}</div>
            <PhotoExo exo={exo} height={150} radius={18} fallback="rien" />
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
    </div>,
    document.body
  )
}
