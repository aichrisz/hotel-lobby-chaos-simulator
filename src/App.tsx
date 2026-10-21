import { useEffect, useRef, useState } from 'react'
import { feedbackFor } from './content/feedback'
import { categoryLabels, pressureLabels, type LobbyScenario, type OptionId } from './content/lobbyScenarios'
import { buildReport, chooseOption, currentScenario, formatClock, initialShiftState, orderedOptions, tickClock, type AnsweredCard, type Pacing, type ShiftMode, type ShiftState } from './engine/shiftEngine'

type Screen = 'title' | 'desk' | 'report' | 'caseStudy'

const lessonFor: Record<ShiftMode, string> = {
  promise: 'Janjikan kabar yang bisa kamu tepati; jangan menjamin hasil yang belum diperiksa.',
  frueh: 'Dengarkan kebutuhan tamu, lalu tawarkan langkah yang benar-benar bisa dilakukan.',
  nacht: 'Akui masalah dengan tenang, periksa fakta, dan jelaskan langkah berikutnya.',
}

const modeChoices: { mode: ShiftMode; label: string; german: string; detail: string }[] = [
  { mode: 'promise', label: 'Janji kepada tamu', german: 'Das Versprechen', detail: '1 tamu · 2 pertemuan' },
  { mode: 'frueh', label: 'Shift pagi', german: 'Frühschicht', detail: '12 kartu' },
  { mode: 'nacht', label: 'Shift malam', german: 'Nachtschicht', detail: '4 kartu' },
]

function newRunSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}

function deltaLabel(label: string, delta: number): string {
  return `${label} ${delta > 0 ? '+' : ''}${delta}`
}

