import { useMemo, useState } from 'react'
import { allScenarios } from './content/scenarios'
import { vocabulary } from './content/vocabulary'
import { currentStep, chooseChoice, startQuest, submitTyping, useHint as applyQuestHint, type QuestState } from './engine/questEngine'
import { levelForXp, unlockedDifficulties, isScenarioUnlocked } from './engine/progression'
import { applyQuestResult, loadProgress, saveProgress, type GameProgress } from './store/persistence'
import type { ChoiceStep, Scenario, TypingStep } from './types/content'

type Screen = 'title' | 'board' | 'play' | 'results'

function difficultyClass(difficulty: Scenario['difficulty']) {
  if (difficulty === 'B1') return 'bg-heart/15 text-heart ring-heart/25'
  if (difficulty === 'A2+') return 'bg-gold/20 text-ink ring-gold/40'
  return 'bg-success/15 text-success ring-success/25'
}

function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress())
  const [quest, setQuest] = useState<QuestState | null>(null)
  const [typingAnswer, setTypingAnswer] = useState('')
  const level = levelForXp(progress.xp)
  const unlocked = unlockedDifficulties(level)
  const current = quest ? currentStep(quest) : undefined
  const latestLog = quest?.log.at(-1)

  const boardStats = useMemo(
    () => ({
      completed: progress.completedQuestIds.length,
      total: allScenarios.length,
      unlockedLabel: unlocked.join(' / '),
    }),
    [progress.completedQuestIds.length, unlocked],
  )

  function startScenario(scenario: Scenario) {
    if (!isScenarioUnlocked(scenario, progress.xp)) return
    setQuest(startQuest(scenario))
    setTypingAnswer('')
    setScreen('play')
  }

  function persistResult(nextQuest: QuestState) {
    if (!nextQuest.completed || !nextQuest.result) return
    const nextProgress = applyQuestResult(
      progress,
      nextQuest.scenario.id,
      nextQuest.result.xpGain,
      nextQuest.result.rank,
    )
    setProgress(nextProgress)
    saveProgress(nextProgress)
    setScreen('results')
  }

  function updateQuest(nextQuest: QuestState) {
    setQuest(nextQuest)
    persistResult(nextQuest)
  }

  function handleTypingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quest || !typingAnswer.trim()) return
    const next = submitTyping(quest, typingAnswer)
    setTypingAnswer('')
    updateQuest(next)
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,#fff9ec_0,#f6edd9_38%,#e8d8b8_100%)] text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 rounded-[2rem] border border-white/70 bg-panel/80 p-3 shadow-xl shadow-night/10 backdrop-blur md:p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-night text-2xl shadow-inner shadow-white/10">🏨</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-gold">Hotel Guild Academy</p>
              <h1 className="font-display text-2xl font-black leading-none text-ink md:text-3xl">Hotel Quest</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScreen('board')}
            className="min-h-11 rounded-2xl bg-night px-4 font-bold text-panel shadow-lg shadow-night/20 active:scale-95"
          >
            Quest Board
          </button>
        </header>

        {screen === 'title' && (
          <section className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[2rem] border border-white/80 bg-panel/90 p-6 shadow-2xl shadow-night/15 md:p-10">
              <p className="mb-3 inline-flex rounded-full bg-gold/20 px-4 py-2 text-sm font-black text-night ring-1 ring-gold/30">
                German Front Office RPG Simulator
              </p>
              <h2 className="font-display text-5xl font-black leading-[0.95] text-ink md:text-7xl">
                Train like a reception hero.
              </h2>
              <p className="mt-5 max-w-2xl text-lg font-semibold text-ink/75 md:text-xl">
                Pilih quest hotel generic, jawab dialog bahasa Jerman formal <span className="font-black">Sie</span>, dapat XP, rank, dan unlock skenario lebih sulit.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setScreen('board')}
                  className="min-h-14 rounded-2xl bg-gold px-6 font-display text-xl font-black text-ink shadow-xl shadow-gold/25 transition active:scale-95"
                >
                  Start Training ⚔️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reset = { xp: 0, completedQuestIds: [], bestRanks: {} }
                    setProgress(reset)
                    saveProgress(reset)
                  }}
                  className="min-h-14 rounded-2xl border border-night/20 bg-white/60 px-6 font-bold text-night transition active:scale-95"
                >
                  Reset Save
                </button>
              </div>
            </div>
            <aside className="rounded-[2rem] bg-night p-5 text-panel shadow-2xl shadow-night/25 md:p-7">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold">Hero Status</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <Stat label="Level" value={level} />
                  <Stat label="XP" value={progress.xp} />
                  <Stat label="Done" value={`${boardStats.completed}/${boardStats.total}`} />
                </div>
                <p className="mt-5 rounded-2xl bg-black/20 p-4 text-sm font-semibold text-panel/80">
                  Unlocked difficulty: <span className="text-gold">{boardStats.unlockedLabel}</span>
                </p>
              </div>
            </aside>
          </section>
        )}

        {screen === 'board' && (
          <section className="grid gap-5 py-6 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-bold uppercase tracking-[0.22em] text-night/60">Choose your daily dungeon</p>
                  <h2 className="font-display text-4xl font-black text-ink">Quest Board</h2>
                </div>
                <p className="rounded-2xl bg-white/70 px-4 py-3 font-bold text-night shadow">Level {level} · {progress.xp} XP</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {allScenarios.map((scenario) => {
                  const unlockedQuest = isScenarioUnlocked(scenario, progress.xp)
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => startScenario(scenario)}
                      disabled={!unlockedQuest}
                      className="min-h-48 rounded-[1.75rem] border border-white/80 bg-panel p-5 text-left shadow-xl shadow-night/10 transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-4xl">{scenario.guest.emoji}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${difficultyClass(scenario.difficulty)}`}>{scenario.difficulty}</span>
                      </div>
                      <h3 className="mt-4 font-display text-2xl font-black leading-tight">{scenario.title}</h3>
                      <p className="font-bold text-night">{scenario.titleDe}</p>
                      <p className="mt-2 text-sm font-semibold text-ink/70">{scenario.setting}</p>
                      <p className="mt-4 text-sm font-black text-gold">{unlockedQuest ? `${scenario.xpReward} base XP · Start` : 'Locked · level up first'}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <aside className="rounded-[2rem] bg-night p-5 text-panel shadow-2xl shadow-night/20">
              <h3 className="font-display text-3xl font-black">Phrase Codex</h3>
              <div className="mt-4 space-y-3">
                {vocabulary.map((entry) => (
                  <div key={entry.de} className="rounded-2xl border border-white/10 bg-white/10 p-3">
                    <p className="font-black text-gold">{entry.de}</p>
                    <p className="text-sm text-panel/75">{entry.en} · {entry.id}</p>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        )}

        {screen === 'play' && quest && current && (
          <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[300px_1fr]">
            <aside className="rounded-[2rem] bg-night p-5 text-panel shadow-2xl shadow-night/20">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-gold">Current Quest</p>
              <h2 className="mt-2 font-display text-3xl font-black">{quest.scenario.title}</h2>
              <div className="mt-5 space-y-3 text-sm font-bold">
                <Meter label="Score" value={`${quest.score}/${quest.result?.maxScore ?? '???'}`} />
                <Meter label="Satisfaction" value={`${quest.satisfaction}%`} />
                <Meter label="Streak" value={`${quest.streak} 🔥`} />
                <Meter label="Step" value={`${quest.stepIndex + 1}/${quest.scenario.steps.length}`} />
              </div>
              <button type="button" onClick={() => setScreen('board')} className="mt-5 min-h-11 w-full rounded-2xl bg-white/10 font-bold text-panel ring-1 ring-white/15 active:scale-95">
                Back to Board
              </button>
            </aside>

            <div className="rounded-[2rem] border border-white/80 bg-panel/95 p-5 shadow-2xl shadow-night/15 md:p-8">
              <div className="flex items-center gap-4">
                <div className="grid size-16 place-items-center rounded-3xl bg-gold/20 text-4xl">{quest.scenario.guest.emoji}</div>
                <div>
                  <p className="font-bold text-night/70">{quest.scenario.guest.name}</p>
                  <h3 className="font-display text-3xl font-black">{current.guestLine}</h3>
                  <p className="mt-1 font-semibold text-ink/60">{current.guestLineTranslation}</p>
                </div>
              </div>

              {current.hint && (
                <button type="button" onClick={() => setQuest(applyQuestHint(quest))} className="mt-5 min-h-11 rounded-2xl bg-gold/20 px-4 font-bold text-night ring-1 ring-gold/40 active:scale-95">
                  💡 Hint
                </button>
              )}

              <div className="mt-6">
                {current.kind === 'choice' ? (
                  <div className="grid gap-3">
                    {(current as ChoiceStep).choices.map((choice, index) => (
                      <button key={choice.text} type="button" onClick={() => updateQuest(chooseChoice(quest, index))} className="min-h-14 rounded-2xl border border-night/10 bg-white/70 p-4 text-left font-bold text-ink shadow transition hover:bg-white active:scale-[0.99]">
                        {choice.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleTypingSubmit} className="space-y-4">
                    <label className="block font-black text-night" htmlFor="typing-answer">{(current as TypingStep).prompt}</label>
                    <textarea id="typing-answer" value={typingAnswer} onChange={(event) => setTypingAnswer(event.target.value)} rows={4} className="w-full rounded-2xl border border-night/15 bg-white p-4 text-lg font-semibold outline-none ring-gold/40 focus:ring-4" placeholder="Tulis jawaban Jerman formal di sini…" />
                    <div className="flex flex-wrap gap-2">
                      {['ä', 'ö', 'ü', 'ß'].map((letter) => (
                        <button key={letter} type="button" onClick={() => setTypingAnswer((value) => `${value}${letter}`)} className="min-h-11 rounded-xl bg-night px-4 font-black text-panel active:scale-95">{letter}</button>
                      ))}
                    </div>
                    <button type="submit" className="min-h-14 w-full rounded-2xl bg-gold font-display text-xl font-black text-ink shadow-xl shadow-gold/20 active:scale-95">Submit Line</button>
                  </form>
                )}
              </div>

              {latestLog && (
                <div className={`mt-6 rounded-2xl p-4 font-bold ${latestLog.correct ? 'bg-success/15 text-success' : 'bg-heart/10 text-heart'}`}>
                  <p>{latestLog.correct ? '✅ Nice response!' : '⚠️ Try again / review this line'}</p>
                  <p className="mt-1 text-sm text-ink/70">{latestLog.feedback} · {latestLog.points} pts</p>
                </div>
              )}
            </div>
          </section>
        )}

        {screen === 'results' && quest?.result && (
          <section className="grid flex-1 place-items-center py-8">
            <div className="w-full max-w-3xl rounded-[2rem] border border-white/80 bg-panel p-6 text-center shadow-2xl shadow-night/20 md:p-10">
              <p className="text-6xl">🏆</p>
              <h2 className="font-display text-5xl font-black">Quest Clear!</h2>
              <p className="mt-2 font-bold text-night">{quest.scenario.titleDe}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Rank" value={quest.result.rank} dark />
                <Stat label="Score" value={`${quest.result.score}/${quest.result.maxScore}`} dark />
                <Stat label="XP" value={`+${quest.result.xpGain}`} dark />
                <Stat label="Hearts" value={'♥'.repeat(quest.result.hearts)} dark />
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={() => startScenario(quest.scenario)} className="min-h-14 rounded-2xl bg-gold px-6 font-display text-xl font-black text-ink active:scale-95">Replay Quest</button>
                <button type="button" onClick={() => setScreen('board')} className="min-h-14 rounded-2xl bg-night px-6 font-bold text-panel active:scale-95">Next Quest</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value, dark = false }: { label: string; value: string | number; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${dark ? 'bg-night text-panel' : 'bg-white/10 text-panel'}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="font-display text-2xl font-black">{value}</p>
    </div>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
      <span className="text-panel/70">{label}</span>
      <span className="text-gold">{value}</span>
    </div>
  )
}

export default App
