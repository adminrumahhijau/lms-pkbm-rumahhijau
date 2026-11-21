// Identitas PKBM Rumah Hijau (mengacu pada situs resmi pkbm-rumahhijau.sch.id)
export const BRAND = {
  name: 'PKBM Rumah Hijau',
  themeColor: '#0b3d2e',
  // Logo dan foto diambil dari situs resmi. Ganti lewat env bila ingin memakai berkas sendiri
  // (mis. taruh logo di public/img/logo.webp lalu isi NEXT_PUBLIC_LOGO_URL=/img/logo.webp).
  logoUrl:
    process.env.NEXT_PUBLIC_LOGO_URL ?? 'https://pkbm-rumahhijau-sch-id.vercel.app/img/logo.webp',
  heroImageUrl:
    process.env.NEXT_PUBLIC_HERO_URL ?? 'https://pkbm-rumahhijau-sch-id.vercel.app/img/team.webp',
  website: 'https://pkbm-rumahhijau.sch.id',
  whatsappLabel: '0851-6777-0174',
  whatsappUrl: 'https://wa.me/6285167770174',
  hours: 'Senin sampai Sabtu, 08.00 sampai 16.00',
  address:
    'Jl. Lintas Sumatera No. 220, Pagar Jati, Kec. Lubuk Pakam, Kab. Deli Serdang, Sumatera Utara 20551',
} as const
