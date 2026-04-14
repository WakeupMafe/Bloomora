import type { SupabaseClient } from '@supabase/supabase-js'

export type GoalDayMarkRow = {
  goal_id: number
  user_cedula: string
  year_month: string
  day: number
}

export async function fetchMarksByUser(
  sb: SupabaseClient,
  userCedula: string,
): Promise<GoalDayMarkRow[]> {
  const { data, error } = await sb
    .from('goal_day_marks')
    .select('goal_id, user_cedula, year_month, day')
    .eq('user_cedula', userCedula)
  if (error) throw error
  return (data ?? []) as GoalDayMarkRow[]
}

/** goal_id -> { YYYY-MM: [días] } */
export function groupMarksByGoal(
  rows: GoalDayMarkRow[],
): Record<string, Record<string, number[]>> {
  const out: Record<string, Record<string, number[]>> = {}
  for (const r of rows) {
    const gid = String(r.goal_id)
    if (!out[gid]) out[gid] = {}
    const m = out[gid][r.year_month] ?? []
    m.push(r.day)
    out[gid][r.year_month] = [...new Set(m)].sort((a, b) => a - b)
  }
  return out
}

export async function toggleGoalDayMark(
  sb: SupabaseClient,
  params: {
    goalId: number
    userCedula: string
    yearMonth: string
    day: number
  },
): Promise<'added' | 'removed'> {
  const { goalId, userCedula, yearMonth, day } = params
  const { data: goalRow, error: goalErr } = await sb
    .from('goals')
    .select('id, start_date, created_at, target_value, goal_type, unit')
    .eq('id', goalId)
    .eq('user_cedula', userCedula)
    .maybeSingle()
  if (goalErr) throw goalErr
  if (!goalRow) throw new Error('Meta no encontrada para esta cédula.')

  const { data: existing, error: selErr } = await sb
    .from('goal_day_marks')
    .select('goal_id')
    .eq('goal_id', goalId)
    .eq('user_cedula', userCedula)
    .eq('year_month', yearMonth)
    .eq('day', day)
    .maybeSingle()
  if (selErr) throw selErr

  if (existing) {
    const { error } = await sb
      .from('goal_day_marks')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_cedula', userCedula)
      .eq('year_month', yearMonth)
      .eq('day', day)
    if (error) throw error
    await syncGoalProgressFromMarks(sb, goalId, userCedula, goalRow as GoalForSync)
    return 'removed'
  }

  const markedDate = toMarkedDate(yearMonth, day)
  if (!markedDate) throw new Error('Fecha inválida para el día marcado.')
  const minAllowed = toStartDate(goalRow.start_date, goalRow.created_at)
  if (markedDate < minAllowed) {
    throw new Error('No puedes marcar días anteriores a la fecha de creación de la meta.')
  }

  const { error } = await sb.from('goal_day_marks').insert({
    goal_id: goalId,
    user_cedula: userCedula,
    year_month: yearMonth,
    day,
  })
  if (error) throw error
  await syncGoalProgressFromMarks(sb, goalId, userCedula, goalRow as GoalForSync)
  return 'added'
}

export async function ensureGoalDayMark(
  sb: SupabaseClient,
  params: {
    goalId: number
    userCedula: string
    yearMonth: string
    day: number
  },
): Promise<'added' | 'existing'> {
  const { goalId, userCedula, yearMonth, day } = params
  const { data: goalRow, error: goalErr } = await sb
    .from('goals')
    .select('id, start_date, created_at, target_value, goal_type, unit')
    .eq('id', goalId)
    .eq('user_cedula', userCedula)
    .maybeSingle()
  if (goalErr) throw goalErr
  if (!goalRow) throw new Error('Meta no encontrada para esta cédula.')

  const markedDate = toMarkedDate(yearMonth, day)
  if (!markedDate) throw new Error('Fecha inválida para el día marcado.')
  const minAllowed = toStartDate(goalRow.start_date, goalRow.created_at)
  if (markedDate < minAllowed) {
    throw new Error('No puedes marcar días anteriores a la fecha de creación de la meta.')
  }

  const { data: existing, error: selErr } = await sb
    .from('goal_day_marks')
    .select('goal_id')
    .eq('goal_id', goalId)
    .eq('user_cedula', userCedula)
    .eq('year_month', yearMonth)
    .eq('day', day)
    .maybeSingle()
  if (selErr) throw selErr

  if (!existing) {
    const { error: insErr } = await sb.from('goal_day_marks').insert({
      goal_id: goalId,
      user_cedula: userCedula,
      year_month: yearMonth,
      day,
    })
    if (insErr) throw insErr
  }

  await syncGoalProgressFromMarks(sb, goalId, userCedula, goalRow as GoalForSync)
  return existing ? 'existing' : 'added'
}

type GoalForSync = {
  id: number
  start_date: string | null
  created_at: string
  target_value: number | null
  goal_type: string
  unit: string | null
}

function toMarkedDate(yearMonth: string, day: number): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(yearMonth)
  if (!m || day < 1 || day > 31) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  const d = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function toStartDate(startDate: string | null, createdAt: string): Date {
  const src = startDate && startDate.trim() ? `${startDate}T12:00:00` : createdAt
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
}

async function syncGoalProgressFromMarks(
  sb: SupabaseClient,
  goalId: number,
  userCedula: string,
  goal: GoalForSync,
) {
  const { count, error: countErr } = await sb
    .from('goal_day_marks')
    .select('goal_id', { count: 'exact', head: true })
    .eq('goal_id', goalId)
    .eq('user_cedula', userCedula)
  if (countErr) throw countErr

  const progreso = count ?? 0
  const objetivoRaw = goal.target_value != null ? Number(goal.target_value) : null
  const objetivo = objetivoRaw && objetivoRaw > 0 ? objetivoRaw : goal.goal_type === 'habit' ? 30 : 100
  const percentDisplay = objetivo > 0 ? Math.min(100, Math.round((progreso / objetivo) * 100)) : 0
  const unit = goal.unit?.trim() || 'dias'
  const progressLabel = `${progreso} / ${objetivo} ${unit}`

  const { error: updErr } = await sb
    .from('goals')
    .update({
      current_value: progreso,
      percent_display: percentDisplay,
      progress_label: progressLabel,
    })
    .eq('id', goalId)
    .eq('user_cedula', userCedula)
  if (updErr) {
    // Fallback si columnas UI opcionales aún no existen en alguna base.
    const { error: fallbackErr } = await sb
      .from('goals')
      .update({
        current_value: progreso,
      })
      .eq('id', goalId)
      .eq('user_cedula', userCedula)
    if (fallbackErr) throw fallbackErr
  }
}
