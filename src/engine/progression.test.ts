import { levelForXp, unlockedDifficulties, isScenarioUnlocked } from './progression'
import type { Difficulty, Scenario } from '../types/content'

function scenarioWith(difficulty: Difficulty): Scenario {
  return {
    id: `fixture-${difficulty}`,
    title: 'Fixture Quest',
    titleDe: 'Fixture-Quest',
    difficulty,
    setting: 'A tiny test lobby.',
    guest: { name: 'Frau Test', emoji: '🧪', mood: 'friendly' },
    steps: [],
    xpReward: 100,
  }
}

describe('levelForXp', () => {
  it('starts at level 1', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(149)).toBe(1)
  })

  it('levels up exactly at thresholds', () => {
    expect(levelForXp(150)).toBe(2)
    expect(levelForXp(349)).toBe(2)
    expect(levelForXp(350)).toBe(3)
    expect(levelForXp(600)).toBe(4)
    expect(levelForXp(2100)).toBe(8)
  })

  it('caps at level 8', () => {
    expect(levelForXp(99999)).toBe(8)
  })
})

describe('unlockedDifficulties', () => {
  it('level 1 unlocks only A2', () => {
    expect(unlockedDifficulties(1)).toEqual(['A2'])
  })

  it('level 2 adds A2+', () => {
    expect(unlockedDifficulties(2)).toEqual(['A2', 'A2+'])
    expect(unlockedDifficulties(3)).toEqual(['A2', 'A2+'])
  })

  it('level 4 unlocks all difficulties', () => {
    expect(unlockedDifficulties(4)).toEqual(['A2', 'A2+', 'B1'])
    expect(unlockedDifficulties(8)).toEqual(['A2', 'A2+', 'B1'])
  })
})

describe('isScenarioUnlocked', () => {
  it('A2 scenarios are unlocked from the start', () => {
    expect(isScenarioUnlocked(scenarioWith('A2'), 0)).toBe(true)
  })

  it('A2+ unlocks at the level 2 threshold (150 XP)', () => {
    expect(isScenarioUnlocked(scenarioWith('A2+'), 149)).toBe(false)
    expect(isScenarioUnlocked(scenarioWith('A2+'), 150)).toBe(true)
  })

  it('B1 unlocks at the level 4 threshold (600 XP)', () => {
    expect(isScenarioUnlocked(scenarioWith('B1'), 599)).toBe(false)
    expect(isScenarioUnlocked(scenarioWith('B1'), 600)).toBe(true)
  })
})
