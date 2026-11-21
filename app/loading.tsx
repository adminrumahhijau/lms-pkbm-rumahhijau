export default function Loading() {
  return (
    <div role="status" aria-label="Memuat halaman" className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="h-9 w-64 rounded-xl bg-sage-200 motion-safe:animate-pulse" />
      <div className="h-5 w-96 max-w-full rounded-lg bg-sage-100 motion-safe:animate-pulse" />
      <div className="grid gap-5 pt-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-sage-100 motion-safe:animate-pulse" />
        ))}
      </div>
      <span className="sr-only">Memuat…</span>
    </div>
  )
}
