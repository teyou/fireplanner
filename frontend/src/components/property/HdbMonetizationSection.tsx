import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { NumberInput } from '@/components/shared/NumberInput'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { computeHdbCpfRefund, computeHdbSublettingIncome, computeLbsProceeds } from '@/lib/calculations/hdb'
import { calculateSellAndRent } from '@/lib/calculations/property'
import { SUBLETTING_RATE_SUGGESTIONS, LBS_RETAINED_LEASE_OPTIONS } from '@/lib/data/hdbRates'
import { formatCurrency } from '@/lib/utils'
import { useProfileStore } from '@/stores/useProfileStore'
import type { HdbFlatType, HdbMonetizationStrategy } from '@/lib/types'

export function HdbMonetizationSection() {
  const store = usePropertyStore()

  const strategy = store.hdbMonetizationStrategy
  const flatType = store.hdbFlatType
  const suggestion = SUBLETTING_RATE_SUGGESTIONS[flatType]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">HDB Monetization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-1">
              Flat Type
              <InfoTooltip text="Your HDB flat type. Affects subletting rate suggestions." />
            </Label>
            <Select
              value={flatType}
              onValueChange={(v) => store.setField('hdbFlatType', v as HdbFlatType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-room">2-Room</SelectItem>
                <SelectItem value="3-room">3-Room</SelectItem>
                <SelectItem value="4-room">4-Room</SelectItem>
                <SelectItem value="5-room">5-Room</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-1">
              Monetization Strategy
              <InfoTooltip text="How you plan to monetize your HDB in retirement. None = keep as-is." />
            </Label>
            <Select
              value={strategy}
              onValueChange={(v) => store.setField('hdbMonetizationStrategy', v as HdbMonetizationStrategy)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sublet">Sublet Room(s)</SelectItem>
                <SelectItem value="sell-and-rent">Sell & Rent</SelectItem>
                <SelectItem value="lbs">Lease Buyback Scheme</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {strategy === 'sublet' && (
          <SubletInputs
            rooms={store.hdbSublettingRooms}
            rate={store.hdbSublettingRate}
            suggestion={suggestion}
            onRoomsChange={(v) => store.setField('hdbSublettingRooms', v)}
            onRateChange={(v) => store.setField('hdbSublettingRate', v)}
          />
        )}

        {strategy === 'sell-and-rent' && (
          <SellAndRentInputs />
        )}

        {strategy === 'lbs' && (
          <LbsInputs />
        )}
      </CardContent>
    </Card>
  )
}

function SubletInputs({
  rooms,
  rate,
  suggestion,
  onRoomsChange,
  onRateChange,
}: {
  rooms: number
  rate: number
  suggestion: { low: number; high: number }
  onRoomsChange: (v: number) => void
  onRateChange: (v: number) => void
}) {
  const income = computeHdbSublettingIncome({ rooms, monthlyRate: rate })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberInput
          label="Rooms to Sublet"
          value={rooms}
          onChange={onRoomsChange}
          integer
          min={1}
          max={3}
          tooltip="Number of rooms to rent out (max 3 for HDB)"
        />
        <CurrencyInput
          label="Monthly Rate per Room"
          value={rate}
          onChange={onRateChange}
          tooltip={`Indicative range for your flat type: $${suggestion.low}–$${suggestion.high}/room/month`}
        />
      </div>
      <div className="p-2 bg-muted/50 rounded text-sm">
        <span className="text-muted-foreground">Estimated Annual Income: </span>
        <span className="font-semibold">{formatCurrency(income.annualGross)}</span>
        <span className="text-muted-foreground"> (fully taxable)</span>
      </div>
    </div>
  )
}

function SellAndRentInputs() {
  const store = usePropertyStore()
  const ds = store.downsizing

  const cpfRefundResult = computeHdbCpfRefund({
    cpfUsedForHousing: store.hdbCpfUsedForHousing,
    yearsOfMortgage: store.existingMortgageRemainingYears,
  })

  const sellResult = calculateSellAndRent({
    salePrice: ds.expectedSalePrice,
    outstandingMortgage: store.existingMortgageBalance,
    monthlyRent: ds.monthlyRent,
    cpfRefund: cpfRefundResult.totalRefund,
  })

  return (
    <div className="space-y-3">
      <CurrencyInput
        label="CPF Used for Housing"
        value={store.hdbCpfUsedForHousing}
        onChange={(v) => store.setField('hdbCpfUsedForHousing', v)}
        tooltip="Total CPF OA funds used for downpayment + mortgage. This amount + accrued interest must be refunded to CPF when selling."
      />

      <div className="p-3 rounded-lg bg-muted/30 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">CPF Refund (principal + interest)</span>
          <span className="font-medium">{formatCurrency(cpfRefundResult.totalRefund)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Net Proceeds to Portfolio</span>
          <span className="font-semibold">{formatCurrency(sellResult.netProceedsToPortfolio)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Annual Rent</span>
          <span className="font-medium">{formatCurrency(sellResult.annualRent)}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Sale price and monthly rent are configured in the Downsizing section above.
      </p>
    </div>
  )
}

function LbsInputs() {
  const property = usePropertyStore()
  const profile = useProfileStore()

  const lbsResult = computeLbsProceeds({
    flatValue: property.existingPropertyValue,
    remainingLease: property.leaseYears,
    retainedLease: property.hdbLbsRetainedLease,
    cpfRaBalance: profile.cpfRA,
    retirementSum: 213000, // Current FRS approximation
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm flex items-center gap-1">
            Retained Lease
            <InfoTooltip text="Years of lease to keep. HDB allows 20, 25, 30, or 35 years. Must cover you to at least age 95." />
          </Label>
          <Select
            value={String(property.hdbLbsRetainedLease)}
            onValueChange={(v) => property.setField('hdbLbsRetainedLease', Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LBS_RETAINED_LEASE_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} years
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CurrencyInput
          label="Estimated Flat Value"
          value={property.existingPropertyValue}
          onChange={(v) => property.setField('existingPropertyValue', v)}
          tooltip="Market value of your HDB flat. Used to estimate LBS proceeds."
        />
      </div>

      <div className="p-3 rounded-lg bg-muted/30 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total LBS Proceeds</span>
          <span className="font-semibold">{formatCurrency(lbsResult.totalProceeds)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">CPF RA Top-up</span>
          <span className="font-medium">{formatCurrency(lbsResult.cpfRaTopUp)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cash Proceeds</span>
          <span className="font-medium">{formatCurrency(lbsResult.cashProceeds)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Monthly LIFE Boost</span>
          <span className="font-medium">{formatCurrency(lbsResult.estimatedMonthlyLifeBoost)}/mo</span>
        </div>
      </div>
    </div>
  )
}
