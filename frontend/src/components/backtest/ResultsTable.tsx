import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PerYearResult } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface ResultsTableProps {
  results: PerYearResult[]
}

const PAGE_SIZE = 20

export function ResultsTable({ results }: ResultsTableProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const pageResults = results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Period Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-2 font-medium">Start Year</th>
                <th className="text-left py-2 px-2 font-medium">End Year</th>
                <th className="text-right py-2 px-2 font-medium">Survived</th>
                <th className="text-right py-2 px-2 font-medium">Ending Balance</th>
                <th className="text-right py-2 px-2 font-medium">Min Balance</th>
                <th className="text-right py-2 px-2 font-medium">Total Withdrawn</th>
              </tr>
            </thead>
            <tbody>
              {pageResults.map((r) => (
                <tr key={r.start_year} className="border-b last:border-0">
                  <td className="py-1.5 pr-2">{r.start_year}</td>
                  <td className="py-1.5 px-2">{r.end_year}</td>
                  <td className="py-1.5 px-2 text-right">
                    <span className={r.survived ? 'text-green-600' : 'text-destructive'}>
                      {r.survived ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right">{formatCurrency(r.ending_balance)}</td>
                  <td className="py-1.5 px-2 text-right">{formatCurrency(r.min_balance)}</td>
                  <td className="py-1.5 px-2 text-right">{formatCurrency(r.total_withdrawn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
