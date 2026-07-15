import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  FlashIcon, TargetIcon, MoonIcon, MeditateIcon, MuscleIcon, FoodIcon,
  BackIcon, BrainIcon, RefreshIcon, LightbulbIcon,
  SadIcon, NeutralIcon, MoodIcon, HappyIcon,
  SunIcon, BellIcon, RunIcon, FireIcon, StarIcon, DiamondIcon,
  BalanceIcon, WalkIcon, SofaIcon, WaveIcon, PillIcon, ChevronIcon,
} from './Icons'

// ─── ABSTRACT GLYPH ICONS — signature Solenn ─────────────────────────────────
const G = {
  Energy:       ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M14 3L6 13h5l-1 8 9-11h-5l1-7z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Body:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 18 Q4 8 12 8" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M20 18 Q20 8 12 8" stroke={color} strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="6" r="1.8" fill={color}/></svg>,
  Sleep:        ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M20 13.5A8.5 8.5 0 0110.5 4 7 7 0 1020 13.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="18" cy="7" r="1" fill={color}/><circle cx="21" cy="10.5" r=".7" fill={color}/></svg>,
  Calm:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><line x1="4" y1="9" x2="20" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="13" x2="18" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="17" x2="15" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  Move:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 18 Q8 10 14 7" stroke={color} strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="6" r="2" fill={color}/><path d="M17 9 L19 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Food:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 18 Q9 14 11 12 Q13 10 11 7" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M15 18 Q15 14 13 12 Q11 10 13 7" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="20" x2="15" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/></svg>,

  Sofa:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 16 Q4 10 12 10 Q20 10 20 16" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="16" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="7" y1="16" x2="7" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="16" x2="17" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  Walk:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="7" cy="14" r="1.5" fill={color} opacity=".45"/><circle cx="12" cy="12" r="2" fill={color} opacity=".72"/><circle cx="17" cy="10" r="2.5" fill={color}/></svg>,
  Run:          ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 19 L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round"/><path d="M15 5 Q19 5 19 10" stroke={color} strokeWidth="2" strokeLinecap="round"/><circle cx="5" cy="19" r="1.5" fill={color}/></svg>,
  Fire:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 20 Q6 16 8 10 Q9 7 12 6 Q11 9 14 10 Q18 8 16 4 Q20 8 18 14 Q17 18 12 20z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,

  Brain:        ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 12 Q17 7 19 12 Q21 18 16 20 Q10 22 7 17 Q4 12 8 8 Q12 4 17 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Refresh:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12 Q5 5 12 5 Q19 5 19 12 Q19 17 15 19" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M12 20 L15 19 L14 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Lightbulb:    ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2" fill={color}/><circle cx="12" cy="5" r="1" fill={color} opacity=".7"/><circle cx="12" cy="19" r="1" fill={color} opacity=".7"/><circle cx="5" cy="12" r="1" fill={color} opacity=".7"/><circle cx="19" cy="12" r="1" fill={color} opacity=".7"/><circle cx="7.5" cy="7.5" r=".8" fill={color} opacity=".45"/><circle cx="16.5" cy="7.5" r=".8" fill={color} opacity=".45"/><circle cx="7.5" cy="16.5" r=".8" fill={color} opacity=".45"/><circle cx="16.5" cy="16.5" r=".8" fill={color} opacity=".45"/></svg>,
  Wave:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 12 Q6 6 9 12 Q12 18 15 12 Q18 6 21 12" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,

  Sad:          ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 10 Q12 16 19 10" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="7" y1="18" x2="17" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  Neutral:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><line x1="5" y1="10" x2="19" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="15" x2="19" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  Mood:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 14 Q12 8 19 14" stroke={color} strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="1.5" fill={color}/></svg>,
  Happy:        ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.5" fill={color}/><line x1="12" y1="4" x2="12" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="12" x2="7" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,

  Morning:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 16 Q12 4 20 16" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M7 16 Q12 8 17 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".65"/><path d="M10 16 Q12 12 14 16" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity=".45"/><line x1="3" y1="17" x2="21" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".25"/></svg>,
  Day:          ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 4 L20 12 L12 20 L4 12 Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>,
  Evening:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 16 Q4 8 12 8 Q20 8 20 16" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="16" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="16" x2="12" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  Night:        ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M20 13.5A8.5 8.5 0 0110.5 4 7 7 0 1020 13.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="7" r="1" fill={color}/><circle cx="20.5" cy="10" r=".7" fill={color}/><circle cx="20" cy="14" r=".5" fill={color} opacity=".55"/></svg>,

  Solo:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" fill={color}/><path d="M5 20 Q5 15 9 13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".55"/><path d="M19 20 Q19 15 15 13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".55"/></svg>,
  Couple:       ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="12" r="2.5" fill={color}/><circle cx="16" cy="12" r="2.5" fill={color}/><path d="M8 9 Q12 4 16 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Family:       ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="2.5" fill={color}/><circle cx="7" cy="16" r="2" fill={color} opacity=".8"/><circle cx="17" cy="16" r="2" fill={color} opacity=".8"/><path d="M9.8 14 L12 9.5 L14.2 14" stroke={color} strokeWidth="1" strokeLinecap="round" opacity=".3"/></svg>,
  Coloc:        ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill={color} opacity=".45"/><circle cx="10" cy="12" r="2" fill={color} opacity=".68"/><circle cx="15" cy="12" r="2" fill={color} opacity=".85"/><circle cx="20" cy="12" r="1.5" fill={color} opacity=".55"/></svg>,

  Office:       ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="12" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="18" x2="16" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  Travel:       ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 8 Q6 4 9 8 Q12 12 15 8 Q18 4 21 8" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M3 16 Q6 12 9 16 Q12 20 15 16 Q18 12 21 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".5"/></svg>,
  ShiftWork:    ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M18 8 A6 6 0 1 1 18 16" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="18" x2="18" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Freelance:    ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="1.8" fill={color}/><circle cx="12" cy="5" r="1.2" fill={color} opacity=".6"/><circle cx="19" cy="8.5" r="1.2" fill={color} opacity=".6"/><circle cx="19" cy="15.5" r="1.2" fill={color} opacity=".6"/><circle cx="12" cy="19" r="1.2" fill={color} opacity=".6"/><circle cx="5" cy="15.5" r="1.2" fill={color} opacity=".6"/><circle cx="5" cy="8.5" r="1.2" fill={color} opacity=".6"/></svg>,

  Healthy:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 14 Q12 7 19 14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/></svg>,
  Anxiety:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 12 Q17 7 19 12 Q21 18 16 20 Q10 22 7 17 Q4 12 8 8 Q12 4 17 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  SleepBad:     ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M19 13A8 8 0 0111 5a6.5 6.5 0 108 8z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="6" y1="18" x2="19" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/></svg>,
  Pain:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 14 L7 8 L10 16 L13 10 L16 16 L19 8 L21 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Endo:         ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill={color}/><circle cx="19" cy="12" r="1.5" fill={color}/><circle cx="12" cy="19" r="1.5" fill={color}/><circle cx="5" cy="12" r="1.5" fill={color}/><path d="M12 6.5 Q18.5 6.5 18.5 12 Q18.5 18.5 12 18.5 Q5.5 18.5 5.5 12 Q5.5 6.5 12 6.5" stroke={color} strokeWidth="1" opacity=".3"/></svg>,
  FoodRel:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 12 Q5 9 7 12 Q10 16 12 11 Q14 6 17 12 Q19 16 21 12" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  Fatigue:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 8 Q12 15 20 8" stroke={color} strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="18" r="2" fill={color}/><line x1="12" y1="15" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Chronic:      ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12 Q5 7 9 7 Q12 7 12 12 Q12 7 15 7 Q19 7 19 12 Q19 17 12 20 Q5 17 5 12z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Other:        ({color='#C87B52',size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="7" cy="17" r="2" fill={color} opacity=".5"/><circle cx="12" cy="12" r="2" fill={color} opacity=".75"/><circle cx="17" cy="7" r="2" fill={color}/></svg>,
}

// ─── BG BLOBS ─────────────────────────────────────────────────────────────────
function BgBlobs() {
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 50% 48%, #FFF991 0%, transparent 68%)',
        opacity:0.62, mixBlendMode:'multiply',
        animation:'liquidBlob3 14s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 42% 58%, #FF7112 0%, transparent 62%)',
        opacity:0.20, mixBlendMode:'multiply',
        animation:'liquidBlob1 18s ease-in-out infinite reverse',
      }}/>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle at 88% 8%, rgba(232,140,80,0.35) 0%, transparent 58%)',
        animation:'liquidBlob2 16s ease-in-out infinite',
      }}/>
    </div>
  )
}

