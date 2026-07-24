/**
 * GlowLoader.jsx — halo de soleil qui respire
 * Remplace les dots animés (2026-07-24, retour Jean : animation buggée).
 * Une seule forme, animation CSS pure (pas de framer-motion, pas de calcul
 * de box-shadow par frame) : calme, fluide, et dans l'univers Solenn (soleil).
 *
 * Props (compatibles avec l'ancien composant — les props dots sont ignorées) :
 *   size     {number}  Diamètre du soleil en px (défaut 34)
 *   color    {string}  Couleur principale (défaut copper #C87B52)
 *   fullPage {boolean} Overlay plein écran centré
 */

export default function GlowLoader({
  size = 34,
  color = '#C87B52',
  fullPage = false,
}) {
  const halo = size * 2.4
  return (
    <div style={{
      ...(fullPage ? { position: 'fixed', inset: 0, zIndex: 99 } : {}),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: fullPage ? undefined : size * 3,
    }}>
      <style>{`
        @keyframes solennBreath {
          0%, 100% { transform: scale(0.92); opacity: 0.55; }
          50%       { transform: scale(1.08); opacity: 1; }
        }
        @keyframes solennHalo {
          0%, 100% { transform: scale(0.85); opacity: 0.30; }
          50%       { transform: scale(1.15); opacity: 0.60; }
        }
        @media (prefers-reduced-motion: reduce) {
          .solenn-loader-core, .solenn-loader-halo { animation: none !important; }
        }
      `}</style>
      <div style={{ position: 'relative', width: halo, height: halo, display: 'grid', placeItems: 'center' }}>
        {/* Halo extérieur */}
        <div className="solenn-loader-halo" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}44 0%, ${color}1a 45%, transparent 70%)`,
          animation: 'solennHalo 2.4s ease-in-out infinite',
        }} />
        {/* Cœur du soleil */}
        <div className="solenn-loader-core" style={{
          width: size, height: size, borderRadius: '50%',
          background: `radial-gradient(circle at 38% 34%, #F5DDB0 0%, #E8962A 55%, ${color} 100%)`,
          boxShadow: `0 0 ${size * 0.7}px ${color}55`,
          animation: 'solennBreath 2.4s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}
