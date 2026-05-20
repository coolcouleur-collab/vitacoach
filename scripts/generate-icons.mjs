/**
 * Génère les icônes PWA Solenn (192, 512, 180, 32px) en PNG pur Node.js
 * Sans dépendances externes — utilise uniquement zlib natif
 * Usage : node scripts/generate-icons.mjs
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

// ─── CRC32 ─────────────────────────────────────────────────────────────────
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[n] = c
}
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

// ─── PNG chunk ──────────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const lenBuf = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(d.length, 0)
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])), 0)
  return Buffer.concat([lenBuf, t, d, crcBuf])
}

// ─── PNG encoder ────────────────────────────────────────────────────────────
function encodePNG(w, h, getPixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0 // 8-bit RGBA

  const rowBytes = 1 + w * 4
  const raw = Buffer.allocUnsafe(h * rowBytes)
  for (let y = 0; y < h; y++) {
    raw[y * rowBytes] = 0 // filter: None
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = getPixel(x, y)
      const i = y * rowBytes + 1 + x * 4
      raw[i] = r; raw[i+1] = g; raw[i+2] = b; raw[i+3] = a
    }
  }
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(raw, { level: 6 })), pngChunk('IEND', Buffer.alloc(0))])
}

// ─── Pixel art "S" (6×7 grid) ───────────────────────────────────────────────
const S_GRID = [
  [0,1,1,1,1,0],
  [1,1,0,0,0,0],
  [1,1,0,0,0,0],
  [0,1,1,1,1,0],
  [0,0,0,0,1,1],
  [0,0,0,0,1,1],
  [0,1,1,1,1,0],
]

// ─── Solenn icon pixel function ──────────────────────────────────────────────
function makeIconPixel(size) {
  const cx = size / 2, cy = size / 2
  const circleR = size * 0.43
  const cellW = Math.floor(size * 0.068)
  const cellH = Math.floor(size * 0.068)
  const lx = Math.floor((size - cellW * 6) / 2)
  const ly = Math.floor((size - cellH * 7) / 2)

  return function(x, y) {
    const dx = x - cx, dy = y - cy
    const dist = Math.sqrt(dx*dx + dy*dy)

    // "S" letter — white, inside circle
    if (dist < circleR * 0.88 && x >= lx && x < lx + cellW * 6 && y >= ly && y < ly + cellH * 7) {
      const col = Math.floor((x - lx) / cellW)
      const row = Math.floor((y - ly) / cellH)
      if (row >= 0 && row < 7 && col >= 0 && col < 6 && S_GRID[row][col]) {
        return [255, 255, 255, 255]
      }
    }

    // Outside circle → cream #FFF8F4
    if (dist > circleR + 1.5) return [255, 248, 244, 255]

    // Orange gradient circle
    const t = Math.min(1, dist / circleR)
    // Top-left highlight
    const hlDx = x/size - 0.36, hlDy = y/size - 0.30
    const hl = Math.max(0, 1 - Math.sqrt(hlDx*hlDx + hlDy*hlDy) / 0.28) * 0.38

    const R = Math.min(255, Math.round(200 + (1-t)*40 + hl*55))
    const G = Math.min(255, Math.round(123 + (1-t)*37 + hl*77))
    const B = Math.min(255, Math.round(82  + (1-t)*18 + hl*30))

    // Soft anti-alias at edge
    const alpha = dist > circleR ? Math.max(0, Math.round(255 * (1 - (dist - circleR) / 1.5))) : 255
    return [R, G, B, alpha]
  }
}

// ─── Generate all icons ──────────────────────────────────────────────────────
if (!existsSync('public')) mkdirSync('public', { recursive: true })

const icons = [
  { size: 192, file: 'public/icon-192.png' },
  { size: 512, file: 'public/icon-512.png' },
  { size: 180, file: 'public/apple-touch-icon.png' },
  { size: 32,  file: 'public/favicon-32.png' },
]

for (const { size, file } of icons) {
  const png = encodePNG(size, size, makeIconPixel(size))
  writeFileSync(file, png)
  console.log(`✅ ${file} (${size}×${size}, ${png.length} bytes)`)
}
console.log('✅ Icônes Solenn générées !')
