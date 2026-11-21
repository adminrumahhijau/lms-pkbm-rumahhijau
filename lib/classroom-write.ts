import 'server-only'
import { getGoogleAccessToken } from '@/lib/google-token'
import { PermissionError, ReauthRequiredError } from '@/lib/classroom'

const CLASSROOM = 'https://classroom.googleapis.com/v1'
const DRIVE = 'https://www.googleapis.com/drive/v3'

export class ProjectMismatchError extends Error {
  constructor() {
    super('PROJECT_MISMATCH')
  }
}

async function token(userId: string): Promise<string> {
  try {
    return await getGoogleAccessToken(userId)
  } catch (e) {
    if ((e as Error).message === 'REAUTH_REQUIRED') throw new ReauthRequiredError()
    throw e
  }
}

async function googleError(res: Response): Promise<Error> {
  if (res.status === 401) return new ReauthRequiredError()
  if (res.status === 403) {
    const text = await res.text()
    return /ProjectPermissionDenied/i.test(text) ? new ProjectMismatchError() : new PermissionError()
  }
  let msg = `Google API ${res.status}`
  try {
    msg = (await res.json())?.error?.message ?? msg
  } catch {
    /* body bukan JSON */
  }
  return new Error(msg)
}

async function post(userId: string, path: string, body: unknown) {
  const res = await fetch(`${CLASSROOM}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await token(userId)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await googleError(res)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

function youTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    const id =
      u.hostname === 'youtu.be'
        ? u.pathname.slice(1)
        : u.hostname.endsWith('youtube.com')
          ? u.searchParams.get('v')
          : null
    return id && /^[\w-]{6,20}$/.test(id) ? id : null
  } catch {
    return null
  }
}

export interface AttachmentInput {
  linkUrl?: string
  driveFileId?: string
}

function buildMaterials({ linkUrl, driveFileId }: AttachmentInput) {
  const materials: object[] = []
  if (driveFileId) {
    materials.push({ driveFile: { driveFile: { id: driveFileId }, shareMode: 'VIEW' } })
  }
  if (linkUrl) {
    const yt = youTubeId(linkUrl)
    materials.push(yt ? { youTubeVideo: { id: yt } } : { link: { url: linkUrl } })
  }
  return materials.length ? materials : undefined
}

/** Unggah file ke Drive milik user, kembalikan ID file */
export async function uploadToDrive(userId: string, file: File): Promise<string> {
  const mime = file.type || 'application/octet-stream'
  const boundary = `rh-${crypto.randomUUID()}`
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify({ name: file.name, mimeType: mime }),
    `\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
    await file.arrayBuffer(),
    `\r\n--${boundary}--`,
  ])

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await token(userId)}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )
  if (!res.ok) throw await googleError(res)
  return (await res.json()).id as string
}

export async function createMaterial(
  userId: string,
  courseId: string,
  input: { title: string; description?: string } & AttachmentInput
) {
  return post(userId, `/courses/${courseId}/courseWorkMaterials`, {
    title: input.title,
    description: input.description,
    materials: buildMaterials(input),
    state: 'PUBLISHED',
  })
}

export interface DueInput {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
}

export async function createCourseWork(
  userId: string,
  courseId: string,
  input: {
    title: string
    description?: string
    maxPoints?: number
    due?: DueInput | null
  } & AttachmentInput
) {
  return post(userId, `/courses/${courseId}/courseWork`, {
    title: input.title,
    description: input.description,
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
    maxPoints: input.maxPoints,
    dueDate: input.due
      ? { year: input.due.year, month: input.due.month, day: input.due.day }
      : undefined,
    dueTime: input.due
      ? { hours: input.due.hours, minutes: input.due.minutes }
      : undefined,
    materials: buildMaterials(input),
  })
}

// ---------- Pengumpulan tugas oleh siswa ----------

/** Pengumpulan milik siswa yang sedang login untuk satu tugas */
export async function getMySubmission(userId: string, courseId: string, courseWorkId: string) {
  const res = await fetch(
    `${CLASSROOM}/courses/${courseId}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions?userId=me`,
    { headers: { Authorization: `Bearer ${await token(userId)}` }, cache: 'no-store' }
  )
  if (!res.ok) throw await googleError(res)
  const sub = (await res.json()).studentSubmissions?.[0]
  if (!sub) throw new Error('Pengumpulan siswa tidak ditemukan')
  return { id: sub.id as string, state: sub.state as string }
}

