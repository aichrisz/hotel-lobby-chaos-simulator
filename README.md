# Hotel Lobby Chaos Simulator

Latihan mobile untuk memilih respons layanan dalam bahasa Jerman di Hotel Ostseeblick, sebuah hotel rekaan. Percakapan dan pilihan berbahasa Jerman; konteks, bantuan, dan penjelasan berbahasa Indonesia. Materi ini bukan SOP hotel atau kebijakan pemberi kerja.

## Cara bermain

- Tombol utama memulai Das Versprechen: satu tamu, dua pertemuan yang saling terkait. Rantainya tetap utuh dan tidak ikut pengacakan kasus mandiri.
- Belajar santai adalah tempo default: tanpa hitung mundur, dan semua kartu dapat diselesaikan.
- Tantangan waktu bersifat opsional: 180 detik berjalan saat membaca, lalu biaya tindakan jawaban mengurangi sisa waktu. Bantuan, detail shift, dialog keluar, dan tab tersembunyi menjeda jam.
- Pemilih menyediakan Das Versprechen, Frühschicht (12 keluarga), Nachtschicht (4 keluarga), Spätschicht (3 pertemuan), dan Überraschung (5 kasus acak dari latihan pagi).
- Frühschicht dan Nachtschicht mengacak urutan keluarga tanpa duplikat pada setiap start baru. Dua varian situasi buatan tangan dapat menggantikan kartu faktur pagi atau taksi malam; jumlahnya terbatas, bukan bank soal tak terbatas.
- Spätschicht memiliki dua versi urgensi. Pilih salah satu dari dua tamu; setelah satu layanan, tamu yang menunggu muncul dalam keadaan yang sesuai. Deadline adalah aturan adegan fiktif, bukan durasi layanan nyata.
- Überraschung memainkan tepat lima keluarga pagi yang berbeda dalam satu run.
- Respons diacak stabil per kartu; ID pilihan, dampak, cabang tamu, dan manifest run tetap terhubung.
- Setelah setiap jawaban, pemain melihat kutipan yang dipilih, alasan khusus jawaban, serta perubahan nilai aktual. Jawaban terakhir juga memiliki feedback sebelum report.
- Report belajar santai berfokus pada pelajaran dan penyelesaian; rincian skor opsional dan tidak setara dengan nilai tantangan.
- Tidak ada akun, backend, AI saat runtime, XP, streak, atau data tamu nyata.
- Coba urutan lain pada Spätschicht memutar ulang manifest/varian yang sama dan mereset keputusan; memulai shift dari pemilih dapat membuat manifest baru. Antar-run boleh mengulang urutan atau varian yang sama.

## Mengapa proyek ini ada

Sebuah permainan portofolio untuk latihan bahasa Jerman lewat situasi meja resepsionis fiktif. Hotel, nama tamu, dan kejadian di dalamnya adalah rekaan.

## Tautan

- Demo: https://aichrisz.github.io/hotel-lobby-chaos-simulator/
- Repositori: https://github.com/aichrisz/hotel-lobby-chaos-simulator
- Studi kasus: [`docs/case-study.md`](docs/case-study.md)

## Teknologi

- Vite, React, TypeScript
- Tailwind CSS v4
- Vitest + Testing Library
- Playwright yang sudah menjadi dependency proyek

## Jalankan lokal

```bash
npm install
npm run dev
```

## Verifikasi

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test
npm run lint
npm run build
```

Jika Node menyediakan Web Storage eksperimental yang bertabrakan dengan Vitest/jsdom, `NODE_OPTIONS=--no-experimental-webstorage` menonaktifkan global tersebut untuk tes.

Untuk browser acceptance pada build produksi, jalankan preview pada port lokal yang kosong. Skrip menulis laporan dan screenshot ke folder evidence di luar checkout:

```bash
npm run preview -- --host 127.0.0.1 --port 4178 --strictPort
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4178/ MOBILE_QA_OUTPUT_DIR=/root/.hermes/cache/scratch/hotel-mobile-upgrade/evidence node scripts/mobile-smoke.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4178/ PROMISE_QA_OUTPUT_DIR=/root/.hermes/cache/scratch/hotel-mobile-upgrade/evidence node scripts/promise-smoke.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4178/ node scripts/gameplay-smoke.mjs
```

Atur `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` untuk Chromium lain. Pada host Chromium Snap, set `TMPDIR=/root/snap/chromium/common`. Variabel `MOBILE_QA_OUTPUT_DIR` dan `PROMISE_QA_OUTPUT_DIR` mengatur lokasi screenshot/laporan smoke.

## Skrip

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Server Vite untuk pengembangan |
| `npm test` | Menjalankan seluruh tes Vitest |
| `npm run lint` | Menjalankan ESLint |
| `npm run build` | Type-check TypeScript dan membuat bundle produksi |
| `npm run preview` | Menyajikan build lokal |
| `npm run screenshots` | Screenshot viewport untuk title, encounter, feedback, report, dan malam (default `/root/.hermes/cache/scratch/hotel-mobile-upgrade/evidence/`; `SCREENSHOT_URL` dan `SCREENSHOT_OUTPUT_DIR` dapat diatur) |
| `node scripts/promise-smoke.mjs` | Memeriksa pilihan, cabang, feedback akhir, report, dan replay promise |
| `node scripts/mobile-smoke.mjs` | Acceptance browser untuk layar, pacing, cabang, navigasi, aksesibilitas dasar, dan report |
| `node scripts/gameplay-smoke.mjs` | Acceptance browser untuk Spätschicht, manifest acak, Surprise, challenge, dan reflow; `GAMEPLAY_QA_OUTPUT_DIR` mengatur lokasi report/screenshot (default: direktori temp OS) |

## Privasi dan batas domain

Semua cerita menggunakan Hotel Ostseeblick dan tamu fiktif. Aplikasi tidak mengumpulkan data tamu, tidak menggunakan branding TRIHOTEL, dan tidak memberi panduan operasional untuk hotel nyata.
