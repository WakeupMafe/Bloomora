import type { TabataPhaseKind } from '@/features/tabata/tabataTypes'

/** Colores por fase → tokens Bloomora / Tailwind más cercanos. */
export function phaseTone(kind: TabataPhaseKind): {
  chip: string
  ring: string
  bar: string
} {
  switch (kind) {
    case 'preparacion':
      return {
        chip: 'bg-bloomora-lavender-50 text-bloomora-violet ring-bloomora-lilac/40',
        ring: 'text-bloomora-lilac',
        bar: 'bg-bloomora-lilac',
      }
    case 'trabajo':
      return {
        chip: 'bg-bloomora-blush text-bloomora-rose-deep ring-bloomora-rose/50',
        ring: 'text-bloomora-rose-deep',
        bar: 'bg-bloomora-rose-deep',
      }
    case 'descanso':
      return {
        chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
        ring: 'text-emerald-500',
        bar: 'bg-emerald-500',
      }
    case 'descanso_series':
      return {
        chip: 'bg-bloomora-lavender-100 text-bloomora-deep ring-bloomora-violet/30',
        ring: 'text-bloomora-violet',
        bar: 'bg-bloomora-violet',
      }
    case 'enfriamiento':
      return {
        chip: 'bg-bloomora-sky/50 text-bloomora-deep ring-bloomora-sky-deep/40',
        ring: 'text-bloomora-sky-deep',
        bar: 'bg-bloomora-sky-deep',
      }
    case 'fin':
      return {
        chip: 'bg-bloomora-mist text-bloomora-violet ring-bloomora-line/40',
        ring: 'text-bloomora-lilac',
        bar: 'bg-bloomora-lilac',
      }
  }
}

export const TABATA_MOBILE_TIP_KEY = 'bloomora:tabata-mobile-tip-dismissed'
