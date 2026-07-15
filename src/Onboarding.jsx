import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  FlashIcon, TargetIcon, MoonIcon, MeditateIcon, MuscleIcon, FoodIcon,
  BackIcon, BrainIcon, RefreshIcon, LightbulbIcon,
  SadIcon, NeutralIcon, MoodIcon, HappyIcon,
  SunIcon, BellIcon, RunIcon, FireIcon, StarIcon, DiamondIcon,
  BalanceIcon, WalkIcon, SofaIcon, WaveIcon,
} from './Icons'

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
        backgroundImage:'radial-gradient(circle at 88% 8%, rgba(232,140,80,0.35) 0%, transparent 58%)',
        animation:'liquidBlob2 16s ease-in-out infinite',
      }}/>
    </div>
  )
}

// ─── ANIMATED QUESTION TEXT ───────────────────────────────────────────────────
function AnimatedQuestion({ text, style }) {
  return (
    <motion.p
      style={{ ...style, margin:0 }}
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.24, ease:'easeOut' }}
    >
      {text}
    </motion.p>
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
        <h1 style={{fontSize:'clamp(28px,7vw,40px)', fontWeight:900, color:'#5C2E0A', letterSpacing:'-0.03em', marginBottom:6, lineHeight:1.1}}>
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
  { Icon: FlashIcon,    label:'Retrouver mon énergie',          desc:'Retrouver cet élan que j\'ai quelque part perdu'        },
  { Icon: BalanceIcon,  label:'Me réconcilier avec mon corps',  desc:'Trouver l\'équilibre sans régime ni privation'           },
  { Icon: MoonIcon,     label:'Dormir enfin comme il faut',     desc:'Me réveiller avec de l\'énergie, pas à plat dès le matin'},
  { Icon: MeditateIcon, label:'Retrouver ma sérénité',          desc:'Moins de tensions, plus de clarté au quotidien'         },
  { Icon: MuscleIcon,   label:'Reprendre le mouvement',         desc:'Bouger parce que ça me fait du bien, pas par obligation'},
  { Icon: FoodIcon,     label:'Manger sans culpabiliser',       desc:'Reconstruire une vraie relation avec la nourriture'     },
]

const ACTIVITE_OPTIONS = [
  { Icon: SofaIcon, label:'Pas vraiment mon truc',    desc:'Je bouge peu, surtout entre le bureau et le canapé' },
  { Icon: WalkIcon, label:'J\'essaie de bouger',      desc:'Quelques sorties ou marches dans la semaine'        },
  { Icon: RunIcon,  label:'Je fais du sport',         desc:'Deux à quatre séances par semaine'                  },
  { Icon: FireIcon, label:'Le sport, c\'est ma vie',  desc:'Je m\'entraîne tous les jours ou presque'           },
]

const AGE_RANGE_OPTIONS = [
  { range:'18–24 ans',   Icon: SunIcon     },
  { range:'25–34 ans',   Icon: FlashIcon   },
  { range:'35–44 ans',   Icon: TargetIcon  },
  { range:'45–54 ans',   Icon: StarIcon    },
  { range:'55 ans et +', Icon: DiamondIcon },
]


const TRIGGER_OPTIONS = [
  { Icon: BrainIcon,     label:'J\'ai atteint mes limites',      desc:'Trop de pression — il faut que quelque chose change'  },
  { Icon: RefreshIcon,   label:'Je veux tourner une page',       desc:'Je sens qu\'il est temps de faire autrement'          },
  { Icon: LightbulbIcon, label:'Pure curiosité',                 desc:'Je veux voir ce que ça peut m\'apporter'              },
  { Icon: WaveIcon,      label:'Ma vie est en train de changer', desc:'Un tournant, un événement — je me repositionne'       },
]

const BASELINE_OPTIONS = [
  { Icon: SadIcon,     label:'À bout, vraiment',          desc:'Je tourne à vide, j\'ai besoin d\'un vrai coup de pouce' },
  { Icon: NeutralIcon, label:'Ça fait le job',            desc:'Ni bien ni mal — je fonctionne en pilotage automatique'  },
  { Icon: MoodIcon,    label:'Bien, mais j\'aspire à plus', desc:'Quelque chose me manque, je veux aller plus loin'      },
  { Icon: HappyIcon,   label:'Au top !',                  desc:'Je veux maintenir cet élan et continuer à progresser'   },
]

