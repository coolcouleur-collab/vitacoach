// ─── GUIDE DES EXERCICES, démonstrations animées ────────────────────────────
// Silhouettes en trait terracotta, animation par ALTERNANCE DE 2 POSES
// (crossfade opacity, compatible Safari/iOS, contrairement aux animations de
// tracés `d: path()` qui restent figées sur iPhone, corrigé 2026-07-25).
// Exporte matchExercice(texte) pour afficher « Voir le geste » sur les actions
// du challenge / de la routine qui mentionnent un exercice.

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { ENCRE, ICONE } from './palette'

const F = "'Poppins', system-ui, sans-serif"
const T = '#C87B52'
const S = { stroke: T, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }
const SOL = <path d="M12 92 L88 92" stroke={ICONE} strokeWidth="3" strokeLinecap="round" fill="none" />

// Deux poses en alternance, le cœur du système, 100 % compatible mobile.
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
        {labelA && <text x="50" y="99" textAnchor="middle" fontSize="7.5" fontWeight="600" fill={ICONE} fontFamily="Poppins, sans-serif">{labelA}</text>}
      </g>
      <g className="exo-b" style={{ animation: `exoPoseB ${duree}s ease-in-out infinite` }}>
        {poseB}
        {labelB && <text x="50" y="99" textAnchor="middle" fontSize="7.5" fontWeight="600" fill={ICONE} fontFamily="Poppins, sans-serif">{labelB}</text>}
      </g>
    </svg>
  )
}

// Trois poses en séquence (départ → milieu → fin), pour les gestes où le
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
          {labels?.[i] && <text x="50" y="99" textAnchor="middle" fontSize="7.5" fontWeight="600" fill={ICONE} fontFamily="Poppins, sans-serif">{labels[i]}</text>}
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
    <path d="M72 28 L72 92" stroke={ICONE} strokeWidth="4" strokeLinecap="round" fill="none" />
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

const AnimPompe = () => (
  <DeuxPoses labelA="Bras tendus" labelB="Descends"
    poseA={<><circle cx="22" cy="54" r="6" {...S} /><path d="M28 57 L70 64 M32 58 L32 78 M66 63 L86 78" {...S} /></>}
    poseB={<><circle cx="22" cy="66" r="6" {...S} /><path d="M28 69 L70 72 M32 70 L34 80 M66 71 L86 80" {...S} /></>}
    duree={2.8}
  />
)

const AnimPompeGenoux = () => (
  <DeuxPoses labelA="Bras tendus" labelB="Descends"
    poseA={<><circle cx="24" cy="52" r="6" {...S} /><path d="M30 55 L64 62 M34 56 L34 78 M62 61 L74 76 L88 80" {...S} /></>}
    poseB={<><circle cx="24" cy="64" r="6" {...S} /><path d="M30 67 L64 70 M34 68 L36 80 M62 69 L74 78 L88 82" {...S} /></>}
    duree={2.8}
  />
)

const AnimSuperman = () => (
  <DeuxPoses labelA="À plat ventre" labelB="Soulève"
    poseA={<><circle cx="20" cy="80" r="6" {...S} /><path d="M26 82 L74 82 M26 82 L12 86 M74 82 L88 86" {...S} /></>}
    poseB={<><circle cx="20" cy="72" r="6" {...S} /><path d="M26 75 L74 75 M26 74 L12 64 M74 75 L88 66" {...S} /></>}
    duree={3.2}
  />
)

const AnimDips = () => (
  <DeuxPoses labelA="Bras tendus" labelB="Plie les coudes"
    poseA={<><circle cx="46" cy="26" r="7" {...S} /><path d="M46 33 L46 58 M46 36 L30 46 L30 66 M46 58 L70 62 L70 88" {...S} /><path d="M22 66 L38 66" stroke={ICONE} strokeWidth="4" strokeLinecap="round" fill="none" /></>}
    poseB={<><circle cx="46" cy="40" r="7" {...S} /><path d="M46 47 L46 66 M46 48 L30 52 L30 66 M46 66 L70 68 L70 88" {...S} /><path d="M22 66 L38 66" stroke={ICONE} strokeWidth="4" strokeLinecap="round" fill="none" /></>}
    duree={2.8}
  />
)


