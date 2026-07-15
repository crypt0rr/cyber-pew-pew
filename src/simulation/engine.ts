import { ENDPOINTS } from '../data/endpoints'
import { ATTACK_CATEGORIES, type AttackCategory, type CyberEvent, type EventLifecycle, type EventOutcome, type GeoEndpoint } from '../types'

const SCENARIO_PROFILE: Record<AttackCategory, { outcomes: Record<EventOutcome, number>; severity: [number, number] }> = {
  ddos: { outcomes: { blocked: 52, detected: 18, active: 30 }, severity: [5, 10] },
  malware: { outcomes: { blocked: 62, detected: 25, active: 13 }, severity: [3, 9] },
  ransomware: { outcomes: { blocked: 66, detected: 24, active: 10 }, severity: [6, 10] },
  phishing: { outcomes: { blocked: 48, detected: 39, active: 13 }, severity: [2, 8] },
  scanning: { outcomes: { blocked: 39, detected: 50, active: 11 }, severity: [1, 6] },
  botnet: { outcomes: { blocked: 55, detected: 27, active: 18 }, severity: [4, 9] },
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export class SimulationEngine {
  private random: () => number
  private sequence = 0

  constructor(seed = 0xc0ffee, private readonly startAt = Date.now()) {
    this.random = mulberry32(seed)
  }

  private weightedEndpoint(excludeId?: string): GeoEndpoint {
    const candidates = ENDPOINTS.filter(({ id }) => id !== excludeId)
    const total = candidates.reduce((sum, endpoint) => sum + endpoint.weight, 0)
    let cursor = this.random() * total
    for (const endpoint of candidates) {
      cursor -= endpoint.weight
      if (cursor <= 0) return endpoint
    }
    return candidates[candidates.length - 1]
  }

  private weightedOutcome(category: AttackCategory): EventOutcome {
    const outcomes = SCENARIO_PROFILE[category].outcomes
    let cursor = this.random() * Object.values(outcomes).reduce((sum, value) => sum + value, 0)
    for (const [outcome, weight] of Object.entries(outcomes) as Array<[EventOutcome, number]>) {
      cursor -= weight
      if (cursor <= 0) return outcome
    }
    return 'blocked'
  }

  next(simulationStartedAt = 0, timestamp = this.startAt + this.sequence * 173): CyberEvent {
    const source = this.weightedEndpoint()
    const target = this.weightedEndpoint(source.id)
    const category = ATTACK_CATEGORIES[Math.floor(this.random() * ATTACK_CATEGORIES.length)]
    const outcome = this.weightedOutcome(category)
    const [minimumSeverity, maximumSeverity] = SCENARIO_PROFILE[category].severity
    const sequence = this.sequence++

    return {
      id: `evt-${sequence.toString(36).padStart(5, '0')}`,
      source,
      target,
      category,
      outcome,
      severity: Math.min(10, Math.round(minimumSeverity + this.random() * (maximumSeverity - minimumSeverity) + (outcome === 'active' ? 1 : 0))),
      timestamp,
      simulationStartedAt,
      duration: 2800 + Math.round(this.random() * 4200),
    }
  }
}

export function trimActiveEvents(events: CyberEvent[], limit: number) {
  return events.slice(0, limit)
}

export function getEventLifecycle(event: CyberEvent, simulationTime: number): EventLifecycle {
  const progress = Math.max(0, Math.min(1, (simulationTime - event.simulationStartedAt) / event.duration))
  if (progress < 0.12) return 'appearing'
  if (progress < 0.7) return 'transmitting'
  if (progress < 0.86) return 'responding'
  return 'resolving'
}

export function eventOpacity(event: CyberEvent, simulationTime: number) {
  const progress = Math.max(0, Math.min(1, (simulationTime - event.simulationStartedAt) / event.duration))
  if (progress < 0.12) return progress / 0.12
  if (progress > 0.86) return (1 - progress) / 0.14
  return 1
}
