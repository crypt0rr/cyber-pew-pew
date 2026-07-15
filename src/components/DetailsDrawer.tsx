import { Crosshair, MapPin, ShieldCheck, X } from 'lucide-react'
import { CATEGORY_META, OUTCOME_META } from '../meta'
import type { CyberEvent, GeoEndpoint } from '../types'

interface DetailsDrawerProps {
  event: CyberEvent | null
  endpoint: GeoEndpoint | null
  onClose: () => void
}

export function DetailsDrawer({ event, endpoint, onClose }: DetailsDrawerProps) {
  if (!event && !endpoint) return null

  return (
    <aside className="details-drawer glass-panel" aria-label={event ? 'Event details' : 'Location details'}>
      <button type="button" className="icon-button details-close" aria-label="Close details" onClick={onClose}><X size={17} /></button>
      {event ? (
        <>
          <div className="eyebrow"><Crosshair size={13} /> Event intelligence</div>
          <div className="drawer-title-row">
            <h2>{event.source.countryCode} <span>→</span> {event.target.countryCode}</h2>
            <span className="severity">SEV {event.severity}</span>
          </div>
          <div className="route-card">
            <div><small>Origin</small><strong>{event.source.city}</strong><span>{event.source.country}</span></div>
            <div className="route-line"><i /><span>•••</span><i /></div>
            <div><small>Target</small><strong>{event.target.city}</strong><span>{event.target.country}</span></div>
          </div>
          <dl className="details-grid">
            <div><dt>Vector</dt><dd style={{ color: CATEGORY_META[event.category].color }}>{CATEGORY_META[event.category].label}</dd></div>
            <div><dt>Response</dt><dd style={{ color: OUTCOME_META[event.outcome].color }}>{OUTCOME_META[event.outcome].label}</dd></div>
            <div><dt>Event ID</dt><dd>{event.id.toUpperCase()}</dd></div>
            <div><dt>Observed</dt><dd>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</dd></div>
          </dl>
          <div className="simulation-note"><ShieldCheck size={15} /><p><strong>Synthetic event</strong>This record is generated locally for demonstration and does not represent real telemetry.</p></div>
        </>
      ) : endpoint ? (
        <>
          <div className="eyebrow"><MapPin size={13} /> Network node</div>
          <h2>{endpoint.city}</h2>
          <p className="location-country">{endpoint.country} · {endpoint.countryCode}</p>
          <dl className="details-grid">
            <div><dt>Latitude</dt><dd>{endpoint.latitude.toFixed(2)}°</dd></div>
            <div><dt>Longitude</dt><dd>{endpoint.longitude.toFixed(2)}°</dd></div>
            <div><dt>Traffic weight</dt><dd>{endpoint.weight}/12</dd></div>
            <div><dt>Node type</dt><dd>Simulated hub</dd></div>
          </dl>
          <div className="simulation-note"><ShieldCheck size={15} /><p><strong>Demonstration node</strong>Locations are plausible routing hubs, not live infrastructure measurements.</p></div>
        </>
      ) : null}
    </aside>
  )
}
