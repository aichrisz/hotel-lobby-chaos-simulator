import type { LobbyScenario, OptionId } from './lobbyScenarios'

const promiseOpening: LobbyScenario = {
  id: 'promise-guest-start',
  category: 'complaint',
  pressure: 'high',
  guestLineDe: '„Ich muss in einer Stunde los. Können Sie mir versprechen, dass mein Zimmer bis elf Uhr fertig ist?“',
  situationEn: 'A fictional guest asks for a firm room-ready promise that cannot yet be verified.',
  situationId: 'Tamu fiktif yang sama meminta kepastian kamar siap sebelum pukul sebelas. Kamu belum bisa memverifikasi waktunya.',
  options: [
    {
      id: 'a',
      textDe: '„Ich prüfe den aktuellen Stand und gebe Ihnen bis 10:30 Uhr Bescheid. Ob das Zimmer dann fertig ist, kann ich noch nicht versprechen.“',
      effects: { satisfaction: 2, composure: 1, timeCostSec: 30 },
      tags: ['realistic-commitment', 'follow-up'],
    },
    {
      id: 'b',
      textDe: '„Ich verspreche Ihnen: Ihr Zimmer ist spätestens um elf Uhr fertig.“',
      effects: { satisfaction: 1, composure: -2, timeCostSec: 10 },
      tags: ['unverified-guarantee', 'overpromise'],
    },
    {
      id: 'c',
      textDe: '„Keine Ahnung. Fragen Sie später noch einmal.“',
      effects: { satisfaction: -2, composure: 0, timeCostSec: 5 },
      tags: ['dismissal'],
    },
  ],
  bestOptionId: 'a',
  rationaleId: 'Janji yang terbatas dan bisa ditepati lebih aman: kamu memberi waktu untuk kabar, bukan menjamin kamar yang belum bisa dipastikan. Opsi b menjanjikan hasil tanpa verifikasi dan bisa merusak kepercayaan. Opsi c mengusir tamu tanpa langkah berikutnya.',
  shiftReportLine: 'Versprechen begrenzt, Rückmeldung verbindlich gemacht.',
  tags: ['promise', 'returning-guest'],
}

const manageableReturn: LobbyScenario = {
  id: 'promise-return-manageable',
  category: 'complaint',
  pressure: 'medium',
  guestLineDe: '„Ich bin wieder da, wie besprochen. Danke für Ihre Rückmeldung. Das Zimmer ist noch nicht bereit — was kann ich jetzt tun?“',
  situationEn: 'The same guest returns calmly: the room is not ready, but the promised update arrived.',
  situationId: 'Tamu yang sama kembali dengan tenang. Kamar belum siap, tetapi kamu sudah memberi kabar sesuai janji; sekarang jelaskan langkah yang bisa dipastikan.',
  options: [
    {
      id: 'a',
      textDe: '„Ich prüfe den aktuellen Stand und nenne Ihnen nur eine nächste Möglichkeit, die ich bestätigen kann.“',
      effects: { satisfaction: 2, composure: 1, timeCostSec: 25 },
      tags: ['verify', 'honest-next-step'],
    },
    {
      id: 'b',
      textDe: '„Ganz bestimmt ist das Zimmer in fünf Minuten fertig.“',
      effects: { satisfaction: 1, composure: -2, timeCostSec: 5 },
      tags: ['overpromise'],
    },
    {
      id: 'c',
      textDe: '„Warten Sie einfach noch ein bisschen.“',
      effects: { satisfaction: -2, composure: 0, timeCostSec: 5 },
      tags: ['vague'],
    },
  ],
  bestOptionId: 'a',
  rationaleId: 'Kamu menepati janji untuk memberi kabar, jadi tamu kembali dengan tenang meski kamar belum siap. Periksa fakta dan jelaskan opsi yang benar-benar bisa dipastikan. Jangan mengganti satu ketidakpastian dengan janji baru atau jawaban kabur.',
  shiftReportLine: 'Rückmeldung eingehalten. Nächsten Schritt erst nach Prüfung genannt.',
  tags: ['promise', 'manageable-return'],
}

const upsetReturn: LobbyScenario = {
  id: 'promise-return-upset',
  category: 'complaint',
  pressure: 'high',
  guestLineDe: '„Ich bin wieder da. Es ist elf, mein Zimmer ist noch nicht bereit, und ich habe immer noch keine verlässliche Auskunft. Können Sie mir jetzt helfen?“',
  situationEn: 'The same guest returns upset after an unsupported guarantee or being brushed off.',
  situationId: 'Tamu yang sama kembali kesal setelah mendapat janji tanpa verifikasi atau ditolak tanpa arahan. Kepercayaan sudah turun; akui dampaknya lalu periksa fakta.',
  options: [
    {
      id: 'a',
      textDe: '„Es tut mir leid, dass ich Ihnen keine verlässliche Auskunft gegeben habe. Ich prüfe jetzt, was ich sicher sagen kann, und komme direkt mit einem klaren nächsten Schritt zurück.“',
      effects: { satisfaction: 2, composure: 0, timeCostSec: 30 },
      tags: ['acknowledge', 'verify', 'repair-trust'],
    },
    {
      id: 'b',
      textDe: '„Sie müssen sich nicht so aufregen. Warten Sie einfach.“',
      effects: { satisfaction: -2, composure: -1, timeCostSec: 5 },
      tags: ['dismissive'],
    },
    {
      id: 'c',
      textDe: '„Ich verspreche Ihnen jetzt, dass es in zehn Minuten fertig ist.“',
      effects: { satisfaction: 1, composure: -2, timeCostSec: 5 },
      tags: ['repeat-overpromise'],
    },
  ],
  bestOptionId: 'a',
  rationaleId: 'Janji yang tidak terverifikasi atau sikap mengusir membuat tamu kehilangan kepercayaan. Akui dampaknya tanpa menyalahkan tamu, lalu periksa fakta dan beri langkah berikutnya yang jelas. Mengulang janji tanpa dasar hanya memperbesar risiko.',
  shiftReportLine: 'Vertrauen angekratzt. Fehler anerkannt, nächster Schritt geprüft.',
  tags: ['promise', 'upset-return'],
}

export const promiseScenarios: LobbyScenario[] = [promiseOpening, manageableReturn]

export const promiseFollowupByOption: Record<OptionId, LobbyScenario> = {
  a: manageableReturn,
  b: upsetReturn,
  c: upsetReturn,
}
