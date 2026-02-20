import { useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { PercentInput } from '@/components/shared/PercentInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatCurrency } from '@/lib/utils'
import { calculateHealthcareCostAtAge } from '@/lib/calculations/healthcare'
import type { HealthcareConfig, IspTierOption, OopModel } from '@/lib/types'

const ISP_TIER_OPTIONS: { value: IspTierOption; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'MediShield Life only' },
  { value: 'basic', label: 'Basic', description: 'B2/C ward coverage' },
  { value: 'standard', label: 'Standard', description: 'B1 ward coverage' },
  { value: 'enhanced', label: 'Enhanced', description: 'A ward / private hospital' },
]

const OOP_MODEL_OPTIONS: { value: OopModel; label: string }[] = [
  { value: 'age-curve', label: 'Age-Dependent (Recommended)' },
  { value: 'fixed', label: 'Fixed Annual Amount' },
]

const PREVIEW_AGES = [40, 50, 60, 70, 80, 90]

export function HealthcareSection() {
  const config = useProfileStore((s) => s.healthcareConfig)
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const setField = useProfileStore((s) => s.setField)
  const validationErrors = useProfileStore((s) => s.validationErrors)

  const updateConfig = useCallback(
    <K extends keyof HealthcareConfig>(key: K, value: HealthcareConfig[K]) => {
      setField('healthcareConfig', { ...config, [key]: value })
    },
    [config, setField],
  )

  // Cost preview at key ages
  const previewRows = useMemo(() => {
    if (!config.enabled) return []
    return PREVIEW_AGES.map((age) => calculateHealthcareCostAtAge(config, age))
  }, [config])

  const costAtRetirement = useMemo(() => {
    if (!config.enabled) return null
    return calculateHealthcareCostAtAge(config, retirementAge)
  }, [config, retirementAge])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            Healthcare & Insurance
            <InfoTooltip text="Model Singapore healthcare costs including MediShield Life, Integrated Shield Plans, CareShield LIFE, and out-of-pocket expenses. Costs are age-dependent and increase with age." />
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig('enabled', checked)}
          />
        </CardTitle>
      </CardHeader>
      {config.enabled && (
        <CardContent className="space-y-5">
          {/* Insurance Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1">
                MediShield Life
                <InfoTooltip text="National health insurance scheme. Premiums are fully payable from MediSave. Mandatory for all Singapore citizens and PRs." />
              </Label>
              <Switch
                checked={config.mediShieldLifeEnabled}
                onCheckedChange={(checked) => updateConfig('mediShieldLifeEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1">
                CareShield LIFE
                <InfoTooltip text="Long-term care insurance. Premiums paid from age 30 to 67. Mandatory for those born 1980 or later." />
              </Label>
              <Switch
                checked={config.careShieldLifeEnabled}
                onCheckedChange={(checked) => updateConfig('careShieldLifeEnabled', checked)}
              />
            </div>
          </div>

          {/* ISP Tier Selector */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              Integrated Shield Plan (ISP) Tier
              <InfoTooltip text="Optional upgrade to MediShield Life for higher ward class and private hospital coverage. Additional premiums vary by tier and age." />
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ISP_TIER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateConfig('ispTier', opt.value)}
                  className={`p-2 rounded-md border text-sm text-left transition-colors ${
                    config.ispTier === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* OOP Configuration */}
          <div className="space-y-3">
            <Label className="text-sm flex items-center gap-1">
              Out-of-Pocket Model
              <InfoTooltip text="Out-of-pocket costs (consultations, medications, dental) increase with age. 'Age-Dependent' uses a research-based multiplier curve." />
            </Label>
            <div className="flex gap-2">
              {OOP_MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateConfig('oopModel', opt.value)}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    config.oopModel === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                OOP Presets
                <InfoTooltip text="Estimated annual out-of-pocket medical costs at age 30 (GP visits, dental, medication). The age multiplier and medical inflation scale this up over time." />
              </Label>
              <div className="flex gap-2">
                {([
                  { label: 'Minimal', amount: 600 },
                  { label: 'Moderate', amount: 1200 },
                  { label: 'Conservative', amount: 2400 },
                ] as const).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => updateConfig('oopBaseAmount', preset.amount)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      config.oopBaseAmount === preset.amount
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    {preset.label} (${preset.amount.toLocaleString()})
                  </button>
                ))}
              </div>
            </div>

            <CurrencyInput
              label={config.oopModel === 'age-curve' ? 'OOP Base Amount (at age 30)' : 'Annual OOP Amount'}
              value={config.oopBaseAmount}
              onChange={(v) => updateConfig('oopBaseAmount', v)}
              error={validationErrors['healthcareConfig.oopBaseAmount']}
              tooltip={
                config.oopModel === 'age-curve'
                  ? 'Base annual out-of-pocket healthcare spending at age 30. This scales up with age using a research-based multiplier curve.'
                  : 'Fixed annual out-of-pocket healthcare spending, applied at every age.'
              }
            />

            <PercentInput
              label="Medical Inflation Rate"
              value={config.oopInflationRate}
              onChange={(v) => updateConfig('oopInflationRate', v)}
              tooltip="Annual increase in out-of-pocket costs above general inflation. Singapore CPI Healthcare averaged 2.24% over 20 years; 3% is moderately conservative. Set to 0% for no medical inflation."
            />
          </div>

          {/* MediSave Top-Up */}
          <CurrencyInput
            label="Annual MediSave Top-Up"
            value={config.mediSaveTopUpAnnual}
            onChange={(v) => updateConfig('mediSaveTopUpAnnual', v)}
            error={validationErrors['healthcareConfig.mediSaveTopUpAnnual']}
            tooltip="Voluntary annual top-up to MediSave account. Maximum $37,740 (current BHS cap). Helps offset future healthcare premiums."
          />

          {/* Cost Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Cost Preview by Age</Label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Age</th>
                      <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">Premiums</th>
                      <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">OOP</th>
                      <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">Total</th>
                      <th className="text-right py-1.5 pl-2 text-muted-foreground font-medium">Cash Outlay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.age} className="border-b border-muted/50">
                        <td className="py-1.5 pr-2 font-medium">{row.age}</td>
                        <td className="text-right py-1.5 px-2">
                          {formatCurrency(row.mediShieldLifePremium + row.ispAdditionalPremium + row.careShieldLifePremium)}
                        </td>
                        <td className="text-right py-1.5 px-2">{formatCurrency(row.oopExpense)}</td>
                        <td className="text-right py-1.5 px-2">{formatCurrency(row.totalCost)}</td>
                        <td className="text-right py-1.5 pl-2 font-semibold text-primary">
                          {formatCurrency(row.cashOutlay)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Cash outlay = total cost minus MediSave-deductible portion. Premiums are from CPF Board / MOH data (2025).
              </p>
            </div>
          )}

          {/* Summary at retirement */}
          {costAtRetirement && (
            <div className="p-2 bg-muted/50 rounded text-sm">
              <span className="text-muted-foreground">At retirement (age {retirementAge}): </span>
              <span className="font-semibold">{formatCurrency(costAtRetirement.cashOutlay)}/yr cash outlay</span>
              <span className="text-muted-foreground"> out of {formatCurrency(costAtRetirement.totalCost)}/yr total</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
