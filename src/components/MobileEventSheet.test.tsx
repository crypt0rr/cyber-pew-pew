import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { SimulationEngine } from '../simulation/engine'
import { MobileEventSheet } from './MobileEventSheet'

describe('MobileEventSheet', () => {
  it('expands recent events and selects a row', () => {
    const events = [new SimulationEngine(3, 1000).next(0)]
    const onSelect = vi.fn()
    render(<MobileEventSheet events={events} onSelect={onSelect} />)
    const toggle = screen.getByRole('button', { name: /event stream/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const rows = screen.getAllByRole('button')
    fireEvent.click(rows[1])
    expect(onSelect).toHaveBeenCalledWith(events[0])
  })
})
