import {
  lazy,
  Suspense,
  useEffect,
  type ComponentType,
  type ReactElement,
} from 'react'
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { AppLayout } from '@/layouts/AppLayout'
import { RootLayout } from '@/layouts/RootLayout'
import {
  clearChunkReloadFlag,
  isChunkLoadError,
  reloadOnceForStaleChunk,
} from '@/lib/chunkLoadRecovery'
import { DayHomePage } from '@/pages/DayHomePage'
import { PhoneGatePage } from '@/pages/PhoneGatePage'
import { QuickEntryPage } from '@/pages/QuickEntryPage'
import { WelcomePage } from '@/pages/WelcomePage'

/** Crea el lazy una vez a nivel de módulo (no en cada render). */
function createLazyPage(
  factory: () => Promise<{ default: ComponentType }>,
  label?: string,
): ComponentType {
  const Page = lazy(() =>
    factory().then((mod) => {
      clearChunkReloadFlag()
      return mod
    }),
  )

  return function LazyRoutePage() {
    return (
      <Suspense fallback={<PageSpinner label={label} />}>
        <Page />
      </Suspense>
    )
  }
}

function RouteChunkErrorFallback() {
  const error = useRouteError()
  const chunkError = isChunkLoadError(error)

  useEffect(() => {
    if (chunkError) {
      reloadOnceForStaleChunk('route-errorElement')
    }
  }, [chunkError])

  return (
    <div className="grid min-h-[40vh] place-items-center gap-3 p-6 text-center">
      <p>
        {chunkError
          ? 'Hay una versión nueva de Bloomora. Recargando…'
          : 'Algo falló al cargar esta pantalla.'}
      </p>
      {!chunkError ? (
        <p className="text-sm opacity-70">
          {error instanceof Error ? error.message : String(error)}
        </p>
      ) : null}
      <button
        type="button"
        className="rounded-lg border px-4 py-2 text-sm"
        onClick={() => {
          clearChunkReloadFlag()
          window.location.reload()
        }}
      >
        Recargar ahora
      </button>
    </div>
  )
}

const EditProfilePage = createLazyPage(
  () =>
    import('@/pages/EditProfilePage').then((m) => ({
      default: m.EditProfilePage,
    })),
  'Cargando perfil…',
)

const GoalsOverviewPage = createLazyPage(
  () =>
    import('@/pages/GoalsOverviewPage').then((m) => ({
      default: m.GoalsOverviewPage,
    })),
  'Cargando metas…',
)

const GoalTrackerPage = createLazyPage(
  () =>
    import('@/pages/GoalTrackerPage').then((m) => ({
      default: m.GoalTrackerPage,
    })),
  'Cargando tracker…',
)

const EnglishFlashcardsPage = createLazyPage(
  () =>
    import('@/pages/EnglishFlashcardsPage').then((m) => ({
      default: m.EnglishFlashcardsPage,
    })),
  'Cargando flashcards…',
)

const ListsPage = createLazyPage(
  () => import('@/pages/ListsPage').then((m) => ({ default: m.ListsPage })),
  'Cargando listas…',
)

const PomodoroPage = createLazyPage(
  () =>
    import('@/pages/PomodoroPage').then((m) => ({ default: m.PomodoroPage })),
  'Cargando pomodoro…',
)

const StudyToolsPage = createLazyPage(
  () =>
    import('@/pages/StudyToolsPage').then((m) => ({
      default: m.StudyToolsPage,
    })),
  'Cargando herramientas…',
)

const EnglishNotesPage = createLazyPage(
  () =>
    import('@/pages/EnglishNotesPage').then((m) => ({
      default: m.EnglishNotesPage,
    })),
  'Cargando apuntes…',
)

const NewGoalPage = createLazyPage(
  () =>
    import('@/pages/NewGoalPage').then((m) => ({ default: m.NewGoalPage })),
  'Cargando…',
)

const PlaceholderFlowPage = createLazyPage(() =>
  import('@/pages/PlaceholderFlowPage').then((m) => ({
    default: m.PlaceholderFlowPage,
  })),
)

const DevThemePreviewPage = createLazyPage(
  () =>
    import('@/pages/DevThemePreviewPage').then((m) => ({
      default: m.DevThemePreviewPage,
    })),
  'Cargando…',
)

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteChunkErrorFallback />,
    children: [
      { index: true, element: <WelcomePage /> },
      { path: 'entrar', element: <QuickEntryPage /> },
      { path: 'phone', element: <PhoneGatePage /> },
      ...(import.meta.env.DEV
        ? ([
            {
              path: 'dev/perfil-tema',
              element: <DevThemePreviewPage />,
            },
          ] as { path: string; element: ReactElement }[])
        : []),
      {
        path: 'app',
        element: <AppLayout />,
        errorElement: <RouteChunkErrorFallback />,
        children: [
          { index: true, element: <DayHomePage /> },
          { path: 'profile', element: <EditProfilePage /> },
          { path: 'today', element: <DayHomePage /> },
          { path: 'agenda', element: <PlaceholderFlowPage /> },
          { path: 'tasks/new', element: <PlaceholderFlowPage /> },
          { path: 'goals/new', element: <NewGoalPage /> },
          { path: 'goals/overview', element: <GoalsOverviewPage /> },
          { path: 'goals/:goalId/tracker', element: <GoalTrackerPage /> },
          { path: 'shopping', element: <PlaceholderFlowPage /> },
          {
            path: 'lists/new',
            element: <Navigate to="/app/lists?crear=1" replace />,
          },
          { path: 'lists', element: <ListsPage /> },
          { path: 'flashcards', element: <EnglishFlashcardsPage /> },
          { path: 'pomodoro', element: <PomodoroPage /> },
          { path: 'study-tools', element: <StudyToolsPage /> },
          { path: 'english-notes', element: <EnglishNotesPage /> },
        ],
      },
      { path: 'home', element: <Navigate to="/app" replace /> },
    ],
  },
])
