import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProgram } from '@/lib/programs'
import { loadMyCourses, toSubjects } from '@/lib/cache-data'
import Breadcrumb from '@/components/Breadcrumb'
import SubjectCard from '@/components/SubjectCard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>
}): Promise<Metadata> {
  const { program } = await params
  const p = getProgram(program)
  return { title: p ? `${p.name}, ${p.level}` : 'Mata pelajaran' }
}

export default async function KelasPage({
  params,
}: {
  params: Promise<{ program: string }>
}) {
  const { program: slug } = await params
  const program = getProgram(slug)
  if (!program) notFound()

  const user = await getCurrentUser()
  const courses = await loadMyCourses(user)
  const subjects = toSubjects(courses, slug)
  const letter = slug.slice(-1).toUpperCase()

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <Breadcrumb
        items={[
          { label: 'Beranda', href: '/' },
          { label: program.name },
          { label: 'Daftar mata pelajaran' },
        ]}
      />

      <header className={`relative mb-8 overflow-hidden rounded-3xl p-6 text-white sm:p-8 ${program.theme.solid}`}>
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-10 select-none text-[12rem] font-extrabold leading-none text-white/10"
        >
          {letter}
        </span>
        <div className="relative">
          <p className="text-sm font-medium text-white/85">{program.level}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{program.name}</h1>
          <p className="mt-2 text-white/90">
            {subjects.length > 0
              ? `${subjects.length} mata pelajaran`
              : 'Belum ada mata pelajaran'}
          </p>
        </div>
      </header>

      {subjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <SubjectCard key={s.id} programSlug={slug} subject={s} theme={program.theme} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-sage-300 bg-white p-10 text-center text-sage-600">
          <p className="font-semibold text-bark">Belum ada mata pelajaran di {program.name}.</p>
          <p className="mt-1 text-sm">
            Tutor perlu memetakan kelas Google Classroom ke jenjang ini lewat halaman Beranda.
          </p>
        </div>
      )}
    </main>
  )
}
