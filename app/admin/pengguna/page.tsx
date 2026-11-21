import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Search } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatWaktu, rapikanNama } from '@/lib/data'
import Breadcrumb from '@/components/Breadcrumb'
import RoleForm from '@/components/RoleForm'

export const metadata: Metadata = { title: 'Kelola pengguna' }

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', tutor: 'Tutor', siswa: 'Siswa' }

export default async function PenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const me = await getCurrentUser()
  if (me.role !== 'admin') notFound()

  const { q: rawQ } = await searchParams
  // Hanya karakter aman: kata kunci masuk ke filter PostgREST
  const q = (rawQ ?? '').replace(/[^\p{L}\p{N}@._\- ]/gu, '').trim().slice(0, 60)

  const admin = createAdminClient()
  let query = admin
    .from('profiles')
    .select('id, email, full_name, role, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)

  const [{ data: users }, { data: audit }] = await Promise.all([
    query,
    admin
      .from('role_audit')
      .select('id, actor_email, target_email, old_role, new_role, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const list = users ?? []
  const count = (r: string) => list.filter((u) => u.role === r).length

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <Breadcrumb
        items={[{ label: 'Beranda', href: '/' }, { label: 'Kelola pengguna' }]}
      />

      <h1 className="text-3xl font-extrabold tracking-tight text-bark">Kelola pengguna</h1>
      <p className="mt-2 max-w-2xl text-sage-600">
        Pengguna baru muncul di sini setelah login pertama. Tutor dan admin perlu masuk lewat
        tombol &quot;Masuk sebagai tutor atau admin&quot; agar bisa membuat tugas di Classroom.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {(['admin', 'tutor', 'siswa'] as const).map((r) => (
          <span key={r} className="rounded-full bg-white px-3 py-1 font-semibold text-sage-700 ring-1 ring-sage-200">
            {ROLE_LABEL[r]}: {count(r)}
          </span>
        ))}
      </div>

      <form role="search" className="mt-5 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Cari nama atau email
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-400" aria-hidden />
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Cari nama atau email"
            className="w-full rounded-xl border border-sage-300 bg-white py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm font-semibold text-bark transition hover:bg-sage-50 active:scale-95"
        >
          Cari
        </button>
      </form>

      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-sage-300 bg-white p-8 text-center text-sage-600">
          {q ? `Tidak ada pengguna yang cocok dengan "${q}".` : 'Belum ada pengguna yang pernah masuk.'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-sage-100 overflow-hidden rounded-2xl border border-sage-200 bg-white">
          {list.map((u) => {
            const nama = rapikanNama(u.full_name ?? '') || 'Tanpa nama'
            return (
              <li
                key={u.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-bark">{nama}</p>
                  <p className="truncate text-sm text-sage-500">{u.email}</p>
                  <p className="mt-0.5 text-xs text-sage-500">
                    Terakhir masuk {formatWaktu(u.updated_at)} WIB
                  </p>
                </div>
                <RoleForm userId={u.id} role={u.role} name={nama} isSelf={u.id === me.id} />
              </li>
            )
          })}
        </ul>
      )}

      {(audit ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-bark">Riwayat perubahan peran</h2>
          <ul className="mt-3 space-y-2 text-sm text-sage-600">
            {(audit ?? []).map((a) => (
              <li key={a.id} className="rounded-xl bg-white px-4 py-2.5 ring-1 ring-sage-200">
                <span className="font-semibold text-bark">{a.actor_email ?? 'Admin'}</span> mengubah{' '}
                <span className="font-semibold text-bark">{a.target_email ?? 'pengguna'}</span> dari{' '}
                {ROLE_LABEL[a.old_role] ?? a.old_role} menjadi {ROLE_LABEL[a.new_role] ?? a.new_role},{' '}
                {formatWaktu(a.created_at)} WIB
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
