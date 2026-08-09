import { describe, expect, it } from 'vitest'
import { lobbyScenarios } from '../content/lobbyScenarios'
import { nachtScenarios } from '../content/nachtScenarios'
import { buildReport, chooseOption, efficiencyFor, formatClock, gradeFor, initialShiftState } from './shiftEngine'

describe('shiftEngine', () => {
  it('starts at the Hotel Lobby Chaos Simulator baseline', () => {
    const state = initialShiftState()

    expect(state.remainingSeconds).toBe(180)
    expect(state.satisfaction).toBe(70)
    expect(state.composure).toBe(100)
    expect(state.scenarioIndex).toBe(0)
  })

  it('applies option effects and advances the queue', () => {
    const first = lobbyScenarios[0]
    const state = chooseOption(initialShiftState(), first.bestOptionId)

    expect(state.scenarioIndex).toBe(1)
    expect(state.answered).toHaveLength(1)
    expect(state.answered[0].wasBest).toBe(true)
    expect(state.satisfaction).toBe(75)
    expect(state.composure).toBe(100)
    expect(state.remainingSeconds).toBe(170)
  })

  it('keeps scores clamped and builds a German-school-grade report', () => {
    let state = initialShiftState()
    for (const scenario of lobbyScenarios) {
      const fastest = scenario.options.reduce((best, option) =>
        option.effects.timeCostSec < best.effects.timeCostSec ? option : best,
      )
      state = chooseOption(state, fastest.id)
    }

    const report = buildReport(state)

    expect(state.done).toBe(true)
    expect(report.answeredCount).toBeGreaterThan(0)
    expect(report.satisfaction).toBeGreaterThanOrEqual(0)
    expect(report.satisfaction).toBeLessThanOrEqual(100)
    expect(report.composure).toBeGreaterThanOrEqual(0)
    expect(report.composure).toBeLessThanOrEqual(100)
    expect(report.efficiency).toBeGreaterThan(0)
    expect(report.grade).toBeGreaterThanOrEqual(1)
    expect(report.grade).toBeLessThanOrEqual(6)
    expect(report.achievement.name).toMatch(/Note Eins|Kartenturm|Teddy|Ruhe|Papier|Möwen|Schicht/)
  })

  it('maps final scores to German grades', () => {
    expect(gradeFor(95)).toBe(1)
    expect(gradeFor(80)).toBe(2)
    expect(gradeFor(65)).toBe(3)
    expect(gradeFor(50)).toBe(4)
    expect(gradeFor(35)).toBe(5)
    expect(gradeFor(34)).toBe(6)
  })

  it('calculates efficiency from handled cards and time cost', () => {
    const state = chooseOption(initialShiftState(), 'a')
    expect(efficiencyFor(state.answered)).toBeGreaterThan(0)
    expect(efficiencyFor([])).toBe(0)
  })

  it('formats the shift clock', () => {
    expect(formatClock(180)).toBe('3:00')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(-5)).toBe('0:00')
  })

  it('derives completion and report metadata from the selected Nacht pack', () => {
    let state = initialShiftState('nacht', nachtScenarios)

    for (const scenario of nachtScenarios) {
      state = chooseOption(state, scenario.bestOptionId)
    }

    const report = buildReport(state)

    expect(state.mode).toBe('nacht')
    expect(state.scenarios).toBe(nachtScenarios)
    expect(state.done).toBe(true)
    expect(state.scenarioIndex).toBe(nachtScenarios.length)
    expect(report.mode).toBe('nacht')
    expect(report.shiftLabel).toBe('Nachtschicht')
    expect(report.scenarioCount).toBe(nachtScenarios.length)
    expect(report.answeredCount).toBe(nachtScenarios.length)
  })

  it('keeps the baseline clock and score effects for Nacht cards', () => {
    const scenario = nachtScenarios[0]
    const option = scenario.options[2]
    const state = chooseOption(initialShiftState('nacht', nachtScenarios), option.id)

    expect(state.remainingSeconds).toBe(180 - option.effects.timeCostSec)
    expect(state.satisfaction).toBe(70 + option.effects.satisfaction * 5)
    expect(state.composure).toBe(100 + option.effects.composure * 5)
  })

  it('does not start an empty scenario pack', () => {
    expect(() => initialShiftState('nacht', [])).toThrow(/empty/i)
  })
})
