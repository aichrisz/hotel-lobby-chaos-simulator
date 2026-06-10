import type { Scenario } from '../../types/content'

export const guestQuestions: Scenario = {
  id: 'guest-questions',
  title: 'Guest Questions',
  titleDe: 'Gästefragen',
  difficulty: 'A2',
  setting: 'A guest asks about breakfast, luggage, and transport.',
  guest: { name: 'Frau Bauer', emoji: '🧳', mood: 'neutral' },
  xpReward: 100,
  steps: [
    {
      kind: 'choice',
      id: 'breakfast',
      guestLine: 'Wann gibt es Frühstück?',
      guestLineTranslation: 'When is breakfast served?',
      choices: [
        { text: 'Das Frühstück gibt es von 7 bis 10 Uhr im Restaurant.', correct: true, feedback: 'Clear and complete breakfast information.' },
        { text: 'Frühstück? Weiß ich nicht.', correct: false, feedback: 'Never say you do not know without offering help.' },
        { text: 'Du kannst später essen.', correct: false, feedback: 'Use formal Sie and precise times.' },
      ],
    },
    {
      kind: 'typing',
      id: 'luggage',
      guestLine: 'Kann ich mein Gepäck hier lassen?',
      guestLineTranslation: 'Can I leave my luggage here?',
      prompt: 'Tell the guest they can store luggage at reception.',
      acceptedAnswers: ['Sie können Ihr Gepäck gerne an der Rezeption lassen.'],
      keywords: ['gepaeck', 'rezeption'],
    },
    {
      kind: 'choice',
      id: 'taxi',
      guestLine: 'Können Sie mir bitte ein Taxi bestellen?',
      guestLineTranslation: 'Could you please order me a taxi?',
      choices: [
        { text: 'Natürlich, ich bestelle Ihnen gerne ein Taxi.', correct: true, feedback: 'Helpful and formal.' },
        { text: 'Rufen Sie selbst an.', correct: false, feedback: 'Too unhelpful for reception.' },
        { text: 'Taxi ist nicht mein Problem.', correct: false, feedback: 'Unprofessional response.' },
      ],
    },
  ],
}
