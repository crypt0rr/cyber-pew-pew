import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { ENDPOINTS } from '../data/endpoints'
import { QUALITY_CONFIG } from '../simulation/quality'
import type { CyberEvent, GeoEndpoint, RenderQuality } from '../types'
import { AttackArc } from './AttackArc'
import { CountryBorders } from './CountryBorders'
import { latLonToVector3 } from './geo'

const CITY_GEOMETRY = new THREE.SphereGeometry(0.032, 10, 10)
const CITY_MATERIAL = new THREE.MeshBasicMaterial({ color: '#8affdd', toneMapped: false })
const GLOBE_ROTATION = new THREE.Euler(0.08, -0.58, 0)

export interface GlobeSceneProps {
  events: CyberEvent[]
  selectedEvent: CyberEvent | null
  selectedEndpoint: GeoEndpoint | null
  autoRotate: boolean
  reducedMotion: boolean
  cameraDistance: number
  simulationTime: number
  paused: boolean
  speed: number
  qualityTier: RenderQuality
  onFrameRate: (fps: number) => void
  onSelectEvent: (event: CyberEvent) => void
  onSelectEndpoint: (endpoint: GeoEndpoint) => void
}

function CityNode({ endpoint, onSelect }: { endpoint: GeoEndpoint; onSelect: (endpoint: GeoEndpoint) => void }) {
  const position = useMemo(() => latLonToVector3(endpoint.latitude, endpoint.longitude, 2.027), [endpoint])
  const scale = 0.76 + endpoint.weight * 0.035
  return (
    <mesh geometry={CITY_GEOMETRY} material={CITY_MATERIAL} position={position} scale={scale} dispose={null} onClick={(event) => { event.stopPropagation(); onSelect(endpoint) }} />
  )
}

function PerformanceMonitor({ onFrameRate }: { onFrameRate: (fps: number) => void }) {
  const samples = useRef({ frames: 0, elapsed: 0 })
  useFrame((_, delta) => {
    samples.current.frames += 1
    samples.current.elapsed += delta
    if (samples.current.elapsed >= 1) {
      onFrameRate(samples.current.frames / samples.current.elapsed)
      samples.current = { frames: 0, elapsed: 0 }
    }
  })
  return null
}

function selectionVector(event: CyberEvent | null, endpoint: GeoEndpoint | null) {
  if (endpoint) return latLonToVector3(endpoint.latitude, endpoint.longitude).applyEuler(GLOBE_ROTATION).normalize()
  if (event) {
    const source = latLonToVector3(event.source.latitude, event.source.longitude).applyEuler(GLOBE_ROTATION).normalize()
    const target = latLonToVector3(event.target.latitude, event.target.longitude).applyEuler(GLOBE_ROTATION).normalize()
    return source.add(target).normalize()
  }
  return null
}

export function focusCameraPosition(target: THREE.Vector3, distance = 4.75) {
  return target.clone().normalize().multiplyScalar(distance)
}

export function getRenderedEvents(events: CyberEvent[], selectedEvent: CyberEvent | null) {
  const selectedIsPinned = Boolean(selectedEvent && !events.some((event) => event.id === selectedEvent.id))
  return {
    selectedIsPinned,
    events: selectedIsPinned && selectedEvent ? [selectedEvent, ...events] : events,
  }
}

