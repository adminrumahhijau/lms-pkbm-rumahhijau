import 'server-only'
import { canManage, type Role } from '@/lib/auth'
import { getCourses } from '@/lib/classroom'

export const ID_PATTERN = /^[A-Za-z0-9_-]+$/

/** Mengembalikan pesan penolakan, atau null jika diizinkan */
export async function requireTeacher(
  userId: string,
  role: Role,
  courseId: string
): Promise<string | null> {
  if (!ID_PATTERN.test(courseId)) return 'Kelas tidak valid.'
  if (!canManage(role)) return 'Hanya tutor atau admin yang boleh melakukan ini.'
  const course = (await getCourses(userId)).find((c) => c.id === courseId)
  if (!course || course.role !== 'teacher') return 'Anda bukan pengajar di kelas ini.'
  return null
}
