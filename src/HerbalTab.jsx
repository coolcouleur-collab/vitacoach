import React, { useState } from 'react'
import { LeafIcon, SparkleIcon, ChevronIcon, BackIcon } from './Icons'

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CATS = [
  { id:'plantes',    label:'Plantes',    color:'#34c759' },
  { id:'tisanes',    label:'Tisanes',    color:'#38bdf8' },
  { id:'chinoise',   label:'Méd. chin.', color:'#ff6b35' },
  { id:'holistique', label:'Holistique', color:'#a78bfa' },
]

const DATA = {
  plantes: [
    { nom:'Ashwagandha',   tag:'Adaptogène',      color:'#34c759', benefice:'Réduit le cortisol et améliore la résistance au stress', usage:'250–500 mg/jour le matin', detail:'Plante ayurvédique connue comme "ginseng indien". Améliore l\'endurance mentale et physique, réduit l\'anxiété et régule le cycle veille-sommeil.' },
    { nom:'Curcuma',       tag:'Anti-inflammatoire', color:'#ff9500', benefice:'Neutralise l\'inflammation chronique et protège le foie', usage:'1 c.à.c + poivre noir + huile, matin', detail:'La curcumine est 1000× plus biodisponible avec de la pipérine (poivre noir). Puissant antioxydant, soutient les articulations et la digestion.' },
    { nom:'Gingembre',     tag:'Digestif',        color:'#ff6b35', benefice:'Stimule la digestion et booste l\'immunité naturellement', usage:'Frais ou tisane, 2–3 g/jour', detail:'Anti-nausée cliniquement prouvé. Réduit les douleurs musculaires post-entraînement et stimule la thermogenèse (brûle les graisses).' },
    { nom:'Rhodiola Rosea',tag:'Énergie',         color:'#a78bfa', benefice:'Combat la fatigue physique et améliore la concentration', usage:'200–400 mg le matin, à jeun', detail:'Plante des montagnes arctiques utilisée par les cosmonautes soviétiques. Réduit le stress oxydatif et améliore les fonctions cognitives sous pression.' },
    { nom:'Valériane',     tag:'Sommeil',         color:'#5856d6', benefice:'Facilite l\'endormissement sans accoutumance', usage:'300–600 mg, 1h avant le coucher', detail:'Augmente le GABA naturellement, favorisant un sommeil profond. Idéale en cure de 4 semaines. Pas d\'effet le lendemain matin.' },
    { nom:'Ginkgo Biloba', tag:'Mémoire',         color:'#0ea5e9', benefice:'Améliore la circulation cérébrale et la mémoire', usage:'120–240 mg/jour avec un repas', detail:'Un des suppléments les plus étudiés au monde. Augmente le flux sanguin vers le cerveau et protège les neurones du stress oxydatif.' },
    { nom:'Chardon-marie', tag:'Foie',            color:'#34c759', benefice:'Régénère et détoxifie les cellules hépatiques', usage:'140 mg de silymarine, 3× par jour', detail:'La silymarine bloque les toxines et stimule la régénération cellulaire hépatique. Incontournable après antibiotiques, alcool ou médicaments.' },
    { nom:'Ortie',         tag:'Minéraux',        color:'#30d158', benefice:'Reminéralise l\'organisme et combat la fatigue de fond', usage:'Tisane ou gélules, cure de 3 semaines', detail:'Riche en fer, magnésium, silice et vitamines K et C. Excellent dépuratif. Aide contre l\'anémie, les douleurs articulaires et la chute de cheveux.' },
  ],
  tisanes: [
    { nom:'Camomille',       tag:'Apaisante',   color:'#fbbf24', benefice:'Calme l\'anxiété et prépare au sommeil en douceur', usage:'1 tasse le soir, 8–10 min d\'infusion', detail:'L\'apigénine se lie aux récepteurs GABA (comme les anxiolytiques). Réduit l\'inflammation intestinale et soulage les coliques.' },
    { nom:'Menthe poivrée',  tag:'Digestive',   color:'#34c759', benefice:'Soulage les ballonnements et les douleurs intestinales', usage:'Après les repas, 2 tasses/jour max', detail:'Le menthol relâche la musculature lisse digestive. Cliniquement efficace contre le SII. Éviter en cas de reflux gastro-œsophagien.' },
    { nom:'Hibiscus',        tag:'Cardio',      color:'#ff2d55', benefice:'Réduit naturellement la tension artérielle', usage:'2–3 tasses/jour, froid ou chaud', detail:'Les anthocyanines réduisent la pression systolique de 7 points en 4 semaines (méta-analyse). Riche en vitamine C et antioxydants.' },
    { nom:'Rooibos',         tag:'Antioxydant', color:'#ff9500', benefice:'Zéro caféine — riche en antioxydants uniques', usage:'Sans restriction, toute la journée', detail:'Contient de l\'aspalathin (molécule unique), anti-diabétique et anti-inflammatoire. Idéal le soir, naturellement sucré et doux.' },
    { nom:'Tilleul',         tag:'Stress',      color:'#86efac', benefice:'Relâche les tensions nerveuses et musculaires', usage:'1–2 tasses en fin d\'après-midi', detail:'Flavonoïdes sédatifs légers utilisés depuis le Moyen-Âge. Efficace contre les maux de tête de tension, l\'anxiété et l\'hypertension légère.' },
    { nom:'Gingembre-citron',tag:'Immunité',    color:'#ffd60a', benefice:'Renforce les défenses immunitaires quotidiennement', usage:'Matin à jeun avec une cuillère de miel', detail:'Synergie puissante : gingerols (anti-infectieux) + vitamine C + enzymes du miel. Le miel de Manuka amplifie les propriétés antibactériennes.' },
  ],
  chinoise: [
    { nom:'Acupuncture',     tag:'Méridiens',  color:'#ff6b35', benefice:'Rééquilibre le Qi et soulage les douleurs chroniques', usage:'45–60 min, 1 séance/semaine', detail:'Stimulation de points précis sur les méridiens. Prouvée efficace pour : douleur chronique, insomnie, anxiété, fertilité et migraines.' },
    { nom:'Reishi',          tag:'Longévité',  color:'#92400e', benefice:'"Champignon de l\'immortalité" — immunité et longévité', usage:'1–2 g/jour en poudre dans une boisson chaude', detail:'Modifie le microbiome intestinal et renforce les cellules NK (natural killers). Utilisé depuis 4000 ans en médecine chinoise. Anti-tumoral étudié.' },
    { nom:'Ginseng Panax',   tag:'Vitalité',   color:'#ff9500', benefice:'Tonique général qui améliore énergie et libido', usage:'200–400 mg/jour le matin', detail:'Les ginsénosides Rg1 et Rb1 améliorent les performances cognitives et physiques. Le ginseng rouge coréen est le plus concentré et le plus étudié.' },
    { nom:'Moxibustion',     tag:'Chaleur',    color:'#ff3b30', benefice:'Stimule les méridiens par la chaleur pour soulager', usage:'Avec un praticien qualifié', detail:'Combustion de l\'armoise près de points d\'acupuncture. Idéale pour : arthrite, douleurs menstruelles, digestion lente et fatigue chronique profonde.' },
    { nom:'Astragale',       tag:'Immunité',   color:'#34c759', benefice:'Renforce l\'immunité en profondeur et ralentit le vieillissement', usage:'500 mg, 2× par jour, cure de 3 mois', detail:'Allonge les télomères (marqueurs du vieillissement cellulaire). Utilisé en complément de la chimiothérapie pour réduire les effets secondaires.' },
    { nom:'Qi Gong',         tag:'Énergie',    color:'#5856d6', benefice:'Harmonise corps, souffle et esprit par le mouvement', usage:'20 min le matin à jeun, quotidiennement', detail:'+800 études scientifiques. Réduit la tension artérielle, renforce l\'immunité et améliore l\'équilibre mental. Idéal pour tous les âges.' },
  ],
  holistique: [
    { nom:'Cohérence cardiaque', tag:'Système nerveux', color:'#ff2d55', benefice:'Régule le stress en 5 minutes, cortisol −20%', usage:'5-5 : 5 inspirations/min, 3× par jour', detail:'L\'IHM Institute : la cohérence cardiaque augmente la sérotonine et la DHEA. Application gratuite recommandée : RespiRelax+. Posture debout pour maximiser.' },
    { nom:'Bain de forêt',       tag:'Shinrin-yoku', color:'#34c759', benefice:'Phytoncides des arbres : cortisol −15%, NK +50%', usage:'2h minimum en forêt sans téléphone', detail:'Les cellules NK (anti-cancer) augmentent pendant 30 jours après 3h en forêt. Les phytoncides (composés volatils des arbres) traversent les poumons.' },
    { nom:'Thérapie par le froid',tag:'Dopamine',   color:'#38bdf8', benefice:'Dopamine +250%, inflammation réduite, volonté renforcée', usage:'Douche froide 30s → 3 min progressivement', detail:'La noradrénaline monte de 300% (Wim Hof Institute). Réduit l\'inflammation chronique, améliore la récupération musculaire et renforce la résilience mentale.' },
    { nom:'Earthing',            tag:'Électrons',   color:'#92400e', benefice:'Neutralise les radicaux libres via les électrons du sol', usage:'20 min pieds nus sur sol naturel/herbe', detail:'Les électrons libres de la terre neutralisent les radicaux libres inflammatoires. Améliore le sommeil, réduit la douleur et régule les rythmes circadiens.' },
    { nom:'Méditation MBSR',     tag:'Neuroplasticité', color:'#a78bfa', benefice:'Recâble le cerveau en 8 semaines — Harvard prouvé', usage:'10–20 min/jour, app ou guidance', detail:'L\'étude Harvard : augmentation de la matière grise après 8 semaines. L\'amygdale (siège de la peur) réduit de façon mesurable. MBSR = Mindfulness-Based Stress Reduction.' },
    { nom:'Luminothérapie',      tag:'Rythme circadien', color:'#fbbf24', benefice:'Régule la mélatonine et traite la dépression saisonnière', usage:'10 000 lux, 20–30 min le matin au réveil', detail:'Efficacité comparable aux antidépresseurs pour le TAS (trouble affectif saisonnier). Synchronise l\'horloge interne et améliore l\'énergie matinale.' },
  ],
}

