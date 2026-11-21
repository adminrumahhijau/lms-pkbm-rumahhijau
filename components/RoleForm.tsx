'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { setUserRole } from '@/app/admin-actions'
import type { ActionState } from '@/app/classroom-actions'

const OPTIONS = [
  { value: 'siswa', label: 'Siswa' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'admin', label: 'Admin' },
]

function Save() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-leaf active:scale-95 disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      Simpan
    </button>
  )
}

export default function RoleForm({
  userId,
  role,
  name,
  isSelf,
}: {
  userId: string
  role: string
  name: string
  isSelf: boolean
}) {
  const [state, action] = useActionState<ActionState, FormData>(setUserRole, null)

  if (isSelf) {
    return (
      <span className="rounded-full bg-sage-100 px-3 py-1.5 text-sm font-semibold text-sage-700">
        Akun Anda ({role})
      </span>
    )
  }

  return (
    <form action={action} className="flex flex-col items-start gap-1.5 sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`peran-${userId}`}>
          Peran untuk {name}
        </label>
        <select
          id={`peran-${userId}`}
          name="role"
          defaultValue={role}
          className="rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm font-medium text-bark"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Save />
      </div>
      {state && (
        <span
          role="status"
          className={`text-xs font-medium ${state.ok ? 'text-green-700' : 'text-red-700'}`}
        >
          {state.message}
        </span>
      )}
    </form>
  )
}
