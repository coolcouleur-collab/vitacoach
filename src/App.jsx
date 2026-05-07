import React, { useState, useRef, useEffect } from 'react'
import Auth from './Auth'
import Landing from './Landing'
import Onboarding from './Onboarding'
import SanteTab, { scoreJour } from './SanteTab'

// ─── OPTIONS ─────────────────────────────────────────────────────────────────
const alimentaireOptions = [
  'Vegan','Végétarien','Flexitarien','Omnivore','Carnivore',
  'Keto','Sans gluten','Sans lactose','Méditerranéen','Jeûne intermittent',
  'Halal','Casher','Paléo','Low carb'
]
const styleOptions = [
  'Casual','Sportif','Élégant','Business','Streetwear','Minimaliste',
  'Bohème','Vintage','Luxe','Athleisure','Preppy','Rock','Chic décontracté','Tropical'
]
const objectifsOptions = [
  'Perdre du poids','Prendre du muscle','Mieux dormir',"Plus d'énergie",
  'Réduire le stress','Manger sainement','Améliorer ma peau','Courir un marathon',
  "Réduire l'alcool",'Arrêter de fumer','Productivité maximale','Équilibre mental'
]
const carencesOptions = [
  'Calcium','Vitamine D','Fer','Magnésium','Vitamine B12',
  'Zinc','Oméga-3','Vitamine C','Potassium','Aucune connue'
]
const maladiesOptions = [
  'Diabète','Hypertension','Hypothyroïdie','Hyperthyroïdie','Asthme',
  'Cholestérol élevé','Dépression / Anxiété','Endométriose','SOPK',
  'Maladie cœliaque','Crohn / MICI','Arthrite','Aucune'
]
const activiteOptions = [
  'Sédentaire','Légèrement actif','Modérément actif','Très actif','Sportif intensif'
]

// ─── STARFIELD ────────────────────────────────────────────────────────────────
function StarField() {
  const [stars] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.4,
      color: ['#00d4ff','#bf5af2','#00e676','#fff','#fff','#fff','#fff','#fff'][Math.floor(Math.random()*8)],
      dur: (2 + Math.random() * 4).toFixed(1),
      op: (Math.random() * 0.4 + 0.05).toFixed(2)
    }))
  )
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
          width:s.size, height:s.size, borderRadius:'50%',
          background:s.color, opacity:s.op,
          boxShadow:`0 0 ${s.size*5}px ${s.color}`,
          animation:`twinkle ${s.dur}s ease-in-out infinite alternate`
        }} />
      ))}
      <div style={{ position:'absolute', top:'6%', left:'4%', width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)', animation:'floatOrb 9s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'40%', right:'-8%', width:440, height:440, borderRadius:'50%', background:'radial-gradient(circle, rgba(191,90,242,0.06) 0%, transparent 70%)', animation:'floatOrb 13s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', bottom:'4%', left:'28%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 70%)', animation:'floatOrb 7s ease-in-out infinite' }} />
    </div>
  )
}

