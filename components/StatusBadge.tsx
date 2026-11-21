import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { Task } from '@/lib/types'

export type TaskStatus = 'selesai' | 'belum' | 'terlambat'

export function deriveStatus(task: Pick<Task, 'submissionState' | 'dueDate'>): TaskStatus {
  if (task.submissionState === 'TURNED_IN' || task.submissionState === 'RETURNED') return 'selesai'
  if (task.dueDate && new Date(task.dueDate).getTime() < Date.now()) return 'terlambat'
  return 'belum'
}

export const STATUS_STYLE = {
  selesai: {
    label: 'Selesai',
    icon: CheckCircle2,
    badge: 'bg-green-100 text-green-800 ring-green-600/20',
    bar: 'bg-green-500',
  },
  belum: {
    label: 'Belum dikumpulkan',
    icon: Clock,
    badge: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    bar: 'bg-yellow-400',
  },
  terlambat: {
    label: 'Terlambat',
    icon: AlertCircle,
    badge: 'bg-red-100 text-red-800 ring-red-600/20',
    bar: 'bg-red-500',
  },
} as const

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLE[status]
  const Icon = s.icon
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.badge}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {s.label}
    </span>
  )
}
