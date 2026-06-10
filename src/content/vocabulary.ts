import type { VocabEntry } from '../types/content'

export const vocabulary: VocabEntry[] = [
  { de: 'Herzlich willkommen', en: 'Warm welcome', id: 'Selamat datang dengan hangat', category: 'Begrüßung', scenarioIds: ['check-in-reservation'] },
  { de: 'Ausweis', en: 'ID document', id: 'Kartu identitas', category: 'Check-in', scenarioIds: ['check-in-reservation'] },
  { de: 'Rechnung', en: 'Invoice', id: 'Invoice/tagihan', category: 'Zahlung', scenarioIds: ['check-out-payment'] },
  { de: 'Kartenzahlung', en: 'Card payment', id: 'Pembayaran kartu', category: 'Zahlung', scenarioIds: ['check-out-payment'] },
  { de: 'Das tut mir sehr leid', en: 'I am very sorry', id: 'Saya minta maaf', category: 'Beschwerde', scenarioIds: ['complaint-room'] },
  { de: 'Ich kümmere mich darum', en: 'I will take care of it', id: 'Saya urus', category: 'Beschwerde', scenarioIds: ['complaint-room'] },
]
