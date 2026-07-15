import type { CyberEvent } from '../types'

function deterministicFraction(id: string, seed: number) {
  let hash = seed | 0
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 0x45d9f3b)
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296
}

export function selectVisualCandidate(candidates: CyberEvent[], visualHistory: CyberEvent[], seed: number) {
  if (candidates.length === 0) return null
  const recentCategories = new Set(visualHistory.slice(0, 5).map((event) => event.category))
  return candidates.reduce((best, candidate) => {
    const score = candidate.severity
      + (candidate.outcome === 'active' ? 4 : 0)
      + (recentCategories.has(candidate.category) ? 0 : 3)
      + deterministicFraction(candidate.id, seed)
    const bestScore = best.severity
      + (best.outcome === 'active' ? 4 : 0)
      + (recentCategories.has(best.category) ? 0 : 3)
      + deterministicFraction(best.id, seed)
    return score > bestScore ? candidate : best
  })
}
