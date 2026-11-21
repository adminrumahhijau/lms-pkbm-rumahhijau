import Link from 'next/link'
import { TriangleAlert, Users } from 'lucide-react'
import { canManage, getCurrentUser } from '@/lib/auth'
import { PROGRAMS } from '@/lib/programs'
import { loadCourses, rapikanNama, unmappedSubjects } from '@/lib/data'
import { getUpcomingTasks, loadMyCourses, toSubjects } from '@/lib/cache-data'
import ProgramCard from '@/components/ProgramCard'
import UnmappedCourses from '@/components/UnmappedCourses'
import UpcomingTasks from '@/components/UpcomingTasks'

const INTRO = {
  siswa: 'Pilih paket belajar Anda, lalu lihat materi dan kumpulkan tugas dari sini.',
  tutor: 'Kelola materi, tugas, dan nilai untuk kelas yang Anda ajar.',
  admin: 'Pantau semua kelas, rekap nilai, dan pemetaan kelas ke jenjang.',
} as const

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ info?: string }>
}) {
  const { info } = await searchParams
  const user = await getCurrentUser()
  const courses = await loadMyCourses(user)

  const upcoming = user.googleId
    ? await getUpcomingTasks(user.googleId, courses).catch((e) => {
        console.error(e)
        return []
      })
    : []

  // Kelas yang belum dipetakan hanya ada di Classroom, jadi untuk staf diambil langsung
  const unmapped = canManage(user.role)
    ? unmappedSubjects(
        await loadCourses(user.id),
        new Map<string, string>(courses.map((c) => [c.id, c.programSlug] as [string, string]))
      )
    : []

  return (
    <main>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pb-16 sm:pt-12">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Selamat datang, {rapikanNama(user.name).split(' ')[0]}.
          </h1>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-white/80">{INTRO[user.role]}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {info === 'belum-tutor' && user.role === 'siswa' && (
          <p
            role="alert"
            className="mb-8 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200"
          >
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>
              Anda masuk lewat jalur tutor, tetapi akun ini masih berperan <strong>siswa</strong>.
              Minta admin PKBM mengubah peran Anda menjadi tutor, lalu masuk lagi lewat tombol
              &quot;Masuk sebagai tutor atau admin&quot;.
            </span>
          </p>
        )}

        <UpcomingTasks tasks={upcoming} />

        <h2 className="mb-4 text-lg font-bold text-bark">Pilih paket belajar</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {PROGRAMS.map((p) => (
            <ProgramCard
              key={p.slug}
              program={p}
              subjectCount={toSubjects(courses, p.slug).length}
            />
          ))}
        </div>

        {courses.length === 0 && !canManage(user.role) && (
          <p className="mt-6 rounded-2xl border border-dashed border-sage-300 bg-white p-5 text-sm text-sage-600">
            Belum ada kelas yang tampil. Pastikan Anda sudah bergabung di Google Classroom, lalu
            minta tutor memetakan kelasnya ke jenjang.
          </p>
        )}

        {canManage(user.role) && courses.length === 0 && unmapped.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-sage-300 bg-white p-5 text-sm leading-relaxed text-sage-700">
            <p className="font-bold text-bark">Langkah awal</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Buat kelas di classroom.google.com dengan akun Google yang sama dengan akun ini.</li>
              <li>Muat ulang halaman ini. Kelas Anda muncul di bagian pemetaan jenjang.</li>
              <li>Pilih jenjangnya (Paket A, B, atau C) dan klik Simpan.</li>
            </ol>
          </div>
        )}

        {unmapped.length > 0 && <UnmappedCourses subjects={unmapped} />}

        {user.role === 'admin' && (
          <Link
            href="/admin/pengguna"
            className="mt-8 flex items-center gap-4 rounded-2xl border border-sage-200 bg-white p-4 transition hover:border-sage-300 hover:shadow-md active:scale-[0.99] sm:p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sage-100 text-ink">
              <Users className="h-6 w-6" aria-hidden />
            </span>
            <span>
              <span className="block font-bold text-bark">Kelola pengguna</span>
              <span className="block text-sm text-sage-600">
                Ubah peran siswa, tutor, dan admin.
              </span>
            </span>
          </Link>
        )}
      </div>
    </main>
  )
}
