import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyDashboardState() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-dashed border-primary/20 p-1">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-6">
          <BarChart3 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No data yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-8">
          Set up your financial profile to see your FIRE dashboard. You'll get
          personalized metrics, progress tracking, and risk assessment.
        </p>
        <Button size="lg" asChild>
          <Link to="/inputs">Set up your plan</Link>
        </Button>
      </div>
    </div>
  )
}
