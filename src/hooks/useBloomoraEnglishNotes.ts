import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteEnglishNote,
  insertEnglishNote,
  listEnglishNotes,
  rowToEnglishNote,
  updateEnglishNote,
} from '@/services/supabase/englishNotesRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'
import type { EnglishNote, EnglishNoteInput } from '@/types/englishNote'

const QUERY_KEY = 'english-notes'

export function useBloomoraEnglishNotes(cedula: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, cedula],
    enabled: !!cedula,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<EnglishNote[]> => {
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula!)
      const rows = await listEnglishNotes(sb, cedula!)
      return rows.map(rowToEnglishNote)
    },
  })
}

export function useEnglishNoteMutations(cedula: string | null) {
  const qc = useQueryClient()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: [QUERY_KEY, cedula] })
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
      patch: Partial<EnglishNoteInput>
    }) => {
      if (!cedula) throw new Error('Sin sesión')
      const id = Number(noteId)
      if (!Number.isFinite(id)) throw new Error('Apunte no válido')
      await updateEnglishNote(requireSupabase(), id, cedula, patch)
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

  return { insertMut, updateMut, deleteMut }
}
