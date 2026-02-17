import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PropertyInputForm } from '@/components/property/PropertyInputForm'
import { PropertyAnalysisPanel } from '@/components/property/PropertyAnalysisPanel'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { formatCurrency } from '@/lib/utils'

export function PropertyPage() {
  const reset = usePropertyStore((s) => s.reset)
  const ownsProperty = usePropertyStore((s) => s.ownsProperty)
  const existingPropertyValue = usePropertyStore((s) => s.existingPropertyValue)
  const existingMortgageBalance = usePropertyStore((s) => s.existingMortgageBalance)
  const existingMonthlyPayment = usePropertyStore((s) => s.existingMonthlyPayment)
  const existingRentalIncome = usePropertyStore((s) => s.existingRentalIncome)
  const setField = usePropertyStore((s) => s.setField)
  const validationErrors = usePropertyStore((s) => s.validationErrors)

  const propertyEquity = ownsProperty
    ? Math.max(0, existingPropertyValue - existingMortgageBalance)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property Analysis</h1>
          <p className="text-muted-foreground text-sm">
            Track existing property and analyze new Singapore property purchases with BSD/ABSD, mortgage, Bala's Table leasehold decay, and rental yield calculations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>

      {/* Existing Property */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ownsProperty}
              onChange={(e) => setField('ownsProperty', e.target.checked)}
            />
            I currently own property
          </label>

          {ownsProperty && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyInput
                  label="Current Property Value"
                  value={existingPropertyValue}
                  onChange={(v) => setField('existingPropertyValue', v)}
                  error={validationErrors.existingPropertyValue}
                  tooltip="Estimated current market value of your property"
                />
                <CurrencyInput
                  label="Outstanding Mortgage"
                  value={existingMortgageBalance}
                  onChange={(v) => setField('existingMortgageBalance', v)}
                  error={validationErrors.existingMortgageBalance}
                  tooltip="Remaining mortgage principal balance"
                />
                <CurrencyInput
                  label="Monthly Mortgage Payment"
                  value={existingMonthlyPayment}
                  onChange={(v) => setField('existingMonthlyPayment', v)}
                  error={validationErrors.existingMonthlyPayment}
                  tooltip="Monthly mortgage repayment amount (principal + interest)"
                />
                <CurrencyInput
                  label="Monthly Rental Income"
                  value={existingRentalIncome}
                  onChange={(v) => setField('existingRentalIncome', v)}
                  error={validationErrors.existingRentalIncome}
                  tooltip="Monthly rental income if this is an investment property (0 if owner-occupied)"
                />
              </div>
              <div className="p-2 bg-muted/50 rounded text-sm">
                <span className="text-muted-foreground">Property Equity: </span>
                <span className="font-semibold">{formatCurrency(propertyEquity)}</span>
                <span className="text-muted-foreground"> (Value - Mortgage)</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* New Purchase Analysis */}
      <h2 className="text-xl font-semibold">New Purchase Analysis</h2>
      <PropertyInputForm />
      <PropertyAnalysisPanel />
    </div>
  )
}
