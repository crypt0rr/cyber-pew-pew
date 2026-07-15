import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CyberEvent, EventOutcome, RenderQuality, SimulationState } from '../types'
import { SimulationEngine, trimActiveEvents } from './engine'
import { getInitialQualityTier, lowerQuality, QUALITY_CONFIG, raiseQuality } from './quality'
import { selectVisualCandidate } from './sampler'

const CLOCK_TICK_MS = 100
const RECENT_EVENT_LIMIT = 120
export const EVENT_INTERVAL_MS = 70

const emptyOutcomes = (): Record<EventOutcome, number> => ({ blocked: 0, detected: 0, active: 0 })

export function useSimulation() {
  const engine = useRef(new SimulationEngine())
  const initialQuality = useRef<RenderQuality>(getInitialQualityTier())
  const [state, setState] = useState<SimulationState>(() => {
    const now = Date.now()
    const recentEvents = Array.from({ length: 14 }, (_, index) => engine.current.next(-(13 - index) * 180, now - (13 - index) * 180)).reverse()
    return {
      recentEvents,
      visualEvents: recentEvents.filter((_, index) => index % 2 === 0).slice(0, 8),
      totalEvents: recentEvents.length,
      generatedRate: 0,
      visualizedRate: 0,
      trailingOutcomeCounts: emptyOutcomes(),
      paused: false,
      speed: 1,
      simulationTime: 0,
      qualityTier: initialQuality.current,
      measuredFps: 60,
    }
  })
  const stateRef = useRef(state)
  const generatedWindow = useRef<Array<{ timestamp: number; outcome: EventOutcome }>>([])
  const visualizedWindow = useRef<number[]>([])
  const visualCandidates = useRef<CyberEvent[]>([])
  const visualAccumulator = useRef(0)
  const samplerSequence = useRef(0)
  const lastWallTime = useRef(performance.now())
  const lowFpsSamples = useRef(0)
  const highFpsSamples = useRef(0)
  const updateState = useCallback((updater: (current: SimulationState) => SimulationState) => {
    const next = updater(stateRef.current)
    stateRef.current = next
    setState(next)
  }, [])

  useEffect(() => {
    if (state.paused) return
    const delay = EVENT_INTERVAL_MS / state.speed
    const timer = window.setInterval(() => {
      const wallTimestamp = Date.now()
      const current = stateRef.current
      const event = engine.current.next(current.simulationTime, wallTimestamp)
      visualCandidates.current.push(event)
      generatedWindow.current.push({ timestamp: wallTimestamp, outcome: event.outcome })
      updateState((latest) => ({
        ...latest,
        recentEvents: [event, ...latest.recentEvents].slice(0, RECENT_EVENT_LIMIT),
        totalEvents: latest.totalEvents + 1,
      }))
    }, delay)
    return () => window.clearInterval(timer)
  }, [state.paused, state.speed, updateState])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const wallNow = performance.now()
      const wallDelta = Math.min(250, wallNow - lastWallTime.current)
      lastWallTime.current = wallNow

      updateState((current) => {
        if (current.paused) return current
        const simulationDelta = wallDelta * current.speed
        const simulationTime = current.simulationTime + simulationDelta
        const quality = QUALITY_CONFIG[current.qualityTier]
        const visualInterval = 1000 / quality.visualEventsPerSecond
        visualAccumulator.current += simulationDelta
        const sampled: CyberEvent[] = []

        while (visualAccumulator.current >= visualInterval && visualCandidates.current.length > 0) {
          visualAccumulator.current -= visualInterval
          const candidate = selectVisualCandidate(visualCandidates.current, [...sampled, ...current.visualEvents], samplerSequence.current++)
          visualCandidates.current = []
          if (candidate) {
            sampled.push(candidate)
            visualizedWindow.current.push(Date.now())
          }
        }

        const liveVisualEvents = [...sampled, ...current.visualEvents].filter((event) => simulationTime - event.simulationStartedAt < event.duration)
        const visualEvents = trimActiveEvents(liveVisualEvents, quality.maxEvents)
        const wallTimestamp = Date.now()
        generatedWindow.current = generatedWindow.current.filter(({ timestamp }) => wallTimestamp - timestamp < 1000)
        visualizedWindow.current = visualizedWindow.current.filter((timestamp) => wallTimestamp - timestamp < 1000)
        const trailingOutcomeCounts = generatedWindow.current.reduce((counts, item) => {
          counts[item.outcome] += 1
          return counts
        }, emptyOutcomes())

        return {
          ...current,
          visualEvents,
          simulationTime,
          generatedRate: generatedWindow.current.length,
          visualizedRate: visualizedWindow.current.length,
          trailingOutcomeCounts,
        }
      })
    }, CLOCK_TICK_MS)
    return () => window.clearInterval(timer)
  }, [updateState])

  const togglePaused = useCallback(() => {
    lastWallTime.current = performance.now()
    updateState((current) => ({
      ...current,
      paused: !current.paused,
      generatedRate: current.paused ? current.generatedRate : 0,
      visualizedRate: current.paused ? current.visualizedRate : 0,
      trailingOutcomeCounts: current.paused ? current.trailingOutcomeCounts : emptyOutcomes(),
    }))
  }, [updateState])
  const setSpeed = useCallback((speed: number) => updateState((current) => ({ ...current, speed })), [updateState])
  const reset = useCallback(() => {
    engine.current = new SimulationEngine()
    generatedWindow.current = []
    visualizedWindow.current = []
    visualCandidates.current = []
    visualAccumulator.current = 0
    samplerSequence.current = 0
    lastWallTime.current = performance.now()
    updateState((current) => ({
      ...current,
      recentEvents: [],
      visualEvents: [],
      totalEvents: 0,
      generatedRate: 0,
      visualizedRate: 0,
      trailingOutcomeCounts: emptyOutcomes(),
      simulationTime: 0,
    }))
  }, [updateState])
  const reportFrameRate = useCallback((fps: number) => {
    updateState((current) => {
      let qualityTier = current.qualityTier
      if (fps < 42) {
        lowFpsSamples.current += 1
        highFpsSamples.current = 0
      } else if (fps > 57) {
        highFpsSamples.current += 1
        lowFpsSamples.current = 0
      } else {
        lowFpsSamples.current = 0
        highFpsSamples.current = 0
      }
      if (lowFpsSamples.current >= 3) {
        qualityTier = lowerQuality(current.qualityTier)
        lowFpsSamples.current = 0
      } else if (highFpsSamples.current >= 8) {
        qualityTier = raiseQuality(current.qualityTier)
        highFpsSamples.current = 0
      }
      return { ...current, qualityTier, measuredFps: Math.round(fps) }
    })
  }, [updateState])

  return useMemo(
    () => ({ ...state, togglePaused, setSpeed, reset, reportFrameRate }),
    [reportFrameRate, reset, setSpeed, state, togglePaused],
  )
}