// ─── AI RECO SECTION ─────────────────────────────────────────────────────────
function AIReco({ profil, onChat }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems]     = useState(null)
  const [err, setErr]         = useState(false)

  async function analyse() {
    setLoading(true); setErr(false)
    try {
      const res = await fetch('/api/herbal', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ profil })
      })
      const data = await res.json()
      setItems(data.recommendations)
    } catch { setErr(true) }
    setLoading(false)
  }

  return (
    <div style={hb.aiBox}>
      <div style={hb.aiTop}>
        <div style={hb.aiIconWrap}>
          <SparkleIcon color="#FF6B35" size={18} />
        </div>
        <div style={{ flex:1 }}>
          <div style={hb.aiTitle}>Recommandation IA</div>
          <div style={hb.aiSub}>Basée sur ton profil {profil?.nom ? `· ${profil.nom}` : ''}</div>
        </div>
        {!items && (
          <button style={{ ...hb.aiCta, opacity: loading ? 0.7 : 1 }}
            onClick={analyse} disabled={loading}>
            {loading ? <span style={hb.dotLoader}><span/><span/><span/></span> : 'Analyser →'}
          </button>
        )}
        {items && (
          <button style={{ ...hb.aiCta, background:'#f8f4f0', color:'#8a7265', fontSize:10 }}
            onClick={() => setItems(null)}>Refaire</button>
        )}
      </div>

      {items && (
        <div style={hb.aiResults}>
          {items.map((r, i) => (
            <div key={i} style={hb.aiItem}>
              <span style={{ fontSize:18, flexShrink:0 }}>{r.emoji}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#1a0a00' }}>{r.nom}</div>
                <div style={{ fontSize:11, color:'#8a7265', lineHeight:1.5 }}>{r.raison}</div>
              </div>
              <button style={hb.aiAskBtn}
                onClick={() => onChat(`Parle-moi de ${r.nom} pour mon profil`)}>
                →
              </button>
            </div>
          ))}
        </div>
      )}
      {err && <div style={{ fontSize:11, color:'#ff3b30', marginTop:8 }}>Erreur de connexion. Réessaie.</div>}
    </div>
  )
}

