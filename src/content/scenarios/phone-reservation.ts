import type { Scenario } from '../../types/content'

export const phoneReservation: Scenario = {
  id: 'phone-reservation',
  title: 'Phone Reservation',
  titleDe: 'Reservierung am Telefon',
  difficulty: 'A2+',
  setting: 'A caller wants to book a room by phone.',
  guest: { name: 'Herr Fischer', emoji: '☎️', mood: 'stressed' },
  xpReward: 150,
  steps: [
    {
      kind: 'choice',
      id: 'phone-greeting',
      guestLine: 'Guten Tag, ich möchte ein Zimmer reservieren.',
      guestLineTranslation: 'Good day, I would like to reserve a room.',
      choices: [
        { text: 'Guten Tag, gern. Für welchen Zeitraum möchten Sie reservieren?', correct: true, feedback: 'Professional phone opening.' },
        { text: 'Was?', correct: false, feedback: 'Too short and rude.' },
        { text: 'Schreiben Sie eine E-Mail.', correct: false, feedback: 'Avoids the caller instead of helping.' },
      ],
    },
    {
      kind: 'typing',
      id: 'spell-name',
      guestLine: 'Mein Name ist Fischer.',
      guestLineTranslation: 'My name is Fischer.',
      prompt: 'Ask the caller to spell the name.',
      acceptedAnswers: ['Könnten Sie Ihren Namen bitte buchstabieren?'],
      keywords: ['namen', 'buchstabieren'],
    },
    {
      kind: 'choice',
      id: 'confirm-email',
      guestLine: 'Können Sie mir eine Bestätigung schicken?',
      guestLineTranslation: 'Can you send me a confirmation?',
      choices: [
        { text: 'Ja, ich sende Ihnen die Bestätigung per E-Mail.', correct: true, feedback: 'Confirms the expected action.' },
        { text: 'Nein, das brauchen Sie nicht.', correct: false, feedback: 'Guest asked for confirmation.' },
        { text: 'Vielleicht morgen, wenn ich Lust habe.', correct: false, feedback: 'Unprofessional.' },
      ],
    },
  ],
}
