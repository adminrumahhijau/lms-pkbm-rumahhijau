import type { ReactNode } from 'react'
import {
  Download, FileText, Link2, Presentation, Video, type LucideIcon,
} from 'lucide-react'
import { formatTanggal, rapikanNama } from '@/lib/data'
import type { Module, Participant, Task } from '@/lib/types'
import type { ProgramTheme } from '@/lib/programs'
import CreateItemButton from './CreateItemButton'
import ItemActions from './ItemActions'
import TaskCard from './TaskCard'

const MODULE_ICON: Record<Module['type'], LucideIcon> = {
  PDF: FileText,
  Video: Video,
  Tautan: Link2,
  Slide: Presentation,
  File: FileText,
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-sage-900">{title}</h2>
      {action}
    </div>
  )
}

export function ModuleSection({
  modules,
  manage,
  theme,
  courseId,
}: {
  modules: Module[]
  manage: boolean
  theme: ProgramTheme
  courseId: string
}) {
  return (
    <section>
      <SectionHeader
        title="Modul / Materi"
        action={manage ? <CreateItemButton kind="materi" courseId={courseId} theme={theme} /> : undefined}
      />
      <ul className="space-y-3">
        {modules.length === 0 && (
          <li className="rounded-xl border border-dashed p-6 text-center text-sage-500">
            Belum ada materi.
          </li>
        )}
        {modules.map((m) => {
          const Icon = MODULE_ICON[m.type]
          return (
            <li key={m.id} className="flex items-stretch gap-2">
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="group flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-sage-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.text}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sage-900">{m.title}</span>
                  <span className="block text-xs text-sage-500">
                    {m.type}
                    {m.date ? `, ${formatTanggal(m.date)}` : ''}
                  </span>
                </span>
                <Download className="h-5 w-5 shrink-0 text-sage-300 transition group-hover:text-sage-600" aria-hidden />
              </a>
              {manage && (
                <ItemActions
                  kind="materi"
                  courseId={courseId}
                  itemId={m.id}
                  title={m.title}
                  description={m.description}
                  classroomUrl={m.url}
                  theme={theme}
                />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function TaskSection({
  tasks,
  manage,
  isStudent,
  theme,
  courseId,
}: {
  tasks: Task[]
  manage: boolean
  isStudent: boolean
  theme: ProgramTheme
  courseId: string
}) {
  const graded = tasks.filter((t) => t.grade != null && t.points > 0)
  const avg = graded.length
    ? Math.round(graded.reduce((s, t) => s + (t.grade! / t.points) * 100, 0) / graded.length)
    : null

  return (
    <section>
      <SectionHeader
        title="Tugas & Jobsheet"
        action={manage ? <CreateItemButton kind="tugas" courseId={courseId} theme={theme} /> : undefined}
      />
      {isStudent && avg !== null && (
        <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Rata-rata nilai Anda: <strong>{avg}%</strong> dari {graded.length} tugas yang sudah dinilai.
        </p>
      )}
      <ul className="space-y-3">
        {tasks.length === 0 && (
          <li className="rounded-xl border border-dashed p-6 text-center text-sage-500">
            Belum ada tugas.
          </li>
        )}
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            manage={manage}
            isStudent={isStudent}
            theme={theme}
            courseId={courseId}
          />
        ))}
      </ul>
    </section>
  )
}

export function ParticipantSection({
  participants,
  theme,
}: {
  participants: Participant[]
  theme: ProgramTheme
}) {
  const groups = [
    { title: 'Tutor', items: participants.filter((p) => p.role === 'tutor') },
    { title: 'Siswa', items: participants.filter((p) => p.role === 'siswa') },
  ]
  return (
    <section className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="mb-3 flex items-center justify-between border-b border-sage-200 pb-2 text-lg font-semibold text-sage-900">
            {g.title}
            <span className="text-sm font-normal text-sage-500">{g.items.length}</span>
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {g.items.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-sage-50"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${theme.iconBg} ${theme.text}`}>
                  {rapikanNama(p.name).replace(/^(Pak|Bu)\s/, '').charAt(0)}
                </span>
                <span className="font-medium text-sage-800">{rapikanNama(p.name)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
