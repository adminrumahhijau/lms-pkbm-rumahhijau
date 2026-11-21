import { ID_PATTERN } from '@/lib/guard'
import { getRekap } from '@/lib/cache-data'
import { createClient } from '@/lib/supabase/server'

// Sel yang diawali = + - @ diberi tanda kutip agar tidak dieksekusi sebagai rumus di Excel
const esc = (v: string | number | null): string => {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  if (!ID_PATTERN.test(courseId)) return new Response('Bad request', { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: allowed } = await supabase.rpc('can_manage_course', { cid: courseId })
  if (!allowed) return new Response('Forbidden', { status: 403 })

  const { students, assignments, cells, averages } = await getRekap(courseId)

  const header = [
    'Nama',
    ...assignments.map((a) => (a.maxPoints ? `${a.title} (/${a.maxPoints})` : a.title)),
    'Rata-rata (%)',
  ]
  const lines = [header.map(esc).join(';')]

  for (const s of students) {
    const row = assignments.map((a) => {
      const c = cells[`${a.id}|${s.googleId}`]
      if (c?.state === 'RETURNED') return c.grade ?? 'Dinilai'
      if (c?.state === 'TURNED_IN') return 'Diserahkan'
      return 'Belum'
    })
    lines.push([s.name, ...row, averages[s.googleId] ?? ''].map(esc).join(';'))
  }

  // Titik koma sebagai pemisah: Excel berbahasa Indonesia membaca CSV dengan pemisah itu
  return new Response('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rekap-nilai-${courseId}.csv"`,
    },
  })
}
