import React, { useState, useEffect } from 'react'

function StarField() {
  const [stars] = useState(() =>
    Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2.2 + 0.3,
      color: ['#00d4ff','#bf5af2','#00e676','#fff','#fff','#fff','#fff','#fff','#fff'][Math.floor(Math.random()*9)],
      dur: (2 + Math.random() * 5).toFixed(1),
      op: (Math.random() * 0.5 + 0.05).toFixed(2)
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
      <div style={{ position:'absolute', top:'-5%', left:'-8%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)', animation:'floatOrb 12s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'30%', right:'-10%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(191,90,242,0.06) 0%, transparent 65%)', animation:'floatOrb 16s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', bottom:'-5%', left:'35%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 65%)', animation:'floatOrb 10s ease-in-out infinite' }} />
    </div>
  )
}

const features = [
  { icon:'🧠', titre:'Coach IA personnalisé', desc:'Une IA qui apprend ton profil, tes objectifs et ton rythme de vie pour des conseils sur-mesure.' },
  { icon:'🥗', titre:'Nutrition intelligente', desc:'Recommandations adaptées à tes régimes, carences et habitudes alimentaires du quotidien.' },
  { icon:'📋', titre:'Routine quotidienne', desc:'Un programme de la journée généré chaque matin selon ton heure de réveil et ton niveau d\'activité.' },
  { icon:'❤️', titre:'Suivi santé', desc:'Suis tes pas, ton sommeil, ton hydratation et ton humeur avec un score de forme journalier.' },
  { icon:'👗', titre:'Style & tenues', desc:'Suggestions de tenues adaptées à la météo de ta ville et à l\'occasion du moment.' },
  { icon:'🌿', titre:'Bien-être holistique', desc:'Plantes, remèdes naturels, gestion du stress — Oravia va au-delà des conseils classiques.' },
]

export default function Landing({ onCommencer }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    <div style={s.page}>
      <StarField />

      {/* ── HERO ── */}
      <section style={{ ...s.hero, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition:'all 0.8s ease' }}>
        <div style={s.badge}>✦ Coach de vie nouvelle génération</div>

        <h1 style={s.h1}>
          Ton coach personnel<br />
          <span style={s.h1Gradient}>propulsé par l'IA</span>
        </h1>

        <p style={s.subtitle}>
          Oravia analyse ton profil, ton rythme de vie et tes objectifs<br />
          pour t'accompagner chaque jour vers ta meilleure version.
        </p>

        <div style={s.ctaRow}>
          <button style={s.btnPrimary} onClick={onCommencer}>
            Commencer gratuitement →
          </button>
          <div style={s.freeNote}>5 messages gratuits / jour · Sans carte bancaire</div>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[['∞','Conseils personnalisés'],['6','Domaines de bien-être'],['24/7','Disponible pour toi']].map(([val, label]) => (
            <div key={label} style={s.statItem}>
              <div style={s.statVal}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={s.featuresSection}>
        <div style={s.sectionLabel}>Ce qu'Oravia fait pour toi</div>
        <div style={s.grid}>
          {features.map((f, i) => (
            <div key={i} style={s.card}>
              <div style={s.cardIcon}>{f.icon}</div>
              <div style={s.cardTitre}>{f.titre}</div>
              <div style={s.cardDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={s.ctaSection}>
        <div style={s.ctaBox}>
          <div style={{ fontSize:36, marginBottom:16 }}>✦</div>
          <h2 style={s.ctaTitle}>Prêt à transformer ton quotidien ?</h2>
          <p style={s.ctaSubtitle}>Rejoins Oravia et reçois des conseils adaptés à ta vie dès aujourd'hui.</p>
          <button style={s.btnPrimary} onClick={onCommencer}>
            Créer mon compte gratuitement
          </button>
          <div style={{ marginTop:16, fontSize:12, color:'rgba(255,255,255,0.2)' }}>
            Puis 4.99€/mois pour les conseils illimités
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <span style={s.footerLogo}>✦ Oravia</span>
        <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
        <span>Coach de vie IA</span>
        <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
        <span>Conditions d'utilisation</span>
      </footer>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'#050510', fontFamily:'Poppins, sans-serif', color:'white', position:'relative', overflowX:'hidden' },

  hero: { maxWidth:820, margin:'0 auto', padding:'120px 32px 80px', textAlign:'center', position:'relative', zIndex:1 },
  badge: { display:'inline-block', background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.22)', borderRadius:30, padding:'7px 18px', fontSize:12, color:'#00d4ff', fontWeight:600, marginBottom:32, letterSpacing:'0.5px' },
  h1: { fontSize:'clamp(36px, 6vw, 72px)', fontWeight:900, lineHeight:1.1, marginBottom:24, letterSpacing:'-2px', color:'rgba(255,255,255,0.95)' },
  h1Gradient: { background:'linear-gradient(135deg, #00d4ff 20%, #bf5af2 80%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  subtitle: { fontSize:'clamp(15px, 2vw, 19px)', color:'rgba(255,255,255,0.42)', lineHeight:1.8, marginBottom:44, fontWeight:400 },

  ctaRow: { display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginBottom:56 },
  btnPrimary: { background:'linear-gradient(135deg, #00d4ff, #0066cc)', color:'#000', border:'none', padding:'16px 40px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Poppins, sans-serif', boxShadow:'0 8px 32px rgba(0,212,255,0.45)', letterSpacing:'0.2px', transition:'transform 0.2s, box-shadow 0.2s' },
  freeNote: { fontSize:12, color:'rgba(255,255,255,0.22)', letterSpacing:'0.3px' },

  statsRow: { display:'flex', gap:0, justifyContent:'center', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:40 },
  statItem: { flex:1, maxWidth:180, textAlign:'center', padding:'0 20px', borderRight:'1px solid rgba(255,255,255,0.06)' },
  statVal: { fontSize:28, fontWeight:900, background:'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:6 },
  statLabel: { fontSize:12, color:'rgba(255,255,255,0.28)', lineHeight:1.4 },

  featuresSection: { maxWidth:1100, margin:'0 auto', padding:'0 32px 100px', position:'relative', zIndex:1 },
  sectionLabel: { textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'2.5px', marginBottom:48 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20 },
  card: { background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:'28px 26px', transition:'border-color 0.3s, transform 0.3s' },
  cardIcon: { fontSize:32, marginBottom:14 },
  cardTitre: { fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.88)', marginBottom:10 },
  cardDesc: { fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.75 },

  ctaSection: { padding:'0 32px 100px', position:'relative', zIndex:1 },
  ctaBox: { maxWidth:600, margin:'0 auto', background:'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(191,90,242,0.06))', border:'1px solid rgba(0,212,255,0.15)', borderRadius:28, padding:'60px 40px', textAlign:'center' },
  ctaTitle: { fontSize:28, fontWeight:800, marginBottom:14, letterSpacing:'-0.5px' },
  ctaSubtitle: { fontSize:14, color:'rgba(255,255,255,0.38)', marginBottom:32, lineHeight:1.7 },

  footer: { display:'flex', justifyContent:'center', alignItems:'center', gap:16, padding:'28px 32px', borderTop:'1px solid rgba(255,255,255,0.05)', fontSize:12, color:'rgba(255,255,255,0.22)', position:'relative', zIndex:1 },
  footerLogo: { fontWeight:800, fontSize:14, background:'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
}
