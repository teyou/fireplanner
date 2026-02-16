import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { formatCurrency } from '@/lib/utils'

export function StartPage() {
  const { metrics } = useFireCalculations()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Singapore FIRE Planner</h1>
        <p className="text-muted-foreground mt-2">
          Plan your path to Financial Independence with Singapore-specific calculations.
        </p>
      </div>

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(metrics.fireNumber)}
                </div>
                <div className="text-sm text-muted-foreground">FIRE Number</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {metrics.yearsToFire === 0
                    ? 'Achieved!'
                    : isFinite(metrics.yearsToFire)
                      ? `${Math.ceil(metrics.yearsToFire)} years`
                      : '—'}
                </div>
                <div className="text-sm text-muted-foreground">Years to FIRE</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/profile">
          <Button variant="outline" className="w-full h-auto py-4 justify-start">
            <div className="text-left">
              <div className="font-semibold">FIRE Profile</div>
              <div className="text-sm text-muted-foreground">Set your age, income, expenses, and FIRE targets</div>
            </div>
          </Button>
        </Link>
        <Link to="/income">
          <Button variant="outline" className="w-full h-auto py-4 justify-start">
            <div className="text-left">
              <div className="font-semibold">Income Engine</div>
              <div className="text-sm text-muted-foreground">Model your salary, streams, and tax</div>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  )
}
