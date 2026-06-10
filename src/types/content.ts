export type Difficulty = 'A2' | 'A2+' | 'B1'
export type GuestMood = 'friendly' | 'neutral' | 'stressed' | 'angry'

export interface Scenario {
  id: string // kebab-case, unique
  title: string // EN/ID UI title
  titleDe: string // German quest title
  difficulty: Difficulty
  setting: string // quest-board flavor text (EN)
  guest: { name: string; emoji: string; mood: GuestMood }
  steps: DialogueStep[]
  xpReward: number // base XP
}

export type DialogueStep = ChoiceStep | TypingStep

interface StepBase {
  id: string // unique within scenario
  guestLine: string // German NPC line
  guestLineTranslation: string // EN gloss (toggleable in UI)
  hint?: string
}

export interface ChoiceStep extends StepBase {
  kind: 'choice'
  choices: Choice[] // 3–4 options, exactly one correct
}

export interface Choice {
  text: string // German response
  correct: boolean
  feedback: string // why right/wrong (EN, may mix ID)
}

export interface TypingStep extends StepBase {
  kind: 'typing'
  prompt: string // instruction, e.g. "Ask for the guest's reservation name"
  acceptedAnswers: string[] // ≥1 canonical German answers
  keywords?: string[] // partial-credit keywords (normalized substring match)
}

export interface VocabEntry {
  de: string
  en: string
  id?: string
  category: 'Begrüßung' | 'Check-in' | 'Zahlung' | 'Beschwerde' | 'Auskunft'
  scenarioIds: string[]
}
