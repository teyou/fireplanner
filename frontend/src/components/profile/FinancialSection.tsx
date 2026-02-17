import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfileStore } from '@/stores/useProfileStore'
import { CurrencyInput } from '@/components/shared/CurrencyInput'

export function FinancialSection() {
  const store = useProfileStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Financial Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CurrencyInput
            label="Annual Income"
            value={store.annualIncome}
            onChange={(v) => store.setField('annualIncome', v)}
            error={store.validationErrors.annualIncome}
            tooltip="Total gross annual income from employment before CPF and tax"
          />

          <CurrencyInput
            label="Liquid Net Worth"
            value={store.liquidNetWorth}
            onChange={(v) => store.setField('liquidNetWorth', v)}
            error={store.validationErrors.liquidNetWorth}
            tooltip="Cash + investments (excludes CPF and property equity)"
          />

          <CurrencyInput
            label="CPF OA Balance"
            value={store.cpfOA}
            onChange={(v) => store.setField('cpfOA', v)}
            error={store.validationErrors.cpfOA}
            tooltip="CPF Ordinary Account balance"
          />

          <CurrencyInput
            label="CPF SA Balance"
            value={store.cpfSA}
            onChange={(v) => store.setField('cpfSA', v)}
            error={store.validationErrors.cpfSA}
            tooltip="CPF Special Account balance"
          />

          <CurrencyInput
            label="CPF MA Balance"
            value={store.cpfMA}
            onChange={(v) => store.setField('cpfMA', v)}
            error={store.validationErrors.cpfMA}
            tooltip="CPF Medisave Account balance"
          />

          <CurrencyInput
            label="SRS Balance"
            value={store.srsBalance}
            onChange={(v) => store.setField('srsBalance', v)}
            error={store.validationErrors.srsBalance}
            tooltip="Supplementary Retirement Scheme balance"
          />

          <CurrencyInput
            label="SRS Annual Contribution"
            value={store.srsAnnualContribution}
            onChange={(v) => store.setField('srsAnnualContribution', v)}
            error={store.validationErrors.srsAnnualContribution}
            tooltip="Annual SRS contribution (max $15,300 for citizens/PR)"
          />
        </div>
      </CardContent>
    </Card>
  )
}
