/**
 * Temas Bloomora: paletas `--color-bloomora-*`, chrome `--bloomora-*` y preferencia
 * fija o automática (`auto:pink:noche`).
 */

export const APP_THEME_IDS = [
  'pink',
  'lavender',
  'violet',
  'periwinkle',
  'sky',
  'mint',
  'bosque',
  'pizarra',
  'noche',
  'dark',
] as const

export type AppThemeId = (typeof APP_THEME_IDS)[number]

/** Temas oscuros (comparten data-bloomora-mode="dark"). */
export const DARK_THEME_IDS: readonly AppThemeId[] = ['noche', 'dark']

export function isDarkThemeId(id: AppThemeId): boolean {
  return (DARK_THEME_IDS as readonly string[]).includes(id)
}

export const LIGHT_THEME_IDS = APP_THEME_IDS.filter((id) => !isDarkThemeId(id))

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

/** Extras semánticos (también en chrome por tema). */
export const EXTRA_CHROME_KEYS = [
  '--bloomora-on-accent',
  '--bloomora-success',
  '--bloomora-success-soft',
  '--bloomora-danger',
  '--bloomora-danger-soft',
  '--bloomora-surface-1',
  '--bloomora-surface-2',
  '--bloomora-surface-3',
  '--bloomora-text',
  '--bloomora-text-muted',
  '--bloomora-text-subtle',
  '--bloomora-accent',
  '--bloomora-accent-bg',
  '--bloomora-accent-on',
  '--bloomora-danger-fg',
  '--bloomora-border',
  '--bloomora-border-strong',
  '--bloomora-focus',
  '--bloomora-cal-surface',
  '--bloomora-day-bg',
  '--bloomora-day-fg',
  '--bloomora-day-border',
  '--bloomora-day-locked-fg',
  '--bloomora-day-today',
  '--bloomora-day-done-on',
  '--bloomora-toast-bg',
  '--bloomora-toast-fg',
  '--bloomora-card-shadow',
  '--bloomora-focus-ring',
  '--bloomora-overlay',
  '--bloomora-progress-from',
  '--bloomora-progress-to',
  '--bloomora-mascot-halo',
  '--bloomora-mascot-filter',
  '--bloomora-scrollbar-thumb',
  '--bloomora-theme-color',
] as const

/** Tokens de contraste UI (claros: equivalentes actuales vía paleta). */
const LIGHT_CONTRAST = {
  '--bloomora-surface-1': '#FFFFFF',
  '--bloomora-surface-2': '#FFFFFF',
  '--bloomora-surface-3': 'var(--color-bloomora-lavender-50)',
  '--bloomora-text': 'var(--color-bloomora-text)',
  '--bloomora-text-muted': 'var(--color-bloomora-text-muted)',
  '--bloomora-text-subtle': 'var(--color-bloomora-text-muted)',
  '--bloomora-accent': 'var(--color-bloomora-violet)',
  '--bloomora-accent-bg': 'var(--color-bloomora-violet)',
  '--bloomora-accent-on': '#FFFFFF',
  '--bloomora-danger-fg': 'var(--bloomora-danger)',
  '--bloomora-border': 'var(--color-bloomora-line)',
  '--bloomora-border-strong': 'var(--color-bloomora-lilac)',
  '--bloomora-focus': 'var(--color-bloomora-lilac)',
  '--bloomora-cal-surface': 'var(--color-bloomora-mist)',
  '--bloomora-day-bg': '#FFFFFF',
  '--bloomora-day-fg': 'var(--color-bloomora-text)',
  '--bloomora-day-border': 'var(--color-bloomora-line)',
  '--bloomora-day-locked-fg': 'var(--color-bloomora-text-muted)',
  '--bloomora-day-today': 'var(--color-bloomora-rose-deep)',
  '--bloomora-day-done-on': '#FFFFFF',
  '--bloomora-toast-bg': '#FFFFFF',
  '--bloomora-toast-fg': 'var(--color-bloomora-text)',
} satisfies Partial<Record<(typeof EXTRA_CHROME_KEYS)[number], string>>

