import React, { useState, useEffect, useRef, useMemo } from 'react'
import { formaterPas } from './score'
import { LeafIcon, SparkleIcon, ChevronIcon, PillIcon, TargetIcon, ChatIcon } from './Icons'
import { authHeaders } from './supabase'
import { AMBRE, ENCRE, ICONE, ROUGE } from './palette'
import { croiser, phraseAlerte } from './contreIndications'

// ─── PALETTE (clair, fond de page abricot) ──────────────────────────────────
const GLASS_BG     = 'rgba(var(--rgb-bulle), 0.75)'
const GLASS_BORDER = '1px solid rgba(var(--rgb-terracotta), 0.18)'
const TXT_MAIN     = ENCRE   // etait rgba(var(--rgb-terracotta), 0.90) : 2,18:1 sur 11 textes
const TXT_SOFT     = ENCRE   // etait 1,81:1. Meme encre, la hierarchie passe par la graisse
const ACCENT_FICHE       = AMBRE   // etait var(--or-plein) : 1,73:1 en texte de 9px
// Le vert ne subsiste QUE sur le badge « Étudié », ou il signifie validé.
// Ailleurs il etait decoratif et jurait avec la palette ambre (2026-08-12).
const ETIQUETTE    = ENCRE   // s'appelait GREEN et contenait du terracotta a 2,3:1
const CTA_GRAD     = 'rgba(var(--rgb-creme), 0.32)'

// Le profil courant, pose par HerbalTab au rendu. Les cartes de fiches sont
// definies hors du composant et ne recoivent pas ses props : ce relais evite
// de les reecrire toutes pour une seule information.
let profilCourant = null

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

