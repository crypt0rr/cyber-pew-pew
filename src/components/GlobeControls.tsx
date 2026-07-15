import { Minus, Pause, Play, Plus, RotateCcw, RotateCw } from 'lucide-react'

interface GlobeControlsProps {
  paused: boolean
  autoRotate: boolean
  speed: number
  onTogglePaused: () => void
  onToggleRotate: () => void
  onSpeed: (speed: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export function GlobeControls(props: GlobeControlsProps) {
  return (
    <div className="control-dock glass-panel" aria-label="Simulation controls">
      <button type="button" className="control-primary" onClick={props.onTogglePaused} aria-label={props.paused ? 'Resume simulation' : 'Pause simulation'}>
        {props.paused ? <Play size={15} /> : <Pause size={15} />}<span>{props.paused ? 'Resume' : 'Pause'}</span>
      </button>
      <div className="dock-divider" />
      <button type="button" className={`icon-button${props.autoRotate ? ' is-active' : ''}`} onClick={props.onToggleRotate} aria-label="Toggle globe rotation" aria-pressed={props.autoRotate}><RotateCw size={16} /></button>
      <button type="button" className="icon-button" onClick={props.onZoomIn} aria-label="Zoom in"><Plus size={16} /></button>
      <button type="button" className="icon-button" onClick={props.onZoomOut} aria-label="Zoom out"><Minus size={16} /></button>
      <button type="button" className="icon-button" onClick={props.onReset} aria-label="Reset simulation"><RotateCcw size={16} /></button>
      <div className="dock-divider" />
      <div className="speed-control" aria-label="Simulation speed">
        {[0.5, 1, 2].map((speed) => (
          <button key={speed} type="button" className={props.speed === speed ? 'is-active' : ''} aria-label={`${speed} times simulation speed`} aria-pressed={props.speed === speed} onClick={() => props.onSpeed(speed)}>{speed}×</button>
        ))}
      </div>
    </div>
  )
}
