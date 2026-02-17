import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { StartPage } from '@/pages/StartPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { IncomePage } from '@/pages/IncomePage'
import { AllocationPage } from '@/pages/AllocationPage'
import { ProjectionPage } from '@/pages/ProjectionPage'
import { WithdrawalPage } from '@/pages/WithdrawalPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PropertyPage } from '@/pages/PropertyPage'
import { ReferencePage } from '@/pages/ReferencePage'
import { CpfPage } from '@/pages/CpfPage'
import { StressTestPage } from '@/pages/StressTestPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <StartPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/income', element: <IncomePage /> },
      { path: '/cpf', element: <CpfPage /> },
      { path: '/allocation', element: <AllocationPage /> },
      { path: '/projection', element: <ProjectionPage /> },
      { path: '/withdrawal', element: <WithdrawalPage /> },
      { path: '/stress-test', element: <StressTestPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/property', element: <PropertyPage /> },
      { path: '/reference', element: <ReferencePage /> },
      // Redirects for old bookmarked URLs
      { path: '/monte-carlo', element: <Navigate to="/stress-test" replace /> },
      { path: '/backtest', element: <Navigate to="/stress-test" replace /> },
      { path: '/sequence-risk', element: <Navigate to="/stress-test" replace /> },
    ],
  },
])
