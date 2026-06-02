import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import {
  FlashcardFormField,
  flashcardControlClass,
} from '@/features/flashcards/FlashcardFormField'
import { quickFormToInput } from '@/features/flashcards/englishFlashcardFormUtils'
import type { EnglishFlashcardInput } from '@/types/englishFlashcard'

type EnglishFlashcardQuickFormProps = {
  isPending: boolean
  remainingToday: number
  onCancel: () => void
  onSave: (input: EnglishFlashcardInput) => void
}

export function EnglishFlashcardQuickForm({
  isPending,
  remainingToday,
  onCancel,
  onSave,
}: EnglishFlashcardQuickFormProps) {
  const { showToast } = useBloomoraToast()
  const [englishWord, setEnglishWord] = useState('')
  const [spanishMeaning, setSpanishMeaning] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!englishWord.trim() || !spanishMeaning.trim()) {
      showToast('Escribe la palabra en inglés y el significado en español.')
      return
    }
    onSave(quickFormToInput(englishWord, spanishMeaning))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[20px] bg-white/80 p-5 ring-1 ring-bloomora-line/35 shadow-[0_8px_28px_-10px_rgba(91,74,140,0.15)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-bloomora-deep">Modo rápido</h2>
          <p className="mt-1 text-sm text-bloomora-text-muted">
            Solo palabra y significado. Después podrás añadir imagen, ejemplos y categoría.
          </p>
        </div>
        <span className="rounded-full bg-bloomora-lavender-50 px-3 py-1 text-xs font-bold text-bloomora-violet ring-1 ring-bloomora-violet/20">
          {remainingToday} restante{remainingToday === 1 ? '' : 's'} hoy
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FlashcardFormField label="Palabra en inglés *">
          <input
            className={flashcardControlClass}
            value={englishWord}
            onChange={(e) => setEnglishWord(e.target.value)}
            placeholder="e.g. butterfly"
            autoComplete="off"
            autoFocus
          />
        </FlashcardFormField>
        <FlashcardFormField label="Significado en español *">
          <input
            className={flashcardControlClass}
            value={spanishMeaning}
            onChange={(e) => setSpanishMeaning(e.target.value)}
            placeholder="mariposa"
          />
        </FlashcardFormField>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar rápido'}
        </Button>
      </div>
    </form>
  )
}
