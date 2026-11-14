import type { FormattedAuthError } from '@/services/supabase/profilesRepo'
import { formatAuthUserError } from '@/services/supabase/profilesRepo'

type ToastFn = (message: string, options?: { duration?: number }) => void
type AlertFn = (options: {
  title: string
  description?: string
  confirmLabel?: string
}) => Promise<void>

/**
 * Aplica el formato centralizado y notifica (toast usuario / alert sistema).
 */
export function presentAuthError(
  err: unknown,
  opts: {
    setError: (value: FormattedAuthError | null) => void
    showToast: ToastFn
    alert: AlertFn
  },
): FormattedAuthError {
  const formatted = formatAuthUserError(err)
  opts.setError(formatted)

  if (formatted.isSystem) {
    const parts = [
      'Debes comunicarte con el desarrollador e indicarle este error:',
      formatted.technical,
      formatted.remediation,
    ].filter(Boolean)
    void opts.alert({
      title: 'Algo falló de nuestro lado',
      description: parts.length > 1 ? parts.join('\n\n') : formatted.message,
      confirmLabel: 'Entendido',
    })
  } else {
    opts.showToast(formatted.message, { duration: 6000 })
  }

  return formatted
}
