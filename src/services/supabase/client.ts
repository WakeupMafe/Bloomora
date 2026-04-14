import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

/**
 * Lazy Supabase browser client. Install `@supabase/supabase-js` when wiring auth (Phase 3).
 * Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !key) return null
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        // Modo simple (celular/cédula): no usamos Supabase Auth. Si quedó un JWT
        // viejo en localStorage, PostgREST devolvía 401 en PATCH aunque RLS esté bien.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }
  return browserClient
}
