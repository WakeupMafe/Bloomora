import {
  capitalizeFirstLetter,
  type VerbForms,
} from '@/features/flashcards/verbFormsCodec'
import { cn } from '@/utils/cn'

const CARD_VERB_LABELS = {
  v1: 'BASE',
  v2: 'PAST',
  v3: 'PARTICIPLE',
} as const

type VerbFormsDisplayProps = {
  forms: VerbForms
  boxClassName?: string
  valueClassName?: string
  className?: string
}

/**
 * Formas verbales en filas (etiqueta + palabra completa).
 * Evita partir palabras en inglés con guiones (incorrecto gramaticalmente).
 */
export function VerbFormsDisplay({
  forms,
  boxClassName,
  valueClassName,
  className,
}: VerbFormsDisplayProps) {
  const items = [
    { label: CARD_VERB_LABELS.v1, value: forms.v1 },
    { label: CARD_VERB_LABELS.v2, value: forms.v2 },
    { label: CARD_VERB_LABELS.v3, value: forms.v3 },
  ]

  return (
    <div
      className={cn(
        'mx-auto w-fit max-w-full rounded-2xl px-3.5 py-1 ring-1 sm:px-4',
        boxClassName,
        className,
      )}
    >
      <div className="flex flex-col divide-y divide-white/50">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="grid grid-cols-[4.75rem_minmax(0,auto)] items-baseline gap-x-2 py-2.5 sm:grid-cols-[5.25rem_minmax(0,auto)] sm:gap-x-2.5 sm:py-3"
          >
            <span className="text-[10px] font-bold tracking-wider text-[#a78bfa]">
              {label}
            </span>
            <span
              className={cn(
                'text-left text-xs font-bold leading-snug sm:text-sm',
                'hyphens-none [overflow-wrap:normal] [word-break:normal]',
                valueClassName ?? 'text-[#5b21b6]',
              )}
            >
              {value ? capitalizeFirstLetter(value) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
