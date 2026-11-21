import 'server-only'

export const MAX_FILE = 4 * 1024 * 1024
export const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']

export function parseAttachment(
  fd: FormData
): { error: string } | { linkUrl: string; upload: File | null } {
  const linkUrl = String(fd.get('linkUrl') ?? '').trim()
  const file = fd.get('file')

  if (linkUrl) {
    try {
      const u = new URL(linkUrl)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error()
    } catch {
      return { error: 'Tautan harus berupa alamat web yang valid (http:// atau https://).' }
    }
  }

  let upload: File | null = null
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXT.includes(ext)) {
      return { error: `Jenis file tidak didukung. Gunakan: ${ALLOWED_EXT.join(', ')}.` }
    }
    if (file.size > MAX_FILE) {
      return {
        error: 'Ukuran file maksimal 4 MB. Untuk file lebih besar, unggah ke Google Drive lalu tempel tautannya.',
      }
    }
    upload = file
  }

  return { linkUrl, upload }
}
