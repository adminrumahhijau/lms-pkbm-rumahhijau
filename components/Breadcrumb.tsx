import Link from 'next/link'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  // Induk langsung = item sebelum halaman saat ini
  const parent = items.length >= 2 ? items[items.length - 2] : undefined

  return (
    <nav aria-label="Posisi halaman" className="mb-5">
      {/* HP: satu tombol kembali yang mudah ditekan */}
      {parent?.href && (
        <Link
          href={parent.href}
          className="inline-flex items-center gap-1.5 rounded-lg py-1.5 pr-3 text-sm font-semibold text-leaf sm:hidden"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kembali ke {parent.label}
        </Link>
      )}

      {/* Layar lebar: jalur lengkap */}
      <ol className="hidden flex-wrap items-center gap-1 text-sm text-sage-500 sm:flex">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex min-w-0 items-center gap-1">
              {i === 0 && <Home className="h-4 w-4 shrink-0" aria-hidden />}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded px-1 py-0.5 transition hover:bg-sage-100 hover:text-bark"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={`truncate px-1 ${last ? 'font-semibold text-bark' : ''}`}
                >
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="h-4 w-4 shrink-0 text-sage-300" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