/** Email para guru kelas (butuh scope classroom.profile.emails) */
export async function getTeacherEmails(userId: string, courseId: string): Promise<string[]> {
  const res = await fetch(`${CLASSROOM}/courses/${courseId}/teachers`, {
    headers: { Authorization: `Bearer ${await token(userId)}` },
    cache: 'no-store',
  })
  if (!res.ok) throw await googleError(res)
  const json = await res.json()
  return ((json.teachers ?? []) as { profile?: { emailAddress?: string } }[])
    .map((t) => t.profile?.emailAddress)
    .filter((e): e is string => !!e)
}

/** Bagikan file (hanya-lihat) ke daftar email. Mengembalikan jumlah yang berhasil. */
export async function shareDriveFile(userId: string, fileId: string, emails: string[]): Promise<number> {
  const accessToken = await token(userId)
  const results = await Promise.all(
    emails.map((emailAddress) =>
      fetch(`${DRIVE}/files/${fileId}/permissions?sendNotificationEmail=false`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'user', role: 'reader', emailAddress }),
      }).then((r) => r.ok)
    )
  )
  return results.filter(Boolean).length
}

/** Cadangan: siapa saja yang punya tautan boleh melihat */
export async function shareDriveFileWithLink(userId: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await token(userId)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'anyone', role: 'reader' }),
  })
  if (!res.ok) throw await googleError(res)
}

/** Hapus file yang baru diunggah (dipakai untuk membersihkan jika proses gagal) */
export async function deleteDriveFile(userId: string, fileId: string): Promise<void> {
  try {
    await fetch(`${DRIVE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await token(userId)}` },
    })
  } catch {
    /* best effort */
  }
}

export async function addLinkAttachments(
  userId: string, courseId: string, courseWorkId: string, submissionId: string, urls: string[]
) {
  return post(
    userId,
    `/courses/${courseId}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}:modifyAttachments`,
    { addAttachments: urls.map((url) => ({ link: { url } })) }
  )
}

export async function turnInSubmission(
  userId: string, courseId: string, courseWorkId: string, submissionId: string
) {
  return post(
    userId,
    `/courses/${courseId}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}:turnIn`,
    {}
  )
}

// ---------- Ubah / hapus oleh guru ----------

async function send(
  userId: string,
  method: 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<void> {
  const res = await fetch(`${CLASSROOM}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token(userId)}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 404 && method === 'DELETE') return // sudah terhapus, anggap berhasil
  if (!res.ok) throw await googleError(res)
}

const itemPath = (courseId: string, kind: 'materi' | 'tugas', id: string) =>
  `/courses/${courseId}/${kind === 'tugas' ? 'courseWork' : 'courseWorkMaterials'}/${encodeURIComponent(id)}`

export async function updateMaterial(
  userId: string, courseId: string, id: string,
  input: { title: string; description: string }
) {
  return send(userId, 'PATCH', `${itemPath(courseId, 'materi', id)}?updateMask=title,description`, input)
}

export async function updateCourseWork(
  userId: string, courseId: string, id: string,
  input: { title: string; description: string; maxPoints?: number; due?: DueInput | null }
) {
  const mask = ['title', 'description']
  const body: Record<string, unknown> = { title: input.title, description: input.description }
  if (input.maxPoints !== undefined) {
    mask.push('maxPoints')
    body.maxPoints = input.maxPoints
  }
  if (input.due) {
    mask.push('dueDate', 'dueTime')
    body.dueDate = { year: input.due.year, month: input.due.month, day: input.due.day }
    body.dueTime = { hours: input.due.hours, minutes: input.due.minutes }
  }
  return send(userId, 'PATCH', `${itemPath(courseId, 'tugas', id)}?updateMask=${mask.join(',')}`, body)
}

export async function deleteClassroomItem(
  userId: string, courseId: string, kind: 'materi' | 'tugas', id: string
) {
  return send(userId, 'DELETE', itemPath(courseId, kind, id))
}
