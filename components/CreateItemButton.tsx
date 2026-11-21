'use client'
import { useActionState, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, Loader2, Plus, TriangleAlert, X } from 'lucide-react'
import { addMaterial, addTask, type ActionState } from '@/app/classroom-actions'
import type { ProgramTheme } from '@/lib/programs'

export const field =
  'w-full rounded-xl border border-sage-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-200'

/**
 * Dialog bawah-layar di HP / tengah-layar di laptop.
 * Dirender lewat portal ke <body> agar tidak terpengaruh transform/overflow kartu induknya.
 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button aria-label="Tutup" className="sheet-backdrop absolute inset-0 bg-sage-900/50" onClick={onClose} />
      <div className="sheet-panel relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-sage-200 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-bark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-sage-500 transition hover:bg-sage-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

export function Submit({ label, theme }: { label: string; theme: ProgramTheme }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition active:scale-95 disabled:opacity-60 ${theme.button}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? 'Menyimpan…' : label}
    </button>
  )
}

function ItemForm({
  kind, courseId, theme, onDone,
}: {
  kind: 'materi' | 'tugas'
  courseId: string
  theme: ProgramTheme
  onDone: () => void
}) {
  const isTask = kind === 'tugas'
  const [state, formAction] = useActionState<ActionState, FormData>(
    isTask ? addTask : addMaterial,
    null
  )
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (!state?.ok) return
    const t = setTimeout(() => doneRef.current(), 1200)
    return () => clearTimeout(t)
  }, [state])

  const v = state?.values

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">Judul</span>
        <input
          name="title"
          required
          maxLength={200}
          autoFocus
          defaultValue={v?.title}
          placeholder={isTask ? 'Contoh: Jobsheet 3: Jaringan Dasar' : 'Contoh: Slide Pertemuan 4'}
          className={field}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">
          {isTask ? 'Petunjuk' : 'Deskripsi'} <span className="font-normal text-sage-400">(opsional)</span>
        </span>
        <textarea name="description" rows={3} defaultValue={v?.description} className={field} />
      </label>

      {isTask && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-sage-700">Poin</span>
            <input name="points" type="number" min={0} max={1000} step="any" defaultValue={v?.points ?? '100'} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-sage-700">
              Tenggat (WIB) <span className="font-normal text-sage-400">(opsional)</span>
            </span>
            <input name="due" type="datetime-local" defaultValue={v?.due} className={field} />
          </label>
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">
          Tautan atau video YouTube <span className="font-normal text-sage-400">(opsional)</span>
        </span>
        <input name="linkUrl" type="url" inputMode="url" defaultValue={v?.linkUrl} placeholder="https://…" className={field} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-sage-700">
          Lampiran file <span className="font-normal text-sage-400">(opsional, maks. 4 MB)</span>
        </span>
        <input
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
          className="block w-full text-sm text-sage-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sage-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-700 hover:file:bg-sage-200"
        />
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

      <Submit label={isTask ? 'Buat Tugas' : 'Tambahkan Materi'} theme={theme} />
    </form>
  )
}

export default function CreateItemButton({
  kind, courseId, theme,
}: {
  kind: 'materi' | 'tugas'
  courseId: string
  theme: ProgramTheme
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const label = kind === 'tugas' ? 'Buat Tugas' : 'Tambah Materi'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white transition active:scale-95 ${theme.button}`}
      >
        <Plus className="h-4 w-4" aria-hidden />
        {label}
      </button>
      {open && (
        <Sheet title={label} onClose={close}>
          <ItemForm kind={kind} courseId={courseId} theme={theme} onDone={close} />
        </Sheet>
      )}
    </>
  )
}
