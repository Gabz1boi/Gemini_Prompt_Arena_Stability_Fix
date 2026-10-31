# GEMINI PROMPT ARENA — FINAL v3
### Prompt-only challenge evaluator · Hosted by Gabriel Ignasius Sinaga

Aplikasi web untuk kompetisi prompting akademis dengan tiga ronde:

1. **Simplify Topik** — peserta menyusun prompt agar Gemini menjelaskan topik kuliah yang sulit dengan bahasa sederhana, analogi, dan contoh sehari-hari.
2. **Summarize Modul** — peserta menyusun prompt untuk mengarahkan Gemini merangkum modul secara terstruktur dan setia pada sumber.
3. **Roleplay Tutor** — peserta menyusun prompt agar Gemini berperan sebagai tutor yang membangun interaksi dua arah.

## Konsep final

- Peserta hanya mendaftar menggunakan **nama lengkap dan NIM**.
- Pada setiap ronde, peserta hanya mengisi **satu kolom: prompt**.
- Peserta **tidak perlu** menempel jawaban Gemini, transkrip, file modul, atau hasil ringkasan.
- Gemini API menilai **teks prompt saja** berdasarkan rubrik khusus ronde, total 100 poin.
- Laporan menampilkan nama, NIM, skor, rincian kriteria, bukti dari prompt, feedback, temuan kritis, dan rekomendasi perbaikan.
- Nama dan NIM tetap di browser untuk identitas laporan. Keduanya tidak dikirim ke Gemini API.
- Nama **Gabriel Ignasius Sinaga** tampil langsung di badge hero: “GOOGLE STUDENT AMBASSADOR · ACADEMIC PROMPTING · GABRIEL IGNASIUS SINAGA”.

## 1. Kebutuhan

- Node.js 18 atau lebih baru.
- Koneksi internet ketika evaluasi Gemini dijalankan.
- Gemini API key dari Google AI Studio.
- Browser modern.

## 2. Konfigurasi API key

1. Ekstrak ZIP ke folder kerja.
2. Salin `.env.example` dan ubah nama salinannya menjadi `.env`.
3. Buka `.env`, lalu isi API key:

   ```env
   GEMINI_API_KEY=API_KEY_MILIK_PANITIA
   GEMINI_MODEL=gemini-3.8-flash
   PORT=3000
   ```

4. Simpan file `.env`.

API key hanya dibaca oleh `server.js`. Jangan menaruh API key di `public/app.js`, jangan mengirimkannya kepada peserta, dan jangan mengunggah file `.env` ke repositori publik.

Model default `gemini-3.8-flash` adalah model stabil yang tercantum pada dokumentasi Gemini API. Nilainya dapat diubah melalui `GEMINI_MODEL` jika panitia memilih model lain yang tersedia untuk project API.

## 3. Menjalankan aplikasi

Tidak ada package tambahan yang perlu diinstal. Buka terminal pada folder hasil ekstrak dan jalankan:

```bash
node server.js
```

Kemudian buka browser:

```text
http://localhost:3000
```

Di Windows, file `JALANKAN-WINDOWS.bat` juga dapat digunakan untuk menjalankan server. Setelah mengubah `.env`, hentikan server lalu jalankan ulang.

## 4. Alur peserta

1. Buka halaman Overview.
2. Daftar dengan nama lengkap dan NIM.
3. Pilih ronde 1, 2, atau 3.
4. Tulis atau tempel prompt pada satu kolom yang tersedia.
5. Klik **Evaluasi prompt**.
6. Tunggu laporan skor dan feedback dari Gemini.
7. Cetak laporan atau unduh laporan JSON sebagai bukti hasil.
8. Ulangi untuk ronde lainnya.

## 5. Rubrik penilaian

Setiap ronde memiliki tujuh kriteria dengan total 100 poin. Rubriknya berbeda sesuai tujuan ronde:

- **Simplify Topik:** kejelasan tujuan, konteks dan audiens, spesifikasi tugas, strategi penyederhanaan, struktur keluaran, contoh/analogi, batasan dan standar kualitas.
- **Summarize Modul:** arahan penggunaan sumber, cakupan informasi, format keluaran, kesetiaan pada sumber, audiens dan tujuan, prioritas detail, kejelasan instruksi.
- **Roleplay Tutor:** definisi peran, konteks belajar, interaksi dua arah, pertanyaan adaptif, umpan balik, gaya komunikasi, aturan percakapan.

