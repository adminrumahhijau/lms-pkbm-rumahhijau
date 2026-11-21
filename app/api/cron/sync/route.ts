import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncCourse } from '@/lib/sync'

export const maxDuration = 60

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // tanpa rahasia, endpoint tertutup
  const given = Buffer.from(req.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 })

  const admin = createAdminClient()
  const { data: courses } = await admin
    .from('course_programs')
    .select('course_id, synced_by')
    .not('synced_by', 'is', null)
    .order('synced_at', { ascending: true, nullsFirst: true }) // yang paling lama dulu
    .limit(10)

  const started = Date.now()
  const results: { course: string; ok: boolean }[] = []

  for (const c of courses ?? []) {
    if (Date.now() - started > 45_000) break // sisakan waktu
    try {
      await syncCourse(c.course_id, c.synced_by as string)
      results.push({ course: c.course_id, ok: true })
    } catch (e) {
      console.error('cron sync gagal', c.course_id, (e as Error).message)
      results.push({ course: c.course_id, ok: false })
    }
  }

  return Response.json({ results })
}
