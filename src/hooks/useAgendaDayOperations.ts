import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  duplicateAgendaDay,
  purgeAgendaMonth,
} from '@/services/supabase/agendaRepo'
import { requireSupabase } from '@/services/supabase/typedClient'
import {
  addDaysToDateKey,
  previousYearMonthLocal,
  toYearMonthLocal,
} from '@/utils/agendaTime'

const AUTO_PURGE_STORAGE_KEY = 'bloomora:agendaAutoPurgeYm'

function readAutoPurgeMarker(): string | null {
  try {
    return localStorage.getItem(AUTO_PURGE_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeAutoPurgeMarker(yearMonth: string) {
  try {
    localStorage.setItem(AUTO_PURGE_STORAGE_KEY, yearMonth)
  } catch {
    /* ignore quota / private mode */
  }
}

export function useDuplicateAgendaDay(cedula: string | null) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { sourceDate: string; targetDate: string }) => {
      if (!cedula) throw new Error('Sin sesión')
      return duplicateAgendaDay(requireSupabase(), {
        userCedula: cedula,
        sourceDate: vars.sourceDate,
        targetDate: vars.targetDate,
        replaceTarget: true,
      })
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['agenda', cedula, vars.sourceDate] })
      void qc.invalidateQueries({ queryKey: ['agenda', cedula, vars.targetDate] })
      void qc.invalidateQueries({ queryKey: ['agenda-lite', cedula] })
      void qc.invalidateQueries({ queryKey: ['agenda-lite-bulk', cedula] })
    },
  })
}

export function usePurgePreviousAgendaMonth(cedula: string | null) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (yearMonth?: string) => {
      if (!cedula) throw new Error('Sin sesión')
      const ym = yearMonth ?? previousYearMonthLocal()
      const result = await purgeAgendaMonth(requireSupabase(), cedula, ym)
      return { ...result, yearMonth: ym }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda'] })
      void qc.invalidateQueries({ queryKey: ['agenda-lite'] })
      void qc.invalidateQueries({ queryKey: ['agenda-lite-bulk'] })
    },
  })
}

/**
 * Al entrar en un mes nuevo, elimina la agenda del mes anterior (solo tareas del día).
 * Las metas y sus marcas en el tracker no se modifican.
 */
export function useAutoPurgePreviousAgendaMonth(cedula: string | null) {
  const qc = useQueryClient()
  const ranRef = useRef(false)

  useEffect(() => {
    if (!cedula || ranRef.current) return
    const currentYm = toYearMonthLocal(new Date())
    if (readAutoPurgeMarker() === currentYm) return

    ranRef.current = true
    const prevYm = previousYearMonthLocal()
    void purgeAgendaMonth(requireSupabase(), cedula, prevYm)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ['agenda'] })
        void qc.invalidateQueries({ queryKey: ['agenda-lite'] })
        void qc.invalidateQueries({ queryKey: ['agenda-lite-bulk'] })
      })
      .catch(() => {
        /* silencioso: el usuario puede limpiar manualmente */
      })
      .finally(() => writeAutoPurgeMarker(currentYm))
  }, [cedula, qc])
}

export function nextDateKeyFrom(dateKey: string): string {
  return addDaysToDateKey(dateKey, 1)
}
