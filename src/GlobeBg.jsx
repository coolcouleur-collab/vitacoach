import { useEffect, useRef } from 'react'

// Carte terrestre de cobe (256×128, bright = terre)
const LAND_B64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACAAQAAAADMzoqn' +
  'AAAECklEQVR42u3VsW4jRRzH8d94gzfF4Q0VQaC4vBLTRTp0mze4ggfAPAE5XQEF' +
  'sGNAVIjwBrmW7h7gJE+giKjyABTZE4g06LKJETdRJvtD65kdz6yduKABiW+TVfzR' +
  'f2bXYxtcE/59YJCz6YdbgQF6ACSRrwYKYImmh5PbwOewlV3wlQNbAN6SEExjUOO+' +
  'BU0aCSnxReHABUlK4YFQeJeUT3da8IIkZ6NGoSnFY5KsMoVzMKfECUnqxgPYRArar' +
  'mUCndHwzIEaQEpg5xVdBXROl8mpAQx5dUgPiHoYAAkg5w3JABR06byGAVgcRGAz5b' +
  'znj6phBQNRFwyqgdxebH6gshJAesWoFhgYpApAFoG8BIZ/fEhSox5jDjQXmV0Ar5X' +
  'JfAIrALi3URVs09gHIL4XJCkLC5LH9JWiArABFCSrQjdgkBzRJ0WJeUOSNyQAfJJ' +
  'wUSWUBRlJQ8oGHATACGlBynnzy2kEYLNjrxouigD8BZcgOeVPqh12RtufaCN5wCPV' +
  'DpvQ9lsIrqndsJtDcWqBCpf4hWN7OdWHBw58FwIaNOU/n1TpMW2DFaD48cmr4185' +
  'T8NHkpUFX749pQPVdgRKC/DGoQPVeAEKv+WHvY8OOWNTPRp5kHuwSf8wzXtVBKR7' +
  'YwEH9H3lQUaypUfSATOALyVNu5vZJW31Bnx98nkLfDUWJaz6ixvm+RIQRdl3kmRx' +
  'xiaDoGnZW4CpPfkaQadlcPim1xOSvETQo7Lv75enVAXJ3xGUlony4KQBBWUM1NiDc' +
  '6qhyS8RgQs18OCMMtPDaAUIyg0PZkRWDqs+wnKJBTDI1Js6BolegOsKmUxNDBAAKq' +
  'QyMQmidhegBlLZ+wwKYdv5M/8x1khkb1cgKqP2H+MKyV5vS+whrE8DQDgAlUAoRBX' +
  '056EElJCjJVACeJBZgNfVp+iCCm4RBWCgKsRxASSA9KgDhDtCiTuMyfHsKXzhC6w' +
  'NAIjjWb8LKAOA2ctk3FmCOlgKFy8f1N0JJtgsxinYnVAHt4t3gPzZXSCTyCWCQmBT' +
  '91QE3B5yarSN40dNHYPka4TlDhTUI8zLvl0JSL3vZn6DsCFZOeB2yROEpR68sECQQ' +
  'A++xIGCR2X7DwlEoLRgUrZrqlUg50S1uy43YqDcN6UFBVkhAjWiCV2Q0jgQPdplMK' +
  'xvBXodcOfAwJYvgdL+1etA1YJJfBcZlQV7sO1i2gHoNiyxtQ5sBsCgWyoxCHiFFd2' +
  'L5nUTCqMAqGUgsQ9f5kCcCiZgRYkMgMTd5WsB1rTzj0Em14BE4r+QxN1lCEsVur2P' +
  'oF5Wbg8RJXR4djgvBgauhLywoEZQrt1KKRdVS4CdlJ8qafyP+9KIj/nE/d7kKwH9' +
  'jgS72e9DV+kvfTWgct4ZyP8Byb8BPG7MaaIIkAQAAAAASUVORK5CYII='

// ─── helpers ─────────────────────────────────────────────────────────────────
function loadLandMap() {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      c.getContext('2d').drawImage(img, 0, 0)
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height)
      resolve({ data: d.data, w: c.width, h: c.height })
    }
    img.src = LAND_B64
  })
}

function isLand(map, lat, lon) {
  const x = Math.floor(((lon + 180) / 360) * map.w) % map.w
  const y = Math.max(0, Math.min(map.h - 1, Math.floor(((90 - lat) / 180) * map.h)))
  return map.data[(y * map.w + x) * 4] > 128
}