// ─── Vague 2, 2026-08-14 : 13 exercices, la bibliothèque passe de 12 à 25 ──
// Sans matériel (chaise et mur exceptés), du cardio aux obliques : c'est ce
// qui permet à deux programmes générés de ne pas se ressembler, et au cycle 2
// de monter en intensité avec de VRAIS nouveaux mouvements.

const AnimMountainClimber = () => (
  <DeuxPoses labelA="Genou droit" labelB="Genou gauche" duree={1.6}
    poseA={<><circle cx="24" cy="50" r="6" {...S} /><path d="M30 54 L64 66 M32 55 L32 74 M64 66 L70 80 L84 88 M64 66 L52 76 L44 70" {...S} /></>}
    poseB={<><circle cx="24" cy="50" r="6" {...S} /><path d="M30 54 L64 66 M32 55 L32 74 M64 66 L54 84 L46 90 M64 66 L74 74 L86 86" {...S} /></>}
  />
)

const AnimJumpingJack = () => (
  <DeuxPoses labelA="Bras le long" labelB="Saute, écarte" duree={1.5}
    poseA={<><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 56 M50 32 L42 46 M50 32 L58 46 M50 56 L46 74 L46 92 M50 56 L54 74 L54 92" {...S} /></>}
    poseB={<><circle cx="50" cy="12" r="7" {...S} /><path d="M50 19 L50 52 M50 26 L36 10 M50 26 L64 10 M50 52 L38 70 L34 88 M50 52 L62 70 L66 88" {...S} /></>}
  />
)

const AnimCrunch = () => (
  <DeuxPoses labelA="Allongé, genoux pliés" labelB="Décolle les épaules"
    poseA={<><circle cx="20" cy="82" r="6" {...S} /><path d="M26 84 L54 84 M54 84 L64 68 L74 88" {...S} /></>}
    poseB={<><circle cx="26" cy="70" r="6" {...S} /><path d="M30 75 L54 84 M54 84 L64 68 L74 88" {...S} /></>}
    duree={2.4}
  />
)

const AnimRussianTwist = () => (
  <DeuxPoses labelA="Tourne à droite" labelB="Tourne à gauche" duree={2.0}
    poseA={<><circle cx="48" cy="40" r="7" {...S} /><path d="M48 47 L52 68 M48 52 L32 60 M52 68 L68 76 L80 70" {...S} /></>}
    poseB={<><circle cx="52" cy="40" r="7" {...S} /><path d="M52 47 L52 68 M52 52 L70 58 M52 68 L68 76 L80 70" {...S} /></>}
  />
)

const AnimBirdDog = () => (
  <DeuxPoses labelA="À quatre pattes" labelB="Bras et jambe opposés"
    poseA={<><circle cx="24" cy="56" r="6" {...S} /><path d="M30 60 L68 62 M34 62 L34 88 M64 63 L64 88" {...S} /></>}
    poseB={<><circle cx="24" cy="54" r="6" {...S} /><path d="M30 58 L68 60 M30 56 L10 48 M34 60 L34 88 M68 60 L90 54" {...S} /></>}
    duree={3.0}
  />
)

const AnimDonkeyKick = () => (
  <DeuxPoses labelA="À quatre pattes" labelB="Pousse le talon au ciel"
    poseA={<><circle cx="26" cy="56" r="6" {...S} /><path d="M32 60 L68 62 M36 62 L36 88 M64 63 L64 88" {...S} /></>}
    poseB={<><circle cx="26" cy="56" r="6" {...S} /><path d="M32 60 L66 60 M36 62 L36 88 M66 60 L76 42 L88 34" {...S} /></>}
    duree={2.6}
  />
)

const AnimMollets = () => (
  <DeuxPoses labelA="Talons au sol" labelB="Monte sur la pointe" duree={1.9}
    poseA={<><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 58 M50 32 L60 42 M50 58 L47 76 L47 92 M50 58 L53 76 L53 92" {...S} /></>}
    poseB={<><circle cx="50" cy="10" r="7" {...S} /><path d="M50 17 L50 52 M50 26 L60 36 M50 52 L47 72 L47 86 M50 52 L53 72 L53 86" {...S} /></>}
  />
)

const AnimStepUp = () => (
  <DeuxPoses labelA="Pied sur la marche" labelB="Monte, pousse fort"
    poseA={<><path d="M58 92 L58 74 L92 74 L92 92" stroke={ICONE} strokeWidth="4" strokeLinecap="round" fill="none" /><circle cx="38" cy="26" r="7" {...S} /><path d="M38 33 L40 60 M38 40 L50 48 M40 60 L34 76 L34 92 M40 60 L58 66 L62 74" {...S} /></>}
    poseB={<><path d="M58 92 L58 74 L92 74 L92 92" stroke={ICONE} strokeWidth="4" strokeLinecap="round" fill="none" /><circle cx="64" cy="14" r="7" {...S} /><path d="M64 21 L66 46 M64 28 L76 36 M66 46 L62 62 L62 74 M66 46 L74 60 L74 74" {...S} /></>}
    duree={2.6}
  />
)

const AnimGenouxHauts = () => (
  <DeuxPoses labelA="Genou droit haut" labelB="Genou gauche haut" duree={1.4}
    poseA={<><circle cx="50" cy="14" r="7" {...S} /><path d="M50 21 L50 54 M50 30 L60 40 M50 30 L40 40 M50 54 L60 62 L60 74 M50 54 L44 74 L44 92" {...S} /></>}
    poseB={<><circle cx="50" cy="14" r="7" {...S} /><path d="M50 21 L50 54 M50 30 L40 40 M50 30 L60 40 M50 54 L40 62 L40 74 M50 54 L56 74 L56 92" {...S} /></>}
  />
)

const AnimSquatSaute = () => (
  <DeuxPoses labelA="Descends en squat" labelB="Explose vers le haut" duree={1.8}
    poseA={<><circle cx="46" cy="36" r="7" {...S} /><path d="M47 43 L50 62 M48 50 L62 54 M50 62 L64 68 L60 92 M50 62 L38 70 L42 92" {...S} /></>}
    poseB={<><circle cx="50" cy="8" r="7" {...S} /><path d="M50 15 L50 46 M50 22 L38 8 M50 22 L62 8 M50 46 L42 62 L40 78 M50 46 L58 62 L60 78" {...S} /></>}
  />
)

const AnimFenteLaterale = () => (
  <DeuxPoses labelA="Debout" labelB="Grand pas sur le côté"
    poseA={<><circle cx="50" cy="16" r="7" {...S} /><path d="M50 23 L50 56 M50 32 L60 42 M50 56 L46 74 L46 92 M50 56 L54 74 L54 92" {...S} /></>}
    poseB={<><circle cx="40" cy="30" r="7" {...S} /><path d="M41 37 L44 58 M42 44 L56 50 M44 58 L34 74 L32 92 M44 58 L68 66 L84 70" {...S} /></>}
    duree={2.8}
  />
)

const AnimPlancheLaterale = () => (
  <DeuxPoses labelA="Sur le côté, tiens" labelB="Hanches hautes"
    poseA={<><circle cx="22" cy="66" r="6" {...S} /><path d="M28 70 L70 78 M30 72 L30 86 M70 78 L88 84" {...S} /></>}
    poseB={<><circle cx="22" cy="58" r="6" {...S} /><path d="M28 62 L70 74 M30 64 L30 84 M70 74 L88 82 M26 56 L26 40" {...S} /></>}
    duree={3.2}
  />
)

const AnimLegRaise = () => (
  <DeuxPoses labelA="Allongé, jambes au sol" labelB="Monte les jambes"
    poseA={<><circle cx="18" cy="84" r="6" {...S} /><path d="M24 86 L52 86 M52 86 L88 88" {...S} /></>}
    poseB={<><circle cx="18" cy="84" r="6" {...S} /><path d="M24 86 L52 86 M52 86 L66 52 L70 40" {...S} /></>}
    duree={2.6}
  />
)

// ── Photos de démonstration ──────────────────────────────────────────────────
// Photos CHOISIES À LA MAIN, pas cherchées à l'exécution. Le 2026-08-11 la
// version qui appelait /api/image affichait la même photo de mode sur les huit
// vignettes : le front tape l'API via VITE_API_URL, donc Render, dont la route
// /api/image est écrite pour la page Style, elle réécrit toute requête en
// « woman … ootd full body street style » et, faute de clé Pexels, retombe sur
// un placeholder LoremFlickr identique pour tout le monde.
// Même en tapant la bonne route (celle de Vercel), la recherche sémantique
// renvoyait un culturiste torse nu pour le gainage et un gros plan sur le
// bassin pour le pont fessier. Sur huit exercices figés, la sélection manuelle
// est la seule qui garantisse le bon geste ET un cadrage correct.
// Un exercice sans photo retombe proprement sur son animation.
// `pos` = object-position vertical. Les photos sont verticales, la vignette est
// large : un recadrage centré tombe systématiquement sur les hanches. 70 % sur
// le pont fessier et 25 % sur l'étirement remettent la tête et le geste dans le
// cadre, vérifié en composant les recadrages réels avant de livrer.
const P = id => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`
export const PHOTOS_EXOS = {
  squat:     { url: P(8032754), pos: '50%' },
  gainage:   { url: P(7900683), pos: '50%' },
  fente:     { url: P(8038573), pos: '50%' },
  pont:      { url: P(4534643), pos: '70%' },
  chaise:    { url: P(6740054), pos: '50%' },
  chatvache: { url: P(6303431), pos: '50%' },
  marche:    { url: P(8539234), pos: '50%' },
  etirement: { url: P(7880157), pos: '25%' },
  // Haut du corps, ajoute le 2026-08-12 : la bibliotheque n'avait AUCUN
  // exercice de poussee ni de tirage. Un programme qui s'annonce complet et ne
  // fait jamais travailler bras, epaules et dos se decredibilise.
  pompe:       { url: P(7900673), pos: '50%' },
  dips:        { url: P(6496123), pos: '50%' },
  // Trouvees sur Unsplash le 2026-08-13, apres l'ajout de la cle : Pexels
  // n'avait rien de juste pour ces deux mouvements.
  // Pompes sur genoux : DIX-SEPT recherches sur les deux banques, aucune photo
  // qui montre reellement les genoux au sol. Celle retenue le 2026-08-13
  // montrait une planche jambes tendues, signalee par Jean : une photo qui
  // enseigne un autre geste est pire que l'animation, qui montre le bon.
  pompegenoux: null,
  superman:    { url: 'https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', pos: '50%' },
  // Vague 2 : animations pour l'instant, la recherche de photos justes se
  // fera en lot (le taux de photos reellement exactes est faible, voir les
  // pompes sur genoux).
  // Vague 2, trouvees et VERIFIEES A L'OEIL le 2026-09-01, au recadrage reel de
  // 130px et non sur la foi de la description Pexels.
  mountainclimber: { url: P(2294361),  pos: '50%' },   // planche, un genou ramene
  planchelateral:  { url: P(2294363),  pos: '50%' },   // appui sur un bras, bras haut leve
  crunch:          { url: P(3930989),  pos: '50%' },
  mollets:         { url: P(13965339), pos: '50%' },   // gros plan, talon decolle visible
  russiantwist:    { url: P(5128466),  pos: '50%' },   // assise, pieds decolles, buste pivote
  jumpingjack:     { url: P(6339477),  pos: '50%' },
  genouxhauts:     { url: P(6339342),  pos: '50%' },

  // REJETEES apres verification, elles montraient autre chose :
  //   leg raise 14942844 : genoux plies et bassin enroule, c'est un crunch
  //     inverse et non un releve de jambes tendues ;
  //   step-up 13896897 : aucune caisse visible, et au recadrage de 130px elle
  //     serait coupee de toute facon. Le geste lu est « genoux hauts ».
  legraise: null, stepup: null,

  // JAMAIS TROUVEES. Pexels et Unsplash ne renvoient que le mouvement voisin :
  //   pompes sur genoux -> pompes classiques (deja 17 recherches en aout) ;
  //   bird dog -> des chiens et du yoga ;
  //   donkey kick -> des elastiques, pas le mouvement ;
  //   squat saute -> uniquement des sauts sur caisse, autre geste ;
  //   fente laterale -> uniquement des fentes avant.
 birddog: null, donkeykick: null,
  squatsaute: null, fentelaterale: null,
}

// Sans photo (ou si elle ne charge pas), on retombe sur la silhouette animée.
// fallback='rien' dans la fiche détaillée, où l'animation est déjà affichée
// juste en dessous.
function PhotoExo({ exo, height = 130, radius = 12, fallback = 'anim' }) {
  const [ko, setKo] = useState(false)
  const photo = PHOTOS_EXOS[exo.id]

  if (!photo || ko) {
    if (fallback === 'rien') return null
    return <div style={{ height }}><exo.Anim /></div>
  }
  return (
    <div style={{
      height, borderRadius: radius, overflow: 'hidden', marginBottom: fallback === 'rien' ? 12 : 0,
      background: 'rgba(255,240,220,0.60)', border: '1px solid rgba(255,220,160,0.40)',
    }}>
      <img src={photo.url} alt={exo.nom} loading="lazy" onError={() => setKo(true)}
        style={{
          width: '100%', height: '100%', display: 'block',
          objectFit: 'cover', objectPosition: `center ${photo.pos}`,
        }} />
    </div>
  )
}

// ── Bibliothèque ─────────────────────────────────────────────────────────────
const EXOS = [
  {
    id: 'squat', nom: 'Squat', duree: '3 × 10', cible: 'Jambes · fessiers',
    mots: ['squat', 'flexion'],
    Anim: AnimSquat,
    etapes: ['Pieds largeur d\'épaules, dos droit, regard devant', 'Descends comme pour t\'asseoir, poids dans les talons', 'Remonte en poussant dans le sol, sans verrouiller les genoux'],
    erreurs: ['Les genoux qui rentrent vers l\'intérieur', 'Le dos qui s\'arrondit en bas du mouvement'],
  },
  {
    id: 'gainage', nom: 'Gainage', duree: '3 × 30 s', cible: 'Centre du corps',
    mots: ['gainage', 'planche', 'plank'],
    Anim: AnimGainage,
    etapes: ['Avant-bras au sol, coudes sous les épaules', 'Corps aligné des épaules aux talons', 'Respire calmement, serre le ventre sans bloquer'],
    erreurs: ['Les hanches qui montent ou qui creusent', 'Retenir sa respiration'],
  },
  {
    id: 'fente', nom: 'Fentes alternées', duree: '2 × 8 / jambe', cible: 'Jambes · équilibre',
    mots: ['fente', 'lunge'],
    Anim: AnimFente,
    etapes: ['Grand pas en avant, buste droit', 'Descends jusqu\'à ce que les deux genoux soient à 90°', 'Repousse le sol pour revenir, change de jambe'],
    erreurs: ['Le genou avant qui dépasse trop les orteils', 'Le buste qui penche en avant'],
  },
  {
    id: 'pont', nom: 'Pont fessier', duree: '3 × 12', cible: 'Fessiers · dos',
    mots: ['pont', 'bridge', 'bassin'],
    Anim: AnimPont,
    etapes: ['Allongé·e sur le dos, pieds à plat près des fessiers', 'Soulève le bassin jusqu\'à aligner épaules-genoux', 'Redescends lentement, vertèbre par vertèbre'],
    erreurs: ['Pousser avec le cou ou les épaules', 'Cambrer excessivement en haut'],
  },
  {
    id: 'chaise', nom: 'Chaise au mur', duree: '3 × 30 s', cible: 'Cuisses',
    mots: ['chaise'],
    Anim: AnimChaise,
    etapes: ['Dos entier collé au mur', 'Glisse jusqu\'à avoir les genoux à 90°', 'Tiens la position en respirant normalement'],
    erreurs: ['Les mains sur les cuisses (elles trichent !)', 'Les talons décollés du sol'],
  },
  {
    id: 'chatvache', nom: 'Chat-vache', duree: '8 respirations', cible: 'Dos · détente',
    mots: ['chat-vache', 'chat vache', 'dos rond', 'mobilité du dos'],
    Anim: AnimChatVache,
    etapes: ['À quatre pattes, mains sous les épaules', 'Inspire en creusant doucement le dos, regard devant', 'Expire en arrondissant le dos, tête relâchée'],
    erreurs: ['Aller trop vite, le mouvement suit la respiration', 'Forcer l\'amplitude'],
  },
  {
    id: 'marche', nom: 'Marche active', duree: '20-30 min', cible: 'Cardio doux',
    mots: ['marche', 'marcher', 'pas rapide', 'balade'],
    Anim: AnimMarche,
    etapes: ['Rythme où parler reste possible mais chanter non', 'Bras qui accompagnent naturellement', 'Régularité avant intensité : mieux vaut 20 min chaque jour'],
    erreurs: ['Confondre marche active et flânerie', 'Zapper les jours de pluie, prévois un plan B intérieur'],
  },
  {
    id: 'etirement', nom: 'Étirement latéral', duree: '4 × 20 s / côté', cible: 'Souplesse · détente',
    mots: ['étirement', 'etirement', 'stretch', 's\'étirer'],
    Anim: AnimEtirement,
    etapes: ['Debout, bras au-dessus de la tête', 'Penche-toi doucement sur le côté en expirant', 'Reste dans une tension agréable, jamais douloureuse'],
    erreurs: ['Rebondir pour aller plus loin', 'Tourner le buste au lieu de rester de profil'],
  },
  {
    id: 'pompe', nom: 'Pompes', duree: '3 × 8', cible: 'Pectoraux · bras',
    mots: ['pompe', 'pompes', 'push-up'],
    Anim: AnimPompe,
    etapes: ['Mains un peu plus larges que les épaules, doigts vers l\'avant', 'Corps aligné de la tête aux talons, ventre serré', 'Descends jusqu\'à frôler le sol, coudes vers l\'arrière', 'Remonte en poussant, sans bloquer les coudes'],
    erreurs: ['Les coudes qui partent à 90° sur les côtés, mauvais pour les épaules', 'Les hanches qui s\'affaissent ou qui remontent'],
  },
  {
    id: 'pompegenoux', nom: 'Pompes sur genoux', duree: '3 × 10', cible: 'Pectoraux · débutant',
    mots: ['pompe genou', 'pompes sur genoux', 'pompe facile'],
    Anim: AnimPompeGenoux,
    etapes: ['Genoux au sol, chevilles croisées et relevées', 'Mains sous les épaules, dos droit des genoux à la tête', 'Descends la poitrine vers le sol', 'Pousse pour remonter'],
    erreurs: ['Casser la ligne au niveau des hanches', 'Descendre les fesses au lieu de la poitrine'],
  },
  {
    id: 'superman', nom: 'Superman', duree: '3 × 12', cible: 'Dos · lombaires',
    mots: ['superman', 'extension dos', 'lombaire'],
    Anim: AnimSuperman,
    etapes: ['À plat ventre, bras tendus devant toi', 'Soulève en même temps les bras, la poitrine et les jambes', 'Tiens deux secondes en respirant', 'Redescends lentement, sans relâcher d\'un coup'],
    erreurs: ['Casser la nuque en levant le menton, garde le regard au sol', 'Monter trop haut : quelques centimètres suffisent'],
  },
  {
    id: 'dips', nom: 'Dips sur chaise', duree: '3 × 8', cible: 'Triceps · épaules',
    mots: ['dips', 'dip', 'triceps chaise'],
    Anim: AnimDips,
    etapes: ['Assieds-toi au bord d\'une chaise stable, mains de chaque côté des hanches', 'Avance le bassin dans le vide, jambes fléchies', 'Plie les coudes vers l\'arrière et descends', 'Remonte en poussant sur les paumes'],
    erreurs: ['Écarter les coudes sur les côtés', 'S\'éloigner trop de la chaise, ce qui tire sur les épaules'],
  },
  {
    id: 'mountainclimber', nom: 'Mountain climbers', duree: '3 × 20 s', cible: 'Cardio · centre',
    mots: ['mountain climber', 'grimpeur'],
    Anim: AnimMountainClimber,
    etapes: ['Position de planche, mains sous les épaules', 'Ramène un genou vers la poitrine, repose, alterne', 'Accélère seulement si le dos reste plat'],
    erreurs: ['Les hanches qui remontent en pyramide', 'Taper les pieds au sol au lieu de les poser'],
  },
  {
    id: 'jumpingjack', nom: 'Jumping jacks', duree: '3 × 30 s', cible: 'Cardio · corps entier',
    mots: ['jumping jack', 'saut étoile'],
    Anim: AnimJumpingJack,
    etapes: ['Debout, pieds joints, bras le long du corps', 'Saute en écartant pieds et bras au-dessus de la tête', 'Reviens en sautant, atterris genoux souples'],
    erreurs: ['Atterrir jambes raides', 'Retenir sa respiration'],
  },
  {
    id: 'crunch', nom: 'Crunch', duree: '3 × 12', cible: 'Abdominaux',
    mots: ['crunch', 'abdos', 'abdominaux'],
    Anim: AnimCrunch,
    etapes: ['Allongé, genoux pliés, pieds au sol', 'Mains derrière la tête sans tirer sur la nuque', 'Décolle les épaules en soufflant, redescends lentement'],
    erreurs: ['Tirer sur la nuque avec les mains', 'Monter trop haut : seules les épaules décollent'],
  },
  {
    id: 'russiantwist', nom: 'Torsions russes', duree: '3 × 16', cible: 'Obliques',
    mots: ['torsion russe', 'russian twist', 'obliques'],
    Anim: AnimRussianTwist,
    etapes: ['Assis, buste incliné en arrière, pieds au sol', 'Mains jointes, tourne le buste d\'un côté puis de l\'autre', 'Le regard suit les mains'],
    erreurs: ['Bouger seulement les bras sans tourner le buste', 'Arrondir complètement le dos'],
  },
  {
    id: 'birddog', nom: 'Bird-dog', duree: '3 × 8 / côté', cible: 'Dos · équilibre',
    mots: ['bird dog', 'bird-dog', 'quadrupède'],
    Anim: AnimBirdDog,
    etapes: ['À quatre pattes, dos plat', 'Tends le bras droit et la jambe gauche en même temps', 'Deux secondes de tenue, reviens, change de côté'],
    erreurs: ['Cambrer en levant la jambe trop haut', 'Tourner les hanches au lieu de rester carré'],
  },
  {
    id: 'donkeykick', nom: 'Coup de pied d\'âne', duree: '3 × 12 / jambe', cible: 'Fessiers',
    mots: ['donkey kick', 'coup de pied'],
    Anim: AnimDonkeyKick,
    etapes: ['À quatre pattes, genou plié à 90°', 'Pousse le talon vers le plafond, jambe pliée', 'Redescends sans poser le genou, recommence'],
    erreurs: ['Cambrer le bas du dos pour monter plus haut', 'Balancer la jambe au lieu de pousser'],
  },
  {
    id: 'mollets', nom: 'Élévations mollets', duree: '3 × 15', cible: 'Mollets',
    mots: ['mollet', 'calf raise', 'pointe de pied'],
    Anim: AnimMollets,
    etapes: ['Debout, pieds largeur de hanches, près d\'un mur pour l\'équilibre', 'Monte sur la pointe des pieds, deux secondes en haut', 'Redescends lentement, sans poser les talons brutalement'],
    erreurs: ['Rebondir au lieu de contrôler la descente', 'Chevilles qui partent vers l\'extérieur'],
  },
  {
    id: 'stepup', nom: 'Montées sur chaise', duree: '3 × 8 / jambe', cible: 'Jambes · fessiers',
    mots: ['step up', 'montée', 'marche'],
    Anim: AnimStepUp,
    etapes: ['Face à une chaise stable ou une marche', 'Pose le pied entier, pousse dans le talon pour monter', 'Redescends en contrôlant, même jambe, puis change'],
    erreurs: ['Prendre l\'élan avec la jambe du bas', 'Une chaise instable : vérifie avant de monter'],
  },
  {
    id: 'genouxhauts', nom: 'Montées de genoux', duree: '3 × 20 s', cible: 'Cardio',
    mots: ['montée de genoux', 'high knees', 'genoux hauts'],
    Anim: AnimGenouxHauts,
    etapes: ['Cours sur place en montant les genoux à hauteur de hanches', 'Reste sur l\'avant du pied, bras qui accompagnent', 'Le buste droit, sans se pencher en arrière'],
    erreurs: ['Se pencher en arrière pour monter les genoux', 'Atterrir sur les talons'],
  },
  {
    id: 'squatsaute', nom: 'Squats sautés', duree: '3 × 8', cible: 'Jambes · explosivité',
    mots: ['squat sauté', 'jump squat'],
    Anim: AnimSquatSaute,
    etapes: ['Descends en squat complet', 'Explose vers le haut, bras vers le ciel', 'Atterris genoux souples et enchaîne directement'],
    erreurs: ['Atterrir jambes tendues : ça cogne les genoux', 'Réduire la descente pour sauter plus vite'],
  },
  {
    id: 'fentelaterale', nom: 'Fentes latérales', duree: '3 × 8 / côté', cible: 'Jambes · adducteurs',
    mots: ['fente latérale', 'fente côté'],
    Anim: AnimFenteLaterale,
    etapes: ['Grand pas sur le côté, l\'autre jambe reste tendue', 'Descends en poussant les hanches en arrière', 'Reviens au centre en poussant sur le talon'],
    erreurs: ['Le genou qui dépasse loin devant la pointe de pied', 'Le buste qui s\'effondre vers l\'avant'],
  },
  {
    id: 'planchelateral', nom: 'Planche latérale', duree: '3 × 20 s / côté', cible: 'Obliques · centre',
    mots: ['planche latérale', 'side plank', 'gainage latéral'],
    Anim: AnimPlancheLaterale,
    etapes: ['Sur le côté, coude sous l\'épaule', 'Décolle les hanches : le corps forme une ligne droite', 'Respire, tiens, puis change de côté'],
    erreurs: ['Les hanches qui s\'affaissent vers le sol', 'L\'épaule qui remonte vers l\'oreille'],
  },
  {
    id: 'legraise', nom: 'Relevés de jambes', duree: '3 × 10', cible: 'Bas des abdominaux',
    mots: ['relevé de jambes', 'leg raise'],
    Anim: AnimLegRaise,
    etapes: ['Allongé, mains sous le bas du dos', 'Monte les jambes tendues à la verticale', 'Redescends LENTEMENT sans poser les talons'],
    erreurs: ['Le bas du dos qui décolle en cambrant', 'Laisser tomber les jambes au lieu de freiner'],
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
  // position:fixed serait piégé et invisible, bug « rien ne se passe »
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

        <button onClick={onClose} aria-label="Fermer le guide" style={{
          position: 'sticky', top: 0, float: 'right', zIndex: 5,
          width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
          background: 'rgba(255,246,238,0.92)', border: '1px solid rgba(200,123,82,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(200,123,82,0.15)', marginLeft: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {!exo && (
          <>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: ENCRE, marginBottom: 4 }}>
              Guide des exercices
            </div>
            <div style={{ fontSize: 12, color: ENCRE, marginBottom: 16, lineHeight: 1.5 }}>
              Chaque geste montré et expliqué. Doucement, régulièrement, jamais dans la douleur.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {EXOS.map(e => (
                <button key={e.id} onClick={() => setActif(e.id)} style={{
                  background: 'rgba(255,235,210,0.45)', border: '1px solid rgba(255,220,160,0.40)',
                  borderRadius: 16, padding: '10px 12px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: F,
                }}>
                  <PhotoExo exo={e} height={130} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: ENCRE, marginTop: 2 }}>{e.nom}</div>
                  <div style={{ fontSize: 10.5, color: ENCRE }}>{e.cible} · {e.duree}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {exo && (
          <>
            <button onClick={() => setActif(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: F,
              fontSize: 12, fontWeight: 600, color: ENCRE, padding: '2px 0 10px',
            }}>← Tous les exercices</button>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 26, fontWeight: 500, color: ENCRE }}>{exo.nom}</div>
            <div style={{ fontSize: 11.5, color: ENCRE, marginBottom: 10 }}>{exo.cible} · {exo.duree}</div>
            <PhotoExo exo={exo} height={190} radius={18} fallback="rien" />
            <div style={{
              // 120 et non 190 : depuis que la photo montre la position, ce bloc
              // ne sert plus qu'à décomposer le geste. À 190 il repoussait
              // « Comment faire » sous la ligne de flottaison.
              height: 120, background: 'rgba(255,235,210,0.40)', border: '1px solid rgba(255,220,160,0.40)',
              borderRadius: 18, marginBottom: 14, padding: 10,
            }}>
              <exo.Anim />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ENCRE, marginBottom: 8 }}>Comment faire</div>
            {exo.etapes.map((et, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(200,123,82,0.14)', border: '1px solid rgba(200,123,82,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10.5, fontWeight: 700, color: ENCRE,
                }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: ENCRE, lineHeight: 1.55 }}>{et}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ENCRE, margin: '14px 0 8px' }}>À éviter</div>
            {exo.erreurs.map((er, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8442E" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span style={{ fontSize: 12.5, color: ENCRE, lineHeight: 1.5 }}>{er}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: ENCRE, marginTop: 14, lineHeight: 1.5 }}>
              Écoute ton corps : une douleur (autre que l'effort) = on arrête. En cas de condition médicale, demande l'avis d'un professionnel de santé.
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
