import {
  Award, CalendarDays, ClipboardCheck, ExternalLink, MessageSquareText, Star,
} from 'lucide-react'
import { formatTanggal, sisaWaktu } from '@/lib/data'
import { toWibInput } from '@/lib/due'
import type { Task } from '@/lib/types'
import type { ProgramTheme } from '@/lib/programs'
import ItemActions from './ItemActions'
import StatusBadge, { STATUS_STYLE, deriveStatus } from './StatusBadge'
import SubmitTaskButton from './SubmitTaskButton'

export default function TaskCard({
  task,
  manage,
  isStudent,
  theme,
  courseId,
}: {
  task: Task
  manage: boolean // guru kelas: boleh ubah/hapus
  isStudent: boolean // siswa kelas: boleh mengumpulkan
  theme: ProgramTheme
  courseId: string
}) {
  const status = deriveStatus(task)
  const pct = task.total ? Math.round((task.submitted / task.total) * 100) : 0
  const sisa = task.dueDate && isStudent && status !== 'selesai' ? sisaWaktu(task.dueDate) : null

  return (
    <li className="relative overflow-hidden rounded-2xl border border-sage-200 bg-white p-4 pl-5 transition duration-200 hover:border-sage-300 hover:shadow-md sm:p-5 sm:pl-6">
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1.5 ${isStudent ? STATUS_STYLE[status].bar : 'bg-sage-300'}`}
      />

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-bark">{task.title}</h3>
        {manage ? (
          <ItemActions
            kind="tugas"
            courseId={courseId}
            itemId={task.id}
            title={task.title}
            description={task.description}
            points={task.points}
            dueLocal={toWibInput(task.dueDate)}
            classroomUrl={task.url}
            theme={theme}
          />
        ) : isStudent ? (
          <StatusBadge status={status} />
        ) : null}
      </div>

      {task.description && (
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-sage-700">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-sage-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {task.dueDate ? `Tenggat ${formatTanggal(task.dueDate)}` : 'Tanpa tenggat'}
        </span>
        {sisa && (
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              sisa.late ? 'bg-red-100 text-red-800' : 'bg-sage-100 text-sage-700'
            }`}
          >
            {sisa.label}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5" aria-hidden />
          {task.points > 0 ? `${task.points} poin` : 'Tanpa nilai'}
        </span>
      </div>

      {isStudent && task.grade != null && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">
          <Award className="h-4 w-4" aria-hidden />
          Nilai: {task.grade}
          {task.points > 0 && `/${task.points}`}
        </p>
      )}

      {isStudent && task.feedback && (
        <blockquote className="mt-3 rounded-xl border-l-4 border-sage-300 bg-sage-50 p-3 text-sm text-sage-700">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-sage-500">
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
            Komentar guru
          </span>
          <span className="whitespace-pre-line">{task.feedback}</span>
        </blockquote>
      )}

      {!isStudent ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs text-sage-500">
              <span>Terkumpul</span>
              <span>{task.submitted}/{task.total} siswa</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sage-100">
              <div
                className={`h-full rounded-full ${theme.button.split(' ')[0]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <a
            href={task.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition active:scale-95 ${theme.button}`}
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden />
            Periksa
          </a>
        </div>
      ) : status !== 'selesai' ? (
        task.canSubmit ? (
          <SubmitTaskButton
            courseId={courseId}
            courseWorkId={task.id}
            classroomUrl={task.url}
            taskTitle={task.title}
            theme={theme}
          />
        ) : (
          <a
            href={task.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 sm:w-auto ${theme.button}`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Buka di Classroom
          </a>
        )
      ) : null}
    </li>
  )
}
