import type { OptionId } from './lobbyScenarios'

export const optionFeedback: Record<string, Record<OptionId, string>> = {
  'fruehstueckszeiten-frage': {
    a: 'Aman: kamu memberi jam yang jelas dan tetap ramah. Tawaran tambahan tidak diperlukan.',
    b: 'Informasinya benar, tetapi nada yang sangat singkat bisa terasa dingin. Tambahkan sapaan hangat.',
    c: 'Tawaran kopi memang ramah, tetapi memakan waktu untuk kebutuhan yang cukup dijawab dengan informasi.',
  },
  'taxi-express-checkout': {
    a: 'Dalam skenario ini, jalur check-out cepat dan tagihan melalui e-mail menjawab kebutuhan tamu tanpa melewatkan pencatatan.',
    b: 'Menjaga antrean tetap adil itu baik, tetapi taksi tamu sudah menunggu. Akui urgensinya lalu cari langkah cepat.',
    c: 'Melepas tamu tanpa menyepakati pembayaran membuat urusannya belum selesai dan menambah risiko.',
  },
  'firmenrechnung-split': {
    a: 'Pisahkan biaya sesuai permintaan dan minta data perusahaan yang diperlukan sebelum membuat faktur.',
    b: 'Menghapus item dari faktur bukan pemisahan yang diminta; catatan tagihan harus tetap sesuai transaksi.',
    c: 'Meminta bantuan boleh, tetapi kasus ini masih bisa ditangani tanpa menundanya ke shift berikutnya.',
  },
  'moewen-beschwerde': {
    a: 'Kamu mengakui rasa kesal tamu, menawarkan pengganti, lalu memakai humor ringan tanpa mengabaikan masalahnya.',
    b: 'Faktanya benar, tetapi jawaban ini tidak mengakui kerugian kecil yang dialami tamu atau menawarkan bantuan.',
    c: 'Leluconnya ringan, tetapi croissant yang hilang belum diganti.',
  },
  'early-checkin-familie': {
    a: 'Kamu menawarkan langkah yang bisa dilakukan sekarang tanpa menjanjikan kamar sebelum statusnya diperiksa.',
    b: 'Jam check-in menjawab aturan, tetapi keluarga yang kelelahan tetap membutuhkan arahan dan langkah berikutnya.',
    c: 'Memberi kamar yang belum diperiksa bisa mengulangi masalah untuk tamu berikutnya. Verifikasi dulu sebelum menjanjikan akses.',
  },
  'keycard-bademantel': {
    a: 'Kamu merespons cepat sambil memeriksa informasi tamu sebelum memberi akses ke kamar.',
    b: 'Kartu baru diberikan tanpa pemeriksaan yang cukup. Kecepatan tidak menggantikan perlindungan privasi kamar.',
    c: 'Penjelasan tentang kartu mungkin berguna nanti, tetapi tamu perlu bantuan praktis terlebih dahulu.',
  },
  'pms-absturz': {
    a: 'Kamu menjelaskan kendala dan menawarkan langkah sementara yang menjaga urusan tamu tetap berjalan.',
    b: 'Menunggu tanpa memberi penjelasan membuat tamu dan antrean tidak tahu apa yang sedang terjadi.',
    c: 'Jujur soal gangguan itu penting, tetapi percakapan perlu disertai alternatif atau langkah lanjutan.',
  },
  'telefon-doppelbelastung': {
    a: 'Kamu memberi waktu panggilan balik yang jelas sambil tetap melayani orang yang sudah menunggu di meja.',
    b: 'Melayani penelepon penuh perhatian, tetapi antrean di depanmu terus menunggu tanpa kabar.',
    c: 'Meminta penelepon menghubungi lagi memindahkan seluruh beban kepadanya. Tawarkan waktu panggilan balik yang pasti.',
  },
  'teddy-verloren': {
    a: 'Kamu langsung mencari barangnya dan mengulang ciri-cirinya agar orang tua tahu laporannya didengar.',
    b: 'Meminta keluarga mencoba lagi nanti tidak memberi langkah yang bisa dilakukan sekarang.',
    c: 'Teddy baru tidak menggantikan barang yang punya arti khusus bagi anak itu.',
  },
  'zimmer-doppelt-vergeben': {
    a: 'Kamu meminta maaf, menawarkan solusi segera, dan menunda pencarian penyebab sampai kebutuhan tamu tertangani.',
    b: 'Mempertanyakan tamu saat ia menemukan koper asing terdengar menyalahkan, bukan menyelesaikan masalah.',
    c: 'Menyalahkan rekan kerja tidak memulihkan rasa aman tamu. Tangani kebutuhan mereka lebih dulu.',
  },
  'busgruppe-checkout': {
    a: 'Kamu mengikuti kesepakatan grup dalam simulasi ini, menghitung kartu, dan memberi perkiraan waktu yang jelas.',
    b: 'Pemeriksaan tiap kamar terlalu luas untuk keberangkatan yang mendesak dan tidak sesuai informasi yang diberikan.',
    c: 'Menerima tumpukan tanpa menghitungnya membuat jumlah kartu tidak terverifikasi.',
  },
  'kurtaxe-verwirrung': {
    a: 'Kamu menjelaskan arti biaya dan manfaat kartu tamu dengan tenang, alih-alih hanya menyebutnya wajib.',
    b: 'Jawaban ini singkat, tetapi belum menjelaskan arti biaya atau menjawab mengapa biaya itu muncul.',
    c: 'Menghapus biaya tanpa dasar yang jelas bukan kewenangan yang ditunjukkan dalam skenario fiktif ini.',
  },
  'nacht-verpaetete-ankunft': {
    a: 'Kamu menyambut tamu, memeriksa reservasi, lalu menjelaskan bahwa kabar berikutnya segera diberikan.',
    b: 'Menganggap nama saja sudah cukup melewati pemeriksaan dan membuat tamu menunggu tanpa arahan.',
    c: 'Melewati pemeriksaan agar lebih cepat dapat membuka akses yang keliru. Pastikan informasi terlebih dahulu.',
  },
  'nacht-flur-geraeusch': {
    a: 'Kamu mengakui gangguan dan mengambil tanggung jawab untuk mencari langkah yang tenang.',
    b: 'Menyuruh tamu mengabaikan kebisingan mengecilkan keluhan dan tidak mengubah situasi.',
    c: 'Meminta tamu menghadapi orang lain sendiri memindahkan konflik kepadanya.',
  },
  'nacht-fruehes-taxi': {
    a: 'Kamu memeriksa catatan yang tersedia sebelum memastikan permintaan taksi diterima.',
    b: 'Janji bahwa taksi pasti datang belum didukung pemeriksaan, sehingga bisa memberi kepastian palsu.',
    c: 'Kamu jujur belum tahu, tetapi tetap perlu menawarkan untuk memeriksa atau mencari bantuan.',
  },
  'nacht-kaffeemaschine-0300': {
    a: 'Kamu mengakui masalah dan mencari alternatif sederhana bersama tamu.',
    b: 'Menebak dengan menekan tombol lagi tidak memastikan mesin kembali berfungsi.',
    c: 'Menutup percakapan tanpa mencari pilihan lain membuat kebutuhan tamu terabaikan.',
  },
  'promise-guest-start': {
    a: 'Aman: kamu menjanjikan waktu untuk memberi kabar, bukan hasil kamar yang belum bisa dipastikan.',
    b: 'Janji kamar siap belum aman: statusnya belum diverifikasi, sehingga waktu selesai tidak dapat dipastikan.',
    c: 'Jawaban ini tidak memberi kepastian maupun langkah berikutnya yang bisa dilakukan tamu.',
  },
  'promise-return-manageable': {
    a: 'Kamu menepati janji memberi kabar. Periksa fakta lalu tawarkan hanya langkah berikutnya yang dapat dipastikan.',
    b: 'Janji baru dalam lima menit belum didukung pemeriksaan, jadi ketidakpastian sebelumnya bisa terulang.',
    c: 'Meminta tamu menunggu tanpa pemeriksaan atau waktu kabar membuat langkah berikutnya tetap kabur.',
  },
  'promise-return-upset': {
    a: 'Kamu mengakui dampak jawaban sebelumnya, memeriksa fakta, dan menjanjikan langkah berikutnya yang jelas.',
    b: 'Menyuruh tamu agar tidak kesal mengecilkan masalah dan tidak memberi bantuan.',
    c: 'Janji sepuluh menit yang belum diverifikasi berisiko mengulang masalah kepercayaan.',
  },
}

export function feedbackFor(scenarioId: string, optionId: OptionId): string {
  const message = optionFeedback[scenarioId]?.[optionId]
  if (!message) throw new Error(`Missing authored feedback for ${scenarioId}:${optionId}`)
  return message
}