const LIGHT_EXTRAS: Record<(typeof EXTRA_CHROME_KEYS)[number], string> = {
  '--bloomora-on-accent': '#FFFFFF',
  '--bloomora-success': '#2F7A52',
  '--bloomora-success-soft': '#EAF5EE',
  '--bloomora-danger': '#C2416B',
  '--bloomora-danger-soft': '#FDECF2',
  ...LIGHT_CONTRAST,
  '--bloomora-card-shadow':
    '0 1px 2px rgba(84,70,135,.04), 0 12px 32px rgba(84,70,135,.08)',
  '--bloomora-focus-ring': '0 0 0 3px rgba(184,166,240,.45)',
  '--bloomora-overlay': 'rgba(40,30,60,.35)',
  '--bloomora-progress-from': '#B8A6F0',
  '--bloomora-progress-to': '#F080A0',
  '--bloomora-mascot-halo': 'none',
  '--bloomora-mascot-filter': 'none',
  '--bloomora-scrollbar-thumb': 'var(--color-bloomora-line)',
  '--bloomora-theme-color': '#faf8ff',
}

/** Cromado rosa (temas pastel claros actuales). Sombras = box-shadow completo. */
const LIGHT_CHROME: Record<string, string> = {
  '--bloomora-btn-from': '#ff9aab',
  '--bloomora-btn-to': '#ffc2d1',
  '--bloomora-btn-shadow': '0 4px 12px rgba(255, 154, 171, 0.45)',
  '--bloomora-btn-shadow-hover': '0 6px 18px rgba(255, 140, 160, 0.55)',
  '--bloomora-list-cta-from': '#ff9eb3',
  '--bloomora-list-cta-via': '#e8b4ff',
  '--bloomora-list-cta-to': '#9b86f0',
  '--bloomora-list-border-from': '#ffb8d0',
  '--bloomora-list-border-via': '#dcc8ff',
  '--bloomora-list-border-to': '#a89cf0',
  '--bloomora-list-add-from': '#ff8fab',
  '--bloomora-list-add-to': '#f4a8d0',
  '--bloomora-list-panel-glow': '0 8px 24px -6px rgba(236, 139, 184, 0.35)',
  ...LIGHT_EXTRAS,
}

const DARK_CHROME: Record<string, string> = {
  '--bloomora-btn-from': '#0ea5e9',
  '--bloomora-btn-to': '#bae6fd',
  '--bloomora-btn-shadow':
    '0 0 0 1px rgba(14,165,233,.30), 0 6px 18px rgba(14,165,233,.22)',
  '--bloomora-btn-shadow-hover':
    '0 0 0 1px rgba(125,211,252,.45), 0 8px 26px rgba(125,211,252,.32)',
  '--bloomora-list-cta-from': '#0ea5e9',
  '--bloomora-list-cta-via': '#38bdf8',
  '--bloomora-list-cta-to': '#bae6fd',
  '--bloomora-list-border-from': '#38bdf8',
  '--bloomora-list-border-via': '#a5f3fc',
  '--bloomora-list-border-to': '#22d3ee',
  '--bloomora-list-add-from': '#0ea5e9',
  '--bloomora-list-add-to': '#7dd3fc',
  '--bloomora-list-panel-glow':
    '0 0 0 1px rgba(230,228,245,.12), 0 0 48px rgba(56,189,248,.18)',
  '--bloomora-on-accent': '#0B1220',
  '--bloomora-success': '#7CCB9F',
  '--bloomora-success-soft': '#1F3329',
  '--bloomora-danger': '#F2828F',
  '--bloomora-danger-soft': '#3A2430',
  '--bloomora-surface-1': '#1E1E1E',
  '--bloomora-surface-2': '#262626',
  '--bloomora-surface-3': '#303030',
  '--bloomora-text': '#EBE9F2',
  '--bloomora-text-muted': '#ADA8BD',
  '--bloomora-text-subtle': '#8F8A9E',
  '--bloomora-accent': '#7DD3FC',
  '--bloomora-accent-bg': '#7DD3FC',
  '--bloomora-accent-on': '#0B1220',
  '--bloomora-danger-fg': '#F4A6C2',
  '--bloomora-border': '#333333',
  '--bloomora-border-strong': '#767676',
  '--bloomora-focus': '#7DD3FC',
  '--bloomora-cal-surface': '#1A1A1A',
  '--bloomora-day-bg': '#2A2A2A',
  '--bloomora-day-fg': '#E3E3E8',
  '--bloomora-day-border': '#555555',
  '--bloomora-day-locked-fg': '#85828F',
  '--bloomora-day-today': '#7DD3FC',
  '--bloomora-day-done-on': '#0B1220',
  '--bloomora-toast-bg': '#262626',
  '--bloomora-toast-fg': '#F4F4F6',
  '--bloomora-card-shadow':
    '0 1px 0 rgba(255,255,255,.03) inset, 0 10px 30px rgba(0,0,0,.35)',
  '--bloomora-focus-ring': '0 0 0 3px rgba(125,211,252,.50)',
  '--bloomora-overlay': 'rgba(8,7,12,.66)',
  '--bloomora-progress-from': '#0EA5E9',
  '--bloomora-progress-to': '#BAE6FD',
  '--bloomora-mascot-halo':
    'radial-gradient(closest-side, rgba(125,211,252,.26), rgba(111,211,195,.08) 62%, transparent 100%)',
  '--bloomora-mascot-filter':
    'brightness(.94) drop-shadow(0 0 1px rgba(236,232,246,.55)) drop-shadow(0 0 14px rgba(125,211,252,.30))',
  '--bloomora-scrollbar-thumb': '#555555',
  '--bloomora-theme-color': '#121212',
}

