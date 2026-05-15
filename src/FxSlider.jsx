// FxSlider.jsx
// Slider draggable horizontal, inertie douce, snap optionnel.
// Style aligné sur espaciolanube : radius 4rem, easing cubic-bezier(.55,0,.1,1).
//
// Dépendances :
//   npm i react react-dom framer-motion
//
// Usage minimal :
//   <FxSlider items={["/a.jpg", "/b.jpg", "/c.jpg"]} />
//
// Usage avec contenu custom :
//   <FxSlider
//     items={projects}
//     itemWidth={460}
//     gap={32}
//     height={560}
//     radius={64}
//     snap
//     renderItem={(p) => (
//       <article>
//         <img src={p.cover} alt={p.title} />
//         <h3>{p.title}</h3>
//       </article>
//     )}
//   />

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, useMotionValue, animate } from "framer-motion"

const EASE = [0.55, 0, 0.1, 1]

export default function FxSlider({
  items = [],
  itemWidth = 420,
  gap = 24,
  height = 520,
  radius = 40,
  snap = false,
  showProgress = true,
  renderItem,
  className,
  style,
}) {
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const x = useMotionValue(0)
  const [containerW, setContainerW] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)

  // mesure largeur du conteneur (responsive)
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const trackWidth = items.length * itemWidth + (items.length - 1) * gap
  const minX = Math.min(0, containerW - trackWidth) // valeur négative
  const maxX = 0

  // progress bar
  useEffect(() => {
    const unsub = x.on("change", (v) => {
      if (minX === 0) return setProgress(0)
      const p = (v - maxX) / (minX - maxX)
      setProgress(Math.max(0, Math.min(1, p)))
    })
    return unsub
  }, [x, minX, maxX])

  // snap au plus proche après drag
  const snapToNearest = useCallback(() => {
    if (!snap) return
    const step = itemWidth + gap
    const target = Math.round(x.get() / step) * step
    const clamped = Math.max(minX, Math.min(maxX, target))
    animate(x, clamped, {
      type: "spring",
      stiffness: 220,
      damping: 32,
      mass: 0.9,
    })
  }, [snap, itemWidth, gap, x, minX, maxX])

  // flèches clavier — listener sur le container uniquement (pas window)
  const onKeyDown = useCallback((e) => {
    const step = itemWidth + gap
    if (e.key === "ArrowRight") {
      e.preventDefault()
      animate(x, Math.max(minX, x.get() - step), { duration: 0.6, ease: EASE })
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      animate(x, Math.min(maxX, x.get() + step), { duration: 0.6, ease: EASE })
    }
  }, [x, itemWidth, gap, minX, maxX])

  // scroll wheel → drag horizontal
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(dx) < 2) return
      e.preventDefault()
      const next = Math.max(minX, Math.min(maxX, x.get() - dx))
      animate(x, next, { duration: 0.3, ease: EASE })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [x, minX, maxX])

  return (
    <div
      ref={containerRef}
      className={className}
      onKeyDown={onKeyDown}
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: radius,
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "grab",
        outline: "none",
        ...style,
      }}
      aria-roledescription="carousel"
    >
      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={{ left: minX, right: maxX }}
        dragElastic={0.08}
        dragMomentum
        dragTransition={{ power: 0.28, timeConstant: 280, bounceStiffness: 220, bounceDamping: 32 }}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => {
          setDragging(false)
          snapToNearest()
        }}
        style={{
          x,
          display: "flex",
          gap,
          height: "100%",
          willChange: "transform",
          touchAction: "pan-y",
        }}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            style={{
              flex: `0 0 ${itemWidth}px`,
              height: "100%",
              borderRadius: radius * 0.6,
              overflow: "hidden",
              background: "#f2f2f0",
              userSelect: "none",
            }}
            whileHover={!dragging ? { scale: 1.015 } : {}}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {renderItem ? (
              renderItem(item, i)
            ) : typeof item === "string" ? (
              <img
                src={item}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            ) : (
              item
            )}
          </motion.div>
        ))}
      </motion.div>

      {showProgress && trackWidth > containerW && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            bottom: "1.6rem",
            transform: "translateX(-50%)",
            width: "12rem",
            height: 2,
            background: "rgba(0,0,0,.12)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background: "rgba(0,0,0,.6)",
              transition: dragging
                ? "none"
                : `width .45s cubic-bezier(.55,0,.1,1)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
