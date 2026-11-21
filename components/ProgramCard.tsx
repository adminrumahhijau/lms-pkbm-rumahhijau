import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Program } from '@/lib/programs'

export default function ProgramCard({
  program,
  subjectCount,
}: {
  program: Program
  subjectCount: number
}) {
  const { theme } = program
  const letter = program.slug.slice(-1).toUpperCase()

  return (
    <Link
      href={`/jenjang/${program.slug}/kelas`}
      className={`group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-2xl border p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] motion-reduce:transform-none ${theme.soft} ${theme.border} ${theme.hoverBorder}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-3 -top-8 select-none text-[9rem] font-extrabold leading-none sm:text-[11rem] ${theme.letter}`}
      >
        {letter}
      </span>

      <div className="relative">
        <p className={`text-sm font-semibold ${theme.text}`}>{program.level}</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-bark">{program.name}</h2>
        <p className="mt-3 max-w-[15rem] text-sm leading-relaxed text-sage-700">
          {program.description}
        </p>
      </div>

      <div className="relative mt-8 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-bark">
          {subjectCount > 0 ? `${subjectCount} mata pelajaran` : 'Belum ada mata pelajaran'}
        </span>
        <span
          aria-hidden
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition group-hover:translate-x-1 motion-reduce:transform-none ${theme.solid}`}
        >
          <ArrowRight className="h-5 w-5" />
        </span>
      </div>
    </Link>
  )
}
