import { describe, expect, it } from 'vitest'
import { lobbyScenarios } from './lobbyScenarios'
import { nachtScenarios } from './nachtScenarios'
import { promiseScenarios } from './promiseScenarios'

describe('lobbyScenarios', () => {
  it('contains a complete 12-card shift pack', () => {
    expect(lobbyScenarios).toHaveLength(12)
    expect(new Set(lobbyScenarios.map((scenario) => scenario.id)).size).toBe(12)
  })

  it('keeps every scenario playable and fictionalized', () => {
    for (const scenario of lobbyScenarios) {
      expect(scenario.guestLineDe).toMatch(/[„"]/)
      expect(scenario.situationId.length).toBeGreaterThan(20)
      expect(scenario.rationaleId.length).toBeGreaterThan(40)
      expect(scenario.shiftReportLine.length).toBeGreaterThan(10)
      expect(scenario.options).toHaveLength(3)
      expect(scenario.options.map((option) => option.id)).toEqual(['a', 'b', 'c'])
      expect(scenario.options.some((option) => option.id === scenario.bestOptionId)).toBe(true)
      expect(JSON.stringify(scenario).toLowerCase()).not.toContain('trihotel')
    }
  })

  it('frames expanded explanations as scenario-wide responses, not actions the player may not have chosen', () => {
    const rationaleFor = (id: string) => lobbyScenarios.find((scenario) => scenario.id === id)?.rationaleId
    expect(rationaleFor('early-checkin-familie')).toMatch(/^Respons yang paling sesuai dalam skenario ini adalah /)
    expect(rationaleFor('teddy-verloren')).toMatch(/^Respons yang paling sesuai dalam skenario ini adalah /)
    expect(promiseScenarios.find((scenario) => scenario.id === 'promise-guest-start')?.rationaleId)
      .toMatch(/^Respons yang paling sesuai dalam skenario ini adalah /)
  })
})

describe('nachtScenarios', () => {
  it('contains the compact four-card Nachtschicht pack', () => {
    expect(nachtScenarios).toHaveLength(4)
    expect(new Set(nachtScenarios.map((scenario) => scenario.id)).size).toBe(4)
  })

  it('keeps every Nacht card playable, Indonesian, and fictional', () => {
    for (const scenario of nachtScenarios) {
      expect(scenario.guestLineDe).toMatch(/[„"]/)
      expect(scenario.situationId.length).toBeGreaterThan(20)
      expect(scenario.rationaleId.length).toBeGreaterThan(40)
      expect(scenario.rationaleId).not.toMatch(/\b(?:opsi|pilihan)\s+[abc]\b/i)
      expect(scenario.options).toHaveLength(3)
      expect(scenario.options.map((option) => option.id)).toEqual(['a', 'b', 'c'])
      expect(scenario.options.some((option) => option.id === scenario.bestOptionId)).toBe(true)
      expect(JSON.stringify(scenario).toLowerCase()).not.toMatch(/trihotel|employer|internal|procedure|sop/)
    }
  })
})
