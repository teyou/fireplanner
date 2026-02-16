import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateCpfContribution, calculateBrsFrsErs, estimateCpfLifePayout } from '@/lib/calculations/cpf'
import type { CpfLifePlan } from '@/lib/calculations/cpf'
import { getCpfRatesForAge, BRS_2024, FRS_2024, ERS_2024 } from '@/lib/data/cpfRates'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function CpfSection() {
  const { currentAge, annualIncome, cpfOA, cpfSA, cpfMA } = useProfileStore()

  const rates = getCpfRatesForAge(currentAge)
  const contribution = calculateCpfContribution(annualIncome, currentAge)
  const brsFrsErs = calculateBrsFrsErs(currentAge)

  // 3x3 payout grid: 3 plans x 3 retirement sums
  const plans: { key: CpfLifePlan; label: string; note: string }[] = [
    { key: 'basic', label: 'Basic', note: '~5.4%' },
    { key: 'standard', label: 'Standard', note: '~6.3%' },
    { key: 'escalating', label: 'Escalating', note: '~4.8%, +2%/yr' },
  ]
  const sums: { key: 'brs' | 'frs' | 'ers'; label: string; value: number; baseline: number }[] = [
    { key: 'brs', label: 'BRS', value: brsFrsErs.brs, baseline: BRS_2024 },
    { key: 'frs', label: 'FRS', value: brsFrsErs.frs, baseline: FRS_2024 },
    { key: 'ers', label: 'ERS', value: brsFrsErs.ers, baseline: ERS_2024 },
  ]

  const totalCpf = cpfOA + cpfSA + cpfMA

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CPF Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current rates */}
        <div>
          <h4 className="text-sm font-medium flex items-center mb-2">
            CPF Rates (Age {currentAge}, {rates.ageGroup})
            <InfoTooltip text="CPF contribution rates vary by age bracket. Rates shown are for your current age." />
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Employee</div>
              <div className="font-semibold">{formatPercent(rates.employeeRate)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Employer</div>
              <div className="font-semibold">{formatPercent(rates.employerRate)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-semibold">{formatPercent(rates.totalRate)}</div>
            </div>
          </div>
        </div>

        {/* Annual contribution estimate */}
        <div>
          <h4 className="text-sm font-medium mb-2">Annual CPF Contribution (estimated)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Employee</div>
              <div className="font-semibold">{formatCurrency(contribution.employee)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Employer</div>
              <div className="font-semibold">{formatCurrency(contribution.employer)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">OA</div>
              <div className="font-semibold">{formatCurrency(contribution.oaAllocation)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">SA</div>
              <div className="font-semibold">{formatCurrency(contribution.saAllocation)}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* CPF balance summary */}
        <div>
          <h4 className="text-sm font-medium mb-2">Current CPF Balances</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">OA</div>
              <div className="font-semibold text-green-600">{formatCurrency(cpfOA)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">SA</div>
              <div className="font-semibold text-green-600">{formatCurrency(cpfSA)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">MA</div>
              <div className="font-semibold text-green-600">{formatCurrency(cpfMA)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-semibold text-green-600">{formatCurrency(totalCpf)}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* BRS/FRS/ERS projections */}
        <div>
          <h4 className="text-sm font-medium flex items-center mb-2">
            Projected BRS/FRS/ERS at Age 55
            <InfoTooltip text="Based on 2024 values growing at 3.5% p.a. These are the amounts needed in your Retirement Account at 55." />
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {sums.map((s) => (
              <div key={s.key} className="p-2 bg-muted/50 rounded">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="font-semibold">{formatCurrency(s.value)}</div>
                <div className="text-xs text-muted-foreground">
                  2024: {formatCurrency(s.baseline)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CPF LIFE 3x3 payout grid */}
        <div>
          <h4 className="text-sm font-medium flex items-center mb-2">
            CPF LIFE Monthly Payouts (from age 65)
            <InfoTooltip text="Estimated monthly payouts based on projected retirement sums at 55. Basic: higher bequest. Standard: higher payout. Escalating: starts lower, increases 2%/yr to hedge inflation." />
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left p-1.5"></th>
                  {plans.map((p) => (
                    <th key={p.key} className="text-right p-1.5">
                      {p.label}
                      <div className="text-[10px] font-normal">({p.note})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sums.map((s) => (
                  <tr key={s.key} className="border-t border-border/50">
                    <td className="p-1.5 text-muted-foreground">
                      {s.label} ({formatCurrency(s.value)})
                    </td>
                    {plans.map((p) => {
                      const annual = estimateCpfLifePayout(s.value, p.key)
                      return (
                        <td key={p.key} className="text-right p-1.5 font-semibold">
                          {formatCurrency(annual / 12)}/mo
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
