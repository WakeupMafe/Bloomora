import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { isValidCedula } from '@/lib/cedula'
import { isValidPhone, normalizePhone } from '@/lib/userPhone'
import { findProfileForQuickEntry } from '@/services/supabase/profilesRepo'
import { getSupabaseBrowserClient } from '@/services/supabase/client'

const fieldClass =
  'mt-1.5 w-full rounded-full border border-bloomora-line/50 bg-bloomora-white px-4 py-3 text-base font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2'

export function QuickEntryPage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { setSession, phone } = useUserPhone()
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const digits = normalizePhone(raw)

  useEffect(() => {
    if (phone) navigate('/app', { replace: true })
  }, [phone, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const d = digits
    if (!d) {
      setError('Escribe tu cédula o tu número de celular.')
      return
    }
    if (!isValidPhone(d) && !isValidCedula(d)) {
      setError(
        'Usa un celular (10 a 15 dígitos) o una cédula (6 a 12 dígitos), solo números.',
      )
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setError(
        'Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local).',
      )
      return
    }

    setLoading(true)
    try {
      const profile = await findProfileForQuickEntry(sb, raw)
      if (!profile) {
        setError(
          'No encontramos ese dato. Revisa cédula o celular, o crea tu cuenta en Registrarme.',
        )
        return
      }
      showToast('¡Bienvenida!')
      setSession(profile.numero_celular, profile.cedula)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo conectar con Supabase.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (phone) return null

  return (
    <div className="app-shell-padding app-content-fluid mx-auto flex min-h-dvh flex-col justify-center gap-8 bg-bloomora-snow">
      <BloomoraLogo size="md" className="mx-auto" />
      <div className="app-principal-card bg-white/90 shadow-[0_10px_40px_-12px_rgba(91,74,140,0.12)] ring-1 ring-bloomora-line/25">
        <div className="mb-4 flex justify-start">
          <BackButton to="/" />
        </div>
        <h1 className="app-fluid-title text-center font-bold text-bloomora-deep">
          Ingresar
        </h1>
        <p className="mt-2 text-center text-sm text-bloomora-text-muted">
          Escribe la <span className="font-semibold text-bloomora-deep/90">cédula</span>{' '}
          o el <span className="font-semibold text-bloomora-deep/90">celular</span> con el
          que te registraste.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-bloomora-text-muted">
            Cédula o celular (solo números)
            <input
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Ej. 1234567890 o 3001234567"
              className={fieldClass}
            />
          </label>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Continuar'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-bloomora-text-muted">
          ¿Primera vez aquí?{' '}
          <Link
            to="/phone"
            className="font-semibold text-bloomora-violet underline-offset-2 hover:underline"
          >
            Registrarme
          </Link>
        </p>
      </div>
    </div>
  )
}
