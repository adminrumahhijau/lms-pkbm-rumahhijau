import 'server-only'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncCourse } from '@/lib/sync'

const STALE_MS = 5 * 60_000 // data dianggap basi setelah 5 menit
const RETRY_MS = 90_000 // jangan memicu ulang sebelum 90 detik (sinkronisasi masih berjalan)
const BACKOFF_MS = 30 * 60_000 // setelah gagal, jeda 30 menit

// Per instance server. Sinkronisasi bersifat idempotent, jadi pemicu ganda hanya boros kuota.
const lastTrigger = new Map<string, number>()

/**
 * Bila data kelas sudah basi, picu sinkronisasi di latar belakang (setelah respons dikirim)
 * memakai token seorang guru kelas itu. Mengembalikan true bila data sedang diperbarui.
 */
export async function maybeAutoSync(
  course: { id: string; syncedAt: string | null; syncError: string | null },
  teacherUserId?: string // bila yang membuka adalah guru kelas, pakai token miliknya
): Promise<boolean> {
  if (course.syncedAt && Date.now() - new Date(course.syncedAt).getTime() < STALE_MS) {
    return false
  }

  const last = lastTrigger.get(course.id)
  const window = course.syncError ? BACKOFF_MS : RETRY_MS
  if (last && Date.now() - last < window) return !course.syncError

  let userId = teacherUserId
  if (!userId) {
    const { data } = await createAdminClient()
      .from('course_programs')
      .select('synced_by')
      .eq('course_id', course.id)
      .single()
    userId = (data?.synced_by as string | null) ?? undefined
  }
  if (!userId) return false

  lastTrigger.set(course.id, Date.now())
  const uid = userId
  after(async () => {
    try {
      await syncCourse(course.id, uid)
    } catch (e) {
      console.error('auto-sync gagal', course.id, (e as Error).message)
    }
  })
  return true
}
