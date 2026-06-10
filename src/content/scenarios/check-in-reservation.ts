import type { Scenario } from '../../types/content'

export const checkInReservation: Scenario = {
  id: 'check-in-reservation',
  title: 'Check-in with Reservation',
  titleDe: 'Check-in mit Reservierung',
  difficulty: 'A2',
  setting: 'A guest with a booking arrives at the front desk.',
  guest: { name: 'Herr Schmidt', emoji: '🧑‍💼', mood: 'friendly' },
  xpReward: 100,
  steps: [
    {
      kind: 'choice',
      id: 'greeting',
      guestLine: 'Guten Tag! Ich habe ein Zimmer reserviert.',
      guestLineTranslation: 'Good day! I have reserved a room.',
      choices: [
        { text: 'Guten Tag und herzlich willkommen! Wie ist Ihr Name, bitte?', correct: true, feedback: 'Warm formal greeting plus asking for the name.' },
        { text: 'Hi! Was willst du?', correct: false, feedback: 'Du-form and casual tone are wrong at reception.' },
        { text: 'Wir haben keine Zimmer.', correct: false, feedback: 'Check the booking first before refusing.' },
      ],
    },
    {
      kind: 'typing',
      id: 'ask-id',
      guestLine: 'Mein Name ist Schmidt, Thomas Schmidt.',
      guestLineTranslation: 'My name is Schmidt, Thomas Schmidt.',
      prompt: 'Ask the guest for an ID document politely.',
      acceptedAnswers: ['Könnten Sie mir bitte Ihren Ausweis zeigen?', 'Darf ich bitte Ihren Ausweis sehen?'],
      keywords: ['ausweis', 'bitte'],
    },
    {
      kind: 'choice',
      id: 'breakfast-wifi',
      guestLine: 'Wann gibt es Frühstück und wie komme ich ins WLAN?',
      guestLineTranslation: 'When is breakfast and how do I connect to Wi-Fi?',
      hint: 'Give two pieces of information in one calm answer.',
      choices: [
        { text: 'Frühstück gibt es von 7 bis 10 Uhr. Das WLAN-Passwort finden Sie auf Ihrer Schlüsselkarte.', correct: true, feedback: 'Clear, guest-friendly information.' },
        { text: 'Steht irgendwo.', correct: false, feedback: 'Too vague and unhelpful.' },
        { text: 'Keine Ahnung, fragen Sie morgen.', correct: false, feedback: 'Reception should provide basic hotel information.' },
      ],
    },
  ],
}
