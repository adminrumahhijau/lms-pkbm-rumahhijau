import type { Metadata } from 'next'
import { BRAND } from '@/lib/brand'

export const metadata: Metadata = { title: 'Kebijakan privasi dan ketentuan' }

const GOOGLE_POLICY = 'https://developers.google.com/terms/api-services-user-data-policy'

function Heading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 scroll-mt-20 text-2xl font-extrabold tracking-tight text-bark">
      {children}
    </h2>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-7 text-lg font-bold text-bark">{children}</h3>
}

export default function PrivasiPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-bark sm:text-4xl">
        Kebijakan privasi dan ketentuan penggunaan
      </h1>
      <p className="mt-3 text-sage-600">Terakhir diperbarui 21 November 2026.</p>
      <p className="mt-4 leading-relaxed text-sage-700">
        Halaman ini menjelaskan data apa yang dikumpulkan aplikasi ruang belajar {BRAND.name},
        untuk apa dipakai, dan bagaimana Anda mengendalikannya.
      </p>

      <nav aria-label="Isi halaman" className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
        <a href="#privasi" className="rounded-full bg-white px-4 py-2 text-leaf ring-1 ring-sage-200 hover:bg-sage-50">
          Kebijakan privasi
        </a>
        <a href="#ketentuan" className="rounded-full bg-white px-4 py-2 text-leaf ring-1 ring-sage-200 hover:bg-sage-50">
          Ketentuan penggunaan
        </a>
      </nav>

      <article className="leading-relaxed text-sage-700 [&_a]:font-semibold [&_a]:text-leaf [&_a]:underline-offset-2 hover:[&_a]:underline [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <Heading id="privasi">Kebijakan privasi</Heading>

        <Sub>1. Pengelola</Sub>
        <p>
          Aplikasi ini dikelola oleh {BRAND.name}, {BRAND.address}. Pertanyaan tentang data Anda
          dapat disampaikan lewat WhatsApp panitia di{' '}
          <a href={BRAND.whatsappUrl} target="_blank" rel="noreferrer">
            {BRAND.whatsappLabel}
          </a>
          .
        </p>

        <Sub>2. Data yang kami akses dan simpan</Sub>
        <ul>
          <li>
            <strong>Dari akun Google Anda:</strong> nama, alamat email, foto profil, dan ID akun,
            untuk mengenali Anda saat masuk.
          </li>
          <li>
            <strong>Dari Google Classroom:</strong> daftar kelas yang Anda ikuti atau ajar,
            materi, tugas, nama peserta kelas, status pengumpulan tugas, dan nilai. Untuk tutor,
            termasuk hasil pengumpulan seluruh siswa di kelas yang diajarnya.
          </li>
          <li>
            <strong>Dari Google Drive:</strong> hanya berkas yang Anda unggah lewat aplikasi ini
            (izin &quot;drive.file&quot;). Kami tidak dapat melihat berkas lain di Drive Anda.
          </li>
          <li>
            <strong>Yang kami simpan sendiri:</strong> peran akun (siswa, tutor, atau admin),
            komentar tutor pada halaman rekap, riwayat perubahan peran, dan waktu terakhir Anda
            masuk.
          </li>
          <li>
            <strong>Token akses Google</strong> disimpan di server agar data kelas dapat
            diperbarui tanpa meminta Anda masuk berulang kali. Token tidak ditampilkan di
            browser.
          </li>
        </ul>

        <Sub>3. Untuk apa data dipakai</Sub>
        <p>
          Menampilkan kelas, materi, tugas, dan nilai; memungkinkan siswa mengumpulkan tugas;
          memungkinkan tutor membuat tugas dan merekap nilai; serta menjaga keamanan akun. Data
          tidak dipakai untuk iklan, tidak dijual, dan tidak dibagikan kepada pihak lain di luar
          yang diperlukan untuk menjalankan aplikasi.
        </p>

        <Sub>4. Siapa yang dapat melihat data Anda</Sub>
        <ul>
          <li>Siswa: kelas, tugas, nilai, dan komentar miliknya sendiri, serta nama teman sekelas.</li>
          <li>Tutor: kelas yang ia ajar, termasuk nama, status pengumpulan, dan nilai siswanya.</li>
          <li>Admin: daftar pengguna beserta peran, dan rekap seluruh kelas.</li>
        </ul>

        <Sub>5. Penyimpanan dan pihak ketiga</Sub>
        <p>
          Data diproses oleh Google (masuk, Classroom, dan Drive), Supabase (basis data), dan
          penyedia hosting aplikasi. Data disimpan sampai akun dihapus atau Anda meminta
          penghapusan.
        </p>

        <Sub>6. Penggunaan data dari Google</Sub>
        <p>
          Penggunaan dan pengalihan informasi yang diterima dari API Google oleh aplikasi ini
          mematuhi{' '}
          <a href={GOOGLE_POLICY} target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , termasuk persyaratan Limited Use. Data dari Google hanya dipakai untuk fitur yang
          dijelaskan di halaman ini.
        </p>

        <Sub>7. Hak Anda</Sub>
        <ul>
          <li>
            Mencabut izin kapan saja di{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
              myaccount.google.com/permissions
            </a>
            . Setelah dicabut, aplikasi tidak lagi dapat membaca data Classroom Anda.
          </li>
          <li>
            Meminta salinan, perbaikan, atau penghapusan data Anda di aplikasi ini lewat WhatsApp
            panitia, sesuai prinsip pelindungan data pribadi (UU No. 27 Tahun 2022).
          </li>
          <li>
            Data di Google Classroom dan Google Drive tetap berada di akun Google Anda dan
            diatur oleh kebijakan Google.
          </li>
        </ul>

        <Sub>8. Warga belajar di bawah 18 tahun</Sub>
        <p>Penggunaan aplikasi oleh warga belajar di bawah 18 tahun sebaiknya sepengetahuan orang tua atau wali.</p>

        <Sub>9. Perubahan kebijakan</Sub>
        <p>Jika kebijakan ini berubah, tanggal pembaruan di bagian atas halaman akan diganti.</p>

        <Heading id="ketentuan">Ketentuan penggunaan</Heading>
        <ul>
          <li>Aplikasi ini disediakan untuk kegiatan belajar-mengajar {BRAND.name}.</li>
          <li>Anda bertanggung jawab atas akun Google Anda. Jangan membagikan akun kepada orang lain.</li>
          <li>
            Jangan mengunggah berkas yang melanggar hukum, berbahaya, atau milik orang lain
            tanpa izin.
          </li>
          <li>
            Google Classroom adalah sumber data utama. Jika ada perbedaan antara aplikasi ini
            dan Classroom, yang berlaku adalah yang ada di Classroom. Data di aplikasi dapat
            tertunda beberapa menit.
          </li>
          <li>
            Kami berupaya menjaga aplikasi tetap tersedia, tetapi tidak menjamin layanan bebas
            gangguan.
          </li>
          <li>Pengelola dapat menonaktifkan akses yang menyalahgunakan aplikasi.</li>
          <li>
            Pertanyaan atau keluhan dapat disampaikan lewat WhatsApp panitia di{' '}
            <a href={BRAND.whatsappUrl} target="_blank" rel="noreferrer">
              {BRAND.whatsappLabel}
            </a>
            .
          </li>
        </ul>
      </article>
    </main>
  )
}