// ─── HERB ITEM (condensed row + inline expand) ────────────────────────────────
function HerbItem({ item, onChat }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ ...hb.item, borderLeft:`3px solid ${item.color}` }}>
      <div style={hb.itemRow} onClick={() => setOpen(o => !o)}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={hb.itemTop}>
            <span style={hb.itemNom}>{item.nom}</span>
            <span style={{ ...hb.itemTag, background: item.color+'15', color: item.color }}>{item.tag}</span>
          </div>
          <div style={hb.itemBenef}>{item.benefice}</div>
        </div>
        <ChevronIcon color="#c4b5a8" size={15} direction={open ? 'up' : 'down'} />
      </div>

      {/* Expanded content — max-height transition */}
      <div style={{ overflow:'hidden', maxHeight: open ? 260 : 0, transition:'max-height 0.32s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={hb.expandBody}>
          <div style={hb.usageRow}>
            <div style={{ ...hb.usageDot, background: item.color }} />
            <div>
              <div style={{ fontSize:9, color:'#c4b5a8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px' }}>Comment utiliser</div>
              <div style={{ fontSize:12, color:'#1a0a00', fontWeight:600, marginTop:1 }}>{item.usage}</div>
            </div>
          </div>
          <div style={hb.detailText}>{item.detail}</div>
          <button style={{ ...hb.askBtn, borderColor: item.color+'30', color: item.color, background: item.color+'08' }}
            onClick={e => { e.stopPropagation(); onChat(`Explique-moi comment utiliser ${item.nom} selon mon profil`) }}>
            💬 Conseils personnalisés →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function HerbalTab({ profil, onChat, onBack }) {
  const [cat, setCat] = useState('plantes')
  const items = DATA[cat] || []
  const activeCat = CATS.find(c => c.id === cat)

  return (
    <div style={hb.page}>

      {/* Gradient header */}
      <div style={{ ...hb.header, '--c': activeCat?.color || '#34c759' }}>
        <div style={hb.headerGlow} />
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ ...hb.headerIcon, boxShadow:`0 6px 24px ${activeCat?.color}40` }}>
            <LeafIcon color="#fff" size={24} />
          </div>
          <div>
            <div style={hb.headerTitle}>Santé Naturelle</div>
            <div style={hb.headerSub}>Plantes · Médecine chinoise · Holistic</div>
          </div>
        </div>
      </div>

      {/* AI Reco */}
      <AIReco profil={profil} onChat={onChat} />

      {/* Category pills */}
      <div style={hb.catRow}>
        {CATS.map(c => (
          <button key={c.id}
            style={cat === c.id
              ? { ...hb.cat, background: c.color, color:'#fff', borderColor: c.color, boxShadow:`0 4px 14px ${c.color}35` }
              : { ...hb.cat, background:'#ffffff', color:'#8a7265', borderColor:'#f0e8e0' }
            }
            onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={hb.countRow}>
        <span style={hb.countText}>{items.length} items</span>
        <span style={{ ...hb.countDot, background: activeCat?.color }} />
        <span style={hb.countText}>Appuie pour développer</span>
      </div>

      {/* Items list */}
      <div style={hb.list}>
        {items.map((item, i) => (
          <HerbItem key={i} item={item} onChat={onChat} />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={hb.disclaimer}>
        ⚠️ À titre éducatif uniquement. Consulte un professionnel de santé avant tout supplément, particulièrement si tu prends des médicaments.
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hb = {
  page: { paddingBottom:100 },

  // Header animated gradient
  header: { margin:'0 0 0', padding:'24px 20px 22px', position:'relative', overflow:'hidden',
    background:'linear-gradient(135deg, rgba(52,199,89,0.08) 0%, rgba(255,107,53,0.06) 100%)',
    borderBottom:'1px solid #f0e8e0' },
  headerGlow: { position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(52,199,89,0.05), transparent)',
    animation:'floatOrb 8s ease-in-out infinite' },
  headerIcon: { width:52, height:52, borderRadius:18,
    background:'linear-gradient(135deg,#34c759,#30d158)',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
    transition:'box-shadow 0.3s' },
  headerTitle: { fontSize:20, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.3px' },
  headerSub: { fontSize:12, color:'#8a7265', marginTop:2, fontWeight:500 },

  // AI section
  aiBox: { margin:'12px 16px', background:'#ffffff', border:'1px solid #f0e8e0',
    borderRadius:16, padding:'14px 14px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' },
  aiTop: { display:'flex', alignItems:'center', gap:10 },
  aiIconWrap: { width:34, height:34, borderRadius:10, background:'rgba(255,107,53,0.1)',
    border:'1.5px solid rgba(255,107,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  aiTitle: { fontSize:13, fontWeight:700, color:'#1a0a00' },
  aiSub: { fontSize:10, color:'#c4b5a8', fontWeight:500, marginTop:1 },
  aiCta: { background:'linear-gradient(135deg,#FF6B35,#E55A00)', color:'#fff', border:'none',
    padding:'7px 14px', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', flexShrink:0, boxShadow:'0 3px 10px rgba(255,107,53,0.3)' },
  dotLoader: { display:'inline-flex', gap:3, alignItems:'center',
    '& span': { width:4, height:4, borderRadius:'50%', background:'white' } },
  aiResults: { marginTop:12, display:'flex', flexDirection:'column', gap:8, borderTop:'1px solid #f8f4f0', paddingTop:12 },
  aiItem: { display:'flex', alignItems:'center', gap:10, background:'#f9fafb', borderRadius:10, padding:'10px 12px' },
  aiAskBtn: { width:28, height:28, borderRadius:8, background:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.2)',
    color:'#FF6B35', fontSize:13, fontWeight:800, cursor:'pointer', flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Poppins,sans-serif' },

  // Category pills
  catRow: { display:'flex', gap:7, padding:'12px 16px 8px', overflowX:'auto',
    scrollbarWidth:'none', WebkitOverflowScrolling:'touch' },
  cat: { flexShrink:0, padding:'7px 14px', borderRadius:20, border:'1.5px solid',
    fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif',
    transition:'all 0.2s', whiteSpace:'nowrap' },

  countRow: { display:'flex', alignItems:'center', gap:6, padding:'0 16px 8px' },
  countText: { fontSize:10, color:'#c4b5a8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' },
  countDot: { width:4, height:4, borderRadius:'50%' },

  // List
  list: { display:'flex', flexDirection:'column', gap:0, padding:'0 16px' },
  item: { background:'#ffffff', borderRadius:12, marginBottom:6,
    overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
    transition:'box-shadow 0.2s' },
  itemRow: { display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
    cursor:'pointer' },
  itemTop: { display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap' },
  itemNom: { fontSize:13, fontWeight:700, color:'#1a0a00' },
  itemTag: { fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:5, letterSpacing:'0.3px' },
  itemBenef: { fontSize:12, color:'#8a7265', lineHeight:1.4 },

  // Expanded
  expandBody: { padding:'0 14px 14px', borderTop:'1px solid #f8f4f0' },
  usageRow: { display:'flex', alignItems:'flex-start', gap:10, padding:'12px 0 10px' },
  usageDot: { width:8, height:8, borderRadius:'50%', marginTop:4, flexShrink:0 },
  detailText: { fontSize:12, color:'#8a7265', lineHeight:1.7, marginBottom:10 },
  askBtn: { display:'inline-block', padding:'7px 14px', borderRadius:10, border:'1px solid',
    fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins,sans-serif' },

  // Disclaimer
  disclaimer: { margin:'12px 16px 0', padding:'10px 14px',
    background:'rgba(255,107,53,0.04)', border:'1px solid rgba(255,107,53,0.12)',
    borderRadius:10, fontSize:10, color:'#8a7265', lineHeight:1.6 },
}
