import type { Difficulty } from '../types/content'
import type { TypingVerdict } from './answerMatch'

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D'
export type SatisfactionEvent = 'wrongChoice' | 'wrongTyping' | 'hint'

// Scoring constants pinned by tests (plan §4.3) — single source of truth.
export const CHOICE_POINTS = { firstTry: 100, secondTry: 50, laterTry: 25 } as const
export const TYPING_POINTS = { perfect: 150, close: 100, partial: 50, wrong: 0 } as const
export const TYPING_MAX_ATTEMPTS = 2
export const HINT_PENALTY = 25
export const STREAK_THRESHOLD = 3
export const STREAK_MULTIPLIER = 1.5
export const SATISFACTION = {
  start: 100,
  wrongChoice: -15,
  wrongTyping: -10,
  hint: -5,
  floor: 0,
} as const
export const XP_MULT: Record<Rank, number> = { S: 1.5, A: 1.25, B: 1, C: 0.75, D: 0.5 }
export const LEVEL_THRESHOLDS = [0, 150, 350, 600, 900, 1250, 1650, 2100] as const
export const UNLOCKS: Record<Difficulty, number> = { A2: 1, 'A2+': 2, B1: 4 }

export function scoreChoice(attempt: number): number {
  if (attempt <= 1) return CHOICE_POINTS.firstTry
  if (attempt === 2) return CHOICE_POINTS.secondTry
  return CHOICE_POINTS.laterTry
}

export function scoreTyping(verdict: TypingVerdict): number {
  return TYPING_POINTS[verdict]
}

export function applyHint(points: number): number {
  return Math.max(0, points - HINT_PENALTY)
}

export function withStreak(points: number, streak: number): number {
  return streak >= STREAK_THRESHOLD ? Math.round(points * STREAK_MULTIPLIER) : points
}

export function satisfactionAfter(current: number, event: SatisfactionEvent): number {
  return Math.max(SATISFACTION.floor, current + SATISFACTION[event])
}

// 5 hearts over 20-point bands; any satisfaction > 0 keeps at least one heart.
export function heartsFor(satisfaction: number): number {
  const clamped = Math.min(100, Math.max(0, satisfaction))
  return Math.ceil(clamped / 20)
}

export function rankFor(score: number, maxScore: number): Rank {
  const pct = maxScore > 0 ? Math.min(1, score / maxScore) : 0
  if (pct >= 0.95) return 'S'
  if (pct >= 0.85) return 'A'
  if (pct >= 0.7) return 'B'
  if (pct >= 0.5) return 'C'
  return 'D'
}

export function xpFor(xpReward: number, rank: Rank): number {
  return Math.round(xpReward * XP_MULT[rank])
}
