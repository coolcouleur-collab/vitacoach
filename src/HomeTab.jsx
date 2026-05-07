import React, { useState, useEffect } from 'react'

// ─── WELLNESS CIRCLE (hero comme Flo) ─────────────────────────────────────────
function WellnessCircle({ score, scoreColor, profil, metriques, onLog }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  const R = 90
  const C = 2 * Math.PI * R
  const dash = animated ? (score / 100) * C : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dayLabel = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div style={hc.wrap}>
      {/* Greeting */}
      <div style={hc.greeting}>
        <div style={hc.greetName}>{greeting}, {profil?.nom} ✦</div>
        <div style={hc.greetDate}>{dayLabel}</div>
      </div>

      {/* Circle */}
      <div style={hc.circleWrap}>
        <svg width={220} height={220} viewBox="0 0 220 220" style={{ overflow:'visible' }}>
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FF9A3C" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Background ring */}
          <circle cx="110" cy="110" r={R} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
          {/* Progress arc */}
          <circle cx="110" cy="110" r={R} fill="none"
            stroke="url(#arcGrad)" strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            strokeDashoffset={C * 0.25}
            filter="url(#glow)"
            style={{ transition:'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)' }} />
          {/* Center content */}
          <text x="110" y="98" textAnchor="middle" fill="white"
            fontSize="38" fontWeight="900" fontFamily="Poppins,sans-serif"
            style={{ filter:`drop-shadow(0 0 8px ${scoreColor})` }}>
            {score > 0 ? score : '—'}
          </text>
          <text x="110" y="120" textAnchor="middle"
            fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Poppins,sans-serif">
            {score > 0 ? 'SCORE FORME' : 'COMPLÈTE TES DONNÉES'}
          </text>
          <text x="110" y="140" textAnchor="middle"
            fill={scoreColor} fontSize="12" fontWeight="700" fontFamily="Poppins,sans-serif">
            {score >= 70 ? '✦ Excellent' : score >= 40 ? '~ Correct' : score > 0 ? '↓ À améliorer' : ''}
          </text>
        </svg>

        {/* Metric dots around circle */}
        {[
          { angle:-90, icon:'💧', val:metriques?.eau, max:8, label:'Eau' },
          { angle:-10, icon:'👣', val:metriques?.pas, max:10000, label:'Pas' },
          { angle:70,  icon:'😴', val:metriques?.sommeil, max:8, label:'Sommeil' },
          { angle:150, icon:'😊', val:metriques?.humeur, max:5, label:'Humeur' },
          { angle:230, icon:'❤️', val:metriques?.fc, max:100, label:'FC' },
        ].map(m => {
          const rad = (m.angle * Math.PI) / 180
          const x = 110 + 130 * Math.cos(rad)
          const y = 110 + 130 * Math.sin(rad)
          const filled = m.val > 0
          return (
            <button key={m.label} onClick={onLog}
              style={{ position:'absolute', left:x-22, top:y-22, width:44, height:44,
                borderRadius:14, background: filled ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
                border: filled ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:1, cursor:'pointer', transition:'all 0.2s',
                boxShadow: filled ? '0 0 12px rgba(255,107,53,0.2)' : 'none' }}>
              <span style={{ fontSize:16, lineHeight:1 }}>{m.icon}</span>
              <span style={{ fontSize:8, color: filled ? '#FF6B35' : 'rgba(255,255,255,0.3)', fontWeight:600, fontFamily:'Poppins', lineHeight:1 }}>
                {filled ? (m.label==='Pas' ? Math.round(m.val/1000)+'k' : m.val) : '—'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Quick log CTA */}
      <button style={hc.logBtn} onClick={onLog}>
        + Enregistrer ma journée
      </button>
    </div>
  )
}

// ─── INSIGHT CARDS (stories façon Flo) ───────────────────────────────────────
function InsightCards({ profil, metriques, onChat }) {
  const h = new Date().getHours()
  const cards = [
    h < 10
      ? { icon:'🌅', color:'#ff9500', title:'Débute bien ta journée', body:`Boire 1 verre d'eau dès le réveil active ton métabolisme. Idéal avec une tranche de citron.`, action:'Conseils matin' }
      : h < 14
      ? { icon:'🥗', color:'#00e676', title:'Repas de midi', body:`Pense à équilibrer ton assiette : protéines, légumes, glucides complexes. Évite les sucres rapides.`, action:'Idées repas' }
      : h < 18
      ? { icon:'⚡', color:'#FF6B35', title:'Regain d\'énergie', body:`Un coup de fatigue ? 10 min de marche suffisent à relancer ta concentration et ton énergie.`, action:'Me remotiver' }
      : { icon:'🌙', color:'#FF9A3C', title:'Prépare ton sommeil', body:`Évite les écrans 30 min avant de dormir. La mélatonine naturelle se libère dans l'obscurité.`, action:'Routine soir' },
    {
      icon: metriques?.eau < 4 || !metriques?.eau ? '💧' : '✅',
      color: metriques?.eau >= 4 ? '#00e676' : '#FF6B35',
      title: metriques?.eau >= 4 ? `Hydratation : objectif atteint !` : `Hydratation aujourd'hui`,
      body: metriques?.eau > 0 ? `${metriques.eau}/8 verres. ${metriques.eau < 4 ? 'Bois un verre maintenant !' : metriques.eau < 8 ? 'Continue, tu y es presque !' : 'Parfait, bien hydraté !'}` : `Objectif : 8 verres d'eau par jour. Tu en es où ?`,
      action: 'Mettre à jour'
    },
    profil?.objectifs?.[0] && {
      icon:'🎯', color:'#ff6d00',
      title: `Objectif : ${profil.objectifs[0]}`,
      body:`Chaque petite action compte. Qu'est-ce que tu peux faire aujourd'hui pour avancer vers cet objectif ?`,
      action:'Demander des conseils'
    },
    { icon:'🧘', color:'#FF9A3C', title:'Moment de pleine conscience', body:`2 minutes de respiration profonde réduisent le cortisol de 25%. Inspire 4s, retiens 4s, expire 4s.`, action:'En savoir plus' },
  ].filter(Boolean)

  return (
    <div style={hc.cardsSection}>
      <div style={hc.sectionTitle}>Tes insights du jour</div>
      <div style={hc.cardsScroll}>
        {cards.map((c, i) => (
          <button key={i} style={{ ...hc.insightCard, borderColor: c.color+'30', boxShadow:`0 4px 24px ${c.color}12` }}
            onClick={() => onChat(c.action)}>
            <div style={{ fontSize:28, marginBottom:10 }}>{c.icon}</div>
            <div style={{ ...hc.cardTitle, color: c.color }}>{c.title}</div>
            <div style={hc.cardBody}>{c.body}</div>
            <div style={{ ...hc.cardCta, color: c.color, borderColor: c.color+'40' }}>
              {c.action} →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function HomeTab({ profil, metriques, score, scoreColor, onLog, onSwitchTab, onChat }) {
  return (
    <div style={hc.page}>
      <WellnessCircle score={score} scoreColor={scoreColor} profil={profil}
        metriques={metriques} onLog={onLog} />
      <InsightCards profil={profil} metriques={metriques} onChat={msg => { onSwitchTab('chat'); onChat(msg) }} />
    </div>
  )
}

const hc = {
  page: { display:'flex', flexDirection:'column', gap:0, paddingBottom:20 },

  wrap: { display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px 20px' },
  greeting: { textAlign:'center', marginBottom:24 },
  greetName: { fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.3px' },
  greetDate: { fontSize:12, color:'rgba(255,255,255,0.28)', marginTop:4, textTransform:'capitalize' },

  circleWrap: { position:'relative', width:280, height:280, display:'flex', alignItems:'center', justifyContent:'center' },
  logBtn: { marginTop:20, padding:'13px 32px', background:'linear-gradient(135deg,#FF6B35,#E55A00)',
    color:'#000', border:'none', borderRadius:18, fontSize:14, fontWeight:800,
    cursor:'pointer', fontFamily:'Poppins,sans-serif', boxShadow:'0 6px 24px rgba(255,107,53,0.4)',
    transition:'transform 0.15s', letterSpacing:'0.2px' },

  cardsSection: { padding:'0 20px' },
  sectionTitle: { fontSize:11, color:'rgba(255,255,255,0.28)', textTransform:'uppercase',
    letterSpacing:'2px', marginBottom:14 },
  cardsScroll: { display:'flex', gap:12, overflowX:'auto', paddingBottom:8,
    scrollbarWidth:'none', WebkitScrollbarWidth:'none' },
  insightCard: { flexShrink:0, width:220, background:'rgba(255,255,255,0.04)',
    backdropFilter:'blur(20px)', border:'1px solid', borderRadius:22, padding:'20px 16px',
    textAlign:'left', cursor:'pointer', fontFamily:'Poppins,sans-serif',
    display:'flex', flexDirection:'column', gap:0, transition:'transform 0.2s' },
  cardTitle: { fontSize:13, fontWeight:700, marginBottom:8, lineHeight:1.3 },
  cardBody: { fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.65, flex:1, marginBottom:14 },
  cardCta: { fontSize:11, fontWeight:700, border:'1px solid', borderRadius:20,
    padding:'5px 12px', display:'inline-block', width:'fit-content' },
}

