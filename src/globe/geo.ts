import * as THREE from 'three'

export const GLOBE_RADIUS = 2

export function latLonToVector3(latitude: number, longitude: number, radius = GLOBE_RADIUS) {
  const phi = THREE.MathUtils.degToRad(90 - latitude)
  const theta = THREE.MathUtils.degToRad(longitude + 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function greatCirclePoints(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  segments = 48,
) {
  const start = latLonToVector3(from.latitude, from.longitude).normalize()
  const end = latLonToVector3(to.latitude, to.longitude).normalize()
  const angle = start.angleTo(end)
  const points: THREE.Vector3[] = []

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments
    const sinAngle = Math.sin(angle)
    const direction = sinAngle < 0.0001
      ? start.clone().lerp(end, progress).normalize()
      : start.clone().multiplyScalar(Math.sin((1 - progress) * angle) / sinAngle)
        .add(end.clone().multiplyScalar(Math.sin(progress * angle) / sinAngle))
    const altitude = GLOBE_RADIUS + Math.sin(progress * Math.PI) * (0.25 + angle * 0.28)
    points.push(direction.multiplyScalar(altitude))
  }

  return points
}
