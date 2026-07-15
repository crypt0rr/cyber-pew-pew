import { Activity } from 'lucide-react'
import { CATEGORY_META, OUTCOME_META } from '../meta'
import type { CyberEvent } from '../types'

export function EventFeed({ events, onSelect }: { events: CyberEvent[]; onSelect: (event: CyberEvent) => void }) {
  return (
    <aside className="event-feed glass-panel" aria-label="Recent simulated events">
      <div className="panel-heading">
        <span><Activity size={14} /> Event stream</span>
        <span className="live-label"><i /> live</span>
      </div>
      <div className="event-list">
        {events.slice(0, 8).map((event) => (
          <button className="event-row" key={event.id} data-event-id={event.id} onClick={() => onSelect(event)}>
            <span className="event-row__rail" style={{ background: CATEGORY_META[event.category].color }} />
            <span className="event-row__route"><strong>{event.source.countryCode}</strong><em>→</em><strong>{event.target.countryCode}</strong></span>
            <span className="event-row__meta">{CATEGORY_META[event.category].label}</span>
            <span className="event-row__status" style={{ color: OUTCOME_META[event.outcome].color }}>{OUTCOME_META[event.outcome].label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
