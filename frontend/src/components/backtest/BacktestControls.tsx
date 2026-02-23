import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { BacktestDataset, HeatmapConfig, WithdrawalStrategyType } from '@/lib/types'
import { getStrategyLabel } from '@/hooks/useWithdrawalComparison'

const ALL_STRATEGIES: WithdrawalStrategyType[] = [
  'constant_dollar', 'vpw', 'guardrails', 'vanguard_dynamic', 'cape_based', 'floor_ceiling',
  'percent_of_portfolio', 'one_over_n', 'sensible_withdrawals', 'ninety_five_percent',
  'endowment', 'hebeler_autopilot',
]

interface BacktestConfig {
  swr: number
  retirementDuration: number
  dataset: BacktestDataset
  blendRatio: number
  withdrawalStrategy: WithdrawalStrategyType
  heatmapConfig: HeatmapConfig
}

interface BacktestControlsProps {
  config: BacktestConfig
  setConfig: (update: Partial<BacktestConfig>) => void
  isPending: boolean
  canRun: boolean
  validationErrors: Record<string, string>
  onRunHeatmap: () => void
  isHeatmapPending: boolean
  heatmapStale: boolean
}

export function BacktestControls({ config, setConfig, isPending, canRun, validationErrors, onRunHeatmap, isHeatmapPending, heatmapStale }: BacktestControlsProps) {
  const errorMessages = Object.values(validationErrors)
  const disabledReason = !canRun
    ? errorMessages[0] ?? 'Fix validation errors to run backtest'
    : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Backtest Parameters
          {isPending && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2 md:col-span-2 lg:col-span-2">
            <Label>
              Withdrawal Strategy
              <InfoTooltip text="How money is withdrawn during retirement. Each strategy handles market volatility differently. Constant Dollar is the classic 4% rule." />
            </Label>
            <Select
              value={config.withdrawalStrategy}
              onValueChange={(v) => setConfig({ withdrawalStrategy: v as WithdrawalStrategyType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STRATEGIES.map((s) => (
                  <SelectItem key={s} value={s}>{getStrategyLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Dataset
              <InfoTooltip text="US-only uses S&P 500 returns. SG-only uses STI. Blended mixes both with adjustable weighting." />
            </Label>
            <Select
              value={config.dataset}
              onValueChange={(v) => setConfig({ dataset: v as BacktestDataset })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us_only">US Only</SelectItem>
                <SelectItem value="sg_only">SG Only</SelectItem>
                <SelectItem value="blended">Blended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.dataset === 'blended' && (
            <div className="space-y-2">
              <Label>
                US Weight
                <InfoTooltip text="Percentage of US returns in the blend. Remainder uses SG returns." />
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                value={Math.round(config.blendRatio * 100)}
                onChange={(e) => setConfig({ blendRatio: Number(e.target.value) / 100 })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>
              SWR
              <InfoTooltip text="Safe Withdrawal Rate — the percentage of your portfolio withdrawn in year 1. Used as the initial rate for all strategies. 4% is the classic starting point." />
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              step={0.25}
              value={(config.swr * 100).toFixed(2)}
              onChange={(e) => setConfig({ swr: Number(e.target.value) / 100 })}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Duration (years)
              <InfoTooltip text="Length of retirement to simulate. 30 years is common for early retirees." />
            </Label>
            <Input
              type="number"
              min={10}
              max={60}
              step={5}
              value={config.retirementDuration}
              onChange={(e) => setConfig({ retirementDuration: Number(e.target.value) })}
            />
          </div>
        </div>

        {disabledReason && (
          <p className="text-sm text-muted-foreground">{disabledReason}</p>
        )}

        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">SWR x Duration Heatmap</Label>
            <Button
              size="sm"
              onClick={onRunHeatmap}
              disabled={!canRun || isHeatmapPending}
            >
              {isHeatmapPending ? 'Generating...' : heatmapStale ? 'Regenerate Heatmap' : 'Generate Heatmap'}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <HeatmapField
              label="SWR Min"
              value={config.heatmapConfig.swrMin * 100}
              onChange={(v) => setConfig({ heatmapConfig: { ...config.heatmapConfig, swrMin: v / 100 } })}
              suffix="%"
              step={0.5}
            />
            <HeatmapField
              label="SWR Max"
              value={config.heatmapConfig.swrMax * 100}
              onChange={(v) => setConfig({ heatmapConfig: { ...config.heatmapConfig, swrMax: v / 100 } })}
              suffix="%"
              step={0.5}
            />
            <HeatmapField
              label="SWR Step"
              value={config.heatmapConfig.swrStep * 100}
              onChange={(v) => setConfig({ heatmapConfig: { ...config.heatmapConfig, swrStep: v / 100 } })}
              suffix="%"
              step={0.1}
            />
            <HeatmapField
              label="Duration Min"
              value={config.heatmapConfig.durationMin}
              onChange={(v) => setConfig({ heatmapConfig: { ...config.heatmapConfig, durationMin: v } })}
              suffix="yr"
              step={5}
            />
            <HeatmapField
              label="Duration Max"
              value={config.heatmapConfig.durationMax}
              onChange={(v) => setConfig({ heatmapConfig: { ...config.heatmapConfig, durationMax: v } })}
              suffix="yr"
              step={5}
            />
            <HeatmapField
              label="Duration Step"
              value={config.heatmapConfig.durationStep}
              onChange={(v) => setConfig({ heatmapConfig: { ...config.heatmapConfig, durationStep: v } })}
              suffix="yr"
              step={1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HeatmapField({ label, value, onChange, suffix, step }: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix: string
  step: number
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          className="h-7 text-xs"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  )
}
