'use server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { describeError } from '@/lib/action-errors'
import { ID_PATTERN, requireTeacher } from '@/lib/guard'
import { parseDue } from '@/lib/due'
import { syncCourse } from '@/lib/sync'
import { deleteClassroomItem, updateCourseWork, updateMaterial } from '@/lib/classroom-write'
import type { ActionState } from '@/app/classroom-actions'

const PAGE = '/jenjang/[program]/mapel/[id]'

export async function updateItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser() // di luar try agar redirect tidak tertelan
  const kind = String(fd.get('kind') ?? '')
  const courseId = String(fd.get('courseId') ?? '')
  const itemId = String(fd.get('itemId') ?? '')
  const values = Object.fromEntries(
    ['title', 'description', 'points', 'due'].map((k) => [k, String(fd.get(k) ?? '')])
  )
  const fail = (message: string): ActionState => ({ ok: false, message, values })

  if ((kind !== 'materi' && kind !== 'tugas') || !ID_PATTERN.test(itemId)) {
    return fail('Data tidak valid.')
  }
  const title = values.title.trim()
  const description = values.description.trim()
  if (!title) return fail('Judul wajib diisi.')
  if (title.length > 200) return fail('Judul maksimal 200 karakter.')
  if (description.length > 5000) return fail('Deskripsi maksimal 5.000 karakter.')

  try {
    const denied = await requireTeacher(user.id, user.role, courseId)
    if (denied) return fail(denied)

    if (kind === 'materi') {
      await updateMaterial(user.id, courseId, itemId, { title, description })
    } else {
      let maxPoints: number | undefined
      if (values.points.trim() !== '') {
        maxPoints = Number(values.points)
        if (!Number.isFinite(maxPoints) || maxPoints < 0 || maxPoints > 1000) {
          return fail('Poin harus berupa angka 0 sampai 1000.')
        }
      }

      // Tenggat hanya dikirim jika benar-benar diubah, agar tugas yang sudah lewat tenggat tetap bisa diedit
      const original = String(fd.get('dueOriginal') ?? '')
      let due = null
      if (values.due !== original) {
        if (!values.due) {
          return fail(
            'Tenggat yang sudah ada tidak bisa dikosongkan dari web. Ubah ke tanggal lain, atau hapus tenggatnya langsung di Classroom.'
          )
        }
        const d = parseDue(values.due)
        if ('error' in d) return fail(d.error)
        due = d.due
      }

      await updateCourseWork(user.id, courseId, itemId, { title, description, maxPoints, due })
    }

    await syncCourse(courseId, user.id, 'items').catch(console.error)
    revalidatePath(PAGE, 'page')
    return { ok: true, message: 'Perubahan disimpan.' }
  } catch (e) {
    return fail(describeError(e, 'mengubah'))
  }
}

export async function removeItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  const kind = String(fd.get('kind') ?? '')
  const courseId = String(fd.get('courseId') ?? '')
  const itemId = String(fd.get('itemId') ?? '')
  const fail = (message: string): ActionState => ({ ok: false, message })

  if ((kind !== 'materi' && kind !== 'tugas') || !ID_PATTERN.test(itemId)) {
    return fail('Data tidak valid.')
  }
  if (fd.get('confirm') !== 'on') return fail('Centang kotak konfirmasi untuk menghapus.')

  try {
    const denied = await requireTeacher(user.id, user.role, courseId)
    if (denied) return fail(denied)

    await deleteClassroomItem(user.id, courseId, kind, itemId)

    await syncCourse(courseId, user.id, 'items').catch(console.error)
    revalidatePath(PAGE, 'page')
    return { ok: true, message: 'Berhasil dihapus.' }
  } catch (e) {
    return fail(describeError(e, 'menghapus'))
  }
}
