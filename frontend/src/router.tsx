import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { StartPage } from '@/pages/StartPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { IncomePage } from '@/pages/IncomePage'
import { AllocationPage } from '@/pages/AllocationPage'
import { ProjectionPage } from '@/pages/ProjectionPage'
import { MonteCarloPage } from '@/pages/MonteCarloPage'
import { WithdrawalPage } from '@/pages/WithdrawalPage'
import { SequenceRiskPage } from '@/pages/SequenceRiskPage'
import { BacktestPage } from '@/pages/BacktestPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PropertyPage } from '@/pages/PropertyPage'
import { ReferencePage } from '@/pages/ReferencePage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <StartPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/income', element: <IncomePage /> },
      { path: '/allocation', element: <AllocationPage /> },
      { path: '/projection', element: <ProjectionPage /> },
      { path: '/monte-carlo', element: <MonteCarloPage /> },
      { path: '/withdrawal', element: <WithdrawalPage /> },
      { path: '/sequence-risk', element: <SequenceRiskPage /> },
      { path: '/backtest', element: <BacktestPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/property', element: <PropertyPage /> },
      { path: '/reference', element: <ReferencePage /> },
    ],
  },
])
