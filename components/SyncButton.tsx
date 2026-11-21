'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { RefreshCw } from 'lucide-react'
import { syncNow } from '@/app/sync-actions'
import type { ActionState } from '@/app/classroom-actions'

function Btn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/30 active:scale-95 disabled:opacity-60"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${pending ? 'animate-spin' : ''}`} aria-hidden />
      {pending ? 'Menyinkronkan…' : 'Sinkronkan'}
    </button>
  )
}

export default function SyncButton({
  courseId,
  syncedLabel,
}: {
  courseId: string
  syncedLabel: string | null
}) {
  const [state, action] = useActionState<ActionState, FormData>(syncNow, null)
  return (
    <form action={action} className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <input type="hidden" name="courseId" value={courseId} />
      <Btn />
      <span className="text-xs text-white/80">
        {syncedLabel ? `Terakhir: ${syncedLabel} WIB` : 'Belum pernah disinkronkan'}
      </span>
      {state && (
        <span role="status" className="w-full text-xs text-white/90">
          {state.message}
        </span>
      )}
    </form>
  )
}
