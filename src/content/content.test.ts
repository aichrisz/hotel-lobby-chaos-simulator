import { allScenarios } from './scenarios'
import { fixtureScenario, streakScenario } from '../test/fixtures'
import type { Scenario } from '../types/content'

const validated: Scenario[] = [...allScenarios, fixtureScenario, streakScenario]

describe('scenario content schema', () => {
  it('has unique scenario ids', () => {
    const ids = validated.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  describe.each(validated.map((s) => [s.id, s] as const))('%s', (_id, scenario) => {
    it('has unique step ids within the scenario', () => {
      const ids = scenario.steps.map((step) => step.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('has at least one step, positive xpReward, valid difficulty', () => {
      expect(scenario.steps.length).toBeGreaterThanOrEqual(1)
      expect(scenario.xpReward).toBeGreaterThan(0)
      expect(['A2', 'A2+', 'B1']).toContain(scenario.difficulty)
    })

    it('has non-empty guestLine and guestLineTranslation on every step', () => {
      for (const step of scenario.steps) {
        expect(step.guestLine.trim(), `${scenario.id}/${step.id} guestLine`).not.toBe('')
        expect(
          step.guestLineTranslation.trim(),
          `${scenario.id}/${step.id} guestLineTranslation`,
        ).not.toBe('')
      }
    })

    it('choice steps have 3–4 choices, exactly one correct, all feedback non-empty', () => {
      for (const step of scenario.steps) {
        if (step.kind !== 'choice') continue
        expect(step.choices.length, `${scenario.id}/${step.id}`).toBeGreaterThanOrEqual(3)
        expect(step.choices.length, `${scenario.id}/${step.id}`).toBeLessThanOrEqual(4)
        expect(
          step.choices.filter((c) => c.correct).length,
          `${scenario.id}/${step.id} correct count`,
        ).toBe(1)
        for (const choice of step.choices) {
          expect(choice.feedback.trim(), `${scenario.id}/${step.id} feedback`).not.toBe('')
        }
      }
    })

    it('typing steps have ≥1 non-empty acceptedAnswers and non-empty keywords if present', () => {
      for (const step of scenario.steps) {
        if (step.kind !== 'typing') continue
        expect(step.acceptedAnswers.length, `${scenario.id}/${step.id}`).toBeGreaterThanOrEqual(1)
        for (const answer of step.acceptedAnswers) {
          expect(answer.trim(), `${scenario.id}/${step.id} answer`).not.toBe('')
        }
        if (step.keywords) {
          expect(step.keywords.length, `${scenario.id}/${step.id} keywords`).toBeGreaterThanOrEqual(1)
          for (const keyword of step.keywords) {
            expect(keyword.trim(), `${scenario.id}/${step.id} keyword`).not.toBe('')
          }
        }
      }
    })
  })
})
