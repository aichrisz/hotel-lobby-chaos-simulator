import { describe, expect, it } from 'vitest'
import { lobbyScenarios } from './lobbyScenarios'
import { nachtScenarios } from './nachtScenarios'
import { promiseFollowupByOption, promiseScenarios } from './promiseScenarios'
import { feedbackFor, optionFeedback } from './feedback'

describe('curated response feedback', () => {
  it('covers every active encounter option with non-positional Indonesian guidance', () => {
    const scenarios = [
      ...lobbyScenarios,
      ...nachtScenarios,
      ...promiseScenarios,
      promiseFollowupByOption.b,
    ]
    const uniqueScenarios = [...new Map(scenarios.map((scenario) => [scenario.id, scenario])).values()]

    expect(Object.keys(optionFeedback).sort()).toEqual(uniqueScenarios.map(({ id }) => id).sort())
    for (const scenario of uniqueScenarios) {
      for (const option of scenario.options) {
        const explanation = feedbackFor(scenario.id, option.id)
        expect(explanation.length).toBeGreaterThan(30)
        expect(explanation).not.toMatch(/\b(?:opsi|pilihan)\s+[abc]\b/i)
      }
    }
  })
})
