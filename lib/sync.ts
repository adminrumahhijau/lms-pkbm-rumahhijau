import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGoogleAccessToken } from '@/lib/google-token'
import {
  classroomList, getCourseMaterials, getCourses, getRoster, toIso, type CourseWork,
} from '@/lib/classroom'

type Admin = ReturnType<typeof createAdminClient>

interface RawSubmission {
  courseWorkId: string
  userId: string
  state: string
  assignedGrade?: number
  late?: boolean
  updateTime?: string
}

async function upsertAll(admin: Admin, table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await admin.from(table).upsert(rows.slice(i, i + 500), { onConflict })
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

/** Hapus baris yang tidak tersentuh sinkronisasi ini (sudah tidak ada di Classroom) */
async function dropStale(admin: Admin, table: string, courseId: string, runTs: string) {
  const { error } = await admin.from(table).delete().eq('course_id', courseId).lt('synced_at', runTs)
  if (error) throw new Error(`${table}: ${error.message}`)
}

/**
 * Sinkronkan satu kelas memakai token seorang guru kelas itu.
 * scope 'items' = materi + tugas saja (ringan, dipakai setelah guru menulis).
 */
export async function syncCourse(courseId: string, userId: string, scope: 'all' | 'items' = 'all') {
  const admin = createAdminClient()
  const runTs = new Date().toISOString()
  const summary = { assignments: 0, materials: 0, members: 0, submissions: 0 }

  try {
    await getGoogleAccessToken(userId) // segarkan token sekali sebelum request paralel
    const course = (await getCourses(userId)).find((c) => c.id === courseId)
    if (!course || course.role !== 'teacher') throw new Error('NOT_TEACHER')

    const [work, materials] = await Promise.all([
      classroomList<CourseWork>(userId, `/courses/${courseId}/courseWork`, 'courseWork', {
        courseWorkStates: 'PUBLISHED',
      }),
      getCourseMaterials(userId, courseId),
    ])

    const assignments = work.map((w) => ({
      course_id: courseId,
      id: w.id,
      title: w.title,
      description: w.description ?? '',
      due_at: toIso(w.dueDate, w.dueTime),
      max_points: w.maxPoints ?? null,
      can_submit: w.workType === 'ASSIGNMENT',
      url: w.alternateLink,
      created_at: w.creationTime,
      synced_at: runTs,
    }))
    await upsertAll(admin, 'assignments', assignments, 'course_id,id')
    await dropStale(admin, 'assignments', courseId, runTs) // juga menghapus pengumpulan/komentar tugas itu

    await upsertAll(
      admin,
      'materials',
      materials.map((m) => ({
        course_id: courseId,
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        url: m.url,
        updated_at: m.date,
        synced_at: runTs,
      })),
      'course_id,id'
    )
    await dropStale(admin, 'materials', courseId, runTs)
    summary.assignments = assignments.length
    summary.materials = materials.length

    if (scope === 'all') {
      const [roster, allSubs] = await Promise.all([
        getRoster(userId, courseId),
        classroomList<RawSubmission>(
          userId,
          `/courses/${courseId}/courseWork/-/studentSubmissions`,
          'studentSubmissions'
        ),
      ])

      const members = roster.map((p) => ({
        course_id: courseId,
        google_id: p.id,
        role: p.role === 'tutor' ? 'teacher' : 'student',
        full_name: p.name,
        synced_at: runTs,
      }))
      await upsertAll(admin, 'course_members', members, 'course_id,google_id,role')
      await dropStale(admin, 'course_members', courseId, runTs)

      const workIds = new Set(work.map((w) => w.id))
      const subs = allSubs
        .filter((s) => workIds.has(s.courseWorkId)) // abaikan tugas draf
        .map((s) => ({
          course_id: courseId,
          assignment_id: s.courseWorkId,
          google_id: s.userId,
          state: s.state,
          assigned_grade: s.assignedGrade ?? null,
          late: !!s.late,
          updated_at: s.updateTime ?? null,
          synced_at: runTs,
        }))
      await upsertAll(admin, 'submissions', subs, 'course_id,assignment_id,google_id')
      await dropStale(admin, 'submissions', courseId, runTs)
      summary.members = members.length
      summary.submissions = subs.length

      await admin
        .from('course_programs')
        .update({
          name: course.name,
          section: course.section ?? null,
          description_heading: course.descriptionHeading ?? null,
          synced_at: runTs,
          synced_by: userId,
          sync_error: null,
        })
        .eq('course_id', courseId)
    }

    return summary
  } catch (e) {
    await admin
      .from('course_programs')
      .update({ sync_error: (e as Error).message.slice(0, 300) })
      .eq('course_id', courseId)
    throw e
  }
}

/** Cadangan untuk siswa yang baru bergabung: catat keanggotaannya dari token siswa itu sendiri */
export async function syncMyMemberships(userId: string, googleId: string, fullName: string) {
  const admin = createAdminClient()
  const courses = await getCourses(userId)
  if (!courses.length) return

  const { data: mapped } = await admin
    .from('course_programs')
    .select('course_id')
    .in('course_id', courses.map((c) => c.id))
  const mappedIds = new Set((mapped ?? []).map((r) => r.course_id as string))

  const rows = courses
    .filter((c) => mappedIds.has(c.id) && c.role)
    .map((c) => ({ course_id: c.id, google_id: googleId, role: c.role, full_name: fullName }))

  if (rows.length) {
    await admin
      .from('course_members')
      .upsert(rows, { onConflict: 'course_id,google_id,role', ignoreDuplicates: true })
  }
}
