import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { RootLayout } from '@/layouts/RootLayout'
import { DayHomePage } from '@/pages/DayHomePage'
import { EditProfilePage } from '@/pages/EditProfilePage'
import { GoalsOverviewPage } from '@/pages/GoalsOverviewPage'
import { GoalTrackerPage } from '@/pages/GoalTrackerPage'
import { ListsPage } from '@/pages/ListsPage'
import { NewGoalPage } from '@/pages/NewGoalPage'
import { PhoneGatePage } from '@/pages/PhoneGatePage'
import { QuickEntryPage } from '@/pages/QuickEntryPage'
import { PlaceholderFlowPage } from '@/pages/PlaceholderFlowPage'
import { WelcomePage } from '@/pages/WelcomePage'

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
        ],
      },
      { path: 'home', element: <Navigate to="/app" replace /> },
    ],
  },
])
