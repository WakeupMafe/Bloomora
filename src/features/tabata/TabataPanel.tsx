import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from 'react'
import bunnyCelebratePng from '@/assets/bloomy/bunny_celebrate_512.png'
import bunnyCelebrate1xAvif from '@/assets/bloomy/bunny_celebrate_1x.avif'
import bunnyCelebrate1xWebp from '@/assets/bloomy/bunny_celebrate_1x.webp'
import bunnyCelebrate2xAvif from '@/assets/bloomy/bunny_celebrate_2x.avif'
import bunnyCelebrate2xWebp from '@/assets/bloomy/bunny_celebrate_2x.webp'
import bunnyWavePng from '@/assets/bloomy/bunny_wave_512.png'
import bunnyWave1xAvif from '@/assets/bloomy/bunny_wave_1x.avif'
import bunnyWave1xWebp from '@/assets/bloomy/bunny_wave_1x.webp'
import bunnyWave2xAvif from '@/assets/bloomy/bunny_wave_2x.avif'
import bunnyWave2xWebp from '@/assets/bloomy/bunny_wave_2x.webp'

function BloomyWaveStill({
  heightPx,
  className,
}: {
  heightPx: number
  className?: string
}) {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${bunnyWave1xAvif} 1x, ${bunnyWave2xAvif} 2x`}
      />
      <source
        type="image/webp"
        srcSet={`${bunnyWave1xWebp} 1x, ${bunnyWave2xWebp} 2x`}
      />
      <img
        src={bunnyWavePng}
        alt=""
        width={heightPx}
        height={heightPx}
        loading="lazy"
        decoding="async"
        className={className}
        aria-hidden
      />
    </picture>
  )
}

/** Carga el WebP animado solo cuando el celebrate está montado y no hay reduced-motion. */
function BloomySaltaCelebrate({ sizePx = 200 }: { sizePx?: number }) {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [loadAnim, setLoadAnim] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      setLoadAnim(false)
      return
    }
    // Diferir un tick para no competir con paint del modal/overlay
    const id = window.requestAnimationFrame(() => setLoadAnim(true))
    return () => window.cancelAnimationFrame(id)
  }, [reduceMotion])

  const frameStyle = {
    width: sizePx,
    height: sizePx,
  } as const

  if (reduceMotion || !loadAnim) {
    return (
      <picture>
        <source
          type="image/avif"
          srcSet={`${bunnyCelebrate1xAvif} 1x, ${bunnyCelebrate2xAvif} 2x`}
        />
        <source
          type="image/webp"
          srcSet={`${bunnyCelebrate1xWebp} 1x, ${bunnyCelebrate2xWebp} 2x`}
        />
        <img
          src={bunnyCelebratePng}
          alt="Bloomy celebrando"
          width={sizePx}
          height={sizePx}
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={frameStyle}
        />
      </picture>
    )
  }

  return (
    <picture>
      <source srcSet="/mascota/bloomy_salta.webp" type="image/webp" />
      <img
        src="/mascota/bloomy_salta.gif"
        alt="Bloomy celebrando"
        width={400}
        height={400}
        loading="lazy"
        decoding="async"
        className="object-contain"
        style={frameStyle}
      />
    </picture>
  )
}
import { Button } from '@/components/ui/Button'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import {
  formatMmSs,
  summarizeConfig,
  totalSeconds,
} from '@/features/tabata/tabataPlan'
import { phaseTone, TABATA_MOBILE_TIP_KEY } from '@/features/tabata/tabataTheme'
import {
  DEFAULT_TABATA_CONFIG,
  type Tabata,
  type TabataConfig,
  type TabataPhaseKind,
} from '@/features/tabata/tabataTypes'
import { useTabatas } from '@/hooks/useTabatas'
import type { TabataTimerController } from '@/hooks/useTabataTimer'
import { cn } from '@/utils/cn'

type View =
  | { kind: 'list' }
  | { kind: 'form'; editing: Tabata | null }
  | {
      kind: 'duplicate'
      draft: { nombre: string } & TabataConfig
      editingId: string | null
      existingName: string
    }
  | { kind: 'run' }
  | { kind: 'done' }

type TabataPanelProps = {
  timer: TabataTimerController
  embedded?: boolean
  className?: string
  onRequestClose?: () => void
  onRequestMinimize?: () => void
  showChrome?: boolean
}

function StepperRow({
  label,
  value,
  onChange,
  min = 0,
  step = 5,
  accent,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  step?: number
  accent?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-11 items-center justify-between gap-2 rounded-[18px] px-3 py-1.5 ring-1 ring-[color:var(--bloomora-border)]',
        accent,
      )}
    >
      <span className="text-[0.9375rem] font-semibold text-bloomora-deep">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full bg-bloomora-mist text-lg font-bold text-bloomora-violet transition hover:bg-[color:var(--bloomora-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
          aria-label={`Disminuir ${label}`}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
        <span className="min-w-[3.25rem] text-center text-base font-bold tabular-nums text-bloomora-deep">
          {value}
          <span className="ml-0.5 text-xs font-semibold text-bloomora-text-muted">
            s
          </span>
        </span>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full bg-bloomora-mist text-lg font-bold text-bloomora-violet transition hover:bg-[color:var(--bloomora-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(value + step)}
        >
          +
        </button>
      </div>
    </div>
  )
}

function CountStepper({
  label,
  value,
  onChange,
  min = 1,
  unit,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  unit: string
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-2 rounded-[18px] px-3 py-1.5 ring-1 ring-[color:var(--bloomora-border)]">
      <span className="text-[0.9375rem] font-semibold text-bloomora-deep">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full bg-bloomora-mist text-lg font-bold text-bloomora-violet"
          aria-label={`Disminuir ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <span className="min-w-[3.25rem] text-center text-base font-bold tabular-nums text-bloomora-deep">
          {value}
          <span className="ml-0.5 text-xs font-semibold text-bloomora-text-muted">
            {unit}
          </span>
        </span>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full bg-bloomora-mist text-lg font-bold text-bloomora-violet"
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

function PhaseRing({
  progress,
  remainingSec,
  kind,
  size = 200,
}: {
  progress: number
  remainingSec: number
  kind: TabataPhaseKind
  size?: number
}) {
  const uid = useId().replace(/:/g, '')
  const tone = phaseTone(kind)
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - Math.min(1, Math.max(0, progress)) * c
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className="relative mx-auto grid place-items-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label={`Fase ${kind}, quedan ${remainingSec} segundos`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-bloomora-lavender-50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(tone.ring, !prefersReduced && 'transition-[stroke-dashoffset] duration-200')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-[2.5rem] font-bold leading-none tabular-nums tracking-tight text-bloomora-deep sm:text-[3rem]">
          {String(remainingSec).padStart(2, '0')}
        </p>
        <p className="mt-1 text-sm font-semibold text-bloomora-violet">
          segundos
        </p>
      </div>
      <span className="sr-only" id={`tabata-ring-${uid}`}>
        {remainingSec} segundos
      </span>
    </div>
  )
}

