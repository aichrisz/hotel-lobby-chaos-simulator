import type { LobbyScenario } from './lobbyScenarios'
import { lobbyScenarios } from './lobbyScenarios'
import { nachtScenarios } from './nachtScenarios'

export interface AuthoredScenarioVariant {
  familyId: string
  variantId: string
  scenario: LobbyScenario
}

const invoiceDataMissing: LobbyScenario = {
  id: 'firmenrechnung-split-fehlende-daten',
  category: 'billing',
  pressure: 'medium',
  guestLineDe: '„Die Übernachtung soll an meine Firma gehen, die Minibar zahle ich privat. Die Firmenanschrift habe ich gerade nicht dabei — können Sie die Rechnung trotzdem schon aufteilen?“',
  situationEn: 'The fictional business guest needs separate charges, but the company address is not available in the booking or on hand.',
  situationId: 'Tamu bisnis ingin biaya kamar dan minibar dipisah, tetapi alamat perusahaan belum ada di catatan dan tidak dibawa. Faktur terpisah belum bisa diterbitkan dengan data yang tersedia.',
  options: [
    { id: 'a', textDe: '„Gern. Ich trenne die Positionen vor und notiere, welche Firmenangaben noch fehlen. Sobald Sie die Anschrift bestätigen, kann die Rechnung korrekt ausgestellt werden.“', effects: { satisfaction: 2, composure: 0, timeCostSec: 35 }, tags: ['verify', 'honest-next-step'] },
    { id: 'b', textDe: '„Ich nehme irgendeine Firmenadresse aus dem Internet, dann ist die Rechnung schon fertig.“', effects: { satisfaction: 0, composure: -2, timeCostSec: 15 }, tags: ['invented-data', 'risky'] },
    { id: 'c', textDe: '„Dann buche ich die Minibar einfach gar nicht. Das merkt niemand.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 10 }, tags: ['misstate-charge'] },
  ],
  bestOptionId: 'a',
  rationaleId: 'Dalam varian ini, alamat perusahaan memang tidak tersedia. Pisahkan rincian yang sudah diketahui, catat data yang masih perlu dikonfirmasi, lalu terbitkan faktur setelah datanya lengkap. Mengarang alamat atau menghilangkan minibar akan membuat catatan tidak sesuai fakta.',
  shiftReportLine: 'Firmenrechnung: Anschrift fehlt; Ausstellung noch offen.',
  tags: ['billing', 'medium', 'variant'],
}

const taxiPickupUnclear: LobbyScenario = {
  id: 'nacht-fruehes-taxi-abholort',
  category: 'checkout',
  pressure: 'medium',
  guestLineDe: '„Die Bestätigung für mein Taxi um 04:15 Uhr liegt hier. Können Sie mir sagen, wo es mich abholt?“',
  situationEn: 'A fictional written note confirms the 04:15 taxi request, but does not record the pickup point.',
  situationId: 'Catatan tertulis mengonfirmasi permintaan taksi pukul 04:15, tetapi titik jemput belum tercatat. Permintaannya diterima; lokasi penjemputan masih perlu dipastikan.',
  options: [
    { id: 'a', textDe: '„Die Anfrage um 04:15 Uhr ist bestätigt. Den Abholort sehe ich hier nicht — ich kläre ihn noch, bevor ich Ihnen einen Treffpunkt nenne.“', effects: { satisfaction: 2, composure: 1, timeCostSec: 25 }, tags: ['confirm-known-fact', 'verify-gap'] },
    { id: 'b', textDe: '„Das Taxi wartet bestimmt direkt vor dem Haupteingang. Gehen Sie einfach dorthin.“', effects: { satisfaction: 1, composure: -1, timeCostSec: 5 }, tags: ['unsupported-detail'] },
    { id: 'c', textDe: '„Die Bestätigung habe ich gesehen. Wo das Taxi hält, ist nicht mein Problem.“', effects: { satisfaction: -2, composure: 0, timeCostSec: 5 }, tags: ['dismissive'] },
  ],
  bestOptionId: 'a',
  rationaleId: 'Catatan hanya membuktikan bahwa permintaan pukul 04:15 diterima; titik jemput belum tercatat. Pastikan bagian yang belum diketahui sebelum memberi petunjuk lokasi. Jangan mengubah konfirmasi permintaan menjadi jaminan tentang tempat kendaraan berhenti.',
  shiftReportLine: 'Frühtaxi um 04:15 bestätigt; Abholort noch ungeklärt.',
  tags: ['taxi', 'early-departure', 'variant'],
}

export const scenarioVariants: AuthoredScenarioVariant[] = [
  { familyId: 'firmenrechnung-split', variantId: 'firmenanschrift-fehlt', scenario: invoiceDataMissing },
  { familyId: 'nacht-fruehes-taxi', variantId: 'abholort-unklar', scenario: taxiPickupUnclear },
]

const familyByScenarioId = new Map<string, string>([
  ...lobbyScenarios.map((scenario) => [scenario.id, scenario.id] as const),
  ...nachtScenarios.map((scenario) => [scenario.id, scenario.id] as const),
  ...scenarioVariants.map(({ familyId, scenario }) => [scenario.id, familyId] as const),
])

export function familyIdForScenario(scenario: LobbyScenario): string {
  return familyByScenarioId.get(scenario.id) ?? scenario.id
}

export function variantsForFamily(familyId: string): AuthoredScenarioVariant[] {
  return scenarioVariants.filter((variant) => variant.familyId === familyId)
}

export function allAuthoredVariants(): LobbyScenario[] {
  return scenarioVariants.map(({ scenario }) => scenario)
}
