import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders the Hotel Lobby Chaos title screen', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /lobby chaos simulator/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start frühschicht/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start nachtschicht/i })).toBeInTheDocument()
  })

  it('starts the Frühschicht desk and shows German response options', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start frühschicht/i }))

    expect(screen.getByText(/guest line/i)).toBeInTheDocument()
    expect(screen.getByText(/Entschuldigung, bis wann gibt es Frühstück/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Frühstück|Bis 10:30|Kaffee/i })).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: /Der Kaffee wartet/i }))

    const feedbackHeading = screen.getByRole('heading', { name: /Saubere Lösung/i })
    expect(feedbackHeading).toBeInTheDocument()
    expect(feedbackHeading.parentElement).toHaveClass('text-ink')
    expect(screen.getByText(/Kaffee-Ausgabe: stabil/i)).toBeInTheDocument()
    expect(screen.queryByText(/Express-Check-out/i)).not.toBeInTheDocument()
  })

  it('starts the Nachtschicht desk with its compact night pack', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start nachtschicht/i }))

    expect(screen.getByText(/Nachtschicht HUD/i)).toBeInTheDocument()
    expect(screen.getByText(/1\/4/)).toBeInTheDocument()
    expect(screen.getByText(/später als geplant/i)).toBeInTheDocument()
    expect(screen.getByText(/Nacht-Log/i)).toBeInTheDocument()
  })

  it('uses an accessible Nacht badge pair for high-pressure guests', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start nachtschicht/i }))
    await user.click(screen.getByRole('button', { name: /^A\./ }))
    await user.click(screen.getByRole('button', { name: /next guest/i }))

    const urgentBadge = screen.getByText('dringend')
    expect(urgentBadge).toHaveClass('bg-coral/15', 'text-cream', 'ring-coral/25')
    expect(urgentBadge).not.toHaveClass('text-coral')
  })

  it('uses the Nacht label and count in the Shift Report', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start nachtschicht/i }))

    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole('button', { name: /^A\./ }))
      if (index < 3) await user.click(screen.getByRole('button', { name: /next guest/i }))
    }

    expect(screen.getByText(/Hotel Ostseeblick — Nachtschicht Patch Notes/i)).toBeInTheDocument()
    expect(screen.getByText(/4\/4 Gäste bearbeitet/i)).toBeInTheDocument()
  })

  it('plays the promise mini-shift through feedback, returning guest, report, and restart', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /mini-schicht.*versprechen/i }))
    expect(screen.getByText(/Mini-Schicht HUD/i)).toBeInTheDocument()
    expect(screen.getByText(/Begegnung/i)).toBeInTheDocument()
    expect(screen.getByText('dringend')).toHaveClass('text-ink')
    expect(screen.getByText(/1\/2/)).toBeInTheDocument()
    expect(screen.getByText(/Können Sie mir versprechen/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /10:30 Uhr Bescheid/i }))
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.queryByText('3/2')).not.toBeInTheDocument()
    expect(screen.getByText(/janji yang terbatas/i)).toBeInTheDocument()
    expect(screen.queryByText(/Ich bin wieder da/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /weiter mit demselben gast/i }))
    expect(screen.getByText(/Ich bin wieder da/i)).toBeInTheDocument()
    expect(screen.getByText('2/2')).toBeInTheDocument()
    expect(screen.queryByText('3/2')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ich prüfe den aktuellen stand/i }))
    expect(screen.getByText('2/2')).toBeInTheDocument()
    expect(screen.queryByText('3/2')).not.toBeInTheDocument()
    expect(screen.getByText(/kamu menepati janji untuk memberi kabar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zur schichtauswertung/i })).toBeInTheDocument()
    expect(screen.queryByText(/2\/2 Begegnungen bearbeitet/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /zur schichtauswertung/i }))
    expect(screen.getByText(/mini-schicht: das versprechen patch notes/i)).toBeInTheDocument()
    expect(screen.getByText(/2\/2 Begegnungen bearbeitet/i)).toBeInTheDocument()
    expect(screen.getByText(/Zimmerstatus\. Ohne Prüfung keine Versprechen/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /neue schicht/i }).at(-1)!)
    expect(screen.getByText(/Können Sie mir versprechen/i)).toBeInTheDocument()
    expect(screen.getByText(/1\/2/)).toBeInTheDocument()
    expect(screen.queryByText(/Feedback/i)).not.toBeInTheDocument()
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
