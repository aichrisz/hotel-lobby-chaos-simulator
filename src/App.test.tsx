import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders the Hotel Lobby Chaos title screen', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /lobby chaos simulator/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start frühschicht/i })).toBeInTheDocument()
  })

  it('starts the Frühschicht desk and shows German response options', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start frühschicht/i }))

    expect(screen.getByText(/guest line/i)).toBeInTheDocument()
    expect(screen.getByText(/Entschuldigung, bis wann gibt es Frühstück/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Frühstück|Bis 10:30|Kaffee/i })).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: /Der Kaffee wartet/i }))

    expect(screen.getByRole('heading', { name: /Saubere Lösung/i })).toBeInTheDocument()
    expect(screen.getByText(/Kaffee-Ausgabe: stabil/i)).toBeInTheDocument()
    expect(screen.queryByText(/Express-Check-out/i)).not.toBeInTheDocument()
  })

  it('opens the portfolio case study from the title screen', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /read case study/i }))

    expect(screen.getByRole('heading', { name: /a small game from a real desk problem/i })).toBeInTheDocument()
    expect(screen.getByText(/React, TypeScript, Vite/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view github repo/i })).toHaveAttribute(
      'href',
      'https://github.com/aichrisz/hotel-lobby-chaos-simulator',
    )
  })
})
