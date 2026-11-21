'use server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { ReauthRequiredError } from '@/lib/classroom'
import { requireTeacher } from '@/lib/guard'
import { syncCourse } from '@/lib/sync'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionState } from '@/app/classroom-actions'

export async function syncNow(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  const courseId = String(fd.get('courseId') ?? '')
  try {
    const denied = await requireTeacher(user.id, user.role, courseId)
    if (denied) return { ok: false, message: denied }

    const { data } = await createAdminClient()
      .from('course_programs')
      .select('synced_at')
      .eq('course_id', courseId)
      .single()
    if (data?.synced_at && Date.now() - new Date(data.synced_at).getTime() < 60_000) {
      return { ok: false, message: 'Baru saja disinkronkan. Coba lagi sebentar lagi.' }
    }

    const r = await syncCourse(courseId, user.id)
    revalidatePath('/jenjang/[program]/mapel/[id]', 'page')
    return {
      ok: true,
      message: `Selesai: ${r.assignments} tugas, ${r.materials} materi, ${r.members} anggota, ${r.submissions} pengumpulan.`,
    }
  } catch (e) {
    if (e instanceof ReauthRequiredError) {
      return { ok: false, message: 'Sesi Google berakhir. Silakan login ulang.' }
    }
    console.error(e)
    return { ok: false, message: 'Sinkronisasi gagal. Coba lagi sebentar lagi.' }
  }
}
