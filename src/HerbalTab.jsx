import React, { useState } from 'react'
import { LeafIcon, SparkleIcon, ChevronIcon, PillIcon, TargetIcon, ChatIcon } from './Icons'
import { authHeaders } from './supabase'

// ─── PALETTE (clair — fond de page abricot) ──────────────────────────────────
const GLASS_BG     = 'rgba(255,248,242,0.75)'
const GLASS_BORDER = '1px solid rgba(200,123,82,0.18)'
const TXT_MAIN     = 'rgba(200,123,82,0.90)'
const TXT_SOFT     = 'rgba(200,123,82,0.70)'
const ACCENT       = '#E8962A'
const GREEN        = '#22c55e'
const CTA_GRAD     = 'rgba(255,235,210,0.32)'

// ─── LOCAL SVG ICONS (style Icons.jsx : viewBox 24, stroke) ──────────────────
function WarnTriangleIcon({ color = '#ef4444', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function LinkChainIcon({ color = '#E8962A', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CATS = [
  { id:'beaute',     label:'Beauté',     color:'#E8962A' },
  { id:'plantes',    label:'Plantes',    color:'#22c55e' },
  { id:'tisanes',    label:'Tisanes',    color:'#E8962A' },
  { id:'chinoise',   label:'Méd. chin.', color:'#C87B52' },
  { id:'holistique', label:'Holistique', color:'#22c55e' },
]

const DATA = {
  // ── BEAUTÉ — recettes de grand-mère, cheveux et peau ────────────────────
  // Chaque fiche porte ses ingrédients et sa préparation : une recette sans
  // dosage ni mode d'emploi ne sert à rien.
  // Les recettes très populaires mais réellement mauvaises (citron au soleil,
  // bicarbonate, dentifrice) sont volontairement écartées et rassemblées dans
  // la dernière fiche, qui explique pourquoi.
  // Ni féminin ni masculin : cuir chevelu gras et chute de cheveux concernent
  // tout le monde (Solenn vise les deux).
  beaute: [
    { nom:'Bain d\'huile de ricin', tag:'Cheveux', color:'#C87B52',
      benefice:'Densifie, freine la chute et nourrit le cuir chevelu',
      usage:'1 fois par semaine, en cure de 6 semaines',
      ingredients:['2 c. à soupe d\'huile de ricin', '2 c. à soupe d\'huile de jojoba ou d\'olive'],
      prepa:['Tiédir le mélange au bain-marie', 'Masser le cuir chevelu 5 minutes, par petits cercles', 'Laisser poser 1 h, cheveux enroulés dans une serviette', 'Deux shampoings doux pour tout retirer'],
      detail:'Le ricin est très épais : pur, il est presque impossible à rincer, d\'où le mélange avec une huile fluide. Le massage compte autant que l\'huile, c\'est lui qui relance la microcirculation du bulbe.',
      precaution:'À espacer si ton cuir chevelu est déjà gras.' },
    { nom:'Rinçage au vinaigre de cidre', tag:'Cheveux', color:'#E8962A',
      benefice:'Redonne de la brillance et calme les pellicules',
      usage:'1 fois par semaine, après le shampoing',
      ingredients:['1 c. à soupe de vinaigre de cidre', '500 ml d\'eau froide'],
      prepa:['Mélanger dans une bouteille', 'Verser lentement sur les longueurs après le shampoing', 'Rincer rapidement à l\'eau froide'],
      detail:'L\'acidité resserre les écailles du cheveu, ce qui le rend lisse et réfléchissant. L\'odeur disparaît complètement au séchage.',
      precaution:'Jamais pur, et jamais sur un cuir chevelu irrité ou griffé.' },
    { nom:'Masque œuf et miel', tag:'Cheveux', color:'#E8962A',
      benefice:'Répare les longueurs sèches et les pointes abîmées',
      usage:'Tous les quinze jours',
      ingredients:['1 jaune d\'œuf', '1 c. à soupe de miel liquide', '1 c. à soupe d\'huile d\'olive'],
      prepa:['Fouetter jusqu\'à obtenir une texture homogène', 'Appliquer sur les longueurs et les pointes, pas sur les racines', 'Laisser poser 20 minutes', 'Rincer à l\'eau TIÈDE, jamais chaude'],
      detail:'Les protéines du jaune comblent les écailles ouvertes, le miel retient l\'eau dans la fibre. L\'eau chaude est le seul vrai piège : elle cuit l\'œuf dans les cheveux.',
      precaution:'À éviter en cas d\'allergie à l\'œuf, même légère.' },
    { nom:'Rhassoul sur cuir chevelu gras', tag:'Cheveux', color:'#22c55e',
      benefice:'Absorbe l\'excès de sébum sans décaper la fibre',
      usage:'1 fois par semaine au maximum',
      ingredients:['3 c. à soupe de rhassoul en poudre', 'Eau tiède ou hydrolat, jusqu\'à obtenir une pâte'],
      prepa:['Mélanger dans un bol NON métallique, avec une cuillère en bois', 'Appliquer uniquement sur les racines', 'Laisser 10 minutes sans laisser sécher', 'Rincer très abondamment'],
      detail:'Le rhassoul capte le sébum par échange d\'ions au lieu de le dissoudre, contrairement à un shampoing détergent qui provoque un effet rebond.',
      precaution:'Ni bol ni cuillère en métal, cela désactive l\'argile. Plus d\'une fois par semaine, ça assèche.' },
    { nom:'Cure d\'ortie', tag:'Cheveux', color:'#22c55e',
      benefice:'Reminéralise de l\'intérieur, contre la chute saisonnière',
      usage:'1 à 2 tasses par jour, cure de 3 semaines',
      ingredients:['2 c. à café d\'ortie séchée', '250 ml d\'eau frémissante'],
      prepa:['Verser l\'eau sur l\'ortie', 'Couvrir et laisser infuser 10 minutes', 'Filtrer et boire'],
      detail:'L\'ortie est riche en fer, en silice et en zinc, les trois carences qui se voient le plus vite dans les cheveux. Elle est déjà dans les fiches Plantes, ici c\'est son usage capillaire.',
      precaution:'À éviter sous anticoagulant ou diurétique, et pendant la grossesse. Demande l\'avis de ton médecin.' },
    { nom:'Masque à l\'argile verte', tag:'Peau', color:'#22c55e',
      benefice:'Absorbe l\'excès de sébum et resserre les pores',
      usage:'1 fois par semaine',
      ingredients:['2 c. à soupe d\'argile verte', 'Eau florale ou eau, jusqu\'à obtenir une pâte', '1 c. à café de miel'],
      prepa:['Mélanger dans un bol non métallique', 'Appliquer en couche épaisse en évitant le contour des yeux', 'Laisser 10 minutes SANS laisser sécher, vaporiser un peu d\'eau si ça tire', 'Rincer à l\'eau tiède'],
      detail:'La règle est toujours la même avec l\'argile : elle travaille tant qu\'elle est humide. Une fois craquelée, elle tire l\'eau de la peau au lieu du sébum.',
      precaution:'Jamais jusqu\'à craquelure, c\'est ce qui provoque tiraillements et rebond de sébum.' },
    { nom:'Miel de thym sur les boutons', tag:'Peau', color:'#E8962A',
      benefice:'Assainit et accélère la cicatrisation sans dessécher',
      usage:'2 à 3 fois par semaine, en local',
      ingredients:['1 c. à café de miel de thym ou de manuka'],
      prepa:['Appliquer en couche fine sur la zone concernée', 'Laisser poser 15 minutes', 'Rincer à l\'eau tiède'],
      detail:'Le miel est naturellement antibactérien et hygroscopique : il prive les bactéries de l\'eau dont elles ont besoin, tout en gardant la peau souple. Le miel de thym et le manuka sont les plus actifs.',
      precaution:'À éviter en cas d\'allergie aux produits de la ruche.' },
    { nom:'Avoine colloïdale', tag:'Peau', color:'#C87B52',
      benefice:'Apaise les rougeurs, les tiraillements et les démangeaisons',
      usage:'Dès que la peau chauffe ou tire',
      ingredients:['3 c. à soupe de flocons d\'avoine', '2 c. à soupe d\'eau tiède ou de yaourt nature'],
      prepa:['Mixer les flocons en poudre la plus fine possible', 'Mélanger jusqu\'à obtenir une crème', 'Appliquer et laisser 10 minutes', 'Rincer à l\'eau tiède'],
      detail:'Ce n\'est pas qu\'une recette de grand-mère : l\'avoine colloïdale est utilisée en dermatologie, ses avénanthramides sont reconnues anti-inflammatoires et apaisent les peaux réactives.',
      precaution:null },
    { nom:'Gel d\'aloe vera', tag:'Peau', color:'#22c55e',
      benefice:'Hydrate, calme les coups de soleil et les peaux échauffées',
      usage:'Matin et soir sur peau propre',
      ingredients:['Gel d\'aloe vera pur, 98 % minimum'],
      prepa:['Appliquer une couche fine sur peau propre', 'Laisser pénétrer une minute', 'Ajouter une crème par-dessus si ta peau est sèche'],
      detail:'L\'aloe hydrate mais ne retient pas l\'eau seul : sans crème par-dessus, sur peau sèche, l\'effet ne tient pas la journée.',
      precaution:'Teste dans le pli du coude 24 h avant, l\'aloe est allergisant chez certaines personnes.' },
    { nom:'Eau de rose', tag:'Peau', color:'#E8962A',
      benefice:'Ravive un teint terne et décongestionne les cernes',
      usage:'Matin et soir',
      ingredients:['Hydrolat de rose de Damas'],
      prepa:['Vaporiser sur le visage propre', 'Tapoter du bout des doigts sans frotter', 'Pour les cernes : compresses imbibées et bien froides, 5 minutes sur les yeux fermés'],
      detail:'Astringent doux qui rééquilibre le pH après le nettoyage. Sur les cernes, c\'est surtout le froid qui agit, en resserrant les vaisseaux.',
      precaution:'Choisis un hydrolat sans conservateur et garde-le au réfrigérateur.' },
    { nom:'Ce qu\'il ne faut PAS faire', tag:'À éviter', color:'#ef4444',
      benefice:'Trois recettes très répandues qui abîment vraiment la peau',
      usage:'À bannir, quoi qu\'on lise ailleurs',
      ingredients:['Citron sur la peau', 'Bicarbonate de soude en gommage', 'Dentifrice sur un bouton'],
      prepa:['Citron : photosensibilisant, il provoque de vraies brûlures et des taches durables au moindre rayon de soleil', 'Bicarbonate : son pH très basique détruit le film hydrolipidique, la peau se défend en produisant plus de sébum', 'Dentifrice : le menthol et les agents blanchissants brûlent la zone et laissent souvent une marque plus visible que le bouton'],
      detail:'Ces trois-là reviennent partout parce qu\'elles donnent une sensation immédiate de propreté ou de picotement, qu\'on prend pour de l\'efficacité. C\'est de l\'irritation.',
      precaution:'Si une recette pique, chauffe ou rougit, rince immédiatement. Une bonne recette ne fait rien sentir.' },
  ],

  plantes: [
    { nom:'Ashwagandha',   tag:'Adaptogène',      color:'#22c55e', benefice:'Réduit le cortisol et améliore la résistance au stress', usage:'250–500 mg/jour le matin', detail:'Plante ayurvédique connue comme "ginseng indien". Améliore l\'endurance mentale et physique, réduit l\'anxiété et régule le cycle veille-sommeil.' },
    { nom:'Curcuma',       tag:'Anti-inflammatoire', color:'#E8962A', benefice:'Neutralise l\'inflammation chronique et protège le foie', usage:'1 c.à.c + poivre noir + huile, matin', detail:'La curcumine est 1000× plus biodisponible avec de la pipérine (poivre noir). Puissant antioxydant, soutient les articulations et la digestion.' },
    { nom:'Gingembre',     tag:'Digestif',        color:'#C87B52', benefice:'Stimule la digestion et booste l\'immunité naturellement', usage:'Frais ou tisane, 2–3 g/jour', detail:'Anti-nausée cliniquement prouvé. Réduit les douleurs musculaires post-entraînement et stimule la thermogenèse (brûle les graisses).' },
    { nom:'Rhodiola Rosea',tag:'Énergie',         color:'#22c55e', benefice:'Combat la fatigue physique et améliore la concentration', usage:'200–400 mg le matin, à jeun', detail:'Plante des montagnes arctiques utilisée par les cosmonautes soviétiques. Réduit le stress oxydatif et améliore les fonctions cognitives sous pression.' },
    { nom:'Valériane',     tag:'Sommeil',         color:'#E8962A', benefice:'Facilite l\'endormissement sans accoutumance', usage:'300–600 mg, 1h avant le coucher', detail:'Augmente le GABA naturellement, favorisant un sommeil profond. Idéale en cure de 4 semaines. Pas d\'effet le lendemain matin.' },
    { nom:'Ginkgo Biloba', tag:'Mémoire',         color:'#C87B52', benefice:'Améliore la circulation cérébrale et la mémoire', usage:'120–240 mg/jour avec un repas', detail:'Un des suppléments les plus étudiés au monde. Augmente le flux sanguin vers le cerveau et protège les neurones du stress oxydatif.' },
    { nom:'Chardon-marie', tag:'Foie',            color:'#22c55e', benefice:'Régénère et détoxifie les cellules hépatiques', usage:'140 mg de silymarine, 3× par jour', detail:'La silymarine bloque les toxines et stimule la régénération cellulaire hépatique. Incontournable après antibiotiques, alcool ou médicaments.' },
    { nom:'Ortie',         tag:'Minéraux',        color:'#E8962A', benefice:'Reminéralise l\'organisme et combat la fatigue de fond', usage:'Tisane ou gélules, cure de 3 semaines', detail:'Riche en fer, magnésium, silice et vitamines K et C. Excellent dépuratif. Aide contre l\'anémie, les douleurs articulaires et la chute de cheveux.' },
  ],
  tisanes: [
    { nom:'Camomille',       tag:'Apaisante',   color:'#E8962A', benefice:'Calme l\'anxiété et prépare au sommeil en douceur', usage:'1 tasse le soir, 8–10 min d\'infusion', detail:'L\'apigénine se lie aux récepteurs GABA (comme les anxiolytiques). Réduit l\'inflammation intestinale et soulage les coliques.' },
    { nom:'Menthe poivrée',  tag:'Digestive',   color:'#22c55e', benefice:'Soulage les ballonnements et les douleurs intestinales', usage:'Après les repas, 2 tasses/jour max', detail:'Le menthol relâche la musculature lisse digestive. Cliniquement efficace contre le SII. Éviter en cas de reflux gastro-œsophagien.' },
    { nom:'Hibiscus',        tag:'Cardio',      color:'#ef4444', benefice:'Réduit naturellement la tension artérielle', usage:'2–3 tasses/jour, froid ou chaud', detail:'Les anthocyanines réduisent la pression systolique de 7 points en 4 semaines (méta-analyse). Riche en vitamine C et antioxydants.' },
    { nom:'Rooibos',         tag:'Antioxydant', color:'#E8962A', benefice:'Zéro caféine — riche en antioxydants uniques', usage:'Sans restriction, toute la journée', detail:'Contient de l\'aspalathin (molécule unique), anti-diabétique et anti-inflammatoire. Idéal le soir, naturellement sucré et doux.' },
    { nom:'Tilleul',         tag:'Stress',      color:'#22c55e', benefice:'Relâche les tensions nerveuses et musculaires', usage:'1–2 tasses en fin d\'après-midi', detail:'Flavonoïdes sédatifs légers utilisés depuis le Moyen-Âge. Efficace contre les maux de tête de tension, l\'anxiété et l\'hypertension légère.' },
    { nom:'Gingembre-citron',tag:'Immunité',    color:'#C87B52', benefice:'Renforce les défenses immunitaires quotidiennement', usage:'Matin à jeun avec une cuillère de miel', detail:'Synergie puissante : gingerols (anti-infectieux) + vitamine C + enzymes du miel. Le miel de Manuka amplifie les propriétés antibactériennes.' },
  ],
  chinoise: [
    { nom:'Acupuncture',     tag:'Méridiens',  color:'#C87B52', benefice:'Rééquilibre le Qi et soulage les douleurs chroniques', usage:'45–60 min, 1 séance/semaine', detail:'Stimulation de points précis sur les méridiens. Prouvée efficace pour : douleur chronique, insomnie, anxiété, fertilité et migraines.' },
    { nom:'Reishi',          tag:'Longévité',  color:'#22c55e', benefice:'"Champignon de l\'immortalité" — immunité et longévité', usage:'1–2 g/jour en poudre dans une boisson chaude', detail:'Modifie le microbiome intestinal et renforce les cellules NK (natural killers). Utilisé depuis 4000 ans en médecine chinoise. Anti-tumoral étudié.' },
    { nom:'Ginseng Panax',   tag:'Vitalité',   color:'#E8962A', benefice:'Tonique général qui améliore énergie et libido', usage:'200–400 mg/jour le matin', detail:'Les ginsénosides Rg1 et Rb1 améliorent les performances cognitives et physiques. Le ginseng rouge coréen est le plus concentré et le plus étudié.' },
    { nom:'Moxibustion',     tag:'Chaleur',    color:'#ef4444', benefice:'Stimule les méridiens par la chaleur pour soulager', usage:'Avec un praticien qualifié', detail:'Combustion de l\'armoise près de points d\'acupuncture. Idéale pour : arthrite, douleurs menstruelles, digestion lente et fatigue chronique profonde.' },
    { nom:'Astragale',       tag:'Immunité',   color:'#22c55e', benefice:'Renforce l\'immunité en profondeur et ralentit le vieillissement', usage:'500 mg, 2× par jour, cure de 3 mois', detail:'Allonge les télomères (marqueurs du vieillissement cellulaire). Utilisé en complément de la chimiothérapie pour réduire les effets secondaires.' },
    { nom:'Qi Gong',         tag:'Énergie',    color:'#C87B52', benefice:'Harmonise corps, souffle et esprit par le mouvement', usage:'20 min le matin à jeun, quotidiennement', detail:'+800 études scientifiques. Réduit la tension artérielle, renforce l\'immunité et améliore l\'équilibre mental. Idéal pour tous les âges.' },
  ],
  holistique: [
    { nom:'Cohérence cardiaque', tag:'Système nerveux', color:'#ef4444', benefice:'Régule le stress en 5 minutes, cortisol −20%', usage:'5-5 : 5 inspirations/min, 3× par jour', detail:'L\'IHM Institute : la cohérence cardiaque augmente la sérotonine et la DHEA. Application gratuite recommandée : RespiRelax+. Posture debout pour maximiser.' },
    { nom:'Bain de forêt',       tag:'Shinrin-yoku', color:'#22c55e', benefice:'Phytoncides des arbres : cortisol −15%, NK +50%', usage:'2h minimum en forêt sans téléphone', detail:'Les cellules NK (anti-cancer) augmentent pendant 30 jours après 3h en forêt. Les phytoncides (composés volatils des arbres) traversent les poumons.' },
    { nom:'Thérapie par le froid',tag:'Dopamine',   color:'#C87B52', benefice:'Dopamine +250%, inflammation réduite, volonté renforcée', usage:'Douche froide 30s → 3 min progressivement', detail:'La noradrénaline monte de 300% (Wim Hof Institute). Réduit l\'inflammation chronique, améliore la récupération musculaire et renforce la résilience mentale.' },
    { nom:'Earthing',            tag:'Électrons',   color:'#E8962A', benefice:'Neutralise les radicaux libres via les électrons du sol', usage:'20 min pieds nus sur sol naturel/herbe', detail:'Les électrons libres de la terre neutralisent les radicaux libres inflammatoires. Améliore le sommeil, réduit la douleur et régule les rythmes circadiens.' },
    { nom:'Méditation MBSR',     tag:'Neuroplasticité', color:'#22c55e', benefice:'Recâble le cerveau en 8 semaines — Harvard prouvé', usage:'10–20 min/jour, app ou guidance', detail:'L\'étude Harvard : augmentation de la matière grise après 8 semaines. L\'amygdale (siège de la peur) réduit de façon mesurable. MBSR = Mindfulness-Based Stress Reduction.' },
    { nom:'Luminothérapie',      tag:'Rythme circadien', color:'#C87B52', benefice:'Régule la mélatonine et traite la dépression saisonnière', usage:'10 000 lux, 20–30 min le matin au réveil', detail:'Efficacité comparable aux antidépresseurs pour le TAS (trouble affectif saisonnier). Synchronise l\'horloge interne et améliore l\'énergie matinale.' },
  ],
}

// ─── HERO BACKGROUND (aurora animated, dark glass version) ───────────────────
function HeroBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', borderRadius:'inherit' }}>
      {/* Animated aurora gradient — subtle warm/green glow on dark */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(-45deg, rgba(34,197,94,0.14), rgba(255,248,242,0.10), rgba(232,150,42,0.12), rgba(34,197,94,0.08), rgba(200,123,82,0.12))',
        backgroundSize:'400% 400%',
        animation:'heroGradient 10s ease infinite',
      }} />
      {/* Floating orbs */}
      <div style={{
        position:'absolute', top:'-20%', right:'-6%', width:260, height:260,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 65%)',
        animation:'floatOrb 8s ease-in-out infinite', filter:'blur(8px)',
      }} />
      <div style={{
        position:'absolute', bottom:'-12%', left:'-5%', width:200, height:200,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(232,150,42,0.18) 0%, transparent 65%)',
        animation:'floatOrb 12s ease-in-out infinite reverse', filter:'blur(8px)',
      }} />
      <div style={{
        position:'absolute', top:'35%', left:'18%', width:120, height:120,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.30) 0%, transparent 65%)',
        animation:'floatOrb 6s ease-in-out infinite', filter:'blur(8px)',
      }} />
    </div>
  )
}

