import {
  CHOICE_POINTS,
  TYPING_POINTS,
  TYPING_MAX_ATTEMPTS,
  HINT_PENALTY,
  STREAK_THRESHOLD,
  STREAK_MULTIPLIER,
  SATISFACTION,
  XP_MULT,
  LEVEL_THRESHOLDS,
  UNLOCKS,
  scoreChoice,
  scoreTyping,
  applyHint,
  withStreak,
  satisfactionAfter,
  heartsFor,
  rankFor,
  xpFor,
} from './scoring'

describe('scoring constants (plan §4.3)', () => {
  it('pins choice and typing point tables', () => {
    expect(CHOICE_POINTS).toEqual({ firstTry: 100, secondTry: 50, laterTry: 25 })
    expect(TYPING_POINTS).toEqual({ perfect: 150, close: 100, partial: 50, wrong: 0 })
  })

  it('pins attempt, hint, and streak constants', () => {
    expect(TYPING_MAX_ATTEMPTS).toBe(2)
    expect(HINT_PENALTY).toBe(25)
    expect(STREAK_THRESHOLD).toBe(3)
    expect(STREAK_MULTIPLIER).toBe(1.5)
  })

  it('pins satisfaction deltas', () => {
    expect(SATISFACTION).toEqual({
      start: 100,
      wrongChoice: -15,
      wrongTyping: -10,
      hint: -5,
      floor: 0,
    })
  })

  it('pins XP multipliers, level thresholds, and unlocks', () => {
    expect(XP_MULT).toEqual({ S: 1.5, A: 1.25, B: 1, C: 0.75, D: 0.5 })
    expect(LEVEL_THRESHOLDS).toEqual([0, 150, 350, 600, 900, 1250, 1650, 2100])
    expect(UNLOCKS).toEqual({ A2: 1, 'A2+': 2, B1: 4 })
  })
})

describe('scoreChoice', () => {
  it('scores by attempt: first 100, second 50, later 25', () => {
    expect(scoreChoice(1)).toBe(100)
    expect(scoreChoice(2)).toBe(50)
    expect(scoreChoice(3)).toBe(25)
    expect(scoreChoice(7)).toBe(25)
  })
})

describe('scoreTyping', () => {
  it('scores by verdict', () => {
    expect(scoreTyping('perfect')).toBe(150)
    expect(scoreTyping('close')).toBe(100)
    expect(scoreTyping('partial')).toBe(50)
    expect(scoreTyping('wrong')).toBe(0)
  })
})

describe('applyHint', () => {
  it('subtracts the hint penalty', () => {
    expect(applyHint(100)).toBe(75)
  })

  it('floors at 0', () => {
    expect(applyHint(10)).toBe(0)
    expect(applyHint(0)).toBe(0)
  })
})

describe('withStreak', () => {
  it('leaves points unchanged below the streak threshold', () => {
    expect(withStreak(100, 0)).toBe(100)
    expect(withStreak(100, 2)).toBe(100)
  })

  it('multiplies by 1.5 at streak 3 and above', () => {
    expect(withStreak(100, 3)).toBe(150)
    expect(withStreak(100, 5)).toBe(150)
  })

  it('rounds multiplied points', () => {
    expect(withStreak(25, 3)).toBe(38) // 37.5 rounds up
  })
})

describe('satisfactionAfter', () => {
  it('applies event deltas', () => {
    expect(satisfactionAfter(100, 'wrongChoice')).toBe(85)
    expect(satisfactionAfter(100, 'wrongTyping')).toBe(90)
    expect(satisfactionAfter(100, 'hint')).toBe(95)
  })

  it('floors at 0', () => {
    expect(satisfactionAfter(10, 'wrongChoice')).toBe(0)
    expect(satisfactionAfter(5, 'wrongTyping')).toBe(0)
    expect(satisfactionAfter(3, 'hint')).toBe(0)
  })
})

describe('heartsFor', () => {
  it('maps satisfaction to hearts: 100→5, 41→3, 0→0', () => {
    expect(heartsFor(100)).toBe(5)
    expect(heartsFor(41)).toBe(3)
    expect(heartsFor(0)).toBe(0)
  })

  it('uses ceiling over 20-point bands', () => {
    expect(heartsFor(40)).toBe(2)
    expect(heartsFor(1)).toBe(1)
  })
})

describe('rankFor', () => {
  it('assigns ranks at the documented boundaries', () => {
    expect(rankFor(95, 100)).toBe('S')
    expect(rankFor(94, 100)).toBe('A')
    expect(rankFor(85, 100)).toBe('A')
    expect(rankFor(84, 100)).toBe('B')
    expect(rankFor(70, 100)).toBe('B')
    expect(rankFor(69, 100)).toBe('C')
    expect(rankFor(50, 100)).toBe('C')
    expect(rankFor(49, 100)).toBe('D')
    expect(rankFor(0, 100)).toBe('D')
  })

  it('caps pct at 1.0 when streak bonuses push score over max', () => {
    expect(rankFor(120, 100)).toBe('S')
  })
})

describe('xpFor', () => {
  it('multiplies base XP by the rank multiplier', () => {
    expect(xpFor(100, 'S')).toBe(150)
    expect(xpFor(200, 'D')).toBe(100)
    expect(xpFor(100, 'B')).toBe(100)
    expect(xpFor(100, 'C')).toBe(75)
  })

  it('rounds the result', () => {
    expect(xpFor(150, 'A')).toBe(188) // 187.5 rounds up
  })
})
