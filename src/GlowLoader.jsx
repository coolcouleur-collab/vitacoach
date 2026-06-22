/**
 * GlowLoader.jsx
 * Fidèle au composant Framer GlowLoader :
 * dots animés en vague + glow box-shadow, propulsé par framer-motion.
 *
 * Props:
 *   count      {number}  Nombre de dots (défaut 7)
 *   size       {number}  Taille d'un dot en px (défaut 8)
 *   color      {string}  Couleur principale (défaut copper)
 *   glowStyle  {string}  'soft' | 'strong' | 'neon' | 'bloom' (défaut 'soft')
 *   speed      {number}  Multiplicateur de vitesse (défaut 1)
 *   gap        {number}  Espacement entre dots en px (défaut 6)
 */
import { useEffect } from 'react'
import { motion, useAnimationControls } from 'framer-motion'

function buildGlow(color, style) {
  const map = {
    soft:   `0 0 6px 1px ${color}66, 0 0 12px 2px ${color}33`,
    strong: `0 0 8px 2px ${color}99, 0 0 18px 4px ${color}55`,
    neon:   `0 0 6px 1px ${color}cc, 0 0 14px 3px ${color}88, 0 0 28px 6px ${color}44`,
    bloom:  `0 0 10px 3px ${color}bb, 0 0 24px 6px ${color}66, 0 0 40px 10px ${color}22`,
  }
  return map[style] || map.soft
}

function Dot({ delay, size, color, glowStyle, speed }) {
  const ctrl = useAnimationControls()

  useEffect(() => {
    ctrl.start({
      scale:     [1, 1.55, 1],
      opacity:   [0.35, 1, 0.35],
      boxShadow: [
        buildGlow(color, glowStyle).replace(/[^,]+/g, s => s.replace(/[\d.]+(?=px\s+\d)/g, n => String(+n * 0.4))),
        buildGlow(color, glowStyle),
        buildGlow(color, glowStyle).replace(/[^,]+/g, s => s.replace(/[\d.]+(?=px\s+\d)/g, n => String(+n * 0.4))),
      ],
      transition: {
        duration: 1.1 / speed,
        delay,
        repeat:   Infinity,
        ease:     'easeInOut',
      },
    })
  }, [color, glowStyle, speed, delay])

  return (
    <motion.div
      animate={ctrl}
      style={{
        width:        size,
        height:       size,
        borderRadius: '50%',
        background:   color,
        flexShrink:   0,
      }}
    />
  )
}

export default function GlowLoader({
  count     = 7,
  size      = 8,
  color     = '#C87B52',
  glowStyle = 'soft',
  speed     = 1,
  gap       = 6,
  fullPage  = false,
}) {
  return (
    <div style={{
      ...(fullPage ? { position:'fixed', inset:0, zIndex:99 } : {}),
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap }}>
        {Array.from({ length: count }, (_, i) => (
          <Dot
            key={i}
            delay={(i / count) * (1.1 / speed)}
            size={size}
            color={color}
            glowStyle={glowStyle}
            speed={speed}
          />
        ))}
      </div>
    </div>
  )
}
