import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { getStrategyLabel } from '@/hooks/useWithdrawalComparison'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { WithdrawalStrategyType } from '@/lib/types'

const STRATEGY_GROUPS: { label: string; strategies: WithdrawalStrategyType[] }[] = [
  {
    label: 'Basic',
    strategies: ['constant_dollar', 'percent_of_portfolio', 'one_over_n'],
  },
  {
    label: 'Adaptive',
    strategies: ['vpw', 'guardrails', 'vanguard_dynamic', 'ninety_five_percent'],
  },
  {
    label: 'Smoothed',
    strategies: ['cape_based', 'floor_ceiling', 'endowment', 'sensible_withdrawals', 'hebeler_autopilot'],
  },
]

const STRATEGY_DESCRIPTIONS: Record<WithdrawalStrategyType, string> = {
  constant_dollar: 'Withdraw a fixed inflation-adjusted amount each year (the classic 4% rule).',
  vpw: 'Withdraw a variable percentage based on remaining years and portfolio size.',
  guardrails: 'Inflation-adjust spending but cut/raise when portfolio hits guardrails.',
  vanguard_dynamic: 'Target a percentage of portfolio with ceiling and floor limits on changes.',
  cape_based: 'Blend CAPE earnings yield with a base rate, adjusting for valuation.',
  floor_ceiling: 'Withdraw a percentage of portfolio, clamped between floor and ceiling amounts.',
  percent_of_portfolio: 'Withdraw a fixed percentage of the current portfolio each year.',
  one_over_n: 'Withdraw portfolio / remaining years. Spends everything by end.',
  sensible_withdrawals: 'Base rate + share of prior year gains. Conservative base with upside.',
  ninety_five_percent: 'Never less than 95% of last year. Protects income in downturns.',
  endowment: 'Smoothed blend of inflation-adjusted prior and market-based target (Yale model).',
  hebeler_autopilot: '75% inflation-adjusted prior + 25% PMT-based annuity factor.',
}

