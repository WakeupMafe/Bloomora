import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  countFlashcardsEnglish,
  deleteFlashcardEnglish,
  insertFlashcardEnglish,
  listFlashcardsEnglish,
  listFlashcardsEnglishPreview,
  updateFlashcardEnglish,
  type FlashcardEnglishRow,
} from '@/services/supabase/flashcardsEnglishRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'
import { resolveVerbForms } from '@/features/flashcards/verbFormsCodec'
import type { EnglishFlashcard, EnglishFlashcardInput } from '@/types/englishFlashcard'

const QUERY_KEY = 'flashcards-english'
const FLASHCARDS_STALE_MS = 5 * 60_000

function rowToFlashcard(r: FlashcardEnglishRow): EnglishFlashcard {
  const category = r.category
  return {
    id: String(r.id),
    englishWord: r.english_word,
    verbForms: resolveVerbForms(r.english_word, category),
    pronunciation: r.pronunciation,
    shortMeaning: r.short_meaning,
    spanishMeaning: r.spanish_meaning,
    exampleEnglish: r.example_english,
    exampleSpanish: r.example_spanish,
    imageUrl: r.image_url,
    category: r.category,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function useBloomoraEnglishFlashcards(cedula: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, cedula],
    enabled: !!cedula,
    staleTime: FLASHCARDS_STALE_MS,
    queryFn: async (): Promise<EnglishFlashcard[]> => {
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula!)
      const rows = await listFlashcardsEnglish(sb, cedula!)
      return rows.map(rowToFlashcard)
    },
  })
}

export type EnglishFlashcardPreview = Pick<
  EnglishFlashcard,
  'id' | 'englishWord' | 'category' | 'imageUrl'
>

export type EnglishFlashcardsDashboardData = {
  count: number
  preview: EnglishFlashcardPreview[]
}

export function useBloomoraEnglishFlashcardsDashboard(
  cedula: string | null,
  previewLimit = 3,
) {
  return useQuery({
    queryKey: [QUERY_KEY, 'dashboard', cedula, previewLimit],
    enabled: !!cedula,
    staleTime: FLASHCARDS_STALE_MS,
    queryFn: async (): Promise<EnglishFlashcardsDashboardData> => {
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula!)
      const [rows, count] = await Promise.all([
        listFlashcardsEnglishPreview(sb, cedula!, previewLimit),
        countFlashcardsEnglish(sb, cedula!),
      ])
      return {
        count,
        preview: rows.map((r) => ({
          id: String(r.id),
          englishWord: r.english_word,
          category: r.category,
          imageUrl: r.image_url,
        })),
      }
    },
  })
}

export function useEnglishFlashcardMutations(cedula: string | null) {
  const qc = useQueryClient()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: [QUERY_KEY, cedula] })
    void qc.invalidateQueries({ queryKey: [QUERY_KEY, 'dashboard', cedula] })
  }

  const insertMut = useMutation({
    mutationFn: async (input: EnglishFlashcardInput) => {
      if (!cedula) throw new Error('Sin sesión')
      return insertFlashcardEnglish(requireSupabase(), cedula, input)
    },
    onSuccess: invalidate,
  })

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: EnglishFlashcardInput
    }) => {
      if (!cedula) throw new Error('Sin sesión')
      await updateFlashcardEnglish(requireSupabase(), Number(id), input)
    },
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (!cedula) throw new Error('Sin sesión')
      await deleteFlashcardEnglish(requireSupabase(), Number(id))
    },
    onSuccess: invalidate,
  })

  return { insertMut, updateMut, deleteMut }
}
