import { Link2 } from 'lucide-react'
import { assignProgram } from '@/app/actions'
import { PROGRAMS } from '@/lib/programs'
import type { Subject } from '@/lib/types'

export default function UnmappedCourses({ subjects }: { subjects: Subject[] }) {
  return (
    <section className="mt-10 rounded-2xl border border-dashed border-sage-300 bg-sage-50 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-sage-900">
        <Link2 className="h-4 w-4" aria-hidden />
        Kelas Classroom yang belum dipetakan ke jenjang
      </h2>
      <p className="mt-1 text-sm text-sage-500">
        Kelas ini belum tampil untuk siswa sampai dipilihkan jenjangnya.
      </p>

      <ul className="mt-4 space-y-3">
        {subjects.map((s) => (
          <li key={s.id}>
            <form
              action={assignProgram}
              className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center"
            >
              <input type="hidden" name="courseId" value={s.id} />
              <span className="min-w-0 flex-1 truncate font-medium text-sage-800">{s.name}</span>
              <select
                name="program"
                required
                defaultValue=""
                className="rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm"
              >
                <option value="" disabled>Pilih jenjang…</option>
                {PROGRAMS.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name} ({p.level})</option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-leaf active:scale-95"
              >
                Simpan
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  )
}
