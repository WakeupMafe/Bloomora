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

// #region agent log
const CHUNK_FAIL_KEY = 'bloomora_debug_force_chunk_fail'
function dbg(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {},
) {
  fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '06df44',
    },
    body: JSON.stringify({
      sessionId: '06df44',
      runId: 'post-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}
// #endregion

/**
 * Crea el lazy UNA vez (módulo). Antes se recreaba en cada render → remounts.
 */
function createLazyPage(
  factory: () => Promise<{ default: ComponentType }>,
  label?: string,
  pageId?: string,
): ComponentType {
  const Page = lazy(() => {
    // #region agent log
    dbg('A', 'router.tsx:createLazyPage', 'lazy import start', { pageId, label })
    const forceFail =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(CHUNK_FAIL_KEY) === '1'
    if (forceFail) {
      sessionStorage.removeItem(CHUNK_FAIL_KEY)
      const simulated = new TypeError(
        'Failed to fetch dynamically imported module: https://bloomora-m.netlify.app/assets/GoalsOverviewPage-D3aDu0xq.js',
      )
      dbg('A', 'router.tsx:createLazyPage', 'simulated chunk fail', {
        pageId,
        message: simulated.message,
      })
      return Promise.reject(simulated)
    }
    // #endregion
    return factory()
      .then((mod) => {
        // Import OK ⇒ deploy vigente; permitir un reload futuro si vuelve a pasar.
        clearChunkReloadFlag()
        // #region agent log
        dbg('C', 'router.tsx:createLazyPage', 'lazy import ok', { pageId })
        // #endregion
        return mod
      })
      .catch((err: unknown) => {
        // #region agent log
        dbg('A', 'router.tsx:createLazyPage', 'lazy import failed', {
          pageId,
          isChunkLoadError: isChunkLoadError(err),
          message: err instanceof Error ? err.message : String(err),
        })
        // #endregion
        throw err
      })
  })

  return function LazyRoutePage() {
    // #region agent log
    useEffect(() => {
      dbg('E', 'router.tsx:LazyRoutePage', 'lazy page mount', { pageId, label })
    }, [])
    // #endregion
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
    // #region agent log
    dbg('D', 'router.tsx:RouteChunkErrorFallback', 'route error surfaced', {
      isChunkLoadError: chunkError,
      message: error instanceof Error ? error.message : String(error),
    })
    // #endregion
    if (chunkError) {
      reloadOnceForStaleChunk('route-errorElement')
    }
  }, [chunkError, error])

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
  'EditProfilePage',
)

const GoalsOverviewPage = createLazyPage(
  () =>
    import('@/pages/GoalsOverviewPage').then((m) => ({
      default: m.GoalsOverviewPage,
    })),
  'Cargando metas…',
  'GoalsOverviewPage',
)

const GoalTrackerPage = createLazyPage(
  () =>
    import('@/pages/GoalTrackerPage').then((m) => ({
      default: m.GoalTrackerPage,
    })),
  'Cargando tracker…',
  'GoalTrackerPage',
)

const EnglishFlashcardsPage = createLazyPage(
  () =>
    import('@/pages/EnglishFlashcardsPage').then((m) => ({
      default: m.EnglishFlashcardsPage,
    })),
  'Cargando flashcards…',
  'EnglishFlashcardsPage',
)

const ListsPage = createLazyPage(
  () => import('@/pages/ListsPage').then((m) => ({ default: m.ListsPage })),
  'Cargando listas…',
  'ListsPage',
)

const PomodoroPage = createLazyPage(
  () =>
    import('@/pages/PomodoroPage').then((m) => ({ default: m.PomodoroPage })),
  'Cargando pomodoro…',
  'PomodoroPage',
)

const StudyToolsPage = createLazyPage(
  () =>
    import('@/pages/StudyToolsPage').then((m) => ({
      default: m.StudyToolsPage,
    })),
  'Cargando herramientas…',
  'StudyToolsPage',
)

const EnglishNotesPage = createLazyPage(
  () =>
    import('@/pages/EnglishNotesPage').then((m) => ({
      default: m.EnglishNotesPage,
    })),
  'Cargando apuntes…',
  'EnglishNotesPage',
)

const NewGoalPage = createLazyPage(
  () =>
    import('@/pages/NewGoalPage').then((m) => ({ default: m.NewGoalPage })),
  'Cargando…',
  'NewGoalPage',
)

const PlaceholderFlowPage = createLazyPage(
  () =>
    import('@/pages/PlaceholderFlowPage').then((m) => ({
      default: m.PlaceholderFlowPage,
    })),
  undefined,
  'PlaceholderFlowPage',
)

const DevThemePreviewPage = createLazyPage(
  () =>
    import('@/pages/DevThemePreviewPage').then((m) => ({
      default: m.DevThemePreviewPage,
    })),
  'Cargando…',
  'DevThemePreviewPage',
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
