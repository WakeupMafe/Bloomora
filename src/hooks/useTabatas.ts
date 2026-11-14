import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  configsEqual,
  DEFAULT_TABATA_CONFIG,
  type Tabata,
  type TabataConfig,
} from '@/features/tabata/tabataTypes'
import { fetchProfileByCedula } from '@/services/supabase/profilesRepo'
import { getSupabaseBrowserClient } from '@/services/supabase/client'

export type TabataDuplicateError = {
  code: 'CONFIG_DUPLICADA'
  nombre: string
}

export type TabataNameError = {
  code: 'NOMBRE_DUPLICADO'
}

function isTabataRow(value: unknown): value is Tabata {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.nombre === 'string' &&
    typeof o.preparacion === 'number' &&
    typeof o.trabajo === 'number' &&
    typeof o.descanso === 'number' &&
    typeof o.intervalos === 'number' &&
    typeof o.series === 'number' &&
    typeof o.descanso_series === 'number' &&
    typeof o.enfriamiento === 'number'
  )
}

export function parseTabatas(raw: unknown): Tabata[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isTabataRow)
}

function rpcErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message?: unknown }).message ?? '')
  }
  if (err instanceof Error) return err.message
  return String(err ?? '')
}

export function parseTabataRpcError(
  err: unknown,
): TabataDuplicateError | TabataNameError | { code: 'OTHER'; message: string } {
  const msg = rpcErrorMessage(err)
  if (/NOMBRE_DUPLICADO/i.test(msg)) {
    return { code: 'NOMBRE_DUPLICADO' }
  }
  const dup = msg.match(/CONFIG_DUPLICADA:([^\s]+(?:\s+[^\s]+)*)/i)
  if (dup) {
    return { code: 'CONFIG_DUPLICADA', nombre: dup[1].trim() }
  }
  // PostgREST a veces pone el detalle en otra forma
  const alt = msg.match(/CONFIG_DUPLICADA[:\s]+(.+)/i)
  if (alt) {
    return { code: 'CONFIG_DUPLICADA', nombre: alt[1].trim().replace(/^"|"$/g, '') }
  }
  return { code: 'OTHER', message: msg || 'No se pudo guardar el Tabata.' }
}

function tabatasQueryKey(cedula: string | null) {
  return ['bloomora', 'tabatas', cedula] as const
}

