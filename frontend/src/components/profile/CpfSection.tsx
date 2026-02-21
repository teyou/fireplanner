import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NumberInput } from '@/components/shared/NumberInput'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useIncomeProjection } from '@/hooks/useIncomeProjection'
import { calculateCpfContribution, calculateBrsFrsErs, estimateCpfLifePayout, calculateCpfLifePayoutAtAge, getRetirementSumAmount } from '@/lib/calculations/cpf'
import type { CpfLifePlan, CpfRetirementSum, CpfHousingMode } from '@/lib/types'
import { getCpfRatesForAge, BRS_2024, FRS_2024, ERS_2024 } from '@/lib/data/cpfRates'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { CpfProjectionTable } from '@/components/cpf/CpfProjectionTable'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

export function CpfSection() {
  const {
    currentAge, retirementAge, annualIncome, cpfOA, cpfSA, cpfMA, cpfRA,
    cpfLifeStartAge, cpfLifePlan, cpfRetirementSum,
    cpfHousingMode, cpfHousingMonthly, cpfMortgageYearsLeft,
    lifeStage, retirementPhase, cpfLifeActualMonthlyPayout,
    validationErrors, setField,
  } = useProfileStore()
  const incomeStreams = useIncomeStore((s) => s.incomeStreams)

  // Phase-aware rendering only applies to post-fire users
  const isPostFire = lifeStage === 'post-fire'
  const effectivePhase = isPostFire ? retirementPhase : null

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

  const totalCpf = cpfOA + cpfSA + cpfMA + cpfRA

  // Project SA at 55 to check if user can reach selected retirement sum
  const { projection } = useIncomeProjection()
  const retirementSumShortfall = useMemo(() => {
    // Only relevant for pre-55 users
    if (currentAge >= 55) return null
    if (!projection) return null

    // Find projected CPF balances at age 54 (last year before 55 transfer)
    const rowAt54 = projection.find((r) => r.age === 54)
    if (!rowAt54) return null

    // At 55, OA + SA can be consolidated into RA
    const availableForRA = rowAt54.cpfOA + rowAt54.cpfSA
    if (availableForRA >= retirementSumAmount) return null

    return {
      shortfall: retirementSumAmount - availableForRA,
      projectedOaSa: availableForRA,
      requiredAmount: retirementSumAmount,
    }
  }, [projection, currentAge, retirementSumAmount])

  // 65+ phase: single card with monthly payout input
  if (effectivePhase === '65-plus') {
    const annualPayout = cpfLifeActualMonthlyPayout * 12
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            Monthly CPF LIFE Payout
            <InfoTooltip text="Enter the actual monthly payout amount from your CPF LIFE statement. This will be used directly in income projections instead of estimating from retirement sum." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-sm">
            <CurrencyInput
              label="Monthly Payout"
              value={cpfLifeActualMonthlyPayout}
              onChange={(v) => setField('cpfLifeActualMonthlyPayout', v)}
              error={validationErrors.cpfLifeActualMonthlyPayout}
              tooltip="Your actual CPF LIFE monthly payout amount"
            />
          </div>
          {cpfLifeActualMonthlyPayout > 0 && (
            <div className="p-2 bg-muted/50 rounded text-sm">
              <span className="text-muted-foreground">Annual CPF LIFE income: </span>
              <span className="font-semibold">{formatCurrency(annualPayout)}/yr</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 55-64 phase: simplified — RA balance + CPF LIFE config + projected payout
  if (effectivePhase === '55-to-64') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CPF LIFE Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <CurrencyInput
              label="Retirement Account (RA) Balance"
              value={cpfRA}
              onChange={(v) => setField('cpfRA', v)}
              error={validationErrors.cpfRA}
              tooltip="Your CPF Retirement Account balance. At 55, your SA was transferred to the RA per CPF rules. The RA funds your CPF LIFE payouts."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            At 55, your SA was transferred to a Retirement Account (RA) per CPF rules. The RA earns 4% interest and funds your CPF LIFE payouts.
          </p>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Age (65-75)</Label>
              <NumberInput
                integer
                min={65}
                max={75}
                value={cpfLifeStartAge}
                onChange={(v) => setField('cpfLifeStartAge', v)}
                className="h-8 border-blue-300"
              />
              {validationErrors.cpfLifeStartAge && (
                <p className="text-xs text-destructive">{validationErrors.cpfLifeStartAge}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Plan Type</Label>
              <Select
                value={cpfLifePlan}
                onValueChange={(v) => setField('cpfLifePlan', v as CpfLifePlan)}
              >
                <SelectTrigger className="h-8 border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (~5.4%)</SelectItem>
                  <SelectItem value="standard">Standard (~6.3%)</SelectItem>
                  <SelectItem value="escalating">Escalating (~4.8%, +2%/yr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Retirement Sum</Label>
              <Select
                value={cpfRetirementSum}
                onValueChange={(v) => setField('cpfRetirementSum', v as CpfRetirementSum)}
              >
                <SelectTrigger className="h-8 border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brs">BRS ({formatCurrency(brsFrsErs.brs)})</SelectItem>
                  <SelectItem value="frs">FRS ({formatCurrency(brsFrsErs.frs)})</SelectItem>
                  <SelectItem value="ers">ERS ({formatCurrency(brsFrsErs.ers)})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">Projected annual payout: </span>
            <span className="font-semibold">{formatCurrency(projectedPayout)}/yr</span>
            <span className="text-muted-foreground"> ({formatCurrency(projectedPayout / 12)}/mo)</span>
          </div>

          {cpfLifePlan === 'basic' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Basic Plan: ~15% of your RA is deducted as annuity premium at payout start.
              The remaining ~85% provides direct payouts until ~age 90.
              The actual premium rate (10-20%) is determined by CPF Board.
            </p>
          )}

          {hasManualCpfLife && (
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
              Manual CPF LIFE income stream detected — automated CPF LIFE calculation is skipped to avoid double-counting.
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default: full CPF section (null phase, before-55, or pre-fire users)
  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current CPF Status</CardTitle>
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
          <div className={cn('grid gap-2 text-sm', currentAge >= 55 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4')}>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">OA</div>
              <div className="font-semibold text-green-600">{formatCurrency(cpfOA)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">SA</div>
              <div className="font-semibold text-green-600">{formatCurrency(cpfSA)}</div>
            </div>
            {currentAge >= 55 && (
              <div className="p-2 bg-muted/50 rounded">
                <div className="text-xs text-muted-foreground">RA</div>
                <div className="font-semibold text-green-600">{formatCurrency(cpfRA)}</div>
              </div>
            )}
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">MA</div>
              <div className="font-semibold text-green-600">{formatCurrency(cpfMA)}</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-semibold text-green-600">{formatCurrency(totalCpf)}</div>
            </div>
          </div>
          {currentAge >= 55 && (
            <p className="mt-2 text-xs text-muted-foreground">
              At 55, your SA was transferred to a Retirement Account (RA) per CPF rules. The RA funds your CPF LIFE payouts.
            </p>
          )}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CPF Planning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <NumberInput
                integer
                min={65}
                max={75}
                value={cpfLifeStartAge}
                onChange={(v) => setField('cpfLifeStartAge', v)}
                className="h-8 border-blue-300"
              />
              {validationErrors.cpfLifeStartAge && (
                <p className="text-xs text-destructive">{validationErrors.cpfLifeStartAge}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Plan Type</Label>
              <Select
                value={cpfLifePlan}
                onValueChange={(v) => setField('cpfLifePlan', v as CpfLifePlan)}
              >
                <SelectTrigger className="h-8 border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (~5.4%)</SelectItem>
                  <SelectItem value="standard">Standard (~6.3%)</SelectItem>
                  <SelectItem value="escalating">Escalating (~4.8%, +2%/yr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Retirement Sum</Label>
              <Select
                value={cpfRetirementSum}
                onValueChange={(v) => setField('cpfRetirementSum', v as CpfRetirementSum)}
              >
                <SelectTrigger className="h-8 border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brs">BRS ({formatCurrency(brsFrsErs.brs)})</SelectItem>
                  <SelectItem value="frs">FRS ({formatCurrency(brsFrsErs.frs)})</SelectItem>
                  <SelectItem value="ers">ERS ({formatCurrency(brsFrsErs.ers)})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">Projected annual payout: </span>
            <span className="font-semibold">{formatCurrency(projectedPayout)}/yr</span>
            <span className="text-muted-foreground"> ({formatCurrency(projectedPayout / 12)}/mo)</span>
          </div>

          {cpfLifePlan === 'basic' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Basic Plan: ~15% of your RA is deducted as annuity premium at payout start.
              The remaining ~85% provides direct payouts until ~age 90.
              The actual premium rate (10-20%) is determined by CPF Board.
            </p>
          )}

          {retirementSumShortfall && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-medium">
                Projected CPF shortfall of {formatCurrency(retirementSumShortfall.shortfall)}
              </p>
              <p>
                Based on your income, your projected OA + SA at age 54 is {formatCurrency(retirementSumShortfall.projectedOaSa)}, which is below the {cpfRetirementSum.toUpperCase()} target of {formatCurrency(retirementSumShortfall.requiredAmount)}.
                You would need voluntary contributions or cash top-ups to reach this level.
              </p>
            </div>
          )}

          {hasManualCpfLife && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
              Manual CPF LIFE income stream detected — automated CPF LIFE calculation is skipped to avoid double-counting.
            </div>
          )}
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
              <Select
                value={cpfHousingMode}
                onValueChange={(v) => setField('cpfHousingMode', v as CpfHousingMode)}
              >
                <SelectTrigger className="h-8 border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="simple">Simple (fixed monthly amount)</SelectItem>
                  <SelectItem value="property-linked">Property-linked (from property analysis)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cpfHousingMode === 'simple' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Monthly OA Deduction ($)</Label>
                  <NumberInput
                    min={0}
                    value={cpfHousingMonthly}
                    onChange={(v) => setField('cpfHousingMonthly', v)}
                    className="h-8 border-blue-300"
                  />
                  {validationErrors.cpfHousingMonthly && (
                    <p className="text-xs text-destructive">{validationErrors.cpfHousingMonthly}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mortgage Years Remaining</Label>
                  <NumberInput
                    integer
                    min={0}
                    max={40}
                    value={cpfMortgageYearsLeft}
                    onChange={(v) => setField('cpfMortgageYearsLeft', v)}
                    className="h-8 border-blue-300"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deductions end at age {currentAge + cpfMortgageYearsLeft}
                  </p>
                  {currentAge + cpfMortgageYearsLeft > retirementAge && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Mortgage extends {currentAge + cpfMortgageYearsLeft - retirementAge} years past retirement (age {retirementAge}). Post-retirement payments will draw from CPF OA or liquid portfolio.
                    </p>
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

        <Separator />

        {/* CPF Projection Table */}
        <div>
          <h4 className="text-sm font-medium flex items-center mb-2">
            Year-by-Year CPF Projection
            <InfoTooltip text="Projected CPF balances based on your income model, contribution rates, and CPF LIFE configuration. Milestone rows are highlighted when balances cross BRS/FRS/ERS thresholds." />
          </h4>
          <CpfProjectionTable />
        </div>
      </CardContent>
    </Card>
    </>
  )
}
