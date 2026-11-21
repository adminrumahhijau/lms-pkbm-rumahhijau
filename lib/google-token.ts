import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/** Access token Google milik user; otomatis diperbarui dengan refresh token bila hampir habis */
export async function getGoogleAccessToken(userId: string): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', userId)
    .single()

  if (error || !data) throw new Error('PROFILE_NOT_FOUND')

  const expiresAt = data.google_token_expires_at
    ? new Date(data.google_token_expires_at).getTime()
    : 0

  // Masih berlaku (sisa > 60 detik)
  if (data.google_access_token && expiresAt - Date.now() > 60_000) {
    return data.google_access_token
  }

  if (!data.google_refresh_token) throw new Error('REAUTH_REQUIRED')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: data.google_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('REAUTH_REQUIRED') // refresh token dicabut/kedaluwarsa

  const json = await res.json()
  await admin
    .from('profiles')
    .update({
      google_access_token: json.access_token,
      google_token_expires_at: new Date(Date.now() + (json.expires_in - 60) * 1000).toISOString(),
    })
    .eq('id', userId)

  return json.access_token
}
