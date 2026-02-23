import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { useProjection } from '@/hooks/useProjection'
import { generateProjection } from '@/lib/calculations/projection'
import { calculatePortfolioReturn } from '@/lib/calculations/portfolio'
import { computeHdbSublettingIncome, computeLbsProceeds } from '@/lib/calculations/hdb'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useIncomeProjection } from '@/hooks/useIncomeProjection'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'
import { formatCurrency } from '@/lib/utils'

/**
 * Shows the impact of financial goals on FIRE timeline by comparing
 * projection with goals vs projection without goals.
 */
export function GoalImpactSummary() {
  const profile = useProfileStore()
  const allocation = useAllocationStore()
  const simulation = useSimulationStore()
  const property = usePropertyStore()
  const { projection: incomeProjection, hasErrors: incomeHasErrors } = useIncomeProjection()
  const { metrics: fireMetrics, hasErrors: fireHasErrors } = useFireCalculations()
  const { summary: withGoalsSummary } = useProjection()

  const noGoalsSummary = useMemo(() => {
    if (incomeHasErrors || fireHasErrors || !incomeProjection || !fireMetrics) return null
    if (profile.financialGoals.length === 0) return null

    const assetReturns = ASSET_CLASSES.map((ac, i) =>
      allocation.returnOverrides[i] ?? ac.expectedReturn
    )

    const allocationErrors = allocation.validationErrors
    const allocationHasErrors = Object.keys(allocationErrors).length > 0
    let effectiveReturn = profile.expectedReturn
    if (profile.usePortfolioReturn && !allocationHasErrors) {
      effectiveReturn = calculatePortfolioReturn(allocation.currentWeights, assetReturns)
    }

    const isLbs = property.ownsProperty
      && property.propertyType === 'hdb'
      && property.hdbMonetizationStrategy === 'lbs'
    const lbsResult = isLbs
      ? computeLbsProceeds({
          flatValue: property.existingPropertyValue,
          remainingLease: property.leaseYears,
          retainedLease: property.hdbLbsRetainedLease,
          cpfRaBalance: profile.cpfRA,
          retirementSum: 213000,
        })
      : null

    const { summary } = generateProjection({
      incomeProjection,
      currentAge: profile.currentAge,
      retirementAge: profile.retirementAge,
      lifeExpectancy: profile.lifeExpectancy,
      initialLiquidNW: profile.liquidNetWorth + (lbsResult?.cashProceeds ?? 0),
      swr: profile.swr,
      expectedReturn: effectiveReturn,
      usePortfolioReturn: profile.usePortfolioReturn && !allocationHasErrors,
      inflation: profile.inflation,
      expenseRatio: profile.expenseRatio,
      annualExpenses: profile.annualExpenses,
      retirementSpendingAdjustment: profile.retirementSpendingAdjustment,
      fireNumber: fireMetrics.fireNumber,
      currentWeights: allocation.currentWeights,
      targetWeights: allocation.targetWeights,
      assetReturns,
      glidePathConfig: allocation.glidePathConfig,
      withdrawalStrategy: simulation.selectedStrategy,
      strategyParams: simulation.strategyParams,
      propertyEquity: property.ownsProperty
        ? Math.max(0, property.existingPropertyValue - property.existingMortgageBalance)
        : 0,
      annualMortgagePayment: property.ownsProperty ? property.existingMonthlyPayment * 12 : 0,
      annualRentalIncome: property.ownsProperty
        ? property.existingRentalIncome * 12 + (
            property.propertyType === 'hdb' && property.hdbMonetizationStrategy === 'sublet'
              ? computeHdbSublettingIncome({
                  rooms: property.hdbSublettingRooms,
                  monthlyRate: property.hdbSublettingRate,
                }).annualGross
              : 0
          )
        : 0,
      downsizing: property.ownsProperty && property.downsizing.scenario !== 'none'
        ? property.downsizing
        : null,
      existingMortgageBalance: property.existingMortgageBalance,
      existingMortgageRate: property.existingMortgageRate,
      existingMonthlyPayment: property.existingMonthlyPayment,
      existingMortgageRemainingYears: property.existingMortgageRemainingYears,
      residencyForAbsd: property.residencyForAbsd,
      parentSupport: profile.parentSupport,
      parentSupportEnabled: profile.parentSupportEnabled,
      healthcareConfig: profile.healthcareConfig?.enabled ? profile.healthcareConfig : null,
      retirementWithdrawals: profile.retirementWithdrawals,
      financialGoals: [],  // No goals for comparison
    })

    return summary
  }, [
    incomeProjection, incomeHasErrors, fireMetrics, fireHasErrors,
    profile.financialGoals, profile.currentAge, profile.retirementAge,
    profile.lifeExpectancy, profile.liquidNetWorth, profile.swr,
    profile.expectedReturn, profile.usePortfolioReturn, profile.inflation,
    profile.expenseRatio, profile.annualExpenses, profile.retirementSpendingAdjustment,
    profile.parentSupport, profile.parentSupportEnabled, profile.healthcareConfig,
    profile.retirementWithdrawals, profile.cpfRA,
    allocation.currentWeights, allocation.targetWeights, allocation.returnOverrides,
    allocation.glidePathConfig, allocation.validationErrors,
    simulation.selectedStrategy, simulation.strategyParams,
    property.ownsProperty, property.existingPropertyValue, property.existingMortgageBalance,
    property.existingMonthlyPayment, property.existingRentalIncome,
    property.existingMortgageRate, property.existingMortgageRemainingYears,
    property.downsizing, property.residencyForAbsd, property.propertyType,
    property.hdbMonetizationStrategy, property.hdbSublettingRooms, property.hdbSublettingRate,
    property.hdbLbsRetainedLease, property.leaseYears,
  ])

  // Don't show if there are no goals or no data
  if (profile.financialGoals.length === 0) return null
  if (!withGoalsSummary || !noGoalsSummary) return null

  const fireAgeWith = withGoalsSummary.fireAchievedAge
  const fireAgeWithout = noGoalsSummary.fireAchievedAge
  const terminalWith = withGoalsSummary.terminalLiquidNW
  const terminalWithout = noGoalsSummary.terminalLiquidNW

  const totalGoalCost = profile.financialGoals.reduce((sum, g) => sum + g.amount, 0)

  // Compute FIRE delay
  let fireDelayText: string
  let fireDelayColor: string
  if (fireAgeWith === null && fireAgeWithout === null) {
    fireDelayText = 'FIRE not achieved in either scenario'
    fireDelayColor = 'text-muted-foreground'
  } else if (fireAgeWith === null && fireAgeWithout !== null) {
    fireDelayText = `Goals prevent FIRE (was age ${fireAgeWithout})`
    fireDelayColor = 'text-destructive'
  } else if (fireAgeWith !== null && fireAgeWithout === null) {
    fireDelayText = `FIRE at age ${fireAgeWith} (not reachable without goals adjustment)`
    fireDelayColor = 'text-muted-foreground'
  } else if (fireAgeWith !== null && fireAgeWithout !== null) {
    const delay = fireAgeWith - fireAgeWithout
    if (delay === 0) {
      fireDelayText = `No delay — FIRE at age ${fireAgeWith}`
      fireDelayColor = 'text-green-600 dark:text-green-400'
    } else if (delay > 0) {
      fireDelayText = `FIRE delayed from age ${fireAgeWithout} to ${fireAgeWith} (+${delay} year${delay > 1 ? 's' : ''})`
      fireDelayColor = 'text-amber-600 dark:text-amber-400'
    } else {
      // Goals somehow accelerate FIRE (unlikely but handle)
      fireDelayText = `FIRE at age ${fireAgeWith} (${Math.abs(delay)} year${Math.abs(delay) > 1 ? 's' : ''} earlier)`
      fireDelayColor = 'text-green-600 dark:text-green-400'
    }
  } else {
    fireDelayText = ''
    fireDelayColor = ''
  }

  const portfolioDelta = terminalWith - terminalWithout

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Goal Impact
          <InfoTooltip text="Shows how your financial goals affect your FIRE timeline and terminal portfolio." />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Goal Cost</p>
            <p className="text-lg font-semibold">{formatCurrency(totalGoalCost)}</p>
            <p className="text-xs text-muted-foreground">
              across {profile.financialGoals.length} goal{profile.financialGoals.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">FIRE Timeline</p>
            <p className={`text-sm font-medium ${fireDelayColor}`}>{fireDelayText}</p>
          </div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Terminal Portfolio Impact</p>
          <p className="text-sm">
            <span className="font-semibold">{formatCurrency(terminalWith)}</span>
            <span className="text-muted-foreground"> vs </span>
            <span className="font-semibold">{formatCurrency(terminalWithout)}</span>
            <span className="text-muted-foreground"> without goals </span>
            <span className={portfolioDelta < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}>
              ({portfolioDelta >= 0 ? '+' : ''}{formatCurrency(portfolioDelta)})
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