export function TabataPanel({
  timer,
  embedded = false,
  className,
  onRequestClose,
  onRequestMinimize,
  showChrome = false,
}: TabataPanelProps) {
  const { confirm } = useBloomoraAlert()
  const {
    tabatas,
    isLoading,
    nameError,
    clearNameError,
    defaults,
    nombreExiste,
    crear,
    actualizar,
    duplicar,
    eliminar,
    parseRpcError,
    isSaving,
  } = useTabatas()

  const [view, setView] = useState<View>({ kind: 'list' })
  const [menuId, setMenuId] = useState<string | null>(null)
  const [mobileTip, setMobileTip] = useState(() => {
    try {
      return localStorage.getItem(TABATA_MOBILE_TIP_KEY) !== '1'
    } catch {
      return true
    }
  })

  const [nombre, setNombre] = useState('')
  const [config, setConfig] = useState<TabataConfig>(defaults)

  useEffect(() => {
    if (timer.status === 'finished') setView({ kind: 'done' })
    else if (timer.status === 'running' || timer.status === 'paused') {
      setView({ kind: 'run' })
    }
  }, [timer.status])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (view.kind !== 'run') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (timer.status === 'running') timer.pause()
        else if (timer.status === 'paused') void timer.resume()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        timer.skip()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onRequestMinimize?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view.kind, timer, onRequestMinimize])

  const openCreate = () => {
    clearNameError()
    setNombre('')
    setConfig(DEFAULT_TABATA_CONFIG)
    setView({ kind: 'form', editing: null })
  }

  const openEdit = (t: Tabata) => {
    clearNameError()
    setNombre(t.nombre)
    setConfig({
      preparacion: t.preparacion,
      trabajo: t.trabajo,
      descanso: t.descanso,
      intervalos: t.intervalos,
      series: t.series,
      descanso_series: t.descanso_series,
      enfriamiento: t.enfriamiento,
    })
    setView({ kind: 'form', editing: t })
    setMenuId(null)
  }

  const persistTabata = async (
    draft: { nombre: string } & TabataConfig,
    editing: Tabata | null,
    permitirDuplicado: boolean,
  ) => {
    clearNameError()
    const trimmed = draft.nombre.trim()
    if (!trimmed) return

    try {
      if (editing) {
        await actualizar(
          { ...editing, ...draft, nombre: trimmed },
          { permitirDuplicado },
        )
      } else {
        await crear({ ...draft, nombre: trimmed }, { permitirDuplicado })
      }
      setView({ kind: 'list' })
    } catch (err) {
      const parsed = parseRpcError(err)
      if (parsed.code === 'CONFIG_DUPLICADA') {
        setView({
          kind: 'duplicate',
          draft: { ...draft, nombre: trimmed },
          editingId: editing?.id ?? null,
          existingName: parsed.nombre,
        })
        return
      }
    }
  }

  const handleSave = async (permitirDuplicado = false) => {
    const editing =
      view.kind === 'form'
        ? view.editing
        : view.kind === 'duplicate' && view.editingId
          ? (tabatas.find((t) => t.id === view.editingId) ?? null)
          : null
    const draft =
      view.kind === 'duplicate'
        ? view.draft
        : { nombre, ...config }
    await persistTabata(draft, editing, permitirDuplicado)
  }

  const onSubmitForm = (e: FormEvent) => {
    e.preventDefault()
    void handleSave(false)
  }

  const startTabata = async (t: Tabata) => {
    setMenuId(null)
    await timer.start(t)
    setView({ kind: 'run' })
  }

  const handleClose = useCallback(async () => {
    if (timer.status === 'running' || timer.status === 'paused') {
      const ok = await confirm({
        title: '¿Detener el Tabata?',
        description: 'Se cancelará la sesión en curso.',
        confirmLabel: 'Detener',
        cancelLabel: 'Seguir',
        tone: 'danger',
      })
      if (!ok) return
      timer.stop()
    }
    onRequestClose?.()
  }, [confirm, onRequestClose, timer])

  const dismissMobileTip = () => {
    setMobileTip(false)
    try {
      localStorage.setItem(TABATA_MOBILE_TIP_KEY, '1')
    } catch {
      /* ignorar */
    }
  }

  const headerTitle =
    view.kind === 'form'
      ? view.editing
        ? 'Editar Tabata'
        : 'Nuevo Tabata'
      : view.kind === 'run' || view.kind === 'done'
        ? timer.active?.nombre ?? 'Tabata'
        : 'Tabata'

  const remainingSec = Math.max(0, Math.ceil(timer.remainingMs / 1000))
  const phaseKind = timer.currentPhase?.kind ?? 'preparacion'
  const tone = phaseTone(phaseKind)

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-[color:var(--bloomora-surface-1)]',
        embedded ? 'w-full' : '',
        className,
      )}
    >
      {showChrome ? (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--bloomora-border)] px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-bloomora-deep">
              {headerTitle}
            </p>
            {view.kind === 'list' ? (
              <p className="truncate text-xs font-medium text-bloomora-violet">
                Mis Tabatas guardados
              </p>
            ) : view.kind === 'run' ? (
              <p className="text-xs font-semibold text-bloomora-violet">
                En curso
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {view.kind === 'run' ? (
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full text-bloomora-violet hover:bg-[color:var(--bloomora-surface-3)]"
                aria-pressed={timer.muted}
                aria-label={timer.muted ? 'Activar sonido' : 'Silenciar'}
                onClick={() => timer.setMuted(!timer.muted)}
              >
                {timer.muted ? '🔇' : '🔊'}
              </button>
            ) : null}
            {onRequestMinimize ? (
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full text-xl font-bold text-bloomora-violet hover:bg-[color:var(--bloomora-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-bloomora-lilac"
                aria-label="Minimizar"
                onClick={onRequestMinimize}
              >
                −
              </button>
            ) : null}
            {onRequestClose ? (
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full text-lg font-bold text-bloomora-violet hover:bg-[color:var(--bloomora-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-bloomora-lilac"
                aria-label="Cerrar"
                onClick={() => void handleClose()}
              >
                ×
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      {mobileTip ? (
        <div
          role="status"
          className="mx-3 mt-3 rounded-2xl bg-[color:var(--bloomora-surface-2)] px-3 py-2.5 text-left text-xs font-medium leading-snug text-bloomora-violet ring-1 ring-[color:var(--bloomora-border)] min-[600px]:hidden"
        >
          <p>
            Esta herramienta está pensada para tablet y computador. Funciona
            aquí, pero se ve mejor en pantalla grande.
          </p>
          <button
            type="button"
            className="mt-2 inline-flex min-h-10 items-center rounded-pill bg-[color:var(--bloomora-surface-1)] px-3 text-xs font-bold text-bloomora-deep ring-1 ring-[color:var(--bloomora-border)]"
            onClick={dismissMobileTip}
          >
            Entendido
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {view.kind === 'list' ? (
          <div className="flex min-h-full flex-col gap-3">
            {!showChrome ? (
              <div>
                <h2 className="text-[17px] font-bold text-bloomora-deep">Tabata</h2>
                <p className="text-sm font-medium text-bloomora-violet">
                  Mis Tabatas guardados
                </p>
              </div>
            ) : null}

            {isLoading ? (
              <p className="py-8 text-center text-sm text-bloomora-text-muted">
                Cargando…
              </p>
            ) : null}

            {!isLoading && tabatas.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                <BloomyWaveStill
                  heightPx={112}
                  className="h-28 w-auto object-contain"
                />
                <p className="text-base font-bold text-bloomora-deep">
                  Aún no tienes Tabatas
                </p>
                <p className="max-w-[16rem] text-sm text-bloomora-violet">
                  Crea tu primer circuito de intervalos.
                </p>
              </div>
            ) : null}

            <ul className="flex flex-col gap-2">
              {tabatas.map((t) => (
                <li
                  key={t.id}
                  className="relative flex items-center gap-2 rounded-[18px] bg-bloomora-snow px-3 py-2.5 ring-1 ring-[color:var(--bloomora-border)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-bold text-bloomora-deep">
                      {t.nombre}
                    </p>
                    <p className="truncate text-xs font-medium text-bloomora-violet">
                      {summarizeConfig(t)}
                    </p>
                    <p className="text-xs font-semibold tabular-nums text-bloomora-text-muted">
                      {formatMmSs(totalSeconds(t))}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--bloomora-accent-bg)] text-[color:var(--bloomora-accent-on)] shadow-sm hover:bg-bloomora-rose-deep/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
                    aria-label={`Iniciar ${t.nombre}`}
                    onClick={() => void startTabata(t)}
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-bloomora-violet hover:bg-[color:var(--bloomora-surface-3)]"
                    aria-label={`Más opciones de ${t.nombre}`}
                    aria-expanded={menuId === t.id}
                    onClick={() =>
                      setMenuId((id) => (id === t.id ? null : t.id))
                    }
                  >
                    ⋮
                  </button>
                  {menuId === t.id ? (
                    <div className="absolute right-2 top-12 z-10 w-40 overflow-hidden rounded-2xl border border-[color:var(--bloomora-border)] bg-[color:var(--bloomora-surface-1)] py-1 shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-bloomora-deep hover:bg-[color:var(--bloomora-surface-3)]"
                        onClick={() => openEdit(t)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-bloomora-deep hover:bg-[color:var(--bloomora-surface-3)]"
                        onClick={() => {
                          setMenuId(null)
                          void duplicar(t)
                        }}
                      >
                        Duplicar
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setMenuId(null)
                          void eliminar(t.id)
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            <Button
              variant="primary"
              fullWidth
              className="mt-auto h-[52px] bg-[color:var(--bloomora-accent-bg)] text-base font-bold text-[color:var(--bloomora-accent-on)] hover:bg-bloomora-rose-deep/90"
              onClick={openCreate}
            >
              + Nueva Tabata
            </Button>
          </div>
        ) : null}

        {view.kind === 'form' ? (
          <form onSubmit={onSubmitForm} className="flex flex-col gap-3">
            {!showChrome ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-bloomora-violet"
                onClick={() => setView({ kind: 'list' })}
              >
                ← Volver
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-bloomora-violet"
                onClick={() => setView({ kind: 'list' })}
              >
                ← Volver
              </button>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-bloomora-deep">
                Nombre
              </span>
              <input
                value={nombre}
                onChange={(e) => {
                  clearNameError()
                  setNombre(e.target.value)
                }}
                className="h-12 w-full rounded-2xl border-2 border-bloomora-lavender-100 bg-[color:var(--bloomora-surface-1)] px-3 text-base font-semibold text-bloomora-deep outline-none focus:border-bloomora-rose-deep focus:shadow-[0_0_0_4px_var(--color-bloomora-blush)]"
                placeholder="Ej: Cardio"
                maxLength={60}
                required
              />
              {nameError ||
              (nombre.trim() &&
                nombreExiste(nombre, view.editing?.id ?? undefined)) ? (
                <p className="mt-1.5 text-sm font-semibold text-red-600" role="alert">
                  {nameError ?? 'Ya tienes un Tabata con ese nombre.'}
                </p>
              ) : null}
            </label>

            <StepperRow
              label="Preparación"
              value={config.preparacion}
              onChange={(preparacion) => setConfig((c) => ({ ...c, preparacion }))}
              accent="bg-[color:var(--bloomora-surface-2)]"
            />
            <StepperRow
              label="Trabajo"
              value={config.trabajo}
              min={1}
              onChange={(trabajo) => setConfig((c) => ({ ...c, trabajo }))}
              accent="bg-bloomora-blush/70"
            />
            <StepperRow
              label="Descanso"
              value={config.descanso}
              onChange={(descanso) => setConfig((c) => ({ ...c, descanso }))}
              accent="bg-emerald-50/80"
            />
            <CountStepper
              label="Intervalos"
              value={config.intervalos}
              onChange={(intervalos) => setConfig((c) => ({ ...c, intervalos }))}
              unit=""
            />
            <CountStepper
              label="Series"
              value={config.series}
              onChange={(series) => setConfig((c) => ({ ...c, series }))}
              unit=""
            />
            <StepperRow
              label="Descanso entre series"
              value={config.descanso_series}
              step={5}
              onChange={(descanso_series) =>
                setConfig((c) => ({ ...c, descanso_series }))
              }
              accent="bg-bloomora-lavender-100/70"
            />
            <div className="rounded-[18px] ring-1 ring-[color:var(--bloomora-border)]">
              <div className="flex min-h-11 items-center justify-between gap-3 px-3 py-1.5">
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-semibold text-bloomora-deep">
                    Enfriamiento
                  </p>
                  <p className="text-xs font-medium text-bloomora-violet">
                    Opcional
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.enfriamiento > 0}
                  aria-label="Activar enfriamiento"
                  className={cn(
                    'relative h-8 w-14 shrink-0 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac',
                    config.enfriamiento > 0
                      ? 'bg-bloomora-rose-deep'
                      : 'bg-bloomora-lavender-100',
                  )}
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      enfriamiento: c.enfriamiento > 0 ? 0 : 30,
                    }))
                  }
                >
                  <span
                    className={cn(
                      'absolute top-1 size-6 rounded-full bg-[color:var(--bloomora-surface-1)] shadow transition',
                      config.enfriamiento > 0 ? 'left-7' : 'left-1',
                    )}
                    aria-hidden
                  />
                </button>
              </div>
              {config.enfriamiento > 0 ? (
                <div className="border-t border-[color:var(--bloomora-border)] px-3 py-2">
                  <StepperRow
                    label="Duración"
                    value={config.enfriamiento}
                    min={5}
                    onChange={(enfriamiento) =>
                      setConfig((c) => ({
                        ...c,
                        enfriamiento: Math.max(5, enfriamiento),
                      }))
                    }
                  />
                </div>
              ) : null}
            </div>

            <p className="text-center text-sm font-semibold text-bloomora-violet">
              Duración total:{' '}
              <span className="tabular-nums text-bloomora-deep">
                {formatMmSs(totalSeconds(config))}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="h-[52px] text-base font-bold"
                onClick={() => setView({ kind: 'list' })}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="h-[52px] bg-[color:var(--bloomora-accent-bg)] text-base font-bold text-[color:var(--bloomora-accent-on)] hover:bg-bloomora-rose-deep/90"
                disabled={isSaving || !nombre.trim()}
              >
                Guardar
              </Button>
            </div>
          </form>
        ) : null}

        {view.kind === 'duplicate' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <BloomyWaveStill
              heightPx={96}
              className="h-24 w-auto object-contain"
            />
            <h3 className="text-lg font-bold text-bloomora-deep">
              Este Tabata ya existe
            </h3>
            <p className="text-sm font-medium text-bloomora-violet">
              Ya existe un Tabata con estas mismas especificaciones:{' '}
              <span className="font-bold text-bloomora-deep">
                «{view.existingName}»
              </span>
            </p>
            <div className="mt-2 grid w-full gap-2">
              <Button
                variant="primary"
                fullWidth
                className="h-[52px] bg-[color:var(--bloomora-accent-bg)] text-base font-bold text-[color:var(--bloomora-accent-on)]"
                onClick={() => {
                  const existing = tabatas.find(
                    (t) =>
                      t.nombre.trim().toLowerCase() ===
                      view.existingName.trim().toLowerCase(),
                  )
                  if (existing) void startTabata(existing)
                  else setView({ kind: 'list' })
                }}
              >
                Usar ese
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="h-[52px] text-base font-bold"
                disabled={isSaving}
                onClick={() => {
                  const editing = view.editingId
                    ? (tabatas.find((t) => t.id === view.editingId) ?? null)
                    : null
                  void persistTabata(view.draft, editing, true)
                }}
              >
                Guardar igual
              </Button>
            </div>
          </div>
        ) : null}

        {view.kind === 'run' && timer.currentPhase ? (
          <div className="flex flex-col items-center gap-3">
            <span
              className={cn(
                'inline-flex min-h-9 items-center rounded-pill px-3.5 text-xs font-bold tracking-wide ring-1',
                tone.chip,
              )}
              aria-live="polite"
            >
              {timer.currentPhase.label}
            </span>

            <PhaseRing
              progress={timer.phaseProgress}
              remainingSec={remainingSec}
              kind={phaseKind}
              size={embedded ? 232 : 188}
            />

            {timer.currentPhase.intervalo > 0 ? (
              <p className="text-center text-sm font-semibold text-bloomora-violet">
                Intervalo {timer.currentPhase.intervalo} de{' '}
                {timer.active?.intervalos ?? '—'} · Serie{' '}
                {timer.currentPhase.serie} de {timer.active?.series ?? '—'}
              </p>
            ) : (
              <p className="text-center text-sm font-semibold text-bloomora-violet">
                {timer.currentPhase.kind === 'preparacion'
                  ? 'Prepárate'
                  : timer.currentPhase.kind === 'descanso_series'
                    ? `Entre serie ${timer.currentPhase.serie} y ${(timer.currentPhase.serie || 0) + 1}`
                    : 'Enfriamiento'}
              </p>
            )}

            {timer.nextPhase && timer.nextPhase.kind !== 'fin' ? (
              <p className="rounded-pill bg-bloomora-mist px-3 py-1.5 text-xs font-semibold text-bloomora-violet">
                Siguiente: {timer.nextPhase.label}{' '}
                {formatMmSs(timer.nextPhase.durationSec)}
              </p>
            ) : null}

            <div className="mt-1 flex items-end justify-center gap-3">
              <button
                type="button"
                className="inline-flex size-14 flex-col items-center justify-center rounded-full bg-bloomora-mist text-[0.65rem] font-bold text-bloomora-violet ring-1 ring-[color:var(--bloomora-border)]"
                onClick={() => {
                  timer.stop()
                  setView({ kind: 'list' })
                }}
              >
                <span className="text-lg" aria-hidden>
                  ■
                </span>
                Detener
              </button>
              <button
                type="button"
                className="inline-flex size-[72px] items-center justify-center rounded-full bg-[color:var(--bloomora-accent-bg)] text-2xl font-bold text-[color:var(--bloomora-accent-on)] shadow-[0_8px_20px_rgba(232,155,184,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
                aria-label={
                  timer.status === 'running' ? 'Pausar' : 'Reanudar'
                }
                onClick={() => {
                  if (timer.status === 'running') timer.pause()
                  else void timer.resume()
                }}
              >
                {timer.status === 'running' ? 'Ⅱ' : '▶'}
              </button>
              <button
                type="button"
                className="inline-flex size-14 flex-col items-center justify-center rounded-full bg-bloomora-mist text-[0.65rem] font-bold text-bloomora-violet ring-1 ring-[color:var(--bloomora-border)]"
                onClick={() => timer.skip()}
              >
                <span className="text-lg" aria-hidden>
                  ⏭
                </span>
                Saltar
              </button>
            </div>

            <div className="mt-2 w-full">
              <div className="mb-1 flex justify-between text-[0.7rem] font-semibold tabular-nums text-bloomora-violet">
                <span>
                  {formatMmSs(timer.elapsedMs / 1000)} de{' '}
                  {formatMmSs(timer.totalMs / 1000)}
                </span>
                <span>
                  Faltan{' '}
                  {formatMmSs(
                    Math.max(0, (timer.totalMs - timer.elapsedMs) / 1000),
                  )}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-[color:var(--bloomora-surface-2)]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(timer.overallProgress * 100)}
                aria-label="Progreso total del Tabata"
              >
                <div
                  className={cn('h-full rounded-full', tone.bar)}
                  style={{ width: `${timer.overallProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {view.kind === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <BloomySaltaCelebrate sizePx={200} />
            <h3 className="text-xl font-bold text-bloomora-deep">
              ¡Lo lograste!
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-bloomora-violet">
              <span className="rounded-pill bg-bloomora-mist px-3 py-1.5 tabular-nums">
                {formatMmSs(timer.totalMs / 1000)} tiempo
              </span>
              <span className="rounded-pill bg-bloomora-mist px-3 py-1.5">
                {(timer.active?.intervalos ?? 0) *
                  (timer.active?.series ?? 0)}{' '}
                intervalos
              </span>
              <span className="rounded-pill bg-bloomora-mist px-3 py-1.5">
                {timer.active?.series ?? 0} series
              </span>
            </div>
            <div className="mt-2 grid w-full grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="h-[52px] text-base font-bold"
                onClick={() => {
                  timer.stop()
                  setView({ kind: 'list' })
                }}
              >
                Mis Tabatas
              </Button>
              <Button
                variant="primary"
                className="h-[52px] bg-[color:var(--bloomora-accent-bg)] text-base font-bold text-[color:var(--bloomora-accent-on)]"
                onClick={() => void timer.restart()}
              >
                Repetir
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Compacto para FloatingToolWidget minimizado (como Pomodoro). */
export function TabataMiniWidget({
  timer,
  onExpand,
}: {
  timer: TabataTimerController
  onExpand: () => void
}) {
  const remainingSec = Math.max(0, Math.ceil(timer.remainingMs / 1000))
  const label = timer.currentPhase?.label ?? 'Tabata'

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-bloomora-deep">
          {timer.status === 'finished'
            ? '¡Listo!'
            : timer.status === 'idle'
              ? '—'
              : formatMmSs(remainingSec)}
        </p>
        <p className="truncate text-[0.68rem] font-medium text-bloomora-text-muted">
          {timer.active?.nombre ?? 'Tabata'}
          {timer.status === 'paused' ? ' · En pausa' : ''}
          {timer.status === 'running' ? ` · ${label}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (timer.status === 'idle' || timer.status === 'finished') onExpand()
          else if (timer.status === 'running') timer.pause()
          else void timer.resume()
        }}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--bloomora-accent-bg)] text-[color:var(--bloomora-accent-on)] shadow-sm hover:bg-bloomora-deep"
        aria-label={
          timer.status === 'running'
            ? 'Pausar Tabata'
            : timer.status === 'paused'
              ? 'Reanudar Tabata'
              : 'Abrir Tabata'
        }
      >
        {timer.status === 'running' ? 'Ⅱ' : '▶'}
      </button>
    </div>
  )
}
