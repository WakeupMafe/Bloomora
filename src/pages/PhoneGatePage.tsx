import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner'
import { BunnyPassword } from '@/components/auth/BunnyPassword'
import { RegisterShell } from '@/components/auth/RegisterShell'
import { BloomyPose } from '@/components/brand/BloomyPose'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { presentAuthError } from '@/lib/authErrorUi'
import { isValidCedula, normalizeCedula } from '@/lib/cedula'
import { isValidPhone, normalizePhone } from '@/lib/userPhone'
import {
  PROFILE_PASSWORD_MIN_LENGTH,
  ensureProfile,
  fetchProfile,
  setProfilePassword,
  type FormattedAuthError,
} from '@/services/supabase/profilesRepo'
import { getSupabaseBrowserClient } from '@/services/supabase/client'
import iconCheck from '@/assets/svg/icon_check.svg'
import iconId from '@/assets/svg/icon_id.svg'
import iconPhone from '@/assets/svg/icon_phone.svg'
import confetti from '@/assets/svg/confetti.svg'
import '@/styles/auth-flow.css'

/**
 * Registro multi-paso (Fase A).
 * OTP SMS omitido: la auth real usa set_profile_password (cédula + celular + contraseña).
 * Pasos: bienvenida → nombre → cédula/celular → contraseña → éxito.
 */
type Step = 'welcome' | 'name' | 'contact' | 'password' | 'success'

const TOTAL_STEPS = 3

