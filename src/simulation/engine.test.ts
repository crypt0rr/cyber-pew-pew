import { ENDPOINTS } from '../data/endpoints'
import { ATTACK_CATEGORIES, EVENT_OUTCOMES } from '../types'
import { eventOpacity, getEventLifecycle, SimulationEngine, trimActiveEvents } from './engine'
import { QUALITY_CONFIG } from './quality'

describe('SimulationEngine', () => {
  it('is deterministic for a seed and start time', () => {
    const first = new SimulationEngine(42, 1000)
    const second = new SimulationEngine(42, 1000)
    expect(Array.from({ length: 20 }, () => first.next())).toEqual(Array.from({ length: 20 }, () => second.next()))
  })

  it('produces valid, distinct endpoints and supported metadata', () => {
    const engine = new SimulationEngine(7, 1000)
    for (let index = 0; index < 200; index += 1) {
      const event = engine.next()
      expect(event.source.id).not.toBe(event.target.id)
      expect(event.source.latitude).toBeGreaterThanOrEqual(-90)
      expect(event.target.longitude).toBeLessThanOrEqual(180)
      expect(ATTACK_CATEGORIES).toContain(event.category)
      expect(EVENT_OUTCOMES).toContain(event.outcome)
      expect(event.severity).toBeGreaterThanOrEqual(1)
      expect(event.severity).toBeLessThanOrEqual(10)
    }
  })

  it('weights busy endpoints more heavily over a large sample', () => {
    const engine = new SimulationEngine(99, 1000)
    const counts = new Map<string, number>()
    for (let index = 0; index < 4000; index += 1) {
      const source = engine.next().source.id
      counts.set(source, (counts.get(source) ?? 0) + 1)
    }
    const busiest = ENDPOINTS.find((endpoint) => endpoint.id === 'fra')!
    const quietest = ENDPOINTS.find((endpoint) => endpoint.id === 'akl')!
    expect(counts.get(busiest.id)!).toBeGreaterThan(counts.get(quietest.id)! * 2)
  })

  it('enforces the active event cap', () => {
    const engine = new SimulationEngine()
    const limit = QUALITY_CONFIG.high.maxEvents
    const events = Array.from({ length: limit + 20 }, () => engine.next())
    expect(trimActiveEvents(events, limit)).toHaveLength(limit)
  })

  it('moves events through a fade-aware lifecycle', () => {
    const event = new SimulationEngine(1, 1000).next(200)
    expect(getEventLifecycle(event, 200)).toBe('appearing')
    expect(getEventLifecycle(event, 200 + event.duration * 0.4)).toBe('transmitting')
    expect(getEventLifecycle(event, 200 + event.duration * 0.75)).toBe('responding')
    expect(getEventLifecycle(event, 200 + event.duration * 0.95)).toBe('resolving')
    expect(eventOpacity(event, 200)).toBe(0)
    expect(eventOpacity(event, 200 + event.duration * 0.5)).toBe(1)
  })
})