Skor total dihitung oleh server dengan menjumlahkan skor tiap kriteria. Dengan demikian, skor akhir tidak bergantung pada angka total yang mungkin ditulis model dalam narasinya.

## 6. Batas evaluasi yang disengaja

Karena submission hanya berupa prompt, evaluator hanya dapat menilai kualitas instruksi yang ditulis peserta. Evaluator **tidak menilai**:

- kebenaran jawaban Gemini yang tidak dikirim;
- kualitas ringkasan terhadap isi modul yang tidak dikirim;
- keberhasilan Gemini menjalankan roleplay yang tidak dikirim.

Pada ronde Summarize, evaluator menilai apakah prompt memberi instruksi yang baik untuk menggunakan modul dan menjaga kesetiaan pada sumber. Pada ronde Roleplay, evaluator menilai rancangan interaksi yang diminta oleh prompt, bukan performa jawaban Gemini.

## 7. Laporan dan scoreboard

Laporan per ronde memuat:

- nama peserta dan NIM;
- skor total 0–100 dan kategori hasil;
- skor tiap kriteria;
- bukti kutipan dari prompt;
- feedback per kriteria;
- kekuatan prompt;
- temuan kritis;
- rekomendasi perbaikan;
- catatan untuk juri.

Skor akhir kompetisi ditampilkan setelah tiga ronde selesai dan dihitung sebagai rata-rata tiga skor ronde. Laporan dapat dicetak atau disimpan sebagai PDF melalui dialog print browser, serta diunduh sebagai JSON. Scoreboard dapat diekspor sebagai CSV.

## 8. Penyimpanan data

- Nama, NIM, dan laporan tersimpan di `localStorage` browser/perangkat yang digunakan.
- Data tidak otomatis tersinkron antar komputer.
- Untuk satu laptop panitia yang dipakai bergantian, peserta dapat dinilai di browser yang sama.
- Jika panitia ingin scoreboard online lintas perangkat, aplikasi perlu ditambah database dan autentikasi panitia.
- Ekspor laporan JSON/CSV secara berkala sebagai cadangan.

## 9. Keamanan dan transparansi

- API key disimpan pada server melalui `.env`.
- Browser mengirim hanya `roundId` dan `prompt` ke endpoint aplikasi.
- Nama dan NIM tidak disertakan dalam permintaan ke Gemini API.
- Teks prompt diperlakukan sebagai data tidak tepercaya. Instruksi yang mencoba memanipulasi evaluator di dalam prompt peserta diabaikan.
- Penilaian AI dapat memiliki variasi. Juri manusia tetap memeriksa laporan dan menentukan pemenang.
- Jangan masukkan informasi pribadi sensitif ke dalam prompt peserta.

## 10. Troubleshooting

| Masalah | Solusi |
|---|---|
| API key belum dikonfigurasi | Pastikan `.env` berada satu folder dengan `server.js`, lalu restart server. |
| API key tidak valid | Periksa API key dan akses Gemini API pada project Google AI Studio. |
| Error kuota / 429 | Periksa kuota project API atau coba kembali setelah kuota tersedia. |
| Model tidak ditemukan | Ubah `GEMINI_MODEL` ke model yang tersedia untuk API key tersebut. |
| Gemini sedang padat / HTTP 503 | Server mencoba ulang otomatis hingga 4 kali dengan exponential backoff dan jitter. Jika masih gagal, prompt tetap tersimpan; klik **Coba evaluasi lagi**. |\n| Batas permintaan / HTTP 429 | Server mencoba ulang otomatis. Jika terus gagal, periksa kuota dan batas RPM/TPM project API panitia. |\n| Evaluasi gagal membaca JSON | Klik kembali ke form dan coba evaluasi ulang. Prompt tetap tersimpan. |
| Scoreboard di komputer lain kosong | Data tersimpan lokal per browser. Gunakan ekspor CSV/JSON untuk memindahkan rekap. |

## Struktur folder

```text
Gemini_Prompt_Arena_Final/
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── README.md
├── JALANKAN-WINDOWS.bat
├── project-manifest.json
└── public/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── assets/
```

## Referensi teknis

- Gemini API — Generate Content: https://ai.google.dev/api/generate-content
- Google AI Studio: https://aistudio.google.com/

Foto dan ikon di `public/assets` menggunakan aset visual dari presentasi Gemini Academy yang diberikan untuk proyek ini.
