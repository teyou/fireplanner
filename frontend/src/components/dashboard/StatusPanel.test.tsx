import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StatusPanel } from './StatusPanel'

function renderWithRouter(props: Parameters<typeof StatusPanel>[0]) {
  return render(
    <MemoryRouter>
      <StatusPanel {...props} />
    </MemoryRouter>
  )
}

const fullProps = {
  fireNumber: 2000000,
  progress: 0.458,
  yearsToFire: 12,
  fireAge: 47,
  coastFireNumber: 1524000,
  baristaFireIncome: 28250,
  savingsRate: 0.467,
  totalNetWorth: 1100000,
  portfolioDepletedAge: null,
  lifeExpectancy: 90,
  projectionFireNumber: null,
  deviationPct: null,
  showProjectionNumber: false,
  deviationFactors: [],
}

describe('StatusPanel', () => {
  it('renders all 8 metric cards', () => {
    renderWithRouter(fullProps)
    expect(screen.getByText('FIRE Number')).toBeInTheDocument()
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('Years to FIRE')).toBeInTheDocument()
    expect(screen.getByText('FIRE Age')).toBeInTheDocument()
    expect(screen.getByText('Coast FIRE Number')).toBeInTheDocument()
    expect(screen.getByText('Barista FIRE Income')).toBeInTheDocument()
    expect(screen.getByText('Savings Rate')).toBeInTheDocument()
    expect(screen.getByText('Total Net Worth')).toBeInTheDocument()
  })

  it('shows dash when all values are null', () => {
    renderWithRouter({
      fireNumber: null,
      progress: null,
      yearsToFire: null,
      fireAge: null,
      coastFireNumber: null,
      baristaFireIncome: null,
      savingsRate: null,
      totalNetWorth: null,
      portfolioDepletedAge: null,
      lifeExpectancy: 90,
      projectionFireNumber: null,
      deviationPct: null,
      showProjectionNumber: false,
      deviationFactors: [],
    })
    // Each null value renders as an em dash
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(8)
  })

  it('renders links for FIRE Number and Total Net Worth', () => {
    renderWithRouter(fullProps)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/inputs#section-fire-settings')
    expect(hrefs).toContain('/inputs#section-net-worth')
  })

  it('renders progress bar for the Progress card', () => {
    const { container } = renderWithRouter(fullProps)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('renders tooltip for Coast FIRE Number', () => {
    renderWithRouter(fullProps)
    // InfoTooltip renders a button with text "i"
    const tooltipButtons = screen.getAllByRole('button')
    // At least one tooltip button exists (Coast FIRE and Barista FIRE have tooltips)
    expect(tooltipButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders in a responsive grid', () => {
    const { container } = renderWithRouter(fullProps)
    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('grid')
    expect(grid?.className).toContain('grid-cols-2')
  })
})
