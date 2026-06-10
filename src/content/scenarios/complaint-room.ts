import type { Scenario } from '../../types/content'

export const complaintRoom: Scenario = {
  id: 'complaint-room',
  title: 'Room Complaint',
  titleDe: 'Beschwerde über das Zimmer',
  difficulty: 'B1',
  setting: 'A guest reports noise and a cold room.',
  guest: { name: 'Frau Novak', emoji: '😟', mood: 'angry' },
  xpReward: 200,
  steps: [
    {
      kind: 'choice',
      id: 'apology',
      guestLine: 'In meinem Zimmer ist es kalt und sehr laut!',
      guestLineTranslation: 'My room is cold and very noisy!',
      choices: [
        { text: 'Das tut mir sehr leid. Ich kümmere mich sofort darum.', correct: true, feedback: 'Apology plus ownership.' },
        { text: 'Das kann nicht sein.', correct: false, feedback: 'Do not contradict the guest immediately.' },
        { text: 'Dann schlafen Sie woanders.', correct: false, feedback: 'Rude and unacceptable.' },
      ],
    },
    {
      kind: 'typing',
      id: 'solution',
      guestLine: 'Was können Sie jetzt tun?',
      guestLineTranslation: 'What can you do now?',
      prompt: 'Offer a room change or a technical check.',
      acceptedAnswers: ['Ich kann Ihnen ein anderes Zimmer anbieten oder sofort den Haustechniker informieren.'],
      keywords: ['zimmer', 'anbieten'],
    },
    {
      kind: 'choice',
      id: 'followup',
      guestLine: 'Bekomme ich eine Rückmeldung?',
      guestLineTranslation: 'Will I get an update?',
      choices: [
        { text: 'Ja, ich melde mich in wenigen Minuten wieder bei Ihnen.', correct: true, feedback: 'Sets a clear follow-up expectation.' },
        { text: 'Vielleicht.', correct: false, feedback: 'Too vague.' },
        { text: 'Nein.', correct: false, feedback: 'Not acceptable in complaint handling.' },
      ],
    },
  ],
}
