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
        'grid grid-cols-3 gap-0 overflow-hidden rounded-2xl ring-1',
        boxClassName,
        className,
      )}
    >
      {items.map(({ label, value }, i) => (
        <div
          key={label}
          className={cn(
            'flex flex-col items-center px-2 py-3 text-center',
            i > 0 && 'border-l border-white/50',
          )}
        >
          <span className="text-[10px] font-bold tracking-wider text-[#a78bfa]">
            {label}
          </span>
          <span
            className={cn(
              'mt-1 w-full truncate text-sm font-bold sm:text-base',
              valueClassName ?? 'text-[#5b21b6]',
            )}
          >
            {value ? capitalizeFirstLetter(value) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}
