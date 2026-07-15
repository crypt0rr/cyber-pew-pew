import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { GlobeControls } from './GlobeControls'

describe('GlobeControls speed accessibility', () => {
  it('exposes descriptive pressed-state speed controls', () => {
    const onSpeed = vi.fn()
    render(
      <GlobeControls
        paused={false}
        autoRotate
        speed={1}
        onTogglePaused={() => undefined}
        onToggleRotate={() => undefined}
        onSpeed={onSpeed}
        onZoomIn={() => undefined}
        onZoomOut={() => undefined}
        onReset={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: '1 times simulation speed' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '2 times simulation speed' }))
    expect(onSpeed).toHaveBeenCalledWith(2)
  })
})
