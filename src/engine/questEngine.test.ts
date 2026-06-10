import { fixtureScenario, streakScenario } from '../test/fixtures'
import { chooseChoice, currentStep, maxScoreForScenario, startQuest, submitTyping, useHint } from './questEngine'

describe('questEngine', () => {
  it('starts a quest at step 0 with full satisfaction', () => {
    const state = startQuest(fixtureScenario)
    expect(currentStep(state)?.id).toBe('greet')
    expect(state.score).toBe(0)
    expect(state.satisfaction).toBe(100)
    expect(state.completed).toBe(false)
  })

  it('calculates max score by step kind', () => {
    expect(maxScoreForScenario(fixtureScenario)).toBe(350)
  })

  it('keeps the player on a choice step after a wrong answer and lowers satisfaction', () => {
    const state = chooseChoice(startQuest(fixtureScenario), 1)
    expect(currentStep(state)?.id).toBe('greet')
    expect(state.score).toBe(0)
    expect(state.satisfaction).toBe(85)
    expect(state.log.at(-1)?.correct).toBe(false)
  })

  it('scores a second-try choice and advances', () => {
    const wrong = chooseChoice(startQuest(fixtureScenario), 1)
    const right = chooseChoice(wrong, 0)
    expect(currentStep(right)?.id).toBe('ask-name')
    expect(right.score).toBe(50)
    expect(right.streak).toBe(0)
  })

  it('scores typing answers with fuzzy evaluation and advances', () => {
    const afterChoice = chooseChoice(startQuest(fixtureScenario), 0)
    const afterTyping = submitTyping(afterChoice, 'wie ist ihr name')
    expect(currentStep(afterTyping)?.id).toBe('wish-stay')
    expect(afterTyping.score).toBe(250)
    expect(afterTyping.log.at(-1)?.verdict).toBe('perfect')
  })

  it('allows one retry on wrong typing, then reveals and advances with zero typing points', () => {
    const afterChoice = chooseChoice(startQuest(fixtureScenario), 0)
    const firstWrong = submitTyping(afterChoice, 'xyz')
    expect(currentStep(firstWrong)?.id).toBe('ask-name')
    expect(firstWrong.satisfaction).toBe(90)
    const secondWrong = submitTyping(firstWrong, 'abc')
    expect(currentStep(secondWrong)?.id).toBe('wish-stay')
    expect(secondWrong.score).toBe(100)
    expect(secondWrong.satisfaction).toBe(80)
  })

  it('applies hint penalty only once to a hinted step', () => {
    const afterChoice = chooseChoice(startQuest(fixtureScenario), 0)
    const afterTyping = submitTyping(afterChoice, 'wie ist ihr name')
    const hinted = useHint(afterTyping)
    const hintedAgain = useHint(hinted)
    const finished = chooseChoice(hintedAgain, 0)
    expect(hintedAgain.satisfaction).toBe(95)
    expect(finished.score).toBe(363)
  })

  it('applies streak multiplier from the third first-try success', () => {
    let state = startQuest(streakScenario)
    state = chooseChoice(state, 0)
    state = chooseChoice(state, 0)
    state = chooseChoice(state, 0)
    expect(state.score).toBe(350)
    state = chooseChoice(state, 0)
    expect(state.result?.score).toBe(500)
    expect(state.result?.rank).toBe('S')
  })

  it('completes a quest with rank, xp, hearts, and log', () => {
    let state = startQuest(fixtureScenario)
    state = chooseChoice(state, 0)
    state = submitTyping(state, 'wie ist ihr name')
    state = chooseChoice(state, 0)
    expect(state.completed).toBe(true)
    expect(state.result).toMatchObject({ score: 400, maxScore: 350, rank: 'S', xpGain: 150, hearts: 5 })
    expect(state.result?.log).toHaveLength(3)
  })
})
