import type { Scenario } from '../types/content'

// Mini scenario for engine tests: choice → typing → hinted choice.
// maxScore = 100 + 150 + 100 = 350.
export const fixtureScenario: Scenario = {
  id: 'fixture-mini',
  title: 'Fixture Mini Quest',
  titleDe: 'Mini-Quest',
  difficulty: 'A2',
  setting: 'A tiny test lobby.',
  guest: { name: 'Frau Test', emoji: '🧪', mood: 'friendly' },
  xpReward: 100,
  steps: [
    {
      kind: 'choice',
      id: 'greet',
      guestLine: 'Guten Tag!',
      guestLineTranslation: 'Good day!',
      choices: [
        {
          text: 'Guten Tag! Herzlich willkommen!',
          correct: true,
          feedback: 'Polite formal greeting.',
        },
        {
          text: 'Hallo du!',
          correct: false,
          feedback: 'Too informal — use the Sie register.',
        },
        {
          text: 'Was wollen Sie?',
          correct: false,
          feedback: 'Impolite phrasing for reception.',
        },
      ],
    },
    {
      kind: 'typing',
      id: 'ask-name',
      guestLine: 'Ich habe eine Reservierung.',
      guestLineTranslation: 'I have a reservation.',
      prompt: "Ask for the guest's name",
      acceptedAnswers: ['Wie ist Ihr Name?'],
      keywords: ['name'],
    },
    {
      kind: 'choice',
      id: 'wish-stay',
      guestLine: 'Danke schön!',
      guestLineTranslation: 'Thank you very much!',
      hint: 'Wish the guest a pleasant stay.',
      choices: [
        {
          text: 'Ich wünsche Ihnen einen angenehmen Aufenthalt!',
          correct: true,
          feedback: 'Perfect formal farewell.',
        },
        {
          text: 'Tschüssi!',
          correct: false,
          feedback: 'Too casual for a hotel.',
        },
        {
          text: 'Bitte gehen Sie.',
          correct: false,
          feedback: 'Sounds like you are sending the guest away.',
        },
      ],
    },
  ],
}

// Four choice steps to test the streak multiplier on step 4.
export const streakScenario: Scenario = {
  id: 'fixture-streak',
  title: 'Fixture Streak Quest',
  titleDe: 'Serien-Quest',
  difficulty: 'A2',
  setting: 'Four quick questions in a row.',
  guest: { name: 'Herr Streak', emoji: '🔥', mood: 'neutral' },
  xpReward: 100,
  steps: [1, 2, 3, 4].map((n) => ({
    kind: 'choice' as const,
    id: `q${n}`,
    guestLine: `Frage ${n}?`,
    guestLineTranslation: `Question ${n}?`,
    choices: [
      { text: 'Ja, gerne.', correct: true, feedback: 'Correct.' },
      { text: 'Nö.', correct: false, feedback: 'Too informal.' },
      { text: 'Keine Ahnung.', correct: false, feedback: 'Unhelpful.' },
    ],
  })),
}
