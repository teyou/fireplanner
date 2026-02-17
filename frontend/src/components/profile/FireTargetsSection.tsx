import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useProfileStore } from '@/stores/useProfileStore'
import { useFireCalculations } from '@/hooks/useFireCalculations'
import { useProjection } from '@/hooks/useProjection'
import { PercentInput } from '@/components/shared/PercentInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { FireType, FireNumberBasis } from '@/lib/types'

export function FireTargetsSection() {
  const { fireType, swr, fireNumberBasis, inflation, retirementAge, currentAge, liquidNetWorth, setField, validationErrors } = useProfileStore()
  const { metrics, hasErrors } = useFireCalculations()
  const { summary: projSummary } = useProjection()

  // Prefer projection's simulated FIRE age over NPER estimate
  const projFireAge = projSummary?.fireAchievedAge ?? null
  const effectiveFireAge = projFireAge ?? (metrics ? metrics.fireAge : null)
  const effectiveYearsToFire = effectiveFireAge !== null ? Math.max(0, effectiveFireAge - currentAge) : null
  const isSimulated = projFireAge !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">FIRE Targets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              FIRE Type
              <InfoTooltip text="Regular: full expenses. Lean: 60%. Fat: 150%. Coast: let portfolio grow. Barista: part-time income." />
            </Label>
            <select
              value={fireType}
              onChange={(e) => setField('fireType', e.target.value as FireType)}
              className="flex h-10 w-full rounded-md border border-blue-300 bg-background px-3 py-2 text-sm"
            >
              <option value="regular">Regular FIRE</option>
              <option value="lean">Lean FIRE (60%)</option>
              <option value="fat">Fat FIRE (150%)</option>
              <option value="coast">Coast FIRE</option>
              <option value="barista">Barista FIRE</option>
            </select>
          </div>

          <PercentInput
            label="Safe Withdrawal Rate (SWR)"
            value={swr}
            onChange={(v) => setField('swr', v)}
            error={validationErrors.swr}
            tooltip="The percentage of your portfolio you withdraw annually in retirement. 4% is the classic rule."
            step={0.1}
          />

          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              FIRE Number Basis
              <InfoTooltip text="Today's $: current expenses. At Retirement: inflation-adjusted to retirement age. At FIRE Age: inflation-adjusted to when you actually reach FIRE." />
            </Label>
            <select
              value={fireNumberBasis}
              onChange={(e) => setField('fireNumberBasis', e.target.value as FireNumberBasis)}
              className="flex h-10 w-full rounded-md border border-blue-300 bg-background px-3 py-2 text-sm"
            >
              <option value="today">Today's $</option>
              <option value="retirement">At Retirement</option>
              <option value="fireAge">At FIRE Age</option>
            </select>
            {fireNumberBasis === 'retirement' && (
              <p className="text-xs text-muted-foreground">
                Inflation-adjusted to age {retirementAge} at {(inflation * 100).toFixed(1)}%
              </p>
            )}
            {fireNumberBasis === 'fireAge' && effectiveFireAge !== null && isFinite(effectiveFireAge) && (
              <p className="text-xs text-muted-foreground">
                Inflation-adjusted to FIRE age {Math.ceil(effectiveFireAge)} at {(inflation * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* Computed Metrics */}
        {hasErrors ? (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            Fix input errors above to see FIRE calculations.
          </div>
        ) : metrics ? (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progress to FIRE</span>
                <span className="font-semibold">{formatPercent(Math.min(metrics.progress, 1))}</span>
              </div>
              <Progress value={Math.min(metrics.progress * 100, 100)} />
            </div>

            {/* Headline metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                label="FIRE Number"
                value={formatCurrency(metrics.fireNumber)}
                subtitle={
                  fireType === 'lean'
                    ? '60% of expenses'
                    : fireType === 'fat'
                      ? '150% of expenses'
                      : undefined
                }
                tooltip={
                  fireType === 'lean'
                    ? 'Lean FIRE: 60% of annual expenses / SWR'
                    : fireType === 'fat'
                      ? 'Fat FIRE: 150% of annual expenses / SWR'
                      : 'Annual expenses / SWR'
                }
              />
              <MetricCard
                label="Years to FIRE"
                value={
                  effectiveYearsToFire !== null && effectiveYearsToFire === 0
                    ? 'Achieved!'
                    : effectiveYearsToFire !== null && isFinite(effectiveYearsToFire)
                      ? Math.ceil(effectiveYearsToFire).toString()
                      : isFinite(metrics.yearsToFire)
                        ? Math.ceil(metrics.yearsToFire).toString()
                        : 'N/A'
                }
                subtitle={isSimulated ? 'simulated' : 'estimate'}
                tooltip={isSimulated
                  ? "Year-by-year projection with income growth, CPF, and tax"
                  : "NPER formula using constant savings and net real return"
                }
              />
              <MetricCard
                label="FIRE Age"
                value={
                  effectiveFireAge !== null && isFinite(effectiveFireAge)
                    ? Math.ceil(effectiveFireAge).toString()
                    : isFinite(metrics.fireAge)
                      ? Math.ceil(metrics.fireAge).toString()
                      : 'N/A'
                }
                subtitle={isSimulated ? 'simulated' : 'estimate'}
              />
              <MetricCard
                label="Savings Rate"
                value={formatPercent(metrics.savingsRate)}
                tooltip="Annual savings / annual income"
              />
              <MetricCard
                label="Coast FIRE"
                value={formatCurrency(metrics.coastFireNumber)}
                tooltip="Amount needed today for compound growth to reach FIRE number by retirement"
              />
              <MetricCard
                label="Barista FIRE Income"
                value={formatCurrency(metrics.baristaFireIncome) + '/yr'}
                tooltip="Part-time income needed if you stop saving but portfolio covers partial expenses"
              />
            </div>

            {/* CPF Dependency Warning */}
            {metrics.cpfDependency && (
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  FIRE depends on CPF — liquid portfolio covers {formatPercent(metrics.fireNumber > 0 ? liquidNetWorth / metrics.fireNumber : 0)} of target
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  CPF funds are not freely accessible before 55 and are subject to withdrawal limits. Your liquid portfolio alone does not meet your FIRE number.
                </p>
                {metrics.liquidBridgeGapYears !== null && metrics.liquidBridgeGapYears > 0 && metrics.liquidDepletionAge !== null && (
                  <p className="text-amber-700 dark:text-amber-300">
                    Liquid portfolio may deplete at age {metrics.liquidDepletionAge}, which is {metrics.liquidBridgeGapYears} years before CPF LIFE starts. Consider building a larger liquid buffer.
                  </p>
                )}
              </div>
            )}

            {/* FIRE Age > Retirement Age Warning */}
            {effectiveFireAge !== null && isFinite(effectiveFireAge) && effectiveFireAge > retirementAge && (
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  FIRE age ({Math.ceil(effectiveFireAge)}) is after retirement age ({retirementAge})
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  You may not have enough saved when you retire. Consider reducing retirement spending, increasing savings, or adjusting your retirement age.
                </p>
              </div>
            )}

            {/* Lean / Fat reference badges — hide the one matching current fireType */}
            <div className="flex gap-2 flex-wrap">
              {fireType !== 'lean' && (
                <Badge variant="secondary">
                  Lean FIRE: {formatCurrency(metrics.leanFireNumber)}
                </Badge>
              )}
              {fireType !== 'fat' && (
                <Badge variant="secondary">
                  Fat FIRE: {formatCurrency(metrics.fatFireNumber)}
                </Badge>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  subtitle,
  tooltip,
}: {
  label: string
  value: string
  subtitle?: string
  tooltip?: string
}) {
  return (
    <div className="p-3 rounded-md bg-muted/50">
      <div className="text-xs text-muted-foreground flex items-center">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  )
}
