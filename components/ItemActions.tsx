'use client'
import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, ExternalLink, Loader2, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { removeItem, updateItem } from '@/app/manage-actions'
import type { ActionState } from '@/app/classroom-actions'
import type { ProgramTheme } from '@/lib/programs'
import { Sheet, Submit, field } from './CreateItemButton'

interface Props {
  kind: 'materi' | 'tugas'
  courseId: string
  itemId: string
  title: string
  description: string
  points?: number
  dueLocal?: string // "YYYY-MM-DDTHH:mm" dalam WIB
  classroomUrl: string
  theme: ProgramTheme
}

function Notice({ state }: { state: ActionState }) {
  if (!state) return null
  return (
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
      <span>{state.message}</span>
    </p>
  )
}

function ClassroomLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-1.5 text-sm text-sage-500 hover:text-sage-800"
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      Buka di Classroom
    </a>
  )
}

function useAutoClose(state: ActionState, onDone: () => void) {
  const ref = useRef(onDone)
  ref.current = onDone
  useEffect(() => {
    if (!state?.ok) return
    const t = setTimeout(() => ref.current(), 1000)
    return () => clearTimeout(t)
  }, [state])
}

function EditForm({ p, onDone }: { p: Props; onDone: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateItem, null)
  useAutoClose(state, onDone)
  const v = state?.values
  const isTask = p.kind === 'tugas'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="kind" value={p.kind} />
      <input type="hidden" name="courseId" value={p.courseId} />
      <input type="hidden" name="itemId" value={p.itemId} />
      <input type="hidden" name="dueOriginal" value={p.dueLocal ?? ''} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">Judul</span>
        <input name="title" required maxLength={200} defaultValue={v?.title ?? p.title} className={field} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">
          {isTask ? 'Petunjuk' : 'Deskripsi'}
        </span>
        <textarea name="description" rows={4} defaultValue={v?.description ?? p.description} className={field} />
      </label>

      {isTask && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-sage-700">Poin</span>
            <input
              name="points"
              type="number"
              min={0}
              max={1000}
              step="any"
              defaultValue={v?.points ?? (p.points ? String(p.points) : '')}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-sage-700">Tenggat (WIB)</span>
            <input name="due" type="datetime-local" defaultValue={v?.due ?? p.dueLocal ?? ''} className={field} />
          </label>
        </div>
      )}

      <p className="text-xs text-sage-500">
        Lampiran tidak bisa diubah dari web. Untuk mengganti lampiran, hapus lalu buat ulang, atau ubah di Classroom.
      </p>

      <Notice state={state} />
      <Submit label="Simpan Perubahan" theme={p.theme} />
      <ClassroomLink url={p.classroomUrl} />
    </form>
  )
}

function DangerSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? 'Menghapus…' : 'Hapus Permanen'}
    </button>
  )
}

function DeleteForm({ p, onDone }: { p: Props; onDone: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(removeItem, null)
  useAutoClose(state, onDone)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="kind" value={p.kind} />
      <input type="hidden" name="courseId" value={p.courseId} />
      <input type="hidden" name="itemId" value={p.itemId} />

      <p className="text-sm text-sage-700">
        Hapus <strong>{p.title}</strong>?{' '}
        {p.kind === 'tugas'
          ? 'Seluruh pengumpulan dan nilai siswa untuk tugas ini ikut terhapus dan tidak bisa dipulihkan dari web.'
          : 'Materi ini akan hilang dari Classroom dan dari web.'}{' '}
        File lampiran di Google Drive tidak ikut terhapus.
      </p>

      <label className="flex items-start gap-2 text-sm text-sage-600">
        <input name="confirm" type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-sage-300" />
        <span>Saya mengerti dan ingin menghapusnya.</span>
      </label>

      <Notice state={state} />
      <DangerSubmit />
      <ClassroomLink url={p.classroomUrl} />
    </form>
  )
}

export default function ItemActions(props: Props) {
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null)
  const close = useCallback(() => setMode(null), [])

  const btn =
    'rounded-lg p-2 text-sage-400 transition hover:bg-sage-100 hover:text-sage-700 active:scale-90'

  return (
    <div className="flex shrink-0 items-center">
      <button type="button" onClick={() => setMode('edit')} aria-label={`Ubah ${props.title}`} className={btn}>
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setMode('delete')}
        aria-label={`Hapus ${props.title}`}
        className={`${btn} hover:!bg-red-50 hover:!text-red-600`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {mode === 'edit' && (
        <Sheet title={props.kind === 'tugas' ? 'Ubah Tugas' : 'Ubah Materi'} onClose={close}>
          <EditForm p={props} onDone={close} />
        </Sheet>
      )}
      {mode === 'delete' && (
        <Sheet title={props.kind === 'tugas' ? 'Hapus Tugas' : 'Hapus Materi'} onClose={close}>
          <DeleteForm p={props} onDone={close} />
        </Sheet>
      )}
    </div>
  )
}
