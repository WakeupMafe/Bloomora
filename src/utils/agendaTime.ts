/** Minutos desde medianoche (0–1439) según reloj local del dispositivo. */
export function minutesSinceMidnightLocal(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

export function formatMinutes12h(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const mi = m % 60
  const isPm = h24 >= 12
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mm = String(mi).padStart(2, '0')
  return `${h12}:${mm} ${isPm ? 'PM' : 'AM'}`
}

export function minutesFromTimeInput(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

/** Valor para `<input type="time" />` (24h). */
export function toTimeInputValue(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mi = m % 60
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
}

export function toDateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addLocalDays(d: Date, delta: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + delta)
  return startOfLocalDay(x)
}

/**
 * Duración del bloque agenda en segundos (inicio → fin en minutos desde medianoche).
 * Si el fin no es posterior al inicio, se asume bloque que cruza medianoche.
 */
export function blockDurationSeconds(startMin: number, endMin: number): number {
  let spanMin = endMin - startMin
  if (spanMin <= 0) spanMin += 24 * 60
  return Math.max(60, spanMin * 60)
}

export function titleCaseAgendaDate(d: Date): string {
  const raw = d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return raw
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
