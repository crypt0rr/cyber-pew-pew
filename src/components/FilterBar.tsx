import { ATTACK_CATEGORIES, EVENT_OUTCOMES, type AttackCategory, type EventOutcome } from '../types'
import { CATEGORY_META, OUTCOME_META } from '../meta'

interface FilterBarProps {
  categories: Set<AttackCategory>
  outcomes: Set<EventOutcome>
  onToggleCategory: (category: AttackCategory) => void
  onToggleOutcome: (outcome: EventOutcome) => void
}

export function FilterBar({ categories, outcomes, onToggleCategory, onToggleOutcome }: FilterBarProps) {
  return (
    <section className="filter-bar" aria-label="Event filters">
      <div className="filter-group">
        <span className="filter-label">Vectors</span>
        <div className="filter-options">
          {ATTACK_CATEGORIES.map((category) => {
            const meta = CATEGORY_META[category]
            const active = categories.has(category)
            return (
              <button key={category} type="button" className={`filter-chip${active ? ' is-active' : ''}`} aria-label={meta.label} aria-pressed={active} onClick={() => onToggleCategory(category)}>
                <i style={{ backgroundColor: meta.color }} />
                <span className="filter-chip__long">{meta.label}</span><span className="filter-chip__short">{meta.short}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="filter-group filter-group--outcome">
        <span className="filter-label">Response</span>
        <div className="filter-options">
          {EVENT_OUTCOMES.map((outcome) => {
            const meta = OUTCOME_META[outcome]
            const active = outcomes.has(outcome)
            return (
              <button key={outcome} type="button" className={`outcome-chip${active ? ' is-active' : ''}`} aria-pressed={active} onClick={() => onToggleOutcome(outcome)}>
                <i style={{ backgroundColor: meta.color }} />{meta.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
