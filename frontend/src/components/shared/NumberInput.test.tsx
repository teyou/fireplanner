import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NumberInput } from './NumberInput'

describe('NumberInput', () => {
  describe('default behavior (no formatWithCommas)', () => {
    it('renders type="number" by default', () => {
      render(<NumberInput value={100} onChange={() => {}} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('displays raw number without commas', () => {
      render(<NumberInput value={72000} onChange={() => {}} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(72000)
    })
  })

  describe('formatWithCommas', () => {
    it('renders type="text" when formatWithCommas is true', () => {
      render(<NumberInput value={72000} onChange={() => {}} formatWithCommas />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('displays value with commas on initial mount', () => {
      render(<NumberInput value={72000} onChange={() => {}} formatWithCommas />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('72,000')
    })

    it('strips commas on focus', () => {
      render(<NumberInput value={72000} onChange={() => {}} formatWithCommas />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('72,000')

      fireEvent.focus(input)
      expect(input).toHaveValue('72000')
    })

    it('formats with commas on blur', () => {
      const onChange = vi.fn()
      render(<NumberInput value={72000} onChange={onChange} formatWithCommas />)
      const input = screen.getByRole('textbox')

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '150000' } })
      fireEvent.blur(input)

      expect(input).toHaveValue('150,000')
    })

    it('strips commas before calling onChange', () => {
      const onChange = vi.fn()
      render(<NumberInput value={0} onChange={onChange} formatWithCommas />)
      const input = screen.getByRole('textbox')

      fireEvent.focus(input)
      // Simulate typing with commas (e.g. pasted value)
      fireEvent.change(input, { target: { value: '1,234' } })

      expect(onChange).toHaveBeenCalledWith(1234)
    })

    it('reverts to formatted store value on empty blur', () => {
      render(<NumberInput value={50000} onChange={() => {}} formatWithCommas />)
      const input = screen.getByRole('textbox')

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)

      expect(input).toHaveValue('50,000')
    })

    it('formats large numbers correctly', () => {
      render(<NumberInput value={1234567} onChange={() => {}} formatWithCommas />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('1,234,567')
    })

    it('does not pass min/max/step to the DOM element', () => {
      render(
        <NumberInput
          value={100}
          onChange={() => {}}
          formatWithCommas
          min={0}
          max={1000}
          step={10}
        />
      )
      const input = screen.getByRole('textbox')
      expect(input).not.toHaveAttribute('min')
      expect(input).not.toHaveAttribute('max')
      expect(input).not.toHaveAttribute('step')
    })

    it('has inputMode="numeric"', () => {
      render(<NumberInput value={100} onChange={() => {}} formatWithCommas />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('inputMode', 'numeric')
    })
  })
})