function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [shift, setShift] = useState<ShiftState>(() => initialShiftState('promise', undefined, 'relaxed'))
  const [feedback, setFeedback] = useState<AnsweredCard | null>(null)
  const [pacing, setPacing] = useState<Pacing>('relaxed')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden)
  const phaseRef = useRef<'choose' | 'feedback' | 'report'>('choose')
  const leaveTriggerRef = useRef<HTMLButtonElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRenderRef = useRef(true)
  const activeScenario = feedback?.scenario ?? currentScenario(shift)
  const isNight = shift.mode === 'nacht' && (screen === 'desk' || screen === 'report')
  const presentationKey = screen === 'desk'
    ? `desk-${shift.scenarioIndex}-${feedback?.scenario.id ?? ''}-${feedback?.option.id ?? ''}`
    : screen

  useEffect(() => {
    const onVisibilityChange = () => setDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    const heading = headingRef.current
    if (!heading) return
    heading.focus({ preventScroll: true })
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    heading.scrollIntoView?.({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
  }, [presentationKey])

  useEffect(() => {
    if (
      screen !== 'desk' || shift.pacing !== 'challenge' || shift.done || feedback ||
      detailsOpen || helpOpen || leaveDialogOpen || !documentVisible
    ) return
    const timer = window.setInterval(() => {
      setShift((current) => tickClock(current))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [detailsOpen, documentVisible, feedback, helpOpen, leaveDialogOpen, screen, shift.done, shift.pacing])

  useEffect(() => {
    if (screen === 'desk' && shift.done && !feedback) {
      phaseRef.current = 'report'
      setScreen('report')
    }
  }, [feedback, screen, shift.done])

  function startShift(mode: ShiftMode, selectedPacing = pacing) {
    const nextShift = initialShiftState(mode, undefined, selectedPacing, newRunSeed())
    phaseRef.current = 'choose'
    setShift(nextShift)
    setPacing(selectedPacing)
    setFeedback(null)
    setDetailsOpen(false)
    setHelpOpen(false)
    setLeaveDialogOpen(false)
    setPickerOpen(false)
    setScreen('desk')
  }

  function answer(optionId: OptionId) {
    if (phaseRef.current !== 'choose' || screen !== 'desk' || feedback) return
    const next = chooseOption(shift, optionId)
    if (next === shift) return
    phaseRef.current = 'feedback'
    setShift(next)
    setFeedback(next.answered.at(-1) ?? null)
  }

  function nextGuest() {
    if (phaseRef.current !== 'feedback' || !feedback) return
    setFeedback(null)
    setDetailsOpen(false)
    setHelpOpen(false)
    if (shift.done) {
      phaseRef.current = 'report'
      setScreen('report')
    } else {
      phaseRef.current = 'choose'
    }
  }

  function askToLeave(trigger: HTMLButtonElement) {
    leaveTriggerRef.current = trigger
    setLeaveDialogOpen(true)
  }

  function cancelLeave() {
    setLeaveDialogOpen(false)
    window.setTimeout(() => leaveTriggerRef.current?.focus(), 0)
  }

  function leaveRun() {
    phaseRef.current = 'choose'
    setFeedback(null)
    setDetailsOpen(false)
    setHelpOpen(false)
    setLeaveDialogOpen(false)
    setPickerOpen(true)
    setScreen('title')
  }

  function selectShift(mode: ShiftMode) {
    startShift(mode, pacing)
  }

  function replay() {
    startShift(shift.mode, shift.pacing)
  }

  return (
    <main
      data-screen={screen}
      className={`min-h-dvh ${isNight ? 'bg-night text-cream' : 'bg-[radial-gradient(circle_at_top_left,#fff8e7_0,#e8dbc3_44%,#bdc7b9_100%)] text-ink'}`}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-3 py-3 sm:px-6 sm:py-5">
        <header className={`flex min-h-14 items-center justify-between gap-3 rounded-3xl border px-3 py-2 shadow-lg sm:px-4 ${isNight ? 'border-white/15 bg-night/95 shadow-black/20' : 'border-white/80 bg-cream/95 shadow-wood/10'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-wood font-display text-xl font-black text-cream">H</span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-black leading-tight">Hotel Ostseeblick</p>
              <p className={`text-xs font-bold ${isNight ? 'text-cream/75' : 'text-wood/80'}`}>Latihan resepsionis bahasa Jerman</p>
            </div>
          </div>
          {screen === 'desk' && (
            <div className="flex shrink-0 items-center gap-2">
              {shift.pacing === 'challenge' && (
                <span className="rounded-xl bg-night px-3 py-2 font-bold tabular-nums text-cream" aria-label="Sisa waktu tantangan">
                  {formatClock(shift.remainingSeconds)}
                </span>
              )}
              <button type="button" onClick={(event) => askToLeave(event.currentTarget)} className="min-h-11 rounded-xl border border-wood/20 bg-white/70 px-3 text-sm font-extrabold text-wood transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">
                Pilih shift
              </button>
            </div>
          )}
          {screen === 'report' && (
            <button type="button" onClick={() => { setPickerOpen(true); setScreen('title') }} className="min-h-11 rounded-xl border border-wood/20 bg-white/70 px-3 text-sm font-extrabold text-wood transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">
              Pilih shift
            </button>
          )}
          {screen === 'caseStudy' && (
            <button type="button" onClick={() => setScreen('title')} className="min-h-11 rounded-xl border border-wood/20 bg-white/70 px-3 text-sm font-extrabold text-wood transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">
              Kembali
            </button>
          )}
        </header>

        {screen === 'title' && (
          <TitleScreen
            headingRef={headingRef}
            pacing={pacing}
            pickerOpen={pickerOpen}
            onPacingChange={setPacing}
            onStart={() => startShift('promise')}
            onTogglePicker={() => setPickerOpen((open) => !open)}
            onSelectShift={selectShift}
            onCaseStudy={() => setScreen('caseStudy')}
          />
        )}
        {screen === 'desk' && activeScenario && (
          <DeskScreen
            refHeading={headingRef}
            shift={shift}
            scenario={activeScenario}
            feedback={feedback}
            detailsOpen={detailsOpen}
            onHelpToggle={(open) => setHelpOpen(open)}
            onAnswer={answer}
            onNext={nextGuest}
            onDetailsToggle={(open) => setDetailsOpen(open)}
          />
        )}
        {screen === 'report' && <ReportScreen refHeading={headingRef} shift={shift} onReplay={replay} onPickShift={() => { setPickerOpen(true); setScreen('title') }} />}
        {screen === 'caseStudy' && <CaseStudyScreen refHeading={headingRef} onBack={() => setScreen('title')} onStart={() => startShift('promise', pacing)} />}
      </div>
      <LeaveDialog
        open={leaveDialogOpen}
        onCancel={cancelLeave}
        onConfirm={leaveRun}
      />
    </main>
  )
}

function TitleScreen({
  headingRef,
  pacing,
  pickerOpen,
  onPacingChange,
  onStart,
  onTogglePicker,
  onSelectShift,
  onCaseStudy,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  pacing: Pacing
  pickerOpen: boolean
  onPacingChange: (pacing: Pacing) => void
  onStart: () => void
  onTogglePicker: () => void
  onSelectShift: (mode: ShiftMode) => void
  onCaseStudy: () => void
}) {
  return (
    <section className="grid flex-1 content-start gap-4 py-1 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:py-5">
      <div className="rounded-[1.75rem] border border-white/90 bg-cream/95 p-5 shadow-xl shadow-wood/10 sm:p-8">
        <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-3 font-display text-4xl font-black leading-[1.03] tracking-tight text-ink sm:text-5xl">
          Jaga lobi tetap tenang.
        </h2>
        <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-ink/85 sm:text-lg">
          Pilih respons dalam bahasa Jerman. Pahami dampaknya dengan bantuan bahasa Indonesia.
        </p>
        <div className="mt-5 rounded-2xl border border-brass/25 bg-white/70 p-4">
          <fieldset>
            <legend className="font-display text-lg font-black text-ink">Pilih tempo</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 font-bold ${pacing === 'relaxed' ? 'border-brass bg-brass/15 text-ink' : 'border-wood/15 bg-white/75 text-wood'}`}>
                <input type="radio" name="pacing" value="relaxed" checked={pacing === 'relaxed'} onChange={() => onPacingChange('relaxed')} className="size-5 accent-brass" />
                <span>Belajar santai</span>
              </label>
              <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 font-bold ${pacing === 'challenge' ? 'border-brass bg-brass/15 text-ink' : 'border-wood/15 bg-white/75 text-wood'}`}>
                <input type="radio" name="pacing" value="challenge" checked={pacing === 'challenge'} onChange={() => onPacingChange('challenge')} className="size-5 accent-brass" />
                <span>Tantangan waktu</span>
              </label>
            </div>
          </fieldset>
          <p className="mt-2 text-sm font-semibold text-wood/85">
            {pacing === 'relaxed' ? 'Tanpa hitung mundur. Selesaikan semua kartu sesuai ritmemu.' : '3 menit; waktu membaca berjalan dan setiap jawaban punya biaya waktu.'}
          </p>
        </div>
        <button type="button" onClick={onStart} className="mt-4 min-h-14 w-full rounded-2xl bg-brass px-5 py-3 text-center font-display text-xl font-black text-ink shadow-lg shadow-brass/20 transition-colors hover:bg-[#d5a342] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-night/50 sm:w-auto sm:min-w-64">
          Mulai cerita singkat
        </button>
        <p className="mt-2 text-sm font-bold text-wood/85">Das Versprechen · 1 tamu · 2 pertemuan</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={onTogglePicker} aria-expanded={pickerOpen} aria-controls="shift-picker" className="min-h-11 rounded-xl px-2 font-extrabold text-wood underline decoration-brass decoration-2 underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">
            {pickerOpen ? 'Tutup pilihan shift' : 'Pilih shift lain'}
          </button>
          <button type="button" onClick={onCaseStudy} className="min-h-11 rounded-xl px-2 font-bold text-wood underline decoration-wood/30 underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">
            Tentang permainan
          </button>
        </div>
        {pickerOpen && (
          <div id="shift-picker" className="mt-2 rounded-2xl border border-wood/15 bg-white/75 p-3">
            <h3 className="px-2 font-display text-lg font-black">Pilih cerita</h3>
            <div className="mt-1 grid gap-2">
              {modeChoices.map((choice) => (
                <button key={choice.mode} type="button" onClick={() => onSelectShift(choice.mode)} className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-cream px-3 py-2 text-left ring-1 ring-wood/10 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">
                  <span className="font-extrabold text-ink">{choice.label} <span lang="de" className="font-bold text-wood">· {choice.german}</span></span>
                  <span className="text-sm font-semibold text-wood/85">{choice.detail}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <aside className="rounded-[1.5rem] bg-wood p-4 text-cream shadow-lg shadow-wood/15 sm:p-5">
        <h3 className="font-display text-xl font-black text-cream">Cerita fiktif, latihan nyata</h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-cream/90">
          Hotel Ostseeblick tidak nyata. Pilihan dan konteksnya untuk latihan bahasa, bukan SOP hotel atau aturan pemberi kerja.
        </p>
        <p className="mt-3 text-sm font-bold text-brass">Humor Möwen tetap dibawa.</p>
      </aside>
    </section>
  )
}

function DeskScreen({
  refHeading,
  shift,
  scenario,
  feedback,
  detailsOpen,
  onHelpToggle,
  onAnswer,
  onNext,
  onDetailsToggle,
}: {
  refHeading: React.RefObject<HTMLHeadingElement | null>
  shift: ShiftState
  scenario: LobbyScenario
  feedback: AnsweredCard | null
  detailsOpen: boolean
  onHelpToggle: (open: boolean) => void
  onAnswer: (optionId: OptionId) => void
  onNext: () => void
  onDetailsToggle: (open: boolean) => void
}) {
  const options = orderedOptions(scenario, shift.shuffleSeed, shift.scenarioIndex)
  const before = shift.answered.at(-2)
  const satisfactionBefore = before?.satisfactionAfter ?? 70
  const composureBefore = before?.composureAfter ?? 100
  const progressIndex = feedback ? shift.scenarioIndex : shift.scenarioIndex + 1
  const isPromise = shift.mode === 'promise'
  const isNight = shift.mode === 'nacht'
  const isReturning = scenario.id.startsWith('promise-return-')

  return (
    <section className="grid flex-1 content-start gap-3 py-1 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:py-3">
      <div data-scenario-id={scenario.id} className={`rounded-[1.75rem] border p-4 shadow-xl sm:p-6 ${shift.mode === 'nacht' ? 'border-white/15 bg-[#354a73] text-cream shadow-black/20' : 'border-white/90 bg-cream/95 text-ink shadow-wood/10'}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-current/10 pb-3">
          <p className={`text-sm font-extrabold ${isNight ? 'text-cream' : 'text-wood/85'}`} lang="id">
            {isPromise ? `Pertemuan ${progressIndex} dari ${shift.scenarios.length}` : `Kartu ${progressIndex} dari ${shift.scenarios.length}`}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span lang="de" className="rounded-full bg-cream px-3 py-1 text-ink">{categoryLabels[scenario.category]} · {pressureLabels[scenario.pressure]}</span>
            {shift.pacing === 'relaxed' && <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-950">Belajar santai · tanpa timer</span>}
            {shift.pacing === 'challenge' && <span className="rounded-full bg-night px-3 py-1 text-cream">Tantangan waktu</span>}
          </div>
        </div>
        {isReturning && <p className={`mb-2 text-sm font-extrabold ${isNight ? 'text-brass' : 'text-wood'}`} lang="id">Tamu yang sama kembali</p>}
        {!feedback ? (
          <h2 ref={refHeading} tabIndex={-1} lang="de" className="scroll-mt-3 font-display text-xl font-extrabold leading-relaxed sm:text-2xl">
            {scenario.guestLineDe}
          </h2>
        ) : (
          <h2 ref={refHeading} tabIndex={-1} className="scroll-mt-3 font-display text-2xl font-black leading-tight sm:text-3xl">
            Pilihanmu
          </h2>
        )}
        {!feedback && (
          <>
            <div className={`mt-3 border-l-4 border-brass/70 pl-3 ${isNight ? 'text-cream' : 'text-ink'}`} lang="id">
              <p className="text-base font-semibold leading-relaxed"><span className={`font-black ${isNight ? 'text-cream' : 'text-wood'}`}>Konteks · </span>{scenario.situationId}</p>
              <p className={`mt-1 text-sm font-semibold leading-relaxed ${isNight ? 'text-cream/85' : 'text-wood/85'}`}>Hotel Ostseeblick fiktif; contoh ini bukan SOP hotel atau aturan pemberi kerja.</p>
            </div>
            <div className="mt-3 grid gap-2.5" aria-label="Pilihan respons dalam bahasa Jerman">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-option-id={option.id}
                  lang="de"
                  onClick={() => onAnswer(option.id)}
                  className="min-h-14 rounded-2xl border border-wood/15 bg-white px-4 py-3 text-left text-base font-extrabold leading-relaxed text-ink shadow-sm transition-colors hover:bg-[#fffdf6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/60"
                >
                  {option.textDe}
                </button>
              ))}
            </div>
            <details className="mt-3 rounded-xl border border-wood/15 bg-cream px-3" onToggle={(event) => onHelpToggle(event.currentTarget.open)}>
              <summary className="flex min-h-11 cursor-pointer items-center font-extrabold text-wood">Bantuan dan aturan tempo</summary>
              <p className="pb-3 text-sm font-semibold leading-relaxed text-ink/85" lang="id">
                Gunakan konteks yang terlihat untuk memilih kalimat Jerman; situasi ini bukan prosedur umum hotel. Membuka bantuan akan menjeda jam tantangan.
              </p>
            </details>
          </>
        )}
        {feedback && (
          <FeedbackPanel
            scenario={scenario}
            shift={shift}
            feedback={feedback}
            satisfactionDelta={feedback.satisfactionAfter - satisfactionBefore}
            composureDelta={feedback.composureAfter - composureBefore}
            onNext={onNext}
          />
        )}
      </div>
      <details className="rounded-[1.5rem] border border-wood/15 bg-cream/95 px-4 shadow-md shadow-wood/5" open={detailsOpen} onToggle={(event) => onDetailsToggle(event.currentTarget.open)}>
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 font-display text-lg font-black text-wood">
          Detail shift
        </summary>
        <div className="border-t border-wood/10 pb-4 pt-3 text-sm font-semibold text-ink" lang="id">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
            <dt>Kepuasan</dt><dd className="text-right font-extrabold">{shift.satisfaction}/100</dd>
            <dt>Ketenangan</dt><dd className="text-right font-extrabold">{shift.composure}/100</dd>
            <dt>Keputusan dicatat</dt><dd className="text-right font-extrabold">{shift.answered.length}</dd>
            {shift.pacing === 'challenge' && <><dt>Waktu tersisa</dt><dd className="text-right font-extrabold tabular-nums">{formatClock(shift.remainingSeconds)}</dd></>}
          </dl>
          <p className="mt-3 rounded-xl bg-white/80 p-3 text-ink/85" lang="de">{scenario.shiftReportLine}</p>
          <p className="mt-2 text-xs leading-relaxed text-wood/85">
            {shift.pacing === 'challenge'
              ? 'Waktu membaca berjalan; jawaban juga mengurangi waktu sesuai biayanya. Jam berhenti saat bantuan atau detail shift terbuka dan ketika tab disembunyikan.'
              : 'Tempo santai tidak memakai hitung mundur atau biaya jawaban untuk mengakhiri cerita.'}
          </p>
        </div>
      </details>
    </section>
  )
}

function FeedbackPanel({
  scenario,
  shift,
  feedback,
  satisfactionDelta,
  composureDelta,
  onNext,
}: {
  scenario: LobbyScenario
  shift: ShiftState
  feedback: AnsweredCard
  satisfactionDelta: number
  composureDelta: number
  onNext: () => void
}) {
  const bestOption = scenario.options.find((option) => option.id === scenario.bestOptionId)
  const finalAnswer = shift.done
  const positive = feedback.wasBest
  return (
    <section className="mt-4 rounded-[1.5rem] border border-brass/30 bg-[#fffaf0] p-4 text-ink shadow-md sm:p-5" lang="id" aria-labelledby="feedback-title">
      <p className="text-sm font-black uppercase tracking-[0.12em] text-wood">{positive ? 'Pilihan sesuai konteks' : 'Ada pilihan yang lebih tepat'}</p>
      <h3 id="feedback-title" className="mt-1 font-display text-2xl font-black leading-tight text-ink sm:text-3xl">Dampak jawaban</h3>
      <blockquote lang="de" className="mt-3 rounded-xl bg-white p-3 text-base font-extrabold leading-relaxed text-ink ring-1 ring-wood/10">{feedback.option.textDe}</blockquote>
      <div className="mt-3 flex items-center gap-2 text-sm font-extrabold leading-relaxed text-wood" data-testid="guest-reaction">
        <svg className="guest-bell size-5 shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        <span>{positive ? 'Tamu mengangguk kecil; bel meja kembali diam.' : 'Tamu tampak ragu; bel meja berdenting pelan.'}</span>
      </div>
      <p className="mt-3 text-base font-bold leading-relaxed text-ink">{feedbackFor(scenario.id, feedback.option.id)}</p>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Perubahan nilai">
        <span className="rounded-full bg-wood px-3 py-1.5 text-sm font-extrabold text-cream">{deltaLabel('Kepuasan', satisfactionDelta)}</span>
        <span className="rounded-full bg-wood px-3 py-1.5 text-sm font-extrabold text-cream">{deltaLabel('Ketenangan', composureDelta)}</span>
      </div>
      <details className="mt-3 rounded-xl border border-wood/15 bg-white/70 px-3">
        <summary className="flex min-h-11 cursor-pointer items-center font-extrabold text-wood">Mengapa?</summary>
        <div className="space-y-3 pb-3 text-sm font-semibold leading-relaxed text-ink/90">
          <p>{scenario.rationaleId}</p>
          {bestOption && !feedback.wasBest && (
            <div className="rounded-xl bg-cream p-3">
              <p className="font-black text-wood">Respons yang paling sesuai dalam skenario ini</p>
              <p lang="de" className="mt-1 text-base font-bold">{bestOption.textDe}</p>
            </div>
          )}
          <p lang="de" className="rounded-xl bg-wood p-3 text-cream">{scenario.shiftReportLine}</p>
        </div>
      </details>
      <button type="button" onClick={onNext} className="mt-4 min-h-14 w-full rounded-2xl bg-brass px-5 py-3 font-display text-xl font-black text-ink shadow-sm transition-colors hover:bg-[#d5a342] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-night/50">
        {finalAnswer ? 'Lihat hasil' : 'Lanjutkan'}
      </button>
    </section>
  )
}

function ReportScreen({ refHeading, shift, onReplay, onPickShift }: {
  refHeading: React.RefObject<HTMLHeadingElement | null>
  shift: ShiftState
  onReplay: () => void
  onPickShift: () => void
}) {
  const report = buildReport(shift)
  const relaxed = shift.pacing === 'relaxed'
  const completionText = shift.finishReason === 'timeout'
    ? `Waktu tantangan habis setelah ${report.answeredCount} keputusan.`
    : `${report.answeredCount} dari ${report.scenarioCount} ${shift.mode === 'promise' ? 'pertemuan' : 'kartu'} selesai.`

  return (
    <section className="grid flex-1 content-start place-items-center py-1 sm:py-4">
      <div className="w-full min-w-0 max-w-3xl rounded-[1.75rem] border border-white/90 bg-cream/97 p-5 text-ink shadow-xl shadow-wood/15 sm:p-8">
        <p className="font-bold text-wood">{shift.mode === 'promise' ? 'Das Versprechen' : shift.mode === 'nacht' ? 'Nachtschicht' : 'Frühschicht'}</p>
        <h2 ref={refHeading} tabIndex={-1} className="scroll-mt-3 mt-1 break-words font-display text-3xl font-black leading-tight sm:text-4xl">Pelajaran dibawa pulang</h2>
        <p className="mt-2 text-base font-extrabold text-wood">{completionText}</p>
        <div className="mt-4 rounded-2xl bg-white/75 p-4 ring-1 ring-wood/10" lang="id">
          <h3 className="font-display text-lg font-black">Yang bisa kamu bawa ke percakapan berikutnya</h3>
          <p className="mt-1 text-base font-semibold leading-relaxed text-ink">{lessonFor[shift.mode]}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-wood p-4 text-cream">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brass">Stempel kecil</p>
            <p className="font-display text-xl font-black">{report.achievement.name}</p>
            <p className="text-sm font-semibold text-cream/85">{report.achievement.flavor}</p>
          </div>
          <span className="rounded-full border border-brass/60 px-3 py-1 text-sm font-extrabold text-brass">{relaxed ? 'Belajar santai' : 'Tantangan'}</span>
        </div>
        <details className="mt-3 rounded-2xl border border-wood/15 bg-white/75 px-4">
          <summary className="flex min-h-12 cursor-pointer font-extrabold text-wood">Rincian nilai dan catatan</summary>
          <div className="border-t border-wood/10 pb-4 pt-3">
            {relaxed && <p className="mb-3 text-sm font-semibold leading-relaxed text-wood">Nilai ini hanya ringkasan simulasi belajar santai; jangan dibandingkan langsung dengan hasil tantangan waktu.</p>}
            {!relaxed && <p className="mb-3 text-sm font-semibold text-wood">Note 1 = nilai terbaik dalam tantangan.</p>}
            <dl className="grid grid-cols-1 gap-y-1 text-sm font-semibold text-ink sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-4 sm:gap-y-2">
              <dt className="min-w-0 break-words">Kepuasan tamu</dt><dd className="min-w-0 break-words text-right font-black">{report.satisfaction}/100</dd>
              <dt className="min-w-0 break-words">Ketenangan</dt><dd className="min-w-0 break-words text-right font-black">{report.composure}/100</dd>
              <dt className="min-w-0 break-words">Efisiensi simulasi</dt><dd className="min-w-0 break-words text-right font-black">{report.efficiency}/100</dd>
              {!relaxed && <><dt className="min-w-0 break-words">Nilai tantangan · Note {report.grade}</dt><dd className="min-w-0 break-words text-right font-black">{report.finalScore}</dd></>}
            </dl>
            <h3 className="mt-4 font-display font-black text-ink">Catatan shift</h3>
            <ul className="mt-1 list-inside list-disc space-y-1 break-words text-sm font-semibold leading-relaxed text-ink/90">
              {report.patchLines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        </details>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onReplay} className="min-h-14 rounded-2xl bg-brass px-5 py-3 font-display text-lg font-black text-ink shadow-sm transition-colors hover:bg-[#d5a342] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-night/50">Coba jawaban lain</button>
          <button type="button" onClick={onPickShift} className="min-h-14 rounded-2xl border border-wood/20 bg-white px-5 py-3 font-display text-lg font-black text-wood transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">Pilih shift</button>
        </div>
      </div>
    </section>
  )
}

function CaseStudyScreen({ refHeading, onBack, onStart }: {
  refHeading: React.RefObject<HTMLHeadingElement | null>
  onBack: () => void
  onStart: () => void
}) {
  return (
    <section className="mx-auto grid w-full max-w-3xl flex-1 content-start gap-4 py-1 sm:py-5">
      <article className="rounded-[1.75rem] border border-white/90 bg-cream/95 p-5 shadow-xl shadow-wood/10 sm:p-8">
        <h2 ref={refHeading} tabIndex={-1} className="scroll-mt-3 font-display text-3xl font-black sm:text-4xl">Tentang permainan</h2>
        <p className="mt-3 text-base font-semibold leading-relaxed text-ink/85">
          Hotel Lobby Chaos Simulator adalah latihan fiktif untuk membaca pilihan layanan dalam bahasa Jerman dan memahami dampaknya melalui penjelasan bahasa Indonesia.
        </p>
        <div className="mt-4 rounded-2xl bg-wood p-4 text-cream">
          <p className="font-display text-lg font-black text-brass">Batas simulasi</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">Hotel, tamu, dan situasinya rekaan. Materi ini bukan SOP hotel dan tidak mewakili kebijakan pemberi kerja.</p>
        </div>
        <p className="mt-4 text-sm font-bold text-wood">Teknologi: React, TypeScript, Vite, Tailwind CSS, dan Vitest.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onStart} className="min-h-14 rounded-2xl bg-brass px-5 font-display text-lg font-black text-ink">Mulai cerita singkat</button>
          <a href="https://github.com/aichrisz/hotel-lobby-chaos-simulator" className="grid min-h-14 place-items-center rounded-2xl border border-wood/20 bg-white px-5 text-center font-extrabold text-wood underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">Lihat repositori GitHub</a>
        </div>
        <button type="button" onClick={onBack} className="mt-3 min-h-11 px-2 font-bold text-wood underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">Kembali ke beranda</button>
      </article>
    </section>
  )
}

function LeaveDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
      dialog.querySelector<HTMLButtonElement>('button')?.focus()
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog ref={dialogRef} aria-labelledby="leave-title" onCancel={(event) => { event.preventDefault(); onCancel() }} className="w-[calc(100%-2rem)] max-w-md rounded-[1.5rem] border border-wood/15 bg-cream p-5 text-ink shadow-2xl backdrop:bg-night/60">
      <h2 id="leave-title" className="font-display text-2xl font-black">Tinggalkan shift ini?</h2>
      <p className="mt-2 font-semibold leading-relaxed">Kemajuan shift yang belum selesai akan dibuang. Kamu bisa tetap bermain atau kembali ke pemilih shift.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button type="button" autoFocus onClick={onCancel} className="min-h-12 rounded-xl border border-wood/20 bg-white px-4 font-extrabold text-wood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">Tetap bermain</button>
        <button type="button" onClick={onConfirm} className="min-h-12 rounded-xl bg-wood px-4 font-extrabold text-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brass/50">Tinggalkan shift</button>
      </div>
    </dialog>
  )
}

export default App
