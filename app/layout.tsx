import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'PKBM Rumah Hijau', template: '%s | PKBM Rumah Hijau' },
  description: 'Ruang belajar PKBM Rumah Hijau yang terhubung dengan Google Classroom.',
}

export const viewport: Viewport = {
  themeColor: '#0b3d2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col bg-sage-50 font-sans text-bark antialiased">
        <a
          href="#utama"
          className="sr-only rounded-lg bg-white px-4 py-2 font-medium text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50"
        >
          Lewati ke konten utama
        </a>
        <AppHeader />
        <div id="utama" className="flex-1">
          {children}
        </div>
        <AppFooter />
      </body>
    </html>
  )
}
