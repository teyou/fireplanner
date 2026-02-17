import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { StartPage } from '@/pages/StartPage'
import { InputsPage } from '@/pages/InputsPage'
import { ProjectionPage } from '@/pages/ProjectionPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReferencePage } from '@/pages/ReferencePage'
import { StressTestPage } from '@/pages/StressTestPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <StartPage /> },
      { path: '/inputs', element: <InputsPage /> },
      { path: '/projection', element: <ProjectionPage /> },
      { path: '/stress-test', element: <StressTestPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/reference', element: <ReferencePage /> },
      // Redirects: old input pages → /inputs
      { path: '/profile', element: <Navigate to="/inputs" replace /> },
      { path: '/income', element: <Navigate to="/inputs" replace /> },
      { path: '/cpf', element: <Navigate to="/inputs" replace /> },
      { path: '/property', element: <Navigate to="/inputs" replace /> },
      { path: '/allocation', element: <Navigate to="/inputs" replace /> },
      { path: '/spending', element: <Navigate to="/inputs" replace /> },
      { path: '/withdrawal', element: <Navigate to="/inputs" replace /> },
      // Redirects for old bookmarked URLs
      { path: '/monte-carlo', element: <Navigate to="/stress-test" replace /> },
      { path: '/backtest', element: <Navigate to="/stress-test" replace /> },
      { path: '/sequence-risk', element: <Navigate to="/stress-test" replace /> },
    ],
  },
])
