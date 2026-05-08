import React, { useState, useEffect } from 'react'

function BgBlobs() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-5%', left:'-8%', width:700, height:700, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 65%)', animation:'floatOrb 12s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:'25%', right:'-10%', width:800, height:800, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,154,60,0.08) 0%, transparent 65%)', animation:'floatOrb 16s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', bottom:'-5%', left:'30%', width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(168,139,250,0.07) 0%, transparent 65%)', animation:'floatOrb 10s ease-in-out infinite' }} />
    </div>
  )
}

const ROTATING = ['Nutrition', 'Sommeil', 'Stress', 'Style', 'Bien-être', 'Énergie']

const FEATURES = [
  { icon:'🧠', color:'#FF6B35', titre:'Coach IA personnalisé',  desc:'Une IA qui mémorise ton profil complet — pathologies, régimes, objectifs — pour des conseils qui te ressemblent vraiment.' },
  { icon:'🥗', color:'#34c759', titre:'Nutrition sur-mesure',   desc:'Idées repas adaptées à tes restrictions, tes carences et ton mode de vie. Jamais génériques, toujours personnalisés.' },
  { icon:'📋', color:'#5856d6', titre:'Routine quotidienne',    desc:'Un programme matin-midi-soir généré chaque jour selon ton heure de réveil, ton énergie et tes objectifs.' },
  { icon:'❤️', color:'#ff3b30', titre:'Suivi santé IA',        desc:'Pas, sommeil, hydratation, humeur — un score journalier et des insights IA pour progresser chaque jour.' },
  { icon:'👗', color:'#af52de', titre:'Style & météo',          desc:'Tenues suggérées selon la météo réelle de ta ville, ton style et l\'occasion. Jamais à court d\'idées.' },
  { icon:'🌿', color:'#30d158', titre:'Médecine naturelle',     desc:'Plantes, tisanes, techniques holistiques — des recommandations ciblées basées sur ton profil santé exact.' },
]

const TESTIMONIALS = [
  { name:'Sophie M.', tag:'Perte de poids', stars:5,
    text:'"J\'ai perdu 8 kg en 3 mois grâce aux conseils nutrition. Oravia comprend vraiment mes contraintes halal et ma carence en fer."' },
  { name:'Thomas L.', tag:'Productivité',  stars:5,
    text:'"La routine du matin générée par Oravia a transformé mes journées. Je dors mieux, je me concentre mieux."' },
  { name:'Amira K.', tag:'SOPK & bien-être', stars:5,
    text:'"Les recommandations de plantes pour mon SOPK sont d\'une précision incroyable. Enfin un coach qui prend mes pathologies au sérieux."' },
]

const PLANS = [
  {
    name:'Gratuit', price:'0€', period:'',
    color:'#8a7265', gradient:'linear-gradient(135deg,#f5ede8,#fff3ee)',
    border:'rgba(139,114,101,0.2)',
    features:['5 messages IA / jour','Suivi santé basique','Quiz de profil adaptatif','Conseils personnalisés limités'],
    cta:'Commencer gratuitement', main:false,
  },
  {
    name:'Pro', price:'4.99€', period:'/mois',
    color:'#FF6B35', gradient:'linear-gradient(135deg,#FF6B35,#E55A00)',
    border:'rgba(255,107,53,0.35)',
    badge:'⚡ Le plus populaire',
    features:['Messages IA illimités 24/7','Routine quotidienne personnalisée','Analyse herbal IA complète','Suggestions tenues avec météo','Insights santé IA avancés','Historique 30 jours + graphiques','Support prioritaire'],
    cta:'Essayer Pro →', main:true,
  },
]

