import Link from 'next/link'
import { Home, LogOut, Users } from 'lucide-react'
import { signOut } from '@/app/auth-actions'
import { getOptionalUser } from '@/lib/auth'
import { BRAND } from '@/lib/brand'
import { rapikanNama } from '@/lib/data'
import Logo from './Logo'

const ROLE_LABEL = { admin: 'Admin', tutor: 'Tutor', siswa: 'Siswa' } as const

export default async function AppHeader() {
  const user = await getOptionalUser()
  const nama = user ? rapikanNama(user.name) : ''

  return (
    <header className="sticky top-0 z-40 bg-ink text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg py-1 font-bold">
          <Logo className="h-9 w-9" />
          <span className="truncate">{BRAND.name}</span>
        </Link>

        {user && (
          <nav aria-label="Menu utama" className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/"
              aria-label="Beranda"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <Home className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin/pengguna"
                aria-label="Kelola pengguna"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
              >
                <Users className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Pengguna</span>
              </Link>
            )}

            <div className="hidden items-center gap-2 border-l border-white/20 pl-3 text-sm md:flex">
              <span
                aria-hidden
                className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-xs font-bold"
              >
                {nama.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-40 truncate">{nama}</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                {ROLE_LABEL[user.role]}
              </span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                aria-label="Keluar"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 active:scale-95"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  )
}
