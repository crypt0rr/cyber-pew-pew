import { SimulationEngine } from './engine'
import { selectVisualCandidate } from './sampler'

describe('visual candidate sampler', () => {
  it('is deterministic for the same candidates, history, and seed', () => {
    const engine = new SimulationEngine(5, 1000)
    const candidates = Array.from({ length: 8 }, () => engine.next())
    expect(selectVisualCandidate(candidates, [], 42)?.id).toBe(selectVisualCandidate(candidates, [], 42)?.id)
  })

  it('prioritizes active and severe events', () => {
    const engine = new SimulationEngine(8, 1000)
    const base = engine.next()
    const routine = { ...base, id: 'routine', severity: 3, outcome: 'blocked' as const }
    const urgent = { ...base, id: 'urgent', severity: 8, outcome: 'active' as const }
    expect(selectVisualCandidate([routine, urgent], [], 1)?.id).toBe('urgent')
  })

  it('rewards category diversity in recent visual history', () => {
    const engine = new SimulationEngine(9, 1000)
    const base = engine.next()
    const repeated = { ...base, id: 'repeated', category: 'ddos' as const, severity: 6, outcome: 'blocked' as const }
    const diverse = { ...base, id: 'diverse', category: 'phishing' as const, severity: 5, outcome: 'blocked' as const }
    const history = [{ ...base, id: 'history', category: 'ddos' as const }]
    expect(selectVisualCandidate([repeated, diverse], history, 2)?.id).toBe('diverse')
  })
})
