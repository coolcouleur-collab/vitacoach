import React, { useState } from 'react'

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id:'plantes', icon:'🌿', label:'Plantes médicinales' },
  { id:'tisanes', icon:'☕', label:'Tisanes & infusions' },
  { id:'chinoise', icon:'🐉', label:'Médecine chinoise' },
  { id:'holistique', icon:'🧘', label:'Techniques holistiques' },
]

const STATIC_DATA = {
  plantes: [
    { nom:'Ashwagandha', emoji:'🌱', couleur:'#34c759', tag:'Adaptogène', benefice:'Réduit le stress et le cortisol', usage:'250–500 mg/jour le matin', detail:'Plante ayurvédique considérée comme le roi des adaptogènes. Améliore l\'endurance, réduit l\'anxiété et booste la testostérone.' },
    { nom:'Curcuma', emoji:'🟡', couleur:'#ff9500', tag:'Anti-inflammatoire', benefice:'Puissant anti-inflammatoire naturel', usage:'1 c.à.c avec poivre noir et huile', detail:'La curcumine, son principe actif, est 1000× plus biodisponible avec de la pipérine (poivre noir). Excellent pour les articulations et le foie.' },
    { nom:'Gingembre', emoji:'🫚', couleur:'#ff6b35', tag:'Digestif', benefice:'Stimule la digestion et l\'immunité', usage:'Frais ou en tisane, 2–3 g/jour', detail:'Anti-nausée prouvé, stimule la circulation sanguine, réduit les douleurs musculaires. Idéal après le sport.' },
    { nom:'Rhodiola', emoji:'🏔️', couleur:'#af52de', tag:'Énergie', benefice:'Combat la fatigue physique et mentale', usage:'200–400 mg le matin', detail:'Plante des régions arctiques utilisée par les olympiades soviétiques. Améliore les performances cognitives et la résistance au stress.' },
    { nom:'Valériane', emoji:'😴', couleur:'#5856d6', tag:'Sommeil', benefice:'Améliore la qualité du sommeil', usage:'300–600 mg, 1h avant le coucher', detail:'Augmente le GABA naturellement, induisant un sommeil profond sans accoutumance. Résultats visibles après 2–4 semaines.' },
    { nom:'Ginkgo Biloba', emoji:'🧠', couleur:'#30b0c7', tag:'Mémoire', benefice:'Booste la circulation cérébrale', usage:'120–240 mg/jour', detail:'Améliore la mémoire, la concentration et la circulation sanguine cérébrale. Un des suppléments les plus étudiés au monde.' },
    { nom:'Chardon-marie', emoji:'🫀', couleur:'#34c759', tag:'Foie', benefice:'Détox et régénération du foie', usage:'140 mg de sylymarine, 3×/jour', detail:'La silymarine protège et régénère les cellules hépatiques. Indispensable après une période de stress, alcool ou médicaments.' },
    { nom:'Ortie', emoji:'🌱', couleur:'#30d158', tag:'Minéraux', benefice:'Reminéralisant et anti-fatigue', usage:'Tisane ou gélules, cure de 3 semaines', detail:'Riche en fer, magnésium, vitamines K et C. Combat l\'anémie et les carences. Excellent dépuratif printanier.' },
  ],
  tisanes: [
    { nom:'Camomille', emoji:'🌼', couleur:'#fbbf24', tag:'Apaisante', benefice:'Calme l\'anxiété et aide au sommeil', usage:'1 tasse le soir, 10 min d\'infusion', detail:'L\'apigénine se lie aux récepteurs GABA. Réduit l\'inflammation intestinale, apaise les coliques et les migraines.' },
    { nom:'Menthe poivrée', emoji:'🌿', couleur:'#34c759', tag:'Digestive', benefice:'Soulage les troubles digestifs', usage:'Après les repas, 1–2 tasses/jour', detail:'Le menthol relâche les muscles lisses intestinaux. Efficace contre le syndrome de l\'intestin irritable et les nausées.' },
    { nom:'Hibiscus', emoji:'🌺', couleur:'#ff2d55', tag:'Cardio', benefice:'Réduit la tension artérielle', usage:'Froid ou chaud, 2–3 tasses/jour', detail:'Les anthocyanes réduisent la tension systolique de 7 points. Riche en vitamine C, antioxydants. Goût acidulé naturellement sans sucre.' },
    { nom:'Rooibos', emoji:'🫖', couleur:'#ff9500', tag:'Antioxydant', benefice:'0% théine, riche en antioxydants', usage:'Toute la journée, sans restriction', detail:'Naturellement sans caféine, idéal le soir. Contient de l\'aspalathin, unique à cette plante, qui régule la glycémie.' },
    { nom:'Tilleul', emoji:'🌳', couleur:'#30d158', tag:'Stress', benefice:'Soulage le stress et la nervosité', usage:'1–2 tasses en fin de journée', detail:'Flarbonoïdes sédatifs légers. Utilisé depuis le Moyen-Âge pour l\'anxiété, les maux de tête et les tensions musculaires.' },
    { nom:'Gingembre-citron', emoji:'🍋', couleur:'#ffd60a', tag:'Immunité', benefice:'Booste les défenses immunitaires', usage:'Matin à jeun, avec miel de Manuka', detail:'Combinaison synergique : gingerols + vitamine C + enzymes. Le miel de Manuka amplifie les propriétés antibactériennes.' },
  ],
  chinoise: [
    { nom:'Acupuncture', emoji:'📍', couleur:'#ff6b35', tag:'Méridiens', benefice:'Rééquilibre l\'énergie vitale (Qi)', usage:'Séances de 45–60 min, 1×/semaine', detail:'Stimulation de points précis sur les méridiens. Prouvée pour la douleur chronique, l\'insomnie, la fertilité et la dépression légère.' },
    { nom:'Reishi (Ganoderma)', emoji:'🍄', couleur:'#8b5e3c', tag:'Longévité', benefice:'Le "champignon de l\'immortalité"', usage:'1–2 g/jour en poudre dans une boisson', detail:'Modifie la composition du microbiome intestinal, renforce l\'immunité et réduit la fatigue. Utilisé depuis 4000 ans en Asie.' },
    { nom:'Ginseng Panax', emoji:'🌿', couleur:'#ff9500', tag:'Vitalité', benefice:'Tonique général, énergie et libido', usage:'200–400 mg/jour le matin', detail:'Le ginsénoside Rg1 améliore les performances cognitives et physiques. Le ginseng rouge coréen est le plus puissant.' },
    { nom:'Moxibustion', emoji:'🔥', couleur:'#ff3b30', tag:'Chaleur', benefice:'Stimule les méridiens par la chaleur', usage:'Avec un praticien qualifié', detail:'Combustion de l\'armoise (mugwort) près de points d\'acupuncture. Idéale pour les douleurs arthritiques, les problèmes digestifs et la fatigue chronique.' },
    { nom:'Astragale', emoji:'🌾', couleur:'#34c759', tag:'Immunité', benefice:'Renforce profondément le système immunitaire', usage:'500 mg, 2×/jour pendant 3 mois', detail:'Allonge les télomères, ralentissant le vieillissement cellulaire. Utilisé en oncologie pour réduire les effets secondaires de la chimio.' },
    { nom:'Qi Gong', emoji:'🧿', couleur:'#5856d6', tag:'Énergie', benefice:'Harmonise corps, souffle et esprit', usage:'20 min le matin à jeun', detail:'800 études scientifiques démontrent ses effets sur la pression artérielle, l\'immunité et l\'état mental. Idéal pour tous les âges.' },
  ],
  holistique: [
    { nom:'Cohérence cardiaque', emoji:'💓', couleur:'#ff2d55', tag:'Stress', benefice:'Régule le système nerveux autonome', usage:'5-5-5 : 5 min, 5 sec expir/inspir, 3×/jour', detail:'Résultats visibles dès 5 min : cortisol ↓ 20%, sérotonine ↑. App recommandée : RespiRelax. La posture debout amplifie les effets.' },
    { nom:'Bain de forêt (Shinrin-yoku)', emoji:'🌲', couleur:'#34c759', tag:'Nature', benefice:'Réduit le cortisol de 12–16%', usage:'2h minimum en forêt, sans téléphone', detail:'Les phytoncides émis par les arbres augmentent les cellules NK (anti-cancer). 3h en forêt = 30% de réduction du stress en 3 jours.' },
    { nom:'Thérapie par le froid', emoji:'🧊', couleur:'#38bdf8', tag:'Dopamine', benefice:'Dopamine +250%, immune boost', usage:'Douche froide 30 sec → 3 min, ou bain glacé', detail:'Protocole Wim Hof : la noradrénaline monte de 300%. Réduit l\'inflammation, améliore la récupération musculaire et la volonté.' },
    { nom:'Earthing (Mise à la terre)', emoji:'🌍', couleur:'#8b5e3c', tag:'Électrons', benefice:'Réduit l\'inflammation chronique', usage:'20 min pieds nus sur herbe/sol naturel', detail:'Les électrons de la terre neutralisent les radicaux libres. Améliore le sommeil, réduit les douleurs et régule les rythmes circadiens.' },
    { nom:'Méditation pleine conscience', emoji:'🧘', couleur:'#af52de', tag:'Mental', benefice:'Recâble le cortex préfrontal en 8 semaines', usage:'10–20 min/jour, le matin ou le soir', detail:'Études MBSR de Harvard : augmente la matière grise après 8 semaines. Réduit l\'amygdale (siège de la peur) de façon mesurable.' },
    { nom:'Chromothérapie', emoji:'🌈', couleur:'#ff9500', tag:'Lumière', benefice:'La couleur influence l\'humeur et la santé', usage:'Exposition naturelle ou lampe chromothérapie', detail:'Bleu : baisse la tension. Orange : stimule la créativité. Vert : équilibre. La luminothérapie matinale (10 000 lux) traite la dépression saisonnière.' },
  ],
}

