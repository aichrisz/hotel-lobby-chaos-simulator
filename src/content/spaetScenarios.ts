import type { LobbyScenario, OptionId, Pressure, ScenarioEvidence, Category } from './lobbyScenarios'

export type SpaetVariantId = 'taxi-urgent' | 'shuttle-urgent'
export type SpaetGuestId = 'taxi' | 'family'
export interface SpaetQueueCard { guestId: SpaetGuestId; labelId: string; guestLineDe: string; deadlineId: string }
export interface SpaetVariant {
  id: SpaetVariantId; urgentGuest: SpaetGuestId; queueCards: [SpaetQueueCard, SpaetQueueCard]
  taxiOpening: LobbyScenario; familyOpening: LobbyScenario; taxiPending: LobbyScenario; taxiCalm: LobbyScenario
  familyPending: LobbyScenario; familyCalm: LobbyScenario; reservation: LobbyScenario
}

function scenario(id: string, category: Category, pressure: Pressure, guestLineDe: string, situationId: string,
  options: LobbyScenario['options'], rationaleId: string, shiftReportLine: string,
  evidenceByOption: Record<OptionId, ScenarioEvidence>): LobbyScenario {
  return { id, category, pressure, guestLineDe, situationEn: `Fictional Spätschicht encounter: ${id}.`, situationId,
    options, bestOptionId: 'a', rationaleId, shiftReportLine, tags: ['spaet', 'linked-episode'], evidenceByOption }
}

