import Link from 'next/link'
import { CalendarClock, ChevronRight } from 'lucide-react'
import type { UpcomingTask } from '@/lib/cache-data'
import { sisaWaktu } from '@/lib/data'

export default function UpcomingTasks({ tasks }: { tasks: UpcomingTask[] }) {
  if (tasks.length === 0) return null

  return (
    <section aria-labelledby="tugas-menunggu" className="mb-10">
      <h2 id="tugas-menunggu" className="mb-3 flex items-center gap-2 text-lg font-bold text-bark">
        <CalendarClock className="h-5 w-5 text-leaf" aria-hidden />
        Tugas yang perlu dikerjakan
      </h2>
      <ul className="divide-y divide-sage-100 overflow-hidden rounded-2xl border border-sage-200 bg-white">
        {tasks.map((t) => {
          const sisa = sisaWaktu(t.dueAt)
          return (
            <li key={`${t.courseId}-${t.id}`}>
              <Link
                href={`/jenjang/${t.programSlug}/mapel/${t.courseId}?tab=tugas`}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-sage-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-bark">{t.title}</span>
                  <span className="block truncate text-sm text-sage-500">{t.courseName}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    sisa.late ? 'bg-red-100 text-red-800' : 'bg-sage-100 text-sage-700'
                  }`}
                >
                  {sisa.label}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-sage-300" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
