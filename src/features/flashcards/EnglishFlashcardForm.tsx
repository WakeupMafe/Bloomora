import { type FormEvent, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { uploadFlashcardImage } from '@/services/supabase/flashcardImageUpload'
import { requireSupabase } from '@/services/supabase/typedClient'
import type { EnglishFlashcard } from '@/types/englishFlashcard'
import { FLASHCARD_IMAGE_REQUIRED_MESSAGE } from '@/types/englishFlashcard'
import {
  FLASHCARD_CATEGORY_OPTIONS,
  isGrammarCategory,
  isVerbsCategory,
} from '@/features/flashcards/flashcardCategories'
import {
  FlashcardFormField,
  flashcardControlClass,
  flashcardSelectClass,
} from '@/features/flashcards/FlashcardFormField'
import {
  emptyFlashcardFormState,
  flashcardToFormState,
  formStateToInput,
  isVerbFormValid,
  type FlashcardFormState,
} from '@/features/flashcards/englishFlashcardFormUtils'
import { PinkBoldRichTextArea } from '@/features/flashcards/PinkBoldRichTextArea'
import { VerbFormsFields } from '@/features/flashcards/VerbFormsFields'
import { cn } from '@/utils/cn'

type EnglishFlashcardFormProps = {
  cedula: string
  editing: EnglishFlashcard | null
  isPending: boolean
  onCancel: () => void
  onSave: (input: ReturnType<typeof formStateToInput>) => void
}

export function EnglishFlashcardForm({
  cedula,
  editing,
  isPending,
  onCancel,
  onSave,
}: EnglishFlashcardFormProps) {
  const { showToast } = useBloomoraToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FlashcardFormState>(() =>
    editing ? flashcardToFormState(editing) : emptyFlashcardFormState(),
  )
  const [uploading, setUploading] = useState(false)

  const set = (patch: Partial<FlashcardFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  const hasImage = !!(form.imageUrl.trim() || form.imagePreview)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Elige un archivo de imagen.')
      return
    }
    setUploading(true)
    try {
      const url = await uploadFlashcardImage(requireSupabase(), cedula, file)
      const preview = URL.createObjectURL(file)
      set({ imageUrl: url, imagePreview: preview })
    } catch {
      showToast('No se pudo subir la imagen. Revisa la conexión o el bucket.')
    } finally {
      setUploading(false)
    }
  }

  const isVerb = isVerbsCategory(form.category)
  const isGrammar = isGrammarCategory(form.category)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isVerbFormValid(form) || !form.spanishMeaning.trim()) {
      showToast(
        isVerb
          ? 'Completa las tres formas del verbo y el significado en español.'
          : isGrammar
            ? 'Indica el tema en inglés, en español y la explicación.'
            : 'La palabra en inglés y el significado en español son obligatorios.',
      )
      return
    }
    if (!form.imageUrl.trim()) {
      window.alert(FLASHCARD_IMAGE_REQUIRED_MESSAGE)
      return
    }
    onSave(formStateToInput(form))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[20px] bg-white/80 p-5 ring-1 ring-bloomora-line/35 shadow-[0_8px_28px_-10px_rgba(91,74,140,0.15)] sm:p-6"
    >
      <h2 className="text-lg font-bold text-bloomora-deep">
        {editing ? 'Editar palabra' : 'Nueva flashcard'}
      </h2>
      <p className="mt-1 text-sm text-bloomora-text-muted">
        Asocia cada palabra con una imagen para memorizar mejor.
      </p>

      <FlashcardFormField
        className="mt-5"
        label={
          <>
            Imagen <span className="text-bloomora-violet">*</span>
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className={cn(
              'relative h-32 w-full shrink-0 overflow-hidden rounded-2xl bg-bloomora-lavender-50/70 ring-1 ring-bloomora-line/35 sm:h-28 sm:w-40',
              !hasImage && 'flex items-center justify-center',
            )}
          >
            {form.imagePreview ? (
              <img
                src={form.imagePreview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-3 text-center text-xs font-medium text-bloomora-text-muted">
                Sin imagen aún
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:pt-0.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || isPending}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Subiendo…' : 'Elegir imagen'}
            </Button>
            <p className="text-xs text-bloomora-text-muted">
              Obligatoria para guardar la palabra.
            </p>
          </div>
        </div>
      </FlashcardFormField>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FlashcardFormField className="sm:col-span-2" label="Categoría">
          <select
            className={flashcardSelectClass}
            value={form.category}
            onChange={(e) => set({ category: e.target.value })}
            aria-label="Categoría de la flashcard"
          >
            <option value="">Selecciona una categoría…</option>
            {FLASHCARD_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FlashcardFormField>

        {isGrammar ? (
          <FlashcardFormField
            className="sm:col-span-2"
            label="Explicación del tema *"
            hint="Describe la regla o el uso (se guarda con esta tarjeta de gramática)."
          >
            <PinkBoldRichTextArea
              value={form.shortMeaning}
              onChange={(html) => set({ shortMeaning: html })}
              placeholder="Ej. Se usa para acciones que empezaron en el pasado y siguen en el presente…"
            />
          </FlashcardFormField>
        ) : null}

        {isVerb ? (
          <FlashcardFormField
            className="sm:col-span-2"
            label="Formas del verbo *"
            hint="Presente, pasado y participio (una sola fila en Supabase)."
          >
            <VerbFormsFields
              values={{ v1: form.verbV1, v2: form.verbV2, v3: form.verbV3 }}
              onChange={(patch) =>
                set({
                  ...(patch.v1 !== undefined ? { verbV1: patch.v1 } : {}),
                  ...(patch.v2 !== undefined ? { verbV2: patch.v2 } : {}),
                  ...(patch.v3 !== undefined ? { verbV3: patch.v3 } : {}),
                })
              }
            />
          </FlashcardFormField>
        ) : (
          <FlashcardFormField
            className="sm:col-span-2"
            label={isGrammar ? 'Tema en inglés *' : 'Palabra en inglés *'}
          >
            <input
              className={flashcardControlClass}
              value={form.englishWord}
              onChange={(e) => set({ englishWord: e.target.value })}
              placeholder={isGrammar ? 'e.g. Present Perfect' : 'e.g. butterfly'}
              autoComplete="off"
            />
          </FlashcardFormField>
        )}

        <FlashcardFormField label="Pronunciación">
          <input
            className={flashcardControlClass}
            value={form.pronunciation}
            onChange={(e) => set({ pronunciation: e.target.value })}
            placeholder="/ˈbʌtərflaɪ/"
          />
        </FlashcardFormField>

        {!isGrammar ? (
          <FlashcardFormField label="Pista / significado corto">
            <input
              className={cn(
                flashcardControlClass,
                'text-bloomora-violet placeholder:text-bloomora-violet/40',
              )}
              value={form.shortMeaning}
              onChange={(e) => set({ shortMeaning: e.target.value })}
              placeholder="insecto con alas"
            />
          </FlashcardFormField>
        ) : null}

        <FlashcardFormField
          className={isGrammar ? 'sm:col-span-2' : undefined}
          label={isGrammar ? 'Tema en español *' : 'Significado en español *'}
        >
          <input
            className={flashcardControlClass}
            value={form.spanishMeaning}
            onChange={(e) => set({ spanishMeaning: e.target.value })}
            placeholder={isGrammar ? 'e.g. Presente perfecto' : 'mariposa'}
          />
        </FlashcardFormField>

        <FlashcardFormField label="Ejemplo (inglés)">
          <input
            className={flashcardControlClass}
            value={form.exampleEnglish}
            onChange={(e) => set({ exampleEnglish: e.target.value })}
            placeholder="The butterfly landed on the flower."
          />
        </FlashcardFormField>

        <FlashcardFormField label="Traducción del ejemplo">
          <input
            className={flashcardControlClass}
            value={form.exampleSpanish}
            onChange={(e) => set({ exampleSpanish: e.target.value })}
            placeholder="La mariposa aterrizó en la flor."
          />
        </FlashcardFormField>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={isPending || uploading}>
          {isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear flashcard'}
        </Button>
      </div>
    </form>
  )
}
