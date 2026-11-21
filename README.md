# PKBM Rumah Hijau, Ruang Belajar Terhubung Google Classroom (v4)

Aplikasi web (Next.js App Router + TypeScript + Tailwind CSS + Supabase) untuk PKBM Rumah Hijau.
Siswa dan tutor memakai satu antarmuka berjenjang (Paket A / B / C) yang membaca dan menulis ke
**Google Classroom** lewat API resmi, dengan Supabase sebagai cache cepat, penyimpan token, dan
penyimpan rekap nilai.

## Fitur

| Tahap | Fitur |
|---|---|
| 1 | Login Google OAuth 2.0 dengan scope Classroom; token disimpan aman di tabel `profiles` |
| 2 | Pengambilan kelas dan tugas dari Classroom API |
| 3 | UI berjenjang: beranda 3 jenjang, daftar mapel (breadcrumb), ruang kelas (Materi, Tugas, Peserta) |
| 4 | Pemetaan kelas Classroom ke jenjang (`course_programs`), data asli menggantikan data contoh |
| 5 | Tutor: tambah materi dan buat tugas (tautan, YouTube, atau file lewat Google Drive) |
| 6 | Siswa: kumpulkan tugas dari web (unggah ke Drive lalu serahkan ke Classroom) |
| 7 | Tutor: ubah dan hapus materi/tugas |
| 8 | Sinkronisasi ke Supabase (cron + manual), rekap nilai + CSV, nilai dan komentar untuk siswa |

## Yang baru di v4

- **Sinkronisasi otomatis saat halaman kelas dibuka** (`lib/auto-sync.ts`): bila data kelas lebih tua dari 5 menit, aplikasi memperbaruinya di latar belakang memakai token seorang guru kelas itu, lalu halaman memuat ulang sekali. Tutor dan siswa tidak perlu menekan apa pun, dan ini juga berjalan di komputer lokal tanpa cron.
  - Jika yang membuka adalah guru kelas itu, tokennya sendiri yang dipakai (dan ia menjadi penyinkron berikutnya).
  - Bila sinkronisasi gagal (mis. sesi guru berakhir), percobaan berikutnya ditunda 30 menit; banner peringatan untuk guru tetap muncul.
  - Throttle disimpan di memori tiap instance server. Aman karena sinkronisasi bersifat idempotent.
  - Memakai `after()` dari `next/server` (Next.js 15.1 ke atas). Cron di `vercel.json` tetap berguna sebagai cadangan.
- **Halaman `/privasi`** berisi kebijakan privasi dan ketentuan penggunaan, dapat dibuka tanpa login, dengan tautan di footer dan di halaman masuk. Alamat halaman ini dipakai saat mengajukan verifikasi aplikasi di Google OAuth consent screen (`https://<domain>/privasi`).
  - **Teks ini adalah draf.** Sesuaikan dengan praktik PKBM yang sebenarnya (misalnya penyedia hosting yang dipakai) dan minta pengurus meninjaunya sebelum dipublikasikan.

## Yang baru di v3

- **Kelola pengguna** (khusus admin, `/admin/pengguna`): daftar semua pengguna, pencarian nama/email, ganti peran siswa, tutor, atau admin dengan satu klik, dan riwayat perubahan peran.
  - Pengaman: hanya admin (diperiksa di server), tidak bisa mengubah peran akun sendiri, dan harus selalu tersisa minimal satu admin.
  - Perlu menjalankan `supabase/migrations/v3.sql` sekali di SQL Editor (membuat tabel `role_audit`). Instalasi baru cukup memakai `supabase/schema.sql`.
  - Admin pertama tetap dibuat lewat SQL: `update public.profiles set role = 'admin' where email = '...';`
- **Petunjuk untuk akun yang belum jadi tutor**: bila seseorang masuk lewat tombol tutor tetapi perannya masih siswa, Beranda menampilkan pesan agar meminta admin mengubah perannya.
- **Panduan awal** di Beranda tutor/admin yang belum punya kelas, dan pintasan **Kelola pengguna** untuk admin.
- Nama dari Google yang seluruhnya huruf besar ("REDHO ARI MERATNO") ditampilkan rapi ("Redho Ari Meratno").
- Tautan anchor tidak lagi tertutup header yang menempel.

## Yang baru di v2

**Navigasi**
- Bilah atas tetap di semua halaman: logo, tombol **Beranda**, nama dan peran pengguna, serta tombol **Keluar**.
- Di HP, breadcrumb berubah menjadi satu tombol **Kembali ke ...** yang mudah ditekan.
- Halaman masuk menampilkan pesan galat yang jelas dan langsung mengarahkan ke Beranda bila sudah login.

**Tampilan** (mengacu pada situs resmi pkbm-rumahhijau.sch.id)
- Hijau tua `#0b3d2e` sebagai warna utama, abu-abu kehijauan sebagai dasar, dan satu warna berbeda per paket.
- Huruf besar **A / B / C** pada kartu dan header paket.
- Satu keluarga huruf (Plus Jakarta Sans), sapaan hangat di Beranda, dan footer dengan kontak WhatsApp panitia.
- Logo dan foto tim diambil dari situs resmi (lihat `lib/brand.ts`). Bila gagal dimuat, tampil ikon daun dan latar hijau.