export function useTabatas() {
  const { cedula } = useUserPhone()
  const qc = useQueryClient()
  const [nameError, setNameError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: tabatasQueryKey(cedula),
    enabled: !!cedula,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient()
      if (!sb || !cedula) return [] as Tabata[]
      const profile = await fetchProfileByCedula(sb, cedula)
      return parseTabatas(profile?.tabatas)
    },
  })

  const tabatas = query.data ?? []

  const buscarDuplicado = useCallback(
    (config: TabataConfig, exceptId?: string): Tabata | null => {
      return (
        tabatas.find(
          (t) =>
            t.id !== exceptId &&
            configsEqual(t, config),
        ) ?? null
      )
    },
    [tabatas],
  )

  const nombreExiste = useCallback(
    (nombre: string, exceptId?: string): boolean => {
      const key = nombre.trim().toLowerCase()
      if (!key) return false
      return tabatas.some(
        (t) => t.id !== exceptId && t.nombre.trim().toLowerCase() === key,
      )
    },
    [tabatas],
  )

  const upsertMutation = useMutation({
    mutationFn: async ({
      tabata,
      permitirDuplicado = false,
    }: {
      tabata: Tabata
      permitirDuplicado?: boolean
    }) => {
      const sb = getSupabaseBrowserClient()
      if (!sb || !cedula) throw new Error('Sin sesión o Supabase.')
      const { data, error } = await sb.rpc('tabata_upsert', {
        p_cedula: cedula,
        p_tabata: tabata,
        p_permitir_duplicado: permitirDuplicado,
      })
      if (error) throw error
      return parseTabatas(data)
    },
    onMutate: async ({ tabata }) => {
      setNameError(null)
      await qc.cancelQueries({ queryKey: tabatasQueryKey(cedula) })
      const prev = qc.getQueryData<Tabata[]>(tabatasQueryKey(cedula))
      qc.setQueryData<Tabata[]>(tabatasQueryKey(cedula), (current) => {
        const list = current ?? []
        const idx = list.findIndex((t) => t.id === tabata.id)
        if (idx < 0) return [...list, tabata]
        const next = list.slice()
        next[idx] = tabata
        return next
      })
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(tabatasQueryKey(cedula), ctx.prev)
      }
      const parsed = parseTabataRpcError(err)
      if (parsed.code === 'NOMBRE_DUPLICADO') {
        setNameError('Ya tienes un Tabata con ese nombre.')
      }
    },
    onSuccess: (lista) => {
      setNameError(null)
      qc.setQueryData(tabatasQueryKey(cedula), lista)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const sb = getSupabaseBrowserClient()
      if (!sb || !cedula) throw new Error('Sin sesión o Supabase.')
      const { data, error } = await sb.rpc('tabata_delete', {
        p_cedula: cedula,
        p_id: id,
      })
      if (error) throw error
      return parseTabatas(data)
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: tabatasQueryKey(cedula) })
      const prev = qc.getQueryData<Tabata[]>(tabatasQueryKey(cedula))
      qc.setQueryData<Tabata[]>(tabatasQueryKey(cedula), (current) =>
        (current ?? []).filter((t) => t.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(tabatasQueryKey(cedula), ctx.prev)
    },
    onSuccess: (lista) => {
      qc.setQueryData(tabatasQueryKey(cedula), lista)
    },
  })

  const crear = useCallback(
    async (
      input: { nombre: string } & TabataConfig,
      opts?: { permitirDuplicado?: boolean },
    ) => {
      const now = new Date().toISOString()
      const tabata: Tabata = {
        id: crypto.randomUUID(),
        nombre: input.nombre.trim(),
        preparacion: input.preparacion,
        trabajo: input.trabajo,
        descanso: input.descanso,
        intervalos: input.intervalos,
        series: input.series,
        descanso_series: input.descanso_series,
        enfriamiento: input.enfriamiento,
        created_at: now,
        updated_at: now,
      }
      return upsertMutation.mutateAsync({
        tabata,
        permitirDuplicado: opts?.permitirDuplicado,
      })
    },
    [upsertMutation],
  )

  const actualizar = useCallback(
    async (tabata: Tabata, opts?: { permitirDuplicado?: boolean }) => {
      const next: Tabata = {
        ...tabata,
        nombre: tabata.nombre.trim(),
        updated_at: new Date().toISOString(),
      }
      return upsertMutation.mutateAsync({
        tabata: next,
        permitirDuplicado: opts?.permitirDuplicado,
      })
    },
    [upsertMutation],
  )

  const duplicar = useCallback(
    async (source: Tabata) => {
      const base = `${source.nombre.trim()} (copia)`
      let nombre = base
      let n = 2
      while (nombreExiste(nombre)) {
        nombre = `${base} ${n}`
        n += 1
      }
      return crear({
        nombre,
        preparacion: source.preparacion,
        trabajo: source.trabajo,
        descanso: source.descanso,
        intervalos: source.intervalos,
        series: source.series,
        descanso_series: source.descanso_series,
        enfriamiento: source.enfriamiento,
      }, { permitirDuplicado: true })
    },
    [crear, nombreExiste],
  )

  const eliminar = useCallback(
    async (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  )

  const defaults = useMemo(() => DEFAULT_TABATA_CONFIG, [])

  return {
    tabatas,
    isLoading: query.isLoading,
    isError: query.isError,
    nameError,
    clearNameError: () => setNameError(null),
    defaults,
    buscarDuplicado,
    nombreExiste,
    crear,
    actualizar,
    duplicar,
    eliminar,
    parseRpcError: parseTabataRpcError,
    isSaving: upsertMutation.isPending || deleteMutation.isPending,
  }
}
