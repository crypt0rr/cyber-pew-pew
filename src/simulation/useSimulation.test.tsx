import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { EVENT_INTERVAL_MS, useSimulation } from './useSimulation'

describe('useSimulation clock', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('advances with speed and completely freezes while paused', () => {
    const { result } = renderHook(() => useSimulation())
    act(() => { vi.advanceTimersByTime(500) })
    const normalTime = result.current.simulationTime
    expect(normalTime).toBeGreaterThan(0)

    act(() => result.current.setSpeed(2))
    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current.simulationTime - normalTime).toBeGreaterThan(normalTime * 1.5)

    act(() => result.current.togglePaused())
    const pausedAt = result.current.simulationTime
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.simulationTime).toBe(pausedAt)
  })

  it('expires old events instead of retaining stale arcs', () => {
    const { result } = renderHook(() => useSimulation())
    const initialVisualId = result.current.visualEvents[0].id
    act(() => { vi.advanceTimersByTime(9000) })
    expect(result.current.visualEvents.some((event) => event.id === initialVisualId)).toBe(false)
  })

  it('generates approximately fourteen events per second at default speed', () => {
    const { result } = renderHook(() => useSimulation())
    const initialTotal = result.current.totalEvents
    act(() => { vi.advanceTimersByTime(1000) })
    const generated = result.current.totalEvents - initialTotal
    expect(EVENT_INTERVAL_MS).toBe(70)
    expect(generated).toBeGreaterThanOrEqual(13)
    expect(generated).toBeLessThanOrEqual(15)
  })

  it('keeps a 120-record telemetry log while sampling a smaller visual stream', () => {
    const { result } = renderHook(() => useSimulation())
    const initialTotal = result.current.totalEvents
    act(() => { vi.advanceTimersByTime(10_000) })
    const generated = result.current.totalEvents - initialTotal
    expect(generated).toBeGreaterThanOrEqual(140)
    expect(generated).toBeLessThanOrEqual(143)
    expect(result.current.recentEvents).toHaveLength(120)
    expect(result.current.visualEvents.length).toBeLessThan(result.current.recentEvents.length)
    expect(result.current.visualEvents.length).toBeLessThanOrEqual(36)
  })

  it.each([
    { speed: 0.5, minimum: 6, maximum: 8 },
    { speed: 1, minimum: 13, maximum: 15 },
    { speed: 2, minimum: 27, maximum: 30 },
  ])('schedules evenly at $speed×', ({ speed, minimum, maximum }) => {
    const { result } = renderHook(() => useSimulation())
    act(() => result.current.setSpeed(speed))
    const initialTotal = result.current.totalEvents
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.totalEvents - initialTotal).toBeGreaterThanOrEqual(minimum)
    expect(result.current.totalEvents - initialTotal).toBeLessThanOrEqual(maximum)
  })

  it('resumes without replaying events accumulated while paused', () => {
    const { result } = renderHook(() => useSimulation())
    act(() => { vi.advanceTimersByTime(500) })
    act(() => result.current.togglePaused())
    const pausedTotal = result.current.totalEvents
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.totalEvents).toBe(pausedTotal)
    act(() => result.current.togglePaused())
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current.totalEvents - pausedTotal).toBeLessThanOrEqual(2)
  })
})
