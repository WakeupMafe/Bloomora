/**
 * Genera AVIF + WebP a 1x/2x del tamaño de display de cada pose Bloomy,
 * y un WebP animado de bloomy_salta.gif a 400px de ancho.
 */
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bloomyDir = resolve(root, 'src/assets/bloomy')
const mascotaDir = resolve(root, 'public/mascota')

/** Tamaño CSS máximo real en la app → 1x / 2x */
const POSES = [
  { id: 'bunny_hero_tulip', source: 'bunny_hero_tulip.png', displayPx: 232 },
  { id: 'bunny_wave', source: 'bunny_wave.png', displayPx: 220 },
  { id: 'bunny_think', source: 'bunny_think.png', displayPx: 168 },
  { id: 'bunny_phone', source: 'bunny_phone.png', displayPx: 160 },
  { id: 'bunny_cover_eyes', source: 'bunny_cover_eyes.png', displayPx: 184 },
  { id: 'bunny_peek', source: 'bunny_peek.png', displayPx: 184 },
  { id: 'bunny_celebrate', source: 'bunny_celebrate.png', displayPx: 240 },
  { id: 'bunny_sad', source: 'bunny_sad.png', displayPx: 136 },
  { id: 'bunny_sleep', source: 'bunny_sleep.png', displayPx: 200 },
  { id: 'bunny_hands_up', source: 'bunny_hands_up.png', displayPx: 140 },
]

const WEBP_QUALITY = 80
const AVIF_QUALITY = 50

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

async function writeStill(sourcePath, outPath, size, format) {
  let pipeline = sharp(sourcePath).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality: WEBP_QUALITY, alphaQuality: 100 })
  } else if (format === 'avif') {
    pipeline = pipeline.avif({ quality: AVIF_QUALITY, effort: 4 })
  } else {
    pipeline = pipeline.png({ compressionLevel: 9 })
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
  writeFileSync(outPath, data)
  return { bytes: data.length, width: info.width, height: info.height }
}

async function optimizeStills() {
  const report = []

  for (const pose of POSES) {
    const sourcePath = join(bloomyDir, pose.source)
    const sizes = [
      { label: '1x', px: pose.displayPx },
      { label: '2x', px: pose.displayPx * 2 },
    ]

    for (const { label, px } of sizes) {
      for (const format of ['avif', 'webp']) {
        const outName = `${pose.id}_${label}.${format}`
        const outPath = join(bloomyDir, outName)
        const result = await writeStill(sourcePath, outPath, px, format)
        report.push({
          file: `src/assets/bloomy/${outName}`,
          bytes: result.bytes,
          dims: `${result.width}x${result.height}`,
          display: `${pose.displayPx}px (${label})`,
        })
        console.log(`✓ ${outName} → ${kb(result.bytes)} (${result.width}x${result.height})`)
      }
    }
  }

  return report
}

async function optimizeAnimatedGif() {
  const gifPath = join(mascotaDir, 'bloomy_salta.gif')
  const outPath = join(mascotaDir, 'bloomy_salta.webp')

  // sharp animated → WebP; si falla la animación, se intenta igualmente
  const { data, info } = await sharp(gifPath, { animated: true, pages: -1 })
    .resize({ width: 400, height: 400, fit: 'inside' })
    .webp({ quality: WEBP_QUALITY, loop: 0, force: 4 })
    .toBuffer({ resolveWithObject: true })

  writeFileSync(outPath, data)

  const isAnim =
    data.includes(Buffer.from('ANIM')) || data.includes(Buffer.from('ANMF'))
  console.log(
    `✓ bloomy_salta.webp → ${kb(data.length)} (${info.width}x${info.height}, pages≈${info.pages ?? '?'}, animated=${isAnim})`,
  )

  return {
    file: 'public/mascota/bloomy_salta.webp',
    bytes: data.length,
    dims: `${info.width}x${info.height}`,
    display: '200px (Tabata celebrate)',
    animated: isAnim,
  }
}

function inventoryBefore() {
  const rows = []
  for (const name of readdirSync(bloomyDir)) {
    if (!/\.(png|webp|avif)$/i.test(name)) continue
    if (name.startsWith('logo_')) continue
    const p = join(bloomyDir, name)
    rows.push({ file: `src/assets/bloomy/${name}`, bytes: statSync(p).size })
  }
  for (const name of readdirSync(mascotaDir)) {
    const p = join(mascotaDir, name)
    rows.push({ file: `public/mascota/${name}`, bytes: statSync(p).size })
  }
  return rows
}

mkdirSync(bloomyDir, { recursive: true })
mkdirSync(mascotaDir, { recursive: true })

const before = inventoryBefore()
writeFileSync(
  join(root, 'scripts/.bloomy-optimize-before.json'),
  JSON.stringify(before, null, 2),
)

const stills = await optimizeStills()
const animated = await optimizeAnimatedGif()

writeFileSync(
  join(root, 'scripts/.bloomy-optimize-after.json'),
  JSON.stringify({ stills, animated }, null, 2),
)

console.log('\nDone. Generated', stills.length, 'still variants + animated webp.')
