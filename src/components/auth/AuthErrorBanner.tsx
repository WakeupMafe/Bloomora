import type { FormattedAuthError } from '@/services/supabase/profilesRepo'

type AuthErrorBannerProps = {
  error: FormattedAuthError | null
}

/** Error de auth: amable; si es de sistema, muestra el detalle técnico en mono. */
export function AuthErrorBanner({ error }: AuthErrorBannerProps) {
  if (!error) return null

  return (
    <div className="space-y-2" role="alert">
      <p className="text-sm font-medium text-red-600">{error.message}</p>
      {error.isSystem && error.technical ? (
        <pre className="overflow-x-auto rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2 font-mono text-[0.7rem] leading-snug text-red-800 whitespace-pre-wrap break-words">
          {error.technical}
        </pre>
      ) : null}
    </div>
  )
}