// ─── AI RECO EXPANDABLE CARD ──────────────────────────────────────────────────
function AIRecoCard({ r, onChat, index }) {
  const [open, setOpen]       = useState(false)
  const [pressed, setPressed] = useState(false)
  const c = GREEN

  return (
    <div
      style={{
        background:'rgba(34,197,94,0.10)', border:'1px solid rgba(34,197,94,0.22)', borderRadius:16,
        overflow:'hidden',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
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
        <span style={{ flexShrink:0, display:'flex' }}><LeafIcon color={c} size={22} /></span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:2 }}>
            <span style={{ fontSize:13, fontWeight:700, color:TXT_MAIN }}>{r.nom}</span>
            {r.tag && (
              <span style={{
                fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:12,
                background:'rgba(34,197,94,0.12)', color:c, border:'1px solid rgba(34,197,94,0.25)',
                textTransform:'uppercase', letterSpacing:'0.4px',
              }}>{r.tag}</span>
            )}
          </div>
          <div style={{ fontSize:11.5, color:TXT_SOFT, lineHeight:1.4 }}>{r.benefice}</div>
        </div>
        <div style={{
          width:28, height:28, borderRadius:'50%', flexShrink:0,
          background:'rgba(34,197,94,0.10)', border:'1px solid rgba(34,197,94,0.22)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <ChevronIcon color={c} size={12} direction="down" />
        </div>
      </div>

      {/* Expanded details */}
      <div style={{ overflow:'hidden', maxHeight: open ? 520 : 0, transition:'max-height 0.38s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid rgba(34,197,94,0.18)' }}>

          {/* Pourquoi — personnalisé */}
          {r.pourquoi && (
            <div style={{
              background:'rgba(34,197,94,0.08)',
              border:'1px solid rgba(34,197,94,0.20)', borderRadius:12,
              padding:'10px 12px', margin:'10px 0 8px',
            }}>
              <div style={{ fontSize:9, color:ACCENT, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:4 }}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><TargetIcon size={9} color={ACCENT} /> Pourquoi pour toi ?</span>
              </div>
              <div style={{ fontSize:12, color:'rgba(200,123,82,0.85)', lineHeight:1.72 }}>{r.pourquoi}</div>
            </div>
          )}

          {/* Usage */}
          {r.usage && (
            <div style={{
              display:'flex', gap:9, alignItems:'flex-start',
              background:'rgba(232,150,42,0.10)', border:'1px solid rgba(232,150,42,0.22)',
              borderRadius:12, padding:'10px 12px', marginBottom:8,
            }}>
              <span style={{ flexShrink:0, display:'flex' }}><PillIcon size={16} color={ACCENT} /></span>
              <div>
                <div style={{ fontSize:9, color:ACCENT, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:3 }}>
                  Comment utiliser
                </div>
                <div style={{ fontSize:12, color:TXT_MAIN, fontWeight:600, lineHeight:1.55 }}>{r.usage}</div>
              </div>
            </div>
          )}

          {/* Précaution */}
          {r.precaution && (
            <div style={{
              display:'flex', gap:8, alignItems:'flex-start',
              fontSize:11.5, color:'rgba(200,123,82,0.85)',
              background:'rgba(239,68,68,0.10)', borderRadius:12,
              padding:'8px 11px', marginBottom:8,
              border:'1px solid rgba(239,68,68,0.25)', lineHeight:1.55,
            }}>
              <span style={{ flexShrink:0, display:'flex', marginTop:2 }}><WarnTriangleIcon color="#ef4444" size={13} /></span>
              <span><strong style={{ color:'#ef4444' }}>Précaution :</strong> {r.precaution}</span>
            </div>
          )}

          {/* Synergie */}
          {r.synergie && (
            <div style={{
              display:'flex', gap:8, alignItems:'flex-start',
              fontSize:11.5, color:'rgba(200,123,82,0.85)',
              background:'rgba(232,150,42,0.08)', borderRadius:12,
              padding:'8px 11px', marginBottom:10,
              border:'1px solid rgba(232,150,42,0.20)', lineHeight:1.55,
            }}>
              <span style={{ flexShrink:0, display:'flex', marginTop:2 }}><LinkChainIcon color={ACCENT} size={13} /></span>
              <span><strong style={{ color:ACCENT }}>Synergie :</strong> {r.synergie}</span>
            </div>
          )}

          <button
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'9px 15px', borderRadius:12,
              background:CTA_GRAD,
              border:'1px solid rgba(255,220,160,0.38)', color:'#B2663E',
              fontSize:11, fontWeight:800, cursor:'pointer',
              fontFamily:'Poppins,sans-serif',
              boxShadow:'0 4px 14px rgba(200,123,82,0.35)',
            }}
            onClick={e => { e.stopPropagation(); onChat(`Parle-moi en détail de ${r.nom} selon mon profil`) }}
          >
            <ChatIcon color="#fff" size={13} /> En savoir plus →
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
        method:'POST', headers:{'Content-Type':'application/json', ...(await authHeaders())},
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
            <SparkleIcon color={ACCENT} size={22} />
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
              style={{ ...hb.aiCta, background:'rgba(232,150,42,0.12)', color:ACCENT,
                border:'1px solid rgba(232,150,42,0.35)', boxShadow:'none', fontSize:10 }}
              onClick={() => setItems(null)}
            >
              Refaire
            </button>
          )}
        </div>

        {items && (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8, borderTop:'1px solid rgba(200,123,82,0.18)', paddingTop:14 }}>
            {items.map((r, i) => (
              <AIRecoCard key={i} r={r} onChat={onChat} index={i} />
            ))}
          </div>
        )}

        {err && (
          <div style={{ fontSize:11, color:'#ef4444', marginTop:10, fontWeight:600 }}>
            Erreur de connexion. Réessaie.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HERB ITEM — glass card with expand ──────────────────────────────────────
function HerbItem({ item, onChat }) {
  const [open, setOpen] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <div style={{
      background: GLASS_BG,
      backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
      border: GLASS_BORDER,
      borderRadius: 20,
      marginBottom: 10,
      overflow: 'hidden',
      transform: pressed ? 'scale(0.985)' : 'scale(1)',
      transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
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
            {/* Pastille discrète — couleur du remède */}
            <span style={{
              width:7, height:7, borderRadius:'50%', flexShrink:0,
              background:item.color, opacity:0.85, display:'inline-block',
            }} />
            <span style={{ fontSize:14, fontWeight:800, color:TXT_MAIN, letterSpacing:'-0.2px' }}>{item.nom}</span>
            <span style={{
              fontSize:9, fontWeight:800, padding:'3px 9px', borderRadius:12,
              background:'rgba(232,150,42,0.12)', color:ACCENT,
              border:'1px solid rgba(232,150,42,0.25)', letterSpacing:'0.4px', textTransform:'uppercase',
            }}>
              {item.tag}
            </span>
          </div>
          <div style={{ fontSize:12, color:TXT_SOFT, lineHeight:1.45, fontWeight:500 }}>{item.benefice}</div>
        </div>
        {/* Chevron in glass circle */}
        <div style={{
          width:30, height:30, borderRadius:'50%', flexShrink:0,
          background:'rgba(200,123,82,0.08)', border:'1px solid rgba(200,123,82,0.20)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <ChevronIcon color="rgba(200,123,82,0.70)" size={13} direction="down" />
        </div>
      </div>

      {/* Expanded content */}
      <div style={{
        overflow:'hidden',
        // 320 px suffisaient pour une plante, pas pour une recette complete :
        // ingredients + preparation + precaution depassent largement et se
        // faisaient couper (2026-08-11).
        maxHeight: open ? (item.ingredients ? 1200 : 320) : 0,
        transition:'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          padding:'0 15px 15px',
          borderTop:'1px solid rgba(200,123,82,0.18)',
        }}>
          {/* Usage box — vert par defaut. Rouge sur la fiche des recettes a
              proscrire : un encadre vert intitule « Comment utiliser » pour dire
              « a bannir » se contredit lui-meme. */}
          <div style={{
            display:'flex', alignItems:'flex-start', gap:11,
            background: item.tag === 'À éviter' ? 'rgba(239,68,68,0.09)' : 'rgba(34,197,94,0.10)',
            border: item.tag === 'À éviter' ? '1px solid rgba(239,68,68,0.22)' : '1px solid rgba(34,197,94,0.20)',
            borderRadius:12, padding:'11px 13px', margin:'12px 0 10px',
          }}>
            <div style={{
              width:10, height:10, borderRadius:'50%',
              background:item.color, opacity:0.9,
              marginTop:3, flexShrink:0,
            }} />
            <div>
              <div style={{ fontSize:9, color:ACCENT, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px' }}>
                {item.tag === 'À éviter' ? 'À ne pas faire' : 'Comment utiliser'}
              </div>
              <div style={{ fontSize:12, color:TXT_MAIN, fontWeight:700, marginTop:2, lineHeight:1.4 }}>
                {item.usage}
              </div>
            </div>
          </div>
          {/* Ingredients — recettes de la categorie Beaute */}
          {item.ingredients && (
            <div style={{ marginBottom:11 }}>
              <div style={{ fontSize:9, color:ACCENT, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>
                Il te faut
              </div>
              {item.ingredients.map((ing, k) => (
                <div key={k} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:4 }}>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:item.color, opacity:0.8, flexShrink:0, marginTop:6 }} />
                  <span style={{ fontSize:12, color:TXT_MAIN, lineHeight:1.45 }}>{ing}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preparation, etape par etape */}
          {item.prepa && (
            <div style={{ marginBottom:11 }}>
              <div style={{ fontSize:9, color:ACCENT, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>
                {item.tag === 'À éviter' ? 'Pourquoi' : 'La recette'}
              </div>
              {item.prepa.map((etape, k) => (
                <div key={k} style={{ display:'flex', alignItems:'flex-start', gap:9, marginBottom:6 }}>
                  <span style={{
                    width:17, height:17, borderRadius:'50%', flexShrink:0, marginTop:1,
                    background:'rgba(232,150,42,0.14)', border:'1px solid rgba(232,150,42,0.30)',
                    color:ACCENT, fontSize:9, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{k + 1}</span>
                  <span style={{ fontSize:12, color:TXT_SOFT, lineHeight:1.5 }}>{etape}</span>
                </div>
              ))}
            </div>
          )}

          {/* Precaution — rouge, comme les mises en garde deja presentes */}
          {item.precaution && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:9,
              background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.20)',
              borderRadius:12, padding:'10px 12px', marginBottom:11,
            }}>
              <span style={{ marginTop:1, flexShrink:0 }}><WarnTriangleIcon size={13} /></span>
              <span style={{ fontSize:11.5, color:TXT_SOFT, lineHeight:1.5 }}>{item.precaution}</span>
            </div>
          )}

          {/* Detail text */}
          <div style={{ fontSize:12, color:TXT_SOFT, lineHeight:1.75, marginBottom:12 }}>
            {item.detail}
          </div>
          {/* CTA button */}
          <button
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'9px 16px', borderRadius:12,
              background:CTA_GRAD,
              border:'1px solid rgba(255,220,160,0.38)',
              color:'#B2663E', fontSize:11, fontWeight:800,
              cursor:'pointer', fontFamily:'Poppins,sans-serif',
              boxShadow:'0 4px 14px rgba(200,123,82,0.35)',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
            onClick={e => {
              e.stopPropagation()
              onChat(`Explique-moi comment utiliser ${item.nom} selon mon profil`)
            }}
          >
            <ChatIcon color="#fff" size={13} /> Conseils personnalisés →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
// catInitiale : « Tes outils » propose une entree Beaute qui doit ouvrir
// directement sur cette categorie. Sans ca la page s'ouvrait toujours sur
// Plantes et l'entree mentait sur sa destination.
export default function HerbalTab({ profil, onChat, onBack, catInitiale = 'plantes' }) {
  const [cat, setCat] = useState(catInitiale)
  const items = DATA[cat] || []

  return (
    <div style={hb.page}>

      {/* ── Aurora Hero Header ── */}
      <div style={{ ...hb.hero }}>
        <HeroBg />
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          {/* Leaf icon — warm gradient */}
          <div style={{
            width:64, height:64, borderRadius:20,
            background:CTA_GRAD,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 28px rgba(200,123,82,0.40), 0 2px 6px rgba(232,150,42,0.30)',
            animation:'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <LeafIcon color="#fff" size={28} />
          </div>
          {/* Title */}
          <div style={{
            fontSize:28, fontWeight:600, color:TXT_MAIN,
            fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic',
            letterSpacing:'-0.5px', textAlign:'center', lineHeight:1.1,
          }}>
            Santé Naturelle
          </div>
          {/* Subtitle badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:GLASS_BG,
            backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
            border:GLASS_BORDER,
            borderRadius:20, padding:'5px 14px',
            fontSize:11, color:'rgba(200,123,82,0.75)', fontWeight:600,
          }}>
            <LeafIcon color={GREEN} size={13} /> Plantes · Médecine Chinoise · Holistic
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
                flexShrink:0, padding:'10px 20px', borderRadius:20,
                border: active ? '1px solid rgba(232,150,42,0.45)' : '1px solid rgba(200,123,82,0.16)',
                fontSize:12, fontWeight:700,
                cursor:'pointer', fontFamily:'Poppins,sans-serif',
                whiteSpace:'nowrap',
                background: active
                  ? CTA_GRAD
                  : 'rgba(200,123,82,0.06)',
                backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
                color: active ? '#fff' : 'rgba(200,123,82,0.65)',
                boxShadow: active
                  ? '0 6px 20px rgba(200,123,82,0.35)'
                  : 'none',
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
          background:CTA_GRAD,
          boxShadow:'0 2px 6px rgba(232,150,42,0.40)',
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
        <span style={{ flexShrink:0, display:'flex', marginTop:1 }}><WarnTriangleIcon color="#ef4444" size={13} /></span>
        <span>À titre éducatif uniquement. Consulte un professionnel de santé avant tout supplément, particulièrement si tu prends des médicaments.</span>
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

  // ── AI box — glass card
  aiBox: {
    position:'relative',
    margin:'14px 16px 4px',
    borderRadius:20,
    padding:'16px 16px',
    border:GLASS_BORDER,
    background:GLASS_BG,
    backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
    overflow:'hidden',
  },
  aiBoxTint: {
    position:'absolute', inset:0, zIndex:0, borderRadius:'inherit',
    background:'linear-gradient(145deg, rgba(232,150,42,0.08), rgba(34,197,94,0.05))',
    pointerEvents:'none',
  },
  aiTop: { display:'flex', alignItems:'center', gap:12 },
  aiIconWrap: {
    width:44, height:44, borderRadius:16, flexShrink:0,
    background:'linear-gradient(135deg, rgba(232,150,42,0.16), rgba(200,123,82,0.12))',
    border:'1px solid rgba(232,150,42,0.30)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  aiTitle: { fontSize:14, fontWeight:800, color:TXT_MAIN, letterSpacing:'-0.2px' },
  aiSub: { fontSize:10, color:'rgba(200,123,82,0.65)', fontWeight:600, marginTop:1 },
  aiCta: {
    background:CTA_GRAD,
    color:'#fff', border:'none',
    padding:'9px 16px', borderRadius:12,
    fontSize:11, fontWeight:800, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', flexShrink:0,
    boxShadow:'0 5px 16px rgba(200,123,82,0.38)',
    transition:'opacity 0.15s, transform 0.15s',
  },
  dot: {
    display:'inline-block', width:5, height:5,
    borderRadius:'50%', background:'white',
    animation:'dotPulse 0.7s ease-in-out infinite',
  },
  aiResults: {
    marginTop:14, display:'flex', flexDirection:'column', gap:8,
    borderTop:'1px solid rgba(200,123,82,0.18)', paddingTop:14,
  },
  aiItem: {
    display:'flex', alignItems:'center', gap:11,
    background:'rgba(34,197,94,0.08)',
    border:'1px solid rgba(34,197,94,0.18)',
    borderRadius:12, padding:'11px 13px',
  },
  aiAskBtn: {
    width:32, height:32, borderRadius:12, flexShrink:0,
    background:'rgba(232,150,42,0.12)', border:'1px solid rgba(232,150,42,0.30)',
    color:'#E8962A', fontSize:14, fontWeight:900, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:'Poppins,sans-serif',
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
    fontSize:10, color:'rgba(200,123,82,0.60)', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.5px',
  },
  countSep: { fontSize:10, color:'rgba(200,123,82,0.35)' },

  // ── Items list
  list: { display:'flex', flexDirection:'column', gap:0, padding:'0 16px' },

  // ── Disclaimer
  disclaimer: {
    display:'flex', gap:8, alignItems:'flex-start',
    margin:'14px 16px 0',
    padding:'10px 14px',
    background:'rgba(200,123,82,0.05)',
    border:'1px solid rgba(200,123,82,0.14)',
    borderRadius:12,
    fontSize:10, color:'rgba(200,123,82,0.65)', lineHeight:1.6,
    fontStyle:'italic',
  },
}
