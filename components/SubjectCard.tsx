import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Subject } from '@/lib/types'
import type { ProgramTheme } from '@/lib/programs'

export default function SubjectCard({
  programSlug,
  subject,
  theme,
}: {
  programSlug: string
  subject: Subject
  theme: ProgramTheme
}) {
  const Icon = subject.icon
  return (
    <Link
      href={`/jenjang/${programSlug}/mapel/${subject.id}`}
      className={`group flex items-center gap-4 rounded-2xl border bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] motion-reduce:transform-none sm:p-5 ${theme.border} ${theme.hoverBorder}`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${theme.iconBg} ${theme.text}`}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-bark">{subject.name}</span>
        {subject.subtitle && (
          <span className="mt-0.5 block truncate text-sm text-sage-500">{subject.subtitle}</span>
        )}
        {subject.role === 'teacher' && (
          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${theme.iconBg} ${theme.text}`}>
            Anda pengajar
          </span>
        )}
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-sage-300 transition group-hover:translate-x-1 group-hover:text-sage-500 motion-reduce:transform-none"
        aria-hidden
      />
    </Link>
  )
}
