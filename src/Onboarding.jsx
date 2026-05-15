import React, { useState, useEffect, useRef } from 'react'
import { FlashIcon, FoodIcon, MuscleIcon, MeditateIcon, RunIcon, BrainIcon, FireIcon, GiftIcon, LeafIcon } from './Icons'

// ─── BG BLOBS ─────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      {/* Jaune doux — haut-centre, multiply */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 50% 48%, #FFF991 0%, transparent 68%)',
        opacity:0.62, mixBlendMode:'multiply',
        animation:'liquidBlob3 14s ease-in-out infinite',
      }}/>
      {/* Orange léger — bas-gauche, multiply */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 42% 58%, #FF7112 0%, transparent 62%)',
        opacity:0.20, mixBlendMode:'multiply',
        animation:'liquidBlob1 18s ease-in-out infinite reverse',
      }}/>
      {/* Pêche chaud haut-droite */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 88% 8%, rgba(232,140,80,0.45) 0%, transparent 58%)',
        filter:'blur(72px)',
        animation:'liquidBlob2 16s ease-in-out infinite',
      }}/>
      {/* Ambre bas-gauche */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 8% 90%, rgba(212,132,74,0.32) 0%, transparent 52%)',
        filter:'blur(64px)',
        animation:'liquidBlob4 20s ease-in-out infinite reverse',
      }}/>
      {/* Chaleur bas-droite */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 82% 80%, rgba(255,180,80,0.28) 0%, transparent 50%)',
        filter:'blur(50px)',
        animation:'liquidBlob3 11s ease-in-out infinite 2s',
      }}/>
    </div>
  )
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id:'nom', type:'text',
    question:'Comment tu t\'appelles ?',
    subtitle:'Le prénom que Solenn utilisera pour toi',
    placeholder:'Ton prénom',
  },
  {
    id:'objectif', type:'cards',
    question:(a) => `Quel est ton objectif principal, ${a.nom || ''} ?`,
    subtitle:'On va personnaliser toute ton expérience autour de ça',
    options:[
      {iconEl:<FlashIcon size={20} color="rgba(218,138,52,0.85)" />,  label:"Plus d'énergie"},
      {iconEl:<LeafIcon size={20} color="rgba(218,138,52,0.75)" />,   label:'Mieux dormir'},
      {iconEl:<FoodIcon size={20} color="#34c759" />,                 label:'Manger sainement'},
      {iconEl:<MuscleIcon size={20} color="rgba(218,138,52,0.85)" />, label:'Prendre du muscle'},
      {iconEl:<MeditateIcon size={20} color="#818cf8" />,             label:'Réduire le stress'},
      {iconEl:<RunIcon size={20} color="#38bdf8" />,                  label:'Perdre du poids'},
      {iconEl:<RunIcon size={20} color="rgba(218,138,52,0.75)" />,    label:'Courir un marathon'},
      {iconEl:<BrainIcon size={20} color="rgba(218,138,52,0.85)" />,  label:'Productivité maximale'},
    ],
    multi: true
  },
  {
    id:'age', type:'number',
    question:'Quel âge as-tu ?',
    subtitle:'Pour adapter nos conseils à ta tranche de vie',
    placeholder:'Ex: 28',
    unit:'ans', min:13, max:100
  },
  {
    id:'activite', type:'cards',
    question:"Quel est ton niveau d'activité physique ?",
    subtitle:'Sois honnête, on ne juge pas :)',
    options:[
      {iconEl:<LeafIcon size={20} color="#9ca3af" />,                    label:'Sédentaire',       sub:'Bureau, peu de sport'},
      {iconEl:<RunIcon size={20} color="#38bdf8" />,                     label:'Légèrement actif', sub:'Marche quotidienne'},
      {iconEl:<MuscleIcon size={20} color="rgba(218,138,52,0.80)" />,    label:'Modérément actif', sub:'Sport 2-3x/semaine'},
      {iconEl:<FireIcon size={20} color="rgba(218,138,52,0.90)" />,      label:'Très actif',       sub:'Sport 4-5x/semaine'},
      {iconEl:<FlashIcon size={20} color="#fbbf24" />,                   label:'Sportif intensif', sub:'Entraînement quotidien'},
    ],
    multi: false
  },
  {
    id:'alimentation', type:'chips',
    question:'Comment tu décris ton alimentation ?',
    subtitle:'Sélectionne tout ce qui te correspond',
    options:['Omnivore','Végétarien','Vegan','Flexitarien','Keto','Sans gluten',
             'Sans lactose','Méditerranéen','Jeûne intermittent','Halal','Casher','Paléo'],
    multi: true
  },
  {
    id:'sante_yn', type:'cards',
    question:'As-tu des problèmes de santé ?',
    subtitle:'Pour que nos conseils soient totalement adaptés et sans risque pour toi',
    options:[
      {iconEl:<MeditateIcon size={20} color="rgba(218,138,52,0.80)" />, label:'Oui', sub:"J'ai des conditions médicales"},
      {iconEl:<GiftIcon size={20} color="#34c759" />,                   label:'Non', sub:'Je suis en bonne santé'},
    ],
    multi: false
  },
  {
    id:'sante_conditions', type:'chips',
    question:'Quelles conditions as-tu ?',
    subtitle:'Plusieurs choix possibles — on adaptera chaque conseil',
    condition: (a) => a.sante_yn === 'Oui',
    options:[
      'Diabète type 1','Diabète type 2','Hypertension','Hypotension',
      'Hypothyroïdie','Hyperthyroïdie','Asthme','Cholestérol élevé',
      'Dépression / Anxiété','Endométriose','SOPK','Maladie cœliaque',
      'Arthrite / Arthrose','Carence en fer','Carence en Vit. D',
      'Maladie de Crohn','Psoriasis','Autre'
    ],
    multi: true, skip: true
  },
  {
    id:'sante_detail', type:'textarea',
    question:'Décris ta situation en détail',
    subtitle:'Plus tu es précis, meilleurs seront nos conseils',
    placeholder:'Ex: Diabète type 2 depuis 3 ans, sous Metformine 1g/jour. Carence en Vit. D confirmée...',
    condition: (a) => a.sante_yn === 'Oui',
    skip: true
  },
  {
    id:'taille', type:'number',
    question:'Quelle est ta taille ?',
    subtitle:'Pour calculer ton IMC et adapter tes objectifs',
    placeholder:'170',
    unit:'cm', min:130, max:230,
    skip: true
  },
  {
    id:'poids', type:'number',
    question:'Quel est ton poids ?',
    subtitle:'Utilisé uniquement pour personnaliser tes conseils nutritionnels',
    placeholder:'65',
    unit:'kg', min:30, max:250,
    skip: true
  },
  {
    id:'reveil', type:'time',
    question:'À quelle heure tu te lèves ?',
    subtitle:'Pour une routine calée sur ton rythme naturel',
    default: '07:00'
  },
  {
    id:'coucher', type:'time',
    question:'Et à quelle heure tu te couches ?',
    subtitle:'Pour optimiser tes conseils sommeil et récupération',
    default: '23:00'
  },
  {
    id:'profession', type:'text',
    question:'Quelle est ta profession ?',
    subtitle:'Pour adapter tes conseils à ton emploi du temps',
    placeholder:'Ex: Ingénieur, étudiant, commercial...',
    skip: true
  },
  {
    id:'style', type:'chips',
    question:'Ton style vestimentaire ?',
    subtitle:'Pour des conseils tenues personnalisés',
    skip: true,
    options:['Casual','Sportif','Élégant','Business','Streetwear','Minimaliste',
             'Bohème','Vintage','Luxe','Athleisure'],
    multi: true
  },
]

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function getVisibleQs(answers) {
  return QUESTIONS.filter(q => !q.condition || q.condition(answers))
}
function getNextStep(currentStep, answers) {
  let next = currentStep + 1
  while (next < QUESTIONS.length) {
    if (!QUESTIONS[next].condition || QUESTIONS[next].condition(answers)) return next
    next++
  }
  return null
}
function getPrevStep(currentStep, answers) {
  let prev = currentStep - 1
  while (prev >= 0) {
    if (!QUESTIONS[prev].condition || QUESTIONS[prev].condition(answers)) return prev
    prev--
  }
  return null
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
  const objectifs = Array.isArray(answers.objectif) ? answers.objectif : answers.objectif ? [answers.objectif] : []

  const tags = [
    answers.activite,
    ...(Array.isArray(answers.alimentation) ? answers.alimentation.slice(0,2) : []),
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

        {/* Avatar orb */}
        <div style={{
          width:88, height:88, borderRadius:'50%',
          background:'linear-gradient(135deg,rgba(218,138,52,0.35),rgba(190,112,30,0.25))',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:24,
          boxShadow:'0 0 0 8px rgba(218,138,52,0.08), 0 0 0 16px rgba(218,138,52,0.04)',
          animation:'revealPulse 2.8s ease-in-out infinite',
        }}>
          <span style={{
            fontSize:38, fontWeight:800, color:'rgba(218,138,52,0.80)',
            fontFamily:'Poppins, sans-serif', letterSpacing:'-0.02em',
          }}>
            {nom.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <div style={{fontSize:13, fontWeight:600, color:'rgba(218,138,52,0.55)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10}}>
          Profil créé
        </div>
        <h1 style={{fontSize:'clamp(28px,7vw,40px)', fontWeight:900, color:'rgba(218,138,52,0.90)', letterSpacing:'-0.03em', marginBottom:6, lineHeight:1.1}}>
          Bonjour, {nom} !
        </h1>
        <p style={{fontSize:15, color:'rgba(218,138,52,0.55)', marginBottom:32, lineHeight:1.6}}>
          Solenn connaît ton profil et est prête à t'accompagner.
        </p>

        {/* Objectifs */}
        {objectifs.length > 0 && (
          <div style={{marginBottom:20, width:'100%'}}>
            <div style={{fontSize:11, fontWeight:700, color:'rgba(218,138,52,0.45)', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:10}}>
              Tes objectifs
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center'}}>
              {objectifs.map(o => (
                <span key={o} style={{
                  padding:'7px 16px', borderRadius:20,
                  background:'rgba(218,138,52,0.09)',
                  border:'1px solid rgba(218,138,52,0.22)',
                  fontSize:12, fontWeight:600, color:'rgba(218,138,52,0.80)',
                }}>
                  {o}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center', marginBottom:40}}>
            {tags.map(t => (
              <span key={t} style={{
                padding:'5px 12px', borderRadius:20,
                background:'rgba(218,138,52,0.05)',
                border:'1px solid rgba(218,138,52,0.14)',
                fontSize:11, fontWeight:500, color:'rgba(218,138,52,0.55)',
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onEnter}
          style={{
            width:'100%', height:58,
            background:'linear-gradient(145deg,rgba(218,138,52,0.85),rgba(190,112,30,0.90))',
            color:'rgba(255,245,225,0.96)', border:'none', borderRadius:22,
            fontSize:17, fontWeight:800, cursor:'pointer',
            fontFamily:'Poppins, sans-serif',
            boxShadow:'0 12px 36px rgba(218,138,52,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            opacity: btnVisible ? 1 : 0,
            transform: btnVisible ? 'translateY(0)' : 'translateY(14px)',
            transition:'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            letterSpacing:'0.3px',
          }}
        >
          Entrer dans Solenn ✦
        </button>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [step, setStep]           = useState(0)
  const [answers, setAnswers]     = useState({})
  const [direction, setDirection] = useState('forward')
  const [animKey, setAnimKey]     = useState(0)
  const [inputVal, setInputVal]   = useState('')
  const [showReveal, setShowReveal] = useState(false)

  const q = QUESTIONS[step]
  const questionText = typeof q.question === 'function' ? q.question(answers) : q.question

  const visibleQs  = getVisibleQs(answers)
  const visibleIdx = visibleQs.findIndex(vq => vq.id === q.id)
  const progress   = visibleQs.length > 0 ? ((visibleIdx + 1) / visibleQs.length) * 100 : 0

  useEffect(() => {
    const existing = answers[q.id]
    if (q.type === 'text' || q.type === 'number' || q.type === 'textarea') {
      setInputVal(existing || '')
    } else if (q.type === 'time') {
      setInputVal(existing || q.default || '07:00')
    }
  }, [step])

  function advance(newAnswers) {
    const next = getNextStep(step, newAnswers)
    if (next !== null) {
      setDirection('forward')
      setAnimKey(k => k + 1)
      setStep(next)
      setInputVal('')
    } else {
      finish(newAnswers)
    }
  }

  function goNext() {
    let newAnswers = answers
    if (q.type === 'text' || q.type === 'number') {
      if (!inputVal.trim() && !q.skip) return
      newAnswers = { ...answers, [q.id]: inputVal }
      setAnswers(newAnswers)
    } else if (q.type === 'textarea') {
      newAnswers = { ...answers, [q.id]: inputVal }
      setAnswers(newAnswers)
    } else if (q.type === 'time') {
      newAnswers = { ...answers, [q.id]: inputVal || q.default }
      setAnswers(newAnswers)
    }
    advance(newAnswers)
  }

  function goBack() {
    const prev = getPrevStep(step, answers)
    if (prev === null) return
    setDirection('back')
    setAnimKey(k => k + 1)
    setStep(prev)
    setInputVal('')
  }

  function handleCardClick(val) {
    if (q.multi) {
      setAnswers(a => {
        const cur = Array.isArray(a[q.id]) ? a[q.id] : []
        return { ...a, [q.id]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] }
      })
    } else {
      const newAnswers = { ...answers, [q.id]: val }
      setAnswers(newAnswers)
      setTimeout(() => advance(newAnswers), 220)
    }
  }

  function toggleChip(val) {
    setAnswers(a => {
      const cur = Array.isArray(a[q.id]) ? a[q.id] : []
      return { ...a, [q.id]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] }
    })
  }

  function isSelected(val) {
    const cur = answers[q.id]
    if (q.multi) return Array.isArray(cur) && cur.includes(val)
    return cur === val
  }

  function canContinue() {
    if (q.skip) return true
    const cur = answers[q.id]
    if (q.type === 'cards' || q.type === 'chips') {
      if (q.multi) return Array.isArray(cur) && cur.length > 0
      return !!cur
    }
    if (q.type === 'text' || q.type === 'number') return inputVal.trim().length > 0
    return true
  }

  function skipStep() {
    const next = getNextStep(step, answers)
    if (next !== null) {
      setDirection('forward'); setAnimKey(k => k + 1); setStep(next); setInputVal('')
    } else finish(answers)
  }

  function finish(finalAnswers) {
    const a = finalAnswers || answers
    const hasHealth = a.sante_yn === 'Oui'
    const profil = {
      nom:        a.nom        || 'Ami',
      age:        a.age        || '',
      taille:     a.taille     || '',
      poids:      a.poids      || '',
      objectifs:  Array.isArray(a.objectif) ? a.objectif : a.objectif ? [a.objectif] : [],
      activite:   a.activite   || 'Modérément actif',
      regimes:    Array.isArray(a.alimentation) ? a.alimentation : [],
      alimentaireDetails: '',
      reveil:     a.reveil     || '07:00',
      coucher:    a.coucher    || '23:00',
      profession: a.profession || '',
      styles:     Array.isArray(a.style) ? a.style : [],
      styleDetails:'', mensurations:'',
      maladies:   hasHealth && Array.isArray(a.sante_conditions)
                    ? a.sante_conditions.filter(s => s !== 'Autre')
                    : [],
      carences: [],
      santeDetails:    hasHealth ? (a.sante_detail || '') : '',
      maladiesDetails: hasHealth ? (a.sante_detail || '') : '',
    }
    localStorage.setItem('vitacoach_profil', JSON.stringify(profil))
    setShowReveal(true)
    // onTermine appelé depuis RevealScreen
    window._solennProfil = profil
  }

  const isLast  = getNextStep(step, answers) === null
  const animStyle = {
    animation: `${direction === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.38s cubic-bezier(0.25,0.46,0.45,0.94) both`
  }

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
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideInRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInLeft  { from{opacity:0;transform:translateX(-60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes popIn        { 0%{transform:scale(0.88);opacity:0} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        @keyframes floatOrb     { 0%,100%{transform:translateY(0px) scale(1)} 33%{transform:translateY(-28px) scale(1.04)} 66%{transform:translateY(14px) scale(0.97)} }
        @keyframes liquidBlob1  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,5%) scale(1.06)} 66%{transform:translate(-2%,-3%) scale(0.96)} }
        @keyframes liquidBlob2  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-4%,3%) scale(1.08)} 70%{transform:translate(2%,-5%) scale(0.94)} }
        @keyframes liquidBlob3  { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(2%,-4%) scale(1.05)} 65%{transform:translate(-3%,2%) scale(0.97)} }
        @keyframes liquidBlob4  { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(-3%,4%) scale(1.07)} 75%{transform:translate(4%,-2%) scale(0.95)} }
        @keyframes dotPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(218,138,52,0.50);transform:scale(1.15)} 50%{box-shadow:0 0 0 7px rgba(218,138,52,0);transform:scale(1.2)} }
        @keyframes revealPulse  { 0%,100%{box-shadow:0 0 0 8px rgba(218,138,52,0.08),0 0 0 16px rgba(218,138,52,0.04)} 50%{box-shadow:0 0 0 12px rgba(218,138,52,0.13),0 0 0 22px rgba(218,138,52,0.06)} }
        @keyframes ringGlow     { 0%,100%{box-shadow:0 0 0 3px rgba(218,138,52,0.18),0 8px 32px rgba(218,138,52,0.10)} 50%{box-shadow:0 0 0 6px rgba(218,138,52,0.30),0 8px 32px rgba(218,138,52,0.18)} }
        @keyframes logoShimmer  { 0%,70%,100%{opacity:1} 80%{opacity:0.55} 85%{opacity:1} 90%{opacity:0.65} 95%{opacity:1} }
        .solenn-logo { display:inline-block; animation:logoShimmer 5s ease-in-out infinite; }
        input[type='number']::-webkit-outer-spin-button,
        input[type='number']::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input[type='number'] { -moz-appearance:textfield; }
        input[type='time']::-webkit-calendar-picker-indicator { opacity:0; }
        input:focus, textarea:focus { outline:none; }
        .clay-text-input::placeholder   { color:rgba(218,138,52,0.35) !important; }
        .clay-text-input:focus  { border-color:rgba(218,138,52,0.60) !important; box-shadow:0 0 0 4px rgba(218,138,52,0.10),0 6px 24px rgba(218,138,52,0.08) !important; }
        .clay-number-input::placeholder { color:rgba(218,138,52,0.35) !important; }
        .clay-time-input::placeholder   { color:rgba(218,138,52,0.35) !important; }
        .clay-time-input:focus  { border-color:rgba(218,138,52,0.60) !important; box-shadow:0 0 0 4px rgba(218,138,52,0.10) !important; }
        .num-input-wrap { animation:ringGlow 2.4s ease-in-out infinite; }
        .cta-btn:hover  { background:rgba(218,138,52,0.07) !important; border-color:rgba(218,138,52,0.55) !important; }
        .cta-btn:active { transform:scale(0.97) !important; }
        .back-btn:hover  { background:rgba(218,138,52,0.08) !important; border-color:rgba(218,138,52,0.40) !important; }
        .clay-card:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(218,138,52,0.10),inset 0 1px 0 rgba(255,255,255,0.9) !important; }
        .clay-chip:hover { transform:scale(1.04); box-shadow:0 4px 14px rgba(218,138,52,0.13) !important; }
        .num-btn:hover   { transform:scale(1.08); box-shadow:0 8px 24px rgba(218,138,52,0.40) !important; }
      `}</style>

      <BgBlobs />

      {/* Barre de progression */}
      <div style={s.progressWrap}>
        <div style={{...s.progressBar, width:`${progress}%`}} />
      </div>


      {/* Logo */}
      <div style={s.logoTop}>
        <span className="solenn-logo" style={s.logoText}>Solenn</span>
      </div>

      {/* Compteur minimaliste */}
      <div style={s.stepCounter}>
        <span style={s.stepCurrent}>{visibleIdx + 1}</span>
        <span style={s.stepSep}> / </span>
        <span style={s.stepTotal}>{visibleQs.length}</span>
      </div>

      {/* Écran question */}
      <div key={animKey} style={{...s.screen, ...animStyle}}>
        <div style={s.questionWrap}>
          <div style={s.question}>{questionText}</div>
          <div style={s.qSubtitle}>{q.subtitle}</div>
        </div>

        {/* Cards */}
        {q.type === 'cards' && (
          <div style={s.cardsGrid}>
            {q.options.map(opt => {
              const sel = isSelected(opt.label)
              return (
                <button key={opt.label} className="clay-card"
                  style={{...s.card, ...(sel ? s.cardSel : {})}}
                  onClick={() => handleCardClick(opt.label)}>
                  <div style={{...s.cardIconWrap, ...(sel ? s.cardIconWrapSel : {})}}>
                    <span style={{display:'flex',alignItems:'center',justifyContent:'center'}}>{opt.iconEl}</span>
                  </div>
                  <div style={s.cardLabel}>{opt.label}</div>
                  {opt.sub && <div style={s.cardSub}>{opt.sub}</div>}
                  {sel && <div style={s.cardCheck}>✓</div>}
                </button>
              )
            })}
          </div>
        )}

        {/* Chips */}
        {q.type === 'chips' && (
          <div style={s.chipsWrap}>
            {q.options.map(opt => {
              const sel = isSelected(opt)
              return (
                <button key={opt} className="clay-chip"
                  style={{...s.chip, ...(sel ? s.chipSel : {})}}
                  onClick={() => toggleChip(opt)}>
                  {sel && <span style={{marginRight:5, fontSize:11}}>✓</span>}
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* Nombre */}
        {q.type === 'number' && (
          <div style={s.inputWrap}>
            <div style={s.numberRow}>
              <button className="num-btn" style={s.numBtn}
                onClick={() => setInputVal(v => String(Math.max(q.min||1,(parseInt(v)||0)-1)))}>−</button>
              <div className="num-input-wrap" style={s.numberBox}>
                <input className="clay-number-input" style={s.numberInput} type="number" value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder={q.placeholder||'0'} min={q.min} max={q.max}/>
                {q.unit && <span style={s.unit}>{q.unit}</span>}
              </div>
              <button className="num-btn" style={s.numBtn}
                onClick={() => setInputVal(v => String(Math.min(q.max||999,(parseInt(v)||0)+1)))}>+</button>
            </div>
          </div>
        )}

        {/* Texte */}
        {q.type === 'text' && (
          <div style={s.inputWrap}>
            <input className="clay-text-input" style={s.textInput} type="text"
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key==='Enter' && canContinue() && goNext()}
              placeholder={q.placeholder||''} autoFocus/>
          </div>
        )}

        {/* Textarea */}
        {q.type === 'textarea' && (
          <div style={s.inputWrap}>
            <textarea className="clay-text-input"
              style={{...s.textInput, height:170, resize:'none', textAlign:'left',
                fontSize:14, fontWeight:500, lineHeight:1.65, paddingTop:20}}
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder={q.placeholder||''} autoFocus/>
          </div>
        )}

        {/* Heure */}
        {q.type === 'time' && (
          <div style={s.inputWrap}>
            <input className="clay-time-input"
              style={{...s.textInput, fontSize:38, fontWeight:800, textAlign:'center', letterSpacing:6, padding:'22px 24px'}}
              type="time" value={inputVal||q.default||'07:00'}
              onChange={e => setInputVal(e.target.value)}/>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={s.bottom}>
        {q.skip && (
          <button style={s.skipBtn} onClick={skipStep}>Passer cette étape</button>
        )}
        {(q.type !== 'cards' || q.multi) && (
          <button className="cta-btn"
            style={{...s.ctaBtn, opacity:canContinue()?1:0.28, cursor:canContinue()?'pointer':'default'}}
            onClick={goNext} disabled={!canContinue()}>
            {isLast
              ? <span>Voir mon profil <span style={{letterSpacing:'0.05em'}}>✦</span></span>
              : <span style={{display:'flex',alignItems:'center',gap:10}}>
                  Continuer
                  <span className={canContinue() ? 'arrow-anim' : ''} style={{display:'inline-block',fontSize:18}}>→</span>
                </span>
            }
          </button>
        )}
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight:'100vh', background:'transparent', fontFamily:'Poppins, sans-serif',
    display:'flex', flexDirection:'column', alignItems:'center', position:'relative', overflowX:'hidden' },

  progressWrap: { position:'fixed', top:0, left:0, right:0, height:2,
    background:'rgba(218,138,52,0.07)', zIndex:100 },
  progressBar: { height:'100%',
    background:'linear-gradient(90deg,rgba(218,138,52,0.45) 0%,rgba(218,168,52,0.60) 100%)',
    transition:'width 0.45s cubic-bezier(0.34,1.56,0.64,1)', borderRadius:2 },

  backBtn: { position:'fixed', top:22, left:20, zIndex:100,
    background:'rgba(255,255,255,0.75)', border:'1.5px solid rgba(218,138,52,0.18)',
    color:'rgba(218,138,52,0.65)', width:42, height:42, borderRadius:14, cursor:'pointer',
    fontSize:18, fontFamily:'Poppins, sans-serif', display:'flex', alignItems:'center',
    justifyContent:'center', boxShadow:'0 4px 16px rgba(218,138,52,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    transition:'all 0.2s', outline:'none' },

  logoTop: { position:'fixed', top:22, left:'50%', transform:'translateX(-50%)', zIndex:100 },
  logoText: { fontSize:19, fontWeight:900, letterSpacing:'-0.04em',
    color:'rgba(218,138,52,0.72)' },

  stepCounter: { position:'fixed', top:26, right:22, zIndex:100,
    display:'flex', alignItems:'baseline', gap:1 },
  stepCurrent: { fontSize:13, fontWeight:600, color:'rgba(218,138,52,0.48)',
    fontFamily:'Poppins, sans-serif', letterSpacing:'-0.2px' },
  stepSep: { fontSize:11, fontWeight:400, color:'rgba(218,138,52,0.25)',
    fontFamily:'Poppins, sans-serif', margin:'0 1px' },
  stepTotal: { fontSize:11, fontWeight:400, color:'rgba(218,138,52,0.25)',
    fontFamily:'Poppins, sans-serif' },

  screen: { flex:1, display:'flex', flexDirection:'column', padding:'96px 24px 24px',
    maxWidth:600, width:'100%', position:'relative', zIndex:1 },

  questionWrap: { marginBottom:28 },
  question: { fontSize:'clamp(22px,5vw,32px)', fontWeight:800, lineHeight:1.22,
    letterSpacing:'-0.5px', marginBottom:10, color:'rgba(218,138,52,0.82)' },
  qSubtitle: { fontSize:14, color:'rgba(218,138,52,0.45)', lineHeight:1.55, fontWeight:500 },

  cardsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:11, flex:1, alignItems:'start', alignContent:'start' },
  card: { background:'transparent', border:'1px solid rgba(255,255,255,0.35)', borderRadius:22,
    padding:'18px 14px', cursor:'pointer', textAlign:'left', position:'relative',
    transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)', fontFamily:'Poppins, sans-serif',
    display:'flex', flexDirection:'column', gap:8, outline:'none',
    boxShadow:'none' },
  cardSel: { background:'rgba(255,255,255,0.22)',
    border:'1.5px solid rgba(218,138,52,0.55)',
    boxShadow:'0 4px 18px rgba(218,138,52,0.15)',
    transform:'scale(1.03)', animation:'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' },
  cardIconWrap: { width:44, height:44, borderRadius:14, display:'flex', alignItems:'center',
    justifyContent:'center', background:'rgba(218,138,52,0.08)', transition:'all 0.2s' },
  cardIconWrapSel: { background:'linear-gradient(135deg,rgba(218,138,52,0.18),rgba(218,168,52,0.12))', borderRadius:14 },
  cardLabel: { fontSize:13, fontWeight:700, color:'rgba(218,138,52,0.90)', lineHeight:1.3 },
  cardSub:   { fontSize:11, color:'rgba(218,138,52,0.52)', lineHeight:1.3, fontWeight:500 },
  cardCheck: { position:'absolute', top:10, right:10, width:22, height:22, borderRadius:'50%',
    background:'linear-gradient(135deg,rgba(218,138,52,0.80),rgba(190,112,30,0.90))',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:11, fontWeight:800, color:'rgba(255,245,225,0.95)',
    boxShadow:'0 3px 10px rgba(218,138,52,0.35)', animation:'popIn 0.2s ease' },

  chipsWrap: { display:'flex', flexWrap:'wrap', gap:10, flex:1, alignContent:'flex-start' },
  chip: { padding:'12px 20px', borderRadius:40, border:'1px solid rgba(255,255,255,0.35)',
    background:'transparent', cursor:'pointer', fontSize:13,
    fontFamily:'Poppins, sans-serif', color:'rgba(218,138,52,0.78)',
    transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', fontWeight:600, outline:'none',
    boxShadow:'none' },
  chipSel: { border:'1.5px solid rgba(218,138,52,0.60)',
    background:'rgba(255,255,255,0.22)',
    color:'rgba(218,138,52,0.95)', fontWeight:700,
    boxShadow:'0 2px 10px rgba(218,138,52,0.15)',
    animation:'popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' },

  inputWrap: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:16 },
  textInput: { width:'100%', maxWidth:440, padding:'20px 24px', borderRadius:20,
    border:'1.5px solid rgba(255,255,255,0.40)', background:'transparent',
    fontSize:22, fontFamily:'Poppins, sans-serif', color:'rgba(218,138,52,0.88)',
    outline:'none', textAlign:'center', fontWeight:700,
    boxShadow:'none',
    transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box' },

  numberRow: { display:'flex', alignItems:'center', gap:20 },
  numBtn: { width:62, height:62, borderRadius:'50%', border:'none',
    background:'linear-gradient(145deg,rgba(218,138,52,0.80),rgba(190,112,30,0.88))',
    color:'rgba(255,245,225,0.95)', fontSize:28, fontWeight:700, cursor:'pointer',
    fontFamily:'Poppins, sans-serif', display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 8px 24px rgba(218,138,52,0.35), inset 0 1px 0 rgba(255,255,255,0.20)',
    transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', outline:'none', lineHeight:1 },
  numberBox: { display:'flex', alignItems:'center', gap:8, borderRadius:20,
    padding:'12px 20px', background:'transparent', border:'1.5px solid rgba(255,255,255,0.40)' },
  numberInput: { width:120, border:'none', background:'transparent', fontSize:52,
    fontFamily:'Poppins, sans-serif', color:'rgba(218,138,52,0.88)',
    outline:'none', textAlign:'center', fontWeight:900, padding:0 },
  unit: { fontSize:18, color:'rgba(218,138,52,0.50)', fontWeight:600 },

  bottom: { padding:'16px 24px 44px', maxWidth:600, width:'100%',
    display:'flex', flexDirection:'column', gap:12, position:'relative', zIndex:1 },
  ctaBtn: { padding:'0 32px', height:52, width:'100%',
    background:'transparent',
    color:'rgba(218,138,52,0.78)', border:'1.5px solid rgba(218,138,52,0.32)', borderRadius:30,
    fontSize:15, fontWeight:600,
    cursor:'pointer', fontFamily:'Poppins, sans-serif',
    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    boxShadow:'none',
    transition:'all 0.2s', letterSpacing:'0.2px', outline:'none' },
  skipBtn: { background:'transparent', border:'none', color:'rgba(218,138,52,0.45)',
    fontSize:13, cursor:'pointer', fontFamily:'Poppins, sans-serif',
    textDecoration:'underline', padding:'4px', textAlign:'center', fontWeight:500 },
}
