import { copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logosDir = resolve(root, 'src/assets/logos')
const publicDir = resolve(root, 'public')
const faviconFiles = [
  'favicon.ico',
  'bloomora_favicon_16.png',
  'bloomora_favicon_32.png',
  'bloomora_favicon_48.png',
  'bloomora_favicon_192.png',
  'bloomora_favicon_512.png',
]

for (const file of faviconFiles) {
  copyFileSync(resolve(logosDir, file), resolve(publicDir, file))
}
