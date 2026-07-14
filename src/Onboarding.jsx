import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlashIcon, TargetIcon, MoonIcon, MeditateIcon, MuscleIcon, FoodIcon } from './Icons'

// ─── BG BLOBS ─────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 50% 48%, #FFF991 0%, transparent 68%)',
        opacity:0.62, mixBlendMode:'multiply',
        animation:'liquidBlob3 14s ease-in-out infinite',
      }}/>
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
      <BgBlobs />
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
  { emoji:'😴', label:'Mieux dormir',         Icon: MoonIcon,     iconColor:'rgba(162,192,248,0.90)' },
  { emoji:'🧘', label:'Gérer le stress',      Icon: MeditateIcon, iconColor:'rgba(167,139,250,0.90)' },
  { emoji:'💪', label:'Sport & forme',        Icon: MuscleIcon,   iconColor:'rgba(200,123,82,0.90)'  },
  { emoji:'🥗', label:'Alimentation saine',   Icon: FoodIcon,     iconColor:'rgba(34,197,94,0.90)'   },
]

const ACTIVITE_OPTIONS = [
  { emoji:'🛋️', label:'Sédentaire' },
  { emoji:'🚶', label:'Léger'      },
  { emoji:'🏃', label:'Modéré'     },
  { emoji:'🔥', label:'Intense'    },
]

