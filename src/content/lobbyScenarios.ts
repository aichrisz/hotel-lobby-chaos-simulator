// lobbyScenarios.ts — scenario data is the product; hand-written, typed, no runtime AI.
// Hotel Ostseeblick (fiktiv), Frühschicht 06:00–09:30. All names and rooms invented.

export type Pressure = 'low' | 'medium' | 'high' | 'system'

export type Category =
  | 'checkin'
  | 'checkout'
  | 'billing'
  | 'complaint'
  | 'phone'
  | 'keys'
  | 'lostfound'
  | 'system'
  | 'info'

export type OptionId = 'a' | 'b' | 'c'

export interface ResponseOption {
  id: OptionId
  textDe: string
  effects: { satisfaction: number; composure: number; timeCostSec: number }
  tags: string[]
}

export interface LobbyScenario {
  id: string
  category: Category
  pressure: Pressure
  guestLineDe: string
  situationEn: string
  situationId: string
  options: [ResponseOption, ResponseOption, ResponseOption]
  bestOptionId: OptionId
  rationaleId: string
  shiftReportLine: string
  tags: string[]
}

export const lobbyScenarios: LobbyScenario[] = 
[
  {
    "id": "fruehstueckszeiten-frage",
    "category": "info",
    "pressure": "low",
    "guestLineDe": "„Entschuldigung, bis wann gibt es Frühstück? Mein Mann schläft noch, aber ohne Kaffee wird das heute nichts.\"",
    "situationEn": "A sleepy guest asks about breakfast hours. Easiest question of the shift — the warm-up card.",
    "situationId": "Tamu yang masih ngantuk tanya jam sarapan. Kartu pemanasan — pertanyaan paling gampang di shift ini.",
    "options": [
      {
        "id": "a",
        "textDe": "„Frühstück gibt es bis 10:30 Uhr — Sie haben also noch Zeit. Der Kaffee wartet schon auf Sie.\"",
        "effects": {
          "satisfaction": 1,
          "composure": 1,
          "timeCostSec": 10
        },
        "tags": [
          "friendly",
          "info"
        ]
      },
      {
        "id": "b",
        "textDe": "„Bis 10:30. Steht auch am Aushang neben dem Aufzug.\"",
        "effects": {
          "satisfaction": 0,
          "composure": 0,
          "timeCostSec": 5
        },
        "tags": [
          "efficient",
          "curt"
        ]
      },
      {
        "id": "c",
        "textDe": "„Ich lasse Ihnen gern einen Kaffee aufs Zimmer bringen — und das Frühstück läuft noch bis 10:30.\"",
        "effects": {
          "satisfaction": 2,
          "composure": 0,
          "timeCostSec": 30
        },
        "tags": [
          "overdeliver"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Jawaban a hangat dan cepat — info lengkap plus satu kalimat ramah, selesai. Opsi c manis tapi 30 detik hilang di Frühschicht untuk pertanyaan yang tidak butuh servis ekstra. Opsi b benar tapi dingin; poin gampang dibuang percuma.",
    "shiftReportLine": "Kaffee-Ausgabe: stabil. Keine Abstürze gemeldet.",
    "tags": [
      "info",
      "low"
    ]
  },
  {
    "id": "taxi-express-checkout",
    "category": "checkout",
    "pressure": "high",
    "guestLineDe": "„Mein Zug fährt in zwanzig Minuten! Das Taxi steht schon draußen — können wir das mit der Rechnung ganz, ganz schnell machen?\"",
    "situationEn": "Guest in a panic, taxi idling outside. Needs checkout *now*. There is an official fast path — if you know it.",
    "situationId": "Tamu panik, taksi sudah nunggu di depan. Harus check-out sekarang juga. Ada jalur resmi yang cepat — kalau kamu tahu prosedurnya.",
    "options": [
      {
        "id": "a",
        "textDe": "„Natürlich. Ihre Zimmernummer, bitte — ich mache den Express-Check-out, und die Rechnung schicke ich Ihnen direkt per E-Mail.\"",
        "effects": {
          "satisfaction": 2,
          "composure": 0,
          "timeCostSec": 20
        },
        "tags": [
          "sop",
          "efficient"
        ]
      },
      {
        "id": "b",
        "textDe": "„Einen kleinen Moment noch — die Dame vor Ihnen war zuerst da, ich bin gleich für Sie frei.\"",
        "effects": {
          "satisfaction": -1,
          "composure": 1,
          "timeCostSec": 10
        },
        "tags": [
          "fair",
          "queue"
        ]
      },
      {
        "id": "c",
        "textDe": "„Ach, kein Problem — fahren Sie einfach, das mit der Zahlung klären wir irgendwie später!\"",
        "effects": {
          "satisfaction": 1,
          "composure": -2,
          "timeCostSec": 10
        },
        "tags": [
          "risky",
          "sop-violation"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Express-Check-out plus faktur via e-mail adalah prosedur resmi: cepat, sah, dan tercatat. Opsi c terasa baik hati tapi improvisasi soal pembayaran itu garis merah — nanti kamu yang panik pas kasnya tidak balance. Opsi b adil tapi kaku; antrean bisa fleksibel untuk kasus 20-detik.",
    "shiftReportLine": "Express-Check-out: 1× erfolgreich. Das Taxi hat gehupt. Wir nicht.",
    "tags": [
      "checkout",
      "high"
    ]
  },
  {
    "id": "firmenrechnung-split",
    "category": "billing",
    "pressure": "medium",
    "guestLineDe": "„Die Übernachtung geht auf die Firma, aber die Minibar zahle ich privat. Können Sie das auf zwei Rechnungen aufteilen?\"",
    "situationEn": "Business guest needs a split invoice: room to the company, minibar private. Standard request — with one tempting shortcut that is actually invoice manipulation.",
    "situationId": "Tamu bisnis minta faktur dipisah: kamar ke perusahaan, minibar bayar pribadi. Permintaan standar — tapi ada satu jalan pintas menggoda yang sebenarnya manipulasi faktur.",
    "options": [
      {
        "id": "a",
        "textDe": "„Selbstverständlich. Ich erstelle zwei getrennte Rechnungen — die Logis auf die Firmenadresse, die Minibar privat. Haben Sie die Firmendaten zur Hand?\"",
        "effects": {
          "satisfaction": 2,
          "composure": 0,
          "timeCostSec": 40
        },
        "tags": [
          "sop",
          "billing"
        ]
      },
      {
        "id": "b",
        "textDe": "„Wissen Sie was, ich lasse die Minibar einfach von der Rechnung runter, dann passt das schon.\"",
        "effects": {
          "satisfaction": 1,
          "composure": -2,
          "timeCostSec": 15
        },
        "tags": [
          "risky",
          "sop-violation"
        ]
      },
      {
        "id": "c",
        "textDe": "„Puh, das macht dann besser meine Kollegin in der Spätschicht, die kennt sich damit aus.\"",
        "effects": {
          "satisfaction": -1,
          "composure": 1,
          "timeCostSec": 5
        },
        "tags": [
          "delegate"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Split invoice itu SOP normal di front office — makan waktu 40 detik tapi bersih dan benar. Opsi b bukan \"membantu\", itu menghilangkan item dari faktur: masalah untuk akunting dan untukmu. Opsi c melempar kerjaan yang sebenarnya kamu bisa.",
    "shiftReportLine": "Rechnungssplit ohne Drama. Die Buchhaltung schläft heute ruhig.",
    "tags": [
      "billing",
      "medium"
    ]
  },
  {
    "id": "moewen-beschwerde",
    "category": "complaint",
    "pressure": "low",
    "guestLineDe": "„Eine Möwe hat mir auf der Terrasse das Croissant geklaut! Direkt vom Teller! Ich saß direkt daneben!\"",
    "situationEn": "Baltic classic: a seagull stole the guest's croissant off the terrace table. Not your fault. Still your problem.",
    "situationId": "Klasik Laut Baltik: burung camar nyolong croissant tamu langsung dari piring di teras. Bukan salahmu. Tetap jadi masalahmu.",
    "options": [
      {
        "id": "a",
        "textDe": "„Oh nein — die Möwen hier sind leider echte Profis. Ich bringe Ihnen sofort ein neues Croissant, und drinnen am Fenster sind Sie sicher, mit Blick auf den Tatort.\"",
        "effects": {
          "satisfaction": 2,
          "composure": 1,
          "timeCostSec": 20
        },
        "tags": [
          "humor",
          "fix",
          "deescalate"
        ]
      },
      {
        "id": "b",
        "textDe": "„Dafür können wir leider nichts, das sind Wildtiere.\"",
        "effects": {
          "satisfaction": -2,
          "composure": 0,
          "timeCostSec": 5
        },
        "tags": [
          "cold",
          "technically-true"
        ]
      },
      {
        "id": "c",
        "textDe": "„Ich melde das der Küche als … Verlust durch höhere Gewalt.\"",
        "effects": {
          "satisfaction": 1,
          "composure": 0,
          "timeCostSec": 10
        },
        "tags": [
          "humor",
          "no-fix"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Rumus komplain: validasi + solusi + humor ringan. Opsi a kasih ketiganya dalam satu napas — croissant baru, tempat aman, dan tamu ikut ketawa. Opsi b benar secara fakta tapi salah secara pelayanan. Opsi c lucu tapi tamu tetap tanpa croissant.",
    "shiftReportLine": "Bekanntes Problem: Möwen. Status: WONTFIX. Workaround: neues Croissant.",
    "tags": [
      "complaint",
      "low"
    ]
  },
  {
    "id": "early-checkin-familie",
    "category": "checkin",
    "pressure": "medium",
    "guestLineDe": "„Wir sind die ganze Nacht durchgefahren … Ich weiß, Check-in ist erst um 15 Uhr. Aber gibt es irgendeine Chance auf ein Zimmer? Die Kinder schlafen fast im Stehen.\"",
    "situationEn": "Exhausted family at 07:40, check-in is officially 15:00. You can't promise a room — but you can offer a real plan.",
    "situationId": "Keluarga kelelahan jam 07:40, check-in resmi jam 15:00. Kamu tidak bisa janjikan kamar — tapi bisa kasih rencana yang nyata.",
    "options": [
      {
        "id": "a",
        "textDe": "„Ich schaue sofort, ob schon ein Zimmer fertig ist. Falls nicht: Lassen Sie die Koffer gern hier und frühstücken Sie in Ruhe — ich melde mich, sobald es so weit ist.\"",
        "effects": {
          "satisfaction": 2,
          "composure": 0,
          "timeCostSec": 35
        },
        "tags": [
          "sop",
          "plan-b"
        ]
      },
      {
        "id": "b",
        "textDe": "„Check-in ist um 15 Uhr.\"",
        "effects": {
          "satisfaction": -2,
          "composure": 0,
          "timeCostSec": 5
        },
        "tags": [
          "cold",
          "rulebook"
        ]
      },
      {
        "id": "c",
        "textDe": "„Nehmen Sie einfach die 204 — die sah gestern Abend noch ganz okay aus.\"",
        "effects": {
          "satisfaction": 1,
          "composure": -2,
          "timeCostSec": 15
        },
        "tags": [
          "risky",
          "housekeeping-bypass"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Opsi a tidak janjikan yang tidak pasti, tapi kasih rencana konkret: cek dulu, titip koper, sarapan, dikabari. Itu bedanya \"tidak bisa\" dan \"belum bisa, tapi ini yang bisa saya lakukan\". Opsi c bahaya — kamar belum dicek housekeeping bisa jadi komplain jauh lebih besar.",
    "shiftReportLine": "Early-Check-in-Anfrage: elegant gelöst. Frühstücksraum als Wartehalle: bewährt.",
    "tags": [
      "checkin",
      "medium"
    ]
  },
  {
    "id": "keycard-bademantel",
    "category": "keys",
    "pressure": "medium",
    "guestLineDe": "„Meine Karte geht nicht mehr, meine Frau ist unter der Dusche, und ich stehe hier im Bademantel. Bitte. Beeilen Sie sich.\"",
    "situationEn": "Guest locked out, in a bathrobe, dignity fading fast. Speed matters — but so does checking he actually belongs to that room.",
    "situationId": "Tamu terkunci di luar kamar, pakai jubah mandi, martabatnya menipis tiap detik. Kecepatan penting — tapi verifikasi identitas juga: kamu tidak boleh kasih akses kamar tanpa cek.",
    "options": [
      {
        "id": "a",
        "textDe": "„Sofort! Einmal kurz Ihren Namen und die Zimmernummer, bitte — dann kodiere ich die Karte in zehn Sekunden neu.\"",
        "effects": {
          "satisfaction": 1,
          "composure": 0,
          "timeCostSec": 20
        },
        "tags": [
          "sop",
          "security"
        ]
      },
      {
        "id": "b",
        "textDe": "„Kein Problem, hier — eine neue Karte für die 312, schönen Tag noch!\"",
        "effects": {
          "satisfaction": 2,
          "composure": -1,
          "timeCostSec": 10
        },
        "tags": [
          "risky",
          "security-violation"
        ]
      },
      {
        "id": "c",
        "textDe": "„Hatten Sie die Karte vielleicht neben dem Handy? Das entmagnetisiert die nämlich. Passiert ständig.\"",
        "effects": {
          "satisfaction": -1,
          "composure": 0,
          "timeCostSec": 15
        },
        "tags": [
          "lecture",
          "no-fix-yet"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Kartu kamar = akses ke barang dan privasi orang. Verifikasi nama + nomor kamar itu wajib, bukan formalitas — dan tetap bisa cepat kalau kamu bilang dulu \"sofort\". Opsi b lebih cepat 10 detik tapi kamu baru saja kasih kamar ke orang yang tidak kamu verifikasi. Opsi c: kuliah fisika bukan solusi buat orang berjubah mandi.",
    "shiftReportLine": "Keycard neu kodiert. Bademantel-Pegel: kritisch, aber stabil.",
    "tags": [
      "keys",
      "medium"
    ]
  },
  {
    "id": "pms-absturz",
    "category": "system",
    "pressure": "system",
    "guestLineDe": "„Und? Dauert das noch lange? Sie starren jetzt schon zwei Minuten auf diesen Bildschirm.\"",
    "situationEn": "The property management system freezes mid-checkout, queue building. The screen won't save you. Paper will.",
    "situationId": "Sistem hotel (PMS) hang di tengah check-out, antrean makin panjang. Layar tidak akan menyelamatkanmu. Kertas iya.",
    "options": [
      {
        "id": "a",
        "textDe": "„Unser System braucht gerade einen Moment. Ich notiere Ihre Daten kurz auf Papier und übertrage alles, sobald es wieder läuft — für Sie ändert sich nichts.\"",
        "effects": {
          "satisfaction": 1,
          "composure": 1,
          "timeCostSec": 30
        },
        "tags": [
          "fallback",
          "transparent",
          "sop"
        ]
      },
      {
        "id": "b",
        "textDe": "„…\" *(Neustart drücken. Schweigen. Angespanntes Lächeln. Beten.)*",
        "effects": {
          "satisfaction": -1,
          "composure": -1,
          "timeCostSec": 45
        },
        "tags": [
          "freeze",
          "no-communication"
        ]
      },
      {
        "id": "c",
        "textDe": "„Das System ist abgestürzt, ich kann gerade gar nichts machen. Kommen Sie am besten später wieder.\"",
        "effects": {
          "satisfaction": -2,
          "composure": 0,
          "timeCostSec": 5
        },
        "tags": [
          "honest-but-helpless"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Saat sistem mati, yang dinilai tamu bukan sistemnya — tapi kamu. Fallback kertas + komunikasi transparan (\"untuk Anda tidak ada yang berubah\") mengubah krisis IT jadi momen profesional. Opsi b adalah yang paling sering terjadi di dunia nyata, dan paling buruk: hening itu menular ke antrean.",
    "shiftReportLine": "PMS-Absturz 06:52. Papier-Backup deployed. Datenverlust: 0. Nervenverlust: moderat.",
    "tags": [
      "system",
      "system"
    ]
  },
  {
    "id": "telefon-doppelbelastung",
    "category": "phone",
    "pressure": "medium",
    "guestLineDe": "*(Telefon, während drei Gäste warten)* „Guten Morgen! Ich möchte für August ein Doppelzimmer mit Meerblick reservieren — haben Sie da noch etwas frei?\"",
    "situationEn": "Phone reservation request lands while three guests wait at the desk. Two audiences, one you.",
    "situationId": "Telepon reservasi masuk pas tiga tamu antre di depan meja. Dua \"penonton\", satu kamu. Yang di depan mata selalu lihat kamu duluan.",
    "options": [
      {
        "id": "a",
        "textDe": "„Guten Morgen, sehr gern! Darf ich Sie in fünf Minuten zurückrufen? Ich habe gerade Gäste am Empfang — dann habe ich in Ruhe Zeit für Ihre Reservierung.\"",
        "effects": {
          "satisfaction": 1,
          "composure": 1,
          "timeCostSec": 15
        },
        "tags": [
          "callback",
          "queue-control"
        ]
      },
      {
        "id": "b",
        "textDe": "*(Komplette Reservierung am Telefon aufnehmen, während die Schlange wächst und wächst.)*",
        "effects": {
          "satisfaction": 0,
          "composure": -2,
          "timeCostSec": 45
        },
        "tags": [
          "tunnel-vision"
        ]
      },
      {
        "id": "c",
        "textDe": "„Rufen Sie bitte später noch einmal an, es ist gerade viel los.\"",
        "effects": {
          "satisfaction": -1,
          "composure": 1,
          "timeCostSec": 5
        },
        "tags": [
          "brush-off"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Kuncinya: janji balik telepon yang *konkret* (\"lima menit\") — bukan menolak, bukan juga meninggalkan antrean. Opsi b kelihatan rajin tapi tiga tamu di depan mata menonton kamu mengabaikan mereka 45 detik. Opsi c melempar tanggung jawab menelepon ulang ke calon tamu — reservasi bisa hilang ke hotel sebelah.",
    "shiftReportLine": "Telefon vs. Warteschlange: 1:1 unentschieden. Rückruf-Feature: funktioniert.",
    "tags": [
      "phone",
      "medium"
    ]
  },
  {
    "id": "teddy-verloren",
    "category": "lostfound",
    "pressure": "low",
    "guestLineDe": "„Entschuldigung … haben Sie vielleicht einen Teddy gefunden? Braun, ein Ohr etwas angeknabbert. Meine Tochter kann ohne ihn nicht schlafen.\"",
    "situationEn": "A parent reports a missing teddy bear. Objectively small. Subjectively, the most important guest in the hotel.",
    "situationId": "Orang tua melapor boneka teddy anaknya hilang. Secara objektif: kecil. Secara subjektif: tamu paling penting di seluruh hotel.",
    "options": [
      {
        "id": "a",
        "textDe": "„Ich schaue sofort in der Fundsachen-Kiste nach — und ich gebe dem Housekeeping Bescheid, dass ein sehr wichtiger Gast vermisst wird. Braun, ein Ohr, verstanden.\"",
        "effects": {
          "satisfaction": 2,
          "composure": 1,
          "timeCostSec": 25
        },
        "tags": [
          "humor",
          "action",
          "heart"
        ]
      },
      {
        "id": "b",
        "textDe": "„Bis jetzt wurde nichts abgegeben. Versuchen Sie es heute Abend noch einmal.\"",
        "effects": {
          "satisfaction": -1,
          "composure": 0,
          "timeCostSec": 5
        },
        "tags": [
          "passive"
        ]
      },
      {
        "id": "c",
        "textDe": "„Unten im Shop gibt es übrigens auch ganz neue Teddys.\"",
        "effects": {
          "satisfaction": -2,
          "composure": 0,
          "timeCostSec": 10
        },
        "tags": [
          "tone-deaf"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Opsi a serius menangani hal yang \"kecil\" — cek langsung + eskalasi ke housekeeping + mengulang deskripsi biar orang tuanya tahu kamu benar-benar dengar. Opsi c adalah pelajaran klasik: teddy tidak bisa diganti teddy lain, dan menyarankan itu sama dengan bilang perasaan anaknya tidak penting.",
    "shiftReportLine": "VIP vermisst: Teddy, braun, 1 Ohr. Suchtrupp Housekeeping: aktiviert.",
    "tags": [
      "lostfound",
      "low"
    ]
  },
  {
    "id": "zimmer-doppelt-vergeben",
    "category": "checkin",
    "pressure": "high",
    "guestLineDe": "„In meinem Zimmer steht ein fremder Koffer! Und im Bad hängen Handtücher, die definitiv nicht mir gehören. Was ist hier los?!\"",
    "situationEn": "Double-assigned room — the worst front-office classic. The guest is right to be upset. Fix first, investigate later, blame no one.",
    "situationId": "Kamar terisi dobel — kesalahan klasik paling parah di front office. Tamu berhak marah. Perbaiki dulu, investigasi nanti, jangan salahkan siapa pun di depan tamu.",
    "options": [
      {
        "id": "a",
        "textDe": "„Das tut mir wirklich sehr leid — das klären wir sofort. Ich gebe Ihnen umgehend ein anderes Zimmer in derselben Kategorie, und dann schaue ich mir genau an, wie das passieren konnte.\"",
        "effects": {
          "satisfaction": 1,
          "composure": -1,
          "timeCostSec": 40
        },
        "tags": [
          "apologize",
          "fix-first",
          "sop"
        ]
      },
      {
        "id": "b",
        "textDe": "„Sind Sie ganz sicher, dass Sie im richtigen Zimmer waren?\"",
        "effects": {
          "satisfaction": -2,
          "composure": 0,
          "timeCostSec": 10
        },
        "tags": [
          "blame-guest"
        ]
      },
      {
        "id": "c",
        "textDe": "„Oh je. Das war bestimmt die Spätschicht gestern, die machen das öfter.\"",
        "effects": {
          "satisfaction": -1,
          "composure": 0,
          "timeCostSec": 10
        },
        "tags": [
          "blame-colleague"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Urutannya baku: minta maaf tulus → solusi konkret sekarang → analisis penyebab nanti (bukan di depan tamu). Opsi b menuduh tamu salah kamar — eskalasi dijamin. Opsi c menjelekkan kolega di depan tamu: tamu tidak peduli shift mana yang salah, dan kepercayaan ke hotel (bukan ke individu) yang rusak. Composure minus 1 di opsi a itu wajar — kasus begini memang bikin deg-degan walau ditangani benar.",
    "shiftReportLine": "Zimmer 217 doppelt vergeben. Hotfix: Zimmer 219. Root-Cause-Ticket: offen.",
    "tags": [
      "checkin",
      "high"
    ]
  },
  {
    "id": "busgruppe-checkout",
    "category": "checkout",
    "pressure": "high",
    "guestLineDe": "„Guten Morgen! Reisegruppe Seestern, 24 Personen, wir müssen um Punkt acht am Bus sein. Die Schlüsselkarten habe ich alle hier — als Turm.\"",
    "situationEn": "Tour group departure, 24 people, one tower of key cards, one deadline. Group SOP exists exactly for this.",
    "situationId": "Rombongan bus check-out, 24 orang, satu menara kartu kunci, satu deadline. Prosedur grup memang dibuat persis untuk momen ini.",
    "options": [
      {
        "id": "a",
        "textDe": "„Perfekt, vielen Dank! Die Gruppenrechnung geht wie vereinbart an den Veranstalter. Ich zähle die Karten einmal kurz durch — und in fünf Minuten sind Sie am Bus.\"",
        "effects": {
          "satisfaction": 2,
          "composure": 0,
          "timeCostSec": 35
        },
        "tags": [
          "sop",
          "group",
          "efficient"
        ]
      },
      {
        "id": "b",
        "textDe": "„Einen Moment, ich gehe sicherheitshalber noch einmal alle 24 Zimmer einzeln durch — Minibar, Schäden, das Übliche.\"",
        "effects": {
          "satisfaction": -1,
          "composure": -1,
          "timeCostSec": 45
        },
        "tags": [
          "thorough-but-slow"
        ]
      },
      {
        "id": "c",
        "textDe": "„Ach, legen Sie den Turm einfach da hin. Passt schon, gute Fahrt!\"",
        "effects": {
          "satisfaction": 1,
          "composure": -1,
          "timeCostSec": 5
        },
        "tags": [
          "risky",
          "uncounted"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Prosedur grup: tagihan ke penyelenggara (sudah disepakati sebelumnya), hitung kartu, lepas. Menghitung kartu itu 20 detik yang menyelamatkanmu dari drama \"kartu 312 hilang\" nanti siang. Opsi b teliti tapi salah momen — pemeriksaan 24 kamar bukan pekerjaan lima menit. Opsi c cepat tapi kalau ada kartu kurang, itu masalahmu sendirian.",
    "shiftReportLine": "24 Karten abgegeben, 24 gezählt. Statik des Kartenturms: beeindruckend.",
    "tags": [
      "checkout",
      "high"
    ]
  },
  {
    "id": "kurtaxe-verwirrung",
    "category": "billing",
    "pressure": "medium",
    "guestLineDe": "„Was ist denn bitte diese ‚Kurtaxe' auf meiner Rechnung? Die habe ich ganz sicher nicht bestellt!\"",
    "situationEn": "Guest spots the local visitor's tax (Kurtaxe) on the bill and assumes it's a scam. It's a municipal levy — and it actually comes with perks.",
    "situationId": "Tamu lihat \"Kurtaxe\" (pajak wisatawan daerah) di tagihan dan mengira ditipu. Padahal itu pungutan resmi pemerintah kota — dan sebenarnya ada untungnya buat tamu.",
    "options": [
      {
        "id": "a",
        "textDe": "„Gute Frage — die Kurtaxe ist eine Abgabe der Gemeinde, die alle Übernachtungsgäste zahlen. Dafür bekommen Sie Ihre Gästekarte: freier Strandzugang und günstigere Busfahrten inklusive.\"",
        "effects": {
          "satisfaction": 2,
          "composure": 0,
          "timeCostSec": 25
        },
        "tags": [
          "explain",
          "benefit-framing",
          "sop"
        ]
      },
      {
        "id": "b",
        "textDe": "„Das ist Pflicht. Das müssen alle zahlen.\"",
        "effects": {
          "satisfaction": -1,
          "composure": 0,
          "timeCostSec": 5
        },
        "tags": [
          "curt",
          "rulebook"
        ]
      },
      {
        "id": "c",
        "textDe": "„Ach wissen Sie was, ich nehme sie ausnahmsweise einfach raus.\"",
        "effects": {
          "satisfaction": 1,
          "composure": -2,
          "timeCostSec": 15
        },
        "tags": [
          "risky",
          "sop-violation",
          "illegal"
        ]
      }
    ],
    "bestOptionId": "a",
    "rationaleId": "Trik terbaik front office: ubah biaya jadi benefit. Kurtaxe memang wajib, tapi kalau kamu jelaskan Gästekarte-nya (pantai gratis, bus murah), tamu merasa dapat sesuatu — bukan dipalak. Opsi c bukan cuma melanggar SOP, itu melanggar aturan pemerintah kota: Kurtaxe bukan milik hotel untuk dihapus-hapus.",
    "shiftReportLine": "Kurtaxe erklärt: 1×. Gästekarte als Feature verkauft, nicht als Bug.",
    "tags": [
      "billing",
      "medium"
    ]
  }
]


export const categoryLabels: Record<Category, string> = {
  checkin: 'Check-in',
  checkout: 'Check-out',
  billing: 'Rechnung',
  complaint: 'Beschwerde',
  phone: 'Telefon',
  keys: 'Schlüssel',
  lostfound: 'Fundsachen',
  system: 'System',
  info: 'Info',
}

export const pressureLabels: Record<Pressure, string> = {
  low: 'ruhig',
  medium: 'zügig',
  high: 'dringend',
  system: 'systemausfall',
}