function CameraController({ selectedEvent, selectedEndpoint, cameraDistance, controls }: Pick<GlobeSceneProps, 'selectedEvent' | 'selectedEndpoint' | 'cameraDistance'> & { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const savedPosition = useRef<THREE.Vector3 | null>(null)
  const tween = useRef<{ from: THREE.Vector3; to: THREE.Vector3; elapsed: number; duration: number; restoring: boolean } | null>(null)
  const target = useMemo(() => selectionVector(selectedEvent, selectedEndpoint), [selectedEndpoint, selectedEvent])

  useEffect(() => {
    if (target) {
      if (!savedPosition.current) savedPosition.current = camera.position.clone()
      tween.current = { from: camera.position.clone(), to: focusCameraPosition(target), elapsed: 0, duration: 0.82, restoring: false }
    } else if (savedPosition.current) {
      tween.current = { from: camera.position.clone(), to: savedPosition.current.clone(), elapsed: 0, duration: 0.68, restoring: true }
    } else {
      camera.position.setLength(cameraDistance)
      camera.updateProjectionMatrix()
    }
  }, [camera, cameraDistance, target])

  useFrame((_, delta) => {
    const active = tween.current
    if (!active) return
    active.elapsed += delta
    const progress = Math.min(1, active.elapsed / active.duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    camera.position.lerpVectors(active.from, active.to, eased)
    camera.lookAt(0, 0, 0)
    controls.current?.update()
    if (progress === 1) {
      if (active.restoring) savedPosition.current = null
      tween.current = null
    }
  })

  useEffect(() => {
    const control = controls.current
    if (!control) return
    const cancel = () => { tween.current = null }
    control.addEventListener('start', cancel)
    return () => control.removeEventListener('start', cancel)
  }, [controls])

  return null
}

function Scene(props: GlobeSceneProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const quality = QUALITY_CONFIG[props.qualityTier]
  const rendered = getRenderedEvents(props.events, props.selectedEvent)
  return (
    <>
      <color attach="background" args={['#05070a']} />
      <fog attach="fog" args={['#05070a', 8, 14]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2, 4]} intensity={2.8} color="#d8fff5" />
      <pointLight position={[-4, -2, -3]} intensity={13} color="#00b88a" />
      <Stars radius={45} depth={35} count={quality.stars} factor={2} saturation={0.15} fade speed={props.reducedMotion ? 0 : 0.35} />
      <group rotation={GLOBE_ROTATION}>
        <mesh>
          <sphereGeometry args={[2, 72, 72]} />
          <meshStandardMaterial color="#0a211e" emissive="#06362c" emissiveIntensity={0.28} roughness={0.86} metalness={0.14} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.06, 48, 48]} />
          <meshBasicMaterial color="#39ffc0" transparent opacity={0.045} side={THREE.BackSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.14, 48, 48]} />
          <meshBasicMaterial color="#39ffc0" transparent opacity={0.065} side={THREE.BackSide} />
        </mesh>
        <CountryBorders />
        {ENDPOINTS.map((endpoint) => <CityNode key={endpoint.id} endpoint={endpoint} onSelect={props.onSelectEndpoint} />)}
        {rendered.events.map((event) => (
          <AttackArc
            key={event.id}
            event={event}
            simulationTime={props.simulationTime}
            paused={props.paused}
            speed={props.speed}
            quality={quality}
            reducedMotion={props.reducedMotion}
            selected={props.selectedEvent?.id === event.id}
            pinned={rendered.selectedIsPinned && props.selectedEvent?.id === event.id}
            onSelect={props.onSelectEvent}
          />
        ))}
      </group>
      <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.06} minDistance={3.5} maxDistance={8} autoRotate={props.autoRotate && !props.reducedMotion && !props.selectedEvent && !props.selectedEndpoint} autoRotateSpeed={0.38} />
      <CameraController selectedEvent={props.selectedEvent} selectedEndpoint={props.selectedEndpoint} cameraDistance={props.cameraDistance} controls={controls} />
      <PerformanceMonitor onFrameRate={props.onFrameRate} />
    </>
  )
}

export function GlobeScene(props: GlobeSceneProps) {
  const quality = QUALITY_CONFIG[props.qualityTier]
  return (
    <div className="globe-canvas" aria-label="Interactive three-dimensional cyber traffic globe" role="img" data-testid="globe" data-quality={props.qualityTier} data-focus={props.selectedEvent?.id ?? props.selectedEndpoint?.id ?? ''} data-visual-event-ids={props.events.map((event) => event.id).join(',')}>
      <Canvas dpr={quality.dpr} camera={{ position: [0, 0.3, 6.25], fov: 42 }} gl={{ antialias: props.qualityTier !== 'low', powerPreference: 'high-performance' }}>
        <Suspense fallback={null}><Scene {...props} /></Suspense>
      </Canvas>
    </div>
  )
}

export default GlobeScene
