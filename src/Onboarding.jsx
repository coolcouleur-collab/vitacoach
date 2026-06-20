import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const tags = [
    answers.activite,
    ...(Array.isArray(answers.alimentation) ? answers.alimentation.slice(0, 2) : []),
    answers.profession,
  ].filter(Boolean).slice(0, 4)

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
                }}>
                  {o}
                </span>
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
              }}>
                {t}
              </span>
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
            boxShadow:'none',
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

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:10, marginBottom:4, paddingLeft:4}}>
      <SolennAvatar />
      <div style={{
        display:'flex', alignItems:'center', gap:5,
        background:'rgba(255,248,244,0.90)',
        border:'1px solid rgba(200,123,82,0.20)',
        borderRadius:20, borderBottomLeftRadius:4,
        padding:'12px 18px',
        boxShadow:'0 2px 12px rgba(200,123,82,0.08)',
      }}>
        {[0,1,2].map(i => (
          <motion.span
            key={i}
            style={{
              display:'inline-block', width:7, height:7, borderRadius:'50%',
              background:'rgba(200,123,82,0.55)',
            }}
            animate={{opacity:[0.3,1,0.3]}}
            transition={{repeat:Infinity, duration:0.8, delay:i*0.2}}
          />
        ))}
      </div>
    </div>
  )
}

// ─── SOLENN AVATAR ────────────────────────────────────────────────────────────
function SolennAvatar() {
  return (
    <div style={{
      width:36, height:36, borderRadius:'50%', flexShrink:0,
      background:'linear-gradient(135deg, #C87B52, #E8962A)',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 2px 8px rgba(200,123,82,0.30)',
    }}>
      <span style={{
        fontSize:18, color:'#fff', fontStyle:'italic',
        fontFamily:"'Cormorant Garamond', Georgia, serif", fontWeight:600,
        lineHeight:1, marginTop:1,
      }}>S</span>
    </div>
  )
}

// ─── CHAT BUBBLE ──────────────────────────────────────────────────────────────
function SolennBubble({ text }) {
  return (
    <motion.div
      initial={{opacity:0, y:12}}
      animate={{opacity:1, y:0}}
      transition={{duration:0.3}}
      style={{display:'flex', alignItems:'flex-end', gap:10, marginBottom:4, paddingLeft:4}}
    >
      <SolennAvatar />
      <div style={{
        maxWidth:'78%',
        background:'rgba(255,248,244,0.90)',
        border:'1px solid rgba(200,123,82,0.20)',
        borderRadius:20, borderBottomLeftRadius:4,
        padding:'12px 18px',
        fontSize:15, fontWeight:500, color:'#0A1633', lineHeight:1.55,
        boxShadow:'0 2px 12px rgba(200,123,82,0.08)',
        fontFamily:'Poppins, sans-serif',
      }}>
        {text}
      </div>
    </motion.div>
  )
}

