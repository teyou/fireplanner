import { useMemo } from 'react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAllocationStore } from '@/stores/useAllocationStore'

type RiskLevel = 'low' | 'medium' | 'high'

interface RiskDimension {
  id: string
  label: string
  level: RiskLevel
  description: string
  recommendation: string
}

/**
 * Derived hook: evaluates 6 risk dimensions based on profile + allocation.
 */
export function useRiskAssessment(): RiskDimension[] {
  const profile = useProfileStore()
  const allocation = useAllocationStore()

  return useMemo(() => {
    const retirementDuration = profile.lifeExpectancy - profile.retirementAge
    const equityWeight = allocation.currentWeights[0] + allocation.currentWeights[1] + allocation.currentWeights[2]

    const dimensions: RiskDimension[] = [
      {
        id: 'sequence',
        label: 'Sequence Risk',
        level: equityWeight > 0.7 && retirementDuration > 25 ? 'high' : equityWeight > 0.5 ? 'medium' : 'low',
        description: 'Risk of poor market returns in early retirement years depleting the portfolio.',
        recommendation: equityWeight > 0.7
          ? 'Consider a bond tent or reducing equity allocation in early retirement.'
          : 'Your equity allocation provides reasonable sequence risk protection.',
      },
      {
        id: 'inflation',
        label: 'Inflation Risk',
        level: profile.inflation < 0.02 ? 'low' : profile.inflation < 0.04 ? 'medium' : 'high',
        description: 'Risk that inflation erodes purchasing power over a long retirement.',
        recommendation: profile.inflation >= 0.04
          ? 'Consider inflation-linked assets or a higher equity allocation.'
          : 'Your inflation assumption is reasonable for Singapore.',
      },
      {
        id: 'longevity',
        label: 'Longevity Risk',
        level: retirementDuration > 35 ? 'high' : retirementDuration > 25 ? 'medium' : 'low',
        description: 'Risk of outliving your savings with a long retirement horizon.',
        recommendation: retirementDuration > 35
          ? 'Consider CPF LIFE, annuities, or a lower SWR.'
          : 'Your retirement duration is within typical planning ranges.',
      },
      {
        id: 'currency',
        label: 'Currency Risk',
        level: allocation.currentWeights[0] > 0.5 ? 'high' : allocation.currentWeights[0] > 0.3 ? 'medium' : 'low',
        description: 'Risk from USD/SGD exchange rate fluctuations on US-denominated holdings.',
        recommendation: allocation.currentWeights[0] > 0.5
          ? 'Diversify with SG equities, REITs, or bonds to reduce USD exposure.'
          : 'Your currency diversification is adequate.',
      },
      {
        id: 'healthcare',
        label: 'Healthcare Risk',
        level: profile.cpfMA < 50000 ? 'high' : profile.cpfMA < 100000 ? 'medium' : 'low',
        description: 'Risk of unexpected healthcare costs in later years.',
        recommendation: profile.cpfMA < 50000
          ? 'Build up CPF MediSave and consider MediShield Life supplements.'
          : 'Your MediSave balance provides a reasonable buffer.',
      },
      {
        id: 'concentration',
        label: 'Concentration Risk',
        level: Math.max(...allocation.currentWeights) > 0.5 ? 'high' : Math.max(...allocation.currentWeights) > 0.35 ? 'medium' : 'low',
        description: 'Risk from over-concentration in a single asset class.',
        recommendation: Math.max(...allocation.currentWeights) > 0.5
          ? 'Diversify across more asset classes to reduce concentration risk.'
          : 'Your portfolio is well diversified.',
      },
    ]

    return dimensions
  }, [
    profile.retirementAge,
    profile.lifeExpectancy,
    profile.inflation,
    profile.cpfMA,
    allocation.currentWeights,
  ])
}
