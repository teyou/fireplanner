import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import type { IncomeProjectionRow } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const columnHelper = createColumnHelper<IncomeProjectionRow>()

interface ProjectionTableProps {
  data: IncomeProjectionRow[]
  retirementAge: number
}

export function ProjectionTable({ data, retirementAge }: ProjectionTableProps) {
  const [expanded, setExpanded] = useState(false)
  const displayData = useMemo(
    () => expanded ? data : data.slice(0, 5),
    [expanded, data]
  )

  const columns = useMemo(() => [
    columnHelper.accessor('age', {
      header: 'Age',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('salary', {
      header: 'Salary',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('rentalIncome', {
      header: 'Rental',
      cell: (info) => {
        const v = info.getValue()
        return v > 0 ? formatCurrency(v) : '-'
      },
    }),
    columnHelper.accessor('investmentIncome', {
      header: 'Invest.',
      cell: (info) => {
        const v = info.getValue()
        return v > 0 ? formatCurrency(v) : '-'
      },
    }),
    columnHelper.accessor('totalGross', {
      header: 'Gross',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('sgTax', {
      header: 'SG Tax',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('cpfEmployee', {
      header: 'CPF (Emp)',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('totalNet', {
      header: 'Net',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('annualSavings', {
      header: 'Savings',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('cumulativeSavings', {
      header: 'Cumul.',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('cpfOA', {
      header: 'CPF OA',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('cpfSA', {
      header: 'CPF SA',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('cpfMA', {
      header: 'CPF MA',
      cell: (info) => formatCurrency(info.getValue()),
    }),
  ], [])

  const table = useReactTable({
    data: displayData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <div className={cn('border rounded-md overflow-auto', expanded && 'max-h-[600px]')}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isRetirementRow = row.original.age === retirementAge
              const hasEvents = row.original.activeLifeEvents.length > 0

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b hover:bg-muted/50',
                    row.original.isRetired && 'bg-muted/30',
                    isRetirementRow && 'border-t-2 border-t-orange-400',
                    hasEvents && 'bg-yellow-50 dark:bg-yellow-900/10'
                  )}
                  title={hasEvents ? `Active: ${row.original.activeLifeEvents.join(', ')}` : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-2 py-1.5 whitespace-nowrap tabular-nums">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {data.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          {expanded ? 'Show less' : `Show all ${data.length} rows`}
        </button>
      )}
    </div>
  )
}
