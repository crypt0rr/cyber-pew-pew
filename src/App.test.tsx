import { act, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { App } from './App'

describe('App telemetry presentation', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reports all generated telemetry while visualizing a sampled subset', () => {
    render(<App />)
    act(() => { vi.advanceTimersByTime(1200) })
    const main = screen.getByRole('main')
    const generatedRate = Number(main.getAttribute('data-generated-rate'))
    const visualizedRate = Number(main.getAttribute('data-visualized-rate'))
    expect(generatedRate).toBeGreaterThanOrEqual(13)
    expect(visualizedRate).toBeGreaterThan(0)
    expect(visualizedRate).toBeLessThan(generatedRate)
    expect(screen.getByText('Events / sec')).toBeInTheDocument()
  })
})
