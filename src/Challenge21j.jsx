import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { erreurServeur } from './erreurs'
import CatalogueProgrammes from './CatalogueProgrammes'
import { programmeParId, FAMILLES } from './programmes'
import { syncProfilSupabase } from './profilSync'
import { enregistrerSeance, lireSeances, seancesDuJour } from './seances'
import { reposerRappels, demanderAutorisation } from './notificationsProgramme'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TargetIcon, SparkleIcon, StarIcon } from './Icons'
import { authHeaders } from './supabase'
import { matchExercice, PHOTOS_EXOS } from './ExercicesGuide'
import { AMBRE, ENCRE, ICONE, ROUGE, VERT } from './palette'

const ExercicesGuide = lazy(() => import('./ExercicesGuide'))
const SeanceActive = lazy(() => import('./SeanceActive'))
const CourseActive = lazy(() => import('./CourseActive'))

const API = import.meta.env.VITE_API_URL || ''

// ─── Ligne d'exercice d'une séance du programme (photo + reps + fiche) ───────
// Les photos viennent de PHOTOS_EXOS (choisies à la main dans ExercicesGuide).
// Avant, chaque ligne appelait /api/image : le front tape Render, dont la route
// du même nom est écrite pour la page Style et renvoyait la même photo de mode
// pour tous les exercices (corrigé 2026-08-11).
const EXO_INFOS = {
  squat:     { nom: 'Squat' },
  gainage:   { nom: 'Gainage' },
  fente:     { nom: 'Fentes' },
  pont:      { nom: 'Pont fessier' },
  chaise:    { nom: 'Chaise au mur' },
  chatvache: { nom: 'Chat-vache' },
  marche:    { nom: 'Marche active' },
  etirement: { nom: 'Étirements' },
  pompe:       { nom: 'Pompes' },
  pompegenoux: { nom: 'Pompes sur genoux' },
  superman:    { nom: 'Superman' },
  dips:        { nom: 'Dips sur chaise' },
  mountainclimber: { nom: 'Mountain climbers' },
  jumpingjack:     { nom: 'Jumping jacks' },
  crunch:          { nom: 'Crunch' },
  russiantwist:    { nom: 'Torsions russes' },
  birddog:         { nom: 'Bird-dog' },
  donkeykick:      { nom: "Coup de pied d'âne" },
  mollets:         { nom: 'Élévations mollets' },
  stepup:          { nom: 'Montées sur chaise' },
  genouxhauts:     { nom: 'Montées de genoux' },
  squatsaute:      { nom: 'Squats sautés' },
  fentelaterale:   { nom: 'Fentes latérales' },
  planchelateral:  { nom: 'Planche latérale' },
  legraise:        { nom: 'Relevés de jambes' },
}

