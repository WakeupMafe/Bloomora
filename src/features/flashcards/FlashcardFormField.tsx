import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const flashcardControlClass =
  'bloomora-form-input w-full min-h-11 rounded-pill border border-bloomora-line/50 px-4 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2'

export const flashcardSelectClass = cn(
  flashcardControlClass,
  'bg-bloomora-white',
)

type FlashcardFormFieldProps = {
  label: ReactNode
  hint?: string
  children: ReactNode
  className?: string
  htmlFor?: string
}

/** Label y control alineados (mismo ancho, espacio fijo entre título y casilla). */
export function FlashcardFormField({
  label,
  hint,
  children,
  className,
  htmlFor,
}: FlashcardFormFieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold leading-snug text-bloomora-deep"
      >
        {label}
      </label>
      {hint ? (
        <p className="mt-0.5 block text-xs leading-snug text-bloomora-text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5 min-w-0">{children}</div>
    </div>
  )
}