// ─── HERB CARD ───────────────────────────────────────────────────────────────
function HerbCard({ item, onChat }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ ...hb.card, borderTop: `3px solid ${item.couleur}` }}
      onClick={() => setExpanded(e => !e)}>
      <div style={hb.cardTop}>
        <div style={{ ...hb.cardEmoji, background: item.couleur + '12' }}>
          <span style={{ fontSize:22 }}>{item.emoji}</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={hb.nom}>{item.nom}</span>
            <span style={{ ...hb.tag, background: item.couleur + '15', color: item.couleur }}>{item.tag}</span>
          </div>
          <div style={hb.benefice}>{item.benefice}</div>
        </div>
        <span style={{ fontSize:12, color:'#c4b5a8', flexShrink:0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={hb.expanded}>
          <div style={hb.usageRow}>
            <span style={{ fontSize:14 }}>💊</span>
            <div>
              <div style={hb.usageLabel}>Comment utiliser</div>
              <div style={hb.usageVal}>{item.usage}</div>
            </div>
          </div>
          <div style={hb.detailText}>{item.detail}</div>
          <button style={{ ...hb.askBtn, background: item.couleur + '12', color: item.couleur, border: `1px solid ${item.couleur}25` }}
            onClick={e => { e.stopPropagation(); onChat(`Parle-moi de ${item.nom} et comment ça peut m'aider avec mon profil`) }}>
            💬 Demander des conseils personnalisés →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── AI RECOMMENDATION ────────────────────────────────────────────────────────
function AIReco({ profil, onChat }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function getAIReco() {
    setLoading(true)
    try {
      const res = await fetch('/api/herbal', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil })
      })
      const data = await res.json()
      setResult(data)
    } catch { setResult({ error: true }) }
    setLoading(false)
  }

  return (
    <div style={hb.aiSection}>
      <div style={hb.aiBg} />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span style={{ fontSize:24 }}>🤖</span>
          <div>
            <div style={hb.aiTitle}>Recommandation IA personnalisée</div>
            <div style={hb.aiSub}>Basée sur ton profil et tes objectifs</div>
          </div>
        </div>
        {!result && (
          <button style={hb.aiBtn} onClick={getAIReco} disabled={loading}>
            {loading ? '⏳ Analyse en cours...' : '✨ Obtenir mes recommandations'}
          </button>
        )}
        {result && !result.error && (
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10 }}>
            {result.recommendations?.map((r, i) => (
              <div key={i} style={hb.recoItem}>
                <span style={{ fontSize:20, flexShrink:0 }}>{r.emoji}</span>
                <div>
                  <div style={hb.recoNom}>{r.nom}</div>
                  <div style={hb.recoRaison}>{r.raison}</div>
                  {r.usage && <div style={hb.recoUsage}>📌 {r.usage}</div>}
                </div>
              </div>
            ))}
            <button style={hb.retryBtn} onClick={() => setResult(null)}>🔄 Nouvelle analyse</button>
          </div>
        )}
        {result?.error && (
          <div style={{ color:'#ff3b30', fontSize:12, marginTop:8 }}>
            Erreur de connexion. Vérifie ta connexion et réessaie.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function HerbalTab({ profil, onChat }) {
  const [cat, setCat] = useState('plantes')
  const data = STATIC_DATA[cat] || []

  return (
    <div style={hb.page}>

      {/* Header */}
      <div style={hb.header}>
        <div style={hb.headerIcon}>🌿</div>
        <div>
          <div style={hb.headerTitle}>Santé Naturelle</div>
          <div style={hb.headerSub}>Plantes · Médecine chinoise · Holistic</div>
        </div>
      </div>

      {/* AI Reco */}
      <AIReco profil={profil} onChat={onChat} />

      {/* Category tabs */}
      <div style={hb.tabs}>
        {CATEGORIES.map(c => (
          <button key={c.id} style={cat===c.id ? hb.tabActive : hb.tab}
            onClick={() => setCat(c.id)}>
            <span style={{ fontSize:16 }}>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={hb.list}>
        {data.map((item, i) => (
          <HerbCard key={i} item={item} onChat={onChat} />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={hb.disclaimer}>
        ⚠️ Ces informations sont à titre éducatif. Consulte un professionnel de santé avant de commencer tout supplément, surtout si tu prends des médicaments.
      </div>

    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hb = {
  page: { paddingBottom:100, display:'flex', flexDirection:'column', gap:0 },

  header: { display:'flex', alignItems:'center', gap:14, padding:'24px 20px 16px' },
  headerIcon: { width:52, height:52, borderRadius:16,
    background:'linear-gradient(135deg,#34c759,#30d158)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
    boxShadow:'0 4px 18px rgba(52,199,89,0.3)', flexShrink:0 },
  headerTitle: { fontSize:20, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.3px' },
  headerSub: { fontSize:12, color:'#8a7265', marginTop:2, fontWeight:500 },

  // AI section
  aiSection: { margin:'0 20px 16px', borderRadius:20, padding:20, position:'relative', overflow:'hidden',
    border:'1px solid rgba(52,199,89,0.2)', background:'rgba(52,199,89,0.03)' },
  aiBg: { position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(52,199,89,0.04),rgba(255,107,53,0.04))' },
  aiTitle: { fontSize:15, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.2px' },
  aiSub: { fontSize:11, color:'#8a7265', fontWeight:500, marginTop:2 },
  aiBtn: { width:'100%', padding:'13px 20px',
    background:'linear-gradient(135deg,#34c759,#30d158)',
    color:'#fff', border:'none', borderRadius:14, fontSize:14, fontWeight:700,
    cursor:'pointer', fontFamily:'Poppins,sans-serif', boxShadow:'0 4px 18px rgba(52,199,89,0.3)',
    marginTop:4 },
  recoItem: { display:'flex', gap:12, alignItems:'flex-start', background:'#ffffff',
    border:'1px solid #f0e8e0', borderRadius:14, padding:'12px 14px',
    boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  recoNom: { fontSize:14, fontWeight:700, color:'#1a0a00', marginBottom:3 },
  recoRaison: { fontSize:12, color:'#8a7265', lineHeight:1.5, marginBottom:4 },
  recoUsage: { fontSize:11, color:'#FF6B35', fontWeight:600, background:'rgba(255,107,53,0.08)',
    padding:'3px 10px', borderRadius:8, display:'inline-block' },
  retryBtn: { background:'transparent', border:'1px solid #f0e8e0', color:'#8a7265',
    padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', alignSelf:'flex-start', marginTop:4 },

  // Tabs
  tabs: { display:'flex', gap:8, padding:'0 20px 14px', overflowX:'auto',
    scrollbarWidth:'none', WebkitOverflowScrolling:'touch' },
  tab: { flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
    borderRadius:12, border:'1px solid #f0e8e0', background:'#ffffff',
    fontSize:12, fontWeight:600, color:'#8a7265', cursor:'pointer',
    fontFamily:'Poppins,sans-serif', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', whiteSpace:'nowrap' },
  tabActive: { flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
    borderRadius:12, border:'1.5px solid rgba(52,199,89,0.5)',
    background:'rgba(52,199,89,0.08)',
    fontSize:12, fontWeight:700, color:'#34c759', cursor:'pointer',
    fontFamily:'Poppins,sans-serif', whiteSpace:'nowrap' },

  // Cards list
  list: { display:'flex', flexDirection:'column', gap:10, padding:'0 20px' },
  card: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:16,
    padding:'14px 16px', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
    transition:'transform 0.15s', overflow:'hidden' },
  cardTop: { display:'flex', alignItems:'flex-start', gap:12 },
  cardEmoji: { width:44, height:44, borderRadius:13, display:'flex', alignItems:'center',
    justifyContent:'center', flexShrink:0 },
  nom: { fontSize:14, fontWeight:700, color:'#1a0a00' },
  tag: { fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6 },
  benefice: { fontSize:12, color:'#8a7265', marginTop:2 },
  expanded: { marginTop:12, paddingTop:12, borderTop:'1px solid #f8f0e8', display:'flex', flexDirection:'column', gap:10 },
  usageRow: { display:'flex', gap:10, alignItems:'flex-start', background:'rgba(255,107,53,0.04)', borderRadius:10, padding:'10px 12px' },
  usageLabel: { fontSize:10, color:'#c4b5a8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 },
  usageVal: { fontSize:13, color:'#1a0a00', fontWeight:600 },
  detailText: { fontSize:13, color:'#8a7265', lineHeight:1.7 },
  askBtn: { padding:'10px 14px', borderRadius:12, fontSize:12, fontWeight:700,
    cursor:'pointer', fontFamily:'Poppins,sans-serif', border:'1px solid' },

  disclaimer: { margin:'16px 20px 0', padding:'12px 16px',
    background:'rgba(255,107,53,0.05)', border:'1px solid rgba(255,107,53,0.15)',
    borderRadius:12, fontSize:11, color:'#8a7265', lineHeight:1.6 },
}
