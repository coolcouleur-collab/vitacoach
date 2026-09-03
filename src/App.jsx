import React, { useState, useRef, useEffect, useMemo, Component, lazy, Suspense } from 'react'
import { scoreJour } from './score'
import { motion, AnimatePresence } from 'framer-motion'
import { playFx } from './sfx'
import GlowLoader from './GlowLoader'

// Supabase chargé en lazy, ne bloque pas le démarrage
let _sb = null
async function getSupabase() {
  if (!_sb) { const m = await import('./supabase'); _sb = m.supabase }
  return _sb
}

// Le marqueur des réponses rapides (|||CHOIX|||[...]|||END|||) arrive en fin de
// flux et n'était retiré qu'une fois le streaming terminé : il s'affichait donc
// en clair au bas de CHAQUE bulle pendant sa réception, le prompt le rendant
// obligatoire à chaque réponse (2026-08-11). On coupe des les premiers |||.
const sansMarqueur = t => t.replace(/\|\|\|[\s\S]*$/, '').trimEnd()

// Retour sur une réponse de Solenn. Le pouce levé n'était qu'un état local,
// perdu au rechargement et jamais envoyé nulle part : on demandait un avis pour
// le jeter. C'est pourtant le seul signal qui dise quelles réponses aident
// vraiment. Table chat_feedback (voir supabase-chat-feedback.sql).
// Silencieux par construction : un retour perdu ne doit jamais casser le chat.
async function enregistrerRetour({ userId, question, reponse, vote }) {
  if (!userId || !reponse) return
  try {
    const supabase = await getSupabase()
    if (vote === null) {
      await supabase.from('chat_feedback').delete().match({ user_id: userId, reponse })
      return
    }
    await supabase.from('chat_feedback').insert({ user_id: userId, question, reponse, vote })
  } catch {}
}

// Header Authorization avec le token de session Supabase (import lazy, ne bloque pas le démarrage).
// Ne throw jamais.
async function authHeaders() {
  try { const m = await import('./supabase'); return await m.authHeaders() } catch { return {} }
}

const MorningCheckin = lazy(() => import('./MorningCheckin'))
const SettingsSheet  = lazy(() => import('./SettingsSheet'))

// Lazy, chargés uniquement quand l'utilisateur y accède
const Auth          = lazy(() => import('./Auth'))
const Landing       = lazy(() => import('./Landing'))
const Forum         = lazy(() => import('./Forum'))
const Onboarding    = lazy(() => import('./Onboarding'))
const HomeTab       = lazy(() => import('./HomeTab'))
const HerbalTab     = lazy(() => import('./HerbalTab'))
const SanteTab      = lazy(() => import('./SanteTab'))
const RoutineTab    = lazy(() => import('./RoutineTab'))
const ChatHistory   = lazy(() => import('./ChatHistory'))
const BreathworkTab = lazy(() => import('./BreathworkTab'))
const CycleTab      = lazy(() => import('./CycleTab'))
const PaywallOffre  = lazy(() => import('./PaywallOffre'))
import { LeafIcon, HomeIcon, ChatIcon, HeartIcon, RoutineIcon, ForumIcon, SendIcon, BellIcon, BellOffIcon, StarIcon, TargetIcon, LightbulbIcon, MoonIcon, SunIcon, FoodIcon, PillIcon, RefreshIcon, SparkleIcon, LoadingIcon, WeatherIcon, RunIcon, ThumbsUpIcon, StyleIcon, BreathworkIcon, CycleIcon, FireIcon, WaterIcon, WalkIcon, BalanceIcon } from './Icons'
import ResponseRenderer, { isRich } from './ResponseRenderer'
import { AMBRE, ENCRE, ICONE, ROUGE, VERT } from './palette'
import { syncProfilSupabase } from './profilSync'
import { isNativeApp } from './hooks/useCapacitor'

// ─── HAPTIC UTILITY ──────────────────────────────────────────────────────────
async function triggerHaptic(type = 'light') {
  if (!window?.Capacitor?.isNativePlatform?.()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({
      style: type === 'heavy' ? ImpactStyle.Heavy
           : type === 'medium' ? ImpactStyle.Medium
           : ImpactStyle.Light,
    })
  } catch {}
}

// ─── SOLENN MASCOT FACE ──────────────────────────────────────────────────────
// HomeTab lui passe isNight depuis toujours (HomeTab.jsx:2274), le composant
// ne l'a jamais lu : la lettre restait creme quel que soit le fond. Sur clair
// elle tombait a 1,12:1, donc invisible, et .liquid-avatar n'apporte aucun
// fond qui aurait pu la rattraper. Sur le navy du mode Nuit, le creme est en
// revanche le bon choix : la couleur devait suivre le theme, pas etre figee.
/**
 * La signature, selon L'AMBIANCE affichee.
 *
 * « Ton soleil au quotidien » s'affichait a 1h49 du matin sous une lune. Le
 * mot soleil est celui de la marque et il reste : c'est la fin de la phrase
 * qui change, pour que la signature cesse de contredire l'ecran.
 *
 * CORRECTION du 2 septembre, au deuxieme essai. Ma premiere version lisait
 * l'HEURE, ce qui rate le cas principal : l'ambiance peut etre forcee a la
 * main dans Reglages, et ce choix l'emporte sur l'horloge. Jean avait donc, a
 * 11h22, un fond de nuit surmonte de « Ton soleil au quotidien ». J'avais
 * reintroduit exactement la contradiction que je pretendais corriger, en
 * consultant une source differente de celle qui decide de l'ecran.
 *
 * D'ou le parametre : la signature lit maintenant la MEME chose que l'anneau.
 */
function signatureSolenn(preset) {
  return preset === 'night'
    ? 'Ton soleil, même la nuit'
    : 'Ton soleil au quotidien'
}

function SolennFace({ size = 34, isNight = false }) {
  return (
    <div className="liquid-avatar" style={{
      width: size, height: size,
      background: 'rgba(220,140,70,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      isolation: 'isolate',
      transform: 'translateZ(0)',
    }}>
      <span style={{
        fontSize: size * 0.44,
        fontWeight: 700,
        color: isNight ? 'rgba(255,230,190,0.92)' : ENCRE,
        fontFamily: 'Poppins, sans-serif',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        userSelect: 'none',
      }}>S</span>
    </div>
  )
}

// ─── Error Boundary (évite page blanche sur crash de rendu) ──────────────────
class MsgBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  render() {
    if (this.state.crashed) {
      return (
        <span style={{ whiteSpace:'pre-wrap', lineHeight:1.72, color:ENCRE }}>
          {this.props.fallback}
        </span>
      )
    }
    return this.props.children
  }
}

// ─── HEALTH PERMISSION MODAL ─────────────────────────────────────────────────
function HealthPermModal({ onAllow, onLater, isNight = false }) {
  // Le panneau flotte au-dessus de l'accueil : sur le navy du mode Nuit,
  // l'encre terracotta disparait. Meme regle que la barre laterale.
  const encre  = isNight ? 'rgba(198,222,255,0.95)' : ENCRE
  const encre2 = isNight ? 'rgba(190,216,255,0.78)' : ENCRE
  const trait  = isNight ? 'rgba(160,200,255,0.22)' : 'rgba(var(--rgb-creme-dore), 0.28)'
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1500,
      background:'rgba(20,8,0,0.11)', backdropFilter:'blur(8px)',
      WebkitBackdropFilter:'blur(8px)',
      display:'flex', alignItems:'flex-end', justifyContent:'center',
    }}>
      <div style={{
        background:'rgba(255,235,200,0.14)',
        backdropFilter:'blur(28px)',
        WebkitBackdropFilter:'blur(28px)',
        borderRadius:'28px 28px 0 0',
        border:'1px solid rgba(var(--rgb-creme-dore), 0.25)',
        borderBottom:'none',
        padding:'10px 26px',
        paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 52px)',
        width:'100%', maxWidth:520,
        boxShadow:'0 -20px 60px rgba(200,100,40,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
        animation:'slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{ width:44, height:5, background:'rgba(var(--rgb-creme-dore), 0.30)', borderRadius:12, margin:'12px auto 26px' }} />

        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:20 }}>
          {[
            { bg:'rgba(200,100,40,0.12)', icon: <HeartIcon size={28} color={encre2} /> },
            { bg:'rgba(200,100,40,0.08)', icon: <RunIcon   size={28} color={encre2} /> },
          ].map(({ bg, icon }, idx) => (
            <div key={idx} style={{ width:56, height:56, borderRadius:18, background:bg, border:'1px solid rgba(var(--rgb-creme-dore), 0.20)', display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
          ))}
        </div>

        <div style={{
          fontFamily:"'Poppins', system-ui, sans-serif",
          fontWeight:600,
          fontSize:'clamp(1.4rem, 2vw, 1.7rem)',
          color: encre,
          textAlign:'center', marginBottom:8, letterSpacing:'-0.01em',
        }}>
          Synchroniser mes données santé
        </div>
        <div style={{ fontSize:13, fontFamily:'Poppins, sans-serif', color: encre, textAlign:'center', lineHeight:1.75, marginBottom:22 }}>
          Solenn synchronise automatiquement depuis{' '}
          <strong style={{ color: encre }}>Apple Santé</strong> ou{' '}
          <strong style={{ color: encre }}>Google Fit</strong>.
        </div>

        {[
          { Icon: WalkIcon,    label:'Activité & pas quotidiens' },
          { Icon: MoonIcon,    label:'Sommeil & récupération' },
          { Icon: HeartIcon,   label:'Fréquence cardiaque' },
          { Icon: BalanceIcon, label:'Poids & composition' },
        ].map(({ Icon, label }) => (
          <div key={label} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'10px 14px', borderRadius:13, marginBottom:7,
            background:'rgba(200,100,40,0.06)', border:'1px solid rgba(var(--rgb-creme-dore), 0.18)',
          }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={18} color={encre2} />
            </span>
            <span style={{ fontSize:13, fontFamily:'Poppins, sans-serif', color: encre, fontWeight:500, flex:1 }}>{label}</span>
            <span style={{ fontSize:10, fontFamily:'Poppins, sans-serif', color: encre, fontWeight:600, background:'rgba(var(--rgb-creme-dore), 0.22)', padding:'3px 8px', borderRadius:12, border:'1px solid rgba(var(--rgb-creme-dore), 0.35)' }}>Lecture seule</span>
          </div>
        ))}

        <div style={{ marginTop:22, display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={onAllow} style={{
            padding:'0.85rem 2.5rem', borderRadius:'2rem',
            border:'1px solid rgba(var(--rgb-creme-dore), 0.75)',
            background:'rgba(200,100,40,0.18)',
            color: encre,
            fontFamily:"'Poppins', system-ui, sans-serif",
            fontWeight:600,
            fontSize:'clamp(1.2rem, 1.3vw, 1.4rem)',
            letterSpacing:'0.04em', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'background 0.25s, border-color 0.25s',
          }}>Autoriser l'accès</button>
          <button onClick={onLater} style={{
            padding:'12px', borderRadius:'2rem',
            border:'1px solid rgba(var(--rgb-creme-dore), 0.45)',
            background:'rgba(var(--rgb-creme-dore), 0.08)',
            color: encre,
            fontFamily:'Poppins, sans-serif',
            fontSize:13, fontWeight:500,
            cursor:'pointer',
          }}>Plus tard</button>
        </div>
      </div>
    </div>
  )
}

// ─── CELEBRATION OVERLAY ─────────────────────────────────────────────────────
function CelebrationOverlay({ score, onDone }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    let alive = true
    const t1 = setTimeout(() => { if (alive) setOut(true) }, 2700)
    const t2 = setTimeout(() => { if (alive) onDone() }, 3120)
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  const CELEB_COLORS = ['var(--or-plein)', 'var(--accent)', '#22c55e']
  const sparks = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    color: CELEB_COLORS[i % 3],
    star: i % 2 === 0,
    x: 4 + (i * 6) % 92,
    delay: (i * 0.09) % 0.65,
    dur: 1.2 + (i * 0.11) % 1.0,
  }))
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999, pointerEvents:'none',
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity: out ? 0 : 1, transition:'opacity 0.42s ease',
    }}>
      {sparks.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:'-5%', lineHeight:0,
          animation:`celebFall ${s.dur}s ${s.delay}s ease-in forwards`,
        }}>
          {s.star
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill={s.color} opacity="0.9">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" opacity="0.85">
                <circle cx="12" cy="12" r="8" fill={s.color}/>
              </svg>}
        </div>
      ))}
      <div style={{
        background:'rgba(30,15,5,0.85)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
        borderRadius:28, padding:'36px 52px', textAlign:'center',
        boxShadow:'0 28px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.15)',
        border:'1.5px solid rgba(var(--rgb-creme-dore), 0.28)',
        animation:'celebPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{ marginBottom:10, lineHeight:1, display:'flex', justifyContent:'center' }}>
          {score >= 90 ? <StarIcon size={48} color="var(--ambre-fonce)" /> : <SparkleIcon size={48} color="var(--ambre-fonce)" />}
        </div>
        <div style={{ fontSize:50, fontWeight:900, color:'var(--ambre-fonce)', lineHeight:1, letterSpacing:'-2px' }}>
          {score}<span style={{ fontSize:18, color:'rgba(var(--rgb-creme-rose), 0.55)', fontWeight:400 }}>/100</span>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:'rgba(var(--rgb-creme-rose), 0.92)', marginTop:9 }}>
          {score >= 90 ? 'Journée parfaite !' : score >= 80 ? 'Excellente journée !' : 'Objectif atteint !'}
        </div>
        <div style={{ fontSize:11, color:'rgba(var(--rgb-creme-rose), 0.65)', marginTop:5, fontWeight:500, letterSpacing:'0.3px' }}>
          Score santé du jour
        </div>
      </div>
    </div>
  )
}

function ReactionBtn({ emoji, icon, active, onClick }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); e.preventDefault(); onClick(); setPressed(true); setTimeout(() => setPressed(false), 350) }}
      style={{
        background: active ? 'rgba(var(--rgb-terracotta), 0.15)' : 'transparent',
        border: active ? '1.5px solid rgba(var(--rgb-terracotta), 0.60)' : '1.5px solid rgba(var(--rgb-terracotta), 0.18)',
        borderRadius: 12, padding: '4px 9px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        transform: pressed ? 'scale(1.40)' : active ? 'scale(1.10)' : 'scale(1)',
        boxShadow: active ? '0 2px 10px rgba(var(--rgb-terracotta), 0.20)' : 'none',
        filter: active ? 'none' : 'opacity(0.45)',
        outline: 'none',
      }}
    >
      {icon || emoji}
    </button>
  )
}

// ─── MÉTRIQUES UTILS ─────────────────────────────────────────────────────────
const defaultMetriques = () => {
  const today = new Date().toDateString()
  try {
    const saved = JSON.parse(localStorage.getItem('vitacoach_metriques') || '{}')
    if (saved.date === today) return saved
  } catch {}
  return { date: today, pas: 0, sommeil: 0, eau: 0, fc: 0, humeur: 0, poids: 0 }
}

function sauverMetriques(m) {
  localStorage.setItem('vitacoach_metriques', JSON.stringify({ ...m, date: new Date().toDateString() }))
}

