'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/** Saat data sedang diperbarui di latar belakang, muat ulang halaman satu kali setelah beberapa detik */
export default function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const fired = useRef(false)

  useEffect(() => {
    if (!active || fired.current) return
    const t = setTimeout(() => {
      fired.current = true
      routerRef.current.refresh()
    }, 6000)
    return () => clearTimeout(t)
  }, [active])

  if (!active) return null
  return (
    <p
      role="status"
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-sage-700 ring-1 ring-sage-200"
    >
      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
      Memperbarui data dari Google Classroom…
    </p>
  )
}
