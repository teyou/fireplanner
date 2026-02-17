import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function EmptyDashboardState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No data yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Set up your financial profile to see your FIRE dashboard. You'll get
          personalized metrics, progress tracking, and risk assessment.
        </p>
        <Button asChild>
          <Link to="/inputs">Set up your plan</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