function UserBubble({ text }) {
  return (
    <motion.div
      initial={{opacity:0, y:12}}
      animate={{opacity:1, y:0}}
      transition={{duration:0.3}}
      style={{display:'flex', justifyContent:'flex-end', marginBottom:4, paddingRight:4}}
    >
      <div style={{
        maxWidth:'78%',
        background:'linear-gradient(135deg, #C87B52, #E8962A)',
        borderRadius:20, borderBottomRightRadius:4,
        padding:'12px 18px',
        fontSize:15, fontWeight:500, color:'#fff', lineHeight:1.55,
        boxShadow:'0 2px 12px rgba(200,123,82,0.28)',
        fontFamily:'Poppins, sans-serif',
      }}>
        {text}
      </div>
    </motion.div>
  )
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const OBJECTIF_OPTIONS = [
  { emoji:'⚡', label:'Énergie & vitalité' },
  { emoji:'⚖️', label:'Perdre du poids' },
  { emoji:'😴', label:'Mieux dormir' },
  { emoji:'🧘', label:'Gérer le stress' },
  { emoji:'💪', label:'Sport & forme' },
  { emoji:'🥗', label:'Alimentation saine' },
]

const ACTIVITE_OPTIONS = [
  { emoji:'🛋️', label:'Sédentaire' },
  { emoji:'🚶', label:'Léger' },
  { emoji:'🏃', label:'Modéré' },
  { emoji:'🔥', label:'Intense' },
]

const ALIMENTATION_OPTIONS = [
  'Équilibrée','Végétarienne','Vegan','Sans gluten','Omnivore','Prise de masse','Je mange n\'importe quoi',
]

const SANTE_CONDITIONS_OPTIONS = [
  'Diabète','Hypertension','Problèmes cardiaques','Allergie alimentaire',
  'Trouble du sommeil','Anxiété/dépression','Autre',
]

const LEVER_OPTIONS = [
  { label:'Avant 6h', val:5.5 },
  { label:'6h–7h', val:6.5 },
  { label:'7h–8h', val:7.5 },
  { label:'8h–9h', val:8.5 },
  { label:'Après 9h', val:9.5 },
]

const COUCHER_OPTIONS = [
  { label:'Avant 22h', val:21.5 },
  { label:'22h–23h', val:22.5 },
  { label:'23h–00h', val:23.5 },
  { label:'00h–1h', val:0.5 },
  { label:'Après 1h', val:2 },
]

const PROFESSION_OPTIONS = [
  'Étudiant·e','Salarié·e','Freelance/Indépendant','Entrepreneur','Sans emploi','Retraité·e','Autre',
]

// ─── STEPS ────────────────────────────────────────────────────────────────────
// Used to track conversation progress and compute progress bar
const STEP_ORDER = ['intro','nom','objectif','age','activite','alimentation','sante_yn','sante_conditions','lever','coucher','profession','taille_poids']
const TOTAL_STEPS = 10 // visible steps (excluding intro)

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [msgs, setMsgs] = useState([])
  const [chatStep, setChatStep] = useState('intro')
  const [answers, setAnswers] = useState({})
  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [inputMode, setInputMode] = useState(null)
  // inputMode: null | 'text' | 'number' | 'cards' | 'chips' | 'buttons' | 'dual_number'
  const [selectedChips, setSelectedChips] = useState([])
  const [ageVal, setAgeVal] = useState(25)
  const [tailleVal, setTailleVal] = useState(170)
  const [poidsVal, setPoidsVal] = useState(65)
  const [professionInput, setProfessionInput] = useState('')
  const [showReveal, setShowReveal] = useState(false)
  const [progress, setProgress] = useState(0)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll uniquement sur nouveaux messages (pas sur isTyping/inputMode)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs])

  // Start intro sequence on mount
  useEffect(() => {
    runIntro()
  }, [])

  // Update progress bar when chatStep changes
  useEffect(() => {
    const idx = STEP_ORDER.indexOf(chatStep)
    if (idx <= 1) setProgress(0)
    else setProgress(Math.round(((idx - 1) / TOTAL_STEPS) * 100))
  }, [chatStep])

  // ── Helper: queue Solenn messages with typing indicator ──────────────────────
  function sendSolenn(texts, delay = 0) {
    return new Promise(resolve => {
      let cursor = delay
      texts.forEach((text, i) => {
        setTimeout(() => {
          setIsTyping(true)
        }, cursor)
        cursor += 800
        setTimeout(() => {
          setIsTyping(false)
          setMsgs(m => [...m, { id: Date.now() + i, from:'solenn', text }])
          if (i === texts.length - 1) resolve()
        }, cursor)
        cursor += 100
      })
    })
  }

  function addUserMsg(text) {
    setMsgs(m => [...m, { id: Date.now(), from:'user', text }])
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────────
  function runIntro() {
    setInputMode(null)
    setChatStep('intro')
    const msgs = [
      "Hey ! 👋",
      "Moi c'est Solenn — ton coach de vie personnel ✨",
      "Quelques questions rapides pour personnaliser ton expérience !",
      "Pour commencer... comment tu t'appelles ?",
    ]
    msgs.forEach((text, i) => {
      setTimeout(() => {
        setMsgs(m => [...m, { id: i, from:'solenn', text }])
        if (i === msgs.length - 1) {
          setTimeout(() => {
            setChatStep('nom')
            setInputMode('text')
            inputRef.current?.focus()
          }, 150)
        }
      }, 300 + i * 400)
    })
  }

  // Sequential message sender — délais réduits pour fluidité mobile
  function sendSolennSeq(items) {
    return new Promise(resolve => {
      items.forEach((item, i) => {
        setTimeout(() => {
          setMsgs(m => [...m, { id: Date.now() + i, from:'solenn', text: item.text }])
          if (i === items.length - 1) setTimeout(resolve, 50)
        }, i * 180)
      })
    })
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  // ── STEP HANDLERS ─────────────────────────────────────────────────────────────

  async function handleNomSubmit() {
    const nom = inputVal.trim()
    if (!nom) return
    setInputMode(null)
    setInputVal('')
    addUserMsg(nom)
    setAnswers(a => ({ ...a, nom }))
    setChatStep('objectif')
    await delay(40)
    await sendSolennSeq([
      { text:`Enchanté·e ${nom} ! 😊`, after:0 },
      { text:"C'est quoi ton objectif principal ?", after:400 },
    ])
    setInputMode('cards')
  }

  async function handleObjectifSelect(opt) {
    const val = `${opt.emoji} ${opt.label}`
    setInputMode(null)
    addUserMsg(val)
    setAnswers(a => ({ ...a, objectif: val }))
    setChatStep('age')

    let reaction = 'Parfait !'
    if (opt.label.includes('nergie')) reaction = 'Top, on va booster ça 💪'
    else if (opt.label.includes('dormir')) reaction = 'Le sommeil c\'est la base, on s\'en occupe 🌙'
    else if (opt.label.includes('stress')) reaction = 'Je comprends, c\'est ma spécialité 🧘'
    else if (opt.label.includes('poids')) reaction = 'On va y arriver ensemble 🎯'
    else if (opt.label.includes('Sport')) reaction = 'On va aller loin ! 💪'
    else if (opt.label.includes('Aliment')) reaction = 'Bien manger, tout commence par là 🥗'

    await delay(40)
    await sendSolennSeq([
      { text:reaction, after:0 },
      { text:"Tu as quel âge ?", after:400 },
    ])
    setInputMode('number')
  }

  async function handleAgeSubmit() {
    setInputMode(null)
    addUserMsg(`${ageVal} ans`)
    setAnswers(a => ({ ...a, age: ageVal }))
    setChatStep('activite')
    await delay(40)
    await sendSolennSeq([
      { text:"OK ! Ton niveau d'activité physique en ce moment ?", after:0 },
    ])
    setInputMode('buttons')
  }

  async function handleActiviteSelect(opt) {
    const val = `${opt.emoji} ${opt.label}`
    setInputMode(null)
    addUserMsg(val)
    setAnswers(a => ({ ...a, activite: val }))
    setChatStep('alimentation')
    await delay(40)
    await sendSolennSeq([
      { text:"Et ton alimentation, tu te décrirais comment ?", after:0 },
    ])
    setSelectedChips([])
    setInputMode('chips')
  }

  async function handleAlimentationSubmit() {
    if (selectedChips.length === 0) return
    setInputMode(null)
    const val = selectedChips.join(', ')
    addUserMsg(val)
    setAnswers(a => ({ ...a, alimentation: selectedChips }))
    setSelectedChips([])
    setChatStep('sante_yn')
    await delay(40)
    await sendSolennSeq([
      { text:"Tu as des problèmes de santé dont je dois tenir compte ?", after:0 },
    ])
    setInputMode('buttons')
  }

  async function handleSanteYN(val) {
    setInputMode(null)
    addUserMsg(val)
    setAnswers(a => ({ ...a, sante_yn: val }))
    if (val === 'Non') {
      setChatStep('lever')
      await delay(40)
      await askLever()
    } else {
      setChatStep('sante_conditions')
      await delay(40)
      await sendSolennSeq([
        { text:"D'accord. Quelles conditions ?", after:0 },
      ])
      setSelectedChips([])
      setInputMode('chips')
    }
  }

  async function handleSanteConditionsSubmit() {
    if (selectedChips.length === 0) return
    setInputMode(null)
    const val = selectedChips.join(', ')
    addUserMsg(val)
    setAnswers(a => ({ ...a, sante_conditions: selectedChips }))
    setSelectedChips([])
    setChatStep('lever')
    await delay(40)
    await sendSolennSeq([
      { text:"Merci pour cette info — j'en tiendrai compte dans chaque conseil.", after:0 },
    ])
    await delay(200)
    await askLever()
  }

  async function askLever() {
    await sendSolennSeq([
      { text:"Presque fini ! À quelle heure tu te lèves en général ?", after:0 },
    ])
    setInputMode('buttons')
  }

  async function handleLeverSelect(opt) {
    setInputMode(null)
    addUserMsg(opt.label)
    setAnswers(a => ({ ...a, lever: opt.val }))
    setChatStep('coucher')
    await delay(40)
    await sendSolennSeq([
      { text:"Et tu te couches vers ?", after:0 },
    ])
    setInputMode('buttons')
  }

  async function handleCoucherSelect(opt) {
    setInputMode(null)
    addUserMsg(opt.label)
    setAnswers(a => ({ ...a, coucher: opt.val }))
    setChatStep('profession')
    await delay(40)
    await sendSolennSeq([
      { text:"Dernière chose — tu fais quoi dans la vie ?", after:0 },
    ])
    setProfessionInput('')
    setInputMode('chips')
    setSelectedChips([])
  }

  async function handleProfessionSubmit() {
    const val = professionInput.trim()
    if (!val) return
    setInputMode(null)
    addUserMsg(val)
    setAnswers(a => ({ ...a, profession: val }))
    setChatStep('taille_poids')
    await delay(40)
    await sendSolennSeq([
      { text:"Ta taille et ton poids ? (pour les conseils nutrition)", after:0 },
    ])
    setInputMode('dual_number')
  }

  async function handleTaillePoidsSubmit() {
    setInputMode(null)
    const nom = answers.nom || ''
    addUserMsg(`${tailleVal} cm / ${poidsVal} kg`)
    const finalAnswers = { ...answers, taille: tailleVal, poids: poidsVal }
    setAnswers(finalAnswers)
    setChatStep('fin')
    await delay(40)
    setIsTyping(true)
    await delay(40)
    setIsTyping(false)
    setMsgs(m => [...m, { id: Date.now(), from:'solenn', text:`Parfait ${nom} ! Je prépare ton espace... 🌟` }])
    await delay(1500)
    finishOnboarding(finalAnswers)
  }

  function finishOnboarding(finalAnswers) {
    const a = finalAnswers || answers
    const profil = {
      nom:              a.nom || 'Ami',
      objectif:         a.objectif || '',
      objectifs:        a.objectif ? [a.objectif] : [],
      age:              parseInt(a.age) || 0,
      activite:         a.activite || '',
      alimentation:     a.alimentation || [],
      heure_lever:      a.lever || 7.5,
      heure_coucher:    a.coucher || 23.5,
      profession:       a.profession || '',
      poids:            parseFloat(a.poids) || 0,
      taille:           parseFloat(a.taille) || 0,
      sante:            a.sante_yn === 'Oui',
      sante_conditions: a.sante_conditions || [],
      isPro:            false,
    }
    localStorage.setItem('vitacoach_profil', JSON.stringify(profil))
    window._solennProfil = profil
    setShowReveal(true)
  }

  // ── Chips helpers ─────────────────────────────────────────────────────────────
  function toggleChip(val) {
    setSelectedChips(c => c.includes(val) ? c.filter(x => x !== val) : [...c, val])
  }

  // ── Current input area renderer ───────────────────────────────────────────────
  function renderInputArea() {
    if (!inputMode) return null

    // Text input
    if (inputMode === 'text') {
      return (
        <motion.div
          key="input-text"
          initial={{opacity:0, y:16}}
          animate={{opacity:1, y:0}}
          transition={{duration:0.3}}
          style={{display:'flex', gap:10, padding:'12px 16px', alignItems:'center'}}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && inputVal.trim() && handleNomSubmit()}
            placeholder="Ton prénom..."
            style={{
              flex:1, padding:'13px 18px', borderRadius:24,
              border:'1.5px solid rgba(200,123,82,0.28)',
              background:'rgba(255,248,244,0.85)',
              backdropFilter:'blur(12px)',
              fontSize:16, fontFamily:'Poppins, sans-serif', color:'#0A1633',
              outline:'none', fontWeight:500,
              boxShadow:'0 2px 12px rgba(200,123,82,0.08)',
            }}
          />
          <button
            onClick={handleNomSubmit}
            disabled={!inputVal.trim()}
            style={{
              width:46, height:46, borderRadius:'50%', border:'none',
              background: inputVal.trim()
                ? 'linear-gradient(135deg, #C87B52, #E8962A)'
                : 'rgba(200,123,82,0.18)',
              color:'#fff', fontSize:20, cursor: inputVal.trim() ? 'pointer' : 'default',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
              boxShadow: inputVal.trim() ? '0 4px 14px rgba(200,123,82,0.35)' : 'none',
              transition:'all 0.2s',
            }}
          >↩</button>
        </motion.div>
      )
    }

    // Number input (age)
    if (inputMode === 'number') {
      return (
        <motion.div
          key="input-number"
          initial={{opacity:0, y:16}}
          animate={{opacity:1, y:0}}
          transition={{duration:0.3}}
          style={{padding:'12px 16px 16px'}}
        >
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:14}}>
            <button
              onClick={() => setAgeVal(v => Math.max(13, v - 1))}
              style={numBtnStyle}
            >−</button>
            <div style={{
              display:'flex', alignItems:'baseline', gap:6,
              background:'rgba(255,248,244,0.90)',
              border:'1.5px solid rgba(200,123,82,0.25)',
              borderRadius:16, padding:'10px 24px',
              boxShadow:'0 2px 12px rgba(200,123,82,0.10)',
            }}>
              <span style={{fontSize:46, fontWeight:900, color:'rgba(200,123,82,0.90)', fontFamily:'Poppins, sans-serif', lineHeight:1}}>
                {ageVal}
              </span>
              <span style={{fontSize:16, color:'rgba(200,123,82,0.65)', fontWeight:600}}>ans</span>
            </div>
            <button
              onClick={() => setAgeVal(v => Math.min(100, v + 1))}
              style={numBtnStyle}
            >+</button>
          </div>
          <div style={{display:'flex', justifyContent:'center'}}>
            <button onClick={handleAgeSubmit} style={sendBtnStyle}>
              Envoyer ↩
            </button>
          </div>
        </motion.div>
      )
    }

    // Cards (objectif)
    if (inputMode === 'cards' && chatStep === 'objectif') {
      return (
        <motion.div
          key="input-cards-objectif"
          initial={{opacity:0, y:16}}
          animate={{opacity:1, y:0}}
          transition={{duration:0.3}}
          style={{padding:'8px 12px 14px'}}
        >
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8,
          }}>
            {OBJECTIF_OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.label}
                initial={{opacity:0, y:12}}
                animate={{opacity:1, y:0}}
                transition={{duration:0.28, delay: i * 0.05}}
                onClick={() => handleObjectifSelect(opt)}
                style={cardBtnStyle}
              >
                <span style={{fontSize:22, display:'block', marginBottom:4}}>{opt.emoji}</span>
                <span style={{fontSize:12, fontWeight:600, color:'rgba(200,123,82,0.88)', fontFamily:'Poppins, sans-serif', lineHeight:1.3}}>
                  {opt.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )
    }

    // Buttons (activité, santé oui/non, lever, coucher)
    if (inputMode === 'buttons') {
      let options = []
      let onSelect = null

      if (chatStep === 'activite') {
        options = ACTIVITE_OPTIONS.map(o => `${o.emoji} ${o.label}`)
        onSelect = async (val) => {
          const opt = ACTIVITE_OPTIONS.find(o => `${o.emoji} ${o.label}` === val)
          await handleActiviteSelect(opt)
        }
      } else if (chatStep === 'sante_yn') {
        options = ['✅ Oui', '❌ Non']
        onSelect = async (val) => {
          const yn = val.includes('Oui') ? 'Oui' : 'Non'
          await handleSanteYN(yn)
        }
      } else if (chatStep === 'lever') {
        options = LEVER_OPTIONS.map(o => o.label)
        onSelect = async (val) => {
          const opt = LEVER_OPTIONS.find(o => o.label === val)
          await handleLeverSelect(opt)
        }
      } else if (chatStep === 'coucher') {
        options = COUCHER_OPTIONS.map(o => o.label)
        onSelect = async (val) => {
          const opt = COUCHER_OPTIONS.find(o => o.label === val)
          await handleCoucherSelect(opt)
        }
      }

      return (
        <motion.div
          key={`input-buttons-${chatStep}`}
          initial={{opacity:0, y:16}}
          animate={{opacity:1, y:0}}
          transition={{duration:0.3}}
          style={{padding:'8px 12px 14px'}}
        >
          <div style={{display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center'}}>
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                initial={{opacity:0, y:12}}
                animate={{opacity:1, y:0}}
                transition={{duration:0.28, delay: i * 0.05}}
                onClick={() => onSelect && onSelect(opt)}
                style={chipBtnStyle}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )
    }

    // Chips multi-select (alimentation, sante_conditions, profession)
    if (inputMode === 'chips') {
      let options = []
      let onValidate = null
      let showTextInput = false

      if (chatStep === 'alimentation') {
        options = ALIMENTATION_OPTIONS
        onValidate = handleAlimentationSubmit
      } else if (chatStep === 'sante_conditions') {
        options = SANTE_CONDITIONS_OPTIONS
        onValidate = handleSanteConditionsSubmit
      } else if (chatStep === 'profession') {
        options = PROFESSION_OPTIONS
        showTextInput = true
        onValidate = handleProfessionSubmit
      }

      return (
        <motion.div
          key={`input-chips-${chatStep}`}
          initial={{opacity:0, y:16}}
          animate={{opacity:1, y:0}}
          transition={{duration:0.3}}
          style={{padding:'8px 12px 14px'}}
        >
          <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:10}}>
            {options.map((opt, i) => {
              const sel = chatStep === 'profession'
                ? professionInput === opt
                : selectedChips.includes(opt)
              return (
                <motion.button
                  key={opt}
                  initial={{opacity:0, y:8}}
                  animate={{opacity:1, y:0}}
                  transition={{duration:0.25, delay: i * 0.04}}
                  onClick={() => {
                    if (chatStep === 'profession') {
                      setProfessionInput(opt)
                    } else {
                      toggleChip(opt)
                    }
                  }}
                  style={{
                    ...chipBtnStyle,
                    background: sel
                      ? 'linear-gradient(135deg, rgba(200,123,82,0.15), rgba(232,150,42,0.12))'
                      : 'rgba(255,248,244,0.80)',
                    border: sel
                      ? '1.5px solid rgba(200,123,82,0.55)'
                      : '1px solid rgba(200,123,82,0.20)',
                    color: sel ? 'rgba(200,123,82,0.95)' : 'rgba(200,123,82,0.72)',
                    fontWeight: sel ? 700 : 500,
                  }}
                >
                  {sel && chatStep !== 'profession' && <span style={{marginRight:4, fontSize:11}}>✓</span>}
                  {opt}
                </motion.button>
              )
            })}
          </div>

          {showTextInput && (
            <input
              type="text"
              value={professionInput}
              onChange={e => setProfessionInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && professionInput.trim() && handleProfessionSubmit()}
              placeholder="Ou tape directement..."
              style={{
                width:'100%', padding:'11px 16px', borderRadius:20, boxSizing:'border-box',
                border:'1.5px solid rgba(200,123,82,0.25)',
                background:'rgba(255,248,244,0.85)',
                fontSize:16, fontFamily:'Poppins, sans-serif', color:'#0A1633',
                outline:'none', fontWeight:500, marginBottom:10,
              }}
            />
          )}

          <div style={{display:'flex', justifyContent:'flex-end'}}>
            <button
              onClick={chatStep === 'profession' ? handleProfessionSubmit : onValidate}
              disabled={chatStep === 'profession' ? !professionInput.trim() : selectedChips.length === 0}
              style={{
                ...sendBtnStyle,
                opacity: (chatStep === 'profession' ? professionInput.trim() : selectedChips.length > 0) ? 1 : 0.4,
                cursor: (chatStep === 'profession' ? professionInput.trim() : selectedChips.length > 0) ? 'pointer' : 'default',
              }}
            >
              Valider →
            </button>
          </div>
        </motion.div>
      )
    }

    // Dual number (taille + poids)
    if (inputMode === 'dual_number') {
      return (
        <motion.div
          key="input-dual"
          initial={{opacity:0, y:16}}
          animate={{opacity:1, y:0}}
          transition={{duration:0.3}}
          style={{padding:'12px 16px 16px'}}
        >
          <div style={{display:'flex', gap:12, marginBottom:14}}>
            {/* Taille */}
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:6}}>
              <span style={{fontSize:12, fontWeight:600, color:'rgba(200,123,82,0.70)', textAlign:'center', fontFamily:'Poppins, sans-serif'}}>Taille</span>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <button onClick={() => setTailleVal(v => Math.max(130, v - 1))} style={{...numBtnSmall}}>−</button>
                <div style={{
                  flex:1, display:'flex', alignItems:'baseline', justifyContent:'center', gap:4,
                  background:'rgba(255,248,244,0.90)', border:'1.5px solid rgba(200,123,82,0.22)',
                  borderRadius:12, padding:'8px 10px',
                }}>
                  <span style={{fontSize:28, fontWeight:900, color:'rgba(200,123,82,0.88)', fontFamily:'Poppins, sans-serif', lineHeight:1}}>
                    {tailleVal}
                  </span>
                  <span style={{fontSize:13, color:'rgba(200,123,82,0.60)', fontWeight:600}}>cm</span>
                </div>
                <button onClick={() => setTailleVal(v => Math.min(230, v + 1))} style={{...numBtnSmall}}>+</button>
              </div>
            </div>
            {/* Poids */}
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:6}}>
              <span style={{fontSize:12, fontWeight:600, color:'rgba(200,123,82,0.70)', textAlign:'center', fontFamily:'Poppins, sans-serif'}}>Poids</span>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <button onClick={() => setPoidsVal(v => Math.max(30, v - 1))} style={{...numBtnSmall}}>−</button>
                <div style={{
                  flex:1, display:'flex', alignItems:'baseline', justifyContent:'center', gap:4,
                  background:'rgba(255,248,244,0.90)', border:'1.5px solid rgba(200,123,82,0.22)',
                  borderRadius:12, padding:'8px 10px',
                }}>
                  <span style={{fontSize:28, fontWeight:900, color:'rgba(200,123,82,0.88)', fontFamily:'Poppins, sans-serif', lineHeight:1}}>
                    {poidsVal}
                  </span>
                  <span style={{fontSize:13, color:'rgba(200,123,82,0.60)', fontWeight:600}}>kg</span>
                </div>
                <button onClick={() => setPoidsVal(v => Math.min(250, v + 1))} style={{...numBtnSmall}}>+</button>
              </div>
            </div>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end'}}>
            <button onClick={handleTaillePoidsSubmit} style={sendBtnStyle}>
              C'est parti →
            </button>
          </div>
        </motion.div>
      )
    }

    return null
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────
  if (showReveal) {
    return (
      <RevealScreen
        answers={answers}
        onEnter={() => {
          const profil = window._solennProfil
          if (profil) onTermine(profil)
        }}
      />
    )
  }

  return (
    <div style={{
      minHeight:'100vh', background:'transparent',
      fontFamily:'Poppins, sans-serif',
      display:'flex', flexDirection:'column',
      position:'relative', overflowX:'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Cormorant+Garamond:ital@1&display=swap');
        @keyframes liquidBlob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,5%) scale(1.06)} 66%{transform:translate(-2%,-3%) scale(0.96)} }
        @keyframes liquidBlob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-4%,3%) scale(1.08)} 70%{transform:translate(2%,-5%) scale(0.94)} }
        @keyframes liquidBlob3 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(2%,-4%) scale(1.05)} 65%{transform:translate(-3%,2%) scale(0.97)} }
        @keyframes liquidBlob4 { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(-3%,4%) scale(1.07)} 75%{transform:translate(4%,-2%) scale(0.95)} }
        @keyframes revealPulse { 0%,100%{box-shadow:0 0 0 8px rgba(200,123,82,0.08),0 0 0 16px rgba(200,123,82,0.04)} 50%{box-shadow:0 0 0 12px rgba(200,123,82,0.13),0 0 0 22px rgba(200,123,82,0.06)} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(200,123,82,0.20); border-radius:4px; }
        input:focus { outline:none; }
        input::placeholder { color:rgba(200,123,82,0.45); }
      `}</style>

      <BgBlobs />

      {/* Progress bar */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, height:3,
        background:'rgba(200,123,82,0.10)', zIndex:100,
      }}>
        <div style={{
          height:'100%', width:`${progress}%`,
          background:'linear-gradient(90deg, #C87B52, #E8962A)',
          transition:'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          borderRadius:2,
        }} />
      </div>

      {/* Logo */}
      <div style={{
        position:'fixed', top:10, left:'50%', transform:'translateX(-50%)', zIndex:100,
        background:'rgba(255,248,244,0.80)', backdropFilter:'blur(12px)',
        padding:'4px 16px', borderRadius:20, border:'1px solid rgba(200,123,82,0.14)',
      }}>
        <span style={{fontSize:16, fontWeight:900, letterSpacing:'-0.04em', color:'rgba(200,123,82,0.75)'}}>
          Solenn
        </span>
      </div>

      {/* Chat messages area */}
      <div style={{
        flex:1, overflowY:'auto', padding:'60px 12px 12px',
        display:'flex', flexDirection:'column', justifyContent:'flex-end',
        maxWidth:600, width:'100%', margin:'0 auto', boxSizing:'border-box',
        minHeight:'calc(100vh - 180px)',
      }}>
        <div style={{display:'flex', flexDirection:'column', gap:2}}>
          {msgs.map(msg => (
            msg.from === 'solenn'
              ? <SolennBubble key={msg.id} text={msg.text} />
              : <UserBubble key={msg.id} text={msg.text} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} style={{height:4}} />
        </div>
      </div>

      {/* Input area */}
      <div style={{
        position:'sticky', bottom:0,
        background:'rgba(255,248,244,0.97)',
        borderTop:'1px solid rgba(200,123,82,0.12)',
        width:'100%',
        zIndex:50,
      }}>
        <div style={{maxWidth:600, margin:'0 auto'}}>
          <AnimatePresence mode="wait">
            {renderInputArea()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── SHARED BUTTON STYLES ─────────────────────────────────────────────────────
const numBtnStyle = {
  width:52, height:52, borderRadius:'50%', border:'none',
  background:'linear-gradient(135deg, #C87B52, #E8962A)',
  color:'#fff', fontSize:24, fontWeight:700, cursor:'pointer',
  fontFamily:'Poppins, sans-serif',
  display:'flex', alignItems:'center', justifyContent:'center',
  boxShadow:'0 4px 14px rgba(200,123,82,0.35)',
  flexShrink:0, lineHeight:1, outline:'none',
}

const numBtnSmall = {
  width:34, height:34, borderRadius:'50%', border:'none',
  background:'linear-gradient(135deg, #C87B52, #E8962A)',
  color:'#fff', fontSize:18, fontWeight:700, cursor:'pointer',
  fontFamily:'Poppins, sans-serif',
  display:'flex', alignItems:'center', justifyContent:'center',
  boxShadow:'0 3px 10px rgba(200,123,82,0.30)',
  flexShrink:0, lineHeight:1, outline:'none',
}

const sendBtnStyle = {
  padding:'11px 22px', borderRadius:24, border:'none',
  background:'linear-gradient(135deg, #C87B52, #E8962A)',
  color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
  fontFamily:'Poppins, sans-serif',
  boxShadow:'0 4px 14px rgba(200,123,82,0.32)',
  outline:'none', transition:'opacity 0.2s',
}

const cardBtnStyle = {
  padding:'12px 8px', borderRadius:16,
  border:'1px solid rgba(200,123,82,0.22)',
  background:'rgba(255,248,244,0.88)',
  cursor:'pointer', textAlign:'center',
  fontFamily:'Poppins, sans-serif',
  boxShadow:'0 2px 10px rgba(200,123,82,0.07)',
  transition:'all 0.18s', outline:'none',
}

const chipBtnStyle = {
  padding:'9px 16px', borderRadius:40,
  border:'1px solid rgba(200,123,82,0.22)',
  background:'rgba(255,248,244,0.85)',
  cursor:'pointer', fontSize:13, fontWeight:500,
  color:'rgba(200,123,82,0.78)',
  fontFamily:'Poppins, sans-serif',
  transition:'all 0.18s', outline:'none',
  boxShadow:'0 1px 6px rgba(200,123,82,0.07)',
}
