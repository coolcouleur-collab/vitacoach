import React, { useState, useRef, useEffect } from 'react'
import Auth from './Auth'

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
  "Réduire l'alcool",'Arrêter de fumer'
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

/* ─── Starfield ─── */
function StarField() {
  const [stars] = useState(() =>
    Array.from({ length: 90 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.2 + 0.4,
      color: ['#00d4ff','#bf5af2','#00ff88','#fff','#fff','#fff','#fff'][Math.floor(Math.random()*7)],
      dur: (1.8 + Math.random() * 4).toFixed(1),
      op: (Math.random() * 0.55 + 0.08).toFixed(2)
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
      {/* Orbs */}
      <div style={{ position:'absolute', top:'8%', left:'5%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,255,0.09) 0%, transparent 70%)', animation:'floatOrb 9s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'45%', right:'-5%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(191,90,242,0.08) 0%, transparent 70%)', animation:'floatOrb 12s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', bottom:'5%', left:'30%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)', animation:'floatOrb 7s ease-in-out infinite' }} />
    </div>
  )
}

/* ─── Chips ─── */
function Chips({ options, selected, onToggle, color='blue' }) {
  return (
    <div style={styles.chips}>
      {options.map(o => {
        const sel = selected.includes(o)
        const st = sel ? (color==='orange' ? styles.chipOrange : styles.chipBlue) : styles.chip
        return <button key={o} style={st} onClick={() => onToggle(o)}>{o}</button>
      })}
    </div>
  )
}

/* ─── AIBar ─── */
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
      <div style={styles.aiBarTitle}>⚡ Précise ton profil</div>
      <div style={styles.aiBarHint}>{placeholder}</div>
      <div style={styles.aiBarRow}>
        <input style={styles.aiInput} value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => e.key==='Enter' && analyser()}
          placeholder="Écris librement..." />
        <button style={styles.aiBtn} onClick={analyser} disabled={loading}>
          {loading ? '⏳' : '→'}
        </button>
      </div>
      {resultat && <div style={styles.aiResultat}>✓ {resultat}</div>}
    </div>
  )
}

const defaultForm = {
  nom:'', age:'', taille:'', poids:'',
  objectifs:[],
  regimes:[], alimentaireDetails:'',
  styles:[], styleDetails:'', mensurations:'',
  carences:[], santeDetails:'',
  maladies:[], maladiesDetails:''
}

