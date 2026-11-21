import Link from 'next/link'
import { Clock, MapPin, MessageCircle } from 'lucide-react'
import { BRAND } from '@/lib/brand'

export default function AppFooter() {
  return (
    <footer className="border-t border-sage-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-sage-600 sm:grid-cols-3">
        <div>
          <p className="font-bold text-bark">{BRAND.name}</p>
          <p className="mt-1 leading-relaxed">
            Pusat Kegiatan Belajar Masyarakat. Kejar Paket A, B, dan C.
          </p>
          <a
            href={BRAND.website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-medium text-leaf underline-offset-2 hover:underline"
          >
            Situs resmi
          </a>
        </div>

        <ul className="space-y-2">
          <li className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sage-400" aria-hidden />
            <span>{BRAND.address}</span>
          </li>
          <li className="flex gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sage-400" aria-hidden />
            <span>{BRAND.hours}</span>
          </li>
        </ul>

        <div>
          <p className="font-semibold text-bark">Butuh bantuan?</p>
          <p className="mt-1">Kesulitan masuk atau kelas belum muncul? Tanya panitia.</p>
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-leaf active:scale-95"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp {BRAND.whatsappLabel}
          </a>
        </div>
      </div>

      <div className="border-t border-sage-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs text-sage-500">
          <p>Hak cipta {new Date().getFullYear()} {BRAND.name}</p>
          <nav aria-label="Informasi hukum" className="flex gap-4 font-medium">
            <Link href="/privasi" className="hover:text-bark hover:underline">
              Kebijakan privasi
            </Link>
            <Link href="/privasi#ketentuan" className="hover:text-bark hover:underline">
              Ketentuan penggunaan
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
