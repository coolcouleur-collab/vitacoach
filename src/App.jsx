import React, { useState, useRef, useEffect } from 'react'
import Auth from './Auth'


const alimentaireOptions = [
  'Vegan', 'Végétarien', 'Flexitarien', 'Omnivore', 'Carnivore',
  'Keto', 'Sans gluten', 'Sans lactose', 'Méditerranéen', 'Jeûne intermittent',
  'Halal', 'Casher', 'Paléo', 'Low carb'
]

const styleOptions = [
  'Casual', 'Sportif', 'Élégant', 'Business', 'Streetwear', 'Minimaliste',
  'Bohème', 'Vintage', 'Luxe', 'Athleisure', 'Preppy', 'Rock', 'Chic décontracté', 'Tropical'
]

const objectifsOptions = [
  'Perdre du poids', 'Prendre du muscle', 'Mieux dormir', "Plus d'énergie",
  'Réduire le stress', 'Manger sainement', 'Améliorer ma peau', 'Courir un marathon',
  'Réduire l\'alcool', 'Arrêter de fumer'
]

const carencesOptions = [
  'Calcium', 'Vitamine D', 'Fer', 'Magnésium', 'Vitamine B12',
  'Zinc', 'Oméga-3', 'Vitamine C', 'Potassium', 'Aucune connue'
]

const maladiesOptions = [
  'Diabète', 'Hypertension', 'Hypothyroïdie', 'Hyperthyroïdie', 'Asthme',
  'Cholestérol élevé', 'Dépression / Anxiété', 'Endométriose', 'SOPK',
  'Maladie cœliaque', 'Crohn / MICI', 'Arthrite', 'Aucune'
]

function Chips({ options, selected, onToggle, color = 'blue' }) {
  return (
    <div style={styles.chips}>
      {options.map(o => {
        const isSelected = selected.includes(o)
        const bg = isSelected ? (color === 'orange' ? styles.chipOrange : styles.chipBlue) : styles.chip
        return (
          <button key={o} style={bg} onClick={() => onToggle(o)}>{o}</button>
        )
      })}
    </div>
  )
}

function AIBar({ section, selections, onAnalyse, placeholder }) {
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState('')

  async function analyser() {
    if (!texte.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/analyser-profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, selections, texteLibre: texte })
      })
      const data = await res.json()
      setResultat(data.resume)
      onAnalyse(data.details)
    } catch {
      setResultat('Erreur lors de l\'analyse.')
    }
    setLoading(false)
  }

  if (selections.length === 0) return null

  return (
    <div style={styles.aiBar}>
      <div style={styles.aiBarTitle}>🤖 Dis-m'en plus — je vais personnaliser ton profil</div>
      <div style={styles.aiBarHint}>{placeholder}</div>
      <div style={styles.aiBarRow}>
        <input
          style={styles.aiInput}
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyser()}
          placeholder="Écris librement, je comprends tout..."
        />
        <button style={styles.aiBtn} onClick={analyser} disabled={loading}>
          {loading ? '⏳' : 'Analyser →'}
        </button>
      </div>
      {resultat && <div style={styles.aiResultat}>✅ {resultat}</div>}
    </div>
  )
}

const defaultForm = {
  nom: '', age: '', taille: '', poids: '',
  objectifs: [],
  regimes: [], alimentaireDetails: '',
  styles: [], styleDetails: '', mensurations: '',
  carences: [], santeDetails: '',
  maladies: [], maladiesDetails: ''
}

