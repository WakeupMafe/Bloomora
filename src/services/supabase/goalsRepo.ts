import type { SupabaseClient } from '@supabase/supabase-js'
import { getDefaultTrackerColorId } from '@/features/goals/trackerColorPalette'

/** Fila `goals` (modelo Supabase) + columnas UI opcionales tras migración. */
export type GoalDbRow = {
  id: number
  user_cedula: string
  category_id: number | null
  title: string
  description: string | null
  status: string
  goal_type: string
  target_value: number | null
  current_value: number
  unit: string | null
  frequency: string | null
  start_date: string | null
  end_date: string | null
  color: string | null
  icon: string | null
  auto_match_enabled: boolean
  created_at: string
  updated_at: string
  accent?: string | null
  variant?: string | null
  progress_label?: string | null
  percent_display?: number | null
  tracker_color_id?: string | null
  sort_order?: number | null
  categoria?: string | null
  prioridad?: string | null
}

const SEED_GOALS = [
  {
    title: 'Estudiar Inglés',
    accent: 'lavender',
    variant: 'bar',
    progress_label: null as string | null,
    percent_display: 45,
    sort_order: 0,
    goal_type: 'target',
    target_value: 100,
    current_value: 45,
  },
  {
    title: 'Hacer Ejercicio',
    accent: 'green',
    variant: 'days',
    progress_label: '3 / 5 días',
    percent_display: 60,
    sort_order: 1,
    goal_type: 'habit',
    target_value: null,
    current_value: 0,
  },
  {
    title: 'Leer un Libro',
    accent: 'sky',
    variant: 'pages',
    progress_label: '120 / 200 páginas',
    percent_display: 60,
    sort_order: 2,
    goal_type: 'target',
    target_value: 200,
    current_value: 120,
  },
] as const

export async function listGoals(
  sb: SupabaseClient,
  userCedula: string,
): Promise<GoalDbRow[]> {
  const { data, error } = await sb
    .from('goals')
    .select('*')
    .eq('user_cedula', userCedula)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as GoalDbRow[]
}

export async function ensureDefaultGoals(
  sb: SupabaseClient,
  userCedula: string,
): Promise<void> {
  const existing = await listGoals(sb, userCedula)
  if (existing.length > 0) return

  const rows = SEED_GOALS.map((g) => ({
    user_cedula: userCedula,
    title: g.title,
    description: null,
    status: 'active',
    goal_type: g.goal_type,
    target_value: g.target_value,
    current_value: g.current_value,
    unit: g.variant === 'pages' ? 'páginas' : null,
    frequency: g.variant === 'days' ? 'weekly' : null,
    accent: g.accent,
    variant: g.variant,
    progress_label: g.progress_label,
    percent_display: g.percent_display,
    sort_order: g.sort_order,
    tracker_color_id: getDefaultTrackerColorId(
      g.accent as 'lavender' | 'green' | 'sky',
    ),
    auto_match_enabled: true,
  }))
  const { error } = await sb.from('goals').insert(rows)
  if (error) throw error
}

export async function deleteGoal(sb: SupabaseClient, goalId: number) {
  const { error } = await sb.from('goals').delete().eq('id', goalId)
  if (error) throw error
}

export async function deleteGoalsByCedula(
  sb: SupabaseClient,
  userCedula: string,
) {
  const { error } = await sb.from('goals').delete().eq('user_cedula', userCedula)
  if (error) throw error
}

export async function updateGoalTrackerColor(
  sb: SupabaseClient,
  goalId: number,
  trackerColorId: string,
) {
  const { error } = await sb
    .from('goals')
    .update({ tracker_color_id: trackerColorId })
    .eq('id', goalId)
  if (error) throw error
}

export async function insertGoal(
  sb: SupabaseClient,
  userCedula: string,
  fields: {
    title: string
    accent?: string
    variant?: string
    progress_label?: string | null
    percent_display?: number
    tracker_color_id?: string | null
    goal_type?: string
    target_value?: number | null
    current_value?: number
    unit?: string | null
    frequency?: string | null
  },
): Promise<number> {
  const accent = (fields.accent ?? 'lavender') as 'lavender' | 'green' | 'sky'
  const variant = fields.variant ?? 'bar'
  const trackerId =
    fields.tracker_color_id ?? getDefaultTrackerColorId(accent)
  const pct = fields.percent_display ?? 0
  let goalType = 'target'
  let targetValue: number | null = null
  let currentValue = 0
  let unit: string | null = null
  if (variant === 'bar') {
    goalType = 'target'
    targetValue = 100
    currentValue = Math.round((pct / 100) * 100)
  } else if (variant === 'pages') {
    goalType = 'target'
    targetValue = 200
    unit = 'páginas'
    currentValue = Math.round((pct / 100) * 200)
  } else {
    goalType = 'habit'
    targetValue = null
    currentValue = 0
  }
  if (fields.goal_type) goalType = fields.goal_type
  if (fields.target_value !== undefined) targetValue = fields.target_value
  if (fields.current_value !== undefined) currentValue = fields.current_value
  if (fields.unit !== undefined) unit = fields.unit

  const { data, error } = await sb
    .from('goals')
    .insert({
      user_cedula: userCedula,
      title: fields.title.trim(),
      description: null,
      status: 'active',
      goal_type: goalType,
      target_value: targetValue,
      current_value: currentValue,
      unit,
      frequency: fields.frequency ?? null,
      accent,
      variant,
      progress_label: fields.progress_label ?? null,
      percent_display: pct,
      tracker_color_id: trackerId,
      auto_match_enabled: true,
    })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: number }).id
}

export async function updateGoalFields(
  sb: SupabaseClient,
  goalId: number,
  patch: Partial<
    Pick<
      GoalDbRow,
      | 'title'
      | 'accent'
      | 'variant'
      | 'progress_label'
      | 'percent_display'
      | 'tracker_color_id'
    >
  >,
) {
  const { error } = await sb.from('goals').update(patch).eq('id', goalId)
  if (error) throw error
}
