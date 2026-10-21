import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { LobbyScenario } from './content/lobbyScenarios'
import { familyIdForScenario } from './content/scenarioVariants'
import { createRunManifest } from './engine/runManifest'
import App from './App'

function option(id: 'a' | 'b' | 'c') { return document.querySelector<HTMLButtonElement>(`[data-option-id="${id}"]`)! }
function seedFor(variant: 'taxi-urgent' | 'shuttle-urgent') {
  let seed = 0
  while (createRunManifest('spaet', seed).episodeVariant !== variant) seed += 1
  return seed
}
async function startSpaet(seed: number) {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /pilih shift lain/i }))
  const random = vi.spyOn(Math, 'random').mockReturnValue((seed + 0.1) / 0x7fffffff)
  await user.click(screen.getByRole('button', { name: /spätschicht/i }))
  random.mockRestore()
  return user
}
async function startMorning(seed: number) {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /pilih shift lain/i }))
  const random = vi.spyOn(Math, 'random').mockReturnValue((seed + 0.1) / 0x7fffffff)
  await user.click(screen.getByRole('button', { name: /shift pagi/i }))
  random.mockRestore()
  return user
}
async function completeBest(user: ReturnType<typeof userEvent.setup>, guest: 'taxi' | 'family') {
  await user.click(document.querySelector<HTMLButtonElement>(`[data-priority-guest="${guest}"]`)!)
  for (let step = 0; step < 3; step += 1) {
    await user.click(option('a'))
    if (step < 2) await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
  }
  await user.click(screen.getByRole('button', { name: /lihat hasil/i }))
}

