import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { isValidCedula, normalizeCedula } from '@/lib/cedula'
import { isValidPhone, normalizePhone } from '@/lib/userPhone'
import {
  ensureProfile,
  fetchProfile,
} from '@/services/supabase/profilesRepo'
import { getSupabaseBrowserClient } from '@/services/supabase/client'

const fieldClass =
  'mt-1.5 w-full rounded-full border border-bloomora-line/50 bg-bloomora-white px-4 py-3 text-base font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2'

export function PhoneGatePage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { setSession, phone } = useUserPhone()
  const [fullName, setFullName] = useState('')
  const [cedulaRaw, setCedulaRaw] = useState('')
  const [phoneRaw, setPhoneRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const cedulaDigits = normalizeCedula(cedulaRaw)
  const phoneDigits = normalizePhone(phoneRaw)

  useEffect(() => {
    if (phone) navigate('/app', { replace: true })
  }, [phone, navigate])

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const name = fullName.trim()
    if (name.length < 2) {
      setError('Escribe tu nombre (al menos 2 letras).')
      return
    }
    if (!isValidCedula(cedulaDigits)) {
      setError(
        'Ingresa una cédula válida (solo números, entre 6 y 12 dígitos).',
      )
      return
    }
    if (!isValidPhone(phoneDigits)) {
      setError('Ingresa un celular válido (solo números, mínimo 10).')
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
      const already = await fetchProfile(sb, phoneDigits)
      if (already) {
        showToast('¡Hola de nuevo!')
        setSession(phoneDigits, already.cedula)
        navigate('/app', { replace: true })
        return
      }
      const created = await ensureProfile(sb, phoneDigits, {
        full_name: name,
        cedula: cedulaDigits,
      })
      showToast('¡Tu perfil está listo!')
      setSession(phoneDigits, created.cedula)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con Supabase.',
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
          <BackButton to="/entrar" />
        </div>
        <h1 className="app-fluid-title text-center font-bold text-bloomora-deep">
          Registro
        </h1>
        <p className="mt-2 text-center text-sm text-bloomora-text-muted">
          Datos mínimos para crear tu perfil en la base de datos (sin
          contraseña). Si ya tienes cuenta, entra solo con cédula o celular.
        </p>
        <form onSubmit={handleContinue} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-bloomora-text-muted">
            Nombre completo
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. María Fernanda López"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-semibold text-bloomora-text-muted">
            Cédula (solo números)
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={cedulaRaw}
              onChange={(e) => setCedulaRaw(e.target.value)}
              placeholder="Ej. 1234567890"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-semibold text-bloomora-text-muted">
            Celular (solo números)
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phoneRaw}
              onChange={(e) => setPhoneRaw(e.target.value)}
              placeholder="Ej. 3001234567"
              className={fieldClass}
            />
          </label>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando…' : 'Crear perfil'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-bloomora-text-muted">
          ¿Ya estás registrado?{' '}
          <Link
            to="/entrar"
            className="font-semibold text-bloomora-violet underline-offset-2 hover:underline"
          >
            Ingresar con cédula o celular
          </Link>
        </p>
      </div>
    </div>
  )
}
