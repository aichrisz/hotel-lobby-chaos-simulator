import type { Scenario } from '../../types/content'

export const checkOutPayment: Scenario = {
  id: 'check-out-payment',
  title: 'Check-out & Payment',
  titleDe: 'Abreise und Zahlung',
  difficulty: 'A2+',
  setting: 'A guest checks out and asks for the invoice.',
  guest: { name: 'Frau Weber', emoji: '💳', mood: 'neutral' },
  xpReward: 150,
  steps: [
    {
      kind: 'choice',
      id: 'checkout',
      guestLine: 'Ich möchte auschecken, bitte.',
      guestLineTranslation: 'I would like to check out, please.',
      choices: [
        { text: 'Sehr gern. Hatten Sie etwas aus der Minibar?', correct: true, feedback: 'Checks extras before billing.' },
        { text: 'Dann geben Sie mir die Karte.', correct: false, feedback: 'Too abrupt.' },
        { text: 'Sie müssen warten, ich habe keine Zeit.', correct: false, feedback: 'Impolite and not guest-oriented.' },
      ],
    },
    {
      kind: 'typing',
      id: 'invoice',
      guestLine: 'Kann ich eine Rechnung bekommen?',
      guestLineTranslation: 'Can I get an invoice?',
      prompt: 'Say that you will prepare the invoice.',
      acceptedAnswers: ['Natürlich, ich bereite die Rechnung für Sie vor.'],
      keywords: ['rechnung', 'vor'],
    },
    {
      kind: 'choice',
      id: 'payment',
      guestLine: 'Kann ich mit Karte zahlen?',
      guestLineTranslation: 'Can I pay by card?',
      choices: [
        { text: 'Ja, Kartenzahlung ist möglich.', correct: true, feedback: 'Simple and correct.' },
        { text: 'Nur Goldmünzen.', correct: false, feedback: 'Funny but not real front office German.' },
        { text: 'Nein, Karten sind verboten.', correct: false, feedback: 'Incorrect generic answer.' },
      ],
    },
  ],
}
