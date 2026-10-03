import { useEffect, useState } from 'react'
import { categoryLabels, pressureLabels, type LobbyScenario, type OptionId } from './content/lobbyScenarios'
import { buildReport, chooseOption, currentScenario, formatClock, initialShiftState, type AnsweredCard, type ShiftMode, type ShiftState } from './engine/shiftEngine'

type Screen = 'title' | 'desk' | 'report' | 'caseStudy'

const pressureClass: Record<LobbyScenario['pressure'], string> = {
  low: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  medium: 'bg-amber-100 text-amber-950 ring-amber-200',
  high: 'bg-coral/15 text-coral ring-coral/25',
  system: 'bg-slate-900 text-cream ring-slate-600',
}

function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [shift, setShift] = useState<ShiftState>(() => initialShiftState())
  const [feedback, setFeedback] = useState<AnsweredCard | null>(null)
  const active = feedback?.scenario ?? currentScenario(shift)
  const isNight = shift.mode === 'nacht' && screen !== 'title' && screen !== 'caseStudy'

  useEffect(() => {
    if (screen !== 'desk' || shift.done || feedback) return
    const timer = window.setInterval(() => {
      setShift((current) => {
        if (current.done || feedback) return current
        const remainingSeconds = Math.max(0, current.remainingSeconds - 1)
        return { ...current, remainingSeconds, done: remainingSeconds <= 0 }
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [feedback, screen, shift.done])

  useEffect(() => {
    if (screen === 'desk' && shift.done && !(shift.mode === 'promise' && feedback)) {
      setScreen('report')
    }
  }, [feedback, screen, shift.done, shift.mode])

  function startShift(mode: ShiftMode = 'frueh') {
    setShift(initialShiftState(mode))
    setFeedback(null)
    setScreen('desk')
  }

  function answer(optionId: OptionId) {
    setShift((current) => {
      const next = chooseOption(current, optionId)
      setFeedback(next.answered.at(-1) ?? null)
      return next
    })
  }

  function nextGuest() {
    setFeedback(null)
    if (shift.done) setScreen('report')
  }

  return (
    <main className={isNight ? 'min-h-dvh bg-night text-cream' : 'min-h-dvh bg-[radial-gradient(circle_at_top_left,#fff8e7_0,#e8dbc3_42%,#b8c2b2_100%)] text-ink'}>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className={`flex items-center justify-between gap-3 rounded-[1.75rem] border p-3 shadow-xl backdrop-blur md:p-4 ${isNight ? 'border-white/10 bg-night/90 shadow-black/20' : 'border-white/70 bg-cream/85 shadow-slate-900/10'}`}>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-wood text-2xl text-cream shadow-inner shadow-white/10">🏨</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-brass">Hotel Ostseeblick</p>
              <h1 className={`font-display text-2xl font-black leading-none md:text-3xl ${isNight ? 'text-cream' : 'text-ink'}`}>Lobby Chaos Simulator</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setScreen('caseStudy')} className={`hidden min-h-11 rounded-2xl border px-4 font-bold shadow-sm active:scale-95 sm:block ${isNight ? 'border-white/15 bg-white/10 text-cream' : 'border-wood/15 bg-white/60 text-wood'}`}>
              Case Study
            </button>
            <button type="button" onClick={() => startShift(shift.mode)} className="min-h-11 rounded-2xl bg-wood px-4 font-bold text-cream shadow-lg shadow-wood/20 active:scale-95">
              Neue Schicht
            </button>
          </div>
        </header>

        {screen === 'title' && <TitleScreen onStart={startShift} onCaseStudy={() => setScreen('caseStudy')} />}
        {screen === 'desk' && active && (
          <DeskScreen shift={shift} scenario={active} feedback={feedback} onAnswer={answer} onNext={nextGuest} />
        )}
        {screen === 'report' && <ReportScreen shift={shift} onRestart={() => startShift(shift.mode)} />}
        {screen === 'caseStudy' && <CaseStudyScreen onStart={startShift} />}
      </div>
    </main>
  )
}

function TitleScreen({ onStart, onCaseStudy }: { onStart: (mode: ShiftMode) => void; onCaseStudy: () => void }) {
  return (
    <section className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[1fr_0.78fr]">
      <div className="rounded-[2rem] border border-white/80 bg-cream/92 p-6 shadow-2xl shadow-slate-900/15 md:p-10">
        <p className="mb-3 inline-flex rounded-full bg-brass/20 px-4 py-2 text-sm font-black text-wood ring-1 ring-brass/30">
          Frühschicht, Nachtschicht oder Mini-Schicht · Spielzeit 3:00
        </p>
        <h2 className="font-display text-5xl font-black leading-[0.95] text-ink md:text-7xl">
          Calm desk. Chaotic guests.
        </h2>
        <p className="mt-5 max-w-2xl text-lg font-semibold text-ink/75 md:text-xl">
          Survive a fictional German hotel front desk shift. Pilih jawaban Jerman, jaga tamu tetap tenang, dan jangan kehilangan composure sebelum kopi mesin menyerah duluan.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => onStart('frueh')} className="min-h-14 rounded-2xl bg-brass px-6 font-display text-xl font-black text-ink shadow-xl shadow-brass/25 transition active:scale-95">
            Start Frühschicht
          </button>
          <button type="button" onClick={() => onStart('nacht')} className="min-h-14 rounded-2xl bg-night px-6 font-display text-xl font-black text-cream shadow-xl shadow-night/25 transition active:scale-95">
            Start Nachtschicht
          </button>
          <button type="button" onClick={() => onStart('promise')} className="min-h-14 rounded-2xl border border-wood/20 bg-white/70 px-6 font-display text-xl font-black text-wood shadow transition active:scale-95">
            Mini-Schicht: Das Versprechen
          </button>
          <button type="button" onClick={onCaseStudy} className="grid min-h-14 place-items-center rounded-2xl border border-wood/20 bg-white/55 px-6 font-bold text-wood transition active:scale-95">
            Read Case Study
          </button>
        </div>
      </div>
      <aside className="rounded-[2rem] bg-wood p-5 text-cream shadow-2xl shadow-wood/25 md:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brass">MVP Rules</p>
        <ul className="mt-4 space-y-3 text-sm font-semibold text-cream/85">
          <li>• 12 Frühkarten + 4 Nachtkarten.</li>
          <li>• No login, no backend, no runtime AI.</li>
          <li>• Reception is triage, not perfection.</li>
          <li>• Möwen are a known issue. Status: WONTFIX.</li>
        </ul>
      </aside>
    </section>
  )
}

function DeskScreen({
  shift,
  scenario,
  feedback,
  onAnswer,
  onNext,
}: {
  shift: ShiftState
  scenario: LobbyScenario
  feedback: AnsweredCard | null
  onAnswer: (optionId: OptionId) => void
  onNext: () => void
}) {
  const bestOption = scenario.options.find((option) => option.id === scenario.bestOptionId)
  const isNight = shift.mode === 'nacht'
  const isPromise = shift.mode === 'promise'
  const pressureBadgeClass = isPromise && scenario.pressure === 'high'
    ? 'bg-coral/15 text-ink ring-coral/25'
    : isNight && scenario.pressure === 'high'
      ? 'bg-coral/15 text-cream ring-coral/25'
      : pressureClass[scenario.pressure]
  return (
    <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[300px_1fr]">
      <aside className={`rounded-[2rem] p-5 text-cream shadow-2xl shadow-wood/20 ${isNight ? 'bg-night' : 'bg-wood'}`}>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-brass">{isNight ? 'Nachtschicht HUD' : isPromise ? 'Mini-Schicht HUD' : 'Desk HUD'}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Clock" value={formatClock(shift.remainingSeconds)} />
          <Stat label={shift.mode === 'promise' ? 'Begegnung' : 'Guest'} value={`${feedback ? shift.answered.length : shift.scenarioIndex + 1}/${shift.scenarios.length}`} />
          <Stat label="Satisfaction" value={shift.satisfaction} />
          <Stat label="Composure" value={shift.composure} />
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-cream/80">
          <p className="font-black text-brass">{isNight ? 'Nacht-Log' : isPromise ? 'Versprechen-Log' : 'Known issue'}</p>
          <p>{isNight ? 'Flur, Taxi, Kaffeemaschine. Alles klingt nachts lauter.' : isPromise ? 'Status prüfen, dann einen bestätigten nächsten Schritt nennen.' : 'Möwen. Printer. PMS freeze. Sometimes all three before breakfast.'}</p>
        </div>
      </aside>

      <div className={`rounded-[2rem] border p-5 shadow-2xl shadow-slate-900/15 md:p-8 ${isNight ? 'border-white/10 bg-night' : 'border-white/80 bg-cream/95'}`}>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ring-1 ${pressureBadgeClass}`}>
            {pressureLabels[scenario.pressure]}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-wood ring-1 ring-wood/10">
            {categoryLabels[scenario.category]}
          </span>
        </div>

        <p className={`font-bold ${isNight ? 'text-brass/80' : 'text-wood/70'}`}>Guest line</p>
        <h2 className={`mt-2 font-display text-3xl font-black leading-tight md:text-5xl ${isNight ? 'text-cream' : 'text-ink'}`}>{scenario.guestLineDe}</h2>
        <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-semibold text-ink/75">{scenario.situationId}</p>

        {!feedback ? (
          <div className="mt-6 grid gap-3">
            {scenario.options.map((option) => (
              <button key={option.id} type="button" onClick={() => onAnswer(option.id)} className="min-h-16 rounded-2xl border border-wood/10 bg-white/75 p-4 text-left font-bold text-ink shadow transition hover:bg-white active:scale-[0.99]">
                <span className="mr-2 text-brass">{option.id.toUpperCase()}.</span>
                {option.textDe}
              </button>
            ))}
          </div>
        ) : (
          <div className={`mt-6 rounded-[1.5rem] border p-5 text-ink ${feedback.wasBest ? 'border-emerald-200 bg-emerald-50' : 'border-coral/20 bg-coral/10'}`}>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-wood/60">Feedback</p>
            <h3 className="mt-1 font-display text-3xl font-black">{feedback.wasBest ? 'Saubere Lösung.' : 'Bisa, tapi ada patch yang lebih aman.'}</h3>
            <p className="mt-3 font-semibold text-ink/80">{scenario.rationaleId}</p>
            <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-bold text-ink/75">
              <p className="text-wood/60">Best response</p>
              <p>{bestOption?.textDe}</p>
            </div>
            <p className="mt-4 rounded-2xl bg-wood p-4 font-mono text-sm text-cream">{scenario.shiftReportLine}</p>
            <button type="button" onClick={onNext} className="mt-5 min-h-14 w-full rounded-2xl bg-brass px-6 font-display text-xl font-black text-ink active:scale-95">
              {shift.done ? 'Zur Schichtauswertung' : shift.mode === 'promise' ? 'Weiter mit demselben Gast' : 'Next guest'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function ReportScreen({ shift, onRestart }: { shift: ShiftState; onRestart: () => void }) {
  const report = buildReport(shift)
  const isNight = shift.mode === 'nacht'
  const knownIssues = shift.mode === 'promise'
    ? '– Zimmerstatus. Ohne Prüfung keine Versprechen.'
    : isNight
      ? '– 03:00-Kaffee. Weiterhin persönlich nehmen.'
      : '– Möwen. Weiterhin. Status: WONTFIX.'
  return (
    <section className="grid flex-1 place-items-center py-8">
      <div className={`w-full max-w-4xl rounded-[2rem] border p-6 shadow-2xl shadow-wood/20 md:p-10 ${isNight ? 'border-white/10 bg-night text-cream' : 'border-white/80 bg-cream'}`}>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-brass">Hotel Ostseeblick — {report.shiftLabel} Patch Notes</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-5xl font-black">Note {report.grade}</h2>
            <p className={isNight ? 'font-semibold text-cream/70' : 'font-semibold text-ink/70'}>{report.answeredCount}/{report.scenarioCount} {shift.mode === 'promise' ? 'Begegnungen' : 'Gäste'} bearbeitet · Final score {report.finalScore}</p>
          </div>
          <div className="rounded-2xl bg-wood p-4 text-cream">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brass">Achievement</p>
            <p className="font-display text-2xl font-black">{report.achievement.name}</p>
            <p className="text-sm text-cream/75">{report.achievement.flavor}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <ReportStat label="Gästezufriedenheit" value={report.satisfaction} />
          <ReportStat label="Fassung" value={report.composure} />
          <ReportStat label="Effizienz" value={report.efficiency} />
        </div>

        <pre className="mt-6 whitespace-pre-wrap rounded-[1.5rem] bg-wood p-5 font-mono text-sm leading-relaxed text-cream shadow-inner shadow-black/20">{`NEU IN DIESER SCHICHT\n+ Erfahrung gesammelt. Viel Erfahrung.\n\nBEHOBEN\n${report.patchLines.map((line) => `✓ ${line}`).join('\n')}\n\nBEKANNTE FEHLER\n${knownIssues}\n\nSTATS\nGästezufriedenheit ${report.satisfaction} · Fassung ${report.composure} · Effizienz ${report.efficiency}`}</pre>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onRestart} className="min-h-14 rounded-2xl bg-brass px-6 font-display text-xl font-black text-ink active:scale-95">
            Neue Schicht
          </button>
        </div>
      </div>
    </section>
  )
}

function CaseStudyScreen({ onStart }: { onStart: (mode: ShiftMode) => void }) {
  return (
    <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="rounded-[2rem] bg-wood p-6 text-cream shadow-2xl shadow-wood/25 md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-brass">Portfolio Case Study</p>
        <h2 className="mt-3 font-display text-5xl font-black leading-[0.95] md:text-6xl">A small game from a real desk problem.</h2>
        <p className="mt-5 text-lg font-semibold text-cream/80">
          Hotel Lobby Chaos Simulator turns Abel's Front Office Ausbildung context into a playable, fictional German reception shift.
        </p>
        <div className="mt-7 grid gap-3 text-sm font-bold text-cream/82">
          <p className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">Role: product idea, scenario design, frontend, testing, deployment.</p>
          <p className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">Stack: React, TypeScript, Vite, Tailwind CSS, Vitest, GitHub Pages.</p>
          <p className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">Boundary: fictional hotel, no real guest data, no employer-specific procedures.</p>
        </div>
        <div className="mt-7 flex flex-col gap-3">
          <button type="button" onClick={() => onStart('frueh')} className="min-h-14 rounded-2xl bg-brass px-6 font-display text-xl font-black text-ink active:scale-95">
            Play the MVP
          </button>
          <a href="https://github.com/aichrisz/hotel-lobby-chaos-simulator" className="grid min-h-14 place-items-center rounded-2xl border border-white/15 bg-white/10 px-6 font-bold text-cream active:scale-95">
            View GitHub Repo
          </a>
        </div>
      </aside>

      <article className="space-y-5 rounded-[2rem] border border-white/80 bg-cream/95 p-5 shadow-2xl shadow-slate-900/15 md:p-8">
        <section>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brass">Problem</p>
          <h3 className="mt-2 font-display text-3xl font-black text-ink md:text-4xl">Language practice apps rarely feel like the actual front desk.</h3>
          <p className="mt-3 font-semibold leading-relaxed text-ink/75">
            Flashcards can teach vocabulary, but reception work is about timing, tone, pressure, and choosing the least-bad answer while a queue forms behind the guest.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <CaseCard title="Concept" body="A 3-minute fictional Frühschicht where every guest card creates a tradeoff." />
          <CaseCard title="Interaction" body="Pick a German response, then see Indonesian feedback explaining why it worked." />
          <CaseCard title="Outcome" body="A Shift Report grades satisfaction, composure, efficiency, and the chaos survived." />
        </section>

        <section>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brass">What makes it portfolio-worthy</p>
          <ul className="mt-3 grid gap-3 font-semibold text-ink/78">
            <li className="rounded-2xl bg-white/70 p-4">It is personal: Indonesian in Germany, Front Office Ausbildung, and German practice in one artifact.</li>
            <li className="rounded-2xl bg-white/70 p-4">It is scoped: 12 Frühkarten + exactly 4 Nachtkarten, two compact shifts, no backend, no login, no runtime AI.</li>
            <li className="rounded-2xl bg-white/70 p-4">It is inspectable: pure shift engine, tests, screenshot script, GitHub Pages deployment.</li>
          </ul>
        </section>

        <section className="rounded-[1.5rem] bg-wood p-5 text-cream">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brass">Build evidence</p>
          <pre className="mt-3 whitespace-pre-wrap font-mono text-sm leading-relaxed text-cream/85">{`12 Frühkarten + 4 Nachtkarten\nSame 180-second clock and scoring model\nPure pack-aware shift engine\nNo real hotel data or employer procedures`}</pre>
        </section>
      </article>
    </section>
  )
}

function CaseCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-wood/10">
      <h4 className="font-display text-2xl font-black text-ink">{title}</h4>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/70">{body}</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 text-cream ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="font-display text-2xl font-black text-brass">{value}</p>
    </div>
  )
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 text-ink ring-1 ring-wood/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-wood/60">{label}</p>
      <p className="font-display text-3xl font-black">{value}</p>
    </div>
  )
}

export default App
