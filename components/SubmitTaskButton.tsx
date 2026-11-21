'use client'
import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, ExternalLink, TriangleAlert, Upload } from 'lucide-react'
import { submitTask } from '@/app/submission-actions'
import type { ActionState } from '@/app/classroom-actions'
import type { ProgramTheme } from '@/lib/programs'
import { Sheet, Submit, field } from './CreateItemButton'

function SubmitForm({
  courseId, courseWorkId, classroomUrl, theme, onDone,
}: {
  courseId: string
  courseWorkId: string
  classroomUrl: string
  theme: ProgramTheme
  onDone: () => void
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(submitTask, null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (!state?.ok) return
    const t = setTimeout(() => doneRef.current(), 1400)
    return () => clearTimeout(t)
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="courseWorkId" value={courseWorkId} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">
          File hasil pekerjaan <span className="font-normal text-sage-400">(maks. 4 MB)</span>
        </span>
        <input
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
          className="block w-full text-sm text-sage-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sage-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-700 hover:file:bg-sage-200"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">
          atau tautan <span className="font-normal text-sage-400">(Google Drive, dll.)</span>
        </span>
        <input
          name="linkUrl"
          type="url"
          inputMode="url"
          defaultValue={state?.values?.linkUrl}
          placeholder="https://…"
          className={field}
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-sage-600">
        <input name="confirm" type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-sage-300" />
        <span>
          Saya yakin ingin menyerahkan tugas ini. Pembatalan hanya bisa dilakukan lewat Google Classroom.
        </span>
      </label>

      {state && (
        <p
          role="status"
          className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
            state.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <span>
            {state.message}
            {!state.ok && ' Jika ada file, pilih ulang file tersebut.'}
          </span>
        </p>
      )}

      <Submit label="Kumpulkan & Serahkan" theme={theme} />

      <a
        href={classroomUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 text-sm text-sage-500 hover:text-sage-800"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        Kumpulkan langsung di Classroom
      </a>
    </form>
  )
}

export default function SubmitTaskButton({
  courseId, courseWorkId, classroomUrl, taskTitle, theme,
}: {
  courseId: string
  courseWorkId: string
  classroomUrl: string
  taskTitle: string
  theme: ProgramTheme
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition active:scale-95 sm:w-auto ${theme.button}`}
      >
        <Upload className="h-4 w-4" aria-hidden />
        Kumpulkan Tugas
      </button>
      {open && (
        <Sheet title={`Kumpulkan: ${taskTitle}`} onClose={close}>
          <SubmitForm
            courseId={courseId}
            courseWorkId={courseWorkId}
            classroomUrl={classroomUrl}
            theme={theme}
            onDone={close}
          />
        </Sheet>
      )}
    </>
  )
}
