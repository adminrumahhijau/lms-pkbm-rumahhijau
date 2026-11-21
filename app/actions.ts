'use server'
import { revalidatePath } from 'next/cache'
import { canManage, getCurrentUser } from '@/lib/auth'
import { getCourses } from '@/lib/classroom'
import { getProgram } from '@/lib/programs'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncCourse } from '@/lib/sync'

export async function assignProgram(formData: FormData): Promise<void> {
  const user = await getCurrentUser()
  if (!canManage(user.role)) throw new Error('Tidak diizinkan')

  const courseId = String(formData.get('courseId') ?? '')
  const program = String(formData.get('program') ?? '')
  if (!/^\d+$/.test(courseId) || !getProgram(program)) throw new Error('Data tidak valid')

  const course = (await getCourses(user.id)).find((c) => c.id === courseId)
  if (!course || course.role !== 'teacher') {
    throw new Error('Anda harus menjadi pengajar di kelas ini')
  }

  const { error } = await createAdminClient()
    .from('course_programs')
    .upsert({ course_id: courseId, program_slug: program, synced_by: user.id })
  if (error) throw new Error(error.message)

  try {
    await syncCourse(courseId, user.id) // sinkronisasi pertama
  } catch (e) {
    console.error(e) // pemetaan tetap tersimpan; cron akan mencoba lagi
  }
  revalidatePath('/', 'layout')
}