const AGE_RANGE_OPTIONS = ['18–24 ans','25–34 ans','35–44 ans','45–54 ans','55 ans et +']

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  question: {
    fontSize:26, fontWeight:700, lineHeight:1.35,
    color:'#3D2014', fontFamily:'Poppins, sans-serif',
    margin:0, letterSpacing:'-0.01em',
  },
  sub: {
    fontSize:14, fontWeight:400, color:'rgba(61,32,20,0.55)',
    fontFamily:'Poppins, sans-serif', margin:'8px 0 0', lineHeight:1.5,
  },
  input: {
    width:'100%', padding:'16px 20px', borderRadius:16, boxSizing:'border-box',
    border:'1.5px solid rgba(200,123,82,0.28)',
    background:'rgba(255,248,244,0.92)',
    fontSize:16, fontFamily:'Poppins, sans-serif', color:'#3D2014',
    outline:'none', fontWeight:500,
    boxShadow:'0 2px 14px rgba(200,123,82,0.09)',
    transition:'border-color 0.2s',
  },
  cta: {
    width:'100%', padding:'16px', borderRadius:16, border:'none',
    background:'linear-gradient(135deg, #C87B52, #E8962A)',
    color:'#fff', fontSize:16, fontWeight:600, cursor:'pointer',
    fontFamily:'Poppins, sans-serif',
    boxShadow:'0 6px 20px rgba(200,123,82,0.35)',
    transition:'opacity 0.2s, transform 0.15s',
  },
  card: {
    padding:'20px 12px 16px', borderRadius:20,
    border:'1.5px solid rgba(200,123,82,0.16)',
    background:'rgba(255,248,244,0.90)',
    cursor:'pointer', textAlign:'center',
    fontFamily:'Poppins, sans-serif',
    boxShadow:'0 4px 18px rgba(200,123,82,0.09)',
    outline:'none', transition:'all 0.18s',
  },
  row: {
    width:'100%', padding:'16px 20px', borderRadius:14, border:'none',
    border:'1.5px solid rgba(200,123,82,0.16)',
    background:'rgba(255,248,244,0.90)',
    cursor:'pointer', textAlign:'left',
    fontSize:15, fontWeight:500, color:'#3D2014',
    fontFamily:'Poppins, sans-serif',
    boxShadow:'0 2px 10px rgba(200,123,82,0.07)',
    outline:'none', transition:'all 0.18s',
    display:'flex', alignItems:'center', gap:12,
  },
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [step, setStep] = useState(0)
  const [nomVal, setNomVal] = useState('')
  const [answers, setAnswers] = useState({})
  const [showReveal, setShowReveal] = useState(false)
  const [slideDir, setSlideDir] = useState(1)
  const nomRef = useRef(null)

  useEffect(() => {
    setTimeout(() => nomRef.current?.focus(), 350)
  }, [])

  function goNext(newAnswers) {
    setAnswers(newAnswers)
    setSlideDir(1)
    setStep(s => s + 1)
  }

  function finishOnboarding(finalAnswers) {
    const a = finalAnswers
    const profil = {
      nom:              a.nom || 'Ami',
      objectif:         a.objectif || '',
      objectifs:        a.objectif ? [a.objectif] : [],
      age:              a.age || '',
      activite:         a.activite || '',
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
    enter:  (d) => ({ opacity:0, x: d * 48 }),
    center: { opacity:1, x:0 },
    exit:   (d) => ({ opacity:0, x: -d * 48 }),
  }

  const nom = answers.nom || ''

  function renderStep() {
    // ── Étape 0 : Prénom ──
    if (step === 0) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div>
          <p style={S.question}>Comment tu t'appelles ?</p>
          <p style={S.sub}>Pour que Solenn puisse s'adresser à toi.</p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <input
            ref={nomRef}
            type="text"
            value={nomVal}
            onChange={e => setNomVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && nomVal.trim() && goNext({ nom: nomVal.trim() })}
            placeholder="Ton prénom..."
            style={S.input}
          />
          <button
            onClick={() => nomVal.trim() && goNext({ nom: nomVal.trim() })}
            disabled={!nomVal.trim()}
            style={{ ...S.cta, opacity: nomVal.trim() ? 1 : 0.38 }}
          >
            Continuer →
          </button>
        </div>
      </div>
    )

    // ── Étape 1 : Objectif ──
    if (step === 1) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <p style={S.question}>
          Qu'est-ce qui t'amène chez Solenn{nom ? `, ${nom}` : ''} ?
        </p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12}}>
          {OBJECTIF_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.label}
              initial={{opacity:0, y:16}}
              animate={{opacity:1, y:0}}
              transition={{duration:0.26, delay: i * 0.06}}
              onClick={() => goNext({ ...answers, objectif:`${opt.emoji} ${opt.label}` })}
              style={S.card}
              whileHover={{ scale:1.03, boxShadow:'0 8px 24px rgba(200,123,82,0.18)' }}
              whileTap={{ scale:0.97 }}
            >
              <span style={{fontSize:30, display:'block', marginBottom:10, lineHeight:1}}>{opt.emoji}</span>
              <span style={{fontSize:12, fontWeight:600, color:'#3D2014', lineHeight:1.35, display:'block'}}>
                {opt.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    )

    // ── Étape 2 : Âge ──
    if (step === 2) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div>
          <p style={S.question}>Tu as quel âge ?</p>
          <p style={S.sub}>Pour personnaliser tes conseils.</p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {AGE_RANGE_OPTIONS.map((age, i) => (
            <motion.button
              key={age}
              initial={{opacity:0, x:24}}
              animate={{opacity:1, x:0}}
              transition={{duration:0.24, delay: i * 0.07}}
              onClick={() => goNext({ ...answers, age })}
              style={S.row}
              whileHover={{ background:'rgba(200,123,82,0.08)', borderColor:'rgba(200,123,82,0.40)' }}
              whileTap={{ scale:0.98 }}
            >
              <span style={{fontSize:18}}>
                {['🌱','🌿','🌳','🍂','✨'][i]}
              </span>
              {age}
            </motion.button>
          ))}
        </div>
      </div>
    )

    // ── Étape 3 : Activité ──
    if (step === 3) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div>
          <p style={S.question}>Ton niveau d'activité au quotidien ?</p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {ACTIVITE_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.label}
              initial={{opacity:0, x:24}}
              animate={{opacity:1, x:0}}
              transition={{duration:0.24, delay: i * 0.07}}
              onClick={() => {
                const finalAnswers = { ...answers, activite:`${opt.emoji} ${opt.label}` }
                finishOnboarding(finalAnswers)
              }}
              style={S.row}
              whileHover={{ background:'rgba(200,123,82,0.08)', borderColor:'rgba(200,123,82,0.40)' }}
              whileTap={{ scale:0.98 }}
            >
              <span style={{fontSize:22}}>{opt.emoji}</span>
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>
    )

    return null
  }

  return (
    <div style={{
      minHeight:'100vh', background:'transparent',
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
        input:focus { outline:none; border-color:rgba(200,123,82,0.55) !important; }
        input::placeholder { color:rgba(200,123,82,0.40); }
      `}</style>

      <BgBlobs />

      {/* Header */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        paddingTop:'calc(env(safe-area-inset-top,0px) + 20px)',
        paddingBottom:16,
        display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      }}>
        <span style={{
          fontSize:24, fontWeight:400, letterSpacing:'-0.03em',
          fontFamily:"'Cormorant Garamond', Georgia, serif", fontStyle:'italic',
          color:'rgba(184,105,58,0.88)',
          textShadow:'0 1px 10px rgba(255,248,244,0.70)',
        }}>Solenn</span>

        {/* Progress dots */}
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          {[0,1,2,3].map(i => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 22 : 6,
                background: i <= step ? '#C87B52' : 'rgba(200,123,82,0.22)',
              }}
              transition={{duration:0.35, ease:[0.34,1.56,0.64,1]}}
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
            transition={{duration:0.28, ease:'easeOut'}}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
