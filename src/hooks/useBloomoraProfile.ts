import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProfile, updateProfile, type ProfileRow } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'

export function useBloomoraProfile(phone: string | null) {
  return useQuery({
    queryKey: ['profile', phone],
    enabled: !!phone,
    queryFn: async () => {
      const sb = requireSupabase()
      const row = await fetchProfile(sb, phone!)
      if (!row) {
        throw new Error(
          'No encontramos tu perfil. Entra con tu cédula o celular (Comenzar) o regístrate.',
        )
      }
      return row
    },
  })
}

export function useUpdateProfileMutation(phone: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          ProfileRow,
          | 'full_name'
          | 'cedula'
          | 'email'
          | 'avatar_url'
          | 'avatar_public_url'
          | 'avatar_storage_path'
          | 'avatar_preset'
          | 'preferred_theme'
          | 'mascot_name'
        >
      >,
    ) => {
      if (!phone) throw new Error('Sin celular')
      await updateProfile(requireSupabase(), phone, patch)
    },
    onSuccess: (_void, patch) => {
      if (!phone) return
      qc.setQueryData(['profile', phone], (prev: ProfileRow | undefined) => {
        if (!prev) return prev
        return {
          ...prev,
          ...patch,
          updated_at: new Date().toISOString(),
        }
      })
    },
  })
}
