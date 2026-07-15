export const ATTACK_CATEGORIES = ['ddos', 'malware', 'ransomware', 'phishing', 'scanning', 'botnet'] as const
export const EVENT_OUTCOMES = ['blocked', 'detected', 'active'] as const

export type AttackCategory = (typeof ATTACK_CATEGORIES)[number]
export type EventOutcome = (typeof EVENT_OUTCOMES)[number]
export type EventLifecycle = 'appearing' | 'transmitting' | 'responding' | 'resolving'
export type RenderQuality = 'low' | 'medium' | 'high'

export interface GeoEndpoint {
  id: string
  city: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  weight: number
}

export interface CyberEvent {
  id: string
  source: GeoEndpoint
  target: GeoEndpoint
  category: AttackCategory
  outcome: EventOutcome
  severity: number
  timestamp: number
  simulationStartedAt: number
  duration: number
}

export interface SimulationState {
  recentEvents: CyberEvent[]
  visualEvents: CyberEvent[]
  totalEvents: number
  generatedRate: number
  visualizedRate: number
  trailingOutcomeCounts: Record<EventOutcome, number>
  paused: boolean
  speed: number
  simulationTime: number
  qualityTier: RenderQuality
  measuredFps: number
}
