import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Activity, Gauge, Radio, ShieldCheck } from 'lucide-react'
import { DetailsDrawer } from './components/DetailsDrawer'
import { EventFeed } from './components/EventFeed'
import { FilterBar } from './components/FilterBar'
import { GlobeControls } from './components/GlobeControls'
import { MetricCard } from './components/MetricCard'
import { MobileEventSheet } from './components/MobileEventSheet'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useSimulation } from './simulation/useSimulation'
import { ATTACK_CATEGORIES, EVENT_OUTCOMES, type AttackCategory, type CyberEvent, type EventOutcome, type GeoEndpoint } from './types'

const GlobeScene = lazy(() => import('./globe/GlobeScene'))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

export function App() {
  const simulation = useSimulation()
  const reducedMotion = useReducedMotion()
  const [categories, setCategories] = useState<Set<AttackCategory>>(() => new Set(ATTACK_CATEGORIES))
  const [outcomes, setOutcomes] = useState<Set<EventOutcome>>(() => new Set(EVENT_OUTCOMES))
  const [selectedEvent, setSelectedEvent] = useState<CyberEvent | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState<GeoEndpoint | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const autoRotateBeforeSelection = useRef(true)
  const [cameraDistance, setCameraDistance] = useState(6.25)
  const webgl = useMemo(supportsWebGL, [])

  const visibleRecentEvents = useMemo(
    () => simulation.recentEvents.filter((event) => categories.has(event.category) && outcomes.has(event.outcome)),
    [categories, outcomes, simulation.recentEvents],
  )
  const visibleVisualEvents = useMemo(
    () => simulation.visualEvents.filter((event) => categories.has(event.category) && outcomes.has(event.outcome)),
    [categories, outcomes, simulation.visualEvents],
  )
  const blocked = simulation.trailingOutcomeCounts.blocked

  const toggleCategory = (category: AttackCategory) => setCategories((current) => {
    const next = new Set(current)
    if (next.has(category)) next.delete(category); else next.add(category)
    return next
  })
  const toggleOutcome = (outcome: EventOutcome) => setOutcomes((current) => {
    const next = new Set(current)
    if (next.has(outcome)) next.delete(outcome); else next.add(outcome)
    return next
  })
  const beginSelection = () => {
    if (!selectedEvent && !selectedEndpoint) autoRotateBeforeSelection.current = autoRotate
    setAutoRotate(false)
  }
  const selectEvent = (event: CyberEvent) => { beginSelection(); setSelectedEndpoint(null); setSelectedEvent(event) }
  const selectEndpoint = (endpoint: GeoEndpoint) => { beginSelection(); setSelectedEvent(null); setSelectedEndpoint(endpoint) }
  const closeDetails = () => {
    setSelectedEvent(null)
    setSelectedEndpoint(null)
    setAutoRotate(autoRotateBeforeSelection.current)
  }

  return (
    <main className="app-shell" data-simulation-time={Math.round(simulation.simulationTime)} data-paused={simulation.paused} data-quality={simulation.qualityTier} data-generated-rate={simulation.generatedRate} data-visualized-rate={simulation.visualizedRate}>
      <div className="scanlines" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Cyber Pew Pew home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span><strong>CYBER</strong> PEW PEW</span>
        </a>
        <div className="topbar-center">
          <span className="system-status"><i /> system nominal</span>
          <span className="timestamp">GLOBAL THREAT SIMULATION / NODE 07</span>
        </div>
        <div className="simulation-badge" aria-label="Simulated data"><Radio size={13} /><span className="simulation-badge__long">SIMULATED DATA</span><span className="simulation-badge__short">SIM</span></div>
      </header>

      <section className="hero-stage" id="top">
        {webgl ? (
          <Suspense fallback={<div className="globe-loading" role="status"><i /><span>Initializing visual system</span></div>}>
            <GlobeScene
              events={visibleVisualEvents}
              selectedEvent={selectedEvent}
              selectedEndpoint={selectedEndpoint}
              autoRotate={autoRotate}
              reducedMotion={reducedMotion}
              cameraDistance={cameraDistance}
              simulationTime={simulation.simulationTime}
              paused={simulation.paused}
              speed={simulation.speed}
              qualityTier={simulation.qualityTier}
              onFrameRate={simulation.reportFrameRate}
              onSelectEvent={selectEvent}
              onSelectEndpoint={selectEndpoint}
            />
          </Suspense>
        ) : (
          <div className="webgl-fallback" role="status">
            <ShieldCheck size={30} />
            <h2>3D rendering unavailable</h2>
            <p>Your browser or device has WebGL disabled. The simulation controls and event stream remain available.</p>
          </div>
        )}

        <section className="hero-copy" aria-labelledby="page-title">
          <div className="eyebrow"><span>●</span> Live synthetic network</div>
          <h1 id="page-title">Watch the<br /><em>signal move.</em></h1>
          <p>A real-time visualization of simulated threat traffic, detection patterns, and defensive response across the connected world.</p>
          <div className="hero-rule"><i /><span>Drag to orbit · Scroll to zoom · Select a signal</span></div>
        </section>

        <section className="metrics" aria-label="Simulation metrics">
          <MetricCard icon={<Activity size={13} />} label="Events / sec" value={String(simulation.generatedRate).padStart(2, '0')} accent />
          <MetricCard icon={<Gauge size={13} />} label="Session total" value={simulation.totalEvents.toLocaleString()} />
          <MetricCard icon={<ShieldCheck size={13} />} label="Blocked now" value={String(blocked).padStart(2, '0')} />
        </section>

        <GlobeControls
          paused={simulation.paused}
          speed={simulation.speed}
          autoRotate={autoRotate}
          onTogglePaused={simulation.togglePaused}
          onToggleRotate={() => setAutoRotate((value) => !value)}
          onSpeed={simulation.setSpeed}
          onZoomIn={() => setCameraDistance((distance) => Math.max(3.5, distance - 0.65))}
          onZoomOut={() => setCameraDistance((distance) => Math.min(8, distance + 0.65))}
          onReset={() => { simulation.reset(); setCameraDistance(6.25); closeDetails() }}
        />

        <EventFeed events={visibleRecentEvents} onSelect={selectEvent} />
        <MobileEventSheet events={visibleRecentEvents} onSelect={selectEvent} />
        <DetailsDrawer event={selectedEvent} endpoint={selectedEndpoint} onClose={closeDetails} />
      </section>

      <FilterBar categories={categories} outcomes={outcomes} onToggleCategory={toggleCategory} onToggleOutcome={toggleOutcome} />

      <footer>
        <span>CYBER PEW PEW / VISUAL SYSTEM 01</span>
        <span>NO LIVE TELEMETRY · ALL ACTIVITY IS SYNTHETIC</span>
      </footer>
    </main>
  )
}
