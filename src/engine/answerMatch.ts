import type { TypingStep } from '../types/content'

export type TypingVerdict = 'perfect' | 'close' | 'partial' | 'wrong'

const UMLAUT_MAP: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
}

const PUNCTUATION = /[.,!?;:'"„“”‚‘’()\-–—]/g

export function normalizeGerman(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[äöüß]/g, (ch) => UMLAUT_MAP[ch] ?? ch)
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const curr: number[] = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

// Tolerance ladder over normalized answer length (plan §4.4)
function toleranceFor(answerLength: number): number {
  if (answerLength <= 5) return 0
  if (answerLength <= 12) return 1
  if (answerLength <= 24) return 2
  return 3
}

export function evaluateTyping(input: string, step: TypingStep): TypingVerdict {
  const normalizedInput = normalizeGerman(input)
  if (normalizedInput === '') return 'wrong'

  let anyClose = false
  for (const answer of step.acceptedAnswers) {
    const normalizedAnswer = normalizeGerman(answer)
    const distance = levenshtein(normalizedInput, normalizedAnswer)
    if (distance === 0) return 'perfect'
    if (distance <= toleranceFor(normalizedAnswer.length)) anyClose = true
  }
  if (anyClose) return 'close'

  const keywords = step.keywords ?? []
  if (
    keywords.length > 0 &&
    keywords.every((keyword) => normalizedInput.includes(normalizeGerman(keyword)))
  ) {
    return 'partial'
  }

  return 'wrong'
}