export default function App() {
  const safeParse = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  }

  const FREE_LIMIT = 5

  const getMsgCount = () => {
    const today = new Date().toDateString()
    const saved = safeParse('vitacoach_msg_count', { date: today, count: 0 })
    if (saved.date !== today) return 0
    return saved.count
  }

  const incrementMsgCount = () => {
    const today = new Date().toDateString()
    const count = getMsgCount() + 1
    localStorage.setItem('vitacoach_msg_count', JSON.stringify({ date: today, count }))
  }

  const [user, setUser] = useState(() => safeParse('vitacoach_user', null))
  const [isPro, setIsPro] = useState(() => safeParse('vitacoach_pro', false))
  const [profil, setProfil] = useState(() => safeParse('vitacoach_profil', null))
  const [etape, setEtape] = useState(() => {
    const saved = localStorage.getItem('vitacoach_etape')
    return saved ? parseInt(saved) : 1
  })
  const [messages, setMessages] = useState(() => {
    const p = safeParse('vitacoach_profil', null)
    const h = safeParse('vitacoach_historique', null)
    if (p && h) return h
    if (p) return [{ role: 'assistant', content: `🌟 Bon retour ${p.nom} ! Comment puis-je t'aider aujourd'hui ?` }]
    return []
  })
  const [form, setForm] = useState(() => safeParse('vitacoach_form', defaultForm))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (profil && messages.length > 0) {
      localStorage.setItem('vitacoach_historique', JSON.stringify(messages.slice(-50)))
    }
  }, [messages, profil])

  useEffect(() => {
    if (profil) return
    localStorage.setItem('vitacoach_form', JSON.stringify(form))
    localStorage.setItem('vitacoach_etape', etape.toString())
  }, [form, etape, profil])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true') {
      setIsPro(true)
      localStorage.setItem('vitacoach_pro', JSON.stringify(true))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  function toggle(key, val) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
    }))
  }

  function sauvegarderProfil() {
    if (!form.nom || !form.age) return alert('Remplis au moins ton prénom et ton âge !')
    localStorage.setItem('vitacoach_profil', JSON.stringify(form))
    localStorage.removeItem('vitacoach_form')
    localStorage.removeItem('vitacoach_etape')
    setProfil(form)
    setMessages([{ role: 'assistant', content: `🌟 Bonjour ${form.nom} ! Ton profil est créé. Je te connais maintenant parfaitement. Comment puis-je t'aider aujourd'hui ?` }])
  }

  async function passerPro() {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, email: user?.email })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Erreur: ' + (data.erreur || 'inconnue'))
    } catch (e) {
      alert('Erreur: ' + e.message)
    }
  }

  async function envoyerMessage() {
    if (!input.trim()) return
    if (!isPro && getMsgCount() >= FREE_LIMIT) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Tu as utilisé tes ${FREE_LIMIT} messages gratuits aujourd'hui. Passe à **Oravi Pro** pour des conseils illimités ! 🚀`
      }])
      return
    }
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    if (!isPro) incrementMsgCount()
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, profil, historique: messages.slice(-10) })
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue.' }])
    }
    setLoading(false)
  }

  // ─── AUTH ───
  if (!user) return <Auth onConnecte={(u) => { setUser(u); localStorage.setItem('vitacoach_user', JSON.stringify(u)) }} />

  // ─── FORMULAIRE ───
  if (!profil) {
    const etapes = [
      { num: 1, label: '👤 Identité' },
      { num: 2, label: '🍽️ Alimentation' },
      { num: 3, label: '👗 Style' },
      { num: 4, label: '❤️ Santé' },
    ]

    return (
      <div style={styles.app}>
        <div style={styles.header}>
          <div style={styles.logo}>✨ Oravi</div>
          <div style={styles.subtitle}>Crée ton profil personnalisé</div>
        </div>

        {/* Barre de progression */}
        <div style={styles.progress}>
          {etapes.map(e => (
            <div key={e.num} style={etape === e.num ? styles.stepActive : etape > e.num ? styles.stepDone : styles.step}>
              {etape > e.num ? '✓' : e.label}
            </div>
          ))}
        </div>

        <div style={styles.formBox}>

          {/* ÉTAPE 1 — Identité */}
          {etape === 1 && <>
            <h2 style={styles.formTitle}>👤 Qui es-tu ?</h2>
            <div style={styles.field}>
              <label style={styles.label}>Prénom *</label>
              <input style={styles.inputField} placeholder="Ton prénom" value={form.nom}
                maxLength={30}
                onChange={e => {
                  const v = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '')
                  setForm({ ...form, nom: v })
                }} />
            </div>
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Âge * <span style={styles.hint}>(1–120)</span></label>
                <input style={styles.inputField} type="number" placeholder="Ex: 28" value={form.age}
                  min={1} max={120}
                  onChange={e => {
                    const v = Math.min(120, Math.max(1, parseInt(e.target.value) || ''))
                    setForm({ ...form, age: v || '' })
                  }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Taille (cm) <span style={styles.hint}>(50–250)</span></label>
                <input style={styles.inputField} type="number" placeholder="Ex: 170" value={form.taille}
                  min={50} max={250}
                  onChange={e => {
                    const v = Math.min(250, Math.max(50, parseInt(e.target.value) || ''))
                    setForm({ ...form, taille: v || '' })
                  }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Poids (kg) <span style={styles.hint}>(20–300)</span></label>
                <input style={styles.inputField} type="number" placeholder="Ex: 65" value={form.poids}
                  min={20} max={300}
                  onChange={e => setForm({ ...form, poids: e.target.value })} />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tes objectifs</label>
              <Chips options={objectifsOptions} selected={form.objectifs} onToggle={v => toggle('objectifs', v)} />
            </div>
          </>}

          {/* ÉTAPE 2 — Alimentation */}
          {etape === 2 && <>
            <h2 style={styles.formTitle}>🍽️ Tes habitudes alimentaires</h2>
            <div style={styles.field}>
              <label style={styles.label}>Sélectionne tout ce qui te correspond (plusieurs choix possibles)</label>
              <Chips options={alimentaireOptions} selected={form.regimes} onToggle={v => toggle('regimes', v)} />
            </div>
            <AIBar
              section="alimentation"
              selections={form.regimes}
              placeholder="Ex: Je suis vegan 5j/7 mais je mange du poisson le weekend, depuis 2 ans. Je ne mange jamais de porc. J'adore les légumineuses..."
              onAnalyse={details => setForm(f => ({ ...f, alimentaireDetails: details }))}
            />
            {form.alimentaireDetails && <div style={styles.profileSaved}>✅ Profil alimentaire enrichi par l'IA</div>}
          </>}

          {/* ÉTAPE 3 — Style */}
          {etape === 3 && <>
            <h2 style={styles.formTitle}>👗 Ton style vestimentaire</h2>
            <div style={styles.field}>
              <label style={styles.label}>Tes styles (plusieurs choix)</label>
              <Chips options={styleOptions} selected={form.styles} onToggle={v => toggle('styles', v)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Mensurations (pour des conseils précis)</label>
              <div style={styles.row}>
                <input style={styles.inputField} placeholder="Tour de poitrine (cm)" onChange={e => setForm(f => ({ ...f, mensurations: f.mensurations + ' poitrine:' + e.target.value }))} />
                <input style={styles.inputField} placeholder="Tour de taille (cm)" onChange={e => setForm(f => ({ ...f, mensurations: f.mensurations + ' taille:' + e.target.value }))} />
                <input style={styles.inputField} placeholder="Tour de hanches (cm)" onChange={e => setForm(f => ({ ...f, mensurations: f.mensurations + ' hanches:' + e.target.value }))} />
              </div>
            </div>
            <AIBar
              section="style"
              selections={form.styles}
              placeholder="Ex: J'aime le streetwear mais au bureau je dois être en business. J'évite le rouge. Mes marques préférées sont... Je cherche plutôt des tenues accessibles..."
              onAnalyse={details => setForm(f => ({ ...f, styleDetails: details }))}
            />
            {form.styleDetails && <div style={styles.profileSaved}>✅ Profil style enrichi par l'IA</div>}
          </>}

          {/* ÉTAPE 4 — Santé */}
          {etape === 4 && <>
            <h2 style={styles.formTitle}>❤️ Ta santé</h2>
            <div style={styles.field}>
              <label style={styles.label}>Carences connues</label>
              <Chips options={carencesOptions} selected={form.carences} onToggle={v => toggle('carences', v)} color="orange" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Maladies / Pathologies</label>
              <Chips options={maladiesOptions} selected={form.maladies} onToggle={v => toggle('maladies', v)} color="orange" />
            </div>
            <AIBar
              section="sante"
              selections={[...form.carences, ...form.maladies]}
              placeholder="Ex: Diabète type 2 depuis 3 ans, je prends de la metformine. Ma carence en fer est confirmée par prise de sang. J'ai du mal à dormir à cause de l'anxiété..."
              onAnalyse={details => setForm(f => ({ ...f, santeDetails: details }))}
            />
            {form.santeDetails && <div style={styles.profileSaved}>✅ Profil santé enrichi par l'IA</div>}
          </>}

          {/* Navigation */}
          <div style={styles.navBtns}>
            {etape > 1 && (
              <button style={styles.btnBack} onClick={() => setEtape(e => e - 1)}>← Retour</button>
            )}
            {etape < 4 ? (
              <button style={styles.btnNext} onClick={() => {
                if (etape === 1 && (!form.nom || !form.age)) return alert('Prénom et âge obligatoires !')
                setEtape(e => e + 1)
              }}>Suivant →</button>
            ) : (
              <button style={styles.btnSave} onClick={sauvegarderProfil}>
                🚀 Lancer Oravi !
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── CHAT ───
  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.logo}>✨ Oravi</div>
            <div style={styles.subtitle}>Bonjour {profil.nom} 👋</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isPro && (
              <button style={{ ...styles.btnProfil, background: 'linear-gradient(135deg, #ff6d00, #ff9800)', color: 'white', border: 'none' }} onClick={passerPro}>
                ⭐ Pro 4.99€/mois
              </button>
            )}
            {isPro && <div style={{ ...styles.stat, background: '#e8f5e9', borderColor: '#43a047' }}>✅ Pro</div>}
            <button style={styles.btnProfil} onClick={() => { setProfil(null); localStorage.removeItem('vitacoach_profil') }}>
              ✏️ Modifier profil
            </button>
          </div>
        </div>
      </div>

      <div style={styles.stats}>
        {profil.regimes?.length > 0 && <div style={styles.stat}>🍽️ {profil.regimes.slice(0, 2).join(' + ')}</div>}
        {profil.objectifs?.length > 0 && <div style={styles.stat}>🎯 {profil.objectifs[0]}</div>}
        {profil.carences?.length > 0 && !profil.carences.includes('Aucune connue') && <div style={{ ...styles.stat, borderColor: '#ff6d00' }}>⚠️ {profil.carences[0]}</div>}
        {profil.maladies?.length > 0 && !profil.maladies.includes('Aucune') && <div style={{ ...styles.stat, borderColor: '#e53935' }}>❤️ {profil.maladies[0]}</div>}
      </div>

      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userMsg : styles.botMsg}>
            {msg.role === 'assistant' && <span style={styles.avatar}>✨</span>}
            <div style={msg.role === 'user' ? styles.userBubble : styles.botBubble}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={styles.botMsg}>
            <span style={styles.avatar}>✨</span>
            <div style={styles.botBubble}>⏳ Oravi réfléchit...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <TenuesModule profil={profil} />

      <div style={styles.inputBox}>
        <input style={styles.inputChat} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && envoyerMessage()}
          placeholder="Pose une question à Oravi..." />
        <button style={styles.button} onClick={envoyerMessage}>Envoyer →</button>
      </div>
    </div>
  )
}

function TenueCard({ tenue }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const query = tenue.imagePrompt || tenue.description || tenue.titre
    fetch(`/api/image?prompt=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => { if (data.url) setImgSrc(data.url); else setImgError(true) })
      .catch(() => setImgError(true))
  }, [])

  return (
    <div style={styles.tenueCard}>
      <div style={styles.tenueImgBox}>
        {!imgSrc && !imgError && (
          <div style={styles.tenueImgPlaceholder}>🔍 Recherche photo...</div>
        )}
        {imgError && (
          <div style={styles.tenueImgPlaceholder}>👗 {tenue.titre}</div>
        )}
        {imgSrc && (
          <img src={imgSrc} alt={tenue.titre} style={styles.tenueImg} onError={() => setImgError(true)} />
        )}
      </div>
      <div style={styles.tenueInfo}>
        <div style={styles.tenueTitre}>✨ {tenue.titre}</div>
        <div style={styles.tenueDesc}>{tenue.description}</div>
        <div style={styles.tenuePourquoi}>💡 {tenue.pourquoi}</div>
      </div>
    </div>
  )
}

function TenuesModule({ profil }) {
  const [ouvert, setOuvert] = useState(false)
  const [ville, setVille] = useState('')
  const [occasion, setOccasion] = useState('Casual')
  const [tenues, setTenues] = useState([])
  const [meteo, setMeteo] = useState('')
  const [loading, setLoading] = useState(false)

  const occasions = ['Travail', 'Casual', 'Soirée', 'Sport', 'Rendez-vous', 'Voyage']

  async function getTenues() {
    if (!ville.trim()) return alert('Entre ta ville !')
    setLoading(true)
    setTenues([])
    try {
      const res = await fetch('/api/tenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profil, ville, occasion })
      })
      const data = await res.json()
      setTenues(data.tenues || [])
      setMeteo(data.meteo)
    } catch {
      setTenues([])
    }
    setLoading(false)
  }

  function imageUrl(prompt, index) {
    const seed = (ville + occasion + index).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return `https://image.pollinations.ai/prompt/${encodeURIComponent('fashion outfit photography, ' + prompt)}?width=400&height=500&seed=${seed}&nologo=true`
  }

  return (
    <div style={styles.tenuesBox}>
      <button style={styles.tenuesBtn} onClick={() => setOuvert(!ouvert)}>
        👗 {ouvert ? 'Fermer les tenues' : 'Idées tenues du jour'}
      </button>

      {ouvert && (
        <div style={styles.tenuesPanel}>
          {meteo && <div style={styles.meteoBar}>🌤️ {meteo}</div>}
          <div style={styles.tenuesRow}>
            <input style={styles.villeInput} placeholder="Ta ville (ex: Paris)" value={ville}
              onChange={e => setVille(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && getTenues()} />
            <select style={styles.selectOccasion} value={occasion} onChange={e => setOccasion(e.target.value)}>
              {occasions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button style={styles.btnGetTenues} onClick={getTenues} disabled={loading}>
              {loading ? '⏳ Génération...' : '✨ Générer'}
            </button>
          </div>

          {tenues.length > 0 && (
            <div style={styles.tenuesGrid}>
              {tenues.map((t, i) => (
                <TenueCard key={i} tenue={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  app: { fontFamily: 'Poppins, sans-serif', maxWidth: 820, margin: '0 auto', padding: 20, backgroundColor: '#f4f6fb', minHeight: '100vh' },
  header: { background: 'linear-gradient(135deg, #1565c0 0%, #1a73e8 50%, #1e88e5 100%)', color: 'white', padding: '24px 32px', borderRadius: 20, marginBottom: 16, boxShadow: '0 8px 32px rgba(26,115,232,0.28)' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.18)' },
  subtitle: { fontSize: 14, opacity: 0.85, marginTop: 2, fontWeight: 400 },
  progress: { display: 'flex', gap: 8, marginBottom: 16 },
  step: { flex: 1, padding: '10px 6px', textAlign: 'center', background: 'white', borderRadius: 12, fontSize: 12, color: '#999', border: '2px solid #e8eaf0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  stepActive: { flex: 1, padding: '10px 6px', textAlign: 'center', background: '#e8f0fe', borderRadius: 12, fontSize: 12, color: '#1a73e8', border: '2px solid #1a73e8', fontWeight: 700, boxShadow: '0 2px 8px rgba(26,115,232,0.15)' },
  stepDone: { flex: 1, padding: '10px 6px', textAlign: 'center', background: '#e8f5e9', borderRadius: 12, fontSize: 12, color: '#2e7d32', border: '2px solid #4caf50', fontWeight: 700, boxShadow: '0 2px 8px rgba(76,175,80,0.12)' },
  stats: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  stat: { background: 'white', border: '1.5px solid #e8f5e9', borderRadius: 14, padding: '10px 16px', fontSize: 13, color: '#333', flex: 1, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  chatBox: { background: 'white', borderRadius: 20, padding: 24, minHeight: 400, maxHeight: 500, overflowY: 'auto', marginBottom: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.09)' },
  userMsg: { display: 'flex', justifyContent: 'flex-end', marginBottom: 14 },
  botMsg: { display: 'flex', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  userBubble: { background: 'linear-gradient(135deg, #1a73e8, #1565c0)', color: 'white', padding: '12px 18px', borderRadius: '20px 20px 4px 20px', maxWidth: '70%', fontSize: 14, boxShadow: '0 3px 12px rgba(26,115,232,0.25)', lineHeight: 1.5 },
  botBubble: { background: '#f0f4ff', color: '#2c2c3e', padding: '12px 18px', borderRadius: '4px 20px 20px 20px', maxWidth: '75%', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #e4eaf8' },
  avatar: { fontSize: 24, marginTop: 4 },
  inputBox: { display: 'flex', gap: 10 },
  inputChat: { flex: 1, padding: '14px 20px', borderRadius: 14, border: '2px solid #c5d8fb', fontSize: 14, outline: 'none', fontFamily: 'Poppins, sans-serif', background: 'white', boxShadow: '0 2px 8px rgba(26,115,232,0.08)', transition: 'border-color 0.2s' },
  button: { background: 'linear-gradient(135deg, #ff6d00, #ff9800)', color: 'white', border: 'none', padding: '14px 26px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,109,0,0.3)', letterSpacing: '0.3px' },
  formBox: { background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.09)' },
  formTitle: { color: '#1a73e8', marginBottom: 24, fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' },
  field: { marginBottom: 22 },
  row: { display: 'flex', gap: 12, marginBottom: 22 },
  label: { display: 'block', marginBottom: 8, fontWeight: 600, color: '#2c2c3e', fontSize: 14 },
  inputField: { flex: 1, width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e4eaf8', fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box', outline: 'none', background: '#fafbff', transition: 'border-color 0.2s' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '8px 16px', borderRadius: 20, border: '2px solid #e4eaf8', background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  chipBlue: { padding: '8px 16px', borderRadius: 20, border: '2px solid #1a73e8', background: '#e8f0fe', cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif', color: '#1a73e8', fontWeight: 700, boxShadow: '0 2px 8px rgba(26,115,232,0.15)' },
  chipOrange: { padding: '8px 16px', borderRadius: 20, border: '2px solid #ff6d00', background: '#fff3e0', cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif', color: '#e65100', fontWeight: 700, boxShadow: '0 2px 8px rgba(255,109,0,0.15)' },
  aiBar: { background: '#f0f4ff', border: '2px dashed #90b4f5', borderRadius: 16, padding: 18, marginTop: 16, marginBottom: 8 },
  aiBarTitle: { fontWeight: 700, color: '#1a73e8', marginBottom: 6, fontSize: 14, letterSpacing: '0.2px' },
  aiBarHint: { fontSize: 12, color: '#8a94a6', marginBottom: 10, fontStyle: 'italic' },
  aiBarRow: { display: 'flex', gap: 10 },
  aiInput: { flex: 1, padding: '10px 14px', borderRadius: 12, border: '2px solid #c5d8fb', fontSize: 13, fontFamily: 'Poppins, sans-serif', outline: 'none', background: 'white' },
  aiBtn: { background: 'linear-gradient(135deg, #1a73e8, #1565c0)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 3px 10px rgba(26,115,232,0.25)' },
  aiResultat: { marginTop: 10, fontSize: 13, color: '#2e7d32', background: '#e8f5e9', padding: '10px 14px', borderRadius: 10, border: '1px solid #c8e6c9' },
  profileSaved: { fontSize: 13, color: '#2e7d32', marginTop: 8, fontWeight: 600 },
  navBtns: { display: 'flex', justifyContent: 'space-between', marginTop: 30, gap: 12 },
  btnBack: { padding: '14px 24px', borderRadius: 14, border: '2px solid #e4eaf8', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', color: '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  btnNext: { flex: 1, padding: '14px 24px', background: 'linear-gradient(135deg, #1a73e8, #1565c0)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', letterSpacing: '0.3px' },
  btnSave: { flex: 1, padding: '14px 24px', background: 'linear-gradient(135deg, #43a047, #1b5e20)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 16px rgba(67,160,71,0.3)', letterSpacing: '0.3px' },
  btnProfil: { background: 'rgba(255,255,255,0.18)', color: 'white', border: '1.5px solid rgba(255,255,255,0.45)', padding: '9px 16px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif', backdropFilter: 'blur(4px)', fontWeight: 600 },
  hint: { fontSize: 11, color: '#a0a8b8', fontWeight: 400 },
  tenuesBox: { marginBottom: 16 },
  tenuesBtn: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #6a1b9a, #ab47bc)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 16px rgba(106,27,154,0.28)', letterSpacing: '0.3px' },
  tenuesPanel: { background: 'white', borderRadius: '0 0 14px 14px', padding: 18, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
  meteoBar: { background: '#e8f0fe', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12, color: '#1a73e8', fontWeight: 500, border: '1px solid #c5d8fb' },
  tenuesRow: { display: 'flex', gap: 8, marginBottom: 12 },
  villeInput: { flex: 1, padding: '10px 14px', borderRadius: 12, border: '2px solid #e4eaf8', fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none', background: '#fafbff' },
  selectOccasion: { padding: '10px 14px', borderRadius: 12, border: '2px solid #e4eaf8', fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none', background: 'white' },
  btnGetTenues: { padding: '10px 20px', background: 'linear-gradient(135deg, #6a1b9a, #ab47bc)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 3px 12px rgba(106,27,154,0.25)' },
  tenuesGrid: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 },
  tenueCard: { flex: '1 1 220px', background: '#faf5ff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 6px 20px rgba(106,27,154,0.14)', border: '1px solid #ede0f5' },
  tenueImgBox: { width: '100%', height: 260, background: '#ede7f6', position: 'relative' },
  tenueImgPlaceholder: { width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9c27b0', fontSize: 13, textAlign: 'center', padding: 10, boxSizing: 'border-box' },
  tenueImg: { width: '100%', height: 260, objectFit: 'cover', display: 'block' },
  tenueInfo: { padding: 16 },
  tenueTitre: { fontWeight: 700, color: '#6a1b9a', fontSize: 15, marginBottom: 8, letterSpacing: '-0.2px' },
  tenueDesc: { fontSize: 13, color: '#444', lineHeight: 1.65, marginBottom: 8 },
  tenuePourquoi: { fontSize: 12, color: '#8a94a6', fontStyle: 'italic' }
}
