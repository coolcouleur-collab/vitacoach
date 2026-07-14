import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { FlashIcon, TargetIcon, MoonIcon, MeditateIcon, MuscleIcon, FoodIcon } from './Icons'

// ─── BG BLOBS ─────────────────────────────────────────────────────────────────
function BgBlobs({ step }) {
  const shifts = [
    { x:'50%', y:'48%' },
    { x:'55%', y:'44%' },
    { x:'48%', y:'52%' },
    { x:'52%', y:'46%' },
  ]
  const s = shifts[step] || shifts[0]
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      <motion.div
        animate={{ backgroundPosition:`${s.x} ${s.y}` }}
        transition={{ duration:0.9, ease:'easeInOut' }}
        style={{
          position:'absolute', inset:0,
          backgroundImage:'radial-gradient(circle at 50% 48%, #FFF991 0%, transparent 68%)',
          opacity:0.62, mixBlendMode:'multiply',
          animation:'liquidBlob3 14s ease-in-out infinite',
        }}
      />
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 42% 58%, #FF7112 0%, transparent 62%)',
        opacity:0.20, mixBlendMode:'multiply',
        animation:'liquidBlob1 18s ease-in-out infinite reverse',
      }}/>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 88% 8%, rgba(232,140,80,0.45) 0%, transparent 58%)',
        filter:'blur(72px)',
        animation:'liquidBlob2 16s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 8% 90%, rgba(212,132,74,0.32) 0%, transparent 52%)',
        filter:'blur(64px)',
        animation:'liquidBlob4 20s ease-in-out infinite reverse',
      }}/>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 82% 80%, rgba(255,180,80,0.28) 0%, transparent 50%)',
        filter:'blur(50px)',
        animation:'liquidBlob3 11s ease-in-out infinite 2s',
      }}/>
    </div>
  )
}

