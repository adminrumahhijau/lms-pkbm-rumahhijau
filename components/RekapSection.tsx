import { Download } from 'lucide-react'
import type { Rekap, RekapCell } from '@/lib/cache-data'
import { rapikanNama } from '@/lib/data'
import type { ProgramTheme } from '@/lib/programs'
import FeedbackCell from './FeedbackCell'

function view(cell: RekapCell | undefined, a: Rekap['assignments'][number]) {
  const overdue = a.dueAt ? new Date(a.dueAt).getTime() < Date.now() : false
  const state = cell?.state ?? 'NEW'

  if (state === 'RETURNED') {
    return cell?.grade != null
      ? {
          label: a.maxPoints ? `${cell.grade}/${a.maxPoints}` : String(cell.grade),
          tone: 'bg-green-50 text-green-800',
        }
      : { label: 'Dinilai', tone: 'bg-blue-50 text-blue-800' }
  }
  if (state === 'TURNED_IN') return { label: 'Diserahkan', tone: 'bg-amber-50 text-amber-800' }
  return overdue
    ? { label: 'Belum', tone: 'bg-red-50 text-red-700' }
    : { label: '—', tone: 'text-sage-400' }
}

export default function RekapSection({
  data,
  courseId,
  canEdit,
  theme,
}: {
  data: Rekap
  courseId: string
  canEdit: boolean
  theme: ProgramTheme
}) {
  const { students, assignments, cells, averages } = data

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-sage-900">Rekap Nilai</h2>
        <a
          href={`/api/rekap/${courseId}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-sage-300 px-3.5 py-2 text-sm font-medium text-sage-700 transition hover:bg-sage-50 active:scale-95"
        >
          <Download className="h-4 w-4" aria-hidden />
          Unduh CSV
        </a>
      </div>

      {students.length === 0 || assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-300 p-8 text-center text-sage-500">
          Belum ada siswa atau tugas untuk direkap. Coba tekan Sinkronkan.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-sage-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-sage-50 text-left text-xs text-sage-600">
                <tr>
                  <th className="sticky left-0 z-10 min-w-40 bg-sage-50 px-4 py-3 font-semibold">
                    Siswa
                  </th>
                  {assignments.map((a) => (
                    <th key={a.id} className="min-w-28 px-3 py-3 font-medium" title={a.title}>
                      <span className="line-clamp-2">{a.title}</span>
                      {a.maxPoints > 0 && (
                        <span className="font-normal text-sage-400">/{a.maxPoints}</span>
                      )}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold">Rata-rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {students.map((s) => (
                  <tr key={s.googleId}>
                    <th className="sticky left-0 z-10 bg-white px-4 py-2.5 text-left font-medium text-sage-800">
                      {rapikanNama(s.name)}
                    </th>
                    {assignments.map((a) => {
                      const cell = cells[`${a.id}|${s.googleId}`]
                      const v = view(cell, a)
                      return (
                        <td key={a.id} className="px-3 py-2">
                          <FeedbackCell
                            courseId={courseId}
                            assignmentId={a.id}
                            studentId={s.googleId}
                            studentName={rapikanNama(s.name)}
                            taskTitle={a.title}
                            label={v.label}
                            tone={v.tone}
                            comment={cell?.comment ?? null}
                            canEdit={canEdit}
                            theme={theme}
                          />
                        </td>
                      )
                    })}
                    <td className="px-3 py-2 font-semibold text-sage-800">
                      {averages[s.googleId] != null ? `${averages[s.googleId]}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-sage-500">
            Nilai muncul setelah tugas dikembalikan di Classroom. Rata-rata dihitung dari tugas yang sudah dinilai dan punya poin. Klik sebuah sel untuk menulis komentar.
          </p>
        </>
      )}
    </section>
  )
}
