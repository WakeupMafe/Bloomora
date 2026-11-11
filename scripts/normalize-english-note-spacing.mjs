import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { DOMParser } from 'linkedom'

globalThis.DOMParser = DOMParser
const { normalizeSpacing } = await import('../src/features/notes/noteSpacingModel.mjs')

const apply = process.argv.includes('--apply')
const cedulaIndex = process.argv.indexOf('--user-cedula')
const userCedula = cedulaIndex >= 0 ? process.argv[cedulaIndex + 1]?.trim() : ''

if (!userCedula) {
  console.error('Uso: node scripts/normalize-english-note-spacing.mjs --user-cedula <cedula> [--apply]')
  console.error('Sin --apply solo muestra el plan y el antes/después de una nota de ejemplo.')
  process.exit(2)
}

function readEnv(text) {
  return Object.fromEntries(text.split(/\r?\n/).flatMap((line) => {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (!match) return []
    return [[match[1], match[2].replace(/^(['"])(.*)\1$/, '$2')]]
  }))
}

const env = readEnv(await readFile(new URL('../.env.local', import.meta.url), 'utf8'))
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const rows = []
for (let start = 0; ; start += 500) {
  const { data, error } = await supabase
    .from('english_notes')
    .select('id,title,content_html')
    .eq('user_cedula', userCedula)
    .order('id')
    .range(start, start + 499)
  if (error) throw new Error(`No se pudieron leer los apuntes: ${error.message}`)
  rows.push(...(data ?? []))
  if (!data || data.length < 500) break
}

const updates = rows
  .map((row) => ({ ...row, normalized: normalizeSpacing(row.content_html ?? '') }))
  .filter((row) => row.normalized !== (row.content_html ?? ''))
const sample = rows.find((row) => /clase\s*68.*report\s*speech/i.test(row.title)) ?? rows[0]
if (sample) {
  console.log(`Ejemplo: ${sample.title}`)
  console.log(`ANTES: ${sample.content_html ?? ''}`)
  console.log(`DESPUÉS: ${normalizeSpacing(sample.content_html ?? '')}`)
} else {
  console.log('No hay apuntes para esa cédula.')
}
console.log(`Proyecto: ${new URL(url).hostname}`)
console.log(`Apuntes encontrados: ${rows.length}; requieren normalización: ${updates.length}`)
if (!apply) {
  console.log('Modo de vista previa. Añade --apply para guardar los cambios.')
  process.exit(0)
}

for (const row of updates) {
  const { error } = await supabase
    .from('english_notes')
    .update({ content_html: row.normalized })
    .eq('id', row.id)
    .eq('user_cedula', userCedula)
  if (error) throw new Error(`Falló el apunte ${row.id}: ${error.message}`)
}

console.log(`Migración terminada: ${updates.length} apuntes actualizados; ejecución idempotente.`)
