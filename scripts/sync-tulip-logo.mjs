import { copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'src/assets/TulipanLogo.png')
const dest = resolve(root, 'public/TulipanLogo.png')

copyFileSync(src, dest)
