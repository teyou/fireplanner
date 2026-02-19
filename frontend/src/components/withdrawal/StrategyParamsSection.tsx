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

const ALL_STRATEGIES: WithdrawalStrategyType[] = [
  'constant_dollar', 'vpw', 'guardrails', 'vanguard_dynamic', 'cape_based', 'floor_ceiling',
]

const STRATEGY_DESCRIPTIONS: Record<WithdrawalStrategyType, string> = {
  constant_dollar: 'Withdraw a fixed inflation-adjusted amount each year (the classic 4% rule).',
  vpw: 'Withdraw a variable percentage based on remaining years and portfolio size.',
  guardrails: 'Inflation-adjust spending but cut/raise when portfolio hits guardrails.',
  vanguard_dynamic: 'Target a percentage of portfolio with ceiling and floor limits on changes.',
  cape_based: 'Blend CAPE earnings yield with a base rate, adjusting for valuation.',
  floor_ceiling: 'Withdraw a percentage of portfolio, clamped between floor and ceiling amounts.',
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
          <div className="flex flex-wrap gap-2">
            {ALL_STRATEGIES.map((s) => {
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
            <ParamInput label="Legacy Buffer" value={(params as { targetEndValue: number }).targetEndValue * 100} onChange={(v) => setParam('targetEndValue', v / 100)} suffix="%" step={1} tooltip="Percentage of portfolio to aim to keep at end of retirement. 0% = spend everything, 10% = leave 10% as safety buffer." />
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