const taxiUrgentOpening = scenario('spaet-taxi-urgent-taxi-opening', 'checkout', 'high',
  '„Mein Taxi wartet draußen. Können wir den Check-out jetzt erledigen? Die Rechnung wurde schon geprüft.“',
  'Dalam simulasi ini, tagihan sudah diperiksa dan siap dikirim lewat e-mail. Taksi menunggu di luar dan berangkat setelah satu layanan lain selesai. Jika kamu memanggil tamu taksi sekarang, ia bisa pergi setelah menerima faktur; kamu tidak sedang menjanjikan kendaraan baru atau kamar.',
  [
    { id: 'a', textDe: '„Ich schicke Ihnen die geprüfte Rechnung per E-Mail. Dann können Sie los.“', effects: { satisfaction: 2, composure: 0, timeCostSec: 25 }, tags: ['verified', 'urgent-next-step'] },
    { id: 'b', textDe: '„Warten Sie bitte, ich kümmere mich erst um die andere Anfrage.“', effects: { satisfaction: -1, composure: 0, timeCostSec: 10 }, tags: ['delay'] },
    { id: 'c', textDe: '„Fahren Sie einfach los; um die Rechnung kümmern wir uns irgendwann.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 10 }, tags: ['unresolved-billing'] },
  ], 'Faktur sudah diperiksa dan siap dikirim, jadi kirimkan sekarang agar tamu dapat berangkat. Menyuruhnya menunggu melewatkan batas yang terlihat; melepasnya tanpa kesepakatan pengiriman membuat urusan faktur terbuka.',
  'Geprüfte Rechnung versendet; Abfahrt erst nach dem gewählten Schritt.', {
    a: { status: 'clear', factId: 'Faktur yang sudah diperiksa dikirim; tamu dapat berangkat.' },
    b: { status: 'open', factId: 'Keberangkatan taksi tidak sempat ditangani sebelum batas adegan.' },
    c: { status: 'open', factId: 'Tamu dilepas tanpa langkah faktur yang disepakati.' },
  })

const familyOpeningTaxiUrgent = scenario('spaet-taxi-urgent-family-opening', 'lostfound', 'low',
  '„Wir bleiben noch hier. Haben Sie den braunen Teddy mit dem kaputten Ohr gefunden?“',
  'Orang tua meminta pencarian teddy cokelat bertelinga rusak. Mereka menyatakan dapat menunggu satu layanan; catatan barang temuan belum diperiksa. Periksa sekarang tanpa mengklaim barang sudah ditemukan.',
  [
    { id: 'a', textDe: '„Ich beginne die Suche in der Fundliste und gebe Ihnen Bescheid, sobald ich etwas bestätigt habe.“', effects: { satisfaction: 2, composure: 1, timeCostSec: 25 }, tags: ['start-search', 'honest'] },
    { id: 'b', textDe: '„Im Laden gibt es neue Teddys, nehmen Sie einfach einen davon.“', effects: { satisfaction: -2, composure: 0, timeCostSec: 10 }, tags: ['misses-meaning'] },
    { id: 'c', textDe: '„Fragen Sie morgen noch einmal. Jetzt kann ich nichts machen.“', effects: { satisfaction: -1, composure: 0, timeCostSec: 5 }, tags: ['no-step'] },
  ], 'Mulai pencarian dan ulangi ciri teddy agar orang tua tahu kebutuhannya dipahami. Teddy baru tidak menggantikan barang yang dicari; meminta mereka kembali tanpa memulai langkah apa pun membiarkan urusan terbuka.',
  'Fundsachen-Suche begonnen; Fund noch nicht bestätigt.', {
    a: { status: 'clear', factId: 'Pencarian teddy dimulai; barangnya belum dinyatakan ditemukan.' },
    b: { status: 'open', factId: 'Kebutuhan akan teddy yang sama belum ditangani.' },
    c: { status: 'open', factId: 'Pencarian tidak dimulai dan tamu diminta kembali nanti.' },
  })

const taxiAfterDeadline = scenario('spaet-taxi-urgent-taxi-pending', 'checkout', 'medium',
  '„Das Taxi ist weg. Können Sie bitte prüfen, ob noch ein anderes verfügbar ist?“',
  'Taksi yang menunggu sudah berangkat setelah satu layanan selesai. Belum ada kendaraan pengganti yang dikonfirmasi. Periksa ketersediaan dan sampaikan hanya yang benar-benar diketahui.',
  [
    { id: 'a', textDe: '„Es tut mir leid. Ich prüfe die Verfügbarkeit und bestätige Ihnen nur, was ich sicher weiß.“', effects: { satisfaction: 2, composure: 1, timeCostSec: 30 }, tags: ['acknowledge', 'verify'] },
    { id: 'b', textDe: '„Ein anderes Taxi kommt bestimmt sofort.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 5 }, tags: ['unsupported-guarantee'] },
    { id: 'c', textDe: '„Ihr Taxi wartet draußen. Sie können jetzt gehen.“', effects: { satisfaction: -2, composure: 0, timeCostSec: 5 }, tags: ['contradicts-scene'] },
  ], 'Taksi telah berangkat. Periksa kemungkinan kendaraan lain tanpa menjamin ketersediaan atau waktu datang; informasi taksi yang masih menunggu sudah tidak benar.',
  'Taxisuche als Wiederherstellung begonnen; Verfügbarkeit nicht behauptet.', {
    a: { status: 'clear', factId: 'Ketersediaan taksi lain diperiksa sebagai langkah pemulihan; kedatangan belum dipastikan.' },
    b: { status: 'open', factId: 'Kedatangan taksi lain dijamin tanpa informasi.' },
    c: { status: 'open', factId: 'Taksi disebut masih menunggu padahal sudah berangkat.' },
  })

const familyAfterDeadline = scenario('spaet-shuttle-urgent-family-pending', 'lostfound', 'high',
  '„Das Shuttle ist weg. Können Sie bitte trotzdem nach dem Teddy suchen? Meine Tochter fragt schon die ganze Zeit.“',
  'Shuttle berangkat ketika satu layanan lain selesai. Keluarga tetap di lobi dan tetap mencari teddy yang sama; pencarian belum dimulai. Tawarkan langkah nyata sekarang tanpa mengklaim hasil.',
  [
    { id: 'a', textDe: '„Es tut mir leid, dass Sie das Shuttle verpasst haben. Ich beginne die Suche jetzt und bestätige Ihnen nur, was die Fundliste zeigt.“', effects: { satisfaction: 2, composure: 1, timeCostSec: 30 }, tags: ['acknowledge', 'recovery'] },
    { id: 'b', textDe: '„Der Teddy ist bestimmt schon gefunden. Sie können jetzt gehen.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 5 }, tags: ['unsupported-guarantee'] },
    { id: 'c', textDe: '„Das Shuttle ist weg; damit kann ich Ihnen nicht helfen.“', effects: { satisfaction: -2, composure: -1, timeCostSec: 5 }, tags: ['abandons-need'] },
  ], 'Akui bahwa shuttle telah berangkat, lalu mulai pencarian teddy yang masih menjadi kebutuhan keluarga. Ini langkah pemulihan, bukan klaim bahwa shuttle pengganti atau teddy sudah tersedia.',
  'Shuttle verpasst; Suche nach dem Teddy als nächster Schritt begonnen.', {
    a: { status: 'clear', factId: 'Shuttle berangkat; pencarian teddy dimulai sebagai langkah pemulihan.' },
    b: { status: 'open', factId: 'Teddy dinyatakan ditemukan tanpa pemeriksaan.' },
    c: { status: 'open', factId: 'Keluarga ditinggalkan tanpa langkah pencarian.' },
  })

const taxiOpeningShuttleUrgent = scenario('spaet-shuttle-urgent-taxi-opening', 'checkout', 'low',
  '„Ich möchte nur meine Taxibestellung für morgen bestätigen. Die Abfahrt ist erst morgen früh.“',
  'Catatan fiktif menunjukkan permintaan taksi besok sudah masuk. Tamu tidak berangkat malam ini dan tidak meminta check-out mendesak. Keluarga lain perlu memulai pencarian teddy sebelum shuttle mereka berangkat setelah satu layanan selesai.',
  [
    { id: 'a', textDe: '„Ich sehe den Eintrag für morgen. Die Bestellung ist notiert; ich bestätige Ihnen genau diesen Stand.“', effects: { satisfaction: 1, composure: 1, timeCostSec: 20 }, tags: ['confirm-record'] },
    { id: 'b', textDe: '„Ihr Taxi für morgen ist garantiert pünktlich da.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 5 }, tags: ['unsupported-guarantee'] },
    { id: 'c', textDe: '„Fragen Sie morgen noch einmal; heute sehe ich nicht nach.“', effects: { satisfaction: -1, composure: 0, timeCostSec: 5 }, tags: ['unnecessary-delay'] },
  ], 'Catatan hanya membuktikan bahwa pesanan besok tercatat. Konfirmasikan itu, tetapi jangan menjamin kendaraan hadir tepat waktu tanpa informasi tersebut.',
  'Taxibestellung für morgen im Eintrag bestätigt, Ankunft nicht garantiert.', {
    a: { status: 'clear', factId: 'Catatan pesanan taksi besok dikonfirmasi; kedatangan belum dijanjikan.' },
    b: { status: 'open', factId: 'Ketepatan waktu taksi dijamin tanpa bukti.' },
    c: { status: 'open', factId: 'Catatan yang tersedia tidak diperiksa.' },
  })

const taxiCalmShuttleVariant = scenario('spaet-shuttle-urgent-taxi-pending', 'checkout', 'low',
  '„Danke. Die Bestellung für morgen ist eingetragen. Können Sie mir bitte sagen, was genau in der Notiz steht?“',
  'Tidak ada keberangkatan malam ini. Catatan hanya mengonfirmasi bahwa permintaan untuk besok tercatat; rincian waktu kedatangan taksi belum dipastikan.',
  [
    { id: 'a', textDe: '„Ich lese Ihnen den bestätigten Eintrag vor und markiere, was noch nicht feststeht.“', effects: { satisfaction: 1, composure: 1, timeCostSec: 20 }, tags: ['read-record', 'clear-limit'] },
    { id: 'b', textDe: '„Das Taxi ist schon da draußen und wartet.“', effects: { satisfaction: -1, composure: -1, timeCostSec: 5 }, tags: ['contradicts-scene'] },
    { id: 'c', textDe: '„Morgen früh kommt es sicher um vier Uhr.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 5 }, tags: ['invented-time'] },
  ], 'Bacakan isi catatan dan bedakan informasi yang tercatat dari waktu kedatangan yang belum diketahui. Jangan mengarang taksi yang sedang menunggu atau jam pasti.',
  'Bestätigten Eintrag vorgelesen; unbekannte Ankunftszeit bleibt offen.', {
    a: { status: 'clear', factId: 'Isi catatan besok dibacakan; jam kedatangan tetap belum diketahui.' },
    b: { status: 'open', factId: 'Catatan besok keliru disebut sebagai taksi yang sedang menunggu.' },
    c: { status: 'open', factId: 'Jam kedatangan taksi dibuat-buat.' },
  })

const familyOpeningShuttleUrgent = scenario('spaet-shuttle-urgent-family-opening', 'lostfound', 'high',
  '„Unser Shuttle fährt nach Ihrem nächsten Gast. Haben Sie den braunen Teddy mit dem kaputten Ohr schon gefunden?“',
  'Dalam adegan ini, shuttle keluarga berangkat setelah satu layanan resepsionis selesai. Mereka ingin pencarian teddy dimulai sebelum berangkat. Catatan barang temuan belum diperiksa; jangan menjanjikan teddy ditemukan.',
  [
    { id: 'a', textDe: '„Ich starte die Suche jetzt und notiere die Beschreibung. Ich sage Ihnen vor der Abfahrt, was ich tatsächlich bestätigen kann.“', effects: { satisfaction: 2, composure: 1, timeCostSec: 30 }, tags: ['urgent-search', 'honest'] },
    { id: 'b', textDe: '„Der Teddy ist bestimmt schon gefunden. Fahren Sie einfach los.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 5 }, tags: ['unsupported-guarantee'] },
    { id: 'c', textDe: '„Kaufen Sie im Laden einen neuen; dann müssen Sie nicht warten.“', effects: { satisfaction: -2, composure: 0, timeCostSec: 10 }, tags: ['misses-meaning'] },
  ], 'Mulai pencarian sebelum shuttle berangkat dan sampaikan hanya hasil yang benar-benar terkonfirmasi. Jaminan teddy sudah ditemukan tidak didukung catatan; teddy baru juga tidak menggantikan barang yang dicari.',
  'Fundsachen-Suche vor der Shuttle-Abfahrt begonnen; Fund nicht behauptet.', {
    a: { status: 'clear', factId: 'Pencarian teddy dimulai sebelum shuttle berangkat; hasil belum diketahui.' },
    b: { status: 'open', factId: 'Teddy disebut ditemukan tanpa pemeriksaan.' },
    c: { status: 'open', factId: 'Kebutuhan keluarga dialihkan ke teddy baru.' },
  })

const familyCalmAfterService = scenario('spaet-taxi-urgent-family-after-taxi', 'lostfound', 'low',
  '„Danke, dass Sie jetzt nachsehen. Es ist der braune Teddy mit dem kaputten Ohr.“',
  'Taksi berangkat setelah satu layanan. Keluarga menyatakan dapat menunggu dan tetap mencari teddy yang sama. Mulai pencarian; hasilnya belum diketahui.',
  [
    { id: 'a', textDe: '„Ich starte die Suche in der Fundliste und notiere die Beschreibung genau. Ich gebe Ihnen Bescheid, sobald ich etwas bestätigen kann.“', effects: { satisfaction: 2, composure: 1, timeCostSec: 25 }, tags: ['start-search', 'honest'] },
    { id: 'b', textDe: '„Ein neuer Teddy aus dem Laden ist doch genauso gut.“', effects: { satisfaction: -2, composure: 0, timeCostSec: 10 }, tags: ['misses-meaning'] },
    { id: 'c', textDe: '„Bitte fragen Sie morgen noch einmal.“', effects: { satisfaction: -1, composure: 0, timeCostSec: 5 }, tags: ['no-step'] },
  ], 'Keluarga masih menunggu dan tidak menyatakan tenggat lain. Mulai pencarian teddy yang sama dan beri kabar setelah ada hasil terkonfirmasi.',
  'Fundsachen-Suche nach dem Taxi-Aufbruch begonnen; Fund nicht behauptet.', {
    a: { status: 'clear', factId: 'Pencarian teddy dimulai setelah taksi berangkat; hasil belum diketahui.' },
    b: { status: 'open', factId: 'Teddy baru tidak menjawab kebutuhan keluarga.' },
    c: { status: 'open', factId: 'Pencarian teddy tetap tidak dimulai.' },
  })

const reservationDiscrepancy = scenario('spaet-reservierung-naechte', 'checkin', 'medium',
  '„Guten Abend. Ich habe für zwei Nächte gebucht. Hier steht aber nur eine Nacht.“',
  'Konfirmasi yang dibawa tamu mencantumkan satu malam, sedangkan tamu mengingat dua malam. Ketersediaan malam kedua belum diperiksa. Bandingkan bukti reservasi sebelum menjanjikan kamar atau jumlah malam.',
  [
    { id: 'a', textDe: '„Ich vergleiche Ihre Bestätigung mit der Reservierung und prüfe danach, ob die zweite Nacht verfügbar ist.“', effects: { satisfaction: 2, composure: 0, timeCostSec: 30 }, tags: ['verify', 'next-step'] },
    { id: 'b', textDe: '„Zwei Nächte sind auf jeden Fall möglich. Ich trage das sofort ein.“', effects: { satisfaction: 1, composure: -2, timeCostSec: 10 }, tags: ['unsupported-guarantee'] },
    { id: 'c', textDe: '„Dann bleiben Sie eben nur eine Nacht. Daran kann man nichts ändern.“', effects: { satisfaction: -2, composure: 0, timeCostSec: 5 }, tags: ['dismissive'] },
  ], 'Cocokkan konfirmasi dengan catatan reservasi lalu periksa ketersediaan malam kedua. Langkah itu jelas tanpa menjanjikan kamar yang belum dipastikan. Menolak atau mengubah reservasi tanpa pemeriksaan tidak menjawab perbedaan bukti.',
  'Reservierungsabweichung zum Abgleich vorgemerkt; zweite Nacht noch nicht zugesagt.', {
    a: { status: 'clear', factId: 'Konfirmasi dan reservasi dicocokkan; ketersediaan malam kedua masih perlu diperiksa.' },
    b: { status: 'open', factId: 'Malam kedua dijanjikan tanpa pemeriksaan ketersediaan.' },
    c: { status: 'open', factId: 'Perbedaan reservasi ditolak tanpa pemeriksaan.' },
  })

const taxiQueueUrgent: [SpaetQueueCard, SpaetQueueCard] = [
  { guestId: 'taxi', labelId: 'Tamu taksi', guestLineDe: '„Mein Taxi wartet draußen. Die geprüfte Rechnung kann per E-Mail kommen.“', deadlineId: 'Taksi berangkat setelah satu layanan tamu lain selesai; tagihannya sudah diperiksa.' },
  { guestId: 'family', labelId: 'Orang tua dan anak', guestLineDe: '„Haben Sie den braunen Teddy mit dem kaputten Ohr gefunden?“', deadlineId: 'Keluarga menyatakan dapat menunggu satu layanan; pencarian belum dimulai.' },
]
const shuttleQueueUrgent: [SpaetQueueCard, SpaetQueueCard] = [
  { guestId: 'taxi', labelId: 'Tamu taksi', guestLineDe: '„Können Sie meine Taxibestellung für morgen bestätigen?“', deadlineId: 'Keberangkatan taksi baru besok; pesanan sudah tercatat.' },
  { guestId: 'family', labelId: 'Orang tua dan anak', guestLineDe: '„Unser Shuttle fährt nach Ihrem nächsten Gast. Haben Sie den Teddy gefunden?“', deadlineId: 'Shuttle keluarga berangkat setelah satu layanan; pencarian teddy belum dimulai.' },
]

export const spaetVariants: SpaetVariant[] = [
  { id: 'taxi-urgent', urgentGuest: 'taxi', queueCards: taxiQueueUrgent, taxiOpening: taxiUrgentOpening,
    familyOpening: familyOpeningTaxiUrgent, taxiPending: taxiAfterDeadline, taxiCalm: taxiCalmShuttleVariant,
    familyPending: familyAfterDeadline, familyCalm: familyCalmAfterService, reservation: reservationDiscrepancy },
  { id: 'shuttle-urgent', urgentGuest: 'family', queueCards: shuttleQueueUrgent, taxiOpening: taxiOpeningShuttleUrgent,
    familyOpening: familyOpeningShuttleUrgent, taxiPending: taxiCalmShuttleVariant, taxiCalm: taxiCalmShuttleVariant,
    familyPending: familyAfterDeadline, familyCalm: familyAfterDeadline, reservation: reservationDiscrepancy },
]

export function spaetVariantFor(id: SpaetVariantId): SpaetVariant { return spaetVariants.find((variant) => variant.id === id)! }
export function spaetQueueCards(id: SpaetVariantId): [SpaetQueueCard, SpaetQueueCard] { return spaetVariantFor(id).queueCards }
export function spaetOpening(id: SpaetVariantId, guest: SpaetGuestId): LobbyScenario {
  const variant = spaetVariantFor(id)
  return guest === 'taxi' ? variant.taxiOpening : variant.familyOpening
}
export function spaetPending(id: SpaetVariantId, guest: SpaetGuestId): LobbyScenario {
  const variant = spaetVariantFor(id)
  return guest === 'taxi' ? (guest === variant.urgentGuest ? variant.taxiPending : variant.taxiCalm)
    : (guest === variant.urgentGuest ? variant.familyPending : variant.familyCalm)
}
export function allSpaetScenarios(): LobbyScenario[] {
  const byId = new Map<string, LobbyScenario>()
  for (const variant of spaetVariants) for (const item of [variant.taxiOpening, variant.familyOpening, variant.taxiPending,
    variant.taxiCalm, variant.familyPending, variant.familyCalm, variant.reservation]) byId.set(item.id, item)
  return [...byId.values()]
}
