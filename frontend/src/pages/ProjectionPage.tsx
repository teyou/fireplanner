import { useState, useMemo, useEffect, useCallback } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table'
import type { ProjectionRow, WithdrawalStrategyType } from '@/lib/types'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSimulationStore } from '@/stores/useSimulationStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { NWChartView } from '@/components/projection/NWChartView'
import { TableIcon, BarChart3, Maximize2 } from 'lucide-react'
import { useEffectiveMode } from '@/hooks/useEffectiveMode'
import { useUIStore } from '@/stores/useUIStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StrategyParamCard } from '@/components/withdrawal/StrategyParamsSection'
import { getStrategyLabel } from '@/hooks/useWithdrawalComparison'

const STRATEGY_SHORT_LABELS: Record<WithdrawalStrategyType, string> = {
  constant_dollar: '4% Rule',
  vpw: 'VPW',
  guardrails: 'Guardrails',
  vanguard_dynamic: 'Vanguard Dynamic',
  cape_based: 'CAPE-Based',
  floor_ceiling: 'Floor & Ceiling',
  percent_of_portfolio: '% of Portfolio',
  one_over_n: '1/N',
  sensible_withdrawals: 'Sensible',
  ninety_five_percent: '95% Rule',
  endowment: 'Endowment',
  hebeler_autopilot: 'Hebeler',
}

const columnHelper = createColumnHelper<ProjectionRow>()

type ColumnGroup = 'expensesBreakdown' | 'incomeBreakdown' | 'taxCpf' | 'cpfBalances' | 'portfolio'

const COLUMN_GROUPS: { key: ColumnGroup; label: string }[] = [
  { key: 'expensesBreakdown', label: 'Expenses Breakdown' },
  { key: 'incomeBreakdown', label: 'Income Breakdown' },
  { key: 'taxCpf', label: 'Tax & CPF' },
  { key: 'cpfBalances', label: 'CPF Balances' },
  { key: 'portfolio', label: 'Portfolio' },
]

const GROUP_COLUMNS: Record<ColumnGroup, string[]> = {
  expensesBreakdown: ['baseInflatedExpenses', 'parentSupportExpense', 'healthcareCashOutlay', 'mortgageCashPayment', 'downsizingRentExpense'],
  incomeBreakdown: ['salary', 'rentalIncome', 'investmentIncome', 'businessIncome', 'governmentIncome', 'srsWithdrawal', 'totalGross'],
  taxCpf: ['sgTax', 'cpfEmployee', 'cpfEmployer', 'totalNet'],
  cpfBalances: ['cpfOA', 'cpfSA', 'cpfMA'],
  portfolio: ['portfolioReturnPct', 'withdrawalAmount', 'maxPermittedWithdrawal', 'withdrawalExcess', 'cumulativeSavings'],
}

const DEFAULT_COLUMN_IDS = ['age', 'totalIncome', 'annualExpenses', 'savingsOrWithdrawal', 'portfolioReturnDollar', 'liquidNW', 'cpfTotal', 'totalNW', 'fireProgress']

function currencyCell(value: number): string {
  return formatCurrency(value)
}

function optionalCurrencyCell(value: number): string {
  return value > 0 ? formatCurrency(value) : '-'
}

