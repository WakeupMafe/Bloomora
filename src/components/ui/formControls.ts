import { cn } from '@/utils/cn'

export const bloomoraInputClass =
  'bloomora-form-input w-full min-h-11 rounded-pill border border-bloomora-line/50 px-4 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2'

export const bloomoraSelectClass = cn(bloomoraInputClass, 'bg-bloomora-white')

/** Panel principal reutilizable (apuntes, pomodoro, herramientas). */
export const bloomoraPanelCardClass =
  'app-principal-card rounded-3xl border border-bloomora-line/25 bg-gradient-to-b from-bloomora-white/95 via-bloomora-white/90 to-bloomora-blush/30 shadow-bloomora-card'
