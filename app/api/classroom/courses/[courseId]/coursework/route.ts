// Endpoint (opsional): tugas satu kelas langsung dari Classroom, untuk fetch dari sisi client
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCourseWork, ReauthRequiredError } from '@/lib/classroom'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  // courseId Classroom selalu numerik; validasi mencegah path injection
  if (!/^\d+$/.test(courseId)) {
    return NextResponse.json({ error: 'courseId tidak valid' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await getCourseWork(user.id, courseId))
  } catch (e) {
    if (e instanceof ReauthRequiredError) {
      return NextResponse.json({ error: 'Silakan login ulang' }, { status: 401 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Gagal mengambil tugas' }, { status: 500 })
  }
}
