import type { DueInput } from '@/lib/classroom-write'

/** Input datetime-local dianggap WIB (UTC+7), diubah ke UTC untuk Classroom */
export function parseDue(raw: string): { error: string } | { due: DueInput | null } {
  if (!raw) return { due: null }
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(raw)
  if (!m) return { error: 'Format tenggat tidak valid.' }
  const [y, mo, d, h, mi] = m.slice(1).map(Number)
  const utc = new Date(Date.UTC(y, mo - 1, d, h - 7, mi))
  if (utc.getTime() < Date.now()) return { error: 'Tenggat harus di masa depan.' }
  return {
    due: {
      year: utc.getUTCFullYear(),
      month: utc.getUTCMonth() + 1,
      day: utc.getUTCDate(),
      hours: utc.getUTCHours(),
      minutes: utc.getUTCMinutes(),
    },
  }
}

/** ISO (UTC) -> "YYYY-MM-DDTHH:mm" dalam WIB, untuk nilai awal <input type="datetime-local"> */
export function toWibInput(iso: string | null): string {
  if (!iso) return ''
  return new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 16)
}
