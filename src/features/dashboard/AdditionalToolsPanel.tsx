import { useState } from 'react'
import { DashboardQuickAction } from '@/components/dashboard/DashboardQuickAction'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Button } from '@/components/ui/Button'
import { useWorkspaceTools } from '@/contexts/WorkspaceToolsContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraEnglishFlashcardsDashboard } from '@/hooks/useBloomoraEnglishFlashcards'
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
      <circle cx="34" cy="34" r="5" fill="currentColor" opacity="0.2" />
      <path
        d="M32 34l1.5 1.5L36 32"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
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

export function AdditionalToolsPanel({ className }: AdditionalToolsPanelProps) {
  const { openTool } = useWorkspaceTools()
  const { cedula } = useUserPhone()
  const { data: flashcards, isLoading: isFlashcardsLoading } = useBloomoraEnglishFlashcardsDashboard(cedula)
  const [toolChoice, setToolChoice] = useState<'pomodoro' | 'english-notes' | null>(null)
  return (
    <>
    <aside
      className={cn('h-full min-w-0 w-full self-stretch', className)}
      aria-label="Herramientas adicionales"
    >
      <DashboardCard className="h-full gap-3 border border-bloomora-line/50 bg-white p-4 shadow-[0_5px_18px_rgba(91,74,140,0.06)] ring-0 sm:p-5">
        <h2 className="text-base font-bold tracking-tight text-bloomora-deep">
          Herramientas
        </h2>
        <p className="-mt-2 text-xs leading-snug text-bloomora-text-muted">
          Accesos rápidos
        </p>

        <nav className="flex flex-col gap-2">
          <DashboardQuickAction
            onClick={() => setToolChoice('pomodoro')}
            label="Pomodoro"
            description="Temporizador de enfoque"
            icon={
              <PomodoroToolIcon className="size-9 text-rose-500 sm:size-10" />
            }
            iconClassName="bg-rose-50 text-rose-500 ring-rose-200/50"
          />
          <DashboardQuickAction
            to="/app/flashcards"
            label="Flashcards"
            description={isFlashcardsLoading ? 'Cargando…' : `${flashcards?.count ?? 0} palabras · Inglés`}
            icon={<FlashcardsToolIcon className="size-6 text-orange-500" />}
            iconClassName="bg-orange-50 text-orange-500 ring-orange-200/50"
          />
          <DashboardQuickAction
            onClick={() => setToolChoice('english-notes')}
            label="Apuntes"
            description="Tus notas"
            icon={
              <NotesToolIcon className="size-9 text-bloomora-violet/70 sm:size-10" />
            }
            iconClassName="bg-bloomora-lavender-50 text-bloomora-violet ring-bloomora-line/35"
          />
        </nav>
      </DashboardCard>
    </aside>
    {toolChoice ? (
      <div className="fixed inset-0 z-[10080] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setToolChoice(null) }}>
        <section role="dialog" aria-modal="true" aria-labelledby="workspace-tool-choice-title" className="w-full max-w-sm rounded-3xl border border-bloomora-line/50 bg-white p-6 shadow-2xl">
          <h2 id="workspace-tool-choice-title" className="text-lg font-bold text-bloomora-deep">¿Cómo quieres abrir {toolChoice === 'pomodoro' ? 'Pomodoro' : 'Apuntes'}?</h2>
          <p className="mt-1 text-sm text-bloomora-text-muted">Puedes cambiar de modo cuando quieras.</p>
          <div className="mt-5 grid gap-3">
            <Button variant="secondary" fullWidth className="h-auto min-h-0 justify-start rounded-2xl px-4 py-3 text-left" onClick={() => { openTool(toolChoice, 'full'); setToolChoice(null) }}>
              <span><span className="block text-sm font-bold">Pantalla completa</span><span className="mt-0.5 block text-xs font-normal text-bloomora-text-muted">Ocupa el espacio de trabajo; puedes minimizarlo después.</span></span>
            </Button>
            <Button variant="secondary" fullWidth className="h-auto min-h-0 justify-start rounded-2xl px-4 py-3 text-left" onClick={() => { openTool(toolChoice, 'minimized'); setToolChoice(null) }}>
              <span><span className="block text-sm font-bold">Modo gadget</span><span className="mt-0.5 block text-xs font-normal text-bloomora-text-muted">Abre una ventana flotante que puedes mover por la pantalla.</span></span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" fullWidth className="mt-3" onClick={() => setToolChoice(null)}>Cancelar</Button>
        </section>
      </div>
    ) : null}
    </>
  )
}