const MOMENT_OPTIONS = [
  { Icon: SunIcon,   label:'Le matin',   desc:'Je commence la journée par moi, avant que tout s\'emballe' },
  { Icon: FlashIcon, label:'En journée', desc:'Mes pauses sont précieuses — j\'en profite pour moi'       },
  { Icon: BellIcon,  label:'Le soir',    desc:'Je décompresse après une longue journée'                   },
  { Icon: MoonIcon,  label:'La nuit',    desc:'Le calme nocturne, c\'est mon moment à moi'                },
]

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  question: {
    fontSize:'clamp(16px,3.8vw,19px)', fontWeight:500, lineHeight:1.5,
    color:'rgba(184,105,58,0.88)', fontFamily:"'DM Sans', sans-serif",
    letterSpacing:'0em',
  },
  sub: {
    fontSize:14, fontWeight:400, color:'rgba(184,105,58,0.88)',
    fontFamily:"'DM Sans', sans-serif", lineHeight:1.55,
  },
  input: {
    width:'100%', padding:'16px 20px', borderRadius:16, boxSizing:'border-box',
    border:'1.5px solid rgba(200,123,82,0.28)',
    background:'rgba(255,248,244,0.92)',
    fontSize:16, fontFamily:"'DM Sans', sans-serif", color:'rgba(200,123,82,0.92)',
    outline:'none', fontWeight:500,
    boxShadow:'0 2px 14px rgba(200,123,82,0.09)',
    transition:'border-color 0.2s, box-shadow 0.2s',
  },
  cta: {
    width:'100%', padding:'17px', borderRadius:16, border:'none',
    background:'linear-gradient(110deg, #C87B52 0%, #E8962A 55%, #D4854A 100%)',
    backgroundSize:'250% 100%',
    color:'#fff', fontSize:16, fontWeight:600, cursor:'pointer',
    fontFamily:"'DM Sans', sans-serif", letterSpacing:'0.3px',
    boxShadow:'0 8px 24px rgba(200,123,82,0.40)',
    transition:'opacity 0.2s, box-shadow 0.2s',
    outline:'none',
  },
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [step, setStep] = useState(() => {
    const s = sessionStorage.getItem('solenn_onboarding_step')
    return s ? parseInt(s, 10) : 0
  })
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('solenn_onboarding_answers') || '{}') } catch { return {} }
  })
  const [nomVal, setNomVal] = useState(() => {
    try {
      const a = JSON.parse(sessionStorage.getItem('solenn_onboarding_answers') || '{}')
      return a.nom || ''
    } catch { return '' }
  })
  const [showReveal, setShowReveal] = useState(false)
  const [slideDir, setSlideDir] = useState(1)
  const [tapped, setTapped] = useState(null)
  const nomRef = useRef(null)

  useEffect(() => {
    if (step === 0) setTimeout(() => nomRef.current?.focus(), 350)
  }, [step])

  useEffect(() => {
    sessionStorage.setItem('solenn_onboarding_step', step)
    sessionStorage.setItem('solenn_onboarding_answers', JSON.stringify(answers))
  }, [step, answers])

  function goNext(newAnswers) {
    setAnswers(newAnswers)
    setSlideDir(1)
    setTapped(null)
    setStep(s => s + 1)
  }

  function goBack() {
    setSlideDir(-1)
    setTapped(null)
    setStep(s => s - 1)
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
    sessionStorage.removeItem('solenn_onboarding_step')
    sessionStorage.removeItem('solenn_onboarding_answers')
    setShowReveal(true)
  }

  if (showReveal) {
    return <RevealScreen answers={answers} onEnter={() => onTermine(answers)} />
  }

  const slideVariants = {
    enter:  (d) => ({ opacity:0, x: d * 72, scale:0.94 }),
    center: { opacity:1, x:0, scale:1, transition:{ type:'spring', stiffness:340, damping:26, mass:0.85 } },
    exit:   (d) => ({ opacity:0, x: -d * 54, scale:0.97, transition:{ duration:0.16, ease:'easeIn' } }),
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
          transition={{ delay:0.35, duration:0.24, ease:'easeOut' }}
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
            whileTap={nomVal.trim() ? { scale:0.97 } : {}}
            style={{ ...S.cta, opacity: nomVal.trim() ? 1 : 0.40, animation: nomVal.trim() ? 'gradientShift 3s ease infinite, ctaPulse 2.2s ease-in-out infinite' : 'none' }}
          >
            Continuer →
          </motion.button>
        </motion.div>
      </div>
    )

    // ── Étape 1 : Objectif ────────────────────────────────────────────────────
    if (step === 1) return (
      <div style={{display:'flex', flexDirection:'column', gap:16}}>
        <AnimatedQuestion
          text={`C'est quoi ton envie du moment${nom ? `, ${nom}` : ''} ?`}
          style={S.question}
        />
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {OBJECTIF_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, objectif: opt.label }))}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.10)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 24px rgba(200,123,82,0.20)' : 'inset 0 1.5px 0 rgba(255,255,255,0.70), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:14,
                  fontFamily:"'DM Sans', sans-serif", textAlign:'left',
                  outline:'none',
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color='#C87B52' size={20}/>
                </div>
                <div style={{ flex:1 }}>
                  <span style={{
                    fontSize:15, fontWeight: isSel ? 600 : 400, display:'block',
                    color: isSel ? '#C87B52' : 'rgba(184,105,58,0.88)',
                    transition:'color 0.16s',
                  }}>{opt.label}</span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
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
          <AnimatedQuestion text={`Tu as quel âge${nom ? `, ${nom}` : ''} ?`} style={S.question} />
          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.30 }}
            style={S.sub}
          >
            Chaque étape de vie a ses forces et ses défis.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {AGE_RANGE_OPTIONS.map(({ range, Icon: AgeIcon }, i) => {
            const isSel = tapped === range
            return (
              <motion.button
                key={range}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(range, () => goNext({ ...answers, age: range }))}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 22px rgba(200,123,82,0.18)' : 'inset 0 1.5px 0 rgba(255,255,255,0.70), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left',
                  fontFamily:"'DM Sans', sans-serif",
                  outline:'none',
                  display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <AgeIcon color={isSel ? '#C87B52' : '#C87B52'} size={20}/>
                </div>
                <span style={{
                  fontSize:15, fontWeight: isSel ? 600 : 400,
                  color: isSel ? '#C87B52' : 'rgba(184,105,58,0.88)',
                  transition:'color 0.16s, font-weight 0.1s',
                }}>
                  {range}
                </span>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 3 : Activité ────────────────────────────────────────────────────
    if (step === 3) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <AnimatedQuestion text={`Tu en es où avec le sport${nom ? `, ${nom}` : ''} ?`} style={S.question} />
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {ACTIVITE_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, activite: opt.label }))}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 22px rgba(200,123,82,0.18)' : 'inset 0 1.5px 0 rgba(255,255,255,0.70), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left',
                  fontFamily:"'DM Sans', sans-serif",
                  outline:'none',
                  display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#C87B52' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{
                    fontSize:15, fontWeight: isSel ? 600 : 400,
                    color: isSel ? '#C87B52' : 'rgba(184,105,58,0.88)',
                    transition:'color 0.16s',
                  }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>
                    {opt.desc}
                  </span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
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
          <AnimatedQuestion text={`Et là, qu'est-ce qui t'a poussé à te lancer${nom ? `, ${nom}` : ''} ?`} style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Il n'y a pas de mauvaise réponse.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {TRIGGER_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, declencheur: opt.label }))}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1.5px 0 rgba(255,255,255,0.70), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#C87B52' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:14, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
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
          <AnimatedQuestion text={`Honnêtement${nom ? `, ${nom}` : ''}, comment tu vas ?`} style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Solenn s'adapte à où tu en es, sans jugement.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {BASELINE_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, baseline: opt.label }))}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1.5px 0 rgba(255,255,255,0.70), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#C87B52' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:14, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
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
          <AnimatedQuestion text="Quel moment de la journée t'appartient vraiment ?" style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Solenn se glissera dans tes moments à toi.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {MOMENT_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => {
                  const finalAnswers = { ...answers, moment: opt.label }
                  finishOnboarding(finalAnswers)
                })}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1.5px 0 rgba(255,255,255,0.70), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#C87B52' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:14, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
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
      fontFamily:"'DM Sans', sans-serif",
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
        @keyframes ctaPulse { 0%,100%{box-shadow:0 8px 24px rgba(200,123,82,0.40)} 50%{box-shadow:0 8px 36px rgba(200,123,82,0.68)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        button:focus-visible { outline:2px solid rgba(200,123,82,0.60); outline-offset:2px; }
      `}</style>

      <BgBlobs step={step} />
      <div style={{position:'absolute',inset:0,background:'rgba(255,245,235,0.22)',pointerEvents:'none',zIndex:1}}/>

      {/* Header */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        background:'rgba(255,248,244,0.60)',
        borderBottom:'1px solid rgba(255,255,255,0.42)',
        boxShadow:'0 2px 24px rgba(180,80,20,0.07)',
        paddingTop:'calc(env(safe-area-inset-top,0px) + 20px)',
        paddingBottom:16,
        display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:'100%', maxWidth:480, padding:'0 20px', boxSizing:'border-box' }}>
          {step > 0 && (
            <motion.button
              onClick={goBack}
              initial={{ opacity:0, x:-6 }}
              animate={{ opacity:1, x:0 }}
              whileTap={{ scale:0.92 }}
              style={{
                position:'absolute', left:20,
                width:36, height:36, borderRadius:'50%',
                background:'rgba(200,123,82,0.08)',
                border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              <BackIcon color="rgba(200,123,82,0.78)" size={18}/>
            </motion.button>
          )}
          <motion.span
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.1, duration:0.22, ease:'easeOut' }}
            style={{
              fontSize:24, fontWeight:400, letterSpacing:'-0.03em',
              fontFamily:"'Cormorant Garamond', Georgia, serif", fontStyle:'italic',
              color:'rgba(184,105,58,0.88)',
              textShadow:'0 1px 10px rgba(255,248,244,0.70)',
            }}
          >
            Solenn
          </motion.span>
        </div>

        {/* Progress segments */}
        <div style={{display:'flex', gap:4, alignItems:'center'}}>
          {[0,1,2,3,4,5,6].map(i => (
            <div
              key={i}
              style={{
                width:30, height:2, borderRadius:1,
                background: i <= step ? '#C87B52' : 'rgba(200,123,82,0.28)',
                transition:'background 0.22s ease-out',
              }}
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
        position:'relative', zIndex:2,
      }}>
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={step}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration:0.18, ease:'easeIn' }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
