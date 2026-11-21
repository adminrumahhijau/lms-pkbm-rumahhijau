import Link from 'next/link'
import { BarChart3, BookOpen, ClipboardList, Users } from 'lucide-react'
import type { ProgramTheme } from '@/lib/programs'

export const TABS = [
  { key: 'modul', label: 'Modul / Materi', icon: BookOpen },
  { key: 'tugas', label: 'Tugas & Jobsheet', icon: ClipboardList },
  { key: 'peserta', label: 'Daftar Peserta', icon: Users },
  { key: 'rekap', label: 'Rekap Nilai', icon: BarChart3 },
] as const

export type TabKey = (typeof TABS)[number]['key']

export default function ClassroomNav({
  basePath,
  active,
  theme,
  showRekap,
}: {
  basePath: string
  active: TabKey
  theme: ProgramTheme
  showRekap: boolean
}) {
  return (
    <nav
      aria-label="Menu ruang kelas"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {TABS.filter((t) => t.key !== 'rekap' || showRekap).map(({ key, label, icon: Icon }) => {
        const isActive = key === active
        return (
          <Link
            key={key}
            href={`${basePath}?tab=${key}`}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
              isActive ? theme.tabActive : 'text-sage-600 hover:bg-sage-100 hover:text-sage-900'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
