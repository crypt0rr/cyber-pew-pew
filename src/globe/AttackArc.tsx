import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CATEGORY_META, OUTCOME_META } from '../meta'
import { eventOpacity } from '../simulation/engine'
import type { RenderQualityConfig } from '../simulation/quality'
import type { CyberEvent } from '../types'
import { greatCirclePoints, latLonToVector3 } from './geo'

const PULSE_GEOMETRY = new THREE.SphereGeometry(0.035, 10, 10)
const IMPACT_GEOMETRY = new THREE.RingGeometry(0.028, 0.065, 18)
const PULSE_MATERIALS = new Map<string, THREE.MeshBasicMaterial>()
const IMPACT_MATERIALS = new Map<string, THREE.MeshBasicMaterial>()

function sharedMaterial(cache: Map<string, THREE.MeshBasicMaterial>, color: string) {
  if (!cache.has(color)) cache.set(color, new THREE.MeshBasicMaterial({ color, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }))
  return cache.get(color)!
}

interface AttackArcProps {
  event: CyberEvent
  simulationTime: number
  paused: boolean
  speed: number
  quality: RenderQualityConfig
  reducedMotion: boolean
  selected: boolean
  pinned?: boolean
  onSelect: (event: CyberEvent) => void
}

export function AttackArc({ event, simulationTime, paused, speed, quality, reducedMotion, selected, pinned = false, onSelect }: AttackArcProps) {
  const pulse = useRef<THREE.Mesh>(null)
  const impact = useRef<THREE.Mesh>(null)
  const displayTime = useRef(simulationTime)
  const category = CATEGORY_META[event.category]
  const outcome = OUTCOME_META[event.outcome]
  const points = useMemo(() => greatCirclePoints(event.source, event.target, quality.curveSegments), [event, quality.curveSegments])
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])
  const lineMaterial = useMemo(() => event.outcome === 'blocked'
    ? new THREE.LineDashedMaterial({ color: outcome.color, dashSize: 0.08, gapSize: 0.055, transparent: true, opacity: 0, depthWrite: false })
    : new THREE.LineBasicMaterial({ color: category.color, transparent: true, opacity: 0, depthWrite: false }), [category.color, event.outcome, outcome.color])
  const lineObject = useMemo(() => {
    const object = new THREE.Line(lineGeometry, lineMaterial)
    if (event.outcome === 'blocked') object.computeLineDistances()
    return object
  }, [event.outcome, lineGeometry, lineMaterial])
  const hitGeometry = useMemo(
    () => quality.hitTesting ? new THREE.TubeGeometry(curve, Math.max(12, quality.curveSegments - 4), 0.035, 4, false) : null,
    [curve, quality.curveSegments, quality.hitTesting],
  )
  const pulseMaterial = useMemo(() => sharedMaterial(PULSE_MATERIALS, event.outcome === 'blocked' ? outcome.color : category.color), [category.color, event.outcome, outcome.color])
  const impactMaterial = useMemo(() => sharedMaterial(IMPACT_MATERIALS, outcome.color), [outcome.color])
  const target = useMemo(() => latLonToVector3(event.target.latitude, event.target.longitude, 2.035), [event.target])

  useEffect(() => {
    if (paused || Math.abs(displayTime.current - simulationTime) > 250) displayTime.current = simulationTime
  }, [paused, simulationTime])
  useEffect(() => () => {
    lineGeometry.dispose()
    lineMaterial.dispose()
    hitGeometry?.dispose()
  }, [hitGeometry, lineGeometry, lineMaterial])

  useFrame((_, delta) => {
    if (!pulse.current || !impact.current) return
    if (!paused && !reducedMotion) displayTime.current += Math.min(delta * 1000, 50) * speed
    const progress = pinned ? 0.62 : THREE.MathUtils.clamp((displayTime.current - event.simulationStartedAt) / event.duration, 0, 1)
    const opacity = pinned ? 1 : eventOpacity(event, displayTime.current)
    lineMaterial.opacity = opacity * (selected ? 1 : event.outcome === 'blocked' ? 0.82 : 0.74)
    const transmission = THREE.MathUtils.clamp((progress - 0.08) / 0.62, 0, 1)
    pulse.current.position.copy(curve.getPoint(transmission))
    const pulseVisible = progress >= 0.06 && progress <= 0.75
    pulse.current.scale.setScalar(pulseVisible ? (selected ? 1.55 : 1) * opacity : 0)
    const responseProgress = THREE.MathUtils.clamp((progress - 0.68) / 0.22, 0, 1)
    const flare = pinned ? 0.7 : Math.sin(responseProgress * Math.PI)
    impact.current.scale.setScalar(flare * (selected ? 1.7 : 1.15) * opacity)
  })

  return (
    <group>
      <primitive object={lineObject} />
      {hitGeometry ? (
        <mesh geometry={hitGeometry} onClick={(clickEvent) => { clickEvent.stopPropagation(); onSelect(event) }}>
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      <mesh ref={pulse} geometry={PULSE_GEOMETRY} material={pulseMaterial} dispose={null} />
      <mesh ref={impact} position={target} geometry={IMPACT_GEOMETRY} material={impactMaterial} dispose={null} />
    </group>
  )
}
