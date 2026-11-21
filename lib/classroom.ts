import 'server-only'
import { cache } from 'react'
import { getGoogleAccessToken } from '@/lib/google-token'
import type { Module, Participant, Task } from '@/lib/types'

const BASE = 'https://classroom.googleapis.com/v1'

export class ReauthRequiredError extends Error {
  constructor() {
    super('REAUTH_REQUIRED')
  }
}

export class PermissionError extends Error {
  constructor() {
    super('PERMISSION_DENIED')
  }
}

export interface Course {
  id: string
  name: string
  section?: string
  descriptionHeading?: string
  room?: string
  courseState: string
  alternateLink: string
  role?: 'student' | 'teacher'
}

export interface CourseWork {
  id: string
  courseId: string
  title: string
  description?: string
  state: string
  alternateLink: string
  creationTime: string
  updateTime: string
  maxPoints?: number
  workType: string
  dueDate?: { year: number; month: number; day: number }
  dueTime?: { hours?: number; minutes?: number }
  submissionState?: string
}

export async function classroomList<T>(
  userId: string,
  path: string,
  key: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  let token: string
  try {
    token = await getGoogleAccessToken(userId)
  } catch (e) {
    if ((e as Error).message === 'REAUTH_REQUIRED') throw new ReauthRequiredError()
    throw e
  }

  const items: T[] = []
  let pageToken: string | undefined

  do {
    const qs = new URLSearchParams(params)
    if (pageToken) qs.set('pageToken', pageToken)

    const res = await fetch(`${BASE}${path}?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (res.status === 401) throw new ReauthRequiredError()
    if (res.status === 403) throw new PermissionError()
    if (!res.ok) throw new Error(`Classroom API ${res.status}: ${await res.text()}`)

    const json = await res.json()
    items.push(...((json[key] as T[]) ?? []))
    pageToken = json.nextPageToken
  } while (pageToken)

  return items
}

/** Kelas aktif yang diikuti (siswa) dan/atau diampu (pengajar) */
export const getCourses = cache(async (userId: string): Promise<Course[]> => {
  const [asStudent, asTeacher] = await Promise.all([
    classroomList<Course>(userId, '/courses', 'courses', {
      courseStates: 'ACTIVE',
      studentId: 'me',
    }),
    classroomList<Course>(userId, '/courses', 'courses', {
      courseStates: 'ACTIVE',
      teacherId: 'me',
    }),
  ])

  const map = new Map<string, Course>()
  asStudent.forEach((c) => map.set(c.id, { ...c, role: 'student' }))
  asTeacher.forEach((c) => map.set(c.id, { ...c, role: 'teacher' }))
  return [...map.values()]
})

export const toIso = (
  d?: { year: number; month: number; day: number },
  t?: { hours?: number; minutes?: number }
) => {
  if (!d) return null
  // dueTime dari Classroom berformat UTC. Tanpa jam, anggap tenggat 23:59 WIB
  // (UTC+7) agar tugas tidak langsung dianggap terlambat di pagi hari.
  const ms = t
    ? Date.UTC(d.year, d.month - 1, d.day, t.hours ?? 0, t.minutes ?? 0)
    : Date.UTC(d.year, d.month - 1, d.day, 16, 59)
  return new Date(ms).toISOString()
}

/** Tugas + status. Siswa: status milik sendiri. Pengajar: rekap seluruh siswa. */
export async function getCourseWork(
  userId: string,
  courseId: string,
  opts: { asTeacher?: boolean } = {}
): Promise<Task[]> {
  const work = await classroomList<CourseWork>(
    userId,
    `/courses/${courseId}/courseWork`,
    'courseWork',
    { courseWorkStates: 'PUBLISHED' }
  )

  const own = new Map<string, string>()
  const stats = new Map<string, { submitted: number; total: number }>()

  try {
    const subs = await classroomList<{ courseWorkId: string; state: string }>(
      userId,
      `/courses/${courseId}/courseWork/-/studentSubmissions`,
      'studentSubmissions',
      opts.asTeacher ? {} : { userId: 'me' }
    )
    for (const s of subs) {
      if (opts.asTeacher) {
        const cur = stats.get(s.courseWorkId) ?? { submitted: 0, total: 0 }
        cur.total++
        if (s.state === 'TURNED_IN' || s.state === 'RETURNED') cur.submitted++
        stats.set(s.courseWorkId, cur)
      } else {
        own.set(s.courseWorkId, s.state)
      }
    }
  } catch (e) {
    if (e instanceof ReauthRequiredError) throw e
    // izin rekap belum ada: tampilkan tugas tanpa status
  }

  return work.map((w) => ({
    id: w.id,
    title: w.title,
    description: w.description ?? '',
    dueDate: toIso(w.dueDate, w.dueTime),
    points: w.maxPoints ?? 0,
    submissionState: (own.get(w.id) ?? 'NEW') as Task['submissionState'],
    submitted: stats.get(w.id)?.submitted ?? 0,
    total: stats.get(w.id)?.total ?? 0,
    url: w.alternateLink,
    canSubmit: w.workType === 'ASSIGNMENT',
    grade: null,
    feedback: null,
  }))
}

interface RawMaterial {
  id: string
  title: string
  description?: string
  updateTime: string
  alternateLink: string
  materials?: {
    driveFile?: { driveFile?: { title?: string } }
    youTubeVideo?: unknown
    link?: unknown
  }[]
}

function materialType(m: RawMaterial): Module['type'] {
  const first = m.materials?.[0]
  if (first?.youTubeVideo) return 'Video'
  if (first?.link) return 'Tautan'
  const name = first?.driveFile?.driveFile?.title?.toLowerCase() ?? ''
  if (name.endsWith('.pdf')) return 'PDF'
  if (/\.(pptx?|key)$/.test(name)) return 'Slide'
  return 'File'
}

/** Tab "Materi" di Classroom (butuh scope courseworkmaterials.readonly) */
export async function getCourseMaterials(userId: string, courseId: string): Promise<Module[]> {
  const raw = await classroomList<RawMaterial>(
    userId,
    `/courses/${courseId}/courseWorkMaterials`,
    'courseWorkMaterial',
    { courseWorkMaterialStates: 'PUBLISHED' }
  )
  return raw.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? '',
    type: materialType(m),
    date: m.updateTime,
    url: m.alternateLink,
  }))
}

/** Daftar pengajar dan siswa (butuh scope rosters.readonly) */
export async function getRoster(userId: string, courseId: string): Promise<Participant[]> {
  type Raw = { userId: string; profile?: { name?: { fullName?: string } } }
  const [teachers, students] = await Promise.all([
    classroomList<Raw>(userId, `/courses/${courseId}/teachers`, 'teachers'),
    classroomList<Raw>(userId, `/courses/${courseId}/students`, 'students'),
  ])
  const map = (list: Raw[], role: Participant['role']): Participant[] =>
    list.map((p) => ({
      id: p.userId,
      name: p.profile?.name?.fullName ?? 'Tanpa nama',
      role,
    }))
  return [...map(teachers, 'tutor'), ...map(students, 'siswa')]
}

/** ID pengguna di Classroom (dipakai sebagai kunci siswa/guru di database) */
export async function getMyClassroomId(userId: string): Promise<string> {
  const accessToken = await getGoogleAccessToken(userId)
  const res = await fetch(`${BASE}/userProfiles/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Classroom API ${res.status}`)
  return (await res.json()).id as string
}
