import type { RenderQuality } from '../types'

export interface RenderQualityConfig {
  maxEvents: number
  visualEventsPerSecond: number
  stars: number
  curveSegments: number
  dpr: number
  hitTesting: boolean
}

export const QUALITY_CONFIG: Record<RenderQuality, RenderQualityConfig> = {
  low: { maxEvents: 18, visualEventsPerSecond: 2.5, stars: 500, curveSegments: 18, dpr: 1, hitTesting: false },
  medium: { maxEvents: 36, visualEventsPerSecond: 4, stars: 1000, curveSegments: 32, dpr: 1.35, hitTesting: true },
  high: { maxEvents: 60, visualEventsPerSecond: 6, stars: 1700, curveSegments: 48, dpr: 1.65, hitTesting: true },
}

export interface DeviceCapabilities {
  width: number
  hardwareConcurrency?: number
  deviceMemory?: number
}

export function getInitialQualityTier(capabilities?: DeviceCapabilities): RenderQuality {
  const detected = capabilities ?? {
    width: typeof window === 'undefined' ? 1440 : window.innerWidth,
    hardwareConcurrency: typeof navigator === 'undefined' ? 8 : navigator.hardwareConcurrency,
    deviceMemory: typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
  }
  if (detected.width <= 760 || (detected.hardwareConcurrency ?? 8) <= 4 || (detected.deviceMemory ?? 8) <= 2) return 'low'
  if ((detected.hardwareConcurrency ?? 8) <= 8 || (detected.deviceMemory ?? 8) <= 4) return 'medium'
  return 'high'
}

export function lowerQuality(tier: RenderQuality): RenderQuality {
  return tier === 'high' ? 'medium' : 'low'
}

export function raiseQuality(tier: RenderQuality): RenderQuality {
  return tier === 'low' ? 'medium' : 'high'
}