describe('playable random shifts in the app', () => {
  it('shows only factual invoice notes before and after the selected response', async () => {
    const user = await startMorning(7)
    expect(document.querySelector('[data-scenario-id]')).toHaveAttribute('data-scenario-id', 'firmenrechnung-split-fehlende-daten')

    await user.click(screen.getByText('Detail shift', { exact: true }))
    const shiftDetails = screen.getByText('Detail shift', { exact: true }).closest('details')!
    expect(within(shiftDetails).getByText('Firmenrechnung: Anschrift fehlt; Ausstellung noch offen.')).toBeInTheDocument()
    expect(within(shiftDetails).queryByText(/Anschrift.*bestätigt/i)).not.toBeInTheDocument()

    await user.click(option('a'))
    await user.click(screen.getByText('Mengapa?', { exact: true }))
    const rationale = screen.getByText('Mengapa?', { exact: true }).closest('details')!
    expect(within(rationale).getByText('Firmenrechnung: Anschrift fehlt; Ausstellung noch offen.')).toBeInTheDocument()
    expect(within(rationale).queryByText(/Anschrift.*bestätigt/i)).not.toBeInTheDocument()
  })

  it('shows the selected open taxi evidence in Mengapa and a neutral detail note before answering', async () => {
    const user = await startSpaet(0)
    await user.click(document.querySelector<HTMLButtonElement>('[data-priority-guest="taxi"]')!)
    await user.click(screen.getByText('Detail shift', { exact: true }))
    const shiftDetails = screen.getByText('Detail shift', { exact: true }).closest('details')!
    expect(within(shiftDetails).getByText('Hasil adegan dicatat setelah jawaban dipilih.')).toBeInTheDocument()
    expect(within(shiftDetails).queryByText(/Rechnung versendet/i)).not.toBeInTheDocument()

    await user.click(option('c'))
    await user.click(screen.getByText('Mengapa?', { exact: true }))
    const rationale = screen.getByText('Mengapa?', { exact: true }).closest('details')!
    expect(within(rationale).getByText('Tamu dilepas tanpa langkah faktur yang disepakati.')).toBeInTheDocument()
    expect(within(rationale).queryByText(/Geprüfte Rechnung versendet/i)).not.toBeInTheDocument()
  })

  it.each([
    ['taxi-urgent', 'taxi'],
    ['taxi-urgent', 'family'],
    ['shuttle-urgent', 'taxi'],
    ['shuttle-urgent', 'family'],
  ] as const)('does not carry a waiting identity onto the third independent reservation (%s, %s first)', async (variant, firstGuest) => {
    const user = await startSpaet(seedFor(variant))
    await user.click(document.querySelector<HTMLButtonElement>(`[data-priority-guest="${firstGuest}"]`)!)
    await user.click(option('a'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    await user.click(option('a'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))

    expect(document.querySelector('[data-scenario-id]')).toHaveAttribute('data-scenario-id', 'spaet-reservierung-naechte')
    expect(screen.queryByText(/Tamu yang menunggu:|Tamu yang tadi menunggu sekarang dilayani:/i)).not.toBeInTheDocument()
  })

  it.each([
    ['taxi-urgent', 'taxi', 'Lobi lancar', 'spaet-taxi-urgent-family-after-taxi'],
    ['taxi-urgent', 'family', 'Shift dipulihkan', 'spaet-taxi-urgent-taxi-pending'],
    ['shuttle-urgent', 'family', 'Lobi lancar', 'spaet-shuttle-urgent-taxi-pending'],
    ['shuttle-urgent', 'taxi', 'Shift dipulihkan', 'spaet-shuttle-urgent-family-pending'],
  ] as const)('plays normal start %s, %s first', async (variant, guest, ending, pendingId) => {
    const user = await startSpaet(seedFor(variant))
    await user.click(document.querySelector<HTMLButtonElement>(`[data-priority-guest="${guest}"]`)!)
    expect(document.querySelector('[data-scenario-id]')?.getAttribute('data-scenario-id')).toContain(`spaet-${variant}-${guest}-opening`)
    await user.click(option('a'))
    expect(screen.getByTestId('episode-consequence')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    expect(document.querySelector('[data-scenario-id]')).toHaveAttribute('data-scenario-id', pendingId)
    await user.click(option('a'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    expect(screen.getByText('Pertemuan 3 dari 3')).toBeInTheDocument()
    await user.click(option('a'))
    await user.click(screen.getByRole('button', { name: /lihat hasil/i }))
    expect(screen.getByTestId('episode-outcome')).toHaveTextContent(ending)
    expect(screen.getByText('3 dari 3 pertemuan selesai.')).toBeInTheDocument()
  })

  it('replays the same manifest cleanly and exposes the other priority', async () => {
    const user = await startSpaet(seedFor('taxi-urgent'))
    const queueCopy = [...document.querySelectorAll('[data-priority-guest]')].map((node) => node.textContent)
    await completeBest(user, 'taxi')
    await user.click(screen.getByRole('button', { name: /coba urutan lain/i }))
    expect([...document.querySelectorAll('[data-priority-guest]')].map((node) => node.textContent)).toEqual(queueCopy)
    await user.click(document.querySelector<HTMLButtonElement>('[data-priority-guest="family"]')!)
    await user.click(option('a'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    expect(document.querySelector('[data-scenario-id]')).toHaveAttribute('data-scenario-id', 'spaet-taxi-urgent-taxi-pending')
  })

  it('reaches Ada urusan terbuka through factual choices', async () => {
    const user = await startSpaet(seedFor('taxi-urgent'))
    await user.click(document.querySelector<HTMLButtonElement>('[data-priority-guest="taxi"]')!)
    await user.click(option('c'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    await user.click(option('a'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    await user.click(option('b'))
    await user.click(screen.getByRole('button', { name: /lihat hasil/i }))
    expect(screen.getByTestId('episode-outcome')).toHaveTextContent('Ada urusan terbuka')
    expect(screen.getByTestId('episode-outcome')).toHaveTextContent(/faktur|reservasi/i)
  })

  it('plays exactly five distinct compatible morning families in Surprise', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /pilih shift lain/i }))
    await user.click(screen.getByRole('button', { name: /shift kejutan.*überraschung/i }))
    const families: string[] = []
    for (let index = 0; index < 5; index += 1) {
      const id = document.querySelector<HTMLElement>('[data-scenario-id]')?.dataset.scenarioId
      expect(id).toBeTruthy()
      families.push(familyIdForScenario({ id: id! } as LobbyScenario))
      await user.click(option('a'))
      if (index < 4) await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    }
    expect(new Set(families).size).toBe(5)
    await user.click(screen.getByRole('button', { name: /lihat hasil/i }))
    expect(screen.getByText('5 dari 5 kartu selesai.')).toBeInTheDocument()
  })

  it('reaches both urgency reversals and preserves timeout-safe output', async () => {
    for (const [variant, guest] of [['taxi-urgent', 'family'], ['shuttle-urgent', 'taxi']] as const) {
      const user = await startSpaet(seedFor(variant))
      await completeBest(user, guest)
      expect(screen.getByTestId('episode-outcome')).toHaveTextContent('Shift dipulihkan')
      cleanup()
    }
  })
})
