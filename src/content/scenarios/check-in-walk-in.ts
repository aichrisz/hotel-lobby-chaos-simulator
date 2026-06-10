import type { Scenario } from '../../types/content'

export const checkInWalkIn: Scenario = {
  id: 'check-in-walk-in',
  title: 'Walk-in Arrival',
  titleDe: 'Anreise ohne Reservierung',
  difficulty: 'A2',
  setting: 'A walk-in guest asks for a room tonight.',
  guest: { name: 'Herr Klein', emoji: '🚶', mood: 'friendly' },
  xpReward: 100,
  steps: [
    {
      kind: 'choice',
      id: 'availability',
      guestLine: 'Guten Abend, haben Sie noch ein Zimmer frei?',
      guestLineTranslation: 'Good evening, do you still have a room available?',
      choices: [
        { text: 'Guten Abend! Ich prüfe gern die Verfügbarkeit für Sie.', correct: true, feedback: 'Correct: polite and checks availability.' },
        { text: 'Nein, gehen Sie weg.', correct: false, feedback: 'Too rude.' },
        { text: 'Vielleicht, keine Ahnung.', correct: false, feedback: 'Uncertain and not professional.' },
      ],
    },
    {
      kind: 'typing',
      id: 'nights',
      guestLine: 'Für wie viele Nächte?',
      guestLineTranslation: 'For how many nights?',
      prompt: 'Ask how many nights the guest would like to stay.',
      acceptedAnswers: ['Für wie viele Nächte möchten Sie bleiben?'],
      keywords: ['naechte', 'bleiben'],
    },
    {
      kind: 'choice',
      id: 'price',
      guestLine: 'Was kostet das Zimmer pro Nacht?',
      guestLineTranslation: 'What does the room cost per night?',
      choices: [
        { text: 'Das Zimmer kostet 89 Euro pro Nacht inklusive WLAN.', correct: true, feedback: 'Clear price information.' },
        { text: 'Zu teuer für Sie.', correct: false, feedback: 'Never judge a guest.' },
        { text: 'Das sage ich nicht.', correct: false, feedback: 'Withholding price is unhelpful.' },
      ],
    },
  ],
}
