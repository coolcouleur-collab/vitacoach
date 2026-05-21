import sharp from 'sharp'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svgPath = join(root, 'public', 'icon-master.svg')
const svgBuffer = readFileSync(svgPath)

const outDir = join(root, 'public', 'icons')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

const sizes = [
  // iOS
  { size: 1024, name: 'ios-1024.png',           label: 'App Store' },
  { size: 180,  name: 'apple-touch-icon.png',   label: 'iPhone @3x' },
  { size: 167,  name: 'ios-167.png',            label: 'iPad Pro' },
  { size: 152,  name: 'ios-152.png',            label: 'iPad @2x' },
  { size: 120,  name: 'ios-120.png',            label: 'iPhone @2x' },
  { size: 87,   name: 'ios-87.png',             label: 'Settings @3x' },
  { size: 80,   name: 'ios-80.png',             label: 'Spotlight' },
  { size: 76,   name: 'ios-76.png',             label: 'iPad' },
  { size: 60,   name: 'ios-60.png',             label: 'iPhone' },
  { size: 58,   name: 'ios-58.png',             label: 'Settings @2x' },
  { size: 40,   name: 'ios-40.png',             label: 'Spotlight @2x' },
  { size: 29,   name: 'ios-29.png',             label: 'Settings' },
  { size: 20,   name: 'ios-20.png',             label: 'Notification' },
  // Android
  { size: 512,  name: 'android-playstore.png',  label: 'Play Store' },
  { size: 192,  name: 'android-xxxhdpi.png',    label: 'xxxhdpi' },
  { size: 144,  name: 'android-xxhdpi.png',     label: 'xxhdpi' },
  { size: 96,   name: 'android-xhdpi.png',      label: 'xhdpi' },
  { size: 72,   name: 'android-hdpi.png',       label: 'hdpi' },
  { size: 48,   name: 'android-mdpi.png',       label: 'mdpi' },
  // PWA / Favicon
  { size: 512,  name: 'icon-512.png',           label: 'PWA 512' },
  { size: 192,  name: 'icon-192.png',           label: 'PWA 192' },
  { size: 32,   name: 'favicon-32.png',         label: 'Favicon 32' },
]

console.log(`\n🎨 Solenn — génération de ${sizes.length} icônes PNG depuis SVG\n`)

for (const { size, name, label } of sizes) {
  const dest = size <= 32
    ? join(root, 'public', name)        // favicons directement dans public/
    : size === 192 || size === 512
      ? join(root, 'public', name)      // PWA icons dans public/
      : join(outDir, name)              // iOS + Android dans public/icons/

  await sharp(svgBuffer, { density: 300 })
    .resize(size, size)
    .png({ quality: 100 })
    .toFile(dest)

  console.log(`  ✅ ${name.padEnd(28)} ${size}×${size}  (${label})`)
}

console.log(`\n✨ Icônes générées dans :\n  📁 public/icons/   (iOS + Android)\n  📁 public/         (PWA + favicon)\n`)
