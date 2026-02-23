import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useAllocationStore } from '@/stores/useAllocationStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { useWithdrawalStore } from '@/stores/useWithdrawalStore'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { ASSET_CLASSES } from '@/lib/data/historicalReturns'
import { formatCurrency, formatPercent } from '@/lib/utils'

type Row = [string, string | number]

function section(label: string): Row { return [`── ${label} ──`, ''] }

export async function exportToExcel(): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()

  const profile = useProfileStore.getState()
  const income = useIncomeStore.getState()
  const allocation = useAllocationStore.getState()
  const simulation = useSimulationStore.getState()
  const withdrawal = useWithdrawalStore.getState()
  const property = usePropertyStore.getState()

  // --- Profile sheet ---
  const profileSheet = wb.addWorksheet('Profile')
  const profileRows: Row[] = [
    section('Personal'),
    ['Current Age', profile.currentAge],
    ['Retirement Age', profile.retirementAge],
    ['Life Expectancy', profile.lifeExpectancy],
    ['Life Stage', profile.lifeStage],
    ['FIRE Type', profile.fireType],
    section('Income & Expenses'),
    ['Annual Income', formatCurrency(profile.annualIncome)],
    ['Annual Expenses', formatCurrency(profile.annualExpenses)],
    ['Retirement Spending Adjustment', formatPercent(profile.retirementSpendingAdjustment)],
    ['Inflation', formatPercent(profile.inflation)],
    section('Net Worth'),
    ['Liquid Net Worth', formatCurrency(profile.liquidNetWorth)],
    ['CPF OA', formatCurrency(profile.cpfOA)],
    ['CPF SA', formatCurrency(profile.cpfSA)],
    ['CPF MA', formatCurrency(profile.cpfMA)],
    ['CPF RA', formatCurrency(profile.cpfRA)],
    ['Total CPF', formatCurrency(profile.cpfOA + profile.cpfSA + profile.cpfMA + profile.cpfRA)],
    section('FIRE Settings'),
    ['SWR', formatPercent(profile.swr)],
    ['Expected Return', formatPercent(profile.expectedReturn)],
    ['Expense Ratio', formatPercent(profile.expenseRatio)],
    ['Use Portfolio Return', profile.usePortfolioReturn ? 'Yes' : 'No'],
    ['FIRE Number Basis', profile.fireNumberBasis],
    section('CPF LIFE'),
    ['CPF LIFE Start Age', profile.cpfLifeStartAge],
    ['CPF LIFE Plan', profile.cpfLifePlan],
    ['Retirement Sum Level', profile.cpfRetirementSum],
    ['SRS Annual Contribution', formatCurrency(profile.srsAnnualContribution)],
  ]
  addRows(profileSheet, profileRows)

  // --- Income sheet ---
  const incomeSheet = wb.addWorksheet('Income')
  const incomeRows: Row[] = [
    section('Salary Model'),
    ['Model', income.salaryModel],
    ['Annual Salary', formatCurrency(income.annualSalary)],
    ['Growth Rate', formatPercent(income.salaryGrowthRate)],
    ['Employer CPF Enabled', income.employerCpfEnabled ? 'Yes' : 'No'],
  ]
  if (income.incomeStreams.length > 0) {
    incomeRows.push(section('Income Streams'))
    for (const s of income.incomeStreams) {
      incomeRows.push([`${s.name} (${s.type})`, `${formatCurrency(s.annualAmount)}/yr, ages ${s.startAge}-${s.endAge}, ${s.isActive ? 'active' : 'inactive'}`])
    }
  }
  if (income.lifeEventsEnabled && income.lifeEvents.length > 0) {
    incomeRows.push(section('Life Events'))
    for (const e of income.lifeEvents) {
      incomeRows.push([`${e.name} (ages ${e.startAge}-${e.endAge})`, `Income impact: ${formatCurrency(e.incomeImpact)}`])
    }
  }
  addRows(incomeSheet, incomeRows)

  // --- Allocation sheet ---
  const allocationSheet = wb.addWorksheet('Allocation')
  const allocationRows: Row[] = [
    section('Current Weights'),
    ...ASSET_CLASSES.map((ac, i): Row => [ac.label, formatPercent(allocation.currentWeights[i])]),
    section('Target Weights'),
    ...ASSET_CLASSES.map((ac, i): Row => [ac.label, formatPercent(allocation.targetWeights[i])]),
    section('Settings'),
    ['Template', allocation.selectedTemplate],
    ['Glide Path Enabled', allocation.glidePathConfig.enabled ? 'Yes' : 'No'],
  ]
  if (allocation.glidePathConfig.enabled) {
    allocationRows.push(
      ['Glide Path Method', allocation.glidePathConfig.method],
    ['Glide Path Ages', `${allocation.glidePathConfig.startAge} - ${allocation.glidePathConfig.endAge}`],
    )
  }
  addRows(allocationSheet, allocationRows)

  // --- Withdrawal sheet ---
  const withdrawalSheet = wb.addWorksheet('Withdrawal')
  const withdrawalRows: Row[] = [
    section('Selected Strategies'),
    ...withdrawal.selectedStrategies.map((s): Row => ['Strategy', s]),
    section('Simulation Settings'),
    ['MC Method', simulation.mcMethod],
    ['MC Simulations', simulation.nSimulations],
  ]
  for (const strategy of withdrawal.selectedStrategies) {
    const params = withdrawal.strategyParams[strategy]
    if (params && Object.keys(params).length > 0) {
      withdrawalRows.push(section(`Params: ${strategy}`))
      for (const [k, v] of Object.entries(params)) {
        withdrawalRows.push([k, typeof v === 'number' && v < 1 && v > 0 ? formatPercent(v) : String(v)])
      }
    }
  }
  addRows(withdrawalSheet, withdrawalRows)

  // --- Property sheet (if enabled) ---
  if (property.ownsProperty) {
    const propertySheet = wb.addWorksheet('Property')
    const propertyRows: Row[] = [
      section('Property Details'),
      ['Property Type', property.propertyType],
      ['Property Value', formatCurrency(property.existingPropertyValue)],
      ['Mortgage Balance', formatCurrency(property.existingMortgageBalance)],
      ['Monthly Payment', formatCurrency(property.existingMonthlyPayment)],
      ['CPF Monthly', formatCurrency(property.mortgageCpfMonthly)],
      ['Mortgage Rate', formatPercent(property.existingMortgageRate)],
      ['Remaining Years', property.existingMortgageRemainingYears],
      ['Equity', formatCurrency(Math.max(0, property.existingPropertyValue - property.existingMortgageBalance))],
    ]
    if (property.propertyType === 'hdb') {
      propertyRows.push(
        section('HDB Details'),
        ['Lease Years Remaining', property.leaseYears],
        ['Monetization Strategy', property.hdbMonetizationStrategy],
      )
    }
    if (property.downsizing.scenario !== 'none') {
      propertyRows.push(
        section('Downsizing'),
        ['Scenario', property.downsizing.scenario],
        ['Sell Age', property.downsizing.sellAge],
        ['Expected Sale Price', formatCurrency(property.downsizing.expectedSalePrice)],
      )
    }
    addRows(propertySheet, propertyRows)
  }

  // Style all sheets
  for (const ws of wb.worksheets) {
    ws.getRow(1).font = { bold: true }
    ws.getColumn(1).width = 35
    ws.getColumn(2).width = 45
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fireplanner-export-${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

function addRows(ws: { addRow: (values: (string | number)[]) => void }, rows: Row[]) {
  ws.addRow(['Field', 'Value'])
  for (const [field, value] of rows) {
    ws.addRow([field, value])
  }
}
