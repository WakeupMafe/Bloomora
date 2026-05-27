import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { bloomoraInputClass, bloomoraSelectClass } from '@/components/ui/formControls'

export const flashcardControlClass = bloomoraInputClass

export const flashcardSelectClass = bloomoraSelectClass

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
