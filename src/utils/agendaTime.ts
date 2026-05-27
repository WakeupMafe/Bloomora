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

/**
 * Cabecera de agenda: «Miércoles, 15 Abril» (día de la semana, número y mes; sin año).
 */
export function titleCaseAgendaDate(d: Date): string {
  const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(d)
  const month = new Intl.DateTimeFormat('es', { month: 'long' }).format(d)
  const day = d.getDate()
  const w = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const m = month.charAt(0).toUpperCase() + month.slice(1)
  return `${w}, ${day} ${m}`
}

/** `YYYY-MM` según calendario local del dispositivo. */
export function toYearMonthLocal(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${mo}`
}

/** Mes anterior en formato `YYYY-MM` (calendario local). */
export function previousYearMonthLocal(d = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return toYearMonthLocal(prev)
}

/** Primer y último día de un mes `YYYY-MM` (inclusive, formato `YYYY-MM-DD`). */
export function yearMonthDateBounds(yearMonth: string): {
  start: string
  end: string
} {
  const [y, m] = yearMonth.split('-').map(Number)
  const start = `${yearMonth}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

/** Nombre del mes en español para `YYYY-MM` (ej. «abril»). */
export function formatYearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('es', { month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Suma días a una clave `YYYY-MM-DD` (calendario local). */
export function addDaysToDateKey(dateKey: string, delta: number): string {
  const [y, mo, d] = dateKey.split('-').map(Number)
  const next = new Date(y, mo - 1, d)
  next.setDate(next.getDate() + delta)
  return toDateKeyLocal(next)
}