function SeanceRow({ item, onFiche, fait = false, onToggle, index = 0 }) {
  const info = EXO_INFOS[item.exo] || { nom: item.exo }
  const photo = PHOTOS_EXOS[item.exo] || null
  const [img, setImg] = useState(photo?.url || null)
  return (
    <motion.button
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26, delay: index * 0.08 }}
      onClick={onFiche} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      background: fait ? 'rgba(var(--rgb-or), 0.16)' : 'rgba(var(--rgb-verre), 0.30)',
      border: fait ? '1px solid rgba(var(--rgb-or), 0.45)' : '1px solid rgba(var(--rgb-creme-dore), 0.35)',
      borderRadius: 14, padding: '8px 10px', marginBottom: 8, cursor: 'pointer',
      fontFamily: "'Poppins', sans-serif", textAlign: 'left',
      transition: 'background 0.25s, border-color 0.25s',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(var(--rgb-photo), 0.70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {img
          ? <img src={img} alt={info.nom} loading="lazy" onError={() => setImg(null)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', objectPosition: `center ${photo?.pos || '50%'}` }} />
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.6" strokeLinecap="round"><path d="M14.4 14.4 9.6 9.6M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829zM5.343 2.515a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829L6.404 12.77a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829z"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: ENCRE }}>{info.nom}</div>
        <div style={{ fontSize: 11.5, color: ENCRE }}>{item.reps}</div>
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: AMBRE, background: 'rgba(var(--rgb-verre), 0.55)', border: '1px solid rgba(var(--rgb-creme-dore), 0.45)', borderRadius: 99, padding: '4px 10px', flexShrink: 0 }}>
        Voir le geste
      </span>
      {onToggle && (
        <span
          role="button"
          aria-label={fait ? 'Fait' : 'Marquer cet exercice'}
          onClick={e => { e.stopPropagation(); onToggle() }}
          style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            background: fait ? 'rgba(var(--rgb-terracotta), 0.90)' : 'rgba(var(--rgb-bulle), 0.70)',
            border: fait ? '1.5px solid rgba(var(--rgb-terracotta), 0.90)' : '1.5px solid rgba(var(--rgb-terracotta), 0.40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={fait ? '#fff' : 'rgba(var(--rgb-terracotta), 0.45)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </motion.button>
  )
}

/**
 * @param {string} famille  la vue dans laquelle ce composant est monte :
 *                          'sport', 'routine' ou 'nutrition'. Il ne montre le
 *                          programme en cours que s'il appartient a cette
 *                          famille, et propose sinon le catalogue de la
 *                          famille demandee.
 */
export default function Challenge21j({ userId, isPro, onPasserPro, profil, famille = 'sport', onMarcher }) {
  // Affichage immediat depuis le cache : chaque ouverture de l'onglet
  // repassait par Render, reveil compris, et la page restait vide plusieurs
  // secondes (constat Jean 2026-08-12). Le cache rend l'ecran instantane, le
  // reseau le rafraichit derriere.
  const [challenge, setChallenge] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('solenn_challenge_cache') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  // Coches d'exercices du jour. Locales a l'appareil et remises a zero chaque
  // jour : c'est un rituel d'entrainement, pas une donnee de sante.
  const cleExos = 'solenn_exos_' + new Date().toDateString()
  const [exosFaits, setExosFaits] = useState(() => {
    try { return JSON.parse(localStorage.getItem(cleExos) || '{}') } catch { return {} }
  })
  const [showBravo, setShowBravo] = useState(false)

  // Regenerer, c'est repartir vers un cap, peut-etre un autre : la modale
  // demande le nouvel objectif au lieu de supposer que l'ancien tient
  // toujours (demande Jean 2026-08-13). Les six objectifs de l'inscription.
  const OBJECTIFS = [
    'Retrouver mon énergie', 'Me réconcilier avec mon corps',
    'Dormir enfin comme il faut', 'Retrouver ma sérénité',
    'Reprendre le mouvement', 'Manger sans culpabiliser',
  ]
  const [objChoisi, setObjChoisi] = useState('')

  async function changerObjectif(obj) {
    try {
      const pLocal = JSON.parse(localStorage.getItem('vitacoach_profil') || '{}')
      const maj = { ...pLocal, objectif: obj, objectifs: [obj] }
      localStorage.setItem('vitacoach_profil', JSON.stringify(maj))
      // La base d'abord : le generateur serveur y lit l'objectif. L'upsert
      // brut etait avale par le `catch {}` ci-dessous : un refus de la base
      // passait inapercu, et le generateur relisait l'ancien objectif sans
      // que personne ne comprenne pourquoi. Meme fonction que partout
      // ailleurs, qui journalise l'echec et retente une fois.
      await syncProfilSupabase(userId, maj)
    } catch {}
  }
  const bravoLance = useRef(false)

  function toggleExo(i) {
    setExosFaits(prev => {
      const p = { ...prev, [i]: !prev[i] }
      try {
        localStorage.setItem(cleExos, JSON.stringify(p))
        if (navigator.vibrate) navigator.vibrate(p[i] ? 45 : 20)
      } catch {}
      return p
    })
  }

  // La generation prend 10 a 20 secondes, Groq plus le reveil de Render : on
  // ne peut pas la rendre instantanee, mais une attente qui raconte ce qu'elle
  // fait parait deux fois plus courte qu'un libelle fige (2026-08-13).
  const ETAPES_CREATION = [
    'Je lis ton profil et ton objectif…',
    'Je regarde tes données de la semaine…',
    'Je construis tes jours, séances et nutrition…',
    "Je vérifie l'équilibre et la progression…",
    'Dernières retouches…',
  ]
  const [etapeCreation, setEtapeCreation] = useState(0)
  useEffect(() => {
    if (!creating) { setEtapeCreation(0); return }
    const t = setInterval(() => setEtapeCreation(i => Math.min(i + 1, ETAPES_CREATION.length - 1)), 3500)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating])
  const [exoGuide, setExoGuide] = useState(null)
  const [seanceOuverte, setSeanceOuverte] = useState(false)
  const [pourquoiOuvert, setPourquoiOuvert] = useState(false)
  const [courseOuverte, setCourseOuverte] = useState(false)
  // Les seances deja faites aujourd'hui, pour que la carte de course sache
  // dire « deja fait » au lieu de reproposer benoitement la meme chose.
  const [faitesAujourdhui, setFaitesAujourdhui] = useState(
    () => seancesDuJour(lireSeances(profil)),
  )

  const fetchChallenge = async () => {
    try {
      // Pas de squelette si le cache affiche deja quelque chose : le reseau
      // rafraichit en silence.
      if (!challenge) setLoading(true)
      setError(null)
      const res = await fetch(`${API}/api/challenge?userId=${userId}`, { headers: await authHeaders() })
      if (!res.ok) throw await erreurServeur(res, "Ton programme n'a pas pu être chargé. Réessaie dans un instant.")
      const data = await res.json()
      setChallenge(data.challenge || null)
      try { sessionStorage.setItem('solenn_challenge_cache', JSON.stringify(data.challenge || null)) } catch {}
      // Chaque ouverture fait AVANCER la fenetre glissante des rappels. iOS
      // n'en garde que 64 en attente : on ne peut pas poser un programme de
      // 42 jours d'un coup, il faut revenir en poser la suite. Sans appel
      // ici, les rappels s'arreteraient au bout de dix jours.
      reposerRappels(data.challenge || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleCreerChallenge = async (type = 'defi21', reglages = {}) => {
    try {
      setCreating(true)
      setError(null)
      // La duree n'est plus envoyee : elle appartient au catalogue, et elle
      // change d'un programme a l'autre. La figer a 21 ici tronquerait la
      // remise en mouvement, qui en dure 42.
      const res = await fetch(`${API}/api/challenge-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          userId, type,
          duree: reglages.duree || null,
          intensite: reglages.intensite || null,
        }),
      })
      if (!res.ok) {
        // Le serveur explique POURQUOI, et en francais : « La generation du
        // programme "X" n'a pas abouti. Reessaie dans un instant. » Le client
        // jetait ce message pour afficher son propre « Erreur lors de la
        // creation », qui ne dit rien et ne suggere rien. Constat sur une
        // capture de Jean, onglet Nutrition, le 2 septembre.
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.error || "La création n'a pas abouti. Réessaie dans un instant.")
      }
      // L'autorisation est demandee ICI et pas au demarrage de l'app : on la
      // demande au moment ou elle a un sens, juste apres s'etre engage sur un
      // programme. Demandee a froid au premier lancement, elle est refusee, et
      // iOS ne repropose jamais la fenetre.
      await demanderAutorisation()
      await fetchChallenge()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleMarquerFait = async (jourIndex) => {
    try {
      const res = await fetch(`${API}/api/challenge-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId, jour: jourIndex, complete: true }),
      })
      if (!res.ok) throw await erreurServeur(res, "Ce jour n'a pas pu être validé. Réessaie dans un instant.")
      await fetchChallenge()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleNouveauChallenge = () => {
    setObjChoisi(profil?.objectifs?.[0] || profil?.objectif || '')
    setConfirmReset(true)
  }

  // ── Calcul des données ──────────────────────────────────────────
  // La duree n'est plus 21. Le catalogue en propose de 21, 28 et 42 jours, et
  // les quinze « 21 » ecrits en dur dans ce fichier auraient plafonne la
  // remise en mouvement au jour 21 pour toujours : jour fige, barre bloquee a
  // la moitie, grille tronquee, et programme declare fini a mi-parcours.
  // On la lit dans le plan lui-meme, la ou elle est vraie.
  let jourActuel = 1
  let duree = challenge?.challenge?.jours?.length || challenge?.duree || 21
  let progression = Array(duree).fill(false)
  let jours = []
  let milestones = []

  if (challenge) {
    jours = challenge.challenge?.jours || []
    milestones = challenge.challenge?.milestones || []
    duree = jours.length || challenge.duree || 21

    const dateDebut = new Date(challenge.date_debut)
    const now = new Date()
    const diffMs = now - dateDebut
    const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    jourActuel = Math.min(Math.max(diffJours + 1, 1), duree)

    progression = challenge.progression || Array(duree).fill(false)
  }

  // L'objectif du profil peut avoir changé DEPUIS la création du programme :
  // le programme est fige en base, il ne suit pas. On compare l'objectif
  // actuel a celui grave dans le programme a sa creation (objectif_source,
  // pose par le serveur) et on propose la regeneration, jamais automatique,
  // elle detruirait la progression sans prevenir (2026-08-12).
  const objectifActuel    = profil?.objectifs?.[0] || profil?.objectif || ''
  const objectifProgramme = challenge?.challenge?.objectif_source || ''
  const objectifChange    = !!(challenge && objectifActuel && objectifProgramme && objectifActuel !== objectifProgramme)

  // ── GESTION DES JOURS MANQUÉS ─────────────────────────────────────────────
  // Un vrai coach remarque l'absence. La page affichait le jour 8 comme si de
  // rien n'était après trois jours sautés : aucune reconnaissance, aucune
  // reprise (constat Jean 2026-08-13). À partir de DEUX jours manqués, un
  // bandeau propose de reprendre là où on s'était arrêté, en décalant la date
  // de début du programme, ou d'assumer le trou et de continuer. Un seul jour
  // manqué ne déclenche rien : c'est la vie, pas une rechute.
  const joursManques = progression.slice(0, Math.max(jourActuel - 1, 0)).filter(x => !x).length
  const cleReprise = challenge ? `solenn_reprise_${challenge.id}_${jourActuel}` : ''
  const [repriseVue, setRepriseVue] = useState(() => {
    try { return cleReprise ? !!localStorage.getItem(cleReprise) : false } catch { return false }
  })
  const proposerReprise = joursManques >= 2 && !progression[jourActuel - 1] && !repriseVue && !(challenge && (Math.floor((Date.now() - new Date(challenge.date_debut)) / 86400000) + 1) > duree)

  function ignorerReprise() {
    try { localStorage.setItem(cleReprise, '1') } catch {}
    setRepriseVue(true)
  }

  async function reprendreOuOnEnEtait() {
    // Le prochain jour à faire est celui qui suit le dernier jour validé.
    const dernierFait = progression.lastIndexOf(true)
    const jourCible = dernierFait + 2   // -1 => jour 1
    const nouveauDebut = new Date(Date.now() - (jourCible - 1) * 86400000).toISOString().split('T')[0]
    try {
      const m = await import('./supabase')
      await m.supabase.from('challenges')
        .update({ date_debut: nouveauDebut })
        .eq('id', challenge.id)
    } catch {}
    const maj = { ...challenge, date_debut: nouveauDebut }
    setChallenge(maj)
    try { sessionStorage.setItem('solenn_challenge_cache', JSON.stringify(maj)) } catch {}
    ignorerReprise()
  }

  const jourActuelData = jours[jourActuel - 1] || null

  // Le dernier exercice coché VALIDE le jour, sans bouton : le geste de
  // terminer la séance est déjà la déclaration d'avoir fini. Un bandeau
  // « Objectif du jour terminé, bravo ! » célèbre, puis s'efface
  // (demande Jean 2026-08-13). Le garde-fou bravoLance évite la double
  // validation si l'utilisateur décoche puis recoche.
  useEffect(() => {
    const h = () => handleNouveauChallenge()
    window.addEventListener('solenn:nouveau-programme', h)
    return () => window.removeEventListener('solenn:nouveau-programme', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profil])

  useEffect(() => {
    const seance = jours[jourActuel - 1]?.seance
    if (!seance?.length || progression[jourActuel - 1] || bravoLance.current) return
    const tousFaits = seance.every((_, i) => exosFaits[i])
    if (!tousFaits) return
    bravoLance.current = true
    if (navigator.vibrate) navigator.vibrate([60, 50, 90])
    setShowBravo(true)
    handleMarquerFait(jourActuel - 1)
    setTimeout(() => setShowBravo(false), 3200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exosFaits])
  // Le jour en cours est le seul affiche, et les premiers jours sont
  // volontairement legers pour ne pas cramer un debutant. Resultat : la
  // personne qui decouvre son programme voit le jour le plus pauvre des 21 et
  // juge sur celui-la. On lui montre donc ce qui arrive demain (2026-08-12).
  const jourSuivantData = jours[jourActuel] || null
  const jourActuelComplete = progression[jourActuel - 1] || false

  // Fin de programme : jours ecoules NON bornes a 21, sinon un programme
  // depasse depuis une semaine s'affiche encore comme un jour 21 ordinaire.
  const joursEcoules = challenge ? Math.floor((Date.now() - new Date(challenge.date_debut)) / 86400000) + 1 : 0
  const programmeTermine = !!challenge && (joursEcoules > duree || (jourActuel === duree && jourActuelComplete))
  const numCycle = challenge?.challenge?.cycle || 1

  const prochainsJoursMilestone = milestones
    .filter((m) => m.jour > jourActuel)
    .sort((a, b) => a.jour - b.jour)
  const prochainMilestone = prochainsJoursMilestone[0] || null


  // ── STYLES ────────────────────────────────────────────────────────
  const styles = {
    container: {
      fontFamily: "'Poppins', sans-serif",
      color: ENCRE,
      padding: '24px',
      maxWidth: '700px',
      margin: '0 auto',
    },
    card: {
      background: 'rgba(var(--rgb-verre), 0.22)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      borderRadius: '20px',
      padding: '28px',
      border: '1px solid rgba(var(--rgb-creme-dore), 0.28)',
      boxShadow: '0 4px 24px rgba(var(--rgb-terracotta), 0.10)',
    },
  }

  // ── 1. LOADING ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.container}>
        <div
          style={{
            background: 'rgba(var(--rgb-terracotta), 0.06)',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {[120, 80, 200].map((width, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              style={{
                height: i === 2 ? '80px' : '20px',
                width: `${width}px`,
                background: 'rgba(var(--rgb-terracotta), 0.18)',
                borderRadius: '12px',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── 2. PAS DE CHALLENGE (tout le monde peut créer le premier) ───
  // L'ecran vide n'est plus un bouton. Il demandait « Pret a commencer ? »
  // sans jamais dire a quoi, et fabriquait 21 jours dont personne ne
  // connaissait le contenu avant de les recevoir. Il montre desormais les
  // quatre programmes, ce que chacun vise, pour qui il est fait et ce qu'on
  // peut en attendre : le choix precede la generation au lieu de la subir.
  // A quelle famille appartient le programme en cours ? Les programmes crees
  // avant le catalogue n'ont pas de type : ce sont des defis 21 jours, donc du
  // sport. Sans ce repli, ils disparaitraient de tous les onglets a la fois.
  const progCourant = programmeParId(challenge?.challenge?.type)
  const familleEnCours = progCourant?.famille || 'sport'
  const ailleurs = !!challenge && familleEnCours !== famille

  if (!challenge || ailleurs) {
    const enCours = challenge ? programmeParId(challenge.challenge?.type) : null
    return (
      <div style={styles.container}>
        {/* Un seul programme peut tourner a la fois. Le dire ICI, avant le
            choix, et non apres : quelqu'un qui decouvre en validant que son
            programme alimentaire vient d'etre remplace par du sport ne le
            pardonne pas. */}
        {ailleurs && (
          <div style={{
            background: 'rgba(var(--rgb-verre), 0.32)', border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 18, padding: '14px 16px', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ENCRE, marginBottom: 4 }}>
              Tu suis déjà « {enCours?.titre || challenge.challenge?.titre} »
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: ENCRE }}>
              Il est dans l'onglet {FAMILLES[familleEnCours]?.onglet || 'Sport'}.
              Tu ne peux suivre qu'un programme à la fois : en commencer un ici
              remplacera celui-là, et sa progression sera perdue.
            </div>
          </div>
        )}
        {/* L'avertissement suit l'utilisateur jusqu'a la fiche.
            Il n'existait que sur CETTE liste. On touchait une carte pour en
            savoir plus, on arrivait sur une page qui donne envie, et le bouton
            du bas effacait le programme en cours sans plus rien rappeler.
            Quelqu'un au jour 14 avait bien lu l'avertissement, deux ecrans
            plus tot, avant de savoir qu'il allait cliquer. La phrase doit
            etre la ou se prend la decision. */}
        <CatalogueProgrammes
          profil={profil}
          famille={famille}
          // « Choisis ton programme » est un imperatif, place juste sous
          // « en commencer un ici remplacera celui-la ». L'app ordonnait ce
          // qu'elle venait de deconseiller. Descriptif quand un programme
          // tourne, imperatif seulement quand il n'y en a aucun.
          titre={ailleurs ? 'Les autres programmes' : null}
          remplacement={ailleurs}
          avertissement={ailleurs
            ? `« ${enCours?.titre || challenge.challenge?.titre} » est en cours dans l'onglet ${FAMILLES[familleEnCours]?.onglet || 'Sport'}. Le commencer ici le remplacera, et sa progression sera perdue.`
            : null}
          creating={creating}
          creatingLabel={ETAPES_CREATION[etapeCreation]}
          error={error}
          onCommencer={(prog, reglages) => handleCreerChallenge(prog.id, reglages)}
        />
      </div>
    )
  }

  // ── 4. CHALLENGE PRINCIPAL ───────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* POURQUOI on s'entraine, l'objectif du profil, en tete. La page
          montrait un plan sans jamais dire ce qu'il vise : on ne s'entraine
          pas pour cocher des cases (constat Jean 2026-08-12). */}
      {!objectifChange && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: '10px 14px', borderRadius: 14,
          background: 'rgba(var(--rgb-bulle), 0.55)', border: '1px solid rgba(var(--rgb-terracotta), 0.20)',
          fontFamily: "'Poppins', sans-serif",
        }}>
          <TargetIcon size={15} color={ICONE} />
          <div style={{ fontSize: 12.5, color: ENCRE, lineHeight: 1.4 }}>
            {(objectifProgramme || objectifActuel)
              ? <><span style={{ fontWeight: 700 }}>Ton cap :</span> {objectifProgramme || objectifActuel}</>
              : <>Aucun objectif dans ton profil : définis-le dans Réglages, ton programme suivra ce cap.</>}
          </div>
        </div>
      )}

      {/* POURQUOI ce programme, et ce qu'il promet, pendant qu'il tourne.
          Ces textes n'existaient qu'AVANT le choix, sur la fiche du catalogue.
          Or c'est en semaine deux qu'on se demande a quoi bon, pas le premier
          jour : les laisser hors de portee une fois le programme lance, c'est
          les mettre au seul moment ou personne n'en a besoin.
          Replie par defaut, parce qu'on ne relit pas ca tous les jours. */}
      {progCourant && (
        <div style={{
          background: 'rgba(var(--rgb-bulle), 0.55)', border: '1px solid rgba(var(--rgb-terracotta), 0.20)',
          borderRadius: 14, padding: '10px 14px', marginBottom: 12,
          fontFamily: "'Poppins', sans-serif",
        }}>
          <button
            onClick={() => setPourquoiOuvert(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              width: '100%', textAlign: 'left', fontFamily: "'Poppins', sans-serif",
              fontSize: 12.5, fontWeight: 700, color: ENCRE,
            }}
          >
            {pourquoiOuvert ? 'Masquer' : 'Pourquoi ce programme, et ce qu\'il t\'apporte'}
          </button>

          {pourquoiOuvert && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: ENCRE }}>
                {progCourant.pourquoi}
              </div>

              <div style={{
                fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: AMBRE, margin: '14px 0 7px',
              }}>
                Ce que tu peux en attendre
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {progCourant.resultats.map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                    <span aria-hidden="true" style={{
                      width: 4, height: 4, borderRadius: 999, background: ICONE,
                      marginTop: 7, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12.5, lineHeight: 1.5, color: ENCRE }}>{r}</span>
                  </li>
                ))}
              </ul>

              {challenge?.challenge?.intensite && (
                <div style={{ fontSize: 11.5, color: ENCRE, opacity: 0.8, marginTop: 10 }}>
                  Intensité choisie : {challenge.challenge.intensite}.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {objectifChange && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(var(--rgb-or), 0.14), rgba(var(--rgb-terracotta), 0.07))',
          border: '1px solid rgba(var(--rgb-or), 0.35)', borderRadius: 16,
          padding: '13px 15px', marginBottom: 14, fontFamily: "'Poppins', sans-serif",
        }}>
          <div style={{ fontSize: 12.5, color: ENCRE, lineHeight: 1.5, fontWeight: 500 }}>
            Ton objectif est maintenant « {objectifActuel} », mais ce programme
            visait « {objectifProgramme} ».
          </div>
          <button
            onClick={handleNouveauChallenge}
            style={{
              marginTop: 9, padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(var(--rgb-verre), 0.45)', border: '1px solid rgba(var(--rgb-creme-dore), 0.55)',
              color: AMBRE, fontSize: 12, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
            }}>
            Régénérer pour mon nouvel objectif
          </button>
        </div>
      )}
      {proposerReprise && (
        <div style={{
          background: 'rgba(var(--rgb-bulle), 0.70)', border: '1px solid rgba(var(--rgb-terracotta), 0.28)',
          borderRadius: 16, padding: '14px 16px', marginBottom: 14,
          fontFamily: "'Poppins', sans-serif",
        }}>
          <div style={{ fontSize: 13, color: ENCRE, fontWeight: 600, lineHeight: 1.5 }}>
            {joursManques} jours ont sauté, ça arrive.
          </div>
          <div style={{ fontSize: 12, color: ENCRE, lineHeight: 1.5, marginTop: 3 }}>
            On reprend là où tu t'étais arrêté, ou on continue au jour {jourActuel} ?
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
            <button onClick={reprendreOuOnEnEtait} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(var(--rgb-verre), 0.45)', border: '1px solid rgba(var(--rgb-creme-dore), 0.60)',
              color: AMBRE, fontSize: 12, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
            }}>
              Reprendre au jour {progression.lastIndexOf(true) + 2}
            </button>
            <button onClick={ignorerReprise} style={{
              flex: 0.8, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(var(--rgb-terracotta), 0.28)',
              color: ENCRE, fontSize: 12, fontWeight: 600, fontFamily: "'Poppins', sans-serif",
            }}>
              Continuer au jour {jourActuel}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        <motion.div
          key="challenge-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* ── LE VOILE D'ATTENTE DE REPONSE ──
              Tant que « on reprend au jour X ou on continue au jour Y ? »
              n'a pas de reponse, tout ce qui suit est inerte et grise.

              Avant, la seance du jour le plus avance s'affichait deja sous la
              question, depliee, avec son titre et ses exercices : la decision
              avait l'air prise et le choix decoratif. Grise plutot que cache,
              car voir ce qui est en jeu aide a choisir.

              Ce voile est un div ORDINAIRE, pas le motion.div ci-dessus.
              Premiere version : j'avais pose `inert` et l'opacite sur
              l'element anime lui-meme. AnimatePresence se sert d'`inert`
              pour ses propres sorties : l'animation d'entree n'a jamais
              demarre, le bloc est reste a son opacite `initial`, zero, et le
              contenu du jour a disparu en production. Les deux roles doivent
              rester separes.

              `inert` et non `aria-hidden` : pointerEvents:none arrete la
              souris mais laisse les boutons atteignables au clavier. */}
          <div
            inert={proposerReprise || undefined}
            style={{
              display: 'flex', flexDirection: 'column', gap: '20px',
              opacity: proposerReprise ? 0.32 : 1,
              filter: proposerReprise ? 'saturate(0.45)' : 'none',
              pointerEvents: proposerReprise ? 'none' : 'auto',
              userSelect: proposerReprise ? 'none' : 'auto',
              transition: 'opacity .3s ease, filter .3s ease',
            }}
          >
          {/* ── PROGRAMME TERMINÉ, le jour 21 ouvrait sur RIEN : bravo, puis
               le vide, au moment exact où l'abonné décide de rester ou partir.
               La fin propose le cycle suivant (chantier A, Jean 2026-08-13). */}
          {programmeTermine && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(var(--rgb-verre), 0.30)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '22px', padding: '26px 28px',
                border: '1.5px solid rgba(var(--rgb-or), 0.45)',
                boxShadow: '0 8px 36px rgba(var(--rgb-terracotta), 0.18)',
                textAlign: 'center', fontFamily: "'Poppins', sans-serif",
              }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <StarIcon size={30} color="var(--ambre-fonce)" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: ENCRE, marginBottom: 6 }}>
                {numCycle > 1 ? `Cycle ${numCycle} terminé` : 'Programme terminé'}
              </div>
              <div style={{ fontSize: 13, color: ENCRE, lineHeight: 1.55, marginBottom: 16 }}>
                {progression.filter(Boolean).length} jours validés sur {duree}.
                {progression.filter(Boolean).length >= Math.round(duree * 0.7)
                  ? ' Ce que tu tiens ' + duree + ' jours, tu peux le tenir à l\'année.'
                  : ' L\'important n\'est pas le score, c\'est de continuer.'}
              </div>
              <button
                onClick={handleNouveauChallenge}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 16, cursor: 'pointer',
                  background: 'rgba(var(--rgb-verre), 0.45)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(var(--rgb-creme-dore), 0.60)',
                  color: AMBRE, fontSize: 14.5, fontWeight: 800,
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 4px 20px rgba(var(--rgb-terracotta), 0.30)',
                }}>
                Lancer le cycle {numCycle + 1}
              </button>
              <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 9, lineHeight: 1.5 }}>
                Même cap en plus intense, ou change d'objectif : c'est toi qui choisis.
              </div>
            </motion.div>
          )}

          {/* ── ACTION DU JOUR ── */}
          {!programmeTermine && jourActuelData && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                background: 'rgba(var(--rgb-verre), 0.30)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '22px',
                padding: '24px 28px',
                border: '1.5px solid rgba(var(--rgb-or), 0.45)',
                boxShadow: '0 8px 36px rgba(var(--rgb-terracotta), 0.18)',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: ENCRE,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '10px',
                }}
              >
                Aujourd'hui · Jour {jourActuel}
              </p>

              {/* L'action textuelle ne s'affiche que si aucune seance ne la
                  detaille : « Seance A : squats, pont, gainage » suivi des trois
                  memes lignes en photo etait LA redondance de la carte
                  (constat Jean 2026-08-13). */}
              {!jourActuelData.seance?.length && (
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  color: ENCRE,
                  marginBottom: '10px',
                  lineHeight: 1.5,
                }}
              >
                {jourActuelData.action}
              </p>
              )}
              {jourActuelData.titre && jourActuelData.seance?.length > 0 && (
                <p style={{
                  fontFamily: "'Poppins', sans-serif", fontSize: '15px', fontWeight: 700,
                  color: ENCRE, marginBottom: '10px', lineHeight: 1.5,
                }}>
                  {jourActuelData.titre}
                </p>
              )}

              {/* ── Séance structurée du programme (exercices + reps + photos) ── */}
              {jourActuelData.seance?.length > 0 && (
                <div style={{ margin: '4px 0 10px' }}>
                  {/* Le bouton passe AVANT la liste : c'est l'action, la liste
                      n'est que l'apercu de ce qui va se passer. Il ne remplace
                      pas les cases a cocher, qui restent la pour ceux qui font
                      leur seance sans le telephone. */}
                  {!jourActuelComplete && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSeanceOuverte(true)}
                      style={{
                        width: '100%', marginBottom: 12, padding: '14px 16px', borderRadius: 16,
                        background: 'transparent', border: `1.5px solid ${ICONE}`,
                        color: ENCRE, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Poppins',sans-serif",
                      }}>
                      Démarrer la séance
                    </motion.button>
                  )}
                  {jourActuelData.seance.map((s, i) => (
                    <SeanceRow key={i} item={s} index={i}
                      fait={!!exosFaits[i]}
                      onToggle={() => toggleExo(i)}
                      onFiche={() => setExoGuide(s.exo || null)} />
                  ))}
                  {(() => {
                    const total = jourActuelData.seance.length
                    const faits = jourActuelData.seance.filter((_, i) => exosFaits[i]).length
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 2px 6px' }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', background: 'rgba(var(--rgb-terracotta), 0.14)' }}>
                          <div style={{ width: `${total ? Math.round(faits / total * 100) : 0}%`, height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,var(--accent),var(--or-plein))', transition: 'width 0.35s cubic-bezier(0.34,1.56,0.64,1)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ENCRE, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}>
                          {faits}/{total}
                        </span>
                      </div>
                    )
                  })()}
                  {/* Filet de sécurité : depuis que cocher le dernier exercice
                      valide le jour, quelqu'un qui a fait sa séance sans cocher
                      dans l'app n'avait plus AUCUN moyen de valider sa journée
                      (constat Jean 2026-08-13). */}
                  {!jourActuelComplete && (
                    <button
                      onClick={() => {
                        const tous = {}
                        jourActuelData.seance.forEach((_, i) => { tous[i] = true })
                        try { localStorage.setItem(cleExos, JSON.stringify(tous)) } catch {}
                        setExosFaits(tous)
                      }}
                      // Un lien souligne pose dans le corps du texte se lit
                      // comme une note de bas de page. Or c'est l'action la
                      // plus engageante de la carte : elle valide la journee
                      // entiere d'un coup, et « Demarrer la seance » juste au
                      // dessus est massif et encadre. Meme correction que pour
                      // « Ce que je ne mange pas » dans Nutrition.
                      style={{
                        background: 'rgba(var(--rgb-verre), 0.32)',
                        border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
                        borderRadius: 999, cursor: 'pointer',
                        padding: '7px 14px', marginBottom: 8,
                        fontSize: 11.5, fontWeight: 600,
                        color: ENCRE, fontFamily: "'Poppins',sans-serif",
                        alignSelf: 'flex-start',
                      }}>
                      Séance déjà faite ? Tout valider
                    </button>
                  )}
                </div>
              )}

                {/* LA COURSE, tous les jours et quel que soit le programme.
                    Elle ne vient pas du plan genere : elle est posee ici en
                    dur, parce qu'elle est l'activite maitresse et qu'elle ne
                    doit dependre ni du jour tire ni du programme choisi.
                    Elle ne conditionne pas la validation du jour : c'est un
                    socle, pas une punition supplementaire. */}
                {(() => {
                  const courses = faitesAujourdhui.filter(x => x.type === 'course')
                  const metres = courses.reduce((n, c) => n + (c.metres || 0), 0)
                  const minutes = Math.round(courses.reduce((n, c) => n + c.dureeMs, 0) / 60000)
                  return (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCourseOuverte(true)}
                      style={{
                        width: '100%', marginBottom: 10, padding: '13px 15px', borderRadius: 16,
                        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                        background: courses.length ? 'rgba(22,101,52,0.07)' : 'rgba(var(--rgb-verre), 0.32)',
                        border: courses.length
                          ? '1px solid rgba(22,101,52,0.28)'
                          : `1.5px solid ${ICONE}`,
                        cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                      }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 11, flexShrink: 0, fontSize: 17,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(var(--rgb-terracotta), 0.12)', border: '1px solid rgba(var(--rgb-terracotta), 0.20)',
                      }}>🏃</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: ENCRE }}>
                          Course à pied
                        </div>
                        <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 1 }}>
                          {courses.length
                            ? `Fait aujourd'hui : ${minutes} min${metres > 0 ? `, ${(metres / 1000).toFixed(2).replace('.', ',')} km` : ''}`
                            : 'Chronomètre, distance et allure, tous les jours'}
                        </div>
                      </div>
                      {courses.length > 0 && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={VERT}
                             strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                             style={{ flexShrink: 0 }}>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </motion.button>
                  )
                })()}
                {/* ── La marche, juste sous la course ──
                    Elle etait en avant-derniere position de l'onglet, sous un
                    message qui parle de la FIN du programme. Or c'est une
                    action pour maintenant, et l'option la plus accessible les
                    jours sans elan : quelqu'un qui renonce a la seance devait
                    descendre tout en bas pour la trouver. Elle est comptee au
                    meme titre que la course, sa place est ici. */}
                {onMarcher && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onMarcher}
                    style={{
                      width: '100%', marginBottom: 10, padding: '13px 15px', borderRadius: 16,
                      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                      background: 'rgba(var(--rgb-verre), 0.32)',
                      border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
                      cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
                    }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(var(--rgb-terracotta), 0.12)', border: '1px solid rgba(var(--rgb-terracotta), 0.20)',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="4" r="2" />
                        <path d="M11 21v-6l-2-3 1-4 3 2 2 2M10 8 8 12M13 15l2 6" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: ENCRE }}>Aller marcher</div>
                      <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 1 }}>Comptée aussi, sans allure à tenir</div>
                    </div>
                  </motion.button>
                )}
              {/* ── Conseil nutrition du jour ──
                  J'avais restreint ce bloc a l'onglet Nutrition, au nom de la
                  regle « Programme est specifiquement sportif ». Verifie
                  ensuite en ligne : il ne DEPLACAIT rien, il supprimait.

                  Les deux onglets s'excluent, on ne suit qu'un programme a la
                  fois. Quand le programme actif est sportif, l'onglet
                  Nutrition n'affiche aucune donnee du jour, juste « il est
                  dans l'onglet Sport ». Ce conseil, ecrit jour par jour dans
                  le programme, n'existe que la ou ce programme se deroule.

                  La regle de Jean separait des SECTIONS et une navigation,
                  pas une ligne de contexte attachee a la journee. */}
              {jourActuelData.nutrition && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  background: 'rgba(var(--rgb-verre), 0.35)', border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
                  borderRadius: 12, padding: '9px 12px', marginBottom: 12,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                  <span style={{ fontSize: 11.5, color: ENCRE, lineHeight: 1.55, fontFamily: "'Poppins', sans-serif" }}>
                    {jourActuelData.nutrition}
                  </span>
                </div>
              )}
              {/* « Voir le geste », si l'action mentionne un exercice du guide
                  (masqué quand une séance structurée est déjà affichée) */}
              {!jourActuelData.seance?.length && matchExercice(jourActuelData.action) && (
                <button onClick={() => setExoGuide(matchExercice(jourActuelData.action))} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
                  background: 'rgba(var(--rgb-verre), 0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(var(--rgb-creme-dore), 0.45)', borderRadius: 99,
                  padding: '7px 14px', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif", fontSize: 11.5, fontWeight: 600, color: AMBRE,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--icone-bouton)"><polygon points="6 3 20 12 6 21"/></svg>
                  Voir le geste
                </button>
              )}

              {jourActuelData.duree && !jourActuelData.seance?.length && (
                <span
                  style={{
                    display: 'inline-block',
                    background: 'rgba(var(--rgb-or), 0.12)',
                    color: AMBRE,
                    borderRadius: '12px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  {jourActuelData.duree}
                </span>
              )}

              {jourActuelData.pourquoi && (
                <p
                  style={{
                    // Regle B : Poppins sous 20px, l'italique serif en petit
                    // corps etait la cause premiere de l'illisibilite.
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '13px',
                    color: ENCRE,
                    marginBottom: '20px',
                    lineHeight: 1.6,
                  }}
                >
                  {jourActuelData.pourquoi}
                </p>
              )}


              {error && (
                <p
                  style={{
                    color: ROUGE,
                    fontSize: '12px',
                    marginBottom: '12px',
                    background: 'rgba(239,68,68,0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  {error}
                </p>
              )}

              {jourActuelComplete ? (
                <button
                  disabled
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: VERT,
                    border: '1.5px solid rgba(34,197,94,0.3)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: 'not-allowed',
                    width: '100%',
                  }}
                >
                  Fait aujourd'hui !
                </button>
              // Jour à séance : pas de bouton, cocher le dernier exercice
              // valide tout seul. Le compteur au-dessus dit où on en est.
              ) : jourActuelData?.seance?.length ? null : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { if (navigator.vibrate) navigator.vibrate([50, 40, 80]); handleMarquerFait(jourActuel - 1) }}
                  style={{
                    background: 'rgba(var(--rgb-verre), 0.32)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    color: AMBRE,
                    border: '1px solid rgba(var(--rgb-creme-dore), 0.38)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: 'pointer',
                    width: '100%',
                    boxShadow: '0 4px 16px rgba(var(--rgb-terracotta), 0.3)',
                  }}
                >
                  ✓ Marquer comme fait
                </motion.button>
              )}
            </motion.div>
          )}

          {/* DEMAIN, carte SOEUR et non enfant.
              Ce bloc etait a l'interieur du cadre « AUJOURD'HUI » : la
              hierarchie visuelle disait donc que demain fait partie
              d'aujourd'hui. C'est de la que venait la confusion qu'on avait
              traitee a moitie en renommant « Prochaine etape » en « Palier » :
              on avait corrige le symptome, pas la cause.

              Sorti du cadre, l'ecran se lit sur trois niveaux : ce que je fais
              maintenant, ce qui vient demain, ou ca me mene. */}
            {jourSuivantData && jourActuel < duree && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(var(--rgb-verre), 0.28)',
                border: '1px solid rgba(var(--rgb-creme-dore), 0.40)',
                borderRadius: 14, padding: '11px 13px',
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>
                  <SparkleIcon size={14} color={ICONE} />
                </span>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: ENCRE, marginBottom: 3 }}>
                    Demain · jour {jourActuel + 1}
                  </div>
                  <div style={{ fontSize: 12.5, color: ENCRE, lineHeight: 1.45, fontWeight: 500 }}>
                    {jourSuivantData.titre}
                  </div>
                  {jourSuivantData.seance?.length > 0 && (
                    <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 3 }}>
                      {jourSuivantData.seance.map(x => EXO_INFOS[x.exo]?.nom || x.exo).join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Bandeau de victoire du jour */}
          {showBravo && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              style={{
                // left/right 0 + margin auto, et non left 50% + translateX :
                // framer-motion ecrase transform avec ses propres y/scale, le
                // bandeau partait a droite hors ecran (constat Jean 2026-08-13).
                // Et verre ambre clair, pas de fond sombre : la palette Solenn
                // n'a AUCUN element fonce.
                position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 66px)',
                left: 0, right: 0, margin: '0 auto', zIndex: 9999,
                background: 'rgba(var(--rgb-bulle), 0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 20, padding: '14px 24px',
                border: '1.5px solid rgba(var(--rgb-creme-dore), 0.60)',
                boxShadow: '0 16px 48px rgba(120,60,20,0.25)',
                display: 'flex', alignItems: 'center', gap: 12, width: 'max-content', maxWidth: '88vw',
              }}>
              <StarIcon size={24} color="var(--ambre-fonce)" />
              <div style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: ENCRE }}>
                  Objectif du jour terminé, bravo !
                </div>
                <div style={{ fontSize: 11.5, color: ENCRE, marginTop: 1 }}>
                  Jour {jourActuel} validé · {progression.filter(Boolean).length + 1} sur {duree}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Guide des exercices (ouvert depuis « Voir le geste ») ── */}
          {exoGuide && (
            <Suspense fallback={null}>
              <ExercicesGuide initial={exoGuide} onClose={() => setExoGuide(null)} />
            </Suspense>
          )}

          {courseOuverte && (
            <Suspense fallback={null}>
              <CourseActive
                userId={userId}
                mode="course"
                onTermine={s => setFaitesAujourdhui(l => [...l, { ...s, type: 'course' }])}
                onFermer={() => setCourseOuverte(false)}
              />
            </Suspense>
          )}

          {/* Le lecteur de seance. Sa fin coche les exercices ET valide le
              jour : quelqu'un qui vient de faire sa seance dans l'app n'a
              aucune raison de devoir la recocher a la main ensuite. */}
          {seanceOuverte && jourActuelData?.seance?.length > 0 && (
            <Suspense fallback={null}>
              <SeanceActive
                seance={jourActuelData.seance}
                titre={jourActuelData.titre || jourActuelData.action}
                jour={jourActuel}
                onFermer={() => setSeanceOuverte(false)}
                onTermine={bilan => {
                  const tous = {}
                  jourActuelData.seance.forEach((_, i) => { tous[i] = true })
                  try { localStorage.setItem(cleExos, JSON.stringify(tous)) } catch {}
                  setExosFaits(tous)
                  setSeanceOuverte(false)
                  // La seance compte comme activite, au meme titre qu'une
                  // course : cocher des cases validait le jour mais ne laissait
                  // aucune trace de l'effort dans les progres.
                  if (bilan?.dureeMs) {
                    enregistrerSeance(userId, {
                      type: 'seance',
                      dureeMs: bilan.dureeMs,
                      exercices: bilan.exercices,
                      debut: bilan.debut,
                      fin: bilan.fin,
                      jour: jourActuel,
                    }).then(r => {
                      if (r.seance) setFaitesAujourdhui(l => [...l, r.seance])
                    })
                  }
                }}
              />
            </Suspense>
          )}


          {/* ── PROCHAIN MILESTONE ── */}
          {prochainMilestone && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                background: 'rgba(var(--rgb-terracotta), 0.05)',
                borderRadius: '16px',
                padding: '16px 20px',
                border: '1px solid rgba(var(--rgb-terracotta), 0.12)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <p style={{ fontSize: '13px', color: ENCRE, margin: 0, lineHeight: 1.55 }}>
                {/* « Prochaine étape » se lisait comme si ce jour suivait
                    celui affiche juste au dessus, sous « Demain · jour N+1 ».
                    Les jours intermediaires disparaissaient.
                    « Palier » et non « cap » : le haut de la page annonce deja
                    « Ton cap : <objectif> », et deux caps differents sur le
                    meme ecran auraient ete pire que le probleme de depart. Un
                    palier est un seuil qu'on franchit, ce qui est exactement
                    ce que decrivent ces messages. */}
                <span style={{ fontWeight: 700, color: ENCRE }}>
                  Palier · Jour {prochainMilestone.jour} :
                </span>{' '}
                {prochainMilestone.message}
              </p>
            </motion.div>
          )}

          {/* Le bouton de regeneration a quitte le bas de page : c'est la
              fleche d'actualisation du header, comme pour la routine
              (demande Jean 2026-08-13). Voir RoutineTab. */}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dialog de confirmation reset, portail vers <body> : rendu dans une
          carte animée (transform), un position:fixed serait piégé et invisible
          → le tap sur « Nouveau challenge » semblait ne rien faire */}
      {createPortal(<AnimatePresence>
        {confirmReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setConfirmReset(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                // Claire et non sombre : c'etait le seul element fonce de toute
                // l'app, il jurait avec la charte (constat Jean 2026-08-12).
                background: 'rgba(var(--rgb-bulle), 0.96)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(var(--rgb-terracotta), 0.28)',
                boxShadow: '0 18px 60px rgba(120,60,20,0.28)',
                borderRadius: 24, padding: '28px 24px',
                maxWidth: 340, width: '100%',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <div style={{ display:'flex', justifyContent:'center', marginBottom: 10 }}><SparkleIcon size={22} color="var(--ambre-fonce)" /></div>
              <div style={{ fontSize: 16, fontWeight: 600, color: ENCRE, textAlign: 'center', marginBottom: 8 }}>
                Vers quel objectif ?
              </div>
              <div style={{ fontSize: 12.5, color: ENCRE, textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>
                Ton nouveau programme sera construit pour lui.
                L'actuel sera remplacé et sa progression remise à zéro.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
                {OBJECTIFS.map(o => {
                  const actif = objChoisi === o
                  return (
                    <button key={o} onClick={() => setObjChoisi(o)} style={{
                      display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                      padding: '10px 13px', borderRadius: 13, cursor: 'pointer',
                      background: actif ? 'rgba(var(--rgb-verre), 0.55)' : 'rgba(var(--rgb-bulle), 0.40)',
                      border: actif ? '1.5px solid rgba(var(--rgb-or), 0.60)' : '1px solid rgba(var(--rgb-terracotta), 0.20)',
                      fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s',
                    }}>
                      <span style={{
                        width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                        border: actif ? '4.5px solid var(--accent)' : '1.5px solid rgba(var(--rgb-terracotta), 0.40)',
                        background: '#FFF6EE', boxSizing: 'border-box',
                      }} />
                      <span style={{ fontSize: 13, fontWeight: actif ? 700 : 500, color: ENCRE }}>{o}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: 'rgba(var(--rgb-terracotta), 0.08)',
                    border: '1px solid rgba(var(--rgb-terracotta), 0.25)',
                    color: ENCRE, fontSize: 14,
                    fontFamily: "'Poppins', sans-serif", cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  disabled={!objChoisi}
                  onClick={async () => {
                    setConfirmReset(false)
                    await changerObjectif(objChoisi)
                    handleCreerChallenge()
                  }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: 'rgba(var(--rgb-verre), 0.32)',
                    border: '1px solid rgba(var(--rgb-creme-dore), 0.30)',
                    color: AMBRE, fontSize: 14, fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: objChoisi ? 'pointer' : 'not-allowed',
                    opacity: objChoisi ? 1 : 0.45,
                  }}
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  )
}
