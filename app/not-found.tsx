import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-sage-600">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-bark">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sage-600">
        Kelas atau halaman ini tidak ada, atau Anda belum terdaftar di dalamnya.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf active:scale-95"
      >
        Kembali ke Beranda
      </Link>
    </main>
  )
}