const CHROME_NOCHE: Record<string, string> = {
  '--bloomora-btn-from': '#A99BF5',
  '--bloomora-btn-to': '#7FD6C8',
  '--bloomora-btn-shadow':
    '0 0 0 1px rgba(185,174,245,.30), 0 6px 18px rgba(111,211,195,.16)',
  '--bloomora-btn-shadow-hover':
    '0 0 0 1px rgba(185,174,245,.55), 0 8px 26px rgba(111,211,195,.28)',
  '--bloomora-list-cta-from': '#A99BF5',
  '--bloomora-list-cta-via': '#94B6EC',
  '--bloomora-list-cta-to': '#7FD6C8',
  '--bloomora-list-border-from': 'rgba(185,174,245,.45)',
  '--bloomora-list-border-via': 'rgba(148,182,236,.30)',
  '--bloomora-list-border-to': 'rgba(111,211,195,.45)',
  '--bloomora-list-add-from': '#A99BF5',
  '--bloomora-list-add-to': '#7FD6C8',
  '--bloomora-list-panel-glow':
    '0 0 0 1px #343049, 0 0 48px rgba(169,155,245,.10)',
  '--bloomora-on-accent': '#15131C',
  '--bloomora-success': '#7CCB9F',
  '--bloomora-success-soft': '#1F3329',
  '--bloomora-danger': '#F2828F',
  '--bloomora-danger-soft': '#3A2433',
  '--bloomora-surface-1': '#1E1B29',
  '--bloomora-surface-2': '#272335',
  '--bloomora-surface-3': '#322D45',
  '--bloomora-text': '#ECE8F6',
  '--bloomora-text-muted': '#B3ADC9',
  '--bloomora-text-subtle': '#9790B0',
  '--bloomora-accent': '#C3B8FA',
  '--bloomora-accent-bg': '#B9AEF5',
  '--bloomora-accent-on': '#15131C',
  '--bloomora-danger-fg': '#F4A6C2',
  '--bloomora-border': '#3A3550',
  '--bloomora-border-strong': '#7A7299',
  '--bloomora-focus': '#C9BEFA',
  '--bloomora-cal-surface': '#211E2E',
  '--bloomora-day-bg': '#2E2A40',
  '--bloomora-day-fg': '#DCD7EC',
  '--bloomora-day-border': '#5A5378',
  '--bloomora-day-locked-fg': '#8A84A3',
  '--bloomora-day-today': '#F4A6C2',
  '--bloomora-day-done-on': '#15131C',
  '--bloomora-toast-bg': '#2A2639',
  '--bloomora-toast-fg': '#F1EEFA',
  '--bloomora-card-shadow':
    '0 1px 0 rgba(255,255,255,.03) inset, 0 10px 30px rgba(0,0,0,.35)',
  '--bloomora-focus-ring': '0 0 0 3px rgba(185,174,245,.50)',
  '--bloomora-overlay': 'rgba(8,7,12,.66)',
  '--bloomora-progress-from': '#A99BF5',
  '--bloomora-progress-to': '#6FD3C3',
  '--bloomora-mascot-halo':
    'radial-gradient(closest-side, rgba(185,174,245,.26), rgba(111,211,195,.08) 62%, transparent 100%)',
  '--bloomora-mascot-filter':
    'brightness(.94) drop-shadow(0 0 1px rgba(236,232,246,.55)) drop-shadow(0 0 14px rgba(185,174,245,.30))',
  '--bloomora-scrollbar-thumb': '#3A3550',
  '--bloomora-theme-color': '#15131C',
}

