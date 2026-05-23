import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { AppLayout } from '@/layouts/AppLayout'
import { RootLayout } from '@/layouts/RootLayout'
import { DayHomePage } from '@/pages/DayHomePage'
import { PhoneGatePage } from '@/pages/PhoneGatePage'
import { QuickEntryPage } from '@/pages/QuickEntryPage'
import { WelcomePage } from '@/pages/WelcomePage'

function lazyPage(
  factory: () => Promise<{ default: ComponentType }>,
  label?: string,
) {
  const Page = lazy(factory)
  return (
    <Suspense fallback={<PageSpinner label={label} />}>
      <Page />
    </Suspense>
  )
}

const EditProfilePage = () =>
  lazyPage(
    () =>
      import('@/pages/EditProfilePage').then((m) => ({
        default: m.EditProfilePage,
      })),
    'Cargando perfil…',
  )

const GoalsOverviewPage = () =>
  lazyPage(
    () =>
      import('@/pages/GoalsOverviewPage').then((m) => ({
        default: m.GoalsOverviewPage,
      })),
    'Cargando metas…',
  )

const GoalTrackerPage = () =>
  lazyPage(
    () =>
      import('@/pages/GoalTrackerPage').then((m) => ({
        default: m.GoalTrackerPage,
      })),
    'Cargando tracker…',
  )

const EnglishFlashcardsPage = () =>
  lazyPage(
    () =>
      import('@/pages/EnglishFlashcardsPage').then((m) => ({
        default: m.EnglishFlashcardsPage,
      })),
    'Cargando flashcards…',
  )

const ListsPage = () =>
  lazyPage(
    () =>
      import('@/pages/ListsPage').then((m) => ({ default: m.ListsPage })),
    'Cargando listas…',
  )

const NewGoalPage = () =>
  lazyPage(
    () =>
      import('@/pages/NewGoalPage').then((m) => ({ default: m.NewGoalPage })),
    'Cargando…',
  )

const PlaceholderFlowPage = () =>
  lazyPage(
    () =>
      import('@/pages/PlaceholderFlowPage').then((m) => ({
        default: m.PlaceholderFlowPage,
      })),
  )

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <WelcomePage /> },
      { path: 'entrar', element: <QuickEntryPage /> },
      { path: 'phone', element: <PhoneGatePage /> },
      {
        path: 'app',
        element: <AppLayout />,
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
          { path: 'lists/new', element: <PlaceholderFlowPage /> },
          { path: 'lists', element: <ListsPage /> },
          { path: 'flashcards', element: <EnglishFlashcardsPage /> },
        ],
      },
      { path: 'home', element: <Navigate to="/app" replace /> },
    ],
  },
])