async function syncMetriquesSupabase(userId, m) {
  if (!userId) return
  const supabase = await getSupabase()
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('user_metrics').upsert({
    user_id: userId, date: today,
    pas: m.pas||0, sommeil: m.sommeil||0, eau: m.eau||0,
    fc: m.fc||0, humeur: m.humeur||0, poids: m.poids||0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,date' })
}

// Les champs d'abonnement appartiennent au webhook Stripe et au serveur.
// Le client ne les ecrit JAMAIS : il recopie ceux de la base.
// Champs ecrits par le SERVEUR, webhook Stripe, agent memoire, mise a Pro
// manuelle. Le client ne les produit pas : il doit les recopier depuis la base
// avant d'ecrire, sinon il les efface. La fonction vit desormais dans
// src/profilSync.js : deux autres ecrans en avaient besoin et faisaient
// chacun leur upsert muet a la place.

// Convertit base64url en Uint8Array pour VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// ─── DYNAMIC NAV ─────────────────────────────────────────────────────────────
// Architecture clarifiée (2026-07-25) : chaque onglet répond à UNE question,
// Accueil « comment je vais ? » · Programme « que faire aujourd'hui ? » ·
// Progrès « est-ce que ça marche ? » · Solenn « j'ai une question »
const NAV_ITEMS = [
  { id:'accueil',   label:'Accueil',    Icon: HomeIcon },
  { id:'chat',      label:'Solenn',     Icon: ChatIcon },
  // Pluriel : l'onglet en contient desormais quatre, repartis en trois
  // familles. Mesure faite avant de changer : la barre tient a 375px.
  { id:'routine',   label:'Programmes', Icon: RoutineIcon },
  { id:'sante',     label:'Progrès',    Icon: HeartIcon },
  { id:'style',     label:'Style',      Icon: StyleIcon },
  { id:'breathwork',label:'Respiration',Icon: BreathworkIcon },
  // PAS de forum ici. Il a ete retire du lancement le 2026-07-21, et la fiche
  // Play Console declare que Solenn ne contient AUCUN contenu genere par les
  // utilisateurs. Le laisser dans cette liste etait un piege : elle sert de
  // valeur par defaut a DynamicNav, et un seul appel sans `items` aurait fait
  // reapparaitre le forum dans l'app en contradiction avec la declaration
  // (releve par Jean le 2026-08-25).
  //
  // Declarer du contenu genere par les utilisateurs impose signalement,
  // blocage, moderation demontrable et delai de traitement, chez Google comme
  // chez Apple, article 1.2. A reprendre AVANT toute reactivation.
  // Point de reactivation unique : la propriete `onForum` de Landing.
]

// Barre d'onglets TOUJOURS dépliée. Avant, la nav n'affichait qu'une pastille
// (« Accueil ··· ») et les destinations n'apparaissaient qu'après un tap :
// personne ne pouvait deviner que Programme, Progrès ou Solenn existaient, et
// on ne savait jamais où on se trouvait. L'app paraissait à la fois vide et
// compliquée (retour Jean 2026-08-08). Même esthétique de verre, mais les
// destinations sont visibles en permanence.
function DynamicNav({ onglet, setOnglet, forumUnread, F, preset = 'day', items = NAV_ITEMS }) {
  const [open, setOpen] = React.useState(true)
  const ref = React.useRef(null)
  const active = items.find(i => i.id === onglet) || items[0]

  // Écart entre l'écran réel et le viewport de mise en page. Mesuré chez Jean
  // le 2026-08-08 : 956 px d'écran pour 894 px de viewport, soit 62 px que les
  // position:fixed ne peuvent pas atteindre, c'est la « bande du bas ».
  // On le mesure en JS plutôt qu'avec un calc() CSS : la première tentative en
  // calc(100% - 100vh) donnait une valeur positive et remontait la barre au
  // milieu de l'écran. Ici la valeur est certaine, et vaut 0 partout où le
  // problème n'existe pas (Safari, desktop, Android).
  const [ecartBas, setEcartBas] = React.useState(0)
  React.useEffect(() => {
    const mesurer = () => {
      const e = Math.round(window.innerHeight - document.documentElement.clientHeight)
      setEcartBas(e > 0 && e < 200 ? e : 0)
    }
    mesurer()
    window.addEventListener('resize', mesurer)
    window.visualViewport?.addEventListener('resize', mesurer)
    return () => {
      window.removeEventListener('resize', mesurer)
      window.visualViewport?.removeEventListener('resize', mesurer)
    }
  }, [])

  // `&& onglet === 'accueil'` a saute le 2 septembre. Cette condition datait
  // du temps ou seul l'accueil avait une ambiance de nuit, et le reglage le
  // disait : « Le reste de l'app reste clair pour l'instant ».
  //
  // C'est elle qui laissait, la nuit, la barre du bas en brun, l'en-tete en
  // creme pale et le chat entierement chaud sous un texte devenu bleu clair.
  // Une seule ligne tenait les trois.
  const isNight = preset === 'night'
  // Couleurs adaptées au mode nuit / jour.
  //
  // ⚠️ EN JOUR, LE TEXTE EST TERRACOTTA, PAS CRÈME. Mesuré le 2026-09-01 sur
  // les captures iPhone de Jean : en crème, les libellés atteignaient 1,68 de
  // contraste pour l'onglet ouvert et 1,24 pour les autres, là où il en faut
  // 4,5. Autrement dit du crème sur du crème, illisible par construction, sur
  // la barre que TOUT LE MONDE regarde en permanence.
  //
  // La cause : cette pastille n'est PAS une surface sombre. À 0,24 d'opacité
  // elle n'assombrit presque pas le fond ambré. Le crème n'y a donc pas sa
  // place, conformément à la règle de la palette.
  //
  // Le verre est volontairement INCHANGÉ, Jean y tient : même couleur de
  // pastille, même flou, même transparence. Seule la couleur du texte bouge,
  // et l'onglet ouvert se distingue désormais par sa GRAISSE et sa pastille
  // claire, plus par un écart de contraste. C'est ce qui permet aux quatre
  // libellés d'être lisibles en même temps. Après : 6,49 et 5,95.
  //
  // La nuit N'ETAIT PAS juste non plus, contrairement a ce que disait cette
  // ligne : mesure le 2 septembre sur le site en ligne, les libelles inactifs
  // tombaient a 2,83:1 a 9,5 px. L'opacite de txtDim passe de 0,42 a 0,65,
  // soit 4,97:1, et l'onglet ouvert reste distinct par sa graisse et son 0,92.
  const pillBg    = isNight ? 'rgba(10,22,58,0.60)'      : 'rgba(120,55,10,0.24)'
  const txtHigh   = isNight ? 'rgba(160,200,255,0.92)'   : '#5A2A05'
  const txtMid    = isNight ? 'rgba(160,200,255,0.88)'   : '#5A2A05'
  const txtDim    = isNight ? 'rgba(160,200,255,0.65)'   : 'rgba(90,42,5,0.82)'
  const divider   = isNight ? 'rgba(160,200,255,0.18)'   : 'rgba(255,238,228,0.18)'
  const activeBg  = isNight ? 'rgba(160,200,255,0.14)'   : 'rgba(255,238,228,0.14)'

  // (plus de fermeture au clic extérieur : la barre reste dépliée)

  const spring = { type:'spring', damping:32, stiffness:280, mass:0.6 }
  const contentSpring = { type:'spring', damping:28, stiffness:260, mass:0.5 }

  return (
    <motion.nav
      ref={ref}
      layout
      layoutTransition={spring}
      style={{
        // Barre ancrée au bord INFÉRIEUR de l'écran, comme Instagram : elle
        // recouvre la zone de la barre d'accueil iOS au lieu de flotter
        // au-dessus. C'est ce qui fait disparaître la bande du bas, il n'y a
        // PASTILLE FLOTTANTE façon Instagram : détachée des trois bords, coins
        // très arrondis. La version pleine largeur avait été faite pour couvrir
        // la bande du bas ; ce n'est plus nécessaire depuis que body est
        // verrouillé en position:fixed, et un bandeau collé aux bords se lisait
        // comme un bloc rectangulaire (retour Jean 2026-08-08).
        position:'fixed', bottom:'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        left:14, right:14,
        zIndex:100, cursor:'default',
        background: pillBg,
        backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
        border:'1px solid rgba(255,255,255,0.14)',
        borderRadius:30,
        boxShadow:'0 8px 30px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.14)',
        display:'flex', alignItems:'center', justifyContent:'center',
        overflow:'hidden',
        padding:'7px 6px',
        whiteSpace:'nowrap',
      }}
      transition={spring}
    >
      <AnimatePresence mode="wait" initial={false}>
        {/* ── Fermé ── */}
        {!open && (
          <motion.div key="closed"
            initial={{ opacity:0, scale:0.94 }}
            animate={{ opacity:1, scale:1, transition:{ delay:0.08, duration:0.22, ease:[0.22,1,0.36,1] } }}
            exit={{ opacity:0, scale:0.94, transition:{ duration:0.12, ease:[0.4,0,1,1] } }}
            style={{ display:'flex', alignItems:'center', gap:10 }}
          >
            <active.Icon color={txtHigh} size={19} />
            <span style={{ fontSize:13, fontWeight:500, color:txtMid, fontFamily:F }}>
              {active.label}
            </span>
            <div style={{ width:1, height:14, background:divider, margin:'0 4px' }} />
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:3.5, height:3.5, borderRadius:'50%', background:txtDim }} />)}
            </div>
          </motion.div>
        )}

        {/* ── Ouvert ── */}
        {open && (
          <motion.div key="open"
            initial={{ opacity:0 }}
            animate={{ opacity:1, transition:{ duration:0.18, ease:'easeOut' } }}
            exit={{ opacity:0, transition:{ duration:0.1 } }}
            style={{ display:'flex', alignItems:'flex-start', gap:2, justifyContent:'space-around', width:'100%', maxWidth:420 }}
          >
            {items.map((item, i) => {
              const isActive = onglet === item.id
              return (
                <motion.button key={item.id}
                  initial={{ opacity:0, filter:'blur(10px)' }}
                  animate={{ opacity:1, filter:'blur(0px)', transition:{ delay: 0.06 + i * 0.04, duration:0.22, ease:[0.22,1,0.36,1] } }}
                  onClick={() => { triggerHaptic('light'); setOnglet(item.id) }}
                  style={{
                    background: isActive ? activeBg : 'transparent',
                    border:'none', cursor:'pointer', borderRadius:14,
                    padding:'6px 10px', fontFamily:F,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                    position:'relative',
                  }}
                >
                  <item.Icon color={isActive ? txtHigh : txtDim} size={17} />
                  <span style={{ fontSize:9.5, fontWeight: isActive ? 700 : 500, letterSpacing:'0.2px', color: isActive ? txtHigh : txtDim, whiteSpace:'nowrap' }}>
                    {item.label}
                  </span>
                  {item.id === 'forum' && forumUnread > 0 && (
                    <span style={{ position:'absolute', top:4, right:8, background:'#ef4444', color:'#fff', fontSize:8, fontWeight:800, borderRadius:20, minWidth:13, height:13, lineHeight:'13px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 2px' }}>
                      {forumUnread > 9 ? '9+' : forumUnread}
                    </span>
                  )}
                </motion.button>
              )
            })}

          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// Copie locale de scoreJour, SanteTab ne l'exporte plus (Fast Refresh incompatible)
// Le score vient de score.js, source unique depuis le 2 septembre.
// Il en existait trois copies identiques a un espace pres.

// ─── PRESET HEURE (sunrise 6-9, day 9-18, sunset 18-21, night 21-6) ──────────
/**
 * La fin de la fenetre d'ambiance qui contient cet instant.
 *
 * Les fenetres commencent a 6h, 9h, 18h et 21h. Celle de la nuit court de 21h
 * a 6h le lendemain, d'ou le passage au jour suivant.
 */
function finDeFenetre(d) {
  const bornes = [6, 9, 18, 21]
  const suivante = bornes.find(b => b > d.getHours())
  const fin = new Date(d)
  if (suivante === undefined) {
    fin.setDate(fin.getDate() + 1)
    fin.setHours(6, 0, 0, 0)
  } else {
    fin.setHours(suivante, 0, 0, 0)
  }
  return fin
}

/**
 * Jusqu'a quand un choix d'ambiance reste valable.
 *
 * La regle tient en une phrase : jusqu'a la fin de la fenetre qui contient
 * l'heure du choix PLUS UNE HEURE.
 *
 * L'heure ajoutee n'est pas un detail, c'est ce qui rend la regle vivable.
 * Sans elle, quelqu'un qui force la nuit a 17h55 la perdait a 18h00, cinq
 * minutes plus tard : l'app avait l'air de ne pas ecouter. Avec elle, ce choix
 * tient jusqu'a 21h.
 *
 * Et elle donne toujours le comportement demande dans l'autre sens : une nuit
 * forcee a 8h du matin expire a 18h, donc l'ambiance suivante affichee est le
 * coucher de soleil, la journee ayant ete sautee.
 */
function finDeChoixAmbiance(pose) {
  return finDeFenetre(new Date(pose + 3600000)).getTime()
}

/**
 * L'ambiance choisie a la main, si elle est encore valable.
 *
 * Nettoie le stockage quand le choix a expire : une preference perimee qui
 * traine finit par ressortir un jour ou personne ne l'attend.
 */
function lireAmbianceManuelle() {
  try {
    const brut = localStorage.getItem('solenn_preset_manuel')
    if (!brut) return null
    // Ancien format : une simple chaine, sans horodatage. On la considere
    // posee a l'instant, ce qui lui laisse sa duree normale plutot que de la
    // faire disparaitre sous les yeux de quelqu'un qui vient de mettre a jour.
    const o = brut.startsWith('{') ? JSON.parse(brut) : { valeur: brut, pose: Date.now() }
    if (!o?.valeur || !o?.pose) return null
    if (Date.now() < finDeChoixAmbiance(o.pose)) return o.valeur
    localStorage.removeItem('solenn_preset_manuel')
    return null
  } catch {
    return null
  }
}

/** Pose un choix d'ambiance, horodate. */
function poserAmbianceManuelle(valeur) {
  try {
    localStorage.setItem('solenn_preset_manuel', JSON.stringify({
      valeur,
      pose: Date.now(),
    }))
  } catch {}
}

function getOceanPreset(hour) {
  if (hour >= 6  && hour < 9)  return 'sunrise'
  if (hour >= 9  && hour < 18) return 'day'
  if (hour >= 18 && hour < 21) return 'sunset'
  return 'night'
}

// ─── APP ══════════════════════════════════════════════════════════════════════
// Efface toute trace d'abonnement de l'appareil. Appelee a chaque
// deconnexion : sans elle, `vitacoach_pro` survivait au changement de compte
// et le compte suivant cree sur le meme navigateur s'affichait Pro sans avoir
// jamais paye (constate par Jean le 2026-08-14).
function oublierAbonnement() {
  localStorage.removeItem('vitacoach_pro')
  localStorage.removeItem('vitacoach_stripe_session')
}

export default function App() {
  const FREE_LIMIT = 5

  const appPreset = getOceanPreset(new Date().getHours())

  const getMsgCount = () => {
    const today = new Date().toDateString()
    try {
      const saved = JSON.parse(localStorage.getItem('vitacoach_msg_count') || '{}')
      return saved.date !== today ? 0 : saved.count
    } catch { return 0 }
  }
  const incrementMsgCount = () => {
    const today = new Date().toDateString()
    localStorage.setItem('vitacoach_msg_count', JSON.stringify({ date:today, count: getMsgCount()+1 }))
  }

  const safeParse = (key, fb) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb }
  }

  // Attribution influence : ?ref=CODE (lien créateur) mémorisé au premier
  // passage, rattaché au profil à l'inscription puis visible dans /admin
  try {
    const _ref = new URLSearchParams(window.location.search).get('ref')
    if (_ref) localStorage.setItem('vitacoach_ref', _ref.slice(0, 32))
  } catch {}

  const [user, setUser]         = useState(() => {
    if (localStorage.getItem('solenn_remember_me') === 'false' && !sessionStorage.getItem('solenn_active_session')) {
      // "Don't remember me" session ended, clear stale auth
      localStorage.removeItem('vitacoach_user')
      localStorage.removeItem('solenn_remember_me')
      getSupabase().then(sb => sb.auth.signOut())
      return null
    }
    return safeParse('vitacoach_user', null)
  })
  const [isPro, setIsPro]       = useState(() => safeParse('vitacoach_pro', false))
  // Le statut Pro appartient au COMPTE, pas a l'appareil. Il est confirme
  // juste apres par la ligne Supabase (effet plus bas) ; cette valeur locale
  // n'est qu'un affichage immediat au demarrage.

  // ?paywall=1 → prévisualisation directe de l'écran d'offre (test/design)
  const [showPaywall, setShowPaywall] = useState(() => new URLSearchParams(window.location.search).has('paywall'))
  // Durée de l'essai. DOIT rester égale à TRIAL_DAYS dans api/_quota.js : deux
  // valeurs differentes donneraient un compte a rebours qui ment sur la date
  // reelle de fin, cote serveur.
  const ESSAI_JOURS = 21
  const isFreeTrial = !isPro && !!user?.created_at && (Date.now() - new Date(user.created_at).getTime() < ESSAI_JOURS * 24 * 3600 * 1000)
  const hasFullAccess = isPro || isFreeTrial
  const [profil, setProfil]     = useState(() => safeParse('vitacoach_profil', null))
  const [profilLoading, setProfilLoading] = useState(() => {
    const u = safeParse('vitacoach_user', null)
    const p = safeParse('vitacoach_profil', null)
    return !!u && !p
  })
const [messages, setMessages] = useState(() => {
    const p = safeParse('vitacoach_profil', null)
    const h = safeParse('vitacoach_historique', null)
    if (p && h) {
      // Purge les vieux messages de limite (jamais utiles dans l'historique) ET
      // les bulles d'assistant tronquées : quand un flux de réponse est coupé
      // (perte de réseau, onglet quitté, app mise en arrière-plan), le fragment
      // déjà reçu était enregistré tel quel et revenait à chaque ouverture,
      // d'où les bulles « ta » ou « Commence ta » vues par Jean le 2026-08-08.
      return h.filter(m => {
        if (m.content?.includes('messages gratuits')) return false
        if (m.role !== 'assistant') return true
        const t = (m.content || '').trim()
        if (!t) return false
        // Un fragment coupé : très court ET sans ponctuation finale
        return t.length >= 12 || /[.!?…:)]$/.test(t)
      })
    }
    if (p) {
      const hr = new Date().getHours()
      const greet = hr < 6 ? 'Bonsoir' : hr < 12 ? 'Bonjour' : hr < 18 ? 'Salut' : 'Bonsoir'
      const nom = p.nom ? p.nom.charAt(0).toUpperCase() + p.nom.slice(1).toLowerCase() : ''
      // Streak depuis l'historique
      const hist = safeParse('vitacoach_history', [])
      const sorted = [...hist].sort((a,b) => new Date(b.date) - new Date(a.date))
      const todayStr = new Date().toDateString()
      const yStr = new Date(Date.now() - 86400000).toDateString()
      let streakC = 0
      if (sorted.length > 0 && (sorted[0].date === todayStr || sorted[0].date === yStr)) {
        let expected = sorted[0].date
        for (const e of sorted) {
          if (e.date === expected) {
            streakC++
            const d = new Date(expected); d.setDate(d.getDate() - 1); expected = d.toDateString()
          } else break
        }
      }
      // Score d'hier
      const yEntry = hist.find(e => e.date === yStr)
      const yScore = yEntry ? scoreJour(yEntry) : 0
      // Objectif principal
      const obj0 = (p.objectifs?.[0] || '').toLowerCase()
      const wantsEnergy = /énergie|fatigue|sport/.test(obj0)
      const wantsSleep  = /sommeil|dormir/.test(obj0)
      const wantsWeight = /poids|mincir|maigrir/.test(obj0)
      // Construire le message
      const parts = [`${greet} ${nom} !`]
      if (streakC >= 7)       parts.push(`${streakC} jours de suite, tu es vraiment sur une lancée.`)
      else if (streakC >= 3)  parts.push(`${streakC} jours consécutifs, ta régularité paie vraiment.`)
      else if (streakC === 2) parts.push(`2 jours de suite, tu prends de bonnes habitudes.`)
      if (yScore >= 80)           parts.push(`Hier tu étais au top (${yScore}/100), continue comme ça.`)
      else if (yScore > 0 && yScore < 50) parts.push(`Hier c'était une journée difficile (${yScore}/100), aujourd'hui c'est une nouvelle page.`)
      if (hr >= 5 && hr < 10) {
        if (wantsEnergy)      parts.push(`Parfait moment pour booster ton énergie du matin.`)
        else if (wantsWeight) parts.push(`Belle matinée pour bien démarrer ton alimentation.`)
      } else if (hr >= 21) {
        if (wantsSleep)       parts.push(`N'oublie pas ta routine du soir pour bien dormir.`)
        else                  parts.push(`Comment s'est passée ta journée ?`)
      }
      // Sans données (nouveau compte), tout ce qui précède est vide et il ne
      // restait que « Bonjour ! Qu'est-ce que je peux faire pour toi ? », la
      // phrase de n'importe quel chatbot, en guise de première impression
      // (retour Jean 2026-08-08). On ancre alors l'ouverture sur son objectif.
      if (parts.length === 1) {
        const obj = p.objectifs?.[0]
        parts.push(obj
          ? `On avance sur ton objectif : ${String(obj).toLowerCase()}. Par quoi on commence aujourd'hui ?`
          : `Raconte-moi ta journée, ce que tu as mangé, comment tu as dormi, ce qui te pèse. Je pars de là.`)
      } else {
        parts.push(`Qu'est-ce que je peux faire pour toi ?`)
      }
      return [{ role:'assistant', content: parts.join(' ') }]
    }
    return []
  })
  const [loading, setLoading]   = useState(false)
  const [onglet, setOnglet]     = useState(() => localStorage.getItem('vitacoach_onglet') || 'accueil')
  const [refreshKey, setRefreshKey] = useState(0)
  const [metriques, setMetriques] = useState(defaultMetriques)
  const [suggestions, setSuggestions] = useState([])
  const [reactions, setReactions]   = useState({})

  // « Photographie ton repas » depuis la vue Nutrition : bascule sur le chat
  // et ouvre directement le selecteur photo, meme geste que le bouton camera.
  useEffect(() => {
    const h = () => {
      setOnglet('chat')
      setTimeout(() => { try { document.querySelector('input[type=file][accept*=image]')?.click() } catch {} }, 350)
    }
    window.addEventListener('solenn:photo-repas', h)
    return () => window.removeEventListener('solenn:photo-repas', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Réponses rapides. Restaurées au démarrage à partir du dernier message de
  // Solenn : sans ça, rouvrir l'app faisait disparaître les chips, y compris
  // quand la dernière réponse posait une question (retour Jean 2026-08-08).
  const [followUps, setFollowUps]   = useState([])
  const [copiedIdx, setCopiedIdx]   = useState(null)
  const [kbOffset,  setKbOffset]    = useState(0)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const chatBoxRef = useRef(null)
  // Vrai tant que l'utilisateur n'a pas remonté le fil : conditionne l'auto-scroll
  const isAtBottomRef = useRef(true)
  // Vrai pendant un scroll déclenché par le code. Sans ce drapeau, le scroll
  // automatique du streaming déclenche onScroll, qui mesure la position AVANT
  // que le navigateur ait fini de peindre, en conclut que l'utilisateur a
  // remonté le fil, et coupe l'auto-scroll : la réponse continuait à s'écrire
  // hors de l'écran (retour Jean 2026-08-08).
  const autoScrollRef = useRef(false)
  const [celebrate, setCelebrate]   = useState(false)
  const celebInitRef = useRef(false)
  const [showHealthPerm, setShowHealthPerm] = useState(false)
  const healthPermShownRef = useRef(false)
  const [history, setHistory]     = useState(() => safeParse('vitacoach_history', []))
  const [notifEnabled, setNotifEnabled] = useState(() => safeParse('vitacoach_notif', false))

  // ── Morning check-in ────────────────────────────────────────────────────────
  const [showCheckin, setShowCheckin] = useState(() => {
    const hr = new Date().getHours()
    const lastCheckin = localStorage.getItem('vitacoach_checkin_date')
    const todayStr = new Date().toDateString()
    return hr >= 6 && hr < 11 && lastCheckin !== todayStr
  })
  // `useState('day')` etait le second point ou l'ambiance se dedoublait.
  //
  // homePreset est REMONTE par HomeTab, qui ne se monte que sur l'accueil.
  // Sur un demarrage qui n'y passe pas, et pendant les premieres frames de
  // celui qui y passe, il vaut donc 'day' pendant que la racine, elle, a
  // deja calcule la nuit. La barre du bas, l'en-tete, la signature et le
  // modal Sante partaient tous de cette valeur : ils s'affichaient en
  // couleurs de jour sur une app devenue navy.
  //
  // On part donc de l'heure, comme la racine, au lieu de partir de 'day'.
  const [homePreset, setHomePreset] = useState(() => getOceanPreset(new Date().getHours()))
  // Ambiance choisie à la main dans Réglages. Distincte de homePreset, qui est
  // l'ambiance COURANTE remontée par HomeTab : sans cette séparation le choix
  // de l'utilisateur était aussitôt écrasé par l'heure (bug signalé 2026-08-08).
  // L'ambiance choisie a la main est TEMPORAIRE : l'app reprend son deroule
  // ensuite. Regle posee par Jean le 2 septembre, en deux temps.
  //
  // D'abord : quelqu'un qui met la nuit un matin veut un ecran sombre
  // maintenant, pas une app bloquee en nuit jusqu'a ce qu'il y repense.
  //
  // Ensuite, et c'est ce qui a corrige ma premiere version : « si l'utilisateur
  // a 17h55 force la nuit il va s'enerver si 5 minutes apres l'app remet le
  // soleil ». Expirer a la prochaine bascule etait donc trop brutal.
  //
  // D'ou la regle finale, dans finDeChoixAmbiance : le choix tient jusqu'a la
  // fin de la fenetre qui contient l'heure du choix plus une heure.
  const [presetManuel, setPresetManuel] = useState(() => lireAmbianceManuelle())

  // L'AMBIANCE, une fois pour toutes. Le choix manuel prime sur le deroule
  // de l'heure, exactement comme dans HomeTab. Tout ce qui s'assombrit dans
  // l'app doit lire CETTE valeur, et rien d'autre : c'est en laissant deux
  // calculs coexister qu'on obtient une nav claire sur un fond sombre.
  const ambiance = presetManuel || homePreset

  // L'AMBIANCE DE TOUTE L'APP, et plus seulement de l'accueil.
  //
  // On pose l'attribut sur la racine du document : les variables de theme.css
  // en decoulent, et les 1 192 couleurs converties suivent sans qu'aucun
  // composant ne soit touche.
  //
  // La connexion et la page de vente s'en protegent par la classe
  // `theme-jour` : ce sont des portes d'entree, pas des ecrans de travail.
  useEffect(() => {
    const appliquer = () => {
      document.documentElement.setAttribute('data-theme', ambiance === 'night' ? 'night' : 'day')
      // La bande du haut du telephone, autour de l'heure et du reseau, est
      // peinte par `theme-color` et non par la page : html et body etaient
      // deja en navy, elle restait claire quand meme. Le jour garde sa valeur
      // d'origine, seule la nuit est nouvelle.
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', ambiance === 'night' ? '#0F1C3A' : '#C87B52')
      // L'heure avance meme quand personne ne regarde l'accueil : sans cette
      // ligne, l'app restait dans l'ambiance du dernier passage par l'accueil.
      setHomePreset(p => { const n = getOceanPreset(new Date().getHours()); return n === p ? p : n })
    }
    appliquer()
    // Meme cadence que l'expiration du choix manuel : l'ambiance doit basculer
    // a 21h sans qu'on ait a relancer l'app.
    const t = setInterval(appliquer, 60000)
    document.addEventListener('visibilitychange', appliquer)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', appliquer)
    }
  }, [ambiance])

  // L'expiration ne peut pas attendre le prochain demarrage de l'app :
  // quelqu'un qui force la nuit a 17h55 doit voir le coucher de soleil arriver
  // a 18h, ecran ouvert, sans rien faire. On revoit donc la validite chaque
  // minute, et au retour au premier plan, ou l'horloge a pu sauter d'un coup.
  useEffect(() => {
    if (!presetManuel) return
    const revoir = () => { if (!lireAmbianceManuelle()) setPresetManuel(null) }
    const t = setInterval(revoir, 60000)
    document.addEventListener('visibilitychange', revoir)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', revoir)
    }
  }, [presetManuel])

  // ── Célébrations mémorables ──────────────────────────────────────────────────
  const [milestone, setMilestone]       = useState(null)   // { emoji, titre, texte }
  const milestoneShownRef               = useRef(false)

  // ── Mode SOS ─────────────────────────────────────────────────────────────────
  const [sosMode, setSosMode]           = useState(false)
  const sosResetRef                     = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [forumFormOpen, setForumFormOpen] = useState(false)
  const [forumUnread, setForumUnread]     = useState(0)
  const contentRef = useRef(null)
  const messagesEndRef = useRef(null)
  const isSendingRef   = useRef(false)   // verrou anti-doublon
  const messagesRef    = useRef([])      // miroir de messages pour lectures hors-render
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimerRef = useRef(null)
  // Pull-to-refresh
  const pullStartY  = useRef(null)
  const pullDistRef = useRef(0)
  const [pullDist, setPullDist] = useState(0)
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const PULL_THRESHOLD = 72

  // ── Calculs gamification, mémoïsés, ne recalculent que si history/messages changent ──
  const streak = useMemo(() => {
    if (!history || history.length === 0) return 0
    const sorted = [...history].sort((a,b) => new Date(b.date) - new Date(a.date))
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0
    let count = 0, expected = sorted[0].date
    for (const e of sorted) {
      if (e.date === expected) {
        count++
        const d = new Date(expected); d.setDate(d.getDate() - 1); expected = d.toDateString()
      } else break
    }
    return count
  }, [history])

  const xp    = useMemo(() =>
    history.length * 15 + messages.filter(m => m.role === 'user').length * 5, [history, messages])

  const level = Math.floor(xp / 100) + 1

  // ─── Son global sur tous les boutons (event delegation) ──────────────────
  useEffect(() => {
    function onTap(e) {
      const el = e.target.closest('button, [role="button"]')
      if (!el || el.disabled) return
      if (el.closest('[data-no-sfx]')) return
      playFx('tap')
    }
    document.addEventListener('pointerdown', onTap, { passive: true })
    return () => document.removeEventListener('pointerdown', onTap)
  }, [])

  useEffect(() => { localStorage.setItem('vitacoach_onglet', onglet) }, [onglet])

  // Pré-warm Render dès le chargement de l'app
  useEffect(() => { fetch('/api/health').catch(() => {}) }, [])

  // Responsive
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const isMobile = windowWidth < 768

  // Clavier virtuel iOS, pousse la barre d'input vers le haut
  useEffect(() => {
    if (!window.visualViewport) return
    const update = () => {
      const off = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
      setKbOffset(Math.max(0, off))
    }
    window.visualViewport.addEventListener('resize', update)
    window.visualViewport.addEventListener('scroll', update)
    return () => {
      window.visualViewport.removeEventListener('resize', update)
      window.visualViewport.removeEventListener('scroll', update)
    }
  }, [])

  // Auto-scroll SEULEMENT si l'utilisateur est déjà en bas du fil. Sans cette
  // garde, chaque token du streaming relançait un scroll « smooth » : le geste
  // du doigt était annulé en continu et remonter la conversation devenait
  // impossible (retour Jean 2026-08-08). On écrit scrollTop directement plutôt
  // que scrollIntoView, qui déplace aussi les conteneurs parents.
  useEffect(() => {
    if (!isAtBottomRef.current) return
    const el = chatBoxRef.current
    autoScrollRef.current = true
    if (el) el.scrollTop = el.scrollHeight
    else messagesEndRef.current?.scrollIntoView({ behavior:'auto' })
    const t = setTimeout(() => { autoScrollRef.current = false }, 80)
    return () => clearTimeout(t)
  }, [messages])
  // ── Pause animations pendant le scroll ──────────────────────────────────────
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const onScroll = () => {
      setIsScrolling(true)
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 200)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(scrollTimerRef.current) }
  }, [])

  // ── Pull-to-refresh (iOS natif uniquement) ───────────────────────────────────
  useEffect(() => {
    const el = contentRef.current
    if (!el || !window?.Capacitor?.isNativePlatform?.()) return
    function onTouchStart(e) {
      if (el.scrollTop <= 0) pullStartY.current = e.touches[0].clientY
    }
    function onTouchMove(e) {
      if (pullStartY.current === null) return
      const dy = e.touches[0].clientY - pullStartY.current
      if (dy > 0) {
        const v = Math.min(dy * 0.45, PULL_THRESHOLD + 20)
        pullDistRef.current = v
        setPullDist(v)
      } else {
        pullStartY.current = null
        pullDistRef.current = 0
        setPullDist(0)
      }
    }
    function onTouchEnd() {
      if (pullStartY.current !== null && pullDistRef.current >= PULL_THRESHOLD) {
        setPullRefreshing(true)
        import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
          Haptics.impact({ style: ImpactStyle.Medium })
        }).catch(() => {})
        // Forcer le rechargement des données du tab courant
        setRefreshKey(k => k + 1)
        setTimeout(() => setPullRefreshing(false), 400)
      }
      pullStartY.current = null
      pullDistRef.current = 0
      setPullDist(0)
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onglet])

  // Scroll to last message when user navigates back to chat tab
  useEffect(() => {
    if (onglet === 'chat' && messages.length > 0) {
      const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior:'instant' }), 60)
      return () => clearTimeout(t)
    }
  }, [onglet])
  useEffect(() => {
    if (profil && messages.length > 0) {
      // Ne jamais sauvegarder les messages de limite dans l'historique
      // (et retirer les images : un data URL exploserait le quota localStorage)
      // Même filtre à l'enregistrement : un fragment interrompu ne doit pas
      // entrer dans l'historique, sinon il réapparaît à chaque ouverture.
      const toSave = messages
        .filter(m => {
          if (m.content?.includes('messages gratuits')) return false
          if (m.role !== 'assistant') return true
          const t = (m.content || '').trim()
          if (!t) return false
          return t.length >= 12 || /[.!?…:)]$/.test(t)
        })
        .map(({ image, ...m }) => m)
      localStorage.setItem('vitacoach_historique', JSON.stringify(toSave.slice(-50)))
    }
    messagesRef.current = messages
  }, [messages, profil])
  // L'instance Render est en plan Free : elle s'endort après inactivité et met
  // ~50 s à répondre au réveil. On la réveille dès l'ouverture de l'app, pour
  // qu'elle soit chaude quand le premier appel arrive (notamment
  // check-subscription au retour d'un paiement). Gratuit, aucun service tiers.
  useEffect(() => {
    fetch('https://solenn-api.onrender.com/ping', { mode: 'no-cors' }).catch(() => {})
  }, [])

  // Réponses rapides du dernier message, regénérées au démarrage. Elles ne sont
  // pas persistées avec la conversation : sans cet effet, rouvrir l'app laissait
  // la dernière question de Solenn sans aucun bouton pour y répondre.
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant' && last.content) setFollowUps(genFollowUps(last.content))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('subscribed') === 'true') {
      // Le statut Pro n'est JAMAIS accordé sur simple paramètre d'URL :
      // on stocke le session_id Stripe et l'effet check-subscription vérifie côté serveur.
      const sessionId = p.get('session_id')
      if (sessionId) localStorage.setItem('vitacoach_stripe_session', sessionId)
      window.history.replaceState({}, '', '/')
    }
  }, [])
  useEffect(() => {
    if (!user?.id) return
    const sessionId = localStorage.getItem('vitacoach_stripe_session')
    if (!sessionId) return
    ;(async () => {
      try {
        const r = await fetch(`/api/check-subscription?sessionId=${sessionId}&userId=${user.id}`,
          { headers: await authHeaders() })
        const data = await r.json()
        const actif = data?.active === true
        setIsPro(actif)
        localStorage.setItem('vitacoach_pro', JSON.stringify(actif))
        // Session périmée, annulée, ou appartenant à un autre compte : on
        // l'oublie. La garder bloquerait la révocation au prochain démarrage,
        // puisque l'effet de synchronisation s'abstient tant qu'une
        // vérification de paiement est en cours.
        if (!actif) localStorage.removeItem('vitacoach_stripe_session')
      } catch {}
    })()
  }, [user?.id])

  // Célébration quand score atteint 80+ (une fois par jour)
  useEffect(() => {
    if (!celebInitRef.current) { celebInitRef.current = true; return }
    const today = new Date().toDateString()
    const sc = scoreJour(metriques)
    if (sc >= 80 && localStorage.getItem('vitacoach_celebrated') !== today) {
      localStorage.setItem('vitacoach_celebrated', today)
      setTimeout(() => setCelebrate(true), 400)
    }
  }, [metriques])

  // ── Micro-célébrations streak milestones ─────────────────────────────────
  useEffect(() => {
    if (!profil || streak === 0) return
    const today = new Date().toDateString()
    const key = `vitacoach_streak_cel_${today}_${streak}`
    if (localStorage.getItem(key)) return
    const milestones = {
      3:  '3 jours de suite, tu prends de vraies habitudes. Fière de toi.',
      7:  "7 jours consécutifs ! Une semaine entière, c'est un vrai changement qui s'installe.",
      14: '14 jours ! Deux semaines de constance, c\'est vraiment impressionnant.',
      30: '30 jours ! Un mois de régularité. Tu n\'es plus la même qu\'au début.',
    }
    if (milestones[streak]) {
      localStorage.setItem(key, '1')
      setTimeout(() => setMessages(prev => [...prev, { role:'assistant', content: milestones[streak] }]), 900)
    }
  }, [streak, profil])

  // ── Sync Supabase → local à la connexion ──────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const today = new Date().toISOString().split('T')[0]

    getSupabase().then(supabase => {
      // Charger le profil depuis Supabase. ATTENTION AU SENS DU FLUX : la base
      // ne fait foi que si SA copie est complète. L'ancienne version écrasait
      // le profil local avec la ligne de la base quelle qu'elle soit : si la
      // sauvegarde vers la base avait échoué en silence (session expirée en
      // PWA, réseau), la base gardait une vieille ligne vide et chaque
      // ouverture de l'app EFFAÇAIT ce que l'utilisateur venait de remplir.
      // C'est le « je remplis mon profil et ça s'enlève » de Jean (2026-08-13).
      supabase.from('profils').select('profil').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          const base  = data?.profil
          const local = safeParse('vitacoach_profil', null)

          // L'abonnement se lit sur le compte, quel que soit l'etat du profil.
          // Avant, on ne savait qu'ACCORDER le Pro (jamais le retirer) et
          // seulement si le profil portait un nom : un `true` laisse sur
          // l'appareil par un compte precedent n'etait jamais dementi.
          // Exception : juste apres un paiement, le webhook n'a peut-etre pas
          // encore ecrit la ligne, on ne revoque pas tant que la verification
          // du paiement est en cours.
          const proBase = base?.isPro === true
          if (proBase) {
            setIsPro(true)
            localStorage.setItem('vitacoach_pro', JSON.stringify(true))
          } else if (!localStorage.getItem('vitacoach_stripe_session')) {
            setIsPro(false)
            localStorage.setItem('vitacoach_pro', JSON.stringify(false))
          }

          if (base?.nom) {
            // La base a un profil complet : elle fait foi.
            setProfil(base)
            localStorage.setItem('vitacoach_profil', JSON.stringify(base))
          } else if (local?.nom) {
            // La base est vide ou amputée mais l'appareil a un profil rempli :
            // c'est la base qu'on répare, jamais l'appareil qu'on vide.
            // Les champs d'abonnement sont preserves par syncProfilSupabase.
            syncProfilSupabase(user.id, local)
          }
          setProfilLoading(false)
        })

      // Charger les métriques du jour depuis Supabase
      supabase.from('user_metrics').select('*').eq('user_id', user.id).eq('date', today).maybeSingle()
        .then(({ data }) => {
          if (data) {
            const m = {
              date: new Date().toDateString(),
              pas: data.pas||0, sommeil: data.sommeil||0, eau: data.eau||0,
              fc: data.fc||0, humeur: data.humeur||0, poids: data.poids||0,
            }
            setMetriques(m)
            localStorage.setItem('vitacoach_metriques', JSON.stringify(m))
          }
        })
    })
  }, [user?.id])

  // Permission apps santé, affichée une seule fois au 1er lancement après profil
  useEffect(() => {
    if (!profil || healthPermShownRef.current) return
    if (localStorage.getItem('vitacoach_health_perm')) return
    healthPermShownRef.current = true
    const t = setTimeout(() => setShowHealthPerm(true), 1800)
    return () => clearTimeout(t)
  }, [profil])

  function allowHealth() {
    localStorage.setItem('vitacoach_health_perm', 'granted')
    setShowHealthPerm(false)
  }
  function laterHealth() {
    localStorage.setItem('vitacoach_health_perm', 'later')
    setShowHealthPerm(false)
  }

  // Suggestions dynamiques heure + profil + streak
  useEffect(() => {
    if (!profil) return
    const h = new Date().getHours()
    const isVege = profil.regimes?.some(r => /végé|vegan|vegetar/i.test(r))
    const obj0 = profil.objectifs?.[0] || ''
    const wantsWeight = /poids|mincir|maigrir/i.test(obj0)
    const wantsEnergy = /énergie|fatigue|sport/i.test(obj0)

    let base
    if (h < 10)      base = [
      `${isVege ? 'Petit-déj végé rapide ?' : 'Que manger ce matin ?'}`,
      wantsEnergy ? 'Routine matinale énergie ?' : 'Comment bien démarrer ma journée ?',
      'Mon score santé est comment ?'
    ]
    else if (h < 14) base = [
      wantsWeight ? 'Repas de midi léger et rassasiant ?' : 'Idée repas de midi ?',
      'Comment rester concentré cet après-midi ?',
      'Stretch rapide 5 min ?'
    ]
    else if (h < 19) base = [
      'Je suis épuisé, que faire ?',
      wantsWeight ? 'Collation sans culpabilité ?' : 'Collation saine ?',
      'Comment gérer mon stress maintenant ?'
    ]
    else             base = [
      'Routine du soir pour bien dormir ?',
      isVege ? 'Dîner végé rapide ?' : 'Que manger ce soir ?',
      'Comment me décompresser ?'
    ]

    // Streak en danger : soir + streak actif + aucune métrique loggée aujourd'hui
    const notLogged = !metriques.pas && !metriques.sommeil && !metriques.eau
    if (streak > 0 && h >= 19 && notLogged)
      setSuggestions([`Mon streak de ${streak} jour${streak > 1 ? 's' : ''} est en danger !`, ...base.slice(0, 2)])
    else
      setSuggestions(base)
  }, [profil, streak, metriques])

  // Génère les chips de suivi contextuel après chaque réponse IA
  function genFollowUps(reply) {
    const r = (reply || '').toLowerCase()
    if (/repas|manger|nutrition|recette|calorie|dîner|déjeuner|petit-déj/.test(r))
      return ['Et pour le dîner ?', 'Plan repas semaine ?', 'Les meilleurs snacks ?']
    if (/sommeil|dormir|nuit|insomnie|fatigue/.test(r))
      return ['Ma routine du soir ?', 'Pourquoi je dors mal ?', 'Sieste efficace ?']
    if (/sport|exercice|entraîn|muscul|cardio|running/.test(r))
      return ['Programme débutant ?', 'Récupération musculaire ?', 'Sport sans salle ?']
    if (/stress|anxiété|angoisse|anxieux|pression/.test(r))
      return ['Technique anti-stress rapide ?', 'Méditation pour débutant ?', 'Améliorer mon énergie ?']
    if (/peau|acné|hydrat|cosmétique|soin/.test(r))
      return ['Routine soin du visage ?', 'Aliments bons pour la peau ?']
    if (/plante|tisane|herbe|naturel|remède/.test(r))
      return ['Autres plantes pour moi ?', 'Tisane du soir ?']
    const h = new Date().getHours()
    if (h < 12) return ['Routine matinale ?', 'Booster mon énergie ?']
    if (h < 18) return ['Gérer la fatigue ?', 'Collation saine ?']
    return ['Routine du soir ?', 'Bien dormir ce soir ?']
  }

  // ── Mémoire longue durée ────────────────────────────────────────────────────
  function sauverMemoire(userMsg, reply) {
    const m = userMsg.toLowerCase()
    let topic = null
    if (/sommeil|dormir|insomni/.test(m))          topic = 'sommeil'
    else if (/stress|anxiété|anxieux|pression/.test(m)) topic = 'stress'
    else if (/douleur|mal (au|à la|aux)/.test(m))  topic = 'douleur'
    else if (/poids|kilos|maigrir|mincir/.test(m)) topic = 'poids'
    else if (/sport|exercice|entraîn|muscul/.test(m)) topic = 'fitness'
    else if (/nutrition|manger|repas|recette/.test(m)) topic = 'nutrition'
    else if (/fatigue|énergie|épuisé/.test(m))     topic = 'énergie'
    else if (/humeur|moral|déprim|triste/.test(m)) topic = 'humeur'
    else if (/peau|cheveux|acné/.test(m))           topic = 'beauté'
    else if (/plante|naturel|complément/.test(m))   topic = 'naturo'
    if (!topic) return
    const memories = safeParse('vitacoach_memories', [])
    const mem = { ts: Date.now(), date: new Date().toDateString(), topic, userMsg: userMsg.slice(0, 120), reply: reply.replace(/\|\|\|JSON\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, '').trim().slice(0, 150) }
    localStorage.setItem('vitacoach_memories', JSON.stringify([mem, ...memories].slice(0, 25)))
  }

  // ── Détection SOS ────────────────────────────────────────────────────────────
  function detectSOS(msg) {
    const sos = /\b(à bout|j'en peux plus|plus envie|tout lâcher|envie de rien|tellement triste|je pleure|vraiment mal|je crack|j'ai craqué|épuisé[e]? complètement|j'abandonne|plus la force|suicide|mourir|veux mourir|veux disparaître)\b/i
    if (sos.test(msg)) {
      setSosMode(true)
      clearTimeout(sosResetRef.current)
      sosResetRef.current = setTimeout(() => setSosMode(false), 10 * 60 * 1000) // reset après 10min
    }
  }

  // ── Milestones célébrés ──────────────────────────────────────────────────────
  const MILESTONES = [
    { id: 'streak7',   check: () => streak >= 7,    Icon: FireIcon,    titre: '7 jours de suite !',      texte: `${profil?.nom}, 7 jours consécutifs, c'est une vraie habitude qui se construit. Continue comme ça.` },
    { id: 'streak30',  check: () => streak >= 30,   Icon: StarIcon,    titre: 'Un mois de régularité !', texte: `30 jours. Tu as transformé des intentions en routine réelle. C'est rare et précieux.` },
    { id: 'steps10k',  check: () => metriques.pas >= 10000, Icon: WalkIcon, titre: '10 000 pas !',   texte: `Objectif pas atteint aujourd'hui, ton corps te remercie.` },
    { id: 'score100',  check: () => scoreJour(metriques) >= 95, Icon: SparkleIcon, titre: 'Score parfait !', texte: `Presque 100/100 aujourd'hui, sommeil, eau, mouvement, humeur : tout est là.` },
    { id: 'sleep8',    check: () => metriques.sommeil >= 8, Icon: MoonIcon, titre: '8h de sommeil !', texte: `8h de sommeil enregistrées, ton cerveau consolide, ton corps récupère.` },
    { id: 'water8',    check: () => metriques.eau >= 8, Icon: WaterIcon, titre: 'Hydratation parfaite !', texte: `8 verres d'eau aujourd'hui, c'est exactement ce qu'il faut.` },
  ]

  function checkMilestones() {
    if (milestoneShownRef.current) return
    const shown = safeParse('vitacoach_milestones_shown', [])
    const todayStr = new Date().toDateString()
    for (const m of MILESTONES) {
      const key = `${m.id}_${todayStr}`
      if (!shown.includes(key) && m.check()) {
        milestoneShownRef.current = true
        setMilestone(m)
        localStorage.setItem('vitacoach_milestones_shown', JSON.stringify([...shown, key].slice(-50)))
        setTimeout(() => { setMilestone(null); milestoneShownRef.current = false }, 5000)
        break
      }
    }
  }

  // ── Tendances semaine sur semaine ────────────────────────────────────────────
  function getTrends() {
    if (!history || history.length < 4) return null
    const now = Date.now()
    const DAY = 86400000
    const thisW  = history.filter(h => (now - new Date(h.date).getTime()) <= 7 * DAY)
    const lastW  = history.filter(h => { const d = now - new Date(h.date).getTime(); return d > 7*DAY && d <= 14*DAY })
    if (!thisW.length || !lastW.length) return null
    const avg = (arr, k) => arr.reduce((s, h) => s + (h[k] || 0), 0) / arr.length
    const delta = (k) => {
      const d = avg(thisW, k) - avg(lastW, k)
      return Math.abs(d) > 0.05 ? { delta: Math.round(d * 10) / 10, better: d > 0 } : null
    }
    return { sommeil: delta('sommeil'), pas: delta('pas'), humeur: delta('humeur'), eau: delta('eau') }
  }

  // ── Contexte enrichi pour l'IA ──────────────────────────────────────────────
  function buildContextHints() {
    const userText = messages.filter(m => m.role === 'user').slice(-8).map(m => m.content).join(' ')
    const topics = []
    if (/sommeil|dormir|insomni|fatigue/.test(userText))   topics.push('sommeil_concern')
    if (/stress|anxiété|anxieux|pression/.test(userText))  topics.push('stress_pattern')
    if (/poids|maigrir|mincir|kilos?/.test(userText))      topics.push('weight_goal')
    if (/sport|exercice|entraîn|muscul/.test(userText))    topics.push('fitness_focus')
    if (/repas|manger|nutrition|recette/.test(userText))   topics.push('nutrition_focus')

    // Mémoire longue durée
    const memories = safeParse('vitacoach_memories', [])
    const recentMems = memories.slice(0, 6).map(m => {
      const daysAgo = Math.round((Date.now() - m.ts) / 86400000)
      const quand = daysAgo === 0 ? "aujourd'hui" : daysAgo === 1 ? 'hier' : `il y a ${daysAgo}j`
      return `${quand} – ${m.topic}: "${m.userMsg.slice(0, 80)}"`
    })

    // Tendances
    const trends = getTrends()
    const trendLines = trends ? Object.entries(trends).filter(([,v]) => v).map(([k, v]) => {
      const labels = { sommeil: 'sommeil', pas: 'pas', humeur: 'humeur', eau: 'hydratation' }
      return `${labels[k]} ${v.better ? '↑' : '↓'} ${Math.abs(v.delta)} cette semaine vs la semaine dernière`
    }) : []

    return { topics, streak, todayScore: scoreJour(metriques), memories: recentMems, trends: trendLines }
  }

  function mettreAJourMetrique(key, val) {
    setMetriques(prev => {
      const newM = { ...prev, [key]: val }
      sauverMetriques(newM)
      // Sync Supabase (fire & forget)
      syncMetriquesSupabase(user?.id, newM)
      // Sauvegarde dans l'historique 30 jours
      const today = new Date().toDateString()
      const hist = safeParse('vitacoach_history', [])
      const filtered = hist.filter(h => h.date !== today)
      filtered.push({ ...newM, date: today })
      const sorted = filtered.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-30)
      localStorage.setItem('vitacoach_history', JSON.stringify(sorted))
      setHistory(sorted)
      return newM
    })
  }

  // ── Notifications Push ────────────────────────────────────────────────────
  async function activerNotifications() {
    // ── Application installee (App Store / Play Store) ───────────────────────
    // Les notifications WEB ne marchent pas ici : iOS ne les autorise que dans
    // un site ajoute a l'ecran d'accueil. Il faut APNs, via Capacitor. Ce
    // chemin se contentait d'un message : l'interrupteur ne faisait RIEN dans
    // l'app installee (Jean, 2026-08-14).
    if (window?.Capacitor?.isNativePlatform?.()) {
      const { demanderPushNatif } = await import('./hooks/useCapacitor.js')
      const ok = await demanderPushNatif(user?.id)
      if (ok) {
        setNotifEnabled(true)
        localStorage.setItem('vitacoach_notif', JSON.stringify(true))
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Je n'ai pas pu activer les rappels. Vérifie que les notifications sont autorisées pour Solenn dans les réglages de ton téléphone.`
        }])
        setOnglet('chat')
        setShowSettings(false)
      }
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Ton navigateur ne supporte pas les notifications push.')
      return
    }
    try {
      // Enregistre le service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Demande la permission
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return

      // Récupère la clé VAPID publique
      const { key } = await fetch('/api/vapid-public-key').then(r => r.json())
      const appServerKey = urlBase64ToUint8Array(key)

      // Crée la subscription
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      })

      // Envoie la subscription au serveur avec métadonnées profil
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userId: user?.id,
          profil: { nom: profil?.nom, objectifs: profil?.objectifs },
          streak,
          score: scoreJour(metriques),
        })
      })

      setNotifEnabled(true)
      localStorage.setItem('vitacoach_notif', JSON.stringify(true))

      // Notif de bienvenue personnalisée
      const todayScore = scoreJour(metriques)
      const nomFmt = profil?.nom ? profil.nom.charAt(0).toUpperCase() + profil.nom.slice(1).toLowerCase() : 'toi'
      const streakMsg = streak > 1 ? ` ${streak} jours de streak actif 🔥` : ''
      const scoreHint = todayScore > 0 ? ` Score d'aujourd'hui : ${todayScore}/100.` : ''
      reg.showNotification('Solenn activé !', {
        body: `Salut ${nomFmt} !${streakMsg}${scoreHint} Tes rappels quotidiens sont prêts.`,
        icon: '/icon-192.png',
        tag: 'welcome',
      })
    } catch (e) {
      console.error('Push error:', e)
    }
  }

  async function desactiverNotifications() {
    // Application installee : on retire le jeton de CET appareil cote serveur.
    if (window?.Capacitor?.isNativePlatform?.()) {
      try {
        await fetch('/api/push-native-unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
          body: JSON.stringify({ userId: user?.id }),
        })
      } catch {}
      setNotifEnabled(false)
      localStorage.setItem('vitacoach_notif', JSON.stringify(false))
      return
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push-unsubscribe', {
            method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
            // L'IDENTIFIANT DU COMPTE, pas le prenom. L'abonnement est
            // enregistre sous user.id ; envoyer le prenom ici visait une cle
            // qui n'existe pas, la ligne survivait cote serveur et les rappels
            // continuaient d'arriver apres les avoir coupes (2026-08-14).
            body: JSON.stringify({ userId: user?.id, endpoint: sub.endpoint })
          })
          await sub.unsubscribe()
        }
      }
    } catch {}
    setNotifEnabled(false)
    localStorage.setItem('vitacoach_notif', JSON.stringify(false))
  }

  // ── Lenis ne doit JAMAIS tourner dans l'app connectée ──────────────────────
  // (html.lenis { height:auto } casse le layout à scroll interne, bas des
  // pages coupé sur mobile). Détruit si la session a démarré déconnectée.
  useEffect(() => {
    if (!user) return
    try {
      window.__solennLenis?.destroy?.()
      window.__solennLenis = null
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped')
    } catch {}
  }, [user])

  // ── Message matinal proactif (agent morning-brief, généré à 06:45) ─────────
  // Affiché comme message de Solenn dans le chat, une fois par jour.
  useEffect(() => {
    if (!user?.id || !profil) return
    const key = 'vitacoach_morning_' + new Date().toDateString()
    if (localStorage.getItem(key)) return
    ;(async () => {
      try {
        const res = await fetch(`/api/morning-message?userId=${user.id}`, { headers: await authHeaders() })
        const data = await res.json()
        if (data?.message) {
          localStorage.setItem(key, '1')
          setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        }
      } catch {}
    })()
  }, [user?.id, profil])

  // Ouvre le portail d'abonnement Stripe : resilier, changer de carte, voir
  // ses factures. Sans lui, « Membre Pro » etait un encart mort et l'abonne
  // n'avait aucun moyen de resilier, ni conforme aux magasins, ni a
  // l'article L215-1-1 du code de la consommation (2026-08-14).
  // Le bouton Membre Pro ouvre les Parametres, dont la section
  // « Mon Abonnement » porte desormais le detail et la resiliation. Une
  // feuille flottante par-dessus les Parametres etait une mauvaise idee :
  // mauvaise place, et rendu bancal (Jean, 2026-08-14).
  function gererAbonnement() {
    setShowSettings(true)
  }

  async function passerPro(plan) {
    // Souvent appelé via onClick : le 1er argument peut être l'event → filtrer
    const planKey = plan === 'monthly' ? 'monthly' : 'annual'
    // Conformité stores (Apple 3.1.1 / Google Play Billing) : aucun checkout
    // Stripe embarqué dans les builds natifs. L'abonnement se gère sur le web,
    // le statut Pro est synchronisé via Supabase au prochain chargement.
    if (window?.Capacitor?.isNativePlatform?.()) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Pour passer à Solenn Pro, rends-toi sur meet-solenn.com depuis un navigateur. Ton compte sera synchronisé automatiquement ici.`
      }])
      setOnglet('chat')
      return
    }
    // Réveil de Render pendant que l'utilisateur saisit sa carte : au retour de
    // Stripe, check-subscription répond tout de suite au lieu d'attendre le
    // démarrage à froid de l'instance Free.
    fetch('https://solenn-api.onrender.com/ping', { mode: 'no-cors' }).catch(() => {})
    try {
      const res = await fetch('/api/create-checkout', {
        method:'POST', headers:{'Content-Type':'application/json', ...(await authHeaders())},
        body: JSON.stringify({ userId:user?.id, email:user?.email, plan: planKey, ref: localStorage.getItem('vitacoach_ref') || undefined })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      // Stripe pas encore configuré, silencieux
    } catch {}
  }

  // ── Photo de repas → analyse vision + mémoire nutritionnelle ───────────────
  async function envoyerPhotoRepas(dataUrl) {
    if (isSendingRef.current) return
    if (!hasFullAccess && getMsgCount() >= FREE_LIMIT) {
      setMessages(prev => [...prev, { role:'assistant', content:`Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Solenn Pro pour des analyses illimitées !` }])
      return
    }
    isSendingRef.current = true
    isAtBottomRef.current = true
    setMessages(prev => [...prev, { role:'user', content:'', image: dataUrl }])
    setLoading(true)
    if (!hasFullAccess) incrementMsgCount()
    try {
      const heure = new Date().getHours()
      const moment = heure < 11 ? 'petit-dej' : heure < 15 ? 'dejeuner' : heure < 18 ? 'snack' : 'diner'
      const resp = await fetch('/api/analyser-repas', {
        method:'POST', headers:{ 'Content-Type':'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ userId: user?.id, image: dataUrl, moment }),
      })
      const data = await resp.json()
      setMessages(prev => [...prev, { role:'assistant', content: data.message || data.error || `Je n'ai pas réussi à analyser cette photo, tu peux réessayer ?` }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:`Je n'ai pas réussi à analyser la photo, vérifie ta connexion et réessaie.` }])
    } finally {
      setLoading(false)
      isSendingRef.current = false
    }
  }

  async function envoyerMessage(msg, affichage = null) {
    if (!msg?.trim()) return
    if (isSendingRef.current) return     // verrou : un seul envoi à la fois
    isSendingRef.current = true

    // Warning quand il ne restera qu'un message après cet envoi
    if (!hasFullAccess && getMsgCount() === FREE_LIMIT - 2) {
      // On laisse passer mais on avertit
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Plus qu'un message gratuit aujourd'hui. Passe à **Solenn Pro** pour des échanges illimités, 44,99€/an (soit 3,75€/mois), résiliable à tout moment.`
        }])
      }, 800)
    }

    if (!hasFullAccess && getMsgCount() >= FREE_LIMIT) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.content?.includes('messages gratuits')) return prev
        return [...prev, { role:'assistant', content:`Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Solenn Pro pour des conseils illimités !` }]
      })
      isSendingRef.current = false
      return
    }
    isAtBottomRef.current = true   // on redescend toujours sur SON propre message
    setMessages(prev => [...prev, { role:'user', content: msg, affichage }])
    setLoading(true)
    if (!hasFullAccess) incrementMsgCount()
    detectSOS(msg)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const resp = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ message: msg, user_id: user?.id, profil, historique: messages.slice(-14).filter(m => m.content), metriques, context_hints: buildContextHints() }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      // Quota serveur atteint → aligner le compteur local et afficher l'offre Pro
      if (resp.status === 429) {
        localStorage.setItem('vitacoach_msg_count', JSON.stringify({ date: new Date().toDateString(), count: FREE_LIMIT }))
        setMessages(prev => [...prev, { role:'assistant', content:`Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Solenn Pro pour des conseils illimités !` }])
        setLoading(false)
        isSendingRef.current = false
        return
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      // ── Streaming SSE ──────────────────────────────────────────────────────
      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf      = ''
      let reply    = ''
      let started  = false

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break outer
          try {
            const token = JSON.parse(raw)
            if (!token) continue
            reply += token
            if (!started) {
              // Premier token → masquer "réfléchit…" et ajouter la bulle
              setMessages(prev => [...prev, { role: 'assistant', content: sansMarqueur(reply) }])
              setLoading(false)
              started = true
            } else {
              setMessages(prev => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: sansMarqueur(reply) }
                return copy
              })
            }
          } catch { /* token non parsable, on ignore */ }
        }
      }

      if (!started) {
        // Flux vide, message de fallback
        setMessages(prev => [...prev, { role: 'assistant', content: "Désolée, je n'ai pas pu répondre. Réessaie !" }])
        setLoading(false)
      } else if (reply.trim().length < 12 && !/[.!?…:)]$/.test(reply.trim())) {
        // Flux interrompu en cours de route : on ne garde PAS le fragment reçu,
        // il resterait affiché tel quel (« ta », « Commence ta ») et serait même
        // enregistré dans l'historique. On le remplace par un message clair.
        setMessages(prev => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: "Ma réponse a été coupée. Tu peux me redemander ?" }
          }
          return copy
        })
        setLoading(false)
      }
      if (reply) {
        // ── Réponses rapides interactives émises par Solenn ────────────────
        // Format : |||CHOIX|||["Oui","Plus tard"]|||END||| en fin de réponse.
        // On les extrait en chips tapables et on les retire du texte affiché.
        let choix = null
        const mChoix = reply.match(/\|\|\|CHOIX\|\|\|([\s\S]*?)\|\|\|END\|\|\|\s*$/)
        if (mChoix) {
          try {
            const arr = JSON.parse(mChoix[1])
            if (Array.isArray(arr) && arr.length) choix = arr.slice(0, 3).map(String)
          } catch {}
          reply = reply.replace(/\|\|\|CHOIX\|\|\|[\s\S]*?\|\|\|END\|\|\|\s*$/, '').trimEnd()
          setMessages(prev => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: reply }
            return copy
          })
        }
        setFollowUps(choix || genFollowUps(reply))
        sauverMemoire(msg, reply)
        checkMilestones()
        // Sauvegarde Supabase de la conversation (fire & forget)
        if (user?.id) {
          setTimeout(async () => {
            fetch('/api/chat-save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
              body: JSON.stringify({ userId: user.id, messages: messagesRef.current }),
            }).catch(() => {})
          }, 500)
        }
      }

    } catch(err) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: "La réponse a pris trop longtemps. Réessaie !" }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Une erreur est survenue. Réessaie.' }])
      }
      setLoading(false)
    } finally {
      isSendingRef.current = false   // libère le verrou
    }
  }

  // ── LANDING / FORUM ────────────────────────────────────────────────────────
  const [showAuth, setShowAuth] = useState(() => sessionStorage.getItem('solenn_page') === 'auth')
  const [showForum, setShowForum] = useState(false)

  function goToAuth() {
    sessionStorage.setItem('solenn_page', 'auth')
    setShowAuth(true)
  }
  function goToLanding() {
    sessionStorage.removeItem('solenn_page')
    setShowAuth(false)
  }

  if (showForum) return <Suspense fallback={<GlowLoader fullPage />}><Forum onBack={() => setShowForum(false)} user={user} profil={profil} /></Suspense>
  if (!user && !showAuth && !isMobile) return (
    <Suspense fallback={<GlowLoader fullPage />}>
      {/* `onForum` est le SEUL chemin vers le forum. Landing ne l'utilise pas
          aujourd'hui : c'est volontaire, le forum est retire du lancement.
          Rebrancher un bouton dessus le reactive, mais lire d'abord le
          commentaire de NAV_ITEMS : la declaration Play Console devra suivre. */}
      <Landing onCommencer={goToAuth} onForum={() => setShowForum(true)} />
    </Suspense>
  )

  // ── AUTH ────────────────────────────────────────────────────────────────────
  if (!user) return (
    <Suspense fallback={<GlowLoader fullPage />}>
      <Auth
        onConnecte={u => {
          sessionStorage.removeItem('solenn_page')
          setUser(u)
          localStorage.setItem('vitacoach_user', JSON.stringify(u))
          const profilLocal = safeParse('vitacoach_profil', null)
          if (!profilLocal) {
            setProfilLoading(true)
          } else {
            syncProfilSupabase(u.id, profilLocal)
          }
        }}
        onBack={goToLanding}
      />
    </Suspense>
  )

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  if (profilLoading) return <GlowLoader fullPage />
  if (!profil) {
    return (
      <Suspense fallback={<GlowLoader fullPage />}>
      <Onboarding onBack={async () => {
        const sb = await getSupabase()
        await sb.auth.signOut()
        localStorage.removeItem('vitacoach_user')
        localStorage.removeItem('vitacoach_profil')
        oublierAbonnement()
        setUser(null); setProfil(null); setIsPro(false)
      }} onTermine={p => {
        // Attribution influence, rattachée une seule fois, à l'inscription
        const refSource = localStorage.getItem('vitacoach_ref')
        if (refSource) p = { ...p, refSource }
        setProfil(p)
        
        localStorage.setItem('vitacoach_profil', JSON.stringify(p))
        syncProfilSupabase(user?.id, p)
        const h2 = new Date().getHours()
        const g2 = h2 < 6 ? 'Bonsoir' : h2 < 12 ? 'Bonjour' : h2 < 18 ? 'Salut' : 'Bonsoir'
        const nomFmt = p.nom ? p.nom.charAt(0).toUpperCase() + p.nom.slice(1).toLowerCase() : ''
        const introParts = [`${g2} ${nomFmt} !`]
        // Empathie selon le déclencheur
        const triggerMap = {
          'J\'ai atteint mes limites':      'Je sais que tu traverses une période chargée.',
          'Je veux tourner une page':       'Tourner une page, c\'est déjà une belle décision.',
          'Pure curiosité':                 'La curiosité, c\'est souvent là que tout commence.',
          'Ma vie est en train de changer': 'Les périodes de changement, c\'est là où tout peut se jouer.',
        }
        if (p.declencheur && triggerMap[p.declencheur]) introParts.push(triggerMap[p.declencheur])
        // Objectif principal
        const objMap = {
          'Retrouver mon énergie':          'On va retrouver cet élan ensemble.',
          'Me réconcilier avec mon corps':  'On va travailler l\'équilibre, sans pression.',
          'Dormir enfin comme il faut':     'On va s\'attaquer à ton sommeil en profondeur.',
          'Retrouver ma sérénité':          'On va réduire ce que tu portes mentalement.',
          'Reprendre le mouvement':         'On va construire une routine qui te ressemble vraiment.',
          'Manger sans culpabiliser':       'On va reconstruire un rapport sain avec la bouffe.',
        }
        const obj0 = p.objectifs?.[0] || p.objectif
        if (obj0 && objMap[obj0]) introParts.push(objMap[obj0])
        else introParts.push('On va construire quelque chose de vraiment adapté à toi.')
        // Conditions de santé, reconnaissance discrète
        const santeConditions = p.sante_conditions || []
        const hasConditions = p.sante && santeConditions.length > 0 &&
          !santeConditions.includes('Tout va bien de ce côté') &&
          !santeConditions.includes('Aucune condition particulière')
        if (hasConditions) introParts.push('J\'ai bien noté ce que tu vis côté santé, je vais en tenir compte dans tout ce que je te propose.')
        // Moment préféré, engagement
        const momentMap = {
          'Le matin':    'Je serai là pour bien commencer tes journées.',
          'En journée':  'Je serai disponible pour tes pauses.',
          'Le soir':     'Je serai là le soir pour t\'aider à décompresser.',
          'La nuit':     'Je respecte ton rythme, on travaille à ton heure.',
        }
        if (p.moment_prefere && momentMap[p.moment_prefere]) introParts.push(momentMap[p.moment_prefere])
        // Question d'ouverture selon la baseline
        const baselineQ = {
          'À bout, vraiment':        'Dis-moi, qu\'est-ce qui pèse le plus en ce moment ?',
          'Ça fait le job':          'Par quoi tu veux qu\'on commence ?',
          'Bien, mais j\'aspire à plus': 'C\'est quoi la première chose que tu veux changer ?',
          'Au top !':                'On maintient cet élan ? Qu\'est-ce qu\'on travaille en premier ?',
        }
        introParts.push((p.baseline && baselineQ[p.baseline]) || 'Par quoi on commence ?')
        setMessages([{ role:'assistant', content: introParts.join(' ') }])
        // Paywall d'onboarding « 21 jours offerts », une seule fois
        if (!localStorage.getItem('vitacoach_paywall_vu')) setShowPaywall(true)
      }} />
      </Suspense>
    )
  }

  // ── PAYWALL POST-ONBOARDING, « 21 jours offerts » ─────────────────────────
  if (showPaywall && !isPro) {
    return (
      <Suspense fallback={<GlowLoader fullPage />}>
        <PaywallOffre
          nom={profil?.nom}
          isNative={!!window?.Capacitor?.isNativePlatform?.()}
          onStart={() => { localStorage.setItem('vitacoach_paywall_vu', '1'); setShowPaywall(false) }}
          onSubscribe={(plan) => { localStorage.setItem('vitacoach_paywall_vu', '1'); passerPro(plan) }}
        />
      </Suspense>
    )
  }

  // ── MAIN APP ════════════════════════════════════════════════════════════════
  const score = scoreJour(metriques)
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? 'var(--or-plein)' : '#ef4444'

  // L'encre de la barre laterale suit le theme. Elle etait figee en brun
  // profond, ce qui donnait 2,41:1 sur le navy, donc illisible.
  //
  // Cette ligne portait `&& onglet === 'accueil'`, la meme garde que isNight,
  // et je l'ai oubliee en retirant l'autre. Elle datait du temps ou seul
  // l'accueil s'assombrissait. Depuis que la nuit couvre toute l'app, elle
  // produisait l'inverse du bug qu'elle evitait : la nav repassait en couleurs
  // de jour des qu'on quittait l'accueil, alors que le fond restait navy.
  // C'est de la que venait « Rappels actives » en vert sombre sur le navy.
  const nuitNav       = ambiance === 'night'
  const navEncre      = nuitNav ? 'rgba(190,216,255,0.95)' : ENCRE
  const navIcone      = nuitNav ? 'rgba(190,216,255,0.78)' : ICONE
  const navIconeOff   = nuitNav ? 'rgba(190,216,255,0.55)' : 'rgba(var(--rgb-terracotta), 0.48)'
  const navAccent     = nuitNav ? 'rgba(160,200,255,0.95)' : 'var(--accent)'
  const navTrait      = nuitNav ? 'rgba(160,200,255,0.20)' : 'rgba(var(--rgb-terracotta), 0.14)'
  // Vert « rappels actifs » : #22c55e ne donnait que 1,66:1 sur le creme.
  const navVert       = nuitNav ? 'rgba(134,239,172,0.95)' : '#166534'   // 4,87:1 mesure


  const navItems = [
    { id:'accueil',    Icon: HomeIcon,       label:'Accueil' },
    { id:'chat',       Icon: ChatIcon,       label:'Solenn' },
    { id:'routine',    Icon: RoutineIcon,    label:'Programmes' },
    { id:'sante',      Icon: HeartIcon,      label:'Progrès' },
    // Quatre onglets maximum : au-delà, les libellés deviennent illisibles sur
    // un écran de téléphone. Style, Respiration et Cycle sont des outils qu'on
    // ouvre ponctuellement, ils vivent dans la rangée « Tes outils » de
    // l'Accueil, pas dans la barre.
    // Forum retiré du lancement (décision 2026-07-21), code conservé, réactivable ici
  ]

  const outils = [
    { id:'style',      Icon: StyleIcon,      label:'Style' },
    { id:'breathwork', Icon: BreathworkIcon, label:'Respiration' },
    ...(profil?.cycle ? [{ id:'cycle', Icon: CycleIcon, label:'Cycle' }] : []),
  ]

  return (
    <div style={s.app}>
      {/* ── Morning Check-in ── */}
      <AnimatePresence>
        {/* !profilLoading est INDISPENSABLE. Le check-in lit profil.nom, qui au
            demarrage vient du stockage local, donc potentiellement du compte
            PRECEDENT tant que la base n'a pas repondu. Jean a vu « BONJOUR SAM »
            sur un compte nomme Camille (2026-09-01). Sur un telephone partage,
            c'est le prenom de quelqu'un d'autre qui s'affiche. */}
        {showCheckin && profil && !profilLoading && (
          <Suspense fallback={null}>
          <MorningCheckin
            profil={profil}
            onDone={({ sommeil, humeur, intention }) => {
              localStorage.setItem('vitacoach_checkin_date', new Date().toDateString())
              setShowCheckin(false)
              // Mise à jour métriques
              if (sommeil) mettreAJourMetrique('sommeil', sommeil)
              if (humeur)  mettreAJourMetrique('humeur', humeur)
              // Envoyer à Solenn avec contexte check-in
              const intentionTxt = intention ? ` Mon intention du jour : ${intention}.` : ''
              const msg = `Check-in matin : j'ai dormi ${sommeil}h, humeur ${humeur}/5.${intentionTxt} Donne-moi un focus pour aujourd'hui.`
              setOnglet('chat')
              setTimeout(() => envoyerMessage(msg), 400)
            }}
            onSkip={() => {
              localStorage.setItem('vitacoach_checkin_date', new Date().toDateString())
              setShowCheckin(false)
            }}
          />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ── Milestone Célébration ── */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            key="milestone"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)', left: '50%', transform: 'translateX(-50%)',
              zIndex: 900, background: 'rgba(30,15,5,0.85)',
              backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
              border: '1.5px solid rgba(var(--rgb-creme-dore), 0.28)',
              borderRadius: 22, padding: '16px 24px', minWidth: 280, maxWidth: 340,
              boxShadow: '0 12px 40px rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
              {milestone.Icon && <milestone.Icon size={34} color="var(--ambre-fonce)" />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(var(--rgb-creme-rose), 0.92)', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>
              {milestone.titre}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(var(--rgb-creme-rose), 0.70)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}>
              {milestone.texte}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOS Mode indicator ── */}
      {sosMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
            background: 'linear-gradient(90deg, rgba(80,120,200,0.15), rgba(100,140,220,0.10))',
            borderBottom: '1px solid rgba(100,140,220,0.20)',
            padding: '10px 20px',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 12, color: ENCRE, fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
            Solenn est là pour toi, prends le temps qu'il faut
          </span>
          <button onClick={() => setSosMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.4, marginLeft: 4 }}>✕</button>
        </motion.div>
      )}


      {/* ── Settings Sheet ── */}
      <AnimatePresence>
        {showSettings && profil && (
          <Suspense fallback={null}>
          <SettingsSheet
            authHeaders={authHeaders}
            profil={profil}
            preset={ambiance}
            notifsEnabled={notifEnabled}
            isPro={isPro}
            onPasserPro={passerPro}
            msgsRestants={hasFullAccess ? null : Math.max(0, FREE_LIMIT - getMsgCount())}
            trialDaysLeft={isFreeTrial ? Math.max(0, ESSAI_JOURS - Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)) : null}
            userId={user?.id}
            onMetriqueUpdate={mettreAJourMetrique}
            onClose={() => setShowSettings(false)}
            onSaveProfil={async (updated) => {
              setProfil(updated)
              localStorage.setItem('vitacoach_profil', JSON.stringify(updated))
              if (user?.id) await syncProfilSupabase(user.id, updated)
            }}
            onPresetChange={p => {
              setPresetManuel(p); setHomePreset(p)
              poserAmbianceManuelle(p)
              setShowSettings(false)
            }}
            onToggleNotifs={() => notifEnabled ? desactiverNotifications() : activerNotifications()}
            onResetMemoire={() => {
              localStorage.removeItem('vitacoach_memories')
              setShowSettings(false)
            }}
            onExportData={() => {
              const data = {
                profil,
                metriques,
                history: safeParse('vitacoach_history', []),
                memories: safeParse('vitacoach_memories', []),
                exportedAt: new Date().toISOString(),
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `solenn-data-${new Date().toISOString().split('T')[0]}.json`
              a.click(); URL.revokeObjectURL(url)
            }}
          />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ── Chat History Sheet ── */}
      <AnimatePresence>
        {showChatHistory && user?.id && (
          <Suspense fallback={null}><ChatHistory
            userId={user.id}
            onClose={() => setShowChatHistory(false)}
            onLoadSession={msgs => {
              // Même filtre que partout ailleurs : une conversation archivée
              // peut contenir des fragments de réponses interrompues.
              setMessages((msgs || []).filter(m => {
                if (m.role !== 'assistant') return true
                const t = (m.content || '').trim()
                return t && (t.length >= 12 || /[.!?…:)]$/.test(t))
              }))
              // Les réactions sont indexées par position dans la liste : sans
              // remise à zéro, les pouces levés de la conversation en cours se
              // reposaient au hasard sur les messages de celle qu'on ouvre.
              setReactions({})
              setCopiedIdx(null)
              setFollowUps([])
              setShowChatHistory(false)
            }}
          /></Suspense>
        )}
      </AnimatePresence>

      {/* ══ GLOBAL BACKGROUND ══════════════════════════════════════════════
           Un seul dégradé, SANS mixBlendMode. Le fond était auparavant composé
           de deux halos (#FFF991 à .6 et #FF7112 à .3) en mixBlendMode:multiply
           par-dessus var(--fond). Ce rendu est correct sur navigateur de bureau,
           mais iOS applique mal, voire ignore, le mode multiply en PWA
           installée : les deux calques se posaient alors en simple
           semi-transparence, ce qui pâlissait le fond et le faisait virer au
           rose. C'est le fond rose que Jean voyait alors que le code semblait
           juste (diagnostiqué le 2026-08-08 en comparant une planche de test).

           Les couleurs ci-dessous sont le résultat EXACT du calcul multiply
           d'origine, figé en dur : rendu identique partout, aucune dépendance à
           un mode de fusion. Ne pas réintroduire de mixBlendMode ici. */}
      <div style={{
        position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
        // Les trois teintes passent en variables : c'est le halo qui remplit
        // TOUT l'ecran derriere les onglets. Sans lui, la nuit n'etait
        // qu'un texte bleu clair pose sur un fond reste orange.
        background:'radial-gradient(circle at center, var(--halo-1) 0%, var(--halo-2) 35%, var(--halo-3) 70%, var(--fond) 100%)',
      }} />

      {/* ══ AURORA, plein écran fixe, actif uniquement sur l'onglet chat ══ */}
      {onglet === 'chat' && <div className="aurora-bg" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />}

      {/* ══ SIDEBAR (desktop) ══ */}
      {!isMobile && (
        <aside style={s.sidebar} data-lenis-prevent>
          <style>{`@keyframes dotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.35)}}`}</style>

          {/* Logo */}
          <div style={{ marginBottom:'1rem', paddingBottom:'1rem', borderBottom:`1px solid ${navTrait}` }}>
            <span style={{ fontSize:26, fontWeight:400, letterSpacing:'-0.05em', fontFamily:"'Cormorant Garamond',Georgia,serif", fontStyle:'italic', color: navEncre }}>Solenn</span>
            <span style={{ fontSize:9, fontWeight:400, color: navEncre, letterSpacing:'0.4px', marginTop:1, fontFamily:"'Poppins',system-ui,sans-serif", fontStyle:'italic', display:'block' }}>
              {signatureSolenn(ambiance)}
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {navItems.map(({ id, Icon, label }) => {
              const active = onglet === id
              const color = active ? navAccent : navIconeOff
              return (
                <button key={id} style={{ ...(active ? s.navActive : s.nav), color: navEncre }} onClick={() => setOnglet(id)}>
                  <Icon color={color} size={18} />
                  <span>{label}</span>
                  {id === 'sante' && score > 0 && (
                    <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color: scoreColor, background: scoreColor+'18', borderRadius:12, padding:'2px 7px' }}>{score}</span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bas de sidebar */}
          <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:`1px solid ${navTrait}`, display:'flex', flexDirection:'column', gap:5 }}>
            <div style={s.profileCard}>
              <div style={s.avatar}>{profil.nom?.charAt(0).toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ ...s.profileName, color: navEncre }}>{profil.nom}</div>
                {profil.objectifs?.[0] && <div style={{ ...s.profileMeta, color: navEncre }}><TargetIcon size={13} color={navIcone} /> {profil.objectifs[0]}</div>}
              </div>
            </div>
            {!isPro && <button style={{ ...s.btnPro, color: navEncre }} onClick={() => passerPro('annual')}><StarIcon size={12} color={navIcone} /> Solenn Pro · 44,99€/an</button>}
            {/* Un seul comportement pour tous les abonnes. J'avais d'abord
                masque le bouton pour les acces Pro poses a la main : resultat,
                un encart qui ressemble a un bouton et ne repond pas quand on
                clique dessus (Jean, 2026-08-14). La page sait desormais
                expliquer ce cas elle-meme. */}
            {isPro && (
              <button onClick={gererAbonnement}
                style={{ ...s.proBadge, width:'100%', cursor:'pointer',
                         display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <StarIcon size={14} color="#fbbf24" />
                Membre Pro
              </button>
            )}
            <button style={{ ...s.btnEdit, background: notifEnabled ? 'rgba(34,197,94,0.10)' : 'rgba(0,0,0,0.04)', color: notifEnabled ? navVert : navEncre, border: notifEnabled ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:6 }} onClick={notifEnabled ? desactiverNotifications : activerNotifications}>
              {notifEnabled ? <><BellIcon size={15} color={navVert} /> Rappels activés</> : <><BellOffIcon size={15} color={navEncre} /> Activer les rappels</>}
            </button>
            {/* « Modifier ton profil » retire le 2026-08-14, meme raison que dans
                le menu mobile le 2026-08-12 : il appelait exactement la meme
                chose que « Parametres » juste en dessous, setShowSettings(true).
                Le correctif du 12 n'avait touche QUE le menu mobile, la barre
                laterale du bureau gardait le doublon (releve par Jean).
                Le profil se modifie depuis le bloc en haut des Parametres, qui
                a deja son bouton Modifier. */}
            {/* Paramètres + Déconnexion côte à côte */}
            <div style={{ display:'flex', gap:5 }}>
              <button style={{...s.btnEdit, flex:1, color: navEncre, display:'flex', alignItems:'center', justifyContent:'center', gap:5}} onClick={() => setShowSettings(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={navEncre} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Paramètres
              </button>
              <button onClick={async () => {
                const sb = await getSupabase()
                await sb.auth.signOut()
                localStorage.removeItem('vitacoach_user')
                localStorage.removeItem('vitacoach_profil')
                oublierAbonnement()
                setUser(null); setProfil(null); setIsPro(false)
              }} style={{...s.btnEdit, flex:1, color: navEncre, display:'flex', alignItems:'center', justifyContent:'center', gap:5}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={navEncre} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ══ MAIN ══ */}
      <main style={{ ...s.main, marginLeft: isMobile ? 0 : 260 }}>
        {/* Accueil : padding bas 0, le ciel de HomeTab doit toucher le bord de
            l'écran (le padding 130 laissait une bande abricot sous le ciel).
            Chat : overflow hidden, SEULE la zone de messages scrolle, la barre
            de saisie ne bouge jamais (retours Jean 2026-07-25). */}
        <div ref={contentRef} style={{ ...s.content, maxWidth: (!isMobile && onglet === 'accueil') ? '100%' : 860, /* 64px ne suffisait plus : le header fixe fait environ safe-area + 66px, donc
   le titre de page et le bouton Historique du chat passaient sous le logo et
   sous le menu. 92px laisse le contenu démarrer proprement sous le voile.
   En bas, 168px au lieu de 130 : la barre d'onglets dépliée est plus haute que
   l'ancienne pastille et recouvrait le dernier bloc de chaque page, le
   « Guide des exercices » devenait même impossible à toucher. */
/* Le bas est calculé à partir de la barre de navigation réelle (pastille
   flottante : safe-area + 10px d'écart + ~62px de haut) au lieu d'un 168px
   forfaitaire, qui laissait un grand vide sous la zone de saisie du chat.
   Le chat serre au plus près ; les pages qui défilent gardent une marge de
   confort pour que leur dernier bloc reste attrapable. */
padding: isMobile
  ? (onglet === 'accueil' ? '0'
    : onglet === 'chat'
      ? 'calc(env(safe-area-inset-top, 0px) + 76px) 0 calc(env(safe-area-inset-bottom, 0px) + 82px)'
      : 'calc(env(safe-area-inset-top, 0px) + 76px) 0 calc(env(safe-area-inset-bottom, 0px) + 118px)')
  : '0 0 40px', overflowY: onglet === 'chat' ? 'hidden' : 'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', overscrollBehavior:'none' }}>

          {/* Pull-to-refresh indicator */}
          {(pullDist > 8 || pullRefreshing) && (
            <div style={{
              position: 'sticky', top: 0, zIndex: 200, display: 'flex', justifyContent: 'center',
              paddingTop: pullRefreshing ? 14 : Math.max(0, pullDist - 8),
              transition: pullRefreshing ? 'padding 0.3s ease' : 'none',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(var(--rgb-creme-pale), 0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(var(--rgb-terracotta), 0.28)',
                boxShadow: '0 4px 16px rgba(var(--rgb-terracotta), 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pullRefreshing
                  ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(var(--rgb-terracotta), 0.18)', borderTop: '2px solid rgba(var(--rgb-terracotta), 0.85)', animation: 'spin360 0.7s linear infinite' }} />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${Math.min(pullDist / PULL_THRESHOLD * 180, 180)}deg)`, transition: 'none' }}>
                      <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                }
              </div>
            </div>
          )}

          {/* Mobile header, transparent sur Accueil, plein sur les autres onglets */}
          {isMobile && onglet === 'accueil' && (
            <div style={{
              position:'fixed', top:0, left:0, right:0, zIndex:50,
              background: ambiance === 'night'
                ? 'linear-gradient(180deg, rgba(7,15,30,0.92) 0%, rgba(7,15,30,0.72) 55%, rgba(7,15,30,0) 100%)'
                : 'linear-gradient(180deg, rgba(240,220,203,0.92) 0%, rgba(240,220,203,0.70) 55%, rgba(240,220,203,0) 100%)',
              backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
              padding:'10px 18px',
              paddingBottom:16,   // apres le raccourci, sinon il l'ecrase
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              {/* Logo */}
              {(() => {
                // Creme FRANC partout : le logo variait selon l'ambiance et
                // tombait a 52-62 % d'opacite en journee, quasi invisible sur le
                // ciel bleu de l'accueil et different des autres pages
                // (constat Jean 2026-08-12). La nuit garde sa teinte bleutee,
                // seule exception lisible.
                const nuitAcc  = ambiance === 'night'
                // De jour, exactement le degrade des autres pages. De nuit, un
                // aplat clair : un degrade terracotta sur du navy serait aussi
                // illisible que le creme l'etait sur l'ambre.
                const logoStyle = nuitAcc
                  ? { color: 'rgba(198,222,255,0.96)' }
                  : { background:'linear-gradient(90deg, #B8693A 0%, var(--accent) 28%, #D4854A 50%, var(--accent) 72%, #B8693A 100%)',
                      backgroundSize:'200% auto',
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                      animation:'headerShimmer 3s linear infinite' }
                const subColor  = nuitAcc ? 'rgba(190,216,255,0.78)' : ENCRE
                return (
                <div style={{ pointerEvents:'none', position:'relative' }}>
                  <span style={{
                    fontSize:28, fontWeight:400,
                    fontFamily:"'Cormorant Garamond', Georgia, serif",
                    fontStyle:'italic', letterSpacing:'-0.01em',
                    ...logoStyle,
                    lineHeight:1, display:'block',
                  }}>Solenn</span>
                  <span style={{
                    fontSize:8.5, fontWeight:400, letterSpacing:'0.5px', display:'block', marginTop:2,
                    fontFamily:"'Poppins',system-ui,sans-serif", fontStyle:'italic',
                    color: subColor,
                  }}>{signatureSolenn(ambiance)}</span>
                </div>
                )
              })()}
              {/* Hamburger */}
              <button onClick={() => setMenuOpen(o => !o)} style={{
                width:34, height:34, borderRadius:10,
                background:'none', border:'none', boxShadow:'none',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:5, cursor:'pointer', padding:0,
              }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display:'block', borderRadius:2,
                    background: ambiance === 'night' ? 'rgba(190,216,255,0.88)' : ICONE,
                    filter:'drop-shadow(0 1px 5px rgba(0,0,0,0.45))',
                    transition:'transform 0.36s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease, width 0.28s ease',
                    width: menuOpen && i===1 ? 0 : menuOpen && i===0 ? 16 : menuOpen && i===2 ? 16 : i===1 ? 10 : 16,
                    height:1.5,
                    transform: menuOpen && i===0 ? 'translateY(6.5px) rotate(45deg)'
                             : menuOpen && i===2 ? 'translateY(-6.5px) rotate(-45deg)'
                             : 'none',
                    opacity: menuOpen && i===1 ? 0 : 1,
                  }} />
                ))}
              </button>
            </div>
          )}
          {isMobile && onglet !== 'accueil' && (() => {
            const onChat = onglet === 'chat'
            // 0.58 rendait le hamburger quasi invisible sur les fonds clairs
            // (constat Jean 2026-08-12).
            const iconColor = ICONE   // etait rgba(178,102,62,0.92) : 2,9:1, sous le seuil 3,0
            // Le voile de l'en-tete mobile est un style STATIQUE, donc
            // incapable de lire l'ambiance : il restait creme sur le navy, et
            // c'est cette bande claire en haut de la capture de Jean. Son
            // jumeau quelques lignes plus haut avait deja sa version de nuit.
            // Memes points d'arret, memes opacites, autre couleur.
            return (
            <div style={ambiance === 'night'
              ? { ...s.mobileHeader, background:'linear-gradient(180deg, rgba(7,15,30,1) 0%, rgba(7,15,30,0.98) 48%, rgba(7,15,30,0.70) 72%, rgba(7,15,30,0) 100%)' }
              : s.mobileHeader}>
              {/* Logo, identique sur tous les onglets */}
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <style>{`
                  @keyframes headerShimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                  }
                  @keyframes dotPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.55; transform: scale(1.35); }
                  }
                `}</style>
                {/* Le degrade du mot part du brun de la marque, #B8693A. Sur le
                    navy il disparait : le logo etait a peine lisible la nuit
                    (capture de Jean, 2 septembre). Son jumeau plus haut avait
                    deja sa branche de nuit, celui-ci non. Meme traitement. */}
                <span style={{
                  fontSize:30, fontWeight:400,
                  fontFamily:"'Cormorant Garamond', Georgia, serif",
                  fontStyle:'italic', letterSpacing:'-0.05em',
                  ...(ambiance === 'night'
                    ? { color:'rgba(198,222,255,0.96)' }
                    : { background:'linear-gradient(90deg, #B8693A 0%, var(--accent) 28%, #D4854A 50%, var(--accent) 72%, #B8693A 100%)',
                        backgroundSize:'200% auto',
                        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                        animation:'headerShimmer 3s linear infinite' }),
                  lineHeight:1,
                }}>Solenn</span>
                <span style={{ fontSize:8.5, fontWeight:400, color:ENCRE, letterSpacing:'0.5px',
                  fontFamily:"'Poppins',system-ui,sans-serif", fontStyle:'italic' }}>
                  {signatureSolenn(ambiance)}
                </span>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, pointerEvents:'auto' }}>
                {/* ── Historique des conversations, dans le header plutôt que
                       flottant au-dessus des bulles, où il occupait une ligne
                       entière pour lui seul (retour Jean 2026-08-08) ── */}
                {onglet === 'chat' && user?.id && (
                  <button
                    onClick={() => setShowChatHistory(true)}
                    title="Historique des conversations"
                    style={{
                      width:34, height:34, borderRadius:10,
                      background:'rgba(var(--rgb-terracotta), 0.08)', border:'1px solid rgba(var(--rgb-terracotta), 0.22)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', color:ENCRE,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </button>
                )}
                {/* ── Nouveau chat (visible seulement sur onglet chat avec messages) ── */}
                {onglet === 'chat' && messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); setFollowUps([]); setReactions({}) }}
                    title="Nouvelle conversation"
                    style={{
                      // Une pastille avec le mot « Nouveau » : l'icone seule ne
                      // disait pas qu'elle recommencait la conversation
                      // (constat Jean 2026-08-12).
                      height:34, padding:'0 12px', borderRadius:12, gap:6,
                      background:'rgba(var(--rgb-terracotta), 0.10)', border:'1px solid rgba(var(--rgb-terracotta), 0.30)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', color:ENCRE,
                      fontFamily:F, fontSize:12, fontWeight:600,
                      // PAS `all`. Mesure le 2 septembre sur le site en ligne :
                      // ce bouton etait le seul element de l'accueil a rester
                      // brun sur le navy. Son parent etait bien en bleu, son
                      // --encre valait #C8DEFF, et il n'avait plus aucune
                      // couleur en ligne : il gardait six transitions EN COURS,
                      // dont une sur `color`. Une transition active fige la
                      // valeur calculee, et celle-ci repartait a chaque rendu
                      // du bandeau sans jamais atteindre sa cible.
                      //
                      // Seul `transform` est anime ici, par onMouseDown. On
                      // laisse le fond et la bordure, on retire `color`.
                      transition:'transform .15s ease, background .15s ease, border-color .15s ease',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform='scale(0.92)'}
                    onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                  >
                    {/* Icône « nouveau message » explicite : le losange ✦ ne
                        disait rien de sa fonction (retour Jean 2026-08-08) */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                    Nouveau
                  </button>
                )}
                {/* ── Hamburger button ── */}
                <button onClick={() => setMenuOpen(o => !o)} style={{
                  width:34, height:34, borderRadius:10,
                  background:'none', border:'none', boxShadow:'none',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:5, cursor:'pointer', padding:0, flexShrink:0,
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      display:'block', borderRadius:2, background: iconColor,
                      transition:'transform 0.36s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease, width 0.28s ease',
                      width: menuOpen && i===1 ? 0 : menuOpen && i===0 ? 16 : menuOpen && i===2 ? 16 : i===1 ? 10 : 16,
                      height:1.5,
                      transform: menuOpen && i===0 ? 'translateY(6.5px) rotate(45deg)'
                               : menuOpen && i===2 ? 'translateY(-6.5px) rotate(-45deg)'
                               : 'none',
                      opacity: menuOpen && i===1 ? 0 : 1,
                    }} />
                  ))}
                </button>
              </div>
            </div>
            )
          })()}

          {/* ── Hamburger slide panel ── */}
          {isMobile && menuOpen && (
            <>
              {/* Backdrop */}
              <div onClick={() => setMenuOpen(false)} style={{
                position:'fixed', inset:0, zIndex:150,
                background: nuitNav ? 'rgba(0,6,20,0.42)' : 'rgba(25,10,0,0.14)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
                animation:'tabFade 0.22s ease both',
              }} />
              {/* Panel */}
              <div style={{
                position:'fixed', top:0, right:0, bottom:0, zIndex:151,
                width:'76%', maxWidth:300,
                background: nuitNav
                  ? 'linear-gradient(160deg, rgba(18,32,64,0.92) 0%, rgba(10,22,48,0.95) 100%)'
                  : 'linear-gradient(160deg, rgba(var(--rgb-bulle), 0.28) 0%, rgba(255,224,175,0.20) 100%)',
                backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
                borderLeft: nuitNav ? '1px solid rgba(160,200,255,0.16)' : '1px solid rgba(210,145,40,0.09)',
                boxShadow:'none',
                display:'flex', flexDirection:'column',
                overflowY:'auto', WebkitOverflowScrolling:'touch',
                padding:'22px 22px 90px',
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 22px)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
                animation:'slideInRight 0.36s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
                {/* Profile */}
                <div style={{
                  display:'flex', alignItems:'center', gap:14, marginBottom:28,
                  paddingBottom:22, borderBottom: nuitNav ? '1px solid rgba(160,200,255,0.14)' : '1px solid rgba(190,120,20,0.09)',
                }}>
                  {/* Monogramme utilisateur */}
                  <div style={{ position:'relative', width:38, height:38, flexShrink:0 }}>
                    {/* Anneau tournant */}
                    <motion.svg
                      width="38" height="38"
                      style={{ position:'absolute', inset:0, pointerEvents:'none' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    >
                      <defs>
                        <linearGradient id="menuOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor="rgba(255,238,228,0.0)"/>
                          <stop offset="30%"  stopColor="rgba(255,238,228,0.20)"/>
                          <stop offset="55%"  stopColor="rgba(255,238,228,0.42)"/>
                          <stop offset="80%"  stopColor="rgba(255,238,228,0.16)"/>
                          <stop offset="100%" stopColor="rgba(255,238,228,0.0)"/>
                        </linearGradient>
                      </defs>
                      <circle cx="19" cy="19" r="17.5" fill="none" stroke="url(#menuOrbitGrad)" strokeWidth="1.5"/>
                    </motion.svg>
                    {/* Fond + initiale */}
                    <div style={{
                      width:38, height:38, borderRadius:'50%',
                      background: nuitNav ? 'rgba(160,200,255,0.10)' : 'rgba(255,238,228,0.07)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <span style={{ fontSize:16, fontWeight:600, color: navEncre, fontFamily:F }}>
                        {(profil.nom || profil.prenom || '').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:600, color: navEncre, fontFamily:F, letterSpacing:'0.01em' }}>
                      {profil.nom ? profil.nom.charAt(0).toUpperCase() + profil.nom.slice(1).toLowerCase() : ''}
                    </div>
                    <div style={{ fontSize:11.5, fontWeight:600, color: navEncre, marginTop:2, fontFamily:F }}>Niveau {level} · {xp} XP</div>
                  </div>
                </div>
                {/* Nav links */}
                {navItems.map(({ id, Icon, label }) => (
                  <button key={id} onClick={() => { setOnglet(id); setMenuOpen(false) }} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                    border:'none',
                    background: onglet===id ? 'rgba(190,115,18,0.08)' : 'transparent',
                    cursor:'pointer', fontFamily:F, width:'100%', textAlign:'left',
                    color: navEncre,
                    fontWeight: onglet===id ? 600 : 400,
                    fontSize:14, marginBottom:3,
                  }}>
                    <Icon color={onglet===id ? navAccent : navIcone} size={18} />
                    {label}
                  </button>
                ))}

                {/* Seconde porte vers les quatre pages outils. Elles n'etaient
                    atteignables que depuis la rangee « Tes outils » de l'accueil :
                    depuis le chat, le Programme ou les Progres, il fallait
                    d'abord revenir en arriere. Quatre des huit destinations de
                    l'app dependaient donc d'une seule rangee, sur une seule
                    page, qu'il faut avoir fait defiler pour voir
                    (etude d'architecture du 2026-09-01). */}
                <div style={{ marginTop:16, paddingTop:12, borderTop:`1px solid ${navTrait}` }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
                                color:navEncre, opacity:0.68, padding:'0 16px 9px', fontFamily:F }}>
                    Tes outils
                  </div>
                  {[
                    { id:'style',      Icon: StyleIcon,      label:'Style' },
                    { id:'breathwork', Icon: BreathworkIcon, label:'Respiration' },
                    { id:'beaute',     Icon: LeafIcon,       label:'Soins' },
                    ...(profil?.cycle ? [{ id:'cycle', Icon: CycleIcon, label:'Cycle' }] : []),
                  ].map(({ id, Icon, label }) => (
                    <button key={id} onClick={() => { setOnglet(id); setMenuOpen(false) }} style={{
                      display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderRadius:14,
                      border:'none',
                      background: onglet===id ? 'rgba(190,115,18,0.08)' : 'transparent',
                      cursor:'pointer', fontFamily:F, width:'100%', textAlign:'left',
                      color: navEncre,
                      fontWeight: onglet===id ? 600 : 400,
                      fontSize:14, marginBottom:3,
                    }}>
                      <Icon color={onglet===id ? navAccent : navIcone} size={18} />
                      {label}
                    </button>
                  ))}
                </div>
                {/* Bottom actions */}
                <div style={{ marginTop:'28px', display:'flex', flexDirection:'column', gap:2, borderTop: nuitNav ? '1px solid rgba(160,200,255,0.14)' : '1px solid rgba(200,130,25,0.09)', paddingTop:12 }}>
                  {!isPro && (
                    <button onClick={() => { passerPro('annual'); setMenuOpen(false) }} style={{
                      display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                      border:'none', background:'transparent', cursor:'pointer',
                      fontFamily:F, width:'100%', textAlign:'left',
                      color: navEncre, fontWeight:400, fontSize:14,
                    }}>
                      <StarIcon size={18} color={navIcone} /> Passer à Pro
                    </button>
                  )}
                  <button onClick={() => { setShowSettings(true); setMenuOpen(false) }} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                    border:'none', background:'transparent', cursor:'pointer',
                    fontFamily:F, width:'100%', textAlign:'left',
                    color: navEncre, fontWeight:400, fontSize:14,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={navIcone} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Paramètres
                  </button>
                  {/* « Modifier ton profil » retire le 2026-08-12 : il appelait
                      exactement la meme chose que « Parametres » juste au-dessus,
                      setShowSettings(true), donc deux entrees pour un seul ecran.
                      Le profil se modifie depuis le bloc en haut des Parametres,
                      qui a deja son bouton Modifier. */}
                  <button onClick={async () => {
                    const sb = await getSupabase()
                    await sb.auth.signOut()
                    localStorage.removeItem('vitacoach_user')
                    localStorage.removeItem('vitacoach_profil')
                    oublierAbonnement()
                    setUser(null)
                    setProfil(null)
                    setIsPro(false)
                    setMenuOpen(false)
                  }} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:14,
                    border:'none', background:'transparent', cursor:'pointer',
                    fontFamily:F, width:'100%', textAlign:'left',
                    // Terracotta et non rouge : se deconnecter est reversible en
                    // un geste, ce n'est pas une action dangereuse. Le rouge est
                    // reserve a l'irreversible (2026-08-12).
                    color:navEncre, fontWeight:400, fontSize:14,
                    marginTop:4,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={navIcone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Se déconnecter
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Tab content (keyed for fade-in animation on tab switch) ──
              minHeight:0 est OBLIGATOIRE ici. Un enfant flex vaut
              min-height:auto par défaut : il refuse de devenir plus petit que
              son contenu. Sans cette ligne, ce conteneur grandissait avec la
              conversation, donc chatWrap et chatBox aussi, chatBox n'avait
              jamais de hauteur bornée et son overflowY:auto n'avait rien à
              scroller. Le trop-plein était coupé par main{overflow:hidden} :
              on voyait la fin du fil et remonter était impossible. Le maillon
              manquant était ici, pas dans le chat (bug signalé 3 fois par Jean,
              enfin trouvé le 2026-08-08). */}
          <div key={`${onglet}-${refreshKey}`} style={{ animation:'tabFade 0.28s ease both', flex:1, minHeight: onglet === 'chat' ? 0 : undefined, display:'flex', flexDirection:'column' }}>

          {/* ── Accueil ── */}
          {onglet === 'accueil' && (
            <Suspense fallback={<GlowLoader fullPage />}>
            <HomeTab
              profil={profil}
              metriques={metriques}
              score={score}
              scoreColor={scoreColor}
              onLog={() => setOnglet('sante')}
              onUpdate={mettreAJourMetrique}
              onSwitchTab={setOnglet}
              onChat={envoyerMessage}
              streak={streak}
              xp={xp}
              level={level}
              history={history}
              onPresetChange={setHomePreset}
              presetManuel={presetManuel}
              isScrolling={isScrolling}
              userId={user?.id}
            />
            </Suspense>
          )}

          {/* ── Chat ── */}
          {onglet === 'chat' && (
            <div style={s.chatWrap}>

              <div ref={chatBoxRef} style={s.chatBox}
                onScroll={e => {
                  if (autoScrollRef.current) return   // scroll déclenché par le code
                  const el = e.currentTarget
                  const distanceDuBas = el.scrollHeight - el.scrollTop - el.clientHeight
                  isAtBottomRef.current = distanceDuBas <= 120
                  setShowScrollBtn(distanceDuBas > 120)
                }}>
                {messages.length === 0 && (
                  <div style={s.emptyChat}>
                    {/* Mascot */}
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
                      <SolennFace size={46} />
                    </div>

                    <div style={s.emptyChatTitle}>
                      {profil?.prenom || profil?.nom ? `Comment je peux t'aider, ${((profil.prenom || profil.nom) || '').charAt(0).toUpperCase() + ((profil.prenom || profil.nom) || '').slice(1).toLowerCase()} ?` : `Comment je peux t'aider ?`}
                    </div>
                    <div style={s.emptyChatSub}>Nutrition · Bien-être · Style · Gestion du stress</div>
                    {/* Transparence IA, AI Act art. 50 (obligatoire août 2026) + confiance */}
                    <div style={{ fontSize:10.5, color:ENCRE, marginTop:-8, marginBottom:16 }}>
                      Solenn est une intelligence artificielle, ses conseils ne remplacent pas un avis médical.
                    </div>

                    {streak > 0 && (
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                        <span style={{ background:'rgba(var(--rgb-surface-ivoire), 0.92)', border:'1px solid rgba(var(--rgb-terracotta), 0.18)', borderRadius:20, padding:'5px 14px', fontSize:11, fontWeight:700, color:ENCRE, display:'flex', alignItems:'center', gap:5 }}>
                          {streak} jour{streak > 1 ? 's' : ''} de suite
                        </span>
                      </div>
                    )}

                    <div style={s.suggestionsPile}>
                      {suggestions.map((sug, i) => (
                        <button key={i} className="sugg-animated" style={{ ...s.suggestionBig, animationDelay:`${i*0.07}s` }} onClick={() => envoyerMessage(sug)}>
                          <span style={{ opacity:0.45, marginRight:8, fontSize:11 }}>→</span>{sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={msg.role==='user' ? s.userMsg : s.botMsg}>
                    {/* Avatar Solenn, visible sur le premier message d'une série IA */}
                    {msg.role === 'assistant' && (i === 0 || messages[i-1]?.role === 'user') && (
                      <div style={{ flexShrink:0, marginTop:4, paddingLeft:3 }}>
                        <SolennFace size={30} />
                      </div>
                    )}
                    {msg.role === 'assistant' && i > 0 && messages[i-1]?.role === 'assistant' && (
                      <div style={{ width:26, flexShrink:0 }} />
                    )}
                    <div style={{ display:'flex', flexDirection:'column', gap:4, maxWidth: msg.role==='user' ? '76%' : isRich(msg.content) ? '90%' : '82%' }}>
                      <div style={
                        msg.role==='user'
                          ? s.userBubble
                          : isRich(msg.content) ? s.botBubbleRich : s.botBubble
                      }>
                        {msg.role==='user'
                          ? (<>
                              {msg.image && <img src={msg.image} alt="Photo de repas" style={{ maxWidth:'100%', maxHeight:220, borderRadius:12, display:'block', marginBottom: msg.content ? 6 : 0, objectFit:'cover' }} />}
                              {msg.affichage || msg.content}
                            </>)
                          : (
                            <MsgBoundary fallback={msg.content}>
                              <ResponseRenderer content={msg.content} />
                            </MsgBoundary>
                          )
                        }
                      </div>
                      {msg.role === 'assistant' && (
                        <div style={{ display:'flex', gap:5, paddingLeft:4, alignItems:'center' }}>
                          {/* Un seul retour + copier : quatre icônes sous chaque
                              réponse faisaient beaucoup de bruit visuel pour une
                              action rarement utilisée (retour Jean 2026-08-08) */}
                          {[
                            { key:'👍', icon: <ThumbsUpIcon  size={13} color={ICONE} /> },
                          ].map(({ key, icon }) => (
                            <ReactionBtn
                              key={key}
                              emoji={key}
                              icon={icon}
                              active={reactions[i] === key}
                              onClick={() => {
                                const actif = reactions[i] === key
                                setReactions(prev => ({ ...prev, [i]: actif ? null : key }))
                                enregistrerRetour({
                                  userId: user?.id,
                                  question: messages[i-1]?.role === 'user' ? messages[i-1].content : null,
                                  reponse: msg.content,
                                  vote: actif ? null : 1,
                                })
                              }}
                            />
                          ))}
                          <button
                            onClick={() => {
                              if (navigator.clipboard?.writeText) {
                                navigator.clipboard.writeText(msg.content).then(() => {
                                  setCopiedIdx(i)
                                  setTimeout(() => setCopiedIdx(null), 1800)
                                })
                              }
                            }}
                            title="Copier"
                            style={{
                              background: copiedIdx === i ? 'rgba(34,197,94,0.12)' : 'transparent',
                              border: 'none', cursor:'pointer', padding:'4px 6px', borderRadius:12,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color: copiedIdx === i ? '#22c55e' : 'rgba(160,100,40,0.55)',
                              transition:'all 0.2s',
                            }}>
                            {copiedIdx === i
                              ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ ...s.botMsg }}>
                    <div style={{ flexShrink:0, marginTop:4 }}>
                      <SolennFace size={30} />
                    </div>
                    <div style={{ padding:'10px 6px', display:'flex', alignItems:'center' }}>
                      <GlowLoader count={5} size={6} color={ICONE} glowStyle="soft" speed={1.1} gap={5} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Follow-up chips, scroll horizontal */}
              {followUps.length > 0 && !loading && (
                <div style={{ position:'relative' }}>
                <div style={{ display:'flex', gap:7, marginBottom:10, overflowX:'auto', flexWrap:'nowrap', paddingBottom:2, position:'relative', zIndex:1, scrollbarWidth:'none' }}>
                  {followUps.map((sug, i) => (
                    <button key={i} style={{ ...s.suggestion, flexShrink:0 }} onClick={() => { envoyerMessage(sug); setFollowUps([]) }}>
                      {sug}
                    </button>
                  ))}
                </div>
                  <div style={{
                    position:'absolute', top:0, right:0, bottom:10, width:28, pointerEvents:'none',
                    background:'linear-gradient(90deg, rgba(var(--rgb-fond),0) 0%, rgba(var(--rgb-fond),0.88) 100%)',
                  }} />
                </div>
              )}

              <ChatInputBar
                onSend={envoyerMessage}
                onSendImage={envoyerPhotoRepas}
                disabled={loading}
                kbOffset={kbOffset}
                isMobile={isMobile}
                showScrollBtn={showScrollBtn}
                onScrollDown={() => {
                  isAtBottomRef.current = true
                  messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
                }}
              />
            </div>
          )}

          {/* ── Santé ── */}
          {onglet === 'sante' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0', paddingBottom: isMobile ? 120 : undefined }}>
              {!isMobile && (
                <div style={s.pageHeader}>
                  <div>
                    <div style={{...s.pageTitle, display:'flex', alignItems:'center', gap:8}}><HeartIcon size={20} color={ICONE} /> Tes progrès</div>
                    <div style={s.pageSubtitle}>Tes mesures et ton évolution</div>
                  </div>
                </div>
              )}
              <Suspense fallback={<GlowLoader fullPage />}><SanteTab ambiance={ambiance} metriques={metriques} profil={profil} onUpdate={mettreAJourMetrique} score={score} history={history} userId={user?.id} isPro={hasFullAccess} onPasserPro={passerPro} onSwitchTab={setOnglet} /></Suspense>
            </div>
          )}

          {/* ── Santé Naturelle ──
               Deux portes d'entrée sur la MEME page : « herbal » l'ouvre sur les
               plantes (cartes horaires de l'accueil), « beaute » l'ouvre sur les
               recettes cheveux et peau (rangée « Tes outils »). Avant, seule la
               première existait, et uniquement à certaines heures : la page
               était donc inaccessible le reste du temps. */}
          {(onglet === 'herbal' || onglet === 'beaute') && (
            <Suspense fallback={<GlowLoader fullPage />}>
            <HerbalTab
              profil={profil}
              catInitiale={onglet === 'beaute' ? 'cheveux' : null}
              metriques={metriques}
              history={history}
              onChat={(msg, aff) => { setOnglet('chat'); envoyerMessage(msg, aff) }}
              onBack={() => setOnglet('accueil')}
            />
            </Suspense>
          )}

          {/* ── Style ── */}
          {/* Retour, les pages outils (Style, Respiration, Soins, Cycle) ne
              figurent pas dans la barre du bas : on y entre depuis l'accueil et
              rien ne permettait d'en ressortir. Le balayage iOS existe mais il
              n'est pas visible, et il n'existe pas du tout sur Android
              (constat 2026-08-12). Un seul bouton pour les quatre pages. */}
          {['style', 'breathwork', 'beaute', 'herbal', 'cycle'].includes(onglet) && (
            <button
              onClick={() => setOnglet('accueil')}
              aria-label="Retour à l'accueil"
              style={{
                position:'fixed', zIndex:60,
                top:'calc(env(safe-area-inset-top, 0px) + 14px)', left:14,
                width:38, height:38, borderRadius:'50%', cursor:'pointer',
                background:'rgba(var(--rgb-bulle), 0.82)',
                backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                border:'1px solid rgba(var(--rgb-terracotta), 0.30)',
                boxShadow:'0 4px 16px rgba(var(--rgb-terracotta), 0.18)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke={ICONE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {onglet === 'style' && (
            <div style={{ padding: isMobile ? '0 16px 0' : '28px 0 0', paddingBottom: isMobile ? 120 : undefined, boxSizing:'border-box', width:'100%', overflow:'hidden' }}>
              {!isMobile && (
                <div style={s.pageHeader}>
                  <div>
                    <div style={{ ...s.pageTitle, display:'flex', alignItems:'center', gap:8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a1.5 1.5 0 0 1 0 3"/>
                        <path d="M12 6 L5 13 h14 L12 6Z"/>
                        <path d="M5 13 v6 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 v-6"/>
                      </svg>
                      Style & Tenues
                    </div>
                    <div style={s.pageSubtitle}>Suggestions adaptées à la météo</div>
                  </div>
                </div>
              )}
              <TenuesModule profil={profil} />
            </div>
          )}

          {/* ── Breathwork ── */}
          {onglet === 'breathwork' && (
            <Suspense fallback={<GlowLoader fullPage />}><BreathworkTab /></Suspense>
          )}

          {/* ── Cycle ── */}
          {onglet === 'cycle' && profil?.cycle && (
            <Suspense fallback={<GlowLoader fullPage />}><CycleTab profil={profil} userId={user?.id} onChat={(msg, aff) => { setOnglet('chat'); setTimeout(() => envoyerMessage(msg, aff), 400) }} /></Suspense>
          )}

          {/* ── Routine ── */}
          {onglet === 'routine' && (
            <Suspense fallback={<GlowLoader fullPage />}><RoutineTab userId={user?.id} profil={profil} isPro={hasFullAccess} onPasserPro={passerPro} /></Suspense>
          )}

          {/* ── Forum ── */}
          {onglet === 'forum' && (
            <Suspense fallback={<GlowLoader fullPage />}><Forum onBack={() => setOnglet('accueil')} user={user} profil={profil} showForm={forumFormOpen} setShowForm={setForumFormOpen} onUnreadCount={setForumUnread} /></Suspense>
          )}

          </div>{/* end keyed tab wrapper */}

        </div>

        {/* ══ FORUM FAB (hors div scrollable) ══ */}
        {isMobile && onglet === 'forum' && (
          <button
            onClick={() => {
              const opening = !forumFormOpen
              setForumFormOpen(opening)
              if (opening) {
                setTimeout(() => {
                  if (contentRef.current && contentRef.current.scrollTop > 0) {
                    contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }, 50)
              }
            }}
            aria-label="Nouvelle discussion"
            style={{
              position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 106px)', right: 18,
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(var(--rgb-terracotta), 0.42), rgba(190,112,30,0.48))',
              border: '1px solid rgba(255,220,170,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(var(--rgb-terracotta), 0.15), inset 0 1px 0 rgba(255,255,255,0.18)',
              zIndex: 200,
              transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Barre horizontale */}
            <span style={{
              position: 'absolute',
              width: 18, height: 2, borderRadius: 2,
              background: 'rgba(255,245,225,0.95)',
              transform: forumFormOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform .38s cubic-bezier(.34,1.56,.64,1)',
            }} />
            {/* Barre verticale */}
            <span style={{
              position: 'absolute',
              width: 18, height: 2, borderRadius: 2,
              background: 'rgba(255,245,225,0.95)',
              transform: forumFormOpen ? 'rotate(-45deg)' : 'rotate(90deg)',
              transition: 'transform .38s cubic-bezier(.34,1.56,.64,1)',
            }} />
          </button>
        )}

        {/* ══ DYNAMIC NAV (mobile) ══ */}
        {isMobile && <DynamicNav onglet={onglet} setOnglet={setOnglet} forumUnread={forumUnread} F={F} preset={ambiance} items={navItems} />}
      </main>

      {/* Celebration overlay */}
      {celebrate && <CelebrationOverlay score={score} onDone={() => setCelebrate(false)} />}

      {/* Health permission modal, 1er lancement */}
      {showHealthPerm && <HealthPermModal onAllow={allowHealth} onLater={laterHealth} isNight={ambiance === 'night'} />}

      {/* Global animations */}
      <style>{`
@keyframes oravBlink {
          0%, 85%, 100% { transform: scaleY(1); }
          91% { transform: scaleY(0.07); }
          96% { transform: scaleY(1); }
        }
        @keyframes typing {
          from { opacity:0.3; transform:scale(0.8); }
          to   { opacity:1;   transform:scale(1.2); }
        }
        @keyframes floatOrb {
          0%,100% { transform:translateY(0) scale(1); }
          50%      { transform:translateY(-18px) scale(1.03); }
        }
        @keyframes aurora {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 50% 0%; }
          50%  { background-position: 100% 50%; }
          75%  { background-position: 50% 100%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes auroraFadeIn {
          from { opacity: 0; }
          to   { opacity: 0.72; }
        }
        .aurora-bg {
          background: linear-gradient(135deg,
            var(--aurore-1) 0%, var(--aurore-2) 18%, var(--aurore-3) 36%,
            var(--aurore-4) 52%, var(--aurore-5) 68%, var(--aurore-6) 84%, var(--aurore-1) 100%);
          background-size: 400% 400%;
          animation: aurora 14s ease infinite, auroraFadeIn 0.5s ease both;
          opacity: 0.72;
        }
        @keyframes twinkle {
          from { opacity:0.1; transform:scale(0.7); }
          to   { opacity:0.8; transform:scale(1.4); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes popIn {
          0%   { transform:scale(0.88); opacity:0; }
          60%  { transform:scale(1.04); }
          100% { transform:scale(1); opacity:1; }
        }
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(50px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity:0; transform:translateX(-50px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes heroGradient {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes scoreGlow {
          0%,100% { opacity:0.4; transform:scale(1); }
          50%      { opacity:0.9; transform:scale(1.08); }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.45; transform:scale(0.72); }
        }
        @keyframes metricPulse {
          0%,100% { transform:scale(1); }
          50%      { transform:scale(1.06); }
        }
        @keyframes countIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes tabFade {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0) rotate(-20deg); opacity:0; }
          70%  { transform: scale(1.25) rotate(4deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes novaSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes btnLightSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes liquidRipple {
          0%   { transform: scale(1);  opacity: 0.55; }
          65%  { opacity: 0.12; }
          100% { transform: scale(32); opacity: 0; }
        }
        @keyframes metricSpring {
          0%   { transform: scale(0.84); }
          40%  { transform: scale(1.22); }
          65%  { transform: scale(0.95); }
          82%  { transform: scale(1.06); }
          100% { transform: scale(1.00); }
        }
        @keyframes metricGlowRing {
          0%   { transform: scale(0.85); opacity: 0.90; }
          100% { transform: scale(2.00); opacity: 0; }
        }
        @keyframes iconBounce {
          0%   { transform: scale(0.72) rotate(-10deg); }
          50%  { transform: scale(1.32) rotate(5deg); }
          100% { transform: scale(1.00) rotate(0deg); }
        }
        @keyframes novaBreath {
          0%,100% { transform: scale(1) translateZ(0); opacity: 0.65; }
          50%      { transform: scale(1.14) translateZ(0); opacity: 1; }
        }
        @keyframes liquidBlob1 {
          0%,100% { border-radius:62% 38% 46% 54%/60% 44% 56% 40%; transform:translate(0,0) scale(1); }
          25%     { border-radius:50% 50% 34% 66%/54% 38% 62% 46%; transform:translate(3%,5%) scale(1.05); }
          50%     { border-radius:38% 62% 58% 42%/46% 58% 42% 54%; transform:translate(-2%,9%) scale(0.96); }
          75%     { border-radius:56% 44% 62% 38%/36% 62% 38% 64%; transform:translate(5%,2%) scale(1.03); }
        }
        @keyframes liquidBlob2 {
          0%,100% { border-radius:54% 46% 62% 38%/46% 60% 40% 54%; transform:translate(0,0) scale(1); }
          33%     { border-radius:38% 62% 44% 56%/62% 44% 56% 38%; transform:translate(-4%,-5%) scale(1.07); }
          66%     { border-radius:62% 38% 54% 46%/38% 54% 46% 62%; transform:translate(3%,-7%) scale(0.93); }
        }
        @keyframes liquidBlob3 {
          0%,100% { border-radius:50% 50% 50% 50%/50% 50% 50% 50%; transform:translate(0,0) scale(1); }
          50%     { border-radius:36% 64% 60% 40%/64% 36% 64% 36%; transform:translate(-5%,8%) scale(1.13); }
        }
        @keyframes liquidBlob4 {
          0%,100% { border-radius:60% 40% 60% 40%/40% 60% 40% 60%; transform:translate(0,0) scale(1); }
          50%     { border-radius:40% 60% 38% 62%/60% 38% 62% 40%; transform:translate(7%,-6%) scale(1.10); }
        }
        @keyframes novaFloat {
          0%,100% { transform: translateY(0px) scale(1); }
          33%      { transform: translateY(-6px) scale(1.02); }
          66%      { transform: translateY(3px) scale(0.99); }
        }
        @keyframes meshGrad {
          0%,100% { background-position: 0% 50%; }
          33%      { background-position: 100% 0%; }
          66%      { background-position: 50% 100%; }
        }
        @keyframes shimmerGrad {
          0%   { background-position: 200% 0; }
          50%  { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes liquidMorph {
          0%   { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
          25%  { border-radius: 45% 55% 40% 60% / 60% 40% 55% 45%; }
          50%  { border-radius: 55% 45% 65% 35% / 40% 55% 45% 60%; }
          75%  { border-radius: 40% 60% 45% 55% / 55% 45% 60% 40%; }
          100% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
        }
        @keyframes mirrorSweep {
          0%   { left: -100%; opacity: 0; }
          8%   { opacity: 1; }
          38%  { left: 160%; opacity: 1; }
          42%  { opacity: 0; }
          100% { left: 160%; opacity: 0; }
        }
        @keyframes celebFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh)  rotate(640deg); opacity: 0; }
        }
        @keyframes celebPop {
          0%   { transform: scale(0.45) rotate(-6deg); opacity: 0; }
          60%  { transform: scale(1.07) rotate(2deg);  opacity: 1; }
          100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
        }
        @keyframes swipeHint {
          0%,100% { transform: translateX(0) translateY(-50%); opacity:0.3; }
          50%      { transform: translateX(6px) translateY(-50%); opacity:0.7; }
        }
        @keyframes shimmerDot {
          0%,100% { opacity:0.5; transform:scaleX(1); }
          50%      { opacity:1;   transform:scaleX(1.15); }
        }
        @keyframes pulseDot1 {
          0%,100% { transform:scale(1);    opacity:0.7; }
          50%      { transform:scale(1.35); opacity:1; }
        }
        @keyframes pulseDot2 {
          0%,100% { transform:scale(1);    opacity:0.85; box-shadow:0 0 8px rgba(var(--rgb-terracotta), 0.4); }
          50%      { transform:scale(1.4);  opacity:1;    box-shadow:0 0 16px rgba(var(--rgb-terracotta), 0.7); }
        }
        @keyframes pulseDot3 {
          0%,100% { transform:scale(1);    opacity:0.7; }
          50%      { transform:scale(1.35); opacity:1; }
        }
        @keyframes particleFloat {
          0%,100% { transform: translate(0px, 0px) scale(1); opacity: 0.4; }
          25%      { transform: translate(3px, -7px) scale(1.6); opacity: 0.85; }
          60%      { transform: translate(-4px, 4px) scale(0.7); opacity: 0.35; }
        }
        @keyframes capsuleSkeleton {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        /* Scrollbar cachée sur mobile, scroll tactile suffisant */
        ::-webkit-scrollbar { display:none; width:0; height:0; }
        * { scrollbar-width:none; }
      `}</style>
    </div>
  )
}
function NutritionCard({ nutrition }) {
  return (
    <div style={{ ...sr.card, background:'linear-gradient(145deg, rgba(34,197,94,0.06), rgba(var(--rgb-bulle), 0.60))', border:'1px solid rgba(34,197,94,0.18)' }}>
      <div style={sr.cardHeader}>
        <span style={{ fontSize:18, display:'flex', alignItems:'center' }}><FoodIcon size={18} color="#22c55e" /></span>
        <span style={{ ...sr.cardTitre, color: VERT, fontWeight:600, fontSize:13 }}>{nutrition.titre}</span>
      </div>
      {nutrition.repas?.map((r, i) => (
        <div key={i} style={sr.repasRow}>
          <span style={{ fontSize:16, display:'flex', alignItems:'center' }}><FoodIcon size={14} color={ICONE} /></span>
          <div style={{ fontSize:12, color:ENCRE, lineHeight:1.5 }}>
            <strong style={{ color:ENCRE, fontWeight:500 }}>{r.moment}</strong>, {r.suggestion}
          </div>
        </div>
      ))}
      {nutrition.supplements?.length > 0 && (
        <div style={{ fontSize:12, color: VERT, background:'rgba(34,197,94,0.08)', borderRadius:12, padding:'6px 12px', marginTop:8, border:'1px solid rgba(34,197,94,0.2)' }}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><PillIcon size={13} color="#22c55e" />{nutrition.supplements.join(' · ')}</span>
        </div>
      )}
    </div>
  )
}

function RoutineSection({ id, icon, iconEl, titre, heure, etapes, accent, checked, onToggle }) {
  const doneCount = etapes?.filter((_, i) => checked[`${id}_${i}`]).length || 0
  const total = etapes?.length || 0
  return (
    <div style={{
      ...sr.card,
      background: `linear-gradient(145deg, ${accent}09, rgba(var(--rgb-bulle), 0.60))`,
      border: `1px solid ${accent}22`,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18, display:'flex', alignItems:'center' }}>{iconEl || icon}</span>
          <div>
            <div style={{ ...sr.cardTitre, color: accent, fontWeight:600, fontSize:13 }}>{titre}</div>
            {heure && <div style={{ fontSize:10, color:`${accent}70`, marginTop:1 }}>{heure}</div>}
          </div>
        </div>
        {total > 0 && (
          <div style={{ fontSize:10, color: doneCount===total ? accent : `${accent}60`, fontWeight:500,
            background: doneCount===total ? accent+'15' : `${accent}08`, padding:'2px 8px', borderRadius:12 }}>
            {doneCount}/{total}
          </div>
        )}
      </div>
      {etapes?.map((e, i) => {
        const done = checked[`${id}_${i}`]
        return (
          <div key={i} style={{ ...sr.etapeRow, opacity: done ? 0.50 : 1 }} onClick={() => onToggle(`${id}_${i}`)}>
            <div style={{ width:22, height:22, borderRadius:7, flexShrink:0, cursor:'pointer',
              border: `1.5px solid ${done ? accent : accent+'30'}`,
              background: done ? accent+'18' : 'rgba(var(--rgb-bulle), 0.60)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {done && <span style={{ fontSize:11, color:accent }}>✓</span>}
            </div>
            <span style={{ minWidth:26, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill={ICONE} fillOpacity="0.65"/></svg>
            </span>
            <div>
              <div style={{ fontWeight:500, fontSize:13, color:ENCRE, textDecoration: done ? 'line-through' : 'none' }}>{e.action || e.titre}</div>
              <div style={{ fontSize:11, color:ENCRE, marginTop:2 }}>{e.detail || e.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const sr = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, padding:'8px 0', flexWrap:'wrap', gap:10 },
  date: { fontSize:11, color:ENCRE, textTransform:'capitalize', letterSpacing:0.5, fontWeight:400 },
  titre: { fontSize:17, fontWeight:500, color:ENCRE, marginTop:2, letterSpacing:'-0.1px' },
  btnGen: {
    background:'rgba(var(--rgb-terracotta), 0.10)', color:ENCRE,
    border:'1.5px solid rgba(var(--rgb-terracotta), 0.25)',
    padding:'8px 14px', borderRadius:12, fontSize:12, fontWeight:600, cursor:'pointer',
    flexShrink:0, fontFamily:"'Poppins',system-ui,sans-serif",
    display:'flex', alignItems:'center', gap:5,
    boxShadow:'none',
  },
  progressBar: { background:'rgba(var(--rgb-bulle), 0.85)', border:'1px solid rgba(var(--rgb-terracotta), 0.12)', borderRadius:14,
    padding:'12px 16px', marginBottom:14, boxShadow:'0 2px 10px rgba(var(--rgb-terracotta), 0.05)' },
  empty: { background:'rgba(var(--rgb-bulle), 0.85)', border:'1px solid rgba(var(--rgb-terracotta), 0.12)', borderRadius:20, padding:'48px 32px',
    textAlign:'center', boxShadow:'0 4px 20px rgba(var(--rgb-terracotta), 0.06)' },
  motivCard: { background:'rgba(var(--rgb-bulle), 0.28)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.08)', borderRadius:16, padding:'14px 18px', textAlign:'center' },
  card: { background:'rgba(var(--rgb-bulle), 0.70)', border:'1px solid rgba(var(--rgb-terracotta), 0.10)', borderRadius:18, padding:'14px 16px',
    boxShadow:'none' },
  cardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  cardTitre: { fontSize:14, fontWeight:700, color:ENCRE },
  etapeRow: { display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0',
    borderTop:'1px solid #f8f4f0', cursor:'pointer' },
  repasRow: { display:'flex', gap:10, alignItems:'center', padding:'6px 0',
    borderTop:'1px solid #f8f4f0' },
}

// ─── TENUES MODULE, CAPSULE SLIDER 3D ───────────────────────────────────────

// Cartes capsule claires AVEC photo (retour Jean 2026-07-25 : elle veut des
// images, mais des vêtements posés à plat, pas des photoshoots de personnes).
// Requête biaisée « flat lay clothing » ; si l'image manque, la carte reste
// belle avec l'icône. Skeleton clair (fini le fond sombre).
function TenueCard({ tenue, style: extraStyle }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [imgState, setImgState] = useState('loading') // loading | ok | ko
  // Unsplash impose de créditer le photographe quand on affiche ses photos
  const [credit, setCredit] = useState(null)

  useEffect(() => {
    if (tenue.imageUrl) { setImgSrc(tenue.imageUrl); setImgState('ok'); return }
    const base = tenue.searchQuery || tenue.imagePrompt || tenue.titre || ''
    // « flat lay » force les photos de vêtements posés, sans mannequin
    const q = `flat lay clothing outfit ${base}`
    const alt = `flat lay fashion clothes ${tenue.searchQueryAlt || ''}`.trim()
    // Le SEXE declare part avec la requete. Le serveur forcait « woman » en
    // dur : un homme recevait des tenues feminines, alors que Solenn s'adresse
    // aux deux. Et le retirer sans rien mettre a la place aurait rendu les
    // suggestions generiques, ce qui n'est pas mieux : Jean veut du sur mesure.
    fetch(`/api/image?prompt=${encodeURIComponent(q)}&alt=${encodeURIComponent(alt)}&sexe=${encodeURIComponent(profil?.sexe || 'nsp')}`)
      .then(r => r.json())
      .then(d => {
        if (d.url) { setImgSrc(d.url); setImgState('ok'); setCredit(d.credit || null) }
        else setImgState('ko')
      })
      .catch(() => setImgState('ko'))
  }, [])

  return (
    <div style={{
      width: 280,
      height: 420,
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 16px 48px rgba(180,100,40,0.18), 0 2px 8px rgba(180,100,40,0.10)',
      border: '1px solid rgba(var(--rgb-creme-dore), 0.45)',
      background: 'var(--degrade-tenue)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      ...extraStyle,
    }}>
      {/* Zone visuelle : photo flat-lay, skeleton clair, ou icône en secours */}
      <div style={{ height: 178, margin: '8px 8px 0', borderRadius: 18, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'rgba(var(--rgb-photo), 0.60)' }}>
        {imgState === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'var(--degrade-squelette)',
            backgroundSize: '200% 100%', animation: 'capsuleSkeleton 1.4s ease infinite',
          }} />
        )}
        {imgState === 'ok' && imgSrc && (
          <>
            <img src={imgSrc} alt={tenue.titre}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={() => { setImgSrc(null); setImgState('ko') }} />
            {credit?.nom && (
              <a href={credit.lien} target="_blank" rel="noopener noreferrer"
                style={{
                  position: 'absolute', right: 6, bottom: 5, zIndex: 2,
                  fontSize: 8.5, lineHeight: 1.2, letterSpacing: '0.02em',
                  color: 'rgba(255,248,236,0.82)', textDecoration: 'none',
                  textShadow: '0 1px 3px rgba(60,30,10,0.55)',
                  fontFamily: 'Poppins,sans-serif',
                }}>
                {credit.nom}
              </a>
            )}
          </>
        )}
        {(imgState === 'ko' || imgState === 'loading') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{
              width: 74, height: 74, borderRadius: '50%',
              background: 'rgba(var(--rgb-verre), 0.70)', border: '1px solid rgba(var(--rgb-creme-dore), 0.60)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 14, flexShrink: 0 }} />
      {/* Texte */}
      <div style={{ padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontWeight: 500, color: ENCRE, fontSize: 20, letterSpacing: '-0.01em',
          fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic',
          textAlign: 'center', marginBottom: 10, lineHeight: 1.2,
        }}>
          {tenue.titre}
        </div>
        <div style={{ fontSize: 11.5, color: ENCRE, lineHeight: 1.6, fontFamily: F, textAlign: 'center',
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {tenue.description}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 6,
          background: 'rgba(var(--rgb-verre), 0.50)', borderRadius: 12, padding: '9px 12px',
          border: '1px solid rgba(var(--rgb-creme-dore), 0.40)', marginBottom: 18,
        }}>
          <LightbulbIcon size={12} color="var(--ambre-fonce)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 10.5, color: ENCRE, lineHeight: 1.55, fontFamily: F,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {tenue.pourquoi}
          </span>
        </div>
      </div>
    </div>
  )
}

// Skeleton card shown while tenues are loading
function SkeletonCard({ style: extraStyle }) {
  return (
    <div style={{
      width: 280,
      height: 420,
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      background: 'rgba(var(--rgb-creme-clair), 0.90)',
      boxShadow: '0 16px 48px rgba(180,100,40,0.14)',
      border: '1px solid rgba(var(--rgb-creme-dore), 0.45)',
      flexShrink: 0,
      ...extraStyle,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--degrade-squelette-2)',
        backgroundSize: '200% 100%',
        animation: 'capsuleSkeleton 1.4s ease infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <path d="M12 3a1.5 1.5 0 0 1 0 3"/>
          <path d="M12 6 L5 13 h14 L12 6Z"/>
          <path d="M5 13 v6 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 v-6"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
        <div style={{ height: 14, borderRadius: 7, background: 'rgba(var(--rgb-terracotta), 0.18)', marginBottom: 8, width: '60%', animation: 'capsuleSkeleton 1.4s ease infinite' }} />
        <div style={{ height: 9, borderRadius: 5, background: 'rgba(var(--rgb-terracotta), 0.10)', marginBottom: 5, animation: 'capsuleSkeleton 1.4s ease infinite' }} />
        <div style={{ height: 9, borderRadius: 5, background: 'rgba(var(--rgb-terracotta), 0.10)', width: '80%', animation: 'capsuleSkeleton 1.4s ease infinite' }} />
      </div>
    </div>
  )
}

function CapsuleSlider({ tenues, loading }) {
  const [active, setActive] = useState(0)
  const touchStartX = useRef(null)
  const containerRef = useRef(null)
  const count = loading ? 6 : tenues.length
  const clamp = v => Math.max(0, Math.min(count - 1, v))

  // Keyboard navigation, géré via onKeyDown sur le container, pas window

  // Reset active index when tenues change
  useEffect(() => { setActive(0) }, [tenues.length])

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -40) { triggerHaptic('light'); setActive(a => clamp(a + 1)) }
    else if (dx > 40) { triggerHaptic('light'); setActive(a => clamp(a - 1)) }
    touchStartX.current = null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, userSelect: 'none' }}>
      {/* 3D Stage */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          height: 480,
          perspective: '900px',
          overflow: 'visible',
        }}
      >
        {Array.from({ length: count }).map((_, i) => {
          const rel = i - active
          const abs = Math.abs(rel)
          if (abs > 2) return null
          const x = rel * 48
          const y = abs * 18
          const z = -abs * 90
          const scale = 1 / (1 + abs * 0.12)
          const rotate = rel * 8
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.75 : 0.5
          const zIndex = 10 - abs

          const cardStyle = {
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: `translateX(-50%) translateX(${x}px) translateY(${y}px) translateZ(${z}px) scale(${scale}) rotateZ(${rotate}deg)`,
            opacity,
            zIndex,
            transition: 'transform 0.5s cubic-bezier(.4,2,.3,1), opacity 0.4s ease',
            cursor: abs === 0 ? 'default' : 'pointer',
          }

          if (loading) return <SkeletonCard key={i} style={cardStyle} />
          return (
            <TenueCard
              key={i}
              tenue={tenues[i]}
              style={cardStyle}
            />
          )
        })}
      </div>

      {/* Navigation buttons + dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 }}>
        <button
          onClick={() => setActive(a => clamp(a - 1))}
          disabled={active === 0}
          style={{
            width: 40, height: 40, borderRadius: 24,
            background: 'rgba(var(--rgb-surface-blanche), 0.9)',
            border: '1px solid rgba(var(--rgb-terracotta), 0.25)',
            boxShadow: '0 2px 12px rgba(var(--rgb-terracotta), 0.18)',
            color: ENCRE, fontSize: 18, fontWeight: 700,
            cursor: active === 0 ? 'not-allowed' : 'pointer',
            opacity: active === 0 ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.2s',
            fontFamily: 'sans-serif',
          }}
          aria-label="Précédent"
        >
          ←
        </button>

        {/* Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                height: 6,
                width: i === active ? 18 : 6,
                borderRadius: 12,
                background: i === active ? 'var(--accent)' : 'rgba(var(--rgb-terracotta), 0.28)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.35s cubic-bezier(.4,2,.3,1), background 0.2s',
              }}
              aria-label={`Tenue ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setActive(a => clamp(a + 1))}
          disabled={active === count - 1}
          style={{
            width: 40, height: 40, borderRadius: 24,
            background: 'rgba(var(--rgb-surface-blanche), 0.9)',
            border: '1px solid rgba(var(--rgb-terracotta), 0.25)',
            boxShadow: '0 2px 12px rgba(var(--rgb-terracotta), 0.18)',
            color: ENCRE, fontSize: 18, fontWeight: 700,
            cursor: active === count - 1 ? 'not-allowed' : 'pointer',
            opacity: active === count - 1 ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.2s',
            fontFamily: 'sans-serif',
          }}
          aria-label="Suivant"
        >
          →
        </button>
      </div>
    </div>
  )
}

function TenuesModule({ profil }) {
  const [ville, setVille]       = useState(() => localStorage.getItem('vitacoach_ville') || '')
  const [occasion, setOccasion] = useState('Casual')
  const [tenues, setTenues]     = useState(() => { try { return JSON.parse(localStorage.getItem('vitacoach_tenues') || '[]') } catch { return [] } })
  const [meteo, setMeteo]       = useState(() => localStorage.getItem('vitacoach_meteo') || '')
  const [loading, setLoading]   = useState(false)
  const [villeError, setVilleError] = useState(false)
  const [apiError, setApiError] = useState(null)
  const occasions = ['Travail','Casual','Soirée','Sport','Rendez-vous','Voyage']

  // Ville pre-remplie par geolocalisation. Elle etait saisie a la main a chaque
  // premiere utilisation alors que le telephone connait la reponse : friction
  // inutile sur un ecran qui ne sert a rien sans elle (constat 2026-08-12).
  // On ne demande la permission QUE si le champ est vide, et le champ reste
  // modifiable : la geolocalisation propose, elle n'impose pas.
  useEffect(() => {
    if (ville || !navigator.geolocation) return
    let vivant = true
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${coords.latitude}&lon=${coords.longitude}`, {
            headers: { 'Accept-Language': 'fr' },
          })
          const d = await r.json()
          const v = d?.address?.city || d?.address?.town || d?.address?.village || d?.address?.municipality
          if (vivant && v) { setVille(v); localStorage.setItem('vitacoach_ville', v) }
        } catch {}
      },
      () => {},                                    // refus : on garde la saisie manuelle
      { timeout: 8000, maximumAge: 3600000 },
    )
    return () => { vivant = false }
  }, [])

  async function getTenues(villeArg) {
    const v = (villeArg || ville).trim()
    if (!v) { setVilleError(true); return }
    setVilleError(false)
    setApiError(null)
    triggerHaptic('light')
    localStorage.setItem('vitacoach_ville', v)
    setLoading(true); setTenues([])
    try {
      const res = await fetch('/api/tenues', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ profil, ville: v, occasion })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.erreur) {
        setApiError('Service momentanément indisponible. Réessaie dans quelques secondes.')
        setLoading(false)
        return
      }
      const t = data.tenues || []
      if (t.length === 0) {
        setApiError('Aucune tenue générée. Essaie une autre ville ou occasion.')
        setLoading(false)
        return
      }
      setTenues(t)
      setMeteo(data.meteo || '')
      localStorage.setItem('vitacoach_tenues', JSON.stringify(t))
      localStorage.setItem('vitacoach_meteo', data.meteo || '')
    } catch (err) {
      console.error('Erreur tenues:', err)
      setApiError('Impossible de charger les tenues. Vérifie ta connexion.')
      setTenues([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: 20, boxSizing:'border-box', width:'100%' }}>
      <style>{`
  .tenues-ville-input { border: 1px solid rgba(var(--rgb-creme-dore), 0.35) !important; box-shadow: none !important; }
  .tenues-ville-input:focus { border-color: rgba(var(--rgb-terracotta), 0.50) !important; box-shadow: 0 0 0 3px rgba(var(--rgb-terracotta), 0.10) !important; outline: none !important; }
  .tenues-ville-input:-webkit-autofill,
  .tenues-ville-input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px rgba(255,235,200,0.15) inset !important;
    -webkit-text-fill-color: rgba(var(--rgb-terracotta), 0.92) !important;
  }
  .tenues-select option { background: #F5E8D8; color: rgba(160,80,20,0.92); }
`}</style>
      {/* Controls, toujours visibles */}
      <div style={{ ...st.panel, marginBottom: 0 }}>
        {/* Ligne 1 : champ ville */}
        <div style={{ marginBottom: 8 }}>
          <input
            className="tenues-ville-input"
            style={{ ...st.input, width:'100%', boxSizing:'border-box', borderColor: villeError ? ROUGE : undefined }}
            placeholder="Ta ville (ex: Paris)" value={ville}
            onChange={e => { setVille(e.target.value); setVilleError(false) }}
            onKeyDown={e => e.key === 'Enter' && getTenues()}
          />
        </div>
        {/* Ligne 2 : select occasion + bouton ↻ */}
        <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
          <div style={{ position:'relative', flex: 1 }}>
            <select className="tenues-select" style={{ ...st.select, width:'100%', boxSizing:'border-box' }} value={occasion} onChange={e => setOccasion(e.target.value)}>
              {occasions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <svg style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="11" height="7" viewBox="0 0 11 7" fill="none">
              <path d="M1 1l4.5 4.5L10 1" stroke={ICONE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button
            style={{ ...st.btn, flexShrink: 0, padding:'11px 14px', borderRadius:14, justifyContent:'center' }}
            onClick={() => getTenues()}
            disabled={loading}
          >
            {loading
              ? <LoadingIcon size={16} color="rgba(var(--rgb-creme-pale), 0.90)" />
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(var(--rgb-creme-pale), 0.90)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
            }
          </button>
        </div>
        {villeError && <div style={{ fontSize: 12, color: ROUGE, marginTop: 4 }}>Entre ta ville pour continuer</div>}

        {/* Erreur API */}
        {apiError && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{ fontSize: 12, color: ENCRE, fontFamily: F, fontWeight: 500, lineHeight: 1.4 }}>{apiError}</span>
          </div>
        )}

        {/* Météo */}
        {meteo && (
          <div style={{ ...st.meteoBar, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <WeatherIcon size={16} color="#fbbf24" /> {meteo}
          </div>
        )}

        {/* Empty state si pas encore de ville */}
        {!loading && tenues.length === 0 && !ville && (
          <div style={{ textAlign:'center', padding:'32px 0 8px' }}>
            <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a1.5 1.5 0 0 1 0 3"/>
                <path d="M12 6 L5 13 h14 L12 6Z"/>
                <path d="M5 13 v6 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 v-6"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: ENCRE, marginBottom: 6 }}>Tenues adaptées à ta météo</div>
            <div style={{ fontSize: 12, color: ENCRE }}>Entre ta ville pour recevoir des suggestions personnalisées</div>
          </div>
        )}
      </div>

      {/* Capsule Slider, hors du panel pour ne pas être rogné par les bords */}
      {(loading || tenues.length > 0) && (
        <div style={{ marginTop: 20 }}>
          <CapsuleSlider tenues={tenues} loading={loading} />
        </div>
      )}
    </div>
  )
}

const st = {
  trigger: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
    background: 'rgba(var(--rgb-verre), 0.22)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(var(--rgb-creme-dore), 0.28)', borderRadius: 18, cursor: 'pointer',
    fontFamily: "'Poppins',system-ui,sans-serif",
  },
  triggerIcon: {
    width: 48, height: 48,
    background: 'rgba(var(--rgb-verre), 0.28)',
    border: '1px solid rgba(var(--rgb-creme-dore), 0.35)', borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  panel: {
    background: 'rgba(var(--rgb-verre), 0.22)',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(var(--rgb-creme-dore), 0.28)', borderRadius: 20, padding: 16,
    boxShadow: '0 8px 32px rgba(180,80,20,0.08)',
  },
  meteoBar: {
    background: 'rgba(var(--rgb-verre), 0.20)', borderRadius: 12, padding: '8px 14px',
    fontSize: 12, marginBottom: 12,
    color: ENCRE, fontWeight: 500,
    border: '1px solid rgba(var(--rgb-creme-dore), 0.25)',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  row: { display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' },
  input: {
    flex: 1, padding: '9px 14px', borderRadius: 12,
    border: '1px solid rgba(var(--rgb-creme-dore), 0.35)',
    background: 'rgba(255,235,200,0.15)',
    fontSize: 16, fontFamily: "'Poppins',system-ui,sans-serif",
    outline: 'none', color: ENCRE,
    WebkitAppearance: 'none', appearance: 'none',
    boxShadow: 'none',
  },
  select: {
    padding: '8px 30px 8px 12px', borderRadius: 12,
    border: '1px solid rgba(var(--rgb-creme-dore), 0.30)',
    background: 'rgba(255,235,200,0.15)',
    fontSize: 16, fontFamily: "'Poppins',system-ui,sans-serif", outline: 'none',
    color: ENCRE, cursor: 'pointer',
    appearance: 'none', WebkitAppearance: 'none',
  },
  btn: {
    padding: '8px 16px',
    background: 'linear-gradient(110deg,var(--brun-fonce) 0%,var(--brun-moyen) 100%)',
    color: 'rgba(var(--rgb-creme-pale), 1)',
    border: '1px solid rgba(var(--rgb-creme-dore), 0.38)',
    borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Poppins',system-ui,sans-serif",
    boxShadow: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const F = "'Poppins', system-ui, sans-serif"
const s = {
  app: { display:'flex', height:'100%', background:'transparent', fontFamily:F, position:'relative' },

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebar: {
    width:260,
    background:'transparent',
    backdropFilter:'none', WebkitBackdropFilter:'none',
    borderRight:'1px solid rgba(var(--rgb-terracotta), 0.12)',
    boxShadow:'none',
    position:'fixed', top:0, left:0, height:'100vh',
    zIndex:50,
    overflowY:'auto', overflowX:'hidden',
    padding:'1.2rem 1rem', boxSizing:'border-box',
  },
  sidebarTop: { marginBottom:'1.4rem', paddingBottom:'1.2rem', borderBottom:'1px solid rgba(var(--rgb-terracotta), 0.14)' },
  logo: {
    fontSize:20, fontWeight:900, letterSpacing:'-0.04em',
    /* Géré par ShinyLogoText, statique par défaut, shimmer au hover/tap */
    background:'linear-gradient(90deg, var(--accent) 0%, #F5C8AA 18%, #FFF3EC 34%, #F5C8AA 50%, var(--accent) 66%, #FCDEC8 82%, var(--accent) 100%)',
    backgroundSize:'250% 100%',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
  },
  logoSub: {
    fontSize:11, marginTop:3, letterSpacing:'0.06em', fontWeight:600,
    background:'linear-gradient(90deg, #38c1b6 0%, #a8e8e4 25%, #ffffff 45%, #a8e8e4 68%, #38c1b6 100%)',
    backgroundSize:'250% 100%',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
  },
  sidebarNav: { display:'flex', flexDirection:'column', gap:4 },
  sidebarBottom: { display:'flex', flexDirection:'column', gap:6, marginTop:'auto', paddingTop:'1rem', borderTop:'1px solid rgba(var(--rgb-terracotta), 0.12)' },
  nav: {
    display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:14,
    border:'none', background:'transparent', cursor:'pointer', fontFamily:F,
    color:ENCRE, fontWeight:400, textAlign:'left', width:'100%', fontSize:13,
    letterSpacing:'0.01em', transition:'background .2s, color .2s',
  },
  navActive: {
    display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:14,
    border:'none', background:'rgba(var(--rgb-terracotta), 0.07)',
    cursor:'pointer', fontFamily:F, color:ENCRE, fontWeight:500,
    textAlign:'left', width:'100%', fontSize:13, transition:'all .2s',
    boxShadow:'inset 0 0 0 1.5px rgba(var(--rgb-terracotta), 0.18)',
  },
  profileCard: {
    display:'flex', alignItems:'center', gap:10,
    background:'rgba(var(--rgb-terracotta), 0.06)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.14)', borderRadius:14, padding:'12px 14px',
  },
  avatar: {
    width:36, height:36, borderRadius:10,
    background:'linear-gradient(135deg,var(--brun-fonce),var(--brun-moyen))',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:15, fontWeight:800, color:'#fff', flexShrink:0,
    boxShadow:'0 4px 12px rgba(var(--rgb-terracotta), .35)',
  },
  profileName: { fontSize:13, fontWeight:700, color:ENCRE, marginBottom:1 },
  profileMeta: { fontSize:10, color:ENCRE, lineHeight:1.5 },
  btnPro: {
    background:'transparent', color:ENCRE,
    border:'none', borderBottom:'1px solid rgba(var(--rgb-terracotta), 0.25)',
    padding:'10px 0', borderRadius:0, cursor:'pointer',
    fontSize:11, fontFamily:F, fontWeight:300,
    letterSpacing:'0.18em', textTransform:'uppercase',
    textAlign:'left', display:'flex', alignItems:'center', gap:6,
    transition:'color 0.2s ease, border-color 0.2s ease',
  },
  proBadge: {
    background:'rgba(245,212,184,0.35)', color:ENCRE,
    border:'1px solid rgba(var(--rgb-terracotta), .15)',
    padding:'8px 12px', borderRadius:10, fontSize:11, fontWeight:700, textAlign:'center',
  },
  btnEdit: {
    background:'rgba(245,235,215,0.22)', color:ENCRE, border:'1px solid rgba(var(--rgb-terracotta), 0.14)',
    padding:'7px 12px', borderRadius:10, cursor:'pointer', fontSize:12,
    fontFamily:F, fontWeight:500, textAlign:'center', width:'100%',
    transition:'border-color .2s, color .2s',
  },

  // ── Main ─────────────────────────────────────────────────────────────────────
  main: { flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1, height:'100%', background:'transparent', overflow:'hidden' },
  content: { flex:1, minHeight:0, maxWidth:860, width:'100%', margin:'0 auto', display:'flex', flexDirection:'column' },

  // ── Mobile header ─────────────────────────────────────────────────────────────
  mobileHeader: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'8px 18px 8px',
    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
    // Voile dégradé + flou progressif : le logo et le menu restent lisibles quand
    // le contenu scrolle dessous (les bulles du chat passaient encore sur le
    // logo, capture Jean 2026-07-27, voile renforcé + backdrop blur masqué)
    // Voile plus couvrant sur sa moitié haute : les cartes du carrousel
    // passaient par-dessus le logo en scrollant (retour Jean 2026-08-08).
    background:'linear-gradient(180deg, rgba(240,220,203,1) 0%, rgba(240,220,203,0.98) 48%, rgba(240,220,203,0.70) 72%, rgba(240,220,203,0) 100%)',
    backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
    WebkitMaskImage:'linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)',
    maskImage:'linear-gradient(180deg, #000 0%, #000 55%, transparent 100%)',
    paddingBottom: 18,
    position:'fixed', top:0, left:0, right:0, zIndex:50,
    pointerEvents:'none',
  },
  backBtn: {
    width:36, height:36, borderRadius:12,
    background:'rgba(0,0,0,.04)', border:'1px solid rgba(0,0,0,.08)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
  },
  mobileTitle: { fontSize:14, fontWeight:700, color: AMBRE, letterSpacing:'0.01em', flex:1, textAlign:'center', opacity:0.92 },
  scorePill: { borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700 },

  // ── Page header ───────────────────────────────────────────────────────────────
  pageHeader: { padding:'2.8rem 0 2rem', borderBottom:'1px solid rgba(var(--rgb-creme-dore), 0.18)', marginBottom:'2rem' },
  tabHeaderMobile: { display:'flex', alignItems:'center', gap:10, padding:'16px 0 12px', marginBottom:4 },
  backBtnInline: {
    width:34, height:34, borderRadius:10,
    background:'rgba(0,0,0,.04)', border:'1px solid rgba(0,0,0,.08)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
  },
  pageTitle: { fontSize:18, fontWeight:800, color:ENCRE, letterSpacing:'-0.03em', marginBottom:2 },
  pageSubtitle: { fontSize:12, color:ENCRE, fontWeight:500 },

  // ── Chat ─────────────────────────────────────────────────────────────────────
  chatWrap: {
    // minHeight:0 indispensable : sans lui, le flex-child refuse de rétrécir,
    // la zone de messages grandit avec la conversation et pousse la barre de
    // saisie hors de l'écran (bug « la barre se déplace », 2026-07-25)
    display:'flex', flexDirection:'column', flex:1, minHeight:0, padding:'0.6rem 1.4rem 0 1.8rem', position:'relative',
  },
  // minHeight:0 (pas 300) : avec le verrou overflow:hidden du parent, la zone
  // de messages doit pouvoir rétrécir (clavier ouvert) sans pousser la barre.
  // WebkitOverflowScrolling + touchAction : indispensables pour que le doigt
  // « prenne » sur iOS dans un parent verrouillé (fix « je ne peux pas
  // remonter dans le fil », 2026-07-25)
  chatBox: { flex:1, minHeight:0, overflowY:'auto', marginBottom:10, paddingBottom:10, position:'relative', zIndex:1, WebkitOverflowScrolling:'touch', overscrollBehavior:'none', touchAction:'pan-y' },
  emptyChat: { textAlign:'center', padding:'5.6rem 2rem 2rem' },
  emptyChatIcon: { marginBottom:16 },
  emptyChatTitle: { fontSize:18, fontWeight:800, color:ENCRE, marginBottom:6, letterSpacing:'-0.03em' },
  emptyChatSub: { fontSize:13, color:ENCRE, marginBottom:32, lineHeight:1.7 },
  suggestionsPile: { display:'flex', flexDirection:'column', gap:8, maxWidth:360, margin:'0 auto' },
  suggestionBig: {
    background:'rgba(var(--rgb-bulle), 0.96)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.20)', borderRadius:16,
    padding:'13px 18px', fontSize:13, color: ENCRE, cursor:'pointer',
    fontFamily:F, textAlign:'left', fontWeight:500,
    boxShadow:'0 2px 12px rgba(var(--rgb-terracotta), 0.06), inset 0 1px 0 rgba(255,255,255,0.55)',
    transition:'transform .18s, box-shadow .18s',
  },

  userMsg: { display:'flex', justifyContent:'flex-end', marginBottom:10 },
  botMsg: { display:'flex', alignItems:'flex-start', marginBottom:10, gap:10 },
  userBubble: {
    background:'rgba(var(--rgb-bulle), 0.88)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.20)',
    color:ENCRE,
    // maxWidth 100% et non 76 : le wrapper limite DEJA a 76 %, les deux
    // cumules donnaient des bulles a 58 % de l'ecran, et « Plan d'action »
    // passait sur deux lignes (constat Jean 2026-08-13).
    padding:'13px 18px', borderRadius:'20px 20px 5px 20px', maxWidth:'100%',
    fontSize:14, lineHeight:1.65,
    boxShadow:'0 4px 22px rgba(var(--rgb-terracotta), 0.08), inset 0 1px 0 rgba(255,255,255,0.35)',
  },
  botBubble: {
    background:'rgba(var(--rgb-bulle), 0.88)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.20)',
    color:ENCRE,
    padding:'14px 20px', borderRadius:'5px 20px 20px 20px', maxWidth:'100%',
    fontSize:14, lineHeight:1.65, fontWeight:400, whiteSpace:'pre-wrap',
    fontFamily:'Poppins, sans-serif',
    boxShadow:'0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  botBubbleRich: {
    background:'transparent', color: AMBRE,
    padding:'4px 0', borderRadius:0, maxWidth:'90%', fontSize:14, lineHeight:1.65, fontWeight:400,
    fontFamily:'Poppins, sans-serif',
  },
  botAvatar: { fontSize:16, color: AMBRE, marginTop:10, flexShrink:0, fontWeight:900 },

  suggestionsRow: { display:'flex', gap:7, marginBottom:10, flexWrap:'wrap', position:'relative', zIndex:1 },
  suggestion: {
    background:'rgba(var(--rgb-bulle), 0.92)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.22)', borderRadius:20,
    padding:'7px 14px', fontSize:12, color: ENCRE, cursor:'pointer',
    fontFamily:F, fontWeight:300,
  },

  inputRow: { paddingBottom:10, position:'relative', zIndex:1 },
  inputBox: {
    display:'flex', gap:8, background:'rgba(var(--rgb-bulle), 0.96)',
    borderRadius:20, padding:'8px 8px 8px 18px',
    border:'1px solid rgba(var(--rgb-terracotta), 0.22)', alignItems:'center',
    boxShadow:'0 4px 24px rgba(var(--rgb-terracotta), 0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
  },
  inputChat: { flex:1, minWidth:0, border:'none', outline:'none', fontSize:16, fontFamily:F, background:'transparent', color:ENCRE },
  sendBtn: {
    background:'transparent', border:'none',
    width:36, height:36, borderRadius:12, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  },

  // ── Bottom nav ────────────────────────────────────────────────────────────────
  bottomNav: {
    position:'fixed', bottom:0, left:0, right:0, display:'flex',
    background:'rgba(242,242,240,.99)',
    borderTop:'1px solid rgba(0,0,0,.06)',
    padding:'8px 6px 14px', zIndex:100,
    boxShadow:'0 -8px 40px rgba(0,0,0,.06)',
  },
  navBot: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0,
    padding:'6px 4px 2px', border:'none', background:'transparent', cursor:'pointer',
    fontFamily:F, color:ENCRE, position:'relative', transition:'color .2s',
  },
  navBotActive: { color: AMBRE },
}

// Composant isolé : l'état `input` reste ici et ne remonte jamais dans App
// → chaque frappe clavier ne re-render que ce composant (~10 lignes), pas les 2900 lignes d'App
const ChatInputBar = React.memo(function ChatInputBar({ onSend, onSendImage, disabled, kbOffset, isMobile, showScrollBtn, onScrollDown }) {
  const [input, setInput] = React.useState('')
  const fileRef = React.useRef(null)

  // ── Parler a Solenn au lieu de taper ──────────────────────────────────────
  // Un coach, ca s'ecoute et ca se parle : c'est la fonctionnalite qu'aucun
  // tracker n'a. Le texte transcrit atterrit dans le champ, MODIFIABLE, et ne
  // part jamais tout seul : on relit ce qu'on a dicte avant d'envoyer
  // (2026-08-13). Transcription par Whisper via /api/transcribe.
  const [micState, setMicState] = React.useState('idle')  // idle | rec | trans
  const recRef = React.useRef(null)

  async function toggleMic() {
    if (disabled) return
    if (micState === 'rec') { recRef.current?.stop(); return }
    if (micState !== 'idle') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // iOS enregistre en AAC/mp4, Chrome en opus/webm : on prend ce que
      // l'appareil sait faire.
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
        .find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const chunks = []
      rec.ondataavailable = e => { if (e.data?.size) chunks.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setMicState('trans')
        try {
          const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
          const base64 = await new Promise((ok, ko) => {
            const r = new FileReader()
            r.onload = () => ok(String(r.result).split(',')[1] || '')
            r.onerror = ko
            r.readAsDataURL(blob)
          })
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
            body: JSON.stringify({ audio: base64, mime: rec.mimeType }),
          })
          const d = await res.json()
          if (d?.texte) setInput(prev => (prev ? prev + ' ' : '') + d.texte)
        } catch {}
        setMicState('idle')
      }
      recRef.current = rec
      rec.start()
      setMicState('rec')
      triggerHaptic('light')
      // Garde-fou : 90 s max, personne ne dicte plus longtemps et l'API a une
      // limite de taille.
      setTimeout(() => { if (recRef.current === rec && rec.state === 'recording') rec.stop() }, 90000)
    } catch {
      setMicState('idle')   // micro refuse : on reste au clavier, sans erreur
    }
  }
  function send() {
    const msg = input.trim()
    if (!msg || disabled) return
    setInput('')
    onSend(msg)
  }
  // Photo de repas : compression canvas (max 1024px, jpeg 0.75) avant envoi,
  // assez précis pour l'analyse vision, assez léger pour la 4G
  function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || disabled || !onSendImage) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const max = 1024
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      onSendImage(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }
  return (
    <div style={{ ...s.inputRow, marginBottom: isMobile && kbOffset > 0 ? kbOffset : 0 }}>
      {showScrollBtn && (
        <button onClick={onScrollDown}
          style={{ position:'absolute', bottom:74, right:16, zIndex:10,
            width:32, height:32, borderRadius:'50%', border:'1px solid rgba(var(--rgb-terracotta), 0.25)',
            background:'rgba(var(--rgb-bulle), 0.96)',
            cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 12px rgba(var(--rgb-terracotta), 0.15)' }}>↓</button>
      )}
      <div style={s.inputBox}>
        {/* PAS d'attribut `capture`. Il forcait l'appareil photo arriere et
            supprimait purement et simplement l'acces a la galerie, sur iOS
            comme sur Android : impossible d'envoyer une photo deja prise
            (constat de Jean, 3 septembre). Sans lui, le systeme propose les
            deux, photothèque ou appareil, et l'utilisateur choisit. */}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
        <button style={{ ...s.sendBtn, marginRight:-4 }} title="Photographier mon repas"
          onClick={() => { triggerHaptic('light'); fileRef.current?.click() }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
        <button style={{ ...s.sendBtn, marginRight:-4, position:'relative' }}
          title={micState === 'rec' ? 'Terminer et transcrire' : 'Parler à Solenn'}
          onClick={toggleMic}>
          <style>{`@keyframes micPulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.55; transform:scale(1.15) } }`}</style>
          {micState === 'trans' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ICONE} strokeWidth="1.8" strokeLinecap="round" style={{ animation:'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.2-8.56"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={micState === 'rec' ? '#C0392B' : ICONE}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={micState === 'rec' ? { animation:'micPulse 1.1s ease-in-out infinite' } : undefined}>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          )}
        </button>
        <input className="chat-input" style={s.inputChat}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={micState === 'rec' ? "Je t'écoute…" : micState === 'trans' ? 'Je transcris…' : 'Pose une question à Solenn...'}
          disabled={disabled} />
        <button style={s.sendBtn} onClick={() => { triggerHaptic('light'); send() }}>
          <SendIcon color={ICONE} size={20} />
        </button>
      </div>
    </div>
  )
})
