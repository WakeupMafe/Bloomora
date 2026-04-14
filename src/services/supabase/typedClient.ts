import { getSupabaseBrowserClient } from '@/services/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export function requireSupabase(): SupabaseClient {
  const c = getSupabaseBrowserClient()
  if (!c) {
    throw new Error(
      'Supabase no configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local',
    )
  }
  return c
}
