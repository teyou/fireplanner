import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateCpfContribution, calculateBrsFrsErs, estimateCpfLifePayout } from '@/lib/calculations/cpf'
import { getCpfRatesForAge } from '@/lib/data/cpfRates'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function CpfSection() {
  const { currentAge, annualIncome, cpfOA, cpfSA, cpfMA } = useProfileStore()

  const rates = getCpfRatesForAge(currentAge)
  const contribution = calculateCpfContribution(annualIncome, currentAge)
  const brsFrsErs = calculateBrsFrsErs(currentAge)
  const cpfLifeBasic = estimateCpfLifePayout(brsFrsErs.frs, 'basic')
  const cpfLifeStandard = estimateCpfLifePayout(brsFrsErs.frs, 'standard')

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
            <InfoTooltip text="Based on current 2024 values growing at 3.5% p.a. These are the amounts needed in your RA at 55." />
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">BRS (Basic)</div>
              <div className="font-semibold">{formatCurrency(brsFrsErs.brs)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">FRS (Full)</div>
              <div className="font-semibold">{formatCurrency(brsFrsErs.frs)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">ERS (Enhanced)</div>
              <div className="font-semibold">{formatCurrency(brsFrsErs.ers)}</div>
            </div>
          </div>
        </div>

        {/* CPF LIFE estimates */}
        <div>
          <h4 className="text-sm font-medium flex items-center mb-2">
            Estimated CPF LIFE Payouts (from age 65)
            <InfoTooltip text="Monthly payouts based on projected FRS at 55. Basic: ~5.4%, Standard: ~6.3% annual payout rate." />
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Basic Plan</div>
              <div className="font-semibold">
                {formatCurrency(cpfLifeBasic / 12)}/mo ({formatCurrency(cpfLifeBasic)}/yr)
              </div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Standard Plan</div>
              <div className="font-semibold">
                {formatCurrency(cpfLifeStandard / 12)}/mo ({formatCurrency(cpfLifeStandard)}/yr)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