export function PhoneGatePage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { alert } = useBloomoraAlert()
  const { setSession, phone } = useUserPhone()

  const [step, setStep] = useState<Step>('welcome')
  const [fullName, setFullName] = useState('')
  const [cedulaRaw, setCedulaRaw] = useState('')
  const [phoneRaw, setPhoneRaw] = useState('')
  const [contactTab, setContactTab] = useState<'phone' | 'cedula'>('phone')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<FormattedAuthError | null>(null)
  const [loading, setLoading] = useState(false)

  const cedulaDigits = normalizeCedula(cedulaRaw)
  const phoneDigits = normalizePhone(phoneRaw)
  const nameOk = fullName.trim().length >= 2
  const contactOk = isValidCedula(cedulaDigits) && isValidPhone(phoneDigits)
  const passwordRules = useMemo(
    () => ({
      length: password.length >= PROFILE_PASSWORD_MIN_LENGTH,
      number: /\d/.test(password),
      upper: /[A-ZÁÉÍÓÚÑ]/.test(password),
    }),
    [password],
  )
  const passwordOk =
    passwordRules.length &&
    password === passwordConfirm &&
    passwordConfirm.length > 0

  useEffect(() => {
    if (phone && step !== 'success') navigate('/app', { replace: true })
  }, [phone, navigate, step])

  const setUserError = (message: string) => {
    setError({ message, isSystem: false, fullText: message })
  }

  const progressStep =
    step === 'name' ? 1 : step === 'contact' ? 2 : step === 'password' ? 3 : undefined

  const goBack = () => {
    setError(null)
    if (step === 'name') setStep('welcome')
    else if (step === 'contact') setStep('name')
    else if (step === 'password') setStep('contact')
  }

  const submitRegistration = async () => {
    setError(null)
    if (!nameOk) {
      setUserError('Escribe tu nombre (al menos 2 letras).')
      return
    }
    if (!isValidCedula(cedulaDigits)) {
      setUserError(
        'Ingresa una cédula válida (solo números, entre 6 y 12 dígitos).',
      )
      return
    }
    if (!isValidPhone(phoneDigits)) {
      setUserError('Ingresa un celular válido (solo números, mínimo 10).')
      return
    }
    if (password.length < PROFILE_PASSWORD_MIN_LENGTH) {
      setUserError(
        `La contraseña debe tener al menos ${PROFILE_PASSWORD_MIN_LENGTH} caracteres.`,
      )
      return
    }
    if (password !== passwordConfirm) {
      setUserError('Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.')
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
      const already = await fetchProfile(sb, phoneDigits)
      if (already) {
        if (already.password_hash) {
          setUserError(
            'Ya tienes cuenta. Entra desde Ingresar con tu cédula o celular y contraseña.',
          )
          return
        }
        try {
          await setProfilePassword(sb, already.cedula, password)
        } catch (pwdErr) {
          presentAuthError(pwdErr, { setError, showToast, alert })
          return
        }
        setSession(phoneDigits, already.cedula)
        setStep('success')
        return
      }

      const created = await ensureProfile(sb, phoneDigits, {
        full_name: fullName.trim(),
        cedula: cedulaDigits,
      })
      try {
        await setProfilePassword(sb, created.cedula, password)
      } catch (pwdErr) {
        presentAuthError(pwdErr, { setError, showToast, alert })
        return
      }
      setSession(phoneDigits, created.cedula)
      setStep('success')
    } catch (err) {
      presentAuthError(err, { setError, showToast, alert })
    } finally {
      setLoading(false)
    }
  }

  if (phone && step !== 'success') return null

  const firstName = fullName.trim().split(/\s+/)[0] || 'tú'

  if (step === 'welcome') {
    return (
      <RegisterShell
        backTo="/"
        footer={
          <>
            <button
              type="button"
              className="auth-flow__btn auth-flow__btn--pri"
              onClick={() => setStep('name')}
            >
              Empezar
            </button>
            <Link to="/entrar" className="auth-flow__btn auth-flow__btn--ghost">
              ¿Ya tienes cuenta? <b>Entrar</b>
            </Link>
          </>
        }
      >
        <div className="flex flex-1 flex-col items-center justify-center py-4">
          <BloomyPose pose="wave" sizePx={220} priority />
          <h1 className="auth-flow__title mt-2">¡Hola! Soy Bloomy</h1>
          <p className="auth-flow__sub">
            Te ayudo a crear tu cuenta.
            <br />
            Solo toma 1 minuto.
          </p>
        </div>
      </RegisterShell>
    )
  }

  if (step === 'success') {
    return (
      <RegisterShell
        hideTopbar
        footer={
          <button
            type="button"
            className="auth-flow__btn auth-flow__btn--pri"
            onClick={() => navigate('/app', { replace: true })}
          >
            Ir a mi día
          </button>
        }
      >
        <div className="relative flex flex-1 flex-col items-center justify-center py-6">
          <img
            src={confetti}
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-6 left-1/2 w-80 max-w-[90%] -translate-x-1/2 opacity-90"
          />
          <BloomyPose pose="celebrate" sizePx={240} priority />
          <h1 className="auth-flow__title mt-2" style={{ fontSize: '1.875rem' }}>
            ¡Te damos la bienvenida, {firstName}!
          </h1>
          <p className="auth-flow__sub">
            Tu cuenta está lista.
            <br />
            Hoy empieza algo bonito 🌷
          </p>
        </div>
      </RegisterShell>
    )
  }

  return (
    <RegisterShell
      step={progressStep}
      totalSteps={TOTAL_STEPS}
      onBack={goBack}
      footer={
        step === 'name' ? (
          <button
            type="button"
            className="auth-flow__btn auth-flow__btn--pri"
            disabled={!nameOk}
            onClick={() => {
              setError(null)
              setStep('contact')
            }}
          >
            Continuar
          </button>
        ) : step === 'contact' ? (
          <button
            type="button"
            className="auth-flow__btn auth-flow__btn--pri"
            disabled={!contactOk}
            onClick={() => {
              setError(null)
              setStep('password')
            }}
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            className="auth-flow__btn auth-flow__btn--pri"
            disabled={!passwordOk || loading}
            onClick={() => void submitRegistration()}
          >
            {loading ? 'Creando…' : 'Crear mi cuenta'}
          </button>
        )
      }
    >
      {step === 'name' ? (
        <div className="flex flex-1 flex-col pb-4">
          <BloomyPose pose="think" sizePx={168} />
          <h1 className="auth-flow__title">¿Cómo te llamas?</h1>
          <p className="auth-flow__sub">Así sabré cómo saludarte cada día.</p>
          <label className="auth-flow__label" htmlFor="reg-name">
            Tu nombre
          </label>
          <div className="auth-flow__field">
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Mafe"
            />
          </div>
          <p className="auth-flow__helper">Puede ser tu nombre o tu apodo.</p>
        </div>
      ) : null}

      {step === 'contact' ? (
        <div className="flex flex-1 flex-col pb-4">
          <BloomyPose pose="phone" sizePx={160} />
          <h1 className="auth-flow__title">¿Cómo quieres entrar?</h1>
          <p className="auth-flow__sub">
            Necesitamos celular y cédula. Las dos identifican tu cuenta.
          </p>
          <div className="auth-flow__seg" role="tablist" aria-label="Campo activo">
            <button
              type="button"
              role="tab"
              aria-selected={contactTab === 'phone'}
              onClick={() => setContactTab('phone')}
            >
              <img src={iconPhone} alt="" width={22} height={22} aria-hidden />
              Celular
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={contactTab === 'cedula'}
              onClick={() => setContactTab('cedula')}
            >
              <img src={iconId} alt="" width={22} height={22} aria-hidden />
              Cédula
            </button>
          </div>

          <label className="auth-flow__label" htmlFor="reg-phone">
            Número de celular
          </label>
          <div className="auth-flow__field">
            <span className="auth-flow__prefix">🇨🇴 +57</span>
            <input
              id="reg-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneRaw}
              onChange={(e) => setPhoneRaw(e.target.value)}
              placeholder="300 123 4567"
              autoFocus={contactTab === 'phone'}
            />
          </div>

          <label className="auth-flow__label" htmlFor="reg-cedula">
            Cédula
          </label>
          <div className="auth-flow__field">
            <input
              id="reg-cedula"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={cedulaRaw}
              onChange={(e) => setCedulaRaw(e.target.value)}
              placeholder="Solo números"
              autoFocus={contactTab === 'cedula'}
            />
          </div>
          <p className="auth-flow__helper">
            Sin código SMS: entras con tu contraseña (Fase A).
          </p>
          <AuthErrorBanner error={error} />
        </div>
      ) : null}

      {step === 'password' ? (
        <div className="flex flex-1 flex-col pb-4">
          <h1 className="auth-flow__title mb-1">Crea tu contraseña</h1>
          <BunnyPassword
            value={password}
            onChange={setPassword}
            id="reg-password"
            autoComplete="new-password"
          />
          <div className="auth-flow__rules" aria-live="polite">
            <Rule ok={passwordRules.length}>
              Mínimo {PROFILE_PASSWORD_MIN_LENGTH} caracteres
            </Rule>
            <Rule ok={passwordRules.number}>Al menos un número</Rule>
            <Rule ok={passwordRules.upper}>Una letra mayúscula</Rule>
          </div>
          <label className="auth-flow__label" htmlFor="reg-password-confirm">
            Confirmar contraseña
          </label>
          <div className="auth-flow__field">
            <input
              id="reg-password-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
            />
          </div>
          <div className="mt-3">
            <AuthErrorBanner error={error} />
          </div>
        </div>
      ) : null}
    </RegisterShell>
  )
}

function Rule({
  ok,
  children,
}: {
  ok: boolean
  children: ReactNode
}) {
  return (
    <div className="auth-flow__rule">
      {ok ? (
        <img src={iconCheck} alt="" width={22} height={22} aria-hidden />
      ) : (
        <span className="auth-flow__rule-dot" aria-hidden />
      )}
      {children}
    </div>
  )
}
