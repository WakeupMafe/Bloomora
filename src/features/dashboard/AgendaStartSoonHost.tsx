import { useEffect, useMemo, useState } from 'react'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useAgendaStartSoonAlerts } from '@/hooks/useAgendaStartSoonAlerts'
import { useBloomoraAgenda } from '@/hooks/useBloomoraAgenda'
import { useBloomoraProfile } from '@/hooks/useBloomoraProfile'
import { formatMinutes12h, toDateKeyLocal } from '@/utils/agendaTime'

const AUTO_DISMISS_MS = 11_000

export function AgendaStartSoonHost() {
  const { cedula, phone } = useUserPhone()
  const { data: profile } = useBloomoraProfile(phone)
  const notifyOn = profile == null || profile.notify_agenda_block_end !== false

  const [todayKey, setTodayKey] = useState(() => toDateKeyLocal(new Date()))
  useEffect(() => {
    const sync = () => setTodayKey(toDateKeyLocal(new Date()))
    sync()
    const id = window.setInterval(sync, 20_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const { data: tasks = [] } = useBloomoraAgenda(cedula, todayKey)
  const { prompt, dismiss } = useAgendaStartSoonAlerts(todayKey, tasks, {
    enabled: notifyOn && !!cedula,
  })

  const [progressKey, setProgressKey] = useState(0)
  useEffect(() => {
    if (!prompt) return
    setProgressKey((k) => k + 1)
    const id = window.setTimeout(() => dismiss(), AUTO_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [prompt, dismiss])

  const label = useMemo(() => {
    if (!prompt) return ''
    return `En 2 minutos empieza «${prompt.title}» · ${formatMinutes12h(prompt.startMin)}`
  }, [prompt])

  if (!prompt) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[280]">
      {/* Móvil / tablet: fondo suave; clic cierra */}
      <button
        type="button"
        aria-label="Cerrar aviso"
        className="pointer-events-auto absolute inset-0 bg-bloomora-deep/25 max-[1023px]:block min-[1024px]:hidden"
        onClick={dismiss}
      />

      <div
        role="status"
        aria-live="polite"
        className={[
          'pointer-events-auto absolute w-[min(100%-2rem,24rem)] font-sans',
          'max-[1023px]:left-1/2 max-[1023px]:top-1/2 max-[1023px]:-translate-x-1/2 max-[1023px]:-translate-y-1/2',
          'min-[1024px]:left-4 min-[1024px]:top-[calc(4rem+0.75rem)] min-[1024px]:max-w-sm min-[1024px]:translate-x-0 min-[1024px]:translate-y-0',
        ].join(' ')}
      >
        <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--bloomora-border)] bg-bloomora-white px-4 pb-3.5 pt-3.5 shadow-[0_12px_32px_rgba(74,52,88,0.16)]">
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 text-[0.9375rem] font-semibold leading-snug text-bloomora-deep">
              {label}
            </p>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={dismiss}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill border border-[color:var(--bloomora-border)] bg-bloomora-mist text-bloomora-violet transition hover:bg-[color:var(--bloomora-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
                className="size-3.5"
              >
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div
            key={progressKey}
            className="mt-3 h-1 overflow-hidden rounded-full bg-[color:var(--bloomora-surface-2)]"
          >
            <div
              className="h-full origin-left rounded-full bg-gradient-to-r from-bloomora-lilac to-bloomora-rose"
              style={{
                animation: `agenda-start-soon-progress ${AUTO_DISMISS_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes agenda-start-soon-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  )
}
