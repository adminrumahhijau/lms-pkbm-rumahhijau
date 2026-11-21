'use client'
import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { saveFeedback } from '@/app/feedback-actions'
import type { ActionState } from '@/app/classroom-actions'
import type { ProgramTheme } from '@/lib/programs'
import { Sheet, Submit, field } from './CreateItemButton'

interface Props {
  courseId: string
  assignmentId: string
  studentId: string
  studentName: string
  taskTitle: string
  label: string
  tone: string
  comment: string | null
  canEdit: boolean
  theme: ProgramTheme
}

function Form({ p, onDone }: { p: Props; onDone: () => void }) {
  const [state, action] = useActionState<ActionState, FormData>(saveFeedback, null)
  const ref = useRef(onDone)
  ref.current = onDone
  useEffect(() => {
    if (!state?.ok) return
    const t = setTimeout(() => ref.current(), 900)
    return () => clearTimeout(t)
  }, [state])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="courseId" value={p.courseId} />
      <input type="hidden" name="assignmentId" value={p.assignmentId} />
      <input type="hidden" name="studentId" value={p.studentId} />
      <p className="text-sm text-sage-600">
        <strong>{p.studentName}</strong>, tugas {p.taskTitle}
      </p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">Komentar untuk siswa</span>
        <textarea
          name="comment"
          rows={5}
          maxLength={1000}
          autoFocus
          defaultValue={state?.values?.comment ?? p.comment ?? ''}
          className={field}
        />
      </label>
      <p className="text-xs text-sage-500">
        Komentar tampil untuk siswa di web ini, bukan di Google Classroom. Kosongkan lalu simpan untuk menghapus.
      </p>
      {state && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm ${
            state.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {state.message}
        </p>
      )}
      <Submit label="Simpan Komentar" theme={p.theme} />
    </form>
  )
}

export default function FeedbackCell(p: Props) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const body = (
    <>
      {p.label}
      {p.comment && (
        <MessageSquare className="ml-1 inline h-3 w-3 opacity-60" aria-label="Ada komentar" />
      )}
    </>
  )

  if (!p.canEdit) {
    return (
      <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${p.tone}`}>
        {body}
      </span>
    )
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-md px-2 py-1 text-xs font-medium transition hover:ring-2 hover:ring-sage-300 active:scale-95 ${p.tone}`}
      >
        {body}
      </button>
      {open && (
        <Sheet title="Komentar" onClose={close}>
          <Form p={p} onDone={close} />
        </Sheet>
      )}
    </>
  )
}
