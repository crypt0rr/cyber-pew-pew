import { ChevronDown, ChevronUp, Radio } from 'lucide-react'
import { useState } from 'react'
import { CATEGORY_META, OUTCOME_META } from '../meta'
import type { CyberEvent } from '../types'

export function MobileEventSheet({ events, onSelect }: { events: CyberEvent[]; onSelect: (event: CyberEvent) => void }) {
  const [expanded, setExpanded] = useState(false)
  const latest = events[0]

  return (
    <aside className={`mobile-event-sheet glass-panel${expanded ? ' is-expanded' : ''}`} aria-label="Mobile event stream">
      <button type="button" className="mobile-sheet-toggle" aria-label="Toggle mobile event stream" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
        <Radio size={13} />
        {latest ? (
          <>
            <span className="mobile-sheet-route"><strong>{latest.source.countryCode}</strong> → <strong>{latest.target.countryCode}</strong></span>
            <span className="mobile-sheet-vector" style={{ color: CATEGORY_META[latest.category].color }}>{CATEGORY_META[latest.category].label}</span>
            <span className="mobile-sheet-outcome" style={{ color: OUTCOME_META[latest.outcome].color }}>{OUTCOME_META[latest.outcome].label}</span>
          </>
        ) : <span className="mobile-sheet-empty">Waiting for next simulated event…</span>}
        {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
      </button>
      {expanded ? (
        <div className="mobile-sheet-list">
          {events.slice(0, 10).map((event) => (
            <button key={event.id} type="button" className="mobile-sheet-row" data-event-id={event.id} onClick={() => { onSelect(event); setExpanded(false) }}>
              <i style={{ background: CATEGORY_META[event.category].color }} />
              <span><strong>{event.source.countryCode}</strong> → <strong>{event.target.countryCode}</strong></span>
              <span>{CATEGORY_META[event.category].label}</span>
              <em style={{ color: OUTCOME_META[event.outcome].color }}>{OUTCOME_META[event.outcome].label}</em>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  )
}
