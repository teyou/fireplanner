import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'
import { formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function AdvancedOverrides() {
  const {
    returnOverrides,
    stdDevOverrides,
    setReturnOverride,
    setStdDevOverride,
  } = useAllocationStore()

  const hasAnyOverride = returnOverrides.some((v) => v !== null) || stdDevOverrides.some((v) => v !== null)

  function handleReturnChange(index: number, value: string) {
    if (value === '' || value === '-') {
      setReturnOverride(index, null)
      return
    }
    const pct = parseFloat(value)
    if (!isNaN(pct)) setReturnOverride(index, pct / 100)
  }

  function handleStdDevChange(index: number, value: string) {
    if (value === '' || value === '-') {
      setStdDevOverride(index, null)
      return
    }
    const pct = parseFloat(value)
    if (!isNaN(pct)) setStdDevOverride(index, pct / 100)
  }

  function resetAll() {
    for (let i = 0; i < 8; i++) {
      setReturnOverride(i, null)
      setStdDevOverride(i, null)
    }
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="overrides" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-medium">
          Override Default Return Assumptions
          {hasAnyOverride && (
            <span className="ml-2 text-xs text-blue-600 font-normal">(custom overrides active)</span>
          )}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Override the default expected returns and standard deviations for individual asset classes.
              Leave blank to use defaults.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Asset Class</th>
                    <th className="text-right py-2 px-2 font-medium w-32">Expected Return %</th>
                    <th className="text-right py-2 pl-2 font-medium w-32">Std Dev %</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSET_CLASSES.map((ac, i) => (
                    <tr key={ac.key} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{ac.label}</td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          placeholder={formatPercent(ac.expectedReturn, 1).replace('%', '')}
                          value={returnOverrides[i] !== null ? (returnOverrides[i]! * 100).toFixed(1) : ''}
                          onChange={(e) => handleReturnChange(i, e.target.value)}
                          step={0.1}
                          className={cn(
                            'text-right h-8',
                            returnOverrides[i] !== null ? 'border-blue-500' : 'border-muted'
                          )}
                        />
                      </td>
                      <td className="py-2 pl-2">
                        <Input
                          type="number"
                          placeholder={formatPercent(ac.stdDev, 1).replace('%', '')}
                          value={stdDevOverrides[i] !== null ? (stdDevOverrides[i]! * 100).toFixed(1) : ''}
                          onChange={(e) => handleStdDevChange(i, e.target.value)}
                          step={0.1}
                          min={0}
                          className={cn(
                            'text-right h-8',
                            stdDevOverrides[i] !== null ? 'border-blue-500' : 'border-muted'
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasAnyOverride && (
              <Button variant="outline" size="sm" onClick={resetAll}>
                Reset to Defaults
              </Button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
