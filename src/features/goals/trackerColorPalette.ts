import type { MockGoalRow } from '@/data/dashboardMock'
import type { CSSProperties } from 'react'

export type TrackerSwatchFamily = 'pastel' | 'vibrant'

export type TrackerSwatch = {
  id: string
  family: TrackerSwatchFamily
  /** Color más claro (inicio del gradiente) */
  from: string
  /** Color más intenso (fin del gradiente) */
  to: string
}

/** 18 pasteles + 12 vibrantes */
export const TRACKER_SWATCHES: TrackerSwatch[] = [
  { id: 'p01', family: 'pastel', from: '#FFE4EC', to: '#FFD0E0' },
  { id: 'p02', family: 'pastel', from: '#FFE8DC', to: '#FFD4BF' },
  { id: 'p03', family: 'pastel', from: '#FFF9D6', to: '#FFF0B3' },
  { id: 'p04', family: 'pastel', from: '#FFEDD5', to: '#FFD6A8' },
  { id: 'p05', family: 'pastel', from: '#E8FBF3', to: '#CFF5E8' },
  { id: 'p06', family: 'pastel', from: '#BFF5F0', to: '#9EEDE0' },
  { id: 'p07', family: 'pastel', from: '#E2F0E2', to: '#C9E4C9' },
  { id: 'p08', family: 'pastel', from: '#EFF9E0', to: '#DCF0C4' },
  { id: 'p09', family: 'pastel', from: '#EEE6FA', to: '#D9CEF5' },
  { id: 'p10', family: 'pastel', from: '#E8E0F7', to: '#D2CAF0' },
  { id: 'p11', family: 'pastel', from: '#E4EAFF', to: '#CDDCFF' },
  { id: 'p12', family: 'pastel', from: '#DAF4FF', to: '#BEE9FC' },
  { id: 'p13', family: 'pastel', from: '#E6F4FF', to: '#CDE9FB' },
  { id: 'p14', family: 'pastel', from: '#F1E4F0', to: '#E5D0E3' },
  { id: 'p15', family: 'pastel', from: '#FFDFDC', to: '#FCC9C4' },
  { id: 'p16', family: 'pastel', from: '#FFEAD9', to: '#FFD9BF' },
  { id: 'p17', family: 'pastel', from: '#DDF2F5', to: '#C9EAEF' },
  { id: 'p18', family: 'pastel', from: '#F5E6ED', to: '#ECD4E4' },

  { id: 'v01', family: 'vibrant', from: '#F472B6', to: '#DB2777' },
  { id: 'v02', family: 'vibrant', from: '#FB7185', to: '#E11D48' },
  { id: 'v03', family: 'vibrant', from: '#FB923C', to: '#EA580C' },
  { id: 'v04', family: 'vibrant', from: '#FBBF24', to: '#D97706' },
  { id: 'v05', family: 'vibrant', from: '#A3E635', to: '#65A30D' },
  { id: 'v06', family: 'vibrant', from: '#4ADE80', to: '#16A34A' },
  { id: 'v07', family: 'vibrant', from: '#2DD4BF', to: '#0D9488' },
  { id: 'v08', family: 'vibrant', from: '#22D3EE', to: '#0891B2' },
  { id: 'v09', family: 'vibrant', from: '#60A5FA', to: '#2563EB' },
  { id: 'v10', family: 'vibrant', from: '#818CF8', to: '#4F46E5' },
  { id: 'v11', family: 'vibrant', from: '#A78BFA', to: '#6D28D9' },
  { id: 'v12', family: 'vibrant', from: '#E879F9', to: '#C026D3' },
]

const BY_ID = new Map(TRACKER_SWATCHES.map((s) => [s.id, s]))

export const DEFAULT_TRACKER_COLOR_BY_ACCENT: Record<
  MockGoalRow['accent'],
  string
> = {
  lavender: 'p09',
  green: 'p06',
  sky: 'p12',
}

export function getDefaultTrackerColorId(
  accent: MockGoalRow['accent'],
): string {
  return DEFAULT_TRACKER_COLOR_BY_ACCENT[accent]
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const x =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = Number.parseInt(x, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const lin = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!
}

export function getTrackerSwatch(
  trackerColorId: string | undefined,
  accent: MockGoalRow['accent'],
): TrackerSwatch {
  const fallback = DEFAULT_TRACKER_COLOR_BY_ACCENT[accent]
  const id =
    trackerColorId && BY_ID.has(trackerColorId)
      ? trackerColorId
      : fallback
  return BY_ID.get(id)!
}

export function getCompletedCellStyle(swatch: TrackerSwatch): CSSProperties {
  const { r, g, b } = hexToRgb(swatch.to)
  const lum = relativeLuminance(swatch.to)
  const fg = lum > 0.65 ? '#5b4a8c' : '#ffffff'
  return {
    background: `linear-gradient(160deg, ${swatch.from} 0%, ${swatch.to} 100%)`,
    boxShadow: `0 5px 20px rgba(${r},${g},${b},0.38)`,
    color: fg,
  }
}

export const TRACKER_PASTELS = TRACKER_SWATCHES.filter((s) => s.family === 'pastel')
export const TRACKER_VIBRANTS = TRACKER_SWATCHES.filter(
  (s) => s.family === 'vibrant',
)
