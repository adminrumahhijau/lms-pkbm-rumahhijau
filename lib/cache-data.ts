import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReauthRequiredError } from '@/lib/classroom'
import { iconForSubject } from '@/lib/data'
import { syncMyMemberships } from '@/lib/sync'
import type { Role } from '@/lib/auth'
import type { Module, Participant, Subject, Task } from '@/lib/types'

export interface CachedCourse {
  id: string
  name: string
  section?: string
  programSlug: string
  role?: 'teacher' | 'student'
  syncedAt: string | null
  syncError: string | null
}

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/** PostgREST membatasi 1000 baris per permintaan, jadi baca per halaman */
async function selectAll<T>(build: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return out
}

export async function getCachedCourses(googleId: string | null): Promise<CachedCourse[]> {
  const supabase = await createClient()
  const { data: courses, error } = await supabase
    .from('course_programs')
    .select('course_id, program_slug, name, section, synced_at, sync_error')
  if (error) throw new Error(error.message)

  const roles = new Map<string, 'teacher' | 'student'>()
  if (googleId) {
    const { data: mine } = await supabase
      .from('course_members')
      .select('course_id, role')
      .eq('google_id', googleId)
    for (const m of mine ?? []) {
      if (m.role === 'teacher' || !roles.has(m.course_id)) roles.set(m.course_id, m.role)
    }
  }

  return (courses ?? []).map((c) => ({
    id: c.course_id,
    name: c.name ?? `Kelas ${c.course_id}`,
    section: c.section ?? undefined,
    programSlug: c.program_slug,
    role: roles.get(c.course_id),
    syncedAt: c.synced_at,
    syncError: c.sync_error,
  }))
}

/** Daftar kelas pengguna; untuk siswa baru yang belum tercatat, ambil dari Classroom sekali */
export async function loadMyCourses(user: {
  id: string
  name: string
  role: Role
  googleId: string | null
}): Promise<CachedCourse[]> {
  let courses = await getCachedCourses(user.googleId)
  if (courses.length === 0 && user.googleId && user.role === 'siswa') {
    try {
      await syncMyMemberships(user.id, user.googleId, user.name)
      courses = await getCachedCourses(user.googleId)
    } catch (e) {
      if (e instanceof ReauthRequiredError) redirect('/login?error=reauth')
      console.error(e)
    }
  }
  return courses
}

export const toSubjects = (courses: CachedCourse[], slug: string): Subject[] =>
  courses
    .filter((c) => c.programSlug === slug)
    .map((c) => ({
      id: c.id,
      name: c.name,
      subtitle: c.section,
      icon: iconForSubject(c.name),
      role: c.role,
    }))

export async function getCachedMaterials(courseId: string): Promise<Module[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, description, type, url, updated_at')
    .eq('course_id', courseId)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    type: m.type as Module['type'],
    url: m.url,
    date: m.updated_at ?? '',
  }))
}

export async function getCachedRoster(courseId: string): Promise<Participant[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('course_members')
    .select('google_id, role, full_name')
    .eq('course_id', courseId)
    .order('role', { ascending: false }) // teacher dulu
    .order('full_name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    id: p.google_id,
    name: p.full_name || 'Tanpa nama',
    role: p.role === 'teacher' ? 'tutor' : 'siswa',
  }))
}

interface Sub {
  assignment_id: string
  google_id: string
  state: string
  assigned_grade: number | null
}

export async function getCachedTasks(
  courseId: string,
  opts: { googleId: string | null; aggregate: boolean }
): Promise<Task[]> {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('assignments')
    .select('id, title, description, due_at, max_points, can_submit, url')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const subs = await selectAll<Sub>((from, to) => {
    let q = supabase
      .from('submissions')
      .select('assignment_id, google_id, state, assigned_grade')
      .eq('course_id', courseId)
    if (!opts.aggregate) q = q.eq('google_id', opts.googleId ?? '')
    return q.order('assignment_id').order('google_id').range(from, to)
  })

  const stats = new Map<string, { submitted: number; total: number }>()
  const mine = new Map<string, Sub>()
  for (const s of subs) {
    const st = stats.get(s.assignment_id) ?? { submitted: 0, total: 0 }
    st.total++
    if (s.state === 'TURNED_IN' || s.state === 'RETURNED') st.submitted++
    stats.set(s.assignment_id, st)
    if (s.google_id === opts.googleId) mine.set(s.assignment_id, s)
  }

  const comments = new Map<string, string>()
  if (!opts.aggregate && opts.googleId) {
    const { data: fb } = await supabase
      .from('feedback')
      .select('assignment_id, comment')
      .eq('course_id', courseId)
      .eq('google_id', opts.googleId)
    for (const f of fb ?? []) comments.set(f.assignment_id, f.comment)
  }

  return (rows ?? []).map((a) => {
    const my = mine.get(a.id)
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.due_at,
      points: Number(a.max_points ?? 0),
      submissionState: (my?.state ?? 'NEW') as Task['submissionState'],
      submitted: stats.get(a.id)?.submitted ?? 0,
      total: stats.get(a.id)?.total ?? 0,
      url: a.url,
      canSubmit: a.can_submit,
      grade: my?.assigned_grade != null ? Number(my.assigned_grade) : null,
      feedback: comments.get(a.id) ?? null,
    }
  })
}

