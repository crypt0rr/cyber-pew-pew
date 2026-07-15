import { render, screen } from '@testing-library/react'
import { SimulationEngine } from '../simulation/engine'
import { DetailsDrawer } from './DetailsDrawer'

describe('DetailsDrawer', () => {
  it('clearly discloses generated event data', () => {
    render(<DetailsDrawer event={new SimulationEngine(1, 1000).next()} endpoint={null} onClose={() => undefined} />)
    expect(screen.getByText('Synthetic event')).toBeInTheDocument()
    expect(screen.getByText(/generated locally/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close details' })).toBeInTheDocument()
  })
})
