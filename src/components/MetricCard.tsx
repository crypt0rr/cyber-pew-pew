import type { ReactNode } from 'react'

export function MetricCard({ label, value, accent, icon }: { label: string; value: string; accent?: boolean; icon?: ReactNode }) {
  return (
    <div className={`metric-card${accent ? ' metric-card--accent' : ''}`}>
      <span className="metric-card__label">{icon}{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
