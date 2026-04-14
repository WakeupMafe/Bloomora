/** Wall-clock helpers for agenda blocks stored as timestamptz (America/Bogota, UTC−5). */

export function bogotaWallToIso(
  planDate: string,
  minutesFromMidnight: number,
): string {
  const h = Math.floor(minutesFromMidnight / 60)
  const m = minutesFromMidnight % 60
  return `${planDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-05:00`
}

export function isoToMinutesBogota(iso: string): number {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}
