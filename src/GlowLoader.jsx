/**
 * GlowLoader.jsx, halo de soleil qui respire
 * Remplace les dots animés (2026-07-24, retour Jean : animation buggée).
 * Une seule forme, animation CSS pure (pas de framer-motion, pas de calcul
 * de box-shadow par frame) : calme, fluide, et dans l'univers Solenn (soleil).
 *
 * Props (compatibles avec l'ancien composant, les props dots sont ignorées) :
 *   size     {number}  Diamètre du soleil en px (défaut 34)
 *   color    {string}  Couleur PLEINE de la bille (defaut var(--accent))
 *   trame    {string}  La meme en triplet RGB, pour les halos. Une opacite ne
 *                      se concatene pas a un jeton : `var(--accent)44` n'est
 *                      pas une couleur et le halo ne s'affichait pas du tout.
 *   fullPage {boolean} Overlay plein écran centré
 */

export default function GlowLoader({
  size = 34,
  color = 'var(--accent)',
  trame = 'var(--rgb-terracotta)',
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
          background: `radial-gradient(circle, rgba(${trame}, 0.267) 0%, rgba(${trame}, 0.102) 45%, transparent 70%)`,
          animation: 'solennHalo 2.4s ease-in-out infinite',
        }} />
        {/* Cœur du soleil */}
        <div className="solenn-loader-core" style={{
          width: size, height: size, borderRadius: '50%',
          background: `radial-gradient(circle at 38% 34%, var(--creme-milieu) 0%, var(--or-plein) 55%, ${color} 100%)`,
          boxShadow: `0 0 ${size * 0.7}px rgba(${trame}, 0.333)`,
          animation: 'solennBreath 2.4s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}