// ---------- Rekap nilai ----------

export interface RekapCell {
  state: string
  grade: number | null
  comment: string | null
}

export interface Rekap {
  students: { googleId: string; name: string }[]
  assignments: { id: string; title: string; maxPoints: number; dueAt: string | null }[]
  cells: Record<string, RekapCell> // kunci: `${assignmentId}|${googleId}`
  averages: Record<string, number | null> // persen, per siswa
}

export async function getRekap(courseId: string): Promise<Rekap> {
  const supabase = await createClient()

  const [{ data: members }, { data: work }] = await Promise.all([
    supabase
      .from('course_members')
      .select('google_id, full_name')
      .eq('course_id', courseId)
      .eq('role', 'student')
      .order('full_name'),
    supabase
      .from('assignments')
      .select('id, title, max_points, due_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true }),
  ])

  const subs = await selectAll<Sub>((from, to) =>
    supabase
      .from('submissions')
      .select('assignment_id, google_id, state, assigned_grade')
      .eq('course_id', courseId)
      .order('assignment_id')
      .order('google_id')
      .range(from, to)
  )
  const fb = await selectAll<{ assignment_id: string; google_id: string; comment: string }>(
    (from, to) =>
      supabase
        .from('feedback')
        .select('assignment_id, google_id, comment')
        .eq('course_id', courseId)
        .order('assignment_id')
        .order('google_id')
        .range(from, to)
  )

  const cells: Rekap['cells'] = {}
  for (const s of subs) {
    cells[`${s.assignment_id}|${s.google_id}`] = {
      state: s.state,
      grade: s.assigned_grade != null ? Number(s.assigned_grade) : null,
      comment: null,
    }
  }
  for (const f of fb) {
    const key = `${f.assignment_id}|${f.google_id}`
    cells[key] = { ...(cells[key] ?? { state: 'NEW', grade: null }), comment: f.comment }
  }

  const assignments = (work ?? []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    maxPoints: Number(a.max_points ?? 0),
    dueAt: a.due_at as string | null,
  }))
  const students = (members ?? []).map((m) => ({
    googleId: m.google_id as string,
    name: (m.full_name as string) || 'Tanpa nama',
  }))

  const averages: Rekap['averages'] = {}
  for (const st of students) {
    const pct: number[] = []
    for (const a of assignments) {
      const c = cells[`${a.id}|${st.googleId}`]
      if (a.maxPoints > 0 && c?.state === 'RETURNED' && c.grade != null) {
        pct.push((c.grade / a.maxPoints) * 100)
      }
    }
    averages[st.googleId] = pct.length
      ? Math.round(pct.reduce((x, y) => x + y, 0) / pct.length)
      : null
  }

  return { students, assignments, cells, averages }
}

// ---------- Tugas yang perlu dikerjakan (untuk siswa) ----------

export interface UpcomingTask {
  id: string
  courseId: string
  courseName: string
  programSlug: string
  title: string
  dueAt: string
}

/** Tugas belum dikumpulkan di kelas tempat user menjadi siswa: tenggat terdekat dan yang baru lewat (maks. 7 hari) */
export async function getUpcomingTasks(
  googleId: string,
  courses: CachedCourse[]
): Promise<UpcomingTask[]> {
  const mine = new Map<string, CachedCourse>()
  for (const c of courses) if (c.role === 'student') mine.set(c.id, c)
  if (mine.size === 0) return []

  const supabase = await createClient()
  const ids = [...mine.keys()]
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [{ data: work }, { data: subs }] = await Promise.all([
    supabase
      .from('assignments')
      .select('id, course_id, title, due_at')
      .in('course_id', ids)
      .gte('due_at', since)
      .order('due_at', { ascending: true })
      .limit(100),
    supabase
      .from('submissions')
      .select('assignment_id, course_id, state')
      .eq('google_id', googleId)
      .in('course_id', ids),
  ])

  const done = new Set(
    (subs ?? [])
      .filter((s) => s.state === 'TURNED_IN' || s.state === 'RETURNED')
      .map((s) => `${s.course_id}|${s.assignment_id}`)
  )

  return (work ?? [])
    .filter((w) => !done.has(`${w.course_id}|${w.id}`))
    .slice(0, 5)
    .map((w) => {
      const c = mine.get(w.course_id)!
      return {
        id: w.id as string,
        courseId: w.course_id as string,
        courseName: c.name,
        programSlug: c.programSlug,
        title: w.title as string,
        dueAt: w.due_at as string,
      }
    })
}
