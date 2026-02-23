import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { StartPage } from '@/pages/StartPage'
import { InputsPage } from '@/pages/InputsPage'
import { ProjectionPage } from '@/pages/ProjectionPage'
import { WithdrawalPage } from '@/pages/WithdrawalPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReferencePage } from '@/pages/ReferencePage'
import { StressTestPage } from '@/pages/StressTestPage'
import { ChecklistPage } from '@/pages/ChecklistPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <StartPage /> },
      { path: '/inputs', element: <InputsPage /> },
      { path: '/projection', element: <ProjectionPage /> },
      { path: '/withdrawal', element: <WithdrawalPage /> },
      { path: '/stress-test', element: <StressTestPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/reference', element: <ReferencePage /> },
      { path: '/checklist', element: <ChecklistPage /> },
      // Redirects: old input pages → /inputs with section anchors
      { path: '/profile', element: <Navigate to="/inputs#section-personal" replace /> },
      { path: '/income', element: <Navigate to="/inputs#section-income" replace /> },
      { path: '/cpf', element: <Navigate to="/inputs#section-cpf" replace /> },
      { path: '/property', element: <Navigate to="/inputs#section-property" replace /> },
      { path: '/allocation', element: <Navigate to="/inputs#section-allocation" replace /> },
      { path: '/spending', element: <Navigate to="/inputs#section-expenses" replace /> },
      // Redirects for old bookmarked URLs
      { path: '/monte-carlo', element: <Navigate to="/stress-test" replace /> },
      { path: '/backtest', element: <Navigate to="/stress-test" replace /> },
      { path: '/sequence-risk', element: <Navigate to="/stress-test" replace /> },
    ],
  },
])
