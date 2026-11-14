import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useWorkspaceTools, type WorkspaceToolId } from '@/contexts/WorkspaceToolsContext'
import { TabataMiniWidget, TabataPanel } from '@/features/tabata/TabataPanel'
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer'
import { useTabataTimer } from '@/hooks/useTabataTimer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { IconButton } from '@/components/ui/IconButton'
import { phaseEmoji, phaseLabel } from '@/features/pomodoro/pomodoroSettings'

const PomodoroPage = lazy(() =>
  import('@/pages/PomodoroPage').then((module) => ({ default: module.PomodoroPage })),
)
const EnglishNotesPage = lazy(() =>
  import('@/pages/EnglishNotesPage').then((module) => ({ default: module.EnglishNotesPage })),
)

type DragPosition = { x: number; y: number }
type DragSession = DragPosition & {
  pointerId: number
  startX: number
  startY: number
}

function useDraggablePosition(width: number, initialY: number) {
  const [position, setPosition] = useState<DragPosition>(() => ({
    x:
      typeof window === 'undefined'
        ? 16
        : Math.max(8, window.innerWidth - width - 16),
    y: initialY,
  }))
  const sessionRef = useRef<DragSession | null>(null)

  const clamp = (x: number, y: number, elementWidth = width, elementHeight = 160) => ({
    x: Math.max(8, Math.min(x, window.innerWidth - elementWidth - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - elementHeight - 8)),
  })

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: bounds?.left ?? position.x,
      y: bounds?.top ?? position.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
    setPosition(
      clamp(
        session.x + event.clientX - session.startX,
        session.y + event.clientY - session.startY,
        bounds?.width,
        bounds?.height,
      ),
    )
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (sessionRef.current?.pointerId === event.pointerId) sessionRef.current = null
  }

  useEffect(() => {
    const onResize = () =>
      setPosition((current) => ({
        x: Math.max(8, Math.min(current.x, window.innerWidth - width - 8)),
        y: Math.max(8, Math.min(current.y, window.innerHeight - 168)),
      }))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [width])

  return {
    position,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }
}

function formatPomodoroTime(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function ToolFrame({
  title,
  onMinimize,
  onClose,
  minimized = false,
  children,
}: {
  title: string
  onMinimize: () => void
  onClose?: () => void
  minimized?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`fixed z-[10060] flex min-w-0 max-w-[100vw] flex-col overflow-hidden bg-bloomora-snow ${
        minimized
          ? '-left-[10000px] top-0 h-dvh w-screen invisible pointer-events-none'
        : 'inset-0 h-dvh max-h-dvh w-screen'
      }`}
      aria-hidden={minimized}
    >
      <header className="z-10 flex h-14 min-w-0 shrink-0 items-center justify-between gap-2 border-b border-bloomora-line/40 bg-white/95 px-3 shadow-sm backdrop-blur sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-bloomora-lavender-50 text-bloomora-violet" aria-hidden>
            ✦
          </span>
          <h1 className="truncate text-sm font-bold text-bloomora-deep">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {title === 'Apuntes' ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('bloomora:open-notes-shortcuts'))}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-bloomora-line/50 bg-white text-sm font-bold text-bloomora-violet shadow-sm hover:bg-bloomora-lavender-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bloomora-lilac"
              aria-label="Ver atajos de teclado y controles"
              title="Atajos de teclado"
            >
              ⌨
            </button>
          ) : null}
          <button
            type="button"
            onClick={onMinimize}
            className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-full bg-bloomora-lavender-50 px-3 text-xs font-bold text-bloomora-violet ring-1 ring-bloomora-line/40 transition hover:bg-bloomora-lavender-100 sm:min-h-9 sm:w-auto sm:px-4"
            aria-label={`Minimizar ${title} y seguir trabajando`}
          >
            <span aria-hidden>−</span>
            <span className="hidden sm:inline">Minimizar</span>
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-bloomora-violet ring-1 ring-bloomora-line/40 transition hover:bg-bloomora-mist"
              aria-label={`Cerrar ${title}`}
            >
              ×
            </button>
          ) : null}
        </div>
      </header>
      <div
        className={`min-h-0 min-w-0 w-full max-w-full flex-1 ${
          (title === 'Pomodoro' || title === 'Tabata') && !minimized
            ? 'overflow-hidden'
            : title === 'Apuntes'
              ? 'overflow-x-hidden overflow-y-auto'
              : 'overflow-y-auto'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function FloatingToolWidget({
  tool,
  title,
  onExpand,
  onClose,
  closeLabel,
  children,
  width = 288,
  initialY,
}: {
  tool: WorkspaceToolId
  title: string
  onExpand: () => void
  onClose?: () => void
  closeLabel?: string
  children: ReactNode
  width?: number
  initialY: number
}) {
  const drag = useDraggablePosition(width, initialY)
  return (
    <section
      role="region"
      aria-label={`${title} minimizado`}
      className="fixed z-[10070] w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-bloomora-line/50 bg-white/95 shadow-[0_18px_50px_-18px_rgba(53,39,91,0.45)] backdrop-blur"
      style={{ left: drag.position.x, top: drag.position.y }}
      data-floating-tool={tool}
    >
      <div
        className="flex touch-none cursor-grab items-center justify-between gap-2 bg-gradient-to-r from-bloomora-lavender-50 to-bloomora-blush/50 px-3 py-2.5 active:cursor-grabbing"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
      >
        <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-bloomora-deep">
          <span className="text-bloomora-violet" aria-hidden>⠿</span>
          <span className="truncate">{title}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            label={`Expandir ${title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onExpand}
            className="size-11 rounded-full"
            title="Expandir"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4M4 8l6-6M20 8l-6-6M4 16l6 6M20 16l-6 6" />
            </svg>
          </IconButton>
          {onClose ? (
            <IconButton
              label={closeLabel ?? `Cerrar gadget de ${title}`}
              tone="neutral"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
              className="size-11 rounded-full bg-white/90"
              title="Cerrar"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </IconButton>
          ) : null}
        </div>
      </div>
      <div className="p-3">{children}</div>
    </section>
  )
}

