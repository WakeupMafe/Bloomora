import {
  capitalizeFirstLetter,
  VERB_FORM_LABELS,
  type VerbForms,
} from '@/features/flashcards/verbFormsCodec'
import { flashcardControlClass } from '@/features/flashcards/FlashcardFormField'
import { cn } from '@/utils/cn'

type VerbFormsFieldsProps = {
  values: VerbForms
  onChange: (patch: Partial<VerbForms>) => void
}

export function VerbFormsFields({ values, onChange }: VerbFormsFieldsProps) {
  const fields: { key: keyof VerbForms; label: string; placeholder: string }[] = [
    { key: 'v1', label: VERB_FORM_LABELS.v1, placeholder: 'Go' },
    { key: 'v2', label: VERB_FORM_LABELS.v2, placeholder: 'Went' },
    { key: 'v3', label: VERB_FORM_LABELS.v3, placeholder: 'Gone' },
  ]

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key} className="flex min-w-0 flex-col items-stretch gap-1.5">
          <label
            htmlFor={`verb-${key}`}
            className="block text-center text-sm font-semibold leading-snug text-bloomora-deep sm:text-left"
          >
            {label}
          </label>
          <input
            id={`verb-${key}`}
            className={cn(flashcardControlClass, 'text-center sm:text-left')}
            value={values[key]}
            onChange={(e) =>
              onChange({ [key]: capitalizeFirstLetter(e.target.value) })
            }
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>
      ))}
    </div>
  )
}