const CHROME_BOSQUE: Record<string, string> = {
  '--bloomora-btn-from': '#2F6B4C',
  '--bloomora-btn-to': '#3E7A59',
  '--bloomora-btn-shadow': '0 4px 12px rgba(47,107,76,.22)',
  '--bloomora-btn-shadow-hover': '0 6px 18px rgba(47,107,76,.32)',
  '--bloomora-list-cta-from': '#2F6B4C',
  '--bloomora-list-cta-via': '#3A7454',
  '--bloomora-list-cta-to': '#3E7A59',
  '--bloomora-list-border-from': '#CFE0D3',
  '--bloomora-list-border-via': '#E3DFD5',
  '--bloomora-list-border-to': '#E8D3C0',
  '--bloomora-list-add-from': '#2F6B4C',
  '--bloomora-list-add-to': '#3E7A59',
  '--bloomora-list-panel-glow': '0 12px 32px rgba(34,55,43,.07)',
  '--bloomora-on-accent': '#FFFFFF',
  '--bloomora-success': '#2F7A52',
  '--bloomora-success-soft': '#EAF5EE',
  '--bloomora-danger': '#B5473A',
  '--bloomora-danger-soft': '#F8E6E2',
  ...LIGHT_CONTRAST,
  '--bloomora-card-shadow':
    '0 1px 2px rgba(34,55,43,.04), 0 12px 32px rgba(34,55,43,.07)',
  '--bloomora-focus-ring': '0 0 0 3px rgba(63,122,90,.35)',
  '--bloomora-overlay': 'rgba(34,40,36,.40)',
  '--bloomora-progress-from': '#9DBFA7',
  '--bloomora-progress-to': '#3F7A5A',
  '--bloomora-mascot-halo':
    'radial-gradient(closest-side, rgba(157,191,167,.20), transparent 100%)',
  '--bloomora-mascot-filter': 'none',
  '--bloomora-scrollbar-thumb': '#D4CFC3',
  '--bloomora-theme-color': '#F6F4EF',
}

const CHROME_PIZARRA: Record<string, string> = {
  '--bloomora-btn-from': '#34506F',
  '--bloomora-btn-to': '#4A6A8E',
  '--bloomora-btn-shadow': '0 4px 12px rgba(52,80,111,.22)',
  '--bloomora-btn-shadow-hover': '0 6px 18px rgba(52,80,111,.32)',
  '--bloomora-list-cta-from': '#34506F',
  '--bloomora-list-cta-via': '#3F5D80',
  '--bloomora-list-cta-to': '#4A6A8E',
  '--bloomora-list-border-from': '#CBD6E3',
  '--bloomora-list-border-via': '#DBE1E9',
  '--bloomora-list-border-to': '#EBD7AE',
  '--bloomora-list-add-from': '#34506F',
  '--bloomora-list-add-to': '#4A6A8E',
  '--bloomora-list-panel-glow': '0 12px 32px rgba(30,42,57,.07)',
  '--bloomora-on-accent': '#FFFFFF',
  '--bloomora-success': '#2F7A52',
  '--bloomora-success-soft': '#EAF5EE',
  '--bloomora-danger': '#B5473A',
  '--bloomora-danger-soft': '#F8E6E2',
  ...LIGHT_CONTRAST,
  '--bloomora-card-shadow':
    '0 1px 2px rgba(30,42,57,.04), 0 12px 32px rgba(30,42,57,.07)',
  '--bloomora-focus-ring': '0 0 0 3px rgba(62,90,122,.35)',
  '--bloomora-overlay': 'rgba(20,28,38,.40)',
  '--bloomora-progress-from': '#A9B8CD',
  '--bloomora-progress-to': '#D9A23A',
  '--bloomora-mascot-halo':
    'radial-gradient(closest-side, rgba(169,184,205,.22), transparent 100%)',
  '--bloomora-mascot-filter': 'none',
  '--bloomora-scrollbar-thumb': '#C9D2DD',
  '--bloomora-theme-color': '#F3F5F8',
}

export const BLOOMORA_EXTRA_CSS_VAR_NAMES = Object.keys(
  LIGHT_CHROME,
) as readonly string[]

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

const bosque: Palette = {
  snow: '#F6F4EF',
  mist: '#EEEBE3',
  'lavender-50': '#F1F4EE',
  'lavender-100': '#E1E8DE',
  lilac: '#6E9B7E',
  violet: '#3F7A5A',
  deep: '#22372B',
  rose: '#D39A6A',
  'rose-deep': '#2F6B4C',
  blush: '#E4EEE6',
  sky: '#8DB0C4',
  'sky-deep': '#3F6C86',
  text: '#2F3A35',
  'text-muted': '#5F6B65',
  white: '#FFFFFF',
  line: '#E3DFD5',
}

