import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import type { BacktestDataset } from '@/lib/types'

interface BacktestConfig {
  swr: number
  retirementDuration: number
  dataset: BacktestDataset
  blendRatio: number
  includeHeatmap: boolean
}

interface BacktestControlsProps {
  config: BacktestConfig
  setConfig: (update: Partial<BacktestConfig>) => void
  onRun: () => void
  isPending: boolean
  canRun: boolean
  validationErrors: Record<string, string>
}

export function BacktestControls({ config, setConfig, onRun, isPending, canRun, validationErrors }: BacktestControlsProps) {
  const errorMessages = Object.values(validationErrors)
  const disabledReason = !canRun
    ? errorMessages[0] ?? 'Fix validation errors to run backtest'
    : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backtest Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <InfoTooltip text="Safe Withdrawal Rate for the backtest. 4% is the classic starting point." />
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

        <div className="flex items-center gap-3">
          <Button
            onClick={onRun}
            disabled={!canRun || isPending}
            className="min-w-[160px]"
          >
            {isPending ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
          {disabledReason && (
            <span className="text-sm text-muted-foreground">{disabledReason}</span>
          )}
          <label className="flex items-center gap-2 text-sm ml-auto">
            <input
              type="checkbox"
              checked={config.includeHeatmap}
              onChange={(e) => setConfig({ includeHeatmap: e.target.checked })}
            />
            Include SWR heatmap (slower)
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
