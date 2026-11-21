'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw, TriangleAlert } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-700">
        <TriangleAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-bark">Halaman tidak bisa dimuat</h1>
      <p className="mt-2 text-sage-600">
        Periksa koneksi internet Anda lalu coba lagi. Jika masih gagal, tanyakan ke tutor atau
        panitia.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf active:scale-95"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Coba lagi
        </button>
        <Link
          href="/"
          className="rounded-xl border border-sage-300 bg-white px-5 py-2.5 text-sm font-semibold text-bark transition hover:bg-sage-50 active:scale-95"
        >
          Ke Beranda
        </Link>
      </div>
    </main>
  )
}
