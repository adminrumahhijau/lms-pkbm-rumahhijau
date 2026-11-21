import { redirect } from 'next/navigation'

// Agar /jenjang/paket-c tidak 404
export default async function Page({ params }: { params: Promise<{ program: string }> }) {
  const { program } = await params
  redirect(`/jenjang/${program}/kelas`)
}