export function StrategyParamsSection() {
  const withdrawal = useWithdrawalStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Selection & Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">
            Active Strategies
            <InfoTooltip text="Toggle strategies on/off to include in the comparison. Each selected strategy runs on a deterministic median-return path." />
          </Label>
          <div className="space-y-3">
            {STRATEGY_GROUPS.map((group) => (
              <div key={group.label}>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.label}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {group.strategies.map((s) => {
                    const active = withdrawal.selectedStrategies.includes(s)
                    return (
                      <Button
                        key={s}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => withdrawal.toggleStrategy(s)}
                      >
                        {getStrategyLabel(s)}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {withdrawal.validationErrors.selectedStrategies && (
            <p className="text-sm text-destructive mt-1">{withdrawal.validationErrors.selectedStrategies}</p>
          )}
        </div>

        {withdrawal.selectedStrategies.map((strategy) => (
          <StrategyParamCard key={strategy} strategy={strategy} />
        ))}
      </CardContent>
    </Card>
  )
}

function StrategyParamCard({ strategy }: { strategy: WithdrawalStrategyType }) {
  const withdrawal = useWithdrawalStore()
  const simulation = useSimulationStore()
  const params = withdrawal.strategyParams[strategy]

  const setParam = (field: string, value: number) => {
    withdrawal.setStrategyParam(
      strategy,
      field as keyof typeof params,
      value
    )
    // Keep simulation store in sync so Monte Carlo uses same params
    simulation.setStrategyParam(
      strategy,
      field as keyof typeof params,
      value
    )
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{getStrategyLabel(strategy)}</Badge>
        <span className="text-xs text-muted-foreground">{STRATEGY_DESCRIPTIONS[strategy]}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {strategy === 'constant_dollar' && (
          <ParamInput label="SWR" value={(params as { swr: number }).swr * 100} onChange={(v) => setParam('swr', v / 100)} suffix="%" step={0.1} />
        )}
        {strategy === 'vpw' && (
          <>
            <ParamInput label="Expected Real Return" value={(params as { expectedRealReturn: number }).expectedRealReturn * 100} onChange={(v) => setParam('expectedRealReturn', v / 100)} suffix="%" step={0.1} />
            <ParamInput label="Legacy Buffer" value={(params as { targetEndValue: number }).targetEndValue * 100} onChange={(v) => setParam('targetEndValue', v / 100)} suffix="%" step={1} tooltip="Percentage of portfolio to aim to keep at end of retirement. Set to 0% for Dynamic SWR behavior (spend everything)." />
          </>
        )}
        {strategy === 'guardrails' && (
          <>
            <ParamInput label="Initial Rate" value={(params as { initialRate: number }).initialRate * 100} onChange={(v) => setParam('initialRate', v / 100)} suffix="%" step={0.1} />
            <ParamInput label="Ceiling Trigger" value={(params as { ceilingTrigger: number }).ceilingTrigger * 100} onChange={(v) => setParam('ceilingTrigger', v / 100)} suffix="%" step={1} />
            <ParamInput label="Floor Trigger" value={(params as { floorTrigger: number }).floorTrigger * 100} onChange={(v) => setParam('floorTrigger', v / 100)} suffix="%" step={1} />
            <ParamInput label="Adjustment" value={(params as { adjustmentSize: number }).adjustmentSize * 100} onChange={(v) => setParam('adjustmentSize', v / 100)} suffix="%" step={1} />
          </>
        )}
        {strategy === 'vanguard_dynamic' && (
          <>
            <ParamInput label="SWR" value={(params as { swr: number }).swr * 100} onChange={(v) => setParam('swr', v / 100)} suffix="%" step={0.1} />
            <ParamInput label="Ceiling" value={(params as { ceiling: number }).ceiling * 100} onChange={(v) => setParam('ceiling', v / 100)} suffix="%" step={0.1} />
            <ParamInput label="Floor" value={(params as { floor: number }).floor * 100} onChange={(v) => setParam('floor', v / 100)} suffix="%" step={0.1} />
          </>
        )}
        {strategy === 'cape_based' && (
          <>
            <ParamInput label="Base Rate" value={(params as { baseRate: number }).baseRate * 100} onChange={(v) => setParam('baseRate', v / 100)} suffix="%" step={0.1} />
            <ParamInput label="CAPE Weight" value={(params as { capeWeight: number }).capeWeight * 100} onChange={(v) => setParam('capeWeight', v / 100)} suffix="%" step={1} />
            <ParamInput label="Current CAPE" value={(params as { currentCape: number }).currentCape} onChange={(v) => setParam('currentCape', v)} step={1} />
          </>
        )}
        {strategy === 'floor_ceiling' && (
          <>
            <ParamInput label="Floor" value={(params as { floor: number }).floor} onChange={(v) => setParam('floor', v)} prefix="$" step={1000} />
            <ParamInput label="Ceiling" value={(params as { ceiling: number }).ceiling} onChange={(v) => setParam('ceiling', v)} prefix="$" step={1000} />
            <ParamInput label="Target Rate" value={(params as { targetRate: number }).targetRate * 100} onChange={(v) => setParam('targetRate', v / 100)} suffix="%" step={0.1} />
          </>
        )}
        {strategy === 'percent_of_portfolio' && (
          <ParamInput label="Rate" value={(params as { rate: number }).rate * 100} onChange={(v) => setParam('rate', v / 100)} suffix="%" step={0.1} />
        )}
        {strategy === 'one_over_n' && (
          <span className="text-xs text-muted-foreground col-span-full">No parameters — withdraws portfolio / remaining years each year.</span>
        )}
        {strategy === 'sensible_withdrawals' && (
          <>
            <ParamInput label="Base Rate" value={(params as { baseRate: number }).baseRate * 100} onChange={(v) => setParam('baseRate', v / 100)} suffix="%" step={0.1} tooltip="Minimum withdrawal rate applied to portfolio each year." />
            <ParamInput label="Extras Rate" value={(params as { extrasRate: number }).extrasRate * 100} onChange={(v) => setParam('extrasRate', v / 100)} suffix="%" step={1} tooltip="Percentage of prior year's gains added as bonus spending." />
          </>
        )}
        {strategy === 'ninety_five_percent' && (
          <ParamInput label="SWR" value={(params as { swr: number }).swr * 100} onChange={(v) => setParam('swr', v / 100)} suffix="%" step={0.1} tooltip="Target withdrawal rate. Actual withdrawal never drops below 95% of prior year." />
        )}
        {strategy === 'endowment' && (
          <>
            <ParamInput label="SWR" value={(params as { swr: number }).swr * 100} onChange={(v) => setParam('swr', v / 100)} suffix="%" step={0.1} />
            <ParamInput label="Smoothing Weight" value={(params as { smoothingWeight: number }).smoothingWeight * 100} onChange={(v) => setParam('smoothingWeight', v / 100)} suffix="%" step={5} tooltip="Weight on prior withdrawal (inflation-adjusted). Higher = smoother income, slower response to market." />
          </>
        )}
        {strategy === 'hebeler_autopilot' && (
          <ParamInput label="Expected Real Return" value={(params as { expectedRealReturn: number }).expectedRealReturn * 100} onChange={(v) => setParam('expectedRealReturn', v / 100)} suffix="%" step={0.1} tooltip="Real return assumption for the annuity factor (PMT) calculation." />
        )}
      </div>
    </div>
  )
}

function ParamInput({ label, value, onChange, prefix, suffix, step, tooltip }: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  tooltip?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </Label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          className="h-8 text-sm"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}
