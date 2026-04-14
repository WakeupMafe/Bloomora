import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import conejoAvatar from '@/assets/ConejoAvatar.png'
import conejoBoy from '@/assets/ConejoBoy.png'
import conejitaGirl from '@/assets/ConejitaGirl.png'
import conejoLofi from '@/assets/ConejoLofi.png'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { DashboardAppHeader } from '@/features/dashboard/DashboardAppHeader'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useBloomoraProfile,
  useUpdateProfileMutation,
} from '@/hooks/useBloomoraProfile'
import { isValidCedula, normalizeCedula } from '@/lib/cedula'
import { cn } from '@/utils/cn'

const THEME_SWATCHES = [
  { id: 'pink', className: 'bg-[#f9a8d4] ring-[#fbcfe8]' },
  { id: 'lavender', className: 'bg-[#d8b4fe] ring-[#e9d5ff]' },
  { id: 'violet', className: 'bg-[#c4b5fd] ring-[#ddd6fe]' },
  { id: 'periwinkle', className: 'bg-[#a5b4fc] ring-[#c7d2fe]' },
  { id: 'sky', className: 'bg-[#7dd3fc] ring-[#bae6fd]' },
  { id: 'mint', className: 'bg-[#86efac] ring-[#bbf7d0]' },
] as const

type ThemeId = (typeof THEME_SWATCHES)[number]['id']

type AvatarOptionId = 'bunny' | 'conejoBoy' | 'conejoLofi' | 'conejitaGirl'

const IMAGE_AVATAR_IDS: AvatarOptionId[] = [
  'bunny',
  'conejoBoy',
  'conejoLofi',
  'conejitaGirl',
]

const AVATAR_OPTIONS: {
  id: AvatarOptionId
  label: string
  image?: string
}[] = [
  { id: 'bunny', label: 'Conejita tulipán', image: conejoAvatar },
  { id: 'conejoBoy', label: 'Conejo boy', image: conejoBoy },
  { id: 'conejoLofi', label: 'Conejo lofi', image: conejoLofi },
  { id: 'conejitaGirl', label: 'Conejita girl', image: conejitaGirl },
]

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" />
    </svg>
  )
}

function themeIdFromProfile(db: string | undefined | null): ThemeId {
  if (!db) return 'pink'
  const hit = THEME_SWATCHES.find((t) => t.id === db)
  return hit ? hit.id : 'pink'
}

function avatarIdFromProfile(preset: string | null | undefined): AvatarOptionId {
  if (preset && IMAGE_AVATAR_IDS.includes(preset as AvatarOptionId))
    return preset as AvatarOptionId
  return 'bunny'
}

