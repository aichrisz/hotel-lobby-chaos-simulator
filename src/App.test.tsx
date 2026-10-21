import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { promiseScenarios } from './content/promiseScenarios'
import App from './App'

function optionButton(optionId: 'a' | 'b' | 'c') {
  return document.querySelector<HTMLButtonElement>(`button[data-option-id="${optionId}"]`)!
}

describe('App', () => {
  it('opens with one relaxed promise story and a separate optional challenge setting', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: /jaga lobi tetap tenang/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mulai cerita singkat/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /belajar santai/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /tantangan waktu/i })).not.toBeChecked()
    expect(screen.queryByRole('button', { name: /janji kepada tamu/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /mulai cerita singkat/i }))

    expect(screen.getByText(/Pertemuan 1 dari 2/i)).toBeInTheDocument()
    expect(screen.getByText(/belum bisa memverifikasi waktunya/i)).toBeInTheDocument()
    expect(screen.getByText('Hotel Ostseeblick fiktif; contoh ini bukan SOP hotel atau aturan pemberi kerja.')).toBeInTheDocument()
    expect(screen.getAllByRole('button').filter((button) => button.hasAttribute('data-option-id'))).toHaveLength(3)
    expect(screen.queryByText(/3:00/)).not.toBeInTheDocument()
    expect(screen.getByText(/tanpa timer/i)).toBeInTheDocument()
    expect(screen.getByText(/Zimmer bis elf Uhr fertig/i)).toHaveAttribute('lang', 'de')
  })

  it('offers all three shifts and lets challenge pacing be chosen independently', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('radio', { name: /tantangan waktu/i }))
    await user.click(screen.getByRole('button', { name: /pilih shift lain/i }))
    expect(screen.getByRole('button', { name: /janji kepada tamu.*das versprechen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shift pagi.*frühschicht/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shift malam.*nachtschicht/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /shift malam.*nachtschicht/i }))
    expect(screen.getByText('Kartu 1 dari 4')).toBeInTheDocument()
    expect(screen.getByLabelText(/sisa waktu tantangan/i)).toHaveTextContent('3:00')
    await user.click(screen.getByText('Detail shift'))
    expect(screen.getByText(/waktu membaca berjalan/i)).toBeInTheDocument()
  })

  it('shows the selected German response, curated reason, and actual clamped deltas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /mulai cerita singkat/i }))
    await user.click(optionButton('a'))

    expect(screen.getByRole('heading', { name: /pilihanmu/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(promiseScenarios[0].options[0].textDe)).toHaveAttribute('lang', 'de')
    expect(screen.getByRole('heading', { name: 'Dampak jawaban', level: 3 })).toBeInTheDocument()
    expect(screen.getByTestId('guest-reaction')).toHaveTextContent('Tamu mengangguk kecil; bel meja kembali diam.')
    expect(screen.getByTestId('guest-reaction').querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText(/Kamu menjanjikan waktu untuk memberi kabar/i)).toBeInTheDocument()
    expect(screen.getByText('Kepuasan +10')).toBeInTheDocument()
    expect(screen.getByText('Ketenangan 0')).toBeInTheDocument()
    expect(screen.queryByText(/pilihan a|opsi a/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lanjutkan/i })).toBeInTheDocument()
  })

  it.each([
    ['Janji kepada tamu', 'promise', 2],
    ['Shift pagi', 'frueh', 12],
    ['Shift malam', 'nacht', 4],
  ] as const)('shows final feedback before report in %s', async (label, mode, count) => {
    const user = userEvent.setup()
    render(<App />)
    if (mode !== 'promise') {
      await user.click(screen.getByRole('button', { name: /pilih shift lain/i }))
      await user.click(screen.getByRole('button', { name: new RegExp(label, 'i') }))
    } else {
      await user.click(screen.getByRole('button', { name: /mulai cerita singkat/i }))
    }

    for (let index = 0; index < count; index += 1) {
      await user.click(optionButton('a'))
      expect(screen.getByRole('heading', { name: /pilihanmu/i, level: 2 })).toBeInTheDocument()
      if (index < count - 1) await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    }

    expect(screen.getByRole('button', { name: /lihat hasil/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /pelajaran dibawa pulang/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /lihat hasil/i }))
    expect(screen.getByRole('heading', { name: /pelajaran dibawa pulang/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /coba jawaban lain/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /pilih shift/i }).length).toBeGreaterThan(0)
  })

  it('routes shuffled promise choices by their stable IDs and keeps order through feedback', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /mulai cerita singkat/i }))
    const orderBefore = [...document.querySelectorAll<HTMLButtonElement>('[data-option-id]')].map((button) => button.dataset.optionId)
    await user.click(optionButton('b'))
    expect(screen.getByText(/janji kamar siap belum aman/i)).toBeInTheDocument()
    expect(screen.getByText(/Pertemuan 1 dari 2/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    expect(screen.getAllByText(/Tamu yang sama kembali/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Es ist elf, mein Zimmer ist noch nicht bereit/i)).toBeInTheDocument()
    const secondOrder = [...document.querySelectorAll<HTMLButtonElement>('[data-option-id]')].map((button) => button.dataset.optionId)
    expect(secondOrder).toHaveLength(3)
    expect(orderBefore).toHaveLength(3)
  })

  it('guards rapid duplicate answers and does not double-score', async () => {
    render(<App />)
    await userEvent.setup().click(screen.getByRole('button', { name: /mulai cerita singkat/i }))
    const answer = optionButton('a')
    act(() => {
      fireEvent.click(answer)
      fireEvent.click(answer)
    })

    expect(screen.getByRole('heading', { name: /pilihanmu/i, level: 2 })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /lanjutkan/i }))
    await userEvent.setup().click(screen.getByText('Detail shift'))
    expect(screen.getByText('Keputusan dicatat').nextElementSibling).toHaveTextContent('1')
  })

  it('asks before leaving an unfinished run and Cancel retains the current feedback', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /mulai cerita singkat/i }))
    await user.click(optionButton('b'))
    const leaveButton = screen.getByRole('button', { name: /pilih shift/i })
    await user.click(leaveButton)

    const dialog = screen.getByRole('dialog', { name: /tinggalkan shift ini/i })
    const keepPlaying = within(dialog).getByRole('button', { name: /tetap bermain/i })
    expect(keepPlaying).toHaveFocus()
    await user.click(keepPlaying)
    expect(leaveButton).toHaveFocus()
    expect(screen.getByRole('heading', { name: /pilihanmu/i, level: 2 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    expect(screen.getAllByText(/Tamu yang sama kembali/i).length).toBeGreaterThan(0)
  })

  it('accepts leave confirmation and exposes the shift picker', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /mulai cerita singkat/i }))
    await user.click(screen.getByRole('button', { name: /pilih shift/i }))
    const dialog = screen.getByRole('dialog', { name: /tinggalkan shift ini/i })
    await user.click(within(dialog).getByRole('button', { name: /tinggalkan shift/i }))
    expect(screen.getByRole('button', { name: /mulai cerita singkat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /janji kepada tamu.*das versprechen/i })).toBeInTheDocument()
  })

  it('replays the same mode from encounter one with branch and feedback reset', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /mulai cerita singkat/i }))
    await user.click(optionButton('b'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    await user.click(optionButton('a'))
    await user.click(screen.getByRole('button', { name: /lihat hasil/i }))
    await user.click(screen.getByRole('button', { name: /coba jawaban lain/i }))

    expect(screen.getByText(/Pertemuan 1 dari 2/i)).toBeInTheDocument()
    expect(screen.getByText(/belum bisa memverifikasi waktunya/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /pilihanmu/i })).not.toBeInTheDocument()
    await user.click(optionButton('b'))
    await user.click(screen.getByRole('button', { name: /lanjutkan/i }))
    expect(screen.getAllByText(/Tamu yang sama kembali/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Es ist elf, mein Zimmer ist noch nicht bereit/i)).toBeInTheDocument()
  })

  it('keeps the case study available as a secondary destination', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /tentang permainan/i }))

    expect(screen.getByRole('heading', { name: /tentang permainan/i })).toBeInTheDocument()
    expect(screen.getByText(/React, TypeScript, Vite/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Lihat repositori GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/aichrisz/hotel-lobby-chaos-simulator',
    )
  })
})
