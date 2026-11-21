'use server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { ID_PATTERN, requireTeacher } from '@/lib/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionState } from '@/app/classroom-actions'

export async function saveFeedback(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  const courseId = String(fd.get('courseId') ?? '')
  const assignmentId = String(fd.get('assignmentId') ?? '')
  const studentId = String(fd.get('studentId') ?? '')
  const comment = String(fd.get('comment') ?? '').trim()
  const fail = (message: string): ActionState => ({ ok: false, message, values: { comment } })

  if (!ID_PATTERN.test(assignmentId) || !ID_PATTERN.test(studentId)) return fail('Data tidak valid.')
  if (comment.length > 1000) return fail('Komentar maksimal 1.000 karakter.')

  try {
    const denied = await requireTeacher(user.id, user.role, courseId)
    if (denied) return fail(denied)

    const admin = createAdminClient()
    const { data: member } = await admin
      .from('course_members')
      .select('google_id')
      .eq('course_id', courseId)
      .eq('google_id', studentId)
      .eq('role', 'student')
      .maybeSingle()
    if (!member) return fail('Siswa tidak ditemukan di kelas ini.')

    const key = { course_id: courseId, assignment_id: assignmentId, google_id: studentId }
    if (!comment) {
      await admin.from('feedback').delete().match(key)
      revalidatePath('/jenjang/[program]/mapel/[id]', 'page')
      return { ok: true, message: 'Komentar dihapus.' }
    }

    const { error } = await admin
      .from('feedback')
      .upsert(
        { ...key, comment, author: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'course_id,assignment_id,google_id' }
      )
    if (error) throw new Error(error.message)

    revalidatePath('/jenjang/[program]/mapel/[id]', 'page')
    return { ok: true, message: 'Komentar disimpan.' }
  } catch (e) {
    console.error(e)
    return fail('Gagal menyimpan komentar.')
  }
}
