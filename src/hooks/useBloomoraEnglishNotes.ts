import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isDraftNoteId } from '@/features/notes/noteDraftUtils'
import {
  deleteEnglishNote,
  getEnglishNoteById,
  insertEnglishNote,
  listEnglishNotes,
  purgeExpiredTrashedEnglishNotes,
  restoreEnglishNote,
  rowToEnglishNote,
  rowToEnglishNoteListItem,
  softDeleteEnglishNote,
  updateEnglishNote,
} from '@/services/supabase/englishNotesRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'
import type {
  EnglishNote,
  EnglishNoteInput,
  EnglishNotePatch,
  EnglishNotesListScope,
} from '@/types/englishNote'

const QUERY_KEY = 'english-notes'
const DETAIL_KEY = 'english-note-detail'

export function useBloomoraEnglishNotes(
  cedula: string | null,
  scope: EnglishNotesListScope = 'active',
) {
  return useQuery({
    queryKey: [QUERY_KEY, cedula, scope],
    enabled: !!cedula,
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<EnglishNote[]> => {
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula!)
      if (scope === 'trash') {
        try {
          await purgeExpiredTrashedEnglishNotes(sb, cedula!)
        } catch {
          /* purge best-effort; listing still proceeds */
        }
      }
      const rows = await listEnglishNotes(sb, cedula!, scope)
      return rows.map(rowToEnglishNoteListItem)
    },
  })
}

/** Carga el HTML completo solo del apunte activo (más rápido que traer todos con imágenes). */
export function useEnglishNoteDetail(cedula: string | null, noteId: string | null) {
  return useQuery({
    queryKey: [DETAIL_KEY, cedula, noteId],
    enabled: !!cedula && !!noteId && !isDraftNoteId(noteId),
    staleTime: 60_000,
    queryFn: async (): Promise<EnglishNote> => {
      const sb = requireSupabase()
      const id = Number(noteId)
      if (!Number.isFinite(id)) throw new Error('Apunte no válido')
      const row = await getEnglishNoteById(sb, cedula!, id)
      return rowToEnglishNote(row)
    },
  })
}

export function useEnglishNoteMutations(cedula: string | null) {
  const qc = useQueryClient()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: [QUERY_KEY, cedula] })
    void qc.invalidateQueries({ queryKey: [DETAIL_KEY, cedula] })
  }

  const insertMut = useMutation({
    mutationFn: async (input?: Partial<EnglishNoteInput>) => {
      if (!cedula) throw new Error('Sin sesión')
      return insertEnglishNote(requireSupabase(), cedula, input)
    },
    onSuccess: invalidate,
  })

  const updateMut = useMutation({
    mutationFn: async ({
      noteId,
      patch,
    }: {
      noteId: string
      patch: EnglishNotePatch
    }) => {
      if (!cedula) throw new Error('Sin sesión')
      const id = Number(noteId)
      if (!Number.isFinite(id)) throw new Error('Apunte no válido')
      await updateEnglishNote(requireSupabase(), id, cedula, patch)
    },
    onSuccess: (_data, variables) => {
      invalidate()
      void qc.invalidateQueries({
        queryKey: [DETAIL_KEY, cedula, variables.noteId],
      })
    },
  })

  const softDeleteMut = useMutation({
    mutationFn: async (noteId: string) => {
      if (!cedula) throw new Error('Sin sesión')
      const id = Number(noteId)
      if (!Number.isFinite(id)) throw new Error('Apunte no válido')
      await softDeleteEnglishNote(requireSupabase(), id, cedula)
    },
    onSuccess: invalidate,
  })

  const restoreMut = useMutation({
    mutationFn: async (noteId: string) => {
      if (!cedula) throw new Error('Sin sesión')
      const id = Number(noteId)
      if (!Number.isFinite(id)) throw new Error('Apunte no válido')
      await restoreEnglishNote(requireSupabase(), id, cedula)
    },
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: async (noteId: string) => {
      if (!cedula) throw new Error('Sin sesión')
      const id = Number(noteId)
      if (!Number.isFinite(id)) throw new Error('Apunte no válido')
      await deleteEnglishNote(requireSupabase(), id, cedula)
    },
    onSuccess: invalidate,
  })

  return { insertMut, updateMut, softDeleteMut, restoreMut, deleteMut }
}
