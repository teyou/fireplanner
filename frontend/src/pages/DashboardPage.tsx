import { StatusPanel } from '@/components/dashboard/StatusPanel'
import { AccumulationChart } from '@/components/dashboard/AccumulationChart'
import { RiskDashboard } from '@/components/dashboard/RiskDashboard'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'

export function DashboardPage() {
  const metrics = useDashboardMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FIRE Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your financial independence snapshot. All metrics are computed from your profile, income, and allocation settings.
        </p>
      </div>

      <StatusPanel {...metrics} />
      <AccumulationChart />
      <RiskDashboard />
    </div>
  )
}
