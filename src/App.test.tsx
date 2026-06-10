import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Hotel Quest heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /hotel quest/i }),
    ).toBeInTheDocument()
  })
})
