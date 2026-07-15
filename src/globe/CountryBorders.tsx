import { useMemo } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import countries from 'world-atlas/countries-110m.json'
import { latLonToVector3 } from './geo'

type Coordinates = number[][][][]

export function CountryBorders() {
  const geometry = useMemo(() => {
    const topology = countries as unknown as { objects: { countries: never } }
    const collection = feature(countries as never, topology.objects.countries) as unknown as {
      features: Array<{ geometry: { type: string; coordinates: Coordinates | Coordinates[number] } }>
    }
    const positions: number[] = []

    const addRing = (ring: number[][]) => {
      for (let index = 1; index < ring.length; index += 1) {
        const previous = ring[index - 1]
        const current = ring[index]
        if (Math.abs(previous[0] - current[0]) > 180) continue
        const a = latLonToVector3(previous[1], previous[0], 2.012)
        const b = latLonToVector3(current[1], current[0], 2.012)
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }
    }

    for (const item of collection.features) {
      if (item.geometry.type === 'Polygon') {
        for (const ring of item.geometry.coordinates as number[][][]) addRing(ring)
      } else if (item.geometry.type === 'MultiPolygon') {
        for (const polygon of item.geometry.coordinates as Coordinates) {
          for (const ring of polygon) addRing(ring)
        }
      }
    }

    const buffer = new THREE.BufferGeometry()
    buffer.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return buffer
  }, [])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#55ffd0" transparent opacity={0.31} depthWrite={false} />
    </lineSegments>
  )
}
