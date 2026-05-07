import React, { useState, useEffect } from 'react'

// ─── BG BLOBS ────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-15%',left:'-10%',width:500,height:500,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(255,107,53,0.1) 0%,transparent 70%)',
        animation:'floatOrb 10s ease-in-out infinite'}}/>
      <div style={{position:'absolute',bottom:'-10%',right:'-8%',width:600,height:600,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(255,69,0,0.09) 0%,transparent 70%)',
        animation:'floatOrb 14s ease-in-out infinite reverse'}}/>
      <div style={{position:'absolute',top:'40%',right:'20%',width:300,height:300,borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,230,118,0.07) 0%,transparent 70%)',
        animation:'floatOrb 8s ease-in-out infinite'}}/>
    </div>
  )
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const questions = [
  {
    id:'objectif', type:'cards',
    question:'Quel est ton principal objectif ?',
    subtitle:'On va personnaliser ton expérience',
    options:[
      {icon:'⚡',label:'Plus d\'énergie'},
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
    question:'Quel est ton niveau d\'activité physique ?',
    subtitle:'Sois honnête, on ne juge pas 😄',
    options:[
      {icon:'🛋️',label:'Sédentaire',sub:'Bureau, peu de sport'},
      {icon:'🚶',label:'Légèrement actif',sub:'Marche quotidienne'},
      {icon:'🏋️',label:'Modérément actif',sub:'Sport 2-3x/semaine'},
      {icon:'🔥',label:'Très actif',sub:'Sport 4-5x/semaine'},
      {icon:'🏆',label:'Sportif intensif',sub:'Entraînement quotidien'},
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
    id:'sante', type:'chips',
    question:'As-tu des conditions de santé ?',
    subtitle:'Pour que nos conseils soient adaptés et sûrs',
    skip: true,
    options:['Diabète','Hypertension','Hypothyroïdie','Asthme','Cholestérol élevé',
             'Dépression / Anxiété','Endométriose','Maladie cœliaque','Arthrite',
             'Carence en Vitamine D','Carence en fer','Aucune'],
    multi: true
  },
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
    question:'Comment on t\'appelle ?',
    subtitle:'Le prénom qu\'Oravia utilisera pour toi',
    placeholder:'Ton prénom',
  },
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [step, setStep]           = useState(0)
  const [answers, setAnswers]     = useState({})
  const [direction, setDirection] = useState('forward') // forward | back
  const [animKey, setAnimKey]     = useState(0)
  const [inputVal, setInputVal]   = useState('')

  const q = questions[step]
  const progress = (step / questions.length) * 100

  // Reset input when question changes
  useEffect(() => {
    const existing = answers[q.id]
    if (q.type === 'text' || q.type === 'number') {
      setInputVal(existing || (q.type === 'time' ? q.default||'07:00' : ''))
    }
  }, [step])

  function goNext() {
    // Save text/number answer
    if (q.type === 'text' || q.type === 'number') {
      if (!inputVal.trim() && !q.skip) return
      setAnswers(a => ({ ...a, [q.id]: inputVal }))
    }
    if (q.type === 'time') {
      setAnswers(a => ({ ...a, [q.id]: inputVal || q.default || '07:00' }))
    }

    if (step < questions.length - 1) {
      setDirection('forward')
      setAnimKey(k => k+1)
      setStep(s => s+1)
      setInputVal('')
    } else {
      finish()
    }
  }

  function goBack() {
    if (step === 0) return
    setDirection('back')
    setAnimKey(k => k+1)
    setStep(s => s-1)
    setInputVal('')
  }

  function toggleCard(val) {
    setAnswers(a => {
      const cur = a[q.id] || (q.multi ? [] : null)
      if (q.multi) {
        const arr = Array.isArray(cur) ? cur : []
        return { ...a, [q.id]: arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val] }
      } else {
        return { ...a, [q.id]: val }
      }
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
    if (q.type === 'time') return true
    return true
  }

  function finish() {
    const taille = answers.taille || ''
    const poids  = answers.poids  || ''
    const profil = {
      nom:       answers.nom       || 'Ami',
      age:       answers.age       || '',
      taille, poids,
      objectifs: Array.isArray(answers.objectif) ? answers.objectif : answers.objectif ? [answers.objectif] : [],
      activite:  answers.activite  || 'Modérément actif',
      regimes:   Array.isArray(answers.alimentation) ? answers.alimentation : [],
      alimentaireDetails: '',
      reveil:    answers.reveil    || '07:00',
      coucher:   '23:00',
      profession:answers.profession|| '',
      styles:    Array.isArray(answers.style) ? answers.style : [],
      styleDetails:'', mensurations:'',
      maladies:  Array.isArray(answers.sante) ? answers.sante.filter(s=>s!=='Aucune') : [],
      carences:  [],
      santeDetails:'', maladiesDetails:'',
    }
    localStorage.setItem('vitacoach_profil', JSON.stringify(profil))
    onTermine(profil)
  }

  const animStyle = {
    animation: `${direction==='forward' ? 'slideInRight' : 'slideInLeft'} 0.38s cubic-bezier(0.25,0.46,0.45,0.94) both`
  }

  return (
    <div style={s.page}>
      <style>{`
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
          60%  { transform:scale(1.04); }
          100% { transform:scale(1);    opacity:1; }
        }
      `}</style>

      <BgBlobs />

      {/* Progress bar */}
      <div style={s.progressWrap}>
        <div style={{...s.progressBar, width:`${progress}%`}} />
      </div>

      {/* Back button */}
      {step > 0 && (
        <button style={s.backBtn} onClick={goBack}>←</button>
      )}

      {/* Logo top */}
      <div style={s.logoTop}>✦ Oravia</div>

      {/* Screen */}
      <div key={animKey} style={{...s.screen, ...animStyle}}>

        {/* Question text */}
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
                <button key={opt.label} style={{...s.card, ...(sel ? s.cardSel : {})}}
                  onClick={() => toggleCard(opt.label)}>
                  <div style={s.cardIcon}>{opt.icon}</div>
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
                <button key={opt} style={{...s.chip, ...(sel ? s.chipSel : {})}}
                  onClick={() => toggleCard(opt)}>
                  {sel && <span style={{marginRight:5}}>✓</span>}
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Number input ── */}
        {q.type === 'number' && (
          <div style={s.inputWrap}>
            <div style={s.numberRow}>
              <button style={s.numBtn} onClick={() => setInputVal(v => String(Math.max(q.min||1, (parseInt(v)||0)-1)))}>−</button>
              <div style={s.numberBox}>
                <input style={s.numberInput} type="number" value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder={q.placeholder || '0'}
                  min={q.min} max={q.max} />
                {q.unit && <span style={s.unit}>{q.unit}</span>}
              </div>
              <button style={s.numBtn} onClick={() => setInputVal(v => String(Math.min(q.max||999, (parseInt(v)||0)+1)))}>+</button>
            </div>
          </div>
        )}

        {/* ── Text input ── */}
        {q.type === 'text' && (
          <div style={s.inputWrap}>
            <input style={s.textInput} type="text"
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key==='Enter' && canContinue() && goNext()}
              placeholder={q.placeholder || ''} autoFocus />
          </div>
        )}

        {/* ── Time picker ── */}
        {q.type === 'time' && (
          <div style={s.inputWrap}>
            <input style={{...s.textInput, fontSize:32, fontWeight:800, textAlign:'center', letterSpacing:4}}
              type="time" value={inputVal || q.default || '07:00'}
              onChange={e => setInputVal(e.target.value)} />
          </div>
        )}

      </div>

      {/* Bottom CTA */}
      <div style={s.bottom}>
        {q.skip && (
          <button style={s.skipBtn} onClick={() => {
            setDirection('forward'); setAnimKey(k=>k+1)
            setStep(s => s < questions.length-1 ? s+1 : s)
            if (step >= questions.length-1) finish()
          }}>Passer cette étape</button>
        )}
        <button style={{...s.ctaBtn, opacity: canContinue() ? 1 : 0.45, cursor: canContinue() ? 'pointer' : 'default'}}
          onClick={goNext} disabled={!canContinue()}>
          {step === questions.length-1 ? '✦ Lancer Oravia' : 'Continuer →'}
        </button>
        <div style={s.stepCount}>{step+1} / {questions.length}</div>
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight:'100vh', background:'#FFF8F4', fontFamily:'Poppins, sans-serif', color:'#1a0a00',
    display:'flex', flexDirection:'column', position:'relative', overflowX:'hidden' },

  progressWrap: { position:'fixed', top:0, left:0, right:0, height:4,
    background:'#e5e7eb', zIndex:100 },
  progressBar: { height:'100%', background:'linear-gradient(90deg,#FF6B35,#FF4500)',
    transition:'width 0.4s cubic-bezier(0.34,1.56,0.64,1)', borderRadius:2 },

  backBtn: { position:'fixed', top:20, left:20, zIndex:100, background:'#ffffff',
    border:'1px solid #e5e7eb', color:'#6b7280', width:38, height:38,
    borderRadius:12, cursor:'pointer', fontSize:16, fontFamily:'Poppins, sans-serif',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },

  logoTop: { position:'fixed', top:18, left:'50%', transform:'translateX(-50%)', zIndex:100,
    fontSize:16, fontWeight:900, background:'linear-gradient(135deg,#FF6B35,#FF4500)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
    letterSpacing:'-0.3px' },

  screen: { flex:1, display:'flex', flexDirection:'column', padding:'90px 24px 24px',
    maxWidth:600, width:'100%', margin:'0 auto', position:'relative', zIndex:1 },

  questionWrap: { marginBottom:32 },
  question: { fontSize:'clamp(22px,5vw,30px)', fontWeight:800, lineHeight:1.25,
    letterSpacing:'-0.5px', marginBottom:8, color:'#1a0a00' },
  qSubtitle: { fontSize:14, color:'#9ca3af', lineHeight:1.5, fontWeight:400 },

  cardsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',
    gap:10, flex:1 },
  card: { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:18, padding:'16px 12px',
    cursor:'pointer', textAlign:'left', position:'relative', transition:'all 0.2s',
    fontFamily:'Poppins, sans-serif', display:'flex', flexDirection:'column', gap:6,
    color:'#1a0a00', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  cardSel: { background:'linear-gradient(135deg,rgba(255,107,53,0.06),rgba(255,69,0,0.06))',
    border:'1.5px solid #FF4500', boxShadow:'0 4px 20px rgba(255,69,0,0.15)',
    transform:'scale(1.02)', animation:'popIn 0.25s ease' },
  cardIcon: { fontSize:28, lineHeight:1 },
  cardLabel: { fontSize:13, fontWeight:700, color:'#1a1a2e', lineHeight:1.3 },
  cardSub: { fontSize:11, color:'#9ca3af', lineHeight:1.3 },
  cardCheck: { position:'absolute', top:10, right:10, width:20, height:20,
    borderRadius:'50%', background:'linear-gradient(135deg,#FF6B35,#FF4500)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:11, fontWeight:800, color:'white' },

  chipsWrap: { display:'flex', flexWrap:'wrap', gap:10, flex:1, alignContent:'flex-start' },
  chip: { padding:'11px 18px', borderRadius:30, border:'1px solid #e5e7eb',
    background:'#ffffff', cursor:'pointer', fontSize:13,
    fontFamily:'Poppins, sans-serif', color:'#6b7280',
    transition:'all 0.18s', fontWeight:500, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  chipSel: { border:'1.5px solid #FF4500',
    background:'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(255,69,0,0.08))',
    color:'#FF4500', fontWeight:700, boxShadow:'0 4px 14px rgba(255,69,0,0.15)',
    animation:'popIn 0.22s ease' },

  inputWrap: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
    alignItems:'center' },
  textInput: { width:'100%', maxWidth:400, padding:'18px 20px', borderRadius:16,
    border:'1.5px solid #e5e7eb', background:'#ffffff', fontSize:18,
    fontFamily:'Poppins, sans-serif', color:'#1a0a00', outline:'none',
    textAlign:'center', fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
    transition:'border-color 0.2s' },
  numberRow: { display:'flex', alignItems:'center', gap:16 },
  numBtn: { width:52, height:52, borderRadius:16, border:'1px solid #e5e7eb',
    background:'#ffffff', color:'#1a0a00', fontSize:24, cursor:'pointer',
    fontFamily:'Poppins, sans-serif', display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  numberBox: { display:'flex', alignItems:'center', gap:8 },
  numberInput: { width:110, padding:'16px 0', borderRadius:16, border:'1.5px solid #e5e7eb',
    background:'#ffffff', fontSize:36, fontFamily:'Poppins, sans-serif',
    color:'#1a0a00', outline:'none', textAlign:'center', fontWeight:800,
    boxShadow:'0 4px 20px rgba(0,0,0,0.06)' },
  unit: { fontSize:16, color:'#9ca3af', fontWeight:500 },

  bottom: { padding:'16px 24px 36px', maxWidth:600, width:'100%', margin:'0 auto',
    display:'flex', flexDirection:'column', gap:10, position:'relative', zIndex:1 },
  ctaBtn: { padding:'18px', background:'linear-gradient(135deg,#FF6B35,#FF4500)',
    color:'white', border:'none', borderRadius:18, fontSize:16, fontWeight:800,
    cursor:'pointer', fontFamily:'Poppins, sans-serif',
    boxShadow:'0 8px 28px rgba(255,69,0,0.35)', transition:'opacity 0.2s, transform 0.15s',
    letterSpacing:'0.2px' },
  skipBtn: { background:'transparent', border:'none', color:'#d1d5db',
    fontSize:13, cursor:'pointer', fontFamily:'Poppins, sans-serif',
    textDecoration:'underline', padding:'4px', textAlign:'center' },
  stepCount: { textAlign:'center', fontSize:11, color:'#d1d5db',
    letterSpacing:'1px', marginTop:2 },
}

