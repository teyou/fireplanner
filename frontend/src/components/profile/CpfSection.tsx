import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { calculateCpfContribution, calculateBrsFrsErs, estimateCpfLifePayout, calculateCpfLifePayoutAtAge, getRetirementSumAmount } from '@/lib/calculations/cpf'
import type { CpfLifePlan, CpfRetirementSum, CpfHousingMode } from '@/lib/types'
import { getCpfRatesForAge, BRS_2024, FRS_2024, ERS_2024 } from '@/lib/data/cpfRates'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function CpfSection() {
  const {
    currentAge, annualIncome, cpfOA, cpfSA, cpfMA,
    cpfLifeStartAge, cpfLifePlan, cpfRetirementSum,
    cpfHousingMode, cpfHousingMonthly, cpfHousingEndAge,
    validationErrors, setField,
  } = useProfileStore()
  const incomeStreams = useIncomeStore((s) => s.incomeStreams)

  const rates = getCpfRatesForAge(currentAge)
  const contribution = calculateCpfContribution(annualIncome, currentAge)
  const brsFrsErs = calculateBrsFrsErs(currentAge)

  // Check for manual CPF LIFE stream
  const hasManualCpfLife = incomeStreams.some(
    (s) => s.type === 'government' && s.isActive && s.name.toLowerCase().includes('cpf life')
  )

  // Projected payout
  const retirementSumAmount = getRetirementSumAmount(cpfRetirementSum, currentAge)
  const projectedPayout = calculateCpfLifePayoutAtAge(retirementSumAmount, cpfLifePlan, cpfLifeStartAge, cpfLifeStartAge)

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
            CPF LIFE Monthly Payouts (from age {cpfLifeStartAge})
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
                      const isSelected = s.key === cpfRetirementSum && p.key === cpfLifePlan
                      return (
                        <td
                          key={p.key}
                          className={`text-right p-1.5 font-semibold ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30 rounded' : ''}`}
                        >
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

        <Separator />

        {/* CPF LIFE Configuration */}
        <div>
          <h4 className="text-sm font-medium flex items-center mb-2">
            CPF LIFE Configuration
            <InfoTooltip text="Configure your CPF LIFE plan for retirement income projections. The projected payout will be automatically added to your income from the start age." />
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Age (65-75)</Label>
              <Input
                type="number"
                min={65}
                max={75}
                value={cpfLifeStartAge}
                onChange={(e) => setField('cpfLifeStartAge', parseInt(e.target.value) || 65)}
                className="h-8 border-blue-300"
              />
              {validationErrors.cpfLifeStartAge && (
                <p className="text-xs text-destructive">{validationErrors.cpfLifeStartAge}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Plan Type</Label>
              <select
                value={cpfLifePlan}
                onChange={(e) => setField('cpfLifePlan', e.target.value as CpfLifePlan)}
                className="flex h-8 w-full rounded-md border border-blue-300 bg-background px-2 py-1 text-sm"
              >
                <option value="basic">Basic (~5.4%)</option>
                <option value="standard">Standard (~6.3%)</option>
                <option value="escalating">Escalating (~4.8%, +2%/yr)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Retirement Sum</Label>
              <select
                value={cpfRetirementSum}
                onChange={(e) => setField('cpfRetirementSum', e.target.value as CpfRetirementSum)}
                className="flex h-8 w-full rounded-md border border-blue-300 bg-background px-2 py-1 text-sm"
              >
                <option value="brs">BRS ({formatCurrency(brsFrsErs.brs)})</option>
                <option value="frs">FRS ({formatCurrency(brsFrsErs.frs)})</option>
                <option value="ers">ERS ({formatCurrency(brsFrsErs.ers)})</option>
              </select>
            </div>
          </div>

          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">Projected annual payout: </span>
            <span className="font-semibold">{formatCurrency(projectedPayout)}/yr</span>
            <span className="text-muted-foreground"> ({formatCurrency(projectedPayout / 12)}/mo)</span>
          </div>

          {hasManualCpfLife && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
              Manual CPF LIFE income stream detected — automated CPF LIFE calculation is skipped to avoid double-counting.
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Note: SA to RA transfer at 55 and MA to SA overflow at 55 are not modeled. Projected SA at 55 is used as the CPF LIFE basis.
          </p>
        </div>

        <Separator />

        {/* CPF OA Housing */}
        <div>
          <h4 className="text-sm font-medium flex items-center mb-2">
            CPF OA Housing Deduction
            <InfoTooltip text="Monthly CPF OA deduction for housing loan repayment. Reduces OA balance growth in projections." />
          </h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Mode</Label>
              <select
                value={cpfHousingMode}
                onChange={(e) => setField('cpfHousingMode', e.target.value as CpfHousingMode)}
                className="flex h-8 w-full rounded-md border border-blue-300 bg-background px-2 py-1 text-sm"
              >
                <option value="none">None</option>
                <option value="simple">Simple (fixed monthly amount)</option>
                <option value="property-linked">Property-linked (from property analysis)</option>
              </select>
            </div>

            {cpfHousingMode === 'simple' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Monthly OA Deduction ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={cpfHousingMonthly}
                    onChange={(e) => setField('cpfHousingMonthly', parseFloat(e.target.value) || 0)}
                    className="h-8 border-blue-300"
                  />
                  {validationErrors.cpfHousingMonthly && (
                    <p className="text-xs text-destructive">{validationErrors.cpfHousingMonthly}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Age</Label>
                  <Input
                    type="number"
                    min={18}
                    max={100}
                    value={cpfHousingEndAge}
                    onChange={(e) => setField('cpfHousingEndAge', parseInt(e.target.value) || 55)}
                    className="h-8 border-blue-300"
                  />
                  {validationErrors.cpfHousingEndAge && (
                    <p className="text-xs text-destructive">{validationErrors.cpfHousingEndAge}</p>
                  )}
                </div>
              </div>
            )}

            {cpfHousingMode === 'property-linked' && (
              <p className="text-xs text-muted-foreground">
                Housing deduction will be computed from your property analysis mortgage details.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
