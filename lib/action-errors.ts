import 'server-only'
import { PermissionError, ReauthRequiredError } from '@/lib/classroom'
import { ProjectMismatchError } from '@/lib/classroom-write'

export function describeError(e: unknown, verb: 'mengubah' | 'menghapus'): string {
  if (e instanceof ReauthRequiredError) return 'Sesi Google berakhir. Silakan login ulang.'
  if (e instanceof ProjectMismatchError) {
    return `Item ini dibuat langsung di Google Classroom, sehingga tidak bisa ${verb}nya dari web. Gunakan tombol "Buka di Classroom".`
  }
  if (e instanceof PermissionError) {
    return 'Izin belum lengkap atau Anda bukan pengajar kelas ini. Login ulang lewat "Login sebagai Tutor / Admin".'
  }
  console.error(e)
  return `Gagal ${verb} di Google Classroom. Coba lagi sebentar lagi.`
}
