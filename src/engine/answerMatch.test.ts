import { normalizeGerman, levenshtein, evaluateTyping } from './answerMatch'
import type { TypingStep } from '../types/content'

function typingStep(overrides: Partial<TypingStep>): TypingStep {
  return {
    id: 'step-1',
    kind: 'typing',
    guestLine: 'Guten Tag!',
    guestLineTranslation: 'Good day!',
    prompt: 'Greet the guest',
    acceptedAnswers: ['Guten Tag'],
    ...overrides,
  }
}

describe('normalizeGerman', () => {
  it('lowercases', () => {
    expect(normalizeGerman('GUTEN TAG')).toBe('guten tag')
  })

  it('trims and collapses whitespace', () => {
    expect(normalizeGerman('  guten \t  tag  ')).toBe('guten tag')
  })

  it('maps umlauts to digraphs and strips trailing punctuation', () => {
    expect(normalizeGerman('Möchten Sie frühstücken?')).toBe('moechten sie fruehstuecken')
  })

  it('maps uppercase umlauts after lowercasing', () => {
    expect(normalizeGerman('Ärger Öl Übung')).toBe('aerger oel uebung')
  })

  it('maps ß to ss', () => {
    expect(normalizeGerman('Wie heißen Sie')).toBe('wie heissen sie')
  })

  it('strips punctuation including German quotes and dashes to spaces', () => {
    expect(normalizeGerman('„Guten Tag!“ — bitte, Ihren Ausweis.')).toBe(
      'guten tag bitte ihren ausweis',
    )
  })

  it('turns hyphens into word separators', () => {
    expect(normalizeGerman('Check-in')).toBe('check in')
  })

  it('treats composed and decomposed umlauts the same (NFC)', () => {
    expect(normalizeGerman('über')).toBe('ueber')
    expect(normalizeGerman('über')).toBe(normalizeGerman('über'))
  })
})

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('hotel', 'hotel')).toBe(0)
  })

  it('returns 1 for a single substitution', () => {
    expect(levenshtein('haus', 'maus')).toBe(1)
  })

  it('returns the other length for empty strings', () => {
    expect(levenshtein('', 'haus')).toBe(4)
    expect(levenshtein('haus', '')).toBe(4)
  })

  it('handles mixed edits (classic kitten/sitting)', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })
})

describe('evaluateTyping', () => {
  it('returns perfect for an exact match', () => {
    const step = typingStep({ acceptedAnswers: ['Guten Tag'] })
    expect(evaluateTyping('Guten Tag', step)).toBe('perfect')
  })

  it('returns perfect when user types digraphs for umlauts', () => {
    const step = typingStep({ acceptedAnswers: ['Ich möchte zahlen'] })
    expect(evaluateTyping('ich moechte zahlen', step)).toBe('perfect')
  })

  it('returns close for 1 typo in a 10-char answer (tolerance 1)', () => {
    const step = typingStep({ acceptedAnswers: ['Schlüssel'] }) // normalized: schluessel (10)
    expect(evaluateTyping('schluesel', step)).toBe('close')
  })

  it('returns close for 2 typos in an 18-char answer (tolerance 2)', () => {
    const step = typingStep({ acceptedAnswers: ['Einen Moment bitte'] })
    expect(evaluateTyping('einen momant bitt', step)).toBe('close')
  })

  it('returns wrong for 1 typo in a 5-char answer (tolerance 0)', () => {
    const step = typingStep({ acceptedAnswers: ['Danke'] })
    expect(evaluateTyping('danka', step)).toBe('wrong')
  })

  it('returns partial when all keywords are present but the sentence differs', () => {
    const step = typingStep({
      acceptedAnswers: ['Haben Sie eine Reservierung?'],
      keywords: ['Reservierung'],
    })
    expect(evaluateTyping('ich habe da so eine reservierung gemacht glaube ich', step)).toBe(
      'partial',
    )
  })

  it('matches keywords after normalization (umlauts)', () => {
    const step = typingStep({
      acceptedAnswers: ['Das Frühstück gibt es von sieben bis zehn Uhr.'],
      keywords: ['Frühstück'],
    })
    expect(evaluateTyping('fruehstueck gibt es morgens irgendwann denke ich mal', step)).toBe(
      'partial',
    )
  })

  it('returns wrong when only some keywords are present', () => {
    const step = typingStep({
      acceptedAnswers: ['Wir haben ein Zimmer frei.'],
      keywords: ['Zimmer', 'frei'],
    })
    expect(evaluateTyping('wir haben ein zimmer', step)).toBe('wrong')
  })

  it('returns wrong for garbage input', () => {
    const step = typingStep({ acceptedAnswers: ['Guten Tag'], keywords: ['Tag'] })
    expect(evaluateTyping('xyz qwertz blub', step)).toBe('wrong')
  })

  it('returns wrong for empty input', () => {
    const step = typingStep({ acceptedAnswers: ['Guten Tag'] })
    expect(evaluateTyping('   ', step)).toBe('wrong')
  })

  it('uses the best of multiple acceptedAnswers', () => {
    const step = typingStep({
      acceptedAnswers: ['Wie ist Ihr Name?', 'Wie heißen Sie?'],
    })
    expect(evaluateTyping('wie heissen sie', step)).toBe('perfect')
  })
})
