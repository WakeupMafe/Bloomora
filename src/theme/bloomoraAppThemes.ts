/**
 * Temas de la app: ids en Editar perfil + legado `bloomora_pastel` → pink.
 * `--color-bloomora-*` para Tailwind; `--bloomora-btn-*` / `--bloomora-list-*` para gradientes fijos.
 */

export const APP_THEME_IDS = [
  'pink',
  'lavender',
  'violet',
  'periwinkle',
  'sky',
  'mint',
  'dark',
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

/** Cromado compartido (botón primario + bloques tipo Listas) en temas claros. */
const LIGHT_CHROME: Record<string, string> = {
  '--bloomora-btn-from': '#ff9aab',
  '--bloomora-btn-to': '#ffc2d1',
  '--bloomora-btn-shadow': 'rgba(255, 154, 171, 0.5)',
  '--bloomora-btn-shadow-hover': 'rgba(255, 140, 160, 0.58)',
  '--bloomora-list-cta-from': '#ff9eb3',
  '--bloomora-list-cta-via': '#e8b4ff',
  '--bloomora-list-cta-to': '#9b86f0',
  '--bloomora-list-border-from': '#ffb8d0',
  '--bloomora-list-border-via': '#dcc8ff',
  '--bloomora-list-border-to': '#a89cf0',
  '--bloomora-list-add-from': '#ff8fab',
  '--bloomora-list-add-to': '#f4a8d0',
  '--bloomora-list-panel-glow': 'rgba(236, 139, 184, 0.35)',
}

/** Botones y listas en oscuro: solo azul cielo / cyan suave (sin azul rey). */
const DARK_CHROME: Record<string, string> = {
  '--bloomora-btn-from': '#0ea5e9',
  '--bloomora-btn-to': '#bae6fd',
  '--bloomora-btn-shadow': 'rgba(14, 165, 233, 0.38)',
  '--bloomora-btn-shadow-hover': 'rgba(125, 211, 252, 0.48)',
  '--bloomora-list-cta-from': '#0ea5e9',
  '--bloomora-list-cta-via': '#38bdf8',
  '--bloomora-list-cta-to': '#bae6fd',
  '--bloomora-list-border-from': '#38bdf8',
  '--bloomora-list-border-via': '#a5f3fc',
  '--bloomora-list-border-to': '#22d3ee',
  '--bloomora-list-add-from': '#0ea5e9',
  '--bloomora-list-add-to': '#7dd3fc',
  '--bloomora-list-panel-glow': 'rgba(56, 189, 248, 0.42)',
}

export const BLOOMORA_EXTRA_CSS_VAR_NAMES = Object.keys(
  LIGHT_CHROME,
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

/**
 * Modo oscuro mate: gris plano ~#121212 (página); tarjetas #181818 / #242424;
 * sin “lavanda” en el fondo; acentos y rosa del sistema → azules.
 */
const dark: Palette = {
  snow: '#121212',
  mist: '#141414',
  'lavender-50': '#181818',
  'lavender-100': '#242424',
  lilac: '#7dd3fc',
  violet: '#bae6fd',
  deep: '#f0eef6',
  rose: '#38bdf8',
  'rose-deep': '#22d3ee',
  blush: '#121212',
  sky: '#a5f3fc',
  'sky-deep': '#67e8f9',
  text: '#ebe9f2',
  'text-muted': '#9b94b0',
  white: '#1e1e1e',
  line: 'rgba(230, 228, 245, 0.12)',
}

export const THEME_PALETTES: Record<AppThemeId, Palette> = {
  pink,
  lavender,
  violet,
  periwinkle,
  sky,
  mint,
  dark,
}

const THEME_CHROME: Record<AppThemeId, Record<string, string>> = {
  pink: LIGHT_CHROME,
  lavender: LIGHT_CHROME,
  violet: LIGHT_CHROME,
  periwinkle: LIGHT_CHROME,
  sky: LIGHT_CHROME,
  mint: LIGHT_CHROME,
  dark: DARK_CHROME,
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
  const chrome = THEME_CHROME[themeId]
  for (const name of BLOOMORA_EXTRA_CSS_VAR_NAMES) {
    root.style.setProperty(name, chrome[name] ?? '')
  }
  if (themeId === 'dark') {
    root.setAttribute('data-bloomora-theme', 'dark')
  } else {
    root.removeAttribute('data-bloomora-theme')
  }
}

export function clearBloomoraThemeCssVars(): void {
  const root = document.documentElement
  for (const name of BLOOMORA_THEME_CSS_VAR_NAMES) {
    root.style.removeProperty(name)
  }
  for (const name of BLOOMORA_EXTRA_CSS_VAR_NAMES) {
    root.style.removeProperty(name)
  }
  root.removeAttribute('data-bloomora-theme')
}