// ─── ANIMATED QUESTION TEXT ───────────────────────────────────────────────────
function AnimatedQuestion({ text, style }) {
  return (
    <motion.p
      style={{ ...style, margin:0 }}
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.24, ease:'easeOut' }}
    >
      {text}
    </motion.p>
  )
}

// ─── REVEAL SCREEN ────────────────────────────────────────────────────────────
function RevealScreen({ answers, onEnter }) {
  const [visible, setVisible] = useState(false)
  const [btnVisible, setBtnVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 120)
    setTimeout(() => setBtnVisible(true), 900)
  }, [])

  const nom = answers.nom || 'toi'
  const objectifs = answers.objectif ? [answers.objectif] : []
  const tags = [answers.activite, answers.age].filter(Boolean)

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'linear-gradient(160deg,#FFF8F2 0%,#FDEEE0 50%,#FFF4EC 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'40px 28px',
      fontFamily:"'DM Sans', sans-serif",
    }}>
      <BgBlobs step={0} />
      <div style={{
        position:'relative', zIndex:1, width:'100%', maxWidth:400,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition:'opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)',
        display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
      }}>
        <div style={{
          width:88, height:88, borderRadius:'50%',
          background:'linear-gradient(135deg,rgba(200,123,82,0.35),rgba(190,112,30,0.25))',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:24,
          boxShadow:'0 0 0 8px rgba(200,123,82,0.08), 0 0 0 16px rgba(200,123,82,0.04)',
          animation:'revealPulse 2.8s ease-in-out infinite',
        }}>
          <span style={{
            fontSize:38, fontWeight:800, color:'rgba(200,123,82,0.80)',
            fontFamily:'Poppins, sans-serif', letterSpacing:'-0.02em',
          }}>
            {nom.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{fontSize:13, fontWeight:600, color:'rgba(200,123,82,0.70)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10}}>
          Profil créé
        </div>
        <h1 style={{fontSize:'clamp(28px,7vw,40px)', fontWeight:900, color:'#5C2E0A', letterSpacing:'-0.03em', marginBottom:6, lineHeight:1.1}}>
          Bonjour, {nom} !
        </h1>
        <p style={{fontSize:15, color:'rgba(200,123,82,0.70)', marginBottom:32, lineHeight:1.6}}>
          Solenn connaît ton profil et est prête à t'accompagner.
        </p>
        {objectifs.length > 0 && (
          <div style={{marginBottom:20, width:'100%'}}>
            <div style={{fontSize:11, fontWeight:700, color:'rgba(200,123,82,0.62)', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:10}}>
              Ton objectif
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center'}}>
              {objectifs.map(o => (
                <span key={o} style={{
                  padding:'7px 16px', borderRadius:20,
                  background:'rgba(200,123,82,0.09)',
                  border:'1px solid rgba(200,123,82,0.22)',
                  fontSize:12, fontWeight:600, color:'rgba(200,123,82,0.80)',
                }}>{o}</span>
              ))}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div style={{display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center', marginBottom:40}}>
            {tags.map(t => (
              <span key={t} style={{
                padding:'5px 12px', borderRadius:20,
                background:'rgba(200,123,82,0.05)',
                border:'1px solid rgba(200,123,82,0.14)',
                fontSize:11, fontWeight:500, color:'rgba(200,123,82,0.70)',
              }}>{t}</span>
            ))}
          </div>
        )}
        <button
          onClick={onEnter}
          style={{
            width:'100%', height:52,
            background:'transparent',
            color:'rgba(200,123,82,0.78)', border:'1.5px solid rgba(200,123,82,0.32)', borderRadius:30,
            fontSize:15, fontWeight:600, cursor:'pointer',
            fontFamily:'Poppins, sans-serif',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            opacity: btnVisible ? 1 : 0,
            transform: btnVisible ? 'translateY(0)' : 'translateY(14px)',
            transition:'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            letterSpacing:'0.2px', outline:'none',
          }}
        >
          Entrer dans Solenn
          <span style={{display:'inline-block', fontSize:18}}>→</span>
        </button>
      </div>
    </div>
  )
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const OBJECTIF_OPTIONS = [
  { Icon: G.Energy,    label:'Retrouver mon énergie',          desc:'Retrouver cet élan que j\'ai quelque part perdu'        },
  { Icon: G.Body,      label:'Me réconcilier avec mon corps',  desc:'Trouver l\'équilibre sans régime ni privation'           },
  { Icon: G.Sleep,     label:'Dormir enfin comme il faut',     desc:'Me réveiller avec de l\'énergie, pas à plat dès le matin'},
  { Icon: G.Calm,      label:'Retrouver ma sérénité',          desc:'Moins de tensions, plus de clarté au quotidien'         },
  { Icon: G.Move,      label:'Reprendre le mouvement',         desc:'Bouger parce que ça me fait du bien, pas par obligation'},
  { Icon: G.Food,      label:'Manger sans culpabiliser',       desc:'Reconstruire une vraie relation avec la nourriture'     },
]

const ACTIVITE_OPTIONS = [
  { Icon: G.Sofa,  label:'Pas vraiment mon truc',    desc:'Je bouge peu, surtout entre le bureau et le canapé' },
  { Icon: G.Walk,  label:'J\'essaie de bouger',      desc:'Quelques sorties ou marches dans la semaine'        },
  { Icon: G.Run,   label:'Je fais du sport',         desc:'Deux à quatre séances par semaine'                  },
  { Icon: G.Fire,  label:'Le sport, c\'est ma vie',  desc:'Je m\'entraîne tous les jours ou presque'           },
]

const AGE_RANGE_OPTIONS = [
  { range:'18–24 ans',   Icon: SunIcon     },
  { range:'25–34 ans',   Icon: FlashIcon   },
  { range:'35–44 ans',   Icon: TargetIcon  },
  { range:'45–54 ans',   Icon: StarIcon    },
  { range:'55 ans et +', Icon: DiamondIcon },
]


const TRIGGER_OPTIONS = [
  { Icon: G.Brain,      label:'J\'ai atteint mes limites',      desc:'Trop de pression, quelque chose doit changer'         },
  { Icon: G.Refresh,    label:'Je veux tourner une page',       desc:'Je sens qu\'il est temps de faire autrement'          },
  { Icon: G.Lightbulb,  label:'Pure curiosité',                 desc:'Je veux voir ce que ça peut m\'apporter'              },
  { Icon: G.Wave,       label:'Ma vie est en train de changer', desc:'Quelque chose a changé et je cherche à me retrouver'  },
]

const BASELINE_OPTIONS = [
  { Icon: G.Sad,     label:'À bout, vraiment',           desc:'Je tourne à vide et j\'ai besoin d\'un vrai souffle'  },
  { Icon: G.Neutral, label:'Ça fait le job',             desc:'Ni bien ni mal, je vis un peu en mode automatique'    },
  { Icon: G.Mood,    label:'Bien, mais j\'aspire à plus',desc:'Quelque chose me manque, je veux aller plus loin'    },
  { Icon: G.Happy,   label:'Au top !',                   desc:'Je veux maintenir cet élan et continuer à progresser'},
]

const MOMENT_OPTIONS = [
  { Icon: G.Morning,  label:'Le matin',   desc:'Je commence la journée pour moi, avant que tout démarre'  },
  { Icon: G.Day,      label:'En journée', desc:'Mes pauses sont précieuses, j\'en profite pour souffler'  },
  { Icon: G.Evening,  label:'Le soir',    desc:'Je décompresse après une longue journée'                  },
  { Icon: G.Night,    label:'La nuit',    desc:'Le calme de la nuit, c\'est mon moment à moi'             },
]

const VIE_OPTIONS = [
  { Icon: G.Solo,    label:'Seul·e',        desc:'J\'organise mon quotidien comme je l\'entends'             },
  { Icon: G.Couple,  label:'En couple',      desc:'On partage le quotidien, les routines, les repas'          },
  { Icon: G.Family,  label:'En famille',     desc:'Il y a des enfants dans ma vie, c\'est plus complexe'     },
  { Icon: G.Coloc,   label:'En colocation',  desc:'On vit ensemble mais chacun a son propre rythme'          },
]

const SANTE_OPTIONS = [
  { Icon: G.Healthy,   label:'Tout va bien de ce côté',          desc:'Pas de condition particulière à signaler'              },
  { Icon: G.Anxiety,   label:'Anxiété ou stress chronique',      desc:'Je me sens souvent submergé·e mentalement'            },
  { Icon: G.SleepBad,  label:'Troubles du sommeil',              desc:'J\'ai du mal à dormir ou à vraiment récupérer'        },
  { Icon: G.Pain,      label:'Douleurs ou blessures',            desc:'Chronique, passagère, blessure récente ou courbatures'  },
  { Icon: G.Endo,      label:'Endométriose',                     desc:'Douleurs chroniques et fatigue liées au cycle'        },
  { Icon: G.FoodRel,   label:'Rapport compliqué avec la nourriture', desc:'Restrictions, compulsions ou culpabilité autour des repas'},
  { Icon: G.Fatigue,   label:'Fatigue profonde',                 desc:'Une fatigue qui ne part pas même après avoir dormi'   },
  { Icon: G.Chronic,   label:'Maladie diagnostiquée',            desc:'Diabète, hypertension ou autre pathologie chronique'  },
  { Icon: G.Other,     label:'Autre chose',                      desc:'Je l\'expliquerai directement à Solenn'               },
]

const RYTHME_OPTIONS = [
  { Icon: G.Office,    label:'Bureau ou télétravail',   desc:'Je travaille assis la plupart du temps'                },
  { Icon: G.Travel,    label:'Souvent en déplacement',  desc:'Je suis rarement au même endroit deux jours de suite' },
  { Icon: G.ShiftWork, label:'Horaires décalés',        desc:'Nuits, week-ends, mon planning est peu classique'     },
  { Icon: G.Freelance, label:'À mon compte',            desc:'Je gère mon propre temps, freelance ou entrepreneur'  },
]

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  question: {
    fontSize:'clamp(22px,5vw,28px)', fontWeight:600, lineHeight:1.35,
    color:'rgba(184,105,58,0.90)', fontFamily:"'DM Sans', sans-serif",
    letterSpacing:'-0.01em',
  },
  sub: {
    fontSize:14, fontWeight:400, color:'rgba(184,105,58,0.58)',
    fontFamily:"'DM Sans', sans-serif", lineHeight:1.55,
  },
  input: {
    width:'100%', padding:'16px 20px', borderRadius:16, boxSizing:'border-box',
    border:'1.5px solid rgba(200,123,82,0.42)',
    background:'rgba(255,248,244,0.92)',
    fontSize:16, fontFamily:"'DM Sans', sans-serif", color:'rgba(200,123,82,0.92)',
    outline:'none', fontWeight:500,
    boxShadow:'0 2px 14px rgba(200,123,82,0.09)',
    transition:'border-color 0.2s, box-shadow 0.2s',
  },
  cta: {
    width:'100%', padding:'17px', borderRadius:16, border:'none',
    background:'linear-gradient(110deg, #B8683A 0%, #C87B52 55%, #B8683A 100%)',
    backgroundSize:'250% 100%',
    color:'#FFF5EE', fontSize:16, fontWeight:600, cursor:'pointer',
    fontFamily:"'DM Sans', sans-serif", letterSpacing:'0.3px',
    boxShadow:'0 8px 24px rgba(184,104,58,0.38)',
    transition:'opacity 0.2s, box-shadow 0.2s',
    outline:'none',
  },
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Onboarding({ onTermine }) {
  const [step, setStep] = useState(() => {
    const s = sessionStorage.getItem('solenn_onboarding_step')
    return s ? parseInt(s, 10) : 0
  })
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('solenn_onboarding_answers') || '{}') } catch { return {} }
  })
  const [nomVal, setNomVal] = useState(() => {
    try {
      const a = JSON.parse(sessionStorage.getItem('solenn_onboarding_answers') || '{}')
      return a.nom || ''
    } catch { return '' }
  })
  const [showReveal, setShowReveal] = useState(false)
  const [slideDir, setSlideDir] = useState(1)
  const [tapped, setTapped] = useState(null)
  const [rippleKey, setRippleKey] = useState(0)
  const [santeSelections, setSanteSelections] = useState([])
  const nomRef = useRef(null)

  useEffect(() => {
    if (step === 0) setTimeout(() => nomRef.current?.focus(), 350)
  }, [step])

  useEffect(() => {
    sessionStorage.setItem('solenn_onboarding_step', step)
    sessionStorage.setItem('solenn_onboarding_answers', JSON.stringify(answers))
  }, [step, answers])

  function goNext(newAnswers) {
    setAnswers(newAnswers)
    setSlideDir(1)
    setTapped(null)
    setStep(s => s + 1)
  }

  function goBack() {
    setSlideDir(-1)
    setTapped(null)
    setStep(s => s - 1)
  }

  function tapThen(key, fn) {
    setTapped(key)
    setTimeout(fn, 230)
  }

  function finishOnboarding(finalAnswers) {
    const a = finalAnswers
    const profil = {
      nom:              a.nom || 'Ami',
      objectif:         a.objectif || '',
      objectifs:        a.objectif ? [a.objectif] : [],
      age:              a.age || '',
      activite:         a.activite || '',
      declencheur:      a.declencheur || '',
      baseline:         a.baseline || '',
      moment:           a.moment || '',
      vie:              a.vie || '',
      rythme:           a.rythme || '',
      alimentation:     [],
      heure_lever:      7.5,
      heure_coucher:    23.5,
      profession:       '',
      poids:            0,
      taille:           0,
      sante:            a.sante_conditions && a.sante_conditions.length > 0 && !a.sante_conditions.includes('Aucune condition particulière'),
      sante_conditions: a.sante_conditions || [],
      isPro:            false,
    }
    localStorage.setItem('vitacoach_profil', JSON.stringify(profil))
    window._solennProfil = profil
    sessionStorage.removeItem('solenn_onboarding_step')
    sessionStorage.removeItem('solenn_onboarding_answers')
    setShowReveal(true)
  }

  if (showReveal) {
    return <RevealScreen answers={answers} onEnter={() => onTermine(answers)} />
  }

  const slideVariants = {
    enter:  (d) => ({ opacity:0, x: d * 72, scale:0.94 }),
    center: { opacity:1, x:0, scale:1, transition:{ type:'spring', stiffness:340, damping:26, mass:0.85 } },
    exit:   (d) => ({ opacity:0, x: -d * 54, scale:0.97, transition:{ duration:0.16, ease:'easeIn' } }),
  }

  const nom = answers.nom || ''

  function renderStep() {

    // ── Étape 0 : Prénom ──────────────────────────────────────────────────────
    if (step === 0) return (
      <div style={{display:'flex', flexDirection:'column', gap:40}}>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <AnimatedQuestion text="Comment tu t'appelles ?" style={S.question} />
          <motion.p
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.35, duration:0.4 }}
            style={S.sub}
          >
            Pour que Solenn puisse s'adresser à toi.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35, duration:0.24, ease:'easeOut' }}
          style={{display:'flex', flexDirection:'column', gap:16}}
        >
          <input
            ref={nomRef}
            type="text"
            value={nomVal}
            onChange={e => setNomVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && nomVal.trim() && goNext({ nom: nomVal.trim() })}
            placeholder="Ton prénom..."
            style={S.input}
          />
          <div style={{position:'relative', borderRadius:16, overflow:'hidden'}}>
            <AnimatePresence>
              {rippleKey > 0 && (
                <motion.div
                  key={rippleKey}
                  initial={{ opacity:0.6, scale:0.85 }}
                  animate={{ opacity:0, scale:1.5 }}
                  exit={{ opacity:0 }}
                  transition={{ duration:0.65, ease:'easeOut' }}
                  style={{
                    position:'absolute', inset:0, borderRadius:16,
                    background:'rgba(255,245,238,0.28)', pointerEvents:'none', zIndex:2,
                  }}
                />
              )}
            </AnimatePresence>
            <motion.button
              onClick={() => {
                if (nomVal.trim()) {
                  setRippleKey(k => k + 1)
                  goNext({ nom: nomVal.trim() })
                }
              }}
              disabled={!nomVal.trim()}
              animate={nomVal.trim() ? { scale:[1, 1.016, 1] } : { scale:1 }}
              transition={nomVal.trim() ? { duration:2.5, ease:'easeInOut', repeat:Infinity } : {}}
              whileTap={nomVal.trim() ? { scale:0.97 } : {}}
              style={{ ...S.cta, opacity: nomVal.trim() ? 1 : 0.40, animation: nomVal.trim() ? 'gradientShift 3s ease infinite, heartbeat 2.5s ease-in-out infinite' : 'none' }}
            >
              <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                Continuer
                <ChevronIcon color="#FFF5EE" size={16} direction="right" />
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    )

    // ── Étape 1 : Objectif ────────────────────────────────────────────────────
    if (step === 1) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <AnimatedQuestion
          text={`C'est quoi ton envie du moment${nom ? `, ${nom}` : ''} ?`}
          style={S.question}
        />
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {OBJECTIF_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, objectif: opt.label }))}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.10)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 24px rgba(200,123,82,0.20)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:14,
                  fontFamily:"'DM Sans', sans-serif", textAlign:'left',
                  outline:'none',
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color='#C87B52' size={20}/>
                </div>
                <div style={{ flex:1 }}>
                  <span style={{
                    fontSize:15, fontWeight: isSel ? 600 : 400, display:'block',
                    color: isSel ? '#C87B52' : 'rgba(184,105,58,0.88)',
                    transition:'color 0.16s',
                  }}>{opt.label}</span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 2 : Âge ─────────────────────────────────────────────────────────
    if (step === 2) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text={`Tu as quel âge${nom ? `, ${nom}` : ''} ?`} style={S.question} />
          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.30 }}
            style={S.sub}
          >
            Chaque étape de vie a ses forces et ses défis.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {AGE_RANGE_OPTIONS.map(({ range, Icon: AgeIcon }, i) => {
            const isSel = tapped === range
            return (
              <motion.button
                key={range}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(range, () => goNext({ ...answers, age: range }))}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 22px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left',
                  fontFamily:"'DM Sans', sans-serif",
                  outline:'none',
                  display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <AgeIcon color={isSel ? '#B8683A' : '#C87B52'} size={20}/>
                </div>
                <span style={{
                  fontSize:15, fontWeight: isSel ? 600 : 400,
                  color: isSel ? '#C87B52' : 'rgba(184,105,58,0.88)',
                  transition:'color 0.16s, font-weight 0.1s',
                }}>
                  {range}
                </span>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 3 : Activité ────────────────────────────────────────────────────
    if (step === 3) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text={`Tu en es où avec le sport${nom ? `, ${nom}` : ''} ?`} style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Pas de jugement, c'est juste pour mieux t'accompagner.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {ACTIVITE_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, activite: opt.label }))}
                whileTap={{ scale:0.97, x:2 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 22px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left',
                  fontFamily:"'DM Sans', sans-serif",
                  outline:'none',
                  display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#B8683A' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{
                    fontSize:15, fontWeight: isSel ? 600 : 400,
                    color: isSel ? '#C87B52' : 'rgba(184,105,58,0.88)',
                    transition:'color 0.16s',
                  }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>
                    {opt.desc}
                  </span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 4 : Déclencheur émotionnel ──────────────────────────────────────
    if (step === 4) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text={`Et là, qu'est-ce qui t'a poussé à te lancer${nom ? `, ${nom}` : ''} ?`} style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Il n'y a pas de mauvaise réponse.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {TRIGGER_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, declencheur: opt.label }))}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#B8683A' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:15, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 5 : Baseline bien-être ──────────────────────────────────────────
    if (step === 5) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text={`Honnêtement${nom ? `, ${nom}` : ''}, comment tu vas ?`} style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Solenn s'adapte à où tu en es, sans jugement.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {BASELINE_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, baseline: opt.label }))}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#B8683A' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:15, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 6 : Moment préféré ───────────────────────────────────────────────
    if (step === 6) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text="Quel moment de la journée t'appartient vraiment ?" style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            On s'adapte à ton rythme, pas l'inverse.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {MOMENT_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, moment: opt.label }))}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color={isSel ? '#B8683A' : '#C87B52'} size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:15, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 7 : Contexte de vie ─────────────────────────────────────────────
    if (step === 7) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text={`Tu vis comment au quotidien${nom ? `, ${nom}` : ''} ?`} style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Solenn s'adapte à ton environnement de vie.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {VIE_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, vie: opt.label }))}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color='#C87B52' size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:15, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 8 : Rythme de travail ───────────────────────────────────────────
    if (step === 8) return (
      <div style={{display:'flex', flexDirection:'column', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <AnimatedQuestion text={`Ton quotidien ressemble à quoi${nom ? `, ${nom}` : ''} ?`} style={S.question} />
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
            Ça change ce que Solenn te propose au quotidien.
          </motion.p>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {RYTHME_OPTIONS.map((opt, i) => {
            const isSel = tapped === opt.label
            const OptIcon = opt.Icon
            return (
              <motion.button
                key={opt.label}
                initial={{ opacity:0, x:40, scale:0.93 }}
                animate={{ opacity:1, x:0, scale:1 }}
                transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.06 }}
                onClick={() => tapThen(opt.label, () => goNext({ ...answers, rythme: opt.label }))}
                whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px 18px', borderRadius:16,
                  border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                  background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                  boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                  transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                  cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                  outline:'none', display:'flex', alignItems:'center', gap:14,
                }}
              >
                <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                  <OptIcon color='#C87B52' size={20}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <span style={{ fontSize:15, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                </div>
                <div style={{marginLeft:'auto',width:10,height:10,borderRadius:'50%',background:'#C87B52',flexShrink:0,opacity:isSel?1:0,transform:isSel?'scale(1)':'scale(0.2)',transition:'opacity 0.15s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'}} />
              </motion.button>
            )
          })}
        </div>
      </div>
    )

    // ── Étape 9 : Santé (multi-select) ───────────────────────────────────────
    if (step === 9) {
      const toggleSante = (label) => {
        if (label === 'Aucune condition particulière') {
          setSanteSelections(['Aucune condition particulière'])
          return
        }
        setSanteSelections(prev => {
          const without = prev.filter(s => s !== 'Aucune condition particulière')
          return without.includes(label) ? without.filter(s => s !== label) : [...without, label]
        })
      }
      const canContinue = santeSelections.length > 0
      return (
        <div style={{display:'flex', flexDirection:'column', gap:28}}>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            <AnimatedQuestion text={`Y a-t-il des choses que Solenn devrait savoir${nom ? `, ${nom}` : ''} ?`} style={S.question} />
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.30 }} style={S.sub}>
              Ces infos restent privées et aident Solenn à mieux t'accompagner.
            </motion.p>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {SANTE_OPTIONS.map((opt, i) => {
              const isSel = santeSelections.includes(opt.label)
              const OptIcon = opt.Icon
              return (
                <motion.button
                  key={opt.label}
                  initial={{ opacity:0, x:40, scale:0.93 }}
                  animate={{ opacity:1, x:0, scale:1 }}
                  transition={{ type:'spring', stiffness:320, damping:24, delay: i * 0.05 }}
                  onClick={() => toggleSante(opt.label)}
                  whileTap={{ scale:0.97 }}
                  style={{
                    width:'100%', padding:'12px 18px', borderRadius:16,
                    border:`1.5px solid ${isSel ? 'rgba(200,123,82,0.55)' : 'rgba(255,255,255,0.45)'}`,
                    background: isSel ? 'rgba(200,123,82,0.12)' : 'rgba(255,248,244,0.72)',
                    boxShadow: isSel ? '0 6px 20px rgba(200,123,82,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 20px rgba(80,25,0,0.12), 0 1px 4px rgba(80,25,0,0.07)',
                    transition:'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                    cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans', sans-serif",
                    outline:'none', display:'flex', alignItems:'center', gap:14,
                  }}
                >
                  <div style={{width:40,height:40,borderRadius:'50%',background:isSel?'rgba(200,123,82,0.18)':'#F2DBC9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.18s'}}>
                    <OptIcon color={isSel ? '#B8683A' : '#C87B52'} size={20}/>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:1, flex:1 }}>
                    <span style={{ fontSize:15, fontWeight: isSel ? 600 : 400, color: isSel ? 'rgba(180,90,40,0.95)' : 'rgba(184,105,58,0.88)', transition:'color 0.16s' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize:13, color:'rgba(184,105,58,0.62)', fontWeight:400 }}>{opt.desc}</span>
                  </div>
                  <div style={{width:18,height:18,borderRadius:'50%',border:`1.5px solid ${isSel ? '#C87B52' : 'rgba(200,123,82,0.30)'}`,background:isSel?'#C87B52':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
                    {isSel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><polyline points="1,4 3.5,6.5 9,1" stroke="#FFF5EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </motion.button>
              )
            })}
          </div>
          <motion.button
            onClick={() => {
              if (canContinue) {
                const finalAnswers = { ...answers, sante_conditions: santeSelections }
                finishOnboarding(finalAnswers)
              }
            }}
            disabled={!canContinue}
            style={{ ...S.cta, opacity: canContinue ? 1 : 0.40 }}
          >
            <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              Continuer
              <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'rgba(255,245,238,0.18)',borderRadius:8,width:28,height:28,flexShrink:0}}>
                <ChevronIcon color="#FFF5EE" size={14} direction="right" />
              </span>
            </span>
          </motion.button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="ob-outer" style={{
      minHeight:'100vh',
      background:'linear-gradient(160deg,#FFF8F4 0%,#FFF0E6 60%,#FDECD8 100%)',
      fontFamily:"'DM Sans', sans-serif",
      display:'flex', flexDirection:'column',
      position:'relative', overflowX:'hidden', overflowY:'auto',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Cormorant+Garamond:ital@1&display=swap');
        @keyframes liquidBlob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,5%) scale(1.06)} 66%{transform:translate(-2%,-3%) scale(0.96)} }
        @keyframes liquidBlob2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-4%,3%) scale(1.08)} 70%{transform:translate(2%,-5%) scale(0.94)} }
        @keyframes liquidBlob3 { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(2%,-4%) scale(1.05)} 65%{transform:translate(-3%,2%) scale(0.97)} }
        @keyframes liquidBlob4 { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(-3%,4%) scale(1.07)} 75%{transform:translate(4%,-2%) scale(0.95)} }
        @keyframes revealPulse { 0%,100%{box-shadow:0 0 0 8px rgba(200,123,82,0.08),0 0 0 16px rgba(200,123,82,0.04)} 50%{box-shadow:0 0 0 12px rgba(200,123,82,0.13),0 0 0 22px rgba(200,123,82,0.06)} }
        input:focus { outline:none; border-color:rgba(200,123,82,0.55) !important; box-shadow:0 0 0 3px rgba(200,123,82,0.10) !important; }
        input::placeholder { color:rgba(200,123,82,0.40); }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(255,248,244,0.92) inset !important;
          -webkit-text-fill-color: rgba(200,123,82,0.92) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        @keyframes ctaPulse { 0%,100%{box-shadow:0 8px 24px rgba(200,123,82,0.40)} 50%{box-shadow:0 8px 36px rgba(200,123,82,0.68)} }
        @keyframes heartbeat { 0%,100%{box-shadow:0 8px 24px rgba(184,104,58,0.38)} 50%{box-shadow:0 12px 36px rgba(184,104,58,0.62)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        button:focus-visible { outline:2px solid rgba(200,123,82,0.60); outline-offset:2px; }
        @media (min-width:600px) {
          body { background:#F5EDE4; }
          .ob-outer { max-width:480px; margin:0 auto; min-height:100vh; box-shadow:0 0 80px rgba(180,80,20,0.14); }
          .ob-header { left:50% !important; right:auto !important; transform:translateX(-50%); width:480px; }
        }
      `}</style>

      <BgBlobs step={step} />
      <div style={{position:'absolute',inset:0,background:'rgba(255,245,235,0.22)',pointerEvents:'none',zIndex:1}}/>

      {/* Header */}
      <div className="ob-header" style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        background:'rgba(255,248,244,0.60)',
        borderBottom:'1px solid rgba(255,255,255,0.42)',
        boxShadow:'0 2px 24px rgba(180,80,20,0.07)',
        paddingTop:'calc(env(safe-area-inset-top,0px) + 20px)',
        paddingBottom:16,
        display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:'100%', maxWidth:480, padding:'0 20px', boxSizing:'border-box' }}>
          {step > 0 && (
            <motion.button
              onClick={goBack}
              initial={{ opacity:0, x:-6 }}
              animate={{ opacity:1, x:0 }}
              whileTap={{ scale:0.92 }}
              style={{
                position:'absolute', left:20,
                width:36, height:36, borderRadius:'50%',
                background:'rgba(200,123,82,0.08)',
                border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              <BackIcon color="rgba(200,123,82,0.78)" size={18}/>
            </motion.button>
          )}
          <motion.span
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.1, duration:0.22, ease:'easeOut' }}
            style={{
              fontSize:24, fontWeight:400, letterSpacing:'-0.03em',
              fontFamily:"'Cormorant Garamond', Georgia, serif", fontStyle:'italic',
              color:'rgba(184,105,58,0.88)',
              textShadow:'0 1px 10px rgba(255,248,244,0.70)',
            }}
          >
            Solenn
          </motion.span>
        </div>

        {/* Progress segments */}
        <div style={{display:'flex', gap:4, alignItems:'center'}}>
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <div
              key={i}
              style={{
                width:30, height:2, borderRadius:1,
                background: i < step ? '#C87B52' : 'rgba(200,123,82,0.28)',
                transition:'background 0.22s ease-out',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-start',
        padding:'0 28px 48px',
        paddingTop:'calc(env(safe-area-inset-top,0px) + 110px)',
        maxWidth:480, width:'100%', margin:'0 auto', boxSizing:'border-box',
        position:'relative', zIndex:2, overflowX:'hidden',
      }}>
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={step}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration:0.18, ease:'easeIn' }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
