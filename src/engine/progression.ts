import type { Difficulty, Scenario } from '../types/content'
import { LEVEL_THRESHOLDS, UNLOCKS } from './scoring'

// LEVEL_THRESHOLDS[i] is the XP needed for level i+1; capped at the last level.
export function levelForXp(xp: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  return level
}

export function unlockedDifficulties(level: number): Difficulty[] {
  return (Object.keys(UNLOCKS) as Difficulty[]).filter(
    (difficulty) => level >= UNLOCKS[difficulty],
  )
}

export function isScenarioUnlocked(scenario: Scenario, xp: number): boolean {
  return levelForXp(xp) >= UNLOCKS[scenario.difficulty]
}
