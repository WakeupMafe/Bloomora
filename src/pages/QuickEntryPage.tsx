import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner'
import { BunnyPassword } from '@/components/auth/BunnyPassword'
import { RegisterShell } from '@/components/auth/RegisterShell'
import { BloomyPose } from '@/components/brand/BloomyPose'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { presentAuthError } from '@/lib/authErrorUi'
import { isValidCedula } from '@/lib/cedula'
import { isValidPhone, normalizePhone } from '@/lib/userPhone'
import {
  PROFILE_PASSWORD_MIN_LENGTH,
  findProfileForQuickEntry,
  setProfilePassword,
  verifyProfilePassword,
  type FormattedAuthError,
  type ProfileRow,
} from '@/services/supabase/profilesRepo'
import { getSupabaseBrowserClient } from '@/services/supabase/client'
import '@/styles/auth-flow.css'

export function QuickEntryPage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { alert } = useBloomoraAlert()
  const { setSession, phone } = useUserPhone()
  const [raw, setRaw] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [mode, setMode] = useState<'login' | 'createPassword'>('login')
  const [pendingProfile, setPendingProfile] = useState<ProfileRow | null>(null)
  const [error, setError] = useState<FormattedAuthError | null>(null)
  const [loading, setLoading] = useState(false)
  const [idFocused, setIdFocused] = useState(false)

  const digits = normalizePhone(raw)
  const isCreate = mode === 'createPassword'

  useEffect(() => {
    if (phone) navigate('/app', { replace: true })
  }, [phone, navigate])

  const setUserError = (message: string) => {
    setError({ message, isSystem: false, fullText: message })
  }

  const enterWithProfile = (profile: ProfileRow) => {
    showToast('¡Bienvenida!')
    setSession(profile.numero_celular, profile.cedula)
    navigate('/app', { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const d = digits
    if (!d) {
      setUserError('Escribe tu cédula o tu número de celular.')
      return
    }
    if (!isValidPhone(d) && !isValidCedula(d)) {
      setUserError(
        'Usa un celular (10 a 15 dígitos) o una cédula (6 a 12 dígitos), solo números.',
      )
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      presentAuthError(
        new Error(
          'Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).',
        ),
        { setError, showToast, alert },
      )
      return
    }

    setLoading(true)
    try {
      if (mode === 'createPassword') {
        const profile = pendingProfile
        if (!profile) {
          setMode('login')
          setUserError('Vuelve a escribir tu cédula o celular e intenta de nuevo.')
          return
        }
        if (password.length < PROFILE_PASSWORD_MIN_LENGTH) {
          setUserError(
            `La contraseña debe tener al menos ${PROFILE_PASSWORD_MIN_LENGTH} caracteres.`,
          )
          return
        }
        if (password !== passwordConfirm) {
          setUserError(
            'Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.',
          )
          return
        }
        try {
          await setProfilePassword(sb, profile.cedula, password)
        } catch (pwdErr) {
          presentAuthError(pwdErr, { setError, showToast, alert })
          return
        }
        showToast('¡Contraseña creada! Bienvenida.')
        setSession(profile.numero_celular, profile.cedula)
        navigate('/app', { replace: true })
        return
      }

      if (!password) {
        setUserError('Escribe tu contraseña.')
        return
      }

      const profile = await findProfileForQuickEntry(sb, raw)
      if (!profile) {
        setUserError(
          'No hay perfil con ese dato. Revisa cédula o celular, o crea tu cuenta en Registrarme.',
        )
        return
      }

      if (!profile.password_hash) {
        setPendingProfile(profile)
        setMode('createPassword')
        setPassword('')
        setPasswordConfirm('')
        setError(null)
        showToast('Crea una contraseña para tu cuenta (primera vez).')
        return
      }

      let ok = false
      try {
        ok = await verifyProfilePassword(sb, d, password)
      } catch (verifyErr) {
        presentAuthError(verifyErr, { setError, showToast, alert })
        return
      }
      if (!ok) {
        setUserError('Contraseña incorrecta. Inténtalo de nuevo.')
        return
      }
      enterWithProfile(profile)
    } catch (err) {
      presentAuthError(err, { setError, showToast, alert })
    } finally {
      setLoading(false)
    }
  }

  if (phone) return null

  return (
    <RegisterShell
      backTo="/"
      footer={
        <>
          <button
            type="submit"
            form="entrar-form"
            className="auth-flow__btn auth-flow__btn--pri"
            disabled={loading}
          >
            {loading
              ? isCreate
                ? 'Guardando…'
                : 'Entrando…'
              : isCreate
                ? 'Guardar y entrar'
                : 'Entrar'}
          </button>
          {isCreate ? (
            <button
              type="button"
              className="auth-flow__btn auth-flow__btn--ghost"
              onClick={() => {
                setMode('login')
                setPendingProfile(null)
                setPassword('')
                setPasswordConfirm('')
                setError(null)
              }}
            >
              Volver
            </button>
          ) : (
            <Link to="/phone" className="auth-flow__btn auth-flow__btn--ghost">
              ¿Primera vez aquí? <b>Crear cuenta</b>
            </Link>
          )}
        </>
      }
    >
      <form
        id="entrar-form"
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col pb-2"
      >
        {!isCreate ? (
          <>
            <BloomyPose pose="wave" sizePx={140} priority />
            <h1 className="auth-flow__title">¡Qué bueno verte!</h1>
            <p className="auth-flow__sub">Entra con tu celular o cédula.</p>
          </>
        ) : (
          <>
            <h1 className="auth-flow__title">Crear contraseña</h1>
            <p className="auth-flow__sub">
              Tu cuenta aún no tiene contraseña. Elige una (mín.{' '}
              {PROFILE_PASSWORD_MIN_LENGTH} caracteres).
            </p>
          </>
        )}

        <label className="auth-flow__label" htmlFor="entrar-id">
          Celular o cédula
        </label>
        <div
          className={`auth-flow__field ${idFocused ? 'auth-flow__field--focus' : ''}`}
        >
          <input
            id="entrar-id"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            value={raw}
            readOnly={isCreate}
            onFocus={() => setIdFocused(true)}
            onBlur={() => setIdFocused(false)}
            onChange={(e) => {
              setRaw(e.target.value)
              if (isCreate) {
                setMode('login')
                setPendingProfile(null)
                setPasswordConfirm('')
              }
            }}
            placeholder="300 123 4567"
          />
        </div>

        <div className="mt-2">
          <BunnyPassword
            value={password}
            onChange={setPassword}
            id="entrar-password"
            label={
              isCreate
                ? `Nueva contraseña (mín. ${PROFILE_PASSWORD_MIN_LENGTH})`
                : 'Contraseña'
            }
            autoComplete={isCreate ? 'new-password' : 'current-password'}
            bunnySizePx={isCreate ? 160 : 140}
            showBunny={isCreate}
          />
        </div>

        {isCreate ? (
          <>
            <label className="auth-flow__label" htmlFor="entrar-password-confirm">
              Confirmar contraseña
            </label>
            <div className="auth-flow__field">
              <input
                id="entrar-password-confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
              />
            </div>
          </>
        ) : (
          <p className="mt-4 text-right text-base font-bold text-bloomora-deep">
            <span className="underline decoration-2 underline-offset-4 opacity-60">
              ¿La olvidaste?
            </span>
          </p>
        )}

        <div className="mt-3">
          <AuthErrorBanner error={error} />
        </div>
      </form>
    </RegisterShell>
  )
}
