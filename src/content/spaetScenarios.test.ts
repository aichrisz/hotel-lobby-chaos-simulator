import { describe, expect, it } from 'vitest'
import { feedbackFor } from './feedback'
import { allSpaetScenarios, spaetPending, spaetVariants } from './spaetScenarios'

describe('authored Spätschicht episode', () => {
  it('keeps both queue variants coherent and reverses which guest has a one-service deadline', () => {
    expect(spaetVariants).toHaveLength(2)
    expect(spaetVariants.map(({ urgentGuest }) => urgentGuest)).toEqual(['taxi', 'family'])
    for (const variant of spaetVariants) {
      expect(variant.queueCards.map(({ guestId }) => guestId)).toEqual(['taxi', 'family'])
      for (const card of variant.queueCards) {
        expect(card.guestLineDe.length).toBeGreaterThan(20)
        expect(card.deadlineId.length).toBeGreaterThan(30)
      }
      const delayedUrgent = spaetPending(variant.id, variant.urgentGuest)
      expect(delayedUrgent.guestLineDe).toMatch(/weg/i)
    }
    expect(spaetVariants[0].taxiOpening.situationId).toMatch(/tagihan sudah diperiksa/i)
    expect(spaetVariants[1].taxiOpening.situationId).toMatch(/besok/i)
    expect(spaetVariants[0].familyOpening.situationId).toMatch(/dapat menunggu/i)
    expect(spaetVariants[1].familyOpening.situationId).toMatch(/shuttle/i)
  })

  it('provides outcome evidence and authored feedback for every reachable response', () => {
    const scenarios = allSpaetScenarios()
    expect(new Set(scenarios.map(({ id }) => id)).size).toBe(scenarios.length)
    for (const scenario of scenarios) {
      expect(scenario.evidenceByOption).toBeDefined()
      for (const option of scenario.options) {
        expect(scenario.evidenceByOption?.[option.id]?.factId.length).toBeGreaterThan(25)
        expect(feedbackFor(scenario.id, option.id).length).toBeGreaterThan(35)
      }
    }
  })
})