// ─── CHIPS ────────────────────────────────────────────────────────────────────
function Chips({ options, selected, onToggle, color='blue', single=false }) {
  return (
    <div style={styles.chips}>
      {options.map(o => {
        const sel = Array.isArray(selected) ? selected.includes(o) : selected === o
        let st = styles.chip
        if (sel) {
          if (color === 'orange') st = styles.chipOrange
          else if (color === 'green') st = styles.chipGreen
          else st = styles.chipBlue
        }
        return (
          <button key={o} style={st} onClick={() => onToggle(o)}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

// ─── AI BAR ───────────────────────────────────────────────────────────────────
function AIBar({ section, selections, onAnalyse, placeholder }) {
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState('')

  async function analyser() {
    if (!texte.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/analyser-profil', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ section, selections, texteLibre: texte })
      })
      const data = await res.json()
      setResultat(data.resume)
      onAnalyse(data.details)
    } catch { setResultat("Erreur lors de l'analyse.") }
    setLoading(false)
  }

  if (selections.length === 0) return null
  return (
    <div style={styles.aiBar}>
      <div style={styles.aiBarTitle}>⚡ Précise ton profil avec l'IA</div>
      <div style={styles.aiBarHint}>{placeholder}</div>
      <div style={styles.aiBarRow}>
        <input style={styles.aiInput} value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => e.key==='Enter' && analyser()}
          placeholder="Décris en quelques mots..." />
        <button style={styles.aiBtn} onClick={analyser} disabled={loading}>
          {loading ? '⏳' : '→'}
        </button>
      </div>
      {resultat && <div style={styles.aiResultat}>✓ {resultat}</div>}
    </div>
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

// ─── DEFAULT FORM ─────────────────────────────────────────────────────────────
const defaultForm = {
  nom:'', age:'', taille:'', poids:'',
  objectifs:[],
  reveil:'07:00', coucher:'23:00',
  activite:'Modérément actif', profession:'',
  regimes:[], alimentaireDetails:'',
  styles:[], styleDetails:'', mensurations:'',
  carences:[], santeDetails:'',
  maladies:[], maladiesDetails:''
}

// ─── APP ══════════════════════════════════════════════════════════════════════
export default function App() {
  const FREE_LIMIT = 5

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

  const [user, setUser]         = useState(() => safeParse('vitacoach_user', null))
  const [isPro, setIsPro]       = useState(() => safeParse('vitacoach_pro', false))
  const [profil, setProfil]     = useState(() => safeParse('vitacoach_profil', null))
  const [profilBackup, setProfilBackup] = useState(null)
  const [etape, setEtape]       = useState(() => { const s = localStorage.getItem('vitacoach_etape'); return s ? parseInt(s) : 1 })
  const [messages, setMessages] = useState(() => {
    const p = safeParse('vitacoach_profil', null)
    const h = safeParse('vitacoach_historique', null)
    if (p && h) return h
    if (p) return [{ role:'assistant', content:`Bon retour ${p.nom} ✦ Comment puis-je t'aider aujourd'hui ?` }]
    return []
  })
  const [form, setForm]         = useState(() => safeParse('vitacoach_form', defaultForm))
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [onglet, setOnglet]     = useState('chat')
  const [metriques, setMetriques] = useState(defaultMetriques)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])
  useEffect(() => {
    if (profil && messages.length > 0)
      localStorage.setItem('vitacoach_historique', JSON.stringify(messages.slice(-50)))
  }, [messages, profil])
  useEffect(() => {
    if (profil) return
    localStorage.setItem('vitacoach_form', JSON.stringify(form))
    localStorage.setItem('vitacoach_etape', etape.toString())
  }, [form, etape, profil])
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('subscribed') === 'true') {
      setIsPro(true)
      localStorage.setItem('vitacoach_pro', JSON.stringify(true))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // Suggestions contextuelles selon l'heure
  useEffect(() => {
    if (!profil) return
    const h = new Date().getHours()
    if (h < 10)       setSuggestions(["Comment bien démarrer ma journée ?", "Que manger ce matin ?", "Comment booster mon énergie ?"])
    else if (h < 14)  setSuggestions(["Idée repas de midi ?", "Comment rester concentré ?", "Stretch rapide pour le bureau ?"])
    else if (h < 18)  setSuggestions(["Je suis fatigué, que faire ?", "Collation saine ?", "Comment gérer mon stress ?"])
    else              setSuggestions(["Routine du soir pour bien dormir ?", "Que manger ce soir ?", "Comment me décompresser ?"])
  }, [profil])

  function toggle(key, val) {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x=>x!==val) : [...f[key], val] }))
  }

  function modifierProfil() {
    setProfilBackup(profil)
    setForm({
      nom: profil.nom||'', age: profil.age||'', taille: profil.taille||'', poids: profil.poids||'',
      objectifs: profil.objectifs||[],
      reveil: profil.reveil||'07:00', coucher: profil.coucher||'23:00',
      activite: profil.activite||'Modérément actif', profession: profil.profession||'',
      regimes: profil.regimes||[], alimentaireDetails: profil.alimentaireDetails||'',
      styles: profil.styles||[], styleDetails: profil.styleDetails||'', mensurations: profil.mensurations||'',
      carences: profil.carences||[], santeDetails: profil.santeDetails||'',
      maladies: profil.maladies||[], maladiesDetails: profil.maladiesDetails||''
    })
    setProfil(null); setEtape(1)
  }

  function annulerModification() {
    setProfil(profilBackup); setProfilBackup(null); setEtape(1)
  }

  function sauvegarderProfil() {
    if (!form.nom || !form.age) return alert('Prénom et âge obligatoires !')
    localStorage.setItem('vitacoach_profil', JSON.stringify(form))
    localStorage.removeItem('vitacoach_form')
    localStorage.removeItem('vitacoach_etape')
    const isEdit = !!profilBackup
    setProfil(form); setProfilBackup(null)
    setMessages([{ role:'assistant', content: isEdit
      ? `✓ Profil mis à jour, ${form.nom} ! Comment puis-je t'aider ?`
      : `✦ Bienvenue ${form.nom} ! Ton profil est créé. Réveil à ${form.reveil}, coucher à ${form.coucher} — je vais adapter tous mes conseils à ton rythme de vie.`
    }])
  }

  async function passerPro() {
    try {
      const res = await fetch('/api/create-checkout', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId:user?.id, email:user?.email })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Erreur: ' + (data.erreur||'inconnue'))
    } catch(e) { alert('Erreur: '+e.message) }
  }

  async function envoyerMessage(msgOverride) {
    const msg = msgOverride || input
    if (!msg.trim()) return
    if (!isPro && getMsgCount() >= FREE_LIMIT) {
      setMessages(prev => [...prev, { role:'assistant', content:`⚡ Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Oravia Pro pour des conseils illimités.` }])
      return
    }
    const userMsg = { role:'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    if (!isPro) incrementMsgCount()
    try {
      const resp = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: msg, profil, historique: messages.slice(-10), metriques })
      })
      const data = await resp.json()
      setMessages(prev => [...prev, { role:'assistant', content:data.reply }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Une erreur est survenue. Réessaie.' }])
    }
    setLoading(false)
  }

  function mettreAJourMetrique(key, val) {
    setMetriques(prev => {
      const newM = { ...prev, [key]: val }
      sauverMetriques(newM)
      return newM
    })
  }

  // ── LANDING ─────────────────────────────────────────────────────────────────
  const [showAuth, setShowAuth] = useState(false)
  if (!user && !showAuth) return <Landing onCommencer={() => setShowAuth(true)} />

  // ── AUTH ────────────────────────────────────────────────────────────────────
  if (!user) return (
    <Auth onConnecte={u => {
      setUser(u)
      localStorage.setItem('vitacoach_user', JSON.stringify(u))
    }} />
  )

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  if (!profil) {
    return (
      <Onboarding onTermine={p => {
        setProfil(p)
        setProfilBackup(null)
        setMessages([{ role:'assistant', content:`✦ Bienvenue ${p.nom} ! Ton profil est prêt. Je suis Oravia, ton coach de vie personnel. Comment puis-je t'aider aujourd'hui ?` }])
      }} />
    )
  }

  // ── MAIN APP ════════════════════════════════════════════════════════════════
  const score = scoreJour(metriques)
  const scoreColor = score >= 70 ? '#00e676' : score >= 40 ? '#ffd60a' : '#ff453a'

  const navItems = [
    ['chat','💬','Coach IA', null],
    ['sante','❤️','Santé', score > 0 ? score : null],
    ['routine','📋','Routine', null],
    ['style','👗','Style', null],
  ]

  return (
    <div style={styles.app}>

      {/* ══ SIDEBAR ══ */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>✦ Oravia</div>
          <div style={styles.subtitle}>Coach de vie IA</div>
        </div>

        <nav style={styles.sidebarNav}>
          {navItems.map(([id, icon, label, badge]) => (
            <button key={id} style={onglet===id ? styles.navItemActive : styles.navItem} onClick={() => setOnglet(id)}>
              <span style={{ fontSize:18, lineHeight:1 }}>{icon}</span>
              <span>{label}</span>
              {badge && (
                <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color: id==='sante' ? scoreColor : '#00d4ff', background: id==='sante' ? scoreColor+'18' : 'rgba(0,212,255,0.1)', borderRadius:6, padding:'2px 7px' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          {/* Quick metrics */}
          <div style={{ display:'flex', gap:6 }}>
            <div style={{ ...styles.stat, flex:1, textAlign:'center', cursor:'pointer' }} onClick={() => setOnglet('sante')}>
              💧 {metriques.eau > 0 ? `${metriques.eau}/8` : '—'}
            </div>
            <div style={{ ...styles.stat, flex:1, textAlign:'center', cursor:'pointer' }} onClick={() => setOnglet('sante')}>
              👣 {metriques.pas > 0 ? (metriques.pas >= 1000 ? Math.round(metriques.pas/1000)+'k' : metriques.pas) : '—'}
            </div>
          </div>

          <div style={styles.profileCard}>
            <div style={styles.profileAvatar}>{profil.nom?.charAt(0).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={styles.profileName}>{profil.nom}</div>
              {profil.objectifs?.[0] && <div style={styles.profileMeta}>🎯 {profil.objectifs[0]}</div>}
              {profil.reveil && <div style={styles.profileMeta}>⏰ {profil.reveil}–{profil.coucher}</div>}
            </div>
          </div>

          {!isPro && <button style={styles.btnPro} onClick={passerPro}>⚡ Pro — 4.99€/mois</button>}
          {isPro && <div style={styles.proBadge}>✦ Membre Pro</div>}
          <button style={styles.btnEdit} onClick={modifierProfil}>✏️ Modifier le profil</button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main style={styles.main}>
        <div style={styles.mainInner}>

        {/* ── Chat ── */}
        {onglet==='chat' && (
          <div style={{ display:'flex', flexDirection:'column', minHeight:'calc(100vh - 0px)' }}>
            <div style={styles.pageHeader}>
              <div style={styles.pageTitle}>💬 Coach IA</div>
              <div style={styles.pageSubtitle}>Pose n'importe quelle question sur ton bien-être</div>
            </div>
            <div style={{ ...styles.chatBox, flex:1, maxHeight:'none', minHeight:0 }}>
            {messages.length === 0 && (
              <div style={styles.emptyChat}>
                <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#1a1a2e', marginBottom:6 }}>
                  Je suis Oravia, ton coach de vie
                </div>
                <div style={{ fontSize:12, color:'#9ca3af', lineHeight:1.7 }}>
                  Nutrition · Bien-être · Style · Gestion du temps
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={msg.role==='user' ? styles.userMsg : styles.botMsg}>
                {msg.role==='assistant' && <span style={styles.avatar}>✦</span>}
                <div style={msg.role==='user' ? styles.userBubble : styles.botBubble}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={styles.botMsg}>
                <span style={styles.avatar}>✦</span>
                <div style={styles.botBubble}>
                  <span style={{ display:'inline-flex', gap:5 }}>
                    {[0,0.2,0.4].map((d,i)=>(
                      <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#00d4ff', display:'inline-block', animation:`twinkle 0.6s ${d}s ease-in-out infinite alternate` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && messages.length <= 1 && (
            <div style={styles.suggestionsRow}>
              {suggestions.map((s, i) => (
                <button key={i} style={styles.suggestion} onClick={() => envoyerMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div style={styles.inputBox}>
            <input style={styles.inputChat} value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter' && envoyerMessage()}
              placeholder="Pose une question à Oravia..." />
            <button style={styles.sendBtn} onClick={() => envoyerMessage()} aria-label="Envoyer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        )}

        {/* ── Santé ── */}
        {onglet==='sante' && (
          <SanteTab metriques={metriques} profil={profil} onUpdate={mettreAJourMetrique} score={score} />
        )}

        {/* ── Routine ── */}
        {onglet==='routine' && <RoutineModule profil={profil} metriques={metriques} />}

        {/* ── Style ── */}
        {onglet==='style' && <TenuesModule profil={profil} />}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={styles.bottomNav}>
        {[
          ['chat', '💬', 'Coach'],
          ['sante', '❤️', 'Santé'],
          ['routine', '📋', 'Routine'],
          ['style', '👗', 'Style'],
        ].map(([id, icon, label]) => (
          <button key={id}
            style={onglet===id ? styles.navItemActive : styles.navItem}
            onClick={() => setOnglet(id)}>
            <span style={{ fontSize:22, lineHeight:1 }}>{icon}</span>
            <span style={{ fontSize:9, fontWeight:onglet===id?700:500, letterSpacing:'0.8px', textTransform:'uppercase', marginTop:2 }}>{label}</span>
            {id==='sante' && score > 0 && (
              <span style={{ position:'absolute', top:6, right:'50%', transform:'translateX(10px)', width:6, height:6, borderRadius:'50%', background:scoreColor, boxShadow:`0 0 6px ${scoreColor}` }} />
            )}
          </button>
        ))}
      </div>
      </main>
    </div>
  )
}

// ─── ROUTINE MODULE ───────────────────────────────────────────────────────────
function RoutineModule({ profil, metriques }) {
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkedSteps, setCheckedSteps] = useState({})

  async function genererRoutine() {
    setLoading(true); setCheckedSteps({})
    try {
      const res = await fetch('/api/routine', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil, metriques })
      })
      const data = await res.json()
      setRoutine(data)
    } catch { alert('Erreur lors de la génération.') }
    setLoading(false)
  }

  function toggleStep(id) {
    setCheckedSteps(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={sr.header}>
        <div>
          <div style={sr.date}>{today}</div>
          <div style={sr.titre}>Ta routine du jour</div>
        </div>
        <button style={sr.btnGen} onClick={genererRoutine} disabled={loading}>
          {loading ? '⏳' : routine ? '🔄 Regénérer' : '✨ Générer'}
        </button>
      </div>

      {!routine && !loading && (
        <div style={sr.empty}>
          <div style={{ fontSize:44, marginBottom:14 }}>📋</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Ta routine quotidienne personnalisée</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>Adaptée à ton rythme · {profil.reveil} → {profil.coucher}</div>
        </div>
      )}

      {routine && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {routine.motivation && (
            <div style={sr.motivCard}>
              <div style={{ fontSize:18, marginBottom:8 }}>💫</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#00d4ff', lineHeight:1.65 }}>{routine.motivation}</div>
            </div>
          )}
          {routine.matin && <RoutineSection id="matin" icon="🌅" titre={routine.matin.titre} heure={routine.matin.heure} etapes={routine.matin.etapes} accent="#00d4ff" checked={checkedSteps} onToggle={toggleStep} />}
          {routine.nutrition && (
            <div style={{ ...sr.card, borderLeft:'3px solid rgba(0,230,118,0.5)' }}>
              <div style={sr.cardHeader}>
                <span style={{ fontSize:18 }}>🥗</span>
                <span style={sr.cardTitre}>{routine.nutrition.titre}</span>
              </div>
              {routine.nutrition.repas?.map((r,i) => (
                <div key={i} style={sr.repasRow}>
                  <span style={{ fontSize:16 }}>{r.emoji}</span>
                  <div style={{ color:'rgba(255,255,255,0.72)', fontSize:13, lineHeight:1.5 }}>
                    <strong style={{ color:'rgba(255,255,255,0.9)' }}>{r.moment}</strong> — {r.suggestion}
                  </div>
                </div>
              ))}
              {routine.nutrition.supplements?.length>0 && (
                <div style={sr.supplements}>💊 {routine.nutrition.supplements.join(' · ')}</div>
              )}
              {routine.nutrition.plantes?.map((p,i) => (
                <div key={i} style={sr.planteRow}>
                  <span>{p.emoji}</span>
                  <div style={{ color:'rgba(255,255,255,0.62)', fontSize:13, lineHeight:1.5 }}>
                    <strong style={{ color:'rgba(255,255,255,0.82)' }}>{p.nom}</strong> — {p.usage}
                    <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}> ({p.benefice})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {routine.apresmidi && <RoutineSection id="apresmidi" icon="☀️" titre={routine.apresmidi.titre} heure={routine.apresmidi.heure} etapes={routine.apresmidi.etapes} accent="#00e676" checked={checkedSteps} onToggle={toggleStep} />}
          {routine.soir && <RoutineSection id="soir" icon="🌙" titre={routine.soir.titre} heure={routine.soir.heure} etapes={routine.soir.etapes} accent="#bf5af2" checked={checkedSteps} onToggle={toggleStep} />}
          {routine.astuce && (
            <div style={{ ...sr.card, borderLeft:'3px solid rgba(0,212,255,0.4)', background:'rgba(0,212,255,0.04)' }}>
              <div style={sr.cardHeader}>
                <span style={{ fontSize:18 }}>{routine.astuce.emoji}</span>
                <span style={sr.cardTitre}>{routine.astuce.titre}</span>
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.62)', lineHeight:1.7 }}>{routine.astuce.conseil}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoutineSection({ id, icon, titre, heure, etapes, accent, checked, onToggle }) {
  const doneCount = etapes?.filter((_, i) => checked[`${id}_${i}`]).length || 0
  const total = etapes?.length || 0
  return (
    <div style={{ ...sr.card, borderLeft:`3px solid ${accent}40` }}>
      <div style={{ ...sr.cardHeader, justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <div>
            <div style={{ ...sr.cardTitre, color: accent }}>{titre}</div>
            {heure && <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:1 }}>{heure}</div>}
          </div>
        </div>
        {total > 0 && (
          <div style={{ fontSize:11, color: doneCount===total ? accent : 'rgba(255,255,255,0.3)', fontWeight:700 }}>
            {doneCount}/{total}
          </div>
        )}
      </div>
      {etapes?.map((e, i) => {
        const done = checked[`${id}_${i}`]
        return (
          <div key={i} style={{ ...sr.etapeRow, opacity: done ? 0.5 : 1 }} onClick={() => onToggle(`${id}_${i}`)}>
            <div style={{ width:22, height:22, borderRadius:7, border:`1.5px solid ${done ? accent : 'rgba(255,255,255,0.15)'}`, background: done ? accent+'20' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
              {done && <span style={{ fontSize:11, color:accent }}>✓</span>}
            </div>
            <span style={{ fontSize:18, minWidth:26, flexShrink:0 }}>{e.emoji}</span>
            <div>
              <div style={{ fontWeight:600, fontSize:13, color:'rgba(255,255,255,0.88)', textDecoration: done ? 'line-through' : 'none' }}>{e.action}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{e.detail}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const sr = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, padding:'12px 0' },
  date: { fontSize:11, color:'rgba(255,255,255,0.28)', textTransform:'capitalize', letterSpacing:1 },
  titre: { fontSize:18, fontWeight:700, background:'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginTop:4 },
  btnGen: { background:'linear-gradient(135deg, #00d4ff, #0080ff)', color:'#000', border:'none', padding:'10px 16px', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,212,255,0.4)', flexShrink:0, fontFamily:'Poppins, sans-serif' },
  empty: { background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:22, padding:44, textAlign:'center' },
  motivCard: { background:'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(191,90,242,0.07))', border:'1px solid rgba(0,212,255,0.18)', borderRadius:20, padding:20, textAlign:'center' },
  card: { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:16 },
  cardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  cardTitre: { fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' },
  etapeRow: { display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0', borderTop:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' },
  repasRow: { display:'flex', gap:10, alignItems:'center', padding:'6px 0' },
  planteRow: { display:'flex', gap:10, alignItems:'flex-start', padding:'6px 0', borderTop:'1px solid rgba(255,255,255,0.04)', marginTop:4 },
  supplements: { fontSize:12, color:'#00e676', background:'rgba(0,230,118,0.08)', borderRadius:8, padding:'6px 12px', marginTop:8, border:'1px solid rgba(0,230,118,0.15)' }
}

// ─── TENUES MODULE ────────────────────────────────────────────────────────────
function TenueCard({ tenue }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [imgError, setImgError] = useState(false)
  useEffect(() => {
    const q = tenue.imagePrompt||tenue.description||tenue.titre
    fetch(`/api/image?prompt=${encodeURIComponent(q)}`)
      .then(r=>r.json())
      .then(d=>{ if(d.url) setImgSrc(d.url); else setImgError(true) })
      .catch(()=>setImgError(true))
  }, [])
  return (
    <div style={styles.tenueCard}>
      <div style={styles.tenueImgBox}>
        {!imgSrc && !imgError && <div style={styles.tenueImgPlaceholder}>🔍 Génération...</div>}
        {imgError && <div style={styles.tenueImgPlaceholder}>👗 {tenue.titre}</div>}
        {imgSrc && <img src={imgSrc} alt={tenue.titre} style={styles.tenueImg} onError={()=>setImgError(true)} />}
      </div>
      <div style={styles.tenueInfo}>
        <div style={styles.tenueTitre}>✦ {tenue.titre}</div>
        <div style={styles.tenueDesc}>{tenue.description}</div>
        <div style={styles.tenuePourquoi}>💡 {tenue.pourquoi}</div>
      </div>
    </div>
  )
}

function TenuesModule({ profil }) {
  const [ouvert, setOuvert]     = useState(false)
  const [ville, setVille]       = useState('')
  const [occasion, setOccasion] = useState('Casual')
  const [tenues, setTenues]     = useState([])
  const [meteo, setMeteo]       = useState('')
  const [loading, setLoading]   = useState(false)
  const occasions = ['Travail','Casual','Soirée','Sport','Rendez-vous','Voyage']

  async function getTenues() {
    if (!ville.trim()) return alert('Entre ta ville !')
    setLoading(true); setTenues([])
    try {
      const res = await fetch('/api/tenues', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil, ville, occasion })
      })
      const data = await res.json()
      setTenues(data.tenues||[])
      setMeteo(data.meteo)
    } catch { setTenues([]) }
    setLoading(false)
  }

  return (
    <div style={styles.tenuesBox}>
      <button style={styles.tenuesBtn} onClick={()=>setOuvert(!ouvert)}>
        <span style={{ fontSize:20 }}>👗</span>
        <span>{ouvert ? 'Fermer les suggestions' : 'Idées tenues du jour'}</span>
        <span style={{ marginLeft:'auto', opacity:0.5 }}>{ouvert ? '▲' : '▼'}</span>
      </button>
      {ouvert && (
        <div style={styles.tenuesPanel}>
          {meteo && <div style={styles.meteoBar}>🌤️ {meteo}</div>}
          <div style={styles.tenuesRow}>
            <input style={styles.villeInput} placeholder="Ta ville (ex: Paris)" value={ville}
              onChange={e=>setVille(e.target.value)} onKeyDown={e=>e.key==='Enter' && getTenues()} />
            <select style={styles.selectOccasion} value={occasion} onChange={e=>setOccasion(e.target.value)}>
              {occasions.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
            <button style={styles.btnGetTenues} onClick={getTenues} disabled={loading}>
              {loading ? '⏳' : '✨'}
            </button>
          </div>
          {tenues.length>0 && (
            <div style={styles.tenuesGrid}>
              {tenues.map((t,i) => <TenueCard key={i} tenue={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  /* ── Layout global ── */
  app: { display:'flex', minHeight:'100vh', background:'#f5f6ff', fontFamily:'Poppins, sans-serif', position:'relative' },

  /* ── Sidebar ── */
  sidebar: { width:248, flexShrink:0, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', borderRight:'1px solid #e5e7eb', boxShadow:'2px 0 20px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', padding:'26px 14px 22px', position:'fixed', top:0, left:0, height:'100vh', zIndex:50, overflowY:'auto' },
  sidebarTop: { marginBottom:32 },
  sidebarNav: { display:'flex', flexDirection:'column', gap:4, flex:1 },
  sidebarBottom: { display:'flex', flexDirection:'column', gap:9, marginTop:20 },
  profileCard: { display:'flex', alignItems:'center', gap:11, background:'#f5f6ff', border:'1px solid #e5e7eb', borderRadius:14, padding:'11px 13px' },
  profileAvatar: { width:36, height:36, borderRadius:11, background:'linear-gradient(135deg,#00d4ff,#bf5af2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#000', flexShrink:0 },
  profileName: { fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:2 },
  profileMeta: { fontSize:10, color:'#9ca3af', lineHeight:1.5 },
  navItem: { display:'flex', alignItems:'center', gap:12, padding:'11px 13px', borderRadius:13, border:'none', background:'transparent', cursor:'pointer', fontFamily:'Poppins, sans-serif', color:'#6b7280', fontWeight:500, textAlign:'left', width:'100%', fontSize:13, position:'relative', transition:'all 0.2s' },
  navItemActive: { display:'flex', alignItems:'center', gap:12, padding:'11px 13px', borderRadius:13, border:'1.5px solid #6e3dff', background:'linear-gradient(135deg,rgba(0,212,255,0.08),rgba(110,61,255,0.08))', cursor:'pointer', fontFamily:'Poppins, sans-serif', color:'#6e3dff', fontWeight:700, textAlign:'left', width:'100%', fontSize:13, position:'relative', transition:'all 0.2s' },

  /* ── Main ── */
  main: { flex:1, marginLeft:248, display:'flex', flexDirection:'column', position:'relative', zIndex:1 },
  mainInner: { flex:1, maxWidth:860, width:'100%', margin:'0 auto', padding:'0 36px 60px', display:'flex', flexDirection:'column' },
  pageHeader: { padding:'32px 0 20px', borderBottom:'1px solid #e5e7eb', marginBottom:22, flexShrink:0 },
  pageTitle: { fontSize:24, fontWeight:800, color:'#0d0d1a', marginBottom:5, letterSpacing:'-0.4px' },
  pageSubtitle: { fontSize:12, color:'#9ca3af' },

  /* ── kept for compat ── */
  header: { display:'none' },
  headerTop: {},
  logo: { fontSize:22, fontWeight:900, background:'linear-gradient(135deg, #00b4d8 30%, #6e3dff 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'-0.5px' },
  subtitle: { fontSize:10, color:'#9ca3af', marginTop:3, letterSpacing:'0.3px' },
  scorePill: { background:'rgba(255,255,255,0.05)', border:'1px solid', borderRadius:9, padding:'5px 9px', fontSize:11, fontWeight:800, cursor:'pointer', backdropFilter:'blur(10px)', letterSpacing:'0.5px' },
  stats: { display:'flex', gap:6, flexWrap:'wrap', marginTop:8 },
  stat: { background:'#f5f6ff', border:'1px solid #e5e7eb', borderRadius:7, padding:'4px 9px', fontSize:10, color:'#6b7280', cursor:'pointer', whiteSpace:'nowrap' },

  content: { padding:'0', position:'relative', zIndex:1 },

  chatBox: { minHeight:360, maxHeight:460, overflowY:'auto', marginBottom:12, padding:'4px 0' },
  emptyChat: { textAlign:'center', padding:'60px 20px 40px', color:'#9ca3af' },
  userMsg: { display:'flex', justifyContent:'flex-end', marginBottom:12 },
  botMsg: { display:'flex', alignItems:'flex-start', marginBottom:12, gap:8 },
  userBubble: { background:'linear-gradient(135deg,#00d4ff,#6e3dff)', color:'white', padding:'11px 15px', borderRadius:'18px 18px 4px 18px', maxWidth:'76%', fontSize:14, lineHeight:1.55, boxShadow:'0 4px 18px rgba(110,61,255,0.25)' },
  botBubble: { background:'#ffffff', border:'1px solid #e5e7eb', color:'#0d0d1a', padding:'12px 15px', borderRadius:'4px 18px 18px 18px', maxWidth:'82%', fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' },
  avatar: { fontSize:15, color:'#6e3dff', marginTop:6, flexShrink:0 },

  suggestionsRow: { display:'flex', gap:7, marginBottom:10, flexWrap:'wrap' },
  suggestion: { background:'#f5f6ff', border:'1px solid #e5e7eb', borderRadius:20, padding:'7px 13px', fontSize:11, color:'#6e3dff', cursor:'pointer', fontFamily:'Poppins, sans-serif', whiteSpace:'nowrap' },

  inputBox: { display:'flex', gap:8, background:'#ffffff', borderRadius:18, padding:'8px 8px 8px 16px', border:'1px solid #e5e7eb', alignItems:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' },
  inputChat: { flex:1, border:'none', outline:'none', fontSize:14, fontFamily:'Poppins, sans-serif', background:'transparent', color:'#0d0d1a' },
  sendBtn: { background:'linear-gradient(135deg, #00d4ff, #0080ff)', border:'none', width:40, height:40, borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(0,212,255,0.4)' },

  bottomNav: { display:'none' },

  btnPro: { background:'linear-gradient(135deg, #ff6d00, #ff9800)', color:'white', border:'none', padding:'7px 12px', borderRadius:9, cursor:'pointer', fontSize:11, fontFamily:'Poppins, sans-serif', fontWeight:700, boxShadow:'0 4px 12px rgba(255,109,0,0.4)' },
  proBadge: { background:'rgba(191,90,242,0.12)', color:'#bf5af2', border:'1px solid rgba(191,90,242,0.3)', padding:'5px 11px', borderRadius:8, fontSize:11, fontWeight:700 },
  btnEdit: { background:'#f5f6ff', color:'#6b7280', border:'1px solid #e5e7eb', padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', fontWeight:500, textAlign:'center', width:'100%', letterSpacing:'0.2px' },

  formBox: { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:'22px 22px 24px', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' },
  formTitle: { color:'#00d4ff', marginBottom:18, fontSize:17, fontWeight:700, textShadow:'0 0 20px rgba(0,212,255,0.3)', marginTop:0 },
  field: { marginBottom:18 },
  row: { display:'flex', gap:8, marginBottom:18 },
  label: { display:'block', marginBottom:6, fontWeight:600, color:'rgba(255,255,255,0.35)', fontSize:10, letterSpacing:'1.2px', textTransform:'uppercase' },
  inputField: { flex:1, width:'100%', padding:'11px 13px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', fontSize:13, fontFamily:'Poppins, sans-serif', boxSizing:'border-box', outline:'none', color:'white', backdropFilter:'blur(10px)' },
  planningDivider: { display:'flex', alignItems:'center', gap:10, margin:'20px 0 16px' },
  planningLabel: { fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:1.5, whiteSpace:'nowrap' },
  chips: { display:'flex', flexWrap:'wrap', gap:7 },
  chip: { padding:'7px 13px', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', color:'rgba(255,255,255,0.45)', transition:'all 0.15s' },
  chipBlue: { padding:'7px 13px', borderRadius:20, border:'1px solid rgba(0,212,255,0.45)', background:'rgba(0,212,255,0.1)', cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', color:'#00d4ff', fontWeight:700, boxShadow:'0 0 10px rgba(0,212,255,0.18)' },
  chipOrange: { padding:'7px 13px', borderRadius:20, border:'1px solid rgba(255,152,0,0.45)', background:'rgba(255,152,0,0.1)', cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', color:'#ffb74d', fontWeight:700, boxShadow:'0 0 10px rgba(255,152,0,0.18)' },
  chipGreen: { padding:'7px 13px', borderRadius:20, border:'1px solid rgba(0,230,118,0.45)', background:'rgba(0,230,118,0.1)', cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', color:'#00e676', fontWeight:700, boxShadow:'0 0 10px rgba(0,230,118,0.18)' },
  aiBar: { background:'rgba(0,212,255,0.04)', border:'1px dashed rgba(0,212,255,0.22)', borderRadius:13, padding:14, marginTop:10, marginBottom:5 },
  aiBarTitle: { fontWeight:700, color:'#00d4ff', marginBottom:4, fontSize:11, letterSpacing:'0.3px' },
  aiBarHint: { fontSize:11, color:'rgba(255,255,255,0.28)', marginBottom:9, fontStyle:'italic' },
  aiBarRow: { display:'flex', gap:7 },
  aiInput: { flex:1, padding:'8px 13px', borderRadius:10, border:'1px solid rgba(0,212,255,0.18)', background:'rgba(255,255,255,0.04)', fontSize:13, fontFamily:'Poppins, sans-serif', outline:'none', color:'white' },
  aiBtn: { background:'linear-gradient(135deg, #00d4ff, #0080ff)', color:'#000', border:'none', padding:'8px 14px', borderRadius:10, fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 0 12px rgba(0,212,255,0.35)' },
  aiResultat: { marginTop:9, fontSize:12, color:'#00e676', background:'rgba(0,230,118,0.07)', padding:'7px 11px', borderRadius:8, border:'1px solid rgba(0,230,118,0.18)' },
  profileSaved: { fontSize:12, color:'#00e676', marginTop:6, fontWeight:600 },
  navBtns: { display:'flex', justifyContent:'space-between', marginTop:24, gap:10 },
  btnBack: { padding:'12px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Poppins, sans-serif', color:'rgba(255,255,255,0.45)' },
  btnNext: { flex:1, padding:'13px 20px', background:'linear-gradient(135deg, #00d4ff, #0080ff)', color:'#000', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 4px 20px rgba(0,212,255,0.4)' },
  btnSave: { flex:1, padding:'13px 20px', background:'linear-gradient(135deg, #bf5af2, #6e2da0)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 4px 20px rgba(191,90,242,0.4)' },
  btnAnnuler: { padding:'12px 18px', borderRadius:12, border:'1px solid rgba(255,82,82,0.28)', background:'rgba(255,82,82,0.06)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Poppins, sans-serif', color:'#ff5252' },

  tenuesBox: { marginBottom:14 },
  tenuesBtn: { width:'100%', padding:'13px 16px', background:'rgba(191,90,242,0.08)', color:'#bf5af2', border:'1px solid rgba(191,90,242,0.28)', borderRadius:14, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Poppins, sans-serif', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', gap:10, boxShadow:'0 4px 16px rgba(191,90,242,0.12)' },
  tenuesPanel: { background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'0 0 16px 16px', padding:14 },
  meteoBar: { background:'rgba(0,212,255,0.06)', borderRadius:9, padding:'8px 13px', fontSize:12, marginBottom:11, color:'#00d4ff', fontWeight:500, border:'1px solid rgba(0,212,255,0.16)' },
  tenuesRow: { display:'flex', gap:7, marginBottom:11 },
  villeInput: { flex:1, padding:'9px 13px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', fontSize:13, fontFamily:'Poppins, sans-serif', outline:'none', color:'white' },
  selectOccasion: { padding:'9px 11px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,16,0.8)', fontSize:12, fontFamily:'Poppins, sans-serif', outline:'none', color:'white' },
  btnGetTenues: { padding:'9px 16px', background:'linear-gradient(135deg, #bf5af2, #6e2da0)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 4px 12px rgba(191,90,242,0.35)' },
  tenuesGrid: { display:'flex', gap:12, flexWrap:'wrap', marginTop:10 },
  tenueCard: { flex:'1 1 180px', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(191,90,242,0.18)', borderRadius:16, overflow:'hidden' },
  tenueImgBox: { width:'100%', height:220, background:'rgba(191,90,242,0.05)', position:'relative' },
  tenueImgPlaceholder: { width:'100%', height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(191,90,242,0.5)', fontSize:12, textAlign:'center', padding:10, boxSizing:'border-box' },
  tenueImg: { width:'100%', height:220, objectFit:'cover', display:'block' },
  tenueInfo: { padding:12 },
  tenueTitre: { fontWeight:700, color:'#bf5af2', fontSize:12, marginBottom:6 },
  tenueDesc: { fontSize:11, color:'rgba(255,255,255,0.52)', lineHeight:1.65, marginBottom:6 },
  tenuePourquoi: { fontSize:10, color:'rgba(255,255,255,0.26)', fontStyle:'italic' }
}
