import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardQuickAction } from '@/components/dashboard/DashboardQuickAction'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Button } from '@/components/ui/Button'
import {
  useWorkspaceTools,
  type WorkspaceToolId,
} from '@/contexts/WorkspaceToolsContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraEnglishFlashcardsDashboard } from '@/hooks/useBloomoraEnglishFlashcards'
import { useTabatas } from '@/hooks/useTabatas'
import { cn } from '@/utils/cn'

type AdditionalToolsPanelProps = {
  className?: string
}

function PomodoroToolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <circle cx="24" cy="26" r="14" fill="currentColor" opacity="0.15" />
      <circle
        cx="24"
        cy="26"
        r="14"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M24 26V18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M24 26l6 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 10h8M24 10V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="9" rx="3" ry="1.5" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

function NotesToolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect
        x="12"
        y="8"
        width="24"
        height="32"
        rx="4"
        fill="currentColor"
        opacity="0.12"
      />
      <rect
        x="12"
        y="8"
        width="24"
        height="32"
        rx="4"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M18 18h14M18 24h14M18 30h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 8v6h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FlashcardsToolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8" y="3" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 7v12a2 2 0 0 0 2 2h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TabataToolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="14" fill="currentColor" opacity="0.12" />
      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M24 14v10l6 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 34c2.5-3 6-5 8-5s5.5 2 8 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AdditionalToolsPanel({ className }: AdditionalToolsPanelProps) {
  const { openTool } = useWorkspaceTools()
  const { cedula } = useUserPhone()
  const { data: flashcards, isLoading: isFlashcardsLoading } =
    useBloomoraEnglishFlashcardsDashboard(cedula)
  const { tabatas, isLoading: isTabatasLoading } = useTabatas()
  const [toolChoice, setToolChoice] = useState<
    'pomodoro' | 'english-notes' | 'tabata' | null
  >(null)

  const toolLabel = (id: WorkspaceToolId) =>
    id === 'pomodoro' ? 'Pomodoro' : id === 'tabata' ? 'Tabata' : 'Apuntes'

  return (
    <>
      <aside
        className={cn('h-full min-w-0 w-full self-stretch', className)}
        aria-label="Herramientas adicionales"
      >
        <DashboardCard className="h-full gap-4 bg-bloomora-white p-5 max-[599px]:p-5 min-[600px]:p-7">
          <header className="flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-bloomora-deep min-[1024px]:text-[1.375rem]">
                Herramientas
              </h2>
              <p className="mt-0.5 text-[0.9375rem] text-bloomora-violet">
                Accesos rápidos
              </p>
            </div>
            <Link
              to="/app/study-tools"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-pill border-2 border-bloomora-line bg-bloomora-white px-[1.125rem] text-[0.9375rem] font-bold text-bloomora-violet transition hover:bg-bloomora-mist/70"
            >
              Ver todas
            </Link>
          </header>

          <nav className="flex flex-col gap-3">
            <DashboardQuickAction
              onClick={() => setToolChoice('pomodoro')}
              label="Pomodoro"
              description="Temporizador de enfoque"
              icon={
                <PomodoroToolIcon className="size-7 text-bloomora-rose-deep sm:size-8" />
              }
              iconClassName="bg-bloomora-blush text-bloomora-rose-deep ring-bloomora-rose/40"
            />
            <DashboardQuickAction
              to="/app/flashcards"
              label="Flashcards"
              description={
                isFlashcardsLoading
                  ? 'Cargando…'
                  : `${flashcards?.count ?? 0} palabras · Inglés`
              }
              icon={<FlashcardsToolIcon className="size-6 text-amber-600" />}
              iconClassName="bg-amber-50 text-amber-600 ring-amber-200/50"
            />
            <DashboardQuickAction
              onClick={() => setToolChoice('english-notes')}
              label="Apuntes"
              description="Tus notas"
              icon={
                <NotesToolIcon className="size-7 text-bloomora-violet sm:size-8" />
              }
              iconClassName="bg-bloomora-mist text-bloomora-violet ring-bloomora-line/35"
            />
            <DashboardQuickAction
              onClick={() => setToolChoice('tabata')}
              label="Tabata"
              description={
                isTabatasLoading
                  ? 'Cargando…'
                  : tabatas.length === 0
                    ? 'Intervalos · sin guardados'
                    : `${tabatas.length} guardado${tabatas.length === 1 ? '' : 's'}`
              }
              icon={
                <TabataToolIcon className="size-7 text-emerald-700 sm:size-8" />
              }
              iconClassName="bg-emerald-50 text-emerald-700 ring-emerald-200/50"
            />
          </nav>
        </DashboardCard>
      </aside>
      {toolChoice ? (
        <div
          className="fixed inset-0 z-[10080] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setToolChoice(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-tool-choice-title"
            className="w-full max-w-sm rounded-3xl border border-bloomora-line/50 bg-white p-6 shadow-2xl"
          >
            <h2
              id="workspace-tool-choice-title"
              className="text-lg font-bold text-bloomora-deep"
            >
              ¿Cómo quieres abrir {toolLabel(toolChoice)}?
            </h2>
            <p className="mt-1 text-sm text-bloomora-text-muted">
              Puedes cambiar de modo cuando quieras.
            </p>
            <div className="mt-5 grid gap-3">
              <Button
                variant="secondary"
                fullWidth
                className="h-auto min-h-0 justify-start rounded-2xl px-4 py-3 text-left"
                onClick={() => {
                  openTool(toolChoice, 'full')
                  setToolChoice(null)
                }}
              >
                <span>
                  <span className="block text-sm font-bold">Pantalla completa</span>
                  <span className="mt-0.5 block text-xs font-normal text-bloomora-text-muted">
                    Ocupa el espacio de trabajo; puedes minimizarlo después.
                  </span>
                </span>
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="h-auto min-h-0 justify-start rounded-2xl px-4 py-3 text-left"
                onClick={() => {
                  openTool(toolChoice, 'minimized')
                  setToolChoice(null)
                }}
              >
                <span>
                  <span className="block text-sm font-bold">Modo gadget</span>
                  <span className="mt-0.5 block text-xs font-normal text-bloomora-text-muted">
                    Abre una ventana flotante que puedes mover por la pantalla.
                  </span>
                </span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              className="mt-3"
              onClick={() => setToolChoice(null)}
            >
              Cancelar
            </Button>
          </section>
        </div>
      ) : null}
    </>
  )
}
