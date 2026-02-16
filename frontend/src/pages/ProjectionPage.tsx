import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table'
import type { ProjectionRow } from '@/lib/types'
import { useProjection } from '@/hooks/useProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'

const columnHelper = createColumnHelper<ProjectionRow>()

type ColumnGroup = 'incomeBreakdown' | 'taxCpf' | 'cpfBalances' | 'portfolio'

const COLUMN_GROUPS: { key: ColumnGroup; label: string }[] = [
  { key: 'incomeBreakdown', label: 'Income Breakdown' },
  { key: 'taxCpf', label: 'Tax & CPF' },
  { key: 'cpfBalances', label: 'CPF Balances' },
  { key: 'portfolio', label: 'Portfolio' },
]

const GROUP_COLUMNS: Record<ColumnGroup, string[]> = {
  incomeBreakdown: ['salary', 'rentalIncome', 'investmentIncome', 'businessIncome', 'governmentIncome', 'totalGross'],
  taxCpf: ['sgTax', 'cpfEmployee', 'cpfEmployer', 'totalNet'],
  cpfBalances: ['cpfOA', 'cpfSA', 'cpfMA'],
  portfolio: ['portfolioReturnPct', 'cumulativeSavings'],
}

function currencyCell(value: number): string {
  return formatCurrency(value)
}

function optionalCurrencyCell(value: number): string {
  return value > 0 ? formatCurrency(value) : '-'
}

export function ProjectionPage() {
  const { rows, summary, hasErrors, errors } = useProjection()
  const retirementAge = useProfileStore((s) => s.retirementAge)

  const [activeGroups, setActiveGroups] = useState<Set<ColumnGroup>>(new Set())

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

  const columnVisibility = useMemo((): VisibilityState => {
    const vis: VisibilityState = {}
    for (const [group, cols] of Object.entries(GROUP_COLUMNS)) {
      const visible = activeGroups.has(group as ColumnGroup)
      for (const col of cols) {
        vis[col] = visible
      }
    }
    return vis
  }, [activeGroups])

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
    columnHelper.accessor('cumulativeSavings', {
      id: 'cumulativeSavings',
      header: 'Cumul. Savings',
      cell: (info) => currencyCell(info.getValue()),
    }),
  ] as ColumnDef<ProjectionRow, number | string>[], [])

  const table = useReactTable({
    data: rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
  })

  // Identify special rows
  const fireAchievedAge = summary?.fireAchievedAge ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Year-by-Year Projection</h1>
        <p className="text-muted-foreground text-sm">
          Deterministic trajectory showing income, portfolio growth, and FIRE progress.
          Verify your inputs produce sensible numbers before running Monte Carlo analysis.
        </p>
      </div>

      {hasErrors && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive font-medium">
            Fix upstream validation errors in Profile, Income, or Allocation before the projection can be computed.
          </p>
          <ul className="text-sm text-destructive mt-1 list-disc list-inside">
            {Object.entries(errors).slice(0, 5).map(([field, msg]) => (
              <li key={field}>{field}: {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                FIRE Achieved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {summary.fireAchievedAge !== null ? `Age ${summary.fireAchievedAge}` : 'Not reached'}
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
              <p className="text-2xl font-bold">{formatCurrency(summary.peakTotalNW)}</p>
              <p className="text-xs text-muted-foreground">at age {summary.peakTotalNWAge}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Terminal NW
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(summary.terminalTotalNW)}</p>
              <p className="text-xs text-muted-foreground">
                Liquid: {formatCurrency(summary.terminalLiquidNW)}
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
                summary.portfolioDepletedAge !== null && 'text-destructive',
              )}>
                {summary.portfolioDepletedAge !== null ? `Age ${summary.portfolioDepletedAge}` : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
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

          <div className="border rounded-md overflow-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
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
        </>
      )}
    </div>
  )
}