const pizarra: Palette = {
  snow: '#F3F5F8',
  mist: '#E8ECF1',
  'lavender-50': '#EEF2F7',
  'lavender-100': '#DCE3EC',
  lilac: '#7A8DA8',
  violet: '#3E5A7A',
  deep: '#1E2A39',
  rose: '#D9A23A',
  'rose-deep': '#34506F',
  blush: '#E3EAF2',
  sky: '#7FA6C9',
  'sky-deep': '#3D6D96',
  text: '#27323F',
  'text-muted': '#5A6676',
  white: '#FFFFFF',
  line: '#DBE1E9',
}

const noche: Palette = {
  snow: '#15131C',
  mist: '#272335',
  'lavender-50': '#211E2E',
  'lavender-100': '#2E2A40',
  lilac: '#8F82D9',
  violet: '#B9AEF5',
  deep: '#F1EEFA',
  rose: '#D7A8C4',
  'rose-deep': '#C9BEFA',
  blush: '#2C2840',
  sky: '#6FD3C3',
  'sky-deep': '#4FB8A8',
  text: '#ECE8F6',
  'text-muted': '#B3ADC9',
  white: '#1E1B29',
  line: '#343049',
}

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
  'text-muted': '#ADA8BD',
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
  bosque,
  pizarra,
  noche,
  dark,
}

export const THEME_CHROME: Record<AppThemeId, Record<string, string>> = {
  pink: { ...LIGHT_CHROME, '--bloomora-theme-color': pink.snow },
  lavender: { ...LIGHT_CHROME, '--bloomora-theme-color': lavender.snow },
  violet: { ...LIGHT_CHROME, '--bloomora-theme-color': violet.snow },
  periwinkle: { ...LIGHT_CHROME, '--bloomora-theme-color': periwinkle.snow },
  sky: { ...LIGHT_CHROME, '--bloomora-theme-color': sky.snow },
  mint: { ...LIGHT_CHROME, '--bloomora-theme-color': mint.snow },
  bosque: CHROME_BOSQUE,
  pizarra: CHROME_PIZARRA,
  noche: CHROME_NOCHE,
  dark: DARK_CHROME,
}

export const THEME_META: Record<
  AppThemeId,
  { label: string; blurb: string; isNew?: boolean }
> = {
  pink: { label: 'Rosa', blurb: 'El clásico de Bloomora.' },
  lavender: { label: 'Lavanda', blurb: 'Lila suave.' },
  violet: { label: 'Violeta', blurb: 'Violeta intenso.' },
  periwinkle: { label: 'Pervinca', blurb: 'Azul lavanda.' },
  sky: { label: 'Cielo', blurb: 'Celeste fresco.' },
  mint: { label: 'Menta', blurb: 'Verde menta.' },
  bosque: {
    label: 'Bosque',
    blurb: 'Salvia, arena y verde bosque.',
    isNew: true,
  },
  pizarra: {
    label: 'Pizarra',
    blurb: 'Gris pizarra con toque ocre.',
    isNew: true,
  },
  noche: {
    label: 'Noche',
    blurb: 'Tinta y lavanda, acentos menta.',
    isNew: true,
  },
  dark: { label: 'Medianoche', blurb: 'Oscuro mate, acentos azules.' },
}

export const BLOOMORA_THEME_STORAGE_KEY = 'bloomora_theme'
export const DEFAULT_AUTO_LIGHT: AppThemeId = 'pink'
export const DEFAULT_AUTO_DARK: AppThemeId = 'noche'

export type ThemePreference =
  | { kind: 'fixed'; themeId: AppThemeId }
  | { kind: 'auto'; lightId: AppThemeId; darkId: AppThemeId }

export function isAppThemeId(value: string | null | undefined): value is AppThemeId {
  return !!value && (APP_THEME_IDS as readonly string[]).includes(value)
}

export function resolveAppThemeId(db: string | null | undefined): AppThemeId {
  if (!db || db === 'bloomora_pastel') return 'pink'
  if (db.startsWith('auto:')) {
    return resolveEffectiveThemeId(parseThemePreference(db))
  }
  if (isAppThemeId(db)) return db
  return 'pink'
}

