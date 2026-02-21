import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'
import { useCpfProjection, type CpfProjectionRow } from '@/hooks/useCpfProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const columnHelper = createColumnHelper<CpfProjectionRow>()

function currencyCell(value: number): string {
  return formatCurrency(value)
}

function optionalCurrencyCell(value: number): string {
  return value > 0 ? formatCurrency(value) : '-'
}

export function CpfProjectionTable() {
  const { rows, hasErrors } = useCpfProjection()
  const retirementAge = useProfileStore((s) => s.retirementAge)

  const hasHousingDeduction = rows?.some((r) => r.oaHousingDeduction > 0) ?? false

  const columns = useMemo((): ColumnDef<CpfProjectionRow, number>[] => {
    const cols: ColumnDef<CpfProjectionRow, number>[] = [
      columnHelper.accessor('age', {
        header: 'Age',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('oaBalance', {
        header: 'OA',
        cell: (info) => currencyCell(info.getValue()),
      }),
      columnHelper.accessor('saBalance', {
        header: 'SA',
        cell: (info) => currencyCell(info.getValue()),
      }),
      columnHelper.accessor('maBalance', {
        header: 'MA',
        cell: (info) => currencyCell(info.getValue()),
      }),
      columnHelper.accessor('totalBalance', {
        header: 'Total',
        cell: (info) => currencyCell(info.getValue()),
      }),
      columnHelper.accessor('annualContribution', {
        header: 'Contribution',
        cell: (info) => optionalCurrencyCell(info.getValue()),
      }),
    ]

    if (hasHousingDeduction) {
      cols.push(
        columnHelper.accessor('oaHousingDeduction', {
          header: 'OA Withdrawal',
          cell: (info) => optionalCurrencyCell(info.getValue()),
        }) as ColumnDef<CpfProjectionRow, number>,
      )
    }

    cols.push(
      columnHelper.accessor('annualInterest', {
        header: 'Interest',
        cell: (info) => optionalCurrencyCell(info.getValue()),
      }),
      columnHelper.accessor('cpfLifePayout', {
        header: 'CPF LIFE',
        cell: (info) => optionalCurrencyCell(info.getValue()),
      }),
    )

    return cols
  }, [hasHousingDeduction])

  const table = useReactTable({
    data: rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (hasErrors || !rows) {
    return (
      <p className="text-sm text-muted-foreground">
        Fix validation errors above to see the CPF projection table.
      </p>
    )
  }

  return (
    <div className="border rounded-md overflow-auto max-h-[400px]">
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
            const isMilestone = original.milestone !== null

            return (
              <tr
                key={row.id}
                className={cn(
                  'border-b hover:bg-muted/50',
                  isRetirementRow && 'border-t-2 border-t-orange-400',
                  original.milestone === 'frs' && 'bg-green-50 dark:bg-green-900/10',
                  original.milestone === 'brs' && 'bg-green-50/50 dark:bg-green-900/5',
                  original.milestone === 'ers' && 'bg-green-100 dark:bg-green-900/20',
                  original.milestone === 'cpfLifeStart' && 'bg-blue-50 dark:bg-blue-900/10',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-2 py-1.5 whitespace-nowrap tabular-nums"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {isMilestone && (
                  <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    {original.milestone === 'brs' && 'BRS reached'}
                    {original.milestone === 'frs' && 'FRS reached'}
                    {original.milestone === 'ers' && 'ERS reached'}
                    {original.milestone === 'cpfLifeStart' && 'CPF LIFE starts'}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
