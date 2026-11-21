import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMyClassroomId } from '@/lib/classroom'

export type Role = 'admin' | 'tutor' | 'siswa'

const googleIdOf = (u: User): string | null =>
  (u.user_metadata?.provider_id as string | undefined) ??
  (u.user_metadata?.sub as string | undefined) ??
  u.identities?.find((i) => i.provider === 'google')?.id ??
  null

async function resolveGoogleId(u: User): Promise<string | null> {
  try {
    return await getMyClassroomId(u.id) // sumber paling pasti: ID Classroom itu sendiri
  } catch {
    return googleIdOf(u)
  }
}

export interface AppUser {
  id: string
  name: string
  role: Role
  googleId: string | null
}

/** Pengguna saat ini, atau null bila belum login. Di-cache per permintaan agar header dan halaman berbagi hasilnya. */
export const getOptionalUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, google_id')
    .eq('id', user.id)
    .single()

  let googleId: string | null = profile?.google_id ?? null
  if (!googleId) {
    googleId = await resolveGoogleId(user)
    if (googleId) {
      await createAdminClient().from('profiles').update({ google_id: googleId }).eq('id', user.id)
    }
  }

  return {
    id: user.id,
    name: profile?.full_name ?? user.email ?? 'Pengguna',
    role: (profile?.role ?? 'siswa') as Role,
    googleId,
  }
})

export async function getCurrentUser(): Promise<AppUser> {
  const user = await getOptionalUser()
  if (!user) redirect('/login')
  return user
}

export const canManage = (role: Role) => role === 'admin' || role === 'tutor'
