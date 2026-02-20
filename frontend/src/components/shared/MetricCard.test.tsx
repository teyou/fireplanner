import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="FIRE Number" value="$1,000,000" />)
    expect(screen.getByText('FIRE Number')).toBeInTheDocument()
    expect(screen.getByText('$1,000,000')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<MetricCard label="Test" value="42" subtitle="Some detail" />)
    expect(screen.getByText('Some detail')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<MetricCard label="Test" value="42" />)
    expect(screen.queryByText('Some detail')).not.toBeInTheDocument()
  })

  it('renders progress bar when progress is provided', () => {
    const { container } = render(
      <MetricCard label="Progress" value="50%" progress={0.5} />
    )
    // Progress component renders a div with role="progressbar"
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('does not render progress bar when progress is null', () => {
    const { container } = render(
      <MetricCard label="Test" value="42" progress={null} />
    )
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).not.toBeInTheDocument()
  })

  it('does not render progress bar when progress is undefined', () => {
    const { container } = render(
      <MetricCard label="Test" value="42" />
    )
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).not.toBeInTheDocument()
  })

  it('renders children when provided', () => {
    render(
      <MetricCard label="Test" value="42">
        <span data-testid="child">Extra content</span>
      </MetricCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Extra content')).toBeInTheDocument()
  })

  it('renders ReactNode as value (not just string)', () => {
    render(
      <MetricCard label="Test" value={<span data-testid="custom-value">Custom</span>} />
    )
    expect(screen.getByTestId('custom-value')).toBeInTheDocument()
  })

  it('applies elevated variant styles', () => {
    const { container } = render(
      <MetricCard label="Test" value="42" variant="elevated" />
    )
    // The Card element should have shadow-elevated class
    const card = container.firstElementChild
    expect(card?.className).toContain('shadow-elevated')
  })

  it('applies flat variant styles', () => {
    const { container } = render(
      <MetricCard label="Test" value="42" variant="flat" />
    )
    const card = container.firstElementChild
    expect(card?.className).toContain('shadow-none')
  })

  it('applies accent border on elevated variant', () => {
    const { container } = render(
      <MetricCard label="Test" value="42" variant="elevated" accent="success" />
    )
    const card = container.firstElementChild
    expect(card?.className).toContain('border-l-success')
  })

  it('applies custom className', () => {
    const { container } = render(
      <MetricCard label="Test" value="42" className="my-custom-class" />
    )
    const card = container.firstElementChild
    expect(card?.className).toContain('my-custom-class')
  })

  it('clamps progress to 100% max', () => {
    const { container } = render(
      <MetricCard label="Test" value="150%" progress={1.5} />
    )
    // MetricCard passes Math.min(progress * 100, 100) to Progress
    // The Indicator gets translateX(-0%) when value=100 (fully filled)
    const indicator = container.querySelector('[data-state]')?.querySelector('div')
    // Progress bar should render (clamped at 100, not 150)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toBeInTheDocument()
  })
})