export function parseThemePreference(
  raw: string | null | undefined,
): ThemePreference {
  if (!raw || raw === 'bloomora_pastel') {
    return { kind: 'fixed', themeId: 'pink' }
  }
  if (raw === 'auto' || raw.startsWith('auto:')) {
    const parts = raw.split(':')
    const lightId = isAppThemeId(parts[1]) ? parts[1] : DEFAULT_AUTO_LIGHT
    const darkId = isAppThemeId(parts[2]) ? parts[2] : DEFAULT_AUTO_DARK
    return {
      kind: 'auto',
      lightId: isDarkThemeId(lightId) ? DEFAULT_AUTO_LIGHT : lightId,
      darkId: isDarkThemeId(darkId) ? darkId : DEFAULT_AUTO_DARK,
    }
  }
  return { kind: 'fixed', themeId: resolveAppThemeId(raw) }
}

export function serializeThemePreference(pref: ThemePreference): string {
  if (pref.kind === 'fixed') return pref.themeId
  return `auto:${pref.lightId}:${pref.darkId}`
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveEffectiveThemeId(
  pref: ThemePreference,
  systemDark = getSystemPrefersDark(),
): AppThemeId {
  if (pref.kind === 'fixed') return pref.themeId
  return systemDark ? pref.darkId : pref.lightId
}

export function readStoredThemePreference(): ThemePreference | null {
  try {
    const raw = localStorage.getItem(BLOOMORA_THEME_STORAGE_KEY)
    if (!raw) return null
    return parseThemePreference(raw)
  } catch {
    return null
  }
}

/** @deprecated Prefer readStoredThemePreference */
export function readStoredBloomoraTheme(): AppThemeId | null {
  const pref = readStoredThemePreference()
  return pref ? resolveEffectiveThemeId(pref) : null
}

export function persistThemePreference(pref: ThemePreference | string): void {
  try {
    const raw =
      typeof pref === 'string' ? pref : serializeThemePreference(pref)
    localStorage.setItem(BLOOMORA_THEME_STORAGE_KEY, raw)
  } catch {
    /* ignore */
  }
}

/** @deprecated Prefer persistThemePreference */
export function persistBloomoraTheme(themeId: AppThemeId): void {
  persistThemePreference({ kind: 'fixed', themeId })
}

export function clearStoredBloomoraTheme(): void {
  try {
    localStorage.removeItem(BLOOMORA_THEME_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function applyBloomoraThemeColorMeta(themeId: AppThemeId): void {
  const chrome = THEME_CHROME[themeId]
  const color = chrome['--bloomora-theme-color'] ?? THEME_PALETTES[themeId].snow
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', color)
}

function applyModeAttributes(themeId: AppThemeId): void {
  const root = document.documentElement
  const mode = isDarkThemeId(themeId) ? 'dark' : 'light'
  root.setAttribute('data-bloomora-mode', mode)
  root.style.colorScheme = mode
  // Compat: reglas antiguas que miran data-bloomora-theme="dark"
  if (mode === 'dark') {
    root.setAttribute('data-bloomora-theme', 'dark')
  } else {
    root.removeAttribute('data-bloomora-theme')
  }
}

export function applyBloomoraThemeCssVars(
  themeId: AppThemeId,
  options?: { persist?: boolean | ThemePreference | string },
): void {
  const palette = THEME_PALETTES[themeId]
  const root = document.documentElement
  for (const key of KEYS) {
    root.style.setProperty(`${CSS_PREFIX}${key}`, palette[key])
  }
  const chrome = THEME_CHROME[themeId]
  for (const name of BLOOMORA_EXTRA_CSS_VAR_NAMES) {
    root.style.setProperty(name, chrome[name] ?? '')
  }
  applyModeAttributes(themeId)
  applyBloomoraThemeColorMeta(themeId)

  if (options?.persist === false) return
  if (typeof options?.persist === 'string') {
    persistThemePreference(options.persist)
    return
  }
  if (options?.persist && typeof options.persist === 'object') {
    persistThemePreference(options.persist)
    return
  }
  persistThemePreference({ kind: 'fixed', themeId })
}

/** Aplica la preferencia (fija o auto) según el sistema. */
export function applyThemePreference(
  pref: ThemePreference,
  options?: { persist?: boolean },
): AppThemeId {
  const effective = resolveEffectiveThemeId(pref)
  applyBloomoraThemeCssVars(effective, {
    persist: options?.persist === false ? false : pref,
  })
  return effective
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
  root.removeAttribute('data-bloomora-mode')
  root.style.removeProperty('color-scheme')
  applyBloomoraThemeColorMeta('pink')
}
