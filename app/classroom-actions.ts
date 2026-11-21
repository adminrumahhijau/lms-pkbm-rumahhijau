'use server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { PermissionError, ReauthRequiredError } from '@/lib/classroom'
import { parseAttachment } from '@/lib/attachments'
import { parseDue } from '@/lib/due'
import { requireTeacher } from '@/lib/guard'
import { syncCourse } from '@/lib/sync'
import { createCourseWork, createMaterial, uploadToDrive } from '@/lib/classroom-write'

export type ActionState = {
  ok: boolean
  message: string
  values?: Record<string, string>
} | null

const textValues = (fd: FormData) =>
  Object.fromEntries(
    ['title', 'description', 'linkUrl', 'points', 'due'].map((k) => [k, String(fd.get(k) ?? '')])
  )

const fail = (fd: FormData, message: string): ActionState => ({
  ok: false,
  message,
  values: textValues(fd),
})

function toMessage(fd: FormData, e: unknown): ActionState {
  if (e instanceof ReauthRequiredError) {
    return fail(fd, 'Sesi Google berakhir. Silakan login ulang.')
  }
  if (e instanceof PermissionError) {
    return fail(
      fd,
      'Izin belum lengkap atau Anda bukan pengajar kelas ini. Login ulang lewat tombol "Login sebagai Tutor / Admin".'
    )
  }
  console.error(e)
  return fail(fd, 'Gagal menyimpan ke Google Classroom. Coba lagi sebentar lagi.')
}

function parseCommon(fd: FormData) {
  const title = String(fd.get('title') ?? '').trim()
  const description = String(fd.get('description') ?? '').trim()

  if (!title) return { error: 'Judul wajib diisi.' }
  if (title.length > 200) return { error: 'Judul maksimal 200 karakter.' }
  if (description.length > 5000) return { error: 'Deskripsi maksimal 5.000 karakter.' }

  const att = parseAttachment(fd)
  if ('error' in att) return att
  return { title, description, ...att }
}

export async function addMaterial(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser() // di luar try agar redirect tidak tertelan
  const courseId = String(fd.get('courseId') ?? '')
  try {
    const denied = await requireTeacher(user.id, user.role, courseId)
    if (denied) return fail(fd, denied)

    const p = parseCommon(fd)
    if ('error' in p) return fail(fd, p.error)

    const driveFileId = p.upload ? await uploadToDrive(user.id, p.upload) : undefined
    await createMaterial(user.id, courseId, {
      title: p.title,
      description: p.description || undefined,
      linkUrl: p.linkUrl || undefined,
      driveFileId,
    })

    await syncCourse(courseId, user.id, 'items').catch(console.error)
    revalidatePath('/jenjang/[program]/mapel/[id]', 'page')
    return { ok: true, message: 'Materi berhasil ditambahkan ke Google Classroom.' }
  } catch (e) {
    return toMessage(fd, e)
  }
}

export async function addTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  const courseId = String(fd.get('courseId') ?? '')
  try {
    const denied = await requireTeacher(user.id, user.role, courseId)
    if (denied) return fail(fd, denied)

    const p = parseCommon(fd)
    if ('error' in p) return fail(fd, p.error)

    const pointsRaw = String(fd.get('points') ?? '').trim()
    let maxPoints: number | undefined
    if (pointsRaw !== '') {
      maxPoints = Number(pointsRaw)
      if (!Number.isFinite(maxPoints) || maxPoints < 0 || maxPoints > 1000) {
        return fail(fd, 'Poin harus berupa angka 0 sampai 1000.')
      }
    }

    const d = parseDue(String(fd.get('due') ?? ''))
    if ('error' in d) return fail(fd, d.error)

    const driveFileId = p.upload ? await uploadToDrive(user.id, p.upload) : undefined
    await createCourseWork(user.id, courseId, {
      title: p.title,
      description: p.description || undefined,
      linkUrl: p.linkUrl || undefined,
      driveFileId,
      maxPoints,
      due: d.due,
    })

    await syncCourse(courseId, user.id, 'items').catch(console.error)
    revalidatePath('/jenjang/[program]/mapel/[id]', 'page')
    return { ok: true, message: 'Tugas berhasil dibuat di Google Classroom.' }
  } catch (e) {
    return toMessage(fd, e)
  }
}
