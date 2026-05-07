import React, { useState, useEffect } from 'react'

// ─── BG BLOBS ─────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-18%',left:'-12%',width:680,height:680,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(255,107,53,0.17) 0%,transparent 70%)',
        animation:'floatOrb 10s ease-in-out infinite'}}/>
      <div style={{position:'absolute',bottom:'-12%',right:'-10%',width:780,height:780,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(255,69,0,0.15) 0%,transparent 70%)',
        animation:'floatOrb 14s ease-in-out infinite reverse'}}/>
      <div style={{position:'absolute',top:'38%',right:'18%',width:420,height:420,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,230,118,0.13) 0%,transparent 70%)',
        animation:'floatOrb 8s ease-in-out infinite'}}/>
      <div style={{position:'absolute',top:'60%',left:'5%',width:320,height:320,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(255,154,60,0.15) 0%,transparent 70%)',
        animation:'floatOrb 12s ease-in-out infinite reverse'}}/>
    </div>
  )
}

// ─── QUESTIONS (avec branches conditionnelles) ────────────────────────────────
const QUESTIONS = [
  {
    id:'objectif', type:'cards',
    question:'Quel est ton principal objectif ?',
    subtitle:'On va personnaliser toute ton expérience autour de ça',
    options:[
      {icon:'⚡',label:"Plus d'énergie"},
      {icon:'😴',label:'Mieux dormir'},
      {icon:'🥗',label:'Manger sainement'},
      {icon:'💪',label:'Prendre du muscle'},
      {icon:'🧘',label:'Réduire le stress'},
      {icon:'⚖️',label:'Perdre du poids'},
      {icon:'🏃',label:'Courir un marathon'},
      {icon:'🧠',label:'Productivité maximale'},
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
    subtitle:'Sois honnête, on ne juge pas 😄',
    options:[
      {icon:'🛋️',label:'Sédentaire',       sub:'Bureau, peu de sport'},
      {icon:'🚶',label:'Légèrement actif', sub:'Marche quotidienne'},
      {icon:'🏋️',label:'Modérément actif', sub:'Sport 2-3x/semaine'},
      {icon:'🔥',label:'Très actif',       sub:'Sport 4-5x/semaine'},
      {icon:'🏆',label:'Sportif intensif', sub:'Entraînement quotidien'},
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

  // ── BRANCHE SANTÉ ──────────────────────────────────────────────────────────
  {
    id:'sante_yn', type:'cards',
    question:'As-tu des problèmes de santé ou des maladies ?',
    subtitle:'Pour que nos conseils soient totalement adaptés et sans risque pour toi',
    options:[
      {icon:'🏥', label:'Oui', sub:"J'ai des conditions médicales"},
      {icon:'🎉', label:'Non', sub:'Je suis en bonne santé'},
    ],
    multi: false
  },
  // Affiché seulement si sante_yn === 'Oui'
  {
    id:'sante_conditions', type:'chips',
    question:'Quelles conditions as-tu ?',
    subtitle:'Sélectionne tout ce qui te correspond — plusieurs choix possibles',
    condition: (a) => a.sante_yn === 'Oui',
    options:[
      'Diabète type 1','Diabète type 2','Hypertension','Hypotension',
      'Hypothyroïdie','Hyperthyroïdie','Asthme','Cholestérol élevé',
      "Dépression / Anxiété",'Endométriose','SOPK','Maladie cœliaque',
      'Arthrite / Arthrose','Carence en fer','Carence en Vit. D',
      'Maladie de Crohn','Psoriasis','Autre'
    ],
    multi: true,
    skip: true
  },
  // Affiché seulement si sante_yn === 'Oui'
  {
    id:'sante_detail', type:'textarea',
    question:'Décris ta situation de santé en détail',
    subtitle:'Plus tu es précis, meilleurs seront nos conseils — nom exact, médicaments, depuis quand...',
    placeholder:'Ex: Diabète type 2 depuis 3 ans, sous Metformine 1g/jour. Hypothyroïdie traitée par Lévothyrox 50µg depuis 2021. Carence en Vit. D confirmée par prise de sang il y a 6 mois...',
    condition: (a) => a.sante_yn === 'Oui',
    skip: true
  },
  // ──────────────────────────────────────────────────────────────────────────

  {
    id:'reveil', type:'time',
    question:'À quelle heure tu te lèves ?',
    subtitle:'Pour une routine calée sur ton rythme naturel',
    default: '07:00'
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
  {
    id:'nom', type:'text',
    question:"Comment on t'appelle ?",
    subtitle:"Le prénom qu'Oravia utilisera pour toi",
    placeholder:'Ton prénom',
  },
]

// ─── NAVIGATION UTILITIES ────────────────────────────────────────────────────
function getVisibleQs(answers) {
  return QUESTIONS.filter(q => !q.condition || q.condition(answers))
}
function getNextStep(currentStep, answers) {
  let next = currentStep + 1
  while (next < QUESTIONS.length) {
    if (!QUESTIONS[next].condition || QUESTIONS[next].condition(answers)) return next
    next++
  }
  return null // fin du quiz
}
function getPrevStep(currentStep, answers) {
  let prev = currentStep - 1
  while (prev >= 0) {
    if (!QUESTIONS[prev].condition || QUESTIONS[prev].condition(answers)) return prev
    prev--
  }
  return null
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [step, setStep]           = useState(0)
  const [answers, setAnswers]     = useState({})
  const [direction, setDirection] = useState('forward')
  const [animKey, setAnimKey]     = useState(0)
  const [inputVal, setInputVal]   = useState('')

  const q = QUESTIONS[step]

  // Progress calculé sur les questions visibles
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
      newAnswers = { ...answers, [q.id]: inputVal || q.default || '07:00' }
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

  // Clic sur une carte : multi = toggle, single = sélection + auto-avance
  function handleCardClick(val) {
    if (q.multi) {
      setAnswers(a => {
        const cur = Array.isArray(a[q.id]) ? a[q.id] : []
        return { ...a, [q.id]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] }
      })
    } else {
      const newAnswers = { ...answers, [q.id]: val }
      setAnswers(newAnswers)
      // Auto-avance après 220 ms (laisse le temps de voir la sélection)
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
      taille: '', poids: '',
      objectifs:  Array.isArray(a.objectif) ? a.objectif : a.objectif ? [a.objectif] : [],
      activite:   a.activite   || 'Modérément actif',
      regimes:    Array.isArray(a.alimentation) ? a.alimentation : [],
      alimentaireDetails: '',
      reveil:     a.reveil     || '07:00',
      coucher:    '23:00',
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
    onTermine(profil)
  }

  const isLast  = getNextStep(step, answers) === null
  const animStyle = {
    animation: `${direction === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.38s cubic-bezier(0.25,0.46,0.45,0.94) both`
  }

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

        @keyframes slideInRight {
          from { opacity:0; transform:translateX(60px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity:0; transform:translateX(-60px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes popIn {
          0%   { transform:scale(0.88); opacity:0; }
          60%  { transform:scale(1.06); }
          100% { transform:scale(1);    opacity:1; }
        }
        @keyframes floatOrb {
          0%,100% { transform: translateY(0px) scale(1); }
          33%     { transform: translateY(-28px) scale(1.04); }
          66%     { transform: translateY(14px) scale(0.97); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.55); transform: scale(1.15); }
          50%     { box-shadow: 0 0 0 8px rgba(255,107,53,0); transform: scale(1.2); }
        }
        @keyframes ringGlow {
          0%,100% { box-shadow: 0 0 0 3px rgba(255,107,53,0.2), 0 8px 32px rgba(255,107,53,0.12); }
          50%     { box-shadow: 0 0 0 6px rgba(255,107,53,0.35), 0 8px 32px rgba(255,107,53,0.2); }
        }
        input[type='number']::-webkit-outer-spin-button,
        input[type='number']::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type='number'] { -moz-appearance: textfield; }
        input[type='time']::-webkit-calendar-picker-indicator { opacity: 0; }
        input:focus, textarea:focus { outline: none; }
        .clay-text-input:focus {
          border-color: #FF6B35 !important;
          box-shadow: 0 0 0 4px rgba(255,107,53,0.15), 0 8px 32px rgba(255,107,53,0.12) !important;
        }
        .clay-time-input:focus {
          border-color: #FF6B35 !important;
          box-shadow: 0 0 0 4px rgba(255,107,53,0.15) !important;
        }
        .num-input-wrap { animation: ringGlow 2.4s ease-in-out infinite; }
        .cta-btn:active { transform: scale(0.97) !important; }
        .back-btn:hover { background: #fff1ec !important; border-color: #FF6B35 !important; color: #FF6B35 !important; }
        .clay-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9) !important; }
        .clay-chip:hover { transform: scale(1.04); box-shadow: 0 4px 14px rgba(0,0,0,0.1) !important; }
        .num-btn:hover { transform: scale(1.08); box-shadow: 0 8px 24px rgba(255,107,53,0.45) !important; }
      `}</style>

      <BgBlobs />

      {/* ── Barre de progression ── */}
      <div style={s.progressWrap}>
        <div style={{...s.progressBar, width:`${progress}%`}} />
      </div>

      {/* ── Bouton retour ── */}
      {step > 0 && (
        <button className="back-btn" style={s.backBtn} onClick={goBack}>←</button>
      )}

      {/* ── Logo ── */}
      <div style={s.logoTop}>
        <span style={s.logoIcon}>✦</span>
        <span style={s.logoText}>Oravia</span>
      </div>

      {/* ── Dots de progression ── */}
      <div style={s.dotsRow}>
        {visibleQs.map((vq, i) => (
          <div key={vq.id} style={{
            width:  i === visibleIdx ? 12 : 7,
            height: i === visibleIdx ? 12 : 7,
            borderRadius: '50%',
            background: i < visibleIdx
              ? 'linear-gradient(135deg,#FF6B35,#E55A00)'
              : i === visibleIdx
                ? 'linear-gradient(135deg,#FF6B35,#FF9A3C)'
                : '#e5d5cc',
            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            animation: i === visibleIdx ? 'pulse 1.8s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }} />
        ))}
        <div style={s.stepPill}>{visibleIdx + 1} / {visibleQs.length}</div>
      </div>

      {/* ── Écran question ── */}
      <div key={animKey} style={{...s.screen, ...animStyle}}>

        <div style={s.questionWrap}>
          <div style={s.question}>{q.question}</div>
          <div style={s.qSubtitle}>{q.subtitle}</div>
        </div>

        {/* ── Cards ── */}
        {q.type === 'cards' && (
          <div style={s.cardsGrid}>
            {q.options.map(opt => {
              const sel = isSelected(opt.label)
              return (
                <button key={opt.label} className="clay-card"
                  style={{...s.card, ...(sel ? s.cardSel : {})}}
                  onClick={() => handleCardClick(opt.label)}>
                  <div style={{...s.cardIconWrap, ...(sel ? s.cardIconWrapSel : {})}}>
                    <span style={{...s.cardIcon, fontSize: sel ? 34 : 28}}>{opt.icon}</span>
                  </div>
                  <div style={s.cardLabel}>{opt.label}</div>
                  {opt.sub && <div style={s.cardSub}>{opt.sub}</div>}
                  {sel && <div style={s.cardCheck}>✓</div>}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Chips ── */}
        {q.type === 'chips' && (
          <div style={s.chipsWrap}>
            {q.options.map(opt => {
              const sel = isSelected(opt)
              return (
                <button key={opt} className="clay-chip"
                  style={{...s.chip, ...(sel ? s.chipSel : {})}}
                  onClick={() => toggleChip(opt)}>
                  {sel && <span style={{marginRight:6, fontSize:11}}>✓</span>}
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Nombre ── */}
        {q.type === 'number' && (
          <div style={s.inputWrap}>
            <div style={s.numberRow}>
              <button className="num-btn" style={s.numBtn}
                onClick={() => setInputVal(v => String(Math.max(q.min||1, (parseInt(v)||0)-1)))}>−</button>
              <div className="num-input-wrap" style={s.numberBox}>
                <input style={s.numberInput} type="number" value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder={q.placeholder || '0'} min={q.min} max={q.max} />
                {q.unit && <span style={s.unit}>{q.unit}</span>}
              </div>
              <button className="num-btn" style={s.numBtn}
                onClick={() => setInputVal(v => String(Math.min(q.max||999, (parseInt(v)||0)+1)))}>+</button>
            </div>
          </div>
        )}

        {/* ── Texte court ── */}
        {q.type === 'text' && (
          <div style={s.inputWrap}>
            <input className="clay-text-input" style={s.textInput} type="text"
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()}
              placeholder={q.placeholder || ''} autoFocus />
          </div>
        )}

        {/* ── Textarea (santé détail) ── */}
        {q.type === 'textarea' && (
          <div style={s.inputWrap}>
            <textarea className="clay-text-input"
              style={{
                ...s.textInput,
                height:170, resize:'none',
                textAlign:'left', fontSize:14, fontWeight:500,
                lineHeight:1.65, paddingTop:20, paddingBottom:16,
              }}
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder={q.placeholder || ''} autoFocus />
          </div>
        )}

        {/* ── Heure ── */}
        {q.type === 'time' && (
          <div style={s.inputWrap}>
            <input className="clay-time-input"
              style={{...s.textInput, fontSize:38, fontWeight:800, textAlign:'center', letterSpacing:6, padding:'22px 24px'}}
              type="time" value={inputVal || q.default || '07:00'}
              onChange={e => setInputVal(e.target.value)} />
          </div>
        )}

      </div>

      {/* ── Bottom CTA ── */}
      <div style={s.bottom}>
        {q.skip && (
          <button style={s.skipBtn} onClick={skipStep}>Passer cette étape</button>
        )}
        {/* Pas de bouton Continuer pour les cartes à choix unique (auto-avance) */}
        {(q.type !== 'cards' || q.multi) && (
          <button className="cta-btn"
            style={{...s.ctaBtn, opacity: canContinue() ? 1 : 0.42, cursor: canContinue() ? 'pointer' : 'default'}}
            onClick={goNext} disabled={!canContinue()}>
            {isLast ? '✦ Lancer Oravia' : 'Continuer →'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight:'100vh', background:'#FFF8F4', fontFamily:'Poppins, sans-serif', color:'#1a0a00',
    display:'flex', flexDirection:'column', position:'relative', overflowX:'hidden' },

  progressWrap: { position:'fixed', top:0, left:0, right:0, height:6,
    background:'rgba(229,213,204,0.6)', zIndex:100 },
  progressBar: { height:'100%',
    background:'linear-gradient(90deg,#FF6B35 0%,#FF9A3C 60%,#FFB347 100%)',
    transition:'width 0.45s cubic-bezier(0.34,1.56,0.64,1)', borderRadius:3 },

  backBtn: { position:'fixed', top:22, left:20, zIndex:100,
    background:'#ffffff', border:'1.5px solid #f0e8e0', color:'#a07060',
    width:42, height:42, borderRadius:14, cursor:'pointer', fontSize:18,
    fontFamily:'Poppins, sans-serif', display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
    transition:'all 0.2s', outline:'none' },

  logoTop: { position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:100,
    display:'flex', alignItems:'center', gap:5 },
  logoIcon: { fontSize:18, background:'linear-gradient(135deg,#FF6B35,#E55A00)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  logoText: { fontSize:19, fontWeight:900, letterSpacing:'-0.5px',
    background:'linear-gradient(135deg,#FF6B35,#E55A00)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },

  dotsRow: { position:'fixed', top:72, left:'50%', transform:'translateX(-50%)', zIndex:100,
    display:'flex', alignItems:'center', gap:6, flexWrap:'nowrap', maxWidth:'90vw', overflow:'hidden' },
  stepPill: { marginLeft:10, padding:'3px 12px', borderRadius:20,
    background:'linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,154,60,0.08))',
    border:'1.5px solid rgba(255,107,53,0.3)', fontSize:11, fontWeight:800,
    color:'#FF6B35', letterSpacing:'0.3px', flexShrink:0 },

  screen: { flex:1, display:'flex', flexDirection:'column', padding:'118px 24px 24px',
    maxWidth:600, width:'100%', margin:'0 auto', position:'relative', zIndex:1 },

  questionWrap: { marginBottom:28 },
  question: { fontSize:'clamp(22px,5vw,34px)', fontWeight:800, lineHeight:1.22,
    letterSpacing:'-0.5px', marginBottom:10, color:'#1a0a00' },
  qSubtitle: { fontSize:14, color:'#b59080', lineHeight:1.55, fontWeight:500 },

  cardsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',
    gap:12, flex:1 },
  card: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:22,
    padding:'18px 14px', cursor:'pointer', textAlign:'left', position:'relative',
    transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
    fontFamily:'Poppins, sans-serif', display:'flex', flexDirection:'column', gap:8,
    color:'#1a0a00', outline:'none',
    boxShadow:'0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' },
  cardSel: {
    background:'linear-gradient(145deg,rgba(255,107,53,0.12),rgba(255,154,60,0.08))',
    border:'1.5px solid #FF6B35',
    boxShadow:'0 8px 28px rgba(255,107,53,0.28), inset 0 1px 0 rgba(255,255,255,0.8)',
    transform:'scale(1.03)',
    animation:'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' },
  cardIconWrap: { width:44, height:44, borderRadius:14, display:'flex', alignItems:'center',
    justifyContent:'center', background:'rgba(0,0,0,0.03)', transition:'all 0.2s' },
  cardIconWrapSel: { background:'linear-gradient(135deg,rgba(255,107,53,0.18),rgba(255,154,60,0.12))', borderRadius:14 },
  cardIcon: { lineHeight:1, transition:'font-size 0.2s' },
  cardLabel: { fontSize:13, fontWeight:700, color:'#1a0a00', lineHeight:1.3 },
  cardSub: { fontSize:11, color:'#b59080', lineHeight:1.3, fontWeight:500 },
  cardCheck: { position:'absolute', top:10, right:10, width:22, height:22,
    borderRadius:'50%', background:'linear-gradient(135deg,#FF6B35,#E55A00)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:11, fontWeight:800, color:'white',
    boxShadow:'0 3px 10px rgba(255,107,53,0.45)', animation:'popIn 0.2s ease' },

  chipsWrap: { display:'flex', flexWrap:'wrap', gap:10, flex:1, alignContent:'flex-start' },
  chip: { padding:'12px 20px', borderRadius:40, border:'1px solid #f0e8e0',
    background:'#ffffff', cursor:'pointer', fontSize:13,
    fontFamily:'Poppins, sans-serif', color:'#7a5c50',
    transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', fontWeight:600, outline:'none',
    boxShadow:'0 3px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)' },
  chipSel: { border:'1.5px solid #FF6B35',
    background:'linear-gradient(135deg,rgba(255,107,53,0.1),rgba(255,154,60,0.07))',
    color:'#E55A00', fontWeight:700,
    boxShadow:'0 6px 18px rgba(255,107,53,0.28), inset 0 1px 0 rgba(255,255,255,0.6)',
    animation:'popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' },

  inputWrap: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
    alignItems:'center', gap:16 },
  textInput: { width:'100%', maxWidth:440, padding:'20px 24px', borderRadius:20,
    border:'1.5px solid #f0e8e0', background:'#ffffff', fontSize:22,
    fontFamily:'Poppins, sans-serif', color:'#1a0a00', outline:'none',
    textAlign:'center', fontWeight:700,
    boxShadow:'0 6px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
    transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box' },

  numberRow: { display:'flex', alignItems:'center', gap:20 },
  numBtn: { width:62, height:62, borderRadius:'50%', border:'none',
    background:'linear-gradient(145deg,#FF6B35,#E55A00)',
    color:'white', fontSize:28, fontWeight:700, cursor:'pointer',
    fontFamily:'Poppins, sans-serif', display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 8px 24px rgba(255,107,53,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
    transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', outline:'none', lineHeight:1 },
  numberBox: { display:'flex', alignItems:'center', gap:8, borderRadius:20,
    padding:'12px 20px', background:'#ffffff', border:'1.5px solid #f0e8e0' },
  numberInput: { width:120, border:'none', background:'transparent',
    fontSize:52, fontFamily:'Poppins, sans-serif', color:'#1a0a00',
    outline:'none', textAlign:'center', fontWeight:900, padding:0 },
  unit: { fontSize:18, color:'#b59080', fontWeight:600 },

  bottom: { padding:'16px 24px 44px', maxWidth:600, width:'100%', margin:'0 auto',
    display:'flex', flexDirection:'column', gap:12, position:'relative', zIndex:1 },
  ctaBtn: { padding:'0 24px', height:58,
    background:'linear-gradient(145deg,#FF6B35,#E55A00)',
    color:'white', border:'none', borderRadius:22, fontSize:17, fontWeight:800,
    cursor:'pointer', fontFamily:'Poppins, sans-serif',
    boxShadow:'0 12px 36px rgba(255,107,53,0.45), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
    transition:'opacity 0.2s, transform 0.15s', letterSpacing:'0.3px', outline:'none' },
  skipBtn: { background:'transparent', border:'none', color:'#c9a090',
    fontSize:13, cursor:'pointer', fontFamily:'Poppins, sans-serif',
    textDecoration:'underline', padding:'4px', textAlign:'center', fontWeight:500 },
}
