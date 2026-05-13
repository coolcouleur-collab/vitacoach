import React, { useState } from 'react'
import { LeafIcon, SparkleIcon, ChevronIcon, PillIcon, TargetIcon } from './Icons'

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CATS = [
  { id:'plantes',    label:'Plantes',    color:'#34c759' },
  { id:'tisanes',    label:'Tisanes',    color:'#38bdf8' },
  { id:'chinoise',   label:'Méd. chin.', color:'#8b5cf6' },
  { id:'holistique', label:'Holistique', color:'#a78bfa' },
]

const DATA = {
  plantes: [
    { nom:'Ashwagandha',   tag:'Adaptogène',      color:'#34c759', benefice:'Réduit le cortisol et améliore la résistance au stress', usage:'250–500 mg/jour le matin', detail:'Plante ayurvédique connue comme "ginseng indien". Améliore l\'endurance mentale et physique, réduit l\'anxiété et régule le cycle veille-sommeil.' },
    { nom:'Curcuma',       tag:'Anti-inflammatoire', color:'#ff9500', benefice:'Neutralise l\'inflammation chronique et protège le foie', usage:'1 c.à.c + poivre noir + huile, matin', detail:'La curcumine est 1000× plus biodisponible avec de la pipérine (poivre noir). Puissant antioxydant, soutient les articulations et la digestion.' },
    { nom:'Gingembre',     tag:'Digestif',        color:'#8b5cf6', benefice:'Stimule la digestion et booste l\'immunité naturellement', usage:'Frais ou tisane, 2–3 g/jour', detail:'Anti-nausée cliniquement prouvé. Réduit les douleurs musculaires post-entraînement et stimule la thermogenèse (brûle les graisses).' },
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
    { nom:'Acupuncture',     tag:'Méridiens',  color:'#8b5cf6', benefice:'Rééquilibre le Qi et soulage les douleurs chroniques', usage:'45–60 min, 1 séance/semaine', detail:'Stimulation de points précis sur les méridiens. Prouvée efficace pour : douleur chronique, insomnie, anxiété, fertilité et migraines.' },
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

// ─── HERO BACKGROUND (aurora animated, like HomeTab) ─────────────────────────
function HeroBg({ color }) {
  const c = color || '#34c759'
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', borderRadius:'inherit' }}>
      {/* Animated aurora gradient */}
      <div style={{
        position:'absolute', inset:0,
        background:`linear-gradient(-45deg, ${c}22, #f0fff4, ${c}12, #e8fdf0, ${c}18)`,
        backgroundSize:'400% 400%',
        animation:'heroGradient 10s ease infinite',
      }} />
      {/* Floating orbs */}
      <div style={{
        position:'absolute', top:'-20%', right:'-6%', width:260, height:260,
        borderRadius:'50%', background:`radial-gradient(circle, ${c}40 0%, transparent 65%)`,
        animation:'floatOrb 8s ease-in-out infinite', filter:'blur(4px)',
      }} />
      <div style={{
        position:'absolute', bottom:'-12%', left:'-5%', width:200, height:200,
        borderRadius:'50%', background:`radial-gradient(circle, ${c}28 0%, transparent 65%)`,
        animation:'floatOrb 12s ease-in-out infinite reverse', filter:'blur(4px)',
      }} />
      <div style={{
        position:'absolute', top:'35%', left:'18%', width:120, height:120,
        borderRadius:'50%', background:`radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 65%)`,
        animation:'floatOrb 6s ease-in-out infinite', filter:'blur(2px)',
      }} />
    </div>
  )
}

// ─── AI RECO EXPANDABLE CARD ──────────────────────────────────────────────────
function AIRecoCard({ r, onChat, index }) {
  const [open, setOpen]       = useState(false)
  const [pressed, setPressed] = useState(false)
  const c = '#34c759'

  return (
    <div
      style={{
        background:`${c}0c`, border:`1.5px solid ${c}25`, borderRadius:18,
        overflow:'hidden',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow:`0 4px 16px ${c}15, inset 0 1px 0 rgba(255,255,255,0.8)`,
        animation:`slideUp 0.3s ${index * 0.07}s ease both`,
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* Collapsed header — always visible */}
      <div
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', cursor:'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize:22, flexShrink:0 }}>{r.emoji}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:2 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1a0a00' }}>{r.nom}</span>
            {r.tag && (
              <span style={{
                fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:6,
                background:`${c}18`, color:c, border:`1px solid ${c}28`,
                textTransform:'uppercase', letterSpacing:'0.4px',
              }}>{r.tag}</span>
            )}
          </div>
          <div style={{ fontSize:11.5, color:'#8a7265', lineHeight:1.4 }}>{r.benefice}</div>
        </div>
        <div style={{
          width:28, height:28, borderRadius:'50%', flexShrink:0,
          background:`${c}16`, border:`1.5px solid ${c}28`,
          display:'flex', alignItems:'center', justifyContent:'center',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <ChevronIcon color={c} size={12} direction="down" />
        </div>
      </div>

      {/* Expanded details */}
      <div style={{ overflow:'hidden', maxHeight: open ? 520 : 0, transition:'max-height 0.38s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${c}18` }}>

          {/* Pourquoi — personnalisé */}
          {r.pourquoi && (
            <div style={{
              background:`linear-gradient(135deg, ${c}10, ${c}06)`,
              border:`1px solid ${c}22`, borderRadius:12,
              padding:'10px 12px', margin:'10px 0 8px',
            }}>
              <div style={{ fontSize:9, color:`${c}cc`, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:4 }}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><TargetIcon size={9} color={`${c}cc`} /> Pourquoi pour toi ?</span>
              </div>
              <div style={{ fontSize:12, color:'#4a3c35', lineHeight:1.72 }}>{r.pourquoi}</div>
            </div>
          )}

          {/* Usage */}
          {r.usage && (
            <div style={{
              display:'flex', gap:9, alignItems:'flex-start',
              background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.16)',
              borderRadius:10, padding:'10px 12px', marginBottom:8,
            }}>
              <span style={{ flexShrink:0, display:'flex' }}><PillIcon size={16} color="#8b5cf6" /></span>
              <div>
                <div style={{ fontSize:9, color:'#8b5cf6', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:3 }}>
                  Comment utiliser
                </div>
                <div style={{ fontSize:12, color:'#1a0a00', fontWeight:600, lineHeight:1.55 }}>{r.usage}</div>
              </div>
            </div>
          )}

          {/* Précaution */}
          {r.precaution && (
            <div style={{
              fontSize:11.5, color:'#d97706',
              background:'rgba(251,191,36,0.08)', borderRadius:10,
              padding:'8px 11px', marginBottom:8,
              border:'1px solid rgba(251,191,36,0.22)', lineHeight:1.55,
            }}>
              ⚠️ <strong>Précaution :</strong> {r.precaution}
            </div>
          )}

          {/* Synergie */}
          {r.synergie && (
            <div style={{
              fontSize:11.5, color:'#0ea5e9',
              background:'rgba(14,165,233,0.07)', borderRadius:10,
              padding:'8px 11px', marginBottom:10,
              border:'1px solid rgba(14,165,233,0.18)', lineHeight:1.55,
            }}>
              🔗 <strong>Synergie :</strong> {r.synergie}
            </div>
          )}

          <button
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'9px 15px', borderRadius:12,
              background:`linear-gradient(135deg, ${c}18, ${c}0c)`,
              border:`1.5px solid ${c}30`, color:c,
              fontSize:11, fontWeight:800, cursor:'pointer',
              fontFamily:'Poppins,sans-serif',
              boxShadow:`0 4px 12px ${c}18, inset 0 1px 0 rgba(255,255,255,0.7)`,
            }}
            onClick={e => { e.stopPropagation(); onChat(`Parle-moi en détail de ${r.nom} selon mon profil`) }}
          >
            💬 En savoir plus →
          </button>
        </div>
      </div>
    </div>
  )
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
      <div style={hb.aiBoxTint} />
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={hb.aiTop}>
          <div style={hb.aiIconWrap}>
            <SparkleIcon color="#8b5cf6" size={22} />
          </div>
          <div style={{ flex:1 }}>
            <div style={hb.aiTitle}>Recommandation IA</div>
            <div style={hb.aiSub}>Basée sur ton profil {profil?.nom ? `· ${profil.nom}` : ''}</div>
          </div>
          {!items && (
            <button
              style={{ ...hb.aiCta, opacity: loading ? 0.72 : 1 }}
              onClick={analyse} disabled={loading}
            >
              {loading
                ? <span style={{ display:'inline-flex', gap:4, alignItems:'center' }}>
                    <span style={hb.dot} /><span style={{ ...hb.dot, animationDelay:'0.15s' }} /><span style={{ ...hb.dot, animationDelay:'0.3s' }} />
                  </span>
                : 'Analyser →'}
            </button>
          )}
          {items && (
            <button
              style={{ ...hb.aiCta, background:'rgba(139,92,246,0.08)', color:'#8b5cf6',
                border:'1.5px solid rgba(139,92,246,0.22)', boxShadow:'0 3px 10px rgba(139,92,246,0.12)', fontSize:10 }}
              onClick={() => setItems(null)}
            >
              Refaire
            </button>
          )}
        </div>

        {items && (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8, borderTop:'1px solid rgba(139,92,246,0.12)', paddingTop:14 }}>
            {items.map((r, i) => (
              <AIRecoCard key={i} r={r} onChat={onChat} index={i} />
            ))}
          </div>
        )}

        {err && (
          <div style={{ fontSize:11, color:'#ff3b30', marginTop:10, fontWeight:600 }}>
            Erreur de connexion. Réessaie.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HERB ITEM — clay card with expand ───────────────────────────────────────
function HerbItem({ item, onChat }) {
  const [open, setOpen] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <div style={{
      background: `${item.color}10`,
      border: `1.5px solid ${item.color}30`,
      borderRadius: 20,
      marginBottom: 10,
      overflow: 'hidden',
      boxShadow: `0 6px 20px ${item.color}18, inset 0 1px 0 rgba(255,255,255,0.8)`,
      transform: pressed ? 'scale(0.985)' : 'scale(1)',
      transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
    }}>
      {/* Clickable header row */}
      <div
        style={{
          display:'flex', alignItems:'center', gap:13,
          padding:'13px 15px', cursor:'pointer',
        }}
        onClick={() => setOpen(o => !o)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.2px' }}>{item.nom}</span>
            <span style={{
              fontSize:9, fontWeight:800, padding:'3px 9px', borderRadius:8,
              background: `${item.color}22`, color: item.color,
              border: `1px solid ${item.color}30`, letterSpacing:'0.4px', textTransform:'uppercase',
            }}>
              {item.tag}
            </span>
          </div>
          <div style={{ fontSize:12, color:'#6b5c52', lineHeight:1.45, fontWeight:500 }}>{item.benefice}</div>
        </div>
        {/* Chevron in colored circle */}
        <div style={{
          width:30, height:30, borderRadius:'50%', flexShrink:0,
          background: `${item.color}16`, border:`1.5px solid ${item.color}28`,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <ChevronIcon color={item.color} size={13} direction="down" />
        </div>
      </div>

      {/* Expanded content */}
      <div style={{
        overflow:'hidden',
        maxHeight: open ? 320 : 0,
        transition:'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          padding:'0 15px 15px',
          borderTop:`1px solid ${item.color}20`,
        }}>
          {/* Usage box with gradient tint */}
          <div style={{
            display:'flex', alignItems:'flex-start', gap:11,
            background:`linear-gradient(135deg, ${item.color}12, ${item.color}06)`,
            border:`1px solid ${item.color}22`,
            borderRadius:14, padding:'11px 13px', margin:'12px 0 10px',
          }}>
            <div style={{
              width:10, height:10, borderRadius:'50%',
              background:`linear-gradient(135deg, ${item.color}, ${item.color}aa)`,
              marginTop:3, flexShrink:0,
              boxShadow:`0 2px 6px ${item.color}40`,
            }} />
            <div>
              <div style={{ fontSize:9, color:`${item.color}cc`, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px' }}>
                Comment utiliser
              </div>
              <div style={{ fontSize:12, color:'#1a0a00', fontWeight:700, marginTop:2, lineHeight:1.4 }}>
                {item.usage}
              </div>
            </div>
          </div>
          {/* Detail text */}
          <div style={{ fontSize:12, color:'#6b5c52', lineHeight:1.75, marginBottom:12 }}>
            {item.detail}
          </div>
          {/* Clay CTA button */}
          <button
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'9px 16px', borderRadius:14,
              background:`linear-gradient(135deg, ${item.color}18, ${item.color}0c)`,
              border:`1.5px solid ${item.color}35`,
              color: item.color, fontSize:11, fontWeight:800,
              cursor:'pointer', fontFamily:'Poppins,sans-serif',
              boxShadow:`0 4px 14px ${item.color}20, inset 0 1px 0 rgba(255,255,255,0.7)`,
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
            onClick={e => {
              e.stopPropagation()
              onChat(`Explique-moi comment utiliser ${item.nom} selon mon profil`)
            }}
          >
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
  const activeColor = activeCat?.color || '#34c759'

  return (
    <div style={hb.page}>

      {/* ── Aurora Hero Header ── */}
      <div style={{ ...hb.hero }}>
        <HeroBg color={activeColor} />
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          {/* Clay leaf icon */}
          <div style={{
            width:64, height:64, borderRadius:22,
            background:`linear-gradient(135deg, ${activeColor}, ${activeColor}bb)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 8px 28px ${activeColor}50, 0 2px 6px ${activeColor}30, inset 0 1px 0 rgba(255,255,255,0.35)`,
            transition:'box-shadow 0.4s, background 0.4s',
            animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <LeafIcon color="#fff" size={28} />
          </div>
          {/* Title */}
          <div style={{
            fontSize:26, fontWeight:900, color:'#1a0a00',
            letterSpacing:'-0.5px', textAlign:'center', lineHeight:1.1,
          }}>
            Santé Naturelle
          </div>
          {/* Subtitle badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'rgba(255,255,255,0.65)', backdropFilter:'blur(8px)',
            border:`1px solid ${activeColor}28`,
            borderRadius:24, padding:'5px 14px',
            fontSize:11, color:'#6b5c52', fontWeight:600,
            boxShadow:`0 2px 10px ${activeColor}15`,
          }}>
            🌿 Plantes · Médecine Chinoise · Holistic
          </div>
        </div>
      </div>

      {/* ── AI Reco ── */}
      <AIReco profil={profil} onChat={onChat} />

      {/* ── Category pills row ── */}
      <div style={hb.catRow}>
        {CATS.map(c => {
          const active = cat === c.id
          return (
            <button
              key={c.id}
              style={{
                flexShrink:0, padding:'10px 20px', borderRadius:24,
                border: active ? `1.5px solid ${c.color}` : '1.5px solid #f0e8e0',
                fontSize:12, fontWeight:700,
                cursor:'pointer', fontFamily:'Poppins,sans-serif',
                whiteSpace:'nowrap',
                background: active
                  ? `linear-gradient(135deg, ${c.color}, ${c.color}cc)`
                  : 'rgba(255,255,255,0.85)',
                color: active ? '#fff' : '#8a7265',
                boxShadow: active
                  ? `0 6px 20px ${c.color}30, inset 0 1px 0 rgba(255,255,255,0.25)`
                  : '0 2px 8px rgba(0,0,0,0.05)',
                transform: active ? 'scale(1.04)' : 'scale(1)',
                transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* ── Count row ── */}
      <div style={hb.countRow}>
        <div style={{
          width:8, height:8, borderRadius:'50%',
          background:`linear-gradient(135deg, ${activeColor}, ${activeColor}99)`,
          boxShadow:`0 2px 6px ${activeColor}40`,
          flexShrink:0,
        }} />
        <span style={hb.countText}>{items.length} remèdes</span>
        <span style={{ ...hb.countSep }}>·</span>
        <span style={hb.countText}>Appuie pour développer</span>
      </div>

      {/* ── Items list ── */}
      <div style={hb.list}>
        {items.map((item, i) => (
          <HerbItem key={i} item={item} onChat={onChat} />
        ))}
      </div>

      {/* ── Disclaimer ── */}
      <div style={hb.disclaimer}>
        ⚠️ À titre éducatif uniquement. Consulte un professionnel de santé avant tout supplément, particulièrement si tu prends des médicaments.
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hb = {
  page: { paddingBottom:100, animation:'tabFade 0.28s ease both' },

  // ── Aurora hero header
  hero: {
    position:'relative', minHeight:160,
    display:'flex', alignItems:'center', justifyContent:'center',
    overflow:'hidden', padding:'28px 20px 24px',
    borderRadius:'0 0 28px 28px',
    marginBottom:4,
  },

  // ── AI box — hero-style gradient card
  aiBox: {
    position:'relative',
    margin:'14px 16px 4px',
    borderRadius:24,
    padding:'16px 16px',
    border:'1.5px solid rgba(139,92,246,0.22)',
    background:'rgba(255,255,255,0.7)',
    boxShadow:'0 8px 28px rgba(139,92,246,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
    overflow:'hidden',
  },
  aiBoxTint: {
    position:'absolute', inset:0, zIndex:0, borderRadius:'inherit',
    background:'linear-gradient(145deg, rgba(139,92,246,0.08), rgba(255,154,60,0.05))',
    pointerEvents:'none',
  },
  aiTop: { display:'flex', alignItems:'center', gap:12 },
  aiIconWrap: {
    width:44, height:44, borderRadius:16, flexShrink:0,
    background:'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(255,154,60,0.12))',
    border:'1.5px solid rgba(139,92,246,0.28)',
    boxShadow:'0 4px 14px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  aiTitle: { fontSize:14, fontWeight:800, color:'#1a0a00', letterSpacing:'-0.2px' },
  aiSub: { fontSize:10, color:'#c4b5a8', fontWeight:600, marginTop:1 },
  aiCta: {
    background:'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    color:'#fff', border:'none',
    padding:'9px 16px', borderRadius:14,
    fontSize:11, fontWeight:800, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', flexShrink:0,
    boxShadow:'0 5px 16px rgba(139,92,246,0.38), inset 0 1px 0 rgba(255,255,255,0.2)',
    transition:'opacity 0.15s, transform 0.15s',
  },
  dot: {
    display:'inline-block', width:5, height:5,
    borderRadius:'50%', background:'white',
    animation:'dotPulse 0.7s ease-in-out infinite',
  },
  aiResults: {
    marginTop:14, display:'flex', flexDirection:'column', gap:8,
    borderTop:'1px solid rgba(139,92,246,0.12)', paddingTop:14,
  },
  aiItem: {
    display:'flex', alignItems:'center', gap:11,
    background:'linear-gradient(135deg, rgba(139,92,246,0.07), rgba(255,154,60,0.04))',
    border:'1px solid rgba(139,92,246,0.14)',
    borderRadius:14, padding:'11px 13px',
    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  aiAskBtn: {
    width:32, height:32, borderRadius:10, flexShrink:0,
    background:'rgba(139,92,246,0.12)', border:'1.5px solid rgba(139,92,246,0.24)',
    color:'#8b5cf6', fontSize:14, fontWeight:900, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:'Poppins,sans-serif',
    boxShadow:'0 3px 10px rgba(139,92,246,0.18)',
  },

  // ── Category pills
  catRow: {
    display:'flex', gap:8, padding:'14px 16px 10px',
    overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch',
  },

  // ── Count row
  countRow: {
    display:'flex', alignItems:'center', gap:7,
    padding:'2px 16px 10px',
  },
  countText: {
    fontSize:10, color:'#b0a09a', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.5px',
  },
  countSep: { fontSize:10, color:'#d0c8c0' },

  // ── Items list
  list: { display:'flex', flexDirection:'column', gap:0, padding:'0 16px' },

  // ── Disclaimer
  disclaimer: {
    margin:'14px 16px 0',
    padding:'10px 14px',
    background:'rgba(139,120,110,0.05)',
    border:'1px solid rgba(139,120,110,0.14)',
    borderRadius:14,
    fontSize:10, color:'#b0a09a', lineHeight:1.6,
    fontStyle:'italic',
  },
}
