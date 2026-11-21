'use server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { getCourses, PermissionError, ReauthRequiredError } from '@/lib/classroom'
import { parseAttachment } from '@/lib/attachments'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  addLinkAttachments, deleteDriveFile, getMySubmission, getTeacherEmails,
  ProjectMismatchError, shareDriveFile, shareDriveFileWithLink, turnInSubmission, uploadToDrive,
} from '@/lib/classroom-write'
import type { ActionState } from '@/app/classroom-actions'

const ID = /^[A-Za-z0-9_-]+$/

export async function submitTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser() // di luar try agar redirect tidak tertelan
  const courseId = String(fd.get('courseId') ?? '')
  const courseWorkId = String(fd.get('courseWorkId') ?? '')
  const values = { linkUrl: String(fd.get('linkUrl') ?? '') }
  const fail = (message: string): ActionState => ({ ok: false, message, values })

  if (!ID.test(courseId) || !ID.test(courseWorkId)) return fail('Data tugas tidak valid.')
  if (fd.get('confirm') !== 'on') return fail('Centang kotak konfirmasi sebelum menyerahkan.')

  const att = parseAttachment(fd)
  if ('error' in att) return fail(att.error)
  if (!att.upload && !att.linkUrl) {
    return fail('Pilih file atau tempel tautan hasil pekerjaan Anda.')
  }

  let uploadedId: string | undefined
  let attached = false

  try {
    const courses = await getCourses(user.id)
    const course = courses.find((c) => c.id === courseId)
    if (!course || course.role !== 'student') {
      return fail('Hanya siswa kelas ini yang dapat mengumpulkan tugas.')
    }

    const sub = await getMySubmission(user.id, courseId, courseWorkId)
    if (sub.state === 'TURNED_IN' || sub.state === 'RETURNED') {
      return fail('Tugas ini sudah dikumpulkan.')
    }

    const urls: string[] = []

    if (att.upload) {
      const allowFallback = process.env.ALLOW_LINK_SHARING_FALLBACK === 'true'
      const emails = await getTeacherEmails(user.id, courseId)

      if (emails.length === 0 && !allowFallback) {
        return fail(
          'Email guru tidak terbaca, sehingga file tidak bisa dibagikan dengan aman. Unggah file ke Google Drive Anda, bagikan ke guru, lalu tempel tautannya di kolom tautan.'
        )
      }

      uploadedId = await uploadToDrive(user.id, att.upload)

      const shared = emails.length ? await shareDriveFile(user.id, uploadedId, emails) : 0
      if (shared === 0) {
        if (!allowFallback) {
          await deleteDriveFile(user.id, uploadedId)
          return fail('File gagal dibagikan ke guru. Coba lagi atau gunakan tautan Google Drive.')
        }
        await shareDriveFileWithLink(user.id, uploadedId)
      }
      urls.push(`https://drive.google.com/file/d/${uploadedId}/view`)
    }

    if (att.linkUrl) urls.push(att.linkUrl)

    await addLinkAttachments(user.id, courseId, courseWorkId, sub.id, urls)
    attached = true

    try {
      await turnInSubmission(user.id, courseId, courseWorkId, sub.id)
    } catch (e) {
      console.error(e)
      revalidatePath('/jenjang/[program]/mapel/[id]', 'page')
      return fail(
        'Lampiran sudah ditambahkan, tetapi gagal menyerahkan tugas. Buka Classroom lalu tekan "Serahkan".'
      )
    }

    if (user.googleId) {
      await createAdminClient().from('submissions').upsert(
        {
          course_id: courseId,
          assignment_id: courseWorkId,
          google_id: user.googleId,
          state: 'TURNED_IN',
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'course_id,assignment_id,google_id' }
      ) // gagal tidak masalah; sinkronisasi berikutnya meluruskan
    }

    revalidatePath('/jenjang/[program]/mapel/[id]', 'page')
    return { ok: true, message: 'Tugas berhasil dikumpulkan.' }
  } catch (e) {
    if (uploadedId && !attached) await deleteDriveFile(user.id, uploadedId)

    if (e instanceof ReauthRequiredError) return fail('Sesi Google berakhir. Silakan login ulang.')
    if (e instanceof ProjectMismatchError) {
      return fail(
        'Tugas ini dibuat langsung di Google Classroom, jadi tidak bisa dikumpulkan dari web. Gunakan tombol "Kumpulkan langsung di Classroom".'
      )
    }
    if (e instanceof PermissionError) {
      return fail('Izin belum lengkap. Logout lalu login ulang agar Google meminta izin yang baru.')
    }
    console.error(e)
    return fail('Gagal mengumpulkan tugas. Coba lagi sebentar lagi.')
  }
}
