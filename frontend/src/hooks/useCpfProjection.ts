import { useMemo } from 'react'
import { useIncomeProjection } from '@/hooks/useIncomeProjection'
import { useProfileStore } from '@/stores/useProfileStore'
import { calculateBrsFrsErs } from '@/lib/calculations/cpf'

export interface CpfProjectionRow {
  age: number
  oaBalance: number
  saBalance: number
  maBalance: number
  raBalance: number
  totalBalance: number
  annualContribution: number
  annualInterest: number
  cpfLifePayout: number
  oaHousingDeduction: number
  oaShortfall: number
  bequest: number
  milestone: 'brs' | 'frs' | 'ers' | 'cpfLifeStart' | 'raCreated' | null
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
  const cpfLifePlan = useProfileStore((s) => s.cpfLifePlan)
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

    // Bequest tracking: cumulative payouts drawn from the annuity pool
    let annuityPremium = 0
    let payoutsFromAnnuity = 0
    let raFullyDepleted = false

    const rows: CpfProjectionRow[] = projection.map((row, i) => {
      const prevRow = i > 0 ? projection[i - 1] : null
      const prevTotal = prevRow
        ? prevRow.cpfOA + prevRow.cpfSA + prevRow.cpfMA + prevRow.cpfRA
        : 0
      const totalBalance = row.cpfOA + row.cpfSA + row.cpfMA + row.cpfRA
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
      if (row.age === 55 && row.cpfRA > 0 && milestone === null) {
        milestone = 'raCreated'
      }

      // Track annuity premium from the LIFE start row
      if (row.cpfLifeAnnuityPremium > 0) {
        annuityPremium = row.cpfLifeAnnuityPremium
      }

      // Compute bequest: what beneficiaries inherit if passing occurs at this age
      let bequest = 0
      if (row.age >= cpfLifeStartAge && annuityPremium > 0) {
        if (cpfLifePlan === 'basic') {
          if (row.cpfRA > 0) {
            // RA still has funds → payouts come from RA, annuity premium untouched
            bequest = row.cpfRA + annuityPremium
          } else {
            // RA depleted → payouts now come from annuity pool
            if (!raFullyDepleted) {
              raFullyDepleted = true
              payoutsFromAnnuity = 0
            }
            payoutsFromAnnuity += row.cpfLifePayout
            bequest = Math.max(0, annuityPremium - payoutsFromAnnuity)
          }
        } else {
          // Standard/Escalating: cpfRA = 0, ALL payouts from annuity pool
          payoutsFromAnnuity += row.cpfLifePayout
          bequest = Math.max(0, annuityPremium - payoutsFromAnnuity)
        }
      }

      return {
        age: row.age,
        oaBalance: row.cpfOA,
        saBalance: row.cpfSA,
        maBalance: row.cpfMA,
        raBalance: row.cpfRA,
        totalBalance,
        annualContribution,
        annualInterest: Math.max(0, annualInterest),
        cpfLifePayout: row.cpfLifePayout,
        oaHousingDeduction: row.cpfOaHousingDeduction,
        oaShortfall: row.cpfOaShortfall,
        bequest,
        milestone,
      }
    })

    return { rows, hasErrors: false }
  }, [projection, hasErrors, currentAge, cpfLifeStartAge, cpfLifePlan])
}
