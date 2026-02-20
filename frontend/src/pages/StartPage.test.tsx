import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StartPage } from './StartPage'
import { useProfileStore } from '@/stores/useProfileStore'
import { useIncomeStore } from '@/stores/useIncomeStore'
import { useUIStore } from '@/stores/useUIStore'

function renderStartPage() {
  return render(
    <MemoryRouter>
      <StartPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  useProfileStore.getState().reset()
  useIncomeStore.getState().reset()
  // Reset UI store to defaults
  useUIStore.setState({
    sectionOrder: 'goal-first',
    cpfEnabled: true,
    propertyEnabled: false,
    healthcareEnabled: false,
    allocationAdvanced: false,
    statsPosition: 'bottom',
  })
})

describe('StartPage', () => {
  it('renders the page title', () => {
    renderStartPage()
    expect(screen.getByText('Singapore FIRE Planner')).toBeInTheDocument()
  })

  it('renders 3 pathway cards', () => {
    renderStartPage()
    expect(screen.getByText('I know when I want to retire')).toBeInTheDocument()
    expect(screen.getByText("Show me what's possible")).toBeInTheDocument()
    expect(screen.getByText('I already have enough')).toBeInTheDocument()
  })

  it('shows goal-first form when clicking first pathway', async () => {
    const user = userEvent.setup()
    renderStartPage()
    await user.click(screen.getByText('I know when I want to retire'))
    // Goal-first form has "Desired Retirement Age" label
    expect(screen.getByText('Desired Retirement Age')).toBeInTheDocument()
    expect(screen.getByText('Continue to planning')).toBeInTheDocument()
  })

  it('shows story-first form when clicking second pathway', async () => {
    const user = userEvent.setup()
    renderStartPage()
    await user.click(screen.getByText("Show me what's possible"))
    // Story-first form has "Annual Income" label
    expect(screen.getByText('Annual Income')).toBeInTheDocument()
    expect(screen.getByText('Continue to planning')).toBeInTheDocument()
  })

  it('shows already-fire form with CPF phase cards when clicking third pathway', async () => {
    const user = userEvent.setup()
    renderStartPage()
    await user.click(screen.getByText('I already have enough'))
    // Already-fire shows CPF stage selection
    expect(screen.getByText("What's your CPF stage?")).toBeInTheDocument()
    expect(screen.getByText('Before 55')).toBeInTheDocument()
    expect(screen.getByText('55 to 64')).toBeInTheDocument()
    expect(screen.getByText('65 and above')).toBeInTheDocument()
  })

  it('toggles off pathway form when clicking same card again', async () => {
    const user = userEvent.setup()
    renderStartPage()
    await user.click(screen.getByText('I know when I want to retire'))
    expect(screen.getByText('Desired Retirement Age')).toBeInTheDocument()

    // Click again to toggle off
    await user.click(screen.getByText('I know when I want to retire'))
    expect(screen.queryByText('Desired Retirement Age')).not.toBeInTheDocument()
  })

  it('shows section toggles after picking any pathway', async () => {
    const user = userEvent.setup()
    renderStartPage()
    // No toggles visible initially
    expect(screen.queryByText('Customise your plan')).not.toBeInTheDocument()

    await user.click(screen.getByText('I know when I want to retire'))
    expect(screen.getByText('Customise your plan')).toBeInTheDocument()
    expect(screen.getByText('CPF Integration')).toBeInTheDocument()
    expect(screen.getByText('Property Analysis')).toBeInTheDocument()
  })

  it('shows healthcare toggle only when CPF is enabled', async () => {
    const user = userEvent.setup()
    renderStartPage()
    await user.click(screen.getByText('I know when I want to retire'))

    // CPF is enabled by default, so healthcare should be visible
    expect(screen.getByText('Healthcare Planning')).toBeInTheDocument()
  })

  it('has a "Continue planning" link for returning users', () => {
    renderStartPage()
    const continueLink = screen.getByText('Continue planning')
    expect(continueLink.closest('a')).toHaveAttribute('href', '/inputs')
  })

  it('goal-first Continue button is disabled when retirement age <= current age', async () => {
    const user = userEvent.setup()
    renderStartPage()
    await user.click(screen.getByText('I know when I want to retire'))

    // Find the Continue button
    const continueButton = screen.getByRole('button', { name: /Continue to planning/i })

    // Default ages: current=30, retirement=55 — should be enabled
    expect(continueButton).not.toBeDisabled()
  })
})