/* ═══════════════════════════════════════════════ APP ══ */
export default function App() {
  const safeParse = (key, fb) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb }
  }
  const FREE_LIMIT = 5

  const getMsgCount = () => {
    const today = new Date().toDateString()
    const saved = safeParse('vitacoach_msg_count', { date:today, count:0 })
    return saved.date !== today ? 0 : saved.count
  }
  const incrementMsgCount = () => {
    const today = new Date().toDateString()
    localStorage.setItem('vitacoach_msg_count', JSON.stringify({ date:today, count: getMsgCount()+1 }))
  }

  const [user, setUser]         = useState(() => safeParse('vitacoach_user', null))
  const [isPro, setIsPro]       = useState(() => safeParse('vitacoach_pro', false))
  const [profil, setProfil]     = useState(() => safeParse('vitacoach_profil', null))
  const [profilBackup, setProfilBackup] = useState(null)
  const [etape, setEtape]       = useState(() => { const s=localStorage.getItem('vitacoach_etape'); return s ? parseInt(s) : 1 })
  const [messages, setMessages] = useState(() => {
    const p = safeParse('vitacoach_profil', null)
    const h = safeParse('vitacoach_historique', null)
    if (p && h) return h
    if (p) return [{ role:'assistant', content:`Bon retour ${p.nom} ✦ Comment puis-je t'aider aujourd'hui ?` }]
    return []
  })
  const [form, setForm]   = useState(() => safeParse('vitacoach_form', defaultForm))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [onglet, setOnglet]   = useState('chat')
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
    if (p.get('subscribed')==='true') {
      setIsPro(true)
      localStorage.setItem('vitacoach_pro', JSON.stringify(true))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  function toggle(key, val) {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x=>x!==val) : [...f[key], val] }))
  }

  function modifierProfil() {
    setProfilBackup(profil)
    setForm({
      nom: profil.nom||'', age: profil.age||'', taille: profil.taille||'', poids: profil.poids||'',
      objectifs: profil.objectifs||[], regimes: profil.regimes||[], alimentaireDetails: profil.alimentaireDetails||'',
      styles: profil.styles||[], styleDetails: profil.styleDetails||'', mensurations: profil.mensurations||'',
      carences: profil.carences||[], santeDetails: profil.santeDetails||'',
      maladies: profil.maladies||[], maladiesDetails: profil.maladiesDetails||''
    })
    setProfil(null)
    setEtape(1)
  }
  function annulerModification() {
    setProfil(profilBackup)
    setProfilBackup(null)
    setEtape(1)
  }
  function sauvegarderProfil() {
    if (!form.nom || !form.age) return alert('Prénom et âge obligatoires !')
    localStorage.setItem('vitacoach_profil', JSON.stringify(form))
    localStorage.removeItem('vitacoach_form')
    localStorage.removeItem('vitacoach_etape')
    const isEdit = !!profilBackup
    setProfil(form)
    setProfilBackup(null)
    setMessages([{ role:'assistant', content: isEdit
      ? `✓ Profil mis à jour, ${form.nom} ! Comment puis-je t'aider ?`
      : `✦ Bienvenue ${form.nom} ! Ton profil est prêt. Je suis là pour t'accompagner chaque jour.`
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
  async function envoyerMessage() {
    if (!input.trim()) return
    if (!isPro && getMsgCount() >= FREE_LIMIT) {
      setMessages(prev => [...prev, { role:'assistant', content:`⚡ Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à Oravi Pro pour des conseils illimités.` }])
      return
    }
    const userMsg = { role:'user', content:input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    if (!isPro) incrementMsgCount()
    try {
      const resp = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message:input, profil, historique:messages.slice(-10) })
      })
      const data = await resp.json()
      setMessages(prev => [...prev, { role:'assistant', content:data.reply }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Une erreur est survenue. Réessaie.' }])
    }
    setLoading(false)
  }

  /* ── AUTH ── */
  if (!user) return <Auth onConnecte={u => { setUser(u); localStorage.setItem('vitacoach_user', JSON.stringify(u)) }} />

  /* ── FORMULAIRE ONBOARDING ── */
  if (!profil) {
    const etapeLabels = ['Identité','Alimentation','Style','Santé']
    return (
      <div style={styles.app}>
        <StarField />
        <div style={{ position:'relative', zIndex:1, padding:'40px 22px 60px' }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={styles.logo}>✦ Oravi</div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginTop:8 }}>
              {profilBackup ? 'Modifier ton profil' : 'Crée ton profil personnalisé'}
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display:'flex', gap:8, marginBottom:10, justifyContent:'center' }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{
                width: etape===n ? 36 : 10, height:10, borderRadius:5,
                background: etape===n ? '#00d4ff' : etape>n ? '#00ff88' : 'rgba(255,255,255,0.12)',
                transition:'all 0.35s ease',
                boxShadow: etape===n ? '0 0 14px #00d4ff' : 'none'
              }} />
            ))}
          </div>
          <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, textAlign:'center', marginBottom:24, textTransform:'uppercase', letterSpacing:2 }}>
            {etapeLabels[etape-1]}
          </div>

          <div style={styles.formBox}>
            {/* Étape 1 */}
            {etape===1 && <>
              <h2 style={styles.formTitle}>👤 Qui es-tu ?</h2>
              <div style={styles.field}>
                <label style={styles.label}>Prénom *</label>
                <input style={styles.inputField} placeholder="Ton prénom" value={form.nom} maxLength={30}
                  onChange={e => setForm({...form, nom:e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g,'')})} />
              </div>
              <div style={styles.row}>
                {[['age','Âge *',1,120,'Ex: 28'],['taille','Taille (cm)',50,250,'Ex: 170'],['poids','Poids (kg)',20,300,'Ex: 65']].map(([k,lb,mn,mx,ph])=>(
                  <div key={k} style={{flex:1}}>
                    <label style={styles.label}>{lb}</label>
                    <input style={styles.inputField} type="number" placeholder={ph} value={form[k]} min={mn} max={mx}
                      onChange={e => setForm({...form,[k]:e.target.value})} />
                  </div>
                ))}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tes objectifs</label>
                <Chips options={objectifsOptions} selected={form.objectifs} onToggle={v=>toggle('objectifs',v)} />
              </div>
            </>}

            {/* Étape 2 */}
            {etape===2 && <>
              <h2 style={styles.formTitle}>🍽️ Alimentation</h2>
              <div style={styles.field}>
                <label style={styles.label}>Ce qui te correspond</label>
                <Chips options={alimentaireOptions} selected={form.regimes} onToggle={v=>toggle('regimes',v)} />
              </div>
              <AIBar section="alimentation" selections={form.regimes}
                placeholder="Ex: vegan 5j/7 mais poisson le weekend, j'adore les légumineuses..."
                onAnalyse={d=>setForm(f=>({...f,alimentaireDetails:d}))} />
              {form.alimentaireDetails && <div style={styles.profileSaved}>✓ Profil alimentaire enrichi</div>}
            </>}

            {/* Étape 3 */}
            {etape===3 && <>
              <h2 style={styles.formTitle}>👗 Style</h2>
              <div style={styles.field}>
                <label style={styles.label}>Tes styles</label>
                <Chips options={styleOptions} selected={form.styles} onToggle={v=>toggle('styles',v)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mensurations</label>
                <div style={styles.row}>
                  <input style={styles.inputField} placeholder="Poitrine (cm)" onChange={e=>setForm(f=>({...f,mensurations:f.mensurations+' poitrine:'+e.target.value}))} />
                  <input style={styles.inputField} placeholder="Taille (cm)" onChange={e=>setForm(f=>({...f,mensurations:f.mensurations+' taille:'+e.target.value}))} />
                  <input style={styles.inputField} placeholder="Hanches (cm)" onChange={e=>setForm(f=>({...f,mensurations:f.mensurations+' hanches:'+e.target.value}))} />
                </div>
              </div>
              <AIBar section="style" selections={form.styles}
                placeholder="Ex: streetwear au quotidien mais business au bureau..."
                onAnalyse={d=>setForm(f=>({...f,styleDetails:d}))} />
              {form.styleDetails && <div style={styles.profileSaved}>✓ Profil style enrichi</div>}
            </>}

            {/* Étape 4 */}
            {etape===4 && <>
              <h2 style={styles.formTitle}>❤️ Santé</h2>
              <div style={styles.field}>
                <label style={styles.label}>Carences connues</label>
                <Chips options={carencesOptions} selected={form.carences} onToggle={v=>toggle('carences',v)} color="orange" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Maladies / Pathologies</label>
                <Chips options={maladiesOptions} selected={form.maladies} onToggle={v=>toggle('maladies',v)} color="orange" />
              </div>
              <AIBar section="sante" selections={[...form.carences,...form.maladies]}
                placeholder="Ex: Diabète type 2, je prends de la metformine..."
                onAnalyse={d=>setForm(f=>({...f,santeDetails:d}))} />
              {form.santeDetails && <div style={styles.profileSaved}>✓ Profil santé enrichi</div>}
            </>}

            {/* Navigation */}
            <div style={styles.navBtns}>
              {etape>1 ? (
                <button style={styles.btnBack} onClick={()=>setEtape(e=>e-1)}>← Retour</button>
              ) : profilBackup ? (
                <button style={styles.btnAnnuler} onClick={annulerModification}>✕ Annuler</button>
              ) : null}
              {etape<4 ? (
                <button style={styles.btnNext} onClick={()=>{
                  if (etape===1 && (!form.nom||!form.age)) return alert('Prénom et âge obligatoires !')
                  setEtape(e=>e+1)
                }}>Suivant →</button>
              ) : (
                <button style={styles.btnSave} onClick={sauvegarderProfil}>
                  {profilBackup ? '💾 Sauvegarder' : '⚡ Lancer Oravi'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── MAIN APP ── */
  return (
    <div style={styles.app}>
      <StarField />

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.logo}>✦ Oravi</div>
            <div style={styles.subtitle}>Bonjour {profil.nom} ✦</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {!isPro && (
              <button style={styles.btnPro} onClick={passerPro}>⚡ Pro 4.99€</button>
            )}
            {isPro && <div style={styles.proBadge}>✦ Pro</div>}
            <button style={styles.btnEdit} onClick={modifierProfil} title="Modifier le profil">✏️</button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          {profil.regimes?.length>0 && <div style={styles.stat}>🍽️ {profil.regimes.slice(0,2).join(' · ')}</div>}
          {profil.objectifs?.length>0 && <div style={styles.stat}>🎯 {profil.objectifs[0]}</div>}
          {profil.carences?.length>0 && !profil.carences.includes('Aucune connue') && (
            <div style={{...styles.stat, borderColor:'rgba(255,152,0,0.35)', color:'#ffb74d'}}>⚠️ {profil.carences[0]}</div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={styles.content}>

        {/* Chat */}
        {onglet==='chat' && <>
          <div style={styles.chatBox}>
            {messages.map((msg,i) => (
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
                  <span style={{ display:'inline-flex', gap:4 }}>
                    <span style={{ animation:'twinkle 0.6s ease-in-out infinite alternate' }}>·</span>
                    <span style={{ animation:'twinkle 0.6s 0.2s ease-in-out infinite alternate' }}>·</span>
                    <span style={{ animation:'twinkle 0.6s 0.4s ease-in-out infinite alternate' }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={styles.inputBox}>
            <input style={styles.inputChat} value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter' && envoyerMessage()}
              placeholder="Pose une question à Oravi..." />
            <button style={styles.sendBtn} onClick={envoyerMessage} aria-label="Envoyer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </>}

        {/* Routine */}
        {onglet==='routine' && <RoutineModule profil={profil} />}

        {/* Tenues */}
        {onglet==='tenues' && <TenuesModule profil={profil} />}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={styles.bottomNav}>
        {[['chat','💬','Coach'],['routine','📋','Routine'],['tenues','👗','Tenues']].map(([id,icon,label])=>(
          <button key={id}
            style={onglet===id ? styles.navItemActive : styles.navItem}
            onClick={()=>setOnglet(id)}>
            <span style={{ fontSize:22, lineHeight:1 }}>{icon}</span>
            <span style={{ fontSize:9, fontWeight:onglet===id?700:500, letterSpacing:'0.8px', textTransform:'uppercase', marginTop:2 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Routine Module ─── */
function RoutineModule({ profil }) {
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(false)

  async function genererRoutine() {
    setLoading(true)
    try {
      const res = await fetch('/api/routine', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil })
      })
      const data = await res.json()
      setRoutine(data)
    } catch { alert('Erreur lors de la génération.') }
    setLoading(false)
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
          {loading ? '⏳' : routine ? '🔄' : '✨ Générer'}
        </button>
      </div>

      {!routine && !loading && (
        <div style={sr.empty}>
          <div style={{ fontSize:44, marginBottom:14 }}>📋</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>Ta routine quotidienne personnalisée</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>Nutrition · Bien-être · Conseils adaptés</div>
        </div>
      )}

      {routine && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {routine.motivation && (
            <div style={sr.motivCard}>
              <div style={{ fontSize:18, marginBottom:8 }}>💫</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#00d4ff', lineHeight:1.6 }}>{routine.motivation}</div>
            </div>
          )}
          {routine.matin && <RoutineSection icon="🌅" titre={routine.matin.titre} heure={routine.matin.heure} etapes={routine.matin.etapes} accent="#00d4ff" />}
          {routine.nutrition && (
            <div style={{ ...sr.card, borderLeft:'3px solid rgba(0,255,136,0.5)' }}>
              <div style={sr.cardHeader}>
                <span style={{ fontSize:18 }}>🥗</span>
                <span style={sr.cardTitre}>{routine.nutrition.titre}</span>
              </div>
              {routine.nutrition.repas?.map((r,i) => (
                <div key={i} style={sr.repasRow}>
                  <span style={{ fontSize:16 }}>{r.emoji}</span>
                  <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13 }}><strong style={{ color:'rgba(255,255,255,0.9)' }}>{r.moment}</strong> — {r.suggestion}</div>
                </div>
              ))}
              {routine.nutrition.supplements?.length>0 && (
                <div style={sr.supplements}>💊 {routine.nutrition.supplements.join(' · ')}</div>
              )}
              {routine.nutrition.plantes?.map((p,i) => (
                <div key={i} style={sr.planteRow}>
                  <span>{p.emoji}</span>
                  <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13 }}><strong style={{ color:'rgba(255,255,255,0.85)' }}>{p.nom}</strong> — {p.usage} <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>({p.benefice})</span></div>
                </div>
              ))}
            </div>
          )}
          {routine.apresmidi && <RoutineSection icon="☀️" titre={routine.apresmidi.titre} heure={routine.apresmidi.heure} etapes={routine.apresmidi.etapes} accent="#00ff88" />}
          {routine.soir && <RoutineSection icon="🌙" titre={routine.soir.titre} heure={routine.soir.heure} etapes={routine.soir.etapes} accent="#bf5af2" />}
          {routine.astuce && (
            <div style={{ ...sr.card, borderLeft:'3px solid rgba(0,212,255,0.5)', background:'rgba(0,212,255,0.06)' }}>
              <div style={sr.cardHeader}>
                <span style={{ fontSize:18 }}>{routine.astuce.emoji}</span>
                <span style={sr.cardTitre}>{routine.astuce.titre}</span>
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.7 }}>{routine.astuce.conseil}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoutineSection({ icon, titre, heure, etapes, accent }) {
  return (
    <div style={{ ...sr.card, borderLeft:`3px solid ${accent}40` }}>
      <div style={sr.cardHeader}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <div>
          <div style={{ ...sr.cardTitre, color: accent }}>{titre}</div>
          {heure && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{heure}</div>}
        </div>
      </div>
      {etapes?.map((e,i) => (
        <div key={i} style={sr.etapeRow}>
          <span style={{ fontSize:18, minWidth:28 }}>{e.emoji}</span>
          <div>
            <div style={{ fontWeight:600, fontSize:13, color:'rgba(255,255,255,0.88)' }}>{e.action}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{e.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const sr = {
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, padding:'14px 0' },
  date: { fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'capitalize', letterSpacing:1 },
  titre: { fontSize:18, fontWeight:700, background:'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginTop:4 },
  btnGen: { background:'linear-gradient(135deg, #00d4ff, #0080ff)', color:'#000', border:'none', padding:'11px 18px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 18px rgba(0,212,255,0.45)', flexShrink:0 },
  empty: { background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:22, padding:44, textAlign:'center' },
  motivCard: { background:'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(191,90,242,0.08))', border:'1px solid rgba(0,212,255,0.2)', borderRadius:20, padding:22, textAlign:'center' },
  card: { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:18 },
  cardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:14 },
  cardTitre: { fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' },
  etapeRow: { display:'flex', gap:12, alignItems:'flex-start', padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.05)' },
  repasRow: { display:'flex', gap:10, alignItems:'center', padding:'6px 0' },
  planteRow: { display:'flex', gap:10, alignItems:'flex-start', padding:'6px 0', borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:4 },
  supplements: { fontSize:12, color:'#00ff88', background:'rgba(0,255,136,0.08)', borderRadius:8, padding:'6px 12px', marginTop:8, border:'1px solid rgba(0,255,136,0.15)' }
}

/* ─── Tenues ─── */
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
        {!imgSrc && !imgError && <div style={styles.tenueImgPlaceholder}>🔍 Recherche...</div>}
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
  const [ouvert, setOuvert]   = useState(false)
  const [ville, setVille]     = useState('')
  const [occasion, setOccasion] = useState('Casual')
  const [tenues, setTenues]   = useState([])
  const [meteo, setMeteo]     = useState('')
  const [loading, setLoading] = useState(false)
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
        👗 {ouvert ? 'Fermer' : 'Idées tenues du jour'}
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

/* ═══════════════════════════════════ STYLES ══ */
const styles = {
  app: { fontFamily:'Poppins, sans-serif', maxWidth:480, margin:'0 auto', minHeight:'100vh', background:'#000010', position:'relative', paddingBottom:85 },

  /* Header */
  header: { background:'rgba(0,0,16,0.75)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'18px 22px 14px', position:'sticky', top:0, zIndex:100 },
  headerTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  logo: { fontSize:26, fontWeight:900, background:'linear-gradient(135deg, #00d4ff 30%, #bf5af2 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'-0.5px' },
  subtitle: { fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:3, letterSpacing:'0.3px' },

  /* Stats */
  stats: { display:'flex', gap:8, flexWrap:'wrap' },
  stat: { background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:8, padding:'6px 12px', fontSize:11, color:'rgba(255,255,255,0.55)', flex:1, backdropFilter:'blur(10px)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },

  /* Content */
  content: { padding:'18px 22px 10px', position:'relative', zIndex:1 },

  /* Chat */
  chatBox: { minHeight:380, maxHeight:480, overflowY:'auto', marginBottom:14, padding:'4px 0' },
  userMsg: { display:'flex', justifyContent:'flex-end', marginBottom:12 },
  botMsg: { display:'flex', alignItems:'flex-start', marginBottom:12, gap:8 },
  userBubble: { background:'linear-gradient(135deg, #1a73e8, #0d47a1)', color:'white', padding:'11px 16px', borderRadius:'18px 18px 4px 18px', maxWidth:'76%', fontSize:14, lineHeight:1.5, boxShadow:'0 4px 18px rgba(26,115,232,0.4)' },
  botBubble: { background:'rgba(255,255,255,0.06)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,212,255,0.14)', color:'rgba(255,255,255,0.88)', padding:'12px 16px', borderRadius:'4px 18px 18px 18px', maxWidth:'80%', fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap', boxShadow:'0 4px 18px rgba(0,0,0,0.25)' },
  avatar: { fontSize:16, color:'#00d4ff', textShadow:'0 0 10px #00d4ff', marginTop:6, flexShrink:0 },

  /* Input */
  inputBox: { display:'flex', gap:10, background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', borderRadius:18, padding:'10px 10px 10px 18px', border:'1px solid rgba(0,212,255,0.18)', alignItems:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' },
  inputChat: { flex:1, border:'none', outline:'none', fontSize:14, fontFamily:'Poppins, sans-serif', background:'transparent', color:'white' },
  sendBtn: { background:'linear-gradient(135deg, #00d4ff, #0080ff)', border:'none', width:42, height:42, borderRadius:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 14px rgba(0,212,255,0.45)', animation:'pulseNeon 3s ease-in-out infinite' },

  /* Bottom Nav */
  bottomNav: { position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:'rgba(0,0,16,0.88)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', padding:'10px 0 18px', zIndex:200, boxShadow:'0 -8px 32px rgba(0,0,0,0.5)' },
  navItem: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 0', cursor:'pointer', border:'none', background:'transparent', color:'rgba(255,255,255,0.28)', fontFamily:'Poppins, sans-serif', transition:'all 0.2s' },
  navItemActive: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 0', cursor:'pointer', border:'none', background:'transparent', color:'#00d4ff', fontFamily:'Poppins, sans-serif', filter:'drop-shadow(0 0 8px rgba(0,212,255,0.9))', transition:'all 0.2s' },

  /* Buttons header */
  btnPro: { background:'linear-gradient(135deg, #ff6d00, #ff9800)', color:'white', border:'none', padding:'8px 14px', borderRadius:10, cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', fontWeight:700, boxShadow:'0 4px 14px rgba(255,109,0,0.45)' },
  proBadge: { background:'rgba(191,90,242,0.14)', color:'#bf5af2', border:'1px solid rgba(191,90,242,0.35)', padding:'6px 12px', borderRadius:9, fontSize:11, fontWeight:700 },
  btnEdit: { background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)', width:36, height:36, borderRadius:9, cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' },

  /* Form */
  formBox: { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:26, boxShadow:'0 24px 64px rgba(0,0,0,0.4)' },
  formTitle: { color:'#00d4ff', marginBottom:22, fontSize:18, fontWeight:700, textShadow:'0 0 20px rgba(0,212,255,0.4)' },
  field: { marginBottom:20 },
  row: { display:'flex', gap:10, marginBottom:20 },
  label: { display:'block', marginBottom:7, fontWeight:600, color:'rgba(255,255,255,0.38)', fontSize:10, letterSpacing:'1.2px', textTransform:'uppercase' },
  inputField: { flex:1, width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', fontSize:13, fontFamily:'Poppins, sans-serif', boxSizing:'border-box', outline:'none', color:'white', backdropFilter:'blur(10px)' },
  chips: { display:'flex', flexWrap:'wrap', gap:7 },
  chip: { padding:'7px 14px', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', color:'rgba(255,255,255,0.5)' },
  chipBlue: { padding:'7px 14px', borderRadius:20, border:'1px solid rgba(0,212,255,0.45)', background:'rgba(0,212,255,0.1)', cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', color:'#00d4ff', fontWeight:700, boxShadow:'0 0 10px rgba(0,212,255,0.2)' },
  chipOrange: { padding:'7px 14px', borderRadius:20, border:'1px solid rgba(255,152,0,0.45)', background:'rgba(255,152,0,0.1)', cursor:'pointer', fontSize:12, fontFamily:'Poppins, sans-serif', color:'#ffb74d', fontWeight:700, boxShadow:'0 0 10px rgba(255,152,0,0.2)' },
  aiBar: { background:'rgba(0,212,255,0.05)', border:'1px dashed rgba(0,212,255,0.25)', borderRadius:14, padding:16, marginTop:12, marginBottom:6 },
  aiBarTitle: { fontWeight:700, color:'#00d4ff', marginBottom:5, fontSize:12, letterSpacing:'0.3px' },
  aiBarHint: { fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:10, fontStyle:'italic' },
  aiBarRow: { display:'flex', gap:8 },
  aiInput: { flex:1, padding:'9px 14px', borderRadius:10, border:'1px solid rgba(0,212,255,0.2)', background:'rgba(255,255,255,0.05)', fontSize:13, fontFamily:'Poppins, sans-serif', outline:'none', color:'white' },
  aiBtn: { background:'linear-gradient(135deg, #00d4ff, #0080ff)', color:'#000', border:'none', padding:'9px 16px', borderRadius:10, fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 0 12px rgba(0,212,255,0.4)' },
  aiResultat: { marginTop:10, fontSize:12, color:'#00ff88', background:'rgba(0,255,136,0.07)', padding:'8px 12px', borderRadius:9, border:'1px solid rgba(0,255,136,0.2)' },
  profileSaved: { fontSize:12, color:'#00ff88', marginTop:8, fontWeight:600 },
  navBtns: { display:'flex', justifyContent:'space-between', marginTop:26, gap:12 },
  btnBack: { padding:'13px 20px', borderRadius:13, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins, sans-serif', color:'rgba(255,255,255,0.5)' },
  btnNext: { flex:1, padding:'13px 22px', background:'linear-gradient(135deg, #00d4ff, #0080ff)', color:'#000', border:'none', borderRadius:13, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 4px 20px rgba(0,212,255,0.45)' },
  btnSave: { flex:1, padding:'13px 22px', background:'linear-gradient(135deg, #bf5af2, #6e2da0)', color:'white', border:'none', borderRadius:13, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 4px 20px rgba(191,90,242,0.45)' },
  btnAnnuler: { padding:'13px 20px', borderRadius:13, border:'1px solid rgba(255,82,82,0.3)', background:'rgba(255,82,82,0.07)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins, sans-serif', color:'#ff5252' },
  hint: { fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:400 },

  /* Tenues */
  tenuesBox: { marginBottom:16 },
  tenuesBtn: { width:'100%', padding:'13px', background:'rgba(191,90,242,0.1)', color:'#bf5af2', border:'1px solid rgba(191,90,242,0.3)', borderRadius:14, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Poppins, sans-serif', backdropFilter:'blur(10px)', boxShadow:'0 4px 18px rgba(191,90,242,0.15)' },
  tenuesPanel: { background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'0 0 18px 18px', padding:16 },
  meteoBar: { background:'rgba(0,212,255,0.07)', borderRadius:10, padding:'9px 14px', fontSize:12, marginBottom:12, color:'#00d4ff', fontWeight:500, border:'1px solid rgba(0,212,255,0.18)' },
  tenuesRow: { display:'flex', gap:8, marginBottom:12 },
  villeInput: { flex:1, padding:'10px 14px', borderRadius:11, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', fontSize:13, fontFamily:'Poppins, sans-serif', outline:'none', color:'white' },
  selectOccasion: { padding:'10px 12px', borderRadius:11, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,16,0.8)', fontSize:13, fontFamily:'Poppins, sans-serif', outline:'none', color:'white' },
  btnGetTenues: { padding:'10px 18px', background:'linear-gradient(135deg, #bf5af2, #6e2da0)', color:'white', border:'none', borderRadius:11, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 4px 14px rgba(191,90,242,0.4)' },
  tenuesGrid: { display:'flex', gap:14, flexWrap:'wrap', marginTop:12 },
  tenueCard: { flex:'1 1 180px', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(191,90,242,0.2)', borderRadius:18, overflow:'hidden' },
  tenueImgBox: { width:'100%', height:230, background:'rgba(191,90,242,0.06)', position:'relative' },
  tenueImgPlaceholder: { width:'100%', height:230, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(191,90,242,0.6)', fontSize:13, textAlign:'center', padding:10, boxSizing:'border-box' },
  tenueImg: { width:'100%', height:230, objectFit:'cover', display:'block' },
  tenueInfo: { padding:14 },
  tenueTitre: { fontWeight:700, color:'#bf5af2', fontSize:13, marginBottom:7 },
  tenueDesc: { fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.65, marginBottom:7 },
  tenuePourquoi: { fontSize:11, color:'rgba(255,255,255,0.28)', fontStyle:'italic' }
}
