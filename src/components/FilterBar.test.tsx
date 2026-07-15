import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ATTACK_CATEGORIES, EVENT_OUTCOMES } from '../types'
import { FilterBar } from './FilterBar'

describe('FilterBar', () => {
  it('exposes pressed filter state and emits changes', () => {
    const onCategory = vi.fn()
    const onOutcome = vi.fn()
    render(<FilterBar categories={new Set(ATTACK_CATEGORIES)} outcomes={new Set(EVENT_OUTCOMES)} onToggleCategory={onCategory} onToggleOutcome={onOutcome} />)
    const ddos = screen.getByRole('button', { name: 'DDoS' })
    expect(ddos).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(ddos)
    expect(onCategory).toHaveBeenCalledWith('ddos')
    fireEvent.click(screen.getByRole('button', { name: 'Blocked' }))
    expect(onOutcome).toHaveBeenCalledWith('blocked')
  })
})