// ─── composant ───────────────────────────────────────────────────────────────
export default function GlobeBg({ style, size = 0.80, opacity = 0.42, variant = 'orange', halo = true, fixed = true }) {
  const mountRef = useRef(null)
  const isVisibleRef = useRef(false)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    observer.observe(el.parentElement || el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    let cancelled = false
    const vmin = Math.min(window.innerWidth, window.innerHeight)
    const SIZE = Math.round(vmin * size)

    import('three').then(THREE => {
    if (cancelled) return

    // ── Three.js setup ────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(SIZE, SIZE)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.margin  = '0 auto'
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 2.6

    const GLOBE_R = 1.0
    const DOT_R   = 0.009          // rayon de chaque dot 3D
    const STEP    = DOT_R * 2.55   // espacement angulaire approx

    // ── build dots asynchronously ──────────────────────────────────────
    loadLandMap().then(map => {
      const dotGeo = new THREE.CircleGeometry(DOT_R, 6)  // hexagone approx
      const isGold = variant === 'gold'
      const dotMat = new THREE.MeshBasicMaterial({
        color: isGold ? 0xD4924A : 0xFF8030,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      })

      // Génère les positions de dots (ocean seulement)
      const dummy   = new THREE.Object3D()
      const positions = []

      // grille sphérique uniforme par latitude/longitude
      const latStep = 3.5    // degrés
      const lonBase = 3.5

      for (let lat = -90 + latStep / 2; lat < 90; lat += latStep) {
        const cosLat  = Math.cos(lat * Math.PI / 180)
        const lonStep = lonBase / Math.max(0.1, cosLat)
        for (let lon = -180; lon < 180; lon += lonStep) {
          if (isLand(map, lat, lon)) continue   // continents = trous
          positions.push({ lat, lon })
        }
      }

      const mesh = new THREE.InstancedMesh(dotGeo, dotMat, positions.length)

      positions.forEach(({ lat, lon }, i) => {
        const phi   = (90 - lat) * Math.PI / 180
        const theta = (lon + 180) * Math.PI / 180

        // Position sur la sphère
        const x = GLOBE_R * Math.sin(phi) * Math.cos(theta)
        const y = GLOBE_R * Math.cos(phi)
        const z = GLOBE_R * Math.sin(phi) * Math.sin(theta)

        dummy.position.set(x, y, z)

        // Orienter le dot vers l'extérieur (normal à la surface)
        dummy.lookAt(x * 2, y * 2, z * 2)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)

        // Shading : couleur plus sombre sur les bords (dot loin de la caméra = alpha plus faible)
        // Utilise z normalisé (profondeur) pour une luminosité plus douce
        const brightness = 0.70 + Math.max(0, z / GLOBE_R) * 0.30
        mesh.setColorAt(i, new THREE.Color(
          (isGold ? 0.83 : 1.00) * brightness,
          (isGold ? 0.57 : 0.50) * brightness,
          (isGold ? 0.29 : 0.08) * brightness
        ))
      })

      mesh.instanceColor.needsUpdate = true
      mesh.instanceMatrix.needsUpdate = true
      scene.add(mesh)

      // ── animation ────────────────────────────────────────────────────
      let raf
      function animate() {
        raf = requestAnimationFrame(animate)
        if (!isVisibleRef.current) return
        mesh.rotation.y += 0.0022
        renderer.render(scene, camera)
      }
      animate()

      // cleanup
      el._cleanup = () => {
        cancelAnimationFrame(raf)
        renderer.dispose()
        dotGeo.dispose()
        dotMat.dispose()
        mesh.dispose()
      }
    })

    }) // end import('three')

    return () => {
      cancelled = true
      el._cleanup?.()
    }
  }, [])

  return (
    <div style={{
      position: fixed ? 'fixed' : 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width:  `${size * 100}vmin`,
      height: `${size * 100}vmin`,
      zIndex: 0, pointerEvents: 'none',
      animation: 'globeFadeIn 1.8s ease both',
      ...style,
    }}>
      <style>{`
        @keyframes globeFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Halo solaire derrière le globe */}
      {halo && <div style={{
        position: 'absolute',
        inset: '-18%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220,155,60,0.22) 0%, rgba(210,130,40,0.10) 40%, transparent 70%)',
        pointerEvents: 'none',
      }} />}

      {/* Globe canvas */}
      <div
        ref={mountRef}
        style={{
          width: '100%', height: '100%',
          opacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </div>
  )
}
