import { useMemo } from 'react'
import { useIncomeProjection } from '@/hooks/useIncomeProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateBrsFrsErs } from '@/lib/calculations/cpf'

export interface CpfProjectionRow {
  age: number
  oaBalance: number
  saBalance: number
  maBalance: number
  totalBalance: number
  annualContribution: number
  annualInterest: number
  cpfLifePayout: number
  oaHousingDeduction: number
  milestone: 'brs' | 'frs' | 'ers' | 'cpfLifeStart' | null
}

/**
 * Derived hook: reads CPF data from income projection rows and
 * reshapes for CPF-specific table display. Annotates milestone years
 * when total CPF crosses BRS/FRS/ERS thresholds or CPF LIFE starts.
 */
export function useCpfProjection(): {
  rows: CpfProjectionRow[] | null
  hasErrors: boolean
} {
  const { projection, hasErrors } = useIncomeProjection()
  const cpfLifeStartAge = useProfileStore((s) => s.cpfLifeStartAge)
  const currentAge = useProfileStore((s) => s.currentAge)

  return useMemo(() => {
    if (hasErrors || !projection || projection.length === 0) {
      return { rows: null, hasErrors: true }
    }

    const brsFrsErs = calculateBrsFrsErs(currentAge)
    let brsReached = false
    let frsReached = false
    let ersReached = false
    let cpfLifeStarted = false

    const rows: CpfProjectionRow[] = projection.map((row, i) => {
      const prevRow = i > 0 ? projection[i - 1] : null
      const prevTotal = prevRow
        ? prevRow.cpfOA + prevRow.cpfSA + prevRow.cpfMA
        : 0
      const totalBalance = row.cpfOA + row.cpfSA + row.cpfMA
      const annualContribution = row.cpfEmployee + row.cpfEmployer
      // Interest approximation: balance change minus contributions, plus housing deductions
      const annualInterest = i > 0
        ? totalBalance - prevTotal - annualContribution + row.cpfOaHousingDeduction
        : 0

      let milestone: CpfProjectionRow['milestone'] = null

      if (!brsReached && totalBalance >= brsFrsErs.brs) {
        milestone = 'brs'
        brsReached = true
      }
      if (!frsReached && totalBalance >= brsFrsErs.frs) {
        milestone = 'frs'
        frsReached = true
      }
      if (!ersReached && totalBalance >= brsFrsErs.ers) {
        milestone = 'ers'
        ersReached = true
      }
      if (!cpfLifeStarted && row.age === cpfLifeStartAge) {
        milestone = 'cpfLifeStart'
        cpfLifeStarted = true
      }

      return {
        age: row.age,
        oaBalance: row.cpfOA,
        saBalance: row.cpfSA,
        maBalance: row.cpfMA,
        totalBalance,
        annualContribution,
        annualInterest: Math.max(0, annualInterest),
        cpfLifePayout: row.cpfLifePayout,
        oaHousingDeduction: row.cpfOaHousingDeduction,
        milestone,
      }
    })

    return { rows, hasErrors: false }
  }, [projection, hasErrors, currentAge, cpfLifeStartAge])
}
