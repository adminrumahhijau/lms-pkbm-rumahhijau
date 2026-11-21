import { Sprout, Compass, GraduationCap, type LucideIcon } from 'lucide-react'

export interface ProgramTheme {
  solid: string // latar kuat (header, tombol bulat)
  letter: string // warna huruf besar A/B/C pada kartu
  soft: string
  text: string
  border: string
  hoverBorder: string
  iconBg: string
  tabActive: string
  button: string
}

export interface Program {
  slug: string
  name: string
  level: string
  description: string
  icon: LucideIcon
  theme: ProgramTheme
}

// Kelas Tailwind harus berupa string utuh (tidak boleh digabung dinamis)
export const PROGRAMS: Program[] = [
  {
    slug: 'paket-a',
    name: 'Paket A',
    level: 'Setara SD',
    description: 'Fondasi membaca, menulis, dan berhitung untuk langkah awal belajar.',
    icon: Sprout,
    theme: {
      solid: 'bg-amber-700',
      letter: 'text-amber-200/70',
      soft: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-500',
      iconBg: 'bg-amber-100',
      tabActive: 'bg-amber-100 text-amber-900',
      button: 'bg-amber-700 hover:bg-amber-800',
    },
  },
  {
    slug: 'paket-b',
    name: 'Paket B',
    level: 'Setara SMP',
    description: 'Memperdalam pengetahuan umum dan keterampilan dasar untuk jenjang berikutnya.',
    icon: Compass,
    theme: {
      solid: 'bg-emerald-700',
      letter: 'text-emerald-200/70',
      soft: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-500',
      iconBg: 'bg-emerald-100',
      tabActive: 'bg-emerald-100 text-emerald-900',
      button: 'bg-emerald-700 hover:bg-emerald-800',
    },
  },
  {
    slug: 'paket-c',
    name: 'Paket C',
    level: 'Setara SMA',
    description: 'Persiapan lulus dan keterampilan kerja, termasuk teknik komputer dasar.',
    icon: GraduationCap,
    theme: {
      solid: 'bg-indigo-700',
      letter: 'text-indigo-200/70',
      soft: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      hoverBorder: 'hover:border-indigo-500',
      iconBg: 'bg-indigo-100',
      tabActive: 'bg-indigo-100 text-indigo-900',
      button: 'bg-indigo-700 hover:bg-indigo-800',
    },
  },
]

export const getProgram = (slug: string) => PROGRAMS.find((p) => p.slug === slug)