export default function Landing({ onCommencer }) {
  const [visible, setVisible]     = useState(false)
  const [rotIdx, setRotIdx]       = useState(0)
  const [rotFade, setRotFade]     = useState(true)

  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setRotFade(false)
      setTimeout(() => { setRotIdx(i => (i + 1) % ROTATING.length); setRotFade(true) }, 300)
    }, 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        @keyframes floatOrb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-22px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .plan-card:hover { transform: translateY(-6px) !important; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.10) !important; }
        .btn-primary:hover { transform: scale(1.03); box-shadow: 0 16px 48px rgba(255,107,53,0.50) !important; }
        .btn-primary:active { transform: scale(0.97); }
        .testi-card:hover { transform: translateY(-3px); }
        * { box-sizing: border-box; }
      `}</style>

      <BgBlobs />

      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={s.navLogo}>✦ Oravia</div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span style={s.navFree}>5 messages gratuits/jour</span>
          <button style={s.navCta} onClick={onCommencer}>Commencer →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ ...s.hero, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)', transition:'all 0.9s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
        <div style={s.heroEyebrow}>
          <span style={s.heroDot} />
          Coach de vie IA · Nouvelle génération
        </div>

        <h1 style={s.h1}>
          Ton expert personnel en<br />
          <span style={{
            ...s.h1Accent,
            opacity: rotFade ? 1 : 0,
            transform: rotFade ? 'none' : 'translateY(-8px)',
            transition:'opacity 0.3s ease, transform 0.3s ease',
          }}>{ROTATING[rotIdx]}</span>
        </h1>

        <p style={s.subtitle}>
          Oravia analyse ton profil complet, tes objectifs et ton rythme de vie<br />
          pour t'accompagner chaque jour avec des conseils vraiment personnalisés.
        </p>

        <button className="btn-primary" style={s.btnPrimary} onClick={onCommencer}>
          Créer mon profil gratuitement →
        </button>
        <div style={s.heroNote}>Sans carte bancaire · Prêt en 2 minutes</div>

        <div style={s.statsRow}>
          {[['6','Domaines couverts'],['∞','Conseils sur-mesure'],['24/7','Disponible'],['100%','Personnalisé']].map(([v,l]) => (
            <div key={l} style={s.statItem}>
              <div style={s.statVal}>{v}</div>
              <div style={s.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={s.section}>
        <div style={s.sectionTag}>Fonctionnalités</div>
        <h2 style={s.sectionTitle}>Tout ce dont tu as besoin,<br /><span style={s.h1Accent2}>dans une seule app</span></h2>
        <div style={s.featGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{
              ...s.featCard,
              borderTop:`4px solid ${f.color}`,
              animationDelay:`${i*0.08}s`,
              transition:'transform 0.25s ease, box-shadow 0.25s ease',
            }}>
              <div style={{ ...s.featIcon, background:`${f.color}15`, border:`1.5px solid ${f.color}28` }}>
                <span style={{ fontSize:26 }}>{f.icon}</span>
              </div>
              <div style={s.featTitle}>{f.titre}</div>
              <div style={s.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ ...s.section, background:'linear-gradient(135deg,rgba(255,107,53,0.04),rgba(255,154,60,0.03))' }}>
        <div style={s.sectionTag}>Témoignages</div>
        <h2 style={s.sectionTitle}>Ils ont transformé<br /><span style={s.h1Accent2}>leur quotidien</span></h2>
        <div style={s.testiRow}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testi-card" style={{
              ...s.testiCard,
              transition:'transform 0.22s ease, box-shadow 0.22s ease',
              animationDelay:`${i*0.1}s`,
            }}>
              <div style={s.testiStars}>{'⭐'.repeat(t.stars)}</div>
              <div style={s.testiText}>{t.text}</div>
              <div style={s.testiAuthor}>
                <div style={s.testiAvatar}>{t.name.charAt(0)}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1a0a00' }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'#FF6B35', fontWeight:600 }}>{t.tag}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={s.section} id="pricing">
        <div style={s.sectionTag}>Tarifs</div>
        <h2 style={s.sectionTitle}>Simple et transparent</h2>
        <div style={s.plansRow}>
          {PLANS.map((p, i) => (
            <div key={i} className="plan-card" style={{
              ...s.planCard,
              border: p.main ? `2px solid rgba(255,107,53,0.40)` : `1.5px solid ${p.border}`,
              boxShadow: p.main
                ? '0 24px 64px rgba(255,107,53,0.22), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)'
                : '0 8px 28px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              transition:'transform 0.25s ease, box-shadow 0.25s ease',
              position:'relative', overflow:'hidden',
            }}>
              {p.main && (
                <div style={{ position:'absolute', top:0, left:0, right:0, height:4,
                  background:'linear-gradient(90deg,#FF6B35,#FF9A3C)', borderRadius:'16px 16px 0 0' }} />
              )}
              {p.badge && (
                <div style={s.planBadge}>{p.badge}</div>
              )}
              <div style={{ ...s.planName, color: p.main ? '#FF6B35' : '#8a7265' }}>{p.name}</div>
              <div style={s.planPrice}>
                <span style={{ ...s.planPriceNum, color: p.main ? '#1a0a00' : '#8a7265' }}>{p.price}</span>
                <span style={{ fontSize:14, color:'#c4b5a8', fontWeight:500 }}>{p.period}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, margin:'20px 0 28px', flex:1 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{
                      width:20, height:20, borderRadius:6, flexShrink:0,
                      background: p.main ? 'linear-gradient(135deg,#FF6B35,#E55A00)' : '#f0e8e0',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: p.main ? '0 3px 8px rgba(255,107,53,0.35)' : 'none',
                    }}>
                      <span style={{ fontSize:10, color: p.main ? '#fff' : '#8a7265', fontWeight:800 }}>✓</span>
                    </div>
                    <span style={{ fontSize:13, color: p.main ? '#1a0a00' : '#8a7265', fontWeight: p.main ? 500 : 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                className={p.main ? 'btn-primary' : ''}
                style={{
                  width:'100%', padding:'14px', borderRadius:14, border:'none',
                  fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Poppins,sans-serif',
                  background: p.main ? 'linear-gradient(135deg,#FF6B35,#E55A00)' : 'rgba(0,0,0,0.05)',
                  color: p.main ? '#fff' : '#8a7265',
                  boxShadow: p.main ? '0 8px 24px rgba(255,107,53,0.40)' : 'none',
                  transition:'transform 0.15s, box-shadow 0.15s',
                }}
                onClick={onCommencer}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── APP STORES ── */}
      <section style={{ ...s.section, textAlign:'center' }}>
        <div style={s.sectionTag}>Bientôt disponible</div>
        <h2 style={s.sectionTitle}>Application mobile<br /><span style={s.h1Accent2}>iOS & Android</span></h2>
        <p style={{ color:'#8a7265', fontSize:14, marginBottom:32, lineHeight:1.7 }}>
          L'app native avec notifications push, suivi HealthKit et accès hors-ligne arrive prochainement.
        </p>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          {[
            { store:'App Store', icon:'🍎', sub:'iOS • iPhone & iPad' },
            { store:'Google Play', icon:'🤖', sub:'Android • Tous appareils' },
          ].map(s2 => (
            <div key={s2.store} style={{
              display:'flex', alignItems:'center', gap:14, padding:'14px 28px',
              background:'rgba(0,0,0,0.04)', border:'1.5px solid #f0e8e0',
              borderRadius:18, opacity:0.6, cursor:'not-allowed',
              boxShadow:'0 4px 16px rgba(0,0,0,0.05)',
            }}>
              <span style={{ fontSize:28 }}>{s2.icon}</span>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:10, color:'#8a7265', fontWeight:600 }}>Bientôt sur</div>
                <div style={{ fontSize:15, fontWeight:800, color:'#1a0a00' }}>{s2.store}</div>
                <div style={{ fontSize:10, color:'#c4b5a8' }}>{s2.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:20, fontSize:12, color:'#c4b5a8' }}>
          🔔 En attendant, accède à Oravia depuis ton navigateur mobile
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding:'20px 32px 80px', textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{
          maxWidth:540, margin:'0 auto',
          background:'linear-gradient(145deg,rgba(255,107,53,0.08),rgba(255,154,60,0.05))',
          border:'1.5px solid rgba(255,107,53,0.20)',
          borderRadius:32, padding:'52px 40px',
          boxShadow:'0 24px 64px rgba(255,107,53,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>
          <div style={{ fontSize:42, marginBottom:16 }}>✦</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:'#1a0a00', marginBottom:14, letterSpacing:'-0.5px' }}>
            Prêt à transformer ton quotidien ?
          </h2>
          <p style={{ fontSize:14, color:'#8a7265', marginBottom:32, lineHeight:1.75 }}>
            Rejoins Oravia maintenant et reçois des conseils personnalisés dès aujourd'hui.<br />
            5 messages gratuits chaque jour, sans carte bancaire.
          </p>
          <button className="btn-primary" style={{ ...s.btnPrimary, width:'100%', maxWidth:360, margin:'0 auto', display:'block' }} onClick={onCommencer}>
            Créer mon compte gratuitement →
          </button>
          <div style={{ marginTop:14, fontSize:12, color:'#c4b5a8' }}>Puis 4.99€/mois pour les conseils illimités</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerTop}>
          <div style={s.footerLogo}>✦ Oravia</div>
          <div style={s.footerTagline}>Coach de vie IA personnalisé</div>
        </div>
        <div style={s.footerLinks}>
          <span style={s.footerLink}>Confidentialité</span>
          <span style={{ color:'rgba(255,255,255,0.1)' }}>·</span>
          <span style={s.footerLink}>CGU</span>
          <span style={{ color:'rgba(255,255,255,0.1)' }}>·</span>
          <span style={s.footerLink}>Contact</span>
        </div>
        <div style={s.footerCopy}>© 2026 Oravia · Tous droits réservés</div>
      </footer>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'#FFF8F4', fontFamily:'Poppins, sans-serif', color:'#1a0a00', position:'relative', overflowX:'hidden' },

  nav: { position:'sticky', top:0, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'16px 32px', background:'rgba(255,248,244,0.92)', backdropFilter:'blur(20px)',
    borderBottom:'1px solid rgba(255,107,53,0.08)', boxShadow:'0 4px 20px rgba(255,107,53,0.06)' },
  navLogo: { fontSize:20, fontWeight:900, letterSpacing:'-0.5px',
    background:'linear-gradient(135deg,#FF6B35,#E55A00)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  navFree: { fontSize:11, color:'#c4b5a8', fontWeight:500, display:'none' },
  navCta: { background:'linear-gradient(135deg,#FF6B35,#E55A00)', color:'#fff', border:'none',
    padding:'10px 22px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', boxShadow:'0 4px 16px rgba(255,107,53,0.35)' },

  hero: { maxWidth:820, margin:'0 auto', padding:'80px 32px 60px', textAlign:'center', position:'relative', zIndex:1 },
  heroEyebrow: { display:'inline-flex', alignItems:'center', gap:8,
    background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.22)',
    borderRadius:30, padding:'7px 18px', fontSize:12, color:'#FF6B35', fontWeight:700,
    marginBottom:28, letterSpacing:'0.3px' },
  heroDot: { width:7, height:7, borderRadius:'50%', background:'#FF6B35', display:'inline-block',
    boxShadow:'0 0 8px rgba(255,107,53,0.7)' },
  h1: { fontSize:'clamp(32px,6vw,68px)', fontWeight:900, lineHeight:1.1, marginBottom:24,
    letterSpacing:'-2px', color:'#1a0a00' },
  h1Accent: { display:'block', background:'linear-gradient(135deg,#FF6B35 20%,#FF9A3C 80%)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  h1Accent2: { background:'linear-gradient(135deg,#FF6B35 20%,#FF9A3C 80%)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  subtitle: { fontSize:'clamp(14px,2vw,18px)', color:'#8a7265', lineHeight:1.8, marginBottom:40, fontWeight:400 },
  btnPrimary: { background:'linear-gradient(135deg,#FF6B35,#E55A00)', color:'#fff', border:'none',
    padding:'17px 44px', borderRadius:18, fontSize:16, fontWeight:800, cursor:'pointer',
    fontFamily:'Poppins,sans-serif', boxShadow:'0 10px 36px rgba(255,107,53,0.40)',
    letterSpacing:'0.2px', transition:'transform 0.2s, box-shadow 0.2s', display:'inline-block' },
  heroNote: { fontSize:12, color:'#c4b5a8', marginTop:14, letterSpacing:'0.2px' },

  statsRow: { display:'flex', gap:0, justifyContent:'center', borderTop:'1px solid #f0e8e0',
    paddingTop:40, marginTop:48 },
  statItem: { flex:1, maxWidth:160, textAlign:'center', padding:'0 16px',
    borderRight:'1px solid #f0e8e0' },
  statVal: { fontSize:26, fontWeight:900,
    background:'linear-gradient(135deg,#FF6B35,#FF9A3C)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:4 },
  statLabel: { fontSize:11, color:'#8a7265', lineHeight:1.4, fontWeight:500 },

  section: { maxWidth:1100, margin:'0 auto', padding:'80px 32px', position:'relative', zIndex:1 },
  sectionTag: { textAlign:'center', fontSize:11, color:'#FF6B35', textTransform:'uppercase',
    letterSpacing:'2.5px', marginBottom:16, fontWeight:700 },
  sectionTitle: { textAlign:'center', fontSize:'clamp(24px,4vw,42px)', fontWeight:900,
    letterSpacing:'-1px', marginBottom:52, color:'#1a0a00', lineHeight:1.15 },

  featGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 },
  featCard: { background:'#ffffff', border:'1px solid #f0e8e0', borderRadius:22,
    padding:'28px 24px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  featIcon: { width:52, height:52, borderRadius:16, display:'flex', alignItems:'center',
    justifyContent:'center', marginBottom:16 },
  featTitle: { fontSize:15, fontWeight:800, color:'#1a0a00', marginBottom:10, letterSpacing:'-0.2px' },
  featDesc: { fontSize:13, color:'#8a7265', lineHeight:1.75 },

  testiRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 },
  testiCard: { background:'#fff', border:'1px solid #f0e8e0', borderRadius:24,
    padding:'28px 24px', boxShadow:'0 6px 24px rgba(0,0,0,0.06)' },
  testiStars: { fontSize:14, marginBottom:14, letterSpacing:2 },
  testiText: { fontSize:14, color:'#4a3c35', lineHeight:1.75, fontStyle:'italic', marginBottom:20 },
  testiAuthor: { display:'flex', alignItems:'center', gap:12 },
  testiAvatar: { width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#FF6B35,#FF9A3C)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff', flexShrink:0 },

  plansRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24,
    maxWidth:700, margin:'0 auto' },
  planCard: { background:'#fff', borderRadius:24, padding:'32px 28px',
    display:'flex', flexDirection:'column' },
  planBadge: { display:'inline-flex', alignSelf:'flex-start', marginBottom:14,
    background:'linear-gradient(135deg,#FF6B35,#E55A00)', color:'#fff',
    padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:700,
    boxShadow:'0 4px 12px rgba(255,107,53,0.35)' },
  planName: { fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 },
  planPrice: { display:'flex', alignItems:'baseline', gap:4, marginBottom:4 },
  planPriceNum: { fontSize:44, fontWeight:900, letterSpacing:'-2px' },

  footer: { background:'#1a0a00', padding:'48px 32px 40px', textAlign:'center' },
  footerTop: { marginBottom:16 },
  footerLogo: { fontSize:22, fontWeight:900,
    background:'linear-gradient(135deg,#FF6B35,#FF9A3C)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
    marginBottom:6 },
  footerTagline: { fontSize:12, color:'rgba(255,255,255,0.35)', fontWeight:500 },
  footerLinks: { display:'flex', justifyContent:'center', gap:16, alignItems:'center',
    marginBottom:16 },
  footerLink: { fontSize:12, color:'rgba(255,255,255,0.35)', cursor:'pointer',
    transition:'color 0.2s' },
  footerCopy: { fontSize:11, color:'rgba(255,255,255,0.18)' },
}
