'use server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionState } from '@/app/classroom-actions'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROLES = ['admin', 'tutor', 'siswa'] as const

export async function setUserRole(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await getCurrentUser() // di luar try agar redirect tidak tertelan
  const fail = (message: string): ActionState => ({ ok: false, message })

  // Peran admin diperiksa dari database di server, bukan dari tampilan
  if (me.role !== 'admin') return fail('Hanya admin yang boleh mengubah peran.')

  const targetId = String(fd.get('userId') ?? '')
  const role = String(fd.get('role') ?? '')
  if (!UUID.test(targetId)) return fail('Pengguna tidak valid.')
  if (!(ROLES as readonly string[]).includes(role)) return fail('Peran tidak valid.')
  if (targetId === me.id) return fail('Anda tidak bisa mengubah peran akun Anda sendiri.')

  try {
    const admin = createAdminClient()
    const { data: target } = await admin
      .from('profiles')
      .select('id, email, role')
      .eq('id', targetId)
      .single()
    if (!target) return fail('Pengguna tidak ditemukan.')
    if (target.role === role) return { ok: true, message: 'Tidak ada perubahan.' }

    // Jangan sampai tidak ada admin sama sekali
    if (target.role === 'admin' && role !== 'admin') {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
      if ((count ?? 0) <= 1) return fail('Harus tersisa minimal satu admin.')
    }

    const { error } = await admin.from('profiles').update({ role }).eq('id', targetId)
    if (error) throw new Error(error.message)

    const { data: actor } = await admin.from('profiles').select('email').eq('id', me.id).single()
    await admin.from('role_audit').insert({
      actor: me.id,
      target: targetId,
      actor_email: actor?.email ?? null,
      target_email: target.email ?? null,
      old_role: target.role,
      new_role: role,
    })

    revalidatePath('/admin/pengguna')
    return { ok: true, message: `Peran diubah menjadi ${role}.` }
  } catch (e) {
    console.error(e)
    return fail('Gagal mengubah peran. Coba lagi sebentar lagi.')
  }
}
