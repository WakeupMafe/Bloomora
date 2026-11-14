import { useState } from 'react'
import bunnyHandsUpPng from '@/assets/bloomy/bunny_hands_up_512.png'
import bunnyHandsUp1xAvif from '@/assets/bloomy/bunny_hands_up_1x.avif'
import bunnyHandsUp1xWebp from '@/assets/bloomy/bunny_hands_up_1x.webp'
import bunnyHandsUp2xAvif from '@/assets/bloomy/bunny_hands_up_2x.avif'
import bunnyHandsUp2xWebp from '@/assets/bloomy/bunny_hands_up_2x.webp'
import bunnyPhonePng from '@/assets/bloomy/bunny_phone_512.png'
import bunnyPhone1xAvif from '@/assets/bloomy/bunny_phone_1x.avif'
import bunnyPhone1xWebp from '@/assets/bloomy/bunny_phone_1x.webp'
import bunnyPhone2xAvif from '@/assets/bloomy/bunny_phone_2x.avif'
import bunnyPhone2xWebp from '@/assets/bloomy/bunny_phone_2x.webp'
import bunnyThinkPng from '@/assets/bloomy/bunny_think_512.png'
import bunnyThink1xAvif from '@/assets/bloomy/bunny_think_1x.avif'
import bunnyThink1xWebp from '@/assets/bloomy/bunny_think_1x.webp'
import bunnyThink2xAvif from '@/assets/bloomy/bunny_think_2x.avif'
import bunnyThink2xWebp from '@/assets/bloomy/bunny_think_2x.webp'
import { Button } from '@/components/ui/Button'

function StudyToolBloomy({
  png,
  avif1x,
  avif2x,
  webp1x,
  webp2x,
}: {
  png: string
  avif1x: string
  avif2x: string
  webp1x: string
  webp2x: string
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={`${avif1x} 1x, ${avif2x} 2x`} />
      <source type="image/webp" srcSet={`${webp1x} 1x, ${webp2x} 2x`} />
      <img
        src={png}
        alt=""
        width={140}
        height={140}
        loading="lazy"
        decoding="async"
        className="h-[140px] w-auto object-contain object-center"
        aria-hidden
      />
    </picture>
  )
}
import { DashboardGreeting } from '@/features/dashboard/DashboardGreeting'
import { StudyToolCard } from '@/features/study-tools/StudyToolCard'
import { useWorkspaceTools, type WorkspaceToolId } from '@/contexts/WorkspaceToolsContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraEnglishFlashcardsDashboard } from '@/hooks/useBloomoraEnglishFlashcards'
import { useTabatas } from '@/hooks/useTabatas'
import { formatMmSs, totalSeconds } from '@/features/tabata/tabataPlan'

export function StudyToolsPage() {
  const { openTool } = useWorkspaceTools()
  const { cedula } = useUserPhone()
  const { data: flashcards, isLoading } =
    useBloomoraEnglishFlashcardsDashboard(cedula)
  const { tabatas, isLoading: tabatasLoading } = useTabatas()
  const [toolChoice, setToolChoice] = useState<
    'pomodoro' | 'english-notes' | 'tabata' | null
  >(null)

  const wordCount = flashcards?.count ?? 0
  const tabataChip =
    tabatasLoading
      ? '…'
      : tabatas.length === 0
        ? 'Sin guardados'
        : `${tabatas.length} guardado${tabatas.length === 1 ? '' : 's'}`
  const firstTabataChip =
    tabatas[0] != null
      ? `${tabatas[0].nombre} ${formatMmSs(totalSeconds(tabatas[0]))}`
      : 'Intervalos'

  const toolLabel = (id: WorkspaceToolId) =>
    id === 'pomodoro' ? 'Pomodoro' : id === 'tabata' ? 'Tabata' : 'Apuntes'

  return (
    <main className="app-shell-padding--dashboard mx-auto w-full max-w-[1184px]">
      <DashboardGreeting
        title="Herramientas"
        subtitle="Todo lo que te ayuda a enfocarte, aprender y anotar"
      />

      <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[600px]:gap-6 min-[1024px]:grid-cols-3">
        <StudyToolCard
          title="⏱️ Pomodoro"
          description="Trabaja 25 minutos y descansa 5. Bloomy te avisa cuando toca pausa."
          to="/app/pomodoro"
          ctaLabel="Iniciar enfoque"
          chips={['Enfoque 25 min', 'Pausa 5 min']}
          visualClassName="bg-bloomora-blush"
          visual={
            <span className="text-[2.75rem] font-bold tabular-nums text-bloomora-deep">
              25:00
            </span>
          }
          onClick={() => setToolChoice('pomodoro')}
        />
        <StudyToolCard
          title="🗂️ Flashcards"
          description="Repasa palabras con tarjetas que se voltean."
          to="/app/flashcards"
          ctaLabel="Repasar ahora"
          chips={[
            isLoading ? '…' : `${wordCount} palabras`,
            'Inglés',
          ]}
          visualClassName="bg-[#FFF3DD]"
          visual={
            <StudyToolBloomy
              png={bunnyThinkPng}
              avif1x={bunnyThink1xAvif}
              avif2x={bunnyThink2xAvif}
              webp1x={bunnyThink1xWebp}
              webp2x={bunnyThink2xWebp}
            />
          }
        />
        <StudyToolCard
          title="📒 Apuntes"
          description="Escribe y organiza tus notas de clase o ideas."
          to="/app/english-notes"
          ctaLabel="Abrir apuntes"
          ctaVariant="secondary"
          chips={['Tus notas']}
          visualClassName="bg-bloomora-mist"
          visual={
            <StudyToolBloomy
              png={bunnyPhonePng}
              avif1x={bunnyPhone1xAvif}
              avif2x={bunnyPhone2xAvif}
              webp1x={bunnyPhone1xWebp}
              webp2x={bunnyPhone2xWebp}
            />
          }
          onClick={() => setToolChoice('english-notes')}
        />
        <StudyToolCard
          title="🏃 Tabata"
          description="Arma circuitos con trabajo, descanso y series. Guarda tus favoritos."
          to="/app/study-tools"
          ctaLabel="Abrir Tabata"
          chips={[tabataChip, firstTabataChip]}
          visualClassName="bg-emerald-50"
          visual={
            <StudyToolBloomy
              png={bunnyHandsUpPng}
              avif1x={bunnyHandsUp1xAvif}
              avif2x={bunnyHandsUp2xAvif}
              webp1x={bunnyHandsUp1xWebp}
              webp2x={bunnyHandsUp2xWebp}
            />
          }
          onClick={() => setToolChoice('tabata')}
        />
      </div>

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
            aria-labelledby="study-tool-choice-title"
            className="w-full max-w-sm rounded-3xl border border-bloomora-line/50 bg-white p-6 shadow-2xl"
          >
            <h2
              id="study-tool-choice-title"
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
    </main>
  )
}