export function WorkspaceToolsHost() {
  const { modes, minimizeTool, expandTool, closeTool } = useWorkspaceTools()
  const { confirm } = useBloomoraAlert()
  const pomodoro = usePomodoroTimer()
  const tabata = useTabataTimer()
  const isMobile = useMediaQuery('(max-width: 599px)')
  const [tabataChip, setTabataChip] = useState(false)
  const pomodoroMode = modes.pomodoro
  const notesMode = modes['english-notes']
  const tabataMode = modes.tabata

  useEffect(() => {
    if (tabataMode === null || tabataMode === 'full') setTabataChip(false)
  }, [tabataMode])

  const closeTabata = async () => {
    if (tabata.status === 'running' || tabata.status === 'paused') {
      const ok = await confirm({
        title: '¿Detener el Tabata?',
        description: 'Se cancelará la sesión en curso.',
        confirmLabel: 'Detener',
        cancelLabel: 'Seguir',
        tone: 'danger',
      })
      if (!ok) return
      tabata.stop()
    }
    setTabataChip(false)
    closeTool('tabata')
  }

  const showTabataFull =
    tabataMode === 'full' || (tabataMode === 'minimized' && isMobile)
  const showTabataGadget =
    tabataMode === 'minimized' && !isMobile && !tabataChip
  const showTabataMini =
    tabataMode === 'minimized' && !isMobile && tabataChip

  return (
    <>
      {pomodoroMode === 'full' ? (
        <ToolFrame title="Pomodoro" onMinimize={() => minimizeTool('pomodoro')}>
          <Suspense fallback={<p className="p-8 text-center text-sm text-bloomora-text-muted">Cargando Pomodoro…</p>}>
            <PomodoroPage embedded controller={pomodoro} />
          </Suspense>
        </ToolFrame>
      ) : null}

      {showTabataFull ? (
        <ToolFrame
          title="Tabata"
          onMinimize={() => {
            if (isMobile) {
              setTabataChip(false)
              minimizeTool('tabata')
              return
            }
            setTabataChip(false)
            minimizeTool('tabata')
          }}
          onClose={() => void closeTabata()}
        >
          <div className="mx-auto flex h-full min-h-0 w-[90%] max-w-lg flex-col min-[600px]:w-full">
            <TabataPanel timer={tabata} embedded />
          </div>
        </ToolFrame>
      ) : null}

      {notesMode !== null ? (
        <ToolFrame
          title="Apuntes"
          minimized={notesMode === 'minimized'}
          onMinimize={() => minimizeTool('english-notes')}
        >
          <Suspense fallback={<p className="p-8 text-center text-sm text-bloomora-text-muted">Cargando apuntes…</p>}>
            <EnglishNotesPage embedded />
          </Suspense>
        </ToolFrame>
      ) : null}

      {pomodoroMode === 'minimized' ? (
        <FloatingToolWidget
          tool="pomodoro"
          title="Pomodoro"
          onExpand={() => expandTool('pomodoro')}
          onClose={() => {
            if (pomodoro.status === 'alarm') pomodoro.stopAlarm()
            else if (pomodoro.status === 'running' || pomodoro.status === 'paused') {
              pomodoro.reset()
            }
            closeTool('pomodoro')
          }}
          closeLabel="Cerrar gadget de Pomodoro"
          initialY={88}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-bloomora-deep" aria-live="polite">
                {pomodoro.status === 'alarm' ? '¡Tiempo!' : formatPomodoroTime(pomodoro.remainingMs)}
              </p>
              <p className="truncate text-[0.68rem] font-medium text-bloomora-text-muted">
                {phaseEmoji(pomodoro.phase)} {phaseLabel(pomodoro.phase)}
                {pomodoro.status === 'paused' ? ' · En pausa' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (pomodoro.status === 'alarm') pomodoro.stopAlarm()
                else if (pomodoro.status === 'running') pomodoro.pause()
                else void pomodoro.start()
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bloomora-violet text-white shadow-sm hover:bg-bloomora-deep"
              aria-label={pomodoro.status === 'running' ? 'Pausar Pomodoro' : pomodoro.status === 'alarm' ? 'Detener alarma' : 'Iniciar Pomodoro'}
            >
              {pomodoro.status === 'running' ? 'Ⅱ' : pomodoro.status === 'alarm' ? '✓' : '▶'}
            </button>
          </div>
        </FloatingToolWidget>
      ) : null}

      {showTabataGadget ? (
        <section
          role="region"
          aria-label="Tabata"
          className="fixed bottom-6 right-6 z-[10070] flex max-h-[calc(100vh-3rem)] w-[min(18rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-[1.75rem] border border-bloomora-line/50 bg-white shadow-[0_18px_50px_-18px_rgba(53,39,91,0.45)]"
          data-floating-tool="tabata"
        >
          <TabataPanel
            timer={tabata}
            showChrome
            className="min-h-0 max-h-[calc(100vh-3rem)]"
            onRequestMinimize={() => setTabataChip(true)}
            onRequestClose={() => void closeTabata()}
          />
        </section>
      ) : null}

      {showTabataMini ? (
        <FloatingToolWidget
          tool="tabata"
          title={tabata.active?.nombre ?? 'Tabata'}
          onExpand={() => {
            setTabataChip(false)
            expandTool('tabata')
          }}
          onClose={() => void closeTabata()}
          closeLabel="Cerrar gadget de Tabata"
          initialY={260}
        >
          <TabataMiniWidget
            timer={tabata}
            onExpand={() => setTabataChip(false)}
          />
        </FloatingToolWidget>
      ) : null}

      {notesMode === 'minimized' ? (
        <FloatingToolWidget
          tool="english-notes"
          title="Apuntes"
          onExpand={() => expandTool('english-notes')}
          onClose={() => closeTool('english-notes')}
          closeLabel="Cerrar gadget de apuntes"
          initialY={174}
        >
          <p className="text-xs leading-relaxed text-bloomora-text-muted">
            El apunte sigue abierto y tus cambios permanecen mientras trabajas.
          </p>
          <button
            type="button"
            onClick={() => expandTool('english-notes')}
            className="mt-2 w-full rounded-xl bg-bloomora-lavender-50 px-3 py-2 text-xs font-bold text-bloomora-violet hover:bg-bloomora-lavender-100"
          >
            Volver a los apuntes
          </button>
        </FloatingToolWidget>
      ) : null}
    </>
  )
}
