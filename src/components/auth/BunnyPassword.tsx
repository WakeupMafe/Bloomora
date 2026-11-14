import { useEffect, useState } from 'react'
import { BloomyPose } from '@/components/brand/BloomyPose'
import { cn } from '@/utils/cn'
import iconEye from '@/assets/svg/icon_eye.svg'
import iconEyeOff from '@/assets/svg/icon_eye_off.svg'
import bunnyCover from '@/assets/bloomy/bunny_cover_eyes_512.png'
import bunnyPeek from '@/assets/bloomy/bunny_peek_512.png'

type BunnyPasswordProps = {
  value: string
  onChange: (value: string) => void
  id?: string
  label?: string
  autoComplete?: string
  placeholder?: string
  className?: string
  bunnySizePx?: number
  showBunny?: boolean
}

/**
 * Campo contraseña con ojo + Bloomy (cover / peek) según foco y visibilidad.
 */
export function BunnyPassword({
  value,
  onChange,
  id = 'auth-password',
  label = 'Contraseña',
  autoComplete = 'new-password',
  placeholder = 'Tu contraseña',
  className,
  bunnySizePx = 184,
  showBunny = true,
}: BunnyPasswordProps) {
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const a = new Image()
    const b = new Image()
    a.src = bunnyCover
    b.src = bunnyPeek
  }, [])

  const activePose = !focused ? 'wave' : visible ? 'peek' : 'cover'
  const subtitle = !focused
    ? 'Elige una contraseña segura.'
    : visible
      ? 'Bloomy está espiando un poquito 👀'
      : 'Bloomy no está mirando 🙈'

  return (
    <div className={cn('bunny-password', className)}>
      {showBunny ? (
        <div className="bunny-password__stage relative mx-auto mb-3 grid place-items-center">
          <div
            className={cn(
              'bunny-password__layer',
              activePose !== 'peek' ? 'is-on' : 'is-off',
            )}
            aria-hidden={activePose === 'peek'}
          >
            <BloomyPose
              pose={activePose === 'wave' ? 'wave' : 'cover'}
              sizePx={bunnySizePx}
              showSparks={activePose !== 'wave'}
            />
          </div>
          <div
            className={cn(
              'bunny-password__layer bunny-password__layer--abs',
              activePose === 'peek' ? 'is-on' : 'is-off',
            )}
            aria-hidden={activePose !== 'peek'}
          >
            <BloomyPose pose="peek" sizePx={bunnySizePx} />
          </div>
        </div>
      ) : null}

      {showBunny ? (
        <p className="mb-4 text-center text-[17px] font-medium leading-snug text-bloomora-text">
          {subtitle}
        </p>
      ) : null}

      <label
        htmlFor={id}
        className="mb-2 block text-base font-bold text-bloomora-deep"
      >
        {label}
      </label>
      <div
        className={cn(
          'flex h-14 items-center gap-2 rounded-2xl border-2 bg-white px-4',
          focused
            ? 'border-bloomora-rose-deep shadow-[0_0_0_4px_var(--color-bloomora-blush)]'
            : 'border-bloomora-lavender-100',
        )}
      >
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-wide text-bloomora-deep outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-bloomora-text-muted"
        />
        <button
          type="button"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
        >
          <img
            src={visible ? iconEyeOff : iconEye}
            alt=""
            width={24}
            height={24}
            aria-hidden
          />
        </button>
      </div>
    </div>
  )
}
