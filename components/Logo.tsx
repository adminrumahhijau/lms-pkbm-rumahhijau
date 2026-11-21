'use client'
import { useState } from 'react'
import { Leaf } from 'lucide-react'
import { BRAND } from '@/lib/brand'

/** Logo PKBM; bila gambar gagal dimuat, tampil ikon daun sebagai cadangan */
export default function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-full bg-white/15 ${className}`}>
        <Leaf className="h-1/2 w-1/2" aria-hidden />
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND.logoUrl}
      alt=""
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-white object-contain p-0.5 ${className}`}
    />
  )
}