**Kemudahan pakai**
- Beranda siswa menampilkan **Tugas yang perlu dikerjakan** dengan sisa waktu ("Besok", "Terlambat 2 hari").
- Kartu tugas menampilkan chip sisa waktu; dialog membuka dengan animasi singkat dan menghormati pengaturan *reduce motion*.
- Layar muat (skeleton), halaman galat, dan halaman tidak ditemukan dengan petunjuk langkah berikutnya.
- Judul tab per halaman, tautan "Lewati ke konten utama", dan cincin fokus keyboard yang terlihat.

**Teknis**
- `getCurrentUser` kini di-cache per permintaan (header dan halaman berbagi satu pengambilan data).
- Logo/foto dapat diganti lewat `NEXT_PUBLIC_LOGO_URL` dan `NEXT_PUBLIC_HERO_URL`.
- Font diunduh lewat `next/font/google` saat build/dev pertama (butuh internet sekali).

## Menjalankan

1. Prasyarat: Node.js 20+ dan akun Supabase + Google Cloud.
2. `npm install`
3. Salin `.env.example` menjadi `.env.local`, lalu isi semua nilainya.
4. **Supabase**
   - Buat project baru, buka *SQL Editor*, jalankan seluruh isi `supabase/schema.sql`.
   - *Authentication → Providers → Google*: aktifkan, isi Client ID dan Client Secret.
   - *Authentication → URL Configuration*: tambahkan `http://localhost:3000/auth/callback` (dan domain produksi) ke **Redirect URLs**.
5. **Google Cloud Console**
   - Aktifkan **Google Classroom API** dan **Google Drive API**.
   - *OAuth consent screen* (External). Tambahkan scope yang ada di `lib/google-scopes.ts`, dan masukkan akun uji di **Test users**.
   - *Credentials → OAuth client ID → Web application*:
     - Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
     - Authorized JavaScript origins: `http://localhost:3000` dan domain produksi.
6. `npm run dev`, buka http://localhost:3000.
7. Login sekali, lalu jadikan akun tutor/admin lewat SQL Editor:
   ```sql
   update public.profiles set role = 'tutor' where email = 'tutor@contoh.com';
   ```
8. Tutor masuk lewat **Masuk sebagai tutor atau admin**, buka Beranda, dan pilih jenjang untuk tiap kelas di bagian *belum dipetakan*. Kelas langsung disinkronkan dan tampil untuk siswa.

## Cron sinkronisasi

`vercel.json` memanggil `/api/cron/sync` tiap 15 menit dengan header `Authorization: Bearer $CRON_SECRET`.
Paket Hobby Vercel hanya mengizinkan cron harian; untuk interval lebih rapat gunakan paket berbayar,
layanan cron eksternal, atau `pg_cron` + `pg_net` di Supabase.

## Struktur

```
app/                 halaman, Server Actions, API routes (cron, rekap CSV)
components/          komponen UI (kartu, dialog, rekap, tombol aksi)
lib/                 klien Supabase/Classroom/Drive, sinkronisasi, guard, util
supabase/schema.sql  skema database final + RLS
middleware.ts        penyegar sesi Supabase
```

## Catatan keamanan

- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server (`lib/supabase/admin.ts`, `server-only`). Jangan diberi awalan `NEXT_PUBLIC_`.
- Token Google di `profiles` tidak bisa dibaca dari browser (hak akses kolom di `schema.sql`).
- Semua tabel cache hanya bisa **dibaca** pengguna lewat RLS; penulisan lewat server. Siswa hanya melihat kelas, nilai, dan komentarnya sendiri.
- Setiap Server Action memeriksa peran di server (`lib/guard.ts`), bukan hanya menyembunyikan tombol.
- Uji dengan akun siswa asli sebelum diluncurkan: pastikan tidak bisa membuka `/api/rekap/<id>` (harus 403) dan tidak melihat data siswa lain.

## Batasan Google yang perlu diketahui

- Tugas hanya bisa dikumpulkan/diubah/dihapus lewat API bila dibuat oleh project OAuth yang sama (yaitu lewat web ini). Tugas buatan aplikasi Classroom diarahkan ke Classroom.
- Lampiran pekerjaan siswa lewat API hanya berupa tautan; file Drive dibagikan ke email guru.
- Komentar pribadi Classroom tidak tersedia lewat API, jadi komentar di rekap adalah milik aplikasi ini.
- Nilai baru terbaca setelah guru **mengembalikan** tugas di Classroom.
- Selama status OAuth "Testing", refresh token berlaku sekitar 7 hari. Untuk produksi, pindahkan ke "In production".

## Perbedaan dari kode yang ditampilkan di percakapan

Perbaikan kecil saat kode dirakit menjadi satu proyek:

- `middleware.ts` ditambahkan (pola resmi `@supabase/ssr` agar sesi tersegarkan).
- Dialog (`Sheet`) kini dirender lewat *portal* ke `<body>`. Sebelumnya, dialog di dalam kartu tugas bisa terpotong karena efek hover (`translate`) dan `overflow-hidden` pada kartu.
- `getCourseWork` (Classroom langsung) kini mengisi `grade` dan `feedback` agar sesuai tipe `Task`.
- Pembuatan `Map` di beranda diberi tipe eksplisit.
- Fungsi `getMappings` dan `subjectsForProgram` yang tidak lagi terpakai dihapus dari `lib/data.ts`.
- Halaman demo Tahap 2 (`app/dashboard/*`) tidak disertakan karena digantikan UI jenjang.
- Redirect default setelah login adalah `/` (beranda).
- Skema SQL digabung menjadi satu berkas final (`supabase/schema.sql`), bukan potongan per tahap.
