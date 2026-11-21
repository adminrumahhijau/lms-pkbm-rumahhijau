import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, TriangleAlert } from 'lucide-react'
import { getOptionalUser } from '@/lib/auth'
import { BRAND } from '@/lib/brand'
import LoginButton from '@/components/LoginButton'

export const metadata: Metadata = { title: 'Masuk' }

const ERRORS: Record<string, string> = {
  auth: 'Masuk gagal. Coba lagi, dan pastikan Anda menyetujui izin yang diminta Google.',
  reauth: 'Sesi Google Anda berakhir. Silakan masuk lagi.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await getOptionalUser()) redirect('/')

  const { error } = await searchParams
  const message = error ? ERRORS[error] : undefined

  return (
    <main className="grid min-h-[calc(100dvh-3.5rem)] lg:grid-cols-2">
      {/* Foto tim: hanya di layar lebar. Latar hijau tetap tampil bila foto gagal dimuat. */}
      <section className="relative hidden overflow-hidden bg-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.heroImageUrl}
          alt="Tim PKBM Rumah Hijau berfoto bersama dengan seragam hijau abu-abu"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Belum terlambat untuk melanjutkan belajar.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/85">
            Ruang belajar warga belajar dan tutor {BRAND.name}, terhubung dengan Google Classroom.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-bark">Masuk</h1>
          <p className="mt-2 text-sage-600">
            Gunakan akun Google yang sama dengan yang Anda pakai di Google Classroom.
          </p>

          {message && (
            <p
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {message}
            </p>
          )}

          <div className="mt-8 space-y-8">
            <div>
              <h2 className="font-bold text-bark">Saya warga belajar</h2>
              <p className="mb-3 mt-1 text-sm text-sage-600">
                Lihat materi, kumpulkan tugas, dan cek nilai Anda.
              </p>
              <LoginButton />
            </div>

            <div>
              <h2 className="font-bold text-bark">Saya tutor atau admin</h2>
              <p className="mb-3 mt-1 text-sm text-sage-600">
                Kelola materi, tugas, dan nilai kelas. Google akan meminta izin tambahan untuk
                membuat dan mengubah tugas di Classroom.
              </p>
              <LoginButton staff />
            </div>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-sage-500">
            Dengan masuk, Anda menyetujui{' '}
            <Link href="/privasi#ketentuan" className="font-semibold text-leaf underline-offset-2 hover:underline">
              Ketentuan penggunaan
            </Link>{' '}
            dan{' '}
            <Link href="/privasi#privasi" className="font-semibold text-leaf underline-offset-2 hover:underline">
              Kebijakan privasi
            </Link>
            .
          </p>

          <p className="mt-6 flex items-start gap-2 border-t border-sage-200 pt-5 text-sm text-sage-600">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden />
            <span>
              Kesulitan masuk?{' '}
              <a
                href={BRAND.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-leaf underline-offset-2 hover:underline"
              >
                Tanya panitia lewat WhatsApp
              </a>
              .
            </span>
          </p>
        </div>
      </section>
    </main>
  )
}