function LinkChainIcon({ color = 'var(--or-plein)', size = 14 }) {
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
const LABEL_CAT = {
  sommeil: 'mieux dormir', stress: 'moins de stress', '\u00e9nergie': "plus d'\u00e9nergie",
  digestion: 'la digestion', 'immunit\u00e9': 'les d\u00e9fenses', cheveux: 'les cheveux', peau: 'la peau',
}

// Sept onglets alignes a egalite, alors que ce sont DEUX sujets : cinq besoins
// de sante et deux soins exterieurs. Rien ne le disait, il fallait lire les
// sept libelles pour comprendre qu'il y avait deux familles, et la page
// paraissait brouillonne (Jean, 2026-09-01). Le contenu ne bouge pas, seule la
// hierarchie devient visible. C'est aussi ce qui faisait croire que la fiche
// Peau etait rangee sous Cheveux : elle etait simplement derriere, dans une
// rangee qui defilait.
// Troisieme axe, demande par Jean le 2026-09-01 : entrer par l'APPROCHE et
// plus seulement par le besoin. Rien n'est invente, chaque fiche portait deja
// un `tag` : les six « Pratique » sont bien des approches holistiques (bain de
// foret, coherence cardiaque, meditation MBSR, luminotherapie, earthing,
// therapie par le froid), d'ou leur libelle.
const APPROCHES = [
  { id: 'Méd. chinoise', label: 'Médecine chinoise' },
  { id: 'Pratique',      label: 'Holistique' },
  { id: 'Plante',        label: 'Plantes' },
  { id: 'Tisane',        label: 'Tisanes' },
]

const GROUPES = [
  { titre: 'Santé',    ids: ['sommeil', 'stress', 'énergie', 'digestion', 'immunité'] },
  { titre: 'Beauté',   ids: ['cheveux', 'peau'] },
  { titre: 'Approche', ids: APPROCHES.map(a => a.id) },
]

const CATS = [
  { id:'sommeil',   label:'Sommeil',   color:ENCRE },
  { id:'stress',    label:'Stress',    color:ENCRE },
  { id:'énergie',   label:'Énergie',   color: AMBRE },
  { id:'digestion', label:'Digestion', color:ENCRE },
  { id:'immunité',  label:'Immunité',  color: AMBRE },
  { id:'cheveux',   label:'Cheveux',   color:ENCRE },
  { id:'peau',      label:'Peau',      color:ENCRE },
]

// ─── LES FICHES ─────────────────────────────────────────────────
// Une seule liste, classée par BESOIN et non par type de remède.
// Avant : cinq catégories sur deux axes incompatibles (Plantes, Tisanes,
// Méd. chinoise et Holistique classaient par type ; Beauté par partie du
// corps), et 27 étiquettes différentes pour 37 fiches, la plupart utilisées
// une seule fois. Personne ne se dit « je veux une tisane » : on se dit
// « je dors mal ». Le classement demandait donc de connaître la solution
// avant de chercher (refonte Jean 2026-08-11).
// Le type de remède n'est pas perdu, il descend sur la fiche via `tag`.
// `besoins` accepte plusieurs entrées : le gingembre sert la digestion ET
// l'immunité, l'ortie l'immunité ET les cheveux.
const FICHES = [
    { nom:'Valériane', contre:'Sédatifs, anxiolytiques, alcool, grossesse. Ne pas conduire après la prise.', preuve:'Étudié', besoins:['sommeil'],     tag:'Plante',         color: AMBRE, benefice:'Facilite l\'endormissement sans accoutumance', usage:'300–600 mg, 1h avant le coucher', detail:'Augmente le GABA naturellement, favorisant un sommeil profond. Idéale en cure de 4 semaines. Pas d\'effet le lendemain matin.' },
    { nom:'Camomille', contre:'Allergie aux astéracées (marguerite, arnica). Prudence sous anticoagulant.', preuve:'Étudié', besoins:['sommeil'],       tag:'Tisane',   color: AMBRE, benefice:'Calme l\'anxiété et prépare au sommeil en douceur', usage:'1 tasse le soir, 8–10 min d\'infusion', detail:'L\'apigénine se lie aux récepteurs GABA (comme les anxiolytiques). Réduit l\'inflammation intestinale et soulage les coliques.' },
    { nom:'Rooibos', contre:'Aucune contre-indication connue. Prudence en cas de traitement hormonal.', preuve:'Usage traditionnel', besoins:['sommeil'],         tag:'Tisane', color: AMBRE, benefice:'Zéro caféine, riche en antioxydants uniques', usage:'Sans restriction, toute la journée', detail:'Contient de l\'aspalathin (molécule unique), anti-diabétique et anti-inflammatoire. Idéal le soir, naturellement sucré et doux.' },
    { nom:'Tilleul', contre:'Aucune contre-indication majeure. Avis médical en cas de trouble cardiaque.', preuve:'Usage traditionnel', besoins:['sommeil', 'stress'],         tag:'Tisane',      color:ENCRE, benefice:'Relâche les tensions nerveuses et musculaires', usage:'1–2 tasses en fin d\'après-midi', detail:'Flavonoïdes sédatifs légers utilisés depuis le Moyen-Âge. Efficace contre les maux de tête de tension, l\'anxiété et l\'hypertension légère.' },
    { nom:'Earthing', contre:'Aucune. Prudence pieds nus en cas de diabète avec neuropathie.', preuve:'Usage traditionnel', besoins:['sommeil'],            tag:'Pratique',   color: AMBRE, benefice:'Neutralise les radicaux libres via les électrons du sol', usage:'20 min pieds nus sur sol naturel/herbe', detail:'Les électrons libres de la terre neutralisent les radicaux libres inflammatoires. Améliore le sommeil, réduit la douleur et régule les rythmes circadiens.' },
    { nom:'Luminothérapie', contre:'Maladie de la rétine, trouble bipolaire, traitement photosensibilisant. Avis médical avant de commencer.', preuve:'Étudié', besoins:['sommeil', 'énergie'],      tag:'Pratique', color:ENCRE, benefice:'Régule la mélatonine et traite la dépression saisonnière', usage:'10 000 lux, 20–30 min le matin au réveil', detail:'Efficacité comparable aux antidépresseurs pour le TAS (trouble affectif saisonnier). Synchronise l\'horloge interne et améliore l\'énergie matinale.' },
    { nom:'Ashwagandha', contre:'Grossesse, allaitement, troubles thyroïdiens. Interagit avec les immunosuppresseurs et les sédatifs.', preuve:'Étudié', besoins:['stress'],   tag:'Plante',      color:ENCRE, benefice:'Réduit le cortisol et améliore la résistance au stress', usage:'250–500 mg/jour le matin', detail:'Plante ayurvédique connue comme "ginseng indien". Améliore l\'endurance mentale et physique, réduit l\'anxiété et régule le cycle veille-sommeil.' },
    { nom:'Qi Gong', contre:'Aucune. À adapter en cas de trouble de l\'équilibre ou de douleur aiguë.', preuve:'Usage traditionnel', besoins:['énergie', 'stress'],         tag:'Méd. chinoise',    color:ENCRE, benefice:'Harmonise corps, souffle et esprit par le mouvement', usage:'20 min le matin à jeun, quotidiennement', detail:'+800 études scientifiques. Réduit la tension artérielle, renforce l\'immunité et améliore l\'équilibre mental. Idéal pour tous les âges.' },
    { nom:'Cohérence cardiaque', contre:'Aucune.', preuve:'Étudié', besoins:['stress'], tag:'Pratique', color: ROUGE, benefice:'Régule le stress en 5 minutes, cortisol −20%', usage:'5-5 : 5 inspirations/min, 3× par jour', detail:'L\'IHM Institute : la cohérence cardiaque augmente la sérotonine et la DHEA. Application gratuite recommandée : RespiRelax+. Posture debout pour maximiser.' },
    { nom:'Bain de forêt', contre:'Allergies aux pollens en saison.', preuve:'Étudié', besoins:['stress'],       tag:'Pratique', color:ENCRE, benefice:'Phytoncides des arbres : cortisol −15%, NK +50%', usage:'2h minimum en forêt sans téléphone', detail:'Les cellules NK (anti-cancer) augmentent pendant 30 jours après 3h en forêt. Les phytoncides (composés volatils des arbres) traversent les poumons.' },
    { nom:'Méditation MBSR', contre:'Prudence en cas de trouble psychiatrique aigu ou de traumatisme non accompagné : à faire encadrer.', preuve:'Étudié', besoins:['stress'],     tag:'Pratique', color:ENCRE, benefice:'Recâble le cerveau en 8 semaines, Harvard prouvé', usage:'10–20 min/jour, app ou guidance', detail:'L\'étude Harvard : augmentation de la matière grise après 8 semaines. L\'amygdale (siège de la peur) réduit de façon mesurable. MBSR = Mindfulness-Based Stress Reduction.' },
    { nom:'Rhodiola Rosea', contre:'Trouble bipolaire, grossesse, allaitement. Interagit avec les antidépresseurs.', preuve:'Étudié', besoins:['énergie'],tag:'Plante',         color:ENCRE, benefice:'Combat la fatigue physique et améliore la concentration', usage:'200–400 mg le matin, à jeun', detail:'Plante des montagnes arctiques utilisée par les cosmonautes soviétiques. Réduit le stress oxydatif et améliore les fonctions cognitives sous pression.' },
    { nom:'Ginkgo Biloba', contre:'Anticoagulants et antiagrégants, épilepsie. À suspendre avant une chirurgie.', preuve:'Étudié', besoins:['énergie'], tag:'Plante',         color:ENCRE, benefice:'Améliore la circulation cérébrale et la mémoire', usage:'120–240 mg/jour avec un repas', detail:'Un des suppléments les plus étudiés au monde. Augmente le flux sanguin vers le cerveau et protège les neurones du stress oxydatif.' },
    { nom:'Acupuncture', contre:'Troubles de la coagulation, anticoagulants, grossesse (certains points sont proscrits). Uniquement chez un praticien diplômé.', preuve:'Étudié', besoins:['énergie'],     tag:'Méd. chinoise',  color:ENCRE, benefice:'Rééquilibre le Qi et soulage les douleurs chroniques', usage:'45–60 min, 1 séance/semaine', detail:'Stimulation de points précis sur les méridiens. Prouvée efficace pour : douleur chronique, insomnie, anxiété, fertilité et migraines.' },
    { nom:'Ginseng Panax', contre:'Hypertension, insomnie, grossesse. Interagit avec les anticoagulants et les traitements du diabète.', preuve:'Étudié', besoins:['énergie'],   tag:'Méd. chinoise',   color: AMBRE, benefice:'Tonique général qui améliore énergie et libido', usage:'200–400 mg/jour le matin', detail:'Les ginsénosides Rg1 et Rb1 améliorent les performances cognitives et physiques. Le ginseng rouge coréen est le plus concentré et le plus étudié.' },
    { nom:'Moxibustion', contre:'Grossesse, diabète avec perte de sensibilité, asthme (la fumée est irritante). Risque de brûlure.', preuve:'Usage traditionnel', besoins:['énergie'],     tag:'Méd. chinoise',    color: ROUGE, benefice:'Stimule les méridiens par la chaleur pour soulager', usage:'Avec un praticien qualifié', detail:'Combustion de l\'armoise près de points d\'acupuncture. Idéale pour : arthrite, douleurs menstruelles, digestion lente et fatigue chronique profonde.' },
    { nom:'Thérapie par le froid', contre:'Trouble cardiaque, hypertension non contrôlée, syndrome de Raynaud, grossesse. Jamais seul dans l\'eau froide.', preuve:'Étudié', besoins:['énergie'],tag:'Pratique',   color:ENCRE, benefice:'Dopamine +250%, inflammation réduite, volonté renforcée', usage:'Douche froide 30s → 3 min progressivement', detail:'La noradrénaline monte de 300% (Wim Hof Institute). Réduit l\'inflammation chronique, améliore la récupération musculaire et renforce la résilience mentale.' },
    { nom:'Curcuma', contre:'Anticoagulants, calculs biliaires, ulcère. À forte dose, déconseillé pendant la grossesse.', preuve:'Étudié', besoins:['digestion'],       tag:'Plante', color: AMBRE, benefice:'Neutralise l\'inflammation chronique et protège le foie', usage:'1 c.à.c + poivre noir + huile, matin', detail:'La curcumine est 1000× plus biodisponible avec de la pipérine (poivre noir). Puissant antioxydant, soutient les articulations et la digestion.' },
    { nom:'Gingembre', contre:'Anticoagulants, calculs biliaires. À suspendre deux semaines avant une chirurgie.', preuve:'Étudié', besoins:['digestion', 'immunité'],     tag:'Plante',        color:ENCRE, benefice:'Stimule la digestion et booste l\'immunité naturellement', usage:'Frais ou tisane, 2–3 g/jour', detail:'Anti-nausée cliniquement prouvé. Réduit les douleurs musculaires post-entraînement et stimule la thermogenèse (brûle les graisses).' },
    { nom:'Chardon-marie', contre:'Allergie aux astéracées. Modifie l\'élimination de nombreux médicaments : avis médical indispensable si tu suis un traitement.', preuve:'Étudié', besoins:['digestion'], tag:'Plante',            color:ENCRE, benefice:'Régénère et détoxifie les cellules hépatiques', usage:'140 mg de silymarine, 3× par jour', detail:'La silymarine bloque les toxines et stimule la régénération cellulaire hépatique. Incontournable après antibiotiques, alcool ou médicaments.' },
    { nom:'Menthe poivrée', contre:'Reflux gastro-œsophagien, hernie hiatale, calculs biliaires. Pas avant 8 ans.', preuve:'Étudié', besoins:['digestion'],  tag:'Tisane',   color:ENCRE, benefice:'Soulage les ballonnements et les douleurs intestinales', usage:'Après les repas, 2 tasses/jour max', detail:'Le menthol relâche la musculature lisse digestive. Cliniquement efficace contre le SII. Éviter en cas de reflux gastro-œsophagien.' },
    { nom:'Ortie', contre:'Anticoagulants, diurétiques, insuffisance rénale ou cardiaque, grossesse.', preuve:'Usage traditionnel', besoins:['immunité', 'cheveux'],         tag:'Plante',        color: AMBRE, benefice:'Reminéralise l\'organisme et combat la fatigue de fond', usage:'Tisane ou gélules, cure de 3 semaines', detail:'Riche en fer, magnésium, silice et vitamines K et C. Excellent dépuratif. Aide contre l\'anémie, les douleurs articulaires et la chute de cheveux.' },
    { nom:'Hibiscus', contre:'Hypotension, traitement antihypertenseur, grossesse et allaitement.', preuve:'Étudié', besoins:['immunité'],        tag:'Tisane',      color: ROUGE, benefice:'Réduit naturellement la tension artérielle', usage:'2–3 tasses/jour, froid ou chaud', detail:'Les anthocyanines réduisent la pression systolique de 7 points en 4 semaines (méta-analyse). Riche en vitamine C et antioxydants.' },
    { nom:'Gingembre-citron', contre:'Anticoagulants, reflux gastrique, calculs biliaires.', preuve:'Usage traditionnel', besoins:['immunité'],tag:'Tisane',    color:ENCRE, benefice:'Renforce les défenses immunitaires quotidiennement', usage:'Matin à jeun avec une cuillère de miel', detail:'Synergie puissante : gingerols (anti-infectieux) + vitamine C + enzymes du miel. Le miel de Manuka amplifie les propriétés antibactériennes.' },
    { nom:'Reishi', contre:'Anticoagulants, immunosuppresseurs. À suspendre avant une chirurgie.', preuve:'Usage traditionnel', besoins:['immunité'],          tag:'Méd. chinoise',  color:ENCRE, benefice:'"Champignon de l\'immortalité", immunité et longévité', usage:'1–2 g/jour en poudre dans une boisson chaude', detail:'Modifie le microbiome intestinal et renforce les cellules NK (natural killers). Utilisé depuis 4000 ans en médecine chinoise. Anti-tumoral étudié.' },
    { nom:'Astragale', contre:'Maladies auto-immunes, traitements immunosuppresseurs, greffe.', preuve:'Usage traditionnel', besoins:['immunité'],       tag:'Méd. chinoise',   color:ENCRE, benefice:'Renforce l\'immunité en profondeur et ralentit le vieillissement', usage:'500 mg, 2× par jour, cure de 3 mois', detail:'Allonge les télomères (marqueurs du vieillissement cellulaire). Utilisé en complément de la chimiothérapie pour réduire les effets secondaires.' },
    { nom:'Bain d\'huile de ricin', contre:'Usage externe. Éviter en cas de cuir chevelu lésé.', preuve:'Usage traditionnel', besoins:['cheveux'], tag:'Recette', color:ENCRE,
      benefice:'Densifie, freine la chute et nourrit le cuir chevelu',
      usage:'1 fois par semaine, en cure de 6 semaines',
      ingredients:['2 c. à soupe d\'huile de ricin', '2 c. à soupe d\'huile de jojoba ou d\'olive'],
      prepa:['Tiédir le mélange au bain-marie', 'Masser le cuir chevelu 5 minutes, par petits cercles', 'Laisser poser 1 h, cheveux enroulés dans une serviette', 'Deux shampoings doux pour tout retirer'],
      detail:'Le ricin est très épais : pur, il est presque impossible à rincer, d\'où le mélange avec une huile fluide. Le massage compte autant que l\'huile, c\'est lui qui relance la microcirculation du bulbe.',
      precaution:'À espacer si ton cuir chevelu est déjà gras.' },
    { nom:'Rinçage au vinaigre de cidre', contre:'Usage externe. Jamais pur, jamais sur peau lésée ou irritée.', preuve:'Usage traditionnel', besoins:['cheveux'], tag:'Recette', color: AMBRE,
      benefice:'Redonne de la brillance et calme les pellicules',
      usage:'1 fois par semaine, après le shampoing',
      ingredients:['1 c. à soupe de vinaigre de cidre', '500 ml d\'eau froide'],
      prepa:['Mélanger dans une bouteille', 'Verser lentement sur les longueurs après le shampoing', 'Rincer rapidement à l\'eau froide'],
      detail:'L\'acidité resserre les écailles du cheveu, ce qui le rend lisse et réfléchissant. L\'odeur disparaît complètement au séchage.',
      precaution:'Jamais pur, et jamais sur un cuir chevelu irrité ou griffé.' },
    { nom:'Masque œuf et miel', contre:'Usage externe. Allergie à l\'œuf ou aux produits de la ruche.', preuve:'Usage traditionnel', besoins:['cheveux'], tag:'Recette', color: AMBRE,
      benefice:'Répare les longueurs sèches et les pointes abîmées',
      usage:'Tous les quinze jours',
      ingredients:['1 jaune d\'œuf', '1 c. à soupe de miel liquide', '1 c. à soupe d\'huile d\'olive'],
      prepa:['Fouetter jusqu\'à obtenir une texture homogène', 'Appliquer sur les longueurs et les pointes, pas sur les racines', 'Laisser poser 20 minutes', 'Rincer à l\'eau TIÈDE, jamais chaude'],
      detail:'Les protéines du jaune comblent les écailles ouvertes, le miel retient l\'eau dans la fibre. L\'eau chaude est le seul vrai piège : elle cuit l\'œuf dans les cheveux.',
      precaution:'À éviter en cas d\'allergie à l\'œuf, même légère.' },
    { nom:'Rhassoul sur cuir chevelu gras', contre:'Usage externe. Ni contenant ni ustensile métallique.', preuve:'Usage traditionnel', besoins:['cheveux'], tag:'Recette', color:ENCRE,
      benefice:'Absorbe l\'excès de sébum sans décaper la fibre',
      usage:'1 fois par semaine au maximum',
      ingredients:['3 c. à soupe de rhassoul en poudre', 'Eau tiède ou hydrolat, jusqu\'à obtenir une pâte'],
      prepa:['Mélanger dans un bol NON métallique, avec une cuillère en bois', 'Appliquer uniquement sur les racines', 'Laisser 10 minutes sans laisser sécher', 'Rincer très abondamment'],
      detail:'Le rhassoul capte le sébum par échange d\'ions au lieu de le dissoudre, contrairement à un shampoing détergent qui provoque un effet rebond.',
      precaution:'Ni bol ni cuillère en métal, cela désactive l\'argile. Plus d\'une fois par semaine, ça assèche.' },
    { nom:'Ce qu\'il ne faut PAS faire', contre:'Ces trois recettes sont à proscrire, quelles que soient les recommandations trouvées ailleurs.', preuve:'Étudié', besoins:['peau'], tag:'À éviter', color: ROUGE,
      benefice:'Trois recettes très répandues qui abîment vraiment la peau',
      usage:'À bannir, quoi qu\'on lise ailleurs',
      ingredients:['Citron sur la peau', 'Bicarbonate de soude en gommage', 'Dentifrice sur un bouton'],
      prepa:['Citron : photosensibilisant, il provoque de vraies brûlures et des taches durables au moindre rayon de soleil', 'Bicarbonate : son pH très basique détruit le film hydrolipidique, la peau se défend en produisant plus de sébum', 'Dentifrice : le menthol et les agents blanchissants brûlent la zone et laissent souvent une marque plus visible que le bouton'],
      detail:'Ces trois-là reviennent partout parce qu\'elles donnent une sensation immédiate de propreté ou de picotement, qu\'on prend pour de l\'efficacité. C\'est de l\'irritation.',
      precaution:'Si une recette pique, chauffe ou rougit, rince immédiatement. Une bonne recette ne fait rien sentir.' },
    { nom:'Masque à l\'argile verte', contre:'Usage externe. Éviter le contour des yeux et ne jamais laisser sécher.', preuve:'Usage traditionnel', besoins:['peau'], tag:'Recette', color:ENCRE,
      benefice:'Absorbe l\'excès de sébum et resserre les pores',
      usage:'1 fois par semaine',
      ingredients:['2 c. à soupe d\'argile verte', 'Eau florale ou eau, jusqu\'à obtenir une pâte', '1 c. à café de miel'],
      prepa:['Mélanger dans un bol non métallique', 'Appliquer en couche épaisse en évitant le contour des yeux', 'Laisser 10 minutes SANS laisser sécher, vaporiser un peu d\'eau si ça tire', 'Rincer à l\'eau tiède'],
      detail:'La règle est toujours la même avec l\'argile : elle travaille tant qu\'elle est humide. Une fois craquelée, elle tire l\'eau de la peau au lieu du sébum.',
      precaution:'Jamais jusqu\'à craquelure, c\'est ce qui provoque tiraillements et rebond de sébum.' },
    { nom:'Miel de thym sur les boutons', contre:'Usage externe. Allergie aux produits de la ruche.', preuve:'Usage traditionnel', besoins:['peau'], tag:'Recette', color: AMBRE,
      benefice:'Assainit et accélère la cicatrisation sans dessécher',
      usage:'2 à 3 fois par semaine, en local',
      ingredients:['1 c. à café de miel de thym ou de manuka'],
      prepa:['Appliquer en couche fine sur la zone concernée', 'Laisser poser 15 minutes', 'Rincer à l\'eau tiède'],
      detail:'Le miel est naturellement antibactérien et hygroscopique : il prive les bactéries de l\'eau dont elles ont besoin, tout en gardant la peau souple. Le miel de thym et le manuka sont les plus actifs.',
      precaution:'À éviter en cas d\'allergie aux produits de la ruche.' },
    { nom:'Avoine colloïdale', contre:'Usage externe. Allergie au gluten par contact, rare mais possible.', preuve:'Étudié', besoins:['peau'], tag:'Recette', color:ENCRE,
      benefice:'Apaise les rougeurs, les tiraillements et les démangeaisons',
      usage:'Dès que la peau chauffe ou tire',
      ingredients:['3 c. à soupe de flocons d\'avoine', '2 c. à soupe d\'eau tiède ou de yaourt nature'],
      prepa:['Mixer les flocons en poudre la plus fine possible', 'Mélanger jusqu\'à obtenir une crème', 'Appliquer et laisser 10 minutes', 'Rincer à l\'eau tiède'],
      detail:'Ce n\'est pas qu\'une recette de grand-mère : l\'avoine colloïdale est utilisée en dermatologie, ses avénanthramides sont reconnues anti-inflammatoires et apaisent les peaux réactives.',
      precaution:null },
    { nom:'Gel d\'aloe vera', contre:'Usage externe. Tester dans le pli du coude 24 h avant : allergisant chez certaines personnes.', preuve:'Étudié', besoins:['peau'], tag:'Recette', color:ENCRE,
      benefice:'Hydrate, calme les coups de soleil et les peaux échauffées',
      usage:'Matin et soir sur peau propre',
      ingredients:['Gel d\'aloe vera pur, 98 % minimum'],
      prepa:['Appliquer une couche fine sur peau propre', 'Laisser pénétrer une minute', 'Ajouter une crème par-dessus si ta peau est sèche'],
      detail:'L\'aloe hydrate mais ne retient pas l\'eau seul : sans crème par-dessus, sur peau sèche, l\'effet ne tient pas la journée.',
      precaution:'Teste dans le pli du coude 24 h avant, l\'aloe est allergisant chez certaines personnes.' },
    { nom:'Eau de rose', contre:'Usage externe. Choisir un hydrolat sans conservateur.', preuve:'Usage traditionnel', besoins:['peau'], tag:'Recette', color: AMBRE,
      benefice:'Ravive un teint terne et décongestionne les cernes',
      usage:'Matin et soir',
      ingredients:['Hydrolat de rose de Damas'],
      prepa:['Vaporiser sur le visage propre', 'Tapoter du bout des doigts sans frotter', 'Pour les cernes : compresses imbibées et bien froides, 5 minutes sur les yeux fermés'],
      detail:'Astringent doux qui rééquilibre le pH après le nettoyage. Sur les cernes, c\'est surtout le froid qui agit, en resserrant les vaisseaux.',
      precaution:'Choisis un hydrolat sans conservateur et garde-le au réfrigérateur.' },
]
// ─── HERO BACKGROUND (aurora animated, dark glass version) ───────────────────
function HeroBg() {
  return (
    <div style={{ position:'absolute', inset:0, zIndex:0, overflow:'hidden', borderRadius:'inherit' }}>
      {/* Animated aurora gradient, subtle warm/green glow on dark */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(-45deg, rgba(var(--rgb-or), 0.14), rgba(var(--rgb-bulle), 0.10), rgba(var(--rgb-or), 0.12), rgba(var(--rgb-creme-dore), 0.10), rgba(var(--rgb-terracotta), 0.14))',
        backgroundSize:'400% 400%',
        animation:'heroGradient 10s ease infinite',
      }} />
      {/* Floating orbs */}
      <div style={{
        position:'absolute', top:'-20%', right:'-6%', width:260, height:260,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(255,199,120,0.26) 0%, transparent 65%)',
        animation:'floatOrb 8s ease-in-out infinite', filter:'blur(8px)',
      }} />
      <div style={{
        position:'absolute', bottom:'-12%', left:'-5%', width:200, height:200,
        borderRadius:'50%', background:'radial-gradient(circle, rgba(var(--rgb-or), 0.18) 0%, transparent 65%)',
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
  const c = ETIQUETTE

  return (
    <div
      style={{
        background:'rgba(var(--rgb-terracotta), 0.10)', border:'1px solid rgba(var(--rgb-terracotta), 0.22)', borderRadius:16,
        overflow:'hidden',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        animation:`slideUp 0.3s ${index * 0.07}s ease both`,
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* Collapsed header, always visible */}
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
                background:'rgba(var(--rgb-terracotta), 0.12)', color:c, border:'1px solid rgba(var(--rgb-terracotta), 0.25)',
                textTransform:'uppercase', letterSpacing:'0.4px',
              }}>{r.tag}</span>
            )}
          </div>
          <div style={{ fontSize:11.5, color:TXT_SOFT, lineHeight:1.4 }}>{r.benefice}</div>
          {/* Le croisement : cette fiche est-elle deconseillee dans SA situation ? */}
          {(() => {
            const x = croiser(profilCourant, r)
            if (!x.concerne) return null
            return (
              <div style={{
                marginTop:8, padding:'8px 10px', borderRadius:10,
                background:'rgba(185,28,28,0.07)', border:'1px solid rgba(185,28,28,0.30)',
                fontSize:11, lineHeight:1.45, color:ROUGE, fontWeight:500,
              }}>
                {phraseAlerte(x.raisons)}
              </div>
            )
          })()}
          {/* 12. Rien ne distinguait une proposition generee d'une fiche de la
              base validee. Le lecteur doit savoir ce qu'il lit. */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:4, marginTop:6,
            fontSize:8.5, fontWeight:700, padding:'2px 7px', borderRadius:10,
            textTransform:'uppercase', letterSpacing:'0.3px',
            background:'rgba(var(--rgb-or), 0.10)', color:ENCRE,
            border:'1px dashed rgba(var(--rgb-or), 0.40)',
          }}>
            Généré par l'IA · à vérifier
          </div>
        </div>
        <div style={{
          width:28, height:28, borderRadius:'50%', flexShrink:0,
          background:'rgba(var(--rgb-terracotta), 0.10)', border:'1px solid rgba(var(--rgb-terracotta), 0.22)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <ChevronIcon color={c} size={12} direction="down" />
        </div>
      </div>

      {/* Expanded details */}
      <div style={{ overflow:'hidden', maxHeight: open ? 520 : 0, transition:'max-height 0.38s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid rgba(var(--rgb-terracotta), 0.18)' }}>

          {/* Pourquoi, personnalisé */}
          {r.pourquoi && (
            <div style={{
              background:'rgba(var(--rgb-terracotta), 0.08)',
              border:'1px solid rgba(var(--rgb-terracotta), 0.20)', borderRadius:12,
              padding:'10px 12px', margin:'10px 0 8px',
            }}>
              <div style={{ fontSize:9, color:ACCENT_FICHE, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:4 }}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><TargetIcon size={9} color={ACCENT_FICHE} /> Pourquoi pour toi ?</span>
              </div>
              <div style={{ fontSize:12, color:ENCRE, lineHeight:1.72 }}>{r.pourquoi}</div>
            </div>
          )}

          {/* Usage */}
          {r.usage && (
            <div style={{
              display:'flex', gap:9, alignItems:'flex-start',
              background:'rgba(var(--rgb-or), 0.10)', border:'1px solid rgba(var(--rgb-or), 0.22)',
              borderRadius:12, padding:'10px 12px', marginBottom:8,
            }}>
              <span style={{ flexShrink:0, display:'flex' }}><PillIcon size={16} color={ACCENT_FICHE} /></span>
              <div>
                <div style={{ fontSize:9, color:ACCENT_FICHE, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:3 }}>
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
              fontSize:11.5, color:ENCRE,
              background:'rgba(239,68,68,0.10)', borderRadius:12,
              padding:'8px 11px', marginBottom:8,
              border:'1px solid rgba(239,68,68,0.25)', lineHeight:1.55,
            }}>
              <span style={{ flexShrink:0, display:'flex', marginTop:2 }}><WarnTriangleIcon color="#ef4444" size={13} /></span>
              <span><strong style={{ color: ROUGE }}>Précaution :</strong> {r.precaution}</span>
            </div>
          )}

          {/* Synergie */}
          {r.synergie && (
            <div style={{
              display:'flex', gap:8, alignItems:'flex-start',
              fontSize:11.5, color:ENCRE,
              background:'rgba(var(--rgb-or), 0.08)', borderRadius:12,
              padding:'8px 11px', marginBottom:10,
              border:'1px solid rgba(var(--rgb-or), 0.20)', lineHeight:1.55,
            }}>
              <span style={{ flexShrink:0, display:'flex', marginTop:2 }}><LinkChainIcon color={ACCENT_FICHE} size={13} /></span>
              <span><strong style={{ color:ACCENT_FICHE }}>Synergie :</strong> {r.synergie}</span>
            </div>
          )}

          <button
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'9px 15px', borderRadius:12,
              background:CTA_GRAD,
              border:'1px solid rgba(var(--rgb-creme-dore), 0.38)', color: AMBRE,
              fontSize:11, fontWeight:800, cursor:'pointer',
              fontFamily:'Poppins,sans-serif',
              boxShadow:'0 4px 14px rgba(var(--rgb-terracotta), 0.35)',
            }}
            onClick={e => {
              e.stopPropagation()
              onChat(
                `Pourquoi ${r.nom} pour ${LABEL_CAT[cat] || cat} ? Explique-moi ce que ça fait concrètement, `
                + `au bout de combien de temps on ressent quelque chose, et si ce n'est pas adapté à mon profil, `
                + `dis-le franchement et propose-moi autre chose.`,
                `Pourquoi ${r.nom} pour ${LABEL_CAT[cat] || cat} ?`
              )
            }}
          >
            <ChatIcon color="#fff" size={13} /> Pourquoi celle-ci ?
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
            <SparkleIcon color={ACCENT_FICHE} size={22} />
          </div>
          <div style={{ flex:1 }}>
            <div style={hb.aiTitle}>Tu ne trouves pas ?</div>
            <div style={hb.aiSub}>Solenn cherche dans ton profil {profil?.nom ? `· ${profil.nom}` : ''}</div>
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
                : 'Analyser'}
            </button>
          )}
          {items && (
            <button
              style={{ ...hb.aiCta, background:'rgba(var(--rgb-or), 0.12)', color:ACCENT_FICHE,
                border:'1px solid rgba(var(--rgb-or), 0.35)', boxShadow:'none', fontSize:10 }}
              onClick={() => setItems(null)}
            >
              Refaire
            </button>
          )}
        </div>

        {items && (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8, borderTop:'1px solid rgba(var(--rgb-terracotta), 0.18)', paddingTop:14 }}>
            {items.map((r, i) => (
              <AIRecoCard key={i} r={r} onChat={onChat} index={i} />
            ))}
          </div>
        )}

        {err && (
          <div style={{ fontSize:11, color: ROUGE, marginTop:10, fontWeight:600 }}>
            Erreur de connexion. Réessaie.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HERB ITEM, glass card with expand ──────────────────────────────────────
function HerbItem({ item, onChat, onCure, cureActive }) {
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
            {/* Pastille discrète, couleur du remède */}
            <span style={{
              width:7, height:7, borderRadius:'50%', flexShrink:0,
              background:item.color, opacity:0.85, display:'inline-block',
            }} />
            <span style={{ fontSize:14, fontWeight:800, color:TXT_MAIN, letterSpacing:'-0.2px' }}>{item.nom}</span>
            <span style={{
              fontSize:9, fontWeight:800, padding:'3px 9px', borderRadius:12,
              background:'rgba(var(--rgb-or), 0.12)', color:ACCENT_FICHE,
              border:'1px solid rgba(var(--rgb-or), 0.25)', letterSpacing:'0.4px', textTransform:'uppercase',
            }}>
              {item.tag}
            </span>
          </div>
          <div style={{ fontSize:12, color:TXT_SOFT, lineHeight:1.45, fontWeight:500 }}>{item.benefice}</div>
          {/* 11. La posologie etait enfermee dans le pli : un remede dont on ne
              voit ni la dose ni la frequence n'est pas actionnable. */}
          {item.usage && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:ENCRE, fontWeight:600 }}>{item.usage}</span>
              {/* 10. Niveau de preuve : une allegation sante sans qualification
                  est un risque reglementaire en Europe. */}
              <span style={{
                fontSize:8.5, fontWeight:700, padding:'2px 7px', borderRadius:10,
                textTransform:'uppercase', letterSpacing:'0.3px',
                background: item.preuve === 'Étudié' ? 'rgba(34,197,94,0.12)' : 'rgba(var(--rgb-terracotta), 0.10)',
                color: item.preuve === 'Étudié' ? '#1f9d55' : 'rgba(var(--rgb-terracotta), 0.75)',
                border: item.preuve === 'Étudié' ? '1px solid rgba(34,197,94,0.28)' : '1px solid rgba(var(--rgb-terracotta), 0.22)',
              }}>{item.preuve}</span>
            </div>
          )}
        </div>
        {/* Chevron in glass circle */}
        <div style={{
          width:30, height:30, borderRadius:'50%', flexShrink:0,
          // 0.08 / 0.20 : le chevron ne se lisait pas comme un bouton et rien
          // n'indiquait qu'on pouvait deplier la fiche.
          background:'rgba(var(--rgb-terracotta), 0.16)', border:'1px solid rgba(var(--rgb-terracotta), 0.38)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <ChevronIcon color={ICONE} size={14} direction="down" />
        </div>
      </div>

      {/* Expanded content */}
      <div style={{
        overflow:'hidden',
        // Toutes les fiches portent desormais un bloc contre-indications, et
        // les recettes y ajoutent ingredients et preparation : 320 px coupaient
        // l'un, 1200 l'autre. Releve pour que rien ne soit tronque.
        maxHeight: open ? (item.ingredients ? 1500 : 700) : 0,
        transition:'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          padding:'0 15px 15px',
          borderTop:'1px solid rgba(var(--rgb-terracotta), 0.18)',
        }}>
          {/* Usage box, vert par defaut. Rouge sur la fiche des recettes a
              proscrire : un encadre vert intitule « Comment utiliser » pour dire
              « a bannir » se contredit lui-meme. */}
          <div style={{
            display:'flex', alignItems:'flex-start', gap:11,
            background: item.tag === 'À éviter' ? 'rgba(239,68,68,0.09)' : 'rgba(var(--rgb-terracotta), 0.10)',
            border: item.tag === 'À éviter' ? '1px solid rgba(239,68,68,0.22)' : '1px solid rgba(var(--rgb-terracotta), 0.20)',
            borderRadius:12, padding:'11px 13px', margin:'12px 0 10px',
          }}>
            <div style={{
              width:10, height:10, borderRadius:'50%',
              background:item.color, opacity:0.9,
              marginTop:3, flexShrink:0,
            }} />
            <div>
              <div style={{ fontSize:9, color:ACCENT_FICHE, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px' }}>
                {item.tag === 'À éviter' ? 'À ne pas faire' : 'Comment utiliser'}
              </div>
              <div style={{ fontSize:12, color:TXT_MAIN, fontWeight:700, marginTop:2, lineHeight:1.4 }}>
                {item.usage}
              </div>
            </div>
          </div>
          {/* Ingredients, recettes de la categorie Beaute */}
          {item.ingredients && (
            <div style={{ marginBottom:11 }}>
              <div style={{ fontSize:9, color:ACCENT_FICHE, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>
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
              <div style={{ fontSize:9, color:ACCENT_FICHE, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>
                {item.tag === 'À éviter' ? 'Pourquoi' : 'La recette'}
              </div>
              {item.prepa.map((etape, k) => (
                <div key={k} style={{ display:'flex', alignItems:'flex-start', gap:9, marginBottom:6 }}>
                  <span style={{
                    width:17, height:17, borderRadius:'50%', flexShrink:0, marginTop:1,
                    background:'rgba(var(--rgb-or), 0.14)', border:'1px solid rgba(var(--rgb-or), 0.30)',
                    color:ACCENT_FICHE, fontSize:9, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{k + 1}</span>
                  <span style={{ fontSize:12, color:TXT_SOFT, lineHeight:1.5 }}>{etape}</span>
                </div>
              ))}
            </div>
          )}

          {/* Precaution, rouge, comme les mises en garde deja presentes */}
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

          {/* 9. Contre-indications, champ dedie sur CHAQUE fiche. Certaines
              plantes interagissent avec des traitements courants et sont
              deconseillees en grossesse : l'information ne peut pas rester
              noyee dans le texte de detail. */}
          {item.contre && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:9,
              background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)',
              borderRadius:12, padding:'10px 12px', marginBottom:11,
            }}>
              <span style={{ marginTop:1, flexShrink:0 }}><WarnTriangleIcon size={13} /></span>
              <div>
                <div style={{ fontSize:9, color: ROUGE, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:2 }}>
                  Contre-indications
                </div>
                <span style={{ fontSize:11.5, color:TXT_SOFT, lineHeight:1.5 }}>{item.contre}</span>
              </div>
            </div>
          )}

          {/* Detail text */}
          <div style={{ fontSize:12, color:TXT_SOFT, lineHeight:1.75, marginBottom:12 }}>
            {item.detail}
          </div>
          {/* Cure de 14 jours, uniquement les remèdes internes mesurables */}
          {onCure && cureEligible(item) && (
            <button
              onClick={e => { e.stopPropagation(); onCure(item) }}
              disabled={!!cureActive}
              style={{
                display: 'block', width: '100%', marginBottom: 10,
                padding: '11px 16px', borderRadius: 12,
                background: cureActive ? 'rgba(var(--rgb-terracotta), 0.08)' : 'linear-gradient(135deg, rgba(var(--rgb-or), 0.20), rgba(var(--rgb-terracotta), 0.12))',
                border: '1px solid rgba(var(--rgb-or), 0.40)',
                color: ENCRE,
                fontSize: 12.5, fontWeight: 800, cursor: cureActive ? 'default' : 'pointer',
                fontFamily: 'Poppins,sans-serif',
              }}>
              {cureActive ? 'Une cure est déjà en cours' : 'Commencer une cure de 14 jours'}
            </button>
          )}

          {/* CTA button */}
          <button
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'9px 16px', borderRadius:12,
              background:CTA_GRAD,
              border:'1px solid rgba(var(--rgb-creme-dore), 0.38)',
              color: AMBRE, fontSize:11, fontWeight:800,
              cursor:'pointer', fontFamily:'Poppins,sans-serif',
              boxShadow:'0 4px 14px rgba(var(--rgb-terracotta), 0.35)',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
            onClick={e => {
              e.stopPropagation()
              // Ce que Solenn recoit, et ce que la bulle montre : deux choses.
              onChat(
                `Pourquoi ${item.nom} pour ${LABEL_CAT[cat] || cat} ? Explique-moi ce que ça fait concrètement, `
                + `au bout de combien de temps on ressent quelque chose, et si ce n'est pas adapté à mon profil, `
                + `dis-le franchement et propose-moi autre chose.`,
                `Pourquoi ${item.nom} pour ${LABEL_CAT[cat] || cat} ?`
              )
            }}
          >
            <ChatIcon color="#fff" size={13} /> Pourquoi celle-ci ?
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── LA CURE GUIDÉE ──────────────────────────────────────────────────────────
// Une cure n'est ni le programme ni la routine. Le PROGRAMME est le plan de
// 21 jours vers l'objectif global ; la ROUTINE est le rythme quotidien. La
// CURE est un protocole court et ciblé : UN remède de cette page, pris
// sérieusement pendant 14 jours, et un VERDICT chiffré à la fin, c'est la
// boucle du conseil appliquée à la santé naturelle. Aucune app ne fait ça :
// les trackers n'ont pas de remèdes, les dictionnaires de plantes n'ont pas
// de mesures (2026-08-12).
// Réservée aux remèdes internes dont l'effet EST mesurable par une métrique
// suivie : sommeil et stress. Pas de cure sur les recettes externes ni sur ce
// qu'on ne peut pas mesurer, un verdict invérifiable serait du théâtre.
const CURE_METRIQUES = {
  sommeil: { cle: 'sommeil', nom: 'ton sommeil', fmt: v => `${Math.floor(v)} h${Math.round((v % 1) * 60) >= 5 ? ' ' + String(Math.round((v % 1) * 60)).padStart(2, '0') : ''}` },
  stress:  { cle: 'humeur',  nom: 'ton humeur',  fmt: v => `${Math.round(v * 10) / 10} sur 5` },
}
const CURE_JOURS = 14

function lireCure() {
  try { return JSON.parse(localStorage.getItem('solenn_cure') || 'null') } catch { return null }
}

function moyenneCure(history, cle, depuisTs) {
  const l = (history || [])
    .filter(e => e?.date && e[cle] > 0)
    .filter(e => depuisTs === null ? true : new Date(e.date).getTime() >= depuisTs)
    .map(e => e[cle])
  return l.length ? { moy: l.reduce((x, y) => x + y, 0) / l.length, n: l.length } : null
}

function cureEligible(fiche) {
  if (['Recette', 'À éviter'].includes(fiche.tag)) return null
  const besoin = (fiche.besoins || []).find(b => CURE_METRIQUES[b])
  return besoin || null
}

// ─── CE QUE DISENT TES DONNÉES ────────────────────────────────────────────────
// Soins était un catalogue à part, sans aucun lien avec ce que Solenn mesure.
// Or c'est précisément le croisement qui n'existe nulle part ailleurs : les
// applications de ce créneau sont soit des identificateurs de plantes, soit des
// dictionnaires classés par pathologie. Aucune ne part de TES chiffres.
// On repère donc le besoin le plus criant des sept derniers jours et on ouvre
// la page dessus (2026-08-12).
function besoinDuMoment(metriques, history) {
  const m = metriques || {}
  const sept = (history || []).slice(-7)
  const moy = (cle) => {
    const l = sept.map(e => Number(e?.[cle]) || 0).filter(v => v > 0)
    return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0
  }
  const sommeil = moy('sommeil') || m.sommeil || 0
  const humeur  = moy('humeur')  || m.humeur  || 0
  const pas     = moy('pas')     || m.pas     || 0

  // Écart relatif à l'objectif : c'est ce qui permet de comparer des unités
  // qui n'ont rien à voir entre elles.
  const pistes = [
    sommeil > 0 && sommeil < 7 && {
      cat: 'sommeil', ecart: (7 - sommeil) / 7,
      constat: `Tu dors ${Math.floor(sommeil)} h ${String(Math.round((sommeil % 1) * 60)).padStart(2, '0')} en moyenne ces derniers jours.`,
    },
    humeur > 0 && humeur < 3.2 && {
      cat: 'stress', ecart: (3.2 - humeur) / 3.2,
      constat: `Ton humeur tourne autour de ${Math.round(humeur * 10) / 10} sur 5 ces derniers jours.`,
    },
    pas > 0 && pas < 5000 && {
      cat: '\u00e9nergie', ecart: (5000 - pas) / 5000 * 0.7,
      constat: `Tu marches ${formaterPas(pas)} pas par jour en moyenne.`,
    },
  ].filter(Boolean).sort((a, b) => b.ecart - a.ecart)

  return pistes[0] || null
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
// catInitiale : « Tes outils » propose une entree Beaute qui doit ouvrir
// directement sur cette categorie. Sans ca la page s'ouvrait toujours sur
// Plantes et l'entree mentait sur sa destination.
export default function HerbalTab({ profil, onChat, onBack, catInitiale = null, metriques, history }) {
  profilCourant = profil
  // Le besoin du moment decide de la categorie d'ouverture, sauf si l'appelant
  // en impose une (l'entree Soins ouvre sur les cheveux).
  const besoin = useMemo(() => besoinDuMoment(metriques, history), [metriques, history])
  const [cat, setCat] = useState(catInitiale || besoin?.cat || 'sommeil')
  const [recherche, setRecherche] = useState('')
  const [cure, setCure] = useState(lireCure)

  function demarrerCure(fiche) {
    const besoin = cureEligible(fiche)
    if (!besoin || cure) return
    const conf = CURE_METRIQUES[besoin]
    // La moyenne d'AVANT est figée au départ : la recalculer au verdict
    // laisserait les jours de cure contaminer la référence.
    const avant = moyenneCure(history, conf.cle, Date.now() - 14 * 86400000)
    const c = { nom: fiche.nom, besoin, cle: conf.cle, debut: Date.now(), avant: avant?.n >= 3 ? avant.moy : null }
    try { localStorage.setItem('solenn_cure', JSON.stringify(c)) } catch {}
    setCure(c)
  }
  function arreterCure() {
    try { localStorage.removeItem('solenn_cure') } catch {}
    setCure(null)
  }

  const cureJour    = cure ? Math.min(Math.floor((Date.now() - cure.debut) / 86400000) + 1, CURE_JOURS) : 0
  const cureFinie   = cure && Math.floor((Date.now() - cure.debut) / 86400000) >= CURE_JOURS
  const cureConf    = cure ? CURE_METRIQUES[cure.besoin] : null
  const cureApres   = cureFinie && cure.avant != null ? moyenneCure(history, cure.cle, cure.debut) : null

  // La rangee de categories deborde de l'ecran. Quand la page s'ouvre sur une
  // categorie qui n'est pas la premiere (Soins ouvre sur Cheveux), la pastille
  // active restait hors champ : on voyait « Sommeil, Stress, Energie » en haut
  // et des recettes capillaires en dessous, sans comprendre le lien. On amene
  // donc la pastille active dans le champ de vision (2026-08-11).
  const catRowRef = useRef(null)
  useEffect(() => {
    const el = catRowRef.current?.querySelector('[data-actif="1"]')
    if (el?.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [cat])
  // 5. La mise en garde d'abord : c'est l'information la plus importante en
  //    securite, elle etait en bas de liste et coupee par la barre de nav.
  // 4. Puis les protocoles (Recette) groupes avant les ingredients : « Ortie »
  //    et « Bain d'huile de ricin » ne sont pas de meme nature, les melanger
  //    dans un ordre arbitraire brouillait la lecture.
  const RANG = { '\u00c0 \u00e9viter': 0, 'Recette': 1 }
  // 2. Recherche libre : quelqu'un qui a des pellicules ou des ballonnements
  //    doit pouvoir taper son probleme, sans deviner dans quelle categorie
  //    l'app a range la reponse. Elle traverse TOUTES les categories.
  const q = recherche.trim().toLowerCase()
  const items = FICHES
    .filter(f => q
      ? [f.nom, f.benefice, f.detail, f.usage, f.tag, ...(f.besoins || [])]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      : (f.besoins.includes(cat) || f.tag === cat))
    .slice()
    .sort((a, b) => (RANG[a.tag] ?? 2) - (RANG[b.tag] ?? 2))

  return (
    <div style={hb.page}>

      {/* ── Aurora Hero Header ── */}
      <div style={{ ...hb.hero }}>
        <HeroBg />
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          {/* Leaf icon, warm gradient */}
          <div style={{
            width:64, height:64, borderRadius:20,
            background:CTA_GRAD,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 28px rgba(var(--rgb-terracotta), 0.40), 0 2px 6px rgba(var(--rgb-or), 0.30)',
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
            fontSize:11, color:ENCRE, fontWeight:600,
          }}>
            <LeafIcon color={ACCENT_FICHE} size={13} /> Plantes · Médecine chinoise · Holistique
          </div>
        </div>
      </div>

      {/* ── Category pills row ── */}
      {/* 8. Disclaimer medical PERMANENT. Obligatoire pour une app de sante en
             Europe, et place avant tout contenu : un avertissement qu'il faut
             chercher ne protege personne. */}
      <div style={{
        margin:'0 16px 4px', padding:'10px 13px', borderRadius:14,
        background:'rgba(var(--rgb-bulle), 0.72)', border:'1px solid rgba(var(--rgb-terracotta), 0.22)',
        display:'flex', alignItems:'flex-start', gap:9,
      }}>
        <span style={{ marginTop:1, flexShrink:0 }}><WarnTriangleIcon size={13} color={ICONE} /></span>
        <span style={{ fontSize:11, lineHeight:1.5, color:TXT_SOFT }}>
          Information éducative sur des usages traditionnels. Solenn n'est pas un
          professionnel de santé et ne remplace ni un diagnostic ni un traitement.
          Demande l'avis de ton médecin ou de ton pharmacien avant toute prise,
          en particulier si tu suis un traitement, si tu es enceinte ou si tu allaites.
        </span>
      </div>

      {/* Cure en cours ou terminée */}
      {cure && (
        <div style={{
          margin: '0 16px 10px', padding: '14px 15px', borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(var(--rgb-or), 0.16), rgba(var(--rgb-terracotta), 0.07))',
          border: '1px solid rgba(var(--rgb-or), 0.40)', fontFamily: 'Poppins,sans-serif',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', color: ACCENT_FICHE, marginBottom: 4 }}>
            {cureFinie ? 'Cure terminée, le verdict' : `Cure en cours · jour ${cureJour} sur ${CURE_JOURS}`}
          </div>
          <div style={{ fontSize: 13.5, color: TXT_MAIN, fontWeight: 600, marginBottom: 4 }}>{cure.nom}</div>

          {!cureFinie && (
            <>
              <div style={{ fontSize: 11.5, color: TXT_SOFT, lineHeight: 1.5 }}>
                Suis la posologie de la fiche, et continue de saisir {cureConf?.nom || 'tes données'} :
                c'est lui qui rendra le verdict au jour {CURE_JOURS}.
              </div>
              <div style={{ marginTop: 9, height: 3, borderRadius: 2, overflow: 'hidden', background: 'rgba(var(--rgb-terracotta), 0.15)' }}>
                <div style={{ width: `${Math.round(cureJour / CURE_JOURS * 100)}%`, height: '100%', background: 'rgba(var(--rgb-or), 0.75)', transition: 'width 0.4s ease' }} />
              </div>
            </>
          )}

          {cureFinie && cureApres && cureApres.n >= 3 && (
            <div style={{ fontSize: 12.5, color: TXT_MAIN, lineHeight: 1.55, fontWeight: 500 }}>
              {cureConf.nom.charAt(0).toUpperCase() + cureConf.nom.slice(1)} : {cureConf.fmt(cure.avant)} avant la cure,
              {' '}{cureConf.fmt(cureApres.moy)} pendant.{' '}
              {cureApres.moy > cure.avant ? 'Ça a bougé dans le bon sens.' : "Ça n'a pas bougé, ce remède n'est peut-être pas le tien."}
            </div>
          )}
          {cureFinie && (!cureApres || cureApres.n < 3 || cure.avant == null) && (
            <div style={{ fontSize: 12.5, color: TXT_SOFT, lineHeight: 1.55 }}>
              Quatorze jours faits. Pas assez de données saisies pour un verdict chiffré :
              dis-moi comment tu te sens, on conclut ensemble.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {cureFinie && (
              <button
                onClick={() => { onChat(`J'ai terminé ma cure de 14 jours de ${cure.nom}. Qu'est-ce qu'on en conclut, et on fait quoi maintenant ?`); arreterCure() }}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 12, cursor: 'pointer',
                  background: CTA_GRAD, border: '1px solid rgba(var(--rgb-creme-dore), 0.55)',
                  color: AMBRE, fontSize: 12, fontWeight: 700, fontFamily: 'Poppins,sans-serif',
                }}>En parler à Solenn</button>
            )}
            <button
              onClick={arreterCure}
              style={{
                flex: cureFinie ? 0.6 : 1, padding: '9px 0', borderRadius: 12, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(var(--rgb-terracotta), 0.30)',
                color: ENCRE, fontSize: 12, fontWeight: 600, fontFamily: 'Poppins,sans-serif',
              }}>{cureFinie ? 'Terminer' : 'Arrêter la cure'}</button>
          </div>
        </div>
      )}

      {/* Ce que disent tes donnees, le croisement que personne d'autre ne fait */}
      {besoin && !q && (
        <div style={{
          margin:'0 16px 10px', padding:'13px 15px', borderRadius:16,
          background:'linear-gradient(135deg, rgba(var(--rgb-terracotta), 0.14), rgba(var(--rgb-terracotta), 0.05))',
          border:'1px solid rgba(var(--rgb-terracotta), 0.28)',
        }}>
          <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.7px', color:ACCENT_FICHE, marginBottom:4 }}>
            Ce que disent tes données
          </div>
          <div style={{ fontSize:13, color:TXT_MAIN, lineHeight:1.45, fontWeight:500 }}>
            {besoin.constat}
          </div>
          <button
            onClick={() => setCat(besoin.cat)}
            style={{
              marginTop:9, padding:'8px 14px', borderRadius:12, cursor:'pointer',
              background:CTA_GRAD, border:'1px solid rgba(var(--rgb-creme-dore), 0.50)',
              color: AMBRE, fontSize:11.5, fontWeight:700, fontFamily:'Poppins,sans-serif',
            }}>
            Voir ce qui peut aider
          </button>
        </div>
      )}

      {/* Recherche par symptome, traverse toutes les categories */}
      <div style={{ margin:'0 16px 10px', position:'relative' }}>
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Pellicules, ballonnements, insomnie…"
          style={{
            width:'100%', boxSizing:'border-box', padding:'11px 36px 11px 14px',
            borderRadius:14, border:'1px solid rgba(var(--rgb-terracotta), 0.22)',
            background:'rgba(var(--rgb-bulle), 0.72)', color:TXT_MAIN,
            fontSize:13, fontFamily:'Poppins,sans-serif', outline:'none',
          }}
        />
        {recherche && (
          <button
            onClick={() => setRecherche('')}
            aria-label="Effacer"
            style={{
              position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', padding:4,
              color:ENCRE, fontSize:16, lineHeight:1,
            }}>×</button>
        )}
      </div>

      {/* Le fondu a droite signale qu'il reste des categories : sans lui, la
          derniere est coupee net et rien n'indique qu'on peut faire defiler. */}
      <div ref={catRowRef}>
        {GROUPES.map(g => (
          <div key={g.titre} style={{ position:'relative' }}>
            <div style={hb.groupeTitre}>{g.titre}</div>
            <div style={hb.catRow}>
              {g.ids.map(id => {
                const c = CATS.find(x => x.id === id) || APPROCHES.find(x => x.id === id)
                if (!c) return null
                const active = cat === c.id
                return (
                  <button
                    key={c.id}
                    data-actif={active ? '1' : '0'}
                    style={{
                      flexShrink:0, padding:'10px 20px', borderRadius:20,
                      border: active ? '1px solid rgba(var(--rgb-brun-fonce),0.55)' : '1px solid rgba(var(--rgb-terracotta), 0.16)',
                      fontSize:12, fontWeight:700,
                      cursor:'pointer', fontFamily:'Poppins,sans-serif',
                      whiteSpace:'nowrap',
                      // Pastille pleine + texte blanc pour l'onglet ouvert, la
                      // regle des actions principales. L'ancien fond etait du
                      // creme a 32 % sous du blanc, soit 1,37:1. Le terracotta
                      // est celui des boutons, pas une huitieme nuance.
                      background: active
                        ? 'linear-gradient(135deg,var(--brun-fonce),var(--brun-moyen))'
                        : 'rgba(var(--rgb-terracotta), 0.06)',
                      backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
                      color: active ? '#fff' : ENCRE,
                      boxShadow: active
                        ? '0 6px 20px rgba(var(--rgb-brun-fonce),0.30)'
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
            <div style={{
              position:'absolute', top:0, right:0, bottom:0, width:34, pointerEvents:'none',
              background:'linear-gradient(90deg, rgba(237,216,204,0) 0%, rgba(237,216,204,0.85) 100%)',
            }} />
          </div>
        ))}
      </div>

      {/* ── Count row ── */}
      <div style={hb.countRow}>
        {/* « 6 REMÈDES · APPUIE POUR DÉVELOPPER » avec une pastille n'était ni un
            titre ni un bouton : l'affordance était illisible. Un vrai libellé de
            section, et le compteur en second plan. */}
        <span style={hb.countText}>{q ? `Résultats pour « ${recherche} »`
          : (APPROCHES.find(a => a.id === cat)?.label ?? `Pour ${LABEL_CAT[cat] || cat}`)}</span>
        <span style={{ ...hb.countSep }}>·</span>
        <span style={{ ...hb.countText, fontWeight:500, opacity:0.75 }}>{items.length} fiches</span>
      </div>

      {/* ── Items list ── */}
      <div style={hb.list}>
        {items.map((item, i) => (
          <HerbItem key={i} item={item} onChat={onChat} onCure={demarrerCure} cureActive={!!cure} />
        ))}
      </div>

      {/* ── Recours, APRÈS la liste ──
           Il était en tête de page et formait un troisième système de
           navigation avant même qu'on ait pu lire quoi que ce soit. Il est
           descendu ici : le besoin d'aide naît quand la liste n'a pas répondu,
           pas avant de l'avoir parcourue (décision Jean 2026-08-11). */}
      <AIReco profil={profil} onChat={onChat} />

      {/* L'ancien avertissement de bas de page a ete retire : il faisait doublon
          avec le bandeau permanent ajoute en tete (2026-08-12). Deux mises en
          garde identiques s'annulent, on finit par n'en lire aucune. Celui du
          haut est conserve car il est vu avant le contenu et couvre en plus la
          grossesse et l'allaitement. */}
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const hb = {
  // 100 px ne suffisaient pas : la pastille de navigation flotte a
  // env(safe-area-inset-bottom) + 10 et mesure ~62 px, elle recouvrait donc la
  // derniere fiche. On reserve sa hauteur reelle.
  page: { paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 132px)', animation:'tabFade 0.28s ease both' },

  // ── Aurora hero header
  hero: {
    position:'relative', minHeight:160,
    display:'flex', alignItems:'center', justifyContent:'center',
    overflow:'hidden', padding:'28px 20px 24px',
    borderRadius:'0 0 28px 28px',
    marginBottom:4,
  },

  // ── AI box, glass card
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
    background:'linear-gradient(145deg, rgba(var(--rgb-or), 0.08), rgba(var(--rgb-terracotta), 0.05))',
    pointerEvents:'none',
  },
  aiTop: { display:'flex', alignItems:'center', gap:12 },
  aiIconWrap: {
    width:44, height:44, borderRadius:16, flexShrink:0,
    background:'linear-gradient(135deg, rgba(var(--rgb-or), 0.16), rgba(var(--rgb-terracotta), 0.12))',
    border:'1px solid rgba(var(--rgb-or), 0.30)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  aiTitle: { fontSize:14, fontWeight:800, color:TXT_MAIN, letterSpacing:'-0.2px' },
  aiSub: { fontSize:10, color:ENCRE, fontWeight:600, marginTop:1 },
  aiCta: {
    background:'linear-gradient(135deg,var(--brun-fonce),var(--brun-moyen))',   // blanc mesure a 5,14:1
    color:'#fff', border:'none',
    padding:'9px 16px', borderRadius:12,
    fontSize:11, fontWeight:800, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', flexShrink:0,
    boxShadow:'0 5px 16px rgba(var(--rgb-terracotta), 0.38)',
    transition:'opacity 0.15s, transform 0.15s',
  },
  dot: {
    display:'inline-block', width:5, height:5,
    borderRadius:'50%', background:'white',
    animation:'dotPulse 0.7s ease-in-out infinite',
  },
  aiResults: {
    marginTop:14, display:'flex', flexDirection:'column', gap:8,
    borderTop:'1px solid rgba(var(--rgb-terracotta), 0.18)', paddingTop:14,
  },
  aiItem: {
    display:'flex', alignItems:'center', gap:11,
    background:'rgba(var(--rgb-terracotta), 0.08)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.18)',
    borderRadius:12, padding:'11px 13px',
  },
  aiAskBtn: {
    width:32, height:32, borderRadius:12, flexShrink:0,
    background:'rgba(var(--rgb-or), 0.12)', border:'1px solid rgba(var(--rgb-or), 0.30)',
    color: AMBRE, fontSize:14, fontWeight:900, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:'Poppins,sans-serif',
  },

  // ── Category pills
  groupeTitre: {
    fontSize:10.5, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase',
    color:ENCRE, opacity:0.72, padding:'12px 16px 0', fontFamily:'Poppins,sans-serif',
  },
  catRow: {
    display:'flex', gap:8, padding:'8px 16px 10px',
    overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch',
  },

  // ── Count row
  countRow: {
    display:'flex', alignItems:'center', gap:7,
    padding:'2px 16px 10px',
  },
  countText: {
    fontSize:10, color:ENCRE, fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.5px',
  },
  countSep: { fontSize:10, color:ENCRE },

  // ── Items list
  list: { display:'flex', flexDirection:'column', gap:0, padding:'0 16px' },

  // ── Disclaimer
  disclaimer: {
    display:'flex', gap:8, alignItems:'flex-start',
    margin:'14px 16px 0',
    padding:'10px 14px',
    background:'rgba(var(--rgb-terracotta), 0.05)',
    border:'1px solid rgba(var(--rgb-terracotta), 0.14)',
    borderRadius:12,
    fontSize:10, color:ENCRE, lineHeight:1.6,
    fontStyle:'italic',
  },
}
