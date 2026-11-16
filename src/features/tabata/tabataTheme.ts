import type { TabataPhaseKind } from '@/features/tabata/tabataTypes'

/** Colores por fase → tokens Tabata (--tabata-phase-*). Usar con style/stroke, no clases Tailwind dinámicas. */
export function phaseTone(kind: TabataPhaseKind): { accent: string } {
  switch (kind) {
    case 'preparacion':
      return { accent: 'var(--tabata-phase-prep)' }
    case 'trabajo':
      return { accent: 'var(--tabata-phase-work)' }
    case 'descanso':
      return { accent: 'var(--tabata-phase-rest)' }
    case 'descanso_series':
      return { accent: 'var(--tabata-phase-set-rest)' }
    case 'enfriamiento':
      return { accent: 'var(--tabata-phase-block-rest)' }
    case 'fin':
      return { accent: 'var(--color-bloomora-lilac)' }
  }
}

export const TABATA_MOBILE_TIP_KEY = 'bloomora:tabata-mobile-tip-dismissed'
