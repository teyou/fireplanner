import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
            <Select
              value={fireType}
              onValueChange={(v) => setField('fireType', v as FireType)}
            >
              <SelectTrigger className="border-blue-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular FIRE</SelectItem>
                <SelectItem value="lean">Lean FIRE (60%)</SelectItem>
                <SelectItem value="fat">Fat FIRE (150%)</SelectItem>
                <SelectItem value="coast">Coast FIRE</SelectItem>
                <SelectItem value="barista">Barista FIRE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(fireType === 'coast' || fireType === 'barista') && (
            <div className="col-span-1 md:col-span-2 p-3 rounded-md bg-primary/5 border border-primary/20 text-sm space-y-2">
              {fireType === 'coast' ? (
                <>
                  <p className="font-medium text-primary">Coast FIRE</p>
                  <p className="text-muted-foreground">
                    Your portfolio is large enough that compound growth alone will reach your full FIRE number by retirement — even if you never invest another dollar.
                    You still need to earn enough to cover current expenses, but you can stop saving. This frees you to take a lower-paying job, work fewer hours, or take career risks.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formula: FIRE Number / (1 + real return)<sup>years to retirement</sup> &mdash; easier to reach because time does the heavy lifting.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-primary">Barista FIRE</p>
                  <p className="text-muted-foreground">
                    Your portfolio is large enough to partially fund retirement expenses right now. You only need a small part-time income to cover the gap between your investment withdrawals and your living expenses.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formula: max(0, Expenses &minus; Portfolio &times; SWR) &mdash; harder to reach than Coast FIRE because you're already withdrawing, which exposes you to sequence-of-returns risk.
                  </p>
                </>
              )}
            </div>
          )}

          <div>
            <PercentInput
              label="Safe Withdrawal Rate (SWR)"
              value={swr}
              onChange={(v) => setField('swr', v)}
              error={validationErrors.swr}
              tooltip="The percentage of your portfolio you withdraw annually in retirement. 4% is the classic rule."
              step={0.1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This rate determines your FIRE Number — lower SWR = larger target.{' '}
              <Link to="/reference#swr" className="underline text-primary">Learn more</Link>
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              FIRE Number Basis
              <InfoTooltip text="Today's $: current expenses. At Retirement: inflation-adjusted to retirement age. At FIRE Age: inflation-adjusted to when you actually reach FIRE." />
            </Label>
            <Select
              value={fireNumberBasis}
              onValueChange={(v) => setField('fireNumberBasis', v as FireNumberBasis)}
            >
              <SelectTrigger className="border-blue-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today's $</SelectItem>
                <SelectItem value="retirement">At Retirement</SelectItem>
                <SelectItem value="fireAge">At FIRE Age</SelectItem>
              </SelectContent>
            </Select>
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