// ─── ANIMATED QUESTION TEXT ───────────────────────────────────────────────────
function AnimatedQuestion({ text, style }) {
  const words = text.split(' ')
  return (
    <p style={{ ...style, margin:0 }}>
      {words.map((word, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity:0, y:14, filter:'blur(4px)' }}
          animate={{ opacity:1, y:0, filter:'blur(0px)' }}
          transition={{ type:'spring', stiffness:400, damping:30, delay: 0.04 + i * 0.055 }}
          style={{ display:'inline-block', marginRight:'0.26em' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  )
}

// ─── REVEAL SCREEN ────────────────────────────────────────────────────────────
function RevealScreen({ answers, onEnter }) {
  const [visible, setVisible] = useState(false)
  const [btnVisible, setBtnVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 120)
    setTimeout(() => setBtnVisible(true), 900)
  }, [])

  const nom = answers.nom || 'toi'
  const objectifs = answers.objectif ? [answers.objectif] : []
  const tags = [answers.activite, answers.age].filter(Boolean)

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'linear-gradient(160deg,#FFF8F2 0%,#FDEEE0 50%,#FFF4EC 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'40px 28px',
      fontFamily:'Poppins, sans-serif',
    }}>
      <BgBlobs step={0} />
      <div style={{
        position:'relative', zIndex:1, width:'100%', maxWidth:400,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition:'opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)',
        display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
      }}>
        <div style={{
          width:88, height:88, borderRadius:'50%',
          background:'linear-gradient(135deg,rgba(200,123,82,0.35),rgba(190,112,30,0.25))',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:24,
          boxShadow:'0 0 0 8px rgba(200,123,82,0.08), 0 0 0 16px rgba(200,123,82,0.04)',
          animation:'revealPulse 2.8s ease-in-out infinite',
        }}>
          <span style={{
            fontSize:38, fontWeight:800, color:'rgba(200,123,82,0.80)',
            fontFamily:'Poppins, sans-serif', letterSpacing:'-0.02em',
          }}>
            {nom.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{fontSize:13, fontWeight:600, color:'rgba(200,123,82,0.70)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10}}>
          Profil créé
        </div>
        <h1 style={{fontSize:'clamp(28px,7vw,40px)', fontWeight:900, color:'rgba(200,123,82,0.90)', letterSpacing:'-0.03em', marginBottom:6, lineHeight:1.1}}>
          Bonjour, {nom} !
        </h1>
        <p style={{fontSize:15, color:'rgba(200,123,82,0.70)', marginBottom:32, lineHeight:1.6}}>
          Solenn connaît ton profil et est prête à t'accompagner.
        </p>
        {objectifs.length > 0 && (
          <div style={{marginBottom:20, width:'100%'}}>
            <div style={{fontSize:11, fontWeight:700, color:'rgba(200,123,82,0.62)', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:10}}>
              Ton objectif
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center'}}>
              {objectifs.map(o => (
                <span key={o} style={{
                  padding:'7px 16px', borderRadius:20,
                  background:'rgba(200,123,82,0.09)',
                  border:'1px solid rgba(200,123,82,0.22)',
                  fontSize:12, fontWeight:600, color:'rgba(200,123,82,0.80)',
                }}>{o}</span>
              ))}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div style={{display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center', marginBottom:40}}>
            {tags.map(t => (
              <span key={t} style={{
                padding:'5px 12px', borderRadius:20,
                background:'rgba(200,123,82,0.05)',
                border:'1px solid rgba(200,123,82,0.14)',
                fontSize:11, fontWeight:500, color:'rgba(200,123,82,0.70)',
              }}>{t}</span>
            ))}
          </div>
        )}
        <button
          onClick={onEnter}
          style={{
            width:'100%', height:52,
            background:'transparent',
            color:'rgba(200,123,82,0.78)', border:'1.5px solid rgba(200,123,82,0.32)', borderRadius:30,
            fontSize:15, fontWeight:600, cursor:'pointer',
            fontFamily:'Poppins, sans-serif',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            opacity: btnVisible ? 1 : 0,
            transform: btnVisible ? 'translateY(0)' : 'translateY(14px)',
            transition:'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            letterSpacing:'0.2px', outline:'none',
          }}
        >
          Entrer dans Solenn
          <span style={{display:'inline-block', fontSize:18}}>→</span>
        </button>
      </div>
    </div>
  )
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const OBJECTIF_OPTIONS = [
  { emoji:'⚡', label:'Énergie & vitalité',  Icon: FlashIcon,    iconColor:'rgba(251,191,36,0.90)'  },
  { emoji:'⚖️', label:'Perdre du poids',     Icon: TargetIcon,   iconColor:'rgba(200,123,82,0.90)'  },
  { emoji:'😴', label:'Mieux dormir',         Icon: MoonIcon,     iconColor:'rgba(99,149,238,0.90)'  },
  { emoji:'🧘', label:'Gérer le stress',      Icon: MeditateIcon, iconColor:'rgba(167,139,250,0.90)' },
  { emoji:'💪', label:'Sport & forme',        Icon: MuscleIcon,   iconColor:'rgba(200,123,82,0.90)'  },
  { emoji:'🥗', label:'Alimentation saine',   Icon: FoodIcon,     iconColor:'rgba(34,197,94,0.90)'   },
]

const ACTIVITE_OPTIONS = [
  { emoji:'🛋️', label:'Sédentaire',  desc:'Bureau / peu de mouvements' },
  { emoji:'🚶', label:'Léger',       desc:'Quelques sorties par semaine' },
  { emoji:'🏃', label:'Modéré',      desc:'Sport 3-4×/semaine' },
  { emoji:'🔥', label:'Intense',     desc:'Sport quotidien ou physique' },
]

const AGE_RANGE_OPTIONS = [
  { range:'18–24 ans', icon:'🌱' },
  { range:'25–34 ans', icon:'🌿' },
  { range:'35–44 ans', icon:'🌳' },
  { range:'45–54 ans', icon:'🍂' },
  { range:'55 ans et +', icon:'✨' },
]

const CARD_ACCENTS = [
  { bg:'rgba(255,244,236,0.62)', border:'rgba(200,123,82,0.22)', selBg:'rgba(200,123,82,0.16)', glow:'rgba(200,123,82,0.28)' },
  { bg:'rgba(253,238,224,0.62)', border:'rgba(200,123,82,0.26)', selBg:'rgba(200,123,82,0.20)', glow:'rgba(200,123,82,0.32)' },
  { bg:'rgba(251,232,212,0.62)', border:'rgba(200,123,82,0.30)', selBg:'rgba(200,123,82,0.24)', glow:'rgba(200,123,82,0.36)' },
  { bg:'rgba(248,226,202,0.62)', border:'rgba(200,123,82,0.28)', selBg:'rgba(200,123,82,0.22)', glow:'rgba(200,123,82,0.34)' },
  { bg:'rgba(255,240,226,0.62)', border:'rgba(200,123,82,0.24)', selBg:'rgba(200,123,82,0.18)', glow:'rgba(200,123,82,0.30)' },
  { bg:'rgba(250,234,218,0.62)', border:'rgba(200,123,82,0.32)', selBg:'rgba(200,123,82,0.26)', glow:'rgba(200,123,82,0.38)' },
]

const TRIGGER_OPTIONS = [
  { emoji:'😮‍💨', label:'Stress & burnout',      desc:'Je suis à bout, j\'ai besoin de souffler'  },
  { emoji:'🔄',   label:'Envie de changement',   desc:'Je veux évoluer et prendre de nouvelles habitudes' },
  { emoji:'🌱',   label:'Simple curiosité',       desc:'Je veux explorer ce que ça peut m\'apporter' },
  { emoji:'🌊',   label:'Transition de vie',      desc:'Quelque chose a changé, je me réajuste'    },
]

const BASELINE_OPTIONS = [
  { emoji:'😴', label:'Vraiment à plat',   desc:'Épuisé(e), je tourne à vide'    },
  { emoji:'😐', label:'Ça peut aller',     desc:'Ni bien ni mal, en pilotage auto' },
  { emoji:'🙂', label:'Bien mais mieux',   desc:'J\'aspire à encore plus'          },
  { emoji:'✨', label:'En pleine forme',   desc:'Je veux maintenir cet élan'       },
]

const MOMENT_OPTIONS = [
  { emoji:'🌅', label:'Le matin',    desc:'Je commence la journée par moi'       },
  { emoji:'☀️', label:'La journée',  desc:'Mes pauses sont précieuses'           },
  { emoji:'🌆', label:'Le soir',     desc:'Je décompresse après ma journée'      },
  { emoji:'🌙', label:'La nuit',     desc:'Le calme nocturne est mon moment'     },
]

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  question: {
    fontSize:'clamp(22px,5.5vw,28px)', fontWeight:700, lineHeight:1.32,
    color:'rgba(200,123,82,0.92)', fontFamily:'Poppins, sans-serif',
    letterSpacing:'-0.01em',
  },
  sub: {
    fontSize:14, fontWeight:400, color:'rgba(200,123,82,0.58)',
    fontFamily:'Poppins, sans-serif', lineHeight:1.55,
  },
  input: {
    width:'100%', padding:'16px 20px', borderRadius:16, boxSizing:'border-box',
    border:'1.5px solid rgba(200,123,82,0.28)',
    background:'rgba(255,248,244,0.92)',
    fontSize:16, fontFamily:'Poppins, sans-serif', color:'rgba(200,123,82,0.92)',
    outline:'none', fontWeight:500,
    boxShadow:'0 2px 14px rgba(200,123,82,0.09)',
    transition:'border-color 0.2s, box-shadow 0.2s',
  },
  cta: {
    width:'100%', padding:'17px', borderRadius:16, border:'none',
    background:'linear-gradient(135deg, #C87B52 0%, #E8962A 100%)',
    color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer',
    fontFamily:'Poppins, sans-serif', letterSpacing:'0.1px',
    boxShadow:'0 8px 24px rgba(200,123,82,0.40)',
    transition:'opacity 0.2s, box-shadow 0.2s',
    outline:'none',
  },
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [step, setStep] = useState(0)
  const [nomVal, setNomVal] = useState('')
  const [answers, setAnswers] = useState({})
  const [showReveal, setShowReveal] = useState(false)
  const [slideDir, setSlideDir] = useState(1)
  const [tapped, setTapped] = useState(null)
  const nomRef = useRef(null)

  useEffect(() => {
    setTimeout(() => nomRef.current?.focus(), 350)
  }, [])

  function goNext(newAnswers) {
    setAnswers(newAnswers)
    setSlideDir(1)
    setTapped(null)
    setStep(s => s + 1)
  }

  function tapThen(key, fn) {
    setTapped(key)
    setTimeout(fn, 230)
  }

  function finishOnboarding(finalAnswers) {
    const a = finalAnswers
    const profil = {
      nom:              a.nom || 'Ami',
      objectif:         a.objectif || '',
      objectifs:        a.objectif ? [a.objectif] : [],
      age:              a.age || '',
      activite:         a.activite || '',
      declencheur:      a.declencheur || '',
      baseline:         a.baseline || '',
      moment:           a.moment || '',
      alimentation:     [],
      heure_lever:      7.5,
      heure_coucher:    23.5,
      profession:       '',
      poids:            0,
      taille:           0,
      sante:            false,
      sante_conditions: [],
      isPro:            false,
    }
    localStorage.setItem('vitacoach_profil', JSON.stringify(profil))
    window._solennProfil = profil
    setShowReveal(true)
  }

  if (showReveal) {
    return <RevealScreen answers={answers} onEnter={() => onTermine(answers)} />
  }

  const slideVariants = {
    enter:  (d) => ({ opacity:0, x: d * 70, scale:0.95, filter:'blur(3px)' }),
    center: { opacity:1, x:0, scale:1, filter:'blur(0px)' },
    exit:   (d) => ({ opacity:0, x: -d * 70, scale:0.95, filter:'blur(3px)' }),
  }

  const nom = answers.nom || ''

  function renderStep() {

    // ── Étape 0 : Prénom ──────────────────────────────────────────────────────
    if (step === 0) return (
      <div style={{display:'flex', flexDirection:'column', gap:32}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text="Comment tu t'appelles ?" style={S.question} />
          <motion.p
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.35, duration:0.4 }}
            style={S.sub}
          >
            Pour que Solenn puisse s'adresser à toi.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.45, type:'spring', stiffness:320, damping:28 }}
          style={{display:'flex', flexDirection:'column', gap:14}}
        >
          <input
            ref={nomRef}
            type="text"
            value={nomVal}
            onChange={e => setNomVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && nomVal.trim() && goNext({ nom: nomVal.trim() })}
            placeholder="Ton prénom..."
            style={S.input}
          />
          <motion.button
            onClick={() => nomVal.trim() && goNext({ nom: nomVal.trim() })}
            disabled={!nomVal.trim()}
            style={{ ...S.cta, opacity: nomVal.trim() ? 1 : 0.40 }}
            whileHover={nomVal.trim() ? { scale:1.02, boxShadow:'0 12px 32px rgba(200,123,82,0.50)' } : {}}
            whileTap={nomVal.trim() ? { scale:0.97 } : {}}
            animate={nomVal.trim() ? {
              boxShadow:['0 8px 24px rgba(200,123,82,0.40)','0 8px 32px rgba(200,123,82,0.60)','0 8px 24px rgba(200,123,82,0.40)'],
            } : {}}
            transition={{ boxShadow:{ repeat:Infinity, duration:2.2, ease:'easeInOut' }}}
          >
            Continuer →
          </motion.button>
        </motion.div>
      </div>
    )

    // ── Étape 1 : Objectif ────────────────────────────────────────────────────
    if (step === 1) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <AnimatedQuestion
          text={`Qu'est-ce qui t'amène chez Solenn${nom ? `, ${nom}` : ''} ?`}
          style={S.question}
        />
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12}}>
          {OBJECTIF_OPTIONS.map((opt, i) => {
            const accent = CARD_ACCENTS[i]
            const isSel = tapped === opt.label
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, y:28, scale:0.88 }}
                animate={{
                  opacity:1, y:0, scale: isSel ? 1.06 : 1,
                  background: isSel ? accent.selBg : accent.bg,
                  borderColor: isSel ? 'rgba(200,123,82,0.55)' : accent.border,
                  boxShadow: isSel
                    ? `0 14px 40px ${accent.glow}, 0 0 0 1.5px rgba(200,123,82,0.40), inset 0 1px 0 rgba(255,255,255,0.55)`
                    : `0 4px 20px rgba(200,123,82,0.10), inset 0 1px 0 rgba(255,255,255,0.65)`,
                }}
                transition={{
                  opacity:  { type:'spring', stiffness:300, damping:24, delay: i * 0.07 },
                  y:        { type:'spring', stiffness:300, damping:24, delay: i * 0.07 },
                  scale:    { type:'spring', stiffness:380, damping:20 },
                  background: { duration:0.16 },
                  borderColor: { duration:0.16 },
                  boxShadow: { duration:0.18 },
                }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, objectif:`${opt.emoji} ${opt.label}` }))}
                whileHover={{ scale: isSel ? 1.06 : 1.04, boxShadow:`0 10px 32px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.60)` }}
                whileTap={{ scale:0.94 }}
                style={{
                  padding:'22px 12px 18px', borderRadius:22,
                  border:`1.5px solid ${accent.border}`,
                  background: accent.bg,
                  backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                  cursor:'pointer', textAlign:'center',
                  fontFamily:'Poppins, sans-serif',
                  boxShadow:'0 4px 20px rgba(200,123,82,0.10), inset 0 1px 0 rgba(255,255,255,0.65)',
                  outline:'none',
                }}
              >
                <motion.span
                  animate={{ scale: isSel ? [1, 1.3, 1] : 1 }}
                  transition={{ duration:0.35 }}
                  style={{ fontSize:34, display:'block', marginBottom:12, lineHeight:1 }}
                >
                  {opt.emoji}
                </motion.span>
                <span style={{
                  fontSize:12, fontWeight: isSel ? 700 : 600, lineHeight:1.35, display:'block',
                  color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(200,123,82,0.88)',
                  transition:'color 0.16s, font-weight 0.1s',
                }}>
                  {opt.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 2 : Âge ─────────────────────────────────────────────────────────
    if (step === 2) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text="Tu as quel âge ?" style={S.question} />
          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.30 }}
            style={S.sub}
          >
            Pour adapter tes recommandations.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {AGE_RANGE_OPTIONS.map(({ range, icon }, i) => {
            const isSel = tapped === range
            return (
              <motion.button
                key={range}
                initial={{ opacity:0, x:36, scale:0.95 }}
                animate={{
                  opacity:1, x:0, scale:1,
                  background: isSel ? 'rgba(200,123,82,0.16)' : 'rgba(255,248,244,0.88)',
                  borderColor: isSel ? 'rgba(200,123,82,0.70)' : 'rgba(200,123,82,0.18)',
                  boxShadow: isSel ? '0 6px 24px rgba(200,123,82,0.22)' : '0 2px 10px rgba(200,123,82,0.06)',
                }}
                transition={{
                  opacity:  { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  x:        { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  scale:    { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  background: { duration:0.16 },
                  borderColor: { duration:0.16 },
                  boxShadow: { duration:0.18 },
                }}
                onClick={() => tapThen(range, () => goNext({ ...answers, age: range }))}
                whileHover={{ x: 5, background:'rgba(200,123,82,0.10)', borderColor:'rgba(200,123,82,0.44)', boxShadow:'0 6px 20px rgba(200,123,82,0.18)' }}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'16px 20px', borderRadius:16,
                  border:'1.5px solid rgba(200,123,82,0.18)',
                  background:'rgba(255,248,244,0.88)',
                  cursor:'pointer', textAlign:'left',
                  fontFamily:'Poppins, sans-serif',
                  boxShadow:'0 2px 10px rgba(200,123,82,0.06)',
                  outline:'none',
                  display:'flex', alignItems:'center', gap:14,
                }}
              >
                <motion.span
                  animate={{ scale: isSel ? [1,1.25,1] : 1 }}
                  transition={{ duration:0.30 }}
                  style={{ fontSize:22, display:'block', lineHeight:1 }}
                >
                  {icon}
                </motion.span>
                <span style={{
                  fontSize:15, fontWeight: isSel ? 600 : 500,
                  color: isSel ? '#C87B52' : 'rgba(200,123,82,0.88)',
                  transition:'color 0.16s, font-weight 0.1s',
                }}>
                  {range}
                </span>
                {isSel && (
                  <motion.span
                    initial={{ opacity:0, scale:0.5 }}
                    animate={{ opacity:1, scale:1 }}
                    style={{ marginLeft:'auto', fontSize:16 }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 3 : Activité ────────────────────────────────────────────────────
    if (step === 3) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <AnimatedQuestion text="Ton niveau d'activité au quotidien ?" style={S.question} />
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {ACTIVITE_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:36, scale:0.95 }}
                animate={{
                  opacity:1, x:0, scale:1,
                  background: isSel ? 'rgba(200,123,82,0.16)' : 'rgba(255,248,244,0.88)',
                  borderColor: isSel ? 'rgba(200,123,82,0.70)' : 'rgba(200,123,82,0.18)',
                  boxShadow: isSel ? '0 6px 24px rgba(200,123,82,0.22)' : '0 2px 10px rgba(200,123,82,0.06)',
                }}
                transition={{
                  opacity:  { type:'spring', stiffness:320, damping:26, delay: i * 0.08 },
                  x:        { type:'spring', stiffness:320, damping:26, delay: i * 0.08 },
                  scale:    { type:'spring', stiffness:320, damping:26, delay: i * 0.08 },
                  background: { duration:0.16 },
                  borderColor: { duration:0.16 },
                  boxShadow: { duration:0.18 },
                }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, activite:`${opt.emoji} ${opt.label}` }))}
                whileHover={{ x:5, background:'rgba(200,123,82,0.10)', borderColor:'rgba(200,123,82,0.44)', boxShadow:'0 6px 20px rgba(200,123,82,0.18)' }}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'16px 20px', borderRadius:16,
                  border:'1.5px solid rgba(200,123,82,0.18)',
                  background:'rgba(255,248,244,0.88)',
                  cursor:'pointer', textAlign:'left',
                  fontFamily:'Poppins, sans-serif',
                  boxShadow:'0 2px 10px rgba(200,123,82,0.06)',
                  outline:'none',
                  display:'flex', alignItems:'center', gap:14,
                }}
              >
                <motion.span
                  animate={{ scale: isSel ? [1,1.25,1] : 1 }}
                  transition={{ duration:0.30 }}
                  style={{ fontSize:26, display:'block', lineHeight:1 }}
                >
                  {opt.emoji}
                </motion.span>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{
                    fontSize:15, fontWeight: isSel ? 600 : 500,
                    color: isSel ? '#C87B52' : 'rgba(200,123,82,0.88)',
                    transition:'color 0.16s',
                  }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:11.5, color:'rgba(200,123,82,0.50)', fontWeight:400 }}>
                    {opt.desc}
                  </span>
                </div>
                {isSel && (
                  <motion.span
                    initial={{ opacity:0, scale:0.5 }}
                    animate={{ opacity:1, scale:1 }}
                    style={{ marginLeft:'auto', fontSize:16 }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 4 : Déclencheur émotionnel ──────────────────────────────────────
    if (step === 4) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text="Qu'est-ce qui t'a amené ici aujourd'hui ?" style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Pas de bonne ou mauvaise réponse.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {TRIGGER_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:36, scale:0.95 }}
                animate={{
                  opacity:1, x:0, scale:1,
                  background: isSel ? 'rgba(200,123,82,0.16)' : 'rgba(255,248,244,0.70)',
                  borderColor: isSel ? 'rgba(200,123,82,0.60)' : 'rgba(200,123,82,0.20)',
                  boxShadow: isSel
                    ? '0 8px 28px rgba(200,123,82,0.24), inset 0 1px 0 rgba(255,255,255,0.55)'
                    : '0 2px 14px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
                }}
                transition={{
                  opacity: { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  x:       { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  background: { duration:0.16 }, borderColor: { duration:0.16 }, boxShadow: { duration:0.18 },
                }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, declencheur: opt.label }))}
                whileHover={{ x:5, background:'rgba(200,123,82,0.10)', borderColor:'rgba(200,123,82,0.40)' }}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'15px 18px', borderRadius:16,
                  border:'1.5px solid rgba(200,123,82,0.20)',
                  background:'rgba(255,248,244,0.70)',
                  backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                  cursor:'pointer', textAlign:'left', fontFamily:'Poppins, sans-serif',
                  boxShadow:'0 2px 14px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <motion.span animate={{ scale: isSel ? [1,1.25,1] : 1 }} transition={{ duration:0.30 }}
                  style={{ fontSize:24, display:'block', lineHeight:1, flexShrink:0 }}>
                  {opt.emoji}
                </motion.span>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:14, fontWeight: isSel ? 700 : 600, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(200,123,82,0.90)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:11.5, color:'rgba(200,123,82,0.52)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                {isSel && (
                  <motion.span initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} style={{ marginLeft:'auto', fontSize:16 }}>✓</motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 5 : Baseline bien-être ──────────────────────────────────────────
    if (step === 5) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text="Comment tu te sens en ce moment ?" style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Pour calibrer Solenn à ton état réel aujourd'hui.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {BASELINE_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:36, scale:0.95 }}
                animate={{
                  opacity:1, x:0, scale:1,
                  background: isSel ? 'rgba(200,123,82,0.16)' : 'rgba(255,248,244,0.70)',
                  borderColor: isSel ? 'rgba(200,123,82,0.60)' : 'rgba(200,123,82,0.20)',
                  boxShadow: isSel
                    ? '0 8px 28px rgba(200,123,82,0.24), inset 0 1px 0 rgba(255,255,255,0.55)'
                    : '0 2px 14px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
                }}
                transition={{
                  opacity: { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  x:       { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  background: { duration:0.16 }, borderColor: { duration:0.16 }, boxShadow: { duration:0.18 },
                }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, baseline: opt.label }))}
                whileHover={{ x:5, background:'rgba(200,123,82,0.10)', borderColor:'rgba(200,123,82,0.40)' }}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'15px 18px', borderRadius:16,
                  border:'1.5px solid rgba(200,123,82,0.20)',
                  background:'rgba(255,248,244,0.70)',
                  backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                  cursor:'pointer', textAlign:'left', fontFamily:'Poppins, sans-serif',
                  boxShadow:'0 2px 14px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <motion.span animate={{ scale: isSel ? [1,1.25,1] : 1 }} transition={{ duration:0.30 }}
                  style={{ fontSize:24, display:'block', lineHeight:1, flexShrink:0 }}>
                  {opt.emoji}
                </motion.span>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:14, fontWeight: isSel ? 700 : 600, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(200,123,82,0.90)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:11.5, color:'rgba(200,123,82,0.52)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                {isSel && (
                  <motion.span initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} style={{ marginLeft:'auto', fontSize:16 }}>✓</motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 6 : Moment préféré ───────────────────────────────────────────────
    if (step === 6) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text="Quand tu veux prendre soin de toi ?" style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Solenn s'adapte à ton rythme de vie.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {MOMENT_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:36, scale:0.95 }}
                animate={{
                  opacity:1, x:0, scale:1,
                  background: isSel ? 'rgba(200,123,82,0.16)' : 'rgba(255,248,244,0.70)',
                  borderColor: isSel ? 'rgba(200,123,82,0.60)' : 'rgba(200,123,82,0.20)',
                  boxShadow: isSel
                    ? '0 8px 28px rgba(200,123,82,0.24), inset 0 1px 0 rgba(255,255,255,0.55)'
                    : '0 2px 14px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
                }}
                transition={{
                  opacity: { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  x:       { type:'spring', stiffness:320, damping:26, delay: i * 0.07 },
                  background: { duration:0.16 }, borderColor: { duration:0.16 }, boxShadow: { duration:0.18 },
                }}
                onClick={() => tapThen(opt.label, () => {
                  const finalAnswers = { ...answers, moment: opt.label }
                  finishOnboarding(finalAnswers)
                })}
                whileHover={{ x:5, background:'rgba(200,123,82,0.10)', borderColor:'rgba(200,123,82,0.40)' }}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'15px 18px', borderRadius:16,
                  border:'1.5px solid rgba(200,123,82,0.20)',
                  background:'rgba(255,248,244,0.70)',
                  backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                  cursor:'pointer', textAlign:'left', fontFamily:'Poppins, sans-serif',
                  boxShadow:'0 2px 14px rgba(200,123,82,0.08), inset 0 1px 0 rgba(255,255,255,0.70)',
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <motion.span animate={{ scale: isSel ? [1,1.25,1] : 1 }} transition={{ duration:0.30 }}
                  style={{ fontSize:24, display:'block', lineHeight:1, flexShrink:0 }}>
                  {opt.emoji}
                </motion.span>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:14, fontWeight: isSel ? 700 : 600, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(200,123,82,0.90)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:11.5, color:'rgba(200,123,82,0.52)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                {isSel && (
                  <motion.span initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} style={{ marginLeft:'auto', fontSize:16 }}>✓</motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    return null
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(160deg,#FFF8F4 0%,#FFF0E6 60%,#FDECD8 100%)',
      fontFamily:'Poppins, sans-serif',
      display:'flex', flexDirection:'column',
      position:'relative', overflow:'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Cormorant+Garamond:ital@1&display=swap');
        @keyframes liquidBlob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,5%) scale(1.06)} 66%{transform:translate(-2%,-3%) scale(0.96)} }
        @keyframes liquidBlob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-4%,3%) scale(1.08)} 70%{transform:translate(2%,-5%) scale(0.94)} }
        @keyframes liquidBlob3 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(2%,-4%) scale(1.05)} 65%{transform:translate(-3%,2%) scale(0.97)} }
        @keyframes liquidBlob4 { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(-3%,4%) scale(1.07)} 75%{transform:translate(4%,-2%) scale(0.95)} }
        @keyframes revealPulse { 0%,100%{box-shadow:0 0 0 8px rgba(200,123,82,0.08),0 0 0 16px rgba(200,123,82,0.04)} 50%{box-shadow:0 0 0 12px rgba(200,123,82,0.13),0 0 0 22px rgba(200,123,82,0.06)} }
        input:focus { outline:none; border-color:rgba(200,123,82,0.55) !important; box-shadow:0 0 0 3px rgba(200,123,82,0.10) !important; }
        input::placeholder { color:rgba(200,123,82,0.40); }
        button:focus-visible { outline:2px solid rgba(200,123,82,0.60); outline-offset:2px; }
      `}</style>

      <BgBlobs step={step} />

      {/* Header */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        paddingTop:'calc(env(safe-area-inset-top,0px) + 20px)',
        paddingBottom:16,
        display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      }}>
        <motion.span
          initial={{ opacity:0, y:-10 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.1, type:'spring', stiffness:300, damping:24 }}
          style={{
            fontSize:24, fontWeight:400, letterSpacing:'-0.03em',
            fontFamily:"'Cormorant Garamond', Georgia, serif", fontStyle:'italic',
            color:'rgba(184,105,58,0.88)',
            textShadow:'0 1px 10px rgba(255,248,244,0.70)',
          }}
        >
          Solenn
        </motion.span>

        {/* Progress dots */}
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          {[0,1,2,3,4,5,6].map(i => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 6,
                background: i < step
                  ? '#C87B52'
                  : i === step
                    ? '#C87B52'
                    : 'rgba(200,123,82,0.20)',
                opacity: i > step ? 0.6 : 1,
              }}
              transition={{ type:'spring', stiffness:420, damping:26 }}
              style={{ height:6, borderRadius:3 }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'0 28px 48px',
        paddingTop:'calc(env(safe-area-inset-top,0px) + 110px)',
        maxWidth:480, width:'100%', margin:'0 auto', boxSizing:'border-box',
      }}>
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={step}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type:'spring', stiffness:300, damping:28 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
