import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import iconBack from '@/assets/svg/icon_back.svg'

type RegisterShellProps = {
  children: ReactNode
  /** Paso actual 1..total (omitir en bienvenida/éxito). */
  step?: number
  totalSteps?: number
  onBack?: () => void
  backTo?: string
  footer?: ReactNode
  className?: string
  /** Sin topbar (éxito). */
  hideTopbar?: boolean
}

/** Shell móvil/tablet del registro Bloomy: topbar + progreso + CTA fijo. */
export function RegisterShell({
  children,
  step,
  totalSteps = 3,
  onBack,
  backTo,
  footer,
  className,
  hideTopbar,
}: RegisterShellProps) {
  const showProgress = typeof step === 'number' && step >= 1

  return (
    <div
      className={cn(
        'auth-flow mx-auto flex min-h-dvh w-full max-w-[640px] flex-col bg-bloomora-snow',
        className,
      )}
    >
      {!hideTopbar ? (
        <div className="flex h-16 shrink-0 items-center gap-4 px-6 min-[600px]:px-12">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-bloomora-line bg-white"
            >
              <img src={iconBack} alt="" width={24} height={24} aria-hidden />
            </button>
          ) : backTo ? (
            <Link
              to={backTo}
              aria-label="Volver"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-bloomora-line bg-white"
            >
              <img src={iconBack} alt="" width={24} height={24} aria-hidden />
            </Link>
          ) : (
            <span className="h-12 w-12 shrink-0" aria-hidden />
          )}

          {showProgress ? (
            <>
              <div
                className="flex flex-1 gap-1.5"
                role="progressbar"
                aria-valuenow={step}
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-label={`Paso ${step} de ${totalSteps}`}
              >
                {Array.from({ length: totalSteps }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-2 flex-1 rounded',
                      i < step
                        ? 'bg-bloomora-rose-deep'
                        : 'bg-bloomora-mist',
                    )}
                  />
                ))}
              </div>
              <span className="min-w-[44px] text-right text-[15px] font-bold text-bloomora-violet">
                {step} de {totalSteps}
              </span>
            </>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-6 min-[600px]:px-12">
        <div className="auth-flow__card mx-auto flex w-full max-w-[560px] flex-1 flex-col min-[600px]:my-4 min-[600px]:rounded-[32px] min-[600px]:bg-white min-[600px]:px-8 min-[600px]:py-6 min-[600px]:shadow-[0_8px_28px_rgba(91,74,140,0.08)]">
          {children}
        </div>
      </div>

      {footer ? (
        <div className="shrink-0 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 min-[600px]:px-12">
          <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
            {footer}
          </div>
        </div>
      ) : null}
    </div>
  )
}
