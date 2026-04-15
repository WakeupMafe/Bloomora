/**
 * Temas de la app: mismos ids que en Editar perfil + legado `bloomora_pastel` → pink.
 * Los valores se escriben en `document.documentElement` como `--color-bloomora-*`
 * (Tailwind v4 @theme) para que bg-*, text-*, ring-*, etc. reaccionen en runtime.
 */

export const APP_THEME_IDS = [
  'pink',
  'lavender',
  'violet',
  'periwinkle',
  'sky',
  'mint',
] as const

export type AppThemeId = (typeof APP_THEME_IDS)[number]

const KEYS = [
  'snow',
  'mist',
  'lavender-50',
  'lavender-100',
  'lilac',
  'violet',
  'deep',
  'rose',
  'rose-deep',
  'blush',
  'sky',
  'sky-deep',
  'text',
  'text-muted',
  'white',
  'line',
] as const

type BloomoraColorKey = (typeof KEYS)[number]

type Palette = Record<BloomoraColorKey, string>

const CSS_PREFIX = '--color-bloomora-'

export const BLOOMORA_THEME_CSS_VAR_NAMES = KEYS.map(
  (k) => `${CSS_PREFIX}${k}`,
) as readonly string[]

/** Valores por defecto (coinciden con `globals.css` @theme). */
const pink: Palette = {
  snow: '#faf8ff',
  mist: '#f3f0fb',
  'lavender-50': '#ece8f7',
  'lavender-100': '#ddd6f5',
  lilac: '#b8a8e8',
  violet: '#7c6bb5',
  deep: '#5b4a8c',
  rose: '#f4b8d0',
  'rose-deep': '#e89bb8',
  blush: '#fdeef4',
  sky: '#c9e4f5',
  'sky-deep': '#9bcfe9',
  text: '#4a3f6b',
  'text-muted': '#8b7fb0',
  white: '#ffffff',
  line: 'rgba(91, 74, 140, 0.12)',
}

const lavender: Palette = {
  snow: '#faf8ff',
  mist: '#f3efff',
  'lavender-50': '#ede9fe',
  'lavender-100': '#ddd6fe',
  lilac: '#c4b5fd',
  violet: '#8b5cf6',
  deep: '#5b21b6',
  rose: '#ddd6fe',
  'rose-deep': '#c4b5fd',
  blush: '#f5f3ff',
  sky: '#e9d5ff',
  'sky-deep': '#d8b4fe',
  text: '#4c1d95',
  'text-muted': '#7c6bb5',
  white: '#ffffff',
  line: 'rgba(91, 33, 182, 0.12)',
}

const violet: Palette = {
  snow: '#f8f7ff',
  mist: '#ede9fe',
  'lavender-50': '#e4dff9',
  'lavender-100': '#d4c4f5',
  lilac: '#a78bfa',
  violet: '#6d28d9',
  deep: '#4c1d95',
  rose: '#ddd6fe',
  'rose-deep': '#c4b5fd',
  blush: '#f3e8ff',
  sky: '#d8b4fe',
  'sky-deep': '#c084fc',
  text: '#3b0764',
  'text-muted': '#7c6bb5',
  white: '#ffffff',
  line: 'rgba(76, 29, 149, 0.14)',
}

const periwinkle: Palette = {
  snow: '#f8faff',
  mist: '#eef2ff',
  'lavender-50': '#e0e7ff',
  'lavender-100': '#c7d2fe',
  lilac: '#a5b4fc',
  violet: '#6366f1',
  deep: '#3730a3',
  rose: '#c7d2fe',
  'rose-deep': '#a5b4fc',
  blush: '#eef2ff',
  sky: '#bae6fd',
  'sky-deep': '#7dd3fc',
  text: '#312e81',
  'text-muted': '#6366a8',
  white: '#ffffff',
  line: 'rgba(55, 48, 163, 0.12)',
}

const sky: Palette = {
  snow: '#f5fbff',
  mist: '#e0f2fe',
  'lavender-50': '#dbeafe',
  'lavender-100': '#bfdbfe',
  lilac: '#7dd3fc',
  violet: '#0284c7',
  deep: '#0c4a6e',
  rose: '#bae6fd',
  'rose-deep': '#7dd3fc',
  blush: '#e0f2fe',
  sky: '#bae6fd',
  'sky-deep': '#38bdf8',
  text: '#0c4a6e',
  'text-muted': '#0369a1',
  white: '#ffffff',
  line: 'rgba(12, 74, 110, 0.12)',
}

const mint: Palette = {
  snow: '#f4fff9',
  mist: '#ecfdf5',
  'lavender-50': '#d1fae5',
  'lavender-100': '#a7f3d0',
  lilac: '#6ee7b7',
  violet: '#059669',
  deep: '#064e3b',
  rose: '#a7f3d0',
  'rose-deep': '#6ee7b7',
  blush: '#ecfdf5',
  sky: '#a5f3fc',
  'sky-deep': '#5eead4',
  text: '#064e3b',
  'text-muted': '#0f766e',
  white: '#ffffff',
  line: 'rgba(6, 78, 59, 0.12)',
}

export const THEME_PALETTES: Record<AppThemeId, Palette> = {
  pink,
  lavender,
  violet,
  periwinkle,
  sky,
  mint,
}

export function resolveAppThemeId(db: string | null | undefined): AppThemeId {
  if (!db || db === 'bloomora_pastel') return 'pink'
  if ((APP_THEME_IDS as readonly string[]).includes(db)) return db as AppThemeId
  return 'pink'
}

export function applyBloomoraThemeCssVars(themeId: AppThemeId): void {
  const palette = THEME_PALETTES[themeId]
  const root = document.documentElement
  for (const key of KEYS) {
    root.style.setProperty(`${CSS_PREFIX}${key}`, palette[key])
  }
}

export function clearBloomoraThemeCssVars(): void {
  const root = document.documentElement
  for (const name of BLOOMORA_THEME_CSS_VAR_NAMES) {
    root.style.removeProperty(name)
  }
}
