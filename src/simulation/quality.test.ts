import { getInitialQualityTier, lowerQuality, QUALITY_CONFIG, raiseQuality } from './quality'

describe('render quality policy', () => {
  it('selects a conservative mobile tier', () => {
    expect(getInitialQualityTier({ width: 390, hardwareConcurrency: 8, deviceMemory: 8 })).toBe('low')
  })

  it('selects tiers from available hardware capability', () => {
    expect(getInitialQualityTier({ width: 1440, hardwareConcurrency: 8, deviceMemory: 4 })).toBe('medium')
    expect(getInitialQualityTier({ width: 1440, hardwareConcurrency: 12, deviceMemory: 8 })).toBe('high')
  })

  it('moves only one tier at a time', () => {
    expect(lowerQuality('high')).toBe('medium')
    expect(lowerQuality('low')).toBe('low')
    expect(raiseQuality('low')).toBe('medium')
    expect(raiseQuality('high')).toBe('high')
    expect(QUALITY_CONFIG.low.maxEvents).toBeLessThan(QUALITY_CONFIG.high.maxEvents)
    expect(QUALITY_CONFIG.low.visualEventsPerSecond).toBeLessThan(QUALITY_CONFIG.high.visualEventsPerSecond)
  })
})
