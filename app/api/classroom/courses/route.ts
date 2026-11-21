// Endpoint uji (opsional): daftar kelas langsung dari Classroom untuk user yang login
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleAccessToken } from '@/lib/google-token'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const token = await getGoogleAccessToken(user.id)
    const res = await fetch(
      'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return NextResponse.json(await res.json(), { status: res.status })
  } catch (e) {
    const reauth = (e as Error).message === 'REAUTH_REQUIRED'
    return NextResponse.json(
      { error: reauth ? 'Silakan login ulang dengan Google' : 'Server error' },
      { status: reauth ? 401 : 500 }
    )
  }
}
