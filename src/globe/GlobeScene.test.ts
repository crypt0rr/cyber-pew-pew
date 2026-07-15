import * as THREE from 'three'
import { focusCameraPosition, getRenderedEvents } from './GlobeScene'
import { SimulationEngine } from '../simulation/engine'

describe('globe camera focus', () => {
  it('places the camera along the selected world vector', () => {
    const target = new THREE.Vector3(2, 1, -3).normalize()
    const position = focusCameraPosition(target, 4.75)
    expect(position.length()).toBeCloseTo(4.75)
    expect(position.clone().normalize().dot(target)).toBeCloseTo(1)
  })

  it('pins a selected telemetry event missing from the sampled visual stream', () => {
    const engine = new SimulationEngine(10, 1000)
    const visual = [engine.next()]
    const selected = engine.next()
    const rendered = getRenderedEvents(visual, selected)
    expect(rendered.selectedIsPinned).toBe(true)
    expect(rendered.events[0]).toBe(selected)
  })
})
