import { describe, expect, it } from 'vitest'
import { spaetVariants, spaetQueueCards } from '../content/spaetScenarios'
import { buildReport, chooseOption, choosePriority, currentScenario, initialShiftState, outcomeFor, tickClock } from './shiftEngine'

function finishSpaet(seed: number, first: 'taxi' | 'family', openingOption = 'a', pendingOption = 'a', finalOption = 'a') {
  let state = initialShiftState('spaet', undefined, 'relaxed', seed)
  const variant = state.manifest.episodeVariant!
  const urgencyGuest = variant === 'taxi-urgent' ? 'taxi' : 'family'
  expect(state.phase).toBe('priority')
  expect(spaetQueueCards(variant)).toHaveLength(2)
  state = choosePriority(state, first)
  expect(currentScenario(state)?.id).toContain(`spaet-${variant}-${first}`)
  state = chooseOption(state, openingOption as 'a' | 'b' | 'c')
  state = chooseOption(state, pendingOption as 'a' | 'b' | 'c')
  state = chooseOption(state, finalOption as 'a' | 'b' | 'c')
  expect(state.answered).toHaveLength(3)
  expect(buildReport(state).scenarioCount).toBe(3)
  return { state, urgencyGuest }
}

describe('Spätschicht priority and authored outcomes', () => {
  it('offers two substantively distinct urgency variants with complete reachable branches', () => {
    expect(spaetVariants).toHaveLength(2)
    expect(spaetVariants[0].taxiOpening.guestLineDe).not.toEqual(spaetVariants[1].taxiOpening.guestLineDe)
    for (const variant of spaetVariants) {
      expect(variant.queueCards).toHaveLength(2)
      expect(variant.reservation.options).toHaveLength(3)
    }
  })

  it('serves the urgent guest first for a smooth factual ending and restores after a missed deadline', () => {
    let taxiSeed = 0
    while (initialShiftState('spaet', undefined, 'relaxed', taxiSeed).manifest.episodeVariant !== 'taxi-urgent') taxiSeed += 1
    const taxiFirst = finishSpaet(taxiSeed, 'taxi')
    expect(taxiFirst.urgencyGuest).toBe('taxi')
    expect(outcomeFor(taxiFirst.state)).toBe('lobby-smooth')

    const familyFirst = finishSpaet(taxiSeed, 'family')
    expect(familyFirst.urgencyGuest).toBe('taxi')
    expect(outcomeFor(familyFirst.state)).toBe('recovered')
    expect(familyFirst.state.episodeFacts.join(' ')).toMatch(/taksi.*berangkat/i)
  })

  it('reverses the best priority in the shuttle-urgent variant', () => {
    let seed = 0
    while (initialShiftState('spaet', undefined, 'relaxed', seed).manifest.episodeVariant !== 'shuttle-urgent') seed += 1
    const familyFirst = finishSpaet(seed, 'family')
    const taxiFirst = finishSpaet(seed, 'taxi')
    expect(outcomeFor(familyFirst.state)).toBe('lobby-smooth')
    expect(outcomeFor(taxiFirst.state)).toBe('recovered')
    expect(taxiFirst.state.episodeFacts.join(' ')).toMatch(/shuttle.*berangkat/i)
  })

  it('proves both normal-start priority paths fit the 180-second challenge budget', () => {
    for (const urgentGuest of ['taxi', 'family'] as const) {
      let seed = 0
      while (initialShiftState('spaet', undefined, 'challenge', seed).manifest.episodeVariant !== (urgentGuest === 'taxi' ? 'taxi-urgent' : 'shuttle-urgent')) seed += 1
      let state = initialShiftState('spaet', undefined, 'challenge', seed)
      state = tickClock(state, 20) // simulated reading at the two-guest priority choice
      state = choosePriority(state, urgentGuest)
      for (let encounter = 0; encounter < 3; encounter += 1) {
        state = tickClock(state, 20) // simulated reading before each real answer
        const scenario = currentScenario(state)!
        state = chooseOption(state, scenario.bestOptionId)
      }
      expect(state.finishReason).toBe('completed')
      expect(state.remainingSeconds).toBeGreaterThan(0)
      expect(outcomeFor(state)).toBe('lobby-smooth')
    }
  })

  it('ends open when actual choices leave a need unresolved, and keeps timeout distinct', () => {
    let taxiSeed = 0
    while (initialShiftState('spaet', undefined, 'relaxed', taxiSeed).manifest.episodeVariant !== 'taxi-urgent') taxiSeed += 1
    const open = finishSpaet(taxiSeed, 'taxi', 'c', 'c', 'b')
    expect(outcomeFor(open.state)).toBe('open')
    const timedOut = tickClock(initialShiftState('spaet', undefined, 'challenge', taxiSeed), 180)
    expect(outcomeFor(timedOut)).toBe('timeout')
  })

  it('guards duplicate priority/answers and reports queue timeout without fabricating encounters', () => {
    const initial = initialShiftState('spaet', undefined, 'relaxed', 2)
    const selected = choosePriority(initial, 'taxi')
    expect(selected.phase).toBe('dialogue')
    expect(choosePriority(selected, 'family')).toBe(selected)
    const answer = chooseOption(selected, 'a')
    expect(chooseOption(answer, 'invalid' as 'a').answered).toHaveLength(1)
    expect(answer.answered).toHaveLength(1)
    expect(currentScenario(answer)?.id).not.toBe(answer.answered[0].scenario.id)
    expect(answer.scenarioIndex).toBe(1)
    const timedOut = tickClock(initialShiftState('spaet', undefined, 'challenge', 2), 180)
    expect(buildReport(timedOut).scenarioCount).toBe(3)
    expect(buildReport(timedOut).answeredCount).toBe(0)
    const almostOut = tickClock(initialShiftState('spaet', undefined, 'challenge', 2), 175)
    const committed = chooseOption(choosePriority(almostOut, 'taxi'), 'a')
    expect(committed.finishReason).toBe('timeout')
    expect(committed.answered).toHaveLength(1)
  })
})