export function EditProfilePage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { phone, logoutPhone } = useUserPhone()
  const { data: profile, isLoading } = useBloomoraProfile(phone)
  const updateMut = useUpdateProfileMutation(phone)

  const nameId = useId()
  const cedulaId = useId()
  const emailId = useId()
  const [name, setName] = useState('')
  const [cedula, setCedula] = useState('')
  const [email, setEmail] = useState('')
  const [themeId, setThemeId] = useState<ThemeId>('pink')
  const [avatarId, setAvatarId] = useState<AvatarOptionId>('bunny')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.full_name?.trim() || 'Usuario')
    setCedula(profile.cedula ?? '')
    setEmail(profile.email ?? '')
    setThemeId(themeIdFromProfile(profile.preferred_theme))
    setAvatarId(avatarIdFromProfile(profile.avatar_preset))
  }, [profile])

  const circleSrc =
    AVATAR_OPTIONS.find((opt) => opt.id === avatarId)?.image ?? conejoAvatar

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaveError(null)
    if (!phone) return
    const cedulaDigits = normalizeCedula(cedula)
    if (!isValidCedula(cedulaDigits)) {
      setSaveError('Ingresa una cédula válida (6 a 12 dígitos).')
      return
    }
    const patch: Parameters<typeof updateMut.mutateAsync>[0] = {
      full_name: name.trim() || 'Usuario',
      cedula: cedulaDigits,
      email: email.trim() || null,
      preferred_theme: themeId,
    }
    patch.avatar_url = null
    patch.avatar_public_url = null
    patch.avatar_storage_path = null
    patch.avatar_preset = avatarId

    try {
      await updateMut.mutateAsync(patch)
      showToast('¡Cambios enviados!')
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'No se pudo guardar el perfil.',
      )
    }
  }

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        '¿Cerrar sesión en este dispositivo? Tus datos siguen en Supabase.',
      )
    ) {
      logoutPhone()
      navigate('/entrar')
    }
  }

  return (
    <div className="relative isolate min-h-dvh">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-bloomora-lavender-50/40 via-bloomora-snow to-bloomora-mist/80" />
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-bloomora-rose/15 blur-3xl" />
        <div className="absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-bloomora-lilac/12 blur-3xl" />
      </div>

      <main className="app-shell-padding--dashboard app-content-fluid mx-auto w-full pb-16">
        <DashboardAppHeader firstName={name || undefined} avatarSrc={circleSrc} />

        <article
          className={cn(
            'app-principal-card overflow-hidden shadow-[0_10px_40px_-12px_rgba(91,74,140,0.15)] ring-1 ring-bloomora-line/25',
            'bg-[linear-gradient(165deg,#ffffff_0%,#fdf8ff_38%,#f5f0fc_100%)]',
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="app-fluid-title font-bold tracking-tight text-bloomora-deep">
              Editar Perfil
            </h1>
            <BackButton to="/app" className="shrink-0" />
          </div>

          {isLoading ? (
            <p className="mt-8 text-center text-sm text-bloomora-text-muted">
              Cargando perfil…
            </p>
          ) : (
            <form
              onSubmit={handleSave}
              className="mt-6 flex flex-col gap-8 sm:mt-8"
            >
              <section aria-labelledby="profile-user-heading">
                <h2
                  id="profile-user-heading"
                  className="sr-only text-base font-semibold text-bloomora-deep"
                >
                  Perfil del usuario
                </h2>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                  <div className="mx-auto shrink-0 sm:mx-0">
                    <div className="relative">
                      <div className="h-32 w-32 overflow-hidden rounded-full bg-bloomora-lavender-50 ring-4 ring-white shadow-[0_8px_28px_rgba(124,107,181,0.2)] sm:h-36 sm:w-36">
                        <img
                          src={circleSrc}
                          alt=""
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <label
                        htmlFor={nameId}
                        className="mb-1.5 block text-xs font-semibold text-bloomora-text-muted sm:text-sm"
                      >
                        Nombre
                      </label>
                      <input
                        id={nameId}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className="w-full rounded-full border border-bloomora-line/50 bg-white/95 px-4 py-2.5 text-sm font-medium text-bloomora-deep shadow-inner shadow-white/60 ring-1 ring-bloomora-line/10 transition placeholder:text-bloomora-text-muted/60 focus:border-bloomora-lilac/45 focus:outline-none focus:ring-2 focus:ring-bloomora-lilac/35 sm:py-3 sm:text-[0.9375rem]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={cedulaId}
                        className="mb-1.5 block text-xs font-semibold text-bloomora-text-muted sm:text-sm"
                      >
                        Cédula (solo números)
                      </label>
                      <input
                        id={cedulaId}
                        type="text"
                        inputMode="numeric"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        autoComplete="off"
                        className="w-full rounded-full border border-bloomora-line/50 bg-white/95 px-4 py-2.5 text-sm font-medium text-bloomora-deep shadow-inner shadow-white/60 ring-1 ring-bloomora-line/10 transition placeholder:text-bloomora-text-muted/60 focus:border-bloomora-lilac/45 focus:outline-none focus:ring-2 focus:ring-bloomora-lilac/35 sm:py-3 sm:text-[0.9375rem]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={emailId}
                        className="mb-1.5 block text-xs font-semibold text-bloomora-text-muted sm:text-sm"
                      >
                        Correo electrónico
                      </label>
                      <input
                        id={emailId}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full rounded-full border border-bloomora-line/50 bg-white/95 px-4 py-2.5 text-sm font-medium text-bloomora-deep shadow-inner shadow-white/60 ring-1 ring-bloomora-line/10 transition placeholder:text-bloomora-text-muted/60 focus:border-bloomora-lilac/45 focus:outline-none focus:ring-2 focus:ring-bloomora-lilac/35 sm:py-3 sm:text-[0.9375rem]"
                      />
                    </div>

                    {saveError ? (
                      <p className="text-sm font-medium text-red-600" role="alert">
                        {saveError}
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="order-2 border-bloomora-line/60 text-bloomora-deep hover:bg-bloomora-blush/50 sm:order-1"
                        onClick={() => {
                          setSaveError(null)
                          navigate('/app')
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="order-1 gap-2 sm:order-2"
                        disabled={updateMut.isPending}
                      >
                        <span aria-hidden className="text-base leading-none">
                          💾
                        </span>
                        {updateMut.isPending ? 'Guardando…' : 'Guardar cambios'}
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section
                className="border-t border-bloomora-line/20 pt-8"
                aria-labelledby="profile-custom-heading"
              >
                <h2
                  id="profile-custom-heading"
                  className="text-base font-bold text-bloomora-deep sm:text-lg"
                >
                  Personalización
                </h2>

                <fieldset className="mt-5">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-bloomora-text-muted">
                    Tema
                  </legend>
                  <div
                    className="mt-3 flex flex-wrap gap-3"
                    role="radiogroup"
                    aria-label="Color de tema"
                  >
                    {THEME_SWATCHES.map((t) => {
                      const selected = themeId === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setThemeId(t.id)}
                          className={cn(
                            'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-offset-2 ring-offset-[#fdf8ff] transition hover:scale-105 active:scale-95 sm:h-12 sm:w-12',
                            t.className,
                            selected
                              ? 'ring-bloomora-violet/70'
                              : 'ring-transparent hover:ring-bloomora-line/40',
                          )}
                        >
                          {selected ? (
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-xs font-bold text-bloomora-violet shadow-sm"
                              aria-hidden
                            >
                              ✓
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <fieldset className="mt-8">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-bloomora-text-muted">
                    Avatar
                  </legend>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {AVATAR_OPTIONS.map((opt) => {
                      const selected = avatarId === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          title={opt.label}
                          aria-label={opt.label}
                          aria-pressed={selected}
                          onClick={() => setAvatarId(opt.id)}
                          className={cn(
                            'relative aspect-square w-[3.25rem] overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-[#fdf8ff] transition hover:scale-[1.03] active:scale-95 sm:w-14',
                            selected
                              ? 'ring-bloomora-violet/70 shadow-md'
                              : 'ring-bloomora-line/25 hover:ring-bloomora-lilac/40',
                          )}
                        >
                          <img
                            src={opt.image}
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                          {selected ? (
                            <span
                              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bloomora-violet text-[10px] font-bold text-white shadow-sm"
                              aria-hidden
                            >
                              ✓
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </section>
            </form>
          )}

          <div className="mt-10 border-t border-bloomora-line/15 pt-6">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-2 text-sm font-semibold text-bloomora-violet/90 transition hover:text-red-600"
            >
              <TrashIcon className="text-bloomora-violet/70" />
              Cerrar sesión
            </button>
          </div>
        </article>
      </main>
    </div>
  )
}
