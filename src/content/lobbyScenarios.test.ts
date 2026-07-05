import { describe, expect, it } from 'vitest'
import { lobbyScenarios } from './lobbyScenarios'

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
})
