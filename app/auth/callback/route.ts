import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = await cookies()
  const mode = cookieStore.get('login_mode')?.value
  cookieStore.delete('login_mode')
  const nextParam = searchParams.get('next') ?? '/'
  // cegah open redirect
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const { session, user } = data
      const meta = user.user_metadata

      const row: Record<string, unknown> = {
        id: user.id,
        email: user.email,
        full_name: meta.full_name ?? meta.name ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
        updated_at: new Date().toISOString(),
      }
      if (session.provider_token) {
        row.google_access_token = session.provider_token
        row.google_token_expires_at = new Date(Date.now() + 3500 * 1000).toISOString()
      }
      // Hanya ditimpa jika Google mengirim yang baru, agar tidak terhapus jadi null
      if (session.provider_refresh_token) {
        row.google_refresh_token = session.provider_refresh_token
      }

      const admin = createAdminClient()
      const { error: dbError } = await admin.from('profiles').upsert(row)
      if (dbError) console.error('Gagal simpan token:', dbError.message)

      // Masuk lewat jalur tutor tetapi peran masih siswa: beri petunjuk di Beranda
      if (mode === 'staff') {
        const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single()
        if (p?.role === 'siswa') return NextResponse.redirect(`${origin}/?info=belum-tutor`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
