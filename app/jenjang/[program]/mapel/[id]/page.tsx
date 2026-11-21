import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserRound } from 'lucide-react'
import { canManage, getCurrentUser } from '@/lib/auth'
import { maybeAutoSync } from '@/lib/auto-sync'
import { ID_PATTERN } from '@/lib/guard'
import { getProgram } from '@/lib/programs'
import { formatWaktu, iconForSubject, safe } from '@/lib/data'
import {
  getCachedMaterials, getCachedRoster, getCachedTasks, getRekap, loadMyCourses,
} from '@/lib/cache-data'
import AutoRefresh from '@/components/AutoRefresh'
import Breadcrumb from '@/components/Breadcrumb'
import ClassroomNav, { TABS, type TabKey } from '@/components/ClassroomNav'
import { ModuleSection, ParticipantSection, TaskSection } from '@/components/ClassroomSections'
import RekapSection from '@/components/RekapSection'
import SyncButton from '@/components/SyncButton'

export const metadata: Metadata = { title: 'Ruang kelas' }

export const maxDuration = 60 // sinkronisasi manual bisa memakan waktu pada kelas besar

function Notice({ kind }: { kind: 'izin' | 'gagal' }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      {kind === 'izin' ? (
        <>
          Izin akses belum lengkap.{' '}
          <Link href="/login" className="font-medium underline">Login ulang</Link>.
        </>
      ) : (
        'Gagal memuat data. Coba muat ulang halaman.'
      )}
    </div>
  )
}

const SYNC_ERROR_TEXT: Record<string, string> = {
  REAUTH_REQUIRED: 'sesi Google guru yang menyinkronkan sudah berakhir',
  NOT_TEACHER: 'akun penyinkron bukan lagi guru di kelas ini',
}

export default async function MapelPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string; id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { program: slug, id } = await params
  const { tab } = await searchParams

  const program = getProgram(slug)
  if (!program || !ID_PATTERN.test(id)) notFound()

  const user = await getCurrentUser()
  const courses = await loadMyCourses(user)
  const course = courses.find((c) => c.id === id)
  if (!course || course.programSlug !== slug) notFound()

  const isTeacher = course.role === 'teacher'
  const isStudent = course.role === 'student'
  const canRekap = isTeacher || user.role === 'admin'
  const manage = canManage(user.role) && isTeacher

  // Data basi (> 5 menit)? Perbarui di latar belakang tanpa menahan halaman
  const refreshing = await maybeAutoSync(
    { id, syncedAt: course.syncedAt, syncError: course.syncError },
    isTeacher ? user.id : undefined
  )

  const visible = TABS.filter((t) => t.key !== 'rekap' || canRekap)
  const active: TabKey = visible.some((t) => t.key === tab) ? (tab as TabKey) : 'modul'

  const modules = active === 'modul' ? await safe(() => getCachedMaterials(id)) : null
  const tasks =
    active === 'tugas'
      ? await safe(() => getCachedTasks(id, { googleId: user.googleId, aggregate: canRekap }))
      : null
  const people = active === 'peserta' ? await safe(() => getCachedRoster(id)) : null
  const rekap = active === 'rekap' ? await safe(() => getRekap(id)) : null

  const SubjectIcon = iconForSubject(course.name)
  const syncedLabel = course.syncedAt ? formatWaktu(course.syncedAt) : null

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <Breadcrumb
        items={[
          { label: 'Beranda', href: '/' },
          { label: program.name, href: `/jenjang/${slug}/kelas` },
          { label: course.name },
        ]}
      />

      <section className={`relative overflow-hidden rounded-3xl p-6 text-white sm:p-8 ${program.theme.solid}`}>
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-10 select-none text-[12rem] font-extrabold leading-none text-white/10"
        >
          {slug.slice(-1).toUpperCase()}
        </span>
        <div className="relative flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
            <SubjectIcon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/85">
              {program.name}, {program.level.toLowerCase()}
            </p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {course.name}
            </h1>
            {course.section && (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/90">
                <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                {course.section}
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          {isTeacher ? (
            <SyncButton courseId={id} syncedLabel={syncedLabel} />
          ) : (
            syncedLabel && (
              <p className="mt-4 text-xs text-white/80">Data diperbarui {syncedLabel} WIB</p>
            )
          )}
        </div>
      </section>

      <AutoRefresh active={refreshing} />

      {isTeacher && course.syncError && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Sinkronisasi otomatis terakhir gagal ({SYNC_ERROR_TEXT[course.syncError] ?? 'terjadi kesalahan'}).
          Tekan Sinkronkan, dan login ulang jika sesi Anda berakhir.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <ClassroomNav
          basePath={`/jenjang/${slug}/mapel/${id}`}
          active={active}
          theme={program.theme}
          showRekap={canRekap}
        />
        <div className="min-w-0 flex-1">
          {modules &&
            (modules.error ? (
              <Notice kind={modules.error} />
            ) : (
              <ModuleSection modules={modules.data!} manage={manage} theme={program.theme} courseId={id} />
            ))}
          {tasks &&
            (tasks.error ? (
              <Notice kind={tasks.error} />
            ) : (
              <TaskSection
                tasks={tasks.data!}
                manage={manage}
                isStudent={isStudent}
                theme={program.theme}
                courseId={id}
              />
            ))}
          {people &&
            (people.error ? (
              <Notice kind={people.error} />
            ) : (
              <ParticipantSection participants={people.data!} theme={program.theme} />
            ))}
          {rekap &&
            (rekap.error ? (
              <Notice kind={rekap.error} />
            ) : (
              <RekapSection data={rekap.data!} courseId={id} canEdit={isTeacher} theme={program.theme} />
            ))}
        </div>
      </div>
    </main>
  )
}
