import { useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { PercentInput } from '@/components/shared/PercentInput'
import { NumberInput } from '@/components/shared/NumberInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatCurrency } from '@/lib/utils'
import type { CashReserveMode, RetirementMitigationConfig } from '@/lib/types'

export function CashReserveSection() {
  const enabled = useProfileStore((s) => s.cashReserveEnabled)
  const mode = useProfileStore((s) => s.cashReserveMode)
  const fixedAmount = useProfileStore((s) => s.cashReserveFixedAmount)
  const months = useProfileStore((s) => s.cashReserveMonths)
  const cashReturn = useProfileStore((s) => s.cashReserveReturn)
  const annualExpenses = useProfileStore((s) => s.annualExpenses)
  const liquidNetWorth = useProfileStore((s) => s.liquidNetWorth)
  const retirementMitigation = useProfileStore((s) => s.retirementMitigation)
  const setField = useProfileStore((s) => s.setField)

  const handleToggle = useCallback((checked: boolean) => {
    setField('cashReserveEnabled', checked)
  }, [setField])

  const handleModeChange = useCallback((newMode: CashReserveMode) => {
    setField('cashReserveMode', newMode)
  }, [setField])

  const computedTarget = useMemo(() => {
    if (mode === 'fixed') return fixedAmount
    return months * annualExpenses / 12
  }, [mode, fixedAmount, months, annualExpenses])

  const shortfall = computedTarget - liquidNetWorth
  const isFunded = liquidNetWorth >= computedTarget

  const bucketEnabled = retirementMitigation.type === 'cash_bucket'

  const handleBucketToggle = useCallback((checked: boolean) => {
    if (checked) {
      setField('retirementMitigation', { type: 'cash_bucket', targetMonths: 24, cashReturn: 0.02 })
    } else {
      setField('retirementMitigation', { type: 'none' } as RetirementMitigationConfig)
    }
  }, [setField])

  const handleBucketMonths = useCallback((v: number) => {
    if (retirementMitigation.type === 'cash_bucket') {
      setField('retirementMitigation', { ...retirementMitigation, targetMonths: v })
    }
  }, [setField, retirementMitigation])

  const handleBucketReturn = useCallback((v: number) => {
    if (retirementMitigation.type === 'cash_bucket') {
      setField('retirementMitigation', { ...retirementMitigation, cashReturn: v })
    }
  }, [setField, retirementMitigation])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            Cash Reserve / Emergency Fund
            <InfoTooltip text="Set aside a cash reserve before investing. Savings fill the reserve first; once funded, all savings flow to investments." />
          </div>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </CardTitle>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          {/* Mode selector */}
          <div className="space-y-1">
            <Label className="text-sm">Reserve Mode</Label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'fixed'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => handleModeChange('fixed')}
              >
                Fixed Amount
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'months'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => handleModeChange('months')}
              >
                Months of Expenses
              </button>
            </div>
          </div>

          {/* Conditional inputs */}
          <div className="grid grid-cols-2 gap-3">
            {mode === 'fixed' ? (
              <CurrencyInput
                label="Reserve Target"
                value={fixedAmount}
                onChange={(v) => setField('cashReserveFixedAmount', v)}
                tooltip="Fixed cash reserve target amount"
              />
            ) : (
              <NumberInput
                label="Months of Expenses"
                value={months}
                onChange={(v) => setField('cashReserveMonths', v)}
                tooltip="Number of months of expenses to keep as cash reserve"
                integer
                min={1}
                max={60}
              />
            )}
            <PercentInput
              label="Cash Return Rate"
              value={cashReturn}
              onChange={(v) => setField('cashReserveReturn', v)}
              tooltip="Expected return on cash savings (e.g., high-yield savings account)"
            />
          </div>

          {/* Computed target display */}
          <div className="p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">Reserve target: </span>
            <span className="font-semibold">{formatCurrency(computedTarget)}</span>
          </div>

          {/* Funding status badge */}
          {computedTarget > 0 && (
            <div className="text-sm">
              {isFunded ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                  Funded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium">
                  Needs {formatCurrency(shortfall)} more
                </span>
              )}
            </div>
          )}

          {/* Retirement Cash Bucket sub-section */}
          <div className="border rounded-md p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm font-medium">Retirement Cash Bucket</Label>
                <InfoTooltip text="In retirement, withdrawals come from a cash bucket first. In positive-return years, the bucket refills from the portfolio. This avoids selling equities during downturns." />
              </div>
              <Switch checked={bucketEnabled} onCheckedChange={handleBucketToggle} />
            </div>
            {bucketEnabled && retirementMitigation.type === 'cash_bucket' && (
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="Bucket Size (Months)"
                  value={retirementMitigation.targetMonths}
                  onChange={handleBucketMonths}
                  tooltip="Number of months of retirement expenses to hold in cash"
                  integer
                  min={6}
                  max={60}
                />
                <PercentInput
                  label="Bucket Cash Return"
                  value={retirementMitigation.cashReturn}
                  onChange={handleBucketReturn}
                  tooltip="Return on retirement cash bucket (e.g., savings account rate)"
                />
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
