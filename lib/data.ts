import { redirect } from 'next/navigation'
import {
  BookOpen, BookText, Calculator, FlaskConical, Globe, Landmark, Languages, Monitor,
  type LucideIcon,
} from 'lucide-react'
import {
  getCourses, PermissionError, ReauthRequiredError, type Course,
} from '@/lib/classroom'
import type { Subject } from '@/lib/types'

export type { Module, Participant, Subject, Task } from '@/lib/types'

export const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  })

export const formatWaktu = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })

const ICON_RULES: [RegExp, LucideIcon][] = [
  [/komputer|informatika|\btik\b|teknologi/i, Monitor],
  [/matematika|\bmtk\b/i, Calculator],
  [/inggris|english/i, Languages],
  [/indonesia|sastra/i, BookText],
  [/\bipa\b|fisika|kimia|biologi/i, FlaskConical],
  [/\bips\b|geografi|sosiologi|ekonomi/i, Globe],
  [/ppkn|pancasila|sejarah/i, Landmark],
]

export const iconForSubject = (name: string): LucideIcon =>
  ICON_RULES.find(([re]) => re.test(name))?.[1] ?? BookOpen

const toSubject = (c: Course): Subject => ({
  id: c.id,
  name: c.name,
  subtitle: c.section ?? c.descriptionHeading,
  icon: iconForSubject(c.name),
  role: c.role,
})

/** Ambil kelas langsung dari Classroom; kalau token tidak valid, arahkan login ulang */
export async function loadCourses(userId: string): Promise<Course[]> {
  try {
    return await getCourses(userId)
  } catch (e) {
    if (e instanceof ReauthRequiredError) redirect('/login?error=reauth')
    throw e
  }
}

/** Kelas Classroom yang Anda ajar tetapi belum dipetakan ke jenjang */
export const unmappedSubjects = (
  courses: Course[], mapping: Map<string, string>
): Subject[] =>
  courses.filter((c) => c.role === 'teacher' && !mapping.has(c.id)).map(toSubject)

/** Bungkus pemanggilan untuk satu bagian halaman agar error-nya tidak merobohkan seluruh halaman */
export async function safe<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: 'izin' | 'gagal' | null }> {
  try {
    return { data: await fn(), error: null }
  } catch (e) {
    if (e instanceof ReauthRequiredError) redirect('/login?error=reauth')
    if (e instanceof PermissionError) return { data: null, error: 'izin' }
    console.error(e)
    return { data: null, error: 'gagal' }
  }
}

/** Sisa waktu menuju tenggat dalam bahasa sehari-hari */
export function sisaWaktu(iso: string): { label: string; late: boolean } {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms < 0) {
    const hari = Math.floor(-ms / 86_400_000)
    return { label: hari === 0 ? 'Lewat hari ini' : `Terlambat ${hari} hari`, late: true }
  }
  const jam = Math.floor(ms / 3_600_000)
  if (jam < 24) {
    return { label: jam < 1 ? 'Kurang dari 1 jam lagi' : `${jam} jam lagi`, late: false }
  }
  const hari = Math.floor(ms / 86_400_000)
  return { label: hari === 1 ? 'Besok' : `${hari} hari lagi`, late: false }
}

/** Nama dari Google yang SELURUHNYA huruf besar ("REDHO ARI MERATNO") dirapikan menjadi "Redho Ari Meratno" */
export function rapikanNama(nama: string): string {
  const n = nama.trim()
  if (!n || n !== n.toUpperCase() || n === n.toLowerCase()) return n
  return n.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
}