export function ProjectionPage() {
  const { rows, summary, hasErrors } = useProjection()
  const retirementAge = useProfileStore((s) => s.retirementAge)
  const currentAge = useProfileStore((s) => s.currentAge)
  const inflation = useProfileStore((s) => s.inflation)
  const srsBalance = useProfileStore((s) => s.srsBalance)
  const srsAnnualContribution = useProfileStore((s) => s.srsAnnualContribution)
  const hasSrs = srsBalance > 0 || srsAnnualContribution > 0
  const activeStrategy = useSimulationStore((s) => s.selectedStrategy)
  const setSimField = useSimulationStore((s) => s.setField)

  const dollarBasis = useUIStore((s) => s.dollarBasis)
  const setUIField = useUIStore((s) => s.setField)

  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [activeGroups, setActiveGroups] = useState<Set<ColumnGroup>>(new Set())

  const mode = useEffectiveMode('section-projection')
  const setSectionMode = useUIStore((s) => s.setSectionMode)

  // Deflate a nominal value to today's dollars: value / (1 + inflation)^year
  const deflate = useCallback(
    (value: number, year: number) =>
      dollarBasis === 'real' ? value / Math.pow(1 + inflation, year) : value,
    [dollarBasis, inflation],
  )

  // Pre-deflate all monetary fields so table, chart, and summary use consistent values
  const displayRows = useMemo(() => {
    if (!rows || dollarBasis === 'nominal') return rows
    return rows.map((row) => {
      const d = (v: number) => deflate(v, row.year)
      return {
        ...row,
        totalIncome: d(row.totalIncome),
        annualExpenses: d(row.annualExpenses),
        savingsOrWithdrawal: d(row.savingsOrWithdrawal),
        portfolioReturnDollar: d(row.portfolioReturnDollar),
        liquidNW: d(row.liquidNW),
        cpfTotal: d(row.cpfTotal),
        totalNW: d(row.totalNW),
        salary: d(row.salary),
        rentalIncome: d(row.rentalIncome),
        investmentIncome: d(row.investmentIncome),
        businessIncome: d(row.businessIncome),
        governmentIncome: d(row.governmentIncome),
        srsWithdrawal: d(row.srsWithdrawal),
        totalGross: d(row.totalGross),
        sgTax: d(row.sgTax),
        cpfEmployee: d(row.cpfEmployee),
        cpfEmployer: d(row.cpfEmployer),
        totalNet: d(row.totalNet),
        cpfOA: d(row.cpfOA),
        cpfSA: d(row.cpfSA),
        cpfMA: d(row.cpfMA),
        cpfRA: d(row.cpfRA),
        withdrawalAmount: d(row.withdrawalAmount),
        maxPermittedWithdrawal: d(row.maxPermittedWithdrawal),
        withdrawalExcess: d(row.withdrawalExcess),
        propertyEquity: d(row.propertyEquity),
        totalNWIncProperty: d(row.totalNWIncProperty),
        baseInflatedExpenses: d(row.baseInflatedExpenses),
        parentSupportExpense: d(row.parentSupportExpense),
        healthcareCashOutlay: d(row.healthcareCashOutlay),
        mortgageCashPayment: d(row.mortgageCashPayment),
        downsizingRentExpense: d(row.downsizingRentExpense),
        cumulativeSavings: d(row.cumulativeSavings),
      }
    })
  }, [rows, dollarBasis, deflate])

  const displaySummary = useMemo(() => {
    if (!summary || dollarBasis === 'nominal') return summary
    const yearOf = (age: number) => age - currentAge
    return {
      ...summary,
      peakTotalNW: deflate(summary.peakTotalNW, yearOf(summary.peakTotalNWAge)),
      terminalLiquidNW: deflate(summary.terminalLiquidNW, rows ? rows.length - 1 : 0),
      terminalTotalNW: deflate(summary.terminalTotalNW, rows ? rows.length - 1 : 0),
    }
  }, [summary, dollarBasis, deflate, currentAge, rows])

  useEffect(() => {
    if (mode === 'advanced') {
      setActiveGroups(new Set(['expensesBreakdown', 'incomeBreakdown', 'taxCpf', 'cpfBalances', 'portfolio']))
    } else {
      setActiveGroups(new Set())
    }
  }, [mode])

  const toggleGroup = (group: ColumnGroup) => {
    setActiveGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  // Set of first-column IDs for each active group — used to draw vertical dividers
  const groupStartColumns = useMemo(() => {
    const s = new Set<string>()
    for (const g of activeGroups) {
      const cols = GROUP_COLUMNS[g]
      if (cols.length > 0) s.add(cols[0])
    }
    return s
  }, [activeGroups])

  const isMobile = useMediaQuery('(max-width: 767px)')
  const [expanded, setExpanded] = useState(false)

  const columnVisibility = useMemo((): VisibilityState => {
    const vis: VisibilityState = {}
    for (const [group, cols] of Object.entries(GROUP_COLUMNS)) {
      const visible = activeGroups.has(group as ColumnGroup)
      for (const col of cols) {
        vis[col] = visible
      }
    }
    // Hide SRS column when user has no SRS balance or contributions
    if (!hasSrs) {
      vis['srsWithdrawal'] = false
    }
    // Hide less-essential default columns on mobile to reduce horizontal scroll
    if (isMobile) {
      vis['portfolioReturnDollar'] = vis['portfolioReturnDollar'] || false
      vis['cpfTotal'] = vis['cpfTotal'] || false
      vis['fireProgress'] = vis['fireProgress'] || false
    }
    return vis
  }, [activeGroups, isMobile, hasSrs])

  const defaultVisibleCount = useMemo(() => {
    return DEFAULT_COLUMN_IDS.filter(id => columnVisibility[id] !== false).length
  }, [columnVisibility])

  const columns = useMemo((): ColumnDef<ProjectionRow, number | string>[] => [
    // Default columns (always visible)
    columnHelper.accessor('age', {
      header: 'Age',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('totalIncome', {
      header: 'Income',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('annualExpenses', {
      header: 'Expenses',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('savingsOrWithdrawal', {
      header: 'Savings/Draw',
      cell: (info) => {
        const v = info.getValue()
        const formatted = formatCurrency(Math.abs(v))
        return v >= 0 ? formatted : `(${formatted})`
      },
    }),
    columnHelper.accessor('portfolioReturnDollar', {
      header: 'Return ($)',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('liquidNW', {
      header: 'Liquid NW',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('cpfTotal', {
      header: 'CPF Total',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('totalNW', {
      header: 'Total NW',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('fireProgress', {
      header: 'FIRE %',
      cell: (info) => formatPercent(info.getValue(), 1),
    }),

    // Expanded: Expenses Breakdown
    columnHelper.accessor('baseInflatedExpenses', {
      id: 'baseInflatedExpenses',
      header: 'Base Living',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('parentSupportExpense', {
      id: 'parentSupportExpense',
      header: 'Parent Supp.',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('healthcareCashOutlay', {
      id: 'healthcareCashOutlay',
      header: 'Healthcare',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('mortgageCashPayment', {
      id: 'mortgageCashPayment',
      header: 'Mortgage',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('downsizingRentExpense', {
      id: 'downsizingRentExpense',
      header: 'Rent (DS)',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),

    // Expanded: Income Breakdown
    columnHelper.accessor('salary', {
      id: 'salary',
      header: 'Salary',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('rentalIncome', {
      id: 'rentalIncome',
      header: 'Rental',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('investmentIncome', {
      id: 'investmentIncome',
      header: 'Invest.',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('businessIncome', {
      id: 'businessIncome',
      header: 'Business',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('governmentIncome', {
      id: 'governmentIncome',
      header: 'Govt.',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('srsWithdrawal', {
      id: 'srsWithdrawal',
      header: 'SRS',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('totalGross', {
      id: 'totalGross',
      header: 'Gross',
      cell: (info) => currencyCell(info.getValue()),
    }),

    // Expanded: Tax & CPF Deductions
    columnHelper.accessor('sgTax', {
      id: 'sgTax',
      header: 'SG Tax',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('cpfEmployee', {
      id: 'cpfEmployee',
      header: 'CPF (Emp)',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('cpfEmployer', {
      id: 'cpfEmployer',
      header: 'CPF (Er)',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('totalNet', {
      id: 'totalNet',
      header: 'Net Income',
      cell: (info) => currencyCell(info.getValue()),
    }),

    // Expanded: CPF Balances
    columnHelper.accessor('cpfOA', {
      id: 'cpfOA',
      header: 'CPF OA',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('cpfSA', {
      id: 'cpfSA',
      header: 'CPF SA',
      cell: (info) => currencyCell(info.getValue()),
    }),
    columnHelper.accessor('cpfMA', {
      id: 'cpfMA',
      header: 'CPF MA',
      cell: (info) => currencyCell(info.getValue()),
    }),

    // Expanded: Portfolio
    columnHelper.accessor('portfolioReturnPct', {
      id: 'portfolioReturnPct',
      header: 'Return %',
      cell: (info) => formatPercent(info.getValue(), 2),
    }),
    columnHelper.accessor('withdrawalAmount', {
      id: 'withdrawalAmount',
      header: 'Actual Draw',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('maxPermittedWithdrawal', {
      id: 'maxPermittedWithdrawal',
      header: 'Max Withdrawal',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('withdrawalExcess', {
      id: 'withdrawalExcess',
      header: 'Excess',
      cell: (info) => optionalCurrencyCell(info.getValue()),
    }),
    columnHelper.accessor('cumulativeSavings', {
      id: 'cumulativeSavings',
      header: 'Cumul. Savings',
      cell: (info) => currencyCell(info.getValue()),
    }),
  ] as ColumnDef<ProjectionRow, number | string>[], [])

  const table = useReactTable({
    data: displayRows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
  })

  // Identify special rows
  const fireAchievedAge = displaySummary?.fireAchievedAge ?? null

  const renderTable = (containerClass: string) => (
    <div className={cn('border rounded-md overflow-auto', containerClass)}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background border-b z-10">
          {activeGroups.size > 0 && (
            <tr className="border-b bg-muted/30">
              <th colSpan={defaultVisibleCount} className="border-b" />
              {COLUMN_GROUPS.filter(g => activeGroups.has(g.key)).map(g => (
                <th
                  key={g.key}
                  colSpan={GROUP_COLUMNS[g.key].length}
                  className="px-2 py-1 text-center text-xs font-semibold text-primary/80 border-b border-l-2 border-l-border"
                >
                  {g.label}
                </th>
              ))}
            </tr>
          )}
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap',
                    groupStartColumns.has(header.id) && 'border-l-2 border-l-border',
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const original = row.original
            const isRetirementRow = original.age === retirementAge
            const isFireRow = original.age === fireAchievedAge
            const isDepleted = original.isRetired && original.liquidNW <= 0

            return (
              <tr
                key={row.id}
                className={cn(
                  'border-b hover:bg-muted/50',
                  original.isRetired && 'bg-muted/30',
                  isRetirementRow && 'border-t-2 border-t-orange-400',
                  isFireRow && 'bg-green-50 dark:bg-green-900/10',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'px-2 py-1.5 whitespace-nowrap tabular-nums',
                      isDepleted && cell.column.id !== 'age' && 'text-destructive',
                      groupStartColumns.has(cell.column.id) && 'border-l-2 border-l-border',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Year-by-Year Projection</h1>
            <p className="text-muted-foreground text-sm">
              Deterministic trajectory showing income, portfolio growth, and FIRE progress.
              Verify your inputs produce sensible numbers before running Monte Carlo analysis.
              {' '}
              <span className="font-medium">
                {dollarBasis === 'real' ? "All values in today's dollars." : 'All values in future (nominal) dollars.'}
              </span>
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30 shrink-0 mt-1">
            <button
              onClick={() => setSectionMode('section-projection', 'simple')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                mode === 'simple'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Simple
            </button>
            <button
              onClick={() => setSectionMode('section-projection', 'advanced')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                mode === 'advanced'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Advanced
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium whitespace-nowrap">Withdrawal Strategy:</span>
            <Select
              value={activeStrategy}
              onValueChange={(v) => setSimField('selectedStrategy', v as WithdrawalStrategyType)}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STRATEGY_SHORT_LABELS) as WithdrawalStrategyType[]).map((key) => (
                  <SelectItem key={key} value={key}>{getStrategyLabel(key)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <StrategyParamCard strategy={activeStrategy} />
        </div>
      </div>

      {hasErrors && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix upstream validation errors before the projection can be computed.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <Link to="/inputs#section-personal" className="text-sm text-destructive hover:underline font-medium">
              Fix in Personal Details &rarr;
            </Link>
            <Link to="/inputs#section-income" className="text-sm text-destructive hover:underline font-medium">
              Fix in Income &rarr;
            </Link>
            <Link to="/inputs#section-allocation" className="text-sm text-destructive hover:underline font-medium">
              Fix in Allocation &rarr;
            </Link>
          </div>
        </div>
      )}

      {displaySummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                FIRE Achieved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {displaySummary.fireAchievedAge !== null ? `Age ${displaySummary.fireAchievedAge}` : 'Not reached'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Peak Total NW
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(displaySummary.peakTotalNW)}</p>
              <p className="text-xs text-muted-foreground">at age {displaySummary.peakTotalNWAge}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Terminal NW
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(displaySummary.terminalTotalNW)}</p>
              <p className="text-xs text-muted-foreground">
                Liquid: {formatCurrency(displaySummary.terminalLiquidNW)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Portfolio Depleted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn(
                'text-2xl font-bold',
                displaySummary.portfolioDepletedAge !== null && 'text-destructive',
              )}>
                {displaySummary.portfolioDepletedAge !== null ? `Age ${displaySummary.portfolioDepletedAge}` : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {displaySummary && (() => {
        const { fireAchievedAge, peakTotalNW, peakTotalNWAge, portfolioDepletedAge, terminalTotalNW } = displaySummary
        const depleted = portfolioDepletedAge !== null

        let narrative: string
        if (fireAchievedAge !== null && !depleted) {
          narrative = `At your current savings rate, you reach financial independence at age ${fireAchievedAge}. Your portfolio peaks at ${formatCurrency(peakTotalNW)} at age ${peakTotalNWAge} and ends at ${formatCurrency(terminalTotalNW)}.`
        } else if (fireAchievedAge !== null && depleted) {
          narrative = `You reach financial independence at age ${fireAchievedAge}, but your portfolio depletes at age ${portfolioDepletedAge}. Consider reducing spending or adjusting your withdrawal strategy.`
        } else if (!depleted) {
          narrative = `Your portfolio does not reach the FIRE target within the projection period, but never depletes. It peaks at ${formatCurrency(peakTotalNW)} at age ${peakTotalNWAge}.`
        } else {
          narrative = `Your portfolio does not reach the FIRE target and depletes at age ${portfolioDepletedAge}. Consider increasing savings or extending your working years.`
        }

        return (
          <p className={cn(
            'text-sm rounded-md p-3 border',
            depleted
              ? 'text-destructive bg-destructive/5 border-destructive/20'
              : 'text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          )}>
            {narrative}
          </p>
        )
      })()}

      {displayRows && displayRows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Chart
              </button>
            </div>
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setUIField('dollarBasis', 'real')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  dollarBasis === 'real'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Show values in today's purchasing power"
              >
                Real $
              </button>
              <button
                onClick={() => setUIField('dollarBasis', 'nominal')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  dollarBasis === 'nominal'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Show actual future dollar amounts"
              >
                Nominal $
              </button>
            </div>
            {viewMode === 'table' && (
              <button
                onClick={() => setExpanded(true)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Expand table"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            {viewMode === 'table' && COLUMN_GROUPS.map((group) => (
              <Button
                key={group.key}
                variant={activeGroups.has(group.key) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleGroup(group.key)}
              >
                {group.label}
              </Button>
            ))}
            {viewMode === 'table' && mode === 'simple' && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                Toggle columns or switch to Advanced for all
              </span>
            )}
          </div>

          {viewMode === 'chart' ? (
            <NWChartView rows={displayRows} retirementAge={retirementAge} />
          ) : (
          <>
          <p className="text-xs text-muted-foreground md:hidden">Tap toggles to show more columns</p>
          {renderTable('max-h-[70vh]')}
          </>
          )}
        </>
      )}

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-4">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-lg font-bold">Year-by-Year Projection</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 shrink-0 pb-2">
            {COLUMN_GROUPS.map((group) => (
              <Button
                key={group.key}
                variant={activeGroups.has(group.key) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleGroup(group.key)}
              >
                {group.label}
              </Button>
            ))}
          </div>
          {renderTable('flex-1 min-h-0')}
        </DialogContent>
      </Dialog>
    </div>
  )
}
