import { describe, expect, it } from 'vitest'
import { scenarioVariants } from './scenarioVariants'
import { feedbackFor } from './feedback'

describe('authored situation variants', () => {
  it('provides substantive, fully taught alternates in morning and night families', () => {
    expect(scenarioVariants.map(({ familyId }) => familyId).sort()).toEqual(['firmenrechnung-split', 'nacht-fruehes-taxi'])
    for (const { familyId, variantId, scenario } of scenarioVariants) {
      expect(variantId.length).toBeGreaterThan(4)
      expect(scenario.id).not.toBe(familyId)
      expect(scenario.guestLineDe.length).toBeGreaterThan(50)
      expect(scenario.situationId.length).toBeGreaterThan(60)
      expect(scenario.rationaleId.length).toBeGreaterThan(80)
      expect(scenario.options.every(({ textDe }) => textDe.length > 20)).toBe(true)
      expect(new Set(scenario.options.map(({ textDe }) => textDe)).size).toBe(3)
      for (const option of scenario.options) expect(feedbackFor(scenario.id, option.id).length).toBeGreaterThan(40)
    }
    const invoice = scenarioVariants[0].scenario
    const taxi = scenarioVariants[1].scenario
    expect(invoice.situationId).toMatch(/alamat perusahaan belum ada/i)
    expect(invoice.options[0].textDe).toMatch(/fehlen/i)
    expect(taxi.situationId).toMatch(/titik jemput belum tercatat/i)
    expect(taxi.options[0].textDe).toMatch(/Abholort/i)
  })
})
